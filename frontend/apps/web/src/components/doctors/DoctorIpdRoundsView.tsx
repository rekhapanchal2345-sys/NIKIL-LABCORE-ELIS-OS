"use client";

import React, { useState } from "react";
import {
  Bed,
  HeartPulse,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Stethoscope,
  FlaskConical,
  LogOut,
  Calendar,
  User,
  Plus,
} from "lucide-react";
import { showSuccess, showInfo } from "@/lib/notifications";

export interface IpdPatient {
  id: string;
  bedNumber: string;
  wardName: string;
  uhid: string;
  patientName: string;
  age: number;
  gender: string;
  admissionDate: string;
  lengthOfStayDays: number;
  primaryDiagnosis: string;
  attendingDoctor: string;
  roundStatus: "PENDING" | "COMPLETED" | "CRITICAL_REVIEW";
  latestVitals: {
    bloodPressure: string;
    pulseRate: number;
    spO2: number;
    temperature: string;
  };
  pendingLabsCount: number;
  dischargePlanned: boolean;
  clinicalNote?: string;
}

const INITIAL_IPD_PATIENTS: IpdPatient[] = [
  {
    id: "ipd-1",
    bedNumber: "ICU-02",
    wardName: "Intensive Care Unit (ICU)",
    uhid: "UHID-2026-7910",
    patientName: "Mr. Harish Chandra",
    age: 67,
    gender: "Male",
    admissionDate: "2026-10-22",
    lengthOfStayDays: 4,
    primaryDiagnosis: "Severe Sepsis secondary to Right Lobar Pneumonia; Type-2 Diabetes",
    attendingDoctor: "Dr. Vikram Seth (Intensivist / Pulmonologist)",
    roundStatus: "CRITICAL_REVIEW",
    latestVitals: {
      bloodPressure: "102/64 mmHg",
      pulseRate: 98,
      spO2: 92,
      temperature: "101.2 °F",
    },
    pendingLabsCount: 2,
    dischargePlanned: false,
    clinicalNote: "Titrate noradrenaline; monitor arterial blood gases & serial procalcitonin.",
  },
  {
    id: "ipd-2",
    bedNumber: "MMW-14",
    wardName: "Male Medical Ward",
    uhid: "UHID-2026-8045",
    patientName: "Mr. Devendra Yadav",
    age: 52,
    gender: "Male",
    admissionDate: "2026-10-24",
    lengthOfStayDays: 2,
    primaryDiagnosis: "Acute Decompensated Heart Failure (NYHA Class III), CKD Stage 3",
    attendingDoctor: "Dr. Rajesh Sharma (Cardiology)",
    roundStatus: "PENDING",
    latestVitals: {
      bloodPressure: "134/86 mmHg",
      pulseRate: 78,
      spO2: 96,
      temperature: "98.6 °F",
    },
    pendingLabsCount: 1,
    dischargePlanned: false,
    clinicalNote: "Strict fluid balance of 1.2L/day. Check serum electrolytes & creatinine tomorrow morning.",
  },
  {
    id: "ipd-3",
    bedNumber: "FSW-08",
    wardName: "Female Surgical Ward",
    uhid: "UHID-2026-8109",
    patientName: "Mrs. Pushpa Rathore",
    age: 46,
    gender: "Female",
    admissionDate: "2026-10-25",
    lengthOfStayDays: 1,
    primaryDiagnosis: "Post-op Day 1 Laparoscopic Cholecystectomy for Cholelithiasis",
    attendingDoctor: "Dr. Ananya Sen (General Surgery)",
    roundStatus: "COMPLETED",
    latestVitals: {
      bloodPressure: "120/78 mmHg",
      pulseRate: 74,
      spO2: 99,
      temperature: "98.4 °F",
    },
    pendingLabsCount: 0,
    dischargePlanned: true,
    clinicalNote: "Tolerating oral soft diet. Surgical site clean. Planned for discharge tomorrow morning.",
  },
  {
    id: "ipd-4",
    bedNumber: "DLX-04",
    wardName: "Private Deluxe Room",
    uhid: "UHID-2026-8120",
    patientName: "Mr. Anand Singhania",
    age: 58,
    gender: "Male",
    admissionDate: "2026-10-23",
    lengthOfStayDays: 3,
    primaryDiagnosis: "Dengue Fever with Thrombocytopenia; Hydration Therapy",
    attendingDoctor: "Dr. Vikram Seth (General Medicine)",
    roundStatus: "PENDING",
    latestVitals: {
      bloodPressure: "118/76 mmHg",
      pulseRate: 80,
      spO2: 98,
      temperature: "99.1 °F",
    },
    pendingLabsCount: 1,
    dischargePlanned: false,
    clinicalNote: "Platelet count improving (68,000/µL). Repeat CBC at 6 PM.",
  },
];

interface DoctorIpdRoundsViewProps {
  onOpenNewRx?: (patient?: any) => void;
  onOpenOrderLab?: (patient?: any) => void;
}

export default function DoctorIpdRoundsView({
  onOpenNewRx,
  onOpenOrderLab,
}: DoctorIpdRoundsViewProps) {
  const [patients, setPatients] = useState<IpdPatient[]>(INITIAL_IPD_PATIENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWard, setSelectedWard] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const [activeModalPatient, setActiveModalPatient] = useState<IpdPatient | null>(null);
  const [soapSubjective, setSoapSubjective] = useState("");
  const [soapObjective, setSoapObjective] = useState("");
  const [soapAssessment, setSoapAssessment] = useState("");
  const [soapPlan, setSoapPlan] = useState("");
  const [isDischargeApproved, setIsDischargeApproved] = useState(false);

  const wardsList = Array.from(new Set(patients.map((p) => p.wardName)));

  const handleMarkRoundDone = (p: IpdPatient) => {
    setActiveModalPatient(p);
    setSoapSubjective("Patient reports feeling better, pain well controlled, afebrile overnight.");
    setSoapObjective(`Vitals: BP ${p.latestVitals.bloodPressure}, Pulse ${p.latestVitals.pulseRate} bpm, SpO2 ${p.latestVitals.spO2}%, Temp ${p.latestVitals.temperature}. Systemic exam unremarkable.`);
    setSoapAssessment(p.roundStatus === "CRITICAL_REVIEW" ? "Under intensive hemodynamic stabilization, pending repeat labs" : "Satisfactory clinical recovery, hemodynamically stable");
    setSoapPlan(p.clinicalNote || "Continue IV hydration and monitor urine output. Step down to oral meds tomorrow.");
    setIsDischargeApproved(p.dischargePlanned);
  };

  const handleSaveRoundNote = () => {
    if (!activeModalPatient) return;
    const combinedSoap = `[S]: ${soapSubjective} | [O]: ${soapObjective} | [A]: ${soapAssessment} | [P]: ${soapPlan}`;
    setPatients((prev) =>
      prev.map((p) =>
        p.id === activeModalPatient.id
          ? {
              ...p,
              roundStatus: "COMPLETED",
              dischargePlanned: isDischargeApproved,
              clinicalNote: combinedSoap,
            }
          : p
      )
    );
    showSuccess(`Daily SOAP round note and treatment directive recorded for Bed ${activeModalPatient.bedNumber}.`);
    setActiveModalPatient(null);
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.primaryDiagnosis.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWard = selectedWard === "ALL" || p.wardName === selectedWard;
    const matchesStatus =
      selectedStatus === "ALL" || p.roundStatus === selectedStatus;

    return matchesSearch && matchesWard && matchesStatus;
  });

  const totalAdmitted = patients.length;
  const pendingRounds = patients.filter((p) => p.roundStatus === "PENDING").length;
  const criticalCount = patients.filter((p) => p.roundStatus === "CRITICAL_REVIEW").length;
  const dischargeCount = patients.filter((p) => p.dischargePlanned).length;

  return (
    <div className="space-y-4">
      {/* ── IPD Metrics Summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Admitted Inpatients (IPD)</span>
            <Bed className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalAdmitted}</span>
            <span className="text-xs text-slate-500 font-medium">Beds Occupied</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Pending Daily Rounds</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-800">{pendingRounds}</span>
            <span className="text-xs text-amber-600 font-medium">Awaiting Consultant</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Critical / ICU Attention</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700">{criticalCount}</span>
            <span className="text-xs text-rose-600 font-medium">Close Monitoring</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Discharge Ready Today</span>
            <LogOut className="w-4 h-4 text-teal-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-800">{dischargeCount}</span>
            <span className="text-xs text-teal-600 font-medium">Planned Discharge</span>
          </div>
        </div>
      </div>

      {/* ── Filter Controls ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search inpatient by bed, patient name, UHID, or diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-xs font-medium placeholder-slate-400 focus:border-sky-600 focus:outline-none bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="rounded-xl border border-slate-200 py-2 px-3 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-sky-600"
            >
              <option value="ALL">All Hospital Wards</option>
              {wardsList.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-200 py-2 px-3 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-sky-600"
            >
              <option value="ALL">All Round Statuses</option>
              <option value="PENDING">Pending Round</option>
              <option value="CRITICAL_REVIEW">Critical ICU Attention</option>
              <option value="COMPLETED">Rounds Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Inpatient Rounds Grid / Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Bed & Ward</th>
                <th className="py-3 px-4">Patient Demographics</th>
                <th className="py-3 px-4">Diagnosis & Stay</th>
                <th className="py-3 px-4">Current Vitals</th>
                <th className="py-3 px-4">Attending Consultant</th>
                <th className="py-3 px-4">Round Status</th>
                <th className="py-3 px-4 text-right">Doctor Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Bed className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No inpatients match the criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => {
                  const isCritical = p.roundStatus === "CRITICAL_REVIEW";
                  const isDone = p.roundStatus === "COMPLETED";

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCritical ? "bg-rose-50/30" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900 font-mono bg-sky-50 border border-sky-200 text-sky-800 px-2 py-0.5 rounded-lg text-xs">
                            {p.bedNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-1">
                          {p.wardName}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.patientName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {p.uhid} • {p.age}y / {p.gender}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Adm: {p.admissionDate} ({p.lengthOfStayDays} days stay)
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-800 font-medium line-clamp-2">
                          {p.primaryDiagnosis}
                        </p>
                        {p.clinicalNote && (
                          <p className="text-[11px] text-sky-800 bg-sky-50/70 p-1 rounded mt-1 border border-sky-100">
                            <strong>Plan:</strong> {p.clinicalNote}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col text-[11px]">
                          <span className="text-slate-700">
                            <strong>BP:</strong> {p.latestVitals.bloodPressure}
                          </span>
                          <span className="text-slate-700">
                            <strong>HR:</strong> {p.latestVitals.pulseRate} bpm • <strong>SpO2:</strong> {p.latestVitals.spO2}%
                          </span>
                          <span className="text-slate-500">
                            <strong>Temp:</strong> {p.latestVitals.temperature}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{p.attendingDoctor}</div>
                        {p.pendingLabsCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-1">
                            <FlaskConical className="w-3 h-3 text-amber-600" />
                            {p.pendingLabsCount} Lab Orders Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            Critical ICU
                          </span>
                        ) : isDone ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Round Done
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Pending Round
                          </span>
                        )}
                        {p.dischargePlanned && (
                          <div className="text-[10px] font-bold text-teal-700 mt-1">
                            ✓ Discharge Planned
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => handleMarkRoundDone(p)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] transition shadow-2xs"
                            title="File Daily Progress Note"
                          >
                            Progress Note
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenNewRx && onOpenNewRx(p)}
                            className="px-2.5 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[11px] transition"
                            title="Prescribe Medications & Lab Orders"
                          >
                            Order Rx
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Structured Daily SOAP Round Progress Note Modal ── */}
      {activeModalPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Inpatient Bed Round & SOAP Progress Note
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Bed: <strong className="text-slate-800">{activeModalPatient.bedNumber}</strong> ({activeModalPatient.wardName}) • {activeModalPatient.patientName} ({activeModalPatient.uhid})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalPatient(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[65vh] overflow-y-auto pr-1">
              {/* S: Subjective */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-sky-100 text-sky-800 flex items-center justify-center text-[10px] font-black">S</span>
                  Subjective (Patient's Symptoms & Night Events)
                </label>
                <input
                  type="text"
                  value={soapSubjective}
                  onChange={(e) => setSoapSubjective(e.target.value)}
                  placeholder="e.g. Patient feels better, no fever, pain score 2/10"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-sky-600 focus:outline-none"
                />
              </div>

              {/* O: Objective */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-teal-100 text-teal-800 flex items-center justify-center text-[10px] font-black">O</span>
                  Objective (Vitals, Physical Exam & Fluid Balance)
                </label>
                <input
                  type="text"
                  value={soapObjective}
                  onChange={(e) => setSoapObjective(e.target.value)}
                  placeholder="e.g. BP 120/78, Chest clear, surgical dressing clean"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-sky-600 focus:outline-none"
                />
              </div>

              {/* A: Assessment */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-black">A</span>
                  Assessment (Clinical Impression & Trajectory)
                </label>
                <input
                  type="text"
                  value={soapAssessment}
                  onChange={(e) => setSoapAssessment(e.target.value)}
                  placeholder="e.g. Recovering well, sepsis resolved, hemodynamically stable"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-sky-600 focus:outline-none"
                />
              </div>

              {/* P: Plan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-indigo-100 text-indigo-800 flex items-center justify-center text-[10px] font-black">P</span>
                  Plan (Medications, IV fluids, Lab Orders & Discharge Directive)
                </label>
                <textarea
                  rows={2}
                  value={soapPlan}
                  onChange={(e) => setSoapPlan(e.target.value)}
                  placeholder="e.g. Switch IV to Tab Amoxiclav, remove cannula, monitor temp SOS"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:border-sky-600 focus:outline-none"
                />
              </div>

              {/* Discharge Clearance Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDischargeApproved}
                  onChange={(e) => setIsDischargeApproved(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">
                    Authorize Medical Discharge Clearance
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Patient is clinically stable and ready for summary generation and billing discharge
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium">
                Timestamped under physician login
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModalPatient(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRoundNote}
                  className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Save SOAP Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
