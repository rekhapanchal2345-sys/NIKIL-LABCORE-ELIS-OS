"use client";

import React from "react";
import { ClipboardCheck, X } from "lucide-react";

interface Props {
  orderNumber: string;
  openedAt: Date;
  priority?: string;
  loading: boolean;
  onClose: () => void;
}

export default function PhlebotomyModalHeader({ orderNumber, openedAt, priority, loading, onClose }: Props) {
  const isPriority = priority === "STAT" || priority === "URGENT";

  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 text-sky-700">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 id="draw-modal-title" className="text-base font-semibold text-slate-900">
            Specimen Collection
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Requisition <span className="font-mono font-semibold text-slate-700">{orderNumber}</span>
            {" · "}
            {openedAt.toLocaleString([], { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isPriority && (
          <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-700">
            {priority}
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Close"
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
