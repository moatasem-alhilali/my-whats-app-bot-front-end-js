"use client";

import { QueueMessage, QueueStatus, whatsappApi } from "@/lib/api";
import { useEffect, useState } from "react";

interface QueueManagerProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onQueueStatusChange?: (status: QueueStatus) => void;
}

export default function QueueManager({
  autoRefresh = true,
  refreshInterval = 10000,
  onQueueStatusChange,
}: QueueManagerProps) {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [messages, setMessages] = useState<QueueMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const loadQueueStatus = async () => {
    try {
      setError("");
      const response = await whatsappApi.getQueueStatus();

      if (response.success && response.data) {
        setQueueStatus(response.data);
        onQueueStatusChange?.(response.data);
      } else {
        setError(response.error || "Failed to load queue status");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load queue status"
      );
    }
  };

  const loadMessages = async (page = 1, status = "all") => {
    try {
      if (!loading) setLoading(true);

      const response = await whatsappApi.getQueueMessages(
        page,
        10,
        status === "all" ? undefined : status
      );

      if (response.success && response.data) {
        setMessages(response.data.messages);
        setTotalPages(response.data.totalPages);
        setCurrentPage(page);
      } else {
        setError(response.error || "Failed to load queue messages");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load queue messages"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePauseResume = async () => {
    if (!queueStatus) return;

    try {
      setActionLoading("queue");
      const response = queueStatus.isPaused
        ? await whatsappApi.resumeQueue()
        : await whatsappApi.pauseQueue();

      if (response.success) {
        await loadQueueStatus();
      } else {
        setError(response.error || "Failed to update queue status");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update queue status"
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleRetryMessage = async (messageId: string) => {
    try {
      setActionLoading(messageId);
      const response = await whatsappApi.retryQueueMessage(messageId);

      if (response.success) {
        await loadMessages(currentPage, selectedStatus);
        await loadQueueStatus();
      } else {
        setError(response.error || "Failed to retry message");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retry message");
    } finally {
      setActionLoading("");
    }
  };

  const handleCancelMessage = async (messageId: string) => {
    try {
      setActionLoading(messageId);
      const response = await whatsappApi.cancelQueueMessage(messageId);

      if (response.success) {
        await loadMessages(currentPage, selectedStatus);
        await loadQueueStatus();
      } else {
        setError(response.error || "Failed to cancel message");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel message");
    } finally {
      setActionLoading("");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadQueueStatus(), loadMessages(1, selectedStatus)]);
    };

    loadData();

    if (autoRefresh) {
      const interval = setInterval(loadData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, selectedStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-[#fb8500] bg-[#fb8500]/10";
      case "processing":
        return "text-[#1f6feb] bg-[#1f6feb]/10";
      case "completed":
        return "text-[#238636] bg-[#238636]/10";
      case "failed":
        return "text-[#da3633] bg-[#da3633]/10";
      default:
        return "text-github-fg-muted bg-github-canvas-inset";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "processing":
        return "🔄";
      case "completed":
        return "✅";
      case "failed":
        return "❌";
      default:
        return "❓";
    }
  };

  const formatDuration = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
  };

  if (loading && !queueStatus) {
    return (
      <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-github-canvas-default rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-github-canvas-default rounded w-3/4"></div>
            <div className="h-4 bg-github-canvas-default rounded w-1/2"></div>
            <div className="h-4 bg-github-canvas-default rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-github-canvas-subtle rounded-lg border border-github-border-default">
      {/* Header */}
      <div className="p-4 border-b border-github-border-muted">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">📤</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-github-fg-default">
                Message Queue Manager
              </h3>
              <p className="text-xs text-github-fg-muted">
                Control and monitor message processing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadMessages(currentPage, selectedStatus)}
              disabled={loading}
              className="p-2 text-github-fg-muted hover:text-github-fg-default transition-colors"
              title="Refresh"
            >
              <span className={loading ? "animate-spin" : ""}>🔄</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-[#da3633]/10 border-b border-[#da3633]/20">
          <p className="text-sm text-[#da3633] flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </p>
        </div>
      )}

      {/* Queue Status */}
      {queueStatus && (
        <div className="p-4 border-b border-github-border-muted">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Controls */}
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  queueStatus.isActive ? "bg-[#238636]" : "bg-[#da3633]"
                }`}
              ></div>
              <span className="text-sm font-medium text-github-fg-default">
                {queueStatus.isActive ? "Active" : "Inactive"}
              </span>
              <button
                onClick={handlePauseResume}
                disabled={actionLoading === "queue"}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  queueStatus.isPaused
                    ? "bg-[#238636] text-white hover:bg-[#1f7a2e]"
                    : "bg-[#fb8500] text-white hover:bg-[#e8740c]"
                }`}
              >
                {actionLoading === "queue"
                  ? "..."
                  : queueStatus.isPaused
                  ? "Resume"
                  : "Pause"}
              </button>
            </div>

            {/* Queue Metrics */}
            <div className="text-center">
              <p className="text-lg font-bold text-github-fg-default">
                {queueStatus.pendingMessages}
              </p>
              <p className="text-xs text-github-fg-muted">Pending Messages</p>
            </div>

            <div className="text-center">
              <p className="text-lg font-bold text-github-fg-default">
                {queueStatus.avgProcessingTime}s
              </p>
              <p className="text-xs text-github-fg-muted">
                Avg Processing Time
              </p>
            </div>
          </div>

          {queueStatus.estimatedCompletion && (
            <div className="mt-3 text-center">
              <p className="text-sm text-github-fg-muted">
                Estimated completion:{" "}
                {new Date(queueStatus.estimatedCompletion).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="p-4 border-b border-github-border-muted">
        <div className="flex items-center gap-2">
          <span className="text-sm text-github-fg-default">Filter:</span>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1 text-sm bg-github-canvas-default border border-github-border-default rounded-md focus:ring-2 focus:ring-[#1f6feb] focus:border-transparent text-github-fg-default"
            aria-label="Filter messages by status"
          >
            <option value="all">All Messages</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Messages List */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse p-3 bg-github-canvas-default rounded-lg"
              >
                <div className="h-4 bg-github-border-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-github-border-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-github-fg-muted">No messages in queue</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className="p-3 bg-github-canvas-default rounded-lg border border-github-border-muted"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                          message.status
                        )}`}
                      >
                        {getStatusIcon(message.status)} {message.status}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          message.priority === "high"
                            ? "text-[#da3633] bg-[#da3633]/10"
                            : message.priority === "low"
                            ? "text-[#6b7280] bg-[#6b7280]/10"
                            : "text-[#1f6feb] bg-[#1f6feb]/10"
                        }`}
                      >
                        {message.priority} priority
                      </span>
                    </div>
                    <p className="text-sm text-github-fg-default mb-1">
                      <strong>To:</strong> {message.to}
                    </p>
                    <p className="text-sm text-github-fg-default mb-2 truncate">
                      <strong>Message:</strong> {message.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-github-fg-muted">
                      <span>Created: {formatDuration(message.createdAt)}</span>
                      {message.scheduledFor && (
                        <span>
                          Scheduled:{" "}
                          {new Date(message.scheduledFor).toLocaleString()}
                        </span>
                      )}
                      {message.processedAt && (
                        <span>
                          Processed: {formatDuration(message.processedAt)}
                        </span>
                      )}
                      <span>Attempts: {message.attempts}</span>
                    </div>
                    {message.error && (
                      <p className="text-xs text-[#da3633] mt-1">
                        <strong>Error:</strong> {message.error}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {message.status === "failed" && (
                      <button
                        onClick={() => handleRetryMessage(message.id)}
                        disabled={actionLoading === message.id}
                        className="px-2 py-1 text-xs bg-[#1f6feb] text-white rounded hover:bg-[#1a5feb] transition-colors disabled:opacity-50"
                      >
                        {actionLoading === message.id ? "..." : "Retry"}
                      </button>
                    )}
                    {(message.status === "pending" ||
                      message.status === "failed") && (
                      <button
                        onClick={() => handleCancelMessage(message.id)}
                        disabled={actionLoading === message.id}
                        className="px-2 py-1 text-xs bg-[#da3633] text-white rounded hover:bg-[#c33025] transition-colors disabled:opacity-50"
                      >
                        {actionLoading === message.id ? "..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => loadMessages(currentPage - 1, selectedStatus)}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1 text-sm bg-github-canvas-default border border-github-border-default rounded hover:bg-github-canvas-inset transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-github-fg-muted">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => loadMessages(currentPage + 1, selectedStatus)}
              disabled={currentPage === totalPages || loading}
              className="px-3 py-1 text-sm bg-github-canvas-default border border-github-border-default rounded hover:bg-github-canvas-inset transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
