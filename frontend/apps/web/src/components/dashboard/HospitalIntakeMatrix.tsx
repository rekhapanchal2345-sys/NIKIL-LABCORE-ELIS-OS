"use client";

import { useState } from "react";
import { 
  Building2, 
  Bed, 
  Flame, 
  Truck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Filter,
  Thermometer,
  ShieldCheck,
  UserCheck,
  Plus
} from "lucide-react";

interface IntakeStats {
  opdCount?: number;
  ipdCount?: number;
  statCount?: number;
  b2bCount?: number;
  total?: number;
}

interface HospitalIntakeMatrixProps {
  stats?: IntakeStats;
  loading?: boolean;
}

export default function HospitalIntakeMatrix({ stats, loading = false }: HospitalIntakeMatrixProps) {
  const [selectedChannel, setSelectedChannel] = useState<"ALL" | "OPD" | "IPD" | "STAT" | "B2B">("ALL");

  const channels = [
    {
      id: "OPD",
      title: "OPD Walk-in Clinic",
      subtitle: "Outpatient Consulting & Phlebotomy",
      count: stats?.opdCount ?? 64,
      pendingCollection: 5,
      avgWaitMins: "6.2 mins",
      badge: "Lobby Kiosk Active",
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
      icon: Building2,
      accentColor: "text-sky-600",
      accentBg: "bg-sky-50 border-sky-200",
      gradient: "from-sky-500 to-blue-600",
      actionText: "Open OPD Queue",
      actionHref: "/orders?channel=OPD",
      keyMetrics: [
        { label: "Token Wait", value: "3.8m" },
        { label: "ABHA Linked", value: "88%" },
      ]
    },
    {
      id: "IPD",
      title: "IPD Wards & ICUs",
      subtitle: "Bedside Phlebotomy & Critical Care",
      count: stats?.ipdCount ?? 38,
      pendingCollection: 8,
      avgWaitMins: "14.5 mins",
      badge: "Bedside Barcode",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      icon: Bed,
      accentColor: "text-indigo-600",
      accentBg: "bg-indigo-50 border-indigo-200",
      gradient: "from-indigo-600 to-violet-600",
      actionText: "Review Ward Draws",
      actionHref: "/samples?channel=IPD",
      keyMetrics: [
        { label: "ICU / CCU", value: "14 Beds" },
        { label: "Routine Wards", value: "24 Beds" },
      ]
    },
    {
      id: "STAT",
      title: "Emergency STAT",
      subtitle: "Casualty, Triage & Acute OT Requisitions",
      count: stats?.statCount ?? 12,
      pendingCollection: 2,
      avgWaitMins: "1.8 mins",
      badge: "Target < 45m SLA",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse",
      icon: Flame,
      accentColor: "text-rose-600",
      accentBg: "bg-rose-50 border-rose-200",
      gradient: "from-rose-500 to-red-600",
      actionText: "Emergency Priority",
      actionHref: "/orders?priority=STAT",
      keyMetrics: [
        { label: "Avg TAT", value: "28 mins" },
        { label: "Breached SLA", value: "0" },
      ]
    },
    {
      id: "B2B",
      title: "B2B Franchise & Logistics",
      subtitle: "Satellite Diagnostic Hubs & Clinics",
      count: stats?.b2bCount ?? 42,
      pendingCollection: 0,
      avgWaitMins: "Batch Ingest",
      badge: "Cold Chain Verified (4.1°C)",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: Truck,
      accentColor: "text-emerald-600",
      accentBg: "bg-emerald-50 border-emerald-200",
      gradient: "from-emerald-500 to-teal-600",
      actionText: "Manifest Intake",
      actionHref: "/samples?channel=B2B",
      keyMetrics: [
        { label: "Franchise Hubs", value: "6 Centers" },
        { label: "Temp Status", value: "2°-8°C OK" },
      ]
    },
  ];

  const totalRequisitions = channels.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header Strip */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
              Multi-Channel Clinical Requisition Matrix
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                {totalRequisitions} Patients Processed Today
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time requisition triage across Hospital Outpatient (OPD), Inpatient Wards (IPD), Casualty STAT, and External B2B Franchise Logistics.
          </p>
        </div>

        {/* Channel Filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {(["ALL", "OPD", "IPD", "STAT", "B2B"] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setSelectedChannel(ch)}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedChannel === ch
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* 4-Channel Cards Grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {channels
          .filter((c) => selectedChannel === "ALL" || selectedChannel === c.id)
          .map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.id}
                className="group relative bg-white rounded-xl border border-slate-200/90 hover:border-sky-300 p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between"
              >
                {/* Top border accent line */}
                <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r ${c.gradient}`} />

                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${c.accentBg} ${c.accentColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.badgeColor}`}>
                      {c.badge}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-sky-700 transition-colors">
                    {c.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    {c.subtitle}
                  </p>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {loading ? "..." : c.count}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      orders today
                    </span>
                  </div>

                  {/* Secondary Metrics Strip */}
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                    {c.keyMetrics.map((km, i) => (
                      <div key={i} className="bg-slate-50/80 rounded-lg p-1.5 border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">{km.label}</span>
                        <span className="font-bold text-slate-800">{km.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px] font-medium">
                    {c.pendingCollection > 0 ? (
                      <span className="text-amber-600 font-semibold flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {c.pendingCollection} draws pending
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> All collected
                      </span>
                    )}
                  </span>
                  <a
                    href={c.actionHref}
                    className="font-bold text-sky-600 hover:text-sky-700 flex items-center gap-0.5 text-[11px] group-hover:translate-x-0.5 transition-transform"
                  >
                    View <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
      </div>

      {/* Bottom Emergency / Cold-Chain Quick Guidance Bar */}
      <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-rose-600" />
            <strong className="text-slate-800">Casualty STAT Protocol:</strong> Bedside draws prioritize centrifuge & auto-release &lt; 45m.
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="flex items-center gap-1.5">
            <Thermometer className="h-3.5 w-3.5 text-teal-600" />
            <strong className="text-slate-800">Cold Chain SLA:</strong> All inbound B2B logistics maintain 2°C - 8°C cold packs.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> NABL ISO 15189:2022 Compliant
          </span>
        </div>
      </div>
    </div>
  );
}
