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
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    switch (status) {
      case "ready":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "authenticated":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "qr":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "initializing":
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case "disconnected":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Session Status
          </h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage your WhatsApp sessions
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <button
            onClick={loadSessions}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh All"}
          </button>
          <Link
            href="/setup"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            New Session
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">✅ {success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">❌ {error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sessions List */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                All Sessions
              </h3>

              {loading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📱</div>
                  <p className="text-gray-500 text-sm mb-3">
                    No sessions found
                  </p>
                  <Link
                    href="/setup"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                  >
                    Create Session
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSession?.id === session.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        setSelectedSession(session);
                        router.push(`/status?sessionId=${session.id}`);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {session.id}
                        </div>
                        <div className={getStatusBadge(session.status)}>
                          {session.status}
                        </div>
                      </div>
                      {session.clientInfo && (
                        <div className="text-xs text-gray-500">
                          {session.clientInfo.pushname}
                        </div>
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
              {/* Connection Status */}
              <ConnectionStatus session={selectedSession} />

              {/* Actions */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Actions
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Refresh Status */}
                    <button
                      onClick={() => refreshSession(selectedSession.id)}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      🔄 Refresh Status
                    </button>

                    {/* Send Message (only if ready) */}
                    {selectedSession.status === "ready" && (
                      <Link
                        href={`/send?sessionId=${selectedSession.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        💬 Send Message
                      </Link>
                    )}

                    {/* Logout */}
                    {(selectedSession.status === "ready" ||
                      selectedSession.status === "authenticated") && (
                      <button
                        onClick={() => handleLogout(selectedSession.id)}
                        disabled={actionLoading === selectedSession.id}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                      >
                        {actionLoading === selectedSession.id
                          ? "⏳ Logging out..."
                          : "🚪 Logout"}
                      </button>
                    )}

                    {/* Reconnect (only if disconnected) */}
                    {selectedSession.status === "disconnected" && (
                      <Link
                        href={`/setup?reconnect=${selectedSession.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        🔄 Reconnect
                      </Link>
                    )}

                    {/* Destroy Session */}
                    <button
                      onClick={() => handleDestroy(selectedSession.id)}
                      disabled={actionLoading === selectedSession.id}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {actionLoading === selectedSession.id
                        ? "⏳ Destroying..."
                        : "🗑️ Destroy"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Session Details */}
              {selectedSession.clientInfo && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Device Information
                    </h3>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Display Name
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {selectedSession.clientInfo.pushname}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          WhatsApp ID
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 font-mono">
                          {selectedSession.clientInfo.wid}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Platform
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {selectedSession.clientInfo.platform}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Session ID
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 font-mono">
                          {selectedSession.id}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📱</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Session
                  </h3>
                  <p className="text-gray-500">
                    Choose a session from the list to view details and manage it
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
