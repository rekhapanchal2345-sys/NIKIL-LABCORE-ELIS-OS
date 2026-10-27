/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NIKIL-LABCORE-ELIS-OS — RBAC DEFAULT USERS SEEDER (DAY 25)
 * ═══════════════════════════════════════════════════════════════════════════
 * Seeds the canonical 7 operational hospital roles with verified credentials,
 * bcrypt + HMAC-peppered passwords, active status, and professional profiles.
 *
 * Certified 7 Hospital Roles:
 * 1. SUPER_ADMIN   (Dr. Rajesh Sharma, MD)
 * 2. ADMIN         (Ananya Sen)
 * 3. PATHOLOGIST   (Dr. Vikramaditya Roy, MD)
 * 4. LAB_TECH      (Suresh Kumar, DMLT)
 * 5. PHLEBOTOMIST  (Pooja Verma)
 * 6. RECEPTIONIST  (Meera Nair)
 * 7. ACCOUNTANT    (Ramesh Patel)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

import prisma from "../api/config/database";
import { hashPassword } from "../api/src/utils/password";
import type { UserRole } from "../api/src/lib/auth";

export interface DefaultHospitalUser {
  email: string;
  employeeCode: string;
  fullName: string;
  role: UserRole;
  specialization: string;
  passwordPlainText: string;
  phone: string;
}

export const CANONICAL_RBAC_USERS: DefaultHospitalUser[] = [
  {
    email: "superadmin@labcore.local",
    employeeCode: "EMP-SA01",
    fullName: "Dr. Rajesh Sharma, MD",
    role: "SUPER_ADMIN",
    specialization: "Pathology Directorate & Hospital Admin",
    passwordPlainText: "SuperAdmin@Secure2026!",
    phone: "9876500001",
  },
  {
    email: "admin@labcore.local",
    employeeCode: "EMP-ADM01",
    fullName: "Ananya Sen, MHA",
    role: "ADMIN",
    specialization: "Laboratory Operations & Quality Assurance",
    passwordPlainText: "Admin@Secure2026!",
    phone: "9876500002",
  },
  {
    email: "pathologist@labcore.local",
    employeeCode: "EMP-PATH01",
    fullName: "Dr. Vikramaditya Roy, MD",
    role: "PATHOLOGIST",
    specialization: "Hematopathology & Clinical Biochemistry",
    passwordPlainText: "Pathologist@Secure2026!",
    phone: "9876500003",
  },
  {
    email: "labtech@labcore.local",
    employeeCode: "EMP-LT01",
    fullName: "Suresh Kumar, DMLT",
    role: "LAB_TECH",
    specialization: "Automated Clinical Chemistry & Analyzers",
    passwordPlainText: "LabTech@Secure2026!",
    phone: "9876500004",
  },
  {
    email: "phlebotomist@labcore.local",
    employeeCode: "EMP-PH01",
    fullName: "Pooja Verma, CPT",
    role: "PHLEBOTOMIST",
    specialization: "Phlebotomy & Sample Accessioning",
    passwordPlainText: "Phlebotomist@Secure2026!",
    phone: "9876500005",
  },
  {
    email: "receptionist@labcore.local",
    employeeCode: "EMP-REC01",
    fullName: "Meera Nair",
    role: "RECEPTIONIST",
    specialization: "Patient Experience & Outpatient Registration",
    passwordPlainText: "Receptionist@Secure2026!",
    phone: "9876500006",
  },
  {
    email: "accountant@labcore.local",
    employeeCode: "EMP-ACC01",
    fullName: "Ramesh Patel, CA Inter",
    role: "ACCOUNTANT",
    specialization: "Hospital Accounts, Billing & Daybook Cashier",
    passwordPlainText: "Accountant@Secure2026!",
    phone: "9876500007",
  },
];

export async function seedRbacUsers(): Promise<{ seededCount: number; users: string[] }> {
  console.log("==============================================================================");
  console.log("🔐 NIKIL-LABCORE-ELIS-OS — SEEDING CANONICAL 7 HOSPITAL OPERATIONAL ROLES");
  console.log("==============================================================================");

  const seeded: string[] = [];

  for (const staff of CANONICAL_RBAC_USERS) {
    const passwordHash = await hashPassword(staff.passwordPlainText);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: staff.email },
          { employeeCode: staff.employeeCode },
        ],
      },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          employeeCode: staff.employeeCode,
          fullName: staff.fullName,
          role: staff.role as any,
          specialization: staff.specialization,
          passwordHash,
          phone: staff.phone,
          status: "ACTIVE",
          emailVerified: true,
          failedLoginCount: 0,
          lockedUntil: null,
        },
      });
      console.log(`  [UPDATE] Updated role account: ${staff.role.padEnd(12)} -> ${staff.email} (${staff.fullName})`);
    } else {
      await prisma.user.create({
        data: {
          email: staff.email,
          employeeCode: staff.employeeCode,
          fullName: staff.fullName,
          role: staff.role as any,
          specialization: staff.specialization,
          passwordHash,
          phone: staff.phone,
          status: "ACTIVE",
          emailVerified: true,
        },
      });
      console.log(`  [CREATE] Provisioned role account: ${staff.role.padEnd(12)} -> ${staff.email} (${staff.fullName})`);
    }

    seeded.push(staff.email);
  }

  console.log("==============================================================================");
  console.log(`✅ Successfully verified & seeded all ${seeded.length} canonical hospital operational roles.`);
  console.log("==============================================================================\n");

  return { seededCount: seeded.length, users: seeded };
}

if (require.main === module) {
  seedRbacUsers()
    .catch((err) => {
      console.error("❌ RBAC Seeding Failed:", err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
