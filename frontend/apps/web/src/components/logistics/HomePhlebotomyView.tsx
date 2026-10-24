'use client';

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
  const [address, setAddress] = useState('');
  const [slot, setSlot] = useState('07:30 AM - 08:30 AM (Fasting)');
  const [testName, setTestName] = useState('Master Health Checkup (Fasting Glucose + Lipid + HbA1c)');
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [otpFeedback, setOtpFeedback] = useState<Record<string, string>>({});

  const homeTrips = shipments.filter(s => s.type === 'HOME_COLLECTION');

  const handleOtpVerify = (tripId: string, correctOtp: string) => {
    const entered = otpInputs[tripId] || '';
    if (entered === correctOtp) {
      setOtpFeedback(prev => ({ ...prev, [tripId]: 'OTP Verified! Specimen collected securely.' }));
      onVerifyOtp(tripId, entered);
    } else {
      setOtpFeedback(prev => ({ ...prev, [tripId]: 'Invalid OTP. Please check with patient.' }));
    }
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !address) return;
    onBookHomeVisit(patientName, address, slot, testName);
    setPatientName('');
    setAddress('');
    setShowBookingModal(false);
  };

  return (
    <div className="space-y-6">
      {/* BANNER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Home className="w-3.5 h-3.5 text-blue-600" />
              Mobile Diagnostics &amp; Phlebotomy Fleet
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Home Collection Route Planner &amp; Digital OTP Handover
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Geofenced patient visits, mobile cold-chain box compliance, and dual-authenticated sample collection
            </p>
          </div>

          <button
            onClick={() => setShowBookingModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Book Home Phlebotomy Visit
          </button>
        </div>
      </div>

      {/* APPOINTMENT ROUTE CARDS */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          Scheduled Home Visits &amp; En-Route Runs ({homeTrips.length})
        </h3>

        {homeTrips.map((trip) => {
          const home = trip.homeInfo;
          return (
            <div
              key={trip.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {trip.trackingId}
                  </span>
                  <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Slot: {home?.appointmentSlot || '08:00 AM'}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Status: {home?.geofenceStatus || 'EN_ROUTE'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <Thermometer className="w-3.5 h-3.5 text-blue-600" />
                  <span>Mobile Cryo-Box: <strong>{trip.currentTempCelsius}°C</strong> (2°C–8°C OK)</span>
                </div>
              </div>

              {/* Patient Details & Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    {trip.title}
                  </h4>
                  <p className="text-xs text-slate-600 font-medium flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span>{home?.patientAddress || trip.origin}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Orders: <strong>{trip.description}</strong>
                  </p>
                </div>

                {/* Phlebotomist & Digital OTP Authentication */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Assigned Phlebotomist</span>
                      <p className="font-bold text-slate-800">{trip.driver}</p>
                      <a href={`tel:${trip.driverPhone}`} className="text-blue-600 hover:underline text-[11px] font-mono">
                        {trip.driverPhone}
                      </a>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Patient OTP</span>
                      <p className="font-mono font-bold text-emerald-600 text-sm">
                        {home?.otpCode || '7821'}
                      </p>
                    </div>
                  </div>

                  {/* OTP Handover Verification Field */}
                  <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                    <div className="relative flex-1">
                      <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Enter 4-digit OTP"
                        value={otpInputs[trip.id] || ''}
                        onChange={(e) => setOtpInputs({ ...otpInputs, [trip.id]: e.target.value })}
                        className="w-full pl-8 pr-2 py-1.5 text-xs font-mono font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                        maxLength={4}
                      />
                    </div>
                    <button
                      onClick={() => handleOtpVerify(trip.id, home?.otpCode || '7821')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Verify
                    </button>
                  </div>

                  {otpFeedback[trip.id] && (
                    <p className={`text-[11px] font-bold ${
                      otpFeedback[trip.id].includes('Verified') ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {otpFeedback[trip.id]}
                    </p>
                  )}
                </div>
              </div>

              {/* Phlebotomy Kit Checklist */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Kit Pre-check:
                </span>
                <span>• Vacutainer Needle 21G</span>
                <span>• Tourniquet &amp; Alcohol Wipes</span>
                <span>• EDTA + Fluoride + SST Gel Tubes</span>
                <span>• Biohazard Zip-Bag with Cold Pack</span>
              </div>
            </div>
          );
        })}

        {homeTrips.length === 0 && (
          <div className="py-12 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
            No active home phlebotomy visits currently scheduled.
          </div>
        )}
      </div>

      {/* BOOK HOME VISIT MODAL */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-600" />
                Schedule Home Phlebotomy Visit
              </h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rameshchandra Dave"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Home Address</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 504 Shalimar Apartments, Satellite, Ahmedabad"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Appointment Time Slot</label>
                <select
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                >
                  <option value="07:00 AM - 08:00 AM (Fasting)">07:00 AM - 08:00 AM (Fasting Sugar / Lipid)</option>
                  <option value="08:00 AM - 09:00 AM (Fasting)">08:00 AM - 09:00 AM (Fasting Sugar / Lipid)</option>
                  <option value="10:00 AM - 11:00 AM (Post-Prandial)">10:00 AM - 11:00 AM (Post-Prandial Sugar)</option>
                  <option value="02:00 PM - 04:00 PM (Routine)">02:00 PM - 04:00 PM (Routine CBC / Thyroid)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Diagnostic Profile / Tests Ordered</label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Confirm &amp; Assign Rider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
