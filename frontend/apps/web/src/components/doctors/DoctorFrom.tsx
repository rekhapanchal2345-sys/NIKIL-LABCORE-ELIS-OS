"use client";

import React, { FormEvent, useState } from "react";
import {
  User,
  Award,
  Phone,
  Mail,
  Building2,
  Bell,
  CreditCard,
  FileSignature,
  ShieldCheck,
  Check,
  X,
  Upload,
  AlertCircle,
  Loader2,
} from "lucide-react";

export interface DoctorFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  specialization: string;
  qualification: string;
  registrationNumber: string;
  phone: string;
  email: string;
  signatureUrl?: string;
  doctorType?: "REFERRING_DOCTOR" | "INTERNAL_PATHOLOGIST" | "CONSULTANT_PATHOLOGIST";
  clinicName?: string;
  clinicAddress?: string;
  whatsappNumber?: string;
  reportDeliveryEmail?: boolean;
  reportDeliveryWhatsApp?: boolean;
  reportDeliveryHardCopy?: boolean;
  reportDeliveryPortal?: boolean;
  enablePortalAccess?: boolean;
  commissionRate?: number;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankAccountHolderName?: string;
}

interface DoctorFormProps {
  initialData?: Partial<DoctorFormData>;
  loading?: boolean;
  submitLabel?: string;
  onSubmit: (data: DoctorFormData) => Promise<void> | void;
  onCancel?: () => void;
}

const defaultForm: DoctorFormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  specialization: "",
  qualification: "",
  registrationNumber: "",
  phone: "",
  email: "",
  signatureUrl: "",
  doctorType: "REFERRING_DOCTOR",
  clinicName: "",
  clinicAddress: "",
  whatsappNumber: "",
  reportDeliveryEmail: false,
  reportDeliveryWhatsApp: false,
  reportDeliveryHardCopy: false,
  reportDeliveryPortal: false,
  enablePortalAccess: false,
  commissionRate: 0,
  bankAccountNumber: "",
  bankIfscCode: "",
  bankAccountHolderName: "",
};

export default function DoctorForm({
  initialData,
  loading = false,
  submitLabel = "Save Doctor Credentials",
  onSubmit,
  onCancel,
}: DoctorFormProps) {
  const [form, setForm] = useState<DoctorFormData>({
    ...defaultForm,
    ...initialData,
  });

  const [error, setError] = useState<string | null>(null);

  function updateField(
    field: keyof DoctorFormData,
    value: string | boolean | number
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.firstName.trim()) {
      setError("First name is required.");
      return;
    }

    if (!form.lastName.trim()) {
      setError("Last name is required.");
      return;
    }

    if (!form.specialization.trim()) {
      setError("Specialization is required.");
      return;
    }

    if (!form.qualification.trim()) {
      setError("Medical qualification (e.g. MBBS, MD) is required.");
      return;
    }

    if (!form.registrationNumber.trim()) {
      setError("Medical Council Registration Number (NMC / State) is required.");
      return;
    }

    const cleanedRegistrationNumber = form.registrationNumber.replace(/\s/g, "").replace(/[^\w-]/g, "");

    if (!form.phone || !form.phone.trim()) {
      setError("Contact phone number is required.");
      return;
    }

    try {
      const cleanedPhone = form.phone.replace(/\s/g, "");
      if (cleanedPhone.length < 10) {
        setError("Phone number must contain at least 10 digits.");
        return;
      }

      const cleanedForm = {
        ...form,
        phone: cleanedPhone,
        whatsappNumber: form.whatsappNumber?.replace(/\s/g, "") || "",
        registrationNumber: cleanedRegistrationNumber,
        email: form.email?.trim() || "",
      };
      await onSubmit(cleanedForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save doctor profile.");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none transition-all disabled:bg-slate-50";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Section 1: Doctor Demographics & Identity ── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Doctor Demographics & Identity</h2>
              <p className="text-[11px] text-slate-500 font-medium">Full clinical name and doctor designation</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Mandatory
          </span>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">First Name *</label>
            <input
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              placeholder="e.g. Rajesh"
              disabled={loading}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">Middle Name</label>
            <input
              value={form.middleName}
              onChange={(e) => updateField("middleName", e.target.value)}
              placeholder="e.g. Kumar"
              disabled={loading}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">Last Name *</label>
            <input
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              placeholder="e.g. Sharma"
              disabled={loading}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* ── Section 2: Clinical Credentials & Specialization ── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Medical Licensing & Clinical Specialization</h2>
              <p className="text-[11px] text-slate-500 font-medium">NMC registration, medical degrees, and institutional role</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-teal-600" />
            NMC Verified
          </span>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">Doctor Practice Type *</label>
            <select
              value={form.doctorType}
              onChange={(e) => updateField("doctorType", e.target.value)}
              disabled={loading}
              className={inputClass}
            >
              <option value="REFERRING_DOCTOR">External Referring Clinician / B2B Partner</option>
              <option value="INTERNAL_PATHOLOGIST">In-House Authorized Signatory Pathologist</option>
              <option value="CONSULTANT_PATHOLOGIST">Visiting Consultant Pathologist / Specialist</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">Medical Council Reg. Number *</label>
            <input
              value={form.registrationNumber}
              onChange={(e) => updateField("registrationNumber", e.target.value)}
              placeholder="e.g. MCI/NMC-2012-78941"
              disabled={loading}
              className={`${inputClass} font-mono`}
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">Clinical Specialization *</label>
            <input
              value={form.specialization}
              onChange={(e) => updateField("specialization", e.target.value)}
              placeholder="e.g. Consultant Cardiologist & Physician"
              disabled={loading}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">Degrees & Qualifications *</label>
            <input
              value={form.qualification}
              onChange={(e) => updateField("qualification", e.target.value)}
              placeholder="e.g. MBBS, MD (Med), DM (Cardiology), FACC"
              disabled={loading}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* ── Section 3: Contact & Report Dispatch Communication ── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Communication & Alert Dispatch Channels</h2>
              <p className="text-[11px] text-slate-500 font-medium">Emergency panic alerts, patient reports, and clinical updates</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">Direct Contact Phone *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+91 98200 XXXXX"
              disabled={loading}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">Official Clinical Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="doctor@hospital.org"
              disabled={loading}
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-[11px] font-bold text-slate-700">WhatsApp Notification Number</label>
            <input
              type="tel"
              value={form.whatsappNumber}
              onChange={(e) => updateField("whatsappNumber", e.target.value)}
              placeholder="+91 98200 XXXXX (for automated critical lab result & PDF delivery)"
              disabled={loading}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* ── Section 4: Affiliation & Clinic Information ── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Clinic / Hospital Affiliation</h2>
              <p className="text-[11px] text-slate-500 font-medium">Chamber location, polyclinic name, and sample collection address</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-[11px] font-bold text-slate-700">Clinic / Hospital / Center Name</label>
            <input
              value={form.clinicName}
              onChange={(e) => updateField("clinicName", e.target.value)}
              placeholder="e.g. Apex Heart & Multispecialty Clinic"
              disabled={loading}
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-[11px] font-bold text-slate-700">Chamber Physical Address</label>
            <input
              value={form.clinicAddress}
              onChange={(e) => updateField("clinicAddress", e.target.value)}
              placeholder="e.g. Suite 204, MedCity Complex, Sector 12"
              disabled={loading}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* ── Section 5: Report Delivery & Digital Preferences ── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Diagnostic Delivery & Portal Permissions</h2>
              <p className="text-[11px] text-slate-500 font-medium">Automatic multi-channel report dispatch preferences</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition cursor-pointer">
              <input
                type="checkbox"
                checked={form.reportDeliveryEmail}
                onChange={(e) => updateField("reportDeliveryEmail", e.target.checked)}
                disabled={loading}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-xs font-semibold text-slate-700">Email Dispatch</span>
            </label>

            <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition cursor-pointer">
              <input
                type="checkbox"
                checked={form.reportDeliveryWhatsApp}
                onChange={(e) => updateField("reportDeliveryWhatsApp", e.target.checked)}
                disabled={loading}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs font-semibold text-slate-700">WhatsApp Alert</span>
            </label>

            <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition cursor-pointer">
              <input
                type="checkbox"
                checked={form.reportDeliveryHardCopy}
                onChange={(e) => updateField("reportDeliveryHardCopy", e.target.checked)}
                disabled={loading}
                className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs font-semibold text-slate-700">Hard Copy Print</span>
            </label>

            <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition cursor-pointer">
              <input
                type="checkbox"
                checked={form.reportDeliveryPortal}
                onChange={(e) => updateField("reportDeliveryPortal", e.target.checked)}
                disabled={loading}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-700">Doctor EMR Portal</span>
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50/60 p-3.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.enablePortalAccess}
              onChange={(e) => updateField("enablePortalAccess", e.target.checked)}
              disabled={loading}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Provision Electronic Doctor Portal Account
              </span>
              <span className="text-[11px] text-slate-600 font-medium">
                Allows practitioner to log in, review longitudinal patient trends, and order computerized tests directly.
              </span>
            </div>
          </label>
        </div>
      </section>

      {/* ── Section 6: Financial Settlement & B2B Accounting (TDS 194J) ── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">B2B Financial Terms & Payout Bank Ledger</h2>
              <p className="text-[11px] text-slate-500 font-medium">Contracted incentive percentages, NEFT bank routing, and TDS 194J compliance</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
            TDS 194J (10%)
          </span>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">Contracted Referral Incentive (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.commissionRate}
              onChange={(e) => updateField("commissionRate", parseFloat(e.target.value) || 0)}
              placeholder="e.g. 15.0"
              disabled={loading}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">Bank Account Number</label>
            <input
              value={form.bankAccountNumber}
              onChange={(e) => updateField("bankAccountNumber", e.target.value)}
              placeholder="e.g. 50100412891230"
              disabled={loading}
              className={`${inputClass} font-mono`}
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">Bank IFSC Code</label>
            <input
              value={form.bankIfscCode}
              onChange={(e) => updateField("bankIfscCode", e.target.value)}
              placeholder="e.g. HDFC0001024"
              disabled={loading}
              className={`${inputClass} font-mono uppercase`}
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">Account Beneficiary Name</label>
            <input
              value={form.bankAccountHolderName}
              onChange={(e) => updateField("bankAccountHolderName", e.target.value)}
              placeholder="As per bank passbook"
              disabled={loading}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* ── Section 7: Cryptographic Digital Signature & Institutional Seal ── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <FileSignature className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Digital Signature & Report Authorization Seal</h2>
              <p className="text-[11px] text-slate-500 font-medium">Applied to verified diagnostic reports and digital prescriptions</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <label className="mb-2 block text-[11px] font-bold text-slate-700">
            Official Specimen Signature (Transparent PNG or JPG)
          </label>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    updateField("signatureUrl", reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              disabled={loading}
              className="hidden"
              id="signature-upload"
            />
            {form.signatureUrl ? (
              <div className="relative inline-block border border-slate-200 rounded-xl p-3 bg-slate-50">
                <img
                  src={form.signatureUrl}
                  alt="Doctor Signature"
                  className="h-24 max-w-xs object-contain"
                />
                <button
                  type="button"
                  onClick={() => updateField("signatureUrl", "")}
                  className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 hover:bg-rose-700 transition"
                  disabled={loading}
                  title="Remove signature"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="signature-upload"
                className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-sky-500 hover:bg-sky-50/40 transition-all"
              >
                <div className="flex flex-col items-center justify-center">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <p className="text-xs font-bold text-slate-700">
                    Click to upload signature image
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG format up to 5MB</p>
                </div>
              </label>
            )}
          </div>
        </div>
      </section>

      {/* ── Form Actions ── */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Doctor...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>{submitLabel}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
