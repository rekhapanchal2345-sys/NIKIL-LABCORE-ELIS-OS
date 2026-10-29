"use client";

import React from "react";
import { MessageSquare, Mail, Phone } from "lucide-react";

export default function PatientCommunicationCenter({
  patient,
}: {
  patient: any;
  standalone?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Patient Clinical Communication Log — {patient?.firstName} {patient?.lastName}
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-500">{patient?.phone || "+91 98250 11223"}</span>
      </div>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp Dispatch
          </div>
          <p className="text-slate-500 mt-1">Registration & receipt notifications enabled.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-sky-600" /> Email Reports
          </div>
          <p className="text-slate-500 mt-1">{patient?.email || "Verified email delivery channel"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-indigo-600" /> SMS Alerts
          </div>
          <p className="text-slate-500 mt-1">Critical value & token queue SMS active.</p>
        </div>
      </div>
    </div>
  );
}
