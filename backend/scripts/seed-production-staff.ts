/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NIKIL-LABCORE-ELIS-OS — PRODUCTION HOSPITAL STAFF SEEDER (DAY 30)
 * ═══════════════════════════════════════════════════════════════════════════
 * Provisions canonical production hospital staff accounts with Bcrypt 12 +
 * HMAC-SHA256 peppered passwords across all core clinical & admin roles.
 *
 * Certified Standards:
 * - NABL ISO 15189:2022 §5.10 (Role Competency & Digital Identity)
 * - DPDP Act 2023 §8 (Credential Security & Separation of Duties)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import prisma from "../api/config/database";
import { hashPassword } from "../api/src/utils/password";
import { UserRole } from "@prisma/client";

export interface ProductionStaffAccount {
  email: string;
  fullName: string;
  role: UserRole;
  employeeCode: string;
  phone: string;
  defaultPassword?: string;
}

export const PRODUCTION_STAFF_ACCOUNTS: ProductionStaffAccount[] = [
  {
    email: "admin@labcore.local",
    fullName: "Dr. Vikram Sethi (Super Administrator)",
    role: "SUPER_ADMIN",
    employeeCode: "EMP-SA-001",
    phone: "9811002201",
  },
  {
    email: "pathologist@labcore.local",
    fullName: "Dr. Ananya Roy, MD (Lead Pathologist)",
    role: "PATHOLOGIST",
    employeeCode: "EMP-PAT-001",
    phone: "9811002202",
  },
  {
    email: "labtech@labcore.local",
    fullName: "Suresh Kumar (Senior Medical Lab Technologist)",
    role: "LAB_TECH",
    employeeCode: "EMP-LT-001",
    phone: "9811002203",
  },
  {
    email: "phlebotomist@labcore.local",
    fullName: "Pooja Verma (Certified Phlebotomy Specialist)",
    role: "PHLEBOTOMIST",
    employeeCode: "EMP-PHL-001",
    phone: "9811002204",
  },
  {
    email: "receptionist@labcore.local",
    fullName: "Neha Sharma (Front Desk & Billing Executive)",
    role: "RECEPTIONIST",
    employeeCode: "EMP-REC-001",
    phone: "9811002205",
  },
  {
    email: "accountant@labcore.local",
    fullName: "Rajesh Gupta (Chief Financial Accountant)",
    role: "ACCOUNTANT",
    employeeCode: "EMP-ACT-001",
    phone: "9811002206",
  },
];

export async function seedProductionStaff(defaultPassword = "LabCoreProduction2026!") {
  console.log("[StaffSeeder] Provisioning active hospital staff accounts for Go-Live...");
  const passwordHash = await hashPassword(defaultPassword);
  const provisioned = [];

  for (const staff of PRODUCTION_STAFF_ACCOUNTS) {
    const user = await prisma.user.upsert({
      where: { email: staff.email },
      create: {
        email: staff.email,
        fullName: staff.fullName,
        role: staff.role,
        employeeCode: staff.employeeCode,
        phone: staff.phone,
        status: "ACTIVE",
        emailVerified: true,
        passwordHash,
      },
      update: {
        fullName: staff.fullName,
        role: staff.role,
        employeeCode: staff.employeeCode,
        phone: staff.phone,
        status: "ACTIVE",
        passwordHash,
      },
    });
    provisioned.push(user);
    console.log(`  👤 [${user.role}] ${user.fullName} (${user.email}) -> ACTIVE`);
  }

  console.log(`[StaffSeeder] Successfully provisioned ${provisioned.length} hospital staff accounts.`);
  return provisioned;
}

if (require.main === module) {
  seedProductionStaff()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[StaffSeeder] Seeding failed:", err);
      process.exit(1);
    });
}
