import dotenv from "dotenv";
dotenv.config();

import { execSync } from "child_process";
import prisma from "../api/config/database";
import { hashPassword } from "../api/src/utils/password";

async function runProductionMigration() {
  console.log("==================================================");
  console.log("🚀 LabCore ELIS — Production Database Migration");
  console.log("==================================================");

  // 1. Run Prisma migrate deploy
  console.log("📦 Applying pending database migrations...");
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    console.log("✅ Migrations applied successfully.");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  // 2. Ensure initial Super Admin exists
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "nikilpanchal0@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@Secure2026!";
    const employeeCode = process.env.ADMIN_EMPLOYEE_CODE || "SUPERADMIN01";
    const fullName = process.env.ADMIN_FULL_NAME || "System Super Administrator";

    console.log(`🔍 Checking Super Admin account (${adminEmail})...`);
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: adminEmail },
          { employeeCode: employeeCode },
        ],
      },
    });

    const passwordHash = await hashPassword(adminPassword);

    if (existingAdmin) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          emailVerified: true,
          failedLoginCount: 0,
          lockedUntil: null,
        },
      });
      console.log(`✅ Super Admin (${adminEmail}) verified and active.`);
    } else {
      await prisma.user.create({
        data: {
          employeeCode,
          fullName,
          email: adminEmail,
          passwordHash,
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          emailVerified: true,
        },
      });
      console.log(`✅ Created initial Super Admin (${adminEmail}) with role SUPER_ADMIN.`);
    }
  } catch (error) {
    console.error("⚠️ Note: Super Admin check encountered error:", error);
  } finally {
    await prisma.$disconnect();
  }

  console.log("==================================================");
  console.log("🎉 Production Database Setup Complete & Ready!");
  console.log("==================================================");
}

runProductionMigration().catch((err) => {
  console.error("Fatal deployment error:", err);
  process.exit(1);
});
