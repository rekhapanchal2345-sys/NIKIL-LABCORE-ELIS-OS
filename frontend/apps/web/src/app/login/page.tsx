"use client";
// ──────────────────────────────────────────────────────────────────────────
// LabCore ELIS™ Enterprise OS — Ultra-Professional Hospital & Diagnostic OS
// Theme: Ultra Light White, Sterile Medical Grade, NABH 5th Ed & NABL ISO 15189:2022
// Built for: Super-Specialty Hospitals, Reference Pathology Labs, Polyclinics & Imaging Centers
// ──────────────────────────────────────────────────────────────────────────

import { FormEvent, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { WelcomeTransition } from "@/components/auth/WelcomeTransition";
import {
  isPrivacyMode,
  setPrivacyMode,
  isRememberMe,
  setRememberMe,
  getRoleLabel,
  verifyMfaLogin,
  type AuthSession,
  type AuthUser,
} from "@/lib/auth";
import { ApiError } from "@/lib/api";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  Loader2,
  ShieldCheck,
  FlaskConical,
  Activity,
  ChevronRight,
  AlertCircle,
  Cpu,
  Zap,
  Wifi,
  Shield,
  Heart,
  Scan,
  KeyRound,
  ArrowRight,
  Building2,
  Stethoscope,
  Microscope,
  Syringe,
  Volume2,
  VolumeX,
  Flame,
  BadgeCheck,
  Radio,
  Check,
  Sliders,
  HeartPulse,
  Crosshair,
  Layers,
  Phone,
  Clock,
  FileText,
  HelpCircle,
  X,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Share2,
  ExternalLink,
  Info,
  Key,
  Bell,
  Sparkles,
  QrCode,
  CheckCircle,
  Hospital,
  Server,
  FileCheck,
} from "lucide-react";
import LabCoreLogo from "@/components/common/LabCoreLogo";
import MasterRegistrationModal from "@/components/auth/MasterRegistrationModal";

/* ────────────────────────────────────────────────────────────────
   4 CLINICAL FACILITY HUBS
───────────────────────────────────────────────────────────────── */
type FacilityHub = "hospital" | "pathology" | "clinic" | "radiology";

interface HubConfig {
  id: FacilityHub;
  name: string;
  shortName: string;
  category: string;
  badge: string;
  headlineTitle: string;
  headlineHighlight: string;
  accentColor: string;
  lightBg: string;
  typingTexts: string[];
  description: string;
  stats: { value: string; label: string; sub: string }[];
}

const CLINICAL_HUBS: Record<FacilityHub, HubConfig> = {
  hospital: {
    id: "hospital",
    name: "Super-Specialty Hospital Network",
    shortName: "Inpatient Hospital",
    category: "Tertiary Inpatient, ICU & Emergency STAT LIS",
    badge: "NABH 5th Edition Accredited",
    headlineTitle: "Precision Hospital",
    headlineHighlight: "Clinical Diagnostic OS",
    accentColor: "#0284c7",
    lightBg: "#f0f9ff",
    typingTexts: [
      "Inpatient Emergency STAT Accession.",
      "ICU Panic Value Critical Broadcasts.",
      "Bedside Barcode Phlebotomy Verification.",
      "Multi-Specialty Doctor CPOE Interfacing.",
    ],
    description:
      "Enterprise healthcare diagnostic operating system unifying hospital CPOE, inpatient wards, intensive care units, and central laboratory automation with zero specimen turnaround delay.",
    stats: [
      { value: "4.8M+", label: "Inpatient Tests/Yr", sub: "+14.2% YoY growth" },
      { value: "99.98%", label: "Diagnostic Accuracy", sub: "Zero-error standard" },
      { value: "< 18 min", label: "STAT Emergency TAT", sub: "Median ICU response" },
      { value: "99.99%", label: "System Availability", sub: "Continuous 24/7 SLA" },
    ],
  },
  pathology: {
    id: "pathology",
    name: "Robotic Reference Laboratory Core",
    shortName: "Pathology Core",
    category: "High-Throughput Reference Laboratory & Molecular LIS",
    badge: "NABL (ISO 15189:2022) Certified",
    headlineTitle: "Precision Laboratory",
    headlineHighlight: "Robotic Intelligence OS",
    accentColor: "#4f46e5",
    lightBg: "#eef2ff",
    typingTexts: [
      "Robotic Track Bi-directional Analyzer Interfacing.",
      "Real-time Delta Checks & Westgard Multi-Rule QC.",
      "Next-Gen Sequencing & Molecular Genomics.",
      "Automated Decapping, Centrifuging & Sorting.",
    ],
    description:
      "High-throughput reference laboratory system with automated conveyor specimen management, automated delta checks, and electronic clinical validation for accurate diagnosis.",
    stats: [
      { value: "14.6M+", label: "Analyzed Specimens/Yr", sub: "Across 12 Reference Labs" },
      { value: "99.99%", label: "Analytical Concordance", sub: "CAP LAP #729108 audited" },
      { value: "< 15 min", label: "Automated LIS TAT", sub: "Robotic track routing" },
      { value: "ISO 15189", label: "Quality Compliance", sub: "2022 Revised Standard" },
    ],
  },
  clinic: {
    id: "clinic",
    name: "Polyclinic & Outpatient Network",
    shortName: "Polyclinic Network",
    category: "Daycare Clinics, OPD & Phlebotomy Collection Hub",
    badge: "ABDM & HIPAA Digital Compliant",
    headlineTitle: "Precision Polyclinic",
    headlineHighlight: "Diagnostic Care OS",
    accentColor: "#0d9488",
    lightBg: "#f0fdfa",
    typingTexts: [
      "OPD Walk-in Registration & Digital Queue.",
      "Instant WhatsApp & SMS Verified Report Delivery.",
      "Home Phlebotomy Dispatch & GPS Sample Tracking.",
      "Ayushman Bharat Digital Health (ABHA M3).",
    ],
    description:
      "Modern polyclinic operating system connecting consulting doctors, sample collection centers, electronic prescriptions, and automated patient report delivery across all clinical branches.",
    stats: [
      { value: "920k+", label: "Outpatient Visits/Yr", sub: "Across 48 Polyclinics" },
      { value: "99.6%", label: "Patient Satisfaction", sub: "Verified patient feedback" },
      { value: "< 3 min", label: "Registration Queue", sub: "ABHA QR fast-scan" },
      { value: "ABDM M3", label: "Digital Certified", sub: "National Health Authority" },
    ],
  },
  radiology: {
    id: "radiology",
    name: "Radiodiagnostics & Tele-Imaging",
    shortName: "Imaging Wing",
    category: "PACS DICOM Repository & Cross-Modality Tele-Radiology",
    badge: "DICOM 3.0 & AERB Certified",
    headlineTitle: "Precision Radiology",
    headlineHighlight: "Imaging Intelligence OS",
    accentColor: "#d97706",
    lightBg: "#fffbeb",
    typingTexts: [
      "PACS DICOM Multi-Modality Gateway (CT/MRI/USG).",
      "AI-Powered Preliminary Lesion & Nodule Screen.",
      "Tele-Radiology Consultant Reporting Console.",
      "Zero-Footprint Web DICOM Viewer Integration.",
    ],
    description:
      "Enterprise medical imaging information system interfaced with hospital PACS, cross-sectional CT/MRI scanners, and rapid tele-radiology review for clinical precision.",
    stats: [
      { value: "650k+", label: "Scans Interpreted/Yr", sub: "CT, MRI, Digital X-Ray" },
      { value: "99.8%", label: "Radiological Concordance", sub: "Double-blind review" },
      { value: "< 25 min", label: "Emergency CT Read TAT", sub: "Stroke & Trauma protocol" },
      { value: "DICOM 3.0", label: "Lossless Standard", sub: "AERB Safety compliant" },
    ],
  },
};

/* ────────────────────────────────────────────────────────────────
   6 DETAILED PROFESSIONAL HOSPITAL & LAB STAFF ROSTER
───────────────────────────────────────────────────────────────── */
const STAFF_ROSTER = [
  {
    name: "Dr. Rajeshwari Swaminathan",
    degrees: "MD, FRCPath, DipRCPath",
    designation: "Director of Clinical Pathology & Laboratory Medicine",
    department: "Department of Clinical Pathology",
    roleCategory: "Consultant Pathologist",
    icon: Microscope,
    email: "pathologist@hospital.com",
    badge: "Director",
    code: "DR-PATH-8812",
    clearance: "Level 5 Unrestricted",
    color: "border-sky-300 text-sky-800 bg-sky-50/70",
  },
  {
    name: "Dr. Siddharth Verma",
    degrees: "MD (Medicine), DM (Cardiology)",
    designation: "Chief of Critical Care & Inpatient Emergency",
    department: "Emergency Trauma & ICU Core",
    roleCategory: "Critical Care / Doctor",
    icon: Stethoscope,
    email: "icu.consultant@hospital.com",
    badge: "Chief ICU",
    code: "DR-ICU-1094",
    clearance: "Level 4 Emergency",
    color: "border-blue-300 text-blue-800 bg-blue-50/70",
  },
  {
    name: "Dr. Neha Kulkarni",
    degrees: "Ph.D (Genetics), FACMG",
    designation: "Head of Molecular Diagnostics & Cytogenetics",
    department: "Molecular Genomics & PCR Lab",
    roleCategory: "Molecular Scientist",
    icon: FlaskConical,
    email: "molecular@labcore.com",
    badge: "Genomics",
    code: "SCI-MOL-6731",
    clearance: "Level 4 Laboratory",
    color: "border-indigo-300 text-indigo-800 bg-indigo-50/70",
  },
  {
    name: "Amitabh Sen",
    degrees: "M.Sc (Biochemistry), Lead MLT",
    designation: "Senior Medical Laboratory Technologist & Automation Supervisor",
    department: "Automated Chemistry Track Bay",
    roleCategory: "Senior MLT / Biochemist",
    icon: Cpu,
    email: "biochemist@labcore.com",
    badge: "Lead MLT",
    code: "MLT-BIO-4402",
    clearance: "Level 3 Technical",
    color: "border-teal-300 text-teal-800 bg-teal-50/70",
  },
  {
    name: "Kavita Menon",
    degrees: "MHA (Hospital Administration)",
    designation: "Hospital Central Admissions & Registration Lead",
    department: "Patient Accession & Billing Wing",
    roleCategory: "Hospital Front Desk / OPD",
    icon: Building2,
    email: "frontdesk@hospital.com",
    badge: "OPD Desk",
    code: "OPD-ADM-1190",
    clearance: "Level 2 Frontline",
    color: "border-emerald-300 text-emerald-800 bg-emerald-50/70",
  },
  {
    name: "Dr. A. K. Banerjee",
    degrees: "MD, M.S., FICS",
    designation: "Medical Superintendent & Hospital Administrator",
    department: "Executive Directorate & IT Governance",
    roleCategory: "Medical Director / Super Admin",
    icon: ShieldCheck,
    email: "ADMIN001",
    badge: "Executive",
    code: "EXEC-SUP-0001",
    clearance: "Level 5 Super Admin",
    color: "border-purple-300 text-purple-800 bg-purple-50/70",
  },
];

/* ────────────────────────────────────────────────────────────────
   SPECIMEN BLOOD TUBE RACK ACCESSION (Pathology Visualizer)
───────────────────────────────────────────────────────────────── */
const SPECIMEN_TUBES = [
  {
    name: "EDTA K2",
    dept: "Hematology & CBC",
    capColor: "#9333ea", // Lavender
    capGlow: "rgba(147, 51, 234, 0.4)",
    count: "1,420 Tubes",
    fillPercent: 88,
  },
  {
    name: "SST Gel",
    dept: "Biochemistry & Serology",
    capColor: "#eab308", // Gold
    capGlow: "rgba(234, 179, 8, 0.4)",
    count: "2,840 Tubes",
    fillPercent: 94,
  },
  {
    name: "Citrate 3.2%",
    dept: "Coagulation & PT-INR",
    capColor: "#0284c7", // Light Blue
    capGlow: "rgba(2, 132, 199, 0.4)",
    count: "410 Tubes",
    fillPercent: 72,
  },
  {
    name: "Plain Serum",
    dept: "Blood Bank Crossmatch",
    capColor: "#dc2626", // Red
    capGlow: "rgba(220, 38, 38, 0.4)",
    count: "320 Tubes",
    fillPercent: 65,
  },
  {
    name: "Heparin",
    dept: "STAT Blood Gas / ABG",
    capColor: "#16a34a", // Green
    capGlow: "rgba(22, 163, 74, 0.4)",
    count: "180 Tubes",
    fillPercent: 90,
  },
];

/* ────────────────────────────────────────────────────────────────
   HIGH-THROUGHPUT ANALYZER MATRIX
───────────────────────────────────────────────────────────────── */
const CLINICAL_ANALYZERS = [
  { name: "ROCHE COBAS 8000", dept: "Biochemistry & Serology", status: "ONLINE", speed: "3,400 Tests/hr" },
  { name: "SYSMEX XN-9100", dept: "Automated Hematology Line", status: "RUNNING", speed: "180 Samples/hr" },
  { name: "BECKMAN COULTER AU5800", dept: "High-Throughput Chemistry", status: "SYNCHRONIZED", speed: "2,000 Tests/hr" },
  { name: "ABBOTT ALINITY ci", dept: "Integrated Immunoassay", status: "CALIBRATED", speed: "1,500 Tests/hr" },
  { name: "BIO-RAD D-10 HPLC", dept: "Hemoglobinopathy & HbA1c", status: "OPTIMAL", speed: "Standard Curve OK" },
  { name: "BIOMÉRIEUX VITEK 2", dept: "Microbiology ID & AST", status: "INCUBATING", speed: "64 Cards Active" },
  { name: "RADIOMETER ABL90 FLEX", dept: "Arterial Blood Gas (ICU/STAT)", status: "READY", speed: "35s Response" },
  { name: "GE HEALTHCARE PACS", dept: "DICOM Modality Router", status: "STREAMING", speed: "0.2s Image Load" },
];

/* ────────────────────────────────────────────────────────────────
   ROBOTIC SPECIMEN TRACK CONVEYOR SIMULATION (Clinical Light)
───────────────────────────────────────────────────────────────── */
function RoboticTrackSimulation() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const steps = [
    { title: "Barcoded 2D Tube Accession", code: "STAGE 01", tag: "LASER OCR VERIFIED" },
    { title: "Robotic Centrifugation & Decap", code: "STAGE 02", tag: "3,500 RPM AUTO" },
    { title: "Aliquot & Cobas 8000 Dispatch", code: "STAGE 03", tag: "ROCHE INTERFACED" },
    { title: "Analyzer Run & Delta Check", code: "STAGE 04", tag: "99.9% VALIDATED" },
  ];

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Layers className="h-4 w-4 text-sky-600" />
          Automated Robotic Track Middleware
        </span>
        <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          CONVEYOR IN-FLIGHT
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {steps.map((st, i) => {
          const isCurrent = activeStep === i;
          return (
            <div
              key={st.code}
              className={`p-3 rounded-xl text-left border transition-all duration-300 ${
                isCurrent
                  ? "bg-sky-50/90 border-sky-500 shadow-sm ring-1 ring-sky-300"
                  : "bg-slate-50/70 border-slate-200/80 opacity-75"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-500 font-mono">{st.code}</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                    isCurrent ? "bg-sky-200/70 text-sky-900" : "text-slate-500 bg-slate-200/70"
                  }`}
                >
                  {st.tag}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-800 block leading-snug truncate">
                {st.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   DUAL CARDIAC MONITOR CANVAS (Light Medical Paper Grid)
───────────────────────────────────────────────────────────────── */
function DualVitalsMonitor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let offset = 0;
    const W = 480;
    const H = 88;

    const ecgPattern = [
      0, 0, 0, 0.05, -0.05, 0, 0.08, -0.28, 0.92, -0.42, 0.05, 0.18, 0.05, 0, 0, 0,
      0, 0, 0.04, -0.04, 0, 0.06, -0.24, 0.86, -0.38, 0.04, 0.16, 0.04, 0, 0, 0, 0,
    ];

    const plethPattern = [
      0.1, 0.25, 0.5, 0.85, 0.72, 0.6, 0.65, 0.5, 0.35, 0.22, 0.15, 0.1, 0.1, 0.1, 0.1, 0.1,
    ];

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      // Clinical Telemetry Paper Background
      ctx!.fillStyle = "#fcfdfd";
      ctx!.fillRect(0, 0, W, H);

      // Fine millimeter grid
      ctx!.strokeStyle = "rgba(226, 232, 240, 0.75)";
      ctx!.lineWidth = 0.5;
      for (let x = 0; x < W; x += 12) {
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, H);
        ctx!.stroke();
      }
      for (let y = 0; y < H; y += 12) {
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(W, y);
        ctx!.stroke();
      }

      // Stronger 5-grid divisions
      ctx!.strokeStyle = "rgba(203, 213, 225, 0.85)";
      ctx!.lineWidth = 0.75;
      for (let x = 0; x < W; x += 60) {
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, H);
        ctx!.stroke();
      }
      for (let y = 0; y < H; y += 44) {
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(W, y);
        ctx!.stroke();
      }

      // ─── 1. ECG Trace (Clinical Forest Emerald) ───
      ctx!.beginPath();
      ctx!.strokeStyle = "#059669";
      ctx!.lineWidth = 2.2;
      ctx!.shadowColor = "rgba(5, 150, 105, 0.25)";
      ctx!.shadowBlur = 4;
      const ecgMid = 26;
      const step = 6;
      const totalPoints = Math.ceil(W / step) + 1;

      for (let i = 0; i < totalPoints; i++) {
        const x = i * step;
        const patIndex = Math.floor((i + offset) % ecgPattern.length);
        const yVal = ecgPattern[patIndex] || 0;
        const y = ecgMid - yVal * 19;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.stroke();

      // Lead tracer dot
      const tracerIndex = Math.floor(offset % totalPoints);
      const tracerX = (tracerIndex * step) % W;
      const ecgPatI = Math.floor((tracerIndex + offset) % ecgPattern.length);
      const tracerY = ecgMid - (ecgPattern[ecgPatI] || 0) * 19;

      ctx!.beginPath();
      ctx!.arc(tracerX, tracerY, 3.5, 0, Math.PI * 2);
      ctx!.fillStyle = "#047857";
      ctx!.shadowColor = "rgba(4, 120, 87, 0.6)";
      ctx!.shadowBlur = 6;
      ctx!.fill();

      // ─── 2. SpO2 Pleth Trace (Clinical Cyan Blue) ───
      ctx!.beginPath();
      ctx!.strokeStyle = "#0284c7";
      ctx!.lineWidth = 1.8;
      ctx!.shadowColor = "rgba(2, 132, 199, 0.25)";
      ctx!.shadowBlur = 4;
      const plethMid = 65;

      for (let i = 0; i < totalPoints; i++) {
        const x = i * step;
        const patIndex = Math.floor((i + offset * 0.7) % plethPattern.length);
        const yVal = plethPattern[patIndex] || 0;
        const y = plethMid - yVal * 15;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.stroke();

      offset += 0.28;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            <HeartPulse className="h-4 w-4 text-emerald-600 animate-pulse" />
            <span>ECG LEAD-II: 72 BPM</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-sky-800 font-bold bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
            <Activity className="h-4 w-4 text-sky-600" />
            <span>SpO2: 99% PLETH</span>
          </div>
        </div>
        <div className="text-xs text-slate-700 font-bold bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
          <span>RESP 16 · BP 120/80 mmHg</span>
        </div>
      </div>
      <div className="rounded-xl overflow-hidden border border-slate-200">
        <canvas ref={canvasRef} width={480} height={88} className="w-full block" />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   CLEAN MEDICAL LIGHT BACKGROUND (Soft, Expansive, Minimalist)
───────────────────────────────────────────────────────────────── */
function MedicalLightBackground({ activeHub }: { activeHub: HubConfig }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Soft Clinical Atmospheric Glows */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `radial-gradient(1200px circle at 15% 15%, ${activeHub.lightBg} 0%, rgba(255,255,255,0.85) 45%, #ffffff 80%), radial-gradient(900px circle at 85% 75%, rgba(240,249,255,0.7) 0%, transparent 60%)`,
        }}
      />
      {/* Delicate Hospital Dot Matrix Pattern */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(circle, #cbd5e1 0.75px, transparent 0.75px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Subtle Medical Scan Beam */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: "100%",
          height: 2,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(2,132,199,0.25) 30%, rgba(79,70,229,0.3) 50%, rgba(13,148,136,0.25) 70%, transparent 100%)",
          animation: "scanBeam 9s linear infinite",
          filter: "blur(1px)",
        }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   SYSTEM TELEMETRY & 24/7 HELPLINE BAR
───────────────────────────────────────────────────────────────── */
function SystemStatusBar({
  soundEnabled,
  onToggleSound,
  onOpenHelpline,
}: {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenHelpline: () => void;
}) {
  const [tick, setTick] = useState(0);
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTick((t) => t + 1);
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const cpu = Math.floor(14 + Math.sin(tick * 0.3) * 4);
  const latency = Math.floor(5 + Math.cos(tick * 0.4) * 3);

  return (
    <div className="flex items-center gap-2.5 text-xs">
      {/* 24/7 Helpline Trigger Pill */}
      <button
        type="button"
        onClick={onOpenHelpline}
        className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all font-bold cursor-pointer shadow-2xs"
        title="Open 24/7 Emergency Lab & Critical Care Support"
      >
        <Phone className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
        <span>24/7 STAT Helpline: 1800-MED-STAT</span>
      </button>

      {/* Online Status Pill */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>24/7 LIS STAT ONLINE</span>
      </div>

      <div className="hidden lg:flex items-center gap-1 text-slate-600 font-semibold">
        <Cpu className="h-3.5 w-3.5 text-sky-600" />
        <span>CPU {cpu}%</span>
      </div>

      <div className="hidden lg:flex items-center gap-1 text-slate-600 font-semibold">
        <Wifi className="h-3.5 w-3.5 text-indigo-600" />
        <span>{latency}ms</span>
      </div>

      <div className="hidden sm:flex items-center gap-1.5 text-slate-800 font-bold bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
        <Clock className="h-3.5 w-3.5 text-slate-500" />
        <span>{time} IST</span>
      </div>

      <button
        type="button"
        onClick={onToggleSound}
        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
        title={soundEnabled ? "Mute hospital audio alerts" : "Enable clinical audio cues"}
      >
        {soundEnabled ? <Volume2 className="h-4 w-4 text-sky-600" /> : <VolumeX className="h-4 w-4" />}
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   ANIMATED TYPING TEXT
───────────────────────────────────────────────────────────────── */
function TypingText({ texts, className }: { texts: string[]; className?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = texts[currentIndex % texts.length];

    if (!isDeleting && displayed === current) {
      const timeout = setTimeout(() => setIsDeleting(true), 2500);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && displayed === "") {
      setIsDeleting(false);
      setCurrentIndex((prev) => (prev + 1) % texts.length);
      return;
    }

    const speed = isDeleting ? 25 : 55;
    const timeout = setTimeout(() => {
      if (isDeleting) {
        setDisplayed(current.slice(0, displayed.length - 1));
      } else {
        setDisplayed(current.slice(0, displayed.length + 1));
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, currentIndex, texts]);

  return (
    <span className={className}>
      {displayed}
      <span
        className="inline-block w-[2px] h-[0.9em] bg-sky-600 ml-0.5 align-middle"
        style={{ animation: "blink 1s step-end infinite" }}
      />
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────
   TERMS & CONDITIONS AND HIPAA COMPLIANCE MODAL
───────────────────────────────────────────────────────────────── */
function TermsAndConditionsModal({
  isOpen,
  onClose,
  onAccept,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-sky-50 via-indigo-50 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Terms of Service & Clinical Data Governance Agreement
              </h3>
              <p className="text-xs text-slate-600">
                HIPAA Security Rule · ABDM M3 Standard · NABL ISO 15189:2022
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 flex items-start gap-3">
            <Info className="h-4 w-4 text-sky-700 shrink-0 mt-0.5" />
            <p className="text-sky-900 font-medium">
              By accessing LabCore ELIS™ Enterprise OS, you authenticate as an authorized clinical or administrative staff member under strict statutory healthcare confidentiality standards.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">1. Authorized Clinical Use & Patient Safety</h4>
            <p>
              This workstation provides access to electronic health records (EHR), laboratory accession records, inpatient requisitions, and critical medical diagnostic outputs. Use is strictly limited to authorized patient diagnostic, clinical monitoring, and treatment functions.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">2. HIPAA PHI & ABDM Privacy Safeguards</h4>
            <p>
              Protected Health Information (PHI) must be handled in compliance with HIPAA and Ayushman Bharat Digital Mission (ABDM). Unauthorized disclosure, screen recording, patient record exportation, or credential sharing is strictly prohibited and subject to disciplinary and regulatory penalties.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">3. Immutable Audit Trails & Digital Signature</h4>
            <p>
              In compliance with NABL (ISO 15189:2022) and CAP laboratory standards, every sample receipt, centrifuge step, delta check override, report approval, and diagnostic modification is cryptographically signed and logged with timestamp, user clearance ID, and IP address.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">4. Emergency STAT & Break-Glass Protocol</h4>
            <p>
              Emergency STAT fast-track and Break-Glass access protocols bypass standard queuing for verified Code Blue, Trauma, and ICU orders. All break-glass access triggers an immediate notification to the Hospital Medical Director and Chief Information Security Officer (CISO).
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">5. 24/7 Continuous Service & Technical Support</h4>
            <p>
              LabCore ELIS operates with an active SLA of 99.99% uptime. For technical or analyzer middleware issues, the 24/7 central hospital biomedical engineering desk can be paged directly via the system helpline.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Document Version 4.2.1-REG · Validated 2026
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Acknowledge & Agree</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   24/7 EMERGENCY SUPPORT & HOTLINE MODAL
───────────────────────────────────────────────────────────────── */
function EmergencySupportModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-rose-50 via-orange-50 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md">
              <Phone className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                24/7 STAT Emergency Diagnostic Support
              </h3>
              <p className="text-xs text-rose-700 font-semibold">
                Instant Hospital Code Blue & Laboratory Escalation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3.5 text-xs text-slate-700">
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flame className="h-5 w-5 text-rose-600" />
              <div>
                <span className="font-bold text-rose-900 block text-sm">Code Blue & Trauma STAT Line</span>
                <span className="text-[11px] text-rose-700">Immediate specimen pickup & priority rack</span>
              </div>
            </div>
            <a
              href="tel:18006337828"
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              Ext. 99
            </a>
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-5 w-5 text-sky-600" />
              <div>
                <span className="font-bold text-sky-900 block text-sm">On-Call Consultant Pathologist</span>
                <span className="text-[11px] text-sky-700">Dr. Rajeshwari Swaminathan (MD, FRCPath)</span>
              </div>
            </div>
            <a
              href="tel:+919876543210"
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              Dial Line 1
            </a>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Syringe className="h-5 w-5 text-emerald-600" />
              <div>
                <span className="font-bold text-emerald-900 block text-sm">Blood Bank & STAT Crossmatch</span>
                <span className="text-[11px] text-emerald-700">Packed RBC, FFP, Platelet dispatch</span>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs">
              Ext. 104
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cpu className="h-5 w-5 text-indigo-600" />
              <div>
                <span className="font-bold text-slate-900 block text-sm">Biomedical Engineering & LIS Middleware</span>
                <span className="text-[11px] text-slate-600">Roche Cobas & Sysmex telemetry support</span>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs">
              Ext. 800
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Toll-Free National Helpline: 1800-MED-STAT (24/7)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   FORGOT PASSWORD / ACCESS RECOVERY MODAL
───────────────────────────────────────────────────────────────── */
function ForgotPasswordModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [resetEmail, setResetEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4.5 bg-gradient-to-r from-sky-50 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hospital Access Key Recovery</h3>
              <p className="text-xs text-slate-500">Verified Employee Self-Service</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-4 space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Recovery Link Sent</h4>
              <p className="text-xs text-slate-600">
                A secure OTP and recovery challenge have been dispatched to the hospital registered mobile and email associated with <span className="font-bold text-sky-700">{resetEmail}</span>.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition-colors"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-4"
            >
              <p className="text-xs text-slate-600">
                Enter your Hospital Employee ID, Clinical Email, or Medical Clearance Code to receive an authorization link.
              </p>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Clinical ID / Registered Email
                </label>
                <div className="flex items-center px-3.5 py-2.5 rounded-xl border border-slate-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 bg-slate-50/50">
                  <Mail className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
                  <input
                    type="text"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    placeholder="e.g. dr.verma@hospital.com or ADMIN001"
                    className="w-full bg-transparent text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition-all"
                >
                  Send Verification OTP
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  // Facility Hub State
  const [activeHubKey, setActiveHubKey] = useState<FacilityHub>("hospital");
  const activeHub = CLINICAL_HUBS[activeHubKey];

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mfaChallenge, setMfaChallenge] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [returnUrl, setReturnUrl] = useState("/dashboard");
  const [privacyMode, setPrivacyModeState] = useState(false);
  const [rememberMe, setRememberMeState] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState<{ name: string; role: string; lastLogin?: string } | null>(null);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showHelplineModal, setShowHelplineModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [, setLockoutTimer] = useState<number | null>(null);

  // Advanced States
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [statPriority, setStatPriority] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<(typeof STAFF_ROSTER)[0] | null>(null);
  const [rfidScanning, setRfidScanning] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // 3D Parallax Card Tilt
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const passwordRef = useRef<HTMLInputElement>(null);

  // Audio tone generator
  const playTactileTone = useCallback(
    (type: "click" | "badge" | "success" | "stat" = "click") => {
      if (!soundEnabled || typeof window === "undefined") return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        if (type === "click") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(850, ctx.currentTime);
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
          osc.start();
          osc.stop(ctx.currentTime + 0.04);
        } else if (type === "badge") {
          osc.type = "triangle";
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.09); // A5
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        } else if (type === "stat") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
          gain.gain.setValueAtTime(0.03, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
          osc.start();
          osc.stop(ctx.currentTime + 0.18);
        } else if (type === "success") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.16); // G5
          gain.gain.setValueAtTime(0.06, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
          osc.start();
          osc.stop(ctx.currentTime + 0.32);
        }
        osc.connect(gain);
        gain.connect(ctx.destination);
      } catch {}
    },
    [soundEnabled]
  );

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = ((y - cy) / cy) * -2;
    const ry = ((x - cx) / cx) * 2;
    setTilt({ rx, ry });
  };

  const handleCardMouseLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  function sanitizeReturnUrl(raw: string | null): string {
    if (!raw) return "/dashboard";
    const isSafePath =
      raw.startsWith("/") &&
      !raw.startsWith("//") &&
      !raw.startsWith("/\\") &&
      !raw.includes("\\") &&
      !raw.startsWith("/login") &&
      raw !== "/" &&
      !/[\u0000-\u001f\u007f]/.test(raw);
    return isSafePath ? raw : "/dashboard";
  }

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    setPrivacyModeState(isPrivacyMode());
    setRememberMeState(isRememberMe());
    setBiometricAvailable(false);
    const p = new URLSearchParams(window.location.search).get("returnUrl");
    setReturnUrl(sanitizeReturnUrl(p));
    return () => document.documentElement.removeAttribute("data-theme");
  }, []);

  const handleKeyDownPassword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  // Staff Selection Handler
  const handleSelectStaff = (staff: (typeof STAFF_ROSTER)[0]) => {
    playTactileTone("badge");
    setSelectedStaff(staff);
    setEmail(staff.email);
    if (!password) {
      setPassword("Admin@1234");
    }
    setError("");
    setTimeout(() => {
      passwordRef.current?.focus();
    }, 100);
  };

  // RFID Smart Badge Proximity Tap Simulation
  const handleSimulateRfidTap = () => {
    playTactileTone("badge");
    setRfidScanning(true);
    const staff = selectedStaff || STAFF_ROSTER[0];
    setSelectedStaff(staff);
    setEmail(staff.email);
    setPassword("Admin@1234");
    setError("");

    setTimeout(() => {
      setRfidScanning(false);
      playTactileTone("success");
    }, 600);
  };

  const revealWelcome = (sessionUser?: AuthUser) => {
    const TODAY_KEY = "lc_last_welcome_date";
    const todayStr = new Date().toDateString();
    const isRepeat = sessionStorage.getItem(TODAY_KEY) === todayStr;
    sessionStorage.setItem(TODAY_KEY, todayStr);
    if (isRepeat) sessionStorage.setItem("lc_welcome_short", "1");
    else sessionStorage.removeItem("lc_welcome_short");

    const displayName =
      sessionUser?.name ||
      sessionUser?.fullName ||
      [sessionUser?.firstName, sessionUser?.lastName].filter(Boolean).join(" ") ||
      email.split("@")[0];

    setWelcomeUser({
      name: displayName,
      role: getRoleLabel(sessionUser?.role, "Clinical Staff"),
      lastLogin: (sessionUser as Record<string, unknown> | undefined)?.lastLoginAt as string | undefined,
    });
    setShowWelcome(true);
  };

  const startMfaSetup = (session: AuthSession) => {
    sessionStorage.setItem("mfaSetupToken", session.mfaToken || "");
    sessionStorage.setItem("mfaOtpauthUrl", session.otpauthUrl || "");
    sessionStorage.setItem("mfaUserEmail", session.user.email);
    router.push("/mfa-setup");
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    playTactileTone("click");
    setError("");

    if (!termsAccepted) {
      setError("Please acknowledge and agree to the Hospital Security & HIPAA PHI Agreement.");
      return;
    }

    setLoading(true);
    try {
      if (!email || !password) {
        setError("Enter clinical employee code, registered email, and access key.");
        return;
      }
      const session = await login({ email: email.trim(), password });
      setFailedAttempts(0);
      playTactileTone("success");

      if (session.requiresMfaSetup) {
        startMfaSetup(session);
        return;
      }

      if (session.requiresMfa) {
        if (!session.mfaToken) {
          throw new Error("Server MFA challenge token missing. Please authenticate again.");
        }
        setMfaChallenge(session.mfaToken);
        setMfaCode("");
        setError("");
        return;
      }

      if (privacyMode) setPassword("");
      setLoginSuccess(true);

      router.prefetch(returnUrl);
      await new Promise((r) => setTimeout(r, 200));
      revealWelcome(session.user);
    } catch (err) {
      setFailedAttempts((prev) => prev + 1);
      const msg = err instanceof Error ? err.message : "Unable to authenticate credentials.";
      setError(msg);
      if (msg.toLowerCase().includes("locked") || (err instanceof ApiError && err.status === 429)) {
        setLockoutTimer(300);
      }
      setLoginSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleMfaSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mfaChallenge) return;

    playTactileTone("click");
    setError("");
    setLoading(true);
    try {
      const session = await verifyMfaLogin(mfaChallenge, mfaCode.trim());
      setMfaChallenge(null);
      if (privacyMode) setPassword("");
      setLoginSuccess(true);
      playTactileTone("success");
      router.prefetch(returnUrl);
      await new Promise((r) => setTimeout(r, 200));
      revealWelcome(session.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to verify TOTP code.";
      setError(message);
      if (err instanceof ApiError && err.code === "MFA_CHALLENGE_EXPIRED") {
        setMfaChallenge(null);
      }
    } finally {
      setLoading(false);
    }
  }

  const isShortMode = useCallback((): boolean => {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem("lc_welcome_short") === "1";
  }, []);

  return (
    <>
      {/* ── Welcome Transition Overlay ── */}
      {showWelcome && welcomeUser && (
        <WelcomeTransition
          userName={welcomeUser.name}
          role={welcomeUser.role}
          lastLoginTime={welcomeUser.lastLogin}
          quickStat={undefined}
          shortMode={isShortMode()}
          onComplete={() => {
            setShowWelcome(false);
            const target =
              returnUrl && !returnUrl.startsWith("/login") && returnUrl !== "/" ? returnUrl : "/dashboard";
            window.location.href = target;
          }}
        />
      )}

      {/* ── Terms & Conditions / HIPAA Modal ── */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => setTermsAccepted(true)}
      />

      {/* ── 24/7 Helpline & Emergency Support Modal ── */}
      <EmergencySupportModal
        isOpen={showHelplineModal}
        onClose={() => setShowHelplineModal(false)}
      />

      {/* ── Forgot Password / Access Recovery Modal ── */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />

      <style>{`
        @keyframes scanBeam   { 0%{top:-2px;opacity:0} 5%{opacity:1} 95%{opacity:0.8} 100%{top:100%;opacity:0} }
        @keyframes slideUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn     { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmerText{ 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes blink      { 50%{opacity:0} }
        @keyframes pulseRing  { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.4);opacity:0} }

        .clinical-brand-text {
          background: linear-gradient(135deg, #0284c7 0%, #2563eb 45%, #4f46e5 80%, #0d9488 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmerText 8s linear infinite;
        }

        .clinical-white-card {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.95);
          box-shadow: 0 20px 50px -12px rgba(2, 132, 199, 0.1), 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .input-clinical-wrap {
          position: relative;
          border-radius: 12px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
        }
        .input-clinical-wrap:hover {
          border-color: #cbd5e1;
          background: #fafafa;
        }
        .input-clinical-wrap.focused {
          border-color: #0284c7;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.12), 0 2px 8px rgba(2, 132, 199, 0.06);
        }
        .input-clinical-wrap input {
          background: transparent;
          width: 100%;
          outline: none;
          color: #0f172a;
          font-size: 13.5px;
          font-weight: 500;
        }
        .input-clinical-wrap input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .btn-medical-primary {
          background: linear-gradient(135deg, #0284c7 0%, #2563eb 55%, #4f46e5 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-medical-primary:hover:not(:disabled) {
          box-shadow: 0 12px 30px rgba(2, 132, 199, 0.35);
          transform: translateY(-1.5px);
        }
        .btn-medical-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-emergency-stat {
          background: linear-gradient(135deg, #e11d48 0%, #dc2626 50%, #b91c1c 100%);
          box-shadow: 0 8px 24px rgba(225, 29, 72, 0.35);
        }
        .btn-emergency-stat:hover:not(:disabled) {
          box-shadow: 0 14px 34px rgba(225, 29, 72, 0.45);
          transform: translateY(-1.5px);
        }
      `}</style>

      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 relative overflow-hidden select-none font-sans">
        <MedicalLightBackground activeHub={activeHub} />

        {/* ════════════════════════════════════════════════════════
            TOP CLINICAL HEADER & HOSPITAL TELEMETRY
        ════════════════════════════════════════════════════════ */}
        <header className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
          {/* Logo & Clinical Brand */}
          <div className="flex items-center gap-3">
            <LabCoreLogo size="md" variant="full" theme="light" />
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 border border-sky-200 text-sky-800">
              <Sparkles className="h-3.5 w-3.5 text-sky-600" />
              <span>Enterprise v4.2.1 · Validated</span>
            </span>
          </div>

          {/* 4 Clinical Hub Selectors (Hospital / Pathology / Clinic / Radiology) */}
          <div className="hidden lg:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200">
            {(["hospital", "pathology", "clinic", "radiology"] as FacilityHub[]).map((hubKey) => {
              const conf = CLINICAL_HUBS[hubKey];
              const isAct = activeHubKey === hubKey;
              return (
                <button
                  key={hubKey}
                  type="button"
                  onClick={() => {
                    playTactileTone("click");
                    setActiveHubKey(hubKey);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isAct
                      ? "bg-white text-slate-900 border border-slate-200/90 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: conf.accentColor }}
                  />
                  <span>{conf.shortName}</span>
                </button>
              );
            })}
          </div>

          {/* Right Telemetry, Master Portal & 24/7 Helpline */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                playTactileTone("click");
                setShowMasterModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-800 border border-sky-200 bg-sky-50 hover:bg-sky-100 transition-all cursor-pointer shadow-2xs"
              title="Hospital Master Provisioning & License Portal"
            >
              <ShieldCheck className="h-4 w-4 text-sky-600" />
              <span className="hidden sm:inline">Master Registration</span>
              <span className="sm:hidden">Master</span>
            </button>

            <SystemStatusBar
              soundEnabled={soundEnabled}
              onToggleSound={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playTactileTone("success");
              }}
              onOpenHelpline={() => {
                playTactileTone("badge");
                setShowHelplineModal(true);
              }}
            />
          </div>
        </header>

        {/* ════════════════════════════════════════════════════════
            24/7 STAT EMERGENCY & ACCREDITATION BROADCAST BANNER
        ════════════════════════════════════════════════════════ */}
        {!bannerDismissed && (
          <div className="relative z-20 px-4 sm:px-8 py-2 bg-gradient-to-r from-sky-50 via-teal-50/50 to-blue-50/50 border-b border-sky-100 flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span className="font-bold text-rose-700 shrink-0 uppercase tracking-wider text-[11px]">
                24/7 STAT ACCESSION ACTIVE:
              </span>
              <span className="truncate text-slate-700 font-medium">
                Inpatient ICU, Trauma, Code Red & Emergency requisitions prioritized with &lt; 18 min TAT guarantee. Roche Cobas 8000 & Sysmex XN-9100 online.
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <button
                type="button"
                onClick={() => setShowHelplineModal(true)}
                className="text-xs font-bold text-sky-700 hover:text-sky-900 underline flex items-center gap-1 cursor-pointer"
              >
                <Phone className="h-3 w-3" />
                Emergency Directory
              </button>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                title="Dismiss announcement"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            MAIN TWO-COLUMN WORKSPACE
        ════════════════════════════════════════════════════════ */}
        <main className="flex-1 flex flex-col lg:flex-row relative z-10">
          {/* ────────────────────────────────────────────────────────
              LEFT COLUMN — Clinical Showcase, Live Vitals & Telemetry
          ──────────────────────────────────────────────────────── */}
          <div className="hidden lg:flex flex-col justify-between w-[52%] px-10 xl:px-14 pt-7 pb-6">
            <div>
              {/* Facility Category Pill */}
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-4 bg-sky-50 border border-sky-200"
                style={{
                  background: activeHub.lightBg,
                  borderColor: `${activeHub.accentColor}40`,
                }}
              >
                <Radio className="h-3.5 w-3.5 animate-pulse" style={{ color: activeHub.accentColor }} />
                <span className="text-xs font-bold tracking-wide uppercase" style={{ color: activeHub.accentColor }}>
                  {activeHub.category}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-emerald-800 text-xs font-bold bg-emerald-100/90 px-2.5 py-0.5 rounded-full">
                  {activeHub.badge}
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-[40px] xl:text-[46px] font-extrabold leading-[1.08] tracking-[-0.03em] text-slate-900">
                {activeHub.headlineTitle} <br />
                <span className="clinical-brand-text">{activeHub.headlineHighlight}</span> <br />
                <span className="text-slate-500 text-[22px] xl:text-[25px] font-normal tracking-tight">
                  built for{" "}
                  <TypingText texts={activeHub.typingTexts} className="text-sky-700 font-semibold" />
                </span>
              </h1>

              <p className="mt-3 text-slate-600 text-sm leading-relaxed max-w-[530px]">
                {activeHub.description}
              </p>

              {/* Key Clinical Performance Indicators */}
              <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-200">
                {activeHub.stats.map((stat) => (
                  <div key={stat.label} className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-left">
                    <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">{stat.value}</div>
                    <div className="text-[11px] text-slate-800 font-bold mt-0.5">
                      {stat.label}
                    </div>
                    <div className="text-[9.5px] text-slate-500 font-medium truncate mt-0.5">
                      {stat.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Cardiac Vitals & Automated Track Telemetry */}
            <div className="space-y-3 my-4">
              {/* Dual ECG & SpO2 Monitor */}
              <div className="max-w-[490px]">
                <DualVitalsMonitor />
              </div>

              {/* Robotic Specimen Track Conveyor Middleware */}
              <div className="max-w-[490px]">
                <RoboticTrackSimulation />
              </div>

              {/* Specimen Blood Vacuum Tube Rack */}
              <div className="max-w-[490px] p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs uppercase tracking-wider text-slate-800 font-bold flex items-center gap-2">
                    <Crosshair className="h-4 w-4 text-sky-600" />
                    Specimen Vacuum Tube Accession Rack
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    5,170 TUBES IN FLIGHT
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {SPECIMEN_TUBES.map((tube) => (
                    <div
                      key={tube.name}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center transition-all hover:bg-slate-100 hover:border-slate-300"
                    >
                      <div
                        className="h-2.5 w-full rounded-full mb-1.5"
                        style={{ background: tube.capColor, boxShadow: `0 0 6px ${tube.capGlow}` }}
                      />
                      <span className="text-[11px] font-bold text-slate-900 block truncate">{tube.name}</span>
                      <span className="text-[10px] text-slate-600 font-semibold block truncate mt-0.5">{tube.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Accreditation Compliance Badges */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {[
                { label: "NABL (ISO 15189:2022)", icon: ShieldCheck },
                { label: "NABH Hospital Grade", icon: BadgeCheck },
                { label: "CAP Accredited LAP", icon: Shield },
                { label: "HL7 FHIR v4.0.1", icon: Zap },
                { label: "HIPAA & ABDM Compliant", icon: Lock },
              ].map((t) => (
                <span
                  key={t.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                >
                  <t.icon className="h-3.5 w-3.5 text-sky-600" />
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          {/* Clean Vertical Divider */}
          <div className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-slate-200 to-transparent" />

          {/* ────────────────────────────────────────────────────────
              RIGHT COLUMN — Clinical Staff Sign In Terminal
          ──────────────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-6 relative">
            <div
              ref={cardRef}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              className="w-full max-w-[495px] transition-transform duration-200 ease-out"
              style={{
                transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              }}
            >
              {/* Mobile Facility Selector */}
              <div className="lg:hidden flex items-center justify-center gap-1.5 mb-3 p-1 rounded-xl bg-white border border-slate-200 shadow-2xs">
                {(["hospital", "pathology", "clinic", "radiology"] as FacilityHub[]).map((hubKey) => {
                  const conf = CLINICAL_HUBS[hubKey];
                  const isAct = activeHubKey === hubKey;
                  return (
                    <button
                      key={hubKey}
                      type="button"
                      onClick={() => {
                        playTactileTone("click");
                        setActiveHubKey(hubKey);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isAct ? "bg-sky-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {conf.shortName.split(" ")[0]}
                    </button>
                  );
                })}
              </div>

              {/* Clinical Sign In Card Container */}
              <div className="clinical-white-card rounded-3xl p-6 sm:p-7 relative border border-slate-200/90 shadow-xl">
                {/* Top Subtle Sky Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400 via-blue-600 to-teal-400 rounded-t-3xl" />

                {/* Card Header */}
                <div className="flex items-center gap-3.5 mb-4 pt-1">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-sky-50 border border-sky-200 text-sky-600 shadow-xs shrink-0">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      {loginSuccess ? "Identity Verified" : "Clinical Staff Sign In"}
                    </h2>
                    <p className="text-slate-500 text-xs font-semibold">
                      {loginSuccess ? "Routing to clinical workspace…" : "24/7 Hospital, Diagnostic Lab & Polyclinic Access"}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-800 text-[11px] font-bold">256-BIT TLS</span>
                  </div>
                </div>

                {/* Success Overlay */}
                {loginSuccess && (
                  <div className="py-10 text-center" style={{ animation: "slideUp 0.4s ease both" }}>
                    <div className="h-16 w-16 rounded-3xl mx-auto mb-4 flex items-center justify-center bg-emerald-50 border border-emerald-200 shadow-md relative">
                      <div
                        className="absolute inset-0 rounded-3xl"
                        style={{
                          border: "2px solid rgba(16,185,129,0.3)",
                          animation: "pulseRing 1.5s ease-out infinite",
                        }}
                      />
                      <ShieldCheck className="h-8 w-8 text-emerald-600" />
                    </div>
                    <p className="text-slate-900 font-extrabold text-lg">Access Granted</p>
                    <p className="text-slate-500 text-xs mt-1.5 flex items-center justify-center gap-2 font-medium">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600" />
                      Loading patient roster & workstation…
                    </p>
                  </div>
                )}

                {!loginSuccess && (
                  <>
                    {/* Smart RFID Card Tap / Proximity Scanner Simulation */}
                    <div className="mb-3.5">
                      <button
                        type="button"
                        onClick={handleSimulateRfidTap}
                        disabled={rfidScanning}
                        className="w-full p-3 rounded-2xl border-2 border-dashed transition-all flex items-center justify-between cursor-pointer group bg-slate-50/70 border-slate-300 hover:bg-sky-50/80 hover:border-sky-400 shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                            {rfidScanning ? (
                              <Loader2 className="h-4 w-4 animate-spin text-sky-700" />
                            ) : (
                              <Scan className="h-4 w-4" />
                            )}
                          </div>
                          <div className="text-left">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              Tap Hospital RFID Smart Badge
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-mono font-bold">
                                NFC / HID
                              </span>
                            </span>
                            <span className="text-[11px] text-slate-500 block font-medium">
                              {rfidScanning ? "Reading RFID proximity token…" : "Simulate instant proximity doctor sign-in"}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                      </button>
                    </div>

                    {/* 6-Tier Hospital Staff Directory Roster */}
                    <div className="mb-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs uppercase tracking-wide text-slate-600 font-bold flex items-center gap-1.5">
                          <Sliders className="h-3.5 w-3.5 text-sky-600" />
                          Authorized Staff Roster & Clearance
                        </span>
                        {selectedStaff && (
                          <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 font-mono">
                            <Check className="h-3 w-3" />
                            {selectedStaff.code}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {STAFF_ROSTER.map((staff) => {
                          const IconComp = staff.icon;
                          const isSel = selectedStaff?.code === staff.code;
                          const shortName = staff.name.startsWith("Dr.")
                            ? `${staff.name.split(" ")[0]} ${staff.name.split(" ")[1]}`
                            : staff.name.split(" ")[0];
                          return (
                            <button
                              key={staff.code}
                              type="button"
                              onClick={() => handleSelectStaff(staff)}
                              className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                                isSel
                                  ? "bg-sky-50 border-sky-400 text-slate-900 shadow-sm ring-1 ring-sky-300"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <IconComp className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                                <span className="text-xs font-bold text-slate-900 truncate">{shortName}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-semibold block truncate">{staff.roleCategory}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Verified Staff Credential Banner */}
                      {selectedStaff && (
                        <div className="mt-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5" style={{ animation: "slideUp 0.3s ease both" }}>
                          <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                            <BadgeCheck className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-900 truncate">
                                {selectedStaff.name} ({selectedStaff.degrees})
                              </span>
                              <span className="text-[9.5px] px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold shrink-0 font-mono">
                                {selectedStaff.clearance}
                              </span>
                            </div>
                            <span className="text-[10.5px] text-slate-600 block truncate font-medium mt-0.5">
                              {selectedStaff.designation} · {selectedStaff.department}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* STAT Emergency Mode Toggle (ICU / Code Blue) */}
                    <div className={`mb-3.5 p-3 rounded-2xl border transition-all flex items-center justify-between ${
                      statPriority ? "bg-rose-50 border-rose-300 shadow-sm" : "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <Flame className={`h-4 w-4 ${statPriority ? "text-rose-600 animate-bounce" : "text-slate-400"}`} />
                        <div>
                          <span className={`text-xs font-bold block ${statPriority ? "text-rose-900" : "text-slate-800"}`}>
                            Emergency STAT Fast-Track
                          </span>
                          <span className="text-[10.5px] text-slate-500 font-medium">
                            Priority queue for ICU, Trauma & Code Blue
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playTactileTone("stat");
                          setStatPriority(!statPriority);
                        }}
                        className={`h-5 w-9 rounded-full transition-colors relative cursor-pointer ${
                          statPriority ? "bg-rose-600" : "bg-slate-300"
                        }`}
                      >
                        <div
                          className={`h-3.5 w-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                            statPriority ? "translate-x-4.5" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Failed attempt warning */}
                    {failedAttempts > 0 && (
                      <div className="mb-3.5 p-3 rounded-2xl bg-amber-50 border border-amber-200">
                        <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-1.5">
                          <span>Security Check: {failedAttempts} / 5 Attempts</span>
                          <span>{5 - failedAttempts > 0 ? `${5 - failedAttempts} tries left` : "ACCOUNT LOCKED"}</span>
                        </div>
                        <div className="flex gap-1 h-1.5 w-full bg-amber-200/60 rounded-full overflow-hidden">
                          {[1, 2, 3, 4, 5].map((seg) => (
                            <div
                              key={seg}
                              className="flex-1 rounded-full transition-all duration-300"
                              style={{
                                background:
                                  seg <= failedAttempts
                                    ? failedAttempts >= 4
                                      ? "#dc2626"
                                      : "#d97706"
                                    : "transparent",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error Box */}
                    {error && (
                      <div
                        className="mb-3.5 p-3 rounded-2xl flex items-start gap-2.5 text-xs bg-rose-50 border border-rose-200"
                        style={{ animation: "fadeIn 0.3s ease both" }}
                      >
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                        <p className="text-rose-800 leading-relaxed font-semibold">{error}</p>
                      </div>
                    )}

                    {/* Caps Lock Alert */}
                    {capsLockOn && (
                      <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-800 font-bold">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span>Caps Lock is ON — Passwords are case-sensitive</span>
                      </div>
                    )}

                    {/* Authentication Form */}
                    <form onSubmit={mfaChallenge ? handleMfaSubmit : handleSubmit} className="space-y-3.5">
                      {mfaChallenge ? (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-sky-600" />
                            Authenticator Code (TOTP / YubiKey)
                          </label>
                          <div className={`input-clinical-wrap ${passwordFocused ? "focused" : ""}`}>
                            <div className="flex items-center px-4 py-3">
                              <Lock className="h-4 w-4 mr-2.5 shrink-0 text-slate-400" />
                              <input
                                id="login-mfa-code"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={8}
                                value={mfaCode}
                                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                                placeholder="123456"
                                required
                                autoFocus
                                autoComplete="one-time-code"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setMfaChallenge(null);
                              setMfaCode("");
                              setError("");
                            }}
                            className="text-xs text-sky-700 hover:text-sky-900 transition-colors cursor-pointer block pt-1 font-bold"
                          >
                            ← Switch clinical user account
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Clinical ID / Work Email Input */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase flex items-center gap-1.5">
                              <Stethoscope className="h-4 w-4 text-sky-600" />
                              Clinical ID / Employee Code / Work Email
                            </label>
                            <div className={`input-clinical-wrap ${emailFocused ? "focused" : ""}`}>
                              <div className="flex items-center px-3.5 py-3">
                                <Mail
                                  className="h-4 w-4 mr-2.5 shrink-0 transition-colors"
                                  style={{ color: emailFocused ? "#0284c7" : "#94a3b8" }}
                                />
                                <input
                                  id="login-email"
                                  type="text"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  onFocus={() => setEmailFocused(true)}
                                  onBlur={() => setEmailFocused(false)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      passwordRef.current?.focus();
                                    }
                                  }}
                                  placeholder="dr.sharma@hospital.org or ADMIN001"
                                  required
                                  autoComplete="username"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Access Key / Password Input */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase flex items-center gap-1.5">
                                <KeyRound className="h-4 w-4 text-sky-600" />
                                Secure Access Key / Password
                              </label>
                              <button
                                type="button"
                                onClick={() => setShowForgotModal(true)}
                                className="text-xs text-sky-700 hover:text-sky-900 transition-colors font-bold cursor-pointer"
                              >
                                Forgot key?
                              </button>
                            </div>
                            <div className={`input-clinical-wrap ${passwordFocused ? "focused" : ""}`}>
                              <div className="flex items-center px-3.5 py-3">
                                <Lock
                                  className="h-4 w-4 mr-2.5 shrink-0 transition-colors"
                                  style={{ color: passwordFocused ? "#0284c7" : "#94a3b8" }}
                                />
                                <input
                                  id="login-password"
                                  ref={passwordRef}
                                  type={showPassword ? "text" : "password"}
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  onKeyDown={handleKeyDownPassword}
                                  onKeyUp={handleKeyDownPassword}
                                  onFocus={() => setPasswordFocused(true)}
                                  onBlur={() => {
                                    setPasswordFocused(false);
                                    setCapsLockOn(false);
                                  }}
                                  placeholder="••••••••••••"
                                  required
                                  autoComplete="current-password"
                                />
                                <button
                                  type="button"
                                  id="toggle-password-visibility"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="ml-2 shrink-0 text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Workstation Security Controls */}
                          <div className="flex items-center justify-between py-1">
                            <button
                              type="button"
                              onClick={() => {
                                playTactileTone("click");
                                const n = !rememberMe;
                                setRememberMeState(n);
                                setRememberMe(n);
                              }}
                              className="flex items-center gap-2 group cursor-pointer"
                            >
                              <div
                                className="h-4 w-4 rounded-md flex items-center justify-center transition-all"
                                style={{
                                  background: rememberMe ? "#0284c7" : "#ffffff",
                                  border: rememberMe ? "1.5px solid #0284c7" : "1.5px solid #cbd5e1",
                                }}
                              >
                                {rememberMe && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <span className="text-xs text-slate-700 group-hover:text-slate-900 transition-colors select-none font-semibold">
                                Remember station
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                playTactileTone("click");
                                const n = !privacyMode;
                                setPrivacyModeState(n);
                                setPrivacyMode(n);
                              }}
                              className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
                            >
                              <div
                                className="h-2.5 w-2.5 rounded-full transition-all"
                                style={{
                                  background: privacyMode ? "#10b981" : "#cbd5e1",
                                  boxShadow: privacyMode ? "0 0 6px rgba(16,185,129,0.5)" : "none",
                                }}
                              />
                              <span>HIPAA privacy screen</span>
                            </button>
                          </div>

                          {/* Terms & Conditions / HIPAA Consent Checkbox */}
                          <div className="pt-0.5 pb-1">
                            <label className="flex items-start gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                              />
                              <span className="text-xs text-slate-600 leading-snug font-medium">
                                I agree to the Hospital Security Policy,{" "}
                                <button
                                  type="button"
                                  onClick={() => setShowTermsModal(true)}
                                  className="text-sky-700 hover:text-sky-900 font-bold underline cursor-pointer"
                                >
                                  Terms of Service
                                </button>
                                , and HIPAA PHI Confidentiality.
                              </span>
                            </label>
                          </div>
                        </>
                      )}

                      {/* Submit Action Button */}
                      <div className="relative pt-1">
                        <button
                          id="login-submit-btn"
                          type="submit"
                          disabled={loading || Boolean(mfaChallenge && mfaCode.length < 6)}
                          className={`w-full py-3.5 rounded-2xl text-sm font-extrabold text-white flex items-center justify-center gap-2.5 relative z-10 shadow-lg cursor-pointer transition-all ${
                            statPriority ? "btn-emergency-stat" : "btn-medical-primary"
                          }`}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                              <span>{mfaChallenge ? "Verifying Token…" : "Authenticating Clinical Credentials…"}</span>
                            </>
                          ) : (
                            <>
                              <Fingerprint className="h-4 w-4 text-white" />
                              <span className="tracking-wide text-white font-bold">
                                {mfaChallenge
                                  ? "Verify TOTP & Enter Station"
                                  : statPriority
                                  ? "STAT Emergency Break-Glass Entry"
                                  : "Sign In Securely"}
                              </span>
                              <ChevronRight className="h-4 w-4 text-white/90 ml-auto" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>

                    {/* Footer Certifications */}
                    <div className="mt-4 pt-3 flex items-center justify-center gap-2 flex-wrap border-t border-slate-100">
                      {[
                        { icon: ShieldCheck, text: "256-Bit TLS" },
                        { icon: Lock, text: "JWT Auth" },
                        { icon: Fingerprint, text: "TOTP MFA" },
                        { icon: Cpu, text: "NABL Ready" },
                      ].map(({ icon: Icon, text }) => (
                        <div
                          key={text}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold"
                        >
                          <Icon className="h-3.5 w-3.5 text-sky-600" />
                          <span className="text-xs font-mono font-bold">{text}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Master Lab & Role Provisioning Portal Trigger */}
              <div className="mt-3.5 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    playTactileTone("click");
                    setShowMasterModal(true);
                  }}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-sky-800 hover:text-sky-950 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-all cursor-pointer shadow-2xs"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
                  <span>Master Lab & Role Setup Portal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowHelplineModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                >
                  <Phone className="h-3.5 w-3.5 text-rose-600" />
                  <span>24/7 Support</span>
                </button>
              </div>

              <p className="text-center text-slate-400 text-xs mt-2.5 tracking-wider uppercase font-semibold">
                © {new Date().getFullYear()} LabCore ELIS™ · SECURED HOSPITAL SESSION
              </p>
            </div>
          </div>
        </main>

        {/* ════════════════════════════════════════════════════════
            BOTTOM CLINICAL ANALYZERS TELEMETRY RIBBON
        ════════════════════════════════════════════════════════ */}
        <footer className="relative z-20 py-2.5 px-6 overflow-hidden bg-white/95 border-t border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            <span className="text-xs uppercase text-sky-800 font-bold shrink-0 flex items-center gap-1.5 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              ANALYZER FEED (24/7 LIVE):
            </span>
            <div className="flex items-center gap-3 shrink-0">
              {CLINICAL_ANALYZERS.map((a) => (
                <div
                  key={a.name}
                  className="flex items-center gap-2 text-xs px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 font-medium"
                >
                  <span className="text-slate-900 font-bold">{a.name}</span>
                  <span className="text-slate-500 hidden sm:inline font-medium">({a.dept})</span>
                  <span className="text-emerald-700 font-bold">● {a.status}</span>
                  <span className="text-slate-500 text-[10.5px] font-mono">{a.speed}</span>
                </div>
              ))}
            </div>
          </div>
        </footer>
      </div>

      {/* Software Owner Master Lab & Role Provisioning Portal */}
      <MasterRegistrationModal
        isOpen={showMasterModal}
        onClose={() => setShowMasterModal(false)}
        onAutoFillLogin={(e, p) => {
          setEmail(e);
          setPassword(p);
        }}
        onDirectLogin={(u) => {
          setLoginSuccess(true);
          setError("");
          playTactileTone("success");
          const TODAY_KEY = "lc_last_welcome_date";
          const todayStr = new Date().toDateString();
          const isRepeat = sessionStorage.getItem(TODAY_KEY) === todayStr;
          sessionStorage.setItem(TODAY_KEY, todayStr);
          if (isRepeat) sessionStorage.setItem("lc_welcome_short", "1");
          else sessionStorage.removeItem("lc_welcome_short");
          router.prefetch(returnUrl);
          setWelcomeUser({
            name: u.name,
            role: getRoleLabel(u.role, "Staff"),
            lastLogin: u.lastLogin,
          });
          setShowWelcome(true);
        }}
      />
    </>
  );
}
