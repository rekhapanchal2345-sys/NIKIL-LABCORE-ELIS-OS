"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { resultApi } from "@/lib/api";
import ResultPrintTemplate from "@/components/results/ResultPrintTemplate";

interface ResultData {
  id: string;
  orderId: string;
  testId: string;
  status: string;
  remarks?: string;
  interpretation?: string;
  enteredAt?: string;
  verifiedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  test: {
    id: string;
    testCode: string;
    testName: string;
    sampleType: string;
    method?: string;
    category?: {
      id: string;
      code: string;
      name: string;
    };
    parameters: Array<{
      id: string;
      parameterName: string;
      unit?: string;
      dataType: string;
      referenceRanges: Array<{
        id: string;
        gender?: string;
        minAge?: number;
        maxAge?: number;
        criticalLow?: number;
        normalLow?: number;
        normalHigh?: number;
        criticalHigh?: number;
        interpretation?: string;
      }>;
    }>;
  };
  order: {
    id: string;
    orderNumber: string;
    barcode: string;
    orderStatus: string;
    paymentStatus: string;
    createdAt: string;
    notes?: string;
    patient: {
      id: string;
      uhid: string;
      firstName: string;
      lastName: string;
      gender: string;
      dateOfBirth?: string;
      age?: number;
      phone?: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
    doctor?: {
      id: string;
      doctorCode: string;
      fullName: string;
      qualification?: string;
      specialization?: string;
      phone?: string;
      email?: string;
      clinicName?: string;
      address?: string;
    };
  };
  enteredBy?: {
    id: string;
    employeeCode: string;
    fullName: string;
    role: string;
  };
  approvedBy?: {
    id: string;
    employeeCode: string;
    fullName: string;
    role: string;
  };
  values: Array<{
    id: string;
    value: string;
    flag?: string;
    remark?: string;
    parameter: {
      id: string;
      parameterName: string;
      unit?: string;
      dataType: string;
    };
  }>;
}

export default function ResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPrintTemplate, setShowPrintTemplate] = useState(false);

  const { id } = use(params);

  const fetchResult = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await resultApi.getById(id);
      
      if (response.success && response.data) {
        setResult(response.data as ResultData);
      } else {
        setError("Result not found");
      }
    } catch (err) {
      console.error("Failed to fetch result:", err);
      setError("Failed to load result. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  const handleVerify = async () => {
    if (!confirm("Are you sure you want to verify this result?")) return;

    try {
      setVerifying(true);
      const response = await resultApi.verify(id);
      if (response.success) {
        fetchResult();
      }
    } catch (err) {
      console.error("Failed to verify result:", err);
      alert("Failed to verify result. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this result? This action will finalize the result.")) return;

    try {
      setApproving(true);
      const response = await resultApi.approve(id);
      if (response.success) {
        fetchResult();
      }
    } catch (err) {
      console.error("Failed to approve result:", err);
      alert("Failed to approve result. Please try again.");
    } finally {
      setApproving(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm("Are you sure you want to publish this result?")) return;

    try {
      setPublishing(true);
      const response = await resultApi.publish(id);
      if (response.success) {
        fetchResult();
      }
    } catch (err) {
      console.error("Failed to publish result:", err);
      alert("Failed to publish result. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  const handlePrint = () => {
    if (result) {
      setShowPrintTemplate(true);
    }
  };

  const getStatusColor = (status: string) => {
    const value = status?.toLowerCase();
    switch (value) {
      case "approved":
      case "published":
        return "bg-green-50 text-green-700";
      case "verified":
        return "bg-blue-50 text-blue-700";
      case "entered":
        return "bg-yellow-50 text-yellow-700";
      case "pending":
        return "bg-gray-50 text-gray-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const getFlagColor = (flag?: string) => {
    if (!flag) return "bg-gray-50 text-gray-700";
    switch (flag) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-50 text-orange-700";
      case "LOW":
        return "bg-yellow-50 text-yellow-700";
      case "NORMAL":
        return "bg-green-50 text-green-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return "—";
    const birth = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  if (loading) {
    return (
      <DashboardLayout title="Result Details">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading result details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !result) {
    return (
      <DashboardLayout title="Result Details">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-red-800">{error || "Result not found"}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const patientName = `${result.order.patient.firstName} ${result.order.patient.lastName}`;
  const patientAge = result.order.patient.age || calculateAge(result.order.patient.dateOfBirth);

  return (
    <DashboardLayout title="Result Details">
      <div className="space-y-6" id="result-report">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Result Details</h1>
            <p className="mt-1 text-sm text-gray-500">
              {result.order.orderNumber} • {result.test.testName}
            </p>
          </div>
          <div className="flex gap-2 no-print">
            <button
              onClick={() => router.back()}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            {result.status === "ENTERED" && (
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {verifying ? "Verifying..." : "Verify"}
              </button>
            )}
            {result.status === "VERIFIED" && (
              <button
                onClick={handleApprove}
                disabled={approving}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {approving ? "Approving..." : "Approve"}
              </button>
            )}
            {result.status === "APPROVED" && (
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {publishing ? "Publishing..." : "Publish"}
              </button>
            )}
            <button
              onClick={handlePrint}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Print
            </button>
          </div>
        </div>

        {/* Laboratory Information */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 lab-header">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">LabCore Diagnostics</h2>
              <p className="mt-1 text-sm text-gray-600">Enterprise Laboratory Information System</p>
              <p className="mt-2 text-xs text-gray-500">NABL Accredited • ISO 15189 Certified</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Report ID</p>
              <p className="mt-1 text-sm font-mono font-medium text-gray-900">{result.id}</p>
              <p className="mt-1 text-xs text-gray-500">Accession: {result.order.orderNumber}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</p>
                <p className="mt-1">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(result.status)}`}>
                    {result.status}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Report Date</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(result.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Patient Name</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{patientName}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Patient ID</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{result.order.patient.uhid}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Age/Gender</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{patientAge} yrs / {result.order.patient.gender}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Phone</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{result.order.patient.phone || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{result.order.patient.email || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Address</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {[result.order.patient.address, result.order.patient.city, result.order.patient.state, result.order.patient.pincode]
                  .filter(Boolean).join(", ") || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Referring Doctor */}
        {result.order.doctor && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Referring Doctor</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Doctor Name</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{result.order.doctor.fullName}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Qualification</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{result.order.doctor.qualification || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Specialization</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{result.order.doctor.specialization || "—"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Information */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Order Number</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{result.order.orderNumber}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Barcode</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{result.order.barcode}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Order Date</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(result.order.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Order Status</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{result.order.orderStatus}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Payment Status</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{result.order.paymentStatus}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Clinical Notes</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{result.order.notes || "—"}</p>
            </div>
          </div>
        </div>

        {/* Test Information */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Test Name</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{result.test.testName}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Test Code</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{result.test.testCode}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Sample Type</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{result.test.sampleType}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Method</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{result.test.method || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Category</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{result.test.category?.name || "—"}</p>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h2>
          
          {/* Result Summary */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Parameters</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{result.values.length}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-green-600">Normal</p>
              <p className="mt-2 text-2xl font-bold text-green-700">
                {result.values.filter(v => v.flag === "NORMAL" || !v.flag).length}
              </p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-yellow-600">Abnormal</p>
              <p className="mt-2 text-2xl font-bold text-yellow-700">
                {result.values.filter(v => v.flag === "HIGH" || v.flag === "LOW").length}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-red-600">Critical</p>
              <p className="mt-2 text-2xl font-bold text-red-700">
                {result.values.filter(v => v.flag === "CRITICAL").length}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Parameter</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Result</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Reference Range</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Flag</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {result.values.map((value) => (
                  <tr key={value.id} className={`hover:bg-gray-50 ${value.flag === "CRITICAL" ? "bg-red-50" : ""}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {value.parameter.parameterName}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {value.value}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {value.parameter.unit || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(() => {
                        const param = result.test.parameters.find(p => p.id === value.parameter.id);
                        if (!param || !param.referenceRanges.length) return "—";
                        const range = param.referenceRanges[0];
                        if (range.normalLow !== undefined && range.normalHigh !== undefined) {
                          return `${range.normalLow} - ${range.normalHigh}`;
                        }
                        return range.interpretation || "—";
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      {value.flag && (
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getFlagColor(value.flag)}`}>
                          {value.flag}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {value.remark || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interpretation and Remarks */}
        {(result.interpretation || result.remarks) && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Interpretation & Remarks</h2>
            {result.interpretation && (
              <div className="mb-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">Interpretation</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.interpretation}</p>
              </div>
            )}
            {result.remarks && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">Remarks</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.remarks}</p>
              </div>
            )}
          </div>
        )}

        {/* Workflow Timeline */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Result Workflow Timeline</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-sm font-bold">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Order Created</p>
                <p className="text-xs text-gray-500">{formatDate(result.order.createdAt)}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-sm font-bold">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Result Entered</p>
                <p className="text-xs text-gray-500">
                  {result.enteredBy?.fullName || "—"} ({result.enteredBy?.employeeCode || "—"})
                </p>
                <p className="text-xs text-gray-500">{formatDate(result.enteredAt)}</p>
              </div>
            </div>

            {result.verifiedAt && (
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 text-sm font-bold">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Result Verified</p>
                  <p className="text-xs text-gray-500">{formatDate(result.verifiedAt)}</p>
                </div>
              </div>
            )}

            {result.approvedAt && (
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 text-sm font-bold">4</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Result Approved</p>
                  <p className="text-xs text-gray-500">
                    {result.approvedBy?.fullName || "—"} ({result.approvedBy?.employeeCode || "—"})
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(result.approvedAt)}</p>
                </div>
              </div>
            )}

            {result.publishedAt && (
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-sm font-bold">5</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Result Published</p>
                  <p className="text-xs text-gray-500">{formatDate(result.publishedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Report Generated</p>
              <p className="mt-1 text-sm text-gray-900">{formatDate(result.updatedAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">LabCore ELIS</p>
              <p className="mt-1 text-sm text-gray-900">Enterprise Laboratory Information System</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          #result-report {
            background: white !important;
            padding: 0 !important;
          }
          .rounded-xl {
            border-radius: 0 !important;
            box-shadow: none !important;
            border: 1px solid #000 !important;
            margin-bottom: 20px !important;
          }
          .border-gray-200 {
            border-color: #000 !important;
          }
          .bg-white {
            background: white !important;
          }
          .bg-gray-50 {
            background: #f9f9f9 !important;
          }
          .text-gray-900 {
            color: black !important;
          }
          .text-gray-700 {
            color: #333 !important;
          }
          .text-gray-600 {
            color: #666 !important;
          }
          .text-gray-500 {
            color: #888 !important;
          }
          .text-blue-600, .text-green-600, .text-purple-600 {
            color: black !important;
          }
          .shadow-sm {
            box-shadow: none !important;
          }
          .lab-header {
            border-bottom: 2px solid #000 !important;
            padding: 20px !important;
          }
          h1, h2, h3 {
            color: black !important;
          }
          @page {
            margin: 1cm;
            size: A4;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>

      {/* Print Template */}
      {showPrintTemplate && result && (
        <ResultPrintTemplate
          result={result}
          onClose={() => setShowPrintTemplate(false)}
        />
      )}
    </DashboardLayout>
  );
}