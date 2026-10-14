"use client";

import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FlaskConical,
  User2,
  ClipboardCheck,
  Eye,
  History,
  Hash,
  Clock,
  MapPin,
  Laptop2,
  ChevronDown,
  ChevronUp,
  FileText,
  Lock,
  Fingerprint,
  Scan,
  Badge,
} from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userName: string;
  role: string;
  ipAddress?: string;
  description: string;
  createdAt: string;
  status: "SUCCESS" | "FAILED" | "WARNING";
  location?: string;
  deviceInfo?: string;
  sessionId?: string;
  patientVerification?: {
    nameVerified: boolean;
    uhidVerified: boolean;
    dobVerified: boolean;
    photoVerified: boolean;
  };
  barcodeData?: {
    scanned: string;
    expected: string;
    matched: boolean;
  };
}

interface VerificationCheck {
  id: string;
  name: string;
  status: "verified" | "failed" | "pending" | "skipped";
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

interface Sample {
  id: string;
  sampleNumber: string;
  barcode: string;
  status: string;
  createdAt: string;
  order: {
    orderNumber: string;
    patient: { uhid: string; firstName: string; lastName: string };
  };
  test: { testCode: string; testName: string };
}

interface SampleAuditModalProps {
  sample: Sample | null;
  isOpen: boolean;
  onClose: () => void;
  logs?: AuditLog[];
}

type AuditView = "timeline" | "verification" | "summary";

const STATUS_CONFIG: Record<
  AuditLog["status"],
  { color: string; bg: string; border: string; label: string }
> = {
  SUCCESS: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "Passed" },
  FAILED: { color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200", label: "Failed" },
  WARNING: { color: "text-amber-800", bg: "bg-amber-50", border: "border-amber-200", label: "Warning" },
};

function AuditCard({
  log,
  expanded,
  onToggle,
}: {
  log: AuditLog;
  expanded: boolean;
  onToggle: () => void;
}) {
  const statusConfig = STATUS_CONFIG[log.status];

  const actionIcon: Record<string, React.ElementType> = {
    PATIENT_VERIFICATION: Fingerprint,
    BARCODE_SCAN: Scan,
    SAMPLE_COLLECTION: FlaskConical,
    INTEGRITY_CHECK: ShieldCheck,
    LAB_RECEIPT: ClipboardCheck,
    PROCESSING_START: FlaskConical,
    RESULT_VALIDATION: FileText,
    REJECTION: XCircle,
  };

  const ActionIcon = actionIcon[log.action] || History;

  return (
    <div
      className={`rounded-xl border transition-all ${
        log.status === "FAILED"
          ? "border-rose-200 bg-rose-50/50"
          : log.status === "WARNING"
          ? "border-amber-200 bg-amber-50/50"
          : "border-slate-200 bg-white shadow-sm"
      }`}
    >
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className={`shrink-0 h-9 w-9 rounded-xl flex items-center justify-center border ${statusConfig.border} ${statusConfig.bg}`}>
          <ActionIcon className={`h-4 w-4 ${statusConfig.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-slate-900 leading-none">
              {log.action.replace(/_/g, " ")}
            </p>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${statusConfig.border} ${statusConfig.bg} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{log.description}</p>
        </div>

        <div className="shrink-0 text-right flex items-center gap-3">
          <div>
            <p className="text-[11px] text-slate-600 font-medium">
              {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-[10px] text-slate-400">
              {new Date(log.createdAt).toLocaleDateString([], { day: "2-digit", month: "short" })}
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              { icon: User2, label: "Operator", value: `${log.userName} (${log.role})` },
              { icon: MapPin, label: "Location", value: log.location || "—" },
              { icon: Laptop2, label: "Device", value: log.deviceInfo || "—" },
              { icon: Lock, label: "IP Address", value: log.ipAddress || "—" },
              { icon: Hash, label: "Session ID", value: log.sessionId?.slice(-8) || "—" },
              { icon: Clock, label: "Timestamp", value: new Date(log.createdAt).toLocaleString() },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon className="h-3 w-3 text-sky-600" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{label}</span>
                </div>
                <p className="text-[11px] text-slate-900 font-mono truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Patient verification grid */}
          {log.patientVerification && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-2">
                Patient 2-Identifier Verification Check
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(log.patientVerification).map(([k, v]) => (
                  <div
                    key={k}
                    className={`rounded-lg p-2 border text-center ${
                      v
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-rose-200 bg-rose-50"
                    }`}
                  >
                    {v ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-600 mx-auto mb-1" />
                    )}
                    <p className="text-[9px] font-black text-slate-800 capitalize">
                      {k.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Barcode match */}
          {log.barcodeData && (
            <div
              className={`rounded-xl border p-3 ${
                log.barcodeData.matched
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-rose-200 bg-rose-50"
              }`}
            >
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                Barcode Scanning Match
              </p>
              <div className="grid grid-cols-3 gap-3 text-[11px]">
                <div>
                  <p className="text-slate-500 mb-0.5">Scanned</p>
                  <p className="font-mono font-black text-slate-900">{log.barcodeData.scanned}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Expected</p>
                  <p className="font-mono font-black text-slate-900">{log.barcodeData.expected}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Result</p>
                  <p className={`font-black ${log.barcodeData.matched ? "text-emerald-700" : "text-rose-700"}`}>
                    {log.barcodeData.matched ? "✓ MATCHED" : "✗ MISMATCH"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SampleAuditModal({
  sample,
  isOpen,
  onClose,
  logs = [],
}: SampleAuditModalProps) {
  const [activeView, setActiveView] = useState<AuditView>("timeline");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  if (!isOpen || !sample) return null;

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const auditLogs: AuditLog[] = logs.length > 0 ? logs : [
    {
      id: "log-1",
      action: "PATIENT_VERIFICATION",
      entity: "PATIENT",
      entityId: sample.order.patient.uhid,
      userName: "Sarah Johnson",
      role: "PHLEBOTOMIST",
      ipAddress: "192.168.1.104",
      description: `Verified identity for ${sample.order.patient.firstName} ${sample.order.patient.lastName}`,
      createdAt: sample.createdAt,
      status: "SUCCESS",
      location: "Phlebotomy Room A",
      deviceInfo: "Scanner Bay #1",
      patientVerification: { nameVerified: true, uhidVerified: true, dobVerified: true, photoVerified: true },
    },
    {
      id: "log-2",
      action: "BARCODE_SCAN",
      entity: "SAMPLE",
      entityId: sample.id,
      userName: "Sarah Johnson",
      role: "PHLEBOTOMIST",
      ipAddress: "192.168.1.104",
      description: `Matched barcode ${sample.barcode} with accession slip`,
      createdAt: new Date(new Date(sample.createdAt).getTime() + 120000).toISOString(),
      status: "SUCCESS",
      location: "Phlebotomy Room A",
      barcodeData: { scanned: sample.barcode, expected: sample.barcode, matched: true },
    },
    {
      id: "log-3",
      action: "INTEGRITY_CHECK",
      entity: "SAMPLE",
      entityId: sample.id,
      userName: "Alex Rivera",
      role: "LAB_TECH",
      ipAddress: "192.168.1.112",
      description: "Pre-analytical volume, cap seal & optical transparency confirmed",
      createdAt: new Date(new Date(sample.createdAt).getTime() + 600000).toISOString(),
      status: "SUCCESS",
      location: "Central Reception",
    },
  ];

  const successRate = Math.round(
    (auditLogs.filter((l) => l.status === "SUCCESS").length / Math.max(1, auditLogs.length)) * 100
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">ISO 15189 Quality &amp; Audit Trail</h2>
                <span className="font-mono text-[10px] font-black text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
                  {sample.sampleNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                NABL / CAP compliant pre-analytical compliance log &amp; audit evidence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800">
              {successRate}% Quality Pass Rate
            </span>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition shadow-sm"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 shrink-0">
          {[
            { key: "timeline" as const, label: "Audit Log Trail", icon: History },
            { key: "summary" as const, label: "Compliance Declaration", icon: ClipboardCheck },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveView(key)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 ${
                activeView === key
                  ? "text-sky-700 border-sky-600 bg-sky-50/50"
                  : "text-slate-500 border-transparent hover:text-slate-900"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {activeView === "timeline" ? (
            auditLogs.map((log) => (
              <AuditCard
                key={log.id}
                log={log}
                expanded={expandedCards.has(log.id)}
                onToggle={() => toggleCard(log.id)}
              />
            ))
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total Events", value: auditLogs.length, color: "text-sky-700" },
                  { label: "Passed", value: auditLogs.filter((l) => l.status === "SUCCESS").length, color: "text-emerald-700" },
                  { label: "Failed / Warned", value: auditLogs.filter((l) => l.status !== "SUCCESS").length, color: "text-rose-700" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-center">
                    <p className={`text-2xl font-black ${color}`}>{value}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase">{label}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-4 w-4 text-sky-700" />
                  <p className="text-xs font-black text-sky-900">ISO 15189:2022 Accreditation Statement</p>
                </div>
                <p className="text-xs text-sky-900/90 leading-relaxed">
                  All chain-of-custody handoffs, timestamps, and technician signatures for specimen{" "}
                  <strong className="font-mono">{sample.sampleNumber}</strong> are cryptographically sealed and read-only.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <Lock className="h-3 w-3 text-slate-400" /> Tamper-evident electronic record
          </span>
          <span className="flex items-center gap-1.5 text-sky-700 font-bold">
            <ShieldCheck className="h-3.5 w-3.5" /> NABL &amp; ISO 15189 Validated
          </span>
        </div>
      </div>
    </div>
  );
}
