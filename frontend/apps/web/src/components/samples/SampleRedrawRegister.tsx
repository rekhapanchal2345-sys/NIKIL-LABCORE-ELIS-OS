"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, RefreshCw, AlertTriangle, CheckCircle2, UserRound, 
  Clock, PhoneCall, MessageSquare, Send, FileText, ArrowRight,
  Filter, Search, Building2, FlaskConical, Hash
} from "lucide-react";

interface RedrawSample {
  id: string;
  sampleNumber: string;
  barcode: string;
  patientId: string;
  orderId: string;
  testId: string;
  sampleType: string;
  status: string;
  priority?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
  order: {
    orderNumber: string;
    patient: {
      uhid: string;
      firstName: string;
      lastName: string;
      gender: string;
      age?: number;
      phone?: string;
    };
    doctor?: {
      fullName: string;
      specialization?: string;
    };
  };
  test: {
    testCode: string;
    testName: string;
    sampleContainer: string;
    processingDepartment?: string;
  };
}

interface SampleRedrawRegisterProps {
  samples: RedrawSample[];
  onTriggerRedraw?: (sample: RedrawSample) => void;
  onSelectSample?: (sample: RedrawSample) => void;
}

export default function SampleRedrawRegister({
  samples,
  onTriggerRedraw,
  onSelectSample,
}: SampleRedrawRegisterProps) {
  const rejectedSamples = samples.filter((s) => s.status === "REJECTED");
  const [selectedReasonFilter, setSelectedReasonFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [notifiedMap, setNotifiedMap] = useState<Record<string, boolean>>({});

  const filtered = rejectedSamples.filter((sample) => {
    const matchesReason =
      selectedReasonFilter === "all" ||
      (sample.rejectionReason &&
        sample.rejectionReason.toLowerCase().includes(selectedReasonFilter.toLowerCase()));
    const patientName = `${sample.order.patient.firstName} ${sample.order.patient.lastName}`.toLowerCase();
    const matchesSearch =
      sample.sampleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sample.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sample.order.patient.uhid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientName.includes(searchTerm.toLowerCase());
    return matchesReason && matchesSearch;
  });

  const handleNotifyPatient = (id: string) => {
    setNotifiedMap((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-600" /> CLSI GP44 Specimen Rejection Register
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                <Clock className="h-3.5 w-3.5 text-amber-600" /> Active Redraw Queue
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl mt-1.5">
              Specimen Rejection &amp; Redraw Escalation Desk
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl mt-1">
              Automated audit trail for hemolyzed, clotted, QNS, or mislabeled specimens requiring rapid phlebotomy redraw re-collection.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-right">
              <span className="text-[10px] uppercase font-bold text-rose-600">Total Rejected</span>
              <p className="text-xl font-black text-rose-950 font-mono">{rejectedSamples.length} Specimens</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Redraw UHID, Patient, Sample..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-sky-500 focus:bg-white transition-all"
            />
          </div>

          <select
            value={selectedReasonFilter}
            onChange={(e) => setSelectedReasonFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-500"
          >
            <option value="all">All Rejection Causes</option>
            <option value="hemolyzed">Hemolyzed</option>
            <option value="clotted">Clotted Tube</option>
            <option value="quantity">Insufficient Quantity (QNS)</option>
            <option value="container">Wrong Container / Tube</option>
            <option value="label">Mislabeled / Missing ID</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filtered.length} of {rejectedSamples.length} redraw requisitions
        </div>
      </div>

      {/* Redraw List Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h3 className="text-sm font-black text-slate-900">Zero Pending Specimen Redraws</h3>
            <p className="text-xs text-slate-500">
              All accessioned specimens have passed pre-analytical quality and NABL criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Sample ID / Barcode</th>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Test Ordered</th>
                  <th className="px-5 py-3.5">Rejection Cause</th>
                  <th className="px-5 py-3.5">Communication Status</th>
                  <th className="px-5 py-3.5 text-right">Redraw Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((sample) => {
                  const isNotified = !!notifiedMap[sample.id];
                  return (
                    <tr key={sample.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Sample ID */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <button
                            onClick={() => onSelectSample && onSelectSample(sample)}
                            className="font-mono text-xs font-black text-rose-700 hover:underline"
                          >
                            {sample.sampleNumber}
                          </button>
                          <p className="font-mono text-[11px] text-slate-500">{sample.barcode}</p>
                          <p className="text-[10px] text-slate-400">Order #{sample.order.orderNumber}</p>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900">
                            {sample.order.patient.firstName} {sample.order.patient.lastName}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            UHID: {sample.order.patient.uhid}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {sample.order.patient.phone || "No phone listed"}
                          </p>
                        </div>
                      </td>

                      {/* Test */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800">{sample.test.testName}</p>
                          <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                            {sample.test.testCode}
                          </span>
                        </div>
                      </td>

                      {/* Cause */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-black text-rose-800">
                          <AlertTriangle className="h-3 w-3 text-rose-600" />
                          {sample.rejectionReason || "Specimen Quality Non-Conformity"}
                        </span>
                      </td>

                      {/* Communication Status */}
                      <td className="px-5 py-4">
                        {isNotified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Notified Ward / Patient
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                            <Clock className="h-3 w-3 text-amber-600" /> Notification Pending
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleNotifyPatient(sample.id)}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
                            title="Send SMS / WhatsApp redraw alert to patient and nurse ward"
                          >
                            <Send className="h-3.5 w-3.5 text-sky-600" />
                            <span>{isNotified ? "Resend Alert" : "Send Alert"}</span>
                          </button>

                          <button
                            onClick={() => onTriggerRedraw && onTriggerRedraw(sample)}
                            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-3.5 py-1.5 text-xs font-black text-white hover:from-sky-500 hover:to-blue-500 transition-all shadow-sm"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Dispatch Redraw</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
