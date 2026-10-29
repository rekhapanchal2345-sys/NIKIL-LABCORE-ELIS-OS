"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle, ScanLine } from "lucide-react";
import {
  COLLECTION_LOCATIONS,
  COLLECTION_TYPES,
  DRAW_SITES,
  PATIENT_PREP,
  SPECIMEN_QUALITY,
} from "./phlebotomy-draw-utils";
import { inputClass, labelClass } from "./PhlebotomyPatientCard";

export interface CollectionDetails {
  barcode: string;
  collectionType: string;
  location: string;
  patientPrep: string;
  drawSite: string;
  attempts: number;
  volumeMl: string;
  quality: string;
  notes: string;
}

interface Props {
  values: CollectionDetails;
  onChange: (patch: Partial<CollectionDetails>) => void;
  autoFocusKey?: string;
}

export default function PhlebotomyDetailsForm({ values, onChange, autoFocusKey }: Props) {
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => barcodeRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [autoFocusKey]);

  const qualityIssue = values.quality !== "Adequate";

  return (
    <section aria-label="Collection details" className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="draw-barcode" className={labelClass}>
          Specimen barcode <span className="text-rose-600">*</span>
        </label>
        <div className="relative">
          <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="draw-barcode"
            ref={barcodeRef}
            type="text"
            required
            value={values.barcode}
            onChange={(e) => onChange({ barcode: e.target.value })}
            placeholder="Scan or enter barcode"
            autoComplete="off"
            className={`${inputClass} pl-9 font-mono`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="draw-type" className={labelClass}>Collection type</label>
        <select id="draw-type" value={values.collectionType} onChange={(e) => onChange({ collectionType: e.target.value })} className={inputClass}>
          {COLLECTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="draw-location" className={labelClass}>Collection location</label>
        <select id="draw-location" value={values.location} onChange={(e) => onChange({ location: e.target.value })} className={inputClass}>
          {COLLECTION_LOCATIONS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="draw-prep" className={labelClass}>Patient preparation</label>
        <select id="draw-prep" value={values.patientPrep} onChange={(e) => onChange({ patientPrep: e.target.value })} className={inputClass}>
          {PATIENT_PREP.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="draw-site" className={labelClass}>Draw site</label>
        <select id="draw-site" value={values.drawSite} onChange={(e) => onChange({ drawSite: e.target.value })} className={inputClass}>
          {DRAW_SITES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="draw-attempts" className={labelClass}>Draw attempts</label>
        <select id="draw-attempts" value={values.attempts} onChange={(e) => onChange({ attempts: Number(e.target.value) })} className={inputClass}>
          {[1, 2, 3].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="draw-volume" className={labelClass}>Total volume collected (mL)</label>
        <input
          id="draw-volume"
          type="number"
          min={0}
          step="0.5"
          value={values.volumeMl}
          onChange={(e) => onChange({ volumeMl: e.target.value })}
          placeholder="Optional"
          className={inputClass}
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="draw-quality" className={labelClass}>Specimen quality</label>
        <select id="draw-quality" value={values.quality} onChange={(e) => onChange({ quality: e.target.value })} className={inputClass}>
          {SPECIMEN_QUALITY.map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>
        {qualityIssue && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-800">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            Describe the quality issue in remarks. The laboratory will assess whether recollection is required.
          </p>
        )}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="draw-notes" className={labelClass}>
          Remarks {qualityIssue && <span className="text-rose-600">*</span>}
        </label>
        <textarea
          id="draw-notes"
          rows={2}
          value={values.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="e.g. Difficult vein access, IV line in left arm, specimen transported on ice"
          className={inputClass}
        />
      </div>
    </section>
  );
}
