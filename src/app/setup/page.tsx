"use client";

import ConnectionStatus from "@/components/ConnectionStatus";
import QrCodeViewer from "@/components/QrCodeViewer";
import { whatsappApi, WhatsAppSession } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SetupPage() {
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [customSessionId, setCustomSessionId] = useState<string>("");
  const [polling, setPolling] = useState(false);
  const router = useRouter();

  // Poll session status when session is created
  useEffect(() => {
    if (session && polling) {
      const interval = setInterval(async () => {
        try {
          const response = await whatsappApi.getSessionStatus(session.id);
          if (response.success && response.data) {
            setSession(response.data);

            // Stop polling when ready or disconnected
            if (
              response.data.status === "ready" ||
              response.data.status === "disconnected"
            ) {
              setPolling(false);
              if (response.data.status === "ready") {
                // Redirect to status page when ready
                setTimeout(() => {
                  router.push(`/status?sessionId=${session.id}`);
                }, 2000);
              }
            }
          }
        } catch (err) {
          console.error("Error polling session status:", err);
        }
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    }
  }, [session, polling, router]);

  const handleCreateSession = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await whatsappApi.createSession(
        customSessionId || undefined
      );

      if (response.success && response.data) {
        setSession(response.data);
        setPolling(true);
      } else {
        setError(response.error || "Failed to create session");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshQR = async () => {
    if (!session) return;

    try {
      const response = await whatsappApi.getSessionStatus(session.id);
      if (response.success && response.data) {
        setSession(response.data);
      }
    } catch (err) {
      console.error("Error refreshing QR:", err);
    }
  };

  const handleReset = async () => {
    if (session) {
      try {
        await whatsappApi.destroySession(session.id);
      } catch (err) {
        console.error("Error destroying session:", err);
      }
    }

    setSession(null);
    setPolling(false);
    setCustomSessionId("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-github-canvas">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>

      <div className="relative px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] bg-clip-text text-transparent sm:text-4xl">
            Setup WhatsApp Session
          </h1>
          <p className="mt-2 text-github-fg-muted">
            Create a new session and pair your WhatsApp device
          </p>
        </div>

        {!session ? (
          /* Session Creation Form */
          <div className="max-w-lg mx-auto">
            <div className="bg-github-canvas-subtle rounded-lg shadow-xl border border-github-border-default p-8 backdrop-blur-sm">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">📱</span>
                </div>
                <h2 className="text-xl font-semibold text-github-fg-default">
                  Create New Session
                </h2>
                <p className="text-github-fg-muted mt-2">
                  Set up a new WhatsApp connection
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-[#161b22] border border-[#ff6b6b]/20 rounded-lg backdrop-blur-sm">
                  <p className="text-sm text-[#ff6b6b] flex items-center gap-2">
                    <span className="text-lg">❌</span>
                    {error}
                  </p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="sessionId"
                    className="block text-sm font-medium text-github-fg-default mb-2"
                  >
                    Session ID (Optional)
                  </label>
                  <input
                    id="sessionId"
                    type="text"
                    placeholder="e.g., my-whatsapp-session"
                    value={customSessionId}
                    onChange={(e) => setCustomSessionId(e.target.value)}
                    className="w-full px-4 py-3 bg-github-canvas-default border border-github-border-default rounded-lg focus:ring-2 focus:ring-[#1f6feb] focus:border-transparent text-github-fg-default placeholder-github-fg-muted transition-all duration-200"
                    disabled={loading}
                  />
                  <p className="text-xs text-github-fg-muted mt-2 flex items-center gap-1">
                    <span>💡</span>
                    Leave empty to generate a random ID
                  </p>
                </div>

                <button
                  onClick={handleCreateSession}
                  disabled={loading}
                  className="w-full py-3 px-6 bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] text-white rounded-lg hover:from-[#1a5feb] hover:to-[#4fa6ff] focus:ring-2 focus:ring-[#1f6feb] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-[#1f6feb]/25"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="relative">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 w-3 h-3 border-2 border-white/50 border-t-transparent rounded-full animate-spin top-1 left-1"></div>
                      </div>
                      Creating Session...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>🚀</span>
                      Create Session
                    </span>
                  )}
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-github-border-muted">
                <h3 className="font-medium text-github-fg-default mb-3 flex items-center gap-2">
                  <span>📋</span>
                  What happens next?
                </h3>
                <ol className="text-sm text-github-fg-muted space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-[#1f6feb]/20 text-[#1f6feb] rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    Session will be created
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-[#1f6feb]/20 text-[#1f6feb] rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    QR code will be generated
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-[#1f6feb]/20 text-[#1f6feb] rounded-full flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    Scan with your WhatsApp app
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-[#238636]/20 text-[#238636] rounded-full flex items-center justify-center text-xs font-bold">
                      4
                    </span>
                    Start sending messages!
                  </li>
                </ol>
              </div>
            </div>
          </div>
        ) : (
          /* Session Setup Interface */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* QR Code Section */}
            <div>
              <h2 className="text-xl font-semibold mb-6 text-github-fg-default flex items-center gap-2">
                {session.status === "ready" ? (
                  <>
                    <span className="text-[#238636]">✅</span>
                    Connection Successful!
                  </>
                ) : (
                  <>
                    <span>📱</span>
                    Pair Your Device
                  </>
                )}
              </h2>

              {session.status === "ready" ? (
                <div className="bg-gradient-to-br from-[#238636]/10 to-[#2ea043]/5 border border-[#238636]/20 rounded-lg p-8 text-center backdrop-blur-sm">
                  <div className="text-6xl mb-6 animate-bounce">✅</div>
                  <h3 className="text-xl font-semibold text-[#238636] mb-3">
                    WhatsApp Connected!
                  </h3>
                  <p className="text-github-fg-muted mb-6">
                    Your session is ready to use. You can now send messages.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() =>
                        router.push(`/send?sessionId=${session.id}`)
                      }
                      className="px-6 py-3 bg-gradient-to-r from-[#238636] to-[#2ea043] text-white rounded-lg hover:from-[#1f7a2e] hover:to-[#26893b] transition-all duration-200 hover:shadow-lg hover:shadow-[#238636]/25"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>💬</span>
                        Send Messages
                      </span>
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/status?sessionId=${session.id}`)
                      }
                      className="px-6 py-3 border border-github-border-default text-github-fg-default rounded-lg hover:bg-github-canvas-inset transition-all duration-200"
                    >
                      View Status
                    </button>
                  </div>
                </div>
              ) : (
                <QrCodeViewer
                  qrCode={session.qrCode}
                  sessionId={session.id}
                  onRefresh={handleRefreshQR}
                />
              )}

              {session.status !== "ready" && (
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleRefreshQR}
                    className="flex-1 px-4 py-2 border border-github-border-default text-github-fg-default rounded-lg hover:bg-github-canvas-inset transition-all duration-200"
                  >
                    🔄 Refresh QR
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 px-4 py-2 border border-[#da3633]/20 text-[#da3633] rounded-lg hover:bg-[#da3633]/5 transition-all duration-200"
                  >
                    🗑️ Reset
                  </button>
                </div>
              )}
            </div>

            {/* Session Status */}
            <div>
              <h2 className="text-xl font-semibold mb-6 text-github-fg-default flex items-center gap-2">
                <span>📊</span>
                Session Status
              </h2>
              <ConnectionStatus session={session} />

              {polling && session.status !== "ready" && (
                <div className="mt-6 p-4 bg-[#1f6feb]/10 border border-[#1f6feb]/20 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-5 h-5 border-2 border-[#1f6feb] border-t-transparent rounded-full animate-spin"></div>
                      <div className="absolute inset-0 w-3 h-3 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin top-1 left-1"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1f6feb]">
                        Waiting for connection...
                      </p>
                      <p className="text-xs text-github-fg-muted">
                        Scan the QR code with your WhatsApp app
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {session.status === "ready" && (
                <div className="mt-6 p-4 bg-[#238636]/10 border border-[#238636]/20 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-[#238636] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#238636]">
                        Ready to send messages!
                      </p>
                      <p className="text-xs text-github-fg-muted">
                        Connection established successfully
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {session.status === "ready" && (
                <div className="mt-6 p-4 bg-github-canvas-subtle border border-github-border-default rounded-lg">
                  <h3 className="text-sm font-medium text-github-fg-default mb-3">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() =>
                        router.push(`/send?sessionId=${session.id}`)
                      }
                      className="w-full text-left px-3 py-2 text-sm text-github-fg-default hover:bg-github-canvas-inset rounded-lg transition-all duration-200 flex items-center gap-2"
                    >
                      <span>💬</span>
                      Send Messages
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/status?sessionId=${session.id}`)
                      }
                      className="w-full text-left px-3 py-2 text-sm text-github-fg-default hover:bg-github-canvas-inset rounded-lg transition-all duration-200 flex items-center gap-2"
                    >
                      <span>📊</span>
                      View Details
                    </button>
                    <button
                      onClick={() => router.push("/status")}
                      className="w-full text-left px-3 py-2 text-sm text-github-fg-default hover:bg-github-canvas-inset rounded-lg transition-all duration-200 flex items-center gap-2"
                    >
                      <span>📱</span>
                      All Sessions
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
