'use client';

/**
 * Multi-step "Register New Patient" wizard.
 *
 * Ultra-crisp, light-white professional theme matching "Register New Doctor":
 * - Header: Off-white #f8fafc, bold title, draft badge, close X
 * - Accent: Thin linear gradient progress line (#0284c7 → #06b6d4)
 * - Stepper: Clean white container with bottom divider, pill chips (sky-50 active, emerald-50 done)
 * - Grid: 12-column balanced layout with uniform baselines, crisp slate-300 borders, soft shadows
 * - Footer: Distinct #f8fafc footer bar with Clear Draft, Cancel, Previous, and Next > / Complete buttons
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Heart,
  Loader2,
  Lock,
  MapPin,
  Phone,
  Save,
  Shield,
  Trash2,
  User,
  X,
  Sparkles,
} from 'lucide-react';

import { patientApi, ApiError } from '@/lib/api';
import { showSuccess, showError } from '@/lib/notifications';

export type PatientFormValues = {
  // 1 Personal
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  age: string;
  bloodGroup: string;
  patientType: string;
  maritalStatus: string;
  nationality: string;
  languages: string;

  // 2 Contact
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;

  // 3 Emergency
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  emergencyContactAddress: string;

  // 4 Clinical
  allergies: string;
  medicalConditions: string;
  currentMedications: string;
  clinicalRemarks: string;

  // 5 Insurance
  hasInsurance: boolean;
  insuranceProvider: string;
  insuranceNumber: string;
  insuranceGroupNumber: string;
  insuranceExpiryDate: string;

  // 6 Consent & ABHA
  abhaNumber: string;
  abhaAddress: string;
  preferredLanguage: string;
  preferredCommunicationMethod: string;
  reportDeliveryWhatsApp: boolean;
  reportDeliveryEmail: boolean;
  reportDeliveryHardCopy: boolean;
  consentForTreatment: boolean;
  dpdpDigitalCommConsent: boolean;
  dpdpAbhaExchangeConsent: boolean;

  // 7 Review & Notes
  notes: string;
  isActive: boolean;
  bookOrderImmediately?: boolean;
};

const MARITAL_STATUS_OPTIONS = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'MARRIED', label: 'Married' },
  { value: 'DIVORCED', label: 'Divorced' },
  { value: 'WIDOWED', label: 'Widowed' },
  { value: 'OTHER', label: 'Other' },
];

const EMPTY_PATIENT: PatientFormValues = {
  title: 'Mr.',
  firstName: '',
  middleName: '',
  lastName: '',
  gender: 'MALE',
  dateOfBirth: '',
  age: '',
  bloodGroup: '',
  patientType: 'GENERAL',
  maritalStatus: 'SINGLE',
  nationality: 'Indian',
  languages: 'English, Hindi',

  phone: '',
  whatsappNumber: '',
  email: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',

  emergencyContactName: '',
  emergencyContactRelationship: 'Spouse',
  emergencyContactPhone: '',
  emergencyContactAddress: '',

  allergies: '',
  medicalConditions: '',
  currentMedications: '',
  clinicalRemarks: '',

  hasInsurance: false,
  insuranceProvider: '',
  insuranceNumber: '',
  insuranceGroupNumber: '',
  insuranceExpiryDate: '',

  abhaNumber: '',
  abhaAddress: '',
  preferredLanguage: 'English',
  preferredCommunicationMethod: 'WhatsApp',
  reportDeliveryWhatsApp: true,
  reportDeliveryEmail: true,
  reportDeliveryHardCopy: false,
  consentForTreatment: true,
  dpdpDigitalCommConsent: true,
  dpdpAbhaExchangeConsent: false,

  notes: '',
  isActive: true,
  bookOrderImmediately: false,
};

export const WIZARD_STEPS = [
  { key: 'personal', label: 'Personal' },
  { key: 'contact', label: 'Contact' },
  { key: 'emergency', label: 'Emergency' },
  { key: 'clinical', label: 'Clinical' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'consent', label: 'Consent & ABHA' },
  { key: 'review', label: 'Review & Submit' },
] as const;

const DRAFT_KEY = 'labcore.patient.draft.v3';

// ------------------------------------------------------------------
// Helper Sanitizers
// ------------------------------------------------------------------

export const cleanPhone = (raw: string) => {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(-10);
};

export const cleanPostalCode = (raw: string) => raw.replace(/\D/g, '').slice(0, 6);

export const validateStep = (
  step: number,
  v: PatientFormValues
): Record<string, string> => {
  const e: Record<string, string> = {};

  if (step === 0) {
    if (!v.firstName.trim()) e.firstName = 'First name is required';
    else if (v.firstName.trim().length < 2) e.firstName = 'Enter at least 2 characters';

    if (!v.lastName.trim()) e.lastName = 'Last name is required';
    if (!v.gender) e.gender = 'Gender is required';

    if (!v.dateOfBirth && !v.age) {
      e.dateOfBirth = 'Date of birth or age is required';
    } else if (v.dateOfBirth) {
      const parts = v.dateOfBirth.split('-').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) {
        e.dateOfBirth = 'Enter a valid date format';
      } else {
        const [year, month, day] = parts;
        const now = new Date();
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        const birthDate = new Date(year, month - 1, day);
        if (
          Number.isNaN(birthDate.getTime()) ||
          birthDate.getFullYear() !== year ||
          birthDate.getMonth() !== month - 1 ||
          birthDate.getDate() !== day
        ) {
          e.dateOfBirth = 'Enter a valid calendar date';
        } else if (birthDate.getTime() > todayMidnight.getTime()) {
          e.dateOfBirth = 'DOB cannot be in future';
        } else if (year < 1900) {
          e.dateOfBirth = 'Enter a valid birth year (1900+)';
        }
      }
    }
  }

  if (step === 1) {
    const p = cleanPhone(v.phone);
    if (!p) e.phone = 'Mobile number is required';
    else if (p.length !== 10) e.phone = 'Enter a valid 10-digit mobile number';

    if (v.whatsappNumber) {
      const wp = cleanPhone(v.whatsappNumber);
      if (wp.length !== 10) e.whatsappNumber = 'Enter a valid 10-digit WhatsApp number';
    }

    if (v.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(v.email.trim())) e.email = 'Enter a valid email address';
    }

    if (v.postalCode && cleanPostalCode(v.postalCode).length !== 6) {
      e.postalCode = 'PIN code must be exactly 6 digits';
    }
  }

  if (step === 2) {
    if (v.emergencyContactPhone) {
      const ecp = cleanPhone(v.emergencyContactPhone);
      if (ecp.length !== 10) e.emergencyContactPhone = 'Enter a valid 10-digit emergency number';
    }
  }

  if (step === 4) {
    if (v.hasInsurance && !v.insuranceProvider.trim()) {
      e.insuranceProvider = 'Insurance provider name is required';
    }
  }

  if (step === 5) {
    if (!v.consentForTreatment) {
      e.consentForTreatment = 'Consent is required for diagnostic testing & processing';
    }
  }

  return e;
};

// ------------------------------------------------------------------
// Micro Field Helper
// ------------------------------------------------------------------

const Field: React.FC<{
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, required, hint, error, children, className = '' }) => (
  <div className={className}>
    <label className={`dr-label${required ? ' dr-required' : ''}`}>{label}</label>
    {children}
    {error ? (
      <p className="dr-error-text" role="alert">
        <AlertCircle size={12} aria-hidden />
        {error}
      </p>
    ) : hint ? (
      <p className="dr-hint">{hint}</p>
    ) : null}
  </div>
);

const inputClass = (error?: string) => `dr-input${error ? ' dr-input-error' : ''}`;

// ------------------------------------------------------------------
// Main Wizard Component
// ------------------------------------------------------------------

export default function RegisterPatientWizard({
  isOpen,
  onClose,
  onSuccess,
  patientToEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdPatient?: any) => void;
  patientToEdit?: any | null;
}) {
  const isEditing = !!patientToEdit;

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<PatientFormValues>(EMPTY_PATIENT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize or restore
  useEffect(() => {
    if (!isOpen) return;

    if (patientToEdit) {
      setValues({
        ...EMPTY_PATIENT,
        title: patientToEdit.title || 'Mr.',
        firstName: patientToEdit.firstName || '',
        middleName: patientToEdit.middleName || '',
        lastName: patientToEdit.lastName || '',
        gender: patientToEdit.gender || 'MALE',
        dateOfBirth: patientToEdit.dateOfBirth
          ? new Date(patientToEdit.dateOfBirth).toISOString().slice(0, 10)
          : '',
        age: patientToEdit.age ? String(patientToEdit.age) : '',
        bloodGroup: patientToEdit.bloodGroup || '',
        patientType: patientToEdit.patientType || 'GENERAL',
        maritalStatus: patientToEdit.maritalStatus ? patientToEdit.maritalStatus.toUpperCase() : 'SINGLE',
        nationality: patientToEdit.nationality || 'Indian',
        phone: patientToEdit.phone || '',
        whatsappNumber: patientToEdit.whatsappNumber || '',
        email: patientToEdit.email || '',
        address: patientToEdit.address || '',
        city: patientToEdit.city || '',
        state: patientToEdit.state || '',
        postalCode: patientToEdit.postalCode || '',
        emergencyContactName: patientToEdit.emergencyContactName || '',
        emergencyContactRelationship: patientToEdit.emergencyContactRelationship || 'Spouse',
        emergencyContactPhone: patientToEdit.emergencyContactPhone || '',
        allergies: Array.isArray(patientToEdit.allergies)
          ? patientToEdit.allergies.join(', ')
          : patientToEdit.allergies || '',
        medicalConditions: Array.isArray(patientToEdit.chronicDiseases || patientToEdit.medicalConditions)
          ? (patientToEdit.chronicDiseases || patientToEdit.medicalConditions).join(', ')
          : '',
        currentMedications: Array.isArray(patientToEdit.currentMedications)
          ? patientToEdit.currentMedications.map((m: any) => m.name || m).join(', ')
          : patientToEdit.currentMedications || '',
        insuranceProvider: patientToEdit.insuranceProvider || '',
        insuranceNumber: patientToEdit.insuranceNumber || '',
        insuranceGroupNumber: patientToEdit.insuranceGroupNumber || '',
        hasInsurance: Boolean(patientToEdit.insuranceProvider || patientToEdit.insuranceNumber),
        abhaNumber: patientToEdit.abhaNumber || '',
        abhaAddress: patientToEdit.abhaAddress || '',
        notes: patientToEdit.notes || '',
        isActive: patientToEdit.isActive !== false,
      });
      setDirty(false);
      setStep(0);
      return;
    }

    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setValues((prev) => ({ ...prev, ...parsed.values }));
          if (typeof parsed.step === 'number') setStep(parsed.step);
          if (parsed.savedAt) setDraftSavedAt(new Date(parsed.savedAt));
          setDirty(true);
        }
      }
    } catch {
      // ignore
    }
  }, [isOpen, patientToEdit]);

  // Auto-save draft on changes
  useEffect(() => {
    if (!isOpen || isEditing || !dirty) return;
    const t = setTimeout(() => {
      try {
        const now = new Date();
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ values, step, savedAt: now.toISOString() })
        );
        setDraftSavedAt(now);
      } catch {
        // ignore
      }
    }, 600);
    return () => clearTimeout(t);
  }, [values, step, dirty, isOpen, isEditing]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    setValues(EMPTY_PATIENT);
    setErrors({});
    setDirty(false);
    setDraftSavedAt(null);
    setStep(0);
  }, []);

  const set = <K extends keyof PatientFormValues>(key: K, val: PatientFormValues[K]) => {
    setDirty(true);
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Smart Name Auto-Split on typing
  const handleNameChange = (val: string) => {
    const tokens = val.trim().split(/\s+/);
    if (tokens.length >= 3) {
      setDirty(true);
      setValues((prev) => ({
        ...prev,
        firstName: tokens[0],
        middleName: tokens.slice(1, -1).join(' '),
        lastName: tokens[tokens.length - 1],
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.firstName;
        delete next.lastName;
        return next;
      });
      return;
    }
    if (tokens.length === 2) {
      setDirty(true);
      setValues((prev) => ({
        ...prev,
        firstName: tokens[0],
        middleName: '',
        lastName: tokens[1],
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.firstName;
        delete next.lastName;
        return next;
      });
      return;
    }
    set('firstName', val);
  };

  // Age <-> DOB sync & automatic verification
  const handleDobChange = (dob: string) => {
    setDirty(true);
    set('dateOfBirth', dob);

    if (!dob) {
      setValues((prev) => ({ ...prev, dateOfBirth: '' }));
      return;
    }

    const parts = dob.split('-').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const [year, month, day] = parts;
      const now = new Date();

      if (year < 1900) {
        setErrors((prev) => ({ ...prev, dateOfBirth: 'Enter a valid birth year (1900 or later)' }));
        return;
      }

      const birthDate = new Date(year, month - 1, day);
      if (
        Number.isNaN(birthDate.getTime()) ||
        birthDate.getFullYear() !== year ||
        birthDate.getMonth() !== month - 1 ||
        birthDate.getDate() !== day
      ) {
        setErrors((prev) => ({ ...prev, dateOfBirth: 'Enter a valid calendar date' }));
        return;
      }

      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      if (birthDate.getTime() > todayMidnight.getTime()) {
        setErrors((prev) => ({ ...prev, dateOfBirth: 'DOB cannot be in future' }));
        setValues((prev) => ({ ...prev, age: '' }));
        return;
      }

      let calculatedAge = now.getFullYear() - year;
      const m = now.getMonth() - (month - 1);
      if (m < 0 || (m === 0 && now.getDate() < day)) {
        calculatedAge--;
      }

      if (calculatedAge < 0) calculatedAge = 0;

      if (calculatedAge <= 130) {
        setValues((prev) => ({
          ...prev,
          dateOfBirth: dob,
          age: String(calculatedAge),
        }));
        setErrors((prev) => {
          const next = { ...prev };
          delete next.dateOfBirth;
          delete next.age;
          return next;
        });
      }
    }
  };

  const handleAgeChange = (ageStr: string) => {
    setDirty(true);
    set('age', ageStr);

    if (!ageStr) {
      setValues((prev) => ({ ...prev, age: '' }));
      return;
    }

    const num = parseInt(ageStr, 10);
    if (!Number.isNaN(num) && num >= 0 && num <= 130) {
      const approxYear = new Date().getFullYear() - num;
      const approxDob = `${approxYear}-01-01`;
      setValues((prev) => ({ ...prev, age: String(num), dateOfBirth: approxDob }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.age;
        delete next.dateOfBirth;
        return next;
      });
    } else if (Number.isNaN(num) || num < 0 || num > 130) {
      setErrors((prev) => ({ ...prev, age: 'Age must be between 0 and 130' }));
    }
  };

  const requestClose = () => {
    if (dirty && !isEditing) {
      const ok = window.confirm(
        'You have unsaved changes in this registration. Progress is auto-saved as a draft. Do you want to close?'
      );
      if (!ok) return;
    }
    onClose();
  };

  const goNext = () => {
    const errs = validateStep(step, values);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1));
  };

  // Submit Handler
  const submit = async () => {
    const errs = validateStep(step, values);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const cleanedPhone = cleanPhone(values.phone);
      const cleanedEmergencyPhone = cleanPhone(values.emergencyContactPhone);
      const cleanedPostal = cleanPostalCode(values.postalCode);

      const payload: Record<string, any> = {
        title: values.title,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        gender: values.gender.toUpperCase(),
        dateOfBirth: values.dateOfBirth,
        patientType: values.patientType,
      };

      if (values.middleName.trim()) payload.middleName = values.middleName.trim();
      if (values.age) payload.age = Number(values.age);
      if (values.bloodGroup) payload.bloodGroup = values.bloodGroup;
      if (values.maritalStatus) payload.maritalStatus = values.maritalStatus.toUpperCase();
      if (values.nationality.trim()) payload.nationality = values.nationality.trim();

      if (cleanedPhone) payload.phone = cleanedPhone;
      if (values.whatsappNumber) payload.whatsappNumber = cleanPhone(values.whatsappNumber);
      if (values.email.trim()) payload.email = values.email.trim();
      if (values.address.trim()) payload.address = values.address.trim();
      if (values.city.trim()) payload.city = values.city.trim();
      if (values.state.trim()) payload.state = values.state.trim();
      if (cleanedPostal) payload.postalCode = cleanedPostal;
      if (values.country.trim()) payload.country = values.country.trim();

      // Emergency Contact
      if (values.emergencyContactName.trim()) {
        payload.emergencyContactName = values.emergencyContactName.trim();
        payload.emergencyContactRelationship = values.emergencyContactRelationship;
        if (cleanedEmergencyPhone) payload.emergencyContactPhone = cleanedEmergencyPhone;
        if (values.emergencyContactAddress.trim()) {
          payload.emergencyContactAddress = values.emergencyContactAddress.trim();
        }
      }

      // Clinical
      if (values.allergies.trim()) {
        payload.allergies = values.allergies
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (values.medicalConditions.trim()) {
        const conds = values.medicalConditions
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        payload.chronicDiseases = conds;
        payload.medicalConditions = conds;
      }
      if (values.currentMedications.trim()) {
        payload.currentMedications = values.currentMedications
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name) => ({ name }));
      }

      // Insurance
      if (values.hasInsurance && values.insuranceProvider.trim()) {
        payload.insuranceProvider = values.insuranceProvider.trim();
        if (values.insuranceNumber.trim()) payload.insuranceNumber = values.insuranceNumber.trim();
        if (values.insuranceGroupNumber.trim()) {
          payload.insuranceGroupNumber = values.insuranceGroupNumber.trim();
        }
        if (values.insuranceExpiryDate) {
          payload.insuranceExpiryDate = values.insuranceExpiryDate;
        }
      }

      // Consents & Preferences
      payload.preferredLanguage = values.preferredLanguage;
      payload.preferredCommunicationMethod = values.preferredCommunicationMethod;
      payload.notificationPreferences = [
        values.reportDeliveryWhatsApp ? 'WhatsApp' : '',
        values.reportDeliveryEmail ? 'Email' : '',
        values.reportDeliveryHardCopy ? 'HardCopy' : '',
      ].filter(Boolean);

      payload.communicationPreference = {
        sms: true,
        email: values.reportDeliveryEmail,
        whatsapp: values.reportDeliveryWhatsApp,
        call: true,
      };

      payload.consentForTreatment = values.consentForTreatment;
      payload.consentForDataSharing = values.consentForTreatment;
      payload.privacyConsent = values.consentForTreatment;
      payload.dpdpConsent = {
        version: 'DPDP-v1.0-2024',
        timestamp: new Date().toISOString(),
        clinicalDiagnostics: values.consentForTreatment,
        digitalCommunication: values.dpdpDigitalCommConsent,
        abhaRecordExchange: values.dpdpAbhaExchangeConsent,
      };

      if (values.abhaNumber.trim()) payload.abhaNumber = values.abhaNumber.trim();
      if (values.abhaAddress.trim()) payload.abhaAddress = values.abhaAddress.trim();
      if (values.notes.trim()) payload.notes = values.notes.trim();

      let result;
      if (isEditing && patientToEdit?.id) {
        result = await patientApi.update(patientToEdit.id, payload);
        showSuccess('Patient record updated successfully');
      } else {
        result = await patientApi.create(payload);
        showSuccess('Patient registered successfully');
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          // ignore
        }
      }

      const createdPatient = result?.data?.patient || result?.data || result;

      onSuccess?.(createdPatient);
      onClose();

      if (values.bookOrderImmediately && createdPatient?.id && typeof window !== 'undefined') {
        window.location.href = `/orders/new?patientId=${createdPatient.id}`;
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Could not register patient';
      setSubmitError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const progress = ((step + 1) / WIZARD_STEPS.length) * 100;

  return (
    <div className="dr-overlay" role="dialog" aria-modal="true" aria-label="Register patient">
      <div className="dr-panel dr-panel-mid">
        {/* ---------- Header (Off-white #f8fafc) ---------- */}
        <div className="flex items-center justify-between gap-4 px-7 py-4 bg-[#f8fafc] border-b border-slate-200">
          <div>
            <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
              {isEditing ? 'Edit Patient Record' : 'Register New Patient'}
            </h2>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
              <span>Step {step + 1} of {WIZARD_STEPS.length} · {WIZARD_STEPS[step]!.label}</span>
              {!isEditing && draftSavedAt ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  <Save size={11} aria-hidden /> Draft saved{' '}
                  {draftSavedAt.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* ---------- Progress Bar ---------- */}
        <div
          className="h-1 bg-slate-100"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={WIZARD_STEPS.length}
        >
          <div
            className="h-1 transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #0284c7, #06b6d4)',
            }}
          />
        </div>

        {/* ---------- Horizontal Stepper Chips (Crisp White + Bottom Border) ---------- */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto px-6 py-2.5 bg-white border-b border-slate-200/80"
          style={{ scrollbarWidth: 'none' }}
        >
          {WIZARD_STEPS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                if (i <= step || Object.keys(validateStep(step, values)).length === 0) setStep(i);
              }}
              aria-current={i === step ? 'step' : undefined}
              className={`dr-step${i === step ? ' dr-step-active' : ''}${
                i < step ? ' dr-step-done' : ''
              }`}
            >
              <span className="dr-step-dot">
                {i < step ? <Check size={11} aria-hidden strokeWidth={2.5} /> : i + 1}
              </span>
              <span className="hidden sm:inline font-semibold text-[11px]">{s.label}</span>
            </button>
          ))}
        </div>

        {/* ---------- Step Body (Crisp Pure White Content) ---------- */}
        <div
          className="px-7 py-6 overflow-y-auto bg-white"
          style={{ maxHeight: 'min(62vh, 620px)' }}
        >
          {/* STEP 0: Personal */}
          {step === 0 ? (
            <div className="dr-grid">
              {/* Row 1: Demographics Baseline */}
              <Field label="Title" className="dr-col-2">
                <select
                  className="dr-select font-medium"
                  value={values.title}
                  onChange={(e) => set('title', e.target.value)}
                >
                  {['Mr.', 'Mrs.', 'Ms.', 'Master', 'Baby', 'Dr.', 'Prof.'].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Full Name"
                required
                error={errors.firstName}
                className="dr-col-5"
              >
                <input
                  className={inputClass(errors.firstName)}
                  value={
                    values.firstName +
                    (values.middleName ? ` ${values.middleName}` : '') +
                    (values.lastName ? ` ${values.lastName}` : '')
                  }
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Ramesh Kumar Patel"
                  autoFocus
                />
              </Field>

              <Field label="Gender" required error={errors.gender} className="dr-col-2">
                <select
                  className="dr-select font-medium"
                  value={values.gender}
                  onChange={(e) => set('gender', e.target.value)}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>

              <Field label="Date of Birth" error={errors.dateOfBirth} className="dr-col-3">
                <input
                  type="date"
                  className={inputClass(errors.dateOfBirth)}
                  value={values.dateOfBirth}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => handleDobChange(e.target.value)}
                />
              </Field>

              {/* Row 2: Secondary Personal */}
              <Field label="Age (Years)" error={errors.age} className="dr-col-2">
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={130}
                    className={inputClass(errors.age)}
                    value={values.age}
                    onChange={(e) => handleAgeChange(e.target.value)}
                    placeholder="28"
                  />
                  {values.dateOfBirth && values.age && !errors.dateOfBirth && !errors.age && (
                    <span
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none"
                      title="Age verified from Date of Birth"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  )}
                </div>
                {values.dateOfBirth && values.age && !errors.dateOfBirth && !errors.age && (
                  <p className="text-[10px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> Verified: {values.age} {Number(values.age) === 1 ? 'yr' : 'yrs'}
                  </p>
                )}
              </Field>

              <Field label="Blood Group" className="dr-col-3">
                <select
                  className="dr-select font-medium"
                  value={values.bloodGroup}
                  onChange={(e) => set('bloodGroup', e.target.value)}
                >
                  <option value="">Unknown / Not Tested</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Bombay Blood Group'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Patient Category" className="dr-col-4">
                <select
                  className="dr-select font-medium"
                  value={values.patientType}
                  onChange={(e) => set('patientType', e.target.value)}
                >
                  <option value="GENERAL">General / Walk-in</option>
                  <option value="VIP">VIP Patient</option>
                  <option value="CORPORATE">Corporate Tie-up</option>
                  <option value="INSURANCE">Insurance / TPA</option>
                  <option value="CAMP">Health Camp</option>
                  <option value="STAFF">Hospital Staff / Dependent</option>
                  <option value="SENIOR_CITIZEN">GERIATRIC (60+)</option>
                </select>
              </Field>

              <Field label="Marital Status" className="dr-col-3">
                <select
                  className="dr-select font-medium"
                  value={values.maritalStatus}
                  onChange={(e) => set('maritalStatus', e.target.value)}
                >
                  {MARITAL_STATUS_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Row 3: Nationality & Language */}
              <Field label="Nationality" className="dr-col-4">
                <input
                  className="dr-input"
                  value={values.nationality}
                  onChange={(e) => set('nationality', e.target.value)}
                  placeholder="Indian"
                />
              </Field>

              <Field label="Languages Spoken" className="dr-col-8">
                <input
                  className="dr-input"
                  value={values.languages}
                  onChange={(e) => set('languages', e.target.value)}
                  placeholder="English, Hindi, Gujarati"
                />
              </Field>
            </div>
          ) : null}

          {/* STEP 1: Contact */}
          {step === 1 ? (
            <div className="dr-grid">
              <Field
                label="Mobile Number"
                required
                error={errors.phone}
                className="dr-col-4"
              >
                <input
                  className={inputClass(errors.phone)}
                  value={values.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="9876543210"
                  maxLength={10}
                  autoFocus
                />
              </Field>

              <Field
                label="WhatsApp Number"
                error={errors.whatsappNumber}
                className="dr-col-4"
                hint={
                  values.phone && values.whatsappNumber !== values.phone ? (
                    <button
                      type="button"
                      onClick={() => set('whatsappNumber', values.phone)}
                      className="text-[10px] text-sky-600 hover:underline font-semibold"
                    >
                      Copy from Mobile
                    </button>
                  ) : undefined
                }
              >
                <input
                  className={inputClass(errors.whatsappNumber)}
                  value={values.whatsappNumber}
                  onChange={(e) => set('whatsappNumber', e.target.value)}
                  placeholder="9876543210"
                  maxLength={10}
                />
              </Field>

              <Field label="Email Address" error={errors.email} className="dr-col-4">
                <input
                  type="email"
                  className={inputClass(errors.email)}
                  value={values.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="patient@example.com"
                />
              </Field>

              <Field label="Street / Residential Address" className="dr-col-12">
                <input
                  className="dr-input"
                  value={values.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="House / Flat No, Street, Landmark"
                />
              </Field>

              <Field label="City" className="dr-col-4">
                <input
                  className="dr-input"
                  value={values.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="Ahmedabad"
                />
              </Field>

              <Field label="State" className="dr-col-4">
                <input
                  className="dr-input"
                  value={values.state}
                  onChange={(e) => set('state', e.target.value)}
                  placeholder="Gujarat"
                />
              </Field>

              <Field label="PIN Code" error={errors.postalCode} className="dr-col-4">
                <input
                  className={inputClass(errors.postalCode)}
                  value={values.postalCode}
                  onChange={(e) => set('postalCode', e.target.value)}
                  placeholder="380001"
                  maxLength={6}
                />
              </Field>
            </div>
          ) : null}

          {/* STEP 2: Emergency */}
          {step === 2 ? (
            <div className="dr-grid">
              <Field label="Emergency Contact Name" className="dr-col-4">
                <input
                  className="dr-input"
                  value={values.emergencyContactName}
                  onChange={(e) => set('emergencyContactName', e.target.value)}
                  placeholder="Kin or Guardian Full Name"
                  autoFocus
                />
              </Field>

              <Field label="Relationship" className="dr-col-4">
                <select
                  className="dr-select"
                  value={values.emergencyContactRelationship}
                  onChange={(e) => set('emergencyContactRelationship', e.target.value)}
                >
                  {['Spouse', 'Parent', 'Child', 'Sibling', 'Guardian', 'Friend', 'Relative', 'Other'].map(
                    (rel) => (
                      <option key={rel} value={rel}>
                        {rel}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field
                label="Emergency Phone"
                error={errors.emergencyContactPhone}
                className="dr-col-4"
              >
                <input
                  className={inputClass(errors.emergencyContactPhone)}
                  value={values.emergencyContactPhone}
                  onChange={(e) => set('emergencyContactPhone', e.target.value)}
                  placeholder="9876543210"
                  maxLength={10}
                />
              </Field>

              <Field label="Emergency Address / Special Remarks" className="dr-col-12">
                <textarea
                  className="dr-textarea"
                  value={values.emergencyContactAddress}
                  onChange={(e) => set('emergencyContactAddress', e.target.value)}
                  placeholder="Residence or specific instructions in case of medical emergency..."
                />
              </Field>
            </div>
          ) : null}

          {/* STEP 3: Clinical */}
          {step === 3 ? (
            <div className="dr-grid">
              <Field
                label="Known Drug / Food Allergies"
                className="dr-col-6"
                hint="e.g. Penicillin, Sulfa, Peanuts, Latex"
              >
                <textarea
                  className="dr-textarea"
                  value={values.allergies}
                  onChange={(e) => set('allergies', e.target.value)}
                  placeholder="None known or enter specific allergies..."
                  autoFocus
                />
              </Field>

              <Field
                label="Chronic Conditions & Diseases"
                className="dr-col-6"
                hint="e.g. Type 2 Diabetes, Hypertension, Thyroid"
              >
                <textarea
                  className="dr-textarea"
                  value={values.medicalConditions}
                  onChange={(e) => set('medicalConditions', e.target.value)}
                  placeholder="e.g. Diabetes, Hypertension..."
                />
              </Field>

              <Field
                label="Current Ongoing Medications"
                className="dr-col-12"
                hint="Medications that might interfere with reference ranges (e.g., Blood thinners, Steroids, Insulin)"
              >
                <textarea
                  className="dr-textarea"
                  value={values.currentMedications}
                  onChange={(e) => set('currentMedications', e.target.value)}
                  placeholder="e.g. Metformin 500mg, Telmisartan 40mg..."
                />
              </Field>
            </div>
          ) : null}

          {/* STEP 4: Insurance */}
          {step === 4 ? (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-slate-200 bg-[#f8fafc] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Third Party Administrator (TPA) & Insurance Billing
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Enable cashless diagnostic claims or corporate policy coverage
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={values.hasInsurance}
                    onChange={(e) => set('hasInsurance', e.target.checked)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
                  />
                  <span>Has Insurance Coverage</span>
                </label>
              </div>

              {values.hasInsurance ? (
                <div className="dr-grid">
                  <Field
                    label="Insurance Provider / TPA Name"
                    required
                    error={errors.insuranceProvider}
                    className="dr-col-6"
                  >
                    <input
                      className={inputClass(errors.insuranceProvider)}
                      value={values.insuranceProvider}
                      onChange={(e) => set('insuranceProvider', e.target.value)}
                      placeholder="e.g. Star Health, HDFC ERGO, Medi Assist"
                      autoFocus
                    />
                  </Field>

                  <Field label="Policy / TPA Card Number" className="dr-col-6">
                    <input
                      className="dr-input"
                      value={values.insuranceNumber}
                      onChange={(e) => set('insuranceNumber', e.target.value)}
                      placeholder="e.g. POL-9842104"
                    />
                  </Field>

                  <Field label="Corporate / Group Policy ID" className="dr-col-6">
                    <input
                      className="dr-input"
                      value={values.insuranceGroupNumber}
                      onChange={(e) => set('insuranceGroupNumber', e.target.value)}
                      placeholder="Optional Group ID"
                    />
                  </Field>

                  <Field label="Policy Expiry Date" className="dr-col-6">
                    <input
                      type="date"
                      className="dr-input"
                      value={values.insuranceExpiryDate}
                      onChange={(e) => set('insuranceExpiryDate', e.target.value)}
                    />
                  </Field>
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 text-slate-500">
                  <p className="text-xs">
                    Patient will be registered as direct billing / self-pay. Check the box above if this patient has insurance coverage.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {/* STEP 5: Consent & ABHA */}
          {step === 5 ? (
            <div className="space-y-4">
              <div className="dr-grid">
                <Field
                  label="ABHA Health ID (Ayushman Bharat)"
                  className="dr-col-6"
                  hint="14-digit ABDM ID (XX-XXXX-XXXX-XXXX)"
                >
                  <input
                    className="dr-input"
                    value={values.abhaNumber}
                    onChange={(e) => set('abhaNumber', e.target.value)}
                    placeholder="e.g. 12-3456-7890-1234"
                  />
                </Field>

                <Field
                  label="ABHA Address / PHR"
                  className="dr-col-6"
                  hint="Patient PHR handle (e.g. patient@abdm)"
                >
                  <input
                    className="dr-input"
                    value={values.abhaAddress}
                    onChange={(e) => set('abhaAddress', e.target.value)}
                    placeholder="patient@abdm"
                  />
                </Field>

                <Field label="Preferred Language for Reports" className="dr-col-6">
                  <select
                    className="dr-select"
                    value={values.preferredLanguage}
                    onChange={(e) => set('preferredLanguage', e.target.value)}
                  >
                    {['English', 'Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Telugu', 'Bengali'].map(
                      (lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="Primary Delivery Method" className="dr-col-6">
                  <select
                    className="dr-select"
                    value={values.preferredCommunicationMethod}
                    onChange={(e) => set('preferredCommunicationMethod', e.target.value)}
                  >
                    <option value="WhatsApp">WhatsApp (Instant PDF)</option>
                    <option value="Email">Email PDF</option>
                    <option value="SMS">SMS Download Link</option>
                    <option value="HardCopy">Counter Physical Printout</option>
                  </select>
                </Field>
              </div>

              {/* DPDP Act 2023 Statutory Consents */}
              <div className="p-4 rounded-xl border border-slate-200 bg-[#f8fafc] space-y-3">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-sky-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Statutory Consent & DPDP Act 2023 Compliance
                  </span>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={values.consentForTreatment}
                    onChange={(e) => set('consentForTreatment', e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>
                    <strong className="text-slate-900">Diagnostic Testing & Specimen Processing Consent *</strong>
                    <br />
                    <span className="text-[11px] text-slate-500">
                      Patient / legal guardian consents to sample collection, laboratory diagnostic analysis, and standard electronic record preservation under NABL standards.
                    </span>
                  </span>
                </label>
                {errors.consentForTreatment ? (
                  <p className="dr-error-text pl-6" role="alert">
                    <AlertCircle size={12} /> {errors.consentForTreatment}
                  </p>
                ) : null}

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={values.dpdpDigitalCommConsent}
                    onChange={(e) => set('dpdpDigitalCommConsent', e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>
                    <strong className="text-slate-900">Digital Delivery via WhatsApp & SMS</strong>
                    <br />
                    <span className="text-[11px] text-slate-500">
                      Send end-to-end encrypted PDF reports, QR verification links, and critical value alerts to mobile numbers.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={values.dpdpAbhaExchangeConsent}
                    onChange={(e) => set('dpdpAbhaExchangeConsent', e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>
                    <strong className="text-slate-900">ABDM Health Record Exchange (Ayushman Bharat)</strong>
                    <br />
                    <span className="text-[11px] text-slate-500">
                      Link diagnostic reports to patient's ABHA PHR address for interoperable longitudinal health record exchange.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          ) : null}

          {/* STEP 6: Review & Submit */}
          {step === 6 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Summary Card 1 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <User size={13} className="text-sky-600" /> Patient Demographics
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(0)}
                      className="text-[10px] text-sky-600 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div>
                      <strong>Name:</strong> {values.title} {values.firstName} {values.middleName} {values.lastName}
                    </div>
                    <div>
                      <strong>Gender / Age:</strong> {values.gender} · {values.age || '—'} yrs (DOB: {values.dateOfBirth || '—'})
                    </div>
                    <div>
                      <strong>Blood Group:</strong> {values.bloodGroup || 'Not Tested'} · <strong>Category:</strong> {values.patientType}
                    </div>
                  </div>
                </div>

                {/* Summary Card 2 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} className="text-sky-600" /> Contact & Delivery
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[10px] text-sky-600 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div>
                      <strong>Mobile:</strong> +91 {cleanPhone(values.phone)}
                    </div>
                    <div>
                      <strong>WhatsApp:</strong> +91 {cleanPhone(values.whatsappNumber || values.phone)}
                    </div>
                    <div>
                      <strong>City / PIN:</strong> {values.city || '—'}, {values.state || '—'} - {values.postalCode || '—'}
                    </div>
                  </div>
                </div>

                {/* Summary Card 3 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <Heart size={13} className="text-rose-500" /> Clinical Profile
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="text-[10px] text-sky-600 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div>
                      <strong>Allergies:</strong> {values.allergies || 'None recorded'}
                    </div>
                    <div>
                      <strong>Chronic Conditions:</strong> {values.medicalConditions || 'None recorded'}
                    </div>
                  </div>
                </div>

                {/* Summary Card 4 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <Shield size={13} className="text-emerald-600" /> Billing & ABHA
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="text-[10px] text-sky-600 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div>
                      <strong>Billing:</strong> {values.hasInsurance ? `Insurance (${values.insuranceProvider})` : 'Direct / Self Pay'}
                    </div>
                    <div>
                      <strong>ABHA ID:</strong> {values.abhaNumber || 'Not linked'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Internal Remarks */}
              <Field label="Registration & Clinical Remarks (Internal Notes)" className="dr-col-12">
                <textarea
                  className="dr-textarea"
                  value={values.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Optional internal remarks, VIP instructions or doctor referral notes..."
                />
              </Field>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={values.isActive}
                    onChange={(e) => set('isActive', e.target.checked)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>Active record (available for billing, appointments and orders immediately)</span>
                </label>

                {!isEditing && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-sky-600">
                    <input
                      type="checkbox"
                      checked={values.bookOrderImmediately}
                      onChange={(e) => set('bookOrderImmediately', e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Book test order right after registration</span>
                  </label>
                )}
              </div>

              {submitError ? (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-500 flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{submitError}</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* ---------- Footer Bar (Light Slate-50) ---------- */}
        <div className="flex items-center justify-between px-7 py-4 bg-[#f8fafc] border-t border-slate-200">
          <div>
            {!isEditing && dirty ? (
              <button
                type="button"
                onClick={clearDraft}
                className="text-xs text-slate-400 hover:text-rose-600 font-semibold transition inline-flex items-center gap-1.5"
              >
                <Trash2 size={12} /> Clear Draft
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium">LabCore Enterprise LIS</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={requestClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition"
            >
              Cancel
            </button>
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs inline-flex items-center gap-1 transition"
              >
                <ChevronLeft size={14} /> Previous
              </button>
            ) : null}
            {step < WIZARD_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={submitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#0284c7] hover:bg-[#0369a1] rounded-lg shadow-xs transition inline-flex items-center gap-1"
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#0284c7] hover:bg-[#0369a1] rounded-lg shadow-xs transition inline-flex items-center gap-1"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check size={14} />{' '}
                    {isEditing ? 'Update Patient' : 'Complete Registration'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
