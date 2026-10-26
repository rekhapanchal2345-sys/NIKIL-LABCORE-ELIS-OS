import dotenv from "dotenv";
import path from "path";
const backendDir = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(backendDir, ".env") });
dotenv.config();

import prisma from "../api/config/database";

async function syncIndexes() {
  console.log("==================================================");
  console.log("⚡ LabCore ELIS — PostgreSQL Index Synchronization");
  console.log("==================================================");

  const indexStatements = [
    {
      table: "tests",
      name: "tests_is_active_category_id_idx",
      sql: `CREATE INDEX IF NOT EXISTS "tests_is_active_category_id_idx" ON "tests"("isActive", "categoryId");`,
    },
    {
      table: "tests",
      name: "tests_test_code_is_active_idx",
      sql: `CREATE INDEX IF NOT EXISTS "tests_test_code_is_active_idx" ON "tests"("testCode", "isActive");`,
    },
    {
      table: "reference_ranges",
      name: "reference_ranges_parameter_id_is_active_idx",
      sql: `CREATE INDEX IF NOT EXISTS "reference_ranges_parameter_id_is_active_idx" ON "reference_ranges"("parameterId", "isActive");`,
    },
    {
      table: "orders",
      name: "orders_branch_id_created_at_idx",
      sql: `CREATE INDEX IF NOT EXISTS "orders_branch_id_created_at_idx" ON "orders"("branch_id", "createdAt");`,
    },
    {
      table: "orders",
      name: "orders_patient_id_created_at_idx",
      sql: `CREATE INDEX IF NOT EXISTS "orders_patient_id_created_at_idx" ON "orders"("patientId", "createdAt");`,
    },
    {
      table: "orders",
      name: "orders_order_status_created_at_idx",
      sql: `CREATE INDEX IF NOT EXISTS "orders_order_status_created_at_idx" ON "orders"("orderStatus", "createdAt");`,
    },
    {
      table: "samples",
      name: "samples_order_id_status_idx",
      sql: `CREATE INDEX IF NOT EXISTS "samples_order_id_status_idx" ON "samples"("orderId", "status");`,
    },
    {
      table: "samples",
      name: "samples_status_collected_at_idx",
      sql: `CREATE INDEX IF NOT EXISTS "samples_status_collected_at_idx" ON "samples"("status", "collectedAt");`,
    },
  ];

  try {
    for (const stmt of indexStatements) {
      console.log(`🔨 Applying index: ${stmt.name} on ${stmt.table}...`);
      await prisma.$executeRawUnsafe(stmt.sql);
      console.log(`   ✅ Index verified: ${stmt.name}`);
    }

    // Verify key indexes via PostgreSQL pg_indexes catalog
    const indexes: Array<{ tablename: string; indexname: string; indexdef: string }> = await prisma.$queryRaw`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('orders', 'samples', 'tests', 'reference_ranges')
      ORDER BY tablename, indexname;
    `;

    console.log(`\n📊 Verified ${indexes.length} total indexes in PostgreSQL catalog for core clinical tables:`);
    for (const idx of indexes) {
      console.log(`  - [${idx.tablename}] ${idx.indexname}`);
    }
  } catch (error) {
    console.error("❌ Index sync failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

syncIndexes();
