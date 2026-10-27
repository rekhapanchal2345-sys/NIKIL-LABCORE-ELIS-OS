"use client";

import React, { useState, useMemo } from "react";
import {
  Clock,
  FlaskConical,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  UserRound,
  ScanLine,
  Flame,
  CreditCard,
  Printer,
  ArrowRight,
  MessageCircle,
  FileText,
  Search,
  Filter,
  Stethoscope,
  Timer,
  ExternalLink,
  Tag
} from "lucide-react";
import { DrawerOrder } from "./OrderQuickDrawer";

interface OrderPipelineKanbanProps {
  orders: DrawerOrder[];
  onSelectOrder: (order: DrawerOrder) => void;
  onAdvanceStatus: (order: DrawerOrder, nextStatus: string) => void;
  onPrintBarcode: (order: DrawerOrder) => void;
  onWhatsApp: (order: DrawerOrder) => void;
  updatingOrderId: string | null;
}

const TUBE_CONTAINER_COLORS: Record<string, { bg: string; text: string; border: string; capColor: string; name: string }> = {
  "EDTA Tube": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", capColor: "#8B5CF6", name: "EDTA" },
  "Lavender Top": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", capColor: "#8B5CF6", name: "EDTA" },
  "Serum Separator Tube": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", capColor: "#F59E0B", name: "SST" },
  "SST": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", capColor: "#F59E0B", name: "SST" },
  "Red Top": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", capColor: "#EF4444", name: "Red" },
  "Sodium Citrate": { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", capColor: "#0284C7", name: "Citrate" },
  "Light Blue": { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", capColor: "#0284C7", name: "Citrate" },
  "Lithium Heparin": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", capColor: "#10B981", name: "Heparin" },
  "Fluoride Tube": { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300", capColor: "#64748B", name: "Fluoride" },
  "Sterile Container": { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", capColor: "#EAB308", name: "Urine Cup" },
};

function getContainerBadge(containerName?: string) {
  if (!containerName) return { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", capColor: "#0284C7", name: "Specimen" };
  for (const [key, val] of Object.entries(TUBE_CONTAINER_COLORS)) {
    if (containerName.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", capColor: "#0284C7", name: containerName };
}

export default function OrderPipelineKanban({
  orders,
  onSelectOrder,
  onAdvanceStatus,
  onPrintBarcode,
  onWhatsApp,
  updatingOrderId,
}: OrderPipelineKanbanProps) {
  const [kanbanSearch, setKanbanSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const STAGES = [
    {
      id: "REGISTERED",
      title: "1. Registered Orders",
      sub: "Requisitions booked, awaiting sample draw",
      badgeClass: "border-amber-200 bg-amber-50 text-amber-900",
      accent: "from-amber-100/70 via-amber-50/40 to-transparent",
      headerBorder: "border-amber-200",
      icon: Clock,
      nextAction: "Collect Sample",
      nextStatus: "SAMPLE_COLLECTED",
      actionBg: "bg-purple-600 hover:bg-purple-700",
    },
    {
      id: "SAMPLE_COLLECTED",
      title: "2. Sample Drawn",
      sub: "Specimen labeled & in-transit to lab",
      badgeClass: "border-purple-200 bg-purple-50 text-purple-900",
      accent: "from-purple-100/70 via-purple-50/40 to-transparent",
      headerBorder: "border-purple-200",
      icon: FlaskConical,
      nextAction: "Send to Analyzer",
      nextStatus: "PROCESSING",
      actionBg: "bg-sky-600 hover:bg-sky-700",
    },
    {
      id: "PROCESSING",
      title: "3. In-Analyzer Run",
      sub: "Diagnostic testing & assay analysis active",
      badgeClass: "border-sky-200 bg-sky-50 text-sky-900",
      accent: "from-sky-100/70 via-sky-50/40 to-transparent",
      headerBorder: "border-sky-200",
      icon: Activity,
      nextAction: "Complete & Validate",
      nextStatus: "COMPLETED",
      actionBg: "bg-emerald-600 hover:bg-emerald-700",
    },
    {
      id: "COMPLETED",
      title: "4. Completed & Signed",
      sub: "Pathology verified, ready for report release",
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-900",
      accent: "from-emerald-100/70 via-emerald-50/40 to-transparent",
      headerBorder: "border-emerald-200",
      icon: CheckCircle2,
      nextAction: null,
      nextStatus: null,
      actionBg: "",
    },
  ];

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !kanbanSearch ||
        o.orderNumber?.toLowerCase().includes(kanbanSearch.toLowerCase()) ||
        o.barcode?.toLowerCase().includes(kanbanSearch.toLowerCase()) ||
        `${o.patient?.firstName} ${o.patient?.lastName}`.toLowerCase().includes(kanbanSearch.toLowerCase()) ||
        o.patient?.uhid?.toLowerCase().includes(kanbanSearch.toLowerCase()) ||
        o.doctor?.fullName?.toLowerCase().includes(kanbanSearch.toLowerCase());

      const matchPriority =
        priorityFilter === "all" || (o.priority || "ROUTINE") === priorityFilter;

      return matchSearch && matchPriority;
    });
  }, [orders, kanbanSearch, priorityFilter]);

  return (
    <div className="space-y-4">
      {/* Quick Search & Priority Filter Toolbar for Kanban */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search within pipeline (Patient, UHID, Barcode, Doctor)..."
            value={kanbanSearch}
            onChange={(e) => setKanbanSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-1.5 text-xs text-slate-800 outline-none focus:border-sky-500 font-medium transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Filter Priority:</span>
          {(["all", "ROUTINE", "URGENT", "STAT"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                priorityFilter === p
                  ? p === "STAT"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-sky-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60"
              }`}
            >
              {p === "all" ? "All Priorities" : p}
            </button>
          ))}
        </div>
      </div>

      {/* 4-Column Clinical Board */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {STAGES.map((stage) => {
          const stageOrders = filteredOrders.filter((o) => o.orderStatus === stage.id);
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              className="flex flex-col rounded-3xl border border-slate-200/90 bg-slate-50/50 shadow-xs overflow-hidden"
            >
              {/* Column Header */}
              <div
                className={`border-b ${stage.headerBorder} bg-gradient-to-b ${stage.accent} bg-white p-4`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white shadow-2xs border border-slate-200/80">
                      <Icon className="h-4 w-4 text-slate-700" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      {stage.title}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-black shadow-2xs ${stage.badgeClass}`}
                  >
                    {stageOrders.length}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 font-medium">{stage.sub}</p>
              </div>

              {/* Column Cards Container */}
              <div className="flex-1 space-y-3 p-3 min-h-[520px] max-h-[75vh] overflow-y-auto custom-scrollbar">
                {stageOrders.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4 text-center text-slate-400">
                    <FileText className="h-6 w-6 stroke-[1.5] text-slate-300 mb-2" />
                     <p className="text-xs font-semibold text-slate-500">No orders in this stage</p>
                  </div>
                ) : (
                  stageOrders.map((order) => {
                    const isStat = order.priority === "STAT" || order.priority === "URGENT";
                    const isPaid = order.paymentStatus === "PAID";
                    const isUpdating = updatingOrderId === order.id;

                    return (
                      <div
                        key={order.id}
                        className={`group relative overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:shadow-md hover:border-sky-300 ${
                          isStat
                            ? "border-rose-300 shadow-rose-100 shadow-sm"
                            : "border-slate-200/90 shadow-2xs"
                        }`}
                      >
                         {/* Priority order banner */}
                        {isStat && (
                           <div className="flex items-center justify-between bg-rose-600 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-xs">
                             <span className="flex items-center gap-1">
                               <Flame className="h-3 w-3 fill-white" /> {order.priority} PRIORITY
                             </span>
                             <span className="bg-white/20 px-1.5 py-0.2 rounded font-mono text-[8px]">
                               PRIORITY
                            </span>
                          </div>
                        )}

                        <div className="p-3.5 space-y-3">
                          {/* Order Number, Barcode & Payment Pill */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <button
                                onClick={() => onSelectOrder(order)}
                                className="text-left font-mono text-xs font-black text-slate-900 hover:text-sky-600 transition-colors flex items-center gap-1"
                              >
                                {order.orderNumber}
                                <ChevronRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                              <p className="font-mono text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <ScanLine className="h-3 w-3 text-sky-600" /> {order.barcode}
                              </p>
                            </div>

                            {/* Payment Pill */}
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[9px] font-bold ${
                                isPaid
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : order.paymentStatus === "PARTIAL"
                                  ? "border-amber-200 bg-amber-50 text-amber-800"
                                  : "border-rose-200 bg-rose-50 text-rose-800"
                              }`}
                            >
                              {order.paymentStatus}
                            </span>
                          </div>

                          {/* Patient Demographics */}
                          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 space-y-1">
                            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <UserRound className="h-3.5 w-3.5 text-sky-600" />
                              {order.patient?.firstName} {order.patient?.lastName}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                              <span>UHID: <span className="font-mono text-slate-700 font-bold">{order.patient?.uhid}</span></span>
                              <span>{order.patient?.age || "—"}y · {order.patient?.gender}</span>
                            </div>
                          </div>

                          {/* Referring Clinician & Tests */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-slate-600">
                              <span className="flex items-center gap-1 truncate max-w-[150px] font-medium">
                                <Stethoscope className="h-3 w-3 text-slate-400" />
                                {order.doctor?.fullName || "OPD Walk-in / Self"}
                              </span>
                              <span className="font-bold text-slate-800 font-mono text-[11px]">
                                ₹{order.grandTotal || 0}
                              </span>
                            </div>

                            {/* Vacutainer Tube Pills */}
                            <div className="flex flex-wrap gap-1">
                              {order.items?.slice(0, 3).map((item, idx) => {
                                const tube = getContainerBadge(item.test?.sampleContainer);
                                return (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${tube.bg} ${tube.border} ${tube.text}`}
                                  >
                                    <span
                                      className="h-1.5 w-1.5 rounded-full"
                                      style={{ backgroundColor: tube.capColor }}
                                    />
                                    <span className="truncate max-w-[80px]">
                                      {item.test?.testCode || item.test?.testName}
                                    </span>
                                  </span>
                                );
                              })}
                              {(order.items?.length || 0) > 3 && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  +{(order.items?.length || 0) - 3}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Footer */}
                          <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onPrintBarcode(order)}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-sky-600 hover:bg-slate-50 transition-colors shadow-2xs"
                                title="Print Tube Barcodes"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onWhatsApp(order)}
                                className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs"
                                title="Send WhatsApp Update"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Workflow Progression Button */}
                            {stage.nextAction && stage.nextStatus && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => onAdvanceStatus(order, stage.nextStatus!)}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black text-white shadow-2xs transition-all ${stage.actionBg} disabled:opacity-50`}
                              >
                                <span>{isUpdating ? "Updating..." : stage.nextAction}</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}

                            {stage.id === "COMPLETED" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Released
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
