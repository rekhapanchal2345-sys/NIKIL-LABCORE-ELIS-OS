import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import prisma from '../lib/prisma';

const execFileAsync = promisify(execFile);

interface BackupConfig {
  backupDir: string;
  retentionDays: number;
  encryptionEnabled: boolean;
  encryptionSecret: string;
}

interface BackupResult {
  success: boolean;
  backupPath?: string;
  fileName?: string;
  size?: number;
  error?: string;
  timestamp: Date;
}

/**
 * Create a database backup using pg_dump
 */
export const createDatabaseBackup = async (config: BackupConfig): Promise<BackupResult> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `labcore-backup-${timestamp}.sql`;
  const backupPath = path.join(config.backupDir, fileName);

  try {
    // Ensure backup directory exists
    if (!fs.existsSync(config.backupDir)) {
      fs.mkdirSync(config.backupDir, { recursive: true });
    }

    // Get database connection details from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    // Parse DATABASE_URL to get connection details
    const url = new URL(databaseUrl);
    const dbHost = url.hostname;
    const dbPort = url.port || '5432';
    const dbUser = url.username;
    const dbName = url.pathname.slice(1);
    const dbPassword = url.password;

    // Create backup using pg_dump via execFile (avoiding shell injection & global env mutation)
    const dumpArgs = [
      '-h', dbHost,
      '-p', dbPort,
      '-U', dbUser,
      '-d', dbName,
      '--no-owner',
      '--no-acl',
      '--format=plain',
      '-f', backupPath,
    ];

    await execFileAsync('pg_dump', dumpArgs, {
      env: {
        ...process.env,
        PGPASSWORD: dbPassword,
      },
    });

    // Get file size
    const stats = fs.statSync(backupPath);
    const fileSize = stats.size;

    // Encrypt backup if enabled
    let finalBackupPath = backupPath;
    if (config.encryptionEnabled) {
      const encryptedFileName = `${fileName}.enc`;
      const encryptedPath = path.join(config.backupDir, encryptedFileName);
      
      const backupData = fs.readFileSync(backupPath);
      const encryptedData = encryptBackup(backupData, config.encryptionSecret);
      fs.writeFileSync(encryptedPath, encryptedData);
      
      // Delete unencrypted backup
      fs.unlinkSync(backupPath);
      finalBackupPath = encryptedPath;
    }

    // Clean up old backups
    await cleanOldBackups(config);

    return {
      success: true,
      backupPath: finalBackupPath,
      fileName: path.basename(finalBackupPath),
      size: fs.statSync(finalBackupPath).size,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown backup error',
      timestamp: new Date(),
    };
  }
};

/**
 * Encrypt backup data using AES-256-GCM
 */
function encryptBackup(data: Buffer, secret: string): Buffer {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(secret, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(data),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Combine IV + tag + encrypted data
  return Buffer.concat([iv, tag, encrypted]);
}

/**
 * Decrypt backup data
 */
function decryptBackup(encryptedData: Buffer, secret: string): Buffer {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(secret, 'salt', 32);
  const iv = encryptedData.subarray(0, 16);
  const tag = encryptedData.subarray(16, 32);
  const encrypted = encryptedData.subarray(32);

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
}

/**
 * Restore database from backup
 */
export const restoreDatabaseBackup = async (
  backupPath: string,
  encryptionSecret: string,
  isEncrypted: boolean = false
): Promise<BackupResult> => {
  try {
    let sqlData: Buffer;

    if (isEncrypted) {
      const encryptedData = fs.readFileSync(backupPath);
      sqlData = decryptBackup(encryptedData, encryptionSecret);
    } else {
      sqlData = fs.readFileSync(backupPath);
    }

    // Get database connection details
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    const url = new URL(databaseUrl.replace(/^postgresql:\/\//, 'http://'));
    const dbHost = url.hostname;
    const dbPort = url.port || '5432';
    const dbUser = url.username;
    const dbName = url.pathname.slice(1);
    const dbPassword = url.password;

    const tempSqlPath = path.join(path.dirname(backupPath), `restore_temp_${Date.now()}.sql`);
    fs.writeFileSync(tempSqlPath, sqlData);

    // Restore using psql via execFile
    const restoreArgs = [
      '-h', dbHost,
      '-p', dbPort,
      '-U', dbUser,
      '-d', dbName,
      '-f', tempSqlPath,
    ];

    await execFileAsync('psql', restoreArgs, {
      env: {
        ...process.env,
        PGPASSWORD: dbPassword,
      },
    });

    // Clean up temp file
    if (fs.existsSync(tempSqlPath)) {
      fs.unlinkSync(tempSqlPath);
    }

    return {
      success: true,
      backupPath,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown restore error',
      timestamp: new Date(),
    };
  }
};

/**
 * Clean old backups based on retention policy
 */
async function cleanOldBackups(config: BackupConfig): Promise<void> {
  if (!fs.existsSync(config.backupDir)) {
    return;
  }

  const files = fs.readdirSync(config.backupDir);
  const now = Date.now();
  const retentionMs = config.retentionDays * 24 * 60 * 60 * 1000;

  for (const file of files) {
    const filePath = path.join(config.backupDir, file);
    const stats = fs.statSync(filePath);
    const fileAge = now - stats.mtimeMs;

    if (fileAge > retentionMs) {
      fs.unlinkSync(filePath);
      console.log(`Deleted old backup: ${file}`);
    }
  }
}

/**
 * List all available backups
 */
export const listBackups = (backupDir: string): Array<{
  fileName: string;
  size: number;
  createdAt: Date;
  isEncrypted: boolean;
}> => {
  if (!fs.existsSync(backupDir)) {
    return [];
  }

  const files = fs.readdirSync(backupDir);
  return files
    .filter(file => file.startsWith('labcore-backup-'))
    .map(file => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      return {
        fileName: file,
        size: stats.size,
        createdAt: stats.mtime,
        isEncrypted: file.endsWith('.enc'),
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

/**
 * Get backup statistics
 */
export const getBackupStats = (backupDir: string) => {
  const backups = listBackups(backupDir);
  const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
  const encryptedCount = backups.filter(b => b.isEncrypted).length;

  return {
    totalBackups: backups.length,
    totalSize,
    encryptedCount,
    latestBackup: backups[0] || null,
    oldestBackup: backups[backups.length - 1] || null,
  };
};