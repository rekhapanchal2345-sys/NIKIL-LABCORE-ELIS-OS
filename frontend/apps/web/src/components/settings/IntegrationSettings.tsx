"use client";

import React, { useState } from "react";
import SettingsSection from "./SettingsSection";
import SettingsField from "./SettingsField";

export interface IntegrationSettingsData {
  apiEnabled: boolean;
  apiBaseUrl: string;
  webhookEnabled: boolean;
  webhookUrl: string;
  hl7Enabled: boolean;
  astmEnabled: boolean;
  analyzerAutoSync: boolean;
  emailProvider: string;
  smsProvider: string;
}

interface IntegrationSettingsProps {
  initialValues?: Partial<IntegrationSettingsData>;
  saving?: boolean;
  onSave?: (values: IntegrationSettingsData) => void;
}

const defaults: IntegrationSettingsData = {
  apiEnabled: true,
  apiBaseUrl: "",
  webhookEnabled: false,
  webhookUrl: "",
  hl7Enabled: false,
  astmEnabled: false,
  analyzerAutoSync: true,
  emailProvider: "SMTP",
  smsProvider: "NONE",
};

export default function IntegrationSettings({
  initialValues,
  saving = false,
  onSave,
}: IntegrationSettingsProps) {
  const [values, setValues] =
    useState<IntegrationSettingsData>({
      ...defaults,
      ...initialValues,
    });

  const [saved, setSaved] = useState(false);

  const update = <
    K extends keyof IntegrationSettingsData
  >(
    field: K,
    value: IntegrationSettingsData[K]
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
  }: {
    label: string;
    description: string;
    field: keyof IntegrationSettingsData;
  }) => {
    const enabled = Boolean(values[field]);

    return (
      <div className="flex items-start justify-between gap-5 rounded-lg border border-gray-200 p-4">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {label}
          </p>

          <p className="mt-1 text-xs leading-5 text-gray-500">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            update(
              field,
              !enabled as IntegrationSettingsData[typeof field]
            )
          }
          className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
            enabled
              ? "bg-gray-900"
              : "bg-gray-300"
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
      <SettingsSection
        title="API Integration"
        description="Configure external application access to the LabCore API."
      >
        <div className="space-y-4">
          <Toggle
            label="Enable API Access"
            description="Allow authorized external applications to communicate with LabCore."
            field="apiEnabled"
          />

          {values.apiEnabled && (
            <SettingsField
              label="API Base URL"
              description="Base URL used by external integrations."
            >
              <input
                type="url"
                value={values.apiBaseUrl}
                onChange={(e) =>
                  update(
                    "apiBaseUrl",
                    e.target.value
                  )
                }
                placeholder="https://api.example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
              />
            </SettingsField>
          )}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Webhooks"
        description="Send laboratory events to an external system."
      >
        <div className="space-y-4">
          <Toggle
            label="Enable Webhooks"
            description="Send configured events to the external webhook endpoint."
            field="webhookEnabled"
          />

          {values.webhookEnabled && (
            <SettingsField
              label="Webhook URL"
              required
            >
              <input
                type="url"
                value={values.webhookUrl}
                onChange={(e) =>
                  update(
                    "webhookUrl",
                    e.target.value
                  )
                }
                placeholder="https://example.com/webhooks/labcore"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
              />
            </SettingsField>
          )}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Analyzer Interfaces"
        description="Configure communication protocols used by laboratory analyzers."
      >
        <div className="space-y-3">
          <Toggle
            label="HL7 Interface"
            description="Enable HL7-based analyzer and healthcare system integration."
            field="hl7Enabled"
          />

          <Toggle
            label="ASTM Interface"
            description="Enable ASTM communication for supported laboratory analyzers."
            field="astmEnabled"
          />

          <Toggle
            label="Analyzer Auto Sync"
            description="Automatically synchronize supported analyzer data."
            field="analyzerAutoSync"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Communication Providers"
        description="Select the providers used for system-generated messages."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <SettingsField label="Email Provider">
            <select
              value={values.emailProvider}
              onChange={(e) =>
                update(
                  "emailProvider",
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            >
              <option value="SMTP">SMTP</option>
              <option value="SENDGRID">
                SendGrid
              </option>
              <option value="AWS_SES">
                Amazon SES
              </option>
              <option value="RESEND">Resend</option>
              <option value="NONE">None</option>
            </select>
          </SettingsField>

          <SettingsField label="SMS Provider">
            <select
              value={values.smsProvider}
              onChange={(e) =>
                update(
                  "smsProvider",
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            >
              <option value="NONE">None</option>
              <option value="TWILIO">Twilio</option>
              <option value="MSG91">MSG91</option>
              <option value="AWS_SNS">
                Amazon SNS
              </option>
            </select>
          </SettingsField>
        </div>
      </SettingsSection>

      <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {saved && (
          <p className="mr-auto text-sm font-medium text-green-600">
            ✓ Integration settings saved successfully
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Save Integration Settings"}
        </button>
      </div>
    </div>
  );
}