/**
 * Domain Test Suite: Billing, GST Computation & Cash Shift Daybook
 */

import { describe, it, expect } from "./framework";
import { DaybookService, CurrencyDenominations } from "../api/src/modules/cash-counter/daybook.service";
import crypto from "crypto";

export function registerBillingTests(): void {
  describe("Billing, GST Calculation & Cash Daybook", () => {
    it("should accurately compute intra-state diagnostic GST (CGST + SGST split)", () => {
      const calculateGst = (
        subtotal: number,
        discountPercent: number,
        gstRatePercent: number,
        isInterState: boolean
      ) => {
        const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
        const taxableAmount = subtotal - discountAmount;
        const totalGst = Number(((taxableAmount * gstRatePercent) / 100).toFixed(2));

        if (isInterState) {
          return {
            subtotal,
            discountAmount,
            taxableAmount,
            cgst: 0,
            sgst: 0,
            igst: totalGst,
            totalAmount: Number((taxableAmount + totalGst).toFixed(2)),
          };
        } else {
          const splitGst = Number((totalGst / 2).toFixed(2));
          return {
            subtotal,
            discountAmount,
            taxableAmount,
            cgst: splitGst,
            sgst: splitGst,
            igst: 0,
            totalAmount: Number((taxableAmount + totalGst).toFixed(2)),
          };
        }
      };

      // Test ₹1,000 diagnostic invoice with 10% discount and 18% GST (Intra-state Karnataka)
      // Taxable: ₹900, GST: ₹162 (CGST ₹81 + SGST ₹81), Total: ₹1,062
      const intraStateBill = calculateGst(1000, 10, 18, false);
      expect(intraStateBill.discountAmount).toBe(100);
      expect(intraStateBill.taxableAmount).toBe(900);
      expect(intraStateBill.cgst).toBe(81);
      expect(intraStateBill.sgst).toBe(81);
      expect(intraStateBill.igst).toBe(0);
      expect(intraStateBill.totalAmount).toBe(1062);

      // Test ₹2,000 inter-state order (IGST only)
      const interStateBill = calculateGst(2000, 0, 12, true);
      expect(interStateBill.taxableAmount).toBe(2000);
      expect(interStateBill.cgst).toBe(0);
      expect(interStateBill.sgst).toBe(0);
      expect(interStateBill.igst).toBe(240);
      expect(interStateBill.totalAmount).toBe(2240);
    });

    it("should calculate physical currency denominations across all 10 Indian notes/coins", () => {
      const denoms: CurrencyDenominations = {
        notes_2000: 1, // 2000
        notes_500: 4,  // 2000
        notes_200: 5,  // 1000
        notes_100: 5,  // 500
        notes_50: 4,   // 200
        notes_20: 5,   // 100
        notes_10: 10,  // 100
        coins_5: 10,   // 50
        coins_2: 20,   // 40
        coins_1: 10,   // 10
      };

      const result = DaybookService.calculatePhysicalTotal(denoms);
      // Total = 2000 + 2000 + 1000 + 500 + 200 + 100 + 100 + 50 + 40 + 10 = ₹6,000
      expect(result.total).toBe(6000);
      expect(result.breakdown.length).toBe(10);

      const note500 = result.breakdown.find((b) => b.denomination === 500);
      expect(note500?.count).toBe(4);
      expect(note500?.subtotal).toBe(2000);
      expect(note500?.type).toBe("NOTE");

      const coin5 = result.breakdown.find((b) => b.denomination === 5);
      expect(coin5?.count).toBe(10);
      expect(coin5?.subtotal).toBe(50);
      expect(coin5?.type).toBe("COIN");
    });

    it("should compute cashier shift variance and trigger discrepancy status", () => {
      // Balanced shift (zero discrepancy)
      const balanced = DaybookService.evaluateDiscrepancy(5000, 5000);
      expect(balanced.hasDiscrepancy).toBe(false);
      expect(balanced.type).toBe("BALANCED");
      expect(balanced.discrepancyAmount).toBe(0);

      // Shortage shift (physical cash ₹4900 vs system digital ₹5000)
      const shortage = DaybookService.evaluateDiscrepancy(4900, 5000);
      expect(shortage.hasDiscrepancy).toBe(true);
      expect(shortage.type).toBe("SHORTAGE");
      expect(shortage.discrepancyAmount).toBe(100);

      // Surplus shift (physical cash ₹5200 vs system digital ₹5000)
      const surplus = DaybookService.evaluateDiscrepancy(5200, 5000);
      expect(surplus.hasDiscrepancy).toBe(true);
      expect(surplus.type).toBe("SURPLUS");
      expect(surplus.discrepancyAmount).toBe(200);
    });

    it("should generate deterministic idempotency keys for payment gateway requests", () => {
      const generateIdempotencyKey = (orderId: string, amount: number, timestampWindow: number): string => {
        return crypto
          .createHash("sha256")
          .update(`${orderId}:${amount.toFixed(2)}:${timestampWindow}`)
          .digest("hex");
      };

      const key1 = generateIdempotencyKey("ORD-101", 1500.5, 1729000);
      const key2 = generateIdempotencyKey("ORD-101", 1500.5, 1729000);
      const keyDiffAmount = generateIdempotencyKey("ORD-101", 1600.0, 1729000);

      expect(key1).toBe(key2);
      expect(key1 !== keyDiffAmount).toBe(true);
      expect(key1.length).toBe(64);
    });
  });
}
