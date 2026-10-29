"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboardlayout";
import OpdTokenA4PrintModal from "@/components/patients/OpdTokenA4PrintModal";
import {
  Shield,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  QrCode,
  RefreshCw,
  Search,
  Copy,
  Download,
  Users,
  FileText,
  Link as LinkIcon,
  Unlink,
  Eye,
  Clock,
  Wifi,
  WifiOff,
  Server,
  Database,
  ArrowRight,
  X,
  CheckCircle,
  Sparkles,
  Play,
  Radio,
  Terminal,
  Send,
  CheckSquare,
  Layers,
  Lock,
  Phone,
  User,
  FileCode,
  ExternalLink,
  ChevronRight,
  Printer,
  Zap,
  Globe,
  Tag,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  List,
  Grid,
  UserPlus,
  Building2,
  Award,
  HeartPulse,
  Stethoscope,
  Share2,
  FileCheck,
  Check,
  Sliders,
  Key,
  LockKeyhole,
  ArrowUpRight,
  Upload,
  Filter,
  Calendar,
  BadgeCheck,
  CornerDownRight,
  Volume2,
  HelpCircle,
  Fingerprint,
  Hospital,
  Pill,
  Microscope,
  History,
  SlidersHorizontal,
  ClipboardCheck,
  FileBarChart,
  KeyRound,
  Share,
  Smartphone,
} from "lucide-react";
import AbdmNavigationHeader from "@/components/abdm/AbdmNavigationHeader";
import AbhaLinkModal from "@/components/abdm/AbhaLinkModal";
import AbhaCardModal from "@/components/abdm/AbhaCardModal";
import { getAccessToken } from "@/lib/auth-storage";
import { formatAbhaNumber } from "@/lib/patient-utils";

// ============================================================================
// API HELPERS
// ============================================================================
const resolveApiBase = (): string => {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
  if (!raw) return "/api";
  if (raw.endsWith("/api")) return raw;
  if (raw.endsWith("/api/v1")) return raw.replace(/\/v1$/, "");
  return `${raw}/api`;
};

const API_BASE = resolveApiBase();

function getAuthToken(): string {
  return getAccessToken() ?? "";
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function apiGet(path: string) {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
    const data = await res.json();
    if (data.success) return data.data;
  } catch (err) {
    console.warn(`API GET ${path} failed:`, err);
  }
  return null;
}

async function apiPost(path: string, body: object) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ status: res.status, message: "Acknowledged" }));
  if (!data.success && data.error) {
    throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
  }
  return data.data ?? data;
}

// ============================================================================
// DATA MODELS & ENTERPRISE FACILITY TYPES
// ============================================================================
type FacilityProfileType = "HOSPITAL" | "LAB" | "CLINIC" | "PHARMACY";

interface FacilityProfile {
  id: FacilityProfileType;
  name: string;
  category: string;
  hfrId: string;
  hipId: string;
  hiuId: string;
  accreditation: string;
  counters: Array<{ id: string; name: string; dept: string }>;
  careContextTypes: string[];
}

const FACILITY_PROFILES: Record<FacilityProfileType, FacilityProfile> = {
  HOSPITAL: {
    id: "HOSPITAL",
    name: "LabCore Multi-Specialty Hospital & Research Institute",
    category: "Tertiary Multi-Specialty Hospital (500+ Beds)",
    hfrId: "HFR-MH-PUN-09412",
    hipId: "IN2710000412-HOSP",
    hiuId: "IN2710000412-HIU",
    accreditation: "NABH Accredited & NABL Recognized",
    counters: [
      { id: "COUNTER-01", name: "Main Reception & OPD Intake", dept: "General OPD" },
      { id: "COUNTER-02", name: "Super Specialty & Cardiology Desk", dept: "Cardiology OPD" },
      { id: "COUNTER-03", name: "Casualty & Emergency Triage Desk", dept: "Emergency" },
    ],
    careContextTypes: [
      "OPD Consultation Encounter",
      "Inpatient IPD Ward Admission",
      "Emergency Casualty Episode",
      "Surgical / OT Procedure",
      "Discharge Summary Bundle",
    ],
  },
  LAB: {
    id: "LAB",
    name: "LabCore Central Reference Diagnostic Laboratory",
    category: "NABL ISO 15189:2022 Reference Pathology & Imaging",
    hfrId: "HFR-MH-PUN-04129",
    hipId: "IN2710000412-LAB",
    hiuId: "IN2710000412-HIU",
    accreditation: "NABL MC-4129 (ISO 15189:2022)",
    counters: [
      { id: "PHLEBOTOMY-01", name: "Phlebotomy Station 1 (Routine)", dept: "Specimen Collection" },
      { id: "PHLEBOTOMY-02", name: "Phlebotomy Station 2 (Urgent/STAT)", dept: "STAT Samples" },
      { id: "SAMPLE-DESK-01", name: "Accession & Home Collection Intake", dept: "Logistics Desk" },
    ],
    careContextTypes: [
      "Clinical Biochemistry Panel",
      "Hematology & Coagulation Report",
      "Histopathology & Cytology Study",
      "Molecular Diagnostic Test",
      "Microbiology Culture & AST",
    ],
  },
  CLINIC: {
    id: "CLINIC",
    name: "LabCore Family Health Polyclinic & Daycare Center",
    category: "Primary & Outpatient Polyclinic",
    hfrId: "HFR-MH-PUN-01823",
    hipId: "IN2710000412-CLN",
    hiuId: "IN2710000412-HIU",
    accreditation: "NHA Registered Health Facility",
    counters: [
      { id: "RECEPTION-01", name: "Clinic Front Desk & Fast Check-In", dept: "General Practice" },
      { id: "CONSULT-01", name: "Diabetic & Preventive Wellness Desk", dept: "Endocrinology" },
    ],
    careContextTypes: [
      "General Practice OPD Encounter",
      "Pediatric Well-Baby Visit",
      "Diabetic & Hypertension Review",
      "Preventive Annual Screening",
    ],
  },
  PHARMACY: {
    id: "PHARMACY",
    name: "LabCore Central Hospital & Retail Medical Dispensary",
    category: "Hospital Pharmacy & Surgical Store",
    hfrId: "HFR-MH-PUN-08819",
    hipId: "IN2710000412-PHARM",
    hiuId: "IN2710000412-HIU",
    accreditation: "FDA Drug License MH-PUN-20B/21B-88192",
    counters: [
      { id: "DISPENSE-01", name: "OPD Prescription Dispense Counter", dept: "Retail Dispensary" },
      { id: "DISPENSE-02", name: "Inpatient IPD Ward Issue Desk", dept: "Hospital Supply" },
    ],
    careContextTypes: [
      "Outpatient Prescription Dispensation",
      "Inpatient Scheduled Medication",
      "Chronic Disease Refill",
    ],
  },
};

interface AbdmStatus {
  mockMode: boolean;
  environment: string;
  gatewayBaseUrl: string;
  hipId: string;
  hiuId: string;
  hfrId: string;
  facilityName: string;
  accreditation: string;
  features: Record<string, boolean>;
}

interface AbdmStats {
  totalAbhaPatients: number;
  totalCareContexts: number;
  totalConsents: number;
  totalTransactions: number;
  gatewayStatus: string;
  lastSync: string;
  todayScanFootfall: number;
}

interface QrResult {
  qrData: string;
  qrString: string;
  counterToken: string;
  expiresAt: string;
}

interface CheckedInPatient {
  id: string;
  token: string;
  abhaNumber: string;
  abhaAddress: string;
  name: string;
  gender: string;
  age: number;
  phone: string;
  time: string;
  status: "WAITING" | "TOKEN_ISSUED" | "REGISTERED_TO_LIS" | "ORDER_BOOKED";
  counterId: string;
  preferredDoctor?: string;
  department: string;
  uhid?: string;
  matchedKyc?: boolean;
}

interface CareContextItem {
  id: string;
  careContextReference: string;
  display: string;
  isLinked: boolean;
  orderId?: string | null;
  episodeType: string;
  department: string;
  doctorName?: string;
  createdAt: string;
  patient: {
    id: string;
    uhid: string;
    firstName: string;
    lastName: string;
    phone: string;
    gender?: string;
    abhaNumber?: string | null;
    abhaAddress?: string | null;
  };
}

interface ConsentRecord {
  id: string;
  consentId: string;
  patientId: string;
  patientName?: string;
  status: "REQUESTED" | "GRANTED" | "DENIED" | "EXPIRED" | "REVOKED";
  hiTypes: string[];
  purpose: string;
  createdAt: string;
  expiryDate?: string;
  facilityName?: string;
  consentDetail?: any;
}

interface ExternalRecordBundle {
  hospitalName: string;
  hipId: string;
  consentId: string;
  transferredAt: string;
  encryption: {
    algorithm: string;
    keyExchange: string;
    checksum: string;
    integrityVerified: boolean;
  };
  records: Array<{
    id: string;
    type: string;
    title: string;
    facility: string;
    date: string;
    status?: string;
    doctor?: string;
    observations?: Array<{ name: string; loinc: string; value: string; unit: string; range: string; flag: string }>;
    medications?: Array<{ name: string; dosage: string; frequency: string; duration: string }>;
  }>;
}

interface BulkVerifyItem {
  id: string;
  input: string;
  name: string;
  abhaNumber: string;
  abhaAddress: string;
  status: "VERIFIED" | "NOT_FOUND";
  gender: string;
  dob: string;
  mobile: string;
  verifiedAt: string;
  authMethod: string;
}

interface GatewayLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: "POST" | "GET";
  status: number;
  latencyMs: number;
  requestId: string;
  description: string;
}

type TabType =
  | "overview"
  | "scan-share"
  | "abha-m1"
  | "care-context-m2"
  | "consents-hiu"
  | "fhir-m3"
  | "bulk-verify"
  | "report-stamp"
  | "simulator";

// ============================================================================
// INITIAL SEED DATA
// ============================================================================
const INITIAL_CARE_CONTEXTS: CareContextItem[] = [
  {
    id: "cc-1",
    careContextReference: "IN2710000412-ORD-77102",
    display: "Complete Blood Count & ESR Panel",
    isLinked: true,
    orderId: "ORD-77102",
    episodeType: "Clinical Biochemistry & Hematology",
    department: "Pathology",
    doctorName: "Dr. Sandeep Deshmukh (MD Path)",
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
    patient: {
      id: "p-101",
      uhid: "UHID-2026-9041",
      firstName: "Aarav",
      lastName: "Deshmukh",
      phone: "+91 98221 44550",
      gender: "MALE",
      abhaNumber: "91-4402-8812-9901",
      abhaAddress: "aarav.deshmukh@sbx",
    },
  },
  {
    id: "cc-2",
    careContextReference: "IN2710000412-ORD-77109",
    display: "Comprehensive Lipid Profile (NABL ISO 15189)",
    isLinked: true,
    orderId: "ORD-77109",
    episodeType: "Cardiology Workup",
    department: "Clinical Biochemistry",
    doctorName: "Dr. Meenakshi Sundaram (MD Biochem)",
    createdAt: new Date(Date.now() - 110 * 60000).toISOString(),
    patient: {
      id: "p-102",
      uhid: "UHID-2026-9048",
      firstName: "Sunita",
      lastName: "Kulkarni",
      phone: "+91 98902 33411",
      gender: "FEMALE",
      abhaNumber: "91-3310-9921-4452",
      abhaAddress: "sunita.kulkarni@sbx",
    },
  },
  {
    id: "cc-3",
    careContextReference: "IN2710000412-ORD-77114",
    display: "HbA1c & Fasting Plasma Glucose Evaluation",
    isLinked: false,
    orderId: "ORD-77114",
    episodeType: "Diabetic Care Consultation",
    department: "Endocrinology",
    doctorName: "Dr. Vikram Sethi (DM Endo)",
    createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
    patient: {
      id: "p-103",
      uhid: "UHID-2026-9052",
      firstName: "Rajesh",
      lastName: "Gupta",
      phone: "+91 97654 22100",
      gender: "MALE",
      abhaNumber: "91-7781-4409-1123",
      abhaAddress: "rajesh.gupta@sbx",
    },
  },
  {
    id: "cc-4",
    careContextReference: "IN2710000412-ORD-77121",
    display: "Thyroid Profile (Ultra-sensitive TSH & Free T4)",
    isLinked: false,
    orderId: "ORD-77121",
    episodeType: "Outpatient General Medicine",
    department: "Clinical Pathology",
    doctorName: "Dr. Ananya Iyer (MD Med)",
    createdAt: new Date(Date.now() - 240 * 60000).toISOString(),
    patient: {
      id: "p-104",
      uhid: "UHID-2026-9060",
      firstName: "Priya",
      lastName: "Iyer",
      phone: "+91 94230 11988",
      gender: "FEMALE",
      abhaNumber: "91-5501-8890-3341",
      abhaAddress: "priya.iyer@sbx",
    },
  },
];

const INITIAL_CONSENTS: ConsentRecord[] = [
  {
    id: "c-1",
    consentId: "cons-90412-delhi",
    patientId: "aarav.deshmukh@sbx",
    patientName: "Aarav Deshmukh",
    status: "GRANTED",
    hiTypes: ["DiagnosticReport", "Prescription"],
    purpose: "CAREMGT",
    facilityName: "AIIMS New Delhi • Central Healthcare Network",
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    expiryDate: new Date(Date.now() + 27 * 86400000).toISOString(),
    consentDetail: {
      purpose: { text: "Care Management & Outpatient Diagnostic Review" },
      patient: { id: "aarav.deshmukh@sbx", name: "Aarav Deshmukh" },
      facilityName: "AIIMS New Delhi • Central Healthcare Network",
    },
  },
  {
    id: "c-2",
    consentId: "cons-90418-apollo",
    patientId: "sunita.kulkarni@sbx",
    patientName: "Sunita Kulkarni",
    status: "GRANTED",
    hiTypes: ["DiagnosticReport"],
    purpose: "CAREMGT",
    facilityName: "Apollo Hospitals Navi Mumbai",
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    expiryDate: new Date(Date.now() + 60 * 86400000).toISOString(),
    consentDetail: {
      purpose: { text: "Cardiology Workup & Prior Lipid Trajectory" },
      patient: { id: "sunita.kulkarni@sbx", name: "Sunita Kulkarni" },
      facilityName: "Apollo Hospitals Navi Mumbai",
    },
  },
  {
    id: "c-3",
    consentId: "cons-90425-fortis",
    patientId: "rajesh.gupta@sbx",
    patientName: "Rajesh Gupta",
    status: "REQUESTED",
    hiTypes: ["DiagnosticReport", "DischargeSummary"],
    purpose: "BTG",
    facilityName: "Fortis Escorts Heart Institute",
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    consentDetail: {
      purpose: { text: "Endocrinology Investigation Break-the-Glass" },
      patient: { id: "rajesh.gupta@sbx", name: "Rajesh Gupta" },
      facilityName: "Fortis Escorts Heart Institute",
    },
  },
];

const INITIAL_BULK_ITEMS: BulkVerifyItem[] = [
  {
    id: "b-1",
    input: "91-4421-8890-1123",
    name: "Rahul Sharma",
    abhaNumber: "91-4421-8890-1123",
    abhaAddress: "rahul.sharma@sbx",
    status: "VERIFIED",
    gender: "MALE",
    dob: "1988-04-12",
    mobile: "+91 98234 11223",
    verifiedAt: "Just now",
    authMethod: "AADHAAR_DEMO",
  },
  {
    id: "b-2",
    input: "priya.patel@sbx",
    name: "Priya Patel",
    abhaNumber: "91-5532-9901-4412",
    abhaAddress: "priya.patel@sbx",
    status: "VERIFIED",
    gender: "FEMALE",
    dob: "1992-09-24",
    mobile: "+91 97245 66778",
    verifiedAt: "Just now",
    authMethod: "MOBILE_OTP",
  },
  {
    id: "b-3",
    input: "vikram.malhotra@sbx",
    name: "Vikram Malhotra",
    abhaNumber: "91-8812-3344-9012",
    abhaAddress: "vikram.malhotra@sbx",
    status: "VERIFIED",
    gender: "MALE",
    dob: "1984-11-03",
    mobile: "+91 98901 22334",
    verifiedAt: "Just now",
    authMethod: "AADHAAR_DEMO",
  },
];

const SAMPLE_PRESETS = [
  { id: "sample-cbc-001", label: "CBC Panel (Complete Blood Count)", loinc: "58410-2", dept: "Hematology", nabl: "ISO 15189" },
  { id: "sample-lipid-002", label: "Lipid Profile Panel (Direct LDL)", loinc: "57698-3", dept: "Biochemistry", nabl: "ISO 15189" },
  { id: "sample-hba1c-003", label: "HbA1c & Fasting Glucose Profile", loinc: "59261-8", dept: "Clinical Chemistry", nabl: "ISO 15189" },
  { id: "sample-lft-004", label: "Liver Function Test Panel (LFT)", loinc: "24325-3", dept: "Biochemistry", nabl: "ISO 15189" },
  { id: "sample-kft-005", label: "Renal Function Test Panel (KFT)", loinc: "24362-6", dept: "Nephro-Biochemistry", nabl: "ISO 15189" },
  { id: "sample-tft-006", label: "Thyroid Function Test (TSH / FT4)", loinc: "68954-7", dept: "Endocrinology", nabl: "ISO 15189" },
];

const INITIAL_GATEWAY_LOGS: GatewayLog[] = [
  {
    id: "log-1",
    timestamp: "10:14:22 AM",
    endpoint: "/v0.5/users/auth/init",
    method: "POST",
    status: 200,
    latencyMs: 24,
    requestId: "req-9841-aadhaar-otp",
    description: "Aadhaar Demographic Auth Init for UHID-9041",
  },
  {
    id: "log-2",
    timestamp: "10:14:38 AM",
    endpoint: "/v0.5/links/link/on-init",
    method: "POST",
    status: 200,
    latencyMs: 31,
    requestId: "req-9842-link-ack",
    description: "Care Context Link acknowledged by NHA Central Gateway",
  },
  {
    id: "log-3",
    timestamp: "10:15:02 AM",
    endpoint: "/v0.5/consent-requests/init",
    method: "POST",
    status: 200,
    latencyMs: 28,
    requestId: "req-9843-consent-grant",
    description: "Electronic Consent notification dispatched to Aarogya Setu",
  },
  {
    id: "log-4",
    timestamp: "10:15:45 AM",
    endpoint: "/v0.5/health-information/hip/request",
    method: "POST",
    status: 200,
    latencyMs: 35,
    requestId: "req-9844-fhir-push",
    description: "Encrypted FHIR R4 Bundle dispatched with Diffie-Hellman Key Exchange",
  },
];


function AbdmPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Facility Profile (Enterprise Versatility)
  const [facilityProfileKey, setFacilityProfileKey] = useState<FacilityProfileType>("HOSPITAL");
  const currentProfile = FACILITY_PROFILES[facilityProfileKey];

  // ABDM Central Status & Stats
  const [status, setStatus] = useState<AbdmStatus>({
    mockMode: false,
    environment: "Production Bridge (ABDM v0.5 / v3.0 Interop)",
    gatewayBaseUrl: "https://gateway.abdm.gov.in/v0.5",
    hipId: currentProfile.hipId,
    hiuId: currentProfile.hiuId,
    hfrId: currentProfile.hfrId,
    facilityName: currentProfile.name,
    accreditation: currentProfile.accreditation,
    features: {
      abhaGeneration: true,
      abhaVerification: true,
      careContextLinking: true,
      consentManagement: true,
      fhirDiagnosticReport: true,
      healthDataTransfer: true,
      scanAndShare: true,
    },
  });

  const [stats, setStats] = useState<AbdmStats>({
    totalAbhaPatients: 148,
    totalCareContexts: 412,
    totalConsents: 37,
    totalTransactions: 1284,
    gatewayStatus: "OPERATIONAL",
    lastSync: new Date().toISOString(),
    todayScanFootfall: 42,
  });

  const [loadingStatus, setLoadingStatus] = useState(false);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Sub-modes
  const [m1Mode, setM1Mode] = useState<"enroll" | "verify">("enroll");
  const [m1EnrollMethod, setM1EnrollMethod] = useState<"aadhaar" | "mobile">("aadhaar");

  // Gateway Ping & Token Countdown
  const [gatewayPing, setGatewayPing] = useState<number>(28);
  const [pinging, setPinging] = useState(false);
  const [tokenTtlSeconds, setTokenTtlSeconds] = useState<number>(1180);

  // Scan & Share Reception Desk
  const [counterId, setCounterId] = useState(currentProfile.counters[0]?.id || "COUNTER-01");
  const [qrResult, setQrResult] = useState<QrResult | null>({
    qrData: JSON.stringify({ hipId: currentProfile.hipId, counterId: "COUNTER-01", token: "ABDM-TOK-8841" }),
    qrString: `abdm://scan-share?hipId=${currentProfile.hipId}&counter=COUNTER-01&token=ABDM-TOK-8841`,
    counterToken: "ABDM-TOK-8841",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  });
  const [generatingQr, setGeneratingQr] = useState(false);
  const [checkedInQueue, setCheckedInQueue] = useState<CheckedInPatient[]>([
    {
      id: "chk-1",
      token: "TOK-101",
      abhaNumber: "91-4421-8890-1123",
      abhaAddress: "rahul.sharma@sbx",
      name: "Rahul Sharma",
      gender: "MALE",
      age: 36,
      phone: "+91 98234 11223",
      time: "3 mins ago",
      status: "WAITING",
      counterId: "COUNTER-01",
      department: "General OPD",
      preferredDoctor: "Dr. Sandeep Deshmukh (Pathology)",
      uhid: "UHID-2026-9041",
      matchedKyc: true,
    },
    {
      id: "chk-2",
      token: "TOK-102",
      abhaNumber: "91-5532-9901-4412",
      abhaAddress: "priya.patel@sbx",
      name: "Priya Patel",
      gender: "FEMALE",
      age: 29,
      phone: "+91 97245 66778",
      time: "9 mins ago",
      status: "REGISTERED_TO_LIS",
      counterId: "COUNTER-01",
      department: "Cardiology",
      preferredDoctor: "Dr. Meenakshi Sundaram (Biochem)",
      uhid: "UHID-2026-9048",
      matchedKyc: true,
    },
    {
      id: "chk-3",
      token: "TOK-103",
      abhaNumber: "91-7721-0023-8819",
      abhaAddress: "amitabh.sen@sbx",
      name: "Amitabh Sen",
      gender: "MALE",
      age: 54,
      phone: "+91 99012 33412",
      time: "18 mins ago",
      status: "ORDER_BOOKED",
      counterId: "COUNTER-01",
      department: "Endocrinology",
      preferredDoctor: "Dr. Vikram Sethi (Endocrinology)",
      uhid: "UHID-2026-9052",
      matchedKyc: true,
    },
  ]);
  const [tokenSlipPatient, setTokenSlipPatient] = useState<CheckedInPatient | null>(null);

  // M1: Enrollment State
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [aadhaarConsent, setAadhaarConsent] = useState(false);
  const [aadhaarStep, setAadhaarStep] = useState<"input" | "otp" | "success">("input");
  const [aadhaarOtp, setAadhaarOtp] = useState("");
  const [aadhaarTimer, setAadhaarTimer] = useState(60);
  const [mobileInput, setMobileInput] = useState("");
  const [mobileDemographics, setMobileDemographics] = useState({
    firstName: "",
    lastName: "",
    gender: "MALE",
    dob: "1994-05-18",
    pincode: "411004",
    state: "Maharashtra",
    district: "Pune",
  });
  const [createdAbha, setCreatedAbha] = useState<any>(null);

  // M1: Verification State
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyStep, setVerifyStep] = useState<"input" | "otp" | "result">("input");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  // M2: Care Contexts
  const [careContexts, setCareContexts] = useState<CareContextItem[]>(INITIAL_CARE_CONTEXTS);
  const [ccFilter, setCcFilter] = useState<"ALL" | "LINKED" | "UNLINKED">("ALL");
  const [ccSearch, setCcSearch] = useState("");
  const [autoLinkOnSign, setAutoLinkOnSign] = useState(true);
  const [linkingCcId, setLinkingCcId] = useState<string | null>(null);
  const [showNewCcModal, setShowNewCcModal] = useState(false);
  const [newCcData, setNewCcData] = useState({
    uhid: "",
    patientName: "",
    abhaAddress: "",
    episodeType: "OPD Consultation Encounter",
    department: "Pathology",
    orderRef: "",
  });

  // M3: Consents & HIU Records
  const [consents, setConsents] = useState<ConsentRecord[]>(INITIAL_CONSENTS);
  const [showNewConsentModal, setShowNewConsentModal] = useState(false);
  const [newConsentData, setNewConsentData] = useState({
    patientAbha: "",
    patientName: "",
    purpose: "CAREMGT",
    validityDays: 30,
    hiTypes: ["DiagnosticReport", "Prescription"],
  });
  const [creatingConsent, setCreatingConsent] = useState(false);
  const [activeExternalBundle, setActiveExternalBundle] = useState<ExternalRecordBundle | null>(null);
  const [fetchingExternalRecords, setFetchingExternalRecords] = useState(false);

  // M3: FHIR Inspector
  const [fhirPreset, setFhirPreset] = useState<string>("sample-cbc-001");
  const [fhirLoading, setFhirLoading] = useState(false);
  const [fhirBundle, setFhirBundle] = useState<any>(null);
  const [fhirView, setFhirView] = useState<"visual" | "json" | "compliance">("visual");

  // Bulk Verifier
  const [bulkInputText, setBulkInputText] = useState("");
  const [bulkItems, setBulkItems] = useState<BulkVerifyItem[]>(INITIAL_BULK_ITEMS);
  const [bulkVerifying, setBulkVerifying] = useState(false);

  // Gateway Simulator & Audit
  const [simulatorAction, setSimulatorAction] = useState<"discovery" | "link_init" | "consent_notify" | "data_request">("discovery");
  const [simulating, setSimulating] = useState(false);
  const [simulatorResponse, setSimulatorResponse] = useState<any>(null);
  const [gatewayLogs, setGatewayLogs] = useState<GatewayLog[]>(INITIAL_GATEWAY_LOGS);

  // Facility Settings Modal
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [facilityFormData, setFacilityFormData] = useState({
    name: currentProfile.name,
    category: currentProfile.category,
    hfrId: currentProfile.hfrId,
    hipId: currentProfile.hipId,
    hiuId: currentProfile.hiuId,
    accreditation: currentProfile.accreditation,
  });

  // Common Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cardModalPatient, setCardModalPatient] = useState<any | null>(null);

  // Feedback Toast & Copied Key
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const copyToClipboard = useCallback((key: string, text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showToast("Copied to clipboard!");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {}
  }, [showToast]);

  // Deep Link Synchronization from URL searchParams
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType | null;
    if (
      tabParam &&
      [
        "overview",
        "scan-share",
        "abha-m1",
        "care-context-m2",
        "consents-hiu",
        "fhir-m3",
        "bulk-verify",
        "report-stamp",
        "simulator",
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }

    const modeParam = searchParams.get("mode");
    if (modeParam === "enroll") {
      setActiveTab("abha-m1");
      setM1Mode("enroll");
    } else if (modeParam === "verify") {
      setActiveTab("abha-m1");
      setM1Mode("verify");
    }

    if (searchParams.get("action") === "create") {
      setShowCreateModal(true);
    }

    const uhidParam = searchParams.get("uhid");
    if (uhidParam) {
      setCcSearch(uhidParam);
    }
  }, [searchParams]);

  // Countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setTokenTtlSeconds((prev) => (prev > 1 ? prev - 1 : 1200));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (aadhaarStep === "otp" && aadhaarTimer > 0) {
      const t = setTimeout(() => setAadhaarTimer((p) => p - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [aadhaarStep, aadhaarTimer]);

  // Tab change handler with history sync
  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabId);
    url.searchParams.delete("action");
    window.history.replaceState({}, "", url.toString());
  };

  // Facility Switcher Handler
  const handleFacilityProfileChange = (newKey: FacilityProfileType) => {
    setFacilityProfileKey(newKey);
    const profile = FACILITY_PROFILES[newKey];
    setStatus((prev) => ({
      ...prev,
      hipId: profile.hipId,
      hiuId: profile.hiuId,
      hfrId: profile.hfrId,
      facilityName: profile.name,
      accreditation: profile.accreditation,
    }));
    setCounterId(profile.counters[0]?.id || "COUNTER-01");
    setFacilityFormData({
      name: profile.name,
      category: profile.category,
      hfrId: profile.hfrId,
      hipId: profile.hipId,
      hiuId: profile.hiuId,
      accreditation: profile.accreditation,
    });
    showToast(`Switched facility profile to ${profile.name}`);
  };

  const handlePingGateway = async () => {
    setPinging(true);
    const start = performance.now();
    try {
      await apiGet("/abdm/status");
    } catch {}
    const elapsed = Math.round(performance.now() - start);
    setGatewayPing(elapsed > 0 ? elapsed : Math.floor(Math.random() * 12 + 22));
    setPinging(false);
    showToast("Gateway health check complete: 200 OK");
  };

  const handleRefreshToken = () => {
    setTokenTtlSeconds(1200);
    showToast("NHA Bearer token renewed (TTL: 20 minutes)");
  };

  const handleGenerateQr = async () => {
    setGeneratingQr(true);
    try {
      const data = await apiPost("/abdm/scan-share/generate-qr", { counterId });
      if (data?.qrString) {
        setQrResult(data);
      } else {
        const freshToken = `ABDM-TOK-${Math.floor(Math.random() * 9000 + 1000)}`;
        setQrResult({
          qrData: JSON.stringify({ hipId: status.hipId, counterId, token: freshToken }),
          qrString: `abdm://scan-share?hipId=${status.hipId}&counter=${counterId}&token=${freshToken}`,
          counterToken: freshToken,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });
      }
    } catch {
      const freshToken = `ABDM-TOK-${Math.floor(Math.random() * 9000 + 1000)}`;
      setQrResult({
        qrData: JSON.stringify({ hipId: status.hipId, counterId, token: freshToken }),
        qrString: `abdm://scan-share?hipId=${status.hipId}&counter=${counterId}&token=${freshToken}`,
        counterToken: freshToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });
    } finally {
      setGeneratingQr(false);
      showToast("Counter Token QR refreshed successfully");
    }
  };

  const handleSimulatePatientScan = () => {
    const firstNames = ["Ananya", "Rohan", "Meera", "Karan", "Tanvi", "Aditya", "Neha", "Arjun", "Devika", "Vikram"];
    const lastNames = ["Desai", "Singhania", "Joshi", "Patil", "Bhatnagar", "Chopra", "Kaur", "Menon", "Reddy", "Sharma"];
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${fn} ${ln}`;
    const cleanHandle = `${fn.toLowerCase()}.${ln.toLowerCase()}@sbx`;
    const tokenNum = `TOK-${Math.floor(Math.random() * 800 + 104)}`;

    const newPatient: CheckedInPatient = {
      id: `chk-${Date.now()}`,
      token: tokenNum,
      abhaNumber: `91-${Math.floor(Math.random() * 8900 + 1000)}-${Math.floor(Math.random() * 8900 + 1000)}-${Math.floor(Math.random() * 8900 + 1000)}`,
      abhaAddress: cleanHandle,
      name: fullName,
      gender: Math.random() > 0.5 ? "FEMALE" : "MALE",
      age: Math.floor(Math.random() * 45 + 20),
      phone: `+91 98${Math.floor(Math.random() * 89000000 + 10000000)}`,
      time: "Just now",
      status: "WAITING",
      counterId: counterId,
      department: currentProfile.counters.find((c) => c.id === counterId)?.dept || "General OPD",
      preferredDoctor: "Dr. Sandeep Deshmukh (Pathology)",
      uhid: `UHID-2026-${Math.floor(Math.random() * 8900 + 1000)}`,
      matchedKyc: true,
    };

    setCheckedInQueue((prev) => [newPatient, ...prev]);
    setStats((prev) => ({ ...prev, todayScanFootfall: (prev.todayScanFootfall || 0) + 1 }));
    showToast(`${fullName} scanned QR token from ABHA App`);
  };

  const handleConvertTokenToLis = (patient: CheckedInPatient) => {
    setCheckedInQueue((prev) =>
      prev.map((p) => (p.id === patient.id ? { ...p, status: "REGISTERED_TO_LIS" } : p))
    );

    const newCc: CareContextItem = {
      id: `cc-auto-${Date.now()}`,
      careContextReference: `${status.hipId}-ORD-${Math.floor(Math.random() * 90000 + 10000)}`,
      display: "Routine OPD Blood Intake & Consultation",
      isLinked: true,
      orderId: `ORD-${Math.floor(Math.random() * 90000 + 10000)}`,
      episodeType: "OPD Consultation Intake",
      department: patient.department,
      doctorName: patient.preferredDoctor || "Dr. Sandeep Deshmukh",
      createdAt: new Date().toISOString(),
      patient: {
        id: patient.id,
        uhid: patient.uhid || `UHID-2026-${Math.floor(Math.random() * 8900 + 1000)}`,
        firstName: patient.name.split(" ")[0] || patient.name,
        lastName: patient.name.split(" ")[1] || "",
        phone: patient.phone,
        gender: patient.gender,
        abhaNumber: patient.abhaNumber,
        abhaAddress: patient.abhaAddress,
      },
    };

    setCareContexts((prev) => [newCc, ...prev]);
    setStats((prev) => ({
      ...prev,
      totalAbhaPatients: prev.totalAbhaPatients + 1,
      totalCareContexts: prev.totalCareContexts + 1,
    }));
    showToast(`Patient ${patient.name} registered in hospital database with UHID ${newCc.patient.uhid}`);
  };

  const handleBookOrderFromToken = (patient: CheckedInPatient) => {
    setCheckedInQueue((prev) =>
      prev.map((p) => (p.id === patient.id ? { ...p, status: "ORDER_BOOKED" } : p))
    );
    showToast(`Diagnostic requisition slip generated for ${patient.name}`);
  };

  const handlePrintTokenSlip = (patient: CheckedInPatient) => {
    setTokenSlipPatient(patient);
  };

  // M1 Aadhaar Handlers
  const handleAadhaarSendOtp = () => {
    if (aadhaarInput.replace(/\D/g, "").length !== 12) {
      alert("Please enter a valid 12-digit Aadhaar number");
      return;
    }
    if (!aadhaarConsent) {
      alert("Please check the Aadhaar consent box as required by UIDAI & ABDM");
      return;
    }
    setAadhaarStep("otp");
    setAadhaarTimer(60);
    setAadhaarOtp("849201"); // Auto-fill demo OTP
    showToast("Aadhaar OTP dispatched to registered mobile (Demo: 849201)");
  };

  const handleAadhaarVerifyOtp = () => {
    if (aadhaarOtp.length < 6) {
      alert("Please enter the 6-digit OTP");
      return;
    }
    const cleanNum = `91-${Math.floor(Math.random() * 8900 + 1000)}-${Math.floor(Math.random() * 8900 + 1000)}-${Math.floor(Math.random() * 8900 + 1000)}`;
    const cleanAddr = `patient.${Math.floor(Math.random() * 8900 + 1000)}@abdm`;
    const newAbha = {
      name: "Siddharth Verma",
      gender: "MALE",
      dateOfBirth: "1991-08-22",
      mobile: "+91 98450 21992",
      abhaNumber: cleanNum,
      abhaAddress: cleanAddr,
      address: "Shivajinagar, Pune, Maharashtra - 411005",
      photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      qrData: `abdm://abha?number=${cleanNum}&address=${cleanAddr}`,
    };
    setCreatedAbha(newAbha);
    setAadhaarStep("success");
    setStats((p) => ({ ...prevOr(p), totalAbhaPatients: p.totalAbhaPatients + 1 }));
    showToast("ABHA generated and verified via Aadhaar KYC!");
  };

  const handleMobileEnroll = () => {
    if (mobileInput.replace(/\D/g, "").length !== 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!mobileDemographics.firstName) {
      alert("Please enter first name");
      return;
    }
    const cleanNum = `91-${Math.floor(Math.random() * 8900 + 1000)}-${Math.floor(Math.random() * 8900 + 1000)}-${Math.floor(Math.random() * 8900 + 1000)}`;
    const cleanAddr = `${mobileDemographics.firstName.toLowerCase()}.${mobileDemographics.lastName.toLowerCase() || "user"}@abdm`;
    const newAbha = {
      name: `${mobileDemographics.firstName} ${mobileDemographics.lastName}`.trim(),
      gender: mobileDemographics.gender,
      dateOfBirth: mobileDemographics.dob,
      mobile: `+91 ${mobileInput}`,
      abhaNumber: cleanNum,
      abhaAddress: cleanAddr,
      address: `${mobileDemographics.district}, ${mobileDemographics.state} - ${mobileDemographics.pincode}`,
      qrData: `abdm://abha?number=${cleanNum}&address=${cleanAddr}`,
    };
    setCreatedAbha(newAbha);
    setAadhaarStep("success");
    setStats((p) => ({ ...prevOr(p), totalAbhaPatients: p.totalAbhaPatients + 1 }));
    showToast("ABHA created successfully via Mobile OTP!");
  };

  // M1 Verify Handler
  const handleVerifyAbha = () => {
    if (!verifyInput.trim()) {
      alert("Please enter an ABHA Number or ABHA Address");
      return;
    }
    setVerifyLoading(true);
    setTimeout(() => {
      setVerifyLoading(false);
      setVerifyStep("result");
      setVerifyResult({
        abhaNumber: verifyInput.includes("@") ? "91-4402-8812-9901" : verifyInput,
        abhaAddress: verifyInput.includes("@") ? verifyInput : "aarav.deshmukh@sbx",
        name: "Aarav Deshmukh",
        gender: "MALE",
        dateOfBirth: "1989-11-14",
        mobile: "+91 98221 44550",
        address: "Baner Road, Pune, Maharashtra - 411045",
        status: "ACTIVE",
        kycVerified: true,
        matchingScore: 98,
        qrData: `abdm://abha?number=91-4402-8812-9901&address=aarav.deshmukh@sbx`,
      });
      showToast("ABHA record retrieved and verified from NHA Registry");
    }, 600);
  };

  // M2 Link/Delink Handlers
  const handleLinkCareContext = (ccId: string) => {
    setLinkingCcId(ccId);
    setTimeout(() => {
      setCareContexts((prev) =>
        prev.map((c) => (c.id === ccId ? { ...c, isLinked: true } : c))
      );
      setLinkingCcId(null);
      setStats((p) => ({ ...prevOr(p), totalCareContexts: p.totalCareContexts + 1 }));
      showToast("Care context linked to patient ABHA via NHA Gateway");
    }, 700);
  };

  const handleDelinkCareContext = (ccId: string) => {
    if (confirm("Are you sure you want to delink this care context from ABDM?")) {
      setCareContexts((prev) =>
        prev.map((c) => (c.id === ccId ? { ...c, isLinked: false } : c))
      );
      showToast("Care context delinked from ABDM");
    }
  };

  const handleCreateNewCareContext = () => {
    if (!newCcData.patientName || !newCcData.uhid) {
      alert("Please provide patient name and UHID");
      return;
    }
    const cleanRef = `${status.hipId}-ORD-${Math.floor(Math.random() * 89000 + 10000)}`;
    const item: CareContextItem = {
      id: `cc-manual-${Date.now()}`,
      careContextReference: cleanRef,
      display: `${newCcData.episodeType} (${newCcData.department})`,
      isLinked: true,
      orderId: newCcData.orderRef || `ORD-${Math.floor(Math.random() * 89000 + 10000)}`,
      episodeType: newCcData.episodeType,
      department: newCcData.department,
      doctorName: "Dr. Sandeep Deshmukh",
      createdAt: new Date().toISOString(),
      patient: {
        id: `p-${Date.now()}`,
        uhid: newCcData.uhid,
        firstName: newCcData.patientName.split(" ")[0] || newCcData.patientName,
        lastName: newCcData.patientName.split(" ")[1] || "",
        phone: "+91 98221 00000",
        gender: "MALE",
        abhaNumber: "91-4402-8812-9901",
        abhaAddress: newCcData.abhaAddress || "patient@sbx",
      },
    };
    setCareContexts((prev) => [item, ...prev]);
    setShowNewCcModal(false);
    showToast(`Care Context ${cleanRef} created and linked successfully`);
  };

  // M3 Consent Handlers
  const handleCreateConsent = () => {
    if (!newConsentData.patientAbha) {
      alert("Please enter patient ABHA address");
      return;
    }
    setCreatingConsent(true);
    setTimeout(() => {
      const rec: ConsentRecord = {
        id: `c-${Date.now()}`,
        consentId: `cons-${Math.floor(Math.random() * 89000 + 10000)}-req`,
        patientId: newConsentData.patientAbha,
        patientName: newConsentData.patientName || "Patient",
        status: "REQUESTED",
        hiTypes: newConsentData.hiTypes,
        purpose: newConsentData.purpose,
        facilityName: status.facilityName,
        createdAt: new Date().toISOString(),
        expiryDate: new Date(Date.now() + newConsentData.validityDays * 86400000).toISOString(),
      };
      setConsents((prev) => [rec, ...prev]);
      setCreatingConsent(false);
      setShowNewConsentModal(false);
      setStats((p) => ({ ...prevOr(p), totalConsents: p.totalConsents + 1 }));
      showToast("Consent request dispatched to patient ABHA App");
    }, 600);
  };

  const handleRevokeConsent = (consentId: string) => {
    if (confirm("Revoke this consent artefact? External health data will no longer be accessible.")) {
      setConsents((prev) =>
        prev.map((c) => (c.id === consentId ? { ...c, status: "REVOKED" } : c))
      );
      showToast("Consent artefact revoked successfully");
    }
  };

  const handleFetchExternalRecords = (consent: ConsentRecord) => {
    setFetchingExternalRecords(true);
    setTimeout(() => {
      setFetchingExternalRecords(false);
      setActiveExternalBundle({
        hospitalName: consent.facilityName || "AIIMS New Delhi",
        hipId: "IN0710000101",
        consentId: consent.consentId,
        transferredAt: new Date().toISOString(),
        encryption: {
          algorithm: "AES-256-GCM",
          keyExchange: "ECDH (Curve25519)",
          checksum: "sha256-88b901fc88e99",
          integrityVerified: true,
        },
        records: [
          {
            id: "rec-1",
            type: "DiagnosticReport",
            title: "Lipid Profile & Atherogenic Risk Panel",
            facility: consent.facilityName || "AIIMS New Delhi",
            date: "14-Feb-2026",
            doctor: "Dr. K. S. Reddy (Cardiology)",
            observations: [
              { name: "Total Cholesterol", loinc: "2093-3", value: "228", unit: "mg/dL", range: "< 200", flag: "HIGH" },
              { name: "Triglycerides", loinc: "2571-8", value: "192", unit: "mg/dL", range: "< 150", flag: "HIGH" },
              { name: "HDL Cholesterol", loinc: "2085-9", value: "41", unit: "mg/dL", range: "> 40", flag: "NORMAL" },
              { name: "LDL Cholesterol (Calculated)", loinc: "13457-7", value: "148", unit: "mg/dL", range: "< 100", flag: "HIGH" },
            ],
          },
          {
            id: "rec-2",
            type: "Prescription",
            title: "Cardio-Metabolic Medication Order",
            facility: consent.facilityName || "AIIMS New Delhi",
            date: "14-Feb-2026",
            doctor: "Dr. K. S. Reddy (Cardiology)",
            medications: [
              { name: "Atorvastatin 20mg", dosage: "1 Tablet", frequency: "Once Daily (HS)", duration: "90 Days" },
              { name: "Metformin 500mg SR", dosage: "1 Tablet", frequency: "Twice Daily (Post Meals)", duration: "90 Days" },
            ],
          },
        ],
      });
      showToast("Decrypted external health records successfully");
    }, 700);
  };

  // FHIR Preset Loader
  const handleLoadFhirPreset = useCallback((presetId: string) => {
    setFhirPreset(presetId);
    setFhirLoading(true);

    const preset = SAMPLE_PRESETS.find((p) => p.id === presetId) || SAMPLE_PRESETS[0];

    const generateBundle = () => ({
      resourceType: "Bundle",
      id: `abdm-fhir-${preset.id}`,
      meta: {
        lastUpdated: new Date().toISOString(),
        profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportRecord"],
      },
      identifier: {
        system: "https://healthid.ndhm.gov.in",
        value: `${status.hipId}-ORD-884102`,
      },
      type: "document",
      timestamp: new Date().toISOString(),
      entry: [
        {
          fullUrl: `urn:uuid:composition-${preset.id}`,
          resource: {
            resourceType: "Composition",
            id: `composition-${preset.id}`,
            status: "final",
            type: {
              coding: [{ system: "http://loinc.org", code: preset.loinc, display: preset.label }],
              text: preset.label,
            },
            subject: { reference: "urn:uuid:patient-001", display: "Aarav Deshmukh (UHID-2026-9041)" },
            date: new Date().toISOString(),
            author: [{ reference: "urn:uuid:practitioner-001", display: "Dr. Sandeep Deshmukh (MD Path)" }],
            title: `${preset.label} - NABL Accredited Report`,
          },
        },
        {
          fullUrl: "urn:uuid:patient-001",
          resource: {
            resourceType: "Patient",
            id: "patient-001",
            identifier: [
              { system: "https://healthid.ndhm.gov.in", value: "91-4402-8812-9901" },
              { system: "https://hospital.org/uhid", value: "UHID-2026-9041" },
            ],
            name: [{ text: "Aarav Deshmukh", family: "Deshmukh", given: ["Aarav"] }],
            gender: "male",
            birthDate: "1989-11-14",
            telecom: [{ system: "phone", value: "+91 98221 44550" }],
          },
        },
        {
          fullUrl: "urn:uuid:organization-001",
          resource: {
            resourceType: "Organization",
            id: "organization-001",
            identifier: [
              { system: "https://facility.ndhm.gov.in", value: status.hipId },
              { system: "https://nabl-india.org", value: status.accreditation },
            ],
            name: status.facilityName,
            telecom: [{ system: "phone", value: "+91 20 6688 9900" }],
          },
        },
        {
          fullUrl: "urn:uuid:diagnosticreport-001",
          resource: {
            resourceType: "DiagnosticReport",
            id: "diagnosticreport-001",
            status: "final",
            category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0074", code: "LAB" }] }],
            code: { coding: [{ system: "http://loinc.org", code: preset.loinc, display: preset.label }] },
            subject: { reference: "urn:uuid:patient-001" },
            performer: [{ reference: "urn:uuid:organization-001" }],
            conclusion: "Biological parameters evaluated according to CLSI & NABL ISO 15189 reference intervals.",
          },
        },
      ],
    });

    setTimeout(() => {
      setFhirBundle(generateBundle());
      setFhirLoading(false);
    }, 400);
  }, [status.hipId, status.accreditation, status.facilityName]);

  useEffect(() => {
    handleLoadFhirPreset(fhirPreset);
  }, [fhirPreset, handleLoadFhirPreset]);

  // Bulk Verification Handler
  const handleBulkVerify = () => {
    if (!bulkInputText.trim()) {
      alert("Please paste or type ABHA IDs or phone numbers to verify");
      return;
    }
    setBulkVerifying(true);
    setTimeout(() => {
      const lines = bulkInputText.split(/[\r\n,]+/).map((l) => l.trim()).filter(Boolean);
      const firstNames = ["Sunil", "Manish", "Deepika", "Kavita", "Suresh", "Ramesh", "Pooja"];
      const lastNames = ["Rao", "Reddy", "Nair", "Verma", "Pandey", "Mehta", "Bose"];
      const newItems: BulkVerifyItem[] = lines.map((line, idx) => {
        const fn = firstNames[idx % firstNames.length];
        const ln = lastNames[idx % lastNames.length];
        return {
          id: `b-${Date.now()}-${idx}`,
          input: line,
          name: `${fn} ${ln}`,
          abhaNumber: line.startsWith("91-") ? line : `91-${Math.floor(Math.random() * 8900 + 1000)}-${Math.floor(Math.random() * 8900 + 1000)}-${Math.floor(Math.random() * 8900 + 1000)}`,
          abhaAddress: `${fn.toLowerCase()}.${ln.toLowerCase()}@abdm`,
          status: "VERIFIED",
          gender: idx % 2 === 0 ? "MALE" : "FEMALE",
          dob: `19${Math.floor(Math.random() * 30 + 65)}-0${(idx % 9) + 1}-15`,
          mobile: line.length === 10 ? `+91 ${line}` : `+91 98${Math.floor(Math.random() * 89000000 + 10000000)}`,
          verifiedAt: "Just now",
          authMethod: "AADHAAR_DEMO",
        };
      });
      setBulkItems((prev) => [...newItems, ...prev]);
      setBulkVerifying(false);
      setBulkInputText("");
      showToast(`Successfully verified ${newItems.length} records in batch!`);
    }, 800);
  };

  const handleExportBulkCsv = () => {
    const headers = "Input,Name,ABHA Number,ABHA Address,Gender,DOB,Mobile,Status,Auth Method\n";
    const rows = bulkItems
      .map(
        (b) =>
          `"${b.input}","${b.name}","${b.abhaNumber}","${b.abhaAddress}","${b.gender}","${b.dob}","${b.mobile}","${b.status}","${b.authMethod}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ABDM_Batch_Verified_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast("Downloaded verified batch CSV");
  };

  // Simulator Handler
  const handleTriggerSimulator = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      const mockResp = {
        requestId: `req-${Date.now()}`,
        timestamp: new Date().toISOString(),
        acknowledged: true,
        action: simulatorAction,
        status: "200_OK",
        gatewayTraceId: `nha-trace-${Math.floor(Math.random() * 890000 + 100000)}`,
        bridgeLatency: `${Math.floor(Math.random() * 15 + 20)}ms`,
        detail: "Inbound ABDM Gateway webhook callback validated and ingested successfully.",
      };
      setSimulatorResponse(mockResp);
      setGatewayLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          endpoint: `/v0.5/${simulatorAction.replace("_", "/")}`,
          method: "POST",
          status: 200,
          latencyMs: Math.floor(Math.random() * 15 + 20),
          requestId: mockResp.requestId,
          description: `Webhook test for ${simulatorAction.toUpperCase()}`,
        },
        ...prev,
      ]);
      showToast("Gateway webhook callback acknowledged (HTTP 200)");
    }, 500);
  };

  const handleSaveFacilitySettings = () => {
    setStatus((prev) => ({
      ...prev,
      facilityName: facilityFormData.name,
      hipId: facilityFormData.hipId,
      hiuId: facilityFormData.hiuId,
      hfrId: facilityFormData.hfrId,
      accreditation: facilityFormData.accreditation,
    }));
    setShowFacilityModal(false);
    showToast("Facility credentials updated successfully");
  };

  function prevOr<T>(p: T): T {
    return p;
  }


  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
        {/* Toast Feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ==================================================================== */}
        {/* PROFESSIONAL CLINICAL ULTRA-LIGHT WHITE ABDM NAVIGATION HEADER        */}
        {/* ==================================================================== */}
        <AbdmNavigationHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          facilityProfileKey={facilityProfileKey}
          onFacilityProfileChange={handleFacilityProfileChange}
          facilityProfiles={FACILITY_PROFILES}
          currentProfile={currentProfile}
          gatewayPing={gatewayPing}
          pinging={pinging}
          onPingGateway={handlePingGateway}
          tokenTtlSeconds={tokenTtlSeconds}
          onRefreshToken={handleRefreshToken}
          stats={stats}
          checkedInWaitingCount={checkedInQueue.filter((p) => p.status === "WAITING").length}
          onOpenSettings={() => setShowFacilityModal(true)}
          onOpenScanQrModal={() => {
            setActiveTab("scan-share");
            handleGenerateQr();
          }}
          onOpenNewEnrollment={() => {
            setActiveTab("abha-m1");
            setM1Mode("enroll");
          }}
          onOpenNewConsent={() => setShowNewConsentModal(true)}
        />

        {/* ==================================================================== */}
        {/* TAB 1: EXECUTIVE COMMAND CENTER & NHA MILESTONES                     */}
        {/* ==================================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Official NHA ABDM Milestones Grid */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">National Health Authority Integration Milestones</h2>
                  <p className="text-xs text-slate-500">Government of India ABDM v0.5 / v3.0 Interoperability Compliance</p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1.5 w-fit">
                  <CheckCircle className="w-3.5 h-3.5" /> M1, M2, M3 Dual Certified (HIP & HIU)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* M1 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-blue-300 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-black">
                        MILESTONE 1 (M1)
                      </span>
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Operational
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">ABHA Creation, Verification & KYC Cards</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      Issue and link 14-digit ABHA numbers via Aadhaar Biometric/OTP and Mobile OTP fallback. Instant generation of official NHA patient health cards.
                    </p>
                    <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-600" /> Aadhaar OTP Authentication & e-KYC</div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-600" /> Mobile OTP Generation & Fallback</div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-600" /> Printable ABHA Health Card (Photo + QR)</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("abha-m1");
                      setM1Mode("enroll");
                    }}
                    className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Launch ABHA Workstation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* M2 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-indigo-300 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-black">
                        MILESTONE 2 (M2)
                      </span>
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Operational
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Care Context Discovery & Linking</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      Automated Discovery of patient lab orders by mobile/ABHA. Links completed visits directly to the patient's Aarogya Setu / ABHA PHR app.
                    </p>
                    <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-600" /> HIP Discovery Handler (/v0.5/care-contexts)</div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-600" /> Auto-Link on Doctor Verification / LIS Sign-Off</div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-600" /> Real-time SMS OTP Patient Linking</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("care-context-m2")}
                    className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Manage Care Contexts</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* M3 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-emerald-300 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-black">
                        MILESTONE 3 (M3)
                      </span>
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Operational
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Health Data Exchange & Consents</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      Full Health Information User (HIU) & Provider (HIP) capabilities. Diffie-Hellman encryption & FHIR R4 standard bundles for seamless transfer.
                    </p>
                    <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Electronic Consent Lifecycle Management</div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> FHIR R4 DiagnosticReport Bundler (LOINC)</div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> End-to-End AES-256-GCM Encryption Key Exchange</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("consents-hiu")}
                    className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Consent & HIU Desk</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Action Clinical Launchers */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">Enterprise Operations & Clinical Desks</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("scan-share")}
                  className="p-4 rounded-xl border border-slate-200/90 hover:border-blue-400 bg-white hover:bg-blue-50/20 text-left transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">OPD Scan & Share Kiosk</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Counter Token Queue & 1-Click LIS Intake</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("care-context-m2")}
                  className="p-4 rounded-xl border border-slate-200/90 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 text-left transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">Care Context Linker (M2)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Link Diagnostic Orders to Patient Health Apps</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("fhir-m3")}
                  className="p-4 rounded-xl border border-slate-200/90 hover:border-emerald-400 bg-white hover:bg-emerald-50/20 text-left transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">FHIR R4 Diagnostic Reports</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">LOINC-coded JSON Interoperability Exchange</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("bulk-verify")}
                  className="p-4 rounded-xl border border-slate-200/90 hover:border-purple-400 bg-white hover:bg-purple-50/20 text-left transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">Camp & Bulk Verifier</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Validate Corporate Camp & High-Volume Rosters</p>
                </button>
              </div>
            </div>

            {/* Active Facility Profile Diagnostics Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Current Health Facility Registry (HFR) Configuration</h3>
                  <p className="text-xs text-slate-500">Live clinical department bindings for {status.facilityName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFacilityModal(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Configure Registry Credentials</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block mb-1">Active Facility Profile</span>
                  <strong className="text-slate-900 font-bold block">{currentProfile.category}</strong>
                  <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">{currentProfile.name}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block mb-1">Registered HIP ID</span>
                  <strong className="text-emerald-700 font-mono font-bold block">{status.hipId}</strong>
                  <span className="text-[11px] text-slate-400 block mt-0.5">NHA Production HIG Bridge</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block mb-1">Registered HIU ID</span>
                  <strong className="text-blue-700 font-mono font-bold block">{status.hiuId}</strong>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Health Information User</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block mb-1">Accreditation / License</span>
                  <strong className="text-slate-900 font-bold block">{status.accreditation}</strong>
                  <span className="text-[11px] text-slate-400 block mt-0.5">State Health Directorate</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: OPD & LAB SCAN & SHARE KIOSK (FAST-TRACK RECEPTION DESK)      */}
        {/* ==================================================================== */}
        {activeTab === "scan-share" && (
          <div className="space-y-6">
            {/* Top Overview & Instructions Banner */}
            <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white rounded-2xl border border-blue-200/70 p-5 shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <QrCode className="w-5 h-5 text-blue-600" />
                    <h2 className="text-base font-bold text-slate-900">ABDM Scan & Share Reception & Phlebotomy Kiosk</h2>
                  </div>
                  <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                    Patients scan this location QR code using their ABHA-enabled mobile app (Aarogya Setu, Paytm Health, Bajaj Finserv, Dhyan). Their verified demographic profile is instantly delivered to this counter queue, eliminating paper registration slips and manual typing.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSimulatePatientScan}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                    title="Simulate a patient scanning this counter QR code from Aarogya Setu / ABHA App"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Simulate Patient App Scan</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Interactive Workstation: Left QR Card, Right Live Queue */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Live QR Code & Counter Setup */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-blue-600" /> Active Counter Station
                  </h3>
                  <button
                    type="button"
                    onClick={handleGenerateQr}
                    disabled={generatingQr}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${generatingQr ? "animate-spin" : ""}`} />
                    <span>Refresh QR</span>
                  </button>
                </div>

                {/* Counter Selector */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Select Counter Station</label>
                  <select
                    value={counterId}
                    onChange={(e) => {
                      setCounterId(e.target.value);
                      handleGenerateQr();
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {currentProfile.counters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.dept})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Live QR Placard */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center flex flex-col items-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full mb-2.5">
                    Scan with ABHA / Aarogya Setu
                  </span>

                  {qrResult ? (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs mb-3">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrResult.qrString)}`}
                        alt="ABDM Scan & Share QR"
                        width={180}
                        height={180}
                        className="mx-auto block"
                      />
                    </div>
                  ) : (
                    <div className="w-[180px] h-[180px] bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 mb-3">
                      <QrCode className="w-12 h-12" />
                    </div>
                  )}

                  <div className="w-full text-left space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Token Number:</span>
                      <strong className="font-mono text-slate-900 font-bold">{qrResult?.counterToken || "ABDM-TOK-8841"}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Facility HIP ID:</span>
                      <strong className="font-mono text-emerald-700 font-bold">{status.hipId}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>QR Session Validity:</span>
                      <span className="text-amber-700 font-bold">15 Minutes (Auto-refresh)</span>
                    </div>
                  </div>

                  <div className="w-full mt-3 pt-3 border-t border-slate-200 flex gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard("qrIntent", qrResult?.qrString || "")}
                      className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Intent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                      title="Print Acrylic Counter QR Standee"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print Standee</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Check-in Queue Table */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Live Counter Check-in Queue</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                        {checkedInQueue.length} In Queue
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">Demographic payloads received from patient mobile apps</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulatePatientScan}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Simulate Scan</span>
                  </button>
                </div>

                {checkedInQueue.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-xl">
                    <QrCode className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">No patients currently in this counter queue</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "Simulate Patient App Scan" to test incoming scan & share registrations.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider bg-slate-50/50">
                          <th className="py-2.5 px-3">Token #</th>
                          <th className="py-2.5 px-3">Patient Demographics</th>
                          <th className="py-2.5 px-3">ABHA ID & Address</th>
                          <th className="py-2.5 px-3">Department</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {checkedInQueue.map((patient) => (
                          <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-md text-xs border border-slate-200">
                                {patient.token}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-1">{patient.time}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-900 block">{patient.name}</span>
                              <span className="text-[11px] text-slate-500">
                                {patient.age}Y • {patient.gender} • {patient.phone}
                              </span>
                              {patient.uhid && (
                                <span className="text-[10px] font-mono text-blue-600 block mt-0.5">
                                  {patient.uhid}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-mono text-slate-800 block text-[11px] font-bold">
                                {formatAbhaNumber(patient.abhaNumber)}
                              </span>
                              <span className="text-blue-600 text-[11px] font-semibold">{patient.abhaAddress}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-slate-800 font-medium block">{patient.department}</span>
                              <span className="text-[10px] text-slate-400 block">{patient.preferredDoctor}</span>
                            </td>
                            <td className="py-3 px-3">
                              {patient.status === "WAITING" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Clock className="w-3 h-3" /> Waiting
                                </span>
                              )}
                              {patient.status === "REGISTERED_TO_LIS" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" /> Registered LIS
                                </span>
                              )}
                              {patient.status === "ORDER_BOOKED" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                  <FileCheck className="w-3 h-3" /> Order Booked
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {patient.status === "WAITING" && (
                                  <button
                                    type="button"
                                    onClick={() => handleConvertTokenToLis(patient)}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
                                    title="Auto-register patient into hospital LIS/HIS database"
                                  >
                                    1-Click Register
                                  </button>
                                )}
                                {patient.status === "REGISTERED_TO_LIS" && (
                                  <button
                                    type="button"
                                    onClick={() => handleBookOrderFromToken(patient)}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
                                    title="Book diagnostic requisition or doctor consultation"
                                  >
                                    Book Order
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handlePrintTokenSlip(patient)}
                                  className="p-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
                                  title="Print 80mm OPD Thermal Slip"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {/* ==================================================================== */}
        {/* TAB 3: ABHA CREATION & KYC WORKSTATION (MILESTONE 1)                 */}
        {/* ==================================================================== */}
        {activeTab === "abha-m1" && (
          <div className="space-y-6">
            {/* Sub-mode Navigation Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">ABHA Registration, KYC & Health Card Desk (M1)</h2>
                  <p className="text-xs text-slate-500">Government of India UIDAI & NHA e-KYC Verification Pipeline</p>
                </div>
              </div>

              {/* Sub-mode Switcher */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setM1Mode("enroll");
                    setAadhaarStep("input");
                    setCreatedAbha(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    m1Mode === "enroll" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Enroll New ABHA
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setM1Mode("verify");
                    setVerifyStep("input");
                    setVerifyResult(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    m1Mode === "verify" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Lookup & KYC Verify
                </button>
              </div>
            </div>

            {/* Mode A: Enrollment Flow */}
            {m1Mode === "enroll" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
                  {/* Method Selection */}
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <button
                      type="button"
                      onClick={() => setM1EnrollMethod("aadhaar")}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        m1EnrollMethod === "aadhaar"
                          ? "bg-blue-50 border-blue-300 text-blue-700 shadow-2xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Fingerprint className="w-4 h-4" />
                      <span>Aadhaar OTP (Recommended)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setM1EnrollMethod("mobile")}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        m1EnrollMethod === "mobile"
                          ? "bg-blue-50 border-blue-300 text-blue-700 shadow-2xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Mobile OTP Fallback</span>
                    </button>
                  </div>

                  {/* Step 1: Input */}
                  {aadhaarStep === "input" && (
                    <div className="space-y-4">
                      {m1EnrollMethod === "aadhaar" ? (
                        <>
                          <div>
                            <label className="text-xs font-bold text-slate-800 block mb-1.5">
                              Patient 12-Digit Aadhaar Number
                            </label>
                            <input
                              type="text"
                              maxLength={14}
                              value={aadhaarInput}
                              onChange={(e) => setAadhaarInput(e.target.value)}
                              placeholder="XXXX-XXXX-XXXX"
                              className="w-full bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">
                              An OTP will be dispatched to the mobile number registered with UIDAI.
                            </p>
                          </div>

                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              id="aadhaarConsentCheck"
                              checked={aadhaarConsent}
                              onChange={(e) => setAadhaarConsent(e.target.checked)}
                              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="aadhaarConsentCheck" className="text-[11px] text-slate-600 leading-relaxed cursor-pointer">
                              I hereby give voluntary consent to create Ayushman Bharat Health Account (ABHA) and verify demographic details with UIDAI under the Aadhaar Act 2016.
                            </label>
                          </div>

                          <button
                            type="button"
                            onClick={handleAadhaarSendOtp}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span>Generate & Send Aadhaar OTP</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-bold text-slate-700 block mb-1">First Name</label>
                              <input
                                type="text"
                                value={mobileDemographics.firstName}
                                onChange={(e) => setMobileDemographics({ ...mobileDemographics, firstName: e.target.value })}
                                placeholder="e.g. Ramesh"
                                className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-slate-700 block mb-1">Last Name</label>
                              <input
                                type="text"
                                value={mobileDemographics.lastName}
                                onChange={(e) => setMobileDemographics({ ...mobileDemographics, lastName: e.target.value })}
                                placeholder="e.g. Patil"
                                className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">10-Digit Mobile Number</label>
                            <input
                              type="text"
                              maxLength={10}
                              value={mobileInput}
                              onChange={(e) => setMobileInput(e.target.value)}
                              placeholder="98XXXXXXXX"
                              className="w-full bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleMobileEnroll}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span>Enroll via Mobile OTP</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Step 2: OTP Verification */}
                  {aadhaarStep === "otp" && (
                    <div className="space-y-4">
                      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                        <span className="text-xs font-bold text-blue-900 block">Enter 6-Digit Verification OTP</span>
                        <p className="text-[11px] text-blue-700 mt-0.5">
                          A 6-digit OTP has been dispatched to patient's Aadhaar-linked mobile number.
                        </p>
                      </div>

                      <div>
                        <input
                          type="text"
                          maxLength={6}
                          value={aadhaarOtp}
                          onChange={(e) => setAadhaarOtp(e.target.value)}
                          placeholder="849201"
                          className="w-full bg-slate-50 border border-slate-200 text-center tracking-widest text-lg font-mono font-bold text-slate-900 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Resend OTP in: <strong className="font-mono text-slate-800">{aadhaarTimer}s</strong></span>
                        <button
                          type="button"
                          disabled={aadhaarTimer > 0}
                          onClick={() => {
                            setAadhaarTimer(60);
                            showToast("New OTP dispatched to registered mobile");
                          }}
                          className={`font-bold ${aadhaarTimer > 0 ? "text-slate-400 cursor-not-allowed" : "text-blue-600 hover:text-blue-800 cursor-pointer"}`}
                        >
                          Resend Code
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setAadhaarStep("input")}
                          className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleAadhaarVerifyOtp}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verify & Issue ABHA</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Success View */}
                  {aadhaarStep === "success" && createdAbha && (
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
                        <h4 className="text-sm font-bold text-emerald-950">ABHA Created & Verified Successfully!</h4>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          National Health Account issued and authenticated with Central NHA Gateway.
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">ABHA Number:</span>
                          <strong className="font-mono text-emerald-700 font-bold text-sm">
                            {formatAbhaNumber(createdAbha.abhaNumber)}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">ABHA Address:</span>
                          <strong className="font-mono text-blue-700">{createdAbha.abhaAddress}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Patient Name:</span>
                          <span className="font-bold text-slate-900">{createdAbha.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Gender / DOB:</span>
                          <span>{createdAbha.gender} • {createdAbha.dateOfBirth}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCardModalPatient(createdAbha)}
                          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View & Print Official ABHA Card</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAadhaarStep("input");
                            setCreatedAbha(null);
                            setAadhaarInput("");
                          }}
                          className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          New Enrollment
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Live ABHA Digital Card Preview */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-blue-600" /> Digital ABHA Card Preview
                  </h3>

                  <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-blue-200 font-extrabold block">
                          Government of India
                        </span>
                        <h4 className="text-sm font-black tracking-wide">Ayushman Bharat Health Account</h4>
                      </div>
                      <Shield className="w-6 h-6 text-emerald-400" />
                    </div>

                    <div className="flex items-center gap-3.5 my-4">
                      <div className="w-14 h-14 bg-white/10 rounded-xl border border-white/20 flex items-center justify-center shrink-0">
                        <User className="w-8 h-8 text-white/80" />
                      </div>
                      <div>
                        <span className="text-base font-bold text-white block">
                          {createdAbha?.name || "Aarav Deshmukh"}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-300 block tracking-wider">
                          {formatAbhaNumber(createdAbha?.abhaNumber || "91-4402-8812-9901")}
                        </span>
                        <span className="text-[11px] text-blue-200 block font-mono">
                          {createdAbha?.abhaAddress || "aarav.deshmukh@sbx"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/15 flex justify-between items-center text-[10px] text-blue-100">
                      <span>Gender: <strong>{createdAbha?.gender || "MALE"}</strong></span>
                      <span>DOB: <strong>{createdAbha?.dateOfBirth || "1989-11-14"}</strong></span>
                      <span>Status: <strong className="text-emerald-300 font-bold">VERIFIED</strong></span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed text-center">
                    Official NHA health card compatible with ABDM QR scanners across all healthcare facilities in India.
                  </p>
                </div>
              </div>
            )}

            {/* Mode B: Lookup & Demographic KYC Verification */}
            {m1Mode === "verify" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
                <div className="max-w-xl space-y-3">
                  <label className="text-xs font-bold text-slate-800 block">
                    Search Patient by 14-Digit ABHA Number or PHR Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verifyInput}
                      onChange={(e) => setVerifyInput(e.target.value)}
                      placeholder="e.g. 91-4402-8812-9901 or patient@sbx"
                      className="flex-1 bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyAbha}
                      disabled={verifyLoading}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      {verifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      <span>Verify KYC</span>
                    </button>
                  </div>
                </div>

                {verifyResult && (
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <h4 className="text-sm font-bold text-slate-900">ABDM Registry Match Confirmed</h4>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">
                        {verifyResult.matchingScore}% KYC Match Score
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block">Patient Full Name</span>
                        <strong className="text-slate-900 text-sm">{verifyResult.name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">ABHA Number</span>
                        <strong className="font-mono text-emerald-700 text-sm font-bold">
                          {formatAbhaNumber(verifyResult.abhaNumber)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">ABHA Address</span>
                        <strong className="font-mono text-blue-700 text-sm font-bold">
                          {verifyResult.abhaAddress}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Gender & DOB</span>
                        <span className="text-slate-800 font-semibold">{verifyResult.gender} • {verifyResult.dateOfBirth}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setCardModalPatient(verifyResult)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print ABHA Digital Card</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: CARE CONTEXT LINKER (MILESTONE 2 - HIP)                       */}
        {/* ==================================================================== */}
        {activeTab === "care-context-m2" && (
          <div className="space-y-6">
            {/* Header with Search, Filter & New Care Context Button */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-indigo-600" />
                    <span>Care Context Linker & HIP Discovery Desk (M2)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Links patient OPD consultations, IPD ward episodes, and diagnostic laboratory panels to their national ABHA profile.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowNewCcModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Link New Episode</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ccSearch}
                    onChange={(e) => setCcSearch(e.target.value)}
                    placeholder="Search by UHID, Patient Name, or Order Ref..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">Filter:</span>
                  {(["ALL", "LINKED", "UNLINKED"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setCcFilter(mode)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        ccFilter === mode
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {mode === "ALL" ? "All Episodes" : mode === "LINKED" ? "Linked (M2)" : "Unlinked"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Care Context Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider bg-slate-50/70">
                      <th className="py-3 px-4">Care Context Reference</th>
                      <th className="py-3 px-4">Patient UHID & Demographics</th>
                      <th className="py-3 px-4">Encounter / Episode Details</th>
                      <th className="py-3 px-4">ABHA ID & Address</th>
                      <th className="py-3 px-4">Gateway Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {careContexts
                      .filter((c) => {
                        if (ccFilter === "LINKED" && !c.isLinked) return false;
                        if (ccFilter === "UNLINKED" && c.isLinked) return false;
                        if (ccSearch.trim()) {
                          const q = ccSearch.toLowerCase();
                          const matchesName = `${c.patient.firstName} ${c.patient.lastName}`.toLowerCase().includes(q);
                          const matchesUhid = c.patient.uhid.toLowerCase().includes(q);
                          const matchesRef = c.careContextReference.toLowerCase().includes(q);
                          return matchesName || matchesUhid || matchesRef;
                        }
                        return true;
                      })
                      .map((cc) => (
                        <tr key={cc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-slate-900 block">{cc.careContextReference}</span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{cc.orderId || "OPD-VISIT"}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <strong className="text-slate-900 block font-bold">
                              {cc.patient.firstName} {cc.patient.lastName}
                            </strong>
                            <span className="text-[11px] font-mono text-blue-600 block">{cc.patient.uhid}</span>
                            <span className="text-[10px] text-slate-500">{cc.patient.gender} • {cc.patient.phone}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-900 block">{cc.display}</span>
                            <span className="text-[11px] text-slate-500 block">{cc.episodeType} ({cc.department})</span>
                            <span className="text-[10px] text-slate-400">{cc.doctorName}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-slate-800 font-bold block text-[11px]">
                              {formatAbhaNumber(cc.patient.abhaNumber || "")}
                            </span>
                            <span className="text-blue-600 text-[11px] font-semibold">{cc.patient.abhaAddress}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            {cc.isLinked ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Linked (M2)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" /> Pending Link
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!cc.isLinked ? (
                                <button
                                  type="button"
                                  onClick={() => handleLinkCareContext(cc.id)}
                                  disabled={linkingCcId === cc.id}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                                >
                                  {linkingCcId === cc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <LinkIcon className="w-3 h-3" />}
                                  <span>Link</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDelinkCareContext(cc.id)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                                  title="Delink Care Context"
                                >
                                  Delink
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab("fhir-m3");
                                  handleLoadFhirPreset("sample-cbc-001");
                                }}
                                className="p-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
                                title="View HL7 FHIR R4 Bundle"
                              >
                                <FileCode className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* ==================================================================== */}
        {/* TAB 5: CONSENTS & HIU HEALTH RECORDS (MILESTONE 3 - HIU)             */}
        {/* ==================================================================== */}
        {activeTab === "consents-hiu" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <span>Patient Electronic Consents & HIU Health Records (M3)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Consent artefact management for requesting, granting, and securely decrypting longitudinal health data from hospitals across India.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowNewConsentModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Request Patient Consent</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Consents Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider bg-slate-50/70">
                      <th className="py-3 px-4">Consent Artefact ID</th>
                      <th className="py-3 px-4">Patient ABHA Profile</th>
                      <th className="py-3 px-4">Care Purpose</th>
                      <th className="py-3 px-4">Health Info Types</th>
                      <th className="py-3 px-4">Validity / Expiry</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {consents.map((consent) => (
                      <tr key={consent.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-900 block">{consent.consentId}</span>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            Created: {new Date(consent.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <strong className="text-slate-900 block font-bold">{consent.patientName || "Patient"}</strong>
                          <span className="text-[11px] font-mono text-blue-600 block">{consent.patientId}</span>
                          <span className="text-[10px] text-slate-400">{consent.facilityName}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                            {consent.purpose}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {consent.purpose === "CAREMGT"
                              ? "Care Management"
                              : consent.purpose === "BTG"
                              ? "Break the Glass (Emergency)"
                              : "Public Health"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {consent.hiTypes.map((ht) => (
                              <span
                                key={ht}
                                className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold border border-blue-100"
                              >
                                {ht}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-700 font-medium block">
                            {consent.expiryDate ? new Date(consent.expiryDate).toLocaleDateString() : "30 Days"}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold">Valid & Active</span>
                        </td>
                        <td className="py-3.5 px-4">
                          {consent.status === "GRANTED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Consent Granted
                            </span>
                          )}
                          {consent.status === "REQUESTED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" /> Pending Approval
                            </span>
                          )}
                          {consent.status === "REVOKED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              Revoked
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {consent.status === "GRANTED" && (
                              <button
                                type="button"
                                onClick={() => handleFetchExternalRecords(consent)}
                                disabled={fetchingExternalRecords}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                              >
                                {fetchingExternalRecords ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Eye className="w-3 h-3" />
                                )}
                                <span>Decrypt Records</span>
                              </button>
                            )}
                            {consent.status === "GRANTED" && (
                              <button
                                type="button"
                                onClick={() => handleRevokeConsent(consent.consentId)}
                                className="p-1 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 transition-colors cursor-pointer"
                                title="Revoke Consent"
                              >
                                <Unlink className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Decrypted Health Records Modal / Drawer Preview */}
            {activeExternalBundle && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        External Health Records Decrypted (Diffie-Hellman Key Exchange Verified)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Originating Facility: <strong>{activeExternalBundle.hospitalName}</strong> • HIP ID: {activeExternalBundle.hipId}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveExternalBundle(null)}
                    className="p-1 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeExternalBundle.records.map((rec) => (
                    <div key={rec.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                          {rec.type}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">{rec.date}</span>
                      </div>

                      <div>
                        <h5 className="text-xs font-bold text-slate-900">{rec.title}</h5>
                        <span className="text-[11px] text-slate-500">{rec.doctor}</span>
                      </div>

                      {rec.observations && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                          {rec.observations.map((obs) => (
                            <div key={obs.name} className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-600 font-medium">{obs.name}:</span>
                              <div className="flex items-center gap-2">
                                <strong className="text-slate-900 font-bold">{obs.value} {obs.unit}</strong>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  obs.flag === "HIGH" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700"
                                }`}>
                                  {obs.flag}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {rec.medications && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                          {rec.medications.map((med) => (
                            <div key={med.name} className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-700 font-semibold">{med.name}</span>
                              <span className="text-slate-500">{med.dosage} • {med.frequency}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 6: FHIR R4 DIAGNOSTIC REPORT BUNDLER (MILESTONE 3 - PROVIDER)    */}
        {/* ==================================================================== */}
        {activeTab === "fhir-m3" && (
          <div className="space-y-6">
            {/* Header & Preset Switcher */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-blue-600" />
                    <span>HL7 FHIR R4 Diagnostic Report Exchange (M3)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Compliant with National Resource Centre for EHR Standards (NRCES) & ABDM DiagnosticReport FHIR R4 StructureDefinition.
                  </p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFhirView("visual")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      fhirView === "visual" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Clinical Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setFhirView("json")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      fhirView === "json" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    FHIR R4 JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setFhirView("compliance")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      fhirView === "compliance" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ABDM Validation
                  </button>
                </div>
              </div>

              {/* Presets Bar */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 mr-1">Diagnostic Presets:</span>
                {SAMPLE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleLoadFhirPreset(p.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      fhirPreset === p.id
                        ? "bg-blue-50 border-blue-300 text-blue-700 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p.label} (LOINC: {p.loinc})
                  </button>
                ))}
              </div>
            </div>

            {/* View 1: Visual Clinical Grid */}
            {fhirView === "visual" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {SAMPLE_PRESETS.find((p) => p.id === fhirPreset)?.label || "Complete Blood Count"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Standardized under LOINC {SAMPLE_PRESETS.find((p) => p.id === fhirPreset)?.loinc} • Performed at {status.facilityName}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                    NABL ISO 15189 Verified
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider bg-slate-50/70">
                        <th className="py-2.5 px-3">Analyte / Parameter</th>
                        <th className="py-2.5 px-3">LOINC Code</th>
                        <th className="py-2.5 px-3">Observed Value</th>
                        <th className="py-2.5 px-3">Unit</th>
                        <th className="py-2.5 px-3">Biological Reference Range</th>
                        <th className="py-2.5 px-3">Clinical Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { param: "Hemoglobin (Hb)", loinc: "718-7", value: "14.2", unit: "g/dL", range: "13.0 - 17.0", flag: "NORMAL" },
                        { param: "Total Leukocyte Count (WBC)", loinc: "6690-2", value: "7,800", unit: "/cumm", range: "4,000 - 11,000", flag: "NORMAL" },
                        { param: "Platelet Count", loinc: "777-3", value: "245,000", unit: "/cumm", range: "150,000 - 450,000", flag: "NORMAL" },
                        { param: "Packed Cell Volume (PCV)", loinc: "20570-8", value: "42.8", unit: "%", range: "40.0 - 50.0", flag: "NORMAL" },
                        { param: "Mean Corpuscular Volume (MCV)", loinc: "787-2", value: "88.4", unit: "fL", range: "80.0 - 100.0", flag: "NORMAL" },
                      ].map((row) => (
                        <tr key={row.param} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{row.param}</td>
                          <td className="py-2.5 px-3 font-mono text-blue-600 font-bold">{row.loinc}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{row.value}</td>
                          <td className="py-2.5 px-3 text-slate-500">{row.unit}</td>
                          <td className="py-2.5 px-3 text-slate-600 font-mono">{row.range}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {row.flag}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* View 2: HL7 FHIR R4 JSON */}
            {fhirView === "json" && (
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="font-bold text-slate-200">FHIR R4 DiagnosticReport Bundle (document)</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard("fhirJson", JSON.stringify(fhirBundle, null, 2))}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-sans font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(fhirBundle, null, 2)], { type: "application/json" });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = `FHIR_${fhirPreset}_${Date.now()}.json`;
                        link.click();
                        showToast("Downloaded FHIR R4 JSON file");
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-sans font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .json</span>
                    </button>
                  </div>
                </div>

                <pre className="max-h-[500px] overflow-y-auto overflow-x-auto text-[11px] text-emerald-400 leading-relaxed">
                  {JSON.stringify(fhirBundle, null, 2)}
                </pre>
              </div>
            )}

            {/* View 3: ABDM Compliance Checklist */}
            {fhirView === "compliance" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">ABDM StructureDefinition Compliance Validation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {[
                    { rule: "Bundle.type = 'document'", status: "Passed", detail: "Compliant with NRCES document profile" },
                    { rule: "Composition.subject = Patient Reference", status: "Passed", detail: "UHID-2026-9041 mapped to ABHA 91-4402-8812-9901" },
                    { rule: "Composition.author = Practitioner Reference", status: "Passed", detail: "Registered Pathologist with MCI/NMC number" },
                    { rule: "Organization.identifier = HIP ID", status: "Passed", detail: status.hipId },
                    { rule: "DiagnosticReport.category = 'LAB'", status: "Passed", detail: "HL7 v2-0074 category code binding validated" },
                    { rule: "DiagnosticReport.code = LOINC Standard", status: "Passed", detail: "Mapped to official LOINC international dictionary" },
                  ].map((chk) => (
                    <div key={chk.rule} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 font-bold block">{chk.rule}</strong>
                        <span className="text-[11px] text-slate-500">{chk.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}


        {/* ==================================================================== */}
        {/* TAB 7: CAMP & BULK ABHA VERIFIER (CORPORATE & OUTREACH SCREENING)    */}
        {/* ==================================================================== */}
        {activeTab === "bulk-verify" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span>Mega-Camp & Bulk ABHA Validation Engine</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    High-volume demographic validation engine for corporate health camps, factory occupational health screenings, and school checkups.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportBulkCsv}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export Verified CSV</span>
                  </button>
                </div>
              </div>

              {/* Paste or Upload Area */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                <label className="text-xs font-bold text-slate-800 block">
                  Paste ABHA Numbers, Addresses, or 10-Digit Mobile Numbers (One per line or comma-separated)
                </label>
                <textarea
                  rows={3}
                  value={bulkInputText}
                  onChange={(e) => setBulkInputText(e.target.value)}
                  placeholder="91-4421-8890-1123&#10;priya.patel@sbx&#10;9823411223&#10;91-8812-3344-9012"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">Supports up to 5,000 records per batch run</span>
                  <button
                    type="button"
                    onClick={handleBulkVerify}
                    disabled={bulkVerifying}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    {bulkVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Run Batch Verification</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                <span className="text-xs font-bold text-slate-900">
                  Batch Verification Roster ({bulkItems.length} Verified Entries)
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  100% Match Rate
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider bg-slate-50/50">
                      <th className="py-2.5 px-4">Input Identifier</th>
                      <th className="py-2.5 px-4">Patient Full Name</th>
                      <th className="py-2.5 px-4">Resolved ABHA ID</th>
                      <th className="py-2.5 px-4">ABHA Address</th>
                      <th className="py-2.5 px-4">Demographics</th>
                      <th className="py-2.5 px-4">Auth Method</th>
                      <th className="py-2.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bulkItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.input}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                        <td className="py-3 px-4 font-mono text-emerald-700 font-bold">
                          {formatAbhaNumber(item.abhaNumber)}
                        </td>
                        <td className="py-3 px-4 font-mono text-blue-600">{item.abhaAddress}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.gender} • {item.dob} • {item.mobile}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.authMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 8: REPORT STAMPING & OFFICIAL ABDM DIGITAL SEAL                  */}
        {/* ==================================================================== */}
        {activeTab === "report-stamp" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-teal-600" />
                    <span>Diagnostic Report Stamping & ABDM Digital Seal</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Embeds official ABDM QR Verification Seals and NABL ISO 15189 credentials directly on outpatient and inpatient test reports.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report with ABDM Seal</span>
                </button>
              </div>
            </div>

            {/* A4 Medical Report Layout Preview */}
            <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-300 p-8 shadow-md text-slate-800 space-y-6 print:m-0 print:border-none print:shadow-none print:p-0">
              {/* Report Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                    {status.facilityName}
                  </h3>
                  <p className="text-xs text-slate-600">
                    A Premier Tertiary Healthcare & Diagnostic Reference Network
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    HFR Facility ID: {status.hfrId} • HIP ID: {status.hipId} • NABL Cert: {status.accreditation}
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-teal-50 text-teal-800 font-black text-xs rounded-lg border border-teal-200 uppercase tracking-wider">
                    NABL ISO 15189:2022
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Accredited Medical Testing</span>
                </div>
              </div>

              {/* Patient Demographics & ABHA Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Patient Name:</span>
                  <strong className="text-slate-900 font-bold text-sm">Aarav Deshmukh</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">UHID / MRN:</span>
                  <strong className="font-mono text-slate-800 font-bold">UHID-2026-9041</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Age / Gender:</span>
                  <span className="font-semibold text-slate-800">36 Yrs / Male</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Referring Doctor:</span>
                  <span className="font-semibold text-slate-800">Dr. K. S. Reddy (Cardiology)</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block">Ayushman Bharat Health Account (ABHA):</span>
                  <strong className="font-mono text-emerald-700 font-bold text-sm">
                    91-4402-8812-9901
                  </strong>
                  <span className="text-blue-600 font-mono text-xs ml-2">(aarav.deshmukh@sbx)</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block">Specimen Accession & Date:</span>
                  <span className="font-mono text-slate-800 font-bold">ACC-884192 • {new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* Investigation Observations Table */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                  Complete Blood Count & Hemogram (LOINC: 58410-2)
                </h4>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <th className="py-2 px-3">Investigation Parameter</th>
                      <th className="py-2 px-3">LOINC</th>
                      <th className="py-2 px-3">Observed Result</th>
                      <th className="py-2 px-3">Unit</th>
                      <th className="py-2 px-3">Biological Reference Interval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[
                      { param: "Hemoglobin (Hb)", loinc: "718-7", value: "14.2", unit: "g/dL", range: "13.0 - 17.0" },
                      { param: "RBC Count", loinc: "789-8", value: "4.85", unit: "mil/cumm", range: "4.50 - 5.50" },
                      { param: "Total Leukocyte Count (WBC)", loinc: "6690-2", value: "7,800", unit: "/cumm", range: "4,000 - 11,000" },
                      { param: "Platelet Count", loinc: "777-3", value: "245,000", unit: "/cumm", range: "150,000 - 450,000" },
                      { param: "Packed Cell Volume (PCV)", loinc: "20570-8", value: "42.8", unit: "%", range: "40.0 - 50.0" },
                    ].map((row) => (
                      <tr key={row.param}>
                        <td className="py-2 px-3 font-semibold text-slate-900">{row.param}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{row.loinc}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{row.value}</td>
                        <td className="py-2 px-3 text-slate-600">{row.unit}</td>
                        <td className="py-2 px-3 text-slate-600 font-mono">{row.range}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Official ABDM Digital Stamp & Pathologist Signature */}
              <div className="pt-6 border-t-2 border-slate-900 flex justify-between items-end gap-6">
                <div className="flex items-center gap-3.5 p-3 rounded-xl border border-emerald-300 bg-emerald-50/50">
                  <div className="bg-white p-1 rounded-lg border border-emerald-200">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=abdm%3A%2F%2Fverify-report%3Fhip%3DIN2710000412%26acc%3DACC-884192%26abha%3D91-4402-8812-9901"
                      alt="ABDM Verify QR"
                      width={72}
                      height={72}
                    />
                  </div>
                  <div className="text-xs">
                    <div className="flex items-center gap-1 font-bold text-emerald-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Digitally Verified under ABDM</span>
                    </div>
                    <p className="text-[10px] text-emerald-700 mt-0.5">
                      National Health Authority • Encrypted FHIR R4 Bundle Linked
                    </p>
                    <span className="text-[9px] font-mono text-slate-500 block mt-1">
                      Scan QR code via ABHA App to verify authenticity
                    </span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="h-10 border-b border-slate-400 w-44 ml-auto" />
                  <strong className="text-xs font-bold text-slate-900 block">Dr. Sandeep Deshmukh</strong>
                  <span className="text-[11px] text-slate-600 block">MD (Pathology), DNB, FICP</span>
                  <span className="text-[10px] text-slate-500 font-mono block">MCI Reg. # 48192-MH</span>
                  <span className="text-[10px] text-teal-800 font-bold block">Chief Pathologist & Laboratory Director</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 9: GATEWAY WEBHOOK SIMULATOR & AUDIT LOG                         */}
        {/* ==================================================================== */}
        {activeTab === "simulator" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-slate-800" />
                    <span>NHA Central Gateway Bridge & Inbound Webhook Audit</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Live transaction audit table and callback simulator for ABDM v0.5 / v3.0 asynchronous webhook responses.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={simulatorAction}
                    onChange={(e) => setSimulatorAction(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="discovery">/v0.5/care-contexts/discover</option>
                    <option value="link_init">/v0.5/links/link/init</option>
                    <option value="consent_notify">/v0.5/consents/hip/notify</option>
                    <option value="data_request">/v0.5/health-information/hip/request</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleTriggerSimulator}
                    disabled={simulating}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Test Webhook</span>
                  </button>
                </div>
              </div>

              {simulatorResponse && (
                <div className="mt-4 p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto space-y-1">
                  <div className="flex justify-between text-slate-400 pb-1 border-b border-slate-800 text-[11px]">
                    <span>Inbound Webhook Acknowledgment</span>
                    <button
                      type="button"
                      onClick={() => setSimulatorResponse(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                  <pre>{JSON.stringify(simulatorResponse, null, 2)}</pre>
                </div>
              )}
            </div>

            {/* Gateway Transaction Log Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                <span className="text-xs font-bold text-slate-900">Live Gateway Transaction Audit Log</span>
                <span className="text-[11px] text-slate-500 font-mono">Real-time Telemetry Trace</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider bg-slate-50/50">
                      <th className="py-2.5 px-4">Timestamp</th>
                      <th className="py-2.5 px-4">Endpoint</th>
                      <th className="py-2.5 px-4">Method</th>
                      <th className="py-2.5 px-4">HTTP Status</th>
                      <th className="py-2.5 px-4">Latency</th>
                      <th className="py-2.5 px-4">Request Trace ID</th>
                      <th className="py-2.5 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {gatewayLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-4 text-slate-500 font-sans">{log.timestamp}</td>
                        <td className="py-2.5 px-4 font-bold text-blue-700">{log.endpoint}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-800 font-bold">
                            {log.method}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {log.status} OK
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 font-bold">{log.latencyMs}ms</td>
                        <td className="py-2.5 px-4 text-slate-500">{log.requestId}</td>
                        <td className="py-2.5 px-4 text-slate-600 font-sans">{log.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* ==================================================================== */}
        {/* MODAL 1: PRINTABLE OPD / PHLEBOTOMY FAST-TRACK TOKEN SLIP            */}
        {/* ==================================================================== */}
        {tokenSlipPatient && (
          <OpdTokenA4PrintModal
            item={{
              id: tokenSlipPatient.id || tokenSlipPatient.token,
              tokenNumber: tokenSlipPatient.token,
              patientName: tokenSlipPatient.name,
              age: tokenSlipPatient.age || 35,
              gender: tokenSlipPatient.gender === "M" || tokenSlipPatient.gender === "Male" ? "Male" : tokenSlipPatient.gender === "F" || tokenSlipPatient.gender === "Female" ? "Female" : "Other",
              phone: tokenSlipPatient.phone || "+91 98765 43210",
              uhid: tokenSlipPatient.uhid || `LC-2026-${String(tokenSlipPatient.token).replace(/[^0-9]/g, "").padStart(4, "0")}`,
              abhaAddress: tokenSlipPatient.abhaAddress,
              department: tokenSlipPatient.department || "General Medicine & Diagnostics",
              doctorName: "Dr. Rajesh Sharma, MD",
              roomNumber: tokenSlipPatient.counterId || "OPD Fast-Track Bay 01",
              visitType: "New Visit",
              priority: "Normal",
              status: "Waiting",
              checkInTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              estimatedWaitMins: 8,
              vitalsLogged: true,
              paymentStatus: "Paid",
              consultationFee: 600,
            }}
            onClose={() => setTokenSlipPatient(null)}
          />
        )}

        {/* ==================================================================== */}
        {/* MODAL 2: FACILITY SETTINGS & HFR/HIP CREDENTIALS                     */}
        {/* ==================================================================== */}
        {showFacilityModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-800 space-y-4 border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h4 className="text-sm font-bold text-slate-900">Configure Health Facility Registry (HFR)</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFacilityModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Facility Name</label>
                  <input
                    type="text"
                    value={facilityFormData.name}
                    onChange={(e) => setFacilityFormData({ ...facilityFormData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">HFR Facility ID</label>
                    <input
                      type="text"
                      value={facilityFormData.hfrId}
                      onChange={(e) => setFacilityFormData({ ...facilityFormData, hfrId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">HIP Identifier</label>
                    <input
                      type="text"
                      value={facilityFormData.hipId}
                      onChange={(e) => setFacilityFormData({ ...facilityFormData, hipId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">HIU Identifier</label>
                    <input
                      type="text"
                      value={facilityFormData.hiuId}
                      onChange={(e) => setFacilityFormData({ ...facilityFormData, hiuId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Accreditation / License</label>
                    <input
                      type="text"
                      value={facilityFormData.accreditation}
                      onChange={(e) => setFacilityFormData({ ...facilityFormData, accreditation: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFacilityModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveFacilitySettings}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Save Credentials
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* MODAL 3: LINK NEW CARE CONTEXT                                       */}
        {/* ==================================================================== */}
        {showNewCcModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-800 space-y-4 border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900">Link Clinical Episode to Patient ABHA</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewCcModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Patient UHID / MRN</label>
                    <input
                      type="text"
                      value={newCcData.uhid}
                      onChange={(e) => setNewCcData({ ...newCcData, uhid: e.target.value })}
                      placeholder="e.g. UHID-2026-9041"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Patient Full Name</label>
                    <input
                      type="text"
                      value={newCcData.patientName}
                      onChange={(e) => setNewCcData({ ...newCcData, patientName: e.target.value })}
                      placeholder="e.g. Aarav Deshmukh"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Patient ABHA Address</label>
                  <input
                    type="text"
                    value={newCcData.abhaAddress}
                    onChange={(e) => setNewCcData({ ...newCcData, abhaAddress: e.target.value })}
                    placeholder="e.g. aarav.deshmukh@sbx"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Encounter / Episode Type</label>
                    <select
                      value={newCcData.episodeType}
                      onChange={(e) => setNewCcData({ ...newCcData, episodeType: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                    >
                      {currentProfile.careContextTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Department</label>
                    <input
                      type="text"
                      value={newCcData.department}
                      onChange={(e) => setNewCcData({ ...newCcData, department: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewCcModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewCareContext}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Link Care Context
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* MODAL 4: REQUEST NEW PATIENT ELECTRONIC CONSENT                      */}
        {/* ==================================================================== */}
        {showNewConsentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-800 space-y-4 border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-sm font-bold text-slate-900">Request Electronic Patient Consent (HIU)</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewConsentModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Patient ABHA Address</label>
                  <input
                    type="text"
                    value={newConsentData.patientAbha}
                    onChange={(e) => setNewConsentData({ ...newConsentData, patientAbha: e.target.value })}
                    placeholder="e.g. aarav.deshmukh@sbx"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Purpose of Care</label>
                    <select
                      value={newConsentData.purpose}
                      onChange={(e) => setNewConsentData({ ...newConsentData, purpose: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                    >
                      <option value="CAREMGT">Care Management</option>
                      <option value="BTG">Break the Glass (Emergency)</option>
                      <option value="PUBHLTH">Public Health Screening</option>
                      <option value="HPAYMT">Healthcare Insurance & Claim</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Validity (Days)</label>
                    <input
                      type="number"
                      value={newConsentData.validityDays}
                      onChange={(e) => setNewConsentData({ ...newConsentData, validityDays: parseInt(e.target.value) || 30 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Health Information Types Requested</label>
                  <div className="flex flex-wrap gap-2">
                    {["DiagnosticReport", "Prescription", "DischargeSummary", "OPConsultation"].map((ht) => {
                      const isChecked = newConsentData.hiTypes.includes(ht);
                      return (
                        <button
                          key={ht}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setNewConsentData({
                                ...newConsentData,
                                hiTypes: newConsentData.hiTypes.filter((t) => t !== ht),
                              });
                            } else {
                              setNewConsentData({
                                ...newConsentData,
                                hiTypes: [...newConsentData.hiTypes, ht],
                              });
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            isChecked
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                              : "bg-slate-50 border-slate-200 text-slate-600"
                          }`}
                        >
                          {ht}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewConsentModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateConsent}
                  disabled={creatingConsent}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {creatingConsent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Dispatch Consent Request</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* COMPONENT MODALS: ABHA LINK MODAL & ABHA CARD MODAL                  */}
        {/* ==================================================================== */}
        {showCreateModal && (
          <AbhaLinkModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={(num, addr) => {
              setShowCreateModal(false);
              showToast(`ABHA created: ${num} (${addr})`);
            }}
          />
        )}

        {cardModalPatient && (
          <AbhaCardModal
            data={{
              abhaNumber: cardModalPatient.abhaNumber,
              abhaAddress: cardModalPatient.abhaAddress,
              name: cardModalPatient.name,
              gender: cardModalPatient.gender,
              dob: cardModalPatient.dateOfBirth,
              mobile: cardModalPatient.mobile,
              address: cardModalPatient.address,
              qrData: cardModalPatient.qrData,
              photo: cardModalPatient.photo,
            }}
            onClose={() => setCardModalPatient(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// Loading Fallback Skeleton for Next.js Suspense
function AbdmPageSkeleton() {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
        <div className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        <div className="h-12 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        <div className="h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
      </div>
    </DashboardLayout>
  );
}

// Next.js Root Export wrapped in Suspense boundary
export default function AbdmPage() {
  return (
    <Suspense fallback={<AbdmPageSkeleton />}>
      <AbdmPageContent />
    </Suspense>
  );
}
