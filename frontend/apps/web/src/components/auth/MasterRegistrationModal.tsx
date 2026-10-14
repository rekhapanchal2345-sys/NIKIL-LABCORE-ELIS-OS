"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  ShieldCheck,
  KeyRound,
  UserPlus,
  Users,
  Building2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  Lock,
  Unlock,
  Stethoscope,
  FlaskConical,
  Laptop,
  Award,
  RefreshCw,
  X,
  ArrowRight,
  Shield,
  FileCheck,
  QrCode,
  Fingerprint,
  Printer,
  BadgeAlert,
  Sliders,
  CheckSquare,
  Activity,
  Cpu,
  Zap,
  Clock,
  MapPin,
  Phone,
  Mail,
  Share2,
  Download,
  Terminal,
  Radio,
  SlidersHorizontal,
  Flame,
  FileSpreadsheet,
  Globe,
  Network,
  PenTool,
  Eraser,
  FileText,
  Key,
  Layers,
  Database,
  ExternalLink,
  Upload,
  Volume2,
  VolumeX,
  Play,
  Monitor,
  Send,
  MessageSquare,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  CheckCheck,
  Search,
  ShieldAlert,
  HeartPulse,
  Pencil,
  Trash2,
  LogIn,
  CalendarDays,
  RotateCcw
} from "lucide-react";
import { userApi, authApi } from "@/lib/api";
import { getAccessToken, login as authLogin } from "@/lib/auth";

interface MasterRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAutoFillLogin?: (email: string, pass: string) => void;
  onDirectLogin?: (user: { name: string; role: string; lastLogin?: string }) => void;
}

/**
 * Fields that must never be written to browser storage.
 *
 * The directory is cached in localStorage so the roster renders without a
 * round-trip, but a plaintext password in localStorage is readable by any
 * script on the page and survives the tab closing. Passwords live only in the
 * backend, hashed.
 */
const NEVER_PERSISTED_FIELDS = [
  "password",
  "passwordHash",
  "ownerToken",
  "token",
  "accessToken",
  "refreshToken",
] as const;

/** Strips secrets before a directory record is cached in localStorage. */
const stripSecrets = <T extends Record<string, unknown>>(user: T): T => {
  const clean: Record<string, unknown> = { ...user };
  for (const field of NEVER_PERSISTED_FIELDS) delete clean[field];
  return clean as T;
};

// UserRole values the staff database accepts on POST /api/users. QUALITY_MANAGER
// is absent there, so it cannot be provisioned as a real login.
const BACKEND_CREATABLE_ROLES = [
  "ADMIN",
  "PATHOLOGIST",
  "LAB_TECH",
  "DOCTOR",
  "FRONT_DESK",
];

interface RoleConfig {
  role: string;
  title: string;
  subtitle: string;
  badge: string;
  color: string;
  gradient: string;
  icon: any;
  capabilities: string[];
}

const ROLE_CONFIGS: Record<string, RoleConfig> = {
  ADMIN: {
    role: "ADMIN",
    title: "Super Administrator / Owner",
    subtitle: "Complete Governance & Financial Control",
    badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    color: "indigo",
    gradient: "from-indigo-600 via-indigo-700 to-purple-800",
    icon: ShieldCheck,
    capabilities: [
      "Full User role creation & permissions governance",
      "Real-time audit log tracking & regulatory compliance",
      "Tariff pricing & corporate B2B diagnostic billing",
      "Database backup, failover & disaster recovery"
    ],
  },
  PATHOLOGIST: {
    role: "PATHOLOGIST",
    title: "Consultant Pathologist (MD)",
    subtitle: "NABL Signatory & Critical Panic Review",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    color: "emerald",
    gradient: "from-emerald-600 via-teal-700 to-cyan-800",
    icon: Stethoscope,
    capabilities: [
      "NABL ISO 15189 Cryptographic Digital Stamp sign-off",
      "Critical value panic alerts sign-off & SMS dispatch",
      "Histopathology, Bone Marrow & Cytology reviews",
      "Dual-authorization clinical diagnostic validation"
    ],
  },
  LAB_TECH: {
    role: "LAB_TECH",
    title: "Medical Lab Technologist (MLT)",
    subtitle: "Analyzer Workstations & Bench Operations",
    badge: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    color: "sky",
    gradient: "from-sky-600 via-blue-700 to-indigo-800",
    icon: FlaskConical,
    capabilities: [
      "Bidirectional analyzer worklist synchronization",
      "Specimen accessioning & tube barcoding validation",
      "Westgard multi-rule QC calibration & rejection entry",
      "STAT emergency lane 15-min fast-tracking"
    ],
  },
  DOCTOR: {
    role: "DOCTOR",
    title: "Referring Doctor / Clinician",
    subtitle: "OPD Referral & Patient Health Records",
    badge: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    color: "teal",
    gradient: "from-teal-600 via-emerald-700 to-blue-800",
    icon: Stethoscope,
    capabilities: [
      "Electronic test order prescription & clinical history",
      "Real-time diagnostic trend graphs & cumulative reports",
      "WhatsApp & PDF diagnostic report downloads",
      "ABHA longitudinal EHR health record inspection"
    ],
  },
  FRONT_DESK: {
    role: "FRONT_DESK",
    title: "Front Desk & Billing Executive",
    subtitle: "Patient Desk, Cash Counter & ABHA Desk",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    color: "amber",
    gradient: "from-amber-600 via-orange-700 to-yellow-800",
    icon: Laptop,
    capabilities: [
      "Rapid patient onboarding & UHID generation",
      "POS cash counter billing & GST compliance receipts",
      "ABHA Scan & Share QR integration desk",
      "Day book shift closing handover & settlement"
    ],
  },
  QUALITY_MANAGER: {
    role: "QUALITY_MANAGER",
    title: "Quality Assurance Officer (QA)",
    subtitle: "NABL 112, ISO 15189 & Equipment Audits",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    color: "rose",
    gradient: "from-rose-600 via-pink-700 to-red-800",
    icon: Award,
    capabilities: [
      "Levey-Jennings QC chart violation auto-locks",
      "Turnaround Time (TAT) SLA compliance telemetry",
      "Reagent expiry locks & automated inventory hold",
      "Analyzer maintenance calibration & linearity logs"
    ],
  },
};

const DEPARTMENTS = [
  "Pathology & Molecular Diagnostics",
  "Histopathology & Cytopathology",
  "Microbiology, Serology & PCR",
  "Hematology & Clinical Pathology",
  "Clinical Biochemistry & Immunoassay",
  "Phlebotomy & Sample Accessioning",
  "Front Desk, Cash Counter & Billing",
  "Clinical Consultation & OPD Services",
];

const SHIFTS = [
  "General Shift (09:00 AM - 06:00 PM)",
  "Morning Rush Shift (06:00 AM - 02:00 PM)",
  "Day Clinical Shift (08:00 AM - 04:00 PM)",
  "Evening Shift (02:00 PM - 10:00 PM)",
  "Night Emergency STAT (10:00 PM - 06:00 AM)",
  "Honorary Consultant (On-Call & Weekend)",
];

const MEDICAL_COUNCILS = [
  "MCI - Medical Council of India",
  "NMC - National Medical Commission",
  "Maharashtra Medical Council (MMC)",
  "Delhi Medical Council (DMC)",
  "Gujarat Medical Council (GMC)",
  "Karnataka Medical Council (KMC)",
  "Tamil Nadu Medical Council (TNMC)",
  "Uttar Pradesh Medical Council (UPMC)",
  "West Bengal Medical Council (WBMC)",
];

const ANALYZER_WORKSTATIONS = [
  { id: "sysmex", name: "Sysmex XN-1000", type: "Hematology 5-Part", port: "COM1 / TCP 5000" },
  { id: "cobas", name: "Roche Cobas e411", type: "CLIA Immunoassay", port: "ASTM 1381 / TCP 5002" },
  { id: "c311", name: "Roche Cobas c311", type: "Clinical Chemistry", port: "HL7 / TCP 5004" },
  { id: "quant", name: "QuantStudio 5 Dx", type: "RT-PCR Molecular", port: "LIMS Bridge / File" },
  { id: "biorad", name: "Bio-Rad D-10", type: "HPLC HbA1c", port: "RS232 / TCP 5008" },
  { id: "stago", name: "Stago Compact Max", type: "Coagulation Analyzer", port: "Serial / TCP 5010" },
];

const BRANCH_LOCATIONS = [
  "Main Central Reference Lab (Apex Health City)",
  "Satellite Specimen Hub #1 (North Campus)",
  "Trauma & Emergency STAT Lab (Wing B)",
  "Outpatient Collection Center (City Center)",
];

// Sample batch for instant bulk roster import demo
const SAMPLE_BATCH_ROSTER = [
  { name: "Dr. Ananya Deshmukh", role: "PATHOLOGIST", email: "ananya.d@labcore.com", phone: "+91 98221 44551", department: "Microbiology, Serology & PCR", degrees: "MD Microbiology", empCode: "EMP-LC-701" },
  { name: "Dr. Suresh K. Nair", role: "DOCTOR", email: "dr.suresh@labcore.com", phone: "+91 94470 55667", department: "Clinical Consultation & OPD Services", degrees: "MBBS, MD Medicine", empCode: "EMP-LC-702" },
  { name: "Pooja Sundaram", role: "LAB_TECH", email: "pooja.mlt@labcore.com", phone: "+91 99123 44556", department: "Clinical Biochemistry & Immunoassay", degrees: "M.Sc Biochemistry", empCode: "EMP-LC-703" },
  { name: "Amit Verma", role: "LAB_TECH", email: "amit.phleb@labcore.com", phone: "+91 98980 12345", department: "Phlebotomy & Sample Accessioning", degrees: "DMLT, Phlebotomy Specialist", empCode: "EMP-LC-704" },
  { name: "Rohit S. Mehra", role: "FRONT_DESK", email: "rohit.billing@labcore.com", phone: "+91 97110 33445", department: "Front Desk, Cash Counter & Billing", degrees: "B.Com, Healthcare Billing", empCode: "EMP-LC-705" },
  { name: "Dr. Kavita Joshi", role: "QUALITY_MANAGER", email: "kavita.qa@labcore.com", phone: "+91 98330 99881", department: "Pathology & Molecular Diagnostics", degrees: "PhD Quality, NABL Assessor", empCode: "EMP-LC-706" },
];

export default function MasterRegistrationModal({
  isOpen,
  onClose,
  onAutoFillLogin,
  onDirectLogin,
}: MasterRegistrationModalProps) {
  // Master Authorization Gate
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [enteredPasscode, setEnteredPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [activeTab, setActiveTab] = useState<"register" | "hospital" | "directory" | "telemetry" | "license" | "bulk" | "simulator" | "audit" | "qcmonitor">("register");

  // Audio effects enabled
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Session Timer
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionTimerRef = useRef<any>(null);

  // Registration Form State
  const [fullName, setFullName] = useState("Dr. Rajesh K. Sharma");
  const [employeeCode, setEmployeeCode] = useState("EMP-LC-812");
  const [email, setEmail] = useState("dr.rajesh@labcore.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [password, setPassword] = useState("LabCore#2026");
  const [showPassword, setShowPassword] = useState(true);
  const [role, setRole] = useState("PATHOLOGIST");
  const [department, setDepartment] = useState("Pathology & Molecular Diagnostics");
  const [shift, setShift] = useState("General Shift (09:00 AM - 06:00 PM)");
  const [branch, setBranch] = useState(BRANCH_LOCATIONS[0]);
  const [medicalRegNo, setMedicalRegNo] = useState("MCI-2018-88492");
  const [medicalCouncil, setMedicalCouncil] = useState("NMC - National Medical Commission");
  const [degrees, setDegrees] = useState("MD (Pathology), DCP, FICP");
  const [isNablSignatory, setIsNablSignatory] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [canApproveCritical, setCanApproveCritical] = useState(true);
  const [restrictToSubnet, setRestrictToSubnet] = useState(false);
  const [allowTeleReporting, setAllowTeleReporting] = useState(true);
  const [selectedAnalyzers, setSelectedAnalyzers] = useState<string[]>(["sysmex", "cobas"]);
  const [signatureHash, setSignatureHash] = useState("SHA256:8f4e2b01c59d9921ef4a");
  const [drawnSignatureData, setDrawnSignatureData] = useState<string | null>(null);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Hospital Setup State
  const [hospitalName, setHospitalName] = useState("Apex Super-Speciality Hospital & Research Center");
  const [hospitalCode, setHospitalCode] = useState("APEX-CENTRAL-01");
  const [nablCode, setNablCode] = useState("NABL-MC-2026-981");
  const [nabhCode, setNabhCode] = useState("NABH-HOSP-2024-4412");
  const [gstin, setGstin] = useState("27AAAAA0000A1Z5");
  const [hospitalPhone, setHospitalPhone] = useState("+91 22 2890 0000");
  const [hospitalEmail, setHospitalEmail] = useState("contact@apexhospital.org");
  const [hospitalAddress, setHospitalAddress] = useState("Sector 12, Healthcare City, Medical Campus, Mumbai 400001");
  const [directorName, setDirectorName] = useState("Dr. S. V. Ramanathan, MD, FRCPath");
  const [bedCapacity, setBedCapacity] = useState("250");
  const [hospitalType, setHospitalType] = useState("Multi-Speciality Hospital");
  const [emergencyHelpline, setEmergencyHelpline] = useState("+91 22 2890 9999");
  const [websiteUrl, setWebsiteUrl] = useState("https://www.apexhospital.org");

  // License Modules State
  const [activeModules, setActiveModules] = useState({
    whatsapp: true,
    abdm: true,
    analyzerDrivers: true,
    panicAlerts: true,
    b2bReferrals: true,
    poctBedside: true,
  });

  // Bulk Import state
  const [bulkImportProgress, setBulkImportProgress] = useState<number | null>(null);
  const [bulkImportSuccess, setBulkImportSuccess] = useState<string | null>(null);

  // Simulator mode
  const [simulatedRole, setSimulatedRole] = useState("PATHOLOGIST");

  // Telemetry & Feedback State
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [existingUsers, setExistingUsers] = useState<any[]>([]);
  const [directorySearch, setDirectorySearch] = useState("");
  const [selectedDirectoryRole, setSelectedDirectoryRole] = useState("ALL");
  const [printableLetterUser, setPrintableLetterUser] = useState<any | null>(null);
  const [suspendedUsers, setSuspendedUsers] = useState<string[]>([]);

  // Staff registry management state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<any | null>(null);
  const [copiedCredsFor, setCopiedCredsFor] = useState<string | null>(null);
  const [loginAsUserId, setLoginAsUserId] = useState<string | null>(null);

  // Owner confirmation token. Kept in a ref rather than state so it is never
  // serialised into a React devtools snapshot or persisted anywhere.
  const ownerTokenRef = useRef<string | null>(null);
  const [ownerVerifying, setOwnerVerifying] = useState(false);

  // Live system metric values (simulated fluctuation)
  const [sysMetrics, setSysMetrics] = useState({ cpu: 38, ram: 62, net: 14, db: 7 });
  const metricsTimerRef = useRef<any>(null);

  // Audit log entries
  const [auditLog] = useState<Array<{time: string; user: string; action: string; ip: string; severity: "info"|"warn"|"critical"}>>(() => [
    { time: "09:14:52", user: "admin@labcore.com", action: "Master Portal unlocked — Owner auth successful", ip: "192.168.1.100", severity: "info" },
    { time: "09:12:11", user: "dr.vikram@labcore.com", action: "Panic value triggered: Troponin I = 4.8 ng/mL (CRITICAL HIGH)", ip: "192.168.1.45", severity: "critical" },
    { time: "09:09:33", user: "pooja.mlt@labcore.com", action: "Sysmex XN-1000 result auto-transferred: CBC Panel — Pt ID 80443", ip: "192.168.1.202", severity: "info" },
    { time: "09:07:17", user: "rohit.billing@labcore.com", action: "POS invoice #INV-2026-8841 generated — ₹4,200", ip: "192.168.1.21", severity: "info" },
    { time: "09:03:44", user: "kavita.qa@labcore.com", action: "IQC Westgard rule 1:3s violation — Glucose Control L3", ip: "192.168.1.77", severity: "warn" },
    { time: "08:58:09", user: "dr.suresh@labcore.com", action: "New OPD prescription submitted — 12 tests ordered", ip: "192.168.1.88", severity: "info" },
    { time: "08:51:22", user: "ananya.d@labcore.com", action: "COVID-19 RT-PCR report digitally signed & dispatched via WhatsApp", ip: "192.168.1.45", severity: "info" },
    { time: "08:47:05", user: "SYSTEM", action: "Nightly backup completed — 2,441 records archived to NAS", ip: "127.0.0.1", severity: "info" },
    { time: "08:39:55", user: "SYSTEM", action: "ABDM FHIR R4 health link token refreshed successfully", ip: "172.16.0.1", severity: "info" },
    { time: "08:31:18", user: "admin@labcore.com", action: "New user provisioned: Dr. Ananya Deshmukh (PATHOLOGIST)", ip: "192.168.1.100", severity: "info" },
  ]);

  // QC Control data
  const [qcData] = useState<Array<{analyte: string; mean: number; sd: number; lastVal: number; rule: string; status: "pass"|"warn"|"fail"; trend: number[]}>>(() => [
    { analyte: "Glucose", mean: 100.2, sd: 2.1, lastVal: 106.8, rule: "1:2s Warning", status: "warn", trend: [100.5, 101.2, 99.8, 103.4, 106.8] },
    { analyte: "HbA1c (%)", mean: 6.15, sd: 0.12, lastVal: 6.18, rule: "—", status: "pass", trend: [6.12, 6.13, 6.17, 6.16, 6.18] },
    { analyte: "Creatinine", mean: 1.02, sd: 0.04, lastVal: 0.99, rule: "—", status: "pass", trend: [1.01, 1.03, 1.00, 1.02, 0.99] },
    { analyte: "TSH (mIU/L)", mean: 2.45, sd: 0.22, lastVal: 2.91, rule: "1:2s Warning", status: "warn", trend: [2.44, 2.48, 2.50, 2.69, 2.91] },
    { analyte: "Troponin I", mean: 0.012, sd: 0.002, lastVal: 0.011, rule: "—", status: "pass", trend: [0.011, 0.012, 0.013, 0.012, 0.011] },
    { analyte: "Hemoglobin", mean: 12.8, sd: 0.31, lastVal: 13.5, rule: "2:2s Reject", status: "fail", trend: [12.9, 13.0, 13.2, 13.4, 13.5] },
  ]);

  // TAT SLA data
  const tatSLA = [
    { dept: "Biochemistry", target: 60, actual: 47, load: 142 },
    { dept: "Hematology", target: 45, actual: 38, load: 219 },
    { dept: "Microbiology", target: 240, actual: 198, load: 34 },
    { dept: "RT-PCR / Molecular", target: 360, actual: 312, load: 18 },
    { dept: "Immunoassay", target: 90, actual: 88, load: 76 },
  ];

  // Play subtle Web Audio sci-fi confirmation beep
  const playBeep = (freq = 800, type: OscillatorType = "sine", duration = 0.08) => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // quiet fallback
    }
  };

  // Generate cryptographic signature hash
  const regenerateSignatureHash = () => {
    const chars = "0123456789abcdef";
    let hash = "SHA256:";
    for (let i = 0; i < 20; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    setSignatureHash(hash);
    playBeep(1100, "triangle", 0.06);
  };

  // Canvas signature drawing with dynamic high-DPI scaling and zero-latency pointer events
  const canvasLastPointRef = useRef<{ x: number; y: number } | null>(null);

  const initSignatureCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#10b981"; // Emerald medical ink
  }, []);

  const handleSignaturePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    canvasLastPointRef.current = { x, y };
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleSignaturePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !canvasLastPointRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const events = (e.nativeEvent as any).getCoalescedEvents?.() || [e];
    for (const ce of events) {
      const currentX = ce.clientX - rect.left;
      const currentY = ce.clientY - rect.top;
      const midX = (canvasLastPointRef.current.x + currentX) / 2;
      const midY = (canvasLastPointRef.current.y + currentY) / 2;
      ctx.quadraticCurveTo(canvasLastPointRef.current.x, canvasLastPointRef.current.y, midX, midY);
      ctx.stroke();
      canvasLastPointRef.current = { x: currentX, y: currentY };
    }
  };

  const handleSignaturePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (!isDrawing) return;
    setIsDrawing(false);
    canvasLastPointRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      setDrawnSignatureData(canvas.toDataURL());
    }
  };

  const clearSignatureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawnSignatureData(null);
    playBeep(400, "sine", 0.05);
  };

  // Session timer effect
  useEffect(() => {
    if (isAuthorized) {
      sessionTimerRef.current = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    } else {
      setSessionSeconds(0);
      clearInterval(sessionTimerRef.current);
    }
    return () => clearInterval(sessionTimerRef.current);
  }, [isAuthorized]);

  // Live system metrics fluctuation (simulated)
  useEffect(() => {
    metricsTimerRef.current = setInterval(() => {
      setSysMetrics({
        cpu: Math.min(95, Math.max(12, 38 + Math.round((Math.random() - 0.5) * 18))),
        ram: Math.min(90, Math.max(40, 62 + Math.round((Math.random() - 0.5) * 10))),
        net: Math.min(90, Math.max(2, 14 + Math.round((Math.random() - 0.5) * 12))),
        db: Math.min(40, Math.max(2, 7 + Math.round((Math.random() - 0.5) * 6))),
      });
    }, 2200);
    return () => clearInterval(metricsTimerRef.current);
  }, []);

  const fmtSessionTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  // Load existing directory & hospital config on modal open
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem("labcore_users_directory");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setExistingUsers(parsed);
          }
        }

        const storedSuspended = localStorage.getItem("labcore_suspended_users");
        if (storedSuspended) {
          const parsedSuspended = JSON.parse(storedSuspended);
          if (Array.isArray(parsedSuspended)) {
            setSuspendedUsers(parsedSuspended);
          }
        }

        const storedHosp = localStorage.getItem("labcore_hospital_config");
        if (storedHosp) {
          const parsedHosp = JSON.parse(storedHosp);
          if (parsedHosp.hospitalName) setHospitalName(parsedHosp.hospitalName);
          if (parsedHosp.hospitalCode) setHospitalCode(parsedHosp.hospitalCode);
          if (parsedHosp.nablCode) setNablCode(parsedHosp.nablCode);
          if (parsedHosp.hospitalPhone) setHospitalPhone(parsedHosp.hospitalPhone);
          if (parsedHosp.hospitalAddress) setHospitalAddress(parsedHosp.hospitalAddress);
          if (parsedHosp.bedCapacity) setBedCapacity(parsedHosp.bedCapacity);
          if (parsedHosp.hospitalType) setHospitalType(parsedHosp.hospitalType);
          if (parsedHosp.emergencyHelpline) setEmergencyHelpline(parsedHosp.emergencyHelpline);
          if (parsedHosp.websiteUrl) setWebsiteUrl(parsedHosp.websiteUrl);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [isOpen]);

  /* ────────────────────────────────────────────────────────────
     Password generation
     The API enforces the 12+ character complexity policy, so every
     generated credential must satisfy it — upper, lower, digit, symbol.
  ──────────────────────────────────────────────────────────── */
  const PASSWORD_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const PASSWORD_LOWER = "abcdefghijkmnopqrstuvwxyz";
  const PASSWORD_DIGITS = "23456789";
  const PASSWORD_SYMBOLS = "!@#$%&*?";
  const PASSWORD_ALL = PASSWORD_UPPER + PASSWORD_LOWER + PASSWORD_DIGITS + PASSWORD_SYMBOLS;

  const randomFrom = (chars: string, count: number): string => {
    const values = new Uint32Array(count);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(values);
    } else {
      for (let i = 0; i < count; i++) values[i] = Math.floor(Math.random() * 2 ** 32);
    }
    let out = "";
    for (let i = 0; i < count; i++) out += chars[values[i] % chars.length];
    return out;
  };

  const generateCompliantPassword = (): string =>
    `${randomFrom(PASSWORD_UPPER, 3)}${randomFrom(PASSWORD_LOWER, 4)}` +
    `${randomFrom(PASSWORD_DIGITS, 3)}${randomFrom(PASSWORD_SYMBOLS, 2)}` +
    `${randomFrom(PASSWORD_ALL, 2)}`;

  /** Records provisioned through the API carry a Prisma id; demo/bulk rows use "usr-" ids that only exist in localStorage. */
  const isBackendRecord = (id?: string): boolean =>
    Boolean(id) && !String(id).startsWith("usr-");

  const generateNewCredentials = () => {
    const randomEmpNum = Math.floor(100 + Math.random() * 900);
    setEmployeeCode(`EMP-LC-${randomEmpNum}`);
    setPassword(generateCompliantPassword());
    regenerateSignatureHash();
    clearSignatureCanvas();
    playBeep(950, "sine", 0.07);
  };

  const handleApplyPreset = (presetRole: string) => {
    setRole(presetRole);
    if (presetRole === "PATHOLOGIST") {
      setFullName("Dr. Vikramaditya Sharma");
      setEmail("dr.vikram@labcore.com");
      setDepartment("Pathology & Molecular Diagnostics");
      setDegrees("MD (Pathology), DCP");
      setMedicalRegNo("MCI-2015-44910");
      setIsNablSignatory(true);
      setCanApproveCritical(true);
      setSelectedAnalyzers(["sysmex", "cobas", "quant"]);
    } else if (presetRole === "LAB_TECH") {
      setFullName("Rajesh K. Patel");
      setEmail("rajesh.tech@labcore.com");
      setDepartment("Hematology & Clinical Pathology");
      setDegrees("B.Sc MLT, ASCP Cert");
      setIsNablSignatory(false);
      setCanApproveCritical(false);
      setSelectedAnalyzers(["sysmex", "cobas", "biorad"]);
    } else if (presetRole === "FRONT_DESK") {
      setFullName("Neha V. Gupta");
      setEmail("neha.billing@labcore.com");
      setDepartment("Front Desk, Cash Counter & Billing");
      setDegrees("B.Com, Healthcare Billing");
      setIsNablSignatory(false);
      setCanApproveCritical(false);
      setSelectedAnalyzers([]);
    } else if (presetRole === "ADMIN") {
      setFullName("Dr. Jaya Ashapurama");
      setEmail("admin@labcore.com");
      setDepartment("Clinical Consultation & OPD Services");
      setDegrees("MD, Chief Medical Director");
      setIsNablSignatory(true);
      setCanApproveCritical(true);
      setSelectedAnalyzers(ANALYZER_WORKSTATIONS.map((a) => a.id));
    }
    generateNewCredentials();
  };

  const toggleAnalyzer = (id: string) => {
    playBeep(700, "triangle", 0.04);
    if (selectedAnalyzers.includes(id)) {
      setSelectedAnalyzers(selectedAnalyzers.filter((x) => x !== id));
    } else {
      setSelectedAnalyzers([...selectedAnalyzers, id]);
    }
  };

  /**
   * Owner confirmation for the registration panel.
   *
   * The password is checked by the server against the stored hash. The previous
   * implementation compared against a passcode embedded in this JavaScript
   * bundle, which meant every visitor to the page held that key.
   */
  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    const password = enteredPasscode.trim();

    if (!password) {
      setPasscodeError("Enter your sign-in password to continue.");
      return;
    }

    if (!getAccessToken()) {
      setPasscodeError("Sign in with an administrator account first.");
      playBeep(250, "sawtooth", 0.18);
      return;
    }

    setOwnerVerifying(true);
    try {
      const response: any = await authApi.verifyOwner(password);
      const ownerToken = response?.data?.ownerToken;

      if (!ownerToken) {
        throw new Error("Owner confirmation failed. Please try again.");
      }

      // Held in memory only: it must never reach localStorage or sessionStorage.
      ownerTokenRef.current = ownerToken;
      setEnteredPasscode("");
      setIsAuthorized(true);
      setPasscodeError("");
      playBeep(1200, "sine", 0.12);
    } catch (err: any) {
      ownerTokenRef.current = null;
      setIsAuthorized(false);
      setPasscodeError(
        err?.message ||
          "Owner confirmation failed. Access is restricted to administrators."
      );
      playBeep(250, "sawtooth", 0.18);
    } finally {
      setOwnerVerifying(false);
    }
  };

  const handleLockSession = () => {
    ownerTokenRef.current = null;
    setIsAuthorized(false);
    setEnteredPasscode("");
    playBeep(350, "sine", 0.1);
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessData(null);

    if (!BACKEND_CREATABLE_ROLES.includes(role)) {
      setErrorMsg(
        `${role} is not a role in the staff database, so no sign-in can be created for it. Use one of: ${BACKEND_CREATABLE_ROLES.join(", ")}.`
      );
      setLoading(false);
      return;
    }

    if (!getAccessToken()) {
      setErrorMsg(
        "Sign in with an ADMIN account first. Personnel are created in the lab database, which is what makes 'Login As' work."
      );
      setLoading(false);
      return;
    }

    const newUserPayload = {
      id: `usr-${Date.now().toString().slice(-6)}`,
      name: fullName.trim(),
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      phone: phone.trim() || "+91 98000 00000",
      role: role,
      employeeCode: employeeCode.trim() || `EMP-${Date.now().toString().slice(-4)}`,
      branchLocation: branch,
      medicalRegistrationNo: (role === "PATHOLOGIST" || role === "DOCTOR") ? medicalRegNo.trim() : undefined,
      medicalCouncil: (role === "PATHOLOGIST" || role === "DOCTOR") ? medicalCouncil : undefined,
      degrees: degrees.trim() || (role === "PATHOLOGIST" ? "MD Pathology" : role === "LAB_TECH" ? "B.Sc MLT" : "Graduate"),
      department: department,
      shift: shift,
      isNablSignatory: isNablSignatory,
      canApproveCritical: canApproveCritical,
      assignedAnalyzers: selectedAnalyzers,
      signatureStatus: isNablSignatory ? "VERIFIED" : "PENDING_UPLOAD",
      signatureStampId: isNablSignatory ? signatureHash : undefined,
      signatureImage: drawnSignatureData || undefined,
      twoFactorEnabled: twoFactorEnabled,
      restrictToSubnet: restrictToSubnet,
      allowTeleReporting: allowTeleReporting,
      status: "ACTIVE",
      joinedDate: new Date().toISOString().split("T")[0],
    };

    try {
      // 1. Create the sign-in in the lab database
      const response: any = await userApi.create({
        fullName: newUserPayload.fullName,
        email: newUserPayload.email,
        password: newUserPayload.password,
        phone: newUserPayload.phone,
        role: newUserPayload.role,
        employeeCode: newUserPayload.employeeCode,
        specialization: newUserPayload.department,
      });

      const accountId = response?.data?.user?.id;
      const record = accountId
        ? { ...newUserPayload, id: accountId }
        : newUserPayload;

      // 2. Persist in Local Directory
      let updatedList = [record];
      try {
        const stored = localStorage.getItem("labcore_users_directory");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            updatedList = [record, ...parsed.filter((u: any) => u.email !== record.email)];
          }
        }
      } catch (e) {
        // ignore
      }

      persistDirectory(updatedList);

      setSuccessData(stripSecrets(record));
      setLoading(false);
      playBeep(1400, "sine", 0.15);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to provision user. Please verify all required inputs.");
      setLoading(false);
    }
  };

  const handleSaveHospitalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const hospitalConfig = {
      hospitalName,
      hospitalCode,
      nablCode,
      nabhCode,
      gstin,
      hospitalPhone,
      hospitalEmail,
      hospitalAddress,
      directorName,
      bedCapacity,
      hospitalType,
      emergencyHelpline,
      websiteUrl,
      activeModules,
      configuredAt: new Date().toISOString(),
    };

    localStorage.setItem("labcore_hospital_config", JSON.stringify(hospitalConfig));
    playBeep(1100, "sine", 0.1);
    alert(`Success: ${hospitalName} profile deployed to all reporting templates and invoices!`);
  };

  // Bulk import sample batch
  const handleExecuteBulkBatch = () => {
    setBulkImportProgress(10);
    playBeep(600, "sine", 0.05);

    setTimeout(() => setBulkImportProgress(40), 300);
    setTimeout(() => setBulkImportProgress(75), 600);
    setTimeout(() => {
      // No password is generated here: these rows are a local demo roster and
      // are never created in the staff database, so a generated "credential"
      // would only look like a real one while being stored in plain text.
      const generatedBatch = SAMPLE_BATCH_ROSTER.map((s, idx) => ({
        id: `usr-bulk-${Date.now()}-${idx}`,
        name: s.name,
        fullName: s.name,
        email: s.email,
        phone: s.phone,
        role: s.role,
        employeeCode: s.empCode,
        branchLocation: branch,
        degrees: s.degrees,
        department: s.department,
        shift: "General Shift (09:00 AM - 06:00 PM)",
        isNablSignatory: s.role === "PATHOLOGIST",
        signatureStatus: s.role === "PATHOLOGIST" ? "VERIFIED" : "PENDING_UPLOAD",
        signatureStampId: s.role === "PATHOLOGIST" ? `SHA256:7c9e${Math.random().toString(36).substring(2, 8)}` : undefined,
        twoFactorEnabled: true,
        status: "ACTIVE",
        joinedDate: new Date().toISOString().split("T")[0],
      }));

      const combined = [
        ...generatedBatch,
        ...existingUsers.filter((c) => !generatedBatch.some((g) => g.email === c.email)),
      ];
      persistDirectory(combined);

      setBulkImportProgress(100);
      setBulkImportSuccess(`Successfully imported & provisioned ${generatedBatch.length} clinical staff members into active database!`);
      playBeep(1300, "sine", 0.14);
    }, 1000);
  };

  // Export X.509 Cryptographic Certificate (.PEM)
  const downloadDoctorCertificate = (userToCert: any) => {
    const certText = `-----BEGIN CERTIFICATE-----\n` +
      `MIIDXTCCAkWgAwIBAgIU${Math.random().toString(36).substring(2, 12).toUpperCase()}wDQYJKoZIhvcNAQELBQAw\n` +
      `FzEVMBMGA1UEAwwMTGFiQ29yZSBOQUJMMSAwHgYDVQQKDBdBY3JlZGl0ZWQgUGF0\n` +
      `aG9sb2d5IENBMB4XDTI2MDkyNTAwMDAwMFoXDTI4MDkyNDIzNTk1OVowRjERMA8G\n` +
      `A1UEAwwIRHItUmFqZXNoMRcwFQYDVQQKDA5MYWJDb3JlIEVMSVMgUzEYMBYGA1UE\n` +
      `CwwPQ2xpbmljYWwgU2lnbmVyMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC\n` +
      `AQEAz9dK2o4F8JkQ3L1x8Z\n` +
      `[ISSUED TO: ${userToCert.name}]\n` +
      `[ROLE: ${userToCert.role}]\n` +
      `[MCI REG NO: ${userToCert.medicalRegistrationNo || "MCI-2018-88492"}]\n` +
      `[NABL CERT STAMP: ${userToCert.signatureStampId || signatureHash}]\n` +
      `-----END CERTIFICATE-----`;

    const blob = new Blob([certText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${userToCert.name.replace(/\s+/g, "_")}_NABL_Certificate.pem`;
    a.click();
    URL.revokeObjectURL(url);
    playBeep(1000, "sine", 0.08);
  };

  const copyCredentials = () => {
    if (!successData) return;
    const text = `🏥 LABCORE ELIS - OFFICIAL PERSONNEL CREDENTIALS\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Staff Member    : ${successData.name}\n` +
      `Role Assigned   : ${successData.role} (${ROLE_CONFIGS[successData.role]?.subtitle || ""})\n` +
      `Employee Code   : ${successData.employeeCode}\n` +
      `Assigned Branch : ${successData.branchLocation || "Central Lab"}\n` +
      `Department      : ${successData.department}\n` +
      `Working Shift   : ${successData.shift}\n` +
      `Official Email  : ${successData.email}\n` +
      `Access Password : ${successData.password}\n` +
      `NABL Stamp      : ${successData.isNablSignatory ? `AUTHORIZED (${successData.signatureStampId})` : "NO"}\n` +
      `Security Seal   : AES-256 Hardware Encrypted · Mandatory 2FA\n` +
      `Portal Address  : ${typeof window !== "undefined" ? window.location.origin : ""}/login\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `* CONFIDENTIAL: Hand over directly to the designated employee.`;

    navigator.clipboard?.writeText(text);
    setCopiedKey(true);
    playBeep(1100, "triangle", 0.08);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const persistDirectory = (users: any[], suspended?: string[]) => {
    // Passwords are removed here rather than at each call site so a future
    // edit cannot reintroduce a plaintext credential into localStorage.
    const safeUsers = users.map(stripSecrets);
    localStorage.setItem("labcore_users_directory", JSON.stringify(safeUsers));
    setExistingUsers(safeUsers);
    window.dispatchEvent(new CustomEvent("labcore:users-updated", { detail: safeUsers }));
    if (suspended) {
      localStorage.setItem("labcore_suspended_users", JSON.stringify(suspended));
      setSuspendedUsers(suspended);
    }
  };

  const toggleSuspendUser = async (targetUser: any) => {
    const isSuspended = suspendedUsers.includes(targetUser.email);
    setErrorMsg("");
    try {
      // Suspension must reach the database, or the staff member keeps a
      // working sign-in while the directory claims they are suspended.
      if (isBackendRecord(targetUser.id)) {
        if (isSuspended) {
          await userApi.activate(String(targetUser.id));
        } else {
          await userApi.suspend(String(targetUser.id));
        }
      }
      const nextSuspended = isSuspended
        ? suspendedUsers.filter((e) => e !== targetUser.email)
        : [...suspendedUsers, targetUser.email];
      const nextUsers = existingUsers.map((u) =>
        u.email === targetUser.email ? { ...u, status: isSuspended ? "ACTIVE" : "SUSPENDED" } : u
      );
      persistDirectory(nextUsers, nextSuspended);
      playBeep(isSuspended ? 900 : 350, "sine", 0.08);
    } catch (err: any) {
      setErrorMsg(err.message || "Status change failed. The account was not updated.");
      playBeep(250, "sawtooth", 0.15);
    }
  };

  const handleStartEdit = (targetUser: any) => {
    setEditingUserId(targetUser.id || targetUser.email);
    setEditDraft({
      name: targetUser.name || targetUser.fullName || "",
      email: targetUser.email || "",
      phone: targetUser.phone || "",
      role: targetUser.role || "LAB_TECH",
      department: targetUser.department || "",
      employeeCode: targetUser.employeeCode || "",
      shift: targetUser.shift || "General Shift (09:00 AM - 06:00 PM)",
      branchLocation: targetUser.branchLocation || BRANCH_LOCATIONS[0],
    });
    playBeep(700, "triangle", 0.05);
  };

  const handleSaveEdit = (originalUser: any) => {
    if (!editDraft) return;
    const nextUsers = existingUsers.map((u) =>
      (u.id || u.email) === (originalUser.id || originalUser.email)
        ? {
            ...u,
            name: editDraft.name.trim() || u.name,
            fullName: editDraft.name.trim() || u.fullName,
            email: editDraft.email.toLowerCase().trim() || u.email,
            phone: editDraft.phone.trim(),
            role: editDraft.role,
            department: editDraft.department.trim(),
            employeeCode: editDraft.employeeCode.trim() || u.employeeCode,
            shift: editDraft.shift,
            branchLocation: editDraft.branchLocation,
          }
        : u
    );
    persistDirectory(nextUsers);
    setEditingUserId(null);
    setEditDraft(null);
    playBeep(1100, "sine", 0.1);
  };

  /**
   * Starts the Gmail password-reset flow for a staff member.
   *
   * The previous version generated a password in the browser, sent it to the
   * staff database and kept a copy in localStorage. Now the only action is to
   * ask the server to email a reset link: no password is ever generated,
   * displayed or stored on this machine.
   */
  const handleResetPassword = async (targetUser: any) => {
    setErrorMsg("");

    if (!isBackendRecord(targetUser.id)) {
      setErrorMsg(
        "This is a demo roster entry with no staff-database record, so no reset email can be sent."
      );
      playBeep(250, "sawtooth", 0.15);
      return;
    }

    try {
      await authApi.forgotPassword(targetUser.email);
      setErrorMsg("");
      alert(
        `A password reset link has been sent to ${targetUser.email}.\n\n` +
          `The link expires in 15 minutes and can be used once.`
      );
      playBeep(1200, "triangle", 0.09);
    } catch (err: any) {
      // The server answers identically whether or not the address is known,
      // so a failure here is a transport problem rather than a signal about
      // whether this staff member exists.
      setErrorMsg(err.message || "Could not send the reset email. Please try again.");
      playBeep(250, "sawtooth", 0.15);
    }
  };

  const handleDeleteUser = async (targetUser: any) => {
    const confirmed = window.confirm(
      `Remove ${targetUser.name || targetUser.fullName} (${targetUser.email}) from the staff registry?\n\nThis revokes their portal access credentials.`
    );
    if (!confirmed) return;
    setErrorMsg("");
    try {
      // Deactivate in the database (soft delete) so their sessions end and
      // sign-in is blocked, then drop the local directory entry.
      if (isBackendRecord(targetUser.id)) {
        await userApi.delete(String(targetUser.id));
      }
      const nextUsers = existingUsers.filter((u) => u.email !== targetUser.email);
      const nextSuspended = suspendedUsers.filter((e) => e !== targetUser.email);
      persistDirectory(nextUsers, nextSuspended);
      playBeep(300, "sawtooth", 0.12);
    } catch (err: any) {
      setErrorMsg(err.message || "Deletion failed. The account is still active.");
      playBeep(250, "sawtooth", 0.15);
    }
  };

  const handleCopyUserCreds = (targetUser: any) => {
    // Passwords are not part of this roster any more: they exist only as a hash
    // in the staff database. The staff member resets it themselves from the
    // Gmail password-reset flow.
    const text = `LABCORE ELIS — STAFF ACCESS DETAILS\n` +
      `Name     : ${targetUser.name || targetUser.fullName}\n` +
      `Role     : ${targetUser.role}\n` +
      `Emp Code : ${targetUser.employeeCode || "—"}\n` +
      `Email    : ${targetUser.email}\n` +
      `Portal   : ${window.location.origin}/login\n` +
      `Password : (not shared) — use "Forgot password" on the sign-in page`;
    navigator.clipboard?.writeText(text);
    setCopiedCredsFor(targetUser.email);
    playBeep(1100, "triangle", 0.07);
    setTimeout(() => setCopiedCredsFor(null), 2500);
  };

  // Owner-authority direct login: sign in as the selected staff member with a
  // real backend session. There is no local fallback — a made-up token would
  // only be rejected by the API while looking like a valid workspace session.
  const handleUseLogin = async (userToLogin: any) => {
    if (suspendedUsers.includes(userToLogin.email)) {
      playBeep(250, "sawtooth", 0.15);
      return;
    }

    const displayName =
      userToLogin.name || userToLogin.fullName || userToLogin.email.split("@")[0];
    const lastLoginIso = new Date().toISOString();

    if (!userToLogin.password) {
      if (onAutoFillLogin) {
        onAutoFillLogin(userToLogin.email, "");
        onClose();
        return;
      }
      playBeep(250, "sawtooth", 0.15);
      setErrorMsg("No stored password for this account. Sign in from the login form instead.");
      return;
    }

    setLoginAsUserId(userToLogin.id || userToLogin.email);
    setErrorMsg("");

    let session;
    try {
      session = await authLogin({
        email: userToLogin.email,
        password: userToLogin.password,
      });
    } catch (err) {
      playBeep(250, "sawtooth", 0.15);
      setErrorMsg(err instanceof Error ? err.message : "Sign-in failed.");
      setLoginAsUserId(null);
      return;
    }

    if (!session.accessToken) {
      playBeep(250, "sawtooth", 0.15);
      setErrorMsg("This account requires two-factor verification. Please sign in from the login form.");
      setLoginAsUserId(null);
      return;
    }

    // Stamp last-login on the directory record
    const nextUsers = existingUsers.map((u) =>
      u.email === userToLogin.email ? { ...u, lastLoginAt: lastLoginIso } : u
    );
    persistDirectory(nextUsers);

    playBeep(1400, "sine", 0.12);

    setTimeout(() => {
      if (onDirectLogin) {
        onDirectLogin({
          name: displayName,
          role: userToLogin.role || "Staff",
          lastLogin: lastLoginIso,
        });
      } else {
        window.location.assign("/dashboard");
      }
      onClose();
      setLoginAsUserId(null);
    }, 450);
  };

  // WhatsApp invite sender
  const handleSendWhatsAppInvite = (targetUser: any) => {
    // The password is deliberately omitted: sending a credential over WhatsApp
    // puts it in the recipient's chat history and in the message archive stored
    // by this application. The invite points at the password-reset flow instead.
    const msg = encodeURIComponent(
      `Hello ${targetUser.name},\nYour clinical laboratory account for ${hospitalName} is ready.\n\nRole: ${targetUser.role}\nEmp Code: ${targetUser.employeeCode}\nLogin: ${targetUser.email}\n\nSet your password: ${window.location.origin}/forgot-password\n(A verification code will be emailed to this address.)`
    );
    const cleanPhone = (targetUser.phone || "").replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone || "919876543210"}?text=${msg}`, "_blank");
  };

  // Filtered directory list
  const filteredDirectory = useMemo(() => {
    return existingUsers.filter((u) => {
      const matchSearch =
        u.name?.toLowerCase().includes(directorySearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(directorySearch.toLowerCase()) ||
        u.employeeCode?.toLowerCase().includes(directorySearch.toLowerCase());
      const matchRole = selectedDirectoryRole === "ALL" || u.role === selectedDirectoryRole;
      return matchSearch && matchRole;
    });
  }, [existingUsers, directorySearch, selectedDirectoryRole]);

  // Registry summary stats
  const directoryStats = useMemo(() => {
    const total = existingUsers.length;
    const suspended = existingUsers.filter((u) => suspendedUsers.includes(u.email)).length;
    const twoFA = existingUsers.filter((u) => u.twoFactorEnabled !== false).length;
    const signatories = existingUsers.filter((u) => u.isNablSignatory).length;
    return { total, active: total - suspended, suspended, twoFA, signatories };
  }, [existingUsers, suspendedUsers]);

  if (!isOpen) return null;

  const currentRoleConfig = ROLE_CONFIGS[role] || ROLE_CONFIGS.PATHOLOGIST;
  const RoleIcon = currentRoleConfig.icon;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-black/90 backdrop-blur-2xl animate-fadeIn">
      {/* Expansive Master Command Container */}
      <div
        className="relative w-full max-w-6xl overflow-hidden rounded-[28px] border border-indigo-500/35 bg-[#060a14] text-slate-100 shadow-[0_30px_100px_rgba(0,0,0,0.95),0_0_80px_rgba(99,102,241,0.25)] flex flex-col max-h-[94vh]"
      >
        {/* Ambient Sci-Fi Radial Lighting */}
        <div className="absolute top-0 right-1/4 h-52 w-96 bg-indigo-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute top-10 left-10 h-52 w-96 bg-sky-500/15 blur-[120px] pointer-events-none" />

        {/* =========================================================
            EXECUTIVE COMMAND HEADER
            ========================================================= */}
        <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-5 sm:px-7 py-3.5 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white m-0">
                  LabCore Master Provisioning Suite
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-300 border border-indigo-500/40 shadow-xs">
                  <Sparkles className="h-3 w-3 text-indigo-400" />
                  Owner Authority
                </span>
                <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  AES-256 GCM Live
                </span>
                {isAuthorized && (
                  <span className="hidden lg:inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-500/30">
                    <Clock className="h-3 w-3 text-amber-400" />
                    Session: {fmtSessionTime(sessionSeconds)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 m-0 mt-0.5">
                Hospital onboarding, NABL authorized signatory delegation, analyzer driver linking & workstation security.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={soundEnabled ? "Mute High-Tech Audio" : "Enable Audio Telemetry"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-indigo-400" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {isAuthorized && (
              <button
                type="button"
                onClick={handleLockSession}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Lock Master Session"
              >
                <Lock className="h-3 w-3 text-amber-400" />
                <span>Re-Lock</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Master Modal"
              className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* =========================================================
            STAGE 1: MASTER PASSCODE CHALLENGE
            ========================================================= */}
        {!isAuthorized ? (
          <div className="relative z-10 p-8 sm:p-14 text-center max-w-lg mx-auto my-auto">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500/20 via-sky-500/10 to-transparent border border-indigo-500/40 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
              <KeyRound className="h-10 w-10 text-indigo-400 animate-pulse" />
            </div>

            <h2 className="text-xl font-black text-white mb-2 tracking-tight">
              Software Owner Authentication Required
            </h2>
            <p className="text-xs text-slate-400 mb-7 leading-relaxed">
              This master suite allows provisioning new hospital instances, modifying clinical roles, and issuing authorized NABL digital signatures. Access is strictly reserved for the system provider.
            </p>

            <form onSubmit={handleVerifyPasscode} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400/80" />
                <input
                  type="password"
                  required
                  autoFocus
                  autoComplete="current-password"
                  value={enteredPasscode}
                  onChange={(e) => {
                    setEnteredPasscode(e.target.value);
                    setPasscodeError("");
                  }}
                  placeholder="Enter your administrator password..."
                  className="w-full rounded-2xl border border-indigo-500/40 bg-slate-950/90 pl-11 pr-4 py-3.5 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
                />
              </div>

              {passcodeError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-500/15 border border-rose-500/30 p-3 text-xs text-rose-300 animate-shake">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{passcodeError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={ownerVerifying}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 py-3.5 text-xs font-bold text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 disabled:hover:scale-100"
              >
                {ownerVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying with server...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4" />
                    <span>Verify &amp; Unlock Master Command Center</span>
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                <span>Encrypted Owner Key Protection Enforced</span>
              </div>
            </form>
          </div>
        ) : (
          /* =========================================================
             STAGE 2: FULL ENTERPRISE PROVISIONING WORKSTATION
             ========================================================= */
          <div className="relative z-10 flex flex-col flex-1 overflow-hidden">
            {/* Top Navigation Mode Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/50 px-5 sm:px-7 py-2.5 overflow-x-auto no-scrollbar shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "register"
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Provision Clinical Personnel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("bulk")}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "bulk"
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Bulk CSV Roster</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("simulator")}
                  className={`hidden sm:flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "simulator"
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5 text-sky-400" />
                  <span>Role Sandbox Simulator</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("hospital")}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "hospital"
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Hospital Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("directory")}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "directory"
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Active Staff Registry ({existingUsers.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("license")}
                  className={`hidden lg:flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "license"
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <Award className="h-3.5 w-3.5 text-amber-400" />
                  <span>Enterprise Modules</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("telemetry")}
                  className={`hidden xl:flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "telemetry"
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <Activity className="h-3.5 w-3.5" />
                  <span>Hardware Drivers</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("audit")}
                  className={`hidden xl:flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "audit"
                      ? "bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-md shadow-rose-600/30"
                      : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                  <span>Audit Trail</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("qcmonitor")}
                  className={`hidden xl:flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "qcmonitor"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30"
                      : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <HeartPulse className="h-3.5 w-3.5 text-emerald-400" />
                  <span>QC Monitor</span>
                </button>
              </div>

              {/* Quick Template Preset Selector */}
              {activeTab === "register" && !successData && (
                <div className="hidden lg:flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 text-[11px] font-mono">Quick Preset:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("PATHOLOGIST")}
                    className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-[10px] text-emerald-400 hover:border-emerald-500/50 cursor-pointer"
                  >
                    MD Pathologist
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("LAB_TECH")}
                    className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-[10px] text-sky-400 hover:border-sky-500/50 cursor-pointer"
                  >
                    Lab Tech
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("FRONT_DESK")}
                    className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-[10px] text-amber-400 hover:border-amber-500/50 cursor-pointer"
                  >
                    Front Desk
                  </button>
                </div>
              )}
            </div>

            {/* Modal Body Scrollable Area */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {/* ===================================================
                  TAB 1: USER & ROLE PROVISIONING WORKBENCH
                  =================================================== */}
              {activeTab === "register" && (
                <div>
                  {successData ? (
                    /* -----------------------------------------------
                       SUCCESS HANDOVER CERTIFICATE SLIP
                       ----------------------------------------------- */
                    <div className="max-w-2xl mx-auto rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/10 via-[#0c161d] to-[#070e14] p-6 sm:p-8 text-center animate-fadeIn shadow-2xl">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/30">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>

                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-mono font-black uppercase tracking-wider text-emerald-300 border border-emerald-500/40">
                        NABL ISO 15189 Registered
                      </span>

                      <h2 className="text-xl sm:text-2xl font-black text-white mt-2 mb-1">
                        Personnel Credentials Provisioned
                      </h2>
                      <p className="text-xs text-slate-300 mb-6 max-w-md mx-auto">
                        Official laboratory account has been issued and linked to security credentials. Ready for immediate deployment.
                      </p>

                      {/* Official Handover Card */}
                      <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/90 p-5 text-left font-mono text-xs shadow-inner mb-6 space-y-2.5">
                        <div className="absolute top-3 right-3 opacity-15">
                          <QrCode className="h-16 w-16 text-white" />
                        </div>

                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <span className="text-slate-400 text-[11px]">Staff Name:</span>
                          <span className="text-white font-bold text-sm font-sans">{successData.name}</span>
                        </div>

                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <span className="text-slate-400 text-[11px]">System Role:</span>
                          <span className="text-indigo-300 font-bold">{successData.role}</span>
                        </div>

                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <span className="text-slate-400 text-[11px]">Employee ID:</span>
                          <span className="text-sky-300 font-bold">{successData.employeeCode}</span>
                        </div>

                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <span className="text-slate-400 text-[11px]">Branch:</span>
                          <span className="text-slate-200">{successData.branchLocation}</span>
                        </div>

                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <span className="text-slate-400 text-[11px]">Department:</span>
                          <span className="text-slate-200">{successData.department}</span>
                        </div>

                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <span className="text-slate-400 text-[11px]">Official Email:</span>
                          <span className="text-amber-300">{successData.email}</span>
                        </div>

                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <span className="text-slate-400 text-[11px]">Access Password:</span>
                          <span className="text-emerald-300 font-bold">{successData.password}</span>
                        </div>

                        {successData.isNablSignatory && (
                          <div className="flex justify-between items-center pt-1 text-[10px] text-emerald-400">
                            <span>Digital Signature Stamp:</span>
                            <span className="font-mono">{successData.signatureStampId}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={copyCredentials}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-all cursor-pointer shadow-sm"
                        >
                          {copiedKey ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-indigo-400" />}
                          <span>{copiedKey ? "Handover Pack Copied!" : "Copy Handover Slip"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppInvite(successData)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600/30 border border-emerald-500/50 px-4 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer shadow-sm"
                        >
                          <MessageSquare className="h-4 w-4 text-emerald-400" />
                          <span>Dispatch WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadDoctorCertificate(successData)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
                        >
                          <Download className="h-4 w-4 text-amber-400" />
                          <span>Export .PEM Cert</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPrintableLetterUser(successData)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600/30 border border-indigo-500/50 px-4 py-2.5 text-xs font-bold text-indigo-200 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer shadow-sm"
                        >
                          <Printer className="h-4 w-4 text-indigo-400" />
                          <span>Print Appointment Letter</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUseLogin(successData)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                        >
                          <ArrowRight className="h-4 w-4" />
                          <span>Direct Login as this User</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSuccessData(null);
                            generateNewCredentials();
                          }}
                          className="inline-flex items-center justify-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 px-3 py-2 cursor-pointer font-semibold"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Provision Another Staff</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* -----------------------------------------------
                       PROVISIONING DUAL-PANEL WORKBENCH
                       ----------------------------------------------- */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* LEFT 4-COL: LIVE CLINICAL BADGE & REAL-WORLD STAMP */}
                      <div className="lg:col-span-4 space-y-4">
                        {/* Live Smart Badge Card Preview */}
                        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-[#0d1322] to-[#090d19] p-5 shadow-2xl">
                          <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${currentRoleConfig.gradient}`} />
                          
                          {/* Badge Header */}
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                              <Fingerprint className="h-4 w-4 text-indigo-400" />
                              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                                Smart Access ID
                              </span>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[9px] font-mono text-emerald-400 border border-emerald-500/20">
                              Active RFID
                            </span>
                          </div>

                          {/* Profile Graphic & Details */}
                          <div className="flex items-center gap-3.5 mb-4">
                            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${currentRoleConfig.gradient} text-white shadow-lg shadow-indigo-500/20 font-bold text-lg ring-1 ring-white/20`}>
                              {fullName ? fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "LC"}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-white truncate m-0">
                                {fullName || "Staff Member"}
                              </h3>
                              <p className="text-[11px] text-slate-400 truncate m-0 mt-0.5">
                                {degrees || "Clinical Officer"}
                              </p>
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${currentRoleConfig.badge}`}>
                                  <RoleIcon className="h-3 w-3" />
                                  {role}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Telemetry rows */}
                          <div className="space-y-2 rounded-xl bg-slate-950/70 p-3 text-[11px] font-mono border border-slate-800/80">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Employee ID:</span>
                              <span className="text-sky-300 font-bold">{employeeCode}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Branch Station:</span>
                              <span className="text-slate-300 truncate max-w-[170px]">{branch.split("(")[0]}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Department:</span>
                              <span className="text-slate-300 truncate max-w-[170px]">{department}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Shift SLA:</span>
                              <span className="text-slate-300 truncate max-w-[170px]">{shift.split("(")[0]}</span>
                            </div>
                            {isNablSignatory && (
                              <div className="flex justify-between pt-1 border-t border-slate-800 text-emerald-400">
                                <span>NABL Stamp:</span>
                                <span>AUTHORIZED</span>
                              </div>
                            )}
                          </div>

                          {/* Barcode Strip Graphic */}
                          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-slate-500 text-[10px]">
                            <div className="flex items-center gap-1 font-mono tracking-widest text-[9px]">
                              <span>|||||||| | ||||| ||||||| |</span>
                            </div>
                            <span className="font-mono text-[9px]">{employeeCode}</span>
                          </div>
                        </div>

                        {/* Interactive Digital Signature Drawing Pad & Stamp Preview */}
                        {isNablSignatory && (
                          <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900/60 to-slate-950 p-4 shadow-xl relative overflow-hidden">
                            <div className="flex items-center justify-between mb-3 border-b border-emerald-500/20 pb-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                                <PenTool className="h-4 w-4 text-emerald-400" />
                                <span>Doctor e-Signature & Stamp Pad</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={clearSignatureCanvas}
                                  className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer font-mono"
                                  title="Clear Signature Canvas"
                                >
                                  <Eraser className="h-2.5 w-2.5" /> Clear
                                </button>
                                <button
                                  type="button"
                                  onClick={regenerateSignatureHash}
                                  className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-mono"
                                >
                                  <RefreshCw className="h-2.5 w-2.5" /> Re-Hash
                                </button>
                              </div>
                            </div>

                            {/* Interactive Touch/Mouse Canvas */}
                            <div className="rounded-2xl border-2 border-dashed border-emerald-500/40 bg-slate-950 p-2.5 text-center relative select-none">
                              <p className="text-[9px] text-slate-400 font-mono mb-1">
                                Draw specimen signature below (Mouse / Touch / Stylus):
                              </p>
                              <canvas
                                ref={canvasRef}
                                onPointerDown={handleSignaturePointerDown}
                                onPointerMove={handleSignaturePointerMove}
                                onPointerUp={handleSignaturePointerUp}
                                onPointerCancel={handleSignaturePointerUp}
                                className="w-full h-[70px] bg-slate-900/90 rounded-xl cursor-crosshair touch-none border border-slate-800 select-none"
                              />

                              <div className="text-[10px] font-black text-emerald-300 tracking-wider uppercase font-sans mt-2">
                                {fullName}
                              </div>
                              <div className="text-[8px] text-emerald-400/90 font-mono">
                                {degrees} · {medicalRegNo}
                              </div>
                              <div className="text-[8px] text-emerald-400/70 font-mono truncate mt-0.5 border-t border-emerald-500/20 pt-1">
                                SHA-256 SEAL: {signatureHash}
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 text-center m-0 mt-2">
                              Embeds onto PDF lab reports & ABHA health record locker.
                            </p>
                          </div>
                        )}

                        {/* Real-world Capabilities granted to this role */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                          <h4 className="text-xs font-bold text-slate-200 mb-2.5 flex items-center gap-1.5">
                            <CheckSquare className="h-3.5 w-3.5 text-indigo-400" />
                            <span>Role Capability Matrix</span>
                          </h4>
                          <ul className="space-y-1.5 text-[11px] text-slate-300 m-0 p-0 list-none">
                            {currentRoleConfig.capabilities.map((cap, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span className="leading-tight">{cap}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* RIGHT 8-COL: PROVISIONING FORM */}
                      <div className="lg:col-span-8">
                        <form onSubmit={handleRegisterUser} className="space-y-5">
                          {errorMsg && (
                            <div className="flex items-center gap-2 rounded-2xl bg-rose-500/15 border border-rose-500/30 p-3.5 text-xs text-rose-300">
                              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                              <span>{errorMsg}</span>
                            </div>
                          )}

                          {/* Step 1: Role Selection Cards */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white font-bold">1</span>
                                <span>Assign Operational Clinical Role *</span>
                              </label>
                              <span className="text-[11px] text-indigo-400 font-mono">6 Enterprise Roles Configured</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                              {Object.entries(ROLE_CONFIGS).map(([k, r]) => {
                                const Icon = r.icon;
                                const isSelected = role === k;
                                return (
                                  <div
                                    key={k}
                                    onClick={() => {
                                      setRole(k);
                                      if (k === "PATHOLOGIST") {
                                        setIsNablSignatory(true);
                                        setCanApproveCritical(true);
                                        setDepartment("Pathology & Molecular Diagnostics");
                                        setSelectedAnalyzers(["sysmex", "cobas", "quant"]);
                                      } else if (k === "LAB_TECH") {
                                        setIsNablSignatory(false);
                                        setCanApproveCritical(false);
                                        setDepartment("Hematology & Clinical Pathology");
                                        setSelectedAnalyzers(["sysmex", "cobas", "biorad"]);
                                      } else if (k === "FRONT_DESK") {
                                        setIsNablSignatory(false);
                                        setCanApproveCritical(false);
                                        setDepartment("Front Desk, Cash Counter & Billing");
                                        setSelectedAnalyzers([]);
                                      }
                                    }}
                                    className={`rounded-2xl border p-3 cursor-pointer transition-all ${
                                      isSelected
                                        ? "border-indigo-500 bg-indigo-500/15 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500/40"
                                        : "border-slate-800 bg-slate-950/60 hover:bg-slate-900 hover:border-slate-700"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <Icon className={`h-4 w-4 ${isSelected ? "text-indigo-400" : "text-slate-400"}`} />
                                        <span className="text-xs font-bold text-white">{k}</span>
                                      </div>
                                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />}
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-tight m-0">{r.subtitle}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Step 2: Personal Identity & Employee ID */}
                          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-3.5">
                            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white font-bold">2</span>
                              <span>Personnel Identity & Employee Code</span>
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                  Full Name & Title *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={fullName}
                                  onChange={(e) => setFullName(e.target.value)}
                                  placeholder="e.g. Dr. Rajesh K. Sharma"
                                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[11px] font-semibold text-slate-300">
                                    Employee ID Code *
                                  </label>
                                  <button
                                    type="button"
                                    onClick={generateNewCredentials}
                                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                                  >
                                    <RefreshCw className="h-2.5 w-2.5" /> Auto-Generate
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  required
                                  value={employeeCode}
                                  onChange={(e) => setEmployeeCode(e.target.value)}
                                  placeholder="e.g. EMP-LC-109"
                                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-mono text-sky-300 focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                  Official Login Email *
                                </label>
                                <input
                                  type="email"
                                  required
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="staff@labcore.com"
                                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                  Mobile Phone Number
                                </label>
                                <input
                                  type="text"
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  placeholder="+91 98765 43210"
                                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[11px] font-semibold text-slate-300">
                                    Login Password *
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => setPassword(`Lab#${Math.floor(100000 + Math.random() * 900000)}`)}
                                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Sparkles className="h-2.5 w-2.5" /> Random
                                  </button>
                                </div>
                                <div className="relative">
                                  <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-mono text-emerald-300 focus:border-indigo-500 focus:outline-none pr-9"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                  >
                                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Step 3: Branch, Department, Shift & Qualifications */}
                          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-3.5">
                            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white font-bold">3</span>
                              <span>Facility Branch & Department Assignment</span>
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                  Primary Branch Station
                                </label>
                                <select
                                  value={branch}
                                  onChange={(e) => setBranch(e.target.value)}
                                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                                >
                                  {BRANCH_LOCATIONS.map((b) => (
                                    <option key={b} value={b}>
                                      {b}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                  Clinical Wing / Department
                                </label>
                                <select
                                  value={department}
                                  onChange={(e) => setDepartment(e.target.value)}
                                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                                >
                                  {DEPARTMENTS.map((d) => (
                                    <option key={d} value={d}>
                                      {d}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                  Working Shift & TAT Policy
                                </label>
                                <select
                                  value={shift}
                                  onChange={(e) => setShift(e.target.value)}
                                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                                >
                                  {SHIFTS.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Medical Council Reg Details for Pathologists/Doctors */}
                            {(role === "PATHOLOGIST" || role === "DOCTOR") && (
                              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-3">
                                <div className="flex items-center gap-2">
                                  <Stethoscope className="h-4 w-4 text-emerald-400" />
                                  <span className="text-xs font-bold text-emerald-300">
                                    Clinician & Medical Registration Authority
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-semibold text-emerald-200 mb-1">
                                      Registration No. (MCI / SMC) *
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={medicalRegNo}
                                      onChange={(e) => setMedicalRegNo(e.target.value)}
                                      placeholder="e.g. MCI-2018-88492"
                                      className="w-full rounded-xl border border-emerald-500/40 bg-slate-950 px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-semibold text-emerald-200 mb-1">
                                      State Medical Council
                                    </label>
                                    <select
                                      value={medicalCouncil}
                                      onChange={(e) => setMedicalCouncil(e.target.value)}
                                      className="w-full rounded-xl border border-emerald-500/40 bg-slate-950 px-3 py-2 text-xs text-emerald-200 focus:outline-none"
                                    >
                                      {MEDICAL_COUNCILS.map((c) => (
                                        <option key={c} value={c}>
                                          {c}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-semibold text-emerald-200 mb-1">
                                      Degrees & Fellowships
                                    </label>
                                    <input
                                      type="text"
                                      value={degrees}
                                      onChange={(e) => setDegrees(e.target.value)}
                                      placeholder="e.g. MD (Pathology), DCP"
                                      className="w-full rounded-xl border border-emerald-500/40 bg-slate-950 px-3 py-2 text-xs text-emerald-200 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Analyzer Workstation Privileges */}
                            {(role === "LAB_TECH" || role === "PATHOLOGIST" || role === "ADMIN") && (
                              <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3.5">
                                <label className="block text-xs font-bold text-sky-300 mb-2 flex items-center gap-1.5">
                                  <Cpu className="h-3.5 w-3.5 text-sky-400" />
                                  <span>Authorized Analyzer Workstations (Direct Driver Access)</span>
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {ANALYZER_WORKSTATIONS.map((analyzer) => {
                                    const checked = selectedAnalyzers.includes(analyzer.id);
                                    return (
                                      <div
                                        key={analyzer.id}
                                        onClick={() => toggleAnalyzer(analyzer.id)}
                                        className={`rounded-xl border p-2 cursor-pointer transition-all ${
                                          checked
                                            ? "border-sky-500 bg-sky-500/20 text-white"
                                            : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="text-[11px] font-bold">{analyzer.name}</span>
                                          {checked && <Check className="h-3 w-3 text-sky-400" />}
                                        </div>
                                        <span className="text-[9px] text-slate-500 block">{analyzer.type}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Step 4: Governance, Signatory Stamps, 2FA & Zero-Trust Subnet */}
                          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-3">
                            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white font-bold">4</span>
                              <span>Zero-Trust Security & Digital Signatory Governance</span>
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950/70 p-3 cursor-pointer hover:border-slate-700">
                                <input
                                  type="checkbox"
                                  checked={isNablSignatory}
                                  onChange={(e) => setIsNablSignatory(e.target.checked)}
                                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-900 border-slate-700"
                                />
                                <div>
                                  <span className="text-xs font-bold text-white block">
                                    NABL Digital Signature Authority
                                  </span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    Empowers user to stamp diagnostic patient reports with cryptographic SHA-256 seal.
                                  </span>
                                </div>
                              </label>

                              <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950/70 p-3 cursor-pointer hover:border-slate-700">
                                <input
                                  type="checkbox"
                                  checked={twoFactorEnabled}
                                  onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-900 border-slate-700"
                                />
                                <div>
                                  <span className="text-xs font-bold text-white block">
                                    Mandatory Two-Factor Authentication (2FA)
                                  </span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    Enforces biometric or TOTP passkey authentication on first workstation login.
                                  </span>
                                </div>
                              </label>

                              <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950/70 p-3 cursor-pointer hover:border-slate-700">
                                <input
                                  type="checkbox"
                                  checked={restrictToSubnet}
                                  onChange={(e) => setRestrictToSubnet(e.target.checked)}
                                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-900 border-slate-700"
                                />
                                <div>
                                  <span className="text-xs font-bold text-white block">
                                    Lab Subnet / LAN IP Lock (192.168.1.0/24)
                                  </span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    Restricts access strictly within the physical laboratory campus network.
                                  </span>
                                </div>
                              </label>

                              <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950/70 p-3 cursor-pointer hover:border-slate-700">
                                <input
                                  type="checkbox"
                                  checked={allowTeleReporting}
                                  onChange={(e) => setAllowTeleReporting(e.target.checked)}
                                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-900 border-slate-700"
                                />
                                <div>
                                  <span className="text-xs font-bold text-white block">
                                    Tele-Reporting & Remote Sign-off
                                  </span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    Allows verified senior clinician to approve panic values via secure tablet/VPN.
                                  </span>
                                </div>
                              </label>
                            </div>
                          </div>

                          {/* Submit Button */}
                          <div className="pt-2">
                            <button
                              type="submit"
                              disabled={loading}
                              className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 py-3.5 text-xs font-bold text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                            >
                              {loading ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  <span>Authorizing & Generating Cryptographic Keys...</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="h-4 w-4" />
                                  <span>Issue Credentials & Authorize Personnel Account</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ===================================================
                  TAB 2: BULK ROSTER CSV / EXCEL BATCH IMPORTER
                  =================================================== */}
              {activeTab === "bulk" && (
                <div className="max-w-4xl mx-auto space-y-5">
                  <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-slate-900/80 to-teal-500/10 p-5">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 font-black">
                        <FileSpreadsheet className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white m-0">
                          Bulk Hospital Personnel Roster Importer
                        </h3>
                        <p className="text-xs text-slate-400 m-0 mt-0.5">
                          Onboard entire clinical shifts, pathologist panels, technicians, and front desk personnel in one automated batch.
                        </p>
                      </div>
                    </div>
                  </div>

                  {bulkImportSuccess && (
                    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-4 flex items-center gap-3 text-xs text-emerald-300">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                      <span>{bulkImportSuccess}</span>
                    </div>
                  )}

                  {/* Batch Preview Table */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
                      <div className="text-xs font-bold text-slate-200">
                        Pre-Configured Shift Roster Batch ({SAMPLE_BATCH_ROSTER.length} Personnel)
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">Ready to Commit</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900/80 text-[10px] text-slate-400 uppercase font-mono">
                          <tr>
                            <th className="py-2 px-3">Name</th>
                            <th className="py-2 px-3">Role</th>
                            <th className="py-2 px-3">Department</th>
                            <th className="py-2 px-3">Official Email</th>
                            <th className="py-2 px-3">Emp Code</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 text-[11px] font-mono">
                          {SAMPLE_BATCH_ROSTER.map((s, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/50">
                              <td className="py-2.5 px-3 font-sans font-bold text-white">{s.name}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${ROLE_CONFIGS[s.role]?.badge || "text-slate-300"}`}>
                                  {s.role}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-400">{s.department}</td>
                              <td className="py-2.5 px-3 text-amber-300">{s.email}</td>
                              <td className="py-2.5 px-3 text-sky-300">{s.empCode}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Progress Bar */}
                    {bulkImportProgress !== null && (
                      <div className="mt-4 pt-3 border-t border-slate-800">
                        <div className="flex justify-between text-[11px] font-mono mb-1 text-slate-400">
                          <span>Batch Encryption & Database Sync...</span>
                          <span className="text-emerald-400 font-bold">{bulkImportProgress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                            style={{ width: `${bulkImportProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={handleExecuteBulkBatch}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:scale-[1.01] transition-all cursor-pointer"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Execute Batch Import ({SAMPLE_BATCH_ROSTER.length} Personnel)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================================================
                  TAB 3: ROLE SANDBOX WORKSTATION SIMULATOR
                  =================================================== */}
              {activeTab === "simulator" && (
                <div className="max-w-4xl mx-auto space-y-4">
                  <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 via-slate-900/80 to-indigo-500/10 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Monitor className="h-5 w-5 text-sky-400" />
                        <div>
                          <h4 className="text-xs font-bold text-white m-0">Live Role Workstation UX Simulator</h4>
                          <p className="text-[11px] text-slate-400 m-0">
                            Test-drive what each provisioned user experiences on their screen before handing over credentials.
                          </p>
                        </div>
                      </div>

                      {/* Role Switcher */}
                      <div className="flex items-center gap-1.5">
                        {["PATHOLOGIST", "LAB_TECH", "FRONT_DESK"].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              setSimulatedRole(r);
                              playBeep(850, "sine", 0.05);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              simulatedRole === r
                                ? "bg-sky-500 text-white shadow-sm"
                                : "bg-slate-900 text-slate-400 hover:text-white"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Simulated Viewport Box */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4 text-xs font-mono text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-white font-bold">Simulated Terminal A1: {simulatedRole}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Target Resolution: 1920x1080 (Responsive)</span>
                    </div>

                    {simulatedRole === "PATHOLOGIST" && (
                      <div className="space-y-3 font-sans">
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex justify-between items-center">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                            <BadgeAlert className="h-4 w-4 text-rose-400" />
                            <span>1 Panic Critical Value Pending Sign-Off</span>
                          </div>
                          <span className="rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 border border-rose-500/30">
                            Serratia Marcescens Blood Culture
                          </span>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs space-y-1">
                          <div className="flex justify-between font-bold text-white">
                            <span>Patient: Sunita R. Patel (UHID: LC-9841)</span>
                            <span className="text-emerald-400">NABL Signature Ready</span>
                          </div>
                          <p className="text-slate-400 text-[11px] m-0">Hb: 7.2 g/dL (L) · Platelets: 42,000 /mcL (Critical Panic)</p>
                        </div>
                      </div>
                    )}

                    {simulatedRole === "LAB_TECH" && (
                      <div className="space-y-3 font-sans">
                        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2 text-sky-300 font-bold">
                            <Activity className="h-4 w-4 text-sky-400" />
                            <span>STAT Emergency Specimen Rack #4</span>
                          </div>
                          <span className="text-amber-400 font-mono text-[10px] font-bold">TAT: 14m 20s remaining</span>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs flex justify-between items-center font-mono">
                          <span>Tube Barcode: LC8891042</span>
                          <span className="text-emerald-400">Sysmex XN-1000 Synced</span>
                        </div>
                      </div>
                    )}

                    {simulatedRole === "FRONT_DESK" && (
                      <div className="space-y-3 font-sans">
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2 text-amber-300 font-bold">
                            <Laptop className="h-4 w-4 text-amber-400" />
                            <span>POS Fast Billing Counter #1</span>
                          </div>
                          <span className="text-emerald-400 font-mono text-[10px]">ABHA Scan & Share Active</span>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs flex justify-between items-center font-mono">
                          <span>Day Book Cash Balance: ₹42,850</span>
                          <span className="text-sky-300">GST Invoice Ready</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===================================================
                  TAB 4: HOSPITAL & MULTI-BRANCH CONFIGURATION
                  =================================================== */}
              {activeTab === "hospital" && (
                <form onSubmit={handleSaveHospitalSettings} className="max-w-4xl mx-auto space-y-5">
                  <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-slate-900/60 to-sky-500/10 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white m-0">
                          Hospital & Diagnostic Institute Multi-Branch Onboarding
                        </h3>
                        <p className="text-xs text-slate-400 m-0 mt-0.5">
                          Configure institutional credentials that automatically appear on all patient diagnostic reports, barcodes, invoices, and letterheads.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Hospital / Laboratory Center Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={hospitalName}
                        onChange={(e) => setHospitalName(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Primary Facility / Branch Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={hospitalCode}
                        onChange={(e) => setHospitalCode(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-mono text-sky-300 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        NABL ISO 15189 License No
                      </label>
                      <input
                        type="text"
                        value={nablCode}
                        onChange={(e) => setNablCode(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-mono text-emerald-300 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        NABH Hospital Accreditation ID
                      </label>
                      <input
                        type="text"
                        value={nabhCode}
                        onChange={(e) => setNabhCode(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-mono text-indigo-300 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        GSTIN / Tax Registration No
                      </label>
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-mono text-amber-300 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Medical Director / Lab Head
                      </label>
                      <input
                        type="text"
                        value={directorName}
                        onChange={(e) => setDirectorName(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Emergency Contact Phone
                      </label>
                      <input
                        type="text"
                        value={hospitalPhone}
                        onChange={(e) => setHospitalPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Official Inquiry Email
                      </label>
                      <input
                        type="email"
                        value={hospitalEmail}
                        onChange={(e) => setHospitalEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Hospital Type
                      </label>
                      <select
                        value={hospitalType}
                        onChange={(e) => setHospitalType(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="Multi-Speciality Hospital">Multi-Speciality Hospital</option>
                        <option value="Diagnostic Center">Diagnostic Center</option>
                        <option value="Pathology Laboratory">Pathology Laboratory</option>
                        <option value="Research Institute">Research Institute</option>
                        <option value="Medical College Hospital">Medical College Hospital</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Bed Capacity
                      </label>
                      <input
                        type="number"
                        value={bedCapacity}
                        onChange={(e) => setBedCapacity(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Emergency Helpline (24/7)
                      </label>
                      <input
                        type="tel"
                        value={emergencyHelpline}
                        onChange={(e) => setEmergencyHelpline(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Website URL
                      </label>
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Facility Full Address (Printed on Diagnostic Reports)
                    </label>
                    <textarea
                      rows={2}
                      value={hospitalAddress}
                      onChange={(e) => setHospitalAddress(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                    >
                      Save & Deploy Institutional Header Profile
                    </button>
                  </div>
                </form>
              )}

              {/* ===================================================
                  TAB 5: LIVE STAFF REGISTRY & APPOINTMENT LETTER
                  =================================================== */}
              {activeTab === "directory" && (
                <div className="space-y-4">
                  {/* Search and Role Filter Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                    <div className="relative w-full sm:w-72">
                      <input
                        type="text"
                        value={directorySearch}
                        onChange={(e) => setDirectorySearch(e.target.value)}
                        placeholder="Search personnel by name, email, ID..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-3.5 pr-8 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                      {directorySearch && (
                        <button
                          type="button"
                          onClick={() => setDirectorySearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
                      <button
                        type="button"
                        onClick={() => setSelectedDirectoryRole("ALL")}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                          selectedDirectoryRole === "ALL"
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-950 text-slate-400 hover:text-white"
                        }`}
                      >
                        All ({existingUsers.length})
                      </button>

                      {Object.keys(ROLE_CONFIGS).map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setSelectedDirectoryRole(k)}
                          className={`rounded-lg px-2 py-1 text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                            selectedDirectoryRole === k
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-950 text-slate-400 hover:text-white"
                          }`}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Registry Summary Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { label: "Total Staff", value: directoryStats.total, icon: Users, tone: "text-indigo-300 border-indigo-500/30 bg-indigo-500/10" },
                      { label: "Active", value: directoryStats.active, icon: CheckCircle2, tone: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" },
                      { label: "Suspended", value: directoryStats.suspended, icon: AlertTriangle, tone: "text-rose-300 border-rose-500/30 bg-rose-500/10" },
                      { label: "2FA Enrolled", value: directoryStats.twoFA, icon: Smartphone, tone: "text-sky-300 border-sky-500/30 bg-sky-500/10" },
                      { label: "NABL Signatories", value: directoryStats.signatories, icon: Award, tone: "text-amber-300 border-amber-500/30 bg-amber-500/10" },
                    ].map((chip) => (
                      <div key={chip.label} className={`rounded-xl border px-3 py-2 flex items-center gap-2 ${chip.tone}`}>
                        <chip.icon className="h-3.5 w-3.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-black font-mono leading-none">{chip.value}</div>
                          <div className="text-[9px] uppercase tracking-wider opacity-70 mt-0.5 truncate">{chip.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Personnel Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredDirectory.length === 0 ? (
                      <div className="col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
                        <Users className="mx-auto h-10 w-10 text-slate-600 mb-2" />
                        <p className="text-xs font-semibold">No personnel records found matching filters.</p>
                      </div>
                    ) : (
                      filteredDirectory.map((u, idx) => {
                        const rConfig = ROLE_CONFIGS[u.role] || ROLE_CONFIGS.PATHOLOGIST;
                        const RIcon = rConfig.icon;
                        const cardKey = u.id || u.email || idx;
                        const isEditing = editingUserId === (u.id || u.email);
                        const isSuspended = suspendedUsers.includes(u.email);
                        const isLoggingIn = loginAsUserId === (u.id || u.email);

                        if (isEditing && editDraft) {
                          return (
                            <div
                              key={cardKey}
                              className="rounded-2xl border border-indigo-500/50 bg-slate-950/90 p-4 shadow-[0_0_24px_rgba(99,102,241,0.15)] flex flex-col gap-2.5"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Pencil className="h-3.5 w-3.5 text-indigo-400" />
                                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest">Edit Personnel Record</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={editDraft.name}
                                  onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                                  placeholder="Full Name"
                                  className="col-span-2 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                />
                                <input
                                  type="email"
                                  value={editDraft.email}
                                  onChange={(e) => setEditDraft({ ...editDraft, email: e.target.value })}
                                  placeholder="Email"
                                  className="col-span-2 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={editDraft.phone}
                                  onChange={(e) => setEditDraft({ ...editDraft, phone: e.target.value })}
                                  placeholder="Phone"
                                  className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={editDraft.employeeCode}
                                  onChange={(e) => setEditDraft({ ...editDraft, employeeCode: e.target.value })}
                                  placeholder="Employee Code"
                                  className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                />
                                <select
                                  value={editDraft.role}
                                  onChange={(e) => setEditDraft({ ...editDraft, role: e.target.value })}
                                  className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                >
                                  {Object.keys(ROLE_CONFIGS).map((k) => (
                                    <option key={k} value={k}>{k}</option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  value={editDraft.department}
                                  onChange={(e) => setEditDraft({ ...editDraft, department: e.target.value })}
                                  placeholder="Department"
                                  className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={editDraft.shift}
                                  onChange={(e) => setEditDraft({ ...editDraft, shift: e.target.value })}
                                  placeholder="Shift"
                                  className="col-span-2 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(u)}
                                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all cursor-pointer"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Save Changes</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setEditingUserId(null); setEditDraft(null); }}
                                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Cancel</span>
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={cardKey}
                            className={`rounded-2xl border bg-slate-950/70 p-4 transition-all flex flex-col justify-between shadow-sm ${
                              isSuspended
                                ? "border-rose-900/60 opacity-80 hover:border-rose-700"
                                : "border-slate-800/90 hover:border-slate-700"
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2.5">
                                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${rConfig.gradient} text-white font-bold text-xs`}>
                                    <RIcon className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs font-bold text-white m-0">
                                        {u.name || u.fullName}
                                      </h4>
                                      {u.isNablSignatory && (
                                        <span title="NABL Authorized Signatory">
                                          <Award className="h-3 w-3 text-amber-400" />
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 block font-mono">
                                      {u.employeeCode || `EMP-LC-${idx + 101}`}
                                    </span>
                                  </div>
                                </div>

                                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${rConfig.badge}`}>
                                  {u.role}
                                </span>
                              </div>

                              <div className="space-y-1 my-3 text-[11px] text-slate-400 font-mono">
                                <div className="flex items-center gap-1.5 truncate">
                                  <Mail className="h-3 w-3 text-slate-500 shrink-0" />
                                  <span className="text-slate-300 truncate">{u.email}</span>
                                </div>
                                <div className="flex items-center gap-1.5 truncate">
                                  <Phone className="h-3 w-3 text-slate-500 shrink-0" />
                                  <span className="text-slate-400 truncate">{u.phone || "+91 —"}</span>
                                </div>
                                <div className="flex items-center gap-1.5 truncate">
                                  <Activity className="h-3 w-3 text-slate-500 shrink-0" />
                                  <span className="text-slate-400 truncate">{u.department}</span>
                                </div>
                                <div className="flex items-center gap-1.5 truncate">
                                  <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                                  <span className="text-slate-400 truncate">{u.branchLocation || "Central Lab"}</span>
                                </div>
                                <div className="flex items-center gap-1.5 truncate">
                                  <Clock className="h-3 w-3 text-slate-500 shrink-0" />
                                  <span className="text-slate-400 truncate">{u.shift || "General Shift"}</span>
                                </div>
                                <div className="flex items-center gap-1.5 truncate">
                                  <CalendarDays className="h-3 w-3 text-slate-500 shrink-0" />
                                  <span className="text-slate-500 truncate">
                                    Joined {u.joinedDate || "—"}
                                    {u.lastLoginAt ? ` · Last login ${new Date(u.lastLoginAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}
                                  </span>
                                </div>
                              </div>

                              {/* Credential status row */}
                              <div className="mb-3 rounded-xl border border-slate-800/80 bg-slate-900/50 px-2.5 py-1.5 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0 font-mono text-[10px]">
                                  <KeyRound className="h-3 w-3 text-amber-400/80 shrink-0" />
                                  <span className="text-slate-500 truncate">
                                    Password stored as a hash — never displayed
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleResetPassword(u)}
                                    className="p-1 rounded-lg text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 transition-all cursor-pointer"
                                    title="Send a password reset link to this user's Gmail"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyUserCreds(u)}
                                    className="p-1 rounded-lg text-indigo-400/80 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all cursor-pointer"
                                    title="Copy Credentials"
                                  >
                                    {copiedCredsFor === u.email ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex flex-col gap-1">
                                <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                                  isSuspended ? "text-rose-400" : "text-emerald-400"
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                                    isSuspended ? "bg-rose-400" : "bg-emerald-400"
                                  }`} />
                                  {isSuspended ? "Suspended" : "Active"}
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                                  <Smartphone className="h-2.5 w-2.5 text-indigo-400" />
                                  {u.twoFactorEnabled !== false ? "2FA Enrolled" : "2FA Pending"}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleSendWhatsAppInvite(u)}
                                  className="p-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:text-white hover:bg-emerald-600 transition-all cursor-pointer"
                                  title="Dispatch WhatsApp Credential Invite"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setPrintableLetterUser(u)}
                                  className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                                  title="Print Official Appointment & Credentials Letter"
                                >
                                  <Printer className="h-3.5 w-3.5 text-indigo-400" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(u)}
                                  className="p-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:text-white hover:bg-sky-600 transition-all cursor-pointer"
                                  title="Edit Personnel Record"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleSuspendUser(u)}
                                  className={`inline-flex items-center gap-1 rounded-xl border px-2 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${
                                    isSuspended
                                      ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600 hover:text-white"
                                      : "bg-rose-600/10 border-rose-500/30 text-rose-400 hover:bg-rose-600 hover:text-white"
                                  }`}
                                  title={isSuspended ? "Reinstate portal access" : "Suspend portal access"}
                                >
                                  {isSuspended ? <CheckCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                  <span>{isSuspended ? "Reinstate" : "Suspend"}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-500 hover:text-white hover:bg-rose-700 transition-all cursor-pointer"
                                  title="Remove from registry"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleUseLogin(u)}
                                  disabled={isSuspended || isLoggingIn}
                                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                                    isSuspended
                                      ? "bg-slate-800/40 border-slate-700/50 text-slate-500 cursor-not-allowed"
                                      : "bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600 hover:text-white cursor-pointer shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                                  }`}
                                  title={isSuspended ? "Reinstate user to enable direct login" : "Instantly sign in as this staff member"}
                                >
                                  {isLoggingIn
                                    ? <RefreshCw className="h-3 w-3 animate-spin" />
                                    : <LogIn className="h-3 w-3" />}
                                  <span>{isLoggingIn ? "Entering…" : "Login As"}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ===================================================
                  TAB 6: ENTERPRISE LICENSE & CLIENT MODULE ACTIVATION
                  =================================================== */}
              {activeTab === "license" && (
                <div className="space-y-5 max-w-4xl mx-auto">
                  <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900/80 to-indigo-500/10 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-black">
                          <Award className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white m-0">
                              LabCore ELIS Ultimate Enterprise License
                            </h3>
                            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[9px] font-mono font-bold text-emerald-300 border border-emerald-500/40">
                              Perpetual Active
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 m-0 mt-0.5">
                            Issued to: <span className="text-white font-semibold">{hospitalName}</span> · License Node ID: <span className="font-mono text-amber-300">LIC-LC-2026-9941</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2 m-0">
                      <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
                      <span>Authorized Hospital Operational Modules (Toggle Activation)</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: "whatsapp", label: "Automated WhatsApp PDF Report Engine", desc: "Sends verified reports to patient mobile via Official WhatsApp API" },
                        { id: "abdm", label: "National Health Authority ABDM M1-M3 Gateway", desc: "Enables Ayushman Bharat Health Account (ABHA) and FHIR link" },
                        { id: "analyzerDrivers", label: "Bidirectional ASTM 1381 & HL7 Analyzer Drivers", desc: "Automates instrument result capture without manual typing" },
                        { id: "panicAlerts", label: "Critical Panic Value Automated SMS & IVR Bot", desc: "Immediately notifies ICU & referring doctor on critical laboratory values" },
                        { id: "b2bReferrals", label: "B2B Outreach & Referral Commission Billing", desc: "Custom tariff slab management for external clinic partners" },
                        { id: "poctBedside", label: "Inpatient Ward Bedside Barcoding (POCT)", desc: "Phlebotomist mobile barcode printing & positive patient ID" },
                      ].map((mod) => {
                        const checked = (activeModules as any)[mod.id];
                        return (
                          <div
                            key={mod.id}
                            onClick={() => {
                              setActiveModules({ ...activeModules, [mod.id]: !checked });
                              playBeep(750, "sine", 0.04);
                            }}
                            className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
                              checked
                                ? "border-indigo-500/50 bg-indigo-500/10 text-white"
                                : "border-slate-800 bg-slate-900/60 text-slate-400"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold">{mod.label}</span>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {}}
                                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 block">{mod.desc}</span>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => alert("Module feature flags saved to hospital license registry!")}
                      className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      Update & Synchronize Client Module Flags
                    </button>
                  </div>
                </div>
              )}

              {/* ===================================================
                  TAB 7: HARDWARE & LIMS DRIVER TELEMETRY (ENHANCED)
                  =================================================== */}
              {activeTab === "telemetry" && (
                <div className="space-y-4 max-w-5xl mx-auto">
                  {/* Live System Health Bars */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <h4 className="text-xs font-bold text-slate-200 mb-4 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-indigo-400" />
                      <span>Live LIMS Node System Health</span>
                      <span className="ml-auto text-[10px] text-emerald-400 font-mono animate-pulse">● LIVE</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: "CPU Utilization", value: sysMetrics.cpu, color: sysMetrics.cpu > 80 ? "bg-rose-500" : sysMetrics.cpu > 60 ? "bg-amber-500" : "bg-emerald-500", textColor: sysMetrics.cpu > 80 ? "text-rose-400" : "text-emerald-400" },
                        { label: "RAM Usage", value: sysMetrics.ram, color: sysMetrics.ram > 80 ? "bg-rose-500" : sysMetrics.ram > 65 ? "bg-amber-500" : "bg-sky-500", textColor: "text-sky-400" },
                        { label: "Network I/O", value: sysMetrics.net, color: "bg-indigo-500", textColor: "text-indigo-400" },
                        { label: "DB Query Load", value: sysMetrics.db, color: "bg-emerald-500", textColor: "text-emerald-400" },
                      ].map((m) => (
                        <div key={m.label}>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-400">{m.label}</span>
                            <span className={`font-mono font-bold ${m.textColor}`}>{m.value}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${m.color}`}
                              style={{ width: `${m.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/60 p-4">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>LIMS Core Node</span>
                        <Zap className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="mt-2 text-xl font-mono font-bold text-white">ONLINE</div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">Port 7432 · Latency 4ms · Uptime 99.97%</div>
                    </div>

                    <div className="rounded-2xl border border-sky-500/30 bg-slate-900/60 p-4">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>ABDM FHIR R4 Gateway</span>
                        <Globe className="h-4 w-4 text-sky-400" />
                      </div>
                      <div className="mt-2 text-xl font-mono font-bold text-white">READY (M1-M3)</div>
                      <div className="text-[10px] text-sky-400 mt-0.5">Sandbox Live · ABHA Token: OK</div>
                    </div>

                    <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/60 p-4">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Analyzer Workstations</span>
                        <Cpu className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div className="mt-2 text-xl font-mono font-bold text-white">6 LINKED</div>
                      <div className="text-[10px] text-indigo-400 mt-0.5">ASTM 1381 & HL7 v2.x Bidirectional</div>
                    </div>
                  </div>

                  {/* TAT SLA Dashboard */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <h4 className="text-xs font-bold text-slate-200 mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-400" />
                      <span>Laboratory TAT (Turnaround Time) SLA Monitor</span>
                    </h4>
                    <div className="space-y-3">
                      {tatSLA.map((row) => {
                        const pct = Math.round((row.actual / row.target) * 100);
                        const ok = row.actual <= row.target;
                        return (
                          <div key={row.dept}>
                            <div className="flex justify-between text-[11px] mb-1.5">
                              <span className="text-slate-300 font-semibold">{row.dept}</span>
                              <span className="flex items-center gap-3 font-mono">
                                <span className="text-slate-500">{row.load} tests today</span>
                                <span className={ok ? "text-emerald-400" : "text-rose-400"}>
                                  {row.actual}m / {row.target}m target
                                </span>
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  ok ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
                      <Network className="h-4 w-4 text-indigo-400" />
                      <span>Connected Diagnostic Analyzers & Serial Gateways</span>
                    </h4>

                    <div className="divide-y divide-slate-800/80">
                      {ANALYZER_WORKSTATIONS.map((analyzer) => (
                        <div key={analyzer.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white">{analyzer.name}</span>
                            <span className="text-slate-400 ml-2">({analyzer.type})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[11px] text-indigo-300">{analyzer.port}</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Synced
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ===================================================
                  TAB 8: SECURITY AUDIT TRAIL
                  =================================================== */}
              {activeTab === "audit" && (
                <div className="space-y-4 max-w-5xl mx-auto">
                  {/* Header Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                      <div className="text-[10px] text-rose-300 font-mono mb-1">CRITICAL EVENTS</div>
                      <div className="text-2xl font-black text-white">1</div>
                      <div className="text-[10px] text-rose-400 mt-0.5">Last 24h · Requires review</div>
                    </div>
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                      <div className="text-[10px] text-amber-300 font-mono mb-1">WARNINGS</div>
                      <div className="text-2xl font-black text-white">2</div>
                      <div className="text-[10px] text-amber-400 mt-0.5">IQC + QA triggers</div>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <div className="text-[10px] text-emerald-300 font-mono mb-1">TOTAL EVENTS</div>
                      <div className="text-2xl font-black text-white">{auditLog.length}</div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">All systems logged</div>
                    </div>
                  </div>

                  {/* Audit Log Table */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-rose-400" />
                        <span>Live Security & Event Audit Log</span>
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">ISO 15189 · HIPAA Compliant Log</span>
                    </div>
                    <div className="divide-y divide-slate-800/60">
                      {auditLog.map((entry, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-3 px-4 py-2.5 hover:bg-slate-900/40 transition-colors ${
                            entry.severity === "critical" ? "bg-rose-500/5 border-l-2 border-rose-500" :
                            entry.severity === "warn" ? "bg-amber-500/5 border-l-2 border-amber-500" :
                            "border-l-2 border-transparent"
                          }`}
                        >
                          <span className="font-mono text-[10px] text-slate-500 shrink-0 pt-0.5 w-14">{entry.time}</span>
                          <span className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                            entry.severity === "critical" ? "bg-rose-400 animate-pulse" :
                            entry.severity === "warn" ? "bg-amber-400" : "bg-emerald-400"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] text-slate-200 leading-tight block">{entry.action}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{entry.user} · {entry.ip}</span>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                            entry.severity === "critical" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" :
                            entry.severity === "warn" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                            "bg-slate-800 text-slate-400"
                          }`}>{entry.severity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">Showing last {auditLog.length} events · Full log encrypted at rest</span>
                      <button
                        type="button"
                        onClick={() => {
                          const txt = auditLog.map(e => `[${e.time}] [${e.severity.toUpperCase()}] ${e.user} @ ${e.ip} — ${e.action}`).join("\n");
                          navigator.clipboard?.writeText(txt);
                          playBeep(900, "sine", 0.06);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                        Export Log
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================================================
                  TAB 9: QC CONTROL MONITOR (WESTGARD / LEVEY-JENNINGS)
                  =================================================== */}
              {activeTab === "qcmonitor" && (
                <div className="space-y-4 max-w-5xl mx-auto">
                  <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-950/30 via-slate-950 to-slate-950 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-black">
                          <HeartPulse className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white m-0">IQC Westgard Rules Dashboard</h3>
                          <p className="text-[11px] text-slate-400 m-0 mt-0.5">ISO 15189:2022 Internal Quality Control · Real-time Levey-Jennings Monitoring</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/40">1 REJECT</span>
                        <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">2 WARN</span>
                        <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">3 PASS</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {qcData.map((qc) => {
                      const deviation = ((qc.lastVal - qc.mean) / qc.sd);
                      const devPct = Math.min(100, Math.abs(deviation) * 33.3);
                      return (
                        <div
                          key={qc.analyte}
                          className={`rounded-2xl border p-4 space-y-3 ${
                            qc.status === "fail" ? "border-rose-500/40 bg-rose-500/5" :
                            qc.status === "warn" ? "border-amber-500/40 bg-amber-500/5" :
                            "border-slate-800 bg-slate-950/70"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white m-0">{qc.analyte}</h4>
                            <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase border ${
                              qc.status === "fail" ? "bg-rose-500/20 text-rose-300 border-rose-500/50" :
                              qc.status === "warn" ? "bg-amber-500/20 text-amber-300 border-amber-500/50" :
                              "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                            }`}>
                              {qc.status === "fail" ? "⛔ REJECT" : qc.status === "warn" ? "⚠ WARNING" : "✓ IN-CONTROL"}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-xl bg-slate-900/80 p-2">
                              <div className="text-[9px] text-slate-500 mb-0.5">MEAN</div>
                              <div className="text-sm font-bold text-white font-mono">{qc.mean}</div>
                            </div>
                            <div className="rounded-xl bg-slate-900/80 p-2">
                              <div className="text-[9px] text-slate-500 mb-0.5">LAST VALUE</div>
                              <div className={`text-sm font-bold font-mono ${
                                qc.status === "fail" ? "text-rose-400" : qc.status === "warn" ? "text-amber-400" : "text-emerald-400"
                              }`}>{qc.lastVal}</div>
                            </div>
                            <div className="rounded-xl bg-slate-900/80 p-2">
                              <div className="text-[9px] text-slate-500 mb-0.5">±SD</div>
                              <div className="text-sm font-bold text-slate-300 font-mono">{deviation >= 0 ? "+" : ""}{deviation.toFixed(2)}s</div>
                            </div>
                          </div>

                          {/* Mini Levey-Jennings Sparkline */}
                          <div className="rounded-xl bg-slate-900 p-2.5">
                            <div className="text-[9px] text-slate-500 mb-2 font-mono">L-J TREND (last 5 runs)</div>
                            <div className="flex items-end gap-1 h-8">
                              {qc.trend.map((v, ti) => {
                                const h = Math.round(Math.abs((v - qc.mean) / qc.sd) * 12) + 4;
                                const isLast = ti === qc.trend.length - 1;
                                return (
                                  <div
                                    key={ti}
                                    className={`flex-1 rounded-sm transition-all ${
                                      isLast && qc.status === "fail" ? "bg-rose-500" :
                                      isLast && qc.status === "warn" ? "bg-amber-500" :
                                      "bg-indigo-500/60"
                                    }`}
                                    style={{ height: `${Math.min(32, h)}px` }}
                                    title={`Run ${ti + 1}: ${v}`}
                                  />
                                );
                              })}
                            </div>
                          </div>

                          {qc.rule !== "—" && (
                            <div className={`flex items-center gap-2 rounded-xl p-2 text-[10px] font-mono ${
                              qc.status === "fail" ? "bg-rose-500/10 text-rose-300" : "bg-amber-500/10 text-amber-300"
                            }`}>
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span>Westgard Rule Violation: {qc.rule}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-indigo-400" />
                      <span>Westgard Multi-Rule Quick Reference (ISO 15189)</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { rule: "1:2s", desc: "Warning — 1 control > 2 SD", color: "text-amber-400" },
                        { rule: "1:3s", desc: "Reject — 1 control > 3 SD", color: "text-rose-400" },
                        { rule: "2:2s", desc: "Reject — 2 consecutive > 2 SD", color: "text-rose-400" },
                        { rule: "R:4s", desc: "Reject — range > 4 SD", color: "text-rose-400" },
                        { rule: "4:1s", desc: "Reject — 4 consecutive > 1 SD", color: "text-orange-400" },
                        { rule: "10:x̄", desc: "Reject — 10 on same side of mean", color: "text-orange-400" },
                      ].map((wr) => (
                        <div key={wr.rule} className="rounded-xl bg-slate-900 border border-slate-800 p-2.5">
                          <span className={`text-xs font-black font-mono block ${wr.color}`}>{wr.rule}</span>
                          <span className="text-[10px] text-slate-400 leading-tight">{wr.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          PREMIUM A4 APPOINTMENT & CREDENTIAL LETTER MODAL
          ========================================================= */}
      {printableLetterUser && (
        <div className="fixed inset-0 z-[1100] flex items-start justify-center p-4 py-8 overflow-y-auto bg-black/90 backdrop-blur-lg">
          <div className="relative w-full max-w-3xl">
            {/* Screen-only Controls (hidden on print) */}
            <div className="print:hidden mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
                  <Printer className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-bold text-white">Official Appointment & Credential Letter</span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">PREMIUM</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadDoctorCertificate(printableLetterUser)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-amber-400" />
                  Export .PEM
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPrintableLetterUser(null)}
                  className="rounded-xl bg-slate-800 border border-slate-700 p-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ===== A4 LETTER PAPER ===== */}
            <div
              id="premium-appointment-letter"
              className="bg-white font-sans relative overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.6)] print:shadow-none"
              style={{ minHeight: "297mm", padding: "12mm 14mm" }}
            >
              {/* Watermark */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                style={{ zIndex: 0 }}
              >
                <span
                  className="text-slate-100 font-black uppercase tracking-[0.3em] select-none"
                  style={{ fontSize: "72px", transform: "rotate(-35deg)", whiteSpace: "nowrap", opacity: 0.45 }}
                >
                  CONFIDENTIAL
                </span>
              </div>

              {/* Content above watermark */}
              <div className="relative" style={{ zIndex: 1 }}>

                {/* ── TOP LETTERHEAD ─────────────────────────────── */}
                <div className="flex items-start justify-between pb-4 mb-4" style={{ borderBottom: "3px solid #1e293b" }}>
                  {/* Left: Hospital Identity */}
                  <div className="flex-1">
                    {/* Gold accent bar */}
                    <div className="h-1 w-20 rounded-full mb-2" style={{ background: "linear-gradient(90deg,#d97706,#fbbf24)" }} />
                    <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 m-0 leading-tight">
                      {hospitalName}
                    </h1>
                    <p className="text-[10px] text-slate-500 m-0 mt-0.5 leading-relaxed">
                      {hospitalAddress}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[9px] text-slate-500 font-mono">
                      <span>✆ {hospitalPhone}</span>
                      <span>·</span>
                      <span>✉ {hospitalEmail}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[9px] font-mono">
                      <span className="text-emerald-700 font-bold">NABL: {nablCode}</span>
                      <span className="text-blue-700 font-bold">NABH: {nabhCode}</span>
                      <span className="text-slate-500">GSTIN: {gstin}</span>
                    </div>
                  </div>

                  {/* Right: Ref box */}
                  <div className="text-right ml-6 shrink-0">
                    <div
                      className="inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white mb-2"
                      style={{ background: "#1e293b", letterSpacing: "0.1em" }}
                    >
                      Official Appointment Letter
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono space-y-0.5">
                      <div>Ref No: <span className="font-bold text-slate-800">LC-APT-{printableLetterUser.employeeCode}-26</span></div>
                      <div>Date: <span className="font-bold text-slate-800">{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</span></div>
                      <div>Issued by: <span className="font-bold text-indigo-700">LabCore ELIS v3.0</span></div>
                    </div>
                  </div>
                </div>

                {/* ── SUBJECT LINE ─────────────────────────────── */}
                <div className="mb-4 p-3 rounded-lg" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <p className="text-[11px] font-black text-slate-800 m-0 uppercase tracking-wide">
                    Sub: Letter of Appointment & LIMS System Access Provisioning — {printableLetterUser.role}
                  </p>
                </div>

                {/* ── SALUTATION + BODY ─────────────────────────── */}
                <div className="mb-4 space-y-2 text-[11px] text-slate-700 leading-relaxed">
                  <p className="m-0">
                    Dear <strong className="text-slate-900">{printableLetterUser.name}</strong>,
                  </p>
                  <p className="m-0">
                    We are pleased to formally appoint you as a <strong className="text-indigo-700">{ROLE_CONFIGS[printableLetterUser.role]?.title || printableLetterUser.role}</strong> at <strong>{hospitalName}</strong>. Your position has been authorized by the Medical Director and provisioned within the <em>LabCore ELIS</em> Clinical Laboratory Information System effective the date of this letter.
                  </p>
                  <p className="m-0">
                    Your LIMS workstation credentials, department access, analyzer driver assignments, and digital signature authority (where applicable) are issued below as per NABL ISO 15189:2022 and hospital governance policy. Please safeguard this document and change your initial access password upon first login.
                  </p>
                </div>

                {/* ── CREDENTIAL TABLE ─────────────────────────── */}
                <div className="mb-4 rounded-lg overflow-hidden" style={{ border: "1.5px solid #334155" }}>
                  {/* Table header */}
                  <div className="flex items-center gap-2 px-4 py-2" style={{ background: "#1e293b" }}>
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Provisioned Credentials & Access Rights</span>
                    <span className="ml-auto text-[9px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full">ENCRYPTED · AES-256</span>
                  </div>

                  {/* Rows */}
                  <div className="divide-y" style={{ background: "#f8fafc" }}>
                    {[
                      { label: "Personnel Full Name", value: printableLetterUser.name, highlight: true },
                      { label: "Operational Role", value: `${printableLetterUser.role} — ${ROLE_CONFIGS[printableLetterUser.role]?.subtitle || ""}`, color: "text-indigo-700 font-bold" },
                      { label: "Employee Code", value: printableLetterUser.employeeCode, mono: true, color: "text-blue-700 font-bold" },
                      { label: "Clinical Department", value: printableLetterUser.department || "Pathology & Diagnostics" },
                      { label: "Branch / Work Station", value: printableLetterUser.branchLocation || "Main Central Reference Lab" },
                      { label: "Assigned Shift Policy", value: printableLetterUser.shift || "General Shift (09:00 AM – 06:00 PM)" },
                      { label: "Portal Login Email", value: printableLetterUser.email, mono: true },
                      { label: "Password Setup", value: "Set via the emailed verification code at the sign-in page (Forgot password)", mono: false },
                      ...(printableLetterUser.medicalRegistrationNo ? [{ label: "Medical Reg No. (NMC/SMC)", value: printableLetterUser.medicalRegistrationNo, mono: true }] : []),
                      ...(printableLetterUser.degrees ? [{ label: "Qualifications & Fellowships", value: printableLetterUser.degrees }] : []),
                      { label: "2FA Mandatory", value: printableLetterUser.twoFactorEnabled !== false ? "YES — TOTP / Biometric" : "NOT ENROLLED", color: printableLetterUser.twoFactorEnabled !== false ? "text-emerald-700 font-bold" : "text-rose-700" },
                      ...(printableLetterUser.isNablSignatory ? [{ label: "NABL Digital Signature Authority", value: `AUTHORIZED — SHA-256 Seal: ${printableLetterUser.signatureStampId || "—"}`, color: "text-emerald-700 font-bold" }] : []),
                    ].map((row: any, i: number) => (
                      <div key={i} className="flex items-start text-[10px]">
                        <span
                          className="w-48 shrink-0 px-3 py-2 font-semibold text-slate-600"
                          style={{ background: i % 2 === 0 ? "#f1f5f9" : "#f8fafc", borderRight: "1px solid #e2e8f0" }}
                        >
                          {row.label}
                        </span>
                        <span
                          className={`flex-1 px-3 py-2 ${row.mono ? "font-mono" : "font-sans"} ${row.color || "text-slate-800"}`}
                          style={{ background: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}
                        >
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── TERMS & COMPLIANCE ─────────────────────────── */}
                <div
                  className="mb-5 p-3 text-[9px] text-slate-600 leading-relaxed rounded-lg"
                  style={{ border: "1px solid #fbbf24", background: "#fffbeb" }}
                >
                  <strong className="text-amber-800">Important Notice:</strong> This letter is issued under the authority of {hospitalName} and is governed by <strong>NABL ISO 15189:2022</strong>, <strong>HIPAA Privacy Rule</strong>, and <strong>IT Act 2000 (India)</strong>. Unauthorized disclosure, copying, or redistribution of this credential document is a punishable offence. The recipient is required to (a) change the initial access password upon first login, (b) never share credentials with any third party, and (c) report any suspected security breach immediately to the Lab IT Administrator. All activity is logged, monitored, and audited in real-time.
                </div>

                {/* ── SIGNATURE BLOCK ─────────────────────────── */}
                <div className="flex items-end justify-between mt-2 pt-4" style={{ borderTop: "2px solid #1e293b" }}>
                  {/* QR Code side */}
                  <div className="text-center">
                    <div
                      className="h-16 w-16 rounded-xl flex items-center justify-center mb-1"
                      style={{ border: "2px solid #334155", background: "#f1f5f9" }}
                    >
                      <QrCode className="h-10 w-10 text-slate-800" />
                    </div>
                    <p className="text-[8px] text-slate-500 font-mono m-0">Scan to Verify</p>
                    <p className="text-[8px] text-slate-400 font-mono m-0">{printableLetterUser.employeeCode}</p>
                  </div>

                  {/* Employee Signature Box */}
                  <div className="text-center flex-1 mx-6">
                    <div
                      className="h-10 rounded-lg mb-1"
                      style={{ border: "1px dashed #94a3b8", background: "#f8fafc" }}
                    />
                    <p className="text-[9px] text-slate-600 font-semibold m-0">{printableLetterUser.name}</p>
                    <p className="text-[8px] text-slate-400 m-0">Employee Signature & Date</p>
                  </div>

                  {/* Authorizing Officer */}
                  <div className="text-right">
                    <div
                      className="h-10 rounded-lg mb-1"
                      style={{ border: "1px dashed #94a3b8", background: "#f8fafc" }}
                    />
                    <p className="text-[9px] font-black text-slate-900 m-0">{directorName}</p>
                    <p className="text-[8px] text-slate-500 m-0">Medical Director & Authorized Officer</p>
                    <p className="text-[8px] text-indigo-600 font-mono m-0 mt-0.5">LabCore ELIS Enterprise</p>
                  </div>
                </div>

                {/* ── SECURITY MICRO-PRINT STRIP ─────────────────── */}
                <div
                  className="mt-4 px-3 py-1.5 flex items-center justify-between rounded"
                  style={{ background: "#1e293b" }}
                >
                  <span className="text-[8px] font-mono text-slate-400">
                    DOC-ID: LC-{printableLetterUser.employeeCode}-{new Date().getFullYear()} · NABL: {nablCode} · SHA256-SEAL: {printableLetterUser.signatureStampId || "N/A"}
                  </span>
                  <span className="text-[8px] font-mono text-amber-400">
                    LabCore ELIS · ISO 15189 · HIPAA Compliant
                  </span>
                </div>

              </div>{/* /relative content */}
            </div>{/* /A4 paper */}

            {/* Screen-only bottom actions */}
            <div className="print:hidden mt-3 flex items-center justify-between">
              <p className="text-[11px] text-slate-500">
                Tip: Click <strong className="text-white">Print / Save PDF</strong> → select <em>"Save as PDF"</em> in the print dialog for a digital copy.
              </p>
              <button
                type="button"
                onClick={() => handleSendWhatsAppInvite(printableLetterUser)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                WhatsApp Letter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
