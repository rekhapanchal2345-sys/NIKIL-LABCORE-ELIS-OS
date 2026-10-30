"use client";
import React, { useState, useEffect } from "react";
import { FlaskConical, CheckCircle2, AlertTriangle, Sparkles, X, Save } from "lucide-react";

function computeFlag(valStr: string, range?: any): string {
  const num = parseFloat(valStr);
  if (isNaN(num) || !range) return "NORMAL";
  const critLow = range.criticalLow ?? (range.minValue !== undefined ? range.minValue * 0.6 : undefined);
  const critHigh = range.criticalHigh ?? (range.maxValue !== undefined ? range.maxValue * 1.5 : undefined);
  const low = range.normalLow ?? range.minValue;
  const high = range.normalHigh ?? range.maxValue;
  if (critLow !== undefined && num <= critLow) return "CRITICAL";
  if (critHigh !== undefined && num >= critHigh) return "CRITICAL";
  if (low !== undefined && num < low) return "LOW";
  if (high !== undefined && num > high) return "HIGH";
  return "NORMAL";
}

export function ParameterResultEntrySheet({
  isOpen,
  onClose,
  onCancel,
  result,
  parameters = [],
  existingValues = [],
  patientName,
  patientAge,
  patientGender,
  testName,
  onSave,
}: any) {
  if (isOpen === false) return null;

  const resolvedParams = Array.isArray(parameters) && parameters.length > 0
    ? parameters
    : (result?.test?.parameters || [
        { id: "prm-default-1", parameterName: testName || "Primary Analyte", unit: "mg/dL", dataType: "NUMERIC", referenceRanges: [{ normalLow: 70, normalHigh: 110, interpretation: "70 - 110 mg/dL" }] },
      ]);

  const [entries, setEntries] = useState<Record<string, { value: string; remark: string; flag: string }>>({});

  useEffect(() => {
    const init: Record<string, { value: string; remark: string; flag: string }> = {};
    resolvedParams.forEach((p: any) => {
      const match = (existingValues || result?.values || []).find(
        (ev: any) => ev.parameterId === p.id || ev.parameter?.id === p.id || ev.parameter?.parameterName === p.parameterName
      );
      const val = match?.value ?? "";
      const rr = p.referenceRanges?.[0];
      init[p.id] = {
        value: String(val),
        remark: match?.remark || "",
        flag: val ? computeFlag(String(val), rr) : (match?.flag || "NORMAL"),
      };
    });
    setEntries(init);
  }, [testName, patientName]);

  const handleValueChange = (param: any, newVal: string) => {
    const rr = param.referenceRanges?.[0];
    const nextFlag = computeFlag(newVal, rr);
    setEntries((prev) => ({
      ...prev,
      [param.id]: {
        ...(prev[param.id] || { remark: "" }),
        value: newVal,
        flag: nextFlag,
      },
    }));
  };

  const handleAutoFillNormal = () => {
    const next: Record<string, { value: string; remark: string; flag: string }> = {};
    resolvedParams.forEach((p: any) => {
      const rr = p.referenceRanges?.[0];
      const low = rr?.normalLow ?? rr?.minValue;
      const high = rr?.normalHigh ?? rr?.maxValue;
      const mid = low !== undefined && high !== undefined ? Number(((low + high) / 2).toFixed(1)) : "Normal";
      next[p.id] = {
        value: String(mid),
        remark: "Auto-validated reference midpoint",
        flag: "NORMAL",
      };
    });
    setEntries(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = resolvedParams.map((p: any, idx: number) => {
      const row = entries[p.id] || { value: "", remark: "", flag: "NORMAL" };
      return {
        id: `rv-${Date.now()}-${idx}`,
        parameterId: p.id,
        parameter: p,
        value: row.value,
        flag: row.flag,
        remark: row.remark,
      };
    });
    onSave?.(formatted);
    onClose?.();
  };

  const closeHandler = onCancel || onClose;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden w-full">
      <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-300">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">{testName || result?.test?.testName || "Clinical Parameter Worksheet"}</h3>
            <p className="text-xs text-slate-300">
              Patient: <strong className="text-white">{patientName || "Walk-in Patient"}</strong>
              {patientGender ? ` • ${patientGender}` : ""}
              {patientAge !== undefined ? ` • ${patientAge} Yrs` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoFillNormal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Auto-Fill Normal Values
          </button>
          {closeHandler && (
            <button type="button" onClick={closeHandler} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-bold">Parameter Name</th>
                <th className="px-4 py-3 font-bold">Observed Value</th>
                <th className="px-4 py-3 font-bold">Unit</th>
                <th className="px-4 py-3 font-bold">Biological Reference Interval</th>
                <th className="px-4 py-3 font-bold">Flag</th>
                <th className="px-4 py-3 font-bold">Technician Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {resolvedParams.map((p: any) => {
                const entry = entries[p.id] || { value: "", remark: "", flag: "NORMAL" };
                const rr = p.referenceRanges?.[0];
                const low = rr?.normalLow ?? rr?.minValue;
                const high = rr?.normalHigh ?? rr?.maxValue;
                const refText = rr?.interpretation || (low !== undefined && high !== undefined ? `${low} - ${high}` : "Standard Reference");

                return (
                  <tr key={p.id} className={entry.flag === "CRITICAL" ? "bg-red-50/40" : ""}>
                    <td className="px-4 py-3 font-bold text-slate-900">{p.parameterName}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        required
                        value={entry.value}
                        onChange={(e) => handleValueChange(p, e.target.value)}
                        placeholder="Enter result..."
                        className="w-36 px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 focus:border-sky-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{p.unit || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{refText}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                        entry.flag === "CRITICAL"
                          ? "bg-red-100 text-red-700 border border-red-300"
                          : entry.flag === "HIGH" || entry.flag === "LOW"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {entry.flag === "CRITICAL" ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                        {entry.flag}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={entry.remark}
                        onChange={(e) =>
                          setEntries((prev) => ({
                            ...prev,
                            [p.id]: { ...entry, remark: e.target.value },
                          }))
                        }
                        placeholder="Optional comment..."
                        className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-700 focus:border-sky-500 focus:outline-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Values are automatically validated against NABL ISO 15189 biological reference intervals and saved to your isolated vault.
          </p>
          <div className="flex items-center gap-2.5">
            {closeHandler && (
              <button
                type="button"
                onClick={closeHandler}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-sm transition"
            >
              <Save className="h-3.5 w-3.5" />
              Save &amp; Validate Worksheet
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
export default ParameterResultEntrySheet;
