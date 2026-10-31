'use client';

import React, { useState } from 'react';
import { ShipmentTrip, TripStatus, PriorityLevel, TripType } from './logistics.types';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Navigation,
  ArrowRight,
  Zap,
  Phone,
  Thermometer,
  ShieldCheck,
  FileText,
  ChevronDown,
  RefreshCw,
  QrCode,
  Package,
  Layers,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';

interface LiveFleetRadarViewProps {
  shipments: ShipmentTrip[];
  onUpdateStatus: (id: string, newStatus: TripStatus) => void;
  onSelectForManifest: (shipment: ShipmentTrip) => void;
  onOpenDispatch: () => void;
  onTriggerExcursion: (shipmentId: string) => void;
}

export default function LiveFleetRadarView({
  shipments,
  onUpdateStatus,
  onSelectForManifest,
  onOpenDispatch,
  onTriggerExcursion,
}: LiveFleetRadarViewProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  // Statistics
  const activeTripsCount = shipments.filter(s => s.status === 'IN_TRANSIT' || s.status === 'DISPATCHED' || s.status === 'ARRIVED_ORIGIN' || s.status === 'PICKED_UP').length;
  const statPickupsCount = shipments.filter(s => s.priority === 'STAT' && s.status !== 'DELIVERED').length;
  const todayDeliveredCount = shipments.filter(s => s.status === 'DELIVERED').length;
  const delayedRunsCount = shipments.filter(s => s.status === 'DELAYED' || s.etaMinutes < 0).length;
  const coldChainOkPercent = Math.round((shipments.filter(s => s.currentTempCelsius >= 2 && s.currentTempCelsius <= 8 || s.currentTempCelsius <= -20).length / Math.max(1, shipments.length)) * 100);

  const filtered = shipments.filter(s => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      s.trackingId.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.driver.toLowerCase().includes(q) ||
      s.origin.toLowerCase().includes(q) ||
      s.destination.toLowerCase().includes(q) ||
      s.tamperSealNumber.toLowerCase().includes(q) ||
      s.tubes.some(t => t.patientName.toLowerCase().includes(q) || t.uhid.toLowerCase().includes(q) || t.barcode.toLowerCase().includes(q));

    const matchesType = typeFilter === 'ALL' || s.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || s.priority === priorityFilter;

    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: TripStatus) => {
    const map: Record<TripStatus, { label: string; cls: string; dot: string }> = {
      PENDING: { label: 'Pending Dispatch', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
      DISPATCHED: { label: 'Dispatched', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
      ARRIVED_ORIGIN: { label: 'At Origin / Ward', cls: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
      PICKED_UP: { label: 'Specimens Picked Up', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500' },
      IN_TRANSIT: { label: 'In Transit', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500 animate-pulse' },
      DELIVERED: { label: 'Delivered / Accessioned', cls: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
      DELAYED: { label: 'Breach / Delayed', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500 animate-pulse' },
      ON_HOLD_EXCURSION: { label: 'Hold / Excursion Alert', cls: 'bg-rose-50 text-rose-800 border-rose-300', dot: 'bg-rose-600 animate-ping' },
      CANCELLED: { label: 'Cancelled Run', cls: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400' },
      RETURNED: { label: 'Returned to Spoke', cls: 'bg-zinc-100 text-zinc-700 border-zinc-300', dot: 'bg-zinc-500' },
    };
    const conf = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${conf.cls}`}>
        <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
        {conf.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    if (priority === 'CRITICAL_ORGAN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase bg-purple-700 text-white shadow-sm animate-pulse border border-purple-500">
          <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
          CRITICAL ORGAN / PERFUSION
        </span>
      );
    }
    if (priority === 'STAT') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase bg-red-600 text-white shadow-xs animate-pulse">
          <Zap className="w-3 h-3 fill-white" />
          STAT 15-MIN
        </span>
      );
    }
    if (priority === 'URGENT') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-amber-500 text-white">
          URGENT RUN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium uppercase bg-slate-100 text-slate-600 border border-slate-200">
        ROUTINE
      </span>
    );
  };

  const getTypeLabel = (type: TripType) => {
    const map: Record<TripType, { label: string; icon: string; cls: string }> = {
      WARD_STAT: { label: 'Hospital Ward STAT', icon: '🏥', cls: 'text-red-700 bg-red-50 border-red-200' },
      SAMPLE_PICKUP: { label: 'B2B Spoke Pickup', icon: '📦', cls: 'text-blue-700 bg-blue-50 border-blue-200' },
      HOME_COLLECTION: { label: 'Home Phlebotomy', icon: '🏠', cls: 'text-teal-700 bg-teal-50 border-teal-200' },
      INTER_LAB: { label: 'Inter-Lab Referral', icon: '✈️', cls: 'text-purple-700 bg-purple-50 border-purple-200' },
      SUPPLY_DELIVERY: { label: 'Reagent Supply', icon: '🧪', cls: 'text-slate-700 bg-slate-50 border-slate-200' },
      REPORT_COURIER: { label: 'Report Courier', icon: '📄', cls: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
      ORGAN_TRANSPORT: { label: 'Transplant Specimen', icon: '🫀', cls: 'text-rose-800 bg-rose-50 border-rose-300 font-black' },
      CRYOGENIC_TRANSFER: { label: 'LN2 Cryogenic (-196°C)', icon: '❄️', cls: 'text-cyan-800 bg-cyan-50 border-cyan-300' },
      REFERENCE_LAB_REFERRAL: { label: 'Apex Ref Lab (Airfreight)', icon: '🌐', cls: 'text-violet-800 bg-violet-50 border-violet-200' },
    };
    const c = map[type] || { label: type, icon: '🚚', cls: 'text-slate-700 bg-slate-50 border-slate-200' };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${c.cls}`}>
        <span>{c.icon}</span> {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI STATS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Trips</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-blue-700 mt-2">{activeTripsCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">GPS tracked in transit</p>
        </div>

        <div className="bg-white rounded-xl border border-red-100 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">STAT Runs</span>
            <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-red-600 mt-2">{statPickupsCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Under 15-min priority</p>
        </div>

        <div className="bg-white rounded-xl border border-emerald-100 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today Delivered</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">{todayDeliveredCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Accessioned at dock</p>
        </div>

        <div className="bg-white rounded-xl border border-teal-100 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cold Chain SLA</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <Thermometer className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-teal-700 mt-2">{coldChainOkPercent}%</p>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">2°C–8°C compliance</p>
        </div>

        <div className="bg-white rounded-xl border border-orange-100 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Breach / Alerts</span>
            <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-orange-600 mt-2">{delayedRunsCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Action recommended</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fleet Online</span>
            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-700">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800 mt-2">6 / 6</p>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Runners &amp; couriers ready</p>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL TOOLBAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Tracking ID, Ward, Patient UHID, Driver, Seal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium pl-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            Filters:
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="ALL">All Trip Types</option>
            <option value="WARD_STAT">Hospital Ward STAT</option>
            <option value="SAMPLE_PICKUP">B2B Spoke Pickup</option>
            <option value="HOME_COLLECTION">Home Phlebotomy</option>
            <option value="INTER_LAB">Inter-Lab Referral</option>
            <option value="SUPPLY_DELIVERY">Supply Delivery</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="ARRIVED_ORIGIN">At Ward / Origin</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="DELIVERED">Delivered / Docked</option>
            <option value="DELAYED">Delayed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="STAT">STAT Only</option>
            <option value="URGENT">Urgent Only</option>
            <option value="ROUTINE">Routine</option>
          </select>

          {(search || typeFilter !== 'ALL' || statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setTypeFilter('ALL');
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline px-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* LIVE RADAR CORRIDOR SIMULATION */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_70%)] pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-blue-800/60">
          <div className="flex items-center gap-2.5">
            <div className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                Live GPS Transit Radar &amp; Specimen Telemetry
              </h3>
              <p className="text-[11px] text-blue-200">
                Active geofenced tracking of cold-boxes, porter runners, and inter-lab air logistics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-blue-200 bg-blue-950/60 border border-blue-700/50 px-3 py-1.5 rounded-lg">
            <span>NETWORK SPEED: 24.8 km/h</span>
            <span className="text-blue-400">•</span>
            <span>TELEMETRY PING: 4s</span>
          </div>
        </div>

        {/* Dynamic Visual Route Lanes */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {shipments.slice(0, 2).map((s) => (
            <div key={s.id} className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-blue-200">{s.trackingId}</span>
                <span className="font-semibold text-emerald-300 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5" />
                  {s.currentTempCelsius > 0 ? `+${s.currentTempCelsius}°C` : `${s.currentTempCelsius}°C`} (Cold Chain Active)
                </span>
              </div>
              <p className="text-xs font-bold text-white mt-1 truncate">{s.title}</p>
              
              {/* Waypoint progress bar */}
              <div className="mt-2.5 relative">
                <div className="flex items-center justify-between text-[10px] text-blue-200 mb-1">
                  <span className="truncate max-w-[140px]">📍 {s.origin}</span>
                  <span className="font-bold text-amber-300">ETA {s.etaMinutes}m</span>
                  <span className="truncate max-w-[140px]">🏥 {s.destination}</span>
                </div>
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${s.progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-blue-100">
                <span>Rider: {s.driver}</span>
                <span className="font-mono text-blue-300">{s.vehiclePlate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TRIP DIRECTORY CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Active Consignment Runs &amp; Dispatches ({filtered.length})
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Click trip card to inspect vacutainer tubes &amp; chain of custody
          </span>
        </div>

        {filtered.map((s) => {
          const isExpanded = expandedTripId === s.id;
          return (
            <div
              key={s.id}
              className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden shadow-2xs hover:shadow-xs ${
                s.priority === 'STAT'
                  ? 'border-red-300 ring-1 ring-red-100'
                  : 'border-slate-200/90'
              }`}
            >
              {/* Main Card Header */}
              <div className="p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Tracking ID, Badges, Title, Route */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {s.trackingId}
                      </span>
                      {getPriorityBadge(s.priority)}
                      {getStatusBadge(s.status)}
                      {getTypeLabel(s.type)}
                      <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        Seal: {s.tamperSealNumber}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        {s.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium line-clamp-1">
                        {s.description}
                      </p>
                    </div>

                    {/* Route Line */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium flex-wrap pt-1">
                      <span className="inline-flex items-center gap-1 text-slate-800 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        {s.origin}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="inline-flex items-center gap-1 text-slate-800 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {s.destination}
                      </span>
                    </div>

                    {/* Pre-Analytical Stability Window Badge per CLSI GP44-A4 */}
                    {s.status === 'IN_TRANSIT' && s.tempRequirement === '2_TO_8_C' && (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md w-fit">
                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>CLSI GP44-A4: Serum gel separation required within ~{Math.max(15, 120 - (s.etaMinutes + 25))}m (Max allowable transport time)</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Temperature, Courier, Countdown, Fast Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right space-y-1">
                      {/* Live Cold Chain Reading */}
                      <div className="flex items-center sm:justify-end gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
                            s.currentTempCelsius >= 2 && s.currentTempCelsius <= 8
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : s.currentTempCelsius <= -20
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                          }`}
                        >
                          <Thermometer className="w-3 h-3" />
                          {s.currentTempCelsius > 0 ? `+${s.currentTempCelsius}°C` : `${s.currentTempCelsius}°C`}
                          <span className="text-[10px] font-normal opacity-75">
                            ({s.tempRequirement === '2_TO_8_C' ? '2°C–8°C Cold' : s.tempRequirement === 'FROZEN_MINUS_20' ? 'Frozen -20°C' : s.tempRequirement === 'CRYO_LN2_MINUS_196' ? 'Cryo -196°C' : 'Ambient'})
                          </span>
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-800 flex items-center sm:justify-end gap-1.5">
                        <span>{s.driver}</span>
                        <a
                          href={`tel:${s.driverPhone}`}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50"
                          title="Call Driver"
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono">
                        {s.vehicle} · {s.samplesCount} specimens
                      </div>

                      <div className="pt-0.5">
                        {s.status === 'DELIVERED' ? (
                          <span className="text-xs font-bold text-emerald-600 flex items-center sm:justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Delivered &amp; Accessioned
                          </span>
                        ) : s.etaMinutes <= 0 ? (
                          <span className="text-xs font-bold text-red-600 flex items-center sm:justify-end gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> ETA Breached (Overdue)
                          </span>
                        ) : (
                          <span className={`text-xs font-bold flex items-center sm:justify-end gap-1 ${
                            s.priority === 'STAT' ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            <Clock className="w-3.5 h-3.5" /> ~{s.etaMinutes} mins remaining
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <select
                        value={s.status}
                        onChange={(e) => onUpdateStatus(s.id, e.target.value as TripStatus)}
                        className="text-xs font-bold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer focus:outline-none"
                      >
                        <option value="DISPATCHED">Dispatched</option>
                        <option value="ARRIVED_ORIGIN">Arrived Origin</option>
                        <option value="PICKED_UP">Picked Up</option>
                        <option value="IN_TRANSIT">In Transit</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="DELAYED">Flag Delayed</option>
                      </select>

                      <button
                        onClick={() => onSelectForManifest(s)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Print Official Manifest"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Slip
                      </button>

                      <button
                        onClick={() => onTriggerExcursion(s.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Simulate Cold-Chain Thermal Excursion"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        Excursion
                      </button>

                      <button
                        onClick={() => setExpandedTripId(isExpanded ? null : s.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        {isExpanded ? 'Hide' : 'Tubes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* EXPANDED SPECIMEN INVENTORY & CHAIN OF CUSTODY ACCORDION */}
              {isExpanded && (
                <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 space-y-4">
                  {/* Tubes Inventory Table */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-blue-600" />
                        Specimen Vacutainer Manifest ({s.tubes.length} items)
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Tamper Seal: {s.tamperSealNumber}
                      </span>
                    </div>

                    {s.tubes.length > 0 ? (
                      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                            <tr>
                              <th className="py-2 px-3">Barcode</th>
                              <th className="py-2 px-3">UHID / Patient</th>
                              <th className="py-2 px-3">Vacutainer</th>
                              <th className="py-2 px-3">Test Ordered</th>
                              <th className="py-2 px-3">Department</th>
                              <th className="py-2 px-3">Condition</th>
                              <th className="py-2 px-3">Dock Scan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {s.tubes.map((t) => (
                              <tr key={t.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-mono font-bold text-blue-600">{t.barcode}</td>
                                <td className="py-2 px-3">
                                  <div className="font-bold text-slate-800">{t.patientName}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{t.uhid} · {t.ageGender}</div>
                                </td>
                                <td className="py-2 px-3">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-200 bg-slate-50">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.colorHex }} />
                                    {t.vacutainerType.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-700">{t.testName}</td>
                                <td className="py-2 px-3 text-slate-500">{t.department}</td>
                                <td className="py-2 px-3">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    {t.conditionStatus}
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  {t.isScannedAtDock ? (
                                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                                      VERIFIED
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                      AWAITING DOCK
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">No individual tubes logged for supply consignment.</p>
                    )}
                  </div>

                  {/* Chain of Custody Handover Signatures */}
                  <div className="bg-white rounded-lg border border-slate-200 p-3 text-xs">
                    <h5 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Legal Chain of Custody &amp; Handover Attestation
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">1. Releasing Clinician / Nurse</span>
                        <p className="font-bold text-slate-800 mt-0.5">{s.chainOfCustody.releasedBy}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Released at {s.chainOfCustody.releaseTime}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">2. Courier / Runner Handover</span>
                        <p className="font-bold text-slate-800 mt-0.5">{s.chainOfCustody.courierRunnerName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {s.chainOfCustody.courierHandoverTime ? `Signed at ${s.chainOfCustody.courierHandoverTime}` : 'In Transit'}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">3. Central Accessioning Tech</span>
                        <p className="font-bold text-slate-800 mt-0.5">
                          {s.chainOfCustody.receivedByTechnologist || 'Awaiting Hub Delivery'}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {s.chainOfCustody.hubReceivedTime ? `Verified at ${s.chainOfCustody.hubReceivedTime}` : 'Dock Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No consignment trips found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No active or scheduled logistics trips match your search and filter criteria.
            </p>
            <button
              onClick={onOpenDispatch}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Dispatch New Trip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
