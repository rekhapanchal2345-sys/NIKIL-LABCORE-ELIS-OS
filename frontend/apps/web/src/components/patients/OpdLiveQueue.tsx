"use client";

import React from "react";
import { Users, Clock, CheckCircle2 } from "lucide-react";

export default function OpdLiveQueue() {
  const tokens = [
    { token: "OPD-101", name: "Rajeshwari Devi", uhid: "UHID-2026-1001", dept: "General Medicine & Pathology", status: "IN CONSULTATION" },
    { token: "OPD-102", name: "Aravind Swamy", uhid: "UHID-2026-1002", dept: "Phlebotomy Draw Room 01", status: "WAITING" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Live OPD & Phlebotomy Token Queue</h1>
            <p className="text-xs text-slate-500">Real-time outpatient & sample collection token status</p>
          </div>
        </div>
      </div>

      <div className="mt-4 divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs">
        {tokens.map((t) => (
          <div key={t.token} className="flex items-center justify-between p-3.5 bg-white">
            <div>
              <span className="font-mono font-extrabold text-sky-700 mr-2">{t.token}</span>
              <strong className="text-slate-900">{t.name}</strong>
              <span className="ml-2 font-mono text-slate-500">({t.uhid})</span>
              <div className="text-slate-500 mt-0.5">{t.dept}</div>
            </div>
            <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 font-bold text-emerald-800">
              {t.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
