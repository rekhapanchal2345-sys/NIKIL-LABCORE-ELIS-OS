"use client";

import React, { useState } from "react";
import SettingsSection from "./SettingsSection";
import SettingsField from "./SettingsField";

export interface AdvancedSettingsData {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  debugMode: boolean;
  logLevel: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  sessionTimeout: number;
  concurrentLogins: number;
  apiRateLimit: number;
  cacheEnabled: boolean;
  cacheTtl: number;
  enableAuditLogs: boolean;
  auditLogRetention: number;
  dataEncryption: boolean;
  backupEnabled: boolean;
  backupFrequency: string;
  backupRetention: number;
  autoUpdates: boolean;
  betaFeatures: boolean;
  performanceMonitoring: boolean;
  errorReporting: boolean;
}

interface AdvancedSettingsProps {
  initialValues?: Partial<AdvancedSettingsData>;
  saving?: boolean;
  onSave?: (values: AdvancedSettingsData) => void;
}

const defaults: AdvancedSettingsData = {
  maintenanceMode: false,
  maintenanceMessage: "System is under maintenance. Please try again later.",
  debugMode: false,
  logLevel: "info",
  maxFileSize: 10,
  allowedFileTypes: ["pdf", "jpg", "jpeg", "png", "doc", "docx"],
  sessionTimeout: 30,
  concurrentLogins: 1,
  apiRateLimit: 1000,
  cacheEnabled: true,
  cacheTtl: 3600,
  enableAuditLogs: true,
  auditLogRetention: 90,
  dataEncryption: true,
  backupEnabled: true,
  backupFrequency: "daily",
  backupRetention: 30,
  autoUpdates: false,
  betaFeatures: false,
  performanceMonitoring: true,
  errorReporting: true,
};

export default function AdvancedSettings({
  initialValues,
  saving = false,
  onSave,
}: AdvancedSettingsProps) {
  const [values, setValues] = useState<AdvancedSettingsData>({
    ...defaults,
    ...initialValues,
  });

  const [saved, setSaved] = useState(false);

  const update = <K extends keyof AdvancedSettingsData>(
    field: K,
    value: AdvancedSettingsData[K]
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setSaved(false);
  };

  const handleSave = () => {
    onSave?.(values);
    if (!onSave) {
      setSaved(true);
    }
  };

  const Toggle = ({
    label,
    description,
    field,
    warning = false,
  }: {
    label: string;
    description: string;
    field: keyof AdvancedSettingsData;
    warning?: boolean;
  }) => {
    const enabled = Boolean(values[field]);

    return (
      <div className={`flex items-start justify-between gap-5 rounded-lg border p-4 ${
        warning ? "border-orange-200 bg-orange-50" : "border-gray-200"
      }`}>
        <div>
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={() =>
            update(field, !enabled as AdvancedSettingsData[typeof field])
          }
          className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
            enabled ? "bg-gray-900" : "bg-gray-300"
          }`}
          aria-label={`Toggle ${label}`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
              enabled ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* System Status */}
      <SettingsSection
        title="System Status"
        description="Control system availability and maintenance mode."
      >
        <div className="space-y-4">
          <Toggle
            label="Maintenance Mode"
            description="Temporarily disable access for all users except administrators."
            field="maintenanceMode"
            warning
          />
          {values.maintenanceMode && (
            <SettingsField
              label="Maintenance Message"
              description="Message displayed to users during maintenance."
            >
              <textarea
                value={values.maintenanceMessage}
                onChange={(e) => update("maintenanceMessage", e.target.value)}
                rows={3}
                className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
              />
            </SettingsField>
          )}
        </div>
      </SettingsSection>

      {/* System Configuration */}
      <SettingsSection
        title="System Configuration"
        description="Advanced system settings and performance options."
      >
        <div className="space-y-4">
          <Toggle
            label="Debug Mode"
            description="Enable detailed logging for troubleshooting (use only in development)."
            field="debugMode"
            warning
          />
          <SettingsField label="Log Level">
            <select
              value={values.logLevel}
              onChange={(e) => update("logLevel", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            >
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </SettingsField>
        </div>
      </SettingsSection>

      {/* File Upload Settings */}
      <SettingsSection
        title="File Upload Settings"
        description="Configure file upload restrictions and limits."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <SettingsField label="Maximum File Size (MB)">
            <input
              type="number"
              min="1"
              max="100"
              value={values.maxFileSize}
              onChange={(e) => update("maxFileSize", Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />
          </SettingsField>

          <SettingsField label="Allowed File Types">
            <div className="flex flex-wrap gap-2">
              {["pdf", "jpg", "jpeg", "png", "doc", "docx", "xls", "xlsx", "csv"].map((type) => (
                <label
                  key={type}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm uppercase ${
                    values.allowedFileTypes.includes(type)
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={values.allowedFileTypes.includes(type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        update("allowedFileTypes", [...values.allowedFileTypes, type]);
                      } else {
                        update("allowedFileTypes", values.allowedFileTypes.filter((t) => t !== type));
                      }
                    }}
                    className="hidden"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </SettingsField>
        </div>
      </SettingsSection>

      {/* Session Management */}
      <SettingsSection
        title="Session Management"
        description="Configure user session and authentication settings."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <SettingsField
            label="Session Timeout (minutes)"
            description="Automatically log out inactive users."
          >
            <input
              type="number"
              min="5"
              max="480"
              value={values.sessionTimeout}
              onChange={(e) => update("sessionTimeout", Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />
          </SettingsField>

          <SettingsField
            label="Concurrent Logins"
            description="Maximum number of simultaneous sessions per user."
          >
            <input
              type="number"
              min="1"
              max="10"
              value={values.concurrentLogins}
              onChange={(e) => update("concurrentLogins", Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />
          </SettingsField>
        </div>
      </SettingsSection>

      {/* API Configuration */}
      <SettingsSection
        title="API Configuration"
        description="Configure API rate limiting and access controls."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <SettingsField
            label="API Rate Limit (requests/hour)"
            description="Maximum API requests per hour per user."
          >
            <input
              type="number"
              min="100"
              max="10000"
              value={values.apiRateLimit}
              onChange={(e) => update("apiRateLimit", Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />
          </SettingsField>
        </div>
      </SettingsSection>

      {/* Cache Configuration */}
      <SettingsSection
        title="Cache Configuration"
        description="Configure system caching for improved performance."
      >
        <div className="space-y-4">
          <Toggle
            label="Enable Caching"
            description="Cache frequently accessed data to improve performance."
            field="cacheEnabled"
          />
          {values.cacheEnabled && (
            <SettingsField
              label="Cache TTL (seconds)"
              description="Time to live for cached data."
            >
              <input
                type="number"
                min="60"
                max="86400"
                value={values.cacheTtl}
                onChange={(e) => update("cacheTtl", Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
              />
            </SettingsField>
          )}
        </div>
      </SettingsSection>

      {/* Audit & Logging */}
      <SettingsSection
        title="Audit & Logging"
        description="Configure audit trails and system logging."
      >
        <div className="space-y-4">
          <Toggle
            label="Enable Audit Logs"
            description="Record all system activities for compliance and security."
            field="enableAuditLogs"
          />
          {values.enableAuditLogs && (
            <SettingsField
              label="Audit Log Retention (days)"
              description="How long to retain audit logs before automatic deletion."
            >
              <input
                type="number"
                min="7"
                max="3650"
                value={values.auditLogRetention}
                onChange={(e) => update("auditLogRetention", Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
              />
            </SettingsField>
          )}
        </div>
      </SettingsSection>

      {/* Data Security */}
      <SettingsSection
        title="Data Security"
        description="Configure data encryption and security settings."
      >
        <div className="space-y-3">
          <Toggle
            label="Data Encryption"
            description="Encrypt sensitive data at rest."
            field="dataEncryption"
          />
        </div>
      </SettingsSection>

      {/* Backup Configuration */}
      <SettingsSection
        title="Backup Configuration"
        description="Configure automated backup settings."
      >
        <div className="space-y-4">
          <Toggle
            label="Enable Automated Backups"
            description="Automatically create system backups on schedule."
            field="backupEnabled"
          />
          {values.backupEnabled && (
            <div className="grid gap-5 md:grid-cols-2">
              <SettingsField label="Backup Frequency">
                <select
                  value={values.backupFrequency}
                  onChange={(e) => update("backupFrequency", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </SettingsField>

              <SettingsField
                label="Backup Retention (days)"
                description="How long to retain backup files."
              >
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={values.backupRetention}
                  onChange={(e) => update("backupRetention", Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
                />
              </SettingsField>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Updates & Features */}
      <SettingsSection
        title="Updates & Features"
        description="Configure system updates and feature availability."
      >
        <div className="space-y-3">
          <Toggle
            label="Automatic Updates"
            description="Automatically install system updates and security patches."
            field="autoUpdates"
          />
          <Toggle
            label="Beta Features"
            description="Enable early access to experimental features."
            field="betaFeatures"
            warning
          />
        </div>
      </SettingsSection>

      {/* Monitoring & Reporting */}
      <SettingsSection
        title="Monitoring & Reporting"
        description="Configure system monitoring and error reporting."
      >
        <div className="space-y-3">
          <Toggle
            label="Performance Monitoring"
            description="Collect anonymous performance metrics for system optimization."
            field="performanceMonitoring"
          />
          <Toggle
            label="Error Reporting"
            description="Automatically report system errors for troubleshooting."
            field="errorReporting"
          />
        </div>
      </SettingsSection>

      {/* Save Button */}
      <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {saved && (
          <p className="mr-auto text-sm font-medium text-green-600">
            ✓ Advanced settings saved successfully
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Advanced Settings"}
        </button>
      </div>
    </div>
  );
}
