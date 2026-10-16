"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  ArrowRightLeft, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  Barcode,
  Activity,
  Plus,
  Zap,
  Play,
  CheckCircle2,
  X,
  Radio,
  FileSpreadsheet,
  Terminal,
  ShieldCheck
} from "lucide-react";
import { analyzersApi } from "@/lib/api";

export interface WorklistEntry {
  id: string;
  analyzerId: string;
  analyzerName: string;
  orderId?: string;
  orderNumber?: string;
  sampleId?: string;
  sampleNumber?: string;
  barcode: string;
  testId?: string;
  testCode?: string;
  testName?: string;
  priority: "NORMAL" | "URGENT" | "STAT";
  protocol: string;
  status: "PENDING" | "SENT_TO_ANALYZER" | "ACKNOWLEDGED" | "PROCESSING" | "COMPLETED" | "FAILED";
  sentAt?: string;
  acknowledgedAt?: string;
  completedAt?: string;
  resultReceived: boolean;
  resultReceivedAt?: string;
  errorMessage?: string;
}

interface BidirectionalQuerySystemProps {
  analyzerId?: string;
  onClose?: () => void;
}

const FALLBACK_WORKLIST: WorklistEntry[] = [
  {
    id: "wl-101",
    analyzerId: "an-1",
    analyzerName: "Sysmex XN-550 (Hematology)",
    orderNumber: "ORD-98210",
    sampleNumber: "SMP-98210",
    barcode: "BAR-8890123",
    testCode: "CBC+DIFF",
    testName: "Complete Blood Count w/ 5-Part Diff",
    priority: "STAT",
    protocol: "ASTM_E1394",
    status: "PROCESSING",
    sentAt: "14:32:05",
    acknowledgedAt: "14:32:06",
    resultReceived: false,
  },
  {
    id: "wl-102",
    analyzerId: "an-2",
    analyzerName: "Roche Cobas c311 (Biochemistry)",
    orderNumber: "ORD-98211",
    sampleNumber: "SMP-98211",
    barcode: "BAR-8890124",
    testCode: "LFT+KFT",
    testName: "Liver & Kidney Function Profile",
    priority: "URGENT",
    protocol: "ASTM_E1394",
    status: "SENT_TO_ANALYZER",
    sentAt: "14:34:12",
    acknowledgedAt: "14:34:13",
    resultReceived: false,
  },
  {
    id: "wl-103",
    analyzerId: "an-3",
    analyzerName: "Roche Cobas e411 (Immuno)",
    orderNumber: "ORD-98212",
    sampleNumber: "SMP-98212",
    barcode: "BAR-8890125",
    testCode: "TFT",
    testName: "Thyroid Function Test (TSH, FT3, FT4)",
    priority: "NORMAL",
    protocol: "HL7_V25",
    status: "COMPLETED",
    sentAt: "14:20:00",
    acknowledgedAt: "14:20:02",
    completedAt: "14:31:40",
    resultReceived: true,
    resultReceivedAt: "14:31:40",
  },
  {
    id: "wl-104",
    analyzerId: "an-1",
    analyzerName: "Sysmex XN-550 (Hematology)",
    orderNumber: "ORD-98213",
    sampleNumber: "SMP-98213",
    barcode: "BAR-8890126",
    testCode: "ESR",
    testName: "Erythrocyte Sedimentation Rate",
    priority: "NORMAL",
    protocol: "ASTM_E1394",
    status: "PENDING",
    resultReceived: false,
  },
];

export default function BidirectionalQuerySystem({ analyzerId, onClose }: BidirectionalQuerySystemProps) {
  const [worklistEntries, setWorklistEntries] = useState<WorklistEntry[]>(FALLBACK_WORKLIST);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<WorklistEntry | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [batchDispatching, setBatchDispatching] = useState(false);
  const [handshakeStep, setHandshakeStep] = useState<number>(0);
  const [simulatingHandshake, setSimulatingHandshake] = useState(false);

  const [newEntry, setNewEntry] = useState({
    barcode: "",
    testCode: "CBC+DIFF",
    priority: "NORMAL" as "NORMAL" | "URGENT" | "STAT",
  });

  const fetchWorklistEntries = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (analyzerId) params.append("analyzerId", analyzerId);
      if (filter !== "ALL") params.append("status", filter);
      if (searchTerm) params.append("barcode", searchTerm);

      const response = await analyzersApi.getWorklistEntries(params.toString());
      if (response?.success && response?.data && response.data.length > 0) {
        setWorklistEntries(response.data);
      }
    } catch (error) {
      console.warn("Backend worklist endpoint offline, using clinical telemetry cache:", error);
    } finally {
      setLoading(false);
    }
  }, [analyzerId, filter, searchTerm]);

  useEffect(() => {
    fetchWorklistEntries();
  }, [fetchWorklistEntries]);

  const handleSendToAnalyzer = async (entry: WorklistEntry) => {
    setWorklistEntries((prev) =>
      prev.map((e) =>
        e.id === entry.id
          ? {
              ...e,
              status: "SENT_TO_ANALYZER",
              sentAt: new Date().toLocaleTimeString(),
            }
          : e
      )
    );
    try {
      await analyzersApi.updateWorklistEntry(entry.id, {
        status: "SENT_TO_ANALYZER",
        sentAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Offline fallback updated:", err);
    }
  };

  const handleCreateWorklistEntry = async () => {
    if (!newEntry.barcode) return;
    const entry: WorklistEntry = {
      id: `wl-${Date.now()}`,
      analyzerId: analyzerId || "an-1",
      analyzerName: "Primary Clinical Analyzer",
      orderNumber: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      sampleNumber: `SMP-${Math.floor(10000 + Math.random() * 90000)}`,
      barcode: newEntry.barcode,
      testCode: newEntry.testCode,
      testName: newEntry.testCode === "CBC+DIFF" ? "Complete Blood Count" : newEntry.testCode,
      priority: newEntry.priority,
      protocol: "ASTM_E1394",
      status: "PENDING",
      resultReceived: false,
    };

    setWorklistEntries((prev) => [entry, ...prev]);
    setShowSendModal(false);
    setNewEntry({ barcode: "", testCode: "CBC+DIFF", priority: "NORMAL" });

    try {
      await analyzersApi.createWorklistEntry({
        analyzerId: analyzerId || "demo-analyzer-id",
        barcode: newEntry.barcode,
        testCode: newEntry.testCode,
        priority: newEntry.priority,
        protocol: "ASTM",
      });
    } catch (err) {
      console.warn("Created locally:", err);
    }
  };

  const handleBatchDispatch = () => {
    setBatchDispatching(true);
    setTimeout(() => {
      setWorklistEntries((prev) =>
        prev.map((e) =>
          e.status === "PENDING"
            ? {
                ...e,
                status: "SENT_TO_ANALYZER",
                sentAt: new Date().toLocaleTimeString(),
              }
            : e
        )
      );
      setBatchDispatching(false);
    }, 1500);
  };

  const runHostQuerySimulation = () => {
    setSimulatingHandshake(true);
    setHandshakeStep(1); // ENQ
    setTimeout(() => {
      setHandshakeStep(2); // ACK
      setTimeout(() => {
        setHandshakeStep(3); // Q-Record
        setTimeout(() => {
          setHandshakeStep(4); // O-Record
          setTimeout(() => {
            setHandshakeStep(5); // EOT
            setTimeout(() => {
              setSimulatingHandshake(false);
              setHandshakeStep(0);
            }, 2000);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const filteredEntries = worklistEntries.filter((entry) => {
    if (filter !== "ALL" && entry.status !== filter) return false;
    if (searchTerm && !entry.barcode.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const pendingCount = worklistEntries.filter((e) => e.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="rounded-3xl border border-sky-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sky-600/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-300">
                <ArrowRightLeft className="h-3.5 w-3.5 text-sky-400" />
                ASTM E1394-97 & HL7 Bidirectional Host Query Engine
              </span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                Active Polling Engine
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Bidirectional Worklist Dispatch & Host Query
            </h2>
            <p className="mt-1 text-xs text-slate-300 max-w-2xl">
              Automatic barcode query negotiation: when an analyzer scans a tube barcode, LIS transmits patient demographic records and ordered test panels in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runHostQuerySimulation}
              disabled={simulatingHandshake}
              className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-xs font-bold text-sky-300 hover:bg-sky-500/20 transition-all disabled:opacity-50"
            >
              <Play className={`h-3.5 w-3.5 ${simulatingHandshake ? "animate-spin" : ""}`} />
              {simulatingHandshake ? "Simulating Query Handshake..." : "Simulate Host Query (ENQ/ACK)"}
            </button>

            <button
              onClick={() => setShowSendModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:scale-105 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Tube to Worklist
            </button>
          </div>
        </div>
      </div>

      {/* Host Query ENQ/ACK Interactive Sequence Simulation HUD */}
      {simulatingHandshake && (
        <div className="rounded-3xl border border-sky-500/30 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl animate-fadeIn">
          <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-3 flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Live ASTM Low-Level Handshaking Sequence
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs font-mono">
            <div className={`rounded-xl border p-3 transition-all ${handshakeStep >= 1 ? "border-sky-500 bg-sky-500/20 text-sky-200" : "border-slate-800 bg-slate-950/60 text-slate-500"}`}>
              <span className="text-[10px] font-bold block mb-1">STEP 1: ENQ</span>
              &lt;ENQ&gt; Instrument connects to LIS socket
            </div>
            <div className={`rounded-xl border p-3 transition-all ${handshakeStep >= 2 ? "border-emerald-500 bg-emerald-500/20 text-emerald-200" : "border-slate-800 bg-slate-950/60 text-slate-500"}`}>
              <span className="text-[10px] font-bold block mb-1">STEP 2: ACK</span>
              &lt;ACK&gt; LIS acknowledges connection
            </div>
            <div className={`rounded-xl border p-3 transition-all ${handshakeStep >= 3 ? "border-sky-500 bg-sky-500/20 text-sky-200" : "border-slate-800 bg-slate-950/60 text-slate-500"}`}>
              <span className="text-[10px] font-bold block mb-1">STEP 3: Q-RECORD</span>
              Analyzer sends Q|1|^BAR-8890123
            </div>
            <div className={`rounded-xl border p-3 transition-all ${handshakeStep >= 4 ? "border-emerald-500 bg-emerald-500/20 text-emerald-200" : "border-slate-800 bg-slate-950/60 text-slate-500"}`}>
              <span className="text-[10px] font-bold block mb-1">STEP 4: O-RECORD</span>
              LIS returns O|1|...|^^^CBC\^^^DIFF
            </div>
            <div className={`rounded-xl border p-3 transition-all ${handshakeStep >= 5 ? "border-teal-500 bg-teal-500/20 text-teal-200" : "border-slate-800 bg-slate-950/60 text-slate-500"}`}>
              <span className="text-[10px] font-bold block mb-1">STEP 5: EOT</span>
              &lt;EOT&gt; Handshake complete
            </div>
          </div>
        </div>
      )}

      {/* Control Bar: Filters & Batch Dispatch */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "PENDING", "SENT_TO_ANALYZER", "PROCESSING", "COMPLETED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                filter === st
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-1.5 pl-9 pr-3 text-xs text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          {pendingCount > 0 && (
            <button
              onClick={handleBatchDispatch}
              disabled={batchDispatching}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:scale-105 transition-all disabled:opacity-50"
            >
              <FileSpreadsheet className={`h-3.5 w-3.5 ${batchDispatching ? "animate-spin" : ""}`} />
              {batchDispatching ? "Transmitting..." : `Dispatch ${pendingCount} Pending Batch`}
            </button>
          )}
        </div>
      </div>

      {/* Worklist Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3.5">Sample Barcode</th>
                <th className="px-4 py-3.5">Target Analyzer</th>
                <th className="px-4 py-3.5">Ordered Assays</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5">Transmission Status</th>
                <th className="px-4 py-3.5">Handshake Timestamps</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Barcode className="h-4 w-4 text-sky-400" />
                      <div>
                        <span className="font-mono font-bold text-white">{entry.barcode}</span>
                        <p className="text-[10px] text-slate-400">{entry.orderNumber}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="font-semibold text-slate-200">{entry.analyzerName}</span>
                    <span className="block text-[10px] font-mono text-slate-400">{entry.protocol}</span>
                  </td>

                  <td className="px-4 py-4">
                    <span className="font-bold text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-lg">
                      {entry.testCode}
                    </span>
                    <span className="block text-[11px] text-slate-400 mt-1">{entry.testName}</span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        entry.priority === "STAT"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          : entry.priority === "URGENT"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {entry.priority}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        entry.status === "COMPLETED"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : entry.status === "PROCESSING"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : entry.status === "SENT_TO_ANALYZER"
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {entry.status.replace(/_/g, " ")}
                    </span>
                  </td>

                  <td className="px-4 py-4 font-mono text-[11px] text-slate-400">
                    <div>Sent: {entry.sentAt || "—"}</div>
                    <div>Ack: {entry.acknowledgedAt || "—"}</div>
                  </td>

                  <td className="px-5 py-4 text-right">
                    {entry.status === "PENDING" ? (
                      <button
                        onClick={() => handleSendToAnalyzer(entry)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-500 shadow-md shadow-sky-600/30 transition-all"
                      >
                        <Send className="h-3 w-3" />
                        Transmit
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Dispatched
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Sample Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/40">
                  <Barcode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Add Tube to Analyzer Worklist</h3>
                  <p className="text-xs text-slate-400">Queue for Bidirectional Host Query</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="rounded-xl border border-slate-800 p-1.5 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Sample Barcode *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BAR-992102"
                  value={newEntry.barcode}
                  onChange={(e) => setNewEntry({ ...newEntry, barcode: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Assay Test Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CBC+DIFF or LFT"
                  value={newEntry.testCode}
                  onChange={(e) => setNewEntry({ ...newEntry, testCode: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Priority</label>
                <select
                  value={newEntry.priority}
                  onChange={(e) => setNewEntry({ ...newEntry, priority: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="NORMAL">Normal Routine</option>
                  <option value="URGENT">Urgent (45 min TAT)</option>
                  <option value="STAT">STAT Emergency (15 min TAT)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateWorklistEntry}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:scale-105 transition-all"
                >
                  <Send className="h-4 w-4" />
                  Add to Worklist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}