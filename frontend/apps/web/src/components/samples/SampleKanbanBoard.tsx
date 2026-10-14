"use client";

import React from "react";
import { 
  Clock3, Droplet, MapPin, Activity, CheckCircle2, 
  AlertTriangle, FlaskConical, ScanLine, UserRound, ArrowRight,
  Flame, ChevronRight, ShieldAlert, Sparkles, Building2, Printer
} from "lucide-react";

export interface KanbanSample {
  id: string;
  sampleNumber: string;
  barcode: string;
  patientId: string;
  orderId: string;
  testId: string;
  sampleType: string;
  status: string;
  priority?: string;
  collectedAt?: string;
  receivedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  order: {
    orderNumber: string;
    patient: {
      uhid: string;
      firstName: string;
      lastName: string;
      gender: string;
      age?: number;
    };
    doctor?: {
      fullName: string;
    };
  };
  test: {
    testCode: string;
    testName: string;
    sampleContainer: string;
    processingDepartment?: string;
  };
}

interface SampleKanbanBoardProps {
  samples: KanbanSample[];
  onSelectSample: (sample: KanbanSample) => void;
  onAdvanceStatus: (sample: KanbanSample, nextStatus: string) => void;
  onPrintLabel: (sample: KanbanSample) => void;
  onRejectSample: (sampleId: string) => void;
  updatingSampleId: string | null;
}

const TUBE_CONTAINER_STYLES: Record<string, { bg: string; text: string; border: string; capColor: string; label: string }> = {
  "EDTA Tube": { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", capColor: "#8B5CF6", label: "Lavender EDTA" },
  "Lavender Top": { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", capColor: "#8B5CF6", label: "Lavender EDTA" },
  "Serum Separator Tube": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", capColor: "#F59E0B", label: "Gold SST Gel" },
  "SST": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", capColor: "#F59E0B", label: "Gold SST Gel" },
  "Red Top": { bg: "bg-red-50", text: "text-red-800", border: "border-red-200", capColor: "#EF4444", label: "Red Plain Serum" },
  "Sodium Citrate": { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", label: "Light Blue Citrate" },
  "Light Blue": { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", label: "Light Blue Citrate" },
  "Lithium Heparin": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", capColor: "#10B981", label: "Green Heparin" },
  "Green Top": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", capColor: "#10B981", label: "Green Heparin" },
  "Fluoride Tube": { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", capColor: "#64748B", label: "Grey Fluoride" },
  "Grey Top": { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", capColor: "#64748B", label: "Grey Fluoride" },
  "Sterile Container": { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200", capColor: "#EAB308", label: "Urine Sterile Cup" },
};

function getTubeStyle(containerName?: string) {
  if (!containerName) return { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", label: "Standard Tube" };
  for (const [key, val] of Object.entries(TUBE_CONTAINER_STYLES)) {
    if (containerName.toLowerCase().includes(key.toLowerCase())) {
      return val;
    }
  }
  return { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", label: containerName };
}

function getAgeMinutes(dateString: string) {
  return Math.round((Date.now() - new Date(dateString).getTime()) / (1000 * 60));
}

export default function SampleKanbanBoard({
  samples,
  onSelectSample,
  onAdvanceStatus,
  onPrintLabel,
  onRejectSample,
  updatingSampleId,
}: SampleKanbanBoardProps) {
  const COLUMNS = [
    {
      id: "PENDING",
      title: "1. Phlebotomy Due",
      sub: "Awaiting sample collection",
      badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
      headerBg: "bg-amber-50/70 text-amber-900 border-amber-200/80",
      icon: Clock3,
      nextAction: "Collect",
      nextStatus: "COLLECTED",
    },
    {
      id: "COLLECTED",
      title: "2. In-Transit / Dispatch",
      sub: "Drawn & en route to lab",
      badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-800",
      headerBg: "bg-indigo-50/70 text-indigo-900 border-indigo-200/80",
      icon: Droplet,
      nextAction: "Receive in Lab",
      nextStatus: "RECEIVED",
    },
    {
      id: "RECEIVED",
      title: "3. Accession & QC",
      sub: "Integrity checked, ready",
      badgeClass: "border-sky-200 bg-sky-50 text-sky-800",
      headerBg: "bg-sky-50/70 text-sky-900 border-sky-200/80",
      icon: MapPin,
      nextAction: "Route to Analyzer",
      nextStatus: "PROCESSING",
    },
    {
      id: "PROCESSING",
      title: "4. In-Analyzer Run",
      sub: "Test running on bays",
      badgeClass: "border-purple-200 bg-purple-50 text-purple-800",
      headerBg: "bg-purple-50/70 text-purple-900 border-purple-200/80",
      icon: Activity,
      nextAction: "Validate & Finish",
      nextStatus: "COMPLETED",
    },
    {
      id: "COMPLETED",
      title: "5. Completed & Validated",
      sub: "Results verified & archived",
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
      headerBg: "bg-emerald-50/70 text-emerald-900 border-emerald-200/80",
      icon: CheckCircle2,
      nextAction: null,
      nextStatus: null,
    },
  ];

  const rejectedSamples = samples.filter((s) => s.status === "REJECTED");

  return (
    <div className="space-y-6">
      {/* Rejected / Redraw Alert Bar */}
      {rejectedSamples.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700 ring-1 ring-rose-200">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-black text-rose-900">
                {rejectedSamples.length} Specimen{rejectedSamples.length > 1 ? "s" : ""} Rejected — Redraw Requisition Needed
              </p>
              <p className="text-[11px] text-rose-700">
                Hemolysis, clotted specimen, or volume deficiency flagged by laboratory QC desk.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {rejectedSamples.slice(0, 3).map((rs) => (
              <button
                key={rs.id}
                onClick={() => onSelectSample(rs)}
                className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-100 transition-colors shadow-sm"
              >
                {rs.sampleNumber} · {rs.rejectionReason || "Redraw"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Kanban Multi-Column Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {COLUMNS.map((col) => {
          const colSamples = samples.filter((s) => s.status === col.id);
          const Icon = col.icon;

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/70 shadow-sm min-h-[550px]"
            >
              {/* Column Header */}
              <div className={`rounded-t-2xl border-b p-3.5 ${col.headerBg}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <h3 className="text-xs font-black tracking-wide">
                      {col.title}
                    </h3>
                  </div>
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 font-mono text-[10px] font-black text-slate-800 shadow-sm border border-slate-200">
                    {colSamples.length}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-slate-500 font-medium">{col.sub}</p>
              </div>

              {/* Column Sample Cards Scroll Container */}
              <div className="flex-1 space-y-3 p-3 overflow-y-auto max-h-[750px]">
                {colSamples.length === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-4 text-center">
                    <FlaskConical className="h-6 w-6 text-slate-300" />
                    <p className="mt-2 text-xs font-bold text-slate-400">Queue Empty</p>
                    <p className="text-[10px] text-slate-400">No specimens in this stage</p>
                  </div>
                ) : (
                  colSamples.map((sample) => {
                    const tube = getTubeStyle(sample.test.sampleContainer);
                    const isStat = sample.priority === "STAT" || sample.priority === "URGENT";
                    const ageMins = getAgeMinutes(sample.createdAt);
                    const isUpdating = updatingSampleId === sample.id;

                    return (
                      <div
                        key={sample.id}
                        className={`group relative rounded-xl border bg-white p-3.5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-sky-300 ${
                          isStat ? "border-rose-300 bg-rose-50/30 ring-1 ring-rose-400/30" : "border-slate-200"
                        }`}
                      >
                        {/* Header: Sample Code + STAT badge */}
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => onSelectSample(sample)}
                            className="font-mono text-xs font-black text-slate-900 hover:text-sky-600 transition-colors text-left"
                          >
                            {sample.sampleNumber}
                          </button>

                          <div className="flex items-center gap-1">
                            {isStat && (
                              <span className="flex items-center gap-1 rounded bg-rose-600 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white">
                                <Flame className="h-2.5 w-2.5 fill-white" /> STAT
                              </span>
                            )}
                            <button
                              onClick={() => onPrintLabel(sample)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                              title="Print Barcode Tube Label"
                            >
                              <Printer className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Barcode line */}
                        <p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-slate-500 font-semibold">
                          <ScanLine className="h-3 w-3 text-sky-600" /> {sample.barcode}
                        </p>

                        {/* Patient info */}
                        <div className="mt-2.5 rounded-lg border border-slate-100 bg-slate-50 p-2">
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <UserRound className="h-3 w-3 text-sky-600" />
                            {sample.order.patient.firstName} {sample.order.patient.lastName}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                            <span className="font-mono font-bold">UHID: {sample.order.patient.uhid}</span>
                            <span>{sample.order.patient.age || "—"}y · {sample.order.patient.gender}</span>
                          </div>
                        </div>

                        {/* Test details */}
                        <div className="mt-2.5">
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">{sample.test.testName}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] font-black text-slate-700">
                              {sample.test.testCode}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {sample.test.processingDepartment || "Core Lab"}
                            </span>
                          </div>
                        </div>

                        {/* Tube Container Visual Badge */}
                        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
                          <div
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[9px] font-bold ${tube.border} ${tube.bg} ${tube.text}`}
                          >
                            <span
                              className="h-2 w-2 rounded-full shadow-inner"
                              style={{ backgroundColor: tube.capColor }}
                            />
                            <span>{tube.label}</span>
                          </div>

                          <span className="text-[10px] text-slate-400 font-medium">
                            {ageMins < 60 ? `${ageMins}m ago` : `${Math.floor(ageMins / 60)}h ${ageMins % 60}m`}
                          </span>
                        </div>

                        {/* Stage Progression Action Button */}
                        {col.nextAction && col.nextStatus && (
                          <button
                            onClick={() => onAdvanceStatus(sample, col.nextStatus)}
                            disabled={isUpdating}
                            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 py-2 text-xs font-black text-white shadow-sm hover:from-sky-500 hover:to-blue-500 transition-all disabled:opacity-50"
                          >
                            <span>{isUpdating ? "Processing..." : col.nextAction}</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
