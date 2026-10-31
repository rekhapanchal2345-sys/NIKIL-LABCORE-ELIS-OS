'use client';

// ============================================================
// LABCORE ELIS — Logistics Header Banner (Enterprise Command Bar)
// Real-time fleet telemetry command center header
// ISO 15189:2022 | CAP | NABL | CLSI H04-A6
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Truck, ShieldCheck, Building2, Zap, Printer, QrCode,
  ThermometerSnowflake, PlusCircle, Clock, Radio, CheckCircle2,
  Activity, AlertTriangle, BarChart3, Navigation, Package,
  TrendingDown, Gauge, Signal, Target, Map,
} from 'lucide-react';

interface LogisticsHeaderBannerProps {
  activeCenter: string;
  onCenterChange: (center: string) => void;
  onOpenDispatch: () => void;
  onOpenPrintManifest: () => void;
  onOpenDockScanner: () => void;
  onSimulateExcursion: () => void;
  activeStatCount: number;
}

// Live KPI pulse hook — simulates real-time telemetry ticks
function useLiveTelemetry() {
  const [tat, setTat] = useState(18.4);
  const [compliance, setCompliance] = useState(99.4);
  const [activeTrips, setActiveTrips] = useState(6);
  const [lastPing, setLastPing] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTat(prev => parseFloat((prev + (Math.random() - 0.5) * 0.4).toFixed(1)));
      setCompliance(prev => parseFloat(Math.min(100, Math.max(97, prev + (Math.random() - 0.5) * 0.2)).toFixed(1)));
      setLastPing(new Date());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return { tat, compliance, activeTrips, lastPing };
}

export default function LogisticsHeaderBanner({
  activeCenter,
  onCenterChange,
  onOpenDispatch,
  onOpenPrintManifest,
  onOpenDockScanner,
  onSimulateExcursion,
  activeStatCount,
}: LogisticsHeaderBannerProps) {
  const { tat, compliance, activeTrips, lastPing } = useLiveTelemetry();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">

      {/* ── TOP TIER: Compliance Badges + Live Clock ─────────── */}
      <div className="bg-slate-50 border-b border-slate-100 px-5 py-2 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3 h-3" />
          NABL ISO 15189:2022
        </span>
        <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
          CAP LAP Compliant
        </span>
        <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
          IATA P650
        </span>
        <span className="inline-flex items-center gap-1 font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">
          CLSI H04-A6
        </span>
        {activeStatCount > 0 && (
          <span className="inline-flex items-center gap-1 font-extrabold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-300 animate-pulse ml-1">
            <Zap className="w-3 h-3 fill-red-600 text-red-600" />
            {activeStatCount} STAT IN TRANSIT
          </span>
        )}
        <span className="ml-auto font-mono text-slate-400 flex items-center gap-1 hidden sm:flex">
          <Clock className="w-3 h-3" />
          {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {/* ── MAIN HEADER: Title + Facility Selector + Actions ─── */}
      <div className="px-5 py-4 md:py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100">
        {/* Identity */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-sky-100/70 border border-blue-200/60 text-blue-700 shadow-xs shrink-0">
            <Truck className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
                Live Fleet Command 24×7
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Specimen Logistics &amp; Cold-Chain Fleet
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              In-Hospital Ward STAT Triage · Hub &amp; Spoke B2B · Home Phlebotomy · 2°C–8°C IoT Telemetry · Cryogenic Air Consignment
            </p>
          </div>
        </div>

        {/* Action Controls & Facility Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Facility Selector */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
            <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={activeCenter}
              onChange={e => onCenterChange(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[200px]"
            >
              <option value="ALL">All Hubs &amp; Facilities (Network View)</option>
              <option value="CENTRAL_LAB">Central Processing Reference Lab (Ahmedabad)</option>
              <option value="ICU_HOSPITAL">Tertiary Care Hospital &amp; ICU Core Wing</option>
              <option value="NICU">NICU — Neonatal Critical Care Unit</option>
              <option value="MANINAGAR_SPOKE">Maninagar Collection Spoke (Hub #04)</option>
              <option value="GANDHINAGAR_SPOKE">Gandhinagar Diagnostic Spoke (Hub #08)</option>
              <option value="SATELLITE_HOME">Satellite Zone Home Phlebotomy Base</option>
              <option value="GENOMICS_REFERRAL">Apex Genomics Lab (NGS Referral — Navi Mumbai)</option>
            </select>
          </div>

          {/* Dispatch Trip */}
          <button
            onClick={onOpenDispatch}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Dispatch Trip
          </button>

          {/* Dock Scan */}
          <button
            onClick={onOpenDockScanner}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold shadow-xs hover:bg-slate-50 hover:border-slate-400 active:scale-95 transition-all"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            Dock Scan In
          </button>

          {/* Print Manifest */}
          <button
            onClick={onOpenPrintManifest}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold shadow-xs hover:bg-slate-50 hover:border-slate-400 active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Print Manifest
          </button>
        </div>
      </div>

      {/* ── LIVE TELEMETRY KPI STRIP ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y divide-slate-100">
        {[
          {
            icon: <Activity className="w-4 h-4 text-blue-600" />,
            label: 'Active Trips',
            value: `${activeTrips}`,
            sub: 'In transit now',
            color: 'text-blue-700',
            bg: 'bg-blue-50/30',
          },
          {
            icon: <Clock className="w-4 h-4 text-amber-600" />,
            label: 'Avg In-Transit TAT',
            value: `${tat}`,
            sub: 'mins (target ≤20)',
            color: tat <= 20 ? 'text-emerald-700' : 'text-red-700',
            bg: 'bg-amber-50/30',
          },
          {
            icon: <ThermometerSnowflake className="w-4 h-4 text-cyan-600" />,
            label: 'Cold-Chain Compliance',
            value: `${compliance}%`,
            sub: 'Thermal integrity',
            color: compliance >= 99 ? 'text-emerald-700' : 'text-amber-700',
            bg: 'bg-cyan-50/30',
          },
          {
            icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
            label: 'Digital CoC',
            value: '100%',
            sub: 'Chain of custody OK',
            color: 'text-emerald-700',
            bg: 'bg-emerald-50/30',
          },
          {
            icon: <BarChart3 className="w-4 h-4 text-violet-600" />,
            label: 'Trips Today',
            value: '47',
            sub: '41 delivered, 6 active',
            color: 'text-violet-700',
            bg: 'bg-violet-50/30',
          },
          {
            icon: <Target className="w-4 h-4 text-rose-600" />,
            label: 'TAT Breaches',
            value: '0',
            sub: 'No SLA violations',
            color: 'text-emerald-700',
            bg: 'bg-rose-50/20',
          },
        ].map((kpi, i) => (
          <div key={i} className={`flex items-center gap-2.5 px-3.5 py-3 ${kpi.bg}`}>
            <div className="shrink-0 p-1.5 bg-white rounded-lg border border-white/80 shadow-2xs">
              {kpi.icon}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">{kpi.label}</span>
              <span className={`text-sm font-extrabold font-mono ${kpi.color}`}>{kpi.value}</span>
              <span className="text-[10px] text-slate-400 block truncate">{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── DIGITAL CHAIN OF CUSTODY TELEMETRY NOTICE ─────── */}
      <div className="px-5 py-3 bg-slate-50/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="h-2 w-2 rounded-full bg-emerald-500 absolute" />
          </div>
          <span className="font-semibold text-slate-700">Digital Chain of Custody Active:</span>
          <span className="text-slate-600">
            GPS fleet pings active · All biological specimens tracked under CLSI H04-A6 Order of Draw &amp; NABL Specimen Rejection Guidelines ·
            Continuous IoT thermal logging via Bluetooth BLE dataloggers
          </span>
        </div>

        <div className="flex items-center gap-3 ml-auto shrink-0">
          <button
            onClick={onSimulateExcursion}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors"
          >
            <ThermometerSnowflake className="w-3.5 h-3.5 text-amber-600" />
            Test Cold-Chain Excursion
          </button>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Avg TAT: <strong className="text-slate-800 font-bold ml-1">{tat} mins</strong>
          </div>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <div className="font-mono text-slate-400 hidden md:flex items-center gap-1">
            <Signal className="w-3 h-3" />
            Last ping: {lastPing.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
}
