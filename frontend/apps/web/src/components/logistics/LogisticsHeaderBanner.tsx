'use client';

import React from 'react';
import LabCoreLogo from '@/components/common/LabCoreLogo';
import {
  Truck,
  ShieldCheck,
  Building2,
  Zap,
  Printer,
  QrCode,
  ThermometerSnowflake,
  PlusCircle,
  Clock,
  Radio,
  CheckCircle2,
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

export default function LogisticsHeaderBanner({
  activeCenter,
  onCenterChange,
  onOpenDispatch,
  onOpenPrintManifest,
  onOpenDockScanner,
  onSimulateExcursion,
  activeStatCount,
}: LogisticsHeaderBannerProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 md:p-6 mb-6">
      {/* Top Level: Brand Identity + Hospital Center Selector + Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-sky-100/70 border border-blue-200/60 text-blue-700 shadow-xs shrink-0">
            <Truck className="w-8 h-8 text-blue-600" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
                Live Fleet Command 24x7
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                NABL ISO 15189:2022
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                CAP LAP Compliant
              </span>
              {activeStatCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-red-50 text-red-700 border border-red-200 animate-pulse">
                  <Zap className="w-3 h-3 text-red-600 fill-red-600" />
                  {activeStatCount} STAT IN TRANSIT
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              Specimen Logistics &amp; Cold-Chain Fleet
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              In-Hospital Ward STAT Triage · B2B Hub &amp; Spoke Consignments · Home Phlebotomy · 2°C–8°C IoT Telemetry
            </p>
          </div>
        </div>

        {/* Action Controls & Facility Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
            <Building2 className="w-4 h-4 text-slate-500" />
            <select
              value={activeCenter}
              onChange={(e) => onCenterChange(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Hubs &amp; Facilities (Network View)</option>
              <option value="CENTRAL_LAB">Central Processing Reference Lab (Ahmedabad)</option>
              <option value="ICU_HOSPITAL">Tertiary Care Hospital &amp; ICU Core Wing</option>
              <option value="MANINAGAR_SPOKE">Maninagar Collection Spoke (Hub #04)</option>
              <option value="GANDHINAGAR_SPOKE">Gandhinagar Diagnostic Spoke (Hub #08)</option>
              <option value="SATELLITE_HOME">Satellite Zone Home Phlebotomy Base</option>
            </select>
          </div>

          <button
            onClick={onOpenDispatch}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Dispatch Trip
          </button>

          <button
            onClick={onOpenDockScanner}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold shadow-xs hover:bg-slate-50 hover:border-slate-400 active:scale-95 transition-all"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            Dock Scan In
          </button>

          <button
            onClick={onOpenPrintManifest}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold shadow-xs hover:bg-slate-50 hover:border-slate-400 active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Print Manifest
          </button>
        </div>
      </div>

      {/* Real-time Logistics Banner / Telemetry Notice */}
      <div className="mt-4 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs bg-slate-50/80 rounded-xl p-3 border border-slate-200/70">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-semibold text-slate-700">Digital Chain of Custody:</span>
          <span className="text-slate-600">
            GPS Fleet Pings Active · All biological specimens tracked under CLSI H04-A6 Order of Draw &amp; NABL Specimen Rejection Guidelines.
          </span>
        </div>

        <div className="flex items-center gap-3 ml-auto shrink-0">
          <button
            onClick={onSimulateExcursion}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors"
          >
            <ThermometerSnowflake className="w-3.5 h-3.5 text-amber-600" />
            Simulate Cold-Chain Test
          </button>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Avg Specimen In-Transit TAT: <strong className="text-slate-800 font-bold">18.4 mins</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
