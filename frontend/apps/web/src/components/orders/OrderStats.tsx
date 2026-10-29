"use client";

import React from "react";

interface OrderStatsProps {
  total?: number;
  pending?: number;
  processing?: number;
  completed?: number;
  cancelled?: number;
  revenue?: number;
  loading?: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: string;
  loading?: boolean;
}

function StatCard({
  label,
  value,
  description,
  icon,
  loading,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">
            {label}
          </p>

          {loading ? (
            <div className="mt-2 h-8 w-20 animate-pulse rounded bg-gray-200" />
          ) : (
            <p className="mt-1 truncate text-2xl font-bold text-gray-900">
              {typeof value === "number"
                ? value.toLocaleString("en-IN")
                : value}
            </p>
          )}

          <p className="mt-2 text-xs text-gray-400">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function OrderStats({
  total = 0,
  pending = 0,
  processing = 0,
  completed = 0,
  cancelled = 0,
  revenue = 0,
  loading = false,
}: OrderStatsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Orders"
          value={total}
          description="All laboratory orders"
          icon="📋"
          loading={loading}
        />

        <StatCard
          label="Pending"
          value={pending}
          description="Orders awaiting processing"
          icon="⏳"
          loading={loading}
        />

        <StatCard
          label="Processing"
          value={processing}
          description="Orders currently in progress"
          icon="⚙️"
          loading={loading}
        />

        <StatCard
          label="Completed"
          value={completed}
          description="Successfully completed orders"
          icon="✓"
          loading={loading}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Cancelled"
          value={cancelled}
          description="Cancelled laboratory orders"
          icon="✕"
          loading={loading}
        />

        <StatCard
          label="Order Revenue"
          value={`₹${revenue.toLocaleString(
            "en-IN",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}`}
          description="Total value of orders"
          icon="₹"
          loading={loading}
        />
      </div>
    </div>
  );
}