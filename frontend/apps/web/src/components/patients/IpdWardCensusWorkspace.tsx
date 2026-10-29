'use client';

import React, { useState, useMemo } from 'react';
import {
  Bed,
  Building2,
  User,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  FileText,
  ShieldCheck,
  Printer,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Plus,
  ArrowRightLeft,
  Wind,
  RefreshCw,
  Layers,
  CreditCard,
  Clock,
} from 'lucide-react';
import {
  HOSPITAL_WARDS_MASTER,
  HospitalWardWing,
  HospitalBedSlot,
} from './BedAllocationModal';
import IpdAdmissionA4PrintModal, { IpdAdmissionRecordData } from './IpdAdmissionA4PrintModal';
import { formatPatientFullName } from '@/lib/patient-utils';

export interface IpdWardCensusWorkspaceProps {
  patients: any[];
  onOpenBedModal: (patient: any, preferredWard?: string, preferredBed?: string) => void;
  onOpenQuickRegister: () => void;
}

export default function IpdWardCensusWorkspace({
  patients,
  onOpenBedModal,
  onOpenQuickRegister,
}: IpdWardCensusWorkspaceProps) {
  const [wards, setWards] = useState<HospitalWardWing[]>(HOSPITAL_WARDS_MASTER);
  const [selectedWingFilter, setSelectedWingFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VACANT' | 'OCCUPIED' | 'O2' | 'VENT' | 'ISOLATION'>('ALL');
  const [viewMode, setViewMode] = useState<'WING_CARDS' | 'MASTER_TABLE'>('WING_CARDS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [a4PrintRecord, setA4PrintRecord] = useState<IpdAdmissionRecordData | null>(null);

  // Merge live admitted patients from parent state into the ward beds dynamically
  const enrichedWards = useMemo(() => {
    const ipdPatients = patients.filter((p) => p.patientType === 'IPD' || Boolean(p.ward));
    return wards.map((w) => ({
      ...w,
      beds: w.beds.map((b) => {
        const matchedLivePt = ipdPatients.find(
          (p) =>
            p.bedNumber &&
            p.bedNumber.toLowerCase() === b.number.toLowerCase() &&
            (!p.ward || w.name.toLowerCase().includes(p.ward.toLowerCase()) || p.ward.toLowerCase().includes(w.shortName.toLowerCase()))
        );
        if (matchedLivePt) {
          return {
            ...b,
            status: 'OCCUPIED' as const,
            occupant: {
              name: formatPatientFullName(matchedLivePt),
              uhid: matchedLivePt.uhid || 'UHID-2026-1001',
              ageSex: `${matchedLivePt.age ?? 45}Y / ${matchedLivePt.gender === 'FEMALE' ? 'F' : 'M'}`,
              bloodGroup: matchedLivePt.bloodGroup || 'O+',
              icd10Code: matchedLivePt.icd10Code || 'J44.1',
              diagnosis: matchedLivePt.admittingDiagnosis || 'Inpatient Clinical Observation & Therapy',
              doctor: matchedLivePt.attendingDoctor || 'Dr. Rajesh Sharma, MD',
              admittedOn: 'Today (Active IPD)',
              edd: matchedLivePt.expectedDischargeDate || '02 Nov 2026',
              payer: matchedLivePt.billingStatus === 'TPA_CASHLESS' ? 'Cashless TPA' : 'Direct / Verified',
              acuity: matchedLivePt.isCritical ? ('ICU_CRITICAL' as const) : ('ROUTINE' as const),
              rawPatient: matchedLivePt,
            },
          };
        }
        return b;
      }),
    }));
  }, [wards, patients]);

  const metrics = useMemo(() => {
    let total = 0;
    let vacant = 0;
    let occupied = 0;
    let sanitizing = 0;
    let o2 = 0;
    let vent = 0;
    let isolation = 0;
    enrichedWards.forEach((w) => {
      w.beds.forEach((b) => {
        total++;
        if (b.status === 'VACANT') vacant++;
        else if (b.status === 'OCCUPIED') occupied++;
        else sanitizing++;
        if (b.o2) o2++;
        if (b.ventilator) vent++;
        if (b.negativePressure) isolation++;
      });
    });
    return { total, vacant, occupied, sanitizing, o2, vent, isolation };
  }, [enrichedWards]);

  const filteredWards = useMemo(() => {
    return enrichedWards
      .filter((w) => selectedWingFilter === 'ALL' || w.id === selectedWingFilter)
      .map((w) => ({
        ...w,
        beds: w.beds.filter((b) => {
          if (statusFilter === 'VACANT' && b.status !== 'VACANT') return false;
          if (statusFilter === 'OCCUPIED' && b.status !== 'OCCUPIED') return false;
          if (statusFilter === 'O2' && !b.o2) return false;
          if (statusFilter === 'VENT' && !b.ventilator) return false;
          if (statusFilter === 'ISOLATION' && !b.negativePressure) return false;
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchBed = b.number.toLowerCase().includes(q) || b.roomType.toLowerCase().includes(q) || w.name.toLowerCase().includes(q);
            const matchOcc =
              b.occupant &&
              (b.occupant.name.toLowerCase().includes(q) ||
                b.occupant.uhid.toLowerCase().includes(q) ||
                b.occupant.diagnosis.toLowerCase().includes(q) ||
                b.occupant.icd10Code.toLowerCase().includes(q) ||
                b.occupant.doctor.toLowerCase().includes(q));
            return Boolean(matchBed || matchOcc);
          }
          return true;
        }),
      }))
      .filter((w) => w.beds.length > 0);
  }, [enrichedWards, selectedWingFilter, statusFilter, searchQuery]);

  const handleMarkBedSanitized = (wardId: string, bedNumber: string) => {
    setWards((prev) =>
      prev.map((w) =>
        w.id !== wardId
          ? w
          : {
              ...w,
              beds: w.beds.map((b) =>
                b.number === bedNumber
                  ? { ...b, status: 'VACANT', occupant: undefined, lastSanitizedAt: 'UV-C Verified Just Now' }
                  : b
              ),
            }
      )
    );
  };

  const handleOpenA4ForOccupiedBed = (ward: HospitalWardWing, bed: HospitalBedSlot) => {
    const occ = bed.occupant;
    if (!occ) return;
    const seed = occ.uhid.replace(/D/g, '').slice(-4) || '1048';
    const dailyComposite =
      ward.roomRentPerDay + ward.nursingChargePerDay + ward.doctorFeePerDay + ward.equipmentChargePerDay;
    const nameParts = occ.name.split(' ');
    const record: IpdAdmissionRecordData = {
      ipdAdmissionNo: `IPD-2026-${seed}`,
      admissionTimestamp: occ.admittedOn,
      admissionCategory: occ.acuity,
      patient: {
        id: `pt-${seed}`,
        uhid: occ.uhid,
        firstName: nameParts[0] || occ.name,
        lastName: nameParts.slice(1).join(' ') || '',
        gender: occ.ageSex.includes('F') ? 'FEMALE' : 'MALE',
        age: parseInt(occ.ageSex, 10) || 52,
        bloodGroup: occ.bloodGroup,
        phone: '+91 98201 44510',
        abhaNumber: `91-4829-7310-${seed}`,
        emergencyContactName: 'Verified Family Next-of-Kin',
      },
      ward: {
        id: ward.id,
        name: ward.name,
        floor: ward.floor,
        wingCode: ward.wingCode,
        nursingStation: ward.nursingStation,
        roomRentPerDay: ward.roomRentPerDay,
        nursingChargePerDay: ward.nursingChargePerDay,
        doctorFeePerDay: ward.doctorFeePerDay,
        equipmentChargePerDay: ward.equipmentChargePerDay,
      },
      bed: {
        number: bed.number,
        roomType: bed.roomType,
        o2Port: bed.o2,
        suctionPort: bed.suction,
        ventilatorReady: bed.ventilator,
        multiparaMonitor: bed.monitor,
        infusionPump: bed.infusionPump,
        negativePressure: bed.negativePressure,
        sanitizationCertId: bed.sanitizationCertId,
        lastSanitizedAt: bed.lastSanitizedAt,
      },
      clinical: {
        attendingDoctor: occ.doctor,
        consultantSpecialty: 'Inpatient Specialty Unit',
        coAdmittingDoctor: 'Dr. Vivek Rathore, MBBS (Duty RMO)',
        icd10Code: occ.icd10Code,
        icd10Title: occ.diagnosis,
        clinicalNotes: `Admitted under ${occ.doctor} for ${occ.diagnosis}. Active bedside telemetry and nursing protocol in place.`,
        initialInvestigations: [
          'Complete Blood Count (CBC) + Differential',
          'Renal Function & Serum Electrolytes',
          '12-Lead Bedside ECG',
        ],
        dietOrder: 'Diabetic & Low-Sodium Therapeutic Diet',
        vitalsFrequency: bed.critical ? 'Q1H Continuous ICU Telemetry' : 'Q4H Standard Ward Vitals & SpO2',
        ioCharting: 'Strict 8-Hourly Shift Intake/Output (I/O)',
        fallRiskProtocol: 'Moderate Risk (Morse 35) - Side Rails Up',
        bradenScore: 'Score 19 (Low Ulcer Risk)',
        isolationLevel: bed.negativePressure ? 'Airborne HEPA Negative Pressure' : 'Standard Universal Precautions',
        allergyNotes: 'No Known Drug Allergies (NKDA)',
        mlcStatus: 'Non-MLC Clinical Admission',
        estimatedLosDays: 4,
        expectedDischargeDate: occ.edd,
      },
      billing: {
        payerCategory: occ.payer,
        tpaProvider: occ.payer,
        policyOrPreAuthNo: `PREAUTH-2026-${seed}`,
        preAuthStatus: 'Approved Active IPD',
        approvedPreAuthLimit: 150000,
        dailyCompositeRate: dailyComposite,
        estimatedTotalStayCost: dailyComposite * 4,
        advanceDepositPaid: 15000,
        receiptReference: `RCPT-IPD-${seed}`,
      },
    };
    setA4PrintRecord(record);
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP ENTERPRISE IPD WARD COMMAND HEADER */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-700 text-white shadow-xs shrink-0">
              <Bed className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-black text-slate-950 tracking-tight">
                  Enterprise Inpatient (IPD) Ward Census, Bed Infrastructure &amp; Admission Matrix
                </h3>
                <span className="rounded bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] font-bold text-sky-800 uppercase">
                  NABH &middot; HL7 ADT^A01 / A02
                </span>
                <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                  8 Wings Live
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Real-time floor-by-floor hospital bed occupancy, piped O2 &amp; ventilator readiness, attending physician rounds, cashless TPA status, and A4 IPD Case Sheet printing.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex rounded-xl border border-slate-300 bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('WING_CARDS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'WING_CARDS'
                    ? 'bg-white text-sky-900 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Floor &amp; Wing Matrix</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('MASTER_TABLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'MASTER_TABLE'
                    ? 'bg-white text-sky-900 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>10-Col Master Census Table</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const candidate = patients.find((p) => p.patientType !== 'IPD') || patients[0];
                if (candidate) {
                  onOpenBedModal(candidate);
                } else {
                  onOpenQuickRegister();
                }
              }}
              className="rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs px-4 py-2 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Allocate Inpatient (IPD) Bed</span>
            </button>
          </div>
        </div>

        {/* 6-KPI LIVE CENSUS & BIOMEDICAL INFRASTRUCTURE STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total IPD Capacity
            </span>
            <p className="text-lg font-black text-slate-950 mt-0.5">{metrics.total} Beds</p>
            <span className="text-[10px] font-semibold text-slate-500">Across 8 Hospital Wings</span>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Vacant &amp; Sanitized
            </span>
            <p className="text-lg font-black text-emerald-900 mt-0.5">{metrics.vacant} Ready</p>
            <span className="text-[10px] font-semibold text-emerald-700">UV-C Pass Certified</span>
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
              Occupied IPD Census
            </span>
            <p className="text-lg font-black text-sky-950 mt-0.5">
              {metrics.occupied} Admitted ({Math.round((metrics.occupied / metrics.total) * 100)}%)
            </p>
            <span className="text-[10px] font-semibold text-sky-700">Active Nursing Rounds</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Piped O2 &amp; Suction
            </span>
            <p className="text-lg font-black text-slate-950 mt-0.5">{metrics.o2} O2 Ports</p>
            <span className="text-[10px] font-semibold text-slate-500">Central Manifold 55 PSI</span>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
              ICU Ventilator Bays
            </span>
            <p className="text-lg font-black text-rose-950 mt-0.5">{metrics.vent} Vent Ready</p>
            <span className="text-[10px] font-semibold text-rose-700">MICU / ICCU / NICU</span>
          </div>

          <div className="rounded-xl border border-teal-200 bg-teal-50/30 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
              Negative Pressure
            </span>
            <p className="text-lg font-black text-teal-950 mt-0.5">{metrics.isolation} HEPA Bays</p>
            <span className="text-[10px] font-semibold text-teal-700">Airborne Isolation</span>
          </div>
        </div>

        {/* FILTER & WING SELECTION BAR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedWingFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                selectedWingFilter === 'ALL'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              All 8 Wings ({metrics.total})
            </button>
            {enrichedWards.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setSelectedWingFilter(w.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  selectedWingFilter === w.id
                    ? 'border-sky-600 bg-sky-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {w.shortName} ({w.beds.filter((b) => b.status === 'VACANT').length}/{w.beds.length})
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {([
              { id: 'ALL', label: 'All Slots' },
              { id: 'VACANT', label: 'Vacant Ready' },
              { id: 'OCCUPIED', label: 'Occupied' },
              { id: 'O2', label: 'O2 Port' },
              { id: 'VENT', label: 'Ventilator' },
              { id: 'ISOLATION', label: 'HEPA Iso' },
            ] as const).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                  statusFilter === st.id
                    ? 'border-sky-700 bg-sky-50 text-sky-900'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st.label}
              </button>
            ))}

            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bed, patient, UHID, ICD-10..."
                className="rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none w-52"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. WING CARDS OR 10-COLUMN MASTER CENSUS TABLE */}
      {viewMode === 'WING_CARDS' ? (
        <div className="space-y-4">
          {filteredWards.map((w) => {
            const vacantCount = w.beds.filter((b) => b.status === 'VACANT').length;
            const occupiedCount = w.beds.filter((b) => b.status === 'OCCUPIED').length;
            return (
              <div
                key={w.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3.5 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 font-mono text-xs font-black">
                      {w.wingCode.split('-')[0]}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-black text-slate-950">{w.name}</h4>
                        <span className="font-mono text-[10px] font-bold bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-slate-700">
                          {w.wingCode}
                        </span>
                        <span className="font-mono text-xs font-black text-sky-900 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                          {w.dailyRate}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {w.floor} &middot; {w.nursingStation} &middot; Room &#8377;{w.roomRentPerDay}/d + Nursing &#8377;{w.nursingChargePerDay}/d
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-emerald-800">
                      {vacantCount} Vacant Ready
                    </span>
                    <span className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-slate-800">
                      {occupiedCount} Occupied
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {w.beds.map((b) => {
                    const isVacant = b.status === 'VACANT';
                    const isOccupied = b.status === 'OCCUPIED';
                    return (
                      <div
                        key={b.number}
                        className={`rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
                          isVacant
                            ? 'border-emerald-300 bg-white hover:border-emerald-500 shadow-2xs'
                            : isOccupied
                            ? b.critical
                              ? 'border-rose-300 bg-rose-50/20'
                              : 'border-slate-200 bg-slate-50/60'
                            : 'border-amber-300 bg-amber-50/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-xs font-black text-slate-950">{b.number}</span>
                            {isVacant ? (
                              <span className="rounded bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 text-[9px] font-black uppercase">
                                Vacant Ready
                              </span>
                            ) : isOccupied ? (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                                  b.critical
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-sky-100 text-sky-900 border border-sky-200'
                                }`}
                              >
                                {b.critical ? 'ICU Critical' : 'Occupied'}
                              </span>
                            ) : (
                              <span className="rounded bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 text-[9px] font-black uppercase">
                                {b.status}
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{b.roomType}</p>

                          {/* Biomedical Infrastructure Ports */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {b.o2 && (
                              <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                                O2
                              </span>
                            )}
                            {b.suction && (
                              <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                VAC
                              </span>
                            )}
                            {b.monitor && (
                              <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                MON
                              </span>
                            )}
                            {b.ventilator && (
                              <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                VENT
                              </span>
                            )}
                            {b.negativePressure && (
                              <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                NEG-P
                              </span>
                            )}
                          </div>

                          {isOccupied && b.occupant ? (
                            <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-1 text-[10.5px]">
                              <p className="font-black text-slate-950 truncate">{b.occupant.name}</p>
                              <div className="flex items-center justify-between font-mono text-[9.5px] text-slate-500">
                                <span>{b.occupant.uhid}</span>
                                <span className="font-bold text-rose-700">
                                  {b.occupant.ageSex} &middot; {b.occupant.bloodGroup}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-700 font-medium truncate">
                                <span className="font-mono font-bold text-sky-800 bg-sky-50 border border-sky-200 px-1 rounded mr-1">
                                  {b.occupant.icd10Code}
                                </span>
                                {b.occupant.diagnosis}
                              </p>
                              <p className="text-[9.5px] text-slate-500 truncate">
                                {b.occupant.doctor} &middot; EDD: {b.occupant.edd}
                              </p>
                            </div>
                          ) : (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                              <span className="font-mono font-semibold text-slate-700 block">
                                Cert: {b.sanitizationCertId}
                              </span>
                              <span>{b.lastSanitizedAt}</span>
                            </div>
                          )}
                        </div>

                        {/* Card Footer Actions */}
                        <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between gap-1.5">
                          {isVacant ? (
                            <button
                              type="button"
                              onClick={() => {
                                const candidate = patients.find((p) => p.patientType !== 'IPD') || patients[0];
                                if (candidate) {
                                  onOpenBedModal(candidate, w.name, b.number);
                                } else {
                                  onOpenQuickRegister();
                                }
                              }}
                              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] py-1.5 px-2.5 shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Allocate Vacant Bed</span>
                            </button>
                          ) : isOccupied && b.occupant ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenA4ForOccupiedBed(w, b)}
                                className="flex-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-[10px] py-1 px-2 flex items-center justify-center gap-1 cursor-pointer"
                                title="Print A4 IPD Admission Case Sheet & Wristband"
                              >
                                <Printer className="h-3 w-3 text-sky-700" />
                                <span>A4 Sheet</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const rawPt = (b.occupant as any)?.rawPatient || patients[0];
                                  if (rawPt) {
                                    onOpenBedModal(
                                      {
                                        ...rawPt,
                                        firstName: b.occupant!.name.split(' ')[0],
                                        lastName: b.occupant!.name.split(' ').slice(1).join(' '),
                                        uhid: b.occupant!.uhid,
                                        ward: w.shortName,
                                        bedNumber: b.number,
                                        attendingDoctor: b.occupant!.doctor,
                                      },
                                      w.name,
                                      b.number
                                    );
                                  }
                                }}
                                className="flex-1 rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-900 font-bold text-[10px] py-1 px-2 flex items-center justify-center gap-1 cursor-pointer"
                                title="Inter-Ward Bed Transfer (ADT^A02)"
                              >
                                <ArrowRightLeft className="h-3 w-3" />
                                <span>Transfer</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMarkBedSanitized(w.id, b.number)}
                              className="w-full rounded-lg border border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[10px] py-1 px-2 cursor-pointer"
                            >
                              Complete UV Sanitization
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 10-COLUMN HOSPITAL-WIDE MASTER IPD CENSUS TABLE */
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-3">1. Wing &amp; Bed Code</th>
                  <th className="py-3 px-3">2. Status &amp; UV Cert</th>
                  <th className="py-3 px-3">3. Biomedical Ports</th>
                  <th className="py-3 px-3">4. Occupant Name &amp; UHID</th>
                  <th className="py-3 px-3">5. Attending Consultant</th>
                  <th className="py-3 px-3">6. Admitting ICD-10 Diagnosis</th>
                  <th className="py-3 px-3">7. Admitted / Sanitized</th>
                  <th className="py-3 px-3">8. Expected Discharge</th>
                  <th className="py-3 px-3">9. Tariff &amp; Payer</th>
                  <th className="py-3 px-3 text-right">10. Clinical Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredWards.flatMap((w) =>
                  w.beds.map((b) => {
                    const isVacant = b.status === 'VACANT';
                    return (
                      <tr key={`${w.id}-${b.number}`} className={isVacant ? 'bg-white hover:bg-emerald-50/20' : 'bg-slate-50/40'}>
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-black text-slate-950">{b.number}</div>
                          <div className="text-[10px] font-semibold text-slate-500">
                            {w.shortName} &middot; {b.roomType}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[9.5px] font-black uppercase ${
                              isVacant
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : b.status === 'OCCUPIED'
                                ? 'bg-sky-100 text-sky-900 border border-sky-200'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {b.status}
                          </span>
                          <div className="text-[9.5px] font-mono text-slate-500 mt-0.5">{b.sanitizationCertId}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1">
                            {b.o2 && <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-50 text-sky-800 border border-sky-200">O2</span>}
                            {b.suction && <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">VAC</span>}
                            {b.monitor && <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">MON</span>}
                            {b.ventilator && <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-800 border border-rose-200">VENT</span>}
                            {b.negativePressure && <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-50 text-teal-800 border border-teal-200">NEG-P</span>}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          {b.occupant ? (
                            <div>
                              <div className="font-bold text-slate-950">{b.occupant.name}</div>
                              <div className="font-mono text-[10px] text-slate-500">
                                {b.occupant.uhid} &middot; {b.occupant.ageSex} &middot; {b.occupant.bloodGroup}
                              </div>
                            </div>
                          ) : (
                            <span className="text-emerald-700 font-semibold text-[11px]">Vacant &amp; Ready for Admission</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] font-semibold text-slate-800">
                          {b.occupant ? b.occupant.doctor : w.nursingStation}
                        </td>
                        <td className="py-2.5 px-3">
                          {b.occupant ? (
                            <div>
                              <span className="font-mono text-[10px] font-bold bg-slate-100 border border-slate-300 px-1.5 py-0.2 rounded text-sky-900 mr-1">
                                {b.occupant.icd10Code}
                              </span>
                              <span className="text-[11px] font-medium text-slate-800">{b.occupant.diagnosis}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">&mdash;</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-600">
                          {b.occupant ? b.occupant.admittedOn : b.lastSanitizedAt}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] font-semibold text-slate-800">
                          {b.occupant ? b.occupant.edd : 'Immediate'}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-bold text-slate-900">{w.dailyRate}</div>
                          <div className="text-[10px] text-slate-500">{b.occupant ? b.occupant.payer : 'TPA / Self-Pay'}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isVacant ? (
                            <button
                              type="button"
                              onClick={() => {
                                const candidate = patients.find((p) => p.patientType !== 'IPD') || patients[0];
                                if (candidate) onOpenBedModal(candidate, w.name, b.number);
                              }}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1 cursor-pointer"
                            >
                              Assign Bed
                            </button>
                          ) : b.occupant ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenA4ForOccupiedBed(w, b)}
                                className="rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-[10.5px] px-2 py-1 flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="h-3 w-3 text-sky-700" />
                                <span>A4</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const rawPt = (b.occupant as any)?.rawPatient || patients[0];
                                  if (rawPt) {
                                    onOpenBedModal(
                                      {
                                        ...rawPt,
                                        firstName: b.occupant!.name.split(' ')[0],
                                        lastName: b.occupant!.name.split(' ').slice(1).join(' '),
                                        uhid: b.occupant!.uhid,
                                        ward: w.shortName,
                                        bedNumber: b.number,
                                        attendingDoctor: b.occupant!.doctor,
                                      },
                                      w.name,
                                      b.number
                                    );
                                  }
                                }}
                                className="rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-900 font-bold text-[10.5px] px-2 py-1 cursor-pointer"
                              >
                                Transfer
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMarkBedSanitized(w.id, b.number)}
                              className="rounded-lg border border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[10.5px] px-2.5 py-1 cursor-pointer"
                            >
                              Mark Ready
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dedicated A4 Printable IPD Admission Case Sheet & Wristband Modal */}
      <IpdAdmissionA4PrintModal
        isOpen={Boolean(a4PrintRecord)}
        onClose={() => setA4PrintRecord(null)}
        record={a4PrintRecord}
      />
    </div>
  );
}
