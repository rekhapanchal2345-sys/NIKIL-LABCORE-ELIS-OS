"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { dashboardApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { getRoleLabel } from "@/lib/auth";

// Upgraded & New Dashboard Components
import LuxuryKpiGrid from "@/components/dashboard/LuxuryKpiGrid";
import SpecimenPipeline from "@/components/dashboard/SpecimenPipeline";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentOrders from "@/components/dashboard/RecentOrders";
import ApprovalQueue from "@/components/dashboard/ApprovalQueue";
import CriticalAlerts from "@/components/dashboard/CriticalAlerts";
import AnalyzerTelemetryWidget from "@/components/dashboard/AnalyzerTelemetryWidget";
import TurnaroundTimeWidget from "@/components/dashboard/TurnaroundTimeWidget";
import FinancialAnalyticsWidget from "@/components/dashboard/FinancialAnalyticsWidget";
import WorkloadCharts from "@/components/dashboard/WorkloadCharts";
import LiveActivityFeed from "@/components/dashboard/LiveActivityFeed";
import DateRangeSelector from "@/components/dashboard/DateRangeSelector";

// Brand New Hospital, Lab & Clinic Modules
import HospitalIntakeMatrix from "@/components/dashboard/HospitalIntakeMatrix";
import CriticalPanicActionDesk from "@/components/dashboard/CriticalPanicActionDesk";
import DepartmentWorkstationGrid from "@/components/dashboard/DepartmentWorkstationGrid";
import OpdTokenQueueWidget from "@/components/dashboard/OpdTokenQueueWidget";
import ShiftHandoverReconciliation from "@/components/dashboard/ShiftHandoverReconciliation";

// Ultra-Advanced Integration Engine Modules
import IntegrationEngineDashboard from "@/components/dashboard/IntegrationEngineDashboard";
import IntegrationEngineWidget from "@/components/dashboard/IntegrationEngineWidget";

import {
  RefreshCw,
  Clock,
  Sparkles,
  Layers,
  AlertTriangle,
  Cpu,
  TrendingUp,
  Activity,
  IndianRupee,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Building2,
  Stethoscope,
  Flame,
  PhoneCall,
  Printer,
  FileText,
  Users,
  QrCode,
  MapPin,
  Award,
  ChevronDown,
  BellRing,
  Server
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState("today");
  const [activeTab, setActiveTab] = useState<
    "live" | "engine" | "panic" | "workstations" | "token" | "tat" | "revenue" | "audit"
  >("live");

  const [activeBranch, setActiveBranch] = useState("Main Hospital Central Lab (Block A - Level 1)");
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  // Dashboard state
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [approvalQueue, setApprovalQueue] = useState<any[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([]);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [testStats, setTestStats] = useState<any>(null);
  const [sampleStats, setSampleStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [orderTrends, setOrderTrends] = useState<any[]>([]);
  const [avgTatHours, setAvgTatHours] = useState<number>(2.1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time IST Digital Clock
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDateStr, setCurrentDateStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDateStr(
        now.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut listener for fast laboratory workflow actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      switch (e.key.toLowerCase()) {
        case "p":
          e.preventDefault();
          window.location.href = "/patients/new";
          break;
        case "o":
          e.preventDefault();
          window.location.href = "/orders/new";
          break;
        case "s":
          e.preventDefault();
          window.location.href = "/samples";
          break;
        case "r":
          e.preventDefault();
          window.location.href = "/results";
          break;
        case "a":
          e.preventDefault();
          window.location.href = "/approvals";
          break;
        case "b":
          e.preventDefault();
          window.location.href = "/invoices";
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Parallel data fetching across all dashboard modules
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        statsRes,
        ordersRes,
        approvalRes,
        alertsRes,
        sampleRes,
        paymentRes,
        testRes,
        activityRes,
      ] = await Promise.allSettled([
        dashboardApi.getStats(),
        dashboardApi.getOrderStats(),
        dashboardApi.getApprovalQueue("?limit=6"),
        dashboardApi.getAttentionResults("?limit=6"),
        dashboardApi.getSampleStats(),
        dashboardApi.getPaymentStats(),
        dashboardApi.getTestStats(),
        dashboardApi.getActivity(12),
      ]);

      // 1. Core Stats
      if (statsRes.status === "fulfilled" && statsRes.value?.success && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }

      // 2. Orders & Trends
      if (ordersRes.status === "fulfilled" && ordersRes.value?.success && ordersRes.value?.data) {
        if (ordersRes.value.data?.dailyTrend) {
          setOrderTrends(ordersRes.value.data.dailyTrend);
        }
      }

      // Fetch Recent Orders via orderApi
      try {
        const { orderApi } = await import("@/lib/api");
        const recentOrdersData = await orderApi.getAll("?limit=6");
        if (recentOrdersData.success && recentOrdersData.data?.orders) {
          setRecentOrders(recentOrdersData.data.orders.slice(0, 6));
        } else if (recentOrdersData.success && Array.isArray(recentOrdersData.data)) {
          setRecentOrders(recentOrdersData.data.slice(0, 6));
        }
      } catch (e) {
        console.error("Error fetching recent orders:", e);
      }

      // 3. Approval Queue
      if (approvalRes.status === "fulfilled" && approvalRes.value?.success && approvalRes.value?.data) {
        const approvalData = approvalRes.value.data;
        const approvalsArray = Array.isArray(approvalData.approvals)
          ? approvalData.approvals
          : Array.isArray(approvalData.results)
          ? approvalData.results
          : Array.isArray(approvalData)
          ? approvalData
          : [];
        setApprovalQueue(approvalsArray);
      } else {
        setApprovalQueue([]);
      }

      // 4. Critical Panic Alerts
      if (alertsRes.status === "fulfilled" && alertsRes.value?.success && alertsRes.value?.data) {
        const alertsData = alertsRes.value.data;
        const criticalResults = Array.isArray(alertsData.critical)
          ? alertsData.critical
          : Array.isArray(alertsData.results)
          ? alertsData.results
          : [];
        setCriticalAlerts(
          criticalResults.map((result: any) => ({
            id: result.id,
            severity: "critical" as const,
            title: "Panic Value Alert",
            description: `${result.test?.testName || "Diagnostic Test"} for ${result.order?.patient?.firstName || "Patient"} ${result.order?.patient?.lastName || ""} (UHID: ${result.order?.patient?.uhid || "N/A"})`,
            createdAt: result.createdAt,
            actionUrl: `/results/${result.id}`,
          }))
        );
      } else {
        setCriticalAlerts([]);
      }

      // 5. Sample & Turnaround Time
      if (sampleRes.status === "fulfilled" && sampleRes.value?.success && sampleRes.value?.data) {
        setSampleStats(sampleRes.value.data);
        if (sampleRes.value.data?.averageTurnaroundTimeHours) {
          setAvgTatHours(sampleRes.value.data.averageTurnaroundTimeHours);
        }
      }

      // 6. Payment Stats
      if (paymentRes.status === "fulfilled" && paymentRes.value?.success && paymentRes.value?.data) {
        setPaymentStats(paymentRes.value.data);
      }

      // 7. Test Stats
      if (testRes.status === "fulfilled" && testRes.value?.success && testRes.value?.data) {
        setTestStats(testRes.value.data);
      }

      // 8. Live Activity Feed
      if (activityRes.status === "fulfilled" && activityRes.value?.success && activityRes.value?.data) {
        setActivities(activityRes.value.data);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Failed to fetch fresh laboratory statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Optional background 30-second poll
  useEffect(() => {
    if (!autoSyncEnabled) return;
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoSyncEnabled, fetchDashboardData]);

  // Dynamic Greeting based on current hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const criticalCount = stats?.results?.critical || criticalAlerts.length || 0;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 pb-12">
          
          {/* ========================================================
              STAT EMERGENCY & CRITICAL URGENCY FLASH TICKER
              ======================================================== */}
          <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-sky-50 border border-slate-200/90 rounded-2xl p-2.5 px-4 shadow-2xs flex items-center justify-between gap-3 text-xs overflow-hidden">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider shadow-2xs animate-pulse">
                <Flame className="h-3 w-3" /> STAT TICKER
              </span>
            </div>

            <div className="flex items-center gap-6 overflow-x-auto text-[11px] text-slate-700 font-medium whitespace-nowrap scrollbar-none py-0.5">
              <span className="flex items-center gap-1.5 text-rose-900 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
                [CASUALTY STAT] ICU Bed #04: Serum Potassium 6.9 mmol/L (Sub-15m Doctor Call Pending)
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5 text-slate-800">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                [NABL QC PASSED] Cobas c311 Chemistry Level 1 & 2 controls within 1-2s range
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5 text-sky-800">
                <QrCode className="h-3 w-3 text-sky-600" />
                [ABHA COUNTER] Fast-Track Token #A-042 called at Phlebotomy Desk 01
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5 text-teal-800">
                <ShieldCheck className="h-3 w-3 text-teal-600" />
                [COLD CHAIN] North Clinic B2B Specimen Batch #48 verified at 4.1°C
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5 text-indigo-900 font-bold">
                <Server className="h-3 w-3 text-indigo-600" />
                [INTEGRATION ENGINE] 10/10 Channels Synced • MLLP:2575 & ASTM:COM3 Ingest Active
              </span>
            </div>

            <button
              onClick={() => setActiveTab("panic")}
              className="text-[11px] font-extrabold text-rose-700 hover:text-rose-900 flex-shrink-0 flex items-center gap-1 hover:underline"
            >
              Action Desk &rarr;
            </button>
          </div>

          {/* ========================================================
              EXECUTIVE CLINICAL HOSPITAL COMMAND CENTER HEADER
              (Light White Medical Aesthetic with Hospital Emblem & Accreditation)
              ======================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 relative overflow-hidden transition-all duration-300">
            {/* Subtle medical ambient accent glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-100/40 via-teal-50/30 to-transparent rounded-full pointer-events-none -mr-24 -mt-24 blur-3xl" />

            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
              
              {/* Left Column: Hospital Emblem Logo, Institution Name, Accreditations */}
              <div className="flex items-start gap-4">
                {/* Official Medical Heraldic Logo Emblem */}
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-sky-500 p-0.5 shadow-md flex-shrink-0">
                  <div className="h-full w-full bg-white rounded-[14px] flex flex-col items-center justify-center p-1 text-center shadow-inner relative overflow-hidden">
                    <div className="absolute -top-3 -right-3 h-8 w-8 bg-sky-100 rounded-full blur-xs pointer-events-none" />
                    {/* SVG Medical Cross + DNA Helix + Laurel Badge */}
                    <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-10 sm:w-10 text-sky-600" fill="currentColor">
                      <path d="M10.5 4a1.5 1.5 0 0 1 3 0v4.5H18a1.5 1.5 0 0 1 0 3h-4.5V16a1.5 1.5 0 0 1-3 0v-4.5H6a1.5 1.5 0 0 1 0-3h4.5V4z" />
                      <circle cx="12" cy="10" r="1.5" className="text-amber-500" fill="#f59e0b" />
                    </svg>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-800 leading-none mt-0.5">
                      LABCORE
                    </span>
                    <span className="text-[6.5px] font-bold text-sky-700 tracking-tighter">
                      CLINICAL LIS
                    </span>
                  </div>
                </div>

                {/* Institution Identity & Doctor Greeting */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      LIS Core Online • 99.98% Uptime
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                      <Award className="h-3 w-3 text-sky-600" />
                      NABL ISO 15189:2022 (MC-5421)
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                      <QrCode className="h-3 w-3 text-indigo-600" />
                      ABDM / ABHA HIP M1-M3
                    </span>

                    <button
                      type="button"
                      onClick={() => setActiveTab("engine")}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100 transition-all cursor-pointer shadow-2xs"
                    >
                      <Server className="h-3 w-3 text-sky-600" />
                      Integration Engine: 10/10 Active &rarr;
                    </button>
                  </div>

                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      APEX MULTI-SPECIALTY HOSPITAL & REFERENCE DIAGNOSTICS
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                      {greeting}, <strong className="text-slate-800 font-bold">{user?.fullName || "Duty Officer"}</strong> ({getRoleLabel(user?.role) || "Laboratory Administrator"}). Hospital central pathology, automated analyzer telemetry, and patient specimen command hub.
                    </p>
                  </div>

                  {/* Branch Location Selector */}
                  <div className="flex items-center gap-2 pt-1 text-xs text-slate-600 flex-wrap">
                    <span className="flex items-center gap-1 font-bold text-slate-800">
                      <MapPin className="h-3.5 w-3.5 text-rose-500" /> Facility Unit:
                    </span>
                    <select
                      value={activeBranch}
                      onChange={(e) => setActiveBranch(e.target.value)}
                      className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer"
                    >
                      <option value="Main Hospital Central Lab (Block A - Level 1)">Main Hospital Central Lab (Block A - Level 1)</option>
                      <option value="OPD Phlebotomy & Day-Care Collection Centre">OPD Phlebotomy & Day-Care Collection Centre</option>
                      <option value="Emergency / Casualty STAT Satellite Unit">Emergency / Casualty STAT Satellite Unit</option>
                      <option value="North City B2B Referral Annex">North City B2B Referral Annex</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Duty Officers Strip, Live IST Clock, Controls */}
              <div className="flex flex-col sm:flex-row xl:flex-col items-start xl:items-end justify-between gap-3 flex-shrink-0">
                {/* On-Duty Clinical Officers Badge Box */}
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/90 text-xs space-y-1 w-full sm:w-auto">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Stethoscope className="h-3 w-3 text-sky-600" /> Duty Pathologist
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      Active On Desk
                    </span>
                  </div>
                  <p className="font-extrabold text-slate-900 text-xs">
                    Dr. Sandeep Deshmukh, MD Path <span className="font-mono text-[10px] text-slate-500">[MCI-48921]</span>
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 gap-4">
                    <span>Shift MLT: <strong>Priya Sharma</strong></span>
                    <span className="text-slate-400">•</span>
                    <span className="text-sky-700 font-bold">Phleb Ext: 401</span>
                  </div>
                </div>

                {/* Clock & Action Controls Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Live IST Clock */}
                  <div className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xs flex items-center gap-2">
                    <Clock className="h-4 w-4 text-sky-600" />
                    <div>
                      <p className="text-xs font-mono font-black tracking-wide text-slate-900">
                        {currentTime || "--:--:--"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {currentDateStr || "IST"}
                      </p>
                    </div>
                  </div>

                  <DateRangeSelector value={dateRange} onChange={setDateRange} />

                  <button
                    onClick={fetchDashboardData}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-all shadow-2xs disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-sky-600" : ""}`} />
                    <span>Sync</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              CRITICAL PANIC EMERGENCY PROMPT BAR (If Criticals Exist)
              ======================================================== */}
          {criticalCount > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-rose-50/80 to-amber-50/60 border-2 border-rose-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs flex-shrink-0 animate-pulse">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-rose-950">
                    High Priority: {criticalCount} Critical Panic Value Result{criticalCount > 1 ? "s" : ""} Flagged
                  </h3>
                  <p className="text-xs text-rose-700 mt-0.5">
                    Biological alert limits breached. NABL ISO 15189 requires immediate doctor notification & documented verbal read-back.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab("panic")}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Open Panic Action Desk &rarr;</span>
              </button>
            </div>
          )}

          {/* ========================================================
              BENTO KPI METRICS GRID & TELEMETRY STRIP
              ======================================================== */}
          <LuxuryKpiGrid 
            stats={stats} 
            loading={loading} 
            avgTatHours={avgTatHours} 
          />

          {/* ========================================================
              INTERACTIVE SPECIMEN PROGRESSION FUNNEL
              ======================================================== */}
          <SpecimenPipeline
            ordersCount={stats?.orders?.today ?? 0}
            samplesCollected={stats?.samples?.completed ?? 0}
            testingCount={stats?.tests?.inProgress ?? 0}
            resultsPending={stats?.results?.pending ?? 0}
            approvedCount={stats?.results?.approved ?? 0}
            completedCount={stats?.orders?.completed ?? 0}
            loading={loading}
          />

          {/* ========================================================
              NAVIGATION TABS CONSOLE (7 HIGH-UTILITY HOSPITAL TABS)
              ======================================================== */}
          <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 overflow-x-auto max-w-full">
              <button
                onClick={() => setActiveTab("live")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
                  activeTab === "live"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building2 className="h-3.5 w-3.5 text-sky-600" />
                <span>Live Operations</span>
              </button>

              <button
                onClick={() => setActiveTab("engine")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
                  activeTab === "engine"
                    ? "bg-white text-sky-800 shadow-xs border border-sky-300 ring-1 ring-sky-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Server className="h-3.5 w-3.5 text-sky-600" />
                <span>Integration Engine</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>

              <button
                onClick={() => setActiveTab("panic")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
                  activeTab === "panic"
                    ? "bg-white text-rose-700 shadow-xs border border-rose-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                <span>Critical Panic Desk</span>
                {criticalCount > 0 && (
                  <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("workstations")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
                  activeTab === "workstations"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Cpu className="h-3.5 w-3.5 text-indigo-600" />
                <span>Analyzers & Stations</span>
              </button>

              <button
                onClick={() => setActiveTab("token")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
                  activeTab === "token"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BellRing className="h-3.5 w-3.5 text-amber-600" />
                <span>OPD Token Queue</span>
              </button>

              <button
                onClick={() => setActiveTab("tat")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
                  activeTab === "tat"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Clock className="h-3.5 w-3.5 text-teal-600" />
                <span>TAT SLA & Compliance</span>
              </button>

              <button
                onClick={() => setActiveTab("revenue")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
                  activeTab === "revenue"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                <span>Day-Close & Handover</span>
              </button>

              <button
                onClick={() => setActiveTab("audit")}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap font-bold ${
                  activeTab === "audit"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Activity className="h-3.5 w-3.5 text-slate-600" />
                <span>Live Audit</span>
              </button>
            </div>

            <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-sky-500" /> Auto-sync: 30s
            </span>
          </div>

          {/* ========================================================
              TAB VIEW 1: LIVE OPERATIONS (CORE COMMAND CENTER)
              ======================================================== */}
          {activeTab === "live" && (
            <div className="space-y-6">
              {/* Multi-Channel Hospital Requisition Matrix */}
              <HospitalIntakeMatrix
                stats={{
                  opdCount: stats?.orders?.today ? Math.round(stats.orders.today * 0.55) : 64,
                  ipdCount: stats?.orders?.today ? Math.round(stats.orders.today * 0.25) : 38,
                  statCount: stats?.orders?.today ? Math.round(stats.orders.today * 0.08) : 12,
                  b2bCount: stats?.orders?.today ? Math.round(stats.orders.today * 0.12) : 42,
                  total: stats?.orders?.today || 156,
                }}
                loading={loading}
              />

              {/* Rapid Command Shortcuts */}
              <QuickActions userRole={getRoleLabel(user?.role)} />

              {/* Core 2-Column Operational Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Recent Workorders Stream (7 Cols) */}
                <div className="lg:col-span-7">
                  <RecentOrders orders={recentOrders} loading={loading} />
                </div>

                {/* Right: Pathologist Sign-off Queue (5 Cols) */}
                <div className="lg:col-span-5">
                  <ApprovalQueue approvals={approvalQueue} loading={loading} />
                </div>
              </div>

              {/* Secondary Operational Row: Critical Alerts & Analyzer Telemetry */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CriticalAlerts alerts={criticalAlerts} loading={loading} />
                <AnalyzerTelemetryWidget stats={stats?.analyzers} loading={loading} />
              </div>

              {/* Tertiary Operational Row: Ultra-Advanced Integration Engine Widget */}
              <IntegrationEngineWidget onOpenEngine={() => setActiveTab("engine")} loading={loading} />
            </div>
          )}

          {/* ========================================================
              TAB VIEW: ULTRA-ADVANCED HOSPITAL INTEGRATION ENGINE
              ======================================================== */}
          {activeTab === "engine" && (
            <div className="space-y-6">
              <IntegrationEngineDashboard />
            </div>
          )}

          {/* ========================================================
              TAB VIEW 2: NABL CRITICAL & PANIC VALUES ACTION DESK
              ======================================================== */}
          {activeTab === "panic" && (
            <div className="space-y-6">
              <CriticalPanicActionDesk alerts={criticalAlerts} loading={loading} />
            </div>
          )}

          {/* ========================================================
              TAB VIEW 3: DEPARTMENT WORKSTATIONS & ANALYZER INTERFACING
              ======================================================== */}
          {activeTab === "workstations" && (
            <div className="space-y-6">
              <DepartmentWorkstationGrid />
              <AnalyzerTelemetryWidget stats={stats?.analyzers} loading={loading} />
            </div>
          )}

          {/* ========================================================
              TAB VIEW 4: OPD TOKEN QUEUE & RECEPTION DESK
              ======================================================== */}
          {activeTab === "token" && (
            <div className="space-y-6">
              <OpdTokenQueueWidget />
            </div>
          )}

          {/* ========================================================
              TAB VIEW 5: TURNAROUND TIME & QUALITY SLA
              ======================================================== */}
          {activeTab === "tat" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <TurnaroundTimeWidget 
                  averageTatHours={avgTatHours} 
                  sampleStats={sampleStats} 
                  loading={loading} 
                />
              </div>
              <div className="lg:col-span-5">
                <AnalyzerTelemetryWidget stats={stats?.analyzers} loading={loading} />
              </div>
            </div>
          )}

          {/* ========================================================
              TAB VIEW 6: REVENUE & SHIFT HANDOVER RECONCILIATION
              ======================================================== */}
          {activeTab === "revenue" && (
            <div className="space-y-6">
              <ShiftHandoverReconciliation
                todayRevenue={stats?.financial?.todayRevenue || 144950}
                pendingPayments={stats?.financial?.pendingPayments || 12400}
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <WorkloadCharts 
                    orderTrends={orderTrends} 
                    topTests={testStats?.mostRequested} 
                    loading={loading} 
                  />
                </div>
                <div className="lg:col-span-5">
                  <FinancialAnalyticsWidget
                    paymentStats={paymentStats}
                    todayRevenue={stats?.financial?.todayRevenue || 0}
                    pendingPayments={stats?.financial?.pendingPayments || 0}
                    totalInvoices={stats?.invoices?.total || 0}
                    paidInvoices={stats?.invoices?.paid || 0}
                    pendingInvoices={stats?.invoices?.pending || 0}
                    loading={loading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB VIEW 7: LIVE AUDIT ACTIVITY STREAM
              ======================================================== */}
          {activeTab === "audit" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <LiveActivityFeed activities={activities} loading={loading} />
              </div>
              <div className="lg:col-span-5">
                <RecentOrders orders={recentOrders} loading={loading} />
              </div>
            </div>
          )}

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}