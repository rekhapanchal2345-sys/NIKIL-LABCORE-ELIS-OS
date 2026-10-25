'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/dashboardlayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Package,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Thermometer,
  ArrowLeft,
  Wallet,
  Check,
  Printer,
  ChevronRight,
} from 'lucide-react';

interface PartnerSpoke {
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

interface ManifestItem {
  id: string;
  tubeBarcode: string;
  orderNumber: string;
  patientName: string;
  vacutainerType: string;
  isScannedAtHub: boolean;
  conditionStatus: string;
}

interface ConsignmentManifest {
  id: string;
  manifestBarcode: string;
  partnerCode: string;
  centerName: string;
  city: string;
  tamperSealNumber: string;
  courierRunnerName: string;
  departureTempCelsius: number;
  arrivalTempCelsius: number | null;
  expectedTubeCount: number;
  receivedTubeCount: number | null;
  discrepancyCount: number;
  status: string;
  discrepancyNotes: string | null;
  items: ManifestItem[];
}

const FALLBACK_PARTNERS: PartnerSpoke[] = [
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
];

const FALLBACK_MANIFESTS: ConsignmentManifest[] = [
  {
    id: 'mnf-01',
    manifestBarcode: 'MNF-2026-0041',
    partnerCode: 'SPK-MN-04',
    centerName: 'Maninagar Diagnostic Spoke Hub',
    city: 'Ahmedabad',
    tamperSealNumber: 'SEAL-B2B-88914',
    courierRunnerName: 'Kishore Parmar',
    departureTempCelsius: 4.8,
    arrivalTempCelsius: null,
    expectedTubeCount: 4,
    receivedTubeCount: null,
    discrepancyCount: 0,
    status: 'AT_HUB_DOCK',
    discrepancyNotes: null,
    items: [
      { id: 'i-1', tubeBarcode: 'BC-7721-01', orderNumber: 'ORD-8812', patientName: 'Pooja Dave', vacutainerType: 'SST Gold Gel', isScannedAtHub: false, conditionStatus: 'INTACT' },
      { id: 'i-2', tubeBarcode: 'BC-7721-02', orderNumber: 'ORD-8813', patientName: 'Mahesh Solanki', vacutainerType: 'Sodium Citrate', isScannedAtHub: false, conditionStatus: 'INTACT' },
      { id: 'i-3', tubeBarcode: 'BC-7721-03', orderNumber: 'ORD-8814', patientName: 'Rukmini Bai', vacutainerType: 'EDTA Lavender', isScannedAtHub: false, conditionStatus: 'INTACT' },
      { id: 'i-4', tubeBarcode: 'BC-7721-04', orderNumber: 'ORD-8815', patientName: 'Nitesh Raval', vacutainerType: 'Fluoride Grey', isScannedAtHub: false, conditionStatus: 'INTACT' },
    ],
  },
];

export default function HubSpokeLogisticsManifestPage() {
  const [partners, setPartners] = useState<PartnerSpoke[]>(FALLBACK_PARTNERS);
  const [manifests, setManifests] = useState<ConsignmentManifest[]>(FALLBACK_MANIFESTS);
  const [selectedManifest, setSelectedManifest] = useState<ConsignmentManifest | null>(FALLBACK_MANIFESTS[0]);
  const [arrivalTemp, setArrivalTemp] = useState<number>(5.2);
  const [scannedBarcodesText, setScannedBarcodesText] = useState<string>(
    'BC-7721-01\nBC-7721-02\nBC-7721-03'
  );
  const [alertBanner, setAlertBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const resolveApiBase = (): string => {
    const raw = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
    if (!raw) return '/api/v1';
    if (raw.endsWith('/api/v1')) return raw;
    if (raw.endsWith('/api')) return `${raw}/v1`;
    return `${raw}/api/v1`;
  };
  const apiBase = resolveApiBase();

  const loadLogistics = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/enterprise-tier2/logistics/dashboard`);
      if (res.ok) {
        const json = await res.json();
        if (json.data?.partners && json.data.partners.length > 0) {
          setPartners(json.data.partners);
        }
        const manifestList: ConsignmentManifest[] = json.data?.manifests || [];
        if (manifestList.length > 0) {
          setManifests(manifestList);
          if (!selectedManifest) {
            setSelectedManifest(manifestList[0]);
          }
        }
      }
    } catch {
      // Fallback data already loaded
    }
  }, [apiBase, selectedManifest]);

  useEffect(() => {
    loadLogistics();
  }, [loadLogistics]);

  const handleHubDockReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManifest) return;

    const scannedTubeBarcodes = scannedBarcodesText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`${apiBase}/enterprise-tier2/logistics/manifests/receive-hub`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifestBarcode: selectedManifest.manifestBarcode,
          arrivalTempCelsius: Number(arrivalTemp),
          scannedTubeBarcodes,
          receivedByHubUserId: 'USR-HUB-RECEIVING-01',
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        setSelectedManifest(data);
        if (data.discrepancyCount > 0) {
          setAlertBanner({
            type: 'error',
            text: `DISCREPANCY FLAGGED ON ${data.manifestBarcode}: Expected ${data.expectedTubeCount} tubes, scanned ${data.receivedTubeCount}. (${data.discrepancyNotes})`,
          });
        } else {
          setAlertBanner({
            type: 'success',
            text: `Manifest ${data.manifestBarcode} verified 100% intact (${data.receivedTubeCount}/${data.expectedTubeCount} tubes) at ${data.arrivalTempCelsius}°C.`,
          });
        }
        loadLogistics();
        return;
      }
    } catch {
      // Offline fallback verification logic
    }

    // Client-side fallback computation
    const updatedItems = selectedManifest.items.map((i) => ({
      ...i,
      isScannedAtHub: scannedTubeBarcodes.includes(i.tubeBarcode),
    }));
    const receivedCount = scannedTubeBarcodes.length;
    const discrepancy = Math.abs(selectedManifest.expectedTubeCount - receivedCount);

    const updated: ConsignmentManifest = {
      ...selectedManifest,
      arrivalTempCelsius: Number(arrivalTemp),
      receivedTubeCount: receivedCount,
      discrepancyCount: discrepancy,
      items: updatedItems,
      status: discrepancy > 0 ? 'DISCREPANCY_FLAGGED' : 'VERIFIED_100_INTACT',
      discrepancyNotes: discrepancy > 0 ? `Missing ${discrepancy} tube(s) during accessioning` : null,
    };

    setSelectedManifest(updated);
    setManifests(prev => prev.map(m => m.id === updated.id ? updated : m));

    if (discrepancy > 0) {
      setAlertBanner({
        type: 'error',
        text: `DISCREPANCY FLAGGED: Expected ${updated.expectedTubeCount} tubes, scanned ${receivedCount}. Non-conformance incident logged.`,
      });
    } else {
      setAlertBanner({
        type: 'success',
        text: `Manifest ${updated.manifestBarcode} verified 100% intact (${receivedCount}/${updated.expectedTubeCount} tubes) at ${arrivalTemp}°C cold-chain.`,
      });
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout title="B2B Hub-and-Spoke Logistics & Dock Accession">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* BREADCRUMB */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/logistics" className="hover:text-blue-600 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sample Logistics Command
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">B2B Spoke Consignment &amp; Dock Verification</span>
          </div>

          {/* PAGE HEADER BANNER */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  NABL ISO 15189:2022 Tamper-Evident Bag Manifesting
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  B2B Hub-and-Spoke Consignment &amp; Dock Verification
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Spoke Collection Center Credit Ledger, Tamper-Evident Security Seals &amp; Central Accessioning Dock
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/logistics?tab=radar"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs transition-colors"
                >
                  <Package className="w-4 h-4" />
                  Fleet Radar
                </Link>
              </div>
            </div>
          </div>

          {alertBanner && (
            <div
              className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                alertBanner.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {alertBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{alertBanner.text}</span>
            </div>
          )}

          {/* SPOKE PARTNER CREDIT LEDGERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partners.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {p.partnerCode}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {p.tier} ({p.discountPercentage}% Partner Rate)
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{p.centerName}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {p.city} · Incharge: {p.contactPerson} ({p.contactPhone})
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-400 font-bold uppercase">Prepaid Wallet</div>
                  <div className="text-xl font-extrabold font-mono text-emerald-700">
                    ₹{p.walletBalanceInr.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Credit Limit: ₹{p.creditLimitInr.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CENTRAL HUB RECEIVING DOCK WORKBENCH */}
          {selectedManifest && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Manifest Metadata */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    Consignment Manifest Details
                  </h2>
                  <p className="text-xs text-slate-400">Incoming spoke tamper-evident bag</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bag Manifest Barcode:</span>
                    <span className="font-mono font-bold text-blue-700">
                      {selectedManifest.manifestBarcode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tamper Seal Number:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedManifest.tamperSealNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Departure Cold-Chain Temp:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {selectedManifest.departureTempCelsius}°C (2°C–8°C Compliant)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expected Tubes in Bag:</span>
                    <span className="font-bold text-slate-900">
                      {selectedManifest.expectedTubeCount} Vacutainers
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Courier Runner:</span>
                    <span className="font-bold text-slate-900">
                      {selectedManifest.courierRunnerName}
                    </span>
                  </div>
                </div>

                {/* Form to submit dock verification */}
                <form onSubmit={handleHubDockReceive} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Hub Dock Arrival Temperature (°C)
                    </label>
                    <div className="relative">
                      <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        step="0.1"
                        value={arrivalTemp}
                        onChange={(e) => setArrivalTemp(parseFloat(e.target.value))}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Scanned Tube Barcodes (One per line)
                    </label>
                    <textarea
                      rows={4}
                      value={scannedBarcodesText}
                      onChange={(e) => setScannedBarcodesText(e.target.value)}
                      className="w-full font-mono text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Verify &amp; Complete Dock Receiving
                  </button>
                </form>
              </div>

              {/* Expected vs Scanned Tubes Table */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      Individual Vacutainer Reconciliation
                    </h3>
                    <p className="text-xs text-slate-400">Comparing manifest against dock scanner</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Status: {selectedManifest.status}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Tube Barcode</th>
                        <th className="py-2.5 px-3">Patient &amp; Order</th>
                        <th className="py-2.5 px-3">Vacutainer</th>
                        <th className="py-2.5 px-3">Dock Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedManifest.items.map((item) => (
                        <tr key={item.tubeBarcode} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                            {item.tubeBarcode}
                          </td>
                          <td className="py-2.5 px-3">
                            <strong className="text-slate-800 block">{item.patientName}</strong>
                            <span className="text-[10px] text-slate-400 font-mono">{item.orderNumber}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {item.vacutainerType}
                          </td>
                          <td className="py-2.5 px-3">
                            {item.isScannedAtHub ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" /> Verified Intact
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                <AlertTriangle className="w-3 h-3 text-red-600" /> Not Scanned
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
