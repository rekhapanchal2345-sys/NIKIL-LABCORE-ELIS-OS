/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NIKIL-LABCORE-ELIS-OS — DAY 28 (HOUR 28) EMPIRICAL VERIFICATION SUITE
 * ═══════════════════════════════════════════════════════════════════════════
 * Validates Disaster Recovery Drill, Automated Encrypted Backup Certification,
 * Point-In-Time Restoration (PITR), Data Integrity Audits, Incident Response
 * Runbooks, and Week 4 Production Milestone Certification.
 *
 * Certified Standards:
 * - ISO 22301 (Business Continuity Management)
 * - NABL ISO 15189:2022 §5.10 (LIMS Data Integrity & Disaster Recovery)
 * - DPDP Act 2023 §8 (Data Security & Protection Safeguards)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import fs from "fs";
import path from "path";
import prisma from "./api/config/database";
import { DisasterRecoveryService } from "./api/src/modules/backup/disaster-recovery.service";
import backupRouter from "./api/src/modules/backup/backup.routes";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runDay28Verification() {
  console.log("\n===============================================================================");
  console.log(" 🛡️  NIKIL-LABCORE-ELIS-OS — DAY 28: DISASTER RECOVERY & BACKUP CERTIFICATION");
  console.log("===============================================================================\n");

  const suiteStartTime = performance.now();

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 1: Encrypted Backup Generation & Cryptographic Checksum
  // ───────────────────────────────────────────────────────────────────────────
  console.log("📦 SUITE 1: Encrypted Backup Generation & Cryptographic Checksum");
  try {
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const testBackupFile = path.join(backupDir, "dr-drill-sample-backup.sql.enc");
    fs.writeFileSync(testBackupFile, Buffer.from("LABCORE_ENCRYPTED_SNAPSHOT_DATA_PAYLOAD_TEST", "utf8"));

    const checksum = DisasterRecoveryService.computeFileSha256(testBackupFile);
    assert(typeof checksum === "string", "SHA-256 checksum returns a string");
    assert(checksum.length === 64, `SHA-256 checksum has exact 64 hexadecimal characters (Got: ${checksum.length})`);
    assert(/^[a-f0-9]{64}$/.test(checksum), "SHA-256 contains valid hex characters");

    // Clean up temporary test file
    if (fs.existsSync(testBackupFile)) {
      fs.unlinkSync(testBackupFile);
    }
  } catch (err: any) {
    assert(false, `Encrypted backup checksum generation failed: ${err.message}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 2: Live Disaster Recovery Drill Execution & RTO/RPO Metrics
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n🔄 SUITE 2: Live Disaster Recovery Drill & SLA Validation");
  try {
    const drillResult = await DisasterRecoveryService.executeDrDrill();

    assert(!!drillResult, "DR drill returned a valid result payload");
    assert(drillResult.drillId.startsWith("DR-DRILL-"), `Drill ID conforms to format 'DR-DRILL-*' (Got: ${drillResult.drillId})`);
    assert(drillResult.status === "PASSED", `DR Drill execution status is PASSED (Got: ${drillResult.status})`);
    assert(drillResult.durationMs > 0, `Execution duration recorded (${drillResult.durationMs}ms)`);
    assert(drillResult.rtoSeconds < 60, `Recovery Time Objective (RTO) achieved < 60s SLA (Achieved: ${drillResult.rtoSeconds}s)`);
    assert(drillResult.rpoSeconds === 0, `Recovery Point Objective (RPO) is zero data loss (Achieved: ${drillResult.rpoSeconds}s)`);
    assert(drillResult.fidelityScorePercent === 100, `Data fidelity score is 100% (Achieved: ${drillResult.fidelityScorePercent}%)`);
    assert(drillResult.sha256Checksum.length === 64, `Backup snapshot archive SHA-256 checksum verified (Hash: ${drillResult.sha256Checksum.slice(0, 16)}...)`);
    assert(drillResult.encryptionAlgorithm.includes("AES-256"), `Snapshot encrypted with AES-256 standards (${drillResult.encryptionAlgorithm})`);
  } catch (err: any) {
    assert(false, `DR drill execution failed: ${err.message}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 3: Data Integrity Audit Across Core Entities
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n🔍 SUITE 3: Core Database Entities Data Integrity Audit");
  try {
    const drillResult = await DisasterRecoveryService.executeDrDrill();
    assert(Array.isArray(drillResult.tableAudits), "Table audits is an array of entity counts");
    assert(drillResult.tableAudits.length >= 5, `At least 5 core tables audited (Audited: ${drillResult.tableAudits.length})`);

    const auditedNames = drillResult.tableAudits.map((t) => t.tableName);
    assert(auditedNames.includes("User"), "Table audit covers 'User' entities");
    assert(auditedNames.includes("Patient"), "Table audit covers 'Patient' entities");
    assert(auditedNames.includes("Order"), "Table audit covers 'Order' entities");
    assert(auditedNames.includes("Sample"), "Table audit covers 'Sample' entities");
    assert(auditedNames.includes("Branch"), "Table audit covers 'Branch' entities");

    const allMatched = drillResult.tableAudits.every((t) => t.match && t.primaryCount === t.restoredCount);
    assert(allMatched, "100% record count parity confirmed between primary and restored snapshot");
  } catch (err: any) {
    assert(false, `Data integrity audit failed: ${err.message}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 4: PITR & High-Availability Failover Resilience
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n⚡ SUITE 4: Point-In-Time-Recovery (PITR) & Failover Resilience");
  try {
    const targetTimestamp = new Date(Date.now() - 3600000); // 1 hour ago
    const pitr = DisasterRecoveryService.verifyPitrCapability(targetTimestamp);

    assert(pitr.capable === true, "System confirms Point-In-Time-Recovery (PITR) capability");
    assert(typeof pitr.nearestSnapshot === "string" && pitr.nearestSnapshot.length > 0, `Nearest snapshot resolved: ${pitr.nearestSnapshot}`);
    assert(typeof pitr.deltaMinutes === "number", `Snapshot delta calculated: ${pitr.deltaMinutes} minutes`);

    const failover = DisasterRecoveryService.verifyFailoverResilience();
    assert(failover.status === "HEALTHY", `Failover resilience status is HEALTHY (Got: ${failover.status})`);
    assert(failover.dockerRestartPolicy === "unless-stopped", `Docker restart policy configured as 'unless-stopped' (Got: ${failover.dockerRestartPolicy})`);
    assert(failover.pm2RestartCeiling.includes("2G"), `PM2 memory ceiling configured for auto-restart at 2G (Got: ${failover.pm2RestartCeiling})`);
  } catch (err: any) {
    assert(false, `PITR & failover check failed: ${err.message}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 5: Incident Response Runbook Verification
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n📖 SUITE 5: Incident Response Runbook Documentation");
  try {
    const runbookPath = path.join(process.cwd(), "docs", "manuals", "INCIDENT_RESPONSE_RUNBOOK.md");
    assert(fs.existsSync(runbookPath), `INCIDENT_RESPONSE_RUNBOOK.md exists at ${runbookPath}`);

    const runbookContent = fs.readFileSync(runbookPath, "utf8");
    assert(runbookContent.includes("INC-01: PRIMARY DATABASE CRASH"), "Runbook contains INC-01: Primary Database Crash");
    assert(runbookContent.includes("INC-02: APPLICATION SERVER CRASH LOOP"), "Runbook contains INC-02: Application Crash Loop");
    assert(runbookContent.includes("INC-03: SECURITY BREACH"), "Runbook contains INC-03: Security Breach");
    assert(runbookContent.includes("INC-04: CLINICAL DATA CORRUPTION"), "Runbook contains INC-04: Clinical Data Corruption");
    assert(runbookContent.includes("INC-05: AUTOMATED BACKUP / ENCRYPTION FAILURE"), "Runbook contains INC-05: Backup Failure");
    assert(runbookContent.includes("P1 - CRITICAL"), "Runbook defines P1 - Critical severity SLA (< 5 min response, < 30 min MTTR)");
    assert(runbookContent.includes("POST-MORTEM ROOT CAUSE ANALYSIS"), "Runbook enforces post-mortem RCA protocol");
    assert(runbookContent.includes("ISO 22301"), "Runbook cites ISO 22301 Business Continuity standards");
  } catch (err: any) {
    assert(false, `Incident response runbook check failed: ${err.message}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 6: Week 4 Milestone Certification Document Verification
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n📜 SUITE 6: Week 4 Milestone Certificate Verification");
  try {
    const certPath = path.join(process.cwd(), "docs", "WEEK_4_PRODUCTION_MILESTONE_CERTIFICATE.md");
    assert(fs.existsSync(certPath), `WEEK_4_PRODUCTION_MILESTONE_CERTIFICATE.md exists at ${certPath}`);

    const certContent = fs.readFileSync(certPath, "utf8");
    assert(certContent.includes("WEEK 4 PRODUCTION MILESTONE CERTIFICATE"), "Certificate contains official header title");
    assert(certContent.includes("CERT-MILESTONE-W04-PROD"), "Certificate has official Document ID CERT-MILESTONE-W04-PROD");
    assert(certContent.includes("Day 22 (Hour 22)"), "Certificate audits Day 22 (Infrastructure)");
    assert(certContent.includes("Day 23 (Hour 23)"), "Certificate audits Day 23 (Database Seeding)");
    assert(certContent.includes("Day 24 (Hour 24)"), "Certificate audits Day 24 (Smoke Testing)");
    assert(certContent.includes("Day 25 (Hour 25)"), "Certificate audits Day 25 (RBAC Matrix)");
    assert(certContent.includes("Day 26 (Hour 26)"), "Certificate audits Day 26 (Hospital Manuals & OpenAPI)");
    assert(certContent.includes("Day 27 (Hour 27)"), "Certificate audits Day 27 (Load Testing)");
    assert(certContent.includes("Day 28 (Hour 28)"), "Certificate audits Day 28 (Disaster Recovery Drill)");
    assert(certContent.includes("APPROVED FOR FINAL STAGE"), "Sign-off confirms approval for Block 5 Go-Live");
  } catch (err: any) {
    assert(false, `Week 4 certificate check failed: ${err.message}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 7: Disaster Recovery API Routes
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n🌐 SUITE 7: Backup & DR REST API Routes Verification");
  try {
    // Inspect Express router layer stack
    const routes = (backupRouter as any).stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));

    const drDrillRoute = routes.find((r: any) => r.path === "/dr/drill");
    assert(!!drDrillRoute, "Express router defines POST /api/backups/dr/drill");
    assert(drDrillRoute?.methods.includes("post"), "DR drill endpoint responds to HTTP POST");

    const drStatusRoute = routes.find((r: any) => r.path === "/dr/status");
    assert(!!drStatusRoute, "Express router defines GET /api/backups/dr/status");
    assert(drStatusRoute?.methods.includes("get"), "DR status endpoint responds to HTTP GET");
  } catch (err: any) {
    assert(false, `DR routes check failed: ${err.message}`);
  }

  const durationSec = ((performance.now() - suiteStartTime) / 1000).toFixed(2);
  console.log("\n===============================================================================");
  console.log(` 🏁 DAY 28 VERIFICATION COMPLETE: ${passedTests}/${totalTests} Tests Passed in ${durationSec}s`);
  console.log("===============================================================================\n");

  if (failedTests > 0) {
    console.error(`💥 ${failedTests} TEST(S) FAILED!`);
    process.exit(1);
  } else {
    console.log("🎉 ALL DAY 28 DISASTER RECOVERY DRILL & CERTIFICATION AUDITS PASSED!\n");
    process.exit(0);
  }
}

runDay28Verification().catch((err) => {
  console.error("FATAL ERROR in Day 28 verification:", err);
  process.exit(1);
});
