"use client";

import React from "react";
import Link from "next/link";
import { UserRound, Stethoscope, Clock, Eye, Trash2 } from "lucide-react";
import type { LabOrder } from "./OrderTable";

interface OrderCardProps {
  order: LabOrder;
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

export default function OrderCard({
  order,
  onDelete,
}: OrderCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-sky-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/orders/${order.id}`}
            className="text-sm font-bold text-slate-900 hover:text-sky-600 transition-colors font-mono"
          >
            {order.orderNumber || `ORD-${order.id}`}
          </Link>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">
            {formatDate(order.createdAt)}
          </p>
        </div>

        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusClass(
            order.status
          )}`}
        >
          {order.status || "Pending"}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
          <p className="text-[10px] uppercase font-bold text-slate-400">
            Patient Demographics
          </p>
          {order.patientId ? (
            <Link
              href={`/patients/${order.patientId}`}
              className="mt-0.5 block text-xs font-bold text-slate-900 hover:text-sky-600 transition-colors flex items-center gap-1.5"
            >
              <UserRound className="h-3.5 w-3.5 text-sky-600" />
              {order.patientName || `Patient #${order.patientId}`}
            </Link>
          ) : (
            <p className="mt-0.5 text-xs font-bold text-slate-900">
              {order.patientName || "—"}
            </p>
          )}
        </div>

        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">
            Referring Doctor
          </p>
          <p className="mt-0.5 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
            {order.doctorName || "Self / OPD Walk-in"}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">
              Priority
            </p>
            <span
              className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] ${priorityClass(
                order.priority
              )}`}
            >
              {order.priority || "Routine"}
            </span>
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400">
              Total Amount
            </p>
            <p className="mt-0.5 text-sm font-black text-slate-900">
              {formatCurrency(order.totalAmount)}
            </p>
          </div>
        </div>

        {order.pendingAmount !== undefined && order.pendingAmount > 0 && (
          <div className="rounded-xl bg-rose-50 px-3 py-2 border border-rose-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-rose-800">Balance Due</span>
              <span className="font-black text-rose-900">
                {formatCurrency(order.pendingAmount)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
        <Link
          href={`/orders/${order.id}`}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors shadow-2xs"
        >
          View Details
        </Link>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(order)}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors shadow-2xs"
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}