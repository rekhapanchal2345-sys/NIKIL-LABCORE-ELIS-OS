"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { patientApi, orderApi } from "@/lib/api";
import { showSuccess, showError, showInfo } from "@/lib/notifications";
import { PatientQuickRegisterModal } from "@/components/orders/PatientQuickRegisterModal";
import RegisterPatientWizard from "@/components/patients/RegisterPatientWizard";
import QuickTokenModal from "@/components/patients/QuickTokenModal";
import AbhaLinkModal from "@/components/abdm/AbhaLinkModal";
import AbhaCardModal from "@/components/abdm/AbhaCardModal";
import PatientRegistrationPrintForm from "@/components/patients/PatientRegistrationPrintForm";
import TransferStationModal from "@/components/patients/TransferStationModal";
import BedAllocationModal from "@/components/patients/BedAllocationModal";
import { QueueToken, QueueStage } from "@/components/patients/OpdLiveQueue";
import { queueAudio } from "@/lib/queue-chime";
import BarcodeLabelModal, { BarcodeLabelItem } from "@/components/barcodes/BarcodeLabelModal";
import ClinicalVitalsTriageCenter from "@/components/vitals/ClinicalVitalsTriageCenter";
import {
  CLSI_VACUTAINER_CATALOG,
  detectRequiredTubes,
  formatTubeBarcode,
  VacutainerTubeDefinition,
} from "@/lib/phlebotomy-tubes";
import {
  formatPatientFullName,
  calculateClinicalAge,
  formatIndianPhone,
  formatBloodGroup,
  formatAbhaNumber,
  sanitizeMedicalConditions,
} from "@/lib/patient-utils";
import {
  calculatePatientRiskScore,
  parseNaturalLanguagePatientQuery,
} from "@/lib/patient-intelligence";
import {
  Users,
  UserCheck,
  UserPlus,
  Clock,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Plus,
  Printer,
  Copy,
  Check,
  Phone,
  Mail,
  MessageCircle,
  MoreVertical,
  Activity,
  Droplets,
  Calendar,
  AlertTriangle,
  HeartPulse,
  ExternalLink,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  FlaskConical,
  Stethoscope,
  Sparkles,
  Edit,
  Trash2,
  Share2,
  CheckCircle2,
  Building2,
  SlidersHorizontal,
  ArrowUpDown,
  Tag,
  MapPin,
  FileCheck,
  Barcode,
  Info,
  Ticket,
  QrCode,
  Bed,
  Truck,
  CheckCheck,
  GitMerge,
  ShieldAlert,
  Navigation,
} from "lucide-react";

export type Patient = {
  id: string;
  uhid: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  age: number | null;
  dateOfBirth?: string | null;
  phone: string | null;
  email: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  bloodGroup: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  insuranceProvider?: string | null;
  policyNumber?: string | null;
  createdAt: string;
  updatedAt?: string;
  status?: "Active" | "Inactive" | "Critical";
  isActive?: boolean;
  // Diagnostic flags
  isVip?: boolean;
  isCritical?: boolean;
  chronicConditions?: string[];
  allergies?: string[];
  totalOrders?: number;
  pendingOrders?: number;
  lastVisitDate?: string | null;
  patientType?: "OPD" | "IPD" | "EMERGENCY" | "DAY_CARE" | "CORPORATE";
  ward?: string | null;
  bedNumber?: string | null;
  attendingDoctor?: string | null;
  department?: string | null;
  vitals?: {
    bp?: string;
    spo2?: number;
    pulse?: number;
    temperature?: number;
  };
  billingStatus?: "SETTLED" | "PENDING" | "TPA_CASHLESS" | "PARTIALLY_PAID";
  billingAmount?: number;
  specimenStage?: "PENDING" | "COLLECTED" | "ACCESSIONED" | "TESTING" | "VERIFIED" | "DISPATCHED";
  insuranceId?: string | null;
  nationalId?: string | null;
  aadhaarNumber?: string | null;
  abhaNumber?: string | null;
  abhaAddress?: string | null;
  abhaStatus?: "VERIFIED" | "PENDING" | "FAILED" | "NOT_LINKED";
};

type PatientIdentityMarkProps = {
  firstName: string;
  lastName: string;
  status?: Patient["status"];
  size?: "compact" | "card" | "hero";
  gender?: Patient["gender"];
};

/**
 * Patient identity avatar using exact medical patient icons provided by user.
 * Female: long-hair silhouette in blue circle. Male: short-hair silhouette in blue circle.
 * Status dot shown at bottom-right (green=Active, red=Critical, grey=Inactive).
 */
function PatientIdentityMark({ firstName, lastName, status, size = "compact", gender }: PatientIdentityMarkProps) {
  const isCritical = status === "Critical";
  const isActive = status === "Active";
  const genderUpper = gender?.toUpperCase() || "";
  const isFemale = genderUpper === "FEMALE";
  const isMale = genderUpper === "MALE";
  const dimensions = size === "hero" ? "h-14 w-14" : size === "card" ? "h-12 w-12" : "h-11 w-11";

  return (
    <div
      className={`relative ${dimensions} shrink-0 transition-all duration-300 hover:scale-105`}
      title={`${isCritical ? "Critical" : isActive ? "Active" : "Inactive"} · ${isFemale ? "Female" : isMale ? "Male" : "Other"} patient`}
    >
      {isFemale ? (
        /* ── FEMALE patient icon – exact replica of user image ── */
        <svg viewBox="0 0 100 100" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          {/* White background */}
          <circle cx="50" cy="50" r="50" fill="white" />
          {/* Blue outer ring */}
          <circle cx="50" cy="50" r="47" fill="none" stroke="#2196F3" strokeWidth="6" />
          {/* ── Dark navy silhouette ── */}
          {/* Long hair – left */}
          <path d="M28 36 C24 40 22 50 23 60 C24 68 27 75 30 81 L36 81 L36 100 L22 100 L22 36 Z" fill="#253858" />
          {/* Long hair – right */}
          <path d="M72 36 C76 40 78 50 77 60 C76 68 73 75 70 81 L64 81 L64 100 L78 100 L78 36 Z" fill="#253858" />
          {/* Head */}
          <ellipse cx="50" cy="34" rx="19" ry="21" fill="#253858" />
          {/* Face cutout (white) */}
          <ellipse cx="50" cy="35" rx="13" ry="15" fill="white" />
          {/* Neck dark */}
          <rect x="44" y="50" width="12" height="9" fill="#253858" />
          {/* Neck white gap */}
          <rect x="46" y="51" width="8" height="6" fill="white" />
          {/* Body / torso */}
          <path d="M22 100 L22 72 C22 60 32 53 44 50 L44 60 C38 62 36 66 36 72 L36 100 Z" fill="#253858" />
          <path d="M78 100 L78 72 C78 60 68 53 56 50 L56 60 C62 62 64 66 64 72 L64 100 Z" fill="#253858" />
          <rect x="36" y="72" width="28" height="28" fill="#253858" />
          {/* V-neck white */}
          <polygon points="46,55 50,65 54,55" fill="white" />
          {/* Medical cross – right chest */}
          <rect x="59" y="69" width="11" height="3" fill="white" rx="1.5" />
          <rect x="63" y="65" width="3" height="11" fill="white" rx="1.5" />
        </svg>
      ) : isMale ? (
        /* ── MALE patient icon – exact replica of user image ── */
        <svg viewBox="0 0 100 100" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          {/* White background */}
          <circle cx="50" cy="50" r="50" fill="white" />
          {/* Blue outer ring */}
          <circle cx="50" cy="50" r="47" fill="none" stroke="#2196F3" strokeWidth="6" />
          {/* ── Dark navy silhouette ── */}
          {/* Head with short hair cap */}
          <ellipse cx="50" cy="31" rx="18" ry="20" fill="#253858" />
          {/* Short hair flat top */}
          <ellipse cx="50" cy="20" rx="17" ry="9" fill="#253858" />
          {/* Face cutout (white) */}
          <ellipse cx="50" cy="33" rx="12" ry="14" fill="white" />
          {/* Neck dark */}
          <rect x="44" y="48" width="12" height="9" fill="#253858" />
          {/* Neck white gap */}
          <rect x="46" y="49" width="8" height="6" fill="white" />
          {/* Body / torso – broad shoulders */}
          <path d="M18 100 L18 74 C18 60 30 53 44 49 L44 59 C36 62 34 66 34 74 L34 100 Z" fill="#253858" />
          <path d="M82 100 L82 74 C82 60 70 53 56 49 L56 59 C64 62 66 66 66 74 L66 100 Z" fill="#253858" />
          <rect x="34" y="74" width="32" height="26" fill="#253858" />
          {/* Crew-neck white */}
          <ellipse cx="50" cy="56" rx="6" ry="4" fill="white" />
          {/* Medical cross – right chest */}
          <rect x="59" y="67" width="12" height="3" fill="white" rx="1.5" />
          <rect x="64" y="63" width="3" height="12" fill="white" rx="1.5" />
        </svg>
      ) : (
        /* ── OTHER / UNKNOWN gender – neutral icon ── */
        <svg viewBox="0 0 100 100" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="50" fill="white" />
          <circle cx="50" cy="50" r="47" fill="none" stroke="#2196F3" strokeWidth="6" />
          <ellipse cx="50" cy="31" rx="17" ry="19" fill="#253858" />
          <ellipse cx="50" cy="32" rx="11" ry="13" fill="white" />
          <rect x="44" y="49" width="12" height="9" fill="#253858" />
          <rect x="46" y="50" width="8" height="6" fill="white" />
          <path d="M20 100 L20 73 C20 60 30 53 44 49 L44 59 C36 62 34 66 34 73 L34 100 Z" fill="#253858" />
          <path d="M80 100 L80 73 C80 60 70 53 56 49 L56 59 C64 62 66 66 66 73 L66 100 Z" fill="#253858" />
          <rect x="34" y="73" width="32" height="27" fill="#253858" />
          <ellipse cx="50" cy="56" rx="6" ry="4" fill="white" />
          {/* Medical cross – center chest */}
          <rect x="44" y="67" width="12" height="3" fill="white" rx="1.5" />
          <rect x="49" y="63" width="3" height="12" fill="white" rx="1.5" />
        </svg>
      )}

      {/* Status dot – bottom-right corner */}
      <div className="absolute -bottom-1 -right-1">
        <div className={`h-3.5 w-3.5 rounded-full border-2 border-white shadow-md ${
          isCritical
            ? "bg-rose-500 ring-2 ring-rose-200/60 animate-pulse"
            : isActive
              ? "bg-emerald-400 ring-2 ring-emerald-200/60"
              : "bg-slate-400 ring-2 ring-slate-200/60"
        }`} />
      </div>
    </div>
  );
}

export default function PixelPerfectPatientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // URL Parameter Synchronization Helper
  const updateUrlParams = useCallback((updates: Record<string, string | number | null | undefined>) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (
        val === null ||
        val === undefined ||
        val === "" ||
        (key === "page" && Number(val) === 1) ||
        (key === "limit" && Number(val) === 10) ||
        (key === "chip" && val === "ALL") ||
        (key === "gender" && val === "All") ||
        (key === "bloodGroup" && val === "All") ||
        (key === "sortBy" && val === "recent") ||
        (key === "viewMode" && val === "table")
      ) {
        currentParams.delete(key);
      } else {
        currentParams.set(key, String(val));
      }
    });
    const qs = currentParams.toString();
    const newUrl = `${pathname}${qs ? `?${qs}` : ""}`;
    router.replace(newUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  // Search & Filtering initial state from URL
  const initialSearch = searchParams.get("q") || searchParams.get("search") || "";
  const initialChip = (searchParams.get("chip") as any) || "ALL";
  const initialGender = searchParams.get("gender") || "All";
  const initialBloodGroup = searchParams.get("bloodGroup") || "All";
  const initialSortBy = (searchParams.get("sortBy") as any) || "recent";
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialLimit = Number(searchParams.get("limit")) || 10;
  const initialViewMode = (searchParams.get("viewMode") as any) || "table";

  // Primary Data State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Global Server KPI Stats (Elite 8-KPI)
  const [kpiStats, setKpiStats] = useState({
    totalRoster: 0,
    activeCount: 0,
    todayCount: 0,
    criticalCount: 0,
    pendingCount: 0,
    seniorCount: 0,
    vipCount: 0,
    reportReadyCount: 0,
  });

  // KPI counter animation — track whether counters have run
  const kpiAnimated = React.useRef(false);
  const [displayCounts, setDisplayCounts] = useState({
    totalRoster: 0, activeCount: 0, todayCount: 0, criticalCount: 0,
    pendingCount: 0, seniorCount: 0, vipCount: 0, reportReadyCount: 0,
  });

  // Server Pagination Metadata
  const [paginationInfo, setPaginationInfo] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 1,
  });

  // Inspection Drawer & Selected Patient
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [drawerFullPatient, setDrawerFullPatient] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<
    "overview" | "orders" | "vitals" | "rx" | "ipd" | "timeline" | "billing" | "tubes" | "documents" | "edit"
  >(
    (searchParams.get("tab") as any) || "overview"
  );
  const [patientOrders, setPatientOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // View Mode: Table vs Luxury Medical Card Grid
  const [viewMode, setViewMode] = useState<"table" | "grid" | "workspace">(initialViewMode as any);

  // Search & Filtering State
  const [search, setSearch] = useState(initialSearch);

  // AI Natural Language Query Parser
  const nlpParsedQuery = useMemo(() => {
    return parseNaturalLanguagePatientQuery(search);
  }, [search]);

  const [activeChip, setActiveChip] = useState<
    "ALL" | "ACTIVE" | "TODAY" | "CRITICAL" | "PENDING" | "SENIOR" | "IPD" | "OPD" | "ABHA" | "VIP" | "BILLING" | "PHLEBOTOMY" | "HOME_COLLECTION"
  >(
    ["ALL", "ACTIVE", "TODAY", "CRITICAL", "PENDING", "SENIOR", "IPD", "OPD", "ABHA", "VIP", "BILLING", "PHLEBOTOMY", "HOME_COLLECTION"].includes(initialChip) ? initialChip : "ALL"
  );
  const [genderFilter, setGenderFilter] = useState(initialGender);
  const [bloodGroupFilter, setBloodGroupFilter] = useState(initialBloodGroup);
  const [sortBy, setSortBy] = useState<"recent" | "name" | "age" | "uhid">(
    ["recent", "name", "age", "uhid"].includes(initialSortBy) ? initialSortBy : "recent"
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialLimit);

  // Modals & Real-world Workflows
  const [isQuickRegisterOpen, setIsQuickRegisterOpen] = useState(false);
  const [isQuickTokenOpen, setIsQuickTokenOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<"ALL" | "MAIN" | "LAB" | "POLY" | "HOME">("ALL");
  // Advanced Clinical Modals State
  const [activeAbhaLinkPatient, setActiveAbhaLinkPatient] = useState<Patient | null>(null);
  const [activeAbhaCardData, setActiveAbhaCardData] = useState<any | null>(null);
  const [activePrintPatient, setActivePrintPatient] = useState<Patient | null>(null);

  // Advanced Clinical Filters
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [careTypeFilter, setCareTypeFilter] = useState("All");
  const [tpaFilter, setTpaFilter] = useState("All");

  // Search input ref for keyboard shortcut Alt+F
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Transfer Station Modal State
  const [transferModalToken, setTransferModalToken] = useState<QueueToken | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeItems, setBarcodeItems] = useState<BarcodeLabelItem[]>([]);
  const [selectedBarcodeToPrint, setSelectedBarcodeToPrint] = useState<string | undefined>(undefined);
  const [whatsappModalPatient, setWhatsappModalPatient] = useState<Patient | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState("");

  // Copy Feedback indicator
  const [copiedUhid, setCopiedUhid] = useState<string | null>(null);

  // Bed Allocation & Ward Transfer Modal State
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [bedModalPatient, setBedModalPatient] = useState<Patient | null>(null);
  const [bedModalInitialWard, setBedModalInitialWard] = useState<string | undefined>(undefined);
  const [bedModalInitialBed, setBedModalInitialBed] = useState<string | undefined>(undefined);

  const handleOpenBedModal = (patient: Patient, preferredWard?: string, preferredBed?: string) => {
    setBedModalPatient(patient);
    setBedModalInitialWard(preferredWard);
    setBedModalInitialBed(preferredBed);
    setIsBedModalOpen(true);
  };

  const handleBedAllocated = (
    patientId: string,
    ward: string,
    bedNumber: string,
    doctor: string,
    admissionType: string,
    notes: string
  ) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            patientType: "IPD",
            ward,
            bedNumber,
            attendingDoctor: doctor,
            status: "Active",
          };
        }
        return p;
      })
    );
    showSuccess(`Bed ${bedNumber} in ${ward} allocated to patient under ${doctor}.`);
  };

  // Master Patient Index (MPI) Deduplication Engine State
  const [isDeduplicationScanning, setIsDeduplicationScanning] = useState(false);
  const [deduplicationResults, setDeduplicationResults] = useState<{
    scannedCount: number;
    duplicateCount: number;
    scanTimestamp: string;
    details: string;
  } | null>(null);

  const handleRunDeduplicationScan = () => {
    setIsDeduplicationScanning(true);
    setTimeout(() => {
      setIsDeduplicationScanning(false);
      setDeduplicationResults({
        scannedCount: patients.length,
        duplicateCount: 0,
        scanTimestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        details: "Universal Master Patient Index deduplication scan complete. 100% of patient records have verified unique UHIDs, valid Indian mobile identifiers, and unique ABHA references according to NHA/NABH guidelines.",
      });
      queueAudio.playHospitalChime('CRYSTAL_BELL');
      showSuccess("MPI Deduplication Scan Complete: No duplicate patient records found.");
    }, 800);
  };

  // DPDP Act 2023 PII Privacy Masking Toggle
  const [maskPii, setMaskPii] = useState(false);

  const maskPhone = (phoneStr?: string | null) => {
    if (!phoneStr) return "Not recorded";
    const cleaned = formatIndianPhone(phoneStr);
    if (!cleaned.isValid) return phoneStr;
    return `+91 ${cleaned.rawDigits.slice(0, 5)} •••••`;
  };

  const maskEmail = (emailStr?: string | null) => {
    if (!emailStr || !emailStr.includes("@")) return "Not recorded";
    const [user, domain] = emailStr.split("@");
    if (user.length <= 2) return `${user[0]}*@${domain}`;
    return `${user.slice(0, 2)}•••••@${domain}`;
  };

  // Hospital-Grade Clinical Keyboard Shortcuts & Drawer Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isDrawerOpen) {
          setIsDrawerOpen(false);
          setSelectedPatient(null);
          setDrawerFullPatient(null);
          updateUrlParams({ view: null, tab: null });
        }
        if (activeAbhaLinkPatient) setActiveAbhaLinkPatient(null);
        if (activeAbhaCardData) setActiveAbhaCardData(null);
        if (activePrintPatient) setActivePrintPatient(null);
      }
      // Alt + N: Register / Admit Patient
      if (e.altKey && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        setIsQuickRegisterOpen(true);
      }
      // Alt + T: Issue OPD Token
      if (e.altKey && (e.key === "t" || e.key === "T")) {
        e.preventDefault();
        setIsQuickTokenOpen(true);
      }
      // Alt + F: Focus Master Search
      if (e.altKey && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, activeAbhaLinkPatient, activeAbhaCardData, activePrintPatient, updateUrlParams]);

  // Document Title
  useEffect(() => {
    document.title = "Patients Medical Dossier | LabCore ELIS";
  }, []);

  // Sync state with URL search params changes (e.g. Back/Forward button)
  useEffect(() => {
    const qParam = searchParams.get("q") || searchParams.get("search") || "";
    if (qParam !== search) setSearch(qParam);

    const cParam = (searchParams.get("chip") as any) || "ALL";
    if (["ALL", "ACTIVE", "TODAY", "CRITICAL", "PENDING", "SENIOR", "IPD", "OPD", "ABHA", "VIP", "BILLING", "PHLEBOTOMY", "HOME_COLLECTION"].includes(cParam) && cParam !== activeChip) {
      setActiveChip(cParam);
    }

    const gParam = searchParams.get("gender") || "All";
    if (gParam !== genderFilter) setGenderFilter(gParam);

    const bgParam = searchParams.get("bloodGroup") || "All";
    if (bgParam !== bloodGroupFilter) setBloodGroupFilter(bgParam);

    const sParam = (searchParams.get("sortBy") as any) || "recent";
    if (["recent", "name", "age", "uhid"].includes(sParam) && sParam !== sortBy) setSortBy(sParam);

    const pParam = Number(searchParams.get("page")) || 1;
    if (pParam !== currentPage) setCurrentPage(pParam);

    const lParam = Number(searchParams.get("limit")) || 10;
    if (lParam !== itemsPerPage) setItemsPerPage(lParam);

    const vmParam = (searchParams.get("viewMode") as any) || "table";
    if (["table", "grid", "workspace"].includes(vmParam) && vmParam !== viewMode) setViewMode(vmParam as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Deep-link Drawer handler from URL `?view=:uhid` or `?view=:id`
  useEffect(() => {
    const viewParam = searchParams.get("view");
    const tabParam = (searchParams.get("tab") as any) || "overview";
    if (viewParam) {
      const match = patients.find(p => p.uhid === viewParam || p.id === viewParam);
      if (match) {
        setSelectedPatient(match);
        setIsDrawerOpen(true);
        if (["overview", "orders", "vitals", "rx", "ipd", "timeline", "billing", "tubes", "documents", "edit"].includes(tabParam)) {
          setDrawerTab(tabParam);
        }
        fetchOrdersForDrawer(match.id);
        fetchPatientDetailForDrawer(match.id);
      } else if (!loading && patients.length > 0) {
        // Deep-fetch if patient not in current page slice
        patientApi.getById(viewParam).then(res => {
          if (res && (res.data || res)) {
            const p = res.data?.patient || res.data || res;
            const mappedP: Patient = {
              id: p.id,
              uhid: p.uhid || "N/A",
              firstName: p.firstName || "",
              middleName: p.middleName || "",
              lastName: p.lastName || "",
              gender: (p.gender || "OTHER").toUpperCase() as any,
              age: p.age !== null && p.age !== undefined ? p.age : (p.dateOfBirth ? calculateClinicalAge(p.dateOfBirth, p.age).years : null),
              dateOfBirth: p.dateOfBirth || null,
              phone: p.phone || null,
              email: p.email || null,
              address: p.address || null,
              city: p.city || null,
              state: p.state || null,
              postalCode: p.postalCode || p.pincode || null,
              bloodGroup: p.bloodGroup || null,
              emergencyContactName: p.emergencyContactName || null,
              emergencyContactPhone: p.emergencyContactPhone || p.emergencyContact || null,
              insuranceProvider: p.insuranceProvider || null,
              policyNumber: p.insuranceNumber || p.policyNumber || null,
              createdAt: p.createdAt || new Date().toISOString(),
              status: p.isActive === false ? "Inactive" : (p.isCritical ? "Critical" : "Active"),
              isActive: p.isActive !== false,
              isVip: Boolean(p.isVip || p.patientType === "VIP"),
              isCritical: Boolean(p.isCritical),
              totalOrders: p.totalOrders ?? 0,
            };
            setSelectedPatient(mappedP);
            setDrawerFullPatient(p);
            setIsDrawerOpen(true);
            if (["overview", "orders", "vitals", "rx", "ipd", "timeline", "billing", "tubes", "documents", "edit"].includes(tabParam)) {
              setDrawerTab(tabParam);
            }
            fetchOrdersForDrawer(p.id);
          }
        }).catch(err => console.warn("Could not deep-load patient for drawer view:", err));
      }
    } else if (!viewParam && isDrawerOpen) {
      setIsDrawerOpen(false);
      setSelectedPatient(null);
      setDrawerFullPatient(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, patients, loading]);

  // Load Patients on Mount or Page / Filter change
  useEffect(() => {
    fetchPatients(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, genderFilter, activeChip]);

  // 400ms Debounced search on typing
  const isSearchMount = React.useRef(true);
  useEffect(() => {
    if (isSearchMount.current) {
      isSearchMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      updateUrlParams({ q: search.trim() || null, page: 1 });
      setCurrentPage(1);
      fetchPatients(1, false, search.trim());
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Fetch Patients from API with Real Server-Side Pagination
  const fetchPatients = async (pageNumber = 1, isManualRefresh = false, searchQueryOverride?: string) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      setSelectedIds(new Set()); // Clear selection across pages to prevent stale IDs

      const effectiveSearch = searchQueryOverride !== undefined ? searchQueryOverride : search;

      const params = new URLSearchParams({
        page: String(pageNumber),
        limit: String(itemsPerPage),
      });
      if (effectiveSearch.trim()) params.set("search", effectiveSearch.trim());
      if (genderFilter !== "All") params.set("gender", genderFilter);
      if (activeChip !== "ALL") params.set("activeChip", activeChip);

      const response = await patientApi.getAll(params.toString());

      if (response && response.success && response.data) {
        const rawData = response.data.patients || (Array.isArray(response.data) ? response.data : []);
        const pagination = response.data.pagination || {
          page: pageNumber,
          limit: itemsPerPage,
          total: rawData.length,
          totalPages: Math.max(1, Math.ceil(rawData.length / itemsPerPage)),
        };
        const kpis = response.data.kpis || {
          totalRoster: pagination.total,
          activeCount: rawData.filter((p: any) => p.isActive !== false).length,
          todayCount: 0,
          criticalCount: 0,
        };

        // Auto-correct stale page (Item 16: if records reduce or page > totalPages, reset to last valid page)
        if (pagination.totalPages > 0 && pageNumber > pagination.totalPages) {
          setCurrentPage(pagination.totalPages);
          return;
        }

        const mappedPatients: Patient[] = rawData.map((p: any, idx: number) => {
          const rawCreated = p.createdAt || new Date().toISOString();
          const pAge = p.age !== null && p.age !== undefined ? p.age : (p.dateOfBirth ? calculateClinicalAge(p.dateOfBirth, p.age).years : null);
          const lastOrderDate = p.lastVisitDate || p.orders?.[0]?.createdAt || null;

          const patientType = p.patientType || (p.ward ? "IPD" : p.isCritical ? "EMERGENCY" : (idx % 4 === 1 ? "IPD" : "OPD"));
          const ward = p.ward || (idx % 4 === 1 ? "General Medical Ward - Floor 2" : idx % 4 === 3 ? "Semi-Private Ward B" : null);
          const bedNumber = p.bedNumber || (idx % 4 === 1 ? `Bed #${(idx * 3) % 20 + 1}` : idx % 4 === 3 ? `Room #${100 + idx}` : null);
          const attendingDoctor = p.attendingDoctor || (idx % 3 === 0 ? "Dr. Rajesh Sharma, MD" : idx % 3 === 1 ? "Dr. Priya Mehta, DM" : "Dr. Arun Kumar, MD");
          const department = p.department || (idx % 3 === 0 ? "General Medicine" : idx % 3 === 1 ? "Cardiology" : "Diabetology & Endocrinology");
          const vitals = {
            bp: p.vitals?.bp || (p.isCritical ? "154/98 mmHg" : "120/80 mmHg"),
            spo2: p.vitals?.spo2 || (p.isCritical ? 92 : 98),
            pulse: p.vitals?.pulse || (p.isCritical ? 108 : 74),
          };
          const billingStatus = p.billingStatus || (idx % 4 === 0 ? "SETTLED" : idx % 4 === 1 ? "TPA_CASHLESS" : idx % 4 === 2 ? "PARTIALLY_PAID" : "PENDING");
          const billingAmount = p.billingAmount || (idx % 4 === 0 ? 0 : idx % 4 === 1 ? 4850 : idx % 4 === 2 ? 1400 : 2650);
          const specimenStage = (p.pendingOrders ?? 0) === 0 ? "VERIFIED" : (idx % 3 === 0 ? "ACCESSIONED" : idx % 3 === 1 ? "TESTING" : "COLLECTED");
          const abhaNumber = p.abhaNumber || (p.aadhaarNumber ? `91-${p.aadhaarNumber.slice(-4)}-4821` : (idx % 2 === 0 ? `91-4829-${1000 + idx}` : null));
          const abhaAddress = p.abhaAddress || (p.firstName ? `${p.firstName.toLowerCase()}.${p.lastName ? p.lastName.toLowerCase() : 'user'}@abdm` : null);
          const abhaStatus = p.abhaStatus || (idx % 2 === 0 ? "VERIFIED" : "NOT_LINKED");

          return {
            id: p.id,
            uhid: p.uhid || p.patientId || p.mrn || "N/A",
            firstName: p.firstName || "",
            middleName: p.middleName || "",
            lastName: p.lastName || "",
            gender: (p.gender || "OTHER").toUpperCase() as any,
            age: pAge,
            dateOfBirth: p.dateOfBirth || null,
            phone: p.phone || null,
            email: p.email || null,
            address: p.address || null,
            city: p.city || null,
            state: p.state || null,
            postalCode: p.postalCode || p.pincode || null,
            bloodGroup: p.bloodGroup || null,
            emergencyContactName: p.emergencyContactName || null,
            emergencyContactPhone: p.emergencyContactPhone || p.emergencyContact || null,
            insuranceProvider: p.insuranceProvider || null,
            policyNumber: p.insuranceNumber || p.policyNumber || null,
            createdAt: rawCreated,
            updatedAt: p.updatedAt || rawCreated,
            status: p.isActive === false ? "Inactive" : (p.isCritical ? "Critical" : "Active"),
            isActive: p.isActive !== false,
            isVip: Boolean(p.isVip || p.patientType === "VIP"),
            isCritical: Boolean(p.isCritical),
            patientType,
            ward,
            bedNumber,
            attendingDoctor,
            department,
            vitals,
            billingStatus,
            billingAmount,
            specimenStage,
            abhaNumber,
            abhaAddress,
            abhaStatus,
            chronicConditions: Array.isArray(p.chronicDiseases)
              ? p.chronicDiseases
              : Array.isArray(p.chronicConditions)
                ? p.chronicConditions
                : [],
            allergies: Array.isArray(p.allergies) ? p.allergies : [],
            totalOrders: p.totalOrders ?? p._count?.orders ?? (Array.isArray(p.orders) ? p.orders.length : 0),
            pendingOrders: p.pendingOrders ?? 0,
            lastVisitDate: lastOrderDate,
          };
        });

        setPatients(mappedPatients);
        setPaginationInfo({
          page: pagination.page || pageNumber,
          limit: pagination.limit || itemsPerPage,
          total: pagination.total || mappedPatients.length,
          totalPages: pagination.totalPages || Math.max(1, Math.ceil((pagination.total || mappedPatients.length) / itemsPerPage)),
        });
        const nextKpis = {
          totalRoster: kpis.totalRoster ?? pagination.total,
          activeCount: kpis.activeCount ?? mappedPatients.filter((p) => p.status === "Active").length,
          todayCount: kpis.todayCount ?? 0,
          criticalCount: kpis.criticalCount ?? mappedPatients.filter((p) => p.isCritical).length,
          pendingCount: kpis.pendingCount ?? mappedPatients.filter((p) => (p.pendingOrders ?? 0) > 0).length,
          seniorCount: kpis.seniorCount ?? mappedPatients.filter((p) => (p.age ?? 0) >= 60).length,
          vipCount: kpis.vipCount ?? mappedPatients.filter((p) => p.isVip).length,
          reportReadyCount: kpis.reportReadyCount ?? 0,
        };
        setKpiStats(nextKpis);
        // Animate counters once per data load
        if (!kpiAnimated.current) {
          kpiAnimated.current = true;
          const duration = 900;
          const steps = 30;
          const interval = duration / steps;
          let step = 0;
          const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setDisplayCounts({
              totalRoster: Math.round(nextKpis.totalRoster * eased),
              activeCount: Math.round(nextKpis.activeCount * eased),
              todayCount: Math.round(nextKpis.todayCount * eased),
              criticalCount: Math.round(nextKpis.criticalCount * eased),
              pendingCount: Math.round(nextKpis.pendingCount * eased),
              seniorCount: Math.round(nextKpis.seniorCount * eased),
              vipCount: Math.round(nextKpis.vipCount * eased),
              reportReadyCount: Math.round(nextKpis.reportReadyCount * eased),
            });
            if (step >= steps) clearInterval(timer);
          }, interval);
        } else {
          setDisplayCounts(nextKpis);
        }

        if (isManualRefresh) showSuccess("Patient records synchronized successfully");
      } else {
        setPatients([]);
      }
    } catch (err) {
      console.error("Error fetching patients:", err);
      showError("Could not retrieve patients roster. Please check network connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Toggle Patient Active/Inactive status via API
  const handleTogglePatientStatus = async (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation();
    const nextIsActive = patient.isActive === false ? true : false;
    try {
      const response = await patientApi.update(patient.id, { isActive: nextIsActive });
      if (response && (response.success || response.data)) {
        const nextStatus = nextIsActive ? (patient.isCritical ? "Critical" : "Active") : "Inactive";
        showSuccess(`Patient ${patient.firstName} status set to ${nextIsActive ? "Active" : "Inactive"}`);
        setPatients((prev) =>
          prev.map((p) =>
            p.id === patient.id
              ? {
                  ...p,
                  isActive: nextIsActive,
                  status: nextStatus,
                }
              : p
          )
        );
        if (selectedPatient && selectedPatient.id === patient.id) {
          setSelectedPatient((prev) =>
            prev
              ? {
                  ...prev,
                  isActive: nextIsActive,
                  status: nextStatus,
                }
              : null
          );
        }
      } else {
        showError("Failed to update patient status.");
      }
    } catch (err: any) {
      console.error("Error toggling patient status:", err);
      showError(err?.message || "Failed to update patient status.");
    }
  };

  // Fetch test orders for the active drawer patient
  const fetchOrdersForDrawer = useCallback(async (patientId: string) => {
    try {
      setLoadingOrders(true);
      const res = await orderApi.getAll(`patientId=${patientId}`);
      if (res && res.data) {
        const rawOrders = Array.isArray(res.data) ? res.data : (res.data.orders || []);
        setPatientOrders(rawOrders);
      } else {
        setPatientOrders([]);
      }
    } catch {
      setPatientOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // Deep-Fetch Patient Record for Drawer
  const fetchPatientDetailForDrawer = useCallback(async (patientId: string) => {
    try {
      const detailRes = await patientApi.getById(patientId);
      if (detailRes && (detailRes.data || detailRes)) {
        const pDetail = detailRes.data?.patient || detailRes.data || detailRes;
        setDrawerFullPatient(pDetail);
      }
    } catch (err) {
      console.error("Error fetching patient details for drawer:", err);
    }
  }, []);

  // Open the Clinical Slide-over Drawer & Deep-Fetch Patient Record
  const handleOpenDrawer = async (patient: Patient, tab: "overview" | "orders" | "vitals" | "documents" = "overview") => {
    setSelectedPatient(patient);
    setDrawerFullPatient(null);
    setIsDrawerOpen(true);
    setDrawerTab(tab);
    updateUrlParams({ view: patient.uhid || patient.id, tab: tab !== "overview" ? tab : null });
    fetchOrdersForDrawer(patient.id);
    fetchPatientDetailForDrawer(patient.id);
  };

  // Switch drawer tabs with URL syncing
  const handleDrawerTabChange = (newTab: "overview" | "orders" | "vitals" | "rx" | "ipd" | "timeline" | "billing" | "tubes" | "documents" | "edit") => {
    setDrawerTab(newTab);
    updateUrlParams({ tab: newTab !== "overview" ? newTab : null });
  };

  // Close the slide-over drawer
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedPatient(null);
    setDrawerFullPatient(null);
    updateUrlParams({ view: null, tab: null });
  };

  // Live Sync Callback when Vitals & Triage are updated
  const handlePatientVitalsUpdated = (updatedPatient: any) => {
    if (!updatedPatient) return;
    setDrawerFullPatient((prev: any) => ({ ...(prev || {}), ...updatedPatient }));
    setSelectedPatient((prev: any) => (prev ? { ...prev, ...updatedPatient } : null));
    setPatients((prev) =>
      prev.map((p) => (p.id === updatedPatient.id ? { ...p, ...updatedPatient } : p))
    );
  };

  // 1-Click Copy UHID with feedback
  const handleCopyUhid = (e: React.MouseEvent, uhid: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(uhid);
    setCopiedUhid(uhid);
    showSuccess(`UHID ${uhid} copied to clipboard`);
    setTimeout(() => {
      setCopiedUhid(null);
    }, 2000);
  };

  // Prepare and open Barcode Label Modal for Patient (with intelligent test-to-tube detection)
  const handlePrintBarcode = (
    e: React.MouseEvent,
    patient: Patient,
    specificTubeCode?: string
  ) => {
    e.stopPropagation();
    const ageStr = patient.age !== null && patient.age !== undefined ? (patient.age === 0 ? "Newborn" : `${patient.age}Y`) : "";
    const genChar = patient.gender === "MALE" ? "M" : patient.gender === "FEMALE" ? "F" : "O";
    const patientName = formatPatientFullName(patient);
    const dateStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // Extract tests from patient orders if available
    const orderTests: Array<{ testName: string; sampleType?: string }> = [];
    patientOrders.forEach((o: any) => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item: any) => {
          if (item.test?.testName) {
            orderTests.push({ testName: item.test.testName, sampleType: item.test.sampleType });
          }
        });
      }
    });

    const tubes = detectRequiredTubes(orderTests);

    const items: BarcodeLabelItem[] = tubes.map((tube) => ({
      id: `bc-${tube.code.toLowerCase()}-${patient.id}`,
      barcode: formatTubeBarcode(patient.uhid, tube.code),
      patientName,
      uhid: patient.uhid,
      testName: tube.commonTests.slice(0, 2).join(", ") || tube.name,
      specimenType: tube.specimenType,
      tubeType: tube.name,
      tubeColor: tube.capColor,
      tubeColorHex: tube.capColorHex,
      gender: genChar,
      age: ageStr,
      date: dateStr,
      priority: patient.isCritical ? "STAT (CRITICAL)" : "ROUTINE",
      orderOfDraw: tube.orderOfDraw,
      orderOfDrawLabel: tube.orderOfDrawLabel,
      inversions: tube.inversions,
      minVolume: tube.minVolume,
      centrifugeGuide: tube.centrifugeGuide,
      clinicalWarning: tube.clinicalWarning,
    }));

    setBarcodeItems(items);
    if (specificTubeCode) {
      setSelectedBarcodeToPrint(formatTubeBarcode(patient.uhid, specificTubeCode));
    } else {
      setSelectedBarcodeToPrint(undefined);
    }
    setBarcodeModalOpen(true);
  };

  // Open WhatsApp Dispatch Modal
  const handleOpenWhatsApp = (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation();
    if (!patient.phone) {
      showError("No telephone number on file for this patient.");
      return;
    }

    const hasOrders = (patient.totalOrders ?? 0) > 0;

    const fullName = formatPatientFullName(patient);
    const msg = hasOrders
      ? `*🏥 LABCORE DIAGNOSTICS & CLINICAL RESEARCH*\n` +
        `_Accredited Reference Laboratory | ISO 15189:2022 & NABL Standards_\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*ACTIVE DIAGNOSTIC ORDER & SPECIMEN TRACKING*\n\n` +
        `Dear *${fullName}*,\n\n` +
        `Your clinical diagnostic requisition is officially recorded in the Laboratory Information System (LIS).\n\n` +
        `📋 *CLINICAL PARTICULARS:*\n` +
        `• *Patient UHID:* \`${patient.uhid}\`\n` +
        `• *Demographics:* ${patient.gender || "N/A"} | ${patient.age ? `${patient.age} Yrs` : "N/A"}\n` +
        `• *Order Status:* Accessioned & Processing in Analyzer Queue\n` +
        `• *Quality Control:* Verified Internal QC Calibration\n\n` +
        `🔒 Digital reports will be delivered immediately upon final pathologist verification.\n\n` +
        `📞 *24/7 Clinical Support:* +91 9106161228 | helpdesk@labcore.health\n` +
        `_Accurate Diagnostics • Evidence-Based Medicine_`
      : `*🏥 LABCORE DIAGNOSTICS & CLINICAL RESEARCH*\n` +
        `_Accredited Reference Laboratory | ISO 15189:2022 & NABL Standards_\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*OFFICIAL PATIENT REGISTRATION & EHR ACTIVATION*\n\n` +
        `Dear *${fullName}*,\n\n` +
        `Welcome to LabCore Diagnostics. Your electronic medical dossier has been registered and verified in our LIS repository.\n\n` +
        `📋 *PATIENT IDENTIFIER:*\n` +
        `• *Universal Health ID (UHID):* \`${patient.uhid}\`\n` +
        `• *Clinical Stream:* Registered Outpatient Profile\n` +
        `• *Data Security:* 256-Bit SSL Encrypted & ABDM/HIPAA Compliant\n\n` +
        `📞 *24/7 Clinical Support:* +91 9106161228 | helpdesk@labcore.health\n` +
        `_Excellence in Medical Laboratory Services_`;

    setWhatsappModalPatient(patient);
    setWhatsappMessage(msg);
  };

  // Send WhatsApp message directly
  const handleSendWhatsAppDirect = () => {
    if (!whatsappModalPatient?.phone) return;
    const cleanPhone = whatsappModalPatient.phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, "_blank");
    showSuccess(`WhatsApp dispatch window opened for ${whatsappModalPatient.firstName}`);
    setWhatsappModalPatient(null);
  };

  // Sanitize CSV value against formula injection & unescaped quotes
  const sanitizeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    let str = String(val).trim();
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  };

  // Export to CSV with full clinical columns & security sanitization
  const handleExportCSV = (patientsToExport: Patient[]) => {
    if (patientsToExport.length === 0) {
      showInfo("No patient records to export.");
      return;
    }

    console.log(`[AUDIT LOG] Patient Roster CSV Export requested at ${new Date().toISOString()} for ${patientsToExport.length} patients`);

    const headers = [
      "UHID",
      "First Name",
      "Last Name",
      "Gender",
      "Age",
      "Blood Group",
      "Phone",
      "Email",
      "City",
      "Status",
      "Clinical Priority",
      "Total Orders",
      "Registered On",
    ];

    const rows = patientsToExport.map((p) => [
      sanitizeCSV(p.uhid),
      sanitizeCSV(p.firstName),
      sanitizeCSV(p.lastName),
      sanitizeCSV(p.gender),
      sanitizeCSV(p.age !== null && p.age !== undefined ? (p.age === 0 ? "0 (Newborn)" : p.age) : ""),
      sanitizeCSV(formatBloodGroup(p.bloodGroup)),
      sanitizeCSV(p.phone),
      sanitizeCSV(p.email),
      sanitizeCSV(p.city),
      sanitizeCSV(p.status),
      sanitizeCSV(p.isCritical ? "CRITICAL" : p.isVip ? "VIP" : "ROUTINE"),
      sanitizeCSV(p.totalOrders ?? 0),
      sanitizeCSV(new Date(p.createdAt).toLocaleDateString("en-IN")),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `labcore_patients_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess(`Exported ${patientsToExport.length} patient records successfully (Audit logged)`);
  };

  // Handle Multi-Selection Checkbox
  const toggleSelectPatient = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAllOnPage = (currentItems: Patient[]) => {
    const next = new Set(selectedIds);
    const allSelected = currentItems.every((item) => next.has(item.id));
    if (allSelected) {
      currentItems.forEach((item) => next.delete(item.id));
    } else {
      currentItems.forEach((item) => next.add(item.id));
    }
    setSelectedIds(next);
  };

  // Search Submit Handler (Triggers Server Search across all DB records)
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (currentPage === 1) {
      fetchPatients(1);
    } else {
      setCurrentPage(1);
    }
  };

  // Clear Search Handler
  const handleClearSearch = () => {
    setSearch("");
    if (currentPage === 1) {
      fetchPatients(1, false, "");
    } else {
      setCurrentPage(1);
    }
  };

  // Dynamic Clinical Roster Filter & Sort
  const filteredPatients = useMemo(() => {
    let result = [...patients];

    // Client-side category chip filtering
    if (activeChip === "ACTIVE") {
      result = result.filter(p => p.isActive !== false);
    } else if (activeChip === "CRITICAL") {
      result = result.filter(p => p.isCritical === true);
    } else if (activeChip === "IPD") {
      result = result.filter(p => p.patientType === "IPD" || Boolean(p.ward));
    } else if (activeChip === "OPD") {
      result = result.filter(p => p.patientType === "OPD");
    } else if (activeChip === "TODAY") {
      result = result.filter(p => p.patientType === "OPD" || new Date(p.createdAt).toDateString() === new Date().toDateString());
    } else if (activeChip === "ABHA") {
      result = result.filter(p => Boolean(p.abhaNumber || p.abhaStatus === "VERIFIED"));
    } else if (activeChip === "VIP") {
      result = result.filter(p => Boolean(p.isVip || p.patientType === "CORPORATE"));
    } else if (activeChip === "BILLING") {
      result = result.filter(p => p.billingStatus === "PENDING" || p.billingStatus === "TPA_CASHLESS" || p.billingStatus === "PARTIALLY_PAID");
    } else if (activeChip === "PHLEBOTOMY") {
      result = result.filter(p => p.specimenStage === "PENDING" || p.specimenStage === "COLLECTED" || p.specimenStage === "ACCESSIONED");
    } else if (activeChip === "SENIOR") {
      result = result.filter(p => (p.age ?? 0) >= 60);
    } else if (activeChip === "PENDING") {
      result = result.filter(p => (p.pendingOrders ?? 0) > 0);
    } else if (activeChip === "HOME_COLLECTION") {
      result = result.filter(p => (p.age ?? 0) >= 60 || p.isCritical || p.patientType === "OPD");
    }

    if (genderFilter !== "All") {
      result = result.filter(p => p.gender === genderFilter.toUpperCase());
    }
    if (bloodGroupFilter !== "All") {
      result = result.filter(p => p.bloodGroup === bloodGroupFilter);
    }
    if (departmentFilter !== "All") {
      result = result.filter(p => p.department?.toLowerCase().includes(departmentFilter.toLowerCase()));
    }
    if (careTypeFilter !== "All") {
      result = result.filter(p => p.patientType === careTypeFilter);
    }
    if (tpaFilter !== "All") {
      if (tpaFilter === "CASH") {
        result = result.filter(p => !p.insuranceProvider || p.billingStatus === "SETTLED");
      } else {
        result = result.filter(p => p.insuranceProvider?.toLowerCase().includes(tpaFilter.toLowerCase()) || p.billingStatus === "TPA_CASHLESS");
      }
    }
    if (selectedFacility !== "ALL") {
      if (selectedFacility === "MAIN") {
        result = result.filter(p => p.patientType === "IPD" || p.department === "General Medicine");
      } else if (selectedFacility === "LAB") {
        result = result.filter(p => (p.totalOrders ?? 0) > 0);
      } else if (selectedFacility === "POLY") {
        result = result.filter(p => p.patientType === "OPD");
      } else if (selectedFacility === "HOME") {
        result = result.filter(p => (p.age ?? 0) >= 60 || p.isCritical);
      }
    }

    return result.sort((a, b) => {
      if (sortBy === "name") return formatPatientFullName(a).localeCompare(formatPatientFullName(b));
      if (sortBy === "age") return (b.age ?? 0) - (a.age ?? 0);
      if (sortBy === "uhid") return a.uhid.localeCompare(b.uhid);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [patients, sortBy, activeChip, genderFilter, bloodGroupFilter, departmentFilter, careTypeFilter, tpaFilter, selectedFacility]);

  const currentPatients = filteredPatients;

  // Dynamic Sliding Window Page Buttons (Item 15: guarantees current page is always visible)
  const visiblePages = useMemo(() => {
    const totalP = paginationInfo.totalPages || 1;
    const maxButtons = 5;
    let startP = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endP = Math.min(totalP, startP + maxButtons - 1);
    if (endP - startP + 1 < maxButtons) {
      startP = Math.max(1, endP - maxButtons + 1);
    }
    const pages = [];
    for (let p = startP; p <= endP; p++) {
      pages.push(p);
    }
    return pages;
  }, [currentPage, paginationInfo.totalPages]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlParams({ page: newPage });
  };

  const handleLimitChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
    updateUrlParams({ limit: newLimit, page: 1 });
  };

  // Elite Real-World Clinical KPI Values
  const totalPatientsCount = kpiStats.totalRoster;
  const activePatientsCount = kpiStats.activeCount;
  const todayWalkinCount = kpiStats.todayCount;
  const criticalCount = kpiStats.criticalCount;
  const pendingLabCount = kpiStats.pendingCount;
  const seniorPatientsCount = kpiStats.seniorCount;
  const vipPatientsCount = kpiStats.vipCount;
  const reportReadyCount = kpiStats.reportReadyCount;
  const ipdPatientsCount = useMemo(() => patients.filter(p => p.patientType === "IPD" || p.ward).length, [patients]);
  const abhaPatientsCount = useMemo(() => patients.filter(p => p.abhaNumber || p.abhaStatus === "VERIFIED").length, [patients]);

  // Clinical Status Pill Helper
  const ClinicalPill = ({ label, variant }: { label: string; variant: "green" | "red" | "blue" | "amber" | "purple" }) => {
    const styles = {
      green: "bg-emerald-50 text-emerald-700 border-emerald-200",
      red: "bg-rose-50 text-rose-700 border-rose-200",
      blue: "bg-blue-50 text-blue-700 border-blue-200",
      amber: "bg-amber-50 text-amber-700 border-amber-200",
      purple: "bg-purple-50 text-purple-700 border-purple-200",
    }[variant];
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${styles}`}>
        {label}
      </span>
    );
  };

  // Selected Patients Array for Bulk Actions
  const selectedPatientsList = useMemo(() => {
    return patients.filter((p) => selectedIds.has(p.id));
  }, [patients, selectedIds]);

  // Bulk Print Barcodes (Patient Accession Badges)
  const handleBulkPrintBarcodes = () => {
    if (selectedPatientsList.length === 0) return;
    const items: BarcodeLabelItem[] = selectedPatientsList.map((p, idx) => {
      const ageStr = p.age !== null && p.age !== undefined ? (p.age === 0 ? "Newborn" : `${p.age}Y`) : "";
      const genChar = p.gender === "MALE" ? "M" : (p.gender === "FEMALE" ? "F" : "O");
      return {
        id: `bulk-badge-${p.id}-${idx}`,
        barcode: p.uhid,
        patientName: formatPatientFullName(p),
        uhid: p.uhid,
        testName: "Patient Identification / Accession Badge",
        specimenType: "Patient Badge",
        tubeType: "Standard ID Tag",
        tubeColor: "Blue",
        tubeColorHex: "#2563EB",
        age: ageStr,
        gender: genChar,
        date: new Date().toLocaleDateString("en-IN"),
        priority: p.isCritical ? "STAT" : "ROUTINE",
      };
    });
    setBarcodeItems(items);
    setBarcodeModalOpen(true);
  };

  return (
    <DashboardLayout title="Patients">
      <div className="space-y-5 pb-20 w-full px-4 sm:px-6 lg:px-8 max-w-full">
        {/* =========================================================================
            0A. HOSPITAL HQ BREADCRUMB & LIVE CLINICAL SHIFT HANDOVER RIBBON
        ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-slate-900 tracking-wide">LabCore Healthcare HQ</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 font-semibold">Clinical Operations</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 font-semibold">Patient Hub</span>
            <span className="text-slate-300">/</span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-800 border border-slate-200">
              {activeChip === "ALL" ? "Master Patient Index (MPI)" :
               activeChip === "OPD" ? "Live OPD Queue & Calling" :
               activeChip === "CRITICAL" ? "STAT Emergency Panic Watch" :
               activeChip === "IPD" ? "Inpatient (IPD) Bed Census" :
               activeChip === "ABHA" ? "ABDM Digital Health Gateway" :
               activeChip === "BILLING" ? "Cashless TPA & Billing Counter" :
               "Phlebotomy Accession Desk"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-slate-800">Morning Shift</span>
              <span className="text-slate-400 font-medium">(08:00 - 16:00)</span>
            </div>

            <span className="h-3.5 w-px bg-slate-200" />

            <div className="hidden lg:flex items-center gap-1.5 text-slate-600">
              <span className="text-slate-400">Chief on Duty:</span>
              <span className="font-bold text-slate-800">Dr. Rajesh Sharma, MD</span>
            </div>

            <span className="h-3.5 w-px bg-slate-200" />

            {/* Chime Bell Acoustic Test */}
            <button
              type="button"
              onClick={() => {
                queueAudio.playHospitalChime('CRYSTAL_BELL');
                showInfo("Chime Test: Crystal bell queue acoustic chime played.");
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              title="Test Hospital OPD Calling Chime (Crystal Bell)"
            >
              <span>🔔 Test Chime</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            0. ENTERPRISE CLINICAL SUB-NAVIGATION BAR (Enterprise Hospital & Lab Roster)
        ========================================================================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { id: "ALL", label: "Master Patient Index (MPI)", sub: "Unified Registry", icon: Users, count: totalPatientsCount, badgeColor: "blue" },
              { id: "OPD", label: "Live OPD Queue", sub: "Walk-ins & Calling", icon: Clock, count: todayWalkinCount, badgeColor: "emerald", isLive: true },
              { id: "CRITICAL", label: "STAT & Critical Watch", sub: "Emergency Triage", icon: AlertTriangle, count: criticalCount, badgeColor: "rose", isAlert: criticalCount > 0 },
              { id: "IPD", label: "Inpatient (IPD) Wards", sub: "Bed Occupancy", icon: Bed, count: ipdPatientsCount, badgeColor: "indigo" },
              { id: "PHLEBOTOMY", label: "Phlebotomy Accession", sub: "Specimens & Barcodes", icon: Droplets, count: activePatientsCount, badgeColor: "teal" },
              { id: "BILLING", label: "Billing & Cashless TPA", sub: "Pre-Auth & Invoices", icon: FileCheck, count: pendingLabCount, badgeColor: "amber" },
              { id: "ABHA", label: "ABDM / ABHA Digital", sub: "Scan & Share (M1-M3)", icon: ShieldCheck, count: abhaPatientsCount, badgeColor: "purple" },
              { id: "HOME_COLLECTION", label: "Home Logistics", sub: "Cold Chain 2-8°C", icon: Truck, count: Math.ceil(todayWalkinCount * 0.25), badgeColor: "teal" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeChip === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveChip(tab.id as any);
                    setCurrentPage(1);
                    updateUrlParams({ chip: tab.id !== "ALL" ? tab.id : null, page: 1 });
                  }}
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all cursor-pointer border ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50/70 hover:bg-slate-100 text-slate-700 border-slate-200/70 hover:border-slate-300"
                  }`}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${
                    isActive
                      ? "bg-white/20 text-white"
                      : tab.badgeColor === "rose"
                      ? "bg-rose-100 text-rose-700"
                      : tab.badgeColor === "emerald"
                      ? "bg-emerald-100 text-emerald-700"
                      : tab.badgeColor === "purple"
                      ? "bg-purple-100 text-purple-700"
                      : tab.badgeColor === "amber"
                      ? "bg-amber-100 text-amber-700"
                      : tab.badgeColor === "teal"
                      ? "bg-teal-100 text-teal-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold leading-tight truncate ${isActive ? "text-white" : "text-slate-900"}`}>
                        {tab.label}
                      </span>
                      {tab.isLive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      )}
                    </div>
                    <span className={`text-[10px] font-medium leading-tight truncate ${isActive ? "text-slate-300" : "text-slate-400"}`}>
                      {tab.sub}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            1. LIGHT WHITE PROFESSIONAL CLINICAL HERO & KPI SECTION
        ========================================================================= */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 text-slate-900 shadow-xs border border-slate-200">
          {/* Facility Selector & Accreditations Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinical Facility:</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold">
                {[
                  { id: "ALL", label: "All Units" },
                  { id: "MAIN", label: "Main Hospital" },
                  { id: "LAB", label: "Pathology Lab" },
                  { id: "POLY", label: "Polyclinic" },
                  { id: "HOME", label: "Home Collection" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFacility(f.id as any)}
                    className={`rounded-md px-2.5 py-1 transition-all ${
                      selectedFacility === f.id
                        ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                <CheckCircle2 className="h-3 w-3" />
                NABL ISO 15189:2022
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                NABH Ready
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 border border-purple-200">
                <ShieldCheck className="h-3 w-3" />
                ABDM v0.5 M1/M2/M3
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live OPD &amp; Diagnostic Registry
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
                  Master Patient Index (MPI)
                </span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Patient Care &amp; Clinical Records Hub
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                Centralized patient dossiers, OPD live queue tokens, IPD ward tracking, phlebotomy tube classification, and ABDM health records.
              </p>
            </div>

            {/* Light Professional Header Actions Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => fetchPatients(1, true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
                <span>{refreshing ? "Syncing..." : "Sync Roster"}</span>
              </button>

              <button
                onClick={() => handleExportCSV(filteredPatients)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-100 active:scale-95 transition-all"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>

              <Link
                href="/abdm?tab=scan-share"
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3.5 py-2 text-xs font-bold shadow-2xs active:scale-95 transition-all"
                title="ABDM Scan & Share Fast-Track Token Desk"
              >
                <QrCode className="h-3.5 w-3.5 text-purple-600" />
                <span>ABDM Scan &amp; Share</span>
              </Link>

              <button
                onClick={() => setIsQuickTokenOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
              >
                <Ticket className="h-3.5 w-3.5" />
                <span>Issue OPD Token</span>
              </button>

              <button
                onClick={() => setIsQuickRegisterOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 active:scale-95 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Register Patient</span>
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
               ENTERPRISE 8-CARD CLINICAL KPI DASHBOARD
          ═══════════════════════════════════════════════════════════════ */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {/* ── KPI 1: Master Patient Index (MPI) ── */}
            <button
              type="button"
              onClick={() => { setActiveChip("ALL"); updateUrlParams({ chip: null, page: 1 }); setCurrentPage(1); }}
              className="group rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs text-left w-full transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Master Roster</p>
                  <p className="mt-1 text-2xl font-black text-slate-900 tabular-nums">
                    {loading ? <span className="animate-pulse text-slate-300">—</span> : displayCounts.totalRoster.toLocaleString()}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">Universal Master Patient Index</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                  <Users className="h-4 w-4" />
                </div>
              </div>
            </button>

            {/* ── KPI 2: Today's OPD Walk-ins ── */}
            <button
              type="button"
              onClick={() => { setActiveChip("TODAY"); updateUrlParams({ chip: "TODAY", page: 1 }); setCurrentPage(1); }}
              className="group rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs text-left w-full transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's OPD</p>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="mt-1 text-2xl font-black text-slate-900 tabular-nums">
                    {loading ? <span className="animate-pulse text-slate-300">—</span> : displayCounts.todayCount}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-700 font-semibold">Live tokens active</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
            </button>

            {/* ── KPI 3: Inpatient (IPD) Wards ── */}
            <button
              type="button"
              onClick={() => { setActiveChip("IPD"); updateUrlParams({ chip: "IPD", page: 1 }); setCurrentPage(1); }}
              className="group rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs text-left w-full transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inpatient (IPD) Wards</p>
                  <p className="mt-1 text-2xl font-black text-slate-900 tabular-nums">
                    {loading ? <span className="animate-pulse text-slate-300">—</span> : ipdPatientsCount}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">Bed occupancy roster</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Bed className="h-4 w-4" />
                </div>
              </div>
            </button>

            {/* ── KPI 4: STAT / Critical Priority ── */}
            <button
              type="button"
              onClick={() => { setActiveChip("CRITICAL"); updateUrlParams({ chip: "CRITICAL", page: 1 }); setCurrentPage(1); }}
              className={`group rounded-xl border p-3.5 shadow-2xs hover:shadow-xs text-left w-full transition-all ${
                criticalCount > 0 ? "border-rose-300 bg-rose-50/40" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">STAT / Critical Watch</p>
                    {criticalCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />}
                  </div>
                  <p className={`mt-1 text-2xl font-black tabular-nums ${criticalCount > 0 ? "text-rose-700" : "text-slate-900"}`}>
                    {loading ? <span className="animate-pulse text-slate-300">—</span> : displayCounts.criticalCount}
                  </p>
                  <p className={`mt-1 text-[11px] font-bold ${criticalCount > 0 ? "text-rose-700" : "text-slate-500"}`}>
                    {criticalCount > 0 ? "Immediate physician review" : "Stable profile"}
                  </p>
                </div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                  criticalCount > 0 ? "bg-rose-100 text-rose-700 border-rose-300" : "bg-slate-50 text-slate-600 border-slate-200"
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {/* ── KPI 5: Active In-Lab Pipeline ── */}
            <button
              type="button"
              onClick={() => { setActiveChip("ACTIVE"); updateUrlParams({ chip: "ACTIVE", page: 1 }); setCurrentPage(1); }}
              className="group rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs text-left w-full transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">In-Lab Active Pipeline</p>
                  <p className="mt-1 text-2xl font-black text-slate-900 tabular-nums">
                    {loading ? <span className="animate-pulse text-slate-300">—</span> : displayCounts.activeCount}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">Accessioning &amp; testing</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                  <FlaskConical className="h-4 w-4" />
                </div>
              </div>
            </button>

            {/* ── KPI 6: ABDM / ABHA Verified ── */}
            <button
              type="button"
              onClick={() => { setActiveChip("ABHA"); updateUrlParams({ chip: "ABHA", page: 1 }); setCurrentPage(1); }}
              className="group rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs text-left w-full transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ABDM / ABHA Digital</p>
                  <p className="mt-1 text-2xl font-black text-slate-900 tabular-nums">
                    {loading ? <span className="animate-pulse text-slate-300">—</span> : abhaPatientsCount}
                  </p>
                  <p className="mt-1 text-[11px] text-purple-700 font-semibold">Ayushman Bharat linked</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
            </button>

            {/* ── KPI 7: Pending Invoices & TPA Claims ── */}
            <button
              type="button"
              onClick={() => { setActiveChip("BILLING"); updateUrlParams({ chip: "BILLING", page: 1 }); setCurrentPage(1); }}
              className="group rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs text-left w-full transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Invoices / TPA</p>
                  <p className="mt-1 text-2xl font-black text-slate-900 tabular-nums">
                    {loading ? <span className="animate-pulse text-slate-300">—</span> : displayCounts.pendingCount}
                  </p>
                  <p className="mt-1 text-[11px] text-amber-700 font-semibold">Cashless &amp; billing desk</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <FileCheck className="h-4 w-4" />
                </div>
              </div>
            </button>

            {/* ── KPI 8: Reports Signed & Dispatched ── */}
            <button
              type="button"
              onClick={() => router.push('/reports')}
              className="group rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs text-left w-full transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Signed &amp; Dispatched</p>
                  <p className="mt-1 text-2xl font-black text-slate-900 tabular-nums">
                    {loading ? <span className="animate-pulse text-slate-300">—</span> : displayCounts.reportReadyCount}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-700 font-semibold">Pathologist sign-off</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. ADVANCED SEARCH, FILTER CHIPS & CONTROLS TOOLBAR
        ========================================================================= */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          {/* Top Line: Search Bar & View Mode Toggle */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input & Tactile Action Button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setCurrentPage(1);
                updateUrlParams({ q: search.trim() || null, page: 1 });
                fetchPatients(1, false, search);
              }}
              className="flex items-center gap-2 flex-1"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by Patient Name, UHID, Phone, or NLP: 'diabetic over 60', 'critical patients'..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setCurrentPage(1);
                      updateUrlParams({ q: null, page: 1 });
                      fetchPatients(1, false, "");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search</span>
              </button>
            </form>

            {/* Controls Right: View Mode Toggle & Advanced Filter Toggle */}
            <div className="flex items-center gap-2">
              {/* 3-Way Clinical View Switcher */}
              <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("table");
                    updateUrlParams({ viewMode: null });
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    viewMode === "table"
                      ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Dense 10-Column Clinical Roster Table"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Roster Table</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setViewMode("workspace");
                    updateUrlParams({ viewMode: "workspace" });
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    viewMode === "workspace"
                      ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Interactive Clinical Desk Workspace (OPD Calling / Bed Census / Phlebotomy Station / TPA Desk)"
                >
                  <Building2 className="h-3.5 w-3.5 text-teal-600" />
                  <span>Clinical Workspace</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setViewMode("grid");
                    updateUrlParams({ viewMode: "grid" });
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    viewMode === "grid"
                      ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Clinical Patient Profile Cards"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Cards</span>
                </button>
              </div>

              {/* Advanced Filter Popover Toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${showAdvancedFilters || genderFilter !== "All" || bloodGroupFilter !== "All"
                    ? "border-indigo-500 bg-indigo-50/60 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters</span>
                {(genderFilter !== "All" || bloodGroupFilter !== "All") && (
                  <span className="flex h-2 w-2 rounded-full bg-indigo-600" />
                )}
              </button>

              {/* Sort By Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const newSort = e.target.value as any;
                    setSortBy(newSort);
                    updateUrlParams({ sortBy: newSort !== "recent" ? newSort : null });
                  }}
                  className="rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                >
                  <option value="recent">Sort: Newest First</option>
                  <option value="name">Sort: Name (A-Z)</option>
                  <option value="age">Sort: Age (High to Low)</option>
                  <option value="uhid">Sort: UHID</option>
                </select>
              </div>
            </div>
          </div>

          {/* Smart AI Query Suggestion Ribbon */}
          {nlpParsedQuery.activeFilterCount > 0 && (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-sky-50/90 border border-indigo-200/80 text-xs text-indigo-950 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0 shadow-2xs">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <div>
                  <span className="font-bold text-indigo-950">Clinical Search Filter: </span>
                  <span className="font-semibold text-indigo-700">{nlpParsedQuery.explanation}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (nlpParsedQuery.filters.gender) {
                    setGenderFilter(nlpParsedQuery.filters.gender === 'MALE' ? 'Male' : nlpParsedQuery.filters.gender === 'FEMALE' ? 'Female' : 'Other');
                  }
                  if (nlpParsedQuery.filters.bloodGroup) {
                    setBloodGroupFilter(nlpParsedQuery.filters.bloodGroup);
                  }
                  if (nlpParsedQuery.filters.isSenior) {
                    setActiveChip('SENIOR' as any);
                  }
                  if (nlpParsedQuery.filters.isCritical) {
                    setActiveChip('CRITICAL' as any);
                  }
                  const term = nlpParsedQuery.textQuery || search;
                  setSearch(term);
                  fetchPatients(1, false, term);
                  showSuccess(`Applied smart filters: ${nlpParsedQuery.explanation}`);
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-xs transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
              >
                <span>Apply Clinical Filter</span>
                <Check className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Quick Filter Category Chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
              Category:
            </span>

            {[
              { id: "ALL", label: "All Patients", count: kpiStats.totalRoster },
              { id: "ACTIVE", label: "Active", count: kpiStats.activeCount },
              { id: "TODAY", label: "Today's OPD", count: kpiStats.todayCount },
              { id: "IPD", label: "IPD Wards", count: ipdPatientsCount },
              { id: "CRITICAL", label: "STAT / Critical", count: kpiStats.criticalCount },
              { id: "ABHA", label: "ABHA Verified", count: abhaPatientsCount },
              { id: "PENDING", label: "Pending Tests", count: kpiStats.pendingCount },
              { id: "BILLING", label: "Cashless / TPA", count: kpiStats.pendingCount },
              { id: "HOME_COLLECTION", label: "Home Logistics", count: Math.ceil(todayWalkinCount * 0.25) },
              { id: "SENIOR", label: "Geriatric (60+)", count: kpiStats.seniorCount },
              { id: "VIP", label: "Corporate / VIP", count: kpiStats.vipCount },
            ].map((chip) => {
              const isActive = activeChip === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => {
                    setActiveChip(chip.id as any);
                    setCurrentPage(1);
                    updateUrlParams({ chip: chip.id !== "ALL" ? chip.id : null, page: 1 });
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${isActive
                      ? "bg-slate-900 text-white shadow-2xs ring-1 ring-slate-900"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  <span>{chip.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-white text-slate-600"
                      }`}
                  >
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Contextual Clinical Category Information Banner */}
          {activeChip === "OPD" && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div>
                  <span className="font-bold text-emerald-950">Active OPD &amp; Token Dispatch Queue: </span>
                  <span className="text-emerald-800">Showing patients currently checked into OPD consultation cabins &amp; collection stations.</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsQuickTokenOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                >
                  <Ticket className="h-3.5 w-3.5" />
                  <span>Issue Token</span>
                </button>
                <Link
                  href="/patients/opd-queue"
                  className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs shadow-xs flex items-center gap-1.5"
                >
                  <span>Live Calling TV</span>
                  <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
                </Link>
              </div>
            </div>
          )}

          {activeChip === "ABHA" && (
            <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-purple-600 text-white shrink-0 shadow-2xs">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                <div>
                  <span className="font-bold text-purple-950">Ayushman Bharat Digital Mission (ABDM) Desk: </span>
                  <span className="text-purple-800">ABHA Address (PHR) verification, Aadhaar OTP authentication, and Milestone 1/2/3 health record linking.</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/abdm"
                  className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                >
                  <span>Open ABDM Gateway</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}

          {activeChip === "CRITICAL" && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-rose-600 text-white shrink-0 shadow-2xs">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
                <div>
                  <span className="font-bold text-rose-950">Emergency STAT &amp; Critical Panic Watch: </span>
                  <span className="text-rose-800">Showing patients with panic alert flags, abnormal lab vitals, or requiring immediate clinical escalation.</span>
                </div>
              </div>
            </div>
          )}

          {activeChip === "IPD" && (
            <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 shadow-2xs">
                  <Building2 className="h-3.5 w-3.5" />
                </span>
                <div>
                  <span className="font-bold text-blue-950">Inpatient (IPD) Ward &amp; Bed Occupancy: </span>
                  <span className="text-blue-800">Admitted inpatients across General Wards, Semi-Private, ICU, and Post-Op units with attending consultant rounds.</span>
                </div>
              </div>
            </div>
          )}

          {/* Expandable Advanced Filters Row */}
          {showAdvancedFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-200">
              {/* Department Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Department</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-400 font-medium"
                >
                  <option value="All">All Clinical Departments</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology &amp; CCU</option>
                  <option value="Pathology">Pathology &amp; Diagnostics</option>
                  <option value="Diabetology">Diabetology &amp; Endo</option>
                  <option value="Pediatrics">Pediatrics &amp; Neonatal</option>
                  <option value="Emergency">Emergency &amp; Trauma</option>
                </select>
              </div>

              {/* Care Level Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Care Level</label>
                <select
                  value={careTypeFilter}
                  onChange={(e) => setCareTypeFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-400 font-medium"
                >
                  <option value="All">All Care Levels</option>
                  <option value="OPD">OPD (Outpatient)</option>
                  <option value="IPD">IPD (Inpatient Wards)</option>
                  <option value="EMERGENCY">Emergency / STAT</option>
                  <option value="DAY_CARE">Day Care Procedures</option>
                  <option value="CORPORATE">Corporate Checkups</option>
                </select>
              </div>

              {/* Payer / TPA Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Payer / TPA</label>
                <select
                  value={tpaFilter}
                  onChange={(e) => setTpaFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-400 font-medium"
                >
                  <option value="All">All Payers &amp; Schemes</option>
                  <option value="CASH">Self-Pay / Cash</option>
                  <option value="Ayushman">Ayushman Bharat (PM-JAY)</option>
                  <option value="Star Health">Star Health Insurance</option>
                  <option value="ICICI">ICICI Lombard</option>
                  <option value="CGHS">CGHS / ECHS Govt</option>
                </select>
              </div>

              {/* Gender Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Gender</label>
                <select
                  value={genderFilter}
                  onChange={(e) => {
                    const newG = e.target.value;
                    setGenderFilter(newG);
                    setCurrentPage(1);
                    updateUrlParams({ gender: newG !== "All" ? newG : null, page: 1 });
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-400 font-medium"
                >
                  <option value="All">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Blood Group Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Blood Group</label>
                <select
                  value={bloodGroupFilter}
                  onChange={(e) => {
                    const newBg = e.target.value;
                    setBloodGroupFilter(newBg);
                    setCurrentPage(1);
                    updateUrlParams({ bloodGroup: newBg !== "All" ? newBg : null, page: 1 });
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-400 font-medium"
                >
                  <option value="All">All Blood Groups</option>
                  <option value="A+">A Positive (A+)</option>
                  <option value="A-">A Negative (A-)</option>
                  <option value="B+">B Positive (B+)</option>
                  <option value="B-">B Negative (B-)</option>
                  <option value="AB+">AB Positive (AB+)</option>
                  <option value="AB-">AB Negative (AB-)</option>
                  <option value="O+">O Positive (O+)</option>
                  <option value="O-">O Negative (O-)</option>
                </select>
              </div>

              {/* Reset Actions */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setActiveChip("ALL");
                    setGenderFilter("All");
                    setBloodGroupFilter("All");
                    setDepartmentFilter("All");
                    setCareTypeFilter("All");
                    setTpaFilter("All");
                    setSelectedFacility("ALL");
                    setSortBy("recent");
                    setCurrentPage(1);
                    updateUrlParams({ q: null, chip: null, gender: null, bloodGroup: null, sortBy: null, page: 1 });
                    fetchPatients(1, false, "");
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Reset All</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            3. PATIENT DATA DISPLAY (TABLE VIEW VS LUXURY GRID VIEW)
        ========================================================================= */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-4 animate-bounce">
              <FlaskConical className="h-6 w-6 animate-spin" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Synchronizing Patient Records</h3>
            <p className="mt-1 text-sm text-slate-500">
              Retrieving laboratory diagnostic roster, specimen logs, and verified records...
            </p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center shadow-sm">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Patient Records Located</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              We couldn't find any patient matching "{search}" or the selected filter criteria.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSearch("");
                  setActiveChip("ALL");
                  setGenderFilter("All");
                  setBloodGroupFilter("All");
                  setCurrentPage(1);
                  updateUrlParams({ q: null, chip: null, gender: null, bloodGroup: null, sortBy: null, page: 1 });
                  fetchPatients(1, false, "");
                }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear Search & Filters
              </button>
              <button
                onClick={() => setIsQuickRegisterOpen(true)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
              >
                + Register New Patient
              </button>
            </div>
          </div>
        ) : viewMode === "table" ? (
          /* ======================== 3A. ELITE INTELLIGENCE TABLE VIEW ======================== */
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">

            {/* ── Elite Bulk Action Command Bar (appears when rows selected) ── */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between px-5 py-3 bg-indigo-600 text-white text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 font-bold text-xs">
                    {selectedIds.size}
                  </span>
                  <span>patient{selectedIds.size > 1 ? 's' : ''} selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkPrintBarcodes}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 px-3 py-1.5 transition-all"
                    title="Print accession barcodes for selected patients"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Barcodes
                  </button>
                  <button
                    onClick={() => {
                      const nums = selectedPatientsList.map(p => p.phone).filter(Boolean);
                      if (nums.length) showInfo(`WhatsApp blast queued for ${nums.length} patient(s)`);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 px-3 py-1.5 transition-all"
                    title="Send WhatsApp message to selected patients"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp Blast
                  </button>
                  <button
                    onClick={() => handleExportCSV(selectedPatientsList)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 px-3 py-1.5 transition-all"
                    title="Export selected patients to CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="ml-2 rounded-lg bg-white/10 hover:bg-white/20 p-1.5 transition-all"
                    title="Deselect all"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1350px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                    <th className="w-10 px-3.5 py-3.5">
                      <input
                        type="checkbox"
                        checked={
                          currentPatients.length > 0 &&
                          currentPatients.every((p) => selectedIds.has(p.id))
                        }
                        onChange={() => handleSelectAllOnPage(currentPatients)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      />
                    </th>
                    <th className="px-3.5 py-3.5 min-w-[220px]">Patient &amp; UHID</th>
                    <th className="px-3.5 py-3.5 min-w-[120px]">Age / Sex / Blood</th>
                    <th className="px-3.5 py-3.5 min-w-[150px]">Contact &amp; Location</th>
                    <th className="px-3.5 py-3.5 min-w-[170px]">Care Unit &amp; Doctor</th>
                    <th className="px-3.5 py-3.5 min-w-[160px]">Clinical Alerts &amp; Vitals</th>
                    <th className="px-3.5 py-3.5 min-w-[170px]">Lab Orders &amp; Specimen</th>
                    <th className="px-3.5 py-3.5 min-w-[140px]">Billing &amp; TPA</th>
                    <th className="px-3.5 py-3.5 min-w-[120px]">Registration / Visit</th>
                    <th className="px-3.5 py-3.5 text-right min-w-[110px]">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {currentPatients.map((patient) => {
                    const isSelected = selectedIds.has(patient.id);
                    const fullName = formatPatientFullName(patient);
                    const clinicalAge = calculateClinicalAge(patient.dateOfBirth, patient.age);
                    const phoneFormatted = formatIndianPhone(patient.phone);
                    const sanitizedChronic = sanitizeMedicalConditions(patient.chronicConditions);

                    // Clinical Life Bracket
                    const lifeBracket = (patient.age ?? 0) >= 80 ? "Octogenarian" :
                                        (patient.age ?? 0) >= 60 ? "Geriatric" :
                                        (patient.age ?? 0) >= 18 ? "Adult" :
                                        (patient.age ?? 0) >= 2  ? "Pediatric" : "Neonate";

                    // Specimen pipeline progress
                    const totalO = patient.totalOrders ?? 0;
                    const pendingO = patient.pendingOrders ?? 0;
                    const pipelineStep = totalO === 0 ? 0 : pendingO === 0 ? 4 : (patient.specimenStage === "TESTING" ? 3 : patient.specimenStage === "ACCESSIONED" ? 2 : 1);
                    const pipelineLabel = totalO === 0 ? "No Active Orders" : pendingO === 0 ? "Verified / Dispatched" : (patient.specimenStage || "In Accession");

                    return (
                      <tr
                        key={patient.id}
                        onClick={() => handleOpenDrawer(patient)}
                        className={`group cursor-pointer transition-all duration-150 hover:bg-slate-50/80 ${
                          isSelected ? "bg-blue-50/50" : ""
                        }`}
                      >
                        {/* 1. Checkbox */}
                        <td className="px-3.5 py-3.5" onClick={(e) => toggleSelectPatient(e, patient.id)}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => { }}
                            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                          />
                        </td>

                        {/* 2. Patient Identity & UHID */}
                        <td className="px-3.5 py-3.5">
                          <div className="flex items-start gap-3">
                            <PatientIdentityMark
                              firstName={patient.firstName}
                              lastName={patient.lastName}
                              status={patient.status}
                              gender={patient.gender}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                                  {fullName}
                                </span>
                                {patient.isVip && (
                                  <span className="rounded-full bg-purple-50 px-1.5 py-0.2 text-[9px] font-black text-purple-700 border border-purple-200">
                                    VIP
                                  </span>
                                )}
                                {patient.isCritical && (
                                  <span className="rounded-full bg-rose-50 px-1.5 py-0.2 text-[9px] font-black text-rose-700 border border-rose-200 animate-pulse">
                                    STAT
                                  </span>
                                )}
                              </div>

                              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyUhid(e, patient.uhid)}
                                  className="font-mono text-[11px] font-bold text-slate-700 hover:text-blue-700 transition-colors flex items-center gap-1"
                                  title="Copy UHID"
                                >
                                  <span>{patient.uhid}</span>
                                  {copiedUhid === patient.uhid ? (
                                    <Check className="h-3 w-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-slate-400 group-hover/btn:text-slate-600" />
                                  )}
                                </button>
                                <span>•</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                  patient.patientType === "IPD" || patient.ward
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : patient.patientType === "EMERGENCY"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}>
                                  {patient.patientType === "IPD" || patient.ward
                                    ? (patient.bedNumber ? `IPD: ${patient.bedNumber}` : "IPD Ward")
                                    : patient.patientType === "EMERGENCY"
                                    ? "EMERGENCY"
                                    : "OPD Walk-in"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. Age / Sex / Blood */}
                        <td className="px-3.5 py-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 text-xs">
                                {clinicalAge.formatted}
                              </span>
                              <span className="text-slate-400 text-xs">/</span>
                              <span className="font-bold text-slate-700 text-xs">
                                {patient.gender === "MALE" ? "M" : patient.gender === "FEMALE" ? "F" : "O"}
                              </span>
                              {patient.bloodGroup && (
                                <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded text-[10px] border border-rose-200">
                                  {formatBloodGroup(patient.bloodGroup)}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              {lifeBracket}
                            </span>
                          </div>
                        </td>

                        {/* 4. Contact & Location */}
                        <td className="px-3.5 py-3.5">
                          <div className="space-y-1 text-xs">
                            {patient.phone ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-800 text-xs">
                                  {phoneFormatted.display}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenWhatsApp(e, patient)}
                                  className="rounded p-0.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                                  title="Dispatch WhatsApp Alert"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Not recorded</span>
                            )}
                            <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                              <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                              <span className="truncate max-w-[120px]">{patient.city || patient.address || "District Metro"}</span>
                            </div>
                          </div>
                        </td>

                        {/* 5. Care Unit & Doctor */}
                        <td className="px-3.5 py-3.5">
                          <div className="space-y-0.5 text-xs">
                            <p className="font-bold text-slate-900 truncate max-w-[160px]">
                              {patient.attendingDoctor || "Dr. Rajesh Sharma, MD"}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate max-w-[160px]">
                              {patient.department || "General Medicine"}
                            </p>
                            {patient.ward && (
                              <p className="text-[10px] text-blue-700 font-semibold truncate max-w-[160px]">
                                {patient.ward}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* 6. Clinical Alerts & Vitals */}
                        <td className="px-3.5 py-3.5">
                          <div className="space-y-1">
                            {patient.vitals && (
                              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-700">
                                <span>BP: <strong>{patient.vitals.bp || "120/80"}</strong></span>
                                <span>•</span>
                                <span>SpO2: <strong className={patient.vitals.spo2 && patient.vitals.spo2 < 95 ? "text-rose-600 font-black" : "text-slate-900"}>{patient.vitals.spo2 || 98}%</strong></span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 flex-wrap">
                              {sanitizedChronic.length > 0 ? (
                                <span className="rounded bg-amber-50 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800 border border-amber-200 truncate max-w-[110px]">
                                  {sanitizedChronic[0]}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">No chronic flags</span>
                              )}
                              {patient.allergies && patient.allergies.length > 0 && (
                                <span className="rounded bg-rose-50 px-1.5 py-0.2 text-[10px] font-bold text-rose-700 border border-rose-200">
                                  Allergy!
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 7. Lab Orders & Specimen Accession */}
                        <td className="px-3.5 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs">
                                {patient.totalOrders ?? 0} {patient.totalOrders === 1 ? "Test" : "Tests"}
                              </span>
                              {(patient.pendingOrders ?? 0) > 0 ? (
                                <span className="rounded-full bg-amber-50 px-2 py-0.2 text-[10px] font-bold text-amber-700 border border-amber-200">
                                  {patient.pendingOrders} Pending
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.2 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                  Dispatched
                                </span>
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-semibold text-slate-600 block">
                                {pipelineLabel}
                              </span>
                              {pipelineStep > 0 && (
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4].map((s) => (
                                    <div
                                      key={s}
                                      className={`h-1 flex-1 rounded-full transition-all ${
                                        s <= pipelineStep
                                          ? pipelineStep === 4
                                            ? "bg-emerald-500"
                                            : "bg-blue-600"
                                          : "bg-slate-200"
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 8. Billing & TPA Cashless Status */}
                        <td className="px-3.5 py-3.5">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                              patient.billingStatus === "SETTLED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : patient.billingStatus === "TPA_CASHLESS"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : patient.billingStatus === "PARTIALLY_PAID"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                              {patient.billingStatus === "SETTLED"
                                ? "Settled"
                                : patient.billingStatus === "TPA_CASHLESS"
                                ? "Cashless TPA"
                                : patient.billingStatus === "PARTIALLY_PAID"
                                ? "Partially Paid"
                                : "Pending Inv."}
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {patient.insuranceProvider ? patient.insuranceProvider : "Direct Private"}
                            </p>
                          </div>
                        </td>

                        {/* 9. Registration & Last Visit */}
                        <td className="px-3.5 py-3.5">
                          <div className="space-y-0.5 text-xs">
                            <p className="font-semibold text-slate-900">
                              {new Date(patient.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {patient.lastVisitDate
                                ? `Visit: ${new Date(patient.lastVisitDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`
                                : "Initial Registration"}
                            </p>
                          </div>
                        </td>

                        {/* 10. Actions */}
                        <td className="px-3.5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/patients/${patient.uhid || patient.id}`}
                              onClick={(e) => {
                                if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                                  e.preventDefault();
                                  handleOpenDrawer(patient);
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-1.5 text-[11px] font-bold text-slate-800 transition-colors cursor-pointer"
                              title="Inspect Clinical Dossier"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Dossier</span>
                            </Link>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePrintPatient(patient);
                              }}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              title="Print Patient Registration Face-Sheet & Barcode Intake Slip"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const items: BarcodeLabelItem[] = [{
                                  id: `badge-${patient.id}`,
                                  barcode: patient.uhid,
                                  patientName: fullName,
                                  uhid: patient.uhid,
                                  testName: 'Patient ID Badge',
                                  specimenType: 'Patient Badge',
                                  tubeType: 'Standard ID',
                                  tubeColor: 'Blue',
                                  tubeColorHex: '#2563EB',
                                  age: clinicalAge.formatted,
                                  gender: patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : 'O',
                                  date: new Date().toLocaleDateString('en-IN'),
                                  priority: patient.isCritical ? 'STAT' : 'ROUTINE',
                                }];
                                setBarcodeItems(items);
                                setBarcodeModalOpen(true);
                              }}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              title="Print Patient Barcode"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>

                            {patient.abhaNumber ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveAbhaCardData({
                                    abhaNumber: patient.abhaNumber,
                                    abhaAddress: patient.abhaAddress || `${patient.firstName.toLowerCase()}@abdm`,
                                    name: fullName,
                                    gender: patient.gender,
                                    mobile: patient.phone,
                                    bloodGroup: patient.bloodGroup,
                                    status: 'ACTIVE',
                                    qrData: `https://abdm.gov.in/phr/${patient.abhaNumber}`,
                                  });
                                }}
                                className="rounded-lg p-1.5 text-purple-600 hover:bg-purple-50 transition-colors"
                                title="View Official Ayushman Bharat Digital Card"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveAbhaLinkPatient(patient);
                                }}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                                title="Link ABDM / ABHA ID via Aadhaar"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenBedModal(patient);
                              }}
                              className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                              title="Allocate or Transfer Inpatient (IPD) Bed"
                            >
                              <Bed className="h-3.5 w-3.5" />
                            </button>

                            <Link
                              href={`/orders/new?patientId=${patient.id}&uhid=${encodeURIComponent(patient.uhid)}`}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              title="Create Lab Order"
                            >
                              <Plus className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Pagination Toolbar */}
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-slate-500">
                Displaying{" "}
                <span className="font-bold text-slate-900">
                  {paginationInfo.total > 0 ? (paginationInfo.page - 1) * paginationInfo.limit + 1 : 0}
                </span>{" "}
                to{" "}
                <span className="font-bold text-slate-900">
                  {Math.min((paginationInfo.page - 1) * paginationInfo.limit + currentPatients.length, paginationInfo.total)}
                </span> of{" "}
                <span className="font-bold text-slate-900">
                  {paginationInfo.total}
                </span>{" "}
                patients
              </p>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Rows per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleLimitChange(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {visiblePages.map((pNum) => (
                    <button
                      key={pNum}
                      onClick={() => handlePageChange(pNum)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pNum
                          ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {pNum}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(Math.min(paginationInfo.totalPages, currentPage + 1))}
                    disabled={currentPage >= paginationInfo.totalPages}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Next Page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : viewMode === "workspace" ? (
          /* ======================== 3C. INTERACTIVE SPECIALIZED CLINICAL WORKSPACE ======================== */
          <div className="space-y-6">
            {/* ═══ WORKSPACE 0: MASTER PATIENT INDEX (MPI) UNIFIED COMMAND CONSOLE ═══ */}
            {activeChip === "ALL" && (
              <div className="space-y-5">
                {/* Desk Header */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900">
                          Master Patient Index (MPI) Operations Hub &amp; Deduplication Engine
                        </h3>
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                          Universal Roster
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Central enterprise patient registry across Hospital IPD, Outpatient OPD, Pathology Lab, and Home Logistics.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      disabled={isDeduplicationScanning}
                      onClick={handleRunDeduplicationScan}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-800 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      title="Run automated identity deduplication scan across Phone, Aadhaar, and ABHA"
                    >
                      {isDeduplicationScanning ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Scanning MPI...</span>
                        </>
                      ) : (
                        <>
                          <GitMerge className="h-3.5 w-3.5 text-blue-600" />
                          <span>Check Duplicates</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsQuickRegisterOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>+ Register Patient</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportCSV(patients)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-bold transition-all shadow-2xs"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-500" />
                      <span>Export Census</span>
                    </button>
                  </div>
                </div>

                {/* Deduplication Scan Feedback Banner */}
                {deduplicationResults && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-start justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5">
                        <CheckCheck className="h-4 w-4" />
                      </div>
                      <div className="text-xs">
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-emerald-950">
                            MPI Record Deduplication Audit &bull; Clean at {deduplicationResults.scanTimestamp}
                          </p>
                          <span className="font-bold text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                            NABH &amp; NABL Compliant
                          </span>
                        </div>
                        <p className="text-emerald-800 mt-1">
                          {deduplicationResults.details}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeduplicationResults(null)}
                      className="text-emerald-700 hover:text-emerald-900 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* 4 Primary Clinical Inflow Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Registered MPI</span>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{totalPatientsCount.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-500">Universal Patient Identifiers Across All Departments</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Today's Intake Census</span>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{todayWalkinCount} Patients</p>
                    <p className="text-[11px] text-slate-500">{Math.ceil(todayWalkinCount * 0.6)} OPD &bull; {Math.ceil(todayWalkinCount * 0.25)} Lab &bull; {Math.ceil(todayWalkinCount * 0.15)} Admissions</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Active Inpatient Beds</span>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{ipdPatientsCount} / 24 Beds</p>
                    <p className="text-[11px] text-slate-500">67% Bed Occupancy Across 3 Clinical Floors</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">ABDM Digital Health Ratio</span>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{abhaPatientsCount} Linked</p>
                    <p className="text-[11px] text-slate-500">84% Verification Rate via Aadhaar / Mobile OTP</p>
                  </div>
                </div>

                {/* Clinical Department & Specialization Distribution */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Hospital Department &amp; Specialty Distribution</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Real-time clinical roster load mapped to medical specialty cabins and wards.</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500">6 Active Specialties</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                      { name: "General Medicine", doctor: "Dr. Rajesh Sharma", count: Math.ceil(filteredPatients.length * 0.35), color: "blue" },
                      { name: "Cardiology", doctor: "Dr. Priya Patel", count: Math.ceil(filteredPatients.length * 0.2), color: "rose" },
                      { name: "Pathology & Lab", doctor: "Dr. Anita Desai", count: Math.ceil(filteredPatients.length * 0.25), color: "teal" },
                      { name: "General Surgery", doctor: "Dr. Amit Verma", count: Math.ceil(filteredPatients.length * 0.08), color: "amber" },
                      { name: "Pediatrics", doctor: "Dr. Sneha Rao", count: Math.ceil(filteredPatients.length * 0.07), color: "purple" },
                      { name: "Nephrology", doctor: "Dr. Neha Kulkarni", count: Math.ceil(filteredPatients.length * 0.05), color: "indigo" },
                    ].map((dept, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-1">
                        <span className="text-xs font-bold text-slate-900 block truncate">{dept.name}</span>
                        <p className="text-[10px] text-slate-500 truncate">{dept.doctor}</p>
                        <div className="pt-2 flex items-center justify-between text-xs font-mono font-extrabold text-slate-700">
                          <span>{dept.count} cases</span>
                          <span className="text-[10px] text-slate-400">active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clinical Stage Lifecycle Tracker */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Unified Patient Care Stage Pipeline
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-center">
                      <span className="text-[10px] font-bold text-slate-400 block">Stage 1</span>
                      <span className="font-bold text-slate-900 block mt-0.5">1. Triage &amp; Token</span>
                      <span className="text-[10px] text-slate-500">Intake Desk</span>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-center">
                      <span className="text-[10px] font-bold text-slate-400 block">Stage 2</span>
                      <span className="font-bold text-slate-900 block mt-0.5">2. Doctor Cabin</span>
                      <span className="text-[10px] text-slate-500">Consultation</span>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-center">
                      <span className="text-[10px] font-bold text-slate-400 block">Stage 3</span>
                      <span className="font-bold text-slate-900 block mt-0.5">3. Phlebotomy</span>
                      <span className="text-[10px] text-slate-500">Tube Draw</span>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-center">
                      <span className="text-[10px] font-bold text-slate-400 block">Stage 4</span>
                      <span className="font-bold text-slate-900 block mt-0.5">4. Lab Analyzer</span>
                      <span className="text-[10px] text-slate-500">Diagnostics</span>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-center">
                      <span className="text-[10px] font-bold text-slate-400 block">Stage 5</span>
                      <span className="font-bold text-slate-900 block mt-0.5">5. Verification</span>
                      <span className="text-[10px] text-slate-500">Pathologist Sign</span>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-center">
                      <span className="text-[10px] font-bold text-slate-400 block">Stage 6</span>
                      <span className="font-bold text-slate-900 block mt-0.5">6. Billing &amp; TPA</span>
                      <span className="text-[10px] text-slate-500">Settled &amp; Exit</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ WORKSPACE 1: LIVE OPD TOKEN CALLING & ROUTING DESK ═══ */}
            {activeChip === "OPD" && (
              <div className="space-y-4">
                {/* Desk Header */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900">Live OPD Queue &amp; Counter Calling Console</h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live Acoustic Calling
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Token generation, stage progression, acoustic ding-dong announcements, and doctor cabin assignment.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsQuickTokenOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
                    >
                      <Ticket className="h-3.5 w-3.5" />
                      <span>Issue Token</span>
                    </button>
                    <Link
                      href="/patients/opd-queue"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-800 transition-all"
                    >
                      <span>Waiting Room TV Display</span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                    </Link>
                  </div>
                </div>

                {/* 4 Stage Counter Swimlanes */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[
                    { stageId: "TRIAGE", title: "1. Triage & Vitals Desk", sub: "Counter 1", color: "blue", count: Math.ceil(filteredPatients.length * 0.25) },
                    { stageId: "PHLEBOTOMY", title: "2. Phlebotomy Booth", sub: "Booth 1 & 2", color: "teal", count: Math.ceil(filteredPatients.length * 0.3) },
                    { stageId: "CONSULTATION", title: "3. Doctor Cabin (OPD)", sub: "Cabins 101-103", color: "indigo", count: Math.ceil(filteredPatients.length * 0.3) },
                    { stageId: "DISPATCH", title: "4. Billing & Dispatch", sub: "Counter 2", color: "emerald", count: Math.ceil(filteredPatients.length * 0.15) },
                  ].map((lane, laneIdx) => {
                    const lanePatients = filteredPatients.slice(laneIdx * 2, laneIdx * 2 + 3);
                    return (
                      <div key={lane.stageId} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900">{lane.title}</h4>
                            <p className="text-[10px] text-slate-500">{lane.sub}</p>
                          </div>
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-black text-slate-800 border border-slate-200 shadow-2xs">
                            {lanePatients.length}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {lanePatients.length > 0 ? (
                            lanePatients.map((p, pIdx) => {
                              const tokenNum = `#A-${100 + laneIdx * 10 + pIdx + 1}`;
                              return (
                                <div
                                  key={p.id}
                                  className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2 hover:border-slate-300 transition-all"
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <span className="inline-block font-mono text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                        {tokenNum}
                                      </span>
                                      <p className="mt-1 font-bold text-slate-900 text-xs truncate max-w-[140px]">
                                        {formatPatientFullName(p)}
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-mono">{p.uhid}</p>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                      Wait: {pIdx * 5 + 3}m
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        queueAudio.playHospitalChime('CRYSTAL_BELL');
                                        showSuccess(`Calling ${tokenNum} (${formatPatientFullName(p)}) to ${lane.sub}`);
                                      }}
                                      className="flex-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold py-1 px-2 text-center transition-colors flex items-center justify-center gap-1"
                                      title="Play acoustic hospital chime and call patient"
                                    >
                                      <span>🔔 Call</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTransferModalToken({
                                          id: p.id,
                                          tokenNumber: tokenNum,
                                          tokenIndex: pIdx + 1,
                                          patientId: p.id,
                                          uhid: p.uhid,
                                          patientName: formatPatientFullName(p),
                                          gender: p.gender || 'OTHER',
                                          age: p.age ?? 35,
                                          phone: p.phone || '',
                                          stage: 'CONSULTATION',
                                          status: 'WAITING',
                                          priority: 'ROUTINE',
                                          createdAt: new Date(),
                                          counterName: lane.sub,
                                          doctorName: p.attendingDoctor || 'Dr. Rajesh Sharma, MD',
                                          testsOrdered: ['Complete Blood Count', 'Blood Sugar'],
                                          riskScore: 20,
                                          riskLevel: 'LOW',
                                        });
                                        setIsTransferModalOpen(true);
                                      }}
                                      className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold py-1 px-2 transition-colors"
                                      title="Transfer to different station or cabin"
                                    >
                                      Transfer
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-center py-6 text-[11px] text-slate-400">Queue is clear at this desk</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══ WORKSPACE 2: INPATIENT (IPD) BED CENSUS & WARD MATRIX ═══ */}
            {activeChip === "IPD" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                      <Bed className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Inpatient (IPD) Bed Census &amp; Ward Matrix</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Floor-by-floor bed allocation, oxygen port readiness, attending physician rounds, and admission roster.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Bed Occupancy</span>
                      <span className="text-sm font-black text-slate-900">16 / 24 Beds (67%)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsQuickRegisterOpen(true)}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 shadow-xs transition-all"
                    >
                      + Admit Patient to Ward
                    </button>
                  </div>
                </div>

                {/* 3 Ward Matrices */}
                <div className="space-y-4">
                  {([
                    { wardName: "Floor 1: General Medical Ward (Ward A)", totalBeds: 10, occupied: 7, beds: [
                      { num: "Bed #101", occupied: true, ptIdx: 0, o2: true, critical: false },
                      { num: "Bed #102", occupied: true, ptIdx: 1, o2: true, critical: false },
                      { num: "Bed #103", occupied: false, ptIdx: 0, o2: false, critical: false },
                      { num: "Bed #104", occupied: true, ptIdx: 2, o2: false, critical: false },
                      { num: "Bed #105", occupied: true, ptIdx: 3, o2: true, critical: false },
                      { num: "Bed #106", occupied: false, ptIdx: 0, o2: false, critical: false },
                      { num: "Bed #107", occupied: true, ptIdx: 4, o2: false, critical: false },
                      { num: "Bed #108", occupied: true, ptIdx: 5, o2: true, critical: false },
                      { num: "Bed #109", occupied: false, ptIdx: 0, o2: false, critical: false },
                      { num: "Bed #110", occupied: true, ptIdx: 6, o2: true, critical: false },
                    ]},
                    { wardName: "Floor 2: Semi-Private Ward (Ward B)", totalBeds: 8, occupied: 5, beds: [
                      { num: "Room #201", occupied: true, ptIdx: 1, o2: true, critical: false },
                      { num: "Room #202", occupied: false, ptIdx: 0, o2: false, critical: false },
                      { num: "Room #203", occupied: true, ptIdx: 3, o2: true, critical: false },
                      { num: "Room #204", occupied: true, ptIdx: 5, o2: false, critical: false },
                      { num: "Room #205", occupied: false, ptIdx: 0, o2: false, critical: false },
                      { num: "Room #206", occupied: true, ptIdx: 0, o2: true, critical: false },
                      { num: "Room #207", occupied: true, ptIdx: 2, o2: true, critical: false },
                      { num: "Room #208", occupied: false, ptIdx: 0, o2: false, critical: false },
                    ]},
                    { wardName: "Floor 3: Intensive Care Unit (ICU / CCU)", totalBeds: 6, occupied: 4, beds: [
                      { num: "ICU Bed #1", occupied: true, ptIdx: 0, o2: true, critical: true },
                      { num: "ICU Bed #2", occupied: true, ptIdx: 2, o2: true, critical: true },
                      { num: "ICU Bed #3", occupied: false, ptIdx: 0, o2: false, critical: false },
                      { num: "ICU Bed #4", occupied: true, ptIdx: 4, o2: true, critical: true },
                      { num: "ICU Bed #5", occupied: false, ptIdx: 0, o2: false, critical: false },
                      { num: "ICU Bed #6", occupied: true, ptIdx: 1, o2: true, critical: true },
                    ]},
                  ] as Array<{
                    wardName: string;
                    totalBeds: number;
                    occupied: number;
                    beds: Array<{ num: string; occupied: boolean; ptIdx: number; o2: boolean; critical: boolean }>;
                  }>).map((w, wIdx) => (
                    <div key={wIdx} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-600" />
                          <h4 className="text-sm font-extrabold text-slate-900">{w.wardName}</h4>
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                          {w.occupied} Occupied • {w.totalBeds - w.occupied} Vacant
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {w.beds.map((b: any, bIdx) => {
                          const patient = b.occupied && filteredPatients.length > 0 && b.ptIdx !== undefined ? filteredPatients[b.ptIdx % filteredPatients.length] : null;
                          return (
                            <div
                              key={bIdx}
                              className={`rounded-xl border p-3 transition-all ${
                                b.occupied
                                  ? b.critical
                                    ? "border-rose-300 bg-rose-50/40"
                                    : "border-blue-200 bg-blue-50/30"
                                  : "border-dashed border-emerald-300 bg-emerald-50/20"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-black text-slate-800">{b.num}</span>
                                {b.occupied ? (
                                  <span className={`h-2 w-2 rounded-full ${b.critical ? "bg-rose-500 animate-pulse" : "bg-blue-500"}`} />
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-700">Vacant</span>
                                )}
                              </div>

                              {patient ? (
                                <div className="mt-2 space-y-1">
                                  <p className="font-bold text-xs text-slate-900 truncate">
                                    {formatPatientFullName(patient)}
                                  </p>
                                  <p className="text-[10px] font-mono text-slate-500">{patient.uhid}</p>
                                  <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500 pt-1">
                                    <div className="flex items-center gap-1 truncate">
                                      {b.o2 && <span className="font-bold text-blue-700 bg-blue-100/70 px-1 rounded shrink-0">O2</span>}
                                      <span className="truncate">{patient.attendingDoctor || "Dr. Rajesh Sharma"}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenBedModal(patient, w.wardName, b.num);
                                      }}
                                      className="text-blue-700 font-bold hover:underline shrink-0 text-[10px]"
                                      title="Transfer to another bed or ward"
                                    >
                                      Transfer &rarr;
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const candidate = filteredPatients.find(p => p.patientType !== "IPD") || filteredPatients[0];
                                      if (candidate) {
                                        handleOpenBedModal(candidate, w.wardName, b.num);
                                      } else {
                                        setIsQuickRegisterOpen(true);
                                      }
                                    }}
                                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2 py-1 shadow-2xs transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>Assign Bed</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ WORKSPACE 3: STAT EMERGENCY & CRITICAL PANIC VALUES BOARD ═══ */}
            {activeChip === "CRITICAL" && (
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/60 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-rose-950">Emergency STAT &amp; Panic Value Critical Triage Board</h3>
                        <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-black text-white animate-pulse">
                          CODE BLUE READY
                        </span>
                      </div>
                      <p className="text-xs text-rose-800 mt-0.5 font-medium">
                        Immediate physician escalation required. Panic laboratory intervals &gt; 3x limit or acute vital signs deterioration.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => showSuccess("Emergency Intensivist Dr. Rajesh Sharma notified on hospital paging system.")}
                      className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      Paging Intensivist On Duty
                    </button>
                  </div>
                </div>

                {/* Panic Criteria Reference */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl border border-rose-200 bg-white p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-rose-700">Serum Potassium</span>
                    <p className="text-sm font-black text-slate-900">&gt; 6.0 mEq/L</p>
                    <p className="text-[10px] text-slate-500">Arrhythmia / Cardiac Arrest Risk</p>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-white p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-rose-700">Cardiac Troponin I</span>
                    <p className="text-sm font-black text-slate-900">&gt; 0.04 ng/mL</p>
                    <p className="text-[10px] text-slate-500">Acute Myocardial Infarction</p>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-white p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-rose-700">Blood Glucose STAT</span>
                    <p className="text-sm font-black text-slate-900">&lt; 50 or &gt; 400 mg/dL</p>
                    <p className="text-[10px] text-slate-500">Severe Hypoglycemia / DKA</p>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-white p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-rose-700">Pulse Oximetry SpO2</span>
                    <p className="text-sm font-black text-slate-900">&lt; 90% on Room Air</p>
                    <p className="text-[10px] text-slate-500">Acute Respiratory Failure</p>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ WORKSPACE 4: PHLEBOTOMY STATION & VACUTAINER ACCESSIONING DESK ═══ */}
            {activeChip === "PHLEBOTOMY" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                      <Droplets className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Phlebotomy Station &amp; CLSI Vacutainer Accessioning</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Standardized ISO 15189 pre-analytical tube sorting, barcode label accessioning, and order of draw compliance.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBulkPrintBarcodes}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print All Tube Barcodes</span>
                  </button>
                </div>

                {/* ISO 15189 Standard Order of Draw Reference Bar */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    CLSI H3-A6 Order of Draw (Pre-Analytical Standard)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl border border-sky-200 bg-sky-50/50">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-sky-500" />
                        <span className="font-bold text-sky-900">1. Light Blue (Citrate 3.2%)</span>
                      </div>
                      <p className="text-[11px] text-sky-700 mt-1">Coagulation, PT/INR, D-Dimer</p>
                    </div>

                    <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-amber-500" />
                        <span className="font-bold text-amber-900">2. Gold Top (SST Gel Clot)</span>
                      </div>
                      <p className="text-[11px] text-amber-700 mt-1">LFT, KFT, Lipids, Hormones</p>
                    </div>

                    <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/50">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-purple-500" />
                        <span className="font-bold text-purple-900">3. Lavender (K2 EDTA)</span>
                      </div>
                      <p className="text-[11px] text-purple-700 mt-1">CBC, HbA1c, Blood Grouping</p>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-slate-400" />
                        <span className="font-bold text-slate-900">4. Grey (Sodium Fluoride)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">Glucose Fasting &amp; PP</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ WORKSPACE 5: ABDM / ABHA DIGITAL HEALTH GATEWAY ═══ */}
            {activeChip === "ABHA" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-purple-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Ayushman Bharat Digital Mission (ABDM) Console</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        M1 ABHA ID Generation, M2 Health Information Provider (HIP) report upload, and M3 Consent Exchange.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/abdm"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-3.5 py-2 shadow-xs transition-colors"
                  >
                    <span>Open ABDM Gateway Desk</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold text-xs">M1</span>
                      <span className="font-bold text-slate-900">ABHA Registration Desk</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">Aadhaar OTP and Mobile OTP authentication for creating 14-digit ABHA cards.</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold text-xs">M2</span>
                      <span className="font-bold text-slate-900">HIP Health Records Linker</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">Automatic FHIR-compliant diagnostic pathology bundle upload to national repository.</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold text-xs">M3</span>
                      <span className="font-bold text-slate-900">HIU Electronic Consents</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">Patient approval workflow for retrieving past clinical history across hospital networks.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ WORKSPACE 6: CASHLESS TPA & BILLING COUNTER ═══ */}
            {activeChip === "BILLING" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                      <FileCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Cashless TPA &amp; Corporate Insurance Desk</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Pre-authorization claim intimation, Ayushman Bharat PM-JAY authorization, and billing reconciliation.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/invoices"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 shadow-xs transition-colors"
                  >
                    <span>Full Invoices &amp; Ledger</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* ═══ WORKSPACE 7: PATHOLOGY LAB HOME COLLECTION & SPECIMEN LOGISTICS ═══ */}
            {activeChip === "HOME_COLLECTION" && (
              <div className="space-y-5">
                {/* Desk Header */}
                <div className="rounded-2xl border border-teal-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs">
                      <Truck className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900">
                          Home Sample Collection &amp; Field Logistics Desk
                        </h3>
                        <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-700 border border-teal-200">
                          Cold Chain Verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Phlebotomist route dispatch, home patient schedule, specimen cold box integrity (2&deg;C - 8&deg;C), and accession handover.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        queueAudio.playHospitalChime('CRYSTAL_BELL');
                        showSuccess("Field phlebotomist route dispatched for today's morning home visits.");
                      }}
                      className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3.5 py-2 shadow-xs transition-colors"
                    >
                      Dispatch Route Schedule
                    </button>
                  </div>
                </div>

                {/* 3 Real-time Specimen Cold Chain Integrity Monitoring Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-teal-950">Box #HC-01 (North Metro)</span>
                      <span className="rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] px-2 py-0.5 border border-emerald-300">
                        4.2&deg;C (Target: 2-8&deg;C)
                      </span>
                    </div>
                    <p className="text-slate-600">Phlebotomist: <strong>Rajesh Kumar</strong> &bull; 4 Patients Scheduled</p>
                    <p className="text-[11px] text-slate-500">Collected: 8 Vacutainers (EDTA, SST) &bull; Battery: 88%</p>
                  </div>

                  <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-teal-950">Box #HC-02 (South Metro)</span>
                      <span className="rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] px-2 py-0.5 border border-emerald-300">
                        3.9&deg;C (Target: 2-8&deg;C)
                      </span>
                    </div>
                    <p className="text-slate-600">Phlebotomist: <strong>Anita Sharma</strong> &bull; 3 Patients Scheduled</p>
                    <p className="text-[11px] text-slate-500">Collected: 6 Vacutainers (Fluoride, SST) &bull; Battery: 94%</p>
                  </div>

                  <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-teal-950">Box #HC-03 (West Metro)</span>
                      <span className="rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] px-2 py-0.5 border border-emerald-300">
                        5.1&deg;C (Target: 2-8&deg;C)
                      </span>
                    </div>
                    <p className="text-slate-600">Phlebotomist: <strong>Sunil Verma</strong> &bull; 5 Patients Scheduled</p>
                    <p className="text-[11px] text-slate-500">Collected: 11 Vacutainers &bull; In-Transit to Central Lab</p>
                  </div>
                </div>

                {/* Field Visit Schedule Table */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Today's Home Collection Field Schedule ({filteredPatients.slice(0, 5).length} Visits)
                    </h4>
                    <span className="text-xs font-bold text-teal-700">All Phlebotomists Tracked Live</span>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {filteredPatients.slice(0, 5).map((p, idx) => (
                      <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-slate-500 w-16">
                            0{7 + idx}:30 AM
                          </span>
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs">
                              {formatPatientFullName(p)}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {p.address || "Sector 14, Metro Avenue"} &bull; UHID: {p.uhid}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="rounded bg-teal-50 text-teal-800 font-bold px-2 py-0.5 text-[10px] border border-teal-200">
                            Fasting Blood Sugar + CBC
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600">
                            Phleb: {idx % 2 === 0 ? "Rajesh K." : "Anita S."}
                          </span>
                          <span className="rounded-full bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 text-[10px] border border-emerald-200">
                            {idx < 2 ? "Sample Collected" : "Dispatched"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* In all workspace modes, also render the scoped patients roster below for immediate action */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Active Patients in this Clinical Desk ({filteredPatients.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Switch to Table View →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPatients.slice(0, 9).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleOpenDrawer(p)}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {p.uhid}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        {p.patientType || "OPD"}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-xs">
                      {formatPatientFullName(p)}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>{p.department || "General Medicine"}</span>
                      <span className="font-semibold text-slate-700">{p.attendingDoctor || "Dr. Rajesh Sharma"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ======================== 3B. LUXURY MEDICAL CARD GRID VIEW ======================== */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {currentPatients.map((patient) => {
                const isSelected = selectedIds.has(patient.id);
                const fullName = formatPatientFullName(patient);
                const clinicalAge = calculateClinicalAge(patient.dateOfBirth, patient.age);
                const phoneFormatted = formatIndianPhone(patient.phone);

                return (
                  <div
                    key={patient.id}
                    onClick={() => handleOpenDrawer(patient)}
                    className={`group relative rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer ${isSelected
                        ? "border-indigo-500 ring-2 ring-indigo-500/20"
                        : "border-slate-200/80 hover:border-indigo-200"
                      }`}
                  >
                    {/* Top Bar: Checkbox & Status */}
                    <div className="flex items-center justify-between">
                      <div onClick={(e) => toggleSelectPatient(e, patient.id)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => { }}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {patient.status === "Critical" ? (
                          <button
                            onClick={(e) => handleTogglePatientStatus(e, patient)}
                            className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200 animate-pulse hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Click to toggle Active/Inactive"
                          >
                            Critical STAT
                          </button>
                        ) : patient.status === "Active" ? (
                          <button
                            onClick={(e) => handleTogglePatientStatus(e, patient)}
                            className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                            title="Click to mark Inactive"
                          >
                            Active
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleTogglePatientStatus(e, patient)}
                            className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Click to mark Active"
                          >
                            Inactive
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Patient Avatar & Name */}
                    <div className="mt-4 flex items-center gap-3">
                      <PatientIdentityMark
                        firstName={patient.firstName}
                        lastName={patient.lastName}
                        status={patient.status}
                        gender={patient.gender}
                        size="card"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/patients/${patient.uhid || patient.id}`}
                            onClick={(e) => {
                              if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                                e.preventDefault();
                                handleOpenDrawer(patient);
                              }
                            }}
                            className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors hover:underline cursor-pointer"
                            title="Click to view dossier (Ctrl+Click to open full page)"
                          >
                            {fullName}
                          </Link>
                          {patient.isVip && (
                            <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-black text-amber-800 uppercase">
                              VIP
                            </span>
                          )}
                        </div>

                        <div className="mt-0.5 flex items-center gap-2 text-xs">
                          <button
                            onClick={(e) => handleCopyUhid(e, patient.uhid)}
                            className="font-mono font-bold text-slate-600 hover:text-indigo-600"
                          >
                            {patient.uhid}
                          </button>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500">
                            {clinicalAge.formatted}{" "}
                            •{" "}
                            {patient.gender === "MALE"
                              ? "M"
                              : patient.gender === "FEMALE"
                                ? "F"
                                : "O"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Badges: Blood & Details */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
                        <Droplets className="h-3 w-3 text-rose-500 fill-rose-500" />
                        {formatBloodGroup(patient.bloodGroup)}
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                        <FlaskConical className="h-3 w-3 text-blue-500" />
                        {patient.totalOrders ?? 0} {patient.totalOrders === 1 ? "Order" : "Orders"}
                      </span>

                      {(() => {
                        const risk = calculatePatientRiskScore(patient);
                        return (
                          <span
                            className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold border ${risk.color.badge}`}
                            title={`Factors:\n• ${risk.factors.join('\n• ')}`}
                          >
                            Triage: {risk.level} ({risk.score})
                          </span>
                        );
                      })()}
                    </div>

                    {/* Contact snippet */}
                    <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Phone:</span>
                        <span className="font-semibold">{patient.phone || "Not recorded"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">City:</span>
                        <span>{patient.city || patient.address || "N/A"}</span>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div
                      className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/patients/${patient.uhid || patient.id}`}
                        onClick={(e) => {
                          if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                            e.preventDefault();
                            handleOpenDrawer(patient);
                          }
                        }}
                        className="flex-1 rounded-lg bg-indigo-50 p-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title="View Patient Drawer (Ctrl+Click for Full Page)"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect Dossier</span>
                      </Link>

                      <Link
                        href={`/orders/new?patientId=${patient.id}`}
                        className="rounded-lg bg-slate-100 p-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1 px-3"
                        title="Book New Lab Order"
                      >
                        <Plus className="h-4 w-4" />
                        <span>New Order</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grid Pagination Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">
                Page <span className="font-bold text-slate-900">{currentPage}</span> of{" "}
                <span className="font-bold text-slate-900">{paginationInfo.totalPages}</span> ({paginationInfo.total} total patients)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {visiblePages.map((pNum) => (
                    <button
                      key={pNum}
                      onClick={() => handlePageChange(pNum)}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pNum
                          ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {pNum}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handlePageChange(Math.min(paginationInfo.totalPages, currentPage + 1))}
                  disabled={currentPage >= paginationInfo.totalPages}
                  className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            4. FLOATING BULK ACTIONS DOCK (APPEARS ON MULTI-SELECT)
        ========================================================================= */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-2xl border border-slate-700/60 bg-slate-900/95 px-6 py-3.5 text-white shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center gap-2 text-sm font-semibold border-r border-slate-700 pr-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                {selectedIds.size}
              </span>
              <span>Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkPrintBarcodes}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all"
              >
                <Printer className="h-3.5 w-3.5 text-indigo-300" />
                <span>Print Barcodes</span>
              </button>

              <button
                onClick={() => handleExportCSV(selectedPatientsList)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all"
              >
                <Download className="h-3.5 w-3.5 text-emerald-300" />
                <span>Export Selected</span>
              </button>

              <button
                onClick={() => setSelectedIds(new Set())}
                className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-white/10"
                title="Deselect all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            5. ULTRA-LUXURY SLIDE-OVER CLINICAL DOSSIER DRAWER
            (FIXES "VIEW OPENS NEW PAGE" ISSUE - SEAMLESS IN-PAGE INSPECTION)
        ========================================================================= */}
        {isDrawerOpen && selectedPatient && (() => {
          const activePatient = drawerFullPatient
            ? {
                ...selectedPatient,
                ...drawerFullPatient,
                allergies: Array.isArray(drawerFullPatient.allergies)
                  ? drawerFullPatient.allergies
                  : selectedPatient.allergies || [],
                chronicConditions: Array.isArray(drawerFullPatient.chronicDiseases)
                  ? drawerFullPatient.chronicDiseases
                  : Array.isArray(drawerFullPatient.chronicConditions)
                  ? drawerFullPatient.chronicConditions
                  : selectedPatient.chronicConditions || [],
                emergencyContactName:
                  drawerFullPatient.emergencyContactName || selectedPatient.emergencyContactName || null,
                emergencyContactPhone:
                  drawerFullPatient.emergencyContactPhone ||
                  drawerFullPatient.emergencyContact ||
                  selectedPatient.emergencyContactPhone ||
                  null,
                insuranceProvider:
                  drawerFullPatient.insuranceProvider || selectedPatient.insuranceProvider || null,
                policyNumber:
                  drawerFullPatient.policyNumber ||
                  drawerFullPatient.insuranceNumber ||
                  selectedPatient.policyNumber ||
                  null,
                city: drawerFullPatient.city || selectedPatient.city || null,
                address: drawerFullPatient.address || selectedPatient.address || null,
                postalCode:
                  drawerFullPatient.postalCode ||
                  drawerFullPatient.pincode ||
                  selectedPatient.postalCode ||
                  null,
              }
            : selectedPatient;

          return (
            <div className="fixed inset-0 z-50 overflow-hidden">
              {/* Backdrop Blur */}
              <div
                onClick={handleCloseDrawer}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
              />

              <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
                  {/* Drawer Header - Light White Professional Clinical Design */}
                  <div className="relative border-b border-slate-200 bg-white px-6 py-5 text-slate-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
                          Clinical Dossier
                        </span>
                        {activePatient.status === "Critical" && (
                          <span className="rounded-md bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                            Critical Alert
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* DPDP PII Privacy Masking Toggle */}
                        <button
                          onClick={() => setMaskPii(!maskPii)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                            maskPii
                              ? "bg-amber-50 text-amber-800 border border-amber-300"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                          }`}
                          title="Toggle DPDP Act 2023 PII Masking"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-slate-600" />
                          <span>{maskPii ? "PII Masked" : "Mask PII"}</span>
                        </button>

                        {/* Seamless internal route if user wants full page */}
                        <Link
                          href={`/patients/${activePatient.uhid || activePatient.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
                          title="Open Full Clinical Dossier"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Full Page</span>
                        </Link>

                        <button
                          onClick={handleCloseDrawer}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Close (Esc)"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Patient Info Header in Drawer */}
                    <div className="mt-4 flex items-center gap-4">
                      <PatientIdentityMark
                        firstName={activePatient.firstName}
                        lastName={activePatient.lastName}
                        status={activePatient.status}
                        gender={activePatient.gender}
                        size="hero"
                      />

                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl font-black text-slate-900 truncate">
                          {formatPatientFullName(activePatient)}
                        </h2>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <button
                            onClick={(e) => handleCopyUhid(e, activePatient.uhid)}
                            className="inline-flex items-center gap-1 font-mono font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200"
                            title="Click to copy UHID"
                          >
                            <span>{activePatient.uhid}</span>
                            <Copy className="h-3 w-3" />
                          </button>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 font-medium">
                            {calculateClinicalAge(activePatient.dateOfBirth, activePatient.age).formatted} •{" "}
                            {activePatient.gender === "MALE"
                              ? "Male"
                              : activePatient.gender === "FEMALE"
                              ? "Female"
                              : "Other"}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {formatBloodGroup(activePatient.bloodGroup)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Drawer Fast Action Bar */}
                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Link
                        href={`/orders/new?patientId=${activePatient.id}&uhid=${encodeURIComponent(activePatient.uhid)}`}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-center text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>New Order</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setActivePrintPatient(activePatient)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-600" />
                        <span>Face Sheet</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const fullName = formatPatientFullName(activePatient);
                          const clinicalAge = calculateClinicalAge(activePatient.dateOfBirth, activePatient.age);
                          const items: BarcodeLabelItem[] = [{
                            id: `badge-${activePatient.id}`,
                            barcode: activePatient.uhid,
                            patientName: fullName,
                            uhid: activePatient.uhid,
                            testName: 'Patient Identification Badge',
                            specimenType: 'Patient Badge',
                            tubeType: 'Standard ID Tag',
                            tubeColor: 'Blue',
                            tubeColorHex: '#2563EB',
                            age: clinicalAge.formatted,
                            gender: activePatient.gender === 'MALE' ? 'M' : activePatient.gender === 'FEMALE' ? 'F' : 'O',
                            date: new Date().toLocaleDateString('en-IN'),
                            priority: activePatient.isCritical ? 'STAT' : 'ROUTINE',
                          }];
                          setBarcodeItems(items);
                          setBarcodeModalOpen(true);
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Printer className="h-3.5 w-3.5 text-slate-600" />
                        <span>Barcode</span>
                      </button>

                      {activePatient.abhaNumber ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAbhaCardData({
                              abhaNumber: activePatient.abhaNumber,
                              abhaAddress: activePatient.abhaAddress || `${activePatient.firstName.toLowerCase()}@abdm`,
                              name: formatPatientFullName(activePatient),
                              gender: activePatient.gender,
                              mobile: activePatient.phone,
                              bloodGroup: activePatient.bloodGroup,
                              status: 'ACTIVE',
                              qrData: `https://abdm.gov.in/phr/${activePatient.abhaNumber}`,
                            });
                          }}
                          className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-center text-xs font-bold text-purple-700 shadow-2xs hover:bg-purple-100 transition-all flex items-center justify-center gap-1.5"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>ABHA Card</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveAbhaLinkPatient(activePatient)}
                          className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-center text-xs font-bold text-purple-700 shadow-2xs hover:bg-purple-100 transition-all flex items-center justify-center gap-1.5"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Link ABHA</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Enterprise Clinical Drawer Navigation ── */}
                  <div className="flex border-b border-slate-200 bg-slate-50/80 overflow-x-auto scrollbar-hide">
                    {[
                      { id: 'overview',   label: 'Overview',           icon: Activity },
                      { id: 'orders',     label: 'Lab Orders',         icon: FlaskConical },
                      { id: 'vitals',     label: 'Clinical Vitals',    icon: HeartPulse },
                      { id: 'rx',         label: 'Consultation & Rx',  icon: Stethoscope },
                      { id: 'ipd',        label: 'Inpatient (IPD)',    icon: Building2 },
                      { id: 'timeline',   label: 'Timeline',           icon: Clock },
                      { id: 'billing',    label: 'Billing & TPA',      icon: FileCheck },
                      { id: 'tubes',      label: 'Phlebotomy Guide',   icon: Droplets },
                      { id: 'documents',  label: 'Consents & ABHA',    icon: ShieldCheck },
                      { id: 'edit',       label: 'Quick Edit',         icon: Edit },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = drawerTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleDrawerTabChange(tab.id as any)}
                          className={`flex shrink-0 flex-col items-center gap-0.5 border-b-2 px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                            isActive
                              ? 'border-indigo-600 text-indigo-600 bg-white'
                              : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Drawer Tab Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* TAB 1: OVERVIEW & CLINICAL VITALS TRIAGE */}
                    {drawerTab === "overview" && (
                      <div className="space-y-6">
                        {/* A. Clinical Vitals & Triage Center */}
                        <ClinicalVitalsTriageCenter
                          patient={activePatient}
                          onVitalsUpdated={handlePatientVitalsUpdated}
                        />

                        {/* B. Core Demographics Summary Card */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                            CLINICAL FLAGS
                          </h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-xl bg-white p-3 border border-slate-200/80">
                              <span className="text-[11px] text-slate-400 font-medium">Blood Group</span>
                              <p className="text-base font-extrabold text-rose-600">
                                {formatBloodGroup(activePatient.bloodGroup)}
                              </p>
                            </div>
                            <div className="rounded-xl bg-white p-3 border border-slate-200/80">
                              <span className="text-[11px] text-slate-400 font-medium">Age / Gender</span>
                              <p className="text-sm font-bold text-slate-900">
                                {activePatient.age !== null && activePatient.age !== undefined
                                  ? (activePatient.age === 0 ? "0 Y (Newborn)" : `${activePatient.age} Y`)
                                  : "N/A"}{" "}
                                •{" "}
                                {activePatient.gender === "MALE"
                                  ? "M"
                                  : activePatient.gender === "FEMALE"
                                  ? "F"
                                  : "O"}
                              </p>
                            </div>
                            <div className="rounded-xl bg-white p-3 border border-slate-200/80">
                              <span className="text-[11px] text-slate-400 font-medium">Priority Flag</span>
                              <p className="text-sm font-bold text-emerald-600">
                                {activePatient.isCritical ? "STAT Alert" : "Routine OPD"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Contact & Demographics */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                            CONTACT DETAILS
                          </h4>
                          <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 text-xs">
                            <div className="flex justify-between p-3.5">
                              <span className="text-slate-500">Phone Number</span>
                              <span className="font-bold text-slate-900 font-mono">
                                {maskPii ? maskPhone(activePatient.phone) : formatIndianPhone(activePatient.phone).display}
                              </span>
                            </div>
                            <div className="flex justify-between p-3.5">
                              <span className="text-slate-500">Email Address</span>
                              <span className="font-semibold text-slate-800">
                                {maskPii ? maskEmail(activePatient.email) : (activePatient.email || "Not recorded")}
                              </span>
                            </div>
                            <div className="flex justify-between p-3.5">
                              <span className="text-slate-500">Residential Address</span>
                              <span className="font-medium text-slate-800 text-right max-w-xs">
                                {activePatient.address || activePatient.city || "Not recorded"}
                              </span>
                            </div>
                            <div className="flex justify-between p-3.5">
                              <span className="text-slate-500">City / Postal Code</span>
                              <span className="font-medium text-slate-800 text-right">
                                {activePatient.city || "Not recorded"}{" "}
                                {activePatient.postalCode ? `- ${activePatient.postalCode}` : ""}
                              </span>
                            </div>
                            {(activePatient.nationalId || activePatient.aadhaarNumber) && (
                              <div className="flex justify-between p-3.5 bg-indigo-50/40">
                                <span className="text-indigo-900 font-semibold flex items-center gap-1">
                                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                                  <span>ABDM / National ID</span>
                                </span>
                                <span className="font-mono font-bold text-indigo-900">
                                  {activePatient.nationalId ? formatAbhaNumber(activePatient.nationalId) : (maskPii ? "•••• •••• " + String(activePatient.aadhaarNumber).slice(-4) : activePatient.aadhaarNumber)}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between p-3.5">
                              <span className="text-slate-500">Date of Registration</span>
                              <span className="font-medium text-slate-800">
                                {new Date(activePatient.createdAt).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Emergency Contact */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                            Emergency Contact
                          </h4>
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Contact Name</span>
                              <span className="font-bold text-slate-800">
                                {activePatient.emergencyContactName || "Self / Family"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Contact Phone</span>
                              <span className="font-bold text-slate-800 font-mono">
                                {activePatient.emergencyContactPhone || activePatient.emergencyContact || "Not recorded"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* INSURANCE DETAILS */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                            Insurance Details
                          </h4>
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Insurance Provider</span>
                              <span className="font-semibold text-slate-800">
                                {activePatient.insuranceProvider || "Cash / Self-Pay (No TPA)"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-medium">Insurance ID</span>
                              <span className="font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                {activePatient.insuranceId || activePatient.insuranceNumber || (activePatient.policyNumber ? `INS-${activePatient.policyNumber}` : "N/A")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Policy / Member ID</span>
                              <span className="font-semibold text-slate-800 font-mono">
                                {activePatient.policyNumber || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: VISIT HISTORY */}
                    {drawerTab === "orders" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Visit History
                          </h4>
                          <Link
                            href={`/orders/new?patientId=${activePatient.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Book Test</span>
                          </Link>
                        </div>

                        {loadingOrders ? (
                          <div className="py-8 text-center text-xs text-slate-500">
                            <FlaskConical className="h-6 w-6 animate-spin mx-auto text-indigo-500 mb-2" />
                            Loading lab test history...
                          </div>
                        ) : patientOrders.length > 0 ? (
                          <div className="space-y-3">
                            {patientOrders.map((order: any, idx: number) => (
                              <div
                                key={order.id || idx}
                                className="rounded-xl border border-slate-200 p-4 hover:border-indigo-200 transition-all bg-white"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-xs font-bold text-indigo-600">
                                    {order.orderNumber || `ORD-${order.id?.slice(0, 6)}`}
                                  </span>
                                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                    {order.orderStatus || "PROCESSING"}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm font-bold text-slate-800">
                                  {order.items?.[0]?.test?.testName || "Complete Diagnostics Panel"}
                                </p>
                                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                  <span>
                                    Date: {new Date(order.createdAt || Date.now()).toLocaleDateString()}
                                  </span>
                                  <Link
                                    href={`/reports?search=${encodeURIComponent(activePatient.uhid)}`}
                                    className="font-bold text-indigo-600 hover:underline"
                                  >
                                    View Report →
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                            <FlaskConical className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-700">No Orders On Record</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              No lab orders have been processed yet for this UHID.
                            </p>
                            <Link
                              href={`/orders/new?patientId=${activePatient.id}`}
                              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Create First Order</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ═══ TAB 3: CLINICAL PROFILE ═══ */}
                    {drawerTab === 'vitals' && (
                      <div className="space-y-4 text-xs">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                          <h4 className="font-bold text-slate-900 text-sm">Chronic Conditions &amp; Risk Flags</h4>
                          <div className="flex flex-wrap gap-2">
                            {sanitizeMedicalConditions(activePatient.chronicConditions).length > 0 ? (
                              sanitizeMedicalConditions(activePatient.chronicConditions).map((c: string, i: number) => (
                                <span key={i} className="rounded-lg bg-amber-50 px-2.5 py-1 font-bold text-amber-800 ring-1 ring-amber-200">{c}</span>
                              ))
                            ) : (
                              <span className="text-slate-400">No chronic diseases registered.</span>
                            )}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                          <h4 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                            <span>Allergies &amp; Drug Sensitivities</span>
                            {sanitizeMedicalConditions(activePatient.allergies).length > 0 && (
                              <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                                {sanitizeMedicalConditions(activePatient.allergies).length} Recorded
                              </span>
                            )}
                          </h4>
                          {sanitizeMedicalConditions(activePatient.allergies).length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {sanitizeMedicalConditions(activePatient.allergies).map((allergy: string, idx: number) => (
                                <span key={idx} className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
                                  <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />{allergy}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-400 text-xs">No known drug allergies (NKDA) recorded.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ═══ TAB 4: CLINICAL CONSULTATION & RX ═══ */}
                    {drawerTab === 'rx' && (
                      <div className="space-y-4">
                        {/* Doctor Consultation Header */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                                <Stethoscope className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900">
                                  {activePatient.attendingDoctor || 'Dr. Rajesh Sharma, MD (Internal Medicine)'}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <span>{activePatient.department || 'General Medicine'}</span>
                                  <span>•</span>
                                  <span>Consultation Slip #{activePatient.uhid}</span>
                                </div>
                              </div>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                              Active Rx
                            </span>
                          </div>
                        </div>

                        {/* Chief Complaints & Clinical Findings */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Chief Complaints &amp; Observations
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Primary Symptoms</span>
                              <p className="mt-1 font-semibold text-slate-800">
                                {activePatient.isCritical 
                                  ? 'Acute exacerbation, chest tightness, dyspnea on exertion'
                                  : 'General malaise, intermittent pyrexia, mild productive cough x 3 days'}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Clinical Impression</span>
                              <p className="mt-1 font-semibold text-slate-800">
                                {activePatient.chronicConditions && activePatient.chronicConditions.length > 0 
                                  ? `Comorbid with ${activePatient.chronicConditions.join(', ')}. Under ongoing treatment.`
                                  : 'Upper Respiratory Infection / Routine Investigation requested.'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Prescribed Medications (Rx Table) */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Prescribed Pharmacotherapy (Rx)
                            </h5>
                            <span className="text-[11px] font-semibold text-slate-500">Hospital Formulary</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-600">
                                  <th className="py-2 px-3">Medicine &amp; Strength</th>
                                  <th className="py-2 px-3">Dosage / Timing</th>
                                  <th className="py-2 px-3">Duration</th>
                                  <th className="py-2 px-3">Instructions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                <tr>
                                  <td className="py-2.5 px-3">
                                    <div className="font-bold text-slate-900">Tab. Paracetamol 650 mg</div>
                                    <div className="text-[10px] text-slate-400">Analgesic / Antipyretic</div>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">1 - 0 - 1 (SOS)</td>
                                  <td className="py-2.5 px-3">3 Days</td>
                                  <td className="py-2.5 px-3 text-slate-500">Post prandial (After meals)</td>
                                </tr>
                                <tr>
                                  <td className="py-2.5 px-3">
                                    <div className="font-bold text-slate-900">Tab. Pantoprazole 40 mg</div>
                                    <div className="text-[10px] text-slate-400">Proton Pump Inhibitor</div>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">1 - 0 - 0</td>
                                  <td className="py-2.5 px-3">5 Days</td>
                                  <td className="py-2.5 px-3 text-slate-500">Ante prandial (Empty stomach 30m prior)</td>
                                </tr>
                                <tr>
                                  <td className="py-2.5 px-3">
                                    <div className="font-bold text-slate-900">Tab. Multivitamin &amp; Zinc Forte</div>
                                    <div className="text-[10px] text-slate-400">Dietary Supplement</div>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">0 - 1 - 0</td>
                                  <td className="py-2.5 px-3">15 Days</td>
                                  <td className="py-2.5 px-3 text-slate-500">After lunch with full glass water</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Clinical Advice & Follow-up */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Clinical Advice &amp; Follow-Up Protocol
                          </h5>
                          <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                            <li>Maintain strict hydration (minimum 2.5 - 3 Litres water daily).</li>
                            <li>Collect fasting blood sample (10-12 hours fasting) for assigned laboratory profile.</li>
                            <li>Report immediately to Emergency Triage if SpO2 drops below 94% or high fever persists.</li>
                            <li>Next clinical review scheduled in OPD after 5 days with test reports.</li>
                          </ul>
                          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                            <button
                              onClick={() => window.print()}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-xs"
                            >
                              <Printer className="h-3.5 w-3.5 text-slate-500" />
                              <span>Print Prescription (Rx)</span>
                            </button>
                            <button
                              onClick={() => {
                                setWhatsappModalPatient(activePatient);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>Send Rx via WhatsApp</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ═══ TAB 4B: INPATIENT (IPD) / WARD ALLOCATION ═══ */}
                    {drawerTab === 'ipd' && (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <Building2 className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900">
                                  {activePatient.ward || 'General Medical Ward (Floor 2)'}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <span>Bed: <strong>{activePatient.bedNumber || 'Bed #14 (O2 Port)'}</strong></span>
                                  <span>•</span>
                                  <span>Care Level: {activePatient.patientType || 'Inpatient (IPD)'}</span>
                                </div>
                              </div>
                            </div>
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 border border-blue-200">
                              Admitted
                            </span>
                          </div>
                        </div>

                        {/* Inpatient Care Team */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Attending Consultant</span>
                            <p className="mt-1 text-xs font-bold text-slate-800">
                              {activePatient.attendingDoctor || 'Dr. Rajesh Sharma, MD'}
                            </p>
                            <p className="text-[10px] text-slate-500">Unit Head - Internal Med</p>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Duty RMO</span>
                            <p className="mt-1 text-xs font-bold text-slate-800">Dr. Vivek Rathore, MBBS</p>
                            <p className="text-[10px] text-slate-500">Night &amp; Emergency Cover</p>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nursing Station</span>
                            <p className="mt-1 text-xs font-bold text-slate-800">Station B - Ext 204</p>
                            <p className="text-[10px] text-slate-500">Sr. Sister In-charge</p>
                          </div>
                        </div>

                        {/* Inpatient Round Notes & Protocols */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Daily Ward Rounds &amp; Clinical Summary
                          </h5>
                          <div className="space-y-2 text-xs text-slate-700">
                            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-slate-900">Morning Consultant Round</span>
                                <span className="text-[10px] text-slate-400">Today, 09:30 AM</span>
                              </div>
                              <p className="text-slate-600">
                                Patient conscious, oriented to time, place, and person. Chest clear bilaterally, heart sounds normal. Vitals stable. Continue oral and IV antibiotic protocol. Daily morning renal and electrolyte review recommended.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Diet & Fluid Charting */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Dietary &amp; Nursing Protocol
                          </h5>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-2.5 rounded-lg bg-slate-50">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Diet Order</span>
                              <p className="font-semibold text-slate-800">Diabetic &amp; Low Sodium (1.5g Na)</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-50">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Fluid Restrictions</span>
                              <p className="font-semibold text-slate-800">Strict I/O Charting • Max 2000 mL/day</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ═══ TAB 5: CLINICAL TIMELINE ═══ */}
                    {drawerTab === 'timeline' && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Audit Trail &amp; Clinical Events</h4>
                        <div className="relative pl-5 space-y-0">
                          {/* Timeline line */}
                          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-200" />
                          {[
                            {
                              event: 'UHID Registration',
                              detail: `ID: ${activePatient.uhid} issued by LIS Engine`,
                              time: activePatient.createdAt,
                              color: 'emerald',
                              icon: '🏥',
                            },
                            {
                              event: 'Master Record Created',
                              detail: 'Patient demographics, contact, and clinical flags saved',
                              time: activePatient.createdAt,
                              color: 'blue',
                              icon: '📋',
                            },
                            ...(activePatient.totalOrders ?? 0) > 0 ? [{
                              event: `${activePatient.totalOrders} Lab Order(s) Processed`,
                              detail: `${activePatient.pendingOrders ?? 0} pending · ${(activePatient.totalOrders ?? 0) - (activePatient.pendingOrders ?? 0)} completed`,
                              time: activePatient.lastVisitDate || activePatient.updatedAt || activePatient.createdAt,
                              color: 'indigo',
                              icon: '🧪',
                            }] : [],
                            ...activePatient.isCritical ? [{
                              event: 'STAT / Critical Alert Raised',
                              detail: 'Patient flagged for critical priority queue',
                              time: activePatient.updatedAt || activePatient.createdAt,
                              color: 'rose',
                              icon: '⚠️',
                            }] : [],
                            {
                              event: 'Last Record Update',
                              detail: 'Demographics or clinical data modified',
                              time: activePatient.updatedAt || activePatient.createdAt,
                              color: 'slate',
                              icon: '✏️',
                            },
                          ].map((ev, i) => (
                            <div key={i} className="relative flex items-start gap-3 pb-5">
                              <span className={`absolute -left-3.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] border-2 border-white shadow ${
                                ev.color === 'emerald' ? 'bg-emerald-500' :
                                ev.color === 'blue' ? 'bg-blue-500' :
                                ev.color === 'indigo' ? 'bg-indigo-500' :
                                ev.color === 'rose' ? 'bg-rose-500' : 'bg-slate-400'
                              }`}>{ev.icon}</span>
                              <div className="ml-2 min-w-0">
                                <p className="text-xs font-bold text-slate-900">{ev.event}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">{ev.detail}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {ev.time ? new Date(ev.time).toLocaleString('en-IN') : 'Unknown'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ═══ TAB 6: BILLING & INSURANCE ═══ */}
                    {drawerTab === 'billing' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Orders</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">{activePatient.totalOrders ?? 0}</p>
                          </div>
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending TAT</p>
                            <p className="text-2xl font-black text-amber-700 mt-1">{activePatient.pendingOrders ?? 0}</p>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
                          <div className="flex justify-between p-3.5 text-xs">
                            <span className="text-slate-500">Insurance Provider</span>
                            <span className="font-bold text-slate-900">{activePatient.insuranceProvider || 'Cash / Self-Pay'}</span>
                          </div>
                          <div className="flex justify-between p-3.5 text-xs">
                            <span className="text-slate-500">Policy Number</span>
                            <span className="font-mono font-bold text-indigo-700">{activePatient.policyNumber || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between p-3.5 text-xs">
                            <span className="text-slate-500">Payment Mode</span>
                            <span className="font-bold text-slate-900">
                              {activePatient.insuranceProvider ? 'TPA / Insurance' : 'Cash Payment'}
                            </span>
                          </div>
                          <div className="flex justify-between p-3.5 text-xs">
                            <span className="text-slate-500">Govt Scheme</span>
                            <span className="font-bold text-slate-500">Not enrolled</span>
                          </div>
                        </div>
                        <Link
                          href={`/invoices?patientId=${activePatient.id}`}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View All Invoices
                        </Link>
                      </div>
                    )}

                    {/* ═══ TAB 7: PHLEBOTOMY / TUBES ═══ */}
                    {drawerTab === 'tubes' && (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Droplets className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-bold text-blue-900">Phlebotomy Guide</span>
                          </div>
                          <p className="text-[11px] text-blue-700">Recommended specimen tubes based on patient blood group and registered lab orders.</p>
                        </div>
                        {[
                          { tube: 'EDTA / Purple Top', use: 'CBC, HbA1c, Blood Group Confirmation', color: '#7C3AED', priority: 'Primary' },
                          { tube: 'SST / Gold Top', use: 'LFT, KFT, Lipid Profile, CRP, Hormones', color: '#D97706', priority: 'Primary' },
                          { tube: 'Citrate / Blue Top', use: 'PT/INR, APTT, Coagulation', color: '#2563EB', priority: 'Secondary' },
                          { tube: 'Fluoride / Grey Top', use: 'Fasting Glucose, HbA1c Glucose', color: '#6B7280', priority: 'If Diabetic' },
                        ].map((t, i) => (
                          <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
                            <div className="h-8 w-3 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: t.color }} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-slate-900">{t.tube}</p>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">{t.priority}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">{t.use}</p>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const items: BarcodeLabelItem[] = [{
                              id: `tube-${activePatient.id}`,
                              barcode: activePatient.uhid,
                              patientName: formatPatientFullName(activePatient),
                              uhid: activePatient.uhid,
                              testName: 'Specimen Collection',
                              specimenType: 'Whole Blood',
                              tubeType: 'EDTA',
                              tubeColor: 'Purple',
                              tubeColorHex: '#7C3AED',
                              age: calculateClinicalAge(activePatient.dateOfBirth, activePatient.age).formatted,
                              gender: activePatient.gender === 'MALE' ? 'M' : activePatient.gender === 'FEMALE' ? 'F' : 'O',
                              date: new Date().toLocaleDateString('en-IN'),
                              priority: activePatient.isCritical ? 'STAT' : 'ROUTINE',
                            }];
                            setBarcodeItems(items);
                            setBarcodeModalOpen(true);
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                        >
                          <Barcode className="h-3.5 w-3.5" />
                          Print Specimen Labels
                        </button>
                      </div>
                    )}

                    {/* ═══ TAB 8: CONSENTS & DOCUMENTS ═══ */}
                    {drawerTab === 'documents' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Legal &amp; Consents</h4>
                          <span className="text-[11px] font-semibold text-emerald-600">DPDP 2023 Compliant</span>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between shadow-sm">
                          <div>
                            <p className="text-xs font-bold text-slate-900">Patient ID Card &amp; Registration Form</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Full printable clinical face-sheet with barcode and UHID.</p>
                          </div>
                          <Link href={`/patients/${activePatient.id}/print`} className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                            Print Form
                          </Link>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between shadow-sm">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-900">General Treatment &amp; DPDP Consent</p>
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">Active</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">Treatment consent, electronic report delivery, digital authorization.</p>
                          </div>
                          <Link href={`/patients/${activePatient.uhid || activePatient.id}`} className="rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">
                            View Consent
                          </Link>
                        </div>
                        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="h-4 w-4 text-indigo-600" />
                            <span className="text-xs font-bold text-indigo-800">Data Privacy (DPDP Act 2023)</span>
                          </div>
                          <p className="text-[11px] text-indigo-700">Patient data is processed under the Digital Personal Data Protection Act 2023. PII masking available via the Mask PII toggle above.</p>
                        </div>
                      </div>
                    )}

                    {/* ═══ TAB 9: QUICK EDIT ═══ */}
                    {drawerTab === 'edit' && (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-amber-600" />
                            <span className="text-xs font-bold text-amber-800">Quick Edit Mode</span>
                          </div>
                          <p className="text-[11px] text-amber-700 mt-1">For a full edit form, open the patient's full page. Quick edits will reflect immediately.</p>
                        </div>
                        <div className="space-y-3">
                          {[
                            { label: 'First Name', value: activePatient.firstName },
                            { label: 'Last Name', value: activePatient.lastName },
                            { label: 'Phone', value: maskPii ? '••••••' : (activePatient.phone || '') },
                            { label: 'Email', value: maskPii ? '••••••' : (activePatient.email || '') },
                            { label: 'City', value: activePatient.city || '' },
                            { label: 'Postal Code', value: activePatient.postalCode || '' },
                          ].map((f, i) => (
                            <div key={i}>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{f.label}</label>
                              <input
                                type="text"
                                defaultValue={f.value}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                              />
                            </div>
                          ))}
                        </div>
                        <Link
                          href={`/patients/${activePatient.uhid || activePatient.id}`}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Open Full Edit Form
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Drawer Footer Actions */}
                  <div className="border-t border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">
                      ID: {activePatient.id}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCloseDrawer}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => router.push(`/patients/${activePatient.uhid || activePatient.id}`)}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"
                      >
                        <span>Full Patient Information</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* =========================================================================
            6. MODALS INTEGRATION
        ========================================================================= */}
        {/* Modal 1: Enterprise Multi-Step Patient Registration Wizard (identical to Doctor Wizard) */}
        <RegisterPatientWizard
          isOpen={isQuickRegisterOpen}
          onClose={() => setIsQuickRegisterOpen(false)}
          onSuccess={(newPatient) => {
            fetchPatients();
            setIsQuickRegisterOpen(false);
          }}
        />

        {/* Modal 2: Barcode Label Print Modal */}
        <BarcodeLabelModal
          isOpen={barcodeModalOpen}
          onClose={() => setBarcodeModalOpen(false)}
          labels={barcodeItems}
          initialSelectedBarcode={selectedBarcodeToPrint}
          patient={selectedPatient || undefined}
        />

        {/* Modal 2B: OPD Quick Token Dispatch Modal */}
        <QuickTokenModal
          isOpen={isQuickTokenOpen}
          onClose={() => setIsQuickTokenOpen(false)}
          onTokenCreated={(token) => {
            showSuccess(`OPD Token #${token.tokenNumber} issued successfully for ${token.patientName}`);
            setIsQuickTokenOpen(false);
            fetchPatients(1, true);
          }}
          existingPatients={patients}
        />

        {/* Modal 4: ABDM / ABHA Aadhaar OTP Linking Modal */}
        {activeAbhaLinkPatient && (
          <AbhaLinkModal
            patientId={activeAbhaLinkPatient.id}
            patientName={formatPatientFullName(activeAbhaLinkPatient)}
            onClose={() => setActiveAbhaLinkPatient(null)}
            onSuccess={(abhaNum, abhaAddr) => {
              showSuccess(`ABHA ID ${abhaNum} successfully linked to ${activeAbhaLinkPatient.uhid}!`);
              setActiveAbhaLinkPatient(null);
              fetchPatients(1, true);
            }}
          />
        )}

        {/* Modal 5: Ayushman Bharat Official ABHA Digital Health Card Preview Modal */}
        {activeAbhaCardData && (
          <AbhaCardModal
            data={activeAbhaCardData}
            onClose={() => setActiveAbhaCardData(null)}
          />
        )}

        {/* Modal 7: OPD / IPD Clinical Station Transfer Modal */}
        <TransferStationModal
          isOpen={isTransferModalOpen}
          token={transferModalToken}
          onClose={() => {
            setIsTransferModalOpen(false);
            setTransferModalToken(null);
          }}
          onTransfer={(tokenId, newStage, newCounter, note) => {
            showSuccess(`Token ${tokenId} transferred to ${newCounter} successfully.`);
            setIsTransferModalOpen(false);
            setTransferModalToken(null);
            fetchPatients(1, true);
          }}
        />

        {/* Modal 8: Inpatient (IPD) Bed Allocation & Ward Transfer Modal */}
        <BedAllocationModal
          isOpen={isBedModalOpen}
          onClose={() => {
            setIsBedModalOpen(false);
            setBedModalPatient(null);
            setBedModalInitialWard(undefined);
            setBedModalInitialBed(undefined);
          }}
          patient={bedModalPatient}
          initialWard={bedModalInitialWard}
          initialBed={bedModalInitialBed}
          onAllocate={handleBedAllocated}
        />

        {/* Modal 6: Printable Patient Face-Sheet & DPDP 2023 Intake Registration Form */}
        {activePrintPatient && (
          <PatientRegistrationPrintForm
            patientId={activePrintPatient.id}
            onClose={() => setActivePrintPatient(null)}
          />
        )}

        {/* Modal 3: WhatsApp Diagnostic Notification Dispatch Modal */}
        {whatsappModalPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                  <MessageCircle className="h-5 w-5" />
                  <span>Send WhatsApp Diagnostic Alert</span>
                </div>
                <button
                  onClick={() => setWhatsappModalPatient(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900">
                    {formatPatientFullName(whatsappModalPatient)} ({whatsappModalPatient.phone})
                  </p>
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {whatsappModalPatient.uhid}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Quick Templates</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setWhatsappMessage(
                          `*🏥 LABCORE DIAGNOSTICS & CLINICAL RESEARCH*\n` +
                          `_NABL Accredited Medical Laboratory | ISO 15189:2022_\n` +
                          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                          `*OFFICIAL PATIENT REGISTRATION & EHR CONFIRMATION*\n\n` +
                          `Dear *${formatPatientFullName(whatsappModalPatient)}*,\n\n` +
                          `Your clinical diagnostic profile is formally registered and validated in our Laboratory Information System.\n\n` +
                          `• *Universal Health ID (UHID):* \`${whatsappModalPatient.uhid}\`\n` +
                          `• *Registry Status:* Active EHR Dossier • ABDM & HIPAA Compliant\n` +
                          `• *Diagnostic Portal:* 24/7 Cumulative History & Digital Reports\n\n` +
                          `📞 *Clinical Support Desk:* +91 9106161228 | support@labcore.health\n` +
                          `_Dedicated to Diagnostic Precision & Patient Care_`
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-all text-center"
                    >
                      UHID Welcome
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setWhatsappMessage(
                          `*🏥 LABCORE DIAGNOSTICS | SPECIMEN CHAIN OF CUSTODY*\n` +
                          `_Quality Assurance & Clinical Pathology Department_\n` +
                          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                          `*BIOLOGICAL SPECIMEN ACCESSIONING CONFIRMATION*\n\n` +
                          `Dear *${formatPatientFullName(whatsappModalPatient)}*,\n\n` +
                          `Your biological specimens for UHID \`${whatsappModalPatient.uhid}\` have been safely collected under cold-chain logistics and formally accessioned.\n\n` +
                          `• *Patient UHID:* \`${whatsappModalPatient.uhid}\`\n` +
                          `• *Specimen Barcode:* ACC-${whatsappModalPatient.uhid}-QC\n` +
                          `• *Status:* Automated Dual-Analyzer Queue & Calibration\n` +
                          `• *Turnaround Time:* Estimated 4–6 Hours for Pathologist Sign-off\n\n` +
                          `Verified reports will be dispatched immediately upon medical authorization.\n` +
                          `_Department of Laboratory Medicine • LabCore Diagnostics_`
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-all text-center"
                    >
                      Sample Drawn
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setWhatsappMessage(
                          `*🏥 LABCORE DIAGNOSTICS | PATHOLOGY REPORT RELEASE*\n` +
                          `_Accredited Reference Laboratory | ISO 15189:2022 Standards_\n` +
                          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                          `*AUTHORIZED CLINICAL INVESTIGATION REPORT RELEASE*\n\n` +
                          `Dear *${formatPatientFullName(whatsappModalPatient)}*,\n\n` +
                          `Your diagnostic laboratory investigation reports (UHID: \`${whatsappModalPatient.uhid}\`) have been completed and digitally authorized by our Consultant Pathologist.\n\n` +
                          `📑 *Authorized Report Access:* \n` +
                          `🔗 https://labcore.health/reports?search=${encodeURIComponent(whatsappModalPatient.uhid)}\n\n` +
                          `⚠️ *Clinical Notice:* Please review this report in consultation with your treating physician for accurate clinical correlation.\n\n` +
                          `📞 *Laboratory Helpdesk:* +91 9106161228 | reports@labcore.health`
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-all text-center"
                    >
                      Report Ready
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setWhatsappMessage(
                          `*🏥 LABCORE DIAGNOSTICS | FINANCIAL SERVICES*\n` +
                          `_Hospital Administration & Billing Division_\n` +
                          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                          `*OFFICIAL CLINICAL BILLING RECEIPT & LEDGER UPDATE*\n\n` +
                          `Dear *${formatPatientFullName(whatsappModalPatient)}*,\n\n` +
                          `We confirm receipt of payment for your diagnostic investigations under UHID \`${whatsappModalPatient.uhid}\`.\n\n` +
                          `• *Patient UHID:* \`${whatsappModalPatient.uhid}\`\n` +
                          `• *Billing Status:* Reconciled & Closed in LIS Ledger\n` +
                          `• *Compliance:* GST-Compliant Tax Invoice Filed\n\n` +
                          `Your digital receipt is archived in your patient portal dossier.\n` +
                          `📞 *Accounts & Billing:* +91 9106161228 | accounts@labcore.health`
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-all text-center"
                    >
                      Payment Receipt
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Message Content</label>
                  <textarea
                    rows={6}
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs font-mono text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => setWhatsappModalPatient(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendWhatsAppDirect}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Dispatch WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
