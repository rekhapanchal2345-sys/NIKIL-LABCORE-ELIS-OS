"use client";

import { useState, useEffect, useRef, useDeferredValue } from "react";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { sampleApi } from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { 
  Activity, AlertTriangle, ClipboardList, Download, History, 
  RefreshCw, Sparkles, X, CheckCircle2, Loader2, PackageCheck, 
  Printer, ScanLine, UserCheck, ShieldCheck, Clock, Clock3, 
  MapPin, FlaskConical, UserRound, Search, SlidersHorizontal, 
  ArrowUpDown, RotateCcw, LayoutGrid, Table as TableIcon, 
  Snowflake, Flame, Layers, Eye, ShieldAlert, ArrowRight, 
  Building2, CheckSquare, Square, FileText, ChevronRight,
  Stethoscope, Volume2, Gauge, TestTube2, AlertCircle,
  TrendingUp, Award, Droplet, Bed, Timer
} from "lucide-react";
import SampleLabelPrint from "@/components/samples/SampleLabelPrint";
import SampleTrackModal from "@/components/samples/SampleTrackModal";
import SampleAuditModal from "@/components/samples/SampleAuditModal";
import SampleCollectModal from "@/components/samples/SampleCollectModal";
import SampleRejectModal from "@/components/samples/SampleRejectModal";
import SampleKanbanBoard from "@/components/samples/SampleKanbanBoard";
import SampleStorageRack from "@/components/samples/SampleStorageRack";
import SampleStatCenter from "@/components/samples/SampleStatCenter";
import SampleQuickDrawer from "@/components/samples/SampleQuickDrawer";
import SampleOrderOfDrawGuide from "@/components/samples/SampleOrderOfDrawGuide";
import SampleHILQualityChecker from "@/components/samples/SampleHILQualityChecker";
import SampleRedrawRegister from "@/components/samples/SampleRedrawRegister";
import SampleWardDispatch from "@/components/samples/SampleWardDispatch";

export interface Sample {
  id: string;
  sampleNumber: string;
  barcode: string;
  patientId: string;
  orderId: string;
  testId: string;
  sampleType: string;
  status: string;
  collectedById?: string;
  collectedBy?: {
    id: string;
    employeeCode: string;
    fullName: string;
  };
  collectionType?: string;
  priority?: string;
  collectedAt?: string;
  receivedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    orderNumber: string;
    barcode: string;
    patient: {
      id: string;
      uhid: string;
      firstName: string;
      lastName: string;
      gender: string;
      dateOfBirth?: string;
      age?: number;
      phone?: string;
    };
    doctor?: {
      id: string;
      doctorCode: string;
      fullName: string;
      specialization: string;
    };
  };
  test: {
    id: string;
    testCode: string;
    testName: string;
    sampleType: string;
    sampleContainer: string;
    processingDepartment?: string;
  };
}

const TUBE_CONTAINER_COLORS: Record<string, { bg: string; text: string; border: string; capColor: string; name: string }> = {
  "EDTA Tube": { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", capColor: "#8B5CF6", name: "Lavender EDTA" },
  "Lavender Top": { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", capColor: "#8B5CF6", name: "Lavender EDTA" },
  "Serum Separator Tube": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", capColor: "#F59E0B", name: "Gold SST Gel" },
  "SST": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", capColor: "#F59E0B", name: "Gold SST Gel" },
  "Red Top": { bg: "bg-red-50", text: "text-red-800", border: "border-red-200", capColor: "#EF4444", name: "Red Plain Serum" },
  "Sodium Citrate": { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", name: "Light Blue Citrate" },
  "Light Blue": { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", name: "Light Blue Citrate" },
  "Lithium Heparin": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", capColor: "#10B981", name: "Green Heparin" },
  "Green Top": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", capColor: "#10B981", name: "Green Heparin" },
  "Fluoride Tube": { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", capColor: "#64748B", name: "Grey Fluoride" },
  "Grey Top": { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", capColor: "#64748B", name: "Grey Fluoride" },
  "Sterile Container": { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200", capColor: "#EAB308", name: "Urine Sterile Cup" },
};

function getContainerStyle(containerName?: string) {
  if (!containerName) return { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", name: "Standard Specimen" };
  for (const [key, val] of Object.entries(TUBE_CONTAINER_COLORS)) {
    if (containerName.toLowerCase().includes(key.toLowerCase())) {
      return val;
    }
  }
  return { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", name: containerName };
}

// Synthesize authentic laser gun scanner beep via Web Audio API
function playBarcodeBeep(success = true) {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (success) {
      // Crisp 2-tone pleasant clinical barcode chirp
      osc.type = "sine";
      osc.frequency.setValueAtTime(1900, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2600, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else {
      // Low warning error buzzer
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    // Ignore audio permission/context errors
  }
}

export default function SamplesPage() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Clinical Workstation View Tab
  const [workstationTab, setWorkstationTab] = useState<
    "worklist" | "kanban" | "scanner" | "storage" | "stat" | "ward-dispatch" | "order-of-draw" | "hil-quality" | "redraws"
  >("worklist");

  // Clinical Station Selector
  const [activeStation, setActiveStation] = useState("Main Central Hospital Lab — Accession Desk");

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sampleTypeFilter, setSampleTypeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [queueView, setQueueView] = useState<"all" | "action" | "priority" | "overdue" | "completed" | "rejected">("all");
  const [slaHours, setSlaHours] = useState(4);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Barcode scanner station
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState<"receive" | "lookup">("receive");
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<{ barcode: string; result: string; at: string; success: boolean }[]>([]);
  const [scanSessionStarted] = useState(() => new Date());
  const [scanErrorCount, setScanErrorCount] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Multi-Select Bulk Actions
  const [selectedSamples, setSelectedSamples] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, label: "" });

  // Quick Slide-Over Drawer Sample
  const [drawerSample, setDrawerSample] = useState<Sample | null>(null);

  // Modals
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingSampleId, setRejectingSampleId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printPreviewType, setPrintPreviewType] = useState<"label" | "collection-sheet">("label");
  const [previewSample, setPreviewSample] = useState<Sample | null>(null);

  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectingSample, setCollectingSample] = useState<Sample | null>(null);
  const [collectionError, setCollectionError] = useState("");

  const [trackingSample, setTrackingSample] = useState<Sample | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<any[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const [workflowAction, setWorkflowAction] = useState<"receive" | "process" | "complete" | null>(null);
  const [workflowSample, setWorkflowSample] = useState<Sample | null>(null);
  const [workflowLocation, setWorkflowLocation] = useState("Laboratory Reception");
  const [workflowNotes, setWorkflowNotes] = useState("");
  const [integrityChecks, setIntegrityChecks] = useState({ label: false, container: false, volume: false });
  const [updatingSampleId, setUpdatingSampleId] = useState<string | null>(null);

  const fetchSamples = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sampleApi.getAll();
      if (response.success && response.data) {
        const samplesData = response.data.samples || response.data || [];
        setSamples(Array.isArray(samplesData) ? samplesData : []);
      }
    } catch (err) {
      console.error("Error fetching samples:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch samples");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = window.setInterval(fetchSamples, 30000);
    return () => window.clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    const handleScannerShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        focusScanner();
      }
    };
    window.addEventListener("keydown", handleScannerShortcut);
    return () => window.removeEventListener("keydown", handleScannerShortcut);
  }, []);

  const focusScanner = () => {
    setWorkstationTab("scanner");
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  };

  // Filter & Search Logic
  useEffect(() => {
    let filtered = [...samples];

    if (deferredSearchTerm) {
      const term = deferredSearchTerm.toLowerCase();
      filtered = filtered.filter(sample =>
        sample.sampleNumber.toLowerCase().includes(term) ||
        sample.barcode.toLowerCase().includes(term) ||
        sample.order.orderNumber.toLowerCase().includes(term) ||
        `${sample.order.patient.firstName} ${sample.order.patient.lastName}`.toLowerCase().includes(term) ||
        sample.order.patient.uhid.toLowerCase().includes(term) ||
        sample.test.testName.toLowerCase().includes(term) ||
        sample.test.testCode.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(sample => sample.status === statusFilter);
    }

    if (sampleTypeFilter !== "all") {
      filtered = filtered.filter(sample => sample.sampleType === sampleTypeFilter);
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter(sample => sample.test.processingDepartment === departmentFilter);
    }

    if (queueView === "action") {
      filtered = filtered.filter(sample => ["PENDING", "COLLECTED", "RECEIVED", "PROCESSING"].includes(sample.status));
    } else if (queueView === "priority") {
      filtered = filtered.filter(sample => sample.priority === "STAT" || sample.priority === "URGENT");
    } else if (queueView === "overdue") {
      filtered = filtered.filter(sample => !["COMPLETED", "REJECTED"].includes(sample.status) && Date.now() - new Date(sample.createdAt).getTime() > slaHours * 60 * 60 * 1000);
    } else if (queueView === "completed") {
      filtered = filtered.filter(sample => sample.status === "COMPLETED");
    } else if (queueView === "rejected") {
      filtered = filtered.filter(sample => sample.status === "REJECTED");
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "sampleNumber":
          comparison = a.sampleNumber.localeCompare(b.sampleNumber);
          break;
        case "patient":
          comparison = `${a.order.patient.firstName} ${a.order.patient.lastName}`.localeCompare(
            `${b.order.patient.firstName} ${b.order.patient.lastName}`
          );
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredSamples(filtered);
    setCurrentPage(1);
  }, [samples, deferredSearchTerm, statusFilter, sampleTypeFilter, departmentFilter, sortBy, sortOrder, queueView, slaHours]);

  // Metrics Calculation
  const metrics = {
    pending: samples.filter(s => s.status === 'PENDING').length,
    collected: samples.filter(s => s.status === 'COLLECTED').length,
    received: samples.filter(s => s.status === 'RECEIVED').length,
    processing: samples.filter(s => s.status === 'PROCESSING').length,
    completed: samples.filter(s => s.status === 'COMPLETED').length,
    rejected: samples.filter(s => s.status === 'REJECTED').length,
  };

  const activeSamples = samples.filter(s => !["COMPLETED", "REJECTED"].includes(s.status));
  const statCount = samples.filter(s => (s.priority === "STAT" || s.priority === "URGENT") && s.status !== "COMPLETED").length;
  const overdueSamples = activeSamples.filter(sample =>
    Date.now() - new Date(sample.createdAt).getTime() > slaHours * 60 * 60 * 1000
  );
  const completionRate = samples.length
    ? Math.round((samples.filter(s => s.status === "COMPLETED").length / samples.length) * 100)
    : 0;

  // Pagination
  const totalPages = Math.ceil(filteredSamples.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSamples = filteredSamples.slice(startIndex, startIndex + itemsPerPage);

  // Workflow Handlers
  const handleAdvanceStatus = async (sample: Sample, nextStatus: string) => {
    try {
      setUpdatingSampleId(sample.id);
      if (nextStatus === "COLLECTED") {
        setCollectingSample(sample);
        setShowCollectModal(true);
        return;
      }
      if (nextStatus === "RECEIVED") {
        setWorkflowSample(sample);
        setWorkflowAction("receive");
        setIntegrityChecks({ label: false, container: false, volume: false });
        return;
      }
      if (nextStatus === "PROCESSING") {
        await sampleApi.process(sample.id, "Main Clinical Analyzer Array");
      } else if (nextStatus === "COMPLETED") {
        await sampleApi.complete(sample.id, "Diagnostic Signoff Desk");
      }
      await fetchSamples();
    } catch (e) {
      console.error("Status advance error:", e);
    } finally {
      setUpdatingSampleId(null);
    }
  };

  const handleConfirmWorkflowAction = async () => {
    if (!workflowSample) return;
    try {
      setUpdatingSampleId(workflowSample.id);
      await sampleApi.receive(workflowSample.id, {
        location: workflowLocation,
        notes: workflowNotes,
        integrityChecklist: integrityChecks,
      });
      playBarcodeBeep(true);
      setWorkflowAction(null);
      setWorkflowSample(null);
      await fetchSamples();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingSampleId(null);
    }
  };

  const handleConfirmCollection = async (data: any) => {
    if (!collectingSample) return;
    try {
      setUpdatingSampleId(collectingSample.id);
      await sampleApi.collect(collectingSample.id, data);
      playBarcodeBeep(true);
      setShowCollectModal(false);
      setCollectingSample(null);
      await fetchSamples();
    } catch (err) {
      setCollectionError(err instanceof Error ? err.message : "Failed to record collection.");
    } finally {
      setUpdatingSampleId(null);
    }
  };

  const handleRejectSample = async (reason: string, redrawRequired: boolean, urgency: string) => {
    if (!rejectingSampleId) return;
    try {
      setRejecting(true);
      await sampleApi.reject(rejectingSampleId, {
        rejectionReason: reason,
        redrawRequired,
        urgency,
      });
      playBarcodeBeep(false);
      setShowRejectModal(false);
      setRejectingSampleId(null);
      await fetchSamples();
    } catch (err) {
      setRejectionError(err instanceof Error ? err.message : "Failed to reject specimen.");
    } finally {
      setRejecting(false);
    }
  };

  const handleBarcodeScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim().toUpperCase();
    if (!code) return;

    setScanning(true);
    setScanMessage(null);

    const found = samples.find(
      s => s.barcode.toUpperCase() === code || s.sampleNumber.toUpperCase() === code
    );

    if (!found) {
      playBarcodeBeep(false);
      setScanMessage(`Specimen with barcode "${code}" not found in accession registry.`);
      setScanErrorCount(prev => prev + 1);
      setScanHistory(prev => [{ barcode: code, result: "Specimen Not Found", at: new Date().toLocaleTimeString(), success: false }, ...prev.slice(0, 9)]);
      setScanning(false);
      return;
    }

    if (scanMode === "lookup") {
      playBarcodeBeep(true);
      setDrawerSample(found);
      setScanCount(prev => prev + 1);
      setScanHistory(prev => [{ barcode: code, result: `Lookup: ${found.test.testName}`, at: new Date().toLocaleTimeString(), success: true }, ...prev.slice(0, 9)]);
      setBarcodeInput("");
      setScanning(false);
      return;
    }

    // Auto-Receive Mode
    try {
      await sampleApi.receive(found.id, {
        location: "Central Reception Bay",
        notes: "Auto-accessioned via high-speed laser gun bay",
      });
      playBarcodeBeep(true);
      setScanCount(prev => prev + 1);
      setScanMessage(`Success: ${found.sampleNumber} (${found.test.testName}) received into Central Laboratory.`);
      setScanHistory(prev => [{ barcode: code, result: `Received: ${found.sampleNumber}`, at: new Date().toLocaleTimeString(), success: true }, ...prev.slice(0, 9)]);
      setBarcodeInput("");
      await fetchSamples();
    } catch (err) {
      playBarcodeBeep(false);
      setScanErrorCount(prev => prev + 1);
      setScanMessage(`Failed to receive specimen: ${err instanceof Error ? err.message : "API Error"}`);
    } finally {
      setScanning(false);
    }
  };

  // Bulk Multi-Select Handlers
  const handleSelectSample = (id: string) => {
    setSelectedSamples(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedSamples.size === currentSamples.length && currentSamples.length > 0) {
      setSelectedSamples(new Set());
    } else {
      setSelectedSamples(new Set(currentSamples.map(s => s.id)));
    }
  };

  const handleBulkReceive = async () => {
    const eligible = samples.filter(s => selectedSamples.has(s.id) && s.status === "COLLECTED");
    if (eligible.length === 0) return;
    setBulkProcessing(true);
    setBulkProgress({ done: 0, total: eligible.length, label: "Receiving specimens into Lab" });
    for (let i = 0; i < eligible.length; i++) {
      try {
        await sampleApi.receive(eligible[i].id, { location: "Central Reception Bay" });
      } catch (e) {}
      setBulkProgress({ done: i + 1, total: eligible.length, label: "Receiving specimens into Lab" });
    }
    playBarcodeBeep(true);
    setBulkProcessing(false);
    setSelectedSamples(new Set());
    await fetchSamples();
  };

  const handleBulkProcess = async () => {
    const eligible = samples.filter(s => selectedSamples.has(s.id) && s.status === "RECEIVED");
    if (eligible.length === 0) return;
    setBulkProcessing(true);
    setBulkProgress({ done: 0, total: eligible.length, label: "Routing to Analyzer Bays" });
    for (let i = 0; i < eligible.length; i++) {
      try {
        await sampleApi.process(eligible[i].id, "Main Analyzer Array");
      } catch (e) {}
      setBulkProgress({ done: i + 1, total: eligible.length, label: "Routing to Analyzer Bays" });
    }
    playBarcodeBeep(true);
    setBulkProcessing(false);
    setSelectedSamples(new Set());
    await fetchSamples();
  };

  const handleExportCsv = () => {
    const headers = ["Sample ID", "Barcode", "Patient UHID", "Patient Name", "Test Code", "Test Name", "Matrix", "Container", "Priority", "Status", "Accessioned At"];
    const rows = filteredSamples.map(s => [
      s.sampleNumber,
      s.barcode,
      s.order.patient.uhid,
      `"${s.order.patient.firstName} ${s.order.patient.lastName}"`,
      s.test.testCode,
      `"${s.test.testName}"`,
      s.sampleType,
      `"${s.test.sampleContainer}"`,
      s.priority || "ROUTINE",
      s.status,
      s.createdAt,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LABCORE_Clinical_Specimen_Manifest_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout title="Specimen Accession & Laboratory Management">
        <div className="space-y-6 pb-12">
          {/* Hospital & Diagnostic Pathology Brand Header (Light White Professional Theme) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3.5">
                {/* Hospital Logo Emblem & Institution Identity */}
                <div className="flex items-start gap-4">
                  {/* High-end Hospital & Pathology Emblem */}
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 text-white shadow-md shadow-sky-600/20 ring-4 ring-sky-50">
                    <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/25 to-transparent" />
                    <div className="relative flex flex-col items-center justify-center">
                      <div className="flex items-center gap-0.5">
                        <FlaskConical className="h-5 w-5 stroke-[2.2]" />
                        <Activity className="h-4 w-4 stroke-[2.5] text-sky-200" />
                      </div>
                      <span className="text-[8px] font-black tracking-widest text-sky-100 uppercase mt-0.5">LAB</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-widest text-sky-700">
                        LabCore Diagnostics &amp; Super-Specialty Hospital LIS
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" /> NABL MC-4192
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                        <Award className="h-3 w-3 text-purple-600" /> CAP #892104
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                        <Droplet className="h-3 w-3 text-sky-600" /> CLSI GP41 Compliant
                      </span>
                    </div>

                    <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl mt-0.5">
                      Specimen Accession &amp; Pre-Analytical Lifecycle Center
                    </h1>

                    <p className="text-xs text-slate-500 max-w-3xl leading-relaxed mt-0.5">
                      Division of Laboratory Medicine &amp; Clinical Pathology · Bi-directional Analyzer LIS Interface, Automated Order-of-Draw &amp; Hospital Inpatient Ward Dispatch.
                    </p>
                  </div>
                </div>

                {/* Station Switcher & Shift Telemetry Controls */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                  {/* Interactive Hospital Station Switcher */}
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-700 shadow-2xs">
                    <Building2 className="h-4 w-4 text-sky-600 shrink-0" />
                    <span className="text-slate-500 font-bold text-[11px] uppercase">Station:</span>
                    <select
                      value={activeStation}
                      onChange={(e) => setActiveStation(e.target.value)}
                      className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer text-xs"
                    >
                      <option>🏥 Main Central Pathology Laboratory (Tower A, Level 1)</option>
                      <option>🩺 OPD Specimen Collection Bay 1 &amp; 2 (Ground Floor)</option>
                      <option>🚑 Emergency &amp; Trauma Center 24×7 STAT Counter</option>
                      <option>🔬 Molecular Diagnostics &amp; PCR Core (Cleanroom B)</option>
                      <option>❄️ Cold-Chain Bio-Bank Vault (-80°C / -20°C)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold shadow-2xs">
                    <UserRound className="h-3.5 w-3.5 text-emerald-600" />
                    <span>On-Duty: <strong>Sarah Johnson (Sr. Phleb) · Shift A</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold shadow-2xs">
                    <Snowflake className="h-3.5 w-3.5 text-sky-600" />
                    <span>Cold Chain: <strong className="text-emerald-700 font-mono">3.8°C</strong> (2–8°C Optimal)</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold shadow-2xs">
                    <Timer className="h-3.5 w-3.5 text-amber-600" />
                    <span>Tourniquet Safety: <strong className="text-slate-900">99.8% &lt;60s</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Hub */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setAutoRefresh(v => !v)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all shadow-sm ${
                    autoRefresh
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${autoRefresh ? "animate-spin text-emerald-600" : "text-slate-400"}`} />
                  Live Sync {autoRefresh ? "ON (30s)" : "OFF"}
                </button>

                <button
                  onClick={focusScanner}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-sm hover:from-sky-500 hover:to-blue-500 transition-all"
                >
                  <ScanLine className="h-4 w-4" /> Barcode Gun (Ctrl+K)
                </button>

                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" /> Export Manifest
                </button>
              </div>
            </div>

            {/* Real-Time Clinical KPI Strip */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 border-t border-slate-100 pt-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition-all hover:bg-white hover:border-sky-300 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Queue</span>
                  <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                </div>
                <p className="mt-1 text-2xl font-black text-slate-900">{activeSamples.length}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">In-flight specimens</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition-all hover:bg-white hover:border-amber-300 hover:shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Phlebotomy Due</span>
                <p className="mt-1 text-2xl font-black text-slate-900">{metrics.pending}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Awaiting collection</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition-all hover:bg-white hover:border-indigo-300 hover:shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Central Lab Recv</span>
                <p className="mt-1 text-2xl font-black text-slate-900">{metrics.received}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">QC passed &amp; logged</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition-all hover:bg-white hover:border-purple-300 hover:shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">On Analyzers</span>
                <p className="mt-1 text-2xl font-black text-slate-900">{metrics.processing}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Processing test runs</p>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 transition-all hover:bg-white hover:border-rose-300 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">STAT / Critical</span>
                  {statCount > 0 && <Flame className="h-3.5 w-3.5 text-rose-600 fill-rose-600 animate-bounce" />}
                </div>
                <p className="mt-1 text-2xl font-black text-rose-950">{statCount}</p>
                <p className="text-[10px] text-rose-700 mt-0.5 font-bold">Sub-2h priority</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition-all hover:bg-white hover:border-emerald-300 hover:shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Completed Today</span>
                <p className="mt-1 text-2xl font-black text-slate-900">{metrics.completed}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{completionRate}% compliance</p>
              </div>
            </div>
          </div>

          {/* Master Workstation Mode Tabs (Clean Clinical Pills) */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setWorkstationTab("worklist")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                  workstationTab === "worklist"
                    ? "bg-sky-600 text-white shadow-sky-600/20"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>1. Clinical Worklist</span>
                <span className={`rounded-full px-2 py-0.2 text-[10px] font-mono ${workstationTab === "worklist" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700 font-bold"}`}>
                  {filteredSamples.length}
                </span>
              </button>

              <button
                onClick={() => setWorkstationTab("kanban")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                  workstationTab === "kanban"
                    ? "bg-sky-600 text-white shadow-sky-600/20"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>2. Stage Kanban Board</span>
              </button>

              <button
                onClick={() => setWorkstationTab("scanner")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                  workstationTab === "scanner"
                    ? "bg-sky-600 text-white shadow-sky-600/20"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <ScanLine className="h-3.5 w-3.5" />
                <span>3. Barcode Reception Bay</span>
                {scanCount > 0 && (
                  <span className="rounded-full bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                    +{scanCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setWorkstationTab("storage")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                  workstationTab === "storage"
                    ? "bg-sky-600 text-white shadow-sky-600/20"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Snowflake className="h-3.5 w-3.5" />
                <span>4. Cold Chain &amp; Bio-Bank</span>
              </button>

              <button
                onClick={() => setWorkstationTab("stat")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                  workstationTab === "stat"
                    ? "bg-rose-600 text-white shadow-rose-600/20"
                    : "border border-rose-200 bg-rose-50/60 text-rose-800 hover:bg-rose-100"
                }`}
              >
                <Flame className="h-3.5 w-3.5 fill-rose-600" />
                <span>5. STAT Emergency Desk</span>
                {statCount > 0 && (
                  <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
                    {statCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setWorkstationTab("ward-dispatch")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                  workstationTab === "ward-dispatch"
                    ? "bg-sky-600 text-white shadow-sky-600/20"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Bed className="h-3.5 w-3.5" />
                <span>6. Inpatient Ward Phlebotomy Runner</span>
              </button>

              <button
                onClick={() => setWorkstationTab("order-of-draw")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                  workstationTab === "order-of-draw"
                    ? "bg-sky-600 text-white shadow-sky-600/20"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Gauge className="h-3.5 w-3.5" />
                <span>7. Order of Draw &amp; Centrifugation</span>
              </button>

              <button
                onClick={() => setWorkstationTab("hil-quality")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                  workstationTab === "hil-quality"
                    ? "bg-sky-600 text-white shadow-sky-600/20"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <FlaskConical className="h-3.5 w-3.5" />
                <span>8. HIL Serum Quality Index</span>
              </button>

              <button
                onClick={() => setWorkstationTab("redraws")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                  workstationTab === "redraws"
                    ? "bg-rose-600 text-white shadow-rose-600/20"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>9. Redraw &amp; Rejection Desk</span>
                {metrics.rejected > 0 && (
                  <span className="rounded-full bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.2 text-[9px] font-bold">
                    {metrics.rejected}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* TAB 1: MASTER CLINICAL WORKLIST TABLE */}
          {workstationTab === "worklist" && (
            <div className="space-y-5">
              {/* Quick Filter Bar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {([
                      ["all", "All Specimens", samples.length],
                      ["action", "Needs Action", activeSamples.length],
                      ["priority", "STAT / Urgent", statCount],
                      ["overdue", "SLA Watch", overdueSamples.length],
                      ["completed", "Completed", metrics.completed],
                      ["rejected", "Redraws", metrics.rejected],
                    ] as const).map(([val, label, count]) => (
                      <button
                        key={val}
                        onClick={() => setQueueView(val)}
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                          queueView === val
                            ? "bg-sky-50 text-sky-800 border border-sky-300 shadow-sm"
                            : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span>{label}</span>
                        <span className={`rounded-md px-1.5 py-0.2 font-mono text-[10px] font-black ${
                          queueView === val ? "bg-sky-200 text-sky-900" : "bg-slate-200 text-slate-700"
                        }`}>
                          {count}
                        </span>
                      </button>
                    ))}
                  </div>

                  <span className="text-xs text-slate-500 font-medium">
                    Showing <strong>{filteredSamples.length}</strong> of {samples.length} accessioned specimens
                  </span>
                </div>

                {/* Smart Filter Inputs */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="relative lg:col-span-2">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-600" />
                    <input
                      type="text"
                      placeholder="Search Sample ID, Barcode, UHID, Patient, Test..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all font-medium"
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-sky-500 focus:bg-white transition-all font-medium"
                    >
                      <option value="all">All Stages</option>
                      <option value="PENDING">Pending Phlebotomy</option>
                      <option value="COLLECTED">Collected (In-Transit)</option>
                      <option value="RECEIVED">Received in Lab</option>
                      <option value="PROCESSING">Processing / In-Analyzer</option>
                      <option value="COMPLETED">Completed &amp; Validated</option>
                      <option value="REJECTED">Rejected / Redraw</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={sampleTypeFilter}
                      onChange={(e) => setSampleTypeFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-sky-500 focus:bg-white transition-all font-medium"
                    >
                      <option value="all">All Specimen Matrices</option>
                      <option value="BLOOD">Whole Blood</option>
                      <option value="SERUM">Serum</option>
                      <option value="PLASMA">Plasma</option>
                      <option value="URINE">Urine</option>
                      <option value="SWAB">Swab</option>
                      <option value="TISSUE">Tissue Biopsy</option>
                      <option value="OTHER">Other Specimen</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-sky-500 focus:bg-white transition-all font-medium"
                    >
                      <option value="createdAt">Sort: Date Accessioned</option>
                      <option value="sampleNumber">Sort: Sample ID</option>
                      <option value="patient">Sort: Patient Name</option>
                      <option value="status">Sort: Workflow Status</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bulk Operations Toolbar (When Samples Selected) */}
              {selectedSamples.size > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sky-300 bg-sky-50/70 p-4 shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white font-black text-sm shadow-sm">
                      {selectedSamples.size}
                    </span>
                    <div>
                      <p className="text-xs font-black text-slate-900">Selected for Batch Laboratory Processing</p>
                      <p className="text-[10px] text-slate-500">Perform bulk clinical actions across selected specimens</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleBulkReceive}
                      disabled={bulkProcessing}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-black text-white shadow-sm hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50"
                    >
                      <PackageCheck className="h-4 w-4" /> Batch Receive in Lab
                    </button>

                    <button
                      onClick={handleBulkProcess}
                      disabled={bulkProcessing}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-3.5 py-2 text-xs font-black text-white shadow-sm hover:from-sky-500 hover:to-blue-500 transition-all disabled:opacity-50"
                    >
                      <Activity className="h-4 w-4" /> Route to Analyzers
                    </button>

                    <button
                      onClick={() => setSelectedSamples(new Set())}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              )}

              {/* Master Clinical Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-16 text-slate-500 space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
                    <p className="text-xs font-bold text-slate-600">Querying laboratory specimen records...</p>
                  </div>
                ) : filteredSamples.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-16 text-slate-500 space-y-3">
                    <FlaskConical className="h-10 w-10 text-slate-300" />
                    <p className="text-sm font-bold text-slate-800">No matching specimens found</p>
                    <p className="text-xs text-slate-400">Try adjusting your search terms or active filters</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-600">
                        <tr>
                          <th className="px-5 py-3.5 w-10">
                            <input
                              type="checkbox"
                              checked={selectedSamples.size === currentSamples.length && currentSamples.length > 0}
                              onChange={handleSelectAll}
                              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-0 cursor-pointer"
                            />
                          </th>
                          <th className="px-5 py-3.5">Sample ID / Barcode</th>
                          <th className="px-5 py-3.5">Patient Demographics</th>
                          <th className="px-5 py-3.5">Test Profile</th>
                          <th className="px-5 py-3.5">Tube &amp; Matrix</th>
                          <th className="px-5 py-3.5">Status &amp; Stage</th>
                          <th className="px-5 py-3.5">Timeline</th>
                          <th className="px-5 py-3.5 text-right">Workflow Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {currentSamples.map((sample) => {
                          const tube = getContainerStyle(sample.test.sampleContainer);
                          const isStat = sample.priority === "STAT" || sample.priority === "URGENT";
                          const isUpdating = updatingSampleId === sample.id;

                          return (
                            <tr
                              key={sample.id}
                              className={`group transition-all duration-150 hover:bg-slate-50/70 ${
                                isStat ? "bg-rose-50/20" : ""
                              }`}
                            >
                              <td className="px-5 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedSamples.has(sample.id)}
                                  onChange={() => handleSelectSample(sample.id)}
                                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-0 cursor-pointer"
                                />
                              </td>

                              {/* Sample ID & Barcode */}
                              <td className="px-5 py-4">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => setDrawerSample(sample)}
                                      className="font-mono text-xs font-black text-slate-900 hover:text-sky-600 transition-colors"
                                    >
                                      {sample.sampleNumber}
                                    </button>
                                    {isStat && (
                                      <span className="rounded bg-rose-600 px-1.5 py-0.2 text-[8px] font-black uppercase text-white shadow-sm">
                                        STAT
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-mono text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                                    <ScanLine className="h-3 w-3 text-sky-600" /> {sample.barcode}
                                  </p>
                                  <p className="text-[10px] text-slate-400">Order #{sample.order.orderNumber}</p>
                                </div>
                              </td>

                              {/* Patient Demographics */}
                              <td className="px-5 py-4">
                                <div className="space-y-0.5">
                                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <UserRound className="h-3.5 w-3.5 text-sky-600" />
                                    {sample.order.patient.firstName} {sample.order.patient.lastName}
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    UHID: <span className="font-mono text-slate-800 font-bold">{sample.order.patient.uhid}</span>
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {sample.order.patient.age || "—"} yrs · {sample.order.patient.gender}
                                  </p>
                                </div>
                              </td>

                              {/* Test Profile */}
                              <td className="px-5 py-4">
                                <div className="space-y-1">
                                  <p className="font-bold text-slate-900">{sample.test.testName}</p>
                                  <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                                    {sample.test.testCode}
                                  </span>
                                  <p className="text-[10px] text-slate-400 font-medium">{sample.test.processingDepartment || "Core Lab"}</p>
                                </div>
                              </td>

                              {/* Tube & Container Matrix */}
                              <td className="px-5 py-4">
                                <div className="space-y-1">
                                  <div
                                    className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold shadow-sm"
                                    style={{
                                      borderColor: `${tube.capColor}55`,
                                      backgroundColor: `${tube.capColor}15`,
                                      color: tube.capColor,
                                    }}
                                  >
                                    <span
                                      className="h-2 w-2 rounded-full shadow-inner"
                                      style={{ backgroundColor: tube.capColor }}
                                    />
                                    <span>{sample.test.sampleContainer || sample.sampleType}</span>
                                  </div>
                                  <p className="text-[10px] font-medium text-slate-500">{sample.sampleType}</p>
                                </div>
                              </td>

                              {/* Status & Stage */}
                              <td className="px-5 py-4">
                                <div className="space-y-1">
                                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase ${
                                    sample.status === "COMPLETED" ? "border-emerald-300 bg-emerald-50 text-emerald-800" :
                                    sample.status === "PROCESSING" ? "border-purple-300 bg-purple-50 text-purple-800" :
                                    sample.status === "RECEIVED" ? "border-sky-300 bg-sky-50 text-sky-800" :
                                    sample.status === "COLLECTED" ? "border-indigo-300 bg-indigo-50 text-indigo-800" :
                                    sample.status === "REJECTED" ? "border-rose-300 bg-rose-50 text-rose-800" :
                                    "border-amber-300 bg-amber-50 text-amber-800"
                                  }`}>
                                    {sample.status}
                                  </span>
                                  {sample.rejectionReason && (
                                    <p className="text-[10px] text-rose-600 font-bold">{sample.rejectionReason}</p>
                                  )}
                                </div>
                              </td>

                              {/* Timeline */}
                              <td className="px-5 py-4 text-[10px] text-slate-500">
                                <div className="space-y-0.5">
                                  <span className="flex items-center gap-1 font-medium">
                                    <Clock3 className="h-3 w-3 text-slate-400" />
                                    {new Date(sample.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                                    {new Date(sample.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                  {sample.collectedBy && (
                                    <p className="text-slate-400">Phleb: {sample.collectedBy.fullName}</p>
                                  )}
                                </div>
                              </td>

                              {/* Workflow Actions */}
                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {sample.status === "PENDING" && (
                                    <button
                                      onClick={() => handleAdvanceStatus(sample, "COLLECTED")}
                                      disabled={isUpdating}
                                      className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-[11px] font-black text-white shadow-sm hover:from-amber-400 hover:to-orange-400 transition-all"
                                    >
                                      Collect
                                    </button>
                                  )}
                                  {sample.status === "COLLECTED" && (
                                    <button
                                      onClick={() => handleAdvanceStatus(sample, "RECEIVED")}
                                      disabled={isUpdating}
                                      className="rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-3 py-1.5 text-[11px] font-black text-white shadow-sm hover:from-sky-500 hover:to-blue-500 transition-all"
                                    >
                                      Receive
                                    </button>
                                  )}
                                  {sample.status === "RECEIVED" && (
                                    <button
                                      onClick={() => handleAdvanceStatus(sample, "PROCESSING")}
                                      disabled={isUpdating}
                                      className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 text-[11px] font-black text-white shadow-sm hover:from-purple-500 hover:to-indigo-500 transition-all"
                                    >
                                      Process
                                    </button>
                                  )}
                                  {sample.status === "PROCESSING" && (
                                    <button
                                      onClick={() => handleAdvanceStatus(sample, "COMPLETED")}
                                      disabled={isUpdating}
                                      className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-[11px] font-black text-white shadow-sm hover:from-emerald-500 hover:to-teal-500 transition-all"
                                    >
                                      Validate
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      setPreviewSample(sample);
                                      setPrintPreviewType("label");
                                      setShowPrintPreview(true);
                                    }}
                                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-sky-600 shadow-sm transition-colors"
                                    title="Print Barcode Tube Label"
                                  >
                                    <Printer className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    onClick={() => setDrawerSample(sample)}
                                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-colors"
                                    title="Inspect Dossier"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    onClick={() => setTrackingSample(sample)}
                                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-colors"
                                    title="Chain of Custody Tracking"
                                  >
                                    <History className="h-3.5 w-3.5" />
                                  </button>
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
                  <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-3.5 text-xs text-slate-600">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 font-bold hover:bg-slate-50 disabled:opacity-50 shadow-sm"
                    >
                      Previous
                    </button>
                    <span>
                      Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong>
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 font-bold hover:bg-slate-50 disabled:opacity-50 shadow-sm"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: KANBAN STAGE BOARD */}
          {workstationTab === "kanban" && (
            <SampleKanbanBoard
              samples={samples}
              onSelectSample={(sample) => setDrawerSample(sample as any)}
              onAdvanceStatus={(sample, nextStatus) => handleAdvanceStatus(sample as any, nextStatus)}
              onPrintLabel={(sample) => {
                setPreviewSample(sample as any);
                setPrintPreviewType("label");
                setShowPrintPreview(true);
              }}
              onRejectSample={(id) => {
                setRejectingSampleId(id);
                setShowRejectModal(true);
              }}
              updatingSampleId={updatingSampleId}
            />
          )}

          {/* TAB 3: HIGH SPEED BARCODE GUN RECEPTION BAY */}
          {workstationTab === "scanner" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 font-black shadow-sm">
                    <ScanLine className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900 tracking-wide">
                        High-Speed Barcode Gun Accession Bay
                      </h2>
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
                        SCANNER READY
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Compatible with USB / Bluetooth handheld laser scanners &amp; automated conveyor accessioning.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 font-mono text-xs font-bold text-sky-800">
                    AUTO-RECEIVE ON SCAN
                  </span>
                </div>
              </div>

              {/* Live Session Counter */}
              <div className="grid grid-cols-3 gap-3 border-b border-slate-100 pb-5 text-center">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Session Scans</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">{scanCount}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Exceptions / Not Found</p>
                  <p className={`mt-1 text-3xl font-black ${scanErrorCount ? "text-amber-600" : "text-emerald-600"}`}>{scanErrorCount}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Shift Started</p>
                  <p className="mt-1 text-xl font-black text-slate-900">{scanSessionStarted.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>

              {/* Barcode Input Form */}
              <form onSubmit={handleBarcodeScan} className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    {scanMode === "receive" ? "Scan Barcode to Receive into Central Lab" : "Scan Barcode for Instant Dossier Lookup"}
                  </label>
                  <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setScanMode("receive")}
                      className={`rounded-lg px-3 py-1.5 transition-all ${scanMode === "receive" ? "bg-sky-600 text-white shadow-sm" : "text-slate-600"}`}
                    >
                      Receive Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setScanMode("lookup")}
                      className={`rounded-lg px-3 py-1.5 transition-all ${scanMode === "lookup" ? "bg-sky-600 text-white shadow-sm" : "text-slate-600"}`}
                    >
                      Lookup Mode
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <ScanLine className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-sky-600" />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    autoFocus
                    placeholder="Aim barcode scanner gun or type specimen code and press Enter..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value.toUpperCase())}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-5 py-4 pl-14 font-mono text-base font-bold text-slate-900 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 transition-all shadow-sm"
                    disabled={scanning}
                  />
                  {barcodeInput && (
                    <button
                      type="button"
                      onClick={() => setBarcodeInput("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {scanMessage && (
                  <div className={`p-4 rounded-xl text-xs font-bold border ${
                    scanMessage.includes("not found") || scanMessage.includes("Failed")
                      ? "border-amber-300 bg-amber-50 text-amber-900"
                      : "border-emerald-300 bg-emerald-50 text-emerald-900"
                  }`}>
                    {scanMessage}
                  </div>
                )}
              </form>

              {/* Scan Session Activity Log */}
              {scanHistory.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Recent Barcode Scans in this Session</p>
                  <div className="flex flex-wrap gap-2">
                    {scanHistory.map((s, idx) => (
                      <span
                        key={idx}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-mono font-bold shadow-sm ${
                          s.success
                            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                            : "border-amber-200 bg-amber-50 text-amber-900"
                        }`}
                      >
                        <span className="text-sky-700">{s.barcode}</span> · {s.result} ({s.at})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COLD CHAIN & BIO-BANK */}
          {workstationTab === "storage" && (
            <SampleStorageRack
              samples={samples}
              onSelectSample={(sample) => setDrawerSample(sample as any)}
            />
          )}

          {/* TAB 5: STAT EMERGENCY DESK */}
          {workstationTab === "stat" && (
            <SampleStatCenter
              samples={samples}
              onSelectSample={(sample) => setDrawerSample(sample as any)}
              onAdvanceStatus={(sample, nextStatus) => handleAdvanceStatus(sample as any, nextStatus)}
              onPrintLabel={(sample) => {
                setPreviewSample(sample as any);
                setPrintPreviewType("label");
                setShowPrintPreview(true);
              }}
              updatingSampleId={updatingSampleId}
            />
          )}

          {/* TAB 6: INPATIENT WARD PHLEBOTOMY RUNNER */}
          {workstationTab === "ward-dispatch" && (
            <SampleWardDispatch onCollectSuccess={fetchSamples} />
          )}

          {/* TAB 7: ORDER OF DRAW & CENTRIFUGATION PROTOCOL */}
          {workstationTab === "order-of-draw" && (
            <SampleOrderOfDrawGuide />
          )}

          {/* TAB 8: HIL SERUM QUALITY CHECKER */}
          {workstationTab === "hil-quality" && (
            <SampleHILQualityChecker />
          )}

          {/* TAB 9: REDRAW & REJECTION REGISTER */}
          {workstationTab === "redraws" && (
            <SampleRedrawRegister
              samples={samples}
              onSelectSample={(sample) => setDrawerSample(sample as any)}
              onTriggerRedraw={(sample) => {
                setCollectingSample(sample as any);
                setShowCollectModal(true);
              }}
            />
          )}
        </div>

        {/* Slide-Over Quick Inspection Drawer */}
        <SampleQuickDrawer
          sample={drawerSample}
          isOpen={!!drawerSample}
          onClose={() => setDrawerSample(null)}
          onAdvance={(sample, action) => {
            const nextStatusMap = { collect: "COLLECTED", receive: "RECEIVED", process: "PROCESSING", complete: "COMPLETED" };
            handleAdvanceStatus(sample as any, nextStatusMap[action]);
          }}
          onReject={(id) => {
            setRejectingSampleId(id);
            setShowRejectModal(true);
          }}
          onPrintLabel={(sample) => {
            setPreviewSample(sample as any);
            setPrintPreviewType("label");
            setShowPrintPreview(true);
          }}
          onPrintSheet={(sample) => {
            setPreviewSample(sample as any);
            setPrintPreviewType("collection-sheet");
            setShowPrintPreview(true);
          }}
          updating={updatingSampleId === drawerSample?.id}
        />

        {/* Phlebotomy Collect Modal */}
        <SampleCollectModal
          sample={collectingSample}
          isOpen={showCollectModal}
          onClose={() => { setShowCollectModal(false); setCollectingSample(null); setCollectionError(""); }}
          onConfirm={handleConfirmCollection}
          loading={!!collectingSample && updatingSampleId === collectingSample?.id}
          error={collectionError}
          existingBarcodes={samples.filter(s => collectingSample ? s.id !== collectingSample.id : true).map(s => s.barcode)}
        />

        {/* Reject / Redraw Modal */}
        <SampleRejectModal
          sample={rejectingSampleId ? (samples.find(s => s.id === rejectingSampleId) ?? null) : null}
          isOpen={showRejectModal}
          onClose={() => { setShowRejectModal(false); setRejectingSampleId(null); setRejectionReason(""); setRejectionError(""); }}
          onConfirm={handleRejectSample}
          loading={rejecting}
          error={rejectionError}
        />

        {/* Chain of Custody Tracking Modal */}
        <SampleTrackModal
          sample={trackingSample}
          events={trackingEvents}
          loading={trackingLoading}
          isOpen={!!trackingSample}
          onClose={() => setTrackingSample(null)}
          onRefresh={() => trackingSample && sampleApi.getTracking(trackingSample.id)}
          slaHours={slaHours}
        />

        {/* Barcode Tube Label / Collection Sheet Modal */}
        {showPrintPreview && previewSample && (
          <SampleLabelPrint
            sample={previewSample}
            mode={printPreviewType === "label" ? "label" : "sheet"}
            onClose={() => setShowPrintPreview(false)}
            onPrint={() => setShowPrintPreview(false)}
          />
        )}

        {/* Pre-Analytical Quality Gate Modal on Lab Receive */}
        {workflowAction && workflowSample && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-start justify-between border-b border-slate-200 p-5 bg-slate-50">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-700">Pre-Analytical Quality Gate</span>
                  <h3 className="mt-1 text-base font-black text-slate-900">
                    Receive Specimen into Laboratory
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {workflowSample.sampleNumber} · {workflowSample.order.patient.firstName} {workflowSample.order.patient.lastName}
                  </p>
                </div>
                <button
                  onClick={() => { setWorkflowAction(null); setWorkflowSample(null); }}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 p-5 text-xs">
                <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 space-y-2.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-sky-800">Specimen Integrity Checklist (ISO 15189)</p>
                  {([
                    ["label", "Patient 2-identifier label matches requisition order"],
                    ["container", "Specimen container is sealed, intact and without leakage"],
                    ["volume", "Sample volume is adequate (No QNS flag)"],
                  ] as const).map(([k, lbl]) => (
                    <label key={k} className="flex items-center gap-3 text-slate-800 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={integrityChecks[k]}
                        onChange={(e) => setIntegrityChecks(prev => ({ ...prev, [k]: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-0 cursor-pointer"
                      />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Assigned Laboratory Bay</label>
                  <select
                    value={workflowLocation}
                    onChange={(e) => setWorkflowLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-sky-500 font-medium"
                  >
                    <option>Laboratory Reception</option>
                    <option>Pre-Analytical Centrifugation Desk</option>
                    <option>Biochemistry Analyzer Bay (Cobas / Abbott)</option>
                    <option>Hematology &amp; Coagulation Cell (Sysmex)</option>
                    <option>Microbiology &amp; Serology Section</option>
                    <option>Cold Chain Storage (2–8°C Archive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Pre-Analytical Technician Note</label>
                  <textarea
                    value={workflowNotes}
                    onChange={(e) => setWorkflowNotes(e.target.value)}
                    rows={2}
                    placeholder="Enter pre-analytical notes (e.g. Hemolysis index normal, received on ice)..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-sky-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => { setWorkflowAction(null); setWorkflowSample(null); }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmWorkflowAction}
                    disabled={!Object.values(integrityChecks).every(Boolean) || updatingSampleId === workflowSample.id}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-2 font-black text-white shadow-sm hover:from-sky-500 hover:to-blue-500 disabled:opacity-50"
                  >
                    {updatingSampleId === workflowSample.id && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirm Accession &amp; QC Pass
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
