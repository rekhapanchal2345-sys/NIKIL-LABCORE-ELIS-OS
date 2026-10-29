"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

export const labelClass = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500";

export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100";

interface Props {
  patientName: string;
  patient: any;
  doctorName?: string;
  verifiedName: boolean;
  verifiedId: boolean;
  onVerifiedName: (value: boolean) => void;
  onVerifiedId: (value: boolean) => void;
}

export default function PhlebotomyPatientCard({
  patientName,
  patient,
  doctorName,
  verifiedName,
  verifiedId,
  onVerifiedName,
  onVerifiedId,
}: Props) {
  return (
    <section aria-label="Patient identification">
      <div className="rounded-lg border border-slate-200 bg-slate-50/60">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-3 text-xs sm:grid-cols-4">
          <div className="col-span-2">
            <p className={labelClass}>Patient</p>
            <p className="text-sm font-semibold text-slate-900">{patientName}</p>
          </div>
          <div>
            <p className={labelClass}>UHID</p>
            <p className="font-mono text-[13px] font-semibold text-slate-800">{patient?.uhid || "—"}</p>
          </div>
          <div>
            <p className={labelClass}>Age / Sex</p>
            <p className="text-[13px] text-slate-800">
              {patient?.age ? `${patient.age} yrs` : "—"} · {patient?.gender || "—"}
            </p>
          </div>
          <div>
            <p className={labelClass}>Phone</p>
            <p className="text-[13px] text-slate-800">{patient?.phone || "—"}</p>
          </div>
          <div className="col-span-2">
            <p className={labelClass}>Referring doctor</p>
            <p className="text-[13px] text-slate-800">{doctorName || "Self / Not specified"}</p>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-700" />
            Positive patient identification (two identifiers)
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={verifiedName}
                onChange={(e) => onVerifiedName(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-500"
              />
              <span>Patient stated full name matches the requisition</span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={verifiedId}
                onChange={(e) => onVerifiedId(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-500"
              />
              <span>UHID / date of birth / wristband matches the requisition</span>
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
