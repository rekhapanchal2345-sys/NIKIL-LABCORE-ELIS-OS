"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AlertTriangle, ArrowUp, ArrowDown, CheckCircle, X } from "lucide-react";
import { ResultFlagBadge } from "./PremiumStatusBadge";

interface Parameter {
  id: string;
  parameterName: string;
  shortName?: string;
  unit?: string;
  dataType: string;
  decimalPrecision?: number;
  referenceRanges?: Array<{
    id: string;
    gender?: string;
    minAge?: number;
    maxAge?: number;
    minAgeInHours?: number;
    maxAgeInHours?: number;
    minAgeInDays?: number;
    maxAgeInDays?: number;
    criticalLow?: number;
    normalLow?: number;
    normalHigh?: number;
    criticalHigh?: number;
  }>;
}

interface ResultValue {
  parameterId: string;
  value: string;
  flag?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  remark?: string;
}

interface SmartResultEntryGridProps {
  parameters: Parameter[];
  initialValues?: ResultValue[];
  patientAge?: number;
  patientAgeInDays?: number;
  patientAgeInHours?: number;
  patientDob?: string | Date;
  patientGender?: string;
  onSave: (values: ResultValue[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const SmartResultEntryGrid: React.FC<SmartResultEntryGridProps> = ({
  parameters,
  initialValues = [],
  patientAge,
  patientAgeInDays,
  patientAgeInHours,
  patientDob,
  patientGender,
  onSave,
  onCancel,
  loading = false,
}) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<Record<string, ResultFlag>>({});
  const [criticalValues, setCriticalValues] = useState<Set<string>>(new Set());
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  const [pendingCriticalParameter, setPendingCriticalParameter] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  type ResultFlag = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

  // Initialize values from initialValues
  useEffect(() => {
    const initialValuesMap: Record<string, string> = {};
    const initialFlagsMap: Record<string, ResultFlag> = {};
    
    initialValues.forEach((iv) => {
      initialValuesMap[iv.parameterId] = iv.value;
      if (iv.flag) {
        initialFlagsMap[iv.parameterId] = iv.flag;
      }
    });
    
    setValues(initialValuesMap);
    setFlags(initialFlagsMap);
  }, [initialValues]);

  // Helper to calculate exact neonatal age metrics
  const getAgeMetrics = useCallback(() => {
    if (patientDob) {
      const dobDate = new Date(patientDob);
      if (!isNaN(dobDate.getTime())) {
        const now = new Date();
        const diffMs = Math.max(0, now.getTime() - dobDate.getTime());
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const years = Math.floor(days / 365.25);
        return { hours, days, years: patientAge ?? years };
      }
    }
    return {
      hours: patientAgeInHours ?? (patientAgeInDays ? patientAgeInDays * 24 : (patientAge ? patientAge * 365 * 24 : undefined)),
      days: patientAgeInDays ?? (patientAge ? patientAge * 365 : undefined),
      years: patientAge
    };
  }, [patientAge, patientAgeInDays, patientAgeInHours, patientDob]);

  // Calculate flag based on value and reference range (with neonatal exact hour/day support)
  const calculateFlag = useCallback((
    value: string,
    parameter: Parameter
  ): ResultFlag => {
    if (!value || parameter.dataType !== "NUMERIC") {
      return "NORMAL";
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      return "NORMAL";
    }

    const { hours, days, years } = getAgeMetrics();

    // Find appropriate reference range based on neonatal hours/days, age, and gender
    const applicableRange = parameter.referenceRanges?.find(range => {
      if (range.gender && range.gender !== patientGender) {
        return false;
      }
      // Bug 1.3: Neonatal hour-specific lookup
      if (range.minAgeInHours != null || range.maxAgeInHours != null) {
        if (hours === undefined) return false;
        if (range.minAgeInHours != null && hours < range.minAgeInHours) return false;
        if (range.maxAgeInHours != null && hours > range.maxAgeInHours) return false;
        return true;
      }
      // Neonatal day-specific lookup
      if (range.minAgeInDays != null || range.maxAgeInDays != null) {
        if (days === undefined) return false;
        if (range.minAgeInDays != null && days < range.minAgeInDays) return false;
        if (range.maxAgeInDays != null && days > range.maxAgeInDays) return false;
        return true;
      }
      // Standard year lookup
      if (range.minAge && years && years < range.minAge) {
        return false;
      }
      if (range.maxAge && years && years > range.maxAge) {
        return false;
      }
      return true;
    }) || parameter.referenceRanges?.[0];

    if (!applicableRange) {
      return "NORMAL";
    }

    const { criticalLow, normalLow, normalHigh, criticalHigh } = applicableRange;

    if (criticalHigh && numericValue >= criticalHigh) {
      return "CRITICAL";
    }
    if (criticalLow && numericValue <= criticalLow) {
      return "CRITICAL";
    }
    if (normalHigh && numericValue > normalHigh) {
      return "HIGH";
    }
    if (normalLow && numericValue < normalLow) {
      return "LOW";
    }

    return "NORMAL";
  }, [patientAge, patientGender, getAgeMetrics]);

  // Handle value change with auto-flagging
  const handleValueChange = (parameterId: string, newValue: string) => {
    const parameter = parameters.find(p => p.id === parameterId);
    if (!parameter) return;

    setValues(prev => ({ ...prev, [parameterId]: newValue }));

    // Calculate flag immediately
    const newFlag = calculateFlag(newValue, parameter);
    setFlags(prev => ({ ...prev, [parameterId]: newFlag }));

    // Handle critical value
    if (newFlag === "CRITICAL") {
      setCriticalValues(prev => new Set([...prev, parameterId]));
      setPendingCriticalParameter(parameterId);
      setShowCriticalModal(true);
    } else {
      setCriticalValues(prev => {
        const newSet = new Set(prev);
        newSet.delete(parameterId);
        return newSet;
      });
    }
  };

  // Handle rapid keypad grid navigation (Bug 6.2: Enter / Arrow navigation without premature submit)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, parameterId: string, index: number) => {
    switch (e.key) {
      case "Tab":
        break;
      case "Enter":
      case "ArrowDown":
        e.preventDefault();
        if (index < parameters.length - 1) {
          inputRefs.current[index + 1]?.focus();
          inputRefs.current[index + 1]?.select();
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (index > 0) {
          inputRefs.current[index - 1]?.focus();
          inputRefs.current[index - 1]?.select();
        }
        break;
    }
  };

  // Handle paste from clipboard (multi-value paste)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, parameterId: string) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const pastedValues = pastedText.split(/[\t\n,]+/).map(v => v.trim()).filter(v => v);

    if (pastedValues.length > 1) {
      // Multi-value paste - distribute across parameters
      const parameterIds = parameters.map(p => p.id);
      const startIndex = parameterIds.indexOf(parameterId);
      
      const newValues: Record<string, string> = { ...values };
      
      pastedValues.forEach((value, index) => {
        const targetIndex = startIndex + index;
        if (targetIndex < parameterIds.length) {
          const targetParameterId = parameterIds[targetIndex];
          const parameter = parameters.find(p => p.id === targetParameterId);
          if (parameter) {
            newValues[targetParameterId] = value;
            const newFlag = calculateFlag(value, parameter);
            setFlags(prev => ({ ...prev, [targetParameterId]: newFlag }));
          }
        }
      });
      
      setValues(newValues);
    } else {
      // Single value paste
      setValues(prev => ({ ...prev, [parameterId]: pastedText }));
    }
  };

  // Handle save
  const handleSave = () => {
    if (criticalValues.size > 0) {
      setShowCriticalModal(true);
      return;
    }

    const resultValues: ResultValue[] = parameters.map(parameter => ({
      parameterId: parameter.id,
      value: values[parameter.id] || "",
      flag: flags[parameter.id] || "NORMAL",
      remark: "",
    }));

    onSave(resultValues);
  };

  // Handle critical acknowledgment
  const handleCriticalAcknowledge = () => {
    // Here you would call the critical acknowledgment API
    setCriticalValues(new Set());
    setShowCriticalModal(false);
    setPendingCriticalParameter(null);
    handleSave();
  };

  // Get reference range display
  const getReferenceRangeDisplay = (parameter: Parameter): string => {
    const applicableRange = parameter.referenceRanges?.find(range => {
      if (range.gender && range.gender !== patientGender) {
        return false;
      }
      if (range.minAge && patientAge && patientAge < range.minAge) {
        return false;
      }
      if (range.maxAge && patientAge && patientAge > range.maxAge) {
        return false;
      }
      return true;
    }) || parameter.referenceRanges?.[0];

    if (!applicableRange) {
      return "N/A";
    }

    const { normalLow, normalHigh, criticalLow, criticalHigh } = applicableRange;
    
    if (normalLow !== undefined && normalHigh !== undefined) {
      return `${normalLow} - ${normalHigh}`;
    }
    return "N/A";
  };

  return (
    <div className="space-y-4" ref={gridRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Result Entry</h3>
          <p className="text-sm text-gray-500">
            Enter values and auto-flagging will calculate status automatically
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Results"}
          </button>
        </div>
      </div>

      {/* Entry Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                Parameter
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Unit
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                Reference Range
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {parameters.map((parameter, index) => {
              const value = values[parameter.id] || "";
              const flag = flags[parameter.id] || "NORMAL";
              const isCritical = flag === "CRITICAL";

              return (
                <tr
                  key={parameter.id}
                  className={`hover:bg-gray-50 ${isCritical ? "bg-red-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {parameter.shortName || parameter.parameterName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {parameter.parameterName}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      data-parameter-id={parameter.id}
                      value={value}
                      onChange={(e) => handleValueChange(parameter.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, parameter.id, index)}
                      onPaste={(e) => handlePaste(e, parameter.id)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isCritical
                          ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-blue-500"
                      }`}
                      placeholder={parameter.dataType === "NUMERIC" ? "0.00" : "Enter value"}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {parameter.unit || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {getReferenceRangeDisplay(parameter)}
                  </td>
                  <td className="px-4 py-3">
                    <ResultFlagBadge flag={flag} size="sm" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Critical Value Acknowledgment Modal */}
      {showCriticalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Critical Value Detected
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  You have entered a critical value. Before proceeding, you must acknowledge
                  that the appropriate notification has been made.
                </p>
                
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Person Notified *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Name of person notified"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Method *
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select method</option>
                      <option value="phone">Phone Call</option>
                      <option value="email">Email</option>
                      <option value="in_person">In Person</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Additional notes about the notification"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCriticalModal(false);
                  setPendingCriticalParameter(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCriticalAcknowledge}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Acknowledge & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};