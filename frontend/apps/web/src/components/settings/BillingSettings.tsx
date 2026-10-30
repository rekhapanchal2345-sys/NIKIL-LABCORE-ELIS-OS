"use client";

import React, { useState } from "react";
import SettingsSection from "./SettingsSection";
import SettingsField from "./SettingsField";

export interface BillingSettingsData {
  gstEnabled: boolean;
  gstPercentage: number;
  cgstPercentage: number;
  sgstPercentage: number;
  igstPercentage: number;
  taxInclusive: boolean;
  invoicePrefix: string;
  invoiceDueDays: number;
  allowPartialPayments: boolean;
  allowCreditBilling: boolean;
  paymentReceiptRequired: boolean;
  autoGenerateInvoice: boolean;
  defaultPaymentMethod: string;
}

interface BillingSettingsProps {
  initialValues?: Partial<BillingSettingsData>;
  saving?: boolean;
  onSave?: (values: BillingSettingsData) => void;
}

const defaults: BillingSettingsData = {
  gstEnabled: true,
  gstPercentage: 18,
  cgstPercentage: 9,
  sgstPercentage: 9,
  igstPercentage: 18,
  taxInclusive: false,
  invoicePrefix: "INV",
  invoiceDueDays: 0,
  allowPartialPayments: true,
  allowCreditBilling: false,
  paymentReceiptRequired: true,
  autoGenerateInvoice: true,
  defaultPaymentMethod: "CASH",
};

export default function BillingSettings({
  initialValues,
  saving = false,
  onSave,
}: BillingSettingsProps) {
  const [values, setValues] =
    useState<BillingSettingsData>({
      ...defaults,
      ...initialValues,
    });

  const [saved, setSaved] = useState(false);

  const update = <
    K extends keyof BillingSettingsData
  >(
    field: K,
    value: BillingSettingsData[K]
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
    field: keyof BillingSettingsData;
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
              !enabled as BillingSettingsData[typeof field]
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
        title="Tax Configuration"
        description="Configure GST and tax calculation behavior for invoices."
      >
        <div className="space-y-5">
          <Toggle
            label="Enable GST"
            description="Apply GST calculations to taxable laboratory services."
            field="gstEnabled"
          />

          {values.gstEnabled && (
            <div className="grid gap-5 rounded-lg bg-gray-50 p-4 md:grid-cols-2 lg:grid-cols-4">
              <SettingsField label="GST Percentage">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={values.gstPercentage}
                  onChange={(e) =>
                    update(
                      "gstPercentage",
                      Number(e.target.value)
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
                />
              </SettingsField>

              <SettingsField label="CGST Percentage">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={values.cgstPercentage}
                  onChange={(e) =>
                    update(
                      "cgstPercentage",
                      Number(e.target.value)
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
                />
              </SettingsField>

              <SettingsField label="SGST Percentage">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={values.sgstPercentage}
                  onChange={(e) =>
                    update(
                      "sgstPercentage",
                      Number(e.target.value)
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
                />
              </SettingsField>

              <SettingsField label="IGST Percentage">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={values.igstPercentage}
                  onChange={(e) =>
                    update(
                      "igstPercentage",
                      Number(e.target.value)
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
                />
              </SettingsField>
            </div>
          )}

          <Toggle
            label="Tax Inclusive Pricing"
            description="Treat displayed service prices as including applicable taxes."
            field="taxInclusive"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Invoice Configuration"
        description="Configure invoice numbering and payment terms."
      >
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <SettingsField
            label="Invoice Prefix"
            required
          >
            <input
              type="text"
              value={values.invoicePrefix}
              onChange={(e) =>
                update(
                  "invoicePrefix",
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />
          </SettingsField>

          <SettingsField
            label="Invoice Due Days"
            description="Set 0 for payment due immediately."
          >
            <input
              type="number"
              min="0"
              max="365"
              value={values.invoiceDueDays}
              onChange={(e) =>
                update(
                  "invoiceDueDays",
                  Number(e.target.value)
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />
          </SettingsField>

          <SettingsField label="Default Payment Method">
            <select
              value={values.defaultPaymentMethod}
              onChange={(e) =>
                update(
                  "defaultPaymentMethod",
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            >
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">
                Bank Transfer
              </option>
              <option value="CHEQUE">Cheque</option>
              <option value="ONLINE">Online</option>
            </select>
          </SettingsField>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Payment Controls"
        description="Control payment and credit billing behavior."
      >
        <div className="space-y-3">
          <Toggle
            label="Allow Partial Payments"
            description="Allow patients to pay an invoice in multiple installments."
            field="allowPartialPayments"
          />

          <Toggle
            label="Allow Credit Billing"
            description="Allow authorized staff to create invoices without immediate payment."
            field="allowCreditBilling"
          />

          <Toggle
            label="Payment Receipt Required"
            description="Require a payment receipt for recorded payments."
            field="paymentReceiptRequired"
          />

          <Toggle
            label="Auto-generate Invoice"
            description="Automatically create an invoice when an order is registered."
            field="autoGenerateInvoice"
          />
        </div>
      </SettingsSection>

      <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {saved && (
          <p className="mr-auto text-sm font-medium text-green-600">
            ✓ Billing settings saved successfully
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Billing Settings"}
        </button>
      </div>
    </div>
  );
}