/**
 * NABL ISO 15189:2022 QMS, Equipment Calibration, EQAS & CAPA Engine — NIKIL-LABCORE-ELIS-OS
 * 
 * Category 20: NABL ISO 15189:2022 Quality Management System (QMS) & CAPA Engine Bugs
 * - Bug 20.1: Equipment Preventive Maintenance (PM) & Calibration Lockout Missing
 * - Bug 20.2: EQAS / PT Blind-Sample Registration & Z-Score CAPA Generator (|Z| > 2.0)
 * - Bug 20.3: IoT Temperature Logger Min-Max Excursion & Reagent Quarantine
 */

export interface EquipmentStatusInput {
  equipmentCode: string;
  equipmentName: string;
  calibrationExpiryDate: Date | string;
  nextPreventiveMaintenanceDate: Date | string;
  currentDate?: Date | string;
}

export interface EquipmentComplianceResult {
  isOperational: boolean;
  isComplianceLocked: boolean;
  status: 'OPERATIONAL' | 'COMPLIANCE_LOCKED';
  lockoutReason?: string;
}

export interface EqasPtInput {
  cycleId: string;
  parameterCode: string;
  labResultValue: number;
  peerGroupMean: number;
  peerGroupSD: number;
}

export interface EqasEvaluationResult {
  zScore: number;
  isSatisfactory: boolean;
  performanceGrade: 'ACCEPTABLE' | 'WARNING_SUSPECT' | 'UNSATISFACTORY_CAPA_MANDATORY';
  capaTicketGenerated: boolean;
  actionRequiredText: string;
}

export interface TempExcursionInput {
  refrigeratorLocation: string;
  minTempRecordedCelsius: number;
  maxTempRecordedCelsius: number;
  standardMinCelsius?: number; // default: 2.0
  standardMaxCelsius?: number; // default: 8.0
  storedReagentLotIds: string[];
}

export interface TempExcursionResult {
  isExcursionDetected: boolean;
  quarantinedReagentLotsCount: number;
  capaTicketId?: string;
  regulatoryDirective: string;
}

export class NablComplianceQmsService {
  /**
   * Bug 20.1: Equipment Calibration & Preventive Maintenance Lockout
   * Hard-locks instrument channels from verifying patient results if calibration/PM certificate expired.
   */
  public static evaluateEquipmentStatus(input: EquipmentStatusInput): EquipmentComplianceResult {
    const now = input.currentDate ? new Date(input.currentDate).getTime() : Date.now();
    const calExpiry = new Date(input.calibrationExpiryDate).getTime();
    const pmExpiry = new Date(input.nextPreventiveMaintenanceDate).getTime();

    if (now > calExpiry) {
      return {
        isOperational: false,
        isComplianceLocked: true,
        status: 'COMPLIANCE_LOCKED',
        lockoutReason: `CALIBRATION_EXPIRED: Calibration validity expired on ${new Date(input.calibrationExpiryDate).toISOString().split('T')[0]}. Testing locked under NABL Clause 6.4. Lab Quality Manager digital override required.`
      };
    }

    if (now > pmExpiry) {
      return {
        isOperational: false,
        isComplianceLocked: true,
        status: 'COMPLIANCE_LOCKED',
        lockoutReason: `PREVENTIVE_MAINTENANCE_OVERDUE: Scheduled maintenance overdue since ${new Date(input.nextPreventiveMaintenanceDate).toISOString().split('T')[0]}. Hardware safety interlock active.`
      };
    }

    return {
      isOperational: true,
      isComplianceLocked: false,
      status: 'OPERATIONAL'
    };
  }

  /**
   * Bug 20.2: Blind EQAS Registration & Z-Score Evaluation
   * Z = (Lab Value - Peer Mean) / Peer SD
   * |Z| <= 2.0: Acceptable
   * 2.0 < |Z| <= 3.0: Warning / Suspect
   * |Z| > 3.0: Unsatisfactory (Mandatory CAPA under ISO 15189 Clause 7.3.7.3)
   */
  public static evaluateEqasZScore(input: EqasPtInput): EqasEvaluationResult {
    if (input.peerGroupSD <= 0) {
      throw new Error('Peer Group Standard Deviation must be positive.');
    }

    const rawZ = (input.labResultValue - input.peerGroupMean) / input.peerGroupSD;
    const zScore = Number(rawZ.toFixed(2));
    const absZ = Math.abs(zScore);

    if (absZ <= 2.0) {
      return {
        zScore,
        isSatisfactory: true,
        performanceGrade: 'ACCEPTABLE',
        capaTicketGenerated: false,
        actionRequiredText: `EQAS result in statistical control (Z = ${zScore}). No corrective action required.`
      };
    }

    if (absZ <= 3.0) {
      return {
        zScore,
        isSatisfactory: false,
        performanceGrade: 'WARNING_SUSPECT',
        capaTicketGenerated: false,
        actionRequiredText: `EQAS Warning: Z-score is ${zScore} (Between 2.0 and 3.0). Review reagent lot, calibrator baseline, and pipetting accuracy.`
      };
    }

    return {
      zScore,
      isSatisfactory: false,
      performanceGrade: 'UNSATISFACTORY_CAPA_MANDATORY',
      capaTicketGenerated: true,
      actionRequiredText: `UNSATISFACTORY EQAS (Z = ${zScore} > 3.0). Automatic CAPA Ticket generated under NABL ISO 15189 Clause 8.7. Root Cause Analysis (RCA) mandatory within 7 business days.`
    };
  }

  /**
   * Bug 20.3: IoT Min-Max Refrigerator Temperature Logger & Automated Quarantine
   */
  public static processTemperatureLog(input: TempExcursionInput): TempExcursionResult {
    const minLimit = input.standardMinCelsius ?? 2.0;
    const maxLimit = input.standardMaxCelsius ?? 8.0;

    const isExcursion = input.maxTempRecordedCelsius > maxLimit || input.minTempRecordedCelsius < minLimit;

    if (!isExcursion) {
      return {
        isExcursionDetected: false,
        quarantinedReagentLotsCount: 0,
        regulatoryDirective: `Temperature verified in range (${input.minTempRecordedCelsius}°C - ${input.maxTempRecordedCelsius}°C). Reagent integrity compliant.`
      };
    }

    const capaId = `CAPA-TEMP-${Date.now().toString().slice(-6)}`;
    const lotsCount = input.storedReagentLotIds.length;

    return {
      isExcursionDetected: true,
      quarantinedReagentLotsCount: lotsCount,
      capaTicketId: capaId,
      regulatoryDirective: `COLD-CHAIN BREACH: Temperature excursion recorded (${input.minTempRecordedCelsius}°C - ${input.maxTempRecordedCelsius}°C, Limit: ${minLimit}°C - ${maxLimit}°C). ${lotsCount} Reagent Lots marked QUARANTINED_PENDING_QC. CAPA Ticket ${capaId} opened.`
    };
  }
}
