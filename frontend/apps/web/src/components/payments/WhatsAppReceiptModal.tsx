"use client";

import React, { useState } from "react";
import {
  X,
  MessageSquare,
  Copy,
  Check,
  Send,
  ExternalLink,
  ShieldCheck,
  Phone,
} from "lucide-react";

interface WhatsAppReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    type: "RECEIPT" | "DUE_REMINDER";
    patientName: string;
    phone?: string | null;
    uhid?: string;
    orderNumber?: string;
    receiptNumber?: string;
    amount: number;
    dueBalance?: number;
    method?: string;
    date?: string;
  };
  showNotification: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function WhatsAppReceiptModal({
  isOpen,
  onClose,
  data,
  showNotification,
}: WhatsAppReceiptModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(
    (data.phone || "").replace(/[^0-9]/g, "") || "9876543210"
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Format currency
  const formatINR = (val: number) => `₹${val.toLocaleString("en-IN")}`;

  // Generate WhatsApp formatted text
  const messageText =
    data.type === "RECEIPT"
      ? `🔬 *LABCORE DIAGNOSTICS - OFFICIAL RECEIPT*\n\nDear *${data.patientName}*,\n\nWe have received your payment of *${formatINR(
          data.amount
        )}* for laboratory diagnostic services.\n\n📄 *Receipt No:* ${data.receiptNumber || "REC-LIVE"}\n🔖 *UHID:* ${
          data.uhid || "—"
        }\n📦 *Order No:* ${data.orderNumber || "—"}\n💳 *Tender Mode:* ${data.method || "CASH"}\n📅 *Date:* ${
          data.date || new Date().toLocaleDateString("en-IN")
        }\n\n📲 *Online Test Reports Status:* Once verified by our pathologist, you will receive a secure PDF link on this number.\n\n_Thank you for choosing LabCore Diagnostics. For assistance call +91-9876543210._`
      : `⚠️ *LABCORE DIAGNOSTICS - PAYMENT REMINDER*\n\nDear *${data.patientName}*,\n\nThis is a courteous reminder that an outstanding due balance of *${formatINR(
          data.dueBalance || data.amount
        )}* is pending for Order *${data.orderNumber || "ORD"}*.\n\n🔖 *Patient UHID:* ${
          data.uhid || "—"
        }\n\n📲 *Pay via UPI:* \`labcore@icici\`\n\nKindly clear the remaining balance at your earliest convenience to receive final verified report downloads.\n\n_LabCore Finance Team • +91-9876543210_`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    showNotification("WhatsApp message copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    let cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
    const encoded = encodeURIComponent(messageText);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, "_blank");
    showNotification("Opening WhatsApp chat...", "info");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                {data.type === "RECEIPT" ? "Send WhatsApp Receipt" : "Send Due Reminder"}
              </h3>
              <p className="text-xs text-slate-500">
                Direct WhatsApp notification to patient with verified details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Patient WhatsApp Mobile Number *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                +91
              </span>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="10 digit mobile number"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-12 pr-4 text-sm font-mono font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Message Preview
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy Text"}
              </button>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 text-xs font-mono text-slate-800 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto">
              {messageText}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 active:scale-95 transition"
            >
              <Send className="h-4 w-4" />
              Open in WhatsApp Web / App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
