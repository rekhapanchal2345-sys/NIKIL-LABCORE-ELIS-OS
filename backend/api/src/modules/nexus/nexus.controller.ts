/**
 * LABCORE OMNISCIENT NEXUS — API CONTROLLER
 * 
 * Handles authenticated API requests for the Omniscient Nexus command center,
 * mathematical analytics, and controlled autonomy adjudications.
 */

import { Request, Response } from 'express';
import { NexusService } from './nexus.service';
import { NexusMathEngine } from './nexus.math-engine';
import {
    AutonomyReviewSchema,
    ComputeDescriptiveStatsSchema,
    QueueProcessParamsSchema,
    WeibullReliabilityParamsSchema,
} from './nexus.validation';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        employeeCode?: string;
        email: string;
        fullName: string;
        role: string;
        status?: string;
    };
}

export class NexusController {
    private service = new NexusService();

    /**
     * GET /api/v1/nexus/overview
     * Returns full executive command center overview.
     */
    public getCommandCenterOverview = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const overview = await this.service.getCommandCenterOverview();
            res.json({
                success: true,
                data: overview,
            });
        } catch (error: any) {
            console.error('[NexusController] getCommandCenterOverview error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve Omniscient Nexus Command Center overview',
                error: error.message,
            });
        }
    };

    /**
     * POST /api/v1/nexus/math/descriptive-stats
     * Computes mean, median, IQR, MAD, quantiles, and outlier count on input array.
     */
    public computeDescriptiveStats = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const parsed = ComputeDescriptiveStatsSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid descriptive statistics parameters',
                    errors: parsed.error.issues,
                });
            }

            const stats = NexusMathEngine.computeDescriptiveStatistics(
                parsed.data.values,
                parsed.data.provenance || 'HISTORICAL'
            );

            res.json({
                success: true,
                data: stats,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error computing descriptive statistics',
                error: error.message,
            });
        }
    };

    /**
     * POST /api/v1/nexus/math/queue-process
     * Evaluates Erlang-C wait probability, WIP (Little's Law), and SLA breach risk.
     */
    public evaluateQueueProcess = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const parsed = QueueProcessParamsSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid queue process parameters',
                    errors: parsed.error.issues,
                });
            }

            const result = NexusMathEngine.evaluateQueueProcess(
                parsed.data.department,
                parsed.data.channels,
                parsed.data.arrivalRateLambdaPerHour,
                parsed.data.serviceRateMuPerHour,
                parsed.data.slaTargetMinutes,
                parsed.data.provenance || 'SIMULATED'
            );

            res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error evaluating queue process analytics',
                error: error.message,
            });
        }
    };

    /**
     * POST /api/v1/nexus/math/weibull-reliability
     * Calculates survival probability, hazard rate, and RUL.
     */
    public evaluateWeibull = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const parsed = WeibullReliabilityParamsSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Weibull reliability parameters',
                    errors: parsed.error.issues,
                });
            }

            const result = NexusMathEngine.computeWeibullReliability(
                parsed.data.operatingHoursT,
                parsed.data.etaScaleHours,
                parsed.data.betaShape
            );

            res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error computing Weibull reliability',
                error: error.message,
            });
        }
    };

    /**
     * POST /api/v1/nexus/proposals/:id/review
     * Adjudicates a controlled autonomy proposal with safety gate and audit logging.
     */
    public reviewProposal = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const proposalId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
            const parsed = AutonomyReviewSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid proposal review decision',
                    errors: parsed.error.issues,
                });
            }

            const reviewerId = req.user?.id || 'USR-DIRECTOR-01';
            const reviewerRole = req.user?.role || 'LAB_DIRECTOR';

            const reviewed = await this.service.reviewControlledAutonomyProposal(
                proposalId,
                parsed.data.decision,
                reviewerId,
                reviewerRole,
                parsed.data.reviewNotes
            );

            res.json({
                success: true,
                message: `Controlled autonomy proposal successfully ${parsed.data.decision.toLowerCase()}`,
                data: reviewed,
            });
        } catch (error: any) {
            const isAuth = error.message?.includes('Unauthorized');
            res.status(isAuth ? 403 : 500).json({
                success: false,
                message: error.message || 'Failed to review controlled autonomy proposal',
            });
        }
    };
}

export const nexusController = new NexusController();
