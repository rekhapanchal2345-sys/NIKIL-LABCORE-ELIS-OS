"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { orderApi, doctorApi, paymentsApi } from "@/lib/api";
import {
  StatusBadge,
  PriorityBadge,
  PaymentProgressBar,
  TATIndicator,
  SampleStatusStepper,
  TestListPopover,
  DoctorCell,
  OrderRowQuickActions,
  QuickAssignDoctorModal,
  QuickCollectSampleModal,
  AddPaymentModal,
  CancelOrderModal,
  PhlebotomyCollectionSheetModal,
  WhatsAppNotificationModal,
  OrderCommunicationHubModal,
  BulkOrderCommunicationModal,
  ColumnCustomizationPopover,
  OrdersTableSkeleton,
  OrdersEmptyState,
  useToast,
  ToastContainer,
  OrderStatusType,
} from "@/components/orders/orders-ui";
import NotificationDispatchModal, { NotificationPayload } from "@/components/common/NotificationDispatchModal";
import {
  OrderAnalyticsDashboard,
  OrderPipelineView,
  TATMonitorPanel,
  AdvancedFilterBar,
  type OrderAnalytics,
  type TATData,
  type PipelineData,
} from "@/components/orders/OrdersAdvancedUI";
import OrderQuickDrawer, { DrawerOrder } from "@/components/orders/OrderQuickDrawer";
import OrderPipelineKanban from "@/components/orders/OrderPipelineKanban";
import SpecimenAccessioningModal from "@/components/orders/SpecimenAccessioningModal";
import RegisterOrderWizard from "@/components/orders/RegisterOrderWizard";
import PhlebotomyBarcodeGeneratorModal from "@/components/orders/PhlebotomyBarcodeGeneratorModal";

// Orders Integration Engine Modules
import OrdersIntegrationEngine from "@/components/orders/OrdersIntegrationEngine";
import OrdersIntegrationWidget from "@/components/orders/OrdersIntegrationWidget";

import {
  Barcode,
  Search,
  Plus,
  Filter,
  RefreshCw,
  Download,
  Printer,
  Calendar,
  Layers,
  ArrowUpDown,
  Clock,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Copy,
  ExternalLink,
  Timer,
  BarChart3,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  Flame,
  CreditCard,
  MessageCircle,
  Eye,
  ScanLine,
  UserRound,
  ShieldCheck,
  Building2,
  Activity,
  Stethoscope,
  X,
  ChevronRight,
  PackageCheck,
  Receipt,
  Phone,
  Server,
  Award,
  QrCode,
  MapPin,
  Split
} from "lucide-react";

export interface Order {
  id: string;
  orderNumber: string;
  barcode: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    uhid: string;
    phone: string;
    gender: string;
    dateOfBirth?: string;
    age?: number;
    email?: string;
    address?: string;
  };
  doctor?: {
    id: string;
    doctorCode: string;
    fullName: string;
    specialization: string;
    clinicName?: string;
    phone?: string;
  };
  items: Array<{
    id: string;
    test: {
      id: string;
      testCode: string;
      testName: string;
      sampleType: string;
      sampleContainer?: string;
      tatHours?: number;
      processingDepartment?: string;
    };
    price: number;
    finalPrice: number;
  }>;
  samples?: Array<{
    id: string;
    sampleNumber: string;
    barcode: string;
    sampleType: string;
    status: string;
    collectedAt?: string;
  }>;
  orderStatus: string;
  paymentStatus: string;
  priority?: string;
  collectionType?: string;
  createdAt: string;
  sampleCollected: boolean;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
}

const TUBE_CONTAINER_COLORS: Record<string, { bg: string; text: string; border: string; capColor: string; name: string }> = {
  "EDTA Tube": { bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/40", capColor: "#8B5CF6", name: "Lavender EDTA" },
  "Lavender Top": { bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/40", capColor: "#8B5CF6", name: "Lavender EDTA" },
  "Serum Separator Tube": { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/40", capColor: "#F59E0B", name: "Gold SST Gel" },
  "SST": { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/40", capColor: "#F59E0B", name: "Gold SST Gel" },
  "Red Top": { bg: "bg-red-500/10", text: "text-red-300", border: "border-red-500/40", capColor: "#EF4444", name: "Red Plain" },
  "Sodium Citrate": { bg: "bg-sky-500/10", text: "text-sky-300", border: "border-sky-500/40", capColor: "#0284C7", name: "Light Blue Citrate" },
  "Light Blue": { bg: "bg-sky-500/10", text: "text-sky-300", border: "border-sky-500/40", capColor: "#0284C7", name: "Light Blue Citrate" },
  "Lithium Heparin": { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/40", capColor: "#10B981", name: "Green Heparin" },
  "Green Top": { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/40", capColor: "#10B981", name: "Green Heparin" },
  "Fluoride Tube": { bg: "bg-slate-500/10", text: "text-slate-300", border: "border-slate-500/40", capColor: "#64748B", name: "Grey Fluoride" },
  "Grey Top": { bg: "bg-slate-500/10", text: "text-slate-300", border: "border-slate-500/40", capColor: "#64748B", name: "Grey Fluoride" },
  "Sterile Container": { bg: "bg-yellow-500/10", text: "text-yellow-300", border: "border-yellow-500/40", capColor: "#EAB308", name: "Urine Sterile Cup" },
};

function getContainerStyle(containerName?: string) {
  if (!containerName) return { bg: "bg-cyan-500/10", text: "text-cyan-300", border: "border-cyan-500/40", capColor: "#06B6D4", name: "Standard Specimen" };
  for (const [key, val] of Object.entries(TUBE_CONTAINER_COLORS)) {
    if (containerName.toLowerCase().includes(key.toLowerCase())) {
      return val;
    }
  }
  return { bg: "bg-cyan-500/10", text: "text-cyan-300", border: "border-cyan-500/40", capColor: "#06B6D4", name: containerName };
}

export default function OrdersPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toasts, showToast, removeToast } = useToast();
  const showToastRef = useRef(showToast);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);

  // Master Workstation Tab
  const [workstationTab, setWorkstationTab] = useState<"worklist" | "kanban" | "tat" | "analytics" | "comms" | "integration">("worklist");
  const [activeBranch, setActiveBranch] = useState("Main Hospital Central Lab (Block A - Level 1)");

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [collectionTypeFilter, setCollectionTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Analytics data states
  const [analyticsData, setAnalyticsData] = useState<OrderAnalytics | null>(null);
  const [tatData, setTatData] = useState<TATData | null>(null);
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showTATMonitor, setShowTATMonitor] = useState(false);
  const [bulkOpLoading, setBulkOpLoading] = useState(false);

  // Auto-refresh states
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Bulk action states
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Slide-over Drawer & Accessioning
  const [drawerOrder, setDrawerOrder] = useState<Order | null>(null);
  const [accessioningOrder, setAccessioningOrder] = useState<Order | null>(null);

  // Modals
  const [activeModalOrder, setActiveModalOrder] = useState<Order | null>(null);
  const [modalType, setModalType] = useState<
    | "assignDoctor"
    | "collectSample"
    | "addPayment"
    | "cancelOrder"
    | "whatsApp"
    | null
  >(null);
  const [showRunSheetModal, setShowRunSheetModal] = useState(false);
  const [showBulkNotifyModal, setShowBulkNotifyModal] = useState(false);
  const [showNewRequisitionWizard, setShowNewRequisitionWizard] = useState(false);
  const [showPhlebotomyBarcodeModal, setShowPhlebotomyBarcodeModal] = useState(false);
  const [phlebotomyBarcodeOrder, setPhlebotomyBarcodeOrder] = useState<Order | null>(null);

  // Notification Dispatch Modal
  const [orderNotifyModalOpen, setOrderNotifyModalOpen] = useState(false);
  const [orderNotifyPayload, setOrderNotifyPayload] = useState<NotificationPayload | null>(null);

  // URL State Synchronization (Level 4)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('tab')) setWorkstationTab(urlParams.get('tab') as any);
      if (urlParams.has('status')) setStatusFilter(urlParams.get('status') || "all");
      if (urlParams.has('payment')) setPaymentFilter(urlParams.get('payment') || "all");
      if (urlParams.has('priority')) setPriorityFilter(urlParams.get('priority') || "all");
      if (urlParams.has('dateFrom')) setDateFrom(urlParams.get('dateFrom') || "");
      if (urlParams.has('dateTo')) setDateTo(urlParams.get('dateTo') || "");
      if (urlParams.has('search')) setSearchTerm(urlParams.get('search') || "");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (workstationTab !== "worklist") url.searchParams.set("tab", workstationTab);
      else url.searchParams.delete("tab");
      
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
      else url.searchParams.delete("status");

      if (paymentFilter !== "all") url.searchParams.set("payment", paymentFilter);
      else url.searchParams.delete("payment");

      if (dateFrom) url.searchParams.set("dateFrom", dateFrom);
      else url.searchParams.delete("dateFrom");

      if (dateTo) url.searchParams.set("dateTo", dateTo);
      else url.searchParams.delete("dateTo");

      if (searchTerm) url.searchParams.set("search", searchTerm);
      else url.searchParams.delete("search");

      window.history.replaceState(null, '', url.toString());
    }
  }, [workstationTab, statusFilter, paymentFilter, dateFrom, dateTo, searchTerm]);

  const handleNotifyOrder = (order: Order) => {
    setOrderNotifyPayload({
      patientId: order.patient.id,
      patientName: `${order.patient.firstName} ${order.patient.lastName}`,
      phone: order.patient.phone,
      email: order.patient.email,
      uhid: order.patient.uhid,
      context: "ORDER",
      orderNumber: order.orderNumber,
      date: order.createdAt,
    });
    setOrderNotifyModalOpen(true);
  };

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const [analyticsRes, tatRes] = await Promise.all([
        orderApi.getAnalytics().catch(() => null),
        orderApi.getTATAnalytics().catch(() => null),
      ]);
      if (analyticsRes?.data) setAnalyticsData(analyticsRes.data);
      if (tatRes?.data) setTatData(tatRes.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // Fetch orders from API
  const fetchOrders = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setIsRefreshing(true);

      const [ordersRes, doctorsRes] = await Promise.all([
        orderApi.getAll(),
        doctorApi.getAll().catch(() => ({ data: [] })),
      ]);

      if (ordersRes && (ordersRes.success || ordersRes.data)) {
        const list = ordersRes.data?.orders || ordersRes.data || [];
        setOrders(Array.isArray(list) ? list : []);
      }

      if (doctorsRes && doctorsRes.data) {
        const docList = doctorsRes.data?.doctors || doctorsRes.data || [];
        setDoctors(Array.isArray(docList) ? docList : []);
      }
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      showToastRef.current(err.message || "Failed to fetch orders", "error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchAnalytics();
  }, [fetchOrders, fetchAnalytics]);

  // Auto-refresh timer (30s)
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchOrders(true);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled, fetchOrders]);

  // Keyboard shortcut: "/" to search, "N" for new order
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        router.push("/orders/new");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  // Filter and sort logic
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter((order) => {
        const fullName = `${order.patient?.firstName || ""} ${order.patient?.lastName || ""}`.toLowerCase();
        const uhid = (order.patient?.uhid || "").toLowerCase();
        const orderNum = (order.orderNumber || "").toLowerCase();
        const barcode = (order.barcode || "").toLowerCase();
        const doctorName = (order.doctor?.fullName || "").toLowerCase();
        const phone = (order.patient?.phone || "").toLowerCase();
        const tests = (order.items || []).map((i) => `${i.test?.testName} ${i.test?.testCode}`).join(" ").toLowerCase();

        return (
          fullName.includes(term) ||
          uhid.includes(term) ||
          orderNum.includes(term) ||
          barcode.includes(term) ||
          doctorName.includes(term) ||
          phone.includes(term) ||
          tests.includes(term)
        );
      });
    }

    if (statusFilter !== "all") {
      result = result.filter((o) => o.orderStatus === statusFilter);
    }

    if (paymentFilter !== "all") {
      result = result.filter((o) => o.paymentStatus === paymentFilter);
    }

    if (priorityFilter !== "all") {
      result = result.filter((o) => (o.priority || "ROUTINE") === priorityFilter);
    }

    if (collectionTypeFilter) {
      result = result.filter((o) => o.collectionType === collectionTypeFilter);
    }

    if (selectedDepartment !== "ALL") {
      result = result.filter((o) =>
        (o.items || []).some((i) => {
          const dept = (i.test?.processingDepartment || i.test?.testName || "").toLowerCase();
          return dept.includes(selectedDepartment.toLowerCase());
        })
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA: any = a[sortBy as keyof Order] ?? "";
      let valB: any = b[sortBy as keyof Order] ?? "";

      if (sortBy === "createdAt") {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      } else if (sortBy === "patient") {
        valA = `${a.patient?.firstName} ${a.patient?.lastName}`.toLowerCase();
        valB = `${b.patient?.firstName} ${b.patient?.lastName}`.toLowerCase();
      } else if (sortBy === "grandTotal") {
        valA = a.grandTotal || 0;
        valB = b.grandTotal || 0;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [orders, searchTerm, statusFilter, paymentFilter, priorityFilter, collectionTypeFilter, selectedDepartment, sortBy, sortOrder]);

  // Metrics
  const computedMetrics = useMemo(() => {
    const totalOrders = orders.length;
    const pendingDraw = orders.filter((o) => !o.sampleCollected && o.orderStatus !== "CANCELLED").length;
    const statCount = orders.filter((o) => (o.priority === "STAT" || o.priority === "URGENT") && o.orderStatus !== "COMPLETED").length;
    const inAnalyzer = orders.filter((o) => o.orderStatus === "PROCESSING").length;
    const completedCount = orders.filter((o) => o.orderStatus === "COMPLETED").length;
    const totalBilled = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const totalCollected = orders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
    const totalDue = orders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);

    return {
      totalOrders,
      pendingDraw,
      statCount,
      inAnalyzer,
      completedCount,
      totalBilled,
      totalCollected,
      totalDue,
    };
  }, [orders]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  // Workflow status progression
  const handleAdvanceStatus = async (order: Order, nextStatus: string) => {
    try {
      setUpdatingOrderId(order.id);
      if (nextStatus === "SAMPLE_COLLECTED") {
        setActiveModalOrder(order);
        setModalType("collectSample");
        return;
      }
      await orderApi.update(order.id, { orderStatus: nextStatus });
      showToast(`Order #${order.orderNumber} updated to ${nextStatus}`, "success");
      await fetchOrders(true);
      if (drawerOrder?.id === order.id) {
        setDrawerOrder((prev) => (prev ? { ...prev, orderStatus: nextStatus } : null));
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update order status", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // 1-Click STAT Emergency Escalation Handler
  const handleToggleStat = async (order: Order) => {
    const isCurrentlyStat = order.priority === "STAT";
    const nextPriority = isCurrentlyStat ? "ROUTINE" : "STAT";
    try {
      setUpdatingOrderId(order.id);
      await orderApi.update(order.id, { priority: nextPriority });
      showToast(
        nextPriority === "STAT"
          ? `Order #${order.orderNumber} escalated to STAT Emergency priority!`
          : `Order #${order.orderNumber} reverted to Routine priority`,
        nextPriority === "STAT" ? "warning" : "info"
      );
      await fetchOrders(true);
      if (drawerOrder?.id === order.id) {
        setDrawerOrder((prev) => (prev ? { ...prev, priority: nextPriority } : null));
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update priority", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Bulk Selection Handlers
  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const handleSelectAllCurrentPage = () => {
    if (selectedOrders.size === currentOrders.length && currentOrders.length > 0) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(currentOrders.map((o) => o.id)));
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    const ids = Array.from(selectedOrders);
    if (ids.length === 0) return;
    setBulkOpLoading(true);
    try {
      await orderApi.bulkUpdateStatus(ids, newStatus);
      showToast(`${ids.length} orders updated to ${newStatus}`, "success");
      setSelectedOrders(new Set());
      await fetchOrders(true);
      await fetchAnalytics();
    } catch (err: any) {
      showToast(err.message || "Bulk update failed", "error");
    } finally {
      setBulkOpLoading(false);
    }
  };

  const handleBulkPrintLabels = () => {
    const ids = Array.from(selectedOrders);
    if (ids.length === 0) return;
    const batchIds = ids.slice(0, 5);
    batchIds.forEach((id, idx) => {
      setTimeout(() => window.open(`/orders/${id}/barcode`, "_blank"), idx * 150);
    });
    showToast(`Opening barcode label sheets for ${batchIds.length} orders`, "info");
  };

  const handleExportCSV = () => {
    const headers = ["Order Number", "Barcode", "Patient UHID", "Patient Name", "Phone", "Doctor", "Tests", "Priority", "Status", "Payment", "Total", "Paid", "Due", "Created At"];
    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber || ""}"`,
      `"${o.barcode || ""}"`,
      `"${o.patient?.uhid || ""}"`,
      `"${o.patient?.firstName || ""} ${o.patient?.lastName || ""}"`,
      `"${o.patient?.phone || ""}"`,
      `"${o.doctor?.fullName || "Self"}"`,
      `"${(o.items || []).map((i) => i.test?.testName).join("; ")}"`,
      `"${o.priority || "ROUTINE"}"`,
      `"${o.orderStatus || ""}"`,
      `"${o.paymentStatus || ""}"`,
      o.grandTotal || 0,
      o.paidAmount || 0,
      o.dueAmount || 0,
      `"${new Date(o.createdAt).toLocaleString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LABCORE_Orders_Manifest_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout title="Clinical Orders">
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        <div className="space-y-6 pb-12">
          {/* ========================================================
              EXECUTIVE CLINICAL HOSPITAL REQUISITIONS COMMAND HEADER
              (Light White Medical Aesthetic with Hospital Emblem & Accreditation)
              ======================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 relative overflow-hidden transition-all duration-300">
            {/* Subtle medical ambient accent glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-100/40 via-teal-50/30 to-transparent rounded-full pointer-events-none -mr-24 -mt-24 blur-3xl" />

            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
              
              {/* Left Column: Hospital Emblem Logo, Institution Name, Accreditations */}
              <div className="flex items-start gap-4">
                {/* Official Medical Heraldic Logo Emblem */}
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-sky-500 p-0.5 shadow-md flex-shrink-0">
                  <div className="h-full w-full bg-white rounded-[14px] flex flex-col items-center justify-center p-1 text-center shadow-inner relative overflow-hidden">
                    <div className="absolute -top-3 -right-3 h-8 w-8 bg-sky-100 rounded-full blur-xs pointer-events-none" />
                    <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-10 sm:w-10 text-sky-600" fill="currentColor">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1z" />
                      <circle cx="18" cy="6" r="2" fill="#0d9488" />
                    </svg>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-800 leading-none mt-0.5">
                      LABCORE
                    </span>
                    <span className="text-[6.5px] font-bold text-sky-700 tracking-tighter">
                      CPOE ORDERS
                    </span>
                  </div>
                </div>

                {/* Institution Identity & Accreditations */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Order Bus Online • 0 Loss Ingest
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                      <Award className="h-3 w-3 text-sky-600" />
                      NABL ISO 15189:2022 (MC-5421)
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                      <QrCode className="h-3 w-3 text-indigo-600" />
                      ABDM e-Prescription (FHIR R4)
                    </span>

                    <button
                      type="button"
                      onClick={() => setWorkstationTab("integration")}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100 transition-all cursor-pointer shadow-2xs"
                    >
                      <Server className="h-3 w-3 text-sky-600" />
                      Integration Engine: 6 Feeds Active &rarr;
                    </button>
                  </div>

                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      APEX MULTI-SPECIALTY HOSPITAL &amp; REFERENCE DIAGNOSTICS
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                      Centralized clinical test requisition hub with automated phlebotomy dispatch, diagnostic analyzer routing, real-time SLA breach alarms, and billing ledger.
                    </p>
                  </div>

                  {/* Branch Location Selector */}
                  <div className="flex items-center gap-2 pt-1 text-xs text-slate-600 flex-wrap">
                    <span className="flex items-center gap-1 font-bold text-slate-800">
                      <MapPin className="h-3.5 w-3.5 text-rose-500" /> Ordering Unit:
                    </span>
                    <select
                      value={activeBranch}
                      onChange={(e) => setActiveBranch(e.target.value)}
                      className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer"
                    >
                      <option value="Main Hospital Central Lab (Block A - Level 1)">Main Hospital Central Lab (Block A - Level 1)</option>
                      <option value="OPD Phlebotomy & Day-Care Collection Centre">OPD Phlebotomy & Day-Care Collection Centre</option>
                      <option value="Emergency / Casualty STAT Satellite Unit">Emergency / Casualty STAT Satellite Unit</option>
                      <option value="North City B2B Referral Annex">North City B2B Referral Annex</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Actions Hub */}
              <div className="flex flex-wrap items-center gap-2 xl:flex-col xl:items-end justify-between flex-shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setAutoRefreshEnabled((v) => !v)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all shadow-2xs ${
                      autoRefreshEnabled
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${autoRefreshEnabled ? "animate-spin text-emerald-600" : ""}`} />
                    Live Sync {autoRefreshEnabled ? `(${countdown}s)` : "OFF"}
                  </button>

                  <button
                    onClick={() => setShowRunSheetModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 px-3 py-2 text-xs font-bold text-purple-700 transition-all shadow-2xs"
                  >
                    <FlaskConical className="h-3.5 w-3.5 text-purple-600" /> Phlebotomy Run-Sheet
                  </button>

                  <button
                    onClick={() => {
                      setPhlebotomyBarcodeOrder(null);
                      setShowPhlebotomyBarcodeModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 text-xs font-bold text-indigo-700 transition-all shadow-2xs"
                  >
                    <Barcode className="h-3.5 w-3.5 text-indigo-600" /> Phlebotomy Tube Barcodes
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition-all shadow-2xs"
                  >
                    <Download className="h-3.5 w-3.5 text-sky-600" /> Export CSV
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowNewRequisitionWizard(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Requisition</span>
                    <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.2 text-[9px] font-mono bg-white/20 rounded">N</kbd>
                  </button>
                </div>
              </div>
            </div>

            {/* Real-Time Light Professional KPI Strip */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 border-t border-slate-100 pt-5">
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Booked</span>
                  <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                </div>
                <p className="mt-1 text-2xl font-black text-slate-900">{computedMetrics.totalOrders}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Active requisitions</p>
              </div>

              <div className="rounded-xl border border-amber-200/90 bg-amber-50/50 p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Phlebotomy Due</span>
                <p className="mt-1 text-2xl font-black text-amber-900">{computedMetrics.pendingDraw}</p>
                <p className="text-[10px] text-amber-700/80 mt-0.5">Awaiting sample draw</p>
              </div>

              <div className="rounded-xl border border-rose-200/90 bg-rose-50/50 p-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">STAT / Critical</span>
                  {computedMetrics.statCount > 0 && <Flame className="h-3.5 w-3.5 text-rose-600 fill-rose-600 animate-bounce" />}
                </div>
                <p className="mt-1 text-2xl font-black text-rose-900">{computedMetrics.statCount}</p>
                <p className="text-[10px] text-rose-700/80 mt-0.5">Emergency priorities</p>
              </div>

              <div className="rounded-xl border border-indigo-200/90 bg-indigo-50/50 p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">In-Analyzer Run</span>
                <p className="mt-1 text-2xl font-black text-indigo-900">{computedMetrics.inAnalyzer}</p>
                <p className="text-[10px] text-indigo-700/80 mt-0.5">On diagnostic bays</p>
              </div>

              <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/50 p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Revenue Billed</span>
                <p className="mt-1 text-2xl font-black text-emerald-900">₹{computedMetrics.totalBilled.toLocaleString()}</p>
                <p className="text-[10px] text-emerald-700/80 mt-0.5">₹{computedMetrics.totalCollected.toLocaleString()} Collected</p>
              </div>

              <div className="rounded-xl border border-purple-200/90 bg-purple-50/50 p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">Balance Due</span>
                <p className={`mt-1 text-2xl font-black ${computedMetrics.totalDue > 0 ? "text-amber-800" : "text-purple-900"}`}>
                  ₹{computedMetrics.totalDue.toLocaleString()}
                </p>
                <p className="text-[10px] text-purple-700/80 mt-0.5">Outstanding ledger</p>
              </div>
            </div>
          </div>

          {/* Master Workstation Mode Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/90 pb-3">
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 overflow-x-auto max-w-full">
              <button
                onClick={() => setWorkstationTab("worklist")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  workstationTab === "worklist"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5 text-sky-600" />
                <span>1. Requisitions Worklist</span>
                <span className="rounded-full bg-slate-200/80 text-slate-700 px-2 py-0.2 text-[10px] font-mono">
                  {filteredOrders.length}
                </span>
              </button>

              <button
                onClick={() => setWorkstationTab("kanban")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  workstationTab === "kanban"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5 text-indigo-600" />
                <span>2. Clinical Pipeline Kanban</span>
              </button>

              <button
                onClick={() => setWorkstationTab("tat")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  workstationTab === "tat"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Timer className="h-3.5 w-3.5 text-teal-600" />
                <span>3. TAT &amp; SLA Breach Watch</span>
                {tatData && tatData.breached > 0 && (
                  <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[9px] font-bold text-white animate-pulse">
                    {tatData.breached} Breached
                  </span>
                )}
              </button>

              <button
                onClick={() => setWorkstationTab("analytics")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  workstationTab === "analytics"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5 text-cyan-600" />
                <span>4. Analytics</span>
              </button>

              <button
                onClick={() => setWorkstationTab("comms")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  workstationTab === "comms"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>5. WhatsApp &amp; SMS</span>
              </button>

              <button
                onClick={() => setWorkstationTab("integration")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  workstationTab === "integration"
                    ? "bg-white text-sky-800 shadow-xs border border-sky-300 ring-1 ring-sky-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Server className="h-3.5 w-3.5 text-sky-600" />
                <span>6. Orders Integration Engine</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            </div>
          </div>

          {/* TAB 1: MASTER REQUISITIONS WORKLIST */}
          {workstationTab === "worklist" && (
            <div className="space-y-5">
              {/* STAT Emergency Fast-Track Triage Alert Banner */}
              {computedMetrics.statCount > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-300 bg-gradient-to-r from-rose-50 via-red-50/60 to-rose-50 p-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                      <Flame className="h-5 w-5 fill-white animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-rose-800">
                          CRITICAL STAT EMERGENCY TRIAGE ALERT
                        </span>
                        <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                      </div>
                      <p className="text-xs text-rose-950 font-bold mt-0.5">
                        {computedMetrics.statCount} Requisition(s) require immediate laboratory processing (Sub-60 min SLA).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPriorityFilter(priorityFilter === "STAT" ? "all" : "STAT")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-2xs ${
                        priorityFilter === "STAT"
                          ? "bg-rose-700 text-white"
                          : "bg-white text-rose-800 border border-rose-300 hover:bg-rose-100"
                      }`}
                    >
                      {priorityFilter === "STAT" ? "Show All Requisitions" : "⚡ Isolate STAT Orders"}
                    </button>
                  </div>
                </div>
              )}

              {/* Filter Toolbar */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {([
                      ["all", "All Requisitions", orders.length],
                      ["REGISTERED", "Registered / Phlebotomy Due", computedMetrics.pendingDraw],
                      ["SAMPLE_COLLECTED", "Sample Drawn", orders.filter((o) => o.orderStatus === "SAMPLE_COLLECTED").length],
                      ["PROCESSING", "On Analyzers", computedMetrics.inAnalyzer],
                      ["COMPLETED", "Completed & Signed", computedMetrics.completedCount],
                      ["CANCELLED", "Cancelled", orders.filter((o) => o.orderStatus === "CANCELLED").length],
                    ] as const).map(([val, label, count]) => (
                      <button
                        key={val}
                        onClick={() => setStatusFilter(val)}
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                          statusFilter === val
                            ? "bg-sky-50 text-sky-800 border border-sky-300 shadow-2xs font-extrabold"
                            : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span>{label}</span>
                        <span className="rounded-md bg-slate-200/80 px-1.5 py-0.2 font-mono text-[10px] text-slate-800 font-bold">
                          {count}
                        </span>
                      </button>
                    ))}
                  </div>

                  <span className="text-xs text-slate-500 font-medium">
                    Showing {filteredOrders.length} of {orders.length} orders
                  </span>
                </div>

                {/* Laboratory Department Routing Filter Strip */}
                <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 pb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1 shrink-0">
                    <FlaskConical className="h-3.5 w-3.5 text-sky-600" /> Department:
                  </span>
                  {([
                    ["ALL", "All Departments"],
                    ["Biochemistry", "Biochemistry & Immunochemistry"],
                    ["Hematology", "Hematology & Coagulation"],
                    ["Pathology", "Clinical Pathology & Urine"],
                    ["Microbiology", "Microbiology & Serology"],
                    ["Molecular", "Molecular / RT-PCR"],
                  ] as const).map(([deptKey, deptLabel]) => (
                    <button
                      key={deptKey}
                      type="button"
                      onClick={() => setSelectedDepartment(deptKey)}
                      className={`px-3 py-1 rounded-xl text-xs transition-all whitespace-nowrap font-bold ${
                        selectedDepartment === deptKey
                          ? "bg-sky-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60"
                      }`}
                    >
                      {deptLabel}
                    </button>
                  ))}
                </div>

                {/* Filter Inputs Grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="relative lg:col-span-2">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search Order #, Barcode, UHID, Patient, Phone, Doctor, Test..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-500 transition-all font-medium"
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div>
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-sky-500 transition-all font-medium cursor-pointer"
                    >
                      <option value="all">All Payment Statuses</option>
                      <option value="PAID">Fully Paid</option>
                      <option value="PARTIAL">Partially Paid</option>
                      <option value="PENDING">Payment Pending</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-sky-500 transition-all font-medium cursor-pointer"
                    >
                      <option value="all">All Priorities</option>
                      <option value="ROUTINE">Routine Requisition</option>
                      <option value="URGENT">Urgent Priority</option>
                      <option value="STAT">STAT / Emergency</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-sky-500 transition-all font-medium cursor-pointer"
                    >
                      <option value="createdAt">Sort: Requisition Date</option>
                      <option value="patient">Sort: Patient Name</option>
                      <option value="grandTotal">Sort: Total Amount</option>
                      <option value="orderStatus">Sort: Lifecycle Stage</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Orders Integration Engine Telemetry Card Widget */}
              <OrdersIntegrationWidget
                onOpenEngine={() => setWorkstationTab("integration")}
                ordersToday={computedMetrics.totalOrders}
              />

              {/* Bulk Operations Toolbar */}
              {selectedOrders.size > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4 text-slate-800 shadow-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-white font-black text-sm shadow-xs">
                      {selectedOrders.size}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-cyan-950">Selected Orders for Batch Operations</p>
                      <p className="text-[10px] text-slate-600">Perform mass status progression, label printing, or patient dispatch</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleBulkStatusUpdate("SAMPLE_COLLECTED")}
                      disabled={bulkOpLoading}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-700 transition-all disabled:opacity-50"
                    >
                      <FlaskConical className="h-4 w-4" /> Batch Mark Drawn
                    </button>

                    <button
                      onClick={() => handleBulkStatusUpdate("PROCESSING")}
                      disabled={bulkOpLoading}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-cyan-700 transition-all disabled:opacity-50"
                    >
                      <Activity className="h-4 w-4" /> Route to Analyzers
                    </button>

                    <button
                      onClick={handleBulkPrintLabels}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-2xs"
                    >
                      <Printer className="h-4 w-4 text-cyan-600" /> Print Tube Barcodes
                    </button>

                    <button
                      onClick={() => setShowBulkNotifyModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all shadow-2xs"
                    >
                      <MessageCircle className="h-4 w-4 text-emerald-600" /> Batch WhatsApp
                    </button>

                    <button
                      onClick={() => setSelectedOrders(new Set())}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Master Clinical Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                {loading ? (
                  <OrdersTableSkeleton />
                ) : filteredOrders.length === 0 ? (
                  <OrdersEmptyState hasFilters={Boolean(searchTerm || statusFilter !== "all" || paymentFilter !== "all" || priorityFilter !== "all")} onResetFilters={() => { setSearchTerm(""); setStatusFilter("all"); setPaymentFilter("all"); setPriorityFilter("all"); }} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        <tr>
                          <th className="px-5 py-4 w-10">
                            <input
                              type="checkbox"
                              checked={selectedOrders.size === currentOrders.length && currentOrders.length > 0}
                              onChange={handleSelectAllCurrentPage}
                              className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                            />
                          </th>
                          <th className="px-5 py-4">Requisition ID</th>
                          <th className="px-5 py-4">Patient Demographics</th>
                          <th className="px-5 py-4">Referring Doctor</th>
                          <th className="px-5 py-4">Test Panels &amp; Containers</th>
                          <th className="px-5 py-4">Stage &amp; Phlebotomy</th>
                          <th className="px-5 py-4">Billing &amp; Ledger</th>
                          <th className="px-5 py-4 text-right">Workflow Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {currentOrders.map((order) => {
                          const isStat = order.priority === "STAT" || order.priority === "URGENT";
                          const isUpdating = updatingOrderId === order.id;

                          return (
                            <tr
                              key={order.id}
                              className={`group transition-all duration-150 hover:bg-slate-50/80 ${
                                isStat ? "bg-rose-50/50" : ""
                              }`}
                            >
                              <td className="px-5 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedOrders.has(order.id)}
                                  onChange={() => handleToggleSelectOrder(order.id)}
                                  className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                />
                              </td>

                              {/* Requisition ID & Barcode with 1-Click STAT Escalator */}
                              <td className="px-5 py-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                      onClick={() => setDrawerOrder(order)}
                                      className="font-mono text-xs font-black text-slate-900 hover:text-sky-600 transition-colors"
                                    >
                                      {order.orderNumber}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStat(order)}
                                      title={isStat ? "Click to revert to Routine" : "Click to escalate to STAT Emergency"}
                                      className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase transition-all flex items-center gap-0.5 cursor-pointer ${
                                        isStat
                                          ? "bg-rose-600 text-white shadow-2xs hover:bg-rose-700 animate-pulse"
                                          : "bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-700 border border-slate-200"
                                      }`}
                                    >
                                      <Flame className={`h-2.5 w-2.5 ${isStat ? "fill-white" : ""}`} />
                                      {isStat ? "STAT" : "Escalate"}
                                    </button>
                                  </div>
                                  <p className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                                    <ScanLine className="h-3 w-3 text-sky-600" /> {order.barcode}
                                  </p>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {new Date(order.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                              </td>

                              {/* Patient Demographics & ABDM Health ID */}
                              <td className="px-5 py-4">
                                <div className="space-y-1">
                                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <UserRound className="h-3.5 w-3.5 text-sky-600" />
                                    {order.patient.firstName} {order.patient.lastName}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 flex-wrap">
                                    <span>UHID: <strong className="font-mono text-slate-800">{order.patient.uhid}</strong></span>
                                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                      ABDM Linked ✓
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400">
                                    {order.patient.age || "—"} yrs · {order.patient.gender} · {order.patient.phone || "No phone"}
                                  </p>
                                </div>
                              </td>

                              {/* Referring Doctor */}
                              <td className="px-5 py-4">
                                <DoctorCell
                                  doctor={order.doctor}
                                  onAssignDoctorClick={() => {
                                    setActiveModalOrder(order);
                                    setModalType("assignDoctor");
                                  }}
                                />
                              </td>

                              {/* Tests & Tube Containers */}
                              <td className="px-5 py-4">
                                <div className="space-y-1.5">
                                  <TestListPopover items={order.items} />
                                  <div className="flex flex-wrap gap-1">
                                    {order.items.slice(0, 2).map((item, i) => {
                                      const tube = getContainerStyle(item.test.sampleContainer);
                                      return (
                                        <span
                                          key={i}
                                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold border"
                                          style={{
                                            borderColor: `${tube.capColor}55`,
                                            backgroundColor: `${tube.capColor}15`,
                                            color: tube.capColor,
                                          }}
                                        >
                                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tube.capColor }} />
                                          <span className="truncate max-w-[90px]">{item.test.testCode}</span>
                                        </span>
                                      );
                                    })}
                                    {order.items.length > 2 && (
                                      <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-mono text-slate-600 font-bold border border-slate-200">
                                        +{order.items.length - 2}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Status, Phlebotomy & TAT SLA */}
                              <td className="px-5 py-4">
                                <div className="space-y-1.5 min-w-[130px]">
                                  <div className="flex items-center gap-1.5">
                                    <StatusBadge status={order.orderStatus as any} />
                                    {isStat && (
                                      <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                                        &lt;1h SLA
                                      </span>
                                    )}
                                  </div>
                                  <SampleStatusStepper
                                    orderStatus={order.orderStatus as any}
                                    sampleCollected={order.sampleCollected}
                                  />
                                </div>
                              </td>

                              {/* Billing & Ledger */}
                              <td className="px-5 py-4">
                                <div className="space-y-1 min-w-[110px]">
                                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                                    <span>₹{order.grandTotal}</span>
                                    <span className={`text-[10px] font-bold ${
                                      order.paymentStatus === "PAID" ? "text-emerald-600" :
                                      order.paymentStatus === "PARTIAL" ? "text-amber-600" : "text-rose-600"
                                    }`}>
                                      {order.paymentStatus}
                                    </span>
                                  </div>
                                  <PaymentProgressBar
                                    grandTotal={order.grandTotal}
                                    paidAmount={order.paidAmount}
                                    paymentStatus={order.paymentStatus}
                                    onAddPaymentClick={() => {
                                      setActiveModalOrder(order);
                                      setModalType("addPayment");
                                    }}
                                  />
                                </div>
                              </td>

                              {/* Workflow Actions */}
                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {!order.sampleCollected && order.orderStatus !== "CANCELLED" && (
                                    <button
                                      onClick={() => {
                                        setActiveModalOrder(order);
                                        setModalType("collectSample");
                                      }}
                                      className="rounded-xl bg-purple-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-purple-700 transition-all flex items-center gap-1"
                                      title="Draw Sample / Phlebotomy"
                                    >
                                      <FlaskConical className="h-3 w-3" /> Draw
                                    </button>
                                  )}

                                  {order.orderStatus === "SAMPLE_COLLECTED" && (
                                    <>
                                      <button
                                        onClick={() => setAccessioningOrder(order)}
                                        className="rounded-xl border border-sky-300 bg-sky-50 px-2.5 py-1.5 text-[11px] font-black text-sky-800 shadow-2xs hover:bg-sky-100 transition-all flex items-center gap-1"
                                        title="Lab Specimen Accessioning & Centrifuge Queue"
                                      >
                                        <PackageCheck className="h-3 w-3 text-sky-600" /> Accession
                                      </button>
                                      <button
                                        onClick={() => handleAdvanceStatus(order, "PROCESSING")}
                                        disabled={isUpdating}
                                        className="rounded-xl bg-sky-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-sky-700 transition-all"
                                        title="Load on Analyzer"
                                      >
                                        Run Lab
                                      </button>
                                    </>
                                  )}

                                  {order.orderStatus === "PROCESSING" && (
                                    <button
                                      onClick={() => handleAdvanceStatus(order, "COMPLETED")}
                                      disabled={isUpdating}
                                      className="rounded-xl bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 transition-all"
                                      title="Sign-off & Validate"
                                    >
                                      Validate
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      setPhlebotomyBarcodeOrder(order);
                                      setShowPhlebotomyBarcodeModal(true);
                                    }}
                                    className="rounded-xl border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs"
                                    title="Phlebotomy Specimen Tube Barcodes"
                                  >
                                    <Barcode className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    onClick={() => window.open(`/orders/${order.id}/barcode`, "_blank")}
                                    className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-slate-600 hover:text-sky-600 hover:bg-slate-100 transition-colors shadow-2xs"
                                    title="Print Tube Barcodes"
                                  >
                                    <Printer className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    onClick={() => setDrawerOrder(order)}
                                    className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
                                    title="Inspect Order Dossier"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setActiveModalOrder(order);
                                      setModalType("whatsApp");
                                    }}
                                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs"
                                    title="WhatsApp Requisition Receipt"
                                  >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                  </button>

                                  <OrderRowQuickActions
                                    order={order as any}
                                    onView={() => router.push(`/orders/${order.id}`)}
                                    onAssignDoctor={() => {
                                      setActiveModalOrder(order);
                                      setModalType("assignDoctor");
                                    }}
                                    onCollectSample={() => {
                                      setActiveModalOrder(order);
                                      setModalType("collectSample");
                                    }}
                                    onAddPayment={() => {
                                      setActiveModalOrder(order);
                                      setModalType("addPayment");
                                    }}
                                    onCancel={() => {
                                      setActiveModalOrder(order);
                                      setModalType("cancelOrder");
                                    }}
                                    onWhatsApp={() => {
                                      setActiveModalOrder(order);
                                      setModalType("whatsApp");
                                    }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-4">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 shadow-2xs"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-slate-500">
                      Page <span className="font-bold text-slate-900">{currentPage}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 shadow-2xs"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CLINICAL PIPELINE KANBAN */}
          {workstationTab === "kanban" && (
            <OrderPipelineKanban
              orders={orders as any}
              onSelectOrder={(order) => setDrawerOrder(order as any)}
              onAdvanceStatus={(order, nextStatus) => handleAdvanceStatus(order as any, nextStatus)}
              onPrintBarcode={(order) => window.open(`/orders/${order.id}/barcode`, "_blank")}
              onWhatsApp={(order) => {
                setActiveModalOrder(order as any);
                setModalType("whatsApp");
              }}
              updatingOrderId={updatingOrderId}
            />
          )}

          {/* TAB 3: TAT & SLA BREACH WATCH */}
          {workstationTab === "tat" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 space-y-6 shadow-xs">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Timer className="h-5 w-5 text-cyan-600" /> Real-time Turnaround Time (TAT) Telemetry
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Continuous monitoring of requisition test delivery against NABL / CAP SLA targets.
                  </p>
                </div>
                <button
                  onClick={() => setShowTATMonitor(true)}
                  className="rounded-xl bg-cyan-600 hover:bg-cyan-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors"
                >
                  Open Dedicated TAT Modal
                </button>
              </div>

              {tatData ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">On-Time Requisitions</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{tatData.active - tatData.breached}</p>
                    <p className="text-xs text-emerald-700 mt-1">Within standard protocol</p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Critical TAT Alert (&gt;80%)</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{tatData.critical}</p>
                    <p className="text-xs text-amber-700 mt-1">Approaching breach threshold</p>
                  </div>
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-rose-800">TAT Breached Orders</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{tatData.breached}</p>
                    <p className="text-xs text-rose-700 mt-1">Immediate escalation required</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">Loading TAT telemetry...</div>
              )}
            </div>
          )}

          {/* TAB 4: FINANCIAL & OPERATIONAL ANALYTICS */}
          {workstationTab === "analytics" && (
            <div className="space-y-6">
              <OrderAnalyticsDashboard
                analytics={analyticsData ?? {
                  overview: {
                    totalOrders: computedMetrics.totalOrders,
                    todayOrders: computedMetrics.totalOrders,
                    pendingSamples: computedMetrics.pendingDraw,
                    statOrders: computedMetrics.statCount,
                    urgentOrders: 0,
                    completedToday: computedMetrics.completedCount,
                    cancelledToday: 0,
                    tatBreachCount: tatData?.breached || 0,
                  },
                  revenue: {
                    totalBilled: computedMetrics.totalBilled,
                    totalCollected: computedMetrics.totalCollected,
                    totalPending: computedMetrics.totalDue,
                    collectionRate: computedMetrics.totalBilled ? Math.round((computedMetrics.totalCollected / computedMetrics.totalBilled) * 100) : 100,
                  },
                  statusBreakdown: [],
                  paymentBreakdown: [],
                  topTests: [],
                  topDoctors: [],
                }}
                tatData={tatData}
                loading={analyticsLoading}
                onStatClick={(filter) => {
                  if (filter === "STAT") { setPriorityFilter("STAT"); setWorkstationTab("worklist"); }
                  else if (filter === "REGISTERED") { setStatusFilter("REGISTERED"); setWorkstationTab("worklist"); }
                  else if (filter === "COMPLETED") { setStatusFilter("COMPLETED"); setWorkstationTab("worklist"); }
                }}
              />
            </div>
          )}

          {/* TAB 5: PATIENT WHATSAPP & COMMUNICATIONS */}
          {workstationTab === "comms" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 space-y-6 shadow-xs">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-emerald-600" /> Patient Multi-Channel Communication Gateway
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Direct automated WhatsApp &amp; SMS delivery of requisition booking confirmations, payment links, and test reports.
                  </p>
                </div>
                <button
                  onClick={() => setShowBulkNotifyModal(true)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors"
                >
                  Send Bulk Broadcast Notification
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {orders.slice(0, 6).map((order) => (
                  <div key={order.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{order.patient.firstName} {order.patient.lastName}</p>
                        <p className="font-mono text-xs text-slate-500">{order.patient.phone || "No phone"}</p>
                      </div>
                      <span className="font-mono text-[10px] text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded font-bold">
                        {order.orderNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-xs">
                      <span className="text-slate-600">{order.items.length} Test Panel(s)</span>
                      <button
                        onClick={() => {
                          setActiveModalOrder(order);
                          setModalType("whatsApp");
                        }}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                      >
                        Send WhatsApp
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: ORDERS INTEGRATION ENGINE */}
          {workstationTab === "integration" && (
            <div className="space-y-6">
              <OrdersIntegrationEngine
                onInjectOrderToWorklist={() => {
                  fetchOrders();
                  fetchAnalytics();
                }}
              />
            </div>
          )}
        </div>

        {/* Slide-Over Quick Inspection Drawer */}
        <OrderQuickDrawer
          order={drawerOrder as any}
          isOpen={!!drawerOrder}
          onClose={() => setDrawerOrder(null)}
          onCollectSample={(o) => {
            setActiveModalOrder(o as any);
            setModalType("collectSample");
          }}
          onAddPayment={(o) => {
            setActiveModalOrder(o as any);
            setModalType("addPayment");
          }}
          onAssignDoctor={(o) => {
            setActiveModalOrder(o as any);
            setModalType("assignDoctor");
          }}
          onCancelOrder={(o) => {
            setActiveModalOrder(o as any);
            setModalType("cancelOrder");
          }}
          onWhatsApp={(o) => {
            setActiveModalOrder(o as any);
            setModalType("whatsApp");
          }}
          onPrintBarcode={(o) => window.open(`/orders/${o.id}/barcode`, "_blank")}
          onPrintInvoice={(o) => window.open(`/orders/${o.id}/receipt`, "_blank")}
        />

        {/* Specimen Intake & Laboratory Accessioning Modal */}
        <SpecimenAccessioningModal
          order={accessioningOrder as any}
          isOpen={!!accessioningOrder}
          onClose={() => setAccessioningOrder(null)}
          onAccessionSuccess={async (data) => {
            showToast(`Order #${accessioningOrder?.orderNumber} accessioned into ${data.rackId} (${data.slotPosition})`, "success");
            if (accessioningOrder) {
              await handleAdvanceStatus(accessioningOrder, "PROCESSING");
            }
            setAccessioningOrder(null);
          }}
        />

        {/* TAT Monitor Modal */}
        <TATMonitorPanel
          tatData={tatData}
          isOpen={showTATMonitor}
          onClose={() => setShowTATMonitor(false)}
          onOrderClick={(id) => {
            setShowTATMonitor(false);
            const found = orders.find((o) => o.id === id);
            if (found) setDrawerOrder(found);
            else router.push(`/orders/${id}`);
          }}
        />

        {/* Phlebotomy Collection Run-Sheet Modal */}
        <PhlebotomyCollectionSheetModal
          orders={filteredOrders as any}
          isOpen={showRunSheetModal}
          onClose={() => setShowRunSheetModal(false)}
        />

        {/* Bulk WhatsApp Notification Modal */}
        <BulkOrderCommunicationModal
          orders={filteredOrders.filter((o) => selectedOrders.has(o.id)) as any}
          isOpen={showBulkNotifyModal}
          onClose={() => setShowBulkNotifyModal(false)}
          onSuccess={() => {
            showToast("Bulk WhatsApp notifications dispatched", "success");
            setSelectedOrders(new Set());
          }}
        />

        {/* Assign Doctor Modal */}
        {modalType === "assignDoctor" && activeModalOrder && (
          <QuickAssignDoctorModal
            order={activeModalOrder as any}
            doctors={doctors}
            isOpen={true}
            onClose={() => { setModalType(null); setActiveModalOrder(null); }}
            onAssigned={async (doctorId: string) => {
              await orderApi.update(activeModalOrder.id, { doctorId });
              showToast("Referring doctor updated", "success");
              setModalType(null);
              setActiveModalOrder(null);
              await fetchOrders(true);
            }}
          />
        )}

        {/* Collect Sample Modal */}
        {modalType === "collectSample" && activeModalOrder && (
          <QuickCollectSampleModal
            order={activeModalOrder as any}
            isOpen={true}
            onClose={() => { setModalType(null); setActiveModalOrder(null); }}
            onCollected={async (data) => {
              await orderApi.collectSample(activeModalOrder.id, {
                barcode: data.barcode,
                notes: data.notes,
              });
              showToast("Specimen collected and tube barcode assigned", "success");
              setModalType(null);
              setActiveModalOrder(null);
              await fetchOrders(true);
            }}
          />
        )}

        {/* Add Payment Modal */}
        {modalType === "addPayment" && activeModalOrder && (
          <AddPaymentModal
            order={activeModalOrder as any}
            isOpen={true}
            onClose={() => { setModalType(null); setActiveModalOrder(null); }}
            onPaymentAdded={async (data) => {
              await paymentsApi.create({
                orderId: activeModalOrder.id,
                amount: data.amount,
                method: data.method,
                remarks: data.remarks,
              });
              showToast(`Payment of ₹${data.amount} recorded`, "success");
              setModalType(null);
              setActiveModalOrder(null);
              await fetchOrders(true);
            }}
          />
        )}

        {/* Cancel Order Modal */}
        {modalType === "cancelOrder" && activeModalOrder && (
          <CancelOrderModal
            order={activeModalOrder as any}
            isOpen={true}
            onClose={() => { setModalType(null); setActiveModalOrder(null); }}
            onCancelled={async (reason: string) => {
              await orderApi.cancel(activeModalOrder.id, { reason });
              showToast(`Order #${activeModalOrder.orderNumber} cancelled`, "warning");
              setModalType(null);
              setActiveModalOrder(null);
              await fetchOrders(true);
            }}
          />
        )}

        {/* WhatsApp Notification Modal */}
        {modalType === "whatsApp" && activeModalOrder && (
          <WhatsAppNotificationModal
            order={activeModalOrder as any}
            isOpen={true}
            onClose={() => { setModalType(null); setActiveModalOrder(null); }}
          />
        )}
        {/* Universal Notification Dispatch Modal */}
        {orderNotifyModalOpen && orderNotifyPayload && (
          <NotificationDispatchModal
            isOpen={orderNotifyModalOpen}
            onClose={() => setOrderNotifyModalOpen(false)}
            payload={orderNotifyPayload}
          />
        )}

        {/* Register New Requisition Wizard Modal (Exact RegisterPatientWizard Design) */}
        <RegisterOrderWizard
          isOpen={showNewRequisitionWizard}
          onClose={() => setShowNewRequisitionWizard(false)}
          onSuccess={async (createdOrder) => {
            setShowNewRequisitionWizard(false);
            showToast(`Requisition #${createdOrder?.orderNumber || "New"} registered successfully!`, "success");
            await fetchOrders(true);
          }}
        />

        {/* Phlebotomy Specimen Tube Barcode Generator Modal */}
        <PhlebotomyBarcodeGeneratorModal
          isOpen={showPhlebotomyBarcodeModal}
          onClose={() => {
            setShowPhlebotomyBarcodeModal(false);
            setPhlebotomyBarcodeOrder(null);
          }}
          order={phlebotomyBarcodeOrder}
          orders={orders}
          onSelectOrder={(sel) => setPhlebotomyBarcodeOrder(sel)}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

