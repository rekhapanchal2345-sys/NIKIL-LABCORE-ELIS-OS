"use client";

import React from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import type { Patient } from "../../types";

interface PatientDetailsProps {
  patient: Patient;
  onEdit?: () => void;
  onDelete?: () => void;
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

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getInitials(
  patient: Patient
): string {
  const name = getPatientName(patient);

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
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

export default function PatientDetails({
  patient,
  onEdit,
  onDelete,
}: PatientDetailsProps) {
  const name = getPatientName(patient);
  const active = patient.isActive !== false;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm avoid-break">
        <div className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-700">
                {getInitials(patient)}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">
                    {name}
                  </h1>

                  <span
                    className={
                      active
                        ? "rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
                        : "rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                    }
                  >
                    {active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  Patient ID:{" "}
                  <span className="font-medium text-gray-700">
                    {patient.patientId ||
                      patient.mrn ||
                      patient.id}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 no-print">
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Edit Patient
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>

              <Link
                href={`/orders/new?patientId=${patient.id}`}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                New Order
              </Link>

              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Personal Information */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm avoid-break">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Personal Information
          </h2>
        </div>

        <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            label="First Name"
            value={patient.firstName}
          />

          <InfoItem
            label="Middle Name"
            value={patient.middleName}
          />

          <InfoItem
            label="Last Name"
            value={patient.lastName}
          />

          <InfoItem
            label="Gender"
            value={getGenderLabel(
              patient.gender
            )}
          />

          <InfoItem
            label="Date of Birth"
            value={formatDate(
              patient.dateOfBirth
            )}
          />

          <InfoItem
            label="Blood Group"
            value={patient.bloodGroup}
          />

          <InfoItem
            label="Patient ID"
            value={
              patient.patientId ||
              patient.mrn
            }
          />

          <InfoItem
            label="Registration Date"
            value={formatDate(
              patient.createdAt
            )}
          />
        </dl>
      </section>

      {/* Contact Information */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm avoid-break">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Contact Information
          </h2>
        </div>

        <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            label="Phone"
            value={patient.phone}
          />

          <InfoItem
            label="Email"
            value={patient.email}
          />

          <InfoItem
            label="City"
            value={patient.city}
          />

          <InfoItem
            label="State"
            value={patient.state}
          />

          <InfoItem
            label="Postal Code"
            value={patient.postalCode}
          />

          <div className="sm:col-span-2 lg:col-span-3">
            <InfoItem
              label="Address"
              value={patient.address}
            />
          </div>
        </dl>
      </section>

      {/* Emergency Contact */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm avoid-break">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Emergency Contact
          </h2>
        </div>

        <dl className="grid gap-5 p-5 sm:grid-cols-2">
          <InfoItem
            label="Contact Name"
            value={
              patient.emergencyContactName
            }
          />

          <InfoItem
            label="Contact Phone"
            value={
              patient.emergencyContactPhone
            }
          />
        </dl>
      </section>

      {/* Medical / Referral Information */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm avoid-break">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Medical & Referral Information
          </h2>
        </div>

        <dl className="grid gap-5 p-5 sm:grid-cols-2">
          <InfoItem
            label="Referring Doctor"
            value={
              patient.referringDoctorId
            }
          />

          <InfoItem
            label="Blood Group"
            value={patient.bloodGroup}
          />

          <InfoItem
            label="Patient Status"
            value={
              active
                ? "Active"
                : "Inactive"
            }
          />
        </dl>
      </section>
    </div>
  );
}