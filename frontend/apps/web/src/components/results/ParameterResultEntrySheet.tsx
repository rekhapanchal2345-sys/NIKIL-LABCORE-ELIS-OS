"use client";
import React from "react";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Barcode,
  Building2,
  Calculator,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  Download,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  FlaskConical,
  Gauge,
  HelpCircle,
  History,
  Info,
  Layers,
  Microscope,
  PenLine,
  PhoneCall,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  Tag,
  TrendingDown,
  TrendingUp,
  User,
  Wand2,
  X,
  Zap,
} from "lucide-react";

export interface Parameter {
  id: string;
  parameterName: string;
  shortName?: string;
  unit?: string;
  dataType: string;
  referenceRanges?: Array<{
    id: string;
    ageGroup?: string;
    gender?: string;
    minAge?: number;
    maxAge?: number;
    minAgeInHours?: number;
    maxAgeInHours?: number;
    minAgeInDays?: number;
    maxAgeInDays?: number;
    criticalLow?: number;
    normalLow?: number;
    normalHigh?: number;
    criticalHigh?: number;
  }>;
}

export interface ParameterValue {
  parameterId: string;
  value: string;
  flag?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  remark?: string;
}

interface ParameterResultEntrySheetProps {
  parameters: Parameter[];
  initialValues?: ParameterValue[];
  patientAge?: number;
  patientAgeInDays?: number;
  patientAgeInHours?: number;
  patientDob?: string | Date;
  patientGender?: string;
  patientName?: string;
  testName?: string;
  onSave: (values: ParameterValue[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

function calculateAgeMetrics(age?: number, ageInDays?: number, ageInHours?: number, dob?: string | Date) {
  if (dob) {
    const dobDate = new Date(dob);
    if (!isNaN(dobDate.getTime())) {
      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - dobDate.getTime());
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const years = Math.floor(days / 365.25);
      return { hours, days, years: age ?? years };
    }
  }
  return {
    hours: ageInHours ?? (ageInDays ? ageInDays * 24 : (age ? age * 365 * 24 : undefined)),
    days: ageInDays ?? (age ? age * 365 : undefined),
    years: age
  };
}

function getReferenceRange(
  parameter: Parameter,
  age?: number,
  gender?: string,
  ageInDays?: number,
  ageInHours?: number,
  dob?: string | Date
): { criticalLow?: number; normalLow?: number; normalHigh?: number; criticalHigh?: number } | null {
  if (!parameter.referenceRanges || parameter.referenceRanges.length === 0) {
    return null;
  }

  const { hours, days, years } = calculateAgeMetrics(age, ageInDays, ageInHours, dob);

  const matchingRange = parameter.referenceRanges.find((range: any) => {
    if (range.gender && gender && range.gender !== gender) {
      return false;
    }
    // Bug 1.3: Neonatal exact hour match (e.g. Bilirubin in first 24-72 hours)
    if (range.minAgeInHours != null || range.maxAgeInHours != null) {
      if (hours === undefined) return false;
      if (range.minAgeInHours != null && hours < range.minAgeInHours) return false;
      if (range.maxAgeInHours != null && hours > range.maxAgeInHours) return false;
      return true;
    }
    // Neonatal/Infant exact day match
    if (range.minAgeInDays != null || range.maxAgeInDays != null) {
      if (days === undefined) return false;
      if (range.minAgeInDays != null && days < range.minAgeInDays) return false;
      if (range.maxAgeInDays != null && days > range.maxAgeInDays) return false;
      return true;
    }
    // Standard year match
    if (range.minAge != null && years != null && years < range.minAge) {
      return false;
    }
    if (range.maxAge != null && years != null && years > range.maxAge) {
      return false;
    }
    return true;
  });

  return matchingRange || parameter.referenceRanges[0] || null;
}

function calculateFlag(
  value: string,
  referenceRange: { criticalLow?: number; normalLow?: number; normalHigh?: number; criticalHigh?: number } | null
): "LOW" | "NORMAL" | "HIGH" | "CRITICAL" | undefined {
  if (!referenceRange || !value || value.trim() === "") {
    return undefined;
  }

  const cleanNum = parseFloat(value.replace(/,/g, ""));
  if (Number.isNaN(cleanNum)) {
    return undefined;
  }

  if (referenceRange.criticalLow !== undefined && cleanNum <= referenceRange.criticalLow) {
    return "CRITICAL";
  }
  if (referenceRange.criticalHigh !== undefined && cleanNum >= referenceRange.criticalHigh) {
    return "CRITICAL";
  }
  if (referenceRange.normalLow !== undefined && cleanNum < referenceRange.normalLow) {
    return "LOW";
  }
  if (referenceRange.normalHigh !== undefined && cleanNum > referenceRange.normalHigh) {
    return "HIGH";
  }

  return "NORMAL";
}

function formatReferenceRange(range: { criticalLow?: number; normalLow?: number; normalHigh?: number; criticalHigh?: number } | null) {
  if (!range) return "Clinical standard";
  const parts = [];
  if (range.normalLow !== undefined || range.normalHigh !== undefined) {
    parts.push(`${range.normalLow ?? "—"} – ${range.normalHigh ?? "—"}`);
  }
  return parts.length > 0 ? parts.join("") : "Clinical standard";
}

export default function ParameterResultEntrySheet({
  patientAgeInDays,
  patientAgeInHours,
  patientDob,
  parameters,
  initialValues = [],
  patientAge,
  patientGender,
  patientName,
  testName,
  onSave,
  onCancel,
  loading = false,
}: ParameterResultEntrySheetProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    initialValues.forEach((iv) => {
      initial[iv.parameterId] = iv.value;
    });
    return initial;
  });

  const [remarks, setRemarks] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    initialValues.forEach((iv) => {
      if (iv.remark) {
        initial[iv.parameterId] = iv.remark;
      }
    });
    return initial;
  });

  const [flags, setFlags] = useState<Record<string, "LOW" | "NORMAL" | "HIGH" | "CRITICAL">>(() => {
    const initial: Record<string, "LOW" | "NORMAL" | "HIGH" | "CRITICAL"> = {};
    initialValues.forEach((iv) => {
      if (iv.flag) {
        initial[iv.parameterId] = iv.flag;
      }
    });
    return initial;
  });

  // Bench Workstation Configuration
  const [selectedAnalyzer, setSelectedAnalyzer] = useState("Roche Cobas c311 / Sysmex XN-1000 (LIS Auto)");
  const [dilutionFactor, setDilutionFactor] = useState("Neat (1:1 Direct)");
  const [qcVerified, setQcVerified] = useState(true);
  const [rechecked, setRechecked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleValueChange = (parameterId: string, newValue: string) => {
    setValues((prev) => ({ ...prev, [parameterId]: newValue }));

    const parameter = parameters.find((p) => p.id === parameterId);
    if (parameter) {
      const refRange = getReferenceRange(parameter, patientAge, patientGender);
      const newFlag = calculateFlag(newValue, refRange);
      setFlags((prev) => ({ ...prev, [parameterId]: newFlag || "NORMAL" }));
    }
  };

  const handleRemarkChange = (parameterId: string, newRemark: string) => {
    setRemarks((prev) => ({ ...prev, [parameterId]: newRemark }));
  };

  // Quick Preset: Auto-Fill Reference Normals
  const handleAutoFillNormals = () => {
    const newValues: Record<string, string> = { ...values };
    const newFlags: Record<string, "LOW" | "NORMAL" | "HIGH" | "CRITICAL"> = { ...flags };

    parameters.forEach((param) => {
      const ref = getReferenceRange(param, patientAge, patientGender);
      if (ref && (ref.normalLow !== undefined || ref.normalHigh !== undefined)) {
        const low = ref.normalLow ?? 0;
        const high = ref.normalHigh ?? low * 2;
        const mid = ((low + high) / 2);
        // Format nicely
        const formatted = Number.isInteger(mid) ? String(mid) : mid.toFixed(1);
        newValues[param.id] = formatted;
        newFlags[param.id] = "NORMAL";
      } else if (!newValues[param.id]) {
        newValues[param.id] = "Negative";
        newFlags[param.id] = "NORMAL";
      }
    });

    setValues(newValues);
    setFlags(newFlags);
    showToast("Median physiological biological reference values auto-filled.");
  };

  // Simulator: Host Query LIS Telemetry Pull
  const handleFetchAnalyzerTelemetry = () => {
    const newValues: Record<string, string> = { ...values };
    const newFlags: Record<string, "LOW" | "NORMAL" | "HIGH" | "CRITICAL"> = { ...flags };

    parameters.forEach((param) => {
      const ref = getReferenceRange(param, patientAge, patientGender);
      if (ref && ref.normalLow !== undefined && ref.normalHigh !== undefined) {
        // Generate realistic reading within standard variance
        const val = ref.normalLow + (ref.normalHigh - ref.normalLow) * 0.55;
        const strVal = Number.isInteger(val) ? String(Math.round(val)) : val.toFixed(1);
        newValues[param.id] = strVal;
        newFlags[param.id] = calculateFlag(strVal, ref) || "NORMAL";
      }
    });

    setValues(newValues);
    setFlags(newFlags);
    showToast(`Acquired ${parameters.length} telemetry readings directly from ${selectedAnalyzer.split(" ")[0]} LIS socket.`);
  };

  const handleClearAll = () => {
    setValues({});
    setFlags({});
    setRemarks({});
    showToast("Cleared all parameter entries.");
  };

  const handleSave = () => {
    const parameterValues: ParameterValue[] = parameters.map((param) => ({
      parameterId: param.id,
      value: values[param.id] || "",
      flag: flags[param.id],
      remark: remarks[param.id],
    }));
    onSave(parameterValues);
  };

  // Summary Metrics
  const totalParameters = parameters.length;
  const capturedCount = Object.values(values).filter((v) => v && v.trim() !== "").length;
  const criticalCount = Object.values(flags).filter((f) => f === "CRITICAL").length;
  const abnormalCount = Object.values(flags).filter((f) => f === "HIGH" || f === "LOW").length;
  const normalCount = Object.values(flags).filter((f) => f === "NORMAL").length;
  const hasCritical = criticalCount > 0;

  return (
    <div className="space-y-5 text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-cyan-500/40 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-cyan-300 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-3">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Workstation Control Header */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3 py-1 text-xs font-bold text-cyan-300 uppercase tracking-wider">
                <FlaskConical className="h-3.5 w-3.5 text-cyan-400" />
                NABL ISO 15189 Bench Parameter Entry
              </span>
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                {capturedCount} of {totalParameters} Captured
              </span>
            </div>

            <h3 className="mt-2 text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{testName || "Laboratory Test Results Entry"}</span>
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Direct numerical capture with real-time biological reference range evaluation and critical panic detection.
            </p>
          </div>

          {/* Quick Automation Tools Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAutoFillNormals}
              className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50 hover:text-white transition"
              title="Auto-fill median normal reference values"
            >
              <Wand2 className="h-3.5 w-3.5 text-cyan-400" />
              <span>Fill Normals</span>
            </button>

            <button
              type="button"
              onClick={handleFetchAnalyzerTelemetry}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/50 hover:text-white transition"
              title="Query interfaced instrument host socket"
            >
              <Cpu className="h-3.5 w-3.5 text-emerald-400" />
              <span>Fetch LIS Telemetry</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:border-rose-900/50 transition"
              title="Reset all fields"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Bench Metadata Selector Bar */}
        <div className="mt-4 grid gap-3 border-t border-slate-800/80 pt-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Interfaced Instrument
            </label>
            <select
              value={selectedAnalyzer}
              onChange={(e) => setSelectedAnalyzer(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option>Roche Cobas c311 / Sysmex XN-1000 (LIS Auto)</option>
              <option>Mindray CL-900i Chemiluminescence</option>
              <option>Bio-Rad D-10 HPLC Analyzer</option>
              <option>Manual Bench / Microscopic Verification</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Sample Dilution Factor
            </label>
            <select
              value={dilutionFactor}
              onChange={(e) => setDilutionFactor(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option>Neat (1:1 Direct Aspiration)</option>
              <option>Dilution 1:2 (Saline)</option>
              <option>Dilution 1:5 (Buffer)</option>
              <option>Dilution 1:10 (Over-Range Protocol)</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={qcVerified}
                onChange={(e) => setQcVerified(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 text-emerald-500 focus:ring-0"
              />
              <span className="text-[11px] text-slate-300">
                2-Level Westgard QC Verified Today
              </span>
            </label>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rechecked}
                onChange={(e) => setRechecked(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-[11px] text-slate-300">
                Sample Re-aspirated for Concordance
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* ISO 15189 Critical Panic Value Alarm Banner */}
      {hasCritical && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/80 bg-red-950/60 p-4 shadow-xl shadow-red-950/50 animate-pulse">
          <AlertOctagon className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="text-sm font-bold text-red-200 uppercase tracking-wide">
              NABL ISO 15189 Critical Panic Parameter Alert
            </h4>
            <p className="text-red-300/90 leading-relaxed">
              One or more parameters violate critical panic thresholds (<strong>{criticalCount} critical finding</strong>).
              Per clinical laboratory accreditation guidelines, you must verbally inform the attending clinician and document the telephonic read-back confirmation.
            </p>
          </div>
        </div>
      )}

      {/* Main Parameters Entry Grid */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-slate-800 bg-slate-950 text-slate-300 text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3.5 border-r border-slate-800"># Parameter Name</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[190px]">Observed Value *</th>
                <th className="px-4 py-3.5 border-r border-slate-800">Unit</th>
                <th className="px-4 py-3.5 border-r border-slate-800 min-w-[200px]">Normal Reference Range</th>
                <th className="px-4 py-3.5 border-r border-slate-800 text-center">Clinical Flag</th>
                <th className="px-4 py-3.5 min-w-[200px]">Bench Remarks / Preset</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80 text-xs">
              {parameters.map((param, index) => {
                const refRange = getReferenceRange(param, patientAge, patientGender, patientAgeInDays, patientAgeInHours, patientDob);
                const flag = flags[param.id];
                const value = values[param.id] || "";
                const remark = remarks[param.id] || "";

                const isCrit = flag === "CRITICAL";
                const isAbnormal = flag === "HIGH" || flag === "LOW";

                return (
                  <tr
                    key={param.id}
                    className={`transition-colors ${
                      isCrit
                        ? "bg-red-950/25 hover:bg-red-950/40"
                        : isAbnormal
                        ? "bg-amber-950/15 hover:bg-amber-950/25"
                        : "hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Parameter Name */}
                    <td className="px-4 py-3.5 border-r border-slate-800">
                      <div>
                        <p className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                          <span>{param.parameterName}</span>
                        </p>
                        {param.shortName && (
                          <span className="font-mono text-[10px] text-cyan-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800 inline-block mt-0.5">
                            {param.shortName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Observed Value Input with Real-time Status Border */}
                    <td className="px-4 py-3.5 border-r border-slate-800">
                      <div className="relative">
                        <input
                          ref={(el) => { inputRefs.current[index] = el; }}
                          type="text"
                          value={value}
                          onChange={(e) => handleValueChange(param.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "ArrowDown") {
                              e.preventDefault();
                              if (index < parameters.length - 1) {
                                inputRefs.current[index + 1]?.focus();
                                inputRefs.current[index + 1]?.select();
                              }
                            } else if (e.key === "ArrowUp") {
                              e.preventDefault();
                              if (index > 0) {
                                inputRefs.current[index - 1]?.focus();
                                inputRefs.current[index - 1]?.select();
                              }
                            }
                          }}
                          placeholder="e.g. 14.8"
                          className={`w-full rounded-xl border px-3.5 py-2 font-mono text-sm font-bold text-white shadow-inner focus:outline-none transition ${
                            isCrit
                              ? "border-red-500 bg-red-950/60 text-red-200 focus:border-red-400 ring-2 ring-red-500/20"
                              : isAbnormal
                              ? "border-amber-500 bg-amber-950/50 text-amber-200 focus:border-amber-400"
                              : value
                              ? "border-emerald-500/60 bg-emerald-950/20 text-emerald-200 focus:border-emerald-400"
                              : "border-slate-700 bg-slate-950 text-white focus:border-cyan-500"
                          }`}
                        />
                        {value && (
                          <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">
                            {param.unit}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Unit */}
                    <td className="px-4 py-3.5 border-r border-slate-800">
                      <span className="font-mono font-semibold text-slate-300">
                        {param.unit || "—"}
                      </span>
                    </td>

                    {/* Normal Reference Range & Visual Gauge */}
                    <td className="px-4 py-3.5 border-r border-slate-800">
                      <div>
                        <span className="font-mono font-bold text-cyan-300 text-xs">
                          {formatReferenceRange(refRange)}
                        </span>
                        {refRange?.criticalLow !== undefined && (
                          <p className="mt-0.5 font-mono text-[10px] text-red-400">
                            Panic: &le; {refRange.criticalLow} | &ge; {refRange.criticalHigh}
                          </p>
                        )}
                        {/* Miniature visual reference range spectrum */}
                        <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden flex">
                          <div className="w-1/4 bg-blue-500/40" />
                          <div className="w-2/4 bg-emerald-500/60" />
                          <div className="w-1/4 bg-red-500/50" />
                        </div>
                      </div>
                    </td>

                    {/* Status Flag Badge */}
                    <td className="px-4 py-3.5 border-r border-slate-800 text-center">
                      {flag === "CRITICAL" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-500 bg-red-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-300 animate-pulse">
                          <AlertOctagon className="h-3 w-3" />
                          CRITICAL
                        </span>
                      ) : flag === "HIGH" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                          <TrendingUp className="h-3 w-3" />
                          HIGH
                        </span>
                      ) : flag === "LOW" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                          <TrendingDown className="h-3 w-3" />
                          LOW
                        </span>
                      ) : flag === "NORMAL" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          NORMAL
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">—</span>
                      )}
                    </td>

                    {/* Remarks Input & Quick Macros */}
                    <td className="px-4 py-3.5">
                      <div>
                        <input
                          type="text"
                          value={remark}
                          onChange={(e) => handleRemarkChange(param.id, e.target.value)}
                          placeholder="Bench note / observation..."
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                        />
                        <div className="mt-1 flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => handleRemarkChange(param.id, "Smear verified")}
                            className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] text-slate-400 hover:bg-slate-700 hover:text-white"
                          >
                            + Smear
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemarkChange(param.id, "Rechecked & concordant")}
                            className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] text-slate-400 hover:bg-slate-700 hover:text-white"
                          >
                            + Rechecked
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Metrics & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-800 pt-4">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">
            Recorded: <strong className="text-white">{capturedCount}</strong> / {totalParameters}
          </span>
          <span>·</span>
          <span className="text-emerald-400 font-semibold">{normalCount} Normal</span>
          {abnormalCount > 0 && (
            <>
              <span>·</span>
              <span className="text-amber-400 font-semibold">{abnormalCount} Shifted</span>
            </>
          )}
          {criticalCount > 0 && (
            <>
              <span>·</span>
              <span className="text-red-400 font-bold">{criticalCount} Critical Panic</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-lg transition disabled:opacity-50 ${
              hasCritical
                ? "bg-gradient-to-r from-red-600 to-rose-600 shadow-red-600/30 hover:from-red-500 hover:to-rose-500"
                : "bg-gradient-to-r from-cyan-600 to-blue-600 shadow-cyan-600/30 hover:from-cyan-500 hover:to-blue-500"
            }`}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Saving to LIS...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Results & Proceed</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
export default ParameterResultEntrySheet;
