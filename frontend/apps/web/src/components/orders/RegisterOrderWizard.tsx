'use client';

/**
 * Register New Requisition Wizard
 *
 * Designed to exactly match the "Register New Patient" wizard:
 * - Header: Off-white #f8fafc, bold title, step subtitle, close X
 * - Accent: Thin linear gradient progress bar (#0284c7 → #06b6d4)
 * - Stepper: Clean white container with bottom divider, pill chips (sky-50 active, emerald-50 done)
 * - Grid: 12-column balanced layout with uniform baselines, crisp slate-300 borders, soft shadows
 * - Fields: Uppercase bold labels (dr-label), dr-input, dr-select, dr-textarea
 * - Footer: Distinct #f8fafc footer bar with "LabCore Enterprise LIS", Cancel, Previous, and Next > / Complete buttons
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  FlaskConical,
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
  Stethoscope,
  CreditCard,
  Clock,
  CheckCircle2,
  Search,
  Plus,
  Flame,
  ShieldCheck,
  Activity,
  Printer,
  Share2,
  Receipt,
  TestTube,
  DollarSign,
  UserPlus,
} from 'lucide-react';

import { orderApi, patientApi, doctorApi, testApi, ApiError } from '@/lib/api';
import { showSuccess, showError } from '@/lib/notifications';
import { PatientQuickRegisterModal } from '@/components/orders/PatientQuickRegisterModal';

// ------------------------------------------------------------------
// Interfaces & Types
// ------------------------------------------------------------------

export interface PatientRecord {
  id: string;
  firstName: string;
  lastName: string;
  uhid: string;
  phone: string;
  gender: string;
  age?: number | string;
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
  abhaNumber?: string;
}

export interface DoctorRecord {
  id: string;
  fullName: string;
  doctorCode?: string;
  specialization?: string;
  clinicName?: string;
  phone?: string;
}

export interface TestRecord {
  id: string;
  testCode: string;
  testName: string;
  price: number;
  sampleType: string;
  sampleContainer?: string;
  tatHours?: number;
  category?: {
    name?: string;
    department?: string;
  };
}

export interface SelectedTestItem {
  testId: string;
  test: TestRecord;
  discount: number;
}

export interface RequisitionWizardValues {
  // Step 1: Patient
  patientId: string;
  patientSearchQuery: string;

  // Step 2: Doctor
  isSelfReferral: boolean;
  doctorId: string;
  referralNotes: string;

  // Step 3: Tests & Panels
  selectedTests: SelectedTestItem[];
  departmentFilter: string;

  // Step 4: Logistics & Priority
  priority: 'ROUTINE' | 'URGENT' | 'STAT';
  collectionType: 'WALK_IN' | 'HOME_COLLECTION';
  homeAddress: string;
  collectionDate: string;
  collectionTimeSlot: string;
  fastingStatus: 'NOT_REQUIRED' | 'FASTING_12H' | 'POST_PRANDIAL';
  clinicalNotes: string;

  // Step 5: Billing & TPA
  discountType: 'NONE' | 'FLAT' | 'PERCENT';
  discountValue: number;
  discountReason: string;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'TPA_INSURANCE' | 'PAY_LATER';
  paidAmount: number;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insurancePreAuthCode: string;
  paymentRemarks: string;

  // Step 6: Final Options
  printBarcodeLabelsImmediately: boolean;
  sendWhatsAppConfirmation: boolean;
  routeToAnalyzerWorklist: boolean;
}

const EMPTY_REQUISITION: RequisitionWizardValues = {
  patientId: '',
  patientSearchQuery: '',

  isSelfReferral: false,
  doctorId: '',
  referralNotes: '',

  selectedTests: [],
  departmentFilter: 'ALL',

  priority: 'ROUTINE',
  collectionType: 'WALK_IN',
  homeAddress: '',
  collectionDate: new Date().toISOString().slice(0, 10),
  collectionTimeSlot: '08:00 - 10:00 AM',
  fastingStatus: 'NOT_REQUIRED',
  clinicalNotes: '',

  discountType: 'NONE',
  discountValue: 0,
  discountReason: '',
  paymentMethod: 'CASH',
  paidAmount: 0,
  insuranceProvider: 'Ayushman Bharat (PMJAY)',
  insurancePolicyNumber: '',
  insurancePreAuthCode: '',
  paymentRemarks: '',

  printBarcodeLabelsImmediately: true,
  sendWhatsAppConfirmation: true,
  routeToAnalyzerWorklist: true,
};

export const REQUISITION_STEPS = [
  { key: 'patient', label: 'Patient' },
  { key: 'doctor', label: 'Doctor' },
  { key: 'tests', label: 'Tests & Panels' },
  { key: 'logistics', label: 'Logistics' },
  { key: 'billing', label: 'Billing' },
  { key: 'review', label: 'Review & Submit' },
] as const;

// Vacutainer Color Specification
function getTubeSpec(testName: string = '', sampleType: string = 'Blood') {
  const name = testName.toLowerCase();
  const sample = sampleType.toLowerCase();

  if (
    name.includes('cbc') ||
    name.includes('hemogram') ||
    name.includes('hba1c') ||
    name.includes('esr') ||
    name.includes('blood group') ||
    name.includes('edta')
  ) {
    return { name: 'Lavender EDTA', color: '#8b5cf6', dotClass: 'bg-purple-600' };
  }
  if (name.includes('glucose') || name.includes('sugar') || name.includes('fbs') || name.includes('fluoride')) {
    return { name: 'Grey Fluoride', color: '#64748b', dotClass: 'bg-slate-400' };
  }
  if (name.includes('pt-inr') || name.includes('coagulation') || name.includes('citrate')) {
    return { name: 'Blue Citrate', color: '#0284c7', dotClass: 'bg-sky-500' };
  }
  if (sample.includes('urine') || name.includes('urine')) {
    return { name: 'Sterile Urine Cup', color: '#eab308', dotClass: 'bg-amber-500' };
  }
  return { name: 'Gold SST / Serum', color: '#f59e0b', dotClass: 'bg-amber-600' };
}

// ------------------------------------------------------------------
// Field & Input Helper Components (Matches RegisterPatientWizard)
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
// Main Wizard Modal Component
// ------------------------------------------------------------------

export interface RegisterOrderWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdOrder?: any) => void;
  preselectedPatientId?: string;
}

const ORDER_DRAFT_KEY = 'labcore.order.draft.v1';

export default function RegisterOrderWizard({
  isOpen,
  onClose,
  onSuccess,
  preselectedPatientId,
}: RegisterOrderWizardProps) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<RequisitionWizardValues>(EMPTY_REQUISITION);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Catalog Data
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [tests, setTests] = useState<TestRecord[]>([]);

  // Modals
  const [showQuickPatientModal, setShowQuickPatientModal] = useState(false);
  const [testSearch, setTestSearch] = useState('');

  // Fetch catalog on modal open
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const fetchCatalog = async () => {
      try {
        setLoadingCatalog(true);
        const [patientsRes, doctorsRes, testsRes] = await Promise.all([
          patientApi.getAll().catch(() => ({ data: [] })),
          doctorApi.getAll().catch(() => ({ data: [] })),
          testApi.getAll().catch(() => ({ data: [] })),
        ]);

        if (mounted) {
          const ptList = patientsRes?.data?.patients || patientsRes?.data || [];
          setPatients(Array.isArray(ptList) ? ptList : []);

          const docList = doctorsRes?.data?.doctors || doctorsRes?.data || [];
          setDoctors(Array.isArray(docList) ? docList : []);

          const tstList = testsRes?.data?.tests || testsRes?.data || [];
          setTests(Array.isArray(tstList) ? tstList : []);

          if (preselectedPatientId) {
            setValues((v) => ({ ...v, patientId: preselectedPatientId }));
          }
        }
      } catch (err) {
        console.error('Failed to load requisition catalog:', err);
      } finally {
        if (mounted) setLoadingCatalog(false);
      }
    };

    fetchCatalog();
    return () => {
      mounted = false;
    };
  }, [isOpen, preselectedPatientId]);

  // Selected Patient Object
  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === values.patientId) || null;
  }, [patients, values.patientId]);

  // Selected Doctor Object
  const selectedDoctor = useMemo(() => {
    return doctors.find((d) => d.id === values.doctorId) || null;
  }, [doctors, values.doctorId]);

  // Filtered Patients for Step 1 search
  const filteredPatients = useMemo(() => {
    const q = values.patientSearchQuery.toLowerCase().trim();
    if (!q) return patients.slice(0, 8);
    return patients.filter(
      (p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        (p.uhid || '').toLowerCase().includes(q) ||
        (p.phone || '').includes(q)
    );
  }, [patients, values.patientSearchQuery]);

  // Filtered Tests for Step 3
  const filteredTests = useMemo(() => {
    const q = testSearch.toLowerCase().trim();
    return tests.filter((t) => {
      const matchSearch = !q || t.testName.toLowerCase().includes(q) || t.testCode.toLowerCase().includes(q);
      const dept = t.category?.department || t.category?.name || '';
      const matchDept = values.departmentFilter === 'ALL' || dept.toLowerCase() === values.departmentFilter.toLowerCase();
      return matchSearch && matchDept;
    });
  }, [tests, testSearch, values.departmentFilter]);

  // Test Departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    tests.forEach((t) => {
      const dept = t.category?.department || t.category?.name;
      if (dept) set.add(dept);
    });
    return ['ALL', ...Array.from(set)];
  }, [tests]);

  // Billing Calculation
  const billingSummary = useMemo(() => {
    const subtotal = values.selectedTests.reduce((sum, item) => sum + (Number(item.test.price) || 0), 0);
    let calculatedDiscount = 0;
    if (values.discountType === 'PERCENT') {
      calculatedDiscount = (subtotal * Math.min(100, Math.max(0, values.discountValue))) / 100;
    } else if (values.discountType === 'FLAT') {
      calculatedDiscount = Math.min(subtotal, Math.max(0, values.discountValue));
    }
    const taxableAmount = Math.max(0, subtotal - calculatedDiscount);
    const grandTotal = taxableAmount; // Pathology tests: GST-exempt (SAC 999316)
    const dueAmount = Math.max(0, grandTotal - values.paidAmount);

    return { subtotal, calculatedDiscount, taxableAmount, grandTotal, dueAmount };
  }, [values.selectedTests, values.discountType, values.discountValue, values.paidAmount]);

  // Auto-set full amount when payment method changes
  const handlePaymentMethodChange = (method: RequisitionWizardValues['paymentMethod']) => {
    setValues((prev) => {
      const nextPaid =
        method === 'PAY_LATER'
          ? 0
          : method === 'TPA_INSURANCE'
          ? billingSummary.grandTotal
          : prev.paidAmount === 0
          ? billingSummary.grandTotal
          : prev.paidAmount;

      return {
        ...prev,
        paymentMethod: method,
        paidAmount: nextPaid,
      };
    });
    setDirty(true);
  };

  // Toggle Test in Requisition
  const handleToggleTest = (test: TestRecord) => {
    setValues((prev) => {
      const exists = prev.selectedTests.some((item) => item.testId === test.id);
      let updated;
      if (exists) {
        updated = prev.selectedTests.filter((item) => item.testId !== test.id);
      } else {
        updated = [...prev.selectedTests, { testId: test.id, test, discount: 0 }];
      }
      return { ...prev, selectedTests: updated };
    });
    setDirty(true);
  };

  // 1-Click Clinical Disease Profile Loader
  const handleLoadProfile = (profileName: string, keywords: string[]) => {
    let added = 0;
    const itemsToAdd: SelectedTestItem[] = [];

    keywords.forEach((kw) => {
      const match = tests.find(
        (t) => t.testName.toLowerCase().includes(kw.toLowerCase()) || t.testCode.toLowerCase().includes(kw.toLowerCase())
      );
      if (match && !values.selectedTests.some((s) => s.testId === match.id) && !itemsToAdd.some((s) => s.testId === match.id)) {
        itemsToAdd.push({ testId: match.id, test: match, discount: 0 });
        added++;
      }
    });

    if (added > 0) {
      setValues((prev) => ({
        ...prev,
        selectedTests: [...prev.selectedTests, ...itemsToAdd],
      }));
      showSuccess(`Loaded ${added} tests from ${profileName}`);
      setDirty(true);
    } else {
      showSuccess(`${profileName} tests already selected`);
    }
  };

  // Step Validation
  const validateCurrentStep = (stepIdx: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepIdx === 0) {
      if (!values.patientId) {
        newErrors.patientId = 'Please select a registered patient or create a new patient record';
      }
    } else if (stepIdx === 1) {
      if (!values.isSelfReferral && !values.doctorId) {
        newErrors.doctorId = 'Please select a referring doctor or toggle Self / Walk-in Registration';
      }
    } else if (stepIdx === 2) {
      if (values.selectedTests.length === 0) {
        newErrors.selectedTests = 'Please prescribe at least one laboratory test or profile';
      }
    } else if (stepIdx === 3) {
      if (values.collectionType === 'HOME_COLLECTION' && !values.homeAddress.trim()) {
        newErrors.homeAddress = 'Home collection street address is required';
      }
    } else if (stepIdx === 4) {
      if (values.discountValue > 0 && !values.discountReason.trim()) {
        newErrors.discountReason = 'Audit compliance requires a reason/approval note for discounts';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (validateCurrentStep(step)) {
      setStep((s) => Math.min(REQUISITION_STEPS.length - 1, s + 1));
    }
  };

  const submitRequisition = async () => {
    if (!validateCurrentStep(step)) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const orderPayload = {
        patientId: values.patientId,
        doctorId: values.isSelfReferral ? undefined : values.doctorId || undefined,
        orderStatus: 'REGISTERED',
        priority: values.priority,
        collectionType: values.collectionType,
        homeCollectionAddress: values.collectionType === 'HOME_COLLECTION' ? values.homeAddress : undefined,
        notes: [
          values.clinicalNotes,
          values.fastingStatus !== 'NOT_REQUIRED' ? `Fasting: ${values.fastingStatus}` : '',
          values.discountReason ? `Discount note: ${values.discountReason}` : '',
          values.paymentMethod === 'TPA_INSURANCE'
            ? `TPA/Insurance: ${values.insuranceProvider} | Policy: ${values.insurancePolicyNumber || 'N/A'} | PreAuth: ${values.insurancePreAuthCode || 'N/A'}`
            : '',
        ]
          .filter(Boolean)
          .join(' | '),
        discount: billingSummary.calculatedDiscount,
        discountCode: values.discountReason || undefined,
        paidAmount: values.paidAmount,
        paymentMethod: values.paymentMethod,
        paymentNotes:
          values.paymentMethod === 'TPA_INSURANCE'
            ? `Cashless TPA / PMJAY: ${values.insuranceProvider} (Card: ${values.insurancePolicyNumber})`
            : `Advance settlement via ${values.paymentMethod}`,
        items: values.selectedTests.map((item) => ({
          testId: item.testId,
          discount: item.discount || 0,
        })),
      };

      const response = await orderApi.create(orderPayload);
      const created = response?.data?.order || response?.data || response;

      showSuccess(`Order #${created?.orderNumber || 'New'} created successfully!`);
      
      try {
        localStorage.removeItem(ORDER_DRAFT_KEY);
      } catch {
        // ignore
      }

      onSuccess?.(created);
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Failed to create requisition';
      setSubmitError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const progress = ((step + 1) / REQUISITION_STEPS.length) * 100;

  return (
    <>
      <div className="dr-overlay" role="dialog" aria-modal="true" aria-label="Register New Requisition">
        <div className="dr-panel dr-panel-wide" style={{ maxWidth: '980px' }}>
          {/* ---------- Header (Off-white #f8fafc) ---------- */}
          <div className="flex items-center justify-between gap-4 px-7 py-4 bg-[#f8fafc] border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
                  Register New Requisition
                </h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  CPOE • NABL ISO 15189
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                <span>
                  Step {step + 1} of {REQUISITION_STEPS.length} · {REQUISITION_STEPS[step]!.label}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">Inpatient, OPD & Reference Diagnostics</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* ---------- Progress Bar (Linear Sky to Cyan Gradient) ---------- */}
          <div
            className="h-1 bg-slate-100"
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={REQUISITION_STEPS.length}
          >
            <div
              className="h-1 transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #0284c7, #06b6d4)',
              }}
            />
          </div>

          {/* ---------- Horizontal Stepper Chips (Exact RegisterPatient Style) ---------- */}
          <div
            className="flex items-center gap-1.5 overflow-x-auto px-6 py-2.5 bg-white border-b border-slate-200/80"
            style={{ scrollbarWidth: 'none' }}
          >
            {REQUISITION_STEPS.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  if (i <= step || validateCurrentStep(step)) setStep(i);
                }}
                aria-current={i === step ? 'step' : undefined}
                className={`dr-step${i === step ? ' dr-step-active' : ''}${i < step ? ' dr-step-done' : ''}`}
              >
                <span className="dr-step-dot">
                  {i < step ? <Check size={11} aria-hidden strokeWidth={2.5} /> : i + 1}
                </span>
                <span className="hidden sm:inline font-semibold text-[11px]">{s.label}</span>
              </button>
            ))}
          </div>

          {/* ---------- Step Body (Crisp Pure White Content) ---------- */}
          <div className="px-7 py-6 overflow-y-auto bg-white" style={{ maxHeight: 'min(66vh, 640px)' }}>
            {/* ========================================================= */}
            {/* STEP 0: PATIENT SELECTION */}
            {/* ========================================================= */}
            {step === 0 && (
              <div className="space-y-5">
                <div className="dr-grid">
                  <Field
                    label="SEARCH REGISTERED PATIENT (NAME, UHID, PHONE)"
                    required
                    error={errors.patientId}
                    className="dr-col-9"
                  >
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={values.patientSearchQuery}
                        onChange={(e) => setValues((v) => ({ ...v, patientSearchQuery: e.target.value }))}
                        placeholder="Search by UHID (e.g. UHID-8921), Name (e.g. Ramesh), or 10-digit Phone..."
                        className="dr-input pl-9"
                        autoFocus
                      />
                    </div>
                  </Field>

                  <div className="dr-col-3 flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={() => setShowQuickPatientModal(true)}
                      className="dr-btn dr-btn-secondary w-full flex items-center justify-center gap-1.5 font-bold text-sky-700 border-sky-300 hover:bg-sky-50"
                    >
                      <UserPlus size={14} className="text-sky-600" />
                      <span>+ Quick New Patient</span>
                    </button>
                  </div>
                </div>

                {/* Patient Search Results Grid */}
                <div>
                  <label className="dr-label">SELECT PATIENT FOR REQUISITION</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {filteredPatients.map((p) => {
                      const isSelected = p.id === values.patientId;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setValues((v) => ({ ...v, patientId: p.id }));
                            setDirty(true);
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">
                              {p.firstName} {p.lastName}
                            </span>
                            <span className="font-mono text-[10px] font-bold bg-white text-sky-700 px-1.5 py-0.5 rounded border border-slate-200">
                              {p.uhid}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                            <span>{p.gender}</span>
                            <span>•</span>
                            <span>{p.age ? `${p.age} Yrs` : 'Age N/A'}</span>
                            <span>•</span>
                            <span>Phone: {p.phone || 'N/A'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Patient Confirmed Dossier Card */}
                {selectedPatient && (
                  <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        {selectedPatient.firstName[0]}
                        {selectedPatient.lastName[0] || ''}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900">
                            {selectedPatient.firstName} {selectedPatient.lastName}
                          </p>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                            Verified Patient
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                          UHID: {selectedPatient.uhid} • Phone: {selectedPatient.phone} • {selectedPatient.gender}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-600">
                      <span>Blood Group: </span>
                      <strong className="text-slate-900">{selectedPatient.bloodGroup || 'Not Tested'}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 1: REFERRING DOCTOR */}
            {/* ========================================================= */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="dr-grid">
                  <Field label="REFERRAL TYPE" className="dr-col-12">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setValues((v) => ({ ...v, isSelfReferral: false }))}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          !values.isSelfReferral
                            ? 'border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-bold block">Consultant Doctor Referral</span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          Prescribed by hospital clinician or external specialist
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setValues((v) => ({ ...v, isSelfReferral: true, doctorId: '' }))}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          values.isSelfReferral
                            ? 'border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-bold block">Direct Self / Walk-in Registration</span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          Patient self-requested tests without external requisition slip
                        </span>
                      </button>
                    </div>
                  </Field>

                  {!values.isSelfReferral && (
                    <>
                      <Field
                        label="SELECT REFERRING DOCTOR *"
                        required
                        error={errors.doctorId}
                        className="dr-col-8"
                      >
                        <select
                          className="dr-select font-medium"
                          value={values.doctorId}
                          onChange={(e) => {
                            setValues((v) => ({ ...v, doctorId: e.target.value }));
                            setDirty(true);
                          }}
                        >
                          <option value="">-- Select Consulting Doctor --</option>
                          {doctors.map((d) => (
                            <option key={d.id} value={d.id}>
                              Dr. {d.fullName} ({d.specialization || 'General'} - {d.clinicName || 'Central OPD'})
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="DOCTOR CODE / ACCREDITATION" className="dr-col-4">
                        <input
                          type="text"
                          readOnly
                          value={selectedDoctor?.doctorCode || 'DOC-AUTO'}
                          className="dr-input bg-slate-50 font-mono"
                        />
                      </Field>

                      {selectedDoctor && (
                        <div className="dr-col-12 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <span className="font-bold text-slate-800">Selected Clinician: </span>
                          <span className="text-slate-700">
                            Dr. {selectedDoctor.fullName} • {selectedDoctor.specialization} • Phone: {selectedDoctor.phone || 'N/A'}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  <Field label="CLINICAL DIAGNOSIS & REQUISITION NOTES (OPTIONAL)" className="dr-col-12">
                    <input
                      type="text"
                      className="dr-input"
                      value={values.referralNotes}
                      onChange={(e) => setValues((v) => ({ ...v, referralNotes: e.target.value }))}
                      placeholder="e.g. Follow-up diabetic review, suspected thrombocytopenia, pre-operative fitness clearance"
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 2: TESTS & PANELS */}
            {/* ========================================================= */}
            {step === 2 && (
              <div className="space-y-5">
                {/* 1-Click Clinical Disease Profiles Banner */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="dr-label flex items-center gap-1.5">
                      <Sparkles size={13} className="text-sky-600" />
                      1-CLICK CLINICAL DISEASE PROFILES (QUICK-PACKS)
                    </label>
                    <span className="text-[10px] text-slate-400">Pre-configured NABL Panels</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoadProfile('Cardiac Emergency', ['troponin', 'cpk', 'lipid', 'electrolytes'])}
                      className="p-2 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-left transition"
                    >
                      <span className="text-xs font-bold text-rose-900 block truncate">Cardiac STAT</span>
                      <span className="text-[10px] text-rose-700">Trop-I, CPK, Lipid</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLoadProfile('Diabetic Comprehensive', ['glucose', 'hba1c', 'microalbumin', 'lipid'])}
                      className="p-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-left transition"
                    >
                      <span className="text-xs font-bold text-blue-900 block truncate">Diabetic Care</span>
                      <span className="text-[10px] text-blue-700">HbA1c, FBS, PPBS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLoadProfile('Acute Fever / Dengue', ['cbc', 'dengue', 'malarial', 'widal'])}
                      className="p-2 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-left transition"
                    >
                      <span className="text-xs font-bold text-amber-900 block truncate">Fever / Dengue</span>
                      <span className="text-[10px] text-amber-700">CBC, NS1, Smear</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLoadProfile('Pre-Operative Clearance', ['coagulation', 'pt-inr', 'cbc', 'blood group'])}
                      className="p-2 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-left transition"
                    >
                      <span className="text-xs font-bold text-purple-900 block truncate">Pre-Op Fitness</span>
                      <span className="text-[10px] text-purple-700">PT/INR, CBC, Blood</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLoadProfile('Master Health Checkup', ['lft', 'kft', 'cbc', 'lipid', 'thyroid'])}
                      className="p-2 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100 text-left transition"
                    >
                      <span className="text-xs font-bold text-teal-900 block truncate">Master Health</span>
                      <span className="text-[10px] text-teal-700">LFT, KFT, Lipids</span>
                    </button>
                  </div>
                </div>

                {/* Test Search & Department Filters */}
                <div className="dr-grid">
                  <Field label="SEARCH ASSAYS BY NAME OR CODE" className="dr-col-7">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={testSearch}
                        onChange={(e) => setTestSearch(e.target.value)}
                        placeholder="Search tests (e.g. CBC, Troponin, LFT, Creatinine)..."
                        className="dr-input pl-9"
                      />
                    </div>
                  </Field>

                  <Field label="LABORATORY DEPARTMENT" className="dr-col-5">
                    <select
                      className="dr-select font-medium"
                      value={values.departmentFilter}
                      onChange={(e) => setValues((v) => ({ ...v, departmentFilter: e.target.value }))}
                    >
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d === 'ALL' ? 'All Laboratory Departments' : d}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* Available Tests Catalog List */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="dr-label">TEST CATALOG ({filteredTests.length} ASSAYS FOUND)</label>
                    {errors.selectedTests && <p className="dr-error-text text-xs">{errors.selectedTests}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                    {filteredTests.slice(0, 24).map((t) => {
                      const isSelected = values.selectedTests.some((s) => s.testId === t.id);
                      const tube = getTubeSpec(t.testName, t.sampleType);
                      return (
                        <div
                          key={t.id}
                          onClick={() => handleToggleTest(t)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50/70 ring-1 ring-sky-500'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${tube.dotClass}`} />
                              <h5 className="font-bold text-xs text-slate-900 truncate">{t.testName}</h5>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                              {t.testCode} • {tube.name}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-xs text-slate-900">₹{t.price}</span>
                            <span className={`block text-[10px] font-bold ${isSelected ? 'text-sky-700' : 'text-slate-400'}`}>
                              {isSelected ? '✓ Added' : '+ Add'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Prescribed Summary Box */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-bold text-slate-700">Prescribed: </span>
                    <strong className="text-sky-700">{values.selectedTests.length} Assays</strong>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span className="text-slate-600">Total Price: ₹{billingSummary.subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {values.selectedTests.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setValues((v) => ({ ...v, selectedTests: [] }))}
                      className="text-[11px] text-rose-600 hover:underline font-semibold"
                    >
                      Clear All Tests
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 3: LOGISTICS & PRIORITY */}
            {/* ========================================================= */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="dr-grid">
                  {/* Requisition Priority Selection */}
                  <Field label="REQUISITION PRIORITY *" required className="dr-col-12">
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setValues((v) => ({ ...v, priority: 'ROUTINE' }))}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          values.priority === 'ROUTINE'
                            ? 'border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-bold block">Routine Standard</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Standard SLA queue (24-48h)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setValues((v) => ({ ...v, priority: 'URGENT' }))}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          values.priority === 'URGENT'
                            ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-bold text-amber-900 block">Urgent Priority</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Expedited reporting within 4-6h</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setValues((v) => ({ ...v, priority: 'STAT' }))}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          values.priority === 'STAT'
                            ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-bold text-rose-900 flex items-center gap-1">
                          <Flame size={12} className="fill-rose-600 text-rose-600" /> STAT Emergency
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Critical trauma / ICU &lt; 1h SLA</span>
                      </button>
                    </div>
                  </Field>

                  {/* Specimen Collection Venue */}
                  <Field label="COLLECTION VENUE *" required className="dr-col-6">
                    <select
                      className="dr-select font-medium"
                      value={values.collectionType}
                      onChange={(e) => setValues((v) => ({ ...v, collectionType: e.target.value as any }))}
                    >
                      <option value="WALK_IN">Lab Center Phlebotomy (Walk-in Desk)</option>
                      <option value="HOME_COLLECTION">Home Collection Visit (Phlebotomist Visit)</option>
                    </select>
                  </Field>

                  {/* Fasting Status */}
                  <Field label="FASTING PROTOCOL STATUS" className="dr-col-6">
                    <select
                      className="dr-select font-medium"
                      value={values.fastingStatus}
                      onChange={(e) => setValues((v) => ({ ...v, fastingStatus: e.target.value as any }))}
                    >
                      <option value="NOT_REQUIRED">Fasting Not Required</option>
                      <option value="FASTING_12H">Overnight Fasting (10-12 Hours)</option>
                      <option value="POST_PRANDIAL">Post-Prandial (2 Hours Post Meal)</option>
                    </select>
                  </Field>

                  {/* Home Collection Address if applicable */}
                  {values.collectionType === 'HOME_COLLECTION' && (
                    <>
                      <Field
                        label="HOME COLLECTION ADDRESS *"
                        required
                        error={errors.homeAddress}
                        className="dr-col-12"
                      >
                        <input
                          type="text"
                          className="dr-input"
                          value={values.homeAddress}
                          onChange={(e) => setValues((v) => ({ ...v, homeAddress: e.target.value }))}
                          placeholder="Complete residential address, flat #, building, landmark..."
                        />
                      </Field>

                      <Field label="SCHEDULED VISIT DATE" className="dr-col-6">
                        <input
                          type="date"
                          className="dr-input"
                          value={values.collectionDate}
                          onChange={(e) => setValues((v) => ({ ...v, collectionDate: e.target.value }))}
                        />
                      </Field>

                      <Field label="PREFERRED TIME WINDOW" className="dr-col-6">
                        <select
                          className="dr-select font-medium"
                          value={values.collectionTimeSlot}
                          onChange={(e) => setValues((v) => ({ ...v, collectionTimeSlot: e.target.value }))}
                        >
                          <option value="07:00 - 09:00 AM">Early Morning (07:00 - 09:00 AM)</option>
                          <option value="09:00 - 11:00 AM">Morning (09:00 - 11:00 AM)</option>
                          <option value="11:00 AM - 01:00 PM">Noon (11:00 AM - 01:00 PM)</option>
                          <option value="04:00 - 06:00 PM">Evening (04:00 - 06:00 PM)</option>
                        </select>
                      </Field>
                    </>
                  )}

                  <Field label="SPECIAL SAMPLING & CLINICAL NOTES" className="dr-col-12">
                    <input
                      type="text"
                      className="dr-input"
                      value={values.clinicalNotes}
                      onChange={(e) => setValues((v) => ({ ...v, clinicalNotes: e.target.value }))}
                      placeholder="e.g. Difficult vein, pediatric collection, sample transport on dry ice"
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 4: BILLING & TPA */}
            {/* ========================================================= */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="dr-grid">
                  {/* Payment Method Selector */}
                  <Field label="PAYMENT SETTLEMENT MODE *" required className="dr-col-12">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { id: 'CASH', label: 'Cash' },
                        { id: 'UPI', label: 'UPI / QR' },
                        { id: 'CARD', label: 'Card / POS' },
                        { id: 'TPA_INSURANCE', label: 'TPA / Insurance' },
                        { id: 'PAY_LATER', label: 'Credit Later' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handlePaymentMethodChange(m.id as any)}
                          className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all text-center ${
                            values.paymentMethod === m.id
                              ? 'border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {/* TPA Insurance Fields */}
                  {values.paymentMethod === 'TPA_INSURANCE' && (
                    <div className="dr-col-12 p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-sky-900 flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-sky-600" />
                          TPA & Ayushman Bharat PMJAY Cashless Claim Details
                        </span>
                        <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded border border-sky-300">
                          Pre-Auth Desk
                        </span>
                      </div>

                      <div className="dr-grid">
                        <Field label="INSURANCE SCHEME / TPA PROVIDER" className="dr-col-4">
                          <select
                            className="dr-select font-medium"
                            value={values.insuranceProvider}
                            onChange={(e) => setValues((v) => ({ ...v, insuranceProvider: e.target.value }))}
                          >
                            <option value="Ayushman Bharat (PMJAY)">Ayushman Bharat (PMJAY)</option>
                            <option value="Star Health & Allied Insurance">Star Health & Allied Insurance</option>
                            <option value="HDFC ERGO Health">HDFC ERGO Health</option>
                            <option value="CGHS Central Govt Scheme">CGHS Central Govt Scheme</option>
                            <option value="ECHS Ex-Servicemen Scheme">ECHS Ex-Servicemen Scheme</option>
                            <option value="Care Health Insurance">Care Health Insurance</option>
                            <option value="Niva Bupa Health Insurance">Niva Bupa Health Insurance</option>
                            <option value="Medi Assist TPA">Medi Assist TPA</option>
                            <option value="Other Corporate TPA">Other Corporate / TPA Desk</option>
                          </select>
                        </Field>

                        <Field label="POLICY / CARD / ABHA ID" className="dr-col-4">
                          <input
                            type="text"
                            className="dr-input"
                            value={values.insurancePolicyNumber}
                            onChange={(e) => setValues((v) => ({ ...v, insurancePolicyNumber: e.target.value }))}
                            placeholder="e.g. POL-882194 / ABHA-91"
                          />
                        </Field>

                        <Field label="PRE-AUTH / APPROVAL REFERENCE #" className="dr-col-4">
                          <input
                            type="text"
                            className="dr-input"
                            value={values.insurancePreAuthCode}
                            onChange={(e) => setValues((v) => ({ ...v, insurancePreAuthCode: e.target.value }))}
                            placeholder="e.g. AUTH-2026-9912"
                          />
                        </Field>
                      </div>
                    </div>
                  )}

                  {/* Concession / Discount Section */}
                  <Field label="CONCESSION / DISCOUNT TYPE" className="dr-col-4">
                    <select
                      className="dr-select font-medium"
                      value={values.discountType}
                      onChange={(e) => setValues((v) => ({ ...v, discountType: e.target.value as any }))}
                    >
                      <option value="NONE">No Discount (Standard Rate)</option>
                      <option value="FLAT">Flat Amount Discount (₹)</option>
                      <option value="PERCENT">Percentage Concession (%)</option>
                    </select>
                  </Field>

                  {values.discountType !== 'NONE' && (
                    <>
                      <Field
                        label={values.discountType === 'PERCENT' ? 'DISCOUNT PERCENT (%)' : 'DISCOUNT AMOUNT (₹)'}
                        className="dr-col-3"
                      >
                        <input
                          type="number"
                          min={0}
                          className="dr-input font-bold"
                          value={values.discountValue || ''}
                          onChange={(e) => setValues((v) => ({ ...v, discountValue: Number(e.target.value) }))}
                          placeholder="e.g. 10"
                        />
                      </Field>

                      <Field
                        label="DISCOUNT APPROVAL REASON *"
                        required
                        error={errors.discountReason}
                        className="dr-col-5"
                      >
                        <input
                          type="text"
                          className="dr-input"
                          value={values.discountReason}
                          onChange={(e) => setValues((v) => ({ ...v, discountReason: e.target.value }))}
                          placeholder="e.g. Senior Citizen, Staff family, Doctor courtesy"
                        />
                      </Field>
                    </>
                  )}

                  {/* Settlement Amount Paid */}
                  {values.paymentMethod !== 'PAY_LATER' && (
                    <Field label="AMOUNT COLLECTED / PAID NOW (₹)" className="dr-col-6">
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min={0}
                          max={billingSummary.grandTotal}
                          className="dr-input font-black text-sm"
                          value={values.paidAmount || ''}
                          onChange={(e) => setValues((v) => ({ ...v, paidAmount: Number(e.target.value) }))}
                        />
                        <button
                          type="button"
                          onClick={() => setValues((v) => ({ ...v, paidAmount: billingSummary.grandTotal }))}
                          className="px-3 py-2 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 shrink-0"
                        >
                          Full (₹{billingSummary.grandTotal})
                        </button>
                      </div>
                    </Field>
                  )}
                </div>

                {/* Ledger Financial Summary Card (Light White Surgical Style) */}
                <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Subtotal ({values.selectedTests.length} Assays):</span>
                    <span className="font-mono text-slate-900 font-bold">₹{billingSummary.subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {billingSummary.calculatedDiscount > 0 && (
                    <div className="flex justify-between text-amber-700 font-semibold bg-amber-50 px-2 py-1 rounded border border-amber-200">
                      <span>Discount Concession:</span>
                      <span className="font-mono">-₹{billingSummary.calculatedDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>GST Status:</span>
                    <span className="font-mono text-emerald-700 font-bold">Exempt (SAC 999316)</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-bold text-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-lg font-black text-sky-700 font-mono">
                      ₹{billingSummary.grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1 text-xs">
                    <span className="text-emerald-700 font-bold">Paid Now: ₹{values.paidAmount}</span>
                    <span className="text-rose-600 font-bold">Balance Due: ₹{billingSummary.dueAmount}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 5: REVIEW & CONFIRM */}
            {/* ========================================================= */}
            {step === 5 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  {/* Patient Dossier */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-[#f8fafc] space-y-2">
                    <span className="dr-label text-slate-400">PATIENT DOSSIER</span>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {selectedPatient?.firstName} {selectedPatient?.lastName}
                      </p>
                      <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                        UHID: {selectedPatient?.uhid} • Phone: {selectedPatient?.phone}
                      </p>
                    </div>
                  </div>

                  {/* Clinician & Priority */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-[#f8fafc] space-y-2">
                    <span className="dr-label text-slate-400">CLINICIAN & PRIORITY</span>
                    <div>
                      <p className="font-bold text-slate-900">
                        {values.isSelfReferral ? 'Self / Walk-in' : `Dr. ${selectedDoctor?.fullName || 'Assigned'}`}
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Priority: <strong className="text-slate-800">{values.priority}</strong> • Venue: {values.collectionType}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Prescribed Assays List */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="dr-label text-slate-500">
                      PRESCRIBED ASSAYS ({values.selectedTests.length})
                    </span>
                    <span className="font-mono font-bold text-xs text-sky-700">
                      Total: ₹{billingSummary.grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto pr-1">
                    {values.selectedTests.map((item) => {
                      const tube = getTubeSpec(item.test.testName, item.test.sampleType);
                      return (
                        <div key={item.testId} className="py-1.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${tube.dotClass}`} />
                            <span className="font-bold text-slate-800">{item.test.testName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({tube.name})</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">₹{item.test.price}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Automation & Dispatch Options */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={values.printBarcodeLabelsImmediately}
                      onChange={(e) => setValues((v) => ({ ...v, printBarcodeLabelsImmediately: e.target.checked }))}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Automatically generate and launch thermal cryo-vial barcode labels</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={values.routeToAnalyzerWorklist}
                      onChange={(e) => setValues((v) => ({ ...v, routeToAnalyzerWorklist: e.target.checked }))}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Route test requisition packet to analyzer bidirectional worklist (ASTM/HL7)</span>
                  </label>
                </div>

                {submitError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600 flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span>{submitError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ---------- Footer Bar (Light Slate-50) ---------- */}
          <div className="flex items-center justify-between px-7 py-4 bg-[#f8fafc] border-t border-slate-200">
            <div>
              <span className="text-[11px] text-slate-400 font-medium">LabCore Enterprise LIS</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
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
              {step < REQUISITION_STEPS.length - 1 ? (
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
                  onClick={submitRequisition}
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0284c7] hover:bg-[#0369a1] rounded-lg shadow-xs transition inline-flex items-center gap-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Complete Requisition
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Patient Registration Modal (If new patient walk-in) */}
      <PatientQuickRegisterModal
        isOpen={showQuickPatientModal}
        onClose={() => setShowQuickPatientModal(false)}
        onPatientCreated={(newPt: any) => {
          setPatients((prev) => [newPt, ...prev]);
          setValues((v) => ({ ...v, patientId: newPt.id }));
          setShowQuickPatientModal(false);
          showSuccess(`Registered ${newPt.firstName} ${newPt.lastName} and selected for order`);
        }}
      />
    </>
  );
}
