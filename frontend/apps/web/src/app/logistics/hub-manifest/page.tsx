'use client';

import React, { useState, useEffect, useCallback } from 'react';

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

export default function HubSpokeLogisticsManifestPage() {
  const [partners, setPartners] = useState<PartnerSpoke[]>([]);
  const [manifests, setManifests] = useState<ConsignmentManifest[]>([]);
  const [selectedManifest, setSelectedManifest] = useState<ConsignmentManifest | null>(null);
  const [arrivalTemp, setArrivalTemp] = useState<number>(5.2);
  const [scannedBarcodesText, setScannedBarcodesText] = useState<string>('');
  const [alertBanner, setAlertBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const loadLogistics = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/enterprise-tier2/logistics/dashboard`);
      if (res.ok) {
        const json = await res.json();
        setPartners(json.data.partners || []);
        const manifestList: ConsignmentManifest[] = json.data.manifests || [];
        setManifests(manifestList);
        if (manifestList.length > 0 && !selectedManifest) {
          const first = manifestList[0];
          setSelectedManifest(first);
          // Default to scanning N-1 tubes to demonstrate missing tube detection easily
          setScannedBarcodesText(
            first.items
              .slice(0, Math.max(1, first.items.length - 1))
              .map((i) => i.tubeBarcode)
              .join('\n')
          );
        }
      }
    } catch {
      // Handled gracefully
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

    const json = await res.json();
    if (res.ok) {
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
    } else {
      setAlertBanner({
        type: 'error',
        text: json.message || 'Hub receiving verification failed.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8">
      <div className="border-b border-slate-800 pb-5">
        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
          Cold-Chain 2°C–8°C Custody & Prepaid Partner Ledger
        </span>
        <h1 className="text-2xl font-bold mt-2 text-white">
          B2B Hub-and-Spoke Logistics Manifesting & Franchisee Wallet
        </h1>
        <p className="text-sm text-slate-400">
          Spoke Collection Center Credit Control, Tamper-Evident Bag Manifests & Central Hub Dock Verification
        </p>
      </div>

      {alertBanner && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold ${
            alertBanner.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
          }`}
        >
          {alertBanner.text}
        </div>
      )}

      {/* B2B Partner Wallets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {partners.map((p) => (
          <div
            key={p.id}
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-violet-400">{p.partnerCode}</span>
                <span className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300">
                  {p.tier} ({p.discountPercentage}% B2B Discount)
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">{p.centerName}</h3>
              <p className="text-xs text-slate-400">
                {p.city} • {p.contactPerson} ({p.contactPhone})
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Prepaid Wallet Balance</div>
              <div
                className={`text-xl font-bold font-mono ${
                  p.walletBalanceInr >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                ₹{p.walletBalanceInr.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500">
                Credit Limit: ₹{p.creditLimitInr.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Central Hub Receiving Dock */}
      {selectedManifest && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-bold text-white">
              Central Hub Receiving Dock — Barcode Verification
            </h2>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Manifest Bag Barcode:</span>
                <span className="font-mono font-bold text-violet-300">
                  {selectedManifest.manifestBarcode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tamper Seal #:</span>
                <span className="font-mono text-white">{selectedManifest.tamperSealNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Departure Cold-Chain Temp:</span>
                <span className="font-mono text-emerald-400">
                  {selectedManifest.departureTempCelsius}°C
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expected Tubes in Bag:</span>
                <span className="font-mono font-bold text-white">
                  {selectedManifest.expectedTubeCount} Tubes
                </span>
              </div>
            </div>

            <form onSubmit={handleHubDockReceive} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Arrival IR Probe Temperature (°C) [Mandatory 2°C - 8°C]
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={arrivalTemp}
                  onChange={(e) => setArrivalTemp(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Scanned Physical Tube Barcodes at Hub Dock (1 per line)
                </label>
                <textarea
                  rows={5}
                  value={scannedBarcodesText}
                  onChange={(e) => setScannedBarcodesText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition"
                >
                  Verify Manifest & Reconcile Tubes
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setScannedBarcodesText(
                      selectedManifest.items.map((i) => i.tubeBarcode).join('\n')
                    )
                  }
                  className="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
                >
                  Fill All {selectedManifest.expectedTubeCount} Tubes
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                Manifest Tube Reconciliation ({selectedManifest.manifestBarcode})
              </h2>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  selectedManifest.status === 'RECEIVED_AT_HUB'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : selectedManifest.status === 'RECEIVED_WITH_DISCREPANCY'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {selectedManifest.status}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 pr-3">Tube Barcode</th>
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Patient Name</th>
                    <th className="py-2.5 px-3">Vacutainer</th>
                    <th className="py-2.5 pl-3">Hub Dock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {selectedManifest.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-3 font-mono font-bold text-white">
                        {item.tubeBarcode}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">{item.orderNumber}</td>
                      <td className="py-3 px-3 text-slate-200">{item.patientName}</td>
                      <td className="py-3 px-3 text-slate-400">{item.vacutainerType}</td>
                      <td className="py-3 pl-3">
                        {item.conditionStatus === 'MISSING' ? (
                          <span className="px-2.5 py-0.5 rounded bg-rose-600/30 text-rose-200 border border-rose-500/50 font-bold">
                            MISSING AT HUB
                          </span>
                        ) : item.isScannedAtHub ? (
                          <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                            VERIFIED INTACT
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            IN TRANSIT
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
  );
}
