"use client";

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

  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textData.to || !textData.message) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await whatsappApi.sendTextMessage(sessionId, textData);

      if (response.success && response.data) {
        setSuccess(`Message sent successfully! ID: ${response.data.messageId}`);
        setTextData({ to: textData.to, message: "" }); // Keep phone number, clear message
        onMessageSent?.(response.data.messageId);
      } else {
        setError(response.error || "Failed to send message");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleMediaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaData.to || !mediaData.file) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await whatsappApi.sendMediaMessage(sessionId, {
        to: mediaData.to,
        file: mediaData.file,
        caption: mediaData.caption || undefined,
      });

      if (response.success && response.data) {
        setSuccess(`Media sent successfully! ID: ${response.data.messageId}`);
        setMediaData({ to: mediaData.to, caption: "", file: null }); // Keep phone number, clear rest
        onMessageSent?.(response.data.messageId);
      } else {
        setError(response.error || "Failed to send media");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send media");
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, "");

    // Format as international number
    if (digits.length === 10) {
      return `+1${digits}`; // Default to US
    } else if (digits.length === 11 && digits.startsWith("1")) {
      return `+${digits}`;
    } else if (digits.length > 0 && !digits.startsWith("+")) {
      return `+${digits}`;
    }
    return digits;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border">
      {/* Header */}
      <div className="border-b p-4">
        <h3 className="text-lg font-semibold text-gray-800">Send Message</h3>
        <p className="text-sm text-gray-600 mt-1">
          Session: <span className="font-mono">{sessionId}</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab("text")}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "text"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📝 Text Message
          </button>
          <button
            onClick={() => setActiveTab("media")}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "media"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📎 Media Message
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">✅ {success}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">❌ {error}</p>
          </div>
        )}

        {/* Text Message Form */}
        {activeTab === "text" && (
          <form onSubmit={handleTextSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="text-to"
                className="block text-sm font-medium text-gray-700 mb-2"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={disabled || loading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter phone number with country code (e.g., +1234567890)
              </p>
            </div>

            <div>
              <label
                htmlFor="text-message"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Message
              </label>
              <textarea
                id="text-message"
                rows={4}
                placeholder="Enter your message here..."
                value={textData.message}
                onChange={(e) =>
                  setTextData((prev) => ({ ...prev, message: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={disabled || loading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {textData.message.length}/1000 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={
                disabled || loading || !textData.to || !textData.message
              }
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </span>
              ) : (
                "Send Text Message"
              )}
            </button>
          </form>
        )}

        {/* Media Message Form */}
        {activeTab === "media" && (
          <form onSubmit={handleMediaSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="media-to"
                className="block text-sm font-medium text-gray-700 mb-2"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={disabled || loading}
                required
              />
            </div>

            <div>
              <label
                htmlFor="media-file"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                File
              </label>
              <input
                id="media-file"
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) =>
                  setMediaData((prev) => ({
                    ...prev,
                    file: e.target.files?.[0] || null,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={disabled || loading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported: Images, Videos, Audio, PDF, Word, Excel (Max 10MB)
              </p>
            </div>

            <div>
              <label
                htmlFor="media-caption"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Caption (Optional)
              </label>
              <textarea
                id="media-caption"
                rows={3}
                placeholder="Enter caption for your media..."
                value={mediaData.caption}
                onChange={(e) =>
                  setMediaData((prev) => ({ ...prev, caption: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={disabled || loading}
              />
            </div>

            {mediaData.file && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  <strong>Selected file:</strong> {mediaData.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  Size: {(mediaData.file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={disabled || loading || !mediaData.to || !mediaData.file}
              className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </span>
              ) : (
                "Send Media Message"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
