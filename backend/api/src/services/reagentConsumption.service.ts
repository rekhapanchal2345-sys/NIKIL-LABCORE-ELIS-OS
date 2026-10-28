/**
 * Reagent Inventory & Lot Expiry Engine — NIKIL-LABCORE-ELIS-OS
 * 
 * Module 12: Reagent Inventory & Kit Lot Expiry
 * - Bug 12.1: Expired Reagent Lot Auto-Verification Hard Block
 * - Bug 12.2: Comprehensive Run Event Deduction (Patient, QC, Calibrator, Prime)
 */

export interface ReagentLotInfo {
  lotId: string;
  reagentCode: string;
  lotNumber: string;
  expiryDate: Date | string;
  openedOnCarouselAt?: Date | string | null;
  onBoardStabilityDays: number;
  remainingVolumeMl: number;
  minimumStockAlertVolMl: number;
}

export type RunEventType = 'PATIENT' | 'QC_LEVEL_1' | 'QC_LEVEL_2' | 'QC_LEVEL_3' | 'CALIBRATOR' | 'SYSTEM_PRIME';

export interface DeductConsumptionInput {
  runType: RunEventType;
  testCode: string;
  cuvettesUsed?: number;
  tipsUsed?: number;
  volumeConsumedMl: number;
}

export interface ReagentCheckResult {
  isValid: boolean;
  isExpiredCalendar: boolean;
  isExpiredOnBoard: boolean;
  daysRemainingOnBoard?: number;
  remainingVolumeMl: number;
  isLowStock: boolean;
  hardBlockReason?: string;
}

export class ReagentConsumptionService {
  /**
   * Bug 12.1: Reagent Lot Expiration & On-Board Stability Verification
   * Checks both manufacturer kit expiration and on-board carousel stability.
   */
  public static verifyReagentLotValidity(
    lot: ReagentLotInfo,
    checkTime: Date = new Date()
  ): ReagentCheckResult {
    const expiry = new Date(lot.expiryDate);
    const isExpiredCalendar = checkTime.getTime() > expiry.getTime();

    let isExpiredOnBoard = false;
    let daysRemainingOnBoard: number | undefined;

    if (lot.openedOnCarouselAt) {
      const openedAt = new Date(lot.openedOnCarouselAt);
      const onBoardExpiryMs = openedAt.getTime() + lot.onBoardStabilityDays * 24 * 60 * 60 * 1000;
      isExpiredOnBoard = checkTime.getTime() > onBoardExpiryMs;
      const msLeft = onBoardExpiryMs - checkTime.getTime();
      daysRemainingOnBoard = Math.max(0, Math.floor(msLeft / (24 * 60 * 60 * 1000)));
    }

    const isLowStock = lot.remainingVolumeMl <= lot.minimumStockAlertVolMl;

    if (isExpiredCalendar) {
      return {
        isValid: false,
        isExpiredCalendar: true,
        isExpiredOnBoard,
        daysRemainingOnBoard,
        remainingVolumeMl: lot.remainingVolumeMl,
        isLowStock,
        hardBlockReason: `REAGENT_LOT_EXPIRED: Lot #${lot.lotNumber} for ${lot.reagentCode} expired on ${expiry.toISOString().split('T')[0]}. Auto-verification hard blocked.`
      };
    }

    if (isExpiredOnBoard) {
      return {
        isValid: false,
        isExpiredCalendar: false,
        isExpiredOnBoard: true,
        daysRemainingOnBoard: 0,
        remainingVolumeMl: lot.remainingVolumeMl,
        isLowStock,
        hardBlockReason: `ON_BOARD_STABILITY_EXCEEDED: Lot #${lot.lotNumber} exceeded ${lot.onBoardStabilityDays} days on-board stability limit. Degradation risk. Auto-verification hard blocked.`
      };
    }

    if (lot.remainingVolumeMl <= 0) {
      return {
        isValid: false,
        isExpiredCalendar: false,
        isExpiredOnBoard: false,
        daysRemainingOnBoard,
        remainingVolumeMl: 0,
        isLowStock: true,
        hardBlockReason: `REAGENT_DEPLETED: Lot #${lot.lotNumber} has 0 mL remaining volume.`
      };
    }

    return {
      isValid: true,
      isExpiredCalendar: false,
      isExpiredOnBoard: false,
      daysRemainingOnBoard,
      remainingVolumeMl: lot.remainingVolumeMl,
      isLowStock
    };
  }

  /**
   * Bug 12.2: Deducts reagent volume across Patient, QC, Calibrator, and Prime events.
   */
  public static calculateConsumptionDeduction(
    currentRemainingMl: number,
    deductInput: DeductConsumptionInput
  ): {
    newRemainingMl: number;
    volumeDeductedMl: number;
    isDepleted: boolean;
  } {
    const volumeToDeduct = deductInput.volumeConsumedMl;
    const newRemainingMl = Math.max(0, Math.round((currentRemainingMl - volumeToDeduct) * 10000) / 10000);

    return {
      newRemainingMl,
      volumeDeductedMl: volumeToDeduct,
      isDepleted: newRemainingMl <= 0
    };
  }
}
