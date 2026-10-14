import 'dotenv/config';
import prisma from '../api/config/database';
import { hashPassword, comparePassword } from '../api/src/utils/password';
import { emailBlindIndex, normaliseEmail } from '../api/src/utils/gmail';
import { UserRole, AccountStatus } from '@prisma/client';

async function main() {
  const emailInput = 'nikilpanchal88@gmail.com';
  const plainPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const canonicalEmail = normaliseEmail(emailInput);
  const employeeCode = 'EMP-NIKIL-88';
  const blindIndex = emailBlindIndex(canonicalEmail);

  console.log('--- Creating / Updating Admin User ---');
  console.log(`Input Email: ${emailInput}`);
  console.log(`Canonical Email: ${canonicalEmail}`);
  console.log(`Employee Code: ${employeeCode}`);

  const passwordHash = await hashPassword(plainPassword);
  console.log('Password hash generated successfully.');

  // Verify hash immediately
  const isValid = await comparePassword(plainPassword, passwordHash);
  if (!isValid) {
    throw new Error('Password verification against generated hash failed!');
  }
  console.log('✅ Password hash verification passed.');

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: canonicalEmail },
        { employeeCode: employeeCode },
      ],
    },
  });

  let user;
  if (existingUser) {
    console.log(`Found existing user with id: ${existingUser.id}. Updating...`);
    user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        email: canonicalEmail,
        employeeCode: employeeCode,
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
    console.log(`✅ User updated: ${user.email} (${user.role})`);
  } else {
    console.log('User not found. Creating new user...');
    user = await prisma.user.create({
      data: {
        employeeCode: employeeCode,
        fullName: 'Nikil Panchal',
        firstName: 'Nikil',
        lastName: 'Panchal',
        email: canonicalEmail,
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
    console.log(`✅ User created: ${user.email} (${user.role})`);
  }

  // Create record in PasswordHistory
  await prisma.passwordHistory.create({
    data: {
      userId: user.id,
      passwordHash: passwordHash,
    },
  });
  console.log('✅ Password history record logged.');

  // Re-verify login directly with comparePassword
  const reVerify = await comparePassword(plainPassword, user.passwordHash);
  console.log(`✅ Final login sanity check: ${reVerify ? 'SUCCESS' : 'FAILURE'}`);

  console.log('\n--- Admin Account Ready ---');
  console.log(`ID: ${user.id}`);
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);
  console.log(`Status: ${user.status}`);
  console.log(`Employee Code: ${user.employeeCode}`);
}

main()
  .catch((err) => {
    console.error('❌ Error creating admin user:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
