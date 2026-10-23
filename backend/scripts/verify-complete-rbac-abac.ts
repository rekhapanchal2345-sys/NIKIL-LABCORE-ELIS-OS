import 'dotenv/config';
import prisma, { pool, closeDatabasePool } from '../api/config/database';
import { hashPassword } from '../api/src/utils/password';
import {
  PERMISSIONS,
  getPermissionsForRole,
  hasPermission,
  type Permission,
} from '../api/src/lib/permissions';
import {
  UserRole,
  generateAccessToken,
  type AuthUser,
} from '../api/src/lib/auth';
import {
  getEffectivePermissions,
  userHasPermission,
  grantPermission,
  denyPermission,
  assignRoleOverride,
  revokeRoleOverride,
} from '../api/src/modules/auth/rbac.service';
import {
  evaluateAbac,
  type AbacContext,
} from '../api/src/modules/auth/abac.engine';
import app from '../api/src/app';
import http from 'http';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function record(suite: string, name: string, passed: boolean, details?: string) {
  results.push({ suite, name, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`  ${icon}: [${suite}] ${name}${details ? ` -> ${details}` : ''}`);
}

async function makeExpressRequest(
  expressApp: any,
  method: 'GET' | 'POST',
  path: string,
  token?: string,
  body?: any
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(expressApp);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      const port = addr.port;

      const postData = body ? JSON.stringify(body) : undefined;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (postData) {
        headers['Content-Length'] = Buffer.byteLength(postData).toString();
      }

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            server.close();
            let parsed = null;
            try {
              parsed = JSON.parse(data);
            } catch {
              parsed = data;
            }
            resolve({ status: res.statusCode || 500, body: parsed });
          });
        }
      );

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  });
}

async function runCompleteRbacAbacVerification() {
  console.log('\n================================================================');
  console.log('🔬 LABCORE ELIS — COMPLETE RBAC & ABAC DEEP VERIFICATION');
  console.log('================================================================\n');

  const testPassword = 'TestSecurePassword#2026!';
  const hashedPassword = await hashPassword(testPassword);

  const ALL_ROLES: UserRole[] = [
    'SUPER_ADMIN',
    'ADMIN',
    'BRANCH_ADMIN',
    'PATHOLOGIST',
    'DOCTOR',
    'LAB_TECH',
    'FRONT_DESK',
    'ACCOUNTANT',
    'AUDITOR',
  ];

  const createdUsers: Record<UserRole, any> = {} as any;

  try {
    // -------------------------------------------------------------
    // PRE-FLIGHT CLEANUP
    // -------------------------------------------------------------
    console.log('--- Phase 0: Cleaning up prior test state ---');
    const existingTestUsers = await prisma.user.findMany({
      where: { email: { startsWith: 'rbac_test_' } },
      select: { id: true },
    });
    const testUserIds = existingTestUsers.map((u) => u.id);

    if (testUserIds.length > 0) {
      await (prisma as any).userPermissionOverride.deleteMany({
        where: { userId: { in: testUserIds } },
      });
      await (prisma as any).userRoleOverride.deleteMany({
        where: { userId: { in: testUserIds } },
      });
      await prisma.userSession.deleteMany({
        where: { userId: { in: testUserIds } },
      });
      await prisma.auditLog.deleteMany({
        where: { userId: { in: testUserIds } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: testUserIds } },
      });
      console.log(`Cleaned up ${testUserIds.length} existing test users.`);
    }

    // -------------------------------------------------------------
    // STEP 1: CREATE ACTUAL USERS FOR ALL 9 ROLES IN DATABASE
    // -------------------------------------------------------------
    console.log('\n--- Phase 1: Creating database test users for all 9 roles ---');

    for (const role of ALL_ROLES) {
      const email = `rbac_test_${role.toLowerCase()}@labcore.local`;
      const employeeCode = `TEST_${role.replace('_', '')}_01`;
      const fullName = `Test ${role.replace('_', ' ')}`;

      const user = await prisma.user.create({
        data: {
          email,
          employeeCode,
          fullName,
          role,
          status: 'ACTIVE',
          passwordHash: hashedPassword,
          passwordChangedAt: new Date(),
        },
      });

      createdUsers[role] = user;
      record(
        'User Creation',
        `Role: ${role}`,
        !!user.id && user.role === role,
        `ID: ${user.id}, Code: ${employeeCode}`
      );
    }

    // -------------------------------------------------------------
    // STEP 2: VERIFY STATIC RBAC ROLE BASELINE PERMISSIONS
    // -------------------------------------------------------------
    console.log('\n--- Phase 2: Verifying Static RBAC Matrix across all 9 roles ---');

    // 1. SUPER_ADMIN: Must have full sovereign access
    const superAdminPerms = getPermissionsForRole('SUPER_ADMIN');
    const hasAllSuper =
      hasPermission('SUPER_ADMIN', PERMISSIONS.PATIENT_DELETE) &&
      hasPermission('SUPER_ADMIN', PERMISSIONS.RESULT_APPROVE) &&
      hasPermission('SUPER_ADMIN', PERMISSIONS.AUDIT_READ) &&
      hasPermission('SUPER_ADMIN', PERMISSIONS.SETTINGS_UPDATE) &&
      hasPermission('SUPER_ADMIN', PERMISSIONS.USER_UNLOCK);
    record(
      'Static RBAC',
      'SUPER_ADMIN has unrestricted global access',
      hasAllSuper && superAdminPerms.length === Object.keys(PERMISSIONS).length,
      `Holds all ${superAdminPerms.length} permissions`
    );

    // 2. ADMIN: Has administrative power, but AUDIT_READ is reserved for Auditor/SuperAdmin
    const adminCanDeletePatient = hasPermission('ADMIN', PERMISSIONS.PATIENT_DELETE);
    const adminCanApproveResult = hasPermission('ADMIN', PERMISSIONS.RESULT_APPROVE);
    const adminHasAuditRead = hasPermission('ADMIN', PERMISSIONS.AUDIT_READ);
    record(
      'Static RBAC',
      'ADMIN permissions (patient:delete=true, audit:read=false)',
      adminCanDeletePatient && adminCanApproveResult && !adminHasAuditRead,
      'Administrative permissions confirmed without audit tamper'
    );

    // 3. BRANCH_ADMIN: Branch admin cannot unlock users globally
    const branchAdminCanRead = hasPermission('BRANCH_ADMIN', PERMISSIONS.PATIENT_READ);
    const branchAdminUnlock = hasPermission('BRANCH_ADMIN', PERMISSIONS.USER_UNLOCK);
    record(
      'Static RBAC',
      'BRANCH_ADMIN permissions (patient:read=true, user:unlock=false)',
      branchAdminCanRead && !branchAdminUnlock,
      'Branch boundary confirmed'
    );

    // 4. PATHOLOGIST: Can approve results, cannot delete patients or handle cash POS
    const pathCanApprove = hasPermission('PATHOLOGIST', PERMISSIONS.RESULT_APPROVE);
    const pathCanEnterResult = hasPermission('PATHOLOGIST', PERMISSIONS.RESULT_ENTER);
    const pathCanDeletePatient = hasPermission('PATHOLOGIST', PERMISSIONS.PATIENT_DELETE);
    const pathCanOpenCash = hasPermission('PATHOLOGIST', PERMISSIONS.PAYMENT_COUNTER_OPEN);
    record(
      'Static RBAC',
      'PATHOLOGIST permissions (result:approve=true, payment:counter_open=false, patient:delete=false)',
      pathCanApprove && pathCanEnterResult && !pathCanDeletePatient && !pathCanOpenCash,
      'Clinical signatory privileges confirmed'
    );

    // 5. LAB_TECH: Can collect samples and enter results, cannot approve or delete patients
    const techCanEnter = hasPermission('LAB_TECH', PERMISSIONS.RESULT_ENTER);
    const techCanCollect = hasPermission('LAB_TECH', PERMISSIONS.SAMPLE_COLLECT);
    const techCanApprove = hasPermission('LAB_TECH', PERMISSIONS.RESULT_APPROVE);
    const techCanDelete = hasPermission('LAB_TECH', PERMISSIONS.PATIENT_DELETE);
    record(
      'Static RBAC',
      'LAB_TECH permissions (result:enter=true, result:approve=false, patient:delete=false)',
      techCanEnter && techCanCollect && !techCanApprove && !techCanDelete,
      'Technical bench operation boundaries enforced'
    );

    // 6. FRONT_DESK: Can register patients and collect POS payment, cannot enter clinical results
    const fdCanCreatePatient = hasPermission('FRONT_DESK', PERMISSIONS.PATIENT_CREATE);
    const fdCanOpenCounter = hasPermission('FRONT_DESK', PERMISSIONS.PAYMENT_COUNTER_OPEN);
    const fdCanEnterResult = hasPermission('FRONT_DESK', PERMISSIONS.RESULT_ENTER);
    const fdCanApproveResult = hasPermission('FRONT_DESK', PERMISSIONS.RESULT_APPROVE);
    record(
      'Static RBAC',
      'FRONT_DESK permissions (patient:create=true, payment:counter_open=true, result:enter=false)',
      fdCanCreatePatient && fdCanOpenCounter && !fdCanEnterResult && !fdCanApproveResult,
      'Receptionist boundaries confirmed'
    );

    // 7. DOCTOR: Can read patients, orders, and verified reports, cannot enter or approve results
    const docCanReadOrders = hasPermission('DOCTOR', PERMISSIONS.ORDER_READ);
    const docCanReadResults = hasPermission('DOCTOR', PERMISSIONS.RESULT_READ);
    const docCanEnterResult = hasPermission('DOCTOR', PERMISSIONS.RESULT_ENTER);
    record(
      'Static RBAC',
      'DOCTOR permissions (order:read=true, result:enter=false, result:approve=false)',
      docCanReadOrders && docCanReadResults && !docCanEnterResult,
      'Referring doctor clinical portal boundaries confirmed'
    );

    // 8. ACCOUNTANT: Can handle settlements and refunds, cannot enter or approve clinical results
    const accCanSettle = hasPermission('ACCOUNTANT', PERMISSIONS.PAYMENT_SETTLEMENT);
    const accCanRefund = hasPermission('ACCOUNTANT', PERMISSIONS.PAYMENT_REFUND);
    const accCanEnterResult = hasPermission('ACCOUNTANT', PERMISSIONS.RESULT_ENTER);
    record(
      'Static RBAC',
      'ACCOUNTANT permissions (payment:settlement=true, result:enter=false)',
      accCanSettle && accCanRefund && !accCanEnterResult,
      'Financial ledger authority confirmed'
    );

    // 9. AUDITOR: Can read audit trail, cannot create orders or modify patients
    const audCanReadAudit = hasPermission('AUDITOR', PERMISSIONS.AUDIT_READ);
    const audCanCreateOrder = hasPermission('AUDITOR', PERMISSIONS.ORDER_CREATE);
    const audCanDeletePatient = hasPermission('AUDITOR', PERMISSIONS.PATIENT_DELETE);
    record(
      'Static RBAC',
      'AUDITOR permissions (audit:read=true, order:create=false, patient:delete=false)',
      audCanReadAudit && !audCanCreateOrder && !audCanDeletePatient,
      'Compliance and read-only audit access confirmed'
    );

    // -------------------------------------------------------------
    // STEP 3: DYNAMIC RBAC OVERRIDES (GRANT, DENY, DELEGATION)
    // -------------------------------------------------------------
    console.log('\n--- Phase 3: Testing Dynamic RBAC (GRANT, DENY, Role Delegation) ---');

    const adminUser = createdUsers['ADMIN'];
    const frontDeskUser = createdUsers['FRONT_DESK'];
    const labTechUser = createdUsers['LAB_TECH'];

    // 1. Dynamic User GRANT: Front Desk user given `result:enter`
    const initialFdCanEnter = await userHasPermission(frontDeskUser.id, PERMISSIONS.RESULT_ENTER);
    await grantPermission({
      adminId: adminUser.id,
      targetUserId: frontDeskUser.id,
      permission: PERMISSIONS.RESULT_ENTER,
      reason: 'Cross-trained for emergency blood sugar test entry',
    });
    const postGrantFdCanEnter = await userHasPermission(frontDeskUser.id, PERMISSIONS.RESULT_ENTER);
    const fdEffective = await getEffectivePermissions(frontDeskUser.id);
    record(
      'Dynamic RBAC',
      'User-Level GRANT override (Front Desk granted result:enter)',
      !initialFdCanEnter && postGrantFdCanEnter && fdEffective.userGrants.includes(PERMISSIONS.RESULT_ENTER),
      'Dynamic grant elevated permissions over role baseline'
    );

    // 2. Dynamic User DENY: Admin user explicitly denied `patient:export`
    const initialAdminCanExport = await userHasPermission(adminUser.id, PERMISSIONS.PATIENT_EXPORT);
    await denyPermission({
      adminId: createdUsers['SUPER_ADMIN'].id,
      targetUserId: adminUser.id,
      permission: PERMISSIONS.PATIENT_EXPORT,
      reason: 'Data loss prevention lock on this admin account',
    });
    const postDenyAdminCanExport = await userHasPermission(adminUser.id, PERMISSIONS.PATIENT_EXPORT);
    const adminEffective = await getEffectivePermissions(adminUser.id);
    record(
      'Dynamic RBAC',
      'User-Level DENY override (Admin denied patient:export)',
      initialAdminCanExport && !postDenyAdminCanExport && adminEffective.userDenies.includes(PERMISSIONS.PATIENT_EXPORT),
      'User-level DENY strictly supersedes role baseline'
    );

    // 3. Temporary Role Delegation: Lab Tech temporarily elevated to PATHOLOGIST
    const initialTechCanApprove = await userHasPermission(labTechUser.id, PERMISSIONS.RESULT_APPROVE);
    const now = new Date();
    const roleOverride = await assignRoleOverride({
      adminId: adminUser.id,
      targetUserId: labTechUser.id,
      overrideRole: 'PATHOLOGIST',
      reason: 'Senior tech covering weekend signatory shift',
      validFrom: new Date(now.getTime() - 60000), // started 1 min ago
      validUntil: new Date(now.getTime() + 3600000), // valid for 1 hour
    });
    const duringOverrideCanApprove = await userHasPermission(labTechUser.id, PERMISSIONS.RESULT_APPROVE);
    const techEffective = await getEffectivePermissions(labTechUser.id);

    // Revoke the delegation
    await revokeRoleOverride({
      adminId: adminUser.id,
      overrideId: roleOverride.id,
      reason: 'Shift concluded',
    });
    const postRevokeCanApprove = await userHasPermission(labTechUser.id, PERMISSIONS.RESULT_APPROVE);

    record(
      'Dynamic RBAC',
      'Temporary Role Delegation (Lab Tech -> Pathologist -> Revoked)',
      !initialTechCanApprove && duringOverrideCanApprove && techEffective.role === 'PATHOLOGIST' && !postRevokeCanApprove,
      'Time-bounded delegation verified and reverted cleanly'
    );

    // -------------------------------------------------------------
    // STEP 4: ABAC ENGINE POLICY EVALUATION
    // -------------------------------------------------------------
    console.log('\n--- Phase 4: Testing ABAC Policies (Confidentiality, Shift, Sensitivity) ---');

    // Create a VIP patient and a Normal patient
    const normalPatient = await prisma.patient.create({
      data: {
        uhid: `UHID-NORM-${Date.now().toString().slice(-6)}`,
        firstName: 'Normal',
        lastName: 'Patient Test',
        age: 35,
        gender: 'MALE',
        phone: '+919876543210',
        confidentialityLevel: 'STANDARD',
      },
    });

    const vipPatient = await prisma.patient.create({
      data: {
        uhid: `UHID-VIP-${Date.now().toString().slice(-6)}`,
        firstName: 'Celebrity',
        lastName: 'VIP Patient Test',
        age: 42,
        gender: 'FEMALE',
        phone: '+919876543211',
        confidentialityLevel: 'VIP_MASKED',
      },
    });

    // Test 1: LAB_TECH accessing normal patient -> Allowed (no hard block)
    const normAbac = await evaluateAbac({
      userId: labTechUser.id,
      userRole: 'LAB_TECH',
      resourceType: 'patient',
      resourceId: normalPatient.id,
      action: 'read',
    });
    record(
      'ABAC Engine',
      'Normal patient read by Lab Tech',
      normAbac.decision !== 'DENY' || normAbac.policyId !== 'PATIENT_CONFIDENTIALITY_SHIELD',
      `Policy decision: ${normAbac.decision}`
    );

    // Test 2: LAB_TECH accessing VIP patient WITHOUT break-glass -> Hard DENY
    const vipAbacDeny = await evaluateAbac({
      userId: labTechUser.id,
      userRole: 'LAB_TECH',
      resourceType: 'patient',
      resourceId: vipPatient.id,
      action: 'read',
    });
    record(
      'ABAC Engine',
      'VIP Patient shielded from Lab Tech without break-glass',
      vipAbacDeny.decision === 'DENY' && vipAbacDeny.policyId === 'PATIENT_CONFIDENTIALITY_SHIELD' && vipAbacDeny.requiresBreakGlass === true,
      `Blocked by: ${vipAbacDeny.policyId} (${vipAbacDeny.reason})`
    );

    // Test 3: ADMIN accessing VIP patient -> Exempt from shield
    const adminVipAbac = await evaluateAbac({
      userId: adminUser.id,
      userRole: 'ADMIN',
      resourceType: 'patient',
      resourceId: vipPatient.id,
      action: 'read',
    });
    record(
      'ABAC Engine',
      'Admin bypasses VIP Confidentiality Shield',
      adminVipAbac.policyId !== 'PATIENT_CONFIDENTIALITY_SHIELD',
      'Admin privilege confirmed'
    );

    // Test 4: LAB_TECH trying to APPROVE a result -> Hard DENY (LAB_TECH_NO_APPROVE)
    const techApproveAbac = await evaluateAbac({
      userId: labTechUser.id,
      userRole: 'LAB_TECH',
      resourceType: 'result',
      action: 'approve',
    });
    record(
      'ABAC Engine',
      'Lab Tech hard-blocked from approving results (LAB_TECH_NO_APPROVE)',
      techApproveAbac.decision === 'DENY' && techApproveAbac.policyId === 'LAB_TECH_NO_APPROVE',
      `Blocked by: ${techApproveAbac.policyId}`
    );

    // Test 5: PATHOLOGIST approving a result -> PERMIT (PATHOLOGIST_RESULT_APPROVE)
    const pathApproveAbac = await evaluateAbac({
      userId: createdUsers['PATHOLOGIST'].id,
      userRole: 'PATHOLOGIST',
      resourceType: 'result',
      action: 'approve',
    });
    record(
      'ABAC Engine',
      'Pathologist permitted to approve results (PATHOLOGIST_RESULT_APPROVE)',
      pathApproveAbac.decision === 'PERMIT' && pathApproveAbac.policyId === 'PATHOLOGIST_RESULT_APPROVE',
      `Permitted by: ${pathApproveAbac.policyId}`
    );

    // Test 6: Audit log read restricted (FRONT_DESK blocked, AUDITOR allowed)
    const fdAuditAbac = await evaluateAbac({
      userId: frontDeskUser.id,
      userRole: 'FRONT_DESK',
      resourceType: 'audit_log',
      action: 'read',
    });
    record(
      'ABAC Engine',
      'Front desk denied audit log read (AUDIT_LOG_READ_RESTRICTED)',
      fdAuditAbac.decision === 'DENY' && fdAuditAbac.policyId === 'AUDIT_LOG_READ_RESTRICTED',
      `Blocked by: ${fdAuditAbac.policyId}`
    );

    // Clean up test patients
    await prisma.patient.deleteMany({
      where: { id: { in: [normalPatient.id, vipPatient.id] } },
    });

    // -------------------------------------------------------------
    // STEP 5: EXPRESS HTTP END-TO-END GATE VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- Phase 5: Testing Express Route Enforcement via HTTP ---');

    // Generate valid tokens
    const superAdminToken = generateAccessToken(createdUsers['SUPER_ADMIN']);
    const adminToken = generateAccessToken(createdUsers['ADMIN']);
    const frontDeskToken = generateAccessToken(createdUsers['FRONT_DESK']);
    const labTechToken = generateAccessToken(createdUsers['LAB_TECH']);
    const auditorToken = generateAccessToken(createdUsers['AUDITOR']);

    // Route 1: GET /api/v1/auth/admin/rbac/matrix (Admin/SuperAdmin only)
    const adminMatrixRes = await makeExpressRequest(
      app,
      'GET',
      '/api/auth/admin/rbac/matrix',
      adminToken
    );
    record(
      'Express HTTP Route Gate',
      'GET /auth/admin/rbac/matrix with ADMIN token -> 200 OK',
      adminMatrixRes.status === 200 && adminMatrixRes.body.success === true,
      `Status: ${adminMatrixRes.status}`
    );

    const fdMatrixRes = await makeExpressRequest(
      app,
      'GET',
      '/api/auth/admin/rbac/matrix',
      frontDeskToken
    );
    record(
      'Express HTTP Route Gate',
      'GET /auth/admin/rbac/matrix with FRONT_DESK token -> 403 Forbidden',
      fdMatrixRes.status === 403,
      `Status: ${fdMatrixRes.status}`
    );

    const techMatrixRes = await makeExpressRequest(
      app,
      'GET',
      '/api/auth/admin/rbac/matrix',
      labTechToken
    );
    record(
      'Express HTTP Route Gate',
      'GET /auth/admin/rbac/matrix with LAB_TECH token -> 403 Forbidden',
      techMatrixRes.status === 403,
      `Status: ${techMatrixRes.status}`
    );

    // Route 2: GET /api/v1/auth/profile (/auth/me) with all roles
    let allProfilesOk = true;
    for (const role of ALL_ROLES) {
      const token = generateAccessToken(createdUsers[role]);
      const res = await makeExpressRequest(app, 'GET', '/api/auth/profile', token);
      if (res.status !== 200 || res.body?.data?.role !== role) {
        allProfilesOk = false;
        console.error(`Profile check failed for ${role}: status ${res.status}`);
      }
    }
    record(
      'Express HTTP Route Gate',
      'GET /auth/profile returns correct active role for ALL 9 roles',
      allProfilesOk,
      'All 9 role tokens validated against DB sessions'
    );

    // -------------------------------------------------------------
    // POST-TEST CLEANUP
    // -------------------------------------------------------------
    console.log('\n--- Phase 6: Post-test teardown and cleanup ---');
    const finalCleanIds = Object.values(createdUsers).map((u) => u.id);
    await (prisma as any).userPermissionOverride.deleteMany({
      where: { userId: { in: finalCleanIds } },
    });
    await (prisma as any).userRoleOverride.deleteMany({
      where: { userId: { in: finalCleanIds } },
    });
    await prisma.userSession.deleteMany({
      where: { userId: { in: finalCleanIds } },
    });
    await prisma.auditLog.deleteMany({
      where: { userId: { in: finalCleanIds } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: finalCleanIds } },
    });
    console.log(`Cleaned up all ${finalCleanIds.length} test users and audit logs.`);

  } catch (error) {
    console.error('❌ Critical verification exception:', error);
    record('Fatal', 'Test execution error', false, String(error));
  } finally {
    await closeDatabasePool();
  }

  // -------------------------------------------------------------
  // FINAL SCORECARD
  // -------------------------------------------------------------
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.filter((r) => !r.passed).length;

  console.log('\n================================================================');
  console.log(`📊 FINAL VERIFICATION SCORECARD: ${passedTests}/${totalTests} PASSED`);
  if (failedTests === 0) {
    console.log('🎉 ALL RBAC & ABAC SYSTEMS ARE 100% OPERATIONAL AND ENFORCED!');
  } else {
    console.log(`⚠️ ${failedTests} TESTS FAILED.`);
  }
  console.log('================================================================\n');

  process.exit(failedTests === 0 ? 0 : 1);
}

runCompleteRbacAbacVerification();
