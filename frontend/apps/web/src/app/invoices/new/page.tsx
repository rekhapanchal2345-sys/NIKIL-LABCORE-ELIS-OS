"use client";

import React from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/dashboardlayout";
import QuickPOSBilling from "@/components/invoices/QuickPOSBilling";
import { ArrowLeft, FileText, Receipt, ShieldCheck, Clock, Zap } from "lucide-react";

export default function NewInvoicePage() {
  return (
    <DashboardLayout title="Counter POS Billing">
      <div className="space-y-6 text-slate-800">
        {/* Navigation Breadcrumb, Station Status & Title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/90 pb-4 bg-white p-5 rounded-2xl border shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/invoices"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 transition-colors"
              title="Return to Invoice Register"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  New Invoice / Counter POS Billing
                </h1>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  Live Desk
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Hospital OPD, Inpatient, Diagnostics, Procedures, and Cashless Insurance Billing with instant receipt tender.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600 text-[11px]">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              <span>Shift: <strong className="text-slate-800">Morning (08:00 - 16:00)</strong></span>
              <span>•</span>
              <span>Station: <strong className="text-slate-800">Counter #1</strong></span>
            </div>

            <Link
              href="/invoices"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              Invoice Register
            </Link>
          </div>
        </div>

        {/* Embedded POS Component */}
        <QuickPOSBilling />
      </div>
    </DashboardLayout>
  );
}
