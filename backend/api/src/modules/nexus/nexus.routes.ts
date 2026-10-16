/**
 * LABCORE OMNISCIENT NEXUS — ROUTE DEFINITIONS
 * 
 * Secure routes for the Omniscient Nexus Command Center, mathematical engines,
 * and controlled autonomy workflows.
 */

import { Router, RequestHandler } from 'express';
import { nexusController } from './nexus.controller';
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

// =========================================================================
// 3. CONTROLLED AUTONOMY ADJUDICATION
// =========================================================================
router.post('/proposals/:id/review', nexusController.reviewProposal);
router.post('/proposals/:id/decision', nexusController.reviewProposal);

export default router;
