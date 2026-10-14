import 'dotenv/config';
import prisma from '../api/config/database';
import bcrypt from 'bcryptjs';
import { hashPassword } from '../api/src/utils/password';
import { UserRole, AccountStatus } from '@prisma/client';
import { assertStrongPassword } from '../api/src/utils/password-policy';

/** Reads the seed admin credentials, refusing to fall back to any default password. */
function readAdminInput() {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email) {
    throw new Error('ADMIN_EMAIL is not set. Add it to backend/.env first.');
  }

  if (!password) {
    // A default password here would silently create a known-credential account.
    throw new Error(
      'ADMIN_PASSWORD is not set. Add a strong password to backend/.env first.'
    );
  }

  assertStrongPassword(password);

  return {
    employeeCode: process.env.ADMIN_EMPLOYEE_CODE || 'ADMIN001',
    fullName: process.env.ADMIN_FULL_NAME || 'System Administrator',
    email,
    password,
    role: UserRole.ADMIN,
    phone: '',
    status: AccountStatus.ACTIVE,
    specialization: 'System Administration'
  };
}

async function recreateAdminUser() {
  try {
    console.log('🔄 Deleting all existing users...');

    // Delete all users
    const deleteResult = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.count} existing users`);

    console.log('🔐 Creating new admin user...');

    // New admin user configuration using environment variables
    const newAdminUser = readAdminInput();

    console.log('Creating admin user with:');
    console.log(`Email: ${newAdminUser.email}`);
    console.log('Password: [HIDDEN - set ADMIN_PASSWORD in your environment]');

    // Hash password
    const passwordHash = await hashPassword(newAdminUser.password);

    // Create new admin user
    const user = await prisma.user.create({
      data: {
        employeeCode: newAdminUser.employeeCode,
        fullName: newAdminUser.fullName,
        email: newAdminUser.email,
        phone: newAdminUser.phone || null,
        passwordHash,
        role: newAdminUser.role as UserRole,
        status: newAdminUser.status as AccountStatus,
        specialization: newAdminUser.specialization
      },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    console.log('✅ New admin user created successfully!');
    console.log('User details:', user);
    console.log('\n🎉 Admin user created successfully!');
    console.log('Please use the credentials from your environment variables to login.');

  } catch (error) {
    console.error('❌ Error recreating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

recreateAdminUser();
