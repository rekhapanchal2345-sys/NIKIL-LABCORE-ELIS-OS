'use client';

import React, { useState } from 'react';
import { X, ArrowRightLeft, Stethoscope, FlaskConical, CreditCard, Flame, Clock } from 'lucide-react';
import { QueueToken, QueueStage } from './OpdLiveQueue';

interface TransferStationModalProps {
  isOpen: boolean;
  token: QueueToken | null;
  onClose: () => void;
  onTransfer: (tokenId: string, newStage: QueueStage, newCounter: string, note?: string) => void;
}

const DESTINATION_STATIONS: Array<{
  stage: QueueStage;
  counterName: string;
  icon: any;
  color: string;
}> = [
  {
    stage: 'PHLEBOTOMY',
    counterName: 'Phlebotomy Booth 1 (Routine)',
    icon: FlaskConical,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
  },
  {
    stage: 'PHLEBOTOMY',
    counterName: 'Phlebotomy Booth 2 (STAT / Pediatric)',
    icon: FlaskConical,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
  },
  {
    stage: 'CONSULTATION',
    counterName: 'OPD Cabin 101 (General Medicine)',
    icon: Stethoscope,
    color: 'text-sky-600 bg-sky-50 border-sky-200',
  },
  {
    stage: 'CONSULTATION',
    counterName: 'OPD Cabin 102 (Cardiology)',
    icon: Stethoscope,
    color: 'text-sky-600 bg-sky-50 border-sky-200',
  },
  {
    stage: 'LAB_PROCESSING',
    counterName: 'Central Diagnostic Lab Core',
    icon: Clock,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  {
    stage: 'BILLING_DISPATCH',
    counterName: 'Discharge & Billing Counter 1',
    icon: CreditCard,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
];

export default function TransferStationModal({
  isOpen,
  token,
  onClose,
  onTransfer,
}: TransferStationModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [transferNote, setTransferNote] = useState('');

  if (!isOpen || !token) return null;

  const handleConfirm = () => {
    const target = DESTINATION_STATIONS[selectedIndex]!;
    onTransfer(token.id, target.stage, target.counterName, transferNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 to-cyan-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-white border border-white/20 flex items-center justify-center">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Transfer Patient Station</h3>
              <p className="text-xs text-teal-100">
                Route Token {token.tokenNumber} ({token.patientName}) to another department
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Current Station:</span>
              <div className="text-xs font-black text-slate-800">{token.counterName}</div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800">
              {token.tokenNumber}
            </span>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Select Destination Station
            </label>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {DESTINATION_STATIONS.map((station, idx) => {
                const Icon = station.icon;
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg border ${station.color}`}>
                        <Icon size={14} />
                      </div>
                      <span>{station.counterName}</span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-black uppercase text-indigo-600">Selected</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Clinical Handoff Note (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. STAT sample draw required, fast-track sample collection..."
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <span>Confirm Station Transfer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
