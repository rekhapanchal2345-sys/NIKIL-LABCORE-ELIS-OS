/**
 * Domain Test Suite: Pathologist Workstation, QC Delta Checks & Tamper-Evident Reports
 */

import { describe, it, expect } from "./framework";
import crypto from "crypto";

export interface DeltaCheckResult {
  hasPrevious: boolean;
  previousValue?: number;
  currentValue: number;
  absoluteDelta: number;
  percentChange: number;
  isDeltaViolation: boolean;
  alertSeverity: "NONE" | "WARNING" | "CRITICAL";
}

export function evaluateDeltaCheck(
  current: number,
  previous?: number,
  maxAllowedPercentChange: number = 30.0
): DeltaCheckResult {
  if (previous === undefined || previous === null) {
    return {
      hasPrevious: false,
      currentValue: current,
      absoluteDelta: 0,
      percentChange: 0,
      isDeltaViolation: false,
      alertSeverity: "NONE",
    };
  }

  const absoluteDelta = Number(Math.abs(current - previous).toFixed(2));
  const percentChange = previous !== 0 ? Number(((absoluteDelta / previous) * 100).toFixed(2)) : 0;
  const isDeltaViolation = percentChange > maxAllowedPercentChange;

  return {
    hasPrevious: true,
    previousValue: previous,
    currentValue: current,
    absoluteDelta,
    percentChange,
    isDeltaViolation,
    alertSeverity: isDeltaViolation ? (percentChange > 50 ? "CRITICAL" : "WARNING") : "NONE",
  };
}

export function classifyResultValue(
  val: number,
  normalLow: number,
  normalHigh: number,
  criticalLow: number,
  criticalHigh: number
): "LL" | "L" | "NORMAL" | "H" | "HH" {
  if (val <= criticalLow) return "LL";
  if (val >= criticalHigh) return "HH";
  if (val < normalLow) return "L";
  if (val > normalHigh) return "H";
  return "NORMAL";
}

export function generateReportSeal(
  reportId: string,
  uhid: string,
  doctorCode: string,
  approvedAt: string,
  resultChecksum: string
): { sealHash: string; verificationUrl: string } {
  const payload = `${reportId}|${uhid}|${doctorCode}|${approvedAt}|${resultChecksum}`;
  const sealHash = crypto.createHash("sha256").update(payload).digest("hex");
  const verificationUrl = `https://labcore.hospital.org/verify/${sealHash.slice(0, 16)}`;
  return { sealHash, verificationUrl };
}

export function registerReportTests(): void {
  describe("Pathologist Workstation, QC Delta-Checks & Tamper-Evident Seals", () => {
    it("should compute accurate Levey-Jennings delta checks against historical values", () => {
      // Normal physiological change (Potassium 4.2 -> 4.4, delta 4.76% <= 30%)
      const normalDelta = evaluateDeltaCheck(4.4, 4.2, 30.0);
      expect(normalDelta.hasPrevious).toBe(true);
      expect(normalDelta.absoluteDelta).toBe(0.2);
      expect(normalDelta.percentChange).toBe(4.76);
      expect(normalDelta.isDeltaViolation).toBe(false);
      expect(normalDelta.alertSeverity).toBe("NONE");

      // Critical sudden delta change (Hemoglobin 14.5 -> 7.2 overnight, 50.34% drop)
      const criticalDelta = evaluateDeltaCheck(7.2, 14.5, 25.0);
      expect(criticalDelta.hasPrevious).toBe(true);
      expect(criticalDelta.absoluteDelta).toBe(7.3);
      expect(criticalDelta.percentChange).toBe(50.34);
      expect(criticalDelta.isDeltaViolation).toBe(true);
      expect(criticalDelta.alertSeverity).toBe("CRITICAL");
    });

    it("should classify panic values into standard clinical flags (HH, LL, H, L, NORMAL)", () => {
      // Potassium normal: 3.5 - 5.1, Critical: <= 2.8 or >= 6.2
      const normalK = classifyResultValue(4.5, 3.5, 5.1, 2.8, 6.2);
      expect(normalK).toBe("NORMAL");

      const lowK = classifyResultValue(3.1, 3.5, 5.1, 2.8, 6.2);
      expect(lowK).toBe("L");

      const panicLowK = classifyResultValue(2.5, 3.5, 5.1, 2.8, 6.2);
      expect(panicLowK).toBe("LL"); // Triggers IEC 60601-1-8 audio panic alert

      const highK = classifyResultValue(5.6, 3.5, 5.1, 2.8, 6.2);
      expect(highK).toBe("H");

      const panicHighK = classifyResultValue(7.1, 3.5, 5.1, 2.8, 6.2);
      expect(panicHighK).toBe("HH"); // Cardiac arrest panic threshold
    });

    it("should generate cryptographically verifiable SHA-256 digital seals for published reports", () => {
      const seal1 = generateReportSeal(
        "REP-2026-9001",
        "UHID-BLR-0045",
        "DOC-PATH-001",
        "2026-10-26T12:00:00.000Z",
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      );

      expect(typeof seal1.sealHash).toBe("string");
      expect(seal1.sealHash.length).toBe(64);
      expect(seal1.verificationUrl.startsWith("https://labcore.hospital.org/verify/")).toBe(true);

      // Same inputs generate deterministic seal
      const seal2 = generateReportSeal(
        "REP-2026-9001",
        "UHID-BLR-0045",
        "DOC-PATH-001",
        "2026-10-26T12:00:00.000Z",
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      );
      expect(seal1.sealHash).toBe(seal2.sealHash);

      // Tampered result checksum breaks seal verification
      const tamperedSeal = generateReportSeal(
        "REP-2026-9001",
        "UHID-BLR-0045",
        "DOC-PATH-001",
        "2026-10-26T12:00:00.000Z",
        "tampered_checksum_payload_12345"
      );
      expect(seal1.sealHash !== tamperedSeal.sealHash).toBe(true);
    });
  });
}
