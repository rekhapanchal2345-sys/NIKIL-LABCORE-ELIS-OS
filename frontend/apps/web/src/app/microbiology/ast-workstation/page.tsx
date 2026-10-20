'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface AstEntry {
  id: string;
  antibioticCode: string;
  antibioticName: string;
  antibioticClass: string;
  method: string;
  micValueUgMl: number | null;
  zoneDiameterMm: number | null;
  clsiBreakpointS: string;
  clsiBreakpointR: string;
  interpretation: 'S' | 'I' | 'R';
  isRestrictedReserve: boolean;
}

interface MicrobiologyIsolate {
  id: string;
  isolateNumber: number;
  organismCode: string;
  organismName: string;
  gramReaction: 'GRAM_NEGATIVE' | 'GRAM_POSITIVE' | 'YEAST';
  growthDensity: string;
  mdroFlags: string[];
  isHiccAlertTriggered: boolean;
  susceptibilities: AstEntry[];
}

interface MicrobiologyCulture {
  id: string;
  accessionNumber: string;
  sampleId: string;
  orderId: string;
  patientId: string;
  wardOrUnit: string;
  isIcuPatient: boolean;
  sampleSite: string;
  status: string;
  gramStainMorphology: string | null;
  pusCellsCount: string | null;
  epithelialCellsCount: string | null;
  incubationTempCelsius: number;
  colonyCountCfu: string | null;
  isolates: MicrobiologyIsolate[];
}

interface AntibiogramCell {
  antibioticCode: string;
  antibioticName: string;
  totalTested: number;
  susceptibleCount: number;
  intermediateCount: number;
  resistantCount: number;
  susceptibilityPercent: number;
}

interface AntibiogramRow {
  organismName: string;
  gramReaction: string;
  totalIsolates: number;
  mdroCount: number;
  mdroRatePercent: number;
  antibiotics: Record<string, AntibiogramCell>;
}

interface HiccAntibiogramResponse {
  generatedAt: string;
  standard: string;
  windowDays: number;
  icuOnly: boolean;
  antibioticColumns: Array<{
    code: string;
    name: string;
    class: string;
    isRestrictedReserve: boolean;
  }>;
  mdroSurveillanceSummary: Record<string, number>;
  antibiogramMatrix: AntibiogramRow[];
}

const DEFAULT_ABX_INPUTS = [
  { antibioticCode: 'AMK', name: 'Amikacin', micValueUgMl: 4 },
  { antibioticCode: 'MEM', name: 'Meropenem', micValueUgMl: 0.25 },
  { antibioticCode: 'CST', name: 'Colistin (Reserve)', micValueUgMl: 0.5 },
  { antibioticCode: 'LZD', name: 'Linezolid (Reserve)', micValueUgMl: 2 },
  { antibioticCode: 'VAN', name: 'Vancomycin', micValueUgMl: 1 },
  { antibioticCode: 'CIP', name: 'Ciprofloxacin', micValueUgMl: 4 },
  { antibioticCode: 'CRO', name: 'Ceftriaxone', micValueUgMl: 32 },
  { antibioticCode: 'TZP', name: 'Piperacillin-Tazobactam', micValueUgMl: 8 },
];

export default function MicrobiologyAstWorkstationPage() {
  const [cultures, setCultures] = useState<MicrobiologyCulture[]>([]);
  const [selectedCultureId, setSelectedCultureId] = useState<string>('');
  const [antibiogram, setAntibiogram] = useState<HiccAntibiogramResponse | null>(null);
  const [windowDays, setWindowDays] = useState<30 | 90>(30);
  const [icuOnly, setIcuOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Gram Stain Form State
  const [gramMorphology, setGramMorphology] = useState(
    'Gram-negative bacilli seen with abundant polymorphonuclear leukocytes'
  );
  const [pusCells, setPusCells] = useState('>25 / HPF');
  const [epithelialCells, setEpithelialCells] = useState('1-2 / HPF');

  // Isolate & AST Entry Form State
  const [isolateNumber, setIsolateNumber] = useState<number>(1);
  const [organismName, setOrganismName] = useState<string>('Escherichia coli');
  const [gramReaction, setGramReaction] = useState<'GRAM_NEGATIVE' | 'GRAM_POSITIVE' | 'YEAST'>(
    'GRAM_NEGATIVE'
  );
  const [growthDensity, setGrowthDensity] = useState<string>('>10^5 CFU/mL Heavy Pure Growth');
  const [micInputs, setMicInputs] = useState<Record<string, number>>({
    AMK: 4,
    MEM: 0.25,
    CST: 0.5,
    LZD: 2,
    VAN: 1,
    CIP: 4,
    CRO: 32,
    TZP: 8,
  });

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [cultRes, antiRes] = await Promise.all([
        fetch(`${apiBase}/enterprise-tier2/microbiology/cultures`),
        fetch(
          `${apiBase}/enterprise-tier2/microbiology/antibiogram?windowDays=${windowDays}&icuOnly=${icuOnly}`
        ),
      ]);

      if (cultRes.ok) {
        const cultJson = await cultRes.json();
        const list: MicrobiologyCulture[] = cultJson.data || [];
        setCultures(list);
        if (list.length > 0 && !selectedCultureId) {
          setSelectedCultureId(list[0].id);
        }
      }

      if (antiRes.ok) {
        const antiJson = await antiRes.json();
        setAntibiogram(antiJson.data);
      }
    } catch {
      // Fallback local state if backend is offline
    } finally {
      setLoading(false);
    }
  }, [apiBase, windowDays, icuOnly, selectedCultureId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const selectedCulture = cultures.find((c) => c.id === selectedCultureId) || cultures[0];

  const handleSaveGramStain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCulture) return;
    const res = await fetch(`${apiBase}/enterprise-tier2/microbiology/cultures/gram-stain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cultureId: selectedCulture.id,
        gramStainMorphology: gramMorphology,
        pusCellsCount: pusCells,
        epithelialCellsCount: epithelialCells,
        reportedByUserId: 'USR-MICRO-BENCH-01',
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setStatusBanner(`24h Preliminary Gram Stain verified for ${selectedCulture.accessionNumber}`);
      fetchAllData();
    } else {
      setStatusBanner(`Error: ${json.message || 'Failed to save Gram stain'}`);
    }
  };

  const handleSaveIsolateAst = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCulture) return;

    const antibioticPanel = Object.entries(micInputs).map(([code, mic]) => ({
      antibioticCode: code,
      method: 'VITEK2_MIC' as const,
      micValueUgMl: Number(mic),
    }));

    const res = await fetch(`${apiBase}/enterprise-tier2/microbiology/cultures/isolate-ast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cultureId: selectedCulture.id,
        isolateNumber,
        organismCode: `ORG-${organismName.slice(0, 5).toUpperCase()}`,
        organismName,
        gramReaction,
        growthDensity,
        antibioticPanel,
        verifiedByUserId: 'USR-PATH-MICRO-01',
      }),
    });

    const json = await res.json();
    if (res.ok) {
      setStatusBanner(
        `CLSI M100 AST Panel & MDRO Rules evaluated for Isolate #${isolateNumber} (${organismName})`
      );
      fetchAllData();
    } else {
      setStatusBanner(`Error: ${json.message || 'Failed to record AST panel'}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              CLSI M100 Ed. 34 / EUCAST v14.0
            </span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              HICC MDRO Surveillance Active
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-2 text-white">
            Clinical Microbiology, Culture & AST Workstation
          </h1>
          <p className="text-sm text-slate-400">
            24h Preliminary Gram Stain, Polymicrobial Pathogen Isolation, Automated S/I/R Breakpoints & ICU Antibiogram
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAllData()}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium border border-slate-700 transition"
          >
            Refresh Bench Data
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-sm flex justify-between items-center">
          <span>{statusBanner}</span>
          <button onClick={() => setStatusBanner(null)} className="text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Grid: Active Cultures List & Selected Culture Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Culture Queue */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Active Culture Accessions ({cultures.length})
          </h2>
          {loading && cultures.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">Loading cultures...</p>
          ) : (
            <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
              {cultures.map((c) => {
                const isSelected = selectedCulture?.id === c.id;
                const allFlags = c.isolates.flatMap((i) => i.mdroFlags);
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCultureId(c.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500/60'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-300">
                        {c.accessionNumber}
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                          c.isIcuPatient
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {c.wardOrUnit}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-xs text-slate-300">
                      <span>Site: {c.sampleSite}</span>
                      <span>Status: {c.status}</span>
                    </div>
                    {allFlags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {allFlags.map((flag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-600/30 text-red-200 border border-red-500/50"
                          >
                            MDRO ALERT: {flag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Culture Workbench & AST Entry */}
        <div className="lg:col-span-8 space-y-6">
          {selectedCulture && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Accession: {selectedCulture.accessionNumber} ({selectedCulture.sampleSite})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Order: {selectedCulture.orderId} | Patient: {selectedCulture.patientId} | Incubation:{' '}
                    {selectedCulture.incubationTempCelsius}°C
                  </p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                  {selectedCulture.status}
                </span>
              </div>

              {/* 24h Preliminary Gram Stain Form */}
              <form onSubmit={handleSaveGramStain} className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Stage 1: 24h Preliminary Microscopy / Gram Stain
                  </h4>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs transition"
                  >
                    Release 24h Prelim Stain
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-3">
                    <label className="block text-xs text-slate-400 mb-1">Gram Stain Morphology</label>
                    <input
                      type="text"
                      value={gramMorphology}
                      onChange={(e) => setGramMorphology(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Pus Cells (WBC)</label>
                    <input
                      type="text"
                      value={pusCells}
                      onChange={(e) => setPusCells(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Epithelial Cells</label>
                    <input
                      type="text"
                      value={epithelialCells}
                      onChange={(e) => setEpithelialCells(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <p className="text-xs text-slate-400">
                      Current:{' '}
                      <span className="text-slate-200 font-medium">
                        {selectedCulture.gramStainMorphology || 'Pending'}
                      </span>
                    </p>
                  </div>
                </div>
              </form>

              {/* Isolated Organisms & Susceptibility Table */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Isolated Pathogens & Verified CLSI M100 Susceptibility Panels ({selectedCulture.isolates.length})
                </h4>

                {selectedCulture.isolates.map((iso) => (
                  <div
                    key={iso.id}
                    className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-indigo-400 mr-2">
                          Isolate #{iso.isolateNumber}:
                        </span>
                        <span className="text-base font-bold italic text-white">
                          {iso.organismName}
                        </span>
                        <span className="ml-2 text-xs text-slate-400">({iso.growthDensity})</span>
                      </div>
                      <div className="flex gap-1.5">
                        {iso.mdroFlags.length === 0 ? (
                          <span className="px-2 py-0.5 text-xs rounded bg-emerald-500/20 text-emerald-300">
                            No MDRO Phenotype
                          </span>
                        ) : (
                          iso.mdroFlags.map((flag) => (
                            <span
                              key={flag}
                              className="px-2.5 py-0.5 text-xs font-bold rounded bg-rose-600/30 text-rose-200 border border-rose-500/50"
                            >
                              HICC ALERT: {flag}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="py-2 pr-3">Antibiotic</th>
                            <th className="py-2 px-3">Class</th>
                            <th className="py-2 px-3">MIC (µg/mL)</th>
                            <th className="py-2 px-3">CLSI S / R Breakpoint</th>
                            <th className="py-2 pl-3">Interpretation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {iso.susceptibilities.map((s) => (
                            <tr key={s.id}>
                              <td className="py-2 pr-3 font-medium text-white">
                                {s.antibioticName}
                                {s.isRestrictedReserve && (
                                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-300">
                                    Reserve
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-slate-400">{s.antibioticClass}</td>
                              <td className="py-2 px-3 font-mono text-slate-200">
                                {s.micValueUgMl ?? s.zoneDiameterMm}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-400">
                                S: {s.clsiBreakpointS} | R: {s.clsiBreakpointR}
                              </td>
                              <td className="py-2 pl-3">
                                <span
                                  className={`px-2.5 py-0.5 rounded font-bold ${
                                    s.interpretation === 'S'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : s.interpretation === 'I'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  }`}
                                >
                                  {s.interpretation}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add / Update Isolate & VITEK-2 MIC Panel Form */}
              <form
                onSubmit={handleSaveIsolateAst}
                className="space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Stage 2: Record Organism Isolate & VITEK-2 MIC Panel
                  </h4>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
                  >
                    Evaluate Breakpoints & Commit AST
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Isolate #</label>
                    <select
                      value={isolateNumber}
                      onChange={(e) => setIsolateNumber(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                    >
                      <option value={1}>Isolate #1 (Primary)</option>
                      <option value={2}>Isolate #2 (Co-pathogen)</option>
                      <option value={3}>Isolate #3</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">Organism Name</label>
                    <select
                      value={organismName}
                      onChange={(e) => setOrganismName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                    >
                      <option value="Escherichia coli">Escherichia coli</option>
                      <option value="Klebsiella pneumoniae">Klebsiella pneumoniae</option>
                      <option value="Enterococcus faecalis">Enterococcus faecalis</option>
                      <option value="Staphylococcus aureus">Staphylococcus aureus</option>
                      <option value="Pseudomonas aeruginosa">Pseudomonas aeruginosa</option>
                      <option value="Acinetobacter baumannii">Acinetobacter baumannii</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Gram Reaction</label>
                    <select
                      value={gramReaction}
                      onChange={(e) => setGramReaction(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                    >
                      <option value="GRAM_NEGATIVE">GRAM_NEGATIVE</option>
                      <option value="GRAM_POSITIVE">GRAM_POSITIVE</option>
                      <option value="YEAST">YEAST</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {DEFAULT_ABX_INPUTS.map((abx) => (
                    <div key={abx.antibioticCode} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <label className="block text-[11px] font-medium text-slate-300">
                        {abx.name} ({abx.antibioticCode})
                      </label>
                      <div className="mt-1 flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={micInputs[abx.antibioticCode] ?? abx.micValueUgMl}
                          onChange={(e) =>
                            setMicInputs((prev) => ({
                              ...prev,
                              [abx.antibioticCode]: parseFloat(e.target.value) || 0.25,
                            }))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white"
                        />
                        <span className="text-[10px] text-slate-500">µg/mL</span>
                      </div>
                    </div>
                  ))}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: HICC Cumulative Antibiogram Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">
              Hospital Infection Control Committee (HICC) Cumulative Antibiogram
            </h2>
            <p className="text-xs text-slate-400">
              Empirical Antimicrobial Stewardship Matrix (% Susceptible per Pathogen/Antibiotic Pair)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={windowDays}
              onChange={(e) => setWindowDays(Number(e.target.value) as 30 | 90)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            >
              <option value={30}>Past 30 Days Rolling Window</option>
              <option value={90}>Past 90 Days Quarterly Window</option>
            </select>
            <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={icuOnly}
                onChange={(e) => setIcuOnly(e.target.checked)}
                className="rounded border-slate-600"
              />
              ICU Wards Only (MICU / SICU / NICU)
            </label>
          </div>
        </div>

        {antibiogram && (
          <>
            {/* MDRO Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {Object.entries(antibiogram.mdroSurveillanceSummary).map(([flag, count]) => (
                <div
                  key={flag}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <span className="text-xs font-semibold text-slate-400">{flag}</span>
                  <span
                    className={`text-base font-bold font-mono ${
                      count > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>

            {/* Antibiogram Heatmap Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                    <th className="py-3 px-3">Pathogen</th>
                    <th className="py-3 px-2 text-center">Isolates</th>
                    <th className="py-3 px-2 text-center">MDRO %</th>
                    {antibiogram.antibioticColumns.map((col) => (
                      <th key={col.code} className="py-3 px-2 text-center">
                        <div>{col.code}</div>
                        <div className="text-[10px] font-normal text-slate-500">{col.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {antibiogram.antibiogramMatrix.map((row) => (
                    <tr key={row.organismName} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-bold italic text-white">{row.organismName}</td>
                      <td className="py-3 px-2 text-center font-mono">{row.totalIsolates}</td>
                      <td className="py-3 px-2 text-center font-mono text-rose-300">
                        {row.mdroRatePercent}%
                      </td>
                      {antibiogram.antibioticColumns.map((col) => {
                        const cell = row.antibiotics[col.code];
                        if (!cell) {
                          return (
                            <td key={col.code} className="py-3 px-2 text-center text-slate-600">
                              —
                            </td>
                          );
                        }
                        const pct = cell.susceptibilityPercent;
                        const badgeClass =
                          pct >= 80
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : pct >= 50
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                        return (
                          <td key={col.code} className="py-3 px-2 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded border font-mono font-bold ${badgeClass}`}
                            >
                              {pct}%
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
