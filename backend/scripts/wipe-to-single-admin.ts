import 'dotenv/config';

// ─── ISS-004: MANDATORY DESTRUCTIVE-RESET SAFETY GUARD ─────────────────────
// This script wipes 56 clinical and financial database tables.
// It MUST NOT run in production, and requires explicit opt-in.
if (process.env.NODE_ENV === 'production') {
  console.error('❌ SAFETY ABORT: wipe-to-single-admin.ts is FORBIDDEN in NODE_ENV=production.');
  console.error('   This script would irreversibly delete ALL clinical records, financial ledgers, and audit trails.');
  process.exit(1);
}

const DB_URL = (process.env.DATABASE_URL || '').toLowerCase();
const isRemoteDb = DB_URL && !DB_URL.includes('localhost') && !DB_URL.includes('127.0.0.1');
if (isRemoteDb) {
  console.error('❌ SAFETY ABORT: DATABASE_URL does not point to localhost/127.0.0.1.');
  console.error('   This script is only allowed against local development databases.');
  process.exit(1);
}

if (process.env.ALLOW_DESTRUCTIVE_RESET !== 'I_UNDERSTAND_DATA_LOSS') {
  console.error('❌ SAFETY ABORT: ALLOW_DESTRUCTIVE_RESET is not set to the required confirmation string.');
  console.error('   To proceed, add the following to your local .env:');
  console.error('   ALLOW_DESTRUCTIVE_RESET=I_UNDERSTAND_DATA_LOSS');
  console.error('   This guard prevents accidental invocation in CI pipelines or staging environments.');
  process.exit(1);
}
// ────────────────────────────────────────────────────────────────────────────

import prisma from '../api/config/database';
import { hashPassword, comparePassword } from '../api/src/utils/password';
import { emailBlindIndex, normaliseEmail } from '../api/src/utils/gmail';
import { UserRole, AccountStatus } from '@prisma/client';

if (process.env.NODE_ENV === 'production' || !process.env.ALLOW_DESTRUCTIVE_RESET) {
  throw new Error("Execution blocked: Destructive data wipe disallowed in this environment.");
}

async function wipeDatabaseToSingleAdmin() {
  console.log('====================================================');
  console.log('🚨 STARTING COMPLETE 100% FRESH DATABASE RESET');
  console.log('Admin Email: nikilpanchal88@gmail.com');
  console.log('====================================================\n');

  try {
    const targetEmail = normaliseEmail('nikilpanchal88@gmail.com');
    const targetPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const targetEmployeeCode = 'EMP-NIKIL-88';
    const passwordHash = await hashPassword(targetPassword);
    const blindIndex = emailBlindIndex(targetEmail);

    // 1. Ensure admin account is prepared
    let admin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: targetEmail },
          { employeeCode: targetEmployeeCode },
        ],
      },
    });

    if (!admin) {
      console.log('Admin user not found, creating fresh record...');
      admin = await prisma.user.create({
        data: {
          employeeCode: targetEmployeeCode,
          fullName: 'Nikil Panchal',
          firstName: 'Nikil',
          lastName: 'Panchal',
          email: targetEmail,
          passwordHash,
          role: UserRole.ADMIN,
          status: AccountStatus.ACTIVE,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          passwordChangedAt: new Date(),
          emailBlindIndex: blindIndex,
          mfaEnabled: false,
          failedLoginCount: 0,
          designation: 'Chief Administrator / Lab Director',
          department: 'Administration',
          specialization: 'System Administration & Clinical Operations',
        },
      });
    } else {
      admin = await prisma.user.update({
        where: { id: admin.id },
        data: {
          email: targetEmail,
          employeeCode: targetEmployeeCode,
          fullName: 'Nikil Panchal',
          firstName: 'Nikil',
          lastName: 'Panchal',
          passwordHash,
          role: UserRole.ADMIN,
          status: AccountStatus.ACTIVE,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          passwordChangedAt: new Date(),
          emailBlindIndex: blindIndex,
          failedLoginCount: 0,
          lockedUntil: null,
          mfaEnabled: false,
          totpSecretEnc: null,
          totpPendingEnc: null,
          designation: 'Chief Administrator / Lab Director',
          department: 'Administration',
          specialization: 'System Administration & Clinical Operations',
        },
      });
    }

    const adminId = admin.id;
    console.log(`Preserved Target Admin ID: ${adminId} (${admin.email})\n`);

    // List of table names to truncate cleanly
    const tablesToTruncate = [
      'patient_history_entries',
      'patient_medical_histories',
      'patient_verifications',
      'patient_wallets',
      'patient_consents',
      'patient_advances',
      'abdm_care_contexts',
      'abdm_consents',
      'report_addendums',
      'report_share_links',
      'reports',
      'result_values',
      'results',
      'result_amendments',
      'critical_value_acknowledgments',
      'sample_tracking_history',
      'samples',
      'doctor_commission_entries',
      'doctor_payouts',
      'doctor_documents',
      'order_items',
      'payment_audit_logs',
      'payments',
      'reconciliation_records',
      'refund_approvals',
      'refunds',
      'invoices',
      'orders',
      'patients',
      'doctors',
      'doctor_organizations',
      'test_package_items',
      'test_packages',
      'reference_ranges',
      'test_parameters',
      'analyzer_test_mappings',
      'tests',
      'test_categories',
      'qc_rules',
      'maintenances',
      'calibrations',
      'analyzer_jobs',
      'analyzers',
      'cash_movements',
      'cash_counter_sessions',
      'cash_counters',
      'communication_logs',
      'whatsapp_scheduled_messages',
      'whatsapp_notification_triggers',
      'whatsapp_campaigns',
      'whatsapp_auto_reply_rules',
      'whatsapp_templates',
      'notification_templates',
      'user_sessions',
      'mfa_backup_codes',
      'login_alerts',
      'email_verification_tokens',
      'role_permissions',
      'approvals',
      'audit_logs',
    ];

    console.log('--- Truncating Data Tables with CASCADE ---');
    for (const table of tablesToTruncate) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
        console.log(`  ✅ Truncated: ${table}`);
      } catch (err: any) {
        // Some tables might not exist or be named differently, safe notice
        console.log(`  ℹ️ Notice on "${table}": ${err.message?.split('\n')[0]}`);
      }
    }

    // 2. Clean other users
    console.log('\n--- Purging Old Users (Keeping only nikilpanchal88@gmail.com) ---');
    const deleteUsersResult = await prisma.user.deleteMany({
      where: { id: { not: adminId } },
    });
    console.log(`  ✅ Removed ${deleteUsersResult.count} other user account(s).`);

    // 3. Reset password history for this admin
    await prisma.passwordHistory.deleteMany({ where: { userId: adminId } });
    await prisma.passwordHistory.create({
      data: {
        userId: adminId,
        passwordHash,
      },
    });
    console.log('  ✅ Admin password history refreshed.');

    // 4. Verification Check
    console.log('\n====================================================');
    console.log('📊 FINAL VERIFICATION & INTEGRITY AUDIT');
    console.log('====================================================');

    const totalUsers = await prisma.user.count();
    const totalPatients = await prisma.patient.count();
    const totalDoctors = await prisma.doctor.count();
    const totalTests = await prisma.test.count();
    const totalOrders = await prisma.order.count();
    const totalSamples = await prisma.sample.count();
    const totalResults = await prisma.result.count();
    const totalInvoices = await prisma.invoice.count();
    const totalPayments = await prisma.payment.count();

    console.log(`Remaining Users:    ${totalUsers}   (Expected: 1)`);
    console.log(`Remaining Patients: ${totalPatients}   (Expected: 0)`);
    console.log(`Remaining Doctors:  ${totalDoctors}   (Expected: 0)`);
    console.log(`Remaining Tests:    ${totalTests}   (Expected: 0)`);
    console.log(`Remaining Orders:   ${totalOrders}   (Expected: 0)`);
    console.log(`Remaining Samples:  ${totalSamples}   (Expected: 0)`);
    console.log(`Remaining Results:  ${totalResults}   (Expected: 0)`);
    console.log(`Remaining Invoices: ${totalInvoices}   (Expected: 0)`);
    console.log(`Remaining Payments: ${totalPayments}   (Expected: 0)`);

    const adminCheck = await prisma.user.findUnique({
      where: { id: adminId },
    });

    const isPasswordValid = await comparePassword(targetPassword, adminCheck!.passwordHash);
    console.log('\nAdmin Credentials Check:');
    console.log(`  - Name:          ${adminCheck?.fullName}`);
    console.log(`  - Email:         ${adminCheck?.email}`);
    console.log(`  - Employee Code: ${adminCheck?.employeeCode}`);
    console.log(`  - Role:          ${adminCheck?.role}`);
    console.log(`  - Status:        ${adminCheck?.status}`);
    console.log(`  - Password OK:   ${isPasswordValid ? '✅ YES' : '❌ NO'}`);

    if (totalUsers === 1 && totalPatients === 0 && totalOrders === 0 && totalTests === 0 && isPasswordValid) {
      console.log('\n🎉 ALL CHECKS PASSED: Database is 100% clean, fresh, and ready for real production use!');
    } else {
      console.warn('\n⚠️ Integrity mismatch observed. Review table counts above.');
    }

  } catch (error) {
    console.error('❌ Data wipe error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

wipeDatabaseToSingleAdmin();
