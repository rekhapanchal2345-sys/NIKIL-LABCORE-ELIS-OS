"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { testApi } from "@/lib/api";
import { SampleType, TestFormData, TestCategory } from "@/types";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  Barcode,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Clock3,
  Copy,
  DollarSign,
  Eye,
  FileSpreadsheet,
  FileText,
  Flame,
  FlaskConical,
  HelpCircle,
  Info,
  Layers,
  Maximize2,
  Minimize2,
  Percent,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  RotateCcw,
  Scale,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Stethoscope,
  Tag,
  TestTube,
  TestTube2,
  Thermometer,
  Trash2,
  TrendingUp,
  User,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface SubParameterDef {
  parameterName: string;
  shortName: string;
  loincCode?: string;
  unit: string;
  dataType: string;
  displayOrder: number;
  isRequired: boolean;
  maleLow?: number;
  maleHigh?: number;
  femaleLow?: number;
  femaleHigh?: number;
  otherLow?: number;
  otherHigh?: number;
  ageGroup?: string;
  minAge?: number;
  maxAge?: number;
  criticalLow?: number;
  criticalHigh?: number;
}

const TUBE_OPTIONS = [
  {
    label: "EDTA Purple",
    container: "EDTA vial (purple)",
    sampleType: "BLOOD",
    color: "#8B5CF6",
    bgClass: "bg-purple-50 border-purple-200 text-purple-900",
    pillClass: "bg-purple-600 text-white",
    desc: "Whole Blood / Complete Hemogram & HbA1c",
    additive: "K2/K3 EDTA (Anticoagulant)",
  },
  {
    label: "SST Gold / Yellow",
    container: "SST Gel (gold/yellow)",
    sampleType: "SERUM",
    color: "#EAB308",
    bgClass: "bg-amber-50 border-amber-200 text-amber-900",
    pillClass: "bg-amber-500 text-slate-900 font-bold",
    desc: "Serum / Clot Gel Separator (Biochemistry & Serology)",
    additive: "Silica Clot Activator + Polymer Gel",
  },
  {
    label: "Citrate Blue",
    container: "Sodium Citrate (light blue)",
    sampleType: "PLASMA",
    color: "#0EA5E9",
    bgClass: "bg-sky-50 border-sky-200 text-sky-900",
    pillClass: "bg-sky-500 text-white",
    desc: "Coagulation Profile (PT/INR, APTT, D-Dimer)",
    additive: "Buffered Sodium Citrate 3.2% (1:9 Ratio)",
  },
  {
    label: "Fluoride Grey",
    container: "Fluoride Oxalate (grey)",
    sampleType: "PLASMA",
    color: "#64748B",
    bgClass: "bg-slate-100 border-slate-300 text-slate-900",
    pillClass: "bg-slate-600 text-white",
    desc: "Glucose & Lactate (Glycolysis Inhibitor)",
    additive: "Sodium Fluoride + Potassium Oxalate",
  },
  {
    label: "Heparin Green",
    container: "Lithium Heparin (green)",
    sampleType: "PLASMA",
    color: "#10B981",
    bgClass: "bg-emerald-50 border-emerald-200 text-emerald-900",
    pillClass: "bg-emerald-600 text-white",
    desc: "STAT Chemistry & Arterial Blood Gas (ABG)",
    additive: "Lithium Heparin (Antithrombin activator)",
  },
  {
    label: "Plain Red",
    container: "Plain vial (red top)",
    sampleType: "SERUM",
    color: "#EF4444",
    bgClass: "bg-rose-50 border-rose-200 text-rose-900",
    pillClass: "bg-rose-600 text-white",
    desc: "Cross-matching, Blood Bank, Infectious Markers",
    additive: "Clot Activator Particle Coating",
  },
  {
    label: "Sterile Cup",
    container: "Sterile Universal Container",
    sampleType: "URINE",
    color: "#F59E0B",
    bgClass: "bg-yellow-50 border-yellow-200 text-yellow-900",
    pillClass: "bg-yellow-600 text-white",
    desc: "Urine Routine, 24-hr Aliquot, Sputum, Body Fluids",
    additive: "Preservative Free / Sterile Sealed",
  },
];

const COMMON_UNITS = [
  "g/dL",
  "mg/dL",
  "10^3/μL",
  "10^6/μL",
  "%",
  "U/L",
  "fL",
  "pg",
  "mmol/L",
  "μmol/L",
  "ng/mL",
  "μIU/mL",
  "mm/hr",
  "Ratio",
  "Index",
  "mg/L",
  "sec",
  "cells/HPF",
];

export default function NewTestPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [activeTab, setActiveTab] = useState<"general" | "specimen" | "parameters" | "pricing">("general");

  // Screen Zoom & Fullscreen Controls (Hospital & Lab Suite)
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<TestFormData>({
    testCode: "",
    testName: "",
    shortName: "",
    description: "",
    categoryId: "",
    sampleType: "BLOOD" as SampleType,
    sampleContainer: "EDTA vial (purple)",
    sampleVolume: "2.5 mL",
    patientPreparation: "10-12 Hours Overnight Fasting",
    price: 0,
    offerPrice: 0,
    b2bRate: 0,
    tatHours: 4,
    tatDisplay: "Same Day (4 hours)",
    processingDepartment: "Hematology",
    method: "Automated Flow Cytometry",
    displayOrder: 1,
    clinicalSignificance: "",
    isActive: true,
  });

  // Sub-Parameters List
  const [parameters, setParameters] = useState<SubParameterDef[]>([
    {
      parameterName: "Primary Analyte",
      shortName: "",
      loincCode: "",
      unit: "mg/dL",
      dataType: "NUMERIC",
      displayOrder: 1,
      isRequired: true,
      maleLow: 0,
      maleHigh: 100,
      femaleLow: 0,
      femaleHigh: 100,
      otherLow: 0,
      otherHigh: 100,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [publishSuccessToast, setPublishSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await testApi.getCategories();
      if (response?.success && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAddParameter = () => {
    setParameters([
      ...parameters,
      {
        parameterName: "",
        shortName: "",
        loincCode: "",
        unit: "mg/dL",
        dataType: "NUMERIC",
        displayOrder: parameters.length + 1,
        isRequired: true,
        maleLow: 0,
        maleHigh: 100,
        femaleLow: 0,
        femaleHigh: 100,
        otherLow: 0,
        otherHigh: 100,
      },
    ]);
  };

  const handleRemoveParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleParameterChange = (index: number, field: keyof SubParameterDef, value: any) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value };
    setParameters(updated);
  };

  const handleSubmit = async (e?: React.FormEvent, navigateToOrdersAfter = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.testCode.trim()) {
      setError("Investigation Code is required (e.g. CBC, KFT, TSH, LIPID)");
      setActiveTab("general");
      setLoading(false);
      return;
    }

    if (!formData.testName.trim()) {
      setError("Full Clinical Investigation Name is required");
      setActiveTab("general");
      setLoading(false);
      return;
    }

    if (Number(formData.price) <= 0) {
      setError("Patient MRP must be greater than zero");
      setActiveTab("pricing");
      setLoading(false);
      return;
    }

    if (Number(formData.tatHours) <= 0) {
      setError("Turnaround Time SLA must be configured before publishing");
      setActiveTab("pricing");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        offerPrice: formData.offerPrice ? Number(formData.offerPrice) : undefined,
        b2bRate: formData.b2bRate ? Number(formData.b2bRate) : undefined,
        tatHours: Number(formData.tatHours),
        displayOrder: Number(formData.displayOrder || 1),
      };

      const res = await testApi.create(payload);
      const createdTestId = res?.data?.id || res?.data?.test?.id;

      // Register Sub-Parameters if created successfully
      if (createdTestId && parameters.length > 0) {
        for (const p of parameters) {
          if (p.parameterName.trim()) {
            try {
              const paramRes = await testApi.addParameter(createdTestId, {
                parameterName: p.parameterName,
                shortName: p.shortName || p.parameterName.substring(0, 8),
                unit: p.unit || "N/A",
                dataType: p.dataType || "NUMERIC",
                displayOrder: p.displayOrder,
                isRequired: p.isRequired,
                isActive: true,
              });

              const paramId = paramRes?.data?.id;
              if (paramId && (p.maleLow !== undefined || p.femaleLow !== undefined)) {
                if (p.maleLow !== undefined && p.maleHigh !== undefined) {
                  await testApi.addReferenceRange(paramId, {
                    gender: "MALE",
                    ageGroup: p.ageGroup || undefined,
                    minAge: p.minAge !== undefined ? Number(p.minAge) : undefined,
                    maxAge: p.maxAge !== undefined ? Number(p.maxAge) : undefined,
                    minAgeUnit: "YEARS",
                    maxAgeUnit: "YEARS",
                    normalLow: Number(p.maleLow),
                    normalHigh: Number(p.maleHigh),
                    criticalLow: p.criticalLow !== undefined ? Number(p.criticalLow) : undefined,
                    criticalHigh: p.criticalHigh !== undefined ? Number(p.criticalHigh) : undefined,
                    isActive: true,
                  });
                }
                if (p.femaleLow !== undefined && p.femaleHigh !== undefined) {
                  await testApi.addReferenceRange(paramId, {
                    gender: "FEMALE",
                    ageGroup: p.ageGroup || undefined,
                    minAge: p.minAge !== undefined ? Number(p.minAge) : undefined,
                    maxAge: p.maxAge !== undefined ? Number(p.maxAge) : undefined,
                    minAgeUnit: "YEARS",
                    maxAgeUnit: "YEARS",
                    normalLow: Number(p.femaleLow),
                    normalHigh: Number(p.femaleHigh),
                    criticalLow: p.criticalLow !== undefined ? Number(p.criticalLow) : undefined,
                    criticalHigh: p.criticalHigh !== undefined ? Number(p.criticalHigh) : undefined,
                    isActive: true,
                  });
                }
              }
            } catch (pErr) {
              console.warn("Sub-parameter registration notice:", pErr);
            }
          }
        }
      }

      setPublishSuccessToast(`✅ Investigation "${formData.testName}" published to Active Diagnostic Catalogue & Orders.`);
      setTimeout(() => {
        if (navigateToOrdersAfter) {
          router.push("/orders");
        } else {
          router.push(`/tests/${createdTestId || ""}`);
        }
      }, 1200);
    } catch (err: any) {
      console.error("Error creating investigation:", err);
      setError(err?.message || "Failed to publish investigation. Please verify inputs.");
    } finally {
      setLoading(false);
    }
  };

  // Live Financial Calculations
  const baseMRP = Number(formData.price) || 0;
  const offerPrice = Number(formData.offerPrice) || 0;
  const b2bRate = Number(formData.b2bRate) || 0;
  const hasDiscount = offerPrice > 0 && offerPrice < baseMRP;
  const discountPercent = hasDiscount ? Math.round(((baseMRP - offerPrice) / baseMRP) * 100) : 0;
  const savings = hasDiscount ? baseMRP - offerPrice : 0;
  const referralMargin = b2bRate > 0 && offerPrice > b2bRate ? offerPrice - b2bRate : 0;

  // Selected Vacutainer Tube Object
  const selectedTube = useMemo(() => {
    return (
      TUBE_OPTIONS.find((t) => t.container === formData.sampleContainer) ||
      TUBE_OPTIONS[0]
    );
  }, [formData.sampleContainer]);

  // 4-Step Clinical Checklist Progression
  const steps = [
    {
      id: "general",
      stepNum: 1,
      title: "1. Definition & LOINC",
      subtitle: "Code, Name, Department & Discipline",
      complete: Boolean(formData.testCode.trim() && formData.testName.trim()),
    },
    {
      id: "specimen",
      stepNum: 2,
      title: "2. Vacutainer SOP",
      subtitle: "Tube Cap, Sample Volume & Fasting",
      complete: Boolean(formData.sampleContainer && formData.sampleVolume),
    },
    {
      id: "parameters",
      stepNum: 3,
      title: `3. Analytes (${parameters.length})`,
      subtitle: "LOINC, Units & Bio Reference Intervals",
      complete: parameters.length > 0 && parameters.every((p) => p.parameterName.trim() && p.unit),
    },
    {
      id: "pricing",
      stepNum: 4,
      title: "4. Tariff Matrix",
      subtitle: "Patient MRP, Doctor B2B & TAT SLA",
      complete: baseMRP > 0 && Number(formData.tatHours) > 0,
    },
  ];

  const allStepsComplete = steps.every((s) => s.complete);

  return (
    <ProtectedRoute requiredRoles={["ADMIN", "PATHOLOGIST"]}>
      <div
        className={`min-h-screen bg-[#FFFFFF] text-slate-900 font-sans antialiased selection:bg-sky-100 transition-all ${
          isFullscreen ? "fixed inset-0 z-50 overflow-y-auto p-4 bg-white" : ""
        }`}
        style={{
          zoom: zoomLevel !== 100 ? `${zoomLevel}%` : undefined,
        }}
      >
        {/* =====================================================================
            HOSPITAL HEADER: ULTRA LIGHT STERILE WHITE & CLEAN SURGICAL BORDERS
        ====================================================================== */}
        <div className="border-b border-slate-200/90 pb-4 mb-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              {/* Clinical Breadcrumb */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <Link
                  href="/tests"
                  className="hover:text-sky-700 flex items-center gap-1 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Diagnostic Directory</span>
                </Link>
                <span>/</span>
                <span className="text-slate-800 font-bold">Master Investigation Studio</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                  NABL ISO 15189
                </span>
              </div>

              {/* Title & Clinical Subtitle */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shadow-2xs">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    New Diagnostic Investigation Studio
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Configure clinical profiles, vacutainer tubes, multi-analyte reference ranges, and diagnostic tariff matrices
                  </p>
                </div>
              </div>
            </div>

            {/* Screen Zoom & Fast Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Zoom Controls ("Perfect Zoom, Screen") */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 text-xs text-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => Math.max(80, prev - 10))}
                  title="Zoom Out (Compact)"
                  className="p-1.5 hover:bg-white hover:text-slate-900 rounded transition"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-mono font-bold text-[11px] select-none text-slate-800">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => Math.min(130, prev + 10))}
                  title="Zoom In (High Visibility)"
                  className="p-1.5 hover:bg-white hover:text-slate-900 rounded transition"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {zoomLevel !== 100 && (
                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    className="px-1.5 py-0.5 text-[10px] text-sky-700 hover:underline border-l border-slate-200 font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Workbench"}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              {/* Links */}
              <Link
                href="/tests"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Catalogue
              </Link>

              <Link
                href="/orders"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-2xs transition"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Orders Worklist
              </Link>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {publishSuccessToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-3 text-xs animate-in slide-in-from-bottom duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{publishSuccessToast}</span>
          </div>
        )}

        {/* Controlled Catalogue Entry Banner (Ultra Clean Light Slate) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-600 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <span>
              <strong className="text-slate-900">Controlled Diagnostic Catalogue Entry:</strong> Complete definition, vacutainer SOP, analytes &amp; tariff matrix before publishing to live hospital orders.
            </span>
          </div>
          <span className="hidden sm:inline-flex text-[10px] font-mono font-semibold text-slate-500">
            LIS Release v3.0 &bull; NABL Standard
          </span>
        </div>

        {/* 4-Step Progress Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {steps.map((st) => {
            const isActive = activeTab === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveTab(st.id as typeof activeTab)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isActive
                    ? "bg-sky-50/70 border-sky-300 shadow-xs ring-1 ring-sky-300/60"
                    : "bg-white hover:bg-slate-50 border-slate-200 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Step 0{st.stepNum}
                  </span>
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black ${
                      st.complete
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {st.complete ? <Check className="w-2.5 h-2.5" /> : st.stepNum}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 truncate">{st.title}</div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{st.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Validation Error Alert */}
        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-900 mb-5 flex items-center gap-2.5 shadow-2xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <div>
              <strong className="font-bold">Clinical Requirement Missing: </strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* =====================================================================
            TWO-COLUMN CLINICAL CONFIGURATION STUDIO WORKSPACE
            Left (65%): Active Step Form Workspace
            Right (35%): Live CPOE Prescription Preview & Thermal Barcode Sticker
        ====================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: 4 CONFIGURATION STEPS (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Step Navigation Pill Strip */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto">
              {[
                { id: "general", label: "1. Definition & LOINC", icon: Tag },
                { id: "specimen", label: "2. Vacutainer SOP", icon: TestTube2 },
                { id: "parameters", label: `3. Analytes (${parameters.length})`, icon: Sliders },
                { id: "pricing", label: "4. Tariff Matrix", icon: DollarSign },
              ].map((tab) => {
                const isSelected = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                      isSelected
                        ? "bg-white text-sky-900 font-bold shadow-xs border border-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-sky-600" : "text-slate-400"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={(e) => handleSubmit(e, false)}>
              {/* ===============================================================
                  STEP 1: INVESTIGATION IDENTIFICATION & CLINICAL TAXONOMY
              ================================================================ */}
              {activeTab === "general" && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-sky-600" />
                      <span>Investigation Identification &amp; Clinical Discipline</span>
                    </h2>
                    <span className="text-[11px] font-mono text-slate-400">Step 1 of 4</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Test Code */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Investigation / LIS Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.testCode}
                        onChange={(e) => setFormData({ ...formData, testCode: e.target.value.toUpperCase() })}
                        placeholder="e.g. CBC, KFT, TSH, LIPID"
                        className="w-full font-mono font-bold text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500 transition"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Unique barcode key and analyzer interface identifier
                      </span>
                    </div>

                    {/* Full Investigation Name */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Full Investigation Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.testName}
                        onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                        placeholder="e.g. Complete Blood Count with 5-Part Differential"
                        className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500 transition"
                      />
                    </div>

                    {/* Short Alias */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Short Name / Prescription Alias
                      </label>
                      <input
                        type="text"
                        value={formData.shortName || ""}
                        onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                        placeholder="e.g. Hemogram, CBC"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500 transition"
                      />
                    </div>

                    {/* Department / Category */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Department / Clinical Discipline
                      </label>
                      <select
                        value={formData.processingDepartment || "Hematology"}
                        onChange={(e) => setFormData({ ...formData, processingDepartment: e.target.value })}
                        className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500 transition"
                      >
                        <option value="Hematology">Central Automated Hematology</option>
                        <option value="Biochemistry">Clinical Biochemistry &amp; Immunoassay</option>
                        <option value="Microbiology">Microbiology &amp; Serology</option>
                        <option value="Endocrinology">Hormones &amp; Endocrinology</option>
                        <option value="Coagulation">Hemostasis &amp; Coagulation</option>
                        <option value="Clinical Pathology">Clinical Pathology &amp; Urinalysis</option>
                        <option value="Molecular Biology">Molecular Diagnostics / PCR</option>
                      </select>
                    </div>

                    {/* Analytical Methodology */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Analytical Methodology / Principle
                      </label>
                      <input
                        type="text"
                        value={formData.method || ""}
                        onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                        placeholder="e.g. Automated Semiconductor Flow Cytometry, CLIA, HPLC"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500 transition"
                      />
                    </div>

                    {/* Display Order */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Report Sequence Number
                      </label>
                      <input
                        type="number"
                        value={formData.displayOrder || 1}
                        onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                        className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500 transition"
                      />
                    </div>
                  </div>

                  {/* Clinical Significance & Indication */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Clinical Significance &amp; Pathological Indications
                    </label>
                    <textarea
                      rows={3}
                      value={formData.clinicalSignificance || ""}
                      onChange={(e) => setFormData({ ...formData, clinicalSignificance: e.target.value })}
                      placeholder="Diagnostic value, medical relevance, pre-test clinical considerations for physicians..."
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500 transition"
                    />
                  </div>

                  {/* Step Action Buttons */}
                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveTab("specimen")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                    >
                      <span>Proceed to Vacutainer SOP</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ===============================================================
                  STEP 2: VACUTAINER SPECIMEN COLLECTION & COLD CHAIN SOP
              ================================================================ */}
              {activeTab === "specimen" && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <TestTube2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>Vacutainer Specimen Collection &amp; Phlebotomy SOP</span>
                    </h2>
                    <span className="text-[11px] font-mono text-slate-400">Step 2 of 4</span>
                  </div>

                  {/* Vacutainer Tube Cap Picker (Hospital Standard) */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Standard CLSI Vacutainer Cap Picker (Click to Select)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                      {TUBE_OPTIONS.map((tube) => {
                        const isChosen = formData.sampleContainer === tube.container;
                        return (
                          <div
                            key={tube.label}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                sampleContainer: tube.container,
                                sampleType: tube.sampleType as SampleType,
                              })
                            }
                            className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                              isChosen
                                ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-sky-400/50"
                                : "bg-white hover:bg-slate-50 border-slate-200"
                            }`}
                          >
                            <span
                              className="w-5 h-5 rounded-full mx-auto block mb-1.5 shadow-xs ring-1 ring-black/10"
                              style={{ backgroundColor: tube.color }}
                            ></span>
                            <span className="text-[11px] font-bold block truncate">{tube.label}</span>
                            <span className="text-[9px] opacity-75 font-mono block truncate">
                              {tube.sampleType}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tube Attributes Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Selected Container:</span>
                      <strong className="text-slate-900 text-xs">{selectedTube.container}</strong>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{selectedTube.desc}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Additive / Anticoagulant:</span>
                      <strong className="text-slate-800 text-xs">{selectedTube.additive}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Biological Matrix:</span>
                      <strong className="text-sky-700 font-mono text-xs">{selectedTube.sampleType}</strong>
                    </div>
                  </div>

                  {/* Volume & Fasting Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Minimum Specimen Volume
                      </label>
                      <input
                        type="text"
                        value={formData.sampleVolume || "2.0 mL"}
                        onChange={(e) => setFormData({ ...formData, sampleVolume: e.target.value })}
                        placeholder="e.g. 2.5 mL, 3.0 mL"
                        className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Cold-Chain Stability
                      </label>
                      <select className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500 transition">
                        <option>Refrigerated (2°C - 8°C) up to 48 hours</option>
                        <option>Room Temperature (20°C - 25°C) 4 hours</option>
                        <option>Frozen (-20°C) up to 30 days</option>
                        <option>Immediate Centrifugation &amp; Separation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Patient Preparation Requirement
                      </label>
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="fasting"
                          checked={Boolean(formData.patientPreparation && formData.patientPreparation.includes("Fasting"))}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              patientPreparation: e.target.checked
                                ? "10-12 Hours Overnight Fasting Required"
                                : "No specific fasting required",
                            })
                          }
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <label htmlFor="fasting" className="text-xs font-bold text-slate-800 cursor-pointer">
                          10-12 Hours Overnight Fasting Required
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Step Action Buttons */}
                  <div className="flex justify-between pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveTab("general")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-2xs transition"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Back to Definition
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("parameters")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                    >
                      <span>Proceed to Analytes Matrix</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ===============================================================
                  STEP 3: ANALYTE SUB-PARAMETERS & BIOLOGICAL INTERVALS
              ================================================================ */}
              {activeTab === "parameters" && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <Sliders className="w-3.5 h-3.5 text-blue-600" />
                        <span>Discrete Analytes &amp; Biological Reference Intervals</span>
                      </h2>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Define measured parameters, LOINC codes, SI units, and normal/panic bounds
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddParameter}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Analyte
                    </button>
                  </div>

                  {/* List of Parameters */}
                  <div className="space-y-3">
                    {parameters.map((param, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 relative group transition hover:border-slate-300"
                      >
                        {/* Header Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-5 w-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              Analyte #{idx + 1}: {param.parameterName || "Untitled"}
                            </span>
                          </div>
                          {parameters.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveParameter(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                              title="Delete Analyte"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Parameter Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                              Analyte Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={param.parameterName}
                              onChange={(e) => handleParameterChange(idx, "parameterName", e.target.value)}
                              placeholder="e.g. Hemoglobin, Serum Creatinine"
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 transition"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                              Measuring Unit
                            </label>
                            <select
                              value={param.unit}
                              onChange={(e) => handleParameterChange(idx, "unit", e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500 transition"
                            >
                              {COMMON_UNITS.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                              LOINC Code
                            </label>
                            <input
                              type="text"
                              value={param.loincCode || ""}
                              onChange={(e) => handleParameterChange(idx, "loincCode", e.target.value)}
                              placeholder="e.g. 718-7, 2160-0"
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-sky-500 transition"
                            />
                          </div>
                        </div>

                        {/* Reference Intervals Row */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                              Male Normal (Low - High)
                            </span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                step="any"
                                value={param.maleLow ?? ""}
                                onChange={(e) => handleParameterChange(idx, "maleLow", parseFloat(e.target.value))}
                                placeholder="Low"
                                className="w-1/2 p-1.5 border border-slate-300 rounded text-xs font-mono"
                              />
                              <span className="text-slate-400">-</span>
                              <input
                                type="number"
                                step="any"
                                value={param.maleHigh ?? ""}
                                onChange={(e) => handleParameterChange(idx, "maleHigh", parseFloat(e.target.value))}
                                placeholder="High"
                                className="w-1/2 p-1.5 border border-slate-300 rounded text-xs font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                              Female Normal (Low - High)
                            </span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                step="any"
                                value={param.femaleLow ?? ""}
                                onChange={(e) => handleParameterChange(idx, "femaleLow", parseFloat(e.target.value))}
                                placeholder="Low"
                                className="w-1/2 p-1.5 border border-slate-300 rounded text-xs font-mono"
                              />
                              <span className="text-slate-400">-</span>
                              <input
                                type="number"
                                step="any"
                                value={param.femaleHigh ?? ""}
                                onChange={(e) => handleParameterChange(idx, "femaleHigh", parseFloat(e.target.value))}
                                placeholder="High"
                                className="w-1/2 p-1.5 border border-slate-300 rounded text-xs font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <span className="block text-[10px] font-bold uppercase text-red-600 mb-1">
                              Critical Panic Low (≤)
                            </span>
                            <input
                              type="number"
                              step="any"
                              value={param.criticalLow ?? ""}
                              onChange={(e) => handleParameterChange(idx, "criticalLow", parseFloat(e.target.value))}
                              placeholder="e.g. 7.0"
                              className="w-full p-1.5 border border-red-300 bg-red-50/50 rounded text-xs font-mono text-red-950"
                            />
                          </div>

                          <div>
                            <span className="block text-[10px] font-bold uppercase text-red-600 mb-1">
                              Critical Panic High (≥)
                            </span>
                            <input
                              type="number"
                              step="any"
                              value={param.criticalHigh ?? ""}
                              onChange={(e) => handleParameterChange(idx, "criticalHigh", parseFloat(e.target.value))}
                              placeholder="e.g. 20.0"
                              className="w-full p-1.5 border border-red-300 bg-red-50/50 rounded text-xs font-mono text-red-950"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Step Action Buttons */}
                  <div className="flex justify-between pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveTab("specimen")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-2xs transition"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Back to Specimen SOP
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("pricing")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                    >
                      <span>Proceed to Tariff Matrix</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ===============================================================
                  STEP 4: DIAGNOSTIC TARIFFS, DOCTOR MARGINS & TAT SLA
              ================================================================ */}
              {activeTab === "pricing" && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Diagnostic Tariff Schedule, Referrals &amp; TAT SLA</span>
                    </h2>
                    <span className="text-[11px] font-mono text-slate-400">Step 4 of 4</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Patient MRP */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Patient MRP (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.price || ""}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        placeholder="e.g. 450"
                        className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500 transition"
                      />
                    </div>

                    {/* Offer Price */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Offer / Cash Discounted Rate (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.offerPrice || ""}
                        onChange={(e) => setFormData({ ...formData, offerPrice: Number(e.target.value) })}
                        placeholder="e.g. 380"
                        className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500 transition"
                      />
                    </div>

                    {/* Doctor B2B Referral Rate */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Doctor / B2B Referral Base (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.b2bRate || ""}
                        onChange={(e) => setFormData({ ...formData, b2bRate: Number(e.target.value) })}
                        placeholder="e.g. 300"
                        className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500 transition"
                      />
                    </div>
                  </div>

                  {/* TAT SLA Configuration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Turnaround Time SLA (Hours) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.tatHours || ""}
                        onChange={(e) => setFormData({ ...formData, tatHours: Number(e.target.value) })}
                        placeholder="e.g. 4"
                        className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Receipt SLA Display Label
                      </label>
                      <input
                        type="text"
                        value={formData.tatDisplay || ""}
                        onChange={(e) => setFormData({ ...formData, tatDisplay: e.target.value })}
                        placeholder="e.g. Same Day (4 hours), 24 Hours"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-sky-500 transition"
                      />
                    </div>
                  </div>

                  {/* Active Switch */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <label htmlFor="isActive" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Publish Investigation in Diagnostic Catalogue (Available immediately for CPOE requisitions &amp; Billing)
                    </label>
                  </div>

                  {/* Step Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveTab("parameters")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-2xs transition"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Back to Analytes
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSubmit(undefined, true)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-2xs transition disabled:opacity-50"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span>Publish &amp; Open in Orders</span>
                      </button>

                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span>Publishing Investigation...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Register &amp; Publish Investigation</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* ===================================================================
              RIGHT COLUMN: LIVE CLINICAL CPOE ORDER PREVIEW & THERMAL BARCODE
          ==================================================================== */}
          <div className="lg:col-span-4 space-y-4">
            <div className="sticky top-4 space-y-4">
              {/* Card 1: CPOE Prescription & Requisition Live Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-sky-600" />
                    <span>Live CPOE Order Preview</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-bold">
                    {formData.testCode || "NOT_CONFIGURED"}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {formData.testName || "Investigation name not configured"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>{formData.shortName || "No alias"}</span>
                    <span>&bull;</span>
                    <span className="font-semibold text-sky-700">{formData.processingDepartment}</span>
                  </div>
                </div>

                {/* Pricing & TAT Pill */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Patient Price</span>
                    <span className="text-base font-extrabold text-slate-900 font-mono">
                      {baseMRP > 0 ? `₹${hasDiscount ? offerPrice : baseMRP}` : "Not configured"}
                    </span>
                    {hasDiscount && (
                      <span className="text-[10px] text-slate-400 line-through ml-1.5 font-bold font-mono">
                        ₹{baseMRP}
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">TAT SLA</span>
                    <span className="text-xs font-bold text-amber-700 flex items-center gap-1 font-mono">
                      <Clock3 className="w-3 h-3" />
                      <span>{formData.tatDisplay || `${formData.tatHours}h`}</span>
                    </span>
                  </div>
                </div>

                {/* Sub-Parameters & Container Details */}
                <div className="space-y-1.5 text-[11px] text-slate-600 border-t border-slate-100 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span>Configured Analytes:</span>
                    <strong className="text-slate-900 font-mono">{parameters.length} Parameters</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Specimen Tube:</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block shadow-xs"
                        style={{ backgroundColor: selectedTube.color }}
                      ></span>
                      <strong className="text-slate-900">{selectedTube.label}</strong>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Methodology:</span>
                    <span className="text-slate-700 truncate max-w-[160px] font-medium">
                      {formData.method || "Not defined"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Authentic 2.0" x 1.0" Thermal Specimen Barcode Sticker */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                    <Barcode className="w-3.5 h-3.5 text-purple-600" />
                    <span>Specimen Barcode Sticker</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">2.0" × 1.0" Thermal</span>
                </div>

                {/* Simulated Physical Thermal Barcode Label */}
                <div className="rounded-lg border-2 border-slate-300 bg-white p-3 shadow-inner relative overflow-hidden font-mono text-slate-900">
                  {/* Color Tube Strip at top */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: selectedTube.color }}
                  ></div>

                  <div className="pt-1 flex items-start justify-between text-[10px]">
                    <div>
                      <strong className="block text-[11px] font-bold text-slate-900 truncate max-w-[150px]">
                        {formData.testCode || "CODE"}: {formData.shortName || formData.testName || "Investigation"}
                      </strong>
                      <span className="text-[9px] text-slate-500">
                        DOE, JOHN &bull; 45Y/M &bull; UHID-90218
                      </span>
                    </div>
                    <span className="text-[9px] font-bold uppercase px-1 rounded bg-slate-100 border border-slate-300">
                      {selectedTube.sampleType}
                    </span>
                  </div>

                  {/* Barcode Graphic Simulation */}
                  <div className="my-2 text-center">
                    <div className="inline-flex items-center gap-0.5 h-7">
                      {[1, 2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1].map((w, i) => (
                        <span
                          key={i}
                          className="bg-slate-900 h-full inline-block"
                          style={{ width: `${w * 1.5}px` }}
                        ></span>
                      ))}
                    </div>
                    <div className="text-[10px] tracking-widest font-bold text-slate-800">
                      *{(formData.testCode || "SMP").replace(/\s+/g, "")}-7729104*
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-slate-500 border-t border-dashed border-slate-300 pt-1">
                    <span>APEX DIAGNOSTICS &bull; LAB-04A</span>
                    <span>{formData.sampleVolume || "2.0 mL"}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: NABL Clinical Publication Audit Checklist */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                    Catalogue Publication Readiness
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      allStepsComplete
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    {allStepsComplete ? "100% Ready to Publish" : "In Progress"}
                  </span>
                </div>

                <div className="space-y-1 text-[11px]">
                  {steps.map((st) => (
                    <div key={st.id} className="flex items-center justify-between text-slate-600">
                      <span className="truncate">{st.title}</span>
                      {st.complete ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-0.5 text-[10px]">
                          <Check className="w-3 h-3" /> Done
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Pending</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
