"use client";

import React, { useState } from "react";
import { UserPlus, CheckCircle2, X } from "lucide-react";

export interface RegisterPatientWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdPatient?: any) => void;
}

export default function RegisterPatientWizard({
  isOpen,
  onClose,
  onSuccess,
}: RegisterPatientWizardProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("FEMALE");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess({
      id: `pat-${Date.now()}`,
      uhid: `UHID-2026-${Date.now().toString().slice(-4)}`,
      firstName,
      lastName,
      phone,
      gender,
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">New Patient Clinical Registration</h2>
            <p className="text-xs text-slate-500">Hospital OPD/IPD, Diagnostic Lab & Polyclinic Intake</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold uppercase text-slate-600 mb-1">First Name *</label>
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
            />
          </div>
          <div>
            <label className="block font-bold uppercase text-slate-600 mb-1">Last Name *</label>
            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
            />
          </div>
          <div>
            <label className="block font-bold uppercase text-slate-600 mb-1">Mobile Number *</label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-slate-900"
            />
          </div>
          <div>
            <label className="block font-bold uppercase text-slate-600 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
            >
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700">
            Cancel
          </button>
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f2d52] px-5 py-2 font-bold text-white">
            <CheckCircle2 className="h-4 w-4" />
            Complete Registration
          </button>
        </div>
      </form>
    </div>
  );
}
