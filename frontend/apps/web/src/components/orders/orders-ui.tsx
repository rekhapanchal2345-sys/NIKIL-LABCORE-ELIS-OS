"use client";

import React, { useState, useCallback } from "react";
import { OrderCommunicationHubModal } from "./OrderCommunicationHubModal";

export { OrderCommunicationHubModal };

export type OrderStatusType =
  | "PENDING"
  | "SAMPLE_COLLECTED"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED"
  | string;

export function StatusBadge({ status }: { status: OrderStatusType }) {
  return (
    <span className="inline-flex rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800">
      {String(status || "PENDING").replace(/_/g, " ")}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority?: string }) {
  return (
    <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
      {priority || "ROUTINE"}
    </span>
  );
}

export function PaymentProgressBar({
  grandTotal = 0,
  paidAmount = 0,
  onAddPaymentClick,
}: {
  grandTotal?: number;
  paidAmount?: number;
  paymentStatus?: string;
  onAddPaymentClick?: () => void;
}) {
  const pct = grandTotal > 0 ? Math.min(100, Math.round((paidAmount / grandTotal) * 100)) : 100;
  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-emerald-600" style={{ width: `${pct}%` }} />
      </div>
      {pct < 100 && onAddPaymentClick && (
        <button
          type="button"
          onClick={onAddPaymentClick}
          className="text-[10px] font-bold text-sky-700 hover:underline"
        >
          + Collect Due
        </button>
      )}
    </div>
  );
}

export function TATIndicator({ status }: { status?: string; createdAt?: string }) {
  return <span className="text-[10px] font-mono text-slate-500">{status || "On Track"}</span>;
}

export function SampleStatusStepper({
  orderStatus,
  sampleCollected,
}: {
  orderStatus: OrderStatusType;
  sampleCollected?: boolean;
}) {
  return (
    <div className="text-[10px] text-slate-500">
      {sampleCollected ? "Specimen Collected" : `Stage: ${orderStatus}`}
    </div>
  );
}

export function TestListPopover({ items = [] }: { items?: any[] }) {
  return (
    <div className="text-xs font-semibold text-slate-800">
      {items.length} Diagnostic Investigation(s)
    </div>
  );
}

export function DoctorCell({
  doctor,
  onAssignDoctorClick,
}: {
  doctor?: any;
  onAssignDoctorClick?: () => void;
}) {
  if (doctor?.fullName || doctor?.name) {
    return <span className="text-xs font-semibold text-slate-800">{doctor.fullName || doctor.name}</span>;
  }
  return (
    <button
      type="button"
      onClick={onAssignDoctorClick}
      className="text-xs font-semibold text-sky-700 hover:underline"
    >
      Assign Doctor
    </button>
  );
}

export function OrderRowQuickActions({
  onView,
}: {
  order?: any;
  onView?: () => void;
  onAssignDoctor?: () => void;
  onCollectSample?: () => void;
  onAddPayment?: () => void;
  onCancel?: () => void;
  onWhatsApp?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onView}
      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
    >
      Open
    </button>
  );
}

export function QuickAssignDoctorModal({ isOpen, onClose }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="rounded-2xl bg-white p-5 shadow-xl">
        <button type="button" onClick={onClose} className="text-xs font-bold">Close</button>
      </div>
    </div>
  );
}

export function AddPaymentModal({ isOpen, onClose }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="rounded-2xl bg-white p-5 shadow-xl">
        <button type="button" onClick={onClose} className="text-xs font-bold">Close</button>
      </div>
    </div>
  );
}

export function CancelOrderModal({ isOpen, onClose }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="rounded-2xl bg-white p-5 shadow-xl">
        <button type="button" onClick={onClose} className="text-xs font-bold">Close</button>
      </div>
    </div>
  );
}

export function PhlebotomyCollectionSheetModal({ isOpen, onClose }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="rounded-2xl bg-white p-5 shadow-xl">
        <button type="button" onClick={onClose} className="text-xs font-bold">Close</button>
      </div>
    </div>
  );
}

export function WhatsAppNotificationModal({ isOpen, onClose }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="rounded-2xl bg-white p-5 shadow-xl">
        <button type="button" onClick={onClose} className="text-xs font-bold">Close</button>
      </div>
    </div>
  );
}

export function BulkOrderCommunicationModal({ isOpen, onClose }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="rounded-2xl bg-white p-5 shadow-xl">
        <button type="button" onClick={onClose} className="text-xs font-bold">Close</button>
      </div>
    </div>
  );
}

export function ColumnCustomizationPopover() {
  return null;
}

export function OrdersTableSkeleton() {
  return <div className="p-8 text-center text-xs text-slate-500">Loading requisitions...</div>;
}

export function OrdersEmptyState({
  onResetFilters,
}: {
  hasFilters?: boolean;
  onResetFilters?: () => void;
}) {
  return (
    <div className="p-10 text-center text-xs text-slate-500">
      <p>No diagnostic requisitions match the current filter.</p>
      {onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-2 rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-700"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: string }>>([]);
  const showToast = useCallback((message: string, type = "info") => {
    setToasts((prev) => [...prev, { id: String(Date.now()), message, type }]);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  return { toasts, showToast, dismissToast };
}

export function ToastContainer({ toasts = [] }: { toasts?: any[]; onDismiss?: (id: string) => void }) {
  if (!toasts.length) return null;
  return null;
}
