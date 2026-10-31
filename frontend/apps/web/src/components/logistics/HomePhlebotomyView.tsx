'use client';

// ============================================================
// LABCORE ELIS — Mobile Diagnostics & Home Phlebotomy Fleet Command
// ISO 15189:2022 | CLSI GP44-A4 | CLSI GP41 (Venipuncture Standard)
// Multi-stop route optimization, dual OTP authentication,
// mobile cold-chain PCM monitoring, and on-site centrifugation
// ============================================================

import React, { useState } from 'react';
import { ShipmentTrip } from './logistics.types';
import {
  Home,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Calendar,
  KeyRound,
  ShieldCheck,
  CheckSquare,
  Thermometer,
  Layers,
  ArrowRight,
  User,
  PlusCircle,
  AlertTriangle,
  Activity,
  Navigation,
  QrCode,
  Gauge,
  Syringe,
  Timer,
  Check,
  X,
  FileCheck,
  Droplets,
  RotateCw,
} from 'lucide-react';

interface HomePhlebotomyViewProps {
  shipments: ShipmentTrip[];
  onVerifyOtp: (tripId: string, enteredOtp: string) => void;
  onBookHomeVisit: (patientName: string, address: string, slot: string, testName: string) => void;
}

export default function HomePhlebotomyView({
  shipments,
  onVerifyOtp,
  onBookHomeVisit,
}: HomePhlebotomyViewProps) {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [slot, setSlot] = useState('07:00 AM - 08:00 AM (Fasting Profile)');
  const [testName, setTestName] = useState('Executive Health Check (Fasting Glucose + Lipid + HbA1c + LFT + KFT)');
  const [specialInstructions, setSpecialInstructions] = useState('Mandatory 10-12 hour overnight fasting. Call on gate arrival.');
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [otpFeedback, setOtpFeedback] = useState<Record<string, { success: boolean; msg: string }>>({});
  const [centrifugeActive, setCentrifugeActive] = useState<Record<string, boolean>>({});
  const [activeSubTab, setActiveSubTab] = useState<'ROSTER' | 'CLSI_AUDIT' | 'ROUTE_MAP'>('ROSTER');

  const homeTrips = shipments.filter(s => s.type === 'HOME_COLLECTION');

  const handleOtpVerify = (tripId: string, correctOtp: string) => {
    const entered = otpInputs[tripId] || '';
    if (entered === correctOtp) {
      setOtpFeedback(prev => ({
        ...prev,
        [tripId]: {
          success: true,
          msg: `Patient dual-factor verified! Barcode BC-${tripId} accessioned. Cold-box seal intact.`,
        },
      }));
      onVerifyOtp(tripId, entered);
    } else {
      setOtpFeedback(prev => ({
        ...prev,
        [tripId]: {
          success: false,
          msg: 'Incorrect OTP. Verify patient identity via SMS or registered phone.',
        },
      }));
    }
  };

  const handleToggleCentrifuge = (tripId: string) => {
    setCentrifugeActive(prev => ({
      ...prev,
      [tripId]: !prev[tripId],
    }));
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !address) return;
    onBookHomeVisit(patientName, address, slot, testName);
    setPatientName('');
    setPatientPhone('');
    setAddress('');
    setShowBookingModal(false);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                <Home className="w-3.5 h-3.5 text-teal-600" />
                Mobile Diagnostics &amp; Phlebotomy Operations
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                CLSI GP44-A4 &amp; GP41 COMPLIANT
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Home Phlebotomy Fleet &amp; Digital OTP Handover
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Geofenced patient visits, mobile Phase Change Material (PCM) cold-boxes, and in-vehicle serum centrifugation
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveSubTab('ROSTER')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'ROSTER'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Active Visits ({homeTrips.length})
            </button>
            <button
              onClick={() => setActiveSubTab('CLSI_AUDIT')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'CLSI_AUDIT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              CLSI Phlebotomy Checklist
            </button>
            <button
              onClick={() => setShowBookingModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Schedule Home Visit
            </button>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: ACTIVE VISITS ROSTER */}
      {activeSubTab === 'ROSTER' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Scheduled Home Appointments &amp; Active Runs ({homeTrips.length})
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Dual-factor OTP required to release collected vacutainers
            </span>
          </div>

          {homeTrips.map((trip) => {
            const home = trip.homeInfo;
            const isCentrifuging = centrifugeActive[trip.id];
            const feedback = otpFeedback[trip.id];

            return (
              <div
                key={trip.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-4"
              >
                {/* Trip Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {trip.trackingId}
                      </span>
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {trip.status}
                      </span>
                      <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        Slot: {home?.appointmentSlot || 'Morning 07:00 - 08:00 AM'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                        Seal: {trip.tamperSealNumber}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 mt-1">
                      {trip.title}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium">
                      Tests: <strong className="text-slate-800">{trip.description}</strong>
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0 space-y-1">
                    <div className="inline-flex items-center sm:justify-end gap-1.5 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      ETA: {trip.etaMinutes} mins
                    </div>
                    <div className="text-xs font-medium text-slate-600">
                      Phlebotomist: <strong className="text-slate-900">{trip.driver}</strong>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {trip.vehicle}
                    </div>
                  </div>
                </div>

                {/* Patient Address & Geofence Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Patient Destination</span>
                    <div className="flex items-start gap-1.5 text-slate-800 font-semibold">
                      <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{home?.patientAddress || trip.origin}</span>
                    </div>
                    <div className="text-[11px] text-blue-600 flex items-center gap-1 font-bold pt-1">
                      <Navigation className="w-3 h-3" />
                      Geofence: {home?.geofenceStatus || 'EN_ROUTE'} (&lt; 2.4 km away)
                    </div>
                  </div>

                  {/* Cold Box Thermal Status */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Mobile Cold-Box Telemetry</span>
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-black font-mono text-emerald-700">+{trip.currentTempCelsius}°C</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        PCM 2°C–8°C PASS
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Phase Change Gel Pack solid. Sensor pinged 2 min ago via 4G IoT collar.
                    </p>
                  </div>

                  {/* In-Vehicle Centrifuge Protocol */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Mobile 12V Centrifuge</span>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        {isCentrifuging ? 'Centrifuging (3000 RPM)' : 'Standby (Pre-Spin)'}
                      </span>
                      <button
                        onClick={() => handleToggleCentrifuge(trip.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                          isCentrifuging
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {isCentrifuging ? 'Stop Spin' : 'Start 10m Spin'}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      CLSI GP44-A4 requires serum clot separation within 60 min to eliminate in-vitro glycolysis.
                    </p>
                  </div>
                </div>

                {/* Patient Dual-Factor OTP Verification Block */}
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <KeyRound className="w-4 h-4 text-blue-600" />
                      <span>Dual-Factor Patient Handover Verification</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Patient receives OTP via SMS upon phlebotomist arrival. Required to seal specimen bag.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="4-digit OTP"
                        maxLength={6}
                        value={otpInputs[trip.id] || ''}
                        onChange={(e) =>
                          setOtpInputs(prev => ({ ...prev, [trip.id]: e.target.value }))
                        }
                        className="w-28 font-mono text-center font-bold px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <button
                      onClick={() => handleOtpVerify(trip.id, home?.otpCode || '4892')}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer shadow-2xs"
                    >
                      Authenticate
                    </button>
                    <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">
                      Demo OTP: {home?.otpCode || '4892'}
                    </span>
                  </div>
                </div>

                {/* Feedback message */}
                {feedback && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                      feedback.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    {feedback.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{feedback.msg}</span>
                  </div>
                )}
              </div>
            );
          })}

          {homeTrips.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-200">
              <Home className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No Home Phlebotomy Visits Scheduled</p>
              <p className="mt-0.5">Click &quot;Schedule Home Visit&quot; above to book a new appointment.</p>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: CLSI PHLEBOTOMY SAFETY & QUALITY CHECKLIST */}
      {activeSubTab === 'CLSI_AUDIT' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              CLSI GP41 &amp; ISO 15189:2022 Phlebotomy Safety Protocol
            </h3>
            <p className="text-xs text-slate-500">
              Mandatory procedural checklist for field phlebotomists to eliminate pre-analytical errors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-blue-700">
                1. Patient Identification &amp; Preparation
              </h4>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Two independent identifiers verified (Patient Name + Date of Birth / Govt Photo ID / UHID).</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Fasting compliance confirmed (10–12 hours for lipid profile &amp; fasting plasma glucose).</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Latex allergy and past fainting / syncope history recorded before venipuncture.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-blue-700">
                2. Tourniquet &amp; Venipuncture Mechanics
              </h4>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Tourniquet application strictly &lt; 60 seconds to prevent hemoconcentration and artificial hyperkalemia.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>70% Isopropanol swab allowed to air dry completely for 30s to avoid alcohol-induced hemolysis.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Needle bevel oriented upward at 15°–30° insertion angle.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-blue-700">
                3. Tube Inversion &amp; Clot Activation
              </h4>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>EDTA lavender tubes gently inverted 8–10 times immediately to prevent micro-clot formation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Sodium Citrate light blue tubes inverted 3–4 times; exact fill to graduation line mandatory.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>SST gold tubes maintained upright for 30 minutes at room temperature before centrifugation.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-blue-700">
                4. Biohazard &amp; Cold-Chain Sealing
              </h4>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Needle safety device activated immediately at bedside; sharps deposited in puncture-proof bin.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Barcodes labeled on tubes in front of the patient before leaving bedside.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Transfer into 2°C–8°C PCM insulated cold-box logged with digital timestamp.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Schedule Home Phlebotomy Appointment
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assign route, generate patient OTP, and dispatch certified field phlebotomist
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Patient Full Name
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Smt. Kamala Devi"
                    className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Patient Mobile (for OTP)
                  </label>
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="e.g. +91 98250 99412"
                    className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                  Complete Residential Address &amp; Landmarks
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Flat 402, Shivalik Residency, Opp. ISRO, Satellite, Ahmedabad"
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Time Slot
                  </label>
                  <select
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="06:30 AM - 07:30 AM (Early Fasting)">06:30 AM - 07:30 AM (Early Fasting)</option>
                    <option value="07:30 AM - 08:30 AM (Fasting)">07:30 AM - 08:30 AM (Fasting)</option>
                    <option value="08:30 AM - 09:30 AM (Fasting/Routine)">08:30 AM - 09:30 AM (Fasting/Routine)</option>
                    <option value="11:30 AM - 12:30 PM (Post-Prandial 2h)">11:30 AM - 12:30 PM (Post-Prandial 2h)</option>
                    <option value="04:00 PM - 05:00 PM (Evening Non-Fasting)">04:00 PM - 05:00 PM (Evening Non-Fasting)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Diagnostic Test Panel
                  </label>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="e.g. Master Health Checkup"
                    className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                  Pre-analytical Instructions &amp; Patient Preparation
                </label>
                <input
                  type="text"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. 10-12 hour fasting, bring previous reports"
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  Confirm &amp; Dispatch Phlebotomist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
