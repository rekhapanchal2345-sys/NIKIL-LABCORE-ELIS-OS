"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboardlayout";
import ApprovalTable from "@/components/approvals/ApprovalTable";
import ApprovalFilters from "@/components/approvals/ApprovalFilters";
import ApprovalMetrics from "@/components/approvals/ApprovalMetrics";
import ApprovalReviewModal from "@/components/approvals/ApprovalReviewModal";
import DoctorWorkstationView from "@/components/approvals/DoctorWorkstationView";
import ApprovalRulesModal from "@/components/approvals/ApprovalRulesModal";
import CriticalPanicCallModal from "@/components/approvals/CriticalPanicCallModal";
import BatchApprovalModal from "@/components/approvals/BatchApprovalModal";
import LeveyJenningsChart from "@/components/qc/LeveyJenningsChart";
import { approvalApi } from "@/lib/api";
import type { Approval } from "@/components/approvals/ApprovalTable";

function ApprovalsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("VERIFIED");
  const [quickFilter, setQuickFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFilterKey, setActiveFilterKey] = useState("pending");
  const [viewMode, setViewMode] = useState<"workstation" | "table">("table");
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callTargetApproval, setCallTargetApproval] = useState<Approval | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isQcModalOpen, setIsQcModalOpen] = useState(false);
  const [qcTargetTest, setQcTargetTest] = useState("K");


  const [metrics, setMetrics] = useState({
    pendingApproval: 0,
    criticalValues: 0,
    approvedToday: 0,
    rejectedRerun: 0,
  });
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedApprovals, setSelectedApprovals] = useState<Set<string | number>>(new Set());
  const [batchActionLoading, setBatchActionLoading] = useState(false);

  // Sync URL search parameters on mount
  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "workstation") {
      setViewMode("workstation");
    }

    const viewParam = searchParams.get("view");
    if (viewParam === "rules") {
      setIsRulesModalOpen(true);
    }

    const filterParam = searchParams.get("filter");
    const statusParam = searchParams.get("status");

    if (filterParam === "critical") {
      setQuickFilter("critical");
      setStatusFilter("VERIFIED");
      setActiveFilterKey("critical");
    } else if (filterParam === "pipeline") {
      setQuickFilter("pipeline");
      setStatusFilter("");
      setActiveFilterKey("pipeline");
    } else if (filterParam === "normal") {
      setQuickFilter("normal");
      setStatusFilter("VERIFIED");
      setActiveFilterKey("normal");
    } else if (statusParam === "ENTERED") {
      setStatusFilter("ENTERED");
      setQuickFilter("");
      setActiveFilterKey("rerun");
    } else if (statusParam === "APPROVED") {
      setStatusFilter("APPROVED");
      setQuickFilter("");
      setActiveFilterKey("approved");
    }
  }, [searchParams]);

  const fetchMetrics = useCallback(async () => {
    try {
      setMetricsLoading(true);
      const response = await approvalApi.getMetrics();
      if (response.success && response.data) {
        setMetrics(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append("search", searchTerm);
      if (statusFilter) queryParams.append("status", statusFilter);
      if (quickFilter) queryParams.append("filter", quickFilter);
      if (departmentFilter) queryParams.append("department", departmentFilter);
      if (dateFrom) queryParams.append("dateFrom", dateFrom);
      if (dateTo) queryParams.append("dateTo", dateTo);
      queryParams.append("page", page.toString());
      queryParams.append("limit", "20");

      const response = await approvalApi.getPending(queryParams.toString());

      if (response.success && response.data) {
        const transformedApprovals: Approval[] = (response.data.results || []).map((result: any) => {
          const abnormalCount =
            result.values?.filter(
              (v: any) => v.flag === "HIGH" || v.flag === "LOW" || v.flag === "CRITICAL"
            ).length || 0;

          const criticalValues =
            result.values
              ?.filter((v: any) => v.flag === "CRITICAL")
              .map((v: any) => v.parameter?.parameterName || "Parameter") || [];

          return {
            id: result.id,
            resultId: result.id,
            resultNumber: result.order?.orderNumber || `RES-${result.id}`,
            orderId: result.orderId,
            orderNumber: result.order?.orderNumber,
            barcode: result.order?.barcode,
            patientId: result.order?.patient?.id,
            patientName: `${result.order?.patient?.firstName || ""} ${result.order?.patient?.lastName || ""}`.trim() || "Unknown",
            patientUhid: result.order?.patient?.uhid,
            patientAge: result.order?.patient?.age,
            patientGender: result.order?.patient?.gender,
            testId: result.test?.id,
            testName: result.test?.testName,
            testCode: result.test?.testCode,
            submittedBy: result.enteredBy?.fullName,
            submittedAt: result.verifiedAt || result.createdAt,
            assignedPathologist: result.approvedBy?.fullName || "Unassigned",
            status: result.status === "VERIFIED" ? "Pending" : result.status,
            abnormalCount,
            criticalValues,
          };
        });

        setApprovals(transformedApprovals);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch approvals");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, quickFilter, departmentFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchMetrics();
    fetchApprovals();
  }, [fetchMetrics, fetchApprovals]);

  const handleApprove = async (approval: Approval) => {
    try {
      // Use the actual result ID from the approval object
      const resultId = String(approval.id || approval.resultId);
      console.log("Approving result with ID:", resultId);
      
      const response = await approvalApi.approve(resultId, {
        remarks: approval.remarks,
      });
      
      console.log("Approval response:", response);
      
      if (response.success) {
        await fetchApprovals();
        await fetchMetrics();
        alert("Result approved successfully!");
      } else {
        throw new Error(response.message || "Approval failed");
      }
    } catch (err) {
      console.error("Approval error:", err);
      alert(err instanceof Error ? err.message : "Failed to approve result");
    }
  };

  const handleReject = async (approval: Approval) => {
    const reason = prompt("Please enter the rejection reason:");
    if (!reason || !reason.trim()) return;

    try {
      const response = await approvalApi.reject(String(approval.resultId), { remarks: reason.trim() });
      if (response.success) {
        await fetchApprovals();
        await fetchMetrics();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject result");
    }
  };

  const handleRerun = async (approval: Approval, reason: string) => {
    if (!reason || reason.trim() === "") {
      alert("Please provide a reason for the rerun request");
      return;
    }

    try {
      const response = await approvalApi.reject(String(approval.resultId), { remarks: reason });
      if (response.success) {
        await fetchApprovals();
        await fetchMetrics();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to request rerun");
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  const handleFilterChange = (filters: {
    status: string;
    dateFrom: string;
    dateTo: string;
    department?: string;
    filter?: string;
  }) => {
    setStatusFilter(filters.status || "VERIFIED");
    setDateFrom(filters.dateFrom);
    setDateTo(filters.dateTo);
    if (filters.department !== undefined) setDepartmentFilter(filters.department);
    if (filters.filter !== undefined) setQuickFilter(filters.filter);
    setPage(1);
  };

  const handleSelectFilterPill = (key: string) => {
    setActiveFilterKey(key);
    if (key === "pending") {
      setStatusFilter("VERIFIED");
      setQuickFilter("");
    } else if (key === "pipeline") {
      setStatusFilter("");
      setQuickFilter("pipeline");
    } else if (key === "critical") {
      setStatusFilter("VERIFIED");
      setQuickFilter("critical");
    } else if (key === "normal") {
      setStatusFilter("VERIFIED");
      setQuickFilter("normal");
    } else if (key === "abnormal") {
      setStatusFilter("VERIFIED");
      setQuickFilter("abnormal");
    } else if (key === "rerun") {
      setStatusFilter("ENTERED");
      setQuickFilter("");
    } else if (key === "approved") {
      setStatusFilter("APPROVED");
      setQuickFilter("");
    }
    setPage(1);
  };

  const handleReview = (approval: Approval) => {
    setSelectedApproval(approval);
    setIsReviewModalOpen(true);
  };

  const handleSelectApproval = (approvalId: string | number) => {
    const newSelected = new Set(selectedApprovals);
    if (newSelected.has(approvalId)) {
      newSelected.delete(approvalId);
    } else {
      newSelected.add(approvalId);
    }
    setSelectedApprovals(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedApprovals(new Set(approvals.map((a) => a.id)));
    } else {
      setSelectedApprovals(new Set());
    }
  };

  const handleBatchApprove = async () => {
    if (selectedApprovals.size === 0) {
      alert("Please select at least one approval to batch approve");
      return;
    }

    const selectedList = approvals.filter((a) => selectedApprovals.has(a.id));
    const hasCriticalSelected = selectedList.some(
      (a) => a.criticalValues && a.criticalValues.length > 0
    );

    if (hasCriticalSelected) {
      const proceed = confirm(
        "⚠️ Safety Warning: Some selected reports contain Critical / Panic values. Laboratory policy mandates direct verbal communication before release. Unacknowledged critical reports will be skipped.\n\nDo you wish to proceed?"
      );
      if (!proceed) return;
    } else {
      if (!confirm(`Are you sure you want to batch approve ${selectedApprovals.size} verified report(s)?`)) {
        return;
      }
    }

    try {
      setBatchActionLoading(true);
      // Use result IDs instead of approval IDs
      const ids = Array.from(selectedApprovals).map(id => {
        const approval = approvals.find(a => a.id === id);
        return String(approval?.resultId || approval?.id || id);
      });
      
      console.log("Batch approving result IDs:", ids);
      
      const res = await approvalApi.batchApprove(ids, "Batch authorization by Pathologist");

      console.log("Batch approval response:", res);

      if (res?.success) {
        setSelectedApprovals(new Set());
        await fetchApprovals();
        await fetchMetrics();
        alert(`Successfully batch approved ${res.data?.approvedCount || ids.length} report(s)!`);
      } else {
        alert(res?.message || "Batch approval completed with warnings");
      }
    } catch (err: any) {
      console.error("Batch approval error:", err);
      alert(err instanceof Error ? err.message : "Failed to complete batch approval");
    } finally {
      setBatchActionLoading(false);
    }
  };

  return (
    <DashboardLayout title="Approvals">
      <div className="space-y-3">
        {/* Page Title — compact single-line strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-3 shadow-2xl shadow-slate-950/80">
          <div className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2 text-cyan-400 shadow-lg shadow-cyan-500/10 text-base">🔬</span>
            <div className="min-w-0">
              <h1 className="text-base font-black tracking-tight text-white flex flex-wrap items-center gap-2">
                <span>Pathologist Review &amp; Approval Queue</span>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                  ISO 15189 / NABL Standard
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
                Verify diagnostic findings, review historical delta checks, and digitally sign laboratory results.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setQcTargetTest("K");
                setIsQcModalOpen(true);
              }}
              className="rounded-xl border border-cyan-700/50 bg-cyan-950/40 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>📈</span>
              <span>Daily QC &amp; LJ Chart</span>
            </button>
            <button
              onClick={() => setIsRulesModalOpen(true)}
              className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>🛡️</span>
              <span>Sign-Off Policies</span>
            </button>
            <button
              onClick={() => {
                fetchMetrics();
                fetchApprovals();
              }}
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-600/20 transition-all flex items-center gap-1.5"
            >
              <span>↻</span>
              <span>Refresh Queue</span>
            </button>
          </div>

        </div>

        {/* Clinical KPI Metrics Bar */}
        <ApprovalMetrics
          pendingApproval={metrics.pendingApproval}
          criticalValues={metrics.criticalValues}
          approvedToday={metrics.approvedToday}
          rejectedRerun={metrics.rejectedRerun}
          loading={metricsLoading}
          activeFilter={activeFilterKey}
          onSelectMetric={handleSelectFilterPill}
        />

        {/* Filter Strip */}
        <ApprovalFilters
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          activeFilter={activeFilterKey}
          onSelectFilterPill={handleSelectFilterPill}
          onOpenRules={() => setIsRulesModalOpen(true)}
        />

        {/* Batch Action Bar */}
        {selectedApprovals.size > 0 && viewMode === "table" && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/50 to-blue-950/50 px-5 py-3.5 shadow-lg shadow-cyan-500/5 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-xs font-bold text-white shadow-md">
                {selectedApprovals.size}
              </span>
              <p className="text-xs font-bold text-slate-200">
                {selectedApprovals.size} report{selectedApprovals.size !== 1 ? "s" : ""} selected for batch review
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedApprovals(new Set())}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(true)}
                disabled={batchActionLoading}
                className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-cyan-600/20 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <span className="text-white font-bold">✓ Batch Sign Selected</span>
              </button>
            </div>

          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 shadow-sm">
            <p className="text-xs font-bold text-rose-300 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </p>
          </div>
        )}

        {/* Dual View Modes */}
        {viewMode === "workstation" ? (
          <DoctorWorkstationView
            approvals={approvals}
            loading={loading}
            onApprove={handleApprove}
            onReject={handleReject}
            onRerun={handleRerun}
            onRefresh={() => {
              fetchApprovals();
              fetchMetrics();
            }}
          />
        ) : (
          <>
            <ApprovalTable
              approvals={approvals}
              loading={loading}
              onApprove={handleApprove}
              onReject={handleReject}
              onReview={handleReview}
              onRerun={handleRerun}
              selectedApprovals={selectedApprovals}
              onSelectApproval={handleSelectApproval}
              onSelectAll={handleSelectAll}
            />

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-500">
                  Page <strong className="text-slate-200">{page}</strong> of <strong className="text-slate-200">{totalPages}</strong>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-bold text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:opacity-40 transition-colors shadow-sm"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-bold text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:opacity-40 transition-colors shadow-sm"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Review Modal */}
      <ApprovalReviewModal
        approval={selectedApproval}
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedApproval(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
        onRerun={handleRerun}
      />

      {/* Rules Policy Modal */}
      <ApprovalRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      {/* Critical Panic Call Log Modal */}
      {isCallModalOpen && callTargetApproval && (
        <CriticalPanicCallModal
          isOpen={isCallModalOpen}
          onClose={() => {
            setIsCallModalOpen(false);
            setCallTargetApproval(null);
          }}
          resultId={String(callTargetApproval.resultId)}
          orderNumber={callTargetApproval.orderNumber}
          patientName={callTargetApproval.patientName}
          criticalParameters={(callTargetApproval.criticalValues || []).map((name) => ({
            name,
            value: "Panic Limit Exceeded",
          }))}
          onSuccess={() => {
            fetchApprovals();
            fetchMetrics();
          }}
        />
      )}

      {/* Batch Approval Modal */}
      {isBatchModalOpen && (
        <BatchApprovalModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          selectedApprovals={approvals.filter((a) => selectedApprovals.has(a.id))}
          onSuccess={(approvedCount, skippedCount) => {
            setSelectedApprovals(new Set());
            fetchApprovals();
            fetchMetrics();
            alert(
              `Successfully batch approved & certified ${approvedCount} report(s)! ${
                skippedCount > 0
                  ? `(${skippedCount} skipped due to unacknowledged critical/panic values)`
                  : ""
              }`
            );
          }}
        />
      )}

      {/* Levey-Jennings QC Modal */}
      {isQcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <LeveyJenningsChart
              testCode={qcTargetTest}
              onClose={() => setIsQcModalOpen(false)}
            />
          </div>
        </div>
      )}
    </DashboardLayout>

  );
}

export default function ApprovalsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout title="Approvals">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          </div>
        </DashboardLayout>
      }
    >
      <ApprovalsContent />
    </Suspense>
  );
}
