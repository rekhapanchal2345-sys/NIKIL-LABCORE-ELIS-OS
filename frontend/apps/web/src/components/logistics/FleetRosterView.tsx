'use client';

// ============================================================
// LABCORE ELIS — Fleet & Medical Courier Roster
// Enterprise-grade cold-chain fleet management panel
// ISO 15189:2022 | CAP | NABL certified transport operations
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { MOCK_FLEET_VEHICLES, MOCK_LOGISTICS_KPI } from './mockLogisticsData';
import { FleetVehicle, FleetVehicleStatus, DriverCertification, TempBand } from './logistics.types';
import {
  Truck, Phone, Navigation, BatteryCharging, ShieldCheck, CheckCircle2,
  Thermometer, Zap, MapPin, Clock, Radio, AlertTriangle, Settings,
  Activity, User, Award, Gauge, Package, Wrench, Battery, Wifi,
  WifiOff, Fuel, BarChart3, RefreshCw, ArrowUpRight, ThermometerSnowflake,
  CircleCheck, TrendingUp, ChevronDown, ChevronUp, Info, Star,
  Signal, Car, Bike, Ambulance, Plus, Filter, Search, Download,
  Eye, FileText, Calendar, Shield, Target, Layers,
} from 'lucide-react';

interface FleetRosterViewProps {
  onAssignTrip: (driverName: string) => void;
}

// ─── Status configuration matrix ───────────────────────────
const STATUS_CONFIG: Record<FleetVehicleStatus, {
  label: string;
  bgCls: string;
  textCls: string;
  borderCls: string;
  dotCls: string;
  pulse: boolean;
}> = {
  ACTIVE_STAT:         { label: 'ACTIVE — STAT RUN',      bgCls: 'bg-red-50',     textCls: 'text-red-700',      borderCls: 'border-red-300',    dotCls: 'bg-red-500',     pulse: true  },
  EN_ROUTE:            { label: 'En Route',                bgCls: 'bg-blue-50',    textCls: 'text-blue-700',     borderCls: 'border-blue-300',   dotCls: 'bg-blue-500',    pulse: false },
  AT_PICKUP:           { label: 'At Pickup Location',      bgCls: 'bg-violet-50',  textCls: 'text-violet-700',   borderCls: 'border-violet-300', dotCls: 'bg-violet-500',  pulse: false },
  AVAILABLE:           { label: 'Available / Ready',       bgCls: 'bg-emerald-50', textCls: 'text-emerald-700',  borderCls: 'border-emerald-300',dotCls: 'bg-emerald-500', pulse: false },
  CHARGING:            { label: 'Charging',                bgCls: 'bg-amber-50',   textCls: 'text-amber-700',    borderCls: 'border-amber-300',  dotCls: 'bg-amber-500',   pulse: false },
  MAINTENANCE:         { label: 'Under Maintenance',       bgCls: 'bg-slate-100',  textCls: 'text-slate-600',    borderCls: 'border-slate-300',  dotCls: 'bg-slate-400',   pulse: false },
  OFFLINE:             { label: 'Offline / No Signal',     bgCls: 'bg-red-100',    textCls: 'text-red-600',      borderCls: 'border-red-200',    dotCls: 'bg-red-400',     pulse: false },
  DISPATCHED_COLDCHAIN:{ label: 'Dispatched — Cold-Chain', bgCls: 'bg-cyan-50',    textCls: 'text-cyan-700',     borderCls: 'border-cyan-300',   dotCls: 'bg-cyan-500',    pulse: true  },
};

// ─── Vehicle type icon/label config ─────────────────────────
const VEHICLE_ICON_MAP: Record<string, React.ReactNode> = {
  BIKE_COLD_BOX:       <Bike className="w-4 h-4 text-blue-600" />,
  ELECTRIC_CART:       <Car className="w-4 h-4 text-emerald-600" />,
  REFRIGERATED_VAN:    <Truck className="w-4 h-4 text-violet-600" />,
  AIR_CARRIER:         <Layers className="w-4 h-4 text-indigo-600" />,
  PNEUMATIC_TUBE:      <Activity className="w-4 h-4 text-teal-600" />,
  HOSPITAL_PORTER:     <Package className="w-4 h-4 text-slate-600" />,
  AMBULANCE_LOGISTICS: <Ambulance className="w-4 h-4 text-red-600" />,
  DRONE_DELIVERY:      <Navigation className="w-4 h-4 text-purple-600" />,
};

// ─── Certification label map ────────────────────────────────
const CERT_LABELS: Record<DriverCertification, { label: string; color: string }> = {
  DMLT:                       { label: 'DMLT',             color: 'bg-blue-100 text-blue-700 border-blue-200' },
  BMLT:                       { label: 'BMLT',             color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  PHLEBOTOMY_CERTIFIED:       { label: 'Phlebotomy',       color: 'bg-purple-100 text-purple-700 border-purple-200' },
  BIOLOGICAL_TRANSPORT_IATA:  { label: 'IATA P650',        color: 'bg-amber-100 text-amber-800 border-amber-300' },
  COLD_CHAIN_CERTIFIED:       { label: 'Cold-Chain',       color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  DEFENSIVE_DRIVING:          { label: 'Def. Driving',     color: 'bg-slate-100 text-slate-700 border-slate-200' },
  HOSPITAL_PORTER_CERTIFIED:  { label: 'Porter Cert.',     color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

// ─── Temperature band config ────────────────────────────────
const TEMP_BAND_CONFIG: Record<TempBand, { label: string; icon: React.ReactNode; color: string }> = {
  '2_TO_8_C':         { label: '2°C – 8°C',     icon: <ThermometerSnowflake className="w-3 h-3" />, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  'FROZEN_MINUS_20':  { label: '–20°C Frozen',   icon: <ThermometerSnowflake className="w-3 h-3" />, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  'DEEP_FREEZE_MINUS_80':{ label: '–80°C Deep',  icon: <ThermometerSnowflake className="w-3 h-3" />, color: 'text-violet-700 bg-violet-50 border-violet-200' },
  'AMBIENT_15_25':    { label: '15°C – 25°C',    icon: <Thermometer className="w-3 h-3" />,         color: 'text-amber-700 bg-amber-50 border-amber-200' },
  'ROOM_TEMP_20_25':  { label: '20°C – 25°C',    icon: <Thermometer className="w-3 h-3" />,         color: 'text-orange-700 bg-orange-50 border-orange-200' },
  'CRYO_LN2_MINUS_196':{ label: '–196°C LN₂',   icon: <ThermometerSnowflake className="w-3 h-3" />, color: 'text-purple-700 bg-purple-50 border-purple-200' },
};

// ─── Battery indicator component ────────────────────────────
function BatteryBar({ percent }: { percent: number }) {
  const colorCls = percent > 60 ? 'bg-emerald-500' : percent > 25 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorCls}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={`text-[11px] font-bold font-mono ${percent > 60 ? 'text-emerald-700' : percent > 25 ? 'text-amber-700' : 'text-red-600'}`}>
        {percent}%
      </span>
    </div>
  );
}

// ─── Temperature gauge display ───────────────────────────────
function TempGauge({ tempC, band }: { tempC: number; band: TempBand }) {
  const bandCfg = TEMP_BAND_CONFIG[band];
  const isInRange = (
    (band === '2_TO_8_C' && tempC >= 2 && tempC <= 8) ||
    (band === 'FROZEN_MINUS_20' && tempC <= -20) ||
    (band === 'DEEP_FREEZE_MINUS_80' && tempC <= -80) ||
    (band === 'AMBIENT_15_25' && tempC >= 15 && tempC <= 25) ||
    (band === 'ROOM_TEMP_20_25' && tempC >= 20 && tempC <= 25) ||
    (band === 'CRYO_LN2_MINUS_196' && tempC <= -195)
  );

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold font-mono ${
      isInRange ? bandCfg.color : 'text-red-700 bg-red-50 border-red-300 animate-pulse'
    }`}>
      {bandCfg.icon}
      {tempC > 0 ? `+${tempC.toFixed(1)}°C` : `${tempC.toFixed(1)}°C`}
      {!isInRange && <AlertTriangle className="w-3 h-3 text-red-600" />}
    </div>
  );
}

// ─── Vehicle Condition Badge ─────────────────────────────────
function ConditionBadge({ condition }: { condition: FleetVehicle['vehicleCondition'] }) {
  const map = {
    EXCELLENT:     { cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Excellent' },
    GOOD:          { cls: 'text-blue-700 bg-blue-50 border-blue-200',          label: 'Good' },
    FAIR:          { cls: 'text-amber-700 bg-amber-50 border-amber-200',        label: 'Fair' },
    NEEDS_SERVICE: { cls: 'text-red-700 bg-red-50 border-red-200',             label: 'Needs Service' },
  };
  const cfg = map[condition];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold ${cfg.cls}`}>
      <Wrench className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

// ─── Signal Strength Indicator ────────────────────────────────
function SignalStrength({ strength }: { strength?: FleetVehicle['status'] }) {
  // Using strength prop type loosely — map from sensor signalStrength
  const bars = {
    'ACTIVE_STAT': 4,         // proxy for signal strength display
    'EN_ROUTE': 3,
    'AT_PICKUP': 3,
    'AVAILABLE': 4,
    'CHARGING': 4,
    'MAINTENANCE': 1,
    'OFFLINE': 0,
    'DISPATCHED_COLDCHAIN': 3,
  };
  const count = bars[strength as keyof typeof bars] ?? 3;
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`w-1 rounded-sm transition-all ${
          i <= count ? 'bg-emerald-500' : 'bg-slate-200'
        }`} style={{ height: `${i * 25}%` }} />
      ))}
    </div>
  );
}

// ─── Expanded Vehicle Detail Panel ────────────────────────────
function VehicleDetailPanel({ vehicle, onAssignTrip }: { vehicle: FleetVehicle; onAssignTrip: () => void }) {
  return (
    <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Certifications */}
      <div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
          Driver Certifications & Qualifications
        </span>
        <div className="flex flex-wrap gap-1">
          {vehicle.driverCertifications.map(cert => {
            const cfg = CERT_LABELS[cert];
            return (
              <span key={cert} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[10px] font-bold ${cfg.color}`}>
                <Award className="w-2.5 h-2.5" />
                {cfg.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Cold Box & Compliance */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cold Box Serial</span>
          <span className="text-[11px] font-mono font-bold text-slate-800 block mt-0.5 truncate">
            {vehicle.coldBoxSerialNumber || '—'}
          </span>
          <span className="text-[10px] text-slate-400 block">
            Cert. Until: <span className="text-emerald-700 font-bold">{vehicle.coldBoxCertifiedUntil || '—'}</span>
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Service Schedule</span>
          <span className="text-[11px] font-semibold text-slate-700 block mt-0.5">
            Last: <span className="text-slate-900">{vehicle.lastServiced || '—'}</span>
          </span>
          <span className="text-[10px] text-amber-700 font-semibold block">
            Next Due: {vehicle.nextServiceDue || '—'}
          </span>
        </div>
      </div>

      {/* Compliance Certificates */}
      {vehicle.complianceCertificates && vehicle.complianceCertificates.length > 0 && (
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Compliance Standards Certified
          </span>
          <div className="flex flex-wrap gap-1">
            {vehicle.complianceCertificates.map(cert => (
              <span key={cert} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                <ShieldCheck className="w-2.5 h-2.5" />
                {cert.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Current Assignment */}
      {vehicle.activeShipmentTracking && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-700 uppercase block">Active Shipment</span>
            <span className="text-[11px] font-mono font-extrabold text-blue-900">{vehicle.activeShipmentTracking}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-lg border border-blue-200">
            <Radio className="w-3 h-3 animate-pulse text-blue-600" />
            Live Tracking
          </span>
        </div>
      )}

      {/* Speed & Odometer */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Speed</span>
          <span className="text-base font-extrabold font-mono text-slate-800">
            {vehicle.speedKmh ?? 0}
          </span>
          <span className="text-[9px] text-slate-400">km/h</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Today KM</span>
          <span className="text-base font-extrabold font-mono text-slate-800">
            {vehicle.totalKmToday.toFixed(1)}
          </span>
          <span className="text-[9px] text-slate-400">km</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Trips</span>
          <span className="text-base font-extrabold font-mono text-slate-800">
            {vehicle.tripsToday}
          </span>
          <span className="text-[9px] text-slate-400">today</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onAssignTrip}
          className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Assign New Trip
        </button>
        <a
          href={`tel:${vehicle.driverPhone}`}
          className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
        >
          <Phone className="w-3.5 h-3.5 text-blue-600" />
          Call
        </a>
        <button className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all">
          <FileText className="w-3.5 h-3.5 text-slate-600" />
          Log
        </button>
      </div>
    </div>
  );
}

// ─── Main Vehicle Card ────────────────────────────────────────
function VehicleCard({ vehicle, onAssignTrip }: { vehicle: FleetVehicle; onAssignTrip: (name: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[vehicle.status];
  const bandCfg = TEMP_BAND_CONFIG[vehicle.tempBand];
  const vehicleIcon = VEHICLE_ICON_MAP[vehicle.vehicleType] ?? <Truck className="w-4 h-4 text-slate-600" />;

  return (
    <div className={`bg-white rounded-xl border shadow-2xs transition-all hover:shadow-sm ${
      vehicle.status === 'ACTIVE_STAT' ? 'border-red-300 ring-1 ring-red-200/60' :
      vehicle.status === 'DISPATCHED_COLDCHAIN' ? 'border-cyan-300 ring-1 ring-cyan-200/60' :
      'border-slate-200 hover:border-slate-300'
    }`}>
      {/* Card Header */}
      <div className="p-4">
        {/* Top row: plate, type, status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg border ${
              vehicle.status === 'ACTIVE_STAT' ? 'bg-red-50 border-red-200' :
              vehicle.status === 'AVAILABLE' ? 'bg-emerald-50 border-emerald-200' :
              'bg-slate-50 border-slate-200'
            }`}>
              {vehicleIcon}
            </div>
            <div>
              <span className="text-[10px] font-mono font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block">
                {vehicle.plate}
              </span>
              <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{vehicle.type}</h4>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${statusCfg.bgCls} ${statusCfg.textCls} ${statusCfg.borderCls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotCls} ${statusCfg.pulse ? 'animate-ping' : ''}`} />
              {statusCfg.label}
            </span>
            <ConditionBadge condition={vehicle.vehicleCondition} />
          </div>
        </div>

        {/* Driver */}
        <div className="flex items-center gap-1.5 mb-3 pb-3 border-b border-slate-100">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-700 font-semibold truncate">{vehicle.driver}</span>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Location */}
          <div className="col-span-2 p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Location</span>
              <span className="text-[11px] font-bold text-slate-800 line-clamp-2">{vehicle.currentLocation}</span>
            </div>
          </div>

          {/* Temperature */}
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Cryo-Box Temp</span>
            <TempGauge tempC={vehicle.boxTempCelsius} band={vehicle.tempBand} />
            <span className={`text-[9px] font-bold mt-0.5 block ${bandCfg.color.split(' ')[0]}`}>
              Target: {bandCfg.label}
            </span>
          </div>

          {/* Battery */}
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Battery Level</span>
            <BatteryBar percent={vehicle.batteryPercent} />
            {vehicle.fuelLevelPercent !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                <Fuel className="w-2.5 h-2.5 text-amber-600" />
                <span className="text-[10px] font-bold text-amber-700">{vehicle.fuelLevelPercent}% fuel</span>
              </div>
            )}
          </div>

          {/* Trips Today */}
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Trips Today</span>
            <span className="text-sm font-extrabold text-slate-800 font-mono">{vehicle.tripsToday}</span>
            <span className="text-[10px] text-slate-400 block">runs completed</span>
          </div>

          {/* Signal / Connectivity */}
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">GPS Signal</span>
            <div className="flex items-center gap-1.5">
              <SignalStrength strength={vehicle.status} />
              <span className="text-[10px] font-semibold text-slate-600">
                {vehicle.status === 'OFFLINE' ? 'No Signal' : vehicle.status === 'MAINTENANCE' ? 'Weak' : 'Live'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="flex items-center justify-between">
          <a
            href={`tel:${vehicle.driverPhone}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            {vehicle.driverPhone}
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAssignTrip(vehicle.driver)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Assign
            </button>
            <button
              onClick={() => setExpanded(prev => !prev)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all cursor-pointer"
              title={expanded ? 'Collapse' : 'View Details'}
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <VehicleDetailPanel
            vehicle={vehicle}
            onAssignTrip={() => onAssignTrip(vehicle.driver)}
          />
        </div>
      )}
    </div>
  );
}

// ─── KPI Metric Card ──────────────────────────────────────────
function KpiCard({
  label, value, unit, icon, colorCls = 'text-slate-800',
  bgCls = 'bg-slate-50', borderCls = 'border-slate-200',
  trend,
}: {
  label: string; value: string | number; unit?: string;
  icon: React.ReactNode; colorCls?: string; bgCls?: string; borderCls?: string;
  trend?: { direction: 'up' | 'down'; value: string; good: boolean };
}) {
  return (
    <div className={`rounded-xl border p-3.5 ${bgCls} ${borderCls}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="p-1 rounded-lg bg-white/80 border border-white shadow-2xs">{icon}</div>
      </div>
      <div className="flex items-end gap-1">
        <span className={`text-xl font-extrabold font-mono ${colorCls}`}>{value}</span>
        {unit && <span className="text-xs text-slate-500 pb-0.5 font-semibold">{unit}</span>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-1 text-[10px] font-bold ${trend.good ? 'text-emerald-600' : 'text-red-600'}`}>
          <TrendingUp className={`w-3 h-3 ${trend.direction === 'down' ? 'rotate-180' : ''}`} />
          {trend.value}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN FLEET ROSTER VIEW COMPONENT
// ════════════════════════════════════════════════════════════
export default function FleetRosterView({ onAssignTrip }: FleetRosterViewProps) {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>(MOCK_FLEET_VEHICLES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const kpi = MOCK_LOGISTICS_KPI;

  // Simulated live refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefreshed(new Date());
      // Simulate minor temp fluctuation for realism
      setVehicles(prev => prev.map(v => ({
        ...v,
        boxTempCelsius: parseFloat((v.boxTempCelsius + (Math.random() - 0.5) * 0.1).toFixed(2)),
        speedKmh: v.status === 'EN_ROUTE' || v.status === 'ACTIVE_STAT' || v.status === 'DISPATCHED_COLDCHAIN'
          ? Math.max(0, (v.speedKmh ?? 30) + Math.round((Math.random() - 0.5) * 8))
          : v.speedKmh,
      })));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastRefreshed(new Date());
      setIsRefreshing(false);
    }, 800);
  }, []);

  // Filtered vehicles
  const filteredVehicles = vehicles.filter(v => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      v.plate.toLowerCase().includes(q) ||
      v.driver.toLowerCase().includes(q) ||
      v.currentLocation.toLowerCase().includes(q) ||
      v.type.toLowerCase().includes(q) ||
      (v.activeShipmentTracking?.toLowerCase().includes(q) ?? false);
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || v.vehicleType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const activeCount = vehicles.filter(v => ['ACTIVE_STAT', 'EN_ROUTE', 'AT_PICKUP', 'DISPATCHED_COLDCHAIN'].includes(v.status)).length;
  const availableCount = vehicles.filter(v => v.status === 'AVAILABLE' || v.status === 'CHARGING').length;
  const alertCount = vehicles.filter(v => v.vehicleCondition === 'NEEDS_SERVICE' || v.status === 'OFFLINE').length;

  return (
    <div className="space-y-5">

      {/* ── FLEET COMMAND HEADER ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Title Strip */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              Logistics Fleet Telemetry — Live
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              Fleet &amp; Medical Courier Roster
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Registered hospital electric carts, cold-box bikes, refrigerated vans and certified medical phlebotomists — ISO 15189:2022 compliant
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Fleet Status Summary */}
            <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                {activeCount} Active
              </span>
              <span className="w-px h-4 bg-slate-300" />
              <span className="font-bold text-blue-700">{availableCount} Ready</span>
              <span className="w-px h-4 bg-slate-300" />
              {alertCount > 0 ? (
                <span className="font-bold text-red-600">{alertCount} Alert</span>
              ) : (
                <span className="font-bold text-slate-500">{vehicles.length} Total</span>
              )}
            </div>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all cursor-pointer"
              title="Refresh fleet telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── REAL-TIME KPI METRICS ROW ─────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-0 divide-x divide-y divide-slate-100">
          {[
            {
              label: 'Fleet Active',
              value: activeCount,
              unit: 'vehicles',
              icon: <Truck className="w-4 h-4 text-blue-600" />,
              colorCls: 'text-blue-800',
              bgCls: 'bg-blue-50/40',
              borderCls: 'border-transparent',
            },
            {
              label: 'Fleet Available',
              value: availableCount,
              unit: 'ready',
              icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
              colorCls: 'text-emerald-800',
              bgCls: 'bg-emerald-50/40',
              borderCls: 'border-transparent',
            },
            {
              label: 'Avg TAT',
              value: kpi.avgTatMinutes.toFixed(1),
              unit: 'mins',
              icon: <Clock className="w-4 h-4 text-amber-600" />,
              colorCls: 'text-amber-800',
              bgCls: 'bg-amber-50/40',
              borderCls: 'border-transparent',
              trend: { direction: 'down' as const, value: '2.1m better vs last week', good: true },
            },
            {
              label: 'Cold-Chain OK',
              value: `${kpi.coldChainCompliancePercent}%`,
              unit: '',
              icon: <ThermometerSnowflake className="w-4 h-4 text-cyan-600" />,
              colorCls: 'text-cyan-800',
              bgCls: 'bg-cyan-50/40',
              borderCls: 'border-transparent',
            },
            {
              label: 'Fleet Utilization',
              value: `${kpi.fleetUtilizationPercent.toFixed(0)}%`,
              unit: '',
              icon: <BarChart3 className="w-4 h-4 text-violet-600" />,
              colorCls: 'text-violet-800',
              bgCls: 'bg-violet-50/40',
              borderCls: 'border-transparent',
            },
            {
              label: 'KM Today',
              value: kpi.totalKmCoveredToday.toFixed(0),
              unit: 'km',
              icon: <Navigation className="w-4 h-4 text-slate-600" />,
              colorCls: 'text-slate-800',
              bgCls: 'bg-slate-50/40',
              borderCls: 'border-transparent',
            },
          ].map((m, i) => (
            <div key={i} className={`p-3 ${m.bgCls}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{m.label}</span>
                {m.icon}
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-extrabold font-mono ${m.colorCls}`}>{m.value}</span>
                {m.unit && <span className="text-[10px] text-slate-400 font-semibold">{m.unit}</span>}
              </div>
              {m.trend && (
                <span className={`text-[9px] font-bold ${m.trend.good ? 'text-emerald-600' : 'text-red-600'}`}>
                  {m.trend.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── NABL COMPLIANCE + LAST REFRESH STRIP ──────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong className="text-slate-700">NABL ISO 15189:2022 §5.4.4</strong> · CAP-LAP · IATA P650 ·
            All vehicles operate under certified pre-analytical cold-chain protocols.
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono shrink-0 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Refreshed: {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {/* ── FILTER & SEARCH BAR ───────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search vehicle, driver, plate, location, tracking ID…"
            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white font-medium text-slate-700 placeholder:text-slate-400 transition-all"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="py-2 px-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white font-semibold text-slate-700 cursor-pointer transition-all"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE_STAT">ACTIVE — STAT</option>
          <option value="EN_ROUTE">En Route</option>
          <option value="AT_PICKUP">At Pickup</option>
          <option value="AVAILABLE">Available</option>
          <option value="DISPATCHED_COLDCHAIN">Cold-Chain Dispatch</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="CHARGING">Charging</option>
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="py-2 px-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white font-semibold text-slate-700 cursor-pointer transition-all"
        >
          <option value="ALL">All Vehicle Types</option>
          <option value="ELECTRIC_CART">Electric Cart</option>
          <option value="BIKE_COLD_BOX">Cold-Box Bike</option>
          <option value="REFRIGERATED_VAN">Refrigerated Van</option>
          <option value="AMBULANCE_LOGISTICS">Ambulance Logistics</option>
          <option value="HOSPITAL_PORTER">Hospital Porter</option>
        </select>

        {/* Count indicator */}
        <span className="text-xs font-bold text-slate-500 whitespace-nowrap shrink-0">
          {filteredVehicles.length} / {vehicles.length} units
        </span>
      </div>

      {/* ── VEHICLE ROSTER GRID ───────────────────────────── */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
          <Truck className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <span className="text-sm font-semibold text-slate-500 block">No vehicles match your search criteria.</span>
          <button onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setTypeFilter('ALL'); }}
            className="mt-3 text-xs font-bold text-blue-600 hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
          : 'flex flex-col gap-3'
        }>
          {filteredVehicles.map(vehicle => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onAssignTrip={onAssignTrip}
            />
          ))}
        </div>
      )}

      {/* ── COLD CHAIN CERTIFICATION COMPLIANCE FOOTER ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700">Fleet Cold-Chain Certification Matrix</span>
          <span className="ml-auto text-[10px] text-slate-400 font-mono">Valid through 2027</span>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-800 block">NABL ISO 15189:2022</span>
              <p className="text-emerald-700 mt-0.5 text-[11px]">
                Pre-analytical specimen transport under §5.4.4. Digital temperature logging, tamper-evident packaging, chain of custody documentation.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <Award className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-800 block">IATA P650 — Category B</span>
              <p className="text-amber-700 mt-0.5 text-[11px]">
                Biological substance (UN3373) air transport compliance. UN2814 for cryogenic specimens. Triple packaging and dry-ice compliance.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <Target className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-800 block">CAP LAP + CLSI H04-A6</span>
              <p className="text-blue-700 mt-0.5 text-[11px]">
                Order of draw compliance, HIL index screening, specimen rejection criteria enforced per CAP laboratory accreditation program.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
