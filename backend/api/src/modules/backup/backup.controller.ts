import { Response } from 'express';
import type { AuthenticatedRequest } from '../../../middleware/auth';
import {
  createBackup,
  restoreBackup,
  getAllBackups,
  getBackupStatistics,
  deleteBackup,
} from './backup.service';

/**
 * Create a new database backup
 */
export const createBackupController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    // Only admins can create backups
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
    // Only admins can restore backups
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
    // Only admins can view backups
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
    // Only admins can view backup statistics
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
    // Only admins can delete backups
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
