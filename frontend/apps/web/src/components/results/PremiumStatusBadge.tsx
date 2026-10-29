"use client";
import React from "react";

export function PremiumStatusBadge({ status, label }: any) {
  const text = label || status || "PENDING";
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      {text}
    </span>
  );
}

export function ResultFlagBadge({ flag }: { flag: string }) {
  const isCritical = flag === 'CRITICAL' || flag === 'PANIC';
  const isAbnormal = flag === 'HIGH' || flag === 'LOW';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
      isCritical ? 'bg-red-100 text-red-800 border border-red-300' :
      isAbnormal ? 'bg-amber-100 text-amber-800 border border-amber-300' :
      'bg-emerald-100 text-emerald-800 border border-emerald-300'
    }`}>
      {flag || 'NORMAL'}
    </span>
  );
}

export default PremiumStatusBadge;
