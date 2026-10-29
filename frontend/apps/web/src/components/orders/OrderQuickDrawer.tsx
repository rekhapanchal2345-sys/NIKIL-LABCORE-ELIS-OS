"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  UserRound,
  FileText,
  Clock,
  Clock3,
  Calendar,
  CreditCard,
  Printer,
  Share2,
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  ScanLine,
  Building2,
  ExternalLink,
  Eye,
  DollarSign,
  Phone,
  ShieldCheck,
  Stethoscope,
  Activity,
  ArrowRight,
  Flame,
  MessageCircle,
  Copy,
  Receipt,
  TestTube,
  Check,
  Sparkles,
  Award,
  Barcode as BarcodeIcon,
  Info,
} from "lucide-react";
import { showSuccess } from "@/lib/notifications";
import {
  CLSI_VACUTAINER_CATALOG,
  detectRequiredTubes,
  formatTubeBarcode,
} from "@/lib/phlebotomy-tubes";

export interface DrawerOrder {
  id: string;
  orderNumber: string;
  barcode: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    uhid: string;
    phone: string;
    gender: string;
    dateOfBirth?: string;
    age?: number;
    email?: string;
    address?: string;
  };
  doctor?: {
    id: string;
    doctorCode: string;
    fullName: string;
    specialization: string;
    clinicName?: string;
    phone?: string;
  };
  items: Array<{
    id: string;
    test: {
      id: string;
      testCode: string;
      testName: string;
      sampleType: string;
      sampleContainer?: string;
      tatHours?: number;
      processingDepartment?: string;
    };
    price: number;
    finalPrice: number;
  }>;
  samples?: Array<{
    id: string;
    sampleNumber: string;
    barcode: string;
    sampleType: string;
    status: string;
    collectedAt?: string;
  }>;
  orderStatus: string;
  paymentStatus: string;
  priority?: string;
  collectionType?: string;
  createdAt: string;
  sampleCollected: boolean;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
}

interface OrderQuickDrawerProps {
  order: DrawerOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onCollectSample: (order: DrawerOrder) => void;
  onAddPayment: (order: DrawerOrder) => void;
  onAssignDoctor: (order: DrawerOrder) => void;
  onCancelOrder: (order: DrawerOrder) => void;
  onWhatsApp: (order: DrawerOrder) => void;
  onPrintBarcode: (order: DrawerOrder) => void;
  onPrintInvoice: (order: DrawerOrder) => void;
}

const TUBE_CONTAINER_COLORS: Record<string, { bg: string; text: string; border: string; capColor: string; name: string; desc: string }> = {
  "EDTA Tube": { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", capColor: "#8B5CF6", name: "Lavender EDTA", desc: "Whole Blood / Invert 8-10x" },
  "Lavender Top": { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", capColor: "#8B5CF6", name: "Lavender EDTA", desc: "Whole Blood / Invert 8-10x" },
  "Serum Separator Tube": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", capColor: "#F59E0B", name: "Gold SST Gel", desc: "Clot Activator / Invert 5x" },
  "SST": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", capColor: "#F59E0B", name: "Gold SST Gel", desc: "Clot Activator / Invert 5x" },
  "Red Top": { bg: "bg-red-50", text: "text-red-800", border: "border-red-200", capColor: "#EF4444", name: "Red Plain", desc: "Plain Serum / No Additive" },
  "Sodium Citrate": { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", name: "Light Blue Citrate", desc: "1:9 Ratio / Coagulation" },
  "Light Blue": { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", name: "Light Blue Citrate", desc: "1:9 Ratio / Coagulation" },
  "Lithium Heparin": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", capColor: "#10B981", name: "Green Heparin", desc: "Plasma / Invert 8x" },
  "Green Top": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", capColor: "#10B981", name: "Green Heparin", desc: "Plasma / Invert 8x" },
  "Fluoride Tube": { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", capColor: "#64748B", name: "Grey Fluoride", desc: "Glycolysis Inhibitor" },
  "Grey Top": { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", capColor: "#64748B", name: "Grey Fluoride", desc: "Glycolysis Inhibitor" },
  "Sterile Container": { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200", capColor: "#EAB308", name: "Urine Sterile Cup", desc: "Midstream Clean Catch" },
};

function getContainerStyle(containerName?: string) {
  if (!containerName) return { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", name: "Standard Specimen", desc: "Standard Tube" };
  for (const [key, val] of Object.entries(TUBE_CONTAINER_COLORS)) {
    if (containerName.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", name: containerName, desc: "Lab Standard" };
}

export default function OrderQuickDrawer({
  order,
  isOpen,
  onClose,
  onCollectSample,
  onAddPayment,
  onAssignDoctor,
  onCancelOrder,
  onWhatsApp,
  onPrintBarcode,
  onPrintInvoice,
}: OrderQuickDrawerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "tubes" | "tests" | "billing" | "timeline">("overview");
  const [copiedBarcode, setCopiedBarcode] = useState(false);

  if (!isOpen || !order) return null;

  const isStat = order.priority === "STAT" || order.priority === "URGENT";
  const isPaid = order.paymentStatus === "PAID";
  const isPartial = order.paymentStatus === "PARTIAL";

  const workflowSteps = [
    { key: "REGISTERED", label: "Registered" },
    { key: "SAMPLE_COLLECTED", label: "Sample Drawn" },
    { key: "PROCESSING", label: "In-Analyzer" },
    { key: "COMPLETED", label: "Validated & Complete" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "REGISTERED": return 0;
      case "SAMPLE_COLLECTED": return 1;
      case "PROCESSING": return 2;
      case "COMPLETED": return 3;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(order.orderStatus);

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(order.barcode);
    setCopiedBarcode(true);
    setTimeout(() => setCopiedBarcode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition-all duration-300">
      <div className="relative flex h-full w-full max-w-2xl flex-col border-l border-slate-200/90 bg-white text-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* ========================================================
            LIGHT CLINICAL HOSPITAL DOSSIER HEADER
            ======================================================== */}
        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-r from-sky-50/90 via-white to-teal-50/50 p-6">
          <div className="relative flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full border border-sky-300 bg-sky-50 px-3 py-0.5 font-mono text-[11px] font-bold text-sky-800 shadow-2xs">
                  {order.orderNumber}
                </span>

                {isStat && (
                   <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-black uppercase text-white shadow-xs flex items-center gap-1">
                     <Flame className="h-3 w-3 fill-white" /> {order.priority} PRIORITY
                  </span>
                )}

                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase ${
                  order.orderStatus === "COMPLETED" ? "border-emerald-200 bg-emerald-50 text-emerald-800" :
                  order.orderStatus === "PROCESSING" ? "border-blue-200 bg-blue-50 text-blue-800" :
                  order.orderStatus === "SAMPLE_COLLECTED" ? "border-purple-200 bg-purple-50 text-purple-800" :
                  order.orderStatus === "CANCELLED" ? "border-rose-200 bg-rose-50 text-rose-800" :
                  "border-amber-200 bg-amber-50 text-amber-800"
                }`}>
                  {order.orderStatus.replace("_", " ")}
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                {order.patient.firstName} {order.patient.lastName}
                <span className="text-xs font-mono font-bold text-slate-500">({order.patient.uhid})</span>
              </h2>

              <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                <span className="font-mono flex items-center gap-1">
                  <ScanLine className="h-3.5 w-3.5 text-sky-600" />
                  Barcode: <strong className="text-slate-800">{order.barcode}</strong>
                  <button
                    onClick={handleCopyBarcode}
                    className="p-1 hover:text-sky-600 text-slate-400"
                    title="Copy Barcode"
                  >
                    {copiedBarcode ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                </span>
                <span>•</span>
                 <span>{order.items.length} investigation(s)</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shadow-2xs"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Clinical Requisition Milestone Stepper */}
          <div className="mt-4 pt-3.5 border-t border-slate-200/80">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5">
               <span>Current order stage</span>
              <span className="text-sky-700 font-extrabold">{workflowSteps[currentStep]?.label || order.orderStatus}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {workflowSteps.map((step, idx) => (
                <div
                  key={step.key}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx <= currentStep
                      ? "bg-gradient-to-r from-sky-500 to-indigo-600 shadow-2xs"
                      : "bg-slate-200"
                  }`}
                  title={step.label}
                />
              ))}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1.5 border-t border-slate-200/80 pt-3 mt-4 text-xs font-bold overflow-x-auto">
            {([
              ["overview", "Overview"],
              ["tubes", "Specimen Tubes"],
               ["tests", `Investigations (${order.items.length})`],
              ["billing", "Billing Ledger"],
              ["timeline", "Audit Log"],
            ] as const).map(([tabKey, tabLabel]) => (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey as any)}
                className={`rounded-xl px-3.5 py-1.5 transition-all whitespace-nowrap ${
                  activeTab === tabKey
                    ? "bg-white text-sky-800 border border-sky-300 shadow-2xs font-extrabold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {tabLabel}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================
            SCROLLABLE CONTENT BODY (LIGHT WHITE MEDICAL CARDS)
            ======================================================== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-slate-50/40">
          {activeTab === "overview" && (
            <>
              {/* Patient Profile Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-700">
                    <UserRound className="h-4 w-4" /> Patient Demographics
                  </div>
                  <Link
                    href={`/patients/${order.patient.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700"
                  >
                    Patient Profile <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Full Legal Name</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {order.patient.firstName} {order.patient.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Hospital UHID #</p>
                    <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{order.patient.uhid}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Phone / WhatsApp</p>
                    <p className="font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" /> {order.patient.phone || "No phone recorded"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Age &amp; Gender</p>
                    <p className="font-semibold text-slate-700 mt-0.5">
                      {order.patient.age || "—"} Yrs · {order.patient.gender}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                   <span className="text-slate-500">Patient identity record:</span>
                   <span className="font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                     Linked to patient record
                   </span>
                </div>
              </div>

              {/* Referring Clinician */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
                    <Stethoscope className="h-4 w-4" /> Referring Clinician / Hospital Ward
                  </div>
                  <button
                    onClick={() => onAssignDoctor(order)}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700"
                  >
                    {order.doctor ? "Change Doctor" : "Assign Doctor"}
                  </button>
                </div>

                {order.doctor ? (
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Doctor Name</p>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{order.doctor.fullName}</p>
                      <p className="text-[11px] text-slate-500">{order.doctor.specialization}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Doctor Code / Clinic</p>
                      <p className="font-mono font-bold text-indigo-700 mt-0.5">{order.doctor.doctorCode}</p>
                      <p className="text-[11px] text-slate-500">{order.doctor.clinicName || "Central OPD Consult"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 text-center text-xs text-slate-500">
                    Self / Walk-in Requisition (No referring clinician assigned)
                  </div>
                )}
              </div>

              {/* Quick Phlebotomy & Financial Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Phlebotomy Draw Status</span>
                  <p className="font-black text-sm text-slate-900">
                    {order.sampleCollected ? "Samples Collected" : "Pending Phlebotomy Draw"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {order.collectionType === "HOME_COLLECTION" ? "Home Sample Collection" : "Walk-in Lab Phlebotomy"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Financial Clearance</span>
                  <p className={`font-black text-sm ${isPaid ? "text-emerald-700" : isPartial ? "text-amber-700" : "text-rose-700"}`}>
                    ₹{order.paidAmount} / ₹{order.grandTotal} ({order.paymentStatus})
                  </p>
                  {order.dueAmount > 0 && (
                    <p className="text-[11px] text-rose-600 font-bold">₹{order.dueAmount} Balance Due</p>
                  )}
                </div>
              </div>

              {/* Quick Actions Hub */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => onPrintBarcode(order)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <Printer className="h-4 w-4 text-sky-600" /> Barcode Labels
                </button>
                <button
                  onClick={() => onPrintInvoice(order)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <Receipt className="h-4 w-4 text-indigo-600" /> Receipt / Bill
                </button>
                <button
                  onClick={() => onWhatsApp(order)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp
                </button>
              </div>
            </>
          )}

          {/* TAB 2: SPECIMEN VACUTAINER MATRIX & PHLEBOTOMY SPECIMEN TUBE BARCODES */}
          {activeTab === "tubes" && (() => {
            const orderTests = (order.items || []).map((i) => ({
              testName: i.test?.testName || "Diagnostic Test",
              sampleType: i.test?.sampleType || "WHOLE_BLOOD",
            }));
            const requiredTubes = orderTests.length > 0
              ? detectRequiredTubes(orderTests)
              : CLSI_VACUTAINER_CATALOG.filter((t) =>
                  ["tube-citrate-blue", "tube-sst-gold", "tube-edta-purple"].includes(t.id)
                );
            const orderCode = order.barcode || order.orderNumber || order.patient?.uhid || "ORD";

            return (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <BarcodeIcon className="w-4 h-4 text-indigo-600" />
                        Phlebotomy Specimen Tube Barcode Generator
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {orderTests.length > 0
                          ? `Mapped from ${orderTests.length} ordered diagnostic tests (CLSI H3-A6 Order of Draw)`
                          : "Standard Diagnostic Phlebotomy Sequence (CLSI Order of Draw)"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onPrintBarcode(order)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm active:scale-98 transition-all cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print All {requiredTubes.length} Labels</span>
                    </button>
                  </div>

                  {/* Vacutainer Tube List */}
                  <div className="space-y-2.5">
                    {requiredTubes.map((tube) => {
                      const tubeBarcode = formatTubeBarcode(orderCode, tube.code);
                      return (
                        <div
                          key={tube.id}
                          className={`rounded-xl border p-3.5 text-xs transition-all flex items-center justify-between gap-3 ${tube.badgeBg} ${tube.badgeBorder}`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className="h-4 w-4 rounded-full border border-black/30 shadow-xs shrink-0 mt-0.5"
                              style={{ backgroundColor: tube.capColorHex }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={`font-black text-sm ${tube.badgeText}`}>
                                  {tube.name}
                                </p>
                                <span className="rounded bg-white/80 border px-1.5 py-0.2 text-[10px] font-bold text-slate-700 font-mono">
                                  {tube.orderOfDrawLabel}
                                </span>
                              </div>

                              <p className="font-mono text-xs font-bold text-slate-800 mt-0.5">
                                Barcode: <span className="bg-white px-1.5 py-0.2 rounded border border-slate-300">{tubeBarcode}</span>
                              </p>

                              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-600 font-medium">
                                <span>Inversions: <strong className="text-slate-900">{tube.inversions}</strong></span>
                                <span>•</span>
                                <span>Volume: <strong className="text-slate-900">{tube.minVolume.split(" ")[0]} {tube.minVolume.split(" ")[1] || ""}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(tubeBarcode);
                                showSuccess(`Barcode ${tubeBarcode} copied to clipboard!`);
                              }}
                              className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                              title="Copy Barcode"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onPrintBarcode(order)}
                              className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50 hover:border-indigo-400 transition-colors shadow-xs cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Print Label</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* CLSI Order of Draw Training Card */}
                  <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 text-xs text-blue-950 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-black text-blue-900">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span>CLSI H3-A6 Phlebotomy Training Rule:</span>
                    </div>
                    <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                      Always draw blood in the standard sequence: <strong>Citrate (Blue) → SST Gel (Gold) → Heparin (Green) → EDTA (Purple) → Fluoride (Grey)</strong>.
                      Incorrect draw sequence contaminates serum with potassium/EDTA, causing false electrolyte &amp; coagulation findings.
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 3: ORDERED ASSAYS */}
          {activeTab === "tests" && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                Prescribed Test Panels &amp; Diagnostic Analyzers
              </h3>
              {order.items.map((item, idx) => {
                const tube = getContainerStyle(item.test.sampleContainer);
                return (
                  <div
                    key={item.id || idx}
                    className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{item.test.testName}</h4>
                          <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                            {item.test.testCode}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Department: {item.test.processingDepartment || "Central Pathology Lab"} · Matrix: {item.test.sampleType}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-slate-900">₹{item.finalPrice || item.price}</span>
                        {item.test.tatHours && (
                          <p className="text-[10px] text-slate-500 font-mono">TAT: {item.test.tatHours}h</p>
                        )}
                      </div>
                    </div>

                    {/* Container Badge */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                      <div
                        className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-[10px] font-bold"
                        style={{
                          borderColor: `${tube.capColor}55`,
                          backgroundColor: `${tube.capColor}15`,
                          color: tube.capColor,
                        }}
                      >
                        <span
                          className="h-2 w-2 rounded-full shadow-inner"
                          style={{ backgroundColor: tube.capColor }}
                        />
                        <span>{item.test.sampleContainer || "Standard Specimen Tube"}</span>
                      </div>

                      <span className="text-[10px] text-slate-500">
                        {item.test.sampleType === "BLOOD" ? "Room Temp (18-25°C)" : "Standard Handling"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: BILLING & SPLIT LEDGER */}
          {activeTab === "billing" && (
            <div className="space-y-4 text-xs">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
                <h3 className="font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" /> Financial Breakdown &amp; Payment Ledger
                </h3>

                <div className="space-y-2 border-b border-slate-100 pb-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Tests Subtotal ({order.items.length} panels)</span>
                    <span className="font-mono font-bold text-slate-900">₹{order.grandTotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Discount Applied</span>
                    <span className="font-mono font-bold text-emerald-700">₹0.00</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (Pathology SAC 999316 Exempt)</span>
                    <span className="font-mono font-bold text-slate-900">₹0.00</span>
                  </div>
                </div>

                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                  <span>Grand Total</span>
                  <span className="font-mono text-base text-sky-700">₹{order.grandTotal}</span>
                </div>

                <div className="flex justify-between text-xs font-bold text-emerald-700">
                  <span>Amount Paid</span>
                  <span className="font-mono">₹{order.paidAmount}</span>
                </div>

                <div className="flex justify-between text-xs font-bold text-rose-600">
                  <span>Balance Due</span>
                  <span className="font-mono">₹{order.dueAmount}</span>
                </div>
              </div>

              {order.dueAmount > 0 && (
                <button
                  onClick={() => onAddPayment(order)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-3.5 text-sm font-black text-white shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all"
                >
                  <DollarSign className="h-4 w-4" /> Record Payment / Settle Balance ₹{order.dueAmount}
                </button>
              )}
            </div>
          )}

          {/* TAB 5: LIFECYCLE AUDIT TRAIL */}
          {activeTab === "timeline" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-600" /> Order Lifecycle History
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
                <div className="relative">
                  <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-sky-500 shadow-xs" />
                  <p className="font-bold text-slate-900">Requisition Order Registered</p>
                  <p className="text-[10px] text-slate-500">Order #{order.orderNumber} initiated in LIS</p>
                  <span className="text-[9px] font-mono text-slate-400">{new Date(order.createdAt).toLocaleString()}</span>
                </div>

                {order.sampleCollected && (
                  <div className="relative">
                    <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-purple-500 shadow-xs" />
                    <p className="font-bold text-slate-900">Specimen Phlebotomy Draw Completed</p>
                    <p className="text-[10px] text-slate-500">Sample barcode #{order.barcode} labeled</p>
                  </div>
                )}

                {order.orderStatus === "PROCESSING" && (
                  <div className="relative">
                    <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-500 shadow-xs" />
                    <p className="font-bold text-slate-900">Diagnostic Analyzer Run in Progress</p>
                    <p className="text-[10px] text-slate-500">Loaded on central laboratory analyzers</p>
                  </div>
                )}

                {order.orderStatus === "COMPLETED" && (
                  <div className="relative">
                    <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-xs" />
                    <p className="font-bold text-slate-900">Test Completed &amp; Pathology Signed</p>
                    <p className="text-[10px] text-slate-500">Final diagnostic report ready for delivery</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            DRAWER BOTTOM STICKY ACTION FOOTER
            ======================================================== */}
        <div className="border-t border-slate-200 bg-white p-4 sm:p-5 flex items-center justify-between gap-2.5 shadow-lg flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onCancelOrder(order)}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-2xs"
            >
              Cancel
            </button>
            <Link
              href={`/orders/${order.id}`}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Eye className="h-4 w-4 text-sky-600" />
              <span>Full Dossier</span>
            </Link>
          </div>

          {!order.sampleCollected ? (
            <button
              onClick={() => onCollectSample(order)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
              <FlaskConical className="h-4 w-4" />
              <span>Phlebotomy Draw</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href={`/orders/${order.id}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 px-4 py-2.5 text-xs font-black text-white shadow-md hover:from-sky-700 hover:to-indigo-700 transition-all"
            >
              <span>Inspect Full Dossier</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
