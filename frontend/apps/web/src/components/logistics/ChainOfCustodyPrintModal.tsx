'use client';

import React from 'react';
import { ShipmentTrip } from './logistics.types';
import LabCoreLogo from '@/components/common/LabCoreLogo';
import {
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Thermometer,
  Calendar,
  Building2,
  FileText,
  Clock,
} from 'lucide-react';

interface ChainOfCustodyPrintModalProps {
  shipment: ShipmentTrip | null;
  onClose: () => void;
}

export default function ChainOfCustodyPrintModal({
  shipment,
  onClose,
}: ChainOfCustodyPrintModalProps) {
  if (!shipment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full my-8 overflow-hidden print:border-none print:shadow-none print:m-0 print:max-w-none">
        {/* MODAL CONTROL HEADER (Hidden on print) */}
        <div className="bg-slate-100 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">
              NABL ISO 15189:2022 Chain of Custody Manifest Preview
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              Print Official Slip
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div className="p-8 sm:p-10 space-y-6 text-slate-900 bg-white print:p-6" id="printable-manifest">
          {/* INSTITUTIONAL CLINICAL HEADER */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-2xl tracking-tight text-blue-900">
                    LABCORE ENTERPRISE CLINICAL LABORATORIES
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-600">
                  Central Reference Pathology &amp; Inpatient Hospital Diagnostic Network
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 pt-1 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700">
                    NABL ACCREDITED (ISO 15189:2022) #MC-4491
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700">
                    CAP LAB ID: 8821092
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700">
                    ICMR COVID/VRDL REGISTERED
                  </span>
                </div>
              </div>

              {/* Barcode / Manifest Reference */}
              <div className="text-right shrink-0">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Consignment Manifest
                </div>
                <div className="font-mono text-xl font-black text-slate-900 mt-0.5">
                  {shipment.trackingId}
                </div>
                <div className="text-[11px] font-mono text-slate-600 font-bold mt-1">
                  SEAL: {shipment.tamperSealNumber}
                </div>
              </div>
            </div>
          </div>

          {/* DOCUMENT TITLE & METADATA BAR */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Origin Facility / Ward</span>
              <strong className="text-slate-900 block mt-0.5">{shipment.origin}</strong>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Destination Hub</span>
              <strong className="text-slate-900 block mt-0.5">{shipment.destination}</strong>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Clinical Urgency</span>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                shipment.priority === 'STAT' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-800'
              }`}>
                {shipment.priority} PRIORITY
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Thermal Band</span>
              <strong className="text-emerald-700 block mt-0.5 font-mono">
                {shipment.currentTempCelsius > 0 ? `+${shipment.currentTempCelsius}°C` : `${shipment.currentTempCelsius}°C`} (PASS)
              </strong>
            </div>
          </div>

          {/* TRANSPORT & COURIER LOGISTICS */}
          <div className="border border-slate-200 rounded-xl p-4 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Courier / Phlebotomist</span>
              <strong className="text-slate-800 text-sm block mt-0.5">{shipment.driver}</strong>
              <span className="text-[11px] text-slate-500 font-mono">{shipment.driverPhone}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Transport Vehicle</span>
              <strong className="text-slate-800 block mt-0.5">{shipment.vehicle}</strong>
              <span className="text-[11px] text-slate-500 font-mono">{shipment.vehiclePlate}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Dispatch Timestamp</span>
              <strong className="text-slate-800 block mt-0.5">
                {new Date(shipment.dispatchedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </strong>
              <span className="text-[10px] text-slate-500">Total Specimens: {shipment.samplesCount} Tubes</span>
            </div>
          </div>

          {/* SPECIMEN CONSIGNMENT INVENTORY TABLE */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Biological Specimen Roster (Chain of Custody Itemization)
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                CLSI Order of Draw Verified
              </span>
            </div>

            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2 px-3 border-r border-slate-200">#</th>
                    <th className="py-2 px-3 border-r border-slate-200">Tube Barcode</th>
                    <th className="py-2 px-3 border-r border-slate-200">Patient UHID &amp; Name</th>
                    <th className="py-2 px-3 border-r border-slate-200">Vacutainer</th>
                    <th className="py-2 px-3 border-r border-slate-200">Test Ordered</th>
                    <th className="py-2 px-3">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {shipment.tubes.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-500 border-r border-slate-200">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-blue-700 border-r border-slate-200">{t.barcode}</td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        <strong className="text-slate-900 block">{t.patientName}</strong>
                        <span className="text-[10px] text-slate-500 font-mono">{t.uhid} · {t.ageGender}</span>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        <span className="inline-flex items-center gap-1 font-bold text-[11px]">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.colorHex }} />
                          {t.vacutainerType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-700 border-r border-slate-200">{t.testName}</td>
                      <td className="py-2 px-3 text-emerald-700 font-bold">{t.conditionStatus}</td>
                    </tr>
                  ))}
                  {shipment.tubes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                        Supply delivery or report package. No biological blood vacutainers attached.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* DUAL CHAIN OF CUSTODY LEGAL ATTESTATION SIGNATURES */}
          <div className="pt-4 border-t-2 border-slate-300">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
              Tripartite Chain-of-Custody Sign-off &amp; Dual Attestation
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Box 1: Releasing Officer */}
              <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  1. Releasing Clinician / Ward Incharge
                </span>
                <div>
                  <strong className="text-slate-900 block">{shipment.chainOfCustody.releasedBy}</strong>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Time: {shipment.chainOfCustody.releaseTime}
                  </span>
                </div>
                <div className="h-10 border-b border-dashed border-slate-400 mt-2" />
                <span className="text-[9px] text-slate-400 block text-center">Authorized Signature</span>
              </div>

              {/* Box 2: Transport Courier / Runner */}
              <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  2. Transport Courier / Porter Handover
                </span>
                <div>
                  <strong className="text-slate-900 block">{shipment.chainOfCustody.courierRunnerName}</strong>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Time: {shipment.chainOfCustody.courierHandoverTime || 'In Transit'}
                  </span>
                </div>
                <div className="h-10 border-b border-dashed border-slate-400 mt-2" />
                <span className="text-[9px] text-slate-400 block text-center">Courier Signature</span>
              </div>

              {/* Box 3: Central Accessioning Tech */}
              <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  3. Central Lab Accessioning MLT
                </span>
                <div>
                  <strong className="text-slate-900 block">
                    {shipment.chainOfCustody.receivedByTechnologist || 'Awaiting Hub Dock Verification'}
                  </strong>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Time: {shipment.chainOfCustody.hubReceivedTime || 'Pending Dock Arrival'}
                  </span>
                </div>
                <div className="h-10 border-b border-dashed border-slate-400 mt-2" />
                <span className="text-[9px] text-slate-400 block text-center">Medical Technologist Attestation</span>
              </div>
            </div>
          </div>

          {/* FOOTER ACCREDITATION NOTICE */}
          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">
              This document serves as an official legal Chain of Custody manifest under NABL ISO 15189:2022 clause 5.4.4 (Sample Collection &amp; Transport).
            </p>
            <p>
              24x7 Specimen Logistics Command Desk: +91 98765 43210 · Emergency Cold-Chain Escalation: logistics@labcore.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
