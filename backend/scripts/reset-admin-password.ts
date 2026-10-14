import 'dotenv/config';
import prisma from '../api/config/database';
import bcrypt from 'bcryptjs';
import { hashPassword } from '../api/src/utils/password';

async function resetAdminPassword() {
  try {
    const newPassword = process.env.NEW_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
    const email = (process.env.ADMIN_EMAIL || '').toLowerCase();

    if (!email) {
      throw new Error('ADMIN_EMAIL is not set. Add it to backend/.env first.');
    }
    if (!newPassword) {
      throw new Error('NEW_ADMIN_PASSWORD or ADMIN_PASSWORD is not set. Add it to backend/.env first.');
    }

    console.log('🔐 Resetting admin password...');
    console.log(`Email: ${email}`);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('❌ Admin user not found!');
      console.log('Please run create-admin script first to create the admin user.');
      return;
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { email },
      data: { passwordHash }
    });

    console.log('✅ Admin password reset successfully!');
    console.log('========================================');
    console.log('Login Credentials:');
    console.log('========================================');
    console.log(`Email: ${email}`);
    console.log('Password: [CONFIGURED IN .ENV]');
    console.log('========================================');

  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
