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

  return {
    employeeCode: process.env.ADMIN_EMPLOYEE_CODE || 'ADMIN001',
    fullName: process.env.ADMIN_FULL_NAME || 'System Administrator',
    email,
    password,
    role: 'ADMIN',
    phone: '',
    status: 'ACTIVE',
    specialization: 'System Administration'
  };
}

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function resetAdminUser() {
  try {
    console.log('🔄 Resetting admin user...');

    // Delete old admin users
    const oldAdmins = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      }
    });

    if (oldAdmins.length > 0) {
      console.log(`Found ${oldAdmins.length} existing admin users, deleting them...`);
      await prisma.user.deleteMany({
        where: {
          role: 'ADMIN'
        }
      });
      console.log('✅ Old admin users deleted');
    }

    // New admin user configuration
    const newAdminUser = readAdminInput();

    console.log('Creating new admin user...');
    console.log(`Email: ${newAdminUser.email}`);
    console.log('Password: [HIDDEN - set ADMIN_PASSWORD in your environment]');

    // Hash password
    const passwordHash = await pepperedHash(newAdminUser.password);

    // Create new admin user
    const user = await prisma.user.create({
      data: {
        employeeCode: newAdminUser.employeeCode,
        fullName: newAdminUser.fullName,
        email: newAdminUser.email,
        phone: newAdminUser.phone || null,
        passwordHash,
        role: newAdminUser.role,
        status: newAdminUser.status,
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
    console.log('\n🎉 Admin user created. Please check your environment variables for login credentials.');

  } catch (error) {
    console.error('❌ Error resetting admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminUser();