"use client";

import React, { ChangeEvent, useState, useEffect } from "react";
import { doctorApi } from "@/lib/api";
import {
  Search,
  RotateCcw,
  Calendar,
  Filter,
  User,
  CreditCard,
  X,
} from "lucide-react";

interface Doctor {
  id: string;
  doctorCode: string;
  fullName: string;
  specialization?: string;
}

interface InvoiceFiltersProps {
  filters: {
    search: string;
    paymentStatus: string;
    paymentMode: string;
    doctorId: string;
    dateFrom: string;
    dateTo: string;
  };
  onFilterChange: (filters: {
    search: string;
    paymentStatus: string;
    paymentMode: string;
    doctorId: string;
    dateFrom: string;
    dateTo: string;
  }) => void;
}

export default function InvoiceFilters({
  filters,
  onFilterChange,
}: InvoiceFiltersProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const hasFilters =
    Boolean(filters.search) ||
    Boolean(filters.paymentStatus) ||
    Boolean(filters.paymentMode) ||
    Boolean(filters.doctorId) ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const response = await doctorApi.getAll();
      if (response.success && response.data) {
        const doctorsData = Array.isArray(response.data)
          ? response.data
          : response.data.doctors || [];
        setDoctors(doctorsData);
      }
    } catch (err) {
      console.error("Error fetching doctors:", err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value });
  };

  const handlePaymentStatusChange = (value: string) => {
    onFilterChange({ ...filters, paymentStatus: value });
  };

  const handlePaymentModeChange = (value: string) => {
    onFilterChange({ ...filters, paymentMode: value });
  };

  const handleDoctorChange = (value: string) => {
    onFilterChange({ ...filters, doctorId: value });
  };

  const handleDateFromChange = (value: string) => {
    onFilterChange({ ...filters, dateFrom: value });
  };

  const handleDateToChange = (value: string) => {
    onFilterChange({ ...filters, dateTo: value });
  };

  const handleReset = () => {
    onFilterChange({
      search: "",
      paymentStatus: "",
      paymentMode: "",
      doctorId: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  // Quick Date Preset Buttons
  const setQuickDate = (type: "all" | "today" | "yesterday" | "7days" | "month") => {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    if (type === "all") {
      onFilterChange({ ...filters, dateFrom: "", dateTo: "" });
    } else if (type === "today") {
      const d = fmt(today);
      onFilterChange({ ...filters, dateFrom: d, dateTo: d });
    } else if (type === "yesterday") {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      const d = fmt(y);
      onFilterChange({ ...filters, dateFrom: d, dateTo: d });
    } else if (type === "7days") {
      const past = new Date(today);
      past.setDate(today.getDate() - 7);
      onFilterChange({ ...filters, dateFrom: fmt(past), dateTo: fmt(today) });
    } else if (type === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      onFilterChange({ ...filters, dateFrom: fmt(firstDay), dateTo: fmt(today) });
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
      {/* Top row: Quick presets and active filter indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mr-1">
            Date range:
          </span>
          {[
            { id: "all", label: "All Dates" },
            { id: "today", label: "Today" },
            { id: "yesterday", label: "Yesterday" },
            { id: "7days", label: "Last 7 Days" },
            { id: "month", label: "This Month" },
          ].map((preset) => {
            const isAll = preset.id === "all" && !filters.dateFrom && !filters.dateTo;
            const isSelected =
              isAll ||
              (preset.id === "today" &&
                filters.dateFrom === new Date().toISOString().split("T")[0] &&
                filters.dateTo === new Date().toISOString().split("T")[0]);

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setQuickDate(preset.id as any)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${isSelected
                  ? "bg-blue-600 text-white shadow-sm font-bold"
                  : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {hasFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Main Filter Inputs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
             Search invoices
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={filters.search}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleSearchChange(e.target.value)
              }
               placeholder="Invoice no., patient, UHID, phone or order no."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-9 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            {filters.search && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Payment Status */}
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Payment Status
          </label>
          <select
            value={filters.paymentStatus}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              handlePaymentStatusChange(e.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Statuses</option>
            <option value="PAID">Fully Paid</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="PENDING">Unpaid / Due</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>

        {/* Payment Mode */}
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Payment Mode
          </label>
          <select
            value={filters.paymentMode || ""}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              handlePaymentModeChange(e.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Payment Modes</option>
            <option value="CASH">Cash Counter</option>
            <option value="UPI">UPI (GPay / PhonePe / QR)</option>
            <option value="CARD">Credit / Debit Card</option>
            <option value="TPA">TPA &amp; Cashless Insurance</option>
            <option value="NET_BANKING">Net Banking</option>
            <option value="CHEQUE">Cheque / DD</option>
          </select>
        </div>

        {/* Referring doctor */}
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
             Referring doctor
          </label>
          <select
            value={filters.doctorId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              handleDoctorChange(e.target.value)
            }
            disabled={loadingDoctors}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          >
             <option value="">All referring doctors</option>
            {doctors.map((doctor) => {
              const cleaned = (doctor.fullName || "")
                .replace(/^(dr\.?|dr\b)\s+/i, "")
                .replace(/^(dr\.?|dr\b)\s+/i, "")
                .trim();
              const doctorLabel = cleaned ? `Dr. ${cleaned}` : doctor.fullName;
              return (
                <option key={doctor.id} value={doctor.id}>
                  {doctorLabel}{" "}
                  {doctor.specialization ? `(${doctor.specialization})` : ""}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Date Pickers */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-1">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Date From
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleDateFromChange(e.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Date To
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleDateToChange(e.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-900 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="lg:col-span-2 flex items-end">
          <p className="text-[11px] text-slate-500">
             Search and filter by invoice, patient, UHID, order, referrer, payment mode or status.
          </p>
        </div>
      </div>
    </section>
  );
}
