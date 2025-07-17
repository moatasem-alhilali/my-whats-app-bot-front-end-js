"use client";

import { UserGuidance, whatsappApi, WhatsAppSession } from "@/lib/api";
import { useEffect, useState } from "react";

interface ConnectionStatusProps {
  session: WhatsAppSession;
  compact?: boolean;
}

export default function ConnectionStatus({
  session,
  compact = false,
}: ConnectionStatusProps) {
  const [guidance, setGuidance] = useState<UserGuidance | null>(null);
  const [loadingGuidance, setLoadingGuidance] = useState(false);

  // Load guidance for ready sessions
  useEffect(() => {
    if (session.status === "ready") {
      loadGuidance();
    }
  }, [session.id, session.status]);

  const loadGuidance = async () => {
    if (loadingGuidance) return;

    setLoadingGuidance(true);
    try {
      const response = await whatsappApi.getSessionGuidance(session.id);
      if (response.success && response.data) {
        setGuidance(response.data);
      }
    } catch (error) {
      console.debug("Could not load session guidance:", error);
    } finally {
      setLoadingGuidance(false);
    }
  };

  const getStatusConfig = (status: WhatsAppSession["status"]) => {
    switch (status) {
      case "ready":
        return {
          color: "text-[#238636]",
          bgColor: "bg-[#238636]/10",
          borderColor: "border-[#238636]/20",
          icon: "✅",
          label: "Ready",
          description: "Connected and ready to send messages",
          pulse: false,
        };
      case "authenticated":
        return {
          color: "text-[#1f6feb]",
          bgColor: "bg-[#1f6feb]/10",
          borderColor: "border-[#1f6feb]/20",
          icon: "🔐",
          label: "Authenticated",
          description: "Authentication successful, finalizing connection",
          pulse: true,
        };
      case "qr":
        return {
          color: "text-[#f85149]",
          bgColor: "bg-[#f85149]/10",
          borderColor: "border-[#f85149]/20",
          icon: "📱",
          label: "QR Code",
          description: "Scan QR code with your WhatsApp app",
          pulse: true,
        };
      case "initializing":
        return {
          color: "text-github-fg-muted",
          bgColor: "bg-github-fg-muted/10",
          borderColor: "border-github-border-muted",
          icon: "⏳",
          label: "Initializing",
          description: "Setting up session...",
          pulse: true,
        };
      case "disconnected":
        return {
          color: "text-[#da3633]",
          bgColor: "bg-[#da3633]/10",
          borderColor: "border-[#da3633]/20",
          icon: "❌",
          label: "Disconnected",
          description: "Session has been disconnected",
          pulse: false,
        };
      default:
        return {
          color: "text-github-fg-muted",
          bgColor: "bg-github-fg-muted/10",
          borderColor: "border-github-border-muted",
          icon: "❓",
          label: "Unknown",
          description: "Status unknown",
          pulse: false,
        };
    }
  };

  const statusConfig = getStatusConfig(session.status);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div
          className={`relative w-8 h-8 ${statusConfig.bgColor} ${statusConfig.borderColor} border rounded-lg flex items-center justify-center`}
        >
          <span className="text-sm">{statusConfig.icon}</span>
          {statusConfig.pulse && (
            <div
              className={`absolute inset-0 ${statusConfig.bgColor} rounded-lg animate-pulse opacity-50`}
            ></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-github-fg-default truncate text-sm">
              {session.id}
            </h4>
            <span
              className={`px-2 py-0.5 ${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor} border rounded-full text-xs font-medium`}
            >
              {statusConfig.label}
            </span>
          </div>

          {session.clientInfo?.pushname && (
            <p className="text-xs text-github-fg-muted truncate">
              {session.clientInfo.pushname}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 ${statusConfig.bgColor} ${statusConfig.borderColor} border rounded-lg backdrop-blur-sm`}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`relative w-12 h-12 ${statusConfig.bgColor} ${statusConfig.borderColor} border rounded-lg flex items-center justify-center`}
        >
          <span className="text-xl">{statusConfig.icon}</span>
          {statusConfig.pulse && (
            <div
              className={`absolute inset-0 ${statusConfig.bgColor} rounded-lg animate-pulse opacity-50`}
            ></div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-github-fg-default">
              Session Status
            </h3>
            <span
              className={`px-3 py-1 ${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor} border rounded-full text-sm font-medium`}
            >
              {statusConfig.label}
            </span>
          </div>
          <p className="text-sm text-github-fg-muted">
            {statusConfig.description}
          </p>
        </div>
      </div>

      {/* Session Details */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-github-canvas-default/50 rounded-lg p-3">
            <dt className="text-xs font-medium text-github-fg-muted uppercase tracking-wide mb-1">
              Session ID
            </dt>
            <dd className="text-sm font-mono text-github-fg-default break-all">
              {session.id}
            </dd>
          </div>

          <div className="bg-github-canvas-default/50 rounded-lg p-3">
            <dt className="text-xs font-medium text-github-fg-muted uppercase tracking-wide mb-1">
              Status
            </dt>
            <dd className={`text-sm font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </dd>
          </div>
        </div>

        {session.clientInfo && (
          <div className="border-t border-github-border-muted pt-4">
            <h4 className="text-sm font-medium text-github-fg-default mb-3 flex items-center gap-2">
              <span>📱</span>
              Device Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {session.clientInfo.pushname && (
                <div className="bg-github-canvas-default/50 rounded-lg p-3">
                  <dt className="text-xs font-medium text-github-fg-muted uppercase tracking-wide mb-1">
                    Display Name
                  </dt>
                  <dd className="text-sm text-github-fg-default">
                    {session.clientInfo.pushname}
                  </dd>
                </div>
              )}

              {session.clientInfo.wid && (
                <div className="bg-github-canvas-default/50 rounded-lg p-3">
                  <dt className="text-xs font-medium text-github-fg-muted uppercase tracking-wide mb-1">
                    WhatsApp ID
                  </dt>
                  <dd className="text-sm font-mono text-github-fg-default break-all">
                    {session.clientInfo.wid}
                  </dd>
                </div>
              )}

              {session.clientInfo.platform && (
                <div className="bg-github-canvas-default/50 rounded-lg p-3">
                  <dt className="text-xs font-medium text-github-fg-muted uppercase tracking-wide mb-1">
                    Platform
                  </dt>
                  <dd className="text-sm text-github-fg-default">
                    {session.clientInfo.platform}
                  </dd>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Protection Guidance */}
        {guidance && session.status === "ready" && (
          <div className="border-t border-github-border-muted pt-4">
            <div
              className={`p-4 rounded-lg border ${
                guidance.level === "critical"
                  ? "bg-[#da3633]/10 border-[#da3633]/20"
                  : guidance.level === "danger"
                  ? "bg-[#f85149]/10 border-[#f85149]/20"
                  : guidance.level === "warning"
                  ? "bg-[#fb8500]/10 border-[#fb8500]/20"
                  : "bg-[#238636]/10 border-[#238636]/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">
                  {guidance.level === "critical"
                    ? "🚨"
                    : guidance.level === "danger"
                    ? "⚠️"
                    : guidance.level === "warning"
                    ? "⚠️"
                    : "✅"}
                </span>
                <div className="flex-1">
                  <h4
                    className={`font-semibold text-sm mb-1 ${
                      guidance.level === "critical"
                        ? "text-[#da3633]"
                        : guidance.level === "danger"
                        ? "text-[#f85149]"
                        : guidance.level === "warning"
                        ? "text-[#fb8500]"
                        : "text-[#238636]"
                    }`}
                  >
                    {guidance.title}
                  </h4>
                  <p className="text-sm text-github-fg-default mb-2">
                    {guidance.message}
                  </p>
                  {guidance.nextAction && (
                    <p className="text-xs text-github-fg-muted font-medium">
                      Next: {guidance.nextAction}
                    </p>
                  )}
                </div>
              </div>

              {!compact && guidance.recommendations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-github-border-muted">
                  <p className="text-xs font-medium text-github-fg-muted mb-2">
                    Recommendations:
                  </p>
                  <ul className="text-xs text-github-fg-default space-y-1">
                    {guidance.recommendations.slice(0, 3).map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-[#238636] mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                  {guidance.recommendations.length > 3 && (
                    <p className="text-xs text-github-fg-muted mt-1">
                      +{guidance.recommendations.length - 3} more
                      recommendations
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Health Indicator */}
        <div className="border-t border-github-border-muted pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-github-fg-default">
                Health Status:
              </span>
              <span
                className={`px-2 py-1 ${statusConfig.bgColor} ${statusConfig.color} rounded-full text-xs font-medium`}
              >
                {guidance
                  ? guidance.level === "info"
                    ? "Healthy"
                    : guidance.level === "warning"
                    ? "Caution"
                    : "Issues Detected"
                  : session.status === "ready"
                  ? "Healthy"
                  : "Issues Detected"}
              </span>
            </div>
            <div className="text-xs text-github-fg-muted">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
