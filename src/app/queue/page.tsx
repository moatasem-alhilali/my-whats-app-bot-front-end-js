"use client";

import QueueManager from "@/components/QueueManager";
import { QueueStatus } from "@/lib/api";
import { useState } from "react";

export default function QueuePage() {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);

  const handleQueueStatusChange = (status: QueueStatus) => {
    setQueueStatus(status);
  };

  return (
    <div className="min-h-screen bg-github-canvas-default">
      {/* Header */}
      <div className="bg-github-canvas-subtle border-b border-github-border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-github-fg-default">
                  Message Queue Management
                </h1>
                <p className="text-github-fg-muted mt-1">
                  Monitor and control message processing across all sessions
                </p>
              </div>

              {/* Quick Stats */}
              {queueStatus && (
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-github-fg-default">
                      {queueStatus.pendingMessages}
                    </div>
                    <div className="text-xs text-github-fg-muted">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-github-fg-default">
                      {queueStatus.completedMessages}
                    </div>
                    <div className="text-xs text-github-fg-muted">
                      Completed
                    </div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${
                        queueStatus.isActive
                          ? "text-[#238636]"
                          : "text-[#da3633]"
                      }`}
                    >
                      {queueStatus.isActive ? "●" : "●"}
                    </div>
                    <div className="text-xs text-github-fg-muted">
                      {queueStatus.isPaused
                        ? "Paused"
                        : queueStatus.isActive
                        ? "Active"
                        : "Inactive"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-8">
          {/* Queue Overview Cards */}
          {queueStatus && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      queueStatus.isActive ? "bg-[#238636]" : "bg-[#da3633]"
                    }`}
                  ></div>
                  <span className="text-sm font-medium text-github-fg-default">
                    Queue Status
                  </span>
                </div>
                <p className="text-lg font-bold text-github-fg-default">
                  {queueStatus.isPaused
                    ? "Paused"
                    : queueStatus.isActive
                    ? "Active"
                    : "Inactive"}
                </p>
                <p className="text-xs text-github-fg-muted">
                  {queueStatus.totalMessages} total messages
                </p>
              </div>

              <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">⏳</span>
                  <span className="text-sm font-medium text-github-fg-default">
                    Processing
                  </span>
                </div>
                <p className="text-lg font-bold text-[#1f6feb]">
                  {queueStatus.processingMessages}
                </p>
                <p className="text-xs text-github-fg-muted">
                  Currently being processed
                </p>
              </div>

              <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">⚡</span>
                  <span className="text-sm font-medium text-github-fg-default">
                    Performance
                  </span>
                </div>
                <p className="text-lg font-bold text-github-fg-default">
                  {queueStatus.avgProcessingTime}s
                </p>
                <p className="text-xs text-github-fg-muted">
                  Average processing time
                </p>
              </div>

              <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">🎯</span>
                  <span className="text-sm font-medium text-github-fg-default">
                    ETA
                  </span>
                </div>
                <p className="text-lg font-bold text-github-fg-default">
                  {queueStatus.estimatedCompletion
                    ? new Date(
                        queueStatus.estimatedCompletion
                      ).toLocaleTimeString()
                    : "N/A"}
                </p>
                <p className="text-xs text-github-fg-muted">
                  Estimated completion
                </p>
              </div>
            </div>
          )}

          {/* Queue Manager Component */}
          <QueueManager
            autoRefresh={true}
            refreshInterval={5000}
            onQueueStatusChange={handleQueueStatusChange}
          />

          {/* Help Section */}
          <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default p-6">
            <h3 className="text-lg font-semibold text-github-fg-default mb-4 flex items-center gap-2">
              <span>💡</span>
              Queue Management Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-github-fg-default mb-2">
                  Message Priorities
                </h4>
                <ul className="space-y-1 text-sm text-github-fg-muted">
                  <li>
                    • <strong className="text-[#da3633]">High:</strong>{" "}
                    Processed immediately
                  </li>
                  <li>
                    • <strong className="text-[#1f6feb]">Normal:</strong>{" "}
                    Standard queue processing
                  </li>
                  <li>
                    • <strong className="text-[#6b7280]">Low:</strong> Processed
                    when load is light
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-github-fg-default mb-2">
                  Queue Controls
                </h4>
                <ul className="space-y-1 text-sm text-github-fg-muted">
                  <li>
                    • <strong>Pause:</strong> Stop processing new messages
                  </li>
                  <li>
                    • <strong>Resume:</strong> Continue processing messages
                  </li>
                  <li>
                    • <strong>Retry:</strong> Reprocess failed messages
                  </li>
                  <li>
                    • <strong>Cancel:</strong> Remove messages from queue
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default p-6">
              <h3 className="text-lg font-semibold text-github-fg-default mb-4 flex items-center gap-2">
                <span>📈</span>
                Performance Insights
              </h3>
              {queueStatus ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-github-fg-muted">
                      Queue Efficiency:
                    </span>
                    <span className="text-sm font-medium text-github-fg-default">
                      {queueStatus.completedMessages > 0
                        ? Math.round(
                            (queueStatus.completedMessages /
                              queueStatus.totalMessages) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-github-fg-muted">
                      Success Rate:
                    </span>
                    <span className="text-sm font-medium text-[#238636]">
                      {queueStatus.failedMessages === 0
                        ? "100%"
                        : Math.round(
                            (queueStatus.completedMessages /
                              (queueStatus.completedMessages +
                                queueStatus.failedMessages)) *
                              100
                          ) + "%"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-github-fg-muted">
                      Queue Health:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        queueStatus.failedMessages === 0
                          ? "text-[#238636]"
                          : queueStatus.failedMessages < 5
                          ? "text-[#fb8500]"
                          : "text-[#da3633]"
                      }`}
                    >
                      {queueStatus.failedMessages === 0
                        ? "Excellent"
                        : queueStatus.failedMessages < 5
                        ? "Good"
                        : "Needs Attention"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-github-fg-muted">
                    Performance data will appear once queue status is loaded
                  </p>
                </div>
              )}
            </div>

            <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default p-6">
              <h3 className="text-lg font-semibold text-github-fg-default mb-4 flex items-center gap-2">
                <span>⚙️</span>
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-[#1f6feb] text-white rounded-lg hover:bg-[#1a5feb] transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📤</span>
                    <div>
                      <p className="font-medium">Bulk Send Messages</p>
                      <p className="text-sm text-white/70">
                        Add multiple messages to queue
                      </p>
                    </div>
                  </div>
                </button>

                <button className="w-full px-4 py-3 bg-[#238636] text-white rounded-lg hover:bg-[#1f7a2e] transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔄</span>
                    <div>
                      <p className="font-medium">Retry All Failed</p>
                      <p className="text-sm text-white/70">
                        Reprocess all failed messages
                      </p>
                    </div>
                  </div>
                </button>

                <button className="w-full px-4 py-3 bg-[#6b7280] text-white rounded-lg hover:bg-[#5b6270] transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🧹</span>
                    <div>
                      <p className="font-medium">Clear Completed</p>
                      <p className="text-sm text-white/70">
                        Remove completed messages from view
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
