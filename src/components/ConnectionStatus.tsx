"use client";

import { WhatsAppSession } from "@/lib/api";

interface ConnectionStatusProps {
  session?: WhatsAppSession | null;
  loading?: boolean;
}

export default function ConnectionStatus({
  session,
  loading,
}: ConnectionStatusProps) {
  const getStatusColor = (status: WhatsAppSession["status"]) => {
    switch (status) {
      case "ready":
        return "status-ready text-white";
      case "authenticated":
        return "status-connecting text-white";
      case "qr":
        return "status-connecting text-white";
      case "initializing":
        return "bg-gray-500/20 text-gray-300 border border-gray-500/30";
      case "disconnected":
        return "status-disconnected text-white";
      default:
        return "bg-gray-500/20 text-gray-300 border border-gray-500/30";
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
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-6 card-hover">
        <h3 className="text-lg font-semibold mb-4 text-white">
          Connection Status
        </h3>
        <div className="text-center py-8">
          <div className="relative mx-auto mb-4 w-12 h-12">
            <div className="w-12 h-12 border-4 border-[#21262d] border-t-blue-500 rounded-full animate-spin"></div>
            <div
              className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-green-500 rounded-full animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
          </div>
          <p className="text-gray-400">Loading status...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-6 card-hover">
        <h3 className="text-lg font-semibold mb-4 text-white">
          Connection Status
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-gray-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <div className="text-4xl">📱</div>
          </div>
          <p className="text-gray-400 font-medium">No session found</p>
          <p className="text-sm text-gray-500 mt-2">
            Create a session to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-6 card-hover hover-lift">
      <h3 className="text-lg font-semibold mb-4 text-white">
        Connection Status
      </h3>

      <div className="space-y-6">
        {/* Status Indicator */}
        <div className="flex items-center space-x-4">
          <div className="text-3xl">{getStatusIcon(session.status)}</div>
          <div className="flex-1">
            <div
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(
                session.status
              )}`}
            >
              {getStatusText(session.status)}
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <span className="text-sm font-medium text-gray-400">
                Session ID:
              </span>
              <div className="text-sm text-white font-mono bg-[#21262d] px-3 py-2 rounded-lg border border-[#30363d] mt-1">
                {session.id}
              </div>
            </div>
          </div>
        </div>

        {/* Client Info */}
        {session.clientInfo && (
          <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Device Information
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <span className="text-sm font-medium text-green-300">
                  Display Name:
                </span>
                <div className="text-sm text-white mt-1 font-medium">
                  {session.clientInfo.pushname}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-green-300">
                  WhatsApp ID:
                </span>
                <div className="text-sm text-gray-300 font-mono mt-1 bg-[#21262d] px-2 py-1 rounded border border-[#30363d]">
                  {session.clientInfo.wid}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-green-300">
                  Platform:
                </span>
                <div className="text-sm text-white mt-1">
                  {session.clientInfo.platform}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connection Health */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-[#21262d]">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <div className="flex items-center space-x-1">
            <div
              className={`w-2 h-2 rounded-full ${
                session.status === "ready"
                  ? "bg-green-500 animate-pulse"
                  : session.status === "disconnected"
                  ? "bg-red-500"
                  : "bg-yellow-500 animate-pulse"
              }`}
            ></div>
            <span className="capitalize">{session.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
