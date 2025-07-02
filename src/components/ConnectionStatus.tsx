"use client";

import { WhatsAppSession } from "@/lib/api";

interface ConnectionStatusProps {
  session: WhatsAppSession | null;
  loading?: boolean;
}

export default function ConnectionStatus({
  session,
  loading,
}: ConnectionStatusProps) {
  const getStatusColor = (status: WhatsAppSession["status"]) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800 border-green-200";
      case "authenticated":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "qr":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "initializing":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "disconnected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: WhatsAppSession["status"]) => {
    switch (status) {
      case "ready":
        return "✅";
      case "authenticated":
        return "🔐";
      case "qr":
        return "📱";
      case "initializing":
        return "⏳";
      case "disconnected":
        return "❌";
      default:
        return "❓";
    }
  };

  const getStatusText = (status: WhatsAppSession["status"]) => {
    switch (status) {
      case "ready":
        return "Connected & Ready";
      case "authenticated":
        return "Authenticated";
      case "qr":
        return "Waiting for QR Scan";
      case "initializing":
        return "Initializing...";
      case "disconnected":
        return "Disconnected";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Connection Status
        </h3>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📱</div>
          <p className="text-gray-600">No session found</p>
          <p className="text-sm text-gray-500 mt-2">
            Create a session to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Connection Status
      </h3>

      <div className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getStatusIcon(session.status)}</span>
          <div className="flex-1">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                session.status
              )}`}
            >
              {getStatusText(session.status)}
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <span className="text-sm font-medium text-gray-500">
                Session ID:
              </span>
              <div className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border mt-1">
                {session.id}
              </div>
            </div>
          </div>
        </div>

        {/* Client Info (when connected) */}
        {session.clientInfo && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
              <span>📱</span> WhatsApp Account Info
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <span className="text-sm font-medium text-green-700">
                  Display Name:
                </span>
                <div className="text-sm text-green-900 mt-1">
                  {session.clientInfo.pushname}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-green-700">
                  WhatsApp ID:
                </span>
                <div className="text-sm text-green-900 font-mono mt-1">
                  {session.clientInfo.wid}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-green-700">
                  Platform:
                </span>
                <div className="text-sm text-green-900 mt-1">
                  {session.clientInfo.platform}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-xs text-gray-500 text-center">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
