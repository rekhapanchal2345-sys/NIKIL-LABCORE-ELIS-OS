'use client';

import React from 'react';
import {
  AlertTriangle,
  X,
  ThermometerSnowflake,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface ColdChainAlertModalProps {
  isOpen: boolean;
  boxId: string;
  onClose: () => void;
  onActionTaken: (action: string) => void;
}

export default function ColdChainAlertModal({
  isOpen,
  boxId,
  onClose,
  onActionTaken,
}: ColdChainAlertModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border-2 border-red-500 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between border-b border-red-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-100 text-red-600 animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                NABL ISO 15189:2022 NON-CONFORMANCE ALERT
              </span>
              <h3 className="text-base font-black text-slate-900 mt-1">
                Thermal Excursion Triggered: {boxId}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DETAILS */}
        <div className="bg-red-50/60 rounded-xl p-4 border border-red-200 text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-red-900">
            <span>Current Thermal Probe Reading:</span>
            <span className="text-base font-black font-mono text-red-600 animate-pulse">+11.8°C</span>
          </div>
          <p className="text-[11px] text-red-700">
            Specimen temperature exceeds the 2°C–8°C clinical stability threshold. Pre-analytical degradation risk detected.
          </p>
        </div>

        {/* CLINICAL IMPACT ASSESSMENT */}
        <div className="space-y-2 text-xs">
          <span className="font-bold text-slate-800 block">Immediate Clinical Risk Profile:</span>
          <div className="space-y-1.5 text-[11px] text-slate-600">
            <div className="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span><strong>Cardiac Troponin &amp; Enzymes:</strong> Rapid denaturation if maintained &gt; 8°C for &gt; 30 mins.</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span><strong>Electrolytes (Potassium):</strong> Risk of red blood cell leakage causing pseudohyperkalemia.</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span><strong>Coagulation (PT/INR):</strong> Labile factor VIII degradation risk.</span>
            </div>
          </div>
        </div>

        {/* NABL CORRECTIVE ACTIONS */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <span className="text-[11px] font-bold text-slate-700 uppercase block">Execute Mandatory CAPA Action:</span>

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => onActionTaken('Flagged for HIL Spectrophotometry Check')}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer"
            >
              <span>1. Flag for Spectrophotometric Hemolysis Index Check</span>
              <ShieldAlert className="w-4 h-4 text-amber-600" />
            </button>

            <button
              onClick={() => onActionTaken('Quarantined in Pre-analytical Cold Vault')}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer"
            >
              <span>2. Quarantine Specimens in Pre-analytical Cold Vault</span>
              <Lock className="w-4 h-4 text-blue-600" />
            </button>

            <button
              onClick={() => onActionTaken('Triggered Zero-Cost STAT Redraw Requisition')}
              className="w-full p-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-left text-xs font-bold text-red-700 flex items-center justify-between cursor-pointer"
            >
              <span>3. Reject &amp; Trigger Zero-Cost Priority Redraw Requisition</span>
              <RotateCcw className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
