import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { authorize } from '../../../middleware/rbac.middleware';
import { UserRole } from '@prisma/client';
import {
  createBackupController,
  restoreBackupController,
  getBackupsController,
  getBackupStatsController,
  deleteBackupController,
} from './backup.controller';

const router = Router();

// All backup routes require authentication and SUPER_ADMIN role
router.use(authenticate);
router.use(authorize(UserRole.SUPER_ADMIN));

/**
 * @route   POST /api/backups
 * @desc    Create a new database backup
 * @access  Super Admin only
 */
router.post('/', createBackupController);

/**
 * @route   POST /api/backups/restore/:fileName
 * @desc    Restore database from backup
 * @access  Super Admin only
 */
router.post('/restore/:fileName', restoreBackupController);

/**
 * @route   GET /api/backups
 * @desc    Get all available backups
 * @access  Super Admin only
 */
router.get('/', getBackupsController);

/**
 * @route   GET /api/backups/stats
 * @desc    Get backup statistics
 * @access  Super Admin only
 */
router.get('/stats', getBackupStatsController);

/**
 * @route   DELETE /api/backups/:fileName
 * @desc    Delete a specific backup
 * @access  Super Admin only
 */
router.delete('/:fileName', deleteBackupController);

export default router;