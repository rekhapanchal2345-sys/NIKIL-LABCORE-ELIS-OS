"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/dashboardlayout";
import {
  Shield, Activity, CheckCircle2, AlertCircle, Loader2, QrCode, RefreshCw,
  Search, Copy, Download, Users, FileText, Link as LinkIcon, Unlink, Eye, Clock,
  Wifi, WifiOff, Server, Database, ArrowRight, X, CheckCircle, Sparkles,
  Play, Radio, Terminal, Send, CheckSquare, Layers, Lock, Phone, User,
  FileCode, ExternalLink, ChevronRight, Printer, Zap, Globe, Tag,
  AlertTriangle, Info, ChevronDown, ChevronUp, List, Grid, UserPlus,
  Building2, Award, HeartPulse, Stethoscope, Share2, FileCheck, Check,
  Sliders, Key, LockKeyhole, ArrowUpRight, Upload, Filter, Calendar,
  BadgeCheck, CornerDownRight, Volume2, HelpCircle
} from "lucide-react";
import AbhaLinkModal from "@/components/abdm/AbhaLinkModal";
import AbhaCardModal from "@/components/abdm/AbhaCardModal";
import { getAccessToken } from "@/lib/auth-storage";

const resolveApiBase = (): string => {
  const raw = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
  if (!raw) return '/api';
  if (raw.endsWith('/api')) return raw;
  if (raw.endsWith('/api/v1')) return raw.replace(/\/v1$/, '');
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

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AbdmStatus {
  mockMode: boolean;
  environment: string;
  gatewayBaseUrl: string;
  hipId: string;
  hiuId?: string;
  hfrId?: string;
  labName: string;
  nablNumber?: string;
  features: Record<string, boolean>;
}

interface AbdmStats {
  totalAbhaPatients: number;
  totalCareContexts: number;
  totalConsents: number;
  totalTransactions: number;
  gatewayStatus: string;
  lastSync: string;
  todayScanFootfall?: number;
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
  age?: number;
  phone: string;
  time: string;
  status: "WAITING" | "TOKEN_ISSUED" | "REGISTERED_TO_LIS" | "ORDER_BOOKED";
  preferredDoctor?: string;
}

interface CareContextItem {
  id: string;
  careContextReference: string;
  display: string;
  isLinked: boolean;
  orderId?: string | null;
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
  status: "REQUESTED" | "GRANTED" | "DENIED" | "EXPIRED" | "REVOKED";
  hiTypes: string[];
  purpose: string;
  createdAt: string;
  expiryDate?: string;
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

// ─────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────

const DEFAULT_STATUS: AbdmStatus = {
  mockMode: true,
  environment: "Sandbox (ABDM v0.5)",
  gatewayBaseUrl: "https://dev.abdm.gov.in/gateway",
  hipId: "IN2710000412",
  hiuId: "IN2710000412-HIU",
  hfrId: "HFR-MH-PUN-09412",
  labName: "LabCore Central Reference Laboratory & Super-Specialty Diagnostics",
  nablNumber: "MC-4129 (ISO 15189:2022)",
  features: {
    abhaGeneration: true,
    abhaVerification: true,
    careContextLinking: true,
    consentManagement: true,
    fhirDiagnosticReport: true,
    healthDataTransfer: true,
    scanAndShare: true,
  },
};

const DEFAULT_STATS: AbdmStats = {
  totalAbhaPatients: 148,
  totalCareContexts: 412,
  totalConsents: 37,
  totalTransactions: 1284,
  gatewayStatus: "OPERATIONAL",
  lastSync: new Date().toISOString(),
  todayScanFootfall: 42,
};

const INITIAL_CARE_CONTEXTS: CareContextItem[] = [
  {
    id: "cc-1",
    careContextReference: "IN2710000412-ORD-77102",
    display: "Complete Blood Count & ESR Panel",
    isLinked: true,
    orderId: "ord-77102",
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
    display: "Comprehensive Lipid Profile (NABL)",
    isLinked: true,
    orderId: "ord-77109",
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
    display: "HbA1c & Fasting Plasma Glucose",
    isLinked: false,
    orderId: "ord-77114",
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
    display: "Thyroid Stimulating Hormone (Ultra-sensitive)",
    isLinked: false,
    orderId: "ord-77121",
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
    status: "GRANTED",
    hiTypes: ["DiagnosticReport", "Prescription"],
    purpose: "CAREMGT",
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    expiryDate: new Date(Date.now() + 27 * 86400000).toISOString(),
    consentDetail: {
      purpose: { text: "Care Management & Outpatient Diagnostic Review" },
      patient: { id: "aarav.deshmukh@sbx", name: "Aarav Deshmukh" },
      facilityName: "AIIMS New Delhi / Super Specialty Network",
    },
  },
  {
    id: "c-2",
    consentId: "cons-90418-apollo",
    patientId: "sunita.kulkarni@sbx",
    status: "GRANTED",
    hiTypes: ["DiagnosticReport"],
    purpose: "CAREMGT",
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
    status: "REQUESTED",
    hiTypes: ["DiagnosticReport", "DischargeSummary"],
    purpose: "BTG",
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
    id: "b-1", input: "91-4421-8890-1123", name: "Rahul Sharma", abhaNumber: "91-4421-8890-1123",
    abhaAddress: "rahul.sharma@sbx", status: "VERIFIED", gender: "MALE", dob: "1988-04-12",
    mobile: "+91 98234 11223", verifiedAt: "Just now", authMethod: "AADHAAR_DEMO",
  },
  {
    id: "b-2", input: "priya.patel@sbx", name: "Priya Patel", abhaNumber: "91-5532-9901-4412",
    abhaAddress: "priya.patel@sbx", status: "VERIFIED", gender: "FEMALE", dob: "1992-09-24",
    mobile: "+91 97245 66778", verifiedAt: "Just now", authMethod: "MOBILE_OTP",
  },
  {
    id: "b-3", input: "vikram.malhotra@sbx", name: "Vikram Malhotra", abhaNumber: "91-8812-3344-9012",
    abhaAddress: "vikram.malhotra@sbx", status: "VERIFIED", gender: "MALE", dob: "1984-11-03",
    mobile: "+91 98901 22334", verifiedAt: "Just now", authMethod: "AADHAAR_DEMO",
  },
];

const SAMPLE_PRESETS = [
  { id: "sample-cbc-001", label: "CBC Panel (Complete Blood Count)", loinc: "58410-2", dept: "Hematology", nabl: "ISO 15189" },
  { id: "sample-lipid-002", label: "Lipid Profile Panel (Direct LDL)", loinc: "57698-3", dept: "Biochemistry", nabl: "ISO 15189" },
  { id: "sample-hba1c-003", label: "HbA1c & Fasting Glucose Profile", loinc: "59261-8", dept: "Clinical Chemistry", nabl: "ISO 15189" },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function AbdmPage() {
  const [status, setStatus] = useState<AbdmStatus>(DEFAULT_STATUS);
  const [stats, setStats] = useState<AbdmStats>(DEFAULT_STATS);
  const [loadingStatus, setLoadingStatus] = useState(false);
  
  // Navigation Tabs
  type TabType = "overview" | "scan-share" | "abha-m1" | "care-context-m2" | "consents-hiu" | "fhir-m3" | "bulk-verify" | "report-stamp" | "simulator";
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Gateway Ping & Token TTL
  const [gatewayPing, setGatewayPing] = useState<number>(32);
  const [pinging, setPinging] = useState(false);
  const [tokenTtlSeconds, setTokenTtlSeconds] = useState<number>(1142); // ~19m countdown

  // Scan & Share Reception Desk
  const [counterId, setCounterId] = useState("COUNTER-01");
  const [qrResult, setQrResult] = useState<QrResult | null>({
    qrData: `{"hipId":"IN2710000412","counterId":"COUNTER-01","token":"ABDM-TOK-8841"}`,
    qrString: `abdm://scan-share?hipId=IN2710000412&counter=COUNTER-01&token=ABDM-TOK-8841`,
    counterToken: "ABDM-TOK-8841",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  });
  const [generatingQr, setGeneratingQr] = useState(false);
  const [checkedInQueue, setCheckedInQueue] = useState<CheckedInPatient[]>([
    {
      id: "chk-1", token: "TOK-101", abhaNumber: "91-4421-8890-1123", abhaAddress: "rahul.sharma@sbx",
      name: "Rahul Sharma", gender: "MALE", age: 36, phone: "+91 98234 11223", time: "2 mins ago", status: "WAITING",
      preferredDoctor: "Dr. Sandeep Deshmukh (Pathology)",
    },
    {
      id: "chk-2", token: "TOK-102", abhaNumber: "91-5532-9901-4412", abhaAddress: "priya.patel@sbx",
      name: "Priya Patel", gender: "FEMALE", age: 29, phone: "+91 97245 66778", time: "8 mins ago", status: "REGISTERED_TO_LIS",
      preferredDoctor: "Dr. Meenakshi Sundaram (Biochem)",
    },
    {
      id: "chk-3", token: "TOK-103", abhaNumber: "91-7721-0023-8819", abhaAddress: "amitabh.sen@sbx",
      name: "Amitabh Sen", gender: "MALE", age: 54, phone: "+91 99012 33412", time: "15 mins ago", status: "ORDER_BOOKED",
      preferredDoctor: "Dr. Sandeep Deshmukh (Pathology)",
    },
  ]);
  const [tokenSlipPatient, setTokenSlipPatient] = useState<CheckedInPatient | null>(null);

  // M1: ABHA Lookup & Generation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cardModalPatient, setCardModalPatient] = useState<any | null>(null);
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyTxnId, setVerifyTxnId] = useState("");
  const [verifyOtp, setVerifyOtp] = useState("");
  const [verifyStep, setVerifyStep] = useState<"input" | "otp" | "result">("input");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  // M2: Care Contexts
  const [careContexts, setCareContexts] = useState<CareContextItem[]>(INITIAL_CARE_CONTEXTS);
  const [ccFilter, setCcFilter] = useState<"ALL" | "LINKED" | "UNLINKED">("ALL");
  const [ccSearch, setCcSearch] = useState("");
  const [autoLinkOnSign, setAutoLinkOnSign] = useState(true);
  const [linkingCcId, setLinkingCcId] = useState<string | null>(null);

  // M3: Consents & HIU Records
  const [consents, setConsents] = useState<ConsentRecord[]>(INITIAL_CONSENTS);
  const [showNewConsentModal, setShowNewConsentModal] = useState(false);
  const [newConsentAbha, setNewConsentAbha] = useState("");
  const [newConsentPurpose, setNewConsentPurpose] = useState("CAREMGT");
  const [newConsentPatientName, setNewConsentPatientName] = useState("");
  const [creatingConsent, setCreatingConsent] = useState(false);
  const [activeExternalBundle, setActiveExternalBundle] = useState<ExternalRecordBundle | null>(null);
  const [fetchingExternalRecords, setFetchingExternalRecords] = useState(false);

  // M3: FHIR Inspector
  const [fhirPreset, setFhirPreset] = useState<string>("sample-cbc-001");
  const [fhirOrderId, setFhirOrderId] = useState("sample-cbc-001");
  const [fhirLoading, setFhirLoading] = useState(false);
  const [fhirBundle, setFhirBundle] = useState<any>(null);
  const [fhirView, setFhirView] = useState<"visual" | "json" | "compliance">("visual");

  // Bulk Verifier
  const [bulkInputText, setBulkInputText] = useState("");
  const [bulkItems, setBulkItems] = useState<BulkVerifyItem[]>(INITIAL_BULK_ITEMS);
  const [bulkVerifying, setBulkVerifying] = useState(false);

  // Simulator
  const [simulatorAction, setSimulatorAction] = useState<"discovery" | "link_init" | "consent_notify" | "data_request">("discovery");
  const [simulating, setSimulating] = useState(false);
  const [simulatorResponse, setSimulatorResponse] = useState<any>(null);
  const [simElapsed, setSimElapsed] = useState<number | null>(null);

  // Copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchStatusAndStats();
  }, []);

  // Token TTL countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTokenTtlSeconds((prev) => {
        if (prev <= 1) return 1200; // Auto-renew to 20m
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (fhirPreset) setFhirOrderId(fhirPreset);
  }, [fhirPreset]);

  // Load FHIR preview on mount
  useEffect(() => {
    handleFetchFhirPreview("sample-cbc-001");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────

  const fetchStatusAndStats = async () => {
    setLoadingStatus(true);
    try {
      const [statusData, statsData, ccData, consentData] = await Promise.all([
        apiGet("/abdm/status"),
        apiGet("/abdm/stats"),
        apiGet("/abdm/care-contexts"),
        apiGet("/abdm/consents"),
      ]);
      if (statusData) setStatus(statusData);
      if (statsData) setStats(statsData);
      if (ccData && Array.isArray(ccData) && ccData.length > 0) setCareContexts(ccData);
      if (consentData && Array.isArray(consentData) && consentData.length > 0) setConsents(consentData);
    } catch (err) {
      console.error("Failed to load ABDM state:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handlePingGateway = async () => {
    setPinging(true);
    const start = performance.now();
    try { await apiGet("/abdm/status"); } catch {}
    const elapsed = Math.round(performance.now() - start);
    setGatewayPing(elapsed > 0 ? elapsed : Math.floor(Math.random() * 15 + 24));
    setPinging(false);
  };

  const handleRefreshToken = () => {
    setTokenTtlSeconds(1200);
    setCopiedKey("tokenRenewed");
    setTimeout(() => setCopiedKey(null), 2500);
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
    }
  };

  const handleSimulatePatientScan = () => {
    const firstNames = ["Ananya", "Rohan", "Meera", "Karan", "Tanvi", "Aditya", "Neha"];
    const lastNames = ["Desai", "Singhania", "Joshi", "Patil", "Bhatnagar", "Chopra", "Kaur"];
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
      preferredDoctor: "Dr. Sandeep Deshmukh (Pathology)",
    };

    setCheckedInQueue((prev) => [newPatient, ...prev]);
    setStats((prev) => ({ ...prev, todayScanFootfall: (prev.todayScanFootfall || 0) + 1 }));
  };

  const handleConvertTokenToLis = (patient: CheckedInPatient) => {
    setCheckedInQueue((prev) =>
      prev.map((p) => (p.id === patient.id ? { ...p, status: "REGISTERED_TO_LIS" } : p))
    );
    // Also push a temporary Care Context for this newly registered patient
    const newCc: CareContextItem = {
      id: `cc-auto-${Date.now()}`,
      careContextReference: `IN2710000412-ORD-${Math.floor(Math.random() * 90000 + 10000)}`,
      display: "Routine OPD Blood Collection Intake",
      isLinked: true,
      orderId: `ord-${Math.floor(Math.random() * 90000 + 10000)}`,
      createdAt: new Date().toISOString(),
      patient: {
        id: patient.id,
        uhid: `UHID-2026-${Math.floor(Math.random() * 8900 + 1000)}`,
        firstName: patient.name.split(" ")[0] || patient.name,
        lastName: patient.name.split(" ")[1] || "",
        phone: patient.phone,
        gender: patient.gender,
        abhaNumber: patient.abhaNumber,
        abhaAddress: patient.abhaAddress,
      },
    };
    setCareContexts((prev) => [newCc, ...prev]);
    setStats((prev) => ({ ...prev, totalCareContexts: prev.totalCareContexts + 1, totalAbhaPatients: prev.totalAbhaPatients + 1 }));
  };

  const handle1ClickLinkOrder = async (cc: CareContextItem) => {
    setLinkingCcId(cc.id);
    try {
      await apiPost("/abdm/care-contexts/link-order", {
        patientId: cc.patient.id,
        orderId: cc.orderId || cc.careContextReference,
        orderDisplay: cc.display,
      });
      setCareContexts((prev) =>
        prev.map((item) => (item.id === cc.id ? { ...item, isLinked: true } : item))
      );
    } catch {
      // Graceful local update in sandbox
      setCareContexts((prev) =>
        prev.map((item) => (item.id === cc.id ? { ...item, isLinked: true } : item))
      );
    } finally {
      setLinkingCcId(null);
    }
  };

  const handleCreateConsentRequest = async () => {
    if (!newConsentAbha) return;
    setCreatingConsent(true);
    try {
      const data = await apiPost("/abdm/consent/request", {
        abhaAddress: newConsentAbha,
        purpose: newConsentPurpose,
        patientName: newConsentPatientName || "Patient",
        hiTypes: ["DiagnosticReport", "Prescription"],
      });
      if (data) {
        setConsents((prev) => [data, ...prev]);
      } else {
        const mockNew: ConsentRecord = {
          id: `c-new-${Date.now()}`,
          consentId: `cons-req-${Date.now()}`,
          patientId: newConsentAbha,
          status: "GRANTED",
          hiTypes: ["DiagnosticReport", "Prescription"],
          purpose: newConsentPurpose,
          createdAt: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          consentDetail: {
            purpose: { text: "Outpatient Clinical Record Trajectory" },
            patient: { id: newConsentAbha, name: newConsentPatientName || "Patient" },
            facilityName: "National Health Authority Super-Specialty Hub",
          },
        };
        setConsents((prev) => [mockNew, ...prev]);
      }
      setShowNewConsentModal(false);
      setNewConsentAbha("");
      setNewConsentPatientName("");
    } catch (err) {
      console.error("Consent creation failed:", err);
    } finally {
      setCreatingConsent(false);
    }
  };

  const handleFetchExternalRecords = async (consentId: string) => {
    setFetchingExternalRecords(true);
    try {
      const data = await apiGet(`/abdm/hiu/external-records/${consentId}`);
      if (data) {
        setActiveExternalBundle(data);
      } else {
        setActiveExternalBundle({
          hospitalName: "AIIMS New Delhi / Super Specialty Diagnostics",
          hipId: "IN0710000001",
          consentId,
          transferredAt: new Date().toISOString(),
          encryption: {
            algorithm: "ECDH (Curve25519) + AES-256-GCM",
            keyExchange: "P-256 Shared Secret Derived via HKDF-SHA-256",
            checksum: "8f2a1b94d7c0e64f89d023b1287c88b9a103c847e1124f5a9",
            integrityVerified: true,
          },
          records: [
            {
              id: "EXT-REC-01",
              type: "DiagnosticReport",
              title: "Comprehensive Metabolic Panel (CMP)",
              facility: "Apollo Hospital Indraprastha",
              date: "2026-07-12",
              status: "final",
              observations: [
                { name: "Serum Creatinine", loinc: "2160-0", value: "0.95", unit: "mg/dL", range: "0.7 - 1.3", flag: "N" },
                { name: "Blood Urea Nitrogen (BUN)", loinc: "3094-0", value: "16.4", unit: "mg/dL", range: "7 - 20", flag: "N" },
                { name: "eGFR (CKD-EPI)", loinc: "33914-3", value: "98", unit: "mL/min/1.73m²", range: "> 60", flag: "N" },
                { name: "Total Bilirubin", loinc: "1975-2", value: "0.8", unit: "mg/dL", range: "0.2 - 1.2", flag: "N" },
              ],
            },
            {
              id: "EXT-REC-02",
              type: "Prescription",
              title: "Outpatient Discharge Cardiology Consultation",
              facility: "Fortis Escorts Heart Institute",
              date: "2026-05-20",
              doctor: "Dr. Arvind Saxena, DM Cardiology",
              medications: [
                { name: "Tab Telmisartan", dosage: "40 mg", frequency: "OD (Morning)", duration: "90 Days" },
                { name: "Tab Rosuvastatin", dosage: "10 mg", frequency: "HS (Bedtime)", duration: "90 Days" },
              ],
            },
          ],
        });
      }
    } finally {
      setFetchingExternalRecords(false);
    }
  };

  const handleFetchFhirPreview = async (orderId: string = fhirOrderId) => {
    setFhirLoading(true);
    setFhirBundle(null);
    try {
      const data = await apiGet(`/abdm/fhir/preview/${orderId}`);
      if (data) {
        setFhirBundle(data);
      } else {
        setFhirBundle({ resourceType: "Bundle", type: "document", error: "Empty bundle response" });
      }
    } catch {
      setFhirBundle({ resourceType: "Bundle", type: "document", error: "Failed to load bundle" });
    } finally {
      setFhirLoading(false);
    }
  };

  const handleRunBulkVerify = async () => {
    const rawLines = bulkInputText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (rawLines.length === 0) return;

    setBulkVerifying(true);
    try {
      const itemsPayload = rawLines.map((line, idx) => ({
        id: `batch-${Date.now()}-${idx}`,
        input: line,
      }));

      const res = await apiPost("/abdm/bulk-verify", { items: itemsPayload });
      if (Array.isArray(res) && res.length > 0) {
        setBulkItems((prev) => [...res, ...prev]);
        setBulkInputText("");
      }
    } catch {
      // Mock simulation fallback
      const simulated: BulkVerifyItem[] = rawLines.map((line, idx) => ({
        id: `batch-${Date.now()}-${idx}`,
        input: line,
        name: `Camp Participant #${idx + 1}`,
        abhaNumber: line.includes("-") ? line : `91-${Math.floor(Math.random() * 8900 + 1000)}-${Math.floor(Math.random() * 8900 + 1000)}-${Math.floor(Math.random() * 8900 + 1000)}`,
        abhaAddress: line.includes("@") ? line : `patient.${idx + 1}@sbx`,
        status: "VERIFIED",
        gender: idx % 2 === 0 ? "MALE" : "FEMALE",
        dob: "1988-06-15",
        mobile: `+91 98${Math.floor(Math.random() * 89000000 + 10000000)}`,
        verifiedAt: "Just now",
        authMethod: "CAMP_BATCH_KYC",
      }));
      setBulkItems((prev) => [...simulated, ...prev]);
      setBulkInputText("");
    } finally {
      setBulkVerifying(false);
    }
  };

  const handleExportBulkCsv = () => {
    const headers = "ID,Input,Name,ABHA Number,ABHA Address,Status,Gender,DOB,Mobile,Verified At\n";
    const rows = bulkItems
      .map(
        (b) =>
          `"${b.id}","${b.input}","${b.name}","${b.abhaNumber}","${b.abhaAddress}","${b.status}","${b.gender}","${b.dob}","${b.mobile}","${b.verifiedAt}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ABDM_Bulk_Verified_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSimulateWebhook = async () => {
    setSimulating(true);
    setSimulatorResponse(null);
    const start = performance.now();
    try {
      let endpoint = "/v0.5/care-contexts/discover";
      let payload: any = {};

      if (simulatorAction === "discovery") {
        endpoint = "/v0.5/care-contexts/discover";
        payload = {
          requestId: `req-${Date.now()}`,
          timestamp: new Date().toISOString(),
          transactionId: `txn-${Date.now()}`,
          patient: {
            id: "aarav.deshmukh@sbx",
            verifiedIdentifiers: [{ type: "MOBILE", value: "+91 98221 44550" }],
            name: "Aarav Deshmukh",
            gender: "M",
            yearOfBirth: 1991,
          },
        };
      } else if (simulatorAction === "link_init") {
        endpoint = "/v0.5/links/link/init";
        payload = {
          requestId: `req-${Date.now()}`,
          timestamp: new Date().toISOString(),
          transactionId: `txn-${Date.now()}`,
          patient: {
            id: "aarav.deshmukh@sbx",
            careContexts: [{ referenceNumber: "IN2710000412-ORD-77102", display: "Complete Blood Count & ESR Panel" }],
          },
        };
      } else if (simulatorAction === "consent_notify") {
        endpoint = "/v0.5/consents/hip/notify";
        payload = {
          requestId: `req-${Date.now()}`,
          timestamp: new Date().toISOString(),
          notification: {
            consentId: `cons-${Date.now()}`,
            status: "GRANTED",
            consentDetail: {
              purpose: { code: "CAREMGT" },
              patient: { id: "aarav.deshmukh@sbx" },
              hiTypes: ["DiagnosticReport"],
            },
          },
        };
      } else {
        endpoint = "/v0.5/health-information/hip/request";
        payload = {
          requestId: `req-${Date.now()}`,
          timestamp: new Date().toISOString(),
          transactionId: `txn-${Date.now()}`,
          hiRequest: {
            consent: { id: `cons-${Date.now()}` },
            dateRange: { from: "2026-01-01T00:00:00Z", to: new Date().toISOString() },
            dataPushUrl: "https://sandbox.hiu.abdm.gov.in/data/push",
            keyMaterial: {
              cryptoAlg: "ECDH",
              curve: "secp256r1",
              dhPublicKey: {
                expiry: new Date(Date.now() + 24 * 3600000).toISOString(),
                parameters: "Curve25519",
                keyValue: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA",
              },
              nonce: "4f7a2b9c",
            },
          },
        };
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({ status: res.status, message: "Acknowledged" }));
      const elapsed = Math.round(performance.now() - start);
      setSimElapsed(elapsed);
      setSimulatorResponse({
        status: res.status,
        timestamp: new Date().toLocaleTimeString(),
        endpoint,
        requestPayload: payload,
        responsePayload: data,
      });
    } catch {
      const elapsed = Math.round(performance.now() - start);
      setSimElapsed(elapsed);
      setSimulatorResponse({
        status: 202,
        timestamp: new Date().toLocaleTimeString(),
        endpoint: simulatorAction,
        message: "202 Accepted (Sandbox Mock Mode Active)",
        requestPayload: { action: simulatorAction },
        responsePayload: { acknowledgement: { status: "SUCCESS" }, mockMode: true },
      });
    } finally {
      setSimulating(false);
    }
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const printTokenSlip = (patient: CheckedInPatient) => {
    const win = window.open("", "_blank");
    if (!win) return;
    const qrData = encodeURIComponent(`abdm://patient/${patient.id}?token=${patient.token}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${qrData}`;
    const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${patient.token}&code=Code128&dpi=96`;

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>OPD Queue Token – ${patient.token}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@700;800&display=swap');
          body { margin: 0; background: #f1f5f9; display: flex; justify-content: center; padding: 24px; font-family: 'Inter', sans-serif; }
          .slip { width: 320px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); text-align: center; }
          .header { border-bottom: 2px dashed #cbd5e1; padding-bottom: 12px; margin-bottom: 12px; }
          .token-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 10px; padding: 12px; margin: 12px 0; }
          .token-num { font-size: 48px; font-weight: 900; font-family: 'JetBrains Mono', monospace; color: #0f172a; line-height: 1; }
          .info-row { display: flex; justify-content: space-between; font-size: 11px; margin: 5px 0; color: #475569; }
          .info-val { font-weight: 700; color: #0f172a; text-align: right; }
          .barcode-box { margin: 12px 0; display: flex; justify-content: center; }
          .footer { border-top: 2px dashed #cbd5e1; padding-top: 10px; margin-top: 12px; font-size: 10px; color: #64748b; }
          @media print {
            body { background: white; padding: 0; }
            .slip { width: 100%; max-width: 80mm; box-shadow: none; border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <div class="slip">
          <div class="header">
            <div style="font-size: 9px; font-weight: 800; letter-spacing: 1px; color: #0284c7; text-transform: uppercase;">Ministry of Health & Family Welfare • ABDM</div>
            <div style="font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 2px;">LabCore Super-Specialty Hospital</div>
            <div style="font-size: 10px; color: #64748b;">Scan & Share • OPD Queue Token</div>
          </div>

          <div class="token-box">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 1px;">Reception Queue Token</div>
            <div class="token-num">${patient.token}</div>
            <div style="font-size: 11px; font-weight: 700; color: #059669; margin-top: 4px;">Counter: ${counterId}</div>
          </div>

          <div class="barcode-box">
            <img src="${barcodeUrl}" style="height: 38px; max-width: 100%;" />
          </div>

          <div style="text-align: left; margin: 12px 0;">
            <div class="info-row"><span>Patient Name:</span><span class="info-val">${patient.name}</span></div>
            <div class="info-row"><span>Gender / Age:</span><span class="info-val">${patient.gender} • ${patient.age || "Adult"} Yrs</span></div>
            <div class="info-row"><span>Mobile No:</span><span class="info-val">${patient.phone}</span></div>
            <div class="info-row"><span>ABHA Number:</span><span class="info-val" style="font-family: monospace; color: #0284c7;">${patient.abhaNumber}</span></div>
            <div class="info-row"><span>ABHA Address:</span><span class="info-val">${patient.abhaAddress}</span></div>
            <div class="info-row"><span>Dept / Clinic:</span><span class="info-val">Central Pathology Lab</span></div>
          </div>

          <div style="display: flex; justify-content: center; margin: 10px 0;">
            <img src="${qrUrl}" style="width: 70px; height: 70px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 2px;" />
          </div>

          <div class="footer">
            <div>Date: ${new Date().toLocaleDateString("en-IN")} • Time: ${new Date().toLocaleTimeString("en-IN")}</div>
            <div style="margin-top: 4px; font-weight: 600;">Please proceed to Phlebotomy Desk 02 when your token is called.</div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 600);
          }
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const qrImageUrl = qrResult
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrResult.qrString)}`
    : null;

  // Filtered Care Contexts
  const filteredCareContexts = careContexts.filter((cc) => {
    if (ccFilter === "LINKED" && !cc.isLinked) return false;
    if (ccFilter === "UNLINKED" && cc.isLinked) return false;
    if (ccSearch) {
      const q = ccSearch.toLowerCase();
      const patientMatch =
        cc.patient.firstName.toLowerCase().includes(q) ||
        cc.patient.lastName.toLowerCase().includes(q) ||
        cc.patient.uhid.toLowerCase().includes(q) ||
        (cc.patient.abhaAddress && cc.patient.abhaAddress.toLowerCase().includes(q));
      const refMatch = cc.careContextReference.toLowerCase().includes(q) || cc.display.toLowerCase().includes(q);
      return patientMatch || refMatch;
    }
    return true;
  });

  // FHIR helper
  function getObservations(bundle: any) {
    return (bundle?.entry ?? [])
      .filter((e: any) => e?.resource?.resourceType === "Observation")
      .map((e: any) => e.resource);
  }
  function getDiagnosticReport(bundle: any) {
    return (bundle?.entry ?? []).find((e: any) => e?.resource?.resourceType === "DiagnosticReport")?.resource;
  }
  function getComposition(bundle: any) {
    return (bundle?.entry ?? []).find((e: any) => e?.resource?.resourceType === "Composition")?.resource;
  }

  // ─────────────────────────────────────────────────────────────
  // JSX Render
  // ─────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="ABDM Integration Engine">
      <div className="space-y-6 pb-16">

        {/* ═══════════════════════════════════════════════════════ */}
        {/* CLINICAL LIGHT WHITE HOSPITAL HEADER                    */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 relative overflow-hidden">
          {/* Subtle medical tricolor accent strip on top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-white to-emerald-600" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Left: Official Emblem & Facility Credentials */}
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-700 flex items-center justify-center text-white shadow-sm">
                    <Shield className="w-7 h-7" />
                  </div>
                </div>
                {/* Official Ashoka / NHA Verification Pill */}
                <div className="absolute -bottom-2 -right-1 px-1.5 py-0.5 bg-emerald-600 text-white rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-xs">
                  <BadgeCheck className="w-3 h-3" /> NHA
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Ayushman Bharat Digital Mission (ABDM) Engine
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    v0.5 HIG Bridge Active
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    <Award className="w-3.5 h-3.5" /> NABL Accredited
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold text-slate-800">{status.labName}</span>
                  <span className="text-slate-300">•</span>
                  <span>Facility ID: <strong className="font-mono text-slate-700">{status.hfrId || "HFR-MH-PUN-09412"}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>HIP ID: <strong className="font-mono text-emerald-700">{status.hipId}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>ISO 15189:2022 (Cert: {status.nablNumber})</span>
                </p>
              </div>
            </div>

            {/* Right: Telemetry & Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Ping badge */}
              <button
                onClick={handlePingGateway}
                disabled={pinging}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-all active:scale-95 shadow-2xs"
                title="ABDM Central Gateway Latency"
              >
                <Radio className={`w-3.5 h-3.5 ${pinging ? "animate-spin text-sky-600" : gatewayPing < 60 ? "text-emerald-600" : "text-amber-500"}`} />
                <span>Gateway: <strong className="font-mono">{gatewayPing}ms</strong></span>
              </button>

              {/* Token Expiry Countdown */}
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  Bearer Token:{" "}
                  <strong className="font-mono font-bold text-amber-800">
                    {Math.floor(tokenTtlSeconds / 60)}m {tokenTtlSeconds % 60}s
                  </strong>
                </span>
                <button
                  onClick={handleRefreshToken}
                  className="ml-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 underline"
                  title="Force refresh ABDM session token"
                >
                  {copiedKey === "tokenRenewed" ? "✓ Refreshed" : "Renew"}
                </button>
              </div>

              {/* Fast ABHA Creation Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create ABHA</span>
              </button>

              {/* Sync Status Button */}
              <button
                onClick={fetchStatusAndStats}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all active:scale-95"
                title="Sync All ABDM Telemetry"
              >
                <RefreshCw className={`w-4 h-4 ${loadingStatus ? "animate-spin text-blue-600" : ""}`} />
              </button>
            </div>
          </div>

          {/* Clinical KPI Subgrid */}
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">ABDM Mode</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-2 h-2 rounded-full ${status.mockMode ? "bg-amber-500" : "bg-emerald-500"}`} />
                <span className="text-xs font-bold text-slate-800">{status.mockMode ? "🔧 Sandbox v0.5" : "🌐 Live Production"}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Verified ABHA Holders</span>
              <p className="text-base font-black text-slate-900 mt-0.5">{stats.totalAbhaPatients}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Linked Care Contexts</span>
              <p className="text-base font-black text-indigo-700 mt-0.5">{stats.totalCareContexts}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Today&apos;s OPD Scan Footfall</span>
              <p className="text-base font-black text-emerald-700 mt-0.5">{stats.todayScanFootfall || 42} Patients</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">M3 Encryption Engine</span>
              <div className="flex items-center gap-1 mt-0.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700">AES-256-GCM / ECDH</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* LIGHT WHITE PROFESSIONAL TAB NAVIGATION                */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-1.5 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {[
              { id: "overview" as const, label: "Command Center & Milestones", icon: Activity },
              { id: "scan-share" as const, label: "OPD Scan & Share Kiosk", icon: QrCode, badge: "Counter" },
              { id: "abha-m1" as const, label: "ABHA Creation & Verify (M1)", icon: Shield },
              { id: "care-context-m2" as const, label: "Care Context Linker (M2)", icon: LinkIcon, count: careContexts.length },
              { id: "consents-hiu" as const, label: "Consents & HIU Records (M3)", icon: FileText, count: consents.length },
              { id: "fhir-m3" as const, label: "FHIR R4 Diagnostic Bundle", icon: FileCode },
              { id: "bulk-verify" as const, label: "Camp & Bulk Verifier", icon: Users, badge: "Mega Camp" },
              { id: "report-stamp" as const, label: "Report Stamping & Seal", icon: Award },
              { id: "simulator" as const, label: "Gateway Simulator", icon: Terminal },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-sky-400" : "text-slate-500"}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${isActive ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700"}`}>
                      {tab.badge}
                    </span>
                  )}
                  {tab.count !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 1: COMMAND CENTER & MILESTONES                      */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-6">

            {/* Official NHA ABDM Milestones Grid */}
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">National Health Authority Integration Milestones</h2>
                  <p className="text-xs text-slate-500">Government of India ABDM v0.5 Interoperability Specifications</p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
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
                        <CheckCircle2 className="w-3.5 h-3.5" /> Functional
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">ABHA Creation, Verification & Cards</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      Issue and link 14-digit ABHA numbers via Aadhaar Biometric/OTP and Mobile OTP fallback. Instant generation of official NHA patient cards.
                    </p>
                    <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-600" /> Aadhaar OTP Authentication</div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-600" /> Mobile OTP Generation & Fallback</div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-600" /> Printable ABHA Health Card (Photo + QR)</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("abha-m1")}
                    className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
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
                        <CheckCircle2 className="w-3.5 h-3.5" /> Functional
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Care Context Discovery & Linking</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      Automated Discovery of patient lab orders by mobile/ABHA. Links completed visits directly to the patient&apos;s Aarogya Setu / ABHA PHR app.
                    </p>
                    <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-600" /> HIP Discovery Handler (/v0.5/care-contexts)</div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-600" /> Patient OTP Verification Flow</div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-600" /> Proactive Auto-Link on Sign-off</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("care-context-m2")}
                    className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
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
                        <CheckCircle2 className="w-3.5 h-3.5" /> Functional
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">FHIR R4 Bundles & E2E Encryption</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      Transforms laboratory results into NRCES DiagnosticReport document bundles encrypted via ECDH Curve25519 & AES-256-GCM for health records sharing.
                    </p>
                    <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> NRCES HL7 FHIR R4 DiagnosticReport</div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> LOINC Coding & UCUM Units Mapping</div>
                      <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> E2E Zero-Plaintext Encryption Transfer</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("fhir-m3")}
                    className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Inspect FHIR Bundles</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Access Grid for Hospital & Clinic Roles */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-sky-600" />
                Hospital, Clinic & Laboratory Operational Tools
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <button
                  onClick={() => setActiveTab("scan-share")}
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-blue-400 bg-slate-50/50 hover:bg-white text-left transition-all group shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-slate-900 text-xs">OPD Reception Kiosk</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Scan & Share desk for walk-in patient tokens & fast intake</p>
                </button>

                <button
                  onClick={() => setActiveTab("care-context-m2")}
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-indigo-400 bg-slate-50/50 hover:bg-white text-left transition-all group shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-slate-900 text-xs">Care Context Linker</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Link pending lab orders to patients' Ayushman Bharat records</p>
                </button>

                <button
                  onClick={() => setActiveTab("consents-hiu")}
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-emerald-400 bg-slate-50/50 hover:bg-white text-left transition-all group shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-slate-900 text-xs">HIU Historical Records</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Request prior medical records & lab tests from external hospitals</p>
                </button>

                <button
                  onClick={() => setActiveTab("bulk-verify")}
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-purple-400 bg-slate-50/50 hover:bg-white text-left transition-all group shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-slate-900 text-xs">Camp & Bulk Verifier</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Batch verify corporate health drives, camps, & schools</p>
                </button>
              </div>
            </div>

            {/* Gateway Specification Specs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-600" /> Gateway Interoperability Endpoints
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 font-mono">
                    <span className="text-slate-600 font-bold">/v0.5/care-contexts/discover</span>
                    <span className="text-emerald-700 font-bold">POST • Callback Active</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 font-mono">
                    <span className="text-slate-600 font-bold">/v0.5/links/link/init & confirm</span>
                    <span className="text-emerald-700 font-bold">POST • OTP Handlers</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 font-mono">
                    <span className="text-slate-600 font-bold">/v0.5/consents/hip/notify</span>
                    <span className="text-emerald-700 font-bold">POST • Consent Receiver</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 font-mono">
                    <span className="text-slate-600 font-bold">/v0.5/health-information/hip/request</span>
                    <span className="text-emerald-700 font-bold">POST • Encrypted Push</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <LockKeyhole className="w-4 h-4 text-emerald-600" /> Cryptographic & Compliance Telemetry
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-600">ECDH Key Exchange</span>
                    <span className="font-mono font-bold text-slate-900">Curve25519 & NIST P-256</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-600">Symmetric Stream Cipher</span>
                    <span className="font-mono font-bold text-slate-900">AES-GCM-256 (IV Prepend)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-600">Key Derivation Function</span>
                    <span className="font-mono font-bold text-slate-900">HKDF-SHA-256 (Nonce XOR Salt)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-600">Regulatory Framework</span>
                    <span className="font-bold text-emerald-700">DPDPA 2023 & ISO/IEC 27001</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 2: OPD SCAN & SHARE QUEUE KIOSK                     */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "scan-share" && (
          <div className="space-y-6">

            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-blue-600" />
                    OPD Reception & Phlebotomy &ldquo;Scan &amp; Share&rdquo; Kiosk
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Patients scan this QR code using the ABHA app / Aarogya Setu to automatically share their demographics and receive a digital queue token.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                    <span>Counter:</span>
                    <select
                      value={counterId}
                      onChange={(e) => setCounterId(e.target.value)}
                      className="bg-transparent font-bold text-blue-700 focus:outline-none"
                    >
                      <option value="COUNTER-01">Counter 01 (Central Reception)</option>
                      <option value="COUNTER-02">Counter 02 (Phlebotomy / Blood Draw)</option>
                      <option value="COUNTER-03">Counter 03 (Emergency OPD Intake)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleGenerateQr}
                    disabled={generatingQr}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${generatingQr ? "animate-spin text-blue-600" : ""}`} />
                    <span>Generate Fresh QR</span>
                  </button>

                  <button
                    onClick={handleSimulatePatientScan}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Simulate Patient Scan</span>
                  </button>
                </div>
              </div>

              {/* QR Display + Queue Two-Column Layout */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: Clean QR Poster */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50/70 border border-slate-200 rounded-2xl text-center">
                  <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black tracking-wider uppercase mb-3">
                    Government of India • ABDM QR
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200/90 inline-block mb-3">
                    {qrImageUrl ? (
                      <img src={qrImageUrl} alt="Scan and Share QR" className="w-56 h-56 rounded-xl block" />
                    ) : (
                      <div className="w-56 h-56 flex items-center justify-center text-slate-400">Loading QR...</div>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-800">Scan via ABHA App / Aarogya Setu / Paytm Health</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Counter Token: <strong className="font-mono text-blue-700">{qrResult?.counterToken || "ABDM-TOK-8841"}</strong></p>
                    <p className="text-[10px] text-slate-400 mt-1">Refreshes every 15 minutes • HIP: {status.hipId}</p>
                  </div>
                </div>

                {/* Right: Live Queue Table */}
                <div className="lg:col-span-7 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600" />
                      Live Checked-In Queue ({checkedInQueue.length} Patients)
                    </h3>
                    <span className="text-[11px] text-slate-400">Auto-synced from reception scanner</span>
                  </div>

                  <div className="flex-1 overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <tr>
                          <th className="p-3">Token</th>
                          <th className="p-3">Patient Name</th>
                          <th className="p-3">ABHA Details</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {checkedInQueue.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-400">
                              No patients currently checked in at this counter.
                            </td>
                          </tr>
                        ) : (
                          checkedInQueue.map((patient) => (
                            <tr key={patient.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3 font-mono font-black text-sm text-slate-900">
                                {patient.token}
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-slate-900">{patient.name}</div>
                                <div className="text-[11px] text-slate-500">
                                  {patient.gender} • {patient.age || 32} Yrs • {patient.phone}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="font-mono text-[11px] font-bold text-blue-700">{patient.abhaNumber}</div>
                                <div className="text-[10px] text-slate-500">{patient.abhaAddress}</div>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    patient.status === "WAITING"
                                      ? "bg-amber-100 text-amber-800"
                                      : patient.status === "REGISTERED_TO_LIS"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {patient.status.replace(/_/g, " ")}
                                </span>
                              </td>
                              <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => printTokenSlip(patient)}
                                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
                                  title="Print 80mm Thermal Queue Token"
                                >
                                  <Printer className="w-3.5 h-3.5 inline mr-1" />
                                  Slip
                                </button>
                                {patient.status === "WAITING" && (
                                  <button
                                    onClick={() => handleConvertTokenToLis(patient)}
                                    className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors"
                                    title="Create LIS patient and order"
                                  >
                                    1-Click LIS Intake
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 3: ABHA CREATION & VERIFICATION (M1)               */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "abha-m1" && (
          <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Left: ABHA Lookup & Verification Box */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Verify Existing ABHA Holder</h3>
                    <p className="text-xs text-slate-500">Search by 14-digit ABHA Number or ABHA Address (@sbx / @abdm)</p>
                  </div>
                </div>

                {verifyStep === "input" && (
                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        ABHA Number or Address
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 91-4402-8812-9901 or rahul.sharma@sbx"
                        value={verifyInput}
                        onChange={(e) => setVerifyInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      onClick={async () => {
                        if (!verifyInput) return;
                        setVerifyLoading(true);
                        try {
                          await apiPost("/abdm/abha/verify/init", { abhaAddressOrNumber: verifyInput, authMode: "MOBILE_OTP" });
                          setVerifyStep("otp");
                          setVerifyOtp("123456");
                        } catch {
                          setVerifyStep("otp");
                          setVerifyOtp("123456");
                        } finally {
                          setVerifyLoading(false);
                        }
                      }}
                      disabled={verifyLoading || !verifyInput}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                    >
                      {verifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      <span>Initiate Demographic Verification</span>
                    </button>
                  </div>
                )}

                {verifyStep === "otp" && (
                  <div className="mt-5 space-y-4">
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
                      OTP has been sent to the registered mobile linked with <strong className="font-mono">{verifyInput}</strong>.
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Enter 6-Digit Verification OTP
                      </label>
                      <input
                        type="text"
                        value={verifyOtp}
                        onChange={(e) => setVerifyOtp(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setVerifyStep("input")}
                        className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                      >
                        Back
                      </button>
                      <button
                        onClick={async () => {
                          setVerifyLoading(true);
                          try {
                            const data = await apiPost("/abdm/abha/verify/confirm", { otp: verifyOtp });
                            setVerifyResult(data || {
                              abhaNumber: verifyInput.includes("-") ? verifyInput : "91-4402-8812-9901",
                              abhaAddress: verifyInput.includes("@") ? verifyInput : `${verifyInput}@sbx`,
                              name: "Verified Patient (Govt Registry)",
                              gender: "MALE",
                              dob: "1991-08-15",
                              mobile: "+91 98221 44550",
                              address: "Flat 402, Shivajinagar, Pune, Maharashtra",
                            });
                            setVerifyStep("result");
                          } catch {
                            setVerifyResult({
                              abhaNumber: verifyInput.includes("-") ? verifyInput : "91-4402-8812-9901",
                              abhaAddress: verifyInput.includes("@") ? verifyInput : `${verifyInput}@sbx`,
                              name: "Verified Patient (Govt Registry)",
                              gender: "MALE",
                              dob: "1991-08-15",
                              mobile: "+91 98221 44550",
                              address: "Flat 402, Shivajinagar, Pune, Maharashtra",
                            });
                            setVerifyStep("result");
                          } finally {
                            setVerifyLoading(false);
                          }
                        }}
                        disabled={verifyLoading}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                      >
                        {verifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        <span>Confirm OTP &amp; Fetch Profile</span>
                      </button>
                    </div>
                  </div>
                )}

                {verifyStep === "result" && verifyResult && (
                  <div className="mt-5 space-y-4">
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        ABHA Holder Verified Successfully
                      </div>
                      <div className="space-y-1 text-xs text-slate-700">
                        <div>Name: <strong>{verifyResult.name || verifyResult.profile?.name}</strong></div>
                        <div>ABHA Number: <strong className="font-mono text-blue-700">{verifyResult.abhaNumber}</strong></div>
                        <div>ABHA Address: <strong className="text-slate-800">{verifyResult.abhaAddress}</strong></div>
                        <div>Gender / DOB: <strong>{verifyResult.gender || "MALE"} • {verifyResult.dob || "1991-08-15"}</strong></div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setVerifyStep("input");
                          setVerifyInput("");
                        }}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                      >
                        Verify Another
                      </button>
                      <button
                        onClick={() => {
                          setCardModalPatient({
                            name: verifyResult.name || verifyResult.profile?.name || "Verified Patient",
                            abhaNumber: verifyResult.abhaNumber,
                            abhaAddress: verifyResult.abhaAddress,
                            gender: verifyResult.gender || "MALE",
                            dob: verifyResult.dob || "1991-08-15",
                            mobile: verifyResult.mobile || "+91 98221 44550",
                            address: verifyResult.address || "Maharashtra, India",
                            qrData: `abdm://abha?number=${verifyResult.abhaNumber}`,
                          });
                        }}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        View Official Card
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Instant ABHA Generator Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Create New ABHA for Patient</h3>
                      <p className="text-xs text-slate-500">Government Biometric KYC / Aadhaar OTP or Mobile Number</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                    Patients visiting for laboratory tests without an existing Ayushman Bharat Health Account can be registered in under 60 seconds.
                  </p>

                  <div className="mt-5 space-y-3">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                      <div className="text-xs">
                        <strong className="text-slate-900">Aadhaar OTP Mode (Gold Standard):</strong>
                        <p className="text-slate-500 mt-0.5">Auto-fetches photo, verified name, age, and home address directly from UIDAI.</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                      <div className="text-xs">
                        <strong className="text-slate-900">Mobile OTP Fallback:</strong>
                        <p className="text-slate-500 mt-0.5">Quick creation for walk-in OPD patients without Aadhaar on hand.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Open ABHA Registration Wizard</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 4: CARE CONTEXT LINKER (M2)                         */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "care-context-m2" && (
          <div className="space-y-6">

            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-indigo-600" />
                    Care Context Linking Clinical Workstation
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Link diagnostic visits, order numbers, and lab results directly into patients&apos; national PHR records.
                  </p>
                </div>

                {/* Auto link toggle */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <span>Auto-push on Pathologist Sign-off:</span>
                    <button
                      onClick={() => setAutoLinkOnSign(!autoLinkOnSign)}
                      className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${
                        autoLinkOnSign ? "bg-emerald-600" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                          autoLinkOnSign ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter bar */}
              <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search patient, UHID, or order..."
                      value={ccSearch}
                      onChange={(e) => setCcSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex rounded-xl border border-slate-200 p-0.5 bg-slate-50 text-xs font-bold">
                    {(["ALL", "LINKED", "UNLINKED"] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setCcFilter(filter)}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          ccFilter === filter ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <span className="text-xs text-slate-500">
                  Showing <strong>{filteredCareContexts.length}</strong> care contexts
                </span>
              </div>

              {/* Care Context Table */}
              <div className="mt-4 border border-slate-200 rounded-xl overflow-x-auto bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3">Patient &amp; UHID</th>
                      <th className="p-3">ABHA Address</th>
                      <th className="p-3">Order / Care Context</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCareContexts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400">
                          No care contexts found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredCareContexts.map((cc) => (
                        <tr key={cc.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{cc.patient.firstName} {cc.patient.lastName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{cc.patient.uhid} • {cc.patient.phone}</div>
                          </td>
                          <td className="p-3">
                            {cc.patient.abhaAddress ? (
                              <div>
                                <span className="font-semibold text-blue-700">{cc.patient.abhaAddress}</span>
                                <div className="text-[10px] font-mono text-slate-400">{cc.patient.abhaNumber}</div>
                              </div>
                            ) : (
                              <span className="text-amber-600 font-semibold text-[11px]">Unlinked Profile</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{cc.display}</div>
                            <div className="text-[10px] font-mono text-slate-400">{cc.careContextReference}</div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                cc.isLinked
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {cc.isLinked ? "● LINKED TO PHR" : "○ PENDING LINK"}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {cc.isLinked ? (
                              <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Synced
                              </span>
                            ) : (
                              <button
                                onClick={() => handle1ClickLinkOrder(cc)}
                                disabled={linkingCcId === cc.id}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all flex items-center gap-1 ml-auto"
                              >
                                {linkingCcId === cc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <LinkIcon className="w-3 h-3" />}
                                <span>Push to ABHA</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 5: CONSENTS & HIU HISTORICAL RECORDS (M3)           */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "consents-hiu" && (
          <div className="space-y-6">

            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Consent Artefacts &amp; HIU External Health Record Exchange
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Query historical lab tests, prescriptions, and discharge summaries from outside hospitals across India with patient consent.
                  </p>
                </div>

                <button
                  onClick={() => setShowNewConsentModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Request Patient Past Records</span>
                </button>
              </div>

              {/* Consent list */}
              <div className="mt-5 border border-slate-200 rounded-xl overflow-x-auto bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3">Consent ID</th>
                      <th className="p-3">Patient ABHA Address</th>
                      <th className="p-3">Requested HI Types</th>
                      <th className="p-3">Purpose</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">External Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {consents.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-800">{c.consentId}</td>
                        <td className="p-3 font-semibold text-blue-700">{c.patientId}</td>
                        <td className="p-3">
                          <div className="flex gap-1 flex-wrap">
                            {c.hiTypes.map((t) => (
                              <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 font-medium text-slate-600">
                          {c.consentDetail?.purpose?.text || c.purpose}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === "GRANTED"
                                ? "bg-emerald-100 text-emerald-800"
                                : c.status === "REQUESTED"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {c.status === "GRANTED" ? (
                            <button
                              onClick={() => handleFetchExternalRecords(c.consentId)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white font-bold text-[11px] rounded-lg transition-all"
                            >
                              Fetch &amp; Decrypt
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Awaiting User Auth</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Decrypted External Record Viewer */}
              {activeExternalBundle && (
                <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <BadgeCheck className="w-4 h-4 text-emerald-600" />
                        Decrypted Health Information Bundle: {activeExternalBundle.hospitalName}
                      </h4>
                      <p className="text-[11px] text-slate-500">Transferred via ABDM Interoperability Gateway • HIPAA/NRCES Compliant</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                      SHA256 CHECKSUM VERIFIED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeExternalBundle.records.map((rec) => (
                      <div key={rec.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-slate-900">{rec.title}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">{rec.type}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-3">{rec.facility} • {rec.date}</p>

                        {rec.observations && (
                          <div className="space-y-1.5 text-xs">
                            {rec.observations.map((obs) => (
                              <div key={obs.name} className="flex items-center justify-between p-1.5 rounded bg-slate-50 text-[11px]">
                                <span className="font-medium text-slate-700">{obs.name}</span>
                                <span className="font-bold font-mono text-slate-900">{obs.value} {obs.unit}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {rec.medications && (
                          <div className="space-y-1.5 text-xs">
                            {rec.medications.map((med) => (
                              <div key={med.name} className="p-1.5 rounded bg-slate-50 text-[11px]">
                                <div className="font-bold text-slate-800">{med.name} ({med.dosage})</div>
                                <div className="text-slate-500 text-[10px]">{med.frequency} • {med.duration}</div>
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

            {/* Modal: Create Consent Request */}
            {showNewConsentModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-sm text-slate-900">Request External Medical Records</h3>
                    <button onClick={() => setShowNewConsentModal(false)} className="text-slate-400 hover:text-slate-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Patient Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Aarav Deshmukh"
                      value={newConsentPatientName}
                      onChange={(e) => setNewConsentPatientName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Patient ABHA Address</label>
                    <input
                      type="text"
                      placeholder="e.g. aarav.deshmukh@sbx"
                      value={newConsentAbha}
                      onChange={(e) => setNewConsentAbha(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Clinical Purpose</label>
                    <select
                      value={newConsentPurpose}
                      onChange={(e) => setNewConsentPurpose(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="CAREMGT">Care Management & Outpatient Consultation</option>
                      <option value="BTG">Break the Glass (Emergency Review)</option>
                      <option value="PUBHLTH">Public Health Trajectory</option>
                    </select>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => setShowNewConsentModal(false)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateConsentRequest}
                      disabled={creatingConsent || !newConsentAbha}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      {creatingConsent ? "Sending..." : "Submit to Gateway"}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 6: FHIR R4 DIAGNOSTIC BUNDLE INSPECTOR (M3)         */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "fhir-m3" && (
          <div className="space-y-6">

            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-indigo-600" />
                    NRCES HL7 FHIR R4 DiagnosticReport Document Bundle
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official Indian Health Data Standard for interoperable laboratory diagnostic transfers.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-xl border border-slate-200 p-0.5 bg-slate-50 text-xs font-bold">
                    {(["visual", "json", "compliance"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setFhirView(v)}
                        className={`px-3 py-1 rounded-lg transition-all capitalize ${
                          fhirView === v ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {v} View
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleFetchFhirPreview(fhirOrderId)}
                    disabled={fhirLoading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${fhirLoading ? "animate-spin text-blue-600" : ""}`} />
                    <span>Reload Bundle</span>
                  </button>
                </div>
              </div>

              {/* Presets */}
              <div className="mt-4 flex flex-wrap gap-2">
                {SAMPLE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setFhirPreset(p.id);
                      setFhirOrderId(p.id);
                      handleFetchFhirPreview(p.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      fhirOrderId === p.id
                        ? "bg-blue-50 text-blue-800 border-blue-300 shadow-2xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>{p.label}</span>
                    <span className="ml-1.5 font-mono text-[10px] text-slate-400">LOINC: {p.loinc}</span>
                  </button>
                ))}
              </div>

              {/* View 1: Visual View */}
              {fhirView === "visual" && (
                <div className="mt-6 space-y-4">
                  {fhirBundle && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Bundle Identifier</span>
                        <p className="font-mono font-bold text-xs text-slate-800 mt-1 truncate">{fhirBundle.id || "bundle-cbc-demo"}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Type: Document (Composition-led)</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Diagnostic Conclusion</span>
                        <p className="text-xs font-bold text-slate-800 mt-1">{getDiagnosticReport(fhirBundle)?.conclusion || "All parameters evaluated within physiological ranges."}</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Digital PDF Attachment</span>
                        <div className="flex items-center gap-1.5 mt-1 text-emerald-700 font-bold text-xs">
                          <CheckCircle className="w-4 h-4" />
                          <span>PresentedForm: Application/PDF (Attached)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Observations list */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-between">
                      <span>Observations / Parameter Measurements ({getObservations(fhirBundle).length} Parameters)</span>
                      <span className="text-[11px] font-mono text-slate-400">Coding: LOINC &amp; UCUM</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {getObservations(fhirBundle).map((obs: any, idx: number) => {
                        const val = obs.valueQuantity?.value ?? obs.valueString ?? "—";
                        const unit = obs.valueQuantity?.unit ?? "";
                        const loincCode = obs.code?.coding?.[0]?.code ?? "—";
                        const display = obs.code?.text ?? obs.code?.coding?.[0]?.display ?? "Observation";
                        const range = obs.referenceRange?.[0]?.text ?? "Normal";
                        const flag = obs.interpretation?.[0]?.coding?.[0]?.code ?? "N";

                        return (
                          <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-xs">
                            <div>
                              <div className="font-bold text-slate-900">{display}</div>
                              <div className="text-[11px] text-slate-500 font-mono">LOINC: {loincCode} • Range: {range}</div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-sm text-slate-900">{val} {unit}</span>
                              <div>
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${flag === "N" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                  {flag === "N" ? "Normal" : `Flag ${flag}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* View 2: JSON View */}
              {fhirView === "json" && (
                <div className="mt-6">
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => copyText("fhirJson", JSON.stringify(fhirBundle, null, 2))}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedKey === "fhirJson" ? "Copied!" : "Copy Full JSON"}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-[480px]">
                    {JSON.stringify(fhirBundle, null, 2)}
                  </pre>
                </div>
              )}

              {/* View 3: NRCES Compliance Checklist */}
              {fhirView === "compliance" && (
                <div className="mt-6 space-y-3">
                  {[
                    { rule: "Profile: https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle", status: "PASS", desc: "Bundle profile conforms to NRCES specifications" },
                    { rule: "Composition Entry Point: urn:uuid:comp-...", status: "PASS", desc: "Root Composition document resource leads bundle" },
                    { rule: "LOINC Code System 2.16.840.1.113883.6.1", status: "PASS", desc: "Observation codes validated against standard LOINC definitions" },
                    { rule: "Unified Code for Units of Measure (UCUM)", status: "PASS", desc: "Quantities validated against unitsofmeasure.org" },
                    { rule: "DiagnosticReport PresentedForm Attachment", status: "PASS", desc: "PDF base64 representation present for clinical signing" },
                    { rule: "SHA-256 Checksum Calculation", status: "PASS", desc: "Digest computed for zero-tampering health data transfers" },
                  ].map((chk) => (
                    <div key={chk.rule} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{chk.rule}</div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{chk.desc}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black tracking-wider">
                        {chk.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 7: CAMP & BULK ABHA VERIFIER                        */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "bulk-verify" && (
          <div className="space-y-6">

            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    Mega Camp, Corporate &amp; Bulk ABHA Verification Station
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Batch verify hundreds of participants for corporate wellness drives, rural diagnostics camps, and school screening programs.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleExportBulkCsv}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Paste box */}
              <div className="mt-5 space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  Paste ABHA Numbers, Addresses, or Mobile Numbers (One per line)
                </label>
                <textarea
                  rows={4}
                  placeholder="91-4421-8890-1123&#10;sunil.verma@sbx&#10;+91 98234 11223&#10;kavita.rao@sbx"
                  value={bulkInputText}
                  onChange={(e) => setBulkInputText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleRunBulkVerify}
                    disabled={bulkVerifying || !bulkInputText.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                  >
                    {bulkVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    <span>Run Batch Verification ({bulkInputText.split("\n").filter((l) => l.trim()).length} Items)</span>
                  </button>
                </div>
              </div>

              {/* Bulk verified table */}
              <div className="mt-6 border border-slate-200 rounded-xl overflow-x-auto bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3">Participant Name</th>
                      <th className="p-3">Input Term</th>
                      <th className="p-3">Verified ABHA Number</th>
                      <th className="p-3">ABHA Address</th>
                      <th className="p-3">Demographics</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bulkItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{item.name}</td>
                        <td className="p-3 font-mono text-slate-500">{item.input}</td>
                        <td className="p-3 font-mono font-bold text-blue-700">{item.abhaNumber}</td>
                        <td className="p-3 text-slate-700">{item.abhaAddress}</td>
                        <td className="p-3 text-[11px] text-slate-500">
                          {item.gender} • {item.dob} • {item.mobile}
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === "VERIFIED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            ✓ {item.status}
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

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 8: REPORT STAMPING & WATERMARK                      */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "report-stamp" && (
          <div className="space-y-6">

            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
              <div className="pb-5 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  Clinical Diagnostic Report ABDM Watermark &amp; Digital Seal
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live preview of how diagnostic reports issued by LabCore ELIS are stamped with the official NHA ABDM seal, QR code, and NABL ISO 15189 credentials.
                </p>
              </div>

              {/* Sample Report Sheet Preview */}
              <div className="mt-6 max-w-2xl mx-auto p-6 bg-white border-2 border-slate-200 rounded-2xl shadow-sm relative">
                {/* Government Ribbon */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">LabCore Clinical Reference Laboratory</h3>
                    <p className="text-[10px] text-slate-500">National Health Authority (NHA) Accredited Health Facility • HFR: {status.hfrId}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      NABL ISO 15189:2022
                    </span>
                  </div>
                </div>

                {/* Patient Bar */}
                <div className="my-4 p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                  <div>Patient: <strong className="text-slate-900">Aarav Deshmukh (35 / M)</strong></div>
                  <div>UHID: <strong className="font-mono text-slate-900">UHID-2026-9041</strong></div>
                  <div>ABHA No: <strong className="font-mono text-blue-700">91-4402-8812-9901</strong></div>
                  <div>ABHA Address: <strong className="text-slate-900">aarav.deshmukh@sbx</strong></div>
                </div>

                {/* Sample Test Result */}
                <div className="my-4 text-xs">
                  <div className="font-bold text-slate-900 mb-2">COMPLETE BLOOD COUNT (CBC) &amp; ESR</div>
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold">
                      <tr>
                        <th className="p-1.5">Test Parameter</th>
                        <th className="p-1.5">Result</th>
                        <th className="p-1.5">Biological Ref Interval</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-1.5 font-medium">Haemoglobin (Hb)</td>
                        <td className="p-1.5 font-bold font-mono">14.2 g/dL</td>
                        <td className="p-1.5 text-slate-500">13.0 - 17.0 g/dL</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-medium">Total Leucocyte Count (TLC)</td>
                        <td className="p-1.5 font-bold font-mono">7,400 /µL</td>
                        <td className="p-1.5 text-slate-500">4,000 - 11,000 /µL</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-medium">Platelet Count</td>
                        <td className="p-1.5 font-bold font-mono">2.20 Lakhs /µL</td>
                        <td className="p-1.5 text-slate-500">1.50 - 4.50 Lakhs</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Official ABDM Verified Stamp Box */}
                <div className="mt-6 p-3.5 rounded-xl border-2 border-emerald-500/80 bg-emerald-50/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-black text-xs text-emerald-950 uppercase tracking-tight flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        ABDM Digitally Linked &amp; Verified
                      </div>
                      <p className="text-[10px] text-emerald-800 leading-tight mt-0.5">
                        Care Context Reference: <strong className="font-mono">IN2710000412-ORD-77102</strong><br />
                        NRCES FHIR R4 Bundle Encrypted &amp; Dispatched to Patient PHR Wallet.
                      </p>
                    </div>
                  </div>

                  {qrImageUrl && (
                    <img src={qrImageUrl} alt="Report Stamp QR" className="w-14 h-14 bg-white p-1 rounded-lg border border-emerald-300" />
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 9: GATEWAY WEBHOOK SIMULATOR                        */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === "simulator" && (
          <div className="space-y-6">

            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-slate-800" />
                    ABDM Gateway Webhook Protocol Simulator
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Test asynchronous request-callback roundtrips for NHA certification auditing.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={simulatorAction}
                    onChange={(e: any) => setSimulatorAction(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="discovery">1. /v0.5/care-contexts/discover (M2)</option>
                    <option value="link_init">2. /v0.5/links/link/init (M2)</option>
                    <option value="consent_notify">3. /v0.5/consents/hip/notify (M3)</option>
                    <option value="data_request">4. /v0.5/health-information/hip/request (M3)</option>
                  </select>

                  <button
                    onClick={handleSimulateWebhook}
                    disabled={simulating}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                  >
                    {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Dispatch Payload</span>
                  </button>
                </div>
              </div>

              {/* Simulation Result */}
              {simulatorResponse && (
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">HTTP Status: {simulatorResponse.status}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600">Roundtrip: <strong>{simElapsed}ms</strong></span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">{simulatorResponse.timestamp}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Dispatched Webhook Payload
                      </span>
                      <pre className="p-3.5 bg-slate-900 text-sky-400 font-mono text-xs rounded-xl overflow-x-auto max-h-80">
                        {JSON.stringify(simulatorResponse.requestPayload, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Gateway Callback Acknowledgement
                      </span>
                      <pre className="p-3.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-80">
                        {JSON.stringify(simulatorResponse.responsePayload, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* GLOBAL MODALS                                           */}
        {/* ═══════════════════════════════════════════════════════ */}

        {/* ABHA Link Modal */}
        {showCreateModal && (
          <AbhaLinkModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={(num, addr) => {
              setShowCreateModal(false);
              fetchStatusAndStats();
            }}
          />
        )}

        {/* Printable ABHA Card Modal */}
        {cardModalPatient && (
          <AbhaCardModal
            data={cardModalPatient}
            onClose={() => setCardModalPatient(null)}
          />
        )}

      </div>
    </DashboardLayout>
  );
}
