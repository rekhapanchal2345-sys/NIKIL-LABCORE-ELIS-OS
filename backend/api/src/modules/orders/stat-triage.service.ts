import prisma from '../../../config/database';
import { HttpError } from '../../utils/http-error';

export type EncounterType = 'OPD' | 'IPD' | 'EMERGENCY_STAT' | 'ICU' | 'DAYCARE';

export interface RegisterStatOrIpdOrderInput {
  orderId: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  encounterType: EncounterType;
  wardName?: string;
  roomNumber?: string;
  bedNumber?: string;
  nurseStationId?: string;
  attendingPhysician?: string;
  biomarkerCodes: string[];
  requiresBedsideDraw?: boolean;
  assignedPhlebotomistId?: string;
}

export interface DispatchBedsidePhlebotomyInput {
  trackerId: string;
  phlebotomistId: string;
  markCollected?: boolean;
}

const ULTRA_CRITICAL_30_MIN_BIOMARKERS = new Set([
  'TROP-I',
  'TROP-T',
  'TROPONIN',
  'ABG',
  'LACTATE',
  'LAC',
  'K',
  'NA',
  'ELECTROLYTES',
]);

export class StatTriageService {
  /**
   * Determines target SLA turnaround time (30 minutes vs 45 minutes) based on
   * ordered critical STAT biomarkers (Troponin I/T, ABG, Lactate, PT/INR, Electrolytes).
   */
  public calculateTargetTatMinutes(biomarkerCodes: string[], encounterType: EncounterType): number {
    const upperCodes = biomarkerCodes.map((c) => (c || '').toUpperCase());
    const has30MinBiomarker = upperCodes.some((code) =>
      Array.from(ULTRA_CRITICAL_30_MIN_BIOMARKERS).some((crit) => code.includes(crit))
    );

    if (has30MinBiomarker || encounterType === 'EMERGENCY_STAT') {
      return 30;
    }
    return 45;
  }

  /**
   * Registers an Emergency STAT, ICU, or IPD order into the real-time SLA Countdown Engine.
   * Computes exact 75% TAT warning threshold and 100% hard SLA deadline timestamps.
   */
  public async registerStatOrIpdEncounter(input: RegisterStatOrIpdOrderInput) {
    if (
      (input.encounterType === 'IPD' || input.encounterType === 'ICU') &&
      (!input.wardName || !input.bedNumber)
    ) {
      throw new HttpError(
        `Ward Name and Bed Number are mandatory for ${input.encounterType} inpatient encounters.`,
        400
      );
    }

    const orderedAt = new Date();
    const targetTatMinutes = this.calculateTargetTatMinutes(
      input.biomarkerCodes,
      input.encounterType
    );

    const warningMinutes = targetTatMinutes * 0.75; // 22.5 mins for 30m SLA, 33.75 mins for 45m SLA
    const warningThresholdAt = new Date(orderedAt.getTime() + warningMinutes * 60 * 1000);
    const hardSlaDeadlineAt = new Date(orderedAt.getTime() + targetTatMinutes * 60 * 1000);

    const tracker = await (prisma as any).statOrderTracker.upsert({
      where: { orderId: input.orderId },
      update: {
        encounterType: input.encounterType,
        wardName: input.wardName || null,
        roomNumber: input.roomNumber || null,
        bedNumber: input.bedNumber || null,
        nurseStationId: input.nurseStationId || null,
        attendingPhysician: input.attendingPhysician || null,
        biomarkerCodes: input.biomarkerCodes,
        requiresBedsideDraw: Boolean(input.requiresBedsideDraw),
        assignedPhlebotomistId: input.assignedPhlebotomistId || null,
        targetTatMinutes,
        warningThresholdAt,
        hardSlaDeadlineAt,
      },
      create: {
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        patientId: input.patientId,
        patientName: input.patientName,
        encounterType: input.encounterType,
        wardName: input.wardName || null,
        roomNumber: input.roomNumber || null,
        bedNumber: input.bedNumber || null,
        nurseStationId: input.nurseStationId || null,
        attendingPhysician: input.attendingPhysician || null,
        requiresBedsideDraw: Boolean(input.requiresBedsideDraw),
        assignedPhlebotomistId: input.assignedPhlebotomistId || null,
        biomarkerCodes: input.biomarkerCodes,
        targetTatMinutes,
        orderedAt,
        warningThresholdAt,
        hardSlaDeadlineAt,
        slaStatus: 'ON_TRACK',
      },
    });

    return this.enrichTrackerWithLiveCountdown(tracker);
  }

  /**
   * Evaluates live elapsed time against 75% TAT threshold and 100% SLA deadline,
   * triggering visual & audio siren flags when >= 75% TAT is breached.
   */
  public enrichTrackerWithLiveCountdown(tracker: any) {
    const now = new Date();
    const orderedAt = new Date(tracker.orderedAt);
    const deadlineAt = new Date(tracker.hardSlaDeadlineAt);
    const totalMs = tracker.targetTatMinutes * 60 * 1000;
    const elapsedMs = Math.max(0, now.getTime() - orderedAt.getTime());
    const remainingMs = deadlineAt.getTime() - now.getTime();
    const percentElapsed = Number(Math.min(200, (elapsedMs / totalMs) * 100).toFixed(1));

    let computedStatus = tracker.slaStatus;
    if (!tracker.completedAt) {
      if (remainingMs <= 0) {
        computedStatus = 'BREACHED_SLA';
      } else if (percentElapsed >= 75) {
        computedStatus = 'WARNING_75_PERCENT';
      } else {
        computedStatus = 'ON_TRACK';
      }
    }

    const triggerAudioVisualSiren =
      !tracker.completedAt &&
      percentElapsed >= 75 &&
      !tracker.audioAlertAcknowledged;

    return {
      ...tracker,
      slaStatus: computedStatus,
      elapsedSeconds: Math.floor(elapsedMs / 1000),
      remainingSeconds: Math.floor(remainingMs / 1000),
      percentTatConsumed: percentElapsed,
      triggerAudioVisualSiren,
    };
  }

  /**
   * Fetches all active STAT/ICU/IPD orders sorted by most urgent remaining SLA time,
   * and persists any SLA state transitions in the database.
   */
  public async getLiveStatTriageBoard(encounterFilter?: EncounterType) {
    const whereClause: Record<string, unknown> = {};
    if (encounterFilter) {
      whereClause.encounterType = encounterFilter;
    }

    const trackers = await (prisma as any).statOrderTracker.findMany({
      where: whereClause,
      orderBy: { hardSlaDeadlineAt: 'asc' },
      take: 100,
    });

    const enrichedList = [];
    for (const item of trackers) {
      const enriched = this.enrichTrackerWithLiveCountdown(item);
      if (enriched.slaStatus !== item.slaStatus && !item.completedAt) {
        await (prisma as any).statOrderTracker.update({
          where: { id: item.id },
          data: { slaStatus: enriched.slaStatus },
        });
      }
      enrichedList.push(enriched);
    }

    return {
      totalActiveStat: enrichedList.filter((x) => !x.completedAt).length,
      breached75Count: enrichedList.filter((x) => x.slaStatus === 'WARNING_75_PERCENT').length,
      hardBreachedCount: enrichedList.filter((x) => x.slaStatus === 'BREACHED_SLA').length,
      sirenActive: enrichedList.some((x) => x.triggerAudioVisualSiren),
      items: enrichedList,
    };
  }

  /**
   * Dispatches or completes a bedside phlebotomy round for an IPD/ICU ward patient.
   */
  public async updateBedsidePhlebotomyRound(input: DispatchBedsidePhlebotomyInput) {
    const existing = await (prisma as any).statOrderTracker.findUnique({
      where: { id: input.trackerId },
    });

    if (!existing) {
      throw new HttpError(`STAT/IPD Tracker ${input.trackerId} not found`, 404);
    }

    const updated = await (prisma as any).statOrderTracker.update({
      where: { id: input.trackerId },
      data: {
        requiresBedsideDraw: true,
        assignedPhlebotomistId: input.phlebotomistId,
        phlebotomyDispatchedAt: existing.phlebotomyDispatchedAt || new Date(),
        bedsideCollectedAt: input.markCollected ? new Date() : existing.bedsideCollectedAt,
      },
    });

    return this.enrichTrackerWithLiveCountdown(updated);
  }

  /**
   * Acknowledges the 75% TAT audio siren for a specific STAT order.
   */
  public async acknowledgeStatSiren(trackerId: string, userId: string) {
    const updated = await (prisma as any).statOrderTracker.update({
      where: { id: trackerId },
      data: {
        audioAlertAcknowledged: true,
        acknowledgedByUserId: userId,
      },
    });

    return this.enrichTrackerWithLiveCountdown(updated);
  }
}

export const statTriageService = new StatTriageService();
