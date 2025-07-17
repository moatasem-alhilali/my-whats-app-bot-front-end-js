"use client";

import { useState } from "react";

interface AntiBanSettingsProps {
  onSettingsChange?: (settings: AntiBanConfig) => void;
  initialSettings?: AntiBanConfig;
}

interface AntiBanConfig {
  enabled: boolean;
  protectionLevel: "conservative" | "balanced" | "aggressive";
  dailyMessageLimit: number;
  dailyContactLimit: number;
  messageDelayMin: number;
  messageDelayMax: number;
  enableTypingSimulation: boolean;
  enableSeenSimulation: boolean;
  enableHumanBehavior: boolean;
  stopOnWarning: boolean;
  randomizeUserAgent: boolean;
  enableQueueByDefault: boolean;
  defaultPriority: "high" | "normal" | "low";
}

const defaultSettings: AntiBanConfig = {
  enabled: true,
  protectionLevel: "balanced",
  dailyMessageLimit: 200,
  dailyContactLimit: 50,
  messageDelayMin: 30,
  messageDelayMax: 60,
  enableTypingSimulation: true,
  enableSeenSimulation: true,
  enableHumanBehavior: true,
  stopOnWarning: true,
  randomizeUserAgent: false,
  enableQueueByDefault: true,
  defaultPriority: "normal",
};

export default function AntiBanSettings({
  onSettingsChange,
  initialSettings = defaultSettings,
}: AntiBanSettingsProps) {
  const [settings, setSettings] = useState<AntiBanConfig>(initialSettings);
  const [activeTab, setActiveTab] = useState<
    "general" | "limits" | "behavior" | "advanced"
  >("general");
  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = <K extends keyof AntiBanConfig>(
    key: K,
    value: AntiBanConfig[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasChanges(true);
    onSettingsChange?.(newSettings);
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    onSettingsChange?.(defaultSettings);
  };

  const getProtectionLevelDescription = (level: string) => {
    switch (level) {
      case "conservative":
        return "Maximum protection with longer delays and stricter limits. Safest option but slower.";
      case "balanced":
        return "Good balance between protection and speed. Recommended for most users.";
      case "aggressive":
        return "Minimal delays for faster sending. Higher risk but more efficient.";
      default:
        return "";
    }
  };

  const getProtectionLevelColor = (level: string) => {
    switch (level) {
      case "conservative":
        return "from-[#238636] to-[#2ea043]";
      case "balanced":
        return "from-[#1f6feb] to-[#58a6ff]";
      case "aggressive":
        return "from-[#da3633] to-[#f85149]";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const ariaChecked = settings.enabled ? "true" : "false";

  return (
    <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default">
      {/* Header */}
      <div className="p-6 border-b border-github-border-muted">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">⚙️</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-github-fg-default">
                Anti-Ban Settings
              </h2>
              <p className="text-sm text-github-fg-muted">
                Configure global protection settings for all sessions
              </p>
            </div>
          </div>

          {/* Master Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-github-fg-default">Protection</span>
            <button
              type="button"
              onClick={() => updateSetting("enabled", !settings.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enabled ? "bg-[#238636]" : "bg-gray-300"
              }`}
              title={`${
                settings.enabled ? "Disable" : "Enable"
              } anti-ban protection`}
              aria-label={`${
                settings.enabled ? "Disable" : "Enable"
              } anti-ban protection`}
              role="switch"
              aria-checked={ariaChecked}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {hasChanges && (
          <div className="mt-4 p-3 bg-[#fb8500]/10 border border-[#fb8500]/20 rounded-lg">
            <p className="text-sm text-[#fb8500] flex items-center gap-2">
              <span>⚠️</span>
              Settings have been modified. Changes will apply to new sessions
              and messages.
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-github-border-muted">
        <div className="flex">
          {[
            { id: "general", label: "General", icon: "🎛️" },
            { id: "limits", label: "Limits", icon: "📊" },
            { id: "behavior", label: "Behavior", icon: "🤖" },
            { id: "advanced", label: "Advanced", icon: "⚡" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(
                  tab.id as "general" | "limits" | "behavior" | "advanced"
                )
              }
              className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? "border-[#1f6feb] text-[#1f6feb] bg-[#1f6feb]/5"
                  : "border-transparent text-github-fg-muted hover:text-github-fg-default hover:bg-github-canvas-inset"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{tab.icon}</span>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* General Tab */}
        {activeTab === "general" && (
          <div className="space-y-6">
            {/* Protection Level */}
            <div>
              <h3 className="text-lg font-semibold text-github-fg-default mb-4">
                Protection Level
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["conservative", "balanced", "aggressive"].map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      updateSetting(
                        "protectionLevel",
                        level as "conservative" | "balanced" | "aggressive"
                      )
                    }
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      settings.protectionLevel === level
                        ? "border-[#1f6feb] bg-[#1f6feb]/5"
                        : "border-github-border-default hover:border-github-border-muted"
                    }`}
                  >
                    <div
                      className={`w-full h-2 rounded-full mb-3 bg-gradient-to-r ${getProtectionLevelColor(
                        level
                      )}`}
                    ></div>
                    <h4 className="font-medium text-github-fg-default capitalize mb-2">
                      {level}
                    </h4>
                    <p className="text-sm text-github-fg-muted">
                      {getProtectionLevelDescription(level)}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Toggles */}
            <div>
              <h3 className="text-lg font-semibold text-github-fg-default mb-4">
                Quick Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-github-canvas-default rounded-lg border border-github-border-default">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-github-fg-default">
                      Enable Message Queue
                    </span>
                    <input
                      type="checkbox"
                      id="enableQueueByDefault"
                      checked={settings.enableQueueByDefault}
                      onChange={(e) =>
                        updateSetting("enableQueueByDefault", e.target.checked)
                      }
                      className="rounded border-github-border-default"
                      aria-label="Enable message queue by default"
                    />
                  </div>
                  <p className="text-xs text-github-fg-muted">
                    Process messages through queue system by default
                  </p>
                </div>

                <div className="p-4 bg-github-canvas-default rounded-lg border border-github-border-default">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-github-fg-default">
                      Stop on Warnings
                    </span>
                    <input
                      type="checkbox"
                      id="stopOnWarning"
                      checked={settings.stopOnWarning}
                      onChange={(e) =>
                        updateSetting("stopOnWarning", e.target.checked)
                      }
                      className="rounded border-github-border-default"
                      aria-label="Stop on ban warnings"
                    />
                  </div>
                  <p className="text-xs text-github-fg-muted">
                    Automatically stop sending when ban warnings detected
                  </p>
                </div>
              </div>
            </div>

            {/* Default Priority */}
            <div>
              <h3 className="text-lg font-semibold text-github-fg-default mb-4">
                Default Message Priority
              </h3>
              <select
                id="defaultPriority"
                value={settings.defaultPriority}
                onChange={(e) =>
                  updateSetting(
                    "defaultPriority",
                    e.target.value as "high" | "normal" | "low"
                  )
                }
                className="w-full md:w-auto px-4 py-2 bg-github-canvas-default border border-github-border-default rounded-lg focus:ring-2 focus:ring-[#1f6feb] focus:border-transparent text-github-fg-default"
                aria-label="Default message priority"
              >
                <option value="high">High Priority - Send immediately</option>
                <option value="normal">Normal Priority - Standard queue</option>
                <option value="low">
                  Low Priority - Send when load is light
                </option>
              </select>
            </div>
          </div>
        )}

        {/* Limits Tab */}
        {activeTab === "limits" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Daily Message Limit */}
              <div>
                <label className="block text-sm font-medium text-github-fg-default mb-2">
                  Daily Message Limit
                </label>
                <input
                  type="number"
                  id="dailyMessageLimit"
                  min="1"
                  max="1000"
                  value={settings.dailyMessageLimit}
                  onChange={(e) =>
                    updateSetting("dailyMessageLimit", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 bg-github-canvas-default border border-github-border-default rounded-lg focus:ring-2 focus:ring-[#1f6feb] focus:border-transparent text-github-fg-default"
                  aria-label="Daily message limit"
                />
                <p className="text-xs text-github-fg-muted mt-1">
                  Maximum messages per session per day
                </p>
              </div>

              {/* Daily Contact Limit */}
              <div>
                <label className="block text-sm font-medium text-github-fg-default mb-2">
                  Daily New Contact Limit
                </label>
                <input
                  type="number"
                  id="dailyContactLimit"
                  min="1"
                  max="200"
                  value={settings.dailyContactLimit}
                  onChange={(e) =>
                    updateSetting("dailyContactLimit", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 bg-github-canvas-default border border-github-border-default rounded-lg focus:ring-2 focus:ring-[#1f6feb] focus:border-transparent text-github-fg-default"
                  aria-label="Daily new contact limit"
                />
                <p className="text-xs text-github-fg-muted mt-1">
                  Maximum new contacts to message per day
                </p>
              </div>

              {/* Message Delay Min */}
              <div>
                <label className="block text-sm font-medium text-github-fg-default mb-2">
                  Minimum Delay (seconds)
                </label>
                <input
                  type="number"
                  id="messageDelayMin"
                  min="1"
                  max="300"
                  value={settings.messageDelayMin}
                  onChange={(e) =>
                    updateSetting("messageDelayMin", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 bg-github-canvas-default border border-github-border-default rounded-lg focus:ring-2 focus:ring-[#1f6feb] focus:border-transparent text-github-fg-default"
                  aria-label="Minimum delay between messages in seconds"
                />
                <p className="text-xs text-github-fg-muted mt-1">
                  Minimum delay between messages
                </p>
              </div>

              {/* Message Delay Max */}
              <div>
                <label className="block text-sm font-medium text-github-fg-default mb-2">
                  Maximum Delay (seconds)
                </label>
                <input
                  type="number"
                  id="messageDelayMax"
                  min={settings.messageDelayMin}
                  max="600"
                  value={settings.messageDelayMax}
                  onChange={(e) =>
                    updateSetting("messageDelayMax", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 bg-github-canvas-default border border-github-border-default rounded-lg focus:ring-2 focus:ring-[#1f6feb] focus:border-transparent text-github-fg-default"
                  aria-label="Maximum delay between messages in seconds"
                />
                <p className="text-xs text-github-fg-muted mt-1">
                  Maximum delay between messages
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Behavior Tab */}
        {activeTab === "behavior" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-github-fg-default mb-4">
              Human Behavior Simulation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  key: "enableHumanBehavior",
                  title: "General Human Behavior",
                  description:
                    "Simulate natural human patterns like reading time and response delays",
                },
                {
                  key: "enableTypingSimulation",
                  title: "Typing Indicators",
                  description: "Show typing indicator before sending messages",
                },
                {
                  key: "enableSeenSimulation",
                  title: "Message Reading",
                  description: "Automatically mark received messages as read",
                },
                {
                  key: "randomizeUserAgent",
                  title: "Randomize User Agent",
                  description:
                    "Use different browser signatures to avoid detection",
                },
              ].map((option) => (
                <div
                  key={option.key}
                  className="p-4 bg-github-canvas-default rounded-lg border border-github-border-default"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-github-fg-default">
                      {option.title}
                    </span>
                    <input
                      type="checkbox"
                      id={`behavior-${option.key}`}
                      checked={
                        settings[option.key as keyof AntiBanConfig] as boolean
                      }
                      onChange={(e) =>
                        updateSetting(
                          option.key as keyof AntiBanConfig,
                          e.target.checked
                        )
                      }
                      className="rounded border-github-border-default"
                      aria-label={option.title}
                    />
                  </div>
                  <p className="text-xs text-github-fg-muted">
                    {option.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === "advanced" && (
          <div className="space-y-6">
            <div className="p-4 bg-[#fb8500]/10 border border-[#fb8500]/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚠️</span>
                <span className="text-sm font-medium text-[#fb8500]">
                  Advanced Settings
                </span>
              </div>
              <p className="text-sm text-github-fg-default">
                These settings are for advanced users only. Changing these
                values incorrectly may increase the risk of account
                restrictions.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-github-canvas-default rounded-lg border border-github-border-default p-4">
                <h4 className="text-sm font-medium text-github-fg-default mb-3">
                  Current Configuration Summary
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-github-fg-muted">
                      Protection Level:
                    </span>
                    <span className="ml-2 font-medium text-github-fg-default capitalize">
                      {settings.protectionLevel}
                    </span>
                  </div>
                  <div>
                    <span className="text-github-fg-muted">Daily Limits:</span>
                    <span className="ml-2 font-medium text-github-fg-default">
                      {settings.dailyMessageLimit} msg /{" "}
                      {settings.dailyContactLimit} contacts
                    </span>
                  </div>
                  <div>
                    <span className="text-github-fg-muted">Delay Range:</span>
                    <span className="ml-2 font-medium text-github-fg-default">
                      {settings.messageDelayMin}s - {settings.messageDelayMax}s
                    </span>
                  </div>
                  <div>
                    <span className="text-github-fg-muted">
                      Human Behavior:
                    </span>
                    <span className="ml-2 font-medium text-github-fg-default">
                      {settings.enableHumanBehavior ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetToDefaults}
                  className="px-4 py-2 bg-[#6b7280] text-white rounded-lg hover:bg-[#5b6270] transition-colors"
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(settings, null, 2)
                    );
                  }}
                  className="px-4 py-2 bg-[#1f6feb] text-white rounded-lg hover:bg-[#1a5feb] transition-colors"
                >
                  Export Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
