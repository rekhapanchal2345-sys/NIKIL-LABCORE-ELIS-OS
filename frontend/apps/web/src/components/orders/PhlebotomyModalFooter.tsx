"use client";

import React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

interface Props {
  collectorName: string;
  hint?: string;
  canSubmit: boolean;
  loading: boolean;
  onClose: () => void;
}

export default function PhlebotomyModalFooter({ collectorName, hint, canSubmit, loading, onClose }: Props) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-[11px] text-slate-500">
        <p>
          Collected by <span className="font-semibold text-slate-700">{collectorName}</span>
        </p>
        {hint && !canSubmit && !loading && <p className="mt-0.5">{hint}</p>}
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Recording…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" /> Confirm collection
            </>
          )}
        </button>
      </div>
    </div>
  );
}
