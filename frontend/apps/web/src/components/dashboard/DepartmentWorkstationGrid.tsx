"use client";

import { useState } from "react";
import { 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Zap, 
  Radio, 
  Activity, 
  FileSpreadsheet, 
  Sparkles, 
  RefreshCw,
  Sliders,
  ShieldCheck,
  Server
} from "lucide-react";

interface Workstation {
  id: string;
  name: string;
  code: string;
  department: string;
  instruments: string[];
  protocol: "ASTM E1394" | "HL7 v2.5" | "Bi-directional TCP";
  port: string;
  status: "ONLINE" | "BUSY" | "STANDBY" | "QC_WARNING";
  completedToday: number;
  totalBatch: number;
  qcStatus: "PASSED (1-2s)" | "PENDING_RUN" | "CALIBRATION_DUE";
  reagentsStatus: "OPTIMAL (82%)" | "LOW_LYSE (14%)" | "GOOD (94%)";
  currentTestAssay: string;
}

export default function DepartmentWorkstationGrid() {
  const [workstations, setWorkstations] = useState<Workstation[]>([
    {
      id: "ws-hema",
      name: "Hematology & Hemostasis Station",
      code: "DEPT-HEM-01",
      department: "Hematology",
      instruments: ["Sysmex XN-1000 (5-Part)", "Stago Compact Max Coag"],
      protocol: "ASTM E1394",
      port: "COM3 / RS-232 9600-8-N-1",
      status: "BUSY",
      completedToday: 54,
      totalBatch: 68,
      qcStatus: "PASSED (1-2s)",
      reagentsStatus: "OPTIMAL (82%)",
      currentTestAssay: "CBC 5-Diff + ESR Batch #14",
    },
    {
      id: "ws-bio",
      name: "Clinical Biochemistry Station",
      code: "DEPT-BIO-02",
      department: "Biochemistry",
      instruments: ["Roche Cobas c311 Chemistry Analyzer"],
      protocol: "HL7 v2.5",
      port: "TCP/IP 192.168.1.120:5000",
      status: "ONLINE",
      completedToday: 82,
      totalBatch: 95,
      qcStatus: "PASSED (1-2s)",
      reagentsStatus: "GOOD (94%)",
      currentTestAssay: "LFT, KFT, Lipid Profile Carousel",
    },
    {
      id: "ws-clia",
      name: "Chemiluminescence Immunoassay (CLIA)",
      code: "DEPT-IMM-03",
      department: "Immunology & Hormones",
      instruments: ["Mindray CL-900i", "Abbott Architect i1000SR"],
      protocol: "HL7 v2.5",
      port: "TCP/IP 192.168.1.125:5001",
      status: "ONLINE",
      completedToday: 31,
      totalBatch: 40,
      qcStatus: "PASSED (1-2s)",
      reagentsStatus: "OPTIMAL (82%)",
      currentTestAssay: "Thyroid Profile (T3, T4, TSH) & hs-cTnI",
    },
    {
      id: "ws-micro",
      name: "Microbiology & Automated Blood Cultures",
      code: "DEPT-MIC-04",
      department: "Microbiology",
      instruments: ["bioMérieux BacT/ALERT 3D", "VITEK 2 Compact"],
      protocol: "Bi-directional TCP",
      port: "TCP/IP 192.168.1.130:4000",
      status: "STANDBY",
      completedToday: 12,
      totalBatch: 18,
      qcStatus: "PASSED (1-2s)",
      reagentsStatus: "GOOD (94%)",
      currentTestAssay: "Blood Culture Continuous Monitoring (36h / 48h)",
    },
    {
      id: "ws-urin",
      name: "Clinical Pathology & Urinalysis",
      code: "DEPT-CP-05",
      department: "Clinical Pathology",
      instruments: ["Dirui FUS-2000 Automated Urinalysis"],
      protocol: "ASTM E1394",
      port: "COM4 / RS-232",
      status: "ONLINE",
      completedToday: 26,
      totalBatch: 30,
      qcStatus: "PASSED (1-2s)",
      reagentsStatus: "OPTIMAL (82%)",
      currentTestAssay: "Complete Urine Chemistry & Formed Elements",
    },
  ]);

  const [activeDepartment, setActiveDepartment] = useState<string>("ALL");
  const [pingingId, setPingingId] = useState<string | null>(null);

  const handlePingInstrument = (id: string) => {
    setPingingId(id);
    setTimeout(() => {
      setPingingId(null);
    }, 1200);
  };

  const getStatusBadge = (status: Workstation["status"]) => {
    switch (status) {
      case "ONLINE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online Ready
          </span>
        );
      case "BUSY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-spin" /> Assay Running
          </span>
        );
      case "STANDBY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Idle Standby
          </span>
        );
      case "QC_WARNING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="h-3 w-3 text-amber-600" /> QC Warning
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 via-white to-sky-50/30">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-sky-600" />
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
              Laboratory Department Workstations & Analyzer Interfacing
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Bi-directional Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time ASTM E1394 and HL7 v2.5 automated instrument worklist queues, 3-level Westgard quality control compliance, and reagent telemetry.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
          {["ALL", "Hematology", "Biochemistry", "Immunology & Hormones", "Microbiology"].map((dept) => (
            <button
              key={dept}
              onClick={() => setActiveDepartment(dept)}
              className={`px-3 py-1 rounded-lg transition-all whitespace-nowrap ${
                activeDepartment === dept
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {dept === "Immunology & Hormones" ? "CLIA / Immuno" : dept}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Workstation Cards */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {workstations
          .filter((ws) => activeDepartment === "ALL" || ws.department === activeDepartment)
          .map((ws) => {
            const pct = Math.round((ws.completedToday / ws.totalBatch) * 100);
            return (
              <div
                key={ws.id}
                className="bg-white rounded-xl border border-slate-200/90 hover:border-sky-300 p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {ws.code} • {ws.department}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 mt-0.5">
                        {ws.name}
                      </h4>
                    </div>
                    {getStatusBadge(ws.status)}
                  </div>

                  {/* Connected Instruments */}
                  <div className="mt-2.5 p-2 rounded-lg bg-slate-50/80 border border-slate-100 text-[11px] space-y-1">
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                      Instruments Online:
                    </span>
                    {ws.instruments.map((inst, i) => (
                      <div key={i} className="flex items-center gap-1.5 font-bold text-slate-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                        <span>{inst}</span>
                      </div>
                    ))}
                  </div>

                  {/* Progress & Throughput */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Daily Throughput:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {ws.completedToday} / {ws.totalBatch} Samples ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-sky-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Current Active Assay */}
                  <div className="mt-3 text-[11px] bg-sky-50/50 p-2 rounded-lg border border-sky-100 flex items-center justify-between">
                    <span className="text-sky-800 font-semibold truncate">{ws.currentTestAssay}</span>
                    <span className="text-[10px] text-sky-600 font-bold ml-1 flex-shrink-0">In Queue</span>
                  </div>

                  {/* Telemetry Strip: QC & Reagents */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase block font-semibold">QC Westgard</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> {ws.qcStatus}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase block font-semibold">Reagent Pack</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{ws.reagentsStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Strip: Protocol & Ping test */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                    <span className="font-bold text-slate-700">{ws.protocol}</span> • {ws.port}
                  </div>

                  <button
                    onClick={() => handlePingInstrument(ws.id)}
                    disabled={pingingId === ws.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold shadow-2xs transition-colors"
                  >
                    <RefreshCw className={`h-3 w-3 text-sky-600 ${pingingId === ws.id ? "animate-spin" : ""}`} />
                    <span>{pingingId === ws.id ? "Pinging..." : "Port Ping"}</span>
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Footer System Guidance */}
      <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <Server className="h-4 w-4 text-slate-400" />
          <span>Local LIS Middleware: <strong>Port 5000 / 5001 Active</strong> • Zero Data Packet Drops in last 24h</span>
        </div>
        <span className="font-bold text-slate-700 hidden sm:inline">Automatic Worklist Ingestion: Enabled</span>
      </div>
    </div>
  );
}
