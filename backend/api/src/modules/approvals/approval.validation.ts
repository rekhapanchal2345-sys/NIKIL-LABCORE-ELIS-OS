import { z } from "zod";

export const approvalIdSchema = z.object({
  id: z.string(),
});

export const approvalQuerySchema = z.object({
  orderId: z.string().optional(),
  search: z.string().optional(),
  filter: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  department: z.string().optional(),
  hasCritical: z.string().optional(),
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),
});

export const rejectApprovalSchema = z.object({
  remarks: z
    .string()
    .min(1)
    .max(2000),
});

export const batchApproveSchema = z.object({
  ids: z.array(z.string()).min(1),
  remarks: z.string().optional(),
});

export const criticalAckSchema = z.object({
  notifiedPerson: z.string().min(1, "Notified doctor/person name is required"),
  notifiedPersonContact: z.string().optional(),
  notificationMode: z.string().default("PHONE"),
  notificationTime: z.string().optional(),
  notes: z.string().optional(),
  readBackConfirmed: z.boolean().default(true),
});

export const amendResultSchema = z.object({
  amendmentReason: z.string().min(3, "Amendment reason is mandatory"),
  amendmentType: z
    .enum([
      "CLINICAL_CORRECTION",
      "TRANSCRIPTION_ERROR",
      "SAMPLE_RE_ASSAYED",
      "DILUTION_FACTOR_CORRECTED",
      "OTHER",
    ])
    .default("CLINICAL_CORRECTION"),
  updatedValues: z
    .array(
      z.object({
        parameterId: z.string(),
        value: z.string(),
        flag: z.string().optional(),
      })
    )
    .min(1, "At least one updated parameter value is required"),
  notes: z.string().optional(),
});

export const panicReadBackSchema = z.object({
  panicLogId: z.string(),
  notifiedDoctorName: z.string().min(1, "Doctor name is required"),
  doctorPhone: z.string().min(1, "Doctor phone is required"),
  readBackConfirmed: z.boolean().default(true),
  clinicalActionRemarks: z.string().min(1, "Clinical action remarks are required"),
  callTimestamp: z.string().optional(),
});