import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { microbiologyAstService } from '../microbiology/microbiology-ast.service';
import { reagentCptService } from '../inventory/reagent-cpt.service';
import { hubSpokeManifestService } from '../logistics/hub-spoke-manifest.service';
import { HttpError } from '../../utils/http-error';

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

export const AccessionCultureSchema = z.object({
  sampleId: z.string().min(1),
  orderId: z.string().min(1),
  patientId: z.string().min(1),
  wardOrUnit: z.string().min(1).default('OPD'),
  isIcuPatient: z.boolean().default(false),
  sampleSite: z.enum([
    'BLOOD',
    'URINE',
    'SPUTUM',
    'PUS_SWAB',
    'CSF',
    'STOOL',
    'BRONCHOALVEOLAR_LAVAGE',
    'PLEURAL_FLUID',
    'ASCITIC_FLUID',
    'TISSUE_BIOPSY',
  ]),
  incubationTempCelsius: z.number().min(20).max(45).optional(),
  patientName: z.string().optional(),
  patientUhid: z.string().optional(),
  patientAgeGender: z.string().optional(),
  specimenQuality: z.string().optional(),
  timeToPositivityHours: z.number().optional(),
  bottleType: z.string().optional(),
  growthStatus: z.string().optional(),
});

export const PreliminaryGramStainSchema = z.object({
  cultureId: z.string().min(1),
  gramStainMorphology: z.string().min(3),
  pusCellsCount: z.string().min(1),
  epithelialCellsCount: z.string().min(1),
  reportedByUserId: z.string().min(1).default('USR-MICRO-01'),
});

export const IsolateAstPanelSchema = z.object({
  cultureId: z.string().min(1),
  isolateNumber: z.number().int().min(1).max(5),
  organismCode: z.string().min(2),
  organismName: z.string().min(3),
  gramReaction: z.enum(['GRAM_NEGATIVE', 'GRAM_POSITIVE', 'YEAST']),
  growthDensity: z.string().min(2),
  colonyCountCfu: z.string().optional(),
  verifiedByUserId: z.string().optional(),
  antibioticPanel: z
    .array(
      z.object({
        antibioticCode: z.string().min(2),
        method: z.enum(['VITEK2_MIC', 'KIRBY_BAUER_DISK', 'E_TEST']).default('VITEK2_MIC'),
        micValueUgMl: z.number().positive().optional(),
        zoneDiameterMm: z.number().min(6).max(50).optional(),
      })
    )
    .min(1),
});

export const RegisterReagentLotSchema = z.object({
  reagentCode: z.string().min(2),
  reagentName: z.string().min(2),
  manufacturer: z.string().min(2),
  analyzerModel: z.string().min(2),
  packSizeVolume: z.number().positive(),
  onBoardStabilityDays: z.number().int().positive(),
  minimumStockAlertVol: z.number().nonnegative(),
  lotNumber: z.string().min(2),
  expiryDate: z.string().min(8),
  openedOnCarouselAt: z.string().optional(),
  calibratorFactor: z.number().positive().default(1.0),
  initialVolumeMl: z.number().positive(),
  kitPurchaseCostInr: z.number().positive(),
  calibratorCostPerTest: z.number().nonnegative().default(4.5),
});

export const ExecuteTestRecipeSchema = z.object({
  testCode: z.string().min(1),
  orderId: z.string().optional(),
  sampleBarcode: z.string().optional(),
  executedByUserId: z.string().optional(),
});

export const BookB2BOrderSchema = z.object({
  partnerId: z.string().min(1),
  patientName: z.string().min(2),
  orderNumber: z.string().min(2),
  testCodes: z.array(z.string().min(1)).min(1),
  retailTariffTotalInr: z.number().positive(),
  createdByUserId: z.string().optional(),
});

export const WalletTopupSchema = z.object({
  partnerId: z.string().min(1),
  amountInr: z.number().positive(),
  transactionRef: z.string().min(3),
  remarks: z.string().min(2),
  createdByUserId: z.string().optional(),
});

export const GenerateManifestSchema = z.object({
  partnerId: z.string().min(1),
  tamperSealNumber: z.string().min(3),
  courierRunnerName: z.string().min(2),
  courierRunnerPhone: z.string().min(6),
  departureTempCelsius: z.number(),
  tubes: z
    .array(
      z.object({
        tubeBarcode: z.string().min(3),
        sampleId: z.string().optional(),
        orderNumber: z.string().min(2),
        patientName: z.string().min(2),
        vacutainerType: z.string().min(2),
      })
    )
    .min(1),
});

export const HubReceiveManifestSchema = z.object({
  manifestBarcode: z.string().min(5),
  arrivalTempCelsius: z.number(),
  scannedTubeBarcodes: z.array(z.string()),
  receivedByHubUserId: z.string().min(1).default('USR-HUB-DOCK-01'),
  discrepancyNotes: z.string().optional(),
});

// ============================================================================
// CONTROLLER IMPLEMENTATION
// ============================================================================

export class EnterpriseTier2Controller {
  // --- MODULE 1: MICROBIOLOGY & AST ---

  public async listMicrobiologyCultures(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 25;
      const cultures = await microbiologyAstService.listCultures(limit);
      res.status(200).json({ success: true, data: cultures });
    } catch (error) {
      next(error);
    }
  }

  public async accessionCulture(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = AccessionCultureSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(400, parsed.error.issues.map((i) => i.message).join(', '));
      }
      const result = await microbiologyAstService.accessionCultureSample(parsed.data);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public async recordGramStain(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = PreliminaryGramStainSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(400, parsed.error.issues.map((i) => i.message).join(', '));
      }
      const result = await microbiologyAstService.recordPreliminaryGramStain(parsed.data);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public async recordIsolateAst(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = IsolateAstPanelSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(400, parsed.error.issues.map((i) => i.message).join(', '));
      }
      const result = await microbiologyAstService.recordIsolateAndAstPanel(parsed.data);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public async getHiccAntibiogram(req: Request, res: Response, next: NextFunction) {
    try {
      const windowDays = Number(req.query.windowDays) === 90 ? 90 : 30;
      const icuOnly = req.query.icuOnly === 'true';
      const sampleSite = req.query.sampleSite ? (String(req.query.sampleSite) as any) : undefined;
      const antibiogram = await microbiologyAstService.generateHiccAntibiogram({
        windowDays,
        icuOnly,
        sampleSite,
      });
      res.status(200).json({ success: true, data: antibiogram });
    } catch (error) {
      next(error);
    }
  }

  public async calculatePkPdSimulation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = microbiologyAstService.calculatePkPdMonteCarlo({
        antibioticCode: String(req.body.antibioticCode || 'MEM'),
        patientAgeYears: Number(req.body.patientAgeYears ?? 54),
        patientWeightKg: Number(req.body.patientWeightKg ?? 70),
        patientGender: req.body.patientGender === 'FEMALE' ? 'FEMALE' : 'MALE',
        serumCreatinineMgDl: Number(req.body.serumCreatinineMgDl ?? 1.1),
        dosageMg: Number(req.body.dosageMg ?? 1000),
        dosingIntervalHours: Number(req.body.dosingIntervalHours ?? 8),
        infusionDurationHours: Number(req.body.infusionDurationHours ?? 3.0),
        targetMicUgMl: Number(req.body.targetMicUgMl ?? 1.0),
        isIcuPatient: Boolean(req.body.isIcuPatient ?? true),
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public async evaluateResistomeConcordance(req: Request, res: Response, next: NextFunction) {
    try {
      const result = microbiologyAstService.evaluateResistomeGenotypeConcordance({
        cultureId: String(req.body.cultureId || ''),
        isolateNumber: Number(req.body.isolateNumber ?? 1),
        organismName: String(req.body.organismName || 'Klebsiella pneumoniae'),
        detectedGenes: Array.isArray(req.body.detectedGenes) ? req.body.detectedGenes : ['blaNDM_1', 'blaCTX_M_15'],
        observedPhenotypes: req.body.observedPhenotypes,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public async calculateSynergyCheckerboard(req: Request, res: Response, next: NextFunction) {
    try {
      const result = microbiologyAstService.calculateSynergyCheckerboard({
        antibioticCodeA: String(req.body.antibioticCodeA || 'CZA'),
        antibioticCodeB: String(req.body.antibioticCodeB || 'ATM'),
        micAloneAUgMl: Number(req.body.micAloneAUgMl ?? 64),
        micAloneBUgMl: Number(req.body.micAloneBUgMl ?? 32),
        micComboAUgMl: Number(req.body.micComboAUgMl ?? 4),
        micComboBUgMl: Number(req.body.micComboBUgMl ?? 2),
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public async getTransmissionClusterGraph(req: Request, res: Response, next: NextFunction) {
    try {
      const minSnpThreshold = req.query.minSnpThreshold ? Number(req.query.minSnpThreshold) : 15;
      const windowDays = req.query.windowDays ? Number(req.query.windowDays) : 30;
      const result = await microbiologyAstService.generateTransmissionClusterGraph({
        minSnpThreshold,
        windowDays,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public async exportWhonetGlass(req: Request, res: Response, next: NextFunction) {
    try {
      const windowDays = req.query.windowDays ? Number(req.query.windowDays) : 90;
      const result = await microbiologyAstService.exportWhonetGlassData(windowDays);
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.status(200).send(result.tsvContent);
    } catch (error) {
      next(error);
    }
  }

  public async logCriticalCall(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        cultureId,
        callerUserName,
        receiverDoctorOrNurse,
        wardOrDepartment,
        contactNumber,
        criticalFinding,
        readbackConfirmed,
        clinicalActionNotes,
      } = req.body;

      if (!cultureId || !receiverDoctorOrNurse || !criticalFinding) {
        throw new HttpError(400, 'cultureId, receiverDoctorOrNurse, and criticalFinding are required');
      }

      const result = await microbiologyAstService.logCriticalValueCall({
        cultureId: String(cultureId),
        callerUserName: callerUserName || (req as any).user?.name || 'Lab Technologist',
        receiverDoctorOrNurse: String(receiverDoctorOrNurse),
        wardOrDepartment: String(wardOrDepartment || 'ICU'),
        contactNumber: String(contactNumber || ''),
        criticalFinding: String(criticalFinding),
        readbackConfirmed: Boolean(readbackConfirmed ?? true),
        clinicalActionNotes: clinicalActionNotes ? String(clinicalActionNotes) : undefined,
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public async listCriticalCalls(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const calls = await microbiologyAstService.listCriticalValueCalls(limit);
      res.status(200).json({ success: true, data: calls });
    } catch (error) {
      next(error);
    }
  }

  // --- MODULE 2: REAGENT INVENTORY & CPT PROFITABILITY ---

  public async getReagentInventoryOverview(_req: Request, res: Response, next: NextFunction) {
    try {
      const overview = await reagentCptService.getInventoryOverview();
      res.status(200).json({ success: true, data: overview });
    } catch (error) {
      next(error);
    }
  }

  public async registerReagentLot(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = RegisterReagentLotSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(400, parsed.error.issues.map((i) => i.message).join(', '));
      }
      const overview = await reagentCptService.registerReagentLot(parsed.data);
      res.status(201).json({ success: true, data: overview });
    } catch (error) {
      next(error);
    }
  }

  public async executeTestRecipeConsumption(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = ExecuteTestRecipeSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(400, parsed.error.issues.map((i) => i.message).join(', '));
      }
      const result = await reagentCptService.consumeReagentsForTestExecution(parsed.data);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public async getCptProfitabilityMatrix(_req: Request, res: Response, next: NextFunction) {
    try {
      const matrix = await reagentCptService.calculateCptProfitabilityMatrix();
      res.status(200).json({ success: true, data: matrix });
    } catch (error) {
      next(error);
    }
  }

  // --- MODULE 3: B2B HUB-AND-SPOKE LOGISTICS & WALLET ---

  public async getLogisticsDashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const dashboard = await hubSpokeManifestService.getHubLogisticsDashboard();
      res.status(200).json({ success: true, data: dashboard });
    } catch (error) {
      next(error);
    }
  }

  public async bookB2BRequisition(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = BookB2BOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(400, parsed.error.issues.map((i) => i.message).join(', '));
      }
      const booking = await hubSpokeManifestService.bookB2BPartnerRequisition(parsed.data);
      res.status(201).json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
  }

  public async topupPartnerWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = WalletTopupSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(400, parsed.error.issues.map((i) => i.message).join(', '));
      }
      const result = await hubSpokeManifestService.topupPartnerWallet(parsed.data);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public async generateManifest(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = GenerateManifestSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(400, parsed.error.issues.map((i) => i.message).join(', '));
      }
      const manifest = await hubSpokeManifestService.generateConsignmentManifest(parsed.data);
      res.status(201).json({ success: true, data: manifest });
    } catch (error) {
      next(error);
    }
  }

  public async receiveManifestAtHub(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = HubReceiveManifestSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(400, parsed.error.issues.map((i) => i.message).join(', '));
      }
      const verification = await hubSpokeManifestService.receiveAndVerifyManifestAtHub(parsed.data);
      res.status(200).json({ success: true, data: verification });
    } catch (error) {
      next(error);
    }
  }
}

export const enterpriseTier2Controller = new EnterpriseTier2Controller();
