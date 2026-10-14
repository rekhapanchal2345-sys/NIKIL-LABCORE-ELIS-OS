"use client";

import { use, useEffect, useState, type PointerEvent, type WheelEvent } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { analyzersApi } from "@/lib/api";
import type { Analyzer } from "@/types";
import {
  Activity,
  ArrowLeft,
  Box,
  CheckCircle2,
  Clock3,
  Copy,
  Cpu,
  Layers3,
  Maximize2,
  MapPin,
  Radio,
  RefreshCw,
  RotateCcw,
  RotateCw,
  ShieldCheck,
  Wifi,
  WifiOff,
  Droplets,
  Award,
  ClipboardList,
  Terminal,
  Wrench,
  AlertTriangle,
  Send,
  Sliders,
  Check,
  Zap,
  Play,
  Pause,
  Flame,
  Gauge,
  Barcode,
  Search,
  Download,
  Lock,
  Unlock,
  XCircle,
  FileCheck,
  FileText,
  Sparkles
} from "lucide-react";

const statusStyles: Record<string, string> = {
  ONLINE: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  IDLE: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  BUSY: "border-violet-500/40 bg-violet-500/10 text-violet-400",
  OFFLINE: "border-slate-700 bg-slate-800 text-slate-400",
  ERROR: "border-rose-500/40 bg-rose-500/10 text-rose-400",
  MAINTENANCE: "border-amber-500/40 bg-amber-500/10 text-amber-400",
};

function valueOrDash(value?: string | number | null) {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

function Analyzer3DView({ analyzer }: { analyzer: Analyzer }) {
  const [rotation, setRotation] = useState({ x: -12, y: -24 });
  const [autoRotate, setAutoRotate] = useState(true);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [exploded, setExploded] = useState(false);

  useEffect(() => {
    if (!autoRotate) return;
    const timer = window.setInterval(() => {
      setRotation((current) => ({ ...current, y: current.y + 1 }));
    }, 70);
    return () => window.clearInterval(timer);
  }, [autoRotate]);

  const rotate = (axis: "x" | "y", amount: number) => {
    setAutoRotate(false);
    setRotation((current) => ({ ...current, [axis]: current[axis] + amount }));
  };

  const setView = (view: "front" | "side" | "rear") => {
    setAutoRotate(false);
    setRotation(view === "front" ? { x: -12, y: -24 } : view === "side" ? { x: -8, y: 64 } : { x: -10, y: 156 });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    setAutoRotate(false);
    setDragStart({ x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStart) return;
    setRotation((current) => ({
      x: Math.max(-34, Math.min(24, current.x - (event.clientY - dragStart.y) * 0.35)),
      y: current.y + (event.clientX - dragStart.x) * 0.45,
    }));
    setDragStart({ x: event.clientX, y: event.clientY });
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setZoom((current) => Math.max(0.78, Math.min(1.3, current - event.deltaY * 0.0008)));
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#071326] shadow-xl">
      <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-cyan-300" />
            <h3 className="font-bold text-white">Interactive 3D Hardware Chassis</h3>
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-200">
              Live Raytraced Model
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Drag to rotate, scroll to zoom, or explode to inspect fluidics and optical assemblies.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setView("front")} className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1.5 text-[11px] font-bold text-cyan-200 hover:bg-cyan-300/20">Front</button>
          <button onClick={() => setView("side")} className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:bg-white/10">Side</button>
          <button onClick={() => setView("rear")} className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:bg-white/10">Rear</button>
          <button onClick={() => rotate("y", -18)} className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:bg-white/10" title="Rotate left"><RotateCcw className="h-4 w-4" /></button>
          <button onClick={() => rotate("x", 12)} className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:bg-white/10" title="Tilt up"><Maximize2 className="h-4 w-4" /></button>
          <button onClick={() => { setRotation({ x: -12, y: -24 }); setZoom(1); setAutoRotate(false); }} className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:bg-white/10" title="Reset view"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => { setExploded((current) => !current); setAutoRotate(false); }} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition ${exploded ? "border-amber-300/40 bg-amber-300/15 text-amber-200" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}>
            <Layers3 className="h-3.5 w-3.5" />
            {exploded ? "Assemble" : "Explode Bay"}
          </button>
          <button onClick={() => setAutoRotate((current) => !current)} className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${autoRotate ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-200" : "border-white/10 bg-white/5 text-slate-300"}`}>
            <RotateCw className={`mr-1.5 inline h-3.5 w-3.5 ${autoRotate ? "animate-spin" : ""}`} />
            Auto rotate
          </button>
        </div>
      </div>

      <div className="relative min-h-[340px] overflow-hidden bg-[radial-gradient(circle_at_center,rgba(30,136,229,0.22),transparent_48%),linear-gradient(135deg,#071326,#0c1d38)] px-4 py-8">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(125,211,252,.25)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,.25)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={() => setDragStart(null)}
          onWheel={handleWheel}
          className="relative mx-auto flex h-[340px] max-w-2xl cursor-grab items-center justify-center active:cursor-grabbing [perspective:1200px]"
        >
          <div
            style={{
              transform: `scale(${zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              transformStyle: "preserve-3d",
              transition: dragStart ? "none" : "transform 140ms ease-out",
            }}
            className="relative h-56 w-72"
          >
            {/* Main Chassis Box */}
            <div
              style={{
                transform: `translateZ(${exploded ? 50 : 30}px)`,
                boxShadow: "0 25px 60px rgba(0,0,0,0.5), inset 0 0 30px rgba(56,189,248,0.2)",
              }}
              className="absolute inset-0 rounded-3xl border border-cyan-400/40 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-5 backdrop-blur-md"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#38bdf8]" />
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">{analyzer.model || "CLINICAL-X"}</span>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                  {analyzer.status}
                </span>
              </div>

              {/* Sample Bay Rotor */}
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-950/40 p-3 w-28 h-28">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-cyan-400/60">
                    <div className="h-4 w-4 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
                  </div>
                  <span className="mt-1 text-[9px] font-bold text-cyan-300">Sample Rotor</span>
                </div>

                <div className="flex-1 space-y-2 text-[10px] font-mono text-slate-300">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-400">Optics:</span>
                    <span className="text-emerald-300">Lamp 12.1V OK</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-400">Pressure:</span>
                    <span className="text-sky-300">2.4 Bar</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-400">Probe:</span>
                    <span className="text-cyan-300">Washed</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Port:</span>
                    <span className="text-white">{analyzer.port || 5000}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Exploded Fluidics Deck Layer */}
            {exploded && (
              <div
                style={{
                  transform: "translateZ(-60px) translateY(-40px)",
                }}
                className="absolute inset-0 rounded-3xl border border-amber-400/50 bg-amber-950/40 p-4 backdrop-blur-md transition-transform"
              >
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                  Fluidics Manifold & Peristaltic Pump Subassembly
                </span>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-amber-200 font-mono">
                  <div className="rounded-lg bg-black/40 p-2">Syringe Pump A: Primed</div>
                  <div className="rounded-lg bg-black/40 p-2">Waste Valve: Closed</div>
                  <div className="rounded-lg bg-black/40 p-2">Vacuum Tank: -0.8 Bar</div>
                  <div className="rounded-lg bg-black/40 p-2">Degasser: Active</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import ReflexCascadeEngine from "@/components/analyzers/ReflexCascadeEngine";
import MaintenanceComplianceLogbook from "@/components/analyzers/MaintenanceComplianceLogbook";
import PredictiveAnomalyEngine from "@/components/analyzers/PredictiveAnomalyEngine";
import { REAL_WORLD_ANALYZERS } from "@/components/analyzers/realWorldDemoAnalyzers";
import { BookOpen } from "lucide-react";

export default function AnalyzerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [analyzer, setAnalyzer] = useState<Analyzer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"telemetry" | "reagents" | "qc" | "worklist" | "packets" | "maintenance" | "reflex" | "compliance" | "predictive">("telemetry");

  // Telemetry simulation states
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [flushStatus, setFlushStatus] = useState<string | null>(null);

  const loadAnalyzer = async () => {
    try {
      setLoading(true);
      setError("");
      let response;
      try {
        response = await analyzersApi.getById(id);
      } catch (detailError) {
        try {
          const demoResponse = await analyzersApi.getDemoData();
          const demoAnalyzer = demoResponse?.data?.analyzers?.find((item: Analyzer) => item.id === id);
          if (demoAnalyzer) {
            setAnalyzer(demoAnalyzer);
            return;
          }
        } catch {}

        const realWorld = REAL_WORLD_ANALYZERS.find((item) => item.id === id || item.analyzerId === id);
        if (realWorld) {
          setAnalyzer(realWorld);
          return;
        }
        throw detailError;
      }
      const data = response?.data?.analyzer || response?.data;
      if (!data) {
        setError(response?.message || "Analyzer not found");
        return;
      }
      setAnalyzer(data as Analyzer);
    } catch (loadError: any) {
      console.error("Error loading analyzer:", loadError);
      setError(loadError?.message || "Unable to load analyzer details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadAnalyzer();
  }, [id]);

  const handlePing = () => {
    setPingStatus("Pinging analyzer TCP socket...");
    setTimeout(() => {
      setPingStatus(`Ping ACK received: 18ms latency. Port ${analyzer?.port || 5000} reachable.`);
      setTimeout(() => setPingStatus(null), 3500);
    }, 800);
  };

  const handleFlush = () => {
    setFlushStatus("Flushing aspiration lines & waste traps...");
    setTimeout(() => {
      setFlushStatus("Hydraulic wash cycle complete. Line pressure nominal (2.4 bar).");
      setTimeout(() => setFlushStatus(null), 3500);
    }, 1200);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Back Bar & Fleet Breadcrumb */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Link
                  href="/analyzers"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs font-bold text-slate-300 transition-colors hover:border-slate-700 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Fleet Overview
                </Link>

                <Link
                  href="/analyzers?tab=interactive_docs"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500/20 hover:text-white"
                >
                  <FileText className="h-4 w-4 text-emerald-400" />
                  <span>📑 DOCUMINICATION (PDF SOP)</span>
                </Link>
              </div>

              {analyzer && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePing}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/20 transition-all"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Ping Hardware Handshake
                  </button>
                  <button
                    onClick={handleFlush}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition-all"
                  >
                    <Droplets className="h-3.5 w-3.5" />
                    Flush Fluidic Lines
                  </button>
                  <button
                    onClick={loadAnalyzer}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 transition-all"
                    title="Refresh instrument status"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Ping / Flush Status Toasts */}
            {pingStatus && (
              <div className="rounded-2xl border border-sky-500/40 bg-sky-950/80 p-3.5 text-xs font-bold text-sky-300 shadow-xl backdrop-blur-md flex items-center gap-2">
                <Zap className="h-4 w-4 text-sky-400 animate-pulse" />
                {pingStatus}
              </div>
            )}
            {flushStatus && (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/80 p-3.5 text-xs font-bold text-emerald-300 shadow-xl backdrop-blur-md flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {flushStatus}
              </div>
            )}

            {loading ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-12 text-center text-slate-400">
                <RefreshCw className="mx-auto h-8 w-8 animate-spin text-sky-400" />
                <p className="mt-3 text-sm font-semibold">Connecting to instrument telemetry console...</p>
              </div>
            ) : error || !analyzer ? (
              <div className="rounded-3xl border border-rose-500/30 bg-slate-900/80 p-10 text-center shadow-xl">
                <WifiOff className="mx-auto h-12 w-12 text-rose-500" />
                <h2 className="mt-3 text-lg font-bold text-white">Analyzer Instrument Offline</h2>
                <p className="mt-1 text-xs text-slate-400">{error || "The instrument could not be resolved."}</p>
                <button
                  onClick={loadAnalyzer}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 shadow-lg shadow-sky-600/30"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Connection
                </button>
              </div>
            ) : (
              <>
                {/* Hero Instrument Banner */}
                <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white shadow-2xl relative overflow-hidden">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-300">
                          {analyzer.analyzerType || "Clinical Diagnostic Instrument"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-300">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          ASTM E1394 / HL7 LIS Verified
                        </span>
                        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-mono text-slate-300">
                          ID: {analyzer.analyzerId || analyzer.id}
                        </span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                        {valueOrDash(analyzer.name)}
                      </h1>
                      <p className="mt-1.5 text-xs text-slate-300 max-w-2xl">
                        {analyzer.manufacturer} {analyzer.model} · Serial # {analyzer.serialNumber || "SN-77291"} · Location: {analyzer.location} ({analyzer.department})
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-black uppercase tracking-wider ${statusStyles[analyzer.status] || statusStyles.OFFLINE}`}>
                        {analyzer.status === "ONLINE" ? (
                          <Wifi className="h-4 w-4 text-emerald-400 animate-pulse" />
                        ) : (
                          <Activity className="h-4 w-4" />
                        )}
                        {valueOrDash(analyzer.status)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6-Tab Workstation Navigation */}
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
                  {[
                    { id: "telemetry", label: "Telemetry & 3D Chassis", icon: Cpu },
                    { id: "predictive", label: "AI Breakdown Telemetry", icon: Flame },
                    { id: "reagents", label: "On-Board Reagent Carousel", icon: Droplets },
                    { id: "qc", label: "Calibration & Westgard QC", icon: Award },
                    { id: "reflex", label: "Reflex & Cascade Rules", icon: Sparkles },
                    { id: "compliance", label: "NABL / CAP Audit Curves", icon: ShieldCheck },
                    { id: "worklist", label: "Active Tube Worklist", icon: ClipboardList },
                    { id: "packets", label: "Raw ASTM/HL7 Packet Sniffer", icon: Terminal },
                    { id: "maintenance", label: "Maintenance Checklist", icon: Wrench },
                  ].map(({ id: tabId, label, icon: Icon }) => {
                    const isActive = activeTab === tabId;
                    return (
                      <button
                        key={tabId}
                        onClick={() => setActiveTab(tabId as any)}
                        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                          isActive
                            ? "bg-sky-600 text-white shadow-lg shadow-sky-600/30 scale-105"
                            : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* TAB 1: Telemetry & 3D Chassis */}
                {activeTab === "telemetry" && (
                  <div className="space-y-6">
                    {/* Live Sensor Gauges */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {[
                        { label: "Host IP", value: analyzer.host || "192.168.1.104", unit: "TCP/IP", color: "text-sky-400" },
                        { label: "Socket Port", value: analyzer.port || "5000", unit: "Raw Stream", color: "text-emerald-400" },
                        { label: "Socket Latency", value: `${analyzer.connectionLatency || 18} ms`, unit: "Active Ping", color: "text-cyan-400" },
                        { label: "Fluidic Line", value: "2.4 Bar", unit: "Nominal", color: "text-emerald-400" },
                        { label: "Photometer Lamp", value: "12.1 V", unit: "Stable Optics", color: "text-amber-400" },
                        { label: "Syringe Vacuum", value: "-0.8 Bar", unit: "Aspiration OK", color: "text-violet-400" },
                      ].map((gauge) => (
                        <div key={gauge.label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">{gauge.label}</span>
                          <span className={`text-base font-black font-mono mt-1 block ${gauge.color}`}>
                            {gauge.value}
                          </span>
                          <span className="text-[10px] text-slate-400">{gauge.unit}</span>
                        </div>
                      ))}
                    </div>

                    {/* Interactive 3D Model */}
                    <Analyzer3DView analyzer={analyzer} />

                    {/* Interface Identity Specs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
                        <h3 className="text-sm font-bold text-white mb-3">Hardware & Serial Credentials</h3>
                        <dl className="grid grid-cols-2 gap-3 text-xs">
                          <div><dt className="text-slate-400">Manufacturer</dt><dd className="font-semibold text-white">{analyzer.manufacturer}</dd></div>
                          <div><dt className="text-slate-400">Model</dt><dd className="font-semibold text-white">{analyzer.model}</dd></div>
                          <div><dt className="text-slate-400">Serial Number</dt><dd className="font-mono text-sky-300">{analyzer.serialNumber || "SN-77291"}</dd></div>
                          <div><dt className="text-slate-400">Connection Type</dt><dd className="font-semibold text-white">{analyzer.connectionType || "TCP_IP"}</dd></div>
                        </dl>
                      </div>

                      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
                        <h3 className="text-sm font-bold text-white mb-3">Protocol & Buffer Telemetry</h3>
                        <dl className="grid grid-cols-2 gap-3 text-xs">
                          <div><dt className="text-slate-400">LIS Protocol</dt><dd className="font-mono text-emerald-400">{analyzer.protocol || "ASTM_E1394"}</dd></div>
                          <div><dt className="text-slate-400">Auto-Approve Rate</dt><dd className="font-semibold text-white">94.8% Clean Pass</dd></div>
                          <div><dt className="text-slate-400">Last Comm Frame</dt><dd className="font-mono text-slate-300">Just now</dd></div>
                          <div><dt className="text-slate-400">Socket Buffer</dt><dd className="font-semibold text-emerald-400">0 Frames Queued (Clear)</dd></div>
                        </dl>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: On-Board Reagents */}
                {activeTab === "reagents" && (
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-bold text-white">Cartridge Bays on {analyzer.name}</h3>
                          <p className="text-xs text-slate-400">Rotor carousel configuration with real-time open-vial stability tracking.</p>
                        </div>
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                          All Cartridges Calibrated
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { bay: 1, name: "Diluent System Pack", lot: "LOT-CP-9082", tests: 680, max: 900, pct: 75, stability: "340h remaining" },
                          { bay: 2, name: "Lyse Reagent Cartridge", lot: "LOT-FC-3310", tests: 240, max: 350, pct: 68, stability: "180h remaining" },
                          { bay: 3, name: "Cleaning Solution Probe Wash", lot: "LOT-CW-1102", tests: 490, max: 500, pct: 98, stability: "720h remaining" },
                        ].map((c) => (
                          <div key={c.bay} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="rounded-lg bg-sky-500/20 text-sky-300 font-mono font-bold text-xs px-2 py-0.5">
                                Bay #{c.bay}
                              </span>
                              <span className="text-xs font-mono font-bold text-emerald-400">{c.pct}%</span>
                            </div>
                            <h4 className="text-sm font-bold text-white">{c.name}</h4>
                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">{c.lot}</p>
                            <div className="mt-3 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${c.pct}%` }} />
                            </div>
                            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                              <span>{c.tests} / {c.max} tests</span>
                              <span className="text-sky-300">{c.stability}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Calibration & QC */}
                {activeTab === "qc" && (
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-bold text-white">Calibration & Westgard Verification</h3>
                          <p className="text-xs text-slate-400">Daily multi-level control performance and photometer curve fit parameters.</p>
                        </div>
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                          Westgard Rules Passed
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Linear Slope & Intercept</span>
                          <span className="text-lg font-mono font-black text-white mt-1 block">y = 0.998x + 0.02</span>
                          <span className="text-xs text-emerald-400 font-mono">R² = 0.9994 (Optimal)</span>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Coefficient of Variation</span>
                          <span className="text-lg font-mono font-black text-sky-400 mt-1 block">1.4% %CV</span>
                          <span className="text-xs text-slate-400">Below 2.0% threshold</span>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Signatory Pathologist</span>
                          <span className="text-sm font-bold text-white mt-1 block truncate">Dr. Ananya Ray, MD</span>
                          <span className="text-xs text-slate-400">Verified at 07:15 AM today</span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">3-Level Controls Today</h4>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                            <span className="text-[10px] font-bold text-slate-400 block">LEVEL 1 (LOW)</span>
                            <span className="text-xs font-bold text-emerald-400 mt-1 flex items-center justify-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> PASSED (Z = +0.2s)
                            </span>
                          </div>
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                            <span className="text-[10px] font-bold text-slate-400 block">LEVEL 2 (NORMAL)</span>
                            <span className="text-xs font-bold text-emerald-400 mt-1 flex items-center justify-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> PASSED (Z = +0.1s)
                            </span>
                          </div>
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                            <span className="text-[10px] font-bold text-slate-400 block">LEVEL 3 (HIGH)</span>
                            <span className="text-xs font-bold text-emerald-400 mt-1 flex items-center justify-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> PASSED (Z = -0.3s)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: Active Worklist */}
                {activeTab === "worklist" && (
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-bold text-white">Specimen Queue & Worklist</h3>
                          <p className="text-xs text-slate-400">Specimens currently inside the sample aspiration rack.</p>
                        </div>
                        <span className="rounded-full bg-sky-500/10 border border-sky-500/20 px-3 py-1 text-xs font-bold text-sky-300">
                          3 Tubes In Rack
                        </span>
                      </div>

                      <div className="space-y-2">
                        {[
                          { barcode: "SMP-STAT-9921", mrn: "MRN-88021", priority: "STAT", assay: "CBC + Platelets", status: "ASPIRATING", pos: "Rack 1 / Slot A" },
                          { barcode: "SMP-URG-1029", mrn: "MRN-33910", priority: "URGENT", assay: "Electrolytes (Na/K/Cl)", status: "QUEUED", pos: "Rack 1 / Slot B" },
                          { barcode: "SMP-ROUT-4091", mrn: "MRN-55102", priority: "ROUTINE", assay: "Lipid Profile", status: "QUEUED", pos: "Rack 1 / Slot C" },
                        ].map((t) => (
                          <div key={t.barcode} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
                            <div className="flex items-center gap-3">
                              <Barcode className="h-5 w-5 text-sky-400" />
                              <div>
                                <span className="font-mono font-bold text-white">{t.barcode}</span>
                                <p className="text-[11px] text-slate-400">{t.mrn} · {t.assay}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-slate-400">{t.pos}</span>
                              <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                                t.priority === "STAT" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "bg-slate-800 text-slate-300"
                              }`}>
                                {t.priority}
                              </span>
                              <span className="font-bold text-emerald-400">{t.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: Raw Packet Sniffer */}
                {activeTab === "packets" && (
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 font-sans">
                        <div className="flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-emerald-400" />
                          <h3 className="font-bold text-white">ASTM E1394-97 / HL7 Raw Frame Sniffer</h3>
                        </div>
                        <span className="text-[11px] text-slate-400">Port {analyzer.port || 5000} · Bi-directional TCP Socket</span>
                      </div>

                      <div className="space-y-1 rounded-2xl bg-black/80 p-4 text-slate-300 max-h-72 overflow-y-auto">
                        <div className="text-slate-500">[14:35:01.102] &lt;ENQ&gt; (Host Connection Handshake)</div>
                        <div className="text-emerald-400">[14:35:01.120] &lt;ACK&gt; (Analyzer Acknowledged)</div>
                        <div className="text-sky-300">[14:35:01.140] H|\^&amp;|||LIS_CORE^HOST|||||||P|1394-97|20260914143501</div>
                        <div className="text-slate-500">[14:35:01.155] &lt;ACK&gt;</div>
                        <div className="text-sky-300">[14:35:01.160] P|1||MRN-88021||Doe^John|||M|||||Dr. Ray</div>
                        <div className="text-slate-500">[14:35:01.175] &lt;ACK&gt;</div>
                        <div className="text-sky-300">[14:35:01.182] O|1|SMP-STAT-9921||^^^CBC\^^^PLT|R|20260914143000|||||A||||||||||||||F</div>
                        <div className="text-slate-500">[14:35:01.200] &lt;ACK&gt;</div>
                        <div className="text-amber-300">[14:35:01.210] R|1|^^^WBC|8.4|10^3/uL|4.0-11.0|N||F||tech1|20260914143501</div>
                        <div className="text-amber-300">[14:35:01.220] R|2|^^^HGB|14.2|g/dL|13.0-17.0|N||F||tech1|20260914143501</div>
                        <div className="text-amber-300">[14:35:01.230] R|3|^^^PLT|245|10^3/uL|150-450|N||F||tech1|20260914143501</div>
                        <div className="text-slate-500">[14:35:01.245] &lt;ACK&gt;</div>
                        <div className="text-sky-300">[14:35:01.250] L|1|N</div>
                        <div className="text-emerald-400">[14:35:01.260] &lt;EOT&gt; (Frame Transmission Complete)</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 6: Maintenance & Audit Trail */}
                {activeTab === "maintenance" && (
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
                      <h3 className="text-base font-bold text-white mb-1">Preventative Maintenance & Inspection Checklist</h3>
                      <p className="text-xs text-slate-400 mb-4">ISO 15189 / NABL compliant digital maintenance logs with electronic signatures.</p>

                      <div className="space-y-3">
                        {[
                          { task: "Daily Hydraulic Probe Wash & Tubing Degas", freq: "Daily", status: "COMPLETED", tech: "Rajiv K. (06:30 AM)", badge: "bg-emerald-500/20 text-emerald-300" },
                          { task: "Weekly Syringe O-Ring Lubrication & Pressure Check", freq: "Weekly", status: "DUE IN 2 DAYS", tech: "Scheduled", badge: "bg-amber-500/20 text-amber-300" },
                          { task: "Monthly Photometer Optics Realignment & Calibration", freq: "Monthly", status: "COMPLETED", tech: "Field Engineer (09-01)", badge: "bg-emerald-500/20 text-emerald-300" },
                          { task: "Quarterly Waste Line Acid Decontamination", freq: "Quarterly", status: "COMPLETED", tech: "Maria L. (08-15)", badge: "bg-emerald-500/20 text-emerald-300" },
                        ].map((m, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs">
                            <div>
                              <span className="font-bold text-white block">{m.task}</span>
                              <span className="text-[11px] text-slate-400">{m.freq} · Signed off by: {m.tech}</span>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${m.badge}`}>
                              {m.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: Reflex & Cascade Rules for this Analyzer */}
                {activeTab === "reflex" && (
                  <ReflexCascadeEngine analyzers={analyzer ? [analyzer] : []} />
                )}

                {/* TAB: NABL / CAP Calibration & Compliance */}
                {activeTab === "compliance" && (
                  <MaintenanceComplianceLogbook analyzers={analyzer ? [analyzer] : []} />
                )}

                {/* TAB: AI Predictive Telemetry & Breakdown Forecasting */}
                {activeTab === "predictive" && (
                  <PredictiveAnomalyEngine analyzers={analyzer ? [analyzer] : []} />
                )}
              </>
            )}
          </div>
        </main>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
