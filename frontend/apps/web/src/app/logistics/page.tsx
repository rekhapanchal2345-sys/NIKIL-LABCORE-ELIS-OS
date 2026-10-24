'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/dashboardlayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Truck, MapPin, Package, Clock, CheckCircle2,
  AlertTriangle, RefreshCw, Search, Navigation,
  BarChart3, Users, ArrowRight, Zap,
} from 'lucide-react';

interface Shipment {
  id: string;
  trackingId: string;
  type: 'SAMPLE_PICKUP' | 'SUPPLY_DELIVERY' | 'REPORT_COURIER' | 'INTER_LAB';
  description: string;
  origin: string;
  destination: string;
  driver: string;
  vehicle: string;
  status: 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'DELAYED' | 'PENDING';
  priority: 'STAT' | 'ROUTINE' | 'URGENT';
  eta: string;
  dispatchedAt: string;
  samples?: number;
}

const MOCK_SHIPMENTS: Shipment[] = [
  { id: 'log-001', trackingId: 'TRK-2026-8841', type: 'SAMPLE_PICKUP', description: '4 STAT blood culture bottles + 2 urine samples from ICU', origin: 'ICU Ward 3B', destination: 'Main Laboratory', driver: 'Ramesh Yadav', vehicle: 'Bike RJ-14-BG-2211', status: 'IN_TRANSIT', priority: 'STAT', eta: new Date(Date.now() + 12*60000).toISOString(), dispatchedAt: new Date(Date.now() - 8*60000).toISOString(), samples: 6 },
  { id: 'log-002', trackingId: 'TRK-2026-8840', type: 'REPORT_COURIER', description: 'Signed PDF Reports — Batch of 12 patient reports', origin: 'Main Laboratory', destination: 'Cardiology OPD / Home Delivery', driver: 'Sunil Kumar', vehicle: 'Car GJ-01-AB-9012', status: 'DISPATCHED', priority: 'ROUTINE', eta: new Date(Date.now() + 45*60000).toISOString(), dispatchedAt: new Date(Date.now() - 5*60000).toISOString() },
  { id: 'log-003', trackingId: 'TRK-2026-8832', type: 'SUPPLY_DELIVERY', description: 'Sysmex XN-1000 Reagent Pack — 20 units (cold chain)', origin: 'LabCorp Supply Depot, Ahmedabad', destination: 'Lab Cold Storage', driver: 'Mahendra Singh', vehicle: 'Refrigerated Van MH-12-AQ-5511', status: 'DELAYED', priority: 'URGENT', eta: new Date(Date.now() + 90*60000).toISOString(), dispatchedAt: new Date(Date.now() - 120*60000).toISOString() },
  { id: 'log-004', trackingId: 'TRK-2026-8820', type: 'INTER_LAB', description: 'Referral samples — Molecular diagnostics (NGS panel)', origin: 'Main Laboratory', destination: 'Reference Lab, Mumbai', driver: 'BlueDart Express', vehicle: 'Air Courier', status: 'DELIVERED', priority: 'ROUTINE', eta: new Date(Date.now() - 30*60000).toISOString(), dispatchedAt: new Date(Date.now() - 4*3600000).toISOString(), samples: 3 },
  { id: 'log-005', trackingId: 'TRK-2026-8850', type: 'SAMPLE_PICKUP', description: 'Home collection — 3 patients booked for morning pickup', origin: 'Patient Homes (Zone B)', destination: 'Main Laboratory', driver: 'Anil Sharma', vehicle: 'Bike GJ-06-CD-7741', status: 'PENDING', priority: 'ROUTINE', eta: new Date(Date.now() + 60*60000).toISOString(), dispatchedAt: new Date(Date.now() + 15*60000).toISOString(), samples: 8 },
];

const STAT_CARDS = [
  { label: 'Active Trips', value: '8', sub: 'Currently in transit', color: 'text-blue-600', bg: 'bg-blue-50', Icon: Truck },
  { label: 'STAT Pickups', value: '2', sub: 'Priority sample runs', color: 'text-red-600', bg: 'bg-red-50', Icon: Zap },
  { label: 'Today Deliveries', value: '24', sub: 'Reports + samples', color: 'text-emerald-600', bg: 'bg-emerald-50', Icon: CheckCircle2 },
  { label: 'Delayed Runs', value: '1', sub: 'Beyond ETA — action needed', color: 'text-orange-600', bg: 'bg-orange-50', Icon: AlertTriangle },
  { label: 'Fleet Available', value: '6', sub: 'Bikes + vehicles ready', color: 'text-teal-600', bg: 'bg-teal-50', Icon: Navigation },
  { label: 'Pending Dispatch', value: '3', sub: 'Awaiting assignment', color: 'text-purple-600', bg: 'bg-purple-50', Icon: Clock },
];

export default function LogisticsPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');

  const filtered = MOCK_SHIPMENTS.filter(s => {
    const q = search.toLowerCase();
    const m = !q || s.trackingId.toLowerCase().includes(q) || s.driver.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
    const st = filterStatus === 'ALL' || s.status === filterStatus;
    const ty = filterType === 'ALL' || s.type === filterType;
    return m && st && ty;
  });

  const statusBadge = (status: Shipment['status']) => {
    const map: Record<string, { label: string; cls: string; dot: string }> = {
      DISPATCHED:  { label: 'Dispatched', cls: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
      IN_TRANSIT:  { label: 'In Transit', cls: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500 animate-pulse' },
      DELIVERED:   { label: 'Delivered', cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
      DELAYED:     { label: 'Delayed', cls: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500 animate-pulse' },
      PENDING:     { label: 'Pending', cls: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
    };
    const { label, cls, dot } = map[status] || { label: status, cls: '', dot: '' };
    return <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}><span className={`w-1.5 h-1.5 rounded-full ${dot}`}/>{label}</span>;
  };

  const priorityBadge = (p: Shipment['priority']) => {
    const map = { STAT: 'bg-red-600 text-white', URGENT: 'bg-orange-500 text-white', ROUTINE: 'bg-slate-100 text-slate-600' };
    return <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${map[p] || ''}`}>{p}</span>;
  };

  const typeBadge = (t: Shipment['type']) => {
    const map: Record<string, { label: string; icon: string }> = {
      SAMPLE_PICKUP:    { label: 'Sample Pickup', icon: '??' },
      SUPPLY_DELIVERY:  { label: 'Supply Delivery', icon: '??' },
      REPORT_COURIER:   { label: 'Report Courier', icon: '??' },
      INTER_LAB:        { label: 'Inter-Lab Referral', icon: '??' },
    };
    const { label, icon } = map[t] || { label: t, icon: '??' };
    return <span className="text-xs text-slate-600">{icon} {label}</span>;
  };

  const etaDisplay = (eta: string, status: Shipment['status']) => {
    if (status === 'DELIVERED') return <span className="text-emerald-600 font-medium text-xs">? Delivered</span>;
    const diff = Math.round((new Date(eta).getTime() - Date.now()) / 60000);
    if (diff < 0) return <span className="text-red-600 font-bold text-xs">ETA Breached ({Math.abs(diff)}m ago)</span>;
    return <span className={`text-xs font-medium ${diff < 15 ? 'text-amber-600' : 'text-slate-600'}`}>~{diff}m remaining</span>;
  };

  return (
    <ProtectedRoute>
      <DashboardLayout title="Sample Logistics & Fleet Management">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Truck className="w-6 h-6 text-blue-600" />Sample Logistics &amp; Fleet</h1>
              <p className="text-sm text-slate-500 mt-0.5">Sample pickups · Report delivery · Supply chain · Inter-lab referrals · Cold chain tracking</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium hover:bg-slate-50 transition-colors"><RefreshCw className="w-4 h-4" />Refresh</button>
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"><Truck className="w-4 h-4" />Dispatch Trip</button>
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
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Navigation className="w-4 h-4 text-blue-600" />Live Trip Tracker</h2>
              <div className="flex items-center gap-2 ml-auto w-full sm:w-auto flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="text" placeholder="Tracking ID, Driver…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="ALL">All Types</option>
                  <option value="SAMPLE_PICKUP">Sample Pickup</option>
                  <option value="SUPPLY_DELIVERY">Supply Delivery</option>
                  <option value="REPORT_COURIER">Report Courier</option>
                  <option value="INTER_LAB">Inter-Lab</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="ALL">All Status</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="DISPATCHED">Dispatched</option>
                  <option value="DELAYED">Delayed</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {filtered.map(s => (
                <div key={s.id} className={`px-5 py-4 hover:bg-slate-50 transition-colors ${s.status === 'DELAYED' ? 'border-l-2 border-red-500' : s.status === 'IN_TRANSIT' && s.priority === 'STAT' ? 'border-l-2 border-red-400' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-500">{s.trackingId}</span>
                        {priorityBadge(s.priority)}
                        {statusBadge(s.status)}
                        {typeBadge(s.type)}
                      </div>
                      <p className="text-sm text-slate-700 mt-1 font-medium truncate">{s.description}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                        <MapPin className="w-3 h-3" />{s.origin}
                        <ArrowRight className="w-3 h-3" />
                        <MapPin className="w-3 h-3" />{s.destination}
                      </div>
                    </div>
                    <div className="text-right min-w-max space-y-1">
                      <div className="text-xs font-medium text-slate-700">{s.driver}</div>
                      <div className="text-xs text-slate-400">{s.vehicle}</div>
                      {s.samples && <div className="text-xs text-blue-600 font-medium">{s.samples} samples</div>}
                      {etaDisplay(s.eta, s.status)}
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div className="py-10 text-center text-slate-400 text-sm">No trips match your filter</div>}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 pb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>GPS-tracked fleet · Cold chain monitoring (2-8°C samples) · NABL sample integrity protocol · TAT compliance monitored</span>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
