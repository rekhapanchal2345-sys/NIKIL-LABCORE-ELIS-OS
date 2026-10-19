import { Request, Response, NextFunction } from 'express';
import { vacutainerConsolidationService } from '../samples/vacutainer-consolidation.service';
import { statTriageService, EncounterType } from '../orders/stat-triage.service';
import { autoVerificationAuto10AService } from '../results/autoverification-auto10a.service';
import { panicReadBackService } from '../approvals/panic-readback.service';
import {
  consolidateOrderTubesSchema,
  collectTubeWithQnsSchema,
  centrifugeTubeSchema,
  splitAliquotsSchema,
  registerStatOrderSchema,
  evaluateAuto10ASchema,
  fileTelephonicReadBackSchema,
} from './enterprise-workflows.validation';

export class EnterpriseWorkflowsController {
  // --------------------------------------------------------------------------
  // 1. VACUTAINER CONSOLIDATION & SECONDARY ALIQUOTS
  // --------------------------------------------------------------------------

  public async consolidateOrderTubes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = consolidateOrderTubesSchema.parse(req.body);
      const userId = (req as any).user?.id || 'SYSTEM_PHLEBOTOMIST';
      const result = await vacutainerConsolidationService.consolidateOrderToPhysicalTubes({
        orderId: parsed.orderId,
        userId,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public async listPhysicalTubes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const tubes = await vacutainerConsolidationService.listActiveTubes(status);
      res.status(200).json({ success: true, data: tubes });
    } catch (error) {
      next(error);
    }
  }

  public async collectTubeWithQnsGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = collectTubeWithQnsSchema.parse(req.body);
      const userId = (req as any).user?.id || 'PHLEB-01';
      const updated = await vacutainerConsolidationService.recordTubeCollectionWithQnsGuard({
        tubeId: parsed.tubeId,
        collectedVolumeMl: parsed.collectedVolumeMl,
        collectedByUserId: userId,
        qnsOverrideReason: parsed.qnsOverrideReason,
      });
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  public async centrifugeAndDecapTube(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = centrifugeTubeSchema.parse(req.body);
      const userId = (req as any).user?.id || 'LAB-TECH-01';
      const updated = await vacutainerConsolidationService.recordCentrifugationAndDecapping({
        ...parsed,
        userId,
      });
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  public async createSecondaryAliquots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = splitAliquotsSchema.parse(req.body);
      const userId = (req as any).user?.id || 'LAB-TECH-01';
      const result = await vacutainerConsolidationService.generateSecondaryAliquots({
        parentTubeId: parsed.parentTubeId,
        userId,
        splits: parsed.splits,
      });
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // --------------------------------------------------------------------------
  // 2. EMERGENCY STAT & IPD/ICU TRIAGE DESK
  // --------------------------------------------------------------------------

  public async registerStatOrIpdEncounter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = registerStatOrderSchema.parse(req.body);
      const tracker = await statTriageService.registerStatOrIpdEncounter(parsed);
      res.status(201).json({ success: true, data: tracker });
    } catch (error) {
      next(error);
    }
  }

  public async getLiveStatBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const encounterType = req.query.encounterType as EncounterType | undefined;
      const board = await statTriageService.getLiveStatTriageBoard(encounterType);
      res.status(200).json({ success: true, data: board });
    } catch (error) {
      next(error);
    }
  }

  public async dispatchBedsideRound(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { trackerId, phlebotomistId, markCollected } = req.body;
      const updated = await statTriageService.updateBedsidePhlebotomyRound({
        trackerId,
        phlebotomistId,
        markCollected: Boolean(markCollected),
      });
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  public async acknowledgeStatSiren(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trackerId = String(req.params.trackerId);
      const userId = (req as any).user?.id || 'TRIAGE-DUTY-OFFICER';
      const updated = await statTriageService.acknowledgeStatSiren(trackerId, userId);
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // --------------------------------------------------------------------------
  // 3. CLSI AUTO10-A AUTOVERIFICATION ENGINE
  // --------------------------------------------------------------------------

  public async recordShiftQc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || 'QC-OFFICER';
      const qcLog = await autoVerificationAuto10AService.recordAnalyzerShiftQc({
        ...req.body,
        operatorUserId: userId,
      });
      res.status(201).json({ success: true, data: qcLog });
    } catch (error) {
      next(error);
    }
  }

  public async evaluateAuto10AResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = evaluateAuto10ASchema.parse(req.body);
      const evaluation = await autoVerificationAuto10AService.evaluateResultPipeline(parsed);
      res.status(200).json({ success: true, data: evaluation });
    } catch (error) {
      next(error);
    }
  }

  public async listAuto10AEvaluations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await autoVerificationAuto10AService.listRecentEvaluations();
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }

  // --------------------------------------------------------------------------
  // 4. CRITICAL PANIC ALERT & TELEPHONIC READ-BACK LEDGER (ISO 15189 7.4.2)
  // --------------------------------------------------------------------------

  public async listPanicReadBackLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const onlyUnresolved = req.query.unresolved === 'true';
      const logs = await panicReadBackService.listPanicReadBackLedger(onlyUnresolved);
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }

  public async fileTelephonicReadBack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = fileTelephonicReadBackSchema.parse(req.body);
      const userId = (req as any).user?.id || 'PATHOLOGIST-01';
      const userName = (req as any).user?.name || 'Dr. Duty Pathologist (MD)';
      const updated = await panicReadBackService.recordTelephonicReadBack({
        ...parsed,
        notifiedByUserId: userId,
        notifiedByUserName: userName,
      });
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  public async verifyOrderDispatchClearance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.orderId);
      const clearance = await panicReadBackService.assertOrderClearedForReportDispatch(orderId);
      res.status(200).json({ success: true, data: clearance });
    } catch (error) {
      next(error);
    }
  }
}

export const enterpriseWorkflowsController = new EnterpriseWorkflowsController();
