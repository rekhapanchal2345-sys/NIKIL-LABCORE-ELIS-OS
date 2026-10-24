'use client';

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDispatch({
      type,
      priority,
      title: title || `${type.replace('_', ' ')}: ${origin} to ${destination}`,
      description: description || `${samplesCount} specimens under ${tempBand.replace(/_/g, ' ')} cold-chain`,
      origin,
      originType: type === 'WARD_STAT' ? 'ICU_WARD' : type === 'HOME_COLLECTION' ? 'PATIENT_HOME' : 'SPOKE_CLINIC',
      destination,
      driver,
      driverPhone,
      vehicle,
      vehiclePlate,
      vehicleType: 'HOSPITAL_PORTER',
      status: 'DISPATCHED',
      etaMinutes: Number(etaMinutes),
      etaTimestamp: new Date(Date.now() + Number(etaMinutes) * 60000).toISOString(),
      samplesCount: Number(samplesCount),
      currentTempCelsius: tempBand === 'FROZEN_MINUS_20' ? -21.0 : 4.2,
      tempRequirement: tempBand,
      tamperSealNumber: `SEAL-${Math.floor(10000 + Math.random() * 90000)}`,
      tubes: [
        {
          id: `t-${Date.now()}-1`,
          barcode: `BC-${Math.floor(1000 + Math.random() * 9000)}-01`,
          uhid: `UH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          patientName: 'Emergency Hospital Patient',
          ageGender: '52Y / M',
          vacutainerType: 'EDTA_LAVENDER',
          colorHex: '#8B5CF6',
          testName: 'STAT Emergency CBC + Biomarkers',
          department: 'Hematology',
          conditionStatus: 'INTACT',
          isScannedAtDock: false,
        },
      ],
      chainOfCustody: {
        releasedBy: 'Duty Medical Officer / Staff Nurse',
        releaseTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        courierRunnerName: driver,
        verificationNotes: 'Immediate dispatch logged into LabCore Logistics Command.',
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Dispatch Specimen Logistics Trip
              </h3>
              <p className="text-xs text-slate-500">
                Initiate hospital porter runner, spoke consignment, or home collection
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Logistics Category</label>
              <select
                value={type}
                onChange={(e) => {
                  const t = e.target.value as TripType;
                  setType(t);
                  if (t === 'WARD_STAT') {
                    setPriority('STAT');
                    setOrigin('ICU Ward 3B');
                    setDestination('Central Lab - Accessioning Bay 1');
                    setDriver('Ramesh Yadav (Hospital Porter #04)');
                    setDriverPhone('+91 98250 11442');
                    setVehicle('Hospital Electric Cart #02');
                    setVehiclePlate('CART-ICU-02');
                    setEtaMinutes(15);
                  } else if (t === 'HOME_COLLECTION') {
                    setPriority('ROUTINE');
                    setOrigin('Patient Residence (Satellite Area)');
                    setDestination('Central Lab Phlebotomy Intake');
                    setDriver('Anil Sharma (Senior Phlebotomist)');
                    setDriverPhone('+91 97234 55890');
                    setVehicle('Electric Bike with Cryo-Box');
                    setVehiclePlate('GJ-01-EE-4192');
                    setEtaMinutes(35);
                  } else if (t === 'INTER_LAB') {
                    setPriority('URGENT');
                    setOrigin('Main Lab - Molecular Wing');
                    setDestination('Reference Genomics Lab, Mumbai');
                    setDriver('BlueDart Medical Express');
                    setDriverPhone('+91 1800 233 1234');
                    setVehicle('Boeing 737 Cargo / Cold Van');
                    setVehiclePlate('MH-04-BD-7001');
                    setTempBand('FROZEN_MINUS_20');
                    setEtaMinutes(180);
                  } else {
                    setPriority('ROUTINE');
                    setOrigin('Maninagar Diagnostic Spoke');
                    setDestination('Main Processing Laboratory');
                    setDriver('Kishore Parmar');
                    setDriverPhone('+91 94280 99120');
                    setVehicle('Refrigerated Carrier Bike');
                    setVehiclePlate('GJ-01-BK-9182');
                    setEtaMinutes(40);
                  }
                }}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white font-medium"
              >
                <option value="WARD_STAT">Hospital Ward STAT (15-min SLA)</option>
                <option value="SAMPLE_PICKUP">B2B Spoke Consignment Pickup</option>
                <option value="HOME_COLLECTION">Home Phlebotomy Collection</option>
                <option value="INTER_LAB">Inter-Lab Referral Consignment</option>
                <option value="SUPPLY_DELIVERY">Supply &amp; Reagent Courier</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Clinical Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white font-bold"
              >
                <option value="STAT">STAT (Immediate 15-min Priority)</option>
                <option value="URGENT">URGENT (Under 45-min SLA)</option>
                <option value="ROUTINE">ROUTINE (Standard Batch TAT)</option>
              </select>
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Trip Title / Description</label>
            <input
              type="text"
              placeholder="e.g. ICU Sepsis Biomarkers / Spoke Consignment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Origin & Destination */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Origin (Ward / Spoke)</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Destination Facility</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
          </div>

          {/* Runner & Vehicle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Assigned Runner / Courier</label>
              <input
                type="text"
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Transport Vehicle / Plate</label>
              <input
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
          </div>

          {/* Cold Chain Band & Specimen Count */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Thermal Band</label>
              <select
                value={tempBand}
                onChange={(e) => setTempBand(e.target.value as TempBand)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                <option value="2_TO_8_C">2°C–8°C (Cold Pack)</option>
                <option value="FROZEN_MINUS_20">-20°C (Dry Ice / Frozen)</option>
                <option value="AMBIENT_15_25">15°C–25°C (Ambient Whole Blood)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Specimens Count</label>
              <input
                type="number"
                min={1}
                value={samplesCount}
                onChange={(e) => setSamplesCount(parseInt(e.target.value))}
                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Expected ETA (Mins)</label>
              <input
                type="number"
                min={1}
                value={etaMinutes}
                onChange={(e) => setEtaMinutes(parseInt(e.target.value))}
                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Confirm &amp; Dispatch Trip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
