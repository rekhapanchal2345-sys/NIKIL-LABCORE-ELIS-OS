"use client";

import React from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import type { LabReport } from "./ReportTable";

interface ReportDetailsProps {
  report: LabReport;

  description?: string;
  parameters?: Record<string, string | number>;
  summary?: string;

  onDownload?: () => void;
  onPrint?: () => void;
  onDelete?: () => void;
  onRegenerate?: () => void;
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
    value === "completed" ||
    value === "generated" ||
    value === "ready"
  ) {
    return "bg-green-50 text-green-700";
  }

  if (
    value === "failed" ||
    value === "error" ||
    value === "cancelled"
  ) {
    return "bg-red-50 text-red-700";
  }

  if (
    value === "pending" ||
    value === "processing"
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

export default function ReportDetails({
  report,
  description,
  parameters,
  summary,
  onDownload,
  onPrint,
  onDelete,
  onRegenerate,
}: ReportDetailsProps) {
  const status = report.status?.toLowerCase();

  return (
    <div className="space-y-6">
      {/* Header */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm avoid-break">
        <div className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">
                  {report.reportNumber ||
                    `RPT-${report.id}`}
                </h1>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                    report.status
                  )}`}
                >
                  {report.status || "Pending"}
                </span>
              </div>

              <p className="mt-2 text-sm text-gray-500">
                {report.reportName ||
                  "Laboratory Report"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 no-print">
              {onDownload && (
                <button
                  type="button"
                  onClick={onDownload}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Download
                </button>
              )}

              <button
                type="button"
                onClick={
                  onPrint || (() => window.print())
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>

              {onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Regenerate
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Basic Information */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm avoid-break">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Report Information
          </h2>
        </div>

        <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            label="Report Number"
            value={
              report.reportNumber ||
              `RPT-${report.id}`
            }
          />

          <InfoItem
            label="Report Type"
            value={report.reportType || "General"}
          />

          <InfoItem
            label="Generated By"
            value={report.generatedBy}
          />

          <InfoItem
            label="Generated At"
            value={formatDate(report.generatedAt)}
          />

          <InfoItem
            label="File Type"
            value={
              report.fileType?.toUpperCase()
            }
          />

          <InfoItem
            label="Records"
            value={
              typeof report.recordCount === "number"
                ? report.recordCount
                : undefined
            }
          />

          <InfoItem
            label="Status"
            value={
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                  report.status
                )}`}
              >
                {report.status || "Pending"}
              </span>
            }
          />

          <InfoItem
            label="Report ID"
            value={report.id}
          />
        </dl>
      </section>

      {/* Patient */}

      {report.patientId && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm avoid-break">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Patient Information
            </h2>
          </div>

          <div className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Patient
                </p>

                <Link
                  href={`/patients/${report.patientId}`}
                  className="mt-1 block text-lg font-semibold text-gray-900 hover:underline"
                >
                  {report.patientName ||
                    `Patient #${report.patientId}`}
                </Link>

                <p className="mt-1 text-sm text-gray-500">
                  Patient ID: {report.patientId}
                </p>
              </div>

              <Link
                href={`/patients/${report.patientId}`}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                View Patient
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Description */}

      {description && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm avoid-break">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Description
            </h2>
          </div>

          <div className="p-5">
            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {description}
            </p>
          </div>
        </section>
      )}

      {/* Parameters */}

      {parameters &&
        Object.keys(parameters).length > 0 && (
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm avoid-break">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="font-semibold text-gray-900">
                Report Parameters
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Parameter
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Value
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {Object.entries(parameters).map(
                    ([key, value]) => (
                      <tr key={key}>
                        <td className="px-5 py-3 text-sm font-medium text-gray-700">
                          {key}
                        </td>

                        <td className="px-5 py-3 text-sm text-gray-600">
                          {String(value)}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

      {/* Summary */}

      {summary && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm avoid-break">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Report Summary
            </h2>
          </div>

          <div className="p-5">
            <div className="rounded-lg bg-gray-50 p-5">
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {summary}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* File */}

      {report.fileUrl && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm avoid-break">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Generated File
            </h2>
          </div>

          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {report.fileType?.toUpperCase() ||
                  "Report File"}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Generated report document
              </p>
            </div>

            <a
              href={report.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Open File
            </a>
          </div>
        </section>
      )}

      {/* Navigation */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm no-print">
        <div className="flex flex-wrap gap-3 p-5">
          {report.patientId && (
            <Link
              href={`/patients/${report.patientId}`}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View Patient
            </Link>
          )}

          <Link
            href="/reports"
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            All Reports
          </Link>
        </div>
      </section>
    </div>
  );
}