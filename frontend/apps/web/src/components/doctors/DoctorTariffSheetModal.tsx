"use client";

import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  X,
  Printer,
  Download,
  Search,
  Filter,
  DollarSign,
  Building,
  ShieldCheck,
  FileSpreadsheet,
  MessageCircle,
  Clock,
  Sparkles,
  Award,
  ChevronDown,
} from "lucide-react";
import { DoctorProfileData } from "./DoctorQuickViewModal";
import { showSuccess } from "@/lib/notifications";

interface DoctorTariffSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorProfileData | null;
}

interface TestTariffItem {
  code: string;
  name: string;
  dept: string;
  specimen: string;
  tat: string;
  fasting: string;
  mrp: number;
}

const MASTER_TEST_CATALOG: TestTariffItem[] = [
  { code: "HEM-001", name: "Complete Blood Count (CBC with ESR & 6-Part Diff)", dept: "Hematology", specimen: "2ml EDTA Whole Blood", tat: "2 Hours", fasting: "Random", mrp: 450 },
  { code: "HEM-002", name: "Hemoglobin & Hematocrit (Hb / PCV)", dept: "Hematology", specimen: "2ml EDTA Whole Blood", tat: "1 Hour", fasting: "Random", mrp: 180 },
  { code: "HEM-003", name: "Prothrombin Time with INR (PT/INR)", dept: "Hematology", specimen: "1.8ml Citrate Plasma", tat: "2 Hours", fasting: "Random", mrp: 350 },
  { code: "BIO-101", name: "Liver Function Test Comprehensive (LFT 11 Parameters)", dept: "Biochemistry", specimen: "3ml Plain Serum", tat: "3 Hours", fasting: "Fasting 8-10h", mrp: 850 },
  { code: "BIO-102", name: "Kidney / Renal Function Test (KFT/RFT with Electrolytes)", dept: "Biochemistry", specimen: "3ml Plain Serum", tat: "3 Hours", fasting: "Fasting", mrp: 750 },
  { code: "BIO-103", name: "Lipid Profile Extended (Chol, Trig, HDL, LDL, VLDL)", dept: "Biochemistry", specimen: "3ml Plain Serum", tat: "4 Hours", fasting: "Strict 12h Fasting", mrp: 650 },
  { code: "BIO-104", name: "Fasting Blood Glucose (FBS Fluoride)", dept: "Biochemistry", specimen: "2ml Fluoride Plasma", tat: "1 Hour", fasting: "Fasting 10h", mrp: 100 },
  { code: "BIO-105", name: "Post-Prandial Blood Glucose (PPBS)", dept: "Biochemistry", specimen: "2ml Fluoride Plasma", tat: "1 Hour", fasting: "2h Post-Food", mrp: 100 },
  { code: "BIO-106", name: "HbA1c Glycated Hemoglobin (HPLC Gold Standard)", dept: "Biochemistry", specimen: "2ml EDTA Whole Blood", tat: "2 Hours", fasting: "Random", mrp: 550 },
  { code: "END-201", name: "Thyroid Profile Total (T3, T4, TSH Ultra-Sensitive)", dept: "Endocrinology", specimen: "3ml Plain Serum", tat: "4 Hours", fasting: "Morning Preferred", mrp: 600 },
  { code: "END-202", name: "Free Thyroid Profile (FT3, FT4, TSH)", dept: "Endocrinology", specimen: "3ml Plain Serum", tat: "4 Hours", fasting: "Random", mrp: 850 },
  { code: "END-203", name: "Vitamin D3 (25-Hydroxy Cholecalciferol CLIA)", dept: "Endocrinology", specimen: "3ml Plain Serum", tat: "Same Day", fasting: "Random", mrp: 1400 },
  { code: "END-204", name: "Vitamin B12 (Cyanocobalamin ECLIA)", dept: "Endocrinology", specimen: "3ml Plain Serum", tat: "Same Day", fasting: "Fasting Preferred", mrp: 1100 },
  { code: "SER-301", name: "Dengue Duo Combo (NS1 Antigen + IgM + IgG)", dept: "Serology", specimen: "3ml Plain Serum", tat: "2 Hours", fasting: "Random", mrp: 950 },
  { code: "SER-302", name: "TyphiDot IgM & IgG (Enteric Fever Rapid)", dept: "Serology", specimen: "2ml Plain Serum", tat: "2 Hours", fasting: "Random", mrp: 450 },
  { code: "SER-303", name: "High-Sensitivity C-Reactive Protein (hs-CRP)", dept: "Serology", specimen: "2ml Plain Serum", tat: "2 Hours", fasting: "Random", mrp: 550 },
  { code: "SER-304", name: "Troponin-I High-Sensitivity STAT Quantitative", dept: "Serology", specimen: "3ml Heparin / Serum", tat: "60 Mins (STAT)", fasting: "Emergency Random", mrp: 1200 },
  { code: "CLI-401", name: "Urine Routine & Microscopic Examination (Automated)", dept: "Clinical Path", specimen: "10ml Clean Catch Urine", tat: "1 Hour", fasting: "Early Morning Sample", mrp: 180 },
  { code: "MIC-501", name: "Blood Culture & Automated Antibiotic Sensitivity (VITEK)", dept: "Microbiology", specimen: "10ml Blood in BacT/ALERT", tat: "48-72 Hours", fasting: "Before Antibiotics", mrp: 1500 },
];

export default function DoctorTariffSheetModal({
  isOpen,
  onClose,
  doctor,
}: DoctorTariffSheetModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const doctorName =
    doctor?.fullName ||
    doctor?.name ||
    [doctor?.firstName, doctor?.middleName, doctor?.lastName].filter(Boolean).join(" ") ||
    "Doctor";

  const cleanDocName = doctorName.startsWith("Dr") ? doctorName : `Dr. ${doctorName}`;
  const doctorCode = doctor?.doctorCode || `DOC-${doctor?.id || "REG"}`;
  const commissionRate = Number(doctor?.commissionRate) || 15;
  const clinic = doctor?.clinicName || "Apex Multispecialty Hospital";

  const departments = ["ALL", "Hematology", "Biochemistry", "Endocrinology", "Serology", "Clinical Path", "Microbiology"];

  const filteredTests = MASTER_TEST_CATALOG.filter((test) => {
    const matchesDept = selectedDept === "ALL" || test.dept === selectedDept;
    const matchesSearch =
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.dept.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setPdfGenerating(true);
    try {
      const canvas = await html2canvas(printAreaRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * (pageWidth - 16)) / canvas.width;
      pdf.addImage(imgData, "JPEG", 8, 8, pageWidth - 16, Math.min(imgHeight, pageHeight - 16));
      pdf.save(`LabCore_Tariff_Book_${doctorCode}.pdf`);
      showSuccess("Tariff book PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handlePrint = () => {
    const el = printAreaRef.current;
    if (!el) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>LabCore Diagnostic Directory & Tariff Book - ${cleanDocName}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; margin: 10mm; color: #0F172A; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background: #0F172A; color: white; padding: 6px 8px; text-align: left; }
            td { padding: 6px 8px; border-bottom: 1px solid #E2E8F0; }
            tr:nth-child(even) { background: #F8FAFC; }
            @page { size: A4 portrait; margin: 8mm; }
          </style>
        </head>
        <body>
          ${el.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  const handleShareWhatsApp = () => {
    const rawPhone = (doctor?.phone || doctor?.whatsappNumber || "").replace(/\D/g, "");
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const text = encodeURIComponent(
      `*LABCORE ENTERPRISE DIAGNOSTICS — OFFICIAL TARIFF & RATE MASTER*\n\n` +
      `Respected ${cleanDocName},\n` +
      `Please find our accredited diagnostic test directory and customized clinical referral tariffs for your practice (${clinic}):\n\n` +
      `• *Practitioner:* ${cleanDocName} (${doctorCode})\n` +
      `• *Referral Share Tier:* ${commissionRate}%\n` +
      `• *Routine Profiles:* CBC, LFT, KFT, HbA1c, Lipid Profile, Thyroid TSH\n` +
      `• *STAT Emergency Assays:* Troponin-I, hs-CRP, Dengue Duo, PT/INR\n` +
      `• *Specimen Logistics:* Cold-chain phlebotomy pickup available 24x7\n\n` +
      `For emergency rider pickup or panic result verification: +91 98765 43210\n` +
      `LabCore Enterprise Diagnostics • NABL ISO 15189:2022 Reference Lab`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  if (!isOpen || !doctor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[94vh]">
        
        {/* Header Bar */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  Doctor Diagnostic Rate Master & Tariff Book
                </h3>
                <span className="font-mono text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                  {doctorCode}
                </span>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                  {commissionRate}% Partner Tier
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Accredited Test Directory with MRP, Turnaround Time & Referral Incentive for <strong className="text-slate-800">{cleanDocName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={pdfGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-slate-50/70 p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Department Chips */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedDept === dept
                    ? "bg-teal-700 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by test name, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-medium pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none bg-white"
            />
          </div>
        </div>

        {/* Printable Canvas Body */}
        <div className="p-6 overflow-y-auto bg-white flex-1" ref={printAreaRef}>
          
          {/* Print Letterhead Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg">
                L
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  LABCORE ENTERPRISE REFERENCE LABORATORIES
                </h3>
                <p className="text-[10px] text-teal-700 font-bold tracking-wide uppercase">
                  NABL ISO 15189:2022 ACCREDITED DIAGNOSTIC DIRECTORY & B2B TARIFF
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-800">Custom Tariff for: <strong>{cleanDocName}</strong></span>
              <p className="text-[10px] text-slate-500 font-mono">Clinic: {clinic} • Code: {doctorCode}</p>
            </div>
          </div>

          {/* Catalog Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-extrabold">
                  <th className="py-2.5 px-3">Test Code</th>
                  <th className="py-2.5 px-3">Investigation Panel</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Specimen Tube</th>
                  <th className="py-2.5 px-3 text-center">TAT</th>
                  <th className="py-2.5 px-3 text-right">Standard MRP</th>
                  <th className="py-2.5 px-3 text-right">Doctor Net Rate</th>
                  <th className="py-2.5 px-3 text-right text-emerald-300">Incentive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTests.map((test, idx) => {
                  const incentive = Math.round(test.mrp * (commissionRate / 100));
                  const netRate = test.mrp - incentive;

                  return (
                    <tr key={test.code} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-600 text-[11px]">
                        {test.code}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {test.name}
                        <span className="block text-[10px] font-medium text-slate-400">
                          {test.fasting}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {test.dept}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] font-medium">
                        {test.specimen}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700 text-[11px]">
                        {test.tat}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-600">
                        ₹{test.mrp}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">
                        ₹{netRate}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        ₹{incentive} <span className="text-[10px] text-slate-400">({commissionRate}%)</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tariff Footer Note */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span>All investigations performed under stringent internal QC (Bio-Rad Unity) and EQAS (CMC Vellore / AIIMS).</span>
            <span className="font-mono">Central Laboratory Helpline: +91 98765 43210</span>
          </div>

        </div>

        {/* Modal Bottom Action Bar */}
        <div className="bg-white px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredTests.length} diagnostic investigations • Tariff verified for clinical compliance
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
