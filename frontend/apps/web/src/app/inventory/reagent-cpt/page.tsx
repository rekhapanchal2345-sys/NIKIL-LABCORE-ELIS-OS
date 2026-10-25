'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface ReagentLotItem {
  lotId: string;
  reagentCode: string;
  reagentName: string;
  manufacturer: string;
  analyzerModel: string;
  onBoardStabilityDays: number;
  minimumStockAlertVol: number;
  lotNumber: string;
  expiryDate: string;
  openedOnCarouselAt: string | null;
  calibratorFactor: number;
  initialVolumeMl: number;
  remainingVolumeMl: number;
  kitPurchaseCostInr: number;
  calibratorCostPerTest: number;
  status: string;
  daysOnBoard: number | null;
  isAnalyzerInterlockBlocked: boolean;
}

interface ReagentAlarmItem {
  lotId: string;
  reagentCode: string;
  reagentName: string;
  analyzerModel: string;
  lotNumber: string;
  alarmType: string;
  severity: 'CRITICAL_INTERLOCK' | 'WARNING';
  details: string;
  remainingVolumeMl: number;
}

interface TestCptProfitabilityReport {
  testCode: string;
  testName: string;
  sellingPriceB2CInr: number;
  sellingPriceB2BInr: number;
  totalReagentCostInr: number;
  totalCalibratorCostInr: number;
  totalConsumableOverheadInr: number;
  totalCostPerTestInr: number;
  netMarginB2CInr: number;
  netGrossMarginB2CPercent: number;
  netMarginB2BInr: number;
  netGrossMarginB2BPercent: number;
  reagentBreakdown: Array<{
    reagentCode: string;
    reagentName: string;
    activeLotNumber: string;
    volumePerTestMl: number;
    costPerMlInr: number;
    reagentCostPerTestInr: number;
    cuvettesCount: number;
    pipetteTipsCount: number;
  }>;
}

export default function ReagentCptInventoryPage() {
  const [lots, setLots] = useState<ReagentLotItem[]>([]);
  const [alarms, setAlarms] = useState<ReagentAlarmItem[]>([]);
  const [cptReports, setCptReports] = useState<TestCptProfitabilityReport[]>([]);
  const [selectedTestCode, setSelectedTestCode] = useState<string>('LIPID');
  const [sampleBarcode, setSampleBarcode] = useState<string>('SMP-BIO-2026-441');
  const [executionMessage, setExecutionMessage] = useState<{
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

  const loadInventory = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/enterprise-tier2/inventory/overview`);
      if (res.ok) {
        const json = await res.json();
        setLots(json.data.reagentLots || []);
        setAlarms(json.data.activeAlarms || []);
        setCptReports(json.data.cptProfitability || []);
      }
    } catch {
      // Handled gracefully
    }
  }, [apiBase]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleExecuteTestConsumption = async (e: React.FormEvent) => {
    e.preventDefault();
    setExecutionMessage(null);
    const res = await fetch(`${apiBase}/enterprise-tier2/inventory/consume-recipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testCode: selectedTestCode,
        sampleBarcode,
        orderId: 'ORD-AUTO-CPT',
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setExecutionMessage({
        type: 'success',
        text: `Executed ${selectedTestCode} recipe for ${sampleBarcode}: Decremented ${json.data.totalItemsDecremented} reagents & reaction cuvettes.`,
      });
      loadInventory();
    } else {
      setExecutionMessage({
        type: 'error',
        text: json.message || 'Analyzer Interlock blocked execution.',
      });
      loadInventory();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Automated Recipe Decrement & Analyzer Carousel Interlock
          </span>
          <h1 className="text-2xl font-bold mt-2 text-white">
            Reagent Consumable Inventory & Cost-Per-Test (CPT) Engine
          </h1>
          <p className="text-sm text-slate-400">
            Real-Time Lot Tracking, On-Board Refrigerated Stability Alarms & Net Gross Margin Analytics
          </p>
        </div>

        <form onSubmit={handleExecuteTestConsumption} className="flex flex-wrap items-center gap-2">
          <select
            value={selectedTestCode}
            onChange={(e) => setSelectedTestCode(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
          >
            <option value="LIPID">Run Panel: Lipid Profile (Cholesterol + TG + HDL)</option>
            <option value="TSH">Run Test: Ultrasensitive TSH (Stability Breached Lot Test)</option>
          </select>
          <input
            type="text"
            value={sampleBarcode}
            onChange={(e) => setSampleBarcode(e.target.value)}
            placeholder="Sample Barcode"
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition"
          >
            Simulate Analyzer Run & Decrement
          </button>
        </form>
      </div>

      {executionMessage && (
        <div
          className={`p-4 rounded-xl border text-sm font-medium ${
            executionMessage.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
          }`}
        >
          {executionMessage.text}
        </div>
      )}

      {/* Active Analyzer Interlock Alarms */}
      {alarms.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400">
            Active Analyzer Carousel Interlocks & Stability Alarms ({alarms.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alarms.map((a, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-600 text-white">
                      {a.alarmType}
                    </span>
                    <span className="font-mono text-xs text-rose-200">{a.lotNumber}</span>
                  </div>
                  <p className="text-sm font-bold text-white mt-1">
                    {a.reagentName} ({a.analyzerModel})
                  </p>
                  <p className="text-xs text-rose-200/90 mt-0.5">{a.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* On-Board Reagent Carousel Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-base font-bold text-white">
          On-Board Refrigerated Carousel Lots & Calibrator Factors
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 pr-3">Reagent Kit</th>
                <th className="py-2.5 px-3">Analyzer</th>
                <th className="py-2.5 px-3">Lot #</th>
                <th className="py-2.5 px-3">Cal Factor</th>
                <th className="py-2.5 px-3">Carousel Stability</th>
                <th className="py-2.5 px-3">Remaining Vol</th>
                <th className="py-2.5 pl-3">Interlock Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {lots.map((lot) => {
                const pct = Math.min(
                  100,
                  Math.round((lot.remainingVolumeMl / Math.max(lot.initialVolumeMl, 1)) * 100)
                );
                return (
                  <tr key={lot.lotId}>
                    <td className="py-3 pr-3">
                      <div className="font-bold text-white">{lot.reagentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{lot.reagentCode}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{lot.analyzerModel}</td>
                    <td className="py-3 px-3 font-mono text-indigo-300">{lot.lotNumber}</td>
                    <td className="py-3 px-3 font-mono">{lot.calibratorFactor.toFixed(4)}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-mono ${
                          (lot.daysOnBoard ?? 0) > lot.onBoardStabilityDays
                            ? 'text-rose-400 font-bold'
                            : 'text-slate-300'
                        }`}
                      >
                        {lot.daysOnBoard ?? 0}d / {lot.onBoardStabilityDays}d max
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono text-white">
                        {lot.remainingVolumeMl.toFixed(2)} / {lot.initialVolumeMl} mL ({pct}%)
                      </div>
                      <div className="w-32 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full ${pct > 25 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 pl-3">
                      {lot.isAnalyzerInterlockBlocked ? (
                        <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                          RUN LOCKED ({lot.status})
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                          ACTIVE ON CAROUSEL
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost-Per-Test (CPT) Profitability Engine */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-base font-bold text-white">
          Cost-Per-Test (CPT) & Net Gross Margin Profitability Matrix
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {cptReports.map((rep) => (
            <div
              key={rep.testCode}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="font-mono text-xs text-cyan-400 font-bold">{rep.testCode}</span>
                  <h3 className="text-base font-bold text-white">{rep.testName}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Total Computed CPT</div>
                  <div className="text-lg font-bold font-mono text-amber-300">
                    ₹{rep.totalCostPerTestInr.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center bg-slate-900/90 p-2.5 rounded-lg text-xs">
                <div>
                  <div className="text-slate-400">Reagent Vol Cost</div>
                  <div className="font-mono font-bold text-white mt-0.5">
                    ₹{rep.totalReagentCostInr.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Calibrator Amort.</div>
                  <div className="font-mono font-bold text-white mt-0.5">
                    ₹{rep.totalCalibratorCostInr.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Cuvettes & Tips</div>
                  <div className="font-mono font-bold text-white mt-0.5">
                    ₹{rep.totalConsumableOverheadInr.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                  <div className="text-slate-400">Retail B2C Tariff: ₹{rep.sellingPriceB2CInr}</div>
                  <div className="text-sm font-bold text-emerald-300 mt-1">
                    Net Margin: ₹{rep.netMarginB2CInr} ({rep.netGrossMarginB2CPercent}%)
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/30">
                  <div className="text-slate-400">Partner B2B Rate: ₹{rep.sellingPriceB2BInr}</div>
                  <div className="text-sm font-bold text-indigo-300 mt-1">
                    Net Margin: ₹{rep.netMarginB2BInr} ({rep.netGrossMarginB2BPercent}%)
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
