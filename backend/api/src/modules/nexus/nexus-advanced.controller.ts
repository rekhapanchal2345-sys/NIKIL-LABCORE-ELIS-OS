import { Request, Response } from 'express';
import { z } from 'zod';
import { nexusAdvancedService } from './nexus-advanced.service';

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

export const BullsMovingAverageSchema = z.object({
  analyzerId: z.string().min(1),
  batch20: z
    .array(
      z.object({
        sampleId: z.string().optional(),
        mcv: z.number().positive(),
        mch: z.number().positive(),
        mchc: z.number().positive(),
      })
    )
    .min(1)
    .max(50),
  previousXB: z
    .object({
      mcv: z.number().positive(),
      mch: z.number().positive(),
      mchc: z.number().positive(),
    })
    .optional(),
  targetMeans: z
    .object({
      mcv: z.number().positive(),
      mch: z.number().positive(),
      mchc: z.number().positive(),
    })
    .optional(),
});

export const TruncatedEwmaSchema = z.object({
  analyzerId: z.string().min(1),
  analyteCode: z.string().min(1),
  values: z.array(z.number()).min(3),
  lambda: z.number().min(0.01).max(0.5).optional(),
  lowerPercentile: z.number().min(0.0).max(0.4).optional(),
  upperPercentile: z.number().min(0.6).max(1.0).optional(),
  referenceTargetMean: z.number().optional(),
  referenceTargetSd: z.number().positive().optional(),
});

export const PhysiologicalPlausibilitySchema = z.object({
  orderId: z.string().optional(),
  sampleId: z.string().optional(),
  patientId: z.string().optional(),
  electrolytes: z.object({
    na: z.number().min(80).max(220),
    k: z.number().min(1.0).max(18.0),
    cl: z.number().min(50).max(180),
    hco3: z.number().min(2).max(60),
    albumin: z.number().min(0.5).max(7.0).optional(),
    glucose: z.number().min(5).max(2500).optional(),
    bun: z.number().min(1).max(300).optional(),
    measuredOsmolality: z.number().min(200).max(500).optional(),
    ca: z.number().min(1.0).max(20.0).optional(),
    hb: z.number().min(1.5).max(25.0).optional(),
    previousResults: z
      .object({
        na: z.number().optional(),
        k: z.number().optional(),
        cl: z.number().optional(),
        hco3: z.number().optional(),
        ca: z.number().optional(),
        hb: z.number().optional(),
        glucose: z.number().optional(),
      })
      .optional(),
  }),
});

export const SepsisKineticEvaluationSchema = z.object({
  patientId: z.string().min(1),
  orderId: z.string().optional(),
  elapsedHours: z.number().positive().optional(),
  current: z.object({
    platelets: z.number().min(1).max(1500),
    totalBilirubin: z.number().min(0.05).max(60),
    creatinine: z.number().min(0.1).max(30),
    lactate: z.number().min(0.1).max(35),
    procalcitonin: z.number().min(0).max(500).optional(),
    baselineProcalcitonin72h: z.number().min(0).max(500).optional(),
  }),
  previous: z
    .object({
      platelets: z.number().min(1).max(1500),
      totalBilirubin: z.number().min(0.05).max(60),
      creatinine: z.number().min(0.1).max(30),
      lactate: z.number().min(0.1).max(35),
      procalcitonin: z.number().min(0).max(500).optional(),
    })
    .optional(),
});

export const TatHazardPredictionSchema = z.object({
  specimen: z.object({
    sampleId: z.string().min(1),
    barcode: z.string().min(1),
    analyzerId: z.string().min(1),
    department: z.enum(['CLINICAL_CHEMISTRY', 'HEMATOLOGY', 'COAGULATION', 'IMMUNOASSAY']),
    elapsedMinutes: z.number().min(0),
    slaTargetMinutes: z.number().min(5),
    centrifugeDelayMinutes: z.number().min(0),
    sampleHilIndex: z.number().int().min(0).max(4),
    isIcu: z.boolean(),
  }),
  queueState: z.object({
    analyzerId: z.string().min(1),
    queueDepth: z.number().int().min(0),
    meanProcessingRateTubesPerMin: z.number().positive(),
    parallelAnalyzersAvailable: z.array(
      z.object({
        analyzerId: z.string().min(1),
        name: z.string().min(1),
        currentQueueDepth: z.number().int().min(0),
        isOnline: z.boolean(),
      })
    ),
  }),
});

export const ReagentEvaporationSchema = z.object({
  analyzerId: z.string().min(1),
  analyteCode: z.string().min(1),
  reagentLotNumber: z.string().optional(),
  initialVolumeMl: z.number().positive(),
  daysPierced: z.number().min(0),
  carouselTempCelsius: z.number().min(2).max(35),
  septumApertureDiameterMm: z.number().positive().optional(),
  ambientCarouselRelativeHumidity: z.number().min(0.05).max(0.95).optional(),
});

// ============================================================================
// CONTROLLER HANDLERS
// ============================================================================

export class NexusAdvancedController {
  async getSnapshot(_req: Request, res: Response) {
    try {
      const data = await nexusAdvancedService.getCommandCenterIntelligenceSnapshot();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to compute Clinical Intelligence Nexus snapshot',
        error: error?.message,
      });
    }
  }

  async evaluateBullsMovingAverage(req: Request, res: Response) {
    const parsed = BullsMovingAverageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten() });
      return;
    }
    const result = await nexusAdvancedService.runBullsMovingAverageAnalysis(parsed.data);
    res.status(200).json({ success: true, data: result });
  }

  async evaluateTruncatedEwma(req: Request, res: Response) {
    const parsed = TruncatedEwmaSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten() });
      return;
    }
    const result = await nexusAdvancedService.runTruncatedEwmaAnalysis(parsed.data);
    res.status(200).json({ success: true, data: result });
  }

  async evaluatePlausibility(req: Request, res: Response) {
    const parsed = PhysiologicalPlausibilitySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten() });
      return;
    }
    const result = await nexusAdvancedService.runPhysiologicalPlausibilityCheck(parsed.data);
    res.status(200).json({ success: true, data: result });
  }

  async evaluateSepsisSofa(req: Request, res: Response) {
    const parsed = SepsisKineticEvaluationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten() });
      return;
    }
    const result = await nexusAdvancedService.runSepsisSofaAndLactateEvaluation(parsed.data);
    res.status(200).json({ success: true, data: result });
  }

  async evaluateTatHazard(req: Request, res: Response) {
    const parsed = TatHazardPredictionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten() });
      return;
    }
    const result = await nexusAdvancedService.runTatHazardPrediction(parsed.data);
    res.status(200).json({ success: true, data: result });
  }

  async evaluateReagentEvaporation(req: Request, res: Response) {
    const parsed = ReagentEvaporationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten() });
      return;
    }
    const result = await nexusAdvancedService.runReagentEvaporationModel(parsed.data);
    res.status(200).json({ success: true, data: result });
  }
}

export const nexusAdvancedController = new NexusAdvancedController();
