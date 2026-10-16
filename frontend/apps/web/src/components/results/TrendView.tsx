"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from "recharts";
import { TrendingUp, Calendar, Download, RefreshCw } from "lucide-react";

interface TrendDataPoint {
  date: string;
  value: number;
  resultId: string;
  orderNumber: string;
  status: string;
}

interface TrendViewProps {
  patientId: string;
  testCode: string;
  testParameterName: string;
  unit: string;
  referenceRange?: {
    min: number;
    max: number;
    criticalMin?: number;
    criticalMax?: number;
  };
}

export const TrendView: React.FC<TrendViewProps> = ({
  patientId,
  testCode,
  testParameterName,
  unit,
  referenceRange,
}) => {
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrendData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") || localStorage.getItem("token")
          : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Call the trend endpoint
      const response = await fetch(
        `/api/results/trend/${patientId}/${testCode}?limit=20`,
        { headers }
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch trend data");
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Transform the data to match our interface
        const transformedData: TrendDataPoint[] = data.data.map((result: any) => {
          // Find the specific parameter value
          const parameterValue = result.values?.find((v: any) => 
            v.parameter?.parameterName === testParameterName
          );
          
          return {
            date: result.approvedAt || result.createdAt,
            value: parseFloat(parameterValue?.value) || 0,
            resultId: result.id,
            orderNumber: result.order?.orderNumber,
            status: result.status,
          };
        });

        setTrendData(transformedData);
      }
    } catch (err) {
      console.error("Failed to fetch trend data:", err);
      setError("Failed to load trend data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [patientId, testCode, testParameterName]);

  useEffect(() => {
    fetchTrendData();
  }, [fetchTrendData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  };

  const exportTrendData = () => {
    const csvContent = [
      ["Date", "Value", "Unit", "Order Number", "Status"],
      ...trendData.map(d => [
        formatDate(d.date),
        d.value,
        unit || "",
        d.orderNumber,
        d.status,
      ]),
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${testParameterName}_trend_${patientId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading trend data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button
            onClick={fetchTrendData}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (trendData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No trend data available</p>
          <p className="text-xs text-gray-400 mt-1">
            Historical results will appear here once available
          </p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = trendData.map(d => ({
    date: formatDate(d.date),
    value: d.value,
    resultId: d.resultId,
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {testParameterName} Trend
          </h3>
          <p className="text-sm text-gray-500">
            Historical values over time
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchTrendData}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={exportTrendData}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{ value: unit, angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value: number) => [value.toFixed(2), unit]}
            />
            
            {/* Reference range band */}
            {referenceRange && (
              <>
                <ReferenceArea
                  y1={referenceRange.min}
                  y2={referenceRange.max}
                  fill="rgba(16, 185, 129, 0.1)"
                  stroke="none"
                />
                {/* Critical thresholds */}
                {referenceRange.criticalMin && (
                  <ReferenceArea
                    y1={0}
                    y2={referenceRange.criticalMin}
                    fill="rgba(220, 38, 38, 0.1)"
                    stroke="none"
                  />
                )}
                {referenceRange.criticalMax && (
                  <ReferenceArea
                    y1={referenceRange.criticalMax}
                    y2={Math.max(...chartData.map(d => d.value)) * 1.1}
                    fill="rgba(220, 38, 38, 0.1)"
                    stroke="none"
                  />
                )}
              </>
            )}
            
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0284c7"
              strokeWidth={2}
              dot={{ fill: "#0284c7", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Reference Range Legend */}
      {referenceRange && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded" />
            <span className="text-gray-600">Normal Range: {referenceRange.min} - {referenceRange.max}</span>
          </div>
          {referenceRange.criticalMin && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded" />
              <span className="text-gray-600">Critical: &lt;{referenceRange.criticalMin}</span>
            </div>
          )}
          {referenceRange.criticalMax && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded" />
              <span className="text-gray-600">Critical: &gt;{referenceRange.criticalMax}</span>
            </div>
          )}
        </div>
      )}

      {/* Data Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Value
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Unit
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Order
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {trendData.map((point, index) => (
              <tr key={point.resultId} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-900">
                  {formatDate(point.date)}
                </td>
                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                  {point.value.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {unit || "—"}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {point.orderNumber}
                </td>
                <td className="px-4 py-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    point.status === "APPROVED" || point.status === "PUBLISHED"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {point.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};