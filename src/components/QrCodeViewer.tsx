"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface QrCodeViewerProps {
  qrCode?: string;
  sessionId: string;
  onRefresh?: () => void;
}

export default function QrCodeViewer({
  qrCode,
  sessionId,
  onRefresh,
}: QrCodeViewerProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [expiryTime, setExpiryTime] = useState<number>(20);

  useEffect(() => {
    if (qrCode) {
      // Convert QR code string to data URL for display
      import("qrcode").then((QRCode) => {
        QRCode.toDataURL(qrCode, {
          width: 300,
          margin: 2,
          color: {
            dark: "#0d1117",
            light: "#ffffff",
          },
        }).then(setQrDataUrl);
      });

      // Start countdown timer for QR expiry
      setExpiryTime(20);
      const timer = setInterval(() => {
        setExpiryTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [qrCode]);

  if (!qrCode) {
    return (
      <div className="bg-github-canvas-subtle rounded-lg shadow-xl border border-github-border-default p-8 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-[#1f6feb] border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-[#58a6ff] border-t-transparent rounded-full animate-spin top-2 left-2"></div>
          </div>
          <h3 className="text-lg font-semibold text-github-fg-default mb-2">
            Initializing Session
          </h3>
          <p className="text-github-fg-muted text-center max-w-sm">
            Setting up your WhatsApp connection...
          </p>
          <div className="mt-4 px-3 py-1 bg-github-canvas-default border border-github-border-muted rounded-full">
            <p className="text-xs text-github-fg-muted font-mono">
              Session: {sessionId}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-github-canvas-subtle rounded-lg shadow-xl border border-github-border-default backdrop-blur-sm">
      {/* Header */}
      <div className="p-6 border-b border-github-border-muted">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">📱</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-github-fg-default">
              Scan QR Code
            </h3>
            <p className="text-sm text-github-fg-muted">
              Connect your WhatsApp to this session
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Display */}
      <div className="p-8">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            {qrDataUrl ? (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#1f6feb]/20 to-[#58a6ff]/20 rounded-xl blur-xl"></div>
                <div className="relative bg-white p-4 rounded-xl shadow-lg">
                  <Image
                    src={qrDataUrl}
                    alt="WhatsApp QR Code"
                    width={300}
                    height={300}
                    className="rounded-lg"
                  />
                </div>

                {/* Scanning Animation */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#1f6feb] to-transparent animate-pulse opacity-50 absolute top-1/2 transform -translate-y-1/2"></div>
                </div>
              </div>
            ) : (
              <div className="w-80 h-80 bg-github-canvas-default rounded-xl border-2 border-dashed border-github-border-muted flex items-center justify-center">
                <div className="text-center">
                  <div className="relative mb-4">
                    <div className="w-12 h-12 border-3 border-[#1f6feb] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                  <p className="text-github-fg-muted text-sm">
                    Generating QR Code...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-center gap-3 p-3 bg-github-canvas-default rounded-lg border border-github-border-muted">
              <span className="text-2xl">📱</span>
              <span className="text-github-fg-default text-sm">
                Open WhatsApp on your phone
              </span>
            </div>
            <div className="flex items-center justify-center gap-3 p-3 bg-github-canvas-default rounded-lg border border-github-border-muted">
              <span className="text-2xl">⚙️</span>
              <span className="text-github-fg-default text-sm">
                Go to Settings → Linked Devices
              </span>
            </div>
            <div className="flex items-center justify-center gap-3 p-3 bg-github-canvas-default rounded-lg border border-github-border-muted">
              <span className="text-2xl">📷</span>
              <span className="text-github-fg-default text-sm">
                Tap &quot;Link a Device&quot; and scan this code
              </span>
            </div>
          </div>

          {/* Expiry Timer */}
          {expiryTime > 0 ? (
            <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-[#1f6feb]/10 border border-[#1f6feb]/20 rounded-lg">
              <span className="text-[#1f6feb]">⏰</span>
              <span className="text-sm text-[#1f6feb] font-medium">
                QR Code expires in {expiryTime} seconds
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-[#f85149]/10 border border-[#f85149]/20 rounded-lg">
              <span className="text-[#f85149]">⚠️</span>
              <span className="text-sm text-[#f85149] font-medium">
                QR Code has expired
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onRefresh}
              className="px-6 py-3 bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] text-white rounded-lg hover:from-[#1a5feb] hover:to-[#4fa6ff] transition-all duration-200 hover:shadow-lg hover:shadow-[#1f6feb]/25"
            >
              <span className="flex items-center justify-center gap-2">
                <span>🔄</span>
                Refresh QR Code
              </span>
            </button>

            <div className="flex items-center justify-center px-4 py-2 bg-github-canvas-default border border-github-border-muted rounded-lg">
              <span className="text-xs text-github-fg-muted font-mono">
                {sessionId}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="p-6 border-t border-github-border-muted bg-github-canvas-inset">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer text-github-fg-default hover:text-[#1f6feb] transition-colors">
            <span className="text-sm font-medium">Need help?</span>
            <span className="text-xs transform group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>
          <div className="mt-3 space-y-2 text-xs text-github-fg-muted">
            <p>• Make sure your phone has an active internet connection</p>
            <p>• Ensure WhatsApp is updated to the latest version</p>
            <p>• If the QR code doesn&apos;t work, try refreshing it</p>
            <p>• You can link up to 4 devices to your WhatsApp account</p>
          </div>
        </details>
      </div>
    </div>
  );
}
