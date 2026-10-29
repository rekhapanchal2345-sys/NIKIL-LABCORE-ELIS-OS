"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FlaskConical,
  ChevronDown,
  UserCheck,
  UserX,
  CreditCard,
  DollarSign,
  Printer,
  Download,
  Ban,
  Share2,
  Eye,
  Edit,
  MoreVertical,
  Layers,
  Sparkles,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Search,
  X,
  Plus,
  Barcode as BarcodeIcon,
} from "lucide-react";
import { formatPatientFullName } from "@/lib/patient-utils";

// ==========================================
// 1. STATUS BADGE & INTERACTIVE PICKER
// ==========================================

export type OrderStatusType =
  | "DRAFT"
  | "REGISTERED"
  | "SAMPLE_COLLECTED"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

export const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string; icon: any }
> = {
  DRAFT: {
    label: "Draft",
    bg: "bg-slate-50 dark:bg-slate-800/40",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
    icon: Clock,
  },
  REGISTERED: {
    label: "Registered",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/50",
    dot: "bg-amber-500",
    icon: AlertCircle,
  },
  SAMPLE_COLLECTED: {
    label: "Sample Collected",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-800 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800/50",
    dot: "bg-purple-500",
    icon: FlaskConical,
  },
  PROCESSING: {
    label: "Processing",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-800 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800/50",
    dot: "bg-blue-500 animate-pulse",
    icon: RefreshCw,
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-800 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/50",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-800 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800/50",
    dot: "bg-rose-500",
    icon: XCircle,
  },
};

export function StatusBadge({
  status,
  isUpdating = false,
  interactive = false,
  onChange,
  disabled = false,
}: {
  status: string;
  isUpdating?: boolean;
  interactive?: boolean;
  onChange?: (newStatus: OrderStatusType) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const config = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.DRAFT;
  const Icon = config.icon;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (!interactive) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-xs transition-all ${config.bg} ${config.text} ${config.border}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </span>
    );
  }

  const allowedTransitions: OrderStatusType[] = [
    "DRAFT",
    "REGISTERED",
    "SAMPLE_COLLECTED",
    "PROCESSING",
    "COMPLETED",
    "CANCELLED",
  ];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled || isUpdating || status === "COMPLETED" || status === "CANCELLED"}
        onClick={() => setIsOpen(!isOpen)}
        className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-xs transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${config.bg} ${config.text} ${config.border} ${
          disabled || isUpdating ? "opacity-60 cursor-not-allowed" : ""
        }`}
        title={
          status === "COMPLETED" || status === "CANCELLED"
            ? "Order is finalized"
            : "Click to change status"
        }
      >
        {isUpdating ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
            <Icon className="h-3.5 w-3.5" />
          </>
        )}
        <span>{config.label}</span>
        {status !== "COMPLETED" && status !== "CANCELLED" && (
          <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-44 z-50 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
            Update Order Status
          </div>
          {allowedTransitions.map((st) => {
            const itemConfig = ORDER_STATUS_CONFIG[st];
            const ItemIcon = itemConfig.icon;
            const isSelected = st === status;
            return (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (st !== status && onChange) {
                    onChange(st);
                  }
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                  isSelected
                    ? "bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${itemConfig.dot}`} />
                <ItemIcon className="h-3.5 w-3.5" />
                <span>{itemConfig.label}</span>
                {isSelected && <span className="ml-auto text-[10px] text-blue-600 dark:text-blue-400">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. PRIORITY BADGE WITH STAT ALERT
// ==========================================

export function PriorityBadge({
  priority = "ROUTINE",
  showDescription = false,
}: {
  priority?: string;
  showDescription?: boolean;
}) {
  const p = (priority || "ROUTINE").toUpperCase();

  if (p === "STAT") {
    return (
      <div className="inline-flex items-center gap-1.5">
        <span
          className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-xs ring-2 ring-rose-500/20"
          title="STAT Emergency Order: Priority processing required immediately"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
          </span>
          <AlertTriangle className="h-3 w-3 text-rose-600 dark:text-rose-400 animate-bounce" />
          STAT
        </span>
        {showDescription && (
          <span className="text-[11px] text-rose-600 font-medium">Emergency (&lt; 1hr)</span>
        )}
      </div>
    );
  }

  if (p === "URGENT") {
    return (
      <div className="inline-flex items-center gap-1.5">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-xs"
          title="Urgent Priority: Expedited turnaround"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          URGENT
        </span>
        {showDescription && (
          <span className="text-[11px] text-amber-600 font-medium">Expedited (&lt; 4hrs)</span>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs"
        title="Routine Order: Standard lab processing"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        ROUTINE
      </span>
      {showDescription && (
        <span className="text-[11px] text-slate-500">Standard</span>
      )}
    </div>
  );
}

// ==========================================
// 3. PAYMENT PROGRESS BAR & BADGE
// ==========================================

export function PaymentProgressBar({
  paidAmount = 0,
  grandTotal = 0,
  paymentStatus = "PENDING",
  onAddPaymentClick,
}: {
  paidAmount?: number;
  grandTotal?: number;
  paymentStatus?: string;
  onAddPaymentClick?: () => void;
}) {
  const paid = Number(paidAmount) || 0;
  const total = Number(grandTotal) || 0;
  const due = Math.max(0, total - paid);
  const percentage = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  const isPaid = percentage >= 100 || paymentStatus === "PAID";
  const isPartial = percentage > 0 && percentage < 100;
  const isUnpaid = percentage === 0;

  return (
    <div className="w-full min-w-[130px] max-w-[170px] space-y-1.5 group">
      <div className="flex items-center justify-between text-xs">
        <span
          className={`font-semibold flex items-center gap-1 ${
            isPaid
              ? "text-emerald-700 dark:text-emerald-400"
              : isPartial
              ? "text-amber-700 dark:text-amber-400"
              : "text-rose-700 dark:text-rose-400"
          }`}
        >
          {isPaid ? "Paid" : isPartial ? `Due ₹${due.toLocaleString("en-IN")}` : "Unpaid"}
        </span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          ₹{paid.toLocaleString("en-IN")} / ₹{total.toLocaleString("en-IN")}
        </span>
      </div>

      {/* Progress Bar Track */}
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isPaid
              ? "bg-emerald-500"
              : isPartial
              ? "bg-amber-500"
              : "bg-rose-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {due > 0 && onAddPaymentClick && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddPaymentClick();
          }}
          className="text-[10px] text-blue-600 dark:text-blue-400 font-medium hover:underline opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
        >
          + Collect ₹{due.toLocaleString("en-IN")}
        </button>
      )}
    </div>
  );
}

// ==========================================
// 4. TURNAROUND TIME (TAT) INDICATOR
// ==========================================

export function TATIndicator({
  createdAt,
  tests = [],
  orderStatus,
}: {
  createdAt: string;
  tests?: Array<{
    test: {
      testName: string;
      tatHours?: number;
    };
  }>;
  orderStatus?: string;
}) {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffMins = Math.floor(diffMs / (1000 * 60));

  // Determine expected TAT (default 24h, or smallest TAT among tests if present)
  let expectedTatHours = 24;
  if (tests && tests.length > 0) {
    const validTats = tests
      .map((t) => t.test?.tatHours)
      .filter((tat): tat is number => typeof tat === "number" && tat > 0);
    if (validTats.length > 0) {
      expectedTatHours = Math.min(...validTats);
    }
  }

  const isCompleted = orderStatus === "COMPLETED";
  const isCancelled = orderStatus === "CANCELLED";
  const isBreached = !isCompleted && !isCancelled && diffHours > expectedTatHours;
  const isNearBreach = !isCompleted && !isCancelled && !isBreached && diffHours > expectedTatHours * 0.75;

  let elapsedDisplay = "";
  if (diffHours < 1) {
    elapsedDisplay = `${diffMins}m elapsed`;
  } else if (diffHours < 24) {
    elapsedDisplay = `${Math.floor(diffHours)}h ${diffMins % 60}m`;
  } else {
    const days = Math.floor(diffHours / 24);
    elapsedDisplay = `${days}d ${Math.floor(diffHours % 24)}h`;
  }

  if (isCompleted) {
    return (
      <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400" title="Order completed within lab TAT">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Completed</span>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="flex items-center gap-1 text-xs text-slate-400">
        <Ban className="h-3.5 w-3.5" />
        <span>Cancelled</span>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div
        className={`inline-flex items-center gap-1 text-xs font-mono font-medium ${
          isBreached
            ? "text-rose-600 dark:text-rose-400 font-bold"
            : isNearBreach
            ? "text-amber-600 dark:text-amber-400"
            : "text-slate-600 dark:text-slate-400"
        }`}
        title={`Elapsed: ${elapsedDisplay} | Target TAT: ${expectedTatHours} hrs`}
      >
        <Clock className={`h-3 w-3 ${isBreached ? "animate-spin text-rose-600" : ""}`} />
        <span>{elapsedDisplay}</span>
      </div>

      {isBreached && (
        <span className="block text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tight">
          ⚠ TAT Breached
        </span>
      )}
      {isNearBreach && (
        <span className="block text-[10px] font-semibold text-amber-600 dark:text-amber-400">
          Target: {expectedTatHours}h
        </span>
      )}
    </div>
  );
}

// ==========================================
// 5. INLINE SAMPLE COLLECTION STEPPER
// ==========================================

export function SampleStatusStepper({
  orderStatus,
  samples = [],
  sampleCollected = false,
  onQuickCollect,
}: {
  orderStatus: string;
  samples?: Array<{
    id: string;
    status: string;
    sampleType: string;
    sampleNumber?: string;
  }>;
  sampleCollected?: boolean;
  onQuickCollect?: () => void;
}) {
  // Stepper milestones:
  // 1: Pending (Registered)
  // 2: Collected
  // 3: Received in Lab
  // 4: Processing / Testing
  // 5: Completed
  let currentStep = 1;
  let statusText = "Not Collected";
  let stepColor = "text-slate-400";

  const hasSamples = samples && samples.length > 0;
  const anyProcessing = hasSamples && samples.some((s) => s.status === "PROCESSING");
  const anyReceived = hasSamples && samples.some((s) => s.status === "RECEIVED");
  const anyCollected = sampleCollected || (hasSamples && samples.some((s) => s.status === "COLLECTED"));
  const allCompleted = orderStatus === "COMPLETED";

  if (allCompleted) {
    currentStep = 5;
    statusText = "Completed";
    stepColor = "text-emerald-600 dark:text-emerald-400";
  } else if (orderStatus === "PROCESSING" || anyProcessing) {
    currentStep = 4;
    statusText = "In Analysis";
    stepColor = "text-blue-600 dark:text-blue-400";
  } else if (anyReceived) {
    currentStep = 3;
    statusText = "In Lab";
    stepColor = "text-indigo-600 dark:text-indigo-400";
  } else if (orderStatus === "SAMPLE_COLLECTED" || anyCollected) {
    currentStep = 2;
    statusText = "Collected";
    stepColor = "text-purple-600 dark:text-purple-400";
  }

  return (
    <div className="space-y-1 min-w-[120px]">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${stepColor}`}>{statusText}</span>
        {currentStep === 1 && onQuickCollect && orderStatus !== "CANCELLED" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickCollect();
            }}
            className="text-[10px] text-purple-600 hover:text-purple-700 font-medium hover:underline flex items-center gap-0.5"
          >
            Collect
          </button>
        )}
      </div>

      {/* Mini 4-dot stepper */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4].map((step) => {
          const isActive = currentStep >= step;
          return (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                isActive
                  ? currentStep === 5
                    ? "bg-emerald-500"
                    : currentStep === 4
                    ? "bg-blue-500"
                    : currentStep === 3
                    ? "bg-indigo-500"
                    : "bg-purple-500"
                  : "bg-slate-200 dark:bg-slate-800"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 6. TEST LIST POPOVER (Hover / Click)
// ==========================================

export function TestListPopover({
  items = [],
}: {
  items: Array<{
    id: string;
    test: {
      id: string;
      testCode: string;
      testName: string;
      sampleType: string;
    };
    price: number;
    finalPrice?: number;
  }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!items || items.length === 0) {
    return <span className="text-slate-400 text-xs">—</span>;
  }

  const firstTest = items[0]?.test?.testName || "Test";
  const remainingCount = items.length - 1;

  return (
    <div
      className="relative inline-block"
      ref={containerRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="flex items-center gap-1.5 cursor-pointer group">
        <span className="text-xs font-medium text-slate-900 dark:text-slate-200 max-w-[140px] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
          {firstTest}
        </span>
        {remainingCount > 0 && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            +{remainingCount}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 z-50 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FlaskConical className="h-3.5 w-3.5 text-blue-600" />
              Prescribed Tests ({items.length})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Sample Req.</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex items-start justify-between gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {item.test?.testName}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {item.test?.testCode}
                  </span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {item.test?.sampleType || "Blood"}
                  </span>
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                    ₹{item.finalPrice || item.price || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 7. DOCTOR COLUMN & QUICK ASSIGN
// ==========================================

export function DoctorCell({
  doctor,
  onAssignDoctorClick,
}: {
  doctor?: {
    id: string;
    doctorCode: string;
    fullName: string;
    specialization?: string;
  };
  onAssignDoctorClick?: () => void;
}) {
  if (doctor?.fullName) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
          {doctor.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
            {doctor.fullName}
          </p>
          <p className="text-[10px] text-slate-500 truncate">
            {doctor.specialization || "General Physician"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        <UserX className="h-3 w-3 text-slate-400" />
        Unassigned
      </span>
      {onAssignDoctorClick && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAssignDoctorClick();
          }}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold hover:underline"
        >
          Assign
        </button>
      )}
    </div>
  );
}

// ==========================================
// 8. ROW 3-DOT QUICK ACTION MENU
// ==========================================

export function OrderRowQuickActions({
  order,
  onView,
  onEdit,
  onAssignDoctor,
  onCollectSample,
  onAddPayment,
  onCancel,
  onWhatsApp,
  onPhlebotomyBarcodes,
}: {
  order: any;
  onView?: () => void;
  onEdit?: () => void;
  onAssignDoctor?: () => void;
  onCollectSample?: () => void;
  onAddPayment?: () => void;
  onCancel?: () => void;
  onWhatsApp?: () => void;
  onPhlebotomyBarcodes?: () => void;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const isCompleted = order.orderStatus === "COMPLETED";
  const isCancelled = order.orderStatus === "CANCELLED";

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="More actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-56 z-50 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-1.5 text-xs animate-in fade-in duration-100">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              if (onView) {
                onView();
              } else {
                router.push(`/orders/${order.id}`);
              }
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Eye className="h-4 w-4 text-blue-600" />
            <span>View Order Details</span>
          </button>

          {onPhlebotomyBarcodes && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onPhlebotomyBarcodes();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
            >
              <BarcodeIcon className="h-4 w-4 text-indigo-600" />
              <span>Phlebotomy Tube Barcodes</span>
            </button>
          )}

          <a
            href={`/orders/${order.id}/barcode`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Printer className="h-4 w-4 text-purple-600" />
            <span>Print Barcode Labels</span>
          </a>

          <a
            href={`/orders/${order.id}/receipt`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Print Receipt / Bill</span>
          </a>

          {onWhatsApp && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onWhatsApp();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <Share2 className="h-4 w-4 text-emerald-600" />
              <span>Send WhatsApp Alert</span>
            </button>
          )}

          {!isCompleted && !isCancelled && (
            <>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              {onCollectSample && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onCollectSample();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <FlaskConical className="h-4 w-4 text-amber-600" />
                  <span>Collect Sample</span>
                </button>
              )}

              {onAddPayment && order.dueAmount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onAddPayment();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  <span>Record Payment</span>
                </button>
              )}

              {!order.doctor && onAssignDoctor && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onAssignDoctor();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <span>Assign Doctor</span>
                </button>
              )}

              {onCancel && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onCancel();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Ban className="h-4 w-4 text-rose-600" />
                  <span>Cancel Order</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 9. FLOATING BULK ACTIONS BAR
// ==========================================

export function FloatingBulkActionBar({
  selectedCount,
  onClear,
  onBulkStatus,
  onBulkExport,
  onBulkCancel,
  onPrintLabels,
  onPrintRunSheet,
  onBulkNotify,
}: {
  selectedCount: number;
  onClear: () => void;
  onBulkStatus: (newStatus: OrderStatusType) => void;
  onBulkExport: () => void;
  onBulkCancel: () => void;
  onPrintLabels: () => void;
  onPrintRunSheet?: () => void;
  onBulkNotify?: () => void;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white shadow-2xl border border-slate-700/60 ring-1 ring-white/10">
        <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
            {selectedCount}
          </span>
          <span className="text-xs font-medium text-slate-300">Selected</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onBulkNotify && (
            <button
              type="button"
              onClick={onBulkNotify}
              className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition-colors text-white shadow-xs"
              title="Send Bulk WhatsApp & Email Notifications"
            >
              <Share2 className="h-3.5 w-3.5 text-white" />
              <span>Bulk Notify</span>
            </button>
          )}

          {/* Status Dropdown */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                onBulkStatus(e.target.value as OrderStatusType);
                e.target.value = "";
              }
            }}
            defaultValue=""
            className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="" disabled>
              Update Status...
            </option>
            <option value="REGISTERED">Set Registered</option>
            <option value="SAMPLE_COLLECTED">Set Sample Collected</option>
            <option value="PROCESSING">Set Processing</option>
            <option value="COMPLETED">Set Completed</option>
          </select>

          <button
            type="button"
            onClick={onPrintLabels}
            className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-purple-400" />
            <span>Labels</span>
          </button>

          {onPrintRunSheet && (
            <button
              type="button"
              onClick={onPrintRunSheet}
              className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
              title="Print specimen collection worklist"
            >
              <FlaskConical className="h-3.5 w-3.5 text-amber-400" />
              <span>Phlebotomy Sheet</span>
            </button>
          )}

          <button
            type="button"
            onClick={onBulkExport}
            className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={onBulkCancel}
            className="flex items-center gap-1.5 text-xs font-medium bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Ban className="h-3.5 w-3.5 text-rose-400" />
            <span>Cancel</span>
          </button>
        </div>

        {/* Clear selection */}
        <button
          type="button"
          onClick={onClear}
          className="ml-2 p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 10. QUICK ASSIGN DOCTOR MODAL
// ==========================================

export function QuickAssignDoctorModal({
  isOpen,
  onClose,
  order,
  doctors = [],
  onAssigned,
}: {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  doctors: Array<{ id: string; fullName: string; specialization?: string; clinicName?: string }>;
  onAssigned: (doctorId: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !order) return null;

  const filtered = doctors.filter(
    (d) =>
      d.fullName.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!selectedDoctorId) {
      setError("Please select a doctor to assign");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onAssigned(selectedDoctorId);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to assign doctor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Assign Referring Doctor
            </h3>
            <p className="text-xs text-slate-500">
              Order {order.orderNumber} • {formatPatientFullName(order.patient)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
            {error}
          </div>
        )}

        <div className="mt-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by doctor name or specialization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-center py-6 text-slate-400">No doctors found</p>
            ) : (
              filtered.map((doc) => {
                const isSelected = selectedDoctorId === doc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setSelectedDoctorId(doc.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold">{doc.fullName}</p>
                      <p className="text-[10px] text-slate-500">
                        {doc.specialization || "General Practice"} {doc.clinicName ? `• ${doc.clinicName}` : ""}
                      </p>
                    </div>
                    {isSelected && <span className="text-xs font-bold text-blue-600">✓ Selected</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !selectedDoctorId}
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md transition-colors"
          >
            {loading ? "Assigning..." : "Assign Doctor"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 11. QUICK COLLECT SAMPLE MODAL
// ==========================================

export function QuickCollectSampleModal({
  isOpen,
  onClose,
  order,
  onCollected,
}: {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onCollected: (data: { barcode?: string; notes?: string; sampleVolume?: string }) => Promise<void>;
}) {
  const [barcode, setBarcode] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (order) {
      setBarcode(order.barcode || `SMP-${Date.now().toString().slice(-6)}`);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onCollected({ barcode, notes });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to collect sample");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FlaskConical className="h-4 w-4 text-purple-600" />
              Collect Sample
            </h3>
            <p className="text-xs text-slate-500">
              Order {order.orderNumber} • {formatPatientFullName(order.patient)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sample Tube Barcode
            </label>
            <input
              type="text"
              required
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan or enter barcode"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 font-mono bg-slate-50 dark:bg-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Collection Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Fasting sample collected, normal draw without hemolysis"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow-md transition-colors"
            >
              {loading ? "Recording..." : "Confirm Sample Collection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 12. ADD PAYMENT MODAL
// ==========================================

export function AddPaymentModal({
  isOpen,
  onClose,
  order,
  onPaymentAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onPaymentAdded: (data: { amount: number; method: string; remarks?: string }) => Promise<void>;
}) {
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<string>("CASH");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (order) {
      const due = Math.max(0, (Number(order.grandTotal) || 0) - (Number(order.paidAmount) || 0));
      setAmount(due);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const due = Math.max(0, (Number(order.grandTotal) || 0) - (Number(order.paidAmount) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError("Please enter an amount greater than 0");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onPaymentAdded({ amount, method, remarks });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Record Payment
            </h3>
            <p className="text-xs text-slate-500">
              Order {order.orderNumber} • Balance Due: <span className="font-bold text-rose-600">₹{due.toLocaleString("en-IN")}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Amount (₹)
            </label>
            <input
              type="number"
              min={1}
              max={due > 0 ? due : undefined}
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["CASH", "UPI", "CARD"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    method === m
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Transaction / Reference Notes (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. UPI Ref # 19381048, POS Auth # 4920"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md transition-colors"
            >
              {loading ? "Recording..." : `Collect ₹${amount.toLocaleString("en-IN")}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 13. CANCEL ORDER MODAL (with Reason)
// ==========================================

export function CancelOrderModal({
  isOpen,
  onClose,
  order,
  onCancelled,
}: {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onCancelled: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a reason for cancelling this order");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onCancelled(reason);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to cancel order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-rose-600 flex items-center gap-1.5">
              <Ban className="h-4 w-4" />
              Cancel Order #{order.orderNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Patient: {formatPatientFullName(order.patient)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">
          Are you sure you want to cancel this order? Cancelled orders cannot be modified or processed further.
        </p>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cancellation Reason *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Patient requested cancellation, sample hemolyzed/unobtainable, duplicate entry"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-md transition-colors"
            >
              {loading ? "Cancelling..." : "Confirm Cancellation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 14. COLUMN CUSTOMIZATION POPOVER
// ==========================================

export function ColumnCustomizationPopover({
  visibleColumns,
  onToggleColumn,
  onResetColumns,
}: {
  visibleColumns: Record<string, boolean>;
  onToggleColumn: (key: string) => void;
  onResetColumns: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const columnLabels: Record<string, string> = {
    orderId: "Order ID & Barcode",
    patient: "Patient UHID & Name",
    doctor: "Referring Doctor",
    tests: "Prescribed Tests",
    priority: "Priority & Type",
    status: "Order Status",
    samples: "Sample Milestone",
    tat: "Turnaround Time (TAT)",
    payment: "Payment & Due",
    date: "Registration Date",
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
        title="Customize visible columns"
      >
        <Layers className="h-3.5 w-3.5 text-slate-500" />
        <span>Columns</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-56 z-50 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3 animate-in fade-in duration-100">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">Toggle Columns</span>
            <button
              onClick={onResetColumns}
              className="text-[10px] text-blue-600 hover:underline font-medium"
            >
              Reset All
            </button>
          </div>

          <div className="space-y-1.5">
            {Object.entries(columnLabels).map(([key, label]) => {
              const isChecked = visibleColumns[key] !== false;
              return (
                <label
                  key={key}
                  className="flex items-center gap-2 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleColumn(key)}
                    className="h-3.5 w-3.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 15. LOADING SKELETON FOR ORDERS TABLE
// ==========================================

export function OrdersTableSkeleton() {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-36 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-2.5 w-20 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-6 w-6 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

// ==========================================
// 16. MODERN EMPTY STATE
// ==========================================

export function OrdersEmptyState({
  hasFilters,
  onResetFilters,
}: {
  hasFilters: boolean;
  onResetFilters: () => void;
}) {
  return (
    <div className="py-16 px-4 text-center max-w-sm mx-auto">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 shadow-xs mb-4">
        <FlaskConical className="h-7 w-7" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">
        {hasFilters ? "No matching orders found" : "No laboratory orders yet"}
      </h3>
      <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
        {hasFilters
          ? "No orders match your active filter criteria. Try adjusting your search query, status, or date range."
          : "Register a new laboratory order to begin tracking sample collection, testing, and reports."}
      </p>

      <div className="flex items-center justify-center gap-2.5">
        {hasFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 shadow-xs transition-colors"
          >
            Clear Filters
          </button>
        )}
        <a
          href="/orders/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Create New Order
        </a>
      </div>
    </div>
  );
}

// ==========================================
// 17. TOAST NOTIFICATION HOOK & CONTAINER
// ==========================================

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title?: string;
  message: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "success",
    title?: string
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, message, title };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, showToast, removeToast };
}

export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";
        const isWarning = toast.type === "warning";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md animate-in slide-in-from-right duration-200 ${
              isSuccess
                ? "bg-emerald-900/90 border-emerald-700 text-white"
                : isError
                ? "bg-rose-900/90 border-rose-700 text-white"
                : isWarning
                ? "bg-amber-900/90 border-amber-700 text-white"
                : "bg-slate-900/90 border-slate-700 text-white"
            }`}
          >
            {isSuccess && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />}
            {isError && <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />}
            {isWarning && <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />}
            {!isSuccess && !isError && !isWarning && <Sparkles className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />}

            <div className="flex-1 min-w-0">
              {toast.title && <p className="text-xs font-bold leading-tight">{toast.title}</p>}
              <p className="text-xs text-slate-100 mt-0.5 leading-snug">{toast.message}</p>
            </div>

            <button
              type="button"
              onClick={() => onRemove(toast.id)}
              className="text-slate-300 hover:text-white p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// 18. PHLEBOTOMY RUN SHEET / COLLECTION WORKLIST MODAL
// ==========================================

export function PhlebotomyCollectionSheetModal({
  isOpen,
  onClose,
  orders = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
}) {
  if (!isOpen || orders.length === 0) return null;

  // Calculate total tubes required
  let edtaCount = 0;
  let sstCount = 0;
  let fluorideCount = 0;
  let citrateCount = 0;
  let urineCount = 0;

  orders.forEach((o) => {
    (o.items || []).forEach((item: any) => {
      const name = (item.test?.testName || "").toLowerCase();
      const sample = (item.test?.sampleType || "").toLowerCase();

      if (name.includes("cbc") || name.includes("hba1c") || name.includes("esr")) {
        edtaCount++;
      } else if (name.includes("glucose") || name.includes("sugar")) {
        fluorideCount++;
      } else if (name.includes("pt-inr") || name.includes("citrate")) {
        citrateCount++;
      } else if (sample.includes("urine") || name.includes("urine")) {
        urineCount++;
      } else {
        sstCount++;
      }
    });
  });

  const handlePrintSheet = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 md:p-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 no-print">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-purple-600" />
              Phlebotomy Sample Collection Worklist
            </h3>
            <p className="text-xs text-slate-500">
              Daily specimen collection run sheet for phlebotomists and lab reception
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintSheet}
              className="px-4 py-2 text-xs font-black text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Worklist
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Worklist Content */}
        <div className="pt-4 text-slate-900 dark:text-white print:p-0">
          <div className="flex justify-between items-start pb-3 border-b-2 border-slate-900 mb-4">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">
                LabCore ELIS • Phlebotomy Specimen Run Sheet
              </h2>
              <p className="text-xs text-slate-500">
                Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} • Total Orders: {orders.length}
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="font-bold">Phlebotomist: ____________________</span>
            </div>
          </div>

          {/* Tube Requirement Bar */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-4 text-xs flex flex-wrap gap-4 items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
              Vacutainer Tube Checklist:
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-600" />
                EDTA: <strong>{edtaCount}</strong>
              </span>
              <span className="inline-flex items-center gap-1 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                SST/Serum: <strong>{sstCount}</strong>
              </span>
              <span className="inline-flex items-center gap-1 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                Fluoride: <strong>{fluorideCount}</strong>
              </span>
              <span className="inline-flex items-center gap-1 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                Citrate: <strong>{citrateCount}</strong>
              </span>
              <span className="inline-flex items-center gap-1 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Urine: <strong>{urineCount}</strong>
              </span>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-900 font-bold uppercase text-[10px]">
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Order / Tube Barcode</th>
                  <th className="py-2 px-2">Patient Details</th>
                  <th className="py-2 px-2">Venue / Address</th>
                  <th className="py-2 px-2">Investigations</th>
                  <th className="py-2 px-2">Priority</th>
                  <th className="py-2 px-2 text-center">Draw Time</th>
                  <th className="py-2 px-2 text-center">Sign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {orders.map((o, idx) => (
                  <tr key={o.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-2 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-2 font-mono">
                      <p className="font-bold">{o.orderNumber}</p>
                      <p className="text-[10px] text-purple-700 font-bold">{o.barcode}</p>
                    </td>
                    <td className="py-2.5 px-2">
                      <p className="font-bold">{formatPatientFullName(o.patient)}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {o.patient?.uhid} • {o.patient?.gender} • {o.patient?.phone}
                      </p>
                    </td>
                    <td className="py-2.5 px-2 max-w-[160px]">
                      {o.collectionType === "HOME_COLLECTION" ? (
                        <span className="text-[10px] text-purple-700 font-semibold block">
                          [Home] {o.homeCollectionAddress || o.patient?.address || "Address requested"}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Lab Walk-in Desk</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 max-w-[200px]">
                      <p className="font-medium truncate">
                        {(o.items || []).map((i: any) => i.test?.testName).join(", ")}
                      </p>
                    </td>
                    <td className="py-2.5 px-2">
                      <PriorityBadge priority={o.priority} />
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-400">
                      [ ___:___ ]
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-400">
                      [____]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ==========================================
// 19. WHATSAPP & EMAIL MULTI-CHANNEL COMMUNICATION HUB
// ==========================================

export { OrderCommunicationHubModal, BulkOrderCommunicationModal } from "./OrderCommunicationHubModal";

import { OrderCommunicationHubModal } from "./OrderCommunicationHubModal";

export function WhatsAppNotificationModal(props: {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSuccess?: () => void;
}) {
  return <OrderCommunicationHubModal {...props} />;
}

