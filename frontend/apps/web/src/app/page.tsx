"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  User,
  Users,
  Building2,
  Stethoscope,
  Microscope,
  FlaskConical,
  Database,
  Cpu,
  Zap,
  Award,
  ArrowRight,
  ChevronRight,
  Download,
  FileText,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Headphones,
  Server,
  Wifi,
  Lock,
  KeyRound,
  QrCode,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
  Star,
  Sparkles,
  Smartphone,
  Printer,
  HeartPulse,
  AlertTriangle,
  Layers,
  Settings,
  Share2,
  Sliders,
  Radio,
  FileCheck,
  ArrowUpRight,
  RefreshCw,
  Bell,
  Heart,
  Eye,
  CheckCircle,
  BarChart3,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  Box,
  Compass,
  BadgeCheck
} from "lucide-react";

export default function HomePage() {
  // Facility mode switcher for Hero & Context
  const [selectedFacility, setSelectedFacility] = useState<"hospital" | "pathlab" | "clinic" | "bloodbank">("pathlab");

  // Navigation & Modal States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [activeLegalTab, setActiveLegalTab] = useState<"terms" | "privacy" | "sla" | "compliance">("terms");
  const [activeFeatureTab, setActiveFeatureTab] = useState<"lis" | "opd" | "delta" | "abdm" | "logistics" | "qc">("lis");
  const [selectedMachineCategory, setSelectedMachineCategory] = useState<"all" | "hematology" | "biochemistry" | "immunology" | "electrolytes">("all");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPreviewReportOpen, setIsPreviewReportOpen] = useState(false);

  // Interactive Live Analyzer Simulation State
  const [simulatedSamples, setSimulatedSamples] = useState([
    {
      id: "LC-9821",
      patient: "Rajesh Kumar (42/M)",
      uhid: "UHID-2026-0814",
      test: "Complete Hemogram (CBC 24-Param)",
      analyzer: "Sysmex XN-550 (HL7)",
      value: "Hb 14.6 g/dL • WBC 7,200 /μL • Plt 2.4L",
      status: "Verified",
      delta: "Normal (No shift)",
      time: "Just now",
      critical: false
    },
    {
      id: "LC-9822",
      patient: "Anita Sharma (35/F)",
      uhid: "UHID-2026-0815",
      test: "Liver Function Profile (LFT)",
      analyzer: "Roche Cobas c311 (ASTM)",
      value: "SGPT/ALT 32 U/L • Bilirubin 0.8 mg/dL",
      status: "Transmitting",
      delta: "Stable",
      time: "1 min ago",
      critical: false
    },
    {
      id: "LC-9823",
      patient: "Ramesh Patel (68/M)",
      uhid: "UHID-2026-0812",
      test: "Serum Electrolytes & Renal Panel",
      analyzer: "Mindray BS-430 (Bi-Dir)",
      value: "Potassium 6.8 mEq/L ⬆ (CRITICAL HIGH)",
      status: "STAT Panic Alert",
      delta: "Delta Spike +2.4 mEq/L vs Baseline",
      time: "3 min ago",
      critical: true
    }
  ]);
  const [isSimulating, setIsSimulating] = useState(false);

  // ROI / Pricing Calculator States
  const [calcSamples, setCalcSamples] = useState<number>(150);
  const [calcAnalyzers, setCalcAnalyzers] = useState<number>(2);
  const [calcBranches, setCalcBranches] = useState<number>(1);

  // Demo Form State
  const [demoForm, setDemoForm] = useState({
    name: "",
    phone: "",
    facilityName: "",
    facilityType: "Diagnostic Pathology Lab",
    city: "",
    notes: ""
  });
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  // Toast trigger
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Simulate new sample accessioning & machine run
  const runSampleSimulation = () => {
    setIsSimulating(true);
    triggerToast("🔍 Scanning barcode tube #LC-9825... Querying bi-directional ASTM analyzer rack...");
    setTimeout(() => {
      const samplePool = [
        {
          id: `LC-${Math.floor(9824 + Math.random() * 80)}`,
          patient: "Vikram Malhotra (49/M)",
          uhid: "UHID-2026-0819",
          test: "High Sensitivity Troponin-I & CK-MB",
          analyzer: "Beckman Coulter Access 2",
          value: "hs-cTnI: 0.012 ng/mL (Normal Baseline)",
          status: "Auto-Verified",
          delta: "Baseline Matched",
          time: "Just now",
          critical: false
        },
        {
          id: `LC-${Math.floor(9900 + Math.random() * 50)}`,
          patient: "Sunita Verma (56/F)",
          uhid: "UHID-2026-0820",
          test: "Glycated Hemoglobin (HbA1c HPLC)",
          analyzer: "Bio-Rad D-10 (ASTM)",
          value: "HbA1c: 6.4% (Pre-diabetic target)",
          status: "Verified",
          delta: "-0.6% vs Last Quarter",
          time: "Just now",
          critical: false
        }
      ];
      const newSample = samplePool[Math.floor(Math.random() * samplePool.length)];
      setSimulatedSamples((prev) => [newSample, ...prev.slice(0, 3)]);
      setIsSimulating(false);
      triggerToast("✅ Barcode mapped! Results ingested via ASTM & WhatsApp QR Report dispatched!");
    }, 1600);
  };

  // Dynamic Pricing Calculation
  const calculatedPricing = useMemo(() => {
    let baseRent = 1999;
    if (calcSamples > 80 && calcSamples <= 300) baseRent = 4999;
    else if (calcSamples > 300 && calcSamples <= 800) baseRent = 11999;
    else if (calcSamples > 800) baseRent = 21999;

    const analyzerAddon = calcAnalyzers * 1000;
    const branchAddon = (calcBranches - 1) * 2000;

    let monthlyTotal = baseRent + analyzerAddon + branchAddon;
    if (billingCycle === "yearly") {
      monthlyTotal = Math.round(monthlyTotal * 0.8); // 20% discount
    }

    let setupFee = 3999;
    if (calcAnalyzers > 0) setupFee = 9999;
    if (calcBranches > 1) setupFee += (calcBranches - 1) * 4000;

    const hoursSaved = Math.round(calcSamples * 26 * 0.09);
    const moneySaved = Math.round(hoursSaved * 250 + calcSamples * 26 * 6);

    return {
      monthlyTotal,
      setupFee,
      hoursSaved,
      moneySaved
    };
  }, [calcSamples, calcAnalyzers, calcBranches, billingCycle]);

  // Handle Demo Submission
  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoForm.name || !demoForm.phone) {
      triggerToast("Please provide your name and phone number.");
      return;
    }
    setDemoSubmitted(true);
    triggerToast("Thank you! Lead Architect Nikil & engineering team will contact you within 15 minutes.");
    setTimeout(() => {
      setIsDemoModalOpen(false);
      setDemoSubmitted(false);
      setDemoForm({
        name: "",
        phone: "",
        facilityName: "",
        facilityType: "Diagnostic Pathology Lab",
        city: "",
        notes: ""
      });
    }, 2800);
  };

  // Supported Analyzer Machines Database
  const analyzerCatalog = [
    {
      name: "Sysmex XN-550 / XN-350",
      category: "hematology",
      type: "5-Part Diff Hematology",
      protocol: "HL7 v2.5 / Bi-directional LAN",
      speed: "60 Samples / Hour",
      parameters: "CBC, WBC, RBC, HGB, PLT, RET"
    },
    {
      name: "Roche Cobas c311 / c501",
      category: "biochemistry",
      type: "Automated Clinical Chemistry",
      protocol: "ASTM E1381/E1394 Serial & IP",
      speed: "300 Photometric Tests / Hr",
      parameters: "LFT, KFT, Lipid, Glucose, Enzymes"
    },
    {
      name: "Mindray BC-6800 / BC-5150",
      category: "hematology",
      type: "5-Part + Body Fluid Analysis",
      protocol: "HL7 / ASTM Direct Socket",
      speed: "125 Samples / Hour",
      parameters: "WBC 5-Diff, NRBC, Reticulocytes"
    },
    {
      name: "Abbott Architect ci4100 / ci8200",
      category: "immunology",
      type: "Integrated Chem + Immunoassay",
      protocol: "ASTM / CLSI LIS2-A2 Bi-directional",
      speed: "Up to 900 Tests / Hr",
      parameters: "Thyroid, Hormones, Cardiac Markers"
    },
    {
      name: "Beckman Coulter Access 2 / DxC 700",
      category: "immunology",
      type: "Chemiluminescent Immunoassay",
      protocol: "ASTM E1394 Standard",
      speed: "100 Tests / Hour",
      parameters: "Troponin, Vitamin D, B12, PSA"
    },
    {
      name: "Radiometer ABL90 / ABL800",
      category: "electrolytes",
      type: "Blood Gas & Critical Care ABG",
      protocol: "HL7 Point-of-Care POCT1-A",
      speed: "Instant 35-sec results",
      parameters: "pH, pO2, pCO2, Lactate, K+, Na+, Cl-"
    }
  ];

  const filteredMachines = useMemo(() => {
    if (selectedMachineCategory === "all") return analyzerCatalog;
    return analyzerCatalog.filter((m) => m.category === selectedMachineCategory);
  }, [selectedMachineCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-sky-500 selection:text-white">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* TOAST NOTIFICATION BANNER (CRISP MEDICAL CARD) */}
      {/* ─────────────────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-slate-900 px-5 py-4 rounded-2xl shadow-2xl border-2 border-sky-500 flex items-center space-x-3 max-w-md animate-in slide-in-from-bottom duration-300">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold leading-snug">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-700 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. TOP CLINICAL TICKER (PROFESSIONAL MEDICAL LIGHT BAR) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white text-slate-700 text-xs py-2 px-4 border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          {/* Left: Emergency Status & Helplines */}
          <div className="flex items-center space-x-3 overflow-x-auto text-nowrap">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              24/7 CLINICAL STAT IT HELPDESK
            </span>
            <span className="text-slate-600">
              Emergency Medical IT Hotline: <strong className="text-slate-900 font-mono text-sm tracking-wide">+91 98765 43210</strong> (15-Min Guaranteed SLA)
            </span>
            <span className="hidden lg:inline text-slate-300">•</span>
            <span className="hidden lg:inline text-sky-700 font-semibold">
              Toll-Free: <strong>1800-LAB-CORE</strong>
            </span>
          </div>

          {/* Right: Accreditations & Founder Direct Desk */}
          <div className="flex items-center space-x-4 shrink-0 text-slate-600 text-[11px]">
            <a
              href="https://wa.me/919876543210?text=Hello%20Nikil%2C%20I%20am%20interested%20in%20NIKIL-LABCORE-ELIS-OS%20for%20our%20medical%20facility."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-bold transition-colors bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp Lead Architect Nikil
            </a>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => {
                setActiveLegalTab("sla");
                setIsTermsModalOpen(true);
              }}
              className="hover:text-sky-700 font-semibold transition-colors text-slate-600"
            >
              99.999% SLA Charter
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              v4.2 Enterprise Suite
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. MAIN NAVIGATION (CRISP MEDICAL LIGHT WHITE & HOSPITAL BRANDING) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo & Medical Cross Symbol */}
          <Link href="/" className="flex items-center space-x-3.5 group">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-teal-500 flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <div className="relative text-white flex items-center justify-center">
                <HeartPulse className="w-6 h-6 stroke-[2.4]" />
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-2xs"></div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-xl tracking-tight text-slate-900 group-hover:text-sky-700 transition-colors">
                  NIKIL<span className="text-sky-600 font-black">-LABCORE</span>
                </span>
                <span className="text-[10px] uppercase font-black tracking-wider bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md border border-sky-200">
                  ELIS™ OS
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 hidden sm:inline">
                  NABL • ABDM M3
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 tracking-wide">
                Unified Hospital, Diagnostic Pathology & Clinic Operating System
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center space-x-6 text-sm font-bold text-slate-600">
            <a href="#facility-selector" className="hover:text-sky-600 transition-colors flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-sky-500" />
              <span>Facility Solutions</span>
            </a>
            <a href="#modules" className="hover:text-sky-600 transition-colors flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Clinical Modules</span>
            </a>
            <a href="#interactive-workstation" className="hover:text-sky-600 transition-colors flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>Live Workstation</span>
            </a>
            <a href="#analyzers" className="hover:text-sky-600 transition-colors flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-500" />
              <span>Analyzers & Machines</span>
            </a>
            <a href="#pricing" className="hover:text-sky-600 transition-colors flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pricing & ROI</span>
            </a>
            <a href="#compliance" className="hover:text-sky-600 transition-colors flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Accreditation</span>
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Staff / Doctor Login Trigger */}
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-2xs transition-all hover:border-sky-400"
            >
              <Lock className="w-4 h-4 text-sky-600" />
              <span>Staff & Doctor Login</span>
            </button>

            {/* Book Live Demo */}
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Live Demo</span>
            </button>
          </div>

          {/* Mobile Hamburger */}
          <div className="flex xl:hidden items-center space-x-2">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-50 text-sky-700 border border-sky-200"
            >
              Login
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-xl">
            <a
              href="#facility-selector"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-700 hover:text-sky-600"
            >
              Facility Solutions (Hospital / Lab / Clinic)
            </a>
            <a
              href="#modules"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-700 hover:text-sky-600"
            >
              Clinical Modules & Architecture
            </a>
            <a
              href="#interactive-workstation"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-700 hover:text-sky-600"
            >
              Interactive Workstation Simulation
            </a>
            <a
              href="#analyzers"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-700 hover:text-sky-600"
            >
              Supported Analyzers & Machines
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-700 hover:text-sky-600"
            >
              Monthly Rent & ROI Calculator
            </a>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl border border-slate-300 font-bold text-sm text-slate-800"
              >
                Staff / Doctor Login
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsDemoModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-sky-600 text-white font-extrabold text-sm shadow-md"
              >
                Book 30-Min Live Demo
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. HERO BANNER: PROFESSIONAL LIGHT WHITE CLINICAL THEME */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section id="facility-selector" className="relative overflow-hidden pt-10 pb-20 lg:pt-14 lg:pb-24 bg-gradient-to-b from-sky-50/60 via-white to-slate-50 medical-grid-bg">
        {/* Subtle Decorative Ambient Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-40">
          <div className="absolute top-10 left-10 w-80 h-80 bg-sky-200/50 rounded-full blur-3xl"></div>
          <div className="absolute top-32 right-10 w-96 h-96 bg-teal-100/60 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Facility Mode Selector Pill Bar */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm gap-1.5 flex-wrap justify-center">
              <button
                onClick={() => setSelectedFacility("pathlab")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  selectedFacility === "pathlab"
                    ? "bg-sky-600 text-white shadow-md shadow-sky-600/25"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Microscope className="w-4 h-4" />
                <span>Diagnostic Pathology Lab</span>
              </button>
              <button
                onClick={() => setSelectedFacility("hospital")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  selectedFacility === "hospital"
                    ? "bg-sky-600 text-white shadow-md shadow-sky-600/25"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Multi-Specialty Hospital (OPD/IPD/OT)</span>
              </button>
              <button
                onClick={() => setSelectedFacility("clinic")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  selectedFacility === "clinic"
                    ? "bg-sky-600 text-white shadow-md shadow-sky-600/25"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Polyclinic & Daycare Practice</span>
              </button>
              <button
                onClick={() => setSelectedFacility("bloodbank")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  selectedFacility === "bloodbank"
                    ? "bg-sky-600 text-white shadow-md shadow-sky-600/25"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <span>Blood Bank & Transfusion Unit</span>
              </button>
            </div>
          </div>

          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Top Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white border border-sky-200 text-sky-800 text-xs font-extrabold shadow-xs">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Architected by Nikil • Clinical Operating System Release v4.2</span>
              <span className="bg-sky-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                ENTERPRISE
              </span>
            </div>

            {/* Dynamic Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Next-Generation Healthcare OS for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-teal-600 to-cyan-600">
                {selectedFacility === "hospital" && "Multi-Specialty Hospitals & EMR"}
                {selectedFacility === "pathlab" && "Diagnostic Pathology & Clinical Labs"}
                {selectedFacility === "clinic" && "Polyclinics, Doctors & Collection Hubs"}
                {selectedFacility === "bloodbank" && "Blood Banks & Component Centers"}
              </span>
            </h1>

            {/* Dynamic Sub-description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto font-normal">
              {selectedFacility === "pathlab" && (
                <>
                  Eliminate 100% of clerical transcription errors with <strong className="text-slate-900 font-bold">Bi-directional ASTM/HL7 analyzer interfacing</strong>. 
                  Accession barcodes, auto-execute Levey-Jennings QC with Westgard rules, enforce NABL ISO 15189 digital approvals, and deliver password-protected WhatsApp PDF reports in under 1.2 seconds.
                </>
              )}
              {selectedFacility === "hospital" && (
                <>
                  Synchronize OPD token queues, IPD bed occupancy matrices, ICU vitals telemetry, OT schedules, and nursing care plans. 
                  Built with integrated ABDM M1-M3 national health records, Ayushman Bharat cashless billing, and automated ICD-10 discharge summaries.
                </>
              )}
              {selectedFacility === "clinic" && (
                <>
                  Empower consulting doctors with sub-second digital prescriptions, instant WhatsApp test requisitions, smart appointment scheduling, 
                  and integrated sample collection logistics for referral laboratories.
                </>
              )}
              {selectedFacility === "bloodbank" && (
                <>
                  Maintain zero-error donor registries, serological screening matrices, crossmatch tracking, component separation, and temperature-logged cold storage logistics.
                </>
              )}
            </p>

            {/* Primary Action Button Cluster */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-black text-base shadow-lg shadow-sky-600/25 transition-all hover:scale-105 active:scale-95 flex items-center space-x-2.5"
              >
                <Calendar className="w-5 h-5" />
                <span>Book Free Live Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-base border border-slate-300 shadow-sm transition-all hover:border-sky-400 flex items-center space-x-2"
              >
                <Lock className="w-5 h-5 text-sky-600" />
                <span>Staff & Doctor Login</span>
              </button>

              <a
                href="#pricing"
                className="px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base transition-all flex items-center space-x-2"
              >
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Monthly Rent & Setup</span>
              </a>

              <a
                href="https://wa.me/919876543210?text=Hello%20Nikil%2C%20please%20send%20details%20about%20NIKIL-LABCORE-ELIS-OS%20pricing."
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-base border border-emerald-200 transition-all flex items-center space-x-2"
              >
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <span>WhatsApp Quote</span>
              </a>
            </div>

            {/* Regulatory Accreditations Strip (Hospital Grade White) */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                NABL (ISO 15189:2022) Compliant
              </span>
              <span className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <Award className="w-4 h-4 text-sky-600" />
                NABH Digital Hospital Certified
              </span>
              <span className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                ABDM National Gateway (M1, M2, M3)
              </span>
              <span className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <Cpu className="w-4 h-4 text-indigo-600" />
                65+ Bi-Directional Analyzers
              </span>
              <span className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <Clock className="w-4 h-4 text-amber-600" />
                99.999% High Availability SLA
              </span>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 4. HERO LIVE TELEMETRY & WORKSTATION (CRISP MEDICAL LIGHT WHITE) */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div id="interactive-workstation" className="mt-12 max-w-5xl mx-auto rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            {/* Clinical Top Window Bar (Crisp Light Medical Steel) */}
            <div className="bg-slate-100 text-slate-800 px-5 py-3.5 flex flex-wrap items-center justify-between border-b border-slate-200 gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="ml-2 text-xs font-mono font-bold text-slate-700 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-sky-600" />
                  NIKIL-LABCORE-ELIS-OS // Live Clinical Station & Telemetry Monitor
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  4 ANALYZERS ONLINE (ASTM E1394 / HL7)
                </span>
                <span className="bg-white text-sky-700 px-2.5 py-1 rounded font-mono text-[11px] border border-slate-300 font-bold">
                  Station: LC-DELHI-CORE-01
                </span>
              </div>
            </div>

            {/* Dashboard Mockup Content */}
            <div className="p-5 sm:p-7 bg-white grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Live Sample Telemetry Queue */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-sky-600" />
                    Live Barcode Accessioning & Direct Machine Sync
                  </h3>
                  <button
                    onClick={runSampleSimulation}
                    disabled={isSimulating}
                    className="text-xs font-bold bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
                    <span>{isSimulating ? "Transmitting..." : "Simulate Sample Run"}</span>
                  </button>
                </div>

                {/* Live Sample Cards */}
                <div className="space-y-2.5">
                  {simulatedSamples.map((sample) => (
                    <div
                      key={sample.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        sample.critical
                          ? "bg-rose-50/90 border-rose-300 shadow-sm"
                          : "bg-slate-50/80 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-black bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-800">
                              {sample.id}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{sample.patient}</span>
                            <span className="text-[10px] font-mono text-slate-500">[{sample.uhid}]</span>
                          </div>
                          <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                            <span>{sample.test}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-sky-700 font-bold">{sample.analyzer}</span>
                          </div>
                          <div className="text-xs font-mono font-bold text-slate-800">
                            {sample.value}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-indigo-500" />
                            <span>Delta Check: {sample.delta}</span>
                          </div>
                        </div>

                        <div className="text-right space-y-1 shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
                              sample.critical
                                ? "bg-rose-600 text-white animate-pulse"
                                : sample.status === "Verified" || sample.status === "Auto-Verified"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-sky-100 text-sky-800 border border-sky-300"
                            }`}
                          >
                            {sample.critical && <AlertTriangle className="w-3 h-3" />}
                            {sample.status}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-medium">{sample.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Workstation Actions Bar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => setIsPreviewReportOpen(true)}
                    className="inline-flex items-center space-x-1.5 text-sky-700 hover:text-sky-800 font-bold bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Verified Patient Report & QR Code</span>
                  </button>

                  <Link
                    href="/dashboard"
                    className="inline-flex items-center space-x-1 font-bold text-slate-600 hover:text-slate-900"
                  >
                    <span>Open Full LIS Workstation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Right Col: Live Clinical Station Metrics */}
              <div className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-sky-600" />
                  Station Metrics Today
                </h4>

                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block">Bi-directional ASTM Ingestion</span>
                    <span className="text-xl font-black text-slate-900">100.0%</span>
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Zero Transcription Typos</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block">Average WhatsApp Delivery</span>
                    <span className="text-xl font-black text-slate-900">1.18 sec</span>
                    <span className="text-[10px] text-sky-600 font-semibold block mt-0.5">Password Encrypted PDF</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block">AI Delta Check Flags</span>
                    <span className="text-xl font-black text-amber-600">3 Alerts Flagged</span>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Doctor SMS Sent Immediately</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block">ABDM Health Record Gateway</span>
                    <span className="text-xl font-black text-emerald-600">Active M1, M2, M3</span>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Care Contexts Linked</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span>Request Live Setup at Your Lab</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. SIX CORE ENTERPRISE HEALTHCARE PILLARS (HOSPITAL, LAB, CLINIC) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section id="modules" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Enterprise Clinical Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Built for Total Hospital, Diagnostic Lab & Clinic Mastery
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Six synchronized intelligence engines running simultaneously to manage patient flow, bi-directional machinery, quality control, and national compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {/* Pillar 1 */}
            <div className="bg-slate-50/70 p-7 rounded-3xl border border-slate-200 hover:border-sky-400 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                Zero Typo Guarantee
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2 mb-2">
                Bi-Directional LIS Analyzer Engine
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Native ASTM E1381/E1394 and HL7 v2.x bi-directional interfacing. Barcode tube accessioning automatically programs the analyzer rack; results stream back with zero manual data entry.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700 font-semibold">
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Sysmex, Roche Cobas, Mindray, Abbott, Beckman</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Serial RS232, TCP/IP LAN & Cloud Gateway</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Sub-second transmission with auto-flagging</span>
                </li>
              </ul>
              <div className="mt-5 pt-4 border-t border-slate-200">
                <Link href="/analyzers" className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
                  Explore Analyzer Interfaces <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-slate-50/70 p-7 rounded-3xl border border-slate-200 hover:border-sky-400 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                Hospital HMIS
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2 mb-2">
                Hospital OPD, IPD & Bed Management
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Complete hospital management suite: dynamic token queue display, doctor EHR with fast digital prescription pad, real-time bed matrix, ICU nursing charts, and ICD-10 discharge summaries.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700 font-semibold">
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>OPD Token Queue with TV screen display</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>IPD Ward/Bed Matrix with real-time occupancy</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Cashless TPA, Ayushman Bharat & GST Billing</span>
                </li>
              </ul>
              <div className="mt-5 pt-4 border-t border-slate-200">
                <Link href="/doctors" className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                  View Hospital EMR Suite <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-slate-50/70 p-7 rounded-3xl border border-slate-200 hover:border-sky-400 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                Clinical Safety
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2 mb-2">
                AI Delta Checks & Critical Panic Alarms
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Clinical decision support engine that automatically compares every test result against the patient’s historical baseline. Instantly alerts duty doctors via SMS/WhatsApp on life-threatening panic values.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700 font-semibold">
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Historical Delta Check algorithm (&gt;20% shift alert)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Automated Critical Panic SMS/WhatsApp broadcast</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Reflex testing rules (e.g. CBC to peripheral smear)</span>
                </li>
              </ul>
              <div className="mt-5 pt-4 border-t border-slate-200">
                <Link href="/approvals" className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1">
                  See Approvals & Delta Logic <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="bg-slate-50/70 p-7 rounded-3xl border border-slate-200 hover:border-sky-400 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                National Compliance
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2 mb-2">
                ABDM National Health Gateway (M1-M3)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Fully accredited integration with the Ayushman Bharat Digital Mission (ABDM). Instant ABHA card creation via Aadhaar OTP, Scan-and-Share OPD tokens, and encrypted Care Context linking.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700 font-semibold">
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Instant 14-digit ABHA Creation (Aadhaar / Mobile)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Milestone 1, Milestone 2, and Milestone 3 ready</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Consent Manager & Encrypted FHIR Health Records</span>
                </li>
              </ul>
              <div className="mt-5 pt-4 border-t border-slate-200">
                <Link href="/abdm" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  Launch ABDM Gateway <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Pillar 5 */}
            <div className="bg-slate-50/70 p-7 rounded-3xl border border-slate-200 hover:border-sky-400 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                B2B Logistics
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2 mb-2">
                Phlebotomy & Cold-Chain Tracking
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Field phlebotomist mobile app with GPS route optimization, doorstep barcode labeling, cold-chain temperature monitoring, and central lab sample accessioning.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700 font-semibold">
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Doorstep barcode labeling & digital signature</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Runner bag temperature sensor tracking (2-8°C)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>B2B Collection Center tariff masters & auto-invoicing</span>
                </li>
              </ul>
              <div className="mt-5 pt-4 border-t border-slate-200">
                <Link href="/samples" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                  View Sample Accessioning <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Pillar 6 */}
            <div className="bg-slate-50/70 p-7 rounded-3xl border border-slate-200 hover:border-sky-400 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                Quality Assurance
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2 mb-2">
                NABL ISO 15189:2022 & QC Audit Shield
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Internal Quality Control (IQC) engine generating real-time Levey-Jennings charts with automated Westgard multi-rules evaluation (1-2s, 1-3s, 2-2s, R-4s, 10x). Complete CAPA corrective action logs.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700 font-semibold">
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Automated Levey-Jennings (L-J) plots per analyzer</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Westgard multi-rules evaluation & machine freeze</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Reagent lot expiry & temperature compliance records</span>
                </li>
              </ul>
              <div className="mt-5 pt-4 border-t border-slate-200">
                <Link href="/verify-report" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
                  Inspect Quality Verification <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 6. SUPPORTED ANALYZER MACHINES CATALOG */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section id="analyzers" className="py-20 bg-slate-50/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                Zero Clerical Error Hardware Hub
              </span>
              <h2 className="text-3xl font-black text-slate-900 mt-2">
                Bi-Directional Analyzers & Instrument Library
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Pre-configured ASTM E1381/E1394 and HL7 drivers for 65+ commercial laboratory instruments.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => setSelectedMachineCategory("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedMachineCategory === "all" ? "bg-sky-600 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Analyzers
              </button>
              <button
                onClick={() => setSelectedMachineCategory("hematology")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedMachineCategory === "hematology" ? "bg-sky-600 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Hematology
              </button>
              <button
                onClick={() => setSelectedMachineCategory("biochemistry")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedMachineCategory === "biochemistry" ? "bg-sky-600 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Biochemistry
              </button>
              <button
                onClick={() => setSelectedMachineCategory("immunology")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedMachineCategory === "immunology" ? "bg-sky-600 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Immunology
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMachines.map((m, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-lg transition-all space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {m.type}
                    </span>
                    <h4 className="text-base font-black text-slate-900 mt-1">{m.name}</h4>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Bi-Directional
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Protocol:</span>
                    <span className="font-mono font-bold text-slate-800">{m.protocol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Throughput:</span>
                    <span className="font-semibold text-slate-800">{m.speed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Parameters:</span>
                    <span className="font-semibold text-slate-800 text-right">{m.parameters}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDemoForm((prev) => ({ ...prev, notes: `Inquiry for ${m.name} machine interfacing.` }));
                    setIsDemoModalOpen(true);
                  }}
                  className="w-full mt-2 py-2 bg-slate-50 hover:bg-sky-50 text-sky-700 font-bold text-xs rounded-xl border border-slate-200 hover:border-sky-300 transition-all"
                >
                  Request Driver Cable Setup
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <h4 className="text-sm font-black text-slate-900">Don't see your analyzer model listed?</h4>
              <p className="text-xs text-slate-500">
                We custom-engineer ASTM E1381 and HL7 drivers for any clinical machine within 48 hours.
              </p>
            </div>
            <a
              href="https://wa.me/919876543210?text=Hello%20Nikil%2C%20I%20have%20an%20unlisted%20analyzer%20model%20and%20need%20interfacing."
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm text-nowrap shrink-0"
            >
              Check Machine Compatibility
            </a>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 7. TRANSPARENT PRICING & ROI ESTIMATOR */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Honest & Transparent Medical IT Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Flexible Monthly Rent • Zero Lock-In Contracts
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Run your hospital, pathology lab, or clinic with predictable monthly software rental. Full data ownership, free security updates, and dedicated 24/7 technical hotline.
            </p>

            {/* Billing Cycle Toggle */}
            <div className="flex justify-center pt-2">
              <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                    billingCycle === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    billingCycle === "yearly" ? "bg-sky-600 text-white shadow-sm" : "text-slate-600"
                  }`}
                >
                  <span>Annual Subscription</span>
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    SAVE 20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Tiers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Tier 1: Clinic / Small Lab */}
            <div className="bg-slate-50/70 p-8 rounded-3xl border border-slate-200 hover:border-sky-300 transition-all space-y-6">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-600">Starter Tier</span>
                <h3 className="text-xl font-black text-slate-900 mt-1">Doctor Clinic & Daycare</h3>
                <p className="text-xs text-slate-500 mt-1">Single doctor practice, OPD token desk, and patient EMR</p>
              </div>

              <div className="border-t border-b border-slate-200 py-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900">
                    ₹{billingCycle === "yearly" ? "1,599" : "1,999"}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">/ month</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">One-time setup: ₹3,999 (Includes staff training)</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Up to 80 Patients / Day</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Smart OPD Token Queue & TV Display</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Digital Prescription Pad & EHR</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>WhatsApp Prescription & Bill Dispatch</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>GST Billing & Daily Revenue Ledger</span>
                </li>
              </ul>

              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs border border-slate-300 shadow-2xs transition-all"
              >
                Choose Clinic Plan
              </button>
            </div>

            {/* Tier 2: Pathology Diagnostic Lab (Highlighted) */}
            <div className="bg-white p-8 rounded-3xl border-2 border-sky-500 shadow-xl relative space-y-6">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-sky-600 to-teal-600 text-white text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
                Most Popular for Diagnostic Labs
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-wider text-sky-700">Diagnostic Suite</span>
                <h3 className="text-xl font-black text-slate-900 mt-1">Pathology Lab (NABL Ready)</h3>
                <p className="text-xs text-slate-500 mt-1">Automated bi-directional analyzers & digital approvals</p>
              </div>

              <div className="border-t border-b border-slate-200 py-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900">
                    ₹{billingCycle === "yearly" ? "3,999" : "4,999"}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">/ month</span>
                </div>
                <span className="text-[11px] text-sky-700 font-bold block mt-1">Includes 2 Bi-directional Analyzers Setup</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 font-semibold">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Up to 300 Samples / Day</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>2 Bi-directional Analyzers Connected (ASTM / HL7)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>NABL ISO 15189 Quality Control & LJ Charts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pathologist Digital Signature & QR Verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sub-1.2s WhatsApp PDF Report Dispatch</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>B2B Collection Centers & Doctor Commission Ledger</span>
                </li>
              </ul>

              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md shadow-sky-600/30 transition-all hover:scale-[1.02]"
              >
                Start Lab Free Trial
              </button>
            </div>

            {/* Tier 3: Hospital Enterprise */}
            <div className="bg-slate-50/70 p-8 rounded-3xl border border-slate-200 hover:border-sky-300 transition-all space-y-6">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-teal-700">Enterprise HMIS</span>
                <h3 className="text-xl font-black text-slate-900 mt-1">Multi-Specialty Hospital</h3>
                <p className="text-xs text-slate-500 mt-1">Full-facility OPD, IPD, OT, Pharmacy & ABDM Gateway</p>
              </div>

              <div className="border-t border-b border-slate-200 py-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900">
                    ₹{billingCycle === "yearly" ? "9,999" : "11,999"}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">/ month</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">Unlimited doctor logins & ward terminals</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Unlimited Patients, OPD & IPD Beds</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Up to 6 Bi-directional Analyzers Connected</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ABDM Milestone 1, 2, 3 National Gateway</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>IPD Bed Matrix, Nursing Vitals & OT Scheduling</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cashless TPA Desk & Ayushman Bharat Claims</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dedicated 15-Minute Emergency SLA Support</span>
                </li>
              </ul>

              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all"
              >
                Deploy Hospital Suite
              </button>
            </div>
          </div>

          {/* Interactive Cost & ROI Estimator Slider */}
          <div className="bg-slate-50/80 p-8 sm:p-10 rounded-3xl border border-slate-200">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-sky-600">
                  Custom Volume Calculator
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  Estimate Your Monthly Rent & Operational Savings
                </h3>
                <p className="text-xs text-slate-500">
                  Slide according to your facility's daily sample volume, connected instruments, and branch network.
                </p>
              </div>

              <div className="space-y-5 pt-4">
                {/* Slider 1: Samples / Day */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                    <span>Daily Patient / Sample Volume:</span>
                    <span className="font-mono text-sm font-black text-sky-600">{calcSamples} Samples / Day</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="1000"
                    step="10"
                    value={calcSamples}
                    onChange={(e) => setCalcSamples(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>30 (Small Clinic)</span>
                    <span>300 (Active Diagnostic Lab)</span>
                    <span>1,000+ (Regional Hospital Hub)</span>
                  </div>
                </div>

                {/* Slider 2: Analyzers */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                    <span>Bi-directional Analyzers to Interface:</span>
                    <span className="font-mono text-sm font-black text-sky-600">{calcAnalyzers} Machines</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="1"
                    value={calcAnalyzers}
                    onChange={(e) => setCalcAnalyzers(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>0 (Manual Entry)</span>
                    <span>2 (CBC + Biochemistry)</span>
                    <span>8+ (Full Automated Line)</span>
                  </div>
                </div>

                {/* Slider 3: Branches */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                    <span>Collection Centers & Branches:</span>
                    <span className="font-mono text-sm font-black text-sky-600">{calcBranches} Location(s)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="1"
                    value={calcBranches}
                    onChange={(e) => setCalcBranches(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                </div>
              </div>

              {/* Dynamic Calculation Output Card */}
              <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                <div className="p-2">
                  <span className="text-[11px] font-bold text-slate-500 block">Estimated Monthly Rent</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    ₹{calculatedPricing.monthlyTotal.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{billingCycle} billing</span>
                </div>

                <div className="p-2 border-t sm:border-t-0 sm:border-l border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 block">Setup & Calibration</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    ₹{calculatedPricing.setupFee.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">One-time on-site/remote</span>
                </div>

                <div className="p-2 border-t sm:border-t-0 sm:border-l border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 block">Clerical Hours Saved</span>
                  <span className="text-2xl font-black text-emerald-600 font-mono">
                    ~{calculatedPricing.hoursSaved} hrs
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Per month via machine sync</span>
                </div>

                <div className="p-2 border-t sm:border-t-0 sm:border-l border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 block">Estimated Money Saved</span>
                  <span className="text-2xl font-black text-sky-600 font-mono">
                    ₹{calculatedPricing.moneySaved.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">In staff time & zero errors</span>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="px-8 py-3.5 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-black text-sm rounded-xl shadow-md transition-all hover:scale-105"
                >
                  Confirm Quote & Book Engineer Visit
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 8. CLINICAL COMPLIANCE & ACCREDITATIONS (HOSPITAL WHITE) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section id="compliance" className="py-20 bg-slate-50/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Regulatory Standards
            </span>
            <h2 className="text-3xl font-black text-slate-900">
              Audit-Ready for NABL, NABH & National Healthcare Mandates
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Engineered according to strict medical software and clinical laboratory information security standards.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-2 shadow-2xs">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-xs font-bold text-slate-900">NABL ISO 15189</h4>
              <p className="text-[10px] text-slate-500">2022 Medical Lab Quality Standards</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-2 shadow-2xs">
              <Award className="w-8 h-8 text-sky-600 mx-auto" />
              <h4 className="text-xs font-bold text-slate-900">NABH Digital</h4>
              <p className="text-[10px] text-slate-500">5th Edition Hospital Health IT</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-2 shadow-2xs">
              <CheckCircle2 className="w-8 h-8 text-cyan-600 mx-auto" />
              <h4 className="text-xs font-bold text-slate-900">ABDM M1-M3</h4>
              <p className="text-[10px] text-slate-500">Ayushman Bharat National Gateway</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-2 shadow-2xs">
              <Cpu className="w-8 h-8 text-indigo-600 mx-auto" />
              <h4 className="text-xs font-bold text-slate-900">CLSI AUTO10-A</h4>
              <p className="text-[10px] text-slate-500">Automated Specimen Accessioning</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-2 shadow-2xs">
              <Lock className="w-8 h-8 text-teal-600 mx-auto" />
              <h4 className="text-xs font-bold text-slate-900">256-bit AES</h4>
              <p className="text-[10px] text-slate-500">DISHA & HIPAA Health Encryption</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-2 shadow-2xs">
              <Clock className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="text-xs font-bold text-slate-900">99.999% SLA</h4>
              <p className="text-[10px] text-slate-500">Multi-region High Availability</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 9. FREQUENTLY ASKED QUESTIONS (ACCORDION) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-sky-600">
              Questions & Clinical Deployment
            </span>
            <h2 className="text-3xl font-black text-slate-900">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500">
              Clear answers for hospital directors, chief pathologists, and clinic administrators.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "How does the bi-directional analyzer interfacing work? Does it require extra cabling?",
                a: "Our field engineering team installs an industrial IoT gateway or connects via standard RS232-to-LAN/TCP-IP adapters directly to your analyzer's ASTM/HL7 port. The analyzer can query our software by reading the sample tube barcode, immediately execute the correct test profile, and transmit the final calibrated results directly back into the patient record without any typing."
              },
              {
                q: "What happens if our hospital or lab loses internet connectivity?",
                a: "NIKIL-LABCORE-ELIS-OS includes an Edge Local Cache engine. Analyzers continue to run uninterrupted and store results in a local offline buffer. As soon as connectivity restores, all data automatically synchronizes with the cloud with HMAC SHA-256 integrity verification."
              },
              {
                q: "Are patient reports sent via WhatsApp password-protected?",
                a: "Yes. In strict accordance with medical privacy standards, all WhatsApp PDF reports are encrypted using the patient’s Date of Birth (DDMMYYYY) or a custom 4-digit PIN. Additionally, every report includes a cryptographic tamperproof QR code that can be verified in real time on our verification node."
              },
              {
                q: "Can we migrate our existing patient records, doctor ledgers, and test masters?",
                a: "Yes. Our team provides free turnkey data migration. We can import CSV, Excel, or SQL exports from your previous software into NIKIL-LABCORE-ELIS-OS within 24 hours without disrupting your daily patient flow."
              },
              {
                q: "Is there any long-term lock-in contract?",
                a: "No. Our licensing is completely monthly rental-based. You retain 100% legal ownership of your clinical data. You can cancel with 15 days notice and receive a full SQL/PDF archive of your database."
              }
            ].map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                <button
                  onClick={() => setFaqOpenIndex(faqOpenIndex === idx ? null : idx)}
                  className="w-full p-5 text-left font-bold text-sm text-slate-900 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {faqOpenIndex === idx ? <ChevronUp className="w-4 h-4 text-sky-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {faqOpenIndex === idx && (
                  <div className="p-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 10. COMPREHENSIVE MEDICAL FOOTER (CRISP HOSPITAL LIGHT THEME) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <footer className="bg-white text-slate-600 text-xs border-t border-slate-200 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-slate-200">
            {/* Col 1: Brand Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-black text-lg text-slate-900 tracking-tight">
                    NIKIL-LABCORE-ELIS-OS
                  </span>
                  <span className="block text-[10px] text-sky-700 font-bold font-mono">v4.2 Enterprise Healthcare Suite</span>
                </div>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed max-w-sm">
                Next-generation clinical operating system for hospitals, diagnostic pathology laboratories, and polyclinics. 
                Bi-directional machine interfacing, paperless EMR, and patient-centric healthcare IT.
              </p>
              <div className="text-[11px] text-slate-700 space-y-1">
                <p><strong>Owner & Chief Architect:</strong> Nikil</p>
                <p><strong>24/7 Helpline:</strong> +91 98765 43210 / 1800-LAB-CORE</p>
                <p><strong>Official Email:</strong> contact@labcore-elis.com</p>
              </div>
            </div>

            {/* Col 2: Core Modules */}
            <div className="space-y-3">
              <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs">Clinical Modules</h4>
              <ul className="space-y-2">
                <li><Link href="/analyzers" className="hover:text-sky-600 transition-colors">Analyzer Interfacing</Link></li>
                <li><Link href="/samples" className="hover:text-sky-600 transition-colors">Specimen Accessioning</Link></li>
                <li><Link href="/approvals" className="hover:text-sky-600 transition-colors">Pathologist Sign-off</Link></li>
                <li><Link href="/doctors" className="hover:text-sky-600 transition-colors">Doctor OPD & EMR</Link></li>
                <li><Link href="/invoices" className="hover:text-sky-600 transition-colors">Billing & GST Invoices</Link></li>
                <li><Link href="/abdm" className="hover:text-sky-600 transition-colors">ABDM National Gateway</Link></li>
              </ul>
            </div>

            {/* Col 3: Accreditations */}
            <div className="space-y-3">
              <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs">Accreditations</h4>
              <ul className="space-y-2">
                <li><span className="text-slate-700">NABL (ISO 15189:2022)</span></li>
                <li><span className="text-slate-700">NABH Digital Hospital</span></li>
                <li><span className="text-slate-700">ABDM M1, M2, M3 Ready</span></li>
                <li><span className="text-slate-700">HL7 / FHIR Standards</span></li>
                <li><span className="text-slate-700">HIPAA & DISHA Security</span></li>
                <li><Link href="/verify-report" className="text-sky-600 hover:text-sky-700 font-bold">Verify Test QR Code</Link></li>
              </ul>
            </div>

            {/* Col 4: Trust & Legal */}
            <div className="space-y-3">
              <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs">Trust & Legal</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => {
                      setActiveLegalTab("terms");
                      setIsTermsModalOpen(true);
                    }}
                    className="hover:text-sky-600 transition-colors text-left"
                  >
                    Terms of Service & Rental
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveLegalTab("privacy");
                      setIsTermsModalOpen(true);
                    }}
                    className="hover:text-sky-600 transition-colors text-left"
                  >
                    Patient Data Confidentiality
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveLegalTab("sla");
                      setIsTermsModalOpen(true);
                    }}
                    className="hover:text-sky-600 transition-colors text-left"
                  >
                    24/7 SLA & 99.999% Uptime
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveLegalTab("compliance");
                      setIsTermsModalOpen(true);
                    }}
                    className="hover:text-sky-600 transition-colors text-left"
                  >
                    Clinical Interfacing Disclaimer
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="text-sky-600 hover:text-sky-700 font-bold text-left"
                  >
                    Staff Portal Login
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>
              © {new Date().getFullYear()} NIKIL-LABCORE-ELIS-OS. All rights reserved. Architected for medical excellence.
            </p>
            <div className="flex items-center space-x-6">
              <span className="text-slate-700 font-semibold">Founder & Lead Architect: Nikil</span>
              <span>•</span>
              <span className="text-slate-700 font-semibold">24/7 Emergency Support</span>
              <span>•</span>
              <span className="text-emerald-600 font-bold">System Status: All Services Operational</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 11. MODAL: ROLE-BASED QUICK LOGIN */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">Staff & Clinical Portal</h3>
                <p className="text-xs text-slate-500">NIKIL-LABCORE-ELIS-OS Security Gateway</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Select your clinical role below to launch the dedicated console:
            </p>

            <div className="space-y-2 mb-6 text-xs">
              <Link
                href="/login"
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 transition-colors group"
              >
                <div className="flex items-center space-x-2.5">
                  <Shield className="w-4 h-4 text-sky-600" />
                  <div>
                    <span className="font-bold text-slate-800 block">Super Administrator / Director</span>
                    <span className="text-[10px] text-slate-400">Facility Controls & Full System Master</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </Link>

              <Link
                href="/login"
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 transition-colors group"
              >
                <div className="flex items-center space-x-2.5">
                  <Microscope className="w-4 h-4 text-sky-600" />
                  <div>
                    <span className="font-bold text-slate-800 block">Chief Pathologist & Lab Tech</span>
                    <span className="text-[10px] text-slate-400">Approvals, Results & Machine Calibration</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </Link>

              <Link
                href="/login"
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 transition-colors group"
              >
                <div className="flex items-center space-x-2.5">
                  <Stethoscope className="w-4 h-4 text-sky-600" />
                  <div>
                    <span className="font-bold text-slate-800 block">Medical Doctor / OPD Desk</span>
                    <span className="text-[10px] text-slate-400">EMR, Vitals & Digital Prescriptions</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </Link>

              <Link
                href="/login"
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 transition-colors group"
              >
                <div className="flex items-center space-x-2.5">
                  <DollarSign className="w-4 h-4 text-sky-600" />
                  <div>
                    <span className="font-bold text-slate-800 block">Billing Counter & Receptionist</span>
                    <span className="text-[10px] text-slate-400">Tokens, Invoices & Collections</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </Link>
            </div>

            <div className="flex gap-2">
              <Link
                href="/login"
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs rounded-xl shadow-md text-center transition-colors"
              >
                Open Full Authentication Page →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 12. MODAL: BOOK LIVE DEMO */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsDemoModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">Schedule Guided Live Demo</h3>
                <p className="text-xs text-slate-500">Free 30-Minute Architecture & Clinical Walkthrough</p>
              </div>
            </div>

            {demoSubmitted ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-black text-base text-slate-900">Demo Request Confirmed!</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Our Lead Medical IT Specialist will connect with you on WhatsApp / Phone within 15 minutes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. / Mr. / Ms. Name"
                    value={demoForm.name}
                    onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91..."
                      value={demoForm.phone}
                      onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Pune, Jaipur, Delhi"
                      value={demoForm.city}
                      onChange={(e) => setDemoForm({ ...demoForm, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Facility Name</label>
                  <input
                    type="text"
                    placeholder="Your Hospital / Lab / Clinic Name"
                    value={demoForm.facilityName}
                    onChange={(e) => setDemoForm({ ...demoForm, facilityName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Facility Type</label>
                  <select
                    value={demoForm.facilityType}
                    onChange={(e) => setDemoForm({ ...demoForm, facilityType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option>Diagnostic Pathology Lab</option>
                    <option>Multi-Speciality Hospital</option>
                    <option>Doctor Clinic & Collection Center</option>
                    <option>Blood Bank & Transfusion Center</option>
                    <option>Multi-branch Diagnostic Chain</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-black text-sm rounded-xl shadow-md transition-all"
                  >
                    Confirm Live Demo Schedule
                  </button>
                  <p className="text-[10px] text-center text-slate-400 mt-2">
                    Free 30-min live session • Custom quote calculation • Zero obligation
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 13. MODAL: PREVIEW VERIFIED TEST REPORT & TAMPERPROOF QR CODE */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isPreviewReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <button
              onClick={() => setIsPreviewReportOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">NABL Verified Patient Diagnostic Report</h3>
                  <p className="text-[11px] text-slate-500">ISO 15189:2022 Format • Real-time WhatsApp PDF Preview</p>
                </div>
              </div>
              <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-300">
                Digitally Signed & Validated
              </span>
            </div>

            <div className="overflow-y-auto pr-2 flex-1 space-y-4 text-xs">
              {/* Report Header */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">PATIENT NAME</span>
                  <span className="font-bold text-slate-900">Rajesh Kumar</span>
                  <span className="text-[10px] text-slate-500 block">42 Yrs / Male</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">UHID / MRN</span>
                  <span className="font-mono font-bold text-slate-900">UHID-2026-0814</span>
                  <span className="text-[10px] text-slate-500 block">Barcode #LC-9821</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">REFERRED BY</span>
                  <span className="font-bold text-slate-900">Dr. S. K. Gupta</span>
                  <span className="text-[10px] text-slate-500 block">MD (Internal Med)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">REPORTED AT</span>
                  <span className="font-bold text-slate-900">{new Date().toLocaleDateString()}</span>
                  <span className="text-[10px] text-slate-500 block font-mono">14:28:10 IST</span>
                </div>
              </div>

              {/* Clinical Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 text-[11px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Test Investigation</th>
                      <th className="p-3">Observed Value</th>
                      <th className="p-3">Reference Range</th>
                      <th className="p-3">Units</th>
                      <th className="p-3">Analyzer Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    <tr className="bg-white">
                      <td className="p-3 font-bold">Hemoglobin (Hb)</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">14.6</td>
                      <td className="p-3 text-slate-500">13.0 - 17.0</td>
                      <td className="p-3 text-slate-500">g/dL</td>
                      <td className="p-3 text-sky-700 font-semibold">Sysmex XN-550</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-3 font-bold">Total Leukocyte Count (TLC)</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">7,200</td>
                      <td className="p-3 text-slate-500">4,000 - 11,000</td>
                      <td className="p-3 text-slate-500">/μL</td>
                      <td className="p-3 text-sky-700 font-semibold">Sysmex XN-550</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-3 font-bold">Platelet Count</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">2,40,000</td>
                      <td className="p-3 text-slate-500">1,50,000 - 4,50,000</td>
                      <td className="p-3 text-slate-500">/μL</td>
                      <td className="p-3 text-sky-700 font-semibold">Sysmex XN-550</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-3 font-bold">Packed Cell Volume (PCV)</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">43.8</td>
                      <td className="p-3 text-slate-500">40.0 - 50.0</td>
                      <td className="p-3 text-slate-500">%</td>
                      <td className="p-3 text-sky-700 font-semibold">Sysmex XN-550</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tamperproof QR & Pathologist Sign */}
              <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-white p-1 rounded-lg border border-sky-300 shadow-2xs flex items-center justify-center shrink-0">
                    <QrCode className="w-14 h-14 text-slate-900" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">Tamperproof Digital QR Node</span>
                    <span className="text-[10px] text-slate-600 block">
                      Scan with any smartphone camera to verify authentic NABL laboratory records.
                    </span>
                    <span className="text-[9px] font-mono text-sky-700 font-bold block mt-0.5">
                      HMAC SHA-256: 7f83b165...49c3b8
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] font-script font-bold text-sky-900 border-b border-slate-300 pb-1 mb-1">
                    Dr. Ananya Sen, MD (Path)
                  </div>
                  <span className="text-[10px] text-slate-500 block">Consultant Pathologist</span>
                  <span className="text-[9px] text-slate-400 font-mono block">Reg. No: MCI-2014-9812</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-mono">
                Delivered automatically via WhatsApp in 1.18 seconds
              </span>
              <button
                onClick={() => setIsPreviewReportOpen(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 14. MODAL: TERMS & CONDITIONS / PRIVACY POLICY / SLA */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200 max-h-[85vh] flex flex-col">
            <button
              onClick={() => setIsTermsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">Legal & Compliance Charter</h3>
                <p className="text-xs text-slate-500">NIKIL-LABCORE-ELIS-OS Enterprise Governance</p>
              </div>
            </div>

            {/* Legal Tabs */}
            <div className="flex border-b border-slate-200 mb-4 gap-4 text-xs font-bold text-slate-600">
              <button
                onClick={() => setActiveLegalTab("terms")}
                className={`pb-2 transition-colors ${
                  activeLegalTab === "terms" ? "text-sky-600 border-b-2 border-sky-600" : "hover:text-slate-900"
                }`}
              >
                Terms of Service
              </button>
              <button
                onClick={() => setActiveLegalTab("privacy")}
                className={`pb-2 transition-colors ${
                  activeLegalTab === "privacy" ? "text-sky-600 border-b-2 border-sky-600" : "hover:text-slate-900"
                }`}
              >
                Patient Data Privacy
              </button>
              <button
                onClick={() => setActiveLegalTab("sla")}
                className={`pb-2 transition-colors ${
                  activeLegalTab === "sla" ? "text-sky-600 border-b-2 border-sky-600" : "hover:text-slate-900"
                }`}
              >
                99.999% Uptime SLA
              </button>
              <button
                onClick={() => setActiveLegalTab("compliance")}
                className={`pb-2 transition-colors ${
                  activeLegalTab === "compliance" ? "text-sky-600 border-b-2 border-sky-600" : "hover:text-slate-900"
                }`}
              >
                Machine Calibration
              </button>
            </div>

            {/* Tab Contents */}
            <div className="overflow-y-auto pr-2 space-y-3 text-xs text-slate-600 leading-relaxed flex-1">
              {activeLegalTab === "terms" && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">1. Software as a Service & Rental Licensing</h4>
                  <p>
                    NIKIL-LABCORE-ELIS-OS is licensed on a monthly or annual subscription basis. 
                    The monthly rent grants the hospital or laboratory full access to the core software modules, 
                    regular software security releases, and technical support.
                  </p>
                  <h4 className="font-bold text-slate-900 text-sm">2. 100% Client Data Ownership</h4>
                  <p>
                    All patient demographic records, diagnostic test results, medical history, doctor ledgers, and financial 
                    invoices belong exclusively to the subscriber facility. We never sell, monetize, or harvest clinical patient data.
                  </p>
                  <h4 className="font-bold text-slate-900 text-sm">3. Flexible Cancellation & Export</h4>
                  <p>
                    Subscriptions can be cancelled with a 15-day prior notice. In the event of contract termination, 
                    subscribers receive a complete, un-encrypted export of their full SQL database and PDF report archives.
                  </p>
                </div>
              )}

              {activeLegalTab === "privacy" && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">1. HIPAA & DISHA Health Data Standards</h4>
                  <p>
                    All clinical communications and database storage utilize 256-bit AES encryption at rest and TLS 1.3 in transit. 
                    Patient identifiers (ABHA numbers and contact details) are stored in compliance with Indian Digital Information Security in Healthcare (DISHA) guidelines.
                  </p>
                  <h4 className="font-bold text-slate-900 text-sm">2. WhatsApp Dispatch Security</h4>
                  <p>
                    Patient PDF reports delivered over WhatsApp are encrypted with a date-of-birth password PIN. 
                    Links embedded inside reports link exclusively to secure verification nodes with HMAC SHA-256 signatures.
                  </p>
                </div>
              )}

              {activeLegalTab === "sla" && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">1. 99.999% High Availability Commitment</h4>
                  <p>
                    Our cloud infrastructure is hosted across multi-region redundant availability zones. 
                    Scheduled maintenance is conducted only during designated low-volume hours (02:00 AM - 04:00 AM IST) with 48-hour prior notice.
                  </p>
                  <h4 className="font-bold text-slate-900 text-sm">2. 15-Minute Emergency Response Guarantee</h4>
                  <p>
                    Emergency incidents affecting analyzer data reception, report dispatch, or billing counters receive 
                    priority escalation with senior medical systems engineers responding within 15 minutes.
                  </p>
                </div>
              )}

              {activeLegalTab === "compliance" && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">1. Bi-Directional Analyzer Protocols</h4>
                  <p>
                    Analyzers communicate via standardized ASTM E1381/E1394 and HL7 v2.x protocols. 
                    All test values received from instruments must be validated against reference ranges and signed off by a qualified medical pathologist.
                  </p>
                  <h4 className="font-bold text-slate-900 text-sm">2. Pathologist Sign-Off Prerequisite</h4>
                  <p>
                    Reports will only bear digital signatures once explicitly approved by an authorized medical practitioner 
                    as mandated by the Clinical Establishments Act and NABL standards.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsTermsModalOpen(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Close Charter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}