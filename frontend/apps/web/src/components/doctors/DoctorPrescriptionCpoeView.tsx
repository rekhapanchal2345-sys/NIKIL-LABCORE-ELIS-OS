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
      uhid: "UHID-2026-8815",
      fullName: "Shri Rameshwar Patel",
      age: 62,
      gender: "Male",
      phone: "+91 98110 55421",
    },
    doctor: {
      doctorName: "Dr. Ananya Sen, MD",
      specialization: "Consultant Diabetologist & Endocrinologist",
      registrationNumber: "MCI/NMC-2015-89102",
      clinicHospitalName: "LabCore Enterprise Hospital & Multispecialty Center",
    },
    vitals: {
      bloodPressure: "138/88 mmHg",
      pulseRate: 76,
      spO2: 98,
      temperature: "98.6 °F",
    },
    clinicalSummary: {
      provisionalDiagnosis: "Uncontrolled Type 2 Diabetes with Diabetic Peripheral Neuropathy",
      icd10Code: "E11.40",
      clinicalNotes: "Bilateral foot numbness. Microalbuminuria screening required.",
    },
    medications: [
      {
        drugName: "Tab. Pregabalin 75 mg + Methylcobalamin 1500 mcg",
        form: "Tablet",
        dosage: "1 Tab",
        frequency: "0-0-1 (Night)",
        duration: "15 Days",
        foodTiming: "After Dinner",
        instructions: "For neuropathic burning pain",
      },
      {
        drugName: "Tab. Glimepiride 1 mg + Metformin 500 mg",
        form: "Tablet",
        dosage: "1 Tab",
        frequency: "1-0-1",
        duration: "30 Days",
        foodTiming: "Before Breakfast & Dinner",
        instructions: "Monitor for hypoglycemia",
      },
    ],
    labOrders: [
      {
        testCode: "KFT",
        testName: "Kidney Function Test / RFT (Creatinine, Urea, Electrolytes)",
        department: "Biochemistry",
        priority: "ROUTINE",
      },
      {
        testCode: "URINE_RM",
        testName: "Urine Routine & Microscopic Examination",
        department: "Clinical Pathology",
        priority: "ROUTINE",
      },
    ],
    advice: "Diabetic footwear recommended. Daily foot inspection for cuts or ulcers.",
    followUpDate: "2026-11-10 (After 2 Weeks)",
  },
  {
    prescriptionNumber: "RX-2026-903994",
    barcode: "BC-90399403",
    date: "2026-10-25",
    patient: {
      uhid: "UHID-2026-8819",
      fullName: "Master Aarav Verma",
      age: 8,
      gender: "Male",
      phone: "+91 98990 11223",
    },
    doctor: {
      doctorName: "Dr. Priyanka Gupta, MD (Pediatrics)",
      specialization: "Consultant Pediatrician",
      registrationNumber: "MCI/NMC-2018-99432",
      clinicHospitalName: "LabCore Enterprise Hospital & Multispecialty Center",
    },
    vitals: {
      bloodPressure: "105/68 mmHg",
      pulseRate: 92,
      spO2: 99,
      temperature: "99.8 °F",
    },
    clinicalSummary: {
      provisionalDiagnosis: "Acute Bronchitis / Viral Upper Respiratory Tract Infection",
      icd10Code: "J20.9",
      clinicalNotes: "Mild wheezing bilateral lower zones. Good hydration maintained.",
    },
    medications: [
      {
        drugName: "Syp. Amoxicillin + Clavulanate 228.5 mg/5ml",
        form: "Syrup",
        dosage: "5 ml",
        frequency: "1-0-1",
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
    const message = `Hello ${rx.patient.fullName}, your digital E-Prescription (${rx.prescriptionNumber}) from ${rx.doctor.doctorName} at LabCore Enterprise Hospital is ready. Diagnosis: ${rx.clinicalSummary.provisionalDiagnosis}. Please adhere to prescribed doses. Follow-up: ${rx.followUpDate}.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    showSuccess("WhatsApp prescription notification prepared.");
  };

  const filteredPrescriptions = prescriptions.filter((rx) => {
    return (
      !searchQuery ||
      rx.prescriptionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.patient.uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.doctor.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.clinicalSummary.provisionalDiagnosis.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-4">
      
      {/* ── Action & Filter Header ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
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
      </div>

      {/* ── Prescriptions List Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Rx No / Barcode</th>
                <th className="py-3 px-4">Patient Information</th>
                <th className="py-3 px-4">Consultant Doctor</th>
                <th className="py-3 px-4">Diagnosis & ICD-10</th>
                <th className="py-3 px-4">Prescribed Medicines</th>
                <th className="py-3 px-4">Diagnostic CPOE Orders</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
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
                          onClick={() => handlePrintRx(rx)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                          title="Print Official Prescription Slip"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleWhatsAppShare(rx)}
                          className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition"
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

      {/* ── Printable Official Prescription Pad (Hidden by default, printed on demand) ── */}
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
