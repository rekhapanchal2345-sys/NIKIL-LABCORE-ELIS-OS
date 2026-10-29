"use client";
import React from "react";

export function SampleOrderOfDrawGuide(props: any) {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200">
      <h4 className="text-sm font-semibold text-slate-900">CLSI GP41 Order of Draw Reference</h4>
      <p className="text-xs text-slate-500 mt-1">1. Blood Culture → 2. Citrate (Blue) → 3. SST/Serum (Gold/Red) → 4. Heparin (Green) → 5. EDTA (Lavender) → 6. Fluoride (Grey)</p>
    </div>
  );
}
export default SampleOrderOfDrawGuide;
