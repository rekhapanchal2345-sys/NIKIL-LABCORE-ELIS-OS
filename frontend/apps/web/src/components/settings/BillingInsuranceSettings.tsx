"use client";

import React, { useState, useCallback } from "react";
import {
  CreditCard,
  Landmark,
  Tag,
  ScrollText,
  Stethoscope,
  QrCode,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Building,
  ShieldCheck,
  Percent,
  Receipt,
  FileCheck,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import type {
  BillingSettingsData,
  TariffCategory,
  GovernmentScheme,
} from "@/types/settings";

const INPUT_CLS =
  "w-full rounded-lg border border-slate-200 bg-white py-2 px-3.5 text-sm text-slate-900 placeholder:text-slate-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all duration-150";

const SELECT_CLS =
  "w-full rounded-lg border border-slate-200 bg-white py-2 px-3.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all duration-150 appearance-none";

function FieldLabel({
  label,
  required,
  hint,
}: {
  label: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-1 mb-1">
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {hint && (
        <span title={hint} className="cursor-help">
          <Info className="h-3 w-3 text-slate-400" />
        </span>
      )}
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  badge,
  badgeVariant = "blue",
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "blue" | "green" | "amber" | "red";
  children: React.ReactNode;
}) {
  const badgeClasses = {
    blue: "bg-sky-50 text-sky-700 border-sky-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
  }[badgeVariant];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-6">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-sky-600 shadow-xs">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        {badge && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClasses}`}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const DEFAULT_TARIFFS: TariffCategory[] = [
  {
    id: "tariff-1",
    categoryCode: "WALK_IN_STD",
    categoryName: "General Walk-in / OPD",
    description: "Standard hospital laboratory rack rates for self-paying outpatient cases.",
    discountPercent: 0,
    creditDays: 0,
    isActive: true,
  },
  {
    id: "tariff-2",
    categoryCode: "INHOUSE_IPD",
    categoryName: "In-House IPD / Emergency",
    description: "Admitted ward, ICU, and emergency patient tariff list with STAT charges.",
    discountPercent: 0,
    creditDays: 30,
    isActive: true,
  },
  {
    id: "tariff-3",
    categoryCode: "CORP_TIEUP",
    categoryName: "Corporate Executive Wellness",
    description: "Annual health checkup packages and corporate pre-employment panels.",
    discountPercent: 15,
    creditDays: 45,
    isActive: true,
  },
  {
    id: "tariff-4",
    categoryCode: "TPA_CASHLESS",
    categoryName: "TPA & Private Health Insurance",
    description: "Pre-authorized cashless diagnostic workup negotiated tariff rates.",
    discountPercent: 10,
    creditDays: 60,
    isActive: true,
  },
];

const DEFAULT_SCHEMES: GovernmentScheme[] = [
  {
    id: "scheme-cghs",
    schemeName: "Central Government Health Scheme (CGHS)",
    schemeCode: "CGHS-DEL-2026",
    authorityName: "Ministry of Health & Family Welfare, Govt of India",
    empanelmentNo: "CGHS/HQ/EMP/2024/9812",
    validUntil: "2027-12-31",
    rateListVersion: "CGHS-NABL-2024-V2",
    claimSubmissionMode: "ONLINE_PORTAL",
    claimCycleFrequency: "Bi-weekly",
    isActive: true,
  },
  {
    id: "scheme-echs",
    schemeName: "Ex-Servicemen Contributory Health Scheme (ECHS)",
    schemeCode: "ECHS-NORTH-ZONE",
    authorityName: "Department of Ex-Servicemen Welfare, MoD",
    empanelmentNo: "ECHS/EMP/DL/7721",
    validUntil: "2028-06-30",
    rateListVersion: "ECHS-STANDARD-REV4",
    claimSubmissionMode: "ONLINE_PORTAL",
    claimCycleFrequency: "Monthly",
    isActive: true,
  },
  {
    id: "scheme-pmjay",
    schemeName: "Ayushman Bharat PM-JAY (Golden Card)",
    schemeCode: "AB-PMJAY-NAT",
    authorityName: "National Health Authority (NHA)",
    empanelmentNo: "NHA/PMJAY/HOSP/DL00441",
    validUntil: "2029-03-31",
    rateListVersion: "HBP-2.2-DIAGNOSTIC",
    claimSubmissionMode: "ONLINE_PORTAL",
    claimCycleFrequency: "Weekly",
    isActive: true,
  },
];

const DEFAULT_BILLING_SETTINGS: BillingSettingsData = {
  gstEnabled: true,
  gstin: "07AAAAA0000A1Z5",
  panNumber: "AAAAA0000A",
  tanNumber: "DELA00000A",
  clinicalServicesExempt: true,
  sacCode: "9993",
  cgstPercent: 0,
  sgstPercent: 0,
  igstPercent: 0,
  taxInclusive: false,
  invoicePrefix: "INV/26-27/",
  receiptPrefix: "REC/26-27/",
  creditNotePrefix: "CRN/26-27/",
  currentFinancialYear: "2026-2027",
  autoSequenceReset: true,
  tariffCategories: DEFAULT_TARIFFS,
  maxWalkInDiscountPercent: 10,
  discountOtpThresholdPercent: 15,
  requireApprovalForFreeService: true,
  statEmergencySurchargePercent: 25,
  homeCollectionCharge: 150,
  governmentSchemes: DEFAULT_SCHEMES,
  cghsEmpanelled: true,
  echsEmpanelled: true,
  pmjayEmpanelled: true,
  upiMerchantVpa: "labcore.hospital@icici",
  upiQrCodeType: "DYNAMIC",
  posTerminalEnabled: true,
  posTerminalIp: "192.168.1.185",
  posTerminalMerchantId: "PL_POS_009944",
  posProvider: "PINELABS",
  allowPartialPayments: true,
  allowCreditBilling: true,
  invoiceDueDays: 30,
  bankAccountDetails: "ICICI Bank - Current A/c No: 000405001294 (Connaught Place Branch)",
  ifscCode: "ICIC0000004",
};

interface BillingInsuranceSettingsProps {
  subSection?: string;
  initialValues?: Partial<BillingSettingsData>;
  saving?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onSave?: (values: BillingSettingsData) => void;
}

export default function BillingInsuranceSettings({
  subSection,
  initialValues,
  saving = false,
  onDirtyChange,
  onSave,
}: BillingInsuranceSettingsProps) {
  const [data, setData] = useState<BillingSettingsData>(() => ({
    ...DEFAULT_BILLING_SETTINGS,
    ...initialValues,
  }));

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (subSection === "billing-tariffs") return "tariffs";
    if (subSection === "billing-tax") return "tax";
    if (subSection === "billing-schemes") return "schemes";
    if (subSection === "billing-payments") return "payments";
    if (subSection === "billing-concession") return "concession";
    return "tariffs";
  });

  
  React.useEffect(() => {
    if (subSection === "billing-tariffs") setActiveTab("tariffs");
    else if (subSection === "billing-tax") setActiveTab("tax");
    else if (subSection === "billing-schemes") setActiveTab("schemes");
    else if (subSection === "billing-payments") setActiveTab("payments");
    else if (subSection === "billing-concession") setActiveTab("concession");
  }, [subSection]);

  const markDirty = useCallback(() => {
    onDirtyChange?.(true);
  }, [onDirtyChange]);

  const updateField = <K extends keyof BillingSettingsData>(
    field: K,
    value: BillingSettingsData[K]
  ) => {
    setData((prev) => {
      const next = { ...prev, [field]: value };
      markDirty();
      onSave?.(next);
      return next;
    });
  };

  // Tariff management
  const updateTariff = (id: string, updates: Partial<TariffCategory>) => {
    setData((prev) => {
      const nextTariffs = prev.tariffCategories.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      );
      const next = { ...prev, tariffCategories: nextTariffs };
      markDirty();
      onSave?.(next);
      return next;
    });
  };

  const addTariff = () => {
    const newId = `tariff-${Date.now()}`;
    const newTariff: TariffCategory = {
      id: newId,
      categoryCode: "NEW_RATE",
      categoryName: "Custom Tariff Category",
      description: "Custom negotiated diagnostic pricing list.",
      discountPercent: 0,
      creditDays: 30,
      isActive: true,
    };
    setData((prev) => {
      const next = {
        ...prev,
        tariffCategories: [...prev.tariffCategories, newTariff],
      };
      markDirty();
      onSave?.(next);
      return next;
    });
  };

  const removeTariff = (id: string) => {
    setData((prev) => {
      const next = {
        ...prev,
        tariffCategories: prev.tariffCategories.filter((t) => t.id !== id),
      };
      markDirty();
      onSave?.(next);
      return next;
    });
  };

  // Scheme toggle
  const toggleScheme = (id: string) => {
    setData((prev) => {
      const nextSchemes = prev.governmentSchemes.map((s) =>
        s.id === id ? { ...s, isActive: !s.isActive } : s
      );
      const next = { ...prev, governmentSchemes: nextSchemes };
      markDirty();
      onSave?.(next);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Domain Header Banner */}
      <div className="rounded-xl border border-amber-200 bg-linear-to-r from-amber-50/70 via-white to-sky-50/40 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Billing, Tariffs, Insurance & Statutory Taxes
                </h2>
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  <ScrollText className="h-3 w-3" />
                  SAC 9993 Healthcare Exempt
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Multi-tier tariff schedules, GST & statutory tax parameters, AB-PMJAY / CGHS empanelment, and UPI / POS hardware terminals.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 border border-emerald-200">
              FY {data.currentFinancialYear} Active
            </span>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("tariffs")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "tariffs"
              ? "bg-amber-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Landmark className="h-3.5 w-3.5" />
          Tariff Schedules & Rate Lists
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tax")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "tax"
              ? "bg-amber-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ScrollText className="h-3.5 w-3.5" />
          GST, Invoicing & Discounts
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("schemes")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "schemes"
              ? "bg-amber-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Stethoscope className="h-3.5 w-3.5" />
          Govt Schemes & TPA Insurance
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "payments"
              ? "bg-amber-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <QrCode className="h-3.5 w-3.5" />
          Payment Gateways & POS
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("concession")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "concession"
              ? "bg-amber-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Tag className="h-3.5 w-3.5" />
          Concession & Discount Rules
        </button>
      </div>

      {/* TAB 1: Tariff Schedules & Rate Lists */}
      {(activeTab === "tariffs" || subSection === "billing-tariffs") && (
        <div className="space-y-6">
          <SectionCard
            title="Multi-Tier Tariff Master"
            description="Configure differential pricing schedules for Walk-in, In-house IPD, Corporate tie-ups, and Cashless TPAs."
            icon={Landmark}
            badge="4 Active Lists"
            badgeVariant="blue"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Each patient registration resolves test prices according to their assigned tariff tier.
                </p>
                <button
                  type="button"
                  onClick={addTariff}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Tariff Tier
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Tariff Code</th>
                      <th className="py-2.5 px-3">Schedule Name</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Baseline Adj. (%)</th>
                      <th className="py-2.5 px-3">Credit Term (Days)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.tariffCategories.map((tariff) => (
                      <tr key={tariff.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-mono font-medium text-slate-800">
                          <input
                            type="text"
                            value={tariff.categoryCode}
                            onChange={(e) =>
                              updateTariff(tariff.id, {
                                categoryCode: e.target.value.toUpperCase(),
                              })
                            }
                            className="w-28 rounded border border-slate-200 px-2 py-1 text-xs uppercase"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={tariff.categoryName}
                            onChange={(e) =>
                              updateTariff(tariff.id, {
                                categoryName: e.target.value,
                              })
                            }
                            className="w-full rounded border border-slate-200 px-2 py-1 text-xs font-medium"
                          />
                        </td>
                        <td className="py-2 px-3 text-slate-500">
                          <input
                            type="text"
                            value={tariff.description}
                            onChange={(e) =>
                              updateTariff(tariff.id, {
                                description: e.target.value,
                              })
                            }
                            className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={tariff.discountPercent}
                              onChange={(e) =>
                                updateTariff(tariff.id, {
                                  discountPercent: Number(e.target.value),
                                })
                              }
                              className="w-16 rounded border border-slate-200 px-2 py-1 text-xs text-right"
                            />
                            <span className="text-slate-400">%</span>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={tariff.creditDays}
                              onChange={(e) =>
                                updateTariff(tariff.id, {
                                  creditDays: Number(e.target.value),
                                })
                              }
                              className="w-14 rounded border border-slate-200 px-2 py-1 text-xs text-right"
                            />
                            <span className="text-slate-400">d</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              updateTariff(tariff.id, {
                                isActive: !tariff.isActive,
                              })
                            }
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              tariff.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                          >
                            {tariff.isActive ? "Active" : "Disabled"}
                          </button>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeTariff(tariff.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete Tariff Tier"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Service Surcharges & Out-of-Hours Diagnostic Rules"
            description="Manage emergency STAT sample add-on fees, nocturnal shift margins, and phlebotomy home collection travel charges."
            icon={Receipt}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <FieldLabel
                  label="Emergency / STAT Surcharge"
                  hint="Applied to lab orders tagged STAT or emergency during triage."
                />
                <div className="relative">
                  <input
                    type="number"
                    value={data.statEmergencySurchargePercent}
                    onChange={(e) =>
                      updateField("statEmergencySurchargePercent", Number(e.target.value))
                    }
                    className={INPUT_CLS}
                  />
                  <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">
                    % Surcharge
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Adds percentage surcharge on base rack rates for priority accessioning.
                </p>
              </div>

              <div>
                <FieldLabel
                  label="Standard Home Collection Charge"
                  hint="Fixed fee added to OPD invoices for phlebotomist home visits."
                />
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={data.homeCollectionCharge}
                    onChange={(e) =>
                      updateField("homeCollectionCharge", Number(e.target.value))
                    }
                    className={`${INPUT_CLS} pl-7`}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Flat logistical transport & consumable fee per home visit accession.
                </p>
              </div>

              <div>
                <FieldLabel
                  label="Credit Billing Payment Grace Period"
                  hint="Standard invoice net credit days allowed for corporate and IPD settlement."
                />
                <div className="relative">
                  <input
                    type="number"
                    value={data.invoiceDueDays}
                    onChange={(e) =>
                      updateField("invoiceDueDays", Number(e.target.value))
                    }
                    className={INPUT_CLS}
                  />
                  <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">
                    Days
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Invoices remain pending until Net 30/60 days aging report escalation.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* TAB 2: GST, Invoicing & Discounts */}
      {(activeTab === "tax" || subSection === "billing-tax") && (
        <div className="space-y-6">
          <SectionCard
            title="GST & Healthcare Statutory Tax Exemption"
            description="Configure GSTIN, PAN, SAC 9993 healthcare exemption clauses, and tax breakdowns for taxable wellness packages."
            icon={ScrollText}
            badge={data.clinicalServicesExempt ? "SAC 9993 Exempt (0% GST)" : "GST Taxable"}
            badgeVariant={data.clinicalServicesExempt ? "green" : "amber"}
          >
            <div className="space-y-5">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                      Statutory Healthcare Exemption (Notification No. 12/2017 - Central Tax)
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1">
                      Health care services by a clinical establishment, an authorized medical practitioner, or para-medics are exempt from GST under <strong>SAC Code 9993</strong>. Diagnostic pathology and radiology tests prescribed for diagnosis/treatment are treated as Nil-rated.
                    </p>
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.clinicalServicesExempt}
                        onChange={(e) =>
                          updateField("clinicalServicesExempt", e.target.checked)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-xs font-semibold text-emerald-950">
                        Enforce Statutory GST Exemption for all Clinical Diagnostic Lab Invoices
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <FieldLabel label="GSTIN (Goods & Services Tax ID)" required />
                  <input
                    type="text"
                    value={data.gstin}
                    onChange={(e) => updateField("gstin", e.target.value.toUpperCase())}
                    className={INPUT_CLS}
                    placeholder="e.g. 07AAAAA0000A1Z5"
                  />
                </div>
                <div>
                  <FieldLabel label="PAN Number (Permanent Account No.)" required />
                  <input
                    type="text"
                    value={data.panNumber}
                    onChange={(e) => updateField("panNumber", e.target.value.toUpperCase())}
                    className={INPUT_CLS}
                    placeholder="e.g. AAAAA0000A"
                  />
                </div>
                <div>
                  <FieldLabel label="TAN Number (Tax Deduction Account)" />
                  <input
                    type="text"
                    value={data.tanNumber}
                    onChange={(e) => updateField("tanNumber", e.target.value.toUpperCase())}
                    className={INPUT_CLS}
                    placeholder="e.g. DELA00000A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <FieldLabel label="SAC / HSN Service Code" />
                  <input
                    type="text"
                    value={data.sacCode}
                    onChange={(e) => updateField("sacCode", e.target.value)}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <FieldLabel label="CGST (%) for Non-Exempt Items" />
                  <input
                    type="number"
                    value={data.cgstPercent}
                    onChange={(e) => updateField("cgstPercent", Number(e.target.value))}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <FieldLabel label="SGST (%) for Non-Exempt Items" />
                  <input
                    type="number"
                    value={data.sgstPercent}
                    onChange={(e) => updateField("sgstPercent", Number(e.target.value))}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <FieldLabel label="IGST (%) for Interstate" />
                  <input
                    type="number"
                    value={data.igstPercent}
                    onChange={(e) => updateField("igstPercent", Number(e.target.value))}
                    className={INPUT_CLS}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Automated Invoicing Sequence & Numbering Rules"
            description="Control sequential fiscal year prefix formatting, receipts, credit notes, and auto-reset mechanisms."
            icon={FileCheck}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <FieldLabel label="Invoice Number Prefix" required />
                  <input
                    type="text"
                    value={data.invoicePrefix}
                    onChange={(e) => updateField("invoicePrefix", e.target.value)}
                    className={INPUT_CLS}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Preview: <span className="font-mono text-slate-800">{data.invoicePrefix}000142</span>
                  </p>
                </div>
                <div>
                  <FieldLabel label="Receipt Number Prefix" required />
                  <input
                    type="text"
                    value={data.receiptPrefix}
                    onChange={(e) => updateField("receiptPrefix", e.target.value)}
                    className={INPUT_CLS}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Preview: <span className="font-mono text-slate-800">{data.receiptPrefix}000851</span>
                  </p>
                </div>
                <div>
                  <FieldLabel label="Credit Note Prefix" required />
                  <input
                    type="text"
                    value={data.creditNotePrefix}
                    onChange={(e) => updateField("creditNotePrefix", e.target.value)}
                    className={INPUT_CLS}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Preview: <span className="font-mono text-slate-800">{data.creditNotePrefix}000012</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Annual Fiscal Year Reset (1st April)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Automatically roll over sequence numbering to 0001 at the commencement of each Indian financial year.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={data.autoSequenceReset}
                    onChange={(e) => updateField("autoSequenceReset", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Discount Authorization Thresholds & Fraud Prevention"
            description="Guard against revenue leakage by enforcing supervisor PIN or OTP approval for high-value billing overrides."
            icon={Percent}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <FieldLabel
                  label="Cashier Max Discretionary Discount"
                  hint="Maximum discount a billing cashier can apply without manager approval."
                />
                <div className="relative">
                  <input
                    type="number"
                    value={data.maxWalkInDiscountPercent}
                    onChange={(e) =>
                      updateField("maxWalkInDiscountPercent", Number(e.target.value))
                    }
                    className={INPUT_CLS}
                  />
                  <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">
                    % Max
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Discounts up to this limit require simple justification selection.
                </p>
              </div>

              <div>
                <FieldLabel
                  label="Supervisor OTP / Approval Threshold"
                  hint="Discounts above this percentage require Chief Accountant or Admin OTP override."
                />
                <div className="relative">
                  <input
                    type="number"
                    value={data.discountOtpThresholdPercent}
                    onChange={(e) =>
                      updateField("discountOtpThresholdPercent", Number(e.target.value))
                    }
                    className={INPUT_CLS}
                  />
                  <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">
                    % OTP Trigger
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Triggers real-time SMS/App prompt to Lab Director or Finance Manager.
                </p>
              </div>

              <div>
                <FieldLabel
                  label="Zero-Bill / Free Service Exemption"
                  hint="Enforce dual approval for non-revenue compassionate or staff tests."
                />
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.requireApprovalForFreeService}
                    onChange={(e) =>
                      updateField("requireApprovalForFreeService", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-xs font-medium text-slate-800">
                    Require Hospital Super Admin Sign-Off for 100% Free Waivers
                  </span>
                </label>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* TAB 3: Govt Schemes & TPA Insurance */}
      {(activeTab === "schemes" || subSection === "billing-schemes") && (
        <div className="space-y-6">
          <SectionCard
            title="Empanelled Health Schemes & Social Security Programs"
            description="Configure empanelment status, rate card versions, and claims submission mechanisms for Ayushman Bharat, CGHS, and ECHS."
            icon={Stethoscope}
            badge="National Empanelment"
            badgeVariant="green"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">AB-PMJAY Empanelled</p>
                      <p className="text-[10px] text-slate-500">Ayushman Bharat NHA</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.pmjayEmpanelled}
                      onChange={(e) => updateField("pmjayEmpanelled", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-sky-200 bg-sky-50/40">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-sky-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">CGHS Empanelled</p>
                      <p className="text-[10px] text-slate-500">Central Govt Employees</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.cghsEmpanelled}
                      onChange={(e) => updateField("cghsEmpanelled", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-sky-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-indigo-200 bg-indigo-50/40">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">ECHS Empanelled</p>
                      <p className="text-[10px] text-slate-500">Defense Ex-Servicemen</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.echsEmpanelled}
                      onChange={(e) => updateField("echsEmpanelled", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {/* Scheme Detail Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Scheme Name</th>
                      <th className="py-2.5 px-3">Empanelment MOA No.</th>
                      <th className="py-2.5 px-3">Validity Expiry</th>
                      <th className="py-2.5 px-3">Active Rate Schedule</th>
                      <th className="py-2.5 px-3">Claims Submission</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.governmentSchemes.map((scheme) => (
                      <tr key={scheme.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-900">{scheme.schemeName}</p>
                          <p className="text-[11px] text-slate-500">{scheme.authorityName}</p>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">
                          {scheme.empanelmentNo}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">
                          {scheme.validUntil}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {scheme.rateListVersion}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800 border border-sky-200">
                              {scheme.claimSubmissionMode}
                            </span>
                            <span className="text-[11px] text-slate-400">({scheme.claimCycleFrequency})</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleScheme(scheme.id)}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              scheme.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                          >
                            {scheme.isActive ? "Empanelled" : "Inactive"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>
        </div>
      )}


      {/* TAB 5: Concession & Discount Rules */}
      {(activeTab === "concession" || subSection === "billing-concession") && (
        <div className="space-y-6">
          {/* Concession Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Senior Citizen Policy</p>
              <p className="text-2xl font-black text-slate-900 mt-1">15%</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Automated on DOB ≥ 60 yrs</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Staff & Dependents</p>
              <p className="text-2xl font-black text-emerald-800 mt-1">50%</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Employee ID verified</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Doctor Discretion</p>
              <p className="text-2xl font-black text-sky-900 mt-1">Up to 20%</p>
              <p className="text-[11px] text-sky-600 mt-0.5">Consultant PIN required</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">MS Approval Required</p>
              <p className="text-2xl font-black text-amber-800 mt-1">&gt; 25%</p>
              <p className="text-[11px] text-amber-600 mt-0.5">Dual authorization workflow</p>
            </div>
          </div>

          <SectionCard
            title="Institutional Concession Categories & Discount Schedules"
            description="Configure standardized discount slabs, eligible beneficiary definitions, and maximum permissible deduction limits for hospital and clinic outpatients."
            icon={Tag}
            badge="Institutional Policy"
            badgeVariant="amber"
          >
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-md border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Category Name</th>
                      <th className="px-3 py-2.5">Discount %</th>
                      <th className="px-3 py-2.5">Applicable Services</th>
                      <th className="px-3 py-2.5">Verification Document</th>
                      <th className="px-3 py-2.5">Approval Level</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold text-slate-900">Senior Citizen Privilege</td>
                      <td className="px-3 py-2.5 font-bold text-emerald-700">15%</td>
                      <td className="px-3 py-2.5 text-slate-600">All OPD Laboratory & ECG</td>
                      <td className="px-3 py-2.5 text-slate-500">Aadhaar / Voter ID (Age ≥ 60)</td>
                      <td className="px-3 py-2.5 text-slate-700 font-medium">Auto (Cashier)</td>
                      <td className="px-3 py-2.5 text-center"><span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 font-bold text-[10px]">ACTIVE</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold text-slate-900">Hospital Staff Welfare</td>
                      <td className="px-3 py-2.5 font-bold text-emerald-700">50%</td>
                      <td className="px-3 py-2.5 text-slate-600">All In-house Lab & Radiology</td>
                      <td className="px-3 py-2.5 text-slate-500">Hospital HR Employee Badge</td>
                      <td className="px-3 py-2.5 text-slate-700 font-medium">Auto (HR Verified)</td>
                      <td className="px-3 py-2.5 text-center"><span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 font-bold text-[10px]">ACTIVE</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold text-slate-900">BPL / Antyodaya / Indigent Waiver</td>
                      <td className="px-3 py-2.5 font-bold text-emerald-700">100%</td>
                      <td className="px-3 py-2.5 text-slate-600">Emergency & Basic Pathology</td>
                      <td className="px-3 py-2.5 text-slate-500">BPL Ration Card / Income Cert</td>
                      <td className="px-3 py-2.5 text-amber-700 font-bold">Medical Superintendent</td>
                      <td className="px-3 py-2.5 text-center"><span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 font-bold text-[10px]">ACTIVE</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold text-slate-900">Treating Doctor Courtesy</td>
                      <td className="px-3 py-2.5 font-bold text-emerald-700">Up to 20%</td>
                      <td className="px-3 py-2.5 text-slate-600">Discretionary on Lab Profiles</td>
                      <td className="px-3 py-2.5 text-slate-500">Doctor Prescription Note</td>
                      <td className="px-3 py-2.5 text-slate-700 font-medium">Consultant PIN</td>
                      <td className="px-3 py-2.5 text-center"><span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 font-bold text-[10px]">ACTIVE</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Concession Governance & Anti-Fraud Audit Controls"
            description="Configure threshold limits for cashier discount overrides, mandatory reason capture, and daily waiver reconciliation."
            icon={ShieldCheck}
            badge="Audit Protection"
            badgeVariant="green"
          >
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <FieldLabel label="Cashier Max Discretionary Limit" required hint="Maximum discount cashier can apply without supervisor sign-off" />
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} max={15} defaultValue={5} className={INPUT_CLS} />
                      <span className="text-xs font-semibold text-slate-500">%</span>
                    </div>
                  </div>
                  <div>
                    <FieldLabel label="Accounts Manager Approval Threshold" required hint="Discounts between cashier limit and this % require manager sign-off" />
                    <div className="flex items-center gap-2">
                      <input type="number" min={10} max={30} defaultValue={25} className={INPUT_CLS} />
                      <span className="text-xs font-semibold text-slate-500">%</span>
                    </div>
                  </div>
                  <div>
                    <FieldLabel label="Managing Director / MS Override" required hint="Discounts above manager limit require executive biometric or OTP sign-off" />
                    <div className="flex items-center gap-2">
                      <input type="number" min={25} max={100} defaultValue={100} className={INPUT_CLS} />
                      <span className="text-xs font-semibold text-slate-500">%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Info className="h-3 w-3 shrink-0 text-slate-400" />
                    Every applied concession automatically records the cashier ID, authorizing manager ID, discount reason code, and exact rupee deduction into the immutable financial audit log.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* TAB 4: Payment Gateways & POS */}
      {(activeTab === "payments" || subSection === "billing-payments") && (
        <div className="space-y-6">
          <SectionCard
            title="UPI Instant Settlement & QR Code Generation"
            description="NPCI-compliant dynamic UPI QR generation embedding invoice reference, patient MRN, and exact payable amount."
            icon={QrCode}
            badge="NPCI Compliant"
            badgeVariant="green"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <FieldLabel
                    label="Hospital / Lab Merchant VPA (Virtual Payment Address)"
                    required
                  />
                  <div className="relative">
                    <input
                      type="text"
                      value={data.upiMerchantVpa}
                      onChange={(e) => updateField("upiMerchantVpa", e.target.value)}
                      className={INPUT_CLS}
                      placeholder="e.g. labcore@icici"
                    />
                    <Smartphone className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Direct settlements route immediately to the registered hospital current bank account.
                  </p>
                </div>

                <div>
                  <FieldLabel label="QR Code Display Engine" />
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="qrType"
                        value="DYNAMIC"
                        checked={data.upiQrCodeType === "DYNAMIC"}
                        onChange={() => updateField("upiQrCodeType", "DYNAMIC")}
                        className="text-sky-600 focus:ring-sky-500"
                      />
                      Dynamic QR (Per-Invoice Amount Embedded)
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="qrType"
                        value="STATIC"
                        checked={data.upiQrCodeType === "STATIC"}
                        onChange={() => updateField("upiQrCodeType", "STATIC")}
                        className="text-sky-600 focus:ring-sky-500"
                      />
                      Static Counter QR
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Dynamic QR automatically locks the exact rupee value, preventing under/over-payment errors.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Counter POS Card Terminals (IP / LAN EDC Integration)"
            description="Direct push-to-POS protocol with PineLabs, Paytm, or Razorpay POS machines to eliminate manual amount re-entry."
            icon={CreditCard}
            badge={data.posTerminalEnabled ? "EDC Bridge Active" : "Disabled"}
            badgeVariant={data.posTerminalEnabled ? "blue" : "amber"}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Enable Local LAN / Cloud POS Terminal Integration
                  </h4>
                  <p className="text-xs text-slate-500">
                    When cashier clicks &apos;Card Payment&apos;, the ELIS automatically pushes the charge amount to the counter machine.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={data.posTerminalEnabled}
                    onChange={(e) => updateField("posTerminalEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              {data.posTerminalEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-slate-100 pt-4">
                  <div>
                    <FieldLabel label="POS Hardware Provider" />
                    <select
                      value={data.posProvider}
                      onChange={(e) =>
                        updateField("posProvider", e.target.value as any)
                      }
                      className={SELECT_CLS}
                    >
                      <option value="PINELABS">PineLabs Plutus Cloud / LAN</option>
                      <option value="PAYTM_POS">Paytm EDC All-in-One POS</option>
                      <option value="RAZORPAY_POS">Razorpay Smart POS</option>
                      <option value="INGENICO">Ingenico Tetra IP Bridge</option>
                      <option value="VERIFONE">Verifone Engage IP</option>
                    </select>
                  </div>

                  <div>
                    <FieldLabel label="Terminal IP Address (LAN)" />
                    <input
                      type="text"
                      value={data.posTerminalIp}
                      onChange={(e) => updateField("posTerminalIp", e.target.value)}
                      className={INPUT_CLS}
                      placeholder="192.168.1.185"
                    />
                  </div>

                  <div>
                    <FieldLabel label="Terminal / Merchant ID (TID / MID)" />
                    <input
                      type="text"
                      value={data.posTerminalMerchantId}
                      onChange={(e) =>
                        updateField("posTerminalMerchantId", e.target.value)
                      }
                      className={INPUT_CLS}
                      placeholder="PL_POS_009944"
                    />
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Institutional Bank Account & RTGS Settlement"
            description="Bank coordinates rendered on B2B invoices and institutional corporate debit notes."
            icon={Landmark}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <FieldLabel label="Primary Operating Bank & Branch" />
                <input
                  type="text"
                  value={data.bankAccountDetails}
                  onChange={(e) => updateField("bankAccountDetails", e.target.value)}
                  className={INPUT_CLS}
                />
              </div>

              <div>
                <FieldLabel label="IFSC Code (RTGS / NEFT)" />
                <input
                  type="text"
                  value={data.ifscCode}
                  onChange={(e) => updateField("ifscCode", e.target.value.toUpperCase())}
                  className={INPUT_CLS}
                />
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
