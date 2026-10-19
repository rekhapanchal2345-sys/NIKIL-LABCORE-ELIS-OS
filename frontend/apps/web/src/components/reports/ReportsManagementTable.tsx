"use client";

import React, { useState } from "react";
import { BulkOrderCommunicationModal } from "@/components/orders/OrderCommunicationHubModal";
import ReportAddendumModal from "@/components/reports/modals/ReportAddendumModal";
import DigitalSignatureModal from "@/components/reports/modals/DigitalSignatureModal";
import RejectionReasonModal from "@/components/reports/modals/RejectionReasonModal";
import ShareLinkModal from "@/components/reports/modals/ShareLinkModal";
import QRCodeModal from "@/components/reports/modals/QRCodeModal";
import PasswordProtectModal from "@/components/reports/modals/PasswordProtectModal";
import ReportAmendmentModal from "@/components/reports/modals/ReportAmendmentModal";
import DoctorDispatchModal from "@/components/reports/modals/DoctorDispatchModal";
import ReportDispatchModal from "@/components/reports/ReportDispatchModal";
import { 
  Download, 
  MessageCircle, 
  Mail, 
  Smartphone,
  Printer, 
  Eye, 
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle,
  PenLine,
  Clock,
  FileText,
  ShieldCheck,
  CalendarClock,
  UserRound,
  FlaskConical,
  CircleDot,
  ScanLine,
  ChevronDown,
  Copy,
  History,
  Send,
  Edit3, MessageSquarePlus, BadgeCheck, Stamp, Layers3, LockKeyhole, Link2,
  QrCode, ReceiptText, UserRoundCheck
  , AlertOctagon, CheckCheck, RotateCcw, Stethoscope, TimerReset
} from "lucide-react";
import { reportsApi } from "@/lib/api";
import { downloadPDF, generateReportPDF, mergePDFs } from "@/lib/pdf-operations";
import { formatPatientFullName } from "@/lib/patient-utils";

interface ReportRow {
  id: string;
  orderId: string;
  testId: string;
  status: string;
  publishedAt: string;
  createdAt?: string;
  approvedAt?: string;
  criticalFlag?: boolean;
  version?: number | string;
  reportVersion?: number | string;
  amended?: boolean;
  test: {
    id: string;
    testCode: string;
    testName: string;
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
    };
  };
  approvedBy?: {
    id: string;
    fullName: string;
    employeeCode: string;
    signatureUrl?: string;
  };
  deliveryStatus: string;
  deliveryMethod: string | null;
  reportReferenceId: string;
}

interface ReportsManagementTableProps {
  reports: ReportRow[];
  loading: boolean;
  onViewReport: (orderId: string) => void;
  onRefresh: () => void;
}

const advancedActionGroups = [
  {
    label: "Clinical correction",
    actions: [
      ["amend", "Edit / Amend report", Edit3, "Correction with audit trail"],
      ["addendum", "Add addendum / comment", MessageSquarePlus, "Attach a doctor note"],
    ],
  },
  {
    label: "Verification & authorization",
    actions: [
      ["approve", "Approve inline", BadgeCheck, "Quick verify action"],
      ["reject", "Reject inline", XCircle, "Requires an audit reason"],
      ["signature", "Digital signature / stamp", Stamp, "Apply authorized sign-off"],
    ],
  },
  {
    label: "Secure document tools",
    actions: [
      ["merge", "Merge multiple reports", Layers3, "Combine same-patient PDFs"],
      ["password", "Password protect PDF", LockKeyhole, "Sensitive report security"],
      ["share", "Generate secure share link", Link2, "Expiring patient-portal access"],
      ["qr", "Generate verification QR", QrCode, "Fraud-prevention verification"],
    ],
  },
  {
    label: "Patient & billing",
    actions: [
      ["doctor", "Send to referring doctor", Stethoscope, "Secure doctor delivery"],
      ["invoice", "Link to invoice", ReceiptText, "Open related billing"],
      ["history", "Add to patient history", UserRoundCheck, "Open patient timeline"],
    ],
  },
] as const;

export default function ReportsManagementTable({
  reports,
  loading,
  onViewReport,
  onRefresh,
}: ReportsManagementTableProps) {
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [copiedReference, setCopiedReference] = useState<string | null>(null);
  const [showBulkDispatch, setShowBulkDispatch] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  
  // Modal states
  const [showAddendumModal, setShowAddendumModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showShareLinkModal, setShowShareLinkModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAmendmentModal, setShowAmendmentModal] = useState(false);
  const [showDoctorDispatchModal, setShowDoctorDispatchModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchInitialChannel, setDispatchInitialChannel] = useState<"WHATSAPP" | "EMAIL" | "BOTH">("WHATSAPP");
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);

  const handleSelectReport = (reportId: string) => {
    const newSelection = new Set(selectedReports);
    if (newSelection.has(reportId)) {
      newSelection.delete(reportId);
    } else {
      newSelection.add(reportId);
    }
    setSelectedReports(newSelection);
    setIsAllSelected(newSelection.size === reports.length);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedReports(new Set(reports.map(r => r.id)));
      setIsAllSelected(true);
    } else {
      setSelectedReports(new Set());
      setIsAllSelected(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedReports(new Set());
    setIsAllSelected(false);
  };

  const selectedReportOrders = reports
    .filter((report) => selectedReports.has(report.id))
    .map((report) => ({
      id: report.orderId,
      orderNumber: report.order.orderNumber,
      patient: report.order.patient,
      doctor: report.order.doctor,
      items: [{ test: report.test }],
    }));

  const toggleExpanded = (reportId: string) => {
    const next = new Set(expandedReports);
    if (next.has(reportId)) next.delete(reportId);
    else next.add(reportId);
    setExpandedReports(next);
  };

  const handleCopyReference = async (report: ReportRow) => {
    await navigator.clipboard.writeText(report.reportReferenceId);
    setCopiedReference(report.id);
    window.setTimeout(() => setCopiedReference(null), 1600);
  };

  const handleDownloadReport = async (report: ReportRow) => {
    if (!report.orderId) {
      alert("This report is missing its order reference.");
      return;
    }

    // The premium PDF is generated by the order-report page; route through
    // its client-side generator instead of treating the JSON API response as a file.
    window.location.assign(`/reports/order/${report.orderId}?action=download`);
  };

  const handlePrintReport = async (report: ReportRow, printType: string = "standard") => {
    try {
      const response = await reportsApi.printReport(report.id, {
        printType,
        reportReferenceId: report.reportReferenceId,
      });
      if (response.success) {
        window.print();
      }
    } catch (error) {
      console.error("Print failed:", error);
      alert("Failed to print report. Please try again.");
    }
  };

  const handleAdvancedAction = async (action: string, report: ReportRow) => {
    setOpenActionMenu(null);
    setSelectedReport(report);
    
    switch (action) {
      case "amend":
        setShowAmendmentModal(true);
        break;
      case "addendum":
        setShowAddendumModal(true);
        break;
      case "approve":
        try {
          await reportsApi.inlineApprove(report.id);
          setActionNotice(`Report ${report.reportReferenceId} approved successfully`);
          onRefresh();
        } catch (error) {
          setActionNotice(`Failed to approve report: ${error}`);
        }
        break;
      case "reject":
        setShowRejectionModal(true);
        break;
      case "signature":
        setShowSignatureModal(true);
        break;
      case "merge":
        {
          const reportsToMerge = reports.filter((item) => selectedReports.has(item.id));
          const patientIds = new Set(reportsToMerge.map((item) => item.order.patient.id));
          if (reportsToMerge.length < 2) {
            setActionNotice("Select at least two reports for the same patient to create a combined PDF.");
          } else if (patientIds.size > 1) {
            setActionNotice("For privacy, select reports belonging to one patient only before merging.");
          } else {
            try {
              const sourcePdfs = await Promise.all(
                reportsToMerge.map(async (item) =>
                  (await generateReportPDF(item, {
                    metadata: { title: item.reportReferenceId, subject: "Laboratory report" },
                  })).arrayBuffer()
                )
              );
              const mergedPdf = await mergePDFs(sourcePdfs, {
                metadata: {
                  title: `Combined reports · ${report.order.patient.uhid}`,
                  subject: "Combined laboratory reports",
                },
              });
              downloadPDF(mergedPdf, `combined-reports-${report.order.patient.uhid}.pdf`);
              setActionNotice(`${reportsToMerge.length} reports merged into one PDF.`);
            } catch (error) {
              console.error("Report merge failed:", error);
              setActionNotice("Could not merge the selected reports. Please try again.");
            }
          }
        }
        break;
      case "password":
        setShowPasswordModal(true);
        break;
      case "share":
        setShowShareLinkModal(true);
        break;
      case "qr":
        setShowQRCodeModal(true);
        break;
      case "invoice":
        window.open(`/invoices?orderId=${encodeURIComponent(report.orderId)}`, "_blank", "noopener,noreferrer");
        break;
      case "doctor":
        if (!report.order.doctor?.id) {
          setActionNotice("No referring doctor is linked to this report.");
          break;
        }
        setShowDoctorDispatchModal(true);
        break;
      case "history":
        try {
          await reportsApi.addToPatientHistory(report.id);
          setActionNotice(`Report added to patient history successfully`);
          onRefresh();
        } catch (error) {
          setActionNotice(`Failed to add to patient history: ${error}`);
        }
        break;
    }
    window.setTimeout(() => setActionNotice(null), 3200);
  };

  const isVerified = (report: ReportRow) =>
    Boolean(report.approvedBy) ||
    ["APPROVED", "PUBLISHED", "VERIFIED", "COMPLETED"].includes(
      report.status.toUpperCase()
    );

  const getApprovalEscalation = (report: ReportRow) => {
    if (isVerified(report) || report.approvedAt) return null;
    const start = report.createdAt || report.publishedAt;
    const hours = (Date.now() - new Date(start).getTime()) / 3600000;
    if (!Number.isFinite(hours) || hours < 24) return null;
    return { hours: Math.floor(hours), critical: hours >= 48 };
  };

  const getVerificationBadge = (report: ReportRow) =>
    isVerified(report) ? (
      <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
        <ShieldCheck className="h-3 w-3" />
        Verified report
      </span>
    ) : (
      <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
        <Clock className="h-3 w-3" />
        Verification watch
      </span>
    );

  const getDeliveryProgress = (status: string) => {
    if (["WHATSAPP_READ", "EMAIL_READ"].includes(status)) return 100;
    if (status === "WHATSAPP_DELIVERED" || status === "EMAIL_DELIVERED") return 80;
    if (["WHATSAPP_SENT", "EMAIL_SENT"].includes(status)) return 55;
    if (status === "HARD_COPY_PRINTED") return 75;
    if (status === "UNDELIVERED") return 25;
    return 50;
  };

  const isCritical = (report: ReportRow) =>
    Boolean(report.criticalFlag) ||
    report.status.toUpperCase().includes("CRITICAL") ||
    report.status.toUpperCase().includes("PANIC");

  const getTat = (report: ReportRow) => {
    if (!report.createdAt || !report.publishedAt) return null;
    const hours = (new Date(report.publishedAt).getTime() - new Date(report.createdAt).getTime()) / 3600000;
    return Number.isFinite(hours) && hours >= 0 ? hours : null;
  };

  const getVersionLabel = (report: ReportRow) => {
    const version = report.version ?? report.reportVersion;
    if (report.amended || version && Number(version) > 1) return `v${version || 2} · Amended`;
    return `v${version || 1}`;
  };

  const getReadReceipt = (status: string) => {
    const normalized = status.toUpperCase();
    const read = normalized.includes("READ");
    const delivered = read || normalized.includes("DELIVERED");
    const sent = delivered || normalized.includes("SENT");
    return [
      { label: "Sent", active: sent },
      { label: "Delivered", active: delivered },
      { label: "Read", active: read },
    ];
  };

  const handleRetryDelivery = (report: ReportRow) => {
    setSelectedReports(new Set([report.id]));
    setIsAllSelected(false);
    setShowBulkDispatch(true);
    setActionNotice(`Resend workflow ready for ${report.reportReferenceId}`);
    window.setTimeout(() => setActionNotice(null), 3200);
  };

  const getVerificationConfidence = (report: ReportRow) =>
    isVerified(report) ? 100 : report.status.toUpperCase() === "PENDING" ? 45 : 72;

  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case "WHATSAPP_DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200">
            <MessageCircle className="h-3 w-3" />
            WhatsApp Delivered
          </span>
        );
      case "EMAIL_DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
            <Mail className="h-3 w-3" />
            Email Sent
          </span>
        );
      case "HARD_COPY_PRINTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
            <Printer className="h-3 w-3" />
            Hard Copy Printed
          </span>
        );
      case "UNDELIVERED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200">
            <XCircle className="h-3 w-3" />
            Undelivered
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 border border-gray-200">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
    }
  };

  const getDeliveryChannel = (report: ReportRow) => {
    const channel = `${report.deliveryMethod || ""} ${report.deliveryStatus || ""}`.toUpperCase();
    if (channel.includes("WHATSAPP")) {
      return { label: "WhatsApp", Icon: MessageCircle, className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
    }
    if (channel.includes("EMAIL") || channel.includes("MAIL")) {
      return { label: "Email", Icon: Mail, className: "border-blue-200 bg-blue-50 text-blue-700" };
    }
    if (channel.includes("SMS")) {
      return { label: "SMS", Icon: Smartphone, className: "border-violet-200 bg-violet-50 text-violet-700" };
    }
    return { label: "Pending", Icon: Send, className: "border-slate-200 bg-slate-50 text-slate-500" };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedReports.size > 0 && (
        <div className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-indigo-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedReports.size} report{selectedReports.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleClearSelection}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear selection
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowBulkDispatch(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-4 py-2 text-xs font-black text-white shadow-md transition hover:from-cyan-700 hover:to-indigo-700"
            >
              <Send className="h-4 w-4" />
              Dispatch selected reports
            </button>
          </div>
        </div>
      )}

      <BulkOrderCommunicationModal
        isOpen={showBulkDispatch}
        onClose={() => setShowBulkDispatch(false)}
        orders={selectedReportOrders}
        onSuccess={() => {
          setShowBulkDispatch(false);
          handleClearSelection();
          onRefresh();
        }}
      />

      {/* Premium Action Modals */}
      {selectedReport && (
        <>
          <ReportAddendumModal
            isOpen={showAddendumModal}
            onClose={() => setShowAddendumModal(false)}
            reportId={selectedReport.id}
            onSuccess={() => {
              setShowAddendumModal(false);
              onRefresh();
            }}
          />
          
          <DigitalSignatureModal
            isOpen={showSignatureModal}
            onClose={() => setShowSignatureModal(false)}
            reportId={selectedReport.id}
            onSuccess={() => {
              setShowSignatureModal(false);
              onRefresh();
            }}
          />
          
          <RejectionReasonModal
            isOpen={showRejectionModal}
            onClose={() => setShowRejectionModal(false)}
            reportId={selectedReport.id}
            reportReferenceId={selectedReport.reportReferenceId}
            onSuccess={() => {
              setShowRejectionModal(false);
              onRefresh();
            }}
          />
          
          <ShareLinkModal
            isOpen={showShareLinkModal}
            onClose={() => setShowShareLinkModal(false)}
            reportId={selectedReport.id}
            reportReferenceId={selectedReport.reportReferenceId}
            onSuccess={() => {
              setShowShareLinkModal(false);
            }}
          />
          
          <QRCodeModal
            isOpen={showQRCodeModal}
            onClose={() => setShowQRCodeModal(false)}
            reportId={selectedReport.id}
            reportReferenceId={selectedReport.reportReferenceId}
          />
          
          <PasswordProtectModal
            isOpen={showPasswordModal}
            onClose={() => setShowPasswordModal(false)}
            report={selectedReport}
            reportReferenceId={selectedReport.reportReferenceId}
          />
          
          <ReportAmendmentModal
            isOpen={showAmendmentModal}
            onClose={() => setShowAmendmentModal(false)}
            reportId={selectedReport.id}
            reportReferenceId={selectedReport.reportReferenceId}
            onSuccess={() => {
              setShowAmendmentModal(false);
              onRefresh();
            }}
          />

          <DoctorDispatchModal
            isOpen={showDoctorDispatchModal}
            onClose={() => setShowDoctorDispatchModal(false)}
            reportId={selectedReport.id}
            reportReferenceId={selectedReport.reportReferenceId}
            doctor={selectedReport.order.doctor}
            onSuccess={() => {
              setShowDoctorDispatchModal(false);
              setActionNotice(`Report sent to Dr. ${selectedReport.order.doctor?.fullName}.`);
              onRefresh();
            }}
          />

          {/* ── Advanced WhatsApp & Email Report Dispatch Modal ── */}
          <ReportDispatchModal
            isOpen={showDispatchModal}
            onClose={() => setShowDispatchModal(false)}
            report={{
              id: selectedReport.id,
              orderId: selectedReport.orderId,
              orderNumber: selectedReport.order.orderNumber,
              reportReferenceId: selectedReport.reportReferenceId,
              testName: selectedReport.test.testName,
              testCode: selectedReport.test.testCode,
              status: selectedReport.status,
              publishedAt: selectedReport.publishedAt,
              criticalFlag: selectedReport.criticalFlag,
              patient: {
                id: selectedReport.order.patient.id,
                firstName: selectedReport.order.patient.firstName,
                lastName: selectedReport.order.patient.lastName,
                uhid: selectedReport.order.patient.uhid,
                phone: selectedReport.order.patient.phone,
              },
              doctor: selectedReport.order.doctor
                ? { id: selectedReport.order.doctor.id, fullName: selectedReport.order.doctor.fullName }
                : null,
              approvedBy: selectedReport.approvedBy
                ? { fullName: selectedReport.approvedBy.fullName, employeeCode: selectedReport.approvedBy.employeeCode }
                : null,
              deliveryStatus: selectedReport.deliveryStatus,
            }}
            onSuccess={({ channel, recipient }) => {
              setActionNotice(`Report dispatched via ${channel} to ${recipient}`);
              setShowDispatchModal(false);
              onRefresh();
            }}
          />
        </>
      )}

      {/* Reports worklist */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-slate-950/80">
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-cyan-400 shadow-lg shadow-cyan-500/10"><FileText className="h-5 w-5" /></span>
              <div>
                <h2 className="text-sm font-bold tracking-wide text-white">Diagnostic report worklist</h2>
                <p className="text-xs text-slate-400">Verification-first reporting and delivery control</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-cyan-300 shadow-sm shadow-cyan-500/10">{reports.length} visible</span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-300 shadow-sm shadow-emerald-500/10">{reports.filter(isVerified).length} verified</span>
              <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-rose-300 shadow-sm shadow-rose-500/10">{reports.filter(r => r.deliveryStatus === "UNDELIVERED").length} action</span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-300 shadow-sm shadow-amber-500/10">{reports.filter((r) => getApprovalEscalation(r)).length} approval escalation</span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-800 pt-4 text-[10px] font-semibold text-slate-400">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Verified report</span>
            <span className="flex items-center gap-1.5"><CircleDot className="h-3.5 w-3.5 text-amber-400" /> Delivery watch</span>
            <span className="flex items-center gap-1.5"><ScanLine className="h-3.5 w-3.5 text-cyan-400" /> Reference linked</span>
            <span className="ml-auto hidden text-slate-500 md:block">Operational dispatch lane</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
              <tr>
                <th className="border-r border-slate-800 px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-800 accent-cyan-500"
                  />
                </th>
                <th className="border-r border-slate-800 px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
                  <div>Report Reference</div><span className="text-[9px] font-medium normal-case tracking-normal text-cyan-400">Accession + verified chain</span>
                </th>
                <th className="border-r border-slate-800 px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
                  <div>Patient Info</div><span className="text-[9px] font-medium normal-case tracking-normal text-cyan-400">Identity + contact</span>
                </th>
                <th className="border-r border-slate-800 px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
                  <div>Tests / Package</div><span className="text-[9px] font-medium normal-case tracking-normal text-cyan-400">Clinical scope</span>
                </th>
                <th className="border-r border-slate-800 px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
                  <div>Approved Date &amp; Doctor</div><span className="text-[9px] font-medium normal-case tracking-normal text-cyan-400">Verified audit trail</span>
                </th>
                <th className="border-r border-slate-800 px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
                  <div>Delivery Status</div><span className="text-[9px] font-medium normal-case tracking-normal text-cyan-400">Dispatch state</span>
                </th>
                <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
                  <div>Actions</div><span className="text-[9px] font-medium normal-case tracking-normal text-cyan-400">Workflow controls</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-slate-400">Loading reports...</p>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <FileText className="mx-auto h-12 w-12 text-slate-600" />
                    <p className="mt-2 text-sm font-semibold text-slate-300">
                      No reports found
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Published laboratory reports will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <React.Fragment key={report.id}>
                  <tr className={`group border-t transition ${
                    getApprovalEscalation(report)?.critical
                      ? "border-l-4 border-l-rose-500 border-t-slate-800 bg-rose-950/20 hover:bg-rose-950/30"
                      : getApprovalEscalation(report)
                        ? "border-l-4 border-l-amber-500 border-t-slate-800 bg-amber-950/20 hover:bg-amber-950/30"
                        : isVerified(report)
                          ? "border-l-4 border-l-emerald-500 border-t-slate-800 bg-slate-950 hover:bg-slate-900/60"
                          : "border-t-slate-800 bg-slate-950 hover:bg-slate-900/60"
                  }`}>
                    <td className="border-r border-slate-800 px-4 py-5 align-top">
                      <input
                        type="checkbox"
                        checked={selectedReports.has(report.id)}
                        onChange={() => handleSelectReport(report.id)}
                        className="rounded border-slate-600 bg-slate-800 accent-cyan-500"
                      />
                    </td>
                    <td className="border-r border-slate-800 px-4 py-5 align-top">
                      <div className="flex items-start gap-2"><span className="mt-0.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-1.5 text-cyan-400"><FileText className="h-3.5 w-3.5" /></span><div><div className="flex items-center gap-1 font-mono text-sm font-bold text-white">
                        {report.reportReferenceId}
                        <button type="button" onClick={() => handleCopyReference(report)} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-cyan-400" title="Copy report reference">
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      {copiedReference === report.id && <span className="text-[10px] font-semibold text-emerald-400">Copied</span>}
                      <div className="mt-1 font-mono text-[11px] text-slate-500">
                        {report.order.orderNumber}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-black text-cyan-300">
                          {getVersionLabel(report)}
                        </span>
                        {isCritical(report) && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-rose-300" title="Critical value requires attention">
                            <AlertOctagon className="h-3 w-3" /> Critical
                          </span>
                        )}
                      </div>
                      {getVerificationBadge(report)}
                      </div></div>
                    </td>
                    <td className="border-r border-slate-800 px-4 py-5 align-top">
                      <div className="flex items-start gap-2"><span className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs ring-1 ring-cyan-500/30 shadow-md shadow-cyan-600/20">{report.order.patient.firstName.slice(0, 2).toUpperCase()}</span><div><div className="text-sm font-bold text-slate-200">
                        {formatPatientFullName(report.order.patient)}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        UHID: {report.order.patient.uhid}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {report.order.patient.phone}
                      </div></div></div>
                    </td>
                    <td className="border-r border-slate-800 px-4 py-5 align-top">
                      <div className="flex items-start gap-2"><FlaskConical className="mt-0.5 h-4 w-4 text-cyan-400" /><div><div className="text-sm font-semibold text-slate-200">
                        {report.test.testName}
                      </div>
                      <div className="mt-1 inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 font-mono text-[10px] font-bold text-cyan-300">
                        {report.test.testCode} • {report.test.sampleType}
                      </div></div></div>
                      {isCritical(report) && (
                        <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-[10px] font-bold text-rose-300">
                          <AlertOctagon className="h-3.5 w-3.5" /> Critical value alert · priority review
                        </div>
                      )}
                    </td>
                    <td className="border-r border-slate-800 px-4 py-5 align-top">
                      <div className="flex items-start gap-2"><CalendarClock className="mt-0.5 h-4 w-4 text-amber-400" /><div><div className="font-mono text-sm font-semibold text-slate-200">
                        {formatDate(report.publishedAt)}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500"><UserRound className="h-3 w-3" />
                        {report.approvedBy ? report.approvedBy.fullName : 'System'}
                      </div>
                      {getTat(report) !== null && (
                        <div className={`mt-2 inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold ${
                          getTat(report)! > 24 ? "border-rose-500/30 bg-rose-500/10 text-rose-300" : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                        }`}>
                          <TimerReset className="h-3 w-3" /> TAT {getTat(report)!.toFixed(1)}h{getTat(report)! > 24 ? " · SLA breach" : ""}
                        </div>
                      )}
                      <div className="group/signature relative mt-2 inline-flex">
                        <span className={`inline-flex cursor-help items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-black ${
                          report.approvedBy
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-slate-700 bg-slate-800/50 text-slate-400"
                        }`}>
                          <PenLine className="h-3 w-3" />
                          {report.approvedBy ? "Doctor signature attached" : "Signature pending"}
                        </span>
                        <div className="pointer-events-none invisible absolute bottom-full left-0 z-30 mb-2 w-64 translate-y-1 rounded-2xl border border-slate-700 bg-slate-900 p-3 text-left opacity-0 shadow-2xl shadow-slate-950/80 transition-all duration-150 group-hover/signature:visible group-hover/signature:translate-y-0 group-hover/signature:opacity-100">
                          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                            <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                              report.approvedBy ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            }`}>
                              <PenLine className="h-3.5 w-3.5" />
                            </span>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Doctor signature preview</p>
                              <p className={`text-xs font-black ${report.approvedBy ? "text-emerald-400" : "text-amber-400"}`}>
                                {report.approvedBy ? "Digitally signed" : "Not signed yet"}
                              </p>
                            </div>
                          </div>
                          {report.approvedBy ? (
                            <div className="mt-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2">
                              {report.approvedBy.signatureUrl ? (
                                <img src={report.approvedBy.signatureUrl} alt="Doctor digital signature" className="h-9 max-w-full object-contain" />
                              ) : (
                                <p className="font-serif text-lg italic text-cyan-300">✓ {report.approvedBy.fullName}</p>
                              )}
                              <p className="mt-1 text-[9px] text-slate-500">
                                {report.approvedBy.fullName} • {report.approvedBy.employeeCode}
                              </p>
                              <p className="mt-1 text-[9px] font-semibold text-emerald-400">Verified in report audit chain</p>
                            </div>
                          ) : (
                            <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                              Approval is pending. A doctor signature preview will appear after authorized verification.
                            </p>
                          )}
                        </div>
                      </div>
                      {getApprovalEscalation(report) && (
                        <div className={`mt-2 inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-black ${
                          getApprovalEscalation(report)?.critical
                            ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                        }`}>
                          <AlertTriangle className="h-3 w-3" />
                          Approval pending • {getApprovalEscalation(report)?.hours}h
                          <span className="uppercase tracking-wider">{getApprovalEscalation(report)?.critical ? "Escalate now" : "Review"}</span>
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                        <ShieldCheck className="h-3 w-3" />
                        {isVerified(report) ? "Audit chain verified" : "Awaiting verification"}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full rounded-full ${isVerified(report) ? "bg-emerald-500" : "bg-amber-400"}`}
                            style={{ width: `${getVerificationConfidence(report)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{getVerificationConfidence(report)}% confidence</span>
                      </div>
                      </div></div>
                    </td>
                    <td className="border-r border-slate-800 px-4 py-5 align-top">
                      {(() => {
                        const deliveryChannel = getDeliveryChannel(report);
                        const ChannelIcon = deliveryChannel.Icon;
                        return (
                          <div className={`mb-2 inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${deliveryChannel.className}`} title={`Delivery channel: ${deliveryChannel.label}`}>
                            <ChannelIcon className="h-3.5 w-3.5" />
                            <span>{deliveryChannel.label}</span>
                          </div>
                        );
                      })()}
                      {getDeliveryStatusBadge(report.deliveryStatus)}
                      <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-900/80 px-2 py-2">
                        {getReadReceipt(report.deliveryStatus).map((step, index) => (
                          <React.Fragment key={step.label}>
                            <span className={`inline-flex items-center gap-1 text-[9px] font-black ${step.active ? "text-emerald-400" : "text-slate-600"}`}>
                              <CheckCheck className="h-3 w-3" />{step.label}
                            </span>
                            {index < 2 && <span className="h-px flex-1 bg-slate-700" />}
                          </React.Fragment>
                        ))}
                      </div>
                      {report.deliveryStatus === "UNDELIVERED" && (
                        <button
                          type="button"
                          onClick={() => handleRetryDelivery(report)}
                          className="mt-2 inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] font-black text-rose-300 transition hover:bg-rose-500/20"
                        >
                          <RotateCcw className="h-3 w-3" /> Retry / Resend
                        </button>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full rounded-full ${
                              getDeliveryProgress(report.deliveryStatus) === 100
                                ? "bg-emerald-500"
                                : report.deliveryStatus === "UNDELIVERED"
                                  ? "bg-rose-500"
                                  : "bg-amber-400"
                            }`}
                            style={{ width: `${getDeliveryProgress(report.deliveryStatus)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-500">
                          {getDeliveryProgress(report.deliveryStatus)}%
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {report.deliveryMethod || "Dispatch channel pending"}
                      </p>
                    </td>
                    <td className="px-4 py-5 align-top">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button
                          onClick={() => toggleExpanded(report.id)}
                          className={`rounded-lg border p-2 transition-all ${expandedReports.has(report.id) ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300 shadow-md shadow-cyan-500/10" : "border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-cyan-300"}`}
                          title="Verification details"
                          aria-expanded={expandedReports.has(report.id)}
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${expandedReports.has(report.id) ? "rotate-180" : ""}`} />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onViewReport(report.orderId);
                          }}
                          className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2 text-cyan-400 transition-all hover:bg-cyan-500/20 hover:text-cyan-200"
                          title="Open verified report"
                          aria-label={`Open report ${report.reportReferenceId}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadReport(report)}
                          className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-2 text-blue-400 transition-all hover:bg-blue-500/20 hover:text-blue-200"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <a
                          href="/reports.html"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-400 transition-all hover:bg-sky-500/20 hover:text-sky-200"
                          title="Open Full A4 Master Report & Print Studio"
                        >
                          <Printer className="h-4 w-4" />
                        </a>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenActionMenu(openActionMenu === report.id ? null : report.id)}
                            className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-2 text-violet-400 transition-all hover:bg-violet-500/20 hover:text-violet-200"
                            title="Advanced report actions"
                            aria-expanded={openActionMenu === report.id}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openActionMenu === report.id && (
                            <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-left shadow-2xl shadow-slate-950/80 premium-dropdown">
                              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 px-4 py-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-400">Premium command menu</p>
                                    <p className="mt-1 text-xs font-bold text-white">Advanced report actions</p>
                                  </div>
                                  <ShieldCheck className="h-5 w-5 text-cyan-400" />
                                </div>
                                <p className="mt-2 truncate text-[10px] text-slate-500">{report.reportReferenceId} · audit-aware workflow</p>
                              </div>
                              <div className="max-h-[min(68vh,30rem)] overflow-y-auto p-2 premium-scrollbar">
                              {advancedActionGroups.map((group) => (
                                <div key={group.label} className="py-1">
                                  <p className="px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">{group.label}</p>
                                  {group.actions.map(([key, label, Icon, description]) => (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => handleAdvancedAction(key, report)}
                                      className="group/action flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-slate-800 transition-colors"
                                    >
                                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 transition group-hover/action:border-cyan-500/30 group-hover/action:bg-cyan-500/10 group-hover/action:text-cyan-400">
                                        {React.createElement(Icon, { className: "h-4 w-4" })}
                                      </span>
                                      <span className="min-w-0"><span className="block text-xs font-bold text-slate-200">{label}</span><span className="block text-[10px] text-slate-500">{description}</span></span>
                                    </button>
                                  ))}
                                </div>
                              ))}
                              </div>
                              <div className="border-t border-slate-800 bg-slate-950/80 px-3 py-2">
                                <p className="text-[9px] font-semibold text-slate-600">
                                  Actions are logged against {report.reportReferenceId}. Sensitive PDF tools require authorization.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="relative group">
                          <button className="rounded-lg border border-slate-700 bg-slate-800/50 p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all">
                            <Printer className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-slate-950/80 hidden group-hover:block z-10 overflow-hidden">
                            <div className="py-1">
                              <button
                                onClick={() => handlePrintReport(report, "standard")}
                                className="block w-full text-left px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                              >
                                With Lab Header
                              </button>
                              <button
                                onClick={() => handlePrintReport(report, "letterhead")}
                                className="block w-full text-left px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                              >
                                On Pre-printed Letterhead
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      {actionNotice && (
                        <div className="fixed bottom-5 right-5 z-50 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 to-slate-900 px-4 py-3 text-xs font-bold text-white shadow-2xl shadow-slate-950/80 backdrop-blur-md">
                          {actionNotice}
                        </div>
                      )}
                    </td>
                  </tr>
                  {expandedReports.has(report.id) && (
                    <tr className="bg-slate-900/40">
                      <td colSpan={7} className="border-t border-slate-800 px-6 py-5">
                        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr]">
                          <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4 shadow-lg">
                            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                              <History className="h-4 w-4" /> Verification timeline
                            </div>
                            <div className="space-y-2 text-xs text-slate-400">
                              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" /> Report generated <span className="ml-auto font-mono text-slate-500">{formatDate(report.publishedAt)}</span></div>
                              <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full shadow-sm ${isVerified(report) ? "bg-emerald-500 shadow-emerald-500/50" : "bg-amber-400 shadow-amber-400/50"}`} /> {isVerified(report) ? "Pathologist verification complete" : "Awaiting pathologist verification"} <span className="ml-auto font-mono font-semibold text-slate-500">{getVerificationConfidence(report)}%</span></div>
                              <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full shadow-sm ${report.deliveryStatus !== "UNDELIVERED" ? "bg-cyan-500 shadow-cyan-500/50" : "bg-rose-500 shadow-rose-500/50"}`} /> Delivery checkpoint <span className="ml-auto font-mono text-slate-500">{report.deliveryStatus.replaceAll("_", " ")}</span></div>
                            </div>
                          </div>
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Verified identity</p>
                            <p className="mt-2 text-sm font-bold text-slate-200">{formatPatientFullName(report.order.patient)}</p>
                            <p className="mt-1 font-mono text-xs text-slate-500">UHID {report.order.patient.uhid}</p>
                            <p className="mt-3 text-xs font-semibold text-emerald-400">{isVerified(report) ? "Audit chain verified" : "Verification action required"}</p>
                          </div>
                          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Dispatch intelligence</p>
                            <p className="mt-2 text-sm font-bold text-slate-200">{report.test.testName}</p>
                            <p className="mt-1 font-mono text-xs text-slate-500">{report.test.testCode} · {report.test.sampleType}</p>
                            <p className="mt-3 text-xs font-semibold text-cyan-400">{report.deliveryMethod || "Channel pending"}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
