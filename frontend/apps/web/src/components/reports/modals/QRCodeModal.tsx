"use client";

import React, { useState } from "react";
import { X, QrCode, Download, Check } from "lucide-react";
import { generateVerificationQRCode, downloadQRCode } from "@/lib/qr-generator";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportReferenceId: string;
}

export default function QRCodeModal({
  isOpen,
  onClose,
  reportId,
  reportReferenceId,
}: QRCodeModalProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const generateQR = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qrCode = await generateVerificationQRCode(reportId);
      setQrCodeDataURL(qrCode);
    } catch (err: any) {
      setError(err.message || "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  React.useEffect(() => {
    if (isOpen && reportId) {
      generateQR();
    }
  }, [isOpen, reportId, generateQR]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadQRCode(reportId, `qr-code-${reportReferenceId}.png`);
    } catch (err: any) {
      setError(err.message || "Failed to download QR code");
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm premium-modal-backdrop">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl premium-modal-content premium-glass">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-cyan-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Verification QR Code
              </h3>
              <p className="text-sm text-gray-600">
                {reportReferenceId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="rounded-lg border-2 border-gray-200 p-4 bg-white">
                  {qrCodeDataURL && (
                    <img
                      src={qrCodeDataURL}
                      alt="Verification QR Code"
                      className="w-64 h-64"
                    />
                  )}
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Scan this QR code to verify the authenticity of this report
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Fraud prevention & patient verification
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? (
                    "Downloading..."
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download QR Code
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2 text-sm font-medium text-white hover:from-indigo-700 hover:to-cyan-700 transition-all"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}