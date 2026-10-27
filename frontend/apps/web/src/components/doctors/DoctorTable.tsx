"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Award,
  Phone,
  Mail,
  Building,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  FileSignature,
  DollarSign,
  TrendingUp,
  FileText,
  PlusCircle,
  Crown,
  Calendar,
  Bike,
  FileBadge,
  BarChart3,
  FileSpreadsheet,
} from "lucide-react";
import { showSuccess } from "@/lib/notifications";

export interface Doctor {
  id: string | number;
  doctorId?: string;
  doctorCode?: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  specialization?: string;
  qualification?: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  registrationNumber?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  department?: string;
  designation?: string;
  experience?: number;
  consultationFee?: number;
  availableDays?: string;
  availableTime?: string;
  photoUrl?: string;
  signatureUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  address?: any;
  city?: any;
  state?: any;
  postalCode?: any;
  clinicName?: string;
  clinicAddress?: string;
  commissionRate?: number | string;
  doctorType?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  _count?: {
    orders?: number;
    patients?: number;
  };
}

interface DoctorTableProps {
  doctors: Doctor[];
  loading?: boolean;
  onDelete?: (doctor: Doctor) => void;
  onQuickView?: (doctor: Doctor) => void;
  onPayout?: (doctor: Doctor) => void;
  onEdit?: (doctor: Doctor) => void;
  onRequisitionSlip?: (doctor: Doctor) => void;
  onWhatsAppDoctor?: (doctor: Doctor) => void;
  onEmailDoctor?: (doctor: Doctor) => void;
  onSamplePickup?: (doctor: Doctor) => void;
  onIdBadge?: (doctor: Doctor) => void;
  onTariffSheet?: (doctor: Doctor) => void;
  onAnalytics?: (doctor: Doctor) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canPayout?: boolean;
}

function getDoctorName(doctor: Doctor) {
  if (doctor.fullName) return doctor.fullName;
  if (doctor.name) return doctor.name;
  return (
    [doctor.firstName, doctor.middleName, doctor.lastName].filter(Boolean).join(" ") ||
    "Doctor"
  );
}

function getInitials(doctor: Doctor) {
  const name = getDoctorName(doctor).replace(/^Dr\.\s*/i, "");
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "D";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getDoctorTier(referralCount: number) {
  if (referralCount >= 50) return { label: "Platinum", bg: "bg-sky-50 text-sky-700 border-sky-200" };
  if (referralCount >= 20) return { label: "Gold", bg: "bg-amber-50 text-amber-700 border-amber-200" };
  if (referralCount >= 5) return { label: "Silver", bg: "bg-slate-100 text-slate-700 border-slate-300" };
  return { label: "Associate", bg: "bg-slate-50 text-slate-600 border-slate-200" };
}

export default function DoctorTable({
  doctors,
  loading = false,
  onDelete,
  onQuickView,
  onPayout,
  onEdit,
  onRequisitionSlip,
  onWhatsAppDoctor,
  onEmailDoctor,
  onSamplePickup,
  onIdBadge,
  onTariffSheet,
  onAnalytics,
  canEdit = true,
  canDelete = true,
  canPayout = true,
}: DoctorTableProps) {
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  const toggleExpand = (id: string | number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleWhatsApp = (e: React.MouseEvent, doctor: Doctor) => {
    e.stopPropagation();
    const rawPhone = doctor.whatsappNumber || doctor.phone || "";
    const cleanPhone = rawPhone.replace(/\D/g, "");
    if (!cleanPhone) {
      alert("Doctor phone number not available for WhatsApp");
      return;
    }
    const docName = getDoctorName(doctor);
    const message = encodeURIComponent(
      `Respected ${docName},\n\nGreetings from LabCore Enterprise Diagnostic Center.\nWe appreciate your valuable clinical referrals. If you need any patient investigation reports or special diagnostic panels, please feel free to message our desk.\n\nThank you!`
    );
    window.open(`https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`}?text=${message}`, "_blank");
  };

  const handleEmail = (e: React.MouseEvent, doctor: Doctor) => {
    e.stopPropagation();
    const docEmail = doctor.email || "";
    if (!docEmail) {
      alert("Doctor email address not available");
      return;
    }
    const docName = getDoctorName(doctor);
    const subject = encodeURIComponent(`LabCore Enterprise Diagnostics - Requisition Slip & Referral Summary - Dr. ${docName}`);
    const body = encodeURIComponent(
      `Dear Dr. ${docName},\n\nGreetings from LabCore Enterprise Diagnostic Center.\nWe appreciate your valuable clinical referrals.\n\nPlease find our contact and referral details.\n\nThank you!`
    );
    window.open(`mailto:${docEmail}?subject=${subject}&body=${body}`, "_blank");
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-3"></div>
        <p className="text-slate-500 text-sm font-medium">Loading medical practitioner directory...</p>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden p-12 text-center">
        <User className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No Doctors Found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No medical practitioners match your filter criteria or search query.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-12 text-center">#</th>
              <th className="py-3.5 px-4">Doctor Details</th>
              <th className="py-3.5 px-4">Type & Licensing</th>
              <th className="py-3.5 px-4">Specialization & Clinic</th>
              <th className="py-3.5 px-4">Referrals & Business</th>
              <th className="py-3.5 px-4">Commission Ledger</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {doctors.map((doctor, index) => {
              const docName = getDoctorName(doctor);
              const initials = getInitials(doctor);
              const active = doctor.isActive !== false;
              const isExpanded = expandedId === doctor.id;

              const isPathologist =
                doctor.doctorType === "IN_HOUSE_PATHOLOGIST" ||
                doctor.doctorType === "INTERNAL_PATHOLOGIST" ||
                (doctor.specialization || "").toLowerCase().includes("pathol");

              const isReferring =
                !isPathologist ||
                doctor.doctorType === "REFERRING_DOCTOR";

              const commissionRate = Number(doctor.commissionRate) || (isReferring ? 15 : 0);
              const referralCount = doctor._count?.orders || doctor._count?.patients || 0;
              const revenueContribution = (doctor as any).totalRevenue ?? 0;
              const pendingPayout = (doctor as any).pendingPayout ?? Math.round(revenueContribution * (commissionRate / 100));
              const tier = getDoctorTier(referralCount);

              return (
                <React.Fragment key={doctor.id}>
                  <tr
                    onClick={() => onQuickView && onQuickView(doctor)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* 1. Index */}
                    <td className="py-4 px-4 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>

                    {/* 2. Doctor Name, Qualifications, Code & Tier */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 font-bold text-sm shadow-xs flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm leading-tight group-hover:text-sky-700 transition-colors">
                              {docName}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${tier.bg}`}>
                              {tier.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[11px] text-slate-500 font-semibold">
                              {doctor.doctorCode || `DOC-${doctor.id}`}
                            </span>
                            {doctor.qualification && (
                              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                                {doctor.qualification}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 3. Type & Credentials (NMC/MCI) */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        {isPathologist ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                            <Award className="w-3 h-3 text-teal-600" />
                            In-House Pathologist
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <User className="w-3 h-3 text-blue-600" />
                            Referring Doctor
                          </span>
                        )}

                        <div className="text-[11px] font-mono text-slate-600 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span>Reg: {doctor.registrationNumber || doctor.licenseNumber || "NMC Verified"}</span>
                        </div>
                      </div>
                    </td>

                    {/* 4. Specialization & Clinic */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800">
                          {doctor.specialization || "General Medicine"}
                        </span>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate max-w-[170px]">
                          <Building className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{doctor.clinicName || "Clinic Affiliated"}</span>
                        </div>
                        {(doctor.consultationFee || doctor.availableDays) && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-medium">
                            <span className="text-slate-500 font-bold">
                              {doctor.consultationFee ? `₹${doctor.consultationFee}` : ""}
                            </span>
                            {doctor.consultationFee && doctor.availableDays && <span className="mx-0.5">•</span>}
                            <span>{doctor.availableDays || ""}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 5. Referrals & Business Contribution */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                          <span>{referralCount} Patients</span>
                        </div>
                        <p className="text-[11px] text-emerald-700 font-bold">
                          ₹{revenueContribution.toLocaleString()} Volume
                        </p>
                      </div>
                    </td>

                    {/* 6. Commission Ledger */}
                    <td className="py-4 px-4">
                      {isReferring ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">
                              ₹{pendingPayout.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                              {commissionRate}%
                            </span>
                          </div>
                          {canPayout && onPayout && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPayout(doctor);
                              }}
                              className="text-[10px] font-bold text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-0.5"
                            >
                              <CreditCard className="w-3 h-3" />
                              Settle Payout
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-0.5 text-[11px]">
                          <span className="text-slate-500 block">Report Sign-off</span>
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <FileSignature className="w-3 h-3" />
                            Digital Stamp Active
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 7. Status */}
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          active
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            active ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* 8. Advanced Action Buttons */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        
                        {/* 1-Click New Order */}
                        <Link
                          href={`/orders/new?referringDoctorId=${doctor.id}&doctorName=${encodeURIComponent(docName)}`}
                          className="p-1.5 rounded-lg text-sky-700 hover:bg-sky-50 border border-sky-200 transition-colors"
                          title="Register New Patient Order for this Doctor"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </Link>

                        {/* Requisition Slip / Rx Pad */}
                        {onRequisitionSlip && (
                          <button
                            type="button"
                            onClick={() => onRequisitionSlip(doctor)}
                            className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 border border-teal-200 transition-colors"
                            title="Generate & Print Lab Requisition Slip / Referral Pad"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}

                        {/* 1-Click WhatsApp */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onWhatsAppDoctor) {
                              onWhatsAppDoctor(doctor);
                            } else {
                              handleWhatsApp(e, doctor);
                            }
                          }}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                          title="WhatsApp Doctor (Dispatch Requisition Slip & Referral Summary)"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        {/* 1-Click Email */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEmailDoctor) {
                              onEmailDoctor(doctor);
                            } else {
                              handleEmail(e, doctor);
                            }
                          }}
                          className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 border border-sky-200 transition-colors"
                          title="Email Doctor (Dispatch Requisition Slip & Clinical Dossier)"
                        >
                          <Mail className="w-4 h-4" />
                        </button>

                        {/* 1-Click Phlebotomy Sample Pickup Dispatch */}
                        {onSamplePickup && (
                          <button
                            type="button"
                            onClick={() => onSamplePickup(doctor)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                            title="Schedule Phlebotomy Specimen Pickup (Rider Dispatch)"
                          >
                            <Bike className="w-4 h-4" />
                          </button>
                        )}

                        {/* Doctor ID & Liaison Privilege Card */}
                        {onIdBadge && (
                          <button
                            type="button"
                            onClick={() => onIdBadge(doctor)}
                            className="p-1.5 rounded-lg text-sky-700 hover:bg-sky-50 border border-sky-200 transition-colors"
                            title="Doctor Privilege ID Badge & Chamber Certificate"
                          >
                            <FileBadge className="w-4 h-4" />
                          </button>
                        )}

                        {/* Doctor Rate Master & Tariff Book */}
                        {onTariffSheet && (
                          <button
                            type="button"
                            onClick={() => onTariffSheet(doctor)}
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 border border-amber-200 transition-colors"
                            title="Diagnostic Rate Master & B2B Tariff Sheet"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>
                        )}

                        {/* Clinical Analytics & Prescribing Matrix */}
                        {onAnalytics && (
                          <button
                            type="button"
                            onClick={() => onAnalytics(doctor)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors"
                            title="Doctor Clinical Analytics & Panic Value Alerts"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Quick View */}
                        <button
                          type="button"
                          onClick={() => onQuickView && onQuickView(doctor)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                          title="View Full Profile & Analytics"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit && onEdit(doctor)}
                            className="p-1.5 rounded-lg text-sky-700 hover:bg-sky-50 border border-sky-200 transition-colors"
                            title="Edit Doctor Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete */}
                        {canDelete && onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(doctor)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                            title="Delete Doctor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}