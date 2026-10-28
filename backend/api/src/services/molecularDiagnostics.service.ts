/**
 * Molecular Diagnostics, RT-PCR & 96-Well ELISA Engine — NIKIL-LABCORE-ELIS-OS
 * 
 * Category 17: Molecular Diagnostics (RT-PCR), ELISA Plate Reader & Cut-Off Index Bugs
 * - Bug 17.1: 96-Well ELISA Microplate Coordinate Mapping & Control Well Verification (Blank, NC, PC, COI)
 * - Bug 17.2: RT-PCR Decision Matrix State Machine (Target Ct vs Internal Control Ct Inhibition Protection)
 * - Bug 17.3: Viral Load Log10 to IU/mL Precision Loss Prevention (TND, DETECTED_BELOW_LLOQ, QUANTIFIED)
 */

export type PlateOrientation = 'ROW_WISE_A1_A12' | 'COLUMN_WISE_A1_H1';

export interface ElisaControlValidationInput {
  blankOD: number;
  negativeControlOD: number;
  positiveControlOD: number;
  maxAllowableNegativeOD?: number; // default: 0.150
  minAllowablePositiveOD?: number; // default: 1.000
}

export interface ElisaControlValidationResult {
  isValid: boolean;
  cutOffValue: number;
  failureReason?: string;
}

export interface RtPcrInput {
  targetGeneCode: string;
  targetCt: number | null; // null or 0 indicates Undetermined
  internalControlCt: number | null;
  cutoffCt?: number; // default: 35.0
  lateCtIndeterminateThreshold?: number; // default: 38.0
}

export type PcrVerdict = 'POSITIVE' | 'NEGATIVE' | 'INDETERMINATE' | 'INVALID_PCR_INHIBITION';

export interface RtPcrVerdictResult {
  verdict: PcrVerdict;
  targetCtDisplay: string;
  internalControlCtDisplay: string;
  isActionable: boolean;
  recommendation: string;
}

export type ViralLoadState = 'TND' | 'DETECTED_BELOW_LLOQ' | 'QUANTIFIED';

export interface ViralLoadInput {
  rawIuMl?: number;
  rawLog10?: number;
  lloqIuMl?: number; // Lower Limit of Quantification (typically 20 IU/mL)
  isTargetDetected: boolean;
}

export interface ViralLoadResult {
  state: ViralLoadState;
  copiesOrIuPerMlText: string;
  log10Text: string;
  clinicalInterpretation: string;
}

export class MolecularDiagnosticsService {
  /**
   * Bug 17.1: Maps 96-well microplate coordinates (Row-Major vs Column-Major)
   * Row-Major: A1, A2, A3... A12, B1, B2... H12
   * Column-Major: A1, B1, C1... H1, A2, B2... H12
   */
  public static mapWellCoordinate(
    indexZeroBased: number,
    orientation: PlateOrientation
  ): { row: string; col: number; wellId: string } {
    if (indexZeroBased < 0 || indexZeroBased >= 96) {
      throw new Error(`Invalid 96-well plate index ${indexZeroBased}. Must be 0 to 95.`);
    }

    const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    let rowIndex = 0;
    let colNumber = 1;

    if (orientation === 'ROW_WISE_A1_A12') {
      rowIndex = Math.floor(indexZeroBased / 12);
      colNumber = (indexZeroBased % 12) + 1;
    } else {
      // COLUMN_WISE_A1_H1
      rowIndex = indexZeroBased % 8;
      colNumber = Math.floor(indexZeroBased / 8) + 1;
    }

    const row = rowLetters[rowIndex];
    return {
      row,
      col: colNumber,
      wellId: `${row}${colNumber}`
    };
  }

  /**
   * Bug 17.1: Validates ELISA Negative Control and Positive Control Optical Density (OD)
   * Formula: Cut-Off Value (COV) = Negative Control Mean + Factor (e.g. 0.100)
   */
  public static validateElisaControls(input: ElisaControlValidationInput): ElisaControlValidationResult {
    const maxNC = input.maxAllowableNegativeOD ?? 0.150;
    const minPC = input.minAllowablePositiveOD ?? 1.000;

    if (input.negativeControlOD > maxNC) {
      return {
        isValid: false,
        cutOffValue: 0,
        failureReason: `ELISA_RUN_REJECTED: Negative Control OD (${input.negativeControlOD.toFixed(3)}) exceeds maximum permissible limit (${maxNC.toFixed(3)}). High background noise.`
      };
    }

    if (input.positiveControlOD < minPC) {
      return {
        isValid: false,
        cutOffValue: 0,
        failureReason: `ELISA_RUN_REJECTED: Positive Control OD (${input.positiveControlOD.toFixed(3)}) is below minimum verification threshold (${minPC.toFixed(3)}). Insufficient reagent reactivity.`
      };
    }

    // Cut-Off Value (COV) calculation (Standard NC + 0.100 formula)
    const cutOffValue = Number((input.negativeControlOD + 0.100).toFixed(4));
    return {
      isValid: true,
      cutOffValue
    };
  }

  /**
   * Calculates Cut-Off Index (COI) for an ELISA specimen: COI = Specimen OD / Cut-Off Value
   */
  public static calculateCoi(
    specimenOD: number,
    cutOffValue: number
  ): {
    coi: number;
    interpretation: 'NON_REACTIVE' | 'BORDERLINE' | 'REACTIVE';
  } {
    if (cutOffValue <= 0) {
      throw new Error('Invalid Cut-Off Value for COI calculation.');
    }
    const coi = Number((specimenOD / cutOffValue).toFixed(3));
    let interpretation: 'NON_REACTIVE' | 'BORDERLINE' | 'REACTIVE' = 'NON_REACTIVE';

    if (coi >= 1.1) {
      interpretation = 'REACTIVE';
    } else if (coi >= 0.9) {
      interpretation = 'BORDERLINE';
    } else {
      interpretation = 'NON_REACTIVE';
    }

    return { coi, interpretation };
  }

  /**
   * Bug 17.2: RT-PCR Decision Matrix State Machine
   * Protects against late Ct false positives and Internal Control (IC) PCR inhibition false negatives.
   */
  public static evaluateRtPcrRun(input: RtPcrInput): RtPcrVerdictResult {
    const cutoff = input.cutoffCt ?? 35.0;
    const lateThreshold = input.lateCtIndeterminateThreshold ?? 38.0;

    const targetCt = input.targetCt && input.targetCt > 0 ? input.targetCt : null;
    const icCt = input.internalControlCt && input.internalControlCt > 0 ? input.internalControlCt : null;

    const targetDisplay = targetCt ? targetCt.toFixed(1) : 'Undetermined';
    const icDisplay = icCt ? icCt.toFixed(1) : 'Undetermined';

    // 1. Check PCR Inhibition (Internal Control failed)
    const isIcFailing = icCt === null || icCt > 35.0;

    if (isIcFailing && targetCt === null) {
      return {
        verdict: 'INVALID_PCR_INHIBITION',
        targetCtDisplay: targetDisplay,
        internalControlCtDisplay: icDisplay,
        isActionable: false,
        recommendation:
          'INVALID RUN / PCR INHIBITION: Internal Control failed to amplify (Ct > 35 or Undetermined). Specimen contains PCR inhibitors. Mandatory re-extraction and rerun required.'
      };
    }

    // 2. Target Amplified Strongly (< Cutoff)
    if (targetCt !== null && targetCt <= cutoff) {
      return {
        verdict: 'POSITIVE',
        targetCtDisplay: targetDisplay,
        internalControlCtDisplay: icDisplay,
        isActionable: true,
        recommendation: `Target Gene (${input.targetGeneCode}) DETECTED (Ct = ${targetDisplay}). Result confirmed positive.`
      };
    }

    // 3. Late Ct Gray Zone (Cutoff to 38.0)
    if (targetCt !== null && targetCt > cutoff && targetCt <= lateThreshold) {
      return {
        verdict: 'INDETERMINATE',
        targetCtDisplay: targetDisplay,
        internalControlCtDisplay: icDisplay,
        isActionable: false,
        recommendation: `INDETERMINATE / EQUIVOCAL: Late amplification detected (Ct = ${targetDisplay}). Hold for manual duplicate repeat amplification.`
      };
    }

    // 4. Target Amplification Past 38.0 (Non-specific noise / primer-dimer)
    if (targetCt !== null && targetCt > lateThreshold) {
      return {
        verdict: 'NEGATIVE',
        targetCtDisplay: 'Undetermined (>38.0 Non-specific)',
        internalControlCtDisplay: icDisplay,
        isActionable: true,
        recommendation: 'Target Gene NOT DETECTED. Amplification past 38.0 considered non-specific background noise.'
      };
    }

    // 5. True Negative (IC Valid, Target Undetermined)
    return {
      verdict: 'NEGATIVE',
      targetCtDisplay: 'Undetermined',
      internalControlCtDisplay: icDisplay,
      isActionable: true,
      recommendation: `Target Gene (${input.targetGeneCode}) NOT DETECTED. Internal control verified valid (${icDisplay}).`
    };
  }

  /**
   * Bug 17.3: Quantitative Viral Load Log10 to IU/mL Precision Engine
   */
  public static formatQuantitativeViralLoad(input: ViralLoadInput): ViralLoadResult {
    const lloq = input.lloqIuMl ?? 20;

    if (!input.isTargetDetected) {
      return {
        state: 'TND',
        copiesOrIuPerMlText: 'Target Not Detected (TND)',
        log10Text: 'Not Applicable',
        clinicalInterpretation: 'Target RNA/DNA was not detected in this specimen (Below analytical detection limit).'
      };
    }

    let iuPerMl = input.rawIuMl;
    let log10 = input.rawLog10;

    if (iuPerMl !== undefined && log10 === undefined) {
      log10 = iuPerMl > 0 ? Number(Math.log10(iuPerMl).toFixed(2)) : 0;
    } else if (log10 !== undefined && iuPerMl === undefined) {
      iuPerMl = Math.round(Math.pow(10, log10));
    }

    iuPerMl = iuPerMl || 0;
    log10 = log10 || 0;

    if (iuPerMl < lloq) {
      return {
        state: 'DETECTED_BELOW_LLOQ',
        copiesOrIuPerMlText: `< ${lloq} IU/mL (Detected)`,
        log10Text: `< ${Math.log10(lloq).toFixed(2)} Log10 IU/mL`,
        clinicalInterpretation: `Viral target is DETECTED, but below the Lower Limit of Quantification (${lloq} IU/mL). Indicates minimal residual viremia.`
      };
    }

    return {
      state: 'QUANTIFIED',
      copiesOrIuPerMlText: `${iuPerMl.toLocaleString()} IU/mL`,
      log10Text: `${log10.toFixed(2)} Log10 IU/mL`,
      clinicalInterpretation: `Viral target QUANTIFIED: ${iuPerMl.toLocaleString()} IU/mL (${log10.toFixed(2)} Log10 IU/mL).`
    };
  }
}
