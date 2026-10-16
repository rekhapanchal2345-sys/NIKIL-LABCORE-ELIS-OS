import path from "path";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../backend/.env") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const globalForDb = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: pg.Pool;
};

export const pool =
  globalForDb.pool ??
  new pg.Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX || 20),
    min: Number(process.env.DB_POOL_MIN || 2),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
    connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || 5000),
  });

// Prevent unhandled idle client errors from crashing the Node.js process in production
pool.on("error", (err) => {
  console.error("[Postgres Pool] Unexpected error on idle database client:", err.message);
});

const adapter = new PrismaPg(pool);

const prisma =
  globalForDb.prisma ??
  new PrismaClient({
    adapter,
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.prisma = prisma;
  globalForDb.pool = pool;
}

export async function closeDatabasePool(): Promise<void> {
  try {
    await prisma.$disconnect();
    await pool.end();
  } catch {
    // Ignore close errors during shutdown
  }
}

export default prisma;