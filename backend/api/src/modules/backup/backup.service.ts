import { createDatabaseBackup, restoreDatabaseBackup, listBackups, getBackupStats } from '../../utils/backup';
import path from 'path';

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || '';
const ENCRYPTION_ENABLED = ENCRYPTION_SECRET.length >= 32;

interface BackupConfig {
  backupDir: string;
  retentionDays: number;
  encryptionEnabled: boolean;
  encryptionSecret: string;
}

/**
 * Create a manual backup
 */
export const createBackup = async () => {
  const config: BackupConfig = {
    backupDir: BACKUP_DIR,
    retentionDays: RETENTION_DAYS,
    encryptionEnabled: ENCRYPTION_ENABLED,
    encryptionSecret: ENCRYPTION_SECRET,
  };

  return await createDatabaseBackup(config);
};

/**
 * Restore from a backup
 */
export const restoreBackup = async (fileName: string) => {
  const safeFileName = path.basename(fileName);
  const backupPath = path.join(BACKUP_DIR, safeFileName);
  const isEncrypted = safeFileName.endsWith('.enc');

  if (!ENCRYPTION_ENABLED && isEncrypted) {
    throw new Error('Cannot restore encrypted backup without encryption secret');
  }

  return await restoreDatabaseBackup(backupPath, ENCRYPTION_SECRET, isEncrypted);
};

/**
 * Get list of all backups
 */
export const getAllBackups = () => {
  return listBackups(BACKUP_DIR);
};

/**
 * Get backup statistics
 */
export const getBackupStatistics = () => {
  return getBackupStats(BACKUP_DIR);
};

/**
 * Delete a specific backup
 */
export const deleteBackup = (fileName: string): boolean => {
  const fs = require('fs');
  const safeFileName = path.basename(fileName);
  const backupPath = path.join(BACKUP_DIR, safeFileName);

  if (fs.existsSync(backupPath)) {
    fs.unlinkSync(backupPath);
    return true;
  }

  return false;
};