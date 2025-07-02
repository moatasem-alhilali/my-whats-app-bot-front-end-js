"use client";

import { whatsappApi, WhatsAppSession } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

// Modern card component inspired by reactbits.dev
function StatsCard({
  title,
  value,
  icon,
  color,
  trend,
  description,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
  trend?: { direction: "up" | "down" | "stable"; percentage: number };
  description: string;
}) {
  const colorClasses = {
    blue: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    green: "from-green-500/20 to-emerald-500/20 border-green-500/30",
    yellow: "from-yellow-500/20 to-orange-500/20 border-yellow-500/30",
    red: "from-red-500/20 to-pink-500/20 border-red-500/30",
  };

  return (
    <div
      className={`card-hover bg-gradient-to-br ${
        colorClasses[color as keyof typeof colorClasses]
      } rounded-xl p-6 hover-lift`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className="text-2xl">{icon}</div>
            <h3 className="text-sm font-medium text-gray-400">{title}</h3>
          </div>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-white">{value}</p>
            {trend && (
              <span
                className={`text-sm font-medium ${
                  trend.direction === "up"
                    ? "text-green-400"
                    : trend.direction === "down"
                    ? "text-red-400"
                    : "text-gray-400"
                }`}
              >
                {trend.direction === "up"
                  ? "↗"
                  : trend.direction === "down"
                  ? "↘"
                  : "→"}{" "}
                {trend.percentage}%
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">{description}</p>
        </div>
      </div>
    </div>
  );
}

// Action card component
function ActionCard({
  title,
  description,
  icon,
  href,
  gradient,
  badge,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
  gradient: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden bg-[#161b22] border border-[#21262d] rounded-xl p-6 hover-lift card-hover transition-all duration-300"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
      ></div>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl`}
          >
            {icon}
          </div>
          {badge && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
        <div className="mt-4 flex items-center text-blue-400 text-sm font-medium">
          Get started
          <svg
            className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}

// Activity indicator component
function ActivityIndicator({ sessions }: { sessions: WhatsAppSession[] }) {
  const recentActivity =
    sessions.filter((s) => s.status === "ready").length > 0;

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`w-2 h-2 rounded-full ${
          recentActivity ? "bg-green-500 animate-pulse" : "bg-gray-500"
        }`}
      ></div>
      <span className="text-xs text-gray-400">
        {recentActivity ? "Active sessions detected" : "No active sessions"}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadSessions();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSessions, 30000);
    return () => clearInterval(interval);
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

  const getStatusStats = () => {
    const stats = {
      total: sessions.length,
      ready: sessions.filter((s) => s.status === "ready").length,
      connecting: sessions.filter((s) =>
        ["initializing", "qr", "authenticated"].includes(s.status)
      ).length,
      disconnected: sessions.filter((s) => s.status === "disconnected").length,
    };
    return stats;
  };

  const stats = getStatusStats();

  if (loading && sessions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-[#21262d] border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div
              className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-green-500 rounded-full animate-spin mx-auto"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Loading Dashboard
          </h2>
          <p className="text-gray-400">Fetching your WhatsApp sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#161b22] via-[#0d1117] to-[#161b22] border-b border-[#21262d]">
        <div className="absolute inset-0 grid-pattern opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-400 text-sm font-medium px-4 py-2 rounded-full border border-blue-500/30 mb-6">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              <span>Dashboard Overview</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              WhatsApp
              <span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                {" "}
                Dashboard
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Manage your WhatsApp sessions, monitor connections, and send
              messages with a modern, GitHub-inspired interface.
            </p>
            <ActivityIndicator sessions={sessions} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="text-red-400">⚠️</span>
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Sessions"
            value={stats.total}
            icon="📱"
            color="blue"
            description="All registered sessions"
            trend={{ direction: "stable", percentage: 0 }}
          />
          <StatsCard
            title="Ready to Use"
            value={stats.ready}
            icon="✅"
            color="green"
            description="Connected and active"
            trend={
              stats.ready > 0 ? { direction: "up", percentage: 100 } : undefined
            }
          />
          <StatsCard
            title="Connecting"
            value={stats.connecting}
            icon="⏳"
            color="yellow"
            description="Pairing or initializing"
            trend={
              stats.connecting > 0
                ? { direction: "up", percentage: 50 }
                : undefined
            }
          />
          <StatsCard
            title="Disconnected"
            value={stats.disconnected}
            icon="❌"
            color="red"
            description="Offline or failed"
            trend={
              stats.disconnected > 0
                ? { direction: "down", percentage: 25 }
                : undefined
            }
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
            <button
              onClick={loadSessions}
              disabled={loading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#21262d] text-gray-300 rounded-lg hover:bg-[#2d333b] transition-colors disabled:opacity-50"
            >
              <svg
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{loading ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ActionCard
              title="Setup New Session"
              description="Create a new WhatsApp session and pair your device with QR code scanning"
              icon="🔗"
              href="/setup"
              gradient="from-blue-500 to-blue-600"
              badge="Primary"
            />
            <ActionCard
              title="Monitor Status"
              description="Check connection status, view session details, and manage active connections"
              icon="📊"
              href="/status"
              gradient="from-green-500 to-green-600"
            />
            <ActionCard
              title="Send Messages"
              description="Send text messages and media files to contacts through active sessions"
              icon="💬"
              href="/send"
              gradient="from-purple-500 to-purple-600"
            />
          </div>
        </div>

        {/* Sessions Overview */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">
              Active Sessions
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <h4 className="text-lg font-medium text-white mb-2">
                No sessions found
              </h4>
              <p className="text-gray-400 mb-6">
                Get started by creating your first WhatsApp session
              </p>
              <Link
                href="/setup"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <span>Create Session</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-[#0d1117] border border-[#21262d] rounded-lg hover:border-[#30363d] transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        session.status === "ready"
                          ? "bg-green-500"
                          : session.status === "disconnected"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      } animate-pulse`}
                    ></div>
                    <div>
                      <p className="text-sm font-medium text-white font-mono">
                        {session.id}
                      </p>
                      <p className="text-xs text-gray-400">
                        {session.clientInfo?.pushname || "No device info"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        session.status === "ready"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : session.status === "disconnected"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      }`}
                    >
                      {session.status}
                    </span>
                    <Link
                      href={`/status?sessionId=${session.id}`}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}

              {sessions.length > 5 && (
                <div className="text-center pt-4">
                  <Link
                    href="/status"
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
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
  );
}
