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

export default function GeneralSettings({
  initialValues,
  loading = false,
  saving = false,
  onSave,
}: GeneralSettingsProps) {
  const [values, setValues] =
    useState<GeneralSettingsData>({
      ...defaultValues,
      ...initialValues,
    });

  const [saved, setSaved] = useState(false);

  const updateField = <
    K extends keyof GeneralSettingsData
  >(
    field: K,
    value: GeneralSettingsData[K]
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSave?.(values);

    if (!onSave) {
      setSaved(true);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {Array.from({ length: 4 }).map(
                (_, fieldIndex) => (
                  <div
                    key={fieldIndex}
                    className="space-y-2"
                  >
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                    <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Laboratory Information */}

      <SettingsSection
        title="Laboratory Information"
        description="Basic information displayed across the LabCore ELIS system."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <SettingsField
            label="Laboratory Name"
            required
          >
            <input
              type="text"
              value={values.laboratoryName}
              onChange={(e) =>
                updateField(
                  "laboratoryName",
                  e.target.value
                )
              }
              placeholder="Enter laboratory name"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />
          </SettingsField>

          <SettingsField
            label="Legal Name"
            description="Registered legal name of the laboratory."
          >
            <input
              type="text"
              value={values.legalName}
              onChange={(e) =>
                updateField(
                  "legalName",
                  e.target.value
                )
              }
              placeholder="Legal entity name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />
          </SettingsField>

          <SettingsField
            label="Registration Number"
          >
            <input
              type="text"
              value={values.registrationNumber}
              onChange={(e) =>
                updateField(
                  "registrationNumber",
                  e.target.value
                )
              }
              placeholder="Laboratory registration number"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />
          </SettingsField>

          <SettingsField
            label="Website"
          >
            <input
              type="url"
              value={values.website}
              onChange={(e) =>
                updateField(
                  "website",
                  e.target.value
                )
              }
              placeholder="https://example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
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
          <SettingsField
            label="Email Address"
            required
          >
            <input
              type="email"
              value={values.email}
              onChange={(e) =>
                updateField(
                  "email",
                  e.target.value
                )
              }
              placeholder="lab@example.com"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />
          </SettingsField>

          <SettingsField label="Phone Number">
            <input
              type="tel"
              value={values.phone}
              onChange={(e) =>
                updateField(
                  "phone",
                  e.target.value
                )
              }
              placeholder="+91 98765 43210"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
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
              onChange={(e) =>
                updateField(
                  "address",
                  e.target.value
                )
              }
              rows={3}
              placeholder="Enter complete laboratory address"
              className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />
          </SettingsField>

          <div className="grid gap-5 md:grid-cols-3">
            <SettingsField label="City">
              <input
                type="text"
                value={values.city}
                onChange={(e) =>
                  updateField(
                    "city",
                    e.target.value
                  )
                }
                placeholder="City"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
              />
            </SettingsField>

            <SettingsField label="State">
              <input
                type="text"
                value={values.state}
                onChange={(e) =>
                  updateField(
                    "state",
                    e.target.value
                  )
                }
                placeholder="State"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
              />
            </SettingsField>

            <SettingsField label="PIN Code">
              <input
                type="text"
                value={values.pincode}
                onChange={(e) =>
                  updateField(
                    "pincode",
                    e.target.value
                  )
                }
                placeholder="380001"
                inputMode="numeric"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
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
              onChange={(e) =>
                updateField(
                  "country",
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            >
              <option value="India">India</option>
              <option value="United States">
                United States
              </option>
              <option value="United Kingdom">
                United Kingdom
              </option>
              <option value="United Arab Emirates">
                United Arab Emirates
              </option>
              <option value="Singapore">
                Singapore
              </option>
            </select>
          </SettingsField>

          <SettingsField label="Timezone">
            <select
              value={values.timezone}
              onChange={(e) =>
                updateField(
                  "timezone",
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            >
              <option value="Asia/Kolkata">
                Asia/Kolkata
              </option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">
                America/New_York
              </option>
              <option value="Europe/London">
                Europe/London
              </option>
              <option value="Asia/Dubai">
                Asia/Dubai
              </option>
              <option value="Asia/Singapore">
                Asia/Singapore
              </option>
            </select>
          </SettingsField>

          <SettingsField label="Currency">
            <select
              value={values.currency}
              onChange={(e) =>
                updateField(
                  "currency",
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            >
              <option value="INR">
                INR — Indian Rupee
              </option>
              <option value="USD">
                USD — US Dollar
              </option>
              <option value="GBP">
                GBP — British Pound
              </option>
              <option value="AED">
                AED — UAE Dirham
              </option>
              <option value="SGD">
                SGD — Singapore Dollar
              </option>
            </select>
          </SettingsField>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <SettingsField label="Date Format">
            <select
              value={values.dateFormat}
              onChange={(e) =>
                updateField(
                  "dateFormat",
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            >
              <option value="DD/MM/YYYY">
                DD/MM/YYYY
              </option>
              <option value="MM/DD/YYYY">
                MM/DD/YYYY
              </option>
              <option value="YYYY-MM-DD">
                YYYY-MM-DD
              </option>
              <option value="DD-MMM-YYYY">
                DD-MMM-YYYY
              </option>
            </select>
          </SettingsField>

          <SettingsField label="Time Format">
            <select
              value={values.timeFormat}
              onChange={(e) =>
                updateField(
                  "timeFormat",
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            >
              <option value="24h">24 Hour (14:30)</option>
              <option value="12h">12 Hour (2:30 PM)</option>
            </select>
          </SettingsField>

          <SettingsField label="Language">
            <select
              value={values.language}
              onChange={(e) =>
                updateField(
                  "language",
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
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
              onChange={(e) =>
                updateField(
                  "numberFormat",
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            >
              <option value="indian">Indian (1,00,000.00)</option>
              <option value="international">International (100,000.00)</option>
              <option value="european">European (100.000,00)</option>
            </select>
          </SettingsField>

          <SettingsField label="First Day of Week">
            <select
              value={values.firstDayOfWeek}
              onChange={(e) =>
                updateField(
                  "firstDayOfWeek",
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />
          </SettingsField>
        </div>

        <div className="mt-5">
          <SettingsField label="Working Days">
            <div className="flex flex-wrap gap-3">
              {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                <label
                  key={day}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 capitalize ${
                    values.workingDays.includes(day)
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={values.workingDays.includes(day)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setValues((current) => ({
                          ...current,
                          workingDays: [...current.workingDays, day],
                        }));
                      } else {
                        setValues((current) => ({
                          ...current,
                          workingDays: current.workingDays.filter((d) => d !== day),
                        }));
                      }
                    }}
                    className="hidden"
                  />
                  <span className="text-sm">{day}</span>
                </label>
              ))}
            </div>
          </SettingsField>
        </div>
      </SettingsSection>

      {/* Save */}

      <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {saved && (
          <p className="mr-auto text-sm font-medium text-green-600">
            ✓ Settings saved successfully
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}