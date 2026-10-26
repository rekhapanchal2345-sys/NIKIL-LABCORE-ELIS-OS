import path from "path";
import fs from "fs";
import { createBackup } from "./backup.service";
import { BackupRetentionService } from "./backup-retention.service";

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), "backups");
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || "";

export class BackupSchedulerService {
  private static timerId: NodeJS.Timeout | null = null;
  private static isRunning = false;
  private static lastRunAt: Date | null = null;
  private static nextRunAt: Date | null = null;

  /**
   * Calculate milliseconds until the next 02:00:00 AM target time
   */
  static getMillisecondsUntilNext2AM(now: Date = new Date()): number {
    const next2AM = new Date(now);
    next2AM.setHours(2, 0, 0, 0);

    // If 2:00 AM has already passed today, schedule for 2:00 AM tomorrow
    if (next2AM.getTime() <= now.getTime()) {
      next2AM.setDate(next2AM.getDate() + 1);
    }

    return next2AM.getTime() - now.getTime();
  }

  /**
   * Execute scheduled backup routine:
   * 1. Create pg_dump with AES-256-GCM encryption
   * 2. Apply GFS 7-4-3 retention policy
   * 3. Run DR integrity check on newest backup
   */
  static async executeDailyBackupRoutine() {
    if (this.isRunning) {
      console.warn("[BackupScheduler] Daily backup routine is already running. Skipping overlapping execution.");
      return;
    }

    this.isRunning = true;
    const startTimestamp = new Date();
    console.log(`[BackupScheduler] Initiating automated 02:00 AM backup run at ${startTimestamp.toISOString()}...`);

    try {
      // 1. Create database backup
      const backupResult = await createBackup();

      if (!backupResult.success || !backupResult.backupPath) {
        console.error(`[BackupScheduler] Backup creation failed: ${backupResult.error}`);
        return {
          success: false,
          error: backupResult.error,
          timestamp: startTimestamp,
        };
      }

      console.log(`[BackupScheduler] ✅ Backup created successfully: ${backupResult.fileName} (${backupResult.size} bytes)`);

      // 2. Apply GFS Retention (7 daily, 4 weekly, 3 monthly)
      const retentionResult = BackupRetentionService.applyRetention(BACKUP_DIR);
      console.log(
        `[BackupScheduler] ✅ GFS Retention applied: ${retentionResult.retained} retained, ${retentionResult.deleted} pruned.`
      );

      // 3. Verify DR integrity of the newly created backup
      let drCheck = null;
      if (fs.existsSync(backupResult.backupPath)) {
        drCheck = BackupRetentionService.verifyBackupIntegrity(backupResult.backupPath, ENCRYPTION_SECRET);
        console.log(`[BackupScheduler] 🛡️ DR Verification status: ${drCheck.status} — ${drCheck.message}`);
      }

      this.lastRunAt = new Date();

      return {
        success: true,
        backup: backupResult,
        retention: retentionResult,
        drCheck,
        timestamp: this.lastRunAt,
      };
    } catch (error) {
      console.error("[BackupScheduler] Critical error in daily backup routine:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown backup scheduler error",
        timestamp: startTimestamp,
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start the recurring daily 2:00 AM background scheduler
   */
  static startScheduler() {
    if (this.timerId) {
      console.log("[BackupScheduler] Scheduler already active.");
      return;
    }

    const scheduleNext = () => {
      const msUntil2AM = this.getMillisecondsUntilNext2AM();
      this.nextRunAt = new Date(Date.now() + msUntil2AM);
      console.log(
        `[BackupScheduler] Next automated backup scheduled for: ${this.nextRunAt.toISOString()} (in ${(msUntil2AM / 1000 / 60).toFixed(1)} mins)`
      );

      this.timerId = setTimeout(async () => {
        try {
          await this.executeDailyBackupRoutine();
        } finally {
          scheduleNext();
        }
      }, msUntil2AM);
    };

    scheduleNext();
  }

  /**
   * Stop the recurring scheduler
   */
  static stopScheduler() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
      this.nextRunAt = null;
      console.log("[BackupScheduler] Scheduler stopped.");
    }
  }

  /**
   * Get scheduler status telemetry
   */
  static getStatus() {
    return {
      isActive: this.timerId !== null,
      isRunning: this.isRunning,
      lastRunAt: this.lastRunAt,
      nextRunAt: this.nextRunAt,
      msUntilNextRun: this.nextRunAt ? Math.max(0, this.nextRunAt.getTime() - Date.now()) : null,
      backupDir: BACKUP_DIR,
      retentionPolicy: "7 Daily + 4 Weekly + 3 Monthly (GFS)",
    };
  }
}
