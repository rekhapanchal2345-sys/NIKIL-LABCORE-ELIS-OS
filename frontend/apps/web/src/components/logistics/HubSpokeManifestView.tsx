'use client';

import React, { useState } from 'react';
import {
  Package,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Printer,
  Search,
  Thermometer,
  Layers,
  ArrowRight,
  Wallet,
  Check,
} from 'lucide-react';

interface SpokePartner {
  id: string;
  partnerCode: string;
  centerName: string;
  tier: string;
  city: string;
  contactPerson: string;
  contactPhone: string;
  walletBalanceInr: number;
  creditLimitInr: number;
  discountPercentage: number;
  isBookingFrozen: boolean;
}

interface ConsignmentManifestItem {
  id: string;
  manifestBarcode: string;
  partnerCode: string;
  centerName: string;
  tamperSealNumber: string;
  courierRunnerName: string;
  departureTempCelsius: number;
  arrivalTempCelsius: number | null;
  expectedTubeCount: number;
  receivedTubeCount: number | null;
  discrepancyCount: number;
  status: string;
  items: Array<{
    tubeBarcode: string;
    patientName: string;
    orderNumber: string;
    vacutainerType: string;
    isScannedAtHub: boolean;
  }>;
}

const MOCK_PARTNERS: SpokePartner[] = [
  {
    id: 'spk-01',
    partnerCode: 'SPK-MN-04',
    centerName: 'Maninagar Diagnostic Spoke Hub',
    tier: 'GOLD_FRANCHISEE',
    city: 'Ahmedabad (East)',
    contactPerson: 'Dr. Mehul Joshi',
    contactPhone: '+91 94280 12345',
    walletBalanceInr: 42500,
    creditLimitInr: 50000,
    discountPercentage: 35,
    isBookingFrozen: false,
  },
  {
    id: 'spk-02',
    partnerCode: 'SPK-GN-08',
    centerName: 'Gandhinagar Capital Pathology Spoke',
    tier: 'PLATINUM_FRANCHISEE',
    city: 'Gandhinagar',
    contactPerson: 'Dr. Neha Shah',
    contactPhone: '+91 98251 98765',
    walletBalanceInr: 68900,
    creditLimitInr: 75000,
    discountPercentage: 40,
    isBookingFrozen: false,
  },
  {
    id: 'spk-03',
    partnerCode: 'SPK-VP-02',
    centerName: 'Vastrapur OPD Collection Center',
    tier: 'SILVER_CLINIC',
    city: 'Ahmedabad (West)',
    contactPerson: 'Nurse Suman Rawal',
    contactPhone: '+91 97230 44512',
    walletBalanceInr: 12400,
    creditLimitInr: 25000,
    discountPercentage: 25,
    isBookingFrozen: false,
  },
];

const MOCK_MANIFESTS: ConsignmentManifestItem[] = [
  {
    id: 'man-01',
    manifestBarcode: 'MNF-2026-0041',
    partnerCode: 'SPK-MN-04',
    centerName: 'Maninagar Diagnostic Spoke Hub',
    tamperSealNumber: 'SEAL-B2B-88914',
    courierRunnerName: 'Kishore Parmar',
    departureTempCelsius: 4.8,
    arrivalTempCelsius: 5.2,
    expectedTubeCount: 4,
    receivedTubeCount: 3,
    discrepancyCount: 1,
    status: 'AT_HUB_DOCK',
    items: [
      { tubeBarcode: 'BC-7721-01', patientName: 'Pooja Dave', orderNumber: 'ORD-8812', vacutainerType: 'SST Gold Gel', isScannedAtHub: true },
      { tubeBarcode: 'BC-7721-02', patientName: 'Mahesh Solanki', orderNumber: 'ORD-8813', vacutainerType: 'Sodium Citrate', isScannedAtHub: true },
      { tubeBarcode: 'BC-7721-03', patientName: 'Rukmini Bai', orderNumber: 'ORD-8814', vacutainerType: 'EDTA Lavender', isScannedAtHub: true },
      { tubeBarcode: 'BC-7721-04', patientName: 'Nitesh Raval', orderNumber: 'ORD-8815', vacutainerType: 'Fluoride Grey', isScannedAtHub: false },
    ],
  },
  {
    id: 'man-02',
    manifestBarcode: 'MNF-2026-0042',
    partnerCode: 'SPK-GN-08',
    centerName: 'Gandhinagar Capital Pathology Spoke',
    tamperSealNumber: 'SEAL-B2B-99120',
    courierRunnerName: 'Dharmesh Bhatt',
    departureTempCelsius: 3.9,
    arrivalTempCelsius: null,
    expectedTubeCount: 8,
    receivedTubeCount: null,
    discrepancyCount: 0,
    status: 'IN_TRANSIT',
    items: [
      { tubeBarcode: 'GN-101', patientName: 'Aarav Patel', orderNumber: 'ORD-9901', vacutainerType: 'EDTA Lavender', isScannedAtHub: false },
      { tubeBarcode: 'GN-102', patientName: 'Bhavna Ben', orderNumber: 'ORD-9902', vacutainerType: 'SST Gold Gel', isScannedAtHub: false },
    ],
  },
];

interface HubSpokeManifestViewProps {
  onOpenPrintSlip: (manifestBarcode: string) => void;
}

export default function HubSpokeManifestView({ onOpenPrintSlip }: HubSpokeManifestViewProps) {
  const [manifests, setManifests] = useState<ConsignmentManifestItem[]>(MOCK_MANIFESTS);
  const [selectedManifest, setSelectedManifest] = useState<ConsignmentManifestItem>(manifests[0]);
  const [scannedTubesText, setScannedTubesText] = useState<string>('BC-7721-01\nBC-7721-02\nBC-7721-03');
  const [arrivalTempInput, setArrivalTempInput] = useState<number>(5.2);
  const [verificationFeedback, setVerificationFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleVerifyDockScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManifest) return;

    const barcodes = scannedTubesText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedItems = selectedManifest.items.map((item) => ({
      ...item,
      isScannedAtHub: barcodes.includes(item.tubeBarcode),
    }));

    const receivedCount = barcodes.length;
    const discrepancy = Math.abs(selectedManifest.expectedTubeCount - receivedCount);

    const updatedManifest: ConsignmentManifestItem = {
      ...selectedManifest,
      items: updatedItems,
      receivedTubeCount: receivedCount,
      arrivalTempCelsius: Number(arrivalTempInput),
      discrepancyCount: discrepancy,
      status: discrepancy > 0 ? 'DISCREPANCY_FLAGGED' : 'VERIFIED_100_INTACT',
    };

    setManifests((prev) =>
      prev.map((m) => (m.id === updatedManifest.id ? updatedManifest : m))
    );
    setSelectedManifest(updatedManifest);

    if (discrepancy > 0) {
      setVerificationFeedback({
        type: 'error',
        message: `DISCREPANCY FLAGGED ON ${updatedManifest.manifestBarcode}: Expected ${updatedManifest.expectedTubeCount} tubes, verified ${receivedCount}. Missing tube logged into NABL Pre-analytical Incident Log.`,
      });
    } else {
      setVerificationFeedback({
        type: 'success',
        message: `Manifest ${updatedManifest.manifestBarcode} verified 100% intact (${receivedCount}/${updatedManifest.expectedTubeCount} tubes) at ${arrivalTempInput}°C cold-chain. Ready for accessioning.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              B2B Hub-and-Spoke Consignment Clearing
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Spoke Collection Manifests &amp; Dock Receiving Bay
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Tamper-evident security bags, arrival temperature logging, and barcode reconciliation
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Active Spoke Partners:</span>
            <span className="text-sm font-extrabold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              {MOCK_PARTNERS.length} Collection Centers
            </span>
          </div>
        </div>
      </div>

      {/* SPOKE PARTNERS WALLET OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {MOCK_PARTNERS.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                  {p.partnerCode}
                </span>
                <h4 className="text-xs font-bold text-slate-900 mt-1">{p.centerName}</h4>
                <p className="text-[11px] text-slate-500">{p.city}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {p.tier.replace('_', ' ')}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Prepaid Ledger:</span>
              </div>
              <span className="font-extrabold text-slate-900">
                ₹{p.walletBalanceInr.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* TWO COLUMN INTERACTION: CONSIGNMENT MANIFESTS & DOCK SCANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: CONSIGNMENT MANIFESTS LIST */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              Incoming Spoke Consignments ({manifests.length})
            </h3>
            <span className="text-xs text-slate-400">Click manifest to inspect</span>
          </div>

          <div className="space-y-3">
            {manifests.map((m) => {
              const isSelected = selectedManifest?.id === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedManifest(m);
                    setScannedTubesText(
                      m.items
                        .filter((i) => i.isScannedAtHub)
                        .map((i) => i.tubeBarcode)
                        .join('\n') || m.items.map((i) => i.tubeBarcode).join('\n')
                    );
                    setVerificationFeedback(null);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {m.manifestBarcode}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                        Seal: {m.tamperSealNumber}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        m.status === 'VERIFIED_100_INTACT'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : m.status === 'DISCREPANCY_FLAGGED'
                          ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-2">{m.centerName}</h4>
                  <p className="text-xs text-slate-500">Runner: {m.courierRunnerName}</p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-blue-600" />
                      Dep: {m.departureTempCelsius}°C
                      {m.arrivalTempCelsius && ` · Arr: ${m.arrivalTempCelsius}°C`}
                    </span>
                    <span className="font-bold text-slate-800">
                      Tubes: {m.receivedTubeCount !== null ? `${m.receivedTubeCount}/${m.expectedTubeCount}` : `${m.expectedTubeCount} Expected`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE DOCK VERIFICATION SCANNER */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-600" />
                Dock Accession Barcode Scanner
              </h3>
              <p className="text-[11px] text-slate-400">Verifying {selectedManifest?.manifestBarcode}</p>
            </div>

            <button
              onClick={() => onOpenPrintSlip(selectedManifest.manifestBarcode)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Print Manifest
            </button>
          </div>

          {verificationFeedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-medium leading-relaxed ${
                verificationFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {verificationFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <span>{verificationFeedback.message}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleVerifyDockScan} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Dock Arrival Cold-Chain Temperature (°C)
              </label>
              <div className="relative">
                <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  step="0.1"
                  value={arrivalTempInput}
                  onChange={(e) => setArrivalTempInput(parseFloat(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                NABL 2°C–8°C Cold Chain requirement. Readings outside trigger mandatory CAPA report.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Scanned Vacutainer Tube Barcodes (One per line or comma-separated)
              </label>
              <textarea
                rows={5}
                value={scannedTubesText}
                onChange={(e) => setScannedTubesText(e.target.value)}
                placeholder="Scan or enter barcodes..."
                className="w-full font-mono text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
              />
            </div>

            {/* Manifest Expected Tube Verification Checklist */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase block">
                Expected Tube Checklist ({selectedManifest.items.length} items):
              </span>
              <div className="space-y-1">
                {selectedManifest.items.map((item) => (
                  <div
                    key={item.tubeBarcode}
                    className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200 text-[11px]"
                  >
                    <span className="font-mono font-bold text-slate-800">{item.tubeBarcode}</span>
                    <span className="text-slate-600 truncate max-w-[120px]">{item.patientName}</span>
                    <span className="text-slate-400">{item.vacutainerType}</span>
                    {item.isScannedAtHub ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3 text-emerald-600" /> Scanned
                      </span>
                    ) : (
                      <span className="text-red-500 font-bold">Pending</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Verify &amp; Accept Consignment into Accessioning
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
