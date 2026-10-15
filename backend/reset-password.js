const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const applyPepper = (password) => {
  const pepper = process.env.PASSWORD_PEPPER || "";
  return crypto.createHmac("sha256", pepper).update(password).digest("hex");
};

async function resetPassword() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@labcore.local';
    const newPassword = process.env.ADMIN_PASSWORD;

    if (!newPassword) {
      // No default: a fallback password would be published in this repo.
      throw new Error(
        'ADMIN_PASSWORD is not set. Add a strong password to backend/.env first.'
      );
    }

    console.log('Resetting password for:', email);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', user.email, user.employeeCode);

    // Hash the new password with the pepper
    const pepperedPassword = applyPepper(newPassword);
    const hashedPassword = await bcrypt.hash(pepperedPassword, 10);
    console.log('New password hashed with pepper');

    // Update the password
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword }
    });

    console.log('Password reset successfully!');
    console.log('Please check your environment variables for the new password.');

  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();