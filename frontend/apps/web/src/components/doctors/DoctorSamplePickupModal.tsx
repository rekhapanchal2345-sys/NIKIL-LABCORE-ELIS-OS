"use client";

import React, { useState } from "react";
import {
  X,
  Bike,
  Clock,
  MapPin,
  Phone,
  User,
  FlaskConical,
  AlertCircle,
  CheckCircle,
  Calendar,
  Building,
  Printer,
  MessageCircle,
  Copy,
  Send,
  ShieldCheck,
  Check,
  ThermometerSnowflake,
} from "lucide-react";
import { DoctorProfileData } from "./DoctorQuickViewModal";
import { showSuccess, showError } from "@/lib/notifications";

interface DoctorSamplePickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorProfileData | null;
}

const COMMON_TEST_PANELS = [
  { id: "cbc", label: "Complete Blood Count (CBC)", tube: "EDTA Purple", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { id: "lft", label: "Liver Function Test (LFT)", tube: "SST Gold Gel", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { id: "kft", label: "Kidney Function Test (KFT/RFT)", tube: "SST Gold Gel", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { id: "lipid", label: "Lipid Profile (Fasting)", tube: "SST Gold Gel", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { id: "hba1c", label: "HbA1c Glycated Hemoglobin", tube: "EDTA Purple", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { id: "fbs", label: "Fasting Blood Sugar (FBS)", tube: "Fluoride Grey", color: "bg-slate-200 text-slate-800 border-slate-300" },
  { id: "ppbs", label: "Post-Prandial Sugar (PPBS)", tube: "Fluoride Grey", color: "bg-slate-200 text-slate-800 border-slate-300" },
  { id: "thyroid", label: "Thyroid Profile (T3, T4, TSH)", tube: "SST Gold Gel", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { id: "urine", label: "Urine Routine & Microscopic", tube: "Sterile Cup", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { id: "dengue", label: "Dengue NS1 Antigen & IgM", tube: "SST Gold Gel", color: "bg-rose-100 text-rose-800 border-rose-200" },
  { id: "vitd", label: "Vitamin D3 (25-OH)", tube: "SST Gold Gel", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { id: "vitb12", label: "Vitamin B12 Cyanocobalamin", tube: "SST Gold Gel", color: "bg-amber-100 text-amber-800 border-amber-200" },
];

const AVAILABLE_RIDERS = [
  { id: "RIDER-1", name: "Rajesh Kumar (Hub Central Rider)", phone: "+91 98250 11223", vehicle: "Bike (Ice Box Fitted)", zone: "Central & West" },
  { id: "RIDER-2", name: "Amit Patel (STAT Emergency Phlebotomist)", phone: "+91 98980 44556", vehicle: "E-Bike (Cold Chain Active)", zone: "Hospital District" },
  { id: "RIDER-3", name: "Sunil Verma (Morning Fasting Team)", phone: "+91 97230 77889", vehicle: "Bike (Vaccine Ice Pack)", zone: "North Zone" },
  { id: "AUTO", name: "Auto-Dispatch Nearest Mobile Rider", phone: "+91 98765 43210", vehicle: "Automated LIS Routing", zone: "Dynamic" },
];

export default function DoctorSamplePickupModal({
  isOpen,
  onClose,
  doctor,
}: DoctorSamplePickupModalProps) {
  const doctorName =
    doctor?.fullName ||
    doctor?.name ||
    [doctor?.firstName, doctor?.middleName, doctor?.lastName].filter(Boolean).join(" ") ||
    "Doctor";

  const cleanDocName = doctorName.startsWith("Dr") ? doctorName : `Dr. ${doctorName}`;
  const doctorCode = doctor?.doctorCode || `DOC-${doctor?.id || "REG"}`;
  const clinic = doctor?.clinicName || "Apex Multispecialty Hospital";
  const clinicAddress =
    doctor?.clinicAddress ||
    [doctor?.address, doctor?.city, doctor?.state].filter(Boolean).join(", ") ||
    "Chamber 204, Diagnostic Wing, Ahmedabad";

  // Requisition form state
  const [pickupId] = useState(`PKP-${Date.now().toString().slice(-6)}`);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [patientPhone, setPatientPhone] = useState("");
  const [pickupLocationType, setPickupLocationType] = useState<"DOCTOR_CLINIC" | "PATIENT_HOME">("DOCTOR_CLINIC");
  const [customAddress, setCustomAddress] = useState(clinicAddress);
  const [selectedTests, setSelectedTests] = useState<string[]>(["cbc", "lft", "kft"]);
  const [urgency, setUrgency] = useState<"STAT" | "MORNING_FASTING" | "ROUTINE">("STAT");
  const [fastingStatus, setFastingStatus] = useState<"FASTING" | "RANDOM" | "PP">("FASTING");
  const [assignedRiderId, setAssignedRiderId] = useState("RIDER-2");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [dispatchedSuccess, setDispatchedSuccess] = useState(false);

  const toggleTest = (id: string) => {
    setSelectedTests((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const selectedTestLabels = COMMON_TEST_PANELS.filter((t) =>
    selectedTests.includes(t.id)
  );

  const assignedRider = AVAILABLE_RIDERS.find((r) => r.id === assignedRiderId) || AVAILABLE_RIDERS[0];

  const handleDispatch = () => {
    if (!patientName.trim()) {
      showError("Please enter patient name for this sample collection");
      return;
    }
    if (selectedTests.length === 0) {
      showError("Please select at least one laboratory test panel");
      return;
    }

    setDispatchedSuccess(true);
    showSuccess(`Sample pickup order #${pickupId} registered and dispatched to ${assignedRider.name}!`);
  };

  const handleShareRiderWhatsApp = () => {
    const rawRiderPhone = assignedRider.phone.replace(/\D/g, "");
    const cleanRiderPhone = rawRiderPhone.length === 10 ? `91${rawRiderPhone}` : rawRiderPhone;
    
    const message = encodeURIComponent(
      `🚨 *URGENT SPECIMEN PICKUP DISPATCH ORDER (#${pickupId})*\n` +
      `*LABCORE ENTERPRISE DIAGNOSTICS LOGISTICS*\n\n` +
      `• *Urgency:* ${urgency === "STAT" ? "🔴 STAT EMERGENCY (60-90 MIN)" : urgency === "MORNING_FASTING" ? "🟡 SCHEDULED FASTING (7-9 AM)" : "🟢 ROUTINE"}\n` +
      `• *Referring Doctor:* ${cleanDocName} (${doctorCode})\n` +
      `• *Doctor Clinic:* ${clinic}\n` +
      `• *Pickup Address:* ${pickupLocationType === "DOCTOR_CLINIC" ? clinicAddress : customAddress}\n\n` +
      `*PATIENT PARTICULARS:*\n` +
      `• *Patient Name:* ${patientName} (${patientAge}y / ${patientGender})\n` +
      `• *Patient Contact:* ${patientPhone || "Collect at Chamber"}\n` +
      `• *Fasting Status:* ${fastingStatus}\n\n` +
      `*TEST PANELS REQUIRED:*\n` +
      selectedTestLabels.map((t) => `  ✓ ${t.label} [${t.tube}]`).join("\n") +
      `\n\n*COLD CHAIN INSTRUCTION:*\n` +
      `Maintain 2°C - 8°C cold chain pack. Accession counter barcode immediately upon arrival.\n` +
      `${clinicalNotes ? `• Notes: ${clinicalNotes}\n` : ""}\n` +
      `Dispatched by LabCore LIS Logistics Coordinator.`
    );

    window.open(`https://wa.me/${cleanRiderPhone}?text=${message}`, "_blank");
  };

  const handlePrintSlip = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sample Collection Requisition - ${pickupId}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; margin: 15mm; color: #0F172A; }
            .header { border-bottom: 2px solid #0F172A; padding-bottom: 8px; margin-bottom: 15px; }
            .title { font-size: 16px; font-weight: 800; }
            .meta { font-size: 11px; color: #475569; margin-top: 4px; }
            .section { border: 1px solid #CBD5E1; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
            .sec-title { font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; color: #0284C7; }
            .row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
            .bold { font-weight: 700; }
            .tests-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; }
            .test-pill { background: #F1F5F9; padding: 4px 8px; border-radius: 4px; border: 1px solid #E2E8F0; }
            .footer { margin-top: 25px; padding-top: 10px; border-top: 1px dashed #94A3B8; font-size: 10px; color: #64748B; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">LABCORE ENTERPRISE DIAGNOSTICS — SPECIMEN PICKUP DISPATCH VOUCHER</div>
            <div class="meta">NABL ISO 15189:2022 Accredited Reference Lab • 24x7 Logistics Hub: +91 98765 43210</div>
          </div>

          <div class="section">
            <div class="sec-title">1. DISPATCH IDENTIFIERS & URGENCY</div>
            <div class="row"><span>Voucher ID: <strong class="bold">${pickupId}</strong></span><span>Urgency: <strong class="bold">${urgency}</strong></span></div>
            <div class="row"><span>Assigned Phlebotomist: <strong class="bold">${assignedRider.name}</strong></span><span>Vehicle: ${assignedRider.vehicle}</span></div>
          </div>

          <div class="section">
            <div class="sec-title">2. REFERRING CLINICIAN PARTICULARS</div>
            <div class="row"><span>Doctor Name: <strong class="bold">${cleanDocName}</strong></span><span>LIS Code: <strong class="bold">${doctorCode}</strong></span></div>
            <div class="row"><span>Chamber: ${clinic}</span><span>Location: ${clinicAddress}</span></div>
          </div>

          <div class="section">
            <div class="sec-title">3. PATIENT PARTICULARS & PICKUP LOCATION</div>
            <div class="row"><span>Patient: <strong class="bold">${patientName}</strong> (${patientAge}y / ${patientGender})</span><span>Phone: ${patientPhone || "N/A"}</span></div>
            <div class="row"><span>Location: ${pickupLocationType === "DOCTOR_CLINIC" ? clinicAddress : customAddress}</span><span>Fasting: ${fastingStatus}</span></div>
          </div>

          <div class="section">
            <div class="sec-title">4. SPECIMEN REQUISITION & CONTAINER MATRIX</div>
            <div class="tests-grid">
              ${selectedTestLabels.map((t) => `<div class="test-pill">✓ <strong>${t.label}</strong> [${t.tube}]</div>`).join("")}
            </div>
            ${clinicalNotes ? `<p style="font-size:11px; margin-top:8px;"><strong>Special Directives:</strong> ${clinicalNotes}</p>` : ""}
          </div>

          <div class="footer">
            Maintain specimen cold chain (2°C-8°C). Sign on sample container: Phlebotomist ___________________ | Time: ___________
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  if (!isOpen || !doctor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[94vh]">
        
        {/* Header Bar */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  Doctor Specimen Pickup & Rider Dispatch
                </h3>
                <span className="font-mono text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  {pickupId}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Schedule mobile phlebotomist rider to collect samples for <strong className="text-slate-800">{cleanDocName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Content */}
        <div className="p-6 overflow-y-auto space-y-5 bg-slate-50/50">
          
          {/* Section 1: Doctor & Clinic Header Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-800 font-black text-sm">
                Dr
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{cleanDocName}</h4>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                    {doctorCode}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{clinic} • {clinicAddress}</span>
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                Active Referral Partner
              </span>
            </div>
          </div>

          {/* Section 2: Patient Particulars */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-sky-600" />
              <span>1. Patient Information for Specimen Collection</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Chandra Mehta"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Age (Years)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 48"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as any)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-600 focus:outline-none bg-white"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Patient Phone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="e.g. 98765 12345"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pickup Location
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPickupLocationType("DOCTOR_CLINIC");
                      setCustomAddress(clinicAddress);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      pickupLocationType === "DOCTOR_CLINIC"
                        ? "bg-sky-50 border-sky-400 text-sky-800 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    Doctor Chamber
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPickupLocationType("PATIENT_HOME");
                      if (customAddress === clinicAddress) setCustomAddress("");
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      pickupLocationType === "PATIENT_HOME"
                        ? "bg-sky-50 border-sky-400 text-sky-800 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    Patient Residence
                  </button>
                </div>
              </div>
            </div>

            {pickupLocationType === "PATIENT_HOME" && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Patient Residence Address *
                </label>
                <input
                  type="text"
                  placeholder="Enter full flat number, apartment name, street, landmark, area"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-600 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Section 3: Test Requisition Multi-Selection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-teal-600" />
                <span>2. Laboratory Investigation Panels Required</span>
              </h4>
              <span className="text-xs font-bold text-sky-700">
                {selectedTests.length} tests selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_TEST_PANELS.map((test) => {
                const isSelected = selectedTests.includes(test.id);
                return (
                  <button
                    key={test.id}
                    type="button"
                    onClick={() => toggleTest(test.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-start gap-2 ${
                      isSelected
                        ? "bg-sky-50/70 border-sky-400 text-sky-950 shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-sky-600 border-sky-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="leading-tight text-[11px] font-bold">{test.label}</p>
                      <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded border mt-1 ${test.color}`}>
                        {test.tube}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Urgency, Fasting & Rider Logistics */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <ThermometerSnowflake className="w-4 h-4 text-emerald-600" />
              <span>3. Phlebotomy Cold Chain Logistics & Urgency</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Urgency */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Collection Priority
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: "STAT", label: "STAT (60-90 min Urgency)", badge: "Emergency" },
                    { id: "MORNING_FASTING", label: "Morning Fasting (7-9 AM)", badge: "Scheduled" },
                    { id: "ROUTINE", label: "Routine Afternoon Collection", badge: "Same-Day" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setUrgency(p.id as any)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-between ${
                        urgency === p.id
                          ? "bg-rose-50 border-rose-400 text-rose-800"
                          : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fasting Protocol */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Fasting Protocol
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: "FASTING", label: "Fasting (10-12 hrs)" },
                    { id: "RANDOM", label: "Random (Non-Fasting)" },
                    { id: "PP", label: "Post-Prandial (2 hrs post-food)" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFastingStatus(f.id as any)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        fastingStatus === f.id
                          ? "bg-amber-50 border-amber-400 text-amber-800"
                          : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assign Mobile Rider */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Assign Phlebotomist Rider
                </label>
                <select
                  value={assignedRiderId}
                  onChange={(e) => setAssignedRiderId(e.target.value)}
                  className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-slate-300 focus:border-sky-600 focus:outline-none bg-white mb-2"
                >
                  {AVAILABLE_RIDERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                  <p><strong>Contact:</strong> {assignedRider.phone}</p>
                  <p><strong>Vehicle:</strong> {assignedRider.vehicle}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Special Clinical Instructions / Panic Value Directives
              </label>
              <input
                type="text"
                placeholder="e.g. Patient is geriatric/hard vein; Call doctor immediately if WBC > 20,000"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-600 focus:outline-none"
              />
            </div>
          </div>

          {dispatchedSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-black">Pickup Order #{pickupId} Registered Successfully</h4>
                  <p className="text-[11px] text-emerald-700">
                    Phlebotomist Rider {assignedRider.name} alerted. Estimated arrival: 25-35 mins.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareRiderWhatsApp}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Send to Rider WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Action Bar */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            24x7 Diagnostic Specimen Logistics • Automated Barcode & Cold-Chain Tracking
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDispatch}
              className="flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
            >
              <Bike className="w-4 h-4" />
              <span>Dispatch Rider Requisition</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
