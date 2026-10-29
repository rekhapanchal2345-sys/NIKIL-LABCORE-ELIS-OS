"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

// Rupee sign written as an escape so the source stays encoding-safe on Windows toolchains.
const RUPEE = "\u20B9";

export function PhlebotomyErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function PhlebotomyBalanceNotice({ balanceDue }: { balanceDue: number }) {
  if (balanceDue <= 0) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        Payment outstanding on this requisition: <strong>{RUPEE}{balanceDue.toLocaleString("en-IN")}</strong>. Collection can proceed;
        settle the balance at billing.
      </span>
    </div>
  );
}
