"use client";

import React, { useState, useCallback } from "react";
import {
  Award,
  Activity,
  AlertCircle,
  Zap,
  Barcode,
  Microscope,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Info,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  Hourglass,
  Gauge,
  FileSignature,
  ShieldAlert,
} from "lucide-react";
import type {
  DiagnosticGovernanceData,
  WestgardRule,
  CriticalValueThreshold,
  EQASProvider,
  TubeColorCode,
} from "@/types/settings";

// ─── Shared UI Primitives ─────────────────────────────────────────────────────
const INPUT_CLS =
  "w-full rounded-lg border border-slate-200 bg-white py-2 px-3.5 text-sm text-slate-900 placeholder:text-slate-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all duration-150 disabled:bg-slate-50 disabled:text-slate-500";

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
    <div className="flex items-center gap-1.5 mb-1">
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
  badgeColor?: "sky" | "emerald" | "amber" | "red" | "violet";
  children: React.ReactNode;
}) {
  const badgeCls = {
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  }[badgeColor];

  const iconBg = {
    sky: "bg-sky-50 text-sky-600 border-sky-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    red: "bg-red-50 text-red-600 border-red-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
  }[badgeColor];

  return (
    <section className="rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden">
      <div className="flex items-start gap-3.5 px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${iconBg}`}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            {badge && (
              <span
                className={`inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${badgeCls}`}
              >
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">
              {description}
            </p>
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
        {description && (
          <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`shrink-0 flex items-center h-5 w-9 rounded-full transition-colors ${
          checked ? "bg-sky-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

// ─── Default Data ─────────────────────────────────────────────────────────────
const DEFAULT_WESTGARD_RULES: WestgardRule[] = [
  { rule: "1_2s", enabled: true, action: "WARNING", description: "1 control value exceeds ±2 SD — Warning, not rejection" },
  { rule: "1_3s", enabled: true, action: "REJECT", description: "1 control value exceeds ±3 SD — Reject entire run" },
  { rule: "2_2s", enabled: true, action: "REJECT", description: "2 consecutive controls exceed ±2 SD on the same side" },
  { rule: "R_4s", enabled: true, action: "REJECT", description: "Range of 4 SD between two controls in same run" },
  { rule: "4_1s", enabled: true, action: "REJECT", description: "4 consecutive controls exceed ±1 SD on same side" },
  { rule: "10x", enabled: true, action: "REJECT", description: "10 consecutive controls fall on same side of mean" },
  { rule: "7T", enabled: false, action: "WARNING", description: "7 consecutive controls trend in same direction" },
  { rule: "6x", enabled: false, action: "WARNING", description: "6 consecutive controls on same side of mean" },
];

const DEFAULT_CRITICAL_VALUES: CriticalValueThreshold[] = [
  { id: "cv1", analyte: "Potassium (K⁺)", unit: "mmol/L", criticalLow: 2.5, criticalHigh: 6.5, panicLow: 2.0, panicHigh: 7.0, department: "Biochemistry", notifyMethod: "ALL", escalationMinutes: 15 },
  { id: "cv2", analyte: "Sodium (Na⁺)", unit: "mmol/L", criticalLow: 120, criticalHigh: 160, panicLow: 115, panicHigh: 170, department: "Biochemistry", notifyMethod: "ALL", escalationMinutes: 15 },
  { id: "cv3", analyte: "Platelet Count", unit: "/µL", criticalLow: 20000, criticalHigh: null, panicLow: 10000, panicHigh: null, department: "Hematology", notifyMethod: "PHONE", escalationMinutes: 10 },
  { id: "cv4", analyte: "Troponin-I (cTnI)", unit: "ng/mL", criticalLow: null, criticalHigh: 0.04, panicLow: null, panicHigh: 0.1, department: "Biochemistry", notifyMethod: "ALL", escalationMinutes: 10 },
  { id: "cv5", analyte: "Blood Glucose (RBS)", unit: "mg/dL", criticalLow: 50, criticalHigh: 450, panicLow: 30, panicHigh: 600, department: "Biochemistry", notifyMethod: "ALL", escalationMinutes: 15 },
  { id: "cv6", analyte: "Prothrombin Time (PT INR)", unit: "INR", criticalLow: null, criticalHigh: 5.0, panicLow: null, panicHigh: 8.0, department: "Hematology", notifyMethod: "PHONE", escalationMinutes: 15 },
  { id: "cv7", analyte: "Hemoglobin (Hb)", unit: "g/dL", criticalLow: 6.5, criticalHigh: 20.0, panicLow: 5.0, panicHigh: null, department: "Hematology", notifyMethod: "ALL", escalationMinutes: 20 },
  { id: "cv8", analyte: "Serum Creatinine", unit: "mg/dL", criticalLow: null, criticalHigh: 10.0, panicLow: null, panicHigh: 15.0, department: "Biochemistry", notifyMethod: "ALL", escalationMinutes: 20 },
];

const DEFAULT_EQAS_PROVIDERS: EQASProvider[] = [
  { id: "eq1", providerName: "CMC Vellore", programName: "NEQAS — Biochemistry & Hematology", enrollmentNo: "CMC-NEQAS-GJ-2026-0441", validUntil: "2027-03-31", frequency: "Quarterly", lastParticipationDate: "2026-09-15", lastZScore: "0.32", isActive: true },
  { id: "eq2", providerName: "AIIMS New Delhi", programName: "EQAS — Clinical Microbiology", enrollmentNo: "AIIMS-EQA-MICRO-2026-019", validUntil: "2027-03-31", frequency: "Quarterly", lastParticipationDate: "2026-08-20", lastZScore: "0.58", isActive: true },
  { id: "eq3", providerName: "Bio-Rad Laboratories", programName: "EQAS Unity — Chemistry & Immunoassay", enrollmentNo: "BIORAD-IN-2026-88412", validUntil: "2026-12-31", frequency: "Monthly", lastParticipationDate: "2026-10-01", lastZScore: "0.12", isActive: true },
];

const DEFAULT_TUBE_COLORS: TubeColorCode[] = [
  { color: "EDTA Purple / Lavender", colorHex: "#9B59B6", additive: "K₂EDTA / K₃EDTA (1.8 mg/mL)", use: "CBC, Hematology, HbA1c, Blood Group", volumeMl: 3, inversion: 8, storageTemp: "2–8°C (within 4h)" },
  { color: "Sodium Citrate Blue", colorHex: "#3498DB", additive: "3.2% Sodium Citrate (9:1 blood:citrate)", use: "PT/INR, APTT, Fibrinogen, D-Dimer", volumeMl: 2.7, inversion: 4, storageTemp: "RT — process within 4h" },
  { color: "SST Gold / Yellow Gel", colorHex: "#F1C40F", additive: "Clot activator + Gel separator (SST)", use: "Biochemistry, Serology, Hormones, TFT", volumeMl: 5, inversion: 5, storageTemp: "Centrifuge within 30 min" },
  { color: "Fluoride Oxalate Grey", colorHex: "#95A5A6", additive: "NaF + K₂C₂O₄ (Glycolysis inhibitor)", use: "Glucose (FBS/PPBS), Lactate, Ethanol", volumeMl: 2, inversion: 8, storageTemp: "RT — stable 24h" },
  { color: "Plain Red (No Additive)", colorHex: "#E74C3C", additive: "None (clot activator in some brands)", use: "Serology (VDRL, Widal), Drug levels", volumeMl: 5, inversion: 5, storageTemp: "Process after full clot (30 min)" },
  { color: "Heparin Green", colorHex: "#2ECC71", additive: "Li-Heparin or Na-Heparin (plasma)", use: "Electrolytes (stat), Ammonia, Plasma chemistry", volumeMl: 4, inversion: 8, storageTemp: "Process within 2h" },
  { color: "CTAD Blue (Special)", colorHex: "#1ABC9C", additive: "Citrate + Theophylline + Adenosine + Dipyridamole", use: "Platelet function, Flow cytometry", volumeMl: 2.7, inversion: 3, storageTemp: "Process within 4h" },
];

const DEFAULT_DATA: DiagnosticGovernanceData = {
  nablCertificateNo: "MC-4819",
  nablValidFrom: "2024-01-15",
  nablValidUntil: "2028-01-14",
  nablScopeOfTesting: "Biochemistry (Clinical Chemistry, Immunoassay, Drug Monitoring), Hematology & Coagulation, Clinical Microbiology (Bacteriology, Mycology), Histopathology & Cytopathology, Molecular Biology (RT-PCR, NAAT)",
  nablStatus: "ACTIVE",
  nabhCertificateNo: "NABH-H-NH-2026-0412",
  nabhValidUntil: "2028-06-30",
  isoCertification: "ISO 15189:2022",
  capNumber: "CAP-729108",
  icmrId: "ICMR-RTPCR-GJ-0812",
  cliaId: "CLIA-99D21048",
  westgardStrictMode: true,
  westgardRules: DEFAULT_WESTGARD_RULES,
  iqcRunFrequency: "EACH_RUN",
  leveyJenningsEnabled: true,
  iqcHoldOnRuleViolation: true,
  eqasProviders: DEFAULT_EQAS_PROVIDERS,
  panicSlaMinutes: 15,
  panicEscalationEnabled: true,
  panicEscalationTierMinutes: 30,
  panicTelephonyMandatory: true,
  criticalValueThresholds: DEFAULT_CRITICAL_VALUES,
  deltaCheckEnabled: true,
  deltaCheckWindowHours: 72,
  deltaCheckDefaultPercent: 25,
  deltaCheckAction: "FLAG",
  barcodeSymbology: "CODE128",
  accessionPrefix: "SMP-26-",
  accessionYearSuffix: true,
  accessionSequenceLength: 5,
  tubeColorCodes: DEFAULT_TUBE_COLORS,
  statTatMinutes: 60,
  routineTatHours: 6,
  urgentTatHours: 2,
  reportingCutoffTime: "21:00",
  requireDualSignoff: true,
  dualSignoffForHistopath: true,
  juniorEntryRole: "LAB_TECHNICIAN",
  seniorApprovalRole: "SENIOR_PATHOLOGIST",
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface DiagnosticGovernanceProps {
  subSection?: string;
  initialValues?: Partial<DiagnosticGovernanceData>;
  saving?: boolean;
  onSave?: (data: DiagnosticGovernanceData) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DiagnosticGovernanceSettings({
  subSection = "diagnostic-accreditation",
  initialValues,
  saving = false,
  onSave,
  onDirtyChange,
}: DiagnosticGovernanceProps) {
  const [data, setData] = useState<DiagnosticGovernanceData>({
    ...DEFAULT_DATA,
    ...initialValues,
  });

  const update = useCallback(
    <K extends keyof DiagnosticGovernanceData>(
      key: K,
      value: DiagnosticGovernanceData[K]
    ) => {
      setData((prev) => {
        const next = { ...prev, [key]: value };
        onDirtyChange?.(true);
        return next;
      });
    },
    [onDirtyChange]
  );

  // ── Render based on subSection ────────────────────────────
  const renderSection = () => {
    switch (subSection) {
      case "diagnostic-accreditation":
        return <AccreditationSection data={data} update={update} />;
      case "diagnostic-iqc":
        return <IQCWestgardSection data={data} update={update} />;
      case "diagnostic-eqas":
        return <EQASSection data={data} update={update} />;
      case "diagnostic-panic":
        return <PanicCriticalSection data={data} update={update} />;
      case "diagnostic-delta":
        return <DeltaCheckSection data={data} update={update} />;
      case "diagnostic-barcode":
        return <BarcodeSpecimenSection data={data} update={update} />;
      case "diagnostic-tat":
        return <TatWorkflowSection data={data} update={update} />;
      default:
        return <AccreditationSection data={data} update={update} />;
    }
  };

  return <div className="space-y-5">{renderSection()}</div>;
}

// ─── Section: Accreditation & NABL/NABH ──────────────────────────────────────
function AccreditationSection({
  data,
  update,
}: {
  data: DiagnosticGovernanceData;
  update: <K extends keyof DiagnosticGovernanceData>(k: K, v: DiagnosticGovernanceData[K]) => void;
}) {
  const statusCls = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    EXPIRED: "bg-red-50 text-red-700 border-red-200",
    SUSPENDED: "bg-amber-50 text-amber-700 border-amber-200",
    APPLIED: "bg-sky-50 text-sky-700 border-sky-200",
  }[data.nablStatus];

  const daysLeft = Math.ceil(
    (new Date(data.nablValidUntil).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <>
      {/* NABL Status Banner */}
      <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${statusCls}`}>
        <Award className="h-5 w-5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold">NABL Accreditation Status: {data.nablStatus}</p>
          <p className="text-xs opacity-80">
            Certificate No. {data.nablCertificateNo} • Valid until {data.nablValidUntil}
            {daysLeft > 0 ? ` (${daysLeft} days remaining)` : " (Expired)"}
          </p>
        </div>
        {data.nablStatus === "ACTIVE" && (
          <CheckCircle2 className="h-5 w-5 shrink-0" />
        )}
        {data.nablStatus === "EXPIRED" && (
          <AlertTriangle className="h-5 w-5 shrink-0" />
        )}
      </div>

      {/* NABL */}
      <SectionCard
        title="NABL (ISO 15189:2022) Accreditation"
        description="National Accreditation Board for Testing and Calibration Laboratories. ISO 15189:2022 medical laboratory quality standard."
        icon={Award}
        badge="NABL"
        badgeColor="emerald"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel label="NABL Certificate Number" required />
            <input
              className={INPUT_CLS}
              value={data.nablCertificateNo}
              onChange={(e) => update("nablCertificateNo", e.target.value)}
              placeholder="MC-XXXX"
            />
          </div>
          <div>
            <FieldLabel label="Accreditation Status" required />
            <div className="relative">
              <select
                className={SELECT_CLS}
                value={data.nablStatus}
                onChange={(e) =>
                  update(
                    "nablStatus",
                    e.target.value as DiagnosticGovernanceData["nablStatus"]
                  )
                }
              >
                <option value="ACTIVE">Active — Accredited</option>
                <option value="APPLIED">Applied / Under Assessment</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="EXPIRED">Expired</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <FieldLabel label="Valid From" required />
            <input
              type="date"
              className={INPUT_CLS}
              value={data.nablValidFrom}
              onChange={(e) => update("nablValidFrom", e.target.value)}
            />
          </div>
          <div>
            <FieldLabel label="Valid Until" required />
            <input
              type="date"
              className={INPUT_CLS}
              value={data.nablValidUntil}
              onChange={(e) => update("nablValidUntil", e.target.value)}
            />
          </div>
          <div>
            <FieldLabel label="ISO Certification" />
            <input
              className={INPUT_CLS}
              value={data.isoCertification}
              onChange={(e) => update("isoCertification", e.target.value)}
              placeholder="ISO 15189:2022"
            />
          </div>
          <div>
            <FieldLabel label="IQC Run Frequency" hint="How often to run internal QC controls" />
            <div className="relative">
              <select
                className={SELECT_CLS}
                value={data.iqcRunFrequency}
                onChange={(e) =>
                  update(
                    "iqcRunFrequency",
                    e.target.value as DiagnosticGovernanceData["iqcRunFrequency"]
                  )
                }
              >
                <option value="EACH_RUN">Each Analytical Run</option>
                <option value="SHIFT_WISE">Shift-wise (Morning / Evening / Night)</option>
                <option value="DAILY">Once Daily</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <FieldLabel label="NABL Scope of Testing" hint="Disciplines and test categories covered by the accreditation certificate" />
            <textarea
              className={`${INPUT_CLS} min-h-[80px] resize-y`}
              value={data.nablScopeOfTesting}
              onChange={(e) => update("nablScopeOfTesting", e.target.value)}
              placeholder="Biochemistry, Hematology, Microbiology..."
            />
          </div>
        </div>
      </SectionCard>

      {/* NABH & Other Credentials */}
      <SectionCard
        title="NABH & Other Statutory Accreditations"
        description="NABH hospital accreditation, CAP (USA), ICMR RTPCR designation, CLIA certification."
        icon={CheckCircle2}
        badgeColor="emerald"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel label="NABH Certificate No." />
            <input
              className={INPUT_CLS}
              value={data.nabhCertificateNo}
              onChange={(e) => update("nabhCertificateNo", e.target.value)}
              placeholder="NABH-H-NH-XXXX-XXXX"
            />
          </div>
          <div>
            <FieldLabel label="NABH Valid Until" />
            <input
              type="date"
              className={INPUT_CLS}
              value={data.nabhValidUntil}
              onChange={(e) => update("nabhValidUntil", e.target.value)}
            />
          </div>
          <div>
            <FieldLabel label="CAP Number" hint="College of American Pathologists accreditation number" />
            <input
              className={INPUT_CLS}
              value={data.capNumber}
              onChange={(e) => update("capNumber", e.target.value)}
              placeholder="CAP-XXXXXX"
            />
          </div>
          <div>
            <FieldLabel label="ICMR RTPCR Designation ID" />
            <input
              className={INPUT_CLS}
              value={data.icmrId}
              onChange={(e) => update("icmrId", e.target.value)}
              placeholder="ICMR-RTPCR-STATE-XXXX"
            />
          </div>
          <div>
            <FieldLabel label="CLIA ID" hint="Clinical Laboratory Improvement Amendments (US)" />
            <input
              className={INPUT_CLS}
              value={data.cliaId}
              onChange={(e) => update("cliaId", e.target.value)}
              placeholder="CLIA-XXXXXXXXX"
            />
          </div>
        </div>
      </SectionCard>

      {/* TAT Configuration */}
      <SectionCard
        title="Turnaround Time (TAT) Standards"
        description="Minimum reporting time commitments per priority level as per NABL and clinical SLA requirements."
        icon={Clock}
        badgeColor="sky"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <FieldLabel label="STAT / Emergency TAT" hint="Maximum time to result for STAT orders" />
            <div className="flex items-center gap-2">
              <input
                type="number"
                className={INPUT_CLS}
                value={data.statTatMinutes}
                onChange={(e) => update("statTatMinutes", Number(e.target.value))}
                min={15}
                max={240}
              />
              <span className="text-xs text-slate-500 shrink-0">min</span>
            </div>
          </div>
          <div>
            <FieldLabel label="Urgent TAT" />
            <div className="flex items-center gap-2">
              <input
                type="number"
                className={INPUT_CLS}
                value={data.urgentTatHours}
                onChange={(e) => update("urgentTatHours", Number(e.target.value))}
                min={1}
                max={12}
              />
              <span className="text-xs text-slate-500 shrink-0">hrs</span>
            </div>
          </div>
          <div>
            <FieldLabel label="Routine TAT" />
            <div className="flex items-center gap-2">
              <input
                type="number"
                className={INPUT_CLS}
                value={data.routineTatHours}
                onChange={(e) => update("routineTatHours", Number(e.target.value))}
                min={1}
                max={48}
              />
              <span className="text-xs text-slate-500 shrink-0">hrs</span>
            </div>
          </div>
          <div>
            <FieldLabel label="Daily Report Cutoff" hint="Last time to accept samples for same-day reporting" />
            <input
              type="time"
              className={INPUT_CLS}
              value={data.reportingCutoffTime}
              onChange={(e) => update("reportingCutoffTime", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <Toggle
            checked={data.requireDualSignoff}
            onChange={(v) => update("requireDualSignoff", v)}
            label="Require Dual-Level Sign-off Before Report Release"
            description="Junior technician preliminary entry + Senior pathologist final authorization. Mandatory for histopathology."
          />
          <Toggle
            checked={data.dualSignoffForHistopath}
            onChange={(v) => update("dualSignoffForHistopath", v)}
            label="Enforce Mandatory Dual Sign-off for Histopathology & Cytopathology"
            description="NABL requirement: All tissue and cytology reports must carry two qualified pathologist signatures."
          />
        </div>
      </SectionCard>
    </>
  );
}

// ─── Section: IQC & Westgard Rules ───────────────────────────────────────────
function IQCWestgardSection({
  data,
  update,
}: {
  data: DiagnosticGovernanceData;
  update: <K extends keyof DiagnosticGovernanceData>(k: K, v: DiagnosticGovernanceData[K]) => void;
}) {
  const updateRule = (
    idx: number,
    field: keyof WestgardRule,
    value: WestgardRule[keyof WestgardRule]
  ) => {
    const updated = data.westgardRules.map((r, i) =>
      i === idx ? { ...r, [field]: value } : r
    );
    update("westgardRules", updated);
  };

  const ruleLabels: Record<string, string> = {
    "1_2s": "1₂ₛ",
    "1_3s": "1₃ₛ",
    "2_2s": "2₂ₛ",
    "R_4s": "R₄ₛ",
    "4_1s": "4₁ₛ",
    "10x": "10ₓ",
    "7T": "7ₜ",
    "6x": "6ₓ",
  };

  return (
    <>
      <SectionCard
        title="Internal Quality Control (IQC) Configuration"
        description="Global IQC settings governing how Levey-Jennings analysis and Westgard multi-rules are applied to each analytical run."
        icon={Activity}
        badge="Westgard"
        badgeColor="emerald"
      >
        <div className="space-y-1">
          <Toggle
            checked={data.westgardStrictMode}
            onChange={(v) => update("westgardStrictMode", v)}
            label="Westgard Strict Mode"
            description="Apply all enabled Westgard rules in strict mode — any rule violation triggers immediate run-hold or rejection."
          />
          <Toggle
            checked={data.leveyJenningsEnabled}
            onChange={(v) => update("leveyJenningsEnabled", v)}
            label="Levey-Jennings Chart Generation"
            description="Auto-generate LJ chart PDFs for NABL assessment. Charts stored for minimum 2 years per ISO 15189:2022."
          />
          <Toggle
            checked={data.iqcHoldOnRuleViolation}
            onChange={(v) => update("iqcHoldOnRuleViolation", v)}
            label="Auto-Hold Analyzer Results on IQC Rule Violation"
            description="Pending patient results are withheld from release until QC corrective action is documented and accepted."
          />
        </div>
      </SectionCard>

      {/* Westgard Rules Matrix */}
      <SectionCard
        title="Westgard Multi-Rule Configuration Matrix"
        description="Configure warning vs rejection behavior for each rule. Rejection rules prevent report release; warnings alert the analyst without holding."
        icon={Activity}
        badgeColor="emerald"
      >
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2.5 text-left font-bold text-slate-700 uppercase tracking-wide w-16">Rule</th>
                <th className="px-3 py-2.5 text-left font-bold text-slate-700 uppercase tracking-wide">Description</th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-700 uppercase tracking-wide w-20">Action</th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-700 uppercase tracking-wide w-16">Enabled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.westgardRules.map((rule, idx) => (
                <tr
                  key={rule.rule}
                  className={`transition-colors ${rule.enabled ? "bg-white" : "bg-slate-50/60"}`}
                >
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-black font-mono ${
                        rule.action === "REJECT"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {ruleLabels[rule.rule] || rule.rule}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{rule.description}</td>
                  <td className="px-3 py-2.5">
                    <div className="relative">
                      <select
                        className="w-full rounded border border-slate-300 bg-white py-1 px-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none appearance-none"
                        value={rule.action}
                        onChange={(e) =>
                          updateRule(idx, "action", e.target.value as WestgardRule["action"])
                        }
                      >
                        <option value="WARNING">Warning</option>
                        <option value="REJECT">Reject</option>
                        <option value="HOLD">Hold</option>
                      </select>
                      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => updateRule(idx, "enabled", !rule.enabled)}
                      className={`transition-colors ${rule.enabled ? "text-sky-600" : "text-slate-300"}`}
                    >
                      {rule.enabled ? (
                        <ToggleRight className="h-5 w-5" />
                      ) : (
                        <ToggleLeft className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
          <Info className="h-3 w-3 shrink-0" />
          Per NABL (ISO 15189:2022) Clause 7.7: At minimum, 1₃ₛ and R₄ₛ rejection rules must be enabled. Warning rules may be used at laboratory's discretion.
        </p>
      </SectionCard>
    </>
  );
}

// ─── Section: EQAS ───────────────────────────────────────────────────────────
function EQASSection({
  data,
  update,
}: {
  data: DiagnosticGovernanceData;
  update: <K extends keyof DiagnosticGovernanceData>(k: K, v: DiagnosticGovernanceData[K]) => void;
}) {
  const addProvider = () => {
    const newProvider: EQASProvider = {
      id: `eq${Date.now()}`,
      providerName: "",
      programName: "",
      enrollmentNo: "",
      validUntil: "",
      frequency: "Quarterly",
      lastParticipationDate: "",
      lastZScore: "",
      isActive: true,
    };
    update("eqasProviders", [...data.eqasProviders, newProvider]);
  };

  const updateProvider = (
    id: string,
    field: keyof EQASProvider,
    value: EQASProvider[keyof EQASProvider]
  ) => {
    update(
      "eqasProviders",
      data.eqasProviders.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const removeProvider = (id: string) => {
    update(
      "eqasProviders",
      data.eqasProviders.filter((p) => p.id !== id)
    );
  };

  return (
    <SectionCard
      title="EQAS / Proficiency Testing Programme (PT) Enrolment"
      description="External Quality Assurance Scheme enrolment details. NABL mandates participation in at least 2 PT cycles per year per discipline. Z-score |Z| ≤ 2.0 required for NABL compliance."
      icon={Microscope}
      badge="EQAS Mandatory"
      badgeColor="emerald"
    >
      <div className="space-y-4">
        {data.eqasProviders.map((provider) => {
          const zScore = parseFloat(provider.lastZScore);
          const zGood = !isNaN(zScore) && Math.abs(zScore) <= 2.0;
          const zColor = !isNaN(zScore)
            ? Math.abs(zScore) <= 2.0
              ? "text-emerald-600 bg-emerald-50 border-emerald-200"
              : "text-red-600 bg-red-50 border-red-200"
            : "text-slate-500 bg-slate-50 border-slate-200";

          return (
            <div
              key={provider.id}
              className={`rounded-lg border ${provider.isActive ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50/60"} overflow-hidden`}
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/40">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    {provider.providerName || "New Provider"}
                  </span>
                  {provider.lastZScore && (
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-bold font-mono ${zColor}`}
                    >
                      Z={provider.lastZScore}
                      {zGood ? " ✓" : " ⚠"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateProvider(provider.id, "isActive", !provider.isActive)}
                    className={`text-[10px] font-bold rounded px-2 py-0.5 border ${
                      provider.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {provider.isActive ? "Active" : "Inactive"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProvider(provider.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <FieldLabel label="EQAS Provider Name" required />
                  <input
                    className={INPUT_CLS}
                    value={provider.providerName}
                    onChange={(e) => updateProvider(provider.id, "providerName", e.target.value)}
                    placeholder="e.g. CMC Vellore, Bio-Rad"
                  />
                </div>
                <div>
                  <FieldLabel label="Programme Name" />
                  <input
                    className={INPUT_CLS}
                    value={provider.programName}
                    onChange={(e) => updateProvider(provider.id, "programName", e.target.value)}
                    placeholder="NEQAS — Biochemistry"
                  />
                </div>
                <div>
                  <FieldLabel label="Enrolment Number" required />
                  <input
                    className={INPUT_CLS}
                    value={provider.enrollmentNo}
                    onChange={(e) => updateProvider(provider.id, "enrollmentNo", e.target.value)}
                    placeholder="Enrolment ID"
                  />
                </div>
                <div>
                  <FieldLabel label="Frequency" />
                  <div className="relative">
                    <select
                      className={SELECT_CLS}
                      value={provider.frequency}
                      onChange={(e) => updateProvider(provider.id, "frequency", e.target.value)}
                    >
                      <option>Monthly</option>
                      <option>Bi-monthly</option>
                      <option>Quarterly</option>
                      <option>Semi-Annual</option>
                      <option>Annual</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <FieldLabel label="Last Participation Date" />
                  <input
                    type="date"
                    className={INPUT_CLS}
                    value={provider.lastParticipationDate}
                    onChange={(e) => updateProvider(provider.id, "lastParticipationDate", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel label="Last Z-Score" hint="Target: |Z| ≤ 2.0. Warning at |Z| > 2.0, Unsatisfactory at |Z| > 3.0" />
                  <input
                    className={INPUT_CLS}
                    value={provider.lastZScore}
                    onChange={(e) => updateProvider(provider.id, "lastZScore", e.target.value)}
                    placeholder="e.g. 0.32"
                  />
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addProvider}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-sky-400 hover:text-sky-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add EQAS Provider
        </button>

        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            <strong>NABL Clause 7.7.3 (PT):</strong> All NABL-accredited disciplines must participate in at least 2 EQAS cycles per year. PT reports with |Z| &gt; 2.0 must have documented corrective actions within 30 days. Non-participation may trigger surveillance assessment.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Section: Panic / Critical Values ────────────────────────────────────────
function PanicCriticalSection({
  data,
  update,
}: {
  data: DiagnosticGovernanceData;
  update: <K extends keyof DiagnosticGovernanceData>(k: K, v: DiagnosticGovernanceData[K]) => void;
}) {
  const updateThreshold = (
    id: string,
    field: keyof CriticalValueThreshold,
    value: CriticalValueThreshold[keyof CriticalValueThreshold]
  ) => {
    update(
      "criticalValueThresholds",
      data.criticalValueThresholds.map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      )
    );
  };

  const addThreshold = () => {
    const newT: CriticalValueThreshold = {
      id: `cv${Date.now()}`,
      analyte: "",
      unit: "",
      criticalLow: null,
      criticalHigh: null,
      panicLow: null,
      panicHigh: null,
      department: "Biochemistry",
      notifyMethod: "ALL",
      escalationMinutes: 15,
    };
    update("criticalValueThresholds", [...data.criticalValueThresholds, newT]);
  };

  const removeThreshold = (id: string) => {
    update(
      "criticalValueThresholds",
      data.criticalValueThresholds.filter((t) => t.id !== id)
    );
  };

  return (
    <>
      {/* SLA Configuration */}
      <SectionCard
        title="Panic / Critical Value Notification SLA"
        description="Mandatory telephonic notification protocol for life-threatening result values. Every critical result must be communicated to a clinician within the SLA window and documented in the notification log."
        icon={AlertCircle}
        badge="Patient Safety"
        badgeColor="red"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <FieldLabel label="Primary SLA — Notify Within" hint="Time from result validation to clinician notification. NABL requires ≤ 30 min; best practice ≤ 15 min." required />
            <div className="flex items-center gap-2">
              <input
                type="number"
                className={INPUT_CLS}
                value={data.panicSlaMinutes}
                onChange={(e) => update("panicSlaMinutes", Number(e.target.value))}
                min={5}
                max={60}
              />
              <span className="text-xs text-slate-500 shrink-0">minutes</span>
            </div>
          </div>
          <div>
            <FieldLabel label="Escalation Tier (HOD Alert)" hint="If primary notification unanswered, escalate to Dept Head after N minutes" />
            <div className="flex items-center gap-2">
              <input
                type="number"
                className={INPUT_CLS}
                value={data.panicEscalationTierMinutes}
                onChange={(e) => update("panicEscalationTierMinutes", Number(e.target.value))}
                min={15}
                max={120}
              />
              <span className="text-xs text-slate-500 shrink-0">minutes</span>
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <div className="space-y-1 border border-slate-200 rounded-md p-3 bg-slate-50/40">
              <Toggle
                checked={data.panicEscalationEnabled}
                onChange={(v) => update("panicEscalationEnabled", v)}
                label="Enable Auto-Escalation Timer"
                description="Automatically notify HOD if SLA breach is imminent"
              />
              <Toggle
                checked={data.panicTelephonyMandatory}
                onChange={(v) => update("panicTelephonyMandatory", v)}
                label="Mandatory Telephonic Notification Log"
                description="Lab staff must log: whom they called, time, and read-back confirmation"
              />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 p-3">
          <Phone className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">
            <strong>Regulatory Requirement:</strong> Per NABL ISO 15189:2022 Clause 7.4.1.5, critical values must be immediately communicated to the requesting physician or authorized clinical personnel with documented read-back verification. Failure to comply is a Major Non-Conformity during NABL surveillance.
          </p>
        </div>
      </SectionCard>

      {/* Critical Value Threshold Master */}
      <SectionCard
        title="Critical Value Threshold Master"
        description="Configure the numeric threshold boundaries that trigger the panic notification workflow. Include Biochemistry, Hematology, and Coagulation critical values."
        icon={AlertCircle}
        badgeColor="red"
      >
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2.5 text-left font-bold text-slate-700 uppercase tracking-wide">Analyte</th>
                <th className="px-3 py-2.5 text-left font-bold text-slate-700 uppercase tracking-wide w-20">Unit</th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-700 uppercase tracking-wide w-20 text-amber-700 bg-amber-50/50">Crit. Low</th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-700 uppercase tracking-wide w-20 text-amber-700 bg-amber-50/50">Crit. High</th>
                <th className="px-3 py-2.5 text-center font-bold text-red-700 uppercase tracking-wide w-20 bg-red-50/50">Panic Low</th>
                <th className="px-3 py-2.5 text-center font-bold text-red-700 uppercase tracking-wide w-20 bg-red-50/50">Panic High</th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-700 uppercase tracking-wide w-24">Notify</th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-700 uppercase tracking-wide w-16">SLA (m)</th>
                <th className="px-3 py-2.5 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.criticalValueThresholds.map((threshold) => (
                <tr key={threshold.id} className="bg-white hover:bg-slate-50/50">
                  <td className="px-3 py-2">
                    <input
                      className="w-full min-w-[140px] rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                      value={threshold.analyte}
                      onChange={(e) => updateThreshold(threshold.id, "analyte", e.target.value)}
                      placeholder="Analyte name"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                      value={threshold.unit}
                      onChange={(e) => updateThreshold(threshold.id, "unit", e.target.value)}
                    />
                  </td>
                  {(["criticalLow", "criticalHigh", "panicLow", "panicHigh"] as const).map((field) => (
                    <td key={field} className={`px-3 py-2 ${field.startsWith("panic") ? "bg-red-50/20" : "bg-amber-50/20"}`}>
                      <input
                        type="number"
                        className={`w-full rounded border px-2 py-1 text-xs text-center font-mono focus:outline-none focus:ring-0 ${
                          field.startsWith("panic")
                            ? "border-red-200 bg-red-50/40 focus:border-red-400"
                            : "border-amber-200 bg-amber-50/40 focus:border-amber-400"
                        }`}
                        value={threshold[field] ?? ""}
                        onChange={(e) =>
                          updateThreshold(threshold.id, field, e.target.value === "" ? null : Number(e.target.value))
                        }
                        placeholder="—"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <div className="relative">
                      <select
                        className="w-full rounded border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-800 focus:border-sky-500 focus:outline-none appearance-none"
                        value={threshold.notifyMethod}
                        onChange={(e) =>
                          updateThreshold(threshold.id, "notifyMethod", e.target.value as CriticalValueThreshold["notifyMethod"])
                        }
                      >
                        <option value="ALL">All Channels</option>
                        <option value="PHONE">Phone Only</option>
                        <option value="SMS">SMS</option>
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="PAGER">Pager</option>
                      </select>
                      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-center font-mono focus:border-sky-500 focus:outline-none"
                      value={threshold.escalationMinutes}
                      onChange={(e) => updateThreshold(threshold.id, "escalationMinutes", Number(e.target.value))}
                      min={5}
                      max={60}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => removeThreshold(threshold.id)}
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
          onClick={addThreshold}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-2.5 text-xs font-medium text-slate-500 hover:border-red-400 hover:text-red-600 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Critical Value Threshold
        </button>
      </SectionCard>
    </>
  );
}

// ─── Section: Delta Check ─────────────────────────────────────────────────────
function DeltaCheckSection({
  data,
  update,
}: {
  data: DiagnosticGovernanceData;
  update: <K extends keyof DiagnosticGovernanceData>(k: K, v: DiagnosticGovernanceData[K]) => void;
}) {
  return (
    <SectionCard
      title="Delta Check Configuration"
      description="Delta check compares a patient's current result against their most recent historical result within a defined window. Sudden implausible changes may indicate sample mix-up, mislabeling, or pre-analytical error."
      icon={Zap}
      badge="Pre-analytical Safety"
      badgeColor="amber"
    >
      <div className="mb-4">
        <Toggle
          checked={data.deltaCheckEnabled}
          onChange={(v) => update("deltaCheckEnabled", v)}
          label="Enable Delta Check for All Quantitative Analytes"
          description="Automatically compare with previous result in the configured time window for all quantitative tests."
        />
      </div>

      <div className={`space-y-4 ${!data.deltaCheckEnabled ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel
              label="Comparison Window"
              hint="Compare against results within this time period. CLSI EP33 recommends 48–72 hours."
              required
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                className={INPUT_CLS}
                value={data.deltaCheckWindowHours}
                onChange={(e) => update("deltaCheckWindowHours", Number(e.target.value))}
                min={1}
                max={168}
              />
              <span className="text-xs text-slate-500 shrink-0">hours</span>
            </div>
          </div>
          <div>
            <FieldLabel
              label="Default Δ% Threshold"
              hint="Flag if current result deviates > N% from previous. Typical: 25% for stable analytes."
              required
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                className={INPUT_CLS}
                value={data.deltaCheckDefaultPercent}
                onChange={(e) => update("deltaCheckDefaultPercent", Number(e.target.value))}
                min={5}
                max={200}
              />
              <span className="text-xs text-slate-500 shrink-0">%</span>
            </div>
          </div>
          <div>
            <FieldLabel label="Action on Delta Violation" />
            <div className="relative">
              <select
                className={SELECT_CLS}
                value={data.deltaCheckAction}
                onChange={(e) =>
                  update("deltaCheckAction", e.target.value as DiagnosticGovernanceData["deltaCheckAction"])
                }
              >
                <option value="FLAG">Flag result (allow release with warning flag)</option>
                <option value="HOLD">Hold result (require supervisor review)</option>
                <option value="REJECT">Reject result (repeat specimen required)</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-1">
            <p>
              <strong>CLSI EP33-A:</strong> Analyte-specific delta limits are recommended. Below are suggested defaults:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1 font-mono text-[10px]">
              {[
                ["Sodium", "≤ 4 mmol/L"],
                ["Potassium", "≤ 0.5 mmol/L"],
                ["Creatinine", "≤ 0.3 mg/dL"],
                ["Hemoglobin", "≤ 2.0 g/dL or 25%"],
                ["WBC", "≤ 50%"],
                ["Platelets", "≤ 100,000 or 50%"],
                ["Calcium (total)", "≤ 1.0 mg/dL"],
                ["Glucose", "≤ 50% (acute setting)"],
                ["ALT/AST", "≤ 3× previous"],
              ].map(([a, v]) => (
                <div key={a} className="flex justify-between border border-amber-200 rounded px-1.5 py-0.5 bg-white/60">
                  <span className="text-amber-700 font-medium">{a}</span>
                  <span className="text-amber-600">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Section: Barcode & Specimen ─────────────────────────────────────────────
function BarcodeSpecimenSection({
  data,
  update,
}: {
  data: DiagnosticGovernanceData;
  update: <K extends keyof DiagnosticGovernanceData>(k: K, v: DiagnosticGovernanceData[K]) => void;
}) {
  return (
    <>
      <SectionCard
        title="Specimen Barcode Engine Configuration"
        description="Configure accession number format, barcode symbology, and label print settings for sample identification and chain of custody."
        icon={Barcode}
        badge="Sample Tracking"
        badgeColor="sky"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <FieldLabel label="Barcode Symbology" required />
            <div className="relative">
              <select
                className={SELECT_CLS}
                value={data.barcodeSymbology}
                onChange={(e) =>
                  update("barcodeSymbology", e.target.value as DiagnosticGovernanceData["barcodeSymbology"])
                }
              >
                <option value="CODE128">Code 128 (ISO/IEC 15417) — Universal</option>
                <option value="GS1_128">GS1-128 (EAN-128) — Healthcare standard</option>
                <option value="DATAMATRIX">DataMatrix 2D (ISO/IEC 16022)</option>
                <option value="QR_CODE">QR Code (ISO/IEC 18004)</option>
                <option value="CODE39">Code 39 — Legacy only</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              GS1-128 recommended for NABL & HIS interoperability.
            </p>
          </div>
          <div>
            <FieldLabel
              label="Accession Number Prefix"
              hint="Printed before the sequence number on the specimen label (e.g. SMP-26-00001)"
              required
            />
            <input
              className={INPUT_CLS}
              value={data.accessionPrefix}
              onChange={(e) => update("accessionPrefix", e.target.value)}
              placeholder="SMP-26-"
            />
          </div>
          <div>
            <FieldLabel label="Sequence Digit Length" hint="Zero-padded sequence length. '5' generates 00001 to 99999." />
            <input
              type="number"
              className={INPUT_CLS}
              value={data.accessionSequenceLength}
              onChange={(e) => update("accessionSequenceLength", Number(e.target.value))}
              min={4}
              max={8}
            />
          </div>
        </div>

        <div className="mt-4">
          <Toggle
            checked={data.accessionYearSuffix}
            onChange={(v) => update("accessionYearSuffix", v)}
            label="Embed Financial Year in Accession Number"
            description="Reset sequence on April 1. Example: SMP-26-00001 → SMP-27-00001 on new FY start."
          />
        </div>

        {/* Preview */}
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-1">
            Accession Number Preview
          </p>
          <code className="text-sm font-black font-mono text-slate-900">
            {data.accessionPrefix}
            {"0".repeat(Math.max(0, data.accessionSequenceLength - 1))}1
          </code>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Symbology: {data.barcodeSymbology.replace("_", "-")}
          </p>
        </div>
      </SectionCard>

      {/* Vacutainer Tube Color Master */}
      <SectionCard
        title="Vacutainer Tube Color Code Master"
        description="Standard tube color reference for phlebotomist specimen collection training, sample acceptance SOP, and chain-of-custody documentation."
        icon={Barcode}
        badge="Collection SOP"
        badgeColor="sky"
      >
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2.5 text-left font-bold text-slate-700 uppercase tracking-wide">Tube Color</th>
                <th className="px-3 py-2.5 text-left font-bold text-slate-700 uppercase tracking-wide">Additive</th>
                <th className="px-3 py-2.5 text-left font-bold text-slate-700 uppercase tracking-wide">Tests / Use</th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-700 uppercase tracking-wide w-16">Vol (mL)</th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-700 uppercase tracking-wide w-16">Inversions</th>
                <th className="px-3 py-2.5 text-left font-bold text-slate-700 uppercase tracking-wide">Storage / Handling</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.tubeColorCodes.map((tube, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded-full border border-slate-300 shrink-0"
                        style={{ backgroundColor: tube.colorHex }}
                      />
                      <span className="font-semibold text-slate-800 whitespace-nowrap">
                        {tube.color}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-600 max-w-[180px]">{tube.additive}</td>
                  <td className="px-3 py-2 text-slate-600 max-w-[200px]">{tube.use}</td>
                  <td className="px-3 py-2 text-center font-mono font-bold text-slate-800">{tube.volumeMl}</td>
                  <td className="px-3 py-2 text-center font-mono text-slate-700">{tube.inversion}×</td>
                  <td className="px-3 py-2 text-slate-500">{tube.storageTemp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2.5 text-[11px] text-slate-500 flex items-center gap-1.5">
          <Info className="h-3 w-3 shrink-0" />
          Tube color codes follow CLSI H1-A6 / GP39-A6 standard. Mix inversions immediately after collection. Do not shake tubes — gentle inversion only.
        </p>
      </SectionCard>
    </>
  );
}

// ─── Turnaround Time (TAT) & SLA Workflow Engine Section ─────────────────────
function TatWorkflowSection({
  data,
  update,
}: {
  data: DiagnosticGovernanceData;
  update: <K extends keyof DiagnosticGovernanceData>(k: K, v: DiagnosticGovernanceData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      {/* TAT Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-red-200 bg-red-50/40 p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">STAT / Emergency TAT</span>
            <span className="rounded bg-red-100 text-red-800 text-[9px] font-black px-1.5 py-0.5">ICU & Casualty</span>
          </div>
          <p className="text-2xl font-black text-red-700 mt-2">{data.statTatMinutes || 60} <span className="text-sm font-semibold">min</span></p>
          <p className="text-[11px] text-red-600/80 mt-0.5">Sample accession to approved report</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Urgent IPD Orders</span>
            <span className="rounded bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5">Ward Priority</span>
          </div>
          <p className="text-2xl font-black text-amber-800 mt-2">{data.urgentTatHours || 2} <span className="text-sm font-semibold">hours</span></p>
          <p className="text-[11px] text-amber-700/80 mt-0.5">Pre-op, OT clearance & IPD rounds</p>
        </div>

        <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Routine OPD TAT</span>
            <span className="rounded bg-sky-100 text-sky-800 text-[9px] font-black px-1.5 py-0.5">Walk-in</span>
          </div>
          <p className="text-2xl font-black text-sky-900 mt-2">{data.routineTatHours || 6} <span className="text-sm font-semibold">hours</span></p>
          <p className="text-[11px] text-sky-700/80 mt-0.5">Standard clinical chemistry & CBC</p>
        </div>
      </div>

      <SectionCard
        title="Laboratory Turnaround Time (TAT) & Clinical SLA Policy"
        description="Configure target response windows from phlebotomy accessioning to doctor sign-off. Compliance with ISO 15189:2022 Cl. 5.5.3 requires measuring and monitoring test turnaround times."
        icon={Hourglass}
        badge="ISO 15189 Cl. 5.5.3"
        badgeColor="sky"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <FieldLabel label="STAT / Emergency Target TAT" required hint="Emergency department, ICU, and resuscitation tests" />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={15}
                  max={120}
                  className={INPUT_CLS}
                  value={data.statTatMinutes || 60}
                  onChange={(e) => update("statTatMinutes", parseInt(e.target.value, 10) || 60)}
                />
                <span className="text-xs font-semibold text-slate-500 shrink-0">min</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Troponin, ABG, Potassium, D-Dimer</span>
            </div>

            <div>
              <FieldLabel label="Urgent Inpatient Priority TAT" required hint="Hospital admitted patients requiring ward round adjustments" />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={12}
                  className={INPUT_CLS}
                  value={data.urgentTatHours || 2}
                  onChange={(e) => update("urgentTatHours", parseInt(e.target.value, 10) || 2)}
                />
                <span className="text-xs font-semibold text-slate-500 shrink-0">hours</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Pre-operative profiles, Sepsis screen</span>
            </div>

            <div>
              <FieldLabel label="Routine Outpatient (OPD) Target TAT" required hint="Regular walk-in patients and wellness checks" />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={48}
                  className={INPUT_CLS}
                  value={data.routineTatHours || 6}
                  onChange={(e) => update("routineTatHours", parseInt(e.target.value, 10) || 6)}
                />
                <span className="text-xs font-semibold text-slate-500 shrink-0">hours</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">CBC, LFT, KFT, Lipid, HbA1c</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-100">
            <div>
              <FieldLabel label="Daily Same-Day Reporting Cutoff Time" required hint="Samples accessioned before this time are guaranteed same-day delivery" />
              <input
                type="time"
                className={INPUT_CLS}
                value={data.reportingCutoffTime || "19:00"}
                onChange={(e) => update("reportingCutoffTime", e.target.value)}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Samples received after cutoff rollover to next morning 08:00</span>
            </div>

            <div>
              <FieldLabel label="Out-of-TAT Escalation Alert Trigger" required hint="Warn duty pathologist before SLA breach occurs" />
              <select className={SELECT_CLS} defaultValue="75">
                <option value="50">At 50% elapsed SLA time (Early warning)</option>
                <option value="75">At 75% elapsed SLA time (Standard threshold)</option>
                <option value="90">At 90% elapsed SLA time (Critical threshold)</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">Fires automated visual banner on technician bench workstation</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Dual Medical Verification & Clinical Authorization Rules"
        description="Configure peer-review policies requiring secondary sign-off from a Senior Pathologist before reports can be released."
        icon={FileSignature}
        badge="NABL Audit Mandate"
        badgeColor="emerald"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <Toggle
              checked={data.requireDualSignoff}
              onChange={(v) => update("requireDualSignoff", v)}
              label="Enforce Dual Sign-off for High-Volume Laboratory Batches"
              description="Requires Junior Resident / Senior Resident preliminary review followed by Consultant Pathologist final authentication"
            />
            <Toggle
              checked={data.dualSignoffForHistopath}
              onChange={(v) => update("dualSignoffForHistopath", v)}
              label="Mandatory Peer Sign-off for Histopathology Malignancy Diagnoses"
              description="All positive malignant biopsy reports must be corroborated by a second qualified Pathologist (NABL recommendation)"
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
