"use client";

import React from "react";
import Link from "next/link";

import { approvalApi } from "@/lib/api";
import type { Approval } from "./ApprovalTable";
import LeveyJenningsChart from "../qc/LeveyJenningsChart";
import ResultAmendmentModal from "./ResultAmendmentModal";
import { Activity, FileEdit, History, ShieldCheck } from "lucide-react";


interface ApprovalDetailsProps {
  approval: Approval;
  resultValue?: string | number;
  unit?: string;
  referenceRange?: string;
  interpretation?: string;
  comments?: string;
  criticalValue?: boolean;
  laboratoryInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    accreditation?: string;
  };
  orderInfo?: {
    orderId: string;
    accessionNumber: string;
    orderDate: string;
    priority: string;
    referringDoctor: string;
  };
  sampleInfo?: {
    sampleId: string;
    sampleType: string;
    collectionDate: string;
    receivedDate: string;
    sampleStatus: string;
  };
  resultParameters?: Array<{
    parameterName: string;
    result: string;
    unit: string;
    referenceRange: string;
    flag: string;
  }>;

  signatureData?: any;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onPrint?: () => void;
}

function formatDate(date?: string) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClass(status?: string) {
  const value = status?.toLowerCase();

  if (
    value === "approved" ||
    value === "completed"
  ) {
    return "bg-green-50 text-green-700";
  }

  if (
    value === "rejected" ||
    value === "cancelled"
  ) {
    return "bg-red-50 text-red-700";
  }

  if (
    value === "pending" ||
    value === "submitted" ||
    value === "under_review"
  ) {
    return "bg-yellow-50 text-yellow-700";
  }

  return "bg-gray-100 text-gray-600";
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </dt>

      <dd className="mt-1 text-sm font-medium text-gray-800">
        {value || "—"}
      </dd>
    </div>
  );
}

export default function ApprovalDetails({
  approval,
  resultValue,
  unit,
  referenceRange,
  interpretation,
  comments,
  criticalValue = false,
  laboratoryInfo,
  orderInfo,
  sampleInfo,
  resultParameters,
  signatureData,
  onApprove,
  onReject,
  onEdit,
  onPrint,
}: ApprovalDetailsProps) {
  const [verifying, setVerifying] = React.useState(false);
  const [verificationStatus, setVerificationStatus] = React.useState<any>(signatureData || null);
  const [showQcChart, setShowQcChart] = React.useState(false);
  const [showAmendmentModal, setShowAmendmentModal] = React.useState(false);
  const [amendments, setAmendments] = React.useState<any[]>([]);
  const [loadingAmendments, setLoadingAmendments] = React.useState(false);

  const fetchAmendments = React.useCallback(async () => {
    if (!approval.resultId) return;
    try {
      setLoadingAmendments(true);
      const res = await approvalApi.getAmendments(String(approval.resultId));
      if (res?.success && Array.isArray(res.data)) {
        setAmendments(res.data);
      }
    } catch (err) {
      console.error("Failed to load amendments:", err);
    } finally {
      setLoadingAmendments(false);
    }
  }, [approval.resultId]);

  React.useEffect(() => {
    fetchAmendments();
  }, [fetchAmendments]);

  const handleVerify = async () => {
    if (!approval.resultId) return;
    try {
      setVerifying(true);
      const res = await approvalApi.verifySignature(String(approval.resultId));
      if (res?.data) {
        setVerificationStatus(res.data);
      }
    } catch (err: any) {
      alert("Verification failed: " + (err.message || err));
    } finally {
      setVerifying(false);
    }
  };

  const status =
    approval.status?.toLowerCase() || "pending";

  const isApproved = status === "approved" || status === "completed" || status === "published";

  const canReview = [
    "pending",
    "submitted",
    "under_review",
  ].includes(status);


  return (
    <div className="space-y-6">
      {/* Laboratory Information */}
      {laboratoryInfo && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Laboratory Information
            </h2>
          </div>

          <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              label="Laboratory Name"
              value={laboratoryInfo.name}
            />
            <InfoItem
              label="Address"
              value={laboratoryInfo.address}
            />
            <InfoItem
              label="Phone"
              value={laboratoryInfo.phone}
            />
            <InfoItem
              label="Email"
              value={laboratoryInfo.email}
            />
            <InfoItem
              label="Accreditation"
              value={laboratoryInfo.accreditation}
            />
          </dl>
        </section>
      )}

      {/* Header */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">
                  Approval Review
                </h1>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                    approval.status
                  )}`}
                >
                  {approval.status || "Pending"}
                </span>

                {criticalValue && (
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                    Critical Result
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm text-gray-500">
                {approval.resultNumber ||
                  `RES-${approval.resultId || approval.id}`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {canReview && onApprove && (
                <button
                  type="button"
                  onClick={onApprove}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Approve Result
                </button>
              )}

              {canReview && onReject && (
                <button
                  type="button"
                  onClick={onReject}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Reject Result
                </button>
              )}

              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
              )}

              <button
                type="button"
                onClick={
                  onPrint || (() => window.print())
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Approval Information */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Approval Information
          </h2>
        </div>

        <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            label="Approval ID"
            value={approval.id}
          />
          <InfoItem
            label="Approval Status"
            value={approval.status}
          />
          <InfoItem
            label="Submitted At"
            value={formatDate(approval.submittedAt)}
          />
          <InfoItem
            label="Approved At"
            value={formatDate(approval.approvedAt)}
          />
          <InfoItem
            label="Submitted By"
            value={approval.submittedBy}
          />
          <InfoItem
            label="Approved By"
            value={approval.approvedBy}
          />
        </dl>
      </section>

      {/* Patient Information */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Patient Information
          </h2>
        </div>

        <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            label="Patient"
            value={
              approval.patientId ? (
                <Link
                  href={`/patients/${approval.patientId}`}
                  className="hover:underline"
                >
                  {approval.patientName ||
                    `Patient #${approval.patientId}`}
                </Link>
              ) : (
                approval.patientName
              )
            }
          />

          <InfoItem
            label="Patient ID"
            value={approval.patientId}
          />

          <InfoItem
            label="Test"
            value={approval.testName}
          />

          <InfoItem
            label="Test Code"
            value={approval.testCode}
          />
        </dl>
      </section>

      {/* Order Information */}
      {orderInfo && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Order Information
            </h2>
          </div>

          <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              label="Order ID"
              value={orderInfo.orderId}
            />
            <InfoItem
              label="Accession Number"
              value={orderInfo.accessionNumber}
            />
            <InfoItem
              label="Order Date"
              value={formatDate(orderInfo.orderDate)}
            />
            <InfoItem
              label="Priority"
              value={orderInfo.priority}
            />
            <InfoItem
              label="Referring Doctor"
              value={orderInfo.referringDoctor}
            />
          </dl>
        </section>
      )}

      {/* Sample Information */}
      {sampleInfo && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Sample Information
            </h2>
          </div>

          <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              label="Sample ID"
              value={sampleInfo.sampleId}
            />
            <InfoItem
              label="Sample Type"
              value={sampleInfo.sampleType}
            />
            <InfoItem
              label="Collection Date"
              value={formatDate(sampleInfo.collectionDate)}
            />
            <InfoItem
              label="Received Date"
              value={formatDate(sampleInfo.receivedDate)}
            />
            <InfoItem
              label="Sample Status"
              value={sampleInfo.sampleStatus}
            />
          </dl>
        </section>
      )}

      {/* Test Information */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Test Information
          </h2>
        </div>

        <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            label="Test Name"
            value={approval.testName}
          />
          <InfoItem
            label="Test Code"
            value={approval.testCode}
          />
        </dl>
      </section>

      {/* Result Information */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Result Information
          </h2>
        </div>

        {resultParameters && resultParameters.length > 0 ? (
          <div className="p-5">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Parameter
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Result
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Unit
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Reference Range
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Flag
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resultParameters.map((param, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {param.parameterName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {param.result}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {param.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {param.referenceRange}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        param.flag === 'CRITICAL' ? 'bg-red-50 text-red-700' :
                        param.flag === 'HIGH' ? 'bg-orange-50 text-orange-700' :
                        param.flag === 'LOW' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-green-50 text-green-700'
                      }`}>
                        {param.flag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <div
              className={`rounded-xl border p-6 ${
                criticalValue
                  ? "border-red-200 bg-red-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Observed Value
              </p>

              <div className="mt-3 flex flex-wrap items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">
                  {resultValue ?? "—"}
                </span>

                {unit && (
                  <span className="text-base font-medium text-gray-500">
                    {unit}
                  </span>
                )}
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Reference Range
                </p>

                <p className="mt-1 text-sm font-medium text-gray-800">
                  {referenceRange || "Not specified"}
                </p>
              </div>

              {criticalValue && (
                <div className="mt-5 rounded-lg border border-red-200 bg-white p-4">
                  <p className="font-semibold text-red-800">
                    Critical Result
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    Review this result carefully before
                    approving it.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Clinical Review */}

      {(interpretation || comments) && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Clinical Review
            </h2>
          </div>

          <div className="space-y-5 p-5">
            {interpretation && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Interpretation
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {interpretation}
                </p>
              </div>
            )}

            {comments && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Comments
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {comments}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Approval History */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Approval History
          </h2>
        </div>

        <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            label="Submitted By"
            value={approval.submittedBy}
          />

          <InfoItem
            label="Submitted At"
            value={formatDate(
              approval.submittedAt
            )}
          />

          <InfoItem
            label="Approved By"
            value={approval.approvedBy}
          />

          <InfoItem
            label="Approved At"
            value={formatDate(
              approval.approvedAt
            )}
          />
        </dl>

        {approval.rejectedBy && (
          <div className="border-t border-gray-100 p-5">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                Rejection Information
              </p>

              <p className="mt-2 text-sm font-medium text-red-800">
                Rejected by:{" "}
                {approval.rejectedBy}
              </p>

              <p className="mt-1 text-sm text-red-700">
                Rejected at:{" "}
                {formatDate(
                  approval.rejectedAt
                )}
              </p>

              {approval.rejectionReason && (
                <p className="mt-2 text-sm text-red-700">
                  Reason:{" "}
                  {approval.rejectionReason}
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* NABL Electronic Doctor Seal & Cryptographic Audit Verification */}
      {isApproved && (
        <section className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/40 via-white to-slate-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-blue-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg shadow">
                ✓
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  NABL ISO 15189:2022 Electronic Doctor Seal
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    Digitally Certified
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Signed electronically in compliance with IT Act 2000 &amp; NABL accreditation norms.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-50 transition"
            >
              {verifying ? "Verifying Hash..." : "🔍 Verify Cryptographic Seal"}
            </button>
          </div>

          <div className="mt-5 grid gap-6 md:grid-cols-2">
            {/* Left: Doctor & Accreditation Credentials */}
            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Signing Pathologist</span>
                <p className="text-base font-bold text-slate-900">{approval.approvedBy || "Certified Pathologist"}</p>
                <p className="text-xs font-medium text-blue-700">MD (Pathology) &bull; Consultant Pathologist</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Medical Council Reg:</span>
                  <span className="font-semibold text-slate-800">
                    {verificationStatus?.signedBy?.registrationNumber || "MCI / State Medical Council"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Signing Timestamp:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(verificationStatus?.signedAt || approval.approvedAt)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Accreditation Norm:</span>
                  <span className="font-semibold text-slate-800">NABL ISO 15189:2022</span>
                </div>
              </div>

              {verificationStatus?.signatureHash && (
                <div className="rounded-lg bg-slate-900 p-2.5 text-white">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    SHA-256 HMAC Fingerprint
                  </p>
                  <p className="font-mono text-xs text-sky-400 break-all">
                    {verificationStatus.signatureHash}
                  </p>
                </div>
              )}
            </div>

            {/* Right: Electronic Seal SVG / Signature Render */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-4">
              {verificationStatus?.sealSvg ? (
                <div
                  className="w-full flex justify-center"
                  dangerouslySetInnerHTML={{ __html: verificationStatus.sealSvg }}
                />
              ) : (
                <div className="text-center p-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-blue-400 text-blue-600 font-bold text-2xl">
                    SEAL
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-800">Doctor Electronic Seal Attached</p>
                  <p className="text-[11px] text-slate-500">
                    Click &quot;Verify Cryptographic Seal&quot; to inspect full vector certificate
                  </p>
                </div>
              )}

              {verificationStatus && (
                <div className={`mt-3 w-full rounded-md p-2 text-center text-xs font-semibold ${
                  verificationStatus.isAuthentic
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {verificationStatus.verificationMessage ||
                    (verificationStatus.isAuthentic
                      ? "✅ Verified: Result snapshot matches cryptographic seal."
                      : "❌ Integrity Alert: Result values differ from signed snapshot.")}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Quality Control & Levey-Jennings Stability Section */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-600 text-white shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Analyzer Precision &amp; Levey-Jennings QC Inspection</span>
                <span className="rounded-md bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-800 border border-cyan-300">
                  NABL ISO 15189
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Inspect 25-run daily quality control drift and Westgard multi-rules before signing.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowQcChart((prev) => !prev)}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm transition flex items-center gap-1.5 shrink-0"
          >
            <span>{showQcChart ? "▲ Hide LJ Chart" : "📈 Inspect Levey-Jennings Chart"}</span>
          </button>
        </div>

        {showQcChart && (
          <div className="p-4 bg-slate-950">
            <LeveyJenningsChart
              approvalId={String(approval.resultId || approval.id)}
              testCode={approval.testName || "K"}
              onClose={() => setShowQcChart(false)}
            />
          </div>
        )}
      </section>

      {/* Review Actions */}
      {canReview && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Review Decision &amp; Pathologist Sign-Off
            </h2>
          </div>

          <div className="p-5 space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start gap-3">
              <span className="text-base">🛡️</span>
              <div>
                <p className="font-bold text-blue-950">NABL ISO 15189:2022 Digital Sign-Off Standard</p>
                <p className="mt-0.5 text-blue-800 leading-relaxed">
                  Clicking <strong>Approve with Digital Signature</strong> certifies the diagnostic parameters under your registered Medical Council registration and binds this test with an immutable SHA-256 HMAC digital seal.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {onApprove && (
                <button
                  type="button"
                  onClick={onApprove}
                  className="flex-1 rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 shadow"
                >
                  ✓ Approve with Digital Signature
                </button>
              )}

              {onReject && (
                <button
                  type="button"
                  onClick={onReject}
                  className="flex-1 rounded-lg border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Reject Result
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Post-Sign-Off Amendment History & Management (NABL ISO 15189:2022) */}
      {isApproved && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm overflow-hidden">
          <div className="border-b border-amber-200 bg-amber-100/50 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileEdit className="h-5 w-5 text-amber-700" />
              <div>
                <h2 className="font-bold text-amber-950 text-sm flex items-center gap-2">
                  <span>Diagnostic Report Amendment &amp; Addenda</span>
                  <span className="rounded-md bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    Clause 7.4.1.3
                  </span>
                </h2>
                <p className="text-xs text-amber-800">
                  Authorized pathologists can record clinical corrections with full version tracking.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAmendmentModal(true)}
              className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-amber-700 transition flex items-center gap-1.5 shrink-0"
            >
              <FileEdit className="h-3.5 w-3.5" />
              <span>Amend Approved Result</span>
            </button>
          </div>

          {/* Previous Amendments Ledger */}
          {amendments.length > 0 ? (
            <div className="p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <History className="h-4 w-4 text-amber-600" />
                Immutable Revision Ledger ({amendments.length} Amendment{amendments.length > 1 ? "s" : ""})
              </h3>
              <div className="space-y-3">
                {amendments.map((amend: any) => (
                  <div
                    key={amend.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-800 border border-amber-300">
                          v{amend.versionNumber}.0
                        </span>
                        <span className="font-bold text-slate-900">
                          {amend.amendmentType?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {formatDate(amend.createdAt)}
                      </span>
                    </div>

                    <div className="text-slate-800">
                      <span className="font-semibold text-slate-500">Reason: </span>
                      {amend.amendmentReason}
                    </div>

                    {amend.fieldChanges && Object.keys(amend.fieldChanges).length > 0 && (
                      <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500">
                          Parameter Modifications:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                          {Object.entries(amend.fieldChanges).map(([field, diff]: [string, any]) => (
                            <div key={field} className="text-[11px] bg-white p-1.5 rounded border border-slate-200">
                              <span className="font-bold text-slate-800">{field}: </span>
                              <span className="line-through text-red-500 mr-1">{diff.previous}</span>
                              <span className="font-bold text-emerald-600">→ {diff.new}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                      <span>Amended By: <strong>{amend.amendedByUser?.fullName || "Pathologist"}</strong></span>
                      <span className="text-emerald-700 font-bold">✓ Report Re-Generated &amp; Cryptographically Re-Signed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-amber-800">
              No amendments filed for this result. This is Original Version 1.0.
            </div>
          )}
        </section>
      )}

      {/* Navigation */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-3 p-5">
          {approval.resultId && (
            <Link
              href={`/results/${approval.resultId}`}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View Result
            </Link>
          )}

          {approval.patientId && (
            <Link
              href={`/patients/${approval.patientId}`}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View Patient
            </Link>
          )}

          <Link
            href="/approvals"
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            All Approvals
          </Link>
        </div>
      </section>

      {/* Result Amendment Modal */}
      {showAmendmentModal && (
        <ResultAmendmentModal
          isOpen={showAmendmentModal}
          onClose={() => setShowAmendmentModal(false)}
          resultId={String(approval.resultId || approval.id)}
          orderNumber={orderInfo?.accessionNumber || approval.orderNumber || "ORD-000"}
          patientName={approval.patientName || "Patient"}
          testName={approval.testName || "Biochemistry Test"}
          currentValues={(resultParameters && resultParameters.length > 0)
            ? resultParameters.map((p, idx) => ({
                parameterId: (p as any).id || (p as any).parameterId || `param-${idx}`,
                parameterName: p.parameterName,
                value: p.result,
                unit: p.unit,
                flag: p.flag,
              }))
            : [
                {
                  parameterId: "param-1",
                  parameterName: approval.testName || "Analyte",
                  value: String(resultValue || "0"),
                  unit: unit,
                  flag: criticalValue ? "CRITICAL" : "NORMAL",
                },
              ]
          }
          onSuccess={(nextVer) => {
            fetchAmendments();
            if (handleVerify) handleVerify();
            alert(`Diagnostic report successfully amended to Version ${nextVer}.0 and re-signed with Doctor Seal.`);
          }}
        />
      )}
    </div>
  );
}