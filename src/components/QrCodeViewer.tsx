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

  useEffect(() => {
    if (qrCode) {
      // Convert QR code string to data URL for display
      import("qrcode").then((QRCode) => {
        QRCode.toDataURL(qrCode, {
          width: 256,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        }).then(setQrDataUrl);
      });
    }
  }, [qrCode]);

  if (!qrCode) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="w-16 h-16 mb-4 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="text-gray-600 text-center">
          Initializing session... <br />
          <span className="text-sm">Session ID: {sessionId}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-lg border">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Scan QR Code with WhatsApp
      </h3>

      <div className="relative mb-4">
        {qrDataUrl ? (
          <Image
            src={qrDataUrl}
            alt="WhatsApp QR Code"
            width={256}
            height={256}
            className="rounded-lg border"
          />
        ) : (
          <div className="w-64 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
            <div className="animate-pulse text-gray-500">
              Generating QR Code...
            </div>
          </div>
        )}
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">1. Open WhatsApp on your phone</p>
        <p className="text-sm text-gray-600">
          2. Go to Settings → Linked Devices
        </p>
        <p className="text-sm text-gray-600">
          3. Tap "Link a Device" and scan this code
        </p>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Refresh QR Code
        </button>

        <div className="text-xs text-gray-500 flex items-center">
          Session: {sessionId}
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          ⚠️ QR Code expires after 20 seconds. Click refresh if needed.
        </p>
      </div>
    </div>
  );
}
