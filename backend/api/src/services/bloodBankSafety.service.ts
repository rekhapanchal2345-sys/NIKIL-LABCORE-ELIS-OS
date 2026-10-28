/**
 * Blood Bank Safety, Immunohematology & Transfusion Service — NIKIL-LABCORE-ELIS-OS
 * 
 * Category 18: Blood Bank / Transfusion Medicine & Cross-Match Safety Bugs
 * - Bug 18.1: ABO / Rh Forward & Reverse Grouping Discrepancy Hard Lock (Deterministic Truth Table)
 * - Bug 18.2: Blood Bag Reservation Race Condition & 72-Hour Cross-Match Expiry Timer
 */

export type AgglutinationGrade = '0' | '1+' | '2+' | '3+' | '4+';

export interface BloodGroupingInput {
  // Forward Grouping (Cell Typing)
  antiA: AgglutinationGrade;
  antiB: AgglutinationGrade;
  antiAB: AgglutinationGrade;
  antiD1: AgglutinationGrade;
  antiD2: AgglutinationGrade;
  // Reverse Grouping (Serum Typing)
  aCells: AgglutinationGrade;
  bCells: AgglutinationGrade;
  oCells: AgglutinationGrade;
}

export interface BloodGroupingVerdict {
  isDiscrepancy: boolean;
  derivedBloodGroup: string | null; // e.g. "A_POSITIVE", "O_NEGATIVE"
  rhStatus: 'POSITIVE' | 'NEGATIVE' | 'WEAK_D_CONFIRMATION_REQUIRED';
  discrepancyType?: 'FORWARD_REVERSE_MISMATCH' | 'RH_CONTROL_DISCREPANCY' | 'O_CELL_AUTO_AGGLUTINATION';
  actionableDirective: string;
}

export interface CrossMatchReservationInput {
  unitNumber: string;
  donorBloodGroup: string;
  patientId: string;
  patientBloodGroup: string;
  crossMatchCompletedAt: Date | string;
  currentTime?: Date | string;
}

export interface CrossMatchReservationResult {
  isUnitValidForTransfusion: boolean;
  hoursElapsedSinceCrossMatch: number;
  remainingValidityHours: number;
  status: 'RESERVED_ACTIVE' | 'EXPIRED_72H_RELEASED_TO_STOCK';
  rejectionNotice?: string;
}

export class BloodBankSafetyService {
  /**
   * Bug 18.1: Deterministic Truth-Table ABO & Rh Grouping Validator
   * Eliminates dangerous manual dropdown entry by auto-deriving blood group strictly from agglutination grades.
   */
  public static evaluateBloodGrouping(input: BloodGroupingInput): BloodGroupingVerdict {
    const isPositive = (grade: AgglutinationGrade) => grade !== '0';

    const antiAPos = isPositive(input.antiA);
    const antiBPos = isPositive(input.antiB);
    const antiD1Pos = isPositive(input.antiD1);
    const antiD2Pos = isPositive(input.antiD2);

    const aCellsPos = isPositive(input.aCells);
    const bCellsPos = isPositive(input.bCells);
    const oCellsPos = isPositive(input.oCells);

    // 1. Check O-Cell auto-control (Warm/Cold auto-antibodies)
    if (oCellsPos) {
      return {
        isDiscrepancy: true,
        derivedBloodGroup: null,
        rhStatus: 'POSITIVE',
        discrepancyType: 'O_CELL_AUTO_AGGLUTINATION',
        actionableDirective:
          'ABO DISCREPANCY: O-Cells reaction positive. Auto-agglutination or atypical antibody suspected. Perform direct antiglobulin test (DAT) and antibody screen before blood release.'
      };
    }

    // 2. Check Rh Du/Anti-D concordance
    if (antiD1Pos !== antiD2Pos) {
      return {
        isDiscrepancy: true,
        derivedBloodGroup: null,
        rhStatus: 'WEAK_D_CONFIRMATION_REQUIRED',
        discrepancyType: 'RH_CONTROL_DISCREPANCY',
        actionableDirective:
          'RH DISCREPANCY: Anti-D1 and Anti-D2 reagents discordant. Perform weak D (Du) test with anti-human globulin incubation.'
      };
    }

    const isRhPositive = antiD1Pos && antiD2Pos;
    const rhSuffix = isRhPositive ? 'POSITIVE' : 'NEGATIVE';

    // 3. Derive Forward ABO Group
    let forwardGroup: 'A' | 'B' | 'AB' | 'O' | null = null;
    if (antiAPos && !antiBPos) forwardGroup = 'A';
    else if (!antiAPos && antiBPos) forwardGroup = 'B';
    else if (antiAPos && antiBPos) forwardGroup = 'AB';
    else if (!antiAPos && !antiBPos) forwardGroup = 'O';

    // 4. Derive Reverse ABO Group
    let reverseGroup: 'A' | 'B' | 'AB' | 'O' | null = null;
    if (!aCellsPos && bCellsPos) reverseGroup = 'A';
    else if (aCellsPos && !bCellsPos) reverseGroup = 'B';
    else if (!aCellsPos && !bCellsPos) reverseGroup = 'AB';
    else if (aCellsPos && bCellsPos) reverseGroup = 'O';

    // 5. Compare Forward vs Reverse (Truth Table Verification)
    if (forwardGroup !== reverseGroup || forwardGroup === null) {
      return {
        isDiscrepancy: true,
        derivedBloodGroup: null,
        rhStatus: isRhPositive ? 'POSITIVE' : 'NEGATIVE',
        discrepancyType: 'FORWARD_REVERSE_MISMATCH',
        actionableDirective: `ABO DISCREPANCY: Forward grouping shows Group ${forwardGroup || 'Indeterminate'}, but Reverse grouping shows Group ${reverseGroup || 'Indeterminate'}. System LOCKED from releasing blood bag. Repeat cell & serum wash, inspect patient age/history.`
      };
    }

    const finalGroup = `${forwardGroup}_${rhSuffix}`;
    return {
      isDiscrepancy: false,
      derivedBloodGroup: finalGroup,
      rhStatus: isRhPositive ? 'POSITIVE' : 'NEGATIVE',
      actionableDirective: `Blood Group Verified: ${finalGroup.replace('_', ' ')}. Forward and reverse grouping in 100% concordance.`
    };
  }

  /**
   * Bug 18.2: 72-Hour Cross-Match Compatibility Validity Enforcer
   * Cross-match compatibility is strictly valid for 72 hours under AABB / DGHS standards.
   * Auto-reverts reserved blood bags to available stock after 72 hours.
   */
  public static verifyCrossMatchValidity(
    input: CrossMatchReservationInput
  ): CrossMatchReservationResult {
    const crossMatchTime = new Date(input.crossMatchCompletedAt).getTime();
    const currentTime = input.currentTime ? new Date(input.currentTime).getTime() : Date.now();

    const diffHours = (currentTime - crossMatchTime) / (1000 * 60 * 60);
    const roundedHoursElapsed = Number(diffHours.toFixed(1));
    const remainingHours = Number(Math.max(0, 72.0 - diffHours).toFixed(1));

    if (diffHours > 72.0) {
      return {
        isUnitValidForTransfusion: false,
        hoursElapsedSinceCrossMatch: roundedHoursElapsed,
        remainingValidityHours: 0,
        status: 'EXPIRED_72H_RELEASED_TO_STOCK',
        rejectionNotice: `CROSS_MATCH_EXPIRED: 72-hour validity window elapsed (${roundedHoursElapsed} hours since cross-match). Patient may have developed new red cell antibodies. Unit #${input.unitNumber} returned to available inventory. Fresh sample required for re-cross-match.`
      };
    }

    return {
      isUnitValidForTransfusion: true,
      hoursElapsedSinceCrossMatch: roundedHoursElapsed,
      remainingValidityHours: remainingHours,
      status: 'RESERVED_ACTIVE'
    };
  }
}
