"use client";

import FileUpload from "@/components/ui/FileUpload";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { SendMessageRequest, whatsappApi } from "@/lib/api";
import { useState } from "react";

interface MessageFormProps {
  sessionId: string;
  onMessageSent?: (messageId: string) => void;
  disabled?: boolean;
}

export default function MessageForm({
  sessionId,
  onMessageSent,
  disabled,
}: MessageFormProps) {
  const [activeTab, setActiveTab] = useState<"text" | "media">("text");
  const [loading, setLoading] = useState(false);
  const { toasts, removeToast, success, error: showError } = useToast();

  // Text message state
  const [textData, setTextData] = useState<SendMessageRequest>({
    to: "",
    message: "",
  });

  // Media message state
  const [mediaData, setMediaData] = useState({
    to: "",
    caption: "",
    file: null as File | null,
  });

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textData.to || !textData.message) return;

    setLoading(true);

    try {
      const response = await whatsappApi.sendTextMessage(sessionId, textData);

      if (response.success && response.data) {
        success(
          "Message sent successfully!",
          `Message ID: ${response.data.messageId}`
        );
        setTextData({ to: textData.to, message: "" }); // Keep phone number, clear message
        onMessageSent?.(response.data.messageId);
      } else {
        showError(
          "Failed to send message",
          response.error || "Unknown error occurred"
        );
      }
    } catch (err) {
      showError(
        "Network error",
        err instanceof Error ? err.message : "Failed to send message"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMediaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaData.to || !mediaData.file) return;

    setLoading(true);

    try {
      const response = await whatsappApi.sendMediaMessage(sessionId, {
        to: mediaData.to,
        file: mediaData.file,
        caption: mediaData.caption || undefined,
      });

      if (response.success && response.data) {
        success(
          "Media sent successfully!",
          `Message ID: ${response.data.messageId}`
        );
        setMediaData({ to: mediaData.to, caption: "", file: null }); // Keep phone number, clear rest
        onMessageSent?.(response.data.messageId);
      } else {
        showError(
          "Failed to send media",
          response.error || "Unknown error occurred"
        );
      }
    } catch (err) {
      showError(
        "Network error",
        err instanceof Error ? err.message : "Failed to send media"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-github-canvas-subtle rounded-lg shadow-xl border border-github-border-default backdrop-blur-sm">
        {/* Header */}
        <div className="border-b border-github-border-muted p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">💬</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-github-fg-default">
                Send Message
              </h3>
              <p className="text-sm text-github-fg-muted">
                Session:{" "}
                <span className="font-mono text-[#1f6feb]">{sessionId}</span>
              </p>
            </div>
          </div>

          {disabled && (
            <div className="mt-4 p-3 bg-[#f85149]/10 border border-[#f85149]/20 rounded-lg">
              <p className="text-sm text-[#f85149] flex items-center gap-2">
                <span>⚠️</span>
                Session is not ready. Please ensure the session is connected.
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-github-border-muted">
          <div className="flex">
            <button
              onClick={() => setActiveTab("text")}
              className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200 ${
                activeTab === "text"
                  ? "border-[#1f6feb] text-[#1f6feb] bg-[#1f6feb]/5"
                  : "border-transparent text-github-fg-muted hover:text-github-fg-default hover:bg-github-canvas-inset"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>📝</span>
                Text Message
              </span>
            </button>
            <button
              onClick={() => setActiveTab("media")}
              className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200 ${
                activeTab === "media"
                  ? "border-[#1f6feb] text-[#1f6feb] bg-[#1f6feb]/5"
                  : "border-transparent text-github-fg-muted hover:text-github-fg-default hover:bg-github-canvas-inset"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>📎</span>
                Media Message
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Text Message Form */}
          {activeTab === "text" && (
            <form onSubmit={handleTextSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="text-to"
                  className="block text-sm font-medium text-github-fg-default mb-2"
                >
                  Phone Number
                </label>
                <input
                  id="text-to"
                  type="text"
                  placeholder="e.g., +1234567890 or 1234567890"
                  value={textData.to}
                  onChange={(e) =>
                    setTextData((prev) => ({ ...prev, to: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-github-canvas-default border border-github-border-default rounded-lg focus:ring-2 focus:ring-[#1f6feb] focus:border-transparent text-github-fg-default placeholder-github-fg-muted transition-all duration-200"
                  disabled={disabled || loading}
                  required
                />
                <p className="text-xs text-github-fg-muted mt-2 flex items-center gap-1">
                  <span>💡</span>
                  Enter phone number with country code (e.g., +1234567890)
                </p>
              </div>

              <div>
                <label
                  htmlFor="text-message"
                  className="block text-sm font-medium text-github-fg-default mb-2"
                >
                  Message
                </label>
                <textarea
                  id="text-message"
                  rows={4}
                  placeholder="Enter your message here..."
                  value={textData.message}
                  onChange={(e) =>
                    setTextData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-github-canvas-default border border-github-border-default rounded-lg focus:ring-2 focus:ring-[#1f6feb] focus:border-transparent text-github-fg-default placeholder-github-fg-muted resize-none transition-all duration-200"
                  disabled={disabled || loading}
                  required
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-github-fg-muted">
                    {textData.message.length} characters
                  </p>
                  <p className="text-xs text-github-fg-muted">
                    Max: 4096 characters
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  disabled || loading || !textData.to || !textData.message
                }
                className="w-full py-3 px-6 bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] text-white rounded-lg hover:from-[#1a5feb] hover:to-[#4fa6ff] focus:ring-2 focus:ring-[#1f6feb] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-[#1f6feb]/25"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="relative">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <div className="absolute inset-0 w-3 h-3 border-2 border-white/50 border-t-transparent rounded-full animate-spin top-1 left-1"></div>
                    </div>
                    Sending Message...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>📤</span>
                    Send Text Message
                  </span>
                )}
              </button>
            </form>
          )}

          {/* Media Message Form */}
          {activeTab === "media" && (
            <form onSubmit={handleMediaSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="media-to"
                  className="block text-sm font-medium text-github-fg-default mb-2"
                >
                  Phone Number
                </label>
                <input
                  id="media-to"
                  type="text"
                  placeholder="e.g., +1234567890 or 1234567890"
                  value={mediaData.to}
                  onChange={(e) =>
                    setMediaData((prev) => ({ ...prev, to: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-github-canvas-default border border-github-border-default rounded-lg focus:ring-2 focus:ring-[#1f6feb] focus:border-transparent text-github-fg-default placeholder-github-fg-muted transition-all duration-200"
                  disabled={disabled || loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-github-fg-default mb-2">
                  File
                </label>
                <FileUpload
                  onFileSelect={(file) =>
                    setMediaData((prev) => ({ ...prev, file }))
                  }
                  currentFile={mediaData.file}
                  disabled={disabled || loading}
                  maxSize={16}
                />
              </div>

              <div>
                <label
                  htmlFor="media-caption"
                  className="block text-sm font-medium text-github-fg-default mb-2"
                >
                  Caption (Optional)
                </label>
                <textarea
                  id="media-caption"
                  rows={3}
                  placeholder="Add a caption to your media..."
                  value={mediaData.caption}
                  onChange={(e) =>
                    setMediaData((prev) => ({
                      ...prev,
                      caption: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-github-canvas-default border border-github-border-default rounded-lg focus:ring-2 focus:ring-[#1f6feb] focus:border-transparent text-github-fg-default placeholder-github-fg-muted resize-none transition-all duration-200"
                  disabled={disabled || loading}
                />
              </div>

              <button
                type="submit"
                disabled={
                  disabled || loading || !mediaData.to || !mediaData.file
                }
                className="w-full py-3 px-6 bg-gradient-to-r from-[#238636] to-[#2ea043] text-white rounded-lg hover:from-[#1f7a2e] hover:to-[#26893b] focus:ring-2 focus:ring-[#238636] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-[#238636]/25"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="relative">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <div className="absolute inset-0 w-3 h-3 border-2 border-white/50 border-t-transparent rounded-full animate-spin top-1 left-1"></div>
                    </div>
                    Sending Media...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>🚀</span>
                    Send Media Message
                  </span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
