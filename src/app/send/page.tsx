"use client";

import ConnectionStatus from "@/components/ConnectionStatus";
import MessageForm from "@/components/MessageForm";
import CommandPalette from "@/components/ui/CommandPalette";
import { StatsSkeleton } from "@/components/ui/LoadingSkeleton";
import StatCard from "@/components/ui/StatCard";
import { whatsappApi, WhatsAppSession } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SendPage() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [selectedSession, setSelectedSession] =
    useState<WhatsAppSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [messageHistory, setMessageHistory] = useState<
    Array<{
      id: string;
      timestamp: Date;
      type: "success" | "error";
      message: string;
    }>
  >([]);
  const [messagesSent, setMessagesSent] = useState(0);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionIdFromUrl = searchParams.get("sessionId");

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (sessionIdFromUrl && sessions.length > 0) {
      const session = sessions.find((s) => s.id === sessionIdFromUrl);
      if (session) {
        setSelectedSession(session);
      }
    }
  }, [sessionIdFromUrl, sessions]);

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

  const handleMessageSent = (messageId: string) => {
    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: "success" as const,
      message: `Message sent successfully! ID: ${messageId}`,
    };
    setMessageHistory((prev) => [newEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
    setMessagesSent((prev) => prev + 1);
  };

  const getReadySessions = () => {
    return sessions.filter((s) => s.status === "ready");
  };

  const readySessions = getReadySessions();
  const totalSessions = sessions.length;
  const connectingSessions = sessions.filter(
    (s) => s.status === "qr" || s.status === "initializing"
  ).length;

  return (
    <div className="min-h-screen bg-github-canvas">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>

      <div className="relative px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] bg-clip-text text-transparent sm:text-4xl">
              Send Messages
            </h1>
            <p className="mt-2 text-github-fg-muted">
              Send text messages and media files through WhatsApp
            </p>
          </div>
          <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-github-border-default rounded-md shadow-sm text-sm font-medium text-github-fg-muted bg-github-canvas-subtle hover:bg-github-canvas-inset focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1f6feb] transition-all duration-200 gap-2"
            >
              <span>🔍</span>
              <kbd className="px-2 py-1 bg-github-canvas-default border border-github-border-muted rounded text-xs">
                ⌘K
              </kbd>
            </button>
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
                "Refresh Sessions"
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

        {/* Stats Cards */}
        <div className="mb-8">
          {loading ? (
            <StatsSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Sessions"
                value={totalSessions}
                icon="📱"
                color="blue"
                change={totalSessions > 0 ? 5 : undefined}
                changeLabel="Available sessions"
              />
              <StatCard
                title="Ready to Send"
                value={readySessions.length}
                icon="✅"
                color="green"
                change={readySessions.length > 0 ? 12 : undefined}
                changeLabel="Connected sessions"
              />
              <StatCard
                title="Messages Sent"
                value={messagesSent}
                icon="📤"
                color="purple"
                change={messagesSent > 0 ? 25 : undefined}
                changeLabel="This session"
              />
              <StatCard
                title="Connecting"
                value={connectingSessions}
                icon="⏳"
                color="yellow"
                change={connectingSessions > 0 ? -8 : undefined}
                changeLabel="Pending connections"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#da3633]/10 border border-[#da3633]/20 rounded-lg backdrop-blur-sm">
            <p className="text-sm text-[#da3633] flex items-center gap-2">
              <span className="text-lg">❌</span>
              {error}
            </p>
          </div>
        )}

        {/* Session Selector */}
        {!selectedSession && (
          <div className="mb-8">
            <div className="bg-github-canvas-subtle shadow-xl rounded-lg border border-github-border-default backdrop-blur-sm">
              <div className="px-6 py-8 sm:p-8">
                <h3 className="text-xl font-semibold text-github-fg-default mb-6">
                  Select a Session
                </h3>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="relative">
                      <div className="w-12 h-12 border-2 border-[#1f6feb] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <div className="w-8 h-8 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin mx-auto absolute top-2 left-1/2 transform -translate-x-1/2"></div>
                    </div>
                    <p className="text-github-fg-muted">Loading sessions...</p>
                  </div>
                ) : readySessions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-6 opacity-20">📱</div>
                    <h4 className="text-xl font-semibold text-github-fg-default mb-3">
                      No Ready Sessions
                    </h4>
                    <p className="text-github-fg-muted mb-6 max-w-md mx-auto">
                      You need at least one connected session to send messages.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link
                        href="/setup"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] hover:from-[#1a5feb] hover:to-[#4fa6ff] transition-all duration-200 hover:shadow-lg hover:shadow-[#1f6feb]/25"
                      >
                        Create Session
                      </Link>
                      <Link
                        href="/status"
                        className="inline-flex items-center px-6 py-3 border border-github-border-default text-sm font-medium rounded-md text-github-fg-default bg-github-canvas-subtle hover:bg-github-canvas-inset transition-all duration-200"
                      >
                        View Sessions
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {readySessions.map((session) => (
                      <div
                        key={session.id}
                        className="group relative bg-github-canvas-default p-6 border border-github-border-default rounded-lg hover:border-[#1f6feb] cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-[#1f6feb]/10 hover:-translate-y-1"
                        onClick={() => {
                          setSelectedSession(session);
                          router.push(`/send?sessionId=${session.id}`);
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-3 h-3 bg-gradient-to-r from-[#238636] to-[#2ea043] rounded-full"></div>
                              <div className="absolute inset-0 w-3 h-3 bg-gradient-to-r from-[#238636] to-[#2ea043] rounded-full animate-pulse"></div>
                            </div>
                            <span className="text-sm font-medium text-[#238636]">
                              Ready
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

                        <h4 className="font-medium text-github-fg-default mb-3 truncate">
                          {session.id}
                        </h4>

                        {session.clientInfo && (
                          <div className="text-sm text-github-fg-muted space-y-1">
                            <div className="truncate">
                              {session.clientInfo.pushname}
                            </div>
                            <div className="font-mono text-xs text-github-fg-subtle">
                              {session.clientInfo.wid}
                            </div>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-r from-[#1f6feb]/5 to-[#58a6ff]/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Message Interface */}
        {selectedSession && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Message Form */}
            <div className="lg:col-span-2">
              <MessageForm
                sessionId={selectedSession.id}
                onMessageSent={handleMessageSent}
                disabled={selectedSession.status !== "ready"}
              />
            </div>

            {/* Session Info & History */}
            <div className="space-y-6">
              {/* Session Info */}
              <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default p-6">
                <h3 className="text-lg font-semibold text-github-fg-default mb-4">
                  Active Session
                </h3>
                <ConnectionStatus session={selectedSession} />
                <div className="mt-4 pt-4 border-t border-github-border-muted">
                  <button
                    onClick={() => {
                      setSelectedSession(null);
                      router.push("/send");
                    }}
                    className="w-full px-4 py-2 text-sm text-github-fg-muted hover:text-github-fg-default border border-github-border-default rounded-md hover:bg-github-canvas-inset transition-all duration-200"
                  >
                    Switch Session
                  </button>
                </div>
              </div>

              {/* Message History */}
              {messageHistory.length > 0 && (
                <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default p-6">
                  <h3 className="text-lg font-semibold text-github-fg-default mb-4">
                    Recent Messages
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                    {messageHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 rounded-lg bg-github-canvas-default border border-github-border-muted"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-github-fg-default flex-1">
                            {entry.message}
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              entry.type === "success"
                                ? "bg-[#238636]/10 text-[#238636]"
                                : "bg-[#da3633]/10 text-[#da3633]"
                            }`}
                          >
                            {entry.type === "success" ? "✓" : "✗"}
                          </span>
                        </div>
                        <p className="text-xs text-github-fg-subtle mt-1">
                          {entry.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        sessions={readySessions}
      />
    </div>
  );
}
