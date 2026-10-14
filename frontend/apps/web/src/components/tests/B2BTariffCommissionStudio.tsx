"use client";

import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  FileText,
  Building2,
  ShieldCheck,
  Calculator,
  Download,
  Search,
  Sparkles,
  ArrowRight,
  Layers,
  Check,
  Info
} from "lucide-react";

interface TariffItem {
  id: string;
  testCode: string;
  testName: string;
  department: string;
  mrpPrice: number;
  campOfferPrice: number;
  b2bWholesaleRate: number;
  reagentCost: number;
  referralCommissionPercent: number;
  gstExempt: boolean;
}

const DEFAULT_TARIFF_ITEMS: TariffItem[] = [
  { id: "t-1", testCode: "CBC", testName: "Complete Blood Count (5-Part Diff)", department: "Hematology", mrpPrice: 350, campOfferPrice: 280, b2bWholesaleRate: 160, reagentCost: 45, referralCommissionPercent: 20, gstExempt: true },
  { id: "t-2", testCode: "LIPID", testName: "Comprehensive Lipid Profile", department: "Biochemistry", mrpPrice: 650, campOfferPrice: 499, b2bWholesaleRate: 320, reagentCost: 95, referralCommissionPercent: 20, gstExempt: true },
  { id: "t-3", testCode: "LFT", testName: "Liver Function Test Panel (11 Param)", department: "Biochemistry", mrpPrice: 700, campOfferPrice: 550, b2bWholesaleRate: 340, reagentCost: 110, referralCommissionPercent: 20, gstExempt: true },
  { id: "t-4", testCode: "KFT", testName: "Kidney Function Test & Electrolytes", department: "Biochemistry", mrpPrice: 750, campOfferPrice: 599, b2bWholesaleRate: 360, reagentCost: 115, referralCommissionPercent: 20, gstExempt: true },
  { id: "t-5", testCode: "HBA1C", testName: "Glycated Hemoglobin (HPLC Gold Std)", department: "Diabetes Screening", mrpPrice: 500, campOfferPrice: 400, b2bWholesaleRate: 260, reagentCost: 80, referralCommissionPercent: 15, gstExempt: true },
  { id: "t-6", testCode: "THYROID", testName: "Thyroid Panel (Total T3, T4, TSH)", department: "Immunology", mrpPrice: 600, campOfferPrice: 450, b2bWholesaleRate: 280, reagentCost: 90, referralCommissionPercent: 20, gstExempt: true },
  { id: "t-7", testCode: "VIT_D", testName: "Vitamin D (25-OH Total)", department: "Endocrinology", mrpPrice: 1200, campOfferPrice: 899, b2bWholesaleRate: 550, reagentCost: 180, referralCommissionPercent: 15, gstExempt: true },
  { id: "t-8", testCode: "VIT_B12", testName: "Vitamin B12 (Cyanocobalamin)", department: "Endocrinology", mrpPrice: 900, campOfferPrice: 699, b2bWholesaleRate: 420, reagentCost: 140, referralCommissionPercent: 15, gstExempt: true },
];

export default function B2BTariffCommissionStudio() {
  const [items, setItems] = useState<TariffItem[]>(DEFAULT_TARIFF_ITEMS);
  const [search, setSearch] = useState("");
  const [activeItem, setActiveItem] = useState<TariffItem>(DEFAULT_TARIFF_ITEMS[0]);
  
  // Custom interactive simulation state
  const [customMrp, setCustomMrp] = useState(activeItem.mrpPrice);
  const [customB2B, setCustomB2B] = useState(activeItem.b2bWholesaleRate);
  const [customReagent, setCustomReagent] = useState(activeItem.reagentCost);
  const [customCommPercent, setCustomCommPercent] = useState(activeItem.referralCommissionPercent);

  const handleSelectItem = (item: TariffItem) => {
    setActiveItem(item);
    setCustomMrp(item.mrpPrice);
    setCustomB2B(item.b2bWholesaleRate);
    setCustomReagent(item.reagentCost);
    setCustomCommPercent(item.referralCommissionPercent);
  };

  // Computations
  const doctorPayout = Math.round((customMrp * customCommPercent) / 100);
  const walkinLabMargin = customMrp - customReagent - doctorPayout;
  const walkinMarginPercent = Math.round((walkinLabMargin / customMrp) * 100);

  const b2bMargin = customB2B - customReagent;
  const b2bMarginPercent = Math.round((b2bMargin / customB2B) * 100);

  const filteredItems = items.filter((item) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        item.testName.toLowerCase().includes(q) ||
        item.testCode.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Light White Header Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                Financial Accounting &amp; Revenue Operations
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                0% GST Healthcare Exemption Verified
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Multi-Tier B2B Tariff &amp; Referral Doctor Commission Studio
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive margin calculation for patient walk-ins, B2B franchise collection centers, and referring doctor settlements without floating-point accounting errors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const headers = "Test Code,Investigation Name,Department,MRP,Camp Offer,B2B Wholesale,Reagent Cost,Doctor Comm %,GST Status\n";
                const rows = items.map(t => `"${t.testCode}","${t.testName}","${t.department}",${t.mrpPrice},${t.campOfferPrice},${t.b2bWholesaleRate},${t.reagentCost},${t.referralCommissionPercent}%,"0% Exempted"`).join("\n");
                const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `B2B_Tariff_Master_${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Rate Matrix (CSV)</span>
            </button>
          </div>
        </div>

        {/* GST Notification Strip */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Clinical Diagnostic Exemption:</strong> Services provided by clinical pathology laboratories are exempt from Goods &amp; Services Tax under <strong>Notification No. 12/2017-Central Tax (Rate)</strong>.
            </span>
          </div>
          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
            GST RATE: 0.00%
          </span>
        </div>
      </div>

      {/* Main Grid: Interactive Margin Studio + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Calculator */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <span className="text-[10px] font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {activeItem.testCode}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">{activeItem.testName}</h3>
            <p className="text-[11px] text-slate-500">{activeItem.department} • Interactive Yield Calculator</p>
          </div>

          {/* Sliders / Number inputs */}
          <div className="space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Patient Walk-in MRP (₹)</span>
                <span className="font-mono text-slate-900">₹{customMrp}</span>
              </div>
              <input
                type="range"
                min="100"
                max="3000"
                step="10"
                value={customMrp}
                onChange={(e) => setCustomMrp(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>B2B Franchise / Center Rate (₹)</span>
                <span className="font-mono text-slate-900">₹{customB2B}</span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="10"
                value={customB2B}
                onChange={(e) => setCustomB2B(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Reagent &amp; Consumables Cost (₹)</span>
                <span className="font-mono text-slate-900">₹{customReagent}</span>
              </div>
              <input
                type="range"
                min="10"
                max="800"
                step="5"
                value={customReagent}
                onChange={(e) => setCustomReagent(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Referring Doctor Commission (%)</span>
                <span className="font-mono text-slate-900">{customCommPercent}% (₹{doctorPayout})</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={customCommPercent}
                onChange={(e) => setCustomCommPercent(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>
          </div>

          {/* Result Margin Badges */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Walk-In Patient Net Yield
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-black text-slate-900 font-mono">₹{walkinLabMargin}</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {walkinMarginPercent}% Margin
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">After deducting ₹{customReagent} reagent &amp; ₹{doctorPayout} doctor incentive</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                B2B Center / Franchise Wholesale Yield
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-black text-indigo-700 font-mono">₹{b2bMargin}</span>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                  {b2bMarginPercent}% Margin
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Zero referral commission deducted for direct franchise samples</p>
            </div>
          </div>
        </div>

        {/* Right: Tariff Master Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tariff Directory &amp; B2B Price Matrix</h3>
              <p className="text-[11px] text-slate-500">Click any row to test in margin calculator</p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search investigation or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">Investigation</th>
                  <th className="p-3">MRP (₹)</th>
                  <th className="p-3">B2B Rate (₹)</th>
                  <th className="p-3">Doctor Comm</th>
                  <th className="p-3 text-right">Net Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isSelected = activeItem.id === item.id;
                  const net = item.mrpPrice - item.reagentCost - Math.round((item.mrpPrice * item.referralCommissionPercent) / 100);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className={`transition-colors cursor-pointer ${
                        isSelected ? "bg-blue-50/50 font-semibold" : "hover:bg-slate-50/70"
                      }`}
                    >
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.testName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {item.testCode} • {item.department}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        ₹{item.mrpPrice}
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-700">
                        ₹{item.b2bWholesaleRate}
                      </td>
                      <td className="p-3 font-mono text-emerald-700 font-bold">
                        {item.referralCommissionPercent}%
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        ₹{net}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
