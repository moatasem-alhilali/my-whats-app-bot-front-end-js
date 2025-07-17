"use client";

import { SessionStats, whatsappApi } from "@/lib/api";
import { useEffect, useState } from "react";

interface AntiBanStatsProps {
  sessionId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function AntiBanStats({
  sessionId,
  autoRefresh = true,
  refreshInterval = 30000,
}: AntiBanStatsProps) {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const loadStats = async () => {
    try {
      if (!loading) setLoading(true);
      setError("");

      const response = await whatsappApi.getSessionStats(sessionId);

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error || "Failed to load statistics");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load statistics"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    if (autoRefresh) {
      const interval = setInterval(loadStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [sessionId, autoRefresh, refreshInterval]);

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-[#238636]"; // Green
    if (score >= 60) return "text-[#fb8500]"; // Orange
    return "text-[#da3633]"; // Red
  };

  const getHealthScoreIcon = (score: number) => {
    if (score >= 80) return "✅";
    if (score >= 60) return "⚠️";
    return "🚨";
  };

  if (loading && !stats) {
    return (
      <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-github-canvas-default rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-github-canvas-default rounded w-3/4"></div>
            <div className="h-4 bg-github-canvas-default rounded w-1/2"></div>
            <div className="h-4 bg-github-canvas-default rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default p-6">
        <div className="text-center">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="text-lg font-semibold text-github-fg-default mb-2">
            Anti-Ban Statistics
          </h3>
          <p className="text-sm text-[#da3633]">
            {error || "No statistics available"}
          </p>
          <button
            onClick={() => loadStats()}
            className="mt-3 px-4 py-2 text-sm bg-[#1f6feb] text-white rounded-lg hover:bg-[#1a5feb] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const messageStats = stats.messageStats;
  const queueStats = stats.queueStats;
  const sessionHealth = stats.sessionHealth;

  // Use enhanced health data if available
  const userGuidance = sessionHealth?.userGuidance;
  const riskLevel = sessionHealth?.riskLevel || "low";

  // Map to legacy format for backward compatibility
  const antiBanStatus = {
    enabled: sessionHealth?.protectionActive !== false,
    warningsDetected: sessionHealth?.warningCount || 0,
    lastWarningTime: sessionHealth?.lastWarning,
    healthScore: getRiskLevelScore(riskLevel),
  };

  function getRiskLevelScore(risk: string): number {
    switch (risk) {
      case "low":
        return 90;
      case "medium":
        return 70;
      case "high":
        return 40;
      case "critical":
        return 10;
      default:
        return 50;
    }
  }

  // Ensure all required properties exist
  if (!messageStats || !queueStats || !sessionHealth) {
    return (
      <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default p-6">
        <div className="text-center">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="text-lg font-semibold text-github-fg-default mb-2">
            Anti-Ban Statistics
          </h3>
          <p className="text-sm text-[#da3633]">Incomplete statistics data</p>
          <button
            onClick={() => loadStats()}
            className="mt-3 px-4 py-2 text-sm bg-[#1f6feb] text-white rounded-lg hover:bg-[#1a5feb] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default">
      {/* Header */}
      <div className="p-4 border-b border-github-border-muted">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">📊</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-github-fg-default">
                Anti-Ban Statistics
              </h3>
              <p className="text-xs text-github-fg-muted">
                Session: {sessionId}
              </p>
            </div>
          </div>
          <button
            onClick={() => loadStats()}
            disabled={loading}
            className="p-2 text-github-fg-muted hover:text-github-fg-default transition-colors"
            title="Refresh statistics"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Health Score */}
        <div className="flex items-center justify-between p-3 bg-github-canvas-default rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {getHealthScoreIcon(antiBanStatus.healthScore)}
            </span>
            <div>
              <p className="text-sm font-medium text-github-fg-default">
                Health Score
              </p>
              <p className="text-xs text-github-fg-muted">
                Anti-ban protection effectiveness
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className={`text-lg font-bold ${getHealthScoreColor(
                antiBanStatus.healthScore
              )}`}
            >
              {antiBanStatus.healthScore}/100
            </p>
            <p className="text-xs text-github-fg-muted">
              {antiBanStatus.enabled ? "Protection ON" : "Protection OFF"}
            </p>
          </div>
        </div>

        {/* Message Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-github-canvas-default rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-github-fg-default">
                Messages Today
              </span>
              <span className="text-xl">💬</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-lg font-bold text-github-fg-default">
                {messageStats.messagesSent}
              </span>
              <span className="text-xs text-github-fg-muted">
                / {messageStats.dailyLimit}
              </span>
            </div>
            <div className="w-full bg-github-border-muted rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  messageStats.messagesSent / messageStats.dailyLimit > 0.8
                    ? "bg-[#da3633]"
                    : messageStats.messagesSent / messageStats.dailyLimit > 0.6
                    ? "bg-[#fb8500]"
                    : "bg-[#238636]"
                }`}
                style={{
                  width: `${Math.min(
                    (messageStats.messagesSent / messageStats.dailyLimit) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="p-3 bg-github-canvas-default rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-github-fg-default">
                New Contacts
              </span>
              <span className="text-xl">👥</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-lg font-bold text-github-fg-default">
                {messageStats.newContacts}
              </span>
              <span className="text-xs text-github-fg-muted">
                / {messageStats.contactLimit}
              </span>
            </div>
            <div className="w-full bg-github-border-muted rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  messageStats.newContacts / messageStats.contactLimit > 0.8
                    ? "bg-[#da3633]"
                    : messageStats.newContacts / messageStats.contactLimit > 0.6
                    ? "bg-[#fb8500]"
                    : "bg-[#238636]"
                }`}
                style={{
                  width: `${Math.min(
                    (messageStats.newContacts / messageStats.contactLimit) *
                      100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Queue Statistics */}
        <div className="p-3 bg-github-canvas-default rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📤</span>
            <span className="text-sm font-medium text-github-fg-default">
              Message Queue
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-[#fb8500]">
                {queueStats.pending}
              </p>
              <p className="text-xs text-github-fg-muted">Pending</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[#1f6feb]">
                {queueStats.processing}
              </p>
              <p className="text-xs text-github-fg-muted">Processing</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[#238636]">
                {queueStats.completed}
              </p>
              <p className="text-xs text-github-fg-muted">Completed</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[#da3633]">
                {queueStats.failed}
              </p>
              <p className="text-xs text-github-fg-muted">Failed</p>
            </div>
          </div>
        </div>

        {/* Enhanced Guidance Section */}
        {userGuidance && (
          <div
            className={`p-4 rounded-lg border ${
              userGuidance.level === "critical"
                ? "bg-[#da3633]/10 border-[#da3633]/20"
                : userGuidance.level === "danger"
                ? "bg-[#f85149]/10 border-[#f85149]/20"
                : userGuidance.level === "warning"
                ? "bg-[#fb8500]/10 border-[#fb8500]/20"
                : "bg-[#238636]/10 border-[#238636]/20"
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-xl">
                {userGuidance.level === "critical"
                  ? "🚨"
                  : userGuidance.level === "danger"
                  ? "⚠️"
                  : userGuidance.level === "warning"
                  ? "⚠️"
                  : "✅"}
              </span>
              <div className="flex-1">
                <h4
                  className={`font-semibold text-sm mb-1 ${
                    userGuidance.level === "critical"
                      ? "text-[#da3633]"
                      : userGuidance.level === "danger"
                      ? "text-[#f85149]"
                      : userGuidance.level === "warning"
                      ? "text-[#fb8500]"
                      : "text-[#238636]"
                  }`}
                >
                  {userGuidance.title}
                </h4>
                <p className="text-sm text-github-fg-default mb-2">
                  {userGuidance.message}
                </p>
                {userGuidance.nextAction && (
                  <div className="bg-github-canvas-default/50 rounded p-2">
                    <p className="text-xs font-medium text-github-fg-muted mb-1">
                      Next Action:
                    </p>
                    <p className="text-xs text-github-fg-default">
                      {userGuidance.nextAction}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {userGuidance.recommendations.length > 0 && (
              <div className="border-t border-github-border-muted pt-3">
                <p className="text-xs font-medium text-github-fg-muted mb-2">
                  Recommendations:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {userGuidance.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-[#238636] mt-1 text-xs">•</span>
                      <span className="text-xs text-github-fg-default">
                        {rec}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-github-border-muted">
              <div className="flex items-center justify-between text-xs">
                <span className="text-github-fg-muted">
                  Can send messages:{" "}
                  {userGuidance.canSendMessages ? "Yes" : "No"}
                </span>
                <span className="text-github-fg-muted">
                  Risk Level: {riskLevel.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Fallback Warnings Section */}
        {!userGuidance && antiBanStatus.warningsDetected > 0 && (
          <div className="p-3 bg-[#da3633]/10 border border-[#da3633]/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚠️</span>
              <span className="text-sm font-medium text-[#da3633]">
                Ban Warnings Detected
              </span>
            </div>
            <p className="text-sm text-github-fg-default">
              <strong>{antiBanStatus.warningsDetected}</strong> warning(s)
              detected.
            </p>
            {antiBanStatus.lastWarningTime && (
              <p className="text-xs text-github-fg-muted mt-1">
                Last warning:{" "}
                {new Date(antiBanStatus.lastWarningTime).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Reset Information */}
        <div className="text-center">
          <p className="text-xs text-github-fg-muted">
            Limits reset:{" "}
            {new Date(messageStats.limitResetTime).toLocaleString()}
          </p>
          {messageStats.lastMessageTime && (
            <p className="text-xs text-github-fg-muted">
              Last message:{" "}
              {new Date(messageStats.lastMessageTime).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// export default AntiBanStats;
