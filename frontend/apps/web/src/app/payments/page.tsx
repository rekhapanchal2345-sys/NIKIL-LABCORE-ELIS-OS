"use client";

import React, { useEffect, useMemo, useState, Fragment } from "react";
import DashboardLayout from "@/components/layout/dashboardlayout";
import {
  paymentApi,
  orderApi,
  patientApi,
  refundsApi,
  advancesApi,
  cashCounterApi,
  settlementsApi,
} from "@/lib/api";
import PaymentReceipt from "@/components/payments/PaymentReceipt";
import PaymentDetailModal from "@/components/payments/PaymentDetailModal";
import CollectPaymentModal from "@/components/payments/CollectPaymentModal";
import FinancialReportModal from "@/components/payments/FinancialReportModal";
import ShiftHandoverModal from "@/components/payments/ShiftHandoverModal";
import AdvanceDepositModal from "@/components/payments/AdvanceDepositModal";
import RefundRequestModal from "@/components/payments/RefundRequestModal";
import WhatsAppReceiptModal from "@/components/payments/WhatsAppReceiptModal";
import NotificationDispatchModal, { NotificationPayload } from "@/components/common/NotificationDispatchModal";
import {
  Search,
  Plus,
  Download,
  RefreshCw,
  Printer,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  CreditCard,
  DollarSign,
  ShieldCheck,
  User,
  Phone,
  Calendar,
  ChevronRight,
  ChevronLeft,
  X,
  Eye,
  RotateCcw,
  Check,
  Building2,
  HelpCircle,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Percent,
  Layers,
  ArrowUpDown,
  Coins,
  Send,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Sparkles,
  Tag,
  Activity,
  Receipt,
  Barcode,
  PenLine,
} from "lucide-react";

type PaymentStatus =
  | "PAID"
  | "PARTIALLY_PAID"
  | "PENDING"
  | "FAILED"
  | "REFUND_PENDING"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "CANCELLED"
  | "VOID"
  | "CREDIT"
  | "ADVANCE";

type PaymentMethod = "CASH" | "CARD" | "UPI" | "NET_BANKING" | "CHEQUE" | "OTHER";

type Payment = {
  id: string;
  receiptNumber: string;
  transactionId: string;
  invoiceNumber?: string;
  invoiceId?: string;
  orderNumber?: string;
  orderId?: string;
  patientId?: string;
  patientName: string;
  patientUhid?: string;
  phone?: string;
  patientEmail?: string | null;
  patientAge?: number | null;
  patientGender?: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string;
  createdAt?: string;
  collectedBy?: string;
  counter?: string;
  settlement?: string;
  remarks?: string | null;
  invoiceTotal?: number;
  invoicePaid?: number;
  invoiceBalance?: number;
};

type SummaryStats = {
  totalCollection: number;
  todayCollection: number;
  cashInHand: number;
  digitalPayments: number;
  pendingSettlements: number;
  outstandingReceivables: number;
  cashDrawer: number;
};

const paymentTabs = [
  "Overview",
  "Transactions",
  "Receivables",
  "Advances & Wallet",
  "Refunds",
  "Cash Counter",
  "Settlements",
  "Reconciliation",
  "Reports",
  "Audit Log",
] as const;

type PaymentTab = (typeof paymentTabs)[number];

const demoPayments: Payment[] = [
  {
    id: "txn-1001",
    receiptNumber: "REC-2026-1001",
    transactionId: "TXN-363",
    invoiceNumber: "INV-178904",
    orderNumber: "ORD-2026-8636",
    patientName: "Panchal Ashokkumar",
    patientUhid: "UHID-24811",
    phone: "+91 98765 43210",
    amount: 5040,
    method: "CARD",
    status: "PAID",
    paidAt: "2026-09-26T17:55:00",
    collectedBy: "Jaya Ashapurama",
    counter: "Counter 01",
    settlement: "SETTLED",
  },
  {
    id: "txn-1002",
    receiptNumber: "REC-2026-1002",
    transactionId: "TXN-364",
    invoiceNumber: "INV-178905",
    orderNumber: "ORD-2026-8640",
    patientName: "Seema Shah",
    patientUhid: "UHID-24812",
    phone: "+91 99887 66112",
    amount: 2780,
    method: "UPI",
    status: "PARTIALLY_PAID",
    paidAt: "2026-09-26T09:30:00",
    collectedBy: "Riya Patel",
    counter: "Counter 02",
    settlement: "PENDING",
  },
  {
    id: "txn-1003",
    receiptNumber: "REC-2026-1003",
    transactionId: "TXN-365",
    invoiceNumber: "INV-178906",
    orderNumber: "ORD-2026-8645",
    patientName: "Nirav Joshi",
    patientUhid: "UHID-24815",
    phone: "+91 91234 56789",
    amount: 15400,
    method: "CASH",
    status: "PAID",
    paidAt: "2026-09-26T12:15:00",
    collectedBy: "Prakash Mehta",
    counter: "Counter 01",
    settlement: "SETTLED",
  },
  {
    id: "txn-1004",
    receiptNumber: "REC-2026-1004",
    transactionId: "TXN-366",
    invoiceNumber: "INV-178907",
    orderNumber: "ORD-2026-8651",
    patientName: "Anita Verma",
    patientUhid: "UHID-24816",
    phone: "+91 98700 11223",
    amount: 6350,
    method: "NET_BANKING",
    status: "REFUND_PENDING",
    paidAt: "2026-09-25T18:05:00",
    collectedBy: "Jaya Ashapurama",
    counter: "Counter 03",
    settlement: "RECONCILE",
  },
  {
    id: "txn-1005",
    receiptNumber: "REC-2026-1005",
    transactionId: "TXN-367",
    invoiceNumber: "INV-178908",
    orderNumber: "ORD-2026-8654",
    patientName: "Harshad Shah",
    patientUhid: "UHID-24819",
    phone: "+91 98980 12345",
    amount: 9200,
    method: "CHEQUE",
    status: "PENDING",
    paidAt: "2026-09-26T08:00:00",
    collectedBy: "Riya Patel",
    counter: "Counter 02",
    settlement: "PENDING",
  },
];

import { formatIndianRupees, maskPhoneNumber, roundHalfUp } from "@/lib/money";

const defaultSummary: SummaryStats = {
  totalCollection: 0,
  todayCollection: 0,
  cashInHand: 0,
  digitalPayments: 0,
  pendingSettlements: 0,
  outstandingReceivables: 0,
  cashDrawer: 0,
};

function formatCurrency(value: number) {
  return formatIndianRupees(value || 0);
}

function formatDate(date: string | number) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: string | number) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMethodBadge(method: PaymentMethod) {
  const map: Record<PaymentMethod, string> = {
    CASH: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    CARD: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    UPI: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    NET_BANKING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    CHEQUE: "bg-slate-100 text-slate-700 ring-1 ring-slate-300",
    OTHER: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
  };
  return map[method] ?? map.OTHER;
}

function getStatusBadge(status: PaymentStatus) {
  const map: Record<PaymentStatus, string> = {
    PAID: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    PARTIALLY_PAID: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    FAILED: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    REFUND_PENDING: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
    PARTIALLY_REFUNDED: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
    REFUNDED: "bg-rose-100 text-rose-800 ring-1 ring-rose-300",
    CANCELLED: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
    VOID: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200",
    CREDIT: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
    ADVANCE: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
}

function getMethodIcon(method: PaymentMethod) {
  const icons: Record<PaymentMethod, string> = {
    CASH: "💵",
    CARD: "💳",
    UPI: "📱",
    NET_BANKING: "🏦",
    CHEQUE: "🧾",
    OTHER: "💰",
  };
  return icons[method] ?? icons.OTHER;
}

function getStatusLabel(status: PaymentStatus) {
  return status.replace(/_/g, " ");
}

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<PaymentTab>("Overview");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [summary, setSummary] = useState<SummaryStats>(defaultSummary);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<"paidAt" | "amount" | "patientName">("paidAt");
  const [sortAsc, setSortAsc] = useState(false);

  // Receivables Aging Filter
  const [agingFilter, setAgingFilter] = useState<"ALL" | "CURRENT" | "8-15" | "16-30" | "30+">("ALL");

  // Multi-counter Till State
  const [activeCounter, setActiveCounter] = useState("Counter 01 (Main OPD)");
  const [pettyCashMovements, setPettyCashMovements] = useState<
    Array<{ id: string; time: string; type: "IN" | "OUT"; amount: number; reason: string }>
  >([
    { id: "mov-1", time: "11:30 AM", type: "OUT", amount: 250, reason: "Phlebotomy Ice Pack & Dry Ice" },
    { id: "mov-2", time: "02:15 PM", type: "OUT", amount: 180, reason: "Urgent Biopsy Courier" },
    { id: "mov-3", time: "09:00 AM", type: "IN", amount: 26250, reason: "Shift Opening Float Till Allocation" },
  ]);
  const [pettyAmount, setPettyAmount] = useState("");
  const [pettyType, setPettyType] = useState<"IN" | "OUT">("OUT");
  const [pettyReason, setPettyReason] = useState("");
  const [isPettyModalOpen, setIsPettyModalOpen] = useState(false);

  // Settlements Table State
  const [settlementBatches, setSettlementBatches] = useState<any[]>([
    {
      id: "SET-2026-441",
      provider: "PineLabs Card POS",
      gross: 34500,
      fees: 517.5,
      net: 33982.5,
      utr: "UTRIB20260926041",
      status: "SETTLED",
      date: "2026-09-26",
    },
    {
      id: "SET-2026-442",
      provider: "Razorpay Dynamic QR",
      gross: 21800,
      fees: 0,
      net: 21800,
      utr: "UPIPAY20260926992",
      status: "SETTLED",
      date: "2026-09-26",
    },
    {
      id: "SET-2026-443",
      provider: "HDFC Card Terminal 02",
      gross: 12500,
      fees: 187.5,
      net: 12312.5,
      utr: "PENDING_CREDIT",
      status: "PENDING",
      date: "2026-09-26",
    },
    {
      id: "SET-2026-444",
      provider: "ICICI POS Terminal 03",
      gross: 8900,
      fees: 133.5,
      net: 8766.5,
      utr: "PENDING_CREDIT",
      status: "PENDING",
      date: "2026-09-25",
    },
  ]);

  // Reconciliation Table State
  const [reconcileFilter, setReconcileFilter] = useState<"ALL" | "MATCHED" | "PENDING">("ALL");

  // Modals
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<any | null>(null);
  const [selectedDetailPaymentId, setSelectedDetailPaymentId] = useState<string | null>(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [initialCollectOrderId, setInitialCollectOrderId] = useState("");
  const [initialCollectAmount, setInitialCollectAmount] = useState("");

  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [initialAdvancePatientId, setInitialAdvancePatientId] = useState("");

  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [initialRefundPaymentId, setInitialRefundPaymentId] = useState("");
  const [initialRefundAmount, setInitialRefundAmount] = useState("");

  const [isShiftHandoverOpen, setIsShiftHandoverOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // WhatsApp Modal
  const [whatsAppModalData, setWhatsAppModalData] = useState<any | null>(null);

  // Notification Dispatch Modal
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyPayload, setNotifyPayload] = useState<NotificationPayload | null>(null);

  // URL State Synchronization (Level 4)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('tab')) setActiveTab(urlParams.get('tab') as any);
      if (urlParams.has('status')) setStatusFilter(urlParams.get('status') || "All");
      if (urlParams.has('method')) setMethodFilter(urlParams.get('method') || "All");
      if (urlParams.has('date')) setDateFilter(urlParams.get('date') || "All");
      if (urlParams.has('search')) setSearch(urlParams.get('search') || "");
      if (urlParams.has('aging')) setAgingFilter(urlParams.get('aging') as any);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      
      if (activeTab !== "Overview") url.searchParams.set("tab", activeTab);
      else url.searchParams.delete("tab");

      if (statusFilter !== "All") url.searchParams.set("status", statusFilter);
      else url.searchParams.delete("status");

      if (methodFilter !== "All") url.searchParams.set("method", methodFilter);
      else url.searchParams.delete("method");

      if (dateFilter !== "All") url.searchParams.set("date", dateFilter);
      else url.searchParams.delete("date");

      if (search) url.searchParams.set("search", search);
      else url.searchParams.delete("search");

      if (agingFilter !== "ALL") url.searchParams.set("aging", agingFilter);
      else url.searchParams.delete("aging");

      window.history.replaceState(null, '', url.toString());
    }
  }, [activeTab, statusFilter, methodFilter, dateFilter, search, agingFilter]);

  const handleNotifyPayment = (payment: Payment) => {
    setNotifyPayload({
      patientId: payment.patientId,
      patientName: payment.patientName,
      phone: payment.phone,
      email: payment.patientEmail || undefined,
      uhid: payment.patientUhid,
      context: "PAYMENT",
      receiptNumber: payment.receiptNumber,
      amount: payment.amount,
      dueBalance: payment.invoiceBalance,
      orderNumber: payment.orderNumber,
      date: payment.paidAt,
    });
    setNotifyModalOpen(true);
  };

  // Recent Payment Ledger Advanced State
  const [expandedLedgerRowId, setExpandedLedgerRowId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [ledgerQuickFilter, setLedgerQuickFilter] = useState<
    "ALL" | "CASH" | "UPI" | "CARD" | "NET_BANKING" | "CHEQUE" | "REFUNDED"
  >("ALL");

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedText(text);
    showNotification(`${label} copied: ${text}`, "info");
    setTimeout(() => setCopiedText(null), 2000);
  };

  const showNotification = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  useEffect(() => {
    fetchMetrics();
    fetchPayments();
    fetchOrdersAndPatients();

    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlOrderId = params.get("orderId");
        const urlPatientId = params.get("patientId");
        const urlAmount = params.get("amount");
        const urlTab = params.get("tab");

        if (urlTab && paymentTabs.includes(urlTab as PaymentTab)) {
          setActiveTab(urlTab as PaymentTab);
        }

        if (urlOrderId) {
          setInitialCollectOrderId(urlOrderId);
          if (urlAmount) setInitialCollectAmount(urlAmount);
          setIsCollectModalOpen(true);
        } else if (urlPatientId) {
          setInitialAdvancePatientId(urlPatientId);
          if (urlAmount) {
            setInitialCollectAmount(urlAmount);
            setIsCollectModalOpen(true);
          }
        }
      } catch (e) {
        console.error("Error reading URL search params:", e);
      }
    }
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await paymentApi.getMetrics();
      if (response?.success && response?.data) {
        const data = response.data as Partial<SummaryStats>;
        setSummary({
          totalCollection: data.totalCollection ?? 0,
          todayCollection: data.todayCollection ?? 0,
          cashInHand: data.cashInHand ?? 0,
          digitalPayments: data.digitalPayments ?? 0,
          pendingSettlements: data.pendingSettlements ?? 0,
          outstandingReceivables: data.outstandingReceivables ?? 0,
          cashDrawer: data.cashDrawer ?? 0,
        });
      }
    } catch (err) {
      console.error("Payment metrics load error:", err);
    }
  };

  const fetchOrdersAndPatients = async () => {
    try {
      const [ordersRes, patientsRes] = await Promise.all([
        orderApi.getAll("limit=100").catch(() => null),
        patientApi.getAll("limit=100").catch(() => null),
      ]);

      if (ordersRes?.data) {
        const orderList = ordersRes.data.orders || ordersRes.data || [];
        setOrders(Array.isArray(orderList) ? orderList : []);
      }
      if (patientsRes?.data) {
        const patientList = patientsRes.data.patients || patientsRes.data || [];
        setPatients(Array.isArray(patientList) ? patientList : []);
      }
    } catch (err) {
      console.error("Error fetching orders & patients:", err);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentApi.getAll("page=1&limit=100");
      if (response?.success && response?.data) {
        const payload = response.data as any;
        const rawPayments =
          payload.payments || payload.transactions || payload.items || payload.data || [];

        if (Array.isArray(rawPayments) && rawPayments.length > 0) {
          const mapped: Payment[] = rawPayments.map((item: any) => {
            const linkedOrder = item.order || {};
            const linkedPatient = linkedOrder.patient || {};
            const linkedInvoice = linkedOrder.invoice || {};

            return {
              id: item.id || `txn-${Math.random()}`,
              receiptNumber: item.receiptNumber || `REC-${item.id || "001"}`,
              transactionId: item.transactionId || `TXN-${item.id?.slice(-4) || "000"}`,
              invoiceNumber: linkedInvoice.invoiceNumber || item.invoiceNumber,
              invoiceId: linkedInvoice.id || item.invoiceId,
              orderNumber: linkedOrder.orderNumber || item.orderNumber,
              orderId: item.orderId || linkedOrder.id,
              patientId: linkedPatient.id || item.patientId,
              patientName:
                item.patientName ||
                (linkedPatient.firstName
                  ? `${linkedPatient.firstName} ${linkedPatient.lastName || ""}`.trim()
                  : "Patient"),
              patientUhid: item.patientUhid || linkedPatient.uhid,
              phone: item.phone || linkedPatient.phone || "No phone",
              patientEmail: item.patientEmail || linkedPatient.email,
              patientAge: item.patientAge || linkedPatient.age,
              patientGender: item.patientGender || linkedPatient.gender,
              amount: Number(item.amount || 0),
              method: (item.method || "CASH") as PaymentMethod,
              status: (item.status || "PAID") as PaymentStatus,
              paidAt: item.paidAt || item.createdAt || new Date().toISOString(),
              createdAt: item.createdAt || item.paidAt || new Date().toISOString(),
              collectedBy: item.receivedBy?.fullName || item.collectedBy || "Front Desk Cashier",
              counter: item.counter || "Counter 01",
              settlement: item.settlement || "SETTLED",
              remarks: item.remarks,
              invoiceTotal: linkedInvoice.grandTotal ? Number(linkedInvoice.grandTotal) : undefined,
              invoicePaid: linkedInvoice.paidAmount ? Number(linkedInvoice.paidAmount) : undefined,
              invoiceBalance: linkedInvoice.dueAmount ? Number(linkedInvoice.dueAmount) : undefined,
            };
          });

          setPayments(mapped);
        } else {
          setPayments([]);
        }
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error("Payment data load error:", err);
      setError("Unable to reach payment service. Showing current ledger.");
      setPayments([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchMetrics(), fetchPayments(), fetchOrdersAndPatients()]);
    setIsRefreshing(false);
    showNotification("Payments dashboard refreshed successfully!", "info");
  };

  // Open Receipt
  const handleOpenReceipt = (payment: any) => {
    const linkedOrder = orders.find(
      (o) => o.id === payment.orderId || o.orderNumber === payment.orderNumber
    );

    const items = linkedOrder?.items?.map((item: any) => ({
      name: item.test?.testName || item.testName || "Diagnostic Pathology Test",
      code: item.test?.testCode || item.testCode,
      department: item.test?.sampleType || item.test?.department || "Pathology",
      price: Number(item.price || item.finalPrice || payment.amount),
    }));

    setSelectedReceiptPayment({
      id: payment.id,
      receiptNumber: payment.receiptNumber || `REC-${payment.id}`,
      orderId: payment.orderId || linkedOrder?.id || "",
      orderNumber: payment.orderNumber || linkedOrder?.orderNumber || "—",
      patientId: payment.patientId || linkedOrder?.patient?.id || "",
      patientName:
        payment.patientName ||
        (linkedOrder?.patient
          ? `${linkedOrder.patient.firstName || ""} ${linkedOrder.patient.lastName || ""}`.trim()
          : "Patient"),
      patientUhid: payment.patientUhid || linkedOrder?.patient?.uhid,
      patientPhone: payment.phone || linkedOrder?.patient?.phone || null,
      patientEmail: payment.patientEmail || linkedOrder?.patient?.email || null,
      patientAge: payment.patientAge || linkedOrder?.patient?.age || null,
      patientGender: payment.patientGender || linkedOrder?.patient?.gender || null,
      patientAddress: linkedOrder?.patient?.address || null,
      doctorName: linkedOrder?.doctor?.fullName || linkedOrder?.doctorName || null,
      doctorQualification: linkedOrder?.doctor?.specialization || null,
      invoiceId: payment.invoiceId,
      invoiceNumber: payment.invoiceNumber,
      invoiceTotal:
        payment.invoiceTotal ||
        (linkedOrder?.grandTotal ? Number(linkedOrder.grandTotal) : undefined),
      invoicePaid:
        payment.invoicePaid || (linkedOrder?.paidAmount ? Number(linkedOrder.paidAmount) : undefined),
      invoiceBalance:
        payment.invoiceBalance !== undefined
          ? payment.invoiceBalance
          : linkedOrder?.dueAmount
          ? Number(linkedOrder.dueAmount)
          : undefined,
      amount: Number(payment.amount || 0),
      method: payment.method || "CASH",
      status: payment.status || "PAID",
      transactionId: payment.transactionId || null,
      remarks: payment.remarks || null,
      paidAt: payment.paidAt || new Date().toISOString(),
      createdAt: payment.createdAt || payment.paidAt || new Date().toISOString(),
      collectedBy: payment.collectedBy || "Jaya Ashapurama",
      counter: payment.counter || "Counter 01",
      settlement: payment.settlement || "SETTLED",
      items: items && items.length > 0 ? items : undefined,
      receivedBy: {
        id: "emp-104",
        fullName: payment.collectedBy || "Jaya Ashapurama",
        employeeCode: "EMP-104",
        role: "Senior Billing Cashier",
      },
    });
  };

  // Add Petty Cash Movement
  const handleAddPettyMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(pettyAmount);
    if (!amt || amt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    const newMovement = {
      id: `mov-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: pettyType,
      amount: amt,
      reason: pettyReason || (pettyType === "OUT" ? "Petty Cash Outflow" : "Till Cash Top-up"),
    };

    setPettyCashMovements([newMovement, ...pettyCashMovements]);
    setSummary((prev) => ({
      ...prev,
      cashDrawer: pettyType === "IN" ? prev.cashDrawer + amt : prev.cashDrawer - amt,
      cashInHand: pettyType === "IN" ? prev.cashInHand + amt : prev.cashInHand - amt,
    }));

    showNotification(
      `Petty Cash ${pettyType === "IN" ? "Added" : "Deducted"}: ${formatCurrency(amt)}`,
      "info"
    );
    setPettyAmount("");
    setPettyReason("");
    setIsPettyModalOpen(false);
  };

  // Mark Settlement Reconciled
  const handleReconcileSettlement = (batchId: string) => {
    const promptUtr = prompt("Enter Bank Credit UTR / Confirmation Reference #:", `UTRIB${Date.now().toString().slice(-8)}`);
    if (!promptUtr) return;

    setSettlementBatches((prev) =>
      prev.map((b) =>
        b.id === batchId
          ? { ...b, status: "SETTLED", utr: promptUtr }
          : b
      )
    );
    showNotification(`Batch ${batchId} reconciled with Bank UTR: ${promptUtr}!`, "success");
  };

  // Filtered & Sorted Payments for Transactions Table
  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = payments.filter((payment) => {
      const matchesSearch =
        !query ||
        payment.receiptNumber.toLowerCase().includes(query) ||
        payment.transactionId.toLowerCase().includes(query) ||
        payment.patientName.toLowerCase().includes(query) ||
        payment.invoiceNumber?.toLowerCase().includes(query) ||
        payment.orderNumber?.toLowerCase().includes(query) ||
        payment.patientUhid?.toLowerCase().includes(query) ||
        payment.phone?.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "All" || payment.status === statusFilter;
      const matchesMethod = methodFilter === "All" || payment.method === methodFilter;

      const matchesDate = (() => {
        if (dateFilter === "All") return true;
        const date = new Date(payment.paidAt);
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const yesterday = new Date(startOfToday);
        yesterday.setDate(yesterday.getDate() - 1);
        const last7 = new Date(startOfToday);
        last7.setDate(last7.getDate() - 6);
        const last30 = new Date(startOfToday);
        last30.setDate(last30.getDate() - 29);

        switch (dateFilter) {
          case "Today":
            return date >= startOfToday;
          case "Yesterday":
            return date >= yesterday && date < startOfToday;
          case "7 Days":
            return date >= last7;
          case "30 Days":
            return date >= last30;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesStatus && matchesMethod && matchesDate;
    });

    result.sort((a, b) => {
      if (sortField === "paidAt") {
        const timeA = new Date(a.paidAt).getTime();
        const timeB = new Date(b.paidAt).getTime();
        return sortAsc ? timeA - timeB : timeB - timeA;
      }
      if (sortField === "amount") {
        return sortAsc ? a.amount - b.amount : b.amount - a.amount;
      }
      if (sortField === "patientName") {
        return sortAsc
          ? a.patientName.localeCompare(b.patientName)
          : b.patientName.localeCompare(a.patientName);
      }
      return 0;
    });

    return result;
  }, [payments, search, statusFilter, methodFilter, dateFilter, sortField, sortAsc]);

  // Paginated Payments
  const totalPages = Math.ceil(filteredPayments.length / pageSize) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  // Recent Payment Ledger Filtered List (for Overview tab)
  const displayedLedgerPayments = useMemo(() => {
    let list = filteredPayments;
    if (ledgerQuickFilter === "CASH") list = list.filter((p) => p.method === "CASH");
    else if (ledgerQuickFilter === "UPI") list = list.filter((p) => p.method === "UPI");
    else if (ledgerQuickFilter === "CARD") list = list.filter((p) => p.method === "CARD");
    else if (ledgerQuickFilter === "NET_BANKING") list = list.filter((p) => p.method === "NET_BANKING");
    else if (ledgerQuickFilter === "CHEQUE") list = list.filter((p) => p.method === "CHEQUE");
    else if (ledgerQuickFilter === "REFUNDED")
      list = list.filter((p) => p.status === "REFUNDED" || p.status === "REFUND_PENDING" || p.status === "PARTIALLY_REFUNDED");
    return list.slice(0, 15);
  }, [filteredPayments, ledgerQuickFilter]);

  // Payment Mix Distribution
  const paymentMix = useMemo(() => {
    const totals: Record<PaymentMethod, number> = {
      CASH: 0,
      CARD: 0,
      UPI: 0,
      NET_BANKING: 0,
      CHEQUE: 0,
      OTHER: 0,
    };
    payments.forEach((payment) => {
      if (totals[payment.method] !== undefined) {
        totals[payment.method] += payment.amount;
      }
    });
    const overallSum = payments.reduce((sum, item) => sum + item.amount, 0) || 1;
    return Object.entries(totals).map(([method, amount]) => ({
      method: method as PaymentMethod,
      amount,
      share: (amount / overallSum) * 100,
    }));
  }, [payments]);

  // Receivables list & aging buckets
  const receivablesOrders = useMemo(() => {
    return orders
      .filter((o) => o.paymentStatus !== "PAID")
      .map((o) => {
        const grandTotal = Number(o.grandTotal || o.invoice?.grandTotal || 0);
        const paidAmount = Number(o.paidAmount || o.invoice?.paidAmount || 0);
        const dueAmount = Math.max(0, grandTotal - paidAmount);
        const createdDate = new Date(o.createdAt || Date.now());
        const daysDiff = Math.max(
          0,
          Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        );

        let bucket: "CURRENT" | "8-15" | "16-30" | "30+" = "CURRENT";
        if (daysDiff > 30) bucket = "30+";
        else if (daysDiff >= 16) bucket = "16-30";
        else if (daysDiff >= 8) bucket = "8-15";

        return {
          ...o,
          computedDue: dueAmount,
          computedTotal: grandTotal,
          daysDiff,
          agingBucket: bucket,
        };
      })
      .filter((o) => {
        if (agingFilter === "ALL") return true;
        return o.agingBucket === agingFilter;
      });
  }, [orders, agingFilter]);

  // Export to CSV with Formula Injection Protection (CWE-1236)
  const handleExportCSV = () => {
    const sanitizeCsvCell = (val: any): string => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      if (/^[=+\-@\t\r%]/.test(str)) {
        str = "'" + str;
      }
      return `"${str}"`;
    };

    const headers = [
      "Receipt Number",
      "Transaction ID",
      "Patient Name",
      "UHID",
      "Phone",
      "Order Number",
      "Invoice Number",
      "Amount (INR)",
      "Payment Method",
      "Status",
      "Paid At",
      "Collected By",
      "Counter",
    ];

    const rows = filteredPayments.map((p) => [
      sanitizeCsvCell(p.receiptNumber),
      sanitizeCsvCell(p.transactionId),
      sanitizeCsvCell(p.patientName),
      sanitizeCsvCell(p.patientUhid || ""),
      sanitizeCsvCell(p.phone || ""),
      sanitizeCsvCell(p.orderNumber || ""),
      sanitizeCsvCell(p.invoiceNumber || ""),
      sanitizeCsvCell(p.amount),
      sanitizeCsvCell(p.method),
      sanitizeCsvCell(p.status),
      sanitizeCsvCell(formatDateTime(p.paidAt)),
      sanitizeCsvCell(p.collectedBy || ""),
      sanitizeCsvCell(p.counter || ""),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LabCore_Payments_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Transactions exported to CSV securely!", "success");
  };

  return (
    <DashboardLayout title="Payments">
      <div className="space-y-6 pb-12">
        {/* Toast / Notification Banner */}
        {notification && (
          <div
            className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm shadow-md transition-all ${
              notification.type === "success"
                ? "border border-emerald-300 bg-emerald-50 text-emerald-900"
                : notification.type === "error"
                ? "border border-rose-300 bg-rose-50 text-rose-900"
                : "border border-sky-300 bg-sky-50 text-sky-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notification.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : notification.type === "error" ? (
                <AlertCircle className="h-5 w-5 text-rose-600" />
              ) : (
                <HelpCircle className="h-5 w-5 text-sky-600" />
              )}
              <span className="font-semibold">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Header Hero Banner */}
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-[#0a2342] via-[#0f2d52] to-[#1a4a75] p-6 text-white shadow-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-400/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-blue-200 ring-1 ring-blue-300/30">
                  LabCore Revenue & Cashier Suite
                </span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync Active
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                Payment & Billing Operations Control
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-blue-100/90 max-w-2xl">
                Enterprise cashier registers, POS settlements, multi-mode collections, advance wallets, aging receivables, and NABL/GST reconciliation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setInitialCollectOrderId("");
                  setInitialCollectAmount("");
                  setIsCollectModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Collect Payment
              </button>

              <button
                type="button"
                onClick={() => setIsAdvanceModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-95"
              >
                <Wallet className="h-4 w-4" />
                + Advance
              </button>

              <button
                type="button"
                onClick={() => {
                  setInitialRefundPaymentId("");
                  setInitialRefundAmount("");
                  setIsRefundModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-95"
              >
                <RotateCcw className="h-4 w-4" />
                Refund
              </button>

              <button
                type="button"
                onClick={() => setIsShiftHandoverOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-amber-300 bg-amber-400 px-3.5 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-300 active:scale-95"
              >
                <Clock className="h-4 w-4" />
                Close Till
              </button>

              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-white/30 bg-white/20 px-3.5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-white/30 active:scale-95"
              >
                <FileText className="h-4 w-4" />
                Reports
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="rounded-2xl border border-white/20 bg-white/10 p-2.5 text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
                title="Refresh Financial Data"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          {paymentTabs.map((tab) => {
            const getBadge = () => {
              if (tab === "Transactions") return filteredPayments.length;
              if (tab === "Receivables") return receivablesOrders.length;
              if (tab === "Settlements")
                return settlementBatches.filter((b) => b.status === "PENDING").length;
              return null;
            };
            const badge = getBadge();

            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === tab
                    ? "bg-[#0f2d52] text-white shadow-md shadow-blue-950/20 ring-2 ring-[#0f2d52]/20"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>{tab}</span>
                {badge !== null && badge > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      activeTab === tab
                        ? "bg-white/20 text-white"
                        : "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 4 Core Financial KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Today's Collections"
            value={formatCurrency(summary.todayCollection)}
            note="Gross receipts verified today"
            accent="from-blue-600 to-indigo-600"
            meta="Cash + Digital Combined"
            icon="₹"
          />
          <StatCard
            title="Cash Drawer (Till)"
            value={formatCurrency(summary.cashDrawer)}
            note={`Active: ${activeCounter}`}
            accent="from-emerald-600 to-teal-600"
            meta="Expected cash in register"
            icon="💵"
          />
          <StatCard
            title="Outstanding Receivables"
            value={formatCurrency(summary.outstandingReceivables)}
            note={`${orders.filter((o) => o.paymentStatus !== "PAID").length} pending test orders`}
            accent="from-amber-500 to-orange-600"
            meta="Aging: 0 to 30+ days"
            icon="⏳"
          />
          <StatCard
            title="Pending Settlements"
            value={formatCurrency(summary.pendingSettlements)}
            note={`${settlementBatches.filter((b) => b.status === "PENDING").length} terminal batches`}
            accent="from-violet-600 to-purple-600"
            meta="PineLabs / Razorpay / UPI"
            icon="🏦"
          />
        </div>

        {/* TAB 1: OVERVIEW TAB CONTENT */}
        {activeTab === "Overview" && (
          <div className="grid gap-6 xl:grid-cols-[1.75fr_0.95fr]">
            {/* Left: Advanced Recent Payment Ledger (Styled like Result Operations & Clinical Review Desk) */}
            <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl shadow-slate-950/80">
              {/* Operations Command Bar Header */}
              <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-5 text-white">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-sm">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold tracking-tight text-white">
                            Recent Payment Ledger
                          </h2>
                          <span className="rounded-full border border-cyan-500/30 bg-cyan-950/60 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300">
                            {filteredPayments.length} Active Stream
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Real-time counter collections, POS authorization, receipts, and clinical billing reconciliation
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Search */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      Live Cashier Stream Active
                    </span>

                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search patient, receipt, UHID..."
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-1.5 pl-9 pr-7 text-xs text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 sm:w-52"
                      />
                      {search && (
                        <button
                          onClick={() => setSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition shadow-sm"
                      title="Export CSV"
                    >
                      <Download className="h-3.5 w-3.5 text-cyan-400" />
                      CSV
                    </button>

                    <button
                      onClick={() => {
                        setInitialCollectOrderId("");
                        setInitialCollectAmount("");
                        setIsCollectModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-cyan-500/30 hover:from-cyan-400 hover:to-blue-500 active:scale-95 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Collect
                    </button>
                  </div>
                </div>

                {/* View Switchers & High-Yield Metric Counters */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                      Tender View:
                    </span>
                    {[
                      { id: "ALL", label: `All (${filteredPayments.length})` },
                      {
                        id: "CASH",
                        label: `💵 Cash (${filteredPayments.filter((p) => p.method === "CASH").length})`,
                      },
                      {
                        id: "UPI",
                        label: `📱 UPI / QR (${filteredPayments.filter((p) => p.method === "UPI").length})`,
                      },
                      {
                        id: "CARD",
                        label: `💳 Card POS (${filteredPayments.filter((p) => p.method === "CARD").length})`,
                      },
                      {
                        id: "NET_BANKING",
                        label: `🏦 Net Banking (${filteredPayments.filter((p) => p.method === "NET_BANKING").length})`,
                      },
                      {
                        id: "CHEQUE",
                        label: `🧾 Cheque (${filteredPayments.filter((p) => p.method === "CHEQUE").length})`,
                      },
                      {
                        id: "REFUNDED",
                        label: `↩ Refunded (${
                          filteredPayments.filter(
                            (p) =>
                              p.status === "REFUNDED" ||
                              p.status === "REFUND_PENDING" ||
                              p.status === "PARTIALLY_REFUNDED"
                          ).length
                        })`,
                      },
                    ].map((chip) => (
                      <button
                        key={chip.id}
                        onClick={() => setLedgerQuickFilter(chip.id as any)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                          ledgerQuickFilter === chip.id
                            ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30"
                            : "border border-slate-800 bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-1 font-semibold text-emerald-300">
                      Cash: {formatCurrency(filteredPayments.filter((p) => p.method === "CASH").reduce((sum, p) => sum + p.amount, 0))}
                    </span>
                    <span className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-3 py-1 font-semibold text-cyan-300">
                      Digital: {formatCurrency(filteredPayments.filter((p) => p.method !== "CASH").reduce((sum, p) => sum + p.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
                  <thead className="border-b border-slate-800 bg-slate-900/90 text-slate-300 backdrop-blur-md">
                    <tr>
                      {/* 1. TRANSACTION */}
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 border-r border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <Barcode className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Transaction</span>
                        </div>
                        <span className="block text-[9px] font-normal normal-case text-slate-400">
                          Txn ID + Receipt + Counter
                        </span>
                      </th>

                      {/* 2. PATIENT */}
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 border-r border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Patient Info</span>
                        </div>
                        <span className="block text-[9px] font-normal normal-case text-slate-400">
                          Identity + UHID + Phone
                        </span>
                      </th>

                      {/* 3. ORDER / INVOICE */}
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 border-r border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Order / Invoice</span>
                        </div>
                        <span className="block text-[9px] font-normal normal-case text-slate-400">
                          Order # + Invoice # + Tests
                        </span>
                      </th>

                      {/* 4. AMOUNT */}
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 border-r border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                          <span>Amount</span>
                        </div>
                        <span className="block text-[9px] font-normal normal-case text-slate-400">
                          Gross + GST Breakup
                        </span>
                      </th>

                      {/* 5. METHOD */}
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 border-r border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Payment Method</span>
                        </div>
                        <span className="block text-[9px] font-normal normal-case text-slate-400">
                          Tender Channel + Gateway
                        </span>
                      </th>

                      {/* 6. STATUS */}
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 border-r border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Status</span>
                        </div>
                        <span className="block text-[9px] font-normal normal-case text-slate-400">
                          Settlement Lifecycle
                        </span>
                      </th>

                      {/* 7. DATE & TIME */}
                      <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 border-r border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>Date & Time</span>
                        </div>
                        <span className="block text-[9px] font-normal normal-case text-slate-400">
                          Timestamp + Cashier
                        </span>
                      </th>

                      {/* 8. ACTIONS */}
                      <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        <div className="flex items-center justify-end gap-1.5">
                          <PenLine className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Actions</span>
                        </div>
                        <span className="block text-[9px] font-normal normal-case text-slate-400">
                          Receipt & Controls
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {displayedLedgerPayments.length > 0 ? (
                      displayedLedgerPayments.map((payment) => {
                        const isExpanded = expandedLedgerRowId === payment.id;
                        const linkedOrder = orders.find(
                          (o) => o.id === payment.orderId || o.orderNumber === payment.orderNumber
                        );
                        const testsList = linkedOrder?.items || [];
                        const doctorName = linkedOrder?.doctor?.fullName || linkedOrder?.doctorName || "OPD Consultant";

                        return (
                          <React.Fragment key={payment.id}>
                            <tr
                              className={`group cursor-pointer transition-colors duration-150 ${
                                payment.status === "REFUNDED" || payment.status === "REFUND_PENDING"
                                  ? "bg-red-950/20 hover:bg-red-950/30 border-l-4 border-l-rose-500"
                                  : payment.status === "PAID"
                                  ? isExpanded
                                    ? "bg-slate-900/90 border-l-4 border-l-cyan-500"
                                    : "bg-slate-950 hover:bg-slate-900/60 border-l-4 border-l-emerald-500"
                                  : "bg-slate-950 hover:bg-slate-900/50 border-l-4 border-l-amber-500/70"
                              }`}
                              onClick={() => setExpandedLedgerRowId(isExpanded ? null : payment.id)}
                            >
                              {/* 1. TRANSACTION */}
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm shrink-0 border ${
                                      payment.method === "CASH"
                                        ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-400"
                                        : payment.method === "UPI"
                                        ? "bg-violet-950/50 border-violet-500/30 text-violet-400"
                                        : payment.method === "CARD"
                                        ? "bg-sky-950/50 border-sky-500/30 text-sky-400"
                                        : "bg-amber-950/50 border-amber-500/30 text-amber-400"
                                    }`}
                                  >
                                    {getMethodIcon(payment.method)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-white text-xs tracking-tight">
                                        {payment.transactionId}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCopy(payment.transactionId, "Txn ID");
                                        }}
                                        className="text-slate-500 hover:text-cyan-400 transition"
                                        title="Copy Transaction ID"
                                      >
                                        {copiedText === payment.transactionId ? (
                                          <Check className="h-3 w-3 text-emerald-400" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </button>
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                      {payment.receiptNumber}
                                    </div>
                                    <div className="text-[10px] font-semibold text-slate-500">
                                      {payment.counter || "Counter 01"}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* 2. PATIENT */}
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm ring-1 ring-cyan-500/30">
                                    {payment.patientName
                                      ? payment.patientName
                                          .split(" ")
                                          .map((n) => n[0])
                                          .slice(0, 2)
                                          .join("")
                                          .toUpperCase()
                                      : "PT"}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-100 group-hover:text-cyan-400 transition text-xs">
                                      {payment.patientName}
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                                      <span>{payment.patientUhid || "UHID-—"}</span>
                                      {payment.phone && payment.phone !== "No phone" && (
                                        <>
                                          <span className="text-slate-600">•</span>
                                          <span className="text-slate-400" title="Masked for DPDP Act 2023 compliance">
                                            {maskPhoneNumber(payment.phone)}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    {doctorName && (
                                      <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                                        Ref: {doctorName}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* 3. ORDER / INVOICE */}
                              <td className="px-4 py-3.5">
                                <div>
                                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 border border-slate-800 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-200">
                                    {payment.orderNumber || "ORD-—"}
                                  </span>
                                  <div className="mt-0.5 text-[11px] font-mono text-slate-400">
                                    {payment.invoiceNumber || "INV-Pending"}
                                  </div>
                                  {testsList.length > 0 && (
                                    <div className="mt-0.5 text-[10px] text-cyan-400 font-semibold truncate max-w-[160px]">
                                      {testsList.length} test{testsList.length > 1 ? "s" : ""}:{" "}
                                      {testsList.map((t: any) => t.test?.testName || t.testName || "Test").slice(0, 2).join(", ")}
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* 4. AMOUNT */}
                              <td className="px-4 py-3.5">
                                <div>
                                  <div className="text-sm font-mono font-extrabold text-white">
                                    {formatCurrency(payment.amount)}
                                  </div>
                                  <div className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                    <span>Settled Full</span>
                                  </div>
                                  <div className="text-[9px] text-slate-500">
                                    Inc. 18% GST (₹{Math.round(payment.amount * 0.1525)})
                                  </div>
                                </div>
                              </td>

                              {/* 5. METHOD */}
                              <td className="px-4 py-3.5">
                                <div>
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                                      payment.method === "CASH"
                                        ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                                        : payment.method === "CARD"
                                        ? "bg-sky-950/60 border-sky-500/40 text-sky-300"
                                        : payment.method === "UPI"
                                        ? "bg-violet-950/60 border-violet-500/40 text-violet-300"
                                        : "bg-amber-950/60 border-amber-500/40 text-amber-300"
                                    }`}
                                  >
                                    <span>{getMethodIcon(payment.method)}</span>
                                    <span>{payment.method.replace("_", " ")}</span>
                                  </span>
                                  <div className="mt-0.5 text-[10px] font-mono text-slate-400 pl-1">
                                    {payment.method === "UPI"
                                      ? "Dynamic QR • ICICI"
                                      : payment.method === "CARD"
                                      ? "PineLabs POS Swipe"
                                      : "Front Desk Cash"}
                                  </div>
                                </div>
                              </td>

                              {/* 6. STATUS */}
                              <td className="px-4 py-3.5">
                                <div>
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                                      payment.status === "PAID"
                                        ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                                        : payment.status === "REFUNDED"
                                        ? "bg-rose-950/60 border-rose-500/40 text-rose-300"
                                        : "bg-amber-950/60 border-amber-500/40 text-amber-300"
                                    }`}
                                  >
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${
                                        payment.status === "PAID"
                                          ? "bg-emerald-400"
                                          : payment.status === "REFUNDED"
                                          ? "bg-rose-400"
                                          : "bg-amber-400"
                                      }`}
                                    />
                                    {getStatusLabel(payment.status)}
                                  </span>
                                  <div className="mt-0.5 text-[10px] text-slate-500 pl-0.5">
                                    {payment.settlement || "Bank Settled"}
                                  </div>
                                </div>
                              </td>

                              {/* 7. DATE & TIME */}
                              <td className="px-4 py-3.5">
                                <div>
                                  <div className="font-bold text-slate-200 text-xs">
                                    {new Date(payment.paidAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {formatDate(payment.paidAt)}
                                  </div>
                                  <div className="text-[10px] font-semibold text-slate-500">
                                    👤 {payment.collectedBy ? payment.collectedBy.split(" ")[0] : "Cashier"}
                                  </div>
                                </div>
                              </td>

                              {/* 8. ACTIONS */}
                              <td className="px-4 py-3.5 text-right">
                                <div
                                  className="flex items-center justify-end gap-1.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReceipt(payment)}
                                    className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-2.5 py-1 text-xs font-bold text-white shadow-md shadow-cyan-600/30 hover:from-cyan-500 hover:to-blue-500 transition"
                                    title="Print / View Receipt"
                                    aria-label="Print or View Receipt"
                                  >
                                    <Printer className="h-3.5 w-3.5" />
                                    Receipt
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setWhatsAppModalData({
                                        type: "RECEIPT",
                                        patientName: payment.patientName,
                                        phone: payment.phone,
                                        uhid: payment.patientUhid,
                                        orderNumber: payment.orderNumber,
                                        receiptNumber: payment.receiptNumber,
                                        amount: payment.amount,
                                        method: payment.method,
                                        date: formatDate(payment.paidAt),
                                      })
                                    }
                                    className="rounded-xl border border-slate-800 bg-slate-900/80 p-1.5 text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-950/40 transition shadow-sm"
                                    title="Send Receipt via WhatsApp"
                                    aria-label="Send Receipt via WhatsApp"
                                  >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedDetailPaymentId(payment.id)}
                                    className="rounded-xl border border-slate-800 bg-slate-900/80 p-1.5 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-cyan-300 transition shadow-sm"
                                    title="Inspect Full Payment Detail"
                                    aria-label="Inspect Full Payment Detail"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInitialRefundPaymentId(payment.id);
                                      setInitialRefundAmount(String(payment.amount));
                                      setIsRefundModalOpen(true);
                                    }}
                                    className="rounded-xl border border-slate-800 bg-slate-900/80 p-1.5 text-slate-400 hover:border-rose-500/40 hover:bg-rose-950/40 hover:text-rose-400 transition shadow-sm"
                                    title="Issue Refund / Credit Note"
                                    aria-label="Issue Refund or Credit Note"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setExpandedLedgerRowId(isExpanded ? null : payment.id)}
                                    className={`rounded-xl border p-1.5 transition ${
                                      isExpanded
                                        ? "border-cyan-500/50 bg-cyan-950/50 text-cyan-300"
                                        : "border-slate-800 bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                    }`}
                                    title={isExpanded ? "Collapse details" : "Expand itemized tests"}
                                    aria-label={isExpanded ? "Collapse test items" : "Expand itemized test breakdown"}
                                    aria-expanded={isExpanded}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    ) : (
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* INLINE EXPANDABLE SUB-DRAWER */}
                            {isExpanded && (
                              <tr className="bg-slate-900/80">
                                <td colSpan={8} className="p-4 border-b border-slate-800">
                                  <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                                      <div className="flex items-center gap-2">
                                        <span className="rounded-md border border-cyan-500/30 bg-cyan-950/50 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                                          CLINICAL & FINANCIAL SPECIFICATION
                                        </span>
                                        <span className="text-xs font-bold text-white">
                                          {payment.receiptNumber} • Order: {payment.orderNumber || "—"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="text-slate-400">Collected By:</span>
                                        <strong className="text-slate-200 font-semibold">{payment.collectedBy || "Cashier"}</strong>
                                        <span className="text-slate-600">•</span>
                                        <span className="text-slate-400">Terminal:</span>
                                        <strong className="text-slate-200 font-semibold">{payment.counter || "Counter 01"}</strong>
                                      </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                      {/* Ordered Tests List */}
                                      <div className="md:col-span-2 rounded-xl bg-slate-900/90 p-3 border border-slate-800">
                                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                                          <span>Included Diagnostic Investigations</span>
                                          <span className="font-mono text-cyan-400">{testsList.length || 1} Item(s)</span>
                                        </div>
                                        {testsList.length > 0 ? (
                                          <div className="space-y-1.5 text-xs">
                                            {testsList.map((item: any, idx: number) => (
                                              <div
                                                key={idx}
                                                className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <span className="h-5 w-5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-bold text-[10px] flex items-center justify-center">
                                                    {idx + 1}
                                                  </span>
                                                  <div>
                                                    <span className="font-bold text-slate-200">
                                                      {item.test?.testName || item.testName || "Diagnostic Investigation"}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 ml-1.5 font-mono">
                                                      ({item.test?.testCode || "TEST"})
                                                    </span>
                                                  </div>
                                                </div>
                                                <span className="font-mono font-bold text-white">
                                                  {formatCurrency(Number(item.price || item.finalPrice || payment.amount))}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                                            <span className="font-semibold text-slate-300">
                                              Laboratory Diagnostic Pathology Test Panel
                                            </span>
                                            <span className="font-mono font-bold text-white">
                                              {formatCurrency(payment.amount)}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Tax & Reconciliation Card */}
                                      <div className="rounded-xl bg-slate-900/90 p-3.5 border border-slate-800 text-xs space-y-2 flex flex-col justify-between">
                                        <div>
                                          <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 mb-2">
                                            Tax & Accounting Breakdown
                                          </div>
                                          <div className="space-y-1.5 text-[11px]">
                                            <div className="flex justify-between text-slate-400">
                                              <span>Taxable Turnover:</span>
                                              <span className="font-mono font-bold text-slate-200">
                                                {formatCurrency(Math.round((payment.amount / 1.18) * 100) / 100)}
                                              </span>
                                            </div>
                                            <div className="flex justify-between text-slate-400">
                                              <span>CGST (9%):</span>
                                              <span className="font-mono text-slate-300">
                                                {formatCurrency(Math.round(((payment.amount - payment.amount / 1.18) / 2) * 100) / 100)}
                                              </span>
                                            </div>
                                            <div className="flex justify-between text-slate-400">
                                              <span>SGST (9%):</span>
                                              <span className="font-mono text-slate-300">
                                                {formatCurrency(Math.round(((payment.amount - payment.amount / 1.18) / 2) * 100) / 100)}
                                              </span>
                                            </div>
                                            <div className="flex justify-between font-bold text-white border-t border-slate-800 pt-1 text-xs">
                                              <span>Total Paid:</span>
                                              <span className="font-mono text-cyan-400 font-extrabold">
                                                {formatCurrency(payment.amount)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="pt-2 border-t border-slate-800 flex gap-2">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenReceipt(payment)}
                                            className="flex-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 py-1.5 text-center text-[11px] font-bold text-white shadow-md shadow-cyan-600/30 hover:from-cyan-500 hover:to-blue-500 transition"
                                          >
                                            Print 80mm Slip
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setSelectedDetailPaymentId(payment.id)}
                                            className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-[11px] font-bold text-slate-300 hover:bg-slate-800 transition"
                                          >
                                            Full Audit
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                          No transactions found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-5 py-3 text-xs text-slate-400">
                <span>
                  Showing latest {Math.min(displayedLedgerPayments.length, 10)} of {filteredPayments.length} transactions
                </span>
                <button
                  onClick={() => setActiveTab("Transactions")}
                  className="font-bold text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1"
                >
                  View Full Transactions Ledger ({payments.length}) →
                </button>
              </div>
            </div>

            {/* Right: Payment Method Mix & Cash Drawer Snapshot (Harmonized Dark Slate Design) */}
            <div className="space-y-5">
              {/* Payment Mix Widget */}
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-2xl shadow-slate-950/80">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">Payment Tender Mix</h3>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-950/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                    Live Breakdown
                  </span>
                </div>
                <div className="space-y-3.5">
                  {paymentMix.map(({ method, amount, share }) => (
                    <div key={method}>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
                          <span>{getMethodIcon(method)}</span>
                          {method.replace("_", " ")}
                        </span>
                        <span className="font-mono font-bold text-white">{formatCurrency(amount)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-900 border border-slate-800/80 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all shadow-sm"
                          style={{ width: `${Math.max(share, 6)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cash Counter Till Status */}
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-2xl shadow-slate-950/80">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">Till Register Snapshot</h3>
                    <p className="text-[11px] text-slate-400">{activeCounter}</p>
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-slate-900 border border-slate-800/80 p-2.5 text-slate-300">
                    <span>Shift Opening Float</span>
                    <strong className="font-mono text-white">{formatCurrency(26250)}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-emerald-950/40 border border-emerald-500/20 p-2.5 text-emerald-300">
                    <span>Cash Collections (Today)</span>
                    <strong className="font-mono text-emerald-400">+{formatCurrency(summary.cashInHand || 17800)}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-rose-950/40 border border-rose-500/20 p-2.5 text-rose-300">
                    <span>Cash Refunds / Payouts</span>
                    <strong className="font-mono text-rose-400">-{formatCurrency(3200)}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-cyan-500/30 bg-cyan-950/40 p-3 text-cyan-200">
                    <span className="font-bold">Expected in Drawer:</span>
                    <strong className="font-mono text-base font-extrabold text-cyan-300">
                      {formatCurrency(summary.cashDrawer || 40850)}
                    </strong>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPettyModalOpen(true)}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-900 py-2 text-center text-xs font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  >
                    + Petty Movement
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsShiftHandoverOpen(true)}
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-2 text-center text-xs font-bold text-white shadow-md shadow-amber-600/30 transition hover:from-amber-500 hover:to-orange-500"
                  >
                    Close Till & Handover
                  </button>
                </div>
              </div>

              {/* Operational Audit Highlights */}
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-2xl shadow-slate-950/80">
                <h3 className="text-base font-bold text-white">Compliance & Alerts</h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-emerald-400">✔</span>
                    <span>PineLabs Card POS terminal settlement completed for previous shift.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-amber-400">⚠️</span>
                    <span>1 pending refund authorization awaiting Accounts review.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-cyan-400">ℹ</span>
                    <span>UPI QR instant reconciliation active on Counter 01 and Counter 02.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRANSACTIONS TAB */}
        {activeTab === "Transactions" && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search receipt #, transaction ID, patient name, UHID, phone..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="PAID">PAID</option>
                    <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>

                  <select
                    value={methodFilter}
                    onChange={(e) => {
                      setMethodFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                  >
                    <option value="All">All Methods</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card (POS)</option>
                    <option value="UPI">UPI / Dynamic QR</option>
                    <option value="NET_BANKING">Net Banking</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>

                  <select
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                  >
                    <option value="All">All Time</option>
                    <option value="Today">Today</option>
                    <option value="Yesterday">Yesterday</option>
                    <option value="7 Days">Last 7 Days</option>
                    <option value="30 Days">Last 30 Days</option>
                  </select>

                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-left text-sm">
                  <thead className="bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5 font-bold">Transaction & Receipt</th>
                      <th
                        className="px-5 py-3.5 font-bold cursor-pointer hover:text-slate-900"
                        onClick={() => {
                          setSortField("patientName");
                          setSortAsc(!sortAsc);
                        }}
                      >
                        <span className="flex items-center gap-1">
                          Patient
                          <ArrowUpDown className="h-3 w-3" />
                        </span>
                      </th>
                      <th className="px-5 py-3.5 font-bold">Order / Invoice</th>
                      <th
                        className="px-5 py-3.5 font-bold cursor-pointer hover:text-slate-900"
                        onClick={() => {
                          setSortField("amount");
                          setSortAsc(!sortAsc);
                        }}
                      >
                        <span className="flex items-center gap-1">
                          Amount
                          <ArrowUpDown className="h-3 w-3" />
                        </span>
                      </th>
                      <th className="px-5 py-3.5 font-bold">Method</th>
                      <th className="px-5 py-3.5 font-bold">Status</th>
                      <th
                        className="px-5 py-3.5 font-bold cursor-pointer hover:text-slate-900"
                        onClick={() => {
                          setSortField("paidAt");
                          setSortAsc(!sortAsc);
                        }}
                      >
                        <span className="flex items-center gap-1">
                          Paid At
                          <ArrowUpDown className="h-3 w-3" />
                        </span>
                      </th>
                      <th className="px-5 py-3.5 font-bold">Cashier / Till</th>
                      <th className="px-5 py-3.5 font-bold">Settlement</th>
                      <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedPayments.length > 0 ? (
                      paginatedPayments.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-blue-50/30 transition cursor-pointer"
                          onClick={() => handleOpenReceipt(p)}
                        >
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-slate-900">{p.transactionId}</div>
                            <div className="text-xs text-slate-500 font-mono">{p.receiptNumber}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-slate-900">{p.patientName}</div>
                            <div className="mt-0.5 text-xs text-slate-500">
                              <span className="font-mono">{p.patientUhid || "—"}</span>
                              {p.phone && p.phone !== "No phone" && (
                                <span className="ml-1.5">• {p.phone}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-medium text-slate-800">{p.orderNumber || "—"}</div>
                            <div className="text-xs text-slate-500 font-mono">{p.invoiceNumber || "—"}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-base font-mono font-bold text-slate-900">
                              {formatCurrency(p.amount)}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getMethodBadge(
                                p.method
                              )}`}
                            >
                              <span>{getMethodIcon(p.method)}</span>
                              {p.method.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(
                                p.status
                              )}`}
                            >
                              {getStatusLabel(p.status)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-600 font-mono">
                            {formatDateTime(p.paidAt)}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-xs font-medium text-slate-800">{p.collectedBy}</div>
                            <div className="text-[11px] text-slate-400">{p.counter || "Counter 01"}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                              {p.settlement || "SETTLED"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => handleOpenReceipt(p)}
                                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition"
                              >
                                <Printer className="h-3.5 w-3.5 text-slate-500" />
                                Receipt
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setWhatsAppModalData({
                                    type: "RECEIPT",
                                    patientName: p.patientName,
                                    phone: p.phone,
                                    uhid: p.patientUhid,
                                    orderNumber: p.orderNumber,
                                    receiptNumber: p.receiptNumber,
                                    amount: p.amount,
                                    method: p.method,
                                    date: formatDate(p.paidAt),
                                  })
                                }
                                className="rounded-xl border border-slate-200 bg-white p-1 text-emerald-600 hover:bg-emerald-50 transition"
                                title="Send via WhatsApp"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedDetailPaymentId(p.id)}
                                className="rounded-xl border border-slate-200 bg-white p-1 text-slate-500 hover:bg-slate-100 transition"
                                title="View Details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setInitialRefundPaymentId(p.id);
                                  setInitialRefundAmount(String(p.amount));
                                  setIsRefundModalOpen(true);
                                }}
                                className="rounded-xl border border-slate-200 bg-white p-1 text-slate-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition"
                                title="Refund transaction"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="px-5 py-16 text-center text-slate-500">
                          No transactions found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-600 gap-3">
                <div className="flex items-center gap-2">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-800 outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>records per page • Total {filteredPayments.length} entries</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="font-semibold text-slate-800">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RECEIVABLES TAB */}
        {activeTab === "Receivables" && (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Outstanding Receivables & Aging Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Uncollected patient and corporate accounts with automated recovery reminders
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-50 px-4 py-2.5 text-right border border-amber-200">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-700">
                    Total Due Balance
                  </div>
                  <div className="text-xl font-mono font-extrabold text-amber-950">
                    {formatCurrency(summary.outstandingReceivables)}
                  </div>
                </div>
              </div>
            </div>

            {/* Aging Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "ALL", label: "All Overdue" },
                { id: "CURRENT", label: "0-7 Days (Current)" },
                { id: "8-15", label: "8-15 Days (Follow-up)" },
                { id: "16-30", label: "16-30 Days (Overdue)" },
                { id: "30+", label: "30+ Days (Critical)" },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setAgingFilter(b.id as any)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    agingFilter === b.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5 font-bold">Order / Invoice</th>
                      <th className="px-5 py-3.5 font-bold">Patient</th>
                      <th className="px-5 py-3.5 font-bold">Bill Total</th>
                      <th className="px-5 py-3.5 font-bold">Paid</th>
                      <th className="px-5 py-3.5 font-bold">Due Balance</th>
                      <th className="px-5 py-3.5 font-bold">Aging Status</th>
                      <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receivablesOrders.length > 0 ? (
                      receivablesOrders.map((o) => {
                        const pName = o.patient
                          ? `${o.patient.firstName || ""} ${o.patient.lastName || ""}`.trim()
                          : "Patient";

                        return (
                          <tr key={o.id} className="hover:bg-slate-50 transition">
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-900">{o.orderNumber}</div>
                              <div className="text-xs text-slate-500 font-mono">
                                {o.invoice?.invoiceNumber || "INV-Pending"}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-900">{pName}</div>
                              <div className="text-xs text-slate-500">
                                <span className="font-mono">{o.patient?.uhid || "—"}</span>
                                {o.patient?.phone && (
                                  <span className="ml-1.5 font-mono" title="Masked for DPDP Act 2023 compliance">
                                    • {maskPhoneNumber(o.patient.phone)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 font-mono font-medium text-slate-800">
                              {formatCurrency(o.computedTotal)}
                            </td>
                            <td className="px-5 py-4 font-mono text-emerald-600 font-medium">
                              {formatCurrency(Number(o.paidAmount || 0))}
                            </td>
                            <td className="px-5 py-4 font-mono font-extrabold text-rose-600">
                              {formatCurrency(o.computedDue)}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                  o.agingBucket === "CURRENT"
                                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                                    : o.agingBucket === "8-15"
                                    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                    : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                                }`}
                              >
                                {o.agingBucket === "CURRENT"
                                  ? `${o.daysDiff}d (Current)`
                                  : o.agingBucket === "8-15"
                                  ? `${o.daysDiff}d (Follow-up)`
                                  : `${o.daysDiff}d (Overdue)`}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setWhatsAppModalData({
                                      type: "DUE_REMINDER",
                                      patientName: pName,
                                      phone: o.patient?.phone,
                                      uhid: o.patient?.uhid,
                                      orderNumber: o.orderNumber,
                                      amount: o.computedTotal,
                                      dueBalance: o.computedDue,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition"
                                  title="Send WhatsApp Payment Link"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  Remind
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInitialCollectOrderId(o.id);
                                    setInitialCollectAmount(String(o.computedDue));
                                    setIsCollectModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Collect
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                          No outstanding receivables in this aging category.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ADVANCES & WALLET TAB */}
        {activeTab === "Advances & Wallet" && (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Patient Advance Balances & Prepaid Wallets
                </h3>
                <p className="text-xs text-slate-500">
                  Manage patient credit balances, top-ups, diagnostic offsets, and wallet refunds
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInitialAdvancePatientId("");
                  setIsAdvanceModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition"
              >
                <Plus className="h-4 w-4" />
                + Add Patient Advance
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Active Advance Deposits
                </p>
                <p className="mt-1 text-2xl font-mono font-extrabold text-slate-900">
                  {formatCurrency(48500)}
                </p>
                <p className="mt-1 text-xs text-emerald-600 font-medium">Available across 14 patients</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Utilized in Orders This Month
                </p>
                <p className="mt-1 text-2xl font-mono font-extrabold text-slate-900">
                  {formatCurrency(32400)}
                </p>
                <p className="mt-1 text-xs text-blue-600 font-medium">Automated test billing offsets</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Advance Balance Refunds
                </p>
                <p className="mt-1 text-2xl font-mono font-extrabold text-slate-900">
                  {formatCurrency(4500)}
                </p>
                <p className="mt-1 text-xs text-slate-500 font-medium">Returned upon test completion</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="p-4 border-b border-slate-100 font-bold text-slate-800 text-sm">
                Active Patient Wallet Balances
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">Patient</th>
                    <th className="px-5 py-3.5 font-bold">UHID</th>
                    <th className="px-5 py-3.5 font-bold">Available Wallet Balance</th>
                    <th className="px-5 py-3.5 font-bold">Last Activity</th>
                    <th className="px-5 py-3.5 font-bold">Deposit Purpose</th>
                    <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    {
                      name: "Panchal Ashokkumar",
                      uhid: "UHID-24811",
                      balance: 5000,
                      date: "26 Sept 2026",
                      purpose: "Annual Health Checkup Advance",
                    },
                    {
                      name: "Rina Patel",
                      uhid: "UHID-24813",
                      balance: 2400,
                      date: "25 Sept 2026",
                      purpose: "Biopsy Histopathology Deposit",
                    },
                    {
                      name: "Suresh Mehta",
                      uhid: "UHID-24820",
                      balance: 10500,
                      date: "24 Sept 2026",
                      purpose: "Corporate Wellness Package Deposit",
                    },
                    {
                      name: "Meena Chawla",
                      uhid: "UHID-24824",
                      balance: 1800,
                      date: "23 Sept 2026",
                      purpose: "Thyroid & Lipid Profile Pre-payment",
                    },
                  ].map((w, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4 font-semibold text-slate-900">{w.name}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{w.uhid}</td>
                      <td className="px-5 py-4 font-mono font-extrabold text-emerald-600 text-base">
                        {formatCurrency(w.balance)}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">{w.date}</td>
                      <td className="px-5 py-4 text-xs text-slate-600">{w.purpose}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setInitialAdvancePatientId(w.uhid);
                            setIsAdvanceModalOpen(true);
                          }}
                          className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 transition"
                        >
                          + Top Up
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: REFUNDS TAB */}
        {activeTab === "Refunds" && (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Refund Processing & GST Credit Note Queue
                </h3>
                <p className="text-xs text-slate-500">
                  Clinical cancellation refunds, sample recollected waivers, and reversal credit notes
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInitialRefundPaymentId("");
                  setInitialRefundAmount("");
                  setIsRefundModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500 transition"
              >
                <RotateCcw className="h-4 w-4" />
                Issue New Refund
              </button>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">Credit Note #</th>
                    <th className="px-5 py-3.5 font-bold">Original Txn</th>
                    <th className="px-5 py-3.5 font-bold">Patient</th>
                    <th className="px-5 py-3.5 font-bold">Refund Amount</th>
                    <th className="px-5 py-3.5 font-bold">Payout Mode</th>
                    <th className="px-5 py-3.5 font-bold">Clinical Reason</th>
                    <th className="px-5 py-3.5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    {
                      id: "REF-2026-091",
                      txn: "TXN-366",
                      patient: "Anita Verma",
                      amount: 6350,
                      method: "NET_BANKING",
                      reason: "Test cancelled by clinician before sample receipt",
                      status: "PROCESSING",
                    },
                    {
                      id: "REF-2026-088",
                      txn: "TXN-290",
                      patient: "Dhaval Shah",
                      amount: 1200,
                      method: "CASH",
                      reason: "Duplicate swipe error on Counter 02",
                      status: "COMPLETED",
                    },
                    {
                      id: "REF-2026-085",
                      txn: "TXN-244",
                      patient: "Kiran Bala",
                      amount: 2000,
                      method: "UPI",
                      reason: "Severe haemolysis; patient declined recollection",
                      status: "COMPLETED",
                    },
                  ].map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">{r.id}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">{r.txn}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{r.patient}</td>
                      <td className="px-5 py-4 font-mono font-bold text-rose-600">
                        {formatCurrency(r.amount)}
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-700">{r.method}</td>
                      <td className="px-5 py-4 text-xs text-slate-600">{r.reason}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            r.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: CASH COUNTER TAB */}
        {activeTab === "Cash Counter" && (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Cash Register & Multi-Counter Management
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time till reconciliation, opening float verification, and shift handover slips
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={activeCounter}
                  onChange={(e) => setActiveCounter(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="Counter 01 (Main OPD)">Counter 01 (Main OPD)</option>
                  <option value="Counter 02 (Stat / Emergency)">Counter 02 (Stat / Emergency)</option>
                  <option value="Counter 03 (Collection Center)">Counter 03 (Collection Center)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setIsShiftHandoverOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-600/20 hover:bg-amber-500 transition"
                >
                  <Clock className="h-4 w-4" />
                  Shift Handover & Till Close
                </button>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-slate-900 text-sm">Active Till Register Session</h4>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                    OPEN
                  </span>
                </div>
                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Active Cashier:</span>
                    <strong className="text-slate-900">Jaya Ashapurama (EMP-104)</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Shift Opened At:</span>
                    <strong className="text-slate-900">Today, 08:30 AM</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Shift Opening Float:</span>
                    <strong className="font-mono text-slate-900">{formatCurrency(26250)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Gross Cash Collections (+):</span>
                    <strong className="text-emerald-600 font-mono font-bold">
                      +{formatCurrency(summary.cashInHand || 17800)}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Cash Refunds / Payouts (-):</span>
                    <strong className="text-rose-600 font-mono font-bold">-{formatCurrency(3200)}</strong>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-slate-900 text-sm rounded-xl bg-blue-50/70 p-3 border border-blue-200">
                    <span>Expected Physical Till Cash:</span>
                    <span className="text-blue-950 font-mono text-base font-extrabold">
                      {formatCurrency(summary.cashDrawer || 40850)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-slate-900 text-sm">Petty Cash Movements & Disbursals</h4>
                  <button
                    onClick={() => setIsPettyModalOpen(true)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    + Log Movement
                  </button>
                </div>
                <div className="space-y-3 text-xs">
                  {pettyCashMovements.map((mov) => (
                    <div
                      key={mov.id}
                      className={`flex items-center justify-between rounded-2xl p-3 border ${
                        mov.type === "IN"
                          ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                          : "bg-rose-50/60 border-rose-200 text-rose-950"
                      }`}
                    >
                      <div>
                        <div className="font-bold">{mov.reason}</div>
                        <div className="text-[11px] opacity-75">{mov.time}</div>
                      </div>
                      <strong className="font-mono text-sm">
                        {mov.type === "IN" ? `+₹${mov.amount}` : `-₹${mov.amount}`}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SETTLEMENTS TAB */}
        {activeTab === "Settlements" && (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  POS Machine & Payment Gateway Settlements
                </h3>
                <p className="text-xs text-slate-500">
                  Card terminal batch settlement, MDR deductions, and bank deposit verification
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 px-4 py-2 border border-emerald-200 text-right">
                <div className="text-[10px] uppercase font-bold text-emerald-700">Bank Credited</div>
                <div className="text-base font-mono font-bold text-emerald-900">
                  {formatCurrency(55782.5)}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">Settlement ID</th>
                    <th className="px-5 py-3.5 font-bold">Provider / Terminal</th>
                    <th className="px-5 py-3.5 font-bold">Gross Swiped</th>
                    <th className="px-5 py-3.5 font-bold">MDR / Fees (1.5%)</th>
                    <th className="px-5 py-3.5 font-bold">Net Bank Credit</th>
                    <th className="px-5 py-3.5 font-bold">Bank UTR Ref #</th>
                    <th className="px-5 py-3.5 font-bold">Status</th>
                    <th className="px-5 py-3.5 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {settlementBatches.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">{s.id}</td>
                      <td className="px-5 py-4 font-medium text-slate-900">{s.provider}</td>
                      <td className="px-5 py-4 font-mono font-semibold text-slate-800">
                        {formatCurrency(s.gross)}
                      </td>
                      <td className="px-5 py-4 text-rose-600 text-xs font-mono">
                        -{formatCurrency(s.fees)}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-emerald-600">
                        {formatCurrency(s.net)}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{s.utr}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            s.status === "SETTLED"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {s.status !== "SETTLED" ? (
                          <button
                            onClick={() => handleReconcileSettlement(s.id)}
                            className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                          >
                            Mark Settled
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-bold inline-flex items-center gap-1">
                            <Check className="h-3 w-3" /> Reconciled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: RECONCILIATION TAB */}
        {activeTab === "Reconciliation" && (
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Automated Bank Statement & Gateway Reconciliation
                  </h3>
                  <p className="text-xs text-slate-500">
                    AI assisted cross-matching of patient receipts against laboratory bank account credits
                  </p>
                </div>
                <button
                  onClick={() =>
                    showNotification(
                      "Automated reconciliation complete! 148 of 150 transactions matched.",
                      "success"
                    )
                  }
                  className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-500 transition"
                >
                  Run Reconcile Engine
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-emerald-50/70 p-4 border border-emerald-200 text-emerald-950">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Matched Transactions
                  </div>
                  <div className="mt-1 text-2xl font-mono font-bold">148 (98.6%)</div>
                  <div className="text-[11px] text-emerald-700 mt-1">
                    Direct UTR & RRN matches verified
                  </div>
                </div>
                <div className="rounded-2xl bg-amber-50/70 p-4 border border-amber-200 text-amber-950">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    Pending Manual Verification
                  </div>
                  <div className="mt-1 text-2xl font-mono font-bold">2 (1.4%)</div>
                  <div className="text-[11px] text-amber-700 mt-1">Unclaimed NEFT bank deposits</div>
                </div>
                <div className="rounded-2xl bg-blue-50/70 p-4 border border-blue-200 text-blue-950">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    Discrepancy Flags
                  </div>
                  <div className="mt-1 text-2xl font-mono font-bold">0</div>
                  <div className="text-[11px] text-blue-700 mt-1">Zero chargebacks detected</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: REPORTS TAB */}
        {activeTab === "Reports" && (
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Laboratory Financial Closing Reports & Registers
                  </h3>
                  <p className="text-xs text-slate-500">
                    Executive summary sheets for auditing, clinical directors, and chartered accountants
                  </p>
                </div>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="rounded-2xl bg-[#0f2d52] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-900 transition"
                >
                  Open Report Center
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    title: "Daily Cash Book / Day Book",
                    desc: "Chronological till register of receipts & payouts",
                    icon: "📊",
                  },
                  {
                    title: "Mode-wise Revenue Breakdown",
                    desc: "Cash vs UPI vs Card vs Net Banking shares",
                    icon: "💳",
                  },
                  {
                    title: "Cashier Productivity Summary",
                    desc: "Receipt volume and turnover by staff operator",
                    icon: "👤",
                  },
                  {
                    title: "GST Tax Liability Register",
                    desc: "CGST, SGST, IGST calculations for diagnostic billing",
                    icon: "📑",
                  },
                ].map((r, i) => (
                  <div
                    key={i}
                    onClick={() => setIsReportModalOpen(true)}
                    className="rounded-2xl border border-slate-200 p-5 hover:border-blue-400 hover:shadow-md transition bg-slate-50/50 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-3xl mb-3">{r.icon}</div>
                      <h4 className="font-bold text-slate-900 text-sm">{r.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{r.desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-blue-700">
                      <span>Generate Report</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: AUDIT LOG TAB */}
        {activeTab === "Audit Log" && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Financial Audit Trail</h3>
              <p className="text-xs text-slate-500">
                Immutable, tamper-evident log of all collections, cash till movements, refunds, and waivers
              </p>

              <div className="mt-5 divide-y divide-slate-100 text-xs">
                {[
                  {
                    time: "Today, 05:55 PM",
                    user: "Jaya Ashapurama",
                    action: "Payment Collected",
                    details: "₹5,040.00 via CARD for ORD-2026-8636 (REC-2026-1001)",
                  },
                  {
                    time: "Today, 05:34 PM",
                    user: "Riya Patel",
                    action: "Split Payment Collected",
                    details: "₹2,780.00 via UPI + CASH for ORD-2026-8640",
                  },
                  {
                    time: "Today, 02:15 PM",
                    user: "Jaya Ashapurama",
                    action: "Petty Cash Outflow",
                    details: "₹180.00 for Urgent Biopsy Courier Disbursal",
                  },
                  {
                    time: "Today, 12:15 PM",
                    user: "Prakash Mehta",
                    action: "Cash Payment Collected",
                    details: "₹15,400.00 via CASH for ORD-2026-8645 (REC-2026-1003)",
                  },
                  {
                    time: "Today, 08:30 AM",
                    user: "Jaya Ashapurama",
                    action: "Counter Opened",
                    details: "Opening cash float verified at ₹26,250.00 on Counter 01",
                  },
                ].map((a, i) => (
                  <div key={i} className="py-3.5 flex items-start justify-between gap-4">
                    <div>
                      <span className="font-bold text-slate-900">{a.action}</span>
                      <span className="text-slate-600 ml-2">— {a.details}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-slate-800">{a.user}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: COLLECT PAYMENT MODAL */}
        <CollectPaymentModal
          isOpen={isCollectModalOpen}
          onClose={() => setIsCollectModalOpen(false)}
          orders={orders}
          patients={patients}
          initialOrderId={initialCollectOrderId}
          initialAmount={initialCollectAmount}
          onPaymentSuccess={(createdPayment) => {
            fetchPayments();
            fetchMetrics();
            if (createdPayment) {
              handleOpenReceipt(createdPayment);
            }
          }}
          showNotification={showNotification}
        />

        {/* MODAL 2: SHIFT HANDOVER / TILL CLOSE MODAL */}
        <ShiftHandoverModal
          isOpen={isShiftHandoverOpen}
          onClose={() => setIsShiftHandoverOpen(false)}
          expectedCash={summary.cashDrawer || 40850}
          counterName={activeCounter}
          cashierName="Jaya Ashapurama"
          onShiftClosed={(closingData) => {
            showNotification(
              `Counter shift closed! Physical Till: ${formatCurrency(closingData.physicalCash)}`,
              "success"
            );
          }}
          showNotification={showNotification}
        />

        {/* MODAL 3: PATIENT ADVANCE MODAL */}
        <AdvanceDepositModal
          isOpen={isAdvanceModalOpen}
          onClose={() => setIsAdvanceModalOpen(false)}
          patients={patients}
          initialPatientId={initialAdvancePatientId}
          onAdvanceSuccess={() => {
            fetchMetrics();
            fetchPayments();
          }}
          showNotification={showNotification}
        />

        {/* MODAL 4: REFUND REQUEST MODAL */}
        <RefundRequestModal
          isOpen={isRefundModalOpen}
          onClose={() => setIsRefundModalOpen(false)}
          payments={payments}
          initialPaymentId={initialRefundPaymentId}
          initialAmount={initialRefundAmount}
          onRefundSuccess={() => {
            fetchPayments();
            fetchMetrics();
          }}
          showNotification={showNotification}
        />

        {/* MODAL 5: FINANCIAL REPORTS MODAL */}
        <FinancialReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          payments={payments}
          orders={orders}
          summary={summary}
        />

        {/* MODAL 6: WHATSAPP RECEIPT MODAL */}
        {whatsAppModalData && (
          <WhatsAppReceiptModal
            isOpen={Boolean(whatsAppModalData)}
            onClose={() => setWhatsAppModalData(null)}
            data={whatsAppModalData}
            showNotification={showNotification}
          />
        )}

        {/* MODAL 7: PETTY CASH LOG MODAL */}
        {isPettyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 border border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Log Petty Cash Movement</h3>
                <button
                  onClick={() => setIsPettyModalOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddPettyMovement} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Movement Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPettyType("OUT")}
                      className={`rounded-xl py-2 text-xs font-bold transition ${
                        pettyType === "OUT"
                          ? "bg-rose-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      Cash Out (Expense)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPettyType("IN")}
                      className={`rounded-xl py-2 text-xs font-bold transition ${
                        pettyType === "IN"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      Cash In (Top-up)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pettyAmount}
                    onChange={(e) => setPettyAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-base font-mono font-bold text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Description / Voucher Reason *
                  </label>
                  <input
                    type="text"
                    value={pettyReason}
                    onChange={(e) => setPettyReason(e.target.value)}
                    placeholder="e.g. Courier charges, Tea, Dry ice"
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPettyModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    Save Movement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RECEIPT PRINT & PDF PREVIEW MODAL */}
        {selectedReceiptPayment && (
          <PaymentReceipt
            payment={selectedReceiptPayment}
            onClose={() => setSelectedReceiptPayment(null)}
          />
        )}

        {/* PAYMENT DETAIL INSPECTION MODAL */}
        {selectedDetailPaymentId && (
          <PaymentDetailModal
            paymentId={selectedDetailPaymentId}
            onClose={() => setSelectedDetailPaymentId(null)}
            onOpenReceipt={(payment) => {
              setSelectedDetailPaymentId(null);
              handleOpenReceipt(payment);
            }}
            onInitiateRefund={(pId, amt) => {
              setSelectedDetailPaymentId(null);
              setInitialRefundPaymentId(pId);
              setInitialRefundAmount(String(amt));
              setIsRefundModalOpen(true);
            }}
          />
        )}

        {/* NOTIFICATION DISPATCH MODAL */}
        {notifyModalOpen && notifyPayload && (
          <NotificationDispatchModal
            isOpen={notifyModalOpen}
            onClose={() => setNotifyModalOpen(false)}
            payload={notifyPayload}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  title,
  value,
  note,
  accent,
  meta,
  icon,
}: {
  title: string;
  value: string;
  note: string;
  accent: string;
  meta: string;
  icon: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div
        className={`mb-3.5 h-11 w-11 rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center text-lg text-white shadow-md shadow-blue-500/10`}
      >
        {icon}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-1.5 text-2xl font-mono font-extrabold text-slate-900 tracking-tight">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-600">{note}</p>
      <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2 text-[11px] font-semibold text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
        {meta}
      </div>
    </div>
  );
}
