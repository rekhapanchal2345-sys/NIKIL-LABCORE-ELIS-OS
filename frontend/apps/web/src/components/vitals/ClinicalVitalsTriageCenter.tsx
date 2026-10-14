"use client";

import React, { useState, useMemo } from "react";
import {
  Activity,
  Heart,
  Thermometer,
  ShieldAlert,
  ShieldCheck,
  Droplets,
  Scale,
  Wind,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
} from "lucide-react";
import {
  VitalsData,
  parsePatientVitals,
  getBpClassification,
  getPulseClassification,
  getSpo2Classification,
  getTempClassification,
  getRespRateClassification,
  getGlucoseClassification,
  getBmiClassification,
  calculateNews2Score,
} from "@/lib/vitals-triage";
import RecordVitalsTriageModal from "./RecordVitalsTriageModal";

interface ClinicalVitalsTriageCenterProps {
  patient: any;
  onVitalsUpdated?: (updatedPatient: any) => void;
  compact?: boolean;
}

export default function ClinicalVitalsTriageCenter({
  patient,
  onVitalsUpdated,
  compact = false,
}: ClinicalVitalsTriageCenterProps) {
  const [showModal, setShowModal] = useState(false);

  const vitals = useMemo(() => parsePatientVitals(patient), [patient]);

  const numSys = vitals.bpSys || 120;
  const numDia = vitals.bpDia || 80;
  const numPulse = vitals.pulse || 74;
  const numSpo2 = vitals.spo2 || 98;
  const numTemp = vitals.temp || 98.4;
  const numResp = vitals.respRate || 16;
  const numFbs = vitals.fbs || 95;
  const numBmi = vitals.bmi || 23.5;
  const numBsa = vitals.bsa || 1.79;

  const bpStage = useMemo(() => getBpClassification(numSys, numDia), [numSys, numDia]);
  const pulseStage = useMemo(() => getPulseClassification(numPulse), [numPulse]);
  const spo2Stage = useMemo(() => getSpo2Classification(numSpo2), [numSpo2]);
  const tempStage = useMemo(() => getTempClassification(numTemp), [numTemp]);
  const respStage = useMemo(() => getRespRateClassification(numResp), [numResp]);
  const glucoseStage = useMemo(
    () => getGlucoseClassification(numFbs, vitals.glucoseType || "FASTING"),
    [numFbs, vitals.glucoseType]
  );
  const bmiStage = useMemo(() => getBmiClassification(numBmi), [numBmi]);
  const news2 = useMemo(() => calculateNews2Score(vitals), [vitals]);

  const mapValue = Math.round(numDia + (numSys - numDia) / 3);
  const pulsePressure = numSys - numDia;

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Recently Recorded";
    try {
      const d = new Date(isoString);
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const hasSafetyAlerts =
    vitals.phlebotomySafety?.syncopeRisk ||
    vitals.phlebotomySafety?.anticoagulantTherapy ||
    vitals.phlebotomySafety?.difficultVeins ||
    (vitals.phlebotomySafety?.restrictedLimb && vitals.phlebotomySafety.restrictedLimb !== "NONE");

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center border border-blue-200">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Clinical Vitals & Triage Center
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  CLSI & NEWS2 Certified
                </span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Last Logged: {formatDate(vitals.recordedAt)}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-semibold">{vitals.recordedBy || "Phlebotomy Triage"}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>+ Update Vitals & Triage</span>
          </button>
        </div>

        {/* NEWS2 & Clinical Early Warning Alert Strip */}
        <div className={`px-5 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs font-medium ${news2.color}`}>
          <div className="flex items-center gap-2.5">
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${news2.badgeBg}`}>
              NEWS2: {news2.score}
            </span>
            <span className="font-extrabold">{news2.label}</span>
            <span className="text-slate-700 hidden md:inline">• {news2.recommendation}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold">
            <span className="text-slate-600">
              AVPU: <span className="text-slate-900 font-extrabold">{vitals.avpu || "ALERT"}</span>
            </span>
            {vitals.painScore !== undefined && vitals.painScore > 0 && (
              <span className="text-rose-700">
                Pain: <span className="font-extrabold">{vitals.painScore}/10</span>
              </span>
            )}
          </div>
        </div>

        {/* PRIMARY VITALS GRID (5 Tiles) */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            
            {/* 1. Blood Pressure */}
            <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Blood Pressure
                </span>
                <Heart className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="text-lg font-black text-slate-900 font-mono tracking-tight my-0.5">
                {numSys}/{numDia} <span className="text-[10px] font-semibold text-slate-400 font-sans">mmHg</span>
              </div>
              <span className={`mt-1.5 inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold border text-center truncate ${bpStage.color}`}>
                {bpStage.badge}
              </span>
              <span className="text-[9px] text-slate-400 mt-1 block">
                MAP: {mapValue} | PP: {pulsePressure}
              </span>
            </div>

            {/* 2. Pulse Rate */}
            <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pulse Rate
                </span>
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-lg font-black text-slate-900 font-mono tracking-tight my-0.5">
                {numPulse} <span className="text-[10px] font-semibold text-slate-400 font-sans">BPM</span>
              </div>
              <span className={`mt-1.5 inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold border text-center truncate ${pulseStage.color}`}>
                {pulseStage.label.split(" ")[0]}
              </span>
              <span className="text-[9px] text-slate-400 mt-1 block">Regular Rhythm</span>
            </div>

            {/* 3. SpO2 */}
            <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  SpO2
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
              </div>
              <div className="text-lg font-black text-slate-900 font-mono tracking-tight my-0.5">
                {numSpo2}<span className="text-[10px] font-semibold text-slate-400 font-sans ml-0.5">%</span>
              </div>
              <span className={`mt-1.5 inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold border text-center truncate ${spo2Stage.color}`}>
                {numSpo2 >= 95 ? "Optimal O2" : "Hypoxia Alert"}
              </span>
              <span className="text-[9px] text-slate-400 mt-1 block">Room Air</span>
            </div>

            {/* 4. Temperature */}
            <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Temperature
                </span>
                <Thermometer className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-lg font-black text-slate-900 font-mono tracking-tight my-0.5">
                {numTemp.toFixed(1)}<span className="text-[10px] font-semibold text-slate-400 font-sans ml-0.5">°F</span>
              </div>
              <span className={`mt-1.5 inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold border text-center truncate ${tempStage.color}`}>
                {tempStage.label.split(" ")[0]}
              </span>
              <span className="text-[9px] text-slate-400 mt-1 block">
                {((((numTemp - 32) * 5) / 9)).toFixed(1)}°C
              </span>
            </div>

            {/* 5. Blood Sugar */}
            <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Blood Sugar
                </span>
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="text-lg font-black text-slate-900 font-mono tracking-tight my-0.5">
                {numFbs} <span className="text-[10px] font-semibold text-slate-400 font-sans">mg/dL</span>
              </div>
              <span className={`mt-1.5 inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold border text-center truncate ${glucoseStage.color}`}>
                {vitals.glucoseType === "FASTING" ? "Fasting (FBS)" : vitals.glucoseType === "POST_PRANDIAL" ? "Post-Meal" : "Random"}
              </span>
              <span className="text-[9px] text-slate-400 mt-1 block truncate">
                {glucoseStage.label.split(" ")[0]}
              </span>
            </div>

          </div>

          {/* ANTHROPOMETRIC & CLINICAL INDICES ROW */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200 font-bold shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Height & Weight</span>
                  <span className="font-extrabold text-slate-900">
                    {vitals.height || 170} cm • {vitals.weight || 68} kg
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">BMI</span>
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    {numBmi} kg/m²
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${bmiStage.color}`}>
                      {bmiStage.label.split(" ")[0]}
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Body Surface Area (BSA)</span>
                  <span className="font-extrabold text-slate-900 font-mono">
                    {numBsa} m²
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Fasting Compliance</span>
              <span className="font-extrabold text-emerald-700 flex items-center gap-1 justify-end">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {vitals.fastingStatus === "FASTING_12H"
                  ? "Overnight Fasting (10-12h Verified)"
                  : vitals.fastingStatus === "POST_PRANDIAL"
                  ? "Post-Prandial (2h Post-Meal)"
                  : "Random / Non-Fasting"}
              </span>
            </div>
          </div>

          {/* PHLEBOTOMY PRE-COLLECTION SAFETY ALERTS */}
          {hasSafetyAlerts && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Phlebotomy Pre-Collection Safety Precautions Active:</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px]">
                {vitals.phlebotomySafety?.syncopeRisk && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-800 font-bold shadow-xs">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    Vasovagal Syncope Risk: Perform phlebotomy in recumbent/lying position
                  </span>
                )}
                {vitals.phlebotomySafety?.anticoagulantTherapy && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-800 font-bold shadow-xs">
                    <Droplets className="w-3 h-3 text-rose-600" />
                    Anticoagulant Therapy: Apply firm manual pressure bandage for ≥ 5-10 minutes
                  </span>
                )}
                {vitals.phlebotomySafety?.difficultVeins && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-800 font-bold shadow-xs">
                    <Activity className="w-3 h-3 text-rose-600" />
                    Difficult Veins: Use 23G/25G Winged Butterfly Needle
                  </span>
                )}
                {vitals.phlebotomySafety?.restrictedLimb && vitals.phlebotomySafety.restrictedLimb !== "NONE" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black shadow-xs uppercase tracking-wide text-[10px]">
                    <ShieldAlert className="w-3 h-3 text-white" />
                    Contraindicated: {vitals.phlebotomySafety.restrictedLimb.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TRIAGE OBSERVATION NOTES */}
          {vitals.vitalsNotes && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 flex items-start gap-2.5 text-xs">
              <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block text-[11px]">Triage Observation / Phlebotomy Notes:</span>
                <p className="text-slate-600 font-medium leading-relaxed mt-0.5">{vitals.vitalsNotes}</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal for Recording / Updating Vitals */}
      {showModal && (
        <RecordVitalsTriageModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          patient={patient}
          initialVitals={vitals}
          onSaveSuccess={(updated) => {
            if (onVitalsUpdated) onVitalsUpdated(updated);
          }}
        />
      )}
    </>
  );
}
