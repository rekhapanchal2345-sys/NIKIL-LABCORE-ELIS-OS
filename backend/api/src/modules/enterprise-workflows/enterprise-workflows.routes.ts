import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { enterpriseWorkflowsController } from './enterprise-workflows.controller';

const router = Router();

// Require valid authentication token for all enterprise workflow operations
router.use(authenticate);

// Module 1: Primary Vacutainer Tube Consolidation & Secondary Aliquots
router.post('/tubes/consolidate', (req, res, next) =>
  enterpriseWorkflowsController.consolidateOrderTubes(req, res, next)
);
router.get('/tubes', (req, res, next) =>
  enterpriseWorkflowsController.listPhysicalTubes(req, res, next)
);
router.post('/tubes/collect-qns-guard', (req, res, next) =>
  enterpriseWorkflowsController.collectTubeWithQnsGuard(req, res, next)
);
router.post('/tubes/centrifuge', (req, res, next) =>
  enterpriseWorkflowsController.centrifugeAndDecapTube(req, res, next)
);
router.post('/tubes/aliquots', (req, res, next) =>
  enterpriseWorkflowsController.createSecondaryAliquots(req, res, next)
);

// Module 2: Emergency STAT & Hospital Inpatient (IPD/ICU) Triage Desk
router.post('/stat-triage/register', (req, res, next) =>
  enterpriseWorkflowsController.registerStatOrIpdEncounter(req, res, next)
);
router.get('/stat-triage/board', (req, res, next) =>
  enterpriseWorkflowsController.getLiveStatBoard(req, res, next)
);
router.post('/stat-triage/bedside-round', (req, res, next) =>
  enterpriseWorkflowsController.dispatchBedsideRound(req, res, next)
);
router.post('/stat-triage/:trackerId/acknowledge-siren', (req, res, next) =>
  enterpriseWorkflowsController.acknowledgeStatSiren(req, res, next)
);

// Module 3: CLSI AUTO10-A Auto-Verification Engine
router.post('/autoverification/shift-qc', (req, res, next) =>
  enterpriseWorkflowsController.recordShiftQc(req, res, next)
);
router.post('/autoverification/evaluate', (req, res, next) =>
  enterpriseWorkflowsController.evaluateAuto10AResult(req, res, next)
);
router.get('/autoverification/logs', (req, res, next) =>
  enterpriseWorkflowsController.listAuto10AEvaluations(req, res, next)
);

// Module 4: Critical Panic Alert & Telephonic Read-Back Audit Ledger (NABL ISO 15189 7.4.2)
router.get('/panic-readback/ledger', (req, res, next) =>
  enterpriseWorkflowsController.listPanicReadBackLogs(req, res, next)
);
router.post('/panic-readback/file-call', (req, res, next) =>
  enterpriseWorkflowsController.fileTelephonicReadBack(req, res, next)
);
router.get('/panic-readback/dispatch-guard/:orderId', (req, res, next) =>
  enterpriseWorkflowsController.verifyOrderDispatchClearance(req, res, next)
);

export default router;
