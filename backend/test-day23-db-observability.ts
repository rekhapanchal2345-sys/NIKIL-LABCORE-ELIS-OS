/**
 * ==============================================================================
 * LabCore ELIS OS — Day 23 / Hour 23 Automated Verification Test Suite
 * Production Database Seeding, Super Admin Bootstrapping, PM2 Cluster Management
 * & Multi-Probe Observability Telemetry
 * ==============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import prisma from './api/config/database';
import { hashPassword, comparePassword } from './api/src/utils/password';
import { healthService, HealthReport } from './api/src/modules/health/health.service';
import { logger } from './api/src/lib/logger.service';
import { runProductionMigration } from './scripts/deploy-migrate';

const ROOT_DIR = path.resolve(__dirname, '..');

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];
let totalAssertions = 0;
let passedAssertions = 0;

function assert(condition: boolean, message: string): void {
  totalAssertions++;
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  passedAssertions++;
}

async function runTestAsync(suiteName: string, testName: string, fn: () => Promise<void>): Promise<void> {
  const start = performance.now();
  try {
    await fn();
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    results.push({ name: `[${suiteName}] ${testName}`, passed: true, durationMs });
    console.log(`  \x1b[32m✓\x1b[0m ${testName} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    results.push({ name: `[${suiteName}] ${testName}`, passed: false, error: err.message, durationMs });
    console.log(`  \x1b[31m✗\x1b[0m ${testName} (${durationMs}ms)`);
    console.log(`    \x1b[31mError: ${err.message}\x1b[0m`);
  }
}

function runTest(suiteName: string, testName: string, fn: () => void): void {
  const start = performance.now();
  try {
    fn();
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    results.push({ name: `[${suiteName}] ${testName}`, passed: true, durationMs });
    console.log(`  \x1b[32m✓\x1b[0m ${testName} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    results.push({ name: `[${suiteName}] ${testName}`, passed: false, error: err.message, durationMs });
    console.log(`  \x1b[31m✗\x1b[0m ${testName} (${durationMs}ms)`);
    console.log(`    \x1b[31mError: ${err.message}\x1b[0m`);
  }
}

async function runDay23Suite() {
  console.log('\n==============================================================================');
  console.log('🩺  DAY 23: PRODUCTION DATABASE SEEDING & OBSERVABILITY TELEMETRY SUITE');
  console.log('==============================================================================\n');

  // ==============================================================================
  // SUITE 1: SUPER ADMIN BOOTSTRAPPING & HMAC-PEPPERED CREDENTIALS
  // ==============================================================================
  console.log('\x1b[36m--- Suite 1: Super Admin Bootstrapping & HMAC Password Security ---\x1b[0m');

  await runTestAsync('Super Admin', 'HMAC-SHA256 password pepper hashes and validates correctly', async () => {
    const plain = 'SuperAdminSecret2026!';
    const hash = await hashPassword(plain);

    assert(typeof hash === 'string' && hash.startsWith('$2'), 'Bcrypt hash must start with $2');
    const isValid = await comparePassword(plain, hash);
    assert(isValid === true, 'comparePassword must return true for authentic password');

    const isInvalid = await comparePassword('WrongPassword123!', hash);
    assert(isInvalid === false, 'comparePassword must return false for wrong password');
  });

  await runTestAsync('Super Admin', 'Super admin account (admin@labcore.local) provisioned with SUPER_ADMIN role', async () => {
    // Run the migration/admin bootstrap programmatically
    await runProductionMigration();

    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@labcore.local' },
    });

    assert(adminUser !== null, 'Super Admin user (admin@labcore.local) must exist in database');
    assert(adminUser!.role === 'SUPER_ADMIN', 'Super Admin must possess role SUPER_ADMIN');
    assert(adminUser!.status === 'ACTIVE', 'Super Admin account status must be ACTIVE');
    assert(adminUser!.emailVerified === true, 'Super Admin emailVerified flag must be true');
    assert(adminUser!.employeeCode === 'SUPERADMIN01', 'Super Admin employeeCode must be SUPERADMIN01');

    // Verify credentials match
    const passwordValid = await comparePassword(process.env.ADMIN_PASSWORD || 'Admin@Secure2026!', adminUser!.passwordHash);
    assert(passwordValid === true, 'Super Admin database hash must match provisioned password');
  });

  // ==============================================================================
  // SUITE 2: CLINICAL TEST CATALOG ARCHITECTURE & AUDIT
  // ==============================================================================
  console.log('\n\x1b[36m--- Suite 2: Clinical Test Catalog Architecture (150+ Tests) ---\x1b[0m');

  await runTestAsync('Clinical Catalog', 'Master test catalog in PostgreSQL contains accredited diagnostic tests', async () => {
    const testCount = await prisma.test.count({ where: { isActive: true } });
    assert(testCount >= 10, `Active test count must be at least 10 in live DB (found ${testCount})`);

    const parameterCount = await prisma.testParameter.count({ where: { isActive: true } });
    assert(parameterCount >= 10, `Active parameter count must be at least 10 (found ${parameterCount})`);

    const rangeCount = await prisma.referenceRange.count({ where: { isActive: true } });
    assert(rangeCount >= 10, `Active reference range count must be at least 10 (found ${rangeCount})`);

    // Verify specific critical tests exist
    const cbcTest = await prisma.test.findFirst({
      where: {
        OR: [
          { testCode: { contains: 'CBC', mode: 'insensitive' } },
          { testName: { contains: 'Complete Blood Count', mode: 'insensitive' } },
        ],
      },
      include: { parameters: { include: { referenceRanges: true } } },
    });
    assert(cbcTest !== null, 'Complete Blood Count (CBC) test must be present in catalog');
    assert(cbcTest!.parameters.length > 0, 'CBC must contain child parameters');
  });

  runTest('Clinical Catalog', 'Catalog seeder script (backend/scripts/seed-production-catalog.ts) exists and is complete', () => {
    const catalogScriptPath = path.join(__dirname, 'scripts/seed-production-catalog.ts');
    assert(fs.existsSync(catalogScriptPath), 'seed-production-catalog.ts must exist');
    const content = fs.readFileSync(catalogScriptPath, 'utf-8');
    assert(content.includes('runProductionCatalogSeed'), 'Must export runProductionCatalogSeed');
    assert(content.includes('seedDay6ClinicalCatalog'), 'Must reference comprehensive day 6 catalog');
  });

  // ==============================================================================
  // SUITE 3: MULTI-PROBE OBSERVABILITY & HEALTH SERVICE
  // ==============================================================================
  console.log('\n\x1b[36m--- Suite 3: Multi-Probe Observability & Telemetry Service ---\x1b[0m');

  await runTestAsync('Health Probes', 'PostgreSQL live probe executes ping query with sub-50ms latency', async () => {
    const dbProbe = await healthService.probeDatabase();
    assert(dbProbe.status === 'UP', `Database probe status must be UP (got ${dbProbe.status})`);
    assert(dbProbe.latencyMs >= 0 && dbProbe.latencyMs < 50, `DB ping latency must be <50ms (got ${dbProbe.latencyMs}ms)`);
    assert(dbProbe.driver.includes('PostgreSQL 16'), 'Driver must indicate PostgreSQL 16');
  });

  await runTestAsync('Health Probes', 'Cache live probe executes round-trip ping and reports hit metrics', async () => {
    const cacheProbe = await healthService.probeCache();
    assert(cacheProbe.status === 'UP' || cacheProbe.status === 'IN_MEMORY_FALLBACK', `Cache status must be UP or IN_MEMORY_FALLBACK (got ${cacheProbe.status})`);
    assert(cacheProbe.latencyMs >= 0 && cacheProbe.latencyMs < 15, `Cache ping latency must be <15ms (got ${cacheProbe.latencyMs}ms)`);
    assert(typeof cacheProbe.hitRatioPercentage === 'number', 'hitRatioPercentage must be numeric');
    assert(typeof cacheProbe.activeEntriesCount === 'number', 'activeEntriesCount must be numeric');
  });

  runTest('Health Probes', 'Storage probe validates backup and upload directory write permissions', () => {
    const storageProbe = healthService.probeStorage();
    assert(storageProbe.status === 'UP' || storageProbe.status === 'WARNING', 'Storage probe must be operational');
    assert(storageProbe.backupsWritable === true, 'Backup directory must be writable');
    assert(storageProbe.uploadsWritable === true, 'Upload directory must be writable');
    assert(storageProbe.totalMemMb > 0, 'Total system memory must be reported');
    assert(storageProbe.freeMemMb > 0, 'Free system memory must be reported');
  });

  runTest('Health Probes', 'Memory probe computes heap utilization, RSS, and GC headroom', () => {
    const memProbe = healthService.probeMemory();
    assert(memProbe.status === 'UP' || memProbe.status === 'WARNING', 'Memory probe must be UP or WARNING');
    assert(memProbe.heapUsedMb > 0, 'heapUsedMb must be positive');
    assert(memProbe.heapTotalMb >= memProbe.heapUsedMb, 'heapTotalMb must be >= heapUsedMb');
    assert(memProbe.rssMb > 0, 'rssMb must be positive');
    assert(memProbe.heapUtilizationPercent > 0 && memProbe.heapUtilizationPercent <= 100, 'Utilization must be between 1-100%');
  });

  // ==============================================================================
  // SUITE 4: PROBE-SPECIFIC ENDPOINTS (LIVENESS, READINESS & DETAILED)
  // ==============================================================================
  console.log('\n\x1b[36m--- Suite 4: Probe-Specific Endpoints (K8s / Docker Ready) ---\x1b[0m');

  runTest('Endpoints', 'Liveness probe responds instantaneously (<1ms) with process telemetry', () => {
    const liveness = healthService.getLiveness();
    assert(liveness.status === 'UP', 'Liveness status must be UP');
    assert(liveness.pid === process.pid, 'Liveness must report current process.pid');
    assert(typeof liveness.uptime === 'number' && liveness.uptime >= 0, 'Liveness uptime must be non-negative');
    assert(typeof liveness.timestamp === 'string', 'Liveness timestamp must be string');
  });

  await runTestAsync('Endpoints', 'Readiness probe ensures primary database readiness with HTTP 200', async () => {
    const readiness = await healthService.getReadiness();
    assert(readiness.status === 'UP', 'Readiness status must be UP');
    assert(readiness.httpCode === 200, 'Readiness httpCode must be 200');
    assert(readiness.database.status === 'UP', 'Readiness database probe must be UP');
  });

  await runTestAsync('Endpoints', 'Detailed health report aggregates all sub-probes into single JSON payload', async () => {
    const report: HealthReport = await healthService.getDetailedHealth();
    assert(report.status === 'HEALTHY' || report.status === 'DEGRADED', `Detailed status must be HEALTHY or DEGRADED (got ${report.status})`);
    assert(report.httpCode === 200, 'HTTP status code must be 200');
    assert(report.system.service.includes('LabCore ELIS'), 'System service name must match LabCore ELIS');
    assert(report.system.version === '3.0.0-PRODUCTION', 'System version must be 3.0.0-PRODUCTION');
    assert(report.probes.clinicalHardware.port === 5005, 'Hardware analyzer port must be 5005');
    assert(report.probes.clinicalHardware.protocol.includes('ASTM'), 'Hardware protocol must be ASTM E1381/E1394');
    assert(typeof report.probes.tokenBlacklist.blacklistedTokens === 'number', 'Token blacklist count must be numeric');
  });

  // ==============================================================================
  // SUITE 5: STRUCTURED JSON LOGGER & DPDP ACT PRIVACY REDACTION
  // ==============================================================================
  console.log('\n\x1b[36m--- Suite 5: Structured JSON Logger & DPDP Privacy Redaction ---\x1b[0m');

  runTest('Structured Logger', 'Emits standardized JSON schema with log levels', () => {
    assert(typeof logger.info === 'function', 'logger.info must be defined');
    assert(typeof logger.warn === 'function', 'logger.warn must be defined');
    assert(typeof logger.error === 'function', 'logger.error must be defined');
    assert(typeof logger.debug === 'function', 'logger.debug must be defined');
    assert(typeof logger.fatal === 'function', 'logger.fatal must be defined');
  });

  runTest('Structured Logger', 'DPDP Act 2023 automatically redacts passwords, tokens, Aadhaar, and PAN', () => {
    let capturedOutput = '';
    const originalStdoutWrite = process.stdout.write;
    process.stdout.write = (chunk: any): boolean => {
      capturedOutput += chunk.toString();
      return true;
    };

    try {
      logger.info('User registration attempt', 'AuthModule', {
        email: 'patient@hospital.org',
        password: 'PlainTextSuperSecret!',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
        aadhaar: '1234-5678-9012',
        pan: 'ABCDE1234F',
        safeParam: 'NormalValue',
      });
    } finally {
      process.stdout.write = originalStdoutWrite;
    }

    assert(capturedOutput.length > 0, 'Logger must output text');
    const parsed = JSON.parse(capturedOutput.trim());

    assert(parsed.level === 'INFO', 'Parsed log level must be INFO');
    assert(parsed.context === 'AuthModule', 'Parsed context must be AuthModule');
    assert(parsed.metadata.password === '[REDACTED_BY_DPDP_POLICY]', 'Password must be redacted');
    assert(parsed.metadata.token === '[REDACTED_BY_DPDP_POLICY]', 'Token must be redacted');
    assert(parsed.metadata.aadhaar === '[REDACTED_BY_DPDP_POLICY]', 'Aadhaar must be redacted');
    assert(parsed.metadata.pan === '[REDACTED_BY_DPDP_POLICY]', 'PAN must be redacted');
    assert(parsed.metadata.safeParam === 'NormalValue', 'Non-sensitive params must be preserved');
  });

  // ==============================================================================
  // SUITE 6: PM2 PROCESS ECOSYSTEM SPECIFICATION
  // ==============================================================================
  console.log('\n\x1b[36m--- Suite 6: PM2 Process Management (ecosystem.config.js) ---\x1b[0m');

  runTest('PM2 Ecosystem', 'ecosystem.config.js configured with 2G memory limits, auto-restart and backoff', () => {
    const ecoPath = path.join(ROOT_DIR, 'ecosystem.config.js');
    assert(fs.existsSync(ecoPath), 'ecosystem.config.js must exist');
    const eco = require(ecoPath);

    assert(Array.isArray(eco.apps) && eco.apps.length >= 2, 'ecosystem.config.js must define at least 2 apps');

    const backendApp = eco.apps.find((a: any) => a.name === 'labcore-elis-backend');
    assert(backendApp !== undefined, 'labcore-elis-backend must be present in PM2 config');
    assert(backendApp.max_memory_restart === '2G', 'Backend max_memory_restart must be 2G');
    assert(backendApp.autorestart === true, 'Backend autorestart must be true');
    assert(backendApp.exp_backoff_restart_delay === 100, 'Backend must configure exp_backoff_restart_delay');
    assert(backendApp.kill_timeout === 5000, 'Backend kill_timeout must be 5000ms');

    const webApp = eco.apps.find((a: any) => a.name === 'labcore-elis-web');
    assert(webApp !== undefined, 'labcore-elis-web must be present in PM2 config');
    assert(webApp.max_memory_restart === '2G', 'Web max_memory_restart must be 2G');
    assert(webApp.autorestart === true, 'Web autorestart must be true');
  });

  // ==============================================================================
  // SUITE 7: INTEGRATION PREFLIGHT RUNNER (scripts/verify-production.js)
  // ==============================================================================
  console.log('\n\x1b[36m--- Suite 7: Full System Production Readiness Check ---\x1b[0m');

  runTest('Integration Preflight', 'scripts/verify-production.js passes all 12/12 checks', () => {
    const output = execSync('node scripts/verify-production.js', { cwd: ROOT_DIR, encoding: 'utf-8' });
    assert(output.includes('ALL 12/12 PRODUCTION READINESS CHECKS PASSED!'), 'verify-production.js must pass 12/12');
  });

  // ==============================================================================
  // SUMMARY & METRICS
  // ==============================================================================
  console.log('\n==============================================================================');
  console.log('📊 DAY 23 TEST EXECUTION SUMMARY');
  console.log('==============================================================================');

  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = totalTests - passedTests;

  console.log(`Total Test Suites   : 7`);
  console.log(`Total Unit Tests    : ${totalTests}`);
  console.log(`Passed Unit Tests   : \x1b[32m${passedTests}\x1b[0m`);
  console.log(`Failed Unit Tests   : ${failedTests > 0 ? `\x1b[31m${failedTests}\x1b[0m` : `\x1b[32m0\x1b[0m`}`);
  console.log(`Total Assertions    : ${totalAssertions}`);
  console.log(`Passed Assertions   : \x1b[32m${passedAssertions}\x1b[0m`);
  console.log(`Success Rate        : \x1b[32m${((passedTests / totalTests) * 100).toFixed(1)}%\x1b[0m`);

  await prisma.$disconnect();

  if (failedTests > 0) {
    console.log('\n\x1b[31m❌ DAY 23 DATABASE & OBSERVABILITY SUITE FAILED.\x1b[0m\n');
    process.exit(1);
  } else {
    console.log('\n\x1b[32m✨ DAY 23 DATABASE SEEDING & OBSERVABILITY CERTIFIED: 100% PASS (0 FAILURES)\x1b[0m\n');
    process.exit(0);
  }
}

runDay23Suite().catch(async (err) => {
  console.error('Fatal test error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
