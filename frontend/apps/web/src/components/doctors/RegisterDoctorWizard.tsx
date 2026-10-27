'use client';

/**
 * Multi-step "Register New Doctor" wizard.
 *
 * One step per concern (Personal → Professional → Contact → Affiliation
 * → Communication → Financial → Signature & Documents → Review), with a
 * progress bar, per-step validation, auto-saved draft and an
 * unsaved-changes guard.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Save,
  Trash2,
  Upload,
  User,
  X,
  Sparkles,
} from 'lucide-react';

import { doctorApi, ApiError } from '@/lib/api';
import { showSuccess, showError } from '@/lib/notifications';
import {
  INDIAN_STATES,
  findLocationByCity,
  findLocationByPincode,
  searchLocations,
} from '@/lib/indiaLocations';

import {
  COMMISSION_TYPE_LABEL,
  COMMON_SPECIALIZATIONS,
  DOCTOR_TYPE_LABEL,
  GENDER_OPTIONS,
  PATHOLOGIST_TYPES,
  PAYOUT_CYCLE_LABEL,
  REGISTRATION_COUNCILS,
  earnsCommission,
  type CommissionType,
  type DoctorOrganization,
  type DoctorProfile,
  type DoctorType,
  type PayoutCycle,
} from './doctorTypes';

export type DoctorFormValues = {
  // 1 Personal
  title: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  // 2 Professional
  doctorType: DoctorType;
  qualification: string;
  specialization: string;
  designation: string;
  department: string;
  experienceYears: string;
  languages: string;
  registrationNumber: string;
  registrationCouncil: string;
  registrationExpiry: string;
  // 3 Contact
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  // 4 Affiliation
  organizationId: string;
  clinicName: string;
  clinicAddress: string;
  // 5 Communication
  reportDeliveryEmail: boolean;
  reportDeliveryWhatsApp: boolean;
  reportDeliveryHardCopy: boolean;
  reportDeliveryPortal: boolean;
  enablePortalAccess: boolean;
  // 6 Financial
  commissionType: CommissionType;
  commissionRate: string;
  commissionFlatAmount: string;
  payoutCycle: PayoutCycle;
  panNumber: string;
  gstin: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  bankAccountHolderName: string;
  bankName: string;
  upiId: string;
  // 7 Signature & documents
  signatureUrl: string;
  photoUrl: string;
  registrationCertificateUrl: string;
  cancelledChequeUrl: string;
  // 8 Review
  notes: string;
  isActive: boolean;
  // Advanced realworld features
  consultationFee: string;
  licenseNumber: string;
  licenseExpiry: string;
  availableDays: string;
  availableTime: string;
};

const EMPTY: DoctorFormValues = {
  title: 'Dr.',
  fullName: '',
  gender: '',
  dateOfBirth: '',
  doctorType: 'REFERRING_DOCTOR',
  qualification: '',
  specialization: '',
  designation: '',
  department: '',
  experienceYears: '',
  languages: 'English',
  registrationNumber: '',
  registrationCouncil: 'NMC (National Medical Commission)',
  registrationExpiry: '',
  phone: '',
  whatsappNumber: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  organizationId: '',
  clinicName: '',
  clinicAddress: '',
  reportDeliveryEmail: false,
  reportDeliveryWhatsApp: false,
  reportDeliveryHardCopy: false,
  reportDeliveryPortal: false,
  enablePortalAccess: false,
  commissionType: 'PERCENTAGE',
  commissionRate: '15',
  commissionFlatAmount: '',
  payoutCycle: 'MONTHLY',
  panNumber: '',
  gstin: '',
  bankAccountNumber: '',
  bankIfscCode: '',
  bankAccountHolderName: '',
  bankName: '',
  upiId: '',
  signatureUrl: '',
  photoUrl: '',
  registrationCertificateUrl: '',
  cancelledChequeUrl: '',
  notes: '',
  isActive: true,
  consultationFee: '',
  licenseNumber: '',
  licenseExpiry: '',
  availableDays: 'Mon-Sat',
  availableTime: '10:00 AM - 05:00 PM',
};

export const WIZARD_STEPS = [
  { key: 'personal', label: 'Personal' },
  { key: 'professional', label: 'Professional' },
  { key: 'contact', label: 'Contact' },
  { key: 'affiliation', label: 'Affiliation' },
  { key: 'communication', label: 'Communication' },
  { key: 'financial', label: 'Financial' },
  { key: 'documents', label: 'Signature & Docs' },
  { key: 'review', label: 'Review & Submit' },
] as const;

/** Fields pre-filled from an existing doctor when editing. */
export const valuesFromDoctor = (d: DoctorProfile): DoctorFormValues => ({
  title: d.title ?? 'Dr.',
  fullName: d.fullName ?? '',
  gender: (d as any).gender ?? '',
  dateOfBirth: (d as any).dateOfBirth
    ? new Date((d as any).dateOfBirth).toISOString().slice(0, 10)
    : '',
  doctorType: d.doctorType ?? 'REFERRING_DOCTOR',
  qualification: d.qualification ?? '',
  specialization: d.specialization ?? '',
  designation: d.designation ?? '',
  department: d.department ?? '',
  experienceYears: String(d.experienceYears ?? ''),
  languages: d.languages ?? '',
  registrationNumber: d.registrationNumber ?? '',
  registrationCouncil: (d as any).registrationCouncil ?? '',
  registrationExpiry: (d as any).registrationExpiry
    ? new Date((d as any).registrationExpiry).toISOString().slice(0, 10)
    : '',
  phone: d.phone ?? '',
  whatsappNumber: d.whatsappNumber ?? '',
  email: d.email ?? '',
  address: d.address ?? '',
  city: d.city ?? '',
  state: d.state ?? '',
  pincode: d.pincode ?? (d as any).postalCode ?? '',
  organizationId: d.organizationId ?? '',
  clinicName: d.clinicName ?? '',
  clinicAddress: d.clinicAddress ?? '',
  reportDeliveryEmail: !!d.reportDeliveryEmail,
  reportDeliveryWhatsApp: !!d.reportDeliveryWhatsApp,
  reportDeliveryHardCopy: !!d.reportDeliveryHardCopy,
  reportDeliveryPortal: !!d.reportDeliveryPortal,
  enablePortalAccess: !!d.enablePortalAccess,
  commissionType: d.commissionType ?? 'PERCENTAGE',
  commissionRate: String(d.commissionRate ?? ''),
  commissionFlatAmount: String(d.commissionFlatAmount ?? ''),
  payoutCycle: d.payoutCycle ?? 'MONTHLY',
  panNumber: (d as any).panNumber ?? '',
  gstin: (d as any).gstin ?? '',
  bankAccountNumber: d.bankAccountNumber ?? '',
  bankIfscCode: d.bankIfscCode ?? '',
  bankAccountHolderName: d.bankAccountHolderName ?? '',
  bankName: (d as any).bankName ?? '',
  upiId: (d as any).upiId ?? '',
  signatureUrl: d.signatureUrl ?? '',
  photoUrl: d.photoUrl ?? '',
  registrationCertificateUrl: (d as any).registrationCertificateUrl ?? '',
  cancelledChequeUrl: (d as any).cancelledChequeUrl ?? '',
  notes: (d as any).notes ?? '',
  isActive: d.isActive !== false,
  consultationFee: String(d.consultationFee ?? ''),
  licenseNumber: d.licenseNumber ?? '',
  licenseExpiry: d.licenseExpiry ? new Date(d.licenseExpiry).toISOString().slice(0, 10) : '',
  availableDays: d.availableDays ?? '',
  availableTime: d.availableTime ?? '',
});

const DRAFT_KEY = 'labcore.doctor.draft.v1';

// ------------------------------------------------------------------
// Client-side validation rules
// ------------------------------------------------------------------

const RE = {
  phone: /^[6-9]\d{9}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  upi: /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z][a-zA-Z0-9]{2,32}$/,
  pan: /^[A-Z]{5}\d{4}[A-Z]$/,
  gstin: /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/,
  pincode: /^[1-9]\d{5}$/,
};

export const stripPhone = (raw: string) => raw.replace(/\D/g, '').slice(-10);
export const stripIfsc = (raw: string) =>
  raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 11);
export const stripPan = (raw: string) =>
  raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
export const stripGstin = (raw: string) =>
  raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15);

export const validateStep = (
  step: number,
  v: DoctorFormValues
): Record<string, string> => {
  const e: Record<string, string> = {};
  const isPath = PATHOLOGIST_TYPES.includes(v.doctorType);

  if (step === 0) {
    if (!v.fullName.trim()) e.fullName = 'Full name is required';
    else if (v.fullName.trim().length < 2) e.fullName = 'Enter the full name';
    if (v.dateOfBirth) {
      const d = new Date(v.dateOfBirth);
      if (Number.isNaN(d.getTime()))
        e.dateOfBirth = 'Enter a valid date';
      else if (d.getTime() > Date.now())
        e.dateOfBirth = 'Date of birth cannot be in the future';
      else if (d.getFullYear() < 1920)
        e.dateOfBirth = 'Enter a valid date of birth';
    }
  }

  if (step === 1) {
    if (!v.qualification.trim()) e.qualification = 'Qualification is required';
    if (!v.specialization.trim())
      e.specialization = 'Specialization is required';
    if (
      v.experienceYears &&
      (Number(v.experienceYears) < 0 || Number(v.experienceYears) > 70)
    )
      e.experienceYears = 'Experience must be between 0 and 70 years';
    if (!isPath && !v.registrationNumber.trim())
      e.registrationNumber = 'Registration number is required for referral partners';
    if (v.registrationExpiry) {
      const d = new Date(v.registrationExpiry);
      if (Number.isNaN(d.getTime())) e.registrationExpiry = 'Enter a valid date';
      else if (d.getTime() < Date.now())
        e.registrationExpiry = 'This registration has already expired';
    }
    if (v.consultationFee && Number.isNaN(Number(v.consultationFee))) {
      e.consultationFee = 'Consultation fee must be a number';
    }
    if (v.licenseExpiry) {
      const d = new Date(v.licenseExpiry);
      if (Number.isNaN(d.getTime())) e.licenseExpiry = 'Enter a valid date';
      else if (d.getTime() < Date.now())
        e.licenseExpiry = 'This license has already expired';
    }
  }

  if (step === 2) {
    const digits = stripPhone(v.phone);
    if (!digits) e.phone = 'Phone number is required';
    else if (!RE.phone.test(digits))
      e.phone = 'Enter a valid 10-digit Indian mobile number';
    if (v.whatsappNumber && !RE.phone.test(stripPhone(v.whatsappNumber)))
      e.whatsappNumber = 'Enter a valid 10-digit WhatsApp number';
    if (v.email && !RE.email.test(v.email.trim()))
      e.email = 'Enter a valid email address';
    if (v.pincode && !RE.pincode.test(v.pincode.trim()))
      e.pincode = 'PIN code must be 6 digits';
  }

  if (step === 4) {
    if (v.reportDeliveryWhatsApp && !v.whatsappNumber && !v.phone)
      e.reportDeliveryWhatsApp = 'WhatsApp delivery needs a phone number';
    if (v.reportDeliveryEmail && !v.email)
      e.reportDeliveryEmail = 'Email delivery needs an email address';
    if (v.enablePortalAccess && !v.email)
      e.enablePortalAccess = 'Portal access needs an email address';
  }

  if (step === 5) {
    const earns = earnsCommission(v.doctorType);
    if (earns) {
      const rate = Number(v.commissionRate);
      if (v.commissionType === 'PERCENTAGE') {
        if (v.commissionRate === '' || Number.isNaN(rate))
          e.commissionRate = 'Commission percentage is required';
        else if (rate < 0 || rate > 100)
          e.commissionRate = 'Commission must be between 0 and 100%';
      }
      if (v.commissionType === 'FLAT_PER_PATIENT') {
        const flat = Number(v.commissionFlatAmount);
        if (!v.commissionFlatAmount || Number.isNaN(flat) || flat <= 0)
          e.commissionFlatAmount = 'Enter a flat amount greater than zero';
      }
    }
    if (v.panNumber && !RE.pan.test(stripPan(v.panNumber)))
      e.panNumber = 'Invalid PAN (expected ABCDE1234F)';
    if (v.gstin && !RE.gstin.test(stripGstin(v.gstin)))
      e.gstin = 'Invalid GSTIN (expected 15 characters)';
    if (v.bankIfscCode && !RE.ifsc.test(stripIfsc(v.bankIfscCode)))
      e.bankIfscCode = 'Invalid IFSC (expected ABCD0123456)';
    if (v.upiId && !RE.upi.test(v.upiId.trim()))
      e.upiId = 'Invalid UPI ID (expected name@bank)';
  }

  if (step === 6) {
    if (isPath && !v.signatureUrl)
      e.signatureUrl =
        'A digital signature is mandatory for pathologist / consultant records';
  }

  return e;
};

// ------------------------------------------------------------------
// Field Components
// ------------------------------------------------------------------

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

const Field: React.FC<FieldProps> = ({
  label,
  required,
  hint,
  error,
  children,
  className = '',
}) => (
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

const inputClass = (error?: string) =>
  `dr-input${error ? ' dr-input-error' : ''}`;

const ErrorText: React.FC<{ error?: string }> = ({ error }) =>
  error ? (
    <p className="dr-error-text" role="alert">
      <AlertCircle size={12} aria-hidden />
      {error}
    </p>
  ) : null;

/** Reads an image and returns a data URL, rejecting anything over 3 MB. */
const readImage = (
  file: File,
  onDone: (dataUrl: string) => void,
  onError: (msg: string) => void
) => {
  if (file.size > 3 * 1024 * 1024) {
    onError('File is larger than 3 MB. Please upload a smaller scan or photo.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onDone(String(reader.result));
  reader.onerror = () => onError('Could not read the file. Please try again.');
  reader.readAsDataURL(file);
};

interface FileFieldProps {
  label: string;
  accept: string;
  value?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  preview?: boolean;
  className?: string;
  onChange: (dataUrl: string) => void;
}

const FileField: React.FC<FileFieldProps> = ({
  label,
  accept,
  value,
  required,
  hint,
  error,
  preview = true,
  className = '',
  onChange,
}) => {
  const id = `file-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className={className}>
      <label htmlFor={id} className={`dr-label${required ? ' dr-required' : ''}`}>
        {label}
      </label>
      <div className="flex items-center gap-3">
        <label
          htmlFor={id}
          className="dr-btn dr-btn-secondary inline-flex items-center gap-2 cursor-pointer text-xs py-1.5 px-3"
        >
          <Upload size={14} />
          {value ? 'Replace File' : 'Upload File'}
        </label>
        <input
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(ev) => {
            const file = ev.target.files?.[0];
            if (file) readImage(file, onChange, (m) => showError(m));
          }}
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-[var(--error)] hover:underline flex items-center gap-1"
          >
            <Trash2 size={12} /> Remove
          </button>
        ) : null}
      </div>
      {value && preview ? (
        <div className="mt-2">
          <img
            src={value}
            alt={`${label} preview`}
            className="h-16 max-w-[200px] object-contain border border-[var(--border-light)] rounded-md bg-[var(--surface-secondary)] p-1"
          />
        </div>
      ) : null}
      <ErrorText error={error} />
      {!error && hint ? <p className="dr-hint">{hint}</p> : null}
    </div>
  );
};

// ------------------------------------------------------------------
// Main Wizard Component
// ------------------------------------------------------------------

export interface RegisterDoctorWizardProps {
  isOpen: boolean;
  onClose: () => void;
  /** Present when editing an existing record. */
  doctor?: DoctorProfile | null;
  onSuccess?: () => void;
}

export default function RegisterDoctorWizard({
  isOpen,
  onClose,
  doctor,
  onSuccess,
}: RegisterDoctorWizardProps) {
  const isEditing = Boolean(doctor?.id);

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<DoctorFormValues>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [organizations, setOrganizations] = useState<DoctorOrganization[]>([]);

  const isPathologist = PATHOLOGIST_TYPES.includes(values.doctorType);
  const earns = earnsCommission(values.doctorType);

  // ---------------- initialise ----------------
  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setErrors({});
    setSubmitError(null);

    if (doctor) {
      setValues(valuesFromDoctor(doctor));
      setDirty(false);
      return;
    }

    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        setValues({ ...EMPTY, ...(JSON.parse(raw) as DoctorFormValues) });
        setDirty(true);
      } else {
        setValues(EMPTY);
      }
    } catch {
      setValues(EMPTY);
    }
  }, [isOpen, doctor]);

  // Organisation dropdown source
  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    doctorApi
      .getOrganizations()
      .then((res: any) => {
        if (alive) setOrganizations(res?.data?.organizations ?? []);
      })
      .catch(() => {
        /* non-fatal */
      });
    return () => {
      alive = false;
    };
  }, [isOpen]);

  // Auto-save the draft
  useEffect(() => {
    if (!isOpen || isEditing || !dirty) return;
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
        setDraftSavedAt(new Date());
      } catch {
        /* storage blocked */
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [values, dirty, isOpen, isEditing]);

  // Unsaved-changes guard
  useEffect(() => {
    if (!isOpen || !dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isOpen, dirty]);

  const set = useCallback(
    <K extends keyof DoctorFormValues>(key: K, value: DoctorFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      setDirty(true);
      setErrors((prev) => {
        if (!prev[key as string]) return prev;
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    },
    []
  );

  const handleDoctorCityChange = (cityName: string) => {
    set('city', cityName);
    const loc = findLocationByCity(cityName, values.state);
    if (loc) {
      setValues((prev) => ({
        ...prev,
        city: loc.city,
        state: loc.state,
        pincode: loc.defaultPincode,
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.pincode;
        return next;
      });
    }
  };

  const handleDoctorPincodeChange = (raw: string) => {
    const clean = raw.replace(/\D/g, '').slice(0, 6);
    set('pincode', clean);
    if (clean.length === 6) {
      const loc = findLocationByPincode(clean);
      if (loc) {
        setValues((prev) => ({
          ...prev,
          pincode: clean,
          city: loc.city,
          state: loc.state,
        }));
      }
    }
  };

  const requestClose = () => {
    if (dirty && !isEditing) {
      const ok = window.confirm(
        'You have unsaved changes. Your draft is stored locally, so you can resume later. Close anyway?'
      );
      if (!ok) return;
    }
    onClose();
  };

  const goNext = () => {
    const stepErrors = validateStep(step, values);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1));
  };

  const clearDraft = () => {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* nothing */
    }
    setDraftSavedAt(null);
  };

  const buildPayload = () => {
    const earnsComm = earnsCommission(values.doctorType);
    const payload: Record<string, any> = {
      title: values.title || undefined,
      fullName: values.fullName.trim(),
      gender: values.gender || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      doctorType: values.doctorType,
      qualification: values.qualification.trim(),
      specialization: values.specialization.trim(),
      designation: values.designation.trim() || undefined,
      department: values.department.trim() || undefined,
      experienceYears: values.experienceYears
        ? Number(values.experienceYears)
        : undefined,
      languages: values.languages.trim() || undefined,
      registrationNumber: values.registrationNumber.trim() || undefined,
      registrationCouncil: values.registrationCouncil || undefined,
      registrationExpiry: values.registrationExpiry || undefined,
      phone: values.phone ? `+91${stripPhone(values.phone)}` : undefined,
      whatsappNumber: values.whatsappNumber
        ? `+91${stripPhone(values.whatsappNumber)}`
        : undefined,
      email: values.email.trim() || undefined,
      address: values.address.trim() || undefined,
      city: values.city.trim() || undefined,
      state: values.state.trim() || undefined,
      pincode: values.pincode.trim() || undefined,
      organizationId: values.organizationId || undefined,
      clinicName: values.clinicName.trim() || undefined,
      clinicAddress: values.clinicAddress.trim() || undefined,
      reportDeliveryEmail: values.reportDeliveryEmail,
      reportDeliveryWhatsApp: values.reportDeliveryWhatsApp,
      reportDeliveryHardCopy: values.reportDeliveryHardCopy,
      reportDeliveryPortal: values.reportDeliveryPortal,
      enablePortalAccess: values.enablePortalAccess,
      commissionType: earnsComm ? values.commissionType : 'NONE',
      commissionRate:
        earnsComm && values.commissionType === 'PERCENTAGE'
          ? Number(values.commissionRate)
          : 0,
      commissionFlatAmount:
        earnsComm && values.commissionType === 'FLAT_PER_PATIENT'
          ? Number(values.commissionFlatAmount)
          : undefined,
      payoutCycle: values.payoutCycle,
      panNumber: values.panNumber ? stripPan(values.panNumber) : undefined,
      gstin: values.gstin ? stripGstin(values.gstin) : undefined,
      bankAccountNumber: values.bankAccountNumber.trim() || undefined,
      bankIfscCode: values.bankIfscCode
        ? stripIfsc(values.bankIfscCode)
        : undefined,
      bankAccountHolderName: values.bankAccountHolderName.trim() || undefined,
      bankName: values.bankName.trim() || undefined,
      upiId: values.upiId.trim() || undefined,
      signatureUrl: values.signatureUrl || undefined,
      photoUrl: values.photoUrl || undefined,
      registrationCertificateUrl: values.registrationCertificateUrl || undefined,
      cancelledChequeUrl: values.cancelledChequeUrl || undefined,
      notes: values.notes.trim() || undefined,
      isActive: values.isActive,
      consultationFee: values.consultationFee ? Number(values.consultationFee) : undefined,
      licenseNumber: values.licenseNumber.trim() || undefined,
      licenseExpiry: values.licenseExpiry || undefined,
      availableDays: values.availableDays.trim() || undefined,
      availableTime: values.availableTime.trim() || undefined,
    };
    return payload;
  };

  const submit = async () => {
    const all: Record<string, string> = {};
    let firstBad = -1;
    WIZARD_STEPS.forEach((_, i) => {
      const stepErrors = validateStep(i, values);
      if (Object.keys(stepErrors).length > 0 && firstBad === -1) firstBad = i;
      Object.assign(all, stepErrors);
    });

    if (Object.keys(all).length > 0) {
      setErrors(all);
      if (firstBad >= 0) setStep(firstBad);
      showError('Please correct the highlighted fields before submitting.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = buildPayload();
      if (isEditing && doctor?.id) {
        await doctorApi.update(doctor.id, payload);
        showSuccess(`${payload.fullName} updated successfully`);
      } else {
        await doctorApi.create(payload);
        showSuccess(`${payload.fullName} registered successfully`);
      }
      setDirty(false);
      clearDraft();
      setValues(EMPTY);
      onSuccess?.();
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Could not save the doctor record';
      setSubmitError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const progress = ((step + 1) / WIZARD_STEPS.length) * 100;

  return (
    <div className="dr-overlay" role="dialog" aria-modal="true" aria-label="Register doctor">
      <div className="dr-panel dr-panel-mid">
        {/* ---------- header ---------- */}
        <div
          className="flex items-center justify-between gap-4 px-6 py-4"
          style={{
            background: 'var(--surface-secondary)',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div>
            <h2
              className="text-base font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {isEditing ? 'Edit Doctor Record' : 'Register New Doctor'}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Step {step + 1} of {WIZARD_STEPS.length} ·{' '}
              {WIZARD_STEPS[step]!.label}
              {!isEditing && draftSavedAt ? (
                <span className="ml-2 inline-flex items-center gap-1">
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
            className="p-2 rounded-lg hover:bg-[var(--surface-tertiary)] transition"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ---------- progress bar ---------- */}
        <div
          className="h-1"
          style={{ background: 'var(--surface-tertiary)' }}
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={WIZARD_STEPS.length}
        >
          <div
            className="h-1 transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: 'var(--primary)',
            }}
          />
        </div>

        {/* ---------- step chips ---------- */}
        <div
          className="flex gap-1 overflow-x-auto px-4 py-3"
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
                {i < step ? <Check size={12} aria-hidden /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        {/* ---------- step body ---------- */}
        <div
          className="px-6 py-5 overflow-y-auto"
          style={{ maxHeight: 'min(60vh, 620px)' }}
        >
          {step === 0 ? (
            <div className="dr-grid">
              <Field label="Title" className="dr-col-2">
                <select
                  className="dr-select"
                  value={values.title}
                  onChange={(e) => set('title', e.target.value)}
                >
                  {['Dr.', 'Prof.', 'Dr.Prof.', 'Mr.', 'Ms.', 'Mrs.'].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Full Name"
                required
                error={errors.fullName}
                className="dr-col-5"
              >
                <input
                  className={inputClass(errors.fullName)}
                  value={values.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  placeholder="e.g. Nikil Kumar Panchal"
                  autoFocus
                />
              </Field>
              <Field label="Gender" className="dr-col-2">
                <select
                  className="dr-select"
                  value={values.gender}
                  onChange={(e) => set('gender', e.target.value)}
                >
                  <option value="">Not specified</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Date of Birth"
                error={errors.dateOfBirth}
                className="dr-col-3"
              >
                <input
                  type="date"
                  className={inputClass(errors.dateOfBirth)}
                  value={values.dateOfBirth}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => set('dateOfBirth', e.target.value)}
                />
              </Field>
              <Field
                label="Years of Experience"
                error={errors.experienceYears}
                className="dr-col-4"
              >
                <input
                  type="number"
                  min={0}
                  max={70}
                  className={inputClass(errors.experienceYears)}
                  value={values.experienceYears}
                  onChange={(e) => set('experienceYears', e.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="Languages" className="dr-col-8">
                <input
                  className="dr-input"
                  value={values.languages}
                  onChange={(e) => set('languages', e.target.value)}
                  placeholder="English, Hindi, Gujarati"
                />
              </Field>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="dr-grid">
              <Field
                label="Doctor Type"
                required
                className="dr-col-12"
                hint={
                  isPathologist
                    ? 'Pathologists sign reports, so a digital signature is required in step 7.'
                    : 'Referring doctors and partners earn commission on paid referrals.'
                }
              >
                <div className="dr-seg flex-wrap">
                  {(Object.keys(DOCTOR_TYPE_LABEL) as DoctorType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={values.doctorType === t}
                      onClick={() => {
                        const patch: Partial<DoctorFormValues> = { doctorType: t };
                        if (PATHOLOGIST_TYPES.includes(t) || t === 'CONSULTANT') {
                          patch.commissionType = 'NONE';
                          patch.commissionRate = '0';
                        } else if (values.commissionType === 'NONE') {
                          patch.commissionType = 'PERCENTAGE';
                          patch.commissionRate = '15';
                        }
                        setValues((p) => ({ ...p, ...patch }));
                        setDirty(true);
                      }}
                      className={`dr-seg-item${
                        values.doctorType === t ? ' dr-seg-item-active' : ''
                      }`}
                    >
                      {DOCTOR_TYPE_LABEL[t]}
                    </button>
                  ))}
                </div>
              </Field>
              <Field
                label="Qualifications"
                required
                error={errors.qualification}
                className="dr-col-4"
              >
                <input
                  className={inputClass(errors.qualification)}
                  value={values.qualification}
                  onChange={(e) => set('qualification', e.target.value)}
                  placeholder="MBBS, MD Pathology"
                />
              </Field>
              <Field
                label="Specialization"
                required
                error={errors.specialization}
                className="dr-col-4"
              >
                <input
                  className={inputClass(errors.specialization)}
                  list="dr-specializations"
                  value={values.specialization}
                  onChange={(e) => set('specialization', e.target.value)}
                  placeholder="Pathology"
                />
                <datalist id="dr-specializations">
                  {COMMON_SPECIALIZATIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </Field>
              <Field label="Designation" className="dr-col-4">
                <input
                  className="dr-input"
                  value={values.designation}
                  onChange={(e) => set('designation', e.target.value)}
                  placeholder="Senior Consultant"
                />
              </Field>
              <Field label="Department" className="dr-col-4">
                <input
                  className="dr-input"
                  value={values.department}
                  onChange={(e) => set('department', e.target.value)}
                  placeholder="Pathology Department"
                />
              </Field>
              <Field
                label="Registration Number"
                required={!isPathologist}
                error={errors.registrationNumber}
                hint="As printed on your medical registration certificate"
                className="dr-col-4"
              >
                <input
                  className={inputClass(errors.registrationNumber)}
                  value={values.registrationNumber}
                  onChange={(e) => set('registrationNumber', e.target.value)}
                  placeholder="NMC12345"
                />
              </Field>
              <Field label="Registration Council" className="dr-col-4">
                <select
                  className="dr-select"
                  value={values.registrationCouncil}
                  onChange={(e) => set('registrationCouncil', e.target.value)}
                >
                  <option value="">Not specified</option>
                  {REGISTRATION_COUNCILS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Registration Expiry"
                error={errors.registrationExpiry}
                hint="We flag the doctor once this date has passed"
                className="dr-col-4"
              >
                <input
                  type="date"
                  className={inputClass(errors.registrationExpiry)}
                  value={values.registrationExpiry}
                  onChange={(e) => set('registrationExpiry', e.target.value)}
                />
              </Field>
              <Field label="License Number" error={errors.licenseNumber} className="dr-col-4">
                <input
                  className={inputClass(errors.licenseNumber)}
                  value={values.licenseNumber}
                  onChange={(e) => set('licenseNumber', e.target.value)}
                  placeholder="State Medical License No."
                />
              </Field>
              <Field label="License Expiry" error={errors.licenseExpiry} className="dr-col-4">
                <input
                  type="date"
                  className={inputClass(errors.licenseExpiry)}
                  value={values.licenseExpiry}
                  onChange={(e) => set('licenseExpiry', e.target.value)}
                />
              </Field>
              <Field label="Consultation Fee (₹)" error={errors.consultationFee} className="dr-col-4">
                <input
                  type="number"
                  min="0"
                  className={inputClass(errors.consultationFee)}
                  value={values.consultationFee}
                  onChange={(e) => set('consultationFee', e.target.value)}
                  placeholder="500"
                />
              </Field>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="dr-grid">
              <Field
                label="Phone"
                required
                error={errors.phone}
                hint="10-digit Indian mobile number"
                className="dr-col-3"
              >
                <div className="flex">
                  <span
                    className="dr-input inline-flex items-center px-3"
                    style={{
                      background: 'var(--surface-tertiary)',
                      width: 'auto',
                      borderRight: 'none',
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                    }}
                  >
                    +91
                  </span>
                  <input
                    inputMode="numeric"
                    maxLength={10}
                    className={inputClass(errors.phone)}
                    style={{
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    }}
                    value={values.phone}
                    onChange={(e) =>
                      set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                    placeholder="98765 43210"
                  />
                </div>
              </Field>
              <Field
                label="WhatsApp Number"
                error={errors.whatsappNumber}
                className="dr-col-3"
              >
                <input
                  inputMode="numeric"
                  maxLength={10}
                  className={inputClass(errors.whatsappNumber)}
                  value={values.whatsappNumber}
                  onChange={(e) =>
                    set(
                      'whatsappNumber',
                      e.target.value.replace(/\D/g, '').slice(0, 10)
                    )
                  }
                  placeholder="98765 43210"
                />
                <label
                  className="inline-flex items-center gap-1.5 mt-2 cursor-pointer text-xs"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <input
                    type="checkbox"
                    checked={!!values.phone && values.whatsappNumber === values.phone}
                    onChange={(e) =>
                      set('whatsappNumber', e.target.checked ? values.phone : '')
                    }
                  />
                  Same as phone
                </label>
              </Field>
              <Field
                label="Email"
                error={errors.email}
                hint="Required for email reports and portal access"
                className="dr-col-4"
              >
                <input
                  type="email"
                  className={inputClass(errors.email)}
                  value={values.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="doctor@example.com"
                />
              </Field>
              <Field label="Address Line" className="dr-col-12">
                <input
                  className="dr-input"
                  value={values.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="House / street / landmark"
                />
              </Field>
              <Field label="City (Auto-Syncs PIN & State)" className="dr-col-3">
                <input
                  list="doctor-city-datalist"
                  className="dr-input"
                  value={values.city}
                  onChange={(e) => handleDoctorCityChange(e.target.value)}
                  placeholder="Palanpur"
                />
                <datalist id="doctor-city-datalist">
                  {searchLocations(values.city || '', values.state, 10).map((loc) => (
                    <option key={`${loc.city}-${loc.defaultPincode}`} value={loc.city}>
                      {loc.city}, {loc.state} — PIN: {loc.defaultPincode}
                    </option>
                  ))}
                </datalist>
              </Field>
              <Field label="State" className="dr-col-3">
                <input
                  list="doctor-state-datalist"
                  className="dr-input"
                  value={values.state}
                  onChange={(e) => set('state', e.target.value)}
                  placeholder="Gujarat"
                />
                <datalist id="doctor-state-datalist">
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st} />
                  ))}
                </datalist>
              </Field>
              <Field label="PIN Code (Auto-Sync)" error={errors.pincode} className="dr-col-3">
                <input
                  inputMode="numeric"
                  maxLength={6}
                  className={inputClass(errors.pincode)}
                  value={values.pincode}
                  onChange={(e) => handleDoctorPincodeChange(e.target.value)}
                  placeholder="385001"
                />
              </Field>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="dr-grid">
              <Field
                label="Partner Hospital / Clinic"
                className="dr-col-6"
                hint="Assign to an organization for grouped billing and commission settlement"
              >
                <select
                  className="dr-select"
                  value={values.organizationId}
                  onChange={(e) => set('organizationId', e.target.value)}
                >
                  <option value="">Independent Doctor (No affiliation)</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.code})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Private Clinic Name" className="dr-col-6">
                <input
                  className="dr-input"
                  value={values.clinicName}
                  onChange={(e) => set('clinicName', e.target.value)}
                  placeholder="e.g. Panchal Poly Clinic"
                />
              </Field>
              <Field label="Clinic Address" className="dr-col-12">
                <textarea
                  className="dr-input"
                  rows={2}
                  value={values.clinicAddress}
                  onChange={(e) => set('clinicAddress', e.target.value)}
                  placeholder="Clinic street address and landmarks"
                />
              </Field>
              <Field label="Available Days (OPD)" className="dr-col-6">
                <input
                  className="dr-input"
                  value={values.availableDays}
                  onChange={(e) => set('availableDays', e.target.value)}
                  placeholder="e.g. Mon-Sat"
                />
              </Field>
              <Field label="Available Time (OPD)" className="dr-col-6">
                <input
                  className="dr-input"
                  value={values.availableTime}
                  onChange={(e) => set('availableTime', e.target.value)}
                  placeholder="e.g. 10:00 AM - 05:00 PM"
                />
              </Field>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Report Delivery Channels
                </h3>
                <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
                  Select which automated communication channels should be enabled for this doctor when reports are published.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-light)] bg-[var(--surface-secondary)] cursor-pointer hover:border-[var(--primary)] transition">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={values.reportDeliveryEmail}
                      onChange={(e) => set('reportDeliveryEmail', e.target.checked)}
                    />
                    <div>
                      <span className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
                        Email Reports
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        Send PDF report via email attachment upon sign-off.
                      </span>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-light)] bg-[var(--surface-secondary)] cursor-pointer hover:border-[var(--primary)] transition">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={values.reportDeliveryWhatsApp}
                      onChange={(e) => set('reportDeliveryWhatsApp', e.target.checked)}
                    />
                    <div>
                      <span className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
                        WhatsApp Notification
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        Send instant report download link on doctor WhatsApp.
                      </span>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-light)] bg-[var(--surface-secondary)] cursor-pointer hover:border-[var(--primary)] transition">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={values.reportDeliveryHardCopy}
                      onChange={(e) => set('reportDeliveryHardCopy', e.target.checked)}
                    />
                    <div>
                      <span className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
                        Physical Hard Copy Print
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        Flag lab batch for physical courier delivery.
                      </span>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-light)] bg-[var(--surface-secondary)] cursor-pointer hover:border-[var(--primary)] transition">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={values.reportDeliveryPortal}
                      onChange={(e) => set('reportDeliveryPortal', e.target.checked)}
                    />
                    <div>
                      <span className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
                        Doctor Portal Access
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        Publish to doctor self-service dashboard.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-light)]">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={values.enablePortalAccess}
                    onChange={(e) => set('enablePortalAccess', e.target.checked)}
                  />
                  Enable direct doctor login to LabCore LIMS portal
                </label>
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-5">
              {earns ? (
                <div className="p-4 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-light)] space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                    Commission Terms
                  </h4>
                  <div className="dr-grid">
                    <Field label="Commission Model" className="dr-col-4">
                      <select
                        className="dr-select"
                        value={values.commissionType}
                        onChange={(e) => set('commissionType', e.target.value as CommissionType)}
                      >
                        {(Object.keys(COMMISSION_TYPE_LABEL) as CommissionType[]).map((ct) => (
                          <option key={ct} value={ct}>
                            {COMMISSION_TYPE_LABEL[ct]}
                          </option>
                        ))}
                      </select>
                    </Field>

                    {values.commissionType === 'PERCENTAGE' ? (
                      <Field
                        label="Commission Rate (%)"
                        required
                        error={errors.commissionRate}
                        className="dr-col-4"
                      >
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className={inputClass(errors.commissionRate)}
                          value={values.commissionRate}
                          onChange={(e) => set('commissionRate', e.target.value)}
                          placeholder="15"
                        />
                      </Field>
                    ) : null}

                    {values.commissionType === 'FLAT_PER_PATIENT' ? (
                      <Field
                        label="Flat Amount (₹ per referral)"
                        required
                        error={errors.commissionFlatAmount}
                        className="dr-col-4"
                      >
                        <input
                          type="number"
                          min={0}
                          className={inputClass(errors.commissionFlatAmount)}
                          value={values.commissionFlatAmount}
                          onChange={(e) => set('commissionFlatAmount', e.target.value)}
                          placeholder="100"
                        />
                      </Field>
                    ) : null}

                    <Field label="Payout Cycle" className="dr-col-4">
                      <select
                        className="dr-select"
                        value={values.payoutCycle}
                        onChange={(e) => set('payoutCycle', e.target.value as PayoutCycle)}
                      >
                        {(Object.keys(PAYOUT_CYCLE_LABEL) as PayoutCycle[]).map((pc) => (
                          <option key={pc} value={pc}>
                            {PAYOUT_CYCLE_LABEL[pc]}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>
              ) : null}

              <div className="dr-grid">
                <Field label="PAN Number" error={errors.panNumber} className="dr-col-6">
                  <input
                    className={inputClass(errors.panNumber)}
                    value={values.panNumber}
                    maxLength={10}
                    onChange={(e) => set('panNumber', e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                  />
                </Field>
                <Field label="GSTIN" error={errors.gstin} className="dr-col-6">
                  <input
                    className={inputClass(errors.gstin)}
                    value={values.gstin}
                    maxLength={15}
                    onChange={(e) => set('gstin', e.target.value.toUpperCase())}
                    placeholder="24ABCDE1234F1Z5"
                  />
                </Field>
                <Field label="Bank Account Holder Name" className="dr-col-6">
                  <input
                    className="dr-input"
                    value={values.bankAccountHolderName}
                    onChange={(e) => set('bankAccountHolderName', e.target.value)}
                    placeholder="e.g. Dr. Nikil Panchal"
                  />
                </Field>
                <Field label="Bank Name" className="dr-col-6">
                  <input
                    className="dr-input"
                    value={values.bankName}
                    onChange={(e) => set('bankName', e.target.value)}
                    placeholder="State Bank of India / HDFC Bank"
                  />
                </Field>
                <Field label="Bank Account Number" className="dr-col-6">
                  <input
                    className="dr-input"
                    value={values.bankAccountNumber}
                    onChange={(e) => set('bankAccountNumber', e.target.value)}
                    placeholder="Account number"
                  />
                </Field>
                <Field label="Bank IFSC Code" error={errors.bankIfscCode} className="dr-col-3">
                  <input
                    className={inputClass(errors.bankIfscCode)}
                    value={values.bankIfscCode}
                    maxLength={11}
                    onChange={(e) => set('bankIfscCode', e.target.value.toUpperCase())}
                    placeholder="SBIN0001234"
                  />
                </Field>
                <Field label="UPI ID" error={errors.upiId} className="dr-col-3">
                  <input
                    className={inputClass(errors.upiId)}
                    value={values.upiId}
                    onChange={(e) => set('upiId', e.target.value)}
                    placeholder="doctor@okhdfcbank"
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {step === 6 ? (
            <div className="dr-grid">
              <FileField
                label="Digital Signature"
                accept="image/png,image/jpeg"
                value={values.signatureUrl}
                required={isPathologist}
                error={errors.signatureUrl}
                hint={
                  isPathologist
                    ? 'Mandatory for pathologists. Will be printed on verified test reports.'
                    : 'Optional signature for report authorization.'
                }
                className="dr-col-6"
                onChange={(url) => set('signatureUrl', url)}
              />
              <FileField
                label="Doctor Profile Photo"
                accept="image/png,image/jpeg"
                value={values.photoUrl}
                hint="Passport size photograph or profile picture."
                className="dr-col-6"
                onChange={(url) => set('photoUrl', url)}
              />
              <FileField
                label="Medical Council Registration Certificate"
                accept="image/png,image/jpeg,application/pdf"
                value={values.registrationCertificateUrl}
                hint="Registration certificate copy for statutory compliance."
                className="dr-col-6"
                onChange={(url) => set('registrationCertificateUrl', url)}
              />
              <FileField
                label="Cancelled Bank Cheque / Passbook"
                accept="image/png,image/jpeg,application/pdf"
                value={values.cancelledChequeUrl}
                hint="For commission payout account verification."
                className="dr-col-6"
                onChange={(url) => set('cancelledChequeUrl', url)}
              />
            </div>
          ) : null}

          {step === 7 ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-light)]">
                <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Summary Review
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="block text-[var(--text-tertiary)]">Full Name</span>
                    <span className="font-semibold">{values.title} {values.fullName}</span>
                  </div>
                  <div>
                    <span className="block text-[var(--text-tertiary)]">Role / Type</span>
                    <span className="font-semibold">{DOCTOR_TYPE_LABEL[values.doctorType]}</span>
                  </div>
                  <div>
                    <span className="block text-[var(--text-tertiary)]">Specialization</span>
                    <span className="font-semibold">{values.specialization || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[var(--text-tertiary)]">Phone</span>
                    <span className="font-semibold">{values.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[var(--text-tertiary)]">Email</span>
                    <span className="font-semibold">{values.email || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[var(--text-tertiary)]">Registration No.</span>
                    <span className="font-semibold">{values.registrationNumber || '—'}</span>
                  </div>
                  {earns ? (
                    <div>
                      <span className="block text-[var(--text-tertiary)]">Commission Plan</span>
                      <span className="font-semibold">
                        {values.commissionType === 'PERCENTAGE'
                          ? `${values.commissionRate}%`
                          : values.commissionType === 'FLAT_PER_PATIENT'
                          ? `₹${values.commissionFlatAmount} / patient`
                          : COMMISSION_TYPE_LABEL[values.commissionType]}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              <Field label="Internal Lab Notes" className="dr-col-12">
                <textarea
                  className="dr-input"
                  rows={2}
                  value={values.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Optional internal remarks or billing instructions..."
                />
              </Field>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={values.isActive}
                  onChange={(e) => set('isActive', e.target.checked)}
                />
                Active record (available for referral selection immediately)
              </label>

              {submitError ? (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-500 flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{submitError}</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* ---------- footer ---------- */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            background: 'var(--surface-secondary)',
            borderTop: '1px solid var(--border-light)',
          }}
        >
          <div>
            {!isEditing && dirty ? (
              <button
                type="button"
                onClick={clearDraft}
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--error)] transition inline-flex items-center gap-1"
              >
                <Trash2 size={12} /> Clear Draft
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={requestClose}
              disabled={submitting}
              className="dr-btn dr-btn-secondary"
            >
              Cancel
            </button>
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={submitting}
                className="dr-btn dr-btn-secondary inline-flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Previous
              </button>
            ) : null}
            {step < WIZARD_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={submitting}
                className="dr-btn dr-btn-primary inline-flex items-center gap-1"
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="dr-btn dr-btn-primary inline-flex items-center gap-1"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check size={14} />{' '}
                    {isEditing ? 'Update Doctor' : 'Complete Registration'}
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