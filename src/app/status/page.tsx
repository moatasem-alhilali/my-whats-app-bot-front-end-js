"use client";

import ConnectionStatus from "@/components/ConnectionStatus";
import { whatsappApi, WhatsAppSession } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function StatusPage() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [selectedSession, setSelectedSession] =
    useState<WhatsAppSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionIdFromUrl = searchParams.get("sessionId");

  useEffect(() => {
    loadSessions();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (sessionIdFromUrl && sessions.length > 0) {
      const session = sessions.find((s) => s.id === sessionIdFromUrl);
      if (session) {
        setSelectedSession(session);
      }
    }
  }, [sessionIdFromUrl, sessions]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await whatsappApi.getAllSessions();

      if (response.success && response.data) {
        setSessions(response.data);
      } else {
        setError(response.error || "Failed to load sessions");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async (sessionId: string) => {
    try {
      const response = await whatsappApi.getSessionStatus(sessionId);
      if (response.success && response.data) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? response.data! : s))
        );
        if (selectedSession?.id === sessionId) {
          setSelectedSession(response.data);
        }
      }
    } catch (err) {
      console.error("Error refreshing session:", err);
    }
  };

  const handleLogout = async (sessionId: string) => {
    try {
      setActionLoading(sessionId);
      const response = await whatsappApi.logout(sessionId);

      if (response.success) {
        setSuccess("Session logged out successfully");
        await loadSessions();
      } else {
        setError(response.error || "Failed to logout session");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to logout session");
    } finally {
      setActionLoading("");
    }
  };

  const handleDestroy = async (sessionId: string) => {
    if (
      !confirm(
        "Are you sure you want to destroy this session? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setActionLoading(sessionId);
      const response = await whatsappApi.destroySession(sessionId);

      if (response.success) {
        setSuccess("Session destroyed successfully");
        await loadSessions();
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null);
          router.push("/status");
        }
      } else {
        setError(response.error || "Failed to destroy session");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to destroy session"
      );
    } finally {
      setActionLoading("");
    }
  };

  const getStatusBadge = (status: WhatsAppSession["status"]) => {
    const baseClasses =
      "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium";

    switch (status) {
      case "ready":
        return `${baseClasses} bg-[#238636]/10 text-[#238636] border border-[#238636]/20`;
      case "authenticated":
        return `${baseClasses} bg-[#1f6feb]/10 text-[#1f6feb] border border-[#1f6feb]/20`;
      case "qr":
        return `${baseClasses} bg-[#f85149]/10 text-[#f85149] border border-[#f85149]/20`;
      case "initializing":
        return `${baseClasses} bg-github-fg-muted/10 text-github-fg-muted border border-github-border-muted`;
      case "disconnected":
        return `${baseClasses} bg-[#da3633]/10 text-[#da3633] border border-[#da3633]/20`;
      default:
        return `${baseClasses} bg-github-fg-muted/10 text-github-fg-muted border border-github-border-muted`;
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

  return (
    <div className="min-h-screen bg-github-canvas">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>

      <div className="relative px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] bg-clip-text text-transparent sm:text-4xl">
              Session Status
            </h1>
            <p className="mt-2 text-github-fg-muted">
              Monitor and manage your WhatsApp sessions
            </p>
          </div>
          <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
            <button
              onClick={loadSessions}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-github-border-default rounded-md shadow-sm text-sm font-medium text-github-fg-default bg-github-canvas-subtle hover:bg-github-canvas-inset focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1f6feb] disabled:opacity-50 transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#1f6feb] border-t-transparent rounded-full animate-spin"></div>
                  Refreshing...
                </div>
              ) : (
                "Refresh All"
              )}
            </button>
            <Link
              href="/setup"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] hover:from-[#1a5feb] hover:to-[#4fa6ff] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1f6feb] transition-all duration-200 hover:shadow-lg hover:shadow-[#1f6feb]/25"
            >
              New Session
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <div className="mb-6 p-4 bg-[#238636]/10 border border-[#238636]/20 rounded-lg backdrop-blur-sm">
            <p className="text-sm text-[#238636] flex items-center gap-2">
              <span className="text-lg">✅</span>
              {success}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-[#da3633]/10 border border-[#da3633]/20 rounded-lg backdrop-blur-sm">
            <p className="text-sm text-[#da3633] flex items-center gap-2">
              <span className="text-lg">❌</span>
              {error}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sessions List */}
          <div className="lg:col-span-1">
            <div className="bg-github-canvas-subtle shadow-xl rounded-lg border border-github-border-default backdrop-blur-sm">
              <div className="px-6 py-8">
                <h3 className="text-xl font-semibold text-github-fg-default mb-6">
                  All Sessions
                </h3>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="relative">
                      <div className="w-12 h-12 border-2 border-[#1f6feb] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <div className="w-8 h-8 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin mx-auto absolute top-2 left-1/2 transform -translate-x-1/2"></div>
                    </div>
                    <p className="text-github-fg-muted">Loading sessions...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-6 opacity-20">📱</div>
                    <h4 className="text-lg font-semibold text-github-fg-default mb-3">
                      No Sessions Found
                    </h4>
                    <p className="text-github-fg-muted text-sm mb-6">
                      Create your first session to get started
                    </p>
                    <Link
                      href="/setup"
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] text-white rounded-lg hover:from-[#1a5feb] hover:to-[#4fa6ff] transition-all duration-200 hover:shadow-lg hover:shadow-[#1f6feb]/25"
                    >
                      Create Session
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`group p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          selectedSession?.id === session.id
                            ? "bg-[#1f6feb]/10 border-[#1f6feb]/50 shadow-lg shadow-[#1f6feb]/10"
                            : "bg-github-canvas-default border-github-border-default hover:border-[#1f6feb]/30 hover:bg-github-canvas-subtle"
                        }`}
                        onClick={() => {
                          setSelectedSession(session);
                          router.push(`/status?sessionId=${session.id}`);
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {getStatusIcon(session.status)}
                            </span>
                            <span className={getStatusBadge(session.status)}>
                              {session.status}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              refreshSession(session.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-github-fg-muted hover:text-[#1f6feb] transition-all duration-200 hover:scale-110"
                          >
                            🔄
                          </button>
                        </div>

                        <h4 className="font-medium text-github-fg-default truncate mb-1">
                          {session.id}
                        </h4>

                        {session.clientInfo?.pushname && (
                          <p className="text-sm text-github-fg-muted truncate">
                            {session.clientInfo.pushname}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="lg:col-span-2">
            {selectedSession ? (
              <div className="space-y-6">
                {/* Session Info Card */}
                <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-github-fg-default">
                      Session Details
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className={getStatusBadge(selectedSession.status)}>
                        {getStatusIcon(selectedSession.status)}{" "}
                        {selectedSession.status}
                      </span>
                    </div>
                  </div>

                  <ConnectionStatus session={selectedSession} />
                </div>

                {/* Actions Card */}
                <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default p-6">
                  <h3 className="text-lg font-semibold text-github-fg-default mb-4">
                    Actions
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <button
                      onClick={() => refreshSession(selectedSession.id)}
                      disabled={actionLoading === selectedSession.id}
                      className="px-4 py-2 bg-github-canvas-default border border-github-border-default rounded-lg text-github-fg-default hover:bg-github-canvas-inset transition-all duration-200 disabled:opacity-50"
                    >
                      🔄 Refresh
                    </button>

                    {selectedSession.status === "ready" && (
                      <Link
                        href={`/send?sessionId=${selectedSession.id}`}
                        className="px-4 py-2 bg-gradient-to-r from-[#238636] to-[#2ea043] text-white rounded-lg hover:from-[#1f7a2e] hover:to-[#26893b] transition-all duration-200 text-center"
                      >
                        💬 Send Message
                      </Link>
                    )}

                    <button
                      onClick={() => handleLogout(selectedSession.id)}
                      disabled={
                        actionLoading === selectedSession.id ||
                        selectedSession.status === "disconnected"
                      }
                      className="px-4 py-2 bg-[#f85149]/10 border border-[#f85149]/20 text-[#f85149] rounded-lg hover:bg-[#f85149]/20 transition-all duration-200 disabled:opacity-50"
                    >
                      {actionLoading === selectedSession.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-[#f85149] border-t-transparent rounded-full animate-spin"></div>
                          Logging out...
                        </div>
                      ) : (
                        "🚪 Logout"
                      )}
                    </button>

                    <button
                      onClick={() => handleDestroy(selectedSession.id)}
                      disabled={actionLoading === selectedSession.id}
                      className="px-4 py-2 bg-[#da3633]/10 border border-[#da3633]/20 text-[#da3633] rounded-lg hover:bg-[#da3633]/20 transition-all duration-200 disabled:opacity-50"
                    >
                      {actionLoading === selectedSession.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-[#da3633] border-t-transparent rounded-full animate-spin"></div>
                          Destroying...
                        </div>
                      ) : (
                        "🗑️ Destroy"
                      )}
                    </button>
                  </div>
                </div>

                {/* Session Health */}
                <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default p-6">
                  <h3 className="text-lg font-semibold text-github-fg-default mb-4">
                    Health Status
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-github-canvas-default rounded-lg border border-github-border-muted">
                      <span className="text-github-fg-default">
                        Connection Status
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedSession.status === "ready"
                            ? "bg-[#238636]/10 text-[#238636]"
                            : "bg-[#da3633]/10 text-[#da3633]"
                        }`}
                      >
                        {selectedSession.status === "ready"
                          ? "Healthy"
                          : "Issues Detected"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-github-canvas-default rounded-lg border border-github-border-muted">
                      <span className="text-github-fg-default">
                        Last Updated
                      </span>
                      <span className="text-github-fg-muted text-sm">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default p-12 text-center">
                <div className="text-6xl mb-6 opacity-20">👈</div>
                <h3 className="text-xl font-semibold text-github-fg-default mb-3">
                  Select a Session
                </h3>
                <p className="text-github-fg-muted">
                  Choose a session from the list to view its details and manage
                  it
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
