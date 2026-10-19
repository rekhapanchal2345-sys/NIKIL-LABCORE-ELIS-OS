import { Request, Response } from 'express';
import { DigitalTwinService, digitalTwinService } from './digital-twin.service';
import {
    ApplyOperatingPolicySchema,
    BathtubReliabilityInputSchema,
    ChaosScenarioInjectionSchema,
    ExecuteAutonomousRemediationSchema,
    FailoverDecisionInputSchema,
    FailoverOptimizationInputSchema,
    KalmanTelemetryInputSchema,
    LiveAnalyzerLockoutSchema,
    LiveMaintenanceWindowSchema,
    LiveSpecimenEscalationSchema,
    LiveSpecimenRecollectionSchema,
    LiveSurgeModeSchema,
    LiveWardNotificationSchema,
    LogCalibrationSchema,
    ParetoOptimizationInputSchema,
    PassingBablokInputSchema,
    PneumaticsKinematicsInputSchema,
    SaveScenarioSnapshotSchema,
    SimulationRunInputSchema,
    SpecimenStabilityCheckInputSchema,
    SurrogatePredictInputSchema,
    TrainQLearningInputSchema,
    TrainSurrogateModelInputSchema,
} from './digital-twin.validation';

export interface AuthenticatedRequest extends Request {
    user?: {
        id?: string;
        userId?: string;
        role?: string;
        email?: string;
    };
}

const SIMULATION_ALLOWED_ROLES = new Set([
    'ADMIN',
    'SUPER_ADMIN',
    'LAB_DIRECTOR',
    'PATHOLOGIST',
    'LAB_MANAGER',
    'SENIOR_TECHNICIAN',
    'TECHNICIAN',
]);

const FAILOVER_SIGN_OFF_ROLES = new Set([
    'ADMIN',
    'SUPER_ADMIN',
    'LAB_DIRECTOR',
    'PATHOLOGIST',
]);

export class DigitalTwinController {
    constructor(private readonly service: DigitalTwinService = digitalTwinService) {}

    private extractActor(req: AuthenticatedRequest): {
        userId: string;
        role: string;
    } | null {
        const user = req.user;
        const headerRole = req.headers['x-user-role'];
        const headerUserId = req.headers['x-user-id'];

        const userId =
            user?.id ||
            user?.userId ||
            (typeof headerUserId === 'string' ? headerUserId : 'USR-DIRECTOR-01');
        const role = (
            user?.role ||
            (typeof headerRole === 'string' ? headerRole : 'LAB_DIRECTOR')
        ).toUpperCase();

        if (!userId || !role) {
            return null;
        }
        return { userId, role };
    }

    // =========================================================================
    // 1-CLICK LIVE HOSPITAL SCENARIO SEEDER
    // =========================================================================
    public seedHospitalShift = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const actor = this.extractActor(req);
            const result = await this.service.seedLiveHospitalShiftData(actor?.userId || 'USR-DIRECTOR-01');
            res.status(201).json({
                success: true,
                message: result.message,
                data: result,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'SEED_ERROR',
                message: error instanceof Error ? error.message : 'Failed to seed live hospital shift data.',
            });
        }
    };

    // =========================================================================
    // TAB 1: TOPOLOGY & DISCRETE-EVENT SIMULATOR
    // =========================================================================
    public getTopology = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const data = await this.service.getTopologyAndLiveQueues();
            res.status(200).json({
                success: true,
                data,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to retrieve topology.',
            });
        }
    };

    public runSimulation = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const actor = this.extractActor(req);
            const blockedRoles = new Set(['RECEPTIONIST', 'FRONT_DESK', 'BILLING', 'PATIENT', 'GUEST']);
            if (!actor || blockedRoles.has(actor.role)) {
                res.status(403).json({
                    success: false,
                    error: 'FORBIDDEN',
                    message: `Role '${actor?.role || 'UNAUTHENTICATED'}' is not authorized to execute Digital Twin simulations.`,
                });
                return;
            }

            const parsed = SimulationRunInputSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    details: parsed.error.issues,
                });
                return;
            }

            const { result, deduplicated } = await this.service.executeSimulation(
                parsed.data,
                actor?.userId || 'SYSTEM'
            );

            res.status(deduplicated ? 200 : 201).json({
                success: true,
                deduplicated,
                data: result,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'SIMULATION_ERROR',
                message: error instanceof Error ? error.message : 'Simulation failed.',
            });
        }
    };

    public activateSurgeMode = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const actor = this.extractActor(req);
            const parsed = LiveSurgeModeSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    details: parsed.error.issues,
                });
                return;
            }

            const rule = await this.service.activateSurgeMode(parsed.data, actor?.userId || 'SYSTEM');
            res.status(200).json({
                success: true,
                message: `Surge Mode (${parsed.data.surgeMultiplier}x) activated and broadcasted to hospital wards.`,
                data: rule,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'SURGE_ERROR',
                message: error instanceof Error ? error.message : 'Failed to activate surge mode.',
            });
        }
    };

    public saveScenario = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const actor = this.extractActor(req);
            const parsed = SaveScenarioSnapshotSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    details: parsed.error.issues,
                });
                return;
            }

            const scenario = await this.service.saveScenarioSnapshot(
                parsed.data,
                actor?.userId || 'SYSTEM'
            );

            res.status(201).json({
                success: true,
                message: `Scenario snapshot '${scenario.name}' saved successfully.`,
                data: scenario,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'SCENARIO_SAVE_ERROR',
                message: error instanceof Error ? error.message : 'Failed to save scenario snapshot.',
            });
        }
    };

    public listScenarios = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const scenarios = await this.service.listScenarios();
            res.status(200).json({
                success: true,
                data: scenarios,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to list scenarios.',
            });
        }
    };


    // =========================================================================
    // TAB 2: PRE-ANALYTICAL SPECIMEN BIO-STABILITY RADAR
    // =========================================================================
    public getStabilityRadar = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const ambient = Number(req.query.ambientTempCelsius || 24.0);
            const surge = Number(req.query.surgeMultiplier || 1.0);
            const radar = await this.service.evaluateLiveStabilityRadar(ambient, surge);
            res.status(200).json({
                success: true,
                data: radar,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'RADAR_ERROR',
                message: error instanceof Error ? error.message : 'Failed to evaluate specimen stability.',
            });
        }
    };

    public prioritizeSpecimen = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const actor = this.extractActor(req);
            const parsed = LiveSpecimenEscalationSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    details: parsed.error.issues,
                });
                return;
            }

            const updated = await this.service.prioritizeSpecimenToStat(
                parsed.data,
                actor?.userId || 'SYSTEM',
                actor?.role || 'TECHNICIAN'
            );

            res.status(200).json({
                success: true,
                message: `Specimen ${parsed.data.sampleId} preempted to STAT priority queue.`,
                data: updated,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'ESCALATION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to prioritize specimen.',
            });
        }
    };

    public flagRecollection = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const actor = this.extractActor(req);
            const parsed = LiveSpecimenRecollectionSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    details: parsed.error.issues,
                });
                return;
            }

            const updated = await this.service.flagSpecimenForRecollection(
                parsed.data,
                actor?.userId || 'SYSTEM',
                actor?.role || 'TECHNICIAN'
            );

            res.status(200).json({
                success: true,
                message: `Specimen ${parsed.data.sampleId} rejected; redraw ticket issued.`,
                data: updated,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'RECOLLECTION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to flag specimen for recollection.',
            });
        }
    };

    public notifyWard = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const actor = this.extractActor(req);
            const parsed = LiveWardNotificationSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    details: parsed.error.issues,
                });
                return;
            }

            const log = await this.service.notifyWardOfBioStabilityRisk(
                parsed.data,
                actor?.userId || 'SYSTEM',
                actor?.role || 'TECHNICIAN'
            );

            res.status(200).json({
                success: true,
                message: `Dispatched bio-stability notification to ${parsed.data.wardDepartment}.`,
                data: log,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'NOTIFICATION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to notify hospital ward.',
            });
        }
    };

    // =========================================================================
    // TAB 3: CROSS-ANALYZER FAULT-RECOVERY ORCHESTRATOR
    // =========================================================================
    public generateFailoverProposal = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const actor = this.extractActor(req);
            const parsed = FailoverOptimizationInputSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    details: parsed.error.issues,
                });
                return;
            }

            const { proposal, deduplicated } = await this.service.generateFailoverProposal(
                parsed.data,
                actor?.userId || 'SYSTEM'
            );

            res.status(201).json({
                success: true,
                deduplicated,
                data: proposal,
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to generate failover proposal.';
            const isNotFound = msg.includes('not found');
            res.status(isNotFound ? 404 : 500).json({
                success: false,
                error: isNotFound ? 'NOT_FOUND' : 'FAILOVER_ERROR',
                message: msg,
            });
        }
    };

    public reviewFailoverProposal = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const actor = this.extractActor(req);
            if (!actor || !FAILOVER_SIGN_OFF_ROLES.has(actor.role)) {
                res.status(403).json({
                    success: false,
                    error: 'FORBIDDEN_CLINICAL_SIGNOFF',
                    message: 'Clinical Governance Lock: Only Pathologists or Lab Directors can sign off on analyzer failover.',
                });
                return;
            }

            const rawId = req.params.proposalId;
            const proposalId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';
            const parsed = FailoverDecisionInputSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    details: parsed.error.issues,
                });
                return;
            }

            const result = await this.service.executeFailoverDecision(
                proposalId,
                parsed.data.decision,
                parsed.data.reviewNotes,
                actor.userId,
                actor.role
            );

            res.status(200).json({
                success: true,
                message: `Proposal ${proposalId} ${parsed.data.decision === 'APPROVE' ? 'APPROVED & ACTIVATED' : 'REJECTED'}.`,
                data: result,
            });
        } catch (error) {
            const isRoleErr = error instanceof Error && error.message.includes('Clinical Governance');
            res.status(isRoleErr ? 403 : 500).json({
                success: false,
                error: isRoleErr ? 'FORBIDDEN' : 'FAILOVER_DECISION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to process failover decision.',
            });
        }
    };

    public listProposals = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const proposals = await this.service.listProposals();
            res.status(200).json({
                success: true,
                data: proposals,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to list proposals.',
            });
        }
    };

    // =========================================================================
    // TAB 4: AI TRAINING & NEURAL SURROGATE STUDIO
    // =========================================================================
    public trainSurrogate = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const actor = this.extractActor(req);
            const parsed = TrainSurrogateModelInputSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    details: parsed.error.issues,
                });
                return;
            }

            const artifact = await this.service.trainSurrogateModel(
                parsed.data,
                actor?.userId || 'SYSTEM'
            );

            res.status(201).json({
                success: true,
                message: `Neural Surrogate Model ${artifact.modelId} trained successfully (R²=${artifact.finalMetrics.rSquared}).`,
                data: artifact,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'TRAINING_ERROR',
                message: error instanceof Error ? error.message : 'Neural surrogate training failed.',
            });
        }
    };

    public trainRLAgent = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const actor = this.extractActor(req);
            const artifact = await this.service.trainQLearningAgent(actor?.userId || 'SYSTEM');

            res.status(201).json({
                success: true,
                message: `Q-Learning Dispatch Policy ${artifact.modelId} trained successfully.`,
                data: artifact,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'RL_TRAINING_ERROR',
                message: error instanceof Error ? error.message : 'Reinforcement learning agent training failed.',
            });
        }
    };

    public predictSurrogate = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const parsed = SurrogatePredictInputSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    details: parsed.error.issues,
                });
                return;
            }

            const result = await this.service.predictWithSurrogate(parsed.data);
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'INFERENCE_ERROR',
                message: error instanceof Error ? error.message : 'Surrogate prediction failed.',
            });
        }
    };

    public listModels = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const models = await this.service.listTrainedModels();
            res.status(200).json({
                success: true,
                data: models,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to list models.',
            });
        }
    };

    public deployModel = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const actor = this.extractActor(req);
            const rawId = req.params.modelId;
            const modelId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';

            const deployed = await this.service.deployModel(modelId, actor?.userId || 'SYSTEM');
            res.status(200).json({
                success: true,
                message: `Model ${modelId} deployed to Laboratory LIS runtime.`,
                data: deployed,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'DEPLOY_ERROR',
                message: error instanceof Error ? error.message : 'Model deployment failed.',
            });
        }
    };

    // =========================================================================
    // TAB 5: WEIBULL FLEET PROGNOSTICS & RUL RADAR
    // =========================================================================
    public getFleetPrognostics = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const prognostics = await this.service.getFleetPrognostics();
            res.status(200).json({
                success: true,
                data: prognostics,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'PROGNOSTICS_ERROR',
                message: error instanceof Error ? error.message : 'Failed to compute fleet prognostics.',
            });
        }
    };

    public scheduleMaintenance = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const actor = this.extractActor(req);
            const parsed = LiveMaintenanceWindowSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    details: parsed.error.issues,
                });
                return;
            }

            const record = await this.service.scheduleMaintenanceWindow(
                parsed.data,
                actor?.userId || 'SYSTEM'
            );

            res.status(201).json({
                success: true,
                message: `Scheduled ${parsed.data.maintenanceType} maintenance for ${parsed.data.analyzerId}.`,
                data: record,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'MAINTENANCE_ERROR',
                message: error instanceof Error ? error.message : 'Failed to schedule maintenance window.',
            });
        }
    };

    public logCalibration = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const actor = this.extractActor(req);
            const parsed = LogCalibrationSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    details: parsed.error.issues,
                });
                return;
            }

            const record = await this.service.logAnalyzerCalibration(
                parsed.data,
                actor?.userId || 'SYSTEM'
            );

            res.status(201).json({
                success: true,
                message: `Logged ${parsed.data.calibrationType || 'calibration'} for analyzer ${parsed.data.analyzerId}.`,
                data: record,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'CALIBRATION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to log calibration.',
            });
        }
    };


    public lockoutAnalyzer = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const actor = this.extractActor(req);
            const parsed = LiveAnalyzerLockoutSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    details: parsed.error.issues,
                });
                return;
            }

            const result = await this.service.putAnalyzerInMaintenanceLockout(
                parsed.data,
                actor?.userId || 'SYSTEM',
                actor?.role || 'TECHNICIAN'
            );

            res.status(200).json({
                success: true,
                message: result.message,
                data: result,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'LOCKOUT_ERROR',
                message: error instanceof Error ? error.message : 'Failed to place analyzer into maintenance lockout.',
            });
        }
    };

    // =========================================================================
    // TAB 6: MULTI-OBJECTIVE PARETO FRONTIER
    // =========================================================================
    public optimizePareto = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const parsed = ParetoOptimizationInputSchema.safeParse(req.body);
            const totalSpecimens = parsed.success ? parsed.data.totalSpecimens : 320;
            const ambient = parsed.success ? parsed.data.ambientTempCelsius : 24.0;
            const statRatio = parsed.success ? parsed.data.statRatio : 0.2;

            const result = await this.service.getParetoOptimizedRouting(totalSpecimens, ambient, statRatio);
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'PARETO_ERROR',
                message: error instanceof Error ? error.message : 'Pareto optimization failed.',
            });
        }
    };

    public applyOperatingPolicy = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const actor = this.extractActor(req);
            const parsed = ApplyOperatingPolicySchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    details: parsed.error.issues,
                });
                return;
            }

            const policy = await this.service.applyOperatingPolicyToLabFloor(
                parsed.data,
                actor?.userId || 'SYSTEM',
                actor?.role || 'LAB_DIRECTOR'
            );

            res.status(200).json({
                success: true,
                message: `Applied operating policy '${policy.name}' (${policy.strategyProfile}) to Hospital Lab Floor.`,
                data: policy,
            });
        } catch (error) {
            const isRoleErr = error instanceof Error && error.message.includes('Lab Directors');
            res.status(isRoleErr ? 403 : 500).json({
                success: false,
                error: isRoleErr ? 'FORBIDDEN' : 'POLICY_ERROR',
                message: error instanceof Error ? error.message : 'Failed to apply operating policy.',
            });
        }
    };

    public getActivePolicy = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const policy = await this.service.getActiveOperatingPolicy();
            res.status(200).json({
                success: true,
                data: policy,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to get active policy.',
            });
        }
    };

    // =========================================================================
    // ADVANCED MATHEMATICAL ENGINES & AUTONOMOUS RECOVERY CONTROLLERS
    // =========================================================================

    public getKalmanTelemetry = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const parsed = KalmanTelemetryInputSchema.safeParse(req.body);
            const input = parsed.success
                ? parsed.data
                : {
                    analyzerId: (req.query.analyzerId as string) || 'ANZ-BIO-01',
                    timeHorizonSeconds: 600,
                    simulatedDisturbance: 'NONE' as const,
                };

            const data = await this.service.getKalmanTelemetryAnalysis(input);
            res.status(200).json({
                success: true,
                data,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'KALMAN_ERROR',
                message: error instanceof Error ? error.message : 'Failed to execute Kalman telemetry estimation.',
            });
        }
    };

    public getBathtubReliability = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const parsed = BathtubReliabilityInputSchema.safeParse(req.body);
            const input = parsed.success
                ? parsed.data
                : {
                    analyzerId: (req.query.analyzerId as string) || 'ANZ-BIO-01',
                    horizonHours: 6000,
                };

            const data = await this.service.getBathtubReliabilityAnalysis(input);
            res.status(200).json({
                success: true,
                data,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'BATHTUB_ERROR',
                message: error instanceof Error ? error.message : 'Failed to compute Bathtub hazard curve.',
            });
        }
    };

    public getPassingBablok = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const parsed = PassingBablokInputSchema.safeParse(req.body);
            const input = parsed.success
                ? parsed.data
                : {
                    primaryAnalyzerId: (req.query.primaryAnalyzerId as string) || 'ANZ-BIO-01',
                    backupAnalyzerId: (req.query.backupAnalyzerId as string) || 'ANZ-BIO-02',
                    analyteCode: (req.query.analyteCode as string) || 'K_SERUM',
                };

            const data = await this.service.getPassingBablokAnalysis(input);
            res.status(200).json({
                success: true,
                data,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'PASSING_BABLOK_ERROR',
                message: error instanceof Error ? error.message : 'Failed to compute Passing-Bablok regression.',
            });
        }
    };

    public evaluatePneumatics = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const parsed = PneumaticsKinematicsInputSchema.safeParse(req.body);
            const input = parsed.success
                ? parsed.data
                : {
                    distanceMeters: 120,
                    pneumaticAirSpeedMps: 7.5,
                    elbowBendCount: 6,
                    hasSoftDecelerationBrake: true,
                };

            const data = this.service.evaluatePneumaticsKinematics(input);
            res.status(200).json({
                success: true,
                data,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'PNEUMATICS_ERROR',
                message: error instanceof Error ? error.message : 'Failed to evaluate pneumatic transport kinematics.',
            });
        }
    };

    public injectChaosScenario = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const actor = this.extractActor(req);
            const parsed = ChaosScenarioInjectionSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    details: parsed.error.issues,
                });
                return;
            }

            const data = await this.service.injectChaosScenario(
                parsed.data,
                actor?.userId || 'USR-DIRECTOR-01'
            );

            res.status(201).json({
                success: true,
                message: `Injected Chaos Failure Scenario '${parsed.data.scenarioType}' into Digital Twin floor.`,
                data,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'CHAOS_INJECTION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to inject chaos scenario.',
            });
        }
    };

    public executeAutonomousRemediation = async (
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        try {
            const actor = this.extractActor(req);
            const parsed = ExecuteAutonomousRemediationSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    details: parsed.error.issues,
                });
                return;
            }

            const data = await this.service.executeAutonomousRemediation(
                parsed.data,
                actor?.userId || 'USR-DIRECTOR-01',
                actor?.role || 'LAB_DIRECTOR'
            );

            res.status(200).json({
                success: true,
                message: 'Autonomous closed-loop clinical remediation executed successfully.',
                data,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'REMEDIATION_EXECUTION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to execute autonomous remediation.',
            });
        }
    };

    public getLiveState = this.getTopology;
    public checkSpecimenStability = this.getStabilityRadar;
    public optimizeFailover = this.generateFailoverProposal;
}

export const digitalTwinController = new DigitalTwinController();