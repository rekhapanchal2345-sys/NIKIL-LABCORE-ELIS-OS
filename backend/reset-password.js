const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// ISS-003: This script MUST match the pepper + cost logic in backend/api/src/utils/password.ts
// Previously used plain bcrypt.hash(password, 10) without HMAC pepper, causing 401 on every login after reset.

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/**
 * Applies HMAC-SHA256 pepper before bcrypt — identical to utils/password.ts hashPassword().
 */
async function hashPasswordWithPepper(password) {
  const pepper = process.env.PASSWORD_PEPPER;
  if (!pepper || pepper.length < 16) {
    throw new Error(
      'PASSWORD_PEPPER is not set or is too short (minimum 16 characters). ' +
      'Add it to backend/.env before resetting passwords.'
    );
  }
  const peppered = crypto.createHmac('sha256', pepper).update(password).digest('hex');
  // Cost 12 matches production hashPassword() in utils/password.ts
  return await bcrypt.hash(peppered, 12);
}

async function resetPassword() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@labcore.local';
    const newPassword = process.env.ADMIN_PASSWORD;

    if (!newPassword) {
      throw new Error('ADMIN_PASSWORD is not set. Add a strong password to backend/.env first.');
    }

    console.log('Resetting password for:', email);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', user.email, user.employeeCode);

    // ISS-003: Hash with HMAC-SHA256 pepper + bcrypt cost 12 to match auth.service.ts verification
    const hashedPassword = await hashPasswordWithPepper(newPassword);
    console.log('New password hashed (peppered, cost 12)');

    await prisma.user.update({
      where: { email },
      data: {
        passwordHash: hashedPassword,
        passwordChangedAt: new Date(),
        failedLoginCount: 0,
        lockedUntil: null,
      }
    });

    console.log('Password reset successfully!');
    console.log('The account can now log in with the new password.');
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
