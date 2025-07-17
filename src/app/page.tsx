"use client";

import AntiBanStats from "@/components/AntiBanStats";
import ConnectionStatus from "@/components/ConnectionStatus";
import CommandPalette from "@/components/ui/CommandPalette";
import { StatsSkeleton } from "@/components/ui/LoadingSkeleton";
import StatCard from "@/components/ui/StatCard";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { whatsappApi, WhatsAppSession } from "@/lib/api";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function Dashboard() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const { toasts, removeToast, success, error: showError } = useToast();

  const loadSessions = useCallback(
    async (showSuccessToast = false) => {
      try {
        setLoading(true);
        setError("");

        const response = await whatsappApi.getAllSessions();

        if (response.success && response.data) {
          setSessions(response.data);
          if (showSuccessToast) {
            success("Sessions refreshed", "Data updated successfully");
          }
        } else {
          const errorMsg = response.error || "Failed to load sessions";
          setError(errorMsg);
          showError("Failed to load sessions", errorMsg);
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load sessions";
        setError(errorMsg);
        showError("Connection error", errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [success, showError]
  );

  useEffect(() => {
    loadSessions();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSessions, 30000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  // Global keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Calculate stats from sessions data
  const stats = {
    total: sessions.length,
    ready: sessions.filter((s) => s.status === "ready").length,
    connecting: sessions.filter(
      (s) => s.status === "qr" || s.status === "initializing"
    ).length,
    disconnected: sessions.filter((s) => s.status === "disconnected").length,
  };

  const readySessions = sessions.filter((s) => s.status === "ready");

  return (
    <div className="min-h-screen bg-github-canvas">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>

      <div className="relative px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] bg-clip-text text-transparent">
                WhatsApp Dashboard
              </h1>
              <p className="mt-2 text-github-fg-muted">
                Manage your WhatsApp sessions and send messages
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="px-4 py-2 bg-github-canvas-subtle border border-github-border-default rounded-lg text-github-fg-muted hover:text-github-fg-default hover:bg-github-canvas-inset transition-all duration-200 flex items-center gap-2"
              >
                <span>🔍</span>
                <span className="hidden sm:inline">Quick Actions</span>
                <kbd className="px-2 py-1 bg-github-canvas-default border border-github-border-muted rounded text-xs">
                  ⌘K
                </kbd>
              </button>

              <button
                onClick={() => loadSessions(true)}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] text-white rounded-lg hover:from-[#1a5feb] hover:to-[#4fa6ff] disabled:opacity-50 transition-all duration-200 hover:shadow-lg hover:shadow-[#1f6feb]/25"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Refreshing...
                  </div>
                ) : (
                  "Refresh"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8">
          {loading ? (
            <StatsSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Sessions"
                value={stats.total}
                icon="📱"
                color="blue"
                change={stats.total > 0 ? 5 : undefined}
                changeLabel="Active connections"
              />
              <StatCard
                title="Ready Sessions"
                value={stats.ready}
                icon="✅"
                color="green"
                change={stats.ready > 0 ? 12 : undefined}
                changeLabel="Ready to send"
              />
              <StatCard
                title="Connecting"
                value={stats.connecting}
                icon="⏳"
                color="yellow"
                change={stats.connecting > 0 ? -3 : undefined}
                changeLabel="Awaiting QR scan"
              />
              <StatCard
                title="Disconnected"
                value={stats.disconnected}
                icon="❌"
                color="red"
                change={stats.disconnected > 0 ? -8 : undefined}
                changeLabel="Need reconnection"
              />
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-[#da3633]/10 border border-[#da3633]/20 rounded-lg backdrop-blur-sm">
            <p className="text-sm text-[#da3633] flex items-center gap-2">
              <span className="text-lg">❌</span>
              {error}
            </p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-github-fg-default mb-6 flex items-center gap-2">
              <span>🚀</span>
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Setup Session Card */}
              <Link href="/setup" className="group block">
                <div className="relative bg-github-canvas-subtle border border-github-border-default rounded-lg p-6 hover:shadow-lg hover:shadow-[#1f6feb]/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1f6feb]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] rounded-lg flex items-center justify-center text-white text-xl mb-4">
                      ➕
                    </div>
                    <h3 className="text-lg font-semibold text-github-fg-default mb-2">
                      Create Session
                    </h3>
                    <p className="text-github-fg-muted text-sm mb-4">
                      Set up a new WhatsApp connection and scan QR code
                    </p>
                    <div className="flex items-center text-[#1f6feb] text-sm font-medium">
                      Get Started
                      <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Send Messages Card */}
              <Link href="/send" className="group block">
                <div className="relative bg-github-canvas-subtle border border-github-border-default rounded-lg p-6 hover:shadow-lg hover:shadow-[#238636]/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#238636]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#238636] to-[#2ea043] rounded-lg flex items-center justify-center text-white text-xl mb-4">
                      💬
                    </div>
                    <h3 className="text-lg font-semibold text-github-fg-default mb-2">
                      Send Messages
                    </h3>
                    <p className="text-github-fg-muted text-sm mb-4">
                      Send text messages and media files to any contact
                    </p>
                    <div className="flex items-center text-[#238636] text-sm font-medium">
                      Start Messaging
                      <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Session Status Card */}
              <Link href="/status" className="group block">
                <div className="relative bg-github-canvas-subtle border border-github-border-default rounded-lg p-6 hover:shadow-lg hover:shadow-[#8b5cf6]/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#8b5cf6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] rounded-lg flex items-center justify-center text-white text-xl mb-4">
                      📊
                    </div>
                    <h3 className="text-lg font-semibold text-github-fg-default mb-2">
                      Session Status
                    </h3>
                    <p className="text-github-fg-muted text-sm mb-4">
                      Monitor and manage all your active sessions
                    </p>
                    <div className="flex items-center text-[#8b5cf6] text-sm font-medium">
                      View Status
                      <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* API Documentation Card */}
              <a
                href="http://localhost:3001/api-docs"
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="relative bg-github-canvas-subtle border border-github-border-default rounded-lg p-6 hover:shadow-lg hover:shadow-[#f85149]/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#f85149]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#f85149] to-[#ffab40] rounded-lg flex items-center justify-center text-white text-xl mb-4">
                      📚
                    </div>
                    <h3 className="text-lg font-semibold text-github-fg-default mb-2">
                      API Documentation
                    </h3>
                    <p className="text-github-fg-muted text-sm mb-4">
                      Explore the REST API endpoints and test functionality
                    </p>
                    <div className="flex items-center text-[#f85149] text-sm font-medium">
                      View Docs
                      <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">
                        ↗
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Active Sessions Sidebar */}
          <div>
            <h2 className="text-xl font-semibold text-github-fg-default mb-6 flex items-center gap-2">
              <span>📱</span>
              Active Sessions
            </h2>

            <div className="bg-github-canvas-subtle border border-github-border-default rounded-lg overflow-hidden">
              {loading ? (
                <div className="p-6">
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-github-canvas-default rounded animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-github-canvas-default rounded animate-pulse"></div>
                          <div className="h-3 bg-github-canvas-default rounded w-2/3 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4 opacity-50">📱</div>
                  <h3 className="font-medium text-github-fg-default mb-2">
                    No Sessions Yet
                  </h3>
                  <p className="text-sm text-github-fg-muted mb-4">
                    Create your first session to get started
                  </p>
                  <Link
                    href="/setup"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] text-white rounded-lg hover:from-[#1a5feb] hover:to-[#4fa6ff] transition-all duration-200"
                  >
                    Create Session
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-github-border-muted">
                  {sessions.slice(0, 5).map((session) => (
                    <div
                      key={session.id}
                      className="p-4 hover:bg-github-canvas-inset transition-colors duration-200"
                    >
                      <ConnectionStatus session={session} compact />
                      {session.status === "ready" && (
                        <div className="mt-3 flex gap-2">
                          <Link
                            href={`/send?sessionId=${session.id}`}
                            className="flex-1 px-3 py-1.5 bg-[#238636]/10 text-[#238636] rounded text-xs font-medium hover:bg-[#238636]/20 transition-colors duration-200 text-center"
                          >
                            Send Message
                          </Link>
                          <Link
                            href={`/status?sessionId=${session.id}`}
                            className="flex-1 px-3 py-1.5 bg-[#1f6feb]/10 text-[#1f6feb] rounded text-xs font-medium hover:bg-[#1f6feb]/20 transition-colors duration-200 text-center"
                          >
                            Details
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}

                  {sessions.length > 5 && (
                    <div className="p-4 bg-github-canvas-inset">
                      <Link
                        href="/status"
                        className="block text-center text-sm text-[#1f6feb] hover:text-[#58a6ff] transition-colors duration-200"
                      >
                        View all {sessions.length} sessions →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Anti-Ban Features */}
        {sessions.length > 0 && sessions.some((s) => s.status === "ready") && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-github-fg-default mb-6 flex items-center gap-2">
              <span>🛡️</span>
              Anti-Ban Protection
            </h2>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Stats for first ready session */}
              <div className="xl:col-span-2">
                <AntiBanStats
                  sessionId={
                    sessions.find((s) => s.status === "ready")?.id || ""
                  }
                  autoRefresh={true}
                />
              </div>

              {/* Queue Status Card */}
              <div className="space-y-6">
                <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">📤</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-github-fg-default">
                        Queue Status
                      </h3>
                      <p className="text-xs text-github-fg-muted">
                        Global message processing
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-github-fg-default">
                        Protection:
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#238636]"></div>
                        <span className="text-sm font-medium text-github-fg-default">
                          Active
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-github-fg-default">
                        Ready Sessions:
                      </span>
                      <span className="text-sm font-bold text-[#238636]">
                        {readySessions.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-github-fg-default">
                        Total Sessions:
                      </span>
                      <span className="text-sm font-bold text-[#1f6feb]">
                        {sessions.length}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-github-border-muted">
                    <Link
                      href="/queue"
                      className="w-full px-4 py-2 bg-[#1f6feb] text-white rounded-lg hover:bg-[#1a5feb] transition-colors text-center block text-sm"
                    >
                      Manage Queue
                    </Link>
                  </div>
                </div>

                {/* Quick Access Cards */}
                <div className="space-y-3">
                  <Link href="/send" className="block">
                    <div className="bg-github-canvas-subtle border border-github-border-default rounded-lg p-4 hover:bg-github-canvas-inset transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">💬</span>
                        <div>
                          <p className="text-sm font-medium text-github-fg-default">
                            Send Protected Message
                          </p>
                          <p className="text-xs text-github-fg-muted">
                            Use anti-ban features
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="bg-github-canvas-subtle border border-github-border-default rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xl">📊</span>
                      <div>
                        <p className="text-sm font-medium text-github-fg-default">
                          Today&apos;s Usage
                        </p>
                        <p className="text-xs text-github-fg-muted">
                          Across all sessions
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div>
                        <p className="text-lg font-bold text-github-fg-default">
                          {sessions.filter((s) => s.status === "ready").length}
                        </p>
                        <p className="text-xs text-github-fg-muted">
                          Ready Sessions
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-github-fg-default">
                          {sessions.length}
                        </p>
                        <p className="text-xs text-github-fg-muted">
                          Total Sessions
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        sessions={readySessions}
      />
    </div>
  );
}
