"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/dashboardlayout";
import DoctorTable, { Doctor } from "@/components/doctors/DoctorTable";
import DoctorQuickViewModal, { DoctorProfileData } from "@/components/doctors/DoctorQuickViewModal";
import DoctorCommissionPayoutModal from "@/components/doctors/DoctorCommissionPayoutModal";
import DoctorRequisitionSlipModal from "@/components/doctors/DoctorRequisitionSlipModal";
import DoctorIdBadgeModal from "@/components/doctors/DoctorIdBadgeModal";
import DoctorSamplePickupModal from "@/components/doctors/DoctorSamplePickupModal";
import DoctorTariffSheetModal from "@/components/doctors/DoctorTariffSheetModal";
import DoctorAnalyticsModal from "@/components/doctors/DoctorAnalyticsModal";
import RegisterDoctorWizard from "@/components/doctors/RegisterDoctorWizard";
import DoctorNavigationHeader, { DoctorModuleTab } from "@/components/doctors/DoctorNavigationHeader";
import DoctorOpdQueueView from "@/components/doctors/DoctorOpdQueueView";
import DoctorIpdRoundsView from "@/components/doctors/DoctorIpdRoundsView";
import DoctorPrescriptionCpoeView from "@/components/doctors/DoctorPrescriptionCpoeView";
import DoctorVerificationView from "@/components/doctors/DoctorVerificationView";
import DoctorEmrTrendsView from "@/components/doctors/DoctorEmrTrendsView";
import DoctorReferralLedgerView from "@/components/doctors/DoctorReferralLedgerView";
import DoctorDutyRosterView from "@/components/doctors/DoctorDutyRosterView";
import DoctorPracticeAnalyticsView from "@/components/doctors/DoctorPracticeAnalyticsView";
import PrescriptionBuilderModal, { PrescriptionData } from "@/components/doctors/PrescriptionBuilderModal";

import { doctorApi } from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { showSuccess, showError } from "@/lib/notifications";
import { useAuth } from "@/hooks/useAuth";
import {
  User,
  Users,
  Award,
  DollarSign,
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Building,
  ShieldCheck,
  CheckCircle,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Bike,
  FileBadge,
  BarChart3,
  FileSpreadsheet,
} from "lucide-react";

export function DoctorsPageContent({ initialTab }: { initialTab?: DoctorModuleTab }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasAnyRole } = useAuth();
  
  // Role permissions
  const canAddDoctor = hasAnyRole(["ADMIN", "SUPER_ADMIN", "FRONT_DESK"]);
  const canEditDoctor = hasAnyRole(["ADMIN", "SUPER_ADMIN", "FRONT_DESK"]);
  const canDeleteDoctor = hasAnyRole(["ADMIN", "SUPER_ADMIN"]);
  const canPayoutDoctor = hasAnyRole(["ADMIN", "SUPER_ADMIN", "FRONT_DESK"]);

  // Active Main Sub-Module Tab
  const urlTab = (searchParams?.get("tab") as DoctorModuleTab) || initialTab || "directory";
  const [activeTab, setActiveTab] = useState<DoctorModuleTab>(urlTab);

  useEffect(() => {
    const tabParam = (searchParams?.get("tab") as DoctorModuleTab) || initialTab || "directory";
    setActiveTab((prev) => (prev !== tabParam ? tabParam : prev));
  }, [searchParams, initialTab]);

  const handleTabChange = (newTab: DoctorModuleTab) => {
    setActiveTab(newTab);
    if (newTab === "directory") {
      router.push("/doctors");
    } else {
      router.push(`/doctors?tab=${newTab}`);
    }
  };

  // Doctors directory state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Directory sub-filter tabs & Search
  const [directoryFilterTab, setDirectoryFilterTab] = useState<"all" | "referring" | "pathologists" | "partners" | "pending_payouts">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterSpecialization, setFilterSpecialization] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modals state
  const [selectedDoctorForView, setSelectedDoctorForView] = useState<DoctorProfileData | null>(null);
  const [selectedDoctorForPayout, setSelectedDoctorForPayout] = useState<DoctorProfileData | null>(null);
  const [selectedDoctorForRequisition, setSelectedDoctorForRequisition] = useState<DoctorProfileData | null>(null);
  const [requisitionAutoOpenModal, setRequisitionAutoOpenModal] = useState<"whatsapp" | "email" | undefined>(undefined);
  const [selectedDoctorForPickup, setSelectedDoctorForPickup] = useState<DoctorProfileData | null>(null);
  const [selectedDoctorForBadge, setSelectedDoctorForBadge] = useState<DoctorProfileData | null>(null);
  const [selectedDoctorForTariff, setSelectedDoctorForTariff] = useState<DoctorProfileData | null>(null);
  const [selectedDoctorForAnalytics, setSelectedDoctorForAnalytics] = useState<DoctorProfileData | null>(null);
  const [doctorToEdit, setDoctorToEdit] = useState<DoctorProfileData | null>(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);

  // New Prescription Modal State
  const [isRxBuilderOpen, setIsRxBuilderOpen] = useState(false);
  const [prefillPatientForRx, setPrefillPatientForRx] = useState<any>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, any> = {
        page,
        limit,
      };

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (filterSpecialization) params.specialization = filterSpecialization;
      if (filterStatus) params.isActive = filterStatus === "active" ? "true" : "false";

      if (directoryFilterTab === "referring") {
        params.doctorType = "REFERRING_DOCTOR";
      } else if (directoryFilterTab === "pathologists") {
        params.doctorType = "PATHOLOGIST";
      } else if (directoryFilterTab === "partners") {
        params.typeGroup = "partners";
      }

      const response = await doctorApi.getAll(params);

      if (response && response.success !== false) {
        const docs = response.data?.doctors || response.data || [];
        const pagination = response.data?.pagination || response.pagination;

        setDoctors(docs);
        if (pagination) {
          setTotalCount(pagination.total || docs.length);
          setTotalPages(pagination.totalPages || 1);
        } else {
          setTotalCount(docs.length);
          setTotalPages(1);
        }
      } else {
        setError(response?.message || "Failed to fetch doctors from server");
        setDoctors([]);
      }
    } catch (err: any) {
      console.error("Error fetching doctors:", err);
      setError(err?.message || "Network error while connecting to server");
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filterSpecialization, filterStatus, directoryFilterTab]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Filtering & Sorting Logic
  const getFilteredDoctors = () => {
    let list = [...doctors];

    if (directoryFilterTab === "pending_payouts") {
      list = list.filter(
        (d) =>
          d.doctorType !== "IN_HOUSE_PATHOLOGIST" &&
          d.doctorType !== "INTERNAL_PATHOLOGIST" &&
          d.doctorType !== "CONSULTANT_PATHOLOGIST" &&
          (((d as any).pendingPayout || 0) > 0 || (Number(d.commissionRate) || 0) > 0)
      );
    }

    list.sort((a, b) => {
      let comp = 0;
      switch (sortBy) {
        case "name":
          const nameA = (a.fullName || a.name || "").toLowerCase();
          const nameB = (b.fullName || b.name || "").toLowerCase();
          comp = nameA.localeCompare(nameB);
          break;
        case "specialization":
          comp = (a.specialization || "").localeCompare(b.specialization || "");
          break;
        case "doctorCode":
          comp = (a.doctorCode || "").localeCompare(b.doctorCode || "");
          break;
        case "referrals":
          const refA = a._count?.orders || a._count?.patients || 0;
          const refB = b._count?.orders || b._count?.patients || 0;
          comp = refB - refA;
          break;
        default:
          comp = 0;
      }
      return sortOrder === "asc" ? comp : -comp;
    });

    return list;
  };

  const filteredDoctors = getFilteredDoctors();

  // Dynamic Real Financial & Clinical KPIs
  const totalDoctors = totalCount || doctors.length;
  const activeDoctors = doctors.filter((d) => d.isActive !== false).length;
  const referringCount = doctors.filter(
    (d) =>
      d.doctorType === "REFERRING_DOCTOR" ||
      (!d.doctorType && !(d.specialization || "").toLowerCase().includes("pathol"))
  ).length;
  const pathologistCount = doctors.filter(
    (d) =>
      d.doctorType === "IN_HOUSE_PATHOLOGIST" ||
      d.doctorType === "INTERNAL_PATHOLOGIST" ||
      d.doctorType === "CONSULTANT_PATHOLOGIST" ||
      (d.specialization || "").toLowerCase().includes("pathol")
  ).length;
  const partnersCount = doctors.filter(
    (d) =>
      d.doctorType === "HOSPITAL_PARTNER" ||
      d.doctorType === "CLINIC_PARTNER" ||
      Boolean((d as any).organizationId)
  ).length;

  const totalReferrals = doctors.reduce(
    (acc, d) => acc + (d._count?.orders || d._count?.patients || 0),
    0
  );
  const monthlyReferrals = doctors.reduce(
    (acc, d) => acc + ((d as any).monthlyOrders || 0),
    0
  );
  const totalReferralRevenue = doctors.reduce(
    (acc, d) => acc + ((d as any).totalRevenue || 0),
    0
  );
  const totalPendingPayout = doctors.reduce(
    (acc, d) => acc + ((d as any).pendingPayout || 0),
    0
  );

  const specializationsList = Array.from(
    new Set(doctors.map((d) => d.specialization).filter(Boolean))
  ).sort();

  const handleDeleteDoctor = async (doctor: Doctor) => {
    const name = doctor.fullName || doctor.name || "this doctor";
    if (!confirm(`Are you sure you want to remove ${name} from your doctor directory?`)) {
      return;
    }

    try {
      const res = await doctorApi.delete(String(doctor.id));
      if (res && res.success === false) {
        showError(res.message || res.error || `Failed to remove Doctor ${name}`);
        return;
      }
      showSuccess(`Doctor ${name} removed successfully`);
      fetchDoctors();
    } catch (err: any) {
      console.error("Error deleting doctor:", err);
      showError(err?.message || err?.error || `Failed to remove Doctor ${name}`);
    }
  };

  const handleExportCSV = () => {
    if (filteredDoctors.length === 0) {
      showError("No doctor data to export");
      return;
    }

    const headers = [
      "Doctor Code",
      "Full Name",
      "Type",
      "Specialization",
      "Qualifications",
      "MCI/NMC Reg No",
      "Phone",
      "Email",
      "Clinic Name",
      "Commission Rate %",
      "Status",
    ];

    const rows = filteredDoctors.map((d) => [
      d.doctorCode || "",
      `"${d.fullName || d.name || ""}"`,
      d.doctorType || "REFERRING_DOCTOR",
      `"${d.specialization || ""}"`,
      `"${d.qualification || ""}"`,
      `"${d.registrationNumber || d.licenseNumber || ""}"`,
      `"${d.phone || ""}"`,
      `"${d.email || ""}"`,
      `"${d.clinicName || ""}"`,
      d.commissionRate || 0,
      d.isActive !== false ? "Active" : "Inactive",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `doctors_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showSuccess("Doctors Directory CSV exported successfully");
  };

  const handleOpenNewRxWithPatient = (patient?: any) => {
    setPrefillPatientForRx(patient || null);
    setIsRxBuilderOpen(true);
  };

  const handlePrescriptionCreated = (rx: PrescriptionData) => {
    showSuccess(`Prescription ${rx.prescriptionNumber} registered in clinical EMR.`);
  };

  return (
    <ProtectedRoute requiredRoles={["ADMIN", "FRONT_DESK", "LAB_TECH", "PATHOLOGIST", "DOCTOR"]}>
      <DashboardLayout title="Doctor Module & Clinical Operations">
        <div className="space-y-5">
          
          {/* ── Enterprise Doctor Module Navigation Header (Ultra Light White Theme) ── */}
          <DoctorNavigationHeader
            activeTab={activeTab}
            onTabChange={handleTabChange}
            kpis={{
              totalDoctors,
              activeDoctors,
              opdQueueCount: 3,
              ipdCount: 4,
              pendingVerifications: 3,
              criticalPanics: 2,
              monthlyRevenue: totalReferralRevenue,
              pendingPayouts: totalPendingPayout,
            }}
            onOpenSamplePickup={() => {
              const firstDoc = (filteredDoctors[0] as DoctorProfileData) || null;
              setSelectedDoctorForPickup(firstDoc);
            }}
            onOpenTariffSheet={() => {
              const firstDoc = (filteredDoctors[0] as DoctorProfileData) || null;
              setSelectedDoctorForTariff(firstDoc);
            }}
            onOpenNewRx={() => handleOpenNewRxWithPatient(null)}
            onAddNewDoctor={() => {
              setDoctorToEdit(null);
              setShowAddEditModal(true);
            }}
            onExportCSV={handleExportCSV}
            canAddDoctor={canAddDoctor}
          />

          {/* ── Error Communication Notice ── */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex items-center gap-3 text-xs font-semibold">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold">Database Communication Notice</p>
                <p className="text-red-700">{error}</p>
              </div>
              <button
                type="button"
                onClick={fetchDoctors}
                className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          )}

          {/* ── VIEW 1: DOCTOR DIRECTORY & CREDENTIALING ── */}
          {activeTab === "directory" && (
            <div className="space-y-4">
              
              {/* Business & Clinical KPI Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* KPI 1: Total Doctors */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                      {activeDoctors} Active
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{totalDoctors}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                    <span>Referring: <strong>{referringCount}</strong></span>
                    <span>Pathologists: <strong>{pathologistCount}</strong></span>
                  </div>
                </div>

                {/* KPI 2: Monthly Patient Referrals */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      This Month
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{monthlyReferrals}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Patients referred this month (Total: {totalReferrals})</p>
                </div>

                {/* KPI 3: Referral Business Revenue */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                      Paid Revenue
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-900">₹{totalReferralRevenue.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Actual billing from referred patients</p>
                </div>

                {/* KPI 4: Pending Commission Payouts */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setDirectoryFilterTab("pending_payouts")}
                      className="text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-full transition-colors"
                    >
                      View Payouts
                    </button>
                  </div>
                  <p className="text-2xl font-black text-amber-900">₹{totalPendingPayout.toLocaleString()}</p>
                  <p className="text-xs text-amber-700 font-medium mt-1">Unsettled referral incentives</p>
                </div>

              </div>

              {/* Interactive Category Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => { setDirectoryFilterTab("all"); setPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    directoryFilterTab === "all"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  All Practitioners ({totalDoctors})
                </button>

                <button
                  type="button"
                  onClick={() => { setDirectoryFilterTab("referring"); setPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    directoryFilterTab === "referring"
                      ? "bg-sky-600 text-white shadow-2xs"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Referring Physicians ({referringCount})
                </button>

                <button
                  type="button"
                  onClick={() => { setDirectoryFilterTab("pathologists"); setPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    directoryFilterTab === "pathologists"
                      ? "bg-teal-600 text-white shadow-2xs"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  In-House Pathologists ({pathologistCount})
                </button>

                <button
                  type="button"
                  onClick={() => { setDirectoryFilterTab("partners"); setPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    directoryFilterTab === "partners"
                      ? "bg-sky-700 text-white shadow-2xs"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  Hospital / Clinic Partners ({partnersCount})
                </button>

                <button
                  type="button"
                  onClick={() => { setDirectoryFilterTab("pending_payouts"); setPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    directoryFilterTab === "pending_payouts"
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Pending Payouts (₹{totalPendingPayout.toLocaleString()})
                </button>
              </div>

              {/* Search, Specialization & Multi-Criteria Filter Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search doctor across entire database by name, clinic, specialization, phone, code or MCI reg..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs font-medium placeholder-slate-400 focus:border-sky-600 focus:outline-none bg-white"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Filters & Sorters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={filterSpecialization}
                      onChange={(e) => { setFilterSpecialization(e.target.value); setPage(1); }}
                      className="rounded-xl border border-slate-200 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-sky-600 focus:outline-none bg-white"
                    >
                      <option value="">All Specializations</option>
                      {specializationsList.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filterStatus}
                      onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                      className="rounded-xl border border-slate-200 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-sky-600 focus:outline-none bg-white"
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>

                    <select
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(e) => {
                        const [field, order] = e.target.value.split("-");
                        setSortBy(field);
                        setSortOrder(order as "asc" | "desc");
                      }}
                      className="rounded-xl border border-slate-200 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-sky-600 focus:outline-none bg-white"
                    >
                      <option value="name-asc">Name (A-Z)</option>
                      <option value="name-desc">Name (Z-A)</option>
                      <option value="referrals-desc">Highest Referrals</option>
                      <option value="specialization-asc">Specialization</option>
                      <option value="doctorCode-asc">Doctor Code</option>
                    </select>

                    {(searchTerm || filterSpecialization || filterStatus) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm("");
                          setFilterSpecialization("");
                          setFilterStatus("");
                          setPage(1);
                        }}
                        className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Results Summary Bar */}
              <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                <span>
                  Showing <strong className="text-slate-900">{filteredDoctors.length}</strong> doctors on Page {page} of {totalPages} (Total: {totalCount})
                </span>
                <span className="text-[11px] text-slate-400">
                  Real server-side database pagination & search active
                </span>
              </div>

              {/* Clinical Doctor Directory Table */}
              <DoctorTable
                doctors={filteredDoctors}
                loading={loading}
                canEdit={canEditDoctor}
                canDelete={canDeleteDoctor}
                canPayout={canPayoutDoctor}
                onDelete={handleDeleteDoctor}
                onQuickView={(doc) => setSelectedDoctorForView(doc as DoctorProfileData)}
                onPayout={(doc) => setSelectedDoctorForPayout(doc as DoctorProfileData)}
                onRequisitionSlip={(doc) => {
                  setSelectedDoctorForRequisition(doc as DoctorProfileData);
                  setRequisitionAutoOpenModal(undefined);
                }}
                onWhatsAppDoctor={(doc) => {
                  setSelectedDoctorForRequisition(doc as DoctorProfileData);
                  setRequisitionAutoOpenModal("whatsapp");
                }}
                onEmailDoctor={(doc) => {
                  setSelectedDoctorForRequisition(doc as DoctorProfileData);
                  setRequisitionAutoOpenModal("email");
                }}
                onSamplePickup={(doc) => setSelectedDoctorForPickup(doc as DoctorProfileData)}
                onIdBadge={(doc) => setSelectedDoctorForBadge(doc as DoctorProfileData)}
                onTariffSheet={(doc) => setSelectedDoctorForTariff(doc as DoctorProfileData)}
                onAnalytics={(doc) => setSelectedDoctorForAnalytics(doc as DoctorProfileData)}
                onEdit={(doc) => {
                  setDoctorToEdit(doc as DoctorProfileData);
                  setShowAddEditModal(true);
                }}
              />

              {/* Server Pagination Controls */}
              {totalPages > 1 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">
                    Page <strong className="text-slate-900">{page}</strong> of <strong>{totalPages}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    <button
                      type="button"
                      disabled={page >= totalPages || loading}
                      onClick={() => setPage((p) => p + 1)}
                      className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ── VIEW 2: OPD CONSULTATION QUEUE ── */}
          {activeTab === "opd-queue" && (
            <DoctorOpdQueueView
              onOpenNewRx={handleOpenNewRxWithPatient}
            />
          )}

          {/* ── VIEW 3: INPATIENT (IPD) BED ROUNDS ── */}
          {activeTab === "ipd-rounds" && (
            <DoctorIpdRoundsView
              onOpenNewRx={handleOpenNewRxWithPatient}
            />
          )}

          {/* ── VIEW 4: SMART E-PRESCRIPTIONS & CPOE ── */}
          {activeTab === "prescriptions" && (
            <DoctorPrescriptionCpoeView
              onOpenNewRx={() => handleOpenNewRxWithPatient(null)}
            />
          )}

          {/* ── VIEW 5: PATHOLOGIST SIGN-OFF WORKSTATION ── */}
          {activeTab === "verification" && (
            <DoctorVerificationView />
          )}

          {/* ── VIEW 6: LONGITUDINAL PATIENT EMR TRENDS ── */}
          {activeTab === "emr" && (
            <DoctorEmrTrendsView />
          )}

          {/* ── VIEW 7: B2B REFERRAL LEDGER & PAYOUTS ── */}
          {activeTab === "referrals" && (
            <DoctorReferralLedgerView
              onOpenPayoutModal={(doc) => setSelectedDoctorForPayout(doc as DoctorProfileData)}
              onOpenTariffSheet={(doc) => setSelectedDoctorForTariff(doc as DoctorProfileData)}
              onOpenRequisitionSlip={(doc) => setSelectedDoctorForRequisition(doc as DoctorProfileData)}
            />
          )}

          {/* ── VIEW 8: DOCTOR DUTY ROSTER & SHIFTS ── */}
          {activeTab === "roster" && (
            <DoctorDutyRosterView />
          )}

          {/* ── VIEW 9: CLINICAL PRACTICE ANALYTICS ── */}
          {activeTab === "analytics" && (
            <DoctorPracticeAnalyticsView />
          )}

        </div>

        {/* ── MODAL 1: DOCTOR QUICK VIEW PROFILE DRAWER ── */}
        <DoctorQuickViewModal
          isOpen={Boolean(selectedDoctorForView)}
          onClose={() => setSelectedDoctorForView(null)}
          doctor={selectedDoctorForView}
          onOpenPayoutModal={(doc) => setSelectedDoctorForPayout(doc)}
          onOpenRequisitionSlip={(doc) => {
            setSelectedDoctorForRequisition(doc);
            setRequisitionAutoOpenModal(undefined);
          }}
          onOpenWhatsApp={(doc) => {
            setSelectedDoctorForRequisition(doc);
            setRequisitionAutoOpenModal("whatsapp");
          }}
          onOpenEmail={(doc) => {
            setSelectedDoctorForRequisition(doc);
            setRequisitionAutoOpenModal("email");
          }}
          onOpenSamplePickup={(doc) => setSelectedDoctorForPickup(doc)}
          onOpenIdBadge={(doc) => setSelectedDoctorForBadge(doc)}
          onOpenTariffSheet={(doc) => setSelectedDoctorForTariff(doc)}
          onOpenAnalytics={(doc) => setSelectedDoctorForAnalytics(doc)}
          onEditDoctor={(doc) => {
            setDoctorToEdit(doc);
            setShowAddEditModal(true);
          }}
        />

        {/* ── MODAL 2: REFERRAL COMMISSION PAYOUT SETTLEMENT MODAL ── */}
        <DoctorCommissionPayoutModal
          isOpen={Boolean(selectedDoctorForPayout)}
          onClose={() => setSelectedDoctorForPayout(null)}
          doctor={selectedDoctorForPayout}
          onPayoutSuccess={() => fetchDoctors()}
        />

        {/* ── MODAL 3: OFFICIAL CLINICAL INVESTIGATION REQUISITION SLIP / RX PAD ── */}
        <DoctorRequisitionSlipModal
          isOpen={Boolean(selectedDoctorForRequisition)}
          onClose={() => {
            setSelectedDoctorForRequisition(null);
            setRequisitionAutoOpenModal(undefined);
          }}
          doctor={selectedDoctorForRequisition}
          autoOpenModal={requisitionAutoOpenModal}
        />

        {/* ── MODAL 4: DOCTOR DIGITAL PRIVILEGE ID BADGE & CERTIFICATE ── */}
        <DoctorIdBadgeModal
          isOpen={Boolean(selectedDoctorForBadge)}
          onClose={() => setSelectedDoctorForBadge(null)}
          doctor={selectedDoctorForBadge}
        />

        {/* ── MODAL 5: PHLEBOTOMY SPECIMEN PICKUP & RIDER DISPATCH ── */}
        <DoctorSamplePickupModal
          isOpen={Boolean(selectedDoctorForPickup)}
          onClose={() => setSelectedDoctorForPickup(null)}
          doctor={selectedDoctorForPickup}
        />

        {/* ── MODAL 6: DIAGNOSTIC RATE MASTER & TARIFF DIRECTORY ── */}
        <DoctorTariffSheetModal
          isOpen={Boolean(selectedDoctorForTariff)}
          onClose={() => setSelectedDoctorForTariff(null)}
          doctor={selectedDoctorForTariff}
        />

        {/* ── MODAL 7: CLINICAL ANALYTICS & PRESCRIBING DOSSIER ── */}
        <DoctorAnalyticsModal
          isOpen={Boolean(selectedDoctorForAnalytics)}
          onClose={() => setSelectedDoctorForAnalytics(null)}
          doctor={selectedDoctorForAnalytics}
        />

        {/* ── MODAL 8: ENTERPRISE 8-STEP DOCTOR REGISTRATION & COMPLIANCE WIZARD ── */}
        <RegisterDoctorWizard
          isOpen={showAddEditModal}
          onClose={() => {
            setShowAddEditModal(false);
            setDoctorToEdit(null);
          }}
          doctor={doctorToEdit as any}
          onSuccess={() => {
            fetchDoctors();
            setShowAddEditModal(false);
            setDoctorToEdit(null);
          }}
        />

        {/* ── MODAL 9: SMART E-PRESCRIPTION & CPOE BUILDER MODAL ── */}
        <PrescriptionBuilderModal
          isOpen={isRxBuilderOpen}
          onClose={() => {
            setIsRxBuilderOpen(false);
            setPrefillPatientForRx(null);
          }}
          onSubmit={handlePrescriptionCreated}
          prefillPatient={prefillPatientForRx}
        />

      </DashboardLayout>
    </ProtectedRoute>
  );
}

export function DoctorUnifiedModule({ initialTab = "directory" }: { initialTab?: DoctorModuleTab }) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-semibold">Loading Doctor Operations...</p>
        </div>
      }
    >
      <DoctorsPageContent initialTab={initialTab} />
    </Suspense>
  );
}

export default DoctorUnifiedModule;
