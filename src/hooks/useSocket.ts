import { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

// Simple types for the WebSocket functionality
export interface SocketResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WhatsAppSessionSocket {
  id: string;
  status: "initializing" | "qr" | "authenticated" | "ready" | "disconnected";
  qrCode?: string;
  clientInfo?: {
    pushname: string;
    wid: string;
    platform: string;
  };
}

export interface IncomingMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  type: string;
  timestamp: number;
  hasMedia: boolean;
  isGroupMsg: boolean;
  author?: string;
  mentionedIds?: string[];
}

export interface MessageAck {
  messageId: string;
  status: "sent" | "delivered" | "read";
  timestamp: number;
}

export interface SocketState {
  isConnected: boolean;
  connectionError?: string;
  sessions: WhatsAppSessionSocket[];
  messages: IncomingMessage[];
  messageAcks: MessageAck[];
  qrCodes: Map<string, string>;
}

export interface UseSocketResult {
  state: SocketState;
  actions: {
    createSession: (
      sessionId?: string
    ) => Promise<SocketResponse<WhatsAppSessionSocket>>;
    logoutSession: (sessionId: string) => Promise<SocketResponse>;
    sendMessage: (
      sessionId: string,
      to: string,
      message: string
    ) => Promise<SocketResponse<{ messageId: string }>>;
    getSessionStatus: (
      sessionId: string
    ) => Promise<SocketResponse<WhatsAppSessionSocket>>;
    getSessions: () => Promise<SocketResponse<WhatsAppSessionSocket[]>>;
    joinSession: (sessionId: string) => void;
  };
}

export const useSocket = (): UseSocketResult => {
  const [state, setState] = useState<SocketState>({
    isConnected: false,
    sessions: [],
    messages: [],
    messageAcks: [],
    qrCodes: new Map(),
  });

  const [socket, setSocket] = useState<Socket | null>(null);
  const [joinedSessions, setJoinedSessions] = useState<Set<string>>(new Set());

  // Initialize socket connection and event listeners
  useEffect(() => {
    console.log("🔌 useSocket: Initializing socket connection...");

    const newSocket = io("http://localhost:3001", {
      transports: ["websocket", "polling"],
      reconnection: true,
      timeout: 20000,
    });

    newSocket.on("connect", () => {
      console.log("✅ WebSocket connected:", newSocket.id);
      setState((prev) => ({
        ...prev,
        isConnected: true,
        connectionError: undefined,
      }));
    });

    newSocket.on("disconnect", (reason) => {
      console.log("💔 WebSocket disconnected:", reason);
      setState((prev) => ({
        ...prev,
        isConnected: false,
      }));
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
      setState((prev) => ({
        ...prev,
        connectionError: error.message,
        isConnected: false,
      }));
    });

    // Set up session event listeners
    newSocket.on("session:qr", (data: any) => {
      console.log("📋 QR received:", data.sessionId);
      setState((prev) => {
        const newQrCodes = new Map(prev.qrCodes);
        newQrCodes.set(data.sessionId, data.qrCode);

        const updatedSessions = prev.sessions.map((session) =>
          session.id === data.sessionId
            ? { ...session, status: "qr" as const, qrCode: data.qrCode }
            : session
        );

        // Add session if it doesn't exist
        if (!updatedSessions.find((s) => s.id === data.sessionId)) {
          updatedSessions.push({
            id: data.sessionId,
            status: "qr",
            qrCode: data.qrCode,
          });
        }

        return {
          ...prev,
          qrCodes: newQrCodes,
          sessions: updatedSessions,
        };
      });
    });

    newSocket.on("session:authenticated", (data: any) => {
      console.log("✅ Session authenticated:", data.sessionId);
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((session) =>
          session.id === data.sessionId
            ? { ...session, status: "authenticated" as const }
            : session
        ),
      }));
    });

    newSocket.on("session:ready", (data: any) => {
      console.log("🚀 Session ready:", data.sessionId);
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((session) =>
          session.id === data.sessionId
            ? {
                ...session,
                status: "ready" as const,
                clientInfo: data.clientInfo,
              }
            : session
        ),
      }));
    });

    newSocket.on("session:disconnected", (data: any) => {
      console.log("💔 Session disconnected:", data.sessionId);
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((session) =>
          session.id === data.sessionId
            ? { ...session, status: "disconnected" as const }
            : session
        ),
      }));
    });

    newSocket.on("message:received", (data: any) => {
      console.log("📨 Message received:", data.sessionId, data.message);
      if (data.message) {
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, data.message],
        }));
      }
    });

    newSocket.on("message:sent", (data: any) => {
      console.log("📤 Message sent:", data.messageId);
      setState((prev) => ({
        ...prev,
        messageAcks: [
          ...prev.messageAcks,
          {
            messageId: data.messageId,
            status: "sent",
            timestamp: Date.now(),
          },
        ],
      }));
    });

    newSocket.on("message:ack", (data: any) => {
      console.log("✓ Message ack:", data.messageId, data.status);
      setState((prev) => ({
        ...prev,
        messageAcks: prev.messageAcks.map((ack) =>
          ack.messageId === data.messageId
            ? {
                ...ack,
                status: data.status as "sent" | "delivered" | "read",
                timestamp: Date.now(),
              }
            : ack
        ),
      }));
    });

    setSocket(newSocket);

    // Load existing sessions on mount
    const loadSessions = async () => {
      try {
        console.log("📋 Loading existing sessions...");
        newSocket.emit("sessions:list", (response: any) => {
          console.log("📋 Sessions response:", response);
          if (response.success && response.data) {
            setState((prev) => ({
              ...prev,
              sessions: response.data || [],
            }));

            // Join rooms for all active sessions
            response.data.forEach((session: WhatsAppSessionSocket) => {
              joinSessionRoom(newSocket, session.id);
            });
          }
        });
      } catch (error) {
        console.error("❌ Failed to load sessions:", error);
      }
    };

    // Load sessions after connection
    newSocket.on("connect", () => {
      setTimeout(loadSessions, 1000); // Wait a bit after connection
    });

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up socket...");
      newSocket.disconnect();
    };
  }, []);

  // Helper function to join a session room
  const joinSessionRoom = (socketInstance: Socket, sessionId: string) => {
    console.log(`🔄 Joining session room: session:${sessionId}`);
    socketInstance.emit("join", { sessionId }, (response: any) => {
      if (response && response.success) {
        console.log(`✅ Joined session room: ${sessionId}`);
        setJoinedSessions((prev) => new Set([...prev, sessionId]));
      } else {
        console.error(
          `❌ Failed to join session room: ${sessionId}`,
          response?.error
        );
      }
    });
  };

  // Public method to join a session
  const joinSession = useCallback(
    (sessionId: string) => {
      if (!socket || !state.isConnected) {
        console.error("Cannot join session: Socket not connected");
        return;
      }

      if (!joinedSessions.has(sessionId)) {
        joinSessionRoom(socket, sessionId);
      }
    },
    [socket, state.isConnected, joinedSessions]
  );

  // Actions using direct socket emissions
  const createSession = useCallback(
    async (
      sessionId?: string
    ): Promise<SocketResponse<WhatsAppSessionSocket>> => {
      return new Promise((resolve) => {
        if (!socket || !state.isConnected) {
          resolve({ success: false, error: "Socket not connected" });
          return;
        }

        console.log("🔄 Creating session:", sessionId);
        socket.emit("session:create", { sessionId }, (response: any) => {
          console.log("📋 Session creation response:", response);

          // Automatically join the session room when creating a session
          if (response.success && response.data?.id) {
            joinSessionRoom(socket, response.data.id);
          }

          resolve(response);
        });
      });
    },
    [socket, state.isConnected]
  );

  const logoutSession = useCallback(
    async (sessionId: string): Promise<SocketResponse> => {
      return new Promise((resolve) => {
        if (!socket || !state.isConnected) {
          resolve({ success: false, error: "Socket not connected" });
          return;
        }

        console.log("🚪 Logging out session:", sessionId);
        socket.emit("session:logout", { sessionId }, (response: any) => {
          resolve(response);
        });
      });
    },
    [socket, state.isConnected]
  );

  const sendMessage = useCallback(
    async (
      sessionId: string,
      to: string,
      message: string
    ): Promise<SocketResponse<{ messageId: string }>> => {
      return new Promise((resolve) => {
        if (!socket || !state.isConnected) {
          console.error("Cannot send message: Socket not connected");
          resolve({ success: false, error: "Socket not connected" });
          return;
        }

        // Make sure we've joined the session room before sending messages
        if (!joinedSessions.has(sessionId)) {
          console.log(`Not in session room ${sessionId}, joining now...`);
          joinSessionRoom(socket, sessionId);
          // Wait a bit for the join to complete
          setTimeout(() => {
            sendMessageToSocket();
          }, 500);
        } else {
          sendMessageToSocket();
        }

        function sendMessageToSocket() {
          console.log("💬 Sending message via socket:", {
            sessionId,
            to,
            messageLength: message.length,
          });

          try {
            if (!socket) return;
            socket.emit(
              "message:send",
              { sessionId, to, message },
              (response: any) => {
                console.log("📨 Message send response:", response);

                // Ensure we have a properly formatted response
                if (!response) {
                  resolve({
                    success: false,
                    error: "No response from server",
                  });
                  return;
                }

                // Handle successful response
                if (response.success && response.messageId) {
                  resolve({
                    success: true,
                    data: { messageId: response.messageId },
                  });
                } else if (response.success && response.data?.messageId) {
                  resolve({
                    success: true,
                    data: { messageId: response.data.messageId },
                  });
                } else {
                  // Handle error response
                  resolve({
                    success: false,
                    error: response.error || "Failed to send message",
                  });
                }
              }
            );
          } catch (error) {
            console.error("Error emitting message:send event:", error);
            resolve({
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error sending message",
            });
          }
        }
      });
    },
    [socket, state.isConnected, joinedSessions]
  );

  const getSessionStatus = useCallback(
    async (
      sessionId: string
    ): Promise<SocketResponse<WhatsAppSessionSocket>> => {
      return new Promise((resolve) => {
        if (!socket || !state.isConnected) {
          resolve({ success: false, error: "Socket not connected" });
          return;
        }

        console.log("📊 Getting session status:", sessionId);
        socket.emit("session:status", { sessionId }, (response: any) => {
          resolve(response);
        });
      });
    },
    [socket, state.isConnected]
  );

  const getSessions = useCallback(async (): Promise<
    SocketResponse<WhatsAppSessionSocket[]>
  > => {
    return new Promise((resolve) => {
      if (!socket || !state.isConnected) {
        resolve({ success: false, error: "Socket not connected" });
        return;
      }

      console.log("📋 Getting all sessions");
      socket.emit("sessions:list", (response: any) => {
        resolve(response);
      });
    });
  }, [socket, state.isConnected]);

  return {
    state,
    actions: {
      createSession,
      logoutSession,
      sendMessage,
      getSessionStatus,
      getSessions,
      joinSession,
    },
  };
};
