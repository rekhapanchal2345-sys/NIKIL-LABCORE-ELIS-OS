"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, BarChart3, ChevronLeft, ChevronRight, ClipboardCheck, RefreshCw, X } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboardlayout";
import ApprovalTable from "@/components/approvals/ApprovalTable";
import ApprovalFilters from "@/components/approvals/ApprovalFilters";
import ApprovalMetrics from "@/components/approvals/ApprovalMetrics";
import ApprovalReviewModal from "@/components/approvals/ApprovalReviewModal";
import DoctorWorkstationView from "@/components/approvals/DoctorWorkstationView";
import ApprovalRulesModal from "@/components/approvals/ApprovalRulesModal";
import CriticalPanicCallModal from "@/components/approvals/CriticalPanicCallModal";
import BatchApprovalModal from "@/components/approvals/BatchApprovalModal";
import ApprovalsSubNav from "@/components/approvals/ApprovalsSubNav";
import { ConfirmDialog, ReasonDialog } from "@/components/approvals/ApprovalDialogs";
import { isSignableStatus } from "@/components/approvals/approvalUtils";
import { QUEUES, mapResultToApproval, resolveQueueKey } from "@/components/approvals/approvalQueues";
import LeveyJenningsChart from "@/components/qc/LeveyJenningsChart";
import { approvalApi } from "@/lib/api";
import { showError, showSuccess, showWarning } from "@/lib/notifications";
import type { Approval } from "@/components/approvals/ApprovalTable";

const PAGE_SIZE = 20;
const AUTO_REFRESH_MS = 60_000;

type ReasonKind = "reject" | "rerun";

function ApprovalsContent() {
  const searchParams = useSearchParams();

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [queueKey, setQueueKey] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [viewMode, setViewMode] = useState<"workstation" | "table">("table");

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
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [callTargetApproval, setCallTargetApproval] = useState<Approval | null>(null);
  const [isQcModalOpen, setIsQcModalOpen] = useState(false);

  const [reasonDialog, setReasonDialog] = useState<{ kind: ReasonKind; approval: Approval } | null>(null);
  const [approveTarget, setApproveTarget] = useState<Approval | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const queue = QUEUES[queueKey] ?? QUEUES.pending;

  /* URL -> state (sidebar links, dashboard cards, triage desk) */
  useEffect(() => {
    setViewMode(searchParams.get("mode") === "workstation" ? "workstation" : "table");
    setQueueKey(resolveQueueKey(searchParams.get("filter"), searchParams.get("status")));
    setOrderIdFilter(searchParams.get("orderId") || "");
    if (searchParams.get("view") === "rules") setIsRulesModalOpen(true);
    setSelectedApprovals(new Set());
    setPage(1);
  }, [searchParams]);

  /* Data loading */
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await approvalApi.getMetrics();
      if (response?.success && response.data) {
        setMetrics({
          pendingApproval: response.data.pendingApproval ?? 0,
          criticalValues: response.data.criticalValues ?? 0,
          approvedToday: response.data.approvedToday ?? 0,
          rejectedRerun: response.data.rejectedRerun ?? 0,
        });
      }
    } catch {
      // The worklist itself reports connection problems; the counters keep their last values.
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const fetchApprovals = useCallback(
    async (options: { silent?: boolean } = {}) => {
      try {
        if (!options.silent) setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        // A single-order view must not be limited to one status.
        const status = orderIdFilter && queueKey === "pending" ? "ALL" : queue.status;
        if (status) params.append("status", status);
        if (queue.filter) params.append("filter", queue.filter);
        if (orderIdFilter) params.append("orderId", orderIdFilter);
        if (departmentFilter) params.append("department", departmentFilter);
        if (dateFrom) params.append("dateFrom", dateFrom);
        if (dateTo) params.append("dateTo", dateTo);
        params.append("page", String(page));
        params.append("limit", String(PAGE_SIZE));

        const response = await approvalApi.getPending(params.toString());
        if (!response?.success || !response.data) {
          throw new Error(response?.message || "The server did not return the approval worklist.");
        }

        const rows: Approval[] = (response.data.results || []).map(mapResultToApproval);
        setApprovals(rows);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalResults(response.data.pagination?.total ?? rows.length);
        setLastUpdated(new Date());
      } catch (err) {
        // Never keep showing a previous list when the server cannot be reached.
        setApprovals([]);
        setTotalResults(0);
        setError(err instanceof Error ? err.message : "Unable to load the approval worklist.");
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, queueKey, queue, orderIdFilter, departmentFilter, dateFrom, dateTo, page]
  );

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  // Quiet background refresh while the page is visible.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchMetrics();
        fetchApprovals({ silent: true });
      }
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [fetchMetrics, fetchApprovals]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchMetrics(), fetchApprovals()]);
  }, [fetchMetrics, fetchApprovals]);

  /* Actions */
  const resultIdOf = (approval: Approval) => String(approval.resultId ?? approval.id);
  const orderTag = (approval: Approval) => (approval.orderNumber ? ` - ${approval.orderNumber}` : "");

  /** Signs a result. Used by the review modal and workstation, which run their own safety checks. */
  const handleApprove = async (approval: Approval) => {
    try {
      const response = await approvalApi.approve(resultIdOf(approval), { remarks: approval.remarks });
      if (!response?.success) throw new Error(response?.message || "Approval failed");
      showSuccess(`Result signed${orderTag(approval)}.`);
      await refreshAll();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to approve the result.");
    }
  };

  /** Quick approve from the worklist always asks for confirmation first. */
  const requestQuickApprove = (approval: Approval) => {
    if (approval.criticalValues && approval.criticalValues.length > 0) {
      showWarning("Critical values need a documented call-back. Open the review to log it before signing.");
      setSelectedApproval(approval);
      setIsReviewModalOpen(true);
      return;
    }
    setApproveTarget(approval);
  };

  const confirmQuickApprove = async () => {
    if (!approveTarget) return;
    setActionBusy(true);
    await handleApprove(approveTarget);
    setActionBusy(false);
    setApproveTarget(null);
  };

  /** Sends a result back to the technician with a recorded reason. */
  const submitReturn = async (approval: Approval, reason: string, kind: ReasonKind) => {
    try {
      const response = await approvalApi.reject(resultIdOf(approval), { remarks: reason });
      if (!response?.success) throw new Error(response?.message || "The result could not be returned.");
      showSuccess(
        kind === "reject"
          ? `Result sent back for correction${orderTag(approval)}.`
          : `Rerun requested${orderTag(approval)}.`
      );
      await refreshAll();
      return true;
    } catch (err) {
      showError(err instanceof Error ? err.message : "The result could not be returned.");
      return false;
    }
  };

  const handleReject = (approval: Approval) => setReasonDialog({ kind: "reject", approval });
  const requestRerun = (approval: Approval) => setReasonDialog({ kind: "rerun", approval });

  /** Used by the review modal, which collects the rerun reason itself. */
  const handleRerun = async (approval: Approval, reason: string) => {
    if (!reason.trim()) {
      showWarning("A reason is required to return a result for rerun.");
      return;
    }
    await submitReturn(approval, reason.trim(), "rerun");
  };

  const confirmReason = async (reason: string) => {
    if (!reasonDialog) return;
    setActionBusy(true);
    const ok = await submitReturn(reasonDialog.approval, reason, reasonDialog.kind);
    setActionBusy(false);
    if (ok) setReasonDialog(null);
  };

  /* Filters and selection */
  const handleSelectQueue = (key: string) => {
    if (!QUEUES[key]) return;
    setQueueKey(key);
    setSelectedApprovals(new Set());
    setPage(1);
  };

  const handleFilterChange = (filters: { dateFrom: string; dateTo: string; department: string }) => {
    setDateFrom(filters.dateFrom);
    setDateTo(filters.dateTo);
    setDepartmentFilter(filters.department);
    setPage(1);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  const handleSelectApproval = (approvalId: string | number) => {
    setSelectedApprovals((previous) => {
      const next = new Set(previous);
      if (next.has(approvalId)) next.delete(approvalId);
      else next.add(approvalId);
      return next;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedApprovals(
      selected ? new Set(approvals.filter((a) => isSignableStatus(a.status)).map((a) => a.id)) : new Set()
    );
  };

  const clearOrderFilter = () => {
    setOrderIdFilter("");
    setPage(1);
    const url = new URL(window.location.href);
    url.searchParams.delete("orderId");
    window.history.replaceState(null, "", url.toString());
  };

  const selectedList = approvals.filter((a) => selectedApprovals.has(a.id));
  const selectedCritical = selectedList.filter((a) => a.criticalValues && a.criticalValues.length > 0).length;
  const firstRow = totalResults === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(page * PAGE_SIZE, totalResults);

  return (
    <DashboardLayout title="Pathologist Approvals">
      <div className="space-y-4">
        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 text-sky-700">
              <ClipboardCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-slate-900">Pathologist Approvals</h1>
              <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
                Review results, document critical-value call-backs and authorize reports for release.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {lastUpdated && (
              <span className="hidden text-[11px] text-slate-500 md:inline">
                Updated{" "}
                {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsQcModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Daily QC chart
            </button>
            <button
              type="button"
              onClick={refreshAll}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0284C7] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#0369A1]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <ApprovalsSubNav
          active="worklist"
          criticalCount={metrics.criticalValues}
          onOpenPolicies={() => setIsRulesModalOpen(true)}
        />

        <ApprovalMetrics
          pendingApproval={metrics.pendingApproval}
          criticalValues={metrics.criticalValues}
          approvedToday={metrics.approvedToday}
          rejectedRerun={metrics.rejectedRerun}
          loading={metricsLoading}
          activeFilter={queueKey}
          onSelectMetric={handleSelectQueue}
        />

        <ApprovalFilters
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          activeFilter={queueKey}
          onSelectFilterPill={handleSelectQueue}
          searchValue={searchTerm}
        />

        {/* Single-order scope */}
        {orderIdFilter && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs text-sky-900">
            <span>
              Showing all results for order{" "}
              <strong className="font-mono">{approvals[0]?.orderNumber || "selected order"}</strong>.
            </span>
            <button
              type="button"
              onClick={clearOrderFilter}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-sky-800 transition-colors hover:bg-sky-100"
            >
              <X className="h-3.5 w-3.5" />
              Show full worklist
            </button>
          </div>
        )}

        {/* Batch action bar */}
        {selectedApprovals.size > 0 && viewMode === "table" && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-5 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-[#0284C7] px-2 text-xs font-bold text-white">
                {selectedApprovals.size}
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  {selectedApprovals.size} result{selectedApprovals.size !== 1 ? "s" : ""} selected for batch sign-off
                </p>
                {selectedCritical > 0 && (
                  <p className="mt-0.5 text-[11px] text-amber-800">
                    {selectedCritical} contain critical values; these are skipped unless the call-back has been documented.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedApprovals(new Set())}
                className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-900"
              >
                Clear selection
              </button>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                Batch sign selected
              </button>
            </div>
          </div>
        )}

        {/* Connection / load error */}
        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div>
                <p className="text-xs font-semibold text-red-900">The approval worklist could not be loaded.</p>
                <p className="mt-0.5 text-xs text-red-700">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={refreshAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        )}

        {/* Worklist / workstation */}
        {viewMode === "workstation" ? (
          <DoctorWorkstationView
            approvals={approvals}
            loading={loading}
            onApprove={handleApprove}
            onReject={handleReject}
            onRequestRerun={requestRerun}
            onRefresh={refreshAll}
          />
        ) : (
          <>
            <ApprovalTable
              approvals={approvals}
              loading={loading}
              total={totalResults}
              onApprove={requestQuickApprove}
              onReject={handleReject}
              onReview={(approval) => {
                setSelectedApproval(approval);
                setIsReviewModalOpen(true);
              }}
              onRequestRerun={requestRerun}
              onCriticalCall={setCallTargetApproval}
              selectedApprovals={selectedApprovals}
              onSelectApproval={handleSelectApproval}
              onSelectAll={handleSelectAll}
            />

            {totalResults > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <p className="text-xs text-slate-500">
                  Showing <strong className="text-slate-900">{firstRow}-{lastRow}</strong> of{" "}
                  <strong className="text-slate-900">{totalResults}</strong>
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      Page <strong className="text-slate-900">{page}</strong> of{" "}
                      <strong className="text-slate-900">{totalPages}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

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

      <ApprovalRulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />

      {callTargetApproval && (
        <CriticalPanicCallModal
          isOpen
          onClose={() => setCallTargetApproval(null)}
          resultId={String(callTargetApproval.resultId)}
          orderNumber={callTargetApproval.orderNumber}
          patientName={callTargetApproval.patientName}
          criticalParameters={(callTargetApproval.criticalValues || []).map((name) => ({
            name,
            value: "Above critical limit",
          }))}
          onSuccess={() => {
            setCallTargetApproval(null);
            showSuccess("Critical value call-back recorded.");
            refreshAll();
          }}
        />
      )}

      {isBatchModalOpen && (
        <BatchApprovalModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          selectedApprovals={selectedList}
          onSuccess={(approvedCount, skippedCount) => {
            setSelectedApprovals(new Set());
            refreshAll();
            showSuccess(`${approvedCount} report${approvedCount === 1 ? "" : "s"} signed.`);
            if (skippedCount > 0) {
              showWarning(`${skippedCount} skipped: critical values without a documented call-back.`, 6000);
            }
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(approveTarget)}
        title="Approve this result?"
        confirmLabel="Approve & sign"
        busy={actionBusy}
        description={
          approveTarget ? (
            <>
              <strong className="text-slate-900">{approveTarget.testName || "Laboratory test"}</strong> for{" "}
              <strong className="text-slate-900">{approveTarget.patientName}</strong>
              {approveTarget.orderNumber ? ` (${approveTarget.orderNumber})` : ""} will be signed with your electronic
              seal and released for reporting.
            </>
          ) : null
        }
        onConfirm={confirmQuickApprove}
        onCancel={() => !actionBusy && setApproveTarget(null)}
      />

      <ReasonDialog
        open={Boolean(reasonDialog)}
        tone={reasonDialog?.kind === "reject" ? "danger" : "warning"}
        title={reasonDialog?.kind === "reject" ? "Reject result" : "Return for rerun"}
        confirmLabel={reasonDialog?.kind === "reject" ? "Reject result" : "Return for rerun"}
        label={reasonDialog?.kind === "reject" ? "Reason for rejection" : "Reason for rerun"}
        placeholder={
          reasonDialog?.kind === "reject"
            ? "e.g. Value inconsistent with clinical history; verify and re-enter"
            : "e.g. Sample hemolysed; request fresh sample"
        }
        description={
          reasonDialog ? (
            <>
              {reasonDialog.approval.testName || "Result"} - {reasonDialog.approval.patientName}
              {reasonDialog.approval.orderNumber ? ` (${reasonDialog.approval.orderNumber})` : ""}. The reason is shown
              to the technician and kept in the audit trail.
            </>
          ) : null
        }
        busy={actionBusy}
        onConfirm={confirmReason}
        onCancel={() => !actionBusy && setReasonDialog(null)}
      />

      {isQcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto">
            <LeveyJenningsChart testCode="K" onClose={() => setIsQcModalOpen(false)} />
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
        <DashboardLayout title="Pathologist Approvals">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0284C7] border-t-transparent" />
              <p className="text-xs text-slate-500">Loading approval worklist...</p>
            </div>
          </div>
        </DashboardLayout>
      }
    >
      <ApprovalsContent />
    </Suspense>
  );
}
