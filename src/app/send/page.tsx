"use client";

import ConnectionStatus from "@/components/ConnectionStatus";
import MessageForm from "@/components/MessageForm";
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

  const handleMessageSent = (messageId: string) => {
    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: "success" as const,
      message: `Message sent successfully! ID: ${messageId}`,
    };
    setMessageHistory((prev) => [newEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
  };

  const getReadySessions = () => {
    return sessions.filter((s) => s.status === "ready");
  };

  const readySessions = getReadySessions();

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Send Messages
          </h1>
          <p className="mt-2 text-gray-600">
            Send text messages and media files through WhatsApp
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <button
            onClick={loadSessions}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Sessions"}
          </button>
          <Link
            href="/setup"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            New Session
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">❌ {error}</p>
        </div>
      )}

      {/* Session Selector */}
      {!selectedSession && (
        <div className="mb-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Select a Session
              </h3>

              {loading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading sessions...</p>
                </div>
              ) : readySessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📱</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No Ready Sessions
                  </h4>
                  <p className="text-gray-500 mb-4">
                    You need at least one connected session to send messages.
                  </p>
                  <div className="space-x-3">
                    <Link
                      href="/setup"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Create Session
                    </Link>
                    <Link
                      href="/status"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      View Sessions
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {readySessions.map((session) => (
                    <div
                      key={session.id}
                      className="relative group bg-white p-4 border border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedSession(session);
                        router.push(`/send?sessionId=${session.id}`);
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-900">
                            Ready
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            refreshSession(session.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                        >
                          🔄
                        </button>
                      </div>

                      <h4 className="font-medium text-gray-900 mb-2">
                        {session.id}
                      </h4>

                      {session.clientInfo && (
                        <div className="text-sm text-gray-500">
                          <div>{session.clientInfo.pushname}</div>
                          <div className="text-xs font-mono">
                            {session.clientInfo.wid}
                          </div>
                        </div>
                      )}

                      <div className="mt-3">
                        <div className="text-xs text-blue-600 group-hover:text-blue-700">
                          Click to select →
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected Session Interface */}
      {selectedSession && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Message Form */}
          <div className="lg:col-span-2">
            <MessageForm
              sessionId={selectedSession.id}
              onMessageSent={handleMessageSent}
              disabled={selectedSession.status !== "ready"}
            />

            {/* Session Selection */}
            <div className="mt-6 bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Current Session
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedSession(null);
                      router.push("/send");
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Change Session
                  </button>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      selectedSession.status === "ready"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {selectedSession.id}
                    </div>
                    {selectedSession.clientInfo && (
                      <div className="text-sm text-gray-500">
                        {selectedSession.clientInfo.pushname}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => refreshSession(selectedSession.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    🔄
                  </button>
                </div>

                {selectedSession.status !== "ready" && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Session is not ready. Please check the session status
                      and reconnect if needed.
                    </p>
                    <Link
                      href={`/status?sessionId=${selectedSession.id}`}
                      className="text-sm text-yellow-600 hover:text-yellow-700 underline"
                    >
                      Go to session status →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Connection Status */}
            <ConnectionStatus session={selectedSession} />

            {/* Message History */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Activity
                </h3>

                {messageHistory.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-4xl mb-2">💬</div>
                    <p className="text-sm text-gray-500">
                      No messages sent yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messageHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className={`p-3 rounded-lg text-sm ${
                          entry.type === "success"
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                      >
                        <div
                          className={`font-medium ${
                            entry.type === "success"
                              ? "text-green-800"
                              : "text-red-800"
                          }`}
                        >
                          {entry.type === "success" ? "✅" : "❌"}{" "}
                          {entry.message}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {entry.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Link
                    href={`/status?sessionId=${selectedSession.id}`}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    📊 View Session Details
                  </Link>
                  <Link
                    href="/status"
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    📱 All Sessions
                  </Link>
                  <Link
                    href="/setup"
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ➕ Create New Session
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
