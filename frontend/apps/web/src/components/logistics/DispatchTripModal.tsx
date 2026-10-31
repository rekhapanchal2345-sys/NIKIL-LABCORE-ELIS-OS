'use client';

// ============================================================
// LABCORE ELIS — Enterprise Specimen Logistics Dispatch Modal
// ISO 15189:2022 §5.4 | IATA DGR Category B (UN 3373)
// Support for STAT Porters, Spoke Runs, Organ Transplant,
// Dry-Ice (-80°C), and Cryogenic Liquid Nitrogen (-196°C)
// ============================================================

import React, { useState } from 'react';
import { TripType, PriorityLevel, TempBand, ShipmentTrip } from './logistics.types';
import {
  Truck,
  X,
  Zap,
  MapPin,
  Clock,
  Thermometer,
  ShieldCheck,
  Send,
  User,
  Package,
  Activity,
  Droplets,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface DispatchTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDispatch: (trip: Omit<ShipmentTrip, 'id' | 'trackingId' | 'dispatchedAt' | 'progressPercent'>) => void;
}

export default function DispatchTripModal({
  isOpen,
  onClose,
  onDispatch,
}: DispatchTripModalProps) {
  const [type, setType] = useState<TripType>('WARD_STAT');
  const [priority, setPriority] = useState<PriorityLevel>('STAT');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [origin, setOrigin] = useState('ICU Ward 3B');
  const [destination, setDestination] = useState('Central Lab - Accessioning Bay 1');
  const [driver, setDriver] = useState('Ramesh Yadav (Hospital Porter #04)');
  const [driverPhone, setDriverPhone] = useState('+91 98250 11442');
  const [vehicle, setVehicle] = useState('Hospital Electric Cart #02');
  const [vehiclePlate, setVehiclePlate] = useState('CART-ICU-02');
  const [tempBand, setTempBand] = useState<TempBand>('2_TO_8_C');
  const [samplesCount, setSamplesCount] = useState<number>(4);
  const [etaMinutes, setEtaMinutes] = useState<number>(15);
  const [tamperSealNumber, setTamperSealNumber] = useState<string>(
    `SEAL-${Math.floor(10000 + Math.random() * 90000)}`
  );

  if (!isOpen) return null;

  const handleTypeChange = (t: TripType) => {
    setType(t);
    if (t === 'WARD_STAT') {
      setPriority('STAT');
      setOrigin('ICU Ward 3B');
      setDestination('Central Lab - Accessioning Bay 1');
      setDriver('Ramesh Yadav (Hospital Porter #04)');
      setDriverPhone('+91 98250 11442');
      setVehicle('Hospital Electric Cart #02');
      setVehiclePlate('CART-ICU-02');
      setTempBand('2_TO_8_C');
      setEtaMinutes(15);
    } else if (t === 'HOME_COLLECTION') {
      setPriority('ROUTINE');
      setOrigin('Patient Residence (Satellite Area)');
      setDestination('Central Lab Phlebotomy Intake');
      setDriver('Anil Sharma (Senior Phlebotomist)');
      setDriverPhone('+91 97234 55890');
      setVehicle('Electric Bike with Cryo-Box');
      setVehiclePlate('GJ-01-EE-4192');
      setTempBand('2_TO_8_C');
      setEtaMinutes(35);
    } else if (t === 'ORGAN_TRANSPORT') {
      setPriority('CRITICAL_ORGAN');
      setOrigin('Trauma Center OT Suite 1');
      setDestination('Apex Transplant Research Institute');
      setDriver('Capt. Vikram Chauhan (Organ Escort)');
      setDriverPhone('+91 99240 11882');
      setVehicle('Medical Green Corridor Ambulance');
      setVehiclePlate('GJ-01-AM-9911');
      setTempBand('2_TO_8_C');
      setEtaMinutes(20);
    } else if (t === 'CRYOGENIC_TRANSFER') {
      setPriority('URGENT');
      setOrigin('Stem Cell Processing Biobank');
      setDestination('National Oncology Research Vault');
      setDriver('Bio-Courier Specialists Ltd');
      setDriverPhone('+91 98200 44122');
      setVehicle('Cryo-Dewar Transport Carrier');
      setVehiclePlate('MH-02-CR-8821');
      setTempBand('CRYO_LN2_MINUS_196');
      setEtaMinutes(90);
    } else if (t === 'REFERENCE_LAB_REFERRAL' || t === 'INTER_LAB') {
      setPriority('URGENT');
      setOrigin('Main Lab - Molecular Diagnostics');
      setDestination('Reference Genomics Center, Mumbai');
      setDriver('BlueDart Medical Air Courier');
      setDriverPhone('+91 1800 233 1234');
      setVehicle('Boeing 737 Cargo / Cold Van');
      setVehiclePlate('MH-04-BD-7001');
      setTempBand('FROZEN_MINUS_20');
      setEtaMinutes(180);
    } else {
      setPriority('ROUTINE');
      setOrigin('Maninagar Diagnostic Spoke');
      setDestination('Main Processing Laboratory');
      setDriver('Kishore Parmar (Rider #07)');
      setDriverPhone('+91 94280 99120');
      setVehicle('Refrigerated Carrier Bike');
      setVehiclePlate('GJ-01-BK-9182');
      setTempBand('2_TO_8_C');
      setEtaMinutes(40);
    }
  };

  const getTemperatureEstimate = (band: TempBand): number => {
    switch (band) {
      case 'CRYO_LN2_MINUS_196':
        return -195.8;
      case 'DEEP_FREEZE_MINUS_80':
        return -78.4;
      case 'FROZEN_MINUS_20':
        return -21.2;
      case '2_TO_8_C':
        return 4.2;
      case 'AMBIENT_15_25':
        return 21.0;
      case 'ROOM_TEMP_20_25':
        return 22.5;
      default:
        return 4.0;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDispatch({
      type,
      priority,
      title: title || `${type.replace(/_/g, ' ')}: ${origin} to ${destination}`,
      description:
        description ||
        `${samplesCount} clinical specimens transported under ${tempBand.replace(/_/g, ' ')} temperature protocol`,
      origin,
      originType:
        type === 'WARD_STAT'
          ? 'ICU_WARD'
          : type === 'HOME_COLLECTION'
          ? 'PATIENT_HOME'
          : 'SPOKE_CLINIC',
      destination,
      driver,
      driverPhone,
      vehicle,
      vehiclePlate,
      vehicleType:
        type === 'WARD_STAT'
          ? 'HOSPITAL_PORTER'
          : type === 'HOME_COLLECTION'
          ? 'BIKE_COLD_BOX'
          : 'REFRIGERATED_VAN',
      status: 'DISPATCHED',
      etaMinutes: Number(etaMinutes),
      etaTimestamp: new Date(Date.now() + Number(etaMinutes) * 60000).toISOString(),
      samplesCount: Number(samplesCount),
      currentTempCelsius: getTemperatureEstimate(tempBand),
      tempRequirement: tempBand,
      tamperSealNumber,
      tubes: [
        {
          id: `t-${Date.now()}-1`,
          barcode: `BC-${Math.floor(1000 + Math.random() * 9000)}-01`,
          uhid: `UH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          patientName: 'Priority Clinical Patient',
          ageGender: '54Y / Male',
          vacutainerType:
            type === 'CRYOGENIC_TRANSFER'
              ? 'CRYO_VIAL_MINUS20'
              : type === 'WARD_STAT'
              ? 'EDTA_LAVENDER'
              : 'SST_GOLD',
          colorHex: '#8B5CF6',
          testName: `${type.replace(/_/g, ' ')} Diagnostic Panel`,
          department: 'Core Laboratory',
          conditionStatus: 'INTACT',
          isScannedAtDock: false,
        },
      ],
      chainOfCustody: {
        releasedBy: 'Duty Medical Officer / Staff In-Charge',
        releaseTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        courierRunnerName: driver,
        verificationNotes: 'Immediate dispatch logged into LabCore Logistics Command.',
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Dispatch Specimen Logistics Trip
              </h3>
              <p className="text-xs text-slate-500">
                ISO 15189:2022 §5.4 &amp; IATA Category B (UN 3373) transport manifest creation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Trip Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Logistics Category</label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as TripType)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white font-medium"
              >
                <option value="WARD_STAT">Hospital Ward STAT (15-min Critical SLA)</option>
                <option value="SAMPLE_PICKUP">B2B Spoke Consignment Pickup</option>
                <option value="HOME_COLLECTION">Home Phlebotomy Collection</option>
                <option value="ORGAN_TRANSPORT">Transplant &amp; Viable Perfusion Specimen</option>
                <option value="CRYOGENIC_TRANSFER">Cryogenic Biobank Transfer (LN₂ -196°C)</option>
                <option value="INTER_LAB">Inter-Lab Referral (Airfreight / Rail)</option>
                <option value="REFERENCE_LAB_REFERRAL">Apex Reference Lab Referral</option>
                <option value="SUPPLY_DELIVERY">Reagent &amp; Cold Consumable Courier</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Clinical Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white font-bold"
              >
                <option value="STAT">STAT (Emergency 15-Minute TAT)</option>
                <option value="CRITICAL_ORGAN">CRITICAL ORGAN / PERFUSION (Priority Code Blue)</option>
                <option value="URGENT">URGENT (Under 45-Minute SLA)</option>
                <option value="ROUTINE">ROUTINE (Standard Batch TAT)</option>
              </select>
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Trip Consignment Title</label>
            <input
              type="text"
              placeholder="e.g. ICU Sepsis Biomarkers / Maninagar Spoke Batch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            />
          </div>

          {/* Origin & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Origin (Ward / Clinic / Spoke)</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Destination Facility</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
          </div>

          {/* Runner & Vehicle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Assigned Runner / Courier</label>
              <input
                type="text"
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Transport Vehicle / Registration</label>
              <input
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
          </div>

          {/* Thermal Band, Specimen Count, Seal Number, ETA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Thermal Band</label>
              <select
                value={tempBand}
                onChange={(e) => setTempBand(e.target.value as TempBand)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white font-medium"
              >
                <option value="2_TO_8_C">2°C–8°C (PCM Cold-Box)</option>
                <option value="FROZEN_MINUS_20">-20°C (Dry Ice / Frozen)</option>
                <option value="DEEP_FREEZE_MINUS_80">-80°C (Deep Freeze Dry Ice)</option>
                <option value="CRYO_LN2_MINUS_196">-196°C (Liquid Nitrogen Dewar)</option>
                <option value="AMBIENT_15_25">15°C–25°C (Ambient Whole Blood)</option>
                <option value="ROOM_TEMP_20_25">20°C–25°C (Room Temp)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Specimens Count</label>
              <input
                type="number"
                min={1}
                value={samplesCount}
                onChange={(e) => setSamplesCount(parseInt(e.target.value) || 1)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Expected ETA (Minutes)</label>
              <input
                type="number"
                min={1}
                value={etaMinutes}
                onChange={(e) => setEtaMinutes(parseInt(e.target.value) || 15)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
          </div>

          {/* Tamper Seal Number */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500" />
              <div>
                <span className="font-bold text-slate-700 block text-xs">Tamper-Evident Security Seal:</span>
                <span className="font-mono text-blue-700 font-bold">{tamperSealNumber}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTamperSealNumber(`SEAL-${Math.floor(10000 + Math.random() * 90000)}`)}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
            >
              Re-generate Seal
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              Authorize &amp; Dispatch Consignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
