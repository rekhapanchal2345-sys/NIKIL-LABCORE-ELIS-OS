"use client";

import { useState } from "react";
import { 
  Users, 
  Volume2, 
  BellRing, 
  QrCode, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Building2,
  ChevronRight,
  Plus
} from "lucide-react";

interface TokenItem {
  tokenNumber: string;
  patientName: string;
  uhid: string;
  testCategory: string;
  isAbhaLinked: boolean;
  isPriority: boolean;
  waitMins: number;
}

export default function OpdTokenQueueWidget() {
  const [currentDesk1, setCurrentDesk1] = useState<{ token: string; patient: string; desk: string }>({
    token: "A-042",
    patient: "Sunil K. Verma",
    desk: "Phlebotomy Desk 01 (Room 102)",
  });

  const [currentDesk2, setCurrentDesk2] = useState<{ token: string; patient: string; desk: string }>({
    token: "B-018",
    patient: "Kavita R. Nair",
    desk: "Phlebotomy Desk 02 (Room 103)",
  });

  const [waitingQueue, setWaitingQueue] = useState<TokenItem[]>([
    {
      tokenNumber: "A-043",
      patientName: "Deepak S. Patil",
      uhid: "UHID-2026-9110",
      testCategory: "CBC + Blood Glucose (F/PP)",
      isAbhaLinked: true,
      isPriority: false,
      waitMins: 4,
    },
    {
      tokenNumber: "EM-005",
      patientName: "Savitri Devi (Senior Citizen)",
      uhid: "UHID-2026-9111",
      testCategory: "Serum Electrolytes + Renal Panel",
      isAbhaLinked: true,
      isPriority: true,
      waitMins: 2,
    },
    {
      tokenNumber: "AB-012",
      patientName: "Mohd. Tariq Ansari",
      uhid: "UHID-2026-9112",
      testCategory: "Lipid Profile + Liver Panel",
      isAbhaLinked: true,
      isPriority: false,
      waitMins: 7,
    },
    {
      tokenNumber: "A-044",
      patientName: "Pooja Hegde",
      uhid: "UHID-2026-9113",
      testCategory: "Thyroid Profile (TSH)",
      isAbhaLinked: false,
      isPriority: false,
      waitMins: 9,
    },
    {
      tokenNumber: "A-045",
      patientName: "Rohan J. Shah",
      uhid: "UHID-2026-9114",
      testCategory: "HbA1c Glycated Hemoglobin",
      isAbhaLinked: true,
      isPriority: false,
      waitMins: 11,
    },
  ]);

  const [chimeActive, setChimeActive] = useState(false);
  const [lastAnnounced, setLastAnnounced] = useState<string | null>(null);

  const handleCallNext = (deskNum: 1 | 2) => {
    if (waitingQueue.length === 0) return;

    // Pick top priority or first token
    const priorityIndex = waitingQueue.findIndex((t) => t.isPriority);
    const targetIndex = priorityIndex !== -1 ? priorityIndex : 0;
    const nextPatient = waitingQueue[targetIndex];

    const remaining = waitingQueue.filter((_, idx) => idx !== targetIndex);
    setWaitingQueue(remaining);

    if (deskNum === 1) {
      setCurrentDesk1({
        token: nextPatient.tokenNumber,
        patient: nextPatient.patientName,
        desk: "Phlebotomy Desk 01 (Room 102)",
      });
    } else {
      setCurrentDesk2({
        token: nextPatient.tokenNumber,
        patient: nextPatient.patientName,
        desk: "Phlebotomy Desk 02 (Room 103)",
      });
    }

    setLastAnnounced(`Token ${nextPatient.tokenNumber} please proceed to Phlebotomy Desk 0${deskNum}`);
    setChimeActive(true);
    setTimeout(() => setChimeActive(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Audio Announcement Simulation Banner */}
      {chimeActive && (
        <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold animate-pulse">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 animate-bounce" />
            <span>LOBBY CHIME: &ldquo;{lastAnnounced}&rdquo;</span>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono uppercase">
            Audio Broadcast Active
          </span>
        </div>
      )}

      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 via-white to-sky-50/30">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-600" />
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
              Hospital OPD Reception & Phlebotomy Token Calling Desk
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              ABHA Fast-Track Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Lobby patient queue control, automated token display broadcast, and Ayushman Bharat Scan & Share digital intake counter.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Avg Phlebotomy Draw Time</span>
            <span className="font-extrabold text-slate-900 text-sm">4.2 mins</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Serving Desks + Waiting Queue */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: 2 Active Phlebotomy Calling Counters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <BellRing className="h-3.5 w-3.5 text-sky-600" /> Currently Serving at Counters
          </h4>

          {/* Desk 1 Card */}
          <div className="bg-gradient-to-br from-sky-50/80 via-white to-slate-50 border-2 border-sky-300/80 rounded-2xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-600 text-white uppercase tracking-wider">
                  Counter 01
                </span>
                <p className="text-xs font-bold text-slate-600 mt-1">{currentDesk1.desk}</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="my-3 text-center py-2 bg-white rounded-xl border border-sky-100 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Token Number</span>
              <span className="text-3xl font-black text-sky-700 font-mono tracking-tight block">
                {currentDesk1.token}
              </span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate px-2">
                {currentDesk1.patient}
              </span>
            </div>

            <button
              onClick={() => handleCallNext(1)}
              className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Call Next Token to Desk 01</span>
            </button>
          </div>

          {/* Desk 2 Card */}
          <div className="bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 border-2 border-indigo-300/80 rounded-2xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white uppercase tracking-wider">
                  Counter 02
                </span>
                <p className="text-xs font-bold text-slate-600 mt-1">{currentDesk2.desk}</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="my-3 text-center py-2 bg-white rounded-xl border border-indigo-100 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Token Number</span>
              <span className="text-3xl font-black text-indigo-700 font-mono tracking-tight block">
                {currentDesk2.token}
              </span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate px-2">
                {currentDesk2.patient}
              </span>
            </div>

            <button
              onClick={() => handleCallNext(2)}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Call Next Token to Desk 02</span>
            </button>
          </div>
        </div>

        {/* Right: Up Next Waiting Queue (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              Waiting in Phlebotomy Lobby ({waitingQueue.length} Patients)
            </h4>
            <span className="text-[11px] text-slate-400">Next Estimated Wait: ~3-5 mins</span>
          </div>

          <div className="bg-slate-50/60 rounded-xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
            {waitingQueue.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-700">Lobby Waiting Queue Clear</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All waiting outpatients have been called for sample draw</p>
              </div>
            ) : (
              waitingQueue.map((item, idx) => (
                <div
                  key={item.tokenNumber}
                  className={`p-3 transition-colors flex items-center justify-between gap-3 text-xs ${
                    item.isPriority ? "bg-amber-50/70" : "hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-12 rounded-lg font-mono font-black flex items-center justify-center text-xs shadow-2xs ${
                      item.isPriority
                        ? "bg-amber-600 text-white"
                        : "bg-white border border-slate-200 text-slate-900"
                    }`}>
                      {item.tokenNumber}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 truncate">
                          {item.patientName}
                        </span>
                        {item.isPriority && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-600 text-white">
                            Senior / STAT
                          </span>
                        )}
                        {item.isAbhaLinked && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-200">
                            ABHA M1
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        <span className="font-mono text-slate-600">{item.uhid}</span> • {item.testCategory}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {item.waitMins}m wait
                    </span>
                    <button
                      onClick={() => handleCallNext(1)}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-sky-400 text-sky-700 text-[11px] font-bold shadow-2xs transition-colors"
                    >
                      Call Now
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick ABHA Fast-Track Kiosk Banner */}
          <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-white rounded-xl border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                <QrCode className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-emerald-950">Ayushman Bharat Scan & Share Kiosk</p>
                <p className="text-[11px] text-emerald-700">Patients scanning QR token receive priority phlebotomy draw token instantly</p>
              </div>
            </div>
            <a
              href="/abdm"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-2xs whitespace-nowrap"
            >
              Open ABDM Kiosk &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
