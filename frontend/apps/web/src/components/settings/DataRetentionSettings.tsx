"use client";

import React, { useState } from "react";
import SettingsSection from "./SettingsSection";
import SettingsField from "./SettingsField";

export interface DataRetentionSettingsData {
  patientDataRetention: number;
  patientDataArchive: boolean;
  patientDataArchiveDays: number;
  resultDataRetention: number;
  resultDataArchive: boolean;
  resultDataArchiveDays: number;
  invoiceDataRetention: number;
  invoiceDataArchive: boolean;
  invoiceDataArchiveDays: number;
  auditLogRetention: number;
  auditLogArchive: boolean;
  auditLogArchiveDays: number;
  analyzerDataRetention: number;
  enableAutoPurge: boolean;
  autoPurgeFrequency: string;
  retainInactivePatients: boolean;
  inactivePatientDays: number;
  retainCompletedOrders: boolean;
  completedOrderDays: number;
  enableDataExport: boolean;
  exportFormat: string;
  gdprCompliance: boolean;
  rightToErasure: boolean;
  dataMinimization: boolean;
  consentManagement: boolean;
}

interface DataRetentionSettingsProps {
  initialValues?: Partial<DataRetentionSettingsData>;
  saving?: boolean;
  onSave?: (values: DataRetentionSettingsData) => void;
}

const defaults: DataRetentionSettingsData = {
  patientDataRetention: 3650,
  patientDataArchive: true,
  patientDataArchiveDays: 1825,
  resultDataRetention: 3650,
  resultDataArchive: true,
  resultDataArchiveDays: 1825,
  invoiceDataRetention: 2555,
  invoiceDataArchive: true,
  invoiceDataArchiveDays: 1825,
  auditLogRetention: 365,
  auditLogArchive: false,
  auditLogArchiveDays: 90,
  analyzerDataRetention: 365,
  enableAutoPurge: false,
  autoPurgeFrequency: "monthly",
  retainInactivePatients: true,
  inactivePatientDays: 365,
  retainCompletedOrders: true,
  completedOrderDays: 90,
  enableDataExport: true,
  exportFormat: "csv",
  gdprCompliance: false,
  rightToErasure: false,
  dataMinimization: true,
  consentManagement: true,
};

export default function DataRetentionSettings({
  initialValues,
  saving = false,
  onSave,
}: DataRetentionSettingsProps) {
  const [values, setValues] = useState<DataRetentionSettingsData>({
    ...defaults,
    ...initialValues,
  });

  const [saved, setSaved] = useState(false);

  const update = <K extends keyof DataRetentionSettingsData>(
    field: K,
    value: DataRetentionSettingsData[K]
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
    field: keyof DataRetentionSettingsData;
    warning?: boolean;
  }) => {
    const enabled = Boolean(values[field]);

    return (
      <div className={`flex items-start justify-between gap-5 rounded-lg border p-4 ${
        warning ? "border-red-200 bg-red-50" : "border-gray-200"
      }`}>
        <div>
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={() =>
            update(field, !enabled as DataRetentionSettingsData[typeof field])
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

  const RetentionField = ({
    label,
    field,
    archiveField,
    archiveDaysField,
    description,
  }: {
    label: string;
    field: keyof DataRetentionSettingsData;
    archiveField: keyof DataRetentionSettingsData;
    archiveDaysField: keyof DataRetentionSettingsData;
    description: string;
  }) => (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4">
      <SettingsField label={label} description={description}>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="30"
            max="36500"
            value={values[field] as number}
            onChange={(e) => update(field, Number(e.target.value))}
            className="w-32 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
          />
          <span className="text-sm text-gray-500">days</span>
        </div>
      </SettingsField>

      <Toggle
        label="Archive Before Deletion"
        description="Archive data to long-term storage before permanent deletion."
        field={archiveField}
      />

      {values[archiveField] as boolean && (
        <SettingsField
          label="Archive After (days)"
          description="Move to archive after this many days."
        >
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="30"
              max={(values[field] as number) - 30}
              value={values[archiveDaysField] as number}
              onChange={(e) => update(archiveDaysField, Number(e.target.value))}
              className="w-32 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />
            <span className="text-sm text-gray-500">days</span>
          </div>
        </SettingsField>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Patient Data Retention */}
      <SettingsSection
        title="Patient Data Retention"
        description="Configure how long patient records are retained before deletion."
      >
        <RetentionField
          label="Patient Data Retention Period"
          field="patientDataRetention"
          archiveField="patientDataArchive"
          archiveDaysField="patientDataArchiveDays"
          description="Number of days to retain patient records before deletion."
        />
      </SettingsSection>

      {/* Result Data Retention */}
      <SettingsSection
        title="Result Data Retention"
        description="Configure retention policies for laboratory test results."
      >
        <RetentionField
          label="Result Data Retention Period"
          field="resultDataRetention"
          archiveField="resultDataArchive"
          archiveDaysField="resultDataArchiveDays"
          description="Number of days to retain test results before deletion."
        />
      </SettingsSection>

      {/* Invoice Data Retention */}
      <SettingsSection
        title="Invoice Data Retention"
        description="Configure retention policies for billing and invoice records."
      >
        <RetentionField
          label="Invoice Data Retention Period"
          field="invoiceDataRetention"
          archiveField="invoiceDataArchive"
          archiveDaysField="invoiceDataArchiveDays"
          description="Number of days to retain invoice records for tax and compliance purposes."
        />
      </SettingsSection>

      {/* Audit Log Retention */}
      <SettingsSection
        title="Audit Log Retention"
        description="Configure retention policies for system audit logs."
      >
        <div className="space-y-3 rounded-lg border border-gray-200 p-4">
          <SettingsField
            label="Audit Log Retention Period"
            description="Number of days to retain audit logs."
          >
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="30"
                max="3650"
                value={values.auditLogRetention}
                onChange={(e) => update("auditLogRetention", Number(e.target.value))}
                className="w-32 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
              />
              <span className="text-sm text-gray-500">days</span>
            </div>
          </SettingsField>

          <Toggle
            label="Archive Audit Logs"
            description="Archive audit logs to long-term storage before deletion."
            field="auditLogArchive"
          />

          {values.auditLogArchive && (
            <SettingsField
              label="Archive After (days)"
              description="Move to archive after this many days."
            >
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="30"
                  max={values.auditLogRetention - 30}
                  value={values.auditLogArchiveDays}
                  onChange={(e) => update("auditLogArchiveDays", Number(e.target.value))}
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
                />
                <span className="text-sm text-gray-500">days</span>
              </div>
            </SettingsField>
          )}
        </div>
      </SettingsSection>

      {/* Analyzer Data Retention */}
      <SettingsSection
        title="Analyzer Data Retention"
        description="Configure retention policies for analyzer instrument data."
      >
        <SettingsField
          label="Analyzer Data Retention Period"
          description="Number of days to retain analyzer calibration and QC data."
        >
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="30"
              max="3650"
              value={values.analyzerDataRetention}
              onChange={(e) => update("analyzerDataRetention", Number(e.target.value))}
              className="w-32 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />
            <span className="text-sm text-gray-500">days</span>
          </div>
        </SettingsField>
      </SettingsSection>

      {/* Automated Data Purge */}
      <SettingsSection
        title="Automated Data Purge"
        description="Configure automatic deletion of expired data."
      >
        <div className="space-y-4">
          <Toggle
            label="Enable Automatic Data Purge"
            description="Automatically delete data that has exceeded retention periods."
            field="enableAutoPurge"
            warning
          />
          {values.enableAutoPurge && (
            <SettingsField label="Purge Frequency">
              <select
                value={values.autoPurgeFrequency}
                onChange={(e) => update("autoPurgeFrequency", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </SettingsField>
          )}
        </div>
      </SettingsSection>

      {/* Special Retention Rules */}
      <SettingsSection
        title="Special Retention Rules"
        description="Configure special retention rules for specific data types."
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <Toggle
              label="Retain Inactive Patients"
              description="Keep patient records even if no activity for extended period."
              field="retainInactivePatients"
            />
            {values.retainInactivePatients && (
              <SettingsField
                label="Inactive Patient Threshold (days)"
                description="Consider patient inactive after this many days without activity."
              >
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="30"
                    max="3650"
                    value={values.inactivePatientDays}
                    onChange={(e) => update("inactivePatientDays", Number(e.target.value))}
                    className="w-32 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
                  />
                  <span className="text-sm text-gray-500">days</span>
                </div>
              </SettingsField>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <Toggle
              label="Retain Completed Orders"
              description="Keep order records even after completion and reporting."
              field="retainCompletedOrders"
            />
            {values.retainCompletedOrders && (
              <SettingsField
                label="Completed Order Retention (days)"
                description="How long to retain completed order records."
              >
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="30"
                    max="3650"
                    value={values.completedOrderDays}
                    onChange={(e) => update("completedOrderDays", Number(e.target.value))}
                    className="w-32 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
                  />
                  <span className="text-sm text-gray-500">days</span>
                </div>
              </SettingsField>
            )}
          </div>
        </div>
      </SettingsSection>

      {/* Data Export */}
      <SettingsSection
        title="Data Export"
        description="Configure data export options for compliance and backup."
      >
        <div className="space-y-4">
          <Toggle
            label="Enable Data Export"
            description="Allow export of data for compliance and backup purposes."
            field="enableDataExport"
          />
          {values.enableDataExport && (
            <SettingsField label="Default Export Format">
              <select
                value={values.exportFormat}
                onChange={(e) => update("exportFormat", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="xml">XML</option>
                <option value="pdf">PDF</option>
              </select>
            </SettingsField>
          )}
        </div>
      </SettingsSection>

      {/* Compliance Settings */}
      <SettingsSection
        title="Compliance Settings"
        description="Configure data privacy and compliance options."
      >
        <div className="space-y-3">
          <Toggle
            label="GDPR Compliance Mode"
            description="Enable GDPR-specific data handling and privacy controls."
            field="gdprCompliance"
          />
          <Toggle
            label="Right to Erasure"
            description="Allow patients to request deletion of their personal data."
            field="rightToErasure"
            warning
          />
          <Toggle
            label="Data Minimization"
            description="Collect and retain only necessary data for laboratory operations."
            field="dataMinimization"
          />
          <Toggle
            label="Consent Management"
            description="Track and manage patient consent for data processing."
            field="consentManagement"
          />
        </div>
      </SettingsSection>

      {/* Save Button */}
      <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {saved && (
          <p className="mr-auto text-sm font-medium text-green-600">
            ✓ Data retention settings saved successfully
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Data Retention Settings"}
        </button>
      </div>
    </div>
  );
}
