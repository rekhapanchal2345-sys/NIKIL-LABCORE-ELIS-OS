"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  PlusCircle,
  Building,
  Calendar,
  Clock,
  ShieldCheck,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Printer,
  Award,
} from "lucide-react";
import type { Doctor } from "./DoctorTable";
import DoctorRequisitionSlipModal from "./DoctorRequisitionSlipModal";

interface DoctorDetailsProps {
  doctor: Doctor;
  onEdit?: () => void;
  onDelete?: () => void;
}

function getDoctorName(doctor: Doctor) {
  if (doctor.fullName) return doctor.fullName;
  if (doctor.name) return doctor.name;

  return [
    doctor.firstName,
    doctor.middleName,
    doctor.lastName,
  ]
    .filter(Boolean)
    .join(" ") || "Unknown Doctor";
}

function getInitials(doctor: Doctor) {
  const name = getDoctorName(doctor).replace(/^Dr\.\s*/i, "");

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "D";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

function InfoItem({
  label,
  value,
  subvalue,
}: {
  label: string;
  value?: React.ReactNode;
  subvalue?: string;
}) {
  return (
    <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </dt>

      <dd className="mt-1 text-sm font-bold text-slate-900">
        {value || "—"}
      </dd>
      {subvalue && (
        <p className="text-[11px] text-slate-500 font-medium mt-0.5">{subvalue}</p>
      )}
    </div>
  );
}

export default function DoctorDetails({
  doctor,
  onEdit,
  onDelete,
}: DoctorDetailsProps) {
  const [showSlip, setShowSlip] = useState(false);
  const name = getDoctorName(doctor);
  const active = doctor.isActive !== false;

  return (
    <div className="space-y-6">
      {/* Header Profile Card - Light White Professional UI */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 border border-sky-100 text-xl font-black text-sky-800 shadow-xs">
              {getInitials(doctor)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {name}
                </h1>

                <span
                  className={
                    active
                      ? "rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700"
                      : "rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-600"
                  }
                >
                  {active ? "Active Practitioner" : "Inactive"}
                </span>

                {doctor.specialization && (
                  <span className="rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-xs font-bold text-sky-800">
                    {doctor.specialization}
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                <span>
                  Code: <strong className="font-mono text-slate-700">{doctor.doctorCode || doctor.doctorId || `DOC-${doctor.id}`}</strong>
                </span>
                <span>•</span>
                <span>
                  MCI/NMC Reg: <strong className="font-mono text-slate-700">{doctor.registrationNumber || doctor.licenseNumber || "NMC-VERIFIED"}</strong>
                </span>
                {doctor.clinicName && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {doctor.clinicName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/orders/new?referringDoctorId=${doctor.id}&doctorName=${encodeURIComponent(name)}`}
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              New Lab Order
            </Link>

            <button
              type="button"
              onClick={() => setShowSlip(true)}
              className="flex items-center gap-1.5 rounded-xl bg-teal-50 border border-teal-200 px-3.5 py-2 text-xs font-bold text-teal-700 hover:bg-teal-100 transition-all active:scale-95"
            >
              <FileText className="w-4 h-4" />
              Requisition Slip
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Edit Profile
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Professional & Clinical Information */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-3.5 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-700" />
            Clinical Practice & OPD Consultation
          </h2>
          <span className="text-[11px] font-bold text-slate-500">Hospital & Practice Records</span>
        </div>

        <div className="grid gap-3.5 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            label="Specialization"
            value={doctor.specialization || "General Medicine"}
          />

          <InfoItem
            label="Qualification"
            value={doctor.qualification || "MBBS"}
          />

          <InfoItem
            label="Medical License / MCI"
            value={doctor.registrationNumber || doctor.licenseNumber || "NMC Verified"}
            subvalue={doctor.licenseExpiry ? `Valid Till: ${new Date(doctor.licenseExpiry).toLocaleDateString("en-IN")}` : undefined}
          />

          <InfoItem
            label="Consultation Fee"
            value={doctor.consultationFee ? `₹${doctor.consultationFee}` : "Standard OPD"}
            subvalue="Clinic patient fee"
          />

          <InfoItem
            label="OPD Consultation Days"
            value={doctor.availableDays || "Monday - Saturday"}
          />

          <InfoItem
            label="OPD Consultation Time"
            value={doctor.availableTime || "10:00 AM - 02:00 PM"}
          />

          <InfoItem
            label="Clinic / Chamber"
            value={doctor.clinicName || "Private Clinic"}
          />

          <InfoItem
            label="Referral Commission"
            value={doctor.commissionRate ? `${doctor.commissionRate}%` : "15% Standard"}
            subvalue="Diagnostic incentive"
          />
        </div>
      </section>

      {/* Contact & Clinic Location */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-3.5 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-emerald-600" />
            Contact & Chamber Address
          </h2>
        </div>

        <div className="grid gap-3.5 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            label="Primary Phone"
            value={doctor.phone}
          />

          <InfoItem
            label="WhatsApp Number"
            value={doctor.whatsappNumber || doctor.phone}
          />

          <InfoItem
            label="Email Address"
            value={doctor.email}
          />

          <div className="sm:col-span-2 lg:col-span-3">
            <InfoItem
              label="Clinic & Chamber Address"
              value={doctor.clinicAddress || [doctor.address, doctor.city, doctor.state].filter(Boolean).join(", ") || "Ahmedabad, Gujarat"}
            />
          </div>
        </div>
      </section>

      {/* Digital Signature Preview for Pathologists */}
      {doctor.signatureUrl && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-3.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-teal-600" />
              Authorized Pathologist Digital Signature
            </h2>
          </div>

          <div className="p-6">
            <div className="inline-block p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
              <img src={doctor.signatureUrl} alt="Doctor signature" className="h-20 w-auto object-contain" />
              <p className="text-[10px] text-slate-400 mt-2 font-mono text-center">Digitally Approved Stamp</p>
            </div>
          </div>
        </section>
      )}

      {/* Requisition Slip Modal */}
      <DoctorRequisitionSlipModal
        isOpen={showSlip}
        onClose={() => setShowSlip(false)}
        doctor={doctor as any}
      />
    </div>
  );
}