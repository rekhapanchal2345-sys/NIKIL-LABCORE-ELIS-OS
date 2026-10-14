import 'dotenv/config';
import prisma from '../api/config/database';
import bcrypt from 'bcryptjs';
import { hashPassword } from '../api/src/utils/password';
import { UserRole, AccountStatus } from '@prisma/client';

async function createAdminUser() {
  try {
    console.log('🔍 Checking if admin user already exists...');
    
    // Check if admin user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@labcore.local' },
          { employeeCode: 'ADMIN001' }
        ]
      }
    });

    if (existingUser) {
      console.log('❌ Admin user already exists!');
      console.log(`Existing user: ${existingUser.email} (${existingUser.employeeCode})`);
      console.log(`Role: ${existingUser.role}, Status: ${existingUser.status}`);
      return;
    }

    console.log('🔐 Creating admin user...');
    
    // Admin user configuration
    const password = process.env.ADMIN_PASSWORD;

    if (!password) {
      // No default: a fallback password would be published in this repo.
      throw new Error(
        'ADMIN_PASSWORD is not set. Add a strong password to backend/.env first.'
      );
    }

    const passwordHash = await hashPassword(password);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        id: 'cm0admin001',
        employeeCode: process.env.ADMIN_EMPLOYEE_CODE || 'ADMIN001',
        fullName: process.env.ADMIN_FULL_NAME || 'System Administrator',
        email: process.env.ADMIN_EMAIL || 'admin@labcore.local',
        phone: null,
        passwordHash,
        role: UserRole.ADMIN,
        status: AccountStatus.ACTIVE,
        specialization: 'System Administration'
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
    console.log('========================================');
    console.log('📋 User Details:');
    console.log('========================================');
    console.log(`ID: ${user.id}`);
    console.log(`Employee Code: ${user.employeeCode}`);
    console.log(`Full Name: ${user.fullName}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Status: ${user.status}`);
    console.log(`Created At: ${user.createdAt}`);
    console.log('========================================');
    console.log('🔑 Login Credentials:');
    console.log('========================================');
    console.log(`Email: ${user.email}`);
    console.log('Password: Please check your environment variables');
    console.log('========================================');
    console.log('⚠️  IMPORTANT: Change this password in production!');
    console.log('========================================');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();