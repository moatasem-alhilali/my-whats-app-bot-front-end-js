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
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Setup WhatsApp Session
        </h1>
        <p className="mt-2 text-gray-600">
          Create a new session and pair your WhatsApp device
        </p>
      </div>

      {!session ? (
        /* Session Creation Form */
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg border p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Create New Session
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">❌ {error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="sessionId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Session ID (Optional)
                </label>
                <input
                  id="sessionId"
                  type="text"
                  placeholder="e.g., my-whatsapp-session"
                  value={customSessionId}
                  onChange={(e) => setCustomSessionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to generate a random ID
                </p>
              </div>

              <button
                onClick={handleCreateSession}
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Session...
                  </span>
                ) : (
                  "Create Session"
                )}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">
                What happens next?
              </h3>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Session will be created</li>
                <li>2. QR code will be generated</li>
                <li>3. Scan with your WhatsApp app</li>
                <li>4. Start sending messages!</li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        /* Session Setup Interface */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              {session.status === "ready"
                ? "Connection Successful!"
                : "Pair Your Device"}
            </h2>

            {session.status === "ready" ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  WhatsApp Connected!
                </h3>
                <p className="text-green-700 mb-4">
                  Your session is ready to use. You can now send messages.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push(`/send?sessionId=${session.id}`)}
                    className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Start Messaging
                  </button>
                  <div className="text-sm text-green-600">
                    Redirecting to status page in 2 seconds...
                  </div>
                </div>
              </div>
            ) : session.status === "disconnected" ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <div className="text-6xl mb-4">❌</div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Connection Failed
                </h3>
                <p className="text-red-700 mb-4">
                  The session could not be established. Please try again.
                </p>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <QrCodeViewer
                qrCode={session.qrCode}
                sessionId={session.id}
                onRefresh={handleRefreshQR}
              />
            )}
          </div>

          {/* Status Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Session Status
            </h2>
            <ConnectionStatus session={session} />

            {session.status !== "ready" &&
              session.status !== "disconnected" && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-800">
                      Status Updates
                    </span>
                  </div>
                  <p className="text-xs text-blue-700">
                    Monitoring session status every 2 seconds...
                  </p>
                </div>
              )}

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={() => router.push("/status")}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                View All Sessions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
