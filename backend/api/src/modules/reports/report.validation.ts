import { z } from "zod";

// =======================================================
// ORDER REPORT
// =======================================================

export const orderReportSchema = z.object({
  orderId: z.string().cuid(),
});

// =======================================================
// PATIENT REPORTS
// =======================================================

export const patientReportSchema = z.object({
  patientId: z.string().cuid(),

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

// =======================================================
// REPORT QUERY
// =======================================================

export const reportQuerySchema = z.object({
  status: z
    .enum([
      "PENDING",
      "ENTERED",
      "VERIFIED",
      "APPROVED",
      "PUBLISHED",
    ])
    .optional(),

  fromDate: z
    .string()
    .optional(),

  toDate: z
    .string()
    .optional(),

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

// =======================================================
// PREMIUM REPORT ACTIONS VALIDATION
// =======================================================

export const addendumSchema = z.object({
  content: z.string().min(1).max(5000),
  reason: z.string().optional(),
  authorId: z.string().optional(),
  authorName: z.string().optional(),
  isPrivate: z.boolean().optional(),
});

export const signatureSchema = z.object({
  signatureData: z.string().min(1),
});

export const inlineApproveSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export const inlineRejectSchema = z.object({
  reason: z.string().min(1).max(1000),
});

export const shareLinkSchema = z.object({
  expiresIn: z.number().min(300).max(86400).optional(), // 5min to 24hrs
});

export const patientHistorySchema = z.object({
  notes: z.string().max(1000).optional(),
});

export const amendSchema = z.object({
  amendmentType: z
    .enum(["CORRECTION", "CLARIFICATION", "UPDATE", "OTHER"])
    .default("CORRECTION"),
  reason: z.string().min(1).max(1000),
});

export const sendDoctorSchema = z.object({
  doctorId: z.string().cuid(),
  channel: z.enum(["EMAIL", "WHATSAPP", "PRINT"]).default("EMAIL"),
});