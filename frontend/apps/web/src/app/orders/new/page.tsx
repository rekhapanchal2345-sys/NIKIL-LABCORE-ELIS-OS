"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import RegisterOrderWizard from "@/components/orders/RegisterOrderWizard";
import {
  ArrowLeft,
  FlaskConical,
  ClipboardList,
  Plus,
} from "lucide-react";

export default function NewOrderWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramPatientId = searchParams.get("patientId") || undefined;
  const [wizardOpen, setWizardOpen] = useState(true);

  return (
    <ProtectedRoute>
      <DashboardLayout title="Register New Requisition">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back Navigation */}
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-xs font-bold text-sky-700 hover:text-sky-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Orders Worklist
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Order intake</p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Register a new order
                </h1>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Select the patient, ordering clinician, investigations, collection requirements, priority and payment details before submitting the order.
                </p>
              </div>
            </div>
          </div>

          {/* Re-Open Card if Modal was closed */}
          {!wizardOpen && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                <FlaskConical className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Ready to create a clinical requisition?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  The order form records patient identity, ordering clinician, investigations, specimen requirements and billing information.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWizardOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-[#0284c7] text-white text-xs font-semibold hover:bg-[#0369a1] transition shadow-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Open Requisition Wizard
              </button>
            </div>
          )}

          {/* 6-Step Enterprise Requisition Wizard Modal (Exact RegisterPatientWizard Design, Format & Colours) */}
          <RegisterOrderWizard
            isOpen={wizardOpen}
            preselectedPatientId={paramPatientId}
            onClose={() => {
              setWizardOpen(false);
              router.push("/orders");
            }}
            onSuccess={(created) => {
              router.push("/orders");
            }}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
