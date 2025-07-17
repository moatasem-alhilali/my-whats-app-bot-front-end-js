"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
import QRCode from "qrcode";
import React, { useEffect, useState } from "react";

// Types (duplicated here to avoid import issues during development)
interface WhatsAppSessionSocket {
  id: string;
  status: "initializing" | "qr" | "authenticated" | "ready" | "disconnected";
  qrCode?: string;
  clientInfo?: {
    pushname: string;
    wid: string;
    platform: string;
  };
}

interface IncomingMessage {
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

interface SocketState {
  isConnected: boolean;
  connectionError?: string;
  sessions: WhatsAppSessionSocket[];
  messages: IncomingMessage[];
  qrCodes: Map<string, string>;
}

// Mock hook for development
const useMockSocket = () => {
  const [state] = useState<SocketState>({
    isConnected: false,
    sessions: [],
    messages: [],
    qrCodes: new Map(),
  });

  return {
    state,
    actions: {
      createSession: async (_sessionId?: string) => ({
        success: false,
        error: "Socket not available",
      }),

      logoutSession: async (_sessionId: string) => ({
        success: false,
        error: "Socket not available",
      }),

      sendMessage: async (
        _sessionId: string,
        _to: string,
        _message: string
      ) => ({
        success: false,
        error: "Socket not available",
      }),
      getSessionStatus: async (_sessionId: string) => ({
        success: false,
        error: "Socket not available",
      }),
      refreshSessions: async () => {},
      clearMessages: () => {},

      clearQRCode: (_sessionId: string) => {},
    },
  };
};

const StatusBadge: React.FC<{ status: string; isConnected: boolean }> = ({
  status,
  isConnected,
}) => {
  const getStatusColor = () => {
    if (!isConnected) return "bg-gray-500";
    switch (status) {
      case "ready":
        return "bg-green-500";
      case "authenticated":
        return "bg-blue-500";
      case "qr":
        return "bg-yellow-500";
      case "initializing":
        return "bg-orange-500";
      case "disconnected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = () => {
    if (!isConnected) return "WebSocket Disconnected";
    switch (status) {
      case "ready":
        return "Ready";
      case "authenticated":
        return "Authenticated";
      case "qr":
        return "Waiting for QR Scan";
      case "initializing":
        return "Initializing";
      case "disconnected":
        return "Disconnected";
      default:
        return "Unknown";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor()}`}
    >
      <span className="w-2 h-2 mr-1 rounded-full bg-current opacity-75"></span>
      {getStatusText()}
    </span>
  );
};

const QRCodeDisplay: React.FC<{
  qrData: string;
  sessionId: string;
  onClear: () => void;
}> = ({ qrData, sessionId, onClear }) => {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const dataURL = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 2,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        setQrCodeDataURL(dataURL);
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    };

    if (qrData) {
      generateQRCode();
    }
  }, [qrData]);

  if (!qrCodeDataURL) {
    return (
      <div className="flex items-center justify-center w-64 h-64 bg-gray-100 rounded-lg">
        <div className="text-gray-500">Generating QR Code...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg border">
      <div className="text-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Scan QR Code</h3>
        <p className="text-sm text-gray-600">Session: {sessionId}</p>
      </div>
      <img
        src={qrCodeDataURL}
        alt="WhatsApp QR Code"
        className="mx-auto rounded-lg"
      />
      <div className="mt-3 text-center">
        <button
          onClick={onClear}
          className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
        >
          Clear QR Code
        </button>
      </div>
    </div>
  );
};

const SessionCard: React.FC<{
  session: WhatsAppSessionSocket;
  isConnected: boolean;
  qrCode?: string;
  onLogout: (sessionId: string) => void;
  onRefresh: (sessionId: string) => void;
  onClearQR: (sessionId: string) => void;
}> = ({ session, isConnected, qrCode, onLogout, onRefresh, onClearQR }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await onLogout(session.id);
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await onRefresh(session.id);
    setIsLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{session.id}</h3>
          <StatusBadge status={session.status} isConnected={isConnected} />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {session.clientInfo && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Client Info
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>
              <strong>Name:</strong> {session.clientInfo.pushname}
            </div>
            <div>
              <strong>ID:</strong> {session.clientInfo.wid}
            </div>
            <div>
              <strong>Platform:</strong> {session.clientInfo.platform}
            </div>
          </div>
        </div>
      )}

      {qrCode && session.status === "qr" && (
        <div className="mt-4">
          <QRCodeDisplay
            qrData={qrCode}
            sessionId={session.id}
            onClear={() => onClearQR(session.id)}
          />
        </div>
      )}
    </div>
  );
};

const MessageForm: React.FC<{
  sessions: WhatsAppSessionSocket[];
  onSendMessage: (
    sessionId: string,
    to: string,
    message: string
  ) => Promise<void>;
  isConnected: boolean;
}> = ({ sessions, onSendMessage, isConnected }) => {
  const [selectedSession, setSelectedSession] = useState("");
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const readySessions = sessions.filter((s) => s.status === "ready");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession || !to || !message) return;

    setIsLoading(true);
    try {
      await onSendMessage(selectedSession, to, message);
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Send Message</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="session"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Session
          </label>
          <select
            id="session"
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isConnected || readySessions.length === 0}
          >
            <option value="">Select a session</option>
            {readySessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.id} - {session.clientInfo?.pushname || "Unknown"}
              </option>
            ))}
          </select>
          {readySessions.length === 0 && (
            <p className="text-sm text-yellow-600 mt-1">
              No ready sessions available
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="to"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            To (Phone Number)
          </label>
          <input
            type="text"
            id="to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="e.g., +1234567890 or 1234567890"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isConnected}
          />
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Enter your message here..."
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isConnected}
          />
        </div>

        <button
          type="submit"
          disabled={
            !isConnected || !selectedSession || !to || !message || isLoading
          }
          className="w-full py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
};

const MessagesPanel: React.FC<{
  messages: IncomingMessage[];
  onClear: () => void;
}> = ({ messages, onClear }) => {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Real-time Messages
        </h3>
        <button
          onClick={onClear}
          className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm">No messages received yet</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">
                    From: {message.from}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {message.body}
                  </div>
                  {message.hasMedia && (
                    <div className="text-xs text-blue-600 mt-1">
                      📎 Contains media
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const RealtimeDashboard: React.FC = () => {
  // Use mock hook for now, will be replaced with real hook when socket.io-client is available
  const { state, actions } = useMockSocket();

  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionId, setNewSessionId] = useState("");

  // Convert Map to object for easier access
  const qrCodes = Object.fromEntries(state.qrCodes);

  const handleCreateSession = async () => {
    setIsCreatingSession(true);
    try {
      const response = await actions.createSession(newSessionId || undefined);
      if (response.success) {
        setNewSessionId("");
      } else {
        alert(`Failed to create session: ${response.error}`);
      }
    } catch {
      alert("Failed to create session");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    const response = await actions.logoutSession(sessionId);
    if (!response.success) {
      alert(`Failed to logout session: ${response.error}`);
    }
  };

  const handleRefreshSession = async (sessionId: string) => {
    const response = await actions.getSessionStatus(sessionId);
    if (!response.success) {
      alert(`Failed to refresh session: ${response.error}`);
    }
  };

  const handleSendMessage = async (
    sessionId: string,
    to: string,
    message: string
  ) => {
    const response = await actions.sendMessage(sessionId, to, message);
    if (!response.success) {
      alert(`Failed to send message: ${response.error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WhatsApp Real-time Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <StatusBadge status="ready" isConnected={state.isConnected} />
            {state.connectionError && (
              <div className="text-red-600 text-sm">
                Error: {state.connectionError}
              </div>
            )}
          </div>
        </div>

        {/* Create Session */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Create New Session
          </h2>
          <div className="flex space-x-4">
            <input
              type="text"
              value={newSessionId}
              onChange={(e) => setNewSessionId(e.target.value)}
              placeholder="Session ID (optional)"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!state.isConnected}
            />
            <button
              onClick={handleCreateSession}
              disabled={!state.isConnected || isCreatingSession}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {isCreatingSession ? "Creating..." : "Create Session"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sessions */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Sessions ({state.sessions.length})
            </h2>
            {state.sessions.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <p className="text-gray-500">
                  No sessions yet. Create a session to get started.
                </p>
              </div>
            ) : (
              state.sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  isConnected={state.isConnected}
                  qrCode={qrCodes[session.id]}
                  onLogout={handleLogoutSession}
                  onRefresh={handleRefreshSession}
                  onClearQR={actions.clearQRCode}
                />
              ))
            )}
          </div>

          {/* Actions and Messages */}
          <div className="space-y-6">
            <MessageForm
              sessions={state.sessions}
              onSendMessage={handleSendMessage}
              isConnected={state.isConnected}
            />

            <MessagesPanel
              messages={state.messages}
              onClear={actions.clearMessages}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeDashboard;
