import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolvePaymentTabFromSlug,
  calculateDenominationTotal,
  calculateShiftTillReconciliation,
  classifyReceivableAgingBucket,
  getFacilityScaleMeta,
} from "./payment-utils";

describe("payment-utils unit tests", () => {
  it("resolves URL tab slugs accurately across all 10 cashier and finance tabs", () => {
    assert.equal(resolvePaymentTabFromSlug(null), "Overview");
    assert.equal(resolvePaymentTabFromSlug("transactions"), "Transactions");
    assert.equal(resolvePaymentTabFromSlug("dues"), "Pending Dues");
    assert.equal(resolvePaymentTabFromSlug("receivables"), "Pending Dues");
    assert.equal(resolvePaymentTabFromSlug("cash-counter"), "Cash Counter");
    assert.equal(resolvePaymentTabFromSlug("advances"), "Advances & Wallet");
    assert.equal(resolvePaymentTabFromSlug("refunds"), "Refunds");
    assert.equal(resolvePaymentTabFromSlug("settlements"), "Settlements");
    assert.equal(resolvePaymentTabFromSlug("reconciliation"), "Reconciliation");
    assert.equal(resolvePaymentTabFromSlug("reports"), "Reports");
    assert.equal(resolvePaymentTabFromSlug("audit-log"), "Audit Log");
  });

  it("calculates Indian currency denomination totals accurately", () => {
    const total = calculateDenominationTotal({
      500: 58, // 29000
      200: 34, // 6800
      100: 32, // 3200
      50: 16,  // 800
      20: 25,  // 500
      10: 20,  // 200
      5: 18,   // 90
      coins: 170,
    });
    assert.equal(total, 40760);
  });

  it("computes shift till reconciliation variance and safe vault drop", () => {
    const balanced = calculateShiftTillReconciliation({
      openingFloat: 26250,
      cashCollections: 18230,
      cashRefunds: 3200,
      pettyIn: 0,
      pettyOut: 430,
      physicalCounted: 40850,
      retainFloat: 5000,
    });
    assert.equal(balanced.expectedDrawer, 40850);
    assert.equal(balanced.variance, 0);
    assert.equal(balanced.status, "BALANCED");
    assert.equal(balanced.recommendedSafeDrop, 35850);
    assert.equal(balanced.retainedNextShiftFloat, 5000);
  });

  it("classifies receivable aging buckets and clinical collection priority", () => {
    assert.deepEqual(classifyReceivableAgingBucket(2), {
      bucket: "CURRENT",
      label: "0–7 Days (Current)",
      priority: "ROUTINE",
    });
    assert.deepEqual(classifyReceivableAgingBucket(12), {
      bucket: "8-15",
      label: "8–15 Days Due",
      priority: "FOLLOW_UP",
    });
    assert.deepEqual(classifyReceivableAgingBucket(21), {
      bucket: "16-30",
      label: "16–30 Days Due",
      priority: "ESCALATED",
    });
    assert.deepEqual(classifyReceivableAgingBucket(45), {
      bucket: "30+",
      label: "30+ Days Overdue",
      priority: "CRITICAL_HOLD",
    });
  });

  it("returns tailored metadata for Hospital, Lab, Clinic, and All scales", () => {
    assert.equal(getFacilityScaleMeta("HOSPITAL").shortLabel, "Hospital (OPD / IPD / ER)");
    assert.equal(getFacilityScaleMeta("LAB").shortLabel, "Diagnostic Lab & Sample Desk");
    assert.equal(getFacilityScaleMeta("CLINIC").shortLabel, "Polyclinic & Medical Center");
    assert.equal(getFacilityScaleMeta("ALL").counters.length, 4);
  });
});
