"use client";
import React from "react";

export function TestsNavigationHeader({ activeTab, onTabChange }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Diagnostic Test Directory & Assay Catalog</h2>
        <p className="text-xs text-slate-500">NABL 15189 standardized test master, reference intervals, and vacutainer mappings</p>
      </div>
    </div>
  );
}
export default TestsNavigationHeader;
