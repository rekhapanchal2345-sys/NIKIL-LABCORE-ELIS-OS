"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Archive,
  CheckCircle2,
  ClipboardCheck,
  ListChecks,
  RotateCcw,
  Search,
  Stethoscope,
  Table as TableIcon,
} from "lucide-react";

interface ApprovalFiltersProps {
  onSearch: (term: string) => void;
  onFilterChange: (filters: { dateFrom: string; dateTo: string; department: string; status?: string; filter?: string }) => void;
  viewMode?: "workstation" | "table";
  onViewModeChange?: (mode: "workstation" | "table") => void;
  activeFilter?: string;
  onSelectFilterPill?: (pill: string) => void;
  /** Controlled search text (lets the page clear or preset it from the URL). */
  searchValue?: string;
  onOpenRules?: () => void;
}

type PillTone = "sky" | "slate" | "red" | "emerald" | "amber" | "orange" | "violet";

const QUICK_PILLS: Array<{
  key: string;
  label: string;
  status: string;
  filter: string;
  tone: PillTone;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "pending", label: "Ready for Sign-Off", status: "VERIFIED", filter: "", tone: "sky", Icon: ClipboardCheck },
  { key: "pipeline", label: "Lab Pipeline", status: "", filter: "pipeline", tone: "slate", Icon: ListChecks },
  { key: "critical", label: "Critical Values", status: "VERIFIED", filter: "critical", tone: "red", Icon: AlertOctagon },
  { key: "abnormal", label: "Abnormal", status: "VERIFIED", filter: "abnormal", tone: "amber", Icon: AlertTriangle },
  { key: "normal", label: "Normal", status: "VERIFIED", filter: "normal", tone: "emerald", Icon: CheckCircle2 },
  { key: "rerun", label: "Returned / Rerun", status: "ENTERED", filter: "", tone: "orange", Icon: RotateCcw },
  { key: "approved", label: "Signed Archive", status: "APPROVED", filter: "", tone: "violet", Icon: Archive },
];

const PILL_ACTIVE: Record<PillTone, string> = {
  sky: "border-sky-600 bg-sky-600 text-white",
  slate: "border-slate-700 bg-slate-700 text-white",
  red: "border-red-600 bg-red-600 text-white",
  emerald: "border-emerald-600 bg-emerald-600 text-white",
  amber: "border-amber-600 bg-amber-600 text-white",
  orange: "border-orange-600 bg-orange-600 text-white",
  violet: "border-violet-600 bg-violet-600 text-white",
};

const DEPARTMENTS = [
  "Biochemistry",
  "Hematology",
  "Microbiology",
  "Immunology",
  "Clinical Pathology",
  "Histopathology",
];

const fieldLabel = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500";
const fieldInput =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

export default function ApprovalFilters({
  onSearch,
  onFilterChange,
  viewMode = "table",
  onViewModeChange,
  activeFilter = "pending",
  onSelectFilterPill,
  searchValue,
}: ApprovalFiltersProps) {
  const [search, setSearch] = useState(searchValue ?? "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [department, setDepartment] = useState("");

  useEffect(() => {
    if (searchValue !== undefined) setSearch(searchValue);
  }, [searchValue]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    onSearch(value);
  };

  const handleDepartmentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setDepartment(value);
    onFilterChange({ dateFrom, dateTo, department: value });
  };

  const handleDateFromChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateFrom(value);
    onFilterChange({ dateFrom: value, dateTo, department });
  };

  const handleDateToChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateTo(value);
    onFilterChange({ dateFrom, dateTo: value, department });
  };

  const handlePillClick = (pill: (typeof QUICK_PILLS)[number]) => {
    onSelectFilterPill?.(pill.key);
  };

  const handleReset = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setDepartment("");
    onSearch("");
    onSelectFilterPill?.("pending");
    onFilterChange({ dateFrom: "", dateTo: "", department: "" });
  };

  const hasFilters =
    Boolean(search) ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    Boolean(department);

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Queue selector + view switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Approval queues">
          {QUICK_PILLS.map((pill) => {
            const isActive = activeFilter === pill.key;
            const { Icon } = pill;
            return (
              <button
                key={pill.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handlePillClick(pill)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? PILL_ACTIVE[pill.tone]
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {pill.label}
              </button>
            );
          })}
        </div>

        {onViewModeChange && (
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs">
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              aria-pressed={viewMode === "table"}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-colors ${
                viewMode === "table" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              Worklist
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("workstation")}
              aria-pressed={viewMode === "workstation"}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-colors ${
                viewMode === "workstation" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5" />
              Workstation
            </button>
          </div>
        )}
      </div>

      {/* Search + refinements */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label htmlFor="approval-search" className={fieldLabel}>
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              id="approval-search"
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Patient, UHID, order no., barcode or test"
              className={`${fieldInput} pl-9`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="approval-department" className={fieldLabel}>
            Department
          </label>
          <select id="approval-department" value={department} onChange={handleDepartmentChange} className={fieldInput}>
            <option value="">All departments</option>
            {DEPARTMENTS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="approval-date-from" className={fieldLabel}>
            From date
          </label>
          <input id="approval-date-from" type="date" value={dateFrom} onChange={handleDateFromChange} className={fieldInput} />
        </div>

        <div>
          <label htmlFor="approval-date-to" className={fieldLabel}>
            To date
          </label>
          <input id="approval-date-to" type="date" value={dateTo} onChange={handleDateToChange} className={fieldInput} />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasFilters}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset filters
          </button>
        </div>
      </div>
    </section>
  );
}
