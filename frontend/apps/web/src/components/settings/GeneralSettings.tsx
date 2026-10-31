"use client";

import React, { FormEvent, useState } from "react";
import SettingsSection from "./SettingsSection";
import SettingsField from "./SettingsField";

export interface GeneralSettingsData {
  laboratoryName: string;
  legalName: string;
  registrationNumber: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
  numberFormat: string;
  firstDayOfWeek: string;
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: string[];
  holidays: string[];
}

interface GeneralSettingsProps {
  initialValues?: Partial<GeneralSettingsData>;
  loading?: boolean;
  saving?: boolean;
  onSave?: (values: GeneralSettingsData) => void;
}

const defaultValues: GeneralSettingsData = {
  laboratoryName: "",
  legalName: "",
  registrationNumber: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  timezone: "Asia/Kolkata",
  currency: "INR",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
  language: "English",
  numberFormat: "indian",
  firstDayOfWeek: "monday",
  workingHours: {
    start: "09:00",
    end: "18:00",
  },
  workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
  holidays: [],
};

// ─── Shared input class strings ───────────────────────────────────────────────
const inputCls =
  "w-full rounded-md border border-slate-200 bg-white py-2 px-3 text-sm text-slate-900 placeholder:text-slate-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors duration-150";

const selectCls =
  "w-full rounded-md border border-slate-200 bg-white py-2 px-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors duration-150 appearance-none";

const textareaCls =
  "w-full rounded-md border border-slate-200 bg-white py-2 px-3 text-sm text-slate-900 placeholder:text-slate-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 resize-y transition-colors duration-150";

export default function GeneralSettings({
  initialValues,
  loading = false,
  saving = false,
  onSave,
}: GeneralSettingsProps) {
  const [values, setValues] = useState<GeneralSettingsData>({
    ...defaultValues,
    ...initialValues,
  });

  const updateField = <K extends keyof GeneralSettingsData>(
    field: K,
    value: GeneralSettingsData[K]
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave?.(values);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, fieldIndex) => (
                <div key={fieldIndex} className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                  <div className="h-9 w-full animate-pulse rounded-lg bg-slate-50" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Laboratory Information */}
      <SettingsSection
        title="Laboratory Information"
        description="Basic information displayed across the LabCore ELIS system."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <SettingsField label="Laboratory Name" required>
            <input
              type="text"
              value={values.laboratoryName}
              onChange={(e) => updateField("laboratoryName", e.target.value)}
              placeholder="Enter laboratory name"
              required
              className={inputCls}
            />
          </SettingsField>

          <SettingsField
            label="Legal Name"
            description="Registered legal name of the laboratory."
          >
            <input
              type="text"
              value={values.legalName}
              onChange={(e) => updateField("legalName", e.target.value)}
              placeholder="Legal entity name"
              className={inputCls}
            />
          </SettingsField>

          <SettingsField label="Registration Number">
            <input
              type="text"
              value={values.registrationNumber}
              onChange={(e) => updateField("registrationNumber", e.target.value)}
              placeholder="Laboratory registration number"
              className={inputCls}
            />
          </SettingsField>

          <SettingsField label="Website">
            <input
              type="url"
              value={values.website}
              onChange={(e) => updateField("website", e.target.value)}
              placeholder="https://example.com"
              className={inputCls}
            />
          </SettingsField>
        </div>
      </SettingsSection>

      {/* Contact Information */}
      <SettingsSection
        title="Contact Information"
        description="Contact details used for reports, invoices and laboratory communication."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <SettingsField label="Email Address" required>
            <input
              type="email"
              value={values.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="lab@example.com"
              required
              className={inputCls}
            />
          </SettingsField>

          <SettingsField label="Phone Number">
            <input
              type="tel"
              value={values.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+91 98765 43210"
              className={inputCls}
            />
          </SettingsField>
        </div>
      </SettingsSection>

      {/* Address */}
      <SettingsSection
        title="Laboratory Address"
        description="Address printed on invoices and laboratory reports."
      >
        <div className="space-y-5">
          <SettingsField label="Address">
            <textarea
              value={values.address}
              onChange={(e) => updateField("address", e.target.value)}
              rows={3}
              placeholder="Enter complete laboratory address"
              className={textareaCls}
            />
          </SettingsField>

          <div className="grid gap-5 md:grid-cols-3">
            <SettingsField label="City">
              <input
                type="text"
                value={values.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="City"
                className={inputCls}
              />
            </SettingsField>

            <SettingsField label="State">
              <input
                type="text"
                value={values.state}
                onChange={(e) => updateField("state", e.target.value)}
                placeholder="State"
                className={inputCls}
              />
            </SettingsField>

            <SettingsField label="PIN Code">
              <input
                type="text"
                value={values.pincode}
                onChange={(e) => updateField("pincode", e.target.value)}
                placeholder="380001"
                inputMode="numeric"
                className={inputCls}
              />
            </SettingsField>
          </div>
        </div>
      </SettingsSection>

      {/* Regional Settings */}
      <SettingsSection
        title="Regional Settings"
        description="Control date, currency and timezone defaults."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <SettingsField label="Country">
            <select
              value={values.country}
              onChange={(e) => updateField("country", e.target.value)}
              className={selectCls}
            >
              <option value="India">India</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="United Arab Emirates">United Arab Emirates</option>
              <option value="Singapore">Singapore</option>
            </select>
          </SettingsField>

          <SettingsField label="Timezone">
            <select
              value={values.timezone}
              onChange={(e) => updateField("timezone", e.target.value)}
              className={selectCls}
            >
              <option value="Asia/Kolkata">Asia/Kolkata</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Asia/Dubai">Asia/Dubai</option>
              <option value="Asia/Singapore">Asia/Singapore</option>
            </select>
          </SettingsField>

          <SettingsField label="Currency">
            <select
              value={values.currency}
              onChange={(e) => updateField("currency", e.target.value)}
              className={selectCls}
            >
              <option value="INR">INR — Indian Rupee</option>
              <option value="USD">USD — US Dollar</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="AED">AED — UAE Dirham</option>
              <option value="SGD">SGD — Singapore Dollar</option>
            </select>
          </SettingsField>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <SettingsField label="Date Format">
            <select
              value={values.dateFormat}
              onChange={(e) => updateField("dateFormat", e.target.value)}
              className={selectCls}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="DD-MMM-YYYY">DD-MMM-YYYY</option>
            </select>
          </SettingsField>

          <SettingsField label="Time Format">
            <select
              value={values.timeFormat}
              onChange={(e) => updateField("timeFormat", e.target.value)}
              className={selectCls}
            >
              <option value="24h">24 Hour (14:30)</option>
              <option value="12h">12 Hour (2:30 PM)</option>
            </select>
          </SettingsField>

          <SettingsField label="Language">
            <select
              value={values.language}
              onChange={(e) => updateField("language", e.target.value)}
              className={selectCls}
            >
              <option value="English">English</option>
              <option value="Hindi">हिंदी (Hindi)</option>
              <option value="Gujarati">ગુજરાતી (Gujarati)</option>
              <option value="Marathi">मराठी (Marathi)</option>
              <option value="Tamil">தமிழ் (Tamil)</option>
              <option value="Telugu">తెలుగు (Telugu)</option>
            </select>
          </SettingsField>

          <SettingsField label="Number Format">
            <select
              value={values.numberFormat}
              onChange={(e) => updateField("numberFormat", e.target.value)}
              className={selectCls}
            >
              <option value="indian">Indian (1,00,000.00)</option>
              <option value="international">International (100,000.00)</option>
              <option value="european">European (100.000,00)</option>
            </select>
          </SettingsField>

          <SettingsField label="First Day of Week">
            <select
              value={values.firstDayOfWeek}
              onChange={(e) => updateField("firstDayOfWeek", e.target.value)}
              className={selectCls}
            >
              <option value="monday">Monday</option>
              <option value="sunday">Sunday</option>
              <option value="saturday">Saturday</option>
            </select>
          </SettingsField>
        </div>
      </SettingsSection>

      {/* Working Hours */}
      <SettingsSection
        title="Working Hours"
        description="Configure laboratory operating hours and working days."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <SettingsField label="Start Time">
            <input
              type="time"
              value={values.workingHours.start}
              onChange={(e) =>
                setValues((current) => ({
                  ...current,
                  workingHours: {
                    ...current.workingHours,
                    start: e.target.value,
                  },
                }))
              }
              className={inputCls}
            />
          </SettingsField>

          <SettingsField label="End Time">
            <input
              type="time"
              value={values.workingHours.end}
              onChange={(e) =>
                setValues((current) => ({
                  ...current,
                  workingHours: {
                    ...current.workingHours,
                    end: e.target.value,
                  },
                }))
              }
              className={inputCls}
            />
          </SettingsField>
        </div>

        <div className="mt-5">
          <SettingsField label="Working Days">
            <div className="flex flex-wrap gap-2 pt-0.5">
              {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(
                (day) => {
                  const isChecked = values.workingDays.includes(day);
                  return (
                    <label
                      key={day}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 capitalize text-sm font-medium select-none transition-colors ${
                        isChecked
                          ? "border-sky-700 bg-sky-700 text-white"
                          : "border-slate-200 text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setValues((current) => ({
                              ...current,
                              workingDays: [...current.workingDays, day],
                            }));
                          } else {
                            setValues((current) => ({
                              ...current,
                              workingDays: current.workingDays.filter(
                                (d) => d !== day
                              ),
                            }));
                          }
                        }}
                        className="hidden"
                      />
                      {day}
                    </label>
                  );
                }
              )}
            </div>
          </SettingsField>
        </div>
      </SettingsSection>

      {/*
        NOTE: The global Save/Discard actions are handled by SettingsLayout's
        sticky header and bottom banner. No local save button is rendered here.
      */}
    </form>
  );
}
