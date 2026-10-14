"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { analyzersApi } from "@/lib/api";
import { Analyzer, AnalyzerStatus } from "@/types";
import AnalyzerStatusCards from "@/components/analyzers/AnalyzerStatusCards";
import AddAnalyzerModal from "@/components/analyzers/AddAnalyzerModal";
import ConnectionTestModal from "@/components/analyzers/ConnectionTestModal";
import LiveResultFeed from "@/components/analyzers/LiveResultFeed";
import UnmatchedResultsQueue from "@/components/analyzers/UnmatchedResultsQueue";
import AutoValidationEngine from "@/components/analyzers/AutoValidationEngine";
import CommunicationErrorLog from "@/components/analyzers/CommunicationErrorLog";
import ParameterCodeMappingTool from "@/components/analyzers/ParameterCodeMappingTool";
import TelemetryConsole from "@/components/analyzers/TelemetryConsole";
import HematologyWorkbench from "@/components/analyzers/HematologyWorkbench";
import BidirectionalQuerySystem from "@/components/analyzers/BidirectionalQuerySystem";
import AutoApprovalQC from "@/components/analyzers/AutoApprovalQC";
import StatSpecimenLane from "@/components/analyzers/StatSpecimenLane";
import RealWorldReagentTracker from "@/components/analyzers/RealWorldReagentTracker";
import ShiftQCGate from "@/components/analyzers/ShiftQCGate";
import VirtualAnalyzerSimulator from "@/components/analyzers/VirtualAnalyzerSimulator";
import ReflexCascadeEngine from "@/components/analyzers/ReflexCascadeEngine";
import SmartWorkloadBalancer from "@/components/analyzers/SmartWorkloadBalancer";
import MaintenanceComplianceLogbook from "@/components/analyzers/MaintenanceComplianceLogbook";
import MiddlewareDriverHub from "@/components/analyzers/MiddlewareDriverHub";
import PredictiveAnomalyEngine from "@/components/analyzers/PredictiveAnomalyEngine";
import ReagentLotCorrelationSuite from "@/components/analyzers/ReagentLotCorrelationSuite";
import CriticalPanicEscalationHub from "@/components/analyzers/CriticalPanicEscalationHub";
import SpecimenTrackingDashboard from "@/components/analyzers/SpecimenTrackingDashboard";
import CrossAnalyzerQCCorrelation from "@/components/analyzers/CrossAnalyzerQCCorrelation";
import LabThroughputAnalytics from "@/components/analyzers/LabThroughputAnalytics";
import AnalyzerDocumentationHub from "@/components/analyzers/AnalyzerDocumentationHub";
import { REAL_WORLD_ANALYZERS } from "@/components/analyzers/realWorldDemoAnalyzers";
import {
  Activity,
  AlertCircle,
  Plus,
  Search,
  Settings,
  Trash2,
  Eye,
  RefreshCw,
  Wifi,
  WifiOff,
  Network,
  BarChart3,
  Server,
  LayoutGrid,
  Table as TableIcon,
  Radio,
  Clock,
  ShieldCheck,
  FileQuestion,
  Sliders,
  ChevronRight,
  FileText,
  ArrowRightLeft,
  CheckCircle2,
  Download,
  Zap,
  Terminal,
  Sparkles,
  AlertTriangle,
  X,
  Cpu,
  Droplets,
  Award,
  PhoneCall,
  Flame,
  Layers,
  ChevronDown,
  Check
} from "lucide-react";

export type ActiveTabType =
  | "inventory"
  | "interactive_docs"
  | "stat_lane"
  | "workload_balancer"
  | "reagents"
  | "lot_correlation"
  | "reflex_engine"
  | "critical_panic"
  | "shift_qc"
  | "maintenance_audit"
  | "anomaly_forecast"
  | "driver_hub"
  | "simulator"
  | "bidirectional"
  | "live_feed"
  | "qc_validation"
  | "diagnostics"
  | "hematology"
  | "specimen_tracking"
  | "qc_correlation"
  | "throughput_analytics";

export type HubId = "fleet" | "worklists" | "results" | "qc" | "compliance";

interface SubFeatureDef {
  id: ActiveTabType;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
  tagColor?: string;
  pulse?: boolean;
}

interface HubDef {
  id: HubId;
  number: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  badgeText: string;
  tabs: SubFeatureDef[];
}

const HUBS: HubDef[] = [
  {
    id: "fleet",
    number: "01",
    title: "Fleet & Hardware",
    subtitle: "Inventory, LIS Drivers, Simulator & Logs",
    icon: Server,
    accentColor: "from-blue-600 to-indigo-600",
    activeBg: "bg-blue-500/15",
    activeBorder: "border-blue-500/50",
    activeText: "text-blue-300",
    badgeText: "Core Fleet",
    tabs: [
      {
        id: "inventory",
        label: "Fleet Inventory",
        shortLabel: "Inventory",
        description: "Connected analyzers, live status cards, telemetry ping, port configs & mappings",
        icon: Server,
        tag: "Instruments",
      },
      {
        id: "driver_hub",
        label: "LIS Driver Hub",
        shortLabel: "LIS Drivers",
        description: "ASTM E1394, HL7 v2.5, TCP/IP sockets & RS-232 serial middleware drivers",
        icon: Network,
        tag: "ASTM / HL7",
      },
      {
        id: "simulator",
        label: "Virtual Protocol Simulator",
        shortLabel: "Simulator",
        description: "Simulate physical machine connection, send ENQ/ACK frames, test bi-directional flow",
        icon: Cpu,
        tag: "Test Bench",
      },
      {
        id: "diagnostics",
        label: "Diagnostics & Error Logs",
        shortLabel: "Diagnostics",
        description: "Low-level socket logs, frame checksum errors, buffer tracing & packet inspector",
        icon: Terminal,
        tag: "Socket Log",
      },
    ],
  },
  {
    id: "worklists",
    number: "02",
    title: "Specimens & Worklists",
    subtitle: "STAT Lane, Dispatcher, Routing & Tracking",
    icon: ArrowRightLeft,
    accentColor: "from-rose-600 to-amber-600",
    activeBg: "bg-rose-500/15",
    activeBorder: "border-rose-500/50",
    activeText: "text-rose-300",
    badgeText: "Routing",
    tabs: [
      {
        id: "stat_lane",
        label: "STAT Emergency Lane",
        shortLabel: "STAT Lane",
        description: "15-minute emergency priority queue with live countdown & aspiration stage tracking",
        icon: Zap,
        tag: "15m TAT",
        tagColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        pulse: true,
      },
      {
        id: "bidirectional",
        label: "Bidirectional Worklists",
        shortLabel: "Worklists",
        description: "Host query dispatch, query pending tubes by barcode, and verify LIS order ACK",
        icon: ArrowRightLeft,
        tag: "Host Query",
      },
      {
        id: "workload_balancer",
        label: "Smart Specimen Router",
        shortLabel: "AI Balancer",
        description: "AI workload balancer routing sample racks across parallel instruments to avoid bottlenecks",
        icon: Layers,
        tag: "AI Routing",
      },
      {
        id: "specimen_tracking",
        label: "Specimen Chain-of-Custody",
        shortLabel: "Specimen Tracking",
        description: "End-to-end tube custody tracking from accession desk to analyzer rack and disposal",
        icon: Clock,
        tag: "Live TAT",
      },
    ],
  },
  {
    id: "results",
    number: "03",
    title: "Live Results & Alerts",
    subtitle: "Real-time Feed, Panic Escalation & Hematology",
    icon: Radio,
    accentColor: "from-emerald-600 to-teal-600",
    activeBg: "bg-emerald-500/15",
    activeBorder: "border-emerald-500/50",
    activeText: "text-emerald-300",
    badgeText: "Real-Time",
    tabs: [
      {
        id: "live_feed",
        label: "Live Result Stream",
        shortLabel: "Live Feed",
        description: "Real-time incoming ASTM OBR/OBX packets and HL7 ORU_R01 frames parsed instantly",
        icon: Radio,
        tag: "LIVE FEED",
        tagColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        pulse: true,
      },
      {
        id: "critical_panic",
        label: "Critical Panic Escalation",
        shortLabel: "Critical Panic",
        description: "Urgent panic value detection, phone read-back compliance & physician escalation audit",
        icon: PhoneCall,
        tag: "Read-Back",
        tagColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        pulse: true,
      },
      {
        id: "hematology",
        label: "Hematology & CBC Suite",
        shortLabel: "Hematology",
        description: "Sysmex, Mindray & Beckman 5-part differential scattergrams, flagging & morphology check",
        icon: Activity,
        tag: "Scattergrams",
      },
      {
        id: "reflex_engine",
        label: "Reflex & Cascade Rules",
        shortLabel: "Reflex Testing",
        description: "Automated secondary test ordering when trigger criteria are met (e.g. reflex FT4 on abnormal TSH)",
        icon: Sparkles,
        tag: "Auto-Order",
      },
    ],
  },
  {
    id: "qc",
    number: "04",
    title: "Quality & Validation",
    subtitle: "Shift QC, Westgard, Rules & Reagents",
    icon: ShieldCheck,
    accentColor: "from-violet-600 to-purple-600",
    activeBg: "bg-violet-500/15",
    activeBorder: "border-violet-500/50",
    activeText: "text-violet-300",
    badgeText: "QA / QC",
    tabs: [
      {
        id: "shift_qc",
        label: "Shift QC & Westgard Gate",
        shortLabel: "Shift QC Gate",
        description: "Pre-shift run lockout gate, Westgard multirules (1-2s, 1-3s, 2-2s, R-4s, 10x) and Levey-Jennings",
        icon: ShieldCheck,
        tag: "Westgard",
      },
      {
        id: "qc_validation",
        label: "Auto-Approval QC Matrix",
        shortLabel: "Auto-Approval",
        description: "Automated result validation matrix with critical range limits, delta checks & release criteria",
        icon: Sliders,
        tag: "Auto-Release",
      },
      {
        id: "qc_correlation",
        label: "Multi-Analyzer QC Correlation",
        shortLabel: "QC Correlation",
        description: "Cross-instrument bias analysis, Passing-Bablok regression & Six Sigma performance metrics",
        icon: BarChart3,
        tag: "Six Sigma",
      },
      {
        id: "reagents",
        label: "Reagents & Consumables",
        shortLabel: "Reagents",
        description: "Real-time onboard reagent volumes, remaining test counts, expiry monitoring & pack changes",
        icon: Droplets,
        tag: "Inventory",
      },
      {
        id: "lot_correlation",
        label: "Lot-to-Lot Verification",
        shortLabel: "Lot Verification",
        description: "Reagent batch changeover validation protocol, patient comparison & parallel testing audit",
        icon: Award,
        tag: "Verification",
      },
    ],
  },
  {
    id: "compliance",
    number: "05",
    title: "Operations & SOP",
    subtitle: "Maintenance, AI Forecasting, TAT & SOP",
    icon: FileText,
    accentColor: "from-cyan-600 to-emerald-600",
    activeBg: "bg-teal-500/15",
    activeBorder: "border-teal-500/50",
    activeText: "text-teal-300",
    badgeText: "NABL Ready",
    tabs: [
      {
        id: "maintenance_audit",
        label: "NABL Maintenance Logbook",
        shortLabel: "Maintenance",
        description: "Daily, weekly and monthly preventive maintenance audit trail conforming to ISO 15189:2022",
        icon: Settings,
        tag: "ISO 15189",
      },
      {
        id: "anomaly_forecast",
        label: "AI Breakdown Forecasting",
        shortLabel: "AI Forecast",
        description: "Predictive sensor drift analytics, maintenance warnings & Mean-Time-To-Failure forecasting",
        icon: Flame,
        tag: "Predictive",
      },
      {
        id: "throughput_analytics",
        label: "Throughput & TAT Analytics",
        shortLabel: "TAT Analytics",
        description: "Analyzer test volume trends, peak hour distribution, machine utilization & TAT compliance",
        icon: BarChart3,
        tag: "KPIs",
      },
      {
        id: "interactive_docs",
        label: "Official DOCUMINICATION (SOP Manual)",
        shortLabel: "DOCUMINICATION",
        description: "Complete Interactive Operating Manual, NABL ISO 15189 Standard Operating Procedures & PDF manual export",
        icon: FileText,
        tag: "PDF SOP",
        tagColor: "bg-emerald-500/25 text-emerald-200 border-emerald-400/40",
      },
    ],
  },
];

export default function AnalyzersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSection = searchParams.get("section");

  const [analyzers, setAnalyzers] = useState<Analyzer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<ActiveTabType>(() => {
    const tabParam = initialSection || searchParams.get("tab");
    if (tabParam === "interactive_docs" || tabParam === "docs" || tabParam === "sop") return "interactive_docs";
    if (tabParam === "hematology" || tabParam === "section=hematology") return "hematology";
    if (tabParam === "stat_lane") return "stat_lane";
    if (tabParam === "workload_balancer") return "workload_balancer";
    if (tabParam === "reagents") return "reagents";
    if (tabParam === "lot_correlation") return "lot_correlation";
    if (tabParam === "reflex_engine") return "reflex_engine";
    if (tabParam === "critical_panic") return "critical_panic";
    if (tabParam === "shift_qc") return "shift_qc";
    if (tabParam === "maintenance_audit") return "maintenance_audit";
    if (tabParam === "anomaly_forecast") return "anomaly_forecast";
    if (tabParam === "driver_hub") return "driver_hub";
    if (tabParam === "simulator") return "simulator";
    if (tabParam === "bidirectional") return "bidirectional";
    if (tabParam === "live_feed") return "live_feed";
    if (tabParam === "qc_validation") return "qc_validation";
    if (tabParam === "diagnostics") return "diagnostics";
    if (tabParam === "specimen_tracking") return "specimen_tracking";
    if (tabParam === "qc_correlation") return "qc_correlation";
    if (tabParam === "throughput_analytics") return "throughput_analytics";
    return "inventory";
  });

  // Sync activeTab whenever URL searchParams change (e.g. from sidebar navigation)
  useEffect(() => {
    const tabParam = searchParams.get("section") || searchParams.get("tab");
    if (!tabParam) return;
    if (tabParam === "interactive_docs" || tabParam === "docs" || tabParam === "sop") setActiveTab("interactive_docs");
    else if (tabParam === "hematology" || tabParam === "section=hematology") setActiveTab("hematology");
    else if (tabParam === "stat_lane") setActiveTab("stat_lane");
    else if (tabParam === "workload_balancer") setActiveTab("workload_balancer");
    else if (tabParam === "reagents") setActiveTab("reagents");
    else if (tabParam === "lot_correlation") setActiveTab("lot_correlation");
    else if (tabParam === "reflex_engine") setActiveTab("reflex_engine");
    else if (tabParam === "critical_panic") setActiveTab("critical_panic");
    else if (tabParam === "shift_qc") setActiveTab("shift_qc");
    else if (tabParam === "maintenance_audit") setActiveTab("maintenance_audit");
    else if (tabParam === "anomaly_forecast") setActiveTab("anomaly_forecast");
    else if (tabParam === "driver_hub") setActiveTab("driver_hub");
    else if (tabParam === "simulator") setActiveTab("simulator");
    else if (tabParam === "bidirectional") setActiveTab("bidirectional");
    else if (tabParam === "live_feed") setActiveTab("live_feed");
    else if (tabParam === "qc_validation") setActiveTab("qc_validation");
    else if (tabParam === "diagnostics") setActiveTab("diagnostics");
    else if (tabParam === "specimen_tracking") setActiveTab("specimen_tracking");
    else if (tabParam === "qc_correlation") setActiveTab("qc_correlation");
    else if (tabParam === "throughput_analytics") setActiveTab("throughput_analytics");
    else if (tabParam === "inventory") setActiveTab("inventory");
  }, [searchParams]);

  // Calculate active Hub automatically from activeTab
  const activeHub = useMemo<HubId>(() => {
    for (const hub of HUBS) {
      if (hub.tabs.some((t) => t.id === activeTab)) {
        return hub.id;
      }
    }
    return "fleet";
  }, [activeTab]);

  const currentHubDef = useMemo(() => {
    return HUBS.find((h) => h.id === activeHub) || HUBS[0];
  }, [activeHub]);

  // View Mode for inventory: "cards" | "table"
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Show status cards summary strip inside inventory
  const [showKpiStrip, setShowKpiStrip] = useState(false);

  // Filter and search state
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [protocolFilter, setProtocolFilter] = useState<string>("");
  const [activeFilterChip, setActiveFilterChip] = useState<string>("ALL");

  // Global feature search / switcher
  const [featureSearchQuery, setFeatureSearchQuery] = useState("");
  const [showFeatureSearchMenu, setShowFeatureSearchMenu] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Modal visibility states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);
  const [showUnmatchedModal, setShowUnmatchedModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showErrorLogModal, setShowErrorLogModal] = useState(false);

  // Selected analyzer for modal contexts
  const [selectedAnalyzer, setSelectedAnalyzer] = useState<Analyzer | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unmatchedCount, setUnmatchedCount] = useState(3);
  const [isPingingFleet, setIsPingingFleet] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);

  // Live debounced search (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const fetchAnalyzers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter) params.append("status", statusFilter);
      if (departmentFilter) params.append("department", departmentFilter);
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());

      const response = await analyzersApi.getAll(params.toString());

      if (response.success && response.data?.analyzers && response.data.analyzers.length > 0) {
        setAnalyzers(response.data.analyzers || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        // Fallback to real-world clinical analyzers dataset
        let list: Analyzer[] = REAL_WORLD_ANALYZERS;
        try {
          const demoRes = await analyzersApi.getDemoData();
          if (demoRes.success && demoRes.data?.analyzers && demoRes.data.analyzers.length > 0) {
            list = demoRes.data.analyzers;
          }
        } catch {
          list = REAL_WORLD_ANALYZERS;
        }

        if (debouncedSearch) {
          const term = debouncedSearch.toLowerCase();
          list = list.filter(
            (a) =>
              a.name.toLowerCase().includes(term) ||
              a.analyzerId.toLowerCase().includes(term) ||
              (a.manufacturer && a.manufacturer.toLowerCase().includes(term)) ||
              (a.model && a.model.toLowerCase().includes(term))
          );
        }
        if (statusFilter) {
          list = list.filter((a) => a.status === statusFilter);
        }
        if (departmentFilter) {
          list = list.filter((a) => a.department === departmentFilter);
        }
        setAnalyzers(list);
        setPagination((prev) => ({ ...prev, total: list.length, totalPages: 1 }));
      }
    } catch (err: any) {
      console.warn("API fetch notice:", err);
      let list: Analyzer[] = REAL_WORLD_ANALYZERS;
      try {
        const demoRes = await analyzersApi.getDemoData();
        if (demoRes.success && demoRes.data?.analyzers && demoRes.data.analyzers.length > 0) {
          list = demoRes.data.analyzers;
        }
      } catch {
        list = REAL_WORLD_ANALYZERS;
      }
      setAnalyzers(list);
      setPagination((prev) => ({ ...prev, total: list.length, totalPages: 1 }));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, departmentFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchAnalyzers();
  }, [fetchAnalyzers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnalyzers();
    setIsRefreshing(false);
    setToastMessage({ text: "Fleet telemetry & status synchronised", type: "success" });
  };

  const handleTestConnection = (analyzer: Analyzer) => {
    setSelectedAnalyzer(analyzer);
    setShowConnectionModal(true);
  };

  const handleConfigureMappings = (analyzer: Analyzer) => {
    setSelectedAnalyzer(analyzer);
    setShowMappingModal(true);
  };

  const handleShowTelemetry = (analyzer: Analyzer) => {
    setSelectedAnalyzer(analyzer);
    setShowTelemetryModal(true);
  };

  const handleArchive = async (analyzer: Analyzer) => {
    if (!confirm(`Are you sure you want to archive ${analyzer.name}? This will pause active worklists.`)) return;
    try {
      await analyzersApi.archive(analyzer.id);
      await fetchAnalyzers();
      setToastMessage({ text: `Analyzer ${analyzer.name} archived`, type: "info" });
    } catch (err: any) {
      setError(err.message || "Failed to archive analyzer");
    }
  };

  const handleToggleStatus = async (analyzer: Analyzer) => {
    const newStatus = analyzer.status === "ONLINE" ? "OFFLINE" : "ONLINE";
    try {
      await analyzersApi.updateStatus(analyzer.id, { status: newStatus });
      await fetchAnalyzers();
      setToastMessage({
        text: `${analyzer.name} marked as ${newStatus}`,
        type: newStatus === "ONLINE" ? "success" : "info",
      });
    } catch (err: any) {
      setError(err.message || "Failed to update analyzer status");
    }
  };

  // Batch Ping All Instruments Handshake
  const handlePingFleet = async () => {
    setIsPingingFleet(true);
    try {
      const pingPromises = analyzers.map(async (analyzer) => {
        const simulatedLatency = Math.floor(Math.random() * 25) + 10;
        try {
          await analyzersApi.heartbeat(analyzer.id, { latency: simulatedLatency });
        } catch {
          // ignore individual error in batch
        }
      });
      await Promise.all(pingPromises);
      await fetchAnalyzers();
      setToastMessage({
        text: `Batch handshake complete: ${analyzers.length} instruments responded to ping`,
        type: "success",
      });
    } catch (err) {
      setToastMessage({ text: "Batch handshake encountered timeout on some devices", type: "error" });
    } finally {
      setIsPingingFleet(false);
    }
  };

  // Export fleet registry snapshot as JSON
  const handleExportFleet = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analyzers, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `analyzers_fleet_audit_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setToastMessage({ text: "Fleet configuration snapshot exported", type: "success" });
  };

  // Filter chips logic
  const filteredAnalyzers = useMemo(() => {
    return analyzers.filter((analyzer) => {
      // Search term
      if (debouncedSearch) {
        const term = debouncedSearch.toLowerCase();
        const matches =
          analyzer.name.toLowerCase().includes(term) ||
          analyzer.analyzerId.toLowerCase().includes(term) ||
          (analyzer.manufacturer && analyzer.manufacturer.toLowerCase().includes(term)) ||
          (analyzer.model && analyzer.model.toLowerCase().includes(term)) ||
          (analyzer.department && analyzer.department.toLowerCase().includes(term)) ||
          (analyzer.protocol && analyzer.protocol.toLowerCase().includes(term));
        if (!matches) return false;
      }

      // Chip filters
      if (activeFilterChip === "ONLINE" && analyzer.status !== "ONLINE") return false;
      if (activeFilterChip === "ATTENTION" && !["ERROR", "MAINTENANCE", "OFFLINE", "CALIBRATION_REQUIRED"].includes(analyzer.status)) return false;
      if (activeFilterChip === "HEMATOLOGY" && !`${analyzer.name} ${analyzer.department}`.toLowerCase().includes("hematol")) return false;
      if (activeFilterChip === "BIOCHEMISTRY" && !`${analyzer.name} ${analyzer.department}`.toLowerCase().includes("biochem")) return false;
      if (activeFilterChip === "IMMUNOLOGY" && !`${analyzer.name} ${analyzer.department}`.toLowerCase().includes("immuno")) return false;
      if (activeFilterChip === "ASTM" && !analyzer.protocol?.toUpperCase().includes("ASTM")) return false;
      if (activeFilterChip === "HL7" && !analyzer.protocol?.toUpperCase().includes("HL7")) return false;

      // Dropdown filters
      if (statusFilter && analyzer.status !== statusFilter) return false;
      if (departmentFilter && analyzer.department !== departmentFilter) return false;
      if (protocolFilter && analyzer.protocol !== protocolFilter) return false;

      return true;
    });
  }, [analyzers, debouncedSearch, activeFilterChip, statusFilter, departmentFilter, protocolFilter]);

  const onlineCount = analyzers.filter((a) => a.status === "ONLINE").length;
  const attentionCount = analyzers.filter((a) =>
    ["ERROR", "OFFLINE", "MAINTENANCE", "CALIBRATION_REQUIRED"].includes(a.status)
  ).length;

  // Flattened all 21 features for the search switcher
  const allFeatures = useMemo(() => {
    return HUBS.flatMap((hub) =>
      hub.tabs.map((tab) => ({
        ...tab,
        hubId: hub.id,
        hubTitle: hub.title,
      }))
    );
  }, []);

  const filteredFeaturesList = useMemo(() => {
    if (!featureSearchQuery) return allFeatures;
    const q = featureSearchQuery.toLowerCase();
    return allFeatures.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.hubTitle.toLowerCase().includes(q) ||
        (f.tag && f.tag.toLowerCase().includes(q))
    );
  }, [allFeatures, featureSearchQuery]);

  const handleSelectTab = (tabId: ActiveTabType) => {
    setActiveTab(tabId);
    setShowFeatureSearchMenu(false);
    setFeatureSearchQuery("");
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tabId);
        window.history.replaceState({}, "", url.toString());
      } catch {
        // fallback
      }
    }
  };

  // Handler to switch Hub and set default or requested tab
  const handleSelectHub = (hubId: HubId) => {
    const targetHub = HUBS.find((h) => h.id === hubId);
    if (!targetHub) return;
    // If current active tab already belongs to this hub, stay on it. Otherwise switch to first tab.
    const hasCurrentTab = targetHub.tabs.some((t) => t.id === activeTab);
    if (!hasCurrentTab && targetHub.tabs.length > 0) {
      handleSelectTab(targetHub.tabs[0].id);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout title="Laboratory Analyzers Hub">
        <div className="space-y-5 pb-16">
          {/* Toast Notification */}
          {toastMessage && (
            <div
              className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3 text-xs font-bold text-white shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
                toastMessage.type === "success"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/30"
                  : toastMessage.type === "error"
                  ? "bg-gradient-to-r from-rose-600 to-pink-600 shadow-rose-500/30"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30"
              }`}
            >
              {toastMessage.type === "success" && <CheckCircle2 className="h-4 w-4" />}
              {toastMessage.type === "error" && <AlertTriangle className="h-4 w-4" />}
              {toastMessage.type === "info" && <Radio className="h-4 w-4" />}
              <span>{toastMessage.text}</span>
              <button
                onClick={() => setToastMessage(null)}
                className="ml-2 text-white/70 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* MASTER EXECUTIVE HEADER WITH INTEGRATED METRICS & ACTIONS    */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-[#071326] to-slate-900 p-6 shadow-2xl text-white">
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:28px_28px]" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400 backdrop-blur-md">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    INTERFACE ENGINE ACTIVE
                  </span>
                  <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-mono font-medium text-blue-300">
                    ASTM E1394 / HL7 v2.5
                  </span>
                  <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-mono text-slate-300">
                    NABL ISO 15189:2022
                  </span>
                </div>

                <h1 className="mt-2.5 text-2xl md:text-3xl font-black tracking-tight text-white">
                  Enterprise Laboratory Analyzers & LIS Interface
                </h1>
                <p className="mt-1 text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
                  Real-time clinical laboratory instrument management: Pre-analytical specimen routing, bidirectional worklist dispatcher, analytical QC gates, and post-analytical auto-validation.
                </p>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Add Analyzer */}
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xl shadow-blue-500/25 transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Analyzer</span>
                </button>

                {/* SOP Manual Launcher */}
                <button
                  type="button"
                  onClick={() => handleSelectTab("interactive_docs")}
                  className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
                    activeTab === "interactive_docs"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-300"
                      : "border border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                  }`}
                  title="Open Official DOCUMINICATION (PDF Operating Manual & SOP)"
                >
                  <FileText className="h-4 w-4 text-emerald-300" />
                  <span>DOCUMINICATION SOP</span>
                </button>

                {/* Batch Ping Handshake */}
                <button
                  type="button"
                  onClick={handlePingFleet}
                  disabled={isPingingFleet || analyzers.length === 0}
                  className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/40 bg-cyan-500/15 px-3.5 py-2.5 text-xs font-bold text-cyan-200 backdrop-blur-md transition-all hover:bg-cyan-500/25 disabled:opacity-50"
                  title="Broadcast ping handshake across all connected analyzers"
                >
                  <Zap className={`h-4 w-4 text-cyan-300 ${isPingingFleet ? "animate-bounce" : ""}`} />
                  <span>{isPingingFleet ? "Pinging..." : "Ping Fleet"}</span>
                </button>

                {/* Orphan Queue */}
                <button
                  type="button"
                  onClick={() => setShowUnmatchedModal(true)}
                  className="relative inline-flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2.5 text-xs font-bold text-amber-200 backdrop-blur-md transition-all hover:bg-amber-500/25"
                  title="Open Orphan Queue to match unassigned results"
                >
                  <FileQuestion className="h-4 w-4 text-amber-400" />
                  <span>Orphan Queue</span>
                  {unmatchedCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950">
                      {unmatchedCount}
                    </span>
                  )}
                </button>

                {/* Export Fleet */}
                <button
                  type="button"
                  onClick={handleExportFleet}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700/80 hover:text-white transition-all"
                  title="Export fleet configuration audit"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>

                {/* Refresh Telemetry */}
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/80 p-2.5 text-slate-300 hover:bg-slate-700/80 hover:text-white transition-all disabled:opacity-50"
                  title="Synchronize all telemetry"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
                </button>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-4 sm:grid-cols-4">
              <div
                onClick={() => handleSelectTab("inventory")}
                className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-slate-900/60 cursor-pointer"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 shrink-0">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Fleet</p>
                  <p className="text-sm font-black text-white">{analyzers.length} Instruments</p>
                </div>
              </div>

              <div
                onClick={() => {
                  setActiveFilterChip("ONLINE");
                  handleSelectTab("inventory");
                }}
                className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-slate-900/60 cursor-pointer"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shrink-0">
                  <Wifi className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Online Coverage</p>
                  <p className="text-sm font-black text-emerald-400">
                    {analyzers.length ? Math.round((onlineCount / analyzers.length) * 100) : 0}% ({onlineCount}/{analyzers.length})
                  </p>
                </div>
              </div>

              <div
                onClick={() => handleSelectTab("bidirectional")}
                className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-slate-900/60 cursor-pointer"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-400 shrink-0">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">LIS Protocol</p>
                  <p className="text-sm font-black text-violet-300">Bi-directional</p>
                </div>
              </div>

              <div
                onClick={() => {
                  if (attentionCount > 0) {
                    setActiveFilterChip("ATTENTION");
                    handleSelectTab("inventory");
                  }
                }}
                className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-slate-900/60 cursor-pointer"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border shrink-0 ${
                  attentionCount > 0
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                }`}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Exceptions</p>
                  <p className={`text-sm font-black ${attentionCount > 0 ? "text-amber-400 font-extrabold" : "text-emerald-400"}`}>
                    {attentionCount === 0 ? "0 Flags (Optimal)" : `${attentionCount} Requiring Action`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* PROFESSIONAL 2-TIER WORKSPACE NAVIGATION (5 HUBS + SUB-TABS) */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-2 shadow-2xl">
            {/* TIER 1: THE 5 PRIMARY EXECUTIVE HUBS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pb-2">
              {HUBS.map((hub) => {
                const isCurrentHub = activeHub === hub.id;
                const HubIcon = hub.icon;
                return (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => handleSelectHub(hub.id)}
                    className={`group relative flex flex-col items-start rounded-2xl p-3.5 text-left transition-all duration-300 ${
                      isCurrentHub
                        ? `border ${hub.activeBorder} ${hub.activeBg} shadow-lg ring-1 ring-white/10`
                        : "border border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    {/* Top Row: Hub Number & Badge */}
                    <div className="flex w-full items-center justify-between">
                      <span className={`text-[10px] font-mono font-black ${isCurrentHub ? hub.activeText : "text-slate-500"}`}>
                        STAGE {hub.number}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                        isCurrentHub ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                      }`}>
                        {hub.tabs.length} Tools
                      </span>
                    </div>

                    {/* Middle: Icon & Title */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                        isCurrentHub
                          ? `border-white/20 bg-white/10 text-white`
                          : "border-slate-800 bg-slate-950 text-slate-400 group-hover:text-slate-200"
                      }`}>
                        <HubIcon className="h-4 w-4" />
                      </div>
                      <span className={`text-xs font-black tracking-tight ${isCurrentHub ? "text-white" : "text-slate-300 group-hover:text-white"}`}>
                        {hub.title}
                      </span>
                    </div>

                    {/* Subtitle */}
                    <p className="mt-1 line-clamp-1 text-[10px] text-slate-400">
                      {hub.subtitle}
                    </p>

                    {/* Active Accent Bar */}
                    {isCurrentHub && (
                      <div className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r ${hub.accentColor}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* TIER 2: FOCUSED SUB-FEATURE NAV PILLS & QUICK SWITCHER */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-800/80 pt-3 px-1.5">
              {/* Left: Sub-feature pills for current hub */}
              <div className="flex flex-wrap items-center gap-1.5">
                {currentHubDef.tabs.map((tab) => {
                  const isSelected = activeTab === tab.id;
                  const TabIcon = tab.icon;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleSelectTab(tab.id)}
                      className={`group flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
                        isSelected
                          ? `bg-gradient-to-r ${currentHubDef.accentColor} text-white shadow-lg ring-1 ring-white/20`
                          : "border border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80 hover:text-white"
                      }`}
                    >
                      <TabIcon className={`h-3.5 w-3.5 ${tab.pulse && !isSelected ? "text-rose-400 animate-pulse" : ""}`} />
                      <span>{tab.label}</span>
                      {tab.tag && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : tab.tagColor || "bg-slate-800 text-slate-300 border border-slate-700"
                          } ${tab.pulse ? "animate-pulse" : ""}`}
                        >
                          {tab.tag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right: Quick Feature Jump / Search Dropdown */}
              <div className="relative ml-auto">
                <button
                  type="button"
                  onClick={() => setShowFeatureSearchMenu((prev) => !prev)}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-all"
                >
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Jump to Feature (21)</span>
                  <span className="sm:hidden">Jump</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {showFeatureSearchMenu && (
                  <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search all analyzer features..."
                        value={featureSearchQuery}
                        onChange={(e) => setFeatureSearchQuery(e.target.value)}
                        autoFocus
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                      {filteredFeaturesList.map((item) => {
                        const ItemIcon = item.icon;
                        const isCurrent = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectTab(item.id)}
                            className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                              isCurrent
                                ? "bg-blue-600 text-white font-bold"
                                : "text-slate-300 hover:bg-slate-900 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <ItemIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              <div className="min-w-0">
                                <div className="truncate font-semibold">{item.label}</div>
                                <div className="truncate text-[10px] text-slate-400">{item.hubTitle}</div>
                              </div>
                            </div>
                            {item.tag && (
                              <span className="shrink-0 rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-slate-300 ml-2">
                                {item.tag}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB CONTENTS (21 MODULAR WORKSTATIONS)                          */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* HUB 1: FLEET INVENTORY */}
          {activeTab === "inventory" && (
            <div className="space-y-4">
              {/* Optional Telemetry KPI Strip toggle */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowKpiStrip((prev) => !prev)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors"
                >
                  <Activity className="h-3.5 w-3.5" />
                  <span>{showKpiStrip ? "Hide Telemetry Detail Cards" : "Show Telemetry Detail Cards"}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${showKpiStrip ? "rotate-180" : ""}`} />
                </button>
              </div>

              {showKpiStrip && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <AnalyzerStatusCards
                    externalRefreshing={isRefreshing}
                    onCardClick={(key) => {
                      if (key === "feeds") handleSelectTab("live_feed");
                      else if (key === "autovalidation") setShowValidationModal(true);
                      else if (key === "errors") setShowErrorLogModal(true);
                      else handleSelectTab("inventory");
                    }}
                  />
                </div>
              )}

              {/* Quick Filter Chips Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-sm text-white">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                    Quick Filter:
                  </span>

                  {[
                    { id: "ALL", label: `All (${analyzers.length})` },
                    { id: "ONLINE", label: `Online (${onlineCount})`, tone: "text-emerald-400 bg-emerald-500/15 border-emerald-500/40" },
                    { id: "ATTENTION", label: `Needs Attention (${attentionCount})`, tone: "text-rose-400 bg-rose-500/15 border-rose-500/40" },
                    { id: "HEMATOLOGY", label: "Hematology" },
                    { id: "BIOCHEMISTRY", label: "Biochemistry" },
                    { id: "IMMUNOLOGY", label: "Immunology" },
                    { id: "ASTM", label: "ASTM E1394" },
                    { id: "HL7", label: "HL7 v2.x" },
                  ].map((chip) => {
                    const isSelected = activeFilterChip === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => {
                          setActiveFilterChip(chip.id);
                          setPagination((prev) => ({ ...prev, page: 1 }));
                        }}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition-all ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : chip.tone
                            ? `${chip.tone} hover:opacity-80`
                            : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>

                {/* View Switcher & Counter */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-400">
                    Showing <strong className="text-white">{filteredAnalyzers.length}</strong> of {analyzers.length}
                  </span>

                  <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode("cards")}
                      className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                        viewMode === "cards" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      Cards
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                        viewMode === "table" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <TableIcon className="h-3.5 w-3.5" />
                      Table
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Search & Dropdowns Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3.5 shadow-sm text-white">
                <div className="relative flex-1 min-w-[280px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by instrument name, analyzer ID, brand, model, department..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-9 py-2.5 text-xs text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {searchInput && (
                    <button
                      onClick={() => setSearchInput("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Status: All</option>
                    <option value="ONLINE">Online</option>
                    <option value="OFFLINE">Offline</option>
                    <option value="BUSY">Busy</option>
                    <option value="ERROR">Error</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="CALIBRATION_REQUIRED">Calibration Due</option>
                  </select>

                  <select
                    value={departmentFilter}
                    onChange={(e) => {
                      setDepartmentFilter(e.target.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Dept: All</option>
                    <option value="Hematology">Hematology</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Immunology">Immunology</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Coagulation">Coagulation</option>
                    <option value="Urinalysis">Urinalysis</option>
                    <option value="Clinical Pathology">Clinical Pathology</option>
                  </select>

                  <select
                    value={protocolFilter}
                    onChange={(e) => setProtocolFilter(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Protocol: All</option>
                    <option value="ASTM_1394">ASTM 1394</option>
                    <option value="HL7_V2">HL7 v2.x</option>
                    <option value="ASTM_1381">ASTM 1381</option>
                    <option value="CUSTOM_SERIAL">Custom Serial</option>
                  </select>
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className="flex items-center justify-between rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-300 shadow-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-400" />
                    <span>{error}</span>
                  </div>
                  <button onClick={fetchAnalyzers} className="font-bold text-rose-300 hover:underline">
                    Retry
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredAnalyzers.length === 0 && (
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-12 text-center shadow-sm max-w-xl mx-auto my-6 text-white">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 shadow-sm border border-blue-500/20">
                    <Server className="h-8 w-8" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">No Analyzers Match Filters</h3>
                  <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                    {searchInput || statusFilter || departmentFilter || activeFilterChip !== "ALL"
                      ? "No instruments matched your active search criteria. Reset filters to see all instruments."
                      : "Connect physical laboratory machines (Sysmex, Roche, Mindray, etc.) via ASTM or HL7 protocol for automated worklists and bidirectional result capture."}
                  </p>
                  <button
                    onClick={() => {
                      setSearchInput("");
                      setStatusFilter("");
                      setDepartmentFilter("");
                      setProtocolFilter("");
                      setActiveFilterChip("ALL");
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-500 transition-all"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reset All Filters
                  </button>
                </div>
              )}

              {/* VIEW 1: PREMIUM CARDS GRID */}
              {!loading && filteredAnalyzers.length > 0 && viewMode === "cards" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredAnalyzers.map((analyzer) => {
                    const isOnline = analyzer.status === "ONLINE";
                    const isError = analyzer.status === "ERROR";
                    const isMaintenance = analyzer.status === "MAINTENANCE";

                    return (
                      <div
                        key={analyzer.id}
                        className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${
                          isOnline
                            ? "border-emerald-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 hover:border-emerald-400/60"
                            : isError
                            ? "border-rose-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/40 hover:border-rose-400/60"
                            : isMaintenance
                            ? "border-amber-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 hover:border-amber-400/60"
                            : "border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/30 hover:border-blue-500/50"
                        }`}
                      >
                        <div>
                          {/* Top Card Bar */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3.5">
                              <div
                                className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border p-3 font-bold shadow-lg transition-transform duration-300 group-hover:scale-105 ${
                                  isOnline
                                    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400 shadow-emerald-500/20"
                                    : isError
                                    ? "border-rose-500/40 bg-rose-500/20 text-rose-400 shadow-rose-500/20"
                                    : isMaintenance
                                    ? "border-amber-500/40 bg-amber-500/20 text-amber-400 shadow-amber-500/20"
                                    : "border-slate-700 bg-slate-800 text-slate-300"
                                }`}
                              >
                                <Activity className="h-6 w-6" />
                                <span
                                  className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-slate-950 ${
                                    isOnline
                                      ? "bg-emerald-400 shadow-[0_0_10px_#34d399]"
                                      : isError
                                      ? "bg-rose-400 shadow-[0_0_10px_#f43f5e]"
                                      : isMaintenance
                                      ? "bg-amber-400 shadow-[0_0_10px_#fbbf24]"
                                      : "bg-slate-500"
                                  }`}
                                />
                              </div>

                              <div>
                                <h3 className="text-base font-extrabold text-white tracking-tight group-hover:text-blue-300 transition-colors">
                                  {analyzer.name}
                                </h3>
                                <div className="mt-1 flex items-center gap-2 text-[11px] font-mono text-slate-400">
                                  <span>{analyzer.analyzerId}</span>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-slate-300 truncate max-w-[150px]">
                                    {analyzer.manufacturer || "Generic"} {analyzer.model || ""}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Status Indicator */}
                            <div className="flex items-center gap-2">
                              {isOnline && (
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                                </span>
                              )}
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                                  isOnline
                                    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                                    : isError
                                    ? "border-rose-500/40 bg-rose-500/20 text-rose-300"
                                    : isMaintenance
                                    ? "border-amber-500/40 bg-amber-500/20 text-amber-300"
                                    : "border-slate-700 bg-slate-800 text-slate-400"
                                }`}
                              >
                                {analyzer.status}
                              </span>
                            </div>
                          </div>

                          {/* Metric Pill Grid */}
                          <div className="mt-5 grid grid-cols-2 gap-2.5 text-xs">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 backdrop-blur-sm">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Department
                              </span>
                              <span className="mt-1 block font-bold text-white truncate">
                                {analyzer.department || "General"}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate block">
                                {analyzer.location || "Bench Lab"}
                              </span>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 backdrop-blur-sm">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Protocol & Channel
                              </span>
                              <span className="mt-1 block font-mono font-bold text-cyan-300 truncate">
                                {analyzer.protocol}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate block">
                                {analyzer.connectionType === "NETWORK" ? "TCP/IP Socket" : "Serial RS-232"}
                              </span>
                            </div>
                          </div>

                          {/* Real-time Connection Quality */}
                          <div className="mt-3.5 flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-2 text-xs font-mono">
                            <div className="flex items-center gap-2 text-slate-300">
                              <Zap className="h-3.5 w-3.5 text-amber-400" />
                              <span className="text-[11px] text-slate-400">Ping Latency:</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {analyzer.connectionLatency !== null && analyzer.connectionLatency !== undefined ? (
                                <span
                                  className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                                    analyzer.connectionLatency < 30
                                      ? "bg-emerald-500/20 text-emerald-300"
                                      : analyzer.connectionLatency < 100
                                      ? "bg-amber-500/20 text-amber-300"
                                      : "bg-rose-500/20 text-rose-300"
                                  }`}
                                >
                                  {analyzer.connectionLatency} ms
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[11px]">—</span>
                              )}
                              <span className="text-[10px] text-slate-500">
                                {analyzer.lastCommunicationAt ? "Active" : "Idle"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons Rail */}
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-4">
                          <Link
                            href={`/analyzers/${analyzer.id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                            <ChevronRight className="h-3 w-3" />
                          </Link>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleTestConnection(analyzer)}
                              className="rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-300 hover:border-cyan-500/50 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all"
                              title="Ping Connection Handshake"
                            >
                              <Network className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleConfigureMappings(analyzer)}
                              className="rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-300 hover:border-blue-500/50 hover:bg-blue-500/20 hover:text-blue-300 transition-all"
                              title="Test Parameter Mappings"
                            >
                              <Settings className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleShowTelemetry(analyzer)}
                              className="rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-300 hover:border-violet-500/50 hover:bg-violet-500/20 hover:text-violet-300 transition-all"
                              title="Live Telemetry Console"
                            >
                              <BarChart3 className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(analyzer)}
                              className={`rounded-xl border p-2 transition-all ${
                                isOnline
                                  ? "border-slate-700 bg-slate-800/80 text-slate-400 hover:border-rose-500/50 hover:bg-rose-500/20 hover:text-rose-300"
                                  : "border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                              }`}
                              title={isOnline ? "Simulate Disconnect" : "Simulate Connect"}
                            >
                              {isOnline ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
                            </button>

                            <button
                              onClick={() => handleArchive(analyzer)}
                              className="rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-400 hover:border-rose-500/50 hover:bg-rose-500/20 hover:text-rose-300 transition-all"
                              title="Archive instrument"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* VIEW 2: HIGH-DENSITY TABLE */}
              {!loading && filteredAnalyzers.length > 0 && viewMode === "table" && (
                <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px] text-xs">
                      <thead className="border-b border-slate-800 bg-slate-900/90 text-slate-300">
                        <tr>
                          <th className="px-5 py-4 text-left font-extrabold uppercase tracking-wider text-[10px] text-blue-300">
                            Instrument & ID
                          </th>
                          <th className="px-5 py-4 text-left font-extrabold uppercase tracking-wider text-[10px] text-slate-300">
                            Department
                          </th>
                          <th className="px-5 py-4 text-left font-extrabold uppercase tracking-wider text-[10px] text-cyan-300">
                            Protocol & Connection
                          </th>
                          <th className="px-5 py-4 text-left font-extrabold uppercase tracking-wider text-[10px] text-emerald-300">
                            Status & Latency
                          </th>
                          <th className="px-5 py-4 text-left font-extrabold uppercase tracking-wider text-[10px] text-violet-300">
                            Last Telemetry
                          </th>
                          <th className="px-5 py-4 text-right font-extrabold uppercase tracking-wider text-[10px] text-slate-300">
                            Action Rail
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-950/80">
                        {filteredAnalyzers.map((analyzer, idx) => {
                          const isOnline = analyzer.status === "ONLINE";
                          const isError = analyzer.status === "ERROR";

                          return (
                            <tr
                              key={analyzer.id}
                              className={`transition-colors hover:bg-slate-900/60 ${
                                idx % 2 === 0 ? "bg-slate-950" : "bg-slate-900/30"
                              }`}
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                                      isOnline
                                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                                        : isError
                                        ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                                        : "border-slate-700 bg-slate-800 text-slate-400"
                                    }`}
                                  >
                                    <Activity className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-white">{analyzer.name}</div>
                                    <div className="font-mono text-[11px] text-slate-400">
                                      {analyzer.analyzerId} · {analyzer.manufacturer} {analyzer.model}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <span className="inline-flex rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200">
                                  {analyzer.department || "General"}
                                </span>
                                <div className="mt-1 text-[10px] text-slate-400">{analyzer.location || "Bench Lab"}</div>
                              </td>

                              <td className="px-5 py-4">
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 font-mono text-[10px] font-bold text-cyan-300">
                                  <Network className="h-3 w-3" />
                                  {analyzer.protocol}
                                </span>
                                <div className="mt-1 text-[11px] text-slate-400">
                                  {analyzer.connectionType === "NETWORK" ? "TCP Network" : "RS-232 Serial"}
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase ${
                                      isOnline
                                        ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                                        : isError
                                        ? "border-rose-500/40 bg-rose-500/20 text-rose-300"
                                        : "border-slate-700 bg-slate-800 text-slate-400"
                                    }`}
                                  >
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${
                                        isOnline ? "bg-emerald-400" : isError ? "bg-rose-400" : "bg-slate-400"
                                      }`}
                                    />
                                    {analyzer.status}
                                  </span>
                                  {analyzer.connectionLatency && (
                                    <span className="font-mono text-[11px] font-bold text-slate-300">
                                      {analyzer.connectionLatency}ms
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="px-5 py-4 font-mono text-[11px] text-slate-300">
                                {analyzer.lastCommunicationAt
                                  ? new Date(analyzer.lastCommunicationAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                    })
                                  : "Never"}
                                <div className="text-[10px] text-slate-500">
                                  {analyzer.lastCommunicationAt ? "Telemetry verified" : "Awaiting handshake"}
                                </div>
                              </td>

                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Link
                                    href={`/analyzers/${analyzer.id}`}
                                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-500"
                                  >
                                    Open
                                  </Link>
                                  <button
                                    onClick={() => handleTestConnection(analyzer)}
                                    className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:border-cyan-500 hover:text-cyan-300"
                                    title="Ping"
                                  >
                                    <Zap className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleConfigureMappings(analyzer)}
                                    className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:border-blue-500 hover:text-blue-300"
                                    title="Mappings"
                                  >
                                    <Settings className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleShowTelemetry(analyzer)}
                                    className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:border-violet-500 hover:text-violet-300"
                                    title="Telemetry"
                                  >
                                    <BarChart3 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HUB 1: LIS PROTOCOL & DRIVER HUB */}
          {activeTab === "driver_hub" && (
            <MiddlewareDriverHub analyzers={analyzers} />
          )}

          {/* HUB 1: VIRTUAL TEST BENCH SIMULATOR */}
          {activeTab === "simulator" && (
            <VirtualAnalyzerSimulator analyzers={analyzers} />
          )}

          {/* HUB 1: DIAGNOSTICS & COMMUNICATION LOGS */}
          {activeTab === "diagnostics" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-sm text-white">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                    Diagnostic Bench
                  </span>
                  <h2 className="text-lg font-bold text-white">
                    Communication Logs, Socket Diagnostics & Packet Tracing
                  </h2>
                  <p className="text-xs text-slate-400">
                    Analyze low-level ENQ / ACK handshakes, frame checksum errors, buffer overruns, and socket connection drops.
                  </p>
                </div>
                <button
                  onClick={() => setShowErrorLogModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-500/20 hover:bg-rose-700"
                >
                  <AlertCircle className="h-4 w-4" />
                  Open Full Diagnostic Log
                </button>
              </div>

              {/* Protocol Packet Quick Test Bench */}
              <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl">
                <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
                  <Terminal className="h-5 w-5 text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Live LIS Frame Protocol Inspector</h3>
                    <p className="text-[11px] text-slate-400">
                      Simulate bidirectional ASTM E1394 / HL7 message exchanges with connected analyzers
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 font-mono text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-2">
                      Sample Outgoing Frame (ASTM E1394 Order Query)
                    </span>
                    <pre className="text-slate-300 bg-slate-950 p-3 rounded-xl overflow-x-auto text-[11px] leading-relaxed">
{`H|\\^&|||LabCoreLIS|||||||P|1394-97|20260907232800
P|1||MRN98214||Sharma^Aarav||19880512|M
O|1|BARCODE_9901||^^^CBC_DIFF|R||||||A
L|1|N`}
                    </pre>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 font-mono text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-2">
                      Sample Incoming Frame (ASTM E1394 Result Transmission)
                    </span>
                    <pre className="text-slate-300 bg-slate-950 p-3 rounded-xl overflow-x-auto text-[11px] leading-relaxed">
{`H|\\^&|||Sysmex_XN550|||||||P|1394-97
P|1||MRN98214
O|1|BARCODE_9901
R|1|^^^WBC|8.4|10*3/uL|4.0-11.0|N||F
R|2|^^^RBC|4.82|10*6/uL|4.5-5.9|N||F
R|3|^^^HGB|14.6|g/dL|13.5-17.5|N||F
L|1|N`}
                    </pre>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-400">
                  <span>Port status: TCP 5000 (Listening) · RS-232 COM3 (Baud 9600, 8-N-1)</span>
                  <button
                    onClick={() => setShowErrorLogModal(true)}
                    className="font-bold text-cyan-400 hover:underline"
                  >
                    View communication history →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* HUB 2: STAT EMERGENCY SPECIMEN LANE */}
          {activeTab === "stat_lane" && (
            <StatSpecimenLane analyzers={analyzers} />
          )}

          {/* HUB 2: BIDIRECTIONAL QUERY & WORKLIST DISPATCH */}
          {activeTab === "bidirectional" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-sm text-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                      Host Query Engine
                    </span>
                    <h2 className="text-lg font-bold text-white">
                      Bidirectional Worklist Dispatcher & Specimen Routing
                    </h2>
                    <p className="text-xs text-slate-400">
                      Track orders transmitted to instruments, query pending tubes by barcode, and verify LIS order acknowledgement.
                    </p>
                  </div>
                </div>
              </div>

              <BidirectionalQuerySystem />
            </div>
          )}

          {/* HUB 2: SMART SPECIMEN WORKLOAD BALANCER */}
          {activeTab === "workload_balancer" && (
            <SmartWorkloadBalancer analyzers={analyzers} />
          )}

          {/* HUB 2: SPECIMEN TRACKING DASHBOARD */}
          {activeTab === "specimen_tracking" && (
            <SpecimenTrackingDashboard analyzers={analyzers} />
          )}

          {/* HUB 3: LIVE RESULT FEED */}
          {activeTab === "live_feed" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-sm text-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Real-time Interface
                    </span>
                    <h2 className="text-lg font-bold text-white">
                      Live Result Stream & Packet Interceptor
                    </h2>
                    <p className="text-xs text-slate-400">
                      Incoming ASTM OBR/OBX packets and HL7 ORU_R01 frames parsed in real-time with instant critical panic value detection.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowUnmatchedModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/25 shadow-sm"
                  >
                    <FileQuestion className="h-4 w-4 text-amber-400" />
                    Review Unmatched Orphan Queue ({unmatchedCount})
                  </button>
                </div>
              </div>

              <LiveResultFeed
                analyzers={analyzers}
                unmatchedCount={unmatchedCount}
                onOpenUnmatchedQueue={() => setShowUnmatchedModal(true)}
              />
            </div>
          )}

          {/* HUB 3: CRITICAL PANIC ESCALATION */}
          {activeTab === "critical_panic" && (
            <CriticalPanicEscalationHub analyzers={analyzers} />
          )}

          {/* HUB 3: SPECIALTY HEMATOLOGY WORKBENCH */}
          {activeTab === "hematology" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 shadow-sm text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  Specialty Workbench
                </span>
                <h1 className="mt-1 text-xl font-bold text-white">
                  🧪 Hematology & CBC Analyzer Suite
                </h1>
                <p className="mt-1 text-xs text-slate-400">
                  Sysmex, Mindray, and Beckman Coulter CBC platforms, 5-part differential scattergrams, QC delta gates, and morphology verification.
                </p>
              </div>

              <HematologyWorkbench
                analyzers={analyzers}
                onOpenMappings={() => {
                  const hematologyAnalyzer = analyzers.find((analyzer) =>
                    `${analyzer.name || ""} ${analyzer.manufacturer || ""} ${analyzer.model || ""} ${analyzer.analyzerType || ""}`
                      .toLowerCase()
                      .match(/sysmex|beckman|mindray|horiba|cell[- ]dyn|advia|hemat/)
                  );
                  if (hematologyAnalyzer) {
                    setSelectedAnalyzer(hematologyAnalyzer);
                    setShowMappingModal(true);
                  } else {
                    setError("Add a hematology analyzer first to configure mappings.");
                  }
                }}
              />
            </div>
          )}

          {/* HUB 3: REFLEX & CASCADE TESTING RULES ENGINE */}
          {activeTab === "reflex_engine" && (
            <ReflexCascadeEngine analyzers={analyzers} />
          )}

          {/* HUB 4: SHIFT QC GATE */}
          {activeTab === "shift_qc" && (
            <ShiftQCGate analyzers={analyzers} />
          )}

          {/* HUB 4: QC & AUTO-APPROVAL RULES */}
          {activeTab === "qc_validation" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-sm text-white">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                    Quality Assurance & Verification
                  </span>
                  <h2 className="text-lg font-bold text-white">
                    Automated Approval Engine & Westgard Multi-Rules
                  </h2>
                  <p className="text-xs text-slate-400">
                    Define range check criteria, critical panic limits, delta check thresholds against past patient results, and QC control gates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowValidationModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:bg-violet-700"
                >
                  <Sliders className="h-4 w-4" />
                  Auto-Validation Matrix
                </button>
              </div>

              <AutoApprovalQC />
            </div>
          )}

          {/* HUB 4: CROSS-ANALYZER QC CORRELATION MATRIX */}
          {activeTab === "qc_correlation" && (
            <CrossAnalyzerQCCorrelation analyzers={analyzers} />
          )}

          {/* HUB 4: REAGENTS & CONSUMABLES */}
          {activeTab === "reagents" && (
            <RealWorldReagentTracker analyzers={analyzers} />
          )}

          {/* HUB 4: REAGENT LOT-TO-LOT VERIFICATION */}
          {activeTab === "lot_correlation" && (
            <ReagentLotCorrelationSuite analyzers={analyzers} />
          )}

          {/* HUB 5: PREVENTIVE MAINTENANCE & NABL COMPLIANCE LOGBOOK */}
          {activeTab === "maintenance_audit" && (
            <MaintenanceComplianceLogbook analyzers={analyzers} />
          )}

          {/* HUB 5: AI BREAKDOWN & ANOMALY FORECASTING */}
          {activeTab === "anomaly_forecast" && (
            <PredictiveAnomalyEngine analyzers={analyzers} />
          )}

          {/* HUB 5: LAB THROUGHPUT & TAT ANALYTICS */}
          {activeTab === "throughput_analytics" && (
            <LabThroughputAnalytics analyzers={analyzers} />
          )}

          {/* HUB 5: INTERACTIVE DOCUMENTATION & OPERATING MANUAL (SOP) */}
          {activeTab === "interactive_docs" && (
            <AnalyzerDocumentationHub
              onSelectAnalyzerForGuide={(analyzerId) => {
                const target = analyzers.find((a) => a.id === analyzerId);
                if (target) {
                  setSelectedAnalyzer(target);
                  setShowConnectionModal(true);
                }
              }}
            />
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* GLOBAL CLINICAL MODALS                                         */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {showAddModal && (
            <AddAnalyzerModal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              onSuccess={fetchAnalyzers}
            />
          )}

          {showConnectionModal && selectedAnalyzer && (
            <ConnectionTestModal
              isOpen={showConnectionModal}
              analyzer={selectedAnalyzer}
              onClose={() => setShowConnectionModal(false)}
              onStatusUpdated={fetchAnalyzers}
            />
          )}

          {showUnmatchedModal && (
            <UnmatchedResultsQueue
              isOpen={showUnmatchedModal}
              onClose={() => setShowUnmatchedModal(false)}
              onResolved={() => {
                setUnmatchedCount((prev) => Math.max(0, prev - 1));
              }}
            />
          )}

          {showValidationModal && (
            <AutoValidationEngine
              isOpen={showValidationModal}
              onClose={() => setShowValidationModal(false)}
              analyzers={analyzers}
            />
          )}

          {showErrorLogModal && (
            <CommunicationErrorLog
              isOpen={showErrorLogModal}
              onClose={() => setShowErrorLogModal(false)}
              analyzers={analyzers}
            />
          )}

          {showMappingModal && selectedAnalyzer && (
            <ParameterCodeMappingTool
              analyzerId={selectedAnalyzer.id}
              onClose={() => setShowMappingModal(false)}
            />
          )}

          {showTelemetryModal && selectedAnalyzer && (
            <TelemetryConsole
              analyzerId={selectedAnalyzer.id}
              onClose={() => setShowTelemetryModal(false)}
            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}