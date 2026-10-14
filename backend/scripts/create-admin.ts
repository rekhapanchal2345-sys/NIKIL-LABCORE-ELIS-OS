import 'dotenv/config';
import prisma from '../api/config/database';
import bcrypt from 'bcryptjs';
import { hashPassword } from '../api/src/utils/password';
import { UserRole, AccountStatus } from '@prisma/client';

/**
 * Reads the admin password from the environment.
 * A built-in default here would provision an account whose password is
 * published in this repository, so the script refuses to run without one.
 */
function requireAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error(
      'ADMIN_PASSWORD is not set. Add a strong password to backend/.env first.'
    );
  }

  return password;
}

async function createAdminUser() {
  try {
    // Admin user configuration
    const adminUser = {
      employeeCode: process.env.ADMIN_EMPLOYEE_CODE || 'ADMIN001',
      fullName: process.env.ADMIN_FULL_NAME || 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@labcore.local',
      password: requireAdminPassword(),
      role: UserRole.ADMIN,
      phone: '',
      status: AccountStatus.ACTIVE,
      specialization: 'System Administration'
    };

    console.log('Creating admin user...');
    console.log(`Email: ${adminUser.email}`);
    console.log('Password: [HIDDEN - set ADMIN_PASSWORD in your environment]');

    // Check if admin user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: adminUser.email },
          { employeeCode: adminUser.employeeCode }
        ]
      }
    });

    if (existingUser) {
      console.log('❌ Admin user already exists!');
      console.log(`Existing user: ${existingUser.email} (${existingUser.employeeCode})`);
      
      // Offer to update password
      console.log('\nWould you like to update the password for this user?');
      console.log('Run this script with --update flag to update password.');
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(adminUser.password);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        employeeCode: adminUser.employeeCode,
        fullName: adminUser.fullName,
        email: adminUser.email,
        phone: adminUser.phone || null,
        passwordHash,
        role: adminUser.role as UserRole,
        status: adminUser.status as AccountStatus,
        specialization: adminUser.specialization
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

    console.log('✅ Admin user created successfully!');
    console.log('User details:', user);
    console.log('\nAdmin user created. Please check your environment variables for login credentials.');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function updateAdminPassword() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@labcore.local';
    const newPassword = requireAdminPassword();

    console.log('Updating admin password...');
    console.log(`Email: ${email}`);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('❌ Admin user not found!');
      console.log('Run this script without --update flag to create a new admin user.');
      return;
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { email },
      data: { passwordHash }
    });

    console.log('✅ Admin password updated successfully!');
    console.log('Please check your environment variables for the new password.');

  } catch (error) {
    console.error('❌ Error updating admin password:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--update')) {
  updateAdminPassword();
} else {
  createAdminUser();
}