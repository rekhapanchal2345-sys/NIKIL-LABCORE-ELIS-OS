"use client";

import React from "react";
import Link from "next/link";
import { Eye, Trash2, Clock, AlertTriangle, CheckCircle2, UserRound, Stethoscope } from "lucide-react";

export interface LabOrder {
  id: string | number;
  orderNumber?: string;
  patientId?: string | number;
  patientName?: string;
  doctorName?: string;
  status?: string;
  priority?: string;
  totalAmount?: number;
  paidAmount?: number;
  pendingAmount?: number;
  sampleStatus?: string;
  createdAt?: string;
}

interface OrderTableProps {
  orders: LabOrder[];
  loading?: boolean;
  onDelete?: (order: LabOrder) => void;
}

function formatCurrency(amount?: number) {
  if (amount === undefined || amount === null) {
    return "₹0.00";
  }

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date?: string) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status?: string) {
  const value = status?.toLowerCase();

  if (value === "completed" || value === "approved" || value === "paid") {
    return "bg-emerald-50 text-emerald-800 border border-emerald-200";
  }

  if (value === "cancelled" || value === "rejected") {
    return "bg-rose-50 text-rose-800 border border-rose-200";
  }

  if (value === "pending" || value === "processing" || value === "collected") {
    return "bg-amber-50 text-amber-800 border border-amber-200";
  }

  return "bg-sky-50 text-sky-800 border border-sky-200";
}

function priorityClass(priority?: string) {
  const value = priority?.toLowerCase();

  if (value === "urgent" || value === "stat") {
    return "bg-rose-600 text-white font-bold";
  }

  if (value === "high") {
    return "bg-amber-100 text-amber-800 border border-amber-200 font-bold";
  }

  return "bg-slate-100 text-slate-700 border border-slate-200";
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, row) => (
        <tr key={row}>
          {Array.from({ length: 8 }).map((__, cell) => (
            <td key={cell} className="px-4 py-4">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function OrderTable({
  orders,
  loading = false,
  onDelete,
}: OrderTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                Order
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                Patient
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                Referring Doctor
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                Priority
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                Amount
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                Date
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white text-xs">
            {loading ? (
              <LoadingRows />
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
                  <div className="text-3xl mb-2">📋</div>
                  <p className="text-sm font-bold text-slate-800">
                    No clinical orders found
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Requisition records will appear here as they are registered.
                  </p>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-xs font-bold text-slate-900 hover:text-sky-600 transition-colors font-mono"
                    >
                      {order.orderNumber || `ORD-${order.id}`}
                    </Link>
                    <p className="text-[10px] text-slate-400 mt-0.5">ID: {order.id}</p>
                  </td>

                  <td className="px-5 py-4">
                    {order.patientId ? (
                      <Link
                        href={`/patients/${order.patientId}`}
                        className="text-xs font-bold text-slate-800 hover:text-sky-600 transition-colors flex items-center gap-1.5"
                      >
                        <UserRound className="h-3 w-3 text-sky-600" />
                        {order.patientName || `Patient #${order.patientId}`}
                      </Link>
                    ) : (
                      <span className="text-xs font-medium text-slate-700">
                        {order.patientName || "—"}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Stethoscope className="h-3 w-3 text-slate-400" />
                      {order.doctorName || "Self / OPD Walk-in"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] ${priorityClass(
                        order.priority
                      )}`}
                    >
                      {order.priority || "Routine"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusClass(
                        order.status
                      )}`}
                    >
                      {order.status || "Pending"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-xs font-bold text-slate-900">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    {order.pendingAmount !== undefined && order.pendingAmount > 0 && (
                      <p className="text-[10px] font-bold text-rose-600 mt-0.5">
                        Due: {formatCurrency(order.pendingAmount)}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-500 font-medium">
                    {formatDate(order.createdAt)}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/orders/${order.id}`}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-sky-600 hover:bg-slate-50 transition-colors shadow-2xs"
                        title="View details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>

                      {onDelete && (
                        <button
                          onClick={() => onDelete(order)}
                          className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors shadow-2xs"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}