'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/dashboardlayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Package, AlertTriangle, CheckCircle2, Clock, TrendingDown,
  RefreshCw, Search, Plus, BarChart3, Thermometer, Archive,
  ShoppingCart, Zap, Filter,
} from 'lucide-react';

interface ReagentItem {
  id: string;
  name: string;
  catalog: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  expiryDate: string;
  lotNumber: string;
  location: string;
  status: 'ADEQUATE' | 'LOW' | 'CRITICAL' | 'EXPIRED' | 'ORDERED';
  temperature: string;
  dailyUsage: number;
}

const MOCK_REAGENTS: ReagentItem[] = [
  { id: 'r-001', name: 'Sysmex XN-1000 CBC Reagent Pack', catalog: 'SYS-RG-001', category: 'Hematology', currentStock: 8, minStock: 15, unit: 'Pack', expiryDate: '2027-03-31', lotNumber: 'LOT-A2024-891', location: 'Lab Cold Storage A', status: 'CRITICAL', temperature: '2-8°C', dailyUsage: 3 },
  { id: 'r-002', name: 'HbA1c Calibrator Set', catalog: 'BIO-CA-HBA-55', category: 'Biochemistry', currentStock: 45, minStock: 20, unit: 'Test', expiryDate: '2026-12-15', lotNumber: 'LOT-B1922-443', location: 'Lab Cold Storage B', status: 'ADEQUATE', temperature: '2-8°C', dailyUsage: 8 },
  { id: 'r-003', name: 'D-Dimer Reagent Kit (200T)', catalog: 'STA-DD-200', category: 'Coagulation', currentStock: 2, minStock: 5, unit: 'Kit', expiryDate: '2026-11-30', lotNumber: 'LOT-C2024-220', location: 'Lab Cold Storage A', status: 'CRITICAL', temperature: '2-8°C', dailyUsage: 1 },
  { id: 'r-004', name: 'TSH Immunoassay Reagent', catalog: 'ARCH-TSH-400', category: 'Immunology', currentStock: 28, minStock: 10, unit: 'Test', expiryDate: '2026-10-10', lotNumber: 'LOT-D2024-117', location: 'Immunology Analyzer Onboard', status: 'EXPIRED', temperature: '2-8°C', dailyUsage: 12 },
  { id: 'r-005', name: 'Blood Culture Aerobic Bottles (Box/20)', catalog: 'BD-BCO-AER-20', category: 'Microbiology', currentStock: 40, minStock: 30, unit: 'Bottle', expiryDate: '2027-06-30', lotNumber: 'LOT-E2023-892', location: 'Microbiology Cabinet', status: 'ADEQUATE', temperature: '20-25°C', dailyUsage: 6 },
  { id: 'r-006', name: 'Creatinine Reagent (500T)', catalog: 'ROCH-CREAT-500', category: 'Biochemistry', currentStock: 180, minStock: 100, unit: 'Test', expiryDate: '2027-01-20', lotNumber: 'LOT-F2024-551', location: 'Cobas 6000 Onboard', status: 'ADEQUATE', temperature: '2-8°C', dailyUsage: 35 },
  { id: 'r-007', name: 'Malaria Antigen RDT Kit (25T)', catalog: 'SD-MAL-RDT-25', category: 'Serology', currentStock: 12, minStock: 25, unit: 'Test', expiryDate: '2026-09-15', lotNumber: 'LOT-G2024-030', location: 'Serology Rack 3', status: 'LOW', temperature: '4-30°C', dailyUsage: 5 },
];

const STAT_CARDS = [
  { label: 'Total Line Items', value: '142', sub: 'Reagents & consumables', color: 'text-blue-600', bg: 'bg-blue-50', Icon: Package },
  { label: 'Critical Stock', value: '7', sub: 'Immediate reorder needed', color: 'text-red-600', bg: 'bg-red-50', Icon: AlertTriangle },
  { label: 'Low Stock Alert', value: '12', sub: 'Below minimum threshold', color: 'text-orange-600', bg: 'bg-orange-50', Icon: TrendingDown },
  { label: 'Expiring Soon', value: '5', sub: 'Within 30 days', color: 'text-amber-600', bg: 'bg-amber-50', Icon: Clock },
  { label: 'Pending Orders', value: '3', sub: 'PO raised, awaiting delivery', color: 'text-purple-600', bg: 'bg-purple-50', Icon: ShoppingCart },
  { label: 'Items Adequate', value: '118', sub: 'Normal stock levels', color: 'text-emerald-600', bg: 'bg-emerald-50', Icon: CheckCircle2 },
];

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const categories = ['ALL', ...Array.from(new Set(MOCK_REAGENTS.map(r => r.category)))];

  const filtered = MOCK_REAGENTS.filter(r => {
    const q = search.toLowerCase();
    const m = !q || r.name.toLowerCase().includes(q) || r.catalog.toLowerCase().includes(q) || r.lotNumber.toLowerCase().includes(q);
    const s = filterStatus === 'ALL' || r.status === filterStatus;
    const c = filterCategory === 'ALL' || r.category === filterCategory;
    return m && s && c;
  });

  const statusBadge = (status: ReagentItem['status']) => {
    const map: Record<string, { label: string; cls: string }> = {
      ADEQUATE: { label: 'Adequate', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      LOW:      { label: 'Low Stock', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
      CRITICAL: { label: 'Critical', cls: 'bg-red-100 text-red-700 border-red-200' },
      EXPIRED:  { label: 'Expired!', cls: 'bg-red-600 text-white border-red-600' },
      ORDERED:  { label: 'PO Raised', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    };
    const { label, cls } = map[status] || { label: status, cls: '' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>{label}</span>;
  };

  const stockBar = (current: number, min: number) => {
    const pct = Math.min(100, Math.round((current / (min * 2)) * 100));
    const color = current <= 0 ? 'bg-red-600' : current < min ? 'bg-orange-500' : 'bg-emerald-500';
    return (
      <div className="w-24">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{current} / {min * 2} {''}</p>
      </div>
    );
  };

  const daysLeft = (expiryDate: string) => {
    const days = Math.round((new Date(expiryDate).getTime() - Date.now()) / 86400000);
    if (days < 0) return <span className="text-red-600 font-bold text-xs">Expired!</span>;
    if (days < 30) return <span className="text-amber-600 font-medium text-xs">{days}d left</span>;
    return <span className="text-slate-400 text-xs">{new Date(expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</span>;
  };

  return (
    <ProtectedRoute>
      <DashboardLayout title="Reagent & Inventory Management">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Package className="w-6 h-6 text-indigo-600" />Reagent &amp; Inventory Control</h1>
              <p className="text-sm text-slate-500 mt-0.5">Real-time stock levels · Expiry tracking · Cold chain monitoring · Auto-reorder alerts</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"><RefreshCw className="w-4 h-4" />Sync Stock</button>
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"><Plus className="w-4 h-4" />Raise PO</button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {STAT_CARDS.map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl border border-slate-200 p-4`}>
                <s.Icon className={`w-5 h-5 ${s.color}`} />
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                <p className="text-xs font-semibold text-slate-700 leading-tight mt-0.5">{s.label}</p>
                <p className="text-xs text-slate-400">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Archive className="w-4 h-4 text-indigo-600" />Reagent &amp; Consumable Register</h2>
              <div className="flex items-center gap-2 ml-auto w-full sm:w-auto flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="text" placeholder="Search reagent, catalog, lot…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {categories.map(c => <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="ALL">All Status</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="LOW">Low</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="ADEQUATE">Adequate</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 text-left"><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Item</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Stock Level</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Lot / Location</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Expiry</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th><th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Daily Use</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3"><p className="font-medium text-slate-900 text-xs">{r.name}</p><p className="text-xs text-slate-400">{r.catalog} · <Thermometer className="w-3 h-3 inline" /> {r.temperature}</p></td>
                      <td className="px-4 py-3 text-xs text-slate-600">{r.category}</td>
                      <td className="px-4 py-3">{stockBar(r.currentStock, r.minStock)}</td>
                      <td className="px-4 py-3"><p className="text-xs text-slate-600">{r.lotNumber}</p><p className="text-xs text-slate-400">{r.location}</p></td>
                      <td className="px-4 py-3">{daysLeft(r.expiryDate)}</td>
                      <td className="px-4 py-3">{statusBadge(r.status)}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{r.dailyUsage} {r.unit}/day</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="py-10 text-center text-slate-400 text-sm">No items match your filter</div>}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 pb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>NABL ISO 15189:2022 Compliant · Cold Chain IoT Monitored · Auto-reorder at threshold · FIFO Dispensing Protocol</span>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
