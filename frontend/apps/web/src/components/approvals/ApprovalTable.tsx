"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileSignature,
  PencilLine,
  PhoneCall,
  RotateCcw,
  XCircle,
} from "lucide-react";
import {
  WAITING_TONE_CLASSES,
  formatAgeSex,
  formatDateTime,
  formatWaiting,
  getStatusChipClasses,
  getStatusLabel,
  getWaitingTone,
  isAwaitingEntryStatus,
  isSignableStatus,
  isSignedStatus,
  minutesSince,
} from "./approvalUtils";

export interface Approval {
  id: string | number;
  resultId?: string | number;
  resultNumber?: string;
  orderId?: string;
  orderNumber?: string;
  barcode?: string;
  patientId?: string | number;
  patientName?: string;
  patientUhid?: string;
  patientAge?: number;
  patientGender?: string;
  testId?: string | number;
  testName?: string;
  testCode?: string;
  submittedBy?: string;
  submittedAt?: string;
  assignedPathologist?: string;
  status?: string;
  abnormalCount?: number;
  criticalValues?: string[];
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  remarks?: string;
  onReview?: () => void;
  onRerun?: () => void;
}

interface ApprovalTableProps {
  approvals: Approval[];
  loading?: boolean;
  /** Total number of matching results on the server (all pages). */
  total?: number;
  onApprove?: (approval: Approval) => void;
  onReject?: (approval: Approval) => void;
  onReview?: (approval: Approval) => void;
  /** Opens the "return for rerun" reason dialog owned by the page. */
  onRequestRerun?: (approval: Approval) => void;
  onRerun?: (approval: Approval) => void;
  /** Opens the critical-value call-back log for an approval. */
  onCriticalCall?: (approval: Approval) => void;
  selectedApprovals?: Set<string | number>;
  onSelectApproval?: (approvalId: string | number) => void;
  onSelectAll?: (selected: boolean) => void;
}

const COLUMN_COUNT = 9;

const iconButton =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300";

function FindingsBadge({ count, critical }: { count?: number; critical?: string[] }) {
  if (critical && critical.length > 0) {
    return (
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
          <AlertOctagon className="h-3 w-3" />
          {critical.length} critical
        </span>
        <p className="max-w-[160px] truncate text-[11px] text-red-600" title={critical.join(", ")}>
          {critical.join(", ")}
        </p>
      </div>
    );
  }
  if (count && count > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
        <AlertTriangle className="h-3 w-3" />
        {count} abnormal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
      <CheckCircle2 className="h-3 w-3" />
      Within limits
    </span>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, row) => (
        <tr key={row}>
          {Array.from({ length: COLUMN_COUNT }).map((__, cell) => (
            <td key={cell} className="px-4 py-4">
              <div className="h-4 w-full max-w-[110px] animate-pulse rounded bg-slate-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function ApprovalTable({
  approvals,
  loading = false,
  total,
  onApprove,
  onReject,
  onReview,
  onRequestRerun,
  onRerun,
  onCriticalCall,
  selectedApprovals = new Set(),
  onSelectApproval,
  onSelectAll,
}: ApprovalTableProps) {
  // Re-render once a minute so the "Waiting" column stays accurate.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const signable = approvals.filter((a) => isSignableStatus(a.status));
  const selectedSignable = signable.filter((a) => selectedApprovals.has(a.id)).length;
  const allSelected = signable.length > 0 && selectedSignable === signable.length;
  const someSelected = selectedSignable > 0 && !allSelected;

  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);

  const criticalCount = approvals.filter((a) => a.criticalValues && a.criticalValues.length > 0).length;
  const showing = total && total > approvals.length ? `${approvals.length} of ${total}` : `${approvals.length}`;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Worklist header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 text-sky-700">
            <ClipboardList className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Approval Worklist</h2>
            <p className="text-xs text-slate-500">Review, authorize or return laboratory results</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700">
            {showing} result{approvals.length === 1 && !total ? "" : "s"}
          </span>
          {criticalCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 font-semibold text-red-700">
              <AlertOctagon className="h-3 w-3" />
              {criticalCount} critical
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th scope="col" className="w-10 px-4 py-2.5">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  disabled={signable.length === 0}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  aria-label="Select all results ready for sign-off"
                  className="h-4 w-4 rounded border-slate-300 accent-sky-600 disabled:opacity-40"
                />
              </th>
              <th scope="col" className="px-4 py-2.5">Order / Sample</th>
              <th scope="col" className="px-4 py-2.5">Patient</th>
              <th scope="col" className="px-4 py-2.5">Investigation</th>
              <th scope="col" className="px-4 py-2.5">Findings</th>
              <th scope="col" className="px-4 py-2.5">Entered by</th>
              <th scope="col" className="px-4 py-2.5">Waiting</th>
              <th scope="col" className="px-4 py-2.5">Status</th>
              <th scope="col" className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <LoadingRows />
            ) : approvals.length === 0 ? (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-6 py-14 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-700">No results in this queue</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Results that match the selected queue and filters will be listed here.
                  </p>
                </td>
              </tr>
            ) : (
              approvals.map((approval) => {
                const isCritical = Boolean(approval.criticalValues && approval.criticalValues.length > 0);
                const canSign = isSignableStatus(approval.status);
                const awaitingEntry = isAwaitingEntryStatus(approval.status);
                const signed = isSignedStatus(approval.status);
                const isSelected = selectedApprovals.has(approval.id);

                const waitingMinutes = signed ? null : minutesSince(approval.submittedAt, now);
                const waitingTone = getWaitingTone(waitingMinutes, isCritical);

                return (
                  <tr
                    key={approval.id}
                    className={`transition-colors ${
                      isCritical
                        ? "bg-red-50/50 hover:bg-red-50"
                        : isSelected
                          ? "bg-sky-50/60"
                          : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    {/* Selection - the left rule marks critical rows */}
                    <td className={`px-4 py-3.5 ${isCritical ? "border-l-4 border-l-red-500" : "border-l-4 border-l-transparent"}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!canSign}
                        onChange={() => onSelectApproval?.(approval.id)}
                        aria-label={`Select ${approval.orderNumber || "result"}`}
                        className="h-4 w-4 rounded border-slate-300 accent-sky-600 disabled:opacity-30"
                      />
                    </td>

                    {/* Order / sample */}
                    <td className="px-4 py-3.5">
                      {approval.orderNumber ? (
                        approval.orderId ? (
                          <Link
                            href={`/orders/${approval.orderId}`}
                            className="font-mono text-[13px] font-semibold text-slate-900 transition-colors hover:text-sky-700"
                          >
                            {approval.orderNumber}
                          </Link>
                        ) : (
                          <span className="font-mono text-[13px] font-semibold text-slate-900">{approval.orderNumber}</span>
                        )
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                      {approval.barcode && <p className="mt-0.5 font-mono text-[11px] text-slate-500">{approval.barcode}</p>}
                    </td>

                    {/* Patient */}
                    <td className="px-4 py-3.5">
                      {approval.patientId ? (
                        <Link
                          href={`/patients/${approval.patientId}`}
                          className="text-[13px] font-semibold text-slate-900 transition-colors hover:text-sky-700"
                        >
                          {approval.patientName || `Patient #${approval.patientId}`}
                        </Link>
                      ) : (
                        <span className="text-[13px] font-semibold text-slate-900">{approval.patientName || "—"}</span>
                      )}
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {[approval.patientUhid, formatAgeSex(approval.patientAge, approval.patientGender)]
                          .filter(Boolean)
                          .join("  •  ") || "—"}
                      </p>
                    </td>

                    {/* Investigation */}
                    <td className="px-4 py-3.5">
                      <p className="text-[13px] font-medium text-slate-800">{approval.testName || "Laboratory test"}</p>
                      {approval.testCode && <p className="mt-0.5 font-mono text-[11px] text-slate-500">{approval.testCode}</p>}
                    </td>

                    {/* Findings */}
                    <td className="px-4 py-3.5">
                      {awaitingEntry ? (
                        <span className="text-xs text-slate-400">Not entered yet</span>
                      ) : (
                        <FindingsBadge count={approval.abnormalCount} critical={approval.criticalValues} />
                      )}
                    </td>

                    {/* Entered by */}
                    <td className="px-4 py-3.5 text-xs text-slate-600">{approval.submittedBy || "—"}</td>

                    {/* Waiting */}
                    <td className="px-4 py-3.5">
                      {signed ? (
                        <>
                          <p className="text-xs text-slate-700">{formatDateTime(approval.approvedAt)}</p>
                          {approval.assignedPathologist && approval.assignedPathologist !== "Unassigned" && (
                            <p className="mt-0.5 text-[11px] text-slate-500">{approval.assignedPathologist}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className={`text-xs tabular-nums ${WAITING_TONE_CLASSES[waitingTone]}`}>
                            {formatWaiting(waitingMinutes)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400" title="Time the result was submitted for review">
                            since {formatDateTime(approval.submittedAt)}
                          </p>
                        </>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold ${getStatusChipClasses(approval.status)}`}
                      >
                        {getStatusLabel(approval.status)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {awaitingEntry && (
                          <Link
                            href="/results"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
                          >
                            <PencilLine className="h-3.5 w-3.5" />
                            Enter results
                          </Link>
                        )}

                        {signed && (
                          <Link
                            href={`/approvals/${approval.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View report
                          </Link>
                        )}

                        {canSign && (
                          <>
                            {onReview && (
                              <button
                                type="button"
                                onClick={() => onReview(approval)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0284C7] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#0369A1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                              >
                                <FileSignature className="h-3.5 w-3.5" />
                                Review &amp; sign
                              </button>
                            )}

                            {isCritical && onCriticalCall && (
                              <button
                                type="button"
                                onClick={() => onCriticalCall(approval)}
                                title="Log critical value call-back"
                                aria-label="Log critical value call-back"
                                className={`${iconButton} border-red-200 bg-white text-red-600 hover:bg-red-50`}
                              >
                                <PhoneCall className="h-4 w-4" />
                              </button>
                            )}

                            {!isCritical && onApprove && (
                              <button
                                type="button"
                                onClick={() => onApprove(approval)}
                                title="Approve without opening the review"
                                aria-label="Approve result"
                                className={`${iconButton} border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50`}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                            )}

                            {(onRequestRerun || onRerun) && (
                              <button
                                type="button"
                                onClick={() => (onRequestRerun || onRerun)!(approval)}
                                title="Return for rerun"
                                aria-label="Return for rerun"
                                className={`${iconButton} border-amber-200 bg-white text-amber-700 hover:bg-amber-50`}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                            )}

                            {onReject && (
                              <button
                                type="button"
                                onClick={() => onReject(approval)}
                                title="Reject result"
                                aria-label="Reject result"
                                className={`${iconButton} border-red-200 bg-white text-red-600 hover:bg-red-50`}
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
