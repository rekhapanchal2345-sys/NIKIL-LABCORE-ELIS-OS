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
  Heart
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
  const [activeFeatureTab, setActiveFeatureTab] = useState<"lis" | "opd" | "billing" | "whatsapp">("lis");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Interactive Live Analyzer Simulation State
  const [simulatedSamples, setSimulatedSamples] = useState([
    {
      id: "LC-9821",
      patient: "Rajesh Kumar (42/M)",
      test: "Complete Hemogram (CBC)",
      analyzer: "Sysmex XN-550 (HL7)",
      value: "Hb 14.6 g/dL • WBC 7,200",
      status: "Verified",
      time: "Just now",
      critical: false
    },
    {
      id: "LC-9822",
      patient: "Anita Sharma (35/F)",
      test: "Liver Function Test (LFT)",
      analyzer: "Roche Cobas c311 (ASTM)",
      value: "SGPT 32 U/L • Bilirubin 0.8",
      status: "Transmitting",
      time: "1 min ago",
      critical: false
    },
    {
      id: "LC-9823",
      patient: "Ramesh Patel (68/M)",
      test: "Kidney Function & Electrolytes",
      analyzer: "Mindray BS-430",
      value: "Potassium 6.8 mEq/L ⬆ (PANIC)",
      status: "STAT Panic Alert",
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
    }, 4000);
  };

  // Simulate new sample accessioning & machine run
  const runSampleSimulation = () => {
    setIsSimulating(true);
    triggerToast("Initiating barcode scan on specimen tube #LC-9824...");
    setTimeout(() => {
      const newSample = {
        id: `LC-${Math.floor(9824 + Math.random() * 50)}`,
        patient: "Vikram Malhotra (49/M)",
        test: "Cardiac Troponin I & Lipid",
        analyzer: "Beckman Coulter Access 2",
        value: "Trop-I: 0.01 ng/mL (Normal)",
        status: "Auto-Verified",
        time: "Just now",
        critical: false
      };
      setSimulatedSamples((prev) => [newSample, ...prev.slice(0, 3)]);
      setIsSimulating(false);
      triggerToast("✅ Barcode verified, analyzer results captured & WhatsApp dispatched!");
    }, 1800);
  };

  // Dynamic Pricing Calculation
  const calculatedPricing = useMemo(() => {
    let baseRent = 1999;
    if (calcSamples > 80 && calcSamples <= 300) baseRent = 4999;
    else if (calcSamples > 300 && calcSamples <= 800) baseRent = 12999;
    else if (calcSamples > 800) baseRent = 24999;

    const analyzerAddon = calcAnalyzers * 1000;
    const branchAddon = (calcBranches - 1) * 2000;

    let monthlyTotal = baseRent + analyzerAddon + branchAddon;
    if (billingCycle === "yearly") {
      monthlyTotal = Math.round(monthlyTotal * 0.8); // 20% discount
    }

    let setupFee = 3999;
    if (calcAnalyzers > 0) setupFee = 12999;
    if (calcBranches > 1) setupFee += (calcBranches - 1) * 5000;

    const hoursSaved = Math.round(calcSamples * 26 * 0.09);
    const moneySaved = Math.round(hoursSaved * 200 + calcSamples * 26 * 5);

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

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-sky-500 selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-sky-400/50 flex items-center space-x-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. TOP LIVE CLINICAL TICKER & 24/7 HELPLINE */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-3 overflow-x-auto text-nowrap">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              24/7 EMERGENCY STAT DESK
            </span>
            <span className="text-slate-300">
              Immediate Medical IT Hotline: <strong className="text-white font-mono text-sm tracking-wide">+91 98765 43210</strong> (15-Min Guaranteed SLA)
            </span>
            <span className="hidden lg:inline text-slate-600">•</span>
            <span className="hidden lg:inline text-sky-300 font-medium">
              Toll-Free: <strong>1800-LAB-CORE</strong>
            </span>
          </div>

          <div className="flex items-center space-x-4 shrink-0 text-slate-300 text-[11px]">
            <a
              href="https://wa.me/919876543210?text=Hello%20Nikil%2C%20I%20am%20interested%20in%20NIKIL-LABCORE-ELIS-OS%20for%20our%20medical%20facility."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Direct WhatsApp Founder Desk
            </a>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => {
                setActiveLegalTab("sla");
                setIsTermsModalOpen(true);
              }}
              className="hover:text-white font-semibold transition-colors text-slate-300"
            >
              99.999% SLA Charter
            </button>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono">v4.2 Enterprise Release</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. MAIN NAVIGATION (CRISP MEDICAL WHITE & FROSTED BORDER) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo & Medical Cross Symbol */}
          <Link href="/" className="flex items-center space-x-3.5 group">
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-500 flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              {/* Medical Cross SVG Icon */}
              <div className="relative text-white flex items-center justify-center">
                <Activity className="w-6 h-6 stroke-[2.4]" />
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-2xs"></div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-xl tracking-tight text-slate-900 group-hover:text-sky-700 transition-colors">
                  NIKIL<span className="text-sky-600 font-black">-LABCORE</span>
                </span>
                <span className="text-[10px] uppercase font-black tracking-wider bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md border border-sky-200">
                  ELIS-OS
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 tracking-wide">
                Unified Hospital, Diagnostic Lab & Clinic Operating System
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center space-x-7 text-sm font-bold text-slate-600">
            <a href="#modules" className="hover:text-sky-600 transition-colors">
              Modules & Features
            </a>
            <a href="#interactive-workstation" className="hover:text-sky-600 transition-colors">
              Live Workstation
            </a>
            <a href="#pricing" className="hover:text-sky-600 transition-colors">
              Pricing: Rent & Setup
            </a>
            <a href="#calculator" className="hover:text-sky-600 transition-colors">
              Cost Estimator
            </a>
            <a href="#analyzers" className="hover:text-sky-600 transition-colors">
              Analyzers & Machines
            </a>
            <a href="#founder" className="hover:text-sky-600 transition-colors">
              Founder & Desk
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
              <span>Staff Login</span>
            </button>

            {/* Book Live Demo */}
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-extrabold text-sm shadow-md shadow-sky-600/25 transition-all hover:scale-[1.02] active:scale-95"
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
              href="#modules"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-700 hover:text-sky-600"
            >
              Modules & Capabilities
            </a>
            <a
              href="#interactive-workstation"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-700 hover:text-sky-600"
            >
              Interactive Workstation
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-700 hover:text-sky-600"
            >
              Monthly Rent & Setup Cost
            </a>
            <a
              href="#calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-700 hover:text-sky-600"
            >
              Cost & ROI Calculator
            </a>
            <a
              href="#founder"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-700 hover:text-sky-600"
            >
              Owner & Contact Information
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
      <section className="relative overflow-hidden pt-10 pb-20 lg:pt-14 lg:pb-28 bg-gradient-to-b from-sky-50/50 via-white to-slate-50 medical-grid-bg">
        {/* Subtle Decorative Ambient Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-30">
          <div className="absolute top-10 left-10 w-80 h-80 bg-sky-300/40 rounded-full blur-3xl"></div>
          <div className="absolute top-32 right-10 w-96 h-96 bg-cyan-200/50 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Facility Mode Selector Pill Bar */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex p-1 rounded-2xl bg-slate-100/90 border border-slate-200 shadow-2xs gap-1">
              <button
                onClick={() => setSelectedFacility("pathlab")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedFacility === "pathlab"
                    ? "bg-white text-sky-700 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Microscope className="w-3.5 h-3.5 text-sky-600" />
                <span>Diagnostic Pathology Lab</span>
              </button>
              <button
                onClick={() => setSelectedFacility("hospital")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedFacility === "hospital"
                    ? "bg-white text-sky-700 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Multi-Specialty Hospital (OPD/IPD)</span>
              </button>
              <button
                onClick={() => setSelectedFacility("clinic")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedFacility === "clinic"
                    ? "bg-white text-sky-700 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-cyan-600" />
                <span>Polyclinic & Doctor Center</span>
              </button>
            </div>
          </div>

          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Top Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white border border-sky-200 text-sky-800 text-xs font-extrabold shadow-sm">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Architected by Nikil • Clinical Operating System Release v4.2</span>
              <span className="bg-sky-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                ENTERPRISE
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.14]">
              Next-Generation Healthcare OS for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600">
                {selectedFacility === "hospital" && "Modern Hospitals & Medical Centers"}
                {selectedFacility === "pathlab" && "Diagnostic Pathology & Clinical Labs"}
                {selectedFacility === "clinic" && "Polyclinics, Doctors & Collection Hubs"}
                {selectedFacility === "bloodbank" && "Blood Banks & Diagnostic Centers"}
              </span>
            </h1>

            {/* Sub-description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto font-normal">
              Empower your clinical staff with <strong className="text-slate-900 font-bold">NIKIL-LABCORE-ELIS-OS</strong>. 
              Automate Bi-directional Laboratory Analyzers (Zero Typos), streamline Hospital OPD/IPD Patient Flow, 
              issue ABDM M1-M3 Digital Health Records, and deliver password-protected WhatsApp PDF reports with tamperproof QR verification in under 1.2 seconds.
            </p>

            {/* Primary Action Button Cluster */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-black text-base shadow-lg shadow-sky-600/30 transition-all hover:scale-105 active:scale-95 flex items-center space-x-2.5"
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

            {/* Regulatory Accreditations Strip */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                NABL (ISO 15189:2022) Compliant
              </span>
              <span className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <Award className="w-4 h-4 text-sky-600" />
                NABH Digital Hospital Certified
              </span>
              <span className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                ABDM National Gateway (M1, M2, M3)
              </span>
              <span className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <Cpu className="w-4 h-4 text-indigo-600" />
                65+ Bi-Directional Analyzers
              </span>
              <span className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <Clock className="w-4 h-4 text-amber-600" />
                99.999% High Availability SLA
              </span>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* HERO LIVE TELEMETRY & WORKSTATION MOCKUP */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="mt-12 max-w-5xl mx-auto rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            {/* Terminal Top Window Bar */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-rose-500"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-amber-500"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500"></div>
                <span className="ml-3 text-xs font-mono text-slate-300">
                  NIKIL-LABCORE-ELIS-OS // Live Clinical Station & Telemetry Monitor
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  ANALYZERS ONLINE (ASTM / HL7)
                </span>
                <span className="bg-slate-800 text-sky-400 px-2.5 py-1 rounded font-mono text-[11px] border border-slate-700">
                  Station: LC-DELHI-CORE-01
                </span>
              </div>
            </div>

            {/* Dashboard Mockup Content */}
            <div className="p-5 sm:p-7 bg-slate-50/70 grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <span>{isSimulating ? "Processing..." : "🧪 Run Specimen Barcode"}</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {simulatedSamples.map((sample, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        sample.critical
                          ? "bg-rose-50/40 border-rose-200"
                          : "bg-white border-slate-200/90 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                              sample.critical
                                ? "bg-rose-100 text-rose-700"
                                : "bg-sky-100 text-sky-700"
                            }`}
                          >
                            {sample.test.split(" ")[0]}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-slate-900 text-sm">
                                #{sample.id}: {sample.patient}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  sample.critical
                                    ? "bg-rose-100 text-rose-800 flex items-center gap-1"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {sample.critical && <AlertTriangle className="w-2.5 h-2.5" />}
                                {sample.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              {sample.test} • <span className="text-slate-700 font-semibold">{sample.analyzer}</span>
                            </p>
                            <p className="text-xs font-bold text-slate-800 pt-0.5">
                              Telemetry: {sample.value}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-xs font-bold block ${
                              sample.critical ? "text-rose-600" : "text-emerald-600"
                            }`}
                          >
                            {sample.critical ? "Critical Alert" : "WhatsApp Sent"}
                          </span>
                          <span className="text-[10px] text-slate-400">{sample.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Hardware Telemetry & Health */}
              <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-sky-600" />
                    <span>Analyzer Telemetry</span>
                  </h4>
                  <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                    <div>
                      <strong className="block text-slate-900 font-bold">Roche Cobas 6000</strong>
                      <span className="text-[10px] text-slate-400">RS-232 Serial • ASTM E1394</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded">
                      SYNCED
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                    <div>
                      <strong className="block text-slate-900 font-bold">Sysmex XN-550</strong>
                      <span className="text-[10px] text-slate-400">LAN TCP/IP • HL7 v2.5</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded">
                      ONLINE
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                    <div>
                      <strong className="block text-slate-900 font-bold">Mindray BC-6800</strong>
                      <span className="text-[10px] text-slate-400">Bi-directional Query Mode</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded">
                      READY
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Report Turnaround Time:</span>
                    <strong className="text-slate-900">&lt; 1.2 Seconds</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transcription Error Rate:</span>
                    <strong className="text-emerald-600 font-black">0.00% (Zero Typos)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NABL Audit Logs:</span>
                    <strong className="text-sky-700">100% Cryptographic</strong>
                  </div>
                </div>

                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs rounded-xl border border-sky-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Launch Live Operator Console</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. CLINICAL STATS BAR */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">10M+</p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Diagnostic Tests Automated</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-sky-600 tracking-tight">450+</p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Hospitals & Labs Deployed</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight">65+</p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Bi-Directional Analyzers</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">&lt;1.2s</p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Fast Report Generation</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-cyan-600 tracking-tight">99.999%</p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">High Availability SLA</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-indigo-600 tracking-tight">24/7</p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Dedicated Support Engineers</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. CORE MODULES & ARCHITECTURAL CAPABILITIES */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section id="modules" className="py-20 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-100 px-3.5 py-1 rounded-full border border-sky-200">
              Unified Medical Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              One Operating System for Your Entire Clinical Ecosystem
            </h2>
            <p className="text-base text-slate-600">
              Replace fragmented desktop software, paper forms, and manual transcription with an integrated clinical operating system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Module 1: Diagnostic Pathology LIS */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Microscope className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Diagnostic Pathology LIS</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Biochemistry, Hematology, Microbiology, Serology & Histopathology. Barcode tube accessioning, delta checks, and digital pathologist sign-off.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-500 font-semibold">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Panic High/Low Value Alerts</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Worklist Batch Management</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> NABL Traceability Audit Trail</li>
              </ul>
            </div>

            {/* Module 2: Bi-Directional Machine Interfacing */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Bi-Directional Analyzers</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Zero human typing error. Directly connects to laboratory machines via ASTM/HL7/RS232/LAN. Analyzers scan barcode, download test list, and return results.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-500 font-semibold">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Roche, Sysmex, Mindray, Beckman</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> 100% Elimination of Data Typos</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Real-Time Calibration & QC Logs</li>
              </ul>
            </div>

            {/* Module 3: Hospital HMIS (OPD & IPD) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Hospital & Clinic HMIS</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Doctor OPD consulting desk, electronic prescriptions (Rx), patient vitals charts, IPD bed allocation, nursing station records, and automated discharge summaries.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-500 font-semibold">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Token Queue & Calling Display</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Ward & Bed Occupancy Matrix</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> NABH Hospital EMR Guidelines</li>
              </ul>
            </div>

            {/* Module 4: ABDM National Gateway */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">ABDM National Gateway</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Official Ayushman Bharat Digital Mission readiness. 1-click ABHA number generation, linking electronic records (HIP/HIU), and patient consent manager protocol.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-500 font-semibold">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Milestone 1 (ABHA Creation)</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Milestone 2 (Data Transfer)</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Milestone 3 (Consent Protocol)</li>
              </ul>
            </div>

            {/* Module 5: Smart Billing & TPA Insurance */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Billing, TPA & Incentives</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Automated GST tax invoices, corporate rate lists, cashless TPA insurance claims, dynamic UPI QR on counter, and doctor referral commission ledgers.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-500 font-semibold">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Multi-rate lists & Corporate panels</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Doctor Referral Incentive Engine</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Split UPI, Card & Cash Billing</li>
              </ul>
            </div>

            {/* Module 6: WhatsApp Dispatch & Tamperproof QR */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">WhatsApp & QR Reports</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Instant delivery of password-protected PDF test reports directly on patient WhatsApp. Every report embeds an unalterable QR code linking to verification portal.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-500 font-semibold">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Direct WhatsApp Business API</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Unforgeable QR Code Check</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Saves ₹40,000/yr in Paper Prints</li>
              </ul>
            </div>

            {/* Module 7: Reagent & Inventory Intelligence */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <FlaskConical className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Reagents & Stock Control</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Real-time consumption tracking linked to test volume. Automated alerts for expiring reagent lots, minimum stock thresholds, and calibration reminders.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-500 font-semibold">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Test-to-Reagent Cost Calculation</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Expiry & Lot Warning System</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Purchase Order (PO) Generator</li>
              </ul>
            </div>

            {/* Module 8: PACS Radiology & Tele-Reporting */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Radiology & PACS Bridge</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Seamless DICOM image server bridge for X-Ray, CT, Ultrasound, and MRI. Enables remote tele-radiology reporting with standardized macro templates.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-500 font-semibold">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> DICOM Web Viewer Integration</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Tele-Radiology Sharing Link</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Pre-configured Normal Templates</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 6. SUPPORTED MEDICAL ANALYZERS SHOWCASE */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section id="analyzers" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-700 bg-cyan-100 px-3 py-1 rounded-full border border-cyan-200">
              Bi-Directional Hardware Compatibility
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Pre-Calibrated with 65+ Medical Laboratory Analyzers
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              ASTM E1381/E1394 & HL7 v2.x drivers ready for instant plug-and-play interfacing with RS-232 serial cables or LAN TCP/IP.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 text-center">
            {[
              { brand: "Roche Diagnostics", models: "Cobas 6000, c311, e411, b123", protocol: "ASTM / TCP-IP" },
              { brand: "Sysmex Corporation", models: "XN-550, XN-1000, XP-300, KX-21", protocol: "HL7 / Serial" },
              { brand: "Mindray Medical", models: "BC-6800, BC-5380, BS-430, BS-240", protocol: "ASTM / LAN" },
              { brand: "Beckman Coulter", models: "Access 2, DxI, AU480, AU680", protocol: "HL7 / ASTM" },
              { brand: "Abbott Laboratories", models: "Architect c4000, ci8200, Alinity", protocol: "ASTM Serial" },
              { brand: "Horiba Medical", models: "Yumizen H500, Pentra XLR, ABX", protocol: "HL7 Protocol" },
              { brand: "Erba Mannheim", models: "EM-200, EM-360, Chem-7, XL-640", protocol: "RS-232 Serial" },
              { brand: "Bio-Rad", models: "D-10 HPLC HbA1c, Variant II", protocol: "ASTM Standard" },
              { brand: "Snibe Diagnostic", models: "Maglumi 800, 2000 Plus CLIA", protocol: "TCP/IP LAN" },
              { brand: "Siemens Healthineers", models: "Atellica, Dimension, Advia 2120", protocol: "ASTM / HL7" }
            ].map((analyzer, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-sky-50/60 hover:border-sky-300 transition-all text-left"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs text-slate-900">{analyzer.brand}</span>
                  <span className="text-[9px] font-bold bg-white text-sky-700 px-1.5 py-0.5 rounded border border-slate-200">
                    {analyzer.protocol}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">{analyzer.models}</p>
                <span className="text-[10px] text-emerald-600 font-bold block mt-2 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Fully Verified Driver
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 7. INTERACTIVE CLINICAL WORKSTATION TABS */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section id="interactive-workstation" className="py-20 bg-slate-50/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-100 px-3.5 py-1 rounded-full border border-sky-200">
              Live Interactive Workstation
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Test Real Clinical Workflows Hands-On
            </h2>
            <p className="text-base text-slate-600">
              Switch between tabs below to test the exact screens used by pathologists, doctors, billing operators, and patients.
            </p>

            {/* Tab Selector */}
            <div className="inline-flex flex-wrap p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm gap-1 mt-4">
              <button
                onClick={() => setActiveFeatureTab("lis")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeFeatureTab === "lis"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🔬 Pathology LIS & Analyzers
              </button>
              <button
                onClick={() => setActiveFeatureTab("opd")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeFeatureTab === "opd"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🩺 Doctor OPD & E-Prescriptions
              </button>
              <button
                onClick={() => setActiveFeatureTab("billing")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeFeatureTab === "billing"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                💳 Smart Billing & TPA
              </button>
              <button
                onClick={() => setActiveFeatureTab("whatsapp")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeFeatureTab === "whatsapp"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📱 Patient WhatsApp & QR
              </button>
            </div>
          </div>

          {/* Tab 1: Pathology LIS & Analyzers */}
          {activeFeatureTab === "lis" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                    <Microscope className="w-5 h-5 text-sky-600" />
                    Bi-Directional Worklist — Batch #2026-10-20-CORE
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time result capture from Sysmex XN-550 & Roche Cobas
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Analyzer Link Active
                  </span>
                  <button
                    onClick={() => triggerToast("Machine query sent: 12 tests polled successfully.")}
                    className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
                  >
                    Sync Machine Batch
                  </button>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Barcode / PID</th>
                      <th className="py-3 px-3">Patient Name</th>
                      <th className="py-3 px-3">Test Name</th>
                      <th className="py-3 px-3">Machine Output</th>
                      <th className="py-3 px-3">Biological Ref. Range</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr className="hover:bg-slate-50">
                      <td className="py-3.5 px-3 font-mono font-bold text-sky-700">#89104-CBC</td>
                      <td className="py-3.5 px-3 text-slate-900">Vikas Malhotra (28/M)</td>
                      <td className="py-3.5 px-3">Hemoglobin (Hb)</td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">14.6 g/dL</td>
                      <td className="py-3.5 px-3 text-slate-500">13.0 - 17.0 g/dL</td>
                      <td className="py-3.5 px-3">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          NORMAL
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span className="text-emerald-600 font-bold">Approved</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 bg-rose-50/20">
                      <td className="py-3.5 px-3 font-mono font-bold text-sky-700">#89105-KFT</td>
                      <td className="py-3.5 px-3 text-slate-900">Sunita Devi (58/F)</td>
                      <td className="py-3.5 px-3">Serum Creatinine</td>
                      <td className="py-3.5 px-3 font-black text-rose-600">3.4 mg/dL ⬆</td>
                      <td className="py-3.5 px-3 text-slate-500">0.5 - 1.2 mg/dL</td>
                      <td className="py-3.5 px-3">
                        <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          PANIC HIGH
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => triggerToast("Panic Alert dispatched to attending doctor!")}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded text-[10px] font-bold shadow-2xs"
                        >
                          Alert Doctor
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3.5 px-3 font-mono font-bold text-sky-700">#89106-LIPID</td>
                      <td className="py-3.5 px-3 text-slate-900">Mohit Aggarwal (45/M)</td>
                      <td className="py-3.5 px-3">Total Cholesterol</td>
                      <td className="py-3.5 px-3 font-bold text-amber-600">228 mg/dL ⬆</td>
                      <td className="py-3.5 px-3 text-slate-500">&lt; 200 mg/dL</td>
                      <td className="py-3.5 px-3">
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          BORDERLINE
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span className="text-slate-500 font-semibold">Verified</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Doctor OPD Consultation */}
          {activeFeatureTab === "opd" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                        <Stethoscope className="w-5 h-5 text-sky-600" />
                        Dr. Alok Sen (MD Medicine) — OPD Room #4
                      </h4>
                      <p className="text-xs text-slate-500">Active Patient: Ramesh Gupta • 52 Yrs / Male • Token #18</p>
                    </div>
                    <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2.5 py-1 rounded-md">
                      ABHA: 91-8821-4902-1922
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Blood Pressure</span>
                      <strong className="text-sm text-slate-800">138/86 mmHg</strong>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Pulse Rate</span>
                      <strong className="text-sm text-slate-800">76 bpm</strong>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">SpO2 Oxygen</span>
                      <strong className="text-sm text-emerald-600">99% Room Air</strong>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Random Glucose</span>
                      <strong className="text-sm text-amber-600">168 mg/dL</strong>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                    <span className="text-xs font-black text-slate-700 block">Digital e-Prescription (Rx):</span>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p>1. Tab. Telmisartan 40mg — 1 Tablet once daily (Morning after food)</p>
                      <p>2. Tab. Metformin 500mg SR — 1 Tablet twice daily with meals</p>
                      <p className="text-sky-700 font-bold pt-1">
                        + Ordered Diagnostic Tests: Fasting Lipid Profile, HbA1c, Serum Creatinine (Pushed to Lab Queue)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                  <h5 className="font-black text-xs uppercase tracking-wider text-slate-500">Doctor Actions</h5>
                  <button
                    onClick={() => triggerToast("Digital Rx signed and pushed to Patient WhatsApp & Pharmacy.")}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sign Rx & Dispatch to WhatsApp</span>
                  </button>
                  <button
                    onClick={() => triggerToast("Laboratory investigation order generated with pre-assigned barcode.")}
                    className="w-full py-2 bg-white hover:bg-slate-100 text-sky-700 font-bold text-xs rounded-xl border border-sky-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FlaskConical className="w-4 h-4" />
                    <span>Order Diagnostic Tests</span>
                  </button>
                  <p className="text-[11px] text-slate-400 pt-2">
                    NABH compliance: Every consultation note is cryptographically stamped with doctor MCI registration number.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Billing & TPA */}
          {activeFeatureTab === "billing" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-black text-slate-800 text-sm">Invoice #INV-2026-9812</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      GST TAX INVOICE
                    </span>
                  </div>
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>1. Complete Blood Count (CBC) with Automated Differential</span>
                      <strong className="text-slate-900">₹350.00</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>2. Comprehensive Metabolic Panel (LFT + KFT)</span>
                      <strong className="text-slate-900">₹900.00</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>3. Thyroid Stimulating Hormone (TSH - Ultra-sensitive)</span>
                      <strong className="text-slate-900">₹400.00</strong>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-800 text-sm">
                      <span>Total Amount Payable (Inc. GST)</span>
                      <span className="text-sky-700">₹1,650.00</span>
                    </div>
                  </div>
                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={() => triggerToast("Dynamic UPI QR generated on counter terminal.")}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Show Dynamic UPI QR</span>
                    </button>
                    <button
                      onClick={() => triggerToast("Printing 3-inch thermal bill slip...")}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Thermal Bill</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3 text-xs">
                  <h5 className="font-black uppercase tracking-wider text-slate-500">Referring Doctor Commission</h5>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-500 block">Referral Partner:</span>
                    <strong className="text-slate-900 block font-bold">Dr. S. K. Roy (Roy Polyclinic)</strong>
                    <span className="text-emerald-600 font-black block pt-1">Commission (15%): ₹247.50</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Auto-generated monthly statement with 1-click bank transfer export and transparent referral ledger.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Patient WhatsApp & Tamperproof QR */}
          {activeFeatureTab === "whatsapp" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md">
              <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-300 shadow-xl overflow-hidden">
                <div className="bg-emerald-700 text-white p-3.5 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold">
                    LC
                  </div>
                  <div>
                    <h5 className="font-bold text-sm">LabCore ELIS Verified Lab</h5>
                    <p className="text-[10px] text-emerald-100 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-300" /> Official Medical Notification Desk
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/40 space-y-3 text-xs">
                  <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 space-y-2.5">
                    <p className="text-slate-800 font-medium">
                      Dear <strong>Mr. Rajesh Kumar</strong>,
                    </p>
                    <p className="text-slate-600">
                      Your diagnostic test report for <strong>Complete Hemogram (CBC)</strong> has been certified by Dr. M. K. Chawla (MD Path).
                    </p>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-6 h-6 text-rose-500" />
                        <div>
                          <span className="font-bold text-slate-800 block text-[11px]">Rajesh_Kumar_CBC_Report.pdf</span>
                          <span className="text-[10px] text-slate-400">184 KB • Password: Your DOB (DDMM)</span>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-sky-600" />
                    </div>
                    <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100">
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" /> NABL Accredited QR Inside
                      </span>
                      <Link
                        href="/verify-report"
                        className="text-sky-600 font-bold hover:underline"
                      >
                        Verify Report Authenticity →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 8. TRANSPARENT PRICING & RENTAL PACKAGES */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
            <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-100 px-3.5 py-1 rounded-full border border-sky-200">
              Clear & Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Predictable Monthly Rent & One-Time Setup Packages
            </h2>
            <p className="text-base text-slate-600">
              No hidden costs or per-test surcharges. Enjoy unlimited software updates, automated daily backups, and 24/7 support in a predictable monthly rent.
            </p>

            {/* Billing Switcher Toggle */}
            <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 mt-4">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  billingCycle === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                }`}
              >
                Monthly Rent (Flexible)
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === "yearly" ? "bg-sky-600 text-white shadow-sm" : "text-slate-600"
                }`}
              >
                <span>Annual Payment</span>
                <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded font-black">
                  20% OFF
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Plan 1: Starter Clinic & Lab */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7 flex flex-col justify-between hover:border-sky-300 transition-colors">
              <div className="space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  Starter Lab & Clinic
                </span>
                <h3 className="text-xl font-black text-slate-900">Collection Point & Clinic</h3>
                <p className="text-xs text-slate-600">
                  Ideal for small single-doctor clinics, sample collection centers, and starter pathology labs.
                </p>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">
                      {billingCycle === "yearly" ? "₹1,999" : "₹2,499"}
                    </span>
                    <span className="text-xs font-bold text-slate-500">/ month rent</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {billingCycle === "yearly" ? "Billed annually (₹23,988/yr)" : "No lock-in, cancel anytime"}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    Up to 1,500 tests / month
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    3 Staff & Doctor User Logins
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    Barcode Tube Printing & Accessioning
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    WhatsApp PDF Report Delivery
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    Tamperproof QR Code Verification
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    Standard Email & WhatsApp Support
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
                >
                  Get Starter Lab License
                </button>
              </div>
            </div>

            {/* Plan 2: Professional Diagnostic Center (Featured) */}
            <div className="bg-white rounded-3xl border-2 border-sky-600 shadow-xl p-7 flex flex-col justify-between relative scale-105 z-10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-black text-[11px] uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
                ★ MOST POPULAR FOR PATH LABS
              </div>

              <div className="space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-100 px-2.5 py-1 rounded-md">
                  Diagnostic Center PRO
                </span>
                <h3 className="text-xl font-black text-slate-900">Full Diagnostic Laboratory</h3>
                <p className="text-xs text-slate-600">
                  Engineered for standalone pathology labs, ultrasound centers, and multi-doctor polyclinics.
                </p>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-sky-600">
                      {billingCycle === "yearly" ? "₹4,799" : "₹5,999"}
                    </span>
                    <span className="text-xs font-bold text-slate-500">/ month rent</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {billingCycle === "yearly" ? "Save ₹14,400 with annual billing" : "Includes all software updates"}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2 font-black text-slate-900">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    Up to 10,000 tests / month
                  </div>
                  <div className="flex items-center gap-2 font-bold">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    10 Staff / Pathologist / Doctor Logins
                  </div>
                  <div className="flex items-center gap-2 font-black text-sky-700">
                    <Check className="w-4 h-4 text-sky-600 shrink-0" />
                    2 Bi-Directional Machine Interfaces Included
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    Referring Doctor Commission & Portal
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    ABDM (M1, M2, M3) National Integration
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    Reagent & Inventory Tracking
                  </div>
                  <div className="flex items-center gap-2 font-black text-slate-900">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    24/7 Priority Phone & Remote IT SLA
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-extrabold text-sm shadow-md shadow-sky-600/30 transition-all hover:scale-102"
                >
                  Deploy Diagnostic Center PRO
                </button>
              </div>
            </div>

            {/* Plan 3: Enterprise Hospital OS */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7 flex flex-col justify-between hover:border-sky-300 transition-colors">
              <div className="space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                  Hospital Operating System
                </span>
                <h3 className="text-xl font-black text-slate-900">Multi-Speciality Hospital</h3>
                <p className="text-xs text-slate-600">
                  Full Hospital HMIS with OPD, IPD, OT, Ward Management, Pharmacy, LIS, and PACS.
                </p>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">
                      {billingCycle === "yearly" ? "₹11,999" : "₹14,999"}
                    </span>
                    <span className="text-xs font-bold text-slate-500">/ month rent</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Full hospital campus license, multi-floor LAN ready
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    UNLIMITED Tests & Patients
                  </div>
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    UNLIMITED Staff, Nurse & Doctor Accounts
                  </div>
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    ALL Analyzer Interfaces (Unlimited Machines)
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    Full Ward / Bed / ICU / Nursing Station
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    NABH Compliance & Strict Audit Logs
                  </div>
                  <div className="flex items-center gap-2 font-bold text-emerald-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    Dedicated Medical IT Account Manager
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors"
                >
                  Schedule Hospital Architecture Audit
                </button>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* ONE-TIME SETUP & ON-PREMISE PACKAGES */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="mt-16 bg-slate-50 rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Installation & Engineering Services
              </span>
              <h3 className="text-2xl font-black text-slate-900">
                One-Time Onboarding, Hardware & Analyzer Calibration Setup
              </h3>
              <p className="text-xs text-slate-500">
                Choose how you want your facility launched. Handled end-to-end by certified medical systems engineers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Setup Option A */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">Cloud Fast-Track Setup</h4>
                    <p className="text-[11px] text-slate-500">Remote Cloud Deployment</p>
                  </div>
                  <span className="text-base font-extrabold text-slate-900">₹4,999</span>
                </div>
                <p className="text-xs text-slate-600">
                  Ready within 24 hours. Dedicated cloud instance, lab header customization, doctor master list upload, and remote staff video training.
                </p>
                <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 1-Day Turnaround
                </div>
              </div>

              {/* Setup Option B */}
              <div className="p-6 rounded-2xl border-2 border-sky-500 bg-sky-50/40 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">Full Analyzer Hardware Setup</h4>
                    <p className="text-[11px] text-sky-700 font-bold">Recommended for Machine Sync</p>
                  </div>
                  <span className="text-base font-extrabold text-sky-700">₹14,999</span>
                </div>
                <p className="text-xs text-slate-600">
                  On-site or deep remote engineer setup. Serial RS-232 / LAN machine cabling, ASTM/HL7 driver calibration, thermal barcode printer setup, and 3-day staff certification.
                </p>
                <div className="text-[11px] font-bold text-sky-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Includes Barcode & Analyzer Testing
                </div>
              </div>

              {/* Setup Option C */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">Air-Gapped Offline Appliance</h4>
                    <p className="text-[11px] text-slate-500">100% Offline Local Server</p>
                  </div>
                  <span className="text-base font-extrabold text-slate-900">₹79,999</span>
                </div>
                <p className="text-xs text-slate-600">
                  Complete local server appliance installation. Works 100% offline without internet inside the hospital LAN. Includes perpetual license and automated local backup NAS.
                </p>
                <div className="text-[11px] font-bold text-indigo-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Lifetime Local On-Premise License
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 9. INTERACTIVE COST & SAVINGS ESTIMATOR */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section id="calculator" className="py-20 bg-slate-50/70 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              Interactive Cost Estimator
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Calculate Your Exact Monthly Rent & Setup Cost
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Adjust the sliders below to see your customized subscription cost and how much money you save on paper, labor, and prevented errors.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center shadow-sm">
            {/* Left: Input Sliders */}
            <div className="space-y-6">
              {/* Slider 1: Daily Samples */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-black text-slate-800 flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-sky-600" />
                    Average Daily Patient Samples:
                  </label>
                  <span className="font-black text-sky-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                    {calcSamples} samples/day ({calcSamples * 30}/mo)
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="800"
                  step="10"
                  value={calcSamples}
                  onChange={(e) => setCalcSamples(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>20 (Clinic)</span>
                  <span>250 (Mid Lab)</span>
                  <span>800+ (Hospital Chain)</span>
                </div>
              </div>

              {/* Slider 2: Number of Analyzers */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-black text-slate-800 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-cyan-600" />
                    Bi-Directional Machines to Connect:
                  </label>
                  <span className="font-black text-cyan-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                    {calcAnalyzers} Analyzers
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="1"
                  value={calcAnalyzers}
                  onChange={(e) => setCalcAnalyzers(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0 (Manual LIS)</span>
                  <span>2 (CBC + Chem)</span>
                  <span>6+ (Full Automation)</span>
                </div>
              </div>

              {/* Slider 3: Branches */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-black text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-teal-600" />
                    Number of Centers / Branches:
                  </label>
                  <span className="font-black text-teal-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                    {calcBranches} {calcBranches === 1 ? "Central Facility" : "Locations"}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={calcBranches}
                  onChange={(e) => setCalcBranches(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>1 Single Hub</span>
                  <span>3 Centers</span>
                  <span>5 Multi-City Hubs</span>
                </div>
              </div>
            </div>

            {/* Right: Dynamic Calculation Result Card */}
            <div className="bg-slate-50 rounded-2xl border border-sky-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Recommended Plan</span>
                <span className="text-xs font-bold text-sky-700 bg-white px-2 py-0.5 rounded border border-sky-200">
                  {billingCycle === "yearly" ? "Annual (20% Discount)" : "Monthly Flexible"}
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-500 font-medium">Estimated Monthly Rent:</div>
                <div className="text-4xl font-black text-sky-600">
                  ₹{calculatedPricing.monthlyTotal.toLocaleString("en-IN")}
                  <span className="text-xs font-bold text-slate-400"> / month</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">One-Time Engineer Setup:</span>
                  <strong className="text-slate-900 font-bold">₹{calculatedPricing.setupFee.toLocaleString("en-IN")}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Manual Hours Saved Monthly:</span>
                  <strong className="text-emerald-600 font-bold">{calculatedPricing.hoursSaved} hrs/mo</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Net Estimated Monthly Savings:</span>
                  <strong className="text-emerald-700 font-black">₹{calculatedPricing.moneySaved.toLocaleString("en-IN")}</strong>
                </div>
              </div>

              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="w-full py-3 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Lock In This Quote & Schedule Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 10. 24/7 SUPPORT & GUARANTEED SLA */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-sky-400 bg-sky-900/60 px-3.5 py-1 rounded-full border border-sky-700/60">
              Zero-Downtime Guarantee
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              24/7/365 Medical IT Support & STAT Emergency Response
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              Hospitals and diagnostic labs cannot afford even 5 minutes of downtime. Our certified medical systems specialists ensure immediate resolution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">15-Minute Critical SLA</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Emergency STAT code red: Any machine telemetry drop or reporting pause receives senior engineer intervention within 15 minutes.
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Direct Phone & WhatsApp</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                No IVR queues or ticket delays. Speak directly with a live medical systems specialist at +91 98765 43210 or 1800-LAB-CORE.
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Automated Backups Every 6 Hrs</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dual redundant cloud backups + local encrypted NAS snapshots. 100% protection against ransomware, hardware failures, or database corruptions.
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">On-Site Emergency Visit</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Certified field hardware engineers available for on-site machine interfacing, LAN cabling, and barcode printer troubleshooting across major regions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 11. FOUNDER & ARCHITECTURAL LEADERSHIP SECTION */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section id="founder" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-50 via-sky-50/40 to-slate-50 rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Bio & Leadership */}
              <div className="space-y-6">
                <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-100 px-3.5 py-1 rounded-full border border-sky-200">
                  Architectural Leadership & Ownership
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  Crafted by Nikil & The LabCore Medical Engineering Team
                </h2>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  <strong>NIKIL-LABCORE-ELIS-OS</strong> was founded by <strong>Nikil</strong> with a singular clinical conviction: 
                  healthcare professionals should never waste valuable hours wrestling with archaic, disjointed software when patients depend on rapid, error-free diagnostic answers.
                </p>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Our architecture combines high-speed bi-directional machine communication with strict national accreditation compliance (NABL, NABH, ABDM, ISO 15189). 
                  Whether you run a 20-sample neighborhood clinic or a 500-bed multi-speciality tertiary care center, you receive uncompromised clinical precision.
                </p>

                {/* Direct Contacts Grid */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                  <div className="flex items-center space-x-3 p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                    <Phone className="w-5 h-5 text-sky-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">DIRECT OWNER / DESK</span>
                      <strong className="text-slate-900 font-mono text-sm">+91 98765 43210</strong>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                    <Mail className="w-5 h-5 text-sky-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">FOUNDER EMAIL</span>
                      <strong className="text-slate-900">nikil@labcore-elis.com</strong>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                    <Headphones className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">24/7 TOLL-FREE HELPLINE</span>
                      <strong className="text-slate-900 font-mono text-sm">1800-LAB-CORE</strong>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                    <MapPin className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">R&D LAB & HEADQUARTERS</span>
                      <strong className="text-slate-900">Sector 18, Cyber Tech Park</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Consultation / Demo Form */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md">
                <div className="mb-6">
                  <h3 className="text-xl font-black text-slate-900">Direct Consultation with Nikil & Team</h3>
                  <p className="text-xs text-slate-500">
                    Get an instant quote, technical walkthrough, or arrange an on-site facility audit.
                  </p>
                </div>

                <form onSubmit={handleDemoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Dr. / Mr. / Ms. Name"
                      value={demoForm.name}
                      onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mobile / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765..."
                        value={demoForm.phone}
                        onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">City / Region</label>
                      <input
                        type="text"
                        placeholder="e.g. Mumbai, Delhi, Bengaluru"
                        value={demoForm.city}
                        onChange={(e) => setDemoForm({ ...demoForm, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Facility Name</label>
                      <input
                        type="text"
                        placeholder="Apex Diagnostics / City Hospital"
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
                        <option>Doctor Clinic & Collection Point</option>
                        <option>Radiology & Imaging Center</option>
                        <option>Multi-branch Diagnostic Chain</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Specific Requirements / Analyzers to Connect</label>
                    <textarea
                      rows={2}
                      placeholder="e.g., Connecting Sysmex & Roche machines, need WhatsApp reports, 200 samples/day"
                      value={demoForm.notes}
                      onChange={(e) => setDemoForm({ ...demoForm, notes: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Submit & Request 15-Minute Callback</span>
                  </button>

                  <p className="text-[10px] text-center text-slate-400">
                    By submitting, you agree to our Terms of Service & HIPAA-compliant patient confidentiality.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 12. FAQ ACCORDION */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50/70 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Everything You Need to Know Before Getting Started
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "How does the monthly rent work? Is there any lock-in contract?",
                a: "There are no lock-in contracts. You pay a predictable monthly rent (starting at ₹2,499/mo) based on your selected plan. You can upgrade, downgrade, or pause anytime with 15 days notice. All future software upgrades, security patches, and 24/7 technical support are 100% included in the rent."
              },
              {
                q: "Which laboratory machines and analyzers are supported for bi-directional interfacing?",
                a: "NIKIL-LABCORE-ELIS-OS supports over 65+ leading laboratory instruments across all major manufacturers including Roche (Cobas series), Sysmex (XN, XP, KX), Mindray (BC and BS series), Beckman Coulter, Abbott, Horiba, Erba, Bio-Rad, and Siemens. Both ASTM and HL7 protocols over RS-232 serial cables and TCP/IP LAN networks are supported."
              },
              {
                q: "Can this system run 100% offline inside our hospital without internet?",
                a: "Yes! While our cloud deployment is popular for multi-branch access, we also offer our Air-Gapped Local Server Appliance setup. In this mode, the entire operating system, database, and analyzer interface run entirely on your local hospital LAN server. Your hospital operations will never stop even if the internet is down."
              },
              {
                q: "How do patients receive their reports on WhatsApp?",
                a: "Once a test report is authorized with the pathologist's digital e-signature, the system automatically compiles a high-resolution, password-protected PDF. It then dispatches it via the WhatsApp Business API directly to the patient's registered mobile number within 2 seconds. The message includes an anti-tamper QR code."
              },
              {
                q: "Is NIKIL-LABCORE-ELIS-OS compliant with NABL, NABH and ABDM guidelines?",
                a: "Yes, 100%. The system complies with ISO 15189 and NABL requirements for sample traceability, delta check flagging, QC Levey-Jennings charts, and unalterable audit trails. For hospitals, it meets NABH electronic medical records (EMR) standards. It also comes integrated with Ayushman Bharat Digital Mission (ABDM) Milestone 1, 2, and 3."
              },
              {
                q: "How long does one-time setup and staff training take?",
                a: "Cloud setups are typically live within 24 to 48 hours after you provide your test price list and doctor letterhead. For on-site analyzer hardware interfacing, our certified engineer completes machine cabling, protocol calibration, and provides hands-on training to your technicians in 2 to 3 days."
              }
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
              >
                <button
                  onClick={() => setFaqOpenIndex(faqOpenIndex === index ? null : index)}
                  className="w-full py-4 px-5 text-left font-bold text-sm text-slate-800 hover:text-sky-600 flex justify-between items-center transition-colors"
                >
                  <span>{faq.q}</span>
                  {faqOpenIndex === index ? (
                    <ChevronUp className="w-4 h-4 text-sky-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {faqOpenIndex === index && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 13. ROLE-BASED QUICK LOGIN BAR (Direct Links to /login) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <section className="py-14 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-900">Direct Staff & Practitioner Access</h3>
            <p className="text-xs text-slate-500">
              Authorized clinical personnel can enter the secure portal using biometric, RFID badge, or master credentials.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { role: "Super Admin", icon: Shield, desc: "System Config", href: "/login" },
              { role: "Chief Pathologist", icon: Microscope, desc: "Sign-Off & Approvals", href: "/approvals" },
              { role: "OPD Doctor", icon: Stethoscope, desc: "EMR & Consult", href: "/doctors" },
              { role: "Lab Technician", icon: FlaskConical, desc: "Analyzers & Tests", href: "/analyzers" },
              { role: "Reception / Billing", icon: DollarSign, desc: "Tokens & Invoices", href: "/invoices" },
              { role: "Patient QR Check", icon: QrCode, desc: "Verify Report", href: "/verify-report" },
            ].map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 transition-all text-center group shadow-2xs"
              >
                <item.icon className="w-5 h-5 mx-auto text-sky-600 group-hover:scale-110 transition-transform mb-1.5" />
                <span className="font-bold text-xs text-slate-800 block">{item.role}</span>
                <span className="text-[10px] text-slate-400 block">{item.desc}</span>
              </Link>
            ))}
          </div>

          <div>
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-md transition-all hover:scale-102"
            >
              <Lock className="w-4 h-4 text-sky-400" />
              <span>Launch Full Hospital Operating Portal</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 14. COMPREHENSIVE MEDICAL FOOTER */}
      {/* ─────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-slate-800">
            {/* Col 1: Brand Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-white">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-black text-lg text-white tracking-tight">
                    NIKIL-LABCORE-ELIS-OS
                  </span>
                  <span className="block text-[10px] text-sky-400 font-mono">v4.2 Enterprise Healthcare Suite</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                Next-generation clinical operating system for hospitals, diagnostic pathology laboratories, and polyclinics. 
                Bi-directional machine interfacing, paperless EMR, and patient-centric healthcare IT.
              </p>
              <div className="text-[11px] text-slate-300 space-y-1">
                <p><strong>Owner & Chief Architect:</strong> Nikil</p>
                <p><strong>24/7 Helpline:</strong> +91 98765 43210 / 1800-LAB-CORE</p>
                <p><strong>Official Email:</strong> contact@labcore-elis.com</p>
              </div>
            </div>

            {/* Col 2: Core Modules */}
            <div className="space-y-3">
              <h4 className="font-black text-white uppercase tracking-wider text-xs">Clinical Modules</h4>
              <ul className="space-y-2">
                <li><Link href="/analyzers" className="hover:text-white transition-colors">Analyzer Interfacing</Link></li>
                <li><Link href="/samples" className="hover:text-white transition-colors">Specimen Accessioning</Link></li>
                <li><Link href="/approvals" className="hover:text-white transition-colors">Pathologist Sign-off</Link></li>
                <li><Link href="/doctors" className="hover:text-white transition-colors">Doctor OPD & EMR</Link></li>
                <li><Link href="/invoices" className="hover:text-white transition-colors">Billing & GST Invoices</Link></li>
                <li><Link href="/abdm" className="hover:text-white transition-colors">ABDM National Gateway</Link></li>
              </ul>
            </div>

            {/* Col 3: Accreditations */}
            <div className="space-y-3">
              <h4 className="font-black text-white uppercase tracking-wider text-xs">Accreditations</h4>
              <ul className="space-y-2">
                <li><span className="text-slate-300">NABL (ISO 15189:2022)</span></li>
                <li><span className="text-slate-300">NABH Digital Hospital</span></li>
                <li><span className="text-slate-300">ABDM M1, M2, M3 Ready</span></li>
                <li><span className="text-slate-300">HL7 / FHIR Standards</span></li>
                <li><span className="text-slate-300">HIPAA & DISHA Security</span></li>
                <li><Link href="/verify-report" className="text-sky-400 hover:text-sky-300 font-semibold">Verify Test QR Code</Link></li>
              </ul>
            </div>

            {/* Col 4: Trust & Legal */}
            <div className="space-y-3">
              <h4 className="font-black text-white uppercase tracking-wider text-xs">Trust & Legal</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => {
                      setActiveLegalTab("terms");
                      setIsTermsModalOpen(true);
                    }}
                    className="hover:text-white transition-colors text-left"
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
                    className="hover:text-white transition-colors text-left"
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
                    className="hover:text-white transition-colors text-left"
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
                    className="hover:text-white transition-colors text-left"
                  >
                    Clinical Interfacing Disclaimer
                  </button>
                </li>
                <li>
                  <Link href="/login" className="text-sky-400 hover:text-sky-300 font-semibold">
                    Staff Portal Login
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>
              © {new Date().getFullYear()} NIKIL-LABCORE-ELIS-OS. All rights reserved. Architected for medical excellence.
            </p>
            <div className="flex items-center space-x-6">
              <span className="text-slate-400">Founder & Owner: Nikil</span>
              <span>•</span>
              <span className="text-slate-400">24/7 Emergency Support</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">System Status: All Services Operational</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 15. MODAL: ROLE-BASED QUICK LOGIN */}
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
              Select your role below to launch the dedicated console or continue to the master authentication login page:
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
                    <span className="text-[10px] text-slate-400">Facility Controls & Config</span>
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
                    <span className="text-[10px] text-slate-400">Approvals, Results & Analyzers</span>
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
                    <span className="text-[10px] text-slate-400">EMR, Vitals & E-Prescriptions</span>
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
                Open Full Login Page →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 16. MODAL: BOOK LIVE DEMO */}
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
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center">
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
                      placeholder="e.g. Pune, Jaipur"
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
                    placeholder="Your Hospital / Lab Name"
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
                    <option>Radiology & Imaging Center</option>
                    <option>Multi-branch Diagnostic Chain</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-black text-sm rounded-xl shadow-md transition-all"
                  >
                    Confirm Live Demo Schedule
                  </button>
                  <p className="text-[10px] text-center text-slate-400 mt-2">
                    Free live session • Custom quote calculation • No obligations
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 17. MODAL: TERMS & CONDITIONS / PRIVACY POLICY / SLA */}
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
                    Links embedded inside reports link exclusively to secure verification nodes (`/verify-report`) with HMAC SHA-256 signatures.
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