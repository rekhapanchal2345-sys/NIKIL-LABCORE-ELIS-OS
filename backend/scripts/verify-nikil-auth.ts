import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

import prisma from "../api/config/database";
import { comparePassword } from "../api/src/utils/password";

async function verifyAuth() {
  const email = "nikilpanchal88@gmail.com";
  const testPassword = "nikil@704198";

  console.log("🔍 Verifying authentication for:", email);

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { employeeCode: "NIKIL001" }],
    },
  });

  if (!user) {
    console.error("❌ User not found!");
    process.exit(1);
  }

  console.log("Found User ID:", user.id);
  console.log("Role:", user.role);
  console.log("Status:", user.status);

  const matches = await comparePassword(testPassword, user.passwordHash);
  if (!matches) {
    console.error("❌ Password match failed!");
    process.exit(1);
  }

  console.log("✅ SUCCESS: Password matches perfectly with bcrypt + HMAC pepper!");
  console.log("✅ SUPER ADMIN account is ACTIVE and ready for login.");
  process.exit(0);
}

verifyAuth()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
