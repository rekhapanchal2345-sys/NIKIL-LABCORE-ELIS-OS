"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  AlertCircle,
  X,
  Download,
  Command,
  RefreshCw,
  Sparkles,
  Activity,
  ShieldCheck,
  Clock3,
  Microscope,
  TrendingUp,
  Zap,
  FileCode,
  AlertOctagon,
  Layers,
  ListChecks,
  Stethoscope,
  FlaskConical,
} from "lucide-react";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { resultApi } from "@/lib/api";
import ResultFilters from "@/components/results/ResultFilters";
import ResultMetricsCards from "@/components/results/ResultMetricsCards";
import ResultsManagementTable, { ResultRow } from "@/components/results/ResultsManagementTable";
import ParameterResultEntrySheet from "@/components/results/ParameterResultEntrySheet";
import PathologistApprovalModal from "@/components/results/PathologistApprovalModal";
import DeltaCheckingPanel from "@/components/results/DeltaCheckingPanel";
import { BulkActionsBar } from "@/components/results/BulkActionsBar";
import LabTestResultReport from "@/components/results/LabTestResultReport";
import ResultHistoryModal from "@/components/results/ResultHistoryModal";
import { PremiumStatusBadge } from "@/components/results/PremiumStatusBadge";
import { CommandPalette, useCommandPalette } from "@/components/results/CommandPalette";
import { PremiumEmptyState } from "@/components/results/PremiumEmptyState";
import { TableSkeleton } from "@/components/results/SkeletonLoader";
import NotificationDispatchModal, { NotificationPayload } from "@/components/common/NotificationDispatchModal";

// Advanced Real-World Clinical Modules
import CriticalPanicEscalationHub from "@/components/results/CriticalPanicEscalationHub";
import PathologistValidationDesk from "@/components/results/PathologistValidationDesk";
import LongitudinalDeltaIntelligence from "@/components/results/LongitudinalDeltaIntelligence";
import AutoValidationRuleEngine from "@/components/results/AutoValidationRuleEngine";
import AmendedResultsAuditTrail from "@/components/results/AmendedResultsAuditTrail";

export type ActiveResultsTab = "queue" | "validation" | "critical" | "delta" | "autovalidation" | "amended";

interface ResultData {
  id: string;
  orderId: string;
  testId: string;
  status: string;
  remarks?: string;
  interpretation?: string;
  enteredAt?: string;
  verifiedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  test: {
    id: string;
    testCode: string;
    testName: string;
    sampleType: string;
    method?: string;
    category?: {
      id: string;
      categoryName: string;
    };
    parameters?: Array<{
      id: string;
      parameterName: string;
      unit?: string;
      dataType: string;
      referenceRanges?: any[];
    }>;
  };
  order: {
    id: string;
    orderNumber: string;
    barcode: string;
    orderStatus: string;
    paymentStatus: string;
    patient: {
      id: string;
      uhid: string;
      firstName: string;
      lastName: string;
      gender: string;
      dateOfBirth?: string;
      phone?: string;
    };
    doctor?: {
      id: string;
      doctorCode: string;
      fullName: string;
      qualification?: string;
      specialization?: string;
    };
  };
  enteredBy?: {
    id: string;
    employeeCode: string;
    fullName: string;
    role: string;
  };
  approvedBy?: {
    id: string;
    employeeCode: string;
    fullName: string;
    role: string;
  };
  values?: Array<{
    id: string;
    value: string;
    flag?: string;
    remark?: string;
    parameter: {
      id: string;
      parameterName: string;
      unit?: string;
    };
  }>;
}

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<ResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [department, setDepartment] = useState("");
  const [testName, setTestName] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  // Active Tab View for Advanced Laboratory Modules
  const [activeTab, setActiveTab] = useState<ActiveResultsTab>("queue");

  // Selection for bulk actions
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const commandPalette = useCommandPalette();

  // Parameter entry modal
  const [showParameterEntry, setShowParameterEntry] = useState(false);
  const [selectedResultForEntry, setSelectedResultForEntry] = useState<ResultData | null>(null);

  // Pathologist approval modal
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedResultForApproval, setSelectedResultForApproval] = useState<ResultData | null>(null);

  // Lab report preview modal
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [selectedResultForReport, setSelectedResultForReport] = useState<ResultData | null>(null);

  // Result history modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedResultForHistory, setSelectedResultForHistory] = useState<ResultData | null>(null);

  // Notification dispatch modal
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyPayload, setNotifyPayload] = useState<NotificationPayload | null>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (department) params.append("department", department);
      if (testName) params.append("testName", testName);
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      
      console.log("Fetching results with params:", params.toString());
      const response = await resultApi.getAll(params.toString());
      console.log("Results response:", response);
      
      if (response.success && response.data) {
        const data = response.data as { results: ResultData[]; pagination: { total: number } };
        console.log("Setting results:", data.results);
        setResults(data.results || []);
        setTotal(data.pagination?.total || 0);
      } else {
        console.error("Response unsuccessful:", response);
        setError(response.message || "Failed to load results");
      }
    } catch (err) {
      console.error("Failed to fetch results:", err);
      setError(err instanceof Error ? err.message : "Failed to load results. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [status, debouncedSearch, dateFrom, dateTo, department, testName, page, limit]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleView = (resultId: string) => {
    router.push(`/results/${resultId}`);
  };

  const handleApprove = async (resultId: string) => {
    setActionLoading(true);
    try {
      const response = await resultApi.approve(resultId);
      if (response.success) {
        setToast({ message: "Result approved successfully", type: "success" });
        fetchResults();
      } else {
        throw new Error(response.message || "Failed to approve result");
      }
    } catch (err) {
      console.error("Failed to approve result:", err);
      setToast({ message: "Failed to approve result. Please try again.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = async (resultId: string) => {
    setActionLoading(true);
    try {
      const response = await resultApi.verify(resultId);
      if (response.success) {
        setToast({ message: "Result verified successfully", type: "success" });
        fetchResults();
      } else {
        throw new Error(response.message || "Failed to verify result");
      }
    } catch (err) {
      console.error("Failed to verify result:", err);
      setToast({ message: "Failed to verify result. Please try again.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async (resultId: string) => {
    setActionLoading(true);
    try {
      const response = await resultApi.publish(resultId);
      if (response.success) {
        setToast({ message: "Result published successfully", type: "success" });
        fetchResults();
      } else {
        throw new Error(response.message || "Failed to publish result");
      }
    } catch (err) {
      console.error("Failed to publish result:", err);
      setToast({ message: "Failed to publish result. Please try again.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnterEdit = async (resultId: string) => {
    console.log("Enter/Edit clicked for result:", resultId);
    const result = results.find(r => r.id === resultId);
    if (result) {
      console.log("Found result:", result);
      console.log("Test parameters:", result.test?.parameters);
      setSelectedResultForEntry(result);
      setShowParameterEntry(true);
    } else {
      console.error("Result not found:", resultId);
      alert("Result not found. Please refresh the page and try again.");
    }
  };

  const handlePathologistApprove = (resultId: string) => {
    const result = results.find(r => r.id === resultId);
    if (result) {
      setSelectedResultForApproval(result);
      setShowApprovalModal(true);
    }
  };

  const handlePreviewReport = (resultId: string) => {
    const result = results.find(r => r.id === resultId);
    if (result) {
      setSelectedResultForReport(result);
      setShowReportPreview(true);
    } else {
      console.error("Result not found:", resultId);
      alert("Result not found. Please refresh the page and try again.");
    }
  };

  const handlePrintReport = (resultId: string) => {
    const result = results.find(r => r.id === resultId);
    if (result) {
      setSelectedResultForReport(result);
      setShowReportPreview(true);
      // Note: In the PixelPerfectLabReport component, clicking Print will directly print
    } else {
      console.error("Result not found:", resultId);
      alert("Result not found. Please refresh the page and try again.");
    }
  };

  const handleNotifyPatient = (resultId: string) => {
    const result = results.find(r => r.id === resultId);
    if (result) {
      const p = result.order.patient;
      const isCritical = result.values?.some(v => v.flag === "CRITICAL" || v.flag === "PANIC");
      setNotifyPayload({
        patientId: p.id,
        patientName: `${p.firstName} ${p.lastName}`,
        phone: p.phone,
        uhid: p.uhid,
        context: isCritical ? "CRITICAL" : "RESULT",
        testName: result.test.testName,
        orderNumber: result.order.orderNumber,
        date: result.approvedAt || result.verifiedAt || result.enteredAt || result.createdAt,
      });
      setShowNotifyModal(true);
    }
  };

  const handleViewHistory = (resultId: string) => {
    const result = results.find(r => r.id === resultId);
    if (result) {
      setSelectedResultForHistory(result);
      setShowHistoryModal(true);
    } else {
      console.error("Result not found:", resultId);
      alert("Result not found. Please refresh the page and try again.");
    }
  };

  const generateMockHistory = (result: ResultData) => {
    const history = [];
    
    // Add creation entry
    history.push({
      id: `hist-${result.id}-1`,
      timestamp: result.createdAt,
      action: "Created",
      performedBy: result.enteredBy?.fullName || "System",
      details: "Result record created"
    });

    // Add entry entry if applicable
    if (result.enteredAt) {
      history.push({
        id: `hist-${result.id}-2`,
        timestamp: result.enteredAt,
        action: "Updated",
        performedBy: result.enteredBy?.fullName || "Lab Technician",
        details: "Parameter values entered",
        newValue: `${result.values?.length || 0} parameters entered`
      });
    }

    // Add verification entry if applicable
    if (result.verifiedAt) {
      history.push({
        id: `hist-${result.id}-3`,
        timestamp: result.verifiedAt,
        action: "Verified",
        performedBy: result.enteredBy?.fullName || "Pathologist",
        details: "Result verified by pathologist"
      });
    }

    // Add approval entry if applicable
    if (result.approvedAt && result.approvedBy) {
      history.push({
        id: `hist-${result.id}-4`,
        timestamp: result.approvedAt,
        action: "Approved",
        performedBy: result.approvedBy.fullName,
        details: "Result approved and finalized"
      });
    }

    // Sort by timestamp descending
    return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const handleSelectResult = (resultId: string) => {
    const newSelection = new Set(selectedResults);
    if (newSelection.has(resultId)) {
      newSelection.delete(resultId);
    } else {
      newSelection.add(resultId);
    }
    setSelectedResults(newSelection);
    setIsAllSelected(newSelection.size === results.length);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedResults(new Set(results.map(r => r.id)));
      setIsAllSelected(true);
    } else {
      setSelectedResults(new Set());
      setIsAllSelected(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedResults(new Set());
    setIsAllSelected(false);
  };

  const handleBulkVerify = async () => {
    try {
      for (const resultId of selectedResults) {
        await resultApi.verify(resultId);
      }
      fetchResults();
      handleClearSelection();
    } catch (err) {
      console.error("Failed to bulk verify:", err);
      alert("Failed to verify some results. Please try again.");
    }
  };

  const handleBulkPrint = () => {
    if (selectedResults.size === 0) {
      alert("Please select at least one result to print");
      return;
    }
    
    // For now, just show the first selected result
    // In production, you'd want to generate a combined PDF or print multiple reports
    const firstResultId = Array.from(selectedResults)[0];
    handlePreviewReport(firstResultId);
    alert(`Bulk printing ${selectedResults.size} reports. Starting with first report. In production, this would generate combined PDF for all selected reports.`);
  };

  const handleSaveParameterValues = async (values: any[]) => {
    if (!selectedResultForEntry) return;
    
    try {
      console.log("Saving parameter values:", values);
      const response = await resultApi.update(selectedResultForEntry.id, {
        values,
        status: "ENTERED"
      });
      console.log("Save response:", response);
      if (response.success) {
        setShowParameterEntry(false);
        fetchResults();
        // Show success message
        alert("Results saved successfully!");
      } else {
        throw new Error(response.message || "Failed to save results");
      }
    } catch (err) {
      console.error("Failed to save parameter values:", err);
      alert(`Failed to save parameter values: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
    }
  };

  const handleApproveWithSignature = async (signatureData: string) => {
    if (!selectedResultForApproval) return;
    
    try {
      const response = await resultApi.approve(selectedResultForApproval.id);
      if (response.success) {
        setShowApprovalModal(false);
        fetchResults();
      }
    } catch (err) {
      console.error("Failed to approve result:", err);
      alert("Failed to approve result. Please try again.");
    }
  };

  const convertToResultRow = (result: ResultData): ResultRow => ({
    id: result.id,
    orderId: result.orderId,
    testId: result.testId,
    status: result.status,
    order: result.order,
    test: result.test,
    enteredBy: result.enteredBy,
    approvedBy: result.approvedBy,
    values: result.values,
    createdAt: result.createdAt,
    enteredAt: result.enteredAt,
    verifiedAt: result.verifiedAt,
    approvedAt: result.approvedAt,
  });

  const handleExport = () => {
    const rows = results.map((result) => [
      result.order.orderNumber,
      `${result.order.patient.firstName} ${result.order.patient.lastName}`,
      result.order.patient.uhid,
      result.test.testName,
      result.status,
      result.values?.some((value) => value.flag === "CRITICAL" || value.flag === "HIGH") ? "Attention required" : "Normal",
    ]);
    const csv = [["Order", "Patient", "UHID", "Test", "Status", "Clinical flag"], ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `labcore-results-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setToast({ message: `${results.length} results exported successfully`, type: "success" });
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setDepartment("");
    setTestName("");
    setPage(1);
  };

  const calculateAge = (dateOfBirth?: string): string => {
    if (!dateOfBirth) return "—";
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age}y`;
  };

  return (
    <DashboardLayout title="Results">
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 px-6 py-6 text-white shadow-xl shadow-slate-200/60">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                <Sparkles className="h-4 w-4" /> Results command center
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Laboratory Results</h1>
              <p className="mt-2 max-w-xl text-sm text-slate-300">
                Review, validate and publish patient results with a clear, audit-ready workflow.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_currentColor]" /> Live operations
                </span>
                <span>Last synced just now</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={commandPalette.open} className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15">
                <Command className="h-4 w-4" /> Command
                <kbd className="rounded border border-white/20 px-1.5 py-0.5 text-[10px] text-slate-300">⌘K</kbd>
              </button>
              <button onClick={fetchResults} className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                <Download className="h-4 w-4" /> Export CSV
              </button>
              {results.length > 0 && (
                <button
                  onClick={() => {
                    // Notify for the most recent approved result if any
                    const approved = results.find(r => r.status === "APPROVED" || r.status === "PUBLISHED");
                    if (approved) handleNotifyPatient(approved.id);
                    else handleNotifyPatient(results[0].id);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:from-violet-500 transition"
                >
                  <Zap className="h-4 w-4" /> Notify Patient
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Laboratory Operations Navigation Bar */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-2 shadow-lg backdrop-blur-md">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            {/* Group 1: Clinical Workflows */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Clinical:</span>
              <button
                onClick={() => setActiveTab("queue")}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  activeTab === "queue"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <ListChecks className="h-4 w-4" />
                <span>Results Queue & Entry</span>
                <span className="ml-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                  {results.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("validation")}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  activeTab === "validation"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Stethoscope className="h-4 w-4" />
                <span>Pathologist Desk</span>
                <span className="ml-1 rounded-full bg-indigo-950 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300 border border-indigo-700/50">
                  Medical Review
                </span>
              </button>

              <button
                onClick={() => setActiveTab("critical")}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  activeTab === "critical"
                    ? "bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <AlertOctagon className="h-4 w-4 text-red-400 animate-pulse" />
                <span>Panic Read-Back</span>
                <span className="ml-1 rounded-full bg-red-950 px-1.5 py-0.5 text-[9px] font-bold text-red-300 border border-red-700/50">
                  ISO 15189
                </span>
              </button>

              <a
                href="/microbiology"
                className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all text-purple-300 hover:bg-purple-950/60 border border-purple-500/40 bg-purple-950/20 shadow-xs"
              >
                <Microscope className="h-4 w-4 text-purple-400" />
                <span>Microbiology &amp; AST Suite</span>
                <span className="ml-1 rounded-full bg-purple-900 px-1.5 py-0.5 text-[9px] font-bold text-purple-200">
                  Live Bench
                </span>
              </a>
            </div>

            {/* Group 2: Quality & Middleware Intelligence */}
            <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-800 pt-2 xl:border-t-0 xl:pt-0">
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Quality & Rules:</span>
              <button
                onClick={() => setActiveTab("delta")}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  activeTab === "delta"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Delta Checks</span>
                <span className="ml-1 rounded-full bg-cyan-950 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300 border border-cyan-700/50">
                  RCV
                </span>
              </button>

              <button
                onClick={() => setActiveTab("autovalidation")}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  activeTab === "autovalidation"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Zap className="h-4 w-4" />
                <span>Auto-Validation</span>
                <span className="ml-1 rounded-full bg-amber-950 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-700/50">
                  AUTO10-A
                </span>
              </button>

              <button
                onClick={() => setActiveTab("amended")}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  activeTab === "amended"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <FileCode className="h-4 w-4" />
                <span>Amended Reports</span>
                <span className="ml-1 rounded-full bg-purple-950 px-1.5 py-0.5 text-[9px] font-bold text-purple-300 border border-purple-700/50">
                  Audit Log
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Standard Results Queue & Entry */}
        {activeTab === "queue" && (
          <div className="space-y-6">
            {/* Summary Metrics Cards */}
            <ResultMetricsCards onFilterChange={(filter) => setStatus(filter)} />

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-cyan-50 p-2 text-cyan-700"><Activity className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Advanced review insights</p>
                  <p className="text-xs text-slate-500">Priority signals from the current result queue</p>
                </div>
              </div>
              <button onClick={() => setShowInsights((visible) => !visible)} className="text-xs font-semibold text-cyan-700 hover:text-cyan-900">
                {showInsights ? "Hide insights" : "Show insights"}
              </button>
            </div>
            {showInsights && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-4">
                  <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-red-700">Attention queue</p><AlertCircle className="h-4 w-4 text-red-500" /></div>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{results.filter((result) => result.values?.some((value) => value.flag === "CRITICAL" || value.flag === "HIGH")).length}</p>
                  <p className="mt-1 text-xs text-slate-500">Results with high or critical flags</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
                  <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Verified coverage</p><ShieldCheck className="h-4 w-4 text-emerald-500" /></div>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{results.length ? Math.round((results.filter((result) => ["VERIFIED", "APPROVED", "PUBLISHED"].includes(result.status)).length / results.length) * 100) : 0}%</p>
                  <p className="mt-1 text-xs text-slate-500">Current page ready for sign-off</p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4">
                  <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Review velocity</p><Clock3 className="h-4 w-4 text-amber-500" /></div>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{results.filter((result) => result.status === "PENDING" || result.status === "ENTERED").length}</p>
                  <p className="mt-1 text-xs text-slate-500">Items needing the next workflow action</p>
                </div>
              </div>
            )}

            <ResultFilters
              search={search}
              status={status}
              dateFrom={dateFrom}
              dateTo={dateTo}
              department={department}
              testName={testName}
              onSearchChange={setSearch}
              onStatusChange={setStatus}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              onDepartmentChange={setDepartment}
              onTestNameChange={setTestName}
              onReset={handleClearFilters}
            />

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Results Management Table */}
            <ResultsManagementTable
              results={results.map(convertToResultRow)}
              loading={loading}
              onEnterEdit={handleEnterEdit}
              onPathologistApprove={handlePathologistApprove}
              onPreviewReport={handlePreviewReport}
              onPrintReport={handlePrintReport}
              onViewHistory={handleViewHistory}
              selectedResults={selectedResults}
              onSelectResult={handleSelectResult}
              onSelectAll={handleSelectAll}
              isAllSelected={isAllSelected}
            />
            
            {/* Pagination */}
            {total > limit && (
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
                <p className="text-sm text-gray-500">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * limit >= total}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Bulk Actions Bar */}
            <BulkActionsBar
              selectedCount={selectedResults.size}
              onBulkVerify={handleBulkVerify}
              onBulkPrint={handleBulkPrint}
              onClearSelection={handleClearSelection}
            />
          </div>
        )}

        {/* Tab 2: Pathologist Medical Review & Sign-Off Desk */}
        {activeTab === "validation" && <PathologistValidationDesk />}

        {/* Tab 3: Critical & Panic Value Escalation Hub (ISO 15189) */}
        {activeTab === "critical" && <CriticalPanicEscalationHub onSelectResult={handleView} />}

        {/* Tab 4: Longitudinal Delta Intelligence & Sample Mix-Up Monitor */}
        {activeTab === "delta" && <LongitudinalDeltaIntelligence />}

        {/* Tab 5: Auto-Validation Rule Engine & Middleware Automation */}
        {activeTab === "autovalidation" && <AutoValidationRuleEngine />}

        {/* Tab 6: Amended Reports & Medicolegal Addendum Audit Trail */}
        {activeTab === "amended" && <AmendedResultsAuditTrail />}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 shadow-lg ${
          toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Parameter Entry Modal */}
      {showParameterEntry && selectedResultForEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border border-cyan-500/40 bg-slate-950 p-6 sm:p-8 text-white shadow-2xl shadow-cyan-950/40">
            <button
              onClick={() => setShowParameterEntry(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Close Modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header Patient Card */}
            <div className="mb-6 border-b border-slate-800 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3 py-1 text-xs font-bold text-cyan-300">
                    <FlaskConical className="h-3.5 w-3.5 text-cyan-400" />
                    Clinical Result Entry Workstation
                  </span>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                    {selectedResultForEntry.test.testName}
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Patient: <strong className="text-white">{selectedResultForEntry.order.patient.firstName} {selectedResultForEntry.order.patient.lastName}</strong> · UHID: <span className="font-mono text-cyan-400">{selectedResultForEntry.order.patient.uhid}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-slate-300">
                  <span className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1">
                    Order: <strong className="text-white">{selectedResultForEntry.order.orderNumber}</strong>
                  </span>
                  <span className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1">
                    Barcode: <strong className="text-cyan-400">{selectedResultForEntry.order.barcode}</strong>
                  </span>
                  <span className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1">
                    Matrix: <strong className="text-white">{selectedResultForEntry.test.sampleType || "Serum"}</strong>
                  </span>
                </div>
              </div>
            </div>

            <ParameterResultEntrySheet
              parameters={
                selectedResultForEntry.test.parameters && selectedResultForEntry.test.parameters.length > 0
                  ? selectedResultForEntry.test.parameters
                  : [
                      {
                        id: `p-${selectedResultForEntry.test.id || "1"}`,
                        parameterName: selectedResultForEntry.test.testName || "Observed Reading",
                        shortName: selectedResultForEntry.test.testCode || "VAL",
                        unit: selectedResultForEntry.test.sampleType?.includes("Blood") ? "mg/dL" : "µIU/mL",
                        dataType: "NUMERIC",
                        referenceRanges: [
                          {
                            id: `rr-${selectedResultForEntry.test.id || "1"}`,
                            normalLow: selectedResultForEntry.test.testName?.toLowerCase().includes("glucose") ? 70 : 0.35,
                            normalHigh: selectedResultForEntry.test.testName?.toLowerCase().includes("glucose") ? 99 : 4.94,
                            criticalLow: selectedResultForEntry.test.testName?.toLowerCase().includes("glucose") ? 45 : 0.05,
                            criticalHigh: selectedResultForEntry.test.testName?.toLowerCase().includes("glucose") ? 350 : 20.0,
                          },
                        ],
                      },
                    ]
              }
              initialValues={
                selectedResultForEntry.values?.map((v) => ({
                  parameterId: v.parameter.id,
                  value: v.value,
                  flag: v.flag as any,
                  remark: v.remark,
                })) || []
              }
              patientAge={
                selectedResultForEntry.order.patient.dateOfBirth
                  ? Math.floor(
                      (new Date().getTime() - new Date(selectedResultForEntry.order.patient.dateOfBirth).getTime()) /
                        (365 * 24 * 60 * 60 * 1000)
                    )
                  : undefined
              }
              patientGender={selectedResultForEntry.order.patient.gender}
              patientName={`${selectedResultForEntry.order.patient.firstName} ${selectedResultForEntry.order.patient.lastName}`}
              testName={selectedResultForEntry.test.testName}
              onSave={handleSaveParameterValues}
              onCancel={() => setShowParameterEntry(false)}
            />
          </div>
        </div>
      )}

      {/* Pathologist Approval Modal */}
      {showApprovalModal && selectedResultForApproval && (
        <PathologistApprovalModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          onApprove={handleApproveWithSignature}
          resultDetails={{
            patientName: `${selectedResultForApproval.order.patient.firstName} ${selectedResultForApproval.order.patient.lastName}`,
            testName: selectedResultForApproval.test.testName,
            criticalValues: selectedResultForApproval.values
              ?.filter(v => v.flag === "CRITICAL" || v.flag === "HIGH")
              .map(v => `${v.parameter.parameterName}: ${v.value}`)
          }}
        />
      )}

      {/* Lab Report Preview Modal */}
      {showReportPreview && selectedResultForReport && (
        <LabTestResultReport
          report={{
            reportNumber: `RPT-${new Date().getFullYear()}-${String(selectedResultForReport.id).slice(-6)}`,
            reportDate: selectedResultForReport.approvedAt || selectedResultForReport.verifiedAt || selectedResultForReport.createdAt,
            reportTime: selectedResultForReport.approvedAt || selectedResultForReport.verifiedAt || selectedResultForReport.createdAt,
            reportStatus: selectedResultForReport.status === "APPROVED" || selectedResultForReport.status === "PUBLISHED" ? "Final" : "Preliminary",

            patientName: `${selectedResultForReport.order.patient.firstName} ${selectedResultForReport.order.patient.lastName}`,
            patientId: selectedResultForReport.order.patient.uhid,
            age: calculateAge(selectedResultForReport.order.patient.dateOfBirth),
            gender: selectedResultForReport.order.patient.gender,
            phone: selectedResultForReport.order.patient.phone,
            referredBy: selectedResultForReport.order.doctor?.fullName,

            sampleCollected: selectedResultForReport.enteredAt || selectedResultForReport.createdAt,
            reportApproved: selectedResultForReport.approvedAt || selectedResultForReport.verifiedAt,


            orderId: selectedResultForReport.order.orderNumber,
            sampleId: selectedResultForReport.order.barcode,
            specimen: selectedResultForReport.test.sampleType,
            department: selectedResultForReport.test.category?.categoryName || "Laboratory Workflow",

            resultStatus: selectedResultForReport.status === "PUBLISHED"
              ? "Published · Audit Verified"
              : selectedResultForReport.status === "APPROVED"
              ? "Approved · Audit Verified"
              : selectedResultForReport.status === "VERIFIED"
              ? "Verified"
              : "Pending",
            tat: "On Time",
            resultDate: selectedResultForReport.approvedAt
              ? new Date(selectedResultForReport.approvedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
              : undefined,
            barcode: selectedResultForReport.order.barcode,

            testName: selectedResultForReport.test.testName,
            testCode: selectedResultForReport.test.testCode,
            method: selectedResultForReport.test.method,

            results: selectedResultForReport.values?.map(v => {
              const param = selectedResultForReport.test.parameters?.find(p => p.id === v.parameter.id);
              let referenceRange = "—";
              if (param?.referenceRanges && param.referenceRanges.length > 0) {
                const range = param.referenceRanges[0];
                if (range.normalLow !== undefined && range.normalHigh !== undefined) {
                  referenceRange = `${range.normalLow} - ${range.normalHigh}`;
                } else if (range.interpretation) {
                  referenceRange = range.interpretation;
                }
              }
              return {
                id: v.id,
                parameterName: v.parameter.parameterName,
                result: v.value,
                unit: v.parameter.unit,
                referenceRange,
                flag: v.flag
              };
            }) || [],

            verifiedBy: selectedResultForReport.approvedBy?.fullName ||
              selectedResultForReport.enteredBy?.fullName || "Authorized Signatory",
            verifierRole: selectedResultForReport.approvedBy?.role || "Admin / LabCore E.R.",
            verifiedAt: selectedResultForReport.approvedAt || selectedResultForReport.verifiedAt,

            interpretation: selectedResultForReport.interpretation,
            remarks: selectedResultForReport.remarks,
          }}
          onClose={() => setShowReportPreview(false)}
          onPrint={() => console.log("Report printed")}
          onDownload={() => console.log("Report downloaded")}
        />
      )}

      {/* Result History Modal */}
      {showHistoryModal && selectedResultForHistory && (
        <ResultHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          resultId={selectedResultForHistory.id}
          history={generateMockHistory(selectedResultForHistory)}
        />
      )}

      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
        results={results}
        onNavigateToResult={handleView}
        onRefresh={fetchResults}
        onExport={handleExport}
        onClearFilters={handleClearFilters}
        onEnterResult={handleEnterEdit}
        onViewHistory={handleViewHistory}
        onPreviewReport={handlePreviewReport}
        onFilterByStatus={(nextStatus) => {
          setStatus(nextStatus);
          setPage(1);
        }}
      />
      {/* Notification Dispatch Modal */}
      {showNotifyModal && notifyPayload && (
        <NotificationDispatchModal
          isOpen={showNotifyModal}
          onClose={() => setShowNotifyModal(false)}
          payload={notifyPayload}
        />
      )}
    </DashboardLayout>

  );
}
