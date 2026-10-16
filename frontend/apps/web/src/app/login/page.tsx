"use client";
// ──────────────────────────────────────────────────────────────────────────
// LabCore ELIS™ Enterprise OS — God-Tier Clinical Hospital & Laboratory OS
// Features: 4-Hub Facility Navigator, Dual Cardiac ECG & SpO2 Pleth Waves,
// Automated Robotic Track Conveyor Simulation, Specimen Tube Rack Visualizer,
// Smart RFID Smart Badge Proximity Reader, Optical Biometric Laser Scanner,
// 6-Tier Hospital Staff Roster, Emergency STAT Code Red Override,
// Synthesized Web Audio Haptics, 3D Spatial Perspective Parallax.
// ──────────────────────────────────────────────────────────────────────────

import { FormEvent, useState, useEffect, useRef, useCallback, useMemo } from "react";
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

import { startBiometricAuthentication } from "@/lib/webauthn";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  FlaskConical,
  Activity,
  ChevronRight,
  AlertCircle,
  Cpu,
  Zap,
  Wifi,
  CheckCircle2,
  Shield,
  Sparkles,
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
  QrCode,
  HeartPulse,
  Crosshair,
  Layers,
  Globe,
  FileCheck,
  RefreshCw,
  Terminal,
  Clock,
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
  themeGlow: string;
  typingTexts: string[];
  description: string;
  stats: { value: string; label: string }[];
  metrics: {
    icon: any;
    label: string;
    value: string;
    subtext: string;
    color: string;
    gradient: string;
  }[];
}

const CLINICAL_HUBS: Record<FacilityHub, HubConfig> = {
  hospital: {
    id: "hospital",
    name: "Super-Specialty Hospital Network",
    shortName: "Hospital Center",
    category: "Tertiary Inpatient, ICU & Emergency STAT LIS",
    badge: "NABH 5th Edition Accredited",
    headlineTitle: "Precision Hospital",
    headlineHighlight: "Clinical Diagnostic OS",
    accentColor: "#38bdf8",
    themeGlow: "rgba(14,165,233,0.18)",
    typingTexts: [
      "Inpatient Emergency STAT Accession.",
      "ICU Panic Value Critical Alerts.",
      "Bedside Barcode Phlebotomy & Ward Verification.",
      "Multi-Specialty Doctor CPOE Interfacing.",
    ],
    description:
      "Enterprise healthcare diagnostic operating system unifying hospital CPOE, inpatient wards, intensive care units, and clinical laboratory automation.",
    stats: [
      { value: "4.8M+", label: "Inpatient Tests/Yr" },
      { value: "99.98%", label: "Diagnostic Precision" },
      { value: "< 22 min", label: "STAT Emergency TAT" },
    ],
    metrics: [
      {
        icon: Stethoscope,
        label: "Inpatient Requisitions & STAT Orders",
        value: "92%",
        subtext: "1,842 orders today · 0 critical bottlenecks",
        color: "bg-sky-500/15 text-sky-300",
        gradient: "#0ea5e9",
      },
      {
        icon: Activity,
        label: "STAT Panic Alert Notification Speed",
        value: "100%",
        subtext: "Direct physician broadcast (< 2.5 min)",
        color: "bg-rose-500/15 text-rose-300",
        gradient: "#f43f5e",
      },
      {
        icon: FlaskConical,
        label: "Central Analyzer Track Interfacing",
        value: "98%",
        subtext: "Roche Cobas 8000 & Sysmex XN-9100 active",
        color: "bg-indigo-500/15 text-indigo-300",
        gradient: "#6366f1",
      },
      {
        icon: ShieldCheck,
        label: "NABH & Hospital Quality Compliance",
        value: "100%",
        subtext: "NABH 5th Edition & NABL ISO 15189 Verified",
        color: "bg-emerald-500/15 text-emerald-300",
        gradient: "#10b981",
      },
    ],
  },
  pathology: {
    id: "pathology",
    name: "Robotic Pathology & Genomics Hub",
    shortName: "Pathology Core",
    category: "High-Throughput Reference Laboratory & Molecular LIS",
    badge: "NABL (ISO 15189:2022) Certified",
    headlineTitle: "Precision Laboratory",
    headlineHighlight: "Robotic Intelligence OS",
    accentColor: "#818cf8",
    themeGlow: "rgba(99,102,241,0.18)",
    typingTexts: [
      "Robotic Track Bi-directional Analyzer Interfacing.",
      "Real-time Delta Checks & Westgard Multi-Rule QC.",
      "Next-Gen Sequencing & Molecular Genomics.",
      "Automated Decapping, Centrifuging & Sorting.",
    ],
    description:
      "High-throughput reference laboratory system with robotic track specimen management, automated delta checks, and electronic clinical validation.",
    stats: [
      { value: "14.6M+", label: "Analyzed Specimens/Yr" },
      { value: "99.99%", label: "Analytical Concordance" },
      { value: "< 16 min", label: "Automated LIS TAT" },
    ],
    metrics: [
      {
        icon: Microscope,
        label: "Barcode Specimens Accessioned Today",
        value: "89%",
        subtext: "5,480 tubes accessioned · 99.9% 2D scan rate",
        color: "bg-indigo-500/15 text-indigo-300",
        gradient: "#6366f1",
      },
      {
        icon: Activity,
        label: "Delta-Check & Real-Time Westgard QC",
        value: "99%",
        subtext: "Zero unreviewed analytical variance outliers",
        color: "bg-violet-500/15 text-violet-300",
        gradient: "#8b5cf6",
      },
      {
        icon: FlaskConical,
        label: "Analyzer Middleware Throughput",
        value: "96%",
        subtext: "Beckman Coulter AU5800 & Abbott Alinity",
        color: "bg-teal-500/15 text-teal-300",
        gradient: "#14b8a6",
      },
      {
        icon: ShieldCheck,
        label: "NABL & CAP Laboratory Accreditation",
        value: "99%",
        subtext: "CAP LAP #729108 & ISO 15189:2022 Audited",
        color: "bg-emerald-500/15 text-emerald-300",
        gradient: "#10b981",
      },
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
    accentColor: "#34d399",
    themeGlow: "rgba(16,185,129,0.18)",
    typingTexts: [
      "OPD Walk-in Registration & Digital Queue.",
      "Instant WhatsApp & SMS Verified Report Delivery.",
      "Home Phlebotomy Dispatch & GPS Sample Tracking.",
      "Ayushman Bharat Digital Health (ABHA M3).",
    ],
    description:
      "Modern polyclinic operating system connecting consulting doctors, sample collection centers, electronic prescriptions, and automated patient reports.",
    stats: [
      { value: "920k+", label: "Outpatient Visits/Yr" },
      { value: "99.6%", label: "Patient Satisfaction" },
      { value: "< 3.5 min", label: "Avg Registration Queue" },
    ],
    metrics: [
      {
        icon: Building2,
        label: "OPD Accessions & Walk-ins Today",
        value: "82%",
        subtext: "980 patients registered across 46 clinics",
        color: "bg-emerald-500/15 text-emerald-300",
        gradient: "#10b981",
      },
      {
        icon: Syringe,
        label: "Home Phlebotomy & Field Visits",
        value: "95%",
        subtext: "72 collections completed on-schedule",
        color: "bg-cyan-500/15 text-cyan-300",
        gradient: "#06b6d4",
      },
      {
        icon: Activity,
        label: "Automated Report Dispatch Speed",
        value: "99%",
        subtext: "WhatsApp, Email & Patient Portal instant sync",
        color: "bg-sky-500/15 text-sky-300",
        gradient: "#0284c7",
      },
      {
        icon: ShieldCheck,
        label: "Digital Health Compliance (ABDM M3)",
        value: "100%",
        subtext: "Encrypted PHR records & HL7 FHIR v4",
        color: "bg-teal-500/15 text-teal-300",
        gradient: "#14b8a6",
      },
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
    accentColor: "#f59e0b",
    themeGlow: "rgba(245,158,11,0.18)",
    typingTexts: [
      "PACS DICOM Multi-Modality Gateway (CT/MRI/USG).",
      "AI-Powered Preliminary Lesion & Nodule Screen.",
      "Tele-Radiology Consultant Reporting Console.",
      "Zero-Footprint Web DICOM Viewer Integration.",
    ],
    description:
      "Enterprise medical imaging information system interfaced with hospital PACS, cross-sectional CT/MRI scanners, and rapid tele-radiology review.",
    stats: [
      { value: "650k+", label: "Scans Interpreted/Yr" },
      { value: "99.8%", label: "Radiological Concordance" },
      { value: "< 35 min", label: "Emergency CT Read TAT" },
    ],
    metrics: [
      {
        icon: Scan,
        label: "Active DICOM Studies Ingested Today",
        value: "86%",
        subtext: "420 CT, MRI, Digital X-Ray & Ultrasound scans",
        color: "bg-amber-500/15 text-amber-300",
        gradient: "#f59e0b",
      },
      {
        icon: Activity,
        label: "Critical Stroke & Trauma STAT Alerts",
        value: "100%",
        subtext: "Immediate on-call radiologist paging (< 2 min)",
        color: "bg-rose-500/15 text-rose-300",
        gradient: "#f43f5e",
      },
      {
        icon: Zap,
        label: "High-Speed PACS Streaming Throughput",
        value: "97%",
        subtext: "Lossless compression · 10Gbps local fiber",
        color: "bg-orange-500/15 text-orange-300",
        gradient: "#ea580c",
      },
      {
        icon: ShieldCheck,
        label: "AERB & Radiation Safety Audit",
        value: "100%",
        subtext: "Dosimetry records & DICOM audit trails active",
        color: "bg-emerald-500/15 text-emerald-300",
        gradient: "#10b981",
      },
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
    color: "border-indigo-500/50 text-indigo-300 bg-indigo-500/10",
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
    color: "border-sky-500/50 text-sky-300 bg-sky-500/10",
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
    color: "border-purple-500/50 text-purple-300 bg-purple-500/10",
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
    color: "border-teal-500/50 text-teal-300 bg-teal-500/10",
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
    color: "border-emerald-500/50 text-emerald-300 bg-emerald-500/10",
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
    color: "border-rose-500/50 text-rose-300 bg-rose-500/10",
  },
];

/* ────────────────────────────────────────────────────────────────
   SPECIMEN BLOOD TUBE RACK ACCESSION (Pathology Visualizer)
───────────────────────────────────────────────────────────────── */
const SPECIMEN_TUBES = [
  {
    name: "EDTA K2",
    dept: "Hematology & CBC",
    capColor: "#a855f7", // Lavender
    capGlow: "rgba(168,85,247,0.5)",
    count: "1,420 Tubes",
    fillPercent: 88,
  },
  {
    name: "SST Gel",
    dept: "Biochemistry & Serology",
    capColor: "#eab308", // Gold
    capGlow: "rgba(234,179,8,0.5)",
    count: "2,840 Tubes",
    fillPercent: 94,
  },
  {
    name: "Citrate 3.2%",
    dept: "Coagulation & PT-INR",
    capColor: "#38bdf8", // Light Blue
    capGlow: "rgba(56,189,248,0.5)",
    count: "410 Tubes",
    fillPercent: 72,
  },
  {
    name: "Plain Serum",
    dept: "Blood Bank Crossmatch",
    capColor: "#ef4444", // Red
    capGlow: "rgba(239,68,68,0.5)",
    count: "320 Tubes",
    fillPercent: 65,
  },
  {
    name: "Heparin",
    dept: "STAT Blood Gas / ABG",
    capColor: "#22c55e", // Green
    capGlow: "rgba(34,197,94,0.5)",
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
   ROBOTIC SPECIMEN TRACK CONVEYOR SIMULATION
───────────────────────────────────────────────────────────────── */
function RoboticTrackSimulation() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  const steps = [
    { title: "Barcoded 2D Tube Accession", code: "POSITION 01", tag: "LASER VERIFIED" },
    { title: "Robotic Centrifugation & Decap", code: "MODULE 02", tag: "3,500 RPM" },
    { title: "Aliquot & Cobas 8000 Dispatch", code: "TRACK 03", tag: "ROCHE INTERFACED" },
    { title: "Analyzer Run & Delta Check", code: "STATUS 04", tag: "99.9% VALIDATED" },
  ];

  return (
    <div className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.06] backdrop-blur-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold flex items-center gap-1.5">
          <Layers className="h-3 w-3 text-sky-400" />
          Automated Robotic Specimen Track Middleware
        </span>
        <span className="text-[9.5px] font-mono text-emerald-400 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          CONVEYOR IN-FLIGHT
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {steps.map((st, i) => {
          const isCurrent = activeStep === i;
          return (
            <div
              key={st.code}
              className={`p-2 rounded-lg text-left border transition-all duration-500 ${
                isCurrent
                  ? "bg-sky-500/20 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.25)]"
                  : "bg-white/[0.02] border-white/[0.05] opacity-50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono font-bold text-white/50">{st.code}</span>
                <span
                  className={`text-[8px] font-mono px-1 py-0.2 rounded font-bold ${
                    isCurrent ? "bg-sky-400/20 text-sky-300" : "text-white/30"
                  }`}
                >
                  {st.tag}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-white block leading-tight truncate">
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
   DUAL CARDIAC MONITOR CANVAS (ECG Lead-II & SpO2 Pleth Waveforms)
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
    const W = 380;
    const H = 76;

    const ecgPattern = [
      0, 0, 0, 0.05, -0.05, 0, 0.08, -0.28, 0.92, -0.42, 0.05, 0.18, 0.05, 0, 0, 0,
      0, 0, 0.04, -0.04, 0, 0.06, -0.24, 0.86, -0.38, 0.04, 0.16, 0.04, 0, 0, 0, 0,
    ];

    const plethPattern = [
      0.1, 0.25, 0.5, 0.85, 0.72, 0.6, 0.65, 0.5, 0.35, 0.22, 0.15, 0.1, 0.1, 0.1, 0.1, 0.1,
    ];

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      // Faint medical grid
      ctx!.strokeStyle = "rgba(255,255,255,0.03)";
      ctx!.lineWidth = 0.5;
      for (let x = 0; x < W; x += 16) {
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, H);
        ctx!.stroke();
      }
      for (let y = 0; y < H; y += 16) {
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(W, y);
        ctx!.stroke();
      }

      // ─── 1. ECG Trace (Green/Cyan) ───
      ctx!.beginPath();
      ctx!.strokeStyle = "#34d399";
      ctx!.lineWidth = 1.6;
      ctx!.shadowColor = "#34d399";
      ctx!.shadowBlur = 6;
      const ecgMid = 22;
      const step = 6;
      const totalPoints = Math.ceil(W / step) + 1;

      for (let i = 0; i < totalPoints; i++) {
        const x = i * step;
        const patIndex = Math.floor((i + offset) % ecgPattern.length);
        const yVal = ecgPattern[patIndex] || 0;
        const y = ecgMid - yVal * 16;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.stroke();

      // Lead tracer dot
      const tracerIndex = Math.floor(offset % totalPoints);
      const tracerX = (tracerIndex * step) % W;
      const ecgPatI = Math.floor((tracerIndex + offset) % ecgPattern.length);
      const tracerY = ecgMid - (ecgPattern[ecgPatI] || 0) * 16;

      ctx!.beginPath();
      ctx!.arc(tracerX, tracerY, 3, 0, Math.PI * 2);
      ctx!.fillStyle = "#ffffff";
      ctx!.shadowColor = "#34d399";
      ctx!.shadowBlur = 8;
      ctx!.fill();

      // ─── 2. SpO2 Pleth Trace (Sky Blue) ───
      ctx!.beginPath();
      ctx!.strokeStyle = "#38bdf8";
      ctx!.lineWidth = 1.4;
      ctx!.shadowColor = "#38bdf8";
      ctx!.shadowBlur = 5;
      const plethMid = 56;

      for (let i = 0; i < totalPoints; i++) {
        const x = i * step;
        const patIndex = Math.floor((i + offset * 0.7) % plethPattern.length);
        const yVal = plethPattern[patIndex] || 0;
        const y = plethMid - yVal * 14;
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
    <div className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.06] backdrop-blur-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 font-bold">
            <HeartPulse className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>ECG LEAD-II: 72 BPM</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-sky-400 font-bold">
            <Activity className="h-3.5 w-3.5 text-sky-400" />
            <span>SpO2: 99% PLETH</span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-white/40">
          <span>RESP 16 | BP 120/80</span>
        </div>
      </div>
      <canvas ref={canvasRef} width={380} height={76} className="w-full opacity-90 rounded-lg" />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   SCIENTIFIC SCI-FI BACKGROUND
───────────────────────────────────────────────────────────────── */
function SciFiBackground({ activeHub }: { activeHub: HubConfig }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 20% 35%, ${activeHub.themeGlow} 0%, transparent 60%), radial-gradient(ellipse 65% 75% at 85% 65%, rgba(99,102,241,0.08) 0%, transparent 60%), #030407`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          width: "100%",
          height: 2,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.5) 25%, rgba(99,102,241,0.8) 50%, rgba(52,211,153,0.5) 75%, transparent 100%)",
          animation: "scanBeam 7s linear infinite",
          filter: "blur(2px)",
        }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   SYSTEM STATUS BAR
───────────────────────────────────────────────────────────────── */
function SystemStatusBar({
  soundEnabled,
  onToggleSound,
}: {
  soundEnabled: boolean;
  onToggleSound: () => void;
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

  const cpu = Math.floor(15 + Math.sin(tick * 0.35) * 5);
  const latency = Math.floor(10 + Math.cos(tick * 0.5) * 4);

  return (
    <div className="flex items-center gap-4 text-[10px] font-mono">
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-emerald-400 font-bold tracking-wider">HOSPITAL LIS ACTIVE</span>
      </div>

      <div className="hidden sm:flex items-center gap-1 text-sky-400/80">
        <Cpu className="h-3 w-3" />
        <span>CORE {cpu}%</span>
      </div>

      <div className="hidden md:flex items-center gap-1 text-indigo-400/80">
        <Wifi className="h-3 w-3" />
        <span>{latency}ms</span>
      </div>

      <div className="hidden sm:block text-white/40">{time}</div>

      <button
        type="button"
        onClick={onToggleSound}
        className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
        title={soundEnabled ? "Mute audio haptics" : "Enable tactile medical audio feedback"}
      >
        {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-sky-400" /> : <VolumeX className="h-3.5 w-3.5" />}
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
      const timeout = setTimeout(() => setIsDeleting(true), 2400);
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
        className="inline-block w-[2px] h-[0.9em] bg-sky-400 ml-0.5 align-middle"
        style={{ animation: "blink 1s step-end infinite" }}
      />
    </span>
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
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState<{ name: string; role: string; lastLogin?: string } | null>(null);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [, setLockoutTimer] = useState<number | null>(null);

  // Advanced States
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [statPriority, setStatPriority] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<(typeof STAFF_ROSTER)[0] | null>(null);
  const [rfidScanning, setRfidScanning] = useState(false);

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
    const rx = ((y - cy) / cy) * -4.5;
    const ry = ((x - cx) / cx) * 4.5;
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
    document.documentElement.setAttribute("data-theme", "login");
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

  const handleBiometricLogin = async () => {
    if (!biometricAvailable) return setError("Biometric authentication not configured for this station.");
    setBiometricLoading(true);
    setError("");
    try {
      await startBiometricAuthentication(btoa(Math.random().toString()));
      setError("Biometric assertion requires enterprise FIDO2 server link. Use access key.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Biometric authentication failed.");
    } finally {
      setBiometricLoading(false);
    }
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        @keyframes scanBeam   { 0%{top:-2px;opacity:0} 5%{opacity:1} 95%{opacity:0.8} 100%{top:100%;opacity:0} }
        @keyframes slideUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn     { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmerText{ 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes blink      { 50%{opacity:0} }
        @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes shimmerLine{ 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes pulseRing  { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.5);opacity:0} }

        .login-root  { font-family:'Inter',system-ui,sans-serif; }
        .mono        { font-family:'JetBrains Mono',monospace; }

        .clinical-neon-text {
          background: linear-gradient(135deg, #38bdf8 0%, #818cf8 40%, #c084fc 70%, #34d399 100%);
          background-size: 250% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmerText 6s linear infinite;
        }

        .gradient-border-card {
          position: relative;
          z-index: 1;
        }
        .gradient-border-card::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 20px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(14,165,233,0.4), rgba(99,102,241,0.3), rgba(16,185,129,0.3), rgba(14,165,233,0.4));
          background-size: 300% 300%;
          animation: gradientShift 9s ease infinite;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          z-index: -1;
          pointer-events: none;
        }

        .input-wrap {
          position:relative;
          border-radius:12px;
          transition:all 0.25s cubic-bezier(0.16,1,0.3,1);
          background:rgba(255,255,255,0.025);
          border:1px solid rgba(255,255,255,0.08);
        }
        .input-wrap:hover {
          background:rgba(255,255,255,0.04);
          border-color:rgba(255,255,255,0.15);
        }
        .input-wrap.focused {
          border-color:rgba(14,165,233,0.7);
          background:rgba(14,165,233,0.035);
          box-shadow:0 0 0 3px rgba(14,165,233,0.12), 0 0 24px rgba(14,165,233,0.1);
        }
        .input-wrap input {
          background:transparent;
          width:100%;
          outline:none;
          color:#f8fafc;
          font-size:13.5px;
        }
        .input-wrap input::placeholder { color:rgba(255,255,255,0.22); }

        .btn-clinical-primary {
          background:linear-gradient(135deg,#0284c7 0%,#4f46e5 50%,#7c3aed 100%);
          border:1px solid rgba(56,189,248,0.4);
          transition:all 0.3s cubic-bezier(0.16,1,0.3,1);
          position:relative;
          overflow:hidden;
        }
        .btn-clinical-primary:hover:not(:disabled) {
          box-shadow:0 0 45px rgba(14,165,233,0.45), 0 16px 40px rgba(79,70,229,0.35);
          transform:translateY(-1px);
        }

        .card-perspective {
          perspective: 1200px;
        }
      `}</style>

      <div className="login-root min-h-screen flex flex-col bg-[#030407] text-slate-100 relative overflow-hidden select-none">
        <SciFiBackground activeHub={activeHub} />

        {/* ════════════════════════════════════════════════════════
            TOP CLINICAL NAVIGATION & TELEMETRY BAR
        ════════════════════════════════════════════════════════ */}
        <header
          className="relative z-20 flex items-center justify-between px-5 sm:px-8 py-3.5"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(3,4,7,0.85)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3">
            <LabCoreLogo size="md" variant="full" theme="dark" />
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] mono font-semibold bg-white/5 border border-white/10 text-white/50">
              <span>Enterprise v4.2.1</span>
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              <span className="text-emerald-400">Validated</span>
            </span>
          </div>

          {/* 4 Clinical Hub Selectors */}
          <div className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08]">
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
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer ${
                    isAct
                      ? "bg-white/10 text-white border border-white/20 shadow-lg"
                      : "text-white/45 hover:text-white/80 hover:bg-white/[0.03]"
                  }`}
                  style={{
                    borderColor: isAct ? `${conf.accentColor}66` : undefined,
                    boxShadow: isAct ? `0 0 16px ${conf.accentColor}33` : undefined,
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: isAct ? conf.accentColor : "rgba(255,255,255,0.2)" }}
                  />
                  <span>{conf.shortName}</span>
                </button>
              );
            })}
          </div>

          {/* Right System Telemetry & Master Provisioning Portal */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => {
                playTactileTone("click");
                setShowMasterModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold text-sky-300 border border-sky-500/35 bg-sky-500/10 hover:bg-sky-500/20 hover:border-sky-400/60 transition-all cursor-pointer shadow-[0_0_15px_rgba(14,165,233,0.18)]"
              title="Hospital Master Provisioning & License Portal"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
              <span className="hidden sm:inline">Master Registration Portal</span>
              <span className="sm:hidden">Master Portal</span>
            </button>

            <SystemStatusBar
              soundEnabled={soundEnabled}
              onToggleSound={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playTactileTone("success");
              }}
            />
          </div>
        </header>

        {/* ════════════════════════════════════════════════════════
            MAIN TWO-COLUMN WORKSPACE
        ════════════════════════════════════════════════════════ */}
        <main className="flex-1 flex flex-col lg:flex-row relative z-10">
          {/* ────────────────────────────────────────────────────────
              LEFT COLUMN — Clinical Identity, Vitals & Telemetry
          ──────────────────────────────────────────────────────── */}
          <div className="hidden lg:flex flex-col justify-between w-[52%] px-10 xl:px-14 pt-7 pb-6">
            <div>
              {/* Facility Category Pill */}
              <div
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full mb-5"
                style={{
                  background: `${activeHub.accentColor}15`,
                  border: `1px solid ${activeHub.accentColor}40`,
                  backdropFilter: "blur(10px)",
                }}
              >
                <Radio className="h-3.5 w-3.5 animate-pulse" style={{ color: activeHub.accentColor }} />
                <span className="text-[11px] font-bold tracking-wider uppercase mono" style={{ color: activeHub.accentColor }}>
                  {activeHub.category}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-emerald-300/80 text-[10px] mono font-medium">{activeHub.badge}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-[44px] xl:text-[50px] font-black leading-[1.04] tracking-[-0.035em] text-white">
                {activeHub.headlineTitle} <br />
                <span className="clinical-neon-text">{activeHub.headlineHighlight}</span> <br />
                <span className="text-white/35 text-[24px] xl:text-[26px] font-light tracking-tight">
                  built for{" "}
                  <TypingText texts={activeHub.typingTexts} className="text-sky-300/85 font-normal" />
                </span>
              </h1>

              <p className="mt-4 text-white/45 text-sm leading-relaxed max-w-[500px]">
                {activeHub.description}
              </p>

              {/* Key Performance Indicators */}
              <div className="flex items-center gap-7 mt-5 pt-4 border-t border-white/[0.06]">
                {activeHub.stats.map((stat) => (
                  <div key={stat.label} className="text-left">
                    <div className="text-2xl font-black text-white font-mono tracking-tight">{stat.value}</div>
                    <div className="text-[9.5px] text-white/40 uppercase tracking-widest mono mt-0.5 font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Cardiac Vitals & Automated Track Telemetry */}
            <div className="space-y-3 my-5">
              {/* Dual ECG & SpO2 Pleth Canvas */}
              <div className="max-w-[460px]">
                <DualVitalsMonitor />
              </div>

              {/* Robotic Specimen Track Middleware Simulation */}
              <div className="max-w-[460px]">
                <RoboticTrackSimulation />
              </div>

              {/* Specimen Blood Tube Rack (Accession Status) */}
              <div className="max-w-[460px] p-3 rounded-xl bg-white/[0.025] border border-white/[0.06] backdrop-blur-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-semibold flex items-center gap-1.5">
                    <Crosshair className="h-3 w-3 text-sky-400" />
                    Specimen Vacuum Tube Accession Rack
                  </span>
                  <span className="text-[9.5px] font-mono text-emerald-400">5,170 TUBES IN FLIGHT</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {SPECIMEN_TUBES.map((tube) => (
                    <div
                      key={tube.name}
                      className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-center transition-all hover:bg-white/[0.06]"
                    >
                      <div
                        className="h-2 w-full rounded-full mb-1.5"
                        style={{ background: tube.capColor, boxShadow: `0 0 8px ${tube.capGlow}` }}
                      />
                      <span className="text-[9.5px] font-bold text-white block truncate">{tube.name}</span>
                      <span className="text-[8px] text-white/35 block truncate">{tube.count}</span>
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
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9.5px] font-semibold mono group cursor-default transition-all duration-300 hover:bg-white/[0.06]"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.45)",
                  }}
                >
                  <t.icon className="h-3 w-3 text-sky-400/60 group-hover:text-sky-300 transition-colors" />
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          {/* Vertical Divider */}
          <div
            className="hidden lg:block w-px self-stretch"
            style={{
              background:
                "linear-gradient(to bottom, transparent 4%, rgba(14,165,233,0.3) 25%, rgba(99,102,241,0.25) 55%, rgba(16,185,129,0.3) 80%, transparent 96%)",
            }}
          />

          {/* ────────────────────────────────────────────────────────
              RIGHT COLUMN — 3D Sign In Card Terminal
          ──────────────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-7 card-perspective relative">
            <div
              ref={cardRef}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              className="w-full max-w-[480px] transition-transform duration-200 ease-out"
              style={{
                transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              }}
            >
              {/* Mobile Facility Selector */}
              <div className="lg:hidden flex items-center justify-center gap-1.5 mb-4 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08]">
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
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isAct ? "bg-sky-500/25 text-white border border-sky-400/40" : "text-white/40"
                      }`}
                    >
                      {conf.shortName.split(" ")[0]}
                    </button>
                  );
                })}
              </div>

              {/* Card Container */}
              <div
                className="gradient-border-card rounded-2xl p-6 sm:p-7 relative"
                style={{
                  background: "rgba(8,10,18,0.94)",
                  backdropFilter: "blur(35px)",
                  boxShadow:
                    "0 35px 80px rgba(0,0,0,0.7), 0 0 50px rgba(14,165,233,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              >
                {/* Top Glowing Shimmer Line */}
                <div className="absolute top-0 left-0 right-0 h-px overflow-hidden rounded-t-2xl">
                  <div
                    className="h-full w-1/3"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(14,165,233,0.8), rgba(99,102,241,0.8), transparent)",
                      animation: "shimmerLine 3s ease-in-out infinite",
                    }}
                  />
                </div>

                {/* Card Header */}
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-sky-500/15 border border-sky-500/30 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.25)] shrink-0">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      {loginSuccess ? "Identity Verified" : "Clinical Staff Sign In"}
                    </h2>
                    <p className="text-white/40 text-xs font-mono">
                      {loginSuccess ? "Routing to workspace…" : "Hospital, Laboratory & Clinic Access"}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 text-[10px] mono font-bold">256-BIT TLS</span>
                  </div>
                </div>

                {/* Success Overlay */}
                {loginSuccess && (
                  <div className="py-10 text-center" style={{ animation: "slideUp 0.5s ease both" }}>
                    <div
                      className="h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center relative"
                      style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}
                    >
                      <div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          border: "1px solid rgba(16,185,129,0.35)",
                          animation: "pulseRing 1.5s ease-out infinite",
                        }}
                      />
                      <ShieldCheck className="h-8 w-8 text-emerald-400" />
                    </div>
                    <p className="text-white font-bold text-lg">Access Granted</p>
                    <p className="text-white/40 text-xs mt-1.5 mono flex items-center justify-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
                      Loading clinical workspace & patient roster…
                    </p>
                  </div>
                )}

                {!loginSuccess && (
                  <>
                    {/* Smart RFID Card Tap / Proximity Scanner Simulation */}
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={handleSimulateRfidTap}
                        disabled={rfidScanning}
                        className="w-full p-2.5 rounded-xl border border-dashed transition-all flex items-center justify-between cursor-pointer group hover:bg-sky-500/10 hover:border-sky-400/60"
                        style={{
                          background: rfidScanning ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.02)",
                          borderColor: rfidScanning ? "#38bdf8" : "rgba(255,255,255,0.12)",
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                            {rfidScanning ? (
                              <Loader2 className="h-4 w-4 animate-spin text-sky-300" />
                            ) : (
                              <Scan className="h-4 w-4" />
                            )}
                          </div>
                          <div className="text-left">
                            <span className="text-[11.5px] font-bold text-white flex items-center gap-1.5">
                              Tap Hospital RFID Smart Badge
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-400/20 text-sky-300 font-mono">
                                NFC / HID
                              </span>
                            </span>
                            <span className="text-[9.5px] text-white/40 font-mono block">
                              {rfidScanning ? "Reading RFID proximity token…" : "Simulate instant proximity doctor sign-in"}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white transition-colors" />
                      </button>
                    </div>

                    {/* 6-Tier Hospital Staff Directory Roster */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-semibold flex items-center gap-1.5">
                          <Sliders className="h-3 w-3 text-sky-400" />
                          Authorized Staff Roster & Clearance
                        </span>
                        {selectedStaff && (
                          <span className="text-[9.5px] font-mono text-emerald-400 flex items-center gap-1">
                            <Check className="h-2.5 w-2.5" />
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
                                  ? "bg-sky-500/20 border-sky-400 text-white shadow-[0_0_12px_rgba(14,165,233,0.3)]"
                                  : "bg-white/[0.02] border-white/[0.07] text-white/60 hover:bg-white/[0.05] hover:border-white/20"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <IconComp className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                                <span className="text-[10.5px] font-bold text-white truncate">{shortName}</span>
                              </div>
                              <span className="text-[9px] text-white/40 block truncate">{staff.roleCategory}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Verified Staff Credential Banner */}
                      {selectedStaff && (
                        <div className="mt-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5" style={{ animation: "slideUp 0.3s ease both" }}>
                          <div className="h-7 w-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                            <BadgeCheck className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-emerald-300 truncate">{selectedStaff.name} ({selectedStaff.degrees})</span>
                              <span className="text-[8.5px] font-mono px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-300 font-bold shrink-0">{selectedStaff.clearance}</span>
                            </div>
                            <span className="text-[9.5px] text-white/45 block truncate">{selectedStaff.designation} · {selectedStaff.department}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* STAT Emergency Mode Toggle */}
                    <div className="mb-4 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className={`h-4 w-4 ${statPriority ? "text-rose-400 animate-bounce" : "text-white/30"}`} />
                        <div>
                          <span className="text-xs font-semibold text-white/80 block">
                            Emergency STAT Fast-Track
                          </span>
                          <span className="text-[9.5px] text-white/35 font-mono">
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
                          statPriority ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]" : "bg-white/10"
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
                      <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-center justify-between text-[11px] font-mono text-amber-300 mb-1.5">
                          <span>Security Check: {failedAttempts} / 5 Attempts</span>
                          <span>{5 - failedAttempts > 0 ? `${5 - failedAttempts} tries left` : "ACCOUNT LOCKED"}</span>
                        </div>
                        <div className="flex gap-1 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          {[1, 2, 3, 4, 5].map((seg) => (
                            <div
                              key={seg}
                              className="flex-1 rounded-full transition-all duration-300"
                              style={{
                                background:
                                  seg <= failedAttempts
                                    ? failedAttempts >= 4
                                      ? "#ef4444"
                                      : "#f59e0b"
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
                        className="mb-4 p-3.5 rounded-xl flex items-start gap-2.5 text-xs"
                        style={{
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.25)",
                          animation: "fadeIn 0.3s ease both",
                        }}
                      >
                        <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-red-300 leading-relaxed">{error}</p>
                      </div>
                    )}

                    {/* Caps Lock Alert */}
                    {capsLockOn && (
                      <div className="mb-3 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center gap-2 text-[11px] text-amber-300 font-mono">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                        <span>Caps Lock is ON — Passwords are case-sensitive</span>
                      </div>
                    )}

                    {/* Authentication Form */}
                    <form onSubmit={mfaChallenge ? handleMfaSubmit : handleSubmit} className="space-y-3.5">
                      {mfaChallenge ? (
                        <div className="space-y-2">
                          <label className="block text-[11px] font-semibold text-white/60 uppercase tracking-widest mono flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
                            Authenticator Code (TOTP / YubiKey)
                          </label>
                          <div className={`input-wrap ${passwordFocused ? "focused" : ""}`}>
                            <div className="flex items-center px-4 py-3.5">
                              <Lock className="h-4 w-4 mr-3 shrink-0 text-white/30" />
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
                            className="text-xs text-sky-400 hover:text-sky-300 transition-colors mono cursor-pointer block pt-1"
                          >
                            ← Switch clinical user account
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Clinical ID / Employee Code */}
                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-white/60 tracking-wide mono uppercase flex items-center gap-1.5">
                              <Stethoscope className="h-3.5 w-3.5 text-sky-400" />
                              Clinical ID / Employee Code / Work Email
                            </label>
                            <div className={`input-wrap ${emailFocused ? "focused" : ""}`}>
                              <div className="flex items-center px-4 py-3">
                                <Mail
                                  className="h-4 w-4 mr-3 shrink-0 transition-colors duration-300"
                                  style={{ color: emailFocused ? "#38bdf8" : "rgba(255,255,255,0.3)" }}
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

                          {/* Access Key / Password */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="block text-[11px] font-semibold text-white/60 tracking-wide mono uppercase flex items-center gap-1.5">
                                <KeyRound className="h-3.5 w-3.5 text-sky-400" />
                                Secure Access Key / Password
                              </label>
                              <button
                                type="button"
                                onClick={() => router.push("/forgot-password")}
                                className="text-[11px] text-sky-400 hover:text-sky-300 transition-colors mono font-medium cursor-pointer"
                              >
                                Forgot key?
                              </button>
                            </div>
                            <div className={`input-wrap ${passwordFocused ? "focused" : ""}`}>
                              <div className="flex items-center px-4 py-3">
                                <Lock
                                  className="h-4 w-4 mr-3 shrink-0 transition-colors duration-300"
                                  style={{ color: passwordFocused ? "#38bdf8" : "rgba(255,255,255,0.3)" }}
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
                                  className="ml-2 shrink-0 text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer"
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Security Options */}
                          <div className="flex items-center justify-between py-0.5">
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
                                className="h-4 w-4 rounded flex items-center justify-center transition-all duration-300"
                                style={{
                                  background: rememberMe
                                    ? "linear-gradient(135deg,#0284c7,#4f46e5)"
                                    : "rgba(255,255,255,0.06)",
                                  border: rememberMe ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.15)",
                                  boxShadow: rememberMe ? "0 0 10px rgba(14,165,233,0.3)" : "none",
                                }}
                              >
                                {rememberMe && (
                                  <svg
                                    className="h-2.5 w-2.5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors select-none font-mono">
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
                              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 font-mono transition-colors cursor-pointer"
                            >
                              <div
                                className="h-2.5 w-2.5 rounded-full transition-all"
                                style={{
                                  background: privacyMode ? "#34d399" : "rgba(255,255,255,0.12)",
                                  boxShadow: privacyMode ? "0 0 6px rgba(52,211,153,0.6)" : "none",
                                }}
                              />
                              <span>HIPAA privacy screen</span>
                            </button>
                          </div>
                        </>
                      )}

                      {/* Submit Action Button */}
                      <div className="relative pt-1">
                        <button
                          id="login-submit-btn"
                          type="submit"
                          disabled={loading || Boolean(mfaChallenge && mfaCode.length < 6)}
                          className="btn-clinical-primary w-full py-3.5 rounded-xl text-sm font-extrabold text-white flex items-center justify-center gap-2.5 relative z-10 shadow-lg shadow-sky-600/25 cursor-pointer"
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
                                {mfaChallenge ? "Verify TOTP & Enter Station" : "Sign In Securely"}
                              </span>
                              <ChevronRight className="h-4 w-4 text-white/80 ml-auto" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>

                    {/* Footer Certifications */}
                    <div
                      className="mt-5 pt-3.5 flex items-center justify-center gap-2.5 flex-wrap"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      {[
                        { icon: ShieldCheck, text: "256-Bit TLS" },
                        { icon: Lock, text: "JWT Auth" },
                        { icon: Fingerprint, text: "TOTP MFA" },
                        { icon: Cpu, text: "NABL Ready" },
                      ].map(({ icon: Icon, text }) => (
                        <div
                          key={text}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-white/45"
                        >
                          <Icon className="h-3 w-3 text-sky-400" />
                          <span className="text-[10px] mono font-medium">{text}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Master Lab & Role Provisioning Portal Trigger */}
              <div className="mt-4 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    playTactileTone("click");
                    setShowMasterModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-medium text-sky-300 hover:text-white bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all cursor-pointer shadow-[0_0_15px_rgba(14,165,233,0.12)]"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
                  <span>Master Lab & Role Setup Portal</span>
                </button>
              </div>

              <p className="text-center text-white/20 text-[10px] mt-3 mono tracking-widest uppercase">
                © {new Date().getFullYear()} LabCore ELIS™ · SECURED HOSPITAL SESSION
              </p>
            </div>
          </div>
        </main>

        {/* ════════════════════════════════════════════════════════
            BOTTOM CLINICAL ANALYZERS TELEMETRY RIBBON
        ════════════════════════════════════════════════════════ */}
        <footer
          className="relative z-20 py-2.5 px-6 overflow-hidden border-t border-white/[0.06]"
          style={{
            background: "rgba(3,4,7,0.9)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            <span className="text-[10px] mono uppercase text-sky-400 font-bold shrink-0 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ANALYZER FEED:
            </span>
            <div className="flex items-center gap-4 shrink-0">
              {CLINICAL_ANALYZERS.map((a) => (
                <div
                  key={a.name}
                  className="flex items-center gap-2 text-[10px] font-mono px-2.5 py-1 rounded-md bg-white/[0.025] border border-white/[0.05]"
                >
                  <span className="text-white/80 font-semibold">{a.name}</span>
                  <span className="text-white/30 hidden sm:inline">({a.dept})</span>
                  <span className="text-emerald-400/90 font-bold">● {a.status}</span>
                  <span className="text-white/20 text-[9px]">{a.speed}</span>
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
