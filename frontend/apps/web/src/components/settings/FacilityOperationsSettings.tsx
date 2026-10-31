"use client";

import React, { useState, useCallback } from "react";
import {
  Building2,
  Clock,
  LayoutGrid,
  Network,
  Plus,
  Trash2,
  MapPin,
  ChevronDown,
  Info,
  AlertTriangle,
  CheckCircle2,
  Users,
  FileCheck,
  ShieldAlert,
  Activity,
  PhoneCall,
  Scale,
  FileText,
  BadgeAlert,
} from "lucide-react";
import type {
  FacilitySettingsData,
  BranchRecord,
  ShiftSlot,
  DepartmentRecord,
} from "@/types/settings";

// ─── Shared Input Styles ──────────────────────────────────────────────────────
const INPUT_CLS =
  "w-full rounded-lg border border-slate-200 bg-white py-2 px-3.5 text-sm text-slate-900 placeholder:text-slate-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all duration-150";

const SELECT_CLS =
  "w-full rounded-lg border border-slate-200 bg-white py-2 px-3.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all duration-150 appearance-none";

function FieldLabel({
  label,
  required,
  hint,
}: {
  label: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-1 mb-1">
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {hint && (
        <span title={hint} className="cursor-help">
          <Info className="h-3 w-3 text-slate-400" />
        </span>
      )}
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  badge,
  badgeColor = "sky",
  children,
}: {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: "sky" | "emerald" | "amber" | "red" | "violet" | "slate";
  children: React.ReactNode;
}) {
  const iconBg = {
    sky: "bg-sky-50 text-sky-600 border-sky-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    red: "bg-red-50 text-red-600 border-red-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
  }[badgeColor];

  const badgeCls = {
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
  }[badgeColor];

  return (
    <section className="rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden">
      <div className="flex items-start gap-3.5 px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${iconBg}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            {badge && (
              <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${badgeCls}`}>
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-800">{label}</p>
        {description && <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`shrink-0 flex items-center h-5 w-9 rounded-full transition-colors ${checked ? "bg-sky-600" : "bg-slate-300"}`}
      >
        <span className={`h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

// ─── Default Data ─────────────────────────────────────────────────────────────
const DEFAULT_DEPARTMENTS: DepartmentRecord[] = [
  { id: "d1", deptCode: "BIOCHEM", deptName: "Clinical Biochemistry", category: "CLINICAL_LAB", headName: "Dr. A.K. Verma", extension: "201", isActive: true, hasNablAccreditation: true },
  { id: "d2", deptCode: "HEMATOL", deptName: "Hematology & Coagulation", category: "CLINICAL_LAB", headName: "Dr. S. Patel", extension: "202", isActive: true, hasNablAccreditation: true },
  { id: "d3", deptCode: "MICRO", deptName: "Clinical Microbiology", category: "CLINICAL_LAB", headName: "Dr. R. Sharma", extension: "203", isActive: true, hasNablAccreditation: true },
  { id: "d4", deptCode: "HISTOPATH", deptName: "Histopathology & Cytopathology", category: "CLINICAL_LAB", headName: "Dr. M. Gupta", extension: "204", isActive: true, hasNablAccreditation: true },
  { id: "d5", deptCode: "MOLBIO", deptName: "Molecular Biology (RTPCR/NAAT)", category: "CLINICAL_LAB", headName: "Dr. K. Singh", extension: "205", isActive: true, hasNablAccreditation: true },
  { id: "d6", deptCode: "RADIO", deptName: "Radiology & Imaging", category: "RADIOLOGY", headName: "Dr. P. Kumar", extension: "206", isActive: true, hasNablAccreditation: false },
  { id: "d7", deptCode: "PHLEBO", deptName: "Phlebotomy & Sample Accessioning", category: "PHLEBOTOMY", headName: "Mr. D. Bhatt", extension: "207", isActive: true, hasNablAccreditation: false },
];

const DEFAULT_BRANCHES: BranchRecord[] = [
  { id: "b1", branchCode: "HO-CENTRAL", branchName: "Head Office — LabCore Central", branchType: "HEAD_OFFICE", address: "123 Health Avenue, Medical District", city: "Ahmedabad", state: "Gujarat", pincode: "380016", contactPhone: "+91 79 2658 4400", contactEmail: "central@labcore-health.in", isActive: true, is24x7: true },
  { id: "b2", branchCode: "CC-SG", branchName: "SG Highway Collection Centre", branchType: "COLLECTION_CENTER", address: "Shop 12, Sun Mall, SG Highway", city: "Ahmedabad", state: "Gujarat", pincode: "380054", contactPhone: "+91 98765 11001", contactEmail: "sg@labcore-health.in", isActive: true, is24x7: false },
];

const DEFAULT_SHIFTS: ShiftSlot[] = [
  { shiftName: "Morning Shift", startTime: "07:00", endTime: "14:00", role: "LAB_TECHNICIAN", staffName: "Mr. Ravi Patel", isOnCall: false },
  { shiftName: "Evening Shift", startTime: "14:00", endTime: "21:00", role: "LAB_TECHNICIAN", staffName: "Ms. Priya Nair", isOnCall: false },
  { shiftName: "Night / Emergency", startTime: "21:00", endTime: "07:00", role: "SENIOR_PATHOLOGIST", staffName: "Dr. A.K. Verma (On-call)", isOnCall: true },
];

const DEFAULT_DATA: FacilitySettingsData = {
  hospitalLegalName: "LabCore Healthcare & Diagnostics Pvt. Ltd.",
  tradeName: "LabCore Central Reference Diagnostic Laboratory & Polyclinic",
  ceaRegistrationNumber: "CEA-GJ-AMD-2026-04129",
  stateMedicalLicenseNo: "GSDHS-GJ-2024-0812",
  hfrFacilityId: "IN2410089124",
  rohiniId: "8900142581920",
  pndtRegNo: "PNDT-GJ-AMD-0194",
  bmwAuthorizationNo: "GPCB-BMW-2026-88412",
  facilityType: "HOSPITAL_LAB_CLINIC",
  geoLatitude: "23.0225",
  geoLongitude: "72.5714",
  opdStartTime: "07:00",
  opdEndTime: "21:00",
  ipdAvailable: true,
  is24x7Emergency: true,
  sampleCutoffTime: "19:00",
  homeCollectionEnabled: true,
  homeCollectionEarliestSlot: "06:30",
  homeCollectionLatestSlot: "10:00",
  opdSlotDurationMinutes: 15,
  workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
  holidays: [],
  shifts: DEFAULT_SHIFTS,
  departments: DEFAULT_DEPARTMENTS,
  branches: DEFAULT_BRANCHES,
  icuBeds: 20,
  ccuBeds: 10,
  nicuBeds: 8,
  generalWardBeds: 80,
  privateDeluxeBeds: 30,
  daycareBeds: 15,
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface FacilityOperationsProps {
  subSection?: string;
  initialValues?: Partial<FacilitySettingsData>;
  saving?: boolean;
  onSave?: (data: FacilitySettingsData) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function FacilityOperationsSettings({
  subSection = "facility-identity",
  initialValues,
  saving = false,
  onSave,
  onDirtyChange,
}: FacilityOperationsProps) {
  const [data, setData] = useState<FacilitySettingsData>({
    ...DEFAULT_DATA,
    ...initialValues,
  });

  const update = useCallback(
    <K extends keyof FacilitySettingsData>(key: K, value: FacilitySettingsData[K]) => {
      setData((prev) => {
        const next = { ...prev, [key]: value };
        onDirtyChange?.(true);
        return next;
      });
    },
    [onDirtyChange]
  );

  const renderSection = () => {
    switch (subSection) {
      case "facility-identity":
        return <FacilityIdentitySection data={data} update={update} />;
      case "facility-timings":
        return <TimingsShiftsSection data={data} update={update} />;
      case "facility-departments":
        return <DepartmentsSection data={data} update={update} />;
      case "facility-branches":
        return <BranchesSection data={data} update={update} />;
      case "facility-wards":
        return <WardsBedsSection data={data} update={update} />;
      case "facility-consent":
        return <ConsentMlcSection data={data} update={update} />;
      default:
        return <FacilityIdentitySection data={data} update={update} />;
    }
  };

  return <div className="space-y-5">{renderSection()}</div>;
}

// ─── Facility Identity Section ────────────────────────────────────────────────
function FacilityIdentitySection({
  data,
  update,
}: {
  data: FacilitySettingsData;
  update: <K extends keyof FacilitySettingsData>(k: K, v: FacilitySettingsData[K]) => void;
}) {
  const INDIAN_STATES = [
    "Andhra Pradesh", "Assam", "Bihar", "Chandigarh (UT)", "Chhattisgarh",
    "Delhi (NCT)", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
    "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
    "Manipur", "Meghalaya", "Nagaland", "Odisha", "Punjab", "Rajasthan",
    "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  ];

  return (
    <>
      <SectionCard
        title="Facility Legal Identity"
        description="Statutory registration details as per Clinical Establishments (Registration & Regulation) Act, 2010. These fields appear on all regulatory filings, tax invoices, and statutory reports."
        icon={Building2}
        badge="Statutory"
        badgeColor="sky"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FieldLabel label="Hospital / Lab Legal Name (as per registration)" required />
            <input
              className={INPUT_CLS}
              value={data.hospitalLegalName}
              onChange={(e) => update("hospitalLegalName", e.target.value)}
              placeholder="Legal entity name exactly as registered"
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel label="Trade Name / Brand Name" hint="The name displayed on the letterhead, signage, and patient-facing materials" />
            <input
              className={INPUT_CLS}
              value={data.tradeName}
              onChange={(e) => update("tradeName", e.target.value)}
              placeholder="e.g. LabCore Central Reference Diagnostic Laboratory"
            />
          </div>
          <div>
            <FieldLabel
              label="Clinical Establishment Act Reg. No."
              hint="Mandatory: CEA registration number from State Medical Directorate / DHS"
              required
            />
            <input
              className={INPUT_CLS}
              value={data.ceaRegistrationNumber}
              onChange={(e) => update("ceaRegistrationNumber", e.target.value)}
              placeholder="CEA-STATE-CITY-YYYY-XXXXX"
            />
          </div>
          <div>
            <FieldLabel label="State Medical Directorate License No." />
            <input
              className={INPUT_CLS}
              value={data.stateMedicalLicenseNo}
              onChange={(e) => update("stateMedicalLicenseNo", e.target.value)}
              placeholder="SDHS-STATE-YYYY-XXXX"
            />
          </div>
          <div>
            <FieldLabel
              label="HFR Facility ID"
              hint="Health Facility Registry ID issued by National Health Authority (NHA) — required for Ayushman Bharat / ABDM"
            />
            <input
              className={INPUT_CLS}
              value={data.hfrFacilityId}
              onChange={(e) => update("hfrFacilityId", e.target.value)}
              placeholder="IN2410XXXXXX"
            />
          </div>
          <div>
            <FieldLabel
              label="Rohini ID"
              hint="Insurance Regulatory ID for TPA / cashless claims"
            />
            <input
              className={INPUT_CLS}
              value={data.rohiniId}
              onChange={(e) => update("rohiniId", e.target.value)}
              placeholder="89001XXXXXXXXX"
            />
          </div>
          <div>
            <FieldLabel label="PCPNDT Act Registration No." hint="Required for labs with ultrasound / gender determination equipment" />
            <input
              className={INPUT_CLS}
              value={data.pndtRegNo}
              onChange={(e) => update("pndtRegNo", e.target.value)}
              placeholder="PNDT-STATE-CITY-XXXX"
            />
          </div>
          <div>
            <FieldLabel label="BMW Authorization No." hint="Biomedical Waste Management Authorization — State Pollution Control Board" />
            <input
              className={INPUT_CLS}
              value={data.bmwAuthorizationNo}
              onChange={(e) => update("bmwAuthorizationNo", e.target.value)}
              placeholder="SPCB-BMW-YYYY-XXXXX"
            />
          </div>
          <div>
            <FieldLabel label="Facility Type" required />
            <div className="relative">
              <select
                className={SELECT_CLS}
                value={data.facilityType}
                onChange={(e) => update("facilityType", e.target.value as FacilitySettingsData["facilityType"])}
              >
                <option value="STANDALONE_LAB">Standalone Diagnostic Lab</option>
                <option value="CLINIC">Clinic / Polyclinic</option>
                <option value="HOSPITAL_LAB_CLINIC">Hospital + Lab + Clinic (Multi-specialty)</option>
                <option value="MULTI_BRANCH_CHAIN">Multi-branch Lab Chain / Franchise</option>
                <option value="COLLECTION_CENTER">Collection Center Only</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Geo-location */}
      <SectionCard
        title="Geographic Location & Contact"
        description="Geo-coordinates are used for home collection route optimization and for ABDM Health Facility Registry geo-tagging."
        icon={MapPin}
        badgeColor="slate"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel label="Latitude" hint="Decimal degrees — North is positive (e.g. 23.0225)" />
            <input
              className={INPUT_CLS}
              value={data.geoLatitude}
              onChange={(e) => update("geoLatitude", e.target.value)}
              placeholder="e.g. 23.0225"
            />
          </div>
          <div>
            <FieldLabel label="Longitude" hint="Decimal degrees — East is positive (e.g. 72.5714)" />
            <input
              className={INPUT_CLS}
              value={data.geoLongitude}
              onChange={(e) => update("geoLongitude", e.target.value)}
              placeholder="e.g. 72.5714"
            />
          </div>
        </div>
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-sky-500 shrink-0" />
          <p className="text-xs text-slate-600">
            Coordinates: <strong>{data.geoLatitude}°N, {data.geoLongitude}°E</strong>
          </p>
          <a
            href={`https://maps.google.com/?q=${data.geoLatitude},${data.geoLongitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs font-medium text-sky-600 hover:underline shrink-0"
          >
            View on Maps →
          </a>
        </div>
      </SectionCard>
    </>
  );
}

// ─── Timings & Shifts Section ─────────────────────────────────────────────────
function TimingsShiftsSection({
  data,
  update,
}: {
  data: FacilitySettingsData;
  update: <K extends keyof FacilitySettingsData>(k: K, v: FacilitySettingsData[K]) => void;
}) {
  const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const DAY_LABELS: Record<string, string> = {
    monday: "Mon", tuesday: "Tue", wednesday: "Wed",
    thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
  };

  const toggleDay = (day: string) => {
    const updated = data.workingDays.includes(day)
      ? data.workingDays.filter((d) => d !== day)
      : [...data.workingDays, day];
    update("workingDays", updated);
  };

  const updateShift = (
    idx: number,
    field: keyof ShiftSlot,
    value: ShiftSlot[keyof ShiftSlot]
  ) => {
    const updated = data.shifts.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
    update("shifts", updated);
  };

  const addShift = () => {
    update("shifts", [
      ...data.shifts,
      { shiftName: "", startTime: "08:00", endTime: "16:00", role: "LAB_TECHNICIAN", staffName: "", isOnCall: false },
    ]);
  };

  const removeShift = (idx: number) => {
    update("shifts", data.shifts.filter((_, i) => i !== idx));
  };

  return (
    <>
      {/* OPD / IPD Hours */}
      <SectionCard
        title="OPD / IPD Operating Hours"
        description="Core facility working hours govern report TAT calculations, cutoff acceptance, and HIS order creation windows."
        icon={Clock}
        badgeColor="sky"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <FieldLabel label="OPD Start Time" required />
            <input
              type="time"
              className={INPUT_CLS}
              value={data.opdStartTime}
              onChange={(e) => update("opdStartTime", e.target.value)}
            />
          </div>
          <div>
            <FieldLabel label="OPD End Time" required />
            <input
              type="time"
              className={INPUT_CLS}
              value={data.opdEndTime}
              onChange={(e) => update("opdEndTime", e.target.value)}
            />
          </div>
          <div>
            <FieldLabel label="Sample Cutoff Time" hint="No new routine sample acceptance after this time for same-day reporting" />
            <input
              type="time"
              className={INPUT_CLS}
              value={data.sampleCutoffTime}
              onChange={(e) => update("sampleCutoffTime", e.target.value)}
            />
          </div>
          <div>
            <FieldLabel label="OPD Slot Duration" hint="Default consultation slot length in minutes" />
            <div className="flex items-center gap-2">
              <input
                type="number"
                className={INPUT_CLS}
                value={data.opdSlotDurationMinutes}
                onChange={(e) => update("opdSlotDurationMinutes", Number(e.target.value))}
                min={5}
                max={60}
                step={5}
              />
              <span className="text-xs text-slate-500 shrink-0">min</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <Toggle
            checked={data.ipdAvailable}
            onChange={(v) => update("ipdAvailable", v)}
            label="In-Patient Department (IPD) / Admitted Patient Services"
            description="Enable for hospitals with inpatient wards. Enables IPD-specific order workflow, wristband barcodes, and bed assignment in LIS."
          />
          <Toggle
            checked={data.is24x7Emergency}
            onChange={(v) => update("is24x7Emergency", v)}
            label="24×7 Emergency / Trauma Triage STAT Lab Services"
            description="Enables round-the-clock STAT order processing. Emergency pathologist on-call notification enabled outside OPD hours."
          />
          <Toggle
            checked={data.homeCollectionEnabled}
            onChange={(v) => update("homeCollectionEnabled", v)}
            label="Home Collection Service"
            description="Enable phlebotomist home visit scheduling for patient convenience and bedridden patients."
          />
        </div>

        {data.homeCollectionEnabled && (
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <div>
              <FieldLabel label="Home Collection — Earliest Slot" />
              <input
                type="time"
                className={INPUT_CLS}
                value={data.homeCollectionEarliestSlot}
                onChange={(e) => update("homeCollectionEarliestSlot", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel label="Home Collection — Latest Slot" />
              <input
                type="time"
                className={INPUT_CLS}
                value={data.homeCollectionLatestSlot}
                onChange={(e) => update("homeCollectionLatestSlot", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Working Days */}
        <div className="border-t border-slate-100 pt-4">
          <FieldLabel label="Working Days" required />
          <div className="flex flex-wrap gap-2 mt-1">
            {DAYS.map((day) => {
              const active = data.workingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold border transition-colors ${
                    active
                      ? "bg-sky-600 text-white border-sky-600"
                      : "bg-white text-slate-600 border-slate-300 hover:border-sky-400"
                  }`}
                >
                  {DAY_LABELS[day]}
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* Shift Roster */}
      <SectionCard
        title="Shift Roster"
        description="Define named shifts for the lab's operating schedule. On-call shifts trigger emergency pathologist alerts for STAT and panic value notifications outside working hours."
        icon={Users}
        badgeColor="sky"
      >
        <div className="space-y-3">
          {data.shifts.map((shift, idx) => (
            <div
              key={idx}
              className={`rounded-lg border ${shift.isOnCall ? "border-amber-200 bg-amber-50/30" : "border-slate-200 bg-white"} p-4`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${shift.isOnCall ? "text-amber-600" : "text-sky-600"}`} />
                  <span className="text-xs font-bold text-slate-800">
                    {shift.shiftName || `Shift ${idx + 1}`}
                  </span>
                  {shift.isOnCall && (
                    <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-700 uppercase">
                      On-Call
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeShift(idx)}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="sm:col-span-2">
                  <FieldLabel label="Shift Name" />
                  <input
                    className={INPUT_CLS}
                    value={shift.shiftName}
                    onChange={(e) => updateShift(idx, "shiftName", e.target.value)}
                    placeholder="Morning Shift"
                  />
                </div>
                <div>
                  <FieldLabel label="Start Time" />
                  <input
                    type="time"
                    className={INPUT_CLS}
                    value={shift.startTime}
                    onChange={(e) => updateShift(idx, "startTime", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel label="End Time" />
                  <input
                    type="time"
                    className={INPUT_CLS}
                    value={shift.endTime}
                    onChange={(e) => updateShift(idx, "endTime", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel label="Assigned Staff / Role" />
                  <input
                    className={INPUT_CLS}
                    value={shift.staffName}
                    onChange={(e) => updateShift(idx, "staffName", e.target.value)}
                    placeholder="Dr. Name or Role"
                  />
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100/80">
                <Toggle
                  checked={shift.isOnCall}
                  onChange={(v) => updateShift(idx, "isOnCall", v)}
                  label="On-Call / Emergency Pathologist Shift"
                  description="Staff in this shift receive panic value alerts outside OPD hours"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addShift}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-sky-400 hover:text-sky-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Shift Slot
          </button>
        </div>
      </SectionCard>

      {/* Physical Beds (IPD) */}
      {data.ipdAvailable && (
        <SectionCard
          title="Physical Ward & Bed Capacity"
          description="Bed count configuration for IPD capacity management, occupancy reporting, and automated LIMS-HIS integration."
          icon={Bed}
          badgeColor="slate"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {(
              [
                ["icuBeds", "ICU"],
                ["ccuBeds", "CCU"],
                ["nicuBeds", "NICU"],
                ["generalWardBeds", "General Ward"],
                ["privateDeluxeBeds", "Private/Deluxe"],
                ["daycareBeds", "Daycare"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <FieldLabel label={label} />
                <input
                  type="number"
                  className={INPUT_CLS}
                  value={data[key]}
                  onChange={(e) => update(key, Number(e.target.value))}
                  min={0}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-xs text-slate-500">Total Licensed Bed Capacity</span>
            <span className="text-sm font-black text-slate-900">
              {data.icuBeds + data.ccuBeds + data.nicuBeds + data.generalWardBeds + data.privateDeluxeBeds + data.daycareBeds} beds
            </span>
          </div>
        </SectionCard>
      )}
    </>
  );
}

// ─── Departments Section ──────────────────────────────────────────────────────
function DepartmentsSection({
  data,
  update,
}: {
  data: FacilitySettingsData;
  update: <K extends keyof FacilitySettingsData>(k: K, v: FacilitySettingsData[K]) => void;
}) {
  const updateDept = (
    id: string,
    field: keyof DepartmentRecord,
    value: DepartmentRecord[keyof DepartmentRecord]
  ) => {
    update(
      "departments",
      data.departments.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const addDept = () => {
    update("departments", [
      ...data.departments,
      {
        id: `d${Date.now()}`,
        deptCode: "",
        deptName: "",
        category: "CLINICAL_LAB",
        headName: "",
        extension: "",
        isActive: true,
        hasNablAccreditation: false,
      },
    ]);
  };

  const removeDept = (id: string) => {
    update("departments", data.departments.filter((d) => d.id !== id));
  };

  const catLabels: Record<string, string> = {
    CLINICAL_LAB: "Clinical Lab",
    RADIOLOGY: "Radiology",
    PHLEBOTOMY: "Phlebotomy",
    CLINICAL: "Clinical",
    ADMIN: "Admin",
  };

  return (
    <SectionCard
      title="Department Master"
      description="Configure all clinical departments and reporting units. Departments determine test routing, TAT tracking, IQC segregation, and NABL scope classification."
      icon={LayoutGrid}
      badge="Routing"
      badgeColor="sky"
    >
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-2.5 text-left font-bold text-slate-700 uppercase tracking-wide">Dept. Code</th>
              <th className="px-3 py-2.5 text-left font-bold text-slate-700 uppercase tracking-wide">Department Name</th>
              <th className="px-3 py-2.5 text-left font-bold text-slate-700 uppercase tracking-wide w-28">Category</th>
              <th className="px-3 py-2.5 text-left font-bold text-slate-700 uppercase tracking-wide">Head / In-charge</th>
              <th className="px-3 py-2.5 text-center font-bold text-slate-700 uppercase tracking-wide w-16">Extn.</th>
              <th className="px-3 py-2.5 text-center font-bold text-slate-700 uppercase tracking-wide w-14">NABL</th>
              <th className="px-3 py-2.5 text-center font-bold text-slate-700 uppercase tracking-wide w-14">Active</th>
              <th className="px-3 py-2.5 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.departments.map((dept) => (
              <tr key={dept.id} className={`${dept.isActive ? "bg-white" : "bg-slate-50/60"}`}>
                <td className="px-3 py-2">
                  <input
                    className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs font-mono text-slate-800 focus:border-sky-500 focus:outline-none uppercase"
                    value={dept.deptCode}
                    onChange={(e) => updateDept(dept.id, "deptCode", e.target.value.toUpperCase())}
                    placeholder="CODE"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="w-full min-w-[160px] rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                    value={dept.deptName}
                    onChange={(e) => updateDept(dept.id, "deptName", e.target.value)}
                    placeholder="Department name"
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="relative">
                    <select
                      className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-sky-500 focus:outline-none appearance-none"
                      value={dept.category}
                      onChange={(e) => updateDept(dept.id, "category", e.target.value as DepartmentRecord["category"])}
                    >
                      {Object.entries(catLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <input
                    className="w-full min-w-[140px] rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                    value={dept.headName}
                    onChange={(e) => updateDept(dept.id, "headName", e.target.value)}
                    placeholder="Dr. / Mr. Name"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-center font-mono text-slate-800 focus:border-sky-500 focus:outline-none"
                    value={dept.extension}
                    onChange={(e) => updateDept(dept.id, "extension", e.target.value)}
                    placeholder="201"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => updateDept(dept.id, "hasNablAccreditation", !dept.hasNablAccreditation)}
                    className={dept.hasNablAccreditation ? "text-emerald-600" : "text-slate-300"}
                  >
                    <CheckCircle2 className="h-4 w-4 mx-auto" />
                  </button>
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => updateDept(dept.id, "isActive", !dept.isActive)}
                    className={`h-4 w-8 rounded-full transition-colors ${dept.isActive ? "bg-sky-500" : "bg-slate-300"}`}
                  >
                    <span
                      className={`block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform ${dept.isActive ? "translate-x-4" : "translate-x-0.5"}`}
                    />
                  </button>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => removeDept(dept.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addDept}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-2.5 text-xs font-medium text-slate-500 hover:border-sky-400 hover:text-sky-600 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Department
      </button>

      <p className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
        <Info className="h-3 w-3 shrink-0" />
        NABL column: Click to toggle. Only NABL-accredited departments appear in the accreditation scope report.
      </p>
    </SectionCard>
  );
}

// ─── Branches Section ─────────────────────────────────────────────────────────
function BranchesSection({
  data,
  update,
}: {
  data: FacilitySettingsData;
  update: <K extends keyof FacilitySettingsData>(k: K, v: FacilitySettingsData[K]) => void;
}) {
  const updateBranch = (
    id: string,
    field: keyof BranchRecord,
    value: BranchRecord[keyof BranchRecord]
  ) => {
    update(
      "branches",
      data.branches.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const addBranch = () => {
    update("branches", [
      ...data.branches,
      {
        id: `b${Date.now()}`,
        branchCode: "",
        branchName: "",
        branchType: "COLLECTION_CENTER",
        address: "",
        city: "",
        state: "Gujarat",
        pincode: "",
        contactPhone: "",
        contactEmail: "",
        isActive: true,
        is24x7: false,
      },
    ]);
  };

  const removeBranch = (id: string) => {
    if (data.branches.find((b) => b.id === id)?.branchType === "HEAD_OFFICE") {
      alert("Cannot remove the Head Office branch.");
      return;
    }
    update("branches", data.branches.filter((b) => b.id !== id));
  };

  const branchTypeLabels: Record<string, string> = {
    HEAD_OFFICE: "Head Office / Main Lab",
    COLLECTION_CENTER: "Collection Centre",
    SATELLITE_LAB: "Satellite / Processing Lab",
    HOSPITAL_WING: "Hospital Wing",
  };

  return (
    <SectionCard
      title="Branch & Collection Centre Registry"
      description="Multi-branch management for lab chains, collection centers, and satellite labs. Each branch has its own sample prefix, contact, and operating mode."
      icon={Network}
      badge="Multi-site"
      badgeColor="sky"
    >
      <div className="space-y-4">
        {data.branches.map((branch) => (
          <div
            key={branch.id}
            className={`rounded-lg border ${branch.branchType === "HEAD_OFFICE" ? "border-sky-200 bg-sky-50/20" : "border-slate-200 bg-white"} overflow-hidden`}
          >
            {/* Branch Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded border px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                    branch.branchType === "HEAD_OFFICE"
                      ? "bg-sky-50 text-sky-700 border-sky-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {branchTypeLabels[branch.branchType] || branch.branchType}
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {branch.branchName || `Branch ${branch.branchCode}`}
                </span>
                {branch.is24x7 && (
                  <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700 uppercase">
                    24×7
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold rounded px-2 py-0.5 border ${branch.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                  {branch.isActive ? "Active" : "Inactive"}
                </span>
                {branch.branchType !== "HEAD_OFFICE" && (
                  <button
                    type="button"
                    onClick={() => removeBranch(branch.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Branch Fields */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <FieldLabel label="Branch Code" required />
                <input
                  className={`${INPUT_CLS} font-mono uppercase`}
                  value={branch.branchCode}
                  onChange={(e) => updateBranch(branch.id, "branchCode", e.target.value.toUpperCase())}
                  placeholder="HO-CENTRAL"
                  disabled={branch.branchType === "HEAD_OFFICE"}
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel label="Branch Name" required />
                <input
                  className={INPUT_CLS}
                  value={branch.branchName}
                  onChange={(e) => updateBranch(branch.id, "branchName", e.target.value)}
                  placeholder="Full branch name"
                />
              </div>
              <div>
                <FieldLabel label="Branch Type" />
                <div className="relative">
                  <select
                    className={SELECT_CLS}
                    value={branch.branchType}
                    onChange={(e) => updateBranch(branch.id, "branchType", e.target.value as BranchRecord["branchType"])}
                    disabled={branch.branchType === "HEAD_OFFICE"}
                  >
                    {Object.entries(branchTypeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <FieldLabel label="Address" />
                <input
                  className={INPUT_CLS}
                  value={branch.address}
                  onChange={(e) => updateBranch(branch.id, "address", e.target.value)}
                  placeholder="Street address"
                />
              </div>
              <div>
                <FieldLabel label="City" />
                <input
                  className={INPUT_CLS}
                  value={branch.city}
                  onChange={(e) => updateBranch(branch.id, "city", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel label="State" />
                <input
                  className={INPUT_CLS}
                  value={branch.state}
                  onChange={(e) => updateBranch(branch.id, "state", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel label="PIN Code" />
                <input
                  className={INPUT_CLS}
                  value={branch.pincode}
                  onChange={(e) => updateBranch(branch.id, "pincode", e.target.value)}
                  placeholder="6-digit PIN"
                  maxLength={6}
                />
              </div>
              <div>
                <FieldLabel label="Contact Phone" />
                <input
                  className={INPUT_CLS}
                  value={branch.contactPhone}
                  onChange={(e) => updateBranch(branch.id, "contactPhone", e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div>
                <FieldLabel label="Contact Email" />
                <input
                  type="email"
                  className={INPUT_CLS}
                  value={branch.contactEmail}
                  onChange={(e) => updateBranch(branch.id, "contactEmail", e.target.value)}
                  placeholder="branch@example.com"
                />
              </div>
            </div>

            <div className="px-4 pb-3 border-t border-slate-100 pt-2">
              <Toggle
                checked={branch.is24x7}
                onChange={(v) => updateBranch(branch.id, "is24x7", v)}
                label="24×7 Operations"
                description="This branch operates round the clock, including nights and holidays"
              />
              <Toggle
                checked={branch.isActive}
                onChange={(v) => updateBranch(branch.id, "isActive", v)}
                label="Branch Active"
                description="Inactive branches are hidden from order placement and home collection routing"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addBranch}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-sky-400 hover:text-sky-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Branch / Collection Centre
        </button>
      </div>
    </SectionCard>
  );
}

// ─── Missing import for Bed icon ──────────────────────────────────────────────
function Bed({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 4v16" />
      <path d="M2 8h18a2 2 0 0 1 2 2v10" />
      <path d="M2 17h20" />
      <path d="M6 8v9" />
    </svg>
  );
}

// ─── Ward & Bed Management Section ──────────────────────────────────────────
function WardsBedsSection({
  data,
  update,
}: {
  data: FacilitySettingsData;
  update: <K extends keyof FacilitySettingsData>(k: K, v: FacilitySettingsData[K]) => void;
}) {
  const totalBeds =
    (data.icuBeds || 0) +
    (data.ccuBeds || 0) +
    (data.nicuBeds || 0) +
    (data.generalWardBeds || 0) +
    (data.privateDeluxeBeds || 0) +
    (data.daycareBeds || 0);

  const criticalBeds = (data.icuBeds || 0) + (data.ccuBeds || 0) + (data.nicuBeds || 0);

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Bed Strength</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalBeds}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Sanctioned IPD capacity</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/40 p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">Critical / ICU Beds</p>
          <p className="text-2xl font-black text-red-700 mt-1">{criticalBeds}</p>
          <p className="text-[11px] text-red-600/80 mt-0.5">ICU + CCU + NICU</p>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">General Ward</p>
          <p className="text-2xl font-black text-sky-900 mt-1">{data.generalWardBeds || 0}</p>
          <p className="text-[11px] text-sky-600 mt-0.5">Multi-patient bays</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Private & Daycare</p>
          <p className="text-2xl font-black text-emerald-900 mt-1">
            {(data.privateDeluxeBeds || 0) + (data.daycareBeds || 0)}
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Single / Day Dialysis</p>
        </div>
      </div>

      <SectionCard
        title="Inpatient Ward Configuration & Bed Allocation"
        description="Configure sanctioned bed counts, medical oxygen pipeline (MGPS) availability, and patient category limits for NABH & State Health Authority compliance."
        icon={Bed}
        badge={`${totalBeds} Beds Registered`}
        badgeColor="sky"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <FieldLabel label="ICU Beds (Intensive Care)" required hint="Equipped with multi-para monitor & ventilator support" />
              <input
                type="number"
                min={0}
                className={INPUT_CLS}
                value={data.icuBeds || 0}
                onChange={(e) => update("icuBeds", parseInt(e.target.value, 10) || 0)}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Level-3 tertiary intensive care</span>
            </div>
            <div>
              <FieldLabel label="CCU Beds (Cardiac Care)" required hint="Dedicated 12-lead telemetry & defibrillator ready" />
              <input
                type="number"
                min={0}
                className={INPUT_CLS}
                value={data.ccuBeds || 0}
                onChange={(e) => update("ccuBeds", parseInt(e.target.value, 10) || 0)}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Coronary & post-angioplasty care</span>
            </div>
            <div>
              <FieldLabel label="NICU Beds (Neonatal ICU)" required hint="Equipped with radiant warmers & phototherapy units" />
              <input
                type="number"
                min={0}
                className={INPUT_CLS}
                value={data.nicuBeds || 0}
                onChange={(e) => update("nicuBeds", parseInt(e.target.value, 10) || 0)}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Neonatal specialized nursery</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 border-t border-slate-100">
            <div>
              <FieldLabel label="General Ward Beds" required hint="Male / Female medical & surgical multi-bed wards" />
              <input
                type="number"
                min={0}
                className={INPUT_CLS}
                value={data.generalWardBeds || 0}
                onChange={(e) => update("generalWardBeds", parseInt(e.target.value, 10) || 0)}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Subsidized & government scheme beds</span>
            </div>
            <div>
              <FieldLabel label="Private & Deluxe Rooms" required hint="Single occupant air-conditioned rooms with attendant couch" />
              <input
                type="number"
                min={0}
                className={INPUT_CLS}
                value={data.privateDeluxeBeds || 0}
                onChange={(e) => update("privateDeluxeBeds", parseInt(e.target.value, 10) || 0)}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Individual washroom & patient pantry</span>
            </div>
            <div>
              <FieldLabel label="Daycare / Dialysis Beds" required hint="Shorter observation and hemodialysis cycles (< 8 hours)" />
              <input
                type="number"
                min={0}
                className={INPUT_CLS}
                value={data.daycareBeds || 0}
                onChange={(e) => update("daycareBeds", parseInt(e.target.value, 10) || 0)}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Chemotherapy / Dialysis chairs</span>
            </div>
          </div>

          {/* Clinical Operational Policies */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Inpatient Operational Protocols</h3>
            <Toggle
              checked={data.ipdAvailable}
              onChange={(v) => update("ipdAvailable", v)}
              label="Inpatient Department (IPD) Enabled"
              description="Permit bed bookings, ward transfers, and daily IPD diagnostic orders"
            />
            <Toggle
              checked={data.is24x7Emergency}
              onChange={(v) => update("is24x7Emergency", v)}
              label="24×7 Emergency & Trauma Admission"
              description="Emergency duty doctor and casualty ward are staffed continuously"
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Consent & MLC Registry Section ─────────────────────────────────────────
function ConsentMlcSection({
  data,
  update,
}: {
  data: FacilitySettingsData;
  update: <K extends keyof FacilitySettingsData>(k: K, v: FacilitySettingsData[K]) => void;
}) {
  const [policeStation, setPoliceStation] = useState("Navrangpura Police Station, Ahmedabad");
  const [mlcHotline, setMlcHotline] = useState("+91 79 2640 1000");
  const [requireWitnessSign, setRequireWitnessSign] = useState(true);
  const [retentionYears, setRetentionYears] = useState("10");
  const [pocsoOfficer, setPocsoOfficer] = useState("Dr. P. Joshi (Medical Superintendent)");

  return (
    <div className="space-y-6">
      <SectionCard
        title="Medicolegal Case (MLC) Protocol & Police Intimation"
        description="Configure mandatory police notification thresholds, jurisdiction police station details, and casualty trauma registers as per the Bharatiya Nagarik Suraksha Sanhita (BNSS) & state medicolegal guidelines."
        icon={Scale}
        badge="Legal & Regulatory"
        badgeColor="red"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel label="Designated Jurisdictional Police Station" required hint="Police station having geographical jurisdiction over the facility casualty" />
              <input
                type="text"
                className={INPUT_CLS}
                value={policeStation}
                onChange={(e) => setPoliceStation(e.target.value)}
                placeholder="e.g. Navrangpura Police Station"
              />
            </div>
            <div>
              <FieldLabel label="Police Duty Officer / Control Room Hotline" required hint="Direct phone number for instantaneous casualty MLC alerts" />
              <input
                type="text"
                className={INPUT_CLS}
                value={mlcHotline}
                onChange={(e) => setMlcHotline(e.target.value)}
                placeholder="+91..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel label="Nodal Officer for POCSO & Vulnerable Cases" required hint="Senior doctor designated for child & vulnerable patient reporting" />
              <input
                type="text"
                className={INPUT_CLS}
                value={pocsoOfficer}
                onChange={(e) => setPocsoOfficer(e.target.value)}
                placeholder="Dr. Name & Designation"
              />
            </div>
            <div>
              <FieldLabel label="Statutory MLC Record Retention Period" required hint="Indian Medical Council regulations mandate minimum 10 years" />
              <select
                className={SELECT_CLS}
                value={retentionYears}
                onChange={(e) => setRetentionYears(e.target.value)}
              >
                <option value="10">10 Years (Statutory Minimum - NMC & BNSS)</option>
                <option value="15">15 Years (Recommended for Tertiary Hospitals)</option>
                <option value="permanent">Permanent Archival (Encrypted Digital Vault)</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
              <h4 className="text-xs font-bold text-red-900 uppercase tracking-wide">Casualty MLC Automated Trigger Rules</h4>
            </div>
            <p className="text-[11px] text-red-700 leading-relaxed">
              Whenever a patient is flagged as MLC (Road Traffic Accident, Poisoning, Assault, Burns, Firearm injury, or Suspicious death), the system automatically locks the Casualty Case Sheet, issues a unique MLC Number with timestamp, and prompts for police memo dispatch.
            </p>
            <Toggle
              checked={requireWitnessSign}
              onChange={(v) => setRequireWitnessSign(v)}
              label="Mandatory Attendant / Constable Witness Signature"
              description="Require digital sign-off from accompanying relative or police officer on the electronic MLC intimation sheet"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Clinical Informed Consent & Procedure Authorization"
        description="Manage consent workflows for invasive procedures, diagnostic imaging with IV contrast, blood transfusion, and tissue specimen retention under ISO 15189:2022 & NABH standards."
        icon={FileCheck}
        badge="Informed Consent"
        badgeColor="emerald"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">General OPD / IPD Admission Consent</span>
                <span className="rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-bold">Standard</span>
              </div>
              <p className="text-[11px] text-slate-500">Covers routine clinical assessment, vital monitoring, routine blood collection, and hospital policy acknowledgment.</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">IV Contrast & Radiation Consent</span>
                <span className="rounded bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 text-[9px] font-bold">Contrast Allergy Check</span>
              </div>
              <p className="text-[11px] text-slate-500">Required prior to Contrast-Enhanced CT / MRI. Embeds eGFR / Serum Creatinine clearance check.</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Histopathology & Tissue Retention</span>
                <span className="rounded bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 text-[9px] font-bold">ISO 15189 Cl. 5.4</span>
              </div>
              <p className="text-[11px] text-slate-500">Informs patient of tissue biopsy retention in paraffin blocks for mandatory 5-year diagnostic review.</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Blood & Component Transfusion</span>
                <span className="rounded bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 text-[9px] font-bold">Critical SLA</span>
              </div>
              <p className="text-[11px] text-slate-500">Mandatory consent detailing transfusion risks, cross-matching confirmation, and emergency blood release protocols.</p>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
