/**
 * Pre-Analytical Stability & Phlebotomy Logistics Service — NIKIL-LABCORE-ELIS-OS
 * 
 * Module 8: Pre-Analytical, Phlebotomy & Logistics Bugs
 * - Bug 8.1: Vacutainer Tube Consolidation & Volume Under-Draw Math (Dead volume + sum(TestVolumes))
 * - Bug 8.2: Anticoagulant Ratio & Pediatric High Hematocrit (Hct > 55%) Citrate Adjustment (CLSI H21-A5)
 * - Bug 8.3: Cold-Chain Stability Timer Expiration Enforcement (ISO 15189)
 */

export interface TestVolumeRequest {
  testCode: string;
  testName: string;
  sampleType: string; // e.g. "SERUM", "EDTA_WHOLE_BLOOD", "CITRATE_PLASMA"
  vacutainerColor: 'GOLD_SST' | 'RED_PLAIN' | 'LAVENDER_EDTA' | 'LIGHT_BLUE_CITRATE' | 'GREY_FLUORIDE';
  requiredVolumeMicroliters: number;
}

export interface TubeConsolidationPlan {
  tubeType: string;
  tubeLabel: string;
  barcode: string;
  assignedTests: string[];
  deadVolumeMicroliters: number;
  testsVolumeMicroliters: number;
  totalRequiredSerumMicroliters: number;
  maxSerumYieldMicroliters: number;
  isSplitRequired: boolean;
  isVolumeSufficient: boolean;
  splitTubes?: TubeConsolidationPlan[];
}

export interface CitrateVerificationInput {
  patientHctPercentage?: number;
  bloodDrawVolumeMl: number;
  fillLineVerified: boolean;
  tubeType: 'SODIUM_CITRATE_3_2';
}

export interface CitrateVerificationResult {
  isAccepted: boolean;
  expectedBloodVolumeMl: number;
  actualBloodVolumeMl: number;
  ratio: string;
  hctExceedsLimit: boolean;
  requiredCitrateAdjustmentMl?: number;
  rejectionReason?: string;
  warningNotice?: string;
}

export interface StabilityCheckInput {
  testCode: string;
  collectionTimestamp: Date | string;
  receiptTimestamp: Date | string;
  transportCondition: 'ROOM_TEMP' | 'REFRIGERATED' | 'FROZEN';
  maxAllowedMinutesRoomTemp?: number;
  maxAllowedMinutesRefrigerated?: number;
  maxAllowedMinutesFrozen?: number;
}

export interface StabilityCheckResult {
  isAccepted: boolean;
  elapsedMinutes: number;
  maxAllowedMinutes: number;
  transportCondition: string;
  rejectionReason?: string;
}

export class PreAnalyticalStabilityService {
  public static readonly DEFAULT_DEAD_VOLUME_MICROLITERS = 200;
  public static readonly SST_MAX_SERUM_YIELD_MICROLITERS = 1800; // From 4mL blood @ ~45% Hct

  /**
   * Bug 8.1: Tube Consolidation & Dead-Volume Split Math
   * Total Required Volume = Dead Volume + SUM(TestVolume_i)
   * If Total Required Volume > Max Yield, splits into Tube-1A, Tube-1B with independent barcodes.
   */
  public static consolidateVacutainerTubes(
    baseBarcode: string,
    tests: TestVolumeRequest[],
    analyzerDeadVolume: number = this.DEFAULT_DEAD_VOLUME_MICROLITERS,
    maxYieldPerTube: number = this.SST_MAX_SERUM_YIELD_MICROLITERS
  ): TubeConsolidationPlan[] {
    // Group tests by vacutainer color
    const groups = new Map<string, TestVolumeRequest[]>();
    for (const t of tests) {
      const key = t.vacutainerColor;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }

    const plans: TubeConsolidationPlan[] = [];

    groups.forEach((groupedTests, tubeColor) => {
      let currentSubIndex = 1;
      let currentTests: TestVolumeRequest[] = [];
      let currentTestVol = 0;

      for (const test of groupedTests) {
        const potentialTotal = analyzerDeadVolume + currentTestVol + test.requiredVolumeMicroliters;
        if (potentialTotal > maxYieldPerTube && currentTests.length > 0) {
          // Commit current split tube
          const suffix = String.fromCharCode(64 + currentSubIndex); // A, B, C...
          plans.push({
            tubeType: tubeColor,
            tubeLabel: `${tubeColor} (Tube-${suffix})`,
            barcode: `${baseBarcode}-${suffix}`,
            assignedTests: currentTests.map((t) => t.testCode),
            deadVolumeMicroliters: analyzerDeadVolume,
            testsVolumeMicroliters: currentTestVol,
            totalRequiredSerumMicroliters: analyzerDeadVolume + currentTestVol,
            maxSerumYieldMicroliters: maxYieldPerTube,
            isSplitRequired: true,
            isVolumeSufficient: true
          });

          // Start new tube
          currentSubIndex++;
          currentTests = [test];
          currentTestVol = test.requiredVolumeMicroliters;
        } else {
          currentTests.push(test);
          currentTestVol += test.requiredVolumeMicroliters;
        }
      }

      // Final tube of group
      if (currentTests.length > 0) {
        const hasSplits = currentSubIndex > 1;
        const suffix = hasSplits ? `-${String.fromCharCode(64 + currentSubIndex)}` : '';
        plans.push({
          tubeType: tubeColor,
          tubeLabel: hasSplits ? `${tubeColor} (Tube-${String.fromCharCode(64 + currentSubIndex)})` : tubeColor,
          barcode: `${baseBarcode}${suffix}`,
          assignedTests: currentTests.map((t) => t.testCode),
          deadVolumeMicroliters: analyzerDeadVolume,
          testsVolumeMicroliters: currentTestVol,
          totalRequiredSerumMicroliters: analyzerDeadVolume + currentTestVol,
          maxSerumYieldMicroliters: maxYieldPerTube,
          isSplitRequired: hasSplits,
          isVolumeSufficient: analyzerDeadVolume + currentTestVol <= maxYieldPerTube
        });
      }
    });

    return plans;
  }

  /**
   * Bug 8.2: Anticoagulant Ratio & High Hematocrit Citrate Adjustment (CLSI H21-A5)
   * 
   * Standard 3.2% Sodium Citrate tube requires 9:1 blood-to-anticoagulant ratio.
   * If Hematocrit > 55%: plasma volume is diminished, resulting in excess free citrate
   * and falsely prolonged PT / aPTT.
   * 
   * CLSI H21-A5 Equation for Adjusted Citrate Volume:
   * C = (1.85 * 10^-3) * (100 - Hct) * V_blood
   */
  public static verifyCitrateAnticoagulantRatio(
    input: CitrateVerificationInput
  ): CitrateVerificationResult {
    const { patientHctPercentage, bloodDrawVolumeMl, fillLineVerified } = input;

    // Check mandatory fill line
    if (!fillLineVerified) {
      return {
        isAccepted: false,
        expectedBloodVolumeMl: 2.7,
        actualBloodVolumeMl: bloodDrawVolumeMl,
        ratio: 'Underfilled (< 9:1 ratio)',
        hctExceedsLimit: false,
        rejectionReason:
          'PRE_ANALYTICAL_REJECTION: Citrate tube fill-line not verified. Inaccurate 9:1 ratio invalidates Coagulation assays.'
      };
    }

    // Check High Hematocrit (> 55%)
    if (patientHctPercentage && patientHctPercentage > 55) {
      // CLSI H21-A5 Formula
      const adjustedCitrateMl = (1.85e-3) * (100 - patientHctPercentage) * bloodDrawVolumeMl;
      const roundedCitrate = Math.round(adjustedCitrateMl * 1000) / 1000;

      return {
        isAccepted: false,
        expectedBloodVolumeMl: bloodDrawVolumeMl,
        actualBloodVolumeMl: bloodDrawVolumeMl,
        ratio: 'Excess Citrate due to High Hct',
        hctExceedsLimit: true,
        requiredCitrateAdjustmentMl: roundedCitrate,
        rejectionReason:
          `PATIENT_HCT_EXCEEDS_55_PERCENT: Current Hct is ${patientHctPercentage}%. Standard 9:1 citrate tube causes falsely prolonged PT/INR. Mandatory redraw with customized citrate tube (${roundedCitrate} mL 3.2% Citrate for ${bloodDrawVolumeMl} mL whole blood under CLSI H21-A5).`
      };
    }

    return {
      isAccepted: true,
      expectedBloodVolumeMl: bloodDrawVolumeMl,
      actualBloodVolumeMl: bloodDrawVolumeMl,
      ratio: '9:1 (CLSI compliant)',
      hctExceedsLimit: false,
      warningNotice: patientHctPercentage ? `Hct verified within normal coag window (${patientHctPercentage}%).` : undefined
    };
  }

  /**
   * Bug 8.3: Cold-Chain & Sample Stability Timer Expiration Check (ISO 15189)
   * Rejects labile samples (Ammonia, Lactate, Blood Gas, etc.) if transit time exceeded stability limits.
   */
  public static evaluateSampleStability(input: StabilityCheckInput): StabilityCheckResult {
    const collectDate = new Date(input.collectionTimestamp);
    const receiveDate = new Date(input.receiptTimestamp);

    const elapsedMs = receiveDate.getTime() - collectDate.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));

    let maxMinutes = input.maxAllowedMinutesRoomTemp ?? 120; // Default 2 hours

    if (input.transportCondition === 'REFRIGERATED') {
      maxMinutes = input.maxAllowedMinutesRefrigerated ?? 480; // 8 hours
    } else if (input.transportCondition === 'FROZEN') {
      maxMinutes = input.maxAllowedMinutesFrozen ?? 43200; // 30 days
    }

    if (elapsedMinutes > maxMinutes) {
      return {
        isAccepted: false,
        elapsedMinutes,
        maxAllowedMinutes: maxMinutes,
        transportCondition: input.transportCondition,
        rejectionReason: `SAMPLE_STABILITY_EXPIRED: Sample transit time (${elapsedMinutes} mins) exceeded maximum permissible stability (${maxMinutes} mins) under ${input.transportCondition} conditions (ISO 15189 pre-analytical compliance). Redraw mandatory.`
      };
    }

    return {
      isAccepted: true,
      elapsedMinutes,
      maxAllowedMinutes: maxMinutes,
      transportCondition: input.transportCondition
    };
  }
}
