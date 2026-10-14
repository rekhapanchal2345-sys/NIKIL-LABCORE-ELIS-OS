import { z } from "zod";

export const createOrderSchema = z.object({
  patientId: z.string().cuid(),

  doctorId: z.string().cuid().optional(),

  notes: z.string().max(1000).optional(),

  items: z
    .array(
      z.object({
        itemType: z.enum(["TEST", "PACKAGE"]).default("TEST"),
        testId: z.string().cuid().optional(),
        packageId: z.string().cuid().optional(),

        discount: z.coerce
          .number()
          .min(0)
          .optional(),
      })
    )
    .min(1),
});

export const updateOrderSchema = z.object({
  notes: z.string().max(1000).optional(),

  orderStatus: z
    .enum([
      "DRAFT",
      "REGISTERED",
      "SAMPLE_COLLECTED",
      "PROCESSING",
      "COMPLETED",
      "CANCELLED",
    ])
    .optional(),

  doctorId: z.string().cuid().nullable().optional(),

  priority: z
    .enum(["ROUTINE", "URGENT", "STAT"])
    .optional(),
});

export const orderIdSchema = z.object({
  id: z.string().cuid(),
});

export const orderQuerySchema = z.object({
  search: z.string().optional(),

  patientId: z.string().optional(),

  doctorId: z.string().cuid().optional(),

  orderStatus: z
    .enum([
      "DRAFT",
      "REGISTERED",
      "SAMPLE_COLLECTED",
      "PROCESSING",
      "COMPLETED",
      "CANCELLED",
    ])
    .optional(),

  paymentStatus: z
    .enum([
      "PENDING",
      "PARTIAL",
      "PAID",
      "REFUNDED",
    ])
    .optional(),

  priority: z.enum(["ROUTINE", "URGENT", "STAT"]).optional(),

  collectionType: z.string().optional(),

  dateFrom: z.string().optional(),

  dateTo: z.string().optional(),

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

export const collectSampleSchema = z.object({
  barcode: z.string().optional(),
  collectionType: z.string().optional(),
  priority: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  collectedById: z.string().optional(),
  sampleQuality: z.string().optional(),
  sampleVolume: z.string().optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().max(500).optional(),
});