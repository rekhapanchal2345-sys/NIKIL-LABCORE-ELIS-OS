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
  ArrowRight,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import { searchApi } from "@/lib/api";

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type SearchCategory =
  | "ALL"
  | "PATIENTS"
  | "ORDERS"
  | "SAMPLES"
  | "TESTS"
  | "DOCTORS"
  | "ACTIONS";

export interface SearchItem {
  id: string;
  type: "PATIENT" | "ORDER" | "SAMPLE" | "TEST" | "DOCTOR" | "ACTION";
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  href: string;
  relevanceScore?: number;
  matchType?: string;
  metadata?: Record<string, any>;
  icon?: any;
}

const CATEGORY_TABS: Array<{ id: SearchCategory; label: string; countBadge?: string }> = [
  { id: "ALL", label: "All Records" },
  { id: "PATIENTS", label: "Patients & UHID" },
  { id: "ORDERS", label: "Orders" },
  { id: "SAMPLES", label: "Specimens" },
  { id: "TESTS", label: "Test Catalog" },
  { id: "DOCTORS", label: "Doctors" },
  { id: "ACTIONS", label: "Quick Actions" },
];

const LOCAL_ABDM_ACTIONS: SearchItem[] = [
  {
    id: "action-abdm-scan-share",
    type: "ACTION",
    title: "ABDM Scan & Share Token Desk",
    subtitle: "OPD & Phlebotomy Fast-Track Queue • Counter Token QR Generator",
    tag: "ABDM FAST-TRACK",
    tagColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
    href: "/abdm?tab=scan-share",
    metadata: { shortcut: "SCAN" },
  },
  {
    id: "action-abdm-create-abha",
    type: "ACTION",
    title: "Enroll / Create New ABHA (Aadhaar & Mobile OTP - M1)",
    subtitle: "Issue 14-digit ABHA Number & Download Official NHA Health Card",
    tag: "M1 ENROLL",
    tagColor: "bg-purple-500/20 text-purple-300 border border-purple-500/40",
    href: "/abdm?tab=abha-m1&mode=enroll",
    metadata: { shortcut: "M1" },
  },
  {
    id: "action-abdm-verify-abha",
    type: "ACTION",
    title: "Verify Patient ABHA & Demographic KYC Lookup",
    subtitle: "Search by ABHA Number / PHR Address • Demographic KYC Validation",
    tag: "M1 VERIFY",
    tagColor: "bg-blue-500/20 text-blue-300 border border-blue-500/40",
    href: "/abdm?tab=abha-m1&mode=verify",
    metadata: { shortcut: "KYC" },
  },
  {
    id: "action-abdm-care-context",
    type: "ACTION",
    title: "Care Context Linker (M2 - OPD / IPD / Diagnostic Lab)",
    subtitle: "Link Diagnostic Orders, Visits & Episodes to Patient ABHA Health App",
    tag: "M2 LINK",
    tagColor: "bg-teal-500/20 text-teal-300 border border-teal-500/40",
    href: "/abdm?tab=care-context-m2",
    metadata: { shortcut: "M2" },
  },
  {
    id: "action-abdm-consents-hiu",
    type: "ACTION",
    title: "Patient Consents & HIU Gateway Records (M3)",
    subtitle: "Electronic Consents • Pull Health Records from AIIMS, Apollo, Fortis",
    tag: "M3 HIU",
    tagColor: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
    href: "/abdm?tab=consents-hiu",
    metadata: { shortcut: "M3" },
  },
  {
    id: "action-abdm-fhir",
    type: "ACTION",
    title: "FHIR R4 Diagnostic Report Exchange (M3)",
    subtitle: "HL7 FHIR R4 JSON • LOINC Coded Panels • Pathologist Sign-Off",
    tag: "FHIR R4",
    tagColor: "bg-sky-500/20 text-sky-300 border border-sky-500/40",
    href: "/abdm?tab=fhir-m3",
    metadata: { shortcut: "FHIR" },
  },
  {
    id: "action-abdm-report-seal",
    type: "ACTION",
    title: "ABDM Digital Seal & QR Report Stamping",
    subtitle: "NABL ISO 15189 Verified Lab Report Stamping with Official ABHA QR",
    tag: "ABDM SEAL",
    tagColor: "bg-teal-500/20 text-teal-300 border border-teal-500/40",
    href: "/abdm?tab=report-stamp",
    metadata: { shortcut: "SEAL" },
  },
];

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Search State
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("ALL");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Read active branch ID from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setActiveBranchId(localStorage.getItem("active_branch_id"));
    }
  }, [isOpen]);

  // Load Recent Searches from localStorage (Max 10)
  const loadRecentSearches = useCallback(() => {
    try {
      const saved = localStorage.getItem("labcore_recent_searches_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 10));
          return;
        }
      }
    } catch {}
    setRecentSearches(["Panchal", "Complete Blood Count", "ORD-", "Lipid Profile", "SMP-"]);
  }, []);

  const saveRecentSearch = useCallback((term: string) => {
    if (!term || !term.trim()) return;
    const cleanTerm = term.trim();
    try {
      setRecentSearches((prev) => {
        const updated = [cleanTerm, ...prev.filter((s) => s.toLowerCase() !== cleanTerm.toLowerCase())].slice(0, 10);
        try {
          localStorage.setItem("labcore_recent_searches_v2", JSON.stringify(updated));
        } catch {}
        return updated;
      });
    } catch {}
  }, []);

  const removeRecentSearch = (e: React.MouseEvent, termToRemove: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s.toLowerCase() !== termToRemove.toLowerCase());
      try {
        localStorage.setItem("labcore_recent_searches_v2", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("labcore_recent_searches_v2");
    } catch {}
  };

  // Perform debounced async search against backend /api/search
  useEffect(() => {
    if (!isOpen) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await searchApi.globalSearch(
          query.trim(),
          activeCategory,
          12,
          activeBranchId
        );

        const qLower = query.trim().toLowerCase();
        const matchingAbdmActions = LOCAL_ABDM_ACTIONS.filter((act) => {
          if (activeCategory === "ACTIONS" && !qLower) return true;
          if (!qLower) return false;
          return (
            act.title.toLowerCase().includes(qLower) ||
            act.subtitle.toLowerCase().includes(qLower) ||
            act.tag.toLowerCase().includes(qLower) ||
            (act.metadata?.shortcut && act.metadata.shortcut.toLowerCase().includes(qLower)) ||
            (qLower.includes("abdm") || qLower.includes("abha") || qLower.includes("scan") || qLower.includes("fhir"))
          );
        });

        if (res && res.success && res.data) {
          const fetchedResults: SearchItem[] = res.data.results || [];
          // Deduplicate and combine
          const combined = [...matchingAbdmActions, ...fetchedResults];
          setResults(combined);
        } else {
          setResults(matchingAbdmActions);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Search API error:", err);
        }
      } finally {
        setIsLoading(false);
      }
    }, query ? 200 : 0);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [query, activeCategory, activeBranchId, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 60);
      loadRecentSearches();
      setSelectedIndex(0);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen, loadRecentSearches]);

  // Scroll active item into view
  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.querySelector(
        `[data-search-index="${selectedIndex}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  // Handle Result Selection & Navigation
  const handleSelectResult = useCallback(
    (item: SearchItem) => {
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
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, results.length - 1)));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        // Cycle category tabs with Tab key
        const currentCatIdx = CATEGORY_TABS.findIndex((c) => c.id === activeCategory);
        const nextCatIdx = e.shiftKey
          ? (currentCatIdx - 1 + CATEGORY_TABS.length) % CATEGORY_TABS.length
          : (currentCatIdx + 1) % CATEGORY_TABS.length;
        setActiveCategory(CATEGORY_TABS[nextCatIdx].id);
        setSelectedIndex(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, handleSelectResult, onClose, activeCategory]);

  // Render appropriate icon based on entity type
  const renderItemIcon = (type: string) => {
    switch (type) {
      case "PATIENT":
        return <User className="h-5 w-5 text-blue-400" />;
      case "ORDER":
        return <FileText className="h-5 w-5 text-indigo-400" />;
      case "SAMPLE":
        return <Barcode className="h-5 w-5 text-purple-400" />;
      case "TEST":
        return <FlaskConical className="h-5 w-5 text-violet-400" />;
      case "DOCTOR":
        return <Stethoscope className="h-5 w-5 text-sky-400" />;
      case "ACTION":
        return <Sparkles className="h-5 w-5 text-emerald-400" />;
      default:
        return <Activity className="h-5 w-5 text-slate-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-3 sm:p-6 md:p-16 overflow-y-auto">
      {/* Frosted Glass Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      {/* Main Command Palette Dialog */}
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-700/70 bg-slate-900/95 text-white shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Ambient Top Glow */}
        <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

        {/* 1. SEARCH INPUT HEADER */}
        <div className="relative flex items-center border-b border-slate-800 px-4 py-3.5">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-indigo-400 animate-spin shrink-0 ml-2" />
          ) : (
            <Search className="h-5 w-5 text-indigo-400 shrink-0 ml-2" />
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search patients, UHID, tests, orders, specimens, doctors... (Ctrl+K)"
            className="flex-1 bg-transparent px-3 text-base font-medium text-white placeholder:text-slate-400 focus:outline-none"
          />

          {query && (
            <button
              onClick={() => {
                setQuery("");
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mr-2"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="hidden sm:inline-flex items-center rounded border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] font-mono text-slate-300">
              ESC
            </kbd>
          </div>
        </div>

        {/* 2. CATEGORY FILTER TABS */}
        <div className="flex items-center gap-1.5 border-b border-slate-800/80 bg-slate-950/60 px-4 py-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1 shrink-0 flex items-center gap-1">
            <SlidersHorizontal className="h-3 w-3" /> Filter:
          </span>
          {CATEGORY_TABS.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSelectedIndex(0);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all shrink-0 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/50"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* 3. SEARCH RESULTS & RECENT SEARCHES CONTAINER */}
        <div
          ref={resultsContainerRef}
          className="max-h-[440px] overflow-y-auto p-2 divide-y divide-slate-800/40"
        >
          {/* If No Query: Show Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="p-3 border-b border-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-slate-400" /> Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setQuery(term);
                      inputRef.current?.focus();
                    }}
                    className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-300 hover:border-indigo-500/50 hover:bg-slate-800 hover:text-white cursor-pointer transition-all"
                  >
                    <span>{term}</span>
                    <button
                      onClick={(e) => removeRecentSearch(e, term)}
                      className="text-slate-500 hover:text-rose-400 group-hover:opacity-100 opacity-60 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results List */}
          {results.length > 0 ? (
            <div className="py-1 space-y-1">
              {results.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={`${item.type}-${item.id}-${index}`}
                    data-search-index={index}
                    onClick={() => handleSelectResult(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`group flex items-center justify-between rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-indigo-600/20 border border-indigo-500/40 text-white shadow-sm"
                        : "hover:bg-slate-800/50 text-slate-300 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`p-2 rounded-lg shrink-0 transition-colors ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {renderItemIcon(item.type)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-semibold truncate ${
                              isSelected ? "text-white" : "text-slate-200"
                            }`}
                          >
                            {item.title}
                          </span>

                          {item.metadata?.shortcut && (
                            <kbd className="hidden sm:inline-flex rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-indigo-300 font-bold">
                              {item.metadata.shortcut}
                            </kbd>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${item.tagColor}`}
                      >
                        {item.tag}
                      </span>

                      <CornerDownLeft
                        className={`h-4 w-4 transition-opacity ${
                          isSelected ? "opacity-100 text-indigo-400" : "opacity-0"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : query && !isLoading ? (
            <div className="py-12 text-center">
              <Search className="h-8 w-8 text-slate-500 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-slate-300">
                No matching results found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Try searching with alternate spellings, UHID, or switch category tabs
              </p>
            </div>
          ) : null}
        </div>

        {/* 4. FOOTER KEYBOARD SHORTCUTS HINT */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-800/80 bg-slate-950/80 px-4 py-2.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                ↑↓
              </kbd>{" "}
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                ↵
              </kbd>{" "}
              Select
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                Tab
              </kbd>{" "}
              Cycle Filter
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-slate-400">
            <span className="text-slate-500">Quick Hotkeys:</span>
            <span className="hover:text-slate-200">
              <strong className="text-indigo-400">Alt+P</strong> Patient
            </span>
            <span className="hover:text-slate-200">
              <strong className="text-indigo-400">Alt+O</strong> Order
            </span>
            <span className="hover:text-slate-200">
              <strong className="text-indigo-400">Alt+S</strong> Daybook
            </span>
            <span className="hover:text-slate-200">
              <strong className="text-indigo-400">Alt+Q</strong> Pathologist
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Named alias export as CommandPalette for enterprise consistency
export { GlobalSearchModal as CommandPalette };
