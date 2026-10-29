"use client";

import React from "react";
import Link from "next/link";
import type { Approval } from "./ApprovalTable";

interface ApprovalCardProps {
  approval: Approval;
  onApprove?: (approval: Approval) => void;
  onReject?: (approval: Approval) => void;
}

function formatDate(date?: string) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status?: string) {
  const value = status?.toLowerCase();

  if (
    value === "approved" ||
    value === "completed"
  ) {
    return "bg-emerald-100 text-emerald-800 border border-emerald-200";
  }

  if (
    value === "rejected" ||
    value === "cancelled"
  ) {
    return "bg-red-100 text-red-800 border border-red-200";
  }

  if (
    value === "pending" ||
    value === "submitted" ||
    value === "under_review"
  ) {
    return "bg-amber-100 text-amber-800 border border-amber-200";
  }

  return "bg-gray-100 text-gray-600 border border-gray-200";
}

export default function ApprovalCard({
  approval,
  onApprove,
  onReject,
}: ApprovalCardProps) {
  const pending =
    !approval.status ||
    ["pending", "submitted", "under_review"].includes(
      approval.status.toLowerCase()
    );

  const isCritical = approval.criticalValues && approval.criticalValues.length > 0;

  return (
    <article className={`rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${
      isCritical
        ? "border-l-4 border-l-red-500 border-red-200"
        : "border-gray-200"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg border ${
            isCritical
              ? "bg-red-50 border-red-200 text-red-600"
              : "bg-sky-50 border-sky-200 text-sky-600"
          }`}>
            {isCritical ? "🚨" : "✓"}
          </div>

          <div className="min-w-0">
            {approval.resultId ? (
              <Link
                href={`/results/${approval.resultId}`}
                className="block truncate text-base font-semibold text-slate-900 hover:text-sky-600 transition-colors hover:underline"
              >
                {approval.resultNumber ||
                  `RES-${approval.resultId}`}
              </Link>
            ) : (
              <p className="truncate text-base font-semibold text-slate-900">
                {approval.resultNumber ||
                  `APR-${approval.id}`}
              </p>
            )}

            <p className="mt-1 text-xs text-slate-400">
              Submitted{" "}
              {formatDate(
                approval.submittedAt
              )}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
            approval.status
          )}`}
        >
          {approval.status || "Pending"}
        </span>
      </div>

      {isCritical && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs font-bold text-red-700 flex items-center gap-1.5">
            <span>🚨</span>
            <span>{approval.criticalValues?.length} Critical / Panic Value{(approval.criticalValues?.length || 0) > 1 ? "s" : ""} — Verbal doctor call required before release</span>
          </p>
        </div>
      )}

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Patient
          </p>

          {approval.patientId ? (
            <Link
              href={`/patients/${approval.patientId}`}
              className="mt-1 block text-sm font-semibold text-slate-800 hover:text-sky-600 transition-colors hover:underline"
            >
              {approval.patientName ||
                `Patient #${approval.patientId}`}
            </Link>
          ) : (
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {approval.patientName || "—"}
            </p>
          )}

          {(approval.patientAge || approval.patientGender || approval.patientUhid) && (
            <p className="mt-0.5 text-xs text-slate-400">
              {[
                approval.patientUhid,
                approval.patientAge ? `${approval.patientAge}Y` : null,
                approval.patientGender,
              ].filter(Boolean).join(" • ")}
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Test
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            {approval.testName ||
              "Laboratory Test"}
          </p>

          {approval.testCode && (
            <p className="mt-1 font-mono text-xs text-slate-400">
              {approval.testCode}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-xl bg-[#F8FAFC] p-4 border border-gray-100">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Submitted By
            </p>

            <p className="mt-1 text-sm font-medium text-slate-700">
              {approval.submittedBy || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Approved By
            </p>

            <p className="mt-1 text-sm font-medium text-slate-700">
              {approval.approvedBy || "—"}
            </p>
          </div>
        </div>

        {approval.rejectionReason && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-xs font-bold text-red-800 uppercase tracking-wider">
              Rejection Reason
            </p>

            <p className="mt-1 text-sm text-red-700">
              {approval.rejectionReason}
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-end gap-2 border-t border-gray-100 pt-4">
        {approval.resultId && (
          <Link
            href={`/results/${approval.resultId}`}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            Review Result
          </Link>
        )}

        {pending && onApprove && (
          <button
            type="button"
            onClick={() => onApprove(approval)}
            className="rounded-lg bg-[#059669] hover:bg-[#047857] px-3 py-2 text-xs font-medium text-white shadow-sm transition-colors"
          >
            Approve
          </button>
        )}

        {pending && onReject && (
          <button
            type="button"
            onClick={() => onReject(approval)}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Reject
          </button>
        )}
      </div>
    </article>
  );
}
