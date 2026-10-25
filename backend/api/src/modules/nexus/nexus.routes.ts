/**
 * LABCORE OMNISCIENT NEXUS — ROUTE DEFINITIONS
 * 
 * Secure routes for the Omniscient Nexus Command Center, mathematical engines,
 * and controlled autonomy workflows.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { nexusController } from './nexus.controller';
import { nexusAdvancedController } from './nexus-advanced.controller';
import { authenticate, requireRoles, AuthenticatedRequest } from '../../../middleware/auth';
import { nexusOperatingModeService } from './nexus-operating-mode.service';

const router = Router();

// Require authenticated session for all Nexus routes
router.use(authenticate);

// =========================================================================
// 0. OPERATING MODE & SAFETY INTERLOCKS (DEMO / SHADOW / CONTROLLED_PROD)
// =========================================================================
router.get('/mode', (req: AuthenticatedRequest, res: Response) => {
    const orgId = (req.query.organizationId as string) || (req.user as any)?.organizationId || 'DEFAULT_ORG';
    const mode = nexusOperatingModeService.getOperatingMode(orgId);
    res.json({ success: true, data: mode });
});

router.post('/mode', requireRoles('SUPER_ADMIN', 'ADMIN'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { targetMode, reason, enabledCapabilities, signingSecret } = req.body;
        const orgId = req.body.organizationId || (req.user as any)?.organizationId || 'DEFAULT_ORG';
        const actorRole = req.user?.role || 'TECHNOLOGIST';
        const updated = nexusOperatingModeService.transitionMode({
            organizationId: orgId,
            targetMode,
            actorUserId: req.user?.id || 'ANONYMOUS',
            actorRole,
            reason: reason || 'Operating mode transitioned via authenticated API',
            enabledCapabilities: enabledCapabilities || [],
            signingSecret: signingSecret || process.env.JWT_SECRET || 'nexus-default-secret',
        });
        res.json({ success: true, message: `Operating mode transitioned to ${targetMode}`, data: updated });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.post('/emergency-stop', requireRoles('SUPER_ADMIN', 'ADMIN', 'PATHOLOGIST'), (req: AuthenticatedRequest, res: Response) => {
    const orgId = req.body.organizationId || (req.user as any)?.organizationId || 'DEFAULT_ORG';
    const halted = nexusOperatingModeService.triggerEmergencyStop({
        organizationId: orgId,
        actorUserId: req.user?.id || 'ANONYMOUS',
        reason: req.body.reason || 'Immediate Emergency Stop triggered via authenticated API',
    });
    res.json({ success: true, message: 'Emergency Stop active: platform downgraded to read-only SHADOW_MODE', data: halted });
});

// =========================================================================
// 1. NEXUS EXECUTIVE COMMAND CENTER
// =========================================================================
router.get('/overview', nexusController.getCommandCenterOverview);
router.get('/command-center', nexusController.getCommandCenterOverview);
router.get('/fleet-status', nexusController.getFleetStatus);
router.get('/', nexusController.getCommandCenterOverview);

// =========================================================================
// 2. MATHEMATICAL INTELLIGENCE ENGINE
// =========================================================================
router.post('/math/descriptive-stats', nexusController.computeDescriptiveStats);
router.post('/math/queue-process', nexusController.evaluateQueueProcess);
router.post('/math/weibull-reliability', nexusController.evaluateWeibull);
router.post('/math/six-sigma', nexusController.computeSixSigma);
router.post('/math/kalman-drift', nexusController.evaluateKalmanDrift);
router.post('/math/enzyme-kinetics', nexusController.evaluateEnzymeKinetics);
router.post('/math/erlang-b-loss', nexusController.evaluateErlangBLoss);
router.post('/math/kdigo-staging', nexusController.evaluateKdigoStaging);
router.post('/math/arrhenius-tti', nexusController.evaluateArrheniusTti);
router.post('/math/cusum-evaluation', nexusController.evaluateCusum);
router.post('/math/hil-interference', nexusController.evaluateHil);
router.post('/math/delta-check', nexusController.evaluateDeltaCheck);

// =========================================================================
// 3. CONTROLLED AUTONOMY ADJUDICATION (Strict Pathologist & Director Gate)
// =========================================================================
router.post('/proposals/:id/review', requireRoles('SUPER_ADMIN', 'ADMIN', 'PATHOLOGIST'), nexusController.reviewProposal);
router.post('/proposals/:id/decision', requireRoles('SUPER_ADMIN', 'ADMIN', 'PATHOLOGIST'), nexusController.reviewProposal);

// =========================================================================
// 4. HIGH-ORDER CLINICAL MATHEMATICS & OPERATIONS RESEARCH (CLINICAL INTELLIGENCE)
// =========================================================================
router.get('/clinical-intelligence/snapshot', (req, res) =>
  nexusAdvancedController.getSnapshot(req, res)
);
router.post('/clinical-intelligence/bulls-moving-average', (req, res) =>
  nexusAdvancedController.evaluateBullsMovingAverage(req, res)
);
router.post('/clinical-intelligence/truncated-ewma', (req, res) =>
  nexusAdvancedController.evaluateTruncatedEwma(req, res)
);
router.post('/clinical-intelligence/physiological-plausibility', (req, res) =>
  nexusAdvancedController.evaluatePlausibility(req, res)
);
router.post('/clinical-intelligence/sepsis-sofa-kinetics', (req, res) =>
  nexusAdvancedController.evaluateSepsisSofa(req, res)
);
router.post('/clinical-intelligence/tat-sla-hazard', (req, res) =>
  nexusAdvancedController.evaluateTatHazard(req, res)
);
router.post('/clinical-intelligence/reagent-evaporation', (req, res) =>
  nexusAdvancedController.evaluateReagentEvaporation(req, res)
);

// =========================================================================
// 5. OMNI-SENTINEL™ // NEXUS-BIO-TENSOR™ AUDIT WORKFLOW
// =========================================================================
import { nexusBioTensorService } from './nexus-bio-tensor.service';

/**
 * POST /api/v1/nexus/audit/:specimenId
 * Executes full 5-stage biophysical manifold, pre-analytical stoichiometry,
 * Stewart-Fencl acid-base, Ornstein-Uhlenbeck SDE trajectory, and Shannon entropy reflex audit.
 */
router.post('/audit/:specimenId', async (req, res, next) => {
  try {
    const rawParam = req.params.specimenId;
    const specimenId = Array.isArray(rawParam) ? rawParam[0] : rawParam;

    if (!specimenId || specimenId.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'MISSING_SPECIMEN_ID',
        message: 'Path parameter :specimenId is required.',
      });
      return;
    }

    const auditPayload = await nexusBioTensorService.performBioTensorAudit(
      specimenId.trim()
    );

    res.setHeader('X-Omni-Sentinel-Verdict', auditPayload.verdict);
    res.setHeader(
      'X-Regulatory-Compliance',
      auditPayload.regulatoryComplianceTags.join(',')
    );

    res.status(200).json({
      success: true,
      engine: 'OMNI-SENTINEL // NEXUS-BIO-TENSOR v4.0',
      data: auditPayload,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/nexus/audit/:specimenId
 * Retrieves latest persisted NEXUS-BIO-TENSOR™ audit telemetry and verdict.
 */
router.get('/audit/:specimenId', async (req, res, next) => {
  try {
    const rawParam = req.params.specimenId;
    const specimenId = Array.isArray(rawParam) ? rawParam[0] : rawParam;

    if (!specimenId || specimenId.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'MISSING_SPECIMEN_ID',
        message: 'Path parameter :specimenId is required.',
      });
      return;
    }

    const auditPayload = await nexusBioTensorService.getLatestBioTensorAudit(
      specimenId.trim()
    );

    res.setHeader('X-Omni-Sentinel-Verdict', auditPayload.verdict);
    res.status(200).json({
      success: true,
      engine: 'OMNI-SENTINEL // NEXUS-BIO-TENSOR v4.0',
      data: auditPayload,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
