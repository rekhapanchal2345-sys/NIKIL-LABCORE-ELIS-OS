'use client';

import React from 'react';
import { MOCK_FLEET_VEHICLES } from './mockLogisticsData';
import {
  Truck,
  Phone,
  Navigation,
  BatteryCharging,
  ShieldCheck,
  CheckCircle2,
  Thermometer,
  Zap,
} from 'lucide-react';

interface FleetRosterViewProps {
  onAssignTrip: (driverName: string) => void;
}

export default function FleetRosterView({ onAssignTrip }: FleetRosterViewProps) {
  return (
    <div className="space-y-6">
      {/* BANNER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              Logistics Fleet Telemetry
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Fleet &amp; Medical Courier Roster
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Registered hospital electric carts, cold-box bikes, and certified medical phlebotomists
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Fleet Active:</span>
            <span className="text-sm font-extrabold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              {MOCK_FLEET_VEHICLES.length} Units Ready
            </span>
          </div>
        </div>
      </div>

      {/* VEHICLE ROSTER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_FLEET_VEHICLES.map((v) => (
          <div
            key={v.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-colors space-y-4"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {v.plate}
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-1">{v.type}</h4>
                <p className="text-xs text-slate-500 font-medium">Driver: <strong className="text-slate-800">{v.driver}</strong></p>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  v.status === 'ACTIVE_STAT'
                    ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                    : v.status === 'EN_ROUTE'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : v.status === 'AT_PICKUP'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {v.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Location</span>
                <span className="font-bold text-slate-800 truncate block mt-0.5">{v.currentLocation}</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Cryo-Box Temp</span>
                <span className="font-bold text-emerald-700 font-mono block mt-0.5">{v.boxTemp} (Safe)</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Battery Level</span>
                <span className="font-bold text-slate-800 font-mono block mt-0.5">{v.battery}</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Trips Today</span>
                <span className="font-bold text-slate-800 block mt-0.5">{v.tripsToday} Completed</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <a
                href={`tel:${v.phone}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                <Phone className="w-3.5 h-3.5" />
                {v.phone}
              </a>

              <button
                onClick={() => onAssignTrip(v.driver)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                Assign Trip
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
