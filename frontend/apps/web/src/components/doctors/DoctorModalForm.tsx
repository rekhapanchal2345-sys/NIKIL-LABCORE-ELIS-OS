"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Building,
  ShieldCheck,
  CreditCard,
  Award,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  FileSignature,
} from "lucide-react";
import { doctorApi } from "@/lib/api";
import { showSuccess, showError } from "@/lib/notifications";
import { DoctorProfileData } from "./DoctorQuickViewModal";

interface DoctorModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  doctor?: DoctorProfileData | null;
  onSuccess: () => void;
}

export default function DoctorModalForm({
  isOpen,
  onClose,
  doctor,
  onSuccess,
}: DoctorModalFormProps) {
  const isEditing = Boolean(doctor && doctor.id);

  const [formData, setFormData] = useState({
    doctorType: "REFERRING_DOCTOR",
    doctorCode: "",
    fullName: "",
    qualification: "MBBS, MD",
    specialization: "General Medicine",
    registrationNumber: "",
    phone: "",
    whatsappNumber: "",
    email: "",
    clinicName: "",
    clinicAddress: "",
    commissionRate: 15,
    bankAccountNumber: "",
    bankIfscCode: "",
    bankAccountHolderName: "",
    isActive: true,
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (doctor && isEditing) {
      setFormData({
        doctorType: doctor.doctorType || "REFERRING_DOCTOR",
        doctorCode: doctor.doctorCode || `DOC-${doctor.id}`,
        fullName:
          doctor.fullName ||
          doctor.name ||
          [doctor.firstName, doctor.middleName, doctor.lastName].filter(Boolean).join(" ") ||
          "",
        qualification: doctor.qualification || "MBBS, MD",
        specialization: doctor.specialization || "General Medicine",
        registrationNumber: doctor.registrationNumber || doctor.licenseNumber || "",
        phone: doctor.phone || "",
        whatsappNumber: doctor.whatsappNumber || doctor.phone || "",
        email: doctor.email || "",
        clinicName: doctor.clinicName || "",
        clinicAddress: doctor.clinicAddress || "",
        commissionRate: Number(doctor.commissionRate) || 15,
        bankAccountNumber: doctor.bankAccountNumber || "",
        bankIfscCode: doctor.bankIfscCode || "",
        bankAccountHolderName: doctor.bankAccountHolderName || "",
        isActive: doctor.isActive !== false,
      });
    } else {
      // Create defaults
      setFormData({
        doctorType: "REFERRING_DOCTOR",
        doctorCode: `DOC-${Date.now().toString().slice(-4)}`,
        fullName: "",
        qualification: "MBBS, MD",
        specialization: "General Medicine",
        registrationNumber: `NMC-${Date.now().toString().slice(-5)}`,
        phone: "",
        whatsappNumber: "",
        email: "",
        clinicName: "",
        clinicAddress: "",
        commissionRate: 15,
        bankAccountNumber: "",
        bankIfscCode: "",
        bankAccountHolderName: "",
        isActive: true,
      });
    }
  }, [doctor, isEditing, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      showError("Please enter Doctor's Full Name");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && doctor?.id) {
        const res = await doctorApi.update(String(doctor.id), formData);
        if (res && res.success === false) {
          showError(res.message || res.error || "Failed to update doctor");
          return;
        }
        showSuccess(`Doctor ${formData.fullName} updated successfully!`);
        onSuccess();
        onClose();
      } else {
        const res = await doctorApi.create(formData);
        if (res && res.success === false) {
          showError(res.message || res.error || "Failed to register doctor");
          return;
        }
        showSuccess(`Doctor ${formData.fullName} registered successfully!`);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error("Error saving doctor:", err);
      showError(err.message || err.error || "Failed to save doctor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shadow-2xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {isEditing ? "Edit Medical Practitioner Profile" : "Register New Medical Practitioner"}
              </h3>
              <p className="text-xs text-slate-500">
                Referring Physician, Consulting Specialist or In-House Pathologist
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Doctor Type Preset Tabs */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                doctorType: "REFERRING_DOCTOR",
                specialization: "General Medicine",
                commissionRate: 15,
              }))
            }
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              formData.doctorType === "REFERRING_DOCTOR"
                ? "bg-white text-slate-900 shadow-xs border border-slate-300"
                : "text-slate-600 hover:bg-white/50"
            }`}
          >
            <User className="w-3.5 h-3.5 text-sky-600" />
            Referring Physician (B2B)
          </button>

          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                doctorType: "IN_HOUSE_PATHOLOGIST",
                specialization: "Pathology & Microbiology",
                qualification: "MBBS, MD Pathology",
                commissionRate: 0,
              }))
            }
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              formData.doctorType === "IN_HOUSE_PATHOLOGIST"
                ? "bg-white text-teal-900 shadow-xs border border-teal-300"
                : "text-slate-600 hover:bg-white/50"
            }`}
          >
            <Award className="w-3.5 h-3.5 text-teal-600" />
            In-House Pathologist (Sign-off)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(80vh-140px)] overflow-y-auto">
          
          {/* Row 1: Full Name & Doctor Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Doctor Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold text-slate-900 focus:border-sky-600 focus:outline-none"
                placeholder="Dr. Rajesh Patel"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Doctor Code
              </label>
              <input
                type="text"
                value={formData.doctorCode}
                onChange={(e) => setFormData({ ...formData, doctorCode: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:border-sky-600 focus:outline-none"
                placeholder="DOC-001"
              />
            </div>
          </div>

          {/* Row 2: Specialization, Qualifications & Medical Reg # */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Specialization *
              </label>
              <select
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-sky-600 focus:outline-none bg-white"
              >
                <option value="General Medicine">General Medicine</option>
                <option value="Pathology">Pathology</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Diabetology">Diabetology</option>
                <option value="Gynecology">Gynecology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Nephrology">Nephrology</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Qualifications
              </label>
              <input
                type="text"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium focus:border-sky-600 focus:outline-none"
                placeholder="MBBS, MD, DNB"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                MCI/NMC Reg No. *
              </label>
              <input
                type="text"
                required
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold focus:border-sky-600 focus:outline-none"
                placeholder="e.g. GMC-38491"
              />
            </div>
          </div>

          {/* Row 3: Contact Details (Phone, WhatsApp, Email) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium focus:border-sky-600 focus:outline-none"
                placeholder="+91 9876543210"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium focus:border-sky-600 focus:outline-none"
                placeholder="+91 9876543210"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium focus:border-sky-600 focus:outline-none"
                placeholder="doctor@clinic.com"
              />
            </div>
          </div>

          {/* Row 4: Clinic / Practice Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Clinic / Hospital Name
              </label>
              <input
                type="text"
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium focus:border-sky-600 focus:outline-none"
                placeholder="e.g. Apex Health Clinic"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Clinic Address & Area
              </label>
              <input
                type="text"
                value={formData.clinicAddress}
                onChange={(e) => setFormData({ ...formData, clinicAddress: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium focus:border-sky-600 focus:outline-none"
                placeholder="e.g. Ring Road, Ahmedabad"
              />
            </div>
          </div>

          {/* Referral Commission & Banking (for Referring Doctors) */}
          {formData.doctorType === "REFERRING_DOCTOR" && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                Referral Incentive & Payout Settlement
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold focus:border-sky-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Bank Account / UPI ID
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono focus:border-sky-600 focus:outline-none"
                    placeholder="doctor@upi or Account #"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={formData.bankIfscCode}
                    onChange={(e) => setFormData({ ...formData, bankIfscCode: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono uppercase focus:border-sky-600 focus:outline-none"
                    placeholder="SBIN0001234"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveDoctor"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500"
            />
            <label htmlFor="isActiveDoctor" className="text-xs font-bold text-slate-700 cursor-pointer">
              Active Medical Practitioner (Permit test booking & referrals)
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Saving Practitioner..." : isEditing ? "Update Doctor" : "Register Doctor"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
