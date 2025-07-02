"use client";

import { useEffect } from "react";

interface ToastProps {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  duration?: number;
  onRemove: (id: string) => void;
}

export default function Toast({
  id,
  type,
  title,
  description,
  duration = 5000,
  onRemove,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const typeStyles = {
    success: {
      bg: "bg-[#238636]/10",
      border: "border-[#238636]/20",
      icon: "bg-[#238636]",
      iconColor: "text-white",
      titleColor: "text-[#238636]",
      emoji: "✅",
    },
    error: {
      bg: "bg-[#da3633]/10",
      border: "border-[#da3633]/20",
      icon: "bg-[#da3633]",
      iconColor: "text-white",
      titleColor: "text-[#da3633]",
      emoji: "❌",
    },
    warning: {
      bg: "bg-[#f85149]/10",
      border: "border-[#f85149]/20",
      icon: "bg-[#f85149]",
      iconColor: "text-white",
      titleColor: "text-[#f85149]",
      emoji: "⚠️",
    },
    info: {
      bg: "bg-[#1f6feb]/10",
      border: "border-[#1f6feb]/20",
      icon: "bg-[#1f6feb]",
      iconColor: "text-white",
      titleColor: "text-[#1f6feb]",
      emoji: "ℹ️",
    },
  };

  const style = typeStyles[type];

  return (
    <div
      className={`flex items-start gap-3 p-4 ${style.bg} ${style.border} border rounded-lg backdrop-blur-sm shadow-lg animate-slide-in-right`}
    >
      <div
        className={`w-8 h-8 ${style.icon} rounded-lg flex items-center justify-center flex-shrink-0`}
      >
        <span className="text-sm">{style.emoji}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className={`font-medium ${style.titleColor} text-sm`}>{title}</div>
        {description && (
          <div className="text-github-fg-muted text-xs mt-1">{description}</div>
        )}
      </div>

      <button
        onClick={() => onRemove(id)}
        className="text-github-fg-muted hover:text-github-fg-default transition-colors flex-shrink-0"
      >
        <span className="text-lg leading-none">×</span>
      </button>
    </div>
  );
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: "success" | "error" | "warning" | "info";
    title: string;
    description?: string;
    duration?: number;
  }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          description={toast.description}
          duration={toast.duration}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
