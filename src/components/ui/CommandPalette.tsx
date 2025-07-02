"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  sessions?: Array<{ id: string; status: string }>;
}

export default function CommandPalette({
  isOpen,
  onClose,
  sessions = [],
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const commands: Command[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      description: "Go to main dashboard",
      icon: "🏠",
      action: () => router.push("/"),
      keywords: ["home", "main", "overview"],
    },
    {
      id: "setup",
      label: "Create Session",
      description: "Set up a new WhatsApp session",
      icon: "➕",
      action: () => router.push("/setup"),
      keywords: ["new", "create", "add", "session"],
    },
    {
      id: "send",
      label: "Send Messages",
      description: "Send text or media messages",
      icon: "💬",
      action: () => router.push("/send"),
      keywords: ["message", "text", "media", "chat"],
    },
    {
      id: "status",
      label: "Session Status",
      description: "Monitor and manage sessions",
      icon: "📊",
      action: () => router.push("/status"),
      keywords: ["monitor", "manage", "view", "sessions"],
    },
    ...sessions.map((session) => ({
      id: `session-${session.id}`,
      label: `Session: ${session.id}`,
      description: `Status: ${session.status}`,
      icon: session.status === "ready" ? "✅" : "📱",
      action: () => router.push(`/status?sessionId=${session.id}`),
      keywords: ["session", session.id, session.status],
    })),
  ];

  const filteredCommands = commands.filter((command) => {
    const searchText = query.toLowerCase();
    return (
      command.label.toLowerCase().includes(searchText) ||
      command.description?.toLowerCase().includes(searchText) ||
      command.keywords?.some((keyword) =>
        keyword.toLowerCase().includes(searchText)
      )
    );
  });

  const executeCommand = useCallback(
    (command: Command) => {
      command.action();
      onClose();
      setQuery("");
      setSelectedIndex(0);
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, executeCommand, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]">
      <div className="bg-github-canvas-subtle border border-github-border-default rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Search Input */}
        <div className="border-b border-github-border-muted p-4">
          <div className="flex items-center gap-3">
            <span className="text-github-fg-muted">🔍</span>
            <input
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-github-fg-default placeholder-github-fg-muted outline-none"
              autoFocus
            />
            <kbd className="px-2 py-1 bg-github-canvas-default border border-github-border-muted rounded text-xs text-github-fg-muted">
              ESC
            </kbd>
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2 opacity-50">🔍</div>
              <p className="text-github-fg-muted">No commands found</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredCommands.map((command, index) => (
                <button
                  key={command.id}
                  onClick={() => executeCommand(command)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-150 ${
                    index === selectedIndex
                      ? "bg-[#1f6feb]/10 border border-[#1f6feb]/20"
                      : "hover:bg-github-canvas-inset"
                  }`}
                >
                  <span className="text-2xl">{command.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-github-fg-default">
                      {command.label}
                    </div>
                    {command.description && (
                      <div className="text-sm text-github-fg-muted">
                        {command.description}
                      </div>
                    )}
                  </div>
                  {index === selectedIndex && (
                    <kbd className="px-2 py-1 bg-github-canvas-default border border-github-border-muted rounded text-xs text-github-fg-muted">
                      ↵
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-github-border-muted p-3 bg-github-canvas-inset">
          <div className="flex items-center justify-between text-xs text-github-fg-muted">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-github-canvas-default border border-github-border-muted rounded">
                  ↑
                </kbd>
                <kbd className="px-1 py-0.5 bg-github-canvas-default border border-github-border-muted rounded">
                  ↓
                </kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-github-canvas-default border border-github-border-muted rounded">
                  ↵
                </kbd>
                to select
              </span>
            </div>
            <span>{filteredCommands.length} commands</span>
          </div>
        </div>
      </div>
    </div>
  );
}
