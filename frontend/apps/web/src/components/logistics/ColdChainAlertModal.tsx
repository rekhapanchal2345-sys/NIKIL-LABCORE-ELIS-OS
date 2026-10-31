'use client';

// ============================================================
// LABCORE ELIS — NABL / ISO 15189:2022 Cold-Chain Excursion Modal
// Arrhenius kinetic pre-analytical impact analysis,
// root cause analysis (RCA), and automated CAPA ticketing
// ============================================================

import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  ThermometerSnowflake,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  Lock,
  Activity,
  FileText,
  Send,
  HelpCircle,
  TrendingUp,
  Cpu,
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
  const [selectedRca, setSelectedRca] = useState<string>('GEL_PACK_EXHAUSTION');
  const [notifyClinician, setNotifyClinician] = useState<boolean>(true);
  const [quarantineNote, setQuarantineNote] = useState<string>('Specimen box quarantined in central cold vault at +4°C pending HIL index clearance.');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border-2 border-red-500 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* MODAL HEADER */}
        <div className="flex items-start justify-between border-b border-red-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-100 text-red-600 animate-pulse shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                NABL ISO 15189:2022 §5.4.4 NON-CONFORMANCE ALERT
              </span>
              <h3 className="text-base font-black text-slate-900 mt-1">
                Thermal Excursion Breach: {boxId}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TELEMETRY READOUT */}
        <div className="bg-red-50/70 rounded-xl p-4 border border-red-200 text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-red-950">
            <span>Thermal Sensor Probe Reading:</span>
            <span className="text-lg font-black font-mono text-red-600 animate-pulse">+11.8°C (Limit: +8.0°C)</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-red-800">
            <span>Cumulative Excursion Duration: <strong>24 minutes</strong></span>
            <span>Estimated MKT (Mean Kinetic Temp): <strong>+10.4°C</strong></span>
          </div>
          <p className="text-[11px] text-red-700">
            Specimen temperature exceeds the 2°C–8°C clinical stability envelope. Pre-analytical analyte degradation risk confirmed per Arrhenius kinetic rate equations.
          </p>
        </div>

        {/* ARRHENIUS DEGRADATION PREDICTION TABLE */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-red-600" />
              Arrhenius Kinetic Degradation Impact:
            </span>
            <span className="text-[10px] text-slate-400 font-mono">E_a = 83.14 kJ/mol</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-1.5 px-3">Analyte</th>
                  <th className="py-1.5 px-3">Degradation Rate</th>
                  <th className="py-1.5 px-3">Clinical Consequence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-red-50/40">
                  <td className="py-2 px-3 font-bold text-red-800">Cardiac hs-Troponin I</td>
                  <td className="py-2 px-3 font-mono font-bold text-red-600">-12.4% Recovery</td>
                  <td className="py-2 px-3 text-slate-600">Proteolytic cleavage; false negative AMI risk</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-800">Serum Potassium (K⁺)</td>
                  <td className="py-2 px-3 font-mono font-bold text-amber-600">+0.42 mmol/L</td>
                  <td className="py-2 px-3 text-slate-600">Red blood cell leakage (pseudohyperkalemia)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-800">Coagulation Factor VIII</td>
                  <td className="py-2 px-3 font-mono font-bold text-blue-600">-18.0% Activity</td>
                  <td className="py-2 px-3 text-slate-600">Prolonged APTT; misleading bleeding risk</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ROOT CAUSE ANALYSIS (RCA) SELECTOR */}
        <div className="space-y-2 text-xs">
          <label className="font-bold text-slate-800 block">
            Root Cause Investigation (Mandatory for NABL CAPA Log):
          </label>
          <select
            value={selectedRca}
            onChange={(e) => setSelectedRca(e.target.value)}
            className="w-full p-2.5 border border-slate-200 rounded-xl font-medium bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <option value="GEL_PACK_EXHAUSTION">Phase Change Gel Pack Exhaustion (Extended Delay &gt; 3h)</option>
            <option value="LID_UNLATCHED">Carrier Insulated Lid Gasket Not Securely Latched</option>
            <option value="VEHICLE_AC_FAILURE">Vehicle Refrigeration Compressor Breached</option>
            <option value="SOLAR_HEAT_OVERLOAD">Direct Solar Radiation Thermal Exposure on Bike Carrier</option>
            <option value="SENSOR_CALIBRATION_DRIFT">IoT Thermistor Probe Drift (Verification required)</option>
          </select>
        </div>

        {/* NOTIFY CLINICIAN CHECKBOX */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800 block">Immediate Clinician Notification</span>
            <p className="text-[11px] text-slate-500">
              Transmit automated priority SMS &amp; HIS notification to Ordering Physician
            </p>
          </div>
          <input
            type="checkbox"
            checked={notifyClinician}
            onChange={(e) => setNotifyClinician(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </div>

        {/* MANDATORY CAPA RESOLUTION ACTIONS */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
            Execute Mandatory NABL Corrective Action:
          </span>

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() =>
                onActionTaken(
                  `Flagged for Spectrophotometric HIL Hemolysis Verification (${selectedRca})`
                )
              }
              className="w-full p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer shadow-2xs"
            >
              <div>
                <span>1. Flag for Spectrophotometric Hemolysis Index Check</span>
                <span className="text-[11px] font-normal text-slate-500 block">
                  Verify serum free hemoglobin &lt; 50 mg/dL before releasing results
                </span>
              </div>
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            </button>

            <button
              onClick={() =>
                onActionTaken(
                  `Quarantined in Pre-analytical Cold Vault at +4°C (${selectedRca})`
                )
              }
              className="w-full p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer shadow-2xs"
            >
              <div>
                <span>2. Quarantine Specimens in Pre-Analytical Cold Vault</span>
                <span className="text-[11px] font-normal text-slate-500 block">
                  Lock accessioning until Quality Manager sign-off
                </span>
              </div>
              <Lock className="w-5 h-5 text-blue-600 shrink-0" />
            </button>

            <button
              onClick={() =>
                onActionTaken(
                  `Zero-Cost STAT Redraw Requisition Dispatched (${selectedRca})`
                )
              }
              className="w-full p-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-left text-xs font-bold text-red-700 flex items-center justify-between cursor-pointer shadow-2xs"
            >
              <div>
                <span>3. Reject Specimens &amp; Trigger Zero-Cost STAT Priority Redraw</span>
                <span className="text-[11px] font-normal text-red-600 block">
                  Immediate bedside repeat phlebotomy dispatched without patient charge
                </span>
              </div>
              <RotateCcw className="w-5 h-5 text-red-600 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
