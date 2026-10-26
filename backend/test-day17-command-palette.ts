import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, ".env") });

import prisma from "./api/config/database";
import {
  levenshteinDistance,
  damerauLevenshteinDistance,
  calculateSimilarity,
  soundex,
  isPhoneticMatch,
  fuzzyScore,
  highlightMatch,
} from "./api/src/modules/search/fuzzy.util";
import {
  SearchService,
  SYSTEM_ACTIONS,
  SearchResultItem,
  SearchCategory,
} from "./api/src/modules/search/search.service";
import { SearchController } from "./api/src/modules/search/search.controller";
import { BranchService } from "./api/src/modules/branches/branch.service";

async function runDay17Tests() {
  console.log("================================================================================");
  console.log("🔍 DAY 17 EMPIRICAL TEST SUITE: ENTERPRISE COMMAND PALETTE & MULTI-ENTITY SEARCH");
  console.log("================================================================================\n");

  const runId = Date.now().toString().slice(-6);
  let passedAssertions = 0;

  function assert(condition: boolean, desc: string) {
    if (!condition) {
      console.error(`❌ ASSERTION FAILED: ${desc}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
    passedAssertions++;
    console.log(`  ✓ [ASSERT #${passedAssertions}] ${desc}`);
  }

  // Tracking entities for cleanup
  let branchAId: string | null = null;
  let branchBId: string | null = null;
  let doctorId: string | null = null;
  let testId: string | null = null;
  let patientAId: string | null = null;
  let patientBId: string | null = null;
  let orderAId: string | null = null;
  let sampleAId: string | null = null;

  try {
    // -------------------------------------------------------------------------
    // STEP 1: FUZZY STRING ALGORITHMS & EDIT DISTANCE VERIFICATION
    // -------------------------------------------------------------------------
    console.log("🔷 Step 1: Testing String Distance, Phonetics, and Fuzzy Relevance Algorithms...");

    // 1.1 Levenshtein Distance
    assert(levenshteinDistance("clinical", "clinical") === 0, "Levenshtein distance for identical strings must be 0");
    assert(levenshteinDistance("", "hematology") === 10, "Distance between empty string and 10-char word must be 10");
    assert(levenshteinDistance("doctor", "docter") === 1, "Single substitution must have distance 1");
    assert(levenshteinDistance("sample", "sampl") === 1, "Single deletion must have distance 1");
    assert(levenshteinDistance("lab", "labs") === 1, "Single insertion must have distance 1");

    // 1.2 Damerau-Levenshtein Distance (Transposition check)
    // Transposition of adjacent characters: "tset" -> "test", "clnical" -> "clinical"
    const standardLev = levenshteinDistance("tset", "test");
    const damerauLev = damerauLevenshteinDistance("tset", "test");
    assert(damerauLev === 1, `Damerau-Levenshtein transposition of 'se'->'es' in 'tset' must equal 1 (got ${damerauLev})`);
    assert(standardLev === 2, "Standard Levenshtein counts transposition as 2 operations");

    const clinicalDamerau = damerauLevenshteinDistance("clnical", "clinical");
    assert(clinicalDamerau === 1, "Clerical omission typo in 'clnical' must have distance 1");

    // 1.3 Normalized Similarity
    const simExact = calculateSimilarity("Hemoglobin", "Hemoglobin");
    assert(simExact === 1.0, `Exact match similarity must be 1.0 (got ${simExact})`);

    const simPanchal = calculateSimilarity("Panchal", "Panchel");
    assert(simPanchal >= 0.85, `Typo similarity for 'Panchal' vs 'Panchel' must be >= 0.85 (got ${simPanchal.toFixed(2)})`);

    const simUnrelated = calculateSimilarity("Hematology", "Zygote");
    assert(simUnrelated < 0.3, `Unrelated strings similarity must be < 0.3 (got ${simUnrelated.toFixed(2)})`);

    // 1.4 Soundex & Phonetic Matching (Critical for Indian Clinician & Patient Names)
    const soundexAshok = soundex("Ashok");
    const soundexAshoc = soundex("Ashoc");
    assert(soundexAshok === soundexAshoc, `'Ashok' and 'Ashoc' must yield identical Soundex code: ${soundexAshok}`);
    assert(isPhoneticMatch("Smith", "Smyth") === true, "Phonetic match for 'Smith' and 'Smyth' must be true");

    // 1.5 Multi-criteria Fuzzy Scoring
    const scoreExact = fuzzyScore("Complete Blood Count", "Complete Blood Count");
    assert(scoreExact.score === 1.0 && scoreExact.matchType === "EXACT", "Exact text match must return score 1.0 and matchType EXACT");

    const scorePrefix = fuzzyScore("Hemoglobin HPLC", "hemo");
    assert(scorePrefix.score >= 0.90 && scorePrefix.matchType === "PREFIX", "Prefix match must return score >= 0.90 and matchType PREFIX");

    const scoreWord = fuzzyScore("Routine Complete Urine Analysis", "urine");
    assert(scoreWord.score >= 0.80 && scoreWord.matchType === "WORD_BOUNDARY", "Word boundary match must return score >= 0.80 and matchType WORD_BOUNDARY");

    const scoreSub = fuzzyScore("Lipid Profile Fasting", "rofile");
    assert(scoreSub.score >= 0.70 && scoreSub.matchType === "SUBSTRING", "Substring match must return score >= 0.70 and matchType SUBSTRING");

    const scorePhonetic = fuzzyScore("Thyroid Stimulating Hormone", "thyrod");
    assert(scorePhonetic.isMatch === true && scorePhonetic.matchType === "PHONETIC", "Phonetic similarity for 'thyrod'->'Thyroid' must return matchType PHONETIC");

    const scoreFuzzy = fuzzyScore("Blood Glucose", "blook");
    assert(scoreFuzzy.isMatch === true && scoreFuzzy.matchType === "FUZZY", "Approximate typo in 'blook' must match 'Blood' with matchType FUZZY");

    const scoreNone = fuzzyScore("Blood Glucose", "xyzabc999");
    assert(scoreNone.isMatch === false && scoreNone.score === 0, "Completely mismatched query must return score 0 and matchType NONE");

    // 1.6 Highlight utility
    const highlighted = highlightMatch("Complete Blood Count", "Blood");
    assert(highlighted.includes("<mark") && highlighted.includes("Blood</mark>"), "Highlight utility must wrap matched query in <mark> tag");

    // -------------------------------------------------------------------------
    // STEP 2: MULTI-ENTITY DATABASE SEEDING
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 2: Seeding Test Branches, Doctors, Tests, Patients, Orders & Samples...");

    // 2.1 Two separate branches for tenancy isolation verification
    const branchA = await BranchService.createBranch({
      code: `BLR-${runId}`,
      name: `LabCore Bengaluru Center ${runId}`,
      city: "Bengaluru",
      state: "Karnataka",
    });
    branchAId = branchA.id;
    assert(branchAId !== null, `Branch A (Bengaluru) created successfully with ID: ${branchAId}`);

    const branchB = await BranchService.createBranch({
      code: `MUM-${runId}`,
      name: `LabCore Mumbai Satellite ${runId}`,
      city: "Mumbai",
      state: "Maharashtra",
    });
    branchBId = branchB.id;
    assert(branchBId !== null, `Branch B (Mumbai) created successfully with ID: ${branchBId}`);

    // 2.2 Referring Doctor
    const doctor = await prisma.doctor.create({
      data: {
        doctorCode: `DOC-SRCH-${runId}`,
        fullName: `Dr. Arvind Shinde ${runId}`,
        specialization: "Consultant Pathologist",
        clinicName: "Shinde Advanced Diagnostics",
        phone: `98200${runId.slice(0, 5)}`,
        registrationNumber: `MCI-${runId}`,
      },
    });
    doctorId = doctor.id;
    assert(doctorId !== null, `Test Doctor created with code: ${doctor.doctorCode}`);

    // 2.3 Master Test Catalog Item
    const testItem = await prisma.test.create({
      data: {
        testCode: `TST-SRCH-${runId}`,
        testName: `Hemoglobin HPLC Electrophoresis ${runId}`,
        shortName: `Hb-HPLC-${runId}`,
        sampleType: "BLOOD",
        price: 850,
        tatHours: 4,
        method: "Bio-Rad D-10 Dual Program",
      },
    });
    testId = testItem.id;
    assert(testId !== null, `Test Catalog assay created with code: ${testItem.testCode}`);

    // 2.4 Patient A in Branch A (Bengaluru)
    const patientA = await prisma.patient.create({
      data: {
        uhid: `UHID-SRCH-BLR-${runId}`,
        firstName: "Devendra",
        lastName: `Patel-${runId}`,
        gender: "MALE",
        age: 52,
        phone: `91981${runId.slice(0, 5)}`,
        email: `devendra.${runId}@labcore.test`,
        branchId: branchAId,
      },
    });
    patientAId = patientA.id;
    assert(patientAId !== null, `Patient A seeded in Bengaluru branch (UHID: ${patientA.uhid})`);

    // 2.5 Patient B in Branch B (Mumbai)
    const patientB = await prisma.patient.create({
      data: {
        uhid: `UHID-SRCH-MUM-${runId}`,
        firstName: "Mukesh",
        lastName: `Ambani-${runId}`,
        gender: "MALE",
        age: 65,
        phone: `91982${runId.slice(0, 5)}`,
        email: `mukesh.${runId}@labcore.test`,
        branchId: branchBId,
      },
    });
    patientBId = patientB.id;
    assert(patientBId !== null, `Patient B seeded in Mumbai branch (UHID: ${patientB.uhid})`);

    // 2.6 Order in Branch A
    const orderA = await prisma.order.create({
      data: {
        orderNumber: `ORD-SRCH-${runId}`,
        barcode: `BC-SRCH-${runId}`,
        patientId: patientAId,
        doctorId: doctorId,
        branchId: branchAId,
        orderStatus: "PROCESSING",
        paymentStatus: "PAID",
        grandTotal: 850,
      },
    });
    orderAId = orderA.id;
    assert(orderAId !== null, `Order seeded with number: ${orderA.orderNumber}`);

    // 2.7 Sample in Branch A
    const sampleA = await prisma.sample.create({
      data: {
        sampleNumber: `SMP-NUM-${runId}`,
        barcode: `SMP-BC-${runId}`,
        patientId: patientAId,
        orderId: orderAId,
        testId: testId,
        sampleType: "BLOOD",
        status: "RECEIVED",
      },
    });
    sampleAId = sampleA.id;
    assert(sampleAId !== null, `Sample specimen seeded with barcode: ${sampleA.barcode}`);

    // -------------------------------------------------------------------------
    // STEP 3: MULTI-ENTITY SEARCH ENGINE VERIFICATION
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 3: Testing SearchService.globalSearch Across All 5 Domain Entities...");

    // 3.1 Search Patients by UHID
    const searchByUhid = await SearchService.globalSearch({
      query: `UHID-SRCH-BLR-${runId}`,
      category: "PATIENTS",
    });
    assert(searchByUhid.categories.patients.length > 0, "Search by UHID must find at least 1 patient");
    assert(searchByUhid.categories.patients[0].tag === `UHID-SRCH-BLR-${runId}`, "Patient tag must match exact UHID");
    assert(searchByUhid.categories.patients[0].type === "PATIENT", "Entity type must be PATIENT");

    // 3.2 Search Patients by First Name
    const searchByName = await SearchService.globalSearch({
      query: "Devendra",
      category: "PATIENTS",
    });
    assert(searchByName.categories.patients.some(p => p.title.includes("Devendra")), "Search by first name 'Devendra' must return patient record");

    // 3.3 Search Orders by Order Number
    const searchByOrderNum = await SearchService.globalSearch({
      query: `ORD-SRCH-${runId}`,
      category: "ORDERS",
    });
    assert(searchByOrderNum.categories.orders.length > 0, "Search by orderNumber must find order");
    assert(searchByOrderNum.categories.orders[0].type === "ORDER", "Entity type must be ORDER");
    assert(searchByOrderNum.categories.orders[0].title === `Order ORD-SRCH-${runId}`, "Order title must display order number");

    // 3.4 Search Orders by Barcode
    const searchByOrderBarcode = await SearchService.globalSearch({
      query: `BC-SRCH-${runId}`,
      category: "ORDERS",
    });
    assert(searchByOrderBarcode.categories.orders.length > 0, "Search by order barcode must find order");

    // 3.5 Search Samples by Barcode
    const searchBySampleBarcode = await SearchService.globalSearch({
      query: `SMP-BC-${runId}`,
      category: "SAMPLES",
    });
    assert(searchBySampleBarcode.categories.samples.length > 0, "Search by sample barcode must find sample record");
    assert(searchBySampleBarcode.categories.samples[0].type === "SAMPLE", "Entity type must be SAMPLE");
    assert(searchBySampleBarcode.categories.samples[0].subtitle.includes("BLOOD"), "Sample subtitle must include specimen type");

    // 3.6 Search Tests by Name
    const searchByTestName = await SearchService.globalSearch({
      query: `Hemoglobin HPLC Electrophoresis ${runId}`,
      category: "TESTS",
    });
    assert(searchByTestName.categories.tests.length > 0, "Search by test name must find test catalog record");
    assert(searchByTestName.categories.tests[0].type === "TEST", "Entity type must be TEST");
    assert(searchByTestName.categories.tests[0].tag === "₹850", "Test tag must display price in INR");

    // 3.7 Search Tests by Code
    const searchByTestCode = await SearchService.globalSearch({
      query: `TST-SRCH-${runId}`,
      category: "TESTS",
    });
    assert(searchByTestCode.categories.tests.length > 0, "Search by test code must find test");

    // 3.8 Search Doctors by Name
    const searchByDoctorName = await SearchService.globalSearch({
      query: `Arvind Shinde ${runId}`,
      category: "DOCTORS",
    });
    assert(searchByDoctorName.categories.doctors.length > 0, "Search by doctor name must find doctor record");
    assert(searchByDoctorName.categories.doctors[0].type === "DOCTOR", "Entity type must be DOCTOR");
    assert(searchByDoctorName.categories.doctors[0].subtitle.includes("Consultant Pathologist"), "Doctor subtitle must contain specialization");

    // 3.9 Search Doctors by Specialization
    const searchByDoctorSpec = await SearchService.globalSearch({
      query: "Consultant Pathologist",
      category: "DOCTORS",
    });
    assert(searchByDoctorSpec.categories.doctors.length > 0, "Search by doctor specialization must return results");

    // -------------------------------------------------------------------------
    // STEP 4: CATEGORY ISOLATION FILTERING VERIFICATION
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 4: Testing Strict Category Isolation (PATIENTS, ORDERS, SAMPLES, TESTS, DOCTORS, ACTIONS)...");

    // When searching with category "PATIENTS", no other entity types should be returned
    const catPatientSearch = await SearchService.globalSearch({
      query: runId,
      category: "PATIENTS",
    });
    assert(catPatientSearch.categories.patients.length > 0, "Patient search should have patient results");
    assert(catPatientSearch.categories.orders.length === 0, "Patient search must have 0 orders");
    assert(catPatientSearch.categories.samples.length === 0, "Patient search must have 0 samples");
    assert(catPatientSearch.categories.tests.length === 0, "Patient search must have 0 tests");
    assert(catPatientSearch.categories.doctors.length === 0, "Patient search must have 0 doctors");

    // When searching with category "ORDERS"
    const catOrderSearch = await SearchService.globalSearch({
      query: runId,
      category: "ORDERS",
    });
    assert(catOrderSearch.categories.orders.length > 0, "Orders search should have order results");
    assert(catOrderSearch.categories.patients.length === 0, "Orders search must have 0 patients");

    // When searching with category "ACTIONS"
    const catActionSearch = await SearchService.globalSearch({
      query: "Patient",
      category: "ACTIONS",
    });
    assert(catActionSearch.categories.actions.length > 0, "Actions search should have action results");
    assert(catActionSearch.categories.patients.length === 0, "Actions search must have 0 patients");
    assert(catActionSearch.results.every(r => r.type === "ACTION"), "All results in ACTIONS filter must be type ACTION");

    // -------------------------------------------------------------------------
    // STEP 5: MULTI-BRANCH TENANT ISOLATION IN SEARCH
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 5: Testing Multi-Branch Data Segregation in Search Queries...");

    // Search scoped to Branch A (Bengaluru)
    const searchBranchA = await SearchService.globalSearch({
      query: runId,
      category: "PATIENTS",
      branchId: branchAId,
    });
    const foundInA = searchBranchA.categories.patients.map(p => p.tag);
    assert(foundInA.includes(`UHID-SRCH-BLR-${runId}`), "Branch A search must find Bengaluru patient");
    assert(!foundInA.includes(`UHID-SRCH-MUM-${runId}`), "Branch A search MUST NOT leak Mumbai patient");

    // Search scoped to Branch B (Mumbai)
    const searchBranchB = await SearchService.globalSearch({
      query: runId,
      category: "PATIENTS",
      branchId: branchBId,
    });
    const foundInB = searchBranchB.categories.patients.map(p => p.tag);
    assert(foundInB.includes(`UHID-SRCH-MUM-${runId}`), "Branch B search must find Mumbai patient");
    assert(!foundInB.includes(`UHID-SRCH-BLR-${runId}`), "Branch B search MUST NOT leak Bengaluru patient");

    // Search without branch filter (HQ Super Admin view)
    const searchHQ = await SearchService.globalSearch({
      query: runId,
      category: "PATIENTS",
      branchId: null,
    });
    const foundInHQ = searchHQ.categories.patients.map(p => p.tag);
    assert(foundInHQ.includes(`UHID-SRCH-BLR-${runId}`), "HQ search must include Branch A patient");
    assert(foundInHQ.includes(`UHID-SRCH-MUM-${runId}`), "HQ search must include Branch B patient");

    // -------------------------------------------------------------------------
    // STEP 6: CURATED SYSTEM ACTIONS & KEYBOARD SHORTCUT REGISTRY
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 6: Testing Keyboard Quick Actions Registry & Hospital Hotkeys...");

    const actions = SearchService.getQuickActions();
    assert(actions.length >= 10, `Quick actions registry must contain at least 10 actions (found ${actions.length})`);

    const actionNewPatient = actions.find(a => a.id === "act-register-patient");
    assert(actionNewPatient !== undefined, "Register New Patient action must exist");
    assert(actionNewPatient?.shortcut === "Alt+P", "Register Patient shortcut must be Alt+P");

    const actionNewOrder = actions.find(a => a.id === "act-new-order");
    assert(actionNewOrder?.shortcut === "Alt+O", "Create Order shortcut must be Alt+O");

    const actionDaybook = actions.find(a => a.id === "act-daybook");
    assert(actionDaybook?.shortcut === "Alt+S", "Cash Shift Daybook shortcut must be Alt+S");

    const actionApprovals = actions.find(a => a.id === "act-approvals");
    assert(actionApprovals?.shortcut === "Alt+Q", "Pathologist Approvals shortcut must be Alt+Q");

    const actionReports = actions.find(a => a.id === "act-reports");
    assert(actionReports?.shortcut === "Alt+R", "Reports shortcut must be Alt+R");

    // -------------------------------------------------------------------------
    // STEP 7: RECENT SEARCHES LRU QUEUE SIMULATION
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 7: Testing Recent Searches LRU Cache Algorithm (Max 10, Deduplication)...");

    function updateRecentSearches(existing: string[], term: string, maxLimit = 10): string[] {
      const cleanTerm = term.trim();
      if (!cleanTerm) return existing;
      return [cleanTerm, ...existing.filter(s => s.toLowerCase() !== cleanTerm.toLowerCase())].slice(0, maxLimit);
    }

    let cache: string[] = ["CBC", "Lipid", "Urine", "Glucose", "Thyroid"];
    // Add existing term "Lipid" -> must bubble to head without duplicating
    cache = updateRecentSearches(cache, "Lipid");
    assert(cache[0] === "Lipid", "Recently used term 'Lipid' must be placed at the head of recent searches");
    assert(cache.filter(s => s === "Lipid").length === 1, "Duplicate occurrences of 'Lipid' must be eliminated");

    // Add 10 new distinct terms -> cache capacity must cap strictly at 10
    for (let i = 1; i <= 12; i++) {
      cache = updateRecentSearches(cache, `Query-${i}`);
    }
    assert(cache.length === 10, `Recent searches cache length must be capped at 10 (got ${cache.length})`);
    assert(cache[0] === "Query-12", "Latest query 'Query-12' must be at index 0");
    assert(!cache.includes("CBC"), "Oldest search term 'CBC' must have been evicted");

    // -------------------------------------------------------------------------
    // STEP 8: CONTROLLER & API CONTRACT VERIFICATION
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 8: Testing Express Controller Contract & Query Sanitization...");

    // Mock Express Request & Response objects
    let statusSent = 0;
    let jsonPayload: any = null;

    const mockReq: any = {
      query: {
        q: "devendra",
        category: "ALL",
        limit: "5",
      },
      headers: {},
      user: { branchId: branchAId },
    };

    const mockRes: any = {
      status(code: number) {
        statusSent = code;
        return this;
      },
      json(data: any) {
        jsonPayload = data;
        return this;
      },
    };

    await SearchController.globalSearch(mockReq, mockRes);
    assert(statusSent === 200, `Controller response status must be 200 (got ${statusSent})`);
    assert(jsonPayload.success === true, "Response JSON must include success: true");
    assert(jsonPayload.data.query === "devendra", "Returned data must mirror search query");
    assert(Array.isArray(jsonPayload.data.results), "Returned data must include results array");
    assert(typeof jsonPayload.data.totalMatches === "number", "Returned data must include totalMatches count");

    console.log("\n================================================================================");
    console.log(`🏆 ALL ${passedAssertions} DAY 17 EMPIRICAL ASSERTIONS PASSED WITH 100% SUCCESS!`);
    console.log("================================================================================\n");
  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP ARTIFACTS
    // -------------------------------------------------------------------------
    console.log("🧹 Cleaning up Day 17 test artifacts from database...");
    if (sampleAId) await prisma.sample.delete({ where: { id: sampleAId } }).catch(() => {});
    if (orderAId) await prisma.order.delete({ where: { id: orderAId } }).catch(() => {});
    if (patientAId) await prisma.patient.delete({ where: { id: patientAId } }).catch(() => {});
    if (patientBId) await prisma.patient.delete({ where: { id: patientBId } }).catch(() => {});
    if (testId) await prisma.test.delete({ where: { id: testId } }).catch(() => {});
    if (doctorId) await prisma.doctor.delete({ where: { id: doctorId } }).catch(() => {});
    if (branchAId) await prisma.branch.delete({ where: { id: branchAId } }).catch(() => {});
    if (branchBId) await prisma.branch.delete({ where: { id: branchBId } }).catch(() => {});
    console.log("✅ Cleanup complete.");
  }
}

runDay17Tests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ DAY 17 TEST EXECUTION FAILED:", err);
    process.exit(1);
  });
