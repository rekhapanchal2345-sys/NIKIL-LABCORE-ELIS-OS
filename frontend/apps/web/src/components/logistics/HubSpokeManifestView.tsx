'use client';

// ============================================================
// LABCORE ELIS — B2B Hub-and-Spoke Consignment Clearing Command
// ISO 15189:2022 §5.4 | IATA Packing Instruction 650 (UN 3373)
// Barcode accessioning, 3-way reconciliation, thermal verification,
// Spoke prepaid wallet billing, and NABL pre-analytical incident logging
// ============================================================

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
  FileText,
  AlertCircle,
  FileCheck,
  ShieldAlert,
  Flame,
  Droplets,
  Download,
  X,
  CreditCard,
  RefreshCw,
  Sparkles,
  ClipboardList,
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
  activeConsignmentsCount: number;
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
  status: 'PENDING_DOCK_SCAN' | 'AT_HUB_DOCK' | 'VERIFIED_100_INTACT' | 'DISCREPANCY_FLAGGED' | 'IN_TRANSIT';
  packCondition: 'EXCELLENT_SOLID' | 'CONDENSATION_TRACE' | 'ICE_MELTED_CRITICAL';
  iata650Compliant: boolean;
  totalBillableInr: number;
  items: Array<{
    tubeBarcode: string;
    patientName: string;
    orderNumber: string;
    vacutainerType: string;
    isScannedAtHub: boolean;
    condition: 'INTACT' | 'HEMOLYZED' | 'LIPEMIC' | 'MISSING' | 'CLOTTED';
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
    activeConsignmentsCount: 2,
  },
  {
    id: 'spk-02',
    partnerCode: 'SPK-GN-08',
    centerName: 'Gandhinagar Capital Pathology Spoke',
    tier: 'PLATINUM_FRANCHISEE',
    city: 'Gandhinagar Sector 11',
    contactPerson: 'Dr. Neha Shah',
    contactPhone: '+91 98251 98765',
    walletBalanceInr: 68900,
    creditLimitInr: 75000,
    discountPercentage: 40,
    isBookingFrozen: false,
    activeConsignmentsCount: 3,
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
    activeConsignmentsCount: 1,
  },
];

const MOCK_MANIFESTS: ConsignmentManifestItem[] = [
  {
    id: 'man-01',
    manifestBarcode: 'MNF-2026-0041',
    partnerCode: 'SPK-MN-04',
    centerName: 'Maninagar Diagnostic Spoke Hub',
    tamperSealNumber: 'SEAL-B2B-88914',
    courierRunnerName: 'Kishore Parmar (Rider #07)',
    departureTempCelsius: 4.8,
    arrivalTempCelsius: 5.2,
    expectedTubeCount: 4,
    receivedTubeCount: 3,
    discrepancyCount: 1,
    status: 'AT_HUB_DOCK',
    packCondition: 'EXCELLENT_SOLID',
    iata650Compliant: true,
    totalBillableInr: 1850,
    items: [
      { tubeBarcode: 'BC-7721-01', patientName: 'Pooja Dave', orderNumber: 'ORD-8812', vacutainerType: 'SST Gold Gel (LFT+RFT)', isScannedAtHub: true, condition: 'INTACT' },
      { tubeBarcode: 'BC-7721-02', patientName: 'Mahesh Solanki', orderNumber: 'ORD-8813', vacutainerType: 'Sodium Citrate (PT/INR)', isScannedAtHub: true, condition: 'INTACT' },
      { tubeBarcode: 'BC-7721-03', patientName: 'Rukmini Bai', orderNumber: 'ORD-8814', vacutainerType: 'EDTA Lavender (CBC)', isScannedAtHub: true, condition: 'INTACT' },
      { tubeBarcode: 'BC-7721-04', patientName: 'Nitesh Raval', orderNumber: 'ORD-8815', vacutainerType: 'Fluoride Grey (Fasting Glucose)', isScannedAtHub: false, condition: 'MISSING' },
    ],
  },
  {
    id: 'man-02',
    manifestBarcode: 'MNF-2026-0042',
    partnerCode: 'SPK-GN-08',
    centerName: 'Gandhinagar Capital Pathology Spoke',
    tamperSealNumber: 'SEAL-B2B-99120',
    courierRunnerName: 'Dharmesh Bhatt (Van Driver #02)',
    departureTempCelsius: 3.9,
    arrivalTempCelsius: 4.3,
    expectedTubeCount: 3,
    receivedTubeCount: 3,
    discrepancyCount: 0,
    status: 'VERIFIED_100_INTACT',
    packCondition: 'EXCELLENT_SOLID',
    iata650Compliant: true,
    totalBillableInr: 3200,
    items: [
      { tubeBarcode: 'GN-101', patientName: 'Aarav Patel', orderNumber: 'ORD-9901', vacutainerType: 'EDTA Lavender (HbA1c)', isScannedAtHub: true, condition: 'INTACT' },
      { tubeBarcode: 'GN-102', patientName: 'Bhavna Ben', orderNumber: 'ORD-9902', vacutainerType: 'SST Gold Gel (Thyroid Profile)', isScannedAtHub: true, condition: 'INTACT' },
      { tubeBarcode: 'GN-103', patientName: 'Chetan Mehta', orderNumber: 'ORD-9903', vacutainerType: 'Plain Red (Beta HCG)', isScannedAtHub: true, condition: 'INTACT' },
    ],
  },
  {
    id: 'man-03',
    manifestBarcode: 'MNF-2026-0043',
    partnerCode: 'SPK-VP-02',
    centerName: 'Vastrapur OPD Collection Center',
    tamperSealNumber: 'SEAL-B2B-66521',
    courierRunnerName: 'Anil Sharma (Senior Phlebotomist)',
    departureTempCelsius: 4.1,
    arrivalTempCelsius: null,
    expectedTubeCount: 5,
    receivedTubeCount: null,
    discrepancyCount: 0,
    status: 'IN_TRANSIT',
    packCondition: 'EXCELLENT_SOLID',
    iata650Compliant: true,
    totalBillableInr: 2450,
    items: [
      { tubeBarcode: 'VP-201', patientName: 'Sunil Shah', orderNumber: 'ORD-7711', vacutainerType: 'SST Gold Gel', isScannedAtHub: false, condition: 'INTACT' },
      { tubeBarcode: 'VP-202', patientName: 'Priya Joshi', orderNumber: 'ORD-7712', vacutainerType: 'EDTA Lavender', isScannedAtHub: false, condition: 'INTACT' },
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
  const [selectedPackCondition, setSelectedPackCondition] = useState<'EXCELLENT_SOLID' | 'CONDENSATION_TRACE' | 'ICE_MELTED_CRITICAL'>('EXCELLENT_SOLID');
  const [iataChecked, setIataChecked] = useState(true);
  const [activeTab, setActiveTab] = useState<'CLEARING' | 'IATA_CHECKLIST' | 'PARTNERS_LEDGER'>('CLEARING');
  const [verificationFeedback, setVerificationFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    incidentId?: string;
  } | null>(null);

  const handleVerifyDockScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManifest) return;

    const barcodes = scannedTubesText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedItems = selectedManifest.items.map((item) => {
      const isScanned = barcodes.includes(item.tubeBarcode);
      return {
        ...item,
        isScannedAtHub: isScanned,
        condition: isScanned ? item.condition : ('MISSING' as const),
      };
    });

    const receivedCount = barcodes.length;
    const discrepancy = Math.abs(selectedManifest.expectedTubeCount - receivedCount);
    const tempExcursion = arrivalTempInput < 2.0 || arrivalTempInput > 8.0;

    const newStatus: ConsignmentManifestItem['status'] =
      discrepancy > 0 || tempExcursion ? 'DISCREPANCY_FLAGGED' : 'VERIFIED_100_INTACT';

    const updatedManifest: ConsignmentManifestItem = {
      ...selectedManifest,
      items: updatedItems,
      receivedTubeCount: receivedCount,
      arrivalTempCelsius: Number(arrivalTempInput),
      discrepancyCount: discrepancy,
      status: newStatus,
      packCondition: selectedPackCondition,
      iata650Compliant: iataChecked,
    };

    setManifests((prev) =>
      prev.map((m) => (m.id === updatedManifest.id ? updatedManifest : m))
    );
    setSelectedManifest(updatedManifest);

    if (discrepancy > 0 || tempExcursion) {
      const incidentId = `NABL-INC-${Date.now().toString().slice(-4)}`;
      setVerificationFeedback({
        type: 'error',
        incidentId,
        message: `DISCREPANCY LOGGED (${incidentId}): Expected ${selectedManifest.expectedTubeCount} tubes, received ${receivedCount}. ${
          tempExcursion ? `Temperature Excursion (+${arrivalTempInput}°C outside 2°C–8°C). ` : ''
        }Pre-analytical quarantine initiated under ISO 15189:2022 §5.4.4.`,
      });
    } else {
      setVerificationFeedback({
        type: 'success',
        message: `Consignment ${updatedManifest.manifestBarcode} verified 100% intact (${receivedCount}/${updatedManifest.expectedTubeCount} tubes) at +${arrivalTempInput}°C. Spoke ledger billed ₹${updatedManifest.totalBillableInr}. Ready for accessioning.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                B2B Spoke Consignment Clearing &amp; Accessioning Dock
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                IATA DGR P650 / UN 3373 CERTIFIED
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Spoke Manifests &amp; Dock Receiving Bay
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Tamper-evident bag verification, cold-box arrival temperature logging, and 3-way barcode reconciliation
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('CLEARING')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'CLEARING'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Dock Clearing
            </button>
            <button
              onClick={() => setActiveTab('IATA_CHECKLIST')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'IATA_CHECKLIST'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              IATA 650 Checklist
            </button>
            <button
              onClick={() => setActiveTab('PARTNERS_LEDGER')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'PARTNERS_LEDGER'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              Spoke Prepaid Ledgers ({MOCK_PARTNERS.length})
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: DOCK RECEIVING BAY & BARCODE SCANNER */}
      {activeTab === 'CLEARING' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN: INCOMING MANIFESTS LIST */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Incoming Spoke Consignments ({manifests.length})
                </h3>
              </div>
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
                        <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
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
                        {m.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-2">{m.centerName}</h4>
                    <p className="text-xs text-slate-500 font-medium">Runner: {m.courierRunnerName}</p>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-semibold">
                        <Thermometer className="w-3.5 h-3.5 text-blue-600" />
                        Dep: +{m.departureTempCelsius}°C
                        {m.arrivalTempCelsius && ` · Arr: +${m.arrivalTempCelsius}°C`}
                      </span>
                      <span className="font-bold text-slate-800">
                        {m.receivedTubeCount !== null
                          ? `${m.receivedTubeCount} / ${m.expectedTubeCount} Tubes Verified`
                          : `${m.expectedTubeCount} Expected Tubes`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: DOCK ACCESSION SCANNER & RECONCILIATION */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  Dock Accession &amp; Barcode Scanner
                </h3>
                <p className="text-xs text-slate-400">Verifying {selectedManifest?.manifestBarcode}</p>
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
                  <div>
                    <span>{verificationFeedback.message}</span>
                    {verificationFeedback.incidentId && (
                      <div className="mt-1 font-mono text-[10px] text-red-700 font-bold">
                        Incident Ticket: {verificationFeedback.incidentId} (Automated CAPA Triggered)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyDockScan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Dock Arrival Cold-Chain Temp (°C)
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
                    NABL 2°C–8°C limit. Outside triggers CAPA.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Gel-Pack Thermal Condition
                  </label>
                  <select
                    value={selectedPackCondition}
                    onChange={(e) => setSelectedPackCondition(e.target.value as any)}
                    className="w-full py-2 px-3 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="EXCELLENT_SOLID">Solid Frozen Gel Pack (Pass)</option>
                    <option value="CONDENSATION_TRACE">Trace Condensation (Acceptable)</option>
                    <option value="ICE_MELTED_CRITICAL">Completely Melted / Warm (Excursion)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Scanned Vacutainer Barcodes (One per line or barcode scanner input)
                </label>
                <textarea
                  rows={4}
                  value={scannedTubesText}
                  onChange={(e) => setScannedTubesText(e.target.value)}
                  placeholder="Scan barcodes with handheld USB/Bluetooth scanner..."
                  className="w-full font-mono text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
                />
              </div>

              {/* Manifest Checklist Preview */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase block">
                  Expected Tube Checklist ({selectedManifest.items.length} items):
                </span>
                <div className="space-y-1.5">
                  {selectedManifest.items.map((item) => (
                    <div
                      key={item.tubeBarcode}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-[11px]"
                    >
                      <span className="font-mono font-bold text-slate-900">{item.tubeBarcode}</span>
                      <span className="text-slate-700 font-semibold truncate max-w-[140px]">{item.patientName}</span>
                      <span className="text-slate-400 text-[10px]">{item.vacutainerType}</span>
                      {item.isScannedAtHub ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Scanned
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold">Pending Scan</span>
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
                Verify, Reconcile &amp; Accession into Core Laboratory
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 2: IATA PACKING INSTRUCTION 650 CHECKLIST */}
      {activeTab === 'IATA_CHECKLIST' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              IATA Packing Instruction 650 / UN 3373 Biological Substance Category B
            </h3>
            <p className="text-xs text-slate-500">
              Mandatory triple packaging compliance audit for diagnostic specimens transported via road, rail, and airfreight
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] text-blue-700">
                1. Primary Receptacle
              </h4>
              <ul className="space-y-1.5 text-slate-600">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Leak-proof vacutainer tubes with securely fitted rubber stoppers.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Internal pressure resistance tested to 95 kPa (0.95 bar) differential per 49 CFR § 173.199.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] text-blue-700">
                2. Secondary Packaging
              </h4>
              <ul className="space-y-1.5 text-slate-600">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Leak-proof secondary plastic biohazard pouch containing absorbent cellulose wadding.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Absorbent material sufficient to absorb entire liquid volume of all enclosed tubes.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] text-blue-700">
                3. Rigid Outer Packaging
              </h4>
              <ul className="space-y-1.5 text-slate-600">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Rigid insulated outer container passing 1.2 meter drop test.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>UN 3373 diamond-shaped label (50mm x 50mm) with words &quot;BIOLOGICAL SUBSTANCE, CATEGORY B&quot;.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: SPOKE PARTNERS WALLET LEDGER */}
      {activeTab === 'PARTNERS_LEDGER' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {MOCK_PARTNERS.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                      {p.partnerCode}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{p.centerName}</h4>
                    <p className="text-xs text-slate-500">{p.city}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {p.tier.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Contact:</span>
                    <strong className="text-slate-800">{p.contactPerson}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Prepaid Balance:</span>
                    <strong className="text-emerald-700 font-mono text-sm">
                      ₹{p.walletBalanceInr.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Credit Limit:</span>
                    <strong className="text-slate-800 font-mono">
                      ₹{p.creditLimitInr.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Active Consignments:</span>
                    <span className="font-bold text-blue-700">{p.activeConsignmentsCount} In-Transit</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
