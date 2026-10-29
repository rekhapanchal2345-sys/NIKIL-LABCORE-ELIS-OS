import type { Approval } from "./ApprovalTable";

/** Queue definitions: what each quick filter asks the server for. */
export const QUEUES: Record<string, { status: string; filter: string }> = {
  pending: { status: "VERIFIED", filter: "" },
  pipeline: { status: "", filter: "pipeline" },
  critical: { status: "VERIFIED", filter: "critical" },
  abnormal: { status: "VERIFIED", filter: "abnormal" },
  normal: { status: "VERIFIED", filter: "normal" },
  rerun: { status: "ENTERED", filter: "" },
  approved: { status: "APPROVED", filter: "" },
};

/** Maps the URL (sidebar links, dashboard cards, triage desk) to a queue key. */
export function resolveQueueKey(filter: string | null, status: string | null): string {
  if (filter === "critical" || filter === "pipeline" || filter === "normal" || filter === "abnormal") return filter;
  if (status === "ENTERED") return "rerun";
  if (status === "APPROVED") return "approved";
  return "pending";
}

/** Converts one result returned by `/api/approvals/pending` into a worklist row. */
export function mapResultToApproval(result: any): Approval {
  const values: any[] = Array.isArray(result?.values) ? result.values : [];

  const abnormalCount = values.filter(
    (v) => v.flag === "HIGH" || v.flag === "LOW" || v.flag === "CRITICAL"
  ).length;

  const criticalValues: string[] = values
    .filter((v) => v.flag === "CRITICAL")
    .map((v) => v.parameter?.parameterName || "Parameter");

  const patient = result?.order?.patient;

  return {
    id: result.id,
    resultId: result.id,
    resultNumber: result.order?.orderNumber || `RES-${result.id}`,
    orderId: result.orderId,
    orderNumber: result.order?.orderNumber,
    barcode: result.order?.barcode,
    patientId: patient?.id,
    patientName: `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "Unknown patient",
    patientUhid: patient?.uhid,
    patientAge: patient?.age,
    patientGender: patient?.gender,
    testId: result.test?.id,
    testName: result.test?.testName,
    testCode: result.test?.testCode,
    submittedBy: result.enteredBy?.fullName,
    submittedAt: result.verifiedAt || result.createdAt,
    assignedPathologist: result.approvedBy?.fullName || "",
    approvedAt: result.approvedAt || undefined,
    status: result.status,
    abnormalCount,
    criticalValues,
  };
}
