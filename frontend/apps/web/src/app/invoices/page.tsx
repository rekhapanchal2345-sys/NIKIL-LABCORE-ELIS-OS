"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/dashboardlayout";
import InvoiceTable from "@/components/invoices/InvoiceTable";
import InvoiceFilters from "@/components/invoices/InvoiceFilters";
import BillingMetrics from "@/components/invoices/BillingMetrics";
import AdvancedPaymentModal from "@/components/invoices/AdvancedPaymentModal";
import RefundModal from "@/components/invoices/RefundModal";
import ThermalReceipt from "@/components/invoices/ThermalReceipt";
import PixelPerfectInvoice from "@/components/invoices/PixelPerfectInvoice";
import WhatsAppShare from "@/components/invoices/WhatsAppShare";
import EmailShare from "@/components/invoices/EmailShare";
import InvoiceQuickDrawer from "@/components/invoices/InvoiceQuickDrawer";
import DayBookReconciliation from "@/components/invoices/DayBookReconciliation";
import DueAgingTracker from "@/components/invoices/DueAgingTracker";
import DoctorReferralBilling from "@/components/invoices/DoctorReferralBilling";
import GSTTaxAuditReport from "@/components/invoices/GSTTaxAuditReport";
import QuickPOSBilling from "@/components/invoices/QuickPOSBilling";
import { ToastManager, showInvoiceToast } from "@/components/invoices/InvoiceToast";
import { invoiceApi, paymentsApi } from "@/lib/api";
import type { Invoice } from "@/components/invoices/InvoiceTable";
import {
  FileText,
  CreditCard,
  Receipt,
  Clock,
  Stethoscope,
  ShieldCheck,
  Plus,
  Printer,
  Send,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  X,
} from "lucide-react";

export default function InvoicesPage() {
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get("patientId");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || patientIdParam || "",
    paymentStatus: searchParams.get("status") || "",
    paymentMode: searchParams.get("paymentMode") || "",
    doctorId: searchParams.get("doctorId") || "",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
  });

  // URL State Synchronization (Level 4)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      
      if (filters.search) url.searchParams.set("search", filters.search);
      else url.searchParams.delete("search");

      if (filters.paymentStatus) url.searchParams.set("status", filters.paymentStatus);
      else url.searchParams.delete("status");

      if (filters.dateFrom) url.searchParams.set("dateFrom", filters.dateFrom);
      else url.searchParams.delete("dateFrom");

      if (filters.dateTo) url.searchParams.set("dateTo", filters.dateTo);
      else url.searchParams.delete("dateTo");

      if (filters.paymentMode) url.searchParams.set("paymentMode", filters.paymentMode);
      else url.searchParams.delete("paymentMode");

      if (filters.doctorId) url.searchParams.set("doctorId", filters.doctorId);
      else url.searchParams.delete("doctorId");

      window.history.replaceState(null, '', url.toString());
    }
  }, [filters]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [thermalReceiptOpen, setThermalReceiptOpen] = useState(false);
  const [a4InvoiceOpen, setA4InvoiceOpen] = useState(false);
  const [whatsappShareOpen, setWhatsappShareOpen] = useState(false);
  const [emailShareOpen, setEmailShareOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // New Enterprise Features State
  const tabParam = searchParams.get("tab") || "all";
  const [activeTab, setActiveTab] = useState<"all" | "pos" | "daybook" | "aging" | "b2b" | "gst">(
    (["all", "pos", "daybook", "aging", "b2b", "gst"].includes(tabParam) ? tabParam : "all") as any
  );
  const [quickDrawerInvoice, setQuickDrawerInvoice] = useState<Invoice | null>(null);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && ["all", "pos", "daybook", "aging", "b2b", "gst"].includes(t)) {
      setActiveTab(t as any);
    }
  }, [searchParams]);

  const handleTabChange = (tab: "all" | "pos" | "daybook" | "aging" | "b2b" | "gst") => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    if (tab === "all") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.pushState(null, "", newUrl);
  };

  const handleToggleSelect = (id: string | number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === invoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(invoices.map((i) => i.id));
    }
  };

  const handleBatchExport = () => {
    const selectedInvoices = invoices.filter((i) => selectedIds.includes(i.id));
    if (selectedInvoices.length === 0) return;
    const headers = [
      "Invoice Number",
      "Patient Name",
      "UHID",
      "Doctor",
      "Date",
      "Status",
      "Amount",
      "Paid",
      "Due",
    ];
    const rows = selectedInvoices.map((i) => [
      i.invoiceNumber,
      `"${i.patientName || ""}"`,
      i.patientUhid || "",
      `"${i.doctorName || ""}"`,
      i.createdAt || "",
      i.paymentStatus || "",
      i.netPayable || 0,
      i.paidAmount || 0,
      i.pendingAmount || 0,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoices_Batch_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showInvoiceToast("success", `Exported ${selectedInvoices.length} invoices to CSV`);
  };

  const handleBatchThermalPrint = () => {
    const selectedInvoices = invoices.filter((i) => selectedIds.includes(i.id));
    if (selectedInvoices.length > 0) {
      handlePrint(selectedInvoices[0], "thermal");
      showInvoiceToast("info", `Printing thermal receipt 1 of ${selectedInvoices.length}`);
    }
  };

  const handleBatchA4Print = () => {
    const selectedInvoices = invoices.filter((i) => selectedIds.includes(i.id));
    if (selectedInvoices.length > 0) {
      handlePrint(selectedInvoices[0], "a4");
      showInvoiceToast("info", `Opening A4 Tax Invoice 1 of ${selectedInvoices.length}`);
    }
  };

  // Debounced fetch for filters & search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices(1, pagination.limit);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchInvoices(newPage, pagination.limit);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    fetchInvoices(1, newLimit);
  };

  const fetchInvoices = async (
    targetPage = pagination.page,
    targetLimit = pagination.limit
  ) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (filters.search) {
        queryParams.append("search", filters.search);
      }
      if (filters.paymentStatus) {
        queryParams.append("paymentStatus", filters.paymentStatus);
      }
      if (filters.doctorId) {
        queryParams.append("doctorId", filters.doctorId);
      }
      if (filters.dateFrom) {
        queryParams.append("dateFrom", filters.dateFrom);
      }
      if (filters.dateTo) {
        queryParams.append("dateTo", filters.dateTo);
      }
      queryParams.append("page", targetPage.toString());
      queryParams.append("limit", targetLimit.toString());
      
      const query = queryParams.toString();
      const response = await invoiceApi.getAll(query ? `?${query}` : "");
      
      if (response.success && response.data) {
        const data = response.data as any;

        if (data.pagination) {
          setPagination(data.pagination);
        } else {
          setPagination((prev) => ({
            ...prev,
            page: targetPage,
            limit: targetLimit,
            total: (data.invoices || []).length,
            totalPages: Math.max(1, Math.ceil((data.invoices || []).length / targetLimit)),
          }));
        }
        
        // Transform API data to match component interface
        const transformedInvoices: Invoice[] = (data.invoices || []).map((inv: any) => {
          const payments = inv.order?.payments || [];
          let paidAmount = payments
            .filter((p: any) => p.status === "PAID")
            .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

          const totalAmount = Number(inv.subtotal || inv.grandTotal || 0);
          const discount = Number(inv.discount || 0);
          const gstAmount = Number(inv.gstAmount || 0);
          const netPayable = Number(inv.grandTotal || (totalAmount + gstAmount - discount) || 0);

          if (inv.paymentStatus === "PAID" && paidAmount === 0) {
            paidAmount = netPayable;
          }
          const pendingAmount = Math.max(0, netPayable - paidAmount);

          // Determine payment mode from the most recent payment or fallback
          const paymentMode = payments.length > 0
            ? payments[0].method
            : (inv.paymentStatus === "PAID" ? "CASH" : undefined);

          // Map items with test data
          const items = (inv.order?.items || []).map((item: any) => ({
            id: item.id,
            testName: item.test?.name || "Laboratory Investigation",
            testCode: item.test?.code,
            hsnSacCode: item.test?.hsnSacCode || "999312",
            quantity: item.quantity || 1,
            unitPrice: Number(item.finalPrice || item.unitPrice || 0),
            total: Number(item.finalPrice || item.unitPrice || 0),
            taxableValue: Number(item.finalPrice || item.unitPrice || 0),
            cgstPercent: 9,
            cgstAmount: Number(item.finalPrice || item.unitPrice || 0) * 0.09,
            sgstPercent: 9,
            sgstAmount: Number(item.finalPrice || item.unitPrice || 0) * 0.09,
          }));

          return {
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            patientId: inv.order?.patient?.id,
            patientName: inv.order?.patient
              ? `${inv.order.patient.firstName} ${inv.order.patient.lastName}`
              : undefined,
            patientUhid: inv.order?.patient?.uhid,
            patientPhone: inv.order?.patient?.phone,
            patientEmail: inv.order?.patient?.email,
            patientInfo: {
              gender: inv.order?.patient?.gender,
              phone: inv.order?.patient?.phone,
              email: inv.order?.patient?.email,
              address: inv.order?.patient?.address,
            },
            orderId: inv.orderId,
            orderNumber: inv.order?.orderNumber,
            doctorName: inv.order?.doctor?.fullName,
            doctorEmail: inv.order?.doctor?.email,
            doctorInfo: {
              name: inv.order?.doctor?.fullName,
              qualification: inv.order?.doctor?.specialization,
            },
            totalAmount: totalAmount,
            discount: discount,
            gstAmount: gstAmount,
            cgstAmount: inv.cgstAmount || (gstAmount ? gstAmount / 2 : 0),
            sgstAmount: inv.sgstAmount || (gstAmount ? gstAmount / 2 : 0),
            igstAmount: inv.igstAmount || 0,
            netPayable: netPayable,
            paidAmount: paidAmount,
            pendingAmount: pendingAmount,
            samples: inv.order?.samples || [],
            items: items,
            payments: payments,
            orderStatus: inv.order?.orderStatus,
            status: inv.paymentStatus,
            paymentStatus: inv.paymentStatus,
            paymentMode: paymentMode,
            createdAt: inv.createdAt,
            dueDate: inv.dueDate,
          };
        });
        
        console.log('Transformed invoices (fallback):', transformedInvoices);
        setInvoices(transformedInvoices);
        setError(null);
      } else {
        console.error('Invalid response structure:', response);
        setError("Failed to load invoices: Invalid response format");
        setInvoices([]);
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load invoices. Please try again.";
      setError(errorMessage);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleDelete = async (invoice: Invoice) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
      return;
    }

    try {
      await invoiceApi.delete(invoice.id as string);
      await fetchInvoices();
    } catch (err) {
      console.error("Error deleting invoice:", err);
      alert("Failed to delete invoice");
    }
  };

  const handleCollectPayment = async (invoice: Invoice) => {
    try {
      // Fetch complete invoice details with payment history
      const response = await invoiceApi.getById(invoice.id as string);
      if (response.success && response.data) {
        const fullInvoice = response.data as any;
        
        const enhancedInvoice = {
          ...invoice,
          payments: fullInvoice.order?.payments || [],
        };
        
        setSelectedInvoice(enhancedInvoice);
        setPaymentModalOpen(true);
      } else {
        throw new Error('Failed to fetch invoice details');
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      showInvoiceToast('error', 'Failed to load invoice details. Please try again.');
      setSelectedInvoice(invoice);
      setPaymentModalOpen(true);
    }
  };

  const handlePaymentSubmit = async (paymentData: {
    amount: number;
    paymentMethod: string;
    transactionId?: string;
    chequeNumber?: string;
    bankName?: string;
    insuranceProvider?: string;
    policyNumber?: string;
    paymentDate: string;
    remarks?: string;
  }) => {
    try {
      // Call the payment API to record the payment
      const paymentPayload = {
        orderId: selectedInvoice?.orderId?.toString() || selectedInvoice?.id?.toString(),
        amount: paymentData.amount,
        method: paymentData.paymentMethod as any,
        transactionId: paymentData.transactionId,
        remarks: paymentData.remarks,
      };

      console.log("Submitting payment:", paymentPayload);

      // Use the paymentsApi to create the payment
      const response = await paymentsApi.create(paymentPayload);

      if (response.success) {
        showInvoiceToast("success", `Payment of ₹${paymentData.amount.toLocaleString("en-IN")} collected successfully`);
        
        // Refresh the invoices to get updated payment status
        await fetchInvoices();
      } else {
        throw new Error(response.message || "Payment processing failed");
      }
    } catch (error) {
      console.error("Payment processing failed:", error);
      showInvoiceToast("error", "Failed to process payment. Please try again.");
      throw error;
    }
  };

  const handleRefund = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setRefundModalOpen(true);
  };

  const handleRefundSubmit = async (refundData: {
    amount: number;
    reason: string;
    refundMethod: string;
    transactionId?: string;
  }) => {
    try {
      await invoiceApi.processRefund({
        invoiceId: selectedInvoice?.id as string,
        ...refundData,
      });
      showInvoiceToast("success", `Refund of ₹${refundData.amount.toLocaleString("en-IN")} processed successfully`);
      await fetchInvoices();
    } catch (err) {
      console.error("Error processing refund:", err);
      showInvoiceToast("error", "Failed to process refund. Please try again.");
      throw err;
    }
  };

  const handlePrint = async (invoice: Invoice, type: 'thermal' | 'a4') => {
    try {
      // If invoice already has items and payments, show immediately
      let enhancedInvoice: any = { ...invoice };
      try {
        const response = await invoiceApi.getById(invoice.id as string);
        if (response.success && response.data) {
          const fullInvoice = response.data as any;
          enhancedInvoice = {
            ...invoice,
            patientInfo: {
              ...invoice.patientInfo,
              age: fullInvoice.order?.patient?.age || (fullInvoice.order?.patient?.dateOfBirth ? String(Math.floor((Date.now() - new Date(fullInvoice.order.patient.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))) : "36"),
              gender: fullInvoice.order?.patient?.gender || invoice.patientInfo?.gender || "Male",
              address: fullInvoice.order?.patient?.address || invoice.patientInfo?.address || "12, Shanti Nagar, Medical Circle, Ahmedabad",
              phone: fullInvoice.order?.patient?.phone || invoice.patientPhone,
            },
            doctorInfo: {
              ...invoice.doctorInfo,
              name: fullInvoice.order?.doctor?.fullName || invoice.doctorName,
              qualification: fullInvoice.order?.doctor?.specialization || "MBBS, MD (Medicine)",
            },
            items: fullInvoice.order?.items?.map((item: any) => ({
              id: item.id,
              testName: item.test?.name || 'Laboratory Investigation',
              testCode: item.test?.code,
              hsnSacCode: item.test?.hsnSacCode || '999312',
              quantity: item.quantity || 1,
              unitPrice: Number(item.finalPrice || item.unitPrice || 0),
              total: Number(item.finalPrice || item.unitPrice || 0),
              taxableValue: Number(item.finalPrice || item.unitPrice || 0),
              cgstPercent: 9,
              cgstAmount: (Number(item.finalPrice || item.unitPrice || 0) * 0.09),
              sgstPercent: 9,
              sgstAmount: (Number(item.finalPrice || item.unitPrice || 0) * 0.09),
            })) || invoice.items || [],
            payments: fullInvoice.order?.payments || invoice.payments || [],
            cgstAmount: fullInvoice.cgstAmount || (invoice.gstAmount ? invoice.gstAmount / 2 : 0),
            sgstAmount: fullInvoice.sgstAmount || (invoice.gstAmount ? invoice.gstAmount / 2 : 0),
            igstAmount: fullInvoice.igstAmount || 0,
          };
        }
      } catch (err) {
        console.warn("Could not fetch extra invoice details, using transformed invoice:", err);
      }
      
      setSelectedInvoice(enhancedInvoice);
      if (type === 'thermal') {
        setThermalReceiptOpen(true);
      } else {
        setA4InvoiceOpen(true);
      }
    } catch (error) {
      console.error('Error in handlePrint:', error);
      setSelectedInvoice(invoice);
      if (type === 'thermal') {
        setThermalReceiptOpen(true);
      } else {
        setA4InvoiceOpen(true);
      }
    }
  };

  const handleSendBill = async (invoice: Invoice, method: 'whatsapp' | 'email') => {
    try {
      // Fetch complete invoice details for PDF generation
      const response = await invoiceApi.getById(invoice.id as string);
      if (response.success && response.data) {
        const fullInvoice = response.data as any;
        
        const enhancedInvoice = {
          ...invoice,
          items: fullInvoice.order?.items?.map((item: any) => ({
            id: item.id,
            testName: item.test?.name || 'Laboratory Service',
            testCode: item.test?.code,
            hsnSacCode: item.test?.hsnSacCode || '999312',
            quantity: item.quantity || 1,
            unitPrice: Number(item.finalPrice) || 0,
            total: Number(item.finalPrice) || 0,
            taxableValue: Number(item.finalPrice) || 0,
            cgstPercent: 9,
            cgstAmount: (Number(item.finalPrice) * 0.09),
            sgstPercent: 9,
            sgstAmount: (Number(item.finalPrice) * 0.09),
          })) || [],
          cgstAmount: fullInvoice.cgstAmount || 0,
          sgstAmount: fullInvoice.sgstAmount || 0,
          igstAmount: fullInvoice.igstAmount || 0,
        };
        
        setSelectedInvoice(enhancedInvoice);
        
        if (method === 'whatsapp') {
          setWhatsappShareOpen(true);
        } else {
          setEmailShareOpen(true);
        }
      } else {
        throw new Error('Failed to fetch invoice details');
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      showInvoiceToast('error', 'Failed to load invoice details. Please try again.');
      setSelectedInvoice(invoice);
      if (method === 'whatsapp') {
        setWhatsappShareOpen(true);
      } else {
        setEmailShareOpen(true);
      }
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (
      filters.paymentMode &&
      (inv.paymentMode || "").toUpperCase() !== filters.paymentMode.toUpperCase()
    ) {
      return false;
    }
    return true;
  });

  return (
    <DashboardLayout title="Invoices">
      <ToastManager />
      <div className="space-y-6">
        {/* Executive Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-sm">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">
                    Diagnostic Billing &amp; Invoicing ERP
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
                    <Sparkles className="h-3 w-3 text-cyan-400" />
                    Enterprise LIS
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-counter billing, front-desk day book reconciliation, overdue debt aging recovery, and GSTR-1 tax compliance.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Live Billing ERP Sync
            </span>

            <button
              onClick={() => handleTabChange("pos")}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              + Quick POS Billing
            </button>
            <button
              onClick={() => handleTabChange("daybook")}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-200 shadow hover:bg-slate-800 hover:text-white transition-all"
            >
              <Receipt className="h-4 w-4 text-emerald-400" />
              Day Book Shift Close
            </button>
            <button
              onClick={() => fetchInvoices()}
              title="Refresh register"
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-cyan-400" : "text-cyan-400"}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation Pills */}
        <div className="flex overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/90 p-1.5 text-xs font-semibold scrollbar-none gap-1.5">
          {[
            { id: "all", label: "All Invoices (Register)", count: invoices.length, icon: FileText },
            { id: "pos", label: "Quick POS Billing", isNew: true, icon: CreditCard },
            { id: "daybook", label: "Day Book & Shift Close", icon: Receipt },
            { id: "aging", label: "Due Aging Tracker", icon: Clock },
            { id: "b2b", label: "B2B & Referral Billing", icon: Stethoscope },
            { id: "gst", label: "GST & Tax Audit", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-md shadow-cyan-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "border border-slate-800 bg-slate-900 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.isNew && (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-950/60 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                    Fast
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: ALL INVOICES REGISTER */}
        {activeTab === "all" && (
          <div className="space-y-6">
            <BillingMetrics
              invoices={invoices}
              activeStatusFilter={filters.paymentStatus}
              onFilterStatus={(status) =>
                setFilters((prev) => ({ ...prev, paymentStatus: status }))
              }
            />

            {/* Batch Operations Bar */}
            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between rounded-2xl border border-cyan-500/30 bg-slate-950 p-4 text-white shadow-2xl animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl border border-cyan-500/30 bg-cyan-950/80 px-3 py-1 text-xs font-bold text-cyan-300">
                    {selectedIds.length} Selected
                  </span>
                  <span className="text-xs text-slate-300">
                    Batch actions available for selected invoices:
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBatchThermalPrint}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold hover:bg-amber-900/60 transition-colors shadow-sm"
                  >
                    <Printer className="h-3.5 w-3.5 text-amber-400" />
                    Batch Thermal Print
                  </button>
                  <button
                    onClick={handleBatchA4Print}
                    className="flex items-center gap-1.5 rounded-xl bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 text-xs font-semibold hover:bg-cyan-900/60 transition-colors shadow-sm"
                  >
                    <FileText className="h-3.5 w-3.5 text-cyan-400" />
                    Batch A4 Print
                  </button>
                  <button
                    onClick={handleBatchExport}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                    Batch Export CSV
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/80 p-1.5 text-slate-400 hover:text-white"
                    title="Clear selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <InvoiceFilters
              filters={filters}
              onFilterChange={handleFilterChange}
            />

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={() => fetchInvoices()}
                  className="mt-2 rounded-lg bg-red-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800"
                >
                  Retry
                </button>
              </div>
            )}

            <InvoiceTable
              invoices={filteredInvoices}
              loading={loading}
              selectedIds={selectedIds}
              pagination={pagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onRowClick={(inv) => setQuickDrawerInvoice(inv)}
              onDelete={handleDelete}
              onCollectPayment={handleCollectPayment}
              onPrint={handlePrint}
              onSendBill={handleSendBill}
              onRefund={handleRefund}
            />
          </div>
        )}

        {/* TAB 2: POINT OF SALE QUICK BILLING */}
        {activeTab === "pos" && (
          <QuickPOSBilling
            onSuccess={() => {
              fetchInvoices();
              handleTabChange("all");
            }}
          />
        )}

        {/* TAB 3: DAY BOOK & CASH DRAWER RECONCILIATION */}
        {activeTab === "daybook" && (
          <DayBookReconciliation invoices={invoices} onRefresh={fetchInvoices} />
        )}

        {/* TAB 4: DUE AGING TRACKER */}
        {activeTab === "aging" && (
          <DueAgingTracker
            invoices={invoices}
            onCollectPayment={handleCollectPayment}
            onSendBill={handleSendBill}
            onRefresh={fetchInvoices}
          />
        )}

        {/* TAB 5: B2B & REFERRAL DOCTOR BILLING */}
        {activeTab === "b2b" && (
          <DoctorReferralBilling invoices={invoices} />
        )}

        {/* TAB 6: GST & TAX AUDIT */}
        {activeTab === "gst" && (
          <GSTTaxAuditReport invoices={invoices} />
        )}

        {/* Slide-over Quick Inspector Drawer */}
        <InvoiceQuickDrawer
          invoice={quickDrawerInvoice}
          isOpen={!!quickDrawerInvoice}
          onClose={() => setQuickDrawerInvoice(null)}
          onCollectPayment={handleCollectPayment}
          onPrint={handlePrint}
          onSendBill={handleSendBill}
          onRefund={handleRefund}
        />

        <AdvancedPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          existingPayments={(selectedInvoice as any)?.payments || []}
          onPaymentSubmit={handlePaymentSubmit}
          onGenerateReceipt={(paymentData) => {
            // Auto-generate thermal receipt after payment
            if (selectedInvoice) {
              setSelectedInvoice(selectedInvoice);
              setThermalReceiptOpen(true);
            }
          }}
        />

        <RefundModal
          isOpen={refundModalOpen}
          onClose={() => {
            setRefundModalOpen(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          onRefundSubmit={handleRefundSubmit}
        />

        {thermalReceiptOpen && selectedInvoice && (
          <ThermalReceipt
            invoice={{
              invoiceNumber: selectedInvoice.invoiceNumber,
              patientName: selectedInvoice.patientName,
              patientUhid: selectedInvoice.patientUhid,
              patientPhone: selectedInvoice.patientPhone,
              patientAge: selectedInvoice.patientInfo?.age,
              patientGender: selectedInvoice.patientInfo?.gender,
              orderNumber: selectedInvoice.orderNumber,
              doctorName: selectedInvoice.doctorName,
              items: ((selectedInvoice as any)?.items && (selectedInvoice as any).items.length > 0)
                ? (selectedInvoice as any).items
                : [
                    {
                      testName: "Diagnostic Laboratory Service",
                      hsnSacCode: "999312",
                      quantity: 1,
                      unitPrice: selectedInvoice.netPayable || selectedInvoice.totalAmount || 0,
                      total: selectedInvoice.netPayable || selectedInvoice.totalAmount || 0,
                    },
                  ],
              subtotal: selectedInvoice.totalAmount || selectedInvoice.netPayable || 0,
              discount: selectedInvoice.discount,
              gstAmount: selectedInvoice.gstAmount,
              cgstAmount: (selectedInvoice as any)?.cgstAmount || (selectedInvoice.gstAmount ? selectedInvoice.gstAmount / 2 : 0),
              sgstAmount: (selectedInvoice as any)?.sgstAmount || (selectedInvoice.gstAmount ? selectedInvoice.gstAmount / 2 : 0),
              igstAmount: (selectedInvoice as any)?.igstAmount || 0,
              netPayable: selectedInvoice.netPayable,
              paidAmount: selectedInvoice.paidAmount,
              pendingAmount: selectedInvoice.pendingAmount,
              paymentStatus: selectedInvoice.paymentStatus,
              paymentMode: selectedInvoice.paymentMode,
              createdAt: selectedInvoice.createdAt,
              dueDate: selectedInvoice.dueDate,
            }}
            cashierName={(selectedInvoice as any)?.payments?.[0]?.receivedBy || "Cash Desk #01 (Admin)"}
            labInfo={{
              name: "LABCORE DIAGNOSTICS & RESEARCH INSTITUTE",
              subName: "Central Clinical & Molecular Reference Laboratory",
              branch: "Main Central Counter #01 (OPD)",
              address: "Plot 42-A, Health Avenue, Medical Enclave",
              city: "Ahmedabad, Gujarat - 380016",
              phone: "+91 98765 43210",
              gstin: "24ABCDE1234F1Z5",
              email: "billing@labcore.in",
              website: "www.labcore.in",
              upiId: "labcore@icici",
              nablNumber: "NABL MC-5678",
              isoStandard: "ISO 15189:2022",
              icmrNumber: "ICMR: LAB-9042",
            }}
            paperWidth="80mm"
            onSwitchToA4={() => {
              setThermalReceiptOpen(false);
              setA4InvoiceOpen(true);
            }}
            onClose={() => {
              setThermalReceiptOpen(false);
              setSelectedInvoice(null);
            }}
          />
        )}

        {a4InvoiceOpen && selectedInvoice && (
          <PixelPerfectInvoice
            invoice={{
              id: String(selectedInvoice.id),
              invoiceNumber: selectedInvoice.invoiceNumber,
              invoiceDate: selectedInvoice.createdAt,
              invoiceTime: selectedInvoice.createdAt,
              paymentMode: (selectedInvoice.paymentMode as string) || "CASH",
              transactionId: (selectedInvoice as any)?.payments?.[0]?.transactionId || selectedInvoice.orderNumber,
              patientName: selectedInvoice.patientName,
              patientId: selectedInvoice.patientId == null ? undefined : String(selectedInvoice.patientId),
              patientUhid: selectedInvoice.patientUhid || "LC-000001",
              age: selectedInvoice.patientInfo?.age || "35",
              gender: selectedInvoice.patientInfo?.gender || "Male",
              phone: selectedInvoice.patientPhone,
              address: selectedInvoice.patientInfo?.address || "12, Shanti Nagar, Medical Circle, Ahmedabad",
              collectedBy: (selectedInvoice as any)?.payments?.[0]?.receivedBy || "Central Collection Counter",
              collectionDate: selectedInvoice.createdAt,
              collectionTime: selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleTimeString("en-IN") : "10:30 AM",
              sampleType: "Whole Blood EDTA / Serum",
              refDoctor: (selectedInvoice.doctorName as string) || "Self Referral",
              refDoctorQualification: selectedInvoice.doctorInfo?.qualification || "MBBS, MD (Medicine)",
              labBranch: "Main Central Processing Center",
              verifyCode: selectedInvoice.invoiceNumber?.replace(/[^0-9]/g, "").slice(-7) || "LC99120",
              items: ((selectedInvoice as any)?.items && (selectedInvoice as any).items.length > 0)
                ? (selectedInvoice as any).items.map((item: any) => ({
                    id: item.id,
                    testName: item.testName || "Diagnostic Investigation",
                    testCode: item.testCode,
                    hsnSacCode: item.hsnSacCode || "999312",
                    quantity: item.quantity || 1,
                    unitPrice: Number(item.unitPrice || item.total || 0),
                    unitRate: Number(item.unitPrice || item.total || 0),
                    amount: Number(item.total || item.unitPrice || 0),
                    discount: item.discount || 0,
                    taxableValue: Number(item.taxableValue || item.total || 0),
                  }))
                : [
                    {
                      id: "1",
                      testName: "Diagnostic Laboratory Service Profile",
                      hsnSacCode: "999312",
                      quantity: 1,
                      unitPrice: selectedInvoice.netPayable || selectedInvoice.totalAmount || 0,
                      amount: selectedInvoice.netPayable || selectedInvoice.totalAmount || 0,
                    },
                  ],
              subtotal: selectedInvoice.totalAmount || selectedInvoice.netPayable || 0,
              discount: selectedInvoice.discount || 0,
              taxableAmount: (selectedInvoice.totalAmount || selectedInvoice.netPayable || 0) - (selectedInvoice.discount || 0),
              cgstPercent: 9,
              cgstAmount: (selectedInvoice as any)?.cgstAmount || (selectedInvoice.gstAmount || 0) / 2,
              sgstPercent: 9,
              sgstAmount: (selectedInvoice as any)?.sgstAmount || (selectedInvoice.gstAmount || 0) / 2,
              igstPercent: 0,
              igstAmount: 0,
              totalTax: selectedInvoice.gstAmount || 0,
              grandTotal: selectedInvoice.netPayable || 0,
              netPayable: selectedInvoice.netPayable || 0,
              paidAmount: selectedInvoice.paidAmount || 0,
              amountPaid: selectedInvoice.paidAmount || 0,
              pendingAmount: selectedInvoice.pendingAmount,
              paymentDate: (selectedInvoice as any)?.payments?.[0]?.paidAt || selectedInvoice.createdAt,
              paymentStatus: selectedInvoice.paymentStatus === "PAID" ? "PAID" : "PENDING",
              bankName: "HDFC Bank Ltd.",
              accountName: "LabCore Diagnostics Pvt. Ltd.",
              accountNumber: "50200088991122",
              ifscCode: "HDFC0000123",
              upiId: "labcore@icici",
              whatsappNumber: selectedInvoice.patientPhone || "+91 98765 43210",
              verifiedBy: "Dr. Rajesh Pathak",
              verifierQualification: "MD Pathology (Reg No: G-45892)",
              verifierRegNo: "G-45892",
              labManager: (selectedInvoice as any)?.payments?.[0]?.receivedBy || "Dr. S. Mehta (Lab Director)",
              companyName: "LabCore Diagnostics Pvt. Ltd.",
            }}
            labInfo={{
              name: "LabCore Diagnostics Pvt. Ltd.",
              address: "123 Health Avenue, Medical District, Ahmedabad, Gujarat - 380016, India",
              phone: "+91 98765 43210",
              email: "info@labcore.in",
              website: "www.labcore.in",
              gstin: "24ABCDE1234F1Z5",
              pan: "ABCDE1234F",
              nablAccredited: "MC-5678 (ISO 15189:2022)",
              isoCertified: "ISO 9001:2015 & ISO 27001",
              hipaaCompliant: "Patient Data Protected",
            }}
            onSwitchToThermal={() => {
              setA4InvoiceOpen(false);
              setThermalReceiptOpen(true);
            }}
            onClose={() => {
              setA4InvoiceOpen(false);
              setSelectedInvoice(null);
            }}
          />
        )}

        {whatsappShareOpen && selectedInvoice && (
          <WhatsAppShare
            isOpen={whatsappShareOpen}
            onClose={() => {
              setWhatsappShareOpen(false);
              setSelectedInvoice(null);
            }}
            invoice={selectedInvoice}
            onGeneratePDF={async () => {
              // Generate professional PDF for WhatsApp sharing
              const { jsPDF } = await import('jspdf');
              const pdf = new jsPDF("p", "mm", "a4");
              const pageWidth = pdf.internal.pageSize.getWidth();
              
              // Header
              pdf.setFillColor(79, 70, 229);
              pdf.rect(0, 0, pageWidth, 40, "F");
              
              pdf.setTextColor(255, 255, 255);
              pdf.setFontSize(24);
              pdf.setFont("helvetica", "bold");
              pdf.text("LABCORE ELIS", 15, 18);
              
              pdf.setFontSize(10);
              pdf.setFont("helvetica", "normal");
              pdf.text("Enterprise Laboratory Information System", 15, 25);
              pdf.text("Diagnostic Laboratory Services", 15, 30);
              
              pdf.setFontSize(16);
              pdf.setFont("helvetica", "bold");
              pdf.text("TAX INVOICE", pageWidth - 15, 18, { align: "right" });
              
              pdf.setFontSize(10);
              pdf.setFont("helvetica", "normal");
              pdf.text(`Invoice: ${selectedInvoice.invoiceNumber}`, pageWidth - 15, 26, { align: "right" });
              pdf.text(`Date: ${new Date(selectedInvoice.createdAt || '').toLocaleDateString('en-IN')}`, pageWidth - 15, 32, { align: "right" });
              
              pdf.setTextColor(0, 0, 0);
              
              let yPosition = 50;
              
              // Bill To
              pdf.setFontSize(12);
              pdf.setFont("helvetica", "bold");
              pdf.text("Bill To:", 15, yPosition);
              yPosition += 8;
              
              pdf.setFont("helvetica", "normal");
              pdf.setFontSize(10);
              pdf.text(`Patient: ${selectedInvoice.patientName || "—"}`, 15, yPosition);
              yPosition += 5;
              if (selectedInvoice.patientUhid) {
                pdf.text(`UHID: ${selectedInvoice.patientUhid}`, 15, yPosition);
                yPosition += 5;
              }
              if (selectedInvoice.patientPhone) {
                pdf.text(`Phone: ${selectedInvoice.patientPhone}`, 15, yPosition);
                yPosition += 5;
              }
              
              yPosition += 10;
              
              // Items Table
              pdf.setFillColor(79, 70, 229);
              pdf.rect(15, yPosition, pageWidth - 30, 7, "F");
              
              pdf.setTextColor(255, 255, 255);
              pdf.setFontSize(8);
              pdf.setFont("helvetica", "bold");
              pdf.text("#", 17, yPosition + 5);
              pdf.text("Description", 25, yPosition + 5);
              pdf.text("Qty", 120, yPosition + 5);
              pdf.text("Amount", pageWidth - 17, yPosition + 5, { align: "right" });
              
              pdf.setTextColor(0, 0, 0);
              yPosition += 7;
              
              const items = (selectedInvoice as any)?.items || [];
              items.forEach((item: any, index: number) => {
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(8);
                pdf.text(String(index + 1), 17, yPosition + 4);
                pdf.text(item.testName || "Laboratory Service", 25, yPosition + 4);
                pdf.text(String(item.quantity || 1), 120, yPosition + 4);
                pdf.setFont("helvetica", "bold");
                pdf.text(`₹${(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 17, yPosition + 4, { align: "right" });
                yPosition += 6;
              });
              
              yPosition += 10;
              
              // Summary
              pdf.setDrawColor(229, 231, 235);
              pdf.line(15, yPosition, pageWidth - 15, yPosition);
              yPosition += 8;
              
              pdf.setFont("helvetica", "normal");
              pdf.setFontSize(9);
              pdf.text("Subtotal", 15, yPosition);
              pdf.setFont("helvetica", "bold");
              pdf.text(`₹${(selectedInvoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 17, yPosition, { align: "right" });
              yPosition += 6;
              
              if (selectedInvoice.discount && selectedInvoice.discount > 0) {
                pdf.setFont("helvetica", "normal");
                pdf.text("Discount", 15, yPosition);
                pdf.setTextColor(220, 38, 38);
                pdf.text(`-₹${selectedInvoice.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 17, yPosition, { align: "right" });
                pdf.setTextColor(0, 0, 0);
                yPosition += 6;
              }
              
              pdf.setFont("helvetica", "normal");
              pdf.text("GST", 15, yPosition);
              pdf.setFont("helvetica", "bold");
              pdf.text(`₹${(selectedInvoice.gstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 17, yPosition, { align: "right" });
              yPosition += 8;
              
              pdf.setDrawColor(79, 70, 229);
              pdf.line(15, yPosition, pageWidth - 15, yPosition);
              yPosition += 8;
              
              pdf.setFontSize(11);
              pdf.setFont("helvetica", "bold");
              pdf.text("Grand Total", 15, yPosition);
              pdf.text(`₹${(selectedInvoice.netPayable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 17, yPosition, { align: "right" });
              yPosition += 6;
              
              pdf.setFont("helvetica", "normal");
              pdf.setFontSize(9);
              pdf.text("Amount Paid", 15, yPosition);
              pdf.setTextColor(22, 163, 74);
              pdf.setFont("helvetica", "bold");
              pdf.text(`₹${(selectedInvoice.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 17, yPosition, { align: "right" });
              pdf.setTextColor(0, 0, 0);
              yPosition += 6;
              
              pdf.setFont("helvetica", "normal");
              pdf.setFontSize(9);
              pdf.text("Balance Due", 15, yPosition);
              pdf.setTextColor(220, 38, 38);
              pdf.setFont("helvetica", "bold");
              pdf.text(`₹${(selectedInvoice.pendingAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 17, yPosition, { align: "right" });
              pdf.setTextColor(0, 0, 0);
              
              // Footer
              yPosition = 280;
              pdf.setFontSize(8);
              pdf.setFont("helvetica", "normal");
              pdf.setTextColor(107, 114, 128);
              pdf.text("Generated by LabCore ELIS | For queries, please contact billing department", pageWidth / 2, yPosition, { align: "center" });
              pdf.setTextColor(0, 0, 0);
              
              return pdf.output("blob");
            }}
          />
        )}

        {emailShareOpen && selectedInvoice && (
          <EmailShare
            isOpen={emailShareOpen}
            onClose={() => {
              setEmailShareOpen(false);
              setSelectedInvoice(null);
            }}
            invoice={selectedInvoice}
            doctorInfo={{
              name: selectedInvoice.doctorName,
              email: selectedInvoice.doctorEmail,
            }}
            onGeneratePDF={async () => {
              // Generate professional PDF for email attachment
              const { jsPDF } = await import('jspdf');
              const pdf = new jsPDF("p", "mm", "a4");
              const pageWidth = pdf.internal.pageSize.getWidth();
              
              // Header
              pdf.setFillColor(79, 70, 229);
              pdf.rect(0, 0, pageWidth, 40, "F");
              
              pdf.setTextColor(255, 255, 255);
              pdf.setFontSize(24);
              pdf.setFont("helvetica", "bold");
              pdf.text("LABCORE ELIS", 15, 18);
              
              pdf.setFontSize(10);
              pdf.setFont("helvetica", "normal");
              pdf.text("Enterprise Laboratory Information System", 15, 25);
              pdf.text("Diagnostic Laboratory Services", 15, 30);
              
              pdf.setFontSize(16);
              pdf.setFont("helvetica", "bold");
              pdf.text("TAX INVOICE", pageWidth - 15, 18, { align: "right" });
              
              pdf.setFontSize(10);
              pdf.setFont("helvetica", "normal");
              pdf.text(`Invoice: ${selectedInvoice.invoiceNumber}`, pageWidth - 15, 26, { align: "right" });
              pdf.text(`Date: ${new Date(selectedInvoice.createdAt || '').toLocaleDateString('en-IN')}`, pageWidth - 15, 32, { align: "right" });
              
              pdf.setTextColor(0, 0, 0);
              
              let yPosition = 50;
              
              // Bill To
              pdf.setFontSize(12);
              pdf.setFont("helvetica", "bold");
              pdf.text("Bill To:", 15, yPosition);
              yPosition += 8;
              
              pdf.setFont("helvetica", "normal");
              pdf.setFontSize(10);
              pdf.text(`Patient: ${selectedInvoice.patientName || "—"}`, 15, yPosition);
              yPosition += 5;
              if (selectedInvoice.patientUhid) {
                pdf.text(`UHID: ${selectedInvoice.patientUhid}`, 15, yPosition);
                yPosition += 5;
              }
              if (selectedInvoice.patientPhone) {
                pdf.text(`Phone: ${selectedInvoice.patientPhone}`, 15, yPosition);
                yPosition += 5;
              }
              if (selectedInvoice.patientEmail) {
                pdf.text(`Email: ${selectedInvoice.patientEmail}`, 15, yPosition);
                yPosition += 5;
              }
              
              yPosition += 10;
              
              // Items Table
              pdf.setFillColor(79, 70, 229);
              pdf.rect(15, yPosition, pageWidth - 30, 7, "F");
              
              pdf.setTextColor(255, 255, 255);
              pdf.setFontSize(8);
              pdf.setFont("helvetica", "bold");
              pdf.text("#", 17, yPosition + 5);
              pdf.text("Description", 25, yPosition + 5);
              pdf.text("Qty", 120, yPosition + 5);
              pdf.text("Amount", pageWidth - 17, yPosition + 5, { align: "right" });
              
              pdf.setTextColor(0, 0, 0);
              yPosition += 7;
              
              const items = (selectedInvoice as any)?.items || [];
              items.forEach((item: any, index: number) => {
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(8);
                pdf.text(String(index + 1), 17, yPosition + 4);
                pdf.text(item.testName || "Laboratory Service", 25, yPosition + 4);
                pdf.text(String(item.quantity || 1), 120, yPosition + 4);
                pdf.setFont("helvetica", "bold");
                pdf.text(`₹${(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 17, yPosition + 4, { align: "right" });
                yPosition += 6;
              });
              
              yPosition += 10;
              
              // Summary
              pdf.setDrawColor(229, 231, 235);
              pdf.line(15, yPosition, pageWidth - 15, yPosition);
              yPosition += 8;
              
              pdf.setFont("helvetica", "normal");
              pdf.setFontSize(9);
              pdf.text("Subtotal", 15, yPosition);
              pdf.setFont("helvetica", "bold");
              pdf.text(`₹${(selectedInvoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 17, yPosition, { align: "right" });
              yPosition += 6;
              
              if (selectedInvoice.discount && selectedInvoice.discount > 0) {
                pdf.setFont("helvetica", "normal");
                pdf.text("Discount", 15, yPosition);
                pdf.setTextColor(220, 38, 38);
                pdf.text(`-₹${selectedInvoice.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 17, yPosition, { align: "right" });
                pdf.setTextColor(0, 0, 0);
                yPosition += 6;
              }
              
              pdf.setFont("helvetica", "normal");
              pdf.text("GST", 15, yPosition);
              pdf.setFont("helvetica", "bold");
              pdf.text(`₹${(selectedInvoice.gstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 17, yPosition, { align: "right" });
              yPosition += 8;
              
              pdf.setDrawColor(79, 70, 229);
              pdf.line(15, yPosition, pageWidth - 15, yPosition);
              yPosition += 8;
              
              pdf.setFontSize(11);
              pdf.setFont("helvetica", "bold");
              pdf.text("Grand Total", 15, yPosition);
              pdf.text(`₹${(selectedInvoice.netPayable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 17, yPosition, { align: "right" });
              yPosition += 6;
              
              pdf.setFont("helvetica", "normal");
              pdf.setFontSize(9);
              pdf.text("Amount Paid", 15, yPosition);
              pdf.setTextColor(22, 163, 74);
              pdf.setFont("helvetica", "bold");
              pdf.text(`₹${(selectedInvoice.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 17, yPosition, { align: "right" });
              pdf.setTextColor(0, 0, 0);
              yPosition += 6;
              
              pdf.setFont("helvetica", "normal");
              pdf.setFontSize(9);
              pdf.text("Balance Due", 15, yPosition);
              pdf.setTextColor(220, 38, 38);
              pdf.setFont("helvetica", "bold");
              pdf.text(`₹${(selectedInvoice.pendingAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 17, yPosition, { align: "right" });
              pdf.setTextColor(0, 0, 0);
              
              // Footer
              yPosition = 280;
              pdf.setFontSize(8);
              pdf.setFont("helvetica", "normal");
              pdf.setTextColor(107, 114, 128);
              pdf.text("Generated by LabCore ELIS | For queries, please contact billing department", pageWidth / 2, yPosition, { align: "center" });
              pdf.setTextColor(0, 0, 0);
              
              return pdf.output("blob");
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
