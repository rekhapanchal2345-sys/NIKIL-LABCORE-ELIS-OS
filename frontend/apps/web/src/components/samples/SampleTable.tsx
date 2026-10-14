"use client";

import React from "react";
import Link from "next/link";
import { FlaskConical, ScanLine, UserRound, ArrowRight } from "lucide-react";

export interface LabSample {
  id: string | number;
  sampleNumber?: string;
  barcode?: string;
  patientId?: string | number;
  patientName?: string;
  orderId?: string | number;
  orderNumber?: string;
  sampleType?: string;
  status?: string;
  collectedBy?: string;
  collectedAt?: string;
  receivedAt?: string;
  rejectedReason?: string;
}

interface SampleTableProps {
  samples: LabSample[];
  loading?: boolean;
  onDelete?: (sample: LabSample) => void;
}

function formatDate(date?: string) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status?: string) {
  const value = status?.toLowerCase();
  if (value === "completed" || value === "received" || value === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 font-bold";
  }
  if (value === "rejected" || value === "cancelled") {
    return "border-rose-200 bg-rose-50 text-rose-800 font-bold";
  }
  if (value === "pending" || value === "collected" || value === "processing") {
    return "border-amber-200 bg-amber-50 text-amber-800 font-bold";
  }
  return "border-slate-200 bg-slate-100 text-slate-700 font-medium";
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, row) => (
        <tr key={row} className="border-t border-slate-100">
          {Array.from({ length: 8 }).map((__, cell) => (
            <td key={cell} className="px-4 py-4">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function SampleTable({
  samples,
  loading = false,
  onDelete,
}: SampleTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Command bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center gap-3">
        <span className="rounded-xl border border-sky-200 bg-sky-50 p-2 text-sky-700 shadow-sm">
          <FlaskConical className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-black text-slate-900 tracking-wide">Sample Worklist</h2>
          <p className="text-xs text-slate-500">Laboratory specimen tracking and chain of custody</p>
        </div>
        <span className="ml-auto rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black text-sky-800">
          {samples.length} specimens
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-black uppercase text-[10px] tracking-wider">
                <div>Sample</div>
                <span className="text-[9px] font-medium text-slate-400">Accession ID</span>
              </th>
              <th className="px-4 py-3 font-black uppercase text-[10px] tracking-wider">
                <div>Barcode</div>
                <span className="text-[9px] font-medium text-slate-400">Tube label</span>
              </th>
              <th className="px-4 py-3 font-black uppercase text-[10px] tracking-wider">
                <div>Patient</div>
                <span className="text-[9px] font-medium text-slate-400">Identity</span>
              </th>
              <th className="px-4 py-3 font-black uppercase text-[10px] tracking-wider">
                <div>Order</div>
                <span className="text-[9px] font-medium text-slate-400">Requisition</span>
              </th>
              <th className="px-4 py-3 font-black uppercase text-[10px] tracking-wider">
                <div>Sample Type</div>
                <span className="text-[9px] font-medium text-slate-400">Matrix</span>
              </th>
              <th className="px-4 py-3 font-black uppercase text-[10px] tracking-wider">
                <div>Status</div>
                <span className="text-[9px] font-medium text-slate-400">Stage</span>
              </th>
              <th className="px-4 py-3 font-black uppercase text-[10px] tracking-wider">
                <div>Collected</div>
                <span className="text-[9px] font-medium text-slate-400">Timestamp</span>
              </th>
              <th className="px-4 py-3 font-black uppercase text-[10px] tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <LoadingRows />
            ) : samples.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  No specimens registered in worklist.
                </td>
              </tr>
            ) : (
              samples.map((sample) => (
                <tr key={sample.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                    {sample.sampleNumber || `SMP-${sample.id}`}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                    {sample.barcode || "—"}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    {sample.patientName || "—"}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                    {sample.orderNumber || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-slate-700">
                    {sample.sampleType || "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] uppercase ${statusBadge(sample.status)}`}>
                      {sample.status || "UNKNOWN"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                    {formatDate(sample.collectedAt)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/samples/${sample.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800"
                    >
                      Dossier <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}