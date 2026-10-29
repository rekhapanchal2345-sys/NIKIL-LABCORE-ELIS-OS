"use client";

import React from "react";
import Link from "next/link";
import type { Patient } from "../../types";
import { HeartPulse, Plus } from "lucide-react";

interface PatientCardProps {
  patient: Patient;
  onDelete?: (patient: Patient) => void;
}

type PatientIdentityMarkProps = {
  firstName: string;
  lastName: string;
  gender?: Patient["gender"];
  size?: "compact" | "card" | "hero";
};

/**
 * Premium gender-specific patient identity mark with professional medical symbols
 */
function PatientIdentityMark({ firstName, lastName, gender, size = "card" }: PatientIdentityMarkProps) {
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "PT";
  const genderUpper = gender?.toUpperCase() || "";
  const isFemale = genderUpper === "FEMALE";
  const isMale = genderUpper === "MALE";
  const dimensions = size === "hero" ? "h-14 w-14" : size === "card" ? "h-12 w-12" : "h-11 w-11";
  const monogram = size === "hero" ? "text-lg" : size === "card" ? "text-base" : "text-sm";

  // Gender-specific gradient colors
  const gradientColors = isFemale 
    ? "from-pink-600 via-rose-500 to-pink-400 shadow-[0_8px_24px_rgba(219,39,119,0.35)]"
    : isMale
      ? "from-blue-600 via-indigo-500 to-cyan-400 shadow-[0_8px_24px_rgba(37,99,235,0.35)]"
      : "from-indigo-700 via-blue-600 to-cyan-500 shadow-[0_8px_24px_rgba(37,99,235,0.35)]";

  // Gender-specific accent colors
  const accentColor = isFemale ? "text-pink-300" : isMale ? "text-blue-300" : "text-cyan-300";
  const accentBg = isFemale ? "bg-pink-300" : isMale ? "bg-blue-300" : "bg-cyan-300";

  return (
    <div
      className={`relative ${dimensions} shrink-0 overflow-visible rounded-2xl bg-gradient-to-br ${gradientColors} p-[1.5px] ring-1 ring-white/40 backdrop-blur-sm transition-all duration-300 hover:scale-105`}
    >
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[14px] bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/15 via-transparent to-indigo-400/15 animate-pulse" />
        <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-r from-cyan-300/30 via-white/25 to-indigo-300/25 blur-[1px]" />
        
        {/* LabCore Logo Badge */}
        <div className="absolute left-1.5 top-1.5 flex items-center gap-0.5">
          <div className={`h-1.5 w-1.5 rounded-full ${accentBg} shadow-[0_0_8px_rgba(255,255,255,0.8)]`} />
          <span className={`text-[6px] font-black tracking-[0.2em] ${accentColor}/90 drop-shadow-sm`}>LC</span>
        </div>
        
        {/* Gender-Specific Medical Symbol */}
        <div className="absolute right-1.5 top-1.5 flex items-center justify-center">
          <div className="relative h-2.5 w-2.5">
            <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              {isFemale ? (
                <svg viewBox="0 0 24 24" className="h-2 w-2 text-white/80" fill="currentColor">
                  <circle cx="12" cy="5" r="3" />
                  <path d="M12 8v11M9 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : isMale ? (
                <svg viewBox="0 0 24 24" className="h-2 w-2 text-white/80" fill="currentColor">
                  <circle cx="10" cy="14" r="3" />
                  <path d="M12.5 12.5L18 7M15 7h3v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <Plus className="h-1.5 w-1.5 text-white/60" />
              )}
            </div>
          </div>
        </div>
        
        {/* Heart Rate Pulse */}
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5">
          <div className="flex items-end gap-[1px] h-2">
            <div className={`w-[1px] h-1 ${accentColor}/60`} />
            <div className={`w-[1px] h-2 ${accentColor}/80`} />
            <div className={`w-[1px] h-1 ${accentColor}/60`} />
            <div className={`w-[1px] h-1.5 ${accentColor}/70`} />
            <div className={`w-[1px] h-1 ${accentColor}/50`} />
          </div>
        </div>
        
        <div className="relative flex flex-col items-center">
          <span className={`font-black tracking-tight text-white drop-shadow-lg ${monogram}`}>
            {initials}
          </span>
          {size !== "compact" && (
            <span className="text-[5px] font-medium tracking-widest text-white/60 uppercase mt-0.5">
              {isFemale ? "Female" : isMale ? "Male" : "Patient"}
            </span>
          )}
        </div>
      </div>
      
      {/* Corner Accents */}
      <div className="absolute -top-0.5 -left-0.5 h-2 w-2 border-t-2 border-l-2 border-white/60 rounded-tl-sm" />
      <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 border-b-2 border-r-2 border-white/60 rounded-br-sm" />
    </div>
  );
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

function getGender(
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

export default function PatientCard({
  patient,
  onDelete,
}: PatientCardProps) {
  const name =
    getPatientName(patient);

  const active =
    patient.isActive !== false;

  return (
    <article className="rounded-xl border border-purple-500/30 bg-black/40 backdrop-blur-xl p-5 shadow-lg shadow-purple-500/20 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-cyan-500/30">
      {/* Header */}

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <PatientIdentityMark
            firstName={patient.firstName}
            lastName={patient.lastName}
            gender={patient.gender}
            size="card"
          />

          <div className="min-w-0">
            <Link
              href={`/patients/${patient.id}`}
              className="block truncate text-base font-semibold text-purple-200 hover:text-cyan-400 transition-colors"
            >
              {name}
            </Link>

            <p className="mt-0.5 text-xs text-purple-300/70">
              {patient.patientId ||
                patient.mrn ||
                `Patient #${patient.id}`}
            </p>
          </div>
        </div>

        <span
          className={
            active
              ? "rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400 border border-green-500/30"
              : "rounded-full bg-purple-500/20 px-2.5 py-1 text-xs font-medium text-purple-300/60 border border-purple-500/30"
          }
        >
          {active
            ? "Active"
            : "Inactive"}
        </span>
      </div>

      {/* Information */}

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-purple-400/60">
            Gender
          </p>

          <p className="mt-1 text-sm font-medium text-purple-200">
            {getGender(
              patient.gender
            )}
          </p>
        </div>

        <div>
          <p className="text-xs text-purple-400/60">
            Date of Birth
          </p>

          <p className="mt-1 text-sm font-medium text-purple-200">
            {formatDate(
              patient.dateOfBirth
            )}
          </p>
        </div>

        <div>
          <p className="text-xs text-purple-400/60">
            Phone
          </p>

          <p className="mt-1 truncate text-sm font-medium text-purple-200">
            {patient.phone || "—"}
          </p>
        </div>

        <div>
          <p className="text-xs text-purple-400/60">
            Blood Group
          </p>

          <p className="mt-1 text-sm font-medium text-purple-200">
            {patient.bloodGroup ||
              "—"}
          </p>
        </div>
      </div>

      {/* Email */}

      {patient.email && (
        <div className="mt-4 rounded-lg bg-purple-500/10 px-3 py-2 border border-purple-500/20">
          <p className="text-xs text-purple-400/60">
            Email
          </p>

          <p className="mt-0.5 truncate text-sm text-purple-300/80">
            {patient.email}
          </p>
        </div>
      )}

      {/* Address */}

      {patient.address && (
        <div className="mt-4">
          <p className="text-xs text-purple-400/60">
            Address
          </p>

          <p className="mt-1 line-clamp-2 text-sm text-purple-300/70">
            {patient.address}
            {patient.city
              ? `, ${patient.city}`
              : ""}
            {patient.state
              ? `, ${patient.state}`
              : ""}
          </p>
        </div>
      )}

      {/* Actions */}

      <div className="mt-5 flex items-center justify-end gap-2 border-t border-purple-500/20 pt-4">
        <Link
          href={`/patients/${patient.id}`}
          className="rounded-lg border border-purple-500/30 px-3 py-2 text-xs font-medium text-purple-300 transition hover:bg-purple-500/20 hover:border-cyan-500/50 hover:text-cyan-400"
        >
          View
        </Link>

        <Link
          href={`/patients/${patient.id}?edit=true`}
          className="rounded-lg border border-purple-500/30 px-3 py-2 text-xs font-medium text-purple-300 transition hover:bg-purple-500/20 hover:border-cyan-500/50 hover:text-cyan-400"
        >
          Edit
        </Link>

        {onDelete && (
          <button
            type="button"
            onClick={() =>
              onDelete(patient)
            }
            className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}