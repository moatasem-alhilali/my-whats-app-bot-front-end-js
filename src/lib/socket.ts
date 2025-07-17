import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export interface ClientInfo {
  pushname: string;
  wid: string;
  platform: string;
}

export interface SocketResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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

export interface WhatsAppSessionSocket {
  id: string;
  status: "initializing" | "qr" | "authenticated" | "ready" | "disconnected";
  qrCode?: string;
  clientInfo?: ClientInfo;
}

// Client to server events
export interface ClientToServerEvents {
  "session:create": (
    data: { sessionId?: string },
    callback: (response: SocketResponse<WhatsAppSessionSocket>) => void
  ) => void;
  "session:status": (
    data: { sessionId: string },
    callback: (response: SocketResponse<WhatsAppSessionSocket>) => void
  ) => void;
  "session:logout": (
    data: { sessionId: string },
    callback: (response: SocketResponse) => void
  ) => void;
  "message:send": (
    data: { sessionId: string; to: string; message: string },
    callback: (response: SocketResponse<{ messageId: string }>) => void
  ) => void;
  "message:read": (
    data: { sessionId: string; messageId: string },
    callback: (response: SocketResponse) => void
  ) => void;
  "typing:indicator": (
    data: { sessionId: string; to: string },
    callback: (response: SocketResponse) => void
  ) => void;
  "presence:subscribe": (
    data: { sessionId: string; contactId: string },
    callback: (response: SocketResponse) => void
  ) => void;
  "sessions:list": (
    callback: (response: SocketResponse<WhatsAppSessionSocket[]>) => void
  ) => void;
  join: (
    data: { sessionId: string },
    callback: (response: SocketResponse) => void
  ) => void;
}

// Server to client events
export interface ServerToClientEvents {
  "session:qr": (data: { sessionId: string; qrCode: string }) => void;
  "session:authenticated": (data: { sessionId: string }) => void;
  "session:ready": (data: {
    sessionId: string;
    clientInfo: ClientInfo;
  }) => void;
  "session:disconnected": (data: {
    sessionId: string;
    reason?: string;
  }) => void;
  "message:received": (data: {
    sessionId: string;
    message: IncomingMessage;
  }) => void;
  "message:sent": (data: {
    sessionId: string;
    messageId: string;
    to: string;
    message: string;
  }) => void;
  "message:ack": (data: {
    sessionId: string;
    messageId: string;
    ack: number;
    status: string;
  }) => void;
  "typing:status": (data: {
    sessionId: string;
    from: string;
    status: string;
  }) => void;
  "message:revoked": (data: {
    sessionId: string;
    messageId: string;
    from: string;
  }) => void;
  "presence:update": (data: {
    sessionId: string;
    id: string;
    presence: {
      id: string;
      lastSeen: number | null;
      isOnline: boolean;
      isUser: boolean;
    };
  }) => void;
  error: (data: { message: string; code?: string }) => void;
}

type EventListener = (...args: unknown[]) => void;

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;
  private eventListeners: Map<string, Set<EventListener>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket(): void {
    console.log("🔌 Initializing WebSocket connection to:", SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ WebSocket connected:", this.socket?.id);
      this.reconnectAttempts = 0;
      this.emit("connection:status", { connected: true });
    });

    this.socket.on("disconnect", (reason) => {
      console.log("💔 WebSocket disconnected:", reason);
      this.emit("connection:status", { connected: false, reason });
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
      this.emit("connection:error", { error: error.message });
    });

    // Forward all server events to registered listeners
    this.socket.on("session:qr", (data) => {
      console.log("📋 QR Code received for session:", data.sessionId);
      this.emit("session:qr", data);
    });

    this.socket.on("session:authenticated", (data) => {
      console.log("✅ Session authenticated:", data.sessionId);
      this.emit("session:authenticated", data);
    });

    this.socket.on("session:ready", (data) => {
      console.log("🚀 Session ready:", data.sessionId);
      this.emit("session:ready", data);
    });

    this.socket.on("session:disconnected", (data) => {
      console.log("💔 Session disconnected:", data.sessionId, data.reason);
      this.emit("session:disconnected", data);
    });

    this.socket.on("message:received", (data) => {
      console.log("📨 Message received:", data.sessionId);
      this.emit("message:received", data);
    });

    this.socket.on("message:sent", (data) => {
      console.log("📤 Message sent:", data.sessionId, data.messageId);
      this.emit("message:sent", data);
    });

    this.socket.on("message:ack", (data) => {
      console.log(
        "✓ Message acknowledgment:",
        data.sessionId,
        data.messageId,
        data.ack,
        data.status
      );
      this.emit("message:ack", data);
    });

    this.socket.on("typing:status", (data) => {
      console.log("👨‍💻 Typing status:", data.sessionId, data.from, data.status);
      this.emit("typing:status", data);
    });

    this.socket.on("message:revoked", (data) => {
      console.log(
        "🗑️ Message revoked:",
        data.sessionId,
        data.messageId,
        data.from
      );
      this.emit("message:revoked", data);
    });

    this.socket.on("presence:update", (data) => {
      console.log(
        "👤 Presence update:",
        data.sessionId,
        data.id,
        data.presence.isOnline ? "online" : "offline"
      );
      this.emit("presence:update", data);
    });

    this.socket.on("error", (data) => {
      console.error("❌ Error:", data.message);
      this.emit("error", data);
    });
  }

  // Event emitter functionality for internal events
  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener(data));
    }
  }

  public on(event: string, listener: EventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  public off(event: string, listener: EventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // Connection management
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  public reconnect(): void {
    if (this.socket) {
      this.socket.connect();
    }
  }

  // Session management methods
  public async createSession(
    sessionId?: string
  ): Promise<SocketResponse<WhatsAppSessionSocket>> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: "Socket not connected" });
        return;
      }

      this.socket.emit("session:create", { sessionId }, resolve);
    });
  }

  public async getSessionStatus(
    sessionId: string
  ): Promise<SocketResponse<WhatsAppSessionSocket>> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: "Socket not connected" });
        return;
      }

      this.socket.emit("session:status", { sessionId }, resolve);
    });
  }

  public async getAllSessions(): Promise<
    SocketResponse<WhatsAppSessionSocket[]>
  > {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: "Socket not connected" });
        return;
      }

      this.socket.emit("sessions:list", resolve);
    });
  }

  public async logoutSession(sessionId: string): Promise<SocketResponse> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: "Socket not connected" });
        return;
      }

      this.socket.emit("session:logout", { sessionId }, resolve);
    });
  }

  // Message methods
  public async sendMessage(
    sessionId: string,
    to: string,
    message: string
  ): Promise<SocketResponse<{ messageId: string }>> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: "Socket not connected" });
        return;
      }

      this.socket.emit("message:send", { sessionId, to, message }, resolve);
    });
  }

  // Utility methods
  public getSocketId(): string | undefined {
    return this.socket?.id;
  }

  public getTransport(): string | undefined {
    return this.socket?.io.engine.transport.name;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
