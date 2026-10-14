"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Bed, 
  Clock, 
  Timer, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw, 
  ShieldCheck, 
  Snowflake, 
  Send, 
  UserRound, 
  Flame, 
  Printer, 
  Check, 
  AlertCircle 
} from "lucide-react";
import type { Sample } from "@/app/samples/page";

interface WardRequest {
  id: string;
  uhid: string;
  patientName: string;
  age: number;
  gender: string;
  ward: string;
  roomBed: string;
  testName: string;
  tubeType: string;
  tubeColor: string;
  priority: "STAT" | "URGENT" | "ROUTINE";
  fastingStatus: "Fasting 12h" | "Random" | "Post-Prandial";
  doctorName: string;
  requestedAt: string;
  status: "PENDING_DISPATCH" | "RUNNER_ASSIGNED" | "DRAWN_IN_TRANSIT" | "RECEIVED_AT_LAB";
  runnerName?: string;
}

const MOCK_WARD_REQUESTS: WardRequest[] = [
  {
    id: "WRD-8021",
    uhid: "UHID-90821",
    patientName: "Rajesh Kumar",
    age: 58,
    gender: "Male",
    ward: "ICU Bed 04 (Cardiac)",
    roomBed: "Bed 04",
    testName: "Troponin I High-Sensitivity & Arterial Blood Gas",
    tubeType: "Green Heparin & SST Gold",
    tubeColor: "#10B981",
    priority: "STAT",
    fastingStatus: "Random",
    doctorName: "Dr. A. Sharma (Critical Care)",
    requestedAt: "10 mins ago",
    status: "PENDING_DISPATCH",
    runnerName: "Phleb. Vikram Singh",
  },
  {
    id: "WRD-8022",
    uhid: "UHID-44120",
    patientName: "Meenakshi Devi",
    age: 72,
    gender: "Female",
    ward: "Inpatient Ward 3B (Nephrology)",
    roomBed: "Room 312 / Bed B",
    testName: "Serum Electrolytes (Na+, K+, Cl-) & Serum Creatinine",
    tubeType: "Gold SST Gel",
    tubeColor: "#F59E0B",
    priority: "URGENT",
    fastingStatus: "Fasting 12h",
    doctorName: "Dr. K. Nair (Nephrology)",
    requestedAt: "25 mins ago",
    status: "RUNNER_ASSIGNED",
    runnerName: "Phleb. Priya Patel",
  },
  {
    id: "WRD-8023",
    uhid: "UHID-65109",
    patientName: "Baby of Ananya (NICU)",
    age: 0,
    gender: "Female",
    ward: "NICU Radiant Warmer 02",
    roomBed: "Warmer 02",
    testName: "Total & Direct Serum Bilirubin (Micro-tainer)",
    tubeType: "Amber Micro-SST (Light Protected)",
    tubeColor: "#EAB308",
    priority: "STAT",
    fastingStatus: "Random",
    doctorName: "Dr. S. Kulkarni (Neonatologist)",
    requestedAt: "15 mins ago",
    status: "PENDING_DISPATCH",
  },
  {
    id: "WRD-8024",
    uhid: "UHID-78194",
    patientName: "Gopal Chandran",
    age: 46,
    gender: "Male",
    ward: "Surgical Post-Op Ward 2A",
    roomBed: "Bed 14",
    testName: "Coagulation Profile (PT/INR, APTT)",
    tubeType: "Light Blue Citrate (Exact 9:1 fill)",
    tubeColor: "#0284C7",
    priority: "ROUTINE",
    fastingStatus: "Random",
    doctorName: "Dr. M. Roy (Gen Surgery)",
    requestedAt: "40 mins ago",
    status: "DRAWN_IN_TRANSIT",
    runnerName: "Phleb. Vikram Singh",
  },
];

interface SampleWardDispatchProps {
  onCollectSuccess?: () => void;
}

export default function SampleWardDispatch({ onCollectSuccess }: SampleWardDispatchProps) {
  const [requests, setRequests] = useState<WardRequest[]>(MOCK_WARD_REQUESTS);
  const [filterWard, setFilterWard] = useState<string>("ALL");
  const [selectedRequest, setSelectedRequest] = useState<WardRequest | null>(MOCK_WARD_REQUESTS[0]);

  // CLSI GP41 60-Second Tourniquet Safety Timer
  const [tourniquetSeconds, setTourniquetSeconds] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [coldChainBoxId, setColdChainBoxId] = useState("COOL-BOX-04");
  const [transitTemp, setTransitTemp] = useState("3.8°C");
  const [runnerNote, setRunnerNote] = useState("");
  const [actionDoneMsg, setActionDoneMsg] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (timerRunning && tourniquetSeconds > 0) {
      interval = setInterval(() => {
        setTourniquetSeconds((s) => s - 1);
      }, 1000);
    } else if (tourniquetSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      // Play warning tone
      if (typeof window !== "undefined") {
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "square";
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
          }
        } catch (e) {}
      }
    }
    return () => clearInterval(interval);
  }, [timerRunning, tourniquetSeconds]);

  const resetTourniquetTimer = () => {
    setTimerRunning(false);
    setTourniquetSeconds(60);
  };

  const handleMarkDrawn = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status: "DRAWN_IN_TRANSIT" as const, runnerName: "Phleb. Runner (Shift A)" }
          : r
      )
    );
    setActionDoneMsg(`Specimen drawn at bedside for ${selectedRequest?.patientName}. In transit to Central Lab.`);
    setTimeout(() => setActionDoneMsg(null), 4000);
  };

  const handleMarkReceived = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: "RECEIVED_AT_LAB" as const } : r
      )
    );
    setActionDoneMsg(`Specimen accessioned at Central Lab accession bench. Temperature verified at ${transitTemp}.`);
    setTimeout(() => setActionDoneMsg(null), 4000);
    onCollectSuccess?.();
  };

  const filtered = requests.filter((r) => {
    if (filterWard === "ALL") return true;
    if (filterWard === "ICU") return r.ward.includes("ICU") || r.ward.includes("NICU");
    if (filterWard === "INPATIENT") return r.ward.includes("Ward");
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Station Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100 shadow-xs">
              <Bed className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Hospital Bedside &amp; Inpatient Phlebotomy Dispatch Runner
                </h3>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  24x7 Ward Runner Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Hospital inpatient requisition tracking, bedside patient wristband verification, and cold-chain sample transport
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
              <Building2 className="h-3.5 w-3.5 text-sky-600" /> Active Wards: 4
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-800">
              <Flame className="h-3.5 w-3.5 fill-rose-600" /> STAT Bedside Calls: 2
            </span>
          </div>
        </div>

        {actionDoneMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionDoneMsg}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Side: Ward Request List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 text-xs">
              {(["ALL", "ICU", "INPATIENT"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterWard(tab)}
                  className={`rounded-lg px-3 py-1.5 font-bold transition-colors ${
                    filterWard === tab ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab === "ALL" ? "All Wards" : tab === "ICU" ? "ICU / NICU" : "General Wards"}
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {filtered.length} requisitions
            </span>
          </div>

          <div className="space-y-3">
            {filtered.map((item) => {
              const isSelected = selectedRequest?.id === item.id;
              const isStat = item.priority === "STAT";

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedRequest(item)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all shadow-xs ${
                    isSelected
                      ? "border-sky-400 bg-sky-50/60 ring-2 ring-sky-400/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{item.patientName}</span>
                        <span className="text-xs text-slate-500">({item.age}y/{item.gender[0]})</span>
                      </div>
                      <p className="mt-0.5 text-xs font-bold text-sky-700 flex items-center gap-1">
                        <Bed className="h-3.5 w-3.5 text-sky-600" />
                        <span>{item.ward}</span>
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        isStat
                          ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                          : item.priority === "URGENT"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <div className="mt-2.5 rounded-xl bg-slate-50 p-2.5 text-xs border border-slate-100">
                    <p className="font-bold text-slate-800 truncate">{item.testName}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-semibold" style={{ color: item.tubeColor }}>
                        ● {item.tubeType}
                      </span>
                      <span>Req: {item.requestedAt}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                    <span className="font-mono text-slate-400">{item.uhid}</span>
                    <span
                      className={`font-bold ${
                        item.status === "DRAWN_IN_TRANSIT"
                          ? "text-sky-700"
                          : item.status === "RECEIVED_AT_LAB"
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      {item.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Bedside Phlebotomy Action Console (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {selectedRequest ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
              {/* Header Details */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                    Active Bedside Requisition
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-0.5">
                    {selectedRequest.patientName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>UHID: <strong className="text-slate-800 font-mono">{selectedRequest.uhid}</strong></span>
                    <span>•</span>
                    <span>Ward: <strong className="text-slate-800">{selectedRequest.ward}</strong></span>
                    <span>•</span>
                    <span>Dr: <strong className="text-slate-800">{selectedRequest.doctorName}</strong></span>
                  </div>
                </div>

                <span
                  className={`rounded-xl px-3 py-1 text-xs font-black uppercase tracking-wider ${
                    selectedRequest.priority === "STAT"
                      ? "bg-rose-50 text-rose-800 border border-rose-200"
                      : "bg-sky-50 text-sky-800 border border-sky-200"
                  }`}
                >
                  {selectedRequest.priority} PROTOCOL
                </span>
              </div>

              {/* CLSI GP41 60-Second Tourniquet Safety Clock */}
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
                      <Timer className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                        CLSI GP41 Tourniquet Safety Timer
                      </h4>
                      <p className="text-[11px] text-amber-800">
                        Release within 60s to prevent hemoconcentration, elevated $K^+$, and hemolysis.
                      </p>
                    </div>
                  </div>

                  {/* Timer Display */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`font-mono text-2xl font-black ${tourniquetSeconds < 15 ? "text-rose-600 animate-pulse" : "text-amber-950"}`}>
                        00:{tourniquetSeconds.toString().padStart(2, "0")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setTimerRunning(!timerRunning)}
                        className={`rounded-lg p-2 font-bold transition-colors ${
                          timerRunning
                            ? "bg-amber-200 text-amber-900 hover:bg-amber-300"
                            : "bg-amber-600 text-white hover:bg-amber-700"
                        }`}
                      >
                        {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={resetTourniquetTimer}
                        className="rounded-lg p-2 text-amber-800 hover:bg-amber-200 transition-colors"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {tourniquetSeconds === 0 && (
                  <div className="mt-3 rounded-xl border border-rose-300 bg-rose-100 p-2 text-xs font-bold text-rose-900 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-700 shrink-0" />
                    <span>⚠️ Tourniquet exceeded 60 seconds! Release immediately before blood aspiration!</span>
                  </div>
                )}
              </div>

              {/* Specimen Specification & Bedside Double ID */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Ordered Panel</span>
                  <p className="font-bold text-slate-900 text-sm">{selectedRequest.testName}</p>
                  <p className="text-[11px] text-slate-500">Fasting: <strong>{selectedRequest.fastingStatus}</strong></p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Vacutainer Target</span>
                  <p className="font-bold text-purple-900 text-sm flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedRequest.tubeColor }} />
                    {selectedRequest.tubeType}
                  </p>
                  <p className="text-[11px] text-slate-500">Invert gently 8–10 times right after draw</p>
                </div>
              </div>

              {/* Cold-Chain Transport Carrier Log */}
              <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-950">
                    <Snowflake className="h-4 w-4 text-sky-600" />
                    <span>Cold-Chain Carrier Transport Pouch</span>
                  </div>
                  <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    Ice Pack Insulated
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Carrier Cool-Box ID</label>
                    <input
                      value={coldChainBoxId}
                      onChange={(e) => setColdChainBoxId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Transit Sensor Temp</label>
                    <input
                      value={transitTemp}
                      onChange={(e) => setTransitTemp(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <button
                  onClick={() => window.open(`/samples/${selectedRequest.id}/label`, "_blank")}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <Printer className="h-4 w-4 inline mr-1.5 text-slate-500" /> Print Bedside Label
                </button>

                <div className="flex items-center gap-2">
                  {selectedRequest.status !== "DRAWN_IN_TRANSIT" && selectedRequest.status !== "RECEIVED_AT_LAB" && (
                    <button
                      onClick={() => handleMarkDrawn(selectedRequest.id)}
                      className="rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-700 shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <Check className="h-4 w-4" />
                      <span>Mark Drawn at Bedside</span>
                    </button>
                  )}

                  {selectedRequest.status === "DRAWN_IN_TRANSIT" && (
                    <button
                      onClick={() => handleMarkReceived(selectedRequest.id)}
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Accession at Central Lab</span>
                    </button>
                  )}

                  {selectedRequest.status === "RECEIVED_AT_LAB" && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Accessioned at Lab
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-400">
              <Bed className="h-12 w-12 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">Select an Inpatient Ward Requisition</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Choose a bed from the list on the left to start bedside wristband verification, tourniquet timer, and cold-chain carrier dispatch.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
