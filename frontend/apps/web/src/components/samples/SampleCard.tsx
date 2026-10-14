"use client";

import React from "react";
import Link from "next/link";
import { FlaskConical, UserRound, ArrowRight, Trash2, Calendar, FileText } from "lucide-react";
import type { LabSample } from "./SampleTable";

interface SampleCardProps {
  sample: LabSample;
  onDelete?: (sample: LabSample) => void;
}

function formatDate(date?: string) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClass(status?: string) {
  const value = status?.toLowerCase();

  if (
    value === "completed" ||
    value === "received" ||
    value === "approved"
  ) {
    return "border border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (
    value === "rejected" ||
    value === "cancelled"
  ) {
    return "border border-rose-200 bg-rose-50 text-rose-800";
  }

  if (
    value === "pending" ||
    value === "collected" ||
    value === "processing"
  ) {
    return "border border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border border-slate-200 bg-slate-100 text-slate-700";
}

export default function SampleCard({
  sample,
  onDelete,
}: SampleCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-sky-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 border border-sky-100 text-sky-600">
            <FlaskConical className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <Link
              href={`/samples/${sample.id}`}
              className="block truncate text-sm font-bold text-slate-900 hover:text-sky-600 transition-colors"
            >
              {sample.sampleNumber || `SMP-${sample.id}`}
            </Link>

            <p className="mt-0.5 font-mono text-xs font-semibold text-slate-500">
              {sample.barcode || "No barcode"}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${statusClass(
            sample.status
          )}`}
        >
          {sample.status || "Pending"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
        <div className="col-span-2 rounded-xl bg-slate-50/70 p-3 border border-slate-100">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
            Patient Identity
          </p>

          {sample.patientId ? (
            <Link
              href={`/patients/${sample.patientId}`}
              className="mt-1 block text-xs font-bold text-slate-900 hover:text-sky-600 transition-colors flex items-center gap-1.5"
            >
              <UserRound className="h-3.5 w-3.5 text-sky-600" />
              <span>{sample.patientName || `Patient #${sample.patientId}`}</span>
            </Link>
          ) : (
            <p className="mt-1 text-xs font-bold text-slate-900">
              {sample.patientName || "—"}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-slate-50/70 p-2.5 border border-slate-100">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
            Order Ref
          </p>

          {sample.orderId ? (
            <Link
              href={`/orders/${sample.orderId}`}
              className="mt-0.5 block font-mono text-xs font-bold text-sky-700 hover:text-sky-800 transition-colors"
            >
              {sample.orderNumber || `ORD-${sample.orderId}`}
            </Link>
          ) : (
            <p className="mt-0.5 text-xs text-slate-400">—</p>
          )}
        </div>

        <div className="rounded-xl bg-slate-50/70 p-2.5 border border-slate-100">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
            Specimen Type
          </p>
          <p className="mt-0.5 font-semibold text-slate-800">
            {sample.sampleType || "—"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50/70 p-2.5 border border-slate-100">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
            Collector
          </p>
          <p className="mt-0.5 text-slate-700 truncate">
            {sample.collectedBy || "Unassigned"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50/70 p-2.5 border border-slate-100">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
            Collected Date
          </p>
          <p className="mt-0.5 text-slate-700 truncate">
            {formatDate(sample.collectedAt)}
          </p>
        </div>
      </div>

      {sample.rejectedReason && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
          <p className="text-[11px] font-bold text-rose-800">
            Rejection Non-Conformity
          </p>
          <p className="mt-0.5 text-xs text-rose-700">
            {sample.rejectedReason}
          </p>
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
        <Link
          href={`/samples/${sample.id}`}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          View Dossier
        </Link>

        <Link
          href={`/samples/${sample.id}?edit=true`}
          className="rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-xs font-bold text-sky-800 hover:bg-sky-100 transition-colors"
        >
          Modify
        </Link>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(sample)}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </article>
  );
}