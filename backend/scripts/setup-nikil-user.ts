import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

import prisma from "../api/config/database";
import { hashPassword, comparePassword } from "../api/src/utils/password";

async function setupNikilUser() {
  const email = "nikilpanchal88@gmail.com".toLowerCase().trim();
  const rawPassword = "nikil@704198";
  const employeeCode = "NIKIL001";
  const fullName = "Nikil Panchal";

  console.log("==================================================================");
  console.log("🔐 NIKIL-LABCORE-ELIS-OS — CONFIGURING SUPER ADMIN USER");
  console.log("==================================================================");
  console.log(`Target Email: ${email}`);
  console.log(`Employee Code: ${employeeCode}`);

  const passwordHash = await hashPassword(rawPassword);
  const verifyMatch = await comparePassword(rawPassword, passwordHash);
  if (!verifyMatch) {
    throw new Error("Self-check failed: generated password hash does not match input password!");
  }
  console.log("✅ Password successfully peppered & hashed with bcrypt.");

  // Check if user exists by email or employeeCode
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { employeeCode }],
    },
  });

  let savedUser;
  if (existingUser) {
    savedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        email,
        employeeCode: existingUser.employeeCode || employeeCode,
        fullName,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        specialization: "Chief Super Administrator & Laboratory Director",
        department: "Executive Directorate & Laboratory Medicine",
        designation: "Super Administrator / Chief Executive",
        passwordHash,
        emailVerified: true,
        failedLoginCount: 0,
        lockedUntil: null,
        mfaEnabled: false,
        passwordChangedAt: new Date(),
      },
    });
    console.log(`✅ [UPDATED] User ${savedUser.email} (${savedUser.id}) successfully updated to SUPER_ADMIN!`);
  } else {
    savedUser = await prisma.user.create({
      data: {
        email,
        employeeCode,
        fullName,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        specialization: "Chief Super Administrator & Laboratory Director",
        department: "Executive Directorate & Laboratory Medicine",
        designation: "Super Administrator / Chief Executive",
        passwordHash,
        emailVerified: true,
        failedLoginCount: 0,
        lockedUntil: null,
        mfaEnabled: false,
        passwordChangedAt: new Date(),
      },
    });
    console.log(`✅ [CREATED] User ${savedUser.email} (${savedUser.id}) successfully created as SUPER_ADMIN!`);
  }

  console.log("==================================================================");
  console.log("USER PROFILE SUMMARY:");
  console.log(`ID:            ${savedUser.id}`);
  console.log(`Full Name:     ${savedUser.fullName}`);
  console.log(`Email:         ${savedUser.email}`);
  console.log(`Employee Code: ${savedUser.employeeCode}`);
  console.log(`Role:          ${savedUser.role}`);
  console.log(`Status:        ${savedUser.status}`);
  console.log(`MFA Enabled:   ${savedUser.mfaEnabled}`);
  console.log("==================================================================");
}

setupNikilUser()
  .catch((err) => {
    console.error("❌ Setup failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
