/**
 * Dynamic Multi-Stage Testing & Timed Series Engine — NIKIL-LABCORE-ELIS-OS
 * 
 * Category 19: Dynamic Multi-Stage Testing (GTT, ACTH Stimulation, Serial Cardiac Curves)
 * - Bug 19.1: OGTT Out-of-Order Collection & Missing Fasting Guard (60±10m window, DIPSI/WHO criteria)
 */

export interface OgttSeriesInput {
  fastingTimestamp?: Date | string | null;
  fastingValue?: number | null;
  glucoseLoadGivenTimestamp?: Date | string | null;
  oneHourTimestamp?: Date | string | null;
  oneHourValue?: number | null;
  twoHourTimestamp?: Date | string | null;
  twoHourValue?: number | null;
  currentTime?: Date | string;
}

export interface OgttScanValidationResult {
  canScanNextTube: boolean;
  expectedSampleStage: 'FASTING_0H' | 'POST_LOAD_1H' | 'POST_LOAD_2H' | 'SERIES_COMPLETE';
  timeWindowCompliance: boolean;
  minutesElapsedFromLoad?: number;
  expectedWindowText?: string;
  deviationNotice?: string;
}

export interface OgttClinicalVerdict {
  isComplete: boolean;
  whoDiagnosticStatus: 'NORMAL_GLUCOSE_TOLERANCE' | 'IMPAIRED_FASTING_GLUCOSE' | 'IMPAIRED_GLUCOSE_TOLERANCE' | 'GESTATIONAL_DIABETES_MELLITUS' | 'OVERT_DIABETES' | 'INCOMPLETE_SERIES';
  curveDataPoints: Array<{ label: string; minutes: number; value: number | null }>;
  clinicalInterpretation: string;
}

export class DynamicSeriesTestingService {
  /**
   * Bug 19.1: Validates collection timing window for OGTT serial stages.
   * Fasting (0h) -> Glucose Load Given (75g anhydrous glucose) -> 1h (60±10m) -> 2h (120±15m).
   */
  public static validateOgttScanStage(input: OgttSeriesInput): OgttScanValidationResult {
    const current = input.currentTime ? new Date(input.currentTime).getTime() : Date.now();

    // 1. Must collect Fasting first
    if (!input.fastingTimestamp) {
      return {
        canScanNextTube: true,
        expectedSampleStage: 'FASTING_0H',
        timeWindowCompliance: true,
        expectedWindowText: 'Fasting (0 Hour) baseline sample must be collected first.'
      };
    }

    // 2. Glucose load must be administered
    if (!input.glucoseLoadGivenTimestamp) {
      return {
        canScanNextTube: false,
        expectedSampleStage: 'POST_LOAD_1H',
        timeWindowCompliance: false,
        expectedWindowText: 'Mandatory phlebotomy step: Record 75g oral glucose ingestion timestamp before drawing post-load samples.'
      };
    }

    const loadTime = new Date(input.glucoseLoadGivenTimestamp).getTime();
    const elapsedMinutes = Math.floor((current - loadTime) / (1000 * 60));

    // 3. Stage 1h (Target: 60 mins, Window: 50 - 70 mins)
    if (!input.oneHourTimestamp) {
      const isWithinWindow = elapsedMinutes >= 50 && elapsedMinutes <= 70;
      return {
        canScanNextTube: true,
        expectedSampleStage: 'POST_LOAD_1H',
        timeWindowCompliance: isWithinWindow,
        minutesElapsedFromLoad: elapsedMinutes,
        expectedWindowText: 'Target: 60 mins post-glucose (Permissible window: 50 - 70 mins).',
        deviationNotice: !isWithinWindow
          ? `TIMING_DEVIATION: 1-Hour sample scanned at ${elapsedMinutes} mins (${elapsedMinutes < 50 ? 'Early draw' : 'Delayed draw'}). Mandatory clinical deviation audit required.`
          : undefined
      };
    }

    // 4. Stage 2h (Target: 120 mins, Window: 105 - 135 mins)
    if (!input.twoHourTimestamp) {
      const isWithinWindow = elapsedMinutes >= 105 && elapsedMinutes <= 135;
      return {
        canScanNextTube: true,
        expectedSampleStage: 'POST_LOAD_2H',
        timeWindowCompliance: isWithinWindow,
        minutesElapsedFromLoad: elapsedMinutes,
        expectedWindowText: 'Target: 120 mins post-glucose (Permissible window: 105 - 135 mins).',
        deviationNotice: !isWithinWindow
          ? `TIMING_DEVIATION: 2-Hour sample scanned at ${elapsedMinutes} mins (${elapsedMinutes < 105 ? 'Early draw' : 'Delayed draw'}). Mandatory clinical deviation audit required.`
          : undefined
      };
    }

    return {
      canScanNextTube: false,
      expectedSampleStage: 'SERIES_COMPLETE',
      timeWindowCompliance: true,
      expectedWindowText: 'All 3 stages of OGTT series collected.'
    };
  }

  /**
   * Bug 19.1: Evaluates WHO / IADPSG / DIPSI criteria for Gestational Diabetes:
   * Fasting >= 92 mg/dL OR 1-Hour >= 180 mg/dL OR 2-Hour >= 153 mg/dL.
   */
  public static evaluateOgttDiagnosticCurve(input: {
    fasting: number | null;
    oneHour: number | null;
    twoHour: number | null;
  }): OgttClinicalVerdict {
    const { fasting, oneHour, twoHour } = input;

    const curveDataPoints = [
      { label: 'Fasting (0 Hr)', minutes: 0, value: fasting },
      { label: '1 Hour Post-Load', minutes: 60, value: oneHour },
      { label: '2 Hours Post-Load', minutes: 120, value: twoHour }
    ];

    if (fasting === null || oneHour === null || twoHour === null) {
      return {
        isComplete: false,
        whoDiagnosticStatus: 'INCOMPLETE_SERIES',
        curveDataPoints,
        clinicalInterpretation: 'OGTT series incomplete. All 3 time points (Fasting, 1-Hour, 2-Hour) required for definitive classification.'
      };
    }

    // Overt Diabetes in Pregnancy (Fasting >= 126 mg/dL OR 2-Hour >= 200 mg/dL)
    if (fasting >= 126 || twoHour >= 200) {
      return {
        isComplete: true,
        whoDiagnosticStatus: 'OVERT_DIABETES',
        curveDataPoints,
        clinicalInterpretation: 'Overt Diabetes Mellitus (Fasting >= 126 mg/dL or 2-Hour >= 200 mg/dL). Immediate endocrinology consultation recommended.'
      };
    }

    // Gestational Diabetes Mellitus (GDM) under IADPSG/WHO Criteria
    // Fasting >= 92 mg/dL OR 1-Hour >= 180 mg/dL OR 2-Hour >= 153 mg/dL
    if (fasting >= 92 || oneHour >= 180 || twoHour >= 153) {
      return {
        isComplete: true,
        whoDiagnosticStatus: 'GESTATIONAL_DIABETES_MELLITUS',
        curveDataPoints,
        clinicalInterpretation: `Gestational Diabetes Mellitus (GDM) confirmed under WHO/IADPSG criteria. Fasting=${fasting} (Cutoff 92), 1H=${oneHour} (Cutoff 180), 2H=${twoHour} (Cutoff 153).`
      };
    }

    return {
      isComplete: true,
      whoDiagnosticStatus: 'NORMAL_GLUCOSE_TOLERANCE',
      curveDataPoints,
      clinicalInterpretation: 'Normal Glucose Tolerance. All time points within physiological limits.'
    };
  }
}
