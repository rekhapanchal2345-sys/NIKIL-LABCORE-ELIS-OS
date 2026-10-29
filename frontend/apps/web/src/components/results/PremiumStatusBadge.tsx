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
export default PremiumStatusBadge;
