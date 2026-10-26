/**
 * ==============================================================================
 * LabCore ELIS OS — Production Clinical Test Catalog & Reference Range Seeder
 * Idempotently provisions 150+ accredited diagnostic tests, parameters,
 * reference intervals, and default laboratory governance configuration.
 * Regulatory: NABL ISO 15189:2022, CLSI C28-A3, ICMR Panic Thresholds
 * ==============================================================================
 */

import dotenv from "dotenv";
import path from "path";
const backendDir = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(backendDir, ".env") });
dotenv.config();

import prisma from "../api/config/database";
import { seedDay6ClinicalCatalog } from "./seed-day6-clinical-catalog";

export async function runProductionCatalogSeed() {
  console.log("================================================================================");
  console.log("🧬 LabCore ELIS — Production Clinical Catalog Seeding (NABL ISO 15189:2022)");
  console.log("================================================================================");

  try {
    const result = await seedDay6ClinicalCatalog();

    console.log("\n✅ Production Clinical Catalog Seeding Verification Summary:");
    console.log(`   • Categories Seeded       : ${result.categoriesSeeded}`);
    console.log(`   • Diagnostic Tests Seeded : ${result.testsSeeded}`);
    console.log(`   • Parameters Seeded       : ${result.parametersSeeded}`);
    console.log(`   • Reference Ranges Seeded : ${result.referenceRangesSeeded}`);
    console.log(`   • Health Packages Seeded  : ${result.packagesSeeded}`);
    console.log(`   • Referring Doctors Seeded: ${result.doctorsSeeded}`);
    console.log(`   • Execution Time          : ${(result.elapsedMs / 1000).toFixed(2)}s`);
    console.log("================================================================================\n");

    return result;
  } catch (error) {
    console.error("❌ Fatal Error during production catalog seeding:", error);
    throw error;
  }
}

if (require.main === module) {
  runProductionCatalogSeed()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
