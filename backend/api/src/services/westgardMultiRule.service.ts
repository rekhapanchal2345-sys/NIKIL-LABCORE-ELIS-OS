/**
 * Westgard Multi-Rule & Statistical Internal Quality Control (IQC) Engine — NIKIL-LABCORE-ELIS-OS
 * 
 * Module 11: Westgard IQC & Levey-Jennings State Machine
 * - Bug 11.1: Cumulative Lab Mean and SD calculation (CLSI C24-Ed4 requirement of 20 data points)
 * - Bug 11.2: Full Westgard Multi-Rule Evaluation State Machine (1-3s, 2-2s within/across, R-4s, 4-1s, 10-x)
 */

export interface CumulativeStats {
  count: number;
  mean: number;
  sd: number;
  cvPercent: number;
  isEstablishedLabMean: boolean;
}

export interface QcLevelRun {
  level: string; // e.g. "LEVEL_1", "LEVEL_2", "LEVEL_3"
  value: number;
  mean: number;
  sd: number;
}

export interface WestgardEvaluationResult {
  westgardPassed: boolean;
  hasWarning: boolean;
  violatedRules: string[];
  rejectionRules: string[];
  warningRules: string[];
  currentRunZScores: Record<string, number>;
  channelHardLocked: boolean;
  directive: string;
}

export class WestgardMultiRuleService {
  /**
   * Bug 11.1: Calculates Cumulative Lab Mean, SD, and CV% from historical QC runs.
   * CLSI C24-Ed4 requires at least 20 runs to establish a valid laboratory mean/SD.
   */
  public static calculateCumulativeStats(values: number[]): CumulativeStats {
    const count = values.length;
    if (count < 2) {
      throw new Error('At least 2 QC run values are required to compute statistics.');
    }

    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / count;

    // Sample variance (N - 1)
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (count - 1);
    const sd = Math.sqrt(variance);
    const cvPercent = mean !== 0 ? (sd / mean) * 100 : 0;

    return {
      count,
      mean: Math.round(mean * 10000) / 10000,
      sd: Math.round(sd * 10000) / 10000,
      cvPercent: Math.round(cvPercent * 100) / 100,
      isEstablishedLabMean: count >= 20
    };
  }

  /**
   * Bug 11.2: Full Westgard Multi-Rule State Machine
   * 
   * @param currentRun Array of level runs for the current shift (e.g., Level 1 and Level 2)
   * @param historicalRunZScoresByLevel Historical z-scores ordered newest-first (index 0 = immediately prior run)
   */
  public static evaluateWestgardRules(
    currentRun: QcLevelRun[],
    historicalRunZScoresByLevel: Record<string, number[]> = {}
  ): WestgardEvaluationResult {
    const currentZScores: Record<string, number> = {};
    const violatedRules: string[] = [];
    const rejectionRules: string[] = [];
    const warningRules: string[] = [];

    // Step 1: Calculate current z-scores
    for (const run of currentRun) {
      if (run.sd <= 0) {
        throw new Error(`Invalid SD (${run.sd}) for QC level ${run.level}. SD must be positive.`);
      }
      const z = (run.value - run.mean) / run.sd;
      currentZScores[run.level] = Math.round(z * 100) / 100;
    }

    const zValues = Object.values(currentZScores);

    // Rule 1: 1_2s (Warning Rule: Any run exceeds +/- 2 SD)
    const trigger1_2s = zValues.some((z) => Math.abs(z) > 2.0);
    if (trigger1_2s) {
      warningRules.push('1_2S');
      violatedRules.push('1_2S');

      // If 1_2s triggers, evaluate rejection rules:

      // Rule 2: 1_3s (Random error: Any single control exceeds +/- 3 SD)
      const trigger1_3s = zValues.some((z) => Math.abs(z) > 3.0);
      if (trigger1_3s) {
        rejectionRules.push('1_3S');
        violatedRules.push('1_3S');
      }

      // Rule 3: 2_2s (Systematic error)
      // Check 3A: Across controls in current run (both Level 1 and Level 2 > +2s OR both < -2s)
      if (zValues.length >= 2) {
        const bothHigh = zValues.every((z) => z > 2.0);
        const bothLow = zValues.every((z) => z < -2.0);
        if (bothHigh || bothLow) {
          rejectionRules.push('2_2S_ACROSS_RUN');
          violatedRules.push('2_2S_ACROSS_RUN');
        }
      }

      // Check 3B: Within same control across 2 consecutive runs (current + previous)
      for (const run of currentRun) {
        const history = historicalRunZScoresByLevel[run.level] || [];
        if (history.length >= 1) {
          const currentZ = currentZScores[run.level];
          const prevZ = history[0];
          if ((currentZ > 2.0 && prevZ > 2.0) || (currentZ < -2.0 && prevZ < -2.0)) {
            rejectionRules.push(`2_2S_WITHIN_CONTROL_${run.level}`);
            violatedRules.push(`2_2S_WITHIN_CONTROL_${run.level}`);
          }
        }
      }

      // Rule 4: R_4s (Random error across runs)
      // Difference between highest and lowest z-scores in current run >= 4.0 SD
      if (zValues.length >= 2) {
        const maxZ = Math.max(...zValues);
        const minZ = Math.min(...zValues);
        if (maxZ - minZ >= 4.0) {
          rejectionRules.push('R_4S');
          violatedRules.push('R_4S');
        }
      }

      // Rule 5: 4_1s (Systematic error: 4 consecutive runs exceed +/- 1 SD on same side)
      for (const run of currentRun) {
        const history = historicalRunZScoresByLevel[run.level] || [];
        if (history.length >= 3) {
          const series = [currentZScores[run.level], history[0], history[1], history[2]];
          const allPositive1s = series.every((z) => z > 1.0);
          const allNegative1s = series.every((z) => z < -1.0);
          if (allPositive1s || allNegative1s) {
            rejectionRules.push(`4_1S_${run.level}`);
            violatedRules.push(`4_1S_${run.level}`);
          }
        }
      }

      // Rule 6: 10_x (Systematic error: 10 consecutive runs on same side of mean)
      for (const run of currentRun) {
        const history = historicalRunZScoresByLevel[run.level] || [];
        if (history.length >= 9) {
          const series = [currentZScores[run.level], ...history.slice(0, 9)];
          const allAboveMean = series.every((z) => z > 0);
          const allBelowMean = series.every((z) => z < 0);
          if (allAboveMean || allBelowMean) {
            rejectionRules.push(`10_X_${run.level}`);
            violatedRules.push(`10_X_${run.level}`);
          }
        }
      }
    }

    const hasRejections = rejectionRules.length > 0;
    const channelHardLocked = hasRejections;

    let directive = 'QC In Control. Auto-verification authorized.';
    if (hasRejections) {
      directive = `QC OUT OF CONTROL (Violations: ${rejectionRules.join(', ')}). Channel HARD-LOCKED. Mandatory recalibration, reagent check, and pathologist supervisor sign-off required before releasing patient results.`;
    } else if (warningRules.length > 0) {
      directive = 'QC Warning (1_2s triggered). No rejection rules violated. Patient testing may continue under heightened surveillance.';
    }

    return {
      westgardPassed: !hasRejections,
      hasWarning: warningRules.length > 0,
      violatedRules,
      rejectionRules,
      warningRules,
      currentRunZScores: currentZScores,
      channelHardLocked,
      directive
    };
  }
}
