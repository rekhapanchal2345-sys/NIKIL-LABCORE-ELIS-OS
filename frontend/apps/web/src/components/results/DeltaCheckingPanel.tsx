"use client";

import React, { useState, useEffect, useCallback } from "react";

interface HistoricalResult {
  id: string;
  testDate: string;
  testName: string;
  parameterName: string;
  value: string;
  unit?: string;
  flag?: string;
}

interface DeltaCheckingPanelProps {
  patientId: string;
  parameterId: string;
  currentTestName: string;
  currentValue: string;
  currentUnit?: string;
}

export default function DeltaCheckingPanel({
  patientId,
  parameterId,
  currentTestName,
  currentValue,
  currentUnit,
}: DeltaCheckingPanelProps) {
  const [historicalResults, setHistoricalResults] = useState<HistoricalResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const fetchHistoricalResults = useCallback(async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll use mock data
      const mockHistorical: HistoricalResult[] = [
        {
          id: "hist-1",
          testDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          testName: currentTestName,
          parameterName: "Hemoglobin",
          value: "13.5",
          unit: "g/dL",
          flag: "NORMAL",
        },
        {
          id: "hist-2",
          testDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          testName: currentTestName,
          parameterName: "Hemoglobin",
          value: "14.2",
          unit: "g/dL",
          flag: "NORMAL",
        },
        {
          id: "hist-3",
          testDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          testName: currentTestName,
          parameterName: "Hemoglobin",
          value: "13.8",
          unit: "g/dL",
          flag: "NORMAL",
        },
      ];
      setHistoricalResults(mockHistorical);
    } catch (error) {
      console.error("Failed to fetch historical results:", error);
    } finally {
      setLoading(false);
    }
  }, [currentTestName]);

  useEffect(() => {
    if (showPanel) {
      fetchHistoricalResults();
    }
  }, [showPanel, fetchHistoricalResults]);

  const calculateDelta = (previous: string, current: string) => {
    const prevNum = parseFloat(previous);
    const currNum = parseFloat(current);
    if (Number.isNaN(prevNum) || Number.isNaN(currNum)) {
      return null;
    }
    const delta = currNum - prevNum;
    const percentage = (delta / prevNum) * 100;
    return {
      delta,
      percentage,
      isSignificant: Math.abs(percentage) > 20, // More than 20% change is significant
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDeltaColor = (delta: { delta: number; percentage: number; isSignificant: boolean } | null) => {
    if (!delta) return "text-gray-600";
    if (delta.isSignificant) {
      return delta.delta > 0 ? "text-red-600" : "text-green-600";
    }
    return "text-gray-600";
  };

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        View Historical Comparison
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Delta Checking - Historical Comparison</h3>
          <p className="mt-1 text-sm text-gray-600">
            Compare current result with previous test results to detect significant changes.
          </p>
        </div>
        <button
          onClick={() => setShowPanel(false)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          </div>
        ) : historicalResults.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>No historical results found for this parameter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Result */}
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-900">Current Result</p>
                  <p className="text-xs text-blue-700">{formatDate(new Date().toISOString())}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-900">
                    {currentValue} {currentUnit}
                  </p>
                  <p className="text-xs text-blue-700">{currentTestName}</p>
                </div>
              </div>
            </div>

            {/* Historical Results */}
            {historicalResults.map((result, index) => {
              const delta = calculateDelta(result.value, currentValue);
              return (
                <div
                  key={result.id}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Previous Result #{index + 1}
                      </p>
                      <p className="text-xs text-gray-600">{formatDate(result.testDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {result.value} {result.unit}
                      </p>
                      {delta && (
                        <p className={`text-sm ${getDeltaColor(delta)}`}>
                          {delta.delta > 0 ? "+" : ""}
                          {delta.delta.toFixed(2)} ({delta.percentage.toFixed(1)}%)
                          {delta.isSignificant && (
                            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                              Significant Change
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Interpretation */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-900">Interpretation</p>
              <p className="mt-2 text-sm text-gray-600">
                {historicalResults.some((result) => {
                  const delta = calculateDelta(result.value, currentValue);
                  return delta?.isSignificant;
                })
                  ? "Significant variation detected compared to previous results. Clinical correlation recommended."
                  : "Values are within expected range compared to historical data."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}