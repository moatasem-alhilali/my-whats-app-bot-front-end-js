"use client";

import { useEffect, useState } from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: string;
  color?: "blue" | "green" | "red" | "yellow" | "purple";
  loading?: boolean;
}

export default function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = "blue",
  loading = false,
}: StatCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (typeof value === "number" && !loading) {
      const duration = 1000;
      const steps = 60;
      const increment = value / steps;
      let currentValue = 0;

      const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= value) {
          setAnimatedValue(value);
          clearInterval(timer);
        } else {
          setAnimatedValue(Math.floor(currentValue));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [value, loading]);

  const colorClasses = {
    blue: {
      gradient: "from-[#1f6feb] to-[#58a6ff]",
      bg: "bg-[#1f6feb]/10",
      border: "border-[#1f6feb]/20",
      text: "text-[#1f6feb]",
      icon: "bg-gradient-to-r from-[#1f6feb] to-[#58a6ff]",
    },
    green: {
      gradient: "from-[#238636] to-[#2ea043]",
      bg: "bg-[#238636]/10",
      border: "border-[#238636]/20",
      text: "text-[#238636]",
      icon: "bg-gradient-to-r from-[#238636] to-[#2ea043]",
    },
    red: {
      gradient: "from-[#da3633] to-[#ff6b6b]",
      bg: "bg-[#da3633]/10",
      border: "border-[#da3633]/20",
      text: "text-[#da3633]",
      icon: "bg-gradient-to-r from-[#da3633] to-[#ff6b6b]",
    },
    yellow: {
      gradient: "from-[#f85149] to-[#ffab40]",
      bg: "bg-[#f85149]/10",
      border: "border-[#f85149]/20",
      text: "text-[#f85149]",
      icon: "bg-gradient-to-r from-[#f85149] to-[#ffab40]",
    },
    purple: {
      gradient: "from-[#8b5cf6] to-[#a855f7]",
      bg: "bg-[#8b5cf6]/10",
      border: "border-[#8b5cf6]/20",
      text: "text-[#8b5cf6]",
      icon: "bg-gradient-to-r from-[#8b5cf6] to-[#a855f7]",
    },
  };

  const currentColor = colorClasses[color];

  return (
    <div className="group relative bg-github-canvas-subtle border border-github-border-default rounded-lg p-6 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:-translate-y-1">
      {/* Background gradient overlay */}
      <div
        className={`absolute inset-0 ${currentColor.bg} rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      ></div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-12 h-12 ${currentColor.icon} rounded-lg flex items-center justify-center text-white text-xl font-medium shadow-lg`}
          >
            {icon}
          </div>

          {change !== undefined && (
            <div
              className={`flex items-center gap-1 px-2 py-1 ${currentColor.bg} ${currentColor.border} border rounded-full`}
            >
              <span className={`${currentColor.text} text-xs font-medium`}>
                {change > 0 ? "↗" : change < 0 ? "↘" : "→"}
              </span>
              <span className={`${currentColor.text} text-xs font-medium`}>
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-2">
          {loading ? (
            <div className="space-y-2">
              <div className="h-8 bg-github-canvas-default rounded animate-pulse"></div>
              <div className="h-4 bg-github-canvas-default rounded w-2/3 animate-pulse"></div>
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-github-fg-default mb-1">
                {typeof value === "number"
                  ? animatedValue.toLocaleString()
                  : value}
              </div>
              <div className="text-sm text-github-fg-muted">{title}</div>
            </>
          )}
        </div>

        {/* Change label */}
        {changeLabel && !loading && (
          <div className="text-xs text-github-fg-subtle">{changeLabel}</div>
        )}

        {/* Hover effect line */}
        <div
          className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${currentColor.gradient} rounded-b-lg transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}
        ></div>
      </div>
    </div>
  );
}
