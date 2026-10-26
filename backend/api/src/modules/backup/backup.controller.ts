import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import type { AuthenticatedRequest } from '../../../middleware/auth';
import {
  createBackup,
  restoreBackup,
  getAllBackups,
  getBackupStatistics,
  deleteBackup,
} from './backup.service';
import { BackupRetentionService, BackupMetadata } from './backup-retention.service';
import { BackupSchedulerService } from './backup-scheduler.service';

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || '';

/**
 * Create a new database backup
 */
export const createBackupController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can create backups',
      });
    }

    const result = await createBackup();

    if (result.success) {
      res.json({
        success: true,
        message: 'Backup created successfully',
        data: result,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Backup creation failed',
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Backup creation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Restore database from backup
 */
export const restoreBackupController = async (
  req: AuthenticatedRequest<{ fileName: string }>,
  res: Response,
) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can restore backups',
      });
    }

    const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'Backup file name is required',
      });
    }

    const result = await restoreBackup(fileName);

    if (result.success) {
      res.json({
        success: true,
        message: 'Database restored successfully',
        data: result,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Database restoration failed',
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database restoration failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get all available backups
 */
export const getBackupsController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view backups',
      });
    }

    const backups = getAllBackups();

    res.json({
      success: true,
      data: backups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve backups',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get backup statistics
 */
export const getBackupStatsController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view backup statistics',
      });
    }

    const stats = getBackupStatistics();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve backup statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete a backup
 */
export const deleteBackupController = async (req: AuthenticatedRequest<{ fileName: string }>, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete backups',
      });
    }

    const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'Backup file name is required',
      });
    }

    const deleted = deleteBackup(fileName);

    if (deleted) {
      res.json({
        success: true,
        message: 'Backup deleted successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Backup file not found',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete backup',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Apply GFS (Grandfather-Father-Son) 7 Daily + 4 Weekly + 3 Monthly retention pruning
 */
export const applyRetentionController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can trigger backup retention pruning',
      });
    }

    const result = BackupRetentionService.applyRetention(BACKUP_DIR);

    res.json({
      success: true,
      message: `GFS retention applied: ${result.retained} backups retained, ${result.deleted} pruned.`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to apply backup retention policy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Inspect GFS classification of existing backups
 */
export const getGfsStatusController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view GFS backup classification',
      });
    }

    if (!fs.existsSync(BACKUP_DIR)) {
      return res.json({
        success: true,
        data: { keepDaily: [], keepWeekly: [], keepMonthly: [], toDelete: [] },
      });
    }

    const files = fs.readdirSync(BACKUP_DIR);
    const backupMetas: BackupMetadata[] = [];

    for (const file of files) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const parsedDate = BackupRetentionService.parseBackupDate(file) || stats.mtime;

      backupMetas.push({
        fileName: file,
        filePath,
        createdAt: parsedDate,
        sizeBytes: stats.size,
        isEncrypted: file.endsWith('.enc'),
      });
    }

    const classification = BackupRetentionService.classifyGfs(backupMetas);

    res.json({
      success: true,
      data: classification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve GFS classification',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Verify Disaster Recovery (DR) integrity for a backup file
 */
export const verifyBackupController = async (req: AuthenticatedRequest<{ fileName: string }>, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can run disaster recovery integrity checks',
      });
    }

    const { fileName } = req.params;
    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'Target backup fileName is required',
      });
    }

    const targetPath = path.join(BACKUP_DIR, path.basename(fileName));
    const result = BackupRetentionService.verifyBackupIntegrity(targetPath, ENCRYPTION_SECRET);

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Disaster recovery verification failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get automated backup scheduler status
 */
export const getSchedulerStatusController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view scheduler status',
      });
    }

    const status = BackupSchedulerService.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve scheduler status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Run automated backup routine immediately on demand
 */
export const triggerScheduledBackupNowController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can trigger scheduled backup execution',
      });
    }

    const result = await BackupSchedulerService.executeDailyBackupRoutine();
    res.json({
      success: true,
      message: 'Daily backup routine executed successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to execute scheduled backup routine',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
