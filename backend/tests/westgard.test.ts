/**
 * Domain Test Suite: Analyzer & Westgard Rules Engine
 */

import { describe, it, expect, beforeEach } from "./framework";
import { WestgardQcEngine, QcLotTargetConfig } from "../src/services/analyzer/WestgardQcEngine";

export function registerWestgardTests(): void {
  describe("Westgard QC Rules Engine & Safety Lockouts", () => {
    let engine: WestgardQcEngine;

    const baseConfig: QcLotTargetConfig = {
      analyzerId: "SYSMEX-XN1000",
      parameterCode: "WBC",
      parameterName: "White Blood Cell Count",
      qcLotNumber: "LOT-8821A",
      level: "LEVEL_1_LOW",
      targetMean: 5.0,
      targetSd: 0.5,
      units: "10^3/uL",
      expirationDate: "2026-12-31",
    };

    beforeEach(() => {
      engine = new WestgardQcEngine();
    });

    it("should successfully register a QC lot target config", () => {
      engine.registerQcLotTarget(baseConfig);

      const releaseInfo = engine.canReleasePatientResult(baseConfig.analyzerId, baseConfig.parameterCode);
      expect(releaseInfo.allowed).toBe(true);
    });

    it("should throw an error when registering a QC lot with invalid target SD (<= 0)", () => {
      expect(() => {
        engine.registerQcLotTarget({
          ...baseConfig,
          targetSd: 0,
        });
      }).toThrow();

      expect(() => {
        engine.registerQcLotTarget({
          ...baseConfig,
          targetSd: -1.5,
        });
      }).toThrow();
    });

    it("should evaluate an in-control QC run correctly", () => {
      engine.registerQcLotTarget(baseConfig);

      const run = engine.evaluateQcRun({
        analyzerId: baseConfig.analyzerId,
        parameterCode: baseConfig.parameterCode,
        level: baseConfig.level,
        measuredValue: 5.1, // Mean=5.0, SD=0.5 -> Z-score=0.2 (Within 1 SD)
        runBatchId: "BATCH-1",
        operatorId: "OP-01",
      });

      expect(run.status).toBe("IN_CONTROL");
      expect(run.activeViolations.length).toBe(0);
      expect(run.lockoutState.isLockedOut).toBe(false);
    });

    it("should trigger a 1-2s warning rule without locking out the parameter", () => {
      engine.registerQcLotTarget(baseConfig);

      let eventEmitted = false;
      engine.on("westgardWarning", () => {
        eventEmitted = true;
      });

      const run = engine.evaluateQcRun({
        analyzerId: baseConfig.analyzerId,
        parameterCode: baseConfig.parameterCode,
        level: baseConfig.level,
        measuredValue: 6.2, // Z-score = 2.4 (Between 2 SD and 3 SD)
        runBatchId: "BATCH-2",
        operatorId: "OP-01",
      });

      expect(run.status).toBe("WARNING_1_2S");
      expect(run.activeViolations.length).toBe(1);
      expect(run.activeViolations[0].ruleCode).toBe("1-2s");
      expect(run.activeViolations[0].severity).toBe("WARNING");
      expect(run.lockoutState.isLockedOut).toBe(false);

      expect(eventEmitted).toBe(true);
    });

    it("should trigger a 1-3s rejection rule and activate analyzer safety lockout", () => {
      engine.registerQcLotTarget(baseConfig);

      let lockoutEmitted = false;
      engine.on("westgardLockoutTripped", () => {
        lockoutEmitted = true;
      });

      const run = engine.evaluateQcRun({
        analyzerId: baseConfig.analyzerId,
        parameterCode: baseConfig.parameterCode,
        level: baseConfig.level,
        measuredValue: 6.8, // Z-score = 3.6 (Beyond 3 SD)
        runBatchId: "BATCH-3",
        operatorId: "OP-01",
      });

      expect(run.status).toBe("REJECTED_LOCKOUT");
      expect(run.activeViolations.some((v) => v.ruleCode === "1-3s")).toBe(true);
      expect(run.lockoutState.isLockedOut).toBe(true);
      expect(run.lockoutState.requiresCalibration).toBe(true);

      const releaseInfo = engine.canReleasePatientResult(baseConfig.analyzerId, baseConfig.parameterCode);
      expect(releaseInfo.allowed).toBe(false);

      expect(lockoutEmitted).toBe(true);
    });

    it("should trigger a 2-2s rejection across-run (same level)", () => {
      engine.registerQcLotTarget(baseConfig);

      // Run 1: > +2SD
      engine.evaluateQcRun({
        analyzerId: baseConfig.analyzerId,
        parameterCode: baseConfig.parameterCode,
        level: baseConfig.level,
        measuredValue: 6.1, // Z-score = 2.2
        runBatchId: "BATCH-4",
        operatorId: "OP-01",
      });

      // Run 2: > +2SD
      const run2 = engine.evaluateQcRun({
        analyzerId: baseConfig.analyzerId,
        parameterCode: baseConfig.parameterCode,
        level: baseConfig.level,
        measuredValue: 6.15, // Z-score = 2.3
        runBatchId: "BATCH-5",
        operatorId: "OP-01",
      });

      expect(run2.status).toBe("REJECTED_LOCKOUT");
      expect(run2.activeViolations.some((v) => v.ruleCode === "2-2s")).toBe(true);
      expect(run2.lockoutState.isLockedOut).toBe(true);
    });

    it("should resolve parameter lockout and clear the circuit breaker", () => {
      engine.registerQcLotTarget(baseConfig);

      // Trip the lockout (1-3s)
      engine.evaluateQcRun({
        analyzerId: baseConfig.analyzerId,
        parameterCode: baseConfig.parameterCode,
        level: baseConfig.level,
        measuredValue: 1.0, // Z-score = -8.0
        runBatchId: "BATCH-ERR",
        operatorId: "OP-01",
      });

      expect(engine.canReleasePatientResult(baseConfig.analyzerId, baseConfig.parameterCode).allowed).toBe(false);

      let clearedEventEmitted = false;
      engine.on("westgardLockoutCleared", () => {
        clearedEventEmitted = true;
      });

      // Resolve lockout
      engine.resolveParameterLockout({
        analyzerId: baseConfig.analyzerId,
        parameterCode: baseConfig.parameterCode,
        authorizedByUserId: "ADMIN-001",
        calibrationVerificationRunId: "CAL-NEW-123",
        correctiveActionNotes: "Cleaned optical sensor and recalibrated.",
      });

      expect(engine.canReleasePatientResult(baseConfig.analyzerId, baseConfig.parameterCode).allowed).toBe(true);
      expect(clearedEventEmitted).toBe(true);
    });
  });
}
