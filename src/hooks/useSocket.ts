import { ClientToServerEvents, ServerToClientEvents } from "@/lib/socket";
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
  revoked?: boolean; // Added revoked property
}

export interface MessageAck {
  messageId: string;
  status: "sent" | "delivered" | "read";
  timestamp: number;
}

export interface TypingStatus {
  from: string;
  status: string;
  timestamp: number;
}

export interface RevokedMessage {
  messageId: string;
  from: string;
  timestamp: number;
}

export interface PresenceUpdate {
  id: string;
  lastSeen: number | null;
  isOnline: boolean;
  timestamp: number;
}

export interface SocketState {
  isConnected: boolean;
  connectionError: string | null;
  sessions: WhatsAppSessionSocket[];
  messages: IncomingMessage[];
  messageAcks: MessageAck[];
  typingStatus: TypingStatus[];
  revokedMessages: RevokedMessage[];
  presenceUpdates: PresenceUpdate[];
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
    markMessageAsRead: (
      sessionId: string,
      messageId: string
    ) => Promise<SocketResponse>;
    sendTypingIndicator: (
      sessionId: string,
      to: string
    ) => Promise<SocketResponse>;
    subscribeToPresence: (
      sessionId: string,
      contactId: string
    ) => Promise<SocketResponse>;
  };
}

export const useSocket = (): UseSocketResult => {
  const [state, setState] = useState<SocketState>({
    isConnected: false,
    connectionError: null,
    sessions: [],
    messages: [],
    messageAcks: [],
    typingStatus: [],
    revokedMessages: [],
    presenceUpdates: [],
  });

  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
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
        connectionError: null,
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
    newSocket.on(
      "session:qr",
      (data: { sessionId: string; qrCode: string }) => {
        console.log("📋 QR received:", data.sessionId);
        setState((prev) => {
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
            sessions: updatedSessions,
          };
        });
      }
    );

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

    newSocket.on("typing:status", (data: any) => {
      console.log("👨‍💻 Typing status:", data.from, data.status);
      setState((prev) => {
        // Remove any existing typing status for this contact and add the new one
        const filteredStatus = prev.typingStatus.filter(
          (status) => status.from !== data.from
        );
        return {
          ...prev,
          typingStatus: [
            ...filteredStatus,
            {
              from: data.from,
              status: data.status,
              timestamp: Date.now(),
            },
          ],
        };
      });

      // Auto-clear typing status after 10 seconds
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          typingStatus: prev.typingStatus.filter(
            (status) =>
              status.from !== data.from || status.timestamp > Date.now() - 10000
          ),
        }));
      }, 10000);
    });

    newSocket.on("message:revoked", (data: any) => {
      console.log("🗑️ Message revoked:", data.messageId, data.from);
      setState((prev) => ({
        ...prev,
        revokedMessages: [
          ...prev.revokedMessages,
          {
            messageId: data.messageId,
            from: data.from,
            timestamp: Date.now(),
          },
        ],
        // Mark the message as revoked in the messages array
        messages: prev.messages.map((msg) =>
          msg.id === data.messageId ? { ...msg, revoked: true } : msg
        ),
      }));
    });

    newSocket.on("presence:update", (data) => {
      console.log(
        "👤 Presence update:",
        data.id,
        data.presence.isOnline ? "online" : "offline"
      );
      setState((prev) => {
        // Update or add the presence information
        const updatedPresence = [
          ...prev.presenceUpdates.filter((p) => p.id !== data.id),
          {
            id: data.id,
            lastSeen: data.presence.lastSeen,
            isOnline: data.presence.isOnline,
            timestamp: Date.now(),
          },
        ];

        return {
          ...prev,
          presenceUpdates: updatedPresence,
        };
      });
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

  // Add the markMessageAsRead function
  const markMessageAsRead = useCallback(
    (sessionId: string, messageId: string): Promise<SocketResponse> => {
      if (!socket) return Promise.reject("Socket not connected");

      return new Promise<SocketResponse>((resolve, reject) => {
        socket.emit(
          "message:read",
          { sessionId, messageId },
          (response: SocketResponse) => {
            if (response.success) {
              resolve(response);
            } else {
              reject(response.error);
            }
          }
        );
      });
    },
    [socket]
  );

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    (sessionId: string, to: string): Promise<SocketResponse> => {
      if (!socket) return Promise.reject("Socket not connected");

      return new Promise<SocketResponse>((resolve, reject) => {
        socket.emit(
          "typing:indicator",
          { sessionId, to },
          (response: SocketResponse) => {
            if (response.success) {
              resolve(response);
            } else {
              reject(response.error);
            }
          }
        );
      });
    },
    [socket]
  );

  // Subscribe to presence updates
  const subscribeToPresence = useCallback(
    (sessionId: string, contactId: string): Promise<SocketResponse> => {
      if (!socket) return Promise.reject("Socket not connected");

      return new Promise<SocketResponse>((resolve, reject) => {
        socket.emit(
          "presence:subscribe",
          { sessionId, contactId },
          (response: SocketResponse) => {
            if (response.success) {
              resolve(response);
            } else {
              reject(response.error);
            }
          }
        );
      });
    },
    [socket]
  );

  return {
    state,
    actions: {
      createSession,
      logoutSession,
      sendMessage,
      getSessionStatus,
      getSessions,
      joinSession,
      markMessageAsRead,
      sendTypingIndicator,
      subscribeToPresence,
    },
  };
};
