import { z } from 'zod';

export const consolidateOrderTubesSchema = z.object({
  orderId: z.string().min(1, 'orderId is required'),
});

export const collectTubeWithQnsSchema = z.object({
  tubeId: z.string().min(1, 'Valid tubeId is required'),
  collectedVolumeMl: z.number().positive('Collected volume must be positive'),
  qnsOverrideReason: z.string().optional(),
});

export const centrifugeTubeSchema = z.object({
  tubeId: z.string().min(1, 'Valid tubeId is required'),
  centrifugeSpeedRpm: z.number().int().min(1000).max(6000),
  centrifugeDurationMin: z.number().int().min(3).max(30),
  isDecapped: z.boolean(),
  hemolysisIndex: z.number().min(0).optional(),
  icterusIndex: z.number().min(0).optional(),
  lipemiaIndex: z.number().min(0).optional(),
});

export const splitAliquotsSchema = z.object({
  parentTubeId: z.string().min(1, 'Valid parentTubeId is required'),
  splits: z
    .array(
      z.object({
        targetDepartment: z.enum([
          'BIOCHEMISTRY',
          'IMMUNOLOGY',
          'HEMATOLOGY',
          'COAGULATION',
          'CLINICAL_PATHOLOGY',
          'SEROLOGY',
          'MOLECULAR_BIOLOGY',
        ]),
        targetAnalyzerCode: z.string().min(1),
        allocatedVolumeMl: z.number().positive(),
        assignedTestCodes: z.array(z.string().min(1)),
      })
    )
    .optional(),
});

export const registerStatOrderSchema = z.object({
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  patientId: z.string().min(1),
  patientName: z.string().min(1),
  encounterType: z.enum(['OPD', 'IPD', 'EMERGENCY_STAT', 'ICU', 'DAYCARE']),
  wardName: z.string().optional(),
  roomNumber: z.string().optional(),
  bedNumber: z.string().optional(),
  nurseStationId: z.string().optional(),
  attendingPhysician: z.string().optional(),
  biomarkerCodes: z.array(z.string().min(1)).min(1),
  requiresBedsideDraw: z.boolean().optional(),
  assignedPhlebotomistId: z.string().optional(),
});

export const evaluateAuto10ASchema = z.object({
  resultId: z.string().min(1),
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  patientId: z.string().min(1),
  patientName: z.string().min(1),
  patientAgeYears: z.number().min(0).max(130),
  patientGender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  analyzerCode: z.string().min(1),
  testCode: z.string().min(1),
  parameterName: z.string().min(1),
  unit: z.string().min(1),
  numericValue: z.number().optional(),
  qualitativeValue: z.string().optional(),
  machineErrorFlags: z.array(z.string()).optional(),
  serumIndices: z
    .object({
      hemolysisIndex: z.number().min(0),
      icterusIndex: z.number().min(0),
      lipemiaIndex: z.number().min(0),
    })
    .optional(),
  previousResultWithin72h: z
    .object({
      numericValue: z.number(),
      reportedAt: z.string(),
    })
    .optional(),
});

export const fileTelephonicReadBackSchema = z.object({
  panicLogId: z.string().min(1, 'Valid panicLogId is required'),
  notifiedDoctorName: z.string().min(3, 'Physician full name is required'),
  doctorPhone: z.string().min(8, 'Valid physician phone number is required'),
  callTimestamp: z.string().optional(),
  readBackConfirmed: z.boolean(),
  clinicalActionRemarks: z.string().min(5, 'Clinical action remarks are required'),
});
