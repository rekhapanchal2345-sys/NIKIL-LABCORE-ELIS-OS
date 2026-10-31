"use client";

import { Suspense, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboardlayout";
import SettingsLayout from "@/components/settings/SettingsLayout";
import FacilityOperationsSettings from "@/components/settings/FacilityOperationsSettings";
import DiagnosticGovernanceSettings from "@/components/settings/DiagnosticGovernanceSettings";
import BillingInsuranceSettings from "@/components/settings/BillingInsuranceSettings";
import HardwareInteroperabilitySettings from "@/components/settings/HardwareInteroperabilitySettings";
import StationerySecuritySettings from "@/components/settings/StationerySecuritySettings";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SETTINGS_VIEW_ROLES } from "@/components/settings/settingsAccess";
import {
  getStoredSettings,
  setStoredSettings,
} from "@/lib/settingsStorage";
import { laboratorySettingsApi } from "@/lib/api";

// ─── Sub-module router ────────────────────────────────────────────────────────
// Maps the URL `item` param to a React component for that settings section.
// Legacy tabs (profile, billing, etc.) continue to work via the old SettingsTabs
// system; new domain items render via SettingsLayout.

import ProfileSettings from "@/components/settings/ProfileSettings";
import GeneralSettings from "@/components/settings/GeneralSettings";
import UsersSettings from "@/components/settings/UsersSettings";
import LaboratorySettings from "@/components/settings/LaboratorySettings";
import BillingSettings from "@/components/settings/BillingSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import IntegrationSettings from "@/components/settings/IntegrationSettings";
import AdvancedSettings from "@/components/settings/AdvancedSettings";
import DataRetentionSettings from "@/components/settings/DataRetentionSettings";
import BrandingSettings from "@/components/settings/BrandingSettings";
import BackupSettings from "@/components/settings/BackupSettings";
import type { SettingsDomain } from "@/types/settings";

// ─── Inner page (needs useSearchParams inside Suspense) ───────────────────────
function SettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Legacy tab param backwards compatibility mapping
  const legacyTab = searchParams.get("tab");
  let resolvedItem = searchParams.get("item") ?? "";
  let resolvedDomain = (searchParams.get("domain") as SettingsDomain) || null;

  if (!resolvedItem && legacyTab) {
    if (legacyTab === "users") {
      resolvedDomain = "staff";
      resolvedItem = "staff-rbac";
    } else if (legacyTab === "lab") {
      resolvedDomain = "diagnostic";
      resolvedItem = "diagnostic-accreditation";
    } else if (legacyTab === "branches") {
      resolvedDomain = "facility";
      resolvedItem = "facility-branches";
    } else if (legacyTab === "security") {
      resolvedDomain = "security";
      resolvedItem = "security-audit";
    } else if (legacyTab === "audit") {
      resolvedDomain = "security";
      resolvedItem = "security-auditlog";
    } else if (legacyTab === "billing") {
      resolvedDomain = "billing";
      resolvedItem = "billing-tariffs";
    } else if (legacyTab === "integrations") {
      resolvedDomain = "hardware";
      resolvedItem = "hardware-analyzers";
    }
  }

  // Domain-based URL params
  const itemParam = resolvedItem || (searchParams.get("item") ?? "");
  const domainParam = (resolvedDomain || (searchParams.get("domain") ?? "facility")) as SettingsDomain;

  // Dirty state tracking
  const [isDirty, setIsDirty] = useState(false);
  const [dirtySection, setDirtySection] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Settings data per section key
  const [sectionData, setSectionData] = useState<Record<string, any>>({});

  const handleDirtyChange = useCallback(
    (dirty: boolean, sectionId?: string) => {
      setIsDirty(dirty);
      if (sectionId) setDirtySection(sectionId);
    },
    []
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const data = sectionData[itemParam];
      if (data) {
        setStoredSettings(itemParam, data);
        // Try backend sync for laboratory-adjacent sections
        if (
          ["facility-identity", "diagnostic-accreditation", "laboratory"].includes(
            itemParam
          )
        ) {
          try {
            await laboratorySettingsApi.updateSettings(data);
          } catch (apiErr) {
            console.warn("Backend API sync:", apiErr);
          }
        }
      }
      await new Promise((r) => setTimeout(r, 300));
      setIsDirty(false);
      setDirtySection("");
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }, [itemParam, sectionData]);

  const handleDiscard = useCallback(() => {
    // Force remount by toggling a key
    setSectionData((prev) => {
      const next = { ...prev };
      delete next[itemParam];
      return next;
    });
    setIsDirty(false);
    setDirtySection("");
  }, [itemParam]);

  // ── Section renderer ───────────────────────────────────────────────────────
  const renderSection = (activeItemId: string, domain: SettingsDomain) => {
    // Domain 1: Facility & Operations
    if (domain === "facility" || activeItemId.startsWith("facility-")) {
      return (
        <FacilityOperationsSettings
          key={activeItemId}
          subSection={activeItemId}
          initialValues={getStoredSettings(activeItemId)}
          saving={saving}
          onDirtyChange={(dirty) => handleDirtyChange(dirty, activeItemId)}
          onSave={(data) => {
            setSectionData((prev) => ({ ...prev, [activeItemId]: data }));
          }}
        />
      );
    }

    // Domain 2: Diagnostic & Lab Governance
    if (domain === "diagnostic" || activeItemId.startsWith("diagnostic-")) {
      return (
        <DiagnosticGovernanceSettings
          key={activeItemId}
          subSection={activeItemId}
          initialValues={getStoredSettings(activeItemId)}
          saving={saving}
          onDirtyChange={(dirty) => handleDirtyChange(dirty, activeItemId)}
          onSave={(data) => {
            setSectionData((prev) => ({ ...prev, [activeItemId]: data }));
          }}
        />
      );
    }

    // Domain 3: Doctor, Staff, Roles & Digital Signatures
    if (
      domain === "staff" ||
      activeItemId.startsWith("staff-") ||
      activeItemId === "users"
    ) {
      return (
        <UsersSettings
          key={activeItemId}
          subSection={activeItemId}
          saving={saving}
          initialValues={getStoredSettings("users")}
          onSave={(data) => setStoredSettings("users", data)}
        />
      );
    }

    // Domain 4: Billing, Tariffs, Insurance & Statutory Taxes
    if (
      domain === "billing" ||
      activeItemId.startsWith("billing-") ||
      activeItemId === "billing"
    ) {
      return (
        <BillingInsuranceSettings
          key={activeItemId}
          subSection={activeItemId}
          saving={saving}
          initialValues={getStoredSettings("billing")}
          onDirtyChange={(dirty) => handleDirtyChange(dirty, activeItemId)}
          onSave={(data) => {
            setSectionData((prev) => ({ ...prev, [activeItemId]: data }));
            setStoredSettings("billing", data);
          }}
        />
      );
    }

    // Domain 5: Medical Hardware, Interoperability & LIS Interfacing
    if (
      domain === "hardware" ||
      activeItemId.startsWith("hardware-") ||
      activeItemId === "integrations"
    ) {
      return (
        <HardwareInteroperabilitySettings
          key={activeItemId}
          subSection={activeItemId}
          saving={saving}
          initialValues={getStoredSettings("integrations")}
          onDirtyChange={(dirty) => handleDirtyChange(dirty, activeItemId)}
          onSave={(data) => {
            setSectionData((prev) => ({ ...prev, [activeItemId]: data }));
            setStoredSettings("integrations", data);
          }}
        />
      );
    }

    // Domain 6: Stationery, Report Header/Footer & System Security
    if (
      domain === "security" ||
      activeItemId.startsWith("security-") ||
      activeItemId === "security" ||
      activeItemId === "branding" ||
      activeItemId === "backup" ||
      activeItemId === "data_retention"
    ) {
      return (
        <StationerySecuritySettings
          key={activeItemId}
          subSection={activeItemId}
          saving={saving}
          initialReportLayout={getStoredSettings("branding")}
          initialSecurityData={getStoredSettings("security")}
          onDirtyChange={(dirty) => handleDirtyChange(dirty, activeItemId)}
          onSave={(reportLayout, security) => {
            setSectionData((prev) => ({
              ...prev,
              [activeItemId]: { reportLayout, security },
            }));
            setStoredSettings("branding", reportLayout);
            setStoredSettings("security", security);
          }}
        />
      );
    }

    // ── Fallback to legacy settings components ─────────────────────────────
    switch (activeItemId) {
      case "notifications":
        return (
          <NotificationSettings
            key={activeItemId}
            saving={saving}
            initialValues={getStoredSettings("notifications")}
            onSave={(data) => setStoredSettings("notifications", data)}
          />
        );

      case "advanced":
        return (
          <AdvancedSettings
            key={activeItemId}
            saving={saving}
            initialValues={getStoredSettings("advanced")}
            onSave={(data) => setStoredSettings("advanced", data)}
          />
        );

      case "general":
        return (
          <GeneralSettings
            key={activeItemId}
            saving={saving}
            initialValues={getStoredSettings("general")}
            onSave={(data) => setStoredSettings("general", data)}
          />
        );

      case "profile":
      default:
        return (
          <ProfileSettings
            key={activeItemId}
            saving={saving}
            initialValues={getStoredSettings("profile")}
            onSave={(data) => setStoredSettings("profile", data)}
          />
        );
    }
  };

  // Read NABL status from stored lab settings
  const labSettings = getStoredSettings("laboratory");
  const nablStatus = labSettings?.nablStatus ?? "ACTIVE";
  const facilityName =
    getStoredSettings("general")?.laboratoryName ??
    getStoredSettings("laboratory")?.labName ??
    "LabCore Central Lab";

  return (
    <DashboardLayout title="Settings & Administration">
      <div className="h-full w-full min-h-0 flex flex-col overflow-hidden">
        <SettingsLayout
          nablStatus={nablStatus}
          facilityName={facilityName}
          isDirty={isDirty}
          dirtySection={dirtySection}
          sectionLabel={dirtySection || undefined}
          saving={saving}
          onSave={handleSave}
          onDiscard={handleDiscard}
        >
          {(activeItemId, domain) => renderSection(activeItemId, domain)}
        </SettingsLayout>
      </div>
    </DashboardLayout>
  );
}

// ─── Public export with Suspense boundary ────────────────────────────────────
export default function SettingsPage() {
  return (
    <ProtectedRoute requiredRoles={SETTINGS_VIEW_ROLES}>
      <Suspense
        fallback={
          <DashboardLayout title="Settings & Administration">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
            </div>
          </DashboardLayout>
        }
      >
        <SettingsPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}