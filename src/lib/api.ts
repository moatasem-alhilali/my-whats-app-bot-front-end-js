import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WhatsAppSession {
  id: string;
  status: "initializing" | "qr" | "authenticated" | "ready" | "disconnected";
  qrCode?: string;
  clientInfo?: {
    pushname: string;
    wid: string;
    platform: string;
  };
}

// Anti-ban related interfaces
export interface AntiBanOptions {
  personalizeWith?: Record<string, string>;
  variations?: string[];
  priority?: "high" | "normal" | "low";
  useQueue?: boolean;
  delay?: number;
  enableHumanBehavior?: boolean;
}

export interface SendMessageRequest {
  to: string;
  message: string;
  antiBanOptions?: AntiBanOptions;
}

export interface SendMediaRequest {
  to: string;
  file: File;
  caption?: string;
  antiBanOptions?: AntiBanOptions;
}

export interface MessageStats {
  messagesSent: number;
  messagesReceived: number;
  newContacts: number;
  lastMessageTime?: string;
  dailyLimit: number;
  contactLimit: number;
  limitResetTime: string;
}

export interface UserGuidance {
  level: "info" | "warning" | "danger" | "critical";
  title: string;
  message: string;
  recommendations: string[];
  canSendMessages: boolean;
  nextAction?: string;
}

export interface EnhancedSessionHealth {
  sessionId: string;
  status: "healthy" | "warning" | "banned" | "disconnected";
  lastActivity: string;
  warningCount: number;
  banDetected: boolean;
  lastWarning?: string;
  lastBan?: string;
  suspiciousEvents: Array<{
    type:
      | "rate_limit"
      | "auth_failure"
      | "ban_keyword"
      | "connection_issue"
      | "unusual_pattern";
    severity: "low" | "medium" | "high" | "critical";
    details: string;
    timestamp: string;
  }>;
  autoStopped: boolean;
  userGuidance: UserGuidance;
  riskLevel: "low" | "medium" | "high" | "critical";
  protectionActive: boolean;
}

export interface SessionStats {
  sessionId: string;
  status: string;
  messageStats: MessageStats;
  queueStats: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  sessionHealth: EnhancedSessionHealth;
  antiBanStatus?: {
    enabled: boolean;
    warningsDetected: number;
    lastWarningTime?: string;
    healthScore: number;
  };
}

export interface QueueStatus {
  isActive: boolean;
  isPaused: boolean;
  totalMessages: number;
  pendingMessages: number;
  processingMessages: number;
  completedMessages: number;
  failedMessages: number;
  avgProcessingTime: number;
  estimatedCompletion?: string;
}

export interface QueueMessage {
  id: string;
  sessionId: string;
  to: string;
  message: string;
  priority: "high" | "normal" | "low";
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  createdAt: string;
  scheduledFor?: string;
  processedAt?: string;
  error?: string;
}

export const whatsappApi = {
  // Session management
  async createSession(
    sessionId?: string
  ): Promise<ApiResponse<WhatsAppSession>> {
    const response = await api.post("/sessions", { sessionId });
    return response.data;
  },

  async getAllSessions(): Promise<ApiResponse<WhatsAppSession[]>> {
    const response = await api.get("/sessions");
    return response.data;
  },

  async getSessionStatus(
    sessionId: string
  ): Promise<ApiResponse<WhatsAppSession>> {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },

  async refreshQRCode(sessionId: string): Promise<ApiResponse<void>> {
    const response = await api.post(`/sessions/${sessionId}/refresh-qr`);
    return response.data;
  },

  async logout(sessionId: string): Promise<ApiResponse> {
    const response = await api.post(`/sessions/${sessionId}/logout`);
    return response.data;
  },

  async destroySession(sessionId: string): Promise<ApiResponse> {
    const response = await api.delete(`/sessions/${sessionId}`);
    return response.data;
  },

  // Messaging
  async sendTextMessage(
    sessionId: string,
    data: SendMessageRequest
  ): Promise<ApiResponse<{ messageId: string }>> {
    const response = await api.post(`/sessions/${sessionId}/send-text`, data);
    return response.data;
  },

  async sendMediaMessage(
    sessionId: string,
    data: SendMediaRequest
  ): Promise<ApiResponse<{ messageId: string }>> {
    const formData = new FormData();
    formData.append("to", data.to);
    formData.append("file", data.file);
    if (data.caption) {
      formData.append("caption", data.caption);
    }

    // Add anti-ban options if provided
    if (data.antiBanOptions) {
      formData.append("antiBanOptions", JSON.stringify(data.antiBanOptions));
    }

    const response = await api.post(
      `/sessions/${sessionId}/send-media`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Anti-ban Statistics and Management
  async getSessionStats(sessionId: string): Promise<ApiResponse<SessionStats>> {
    const response = await api.get(`/sessions/${sessionId}/stats`);
    return response.data;
  },

  async getSessionGuidance(
    sessionId: string
  ): Promise<ApiResponse<UserGuidance>> {
    const response = await api.get(`/sessions/${sessionId}/guidance`);
    return response.data;
  },

  async getQueueStatus(): Promise<ApiResponse<QueueStatus>> {
    const response = await api.get("/queue/status");
    return response.data;
  },

  async pauseQueue(): Promise<ApiResponse> {
    const response = await api.post("/queue/pause");
    return response.data;
  },

  async resumeQueue(): Promise<ApiResponse> {
    const response = await api.post("/queue/resume");
    return response.data;
  },

  async getQueueMessages(
    page = 1,
    limit = 20,
    status?: string
  ): Promise<
    ApiResponse<{ messages: QueueMessage[]; total: number; totalPages: number }>
  > {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) {
      params.append("status", status);
    }
    const response = await api.get(`/queue/messages?${params}`);
    return response.data;
  },

  async retryQueueMessage(messageId: string): Promise<ApiResponse> {
    const response = await api.post(`/queue/messages/${messageId}/retry`);
    return response.data;
  },

  async cancelQueueMessage(messageId: string): Promise<ApiResponse> {
    const response = await api.delete(`/queue/messages/${messageId}`);
    return response.data;
  },

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    const response = await api.get("/health");
    return response.data;
  },
};

// Error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error || error.message || "Unknown error occurred";
    console.error("API Error:", message);
    return Promise.reject(new Error(message));
  }
);
