import 'dotenv/config';

// ─── ISS-004: MANDATORY DESTRUCTIVE-RESET SAFETY GUARD ─────────────────────
if (process.env.NODE_ENV === 'production') {
  console.error('❌ SAFETY ABORT: reset-all-data.ts is FORBIDDEN in NODE_ENV=production.');
  console.error('   This script would irreversibly delete ALL clinical records and financial ledgers.');
  process.exit(1);
}

const _DB_URL = (process.env.DATABASE_URL || '').toLowerCase();
if (_DB_URL && !_DB_URL.includes('localhost') && !_DB_URL.includes('127.0.0.1')) {
  console.error('❌ SAFETY ABORT: DATABASE_URL does not point to localhost/127.0.0.1.');
  console.error('   This script is only allowed against local development databases.');
  process.exit(1);
}

if (process.env.ALLOW_DESTRUCTIVE_RESET !== 'I_UNDERSTAND_DATA_LOSS') {
  console.error('❌ SAFETY ABORT: Set ALLOW_DESTRUCTIVE_RESET=I_UNDERSTAND_DATA_LOSS in your local .env to proceed.');
  process.exit(1);
}
// ────────────────────────────────────────────────────────────────────────────

import prisma from "../api/config/database";

async function resetAllData() {
  try {
    console.log("Starting data reset process...");
    console.log("⚠️  This will delete ALL data except user accounts!\n");

    // Delete in order of foreign key dependencies
    console.log("Deleting result values...");
    await prisma.resultValue.deleteMany();

    console.log("Deleting critical value acknowledgments...");
    await prisma.criticalValueAcknowledgment.deleteMany();

    console.log("Deleting reference ranges...");
    await prisma.referenceRange.deleteMany();

    console.log("Deleting test parameters...");
    await prisma.testParameter.deleteMany();

    console.log("Deleting results...");
    await prisma.result.deleteMany();

    console.log("Deleting sample tracking history...");
    await prisma.sampleTrackingHistory.deleteMany();

    console.log("Deleting samples...");
    await prisma.sample.deleteMany();

    console.log("Deleting order items...");
    await prisma.orderItem.deleteMany();

    console.log("Deleting payments...");
    await prisma.payment.deleteMany();

    console.log("Deleting invoices...");
    await prisma.invoice.deleteMany();

    console.log("Deleting orders...");
    await prisma.order.deleteMany();

    console.log("Deleting test package items...");
    await prisma.testPackageItem.deleteMany();

    console.log("Deleting test packages...");
    await prisma.testPackage.deleteMany();

    console.log("Deleting tests...");
    await prisma.test.deleteMany();

    console.log("Deleting test categories...");
    await prisma.testCategory.deleteMany();

    console.log("Deleting patients...");
    await prisma.patient.deleteMany();

    console.log("Deleting doctors...");
    await prisma.doctor.deleteMany();

    console.log("Deleting communication logs...");
    await prisma.communicationLog.deleteMany();

    console.log("Deleting notification templates...");
    await prisma.notificationTemplate.deleteMany();

    console.log("Deleting reports...");
    await prisma.report.deleteMany();

    console.log("Deleting approvals...");
    await prisma.approval.deleteMany();

    console.log("Deleting amendments...");
    await prisma.resultAmendment.deleteMany();

    console.log("Deleting analyzer related data...");
    await prisma.analyzerTestMapping.deleteMany();
    await prisma.qCRule.deleteMany();
    await prisma.maintenance.deleteMany();
    await prisma.calibration.deleteMany();
    await prisma.analyzerJob.deleteMany();
    await prisma.analyzer.deleteMany();

    console.log("Deleting user sessions (except current)...");
    await prisma.userSession.deleteMany();

    console.log("Deleting password history...");
    await prisma.passwordHistory.deleteMany();

    console.log("Deleting MFA backup codes...");
    await prisma.mfaBackupCode.deleteMany();

    console.log("Deleting role permissions...");
    await prisma.rolePermission.deleteMany();

    console.log("Deleting audit logs...");
    await prisma.auditLog.deleteMany();

    console.log("\n✅ All data reset completed successfully!");
    console.log("User accounts have been preserved.");

  } catch (error) {
    console.error("Error resetting data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetAllData()
  .then(() => {
    console.log("\nData reset process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Data reset process failed:", error);
    process.exit(1);
  });
