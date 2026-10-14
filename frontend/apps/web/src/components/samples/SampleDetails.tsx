"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Activity, Clock3, AlertTriangle, Printer, Loader2, 
  MapPin, ShieldCheck, FlaskConical, ScanLine, 
  Hash, Droplet, UserRound, ArrowRight
} from "lucide-react";
import { sampleApi } from "@/lib/api";
import { formatPatientFullName } from "@/lib/patient-utils";

interface SampleDetailsProps {
  sample: any;
  onRefresh?: () => void;
}

export default function SampleDetails({
  sample,
  onRefresh
}: SampleDetailsProps) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: 'collect' | 'receive' | 'process' | 'complete', data: any = {}) => {
    try {
      setUpdating(true);
      setError(null);
      if (action === 'collect') await sampleApi.collect(sample.id, data);
      if (action === 'receive') await sampleApi.receive(sample.id, data);
      if (action === 'process') await sampleApi.process(sample.id, data.location || "Processing Lab");
      if (action === 'complete') await sampleApi.complete(sample.id, data.location || "Processing Lab");
      
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${action} sample.`);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "PROCESSING": return "bg-purple-50 text-purple-800 border-purple-200";
      case "RECEIVED": return "bg-sky-50 text-sky-800 border-sky-200";
      case "COLLECTED": return "bg-indigo-50 text-indigo-800 border-indigo-200";
      case "PENDING": return "bg-amber-50 text-amber-800 border-amber-200";
      case "REJECTED": return "bg-rose-50 text-rose-800 border-rose-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "STAT": return "bg-rose-100 text-rose-800 border-rose-300 font-black";
      case "URGENT": return "bg-amber-100 text-amber-800 border-amber-300 font-bold";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString('en-US', { 
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const workflowSteps = [
    { key: "PENDING", label: "Pending", icon: Clock3 },
    { key: "COLLECTED", label: "Collected", icon: Droplet },
    { key: "RECEIVED", label: "Received", icon: MapPin },
    { key: "PROCESSING", label: "Processing", icon: Activity },
    { key: "COMPLETED", label: "Completed", icon: ShieldCheck },
  ];

  const currentStepIndex = workflowSteps.findIndex(s => s.key === sample.status);
  const activeStep = currentStepIndex >= 0 ? currentStepIndex : (sample.status === "REJECTED" ? -1 : 0);

  return (
    <div className="space-y-6 text-slate-900">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800 shadow-sm">
          <AlertTriangle className="mr-2 inline h-4 w-4 text-rose-600" /> {error}
        </div>
      )}

      {/* Hero Header Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 border border-sky-200 text-sky-700 shadow-sm">
              <FlaskConical className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{sample.sampleNumber || `SMP-${sample.id}`}</h1>
                <span className={`rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${getStatusColor(sample.status)}`}>
                  {sample.status}
                </span>
                {sample.priority && (
                  <span className={`rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${getPriorityColor(sample.priority)}`}>
                    {sample.priority}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1 font-mono"><Hash className="h-3.5 w-3.5 text-sky-600" /> ID: {sample.id}</span>
                <span className="flex items-center gap-1 font-mono"><ScanLine className="h-3.5 w-3.5 text-sky-600" /> Barcode: {sample.barcode || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => window.open(`/samples/${sample.id}/label`, '_blank')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 shadow-sm"
            >
              <Printer className="h-4 w-4 text-sky-600" /> Print Label
            </button>
            <button
              onClick={() => window.open(`/samples/${sample.id}/collection-sheet`, '_blank')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 shadow-sm"
            >
              <Printer className="h-4 w-4 text-indigo-600" /> Collection Sheet
            </button>
          </div>
        </div>

        {/* Chain of Custody Tracker */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/70 p-5">
          <h3 className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700">
            <Activity className="h-4 w-4 text-sky-600" /> Specimen Lifecycle Progression
          </h3>
          <div className="relative flex justify-between">
            <div className="absolute left-6 right-6 top-5 h-1 -translate-y-1/2 bg-slate-200 rounded-full" />
            <div 
              className="absolute left-6 top-5 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-700" 
              style={{ width: `${Math.max(0, activeStep) * 25}%` }} 
            />
            
            {workflowSteps.map((step, idx) => {
              const isActive = idx <= activeStep;
              const isCurrent = idx === activeStep;
              const Icon = step.icon;
              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    isActive ? "border-sky-600 bg-white shadow-sm ring-2 ring-sky-300/40" : "border-slate-300 bg-slate-100"
                  }`}>
                    <Icon className={`h-4 w-4 ${isActive ? "text-sky-600 font-bold" : "text-slate-400"}`} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isCurrent ? "text-sky-800 font-black" : isActive ? "text-slate-700" : "text-slate-400"
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Specimen Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
            <FlaskConical className="h-4 w-4 text-sky-600" /> Specimen Details
          </h2>
          <div className="space-y-4 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Test Required</p>
              <p className="font-bold text-slate-900 mt-0.5">{sample.test?.testName || "Unknown Test"}</p>
              <p className="font-mono text-[11px] text-sky-700 font-bold">{sample.test?.testCode}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Specimen Matrix</p>
              <p className="font-bold text-slate-800 mt-0.5">{sample.sampleType || sample.test?.sampleType || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Container Tube</p>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-800">
                <Droplet className="h-3 w-3 text-sky-600" /> {sample.test?.sampleContainer || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Patient & Order Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
            <UserRound className="h-4 w-4 text-sky-600" /> Patient &amp; Order
          </h2>
          <div className="space-y-4 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Patient</p>
              <p className="font-bold text-slate-900 mt-0.5">
                {sample.order?.patient ? formatPatientFullName(sample.order.patient) : "—"}
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                UHID: {sample.order?.patient?.uhid || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Order Requisition</p>
              <p className="font-mono font-bold text-sky-700 mt-0.5">{sample.order?.orderNumber || "—"}</p>
            </div>
            <div className="flex gap-2 pt-1">
               {sample.order?.patient?.id && (
                <Link href={`/patients/${sample.order.patient.id}`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                  View Patient
                </Link>
               )}
               {sample.order?.id && (
                <Link href={`/orders/${sample.order.id}`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                  View Order
                </Link>
               )}
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
            <Activity className="h-4 w-4 text-sky-600" /> Operational Workflow
          </h2>
          
          <div className="space-y-3">
            {sample.status === "PENDING" && (
              <button
                onClick={() => handleAction('collect', { 
                  barcode: sample.barcode || `AUTO-${sample.id.slice(0, 8)}`,
                  collectionType: "WALK_IN",
                  priority: "ROUTINE",
                  location: "Phlebotomy Desk"
                })}
                disabled={updating}
                className="group flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-3 text-xs font-bold text-white shadow-sm hover:from-sky-500 hover:to-blue-500 transition-all disabled:opacity-50"
              >
                <span className="flex items-center gap-2"><Droplet className="h-4 w-4" /> Mark as Collected</span>
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </button>
            )}
            
            {sample.status === "COLLECTED" && (
              <button
                onClick={() => handleAction('receive', { notes: "Received via manual action", location: "Lab Reception" })}
                disabled={updating}
                className="group flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-sm hover:from-teal-500 hover:to-emerald-500 transition-all disabled:opacity-50"
              >
                <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Receive in Lab</span>
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </button>
            )}

            {sample.status === "RECEIVED" && (
              <button
                onClick={() => handleAction('process', { location: "Main Processing Lab" })}
                disabled={updating}
                className="group flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-sm hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50"
              >
                <span className="flex items-center gap-2"><Activity className="h-4 w-4" /> Start Analyzer Run</span>
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </button>
            )}

            {sample.status === "PROCESSING" && (
              <button
                onClick={() => handleAction('complete', { location: "Main Processing Lab" })}
                disabled={updating}
                className="group flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-xs font-bold text-white shadow-sm hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50"
              >
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Validate Results</span>
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </button>
            )}

            {sample.status === "COMPLETED" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-emerald-800">
                <ShieldCheck className="mx-auto mb-1.5 h-6 w-6 text-emerald-600" />
                <p className="font-bold text-xs">Processing Complete</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Ready for results sign-off &amp; verification.</p>
              </div>
            )}

            {sample.status === "REJECTED" && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-rose-800">
                <AlertTriangle className="mx-auto mb-1.5 h-6 w-6 text-rose-600" />
                <p className="font-bold text-xs">Specimen Rejected</p>
                <p className="text-[11px] text-rose-700 mt-0.5">Reason: {sample.rejectionReason || "Quality Defect"}</p>
              </div>
            )}
            
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-slate-400" /> Accessioned</span>
              <span>{formatDate(sample.createdAt)}</span>
            </div>
            {sample.collectedAt && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-sky-600" /> Collected</span>
                <span>{formatDate(sample.collectedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}