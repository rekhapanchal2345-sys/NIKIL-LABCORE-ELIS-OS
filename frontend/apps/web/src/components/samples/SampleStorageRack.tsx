"use client";

import React, { useState } from "react";
import { 
  Snowflake, Thermometer, Box, Search, CheckCircle2, 
  MapPin, ShieldCheck, AlertCircle, RefreshCw, Layers, 
  FlaskConical, Lock, Unlock, Eye, Sparkles, UserRound,
  Download, ArrowRight
} from "lucide-react";

interface StorageSample {
  id: string;
  sampleNumber: string;
  barcode: string;
  sampleType: string;
  status: string;
  test: {
    testName: string;
    sampleContainer: string;
  };
  order: {
    patient: {
      firstName: string;
      lastName: string;
      uhid: string;
    };
  };
}

interface SampleStorageRackProps {
  samples: StorageSample[];
  onSelectSample: (sample: StorageSample) => void;
}

interface RackUnit {
  id: string;
  name: string;
  temperature: string;
  tempCategory: "ambient" | "chilled" | "frozen" | "cryo";
  tempC: string;
  room: string;
  capacity: number;
  totalSlots: number;
}

const STORAGE_UNITS: RackUnit[] = [
  { id: "RACK-01", name: "Pre-Analytical Accession Rack A", temperature: "18°C - 22°C", tempCategory: "ambient", tempC: "+20.5°C", room: "Central Accession Hall", capacity: 96, totalSlots: 96 },
  { id: "COLD-01", name: "Primary Refrigerated Archive (2-8°C)", temperature: "2°C - 8°C", tempCategory: "chilled", tempC: "+4.2°C", room: "Cold Chain Room 102", capacity: 96, totalSlots: 96 },
  { id: "FREEZER-01", name: "Deep Specimen Bio-Bank (-20°C)", temperature: "-20°C ± 2°C", tempCategory: "frozen", tempC: "-21.8°C", room: "Pathology Storage Vault", capacity: 96, totalSlots: 96 },
  { id: "CRYO-01", name: "Ultra-Low Cryo Vault (-80°C)", temperature: "-80°C Cryo", tempCategory: "cryo", tempC: "-81.4°C", room: "Molecular Genetics Wing", capacity: 96, totalSlots: 96 },
];

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function SampleStorageRack({ samples, onSelectSample }: SampleStorageRackProps) {
  const [selectedUnit, setSelectedUnit] = useState<RackUnit>(STORAGE_UNITS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Deterministic mapping for display
  const slotMap: Record<string, StorageSample> = {};
  samples.slice(0, 96).forEach((s, idx) => {
    const row = ROWS[Math.floor(idx / 12)];
    const col = COLS[idx % 12];
    const key = `${row}${col}`;
    slotMap[key] = s;
  });

  const occupiedCount = Object.keys(slotMap).length;
  const activeSlotSample = selectedSlot ? slotMap[selectedSlot] : null;

  const getTubeCap = (containerName?: string) => {
    const c = (containerName || "").toLowerCase();
    if (c.includes("edta") || c.includes("purple") || c.includes("lavender")) return "#8B5CF6";
    if (c.includes("citrate") || c.includes("blue")) return "#0284C7";
    if (c.includes("sst") || c.includes("gel") || c.includes("gold") || c.includes("serum")) return "#F59E0B";
    if (c.includes("red")) return "#EF4444";
    if (c.includes("heparin") || c.includes("green")) return "#10B981";
    if (c.includes("fluoride") || c.includes("grey")) return "#64748B";
    if (c.includes("urine") || c.includes("yellow")) return "#EAB308";
    return "#06B6D4";
  };

  return (
    <div className="space-y-6">
      {/* Top Storage Unit Ribbon */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STORAGE_UNITS.map((unit) => {
          const isSelected = selectedUnit.id === unit.id;
          return (
            <div
              key={unit.id}
              onClick={() => setSelectedUnit(unit)}
              className={`cursor-pointer rounded-2xl border p-4.5 transition-all duration-200 ${
                isSelected
                  ? "border-sky-500 bg-sky-50/50 shadow-sm ring-2 ring-sky-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`rounded-xl border p-2 text-xs ${
                    unit.tempCategory === "cryo"
                      ? "border-purple-200 bg-purple-50 text-purple-700"
                      : unit.tempCategory === "frozen"
                      ? "border-sky-200 bg-sky-50 text-sky-700"
                      : unit.tempCategory === "chilled"
                      ? "border-teal-200 bg-teal-50 text-teal-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  <Thermometer className="h-4 w-4" />
                </span>
                <span className="font-mono text-sm font-black text-slate-800">{unit.tempC}</span>
              </div>

              <h4 className="mt-3 text-xs font-black text-slate-900">{unit.name}</h4>
              <p className="mt-0.5 text-[11px] text-slate-500 font-medium">{unit.room}</p>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                <span>Temp: {unit.temperature}</span>
                <span className="font-bold text-slate-700">{occupiedCount}/96 Slots</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid Card: 96-Well Rack & Sample Details */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-[10px] font-black text-sky-700">
                {selectedUnit.id}
              </span>
              <h3 className="text-base font-black text-slate-900">{selectedUnit.name}</h3>
            </div>
            <p className="text-xs text-slate-500">
              Interactive 96-position (8×12 standard SBS footprint) cold-chain specimen tray. Click any slot to inspect specimen dossier.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              Occupancy: <span className="text-slate-900 font-black">{Math.round((occupiedCount / 96) * 100)}%</span>
            </span>
            <div className="h-2 w-24 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
              <div
                className="h-full bg-sky-600 rounded-full"
                style={{ width: `${(occupiedCount / 96) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 96-Well Grid Layout */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[650px] space-y-2">
            {/* Column Numbers Header */}
            <div className="flex items-center gap-2 pl-8">
              {COLS.map((col) => (
                <div key={col} className="w-10 text-center font-mono text-[10px] font-black text-slate-400">
                  {col}
                </div>
              ))}
            </div>

            {/* Rows A through H */}
            {ROWS.map((row) => (
              <div key={row} className="flex items-center gap-2">
                <span className="w-6 text-right font-mono text-xs font-black text-slate-500">{row}</span>
                {COLS.map((col) => {
                  const slotKey = `${row}${col}`;
                  const specimen = slotMap[slotKey];
                  const isSelected = selectedSlot === slotKey;
                  const tubeColor = specimen ? getTubeCap(specimen.test.sampleContainer) : null;

                  return (
                    <button
                      key={slotKey}
                      onClick={() => {
                        setSelectedSlot(slotKey);
                        if (specimen) onSelectSample(specimen);
                      }}
                      className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-150 ${
                        isSelected
                          ? "border-sky-600 bg-sky-100 shadow-md ring-2 ring-sky-500/30 scale-105 z-10"
                          : specimen
                          ? "border-slate-200 bg-slate-50 hover:border-sky-400 hover:bg-sky-50/50"
                          : "border-slate-200/60 bg-white hover:bg-slate-50"
                      }`}
                      title={specimen ? `${slotKey}: ${specimen.sampleNumber} · ${specimen.test.testName}` : `${slotKey}: Empty Slot`}
                    >
                      {specimen ? (
                        <div
                          className="flex h-5 w-5 items-center justify-center rounded-full shadow-sm ring-1 ring-black/10 transition-transform hover:scale-110"
                          style={{ backgroundColor: tubeColor || "#06B6D4" }}
                        >
                          <span className="font-mono text-[8px] font-black text-white">
                            {col}
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono text-[9px] text-slate-300 font-semibold">{col}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Slot Information Banner */}
        {selectedSlot && (
          <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-sky-800 tracking-wider">
                  Position #{selectedSlot} in {selectedUnit.name}
                </span>
                {activeSlotSample ? (
                  <div className="mt-1 flex items-center gap-3">
                    <p className="text-sm font-black text-slate-900 font-mono">
                      {activeSlotSample.sampleNumber}
                    </p>
                    <span className="text-xs text-slate-600">
                      {activeSlotSample.order.patient.firstName} {activeSlotSample.order.patient.lastName} (UHID: {activeSlotSample.order.patient.uhid})
                    </span>
                    <span className="rounded bg-white px-2 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
                      {activeSlotSample.test.testName}
                    </span>
                  </div>
                ) : (
                  <p className="mt-0.5 text-xs text-slate-600 font-medium">Slot is currently empty and available for accessioning.</p>
                )}
              </div>

              {activeSlotSample && (
                <button
                  onClick={() => onSelectSample(activeSlotSample)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-500 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" /> View Specimen Dossier
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
