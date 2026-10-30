"use client";
import React from "react";
import { History, X, CheckCircle2 } from "lucide-react";

export function ResultHistoryModal({ isOpen, onClose, resultId, history = [] }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-sky-400" />
            <h3 className="text-sm font-bold">Immutable Result Audit Trail ({resultId})</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-3 max-h-[65vh] overflow-y-auto">
          {history.map((h: any, i: number) => (
            <div key={h.id || i} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{h.action}</span>
                  <span className="font-mono text-[11px] text-slate-500">{new Date(h.timestamp || Date.now()).toLocaleString("en-IN")}</span>
                </div>
                <div className="text-slate-600 mt-0.5">{h.details} — <strong>{h.performedBy}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default ResultHistoryModal;
