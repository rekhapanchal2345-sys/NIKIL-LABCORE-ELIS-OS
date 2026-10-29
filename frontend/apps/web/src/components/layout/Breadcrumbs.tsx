"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

/** Readable names for the first URL segment (module). Anything else is title-cased. */
const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  patients: "Patients",
  doctors: "Doctors",
  orders: "Orders",
  tests: "Diagnostic Tests",
  invoices: "Invoices",
  payments: "Payments",
  samples: "Samples",
  results: "Results",
  approvals: "Pathologist Approvals",
  reports: "Reports",
  analyzers: "Analyzers",
  inventory: "Inventory",
  settings: "Settings",
  communication: "Communication",
  microbiology: "Microbiology",
  abdm: "ABDM",
};

const SUB_LABELS: Record<string, string> = {
  "panic-triage": "Critical Value Triage",
  new: "New",
  "opd-queue": "OPD Queue",
  "stat-triage": "STAT Triage",
  packages: "Packages",
  categories: "Categories",
  parameters: "Parameters",
  "reference-ranges": "Reference Ranges",
};

function titleCase(segment: string) {
  return decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Looks like a database id or long numeric/uuid segment rather than a page name. */
function isIdSegment(segment: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(segment) || /^[0-9]+$/.test(segment) || /^c[a-z0-9]{20,}$/i.test(segment);
}

interface BreadcrumbsProps {
  className?: string;
}

/**
 * Location trail derived from the current URL, e.g. "Home / Pathologist Approvals / Critical Value Triage".
 */
export default function Breadcrumbs({ className = "" }: BreadcrumbsProps) {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    let label: string;
    if (index === 0) label = MODULE_LABELS[segment] ?? titleCase(segment);
    else if (isIdSegment(segment)) label = "Details";
    else label = SUB_LABELS[segment] ?? titleCase(segment);
    return { href, label };
  });

  return (
    <nav aria-label="Breadcrumb" className={`items-center gap-1 text-[11px] text-slate-500 ${className}`}>
      <Link href="/dashboard" className="transition-colors hover:text-sky-700">
        Home
      </Link>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <React.Fragment key={crumb.href}>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            {isLast ? (
              <span aria-current="page" className="font-semibold text-slate-700">
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="transition-colors hover:text-sky-700">
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
