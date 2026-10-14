import 'dotenv/config';
import prisma from '../api/config/database';
import bcrypt from 'bcryptjs';
import { hashPassword } from '../api/src/utils/password';

async function updateUserPassword() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@labcore.local';
    const newPassword = process.env.ADMIN_PASSWORD;

    if (!newPassword) {
      // No default: a fallback password would be published in this repo.
      throw new Error(
        'ADMIN_PASSWORD is not set. Add a strong password to backend/.env first.'
      );
    }

    console.log('Updating user password...');
    console.log(`Email: ${email}`);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { email },
      data: { passwordHash }
    });

    console.log('✅ User password updated successfully!');
    console.log('Please check your environment variables for the new password.');
    console.log(`User: ${user.fullName} (${user.email})`);

  } catch (error) {
    console.error('❌ Error updating user password:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateUserPassword();