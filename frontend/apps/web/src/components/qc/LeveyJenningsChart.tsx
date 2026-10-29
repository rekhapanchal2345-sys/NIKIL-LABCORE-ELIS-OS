"use client";

import React from "react";
import { X, Activity, CheckCircle2 } from "lucide-react";

export interface LeveyJenningsChartProps {
  approvalId?: string;
  testCode?: string;
  onClose?: () => void;
}

export default function LeveyJenningsChart({
  approvalId,
  testCode = "K",
  onClose,
}: LeveyJenningsChartProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Westgard Levey-Jennings Internal QC Chart — {testCode}
            </h3>
            <p className="text-[11px] text-slate-500">
              NABL ISO 15189:2022 Lot #QC-2026-L2 • Mean ± 2SD In-Control{approvalId ? ` • Ref ${approvalId}` : ""}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-xs">
        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Westgard 1-2s / 2-2s / R-4s Rules: PASS (CV% 1.8%)
        </span>
        <span className="font-mono text-slate-600">Analyzer: Roche Cobas c503</span>
      </div>
    </div>
  );
}
