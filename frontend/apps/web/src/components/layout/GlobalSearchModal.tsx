"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  User,
  FlaskConical,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  Command,
  CornerDownLeft,
  Calendar,
  Activity,
  Droplets,
  AlertTriangle,
  Building2,
  Plus,
  Printer,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Tag,
  Stethoscope,
  Barcode,
  History,
  Trash2,
} from "lucide-react";
import { patientApi, testApi, orderApi } from "@/lib/api";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Built-in catalog of clinical diagnostic tests for instant fallback and high-speed search
const CLINICAL_TESTS_CATALOG = [
  {
    id: "test-cbc",
    name: "Complete Blood Count (CBC) with Automated Differential",
    code: "HEM-CBC-01",
    category: "Hematology",
    specimen: "EDTA Whole Blood",
    tubeColor: "Lavender Top",
    tubeColorHex: "#9333EA",
    tat: "2 Hours",
    price: 350,
  },
  {
    id: "test-lft",
    name: "Liver Function Test (LFT) Comprehensive",
    code: "BIO-LFT-02",
    category: "Biochemistry",
    specimen: "Serum Gel Clot Activator",
    tubeColor: "Gold / Red Top",
    tubeColorHex: "#EAB308",
    tat: "4 Hours",
    price: 750,
  },
  {
    id: "test-kft",
    name: "Kidney / Renal Function Test (KFT / RFT)",
    code: "BIO-KFT-03",
    category: "Biochemistry",
    specimen: "Serum Gel Clot Activator",
    tubeColor: "Gold / Red Top",
    tubeColorHex: "#EAB308",
    tat: "4 Hours",
    price: 700,
  },
  {
    id: "test-lipid",
    name: "Lipid Profile Panel (Cholesterol, HDL, LDL, Triglycerides)",
    code: "BIO-LIP-04",
    category: "Biochemistry",
    specimen: "Fasting Serum",
    tubeColor: "Gold / Red Top",
    tubeColorHex: "#EAB308",
    tat: "4 Hours",
    price: 650,
  },
  {
    id: "test-hba1c",
    name: "Glycated Hemoglobin (HbA1c) by HPLC Method",
    code: "HEM-HBA-05",
    category: "Hematology",
    specimen: "EDTA Whole Blood",
    tubeColor: "Lavender Top",
    tubeColorHex: "#9333EA",
    tat: "3 Hours",
    price: 550,
  },
  {
    id: "test-fbs",
    name: "Fasting Blood Sugar (Glucose FBS)",
    code: "BIO-GLU-06",
    category: "Biochemistry",
    specimen: "Sodium Fluoride Plasma",
    tubeColor: "Grey Top",
    tubeColorHex: "#64748B",
    tat: "1.5 Hours",
    price: 120,
  },
  {
    id: "test-tsh",
    name: "Thyroid Profile Total (T3, T4, TSH Ultra-sensitive)",
    code: "IMM-THY-07",
    category: "Immunology / CLIA",
    specimen: "Serum",
    tubeColor: "Gold / Red Top",
    tubeColorHex: "#EAB308",
    tat: "6 Hours",
    price: 850,
  },
  {
    id: "test-urine",
    name: "Urinalysis Routine & Microscopic Examination",
    code: "PAT-URN-08",
    category: "Clinical Pathology",
    specimen: "Sterile Midstream Urine",
    tubeColor: "Sterile Container",
    tubeColorHex: "#CA8A04",
    tat: "2 Hours",
    price: 200,
  },
  {
    id: "test-crp",
    name: "C-Reactive Protein (Quantitative hs-CRP)",
    code: "IMM-CRP-09",
    category: "Serology",
    specimen: "Serum",
    tubeColor: "Gold Top",
    tubeColorHex: "#EAB308",
    tat: "3 Hours",
    price: 450,
  },
  {
    id: "test-dengue",
    name: "Dengue Duo Panel (NS1 Antigen + IgG / IgM Antibodies)",
    code: "SER-DNG-10",
    category: "Serology",
    specimen: "Serum / Whole Blood",
    tubeColor: "Gold / Lavender",
    tubeColorHex: "#DC2626",
    tat: "2 Hours",
    price: 950,
  },
];

// Quick System Shortcuts & Navigation
const SYSTEM_ACTIONS = [
  {
    id: "act-register-patient",
    title: "Register New Walk-In Patient",
    subtitle: "Rapid emergency / OPD patient demographic intake & UHID issuance",
    href: "/patients?action=new",
    category: "Quick Action",
    icon: Plus,
    badge: "OPD Desk",
    badgeColor: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  {
    id: "act-new-order",
    title: "Create Diagnostic Test Order",
    subtitle: "Book laboratory assays, assign barcode, generate patient bill",
    href: "/orders/new",
    category: "Quick Action",
    icon: FlaskConical,
    badge: "Order Entry",
    badgeColor: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  {
    id: "act-samples",
    title: "Specimen Accession & Phlebotomy",
    subtitle: "Sample barcoding, rack sorting, centrifuging & analyzer handoff",
    href: "/samples",
    category: "Laboratory",
    icon: Barcode,
    badge: "Accession",
    badgeColor: "bg-purple-50 text-purple-700 ring-purple-200",
  },
  {
    id: "act-results",
    title: "Technician Results Entry & QC",
    subtitle: "Direct assay parameter numerical entry & Delta check verification",
    href: "/results",
    category: "Laboratory",
    icon: Activity,
    badge: "Worklist",
    badgeColor: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  {
    id: "act-approvals",
    title: "Pathologist Sign-off & Panic Desk",
    subtitle: "Dual pathologist review, panic value telephonic logs & digital signature",
    href: "/approvals",
    category: "Laboratory",
    icon: Stethoscope,
    badge: "Pathologist",
    badgeColor: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  {
    id: "act-reports",
    title: "Verified Reports & PDF Dispatch",
    subtitle: "Download authorized diagnostic report PDFs with NABL QR verification",
    href: "/reports",
    category: "Reports",
    icon: FileText,
    badge: "PDF Reports",
    badgeColor: "bg-teal-50 text-teal-700 ring-teal-200",
  },
  {
    id: "act-invoices",
    title: "POS Billing & Invoices Roster",
    subtitle: "Receipt generation, payment modes, GST invoices & financial ledger",
    href: "/invoices",
    category: "Finance",
    icon: Tag,
    badge: "Billing",
    badgeColor: "bg-amber-50 text-amber-700 ring-amber-200",
  },
];

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Search State
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"ALL" | "PATIENTS" | "TESTS" | "ORDERS" | "ACTIONS">("ALL");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Live Async Data
  const [patients, setPatients] = useState<any[]>([]);
  const [testsCatalog, setTestsCatalog] = useState<any[]>(CLINICAL_TESTS_CATALOG);
  const [loadingData, setLoadingData] = useState(false);

  // Recent Searches Cache (from localStorage)
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      loadRecentSearches();
      loadLiveIndex();
    } else {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Load Recent Searches from LocalStorage
  const loadRecentSearches = () => {
    try {
      const saved = localStorage.getItem("labcore_recent_searches");
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {
      setRecentSearches(["Panchal", "CBC", "ORD-", "Lipid"]);
    }
  };

  const saveRecentSearch = useCallback((term: string) => {
    if (!term.trim()) return;
    try {
      setRecentSearches((prev) => {
        const updated = [term.trim(), ...prev.filter((s) => s.toLowerCase() !== term.trim().toLowerCase())].slice(0, 6);
        try { localStorage.setItem("labcore_recent_searches", JSON.stringify(updated)); } catch {}
        return updated;
      });
    } catch {
      // ignore
    }
  }, []);

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("labcore_recent_searches");
    } catch {}
  };

  // Pre-load patients and tests for high-speed live search
  const loadLiveIndex = async () => {
    try {
      setLoadingData(true);
      const [patientsRes, testsRes] = await Promise.allSettled([
        patientApi.getAll("page=1&limit=50"),
        testApi.getAll(),
      ]);

      if (patientsRes.status === "fulfilled" && patientsRes.value?.success && patientsRes.value?.data) {
        const raw = patientsRes.value.data.patients || (Array.isArray(patientsRes.value.data) ? patientsRes.value.data : []);
        setPatients(raw);
      }

      if (testsRes.status === "fulfilled" && testsRes.value?.success && testsRes.value?.data) {
        const raw = testsRes.value.data.tests || (Array.isArray(testsRes.value.data) ? testsRes.value.data : []);
        if (raw.length > 0) {
          const mapped = raw.map((t: any) => ({
            id: t.id,
            name: t.testName || t.name,
            code: t.testCode || t.code || "LAB-001",
            category: t.category?.name || t.category || "General",
            specimen: t.sampleType || "Blood",
            tubeColor: "Lavender / Gold",
            tubeColorHex: "#9333EA",
            tat: t.turnaroundTime ? `${t.turnaroundTime} hrs` : "4 Hours",
            price: t.price || 500,
          }));
          setTestsCatalog(mapped);
        }
      }
    } catch (err) {
      console.error("Error pre-loading search index:", err);
    } finally {
      setLoadingData(false);
    }
  };

  // Filter & Rank Results
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    // 1. Matched Patients
    let matchedPatients: any[] = [];
    if (activeCategory === "ALL" || activeCategory === "PATIENTS") {
      matchedPatients = (patients.length > 0 ? patients : [
        {
          id: "p-1",
          uhid: "LC-00001",
          firstName: "Panchal",
          lastName: "Ashokkumar",
          gender: "MALE",
          age: 48,
          phone: "919106161228",
          email: "nikilpanchal0@gmail.com",
          bloodGroup: "O+",
          status: "Active",
        },
      ])
        .filter((p: any) => {
          if (!q) return true;
          const fullName = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
          const uhid = (p.uhid || "").toLowerCase();
          const phone = (p.phone || "").toLowerCase();
          const email = (p.email || "").toLowerCase();
          return (
            fullName.includes(q) ||
            uhid.includes(q) ||
            phone.includes(q) ||
            email.includes(q)
          );
        })
        .slice(0, 5)
        .map((p: any) => ({
          type: "PATIENT",
          id: p.id,
          title: `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Patient Record",
          subtitle: `UHID: ${p.uhid || "LC-00001"} • ${p.age ? p.age + "y" : "Age N/A"} • ${p.gender || "M"} • Blood: ${p.bloodGroup || "O+"}`,
          tag: p.uhid || "UHID",
          tagColor: "bg-blue-50 text-blue-700 ring-blue-200",
          phone: p.phone,
          href: `/patients`,
          targetId: p.id,
        }));
    }

    // 2. Matched Tests
    let matchedTests: any[] = [];
    if (activeCategory === "ALL" || activeCategory === "TESTS") {
      matchedTests = testsCatalog
        .filter((t: any) => {
          if (!q) return true;
          const name = (t.name || "").toLowerCase();
          const code = (t.code || "").toLowerCase();
          const cat = (t.category || "").toLowerCase();
          return name.includes(q) || code.includes(q) || cat.includes(q);
        })
        .slice(0, 6)
        .map((t: any) => ({
          type: "TEST",
          id: t.id,
          title: t.name,
          subtitle: `Code: ${t.code} • ${t.category} • Tube: ${t.tubeColor} • TAT: ${t.tat}`,
          tag: `₹${t.price}`,
          tagColor: "bg-emerald-50 text-emerald-700 ring-emerald-200",
          href: `/orders/new?testName=${encodeURIComponent(t.name)}`,
        }));
    }

    // 3. Matched Quick System Actions
    let matchedActions: any[] = [];
    if (activeCategory === "ALL" || activeCategory === "ACTIONS") {
      matchedActions = SYSTEM_ACTIONS.filter((act) => {
        if (!q) return true;
        return (
          act.title.toLowerCase().includes(q) ||
          act.subtitle.toLowerCase().includes(q) ||
          act.badge.toLowerCase().includes(q)
        );
      }).map((act) => ({
        type: "ACTION",
        id: act.id,
        title: act.title,
        subtitle: act.subtitle,
        tag: act.badge,
        tagColor: act.badgeColor,
        href: act.href,
        icon: act.icon,
      }));
    }

    // Combine All
    return [...matchedPatients, ...matchedTests, ...matchedActions];
  }, [query, activeCategory, patients, testsCatalog]);

  // Handle Item Navigation
  const handleSelectResult = useCallback(
    (item: any) => {
      saveRecentSearch(item.title);
      onClose();
      router.push(item.href);
    },
    [onClose, router, saveRecentSearch]
  );

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, searchResults.length - 1)));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          handleSelectResult(searchResults[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, searchResults, selectedIndex, handleSelectResult, onClose]);

  // Reset selected index when search query or filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 sm:p-6 md:p-20 overflow-y-auto">
      {/* Frosted Glass Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl transition-opacity animate-in fade-in duration-200"
      />

      {/* Main Command Palette Dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700/60 bg-slate-900/95 text-white shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Glow Effects */}
        <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* 1. SEARCH INPUT HEADER */}
        <div className="relative flex items-center border-b border-slate-800 px-4 py-4">
          <Search className="h-5 w-5 text-indigo-400 shrink-0 ml-2" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients, UHID, tests, orders, barcodes, doctors..."
            className="flex-1 bg-transparent px-3.5 text-base font-medium text-white placeholder:text-slate-400 focus:outline-none"
          />

          {query && (
            <button
              onClick={() => setQuery("")}
              className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mr-2"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-1 text-[11px] font-mono font-bold text-slate-300 hover:bg-slate-700 transition-colors"
          >
            ESC
          </button>
        </div>

        {/* 2. CATEGORY FILTER CHIPS */}
        <div className="flex items-center gap-1.5 border-b border-slate-800/80 bg-slate-950/40 px-4 py-2.5 overflow-x-auto text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1 shrink-0">
            Filter:
          </span>
          {[
            { id: "ALL", label: "All Records" },
            { id: "PATIENTS", label: "Patients & UHID" },
            { id: "TESTS", label: "Tests & Panels" },
            { id: "ACTIONS", label: "Quick Actions" },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-all shrink-0 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* 3. SEARCH RESULTS LIST */}
        <div
          ref={resultsContainerRef}
          className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-800/50"
        >
          {/* If No Query: Show Recent Searches & Recommended Shortcuts */}
          {!query && (
            <div className="p-3 space-y-4">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Recent Searches</span>
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Clear</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(term)}
                        className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs text-slate-300 hover:border-indigo-500 hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <Search className="h-3 w-3 text-slate-400" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions Header */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Frequently Used Clinical Workflows</span>
                </span>
              </div>
            </div>
          )}

          {/* Render Active Results */}
          {searchResults.length > 0 ? (
            searchResults.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={`${item.type}-${item.id}-${idx}`}
                  onClick={() => handleSelectResult(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? "bg-indigo-600/20 text-white border border-indigo-500/40 ring-1 ring-indigo-500/20"
                      : "text-slate-300 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Icon by Type */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold shadow-sm ${
                        item.type === "PATIENT"
                          ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-400/30"
                          : item.type === "TEST"
                          ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/30"
                          : "bg-purple-500/20 text-purple-400 ring-1 ring-purple-400/30"
                      }`}
                    >
                      {item.type === "PATIENT" ? (
                        <User className="h-4 w-4" />
                      ) : item.type === "TEST" ? (
                        <FlaskConical className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </div>

                    {/* Text Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white truncate">
                          {item.title}
                        </span>
                        {item.type === "PATIENT" && (
                          <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[10px] font-bold text-indigo-300">
                            Patient
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  {/* Right Badge / Action Key */}
                  <div className="flex items-center gap-3 ml-3 shrink-0">
                    <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 border border-slate-700">
                      {item.tag}
                    </span>
                    <CornerDownLeft
                      className={`h-4 w-4 transition-transform ${
                        isSelected ? "text-indigo-400 translate-x-0.5" : "text-slate-600 opacity-0 group-hover:opacity-100"
                      }`}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <Search className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-300">No matching clinical records</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No patient, test assay, order ID, or action matches "{query}". Try checking the spelling or searching by UHID.
              </p>
            </div>
          )}
        </div>

        {/* 4. KEYBOARD HINTS FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/70 px-4 py-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                ↑
              </kbd>
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                ↓
              </kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                ↵
              </kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                ESC
              </kbd>
              <span>to close</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-500">
            <span>LabCore Spotlight</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
