'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Bed,
  Building2,
  User,
  HeartPulse,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Calendar,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { queueAudio } from '@/lib/queue-chime';
import { formatPatientFullName, calculateClinicalAge } from '@/lib/patient-utils';

export interface BedAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: {
    id: string;
    uhid: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    gender?: string;
    age?: number | null;
    dateOfBirth?: string | null;
    bloodGroup?: string | null;
    patientType?: string | null;
    ward?: string | null;
    bedNumber?: string | null;
    attendingDoctor?: string | null;
  } | null;
  initialWard?: string;
  initialBed?: string;
  onAllocate: (
    patientId: string,
    ward: string,
    bedNumber: string,
    doctor: string,
    admissionType: string,
    notes: string
  ) => void;
}

const HOSPITAL_WARDS = [
  {
    id: 'GENERAL_WARD_A',
    name: 'Floor 1: General Medical Ward (Ward A)',
    floor: 'Floor 1',
    dailyRate: '₹1,200/day',
    beds: [
      { number: 'Bed #101', status: 'OCCUPIED', o2: true },
      { number: 'Bed #102', status: 'OCCUPIED', o2: true },
      { number: 'Bed #103', status: 'VACANT', o2: true },
      { number: 'Bed #104', status: 'OCCUPIED', o2: false },
      { number: 'Bed #105', status: 'OCCUPIED', o2: true },
      { number: 'Bed #106', status: 'VACANT', o2: false },
      { number: 'Bed #107', status: 'OCCUPIED', o2: false },
      { number: 'Bed #108', status: 'OCCUPIED', o2: true },
      { number: 'Bed #109', status: 'VACANT', o2: true },
      { number: 'Bed #110', status: 'OCCUPIED', o2: true },
    ],
  },
  {
    id: 'SEMI_PRIVATE_WARD_B',
    name: 'Floor 2: Semi-Private Ward (Ward B)',
    floor: 'Floor 2',
    dailyRate: '₹2,500/day',
    beds: [
      { number: 'Room #201', status: 'OCCUPIED', o2: true },
      { number: 'Room #202', status: 'VACANT', o2: true },
      { number: 'Room #203', status: 'OCCUPIED', o2: true },
      { number: 'Room #204', status: 'OCCUPIED', o2: false },
      { number: 'Room #205', status: 'VACANT', o2: true },
      { number: 'Room #206', status: 'OCCUPIED', o2: true },
      { number: 'Room #207', status: 'OCCUPIED', o2: true },
      { number: 'Room #208', status: 'VACANT', o2: true },
    ],
  },
  {
    id: 'ICU_CCU',
    name: 'Floor 3: Intensive Care Unit (ICU / CCU)',
    floor: 'Floor 3 (Critical)',
    dailyRate: '₹8,500/day',
    beds: [
      { number: 'ICU Bed #1', status: 'OCCUPIED', o2: true, critical: true },
      { number: 'ICU Bed #2', status: 'OCCUPIED', o2: true, critical: true },
      { number: 'ICU Bed #3', status: 'VACANT', o2: true, critical: true },
      { number: 'ICU Bed #4', status: 'OCCUPIED', o2: true, critical: true },
      { number: 'ICU Bed #5', status: 'VACANT', o2: true, critical: true },
      { number: 'ICU Bed #6', status: 'OCCUPIED', o2: true, critical: true },
    ],
  },
  {
    id: 'DAYCARE_OBSERVATION',
    name: 'Ground Floor: Daycare & Chemotherapy Unit',
    floor: 'Ground Floor',
    dailyRate: '₹800/session',
    beds: [
      { number: 'Daycare Bed #1', status: 'VACANT', o2: true },
      { number: 'Daycare Bed #2', status: 'OCCUPIED', o2: true },
      { number: 'Daycare Bed #3', status: 'VACANT', o2: false },
      { number: 'Daycare Bed #4', status: 'VACANT', o2: true },
    ],
  },
];

const CONSULTING_DOCTORS = [
  { name: 'Dr. Rajesh Sharma, MD', specialty: 'Chief Consultant & Intensivist' },
  { name: 'Dr. Priya Patel, MD, DM', specialty: 'Interventional Cardiology' },
  { name: 'Dr. Amit Verma, MS', specialty: 'General & Laparoscopic Surgery' },
  { name: 'Dr. Sneha Rao, MD', specialty: 'Pediatrics & Neonatology' },
  { name: 'Dr. Vikram Malhotra, MD', specialty: 'Pulmonology & Critical Care' },
  { name: 'Dr. Neha Kulkarni, DNB', specialty: 'Nephrology & Renal Care' },
];

export default function BedAllocationModal({
  isOpen,
  onClose,
  patient,
  initialWard,
  initialBed,
  onAllocate,
}: BedAllocationModalProps) {
  const [selectedWardId, setSelectedWardId] = useState(
    initialWard ? HOSPITAL_WARDS.find((w) => w.name.includes(initialWard))?.id || HOSPITAL_WARDS[0].id : HOSPITAL_WARDS[0].id
  );
  const [selectedBedNumber, setSelectedBedNumber] = useState(initialBed || '');
  const [selectedDoctor, setSelectedDoctor] = useState(
    patient?.attendingDoctor || CONSULTING_DOCTORS[0].name
  );
  const [admissionCategory, setAdmissionCategory] = useState<'ROUTINE' | 'EMERGENCY' | 'POST_OP' | 'DAYCARE'>('ROUTINE');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activeWard = HOSPITAL_WARDS.find((w) => w.id === selectedWardId) || HOSPITAL_WARDS[0];

  useEffect(() => {
    if (initialWard) {
      const match = HOSPITAL_WARDS.find((w) => w.name.toLowerCase().includes(initialWard.toLowerCase()));
      if (match) setSelectedWardId(match.id);
    }
    if (initialBed) {
      setSelectedBedNumber(initialBed);
    } else {
      const firstVacant = activeWard.beds.find((b) => b.status === 'VACANT');
      if (firstVacant) setSelectedBedNumber(firstVacant.number);
    }
  }, [initialWard, initialBed, activeWard]);

  // When ward changes, auto-select first vacant bed if current selected isn't in this ward
  const handleWardChange = (wardId: string) => {
    setSelectedWardId(wardId);
    const ward = HOSPITAL_WARDS.find((w) => w.id === wardId);
    if (ward) {
      const firstVacant = ward.beds.find((b) => b.status === 'VACANT');
      if (firstVacant) {
        setSelectedBedNumber(firstVacant.number);
      } else {
        setSelectedBedNumber('');
      }
    }
  };

  if (!isOpen || !patient) return null;

  const fullName = formatPatientFullName(patient as any);
  const clinicalAge = calculateClinicalAge(patient.dateOfBirth, patient.age);

  const handleConfirm = () => {
    if (!selectedBedNumber) return;
    setSubmitting(true);
    try {
      queueAudio.playHospitalChime('CRYSTAL_BELL');
      onAllocate(
        patient.id,
        activeWard.name,
        selectedBedNumber,
        selectedDoctor,
        admissionCategory,
        clinicalNotes
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Bed className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">
                  Allocate Inpatient (IPD) Bed
                </h3>
                <span className="rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] px-2 py-0.5 border border-blue-200">
                  Ward Admission
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Hospital Inpatient Census &bull; Bed Assignment &bull; Attending Consultant
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Patient Demographic Strip */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shadow-2xs">
                {fullName.charAt(0) || 'P'}
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-sm">{fullName}</p>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="font-mono font-bold text-blue-800">{patient.uhid}</span>
                  <span>&bull;</span>
                  <span>{clinicalAge.formatted} / {patient.gender === 'FEMALE' ? 'F' : 'M'}</span>
                  {patient.bloodGroup && (
                    <>
                      <span>&bull;</span>
                      <span className="font-bold text-rose-700">{patient.bloodGroup}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Current Status</span>
              <span className="text-xs font-bold text-slate-800">
                {patient.ward ? `${patient.ward} (${patient.bedNumber})` : 'OPD / Unassigned'}
              </span>
            </div>
          </div>

          {/* 1. Ward Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              1. Select Hospital Floor &amp; Care Ward
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {HOSPITAL_WARDS.map((w) => {
                const isSelected = selectedWardId === w.id;
                const vacantCount = w.beds.filter((b) => b.status === 'VACANT').length;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => handleWardChange(w.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                        {w.name}
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-slate-500">
                        {w.dailyRate}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{w.floor}</span>
                      <span className={`font-bold ${vacantCount > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {vacantCount} Vacant {vacantCount === 1 ? 'Bed' : 'Beds'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Bed Grid Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                2. Select Vacant Bed Slot ({activeWard.name})
              </label>
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Vacant
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-400" /> Occupied
                </span>
                <span className="flex items-center gap-1 text-blue-700 font-semibold">
                  O2 = Oxygen Port
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {activeWard.beds.map((b) => {
                const isVacant = b.status === 'VACANT';
                const isSelected = selectedBedNumber === b.number;

                return (
                  <button
                    key={b.number}
                    type="button"
                    disabled={!isVacant}
                    onClick={() => setSelectedBedNumber(b.number)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : isVacant
                        ? 'border-emerald-300 bg-emerald-50/40 text-emerald-950 hover:bg-emerald-100 hover:border-emerald-400 cursor-pointer'
                        : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className="block font-mono text-xs font-black">{b.number}</span>
                    <div className="mt-0.5 flex items-center justify-center gap-1 text-[9px] font-bold">
                      {isVacant ? (
                        <span>{isSelected ? 'Selected' : 'Vacant'}</span>
                      ) : (
                        <span>Occupied</span>
                      )}
                      {b.o2 && (
                        <span className={`px-1 rounded text-[8px] ${isSelected ? 'bg-white/20' : 'bg-blue-100 text-blue-800'}`}>
                          O2
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Attending Doctor & Admission Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Attending Chief Consultant
              </label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {CONSULTING_DOCTORS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} &bull; {d.specialty}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Admission Acuity Category
              </label>
              <select
                value={admissionCategory}
                onChange={(e) => setAdmissionCategory(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="ROUTINE">Routine Elective Admission</option>
                <option value="EMERGENCY">Emergency STAT Admission (Casualty)</option>
                <option value="POST_OP">Post-Operative Recovery Care</option>
                <option value="DAYCARE">Daycare Chemotherapy / Hemodialysis</option>
              </select>
            </div>
          </div>

          {/* 4. Clinical Indication Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Admitting Diagnosis &amp; Clinical Notes
            </label>
            <input
              type="text"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="e.g. Acute exacerbation of COPD, IV antibiotic therapy, SpO2 monitoring"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!selectedBedNumber || submitting}
            onClick={handleConfirm}
            className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs transition-all flex items-center gap-2 ${
              !selectedBedNumber || submitting
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Confirm Bed Allocation ({selectedBedNumber || 'None'})</span>
          </button>
        </div>

      </div>
    </div>
  );
}
