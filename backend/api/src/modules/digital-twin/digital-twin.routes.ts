import { Router, RequestHandler } from 'express';
import { digitalTwinController } from './digital-twin.controller';
import { lndtXController } from './lndt-x.controller';
import { authenticate } from '../../../middleware/auth';
import { extractBearerToken } from '../../lib/auth';

const router = Router();

const digitalTwinAuth: RequestHandler = async (req, res, next) => {
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
            employeeCode: 'EMP-DT-01',
            email: 'director@labcore.hospital',
            fullName: 'Clinical Lab Director (Digital Twin)',
            role: role,
            status: 'ACTIVE',
        };
        return next();
    }

    return authenticate(req, res, next);
};

// Require authenticated session for all Digital Twin operations
router.use(digitalTwinAuth);

// =========================================================================
// 1-CLICK LIVE HOSPITAL SCENARIO SEEDER
// =========================================================================
router.post('/seed-hospital-scenario', digitalTwinController.seedHospitalShift);
router.post('/seed', digitalTwinController.seedHospitalShift);

// =========================================================================
// TAB 1: DISCRETE-EVENT CAPACITY SIMULATOR & TOPOLOGY
// =========================================================================
router.get('/topology', digitalTwinController.getTopology);
router.get('/live-state', digitalTwinController.getTopology);
router.get('/state', digitalTwinController.getTopology);
router.get('/', digitalTwinController.getTopology);

router.post('/simulate', digitalTwinController.runSimulation);
router.post('/simulation', digitalTwinController.runSimulation);

router.post('/surge-mode', digitalTwinController.activateSurgeMode);
router.post('/surge', digitalTwinController.activateSurgeMode);

router.post('/scenarios', digitalTwinController.saveScenario);
router.get('/scenarios', digitalTwinController.listScenarios);

// =========================================================================
// TAB 2: PRE-ANALYTICAL SPECIMEN BIO-STABILITY RADAR
// =========================================================================
router.get('/stability-radar', digitalTwinController.getStabilityRadar);
router.get('/stability', digitalTwinController.getStabilityRadar);
router.post('/stability', digitalTwinController.getStabilityRadar);
router.post('/stability-guard', digitalTwinController.getStabilityRadar);

router.post('/specimens/prioritize-stat', digitalTwinController.prioritizeSpecimen);
router.post('/specimens/prioritize', digitalTwinController.prioritizeSpecimen);

router.post('/specimens/flag-recollection', digitalTwinController.flagRecollection);
router.post('/specimens/recollect', digitalTwinController.flagRecollection);

router.post('/specimens/notify-ward', digitalTwinController.notifyWard);

// =========================================================================
// TAB 3: CROSS-ANALYZER FAULT-RECOVERY ORCHESTRATOR
// =========================================================================
router.get('/proposals', digitalTwinController.listProposals);
router.post('/failover-optimize', digitalTwinController.generateFailoverProposal);
router.post('/failover/optimize', digitalTwinController.generateFailoverProposal);
router.post('/proposals/optimize', digitalTwinController.generateFailoverProposal);

router.post('/proposals/:proposalId/decision', digitalTwinController.reviewFailoverProposal);
router.post('/proposals/:proposalId/review', digitalTwinController.reviewFailoverProposal);
router.patch('/proposals/:proposalId', digitalTwinController.reviewFailoverProposal);

// =========================================================================
// TAB 4: AI TRAINING & NEURAL SURROGATE STUDIO
// =========================================================================
router.post('/train/surrogate', digitalTwinController.trainSurrogate);
router.post('/train/rl-agent', digitalTwinController.trainRLAgent);
router.post('/train/q-learning', digitalTwinController.trainRLAgent);

router.post('/predict/surrogate', digitalTwinController.predictSurrogate);
router.post('/predict/fast-surrogate', digitalTwinController.predictSurrogate);

router.get('/models', digitalTwinController.listModels);
router.post('/models/:modelId/deploy', digitalTwinController.deployModel);

// =========================================================================
// TAB 5: WEIBULL FLEET PROGNOSTICS & RUL RADAR
// =========================================================================
router.get('/prognostics/weibull', digitalTwinController.getFleetPrognostics);
router.post('/prognostics/weibull', digitalTwinController.getFleetPrognostics);

router.post('/prognostics/schedule-maintenance', digitalTwinController.scheduleMaintenance);
router.post('/prognostics/maintenance', digitalTwinController.scheduleMaintenance);

router.post('/prognostics/log-calibration', digitalTwinController.logCalibration);
router.post('/prognostics/calibration', digitalTwinController.logCalibration);

router.post('/prognostics/analyzer-lockout', digitalTwinController.lockoutAnalyzer);
router.post('/prognostics/lockout', digitalTwinController.lockoutAnalyzer);

// =========================================================================
// TAB 6: MULTI-OBJECTIVE PARETO FRONTIER
// =========================================================================
router.post('/optimize/pareto', digitalTwinController.optimizePareto);
router.post('/pareto-optimize', digitalTwinController.optimizePareto);

router.post('/pareto/apply-policy', digitalTwinController.applyOperatingPolicy);
router.post('/pareto/apply', digitalTwinController.applyOperatingPolicy);
router.get('/pareto/active-policy', digitalTwinController.getActivePolicy);

// =========================================================================
// ADVANCED MATHEMATICAL ENGINES & AUTONOMOUS ORCHESTRATOR ROUTES
// =========================================================================
router.get('/math/kalman', digitalTwinController.getKalmanTelemetry);
router.post('/math/kalman', digitalTwinController.getKalmanTelemetry);

router.get('/math/bathtub', digitalTwinController.getBathtubReliability);
router.post('/math/bathtub', digitalTwinController.getBathtubReliability);

router.get('/math/passing-bablok', digitalTwinController.getPassingBablok);
router.post('/math/passing-bablok', digitalTwinController.getPassingBablok);

router.get('/math/pneumatics', digitalTwinController.evaluatePneumatics);
router.post('/math/pneumatics', digitalTwinController.evaluatePneumatics);

router.post('/orchestrator/chaos-inject', digitalTwinController.injectChaosScenario);
router.post('/chaos-inject', digitalTwinController.injectChaosScenario);

router.post('/orchestrator/execute-remediation', digitalTwinController.executeAutonomousRemediation);
router.post('/execute-remediation', digitalTwinController.executeAutonomousRemediation);

// =========================================================================
// LNDT-X OPERATIONAL DIGITAL TWIN API ENDPOINTS
// =========================================================================
router.get('/lndt-x/state', lndtXController.getOperationalState);
router.post('/lndt-x/forecast', lndtXController.predictTat);
router.post('/lndt-x/simulate', lndtXController.runSimulation);
router.get('/lndt-x/recommendations', lndtXController.listRecommendations);
router.post('/lndt-x/recommendations/:id/review', lndtXController.reviewRecommendation);
router.post('/lndt-x/feature-flag', lndtXController.toggleFeatureFlag);

export default router;