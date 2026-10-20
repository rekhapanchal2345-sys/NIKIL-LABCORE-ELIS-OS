/**
 * LABCORE OMNISCIENT NEXUS — ROUTE DEFINITIONS
 * 
 * Secure routes for the Omniscient Nexus Command Center, mathematical engines,
 * and controlled autonomy workflows.
 */

import { Router, RequestHandler } from 'express';
import { nexusController } from './nexus.controller';
import { nexusAdvancedController } from './nexus-advanced.controller';
import { authenticate } from '../../../middleware/auth';
import { extractBearerToken } from '../../lib/auth';

const router = Router();

/**
 * Authentication middleware with development bypass support.
 */
const nexusAuth: RequestHandler = async (req, res, next) => {
    const token = extractBearerToken(req.headers.authorization) || (req as any).cookies?.accessToken;
    if (token) {
        return authenticate(req, res, (err?: any) => {
            if (err) return next(err);
            if (req.headers['x-user-role'] && process.env.NODE_ENV !== 'production') {
                (req as any).user.role = req.headers['x-user-role'];
            }
            next();
        });
    }

    if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_DIGITAL_TWIN === 'true') {
        const role = (req.headers['x-user-role'] as string) || 'LAB_DIRECTOR';
        const userId = (req.headers['x-user-id'] as string) || 'USR-DIRECTOR-01';
        (req as any).user = {
            id: userId,
            employeeCode: 'EMP-NEXUS-01',
            email: 'director@labcore.hospital',
            fullName: 'Chief Laboratory Director (Omniscient Nexus)',
            role: role,
            status: 'ACTIVE',
        };
        return next();
    }

    return authenticate(req, res, next);
};

// Require authenticated session for all Nexus routes
router.use(nexusAuth);

// =========================================================================
// 1. NEXUS EXECUTIVE COMMAND CENTER
// =========================================================================
router.get('/overview', nexusController.getCommandCenterOverview);
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
// 3. CONTROLLED AUTONOMY ADJUDICATION
// =========================================================================
router.post('/proposals/:id/review', nexusController.reviewProposal);
router.post('/proposals/:id/decision', nexusController.reviewProposal);

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

export default router;
