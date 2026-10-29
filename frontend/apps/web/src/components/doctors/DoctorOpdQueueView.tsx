"use client";

import React, { useState } from "react";
import {
  Stethoscope,
  Clock,
  User,
  HeartPulse,
  Activity,
  AlertCircle,
  CheckCircle2,
  FileSignature,
  FlaskConical,
  Search,
  Filter,
  Phone,
  Volume2,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Plus,
  Printer,
  Ticket,
  QrCode,
  X,
} from "lucide-react";
import { showSuccess, showInfo } from "@/lib/notifications";
import OpdTokenA4PrintModal from "@/components/patients/OpdTokenA4PrintModal";

export interface OpdPatient {
  id: string;
  tokenNumber: string;
  uhid: string;
  patientName: string;
  age: number;
  gender: string;
  phone: string;
  visitType: "WALK_IN" | "APPOINTMENT" | "FOLLOW_UP" | "STAT_EMERGENCY";
  triagePriority: "ROUTINE" | "URGENT" | "STAT_EMERGENCY";
  chiefComplaint: string;
  vitals: {
    bloodPressure: string;
    pulseRate: number;
    spO2: number;
    temperature: string;
    bloodGlucose?: string;
  };
  attendingDoctor: string;
  chamberNumber: string;
  queueStatus: "WAITING" | "IN_CHAMBER" | "COMPLETED" | "DEFERRED";
  checkInTime: string;
  estimatedWaitMinutes: number;
}

const INITIAL_QUEUE: OpdPatient[] = [
  {
    id: "opd-1",
    tokenNumber: "OPD-01",
    uhid: "UHID-2026-8812",
    patientName: "Smt. Sunita Devi",
    age: 54,
    gender: "Female",
    phone: "+91 98231 44512",
    visitType: "STAT_EMERGENCY",
    triagePriority: "STAT_EMERGENCY",
    chiefComplaint: "Acute severe chest discomfort radiating to left jaw & shortness of breath",
    vitals: {
      bloodPressure: "168/104 mmHg",
      pulseRate: 108,
      spO2: 93,
      temperature: "98.4 °F",
      bloodGlucose: "220 mg/dL (Random)",
    },
    attendingDoctor: "Dr. Rajesh Sharma (Cardiology)",
    chamberNumber: "Chamber 102",
    queueStatus: "IN_CHAMBER",
    checkInTime: "09:15 AM",
    estimatedWaitMinutes: 0,
  },
  {
    id: "opd-2",
    tokenNumber: "OPD-02",
    uhid: "UHID-2026-8815",
    patientName: "Shri Rameshwar Patel",
    age: 62,
    gender: "Male",
    phone: "+91 98110 55421",
    visitType: "FOLLOW_UP",
    triagePriority: "URGENT",
    chiefComplaint: "High fasting blood sugars (280 mg/dL) with progressive bilateral foot numbness",
    vitals: {
      bloodPressure: "138/88 mmHg",
      pulseRate: 76,
      spO2: 98,
      temperature: "98.6 °F",
      bloodGlucose: "284 mg/dL",
    },
    attendingDoctor: "Dr. Ananya Sen (Endocrinology)",
    chamberNumber: "Chamber 105",
    queueStatus: "WAITING",
    checkInTime: "09:25 AM",
    estimatedWaitMinutes: 6,
  },
  {
    id: "opd-3",
    tokenNumber: "OPD-03",
    uhid: "UHID-2026-8819",
    patientName: "Master Aarav Verma",
    age: 8,
    gender: "Male",
    phone: "+91 98990 11223",
    visitType: "WALK_IN",
    triagePriority: "ROUTINE",
    chiefComplaint: "Dry productive cough with low-grade evening fever x 4 days",
    vitals: {
      bloodPressure: "105/68 mmHg",
      pulseRate: 92,
      spO2: 99,
      temperature: "99.8 °F",
    },
    attendingDoctor: "Dr. Priyanka Gupta (Pediatrics)",
    chamberNumber: "Chamber 108",
    queueStatus: "WAITING",
    checkInTime: "09:40 AM",
    estimatedWaitMinutes: 14,
  },
  {
    id: "opd-4",
    tokenNumber: "OPD-04",
    uhid: "UHID-2026-8824",
    patientName: "Mr. Farhan Qureshi",
    age: 38,
    gender: "Male",
    phone: "+91 94120 77890",
    visitType: "WALK_IN",
    triagePriority: "ROUTINE",
    chiefComplaint: "Persistent acid reflux, postprandial dyspepsia & epigastric fullness",
    vitals: {
      bloodPressure: "122/80 mmHg",
      pulseRate: 72,
      spO2: 99,
      temperature: "98.2 °F",
    },
    attendingDoctor: "Dr. Vikram Seth (General Medicine)",
    chamberNumber: "Chamber 101",
    queueStatus: "WAITING",
    checkInTime: "09:50 AM",
    estimatedWaitMinutes: 22,
  },
  {
    id: "opd-5",
    tokenNumber: "OPD-05",
    uhid: "UHID-2026-8798",
    patientName: "Mrs. Meenakshi Sundaram",
    age: 49,
    gender: "Female",
    phone: "+91 97123 66540",
    visitType: "APPOINTMENT",
    triagePriority: "ROUTINE",
    chiefComplaint: "Routine thyroid panel review & lipid profile follow-up",
    vitals: {
      bloodPressure: "126/82 mmHg",
      pulseRate: 70,
      spO2: 99,
      temperature: "98.4 °F",
    },
    attendingDoctor: "Dr. Rajesh Sharma (Cardiology)",
    chamberNumber: "Chamber 102",
    queueStatus: "COMPLETED",
    checkInTime: "08:45 AM",
    estimatedWaitMinutes: 0,
  },
];

interface DoctorOpdQueueViewProps {
  onOpenNewRx?: (patient?: any) => void;
  onOpenOrderLab?: (patient?: any) => void;
}

export default function DoctorOpdQueueView({
  onOpenNewRx,
  onOpenOrderLab,
}: DoctorOpdQueueViewProps) {
  const [queue, setQueue] = useState<OpdPatient[]>(INITIAL_QUEUE);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ACTIVE");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("ALL");

  // Walk-In Check-In Modal State
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInAge, setWalkInAge] = useState(42);
  const [walkInGender, setWalkInGender] = useState("Male");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInComplaint, setWalkInComplaint] = useState("");
  const [walkInPriority, setWalkInPriority] = useState<"ROUTINE" | "URGENT" | "STAT_EMERGENCY">("ROUTINE");
  const [walkInBp, setWalkInBp] = useState("120/80 mmHg");
  const [walkInPulse, setWalkInPulse] = useState(74);
  const [walkInSpO2, setWalkInSpO2] = useState(99);
  const [walkInTemp, setWalkInTemp] = useState("98.6 °F");
  const [walkInChamber, setWalkInChamber] = useState("Chamber 102");
  const [walkInDoctor, setWalkInDoctor] = useState("Dr. Rajesh Sharma (Cardiology)");

  // Token Slip Print Modal
  const [tokenSlipPatient, setTokenSlipPatient] = useState<OpdPatient | null>(null);

  const doctorsList = Array.from(new Set(queue.map((p) => p.attendingDoctor)));

  const handleCallNextWaiting = () => {
    const nextWaiting = queue.find((p) => p.queueStatus === "WAITING");
    if (!nextWaiting) {
      showInfo("No patients currently waiting in the OPD queue.");
      return;
    }
    handleChimeCall(nextWaiting);
    handleStartConsultation(nextWaiting.id);
  };

  const handleRegisterWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim()) {
      showInfo("Please enter the patient's full name");
      return;
    }

    const nextTokenNum = `OPD-${String(queue.length + 1).padStart(2, "0")}`;
    const newUhid = `UHID-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPatient: OpdPatient = {
      id: `opd-gen-${Date.now()}`,
      tokenNumber: nextTokenNum,
      uhid: newUhid,
      patientName: walkInName,
      age: walkInAge,
      gender: walkInGender,
      phone: walkInPhone || "+91 98000 00000",
      visitType: walkInPriority === "STAT_EMERGENCY" ? "STAT_EMERGENCY" : "WALK_IN",
      triagePriority: walkInPriority,
      chiefComplaint: walkInComplaint || "General consultation",
      vitals: {
        bloodPressure: walkInBp,
        pulseRate: walkInPulse,
        spO2: walkInSpO2,
        temperature: walkInTemp,
      },
      attendingDoctor: walkInDoctor,
      chamberNumber: walkInChamber,
      queueStatus: "WAITING",
      checkInTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      estimatedWaitMinutes: (queue.filter((p) => p.queueStatus === "WAITING").length + 1) * 8,
    };

    setQueue((prev) => [newPatient, ...prev]);
    showSuccess(`Token ${nextTokenNum} generated for ${walkInName}. Added to queue.`);
    setIsCheckInOpen(false);
    setWalkInName("");
    setWalkInComplaint("");
    setTokenSlipPatient(newPatient);
  };

  const handleChimeCall = (patient: OpdPatient) => {
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(
          `Token number ${patient.tokenNumber}, ${patient.patientName}, please proceed to ${patient.chamberNumber}`
        );
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // fallback
    }
    showInfo(`Calling ${patient.tokenNumber}: ${patient.patientName} to ${patient.chamberNumber}`);
  };

  const handleStartConsultation = (patientId: string) => {
    setQueue((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? { ...p, queueStatus: "IN_CHAMBER", estimatedWaitMinutes: 0 }
          : p.queueStatus === "IN_CHAMBER"
          ? { ...p, queueStatus: "WAITING" }
          : p
      )
    );
    showSuccess("Patient called into chamber. Active consultation started.");
  };

  const handleMarkCompleted = (patientId: string) => {
    setQueue((prev) =>
      prev.map((p) =>
        p.id === patientId ? { ...p, queueStatus: "COMPLETED" } : p
      )
    );
    showSuccess("Consultation concluded and marked completed.");
  };

  const filteredQueue = queue.filter((patient) => {
    const matchesSearch =
      !searchQuery ||
      patient.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority =
      filterPriority === "ALL" || patient.triagePriority === filterPriority;

    const matchesStatus =
      filterStatus === "ALL"
        ? true
        : filterStatus === "ACTIVE"
        ? patient.queueStatus === "WAITING" || patient.queueStatus === "IN_CHAMBER"
        : patient.queueStatus === filterStatus;

    const matchesDoctor =
      selectedDoctor === "ALL" || patient.attendingDoctor === selectedDoctor;

    return matchesSearch && matchesPriority && matchesStatus && matchesDoctor;
  });

  const waitingCount = queue.filter((p) => p.queueStatus === "WAITING").length;
  const inChamberCount = queue.filter((p) => p.queueStatus === "IN_CHAMBER").length;
  const statCount = queue.filter((p) => p.triagePriority === "STAT_EMERGENCY" && p.queueStatus !== "COMPLETED").length;
  const completedTodayCount = queue.filter((p) => p.queueStatus === "COMPLETED").length;

  return (
    <div className="space-y-4">
      {/* ── Metric Summary Bar (Ultra Light White Theme) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">In Active Consultation</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{inChamberCount}</span>
            <span className="text-xs text-slate-500 font-medium">In Doctor Chamber</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Waiting in OPD Lounge</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{waitingCount}</span>
            <span className="text-xs text-sky-600 font-medium">Tokens in Queue</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">STAT Emergency / Triage</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700">{statCount}</span>
            <span className="text-xs text-rose-600 font-medium">Immediate Priority</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Consultations Completed</span>
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{completedTodayCount}</span>
            <span className="text-xs text-teal-600 font-medium">Finished Today</span>
          </div>
        </div>

      </div>

      {/* ── Search and Filter Controls ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search patient by name, UHID, token no, symptoms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-xs font-medium placeholder-slate-400 focus:border-sky-600 focus:outline-none bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="rounded-xl border border-slate-200 py-2 px-3 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-sky-600"
            >
              <option value="ALL">All Consulting Doctors</option>
              {doctorsList.map((doc) => (
                <option key={doc} value={doc}>
                  {doc}
                </option>
              ))}
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="rounded-xl border border-slate-200 py-2 px-3 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-sky-600"
            >
              <option value="ALL">All Triage Levels</option>
              <option value="STAT_EMERGENCY">STAT / Emergency</option>
              <option value="URGENT">Urgent Priority</option>
              <option value="ROUTINE">Routine OPD</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200 py-2 px-3 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-sky-600"
            >
              <option value="ACTIVE">Active Queue (Waiting & In-Chamber)</option>
              <option value="WAITING">Waiting Only</option>
              <option value="IN_CHAMBER">In Chamber Only</option>
              <option value="COMPLETED">Completed Consultations</option>
              <option value="ALL">All Records</option>
            </select>

            <button
              type="button"
              onClick={handleCallNextWaiting}
              className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs border border-sky-200 transition flex items-center gap-1.5 cursor-pointer"
              title="Chime & Call Next Waiting Patient"
            >
              <Volume2 className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
              <span>Call Next</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCheckInOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Register New Walk-In Patient Token"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Check-In Walk-In</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── OPD Patient Queue Table (Clinical Grade) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Token / Priority</th>
                <th className="py-3 px-4">Patient Information</th>
                <th className="py-3 px-4">Chief Complaint & Symptoms</th>
                <th className="py-3 px-4">Triage Vitals</th>
                <th className="py-3 px-4">Consultant & Chamber</th>
                <th className="py-3 px-4">Queue Status</th>
                <th className="py-3 px-4 text-right">Doctor Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No patients found in this OPD queue filter.</p>
                    <p className="text-[11px] text-slate-400">Select another filter or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredQueue.map((p) => {
                  const isStat = p.triagePriority === "STAT_EMERGENCY";
                  const isInChamber = p.queueStatus === "IN_CHAMBER";
                  const isCompleted = p.queueStatus === "COMPLETED";

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isInChamber ? "bg-emerald-50/40" : isStat ? "bg-rose-50/20" : ""
                      }`}
                    >
                      {/* Token / Priority */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm font-mono bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg">
                            {p.tokenNumber}
                          </span>
                          {isStat && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                              STAT
                            </span>
                          )}
                          {p.triagePriority === "URGENT" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Priority
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" /> Check-in: {p.checkInTime}
                        </div>
                      </td>

                      {/* Patient Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.patientName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {p.uhid} • {p.age}y / {p.gender}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {p.phone}
                        </div>
                      </td>

                      {/* Chief Complaint */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-800 font-medium line-clamp-2">
                          {p.chiefComplaint}
                        </p>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                          {p.visitType.replace("_", " ")}
                        </span>
                      </td>

                      {/* Triage Vitals */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5 text-[11px]">
                          <span className="text-slate-700">
                            <strong>BP:</strong> {p.vitals.bloodPressure}
                          </span>
                          <span className="text-slate-700">
                            <strong>Pulse:</strong> {p.vitals.pulseRate} bpm • <strong>SpO2:</strong> {p.vitals.spO2}%
                          </span>
                          <span className="text-slate-500">
                            <strong>Temp:</strong> {p.vitals.temperature}
                          </span>
                          {p.vitals.bloodGlucose && (
                            <span className="text-amber-700 font-semibold">
                              <strong>RBS:</strong> {p.vitals.bloodGlucose}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Attending Doctor & Chamber */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{p.attendingDoctor}</div>
                        <div className="text-[11px] text-sky-700 font-medium mt-0.5">
                          📍 {p.chamberNumber}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isInChamber ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                            In Chamber
                          </span>
                        ) : isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                            Completed
                          </span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 w-fit">
                              Waiting
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              Est. wait: ~{p.estimatedWaitMinutes} min
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => setTokenSlipPatient(p)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition"
                            title="Print OPD Token Slip"
                          >
                            <Ticket className="w-3.5 h-3.5 text-slate-600" />
                          </button>

                          {!isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleChimeCall(p)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition"
                              title="Announce & Call Token"
                            >
                              <Volume2 className="w-3.5 h-3.5 text-sky-600" />
                            </button>
                          )}

                          {!isInChamber && !isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleStartConsultation(p.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] transition shadow-2xs cursor-pointer"
                              title="Begin Consultation"
                            >
                              Call In
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onOpenNewRx && onOpenNewRx(p)}
                            className="px-2.5 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                            title="Write Electronic Prescription"
                          >
                            <FileSignature className="w-3 h-3 text-teal-600" />
                            <span>Rx</span>
                          </button>

                          {isInChamber && (
                            <button
                              type="button"
                              onClick={() => handleMarkCompleted(p.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-2xs cursor-pointer"
                              title="Conclude Consultation"
                            >
                              Done
                            </button>
                          )}
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

      {/* ── WALK-IN TOKEN CHECK-IN MODAL (Clinical Grade) ── */}
      {isCheckInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <Ticket className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    OPD Walk-In Token & Triage Check-In
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Issue instantaneous chamber token and record triage vitals
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckInOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterWalkIn} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    placeholder="e.g. Smt. Kamala Devi"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={walkInAge}
                    onChange={(e) => setWalkInAge(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={walkInGender}
                    onChange={(e) => setWalkInGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-teal-600 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    placeholder="+91 98XXX XXXXX"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Triage Urgency</label>
                  <select
                    value={walkInPriority}
                    onChange={(e) => setWalkInPriority(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold focus:border-teal-600 focus:outline-none"
                  >
                    <option value="ROUTINE">Routine OPD</option>
                    <option value="URGENT">Urgent Priority</option>
                    <option value="STAT_EMERGENCY">🚨 STAT Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Chief Complaint / Symptoms
                </label>
                <input
                  type="text"
                  value={walkInComplaint}
                  onChange={(e) => setWalkInComplaint(e.target.value)}
                  placeholder="e.g. Fever, persistent cough x 3 days"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-teal-600 focus:outline-none"
                />
              </div>

              {/* Triage Vitals */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                  Triage Vitals (Optional / Pre-Consultation)
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500">BP</label>
                    <input
                      type="text"
                      value={walkInBp}
                      onChange={(e) => setWalkInBp(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500">Pulse</label>
                    <input
                      type="number"
                      value={walkInPulse}
                      onChange={(e) => setWalkInPulse(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500">SpO2</label>
                    <input
                      type="number"
                      value={walkInSpO2}
                      onChange={(e) => setWalkInSpO2(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500">Temp</label>
                    <input
                      type="text"
                      value={walkInTemp}
                      onChange={(e) => setWalkInTemp(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Chamber</label>
                  <select
                    value={walkInChamber}
                    onChange={(e) => setWalkInChamber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold bg-white"
                  >
                    <option value="Chamber 102">Chamber 102 (Cardiology)</option>
                    <option value="Chamber 105">Chamber 105 (Endocrinology)</option>
                    <option value="Chamber 108">Chamber 108 (Pediatrics)</option>
                    <option value="Chamber 101">Chamber 101 (General Med)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Consulting Doctor</label>
                  <select
                    value={walkInDoctor}
                    onChange={(e) => setWalkInDoctor(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold bg-white"
                  >
                    <option value="Dr. Rajesh Sharma (Cardiology)">Dr. Rajesh Sharma</option>
                    <option value="Dr. Ananya Sen (Endocrinology)">Dr. Ananya Sen</option>
                    <option value="Dr. Priyanka Gupta (Pediatrics)">Dr. Priyanka Gupta</option>
                    <option value="Dr. Vikram Seth (General Medicine)">Dr. Vikram Seth</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCheckInOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Generate Token & Add to Queue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TOKEN THERMAL SLIP PREVIEW MODAL ── */}
      {tokenSlipPatient && (
        <OpdTokenA4PrintModal
          item={{
            id: tokenSlipPatient.id,
            tokenNumber: tokenSlipPatient.tokenNumber,
            patientName: tokenSlipPatient.patientName,
            age: tokenSlipPatient.age,
            gender: tokenSlipPatient.gender === "M" ? "Male" : tokenSlipPatient.gender === "F" ? "Female" : "Other",
            phone: tokenSlipPatient.phone,
            uhid: tokenSlipPatient.uhid,
            abhaAddress: tokenSlipPatient.abhaId ? `${tokenSlipPatient.patientName.toLowerCase().replace(/[^a-z0-9]/g, "")}@abdm` : undefined,
            department: tokenSlipPatient.department,
            doctorName: tokenSlipPatient.attendingDoctor,
            roomNumber: tokenSlipPatient.chamberNumber,
            visitType: tokenSlipPatient.visitType === "Emergency" ? "Urgent" : tokenSlipPatient.visitType === "Walk-In" ? "New Visit" : "Follow-Up",
            priority: tokenSlipPatient.priority === "STAT" ? "STAT" : tokenSlipPatient.priority === "Priority" ? "VIP" : "Normal",
            status: "Consulting",
            checkInTime: tokenSlipPatient.checkInTime,
            estimatedWaitMins: tokenSlipPatient.estimatedWaitMinutes,
            vitalsLogged: true,
            paymentStatus: "Paid",
            consultationFee: 600,
            chiefComplaint: tokenSlipPatient.chiefComplaint,
          }}
          onClose={() => setTokenSlipPatient(null)}
        />
      )}
    </div>
  );
}
