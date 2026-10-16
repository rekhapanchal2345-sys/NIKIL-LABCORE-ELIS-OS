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
const SAFE_FILENAME_RE = /^[a-zA-Z0-9._-]+(\.(sql|dump|gz|enc))+$/;

/**
 * Sanitise a user-supplied backup fileName to prevent path traversal.
 * ISS-002: Ensures the resolved path stays within BACKUP_DIR.
 */
const sanitiseBackupFileName = (fileName: string): string => {
  const safe = path.basename(fileName);
  if (!SAFE_FILENAME_RE.test(safe)) {
    throw new Error(`Invalid backup file name: "${safe}". Only alphanumeric names with .sql/.dump/.gz/.enc extensions are permitted.`);
  }
  const resolved = path.resolve(BACKUP_DIR, safe);
  const dirResolved = path.resolve(BACKUP_DIR);
  if (!resolved.startsWith(dirResolved + path.sep) && resolved !== dirResolved) {
    throw new Error('Path traversal attempt detected in backup file name.');
  }
  return safe;
};

export const restoreBackup = async (fileName: string) => {
  const safeName = sanitiseBackupFileName(fileName); // ISS-002: path traversal prevention
  const backupPath = path.join(BACKUP_DIR, safeName);
  const isEncrypted = safeName.endsWith('.enc');

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
  // ISS-002: sanitise before any filesystem operation to prevent path traversal
  const safeName = sanitiseBackupFileName(fileName);
  const fs = require('fs');
  const backupPath = path.join(BACKUP_DIR, safeName);

  if (fs.existsSync(backupPath)) {
    fs.unlinkSync(backupPath);
    return true;
  }

  return false;
};