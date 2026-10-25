'use client';

import React, { useState } from 'react';
import { X, UserPlus, Flame, Shield, Search, Check, Sparkles } from 'lucide-react';
import { QueueToken, QueueStage, QueuePriority } from './OpdLiveQueue';

interface QuickTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenCreated: (token: QueueToken) => void;
  existingPatients?: any[];
}

const COMMON_TESTS = [
  'Complete Blood Count (CBC)',
  'Fasting Blood Sugar (FBS)',
  'Post Prandial Blood Sugar (PPBS)',
  'HbA1c Glycated Hemoglobin',
  'Lipid Profile Comprehensive',
  'Liver Function Test (LFT)',
  'Kidney Function Test (KFT)',
  'Thyroid Profile Total (T3, T4, TSH)',
  'Urine Routine & Microscopic',
  'Troponin I (STAT Cardiac)',
];

const STATION_OPTIONS: Array<{ stage: QueueStage; counterName: string; doctorName?: string }> = [
  { stage: 'WAITING_VITALS', counterName: 'Triage & Vitals Desk' },
  { stage: 'PHLEBOTOMY', counterName: 'Phlebotomy Booth 1 (Routine)' },
  { stage: 'PHLEBOTOMY', counterName: 'Phlebotomy Booth 2 (Pediatric / STAT)' },
  { stage: 'CONSULTATION', counterName: 'OPD Cabin 101', doctorName: 'Dr. Rajesh Sharma, MD' },
  { stage: 'CONSULTATION', counterName: 'OPD Cabin 102', doctorName: 'Dr. Priya Mehta, DM Card.' },
  { stage: 'CONSULTATION', counterName: 'OPD Cabin 103', doctorName: 'Dr. Arun Kumar, MD Diab.' },
  { stage: 'BILLING_DISPATCH', counterName: 'Billing & Cash Counter 1' },
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

  // Form Fields
  const [title, setTitle] = useState('Mr.');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<number | ''>(35);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [phone, setPhone] = useState('98');
  const [priority, setPriority] = useState<QueuePriority>('ROUTINE');
  const [selectedStationIndex, setSelectedStationIndex] = useState(1); // Phleb Booth 1
  const [selectedTests, setSelectedTests] = useState<string[]>(['Complete Blood Count (CBC)']);
  const [fastingStatus, setFastingStatus] = useState<'FASTING_12H' | 'POST_PRANDIAL' | 'RANDOM'>('FASTING_12H');

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
    setAge(Number(pat.age) || 35);
    setGender(pat.gender || 'MALE');
    setPhone(pat.phone || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      alert('Please enter patient first name');
      return;
    }

    const targetStation = STATION_OPTIONS[selectedStationIndex]!;

    // Generate token prefix
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
    const uhid = selectedPatient?.uhid || `LC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newToken: QueueToken = {
      id: `token-${Date.now()}`,
      tokenNumber,
      tokenIndex: Date.now(),
      patientId: selectedPatient?.id || `walkin-${Date.now()}`,
      uhid,
      patientName: `${title} ${firstName} ${lastName}`.trim(),
      gender,
      age: Number(age) || 30,
      phone: phone || 'N/A',
      stage: targetStation.stage,
      status: 'WAITING',
      priority,
      createdAt: new Date(),
      counterName: targetStation.counterName,
      doctorName: targetStation.doctorName,
      testsOrdered: selectedTests,
      fastingStatus,
      riskScore: priority === 'EMERGENCY' ? 85 : priority === 'VIP' ? 45 : 15,
      riskLevel: priority === 'EMERGENCY' ? 'CRITICAL' : priority === 'VIP' ? 'HIGH' : 'LOW',
    };

    onTokenCreated(newToken);
    onClose();
  };

  const filteredPatients = existingPatients.filter((p: any) => {
    const q = searchQuery.toLowerCase();
    const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
    const uhid = (p.uhid || '').toLowerCase();
    const ph = (p.phone || '').toLowerCase();
    return fullName.includes(q) || uhid.includes(q) || ph.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-white border border-white/20 flex items-center justify-center shadow-xs">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Issue New OPD Patient Token</h3>
              <p className="text-xs text-teal-100">
                Generate immediate token slip with queue barcode & audio dispatch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setPatientMode('walkin');
                setSelectedPatient(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                patientMode === 'walkin'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Direct Walk-In Patient
            </button>
            <button
              type="button"
              onClick={() => setPatientMode('existing')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                patientMode === 'existing'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Registered Patient Directory
            </button>
          </div>

          {/* Search if existing mode */}
          {patientMode === 'existing' && (
            <div className="space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient by UHID, Name, or Mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {searchQuery && (
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50">
                  {filteredPatients.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center">No patient found</div>
                  ) : (
                    filteredPatients.slice(0, 5).map((p: any) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handlePatientSelect(p)}
                        className="w-full p-2.5 text-left text-xs hover:bg-indigo-50 flex items-center justify-between transition"
                      >
                        <div>
                          <strong className="text-slate-800">
                            {p.title} {p.firstName} {p.lastName}
                          </strong>
                          <span className="text-slate-400 ml-2">UHID: {p.uhid}</span>
                        </div>
                        <span className="text-indigo-600 font-bold text-[11px]">Select</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Patient Demographic Details */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-bold text-slate-600">Title</label>
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 text-xs"
              >
                <option>Mr.</option>
                <option>Mrs.</option>
                <option>Ms.</option>
                <option>Master</option>
                <option>Dr.</option>
              </select>
            </div>

            <div className="col-span-5">
              <label className="text-[11px] font-bold text-slate-600">First Name *</label>
              <input
                required
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-500"
              />
            </div>

            <div className="col-span-5">
              <label className="text-[11px] font-bold text-slate-600">Last Name</label>
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-500"
              />
            </div>

            <div className="col-span-3">
              <label className="text-[11px] font-bold text-slate-600">Age</label>
              <input
                type="number"
                min={0}
                max={120}
                value={age}
                onChange={(e) => setAge(Number(e.target.value) || '')}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="col-span-4">
              <label className="text-[11px] font-bold text-slate-600">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 text-xs"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="col-span-5">
              <label className="text-[11px] font-bold text-slate-600">Phone (SMS Alert)</label>
              <input
                type="tel"
                placeholder="10-digit mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
          </div>

          {/* Priority & Fast-Track Triage */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Triage Priority Lane
            </label>
            <div className="grid grid-cols-5 gap-2 mt-1.5">
              {[
                { id: 'ROUTINE', label: 'Routine', color: 'border-slate-200 bg-slate-50 text-slate-700' },
                { id: 'FAST_TRACK', label: 'Fast-Track', color: 'border-sky-300 bg-sky-50 text-sky-800' },
                { id: 'SENIOR_CITIZEN', label: 'Senior (60+)', color: 'border-amber-300 bg-amber-50 text-amber-800' },
                { id: 'PEDIATRIC', label: 'Pediatric', color: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
                { id: 'EMERGENCY', label: 'STAT Red', color: 'border-rose-400 bg-rose-50 text-rose-800 font-black' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id as QueuePriority)}
                  className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    priority === p.id
                      ? 'ring-2 ring-indigo-500 shadow-xs ' + p.color
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Destination Counter / Doctor Cabin */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Target OPD Counter / Cabin
            </label>
            <select
              value={selectedStationIndex}
              onChange={(e) => setSelectedStationIndex(Number(e.target.value))}
              className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
            >
              {STATION_OPTIONS.map((st, i) => (
                <option key={i} value={i}>
                  {st.counterName} {st.doctorName ? `(${st.doctorName})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Common Tests Selection */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Prescribed Diagnostic Tests
              </label>
              <select
                value={fastingStatus}
                onChange={(e) => setFastingStatus(e.target.value as any)}
                className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-2 py-0.5"
              >
                <option value="FASTING_12H">Fasting 12h Verified</option>
                <option value="POST_PRANDIAL">Post-Prandial (2h)</option>
                <option value="RANDOM">Random (Non-fasting)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-xl">
              {COMMON_TESTS.map((t) => {
                const checked = selectedTests.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTest(t)}
                    className={`p-2 rounded-lg text-left text-[11px] font-medium border flex items-center justify-between transition ${
                      checked
                        ? 'border-indigo-400 bg-indigo-50/70 text-indigo-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{t}</span>
                    {checked && <Check size={13} className="text-indigo-600 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Sparkles size={14} />
              <span>Issue Token & Print Slip</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
