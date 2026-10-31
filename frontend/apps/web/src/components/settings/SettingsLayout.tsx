"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import SettingsNavigation, {
  SETTINGS_DOMAIN_GROUPS,
  ALL_NAV_ITEMS,
  isValidNavItemId,
} from "./SettingsNavigation";
import type { SettingsDomain } from "@/types/settings";

// ─── Props ────────────────────────────────────────────────────────────────────
interface SettingsLayoutProps {
  children: (activeItemId: string, domain: SettingsDomain) => React.ReactNode;
  nablStatus?: "ACTIVE" | "EXPIRED" | "SUSPENDED" | "APPLIED";
  facilityName?: string;
  isDirty?: boolean;
  dirtySection?: string;
  sectionLabel?: string;
  saving?: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
}

// ─── Breadcrumb Builder ───────────────────────────────────────────────────────
function buildBreadcrumb(itemId: string): string[] {
  for (const group of SETTINGS_DOMAIN_GROUPS) {
    const item = group.items.find((i) => i.id === itemId);
    if (item) {
      return ["Settings", group.domainLabel, item.label];
    }
  }
  return ["Settings"];
}

// ─── Toast State Interface ────────────────────────────────────────────────────
interface ToastState {
  msg: string;
  type: "success" | "error";
}

// ─── Main SettingsLayout ──────────────────────────────────────────────────────
export default function SettingsLayout({
  children,
  nablStatus = "ACTIVE",
  facilityName = "LabCore Central Lab",
  isDirty = false,
  dirtySection,
  sectionLabel,
  saving = false,
  onSave,
  onDiscard,
}: SettingsLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // URL-driven active item
  const itemParam = searchParams.get("item");
  const domainParam = searchParams.get("domain");

  const defaultItem = ALL_NAV_ITEMS[0];
  const activeItemId =
    itemParam && isValidNavItemId(itemParam) ? itemParam : defaultItem.id;
  const activeDomain = (
    domainParam && SETTINGS_DOMAIN_GROUPS.some((g) => g.domain === domainParam)
      ? domainParam
      : defaultItem.domain
  ) as SettingsDomain;

  const breadcrumbs = buildBreadcrumb(activeItemId);
  const currentSectionLabel = sectionLabel || breadcrumbs[breadcrumbs.length - 1];

  // Navigation handler — push to URL so Back/Forward work
  const handleItemSelect = useCallback(
    (itemId: string, domain: SettingsDomain) => {
      router.replace(
        `/settings?domain=${domain}&item=${itemId}`,
        { scroll: false }
      );
      setDrawerOpen(false);
    },
    [router]
  );

  // Keyboard shortcuts: Ctrl/Cmd+S = save, Escape = discard confirm, Cmd+K = search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (isDirty && onSave) onSave();
      }
      if (e.key === "Escape" && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isDirty, onSave, drawerOpen]);

  // beforeunload guard when dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Leave page?";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Close drawer on outside click
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerOpen]);

  return (
    <div className="flex h-full min-h-0 bg-slate-50/40 relative overflow-hidden">
      {/* ── Left Sidebar — desktop (lg+) ────────────────────── */}
      <div
        className={`hidden lg:flex flex-col shrink-0 h-full transition-all duration-200 ease-in-out border-r border-slate-200 bg-white ${
          isSidebarCollapsed ? "w-0 overflow-hidden border-r-0" : "w-[260px]"
        }`}
      >
        <SettingsNavigation
          activeItemId={activeItemId}
          onItemSelect={handleItemSelect}
          isDirty={isDirty}
          dirtySection={dirtySection}
          facilityName={facilityName}
          nablStatus={nablStatus}
        />
      </div>

      {/* ── Mobile Slide-Over Drawer ─────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog" aria-label="Settings navigation">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/40" aria-hidden="true" onClick={() => setDrawerOpen(false)} />
          {/* Drawer panel */}
          <div
            ref={drawerRef}
            className="absolute left-0 top-0 h-full flex flex-col z-10 w-[280px] bg-white shadow-xl"
          >
            <SettingsNavigation
              activeItemId={activeItemId}
              onItemSelect={handleItemSelect}
              isDirty={isDirty}
              dirtySection={dirtySection}
              facilityName={facilityName}
              nablStatus={nablStatus}
            />
          </div>
        </div>
      )}

      {/* ── Right Content Pane ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white">
        {/* Sticky Header Bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-6 py-3.5 shrink-0 shadow-xs">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Desktop toggle sidebar button */}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className="hidden lg:flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-sky-700 hover:bg-sky-50 hover:border-sky-200 transition-colors cursor-pointer shrink-0"
                title={isSidebarCollapsed ? "Show Settings Navigation" : "Collapse Settings Navigation"}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>

              {/* Mobile hamburger */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
                aria-label="Open navigation"
              >
                <Menu className="h-4 w-4" />
              </button>

              {/* Breadcrumb & Section Title */}
              <div className="min-w-0">
                <nav
                  className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400"
                  aria-label="Breadcrumb"
                >
                  {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={crumb}>
                      {idx > 0 && (
                        <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" aria-hidden="true" />
                      )}
                      <span
                        className={
                          idx === breadcrumbs.length - 1
                            ? "text-sky-700 font-semibold truncate"
                            : "text-slate-400 hover:text-slate-600 hidden sm:inline"
                        }
                      >
                        {crumb}
                      </span>
                    </React.Fragment>
                  ))}
                </nav>
                <h1 className="text-sm font-bold text-slate-900 truncate tracking-tight">
                  {breadcrumbs[breadcrumbs.length - 1]}
                </h1>
              </div>
            </div>

            {/* Right: Dirty pill + Discard + Save */}
            <div className="flex items-center gap-2 shrink-0">
              {isDirty && (
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved Changes
                </span>
              )}
              {isDirty && (
                <button
                  type="button"
                  onClick={onDiscard}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  Discard
                </button>
              )}
              <button
                type="button"
                onClick={onSave}
                disabled={saving || !isDirty}
                aria-label={saving ? "Saving changes" : "Save changes"}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  isDirty && !saving
                    ? "bg-sky-700 text-white hover:bg-sky-800 shadow-sm shadow-sky-700/20"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                }`}
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {saving ? "Saving…" : "Save Changes"}
                {!saving && isDirty && (
                  <kbd className="hidden sm:inline-flex items-center rounded bg-sky-600 px-1 py-0.2 text-[9px] font-mono text-white ml-0.5">
                    ⌘S
                  </kbd>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area with max-width container for clean zoom & proportions */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
          <div className="max-w-6xl mx-auto w-full">
            {children(activeItemId, activeDomain)}
          </div>
        </div>

        {/* ── Unsaved Changes Sticky Footer Banner ─────────── */}
        {isDirty && (
          <div
            className="absolute bottom-0 inset-x-0 z-40 pointer-events-none"
            role="alert"
            aria-live="polite"
          >
            <div className="mx-6 mb-4 pointer-events-auto">
              <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-md">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
                <p className="text-xs font-medium text-amber-900 flex-1 min-w-0 truncate">
                  You have unsaved changes in{" "}
                  <strong className="font-bold">{currentSectionLabel}</strong>
                  {" — "}
                  <button
                    type="button"
                    onClick={onDiscard}
                    className="underline font-bold hover:text-amber-950 cursor-pointer ml-1"
                  >
                    Discard
                  </button>
                  {" or "}
                  <button
                    type="button"
                    onClick={onSave}
                    className="underline font-bold hover:text-amber-950 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </p>
                <button
                  type="button"
                  onClick={onDiscard}
                  className="shrink-0 text-amber-600 hover:text-amber-800 cursor-pointer p-0.5 rounded"
                  aria-label="Dismiss unsaved changes warning"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Toast Notification ─────────────────────────────── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-20 right-6 z-[200] flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg transition-all ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" aria-hidden="true" />
          )}
          <span className="flex-1">{toast.msg}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer ml-1 p-0.5"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
