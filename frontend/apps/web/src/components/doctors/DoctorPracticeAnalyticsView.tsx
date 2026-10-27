"use client";

import React from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  DollarSign,
  Activity,
  Award,
  CheckCircle2,
  PieChart,
  Calendar,
} from "lucide-react";

export default function DoctorPracticeAnalyticsView() {
  const departmentBreakdown = [
    { department: "General Medicine & Diabetology", consultations: 342, percentage: 38, revenue: "₹3,42,000" },
    { department: "Cardiology & Vascular Care", consultations: 215, percentage: 24, revenue: "₹2,79,500" },
    { department: "Pulmonology & Critical Care", consultations: 148, percentage: 16, revenue: "₹1,92,400" },
    { department: "Pediatrics & Child Health", consultations: 124, percentage: 14, revenue: "₹1,11,600" },
    { department: "Pathology & Diagnostics", consultations: 72, percentage: 8, revenue: "₹72,000" },
  ];

  const topDiagnoses = [
    { name: "Essential Hypertension (I10)", cases: 184, trend: "+8%" },
    { name: "Type 2 Diabetes Mellitus (E11.9)", cases: 162, trend: "+12%" },
    { name: "Acute Viral Bronchitis / URTI (J06.9)", cases: 98, trend: "+4%" },
    { name: "Gastro-Esophageal Reflux Disease (K21.9)", cases: 76, trend: "-2%" },
    { name: "Dengue Fever / Thrombocytopenia (A90)", cases: 48, trend: "+22%" },
  ];

  const topInvestigationsOrdered = [
    { test: "Complete Blood Count (CBC + ESR)", count: 482, department: "Hematology" },
    { test: "Glycated Hemoglobin (HbA1c) & Fasting Glucose", count: 326, department: "Biochemistry" },
    { test: "Liver Function Test (LFT 11 Parameters)", count: 248, department: "Biochemistry" },
    { test: "Lipid Profile Comprehensive", count: 214, department: "Biochemistry" },
    { test: "Kidney Function Test (KFT / RFT)", count: 198, department: "Biochemistry" },
    { test: "Thyroid Profile Total (T3, T4, TSH)", count: 176, department: "Biochemistry" },
  ];

  return (
    <div className="space-y-4">
      
      {/* ── KPI Metrics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Monthly Consultations</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">901</span>
            <span className="text-xs text-emerald-600 font-bold">↑ +14.2% MoM</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all outpatient OPD chambers</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Average Consultation Time</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">12.4 min</span>
            <span className="text-xs text-sky-700 font-medium">Optimal Standard</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Target range: 10 - 15 minutes</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Pathologist TAT Performance</span>
            <Award className="w-4 h-4 text-teal-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-800">38 mins</span>
            <span className="text-xs text-emerald-600 font-bold">96.8% under SLA</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">SLA Benchmark: 60 minutes</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Patient Return / Follow-up Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">86.4%</span>
            <span className="text-xs text-emerald-600 font-bold">Excellent adherence</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Chronic disease compliance</p>
        </div>

      </div>

      {/* ── Two Column Charts & Matrices ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Department Consultation & Revenue Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-sky-600" />
              <span>Department Consultation & Billing Matrix</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">Current Month</span>
          </div>

          <div className="space-y-3">
            {departmentBreakdown.map((dept) => (
              <div key={dept.department} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{dept.department}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 font-semibold">{dept.consultations} cases</span>
                    <strong className="font-mono text-slate-900">{dept.revenue}</strong>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-600 rounded-full transition-all"
                    style={{ width: `${dept.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Diagnoses Observed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Top Clinical Diagnoses (ICD-10 Distribution)</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">Last 30 Days</span>
          </div>

          <div className="space-y-2.5">
            {topDiagnoses.map((diag, idx) => (
              <div
                key={diag.name}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-800">{diag.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">{diag.cases} patients</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      diag.trend.startsWith("+")
                        ? "bg-rose-50 text-rose-700"
                        : "bg-teal-50 text-teal-700"
                    }`}
                  >
                    {diag.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Top Diagnostic Investigations Ordered (CPOE) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-sky-600" />
          <span>Most Frequently Ordered Diagnostic Laboratory Tests (CPOE)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {topInvestigationsOrdered.map((inv) => (
            <div
              key={inv.test}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                  {inv.department}
                </span>
                <span className="font-mono font-black text-slate-900 text-sm">{inv.count} orders</span>
              </div>
              <p className="font-bold text-slate-800 line-clamp-1">{inv.test}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
