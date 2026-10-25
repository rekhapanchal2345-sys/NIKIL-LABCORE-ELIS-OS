/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🏛️ NIKIL-LABCORE-ELIS-OS — DAY 6 EMPIRICAL VALIDATION & BENCHMARK SUITE
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * File: backend/test-day6-catalog-seeding.ts
 * Command: npx tsx backend/test-day6-catalog-seeding.ts
 *
 * Empirical Assertions Verified:
 *   1. Catalog Volume Assertions:
 *      - >= 150 active diagnostic tests exist in PostgreSQL
 *      - >= 400 total parameters registered with valid units & LOINC® mappings
 *      - >= 800 CLSI C28-A3 stratified reference ranges with normal low/high intervals
 *   2. Clinical Integrity Assertions:
 *      - CBC test contains >= 20 parameters (22 parameters) & age/gender-stratified ranges
 *      - Critical panic boundaries (criticalLow, criticalHigh) for Potassium (2.8 / 6.2),
 *        Glucose (45 / 450), Calcium (6.5 / 13.0), and Platelets (20,000 / 1,000,000)
 *        strictly match ICMR & CLSI standards
 *   3. Package & Pricing Assertions:
 *      - All 6 mandated preventive packages (PKG-MASTER, PKG-DIABETIC, PKG-CARDIAC,
 *        PKG-WOMEN, PKG-GERIATRIC, PKG-PREOP) have valid bundled items, positive price
 *        calculations, total savings, and discountPercentage integrity
 *   4. Physician Directory Assertions:
 *      - >= 20 multi-specialty doctors registered with unique medical council codes
 *        (KMC, MMC, DMC, TNMC, etc.) and valid specialties & commission rules
 *   5. Laboratory Settings Governance:
 *      - LaboratorySettings record exists with NABL certificate MC-6184,
 *        ISO 15189:2022 accreditation, GSTIN 29AAAAA0000A1Z5, and RPT prefix
 *   6. Query Performance & Fast API Endpoint Benchmark:
 *      - Full catalog searches ("Hemoglobin", "Thyroid", "Lipid") and LOINC resolution
 *        complete in < 50 ms
 *   7. Idempotency Verification:
 *      - Re-running seedDay6ClinicalCatalog() completes with zero P2002 duplicate errors
 */

import prisma from './api/src/lib/prisma';
import { Gender } from '@prisma/client';
import {
  seedDay6ClinicalCatalog,
  DAY6_CATEGORIES,
  DAY6_TESTS,
  DAY6_PACKAGES,
  DAY6_DOCTORS,
  DAY6_LABORATORY_SETTINGS,
} from './scripts/seed-day6-clinical-catalog';
import {
  getCatalogDirectory,
  getPackages,
  getParametersByLoincCode,
} from './api/src/modules/tests/test.service';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

let passedAssertions = 0;

function assertCondition(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(`❌ EMPIRICAL ASSERTION FAILED: ${message}`);
  }
  passedAssertions++;
  console.log(`  ${ANSI.green}✔ [PASS #${passedAssertions}]${ANSI.reset} ${message}`);
}

async function runDay6ValidationSuite(): Promise<void> {
  console.log(`${ANSI.cyan}${ANSI.bold}══════════════════════════════════════════════════════════════════════════════════════════${ANSI.reset}`);
  console.log(`${ANSI.cyan}${ANSI.bold}🏛️  NIKIL-LABCORE-ELIS-OS — DAY 6 EMPIRICAL VALIDATION SUITE${ANSI.reset}`);
  console.log(`${ANSI.yellow}   Phase: Real-World Clinical Test Catalog Seeding, LOINC®, CLSI C28-A3 & Fast Search${ANSI.reset}`);
  console.log(`${ANSI.cyan}${ANSI.bold}══════════════════════════════════════════════════════════════════════════════════════════${ANSI.reset}\n`);

  // ─────────────────────────────────────────────────────────────────────────────────────
  // PRE-FLIGHT: Static Dictionary Integrity Verification
  // ─────────────────────────────────────────────────────────────────────────────────────
  console.log(`${ANSI.magenta}${ANSI.bold}▶ [STEP 0/7] Verifying Static Clinical Catalog Dictionary Definitions...${ANSI.reset}`);

  const totalDictParams = DAY6_TESTS.reduce((sum, t) => sum + t.parameters.length, 0);
  const totalDictRanges = DAY6_TESTS.reduce(
    (sum, t) => sum + t.parameters.reduce((pSum, p) => pSum + p.referenceRanges.length, 0),
    0
  );

  assertCondition(
    DAY6_CATEGORIES.length >= 8,
    `Clinical category dictionary defines ${DAY6_CATEGORIES.length} accredited departments (required >= 8)`
  );
  assertCondition(
    DAY6_TESTS.length >= 150,
    `Diagnostic test dictionary defines ${DAY6_TESTS.length} real-world clinical tests (required >= 150)`
  );
  assertCondition(
    totalDictParams >= 400,
    `Test parameter dictionary defines ${totalDictParams} LOINC-mapped parameters (required >= 400)`
  );
  assertCondition(
    totalDictRanges >= 800,
    `Reference range dictionary defines ${totalDictRanges} CLSI C28-A3 intervals (required >= 800)`
  );

  // ─────────────────────────────────────────────────────────────────────────────────────
  // STEP 1: Execute Master Seed Script & Verify Idempotency on Repeated Run
  // ─────────────────────────────────────────────────────────────────────────────────────
  console.log(`\n${ANSI.magenta}${ANSI.bold}▶ [STEP 1/7] Running Master Seed Script & Verifying Idempotent Re-Execution...${ANSI.reset}`);

  const firstRunSummary = await seedDay6ClinicalCatalog();
  const secondRunSummary = await seedDay6ClinicalCatalog();

  assertCondition(
    firstRunSummary.testsSeeded === secondRunSummary.testsSeeded &&
      firstRunSummary.testsSeeded >= 150,
    `Idempotent re-run succeeded with 0 duplicate key errors (${secondRunSummary.testsSeeded} tests preserved)`
  );

  // ─────────────────────────────────────────────────────────────────────────────────────
  // STEP 2: Catalog Volume Assertions in PostgreSQL
  // ─────────────────────────────────────────────────────────────────────────────────────
  console.log(`\n${ANSI.magenta}${ANSI.bold}▶ [STEP 2/7] Asserting PostgreSQL Catalog Volumes (Tests, Parameters, Ranges)...${ANSI.reset}`);

  const [
    activeCategoryCount,
    activeTestCount,
    totalParamCount,
    loincMappedParamCount,
    totalRangeCount,
    numericIntervalRangeCount,
  ] = await Promise.all([
    prisma.testCategory.count({ where: { isActive: true } }),
    prisma.test.count({ where: { isActive: true } }),
    prisma.testParameter.count({ where: { isActive: true } }),
    prisma.testParameter.count({
      where: {
        isActive: true,
        loincCode: { not: null },
        unit: { not: null },
      },
    }),
    prisma.referenceRange.count({ where: { isActive: true } }),
    prisma.referenceRange.count({
      where: {
        isActive: true,
        normalLow: { not: null },
        normalHigh: { not: null },
      },
    }),
  ]);

  assertCondition(
    activeCategoryCount >= 8,
    `Active TestCategories in PostgreSQL = ${activeCategoryCount} (expected >= 8)`
  );
  assertCondition(
    activeTestCount >= 150,
    `Active Diagnostic Tests in PostgreSQL = ${activeTestCount} (expected >= 150)`
  );
  assertCondition(
    totalParamCount >= 400 && loincMappedParamCount >= 400,
    `Registered TestParameters with valid units & LOINC codes = ${loincMappedParamCount}/${totalParamCount} (expected >= 400)`
  );
  assertCondition(
    totalRangeCount >= 800 && numericIntervalRangeCount >= 800,
    `CLSI C28-A3 ReferenceRanges in PostgreSQL = ${totalRangeCount} total / ${numericIntervalRangeCount} numeric intervals (expected >= 800)`
  );

  // ─────────────────────────────────────────────────────────────────────────────────────
  // STEP 3: Clinical Integrity & ICMR/CLSI Critical Panic Threshold Assertions
  // ─────────────────────────────────────────────────────────────────────────────────────
  console.log(`\n${ANSI.magenta}${ANSI.bold}▶ [STEP 3/7] Asserting Clinical Integrity (CBC 22-Param Panel & Critical Panic Thresholds)...${ANSI.reset}`);

  const cbcTest = await prisma.test.findUnique({
    where: { testCode: 'CBC' },
    include: {
      parameters: {
        where: { isActive: true },
        include: {
          referenceRanges: {
            where: { isActive: true },
          },
        },
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  assertCondition(cbcTest !== null, 'CBC test (testCode: "CBC") exists in PostgreSQL');
  assertCondition(
    Number(cbcTest?.gstPercentage ?? -1) === 0,
    `CBC gstPercentage is 0% under Healthcare GST Exemption Notification 12/2017 (got ${cbcTest?.gstPercentage})`
  );
  assertCondition(
    (cbcTest?.parameters.length ?? 0) >= 20,
    `CBC panel contains ${cbcTest?.parameters.length} clinical parameters (expected >= 20)`
  );

  const hbParam = cbcTest?.parameters.find((p) => p.loincCode === '718-7');
  assertCondition(Boolean(hbParam), 'CBC contains Hemoglobin parameter mapped to LOINC 718-7');

  const hbAdultMale = hbParam?.referenceRanges.find(
    (r) => r.ageGroup === 'ADULT' && r.gender === Gender.MALE
  );
  const hbAdultFemale = hbParam?.referenceRanges.find(
    (r) => r.ageGroup === 'ADULT' && r.gender === Gender.FEMALE
  );
  const hbNewborn = hbParam?.referenceRanges.find((r) => r.ageGroup === 'NEWBORN');

  assertCondition(
    Number(hbAdultMale?.normalLow) === 13.0 &&
      Number(hbAdultMale?.normalHigh) === 17.0 &&
      Number(hbAdultFemale?.normalLow) === 12.0 &&
      Number(hbAdultFemale?.normalHigh) === 15.0 &&
      Boolean(hbNewborn),
    `Hemoglobin (718-7) is age/sex stratified: Adult Male (${hbAdultMale?.normalLow}–${hbAdultMale?.normalHigh} g/dL), Adult Female (${hbAdultFemale?.normalLow}–${hbAdultFemale?.normalHigh} g/dL), Newborn (${hbNewborn?.normalLow}–${hbNewborn?.normalHigh} g/dL)`
  );

  // Verify Critical Panic Thresholds: Potassium, Glucose, Calcium, Platelets
  const [potassiumParam, fastingGlucoseParam, calciumParam, plateletParam] = await Promise.all([
    prisma.testParameter.findFirst({
      where: { loincCode: '2823-3', test: { testCode: 'KFT' } },
      include: { referenceRanges: true },
    }),
    prisma.testParameter.findFirst({
      where: { loincCode: '1558-6', test: { testCode: 'FBS' } },
      include: { referenceRanges: true },
    }),
    prisma.testParameter.findFirst({
      where: { loincCode: '17861-6', test: { testCode: 'KFT' } },
      include: { referenceRanges: true },
    }),
    prisma.testParameter.findFirst({
      where: { loincCode: '777-3', test: { testCode: 'CBC' } },
      include: { referenceRanges: true },
    }),
  ]);

  const kAdult = potassiumParam?.referenceRanges.find((r) => r.ageGroup === 'ADULT');
  assertCondition(
    Number(kAdult?.criticalLow) === 2.8 && Number(kAdult?.criticalHigh) === 6.2,
    `Potassium (LOINC 2823-3) Panic Thresholds match ICMR/CLSI: LL=${kAdult?.criticalLow} mmol/L, HH=${kAdult?.criticalHigh} mmol/L`
  );

  const gluAdult = fastingGlucoseParam?.referenceRanges.find((r) => r.ageGroup === 'ADULT');
  assertCondition(
    Number(gluAdult?.criticalLow) === 45 && Number(gluAdult?.criticalHigh) === 450,
    `Fasting Glucose (LOINC 1558-6) Panic Thresholds match ICMR/CLSI: LL=${gluAdult?.criticalLow} mg/dL, HH=${gluAdult?.criticalHigh} mg/dL`
  );

  const caAdult = calciumParam?.referenceRanges.find((r) => r.ageGroup === 'ADULT');
  assertCondition(
    Number(caAdult?.criticalLow) === 6.5 && Number(caAdult?.criticalHigh) === 13.0,
    `Serum Calcium (LOINC 17861-6) Panic Thresholds match ICMR/CLSI: LL=${caAdult?.criticalLow} mg/dL, HH=${caAdult?.criticalHigh} mg/dL`
  );

  const pltAdult = plateletParam?.referenceRanges.find((r) => r.ageGroup === 'ADULT');
  assertCondition(
    Number(pltAdult?.criticalLow) === 20000 && Number(pltAdult?.criticalHigh) === 1000000,
    `Platelet Count (LOINC 777-3) Panic Thresholds match ICMR/CLSI: LL=${pltAdult?.criticalLow} /mcL, HH=${pltAdult?.criticalHigh} /mcL`
  );

  // ─────────────────────────────────────────────────────────────────────────────────────
  // STEP 4: Preventive Health Package & Pricing Integrity Assertions
  // ─────────────────────────────────────────────────────────────────────────────────────
  console.log(`\n${ANSI.magenta}${ANSI.bold}▶ [STEP 4/7] Asserting Preventive Health Packages & Bundled Pricing Calculations...${ANSI.reset}`);

  const requiredPackageCodes = [
    'PKG-MASTER',
    'PKG-DIABETIC',
    'PKG-CARDIAC',
    'PKG-WOMEN',
    'PKG-GERIATRIC',
    'PKG-PREOP',
  ];

  const packagesResponse = await getPackages(undefined, true, undefined, 1, 50);
  const seededPackages = packagesResponse.packages;

  assertCondition(
    seededPackages.length >= 6,
    `Active wellness packages returned by getPackages() = ${seededPackages.length} (expected >= 6)`
  );

  for (const code of requiredPackageCodes) {
    const pkg = seededPackages.find((p) => p.packageCode === code);
    assertCondition(Boolean(pkg), `Package ${code} exists and is active`);
    assertCondition(
      (pkg?.items.length ?? 0) >= 6 &&
        Number(pkg?.totalPrice) > Number(pkg?.offerPrice) &&
        Number(pkg?.offerPrice) > 0 &&
        Number(pkg?.discountPercentage) > 0 &&
        Number(pkg?.totalSavings) > 0,
      `${code} (${pkg?.packageName}): ${pkg?.items.length} bundled tests | MRP ₹${pkg?.totalPrice} → Offer ₹${pkg?.offerPrice} (Saves ₹${pkg?.totalSavings} / ${pkg?.discountPercentage}%)`
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────────────
  // STEP 5: Physician Directory & Medical Council Governance Assertions
  // ─────────────────────────────────────────────────────────────────────────────────────
  console.log(`\n${ANSI.magenta}${ANSI.bold}▶ [STEP 5/7] Asserting Multi-Specialty Physician Directory & Commission Rules...${ANSI.reset}`);

  const doctors = await prisma.doctor.findMany({
    where: { isActive: true },
    include: { organization: true },
  });

  assertCondition(
    doctors.length >= 20,
    `Active referring & consulting doctors in PostgreSQL = ${doctors.length} (expected >= 20)`
  );

  const day6DoctorCodes = new Set(DAY6_DOCTORS.map((d) => d.doctorCode));
  const day6DoctorsInDb = doctors.filter((d) => day6DoctorCodes.has(d.doctorCode));
  const uniqueRegNumbers = new Set(
    day6DoctorsInDb.map((d) => d.registrationNumber).filter(Boolean)
  );
  const uniqueSpecialties = new Set(
    day6DoctorsInDb.map((d) => d.specialization).filter(Boolean)
  );

  assertCondition(
    uniqueRegNumbers.size === day6DoctorsInDb.length && day6DoctorsInDb.length >= 20,
    `All ${day6DoctorsInDb.length} Day 6 doctors have unique Medical Council registration numbers (KMC, MMC, DMC, TNMC, etc.)`
  );
  assertCondition(
    uniqueSpecialties.size >= 9,
    `Physician directory spans ${uniqueSpecialties.size} clinical specialties (${Array.from(uniqueSpecialties).slice(0, 6).join(', ')}...)`
  );

  // ─────────────────────────────────────────────────────────────────────────────────────
  // STEP 6: Laboratory Settings & NABL ISO 15189:2022 Governance Assertions
  // ─────────────────────────────────────────────────────────────────────────────────────
  console.log(`\n${ANSI.magenta}${ANSI.bold}▶ [STEP 6/7] Asserting LaboratorySettings NABL MC-6184 & ISO 15189:2022 Governance...${ANSI.reset}`);

  const labSettings = await prisma.laboratorySettings.findFirst();

  assertCondition(labSettings !== null, 'LaboratorySettings record exists in PostgreSQL');
  assertCondition(
    labSettings?.labName === DAY6_LABORATORY_SETTINGS.labName,
    `Laboratory Name = "${labSettings?.labName}"`
  );
  assertCondition(
    Boolean(labSettings?.nablAccreditation?.includes('MC-6184')) &&
      Boolean(labSettings?.nablAccreditation?.includes('ISO 15189:2022')),
    `NABL Accreditation Certificate verified: "${labSettings?.nablAccreditation}"`
  );
  assertCondition(
    labSettings?.gstin === '29AAAAA0000A1Z5' && labSettings?.reportIdPrefix === 'RPT',
    `Statutory GSTIN (${labSettings?.gstin}) and Report Prefix (${labSettings?.reportIdPrefix}) verified`
  );

  // ─────────────────────────────────────────────────────────────────────────────────────
  // STEP 7: Query Performance Benchmark (< 50 ms) & LOINC Endpoint Resolution
  // ─────────────────────────────────────────────────────────────────────────────────────
  console.log(`\n${ANSI.magenta}${ANSI.bold}▶ [STEP 7/7] Running Fast API Catalog Search (< 50 ms SLA) & LOINC Resolution Benchmarks...${ANSI.reset}`);

  // Warmup connection pool
  await getCatalogDirectory({ search: 'CBC', page: 1, limit: 10 });

  const benchmarkQueries = ['Hemoglobin', 'Thyroid', 'Lipid'];
  for (const term of benchmarkQueries) {
    const t0 = performance.now();
    const res = await getCatalogDirectory({ search: term, page: 1, limit: 20 });
    const elapsedMs = Number((performance.now() - t0).toFixed(2));

    assertCondition(
      res.tests.length > 0 && elapsedMs < 50,
      `Catalog search for "${term}" returned ${res.tests.length} matching tests in ${elapsedMs} ms (SLA < 50 ms)`
    );
  }

  // Verify LOINC resolution endpoint service
  const loincHb = await getParametersByLoincCode('718-7');
  assertCondition(
    loincHb.matchCount >= 1 && loincHb.primaryParameter.unit === 'g/dL',
    `LOINC resolver ("718-7") resolved "${loincHb.primaryParameter.parameterName}" (${loincHb.primaryParameter.unit}) across ${loincHb.matchCount} test(s) in ${loincHb.telemetry.queryTimeMs} ms`
  );

  const loincHba1c = await getParametersByLoincCode('4548-4');
  assertCondition(
    loincHba1c.matchCount >= 1 && loincHba1c.primaryParameter.test.testCode === 'HBA1C',
    `LOINC resolver ("4548-4") resolved "${loincHba1c.primaryParameter.parameterName}" in test ${loincHba1c.primaryParameter.test.testCode}`
  );

  console.log(`\n${ANSI.green}${ANSI.bold}══════════════════════════════════════════════════════════════════════════════════════════${ANSI.reset}`);
  console.log(`${ANSI.green}${ANSI.bold}🎉 ALL ${passedAssertions} DAY 6 EMPIRICAL VALIDATION & PERFORMANCE CHECKS PASSED 100%!${ANSI.reset}`);
  console.log(`${ANSI.green}${ANSI.bold}══════════════════════════════════════════════════════════════════════════════════════════${ANSI.reset}\n`);
}

if (require.main === module) {
  runDay6ValidationSuite()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(`\n${ANSI.red}${ANSI.bold}❌ DAY 6 VALIDATION SUITE FAILED:${ANSI.reset}`, err);
      await prisma.$disconnect();
      process.exit(1);
    });
}

export { runDay6ValidationSuite };
