"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Award,
  DollarSign,
  FileText,
  ShieldCheck,
  MessageCircle,
  CreditCard,
  ExternalLink,
  CheckCircle,
  FileSignature,
  Activity,
  Calendar,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  PlusCircle,
  Printer,
  Crown,
  Bike,
  FileBadge,
  BarChart3,
  FileSpreadsheet,
} from "lucide-react";
import { doctorApi } from "@/lib/api";
import { showSuccess, showError } from "@/lib/notifications";

export interface DoctorProfileData {
  id: string | number;
  doctorCode?: string;
  fullName?: string;
  name?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  specialization?: string;
  qualification?: string;
  registrationNumber?: string;
  licenseNumber?: string;
  phone?: string;
  email?: string;
  clinicName?: string;
  clinicAddress?: string;
  consultationFee?: number | string;
  availableDays?: string;
  availableTime?: string;
  licenseExpiry?: string;
  address?: any;
  city?: any;
  state?: any;
  commissionRate?: number | string;
  doctorType?: "REFERRING_DOCTOR" | "IN_HOUSE_PATHOLOGIST" | "CONSULTING_SPECIALIST" | string;
  whatsappNumber?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankAccountHolderName?: string;
  signatureUrl?: string;
  photoUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  _count?: {
    orders?: number;
    patients?: number;
  };
}

interface DoctorQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorProfileData | null;
  onOpenPayoutModal?: (doctor: DoctorProfileData) => void;
  onEditDoctor?: (doctor: DoctorProfileData) => void;
  onOpenRequisitionSlip?: (doctor: DoctorProfileData) => void;
  onOpenWhatsApp?: (doctor: DoctorProfileData) => void;
  onOpenEmail?: (doctor: DoctorProfileData) => void;
  onOpenSamplePickup?: (doctor: DoctorProfileData) => void;
  onOpenIdBadge?: (doctor: DoctorProfileData) => void;
  onOpenTariffSheet?: (doctor: DoctorProfileData) => void;
  onOpenAnalytics?: (doctor: DoctorProfileData) => void;
}

export default function DoctorQuickViewModal({
  isOpen,
  onClose,
  doctor,
  onOpenPayoutModal,
  onEditDoctor,
  onOpenRequisitionSlip,
  onOpenWhatsApp,
  onOpenEmail,
  onOpenSamplePickup,
  onOpenIdBadge,
  onOpenTariffSheet,
  onOpenAnalytics,
}: DoctorQuickViewModalProps) {
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [isEstimatedStats, setIsEstimatedStats] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen && doctor?.id) {
      fetchDoctorStats(String(doctor.id));
    } else {
      setStats(null);
      setIsEstimatedStats(false);
      setCopiedLink(false);
    }
  }, [isOpen, doctor?.id]);

  const fetchDoctorStats = async (docId: string) => {
    try {
      setLoadingStats(true);
      setIsEstimatedStats(false);
      const res = await doctorApi.getStatistics(docId);
      if (res && res.data) {
        setStats(res.data.statistics || res.data);
      } else {
        setIsEstimatedStats(true);
      }
    } catch (err) {
      console.log("Could not load dynamic doctor stats, using fallback stats");
      setIsEstimatedStats(true);
    } finally {
      setLoadingStats(false);
    }
  };

  if (!isOpen || !doctor) return null;

  const doctorName =
    doctor.fullName ||
    doctor.name ||
    [doctor.firstName, doctor.middleName, doctor.lastName].filter(Boolean).join(" ") ||
    "Doctor";

  const isPathologist =
    doctor.doctorType === "IN_HOUSE_PATHOLOGIST" ||
    doctor.doctorType === "INTERNAL_PATHOLOGIST" ||
    (doctor.specialization || "").toLowerCase().includes("pathol");

  const isReferring =
    !isPathologist ||
    doctor.doctorType === "REFERRING_DOCTOR";

  const commissionRateNum = Number(doctor.commissionRate) || (isReferring ? 15 : 0);
  
  // Real or calculated metrics
  const referralCount =
    stats?.totalPatients ??
    stats?.totalOrders ??
    doctor._count?.patients ??
    doctor._count?.orders ??
    0;

  const totalRevenue =
    stats?.totalRevenue ??
    (doctor as any).totalRevenue ??
    0;

  const pendingCommission = (doctor as any).pendingPayout ?? Math.round(totalRevenue * (commissionRateNum / 100));

  // Doctor Tier Calculation for real-world clinic/hospital liaison programs
  const getDoctorTier = () => {
    if (referralCount >= 50) return { name: "Platinum Partner", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    if (referralCount >= 20) return { name: "Gold Partner", color: "bg-amber-50 text-amber-700 border-amber-200" };
    if (referralCount >= 5) return { name: "Silver Partner", color: "bg-slate-100 text-slate-700 border-slate-300" };
    return { name: "Standard Associate", color: "bg-slate-50 text-slate-600 border-slate-200" };
  };

  const doctorTier = getDoctorTier();

  const deliveryPrefs = [
    (doctor as any).reportDeliveryWhatsApp ? "WhatsApp" : null,
    (doctor as any).reportDeliveryEmail ? "Email" : null,
    (doctor as any).reportDeliveryHardCopy ? "Hard Copy" : null,
    (doctor as any).reportDeliveryPortal ? "Portal" : null,
  ].filter(Boolean);

  const deliveryText = deliveryPrefs.length > 0 ? deliveryPrefs.join(" + ") : "WhatsApp & Portal";

  const portalLink = typeof window !== "undefined"
    ? `${window.location.origin}/portal/doctor/${doctor.doctorCode || doctor.id}`
    : `/portal/doctor/${doctor.doctorCode || doctor.id}`;

  const handleCopyPortalLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(portalLink);
      setCopiedLink(true);
      showSuccess("Doctor direct reporting portal link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleWhatsApp = () => {
    const rawPhone = doctor.whatsappNumber || doctor.phone || "";
    const cleanPhone = rawPhone.replace(/\D/g, "");
    if (!cleanPhone) {
      showError("Doctor phone number not available");
      return;
    }

    const message = encodeURIComponent(
      `Respected ${doctorName},\n\nGreetings from LabCore Diagnostic & Reference Center.\n\nHere is your Monthly Referral & Clinical Activity Summary:\n• Total Referred Patients: ${referralCount}\n• Gross Referral Volume: ₹${totalRevenue.toLocaleString()}\n• Commission Rate: ${commissionRateNum}%\n• Pending Settlement: ₹${pendingCommission.toLocaleString()}\n\n🔗 View Your Patient Reports Live Online:\n${portalLink}\n\nOur laboratory team appreciates your medical trust.`
    );

    const waUrl = `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`}?text=${message}`;
    window.open(waUrl, "_blank");
    showSuccess("Opening WhatsApp with Doctor Referral Summary");
  };

  const handleEmail = () => {
    const docEmail = doctor.email || "";
    if (!docEmail) {
      showError("Doctor email address not available");
      return;
    }

    const subject = encodeURIComponent(`Monthly Referral & Clinical Activity Summary - Dr. ${doctorName}`);
    const body = encodeURIComponent(
      `Respected ${doctorName},\n\nGreetings from LabCore Diagnostic & Reference Center.\n\nHere is your Monthly Referral & Clinical Activity Summary:\n• Total Referred Patients: ${referralCount}\n• Gross Referral Volume: ₹${totalRevenue.toLocaleString()}\n• Commission Rate: ${commissionRateNum}%\n• Pending Settlement: ₹${pendingCommission.toLocaleString()}\n\n🔗 View Your Patient Reports Live Online:\n${portalLink}\n\nOur laboratory team appreciates your medical trust.`
    );

    window.open(`mailto:${docEmail}?subject=${subject}&body=${body}`, "_blank");
    showSuccess("Opening Email Client with Doctor Referral Summary");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Light White Professional Header */}
        <div className="bg-white px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 text-xl font-black shadow-xs">
              {doctorName.charAt(0) === "D" && doctorName.startsWith("Dr")
                ? doctorName.replace("Dr.", "").trim().charAt(0)
                : doctorName.charAt(0)}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {doctorName}
                </h3>
                {doctor.isActive !== false ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    Active Practitioner
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                    Inactive
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${doctorTier.color} flex items-center gap-1`}>
                  <Crown className="w-3 h-3 text-amber-500" />
                  {doctorTier.name}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-xs text-indigo-700 font-mono font-bold bg-indigo-50/70 px-2 py-0.5 rounded border border-indigo-100">
                  {doctor.doctorCode || `DOC-${doctor.id}`}
                </span>
                
                {isPathologist ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                    <Award className="w-3 h-3 text-purple-600" />
                    In-House Pathologist (Sign-off)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-600" />
                    Referring Physician (B2B)
                  </span>
                )}

                {doctor.licenseExpiry && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    Lic. Expiry: {new Date(doctor.licenseExpiry).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[calc(85vh-120px)] overflow-y-auto bg-white">
          {isEstimatedStats && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-medium flex items-center justify-between">
              <span>⚠️ Dynamic statistics API unavailable. Financial summary below uses local database records.</span>
              <span className="font-bold text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded uppercase">Estimated Ledger</span>
            </div>
          )}
          
          {/* Business & Clinical Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Referrals */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-blue-800 font-bold uppercase tracking-wider mb-1">
                <span>Total Referrals</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">{referralCount}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Patients directed to lab</p>
            </div>

            {/* Total Revenue Generated */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-emerald-800 font-bold uppercase tracking-wider mb-1">
                <span>Revenue Generated</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Test billing contribution</p>
            </div>

            {/* Commission Ledger */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-purple-800 font-bold uppercase tracking-wider mb-1">
                <span>Commission ({commissionRateNum}%)</span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">₹{pendingCommission.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Pending settlement</p>
            </div>
          </div>

          {/* Quick Real-World Actions Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Link
              href={`/orders/new?referringDoctorId=${doctor.id}&doctorName=${encodeURIComponent(doctorName)}`}
              onClick={onClose}
              className="flex items-center justify-between p-3 bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-200/80 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                    Register Patient Order
                  </h4>
                  <p className="text-[10px] text-slate-500">Auto-assigns Dr. {doctorName}</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600" />
            </Link>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRequisitionSlip && onOpenRequisitionSlip(doctor);
              }}
              className="flex items-center justify-between p-3 bg-teal-50/70 hover:bg-teal-50 border border-teal-200/80 rounded-xl transition-all group text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    Lab Requisition Slip (TRF)
                  </h4>
                  <p className="text-[10px] text-slate-500">1-Page A4 Printable Pad</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-teal-400 group-hover:text-teal-600" />
            </button>

            {onOpenSamplePickup && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSamplePickup(doctor);
                }}
                className="flex items-center justify-between p-3 bg-rose-50/70 hover:bg-rose-50 border border-rose-200/80 rounded-xl transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                    <Bike className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                      Schedule Sample Pickup
                    </h4>
                    <p className="text-[10px] text-slate-500">Dispatch mobile phlebotomist rider</p>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-rose-400 group-hover:text-rose-600" />
              </button>
            )}

            {onOpenIdBadge && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenIdBadge(doctor);
                }}
                className="flex items-center justify-between p-3 bg-purple-50/70 hover:bg-purple-50 border border-purple-200/80 rounded-xl transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                    <FileBadge className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                      Doctor Privilege ID Card
                    </h4>
                    <p className="text-[10px] text-slate-500">Digital Badge & Chamber Certificate</p>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-600" />
              </button>
            )}

            {onOpenTariffSheet && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTariffSheet(doctor);
                }}
                className="flex items-center justify-between p-3 bg-amber-50/70 hover:bg-amber-50 border border-amber-200/80 rounded-xl transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                      Diagnostic Rate Master
                    </h4>
                    <p className="text-[10px] text-slate-500">B2B Tariffs & Referral Incentives</p>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-600" />
              </button>
            )}

            {onOpenAnalytics && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAnalytics(doctor);
                }}
                className="flex items-center justify-between p-3 bg-blue-50/70 hover:bg-blue-50 border border-blue-200/80 rounded-xl transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      Clinical Analytics & Panic Logs
                    </h4>
                    <p className="text-[10px] text-slate-500">Referral volume & critical alerts</p>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-600" />
              </button>
            )}
          </div>

          {/* Clinical Credentials & Licensing Section */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Medical Credentials & Licensing
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Medical Registration (MCI/NMC):</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {doctor.registrationNumber || doctor.licenseNumber ? (
                    doctor.registrationNumber || doctor.licenseNumber
                  ) : (
                    <span className="font-sans text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Not Recorded
                    </span>
                  )}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Specialization & Qualifications:</span>
                <span className="font-bold text-slate-900">
                  {doctor.specialization || "General Medicine"}{" "}
                  {doctor.qualification ? `(${doctor.qualification})` : ""}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Clinic / Hospital Affiliation:</span>
                <span className="font-bold text-slate-900">
                  {doctor.clinicName || "Private Medical Practice"}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Consultation Fee & OPD Timings:</span>
                <span className="font-bold text-slate-900">
                  {doctor.consultationFee ? `₹${doctor.consultationFee}` : "Free / Included"} 
                  {doctor.availableDays || doctor.availableTime ? ` | ${doctor.availableDays || ""} ${doctor.availableTime || ""}` : ""}
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-500 block">Clinic Address:</span>
                <span className="font-medium text-slate-800 truncate block">
                  {doctor.clinicAddress ||
                    [doctor.address, doctor.city, doctor.state].filter(Boolean).join(", ") ||
                    "Diagnostic Referral Network"}
                </span>
              </div>
            </div>
          </div>

          {/* Secure Doctor Portal Access Pass (Hospital / Lab feature) */}
          <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Live Clinician Report Portal Pass
              </h4>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                24/7 Mobile Access
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Share this dedicated URL with the doctor to grant direct real-time access to patient pathology results, lab turnaround times (TAT), and critical alert notifications.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={portalLink}
                className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs font-mono text-indigo-900 select-all"
              />
              <button
                type="button"
                onClick={handleCopyPortalLink}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? "Copied" : "Copy Link"}
              </button>
            </div>
          </div>

          {/* Contact & Communication Channels */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-600" />
              Communication & Report Delivery
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Phone:</span>
                <span className="font-bold text-slate-900">{doctor.phone || "—"}</span>
              </div>

              <div className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-slate-500">WhatsApp:</span>
                <span className="font-bold text-slate-900">
                  {doctor.whatsappNumber || doctor.phone || "—"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Email:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">
                  {doctor.email || "—"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Delivery Preference:</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {deliveryText}
                </span>
              </div>
            </div>
          </div>

          {/* Banking / UPI Payout Details */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-purple-600" />
                Referral Commission Settlement Ledger
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                doctor.bankAccountNumber || doctor.bankIfscCode
                  ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                  : "text-amber-800 bg-amber-50 border border-amber-200"
              }`}>
                {doctor.bankAccountNumber || doctor.bankIfscCode ? "Bank Account Linked" : "Banking Missing"}
              </span>
            </div>

            {doctor.bankAccountNumber || doctor.bankIfscCode ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Account / UPI:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {doctor.bankAccountNumber || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">IFSC Code:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {doctor.bankIfscCode || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Beneficiary:</span>
                  <span className="font-bold text-slate-900">
                    {doctor.bankAccountHolderName || doctorName}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-800 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200 font-medium">
                No bank account or UPI details on file for this practitioner. Please update details before initiating electronic settlement.
              </p>
            )}
          </div>

          {/* Digital Signature Preview */}
          {isPathologist && (
            <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <FileSignature className="w-4 h-4 text-purple-700" />
                  Authorized Digital Sign-off Stamp
                </h4>
                <p className="text-[11px] text-purple-700">
                  {doctor.signatureUrl
                    ? "Affixed automatically to diagnostic reports upon clinical sign-off."
                    : "No digital signature uploaded. Official report sign-off is disabled."}
                </p>
              </div>

              {doctor.signatureUrl ? (
                <div className="bg-white px-3 py-2 rounded-lg border border-purple-300 shadow-xs flex items-center gap-2">
                  <img src={doctor.signatureUrl} alt="Signature" className="h-8 object-contain" />
                  <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                    Stamp Verified
                  </span>
                </div>
              ) : (
                <div className="bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5 text-xs text-amber-800 font-semibold">
                  <AlertCircle size={14} className="text-amber-600" />
                  <span>Signature Missing</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onOpenWhatsApp) {
                  onClose();
                  onOpenWhatsApp(doctor);
                } else {
                  handleWhatsApp();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Send WhatsApp Referral Statement"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>

            <button
              onClick={() => {
                if (onOpenEmail) {
                  onClose();
                  onOpenEmail(doctor);
                } else {
                  handleEmail();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Send Email Referral Statement"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>

            {isReferring && onOpenPayoutModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPayoutModal(doctor);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
              >
                <CreditCard className="w-4 h-4" />
                Settle Payout (₹{pendingCommission.toLocaleString()})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onEditDoctor && (
              <button
                onClick={() => {
                  onClose();
                  onEditDoctor(doctor);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
              >
                Edit Profile
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
