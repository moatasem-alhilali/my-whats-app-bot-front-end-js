"use client";

import { useCallback, useState } from "react";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
  currentFile?: File | null;
}

export default function FileUpload({
  onFileSelect,
  accept = "image/*,video/*,audio/*,.pdf,.doc,.docx",
  maxSize = 16,
  disabled = false,
  currentFile = null,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    return null;
  };

  const handleFileSelect = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError("");
      onFileSelect(file);
    },
    [maxSize, onFileSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [disabled, handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const removeFile = useCallback(() => {
    onFileSelect(null);
    setError("");
  }, [onFileSelect]);

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith("image/")) return "🖼️";
    if (type.startsWith("video/")) return "🎥";
    if (type.startsWith("audio/")) return "🎵";
    if (type.includes("pdf")) return "📄";
    if (type.includes("document") || type.includes("word")) return "📝";
    return "📎";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-3">
      {!currentFile ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
            isDragging
              ? "border-[#1f6feb] bg-[#1f6feb]/5"
              : disabled
              ? "border-github-border-muted bg-github-canvas-inset cursor-not-allowed"
              : "border-github-border-default hover:border-[#1f6feb] hover:bg-[#1f6feb]/5 cursor-pointer"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() =>
            !disabled && document.getElementById("file-input")?.click()
          }
        >
          <input
            id="file-input"
            type="file"
            accept={accept}
            onChange={handleInputChange}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="File upload"
          />

          <div className="space-y-4">
            <div
              className={`w-16 h-16 mx-auto rounded-lg flex items-center justify-center ${
                isDragging ? "bg-[#1f6feb]/20" : "bg-github-canvas-default"
              } transition-colors duration-200`}
            >
              <span className="text-2xl">📁</span>
            </div>

            <div>
              <h3 className="text-lg font-medium text-github-fg-default mb-2">
                {isDragging
                  ? "Drop your file here"
                  : "Choose a file or drag it here"}
              </h3>
              <p className="text-sm text-github-fg-muted">
                Support for images, videos, audio, PDF, and documents
              </p>
              <p className="text-xs text-github-fg-subtle mt-1">
                Maximum file size: {maxSize}MB
              </p>
            </div>

            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] text-white rounded-lg hover:from-[#1a5feb] hover:to-[#4fa6ff] transition-all duration-200">
              <span className="text-sm font-medium">Browse Files</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-github-canvas-default border border-github-border-default rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] rounded-lg flex items-center justify-center text-white text-xl">
              {getFileIcon(currentFile)}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-github-fg-default truncate">
                {currentFile.name}
              </h4>
              <p className="text-sm text-github-fg-muted">
                {formatFileSize(currentFile.size)}
              </p>
            </div>

            <button
              onClick={removeFile}
              disabled={disabled}
              className="w-8 h-8 bg-[#da3633]/10 hover:bg-[#da3633]/20 text-[#da3633] rounded-lg flex items-center justify-center transition-colors duration-200 disabled:opacity-50"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#da3633]/10 border border-[#da3633]/20 rounded-lg">
          <p className="text-sm text-[#da3633] flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
