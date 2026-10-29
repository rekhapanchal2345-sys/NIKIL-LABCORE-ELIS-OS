'use client';

import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Search,
  Check,
  Printer,
  Stethoscope,
  FlaskConical,
  HeartPulse,
  Building2,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { QueueToken, QueueStage, QueuePriority } from './OpdLiveQueue';

interface QuickTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenCreated: (token: QueueToken) => void;
  existingPatients?: any[];
}

const COMMON_TESTS_WITH_META = [
  { name: 'Complete Blood Count (CBC)', code: 'HEM-CBC01', tube: 'Lavender EDTA', fee: 450, color: '#7C3AED' },
  { name: 'Comprehensive Lipid Profile', code: 'BIO-LIP04', tube: 'Gold SST Gel', fee: 850, color: '#D97706' },
  { name: 'HbA1c Glycated Hemoglobin', code: 'BIO-HBA1C', tube: 'Lavender EDTA', fee: 650, color: '#7C3AED' },
  { name: 'Thyroid Profile Total (T3, T4, TSH)', code: 'IMM-THY03', tube: 'Gold SST Gel', fee: 750, color: '#D97706' },
  { name: 'Liver Function Test (LFT)', code: 'BIO-LFT09', tube: 'Gold SST Gel', fee: 900, color: '#D97706' },
  { name: 'Kidney Function Test (KFT)', code: 'BIO-RFT08', tube: 'Gold SST Gel', fee: 950, color: '#D97706' },
  { name: 'Fasting Blood Sugar (FBS)', code: 'BIO-FBS01', tube: 'Grey Fluoride', fee: 180, color: '#475569' },
  { name: 'Post Prandial Blood Sugar (PPBS)', code: 'BIO-PPB02', tube: 'Grey Fluoride', fee: 180, color: '#475569' },
  { name: 'Urine Routine & Microscopic', code: 'CLP-URM01', tube: 'Sterile Container', fee: 250, color: '#0284C7' },
  { name: 'Troponin I (STAT Cardiac)', code: 'CRD-TRPI1', tube: 'Green Heparin', fee: 1450, color: '#059669' },
  { name: 'Vitamin D (25-OH) & Vitamin B12', code: 'IMM-VIT02', tube: 'Gold SST Gel', fee: 1800, color: '#D97706' },
  { name: 'Coagulation Profile (PT/INR & aPTT)', code: 'COA-PT01', tube: 'Blue Citrate', fee: 800, color: '#0EA5E9' },
];

const STATION_OPTIONS: Array<{
  stage: QueueStage;
  counterName: string;
  doctorName?: string;
  department: string;
}> = [
  {
    stage: 'WAITING_VITALS',
    counterName: 'Triage & Vitals Desk A',
    doctorName: 'Dr. Rajesh Sharma, MD (Internal Medicine)',
    department: 'General OPD & Triage',
  },
  {
    stage: 'PHLEBOTOMY',
    counterName: 'Phlebotomy Booth 1 (Routine)',
    doctorName: 'Dr. Nikil Panchal, MD (Chief Pathologist)',
    department: 'Clinical Pathology & Phlebotomy',
  },
  {
    stage: 'PHLEBOTOMY',
    counterName: 'Phlebotomy Booth 2 (Pediatric / STAT)',
    doctorName: 'Dr. Nikil Panchal, MD (Chief Pathologist)',
    department: 'STAT Sample Collection',
  },
  {
    stage: 'CONSULTATION',
    counterName: 'OPD Cabin 101 (Internal Med)',
    doctorName: 'Dr. Rajesh Sharma, MD (Internal Medicine)',
    department: 'Department of Internal Medicine',
  },
  {
    stage: 'CONSULTATION',
    counterName: 'OPD Cabin 102 (Cardiology)',
    doctorName: 'Dr. Priya Mehta, DM (Cardiology)',
    department: 'Department of Cardiology',
  },
  {
    stage: 'CONSULTATION',
    counterName: 'OPD Cabin 103 (Diabetology)',
    doctorName: 'Dr. Arun Kumar, MD (Diabetology)',
    department: 'Endocrinology & Metabolism',
  },
  {
    stage: 'BILLING_DISPATCH',
    counterName: 'Billing & Cash Counter 1',
    doctorName: 'Dr. Rajesh Sharma, MD (Internal Medicine)',
    department: 'OPD Billing & Report Dispatch',
  },
];

export default function QuickTokenModal({
  isOpen,
  onClose,
  onTokenCreated,
  existingPatients = [],
}: QuickTokenModalProps) {
  const [patientMode, setPatientMode] = useState<'walkin' | 'existing'>('walkin');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [validationError, setValidationError] = useState<string>('');

  // Form Fields
  const [title, setTitle] = useState('Mr.');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<number | ''>(38);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [phone, setPhone] = useState('98201');
  const [priority, setPriority] = useState<QueuePriority>('ROUTINE');
  const [selectedStationIndex, setSelectedStationIndex] = useState(1); // Phleb Booth 1
  const [selectedTests, setSelectedTests] = useState<string[]>([
    'Complete Blood Count (CBC)',
    'Comprehensive Lipid Profile',
  ]);
  const [fastingStatus, setFastingStatus] = useState<'FASTING_12H' | 'POST_PRANDIAL' | 'RANDOM'>(
    'FASTING_12H'
  );

  if (!isOpen) return null;

  const toggleTest = (testName: string) => {
    setSelectedTests((prev) =>
      prev.includes(testName) ? prev.filter((t) => t !== testName) : [...prev, testName]
    );
  };

  const handlePatientSelect = (pat: any) => {
    setSelectedPatient(pat);
    setTitle(pat.title || 'Mr.');
    setFirstName(pat.firstName || '');
    setLastName(pat.lastName || '');
    setAge(Number(pat.age) || 38);
    setGender(pat.gender || 'MALE');
    setPhone(pat.phone || '');
    setValidationError('');
  };

  const estimatedTotal = selectedTests.reduce((sum, name) => {
    const found = COMMON_TESTS_WITH_META.find((t) => t.name === name);
    return sum + (found ? found.fee : 500);
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setValidationError('Please enter the patient first name before issuing an OPD token.');
      return;
    }
    setValidationError('');

    const targetStation = STATION_OPTIONS[selectedStationIndex] || STATION_OPTIONS[0]!;

    const prefix =
      priority === 'EMERGENCY'
        ? 'EMG'
        : priority === 'VIP'
        ? 'VIP'
        : priority === 'SENIOR_CITIZEN'
        ? 'SNR'
        : priority === 'PEDIATRIC'
        ? 'PED'
        : 'T';

    const randomNum = Math.floor(10 + Math.random() * 89);
    const tokenNumber = `${prefix}-${randomNum}`;

    const fullName = `${title} ${firstName.trim()} ${lastName.trim()}`.trim();
    const uhid =
      selectedPatient?.uhid || `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newToken: QueueToken = {
      id: `tok-${Date.now()}`,
      tokenNumber,
      tokenIndex: randomNum,
      patientId: selectedPatient?.id || `pat-${Date.now()}`,
      uhid,
      patientName: fullName,
      gender,
      age: Number(age) || 35,
      phone: phone || '9820144910',
      stage: targetStation.stage,
      status: 'WAITING',
      priority,
      createdAt: new Date(),
      counterName: targetStation.counterName,
      doctorName: targetStation.doctorName,
      testsOrdered:
        selectedTests.length > 0 ? selectedTests : ['Complete Blood Count (CBC)'],
      fastingStatus,
      riskScore: priority === 'EMERGENCY' ? 88 : priority === 'SENIOR_CITIZEN' ? 54 : 18,
      riskLevel:
        priority === 'EMERGENCY'
          ? 'CRITICAL'
          : priority === 'SENIOR_CITIZEN'
          ? 'MODERATE'
          : 'LOW',
      callCount: 0,
      serviceRequested: targetStation.department,
    };

    onTokenCreated(newToken);
    onClose();
  };

  const filteredExisting = existingPatients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase().includes(q) ||
      (p.uhid || '').toLowerCase().includes(q) ||
      (p.phone || '').includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Issue OPD Patient Queue Token & A4 Requisition"
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-auto">
        {/* Ultra-Light Clinical Hospital Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 font-bold">
              <UserPlus size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Issue OPD Queue Token &amp; Diagnostic Requisition
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                  NABL ISO 15189
                </span>
              </div>
              <p className="text-xs text-slate-600">
                LABCORE MEDICAL DIAGNOSTICS &amp; HOSPITAL &bull; Generates Printable A4 Sheet &amp; 80mm Token Slip
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 border border-slate-200 transition"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {validationError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-xs font-semibold text-rose-800">
              {validationError}
            </div>
          )}

          {/* Mode Toggle: New Walk-In vs Existing Master Index Patient */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-300">
            <button
              type="button"
              onClick={() => {
                setPatientMode('walkin');
                setSelectedPatient(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition ${
                patientMode === 'walkin'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. New Walk-In OPD Patient
            </button>
            <button
              type="button"
              onClick={() => setPatientMode('existing')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition ${
                patientMode === 'existing'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Search Existing UHID Roster ({existingPatients.length})
            </button>
          </div>

          {/* Search Existing Patient Box */}
          {patientMode === 'existing' && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Patient Name, UHID, or Mobile Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div className="max-h-32 overflow-y-auto divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
                {filteredExisting.length === 0 ? (
                  <p className="p-2.5 text-xs text-slate-500 text-center">No matching UHID records</p>
                ) : (
                  filteredExisting.slice(0, 8).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePatientSelect(p)}
                      className="w-full p-2 text-left text-xs hover:bg-sky-50 flex items-center justify-between transition"
                    >
                      <div>
                        <strong className="font-bold text-slate-900">
                          {p.title} {p.firstName} {p.lastName}
                        </strong>
                        <span className="text-slate-500 font-mono ml-2">UHID: {p.uhid}</span>
                      </div>
                      <span className="text-sky-700 font-bold text-[11px]">Select Patient</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Section 1: Patient Demographics */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-3 sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-700">Title</label>
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-1 p-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 font-medium"
              >
                <option>Mr.</option>
                <option>Mrs.</option>
                <option>Ms.</option>
                <option>Master</option>
                <option>Dr.</option>
              </select>
            </div>
            <div className="col-span-9 sm:col-span-5">
              <label className="text-[11px] font-bold text-slate-700">First Name *</label>
              <input
                required
                type="text"
                placeholder="Enter patient first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full mt-1 p-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900"
              />
            </div>
            <div className="col-span-12 sm:col-span-5">
              <label className="text-[11px] font-bold text-slate-700">Last Name / Surname</label>
              <input
                type="text"
                placeholder="Enter surname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full mt-1 p-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900"
              />
            </div>

            <div className="col-span-4 sm:col-span-3">
              <label className="text-[11px] font-bold text-slate-700">Age (Years)</label>
              <input
                type="number"
                min={0}
                max={120}
                value={age}
                onChange={(e) => setAge(Number(e.target.value) || '')}
                className="w-full mt-1 p-2 rounded-lg border border-slate-300 text-xs font-mono bg-white text-slate-900"
              />
            </div>
            <div className="col-span-4 sm:col-span-4">
              <label className="text-[11px] font-bold text-slate-700">Biological Sex</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full mt-1 p-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 font-medium"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="col-span-4 sm:col-span-5">
              <label className="text-[11px] font-bold text-slate-700">Mobile Phone (SMS/QR)</label>
              <input
                type="tel"
                placeholder="10-digit mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1 p-2 rounded-lg border border-slate-300 text-xs font-mono bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Section 2: Triage Priority Lane */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Clinical Triage Priority Lane
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-1.5">
              {[
                { id: 'ROUTINE', label: 'Routine OPD', activeCls: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
                { id: 'FAST_TRACK', label: 'Fast-Track', activeCls: 'border-sky-500 bg-sky-50 text-sky-900' },
                { id: 'SENIOR_CITIZEN', label: 'Senior (60+)', activeCls: 'border-amber-500 bg-amber-50 text-amber-900' },
                { id: 'PEDIATRIC', label: 'Pediatric', activeCls: 'border-teal-500 bg-teal-50 text-teal-900' },
                { id: 'EMERGENCY', label: 'STAT / Red', activeCls: 'border-rose-500 bg-rose-50 text-rose-900 font-black' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id as QueuePriority)}
                  className={`p-2 rounded-lg border text-xs font-bold transition ${
                    priority === p.id
                      ? p.activeCls + ' shadow-2xs'
                      : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Destination OPD Station & Consulting Specialist */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Assigned OPD Counter / Phlebotomy Booth &amp; Specialist
            </label>
            <select
              value={selectedStationIndex}
              onChange={(e) => setSelectedStationIndex(Number(e.target.value))}
              className="w-full mt-1.5 p-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white"
            >
              {STATION_OPTIONS.map((st, i) => (
                <option key={i} value={i}>
                  {st.counterName} &mdash; {st.doctorName} ({st.department})
                </option>
              ))}
            </select>
          </div>

          {/* Section 4: Prescribed Diagnostic Tests & Vacutainer Preview */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Prescribed Diagnostic Tests ({selectedTests.length} Selected &bull; Est. &#8377;
                {estimatedTotal})
              </label>
              <select
                value={fastingStatus}
                onChange={(e) => setFastingStatus(e.target.value as any)}
                className="text-[11px] font-bold text-sky-900 bg-sky-50 border border-sky-200 rounded-md px-2.5 py-1"
              >
                <option value="FASTING_12H">10-12 Hrs Overnight Fasting</option>
                <option value="POST_PRANDIAL">2-Hr Post-Prandial (PP)</option>
                <option value="RANDOM">Random (Non-Fasting)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-44 overflow-y-auto p-2 border border-slate-300 rounded-xl bg-slate-50/60">
              {COMMON_TESTS_WITH_META.map((t) => {
                const checked = selectedTests.includes(t.name);
                return (
                  <button
                    key={t.code}
                    type="button"
                    onClick={() => toggleTest(t.name)}
                    className={`p-2 rounded-lg text-left text-[11px] border flex items-center justify-between transition ${
                      checked
                        ? 'border-sky-500 bg-white text-slate-900 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate">{t.name}</div>
                      <div className="text-[9.5px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: t.color }}
                        />
                        <span>
                          {t.code} &middot; {t.tube} &middot; &#8377;{t.fee}
                        </span>
                      </div>
                    </div>
                    {checked && <Check size={14} className="text-sky-700 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-300 flex items-center justify-between gap-3">
            <div className="text-[11px] font-mono text-slate-600">
              Opens Printable <strong>A4 Hospital Sheet &amp; 80mm Token Slip</strong> immediately
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Printer size={14} />
                <span>Issue Token &amp; Open A4 Print Sheet</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
