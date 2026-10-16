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
} from './backup.controller';

const router = Router();

// All backup routes require authentication
router.use(authenticate);
router.use(authorize(UserRole.SUPER_ADMIN));

/**
 * @route   POST /api/backups
 * @desc    Create a new database backup
 * @access  SUPER_ADMIN, ADMIN
 * ISS-002: Router-level RBAC — controller-only checks are insufficient and
 *          previously locked SUPER_ADMIN out of backup operations.
 */
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), createBackupController);

/**
 * @route   POST /api/backups/restore/:fileName
 * @desc    Restore database from backup
 * @access  SUPER_ADMIN, ADMIN
 * ISS-002: fileName path-traversal sanitisation applied in backup.service.ts
 */
router.post('/restore/:fileName', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), restoreBackupController);

/**
 * @route   GET /api/backups
 * @desc    Get all available backups
 * @access  SUPER_ADMIN, ADMIN
 */
router.get('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), getBackupsController);

/**
 * @route   GET /api/backups/stats
 * @desc    Get backup statistics
 * @access  SUPER_ADMIN, ADMIN
 */
router.get('/stats', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), getBackupStatsController);

/**
 * @route   DELETE /api/backups/:fileName
 * @desc    Delete a specific backup
 * @access  SUPER_ADMIN, ADMIN
 * ISS-002: path.basename sanitisation enforced in backup.service.ts before fs.unlinkSync
 */
router.delete('/:fileName', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), deleteBackupController);

export default router;
