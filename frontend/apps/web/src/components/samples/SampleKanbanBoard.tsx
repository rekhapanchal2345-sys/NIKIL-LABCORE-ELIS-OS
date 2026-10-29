"use client";
import React from "react";

export function SampleKanbanBoard({ samples = [] }: any) {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200">
      <h4 className="text-sm font-semibold text-slate-900">Specimen Workflow Kanban ({samples.length})</h4>
      <p className="text-xs text-slate-500 mt-1">Pending Collection → Collected → In Lab → Completed</p>
    </div>
  );
}
export default SampleKanbanBoard;
