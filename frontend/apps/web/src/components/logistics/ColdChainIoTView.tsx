'use client';

import React, { useState } from 'react';
import { ColdChainSensor } from './logistics.types';
import {
  Thermometer,
  ThermometerSnowflake,
  BatteryCharging,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Flame,
  Radio,
  Clock,
  RefreshCw,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';

interface ColdChainIoTViewProps {
  sensors: ColdChainSensor[];
  onSimulateExcursionAlert: (boxId: string) => void;
  onResolveExcursion: (sensorId: string) => void;
}

export default function ColdChainIoTView({
  sensors,
  onSimulateExcursionAlert,
  onResolveExcursion,
}: ColdChainIoTViewProps) {
  const [selectedSensorId, setSelectedSensorId] = useState<string>(sensors[0]?.id || 'sens-01');
  const [activeSensors, setActiveSensors] = useState<ColdChainSensor[]>(sensors);

  const currentSensor = activeSensors.find(s => s.id === selectedSensorId) || activeSensors[0];

  const handleTriggerTest = (boxId: string) => {
    setActiveSensors(prev =>
      prev.map(s => {
        if (s.boxId === boxId) {
          return {
            ...s,
            currentTempCelsius: 11.8,
            isAlert: true,
            history: [...s.history, { time: 'Now', temp: 11.8 }],
          };
        }
        return s;
      })
    );
    onSimulateExcursionAlert(boxId);
  };

  const handleResetSensor = (id: string) => {
    setActiveSensors(prev =>
      prev.map(s => {
        if (s.id === id) {
          return {
            ...s,
            currentTempCelsius: 4.6,
            isAlert: false,
          };
        }
        return s;
      })
    );
    onResolveExcursion(id);
  };

  return (
    <div className="space-y-6">
      {/* COLD CHAIN TELEMETRY HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
              <ThermometerSnowflake className="w-3.5 h-3.5 text-teal-600" />
              NABL ISO 15189:2022 Pre-analytical Temperature Validation
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Cold-Chain IoT Dataloggers &amp; Thermal Telemetry
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Real-time temperature probes inside all phlebotomy cryo-boxes, vans, and STAT hospital coolers
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Fleet Thermal Integrity:</span>
            <span className="text-sm font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              99.4% Compliant
            </span>
          </div>
        </div>
      </div>

      {/* SENSOR MONITOR TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeSensors.map((sensor) => {
          const isSelected = sensor.id === selectedSensorId;
          const isExcursion = sensor.isAlert || (sensor.targetMinTemp > 0 && (sensor.currentTempCelsius < sensor.targetMinTemp || sensor.currentTempCelsius > sensor.targetMaxTemp));

          return (
            <div
              key={sensor.id}
              onClick={() => setSelectedSensorId(sensor.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isExcursion
                  ? 'border-red-400 bg-red-50/50 ring-2 ring-red-400/20'
                  : isSelected
                  ? 'border-blue-500 bg-blue-50/30 ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    {sensor.boxType.replace(/_/g, ' ')}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">{sensor.boxId}</h4>
                  <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{sensor.assignedVehicle}</p>
                </div>

                <span
                  className={`text-base font-extrabold font-mono px-2 py-0.5 rounded-lg border ${
                    isExcursion
                      ? 'bg-red-600 text-white border-red-700 animate-pulse'
                      : sensor.currentTempCelsius <= -20
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {sensor.currentTempCelsius > 0 ? `+${sensor.currentTempCelsius}°C` : `${sensor.currentTempCelsius}°C`}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 font-mono">
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
                  {sensor.batteryPercent}%
                </span>
                <span className="font-medium text-slate-400">{sensor.lastPingTime}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAILED SENSOR INSPECTION & TEMPERATURE CURVE */}
      {currentSensor && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Thermal Trend Analysis: {currentSensor.boxId}
                </h3>
                {currentSensor.isAlert && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-red-100 text-red-700 border border-red-300 animate-pulse">
                    EXCURSION ALERT ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Temperature Window: <strong>{currentSensor.targetMinTemp}°C to {currentSensor.targetMaxTemp}°C</strong> · Carrier: {currentSensor.assignedVehicle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {currentSensor.isAlert ? (
                <button
                  onClick={() => handleResetSensor(currentSensor.id)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  Clear Excursion &amp; Acknowledge CAPA
                </button>
              ) : (
                <button
                  onClick={() => handleTriggerTest(currentSensor.boxId)}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold hover:bg-amber-100 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Simulate Temperature Spike Test (+11.8°C)
                </button>
              )}
            </div>
          </div>

          {/* SENSOR HISTOGRAM / TEMPERATURE POINTS */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 block">Recent Hourly Temperature Log (Bluetooth BLE Ping):</span>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {currentSensor.history.map((h, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block">{h.time}</span>
                  <span className={`text-sm font-extrabold font-mono mt-1 block ${
                    h.temp > currentSensor.targetMaxTemp ? 'text-red-600 font-black animate-pulse' : 'text-slate-800'
                  }`}>
                    {h.temp > 0 ? `+${h.temp}°C` : `${h.temp}°C`}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">
                    {h.temp <= currentSensor.targetMaxTemp ? 'PASS' : 'BREACH'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CLINICAL IMPACT & NABL CAPA ACTION WORKFLOW */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              NABL ISO 15189:2022 Cold-Chain Non-Conformance Protocol
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block">1. Hemolysis Assessment</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Excursions above 8°C trigger automated spectrophotometric HIL (Hemolysis, Icterus, Lipemia) index screening during accessioning.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block">2. Quarantine &amp; Isolation</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Enzymatic and coagulation tubes (PT/INR, Troponin, Potassium) quarantined automatically until reviewed by Duty Pathologist.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block">3. Immediate Redraw Order</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  If thermal integrity breach exceeds 45 mins, a priority zero-cost redraw is scheduled for the hospital ward or patient home.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
