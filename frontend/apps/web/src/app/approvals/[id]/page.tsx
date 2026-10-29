"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboardlayout";
import ApprovalDetails from "@/components/approvals/ApprovalDetails";
import ApprovalTimeline from "@/components/approvals/ApprovalTimeline";
import DeltaCheckViewer from "@/components/approvals/DeltaCheckViewer";
import { approvalApi } from "@/lib/api";
import { showError, showSuccess } from "@/lib/notifications";
import { ConfirmDialog, ReasonDialog } from "@/components/approvals/ApprovalDialogs";
import type { Approval } from "@/components/approvals/ApprovalTable";

export default function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [approval, setApproval] = useState<Approval | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultValue, setResultValue] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [referenceRange, setReferenceRange] = useState<string>("");
  const [interpretation, setInterpretation] = useState<string>("");
  const [comments, setComments] = useState<string>("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [laboratoryInfo, setLaboratoryInfo] = useState<any>(null);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [sampleInfo, setSampleInfo] = useState<any>(null);
  const [resultParameters, setResultParameters] = useState<any[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [signatureData, setSignatureData] = useState<any>(null);

  useEffect(() => {
    const fetchApprovalDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await approvalApi.getById(id);
        
        if (response.success && response.data) {
          const result = response.data;
          
          const transformedApproval: Approval = {
            id: result.id,
            resultId: result.id,
            resultNumber: result.order?.orderNumber || `RES-${result.id}`,
            patientId: result.order?.patient?.id,
            patientName: `${result.order?.patient?.firstName} ${result.order?.patient?.lastName}`,
            testId: result.test?.id,
            testName: result.test?.testName,
            testCode: result.test?.testCode,
            submittedBy: result.enteredBy?.fullName,
            submittedAt: result.verifiedAt || result.createdAt,
            approvedBy: result.approvedBy?.fullName,
            approvedAt: result.approvedAt,
            status: result.status === "VERIFIED" ? "Pending" : result.status,
          };
          
          setApproval(transformedApproval);
          
          // Set laboratory information
          setLaboratoryInfo({
            name: "LabCore Laboratory",
            address: "123 Healthcare Avenue, Medical District",
            phone: "+91-123-456-7890",
            email: "info@labcore.com",
            accreditation: "NABL Accredited",
          });

          // Set order information
          setOrderInfo({
            orderId: result.order?.id,
            accessionNumber: result.order?.orderNumber,
            orderDate: result.order?.createdAt,
            priority: result.order?.orderStatus || "Routine",
            referringDoctor: result.order?.doctor?.fullName || "Not specified",
          });

          // Set sample information if available
          if (result.order?.samples && result.order.samples.length > 0) {
            const sample = result.order.samples[0];
            setSampleInfo({
              sampleId: sample.sampleNumber,
              sampleType: sample.sampleType,
              collectionDate: sample.collectedAt,
              receivedDate: sample.receivedAt,
              sampleStatus: sample.status,
            });
          }

          // Set result parameters
          if (result.values && result.values.length > 0) {
            const parameters = result.values.map((value: any) => ({
              parameterName: value.parameter?.parameterName || "Unknown",
              result: value.value,
              unit: value.parameter?.unit || "",
              referenceRange: value.parameter?.referenceRanges?.[0]?.interpretation || "Not specified",
              flag: value.flag || "NORMAL",
            }));
            setResultParameters(parameters);
            
            // Set single result value for backward compatibility
            const firstValue = result.values[0];
            setResultValue(firstValue.value);
            setUnit(firstValue.parameter?.unit || "");
            setReferenceRange(firstValue.parameter?.referenceRanges?.[0]?.interpretation || "");
          }
          
          setInterpretation(result.interpretation || "");
          setComments(result.remarks || "");

          // Create timeline events
          const events = [];
          
          if (result.createdAt) {
            events.push({
              event: "Result Created",
              user: result.enteredBy?.fullName,
              date: result.createdAt,
              status: "PENDING",
            });
          }
          
          if (result.enteredAt) {
            events.push({
              event: "Result Entered",
              user: result.enteredBy?.fullName,
              date: result.enteredAt,
              status: "ENTERED",
            });
          }
          
          if (result.verifiedAt) {
            events.push({
              event: "Result Verified",
              user: result.enteredBy?.fullName,
              date: result.verifiedAt,
              status: "VERIFIED",
            });
          }
          
          if (result.approvedAt) {
            events.push({
              event: "Result Approved",
              user: result.approvedBy?.fullName,
              date: result.approvedAt,
              status: "APPROVED",
              comments: result.remarks,
            });
          }
          
          if (result.publishedAt) {
            events.push({
              event: "Result Published",
              user: result.approvedBy?.fullName,
              date: result.publishedAt,
              status: "PUBLISHED",
            });
          }
          
          if (result.status === "APPROVED" || result.status === "PUBLISHED") {
            try {
              const sigRes = await approvalApi.getSignature(id);
              if (sigRes?.data) {
                setSignatureData(sigRes.data);
              }
            } catch (sigErr) {
              console.warn("Signature fetch non-fatal:", sigErr);
            }
          }

          setTimelineEvents(events);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch approval details");
      } finally {
        setLoading(false);
      }
    };

    fetchApprovalDetails();
  }, [id]);

  const handleApprove = async () => {
    if (!approval) return;
    setShowApproveConfirm(true);
  };

  const handleApproveConfirm = async () => {
    if (!approval) return;
    setActionBusy(true);
    try {
      const response = await approvalApi.approve(String(approval.resultId), {});
      if (!response?.success) throw new Error(response?.message || "Approval failed");
      showSuccess("Result approved and signed.");
      router.push("/approvals");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to approve the result.");
    } finally {
      setActionBusy(false);
      setShowApproveConfirm(false);
    }
  };

  const handleReject = async () => {
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!approval) return;
    setActionBusy(true);
    try {
      const response = await approvalApi.reject(String(approval.resultId), { remarks: reason });
      if (!response?.success) throw new Error(response?.message || "The result could not be returned.");
      showSuccess("Result sent back for correction.");
      router.push("/approvals");
    } catch (err) {
      showError(err instanceof Error ? err.message : "The result could not be returned.");
    } finally {
      setActionBusy(false);
      setShowRejectDialog(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <DashboardLayout title="Approval Details">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900 mx-auto" />
            <p className="text-sm text-gray-600">Loading approval details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !approval) {
    return (
      <DashboardLayout title="Approval Details">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            {error || "Approval not found"}
          </p>
          <button
            onClick={() => router.push("/approvals")}
            className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Back to Approvals
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Approval Details">
      <div className="space-y-6">
        <button
          onClick={() => router.push("/approvals")}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to approvals
        </button>

        <DeltaCheckViewer resultId={id} />

        <ApprovalDetails
          approval={approval}
          resultValue={resultValue}
          unit={unit}
          referenceRange={referenceRange}
          interpretation={interpretation}
          comments={comments}
          laboratoryInfo={laboratoryInfo}
          orderInfo={orderInfo}
          sampleInfo={sampleInfo}
          resultParameters={resultParameters}
          signatureData={signatureData}
          onApprove={handleApprove}
          onReject={handleReject}
          onPrint={handlePrint}
        />

        <ApprovalTimeline events={timelineEvents} />

        <ConfirmDialog
          open={showApproveConfirm}
          title="Approve this result?"
          confirmLabel="Approve & sign"
          busy={actionBusy}
          description="The result will be signed with your electronic seal and released for reporting."
          onConfirm={handleApproveConfirm}
          onCancel={() => !actionBusy && setShowApproveConfirm(false)}
        />

        <ReasonDialog
          open={showRejectDialog}
          tone="danger"
          title="Reject result"
          confirmLabel="Reject result"
          label="Reason for rejection"
          description="The reason is shown to the technician and kept in the audit trail."
          busy={actionBusy}
          onConfirm={handleRejectConfirm}
          onCancel={() => !actionBusy && setShowRejectDialog(false)}
        />
      </div>
    </DashboardLayout>
  );
}