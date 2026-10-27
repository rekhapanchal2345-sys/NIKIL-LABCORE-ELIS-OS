"use client";

import React, { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import DiagnosticInvestigationStudio from "@/components/orders/DiagnosticInvestigationStudio";
import { ArrowLeft, Loader2 } from "lucide-react";

function StudioLoading() {
  return (
    <div className="min-h-[600px] bg-white flex flex-col items-center justify-center text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-2" />
      <p className="text-xs font-semibold tracking-wider uppercase text-slate-600">
        Loading Diagnostic Investigation Studio...
      </p>
    </div>
  );
}

export default function OrderInvestigationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = typeof params?.id === "string" ? params.id : undefined;

  return (
    <ProtectedRoute>
      <DashboardLayout title="Investigation Studio">
        <div className="space-y-3 pb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/orders")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Orders Worklist
            </button>
            <div className="text-[11px] font-mono text-slate-500">
              Requisition ID: <strong className="text-slate-800">{orderId}</strong>
            </div>
          </div>

          <Suspense fallback={<StudioLoading />}>
            <DiagnosticInvestigationStudio initialOrderId={orderId} />
          </Suspense>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
