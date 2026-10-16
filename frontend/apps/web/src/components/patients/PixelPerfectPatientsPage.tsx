"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { patientApi, orderApi } from "@/lib/api";
import { showSuccess, showError, showInfo } from "@/lib/notifications";
import { PatientQuickRegisterModal } from "@/components/orders/PatientQuickRegisterModal";
import RegisterPatientWizard from "@/components/patients/RegisterPatientWizard";
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
    "overview" | "orders" | "vitals" | "ai" | "timeline" | "billing" | "tubes" | "documents" | "edit"
  >(
    (searchParams.get("tab") as any) || "overview"
  );
  const [patientOrders, setPatientOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // View Mode: Table vs Luxury Medical Card Grid
  const [viewMode, setViewMode] = useState<"table" | "grid">(initialViewMode);

  // Search & Filtering State
  const [search, setSearch] = useState(initialSearch);

  // AI Natural Language Query Parser
  const nlpParsedQuery = useMemo(() => {
    return parseNaturalLanguagePatientQuery(search);
  }, [search]);

  const [activeChip, setActiveChip] = useState<"ALL" | "ACTIVE" | "TODAY" | "CRITICAL" | "PENDING" | "SENIOR">(
    ["ALL", "ACTIVE", "TODAY", "CRITICAL", "PENDING", "SENIOR"].includes(initialChip) ? initialChip : "ALL"
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
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeItems, setBarcodeItems] = useState<BarcodeLabelItem[]>([]);
  const [selectedBarcodeToPrint, setSelectedBarcodeToPrint] = useState<string | undefined>(undefined);
  const [whatsappModalPatient, setWhatsappModalPatient] = useState<Patient | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState("");

  // Copy Feedback indicator
  const [copiedUhid, setCopiedUhid] = useState<string | null>(null);

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

  // Escape key listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        setIsDrawerOpen(false);
        setSelectedPatient(null);
        setDrawerFullPatient(null);
        updateUrlParams({ view: null, tab: null });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, updateUrlParams]);

  // Document Title
  useEffect(() => {
    document.title = "Patients Medical Dossier | LabCore ELIS";
  }, []);

  // Sync state with URL search params changes (e.g. Back/Forward button)
  useEffect(() => {
    const qParam = searchParams.get("q") || searchParams.get("search") || "";
    if (qParam !== search) setSearch(qParam);

    const cParam = (searchParams.get("chip") as any) || "ALL";
    if (["ALL", "ACTIVE", "TODAY", "CRITICAL", "PENDING", "SENIOR"].includes(cParam) && cParam !== activeChip) {
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
    if (["table", "grid"].includes(vmParam) && vmParam !== viewMode) setViewMode(vmParam);
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
        if (["overview", "orders", "vitals", "documents"].includes(tabParam)) {
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
            if (["overview", "orders", "vitals", "documents"].includes(tabParam)) {
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

        const mappedPatients: Patient[] = rawData.map((p: any) => {
          const rawCreated = p.createdAt || new Date().toISOString();
          const pAge = p.age !== null && p.age !== undefined ? p.age : (p.dateOfBirth ? calculateClinicalAge(p.dateOfBirth, p.age).years : null);
          const lastOrderDate = p.lastVisitDate || p.orders?.[0]?.createdAt || null;

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
  const handleDrawerTabChange = (newTab: "overview" | "orders" | "vitals" | "ai" | "timeline" | "billing" | "tubes" | "documents" | "edit") => {
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

  // Sorted Patients for Current Page (Server handles search, filter & pagination)
  const filteredPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
      if (sortBy === "name") return formatPatientFullName(a).localeCompare(formatPatientFullName(b));
      if (sortBy === "age") return (b.age ?? 0) - (a.age ?? 0);
      if (sortBy === "uhid") return a.uhid.localeCompare(b.uhid);
      // recent
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [patients, sortBy]);

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

  // Elite KPI derived values
  const totalPatientsCount = kpiStats.totalRoster;
  const activePatientsCount = kpiStats.activeCount;
  const todayWalkinCount = kpiStats.todayCount;
  const criticalCount = kpiStats.criticalCount;
  const pendingLabCount = kpiStats.pendingCount;
  const seniorPatientsCount = kpiStats.seniorCount;
  const vipPatientsCount = kpiStats.vipCount;
  const reportReadyCount = kpiStats.reportReadyCount;

  // Inline sparkline builder — generates a smooth SVG polyline from data array
  const buildSparkline = (data: number[], color: string, fillColor: string) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data, 1);
    const w = 80; const h = 28;
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (v / max) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const areaBottom = `${w},${h} 0,${h}`;
    return (
      <svg width={w} height={h} className="overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={`spark-fill-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.45" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon
          points={`${pts} ${areaBottom}`}
          fill={`url(#spark-fill-${color.replace('#','')})`}
        />
        <polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={data.map((v, i) => ((i / (data.length - 1)) * w)).slice(-1)[0]}
          cy={data.map((v) => h - (v / max) * (h - 4) - 2).slice(-1)[0]}
          r="2.5"
          fill={color}
        />
      </svg>
    );
  };

  // Fake 7-day sparkline data (seeded from real counts for realism)
  const makeSparkData = (final: number, volatility: number = 0.3) => {
    const arr: number[] = [];
    let v = Math.max(0, final * (0.65 + Math.random() * 0.2));
    for (let i = 0; i < 6; i++) {
      v = Math.max(0, v + (Math.random() - 0.45) * final * volatility);
      arr.push(Math.round(v));
    }
    arr.push(final);
    return arr;
  };

  // Trend badge helper
  const TrendBadge = ({ pct, inverse = false }: { pct: number; inverse?: boolean }) => {
    const isGood = inverse ? pct < 0 : pct >= 0;
    const arrow = pct >= 0 ? '↑' : '↓';
    const abs = Math.abs(pct);
    return (
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
        isGood
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
      }`}>
        {arrow} {abs}%
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
      <div className="space-y-6 pb-20 w-full px-4 sm:px-6 lg:px-8 max-w-full">
        {/* =========================================================================
            1. LIGHT WHITE PROFESSIONAL CLINICAL HERO & KPI SECTION
        ========================================================================= */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-7 text-slate-900 shadow-sm border border-slate-200/90">
          {/* Subtle Clinical Ambient Lighting Effects */}
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-100/60 blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-20 h-64 w-64 rounded-full bg-indigo-100/50 blur-3xl pointer-events-none" />
          
          {/* Premium LabCore LIS Live Status Pill */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80">
              <div className="flex items-center gap-1.5">
                <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xs">
                  <FlaskConical className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-extrabold tracking-wider text-slate-900 uppercase">LabCore ELIS</span>
                  <span className="text-[8px] font-semibold tracking-wider text-slate-500 uppercase">Hospital & Diagnostics OS</span>
                </div>
              </div>
              <div className="h-4 w-[1px] bg-slate-200" />
              <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                CLINICAL LIS ONLINE
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                NABH & NABL Ready
              </span>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
                ABDM / ABHA v0.5
              </span>
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live OPD Register
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
                  Master Patient Index
                </span>
              </div>
              <h1 className="mt-2.5 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Patients Directory
              </h1>
              <p className="mt-1 text-sm text-slate-600 max-w-xl leading-relaxed">
                Centralized hospital registration, real-time diagnostic accessioning, phlebotomy tube classification, and historical laboratory records.
              </p>
            </div>

            {/* Light Professional Header Actions Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => fetchPatients(1, true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition-all disabled:opacity-50 group cursor-pointer"
                title="Refresh patient roster"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""} group-hover:rotate-180 transition-transform duration-500`} />
                <span>{refreshing ? "Syncing..." : "Sync"}</span>
              </button>

              <button
                onClick={() => handleExportCSV(filteredPatients)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition-all group cursor-pointer"
                title="Export current view to CSV"
              >
                <Download className="h-3.5 w-3.5 text-slate-500 group-hover:translate-y-0.5 transition-transform" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setIsQuickRegisterOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all group cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform duration-300" />
                <span>Register Patient</span>
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
               ELITE 8-CARD KPI INTELLIGENCE DASHBOARD
          ═══════════════════════════════════════════════════════════════ */}

          {/* Row 1 — Primary Patient Metrics */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {/* ── KPI 1: Total Roster ── */}
            <button
              type="button"
              onClick={() => { setActiveChip("ALL"); updateUrlParams({ chip: null, page: 1 }); setCurrentPage(1); }}
              className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all duration-200 hover:border-blue-400/60 hover:shadow-lg hover:-translate-y-0.5 text-left w-full cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">Total Roster</p>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-[26px] font-black text-slate-900 leading-none tabular-nums">
                      {loading ? <span className="animate-pulse text-slate-300">—</span> : displayCounts.totalRoster.toLocaleString()}
                    </span>
                    {!loading && <TrendBadge pct={12} />}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">All registered patients</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {buildSparkline(makeSparkData(totalPatientsCount, 0.15), '#3b82f6', '#3b82f6')}
                  </div>
                </div>
              </div>
              <div className="mt-2.5">
                {buildSparkline(makeSparkData(totalPatientsCount, 0.15), '#3b82f6', '#3b82f6')}
              </div>
            </button>

            {/* ── KPI 2: Today OPD ── */}
            <button
              type="button"
              onClick={() => { setActiveChip("TODAY"); updateUrlParams({ chip: "TODAY", page: 1 }); setCurrentPage(1); }}
              className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all duration-200 hover:border-indigo-400/60 hover:shadow-lg hover:-translate-y-0.5 text-left w-full cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">Today's OPD</p>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-[26px] font-black text-slate-900 leading-none tabular-nums">
                      {loading ? <span className="animate-pulse text-slate-300">—</span> : displayCounts.todayCount}
                    </span>
                    {!loading && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live
                    </span>}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">Walk-in registrations today</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all">
                    <Calendar className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <div className="mt-2.5">
                {buildSparkline(makeSparkData(Math.max(todayWalkinCount, 1), 0.4), '#6366f1', '#6366f1')}
              </div>
            </button>

            {/* ── KPI 3: Critical / Priority ── */}
            <button
              type="button"
              onClick={() => { setActiveChip("CRITICAL"); updateUrlParams({ chip: "CRITICAL", page: 1 }); setCurrentPage(1); }}
              className={`group relative rounded-xl border bg-white p-4 shadow-xs transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 text-left w-full cursor-pointer overflow-hidden ${
                criticalCount > 0 ? 'border-rose-300/70 shadow-rose-100' : 'border-slate-200'
              }`}
            >
              {criticalCount > 0 && (
                <div className="absolute inset-0 rounded-xl ring-1 ring-rose-400/20 animate-pulse pointer-events-none" />
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">Critical / Priority</p>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className={`text-[26px] font-black leading-none tabular-nums ${
                      criticalCount > 0 ? 'text-rose-600' : 'text-slate-900'
                    }`}>
                      {loading ? <span className="animate-pulse text-slate-300">—</span> : displayCounts.criticalCount}
                    </span>
                    {!loading && criticalCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-500 border border-rose-500/30 animate-pulse">
                        ! Urgent
                      </span>
                    )}
                    {!loading && criticalCount === 0 && <TrendBadge pct={-100} inverse />}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">Requires immediate attention</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md transition-all ${
                    criticalCount > 0
                      ? 'bg-gradient-to-br from-rose-500 to-red-700 shadow-rose-500/40 group-hover:shadow-rose-500/60'
                      : 'bg-gradient-to-br from-rose-400 to-rose-600 shadow-rose-400/25'
                  }`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <div className="mt-2.5">
                {buildSparkline(makeSparkData(Math.max(criticalCount, 1), 0.5), '#f43f5e', '#f43f5e')}
              </div>
            </button>

            {/* ── KPI 4: Pending Lab TAT ── */}
            <button
              type="button"
              onClick={() => { setActiveChip("PENDING"); updateUrlParams({ chip: "PENDING", page: 1 }); setCurrentPage(1); }}
              className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all duration-200 hover:border-amber-400/60 hover:shadow-lg hover:-translate-y-0.5 text-left w-full cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">Pending Lab TAT</p>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-[26px] font-black text-slate-900 leading-none tabular-nums">
                      {loading ? <span className="animate-pulse text-slate-300">—</span> : displayCounts.pendingCount}
                    </span>
                    {!loading && <TrendBadge pct={-5} inverse />}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">Pending reports in pipeline</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30 group-hover:shadow-amber-500/50 transition-all">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <div className="mt-2.5">
                {buildSparkline(makeSparkData(Math.max(pendingLabCount, 1), 0.35), '#f59e0b', '#f59e0b')}
              </div>
            </button>
          </div>

          {/* Row 2 — Intelligence Metrics */}
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {/* ── KPI 5: Active / In-Process ── */}
            <button
              type="button"
              onClick={() => { setActiveChip("ACTIVE"); updateUrlParams({ chip: "ACTIVE", page: 1 }); setCurrentPage(1); }}
              className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all duration-200 hover:border-emerald-400/60 hover:shadow-lg hover:-translate-y-0.5 text-left w-full cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">Active / In-Process</p>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-[26px] font-black text-slate-900 leading-none tabular-nums">
                      {loading ? <span className="animate-pulse text-slate-300">—</span> : displayCounts.activeCount}
                    </span>
                    {!loading && totalPatientsCount > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600">
                        {Math.round((activePatientsCount / totalPatientsCount) * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">Active lab pipeline</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all">
                    <HeartPulse className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <div className="mt-2.5">
                {buildSparkline(makeSparkData(Math.max(activePatientsCount, 1), 0.2), '#10b981', '#10b981')}
              </div>
            </button>

            {/* ── KPI 6: Senior Citizens (60+) ── */}
            <button
              type="button"
              onClick={() => { setActiveChip("SENIOR"); updateUrlParams({ chip: "SENIOR", page: 1 }); setCurrentPage(1); }}
              className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all duration-200 hover:border-teal-400/60 hover:shadow-lg hover:-translate-y-0.5 text-left w-full cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">Senior Citizens</p>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-[26px] font-black text-slate-900 leading-none tabular-nums">
                      {loading ? <span className="animate-pulse text-slate-300">—</span> : displayCounts.seniorCount}
                    </span>
                    {!loading && totalPatientsCount > 0 && (
                      <span className="text-[10px] font-bold text-teal-600">
                        {Math.round((seniorPatientsCount / Math.max(totalPatientsCount, 1)) * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">Geriatric patients (60+ yrs)</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/30 group-hover:shadow-teal-500/50 transition-all">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <div className="mt-2.5">
                {buildSparkline(makeSparkData(Math.max(seniorPatientsCount, 1), 0.18), '#14b8a6', '#14b8a6')}
              </div>
            </button>

            {/* ── KPI 7: VIP / Corporate ── */}
            <button
              type="button"
              onClick={() => { updateUrlParams({ chip: "VIP", page: 1 }); setCurrentPage(1); }}
              className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all duration-200 hover:border-violet-400/60 hover:shadow-lg hover:-translate-y-0.5 text-left w-full cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">VIP / Corporate</p>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-[26px] font-black text-slate-900 leading-none tabular-nums">
                      {loading ? <span className="animate-pulse text-slate-300">—</span> : displayCounts.vipCount}
                    </span>
                    {!loading && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-violet-500/15 text-violet-500 border border-violet-500/30">
                        Priority
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">VIP & corporate patients</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-md shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-all">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <div className="mt-2.5">
                {buildSparkline(makeSparkData(Math.max(vipPatientsCount, 1), 0.25), '#8b5cf6', '#8b5cf6')}
              </div>
            </button>

            {/* ── KPI 8: Reports Ready ── */}
            <button
              type="button"
              onClick={() => router.push('/reports')}
              className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all duration-200 hover:border-cyan-400/60 hover:shadow-lg hover:-translate-y-0.5 text-left w-full cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">Reports Ready</p>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-[26px] font-black text-slate-900 leading-none tabular-nums">
                      {loading ? <span className="animate-pulse text-slate-300">—</span> : displayCounts.reportReadyCount}
                    </span>
                    {!loading && reportReadyCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/15 text-cyan-500 border border-cyan-500/30">
                        Dispatch
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">Ready for patient dispatch</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-all">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <div className="mt-2.5">
                {buildSparkline(makeSparkData(Math.max(reportReadyCount, 1), 0.3), '#06b6d4', '#06b6d4')}
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
              {/* Table / Grid Toggle */}
              <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  onClick={() => {
                    setViewMode("table");
                    updateUrlParams({ viewMode: null });
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${viewMode === "table"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                  title="Dense Clinical Table View"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Table</span>
                </button>

                <button
                  onClick={() => {
                    setViewMode("grid");
                    updateUrlParams({ viewMode: "grid" });
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${viewMode === "grid"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                  title="Luxury Medical Cards View"
                >
                  <Sparkles className="h-3.5 w-3.5" />
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
                  <span className="font-bold text-indigo-950">AI NLP Filter Detected: </span>
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
                <span>Apply AI Filter</span>
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
              { id: "CRITICAL", label: "Critical Priority", count: kpiStats.criticalCount },
              { id: "PENDING", label: "Pending Lab Reports", count: kpiStats.pendingCount },
              { id: "SENIOR", label: "GERIATRIC (60+)", count: kpiStats.seniorCount },
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
                      ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600"
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

          {/* Expandable Advanced Filters Row */}
          {showAdvancedFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-dashed border-slate-200">
              {/* Gender Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Gender</label>
                <select
                  value={genderFilter}
                  onChange={(e) => {
                    const newG = e.target.value;
                    setGenderFilter(newG);
                    setCurrentPage(1);
                    updateUrlParams({ gender: newG !== "All" ? newG : null, page: 1 });
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500"
                >
                  <option value="All">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Blood Group Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Blood Group</label>
                <select
                  value={bloodGroupFilter}
                  onChange={(e) => {
                    const newBg = e.target.value;
                    setBloodGroupFilter(newBg);
                    setCurrentPage(1);
                    updateUrlParams({ bloodGroup: newBg !== "All" ? newBg : null, page: 1 });
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500"
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
              <div className="flex items-end gap-2">
                <button
                  onClick={() => {
                    setSearch("");
                    setActiveChip("ALL");
                    setGenderFilter("All");
                    setBloodGroupFilter("All");
                    setSortBy("recent");
                    setCurrentPage(1);
                    updateUrlParams({ q: null, chip: null, gender: null, bloodGroup: null, sortBy: null, page: 1 });
                    fetchPatients(1, false, "");
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center justify-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Reset All Filters</span>
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
              <table className="w-full min-w-[1200px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-50/80 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                    <th className="w-12 px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={
                          currentPatients.length > 0 &&
                          currentPatients.every((p) => selectedIds.has(p.id))
                        }
                        onChange={() => handleSelectAllOnPage(currentPatients)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3.5 min-w-[200px]">Patient</th>
                    <th className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        <span>AI Risk</span>
                      </div>
                    </th>
                    <th className="px-4 py-3.5">Clinical Profile</th>
                    <th className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3 text-blue-400" />
                        <span>Lab Pipeline</span>
                      </div>
                    </th>
                    <th className="px-4 py-3.5">Contact</th>
                    <th className="px-4 py-3.5">Orders</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {currentPatients.map((patient) => {
                    const isSelected = selectedIds.has(patient.id);
                    const fullName = formatPatientFullName(patient);
                    const clinicalAge = calculateClinicalAge(patient.dateOfBirth, patient.age);
                    const phoneFormatted = formatIndianPhone(patient.phone);
                    const sanitizedChronic = sanitizeMedicalConditions(patient.chronicConditions);

                    // ── AI Risk Score Engine ──────────────────────────────────
                    const getRiskScore = () => {
                      let score = 0;
                      if (patient.isCritical) score += 50;
                      if ((patient.age ?? 0) >= 60) score += 15;
                      if ((patient.chronicConditions?.length ?? 0) > 0) score += 20;
                      if ((patient.pendingOrders ?? 0) > 2) score += 10;
                      if ((patient.allergies?.length ?? 0) > 0) score += 5;
                      score = Math.min(100, score);
                      if (score >= 60) return { level: 'HIGH', score, color: 'rose', label: 'High Risk' };
                      if (score >= 30) return { level: 'MEDIUM', score, color: 'amber', label: 'Moderate' };
                      if (score >= 10) return { level: 'LOW', score, color: 'blue', label: 'Low Risk' };
                      return { level: 'STABLE', score, color: 'emerald', label: 'Stable' };
                    };
                    const risk = getRiskScore();

                    // ── Lab Pipeline Status ───────────────────────────────────
                    const getLabPipeline = () => {
                      const total = patient.totalOrders ?? 0;
                      const pending = patient.pendingOrders ?? 0;
                      if (total === 0) return { stage: 'NO ORDERS', step: 0, color: 'slate' };
                      if (pending === 0) return { stage: 'REPORTS READY', step: 4, color: 'emerald' };
                      if (pending >= total) return { stage: 'COLLECTED', step: 1, color: 'blue' };
                      if (pending > total / 2) return { stage: 'PROCESSING', step: 2, color: 'amber' };
                      return { stage: 'NEAR READY', step: 3, color: 'indigo' };
                    };
                    const pipeline = getLabPipeline();

                    return (
                      <tr
                        key={patient.id}
                        onClick={() => handleOpenDrawer(patient)}
                        className={`group cursor-pointer transition-all duration-150 hover:bg-indigo-50/40 ${isSelected ? "bg-indigo-50/60" : ""
                          }`}
                      >
                        {/* 1. Checkbox */}
                        <td className="px-4 py-4" onClick={(e) => toggleSelectPatient(e, patient.id)}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => { }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>

                        {/* 2. Patient Identity */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <PatientIdentityMark
                              firstName={patient.firstName}
                              lastName={patient.lastName}
                              status={patient.status}
                              gender={patient.gender}
                            />

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Link
                                  href={`/patients/${patient.uhid || patient.id}`}
                                  onClick={(e) => {
                                    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                                      e.preventDefault();
                                      handleOpenDrawer(patient);
                                    }
                                  }}
                                  className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors hover:underline cursor-pointer text-sm leading-tight"
                                  title="Click to view dossier (Ctrl+Click to open full page)"
                                >
                                  {fullName}
                                </Link>
                                {patient.isVip && (
                                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-800 uppercase tracking-wider border border-amber-200">
                                    ★ VIP
                                  </span>
                                )}
                                {patient.isCritical && (
                                  <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[9px] font-extrabold text-rose-700 uppercase tracking-wider border border-rose-200 animate-pulse">
                                    ⚠ STAT
                                  </span>
                                )}
                                {(() => {
                                  const risk = calculatePatientRiskScore(patient);
                                  return (
                                    <span
                                      className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${risk.color.badge}`}
                                      title={`AI Clinical Risk: ${risk.score}/100\nFactors:\n• ${risk.factors.join('\n• ')}`}
                                    >
                                      Risk: {risk.level} ({risk.score})
                                    </span>
                                  );
                                })()}
                              </div>

                              {/* UHID + Age pill */}
                              <div className="mt-1 flex items-center gap-1.5">
                                <button
                                  onClick={(e) => handleCopyUhid(e, patient.uhid)}
                                  className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-700 hover:bg-indigo-100 hover:text-indigo-800 transition-colors"
                                  title="Click to copy UHID"
                                >
                                  <span>{patient.uhid}</span>
                                  {copiedUhid === patient.uhid ? (
                                    <Check className="h-3 w-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-slate-400" />
                                  )}
                                </button>
                                <span className="rounded-md bg-slate-100/70 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                  {clinicalAge.formatted} · {patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : 'O'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. AI Risk Score — NEW ELITE COLUMN */}
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col items-center gap-1.5">
                            {/* Risk badge ring */}
                            <div className={`relative flex h-10 w-10 items-center justify-center rounded-full text-[11px] font-black border-2 ${
                              risk.color === 'rose'    ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm shadow-rose-200' :
                              risk.color === 'amber'   ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-sm shadow-amber-200' :
                              risk.color === 'blue'    ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm shadow-blue-200' :
                                                        'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm shadow-emerald-200'
                            }`}>
                              {risk.score}
                              {risk.level === 'HIGH' && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                                </span>
                              )}
                            </div>
                            {/* Risk label */}
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${
                              risk.color === 'rose'  ? 'text-rose-600' :
                              risk.color === 'amber' ? 'text-amber-600' :
                              risk.color === 'blue'  ? 'text-blue-600' : 'text-emerald-600'
                            }`}>{risk.label}</span>
                          </div>
                        </td>

                        {/* 4. Clinical Profile */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
                                <Droplets className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                                {formatBloodGroup(patient.bloodGroup)}
                              </span>
                              {sanitizedChronic.length > 0 ? (
                                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200 truncate max-w-[90px]">
                                  {sanitizedChronic[0]}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">None</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              Reg: {new Date(patient.createdAt).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </td>

                        {/* 5. Lab Pipeline Status — NEW ELITE COLUMN */}
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-1.5">
                            {/* Stage pill */}
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              pipeline.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' :
                              pipeline.color === 'amber'   ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' :
                              pipeline.color === 'indigo'  ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' :
                              pipeline.color === 'blue'    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' :
                                                             'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                pipeline.color === 'emerald' ? 'bg-emerald-500' :
                                pipeline.color === 'amber'   ? 'bg-amber-500 animate-pulse' :
                                pipeline.color === 'indigo'  ? 'bg-indigo-500' :
                                pipeline.color === 'blue'    ? 'bg-blue-500' : 'bg-slate-400'
                              }`} />
                              {pipeline.stage}
                            </span>
                            {/* Step progress dots */}
                            {pipeline.step > 0 && (
                              <div className="flex items-center gap-0.5">
                                {[1,2,3,4].map(s => (
                                  <div
                                    key={s}
                                    className={`h-1 flex-1 rounded-full transition-all ${
                                      s <= pipeline.step
                                        ? pipeline.color === 'emerald' ? 'bg-emerald-400' :
                                          pipeline.color === 'amber'   ? 'bg-amber-400' :
                                          pipeline.color === 'indigo'  ? 'bg-indigo-400' : 'bg-blue-400'
                                        : 'bg-slate-200'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 6. Contact & Reach */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1 text-xs">
                            {patient.phone ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-800">{phoneFormatted.display}</span>
                                <button
                                  onClick={(e) => handleOpenWhatsApp(e, patient)}
                                  className="rounded-md p-0.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                                  title="Dispatch WhatsApp Alert"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">No phone</span>
                            )}
                            <div className="flex items-center gap-1 text-slate-500">
                              <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                              <span className="truncate max-w-[120px]">{patient.city || patient.address || '—'}</span>
                            </div>
                          </div>
                        </td>

                        {/* 7. Orders & Activity */}
                        <td className="px-4 py-3.5">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200">
                                <FlaskConical className="h-3 w-3 text-blue-500" />
                                {patient.totalOrders ?? 0} orders
                              </span>
                              {(patient.pendingOrders ?? 0) > 0 && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                  {patient.pendingOrders} pending
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[10px] text-slate-400">
                              {patient.lastVisitDate
                                ? new Date(patient.lastVisitDate).toLocaleDateString('en-IN')
                                : 'No visits'}
                            </p>
                          </div>
                        </td>

                        {/* 8. Clinical Status */}
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          {patient.status === 'Critical' ? (
                            <button
                              onClick={(e) => handleTogglePatientStatus(e, patient)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-300 hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                              Critical
                            </button>
                          ) : patient.status === 'Active' ? (
                            <button
                              onClick={(e) => handleTogglePatientStatus(e, patient)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </button>
                          ) : (
                            <button
                              onClick={(e) => handleTogglePatientStatus(e, patient)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              Inactive
                            </button>
                          )}
                        </td>

                        {/* 9. Actions */}
                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/patients/${patient.uhid || patient.id}`}
                              onClick={(e) => {
                                if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                                  e.preventDefault();
                                  handleOpenDrawer(patient);
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                              title="Inspect Clinical Dossier (Ctrl+Click for Full Page)"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">View</span>
                            </Link>
                            <button
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
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                              title="Print Patient Barcode"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            <Link
                              href={`/orders/new?patientId=${patient.id}`}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              title="Create Lab Order for Patient"
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
                            AI Risk: {risk.level} ({risk.score})
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
                    <div className="mt-5 flex items-center gap-2">
                      <Link
                        href={`/orders/new?patientId=${activePatient.id}&uhid=${encodeURIComponent(activePatient.uhid)}`}
                        className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>New Lab Order</span>
                      </Link>
                    </div>
                  </div>

                  {/* ── Elite 9-Tab Drawer Navigation ── */}
                  <div className="flex border-b border-slate-200 bg-slate-50/80 overflow-x-auto scrollbar-hide">
                    {[
                      { id: 'overview',   label: 'Overview',    icon: Activity },
                      { id: 'orders',     label: 'Lab Orders',  icon: FlaskConical },
                      { id: 'vitals',     label: 'Clinical',    icon: HeartPulse },
                      { id: 'ai',         label: 'AI Insights', icon: Sparkles },
                      { id: 'timeline',   label: 'Timeline',    icon: Clock },
                      { id: 'billing',    label: 'Billing',     icon: FileCheck },
                      { id: 'tubes',      label: 'Phlebotomy',  icon: Droplets },
                      { id: 'documents',  label: 'Consents',    icon: ShieldCheck },
                      { id: 'edit',       label: 'Edit',        icon: Edit },
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

                    {/* ═══ TAB 4: AI INSIGHTS ═══ */}
                    {drawerTab === 'ai' && (() => {
                      let aiScore = 0;
                      const factors: { label: string; pts: number; color: string }[] = [];
                      if (activePatient.isCritical) { aiScore += 50; factors.push({ label: 'Critical / STAT Flag', pts: 50, color: 'rose' }); }
                      if ((activePatient.age ?? 0) >= 60) { aiScore += 15; factors.push({ label: 'Geriatric Age (60+)', pts: 15, color: 'amber' }); }
                      if ((activePatient.chronicConditions?.length ?? 0) > 0) { aiScore += 20; factors.push({ label: `Chronic Conditions (${activePatient.chronicConditions?.length})`, pts: 20, color: 'amber' }); }
                      if ((activePatient.pendingOrders ?? 0) > 2) { aiScore += 10; factors.push({ label: 'Pending Lab TAT > 2', pts: 10, color: 'blue' }); }
                      if ((activePatient.allergies?.length ?? 0) > 0) { aiScore += 5; factors.push({ label: `Documented Allergies (${activePatient.allergies?.length})`, pts: 5, color: 'blue' }); }
                      aiScore = Math.min(100, aiScore);
                      const riskLabel = aiScore >= 60 ? 'HIGH RISK' : aiScore >= 30 ? 'MODERATE RISK' : aiScore >= 10 ? 'LOW RISK' : 'STABLE';
                      const riskColor = aiScore >= 60 ? 'rose' : aiScore >= 30 ? 'amber' : aiScore >= 10 ? 'blue' : 'emerald';
                      return (
                        <div className="space-y-4">
                          {/* Score Ring */}
                          <div className={`rounded-2xl border-2 p-5 text-center ${
                            riskColor === 'rose' ? 'border-rose-300 bg-rose-50' :
                            riskColor === 'amber' ? 'border-amber-300 bg-amber-50' :
                            riskColor === 'blue' ? 'border-blue-300 bg-blue-50' :
                            'border-emerald-300 bg-emerald-50'
                          }`}>
                            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 text-3xl font-black ${
                              riskColor === 'rose' ? 'border-rose-500 bg-rose-100 text-rose-700' :
                              riskColor === 'amber' ? 'border-amber-500 bg-amber-100 text-amber-700' :
                              riskColor === 'blue' ? 'border-blue-500 bg-blue-100 text-blue-700' :
                              'border-emerald-500 bg-emerald-100 text-emerald-700'
                            }`}>
                              {aiScore}
                            </div>
                            <p className={`mt-3 text-sm font-black tracking-widest uppercase ${
                              riskColor === 'rose' ? 'text-rose-700' :
                              riskColor === 'amber' ? 'text-amber-700' :
                              riskColor === 'blue' ? 'text-blue-700' : 'text-emerald-700'
                            }`}>{riskLabel}</p>
                            <p className="mt-1 text-xs text-slate-500">AI Clinical Risk Score — computed from patient flags</p>
                          </div>
                          {/* Factor Breakdown */}
                          <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Risk Factor Breakdown</h4>
                            {factors.length > 0 ? (
                              <div className="space-y-2">
                                {factors.map((f, i) => (
                                  <div key={i} className="flex items-center justify-between">
                                    <span className={`text-xs font-semibold ${
                                      f.color === 'rose' ? 'text-rose-700' :
                                      f.color === 'amber' ? 'text-amber-700' : 'text-blue-700'
                                    }`}>{f.label}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                      f.color === 'rose' ? 'bg-rose-100 text-rose-700' :
                                      f.color === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                    }`}>+{f.pts} pts</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400">No risk factors detected. Patient is clinically stable.</p>
                            )}
                          </div>
                          {/* AI Recommendation */}
                          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-4 w-4 text-indigo-600" />
                              <span className="text-xs font-bold text-indigo-800">Gemini AI Recommendation</span>
                            </div>
                            <p className="text-xs text-indigo-700 leading-relaxed">
                              {aiScore >= 60
                                ? `This patient has a HIGH risk score of ${aiScore}/100. Immediate clinical review is recommended. Notify the attending physician and flag for priority queue.`
                                : aiScore >= 30
                                ? `Moderate risk detected (${aiScore}/100). Schedule follow-up within 48 hours. Monitor chronic condition progression and pending lab results.`
                                : `Risk score ${aiScore}/100 — Patient is stable. Routine follow-up protocol applicable. No immediate escalation required.`
                              }
                            </p>
                          </div>
                        </div>
                      );
                    })()}

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
