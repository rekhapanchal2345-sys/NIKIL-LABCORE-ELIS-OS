import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, ".env") });

import fs from "fs";
import crypto from "crypto";
import prisma from "./api/config/database";
import { DaybookService, CurrencyDenominations } from "./api/src/modules/cash-counter/daybook.service";
import { BackupRetentionService, BackupMetadata } from "./api/src/modules/backup/backup-retention.service";
import { BackupSchedulerService } from "./api/src/modules/backup/backup-scheduler.service";

async function runDay16Tests() {
  console.log("================================================================================");
  console.log("💰 DAY 16 EMPIRICAL TEST SUITE: CASH SHIFT DAYBOOK & AUTOMATED DATABASE DR");
  console.log("================================================================================\n");

  const runId = Date.now().toString().slice(-6);
  let passedAssertions = 0;

  function assert(condition: boolean, desc: string) {
    if (!condition) {
      console.error(`❌ ASSERTION FAILED: ${desc}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
    passedAssertions++;
    console.log(`  ✓ [ASSERT #${passedAssertions}] ${desc}`);
  }

  // Tracking entities for cleanup
  let testUserId: string | null = null;
  let testCounterId: string | null = null;
  let testSessionId: string | null = null;
  let testPatientId: string | null = null;
  let testOrderId: string | null = null;
  let testPaymentId: string | null = null;
  const tempSandboxDir = path.join(__dirname, `temp_sandbox_${runId}`);

  try {
    // -------------------------------------------------------------------------
    // STEP 1: PHYSICAL CURRENCY DENOMINATION CALCULATOR
    // -------------------------------------------------------------------------
    console.log("🔷 Step 1: Testing Physical Currency Denominations (₹2000 to ₹1)...");

    const testDenominations: CurrencyDenominations = {
      notes_2000: 2,  // 4000
      notes_500: 10,  // 5000
      notes_200: 5,   // 1000
      notes_100: 8,   // 800
      notes_50: 6,    // 300
      notes_20: 10,   // 200
      notes_10: 15,   // 150
      coins_5: 8,     // 40
      coins_2: 3,     // 6
      coins_1: 4,     // 4
    };
    // Expected Sum = 4000 + 5000 + 1000 + 800 + 300 + 200 + 150 + 40 + 6 + 4 = 11500

    const calcResult = DaybookService.calculatePhysicalTotal(testDenominations);
    assert(calcResult.total === 11500, `Calculated physical total must be exactly ₹11,500 (got ₹${calcResult.total})`);
    assert(calcResult.breakdown.length === 10, "Breakdown must cover all 10 Indian currency denominations");

    const note2000 = calcResult.breakdown.find(b => b.denomination === 2000);
    assert(note2000?.subtotal === 4000 && note2000?.type === "NOTE", "₹2000 note subtotal must be ₹4000 with type NOTE");

    const coin5 = calcResult.breakdown.find(b => b.denomination === 5);
    assert(coin5?.subtotal === 40 && coin5?.type === "COIN", "₹5 coin subtotal must be ₹40 with type COIN");

    // Test zero & boundary inputs
    const emptyCalc = DaybookService.calculatePhysicalTotal({});
    assert(emptyCalc.total === 0, "Empty denominations input must yield ₹0 total");

    // -------------------------------------------------------------------------
    // STEP 2: DISCREPANCY & VARIANCE TRIAGE ENGINE
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 2: Testing Discrepancy & Variance Triage Alerts...");

    // Case 2A: Perfect Match
    const balancedAlert = DaybookService.evaluateDiscrepancy(10000, 10000);
    assert(!balancedAlert.hasDiscrepancy, "Exact match must report hasDiscrepancy=false");
    assert(balancedAlert.type === "BALANCED", "Exact match must be of type BALANCED");
    assert(balancedAlert.alertLevel === "INFO", "Balanced cash must have INFO alert level");
    assert(!balancedAlert.requiresSupervisorApproval, "Balanced cash must not require supervisor approval");

    // Case 2B: Minor Shortage (< ₹500)
    const minorShortageAlert = DaybookService.evaluateDiscrepancy(9850, 10000);
    assert(minorShortageAlert.hasDiscrepancy, "Shortage must report hasDiscrepancy=true");
    assert(minorShortageAlert.type === "SHORTAGE", "Variance < 0 must be type SHORTAGE");
    assert(minorShortageAlert.discrepancyAmount === 150, "Shortage amount must be ₹150");
    assert(minorShortageAlert.alertLevel === "WARNING", "Minor shortage must have alertLevel WARNING");
    assert(minorShortageAlert.requiresSupervisorApproval, "Shortage must require supervisor approval");

    // Case 2C: Critical Shortage (>= ₹500)
    const criticalShortageAlert = DaybookService.evaluateDiscrepancy(9200, 10000);
    assert(criticalShortageAlert.alertLevel === "CRITICAL", "Shortage >= ₹500 must trigger CRITICAL alert level");
    assert(criticalShortageAlert.discrepancyAmount === 800, "Critical shortage amount must be ₹800");

    // Case 2D: Surplus (> 0)
    const surplusAlert = DaybookService.evaluateDiscrepancy(10400, 10000);
    assert(surplusAlert.type === "SURPLUS", "Variance > 0 must be type SURPLUS");
    assert(surplusAlert.discrepancyAmount === 400, "Surplus amount must be ₹400");
    assert(surplusAlert.requiresSupervisorApproval, "Surplus must require supervisor approval");

    // -------------------------------------------------------------------------
    // STEP 3: LIVE CASH COUNTER SESSION & DAYBOOK GENERATION
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 3: Setting Up Database Cash Session, Payments & Generating Daybook...");

    // Find or create cashier user
    let user = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `cashier-${runId}@labcore.test`,
          fullName: `Cashier Shift ${runId}`,
          passwordHash: "hash-test-day16",
          role: "ADMIN",
        },
      });
      testUserId = user.id;
    }

    // Create a dedicated cash counter
    const counter = await prisma.cashCounter.create({
      data: {
        counterNumber: `CNT-D16-${runId}`,
        counterName: `Billing Counter Day 16 ${runId}`,
        status: "OPEN",
        openingBalance: 1500.0,
        currentBalance: 1500.0,
        assignedUserId: user.id,
        openedAt: new Date(),
      },
    });
    testCounterId = counter.id;

    // Create session
    const session = await prisma.cashCounterSession.create({
      data: {
        counterId: counter.id,
        userId: user.id,
        openingBalance: 1500.0,
        openedAt: new Date(),
      },
    });
    testSessionId = session.id;

    // Create dummy patient and order for payments
    const patient = await prisma.patient.create({
      data: {
        uhid: `UHID-D16-${runId}`,
        firstName: "Ramesh",
        lastName: "Gupta",
        gender: "MALE",
        dateOfBirth: new Date("1985-05-15"),
        age: 41,
        phone: `98765${runId.slice(-5)}`,
      },
    });
    testPatientId = patient.id;

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-D16-${runId}`,
        barcode: `BC-D16-${runId}`,
        patientId: patient.id,
        subtotal: 3800.0,
        grandTotal: 3800.0,
        paidAmount: 3800.0,
        paymentStatus: "PAID",
      },
    });
    testOrderId = order.id;

    // Record cash payment
    const payment1 = await prisma.payment.create({
      data: {
        receiptNumber: `RCP-CASH-${runId}`,
        orderId: order.id,
        amount: 2000.0,
        method: "CASH",
        counterId: counter.id,
        paidAt: new Date(),
      },
    });
    testPaymentId = payment1.id;

    // Record UPI payment
    await prisma.payment.create({
      data: {
        receiptNumber: `RCP-UPI-${runId}`,
        orderId: order.id,
        amount: 1800.0,
        method: "UPI",
        counterId: counter.id,
        paidAt: new Date(),
      },
    });

    // Generate Daybook
    const daybook = await DaybookService.generateShiftDaybook(session.id);
    assert(daybook.session.id === session.id, "Daybook session ID must match");
    assert(daybook.session.openingBalance === 1500, "Opening balance must match ₹1500");
    assert(daybook.collections.breakdown.cash === 2000, "Cash collections must equal ₹2000");
    assert(daybook.collections.breakdown.upi === 1800, "UPI collections must equal ₹1800");
    assert(daybook.collections.totalCollections === 3800, "Total collections must equal ₹3800");
    assert(daybook.reconciliation.expectedClosingCash === 3500, "Expected cash must be ₹1500 opening + ₹2000 cash = ₹3500");

    // -------------------------------------------------------------------------
    // STEP 4: SHIFT HANDOVER EXECUTION & VARIANCE ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 4: Testing Shift Handover Execution & Discrepancy Lockout...");

    // Attempt handover with ₹50 shortage without variance reason -> MUST FAIL
    let failedWithoutReason = false;
    try {
      await DaybookService.executeShiftHandover({
        sessionId: session.id,
        denominations: {
          notes_500: 6, // 3000
          notes_200: 2, // 400
          notes_50: 1,  // 50 -> Total = 3450 (Shortage of ₹50 from ₹3500)
        },
        varianceReason: "", // Empty reason
      });
    } catch (err: any) {
      failedWithoutReason = true;
      assert(
        err.message.includes("Mandatory varianceReason") || err.code === "VARIANCE_REASON_REQUIRED",
        "Handover without required variance justification must be rejected with 400 error"
      );
    }
    assert(failedWithoutReason, "Shift handover with shortage must be blocked without justification reason");

    // Handover with valid variance reason -> MUST SUCCEED
    const handoverResult = await DaybookService.executeShiftHandover({
      sessionId: session.id,
      denominations: {
        notes_500: 6, // 3000
        notes_200: 2, // 400
        notes_50: 1,  // 50 -> Total 3450
      },
      varianceReason: "Dispensed ₹50 change to emergency patient Ramesh Gupta without receipt",
      supervisorNotes: "Verified with CCTV cashier drawer log. Approved by Administrator.",
    });

    assert(handoverResult.session.closedAt !== null, "Session must have closedAt timestamp populated");
    assert(Number(handoverResult.session.variance) === -50, "Session variance must be recorded as -50");
    assert(handoverResult.counter.status === "CLOSED", "Counter status must transition to CLOSED");
    assert(Number(handoverResult.reconciliation.physicalTotal) === 3450, "Recorded physical cash must be ₹3450");
    assert(handoverResult.counter.denominationData !== null, "Counter must store denomination breakdown JSON");

    // -------------------------------------------------------------------------
    // STEP 5: AUTOMATED 02:00 AM BACKUP SCHEDULER LOGIC
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 5: Testing 02:00 AM Automated Backup Scheduler Math & Status...");

    // Test scheduler calculation
    const msTo2AM = BackupSchedulerService.getMillisecondsUntilNext2AM();
    assert(msTo2AM > 0, "Milliseconds until next 2:00 AM must be strictly positive");
    assert(msTo2AM <= 24 * 60 * 60 * 1000, "Milliseconds until next 2:00 AM must not exceed 24 hours");

    // Target check:
    const targetDate = new Date(Date.now() + msTo2AM);
    assert(targetDate.getHours() === 2 && targetDate.getMinutes() === 0, "Scheduler target time must be exactly 02:00");

    const status = BackupSchedulerService.getStatus();
    assert(status.retentionPolicy.includes("GFS"), "Scheduler must declare GFS retention policy");

    // -------------------------------------------------------------------------
    // STEP 6: AES-256-GCM DATABASE BACKUP & DR INTEGRITY VERIFICATION
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 6: Testing AES-256-GCM Backup Encryption & Disaster Recovery (DR) Integrity...");

    if (!fs.existsSync(tempSandboxDir)) {
      fs.mkdirSync(tempSandboxDir, { recursive: true });
    }

    const testSecret = "labcore-secret-encryption-key-for-dr-test-32bytes";
    const samplePostgresDump = `--
-- PostgreSQL database dump
-- Dumped from database version 15.2
-- Dumped by pg_dump version 15.2

SET statement_timeout = 0;
SET client_encoding = 'UTF8';

CREATE TABLE public.patients (
    id character varying(255) NOT NULL,
    uhid character varying(64) NOT NULL,
    first_name character varying(128) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.orders (
    id character varying(255) NOT NULL,
    order_number character varying(64) NOT NULL,
    total_amount numeric(10,2) NOT NULL
);

INSERT INTO public.patients (id, uhid, first_name) VALUES ('pat_001', 'UHID-1001', 'TestPatient');
-- PostgreSQL database dump complete
`;

    // Write raw unencrypted backup file
    const plainBackupFile = path.join(tempSandboxDir, "labcore-backup-2026-10-26T02-00-00.sql");
    fs.writeFileSync(plainBackupFile, samplePostgresDump, "utf8");

    // Verify unencrypted backup integrity
    const plainDr = BackupRetentionService.verifyBackupIntegrity(plainBackupFile);
    assert(plainDr.status === "HEALTHY", "Plain SQL backup must pass DR verification as HEALTHY");
    assert(plainDr.sqlHeaderVerified, "PostgreSQL database dump header must be verified");
    assert(plainDr.tableCountSample >= 2, `Must detect at least 2 CREATE TABLE statements (found ${plainDr.tableCountSample})`);

    // Encrypt with AES-256-GCM
    const algorithm = "aes-256-gcm";
    const key = crypto.scryptSync(testSecret, "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encryptedBuf = Buffer.concat([cipher.update(Buffer.from(samplePostgresDump, "utf8")), cipher.final()]);
    const tag = cipher.getAuthTag();
    const fullEncryptedPayload = Buffer.concat([iv, tag, encryptedBuf]);

    const encBackupFile = path.join(tempSandboxDir, "labcore-backup-2026-10-26T02-00-00.sql.enc");
    fs.writeFileSync(encBackupFile, fullEncryptedPayload);

    // Verify encrypted backup integrity
    const encDr = BackupRetentionService.verifyBackupIntegrity(encBackupFile, testSecret);
    assert(encDr.status === "HEALTHY", "AES-256-GCM encrypted backup must be verified as HEALTHY");
    assert(encDr.decryptionVerified, "Decryption must be verified successfully");
    assert(encDr.checksumSha256.length === 64, "Must generate valid SHA-256 checksum of encrypted file");

    // Tamper detection: flip 1 byte of the encrypted payload
    const tamperedPayload = Buffer.from(fullEncryptedPayload);
    tamperedPayload[40] = tamperedPayload[40] ^ 0xff; // Corrupt ciphertext
    const tamperedFile = path.join(tempSandboxDir, "labcore-backup-tampered.sql.enc");
    fs.writeFileSync(tamperedFile, tamperedPayload);

    let tamperCaught = false;
    try {
      BackupRetentionService.verifyBackupIntegrity(tamperedFile, testSecret);
    } catch {
      tamperCaught = true;
    }
    assert(tamperCaught, "Tampered ciphertext or auth tag must fail AES-256-GCM verification");

    // -------------------------------------------------------------------------
    // STEP 7: GFS RETENTION ENGINE (7 DAILY + 4 WEEKLY + 3 MONTHLY)
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 7: Testing GFS Backup Retention Engine (7 Daily, 4 Weekly, 3 Monthly)...");

    const gfsSandboxDir = path.join(tempSandboxDir, "gfs_retention_test");
    if (!fs.existsSync(gfsSandboxDir)) {
      fs.mkdirSync(gfsSandboxDir, { recursive: true });
    }

    // Generate 35 mock backups spread across 35 days (covering 5+ weeks and 2 months)
    const mockBackups: BackupMetadata[] = [];
    const baseDate = new Date("2026-10-26T02:00:00Z");

    for (let dayOffset = 0; dayOffset < 35; dayOffset++) {
      const bDate = new Date(baseDate.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      const isoStr = bDate.toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const fName = `labcore-backup-${isoStr}.sql.enc`;

      mockBackups.push({
        fileName: fName,
        filePath: path.join(gfsSandboxDir, fName),
        createdAt: bDate,
        sizeBytes: 1024 * 1024 * (dayOffset + 1),
        isEncrypted: true,
      });
    }

    const gfs = BackupRetentionService.classifyGfs(mockBackups);
    assert(gfs.keepDaily.length === 7, `Daily tier must retain exactly 7 unique days (retained ${gfs.keepDaily.length})`);
    assert(gfs.keepWeekly.length > 0 && gfs.keepWeekly.length <= 4, `Weekly tier must retain up to 4 weeks (retained ${gfs.keepWeekly.length})`);
    assert(gfs.keepMonthly.length > 0 && gfs.keepMonthly.length <= 3, `Monthly tier must retain up to 3 months (retained ${gfs.keepMonthly.length})`);
    assert(gfs.toDelete.length > 0, `Old backups beyond GFS retention must be flagged for deletion (${gfs.toDelete.length} flagged)`);

    const totalRetained = gfs.keepDaily.length + gfs.keepWeekly.length + gfs.keepMonthly.length;
    assert(totalRetained + gfs.toDelete.length === 35, "All 35 backups must be accounted for in retention classification");

    // Create physical files in sandbox and test applyRetention
    for (const b of mockBackups) {
      fs.writeFileSync(b.filePath, "mock-backup-content");
    }

    const pruneResult = BackupRetentionService.applyRetention(gfsSandboxDir);
    assert(pruneResult.retained === totalRetained, `applyRetention must retain exactly ${totalRetained} files`);
    assert(pruneResult.deleted === gfs.toDelete.length, `applyRetention must delete exactly ${gfs.toDelete.length} files`);

    const remainingFiles = fs.readdirSync(gfsSandboxDir).filter(f => f.startsWith("labcore-backup-2026-"));
    assert(remainingFiles.length === totalRetained, `Disk directory must only contain ${totalRetained} surviving backups`);

    console.log("\n================================================================================");
    console.log(`🏆 ALL ${passedAssertions} DAY 16 EMPIRICAL ASSERTIONS PASSED WITH 100% SUCCESS!`);
    console.log("================================================================================\n");

  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log("🧹 Cleaning up Day 16 test artifacts...");

    if (fs.existsSync(tempSandboxDir)) {
      fs.rmSync(tempSandboxDir, { recursive: true, force: true });
    }

    try {
      if (testPaymentId) {
        await prisma.payment.deleteMany({ where: { counterId: testCounterId! } });
      }
      if (testOrderId) {
        await prisma.order.delete({ where: { id: testOrderId } }).catch(() => {});
      }
      if (testPatientId) {
        await prisma.patient.delete({ where: { id: testPatientId } }).catch(() => {});
      }
      if (testSessionId) {
        await prisma.cashCounterSession.delete({ where: { id: testSessionId } }).catch(() => {});
      }
      if (testCounterId) {
        await prisma.cashCounter.delete({ where: { id: testCounterId } }).catch(() => {});
      }
      if (testUserId) {
        await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
      }
    } catch (cleanupErr) {
      console.warn("Notice: Non-critical error during DB test entity cleanup:", cleanupErr);
    }

    await prisma.$disconnect();
    console.log("✅ Cleanup complete.");
  }
}

runDay16Tests().catch((err) => {
  console.error("FATAL: Day 16 Test Suite Failed:", err);
  process.exit(1);
});
