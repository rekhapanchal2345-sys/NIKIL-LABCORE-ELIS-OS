import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../../../middleware/auth.middleware';
import { authorize } from '../../../middleware/rbac.middleware';
import {
  createBackupController,
  restoreBackupController,
  getBackupsController,
  getBackupStatsController,
  deleteBackupController,
  applyRetentionController,
  getGfsStatusController,
  verifyBackupController,
  getSchedulerStatusController,
  triggerScheduledBackupNowController,
  executeDrDrillController,
  getDrStatusController,
} from './backup.controller';

const router = Router();

// All backup routes require authentication and SUPER_ADMIN or ADMIN privileges
router.use(authenticate);
router.use(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN));

/**
 * @route   POST /api/backups
 * @desc    Create a new database backup with AES-256-GCM encryption
 */
router.post('/', createBackupController);

/**
 * @route   POST /api/backups/restore/:fileName
 * @desc    Restore database from backup
 */
router.post('/restore/:fileName', restoreBackupController);

/**
 * @route   GET /api/backups
 * @desc    Get all available backups
 */
router.get('/', getBackupsController);

/**
 * @route   GET /api/backups/stats
 * @desc    Get backup statistics
 */
router.get('/stats', getBackupStatsController);

/**
 * @route   POST /api/backups/retention/apply
 * @desc    Apply GFS 7 Daily + 4 Weekly + 3 Monthly retention pruning
 */
router.post('/retention/apply', applyRetentionController);

/**
 * @route   GET /api/backups/gfs
 * @desc    Get GFS retention classification breakdown
 */
router.get('/gfs', getGfsStatusController);

/**
 * @route   POST /api/backups/verify/:fileName
 * @desc    Verify Disaster Recovery (DR) integrity (AES-256 decryption & SQL header check)
 */
router.post('/verify/:fileName', verifyBackupController);

/**
 * @route   GET /api/backups/scheduler/status
 * @desc    Get 02:00 AM automated backup scheduler telemetry
 */
router.get('/scheduler/status', getSchedulerStatusController);

/**
 * @route   POST /api/backups/scheduler/trigger
 * @desc    Trigger automated 02:00 AM backup routine on-demand
 */
router.post('/scheduler/trigger', triggerScheduledBackupNowController);

/**
 * @route   POST /api/backups/dr/drill
 * @desc    Execute live Disaster Recovery drill (backup + staging integrity audit)
 */
router.post('/dr/drill', executeDrDrillController);

/**
 * @route   GET /api/backups/dr/status
 * @desc    Get Disaster Recovery PITR and failover resilience status
 */
router.get('/dr/status', getDrStatusController);

/**
 * @route   DELETE /api/backups/:fileName
 * @desc    Delete a specific backup
 */
router.delete('/:fileName', deleteBackupController);

export default router;
