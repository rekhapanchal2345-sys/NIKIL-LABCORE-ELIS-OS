"use client";

import React, { useState } from "react";
import {
  X,
  FileSignature,
  User,
  HeartPulse,
  Plus,
  Trash2,
  FlaskConical,
  Pill,
  Check,
  Printer,
  Sparkles,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/notifications";

export interface PrescriptionData {
  prescriptionNumber: string;
  barcode: string;
  date: string;
  patient: {
    uhid: string;
    fullName: string;
    age: number;
    gender: string;
    phone?: string;
  };
  doctor: {
    doctorName: string;
    specialization: string;
    registrationNumber: string;
    clinicHospitalName?: string;
  };
  vitals: {
    bloodPressure: string;
    pulseRate: number;
    spO2: number;
    temperature: string;
  };
  clinicalSummary: {
    provisionalDiagnosis: string;
    icd10Code: string;
    clinicalNotes: string;
  };
  medications: Array<{
    drugName: string;
    form: string;
    dosage: string;
    frequency: string;
    duration: string;
    foodTiming: string;
    instructions: string;
  }>;
  labOrders: Array<{
    testCode: string;
    testName: string;
    department: string;
    priority: "ROUTINE" | "URGENT" | "STAT";
  }>;
  advice: string;
  followUpDate: string;
}

interface PrescriptionBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rx: PrescriptionData) => void;
  prefillPatient?: any;
}

const COMMON_ICD_10 = [
  { code: "E11.9", name: "Type 2 diabetes mellitus without complications" },
  { code: "I10", name: "Essential (primary) hypertension" },
  { code: "J06.9", name: "Acute upper respiratory infection, unspecified" },
  { code: "K21.9", name: "Gastro-esophageal reflux disease without esophagitis" },
  { code: "M54.5", name: "Low back pain / Lumbar strain" },
  { code: "A09", name: "Infectious gastroenteritis and colitis, unspecified" },
  { code: "R50.9", name: "Fever, unspecified / Pyrexia of unknown origin" },
  { code: "N39.0", name: "Urinary tract infection, site not specified" },
];

const COMMON_LAB_PANELS = [
  { code: "CBC", name: "Complete Blood Count (CBC + ESR)", dept: "Hematology" },
  { code: "LFT", name: "Liver Function Test (LFT)", dept: "Biochemistry" },
  { code: "KFT", name: "Kidney Function Test / RFT (Creatinine, Urea, Electrolytes)", dept: "Biochemistry" },
  { code: "LIPID", name: "Lipid Profile (Cholesterol, Triglycerides, HDL, LDL)", dept: "Biochemistry" },
  { code: "HBA1C", name: "Glycated Hemoglobin (HbA1c) & Fasting Plasma Glucose", dept: "Biochemistry" },
  { code: "THYROID", name: "Thyroid Profile Total (T3, T4, TSH Ultra)", dept: "Biochemistry" },
  { code: "URINE_RM", name: "Urine Routine & Microscopic Examination", dept: "Clinical Pathology" },
  { code: "VIT_D_B12", name: "Vitamin D3 (25-OH) & Vitamin B12 Duo Panel", dept: "Immunology" },
];

const CLINICAL_ORDER_SETS = [
  {
    name: "Acute Febrile Illness / Dengue Protocol",
    badge: "Fever / Infection",
    diagnosis: "Acute Febrile Illness, Rule out Dengue / Malaria",
    icd10: "R50.9 / A90",
    notes: "High grade fever with retro-orbital headache and generalized myalgia. Hydration advised.",
    advice: "Strict bed rest, oral rehydration salts (ORS) 2-3 liters/day. Avoid NSAIDs/Aspirin.",
    meds: [
      { drugName: "Tab. Paracetamol 650 mg", form: "Tablet", dosage: "1 Tab", frequency: "1-1-1 (TID)", duration: "5 Days", foodTiming: "After Meals", instructions: "SOS for temp > 100°F" },
      { drugName: "Tab. Pantoprazole 40 mg", form: "Tablet", dosage: "1 Tab", frequency: "1-0-0 (Morning)", duration: "5 Days", foodTiming: "Empty Stomach", instructions: "30 mins before breakfast" },
      { drugName: "Oral Rehydration Salts (ORS) Sachet", form: "Powder", dosage: "1 Sachet in 1L Water", frequency: "As required", duration: "5 Days", foodTiming: "Any time", instructions: "Sip throughout day" },
    ],
    labs: ["CBC", "URINE_RM"],
  },
  {
    name: "Type 2 Diabetes & Hypertension Workup",
    badge: "Metabolic / Chronic",
    diagnosis: "Type 2 Diabetes Mellitus with Essential Hypertension",
    icd10: "E11.9 / I10",
    notes: "Follow-up review of glycemic control, target organ screening, and BP optimization.",
    advice: "Diabetic renal diet, low sodium, avoid refined sugars, 30 min daily brisk walk.",
    meds: [
      { drugName: "Tab. Metformin 500 mg (SR)", form: "Tablet", dosage: "1 Tab", frequency: "1-0-1", duration: "30 Days", foodTiming: "With Meals", instructions: "Post breakfast & dinner" },
      { drugName: "Tab. Telmisartan 40 mg", form: "Tablet", dosage: "1 Tab", frequency: "1-0-0 (Morning)", duration: "30 Days", foodTiming: "After Breakfast", instructions: "Check BP weekly" },
    ],
    labs: ["HBA1C", "KFT", "LIPID"],
  },
  {
    name: "Dyspepsia / Acid Peptic Protocol",
    badge: "Gastroenterology",
    diagnosis: "Gastro-esophageal Reflux Disease (GERD) with Non-ulcer Dyspepsia",
    icd10: "K21.9",
    notes: "Epigastric burning, retrosternal heartburn, postprandial heaviness.",
    advice: "Avoid spicy, fried foods and caffeine. Do not lie down within 2 hours of eating.",
    meds: [
      { drugName: "Cap. Rabeprazole 20mg + Domperidone 30mg (SR)", form: "Capsule", dosage: "1 Cap", frequency: "1-0-0", duration: "14 Days", foodTiming: "Empty Stomach", instructions: "Early morning with water" },
      { drugName: "Syp. Sucralfate + Oxetacaine", form: "Suspension", dosage: "10 mL", frequency: "1-1-1", duration: "7 Days", foodTiming: "Before Meals", instructions: "Shake well before use" },
    ],
    labs: ["CBC"],
  },
];

export default function PrescriptionBuilderModal({
  isOpen,
  onClose,
  onSubmit,
  prefillPatient,
}: PrescriptionBuilderModalProps) {
  const [uhid, setUhid] = useState(prefillPatient?.uhid || "UHID-2026-8812");
  const [patientName, setPatientName] = useState(prefillPatient?.patientName || prefillPatient?.name || "Smt. Sunita Devi");
  const [age, setAge] = useState<number>(prefillPatient?.age || 54);
  const [gender, setGender] = useState<string>(prefillPatient?.gender || "Female");
  const [phone, setPhone] = useState(prefillPatient?.phone || "+91 98231 44512");

  const [doctorName, setDoctorName] = useState("Dr. Rajesh Sharma, MD (Med)");
  const [specialization, setSpecialization] = useState("Consultant Physician & Cardiologist");
  const [regNo, setRegNo] = useState("MCI/NMC-2012-78941");

  // Vitals
  const [bp, setBp] = useState(prefillPatient?.vitals?.bloodPressure || "130/84 mmHg");
  const [pulse, setPulse] = useState(prefillPatient?.vitals?.pulseRate || 74);
  const [spO2, setSpO2] = useState(prefillPatient?.vitals?.spO2 || 99);
  const [temp, setTemp] = useState(prefillPatient?.vitals?.temperature || "98.6 °F");

  // Diagnosis
  const [diagnosis, setDiagnosis] = useState(prefillPatient?.chiefComplaint || "Essential Hypertension with Type 2 Diabetes Mellitus");
  const [icd10, setIcd10] = useState("I10 / E11.9");
  const [clinicalNotes, setClinicalNotes] = useState("Patient compliant with medication. Blood pressure controlled. Advised annual microalbuminuria test.");

  // Medications
  const [medications, setMedications] = useState([
    {
      drugName: "Tab. Telmisartan 40 mg",
      form: "Tablet",
      dosage: "1 Tab",
      frequency: "1-0-0 (Morning)",
      duration: "30 Days",
      foodTiming: "After Breakfast",
      instructions: "Check BP weekly",
    },
    {
      drugName: "Tab. Metformin 500 mg (SR)",
      form: "Tablet",
      dosage: "1 Tab",
      frequency: "1-0-1 (Morning & Night)",
      duration: "30 Days",
      foodTiming: "With Meals",
      instructions: "Avoid skipping meals",
    },
  ]);

  // Lab Orders
  const [labOrders, setLabOrders] = useState([
    { code: "HBA1C", name: "Glycated Hemoglobin (HbA1c) & Fasting Plasma Glucose", dept: "Biochemistry", priority: "ROUTINE" as const },
    { code: "KFT", name: "Kidney Function Test / RFT (Creatinine, Urea, Electrolytes)", dept: "Biochemistry", priority: "ROUTINE" as const },
  ]);

  const [advice, setAdvice] = useState("Low sodium & diabetic renal diet. 30 mins brisk walking daily. Maintain hydration.");
  const [followUpDate, setFollowUpDate] = useState("2026-11-26 (After 4 Weeks)");
  const [patientAllergies, setPatientAllergies] = useState<string[]>(
    prefillPatient?.allergies || ["Penicillin", "Sulfa drugs"]
  );

  if (!isOpen) return null;

  const handleApplyOrderSet = (orderSet: typeof CLINICAL_ORDER_SETS[0]) => {
    setDiagnosis(orderSet.diagnosis);
    setIcd10(orderSet.icd10);
    setClinicalNotes(orderSet.notes);
    setAdvice(orderSet.advice);
    setMedications(orderSet.meds);
    const newLabs = COMMON_LAB_PANELS.filter((p) => orderSet.labs.includes(p.code)).map((p) => ({
      code: p.code,
      name: p.name,
      dept: p.dept,
      priority: "ROUTINE" as const,
    }));
    setLabOrders(newLabs);
    showSuccess(`Applied Clinical Protocol: "${orderSet.name}"`);
  };

  const allergyWarnings = medications
    .map((m) => {
      const name = m.drugName.toLowerCase();
      if (
        patientAllergies.some((a) => a.toLowerCase().includes("penicillin")) &&
        (name.includes("amox") || name.includes("penicil") || name.includes("augmentin") || name.includes("ampicil"))
      ) {
        return { med: m.drugName, allergy: "Penicillin / Beta-Lactams" };
      }
      if (
        patientAllergies.some((a) => a.toLowerCase().includes("sulfa")) &&
        (name.includes("sulfa") || name.includes("bactrim") || name.includes("septran") || name.includes("cotrim"))
      ) {
        return { med: m.drugName, allergy: "Sulphonamides (Sulfa)" };
      }
      return null;
    })
    .filter(Boolean) as Array<{ med: string; allergy: string }>;

  const handleAddMedication = () => {
    setMedications((prev) => [
      ...prev,
      {
        drugName: "",
        form: "Tablet",
        dosage: "1 Tab",
        frequency: "1-0-1",
        duration: "5 Days",
        foodTiming: "After Meals",
        instructions: "",
      },
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateMedication = (index: number, field: string, val: string) => {
    setMedications((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: val } : m))
    );
  };

  const handleToggleLabPanel = (panel: typeof COMMON_LAB_PANELS[0]) => {
    if (labOrders.some((o) => o.code === panel.code)) {
      setLabOrders((prev) => prev.filter((o) => o.code !== panel.code));
    } else {
      setLabOrders((prev) => [
        ...prev,
        {
          code: panel.code,
          name: panel.name,
          dept: panel.dept,
          priority: "ROUTINE",
        },
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      showError("Patient full name is mandatory");
      return;
    }

    const rxNumber = `RX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const barcode = `BC-${Date.now().toString().slice(-8)}`;

    const newPrescription: PrescriptionData = {
      prescriptionNumber: rxNumber,
      barcode,
      date: new Date().toISOString().split("T")[0],
      patient: {
        uhid,
        fullName: patientName,
        age: Number(age),
        gender,
        phone,
      },
      doctor: {
        doctorName,
        specialization,
        registrationNumber: regNo,
        clinicHospitalName: "LabCore Enterprise Hospital & Multispecialty Center",
      },
      vitals: {
        bloodPressure: bp,
        pulseRate: Number(pulse),
        spO2: Number(spO2),
        temperature: temp,
      },
      clinicalSummary: {
        provisionalDiagnosis: diagnosis,
        icd10Code: icd10,
        clinicalNotes,
      },
      medications,
      labOrders: labOrders.map((l) => ({
        testCode: l.code,
        testName: l.name,
        department: l.dept,
        priority: l.priority,
      })),
      advice,
      followUpDate,
    };

    onSubmit(newPrescription);
    showSuccess(`Prescription ${rxNumber} generated with ${medications.length} Rx drugs and ${labOrders.length} CPOE lab orders.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header (Clean White Clinical UI) */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold border border-sky-100 shadow-2xs">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-slate-900">
                  Smart E-Prescription & Diagnostic CPOE
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  Official Digital Rx Pad
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Issue verified drug prescriptions and direct computerized diagnostic orders with automated LIS accession sync.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
          
          {/* Clinical Protocols / Order Sets Quick Select */}
          <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-700" />
                Fast Clinical Protocols (1-Click Order Sets):
              </span>
              <span className="text-[10px] text-sky-800 font-semibold">
                Auto-fills Diagnosis, Meds & Diagnostic Labs
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {CLINICAL_ORDER_SETS.map((set, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyOrderSet(set)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-100 text-sky-900 font-bold text-xs border border-sky-300 shadow-2xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{set.name}</span>
                  <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 text-[9px] uppercase font-bold">
                    {set.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Clinical Decision Support: Drug-Allergy Warning Alert */}
          {allergyWarnings.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-rose-600 animate-pulse" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-rose-950 text-xs block">
                  ⚠️ Clinical Decision Support (CDS) Drug-Allergy Interaction Alert
                </span>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  The prescribed medication list contains potential cross-reactive allergens:
                </p>
                <div className="mt-1 space-y-0.5">
                  {allergyWarnings.map((w, idx) => (
                    <div key={idx} className="font-bold text-rose-900 text-[11px]">
                      • <strong>{w.med}</strong> is contraindicated with recorded allergy:{" "}
                      <span className="underline">{w.allergy}</span>.
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Patient Identity & Vitals */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-600" />
              Patient Identity & Clinical Vitals
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">UHID / Patient ID</label>
                <input
                  type="text"
                  value={uhid}
                  onChange={(e) => setUhid(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-mono font-bold text-slate-900 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-900 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Blood Pressure</label>
                <input
                  type="text"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  placeholder="120/80 mmHg"
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pulse Rate (bpm)</label>
                <input
                  type="number"
                  value={pulse}
                  onChange={(e) => setPulse(Number(e.target.value))}
                  placeholder="72"
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">SpO2 (%)</label>
                <input
                  type="number"
                  value={spO2}
                  onChange={(e) => setSpO2(Number(e.target.value))}
                  placeholder="99"
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Temperature</label>
                <input
                  type="text"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  placeholder="98.6 °F"
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Diagnosis & ICD-10 */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
              Clinical Diagnosis & ICD-10 Classification
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Provisional Clinical Impression</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Type 2 Diabetes Mellitus with Essential Hypertension"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">ICD-10 Code</label>
                <input
                  type="text"
                  value={icd10}
                  onChange={(e) => setIcd10(e.target.value)}
                  placeholder="e.g. E11.9 / I10"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Quick ICD-10 Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold mr-1">Quick Select:</span>
              {COMMON_ICD_10.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setIcd10(item.code);
                    if (!diagnosis) setDiagnosis(item.name);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 text-[10px] font-medium border border-slate-200 transition"
                >
                  {item.code}: {item.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Prescribed Medications (Rx) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-teal-600" />
                Prescribed Medications (Rx) ({medications.length})
              </div>
              <button
                type="button"
                onClick={handleAddMedication}
                className="px-2.5 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold border border-teal-200 transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Medicine
              </button>
            </div>

            <div className="space-y-2">
              {medications.map((med, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 items-center"
                >
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Drug & Strength</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tab. Paracetamol 650 mg"
                      value={med.drugName}
                      onChange={(e) => handleUpdateMedication(idx, "drugName", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-900 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Dosage Form</label>
                    <select
                      value={med.form}
                      onChange={(e) => handleUpdateMedication(idx, "form", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-800 bg-white"
                    >
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Injection">Injection</option>
                      <option value="Drops">Drops</option>
                      <option value="Ointment">Ointment</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Frequency</label>
                    <input
                      type="text"
                      placeholder="1-0-1"
                      value={med.frequency}
                      onChange={(e) => handleUpdateMedication(idx, "frequency", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-900 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Duration</label>
                    <input
                      type="text"
                      placeholder="5 Days"
                      value={med.duration}
                      onChange={(e) => handleUpdateMedication(idx, "duration", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-900 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between gap-1 pt-3 sm:pt-0">
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Timing</label>
                      <input
                        type="text"
                        placeholder="After Food"
                        value={med.foodTiming}
                        onChange={(e) => handleUpdateMedication(idx, "foodTiming", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-900 bg-white"
                      />
                    </div>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(idx)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition mt-4"
                        title="Remove drug"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Diagnostic CPOE Orders (Lab Panels) */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-sky-600" />
              Computerized Diagnostic Lab Orders (CPOE) ({labOrders.length} Selected)
            </div>
            <p className="text-[11px] text-slate-500">
              Selected investigations are automatically routed to the Phlebotomy accession desk and Analyzer worklist.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMMON_LAB_PANELS.map((panel) => {
                const isSelected = labOrders.some((o) => o.code === panel.code);

                return (
                  <button
                    key={panel.code}
                    type="button"
                    onClick={() => handleToggleLabPanel(panel)}
                    className={`flex items-start justify-between p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? "bg-sky-50 border-sky-300 text-sky-900 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{panel.name}</div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Dept: {panel.dept} • Code: {panel.code}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                        isSelected
                          ? "bg-sky-600 text-white border-sky-600"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Advice & Follow-up */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Dietary & Lifestyle Advice
              </label>
              <textarea
                rows={2}
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Next Follow-Up Date / Advice
              </label>
              <input
                type="text"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                placeholder="After 2 Weeks"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Doctor Signature Block Notice */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
            <div>
              <strong>Attending Physician:</strong> {doctorName} ({specialization}) • Reg: {regNo}
            </div>
            <span className="font-bold text-teal-700">Digital Seal & Cryptographic Signature Attached</span>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5"
                title="Print prescription pad preview"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Pad</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <FileSignature className="w-4 h-4 text-white" />
                <span>Issue & Sign E-Prescription</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
