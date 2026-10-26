"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { doctorApi } from "@/lib/api";
import type { Doctor } from "@/components/doctors/DoctorTable";
import DoctorDetails from "@/components/doctors/DoctorDetails";
import DoctorCommissionPayoutModal from "@/components/doctors/DoctorCommissionPayoutModal";
import DoctorRequisitionSlipModal from "@/components/doctors/DoctorRequisitionSlipModal";
import DoctorIdBadgeModal from "@/components/doctors/DoctorIdBadgeModal";
import DoctorSamplePickupModal from "@/components/doctors/DoctorSamplePickupModal";
import DoctorTariffSheetModal from "@/components/doctors/DoctorTariffSheetModal";
import DoctorAnalyticsModal from "@/components/doctors/DoctorAnalyticsModal";
import { showSuccess, showError } from "@/lib/notifications";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  User,
  Stethoscope,
  Building,
  Phone,
  Mail,
  Award,
  Calendar,
  Clock,
  Save,
  ShieldCheck,
  AlertCircle,
  FileSignature,
  FileText,
  DollarSign,
  Bike,
  FileBadge,
  BarChart3,
  FileSpreadsheet,
} from "lucide-react";

export default function DoctorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("edit") === "true";

  const doctorId = (params?.id as string) || (typeof window !== "undefined" ? window.location.pathname.split("/").pop() : "");

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Modals state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showRequisitionModal, setShowRequisitionModal] = useState(false);
  const [showIdBadgeModal, setShowIdBadgeModal] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showTariffModal, setShowTariffModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    specialization: "",
    qualification: "",
    phone: "",
    email: "",
    registrationNumber: "",
    clinicName: "",
    clinicAddress: "",
    commissionRate: "10",
    doctorType: "REFERRING_DOCTOR",
    experience: "",
    consultationFee: "",
    department: "",
    designation: "",
    availableTimeStart: "",
    availableTimeEnd: "",
  });

  useEffect(() => {
    async function fetchDoctor() {
      if (!doctorId) return;
      try {
        setLoading(true);
        setError(null);
        const response = await doctorApi.getById(doctorId);
        if (response.success && response.data) {
          const doc = response.data;
          setDoctor(doc);
          setFormData({
            firstName: doc.firstName || "",
            lastName: doc.lastName || "",
            middleName: doc.middleName || "",
            specialization: doc.specialization || "",
            qualification: doc.qualification || "",
            phone: doc.phone || "",
            email: doc.email || "",
            registrationNumber: doc.registrationNumber || doc.licenseNumber || "",
            clinicName: doc.clinicName || "",
            clinicAddress: doc.clinicAddress || "",
            commissionRate: String(doc.commissionRate || 10),
            doctorType: doc.doctorType || "REFERRING_DOCTOR",
            experience: doc.experience ? String(doc.experience) : "",
            consultationFee: doc.consultationFee ? String(doc.consultationFee) : "",
            department: doc.department || "",
            designation: doc.designation || "",
            availableTimeStart: doc.availableTimeStart || "",
            availableTimeEnd: doc.availableTimeEnd || "",
          });
        } else {
          setError(response.message || "Failed to load doctor profile.");
        }
      } catch (err: any) {
        setError(err?.message || "Communication error loading doctor profile.");
      } finally {
        setLoading(false);
      }
    }

    fetchDoctor();
  }, [doctorId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) return;
    try {
      setSaving(true);
      const res = await doctorApi.update(doctorId, {
        ...formData,
        experience: formData.experience ? Number(formData.experience) : undefined,
        consultationFee: formData.consultationFee ? Number(formData.consultationFee) : undefined,
        commissionRate: formData.commissionRate ? Number(formData.commissionRate) : 0,
      });

      if (res && res.success !== false) {
        showSuccess("Doctor credentials and terms updated successfully.");
        router.push(`/doctors/${doctorId}`);
      } else {
        showError(res?.message || "Failed to update doctor profile");
      }
    } catch (err: any) {
      showError(err?.message || "Error saving doctor details");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!doctor || !doctorId) return;
    const name = doctor.fullName || doctor.name || "this doctor";
    if (!confirm(`Are you sure you want to remove ${name} from your doctor directory?`)) {
      return;
    }

    try {
      await doctorApi.delete(doctorId);
      showSuccess(`Doctor ${name} removed successfully.`);
      router.push("/doctors");
    } catch (err: any) {
      showError(err?.message || "Failed to delete doctor.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Doctor Dossier">
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-sky-600 border-t-transparent mb-3" />
          <p className="text-xs font-semibold">Loading Doctor Credentials & Financial Dossier...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !doctor) {
    return (
      <DashboardLayout title="Doctor Details">
        <div className="max-w-3xl mx-auto mt-6 bg-white rounded-2xl border border-red-200 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-sm">Doctor Profile Notice</h3>
              <p className="text-xs text-red-600 mt-0.5">{error || "Doctor record not found."}</p>
            </div>
          </div>
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Doctor Directory
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isEditMode ? "Edit Doctor Credentials" : "Doctor Clinical Dossier"}>
      <div className="max-w-6xl mx-auto space-y-5">
        
        {/* Navigation & Action Header */}
        <div className="flex items-center justify-between pb-1">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-2 text-xs font-bold text-sky-700 hover:text-sky-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Doctor Directory
          </Link>

          {!isEditMode && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPayoutModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Payouts</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRequisitionModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 transition"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>Requisition Pad</span>
              </button>

              <button
                type="button"
                onClick={() => setShowIdBadgeModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 transition"
              >
                <FileBadge className="w-3.5 h-3.5 text-slate-600" />
                <span>ID Badge</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPickupModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 transition"
              >
                <Bike className="w-3.5 h-3.5 text-rose-600" />
                <span>Sample Pickup</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTariffModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                <span>Rate Master</span>
              </button>

              <Link
                href={`/doctors/${doctorId}?edit=true`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-2xs transition"
              >
                <Edit2 className="w-3.5 h-3.5 text-white" />
                <span>Edit Profile</span>
              </Link>
            </div>
          )}
        </div>

        {/* VIEW MODE: Detailed Clinical Dossier */}
        {!isEditMode && (
          <DoctorDetails
            doctor={doctor}
            onEdit={() => router.push(`/doctors/${doctorId}?edit=true`)}
            onDelete={handleDelete}
          />
        )}

        {/* EDIT MODE: Ultra Light White Clean Medical Form */}
        {isEditMode && (
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Edit Doctor Information & Practice Settings
                  </h2>
                  <p className="text-xs text-slate-500">
                    Update medical council credentials, chamber timings, and B2B incentive structures.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/doctors/${doctorId}`}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-white" />
                  <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
                </button>
              </div>
            </div>

            {/* Grid 1: Personal & Clinical Identity */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-600" /> Personal & Medical Identity
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 focus:border-sky-600 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 focus:border-sky-600 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 focus:border-sky-600 focus:outline-none bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Grid 2: Credentials & Specialization */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" /> Medical Qualifications & Department
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 focus:border-sky-600 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Qualifications (e.g. MBBS, MD)</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 focus:border-sky-600 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">MCI / NMC Registration No</label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono font-bold text-slate-900 focus:border-sky-600 focus:outline-none bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Grid 3: Clinic & Contact Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-600" /> Practice Clinic & Contact Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Clinic / Hospital Name</label>
                  <input
                    type="text"
                    value={formData.clinicName}
                    onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 focus:border-sky-600 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone / Mobile</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 focus:border-sky-600 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 focus:border-sky-600 focus:outline-none bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Grid 4: B2B Referral Commission & Financials */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Referral Incentive & B2B Commercials
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Practitioner Type</label>
                  <select
                    value={formData.doctorType}
                    onChange={(e) => setFormData({ ...formData, doctorType: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 focus:border-sky-600 focus:outline-none bg-white"
                  >
                    <option value="REFERRING_DOCTOR">Referring Doctor (Outpatient Partner)</option>
                    <option value="IN_HOUSE_PATHOLOGIST">In-House Pathologist (Digital Signatory)</option>
                    <option value="CONSULTANT_PATHOLOGIST">Consultant Pathologist</option>
                    <option value="HOSPITAL_PARTNER">Hospital / Clinic Institutional Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-900 focus:border-sky-600 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-900 focus:border-sky-600 focus:outline-none bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Link
                href={`/doctors/${doctorId}`}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* Modals */}
        <DoctorCommissionPayoutModal
          isOpen={showPayoutModal}
          onClose={() => setShowPayoutModal(false)}
          doctor={doctor as any}
          onPayoutSuccess={() => {
            // Refetch
          }}
        />

        <DoctorRequisitionSlipModal
          isOpen={showRequisitionModal}
          onClose={() => setShowRequisitionModal(false)}
          doctor={doctor as any}
        />

        <DoctorIdBadgeModal
          isOpen={showIdBadgeModal}
          onClose={() => setShowIdBadgeModal(false)}
          doctor={doctor as any}
        />

        <DoctorSamplePickupModal
          isOpen={showPickupModal}
          onClose={() => setShowPickupModal(false)}
          doctor={doctor as any}
        />

        <DoctorTariffSheetModal
          isOpen={showTariffModal}
          onClose={() => setShowTariffModal(false)}
          doctor={doctor as any}
        />

        <DoctorAnalyticsModal
          isOpen={showAnalyticsModal}
          onClose={() => setShowAnalyticsModal(false)}
          doctor={doctor as any}
        />

      </div>
    </DashboardLayout>
  );
}
