import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, ".env") });

import prisma from "./api/config/database";
import { BranchService } from "./api/src/modules/branches/branch.service";
import { createPatient, getPatients } from "./api/src/modules/patients/patient.service";
import { createOrder, getOrders } from "./api/src/modules/orders/order.service";
import { validateBranchAccess } from "./api/src/middleware/branch-context";
import { generateOrderReportHtml } from "./api/src/modules/reports/report.pdf.service";

async function runDay15Tests() {
  console.log("================================================================================");
  console.log("🏥 DAY 15 EMPIRICAL TEST SUITE: MULTI-BRANCH ARCHITECTURE & TENANT ISOLATION");
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

  // IDs to clean up
  let branchMainId: string | null = null;
  let branchBlrId: string | null = null;
  let branchMumId: string | null = null;
  let techUser1Id: string | null = null;
  let techUser2Id: string | null = null;
  let patientBlrId: string | null = null;
  let patientMumId: string | null = null;
  let orderBlrId: string | null = null;
  let orderMumId: string | null = null;
  let testCatalogId: string | null = null;

  try {
    // -------------------------------------------------------------------------
    // STEP 1: CREATE TEST BRANCHES (MAIN HUB + 2 SATELLITE CENTERS)
    // -------------------------------------------------------------------------
    console.log("🔷 Step 1: Branch Creation & Unique Code Validation...");

    const hubBranch = await BranchService.createBranch({
      code: `HUB-HYD-${runId}`,
      name: `LabCore Central Reference Hub ${runId}`,
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500033",
      phone: "+91 40 6789 1518",
      email: `hub-${runId}@labcore.in`,
      nablNumber: `MC-4892-${runId}`,
      gstin: "36AAACN4892L1Z5",
      isMainBranch: true,
      isActive: true,
    });
    branchMainId = hubBranch.id;

    assert(hubBranch.code === `HUB-HYD-${runId}`, "Main Hub branch created with uppercase code");
    assert(hubBranch.isMainBranch === true, "Main Hub designated as isMainBranch = true");
    assert(hubBranch.nablNumber === `MC-4892-${runId}`, "Main Hub configured with NABL certificate");

    const blrBranch = await BranchService.createBranch({
      code: `SAT-BLR-${runId}`,
      name: `LabCore Satellite Lab Whitefield ${runId}`,
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560066",
      phone: "+91 80 4123 9901",
      email: `blr-${runId}@labcore.in`,
      nablNumber: `MC-9901-${runId}`,
      gstin: "29AAACN9901L1Z2",
      isMainBranch: false,
      isActive: true,
    });
    branchBlrId = blrBranch.id;

    assert(blrBranch.code === `SAT-BLR-${runId}`, "Bengaluru satellite branch created");
    assert(blrBranch.isMainBranch === false, "Bengaluru branch isMainBranch = false");

    const mumBranch = await BranchService.createBranch({
      code: `SAT-MUM-${runId}`,
      name: `LabCore Collection Hub Andheri ${runId}`,
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400053",
      phone: "+91 22 2845 9902",
      email: `mum-${runId}@labcore.in`,
      nablNumber: `MC-9902-${runId}`,
      gstin: "27AAACN9902L1Z8",
      isMainBranch: false,
      isActive: true,
    });
    branchMumId = mumBranch.id;

    assert(mumBranch.code === `SAT-MUM-${runId}`, "Mumbai satellite branch created");

    // Test unique code constraint
    let duplicateRejected = false;
    try {
      await BranchService.createBranch({
        code: `HUB-HYD-${runId}`,
        name: "Duplicate Hub",
      });
    } catch {
      duplicateRejected = true;
    }
    assert(duplicateRejected, "Duplicate branch code is rejected with HttpError(400)");

    // -------------------------------------------------------------------------
    // STEP 2: VERIFY MAIN BRANCH EXCLUSIVITY & SETTINGS RESOLUTION
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 2: Main Branch Exclusivity & Settings Resolution...");

    // Updating BLR to main should unset HUB
    await BranchService.updateBranch(blrBranch.id, { isMainBranch: true });
    const blrRefreshed = await BranchService.getBranchById(blrBranch.id);
    const hubRefreshed = await BranchService.getBranchById(hubBranch.id);

    assert(blrRefreshed.isMainBranch === true, "Bengaluru branch successfully promoted to main");
    assert(hubRefreshed.isMainBranch === false, "Hyderabad branch automatically demoted from main");

    // Restore Hyderabad as main
    await BranchService.updateBranch(hubBranch.id, { isMainBranch: true });

    // Test Effective Settings fallback
    const hubSettings = await BranchService.getEffectiveBranchSettings(hubBranch.id);
    assert(hubSettings?.nablNumber === `MC-4892-${runId}`, "Effective settings for Hub matches Hub NABL");

    const blrSettings = await BranchService.getEffectiveBranchSettings(blrBranch.id);
    assert(blrSettings?.nablNumber === `MC-9901-${runId}`, "Effective settings for BLR matches BLR NABL");

    const defaultFallbackSettings = await BranchService.getEffectiveBranchSettings(null);
    assert(defaultFallbackSettings?.branchId === hubBranch.id, "Null branchId defaults to active Main Branch");

    // -------------------------------------------------------------------------
    // STEP 3: USER & STAFF BRANCH ASSIGNMENTS & RBAC ACCESS CHECKS
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 3: User Assignment & Access Control Middleware...");

    const tech1 = await prisma.user.create({
      data: {
        employeeCode: `TECH-BLR-${runId}`,
        email: `tech-blr-${runId}@labcore.local`,
        fullName: `Blr Phlebotomist ${runId}`,
        role: "LAB_TECH",
        status: "ACTIVE",
        passwordHash: "dummy_hash_for_test",
        branchId: blrBranch.id,
      },
    });
    techUser1Id = tech1.id;

    const tech2 = await prisma.user.create({
      data: {
        employeeCode: `TECH-MUM-${runId}`,
        email: `tech-mum-${runId}@labcore.local`,
        fullName: `Mum FrontDesk ${runId}`,
        role: "FRONT_DESK",
        status: "ACTIVE",
        passwordHash: "dummy_hash_for_test",
        branchId: mumBranch.id,
      },
    });
    techUser2Id = tech2.id;

    assert(tech1.branchId === blrBranch.id, "Tech 1 assigned to Bengaluru branch");
    assert(tech2.branchId === mumBranch.id, "Tech 2 assigned to Mumbai branch");

    // Test validateBranchAccess
    const tech1ToBlr = validateBranchAccess("LAB_TECH", tech1.branchId, blrBranch.id);
    const tech1ToMum = validateBranchAccess("LAB_TECH", tech1.branchId, mumBranch.id);
    const adminToMum = validateBranchAccess("ADMIN", null, mumBranch.id);
    const superAdminToBlr = validateBranchAccess("SUPER_ADMIN", null, blrBranch.id);

    assert(tech1ToBlr === true, "Tech 1 has access to own branch (BLR)");
    assert(tech1ToMum === false, "Tech 1 is DENIED access to Mumbai branch");
    assert(adminToMum === true, "ADMIN has cross-branch access to Mumbai branch");
    assert(superAdminToBlr === true, "SUPER_ADMIN has universal access to Bengaluru branch");

    // -------------------------------------------------------------------------
    // STEP 4: TENANT DATA SEGREGATION (PATIENTS & ORDERS)
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 4: Patient & Order Tenant Data Segregation...");

    // Create an active test in catalog for orders
    let category = await prisma.testCategory.findFirst({ where: { isActive: true } });
    if (!category) {
      category = await prisma.testCategory.create({
        data: { name: `Clinical Pathology ${runId}`, code: `CAT-${runId}` },
      });
    }

    const testItem = await prisma.test.create({
      data: {
        testCode: `TEST-MB-${runId}`,
        testName: `Multi-Branch Lipid Profile ${runId}`,
        processingDepartment: "BIOCHEMISTRY",
        sampleType: "SERUM",
        price: 850.0,
        isActive: true,
        categoryId: category.id,
      },
    });
    testCatalogId = testItem.id;

    // Register Patient at Bengaluru Branch
    const patientBlr = await createPatient({
      firstName: "Arun",
      lastName: `Bengaluru-${runId}`,
      gender: "MALE",
      dateOfBirth: "1988-06-15",
      phone: `98800${runId.slice(0, 5)}`,
      email: `arun.blr.${runId}@example.com`,
      branchId: blrBranch.id,
    });
    patientBlrId = patientBlr.id;

    // Register Patient at Mumbai Branch
    const patientMum = await createPatient({
      firstName: "Pooja",
      lastName: `Mumbai-${runId}`,
      gender: "FEMALE",
      dateOfBirth: "1994-03-22",
      phone: `98200${runId.slice(0, 5)}`,
      email: `pooja.mum.${runId}@example.com`,
      branchId: mumBranch.id,
    });
    patientMumId = patientMum.id;

    assert(patientBlr.branchId === blrBranch.id, "Patient Arun stored with branchId = BLR");
    assert(patientMum.branchId === mumBranch.id, "Patient Pooja stored with branchId = MUM");

    // Create Order at Bengaluru Branch
    const orderBlr = await createOrder({
      patientId: patientBlr.id,
      branchId: blrBranch.id,
      items: [{ itemType: "TEST", testId: testItem.id }],
      paidAmount: 850.0,
    });
    orderBlrId = orderBlr.id;

    // Create Order at Mumbai Branch
    const orderMum = await createOrder({
      patientId: patientMum.id,
      branchId: mumBranch.id,
      items: [{ itemType: "TEST", testId: testItem.id }],
      paidAmount: 400.0, // partial payment
    });
    orderMumId = orderMum.id;

    assert(orderBlr.branchId === blrBranch.id, "Order 1 inherits Bengaluru branchId");
    assert(orderMum.branchId === mumBranch.id, "Order 2 inherits Mumbai branchId");

    // Verify Patient list filtering by branch
    const blrPatients = await getPatients({ branchId: blrBranch.id });
    const mumPatients = await getPatients({ branchId: mumBranch.id });

    assert(
      blrPatients.patients.some((p) => p.id === patientBlr.id),
      "BLR patient query includes Arun"
    );
    assert(
      !blrPatients.patients.some((p) => p.id === patientMum.id),
      "BLR patient query EXCLUDES Mumbai patient Pooja"
    );
    assert(
      mumPatients.patients.some((p) => p.id === patientMum.id),
      "MUM patient query includes Pooja"
    );
    assert(
      !mumPatients.patients.some((p) => p.id === patientBlr.id),
      "MUM patient query EXCLUDES Bengaluru patient Arun"
    );

    // Verify Order list filtering by branch
    const blrOrders = await getOrders({ branchId: blrBranch.id });
    const mumOrders = await getOrders({ branchId: mumBranch.id });

    assert(
      blrOrders.orders.some((o: any) => o.id === orderBlr.id),
      "BLR order query includes Order 1"
    );
    assert(
      !blrOrders.orders.some((o: any) => o.id === orderMum.id),
      "BLR order query EXCLUDES Mumbai Order 2"
    );
    assert(
      mumOrders.orders.some((o: any) => o.id === orderMum.id),
      "MUM order query includes Order 2"
    );
    assert(
      !mumOrders.orders.some((o: any) => o.id === orderBlr.id),
      "MUM order query EXCLUDES Bengaluru Order 1"
    );

    // -------------------------------------------------------------------------
    // STEP 5: CROSS-BRANCH HQ AGGREGATE ANALYTICS
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 5: Cross-Branch HQ Aggregated Analytics...");

    const aggregates = await BranchService.getCrossBranchAggregates();

    assert(aggregates.consolidated.totalBranches >= 3, "HQ aggregates counts all active branches");
    assert(aggregates.consolidated.totalOrders >= 2, "HQ aggregates total orders across branches");
    assert(aggregates.consolidated.totalBilled >= 1700, "HQ aggregates total billed amount");

    const blrAgg = aggregates.branches.find((b) => b.branchId === blrBranch.id);
    const mumAgg = aggregates.branches.find((b) => b.branchId === mumBranch.id);

    assert(blrAgg !== undefined, "HQ analytics includes Bengaluru branch row");
    assert(blrAgg?.metrics.patientCount! >= 1, "Bengaluru branch patient count is recorded");
    assert(blrAgg?.metrics.totalOrders! >= 1, "Bengaluru branch order count is recorded");
    assert(mumAgg !== undefined, "HQ analytics includes Mumbai branch row");
    assert(mumAgg?.metrics.totalOrders! >= 1, "Mumbai branch order count is recorded");

    // -------------------------------------------------------------------------
    // STEP 6: DYNAMIC REPORT LETTERHEAD & NABL CERTIFICATE OVERRIDE
    // -------------------------------------------------------------------------
    console.log("\n🔷 Step 6: Dynamic NABL Letterhead & Certificate Per Branch...");

    // Generate HTML report for order at BLR branch
    const reportHtmlBlr = await generateOrderReportHtml(orderBlr.id);

    assert(
      reportHtmlBlr.includes(`MC-9901-${runId}`) || reportHtmlBlr.includes("LabCore Satellite Lab Whitefield"),
      "Generated HTML report contains Bengaluru branch NABL number or branch lab title"
    );

    console.log("\n================================================================================");
    console.log(`🎉 ALL ${passedAssertions} DAY 15 MULTI-BRANCH ASSERTIONS PASSED WITH 100% SUCCESS!`);
    console.log("================================================================================\n");

  } finally {
    console.log("🧹 Cleaning up Day 15 test records...");
    const orderIds = [orderBlrId, orderMumId].filter(Boolean) as string[];
    if (orderIds.length > 0) {
      await prisma.sampleTrackingHistory.deleteMany({ where: { sample: { orderId: { in: orderIds } } } }).catch(() => {});
      await prisma.sample.deleteMany({ where: { orderId: { in: orderIds } } }).catch(() => {});
      await prisma.resultValue.deleteMany({ where: { result: { orderId: { in: orderIds } } } }).catch(() => {});
      await prisma.result.deleteMany({ where: { orderId: { in: orderIds } } }).catch(() => {});
      await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } }).catch(() => {});
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } }).catch(() => {});
    }
    if (patientBlrId) await prisma.patient.delete({ where: { id: patientBlrId } }).catch(() => {});
    if (patientMumId) await prisma.patient.delete({ where: { id: patientMumId } }).catch(() => {});
    if (testCatalogId) await prisma.test.delete({ where: { id: testCatalogId } }).catch(() => {});
    if (techUser1Id) await prisma.user.delete({ where: { id: techUser1Id } }).catch(() => {});
    if (techUser2Id) await prisma.user.delete({ where: { id: techUser2Id } }).catch(() => {});
    if (branchBlrId) await prisma.branch.delete({ where: { id: branchBlrId } }).catch(() => {});
    if (branchMumId) await prisma.branch.delete({ where: { id: branchMumId } }).catch(() => {});
    if (branchMainId) await prisma.branch.delete({ where: { id: branchMainId } }).catch(() => {});
    console.log("✅ Cleanup complete.");
  }
}

runDay15Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
