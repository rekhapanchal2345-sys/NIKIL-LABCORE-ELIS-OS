"use client";

import React from "react";
import {
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  Radio,
  Cpu,
  Layers,
  Sparkles,
  QrCode,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  GitBranch,
  Split,
  TestTube
} from "lucide-react";

interface OrdersIntegrationWidgetProps {
  onOpenEngine?: () => void;
  ordersToday?: number;
}

export default function OrdersIntegrationWidget({
  onOpenEngine,
  ordersToday = 840,
}: OrdersIntegrationWidgetProps) {
  const quickFeeds = [
    { name: "Central HIS Wards (HL7 ORM)", port: "2575", status: "ONLINE", protocol: "HL7 v2.5", count: "218 Orders" },
    { name: "Consultant OPD Desk", port: "443", status: "BUSY", protocol: "REST EMR", count: "412 Orders" },
    { name: "ABDM / ABHA Digital Prescriptions", port: "443", status: "ONLINE", protocol: "FHIR R4", count: "84 Orders" },
    { name: "Analyzer Worklists (Cobas & Sysmex)", port: "5000", status: "ONLINE", protocol: "ASTM E1394", count: "380 Pushed" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 relative overflow-hidden transition-all duration-300 hover:border-sky-300">
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-sky-50 via-indigo-50/40 to-transparent rounded-full pointer-events-none -mr-12 -mt-12 blur-2xl" />

      <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                  Hospital & Lab Orders Integration Engine
                </h3>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  LIVE REQUISITION BUS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatic HL7 ORM Ingest, Tube Allocator & Analyzer Worklists
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenEngine}
            className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 hover:underline"
          >
            <span>Launch Engine</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Telemetry Strip */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Feeds</p>
            <p className="text-sm font-black text-emerald-600 mt-0.5">6 Feeds</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Inbound Today</p>
            <p className="text-sm font-black text-sky-700 mt-0.5">{ordersToday}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Reflex Rules</p>
            <p className="text-sm font-black text-purple-700 mt-0.5">4 Active</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Exceptions</p>
            <p className="text-sm font-black text-emerald-600 mt-0.5">0 Held</p>
          </div>
        </div>

        {/* Live Channel Quick List */}
        <div className="space-y-1.5">
          {quickFeeds.map((qc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors text-xs border border-slate-100"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    qc.status === "BUSY"
                      ? "bg-sky-500 animate-spin"
                      : "bg-emerald-500 animate-pulse"
                  }`}
                />
                <span className="font-bold text-slate-800">{qc.name}</span>
                <span className="text-[10px] font-mono text-slate-400">:{qc.port}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                  {qc.protocol}
                </span>
                <span className="font-mono text-[11px] font-bold text-sky-700">{qc.count}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Action Footer */}
        <div className="pt-2 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>NABL ISO 15189 Specimen Custody & ABDM M1-M3 Certified</span>
          </div>

          <button
            type="button"
            onClick={onOpenEngine}
            className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs transition-all shadow-2xs flex items-center gap-1.5"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Open Orders Integration Engine &rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
