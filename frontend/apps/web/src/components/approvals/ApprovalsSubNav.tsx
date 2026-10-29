"use client";

import React from "react";
import Link from "next/link";
import { ClipboardCheck, PhoneCall, ShieldCheck } from "lucide-react";

interface ApprovalsSubNavProps {
  active: "worklist" | "triage";
  /** Live number of unresolved critical values (shown as a badge when above zero). */
  criticalCount?: number;
  /** Opens the sign-off policy reference. */
  onOpenPolicies?: () => void;
}

const tabBase =
  "relative inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300";

/**
 * Section navigation shared by the pages of the Approvals module.
 */
export default function ApprovalsSubNav({ active, criticalCount = 0, onOpenPolicies }: ApprovalsSubNavProps) {
  return (
    <nav
      aria-label="Approvals sections"
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-2 shadow-sm"
    >
      <div className="flex items-center">
        <Link
          href="/approvals"
          aria-current={active === "worklist" ? "page" : undefined}
          className={`${tabBase} ${active === "worklist" ? "text-sky-700" : "text-slate-600 hover:text-slate-900"}`}
        >
          <ClipboardCheck className="h-4 w-4" />
          Sign-Off Worklist
          {active === "worklist" && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#0284C7]" />}
        </Link>

        <Link
          href="/approvals/panic-triage"
          aria-current={active === "triage" ? "page" : undefined}
          className={`${tabBase} ${active === "triage" ? "text-sky-700" : "text-slate-600 hover:text-slate-900"}`}
        >
          <PhoneCall className="h-4 w-4" />
          Critical Value Triage
          {criticalCount > 0 && (
            <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              {criticalCount}
            </span>
          )}
          {active === "triage" && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#0284C7]" />}
        </Link>
      </div>

      {onOpenPolicies && (
        <button
          type="button"
          onClick={onOpenPolicies}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ShieldCheck className="h-4 w-4" />
          Sign-off policies
        </button>
      )}
    </nav>
  );
}
