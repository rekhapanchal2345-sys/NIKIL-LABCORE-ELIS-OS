'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/dashboardlayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Microscope, FlaskConical, Bug, Shield, AlertTriangle,
  CheckCircle2, Clock, Search, ChevronRight, Zap, Dna, Plus,
} from 'lucide-react';

interface CultureResult {
  id: string; sampleType: string; patientName: string; uhid: string;
  orderNumber: string; organism: string | null;
  growthStatus: 'POSITIVE' | 'NEGATIVE' | 'NO_GROWTH' | 'PENDING' | 'CONTAMINATED';
  riskLevel: 'HIGH' | 'MODERATE' | 'LOW' | 'WATCH';
  collectedAt: string;
  antibiotics?: { name: string; result: 'S' | 'I' | 'R'; mic?: string }[];
}

const MOCK_CULTURES: CultureResult[] = [
  { id: 'mic-001', sampleType: 'Urine (Mid-stream)', patientName: 'Meena Sharma', uhid: 'UHID-40012', orderNumber: 'ORD-2026-4412', organism: 'Escherichia coli', growthStatus: 'POSITIVE', riskLevel: 'MODERATE', collectedAt: new Date(Date.now() - 26*3600000).toISOString(), antibiotics: [{ name: 'Amoxicillin', result: 'R', mic: '>32' }, { name: 'Ciprofloxacin', result: 'I', mic: '2' }, { name: 'Nitrofurantoin', result: 'S', mic: '32' }, { name: 'Ceftriaxone', result: 'S', mic: '1' }, { name: 'Meropenem', result: 'S', mic: '0.5' }] },
  { id: 'mic-002', sampleType: 'Blood Culture (Aerobic)', patientName: 'Rajesh Kumar', uhid: 'UHID-50134', orderNumber: 'ORD-2026-4387', organism: 'Klebsiella pneumoniae (ESBL)', growthStatus: 'POSITIVE', riskLevel: 'HIGH', collectedAt: new Date(Date.now() - 48*3600000).toISOString(), antibiotics: [{ name: 'Ampicillin', result: 'R' }, { name: 'Ceftriaxone', result: 'R' }, { name: 'Meropenem', result: 'S', mic: '0.25' }, { name: 'Polymyxin B', result: 'S' }] },
  { id: 'mic-003', sampleType: 'Sputum (AFB)', patientName: 'Anita Patel', uhid: 'UHID-30891', orderNumber: 'ORD-2026-4301', organism: null, growthStatus: 'NO_GROWTH', riskLevel: 'LOW', collectedAt: new Date(Date.now() - 72*3600000).toISOString() },
  { id: 'mic-004', sampleType: 'Blood Culture (Aerobic+Anaerobic)', patientName: 'Suresh Mehta', uhid: 'UHID-60020', orderNumber: 'ORD-2026-4420', organism: null, growthStatus: 'PENDING', riskLevel: 'WATCH', collectedAt: new Date(Date.now() - 12*3600000).toISOString() },
  { id: 'mic-005', sampleType: 'Wound Swab', patientName: 'Priya Joshi', uhid: 'UHID-40551', orderNumber: 'ORD-2026-4398', organism: 'Staphylococcus aureus (MRSA)', growthStatus: 'POSITIVE', riskLevel: 'HIGH', collectedAt: new Date(Date.now() - 36*3600000).toISOString(), antibiotics: [{ name: 'Oxacillin', result: 'R' }, { name: 'Vancomycin', result: 'S', mic: '1' }, { name: 'Linezolid', result: 'S' }, { name: 'Daptomycin', result: 'S', mic: '0.5' }] },
];

const STATS = [
  { label: 'Total Cultures', value: '48', sub: 'Last 7 days', color: 'text-blue-600', bg: 'bg-blue-50', Icon: FlaskConical },
  { label: 'Positive Growth', value: '19', sub: '39.6% positivity', color: 'text-red-600', bg: 'bg-red-50', Icon: Bug },
  { label: 'ESBL Detected', value: '4', sub: 'Extended spectrum β-lactamase', color: 'text-orange-600', bg: 'bg-orange-50', Icon: AlertTriangle },
  { label: 'MRSA Cases', value: '2', sub: 'Methicillin-resistant S. aureus', color: 'text-red-700', bg: 'bg-red-50', Icon: Shield },
  { label: 'Mean TAT (hrs)', value: '38.2', sub: 'Culture + sensitivity', color: 'text-teal-600', bg: 'bg-teal-50', Icon: Clock },
  { label: 'Carbapenem-R', value: '1', sub: 'CRE organism', color: 'text-purple-600', bg: 'bg-purple-50', Icon: Zap },
];

export default function MicrobiologyPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selected, setSelected] = useState<CultureResult | null>(null);

  const filtered = MOCK_CULTURES.filter(c => {
    const q = search.toLowerCase();
    const m = !q || c.patientName.toLowerCase().includes(q) || c.orderNumber.toLowerCase().includes(q) || (c.organism || '').toLowerCase().includes(q);
    const s = filterStatus === 'ALL' || c.growthStatus === filterStatus;
    return m && s;
  });

  const growthBadge = (status: CultureResult['growthStatus']) => {
    const map: Record<string, { label: string; cls: string }> = {
      POSITIVE: { label: 'Positive Growth', cls: 'bg-red-100 text-red-700 border-red-200' },
      NEGATIVE: { label: 'Negative', cls: 'bg-green-100 text-green-700 border-green-200' },
      NO_GROWTH: { label: 'No Growth', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
      PENDING: { label: 'Incubating…', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
      CONTAMINATED: { label: 'Contaminated', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
    };
    const { label, cls } = map[status] || { label: status, cls: '' };
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>{label}</span>;
  };

  const riskBadge = (r: string) => {
    const m: Record<string, string> = { HIGH: 'bg-red-600 text-white', MODERATE: 'bg-orange-500 text-white', WATCH: 'bg-amber-400 text-amber-900', LOW: 'bg-emerald-100 text-emerald-700' };
    return <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${m[r] || ''}`}>{r}</span>;
  };

  const abxBadge = (r: 'S' | 'I' | 'R') => {
    const m = { S: 'bg-green-100 text-green-700', I: 'bg-amber-100 text-amber-700', R: 'bg-red-100 text-red-700' };
    return <span className={`flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${m[r]}`}>{r}</span>;
  };

  return (
    <ProtectedRoute>
      <DashboardLayout title="Microbiology & AMR Intelligence">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Microscope className="w-6 h-6 text-purple-600" />Microbiology &amp; AMR Intelligence</h1>
              <p className="text-sm text-slate-500 mt-0.5">Culture &amp; Sensitivity · VITEK-2 Interface · Antibiogram · NABL ISO 15189:2022</p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"><Plus className="w-4 h-4" />New Culture Request</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {STATS.map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl border border-slate-200 p-4 flex flex-col gap-1`}>
                <s.Icon className={`w-5 h-5 ${s.color}`} />
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                <p className="text-xs font-semibold text-slate-700 leading-tight">{s.label}</p>
                <p className="text-xs text-slate-400">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><FlaskConical className="w-4 h-4 text-purple-600" />Active Culture Worklist</h2>
              <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="text" placeholder="Patient, Order, Organism…" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="ALL">All Status</option>
                  <option value="POSITIVE">Positive</option>
                  <option value="PENDING">Pending</option>
                  <option value="NO_GROWTH">No Growth</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 text-left"><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Patient</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Sample</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Organism</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Growth</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Risk</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Collected</th><th className="px-4 py-3"></th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(c => (
                    <tr key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)} className={`cursor-pointer hover:bg-purple-50 transition-colors ${selected?.id === c.id ? 'bg-purple-50' : ''}`}>
                      <td className="px-4 py-3"><p className="font-medium text-slate-900">{c.patientName}</p><p className="text-xs text-slate-400">{c.uhid} · {c.orderNumber}</p></td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{c.sampleType}</td>
                      <td className="px-4 py-3">{c.organism ? <span className="font-medium text-red-700 italic text-xs">{c.organism}</span> : <span className="text-slate-400">—</span>}</td>
                      <td className="px-4 py-3">{growthBadge(c.growthStatus)}</td>
                      <td className="px-4 py-3">{riskBadge(c.riskLevel)}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{new Date(c.collectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                      <td className="px-4 py-3"><ChevronRight className={`w-4 h-4 transition-transform ${selected?.id === c.id ? 'rotate-90 text-purple-600' : 'text-slate-300'}`} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="py-12 text-center text-slate-400 text-sm">No cultures match your filter</div>}
            </div>
          </div>

          {selected?.antibiotics && selected.antibiotics.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Dna className="w-5 h-5 text-purple-600" />
                <div><h3 className="text-sm font-bold text-slate-900">Antibiogram — <span className="italic">{selected.organism}</span></h3><p className="text-xs text-slate-400">{selected.patientName} · {selected.sampleType}</p></div>
                <div className="ml-auto flex gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-5 h-5 rounded bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">S</span>Susceptible</span>
                  <span className="flex items-center gap-1"><span className="w-5 h-5 rounded bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">I</span>Intermediate</span>
                  <span className="flex items-center gap-1"><span className="w-5 h-5 rounded bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center">R</span>Resistant</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {selected.antibiotics.map(ab => (
                  <div key={ab.name} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                    <div><p className="text-xs font-semibold text-slate-700">{ab.name}</p>{ab.mic && <p className="text-xs text-slate-400">MIC: {ab.mic}</p>}</div>
                    {abxBadge(ab.result)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-400 pb-2">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>NABL ISO 15189:2022 · CLSI M02-A12 Disk Diffusion · EUCAST 2024 Breakpoints</span>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
