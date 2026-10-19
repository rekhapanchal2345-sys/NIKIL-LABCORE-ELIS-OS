"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { reportApi } from "@/lib/api";
import { FileText, RefreshCw, AlertCircle, TrendingUp, ShieldCheck, Send, Clock3, AlertTriangle, Timer, CalendarCheck, Gauge, Printer, Eye } from "lucide-react";
import ReportFilters from "@/components/reports/ReportFilters";
import ReportAnalyticsCards from "@/components/reports/ReportAnalyticsCards";
import ReportsManagementTable from "@/components/reports/ReportsManagementTable";
import LabPerformanceAnalytics from "@/components/reports/LabPerformanceAnalytics";

interface PublishedResult {
  id: string;
  status: string;
  publishedAt: string;
  createdAt?: string;
  criticalFlag?: boolean;
  test: {
    id: string;
    testName: string;
    testCode: string;
    sampleType: string;
  };
  order: {
    id: string;
    orderNumber: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      uhid: string;
      phone?: string;
    };
    doctor?: {
      id: string;
      fullName: string;
    } | null;
  };
  approvedBy?: {
    id: string;
    fullName: string;
    employeeCode: string;
  } | null;
  deliveryStatus: string;
  deliveryMethod: string | null;
  reportReferenceId: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<PublishedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"reports" | "analytics" | "print-studio">("reports");
  
  // Filter states
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [verificationFilter, setVerificationFilter] = useState<"all" | "verified" | "watch">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [doctor, setDoctor] = useState("");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [deliveryChannel, setDeliveryChannel] = useState("");
  const [slaBreach, setSlaBreach] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (status) queryParams.append("status", status);
      if (dateFrom) queryParams.append("fromDate", dateFrom);
      if (dateTo) queryParams.append("toDate", dateTo);
      
      const response = await reportApi.getPublishedReports(`?${queryParams.toString()}`);
      
      if (response.success && response.data) {
        setReports(response.data.results || []);
      } else {
        setError(response.message || "Failed to fetch reports");
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [status, dateFrom, dateTo]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleViewReport = (orderId: string) => {
    if (!orderId) {
      setError("This report is missing its order reference, so it cannot be opened.");
      return;
    }
    router.push(`/reports/order/${encodeURIComponent(orderId)}?action=view`);
  };

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const doctorMatches = !doctor || report.order.doctor?.id === doctor;
      const channelText = `${report.deliveryMethod || ""} ${report.deliveryStatus || ""}`.toUpperCase();
      const channelMatches = !deliveryChannel || channelText.includes(deliveryChannel) || (deliveryChannel === "PHYSICAL" && channelText.includes("HARD_COPY"));
      const criticalMatches = !criticalOnly || Boolean((report as PublishedResult & { criticalFlag?: boolean }).criticalFlag) || report.status.toUpperCase().includes("CRITICAL") || report.status.toUpperCase().includes("PANIC");
      const tatHours = report.createdAt && report.publishedAt ? (new Date(report.publishedAt).getTime() - new Date(report.createdAt).getTime()) / 3600000 : 0;
      const slaMatches = !slaBreach || tatHours > 24;
      if (!doctorMatches || !channelMatches || !criticalMatches || !slaMatches) return false;
      const verified =
        Boolean(report.approvedBy) ||
        ["APPROVED", "PUBLISHED", "VERIFIED", "COMPLETED"].includes(report.status.toUpperCase());
      if (verificationFilter === "verified" && !verified) return false;
      if (verificationFilter === "watch" && verified) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        const patientName = `${report.order.patient.firstName} ${report.order.patient.lastName}`.toLowerCase();
        const orderNumber = report.order.orderNumber.toLowerCase();
        const testName = report.test.testName.toLowerCase();
        const reportRef = report.reportReferenceId?.toLowerCase() || "";
        
        return patientName.includes(searchLower) || 
               orderNumber.includes(searchLower) || 
               testName.includes(searchLower) ||
               reportRef.includes(searchLower);
      }
      return true;
    });
  }, [reports, search, verificationFilter, doctor, criticalOnly, deliveryChannel, slaBreach]);

  const doctors = useMemo(() => {
    const unique = new Map<string, string>();
    reports.forEach((report) => {
      if (report.order.doctor?.id) unique.set(report.order.doctor.id, report.order.doctor.fullName);
    });
    return Array.from(unique, ([id, name]) => ({ id, name }));
  }, [reports]);

  const tableReports = useMemo(
    () =>
      filteredReports.map((report) => ({
        ...report,
        orderId: report.order.id,
        testId: report.test.id,
        order: {
          ...report.order,
          doctor: report.order.doctor ?? undefined,
        },
        approvedBy: report.approvedBy ?? undefined,
      })),
    [filteredReports]
  );

  const criticalResultsPending = filteredReports.filter((report) => {
    const statusText = report.status.toUpperCase();
    return Boolean(report.criticalFlag) ||
      statusText.includes("CRITICAL") ||
      statusText.includes("PANIC") ||
      (statusText === "PENDING" && report.deliveryStatus === "UNDELIVERED");
  }).length;

  const tatHours = filteredReports
    .map((report) => {
      if (!report.createdAt || !report.publishedAt) return null;
      const hours = (new Date(report.publishedAt).getTime() - new Date(report.createdAt).getTime()) / 3600000;
      return Number.isFinite(hours) && hours >= 0 ? hours : null;
    })
    .filter((hours): hours is number => hours !== null);
  const averageTat = tatHours.length ? tatHours.reduce((sum, hours) => sum + hours, 0) / tatHours.length : null;
  // Reports published today (based on each report's publishedAt date)
  const completedToday = filteredReports.filter((report) => {
    if (!report.publishedAt) return false;
    const published = new Date(report.publishedAt);
    const now = new Date();
    return (
      published.getFullYear() === now.getFullYear() &&
      published.getMonth() === now.getMonth() &&
      published.getDate() === now.getDate()
    );
  }).length;

  // Percentage of reports delivered within the 24h SLA window
  const withinTimePct = filteredReports.length
    ? Math.round(
        (filteredReports.filter((report) => {
          if (!report.createdAt || !report.publishedAt) return true; // no timing data counts as on-time
          const hours = (new Date(report.publishedAt).getTime() - new Date(report.createdAt).getTime()) / 3600000;
          return hours >= 0 && hours <= 24;
        }).length / filteredReports.length) * 100
      )
    : null;

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-sm">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">
                    Diagnostic Reports &amp; Clinical Dispatch
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
                    <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                    NABL ISO 15189:2022
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dual-signoff verification queue, digital dispatch, delivery tracking, and clinical report management.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Live Clinical Dispatch Sync
            </span>

            <button
              onClick={() => setActiveTab("print-studio")}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:from-sky-500 hover:to-indigo-500 transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>A4 Print Studio</span>
            </button>

            <button
              onClick={fetchReports}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-cyan-400" : "text-cyan-400"}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/90 p-1.5 text-xs font-semibold scrollbar-none gap-1.5">
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl transition-all ${
              activeTab === "reports"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-md shadow-cyan-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Reports Worklist</span>
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "reports" ? "bg-white/20 text-white" : "border border-slate-800 bg-slate-900 text-slate-400"
              }`}
            >
              {reports.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl transition-all ${
              activeTab === "analytics"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-md shadow-cyan-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Performance Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab("print-studio")}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl transition-all ${
              activeTab === "print-studio"
                ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold shadow-md shadow-sky-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent"
            }`}
          >
            <Printer className="h-4 w-4 text-sky-400" />
            <span>A4 Master Print Studio</span>
            <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-extrabold uppercase">
              Full A4 Ready
            </span>
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/30 p-4 text-rose-300">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="h-4 w-4 text-rose-400" />
              <span>System Error</span>
            </div>
            <p className="mt-1 text-xs text-rose-300/80">{error}</p>
          </div>
        )}

        {activeTab === "print-studio" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/10 text-sky-400 shadow-sm">
                  <Printer className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">Full A4 Master Hospital, Lab &amp; Clinic Report &amp; Print Studio</h2>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                      ● 210mm × 297mm Ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    9-Column Master LOINC &amp; Delta Table • 4-Zone Chain-of-Custody • Dual-Signoff Verified
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <a
                  href="/reports.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 transition shadow-sm"
                >
                  <Eye className="h-3.5 w-3.5 text-sky-400" />
                  <span>Open Fullscreen Studio</span>
                </a>
              </div>
            </div>
            <div className="w-full bg-white rounded-2xl overflow-hidden border border-slate-800 shadow-2xl" style={{ height: "calc(100vh - 240px)", minHeight: "850px" }}>
              <iframe
                src="/reports.html"
                className="w-full h-full border-0"
                title="LabCore ELIS OS Report &amp; Print Studio"
              />
            </div>
          </div>
        ) : activeTab === "reports" ? (
          <>
            {/* Diagnostic Analytics Summary Cards */}
            <ReportAnalyticsCards />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
              {[
                { label: "Completed today", value: completedToday, icon: CalendarCheck, border: "border-l-indigo-500", iconColor: "text-indigo-400" },
                { label: "Verified reports", value: filteredReports.filter(r => Boolean(r.approvedBy) || ["APPROVED", "PUBLISHED", "VERIFIED", "COMPLETED"].includes(r.status.toUpperCase())).length, icon: ShieldCheck, border: "border-l-emerald-500", iconColor: "text-emerald-400" },
                { label: "Digital dispatch", value: filteredReports.filter(r => r.deliveryStatus === "WHATSAPP_DELIVERED" || r.deliveryStatus === "EMAIL_DELIVERED").length, icon: Send, border: "border-l-cyan-500", iconColor: "text-cyan-400" },
                { label: "Delivery watch", value: filteredReports.filter(r => r.deliveryStatus === "UNDELIVERED").length, icon: Clock3, border: "border-l-rose-500", iconColor: "text-rose-400" },
                { label: "Critical pending", value: criticalResultsPending, icon: AlertTriangle, border: "border-l-amber-500", iconColor: "text-amber-400" },
                { label: "Average TAT", value: averageTat === null ? "—" : `${averageTat.toFixed(1)}h`, icon: Timer, border: "border-l-violet-500", iconColor: "text-violet-400" },
                { label: "Within-time %", value: withinTimePct === null ? "—" : `${withinTimePct}%`, icon: Gauge, border: "border-l-orange-500", iconColor: "text-orange-400" },
              ].map(({ label, value, icon: Icon, border, iconColor }) => (
                <div
                  key={label}
                  className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl transition hover:bg-slate-900/60 border-l-4 ${border}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                  </div>
                  <p className="mt-2 text-2xl font-black text-white font-mono">{value}</p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {label === "Completed today"
                      ? "Published today"
                      : label === "Average TAT"
                      ? "Created to published"
                      : label === "Critical pending"
                      ? "Priority review"
                      : label === "Within-time %"
                      ? "Within 24h SLA"
                      : "Live queue count"}
                  </p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <ReportFilters
              search={search}
              reportType=""
              status={status}
              dateFrom={dateFrom}
              dateTo={dateTo}
              doctor={doctor}
              criticalOnly={criticalOnly}
              deliveryChannel={deliveryChannel}
              slaBreach={slaBreach}
              doctors={doctors}
              onSearchChange={setSearch}
              onReportTypeChange={() => {}}
              onStatusChange={setStatus}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              onDoctorChange={setDoctor}
              onCriticalOnlyChange={setCriticalOnly}
              onDeliveryChannelChange={setDeliveryChannel}
              onSlaBreachChange={setSlaBreach}
              onReset={() => {
                setSearch("");
                setStatus("");
                setDateFrom("");
                setDateTo("");
                setVerificationFilter("all");
                setDoctor("");
                setCriticalOnly(false);
                setDeliveryChannel("");
                setSlaBreach(false);
              }}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/90 p-3 shadow-xl">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Verification view</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all" as const, label: `All reports (${reports.length})` },
                  { value: "verified" as const, label: `Verified (${reports.filter(r => Boolean(r.approvedBy) || ["APPROVED", "PUBLISHED", "VERIFIED", "COMPLETED"].includes(r.status.toUpperCase())).length})` },
                  { value: "watch" as const, label: `Verification watch (${reports.filter(r => !r.approvedBy && !["APPROVED", "PUBLISHED", "VERIFIED", "COMPLETED"].includes(r.status.toUpperCase())).length})` },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setVerificationFilter(filter.value)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      verificationFilter === filter.value
                        ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30"
                        : "border border-slate-800 bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Reports Management Table */}
            <ReportsManagementTable
              reports={tableReports}
              loading={loading}
              onViewReport={handleViewReport}
              onRefresh={fetchReports}
            />
          </>
        ) : (
          <LabPerformanceAnalytics />
        )}
      </div>
    </DashboardLayout>
  );
}
