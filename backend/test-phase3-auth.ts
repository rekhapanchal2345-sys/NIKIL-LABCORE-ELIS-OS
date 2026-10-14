import prisma from './api/config/database';
import { revokeSessionById } from './api/src/modules/auth/auth.service';
import { createUser, changeUserStatus } from './api/src/modules/users/user.service';
import type { AuthUser } from './api/src/lib/auth';

async function runAuthHardeningTests() {
  console.log('🔒 Running Phase 3 Authentication Hardening Verification Tests...\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: IDOR Protection in Session Revocation
    // -------------------------------------------------------------
    console.log('Test 1: IDOR Protection in Session Revocation');
    const userA: AuthUser = {
      id: 'test-user-a',
      employeeCode: 'TEST_A',
      email: 'usera@labcore.local',
      fullName: 'User A',
      role: 'FRONT_DESK',
      status: 'ACTIVE',
    };

    const userB: AuthUser = {
      id: 'test-user-b',
      employeeCode: 'TEST_B',
      email: 'userb@labcore.local',
      fullName: 'User B',
      role: 'LAB_TECH',
      status: 'ACTIVE',
    };

    const adminUser: AuthUser = {
      id: 'test-admin',
      employeeCode: 'ADMIN_TEST',
      email: 'admin@labcore.local',
      fullName: 'Admin User',
      role: 'ADMIN',
      status: 'ACTIVE',
    };

    // Create a mock session in DB for user B if possible, or test the logic
    // We clean up any existing mock test users/sessions first
    await prisma.userSession.deleteMany({
      where: { userId: { in: [userA.id, userB.id, adminUser.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userA.id, userB.id, adminUser.id] } },
    });

    // Seed mock test users in DB
    await prisma.user.createMany({
      data: [
        {
          id: userA.id,
          employeeCode: userA.employeeCode,
          fullName: userA.fullName,
          email: userA.email,
          role: userA.role,
          status: userA.status,
          passwordHash: 'dummyhash',
        },
        {
          id: userB.id,
          employeeCode: userB.employeeCode,
          fullName: userB.fullName,
          email: userB.email,
          role: userB.role,
          status: userB.status,
          passwordHash: 'dummyhash',
        },
        {
          id: adminUser.id,
          employeeCode: adminUser.employeeCode,
          fullName: adminUser.fullName,
          email: adminUser.email,
          role: adminUser.role,
          status: adminUser.status,
          passwordHash: 'dummyhash',
        },
      ],
    });

    const sessionB = await prisma.userSession.create({
      data: {
        userId: userB.id,
        refreshTokenHash: 'mock-refresh-hash-b',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    // User A attempts to revoke User B's session -> must be rejected with 403
    let idorBlocked = false;
    try {
      await revokeSessionById(sessionB.id, userA);
    } catch (err: any) {
      if (err.statusCode === 403 || err.message?.includes('permission')) {
        idorBlocked = true;
      }
    }
    assert(idorBlocked, 'Non-admin user cannot revoke another user session (IDOR prevented)');

    // User B revokes their own session -> must succeed
    const ownRevokeRes = await revokeSessionById(sessionB.id, userB);
    assert(ownRevokeRes.ok === true, 'User can revoke their own session');

    // Create another session for User B
    const sessionB2 = await prisma.userSession.create({
      data: {
        userId: userB.id,
        refreshTokenHash: 'mock-refresh-hash-b2',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    // Admin user revoking User B's session -> must succeed
    const adminRevokeRes = await revokeSessionById(sessionB2.id, adminUser);
    assert(adminRevokeRes.ok === true, 'Admin can revoke any session');

    // -------------------------------------------------------------
    // Test 2: createUser enforces Password Policy
    // -------------------------------------------------------------
    console.log('\nTest 2: createUser Password Policy Enforcement');
    let weakPasswordRejected = false;
    try {
      await createUser({
        employeeCode: 'WEAK_PW_USER',
        fullName: 'Weak Pw',
        email: 'weakpw@labcore.local',
        password: 'weak',
        role: 'FRONT_DESK',
      });
    } catch (err: any) {
      weakPasswordRejected = true;
    }
    assert(weakPasswordRejected, 'Weak password rejected by password policy');

    let commonPasswordRejected = false;
    try {
      await createUser({
        employeeCode: 'COMMON_PW_USER',
        fullName: 'Common Pw',
        email: 'commonpw@labcore.local',
        password: 'Password1234!',
        role: 'FRONT_DESK',
      });
    } catch (err: any) {
      commonPasswordRejected = true;
    }
    assert(commonPasswordRejected, 'Common dictionary password rejected by policy');

    // Strong compliant password
    const validUser = await createUser({
      employeeCode: 'VALID_STAFF_01',
      fullName: 'Valid Staff',
      email: 'valid.staff@gmail.com',
      password: 'Xk9#mP!92qLz@7vW',
      role: 'LAB_TECH',
    });
    assert(!!validUser.id, 'Compliant strong password successfully registered');

    // Verify PasswordHistory was created
    const historyCount = await prisma.passwordHistory.count({
      where: { userId: validUser.id },
    });
    assert(historyCount === 1, 'PasswordHistory entry automatically logged for new user');

    // -------------------------------------------------------------
    // Test 3: changeUserStatus revokes active sessions on suspension
    // -------------------------------------------------------------
    console.log('\nTest 3: Session Revocation on Account Suspension');
    const validSession = await prisma.userSession.create({
      data: {
        userId: validUser.id,
        refreshTokenHash: 'mock-refresh-hash-valid',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    await changeUserStatus(validUser.id, 'SUSPENDED');

    const updatedSession = await prisma.userSession.findUnique({
      where: { id: validSession.id },
    });
    assert(
      updatedSession?.revokedAt !== null &&
      updatedSession?.revokeReason === 'account_status_suspended',
      'All open sessions revoked when account is SUSPENDED'
    );

    // Cleanup mock test data
    await prisma.auditLog.deleteMany({
      where: { userId: { in: [userA.id, userB.id, adminUser.id, validUser.id] } },
    });
    await prisma.userSession.deleteMany({
      where: { userId: { in: [userA.id, userB.id, adminUser.id, validUser.id] } },
    });
    await prisma.passwordHistory.deleteMany({
      where: { userId: validUser.id },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userA.id, userB.id, adminUser.id, validUser.id] } },
    });

    console.log(`\n🎉 Verification Complete: ${passed}/${total} Tests Passed.\n`);
  } catch (error) {
    console.error('❌ Test execution error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runAuthHardeningTests();
