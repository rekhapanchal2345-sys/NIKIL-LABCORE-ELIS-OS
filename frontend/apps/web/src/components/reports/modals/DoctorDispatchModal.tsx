"use client";

import { useEffect, useState } from "react";
import { Mail, MessageCircle, Send, Stethoscope, X } from "lucide-react";
import { reportsApi } from "@/lib/api";

interface DoctorDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportReferenceId: string;
  doctor?: { id: string; fullName: string };
  onSuccess: () => void;
}

export default function DoctorDispatchModal({
  isOpen,
  onClose,
  reportId,
  reportReferenceId,
  doctor,
  onSuccess,
}: DoctorDispatchModalProps) {
  const [channel, setChannel] = useState<"EMAIL" | "WHATSAPP">("EMAIL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setChannel("EMAIL");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const dispatch = async () => {
    if (!doctor) {
      setError("No referring doctor is linked to this report.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await reportsApi.sendReportToDoctor(reportId, doctor.id, channel);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "The report could not be sent. Please check the doctor's contact details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <section className="premium-modal-content w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="Send report to referring doctor">
        <header className="flex items-center justify-between bg-gradient-to-r from-[#0b0b2d] via-[#201052] to-[#0b6b68] px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-white/10 p-2.5 text-cyan-200"><Stethoscope className="h-5 w-5" /></span>
            <div><p className="text-base font-black">Send to referring doctor</p><p className="mt-0.5 text-xs text-indigo-200">Secure report dispatch · {reportReferenceId}</p></div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-indigo-100 transition hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button>
        </header>

        <div className="space-y-5 p-6">
          <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700">Delivery recipient</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{doctor ? `Dr. ${doctor.fullName}` : "No referring doctor linked"}</p>
            <p className="mt-1 text-xs text-slate-500">A delivery event is recorded in the report audit trail.</p>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-slate-800">Choose secure delivery channel</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "EMAIL" as const, label: "Secure email", note: "Send to registered email", Icon: Mail },
                { value: "WHATSAPP" as const, label: "WhatsApp", note: "Send to registered mobile", Icon: MessageCircle },
              ]).map(({ value, label, note, Icon }) => (
                <button key={value} type="button" onClick={() => setChannel(value)} className={`rounded-xl border p-4 text-left transition ${channel === value ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"}`}>
                  <Icon className={`h-5 w-5 ${channel === value ? "text-indigo-600" : "text-slate-500"}`} />
                  <p className="mt-3 text-sm font-bold text-slate-900">{label}</p><p className="mt-1 text-[11px] text-slate-500">{note}</p>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">{error}</p>}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">Cancel</button>
            <button type="button" onClick={dispatch} disabled={loading || !doctor} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-4 py-2.5 text-sm font-black text-white shadow-md transition hover:from-cyan-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? "Sending…" : <><Send className="h-4 w-4" /> Send report</>}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
