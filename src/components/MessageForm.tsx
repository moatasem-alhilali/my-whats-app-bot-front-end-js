"use client";

import FileUpload from "@/components/ui/FileUpload";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import {
  AntiBanOptions,
  SendMessageRequest,
  UserGuidance,
  whatsappApi,
} from "@/lib/api";
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
  const [showAntiBanSettings, setShowAntiBanSettings] = useState(false);
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

  // Anti-ban settings for both message types
  const [antiBanOptions, setAntiBanOptions] = useState<AntiBanOptions>({
    priority: "normal",
    useQueue: true,
    enableHumanBehavior: true,
    personalizeWith: {},
    variations: [],
  });

  // Personalization fields state
  const [personalizationFields, setPersonalizationFields] = useState<
    Array<{ key: string; value: string }>
  >([]);

  // Message variations state
  const [messageVariations, setMessageVariations] = useState<string[]>([""]);

  // Utility function to prepare anti-ban options
  const prepareAntiBanOptions = (): AntiBanOptions => {
    // Convert personalization fields to object
    const personalizeWith = personalizationFields.reduce((acc, field) => {
      if (field.key && field.value) {
        acc[field.key] = field.value;
      }
      return acc;
    }, {} as Record<string, string>);

    // Filter out empty variations
    const variations = messageVariations.filter((v) => v.trim() !== "");

    return {
      ...antiBanOptions,
      personalizeWith:
        Object.keys(personalizeWith).length > 0 ? personalizeWith : undefined,
      variations: variations.length > 0 ? variations : undefined,
    };
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textData.to || !textData.message) return;

    setLoading(true);

    try {
      const messageWithAntiBan: SendMessageRequest = {
        ...textData,
        antiBanOptions: showAntiBanSettings
          ? prepareAntiBanOptions()
          : undefined,
      };

      const response = await whatsappApi.sendTextMessage(
        sessionId,
        messageWithAntiBan
      );

      if (response.success && response.data) {
        success(
          "Message sent successfully!",
          `Message ID: ${response.data.messageId}${
            showAntiBanSettings ? " (with anti-ban protection)" : ""
          }`
        );
        setTextData({ to: textData.to, message: "" }); // Keep phone number, clear message
        onMessageSent?.(response.data.messageId);
      } else {
        const guidance = (response.data as { userGuidance?: UserGuidance })
          ?.userGuidance;
        if (guidance) {
          const recommendations = guidance.recommendations
            ?.slice(0, 2)
            .join(". ");
          showError(
            guidance.title,
            recommendations
              ? `${guidance.message} ${recommendations}`
              : guidance.message
          );
        } else {
          showError(
            "Failed to send message",
            response.error || "Unknown error occurred"
          );
        }
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
      const mediaWithAntiBan = {
        to: mediaData.to,
        file: mediaData.file as File, // Type assertion safe because of form validation above
        caption: mediaData.caption || undefined,
        antiBanOptions: showAntiBanSettings
          ? prepareAntiBanOptions()
          : undefined,
      };

      const response = await whatsappApi.sendMediaMessage(
        sessionId,
        mediaWithAntiBan
      );

      if (response.success && response.data) {
        success(
          "Media sent successfully!",
          `Message ID: ${response.data.messageId}${
            showAntiBanSettings ? " (with anti-ban protection)" : ""
          }`
        );
        setMediaData({ to: mediaData.to, caption: "", file: null }); // Keep phone number, clear rest
        onMessageSent?.(response.data.messageId);
      } else {
        // Check if response contains user guidance
        const guidance = (response.data as { userGuidance?: UserGuidance })
          ?.userGuidance;

        if (guidance) {
          const recommendations = guidance.recommendations
            ?.slice(0, 2)
            .join(". ");
          showError(
            guidance.title,
            recommendations
              ? `${guidance.message} ${recommendations}`
              : guidance.message
          );
        } else {
          showError(
            "Failed to send media",
            response.error || "Unknown error occurred"
          );
        }
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

              {/* Anti-Ban Settings */}
              <div className="border border-github-border-default rounded-lg bg-github-canvas-subtle">
                <button
                  type="button"
                  onClick={() => setShowAntiBanSettings(!showAntiBanSettings)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-github-canvas-inset transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">🛡️</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-github-fg-default">
                        Anti-Ban Protection
                      </h4>
                      <p className="text-xs text-github-fg-muted">
                        {showAntiBanSettings
                          ? "Configure protection settings"
                          : "Click to enable advanced anti-ban features"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-github-fg-muted transition-transform duration-200 ${
                      showAntiBanSettings ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {showAntiBanSettings && (
                  <div className="border-t border-github-border-muted p-4 space-y-4">
                    {/* Priority and Queue Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-github-fg-default mb-2">
                          Priority
                        </label>
                        <select
                          value={antiBanOptions.priority}
                          onChange={(e) =>
                            setAntiBanOptions((prev) => ({
                              ...prev,
                              priority: e.target.value as
                                | "high"
                                | "normal"
                                | "low",
                            }))
                          }
                          className="w-full px-3 py-2 bg-github-canvas-default border border-github-border-default rounded-md focus:ring-2 focus:ring-[#1f6feb] focus:border-transparent text-github-fg-default"
                          aria-label="Message priority level"
                        >
                          <option value="high">High - Send immediately</option>
                          <option value="normal">
                            Normal - Standard queue
                          </option>
                          <option value="low">
                            Low - Send when load is light
                          </option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="use-queue"
                            checked={antiBanOptions.useQueue}
                            onChange={(e) =>
                              setAntiBanOptions((prev) => ({
                                ...prev,
                                useQueue: e.target.checked,
                              }))
                            }
                            className="rounded border-github-border-default"
                          />
                          <label
                            htmlFor="use-queue"
                            className="text-sm text-github-fg-default"
                          >
                            Use message queue
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="human-behavior"
                            checked={antiBanOptions.enableHumanBehavior}
                            onChange={(e) =>
                              setAntiBanOptions((prev) => ({
                                ...prev,
                                enableHumanBehavior: e.target.checked,
                              }))
                            }
                            className="rounded border-github-border-default"
                          />
                          <label
                            htmlFor="human-behavior"
                            className="text-sm text-github-fg-default"
                          >
                            Simulate human behavior
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Personalization Fields */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-github-fg-default">
                          Personalization Fields
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setPersonalizationFields((prev) => [
                              ...prev,
                              { key: "", value: "" },
                            ])
                          }
                          className="text-xs px-2 py-1 bg-[#1f6feb] text-white rounded hover:bg-[#1a5feb] transition-colors"
                        >
                          + Add Field
                        </button>
                      </div>
                      <div className="space-y-2">
                        {personalizationFields.map((field, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Variable (e.g., name)"
                              value={field.key}
                              onChange={(e) => {
                                const newFields = [...personalizationFields];
                                newFields[index].key = e.target.value;
                                setPersonalizationFields(newFields);
                              }}
                              className="flex-1 px-3 py-2 bg-github-canvas-default border border-github-border-default rounded-md focus:ring-2 focus:ring-[#1f6feb] focus:border-transparent text-github-fg-default text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Value (e.g., John)"
                              value={field.value}
                              onChange={(e) => {
                                const newFields = [...personalizationFields];
                                newFields[index].value = e.target.value;
                                setPersonalizationFields(newFields);
                              }}
                              className="flex-1 px-3 py-2 bg-github-canvas-default border border-github-border-default rounded-md focus:ring-2 focus:ring-[#1f6feb] focus:border-transparent text-github-fg-default text-sm"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setPersonalizationFields((prev) =>
                                  prev.filter((_, i) => i !== index)
                                )
                              }
                              className="px-2 py-2 text-[#da3633] hover:bg-[#da3633]/10 rounded transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        {personalizationFields.length === 0 && (
                          <p className="text-xs text-github-fg-muted italic">
                            Use variables like {"{name}"}, {"{company}"} in your
                            message for personalization
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Message Variations */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-github-fg-default">
                          Message Variations
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setMessageVariations((prev) => [...prev, ""])
                          }
                          className="text-xs px-2 py-1 bg-[#238636] text-white rounded hover:bg-[#1f7a2e] transition-colors"
                        >
                          + Add Variation
                        </button>
                      </div>
                      <div className="space-y-2">
                        {messageVariations.map((variation, index) => (
                          <div key={index} className="flex gap-2">
                            <textarea
                              placeholder={
                                index === 0
                                  ? "Main message (will use the message above if empty)"
                                  : "Alternative message variation"
                              }
                              value={variation}
                              onChange={(e) => {
                                const newVariations = [...messageVariations];
                                newVariations[index] = e.target.value;
                                setMessageVariations(newVariations);
                              }}
                              className="flex-1 px-3 py-2 bg-github-canvas-default border border-github-border-default rounded-md focus:ring-2 focus:ring-[#1f6feb] focus:border-transparent text-github-fg-default text-sm resize-none"
                              rows={2}
                            />
                            {messageVariations.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setMessageVariations((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  )
                                }
                                className="px-2 py-2 text-[#da3633] hover:bg-[#da3633]/10 rounded transition-colors self-start"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        <p className="text-xs text-github-fg-muted">
                          Multiple variations help avoid repetitive patterns.
                          One will be selected randomly.
                        </p>
                      </div>
                    </div>

                    {/* Custom Delay */}
                    <div>
                      <label className="block text-sm font-medium text-github-fg-default mb-2">
                        Custom Delay (seconds)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="3600"
                        placeholder="Leave empty for automatic delay (30-60s)"
                        value={antiBanOptions.delay || ""}
                        onChange={(e) =>
                          setAntiBanOptions((prev) => ({
                            ...prev,
                            delay: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          }))
                        }
                        className="w-full px-3 py-2 bg-github-canvas-default border border-github-border-default rounded-md focus:ring-2 focus:ring-[#1f6feb] focus:border-transparent text-github-fg-default"
                      />
                      <p className="text-xs text-github-fg-muted mt-1">
                        Override automatic delay with custom timing. Leave empty
                        for intelligent delay (recommended).
                      </p>
                    </div>
                  </div>
                )}
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
                    Send Text Message{showAntiBanSettings ? " (Protected)" : ""}
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

              {/* Anti-Ban Settings - Same as text form */}
              <div className="border border-github-border-default rounded-lg bg-github-canvas-subtle">
                <button
                  type="button"
                  onClick={() => setShowAntiBanSettings(!showAntiBanSettings)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-github-canvas-inset transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">🛡️</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-github-fg-default">
                        Anti-Ban Protection
                      </h4>
                      <p className="text-xs text-github-fg-muted">
                        {showAntiBanSettings
                          ? "Configure protection settings"
                          : "Click to enable advanced anti-ban features"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-github-fg-muted transition-transform duration-200 ${
                      showAntiBanSettings ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {showAntiBanSettings && (
                  <div className="border-t border-github-border-muted p-4 space-y-4">
                    <p className="text-xs text-github-fg-muted italic">
                      Anti-ban settings are shared between text and media
                      messages.
                    </p>
                  </div>
                )}
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
                    {showAntiBanSettings ? " (Protected)" : ""}
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
