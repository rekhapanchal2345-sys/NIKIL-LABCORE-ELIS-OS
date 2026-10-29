"use client";

import React from "react";
import Link from "next/link";
import type { Patient } from "../../types";

interface PatientTableProps {
  patients: Patient[];
  loading?: boolean;
  onDelete?: (patient: Patient) => void;
}

function getPatientName(
  patient: Patient
): string {
  if (patient.name) {
    return patient.name;
  }

  return [
    patient.firstName,
    patient.middleName,
    patient.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function getGenderLabel(
  gender: Patient["gender"]
): string {
  switch (gender) {
    case "male":
      return "Male";
    case "female":
      return "Female";
    case "other":
      return "Other";
    default:
      return "Unknown";
  }
}

function getInitials(
  patient: Patient
): string {
  const name =
    getPatientName(patient);

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "P";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

function formatDate(
  date?: string | null
): string {
  if (!date) {
    return "—";
  }

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return date;
  }

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <tr key={index}>
          <td className="px-4 py-4">
            <div className="h-4 w-4 animate-pulse rounded bg-purple-500/20" />
          </td>

          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-purple-500/20" />

              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-purple-500/20" />
                <div className="h-3 w-20 animate-pulse rounded bg-purple-500/10" />
              </div>
            </div>
          </td>

          <td className="px-4 py-4">
            <div className="h-4 w-24 animate-pulse rounded bg-purple-500/20" />
          </td>

          <td className="px-4 py-4">
            <div className="h-4 w-20 animate-pulse rounded bg-purple-500/20" />
          </td>

          <td className="px-4 py-4">
            <div className="h-4 w-24 animate-pulse rounded bg-purple-500/20" />
          </td>

          <td className="px-4 py-4">
            <div className="h-6 w-16 animate-pulse rounded-full bg-purple-500/20" />
          </td>

          <td className="px-4 py-4">
            <div className="h-4 w-16 animate-pulse rounded bg-purple-500/20" />
          </td>
        </tr>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <tr>
      <td
        colSpan={7}
        className="px-6 py-16 text-center"
      >
        <div className="mx-auto flex max-w-sm flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20 text-xl border border-purple-500/30">
            👤
          </div>

          <h3 className="text-sm font-semibold text-purple-200">
            No patients found
          </h3>

          <p className="mt-1 text-sm text-purple-300/70">
            Registered patients will
            appear here.
          </p>
        </div>
      </td>
    </tr>
  );
}

export default function PatientTable({
  patients,
  loading = false,
  onDelete,
}: PatientTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-purple-500/30 bg-black/40 backdrop-blur-xl shadow-lg shadow-purple-500/20">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-purple-500/20">
          <thead className="bg-purple-500/10">
            <tr>
              <th className="w-12 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-purple-300/80">
                #
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-purple-300/80">
                Patient
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-purple-300/80">
                Patient ID
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-purple-300/80">
                Gender
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-purple-300/80">
                Phone
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-purple-300/80">
                Status
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-purple-300/80">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-purple-500/20 bg-black/40">
            {loading ? (
              <LoadingRows />
            ) : patients.length === 0 ? (
              <EmptyState />
            ) : (
              patients.map(
                (
                  patient,
                  index
                ) => (
                  <tr
                    key={patient.id}
                    className="transition hover:bg-purple-500/10"
                  >
                    {/* Number */}

                    <td className="whitespace-nowrap px-4 py-4 text-sm text-purple-300/60">
                      {index + 1}
                    </td>

                    {/* Patient */}

                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 text-xs font-semibold text-white shadow-[0_0_10px_rgba(168,85,247,0.3)] border border-purple-400/30">
                          {getInitials(
                            patient
                          )}
                        </div>

                        <div>
                          <Link
                            href={`/patients/${patient.id}`}
                            className="text-sm font-semibold text-purple-200 hover:text-cyan-400 transition-colors"
                          >
                            {getPatientName(
                              patient
                            )}
                          </Link>

                          {patient.email && (
                            <p className="mt-0.5 text-xs text-purple-300/70">
                              {
                                patient.email
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Patient ID */}

                    <td className="whitespace-nowrap px-4 py-4 text-sm text-purple-300/80">
                      {patient.patientId ||
                        patient.mrn ||
                        "—"}
                    </td>

                    {/* Gender */}

                    <td className="whitespace-nowrap px-4 py-4 text-sm text-purple-300/80">
                      {getGenderLabel(
                        patient.gender
                      )}
                    </td>

                    {/* Phone */}

                    <td className="whitespace-nowrap px-4 py-4 text-sm text-purple-300/80">
                      {patient.phone ||
                        "—"}
                    </td>

                    {/* Status */}

                    <td className="whitespace-nowrap px-4 py-4">
                      {patient.isActive ===
                        false ? (
                        <span className="inline-flex rounded-full bg-purple-500/20 px-2.5 py-1 text-xs font-medium text-purple-300/60 border border-purple-500/30">
                          Inactive
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400 border border-green-500/30">
                          Active
                        </span>
                      )}
                    </td>

                    {/* Actions */}

                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/patients/${patient.id}`}
                          className="rounded-md border border-purple-500/30 px-3 py-1.5 text-xs font-medium text-purple-300 transition hover:bg-purple-500/20 hover:border-cyan-500/50 hover:text-cyan-400"
                        >
                          View
                        </Link>

                        <Link
                          href={`/patients/${patient.id}?edit=true`}
                          className="rounded-md border border-purple-500/30 px-3 py-1.5 text-xs font-medium text-purple-300 transition hover:bg-purple-500/20 hover:border-cyan-500/50 hover:text-cyan-400"
                        >
                          Edit
                        </Link>

                        {onDelete && (
                          <button
                            type="button"
                            onClick={() =>
                              onDelete(
                                patient
                              )
                            }
                            className="rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}