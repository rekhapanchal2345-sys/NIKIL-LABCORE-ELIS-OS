require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// The API applies a server-side HMAC pepper (PASSWORD_PEPPER) BEFORE bcrypt —
// see api/src/utils/password.ts. Hashing without the pepper produces a hash
// that can never be verified at login, so the identical transform is applied
// here.
const pepperedHash = async (password) =>
  bcrypt.hash(
    crypto.createHmac('sha256', process.env.PASSWORD_PEPPER || '').update(password).digest('hex'),
    12
  );

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

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
    const email = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email) {
      throw new Error('ADMIN_EMAIL is not set. Add it to backend/.env first.');
    }
    if (!password) {
      throw new Error('ADMIN_PASSWORD is not set. Add a strong password to backend/.env first.');
    }

    const passwordHash = await pepperedHash(password);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        id: 'cm0admin001',
        employeeCode: 'ADMIN001',
        fullName: 'System Administrator',
        email: email,
        phone: null,
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
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
    console.log(`Email: ${email}`);
    console.log('Password: [CONFIGURED IN .ENV]');
    console.log('========================================');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();