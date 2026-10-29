"use client";
import React from "react";

export function PremiumEmptyState({ title = "No records found", description = "Try adjusting your search or filter criteria.", action }: any) {
  return (
    <div className="p-8 text-center bg-white rounded-xl border border-slate-200 space-y-2">
      <h4 className="text-base font-semibold text-slate-900">{title}</h4>
      <p className="text-sm text-slate-500">{description}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
export default PremiumEmptyState;
