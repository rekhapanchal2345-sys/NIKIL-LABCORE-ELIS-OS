import prisma from '../../../config/database';
import { HttpError } from '../../utils/http-error';

export type VacutainerTubeType =
  | 'LAVENDER_EDTA'
  | 'GOLD_SST'
  | 'GREY_FLUORIDE'
  | 'BLUE_CITRATE'
  | 'YELLOW_URINE'
  | 'GREEN_HEPARIN'
  | 'RED_PLAIN'
  | 'BLACK_ESR';

export type AliquotTargetDepartment =
  | 'BIOCHEMISTRY'
  | 'IMMUNOLOGY'
  | 'HEMATOLOGY'
  | 'COAGULATION'
  | 'CLINICAL_PATHOLOGY'
  | 'SEROLOGY'
  | 'MOLECULAR_BIOLOGY';

export interface TubeSpecification {
  tubeType: VacutainerTubeType;
  additiveName: string;
  capColorHex: string;
  orderOfDrawRank: number; // CLSI GP41 Order of Draw
  baseDeadVolumeMl: number;
  volumePerTestMl: number;
  maxCapacityMl: number;
}

export interface ConsolidateOrderTubesInput {
  orderId: string;
  userId: string;
}

export interface CollectPhysicalTubeInput {
  tubeId: string;
  collectedVolumeMl: number;
  collectedByUserId: string;
  qnsOverrideReason?: string;
}

export interface CentrifugeTubeInput {
  tubeId: string;
  centrifugeSpeedRpm: number;
  centrifugeDurationMin: number;
  isDecapped: boolean;
  hemolysisIndex?: number;
  icterusIndex?: number;
  lipemiaIndex?: number;
  userId: string;
}

export interface SplitSecondaryAliquotsInput {
  parentTubeId: string;
  userId: string;
  splits?: Array<{
    targetDepartment: AliquotTargetDepartment;
    targetAnalyzerCode: string;
    allocatedVolumeMl: number;
    assignedTestCodes: string[];
  }>;
}

const CLSI_TUBE_SPECS: Record<VacutainerTubeType, TubeSpecification> = {
  BLUE_CITRATE: {
    tubeType: 'BLUE_CITRATE',
    additiveName: '3.2% Buffered Sodium Citrate (9:1 Ratio)',
    capColorHex: '#38BDF8',
    orderOfDrawRank: 1,
    baseDeadVolumeMl: 1.8,
    volumePerTestMl: 0.45,
    maxCapacityMl: 2.7,
  },
  GOLD_SST: {
    tubeType: 'GOLD_SST',
    additiveName: 'Clot Activator + Polymer Gel (SST II Advance)',
    capColorHex: '#FACC15',
    orderOfDrawRank: 2,
    baseDeadVolumeMl: 1.0,
    volumePerTestMl: 0.4,
    maxCapacityMl: 5.0,
  },
  RED_PLAIN: {
    tubeType: 'RED_PLAIN',
    additiveName: 'Micronized Silica Clot Activator (No Gel)',
    capColorHex: '#EF4444',
    orderOfDrawRank: 3,
    baseDeadVolumeMl: 1.0,
    volumePerTestMl: 0.5,
    maxCapacityMl: 6.0,
  },
  GREEN_HEPARIN: {
    tubeType: 'GREEN_HEPARIN',
    additiveName: 'Lithium Heparin (PST)',
    capColorHex: '#22C55E',
    orderOfDrawRank: 4,
    baseDeadVolumeMl: 1.0,
    volumePerTestMl: 0.4,
    maxCapacityMl: 4.0,
  },
  LAVENDER_EDTA: {
    tubeType: 'LAVENDER_EDTA',
    additiveName: 'Spray-Coated K2-EDTA',
    capColorHex: '#A855F7',
    orderOfDrawRank: 5,
    baseDeadVolumeMl: 1.2,
    volumePerTestMl: 0.4,
    maxCapacityMl: 4.0,
  },
  GREY_FLUORIDE: {
    tubeType: 'GREY_FLUORIDE',
    additiveName: 'Sodium Fluoride + Potassium Oxalate (Antiglycolytic)',
    capColorHex: '#94A3B8',
    orderOfDrawRank: 6,
    baseDeadVolumeMl: 1.0,
    volumePerTestMl: 0.5,
    maxCapacityMl: 3.0,
  },
  BLACK_ESR: {
    tubeType: 'BLACK_ESR',
    additiveName: '3.8% Buffered Sodium Citrate (4:1 Westergren)',
    capColorHex: '#1E293B',
    orderOfDrawRank: 7,
    baseDeadVolumeMl: 1.6,
    volumePerTestMl: 0.4,
    maxCapacityMl: 2.4,
  },
  YELLOW_URINE: {
    tubeType: 'YELLOW_URINE',
    additiveName: 'Sterile Conical Urine Container (Boric Acid Free)',
    capColorHex: '#FDE047',
    orderOfDrawRank: 8,
    baseDeadVolumeMl: 10.0,
    volumePerTestMl: 5.0,
    maxCapacityMl: 50.0,
  },
};

export class VacutainerConsolidationService {
  /**
   * Maps a test code or category name to the exact physical Vacutainer tube type
   * according to CLSI GP41 and NABL pre-analytical guidelines.
   */
  public resolveVacutainerForTest(testCode: string, testName: string, categoryName: string): VacutainerTubeType {
    const code = (testCode || '').toUpperCase();
    const name = (testName || '').toUpperCase();
    const cat = (categoryName || '').toUpperCase();

    // 1. GREY_FLUORIDE: Glucose Fasting, PP, RBS, GTT
    if (
      code.includes('FBS') ||
      code.includes('PPBS') ||
      code.includes('RBS') ||
      code.includes('GLU') ||
      name.includes('GLUCOSE') ||
      name.includes('BLOOD SUGAR')
    ) {
      return 'GREY_FLUORIDE';
    }

    // 2. BLUE_CITRATE: PT/INR, APTT, D-Dimer, Fibrinogen, Coagulation
    if (
      code.includes('PT') ||
      code.includes('INR') ||
      code.includes('APTT') ||
      code.includes('COAG') ||
      code.includes('DDIMER') ||
      name.includes('PROTHROMBIN') ||
      cat.includes('COAGULATION')
    ) {
      return 'BLUE_CITRATE';
    }

    // 3. YELLOW_URINE: Urine Routine, Microscopy, Microalbumin
    if (
      code.includes('URN') ||
      code.includes('URINE') ||
      name.includes('URINE') ||
      cat.includes('URINE') ||
      cat.includes('CLINICAL PATHOLOGY')
    ) {
      return 'YELLOW_URINE';
    }

    // 4. LAVENDER_EDTA: CBC, HbA1c, ESR, Reticulocyte, Malaria, Hematology
    if (
      code.includes('CBC') ||
      code.includes('HBA1C') ||
      code.includes('ESR') ||
      code.includes('HB') ||
      code.includes('PLT') ||
      name.includes('HEMOGLOBIN') ||
      name.includes('COMPLETE BLOOD') ||
      name.includes('GLYCOSYLATED') ||
      cat.includes('HEMATOLOGY')
    ) {
      return 'LAVENDER_EDTA';
    }

    // 5. GREEN_HEPARIN: ABG, Ammonia, Lactate
    if (code.includes('ABG') || code.includes('LACTATE') || name.includes('ARTERIAL BLOOD GAS')) {
      return 'GREEN_HEPARIN';
    }

    // 6. Default GOLD_SST: Lipid Profile, LFT, KFT/RFT, Thyroid (TSH/T3/T4), Electrolytes, Vitamins, Troponin
    return 'GOLD_SST';
  }

  /**
   * Determines whether a test on a GOLD_SST tube belongs to BIOCHEMISTRY or IMMUNOLOGY
   * for automatic secondary aliquot splitting.
   */
  public resolveDepartmentForSerumTest(testCode: string, testName: string): {
    department: AliquotTargetDepartment;
    analyzerCode: string;
  } {
    const combined = `${testCode || ''} ${testName || ''}`.toUpperCase();
    if (
      combined.includes('TSH') ||
      combined.includes('T3') ||
      combined.includes('T4') ||
      combined.includes('THYROID') ||
      combined.includes('TROP') ||
      combined.includes('VIT') ||
      combined.includes('FERRITIN') ||
      combined.includes('PSA') ||
      combined.includes('HCG') ||
      combined.includes('INSULIN')
    ) {
      return { department: 'IMMUNOLOGY', analyzerCode: 'COBAS-E411-IMMUNO' };
    }
    return { department: 'BIOCHEMISTRY', analyzerCode: 'AU480-BIOCHEM' };
  }

  /**
   * Generates a deterministic, collision-safe primary tube barcode: SMP-YYYYMMDD-XXXXX
   */
  private async generatePrimaryTubeBarcode(): Promise<string> {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const datePrefix = `SMP-${yyyy}${mm}${dd}-`;

    const latestTube = await (prisma as any).specimenTube.findFirst({
      where: {
        primaryBarcode: {
          startsWith: datePrefix,
        },
      },
      orderBy: {
        primaryBarcode: 'desc',
      },
    });

    let nextSeq = 1;
    if (latestTube && latestTube.primaryBarcode) {
      const parts = latestTube.primaryBarcode.split('-');
      const lastNum = parseInt(parts[2] || '0', 10);
      if (!Number.isNaN(lastNum)) {
        nextSeq = lastNum + 1;
      }
    }

    return `${datePrefix}${String(nextSeq).padStart(5, '0')}`;
  }

  /**
   * Consolidates all tests in an Order into the minimum required physical Vacutainer tubes,
   * ordered strictly by CLSI GP41 Order of Draw.
   */
  public async consolidateOrderToPhysicalTubes(input: ConsolidateOrderTubesInput) {
    const order = await (prisma as any).order.findUnique({
      where: { id: input.orderId },
      include: {
        patient: true,
        items: {
          include: {
            test: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new HttpError(`Order with ID ${input.orderId} not found`, 404);
    }

    // Check if physical tubes already exist for this order
    const existingTubes = await (prisma as any).specimenTube.findMany({
      where: { orderId: order.id },
      include: { aliquots: true },
      orderBy: { orderOfDrawRank: 'asc' },
    });

    const orderItems = order.items || [];

    if (existingTubes.length > 0) {
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        patientName: `${order.patient?.firstName || ''} ${order.patient?.lastName || ''}`.trim(),
        totalTestsOrdered: orderItems.length,
        totalPhysicalTubes: existingTubes.length,
        barcodesSaved: Math.max(0, orderItems.length - existingTubes.length),
        tubes: existingTubes,
      };
    }

    // Group OrderItems by VacutainerTubeType
    const groupedMap = new Map<
      VacutainerTubeType,
      {
        testCodes: string[];
        orderItemIds: string[];
      }
    >();

    for (const item of orderItems) {
      const testCode = item.test?.testCode || item.test?.code || item.testId || 'UNKNOWN';
      const testName = item.test?.testName || item.test?.name || '';
      const categoryName = item.test?.category?.name || '';

      const tubeType = this.resolveVacutainerForTest(testCode, testName, categoryName);
      const current = groupedMap.get(tubeType) || { testCodes: [], orderItemIds: [] };
      if (!current.testCodes.includes(testCode)) {
        current.testCodes.push(testCode);
      }
      current.orderItemIds.push(item.id);
      groupedMap.set(tubeType, current);
    }

    // Sort groups by CLSI GP41 Order of Draw rank
    const sortedEntries = Array.from(groupedMap.entries()).sort(
      ([typeA], [typeB]) => CLSI_TUBE_SPECS[typeA].orderOfDrawRank - CLSI_TUBE_SPECS[typeB].orderOfDrawRank
    );

    const createdTubes = [];

    for (const [tubeType, group] of sortedEntries) {
      const spec = CLSI_TUBE_SPECS[tubeType];
      const primaryBarcode = await this.generatePrimaryTubeBarcode();
      const rawRequiredVol = spec.baseDeadVolumeMl + group.testCodes.length * spec.volumePerTestMl;
      const requiredVolumeMl = Number(Math.min(spec.maxCapacityMl, rawRequiredVol).toFixed(2));

      const tube = await (prisma as any).specimenTube.create({
        data: {
          orderId: order.id,
          patientId: order.patientId,
          primaryBarcode,
          tubeType,
          additiveName: spec.additiveName,
          capColorHex: spec.capColorHex,
          orderOfDrawRank: spec.orderOfDrawRank,
          requiredVolumeMl,
          status: 'PENDING_COLLECTION',
          consolidatedTestCodes: group.testCodes,
          consolidatedOrderItems: group.orderItemIds,
        },
        include: {
          aliquots: true,
        },
      });

      createdTubes.push(tube);
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      patientName: `${order.patient?.firstName || ''} ${order.patient?.lastName || ''}`.trim(),
      totalTestsOrdered: orderItems.length,
      totalPhysicalTubes: createdTubes.length,
      barcodesSaved: Math.max(0, orderItems.length - createdTubes.length),
      tubes: createdTubes,
    };
  }

  /**
   * Phlebotomy Collection with Strict QNS (Quantity Not Sufficient) Guard.
   * For BLUE_CITRATE (Coagulation), enforces >= 90% fill ratio (9:1 blood-to-citrate).
   */
  public async recordTubeCollectionWithQnsGuard(input: CollectPhysicalTubeInput) {
    const tube = await (prisma as any).specimenTube.findUnique({
      where: { id: input.tubeId },
    });

    if (!tube) {
      throw new HttpError(`Specimen tube ${input.tubeId} not found`, 404);
    }

    const requiredVol = Number(tube.requiredVolumeMl);
    const collectedVol = Number(input.collectedVolumeMl);

    // Citrate tubes require strict 90% minimum volume to prevent false PT/APTT prolongation
    const minAcceptableVol =
      tube.tubeType === 'BLUE_CITRATE' ? Number((requiredVol * 0.9).toFixed(2)) : requiredVol;

    if (collectedVol < minAcceptableVol && !input.qnsOverrideReason) {
      await (prisma as any).specimenTube.update({
        where: { id: tube.id },
        data: {
          collectedVolumeMl: collectedVol,
          isQnsFlagged: true,
          status: 'REJECTED_QNS',
        },
      });

      throw new HttpError(
        `QNS_GUARD_TRIGGERED: Collected volume (${collectedVol} mL) is below minimum required volume (${minAcceptableVol} mL) for ${tube.tubeType} [${tube.primaryBarcode}]. Specimen rejected as Quantity Not Sufficient.`,
        422
      );
    }

    const updatedTube = await (prisma as any).specimenTube.update({
      where: { id: tube.id },
      data: {
        collectedVolumeMl: collectedVol,
        isQnsFlagged: collectedVol < minAcceptableVol,
        qnsOverrideReason: input.qnsOverrideReason || null,
        collectedByUserId: input.collectedByUserId,
        collectedAt: new Date(),
        status: 'COLLECTED',
      },
      include: { aliquots: true },
    });

    return updatedTube;
  }

  /**
   * Records centrifuge RPM, spin duration (minutes), decapping status, and HIL serum indices.
   * Standard SST / Citrate centrifugation: 3000-3500 RPM for 10-15 minutes.
   */
  public async recordCentrifugationAndDecapping(input: CentrifugeTubeInput) {
    const tube = await (prisma as any).specimenTube.findUnique({
      where: { id: input.tubeId },
    });

    if (!tube) {
      throw new HttpError(`Specimen tube ${input.tubeId} not found`, 404);
    }

    if (input.centrifugeSpeedRpm < 1000 || input.centrifugeSpeedRpm > 6000) {
      throw new HttpError('Centrifuge speed must be between 1000 RPM and 6000 RPM', 400);
    }

    if (input.centrifugeDurationMin < 3 || input.centrifugeDurationMin > 30) {
      throw new HttpError('Centrifuge duration must be between 3 and 30 minutes', 400);
    }

    const isGrosslyHemolyzed = (input.hemolysisIndex ?? 0) > 250;

    const updated = await (prisma as any).specimenTube.update({
      where: { id: tube.id },
      data: {
        centrifugeSpeedRpm: input.centrifugeSpeedRpm,
        centrifugeDurationMin: input.centrifugeDurationMin,
        centrifugedAt: new Date(),
        centrifugedByUserId: input.userId,
        isDecapped: input.isDecapped,
        decappedAt: input.isDecapped ? new Date() : null,
        hemolysisIndex: input.hemolysisIndex ?? 5.0,
        icterusIndex: input.icterusIndex ?? 0.8,
        lipemiaIndex: input.lipemiaIndex ?? 18.0,
        status: isGrosslyHemolyzed ? 'REJECTED_HEMOLYZED' : 'CENTRIFUGED_DECAPPED',
      },
      include: { aliquots: true },
    });

    return updated;
  }

  /**
   * Generates Secondary Aliquots (e.g. SMP-YYYYMMDD-XXXXX-A1, -A2) when a primary tube
   * (such as GOLD_SST) must be split across Biochemistry and Immunology analyzers.
   */
  public async generateSecondaryAliquots(input: SplitSecondaryAliquotsInput) {
    const parentTube = await (prisma as any).specimenTube.findUnique({
      where: { id: input.parentTubeId },
      include: { aliquots: true },
    });

    if (!parentTube) {
      throw new HttpError(`Parent tube ${input.parentTubeId} not found`, 404);
    }

    if (!parentTube.isDecapped && parentTube.tubeType !== 'YELLOW_URINE') {
      throw new HttpError(
        `Primary tube ${parentTube.primaryBarcode} must be centrifuged and decapped before secondary aliquoting.`,
        400
      );
    }

    // If explicit splits are not provided, auto-partition tests between BIOCHEMISTRY and IMMUNOLOGY
    let splitsToCreate = input.splits || [];
    if (splitsToCreate.length === 0) {
      const deptMap = new Map<
        AliquotTargetDepartment,
        { analyzerCode: string; codes: string[] }
      >();

      for (const code of parentTube.consolidatedTestCodes) {
        const resolved = this.resolveDepartmentForSerumTest(code, code);
        const existing = deptMap.get(resolved.department) || {
          analyzerCode: resolved.analyzerCode,
          codes: [],
        };
        existing.codes.push(code);
        deptMap.set(resolved.department, existing);
      }

      const availableSerumMl = Number(parentTube.collectedVolumeMl || parentTube.requiredVolumeMl) * 0.55;
      const totalDepts = Math.max(1, deptMap.size);
      const volPerAliquot = Number(Math.max(0.5, availableSerumMl / totalDepts).toFixed(2));

      splitsToCreate = Array.from(deptMap.entries()).map(([targetDepartment, info]) => ({
        targetDepartment,
        targetAnalyzerCode: info.analyzerCode,
        allocatedVolumeMl: volPerAliquot,
        assignedTestCodes: info.codes,
      }));
    }

    const existingCount = parentTube.aliquots.length;
    const createdAliquots = [];

    for (let i = 0; i < splitsToCreate.length; i++) {
      const split = splitsToCreate[i];
      const aliquotIndex = existingCount + i + 1;
      const aliquotSuffix = `A${aliquotIndex}`;
      const aliquotBarcode = `${parentTube.primaryBarcode}-${aliquotSuffix}`;

      const aliquot = await (prisma as any).specimenAliquot.create({
        data: {
          parentTubeId: parentTube.id,
          orderId: parentTube.orderId,
          aliquotBarcode,
          aliquotSuffix,
          targetDepartment: split.targetDepartment,
          targetAnalyzerCode: split.targetAnalyzerCode,
          allocatedVolumeMl: split.allocatedVolumeMl,
          assignedTestCodes: split.assignedTestCodes,
          status: 'ALIQUOTED',
          createdByUserId: input.userId,
        },
      });

      createdAliquots.push(aliquot);
    }

    await (prisma as any).specimenTube.update({
      where: { id: parentTube.id },
      data: { status: 'ALIQUOTED' },
    });

    return {
      parentBarcode: parentTube.primaryBarcode,
      aliquotsCreated: createdAliquots.length,
      aliquots: createdAliquots,
    };
  }

  /**
   * Lists all active physical tubes and secondary aliquots for the Phlebotomy & Accessioning Desk.
   */
  public async listActiveTubes(statusFilter?: string) {
    const whereClause: Record<string, unknown> = {};
    if (statusFilter && statusFilter !== 'ALL') {
      whereClause.status = statusFilter;
    }

    const tubes = await (prisma as any).specimenTube.findMany({
      where: whereClause,
      include: {
        aliquots: true,
      },
      orderBy: [{ createdAt: 'desc' }, { orderOfDrawRank: 'asc' }],
      take: 100,
    });

    return tubes;
  }
}

export const vacutainerConsolidationService = new VacutainerConsolidationService();
