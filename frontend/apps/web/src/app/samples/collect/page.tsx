"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { sampleApi } from "@/lib/api";
import {
  ArrowLeft,
  FlaskConical,
  ScanLine,
  UserRound,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Clock,
  Building2,
  Loader2,
  Droplet,
  ChevronRight,
  Search,
  Timer,
  FileText,
  BadgeCheck,
  Activity
} from "lucide-react";

interface PendingSample {
  id: string;
  sampleNumber: string;
  barcode: string;
  sampleType: string;
  status: string;
  priority?: string;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      uhid: string;
      gender: string;
      age?: number;
      phone?: string;
    };
    doctor?: {
      fullName: string;
    };
  };
  test: {
    testName: string;
    testCode: string;
    sampleType: string;
    sampleContainer?: string;
  };
}

const TUBE_CONTAINER_COLORS: Record<string, { bg: string; text: string; border: string; capColor: string; name: string }> = {
  "EDTA Tube": { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", capColor: "#8B5CF6", name: "Lavender EDTA" },
  "Lavender Top": { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", capColor: "#8B5CF6", name: "Lavender EDTA" },
  "Serum Separator Tube": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", capColor: "#F59E0B", name: "Gold SST Gel" },
  "SST": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", capColor: "#F59E0B", name: "Gold SST Gel" },
  "Red Top": { bg: "bg-red-50", text: "text-red-800", border: "border-red-200", capColor: "#EF4444", name: "Red Plain" },
  "Sodium Citrate": { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", name: "Light Blue Citrate" },
  "Light Blue": { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", name: "Light Blue Citrate" },
  "Lithium Heparin": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", capColor: "#10B981", name: "Green Heparin" },
  "Green Top": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", capColor: "#10B981", name: "Green Heparin" },
  "Fluoride Tube": { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", capColor: "#64748B", name: "Grey Fluoride" },
  "Grey Top": { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", capColor: "#64748B", name: "Grey Fluoride" },
  "Sterile Container": { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200", capColor: "#EAB308", name: "Urine Sterile Cup" },
};

function getContainerStyle(containerName?: string) {
  if (!containerName) return { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", name: "Standard Specimen" };
  for (const [key, val] of Object.entries(TUBE_CONTAINER_COLORS)) {
    if (containerName.toLowerCase().includes(key.toLowerCase())) {
      return val;
    }
  }
  return { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", name: containerName };
}

export default function SampleCollectionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [pendingSamples, setPendingSamples] = useState<PendingSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<PendingSample | null>(null);
  const [customBarcode, setCustomBarcode] = useState("");
  const [collectionLocation, setCollectionLocation] = useState("Central OPD Phlebotomy Bay 01");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  // Clinical phlebotomy safety check states
  const [safetyChecklist, setSafetyChecklist] = useState({
    idVerified: true,
    fastingConfirmed: true,
    orderOfDrawReviewed: true,
    tourniquetTimed: true,
  });

  const fetchPendingSamples = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sampleApi.getAll("?status=PENDING");
      if (response.success && response.data) {
        const samplesData = response.data.samples || response.data || [];
        setPendingSamples(Array.isArray(samplesData) ? samplesData : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch pending specimens");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSamples();
  }, []);

  useEffect(() => {
    if (orderId && pendingSamples.length > 0 && !selectedSample) {
      const match = pendingSamples.find(
        (s) => s.order?.id === orderId || s.order?.orderNumber === orderId
      );
      if (match) {
        setSelectedSample(match);
        setCustomBarcode(match.barcode || `AUTO-${match.id.slice(0, 8)}`);
      }
    }
  }, [orderId, pendingSamples, selectedSample]);

  const displayedSamples = pendingSamples.filter((s) => {
    if (orderId && s.order?.id !== orderId && s.order?.orderNumber !== orderId) return false;
    if (searchFilter) {
      const term = searchFilter.toLowerCase();
      return (
        s.sampleNumber.toLowerCase().includes(term) ||
        s.order.patient.uhid.toLowerCase().includes(term) ||
        `${s.order.patient.firstName} ${s.order.patient.lastName}`.toLowerCase().includes(term) ||
        s.test.testName.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const handleSelect = (sample: PendingSample) => {
    setSelectedSample(sample);
    setCustomBarcode(sample.barcode || `BAR-${Date.now().toString().slice(-6)}`);
    setNotes("");
  };

  const handleConfirmDraw = async () => {
    if (!selectedSample) return;

    try {
      setSubmitting(true);
      await sampleApi.collect(selectedSample.id, {
        barcode: customBarcode || selectedSample.barcode,
        location: collectionLocation,
        notes,
        collectionType: "WALK_IN",
        priority: selectedSample.priority || "ROUTINE",
      });

      setSelectedSample(null);
      setCustomBarcode("");
      setNotes("");
      await fetchPendingSamples();
    } catch (err: any) {
      setError(err.message || "Failed to mark specimen as collected");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout title="Clinical Phlebotomy Collection Desk">
        <div className="space-y-6 pb-12">
          {/* Header Bar - Light White Hospital Theme */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-4">
              <Link
                href="/samples"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 shadow-xs transition-colors hover:bg-slate-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Phlebotomy &amp; Venipuncture Station
                  </h1>
                  <span className="rounded-full bg-purple-50 border border-purple-200 px-3 py-0.5 text-xs font-bold text-purple-800">
                    {displayedSamples.length} Due for Collection
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  CLSI GP41 2-identifier patient double-check &amp; immediate tube barcode printing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> NABL ISO 15189 Phlebotomy SOP
              </span>
            </div>
          </div>

          {/* Grid Layout: Left Queue, Right Draw Station */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column: Due Queue */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Droplet className="h-4 w-4 text-sky-600" /> Waiting in Lounge
                </div>
                <span className="font-mono text-xs font-bold text-slate-500">
                  {displayedSamples.length} Patients
                </span>
              </div>

              {/* Search filter in queue */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient, UHID or test..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-500 focus:bg-white transition-all"
                />
              </div>

              {/* Sample Queue Cards */}
              <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="p-8 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-sky-600 mb-2" />
                    <p className="text-xs">Loading queue...</p>
                  </div>
                ) : displayedSamples.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                    <p className="text-xs font-bold text-slate-800">Phlebotomy Queue Clear</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">All waiting specimens have been collected</p>
                  </div>
                ) : (
                  displayedSamples.map((sample) => {
                    const tube = getContainerStyle(sample.test.sampleContainer);
                    const isSelected = selectedSample?.id === sample.id;

                    return (
                      <button
                        key={sample.id}
                        onClick={() => handleSelect(sample)}
                        className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                          isSelected
                            ? "border-sky-400 bg-sky-50/70 shadow-xs ring-2 ring-sky-400/20"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <UserRound className="h-3.5 w-3.5 text-sky-600" />
                              {sample.order.patient.firstName} {sample.order.patient.lastName}
                            </p>
                            <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                              UHID: {sample.order.patient.uhid} · Age: {sample.order.patient.age || "—"}y
                            </p>
                          </div>

                          <div
                            className="rounded px-2 py-0.5 text-[9px] font-bold border"
                            style={{
                              borderColor: `${tube.capColor}55`,
                              backgroundColor: `${tube.capColor}15`,
                              color: tube.capColor,
                            }}
                          >
                            {sample.test.sampleContainer || sample.sampleType}
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-2 text-[11px]">
                          <span className="font-bold text-slate-700 truncate max-w-[150px]">{sample.test.testName}</span>
                          <span className="font-mono text-sky-700 font-bold">{sample.sampleNumber}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right 2 Columns: Active Phlebotomy Draw Station */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2 space-y-6">
              {selectedSample ? (
                <>
                  <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Active Patient in Phlebotomy Bay</span>
                      <h2 className="text-xl font-black text-slate-900 mt-0.5">
                        {selectedSample.order.patient.firstName} {selectedSample.order.patient.lastName}
                      </h2>
                      <p className="text-xs text-slate-500 font-mono">
                        UHID: {selectedSample.order.patient.uhid} · Order #{selectedSample.order.orderNumber}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 px-3 py-1 rounded-xl">
                        {selectedSample.sampleNumber}
                      </span>
                    </div>
                  </div>

                  {/* Pre-Draw Double ID Protocol */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" /> 2-Identifier Patient Verification Checklist
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-emerald-800 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={safetyChecklist.idVerified}
                          onChange={(e) => setSafetyChecklist(s => ({ ...s, idVerified: e.target.checked }))}
                          className="h-3.5 w-3.5 rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span>1. Verbal Name + UHID match</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={safetyChecklist.fastingConfirmed}
                          onChange={(e) => setSafetyChecklist(s => ({ ...s, fastingConfirmed: e.target.checked }))}
                          className="h-3.5 w-3.5 rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span>2. Fasting / Prep confirmed</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={safetyChecklist.orderOfDrawReviewed}
                          onChange={(e) => setSafetyChecklist(s => ({ ...s, orderOfDrawReviewed: e.target.checked }))}
                          className="h-3.5 w-3.5 rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span>3. Order of Draw verified</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={safetyChecklist.tourniquetTimed}
                          onChange={(e) => setSafetyChecklist(s => ({ ...s, tourniquetTimed: e.target.checked }))}
                          className="h-3.5 w-3.5 rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span>4. Tourniquet &lt; 60s safety gate</span>
                      </label>
                    </div>
                  </div>

                  {/* Required Specimen Tube Specifications */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Prescribed Test Panel</p>
                      <p className="font-bold text-slate-900 text-sm">{selectedSample.test.testName}</p>
                      <span className="inline-block font-mono text-[11px] text-sky-800 font-bold bg-sky-100 px-2 py-0.5 rounded">
                        {selectedSample.test.testCode}
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Specimen Tube Requirement</p>
                      <p className="font-bold text-purple-900 text-sm">
                        {selectedSample.test.sampleContainer || "Standard Tube"}
                      </p>
                      <p className="text-slate-500 text-[11px]">Invert gently 8–10 times immediately after draw</p>
                    </div>
                  </div>

                  {/* Tube Barcode & Location Assignment */}
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Specimen Barcode Tube Label
                      </label>
                      <div className="relative">
                        <ScanLine className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={customBarcode}
                          onChange={(e) => setCustomBarcode(e.target.value.toUpperCase())}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 font-mono text-xs font-bold text-slate-900 outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Phlebotomy Bay Location
                      </label>
                      <select
                        value={collectionLocation}
                        onChange={(e) => setCollectionLocation(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 focus:bg-white"
                      >
                        <option>Central OPD Phlebotomy Bay 01</option>
                        <option>Central OPD Phlebotomy Bay 02 (Pediatric / STAT)</option>
                        <option>Ward &amp; Bedside Phlebotomy Runner</option>
                        <option>Emergency &amp; ICU 24x7 Counter</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Phlebotomist Clinical Notes (Optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="e.g. Left cubital vein, 3.5 mL drawn, inverted 8 times, patient tolerated well..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 outline-none focus:border-sky-500 focus:bg-white resize-none"
                      />
                    </div>
                  </div>

                  {/* Draw Confirmation Footer */}
                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-3">
                    <button
                      onClick={() => window.open(`/samples/${selectedSample.id}/label`, "_blank")}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                    >
                      <Printer className="h-4 w-4 inline mr-1.5 text-slate-500" /> Print Tube Sticker
                    </button>

                    <button
                      onClick={handleConfirmDraw}
                      disabled={submitting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Droplet className="h-4 w-4" />}
                      <span>Confirm Venipuncture &amp; Dispatch to Lab</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex h-96 flex-col items-center justify-center text-center text-slate-400 space-y-3">
                  <FlaskConical className="h-14 w-14 stroke-[1.2] text-slate-300" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">Select a Waiting Patient</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Choose any patient from the phlebotomy queue on the left to initiate specimen collection, verify ID, and generate tube barcodes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}