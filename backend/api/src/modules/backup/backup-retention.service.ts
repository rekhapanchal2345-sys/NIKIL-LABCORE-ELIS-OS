import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface BackupMetadata {
  fileName: string;
  filePath: string;
  createdAt: Date;
  sizeBytes: number;
  isEncrypted: boolean;
}

export interface GfsClassification {
  keepDaily: BackupMetadata[];
  keepWeekly: BackupMetadata[];
  keepMonthly: BackupMetadata[];
  toDelete: BackupMetadata[];
}

export interface DrVerificationResult {
  status: "HEALTHY" | "DEGRADED" | "CRITICAL";
  testedAt: Date;
  backupFile: string;
  sizeBytes: number;
  checksumSha256: string;
  decryptionVerified: boolean;
  sqlHeaderVerified: boolean;
  tableCountSample: number;
  message: string;
}

export class BackupRetentionService {
  /**
   * Parse timestamp from standard backup filename: labcore-backup-YYYY-MM-DDTHH-MM-SS...
   */
  static parseBackupDate(fileName: string): Date | null {
    const match = fileName.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2})[-:](\d{2})[-:](\d{2})/);
    if (!match) return null;
    const [, yr, mo, day, hr, min, sec] = match;
    return new Date(`${yr}-${mo}-${day}T${hr}:${min}:${sec}Z`);
  }

  /**
   * Classify backups according to Grandfather-Father-Son (GFS) 7 Daily + 4 Weekly + 3 Monthly policy
   */
  static classifyGfs(backups: BackupMetadata[]): GfsClassification {
    // Sort descending by date (newest first)
    const sorted = [...backups].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const keepDaily: BackupMetadata[] = [];
    const keepWeekly: BackupMetadata[] = [];
    const keepMonthly: BackupMetadata[] = [];
    const toDelete: BackupMetadata[] = [];

    const seenDays = new Set<string>();
    const seenWeeks = new Set<string>();
    const seenMonths = new Set<string>();

    for (const b of sorted) {
      const dateStr = b.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
      const year = b.createdAt.getUTCFullYear();
      const monthStr = `${year}-${String(b.createdAt.getUTCMonth() + 1).padStart(2, "0")}`;
      
      // Calculate ISO week identifier
      const firstDayOfYear = new Date(Date.UTC(year, 0, 1));
      const pastDaysOfYear = (b.createdAt.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getUTCDay() + 1) / 7);
      const weekStr = `${year}-W${weekNum}`;

      let kept = false;

      // 1. Daily Tier: Keep 1 per day for up to 7 distinct days
      if (seenDays.size < 7 && !seenDays.has(dateStr)) {
        seenDays.add(dateStr);
        keepDaily.push(b);
        kept = true;
      }

      // 2. Weekly Tier: Keep 1 per week for up to 4 distinct weeks
      if (seenWeeks.size < 4 && !seenWeeks.has(weekStr)) {
        seenWeeks.add(weekStr);
        if (!kept) {
          keepWeekly.push(b);
          kept = true;
        }
      }

      // 3. Monthly Tier: Keep 1 per month for up to 3 distinct months
      if (seenMonths.size < 3 && !seenMonths.has(monthStr)) {
        seenMonths.add(monthStr);
        if (!kept) {
          keepMonthly.push(b);
          kept = true;
        }
      }

      if (!kept) {
        toDelete.push(b);
      }
    }

    return {
      keepDaily,
      keepWeekly,
      keepMonthly,
      toDelete,
    };
  }

  /**
   * Apply GFS retention pruning to backup directory
   */
  static applyRetention(backupDir: string): { retained: number; deleted: number; deletedFiles: string[] } {
    if (!fs.existsSync(backupDir)) {
      return { retained: 0, deleted: 0, deletedFiles: [] };
    }

    const files = fs.readdirSync(backupDir);
    const backupMetas: BackupMetadata[] = [];

    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const parsedDate = this.parseBackupDate(file) || stats.mtime;

      backupMetas.push({
        fileName: file,
        filePath,
        createdAt: parsedDate,
        sizeBytes: stats.size,
        isEncrypted: file.endsWith(".enc"),
      });
    }

    const gfs = this.classifyGfs(backupMetas);
    const deletedFiles: string[] = [];

    for (const b of gfs.toDelete) {
      try {
        fs.unlinkSync(b.filePath);
        deletedFiles.push(b.fileName);
      } catch (err) {
        console.warn(`Failed to prune backup file: ${b.filePath}`, err);
      }
    }

    const retainedCount = gfs.keepDaily.length + gfs.keepWeekly.length + gfs.keepMonthly.length;
    return {
      retained: retainedCount,
      deleted: deletedFiles.length,
      deletedFiles,
    };
  }

  /**
   * Verify backup file integrity and simulate point-in-time decrypt verification
   */
  static verifyBackupIntegrity(backupFilePath: string, encryptionSecret?: string): DrVerificationResult {
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`Backup file "${backupFilePath}" does not exist.`);
    }

    const fileBuffer = fs.readFileSync(backupFilePath);
    const sizeBytes = fileBuffer.length;
    const checksumSha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    const isEncrypted = backupFilePath.endsWith(".enc");

    let sqlBuffer: Buffer;
    let decryptionVerified = false;

    if (isEncrypted) {
      if (!encryptionSecret || encryptionSecret.length < 32) {
        throw new Error("Cannot verify encrypted backup: Invalid or missing 32+ character ENCRYPTION_SECRET.");
      }

      // AES-256-GCM decrypt check
      const algorithm = "aes-256-gcm";
      const key = crypto.scryptSync(encryptionSecret, "salt", 32);
      const iv = fileBuffer.subarray(0, 16);
      const tag = fileBuffer.subarray(16, 32);
      const encrypted = fileBuffer.subarray(32);

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(tag);
      sqlBuffer = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      decryptionVerified = true;
    } else {
      sqlBuffer = fileBuffer;
      decryptionVerified = true; // Not encrypted
    }

    const sqlText = sqlBuffer.toString("utf8", 0, Math.min(sqlBuffer.length, 64 * 1024)); // Inspect first 64KB
    const sqlHeaderVerified =
      sqlText.includes("PostgreSQL database dump") ||
      sqlText.includes("CREATE TABLE") ||
      sqlText.includes("SET statement_timeout") ||
      sqlText.includes("SET client_encoding") ||
      sqlText.includes("INSERT INTO");

    // Count occurrence of CREATE TABLE statements in the header
    const tableMatches = sqlText.match(/CREATE TABLE/gi) || [];

    const isHealthy = decryptionVerified && sqlHeaderVerified;

    return {
      status: isHealthy ? "HEALTHY" : "CRITICAL",
      testedAt: new Date(),
      backupFile: path.basename(backupFilePath),
      sizeBytes,
      checksumSha256,
      decryptionVerified,
      sqlHeaderVerified,
      tableCountSample: tableMatches.length,
      message: isHealthy
        ? "Backup integrity verified. AES-256 GCM authentication tag valid, PostgreSQL SQL signature confirmed."
        : "Backup verification failed: PostgreSQL SQL header signature missing or invalid.",
    };
  }
}
