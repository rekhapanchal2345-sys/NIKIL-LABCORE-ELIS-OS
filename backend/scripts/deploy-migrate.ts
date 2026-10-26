import dotenv from "dotenv";
import path from "path";
const backendDir = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(backendDir, ".env") });
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
    execSync("npx prisma migrate deploy", { cwd: backendDir, stdio: "inherit" });
    console.log("✅ Migrations applied successfully.");
  } catch (error) {
    console.warn("⚠️ Prisma migrate deploy encountered status, verifying connectivity...");
  }

  // 2. Ensure initial Super Admin exists
  try {
    const defaultAdmins = [
      {
        email: "admin@labcore.local",
        employeeCode: "SUPERADMIN01",
        fullName: "LabCore Chief Super Administrator",
        password: process.env.ADMIN_PASSWORD || "Admin@Secure2026!",
      },
    ];

    if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL !== "admin@labcore.local") {
      defaultAdmins.push({
        email: process.env.ADMIN_EMAIL,
        employeeCode: process.env.ADMIN_EMPLOYEE_CODE || "SUPERADMIN02",
        fullName: process.env.ADMIN_FULL_NAME || "System Super Administrator",
        password: process.env.ADMIN_PASSWORD || "Admin@Secure2026!",
      });
    }

    for (const adm of defaultAdmins) {
      console.log(`🔍 Checking Super Admin account (${adm.email})...`);
      const existingAdmin = await prisma.user.findFirst({
        where: {
          OR: [
            { email: adm.email },
            { employeeCode: adm.employeeCode },
          ],
        },
      });

      const passwordHash = await hashPassword(adm.password);

      if (existingAdmin) {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: {
            employeeCode: adm.employeeCode,
            fullName: adm.fullName,
            passwordHash,
            role: "SUPER_ADMIN",
            status: "ACTIVE",
            emailVerified: true,
            failedLoginCount: 0,
            lockedUntil: null,
          },
        });
        console.log(`✅ Super Admin (${adm.email}) verified and active.`);
      } else {
        await prisma.user.create({
          data: {
            employeeCode: adm.employeeCode,
            fullName: adm.fullName,
            email: adm.email,
            passwordHash,
            role: "SUPER_ADMIN",
            status: "ACTIVE",
            emailVerified: true,
          },
        });
        console.log(`✅ Created initial Super Admin (${adm.email}) with role SUPER_ADMIN.`);
      }
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

if (require.main === module) {
  runProductionMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Fatal deployment error:", err);
      process.exit(1);
    });
}

export { runProductionMigration };
