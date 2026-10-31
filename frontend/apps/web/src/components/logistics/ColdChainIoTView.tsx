'use client';

// ============================================================
// LABCORE ELIS — Cold-Chain IoT Thermal Telemetry View
// Real-world temperature monitoring per ISO 15189:2022 §5.4.4
// Mean Kinetic Temperature (MKT) | Arrhenius Model | NABL CAPA
// WHO Guidelines for Biological Substance Transport
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import { ColdChainSensor } from './logistics.types';
import {
  Thermometer, ThermometerSnowflake, BatteryCharging, AlertTriangle,
  CheckCircle2, ShieldAlert, Radio, Clock, RefreshCw, FileText,
  Activity, Layers, ShieldCheck, AlertCircle, Info, Gauge,
  Droplets, Signal, WifiOff, BarChart3, TrendingUp, TrendingDown,
  Cpu, Zap, MapPin, Package, Target, Award, Download, Eye,
} from 'lucide-react';

interface ColdChainIoTViewProps {
  sensors: ColdChainSensor[];
  onSimulateExcursionAlert: (boxId: string) => void;
  onResolveExcursion: (sensorId: string) => void;
}

// ─── Box type display config ─────────────────────────────────
const BOX_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; accentCls: string }> = {
  PORTABLE_CRYO_BOX:       { label: 'Portable Cryo-Box',        icon: <Package className="w-4 h-4" />,              accentCls: 'text-blue-700 bg-blue-50 border-blue-200' },
  ICU_STAT_COOLER:         { label: 'ICU STAT Cooler',          icon: <Zap className="w-4 h-4" />,                  accentCls: 'text-red-700 bg-red-50 border-red-200' },
  REFRIGERATED_VAN_CHAMBER:{ label: 'Refrigerated Van Chamber',  icon: <Thermometer className="w-4 h-4" />,          accentCls: 'text-violet-700 bg-violet-50 border-violet-200' },
  DEEP_FREEZE_SHIPPER:     { label: 'Deep-Freeze Dry-Ice Shipper', icon: <ThermometerSnowflake className="w-4 h-4" />,accentCls: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  LN2_DEWAR:               { label: 'LN₂ Dewar (–196°C)',       icon: <ThermometerSnowflake className="w-4 h-4" />, accentCls: 'text-purple-700 bg-purple-50 border-purple-200' },
  AMBIENT_INSULATED_BOX:   { label: 'Ambient Insulated Box',    icon: <Layers className="w-4 h-4" />,               accentCls: 'text-amber-700 bg-amber-50 border-amber-200' },
};

// ─── Signal Strength Display ─────────────────────────────────
function SignalDisplay({ strength }: { strength?: string }) {
  const bars = { EXCELLENT: 4, GOOD: 3, WEAK: 1, NO_SIGNAL: 0 };
  const count = bars[strength as keyof typeof bars] ?? 2;
  const color = count >= 3 ? 'bg-emerald-500' : count >= 2 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-end gap-0.5 h-3.5">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`w-1 rounded-sm ${i <= count ? color : 'bg-slate-200'}`}
          style={{ height: `${i * 25}%` }} />
      ))}
    </div>
  );
}

// ─── MKT Calculator (Arrhenius Model) ───────────────────────
// Mean Kinetic Temperature: T_MKT = -ΔH/R / ln(Σe^(-ΔH/RTi) / n)
// ΔH = 83.144 kJ/mol (WHO ICH Q1A activation energy)
// R  = 8.314472 J/(mol·K)
function calculateMKT(temps: number[]): number {
  if (temps.length === 0) return 0;
  const R = 8.314472; // J·mol⁻¹·K⁻¹
  const DH = 83144;   // J/mol (WHO ICH Q1A — 83.144 kJ/mol)
  const n = temps.length;
  const sumExp = temps.reduce((acc, t) => {
    const TK = t + 273.15; // Kelvin
    return acc + Math.exp(-DH / (R * TK));
  }, 0);
  const T_MKT_K = -DH / (R * Math.log(sumExp / n));
  return parseFloat((T_MKT_K - 273.15).toFixed(2));
}

// ─── Temperature Status Classifier ──────────────────────────
function classifyTemp(temp: number, minTemp: number, maxTemp: number): {
  status: 'OK' | 'WARNING' | 'EXCURSION' | 'CRITICAL';
  label: string;
  color: string;
} {
  const isDeepFreeze = minTemp < 0;
  const margin = isDeepFreeze ? 2 : 0.5;

  if (temp < minTemp || temp > maxTemp) {
    const breachDelta = Math.max(Math.abs(temp - maxTemp), Math.abs(temp - minTemp));
    if (breachDelta > 5 || (isDeepFreeze && temp > maxTemp + 10)) {
      return { status: 'CRITICAL', label: 'Critical Breach', color: 'text-red-700 bg-red-100 border-red-400' };
    }
    return { status: 'EXCURSION', label: 'Excursion', color: 'text-orange-700 bg-orange-50 border-orange-300' };
  }
  if (temp > maxTemp - margin || temp < minTemp + margin) {
    return { status: 'WARNING', label: 'Near Limit', color: 'text-amber-700 bg-amber-50 border-amber-300' };
  }
  return { status: 'OK', label: 'Within Range', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
}

// ─── Mini Sparkline (SVG-based inline chart) ─────────────────
function TemperatureSparkline({
  history,
  minTemp,
  maxTemp,
}: {
  history: Array<{ temp: number; time: string }>;
  minTemp: number;
  maxTemp: number;
}) {
  if (history.length < 2) return null;

  const temps = history.map(h => h.temp);
  const allMin = Math.min(...temps, minTemp) - 1;
  const allMax = Math.max(...temps, maxTemp) + 1;
  const range = allMax - allMin || 1;

  const W = 200;
  const H = 48;
  const step = W / (history.length - 1);

  const toY = (t: number) => H - ((t - allMin) / range) * H;
  const points = history.map((h, i) => `${i * step},${toY(h.temp)}`).join(' ');

  // Target zone band Y coords
  const maxY = toY(maxTemp);
  const minY = toY(minTemp);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 48 }} preserveAspectRatio="none">
      {/* Target temperature band */}
      <rect x={0} y={maxY} width={W} height={minY - maxY} fill="rgba(16,185,129,0.08)" />
      <line x1={0} y1={maxY} x2={W} y2={maxY} stroke="rgba(16,185,129,0.4)" strokeWidth="1" strokeDasharray="3,2" />
      <line x1={0} y1={minY} x2={W} y2={minY} stroke="rgba(16,185,129,0.4)" strokeWidth="1" strokeDasharray="3,2" />
      {/* Sparkline */}
      <polyline
        points={points}
        fill="none"
        stroke="#3B82F6"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Data points */}
      {history.map((h, i) => {
        const cls = classifyTemp(h.temp, minTemp, maxTemp);
        const dotColor = cls.status === 'OK' ? '#10B981' : cls.status === 'WARNING' ? '#F59E0B' : '#EF4444';
        return (
          <circle key={i} cx={i * step} cy={toY(h.temp)} r={2} fill={dotColor} />
        );
      })}
    </svg>
  );
}

// ─── Individual Sensor Detail Card ──────────────────────────
function SensorDetailCard({
  sensor,
  isSelected,
  onClick,
}: {
  sensor: ColdChainSensor;
  isSelected: boolean;
  onClick: () => void;
}) {
  const tempStatus = classifyTemp(sensor.currentTempCelsius, sensor.targetMinTemp, sensor.targetMaxTemp);
  const boxCfg = BOX_TYPE_CONFIG[sensor.boxType] ?? BOX_TYPE_CONFIG.PORTABLE_CRYO_BOX;
  const mkt = useMemo(() => calculateMKT(sensor.history.map(h => h.temp)), [sensor.history]);

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-all select-none ${
        tempStatus.status === 'EXCURSION' || tempStatus.status === 'CRITICAL' || sensor.isAlert
          ? 'border-red-400 bg-red-50/30 ring-2 ring-red-400/20'
          : isSelected
          ? 'border-blue-500 bg-blue-50/20 ring-2 ring-blue-500/15 shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2">
          <span className={`p-1.5 rounded-lg border ${boxCfg.accentCls} shrink-0`}>
            {boxCfg.icon}
          </span>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${boxCfg.accentCls.split(' ')[0]} block`}>
              {boxCfg.label}
            </span>
            <h4 className="text-sm font-extrabold text-slate-900 leading-tight">{sensor.boxId}</h4>
          </div>
        </div>

        {/* Live temperature */}
        <div className={`px-2 py-1 rounded-lg border text-sm font-extrabold font-mono ${
          sensor.isAlert || tempStatus.status !== 'OK'
            ? 'bg-red-600 text-white border-red-700 animate-pulse'
            : sensor.currentTempCelsius <= -20
            ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
        }`}>
          {sensor.currentTempCelsius > 0 ? `+${sensor.currentTempCelsius.toFixed(1)}°C` : `${sensor.currentTempCelsius.toFixed(1)}°C`}
        </div>
      </div>

      {/* Vehicle / Assignment */}
      <p className="text-[11px] text-slate-500 font-medium mb-3 line-clamp-1 flex items-center gap-1">
        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
        {sensor.assignedVehicle}
      </p>

      {/* Status strip */}
      <div className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 mb-3 ${tempStatus.color}`}>
        {tempStatus.status === 'OK' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
        {tempStatus.label}
        {sensor.isAlert && <span className="ml-1 animate-pulse">— EXCURSION ALERT</span>}
      </div>

      {/* Sparkline */}
      <div className="mb-3 bg-white border border-slate-100 rounded-lg px-2 pt-1 pb-0.5 overflow-hidden">
        <TemperatureSparkline
          history={sensor.history}
          minTemp={sensor.targetMinTemp}
          maxTemp={sensor.targetMaxTemp}
        />
      </div>

      {/* Bottom metrics row */}
      <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
        {/* Battery */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
          <BatteryCharging className="w-3 h-3 text-emerald-600 mx-auto mb-0.5" />
          <span className={`font-extrabold font-mono text-[11px] block ${
            sensor.batteryPercent > 60 ? 'text-emerald-700' : sensor.batteryPercent > 25 ? 'text-amber-700' : 'text-red-700'
          }`}>{sensor.batteryPercent}%</span>
          <span className="text-[9px] text-slate-400">battery</span>
        </div>

        {/* MKT */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
          <Gauge className="w-3 h-3 text-blue-600 mx-auto mb-0.5" />
          <span className="font-extrabold font-mono text-[11px] text-slate-800 block">
            {mkt > 0 ? `+${mkt}°` : `${mkt}°`}
          </span>
          <span className="text-[9px] text-slate-400">MKT</span>
        </div>

        {/* Humidity */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
          {sensor.humidityPercent !== undefined ? (
            <>
              <Droplets className="w-3 h-3 text-cyan-600 mx-auto mb-0.5" />
              <span className="font-extrabold font-mono text-[11px] text-slate-800 block">{sensor.humidityPercent}%</span>
              <span className="text-[9px] text-slate-400">humidity</span>
            </>
          ) : (
            <>
              <Signal className="w-3 h-3 text-slate-400 mx-auto mb-0.5" />
              <SignalDisplay strength={sensor.signalStrength} />
              <span className="text-[9px] text-slate-400">signal</span>
            </>
          )}
        </div>
      </div>

      {/* Ping info */}
      <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <Radio className="w-3 h-3" />
          {sensor.lastPingTime}
        </span>
        <span className="font-mono">Every {sensor.pingIntervalSeconds}s</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN COLD CHAIN IOT VIEW COMPONENT
// ════════════════════════════════════════════════════════════
export default function ColdChainIoTView({
  sensors,
  onSimulateExcursionAlert,
  onResolveExcursion,
}: ColdChainIoTViewProps) {
  const [selectedSensorId, setSelectedSensorId] = useState<string>(sensors[0]?.id || 'sens-01');
  const [activeSensors, setActiveSensors] = useState<ColdChainSensor[]>(sensors);
  const [activeTab, setActiveTab] = useState<'log' | 'mkt' | 'capa' | 'certificates'>('log');

  const currentSensor = activeSensors.find(s => s.id === selectedSensorId) || activeSensors[0];

  const handleTriggerExcursion = useCallback((boxId: string) => {
    setActiveSensors(prev => prev.map(s => {
      if (s.boxId === boxId) {
        const excursionTemp = s.boxType === 'DEEP_FREEZE_SHIPPER' ? -12.4 : 11.8;
        return {
          ...s,
          currentTempCelsius: excursionTemp,
          isAlert: true,
          history: [...s.history, { time: 'Now', temp: excursionTemp, isAlert: true }],
        };
      }
      return s;
    }));
    onSimulateExcursionAlert(boxId);
  }, [onSimulateExcursionAlert]);

  const handleResetSensor = useCallback((id: string) => {
    setActiveSensors(prev => prev.map(s => {
      if (s.id === id) {
        const resetTemp = s.boxType === 'DEEP_FREEZE_SHIPPER' ? -21.4 :
                          s.boxType === 'ICU_STAT_COOLER' ? 4.4 : 4.6;
        return {
          ...s,
          currentTempCelsius: resetTemp,
          isAlert: false,
          history: [...s.history.filter(h => h.temp < 9), { time: 'Resolved', temp: resetTemp, isAlert: false }],
        };
      }
      return s;
    }));
    onResolveExcursion(id);
  }, [onResolveExcursion]);

  // Compute fleet summary
  const alertSensors = activeSensors.filter(s => s.isAlert || classifyTemp(s.currentTempCelsius, s.targetMinTemp, s.targetMaxTemp).status !== 'OK');
  const compliantCount = activeSensors.length - alertSensors.length;
  const overallMKT = useMemo(() => {
    const allTemps = activeSensors.flatMap(s => s.history.map(h => h.temp));
    return calculateMKT(allTemps);
  }, [activeSensors]);

  return (
    <div className="space-y-5">

      {/* ── COLD CHAIN COMMAND HEADER ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Title */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 mb-1.5">
              <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
              NABL ISO 15189:2022 §5.4.4 Pre-analytical Temperature Validation — Live
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Cold-Chain IoT Dataloggers &amp; Thermal Telemetry Engine
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Real-time temperature probes · BLE/GPS telemetry · MKT (Arrhenius) calculation · Excursion CAPA workflow
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {alertSensors.length > 0 ? (
              <span className="flex items-center gap-1.5 text-sm font-extrabold text-red-700 bg-red-50 px-3 py-1.5 rounded-xl border border-red-300 animate-pulse">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                {alertSensors.length} Excursion Alert
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {compliantCount}/{activeSensors.length} Compliant
              </span>
            )}
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-slate-100">
          {[
            {
              icon: <Activity className="w-4 h-4 text-blue-600" />,
              label: 'Active Dataloggers',
              value: activeSensors.length,
              sub: 'BLE/GPS pinging',
              bg: 'bg-blue-50/30',
              color: 'text-blue-800',
            },
            {
              icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
              label: 'Fleet Thermal Integrity',
              value: `${((compliantCount / activeSensors.length) * 100).toFixed(1)}%`,
              sub: `${compliantCount} sensors normal`,
              bg: 'bg-emerald-50/30',
              color: 'text-emerald-800',
            },
            {
              icon: <Gauge className="w-4 h-4 text-violet-600" />,
              label: 'Fleet Mean Kinetic Temp',
              value: `${overallMKT > 0 ? '+' : ''}${overallMKT}°C`,
              sub: 'Arrhenius model (WHO ICH Q1A)',
              bg: 'bg-violet-50/30',
              color: 'text-violet-800',
            },
            {
              icon: <AlertCircle className="w-4 h-4 text-red-600" />,
              label: 'Excursion Events Today',
              value: alertSensors.length,
              sub: alertSensors.length === 0 ? 'Zero today ✓' : 'CAPA required',
              bg: alertSensors.length > 0 ? 'bg-red-50/40' : 'bg-slate-50/30',
              color: alertSensors.length > 0 ? 'text-red-700' : 'text-slate-600',
            },
          ].map((m, i) => (
            <div key={i} className={`flex items-center gap-2.5 px-4 py-3 ${m.bg}`}>
              <div className="shrink-0 p-1.5 bg-white rounded-lg border border-white/80 shadow-2xs">
                {m.icon}
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">{m.label}</span>
                <span className={`text-lg font-extrabold font-mono ${m.color}`}>{m.value}</span>
                <span className="text-[10px] text-slate-400 block">{m.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SENSOR MONITOR TILE GRID ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {activeSensors.map(sensor => (
          <SensorDetailCard
            key={sensor.id}
            sensor={sensor}
            isSelected={sensor.id === selectedSensorId}
            onClick={() => setSelectedSensorId(sensor.id)}
          />
        ))}
      </div>

      {/* ── DETAILED SENSOR ANALYSIS PANEL ─────────────────── */}
      {currentSensor && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Panel Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Thermal Trend Analysis: {currentSensor.boxId}
                </h3>
                {currentSensor.isAlert && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-red-100 text-red-700 border border-red-300 animate-pulse">
                    ⚠ EXCURSION ALERT
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Target Range: <strong className="text-slate-800">{currentSensor.targetMinTemp}°C – {currentSensor.targetMaxTemp}°C</strong>
                {' · '}Carrier: {currentSensor.assignedVehicle}
                {currentSensor.dataLoggerSerial && <span className="ml-2 font-mono text-slate-400 text-[10px]">SN: {currentSensor.dataLoggerSerial}</span>}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {currentSensor.isAlert ? (
                <button
                  onClick={() => handleResetSensor(currentSensor.id)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Acknowledge &amp; Initiate CAPA
                </button>
              ) : (
                <button
                  onClick={() => handleTriggerExcursion(currentSensor.boxId)}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold hover:bg-amber-100 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Simulate Excursion (QA Test)
                </button>
              )}
            </div>
          </div>

          {/* Detail Tabs */}
          <div className="flex items-center gap-0 border-b border-slate-100 bg-slate-50 px-5">
            {([
              { id: 'log', label: 'Temperature Log', icon: <BarChart3 className="w-3.5 h-3.5" /> },
              { id: 'mkt', label: 'MKT Analysis', icon: <Gauge className="w-3.5 h-3.5" /> },
              { id: 'capa', label: 'NABL CAPA Protocol', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
              { id: 'certificates', label: 'Datalogger Cert.', icon: <Award className="w-3.5 h-3.5" /> },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-5">
            {/* ─ TEMPERATURE LOG TAB ─ */}
            {activeTab === 'log' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Bluetooth BLE Ping Log — {currentSensor.pingIntervalSeconds}s Interval
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Radio className="w-3 h-3" />
                    Last: {currentSensor.lastPingTime}
                  </span>
                </div>

                {/* Large Sparkline */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                    <span className="font-mono text-emerald-600">▸ Max {currentSensor.targetMaxTemp}°C</span>
                    <span className="font-bold">Temperature History</span>
                    <span className="font-mono text-emerald-600">▸ Min {currentSensor.targetMinTemp}°C</span>
                  </div>
                  <TemperatureSparkline
                    history={currentSensor.history}
                    minTemp={currentSensor.targetMinTemp}
                    maxTemp={currentSensor.targetMaxTemp}
                  />
                </div>

                {/* Data table */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {currentSensor.history.map((h, i) => {
                    const ts = classifyTemp(h.temp, currentSensor.targetMinTemp, currentSensor.targetMaxTemp);
                    return (
                      <div key={i} className={`rounded-xl p-3 text-center border ${
                        ts.status !== 'OK' ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-[10px] font-mono text-slate-400 block">{h.time}</span>
                        <span className={`text-sm font-extrabold font-mono block mt-0.5 ${
                          ts.status === 'OK' ? 'text-slate-800' : 'text-red-700 animate-pulse'
                        }`}>
                          {h.temp > 0 ? `+${h.temp}°C` : `${h.temp}°C`}
                        </span>
                        {h.humidity !== undefined && (
                          <span className="text-[9px] text-cyan-600 font-bold block">{h.humidity}% RH</span>
                        )}
                        <span className={`text-[9px] font-bold block mt-0.5 ${
                          ts.status === 'OK' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {ts.status === 'OK' ? '✓ PASS' : '✗ BREACH'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─ MKT ANALYSIS TAB ─ */}
            {activeTab === 'mkt' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="text-sm font-extrabold text-blue-900 flex items-center gap-2 mb-2">
                    <Gauge className="w-4 h-4 text-blue-700" />
                    Mean Kinetic Temperature (MKT) — Arrhenius Model
                  </h4>
                  <p className="text-xs text-blue-700 mb-3">
                    MKT is a single calculated temperature that represents the kinetic effect of temperature variations during storage.
                    Calculated per <strong>WHO ICH Q1A</strong> using activation energy ΔH = 83.144 kJ/mol.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg border border-blue-200 p-3 text-center">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">Current MKT</span>
                      <span className="text-2xl font-extrabold font-mono text-blue-800 block">
                        {calculateMKT(currentSensor.history.map(h => h.temp)) > 0 ? '+' : ''}
                        {calculateMKT(currentSensor.history.map(h => h.temp))}°C
                      </span>
                    </div>
                    <div className="bg-white rounded-lg border border-blue-200 p-3 text-center">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">Target Max</span>
                      <span className="text-2xl font-extrabold font-mono text-emerald-800 block">
                        {currentSensor.targetMaxTemp > 0 ? '+' : ''}{currentSensor.targetMaxTemp}°C
                      </span>
                    </div>
                    <div className="bg-white rounded-lg border border-blue-200 p-3 text-center">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">Log Points</span>
                      <span className="text-2xl font-extrabold font-mono text-slate-800 block">
                        {currentSensor.history.length}
                      </span>
                    </div>
                  </div>
                  {currentSensor.mkteStats && (
                    <div className="mt-3 text-xs text-blue-700 font-mono bg-white border border-blue-200 rounded-lg p-2.5">
                      <strong>Verified MKT (from certified datalogger):</strong> {currentSensor.mkteStats.mktCelsius}°C
                      &nbsp;·&nbsp; Total log hours: {currentSensor.mkteStats.totalLogHours}h
                      &nbsp;·&nbsp; Calculated at: {new Date(currentSensor.mkteStats.calculatedAt).toLocaleTimeString('en-IN')}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
                  <strong className="text-slate-800 block mb-2">Mathematical Model (WHO ICH Q1A):</strong>
                  <code className="font-mono text-blue-700 block bg-white border border-blue-100 rounded p-2 text-[11px]">
                    T_MKT = (−ΔH/R) / ln[Σ(e^(−ΔH/RTᵢ)) / n]
                  </code>
                  <div className="mt-2 space-y-0.5 text-slate-500">
                    <span className="block">ΔH = 83,144 J/mol (activation energy for degradation, per WHO)</span>
                    <span className="block">R = 8.314472 J·mol⁻¹·K⁻¹ (universal gas constant)</span>
                    <span className="block">Tᵢ = Temperature readings in Kelvin (T°C + 273.15)</span>
                    <span className="block">n = number of measurement intervals</span>
                  </div>
                </div>
              </div>
            )}

            {/* ─ NABL CAPA PROTOCOL TAB ─ */}
            {activeTab === 'capa' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-5 h-5 text-blue-700" />
                  <h4 className="text-sm font-extrabold text-slate-900">
                    NABL ISO 15189:2022 Cold-Chain Non-Conformance Protocol
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      step: '1',
                      title: 'Immediate Excursion Detection',
                      color: 'border-red-200 bg-red-50',
                      titleColor: 'text-red-800',
                      items: [
                        'IoT BLE sensor breach alarm triggers within 60 seconds',
                        'Automatic notification to Duty Pathologist (SMS + App push)',
                        'LIS specimen status auto-changes to "ON_HOLD_EXCURSION"',
                        'Fleet supervisor geo-alert sent to driver',
                      ],
                    },
                    {
                      step: '2',
                      title: 'Specimen Assessment & Triage',
                      color: 'border-amber-200 bg-amber-50',
                      titleColor: 'text-amber-800',
                      items: [
                        'HIL (Hemolysis, Icterus, Lipemia) index screening on arrival',
                        'Enzymatic/coagulation tubes quarantined — PT/INR, Troponin, Potassium',
                        'Temperature excursion duration calculated (MKT method)',
                        'Analyte-specific stability assessment per CLSI EP25 guidelines',
                      ],
                    },
                    {
                      step: '3',
                      title: 'CAPA Action & Resolution',
                      color: 'border-emerald-200 bg-emerald-50',
                      titleColor: 'text-emerald-800',
                      items: [
                        'Pathologist signs digital CAPA form (ISO 15189 §8.7)',
                        'Priority zero-cost redraw issued if excursion >45 mins',
                        'Corrective action recorded in QMS non-conformance register',
                        'Preventive action: root cause analysis, transport SOP review',
                      ],
                    },
                  ].map(section => (
                    <div key={section.step} className={`rounded-xl border p-4 ${section.color}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white ${
                          section.step === '1' ? 'bg-red-600' : section.step === '2' ? 'bg-amber-600' : 'bg-emerald-600'
                        }`}>{section.step}</span>
                        <span className={`text-xs font-extrabold ${section.titleColor}`}>{section.title}</span>
                      </div>
                      <ul className="space-y-1">
                        {section.items.map((item, i) => (
                          <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                            <span className="text-slate-400 mt-0.5 shrink-0">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Analyte stability reference table */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-extrabold text-slate-800">Analyte Thermal Stability Reference (CLSI EP25 / IFCC Guidelines)</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead className="bg-slate-100">
                        <tr>
                          {['Analyte', 'Tube Type', 'Stability at 2–8°C', 'Stability at 20–25°C', 'Critical Threshold'].map(col => (
                            <th key={col} className="px-3 py-2 text-left font-bold text-slate-700 uppercase tracking-wider text-[10px]">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          ['Troponin-I (hs-cTnI)', 'SST Gold', '7 days', '4 hours', '>8°C — quarantine'],
                          ['Potassium (K⁺)', 'SST Gold', '6 hours (unsepar.)', '2 hours (unsepar.)', 'Hemolysis masks result'],
                          ['PT/INR', 'Citrate Blue', '4 hours', '4 hours', 'FIFO: process within 4h'],
                          ['L-Lactate', 'Fluoride Grey', '30 mins (unsep.)', '15 mins', 'On ice; process STAT'],
                          ['Bilirubin', 'Plain Red', '3 days (dark)', '1 hour', 'Photo-labile; protect from light'],
                          ['HbA1c (HPLC)', 'EDTA Lavender', '7 days', '3 days', 'Stable — routine processing'],
                          ['Blood Culture', 'Aerobic/Anaerobic', 'Room temp ONLY', 'Room temp ONLY', 'Do NOT refrigerate'],
                          ['PCR / Molecular', 'EDTA / Cryo', '24–48h', '4h only', 'Freeze at –20°C for >48h'],
                        ].map(([analyte, tube, cold, room, threshold], i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-3 py-2 font-semibold text-slate-800">{analyte}</td>
                            <td className="px-3 py-2 text-slate-600">{tube}</td>
                            <td className="px-3 py-2 text-cyan-700 font-bold">{cold}</td>
                            <td className="px-3 py-2 text-amber-700 font-bold">{room}</td>
                            <td className="px-3 py-2 text-red-600 font-bold">{threshold}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ─ CERTIFICATES TAB ─ */}
            {activeTab === 'certificates' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Datalogger Certificate */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-extrabold text-emerald-900">Datalogger Calibration Certificate</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Serial Number</span>
                        <span className="font-mono font-bold text-slate-800">{currentSensor.dataLoggerSerial || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Model</span>
                        <span className="font-bold text-slate-800">
                          {currentSensor.boxType === 'DEEP_FREEZE_SHIPPER' ? 'Sensitech TempTale 4' :
                           currentSensor.boxType === 'REFRIGERATED_VAN_CHAMBER' ? 'Onset HOBO U12-001' : 'Testo 174T'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Certified Until</span>
                        <span className={`font-bold ${currentSensor.certifiedUntil ? 'text-emerald-700' : 'text-red-700'}`}>
                          {currentSensor.certifiedUntil || 'Expired'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Ping Interval</span>
                        <span className="font-bold text-slate-800">{currentSensor.pingIntervalSeconds}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Accuracy</span>
                        <span className="font-bold text-slate-800">±0.1°C (NIST traceable)</span>
                      </div>
                    </div>
                  </div>

                  {/* Compliance Standards */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                      <span className="text-xs font-extrabold text-blue-900">Regulatory Compliance</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { std: 'ISO 15189:2022', sec: '§5.4.4', desc: 'Pre-analytical specimen transport' },
                        { std: 'WHO P650', sec: '2013', desc: 'Biological substance transport guidelines' },
                        { std: 'IATA P650', sec: 'Category B', desc: 'UN3373 air transport compliance' },
                        { std: 'CLSI EP25-A', sec: '2009', desc: 'Interference testing: hemolysis, lipemia, icterus' },
                        { std: 'WHO ICH Q1A', sec: 'R2', desc: 'MKT stability testing (Arrhenius model)' },
                      ].map(item => (
                        <div key={item.std} className="flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-extrabold text-blue-800">{item.std}</span>
                            <span className="text-slate-500 ml-1.5">{item.desc}</span>
                          </div>
                          <span className="font-bold text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200 shrink-0 ml-2">
                            {item.sec}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
