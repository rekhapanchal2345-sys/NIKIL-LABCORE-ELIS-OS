"use client";

import React, { useState } from "react";
import {
  FileSignature,
  Plus,
  Search,
  Filter,
  Printer,
  Share2,
  Calendar,
  Pill,
  FlaskConical,
  User,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Copy,
  ChevronRight,
  Eye,
  Download,
  X,
  ShieldCheck,
  Stethoscope,
  Building,
} from "lucide-react";
import { PrescriptionData } from "./PrescriptionBuilderModal";
import { showSuccess, showInfo } from "@/lib/notifications";

const INITIAL_PRESCRIPTIONS: PrescriptionData[] = [
  {
    prescriptionNumber: "RX-2026-904121",
    barcode: "BC-90412101",
    date: "2026-10-26",
    patient: {
      uhid: "UHID-2026-8812",
      fullName: "Smt. Sunita Devi",
      age: 54,
      gender: "Female",
      phone: "+91 98231 44512",
    },
    doctor: {
      doctorName: "Dr. Rajesh Sharma, MD",
      specialization: "Consultant Physician & Cardiologist",
      registrationNumber: "MCI/NMC-2012-78941",
      clinicHospitalName: "LabCore Enterprise Hospital & Multispecialty Center",
    },
    vitals: {
      bloodPressure: "134/86 mmHg",
      pulseRate: 78,
      spO2: 98,
      temperature: "98.6 °F",
    },
    clinicalSummary: {
      provisionalDiagnosis: "Essential Hypertension with Type 2 Diabetes Mellitus",
      icd10Code: "I10 / E11.9",
      clinicalNotes: "BP controlled on Telmisartan. Fasting sugars slightly elevated.",
    },
    medications: [
      {
        drugName: "Tab. Telmisartan 40 mg",
        form: "Tablet",
        dosage: "1 Tab",
        frequency: "1-0-0 (Morning)",
        duration: "30 Days",
        foodTiming: "After Breakfast",
        instructions: "Continue without interruption",
      },
      {
        drugName: "Tab. Metformin 500 mg (SR)",
        form: "Tablet",
        dosage: "1 Tab",
        frequency: "1-0-1 (Morning & Night)",
        duration: "30 Days",
        foodTiming: "With Meals",
        instructions: "Do not skip meals",
      },
      {
        drugName: "Tab. Atorvastatin 10 mg",
        form: "Tablet",
        dosage: "1 Tab",
        frequency: "0-0-1 (Night)",
        duration: "30 Days",
        foodTiming: "At Bedtime",
        instructions: "Lipid lowering therapy",
      },
    ],
    labOrders: [
      {
        testCode: "HBA1C",
        testName: "Glycated Hemoglobin (HbA1c) & Fasting Plasma Glucose",
        department: "Biochemistry",
        priority: "ROUTINE",
      },
      {
        testCode: "LIPID",
        testName: "Lipid Profile Comprehensive",
        department: "Biochemistry",
        priority: "ROUTINE",
      },
    ],
    advice: "Low salt, diabetic diet. Daily 30 mins brisk walk. Hydrate with 2.5L water.",
    followUpDate: "2026-11-26 (After 4 Weeks)",
  },
  {
    prescriptionNumber: "RX-2026-904118",
    barcode: "BC-90411802",
    date: "2026-10-26",
    patient: {
      uhid: "UHID-2026-8809",
      fullName: "Shri Amit Verma",
      age: 38,
      gender: "Male",
      phone: "+91 97112 34567",
    },
    doctor: {
      doctorName: "Dr. Vikram Patel, MD",
      specialization: "General Physician & Diabetologist",
      registrationNumber: "MCI/NMC-2015-44219",
      clinicHospitalName: "LabCore City Clinic & Diagnostics",
    },
    vitals: {
      bloodPressure: "118/76 mmHg",
      pulseRate: 104,
      spO2: 97,
      temperature: "102.4 °F",
    },
    clinicalSummary: {
      provisionalDiagnosis: "Acute Febrile Illness (Suspected Dengue / Viral Pyrexia)",
      icd10Code: "A90 / R50.9",
      clinicalNotes: "High grade fever with retro-orbital headache and arthralgia for 3 days.",
    },
    medications: [
      {
        drugName: "Tab. Paracetamol 650 mg",
        form: "Tablet",
        dosage: "1 Tab",
        frequency: "1-1-1 (Thrice daily)",
        duration: "5 Days",
        foodTiming: "After Meals",
        instructions: "Take SOS for fever > 100°F. Maintain 6 hr gap.",
      },
      {
        drugName: "Cap. Pantoprazole 40 mg",
        form: "Capsule",
        dosage: "1 Cap",
        frequency: "1-0-0 (Morning)",
        duration: "5 Days",
        foodTiming: "Empty Stomach",
        instructions: "Take 30 mins before breakfast",
      },
      {
        drugName: "Sachet ORS Oral Electrolytes",
        form: "Sachet",
        dosage: "1 Sachet in 1L water",
        frequency: "Frequent sips",
        duration: "5 Days",
        foodTiming: "Anytime",
        instructions: "Keep well hydrated. Target 3L oral fluids.",
      },
    ],
    labOrders: [
      {
        testCode: "CBC",
        testName: "Complete Blood Count (Platelet Monitoring)",
        department: "Hematology",
        priority: "STAT",
      },
      {
        testCode: "DENGUE_NS1",
        testName: "Dengue NS1 Antigen & IgM/IgG Antibody Combo",
        department: "Serology",
        priority: "STAT",
      },
    ],
    advice: "Strict bed rest. Monitor temperature every 4 hours. Report immediately if any petechial rash or bleeding.",
    followUpDate: "2026-10-28 (After 48 Hours with fresh CBC report)",
  },
  {
    prescriptionNumber: "RX-2026-904105",
    barcode: "BC-90410503",
    date: "2026-10-25",
    patient: {
      uhid: "UHID-2026-8794",
      fullName: "Master Aarav Gupta",
      age: 7,
      gender: "Male",
      phone: "+91 99100 22334",
    },
    doctor: {
      doctorName: "Dr. Priya Nair, MD",
      specialization: "Pediatrician & Neonatologist",
      registrationNumber: "MCI/NMC-2018-91024",
      clinicHospitalName: "LabCore Children's Health Center",
    },
    vitals: {
      bloodPressure: "98/64 mmHg",
      pulseRate: 92,
      spO2: 99,
      temperature: "99.1 °F",
    },
    clinicalSummary: {
      provisionalDiagnosis: "Acute Upper Respiratory Tract Infection (URTI) with Allergic Rhinitis",
      icd10Code: "J06.9",
      clinicalNotes: "Rhinorrhea, nocturnal spasmodic dry cough. Throat mild congestion.",
    },
    medications: [
      {
        drugName: "Syp. Amoxicillin + Clavulanate (228.5 mg/5ml)",
        form: "Syrup",
        dosage: "5 ml",
        frequency: "1-0-1 (Twice daily)",
        duration: "5 Days",
        foodTiming: "After Meals",
        instructions: "Complete entire 5-day course",
      },
      {
        drugName: "Syp. Levocetirizine + Montelukast",
        form: "Syrup",
        dosage: "2.5 ml",
        frequency: "0-0-1 (Night)",
        duration: "5 Days",
        foodTiming: "At Bedtime",
        instructions: "For allergic cough relief",
      },
    ],
    labOrders: [
      {
        testCode: "CBC",
        testName: "Complete Blood Count (CBC + ESR)",
        department: "Hematology",
        priority: "ROUTINE",
      },
    ],
    advice: "Steam inhalation twice daily. Avoid chilled beverages.",
    followUpDate: "2026-10-30 (After 5 Days)",
  },
];

interface DoctorPrescriptionCpoeViewProps {
  onOpenNewRx: () => void;
  prescriptionsList?: PrescriptionData[];
}

export default function DoctorPrescriptionCpoeView({
  onOpenNewRx,
  prescriptionsList,
}: DoctorPrescriptionCpoeViewProps) {
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>(
    prescriptionsList && prescriptionsList.length > 0
      ? prescriptionsList
      : INITIAL_PRESCRIPTIONS
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState("all");
  const [selectedRxForPreview, setSelectedRxForPreview] = useState<PrescriptionData | null>(null);
  const [selectedRxForPrint, setSelectedRxForPrint] = useState<PrescriptionData | null>(null);

  const handlePrintRx = (rx: PrescriptionData) => {
    setSelectedRxForPrint(rx);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleWhatsAppShare = (rx: PrescriptionData) => {
    const phone = rx.patient.phone?.replace(/\D/g, "");
    if (!phone) {
      alert("Patient phone number not found.");
      return;
    }
    const message = `Hello ${rx.patient.fullName}, your digital E-Prescription (${rx.prescriptionNumber}) from ${rx.doctor.doctorName} at LabCore Enterprise Hospital is ready.\n\nDiagnosis: ${rx.clinicalSummary.provisionalDiagnosis}\nFollow-Up: ${rx.followUpDate}\n\nPlease take medicines on time.`;
    const url = `https://wa.me/${phone.length === 10 ? `91${phone}` : phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    showSuccess("WhatsApp prescription notification prepared.");
  };

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const matchesSearch =
      !searchQuery ||
      rx.prescriptionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.patient.uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.doctor.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.clinicalSummary.provisionalDiagnosis.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpecialty =
      selectedSpecialtyFilter === "all" ||
      rx.doctor.specialization.toLowerCase().includes(selectedSpecialtyFilter.toLowerCase());

    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="space-y-4">
      
      {/* ── Clinical Summary Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            <span>Total E-Prescriptions</span>
            <FileSignature className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{prescriptions.length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Computerized Physician Orders</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            <span>Diagnostics Linked</span>
            <FlaskConical className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-xl font-black text-slate-900">
            {prescriptions.reduce((acc, curr) => acc + curr.labOrders.length, 0)} Tests
          </p>
          <p className="text-[10px] text-teal-700 font-semibold mt-0.5">Automated LIS sample requisition</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            <span>Drugs Prescribed</span>
            <Pill className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-slate-900">
            {prescriptions.reduce((acc, curr) => acc + curr.medications.length, 0)} Items
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Standard dosage & food timings</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            <span>CDS Contraindication Check</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-700">100% Passed</p>
          <p className="text-[10px] text-emerald-800 font-semibold mt-0.5">Drug-Allergy & DDI Verified</p>
        </div>
      </div>

      {/* ── Action & Filter Header ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search prescriptions by Rx number, UHID, patient name, diagnosis, doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-xs font-medium placeholder-slate-400 focus:border-sky-600 focus:outline-none bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenNewRx}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>New E-Prescription</span>
            </button>
          </div>

        </div>

        {/* Specialty Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-bold text-[11px] mr-1">Specialty:</span>
          {[
            { id: "all", label: "All Departments" },
            { id: "Cardiology", label: "Cardiology" },
            { id: "General Physician", label: "General Medicine" },
            { id: "Pediatrician", label: "Pediatrics" },
            { id: "Endocrinology", label: "Diabetology" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedSpecialtyFilter(item.id)}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                selectedSpecialtyFilter === item.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Prescriptions List Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Rx No / Barcode</th>
                <th className="py-3 px-4">Patient UHID & Vitals</th>
                <th className="py-3 px-4">Consultant Doctor</th>
                <th className="py-3 px-4">Provisional Diagnosis (ICD-10)</th>
                <th className="py-3 px-4">Medications Prescribed</th>
                <th className="py-3 px-4">CPOE Diagnostic Orders</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileSignature className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No prescriptions match this search.</p>
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map((rx) => (
                  <tr key={rx.prescriptionNumber} className="hover:bg-slate-50/80 transition-colors">
                    {/* Rx Number */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-sky-700">{rx.prescriptionNumber}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {rx.barcode} • {rx.date}
                      </div>
                      <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
                        CDS Verified
                      </span>
                    </td>

                    {/* Patient */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{rx.patient.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {rx.patient.uhid} • {rx.patient.age}y / {rx.patient.gender}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        BP: {rx.vitals.bloodPressure} • HR: {rx.vitals.pulseRate}
                      </div>
                    </td>

                    {/* Doctor */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{rx.doctor.doctorName}</div>
                      <div className="text-[11px] text-slate-500">{rx.doctor.specialization}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {rx.doctor.registrationNumber}
                      </div>
                    </td>

                    {/* Diagnosis */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 line-clamp-1">
                        {rx.clinicalSummary.provisionalDiagnosis}
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 mt-1 inline-block">
                        {rx.clinicalSummary.icd10Code}
                      </span>
                    </td>

                    {/* Medicines */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-800">
                          {rx.medications.length} Drugs Prescribed
                        </span>
                        <div className="text-[11px] text-slate-500 line-clamp-2">
                          {rx.medications.map((m) => m.drugName).join(", ")}
                        </div>
                      </div>
                    </td>

                    {/* CPOE Orders */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {rx.labOrders.length === 0 ? (
                          <span className="text-slate-400 text-[11px]">No lab tests ordered</span>
                        ) : (
                          rx.labOrders.map((o) => (
                            <span
                              key={o.testCode}
                              className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-semibold"
                            >
                              {o.testCode}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedRxForPreview(rx)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                          title="Preview Official Prescription Letterhead"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePrintRx(rx)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                          title="Print Official Prescription Slip"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleWhatsAppShare(rx)}
                          className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition cursor-pointer"
                          title="Send to Patient on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Interactive On-Screen Prescription Slip Preview Modal ── */}
      {selectedRxForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh]">
            
            {/* Modal Control Bar */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shadow-2xs">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Official E-Prescription & CPOE Order Pad
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedRxForPreview.prescriptionNumber} • Barcode: {selectedRxForPreview.barcode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintRx(selectedRxForPreview)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Pad</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleWhatsAppShare(selectedRxForPreview)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRxForPreview(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Letterhead Paper View */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-5 bg-white text-slate-900">
              
              {/* Hospital Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    LABCORE ENTERPRISE HOSPITAL & DIAGNOSTICS
                  </h2>
                  <p className="text-xs text-teal-800 font-bold uppercase tracking-wider">
                    NABL ISO 15189:2022 ACCREDITED CLINICAL CENTER & MULTISPECIALTY OPD
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Central Campus, Health City • Tel: +91 11 4050 6070 • Web: labcore.health
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <h3 className="text-sm font-bold text-slate-900">{selectedRxForPreview.doctor.doctorName}</h3>
                  <p className="text-xs text-sky-700 font-medium">{selectedRxForPreview.doctor.specialization}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Reg No: <strong className="text-slate-800">{selectedRxForPreview.doctor.registrationNumber}</strong>
                  </p>
                </div>
              </div>

              {/* Patient Demographics & Vitals Band */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <p><span className="text-slate-500 font-medium">Patient Name:</span> <strong className="text-slate-900">{selectedRxForPreview.patient.fullName}</strong></p>
                  <p><span className="text-slate-500 font-medium">UHID / Patient ID:</span> <strong className="font-mono text-slate-900">{selectedRxForPreview.patient.uhid}</strong></p>
                  <p><span className="text-slate-500 font-medium">Age / Gender:</span> <strong className="text-slate-900">{selectedRxForPreview.patient.age} Years / {selectedRxForPreview.patient.gender}</strong></p>
                </div>
                <div className="space-y-1 sm:text-right">
                  <p><span className="text-slate-500 font-medium">Date & Time:</span> <strong className="text-slate-900">{selectedRxForPreview.date}</strong></p>
                  <p><span className="text-slate-500 font-medium">Recorded Vitals:</span> <strong className="text-slate-900">BP {selectedRxForPreview.vitals.bloodPressure} | Pulse {selectedRxForPreview.vitals.pulseRate} bpm</strong></p>
                  <p><span className="text-slate-500 font-medium">SpO2 / Temp:</span> <strong className="text-slate-900">{selectedRxForPreview.vitals.spO2}% | {selectedRxForPreview.vitals.temperature}</strong></p>
                </div>
              </div>

              {/* Provisional Diagnosis */}
              <div className="bg-sky-50/60 p-3.5 rounded-xl border border-sky-200">
                <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block mb-0.5">
                  Provisional Diagnosis & ICD-10 Classification
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {selectedRxForPreview.clinicalSummary.provisionalDiagnosis}{" "}
                  <span className="font-mono text-xs text-sky-700 bg-white px-2 py-0.5 rounded border border-sky-200">
                    {selectedRxForPreview.clinicalSummary.icd10Code}
                  </span>
                </p>
                {selectedRxForPreview.clinicalSummary.clinicalNotes && (
                  <p className="text-xs text-slate-600 mt-1 italic">
                    "{selectedRxForPreview.clinicalSummary.clinicalNotes}"
                  </p>
                )}
              </div>

              {/* Medications Table */}
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-sky-600" />
                  ℞ Prescribed Medications (Dosage & Instructions)
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Medicine & Formulation</th>
                        <th className="p-2.5">Dosage / Frequency</th>
                        <th className="p-2.5">Duration</th>
                        <th className="p-2.5">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {selectedRxForPreview.medications.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-500">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900">{m.drugName}</td>
                          <td className="p-2.5">
                            <span className="font-bold text-sky-700">{m.frequency}</span> ({m.dosage})
                          </td>
                          <td className="p-2.5 font-medium">{m.duration}</td>
                          <td className="p-2.5 text-slate-600">
                            <strong>{m.foodTiming}</strong> — {m.instructions}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Diagnostic CPOE Lab Orders */}
              {selectedRxForPreview.labOrders.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-teal-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-teal-600" />
                    Diagnostic Investigations Ordered (CPOE Requisition)
                  </h4>
                  <div className="bg-teal-50/50 border border-teal-200 p-3 rounded-xl space-y-1.5">
                    {selectedRxForPreview.labOrders.map((o) => (
                      <div key={o.testCode} className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">
                          • {o.testName}{" "}
                          <span className="font-mono text-[10px] text-teal-800 bg-white px-1.5 py-0.2 rounded border border-teal-200">
                            {o.testCode}
                          </span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          {o.department} • {o.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General Advice & Follow-Up */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs">
                {selectedRxForPreview.advice && (
                  <p><strong className="text-slate-800">Dietary & Clinical Advice:</strong> {selectedRxForPreview.advice}</p>
                )}
                {selectedRxForPreview.followUpDate && (
                  <p><strong className="text-slate-800">Next Follow-Up Consultation:</strong> {selectedRxForPreview.followUpDate}</p>
                )}
              </div>

              {/* Doctor Seal & Sign-off Band */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="text-[10px] text-slate-400">
                  Digitally Authenticated E-Prescription • Tamper-Evident LIS Integration
                </div>
                <div className="text-center sm:text-right">
                  <div className="w-40 border-b border-slate-900 mb-1 mx-auto sm:ml-auto sm:mr-0"></div>
                  <p className="font-bold text-slate-900">{selectedRxForPreview.doctor.doctorName}</p>
                  <p className="text-[10px] text-slate-500">MCI/NMC Reg: {selectedRxForPreview.doctor.registrationNumber}</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ── Printable Official Prescription Pad (Hidden by default, triggered on window.print()) ── */}
      {selectedRxForPrint && (
        <div className="hidden print:block fixed inset-0 bg-white p-8 text-slate-900 z-50">
          <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-black">LABCORE ENTERPRISE HOSPITAL & DIAGNOSTICS</h2>
              <p className="text-xs text-slate-600">NABL Accredited Medical Lab & Multispecialty Health Center</p>
              <p className="text-[11px] text-slate-500">Contact: +91 11 4050 6070 • Website: labcore.health</p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-bold">{selectedRxForPrint.doctor.doctorName}</h3>
              <p className="text-xs text-slate-700">{selectedRxForPrint.doctor.specialization}</p>
              <p className="text-[11px] text-slate-500 font-mono">Reg No: {selectedRxForPrint.doctor.registrationNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded mb-4 border border-slate-200">
            <div>
              <p><strong>Patient:</strong> {selectedRxForPrint.patient.fullName} ({selectedRxForPrint.patient.age}y / {selectedRxForPrint.patient.gender})</p>
              <p><strong>UHID:</strong> {selectedRxForPrint.patient.uhid}</p>
            </div>
            <div className="text-right">
              <p><strong>Rx No:</strong> {selectedRxForPrint.prescriptionNumber}</p>
              <p><strong>Date:</strong> {selectedRxForPrint.date}</p>
              <p><strong>Vitals:</strong> BP {selectedRxForPrint.vitals.bloodPressure} | Pulse {selectedRxForPrint.vitals.pulseRate} bpm | SpO2 {selectedRxForPrint.vitals.spO2}%</p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Diagnosis:</h4>
            <p className="text-xs font-semibold text-slate-900">{selectedRxForPrint.clinicalSummary.provisionalDiagnosis} ({selectedRxForPrint.clinicalSummary.icd10Code})</p>
          </div>

          <div className="mb-6">
            <h4 className="text-xs font-black text-sky-800 uppercase mb-2">℞ Prescribed Medications:</h4>
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Medicine Name & Formulation</th>
                  <th className="p-2">Dosage & Frequency</th>
                  <th className="p-2">Duration</th>
                  <th className="p-2">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {selectedRxForPrint.medications.map((m, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-bold">{idx + 1}</td>
                    <td className="p-2 font-bold">{m.drugName}</td>
                    <td className="p-2">{m.frequency} ({m.dosage})</td>
                    <td className="p-2">{m.duration}</td>
                    <td className="p-2">{m.foodTiming} - {m.instructions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedRxForPrint.labOrders.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-black text-teal-800 uppercase mb-1">Diagnostic Investigations Ordered:</h4>
              <ul className="list-disc pl-5 text-xs text-slate-800 space-y-0.5">
                {selectedRxForPrint.labOrders.map((o) => (
                  <li key={o.testCode}>
                    <strong>{o.testName}</strong> ({o.department})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-8 text-xs bg-slate-50 p-2 rounded border border-slate-200">
            <p><strong>Advice:</strong> {selectedRxForPrint.advice}</p>
            <p><strong>Follow-Up:</strong> {selectedRxForPrint.followUpDate}</p>
          </div>

          <div className="flex justify-between items-end pt-8 border-t border-slate-300">
            <div className="text-[10px] text-slate-400">
              Generated via LabCore ELIS Electronic Prescription System • Digitally Verifiable
            </div>
            <div className="text-center">
              <div className="w-32 border-b border-slate-900 mb-1"></div>
              <p className="text-xs font-bold">{selectedRxForPrint.doctor.doctorName}</p>
              <p className="text-[10px] text-slate-500">Authorized Signature & Seal</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
