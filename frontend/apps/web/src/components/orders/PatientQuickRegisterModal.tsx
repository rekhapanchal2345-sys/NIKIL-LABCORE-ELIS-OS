"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X, UserPlus, AlertCircle, ExternalLink, Loader2, Check } from "lucide-react";
import { patientApi } from "@/lib/api";

const INITIAL_FORM_STATE = {
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "MALE",
  dateOfBirth: "",
  age: "",
  phone: "",
  email: "",
  address: "",
  bloodGroup: "",
};

export function PatientQuickRegisterModal({
  isOpen,
  onClose,
  onPatientCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated: (patient: any) => void;
}) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form whenever modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setFormData(INITIAL_FORM_STATE);
      setError("");
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCloseModal = () => {
    setFormData(INITIAL_FORM_STATE);
    setError("");
    onClose();
  };

  const handleDobChange = (dob: string) => {
    if (!dob) {
      setFormData((prev) => ({ ...prev, dateOfBirth: "" }));
      return;
    }
    const parts = dob.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const [year, month, day] = parts;
      const now = new Date();
      if (year >= 1900) {
        const birthDate = new Date(year, month - 1, day);
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        if (birthDate.getTime() <= todayMidnight.getTime()) {
          let calculatedAge = now.getFullYear() - year;
          const m = now.getMonth() - (month - 1);
          if (m < 0 || (m === 0 && now.getDate() < day)) {
            calculatedAge--;
          }
          if (calculatedAge < 0) calculatedAge = 0;
          if (calculatedAge <= 130) {
            setFormData((prev) => ({ ...prev, dateOfBirth: dob, age: String(calculatedAge) }));
            setError("");
            return;
          }
        } else {
          setError("Date of birth cannot be in the future");
        }
      }
    }
    setFormData((prev) => ({ ...prev, dateOfBirth: dob }));
  };

  const handleAgeChange = (ageStr: string) => {
    if (!ageStr) {
      setFormData((prev) => ({ ...prev, age: "" }));
      return;
    }
    const num = parseInt(ageStr, 10);
    if (!isNaN(num) && num >= 0 && num <= 130) {
      const birthYear = new Date().getFullYear() - num;
      setFormData((prev) => ({
        ...prev,
        age: String(num),
        dateOfBirth: `${birthYear}-01-01`,
      }));
      setError("");
    } else {
      setFormData((prev) => ({ ...prev, age: ageStr }));
    }
  };

  const handleFirstNameChange = (val: string) => {
    const tokens = val.trim().split(/\s+/);
    if (tokens.length >= 3 && !formData.middleName && !formData.lastName) {
      setFormData({
        ...formData,
        firstName: tokens[0],
        middleName: tokens.slice(1, -1).join(" "),
        lastName: tokens[tokens.length - 1],
      });
      return;
    }
    if (tokens.length === 2 && !formData.lastName) {
      setFormData({
        ...formData,
        firstName: tokens[0],
        lastName: tokens[1],
      });
      return;
    }
    setFormData({ ...formData, firstName: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First and Last Name are required");
      return;
    }

    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return;
    }

    setLoading(true);

    try {
      let dateOfBirth: string | undefined = formData.dateOfBirth || undefined;
      if (!dateOfBirth && formData.age && !isNaN(Number(formData.age))) {
        const d = new Date();
        d.setFullYear(d.getFullYear() - Number(formData.age));
        dateOfBirth = d.toISOString().split("T")[0];
      }

      const cleanPhone = formData.phone.trim().replace(/[\s\-\(\)\+]/g, '').slice(-10);

      const payload: any = {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || undefined,
        lastName: formData.lastName.trim(),
        gender: formData.gender,
        age: formData.age ? Number(formData.age) : undefined,
        phone: cleanPhone,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        dateOfBirth,
        bloodGroup: formData.bloodGroup || undefined,
      };

      const response = await patientApi.create(payload);

      if (response && (response.success || response.data || response.id)) {
        const createdPatient = response.data?.patient || response.data || response;
        setFormData(INITIAL_FORM_STATE);
        onPatientCreated(createdPatient);
        handleCloseModal();
      } else {
        setError(response?.message || "Failed to create patient");
      }
    } catch (err: any) {
      console.error("Patient registration error:", err);
      setError(err.message || "Failed to register patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dr-overlay" role="dialog" aria-modal="true" aria-label="Quick patient registration">
      <div className="dr-panel dr-panel-mid" style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div
          className="flex items-center justify-between gap-4 px-6 py-4"
          style={{
            background: 'var(--surface-secondary)',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Quick Patient Registration
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Fast OPD walk-in registration for immediate test orders
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/patients/new"
              className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
              title="Open 7-step enterprise patient registration wizard"
            >
              <ExternalLink size={13} />
              <span>Full Wizard</span>
            </Link>
            <button
              type="button"
              onClick={handleCloseModal}
              aria-label="Close"
              className="p-2 rounded-lg hover:bg-[var(--surface-tertiary)] transition"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Progress Accent Line */}
        <div
          className="h-1"
          style={{
            background: 'linear-gradient(90deg, var(--primary), var(--info))',
          }}
        />

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-500 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: 'min(60vh, 520px)' }}>
            <div className="dr-grid">
              <div className="dr-col-4">
                <label className="dr-label dr-required">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => handleFirstNameChange(e.target.value)}
                  placeholder="e.g. Nikil"
                  className="dr-input"
                  autoFocus
                />
              </div>

              <div className="dr-col-4">
                <label className="dr-label">Middle Name</label>
                <input
                  type="text"
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                  placeholder="e.g. Kumar"
                  className="dr-input"
                />
              </div>

              <div className="dr-col-4">
                <label className="dr-label dr-required">Last Name</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Panchal"
                  className="dr-input"
                />
              </div>

              <div className="dr-col-3">
                <label className="dr-label dr-required">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="dr-select"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="dr-col-4">
                <div className="flex items-center justify-between">
                  <label className="dr-label">Date of Birth</label>
                  <span className="text-[10px] text-muted-foreground">Auto-calculates age</span>
                </div>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => handleDobChange(e.target.value)}
                  className="dr-input"
                />
              </div>

              <div className="dr-col-2">
                <div className="flex items-center justify-between">
                  <label className="dr-label dr-required">Age</label>
                  {formData.dateOfBirth && formData.age && (
                    <span className="text-[10px] text-emerald-500 font-semibold">✓ Auto</span>
                  )}
                </div>
                <input
                  type="number"
                  min={0}
                  max={130}
                  required
                  value={formData.age}
                  onChange={(e) => handleAgeChange(e.target.value)}
                  placeholder="28"
                  className="dr-input"
                />
              </div>

              <div className="dr-col-3">
                <label className="dr-label">Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="dr-select"
                >
                  <option value="">Unknown</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="dr-col-6">
                <label className="dr-label dr-required">Mobile Phone</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="dr-input"
                />
              </div>

              <div className="dr-col-6">
                <label className="dr-label">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="patient@example.com"
                  className="dr-input"
                />
              </div>

              <div className="dr-col-12">
                <label className="dr-label">Residential Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. House No, Street, Area, City"
                  className="dr-input"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{
              background: 'var(--surface-secondary)',
              borderTop: '1px solid var(--border-light)',
            }}
          >
            <Link
              href="/patients/new"
              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--primary)] font-medium inline-flex items-center gap-1"
            >
              Need full clinical consent form?
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={loading}
                className="dr-btn dr-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="dr-btn dr-btn-primary inline-flex items-center gap-1"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Register & Select
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
