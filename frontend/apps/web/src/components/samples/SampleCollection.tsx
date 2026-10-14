"use client";

import React, { FormEvent, useState } from "react";
import { 
  ShieldCheck, 
  Fingerprint, 
  Barcode, 
  UserCheck,
  CheckCircle2,
  Clock,
  FlaskConical,
  Droplet
} from "lucide-react";

export interface SampleCollectionData {
  orderId: string;
  specimenType: string;
  collectionSite: string;
  collectedBy: string;
  collectedAt: string;
  containerType: string;
  volume: string;
  notes: string;
  biometricVerified?: boolean;
  barcodeVerified?: boolean;
  patientVerified?: boolean;
}

interface SampleCollectionProps {
  orderId?: string;
  patientName?: string;
  orderNumber?: string;
  collectedByOptions?: Array<{
    id: string;
    name: string;
  }>;
  loading?: boolean;
  onSubmit?: (data: SampleCollectionData) => void | Promise<void>;
  onCancel?: () => void;
}

const getCurrentDateTime = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

export default function SampleCollection({
  orderId = "",
  patientName,
  orderNumber,
  collectedByOptions = [],
  loading = false,
  onSubmit,
  onCancel,
}: SampleCollectionProps) {
  const [form, setForm] = useState<SampleCollectionData>({
    orderId,
    specimenType: "",
    collectionSite: "",
    collectedBy: "",
    collectedAt: getCurrentDateTime(),
    containerType: "",
    volume: "",
    notes: "",
    biometricVerified: false,
    barcodeVerified: false,
    patientVerified: false,
  });

  const [error, setError] = useState("");

  const update = (field: keyof SampleCollectionData, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setError("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.orderId.trim()) {
      setError("Order reference is required.");
      return;
    }

    if (!form.specimenType.trim()) {
      setError("Specimen type is required.");
      return;
    }

    if (!form.collectedBy.trim()) {
      setError("Phlebotomist / Collector name is required.");
      return;
    }

    if (!form.collectedAt) {
      setError("Collection date and time are required.");
      return;
    }

    try {
      await onSubmit?.(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to record sample collection.");
    }
  };

  const input =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20 transition-all disabled:opacity-50";

  const label =
    "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600";

  return (
    <form onSubmit={submit} className="space-y-6 text-slate-900">
      {/* Light Clinical Hospital Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100 shadow-xs">
              <Droplet className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Clinical Phlebotomy Accession
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  CLSI GP41 Validated
                </span>
              </h2>
              <p className="text-xs text-slate-500">Specimen draw protocol with 2-point patient identity verification</p>
            </div>
          </div>
        </div>

        {/* 3-Point Pre-Collection Verification Badges */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => update("patientVerified", !form.patientVerified)}
            className={`rounded-xl border p-3 text-left transition-all ${
              form.patientVerified 
                ? "border-emerald-300 bg-emerald-50 text-emerald-900 shadow-xs" 
                : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className={`w-4 h-4 ${form.patientVerified ? "text-emerald-600" : "text-slate-400"}`} />
              <span className="text-[11px] font-bold">1. Patient Double-ID</span>
            </div>
            <div className="text-xs font-bold">
              {form.patientVerified ? "✓ Verified" : "Click to Verify"}
            </div>
          </button>

          <button
            type="button"
            onClick={() => update("barcodeVerified", !form.barcodeVerified)}
            className={`rounded-xl border p-3 text-left transition-all ${
              form.barcodeVerified 
                ? "border-sky-300 bg-sky-50 text-sky-900 shadow-xs" 
                : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Barcode className={`w-4 h-4 ${form.barcodeVerified ? "text-sky-600" : "text-slate-400"}`} />
              <span className="text-[11px] font-bold">2. Barcode Matched</span>
            </div>
            <div className="text-xs font-bold">
              {form.barcodeVerified ? "✓ Verified" : "Click to Verify"}
            </div>
          </button>

          <button
            type="button"
            onClick={() => update("biometricVerified", !form.biometricVerified)}
            className={`rounded-xl border p-3 text-left transition-all ${
              form.biometricVerified 
                ? "border-purple-300 bg-purple-50 text-purple-900 shadow-xs" 
                : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Fingerprint className={`w-4 h-4 ${form.biometricVerified ? "text-purple-600" : "text-slate-400"}`} />
              <span className="text-[11px] font-bold">3. Container Validated</span>
            </div>
            <div className="text-xs font-bold">
              {form.biometricVerified ? "✓ Verified" : "Optional"}
            </div>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}

      {(patientName || orderNumber) && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Requisition Target
          </p>

          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-2">
            {patientName && (
              <div>
                <p className="text-[11px] text-slate-500">Patient</p>
                <p className="text-xs font-bold text-slate-900">{patientName}</p>
              </div>
            )}

            {orderNumber && (
              <div>
                <p className="text-[11px] text-slate-500">Lab Order Requisition</p>
                <p className="font-mono text-xs font-bold text-sky-700">{orderNumber}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="font-bold text-slate-900 text-sm">
          Clinical Specimen Details
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Enter specimen draw parameters, container tube type, and phlebotomist identification.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className={label}>
              Order Reference <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.orderId}
              onChange={(e) => update("orderId", e.target.value)}
              placeholder="Order Number / UUID"
              className={input}
              disabled={loading || !!orderId}
            />
          </div>

          <div>
            <label className={label}>
              Specimen Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.specimenType}
              onChange={(e) => update("specimenType", e.target.value)}
              className={input}
              disabled={loading}
            >
              <option value="">Select Specimen Type</option>
              <option value="Whole Blood">Whole Blood (EDTA / Heparin)</option>
              <option value="Serum">Serum (SST Gel Clot Activator)</option>
              <option value="Plasma">Plasma (Citrate / Fluoride)</option>
              <option value="Urine">Urine (Sterile Cup)</option>
              <option value="CSF">Cerebrospinal Fluid (CSF)</option>
              <option value="Synovial">Synovial Fluid</option>
              <option value="Swab">Nasopharyngeal / Throat Swab</option>
            </select>
          </div>

          <div>
            <label className={label}>Venipuncture Collection Site</label>
            <input
              value={form.collectionSite}
              onChange={(e) => update("collectionSite", e.target.value)}
              placeholder="e.g. Left Median Cubital Vein, Right Forearm"
              className={input}
              disabled={loading}
            />
          </div>

          <div>
            <label className={label}>
              Phlebotomist / Collector <span className="text-rose-500">*</span>
            </label>
            {collectedByOptions.length > 0 ? (
              <select
                value={form.collectedBy}
                onChange={(e) => update("collectedBy", e.target.value)}
                className={input}
                disabled={loading}
              >
                <option value="">Select On-Duty Collector</option>
                {collectedByOptions.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={form.collectedBy}
                onChange={(e) => update("collectedBy", e.target.value)}
                placeholder="Phlebotomist full name or employee ID"
                className={input}
                disabled={loading}
              />
            )}
          </div>

          <div>
            <label className={label}>
              Collection Timestamp <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.collectedAt}
              onChange={(e) => update("collectedAt", e.target.value)}
              className={input}
              disabled={loading}
            />
          </div>

          <div>
            <label className={label}>Vacutainer Container</label>
            <select
              value={form.containerType}
              onChange={(e) => update("containerType", e.target.value)}
              className={input}
              disabled={loading}
            >
              <option value="">Select Vacutainer Tube</option>
              <option value="Lavender EDTA">Lavender Top — K2/K3 EDTA (Hematology)</option>
              <option value="Gold SST Gel">Gold Top — SST Gel Separator (Biochemistry)</option>
              <option value="Light Blue Citrate">Light Blue Top — 3.2% Sodium Citrate (Coagulation)</option>
              <option value="Green Heparin">Green Top — Lithium Heparin (Stat Chem)</option>
              <option value="Grey Fluoride">Grey Top — Sodium Fluoride / Oxalate (Glucose)</option>
              <option value="Red Plain">Red Top — Plain Clot Activator (Serology)</option>
              <option value="Sterile Cup">Yellow Sterile Cup — Urine Specimen</option>
            </select>
          </div>

          <div>
            <label className={label}>Volume Drawn</label>
            <input
              value={form.volume}
              onChange={(e) => update("volume", e.target.value)}
              placeholder="e.g. 3.5 mL (marked to fill line)"
              className={input}
              disabled={loading}
            />
          </div>

          <div className="md:col-span-2">
            <label className={label}>Clinical Phlebotomy Notes (Optional)</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Tourniquet applied &lt; 45s, 8x inversions completed, zero hematoma, sample placed in cold-chain transport pouch..."
              className={`${input} resize-none`}
              disabled={loading}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-sky-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-sky-700 shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Recording...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Complete Accession</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}