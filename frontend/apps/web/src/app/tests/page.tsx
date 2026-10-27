"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { testApi } from "@/lib/api";
import TubeGuideModal from "@/components/tests/TubeGuideModal";
import TariffPrintModal from "@/components/tests/TariffPrintModal";
import TestDrawer from "@/components/tests/TestDrawer";
import PackageMatrixView from "@/components/tests/PackageMatrixView";
import ParameterMatrixView from "@/components/tests/ParameterMatrixView";
import ClinicalFormulaEngine from "@/components/tests/ClinicalFormulaEngine";
import AnalyzerQCTracker from "@/components/tests/AnalyzerQCTracker";
import BulkPriceModal from "@/components/tests/BulkPriceModal";
import CloneTestModal from "@/components/tests/CloneTestModal";
import QuickOrderRequisitionModal from "@/components/tests/QuickOrderRequisitionModal";
import AnalyzerInterfacingEngine from "@/components/tests/AnalyzerInterfacingEngine";
import B2BTariffCommissionStudio from "@/components/tests/B2BTariffCommissionStudio";
import PanicValueAlertMatrix from "@/components/tests/PanicValueAlertMatrix";
import PreAnalyticalPhlebotomyGuide from "@/components/tests/PreAnalyticalPhlebotomyGuide";
import {
  FlaskConical,
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Printer,
  Copy,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Clock3,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  Eye,
  Edit,
  Tag,
  Building2,
  ShieldCheck,
  Package,
  Activity,
  Flame,
  Table as TableIcon,
  LayoutGrid,
  ChevronRight,
  DollarSign,
  Loader2,
  FileText,
  Calculator,
  Shield,
  TrendingUp,
  X,
  Sliders,
  Check,
  Cpu,
  ShieldAlert,
  Thermometer,
  Award,
  BadgeCheck,
  Microscope,
  Stethoscope,
  Send,
  Zap,
  Info
} from "lucide-react";

export default function TestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Master Workstation Tabs
  type WorkstationTabType =
    | "catalog"
    | "packages"
    | "parameters"
    | "formulas"
    | "qc"
    | "interfacing"
    | "b2b-tariff"
    | "panic-alerts"
    | "phlebotomy-sop";

  const [workstationTab, setWorkstationTab] = useState<WorkstationTabType>("catalog");

  // View Mode: Table vs Grid Cards
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSampleType, setSelectedSampleType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive">("all");
  const [selectedFasting, setSelectedFasting] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "code" | "price_asc" | "price_desc" | "tat">("name");

  // Multi-selection for bulk operations
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Modals & Drawer State
  const [inspectingTest, setInspectingTest] = useState<any | null>(null);
  const [cloningTest, setCloningTest] = useState<any | null>(null);
  const [isTubeGuideOpen, setIsTubeGuideOpen] = useState(false);
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [testsRes, catRes] = await Promise.all([
        testApi.getAll(),
        testApi.getCategories().catch(() => ({ data: [] })),
      ]);

      if (testsRes.success && testsRes.data) {
        setTests(testsRes.data.tests || testsRes.data || []);
      } else {
        setError(testsRes.message || "Failed to fetch tests catalog");
      }

      if (catRes && catRes.data) {
        setCategories(catRes.data || []);
      }
    } catch (err) {
      console.error("Error fetching test data:", err);
      setError(err instanceof Error ? err.message : "Failed to load test data");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    showNotification(`Copied investigation code "${text}" to clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // 1-Click Inline Status Toggle Switch
  const handleToggleStatus = async (test: any) => {
    const newStatus = test.isActive === false ? true : false;
    const prevTests = [...tests];

    setTests(
      tests.map((t) => (t.id === test.id ? { ...t, isActive: newStatus } : t))
    );

    if (inspectingTest && inspectingTest.id === test.id) {
      setInspectingTest({ ...inspectingTest, isActive: newStatus });
    }

    try {
      const res = await testApi.update(String(test.id), { isActive: newStatus });
      if (res.success) {
        showNotification(
          `Investigation "${test.testName || test.name}" marked as ${
            newStatus ? "Active Operational" : "Paused / Inactive"
          }`
        );
      } else {
        throw new Error(res.message || "Update failed");
      }
    } catch (err) {
      setTests(prevTests);
      alert(err instanceof Error ? err.message : "Failed to update test status");
    }
  };

  // Bulk active/inactive toggle
  const handleBulkToggleActive = async (isActive: boolean) => {
    if (selectedTestIds.length === 0) return;
    setBulkLoading(true);
    try {
      await testApi.bulkToggleActive({ testIds: selectedTestIds, isActive });
      showNotification(
        `Updated status for ${selectedTestIds.length} investigations to ${
          isActive ? "Active" : "Paused"
        }`
      );
      setTests((prev) =>
        prev.map((t) =>
          selectedTestIds.includes(t.id) ? { ...t, isActive } : t
        )
      );
      setSelectedTestIds([]);
    } catch (err: any) {
      alert(err?.message || "Bulk update failed");
    } finally {
      setBulkLoading(false);
    }
  };

  // Vacutainer Cap Info & Visual Styling
  const getTubeInfo = (container?: string, sampleType?: string) => {
    const text = `${container || ""} ${sampleType || ""}`.toLowerCase();
    if (text.includes("edta") || text.includes("purple") || text.includes("lavender")) {
      return { label: "EDTA Purple", color: "#9333EA", cap: "bg-purple-600", bg: "bg-purple-50 text-purple-700 border-purple-200" };
    }
    if (text.includes("fluoride") || text.includes("oxalate") || text.includes("grey") || text.includes("gray")) {
      return { label: "Fluoride Grey", color: "#64748B", cap: "bg-slate-500", bg: "bg-slate-100 text-slate-700 border-slate-300" };
    }
    if (text.includes("sst") || text.includes("gold") || text.includes("gel") || text.includes("yellow")) {
      return { label: "SST Gold", color: "#D97706", cap: "bg-amber-500", bg: "bg-amber-50 text-amber-800 border-amber-200" };
    }
    if (text.includes("red") || text.includes("plain") || text.includes("serum")) {
      return { label: "Plain Red", color: "#DC2626", cap: "bg-red-600", bg: "bg-red-50 text-red-700 border-red-200" };
    }
    if (text.includes("citrate") || text.includes("blue")) {
      return { label: "Citrate Blue", color: "#0284C7", cap: "bg-sky-500", bg: "bg-sky-50 text-sky-700 border-sky-200" };
    }
    if (text.includes("heparin") || text.includes("green")) {
      return { label: "Heparin Green", color: "#16A34A", cap: "bg-emerald-600", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    if (text.includes("urine") || text.includes("stool") || text.includes("swab") || text.includes("sputum")) {
      return { label: container || sampleType || "Sterile Cup", color: "#CA8A04", cap: "bg-yellow-500", bg: "bg-yellow-50 text-yellow-800 border-yellow-200" };
    }
    return { label: container || sampleType || "Standard Vial", color: "#475569", cap: "bg-slate-600", bg: "bg-slate-100 text-slate-700 border-slate-200" };
  };

  // Filtered and Sorted Tests
  const filteredTests = useMemo(() => {
    return tests
      .filter((test) => {
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchesName = (test.testName || test.name || "").toLowerCase().includes(q);
          const matchesCode = (test.testCode || test.code || "").toLowerCase().includes(q);
          const matchesShort = (test.shortName || "").toLowerCase().includes(q);
          const matchesMethod = (test.method || "").toLowerCase().includes(q);
          const matchesDept = (test.processingDepartment || "").toLowerCase().includes(q);
          if (!matchesName && !matchesCode && !matchesShort && !matchesMethod && !matchesDept) {
            return false;
          }
        }

        if (selectedCategory) {
          const testCatId = test.categoryId;
          const testCatName = test.category?.name || test.category;
          if (testCatId !== selectedCategory && testCatName !== selectedCategory) {
            return false;
          }
        }

        if (selectedSampleType && test.sampleType !== selectedSampleType) {
          return false;
        }

        if (selectedStatus === "active" && test.isActive === false) return false;
        if (selectedStatus === "inactive" && test.isActive !== false) return false;

        if (selectedFasting === "fasting") {
          const prep = (test.patientPreparation || "").toLowerCase();
          if (!prep.includes("fast") && !prep.includes("overnight") && !prep.includes("empty stomach")) {
            return false;
          }
        } else if (selectedFasting === "non-fasting") {
          const prep = (test.patientPreparation || "").toLowerCase();
          if (prep.includes("fast") || prep.includes("overnight")) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return (a.testName || a.name || "").localeCompare(b.testName || b.name || "");
        }
        if (sortBy === "code") {
          return (a.testCode || a.code || "").localeCompare(b.testCode || b.code || "");
        }
        if (sortBy === "price_asc") {
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        }
        if (sortBy === "price_desc") {
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        }
        if (sortBy === "tat") {
          return (Number(a.tatHours) || 24) - (Number(b.tatHours) || 24);
        }
        return 0;
      });
  }, [tests, searchTerm, selectedCategory, selectedSampleType, selectedStatus, selectedFasting, sortBy]);

  const totalActive = tests.filter((t) => t.isActive !== false).length;
  const statAvailableCount = tests.filter(
    (t) => (t.tatHours && Number(t.tatHours) <= 4) || (t.tatDisplay && t.tatDisplay.toLowerCase().includes("stat"))
  ).length;
  const totalCategoriesCount = categories.length || new Set(tests.map((t) => t.categoryId || t.category?.name)).size;

  // Selected Tests for Requisition / Actions
  const selectedTestsList = useMemo(() => {
    return tests.filter((t) => selectedTestIds.includes(t.id));
  }, [tests, selectedTestIds]);

  const handleSelectAll = () => {
    if (selectedTestIds.length === filteredTests.length) {
      setSelectedTestIds([]);
    } else {
      setSelectedTestIds(filteredTests.map((t) => t.id));
    }
  };

  const handleToggleSelectTest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTestIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <ProtectedRoute requiredRoles={["ADMIN", "FRONT_DESK", "LAB_TECH", "PATHOLOGIST", "DOCTOR"]}>
      <div className="space-y-6 pb-20">
        {/* Floating Success Notification */}
        {successMessage && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 text-emerald-900 px-5 py-3.5 text-xs font-bold shadow-xl animate-in slide-in-from-top-3 duration-300">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-black">
              ✓
            </span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* =========================================================================
            1. TEST CATALOGUE HEADER
        ========================================================================= */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm sm:p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-sky-600" />

          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-800">
                <FlaskConical className="h-3.5 w-3.5 text-sky-700" />
                Diagnostic test catalogue
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Investigations and clinical master data
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                Maintain the investigations used by registration, order entry, specimen collection and reporting teams. Review specimen requirements, preparation, turnaround time, pricing and operational status from one controlled directory.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTubeGuideOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <FlaskConical className="h-4 w-4 text-sky-700" />
                <span>Specimen guide</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTariffModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Printer className="h-4 w-4 text-blue-600" />
                <span>Print tariff sheet</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBulkPriceModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs font-bold text-sky-800 shadow-sm transition hover:bg-sky-100"
              >
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span>Bulk pricing</span>
              </button>

              <Link
                href="/tests/new"
                className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-sky-800"
              >
                <Plus className="h-4 w-4" />
                <span>New investigation</span>
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Investigations</span>
                <FlaskConical className="h-4 w-4 text-sky-700" />
              </div>
              <p className="mt-1 text-2xl font-black text-slate-900">{tests.length}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Loaded in this catalogue</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active</span>
              <p className="mt-1 text-2xl font-black text-slate-900">{totalActive}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Available for order entry</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Departments</span>
              <p className="mt-1 text-2xl font-black text-slate-900">{totalCategoriesCount}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Configured catalogue sections</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rapid TAT</span>
              <p className="mt-1 text-2xl font-black text-slate-900">{statAvailableCount}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Configured at four hours or less</p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. CATALOGUE WORK AREAS
        ========================================================================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {[
              { id: "catalog" as const, label: "Catalogue", icon: TableIcon, count: filteredTests.length },
              { id: "packages" as const, label: "Packages & profiles", icon: Package },
              { id: "parameters" as const, label: "Analytes & intervals", icon: SlidersHorizontal },
              { id: "formulas" as const, label: "Calculated results", icon: Calculator },
              { id: "qc" as const, label: "Quality & instruments", icon: ShieldCheck },
              { id: "interfacing" as const, label: "Analyzer connections", icon: Cpu },
              { id: "b2b-tariff" as const, label: "Tariffs", icon: TrendingUp },
              { id: "panic-alerts" as const, label: "Critical values", icon: ShieldAlert },
              { id: "phlebotomy-sop" as const, label: "Specimen collection", icon: FlaskConical },
            ].map((tab) => {
              const isActive = workstationTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setWorkstationTab(tab.id)}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-sky-700 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.2 text-[10px] font-mono font-bold ${
                        isActive ? "bg-white text-slate-900" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            TAB 1: MASTER DIAGNOSTIC TEST DIRECTORY
        ========================================================================= */}
        {workstationTab === "catalog" && (
          <div className="space-y-4">
            {/* Search, Department & Specimen Filter Toolbar */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
                {/* Search Bar */}
                <div className="relative lg:col-span-2">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search investigation name, code (e.g. CBC), method, department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-8 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Department Filter */}
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">All Departments ({totalCategoriesCount})</option>
                    {categories.map((c) => (
                      <option key={c.id || c.name} value={c.id || c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Specimen Matrix Filter */}
                <div>
                  <select
                    value={selectedSampleType}
                    onChange={(e) => setSelectedSampleType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">All Specimen Matrices</option>
                    <option value="BLOOD">Whole Blood / Plasma</option>
                    <option value="SERUM">Serum</option>
                    <option value="URINE">Urine</option>
                    <option value="SWAB">Swab</option>
                    <option value="TISSUE">Tissue Biopsy</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="name">Sort: Name (A-Z)</option>
                    <option value="code">Sort: Investigation Code</option>
                    <option value="price_asc">Sort: Price (Low to High)</option>
                    <option value="price_desc">Sort: Price (High to Low)</option>
                    <option value="tat">Sort: Turnaround Time (TAT)</option>
                  </select>
                </div>
              </div>

              {/* Status and Fasting Quick Chips */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-semibold mr-1">Status:</span>
                  {(["all", "active", "inactive"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStatus(st)}
                      className={`px-2.5 py-1 rounded-lg font-bold capitalize transition cursor-pointer ${
                        selectedStatus === st
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}

                  <span className="text-slate-400 font-semibold ml-3 mr-1">Fasting:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFasting(selectedFasting === "fasting" ? "" : "fasting")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      selectedFasting === "fasting"
                        ? "bg-amber-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Fasting Required
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs mr-2">
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        viewMode === "table" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <Layers className="h-3 w-3" />
                      <span>Table</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        viewMode === "grid" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <LayoutGrid className="h-3 w-3" />
                      <span>Cards</span>
                    </button>
                  </div>

                  <span className="text-slate-500 text-xs">
                    Showing <strong className="text-slate-900">{filteredTests.length}</strong> of {tests.length} tests
                  </span>
                  {(searchTerm || selectedCategory || selectedSampleType || selectedStatus !== "all" || selectedFasting) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("");
                        setSelectedSampleType("");
                        setSelectedStatus("all");
                        setSelectedFasting("");
                      }}
                      className="text-blue-600 hover:text-blue-800 font-bold ml-2 underline text-xs"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bulk Selection Action Floating Ribbon (When Tests Checked) */}
            {selectedTestIds.length > 0 && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/90 p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                    {selectedTestIds.length}
                  </span>
                  <span className="font-bold text-blue-900">
                    Investigations Selected for Bulk Action
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRequisitionModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-blue-300 text-blue-700 font-bold hover:bg-blue-50 transition shadow-xs cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Create Requisition Slip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsBulkPriceModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-blue-300 text-blue-700 font-bold hover:bg-blue-50 transition shadow-xs cursor-pointer"
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Bulk Price Revision</span>
                  </button>

                  <button
                    type="button"
                    disabled={bulkLoading}
                    onClick={() => handleBulkToggleActive(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <span>Mark Active</span>
                  </button>

                  <button
                    type="button"
                    disabled={bulkLoading}
                    onClick={() => handleBulkToggleActive(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <span>Pause Selected</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTestIds([])}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-blue-100 transition"
                    title="Clear selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Test Catalog Table View */}
            {viewMode === "table" ? (
              <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs">
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-16 text-slate-400 space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-xs font-bold text-slate-600">Loading diagnostic test directory...</p>
                  </div>
                ) : filteredTests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-16 text-slate-400 space-y-3">
                    <FlaskConical className="h-10 w-10 text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">No matching diagnostic investigations found</p>
                    <p className="text-xs text-slate-500">Try adjusting your search query or clear active filters</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50/90 text-[10px] font-black uppercase tracking-wider text-slate-600">
                        <tr>
                          <th className="px-4 py-3.5 w-10">
                            <input
                              type="checkbox"
                              checked={selectedTestIds.length === filteredTests.length && filteredTests.length > 0}
                              onChange={handleSelectAll}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-4 py-3.5">Investigation Profile &amp; Code</th>
                          <th className="px-4 py-3.5">Department &amp; Methodology</th>
                          <th className="px-4 py-3.5">Specimen Tube SOP</th>
                          <th className="px-4 py-3.5">Preparation &amp; TAT</th>
                          <th className="px-4 py-3.5">Tariff &amp; B2B Rate</th>
                          <th className="px-4 py-3.5">Status</th>
                          <th className="px-4 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredTests.map((test) => {
                          const tube = getTubeInfo(test.sampleContainer, test.sampleType);
                          const isStat = test.tatHours && Number(test.tatHours) <= 4;
                          const price = Number(test.price) || 0;
                          const offer = test.offerPrice ? Number(test.offerPrice) : null;
                          const hasDiscount = offer !== null && offer < price && offer > 0;
                          const isSelected = selectedTestIds.includes(test.id);

                          return (
                            <tr
                              key={test.id}
                              className={`group transition-colors ${
                                isSelected ? "bg-blue-50/40" : "hover:bg-slate-50/70"
                              }`}
                            >
                              {/* Checkbox */}
                              <td className="px-4 py-3.5" onClick={(e) => handleToggleSelectTest(test.id, e)}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>

                              {/* Test Name & Code */}
                              <td className="px-4 py-3.5">
                                <div className="space-y-1">
                                  <button
                                    onClick={() => setInspectingTest(test)}
                                    className="font-bold text-slate-900 text-sm hover:text-blue-600 text-left transition-colors flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <span>{test.testName || test.name}</span>
                                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                  </button>
                                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                                    <span className="bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded font-bold">
                                      {test.testCode || test.code}
                                    </span>
                                    <button
                                      onClick={(e) => copyToClipboard(test.testCode || test.code, e)}
                                      className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                      title="Copy investigation code"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </td>

                              {/* Department & Method */}
                              <td className="px-4 py-3.5">
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-slate-900">
                                    {test.category?.name || test.processingDepartment || "Core Pathology"}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-medium">
                                    {test.method || "Automated Analyzer"}
                                  </p>
                                </div>
                              </td>

                              {/* Specimen Tube SOP */}
                              <td className="px-4 py-3.5">
                                <div className="space-y-1">
                                  <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${tube.bg}`}>
                                    <span className="h-2 w-2 rounded-full shadow-xs" style={{ backgroundColor: tube.color }} />
                                    <span>{test.sampleContainer || tube.label}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-medium">
                                    {test.sampleVolume || "2.5 mL"} · {test.sampleType || "BLOOD"}
                                  </p>
                                </div>
                              </td>

                              {/* Preparation & TAT */}
                              <td className="px-4 py-3.5">
                                <div className="space-y-0.5 text-[10px]">
                                  <span
                                    className={`inline-block font-semibold ${
                                      (test.patientPreparation || "").toLowerCase().includes("fast")
                                        ? "text-amber-700 font-bold"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {test.patientPreparation ? test.patientPreparation.slice(0, 32) : "Routine"}
                                  </span>
                                  <p className="font-mono text-slate-700 font-bold flex items-center gap-1">
                                    <Clock3 className="h-3 w-3 text-slate-400" />
                                    <span>TAT: {test.tatHours || 24}h</span>
                                    {isStat && <span className="text-rose-600 font-extrabold">(STAT)</span>}
                                  </p>
                                </div>
                              </td>

                              {/* Tariff & B2B Price */}
                              <td className="px-4 py-3.5">
                                <div className="space-y-0.5 font-mono">
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-sm font-extrabold text-slate-900">
                                      ₹{hasDiscount ? offer : price}
                                    </span>
                                    {hasDiscount && (
                                      <span className="text-[10px] text-slate-400 line-through">₹{price}</span>
                                    )}
                                  </div>
                                  {test.b2bRate && (
                                    <span className="block text-[9px] text-slate-500">
                                      B2B: ₹{test.b2bRate}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Operational Status Switch */}
                              <td className="px-4 py-3.5">
                                <button
                                  onClick={() => handleToggleStatus(test)}
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase transition-all cursor-pointer ${
                                    test.isActive !== false
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                      : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                                  }`}
                                >
                                  {test.isActive !== false ? "● Active" : "○ Paused"}
                                </button>
                              </td>

                              {/* Action Buttons */}
                              <td className="px-4 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setInspectingTest(test)}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition shadow-xs cursor-pointer"
                                    title="View Investigation Dossier"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    onClick={() => setCloningTest(test)}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition shadow-xs cursor-pointer"
                                    title="Clone / Duplicate Investigation"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>

                                  <Link
                                    href={`/tests/${test.id}?edit=true`}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
                                    title="Edit Investigation Setup"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* Grid Cards View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTests.map((test) => {
                  const tube = getTubeInfo(test.sampleContainer, test.sampleType);
                  const price = Number(test.price) || 0;
                  const offer = test.offerPrice ? Number(test.offerPrice) : null;
                  const hasDiscount = offer !== null && offer < price && offer > 0;

                  return (
                    <div
                      key={test.id}
                      className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-200 space-y-4 cursor-pointer"
                      onClick={() => setInspectingTest(test)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                            {test.testCode || test.code}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {test.testName || test.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            {test.category?.name || "General Pathology"}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                            test.isActive !== false
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {test.isActive !== false ? "Active" : "Paused"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Specimen:</span>
                          <div className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold border ${tube.bg}`}>
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tube.color }} />
                            <span className="truncate">{tube.label}</span>
                          </div>
                        </div>

                        <div className="space-y-0.5 text-right font-mono">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Tariff:</span>
                          <span className="text-base font-black text-slate-900">
                            ₹{hasDiscount ? offer : price}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Clock3 className="h-3.5 w-3.5 text-slate-400" /> {test.tatHours || 24}h Turnaround
                        </span>
                        <span className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                          View Dossier <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: HEALTH PACKAGES & PROFILES MATRIX
        ========================================================================= */}
        {workstationTab === "packages" && <PackageMatrixView />}

        {/* =========================================================================
            TAB 3: ANALYTE PARAMETERS & BIOLOGICAL INTERVALS
        ========================================================================= */}
        {workstationTab === "parameters" && <ParameterMatrixView />}

        {/* =========================================================================
            TAB 4: CLINICAL FORMULAS & DERIVATION ENGINE
        ========================================================================= */}
        {workstationTab === "formulas" && <ClinicalFormulaEngine />}

        {/* =========================================================================
            TAB 5: ANALYZER QC & INSTRUMENTS TRACKER
        ========================================================================= */}
        {workstationTab === "qc" && <AnalyzerQCTracker />}

        {/* =========================================================================
            TAB 6: LIMS ANALYZER INTERFACING (NEW ENTERPRISE FEATURE)
        ========================================================================= */}
        {workstationTab === "interfacing" && <AnalyzerInterfacingEngine />}

        {/* =========================================================================
            TAB 7: B2B TARIFF & DOCTOR COMMISSION STUDIO (NEW ENTERPRISE FEATURE)
        ========================================================================= */}
        {workstationTab === "b2b-tariff" && <B2BTariffCommissionStudio />}

        {/* =========================================================================
            TAB 8: PANIC / CRITICAL VALUE ALERT MATRIX (NEW ENTERPRISE FEATURE)
        ========================================================================= */}
        {workstationTab === "panic-alerts" && <PanicValueAlertMatrix />}

        {/* =========================================================================
            TAB 9: PRE-ANALYTICAL PHLEBOTOMY & DRAW SOP (NEW ENTERPRISE FEATURE)
        ========================================================================= */}
        {workstationTab === "phlebotomy-sop" && <PreAnalyticalPhlebotomyGuide />}

        {/* =========================================================================
            MODALS & DRAWERS
        ========================================================================= */}
        {/* Slide-over Investigation Dossier */}
        <TestDrawer
          test={inspectingTest}
          isOpen={Boolean(inspectingTest)}
          onClose={() => setInspectingTest(null)}
          onToggleStatus={handleToggleStatus}
          onDuplicate={(t) => setCloningTest(t)}
        />

        {/* Vacutainer SOP Guide Modal */}
        <TubeGuideModal
          isOpen={isTubeGuideOpen}
          onClose={() => setIsTubeGuideOpen(false)}
        />

        {/* Rate Sheet & Tariff Print Modal */}
        <TariffPrintModal
          isOpen={isTariffModalOpen}
          onClose={() => setIsTariffModalOpen(false)}
          tests={tests}
          categories={categories}
        />

        {/* Bulk Pricing Revision Studio */}
        <BulkPriceModal
          isOpen={isBulkPriceModalOpen}
          onClose={() => setIsBulkPriceModalOpen(false)}
          selectedTestIds={selectedTestIds}
          totalTestsCount={tests.length}
          categories={categories}
          onSuccess={(msg) => {
            showNotification(msg);
            fetchInitialData();
          }}
        />

        {/* Test Cloning Studio */}
        <CloneTestModal
          isOpen={Boolean(cloningTest)}
          onClose={() => setCloningTest(null)}
          test={cloningTest}
          onSuccess={(newTest) => {
            setTests((prev) => [newTest, ...prev]);
            showNotification(`Investigation cloned successfully as ${newTest.testCode}!`);
          }}
        />

        {/* Quick Order Requisition Slip Modal */}
        <QuickOrderRequisitionModal
          isOpen={isRequisitionModalOpen}
          onClose={() => setIsRequisitionModalOpen(false)}
          selectedTests={selectedTestsList}
        />
      </div>
    </ProtectedRoute>
  );
}
