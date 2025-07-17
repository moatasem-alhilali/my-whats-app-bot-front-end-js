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

export interface SendMessageRequest {
  to: string;
  message: string;
}

export interface SendMediaRequest {
  to: string;
  file: File;
  caption?: string;
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
