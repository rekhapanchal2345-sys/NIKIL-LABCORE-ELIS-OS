import { randomUUID } from 'crypto';
import prisma from '../../../config/database';
import { HttpError } from '../../utils/http-error';

export type ReagentLotStatus =
  | 'ACTIVE_ON_BOARD'
  | 'STANDBY_REFRIGERATED'
  | 'DEPLETED'
  | 'EXPIRED'
  | 'STABILITY_BREACHED'
  | 'QUARANTINED';

export interface RegisterReagentLotInput {
  reagentCode: string;
  reagentName: string;
  manufacturer: string;
  analyzerModel: string;
  packSizeVolume: number;
  onBoardStabilityDays: number;
  minimumStockAlertVol: number;
  lotNumber: string;
  expiryDate: string; // ISO date
  openedOnCarouselAt?: string;
  calibratorFactor: number;
  initialVolumeMl: number;
  kitPurchaseCostInr: number;
  calibratorCostPerTest: number;
}

export interface ExecuteTestRecipeConsumptionInput {
  testCode: string;
  orderId?: string;
  sampleBarcode?: string;
  executedByUserId?: string;
}

export interface ReagentAlarmItem {
  lotId: string;
  reagentCode: string;
  reagentName: string;
  analyzerModel: string;
  lotNumber: string;
  alarmType: 'LOT_EXPIRED' | 'ON_BOARD_STABILITY_BREACHED' | 'LOW_VOLUME_STOCKOUT_RISK';
  severity: 'CRITICAL_INTERLOCK' | 'WARNING';
  details: string;
  remainingVolumeMl: number;
  daysOnBoard: number | null;
  maxStabilityDays: number;
  expiryDate: string;
}

export interface TestCptProfitabilityReport {
  testCode: string;
  testName: string;
  sellingPriceB2CInr: number;
  sellingPriceB2BInr: number;
  reagentBreakdown: Array<{
    reagentCode: string;
    reagentName: string;
    activeLotNumber: string;
    volumePerTestMl: number;
    costPerMlInr: number;
    reagentCostPerTestInr: number;
    calibratorAmortizationInr: number;
    consumableCostInr: number;
    cuvettesCount: number;
    pipetteTipsCount: number;
  }>;
  totalReagentCostInr: number;
  totalCalibratorCostInr: number;
  totalConsumableOverheadInr: number;
  totalCostPerTestInr: number;
  netMarginB2CInr: number;
  netGrossMarginB2CPercent: number;
  netMarginB2BInr: number;
  netGrossMarginB2BPercent: number;
}

export class ReagentCptService {
  private schemaReady = false;

  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "reagent_masters" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "reagent_code" TEXT NOT NULL UNIQUE,
        "reagent_name" TEXT NOT NULL,
        "manufacturer" TEXT NOT NULL,
        "analyzer_model" TEXT NOT NULL,
        "unit_of_measure" TEXT NOT NULL DEFAULT 'mL',
        "pack_size_volume" NUMERIC(10,2) NOT NULL,
        "on_board_stability_days" INTEGER NOT NULL,
        "minimum_stock_alert_vol" NUMERIC(10,2) NOT NULL,
        "storage_temp_range" TEXT NOT NULL DEFAULT '2°C - 8°C',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "reagent_lots" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "reagent_master_id" TEXT NOT NULL REFERENCES "reagent_masters"("id") ON DELETE CASCADE,
        "lot_number" TEXT NOT NULL,
        "expiry_date" TIMESTAMP(3) NOT NULL,
        "opened_on_carousel_at" TIMESTAMP(3),
        "calibrator_factor" NUMERIC(8,4) NOT NULL DEFAULT 1.0000,
        "initial_volume_ml" NUMERIC(10,3) NOT NULL,
        "remaining_volume_ml" NUMERIC(10,3) NOT NULL,
        "kit_purchase_cost_inr" NUMERIC(12,2) NOT NULL,
        "calibrator_cost_per_test" NUMERIC(8,2) NOT NULL DEFAULT 4.50,
        "status" TEXT NOT NULL DEFAULT 'STANDBY_REFRIGERATED',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("reagent_master_id", "lot_number")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "test_reagent_recipes" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "test_id" TEXT NOT NULL,
        "test_code" TEXT NOT NULL,
        "test_name" TEXT NOT NULL,
        "reagent_master_id" TEXT NOT NULL REFERENCES "reagent_masters"("id") ON DELETE CASCADE,
        "volume_per_test_ml" NUMERIC(8,4) NOT NULL,
        "reaction_cuvettes_count" INTEGER NOT NULL DEFAULT 1,
        "pipette_tips_count" INTEGER NOT NULL DEFAULT 1,
        "consumable_overhead_inr" NUMERIC(8,2) NOT NULL DEFAULT 3.25,
        UNIQUE("test_code", "reagent_master_id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "reagent_consumption_logs" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "reagent_lot_id" TEXT NOT NULL REFERENCES "reagent_lots"("id") ON DELETE CASCADE,
        "test_code" TEXT NOT NULL,
        "order_id" TEXT,
        "sample_barcode" TEXT,
        "volume_consumed_ml" NUMERIC(8,4) NOT NULL,
        "cuvettes_used" INTEGER NOT NULL,
        "tips_used" INTEGER NOT NULL,
        "computed_reagent_cost_inr" NUMERIC(10,2) NOT NULL,
        "consumed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "consumed_by_user_id" TEXT
      );
    `);

    this.schemaReady = true;
  }

  /**
   * Registers or updates a Reagent Master & Lot on the analyzer carousel.
   */
  public async registerReagentLot(input: RegisterReagentLotInput) {
    await this.ensureSchema();

    const masterRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT "id" FROM "reagent_masters" WHERE "reagent_code" = $1 LIMIT 1`,
      input.reagentCode
    );

    let masterId = masterRows[0]?.id;
    if (!masterId) {
      masterId = randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO "reagent_masters" (
          "id", "reagent_code", "reagent_name", "manufacturer", "analyzer_model",
          "unit_of_measure", "pack_size_volume", "on_board_stability_days", "minimum_stock_alert_vol"
        ) VALUES ($1, $2, $3, $4, $5, 'mL', $6, $7, $8)`,
        masterId,
        input.reagentCode,
        input.reagentName,
        input.manufacturer,
        input.analyzerModel,
        input.packSizeVolume,
        input.onBoardStabilityDays,
        input.minimumStockAlertVol
      );
    }

    const lotId = randomUUID();
    const openedDate = input.openedOnCarouselAt ? new Date(input.openedOnCarouselAt) : new Date();
    const expiryDate = new Date(input.expiryDate);

    await prisma.$executeRawUnsafe(
      `INSERT INTO "reagent_lots" (
        "id", "reagent_master_id", "lot_number", "expiry_date", "opened_on_carousel_at",
        "calibrator_factor", "initial_volume_ml", "remaining_volume_ml",
        "kit_purchase_cost_inr", "calibrator_cost_per_test", "status", "created_at", "updated_at"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9, 'ACTIVE_ON_BOARD', NOW(), NOW())
      ON CONFLICT ("reagent_master_id", "lot_number")
      DO UPDATE SET
        "expiry_date" = EXCLUDED."expiry_date",
        "calibrator_factor" = EXCLUDED."calibrator_factor",
        "remaining_volume_ml" = EXCLUDED."remaining_volume_ml",
        "kit_purchase_cost_inr" = EXCLUDED."kit_purchase_cost_inr",
        "status" = 'ACTIVE_ON_BOARD',
        "updated_at" = NOW()`,
      lotId,
      masterId,
      input.lotNumber,
      expiryDate,
      openedDate,
      input.calibratorFactor,
      input.initialVolumeMl,
      input.kitPurchaseCostInr,
      input.calibratorCostPerTest
    );

    return this.getInventoryOverview();
  }

  /**
   * Evaluates analyzer interlocks (Lot Expiry, On-Board Refrigerated Carousel Stability, Volume)
   * and executes automated recipe volume & cuvette/tip decrement in an atomic transaction.
   */
  public async consumeReagentsForTestExecution(input: ExecuteTestRecipeConsumptionInput) {
    await this.ensureSchema();
    await this.ensureSeededInventory();

    const recipes = await prisma.$queryRawUnsafe<
      Array<{
        recipeId: string;
        testCode: string;
        testName: string;
        reagentMasterId: string;
        reagentCode: string;
        reagentName: string;
        analyzerModel: string;
        onBoardStabilityDays: number;
        volumePerTestMl: number;
        reactionCuvettesCount: number;
        pipetteTipsCount: number;
        consumableOverheadInr: number;
      }>
    >(
      `SELECT
        r."id" AS "recipeId",
        r."test_code" AS "testCode",
        r."test_name" AS "testName",
        r."reagent_master_id" AS "reagentMasterId",
        m."reagent_code" AS "reagentCode",
        m."reagent_name" AS "reagentName",
        m."analyzer_model" AS "analyzerModel",
        m."on_board_stability_days" AS "onBoardStabilityDays",
        r."volume_per_test_ml"::FLOAT AS "volumePerTestMl",
        r."reaction_cuvettes_count" AS "reactionCuvettesCount",
        r."pipette_tips_count" AS "pipetteTipsCount",
        r."consumable_overhead_inr"::FLOAT AS "consumableOverheadInr"
       FROM "test_reagent_recipes" r
       INNER JOIN "reagent_masters" m ON m."id" = r."reagent_master_id"
       WHERE UPPER(r."test_code") = UPPER($1)`,
      input.testCode
    );

    if (recipes.length === 0) {
      throw new HttpError(404, `No reagent consumption recipe configured for test code '${input.testCode}'`);
    }

    const now = new Date();
    const consumptionEvents: Array<{
      reagentCode: string;
      reagentName: string;
      lotNumber: string;
      volumeConsumedMl: number;
      remainingVolumeAfterMl: number;
      cuvettesUsed: number;
      tipsUsed: number;
      reagentCostInr: number;
    }> = [];

    await prisma.$transaction(async (tx) => {
      for (const item of recipes) {
        const lots = await tx.$queryRawUnsafe<
          Array<{
            id: string;
            lotNumber: string;
            expiryDate: Date;
            openedOnCarouselAt: Date | null;
            initialVolumeMl: number;
            remainingVolumeMl: number;
            kitPurchaseCostInr: number;
            status: string;
          }>
        >(
          `SELECT
            "id",
            "lot_number" AS "lotNumber",
            "expiry_date" AS "expiryDate",
            "opened_on_carousel_at" AS "openedOnCarouselAt",
            "initial_volume_ml"::FLOAT AS "initialVolumeMl",
            "remaining_volume_ml"::FLOAT AS "remainingVolumeMl",
            "kit_purchase_cost_inr"::FLOAT AS "kitPurchaseCostInr",
            "status"
           FROM "reagent_lots"
           WHERE "reagent_master_id" = $1
             AND "status" = 'ACTIVE_ON_BOARD'
           ORDER BY "expiry_date" ASC
           LIMIT 1`,
          item.reagentMasterId
        );

        if (lots.length === 0) {
          throw new HttpError(
            409,
            `ANALYZER INTERLOCK ALARM: Stockout for reagent '${item.reagentName}' (${item.reagentCode}) on ${item.analyzerModel}. No ACTIVE_ON_BOARD lot available.`
          );
        }

        const activeLot = lots[0];

        // 1. Check Expiry Date Interlock
        if (new Date(activeLot.expiryDate).getTime() <= now.getTime()) {
          await tx.$executeRawUnsafe(
            `UPDATE "reagent_lots" SET "status" = 'EXPIRED', "updated_at" = NOW() WHERE "id" = $1`,
            activeLot.id
          );
          throw new HttpError(
            409,
            `ANALYZER INTERLOCK ALARM: Reagent lot '${activeLot.lotNumber}' for '${item.reagentName}' expired on ${new Date(activeLot.expiryDate).toISOString().slice(0, 10)}. Run blocked.`
          );
        }

        // 2. Check On-Board Refrigerated Carousel Stability Interlock
        if (activeLot.openedOnCarouselAt) {
          const daysOnBoard =
            (now.getTime() - new Date(activeLot.openedOnCarouselAt).getTime()) /
            (1000 * 60 * 60 * 24);
          if (daysOnBoard > item.onBoardStabilityDays) {
            await tx.$executeRawUnsafe(
              `UPDATE "reagent_lots" SET "status" = 'STABILITY_BREACHED', "updated_at" = NOW() WHERE "id" = $1`,
              activeLot.id
            );
            throw new HttpError(
              409,
              `ANALYZER INTERLOCK ALARM: On-board refrigerated carousel stability breached for '${item.reagentName}' Lot ${activeLot.lotNumber} (${daysOnBoard.toFixed(1)} days open > ${item.onBoardStabilityDays} days max). Run blocked.`
            );
          }
        }

        // 3. Check Sufficient Volume Interlock
        if (activeLot.remainingVolumeMl < item.volumePerTestMl) {
          await tx.$executeRawUnsafe(
            `UPDATE "reagent_lots" SET "status" = 'DEPLETED', "updated_at" = NOW() WHERE "id" = $1`,
            activeLot.id
          );
          throw new HttpError(
            409,
            `ANALYZER INTERLOCK ALARM: Insufficient reagent volume for '${item.reagentName}' Lot ${activeLot.lotNumber} (Required: ${item.volumePerTestMl} mL, Remaining: ${activeLot.remainingVolumeMl} mL).`
          );
        }

        const nextRemainingMl = Number((activeLot.remainingVolumeMl - item.volumePerTestMl).toFixed(4));
        const costPerMl = activeLot.kitPurchaseCostInr / Math.max(activeLot.initialVolumeMl, 1);
        const reagentCostInr = Number((costPerMl * item.volumePerTestMl).toFixed(2));

        await tx.$executeRawUnsafe(
          `UPDATE "reagent_lots"
           SET "remaining_volume_ml" = $1,
               "status" = CASE WHEN $1 <= 0 THEN 'DEPLETED' ELSE 'ACTIVE_ON_BOARD' END,
               "updated_at" = NOW()
           WHERE "id" = $2`,
          nextRemainingMl,
          activeLot.id
        );

        await tx.$executeRawUnsafe(
          `INSERT INTO "reagent_consumption_logs" (
            "id", "reagent_lot_id", "test_code", "order_id", "sample_barcode",
            "volume_consumed_ml", "cuvettes_used", "tips_used", "computed_reagent_cost_inr",
            "consumed_at", "consumed_by_user_id"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)`,
          randomUUID(),
          activeLot.id,
          item.testCode,
          input.orderId ?? null,
          input.sampleBarcode ?? null,
          item.volumePerTestMl,
          item.reactionCuvettesCount,
          item.pipetteTipsCount,
          reagentCostInr,
          input.executedByUserId ?? null
        );

        consumptionEvents.push({
          reagentCode: item.reagentCode,
          reagentName: item.reagentName,
          lotNumber: activeLot.lotNumber,
          volumeConsumedMl: item.volumePerTestMl,
          remainingVolumeAfterMl: nextRemainingMl,
          cuvettesUsed: item.reactionCuvettesCount,
          tipsUsed: item.pipetteTipsCount,
          reagentCostInr,
        });
      }
    });

    return {
      executedAt: now.toISOString(),
      testCode: recipes[0].testCode,
      testName: recipes[0].testName,
      orderId: input.orderId ?? null,
      sampleBarcode: input.sampleBarcode ?? null,
      totalItemsDecremented: consumptionEvents.length,
      consumptionEvents,
    };
  }

  /**
   * Computes Cost-Per-Test (CPT) & Net Gross Margin % across tests/panels.
   * Formula: CPT = Reagent Cost + Calibrator Amortization + Consumable Overhead (Cuvettes/Tips)
   */
  public async calculateCptProfitabilityMatrix(): Promise<TestCptProfitabilityReport[]> {
    await this.ensureSchema();
    await this.ensureSeededInventory();

    const rows = await prisma.$queryRawUnsafe<
      Array<{
        testCode: string;
        testName: string;
        volumePerTestMl: number;
        reactionCuvettesCount: number;
        pipetteTipsCount: number;
        consumableOverheadInr: number;
        reagentCode: string;
        reagentName: string;
        lotNumber: string;
        initialVolumeMl: number;
        kitPurchaseCostInr: number;
        calibratorCostPerTest: number;
      }>
    >(
      `SELECT
        r."test_code" AS "testCode",
        r."test_name" AS "testName",
        r."volume_per_test_ml"::FLOAT AS "volumePerTestMl",
        r."reaction_cuvettes_count" AS "reactionCuvettesCount",
        r."pipette_tips_count" AS "pipetteTipsCount",
        r."consumable_overhead_inr"::FLOAT AS "consumableOverheadInr",
        m."reagent_code" AS "reagentCode",
        m."reagent_name" AS "reagentName",
        COALESCE(l."lot_number", 'UNASSIGNED') AS "lotNumber",
        COALESCE(l."initial_volume_ml"::FLOAT, m."pack_size_volume"::FLOAT) AS "initialVolumeMl",
        COALESCE(l."kit_purchase_cost_inr"::FLOAT, 4500.0) AS "kitPurchaseCostInr",
        COALESCE(l."calibrator_cost_per_test"::FLOAT, 4.50) AS "calibratorCostPerTest"
       FROM "test_reagent_recipes" r
       INNER JOIN "reagent_masters" m ON m."id" = r."reagent_master_id"
       LEFT JOIN LATERAL (
         SELECT * FROM "reagent_lots" rl
         WHERE rl."reagent_master_id" = m."id"
         ORDER BY CASE WHEN rl."status" = 'ACTIVE_ON_BOARD' THEN 0 ELSE 1 END, rl."expiry_date" DESC
         LIMIT 1
       ) l ON TRUE
       ORDER BY r."test_code" ASC, m."reagent_code" ASC`
    );

    const tariffLookup: Record<string, { b2c: number; b2b: number }> = {
      LIPID: { b2c: 850, b2b: 480 },
      LFT: { b2c: 750, b2b: 420 },
      KFT: { b2c: 650, b2b: 360 },
      TSH: { b2c: 550, b2b: 290 },
      HBA1C: { b2c: 600, b2b: 340 },
    };

    const grouped = new Map<string, TestCptProfitabilityReport>();

    for (const row of rows) {
      if (!grouped.has(row.testCode)) {
        const prices = tariffLookup[row.testCode] ?? { b2c: 700, b2b: 420 };
        grouped.set(row.testCode, {
          testCode: row.testCode,
          testName: row.testName,
          sellingPriceB2CInr: prices.b2c,
          sellingPriceB2BInr: prices.b2b,
          reagentBreakdown: [],
          totalReagentCostInr: 0,
          totalCalibratorCostInr: 0,
          totalConsumableOverheadInr: 0,
          totalCostPerTestInr: 0,
          netMarginB2CInr: 0,
          netGrossMarginB2CPercent: 0,
          netMarginB2BInr: 0,
          netGrossMarginB2BPercent: 0,
        });
      }

      const report = grouped.get(row.testCode)!;
      const costPerMl = row.kitPurchaseCostInr / Math.max(row.initialVolumeMl, 1);
      const reagentCostPerTestInr = Number((costPerMl * row.volumePerTestMl).toFixed(2));

      report.reagentBreakdown.push({
        reagentCode: row.reagentCode,
        reagentName: row.reagentName,
        activeLotNumber: row.lotNumber,
        volumePerTestMl: row.volumePerTestMl,
        costPerMlInr: Number(costPerMl.toFixed(2)),
        reagentCostPerTestInr,
        calibratorAmortizationInr: row.calibratorCostPerTest,
        consumableCostInr: row.consumableOverheadInr,
        cuvettesCount: row.reactionCuvettesCount,
        pipetteTipsCount: row.pipetteTipsCount,
      });

      report.totalReagentCostInr = Number(
        (report.totalReagentCostInr + reagentCostPerTestInr).toFixed(2)
      );
      report.totalCalibratorCostInr = Number(
        (report.totalCalibratorCostInr + row.calibratorCostPerTest).toFixed(2)
      );
      report.totalConsumableOverheadInr = Number(
        (report.totalConsumableOverheadInr + row.consumableOverheadInr).toFixed(2)
      );
    }

    for (const report of grouped.values()) {
      report.totalCostPerTestInr = Number(
        (
          report.totalReagentCostInr +
          report.totalCalibratorCostInr +
          report.totalConsumableOverheadInr
        ).toFixed(2)
      );
      report.netMarginB2CInr = Number(
        (report.sellingPriceB2CInr - report.totalCostPerTestInr).toFixed(2)
      );
      report.netGrossMarginB2CPercent = Number(
        ((report.netMarginB2CInr / Math.max(report.sellingPriceB2CInr, 1)) * 100).toFixed(2)
      );
      report.netMarginB2BInr = Number(
        (report.sellingPriceB2BInr - report.totalCostPerTestInr).toFixed(2)
      );
      report.netGrossMarginB2BPercent = Number(
        ((report.netMarginB2BInr / Math.max(report.sellingPriceB2BInr, 1)) * 100).toFixed(2)
      );
    }

    return Array.from(grouped.values());
  }

  /**
   * Returns full Reagent Inventory status, active alarms, and CPT profitability summary.
   */
  public async getInventoryOverview() {
    await this.ensureSchema();
    await this.ensureSeededInventory();

    const lots = await prisma.$queryRawUnsafe<
      Array<{
        lotId: string;
        reagentMasterId: string;
        reagentCode: string;
        reagentName: string;
        manufacturer: string;
        analyzerModel: string;
        onBoardStabilityDays: number;
        minimumStockAlertVol: number;
        lotNumber: string;
        expiryDate: Date;
        openedOnCarouselAt: Date | null;
        calibratorFactor: number;
        initialVolumeMl: number;
        remainingVolumeMl: number;
        kitPurchaseCostInr: number;
        calibratorCostPerTest: number;
        status: string;
      }>
    >(
      `SELECT
        l."id" AS "lotId",
        m."id" AS "reagentMasterId",
        m."reagent_code" AS "reagentCode",
        m."reagent_name" AS "reagentName",
        m."manufacturer",
        m."analyzer_model" AS "analyzerModel",
        m."on_board_stability_days" AS "onBoardStabilityDays",
        m."minimum_stock_alert_vol"::FLOAT AS "minimumStockAlertVol",
        l."lot_number" AS "lotNumber",
        l."expiry_date" AS "expiryDate",
        l."opened_on_carousel_at" AS "openedOnCarouselAt",
        l."calibrator_factor"::FLOAT AS "calibratorFactor",
        l."initial_volume_ml"::FLOAT AS "initialVolumeMl",
        l."remaining_volume_ml"::FLOAT AS "remainingVolumeMl",
        l."kit_purchase_cost_inr"::FLOAT AS "kitPurchaseCostInr",
        l."calibrator_cost_per_test"::FLOAT AS "calibratorCostPerTest",
        l."status"
       FROM "reagent_lots" l
       INNER JOIN "reagent_masters" m ON m."id" = l."reagent_master_id"
       ORDER BY m."reagent_code" ASC`
    );

    const now = new Date();
    const alarms: ReagentAlarmItem[] = [];

    const enrichedLots = lots.map((lot) => {
      const daysOnBoard = lot.openedOnCarouselAt
        ? Number(
            ((now.getTime() - new Date(lot.openedOnCarouselAt).getTime()) / (1000 * 60 * 60 * 24)).toFixed(1)
          )
        : null;

      const isExpired = new Date(lot.expiryDate).getTime() <= now.getTime();
      const isStabilityBreached =
        daysOnBoard !== null && daysOnBoard > lot.onBoardStabilityDays;
      const isLowStock = lot.remainingVolumeMl <= lot.minimumStockAlertVol;

      if (isExpired) {
        alarms.push({
          lotId: lot.lotId,
          reagentCode: lot.reagentCode,
          reagentName: lot.reagentName,
          analyzerModel: lot.analyzerModel,
          lotNumber: lot.lotNumber,
          alarmType: 'LOT_EXPIRED',
          severity: 'CRITICAL_INTERLOCK',
          details: `Reagent Lot ${lot.lotNumber} expired on ${new Date(lot.expiryDate).toISOString().slice(0, 10)}. Analyzer execution locked.`,
          remainingVolumeMl: lot.remainingVolumeMl,
          daysOnBoard,
          maxStabilityDays: lot.onBoardStabilityDays,
          expiryDate: new Date(lot.expiryDate).toISOString(),
        });
      }

      if (isStabilityBreached) {
        alarms.push({
          lotId: lot.lotId,
          reagentCode: lot.reagentCode,
          reagentName: lot.reagentName,
          analyzerModel: lot.analyzerModel,
          lotNumber: lot.lotNumber,
          alarmType: 'ON_BOARD_STABILITY_BREACHED',
          severity: 'CRITICAL_INTERLOCK',
          details: `On-board carousel stability exceeded (${daysOnBoard}d > ${lot.onBoardStabilityDays}d max). Recalibration / new kit required.`,
          remainingVolumeMl: lot.remainingVolumeMl,
          daysOnBoard,
          maxStabilityDays: lot.onBoardStabilityDays,
          expiryDate: new Date(lot.expiryDate).toISOString(),
        });
      }

      if (isLowStock) {
        alarms.push({
          lotId: lot.lotId,
          reagentCode: lot.reagentCode,
          reagentName: lot.reagentName,
          analyzerModel: lot.analyzerModel,
          lotNumber: lot.lotNumber,
          alarmType: 'LOW_VOLUME_STOCKOUT_RISK',
          severity: 'WARNING',
          details: `Remaining volume (${lot.remainingVolumeMl} mL) is below minimum threshold (${lot.minimumStockAlertVol} mL).`,
          remainingVolumeMl: lot.remainingVolumeMl,
          daysOnBoard,
          maxStabilityDays: lot.onBoardStabilityDays,
          expiryDate: new Date(lot.expiryDate).toISOString(),
        });
      }

      return {
        ...lot,
        daysOnBoard,
        isAnalyzerInterlockBlocked: isExpired || isStabilityBreached || lot.remainingVolumeMl <= 0,
      };
    });

    const recentLogs = await prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT
        c."id",
        c."test_code" AS "testCode",
        c."order_id" AS "orderId",
        c."sample_barcode" AS "sampleBarcode",
        c."volume_consumed_ml"::FLOAT AS "volumeConsumedMl",
        c."cuvettes_used" AS "cuvettesUsed",
        c."tips_used" AS "tipsUsed",
        c."computed_reagent_cost_inr"::FLOAT AS "computedReagentCostInr",
        c."consumed_at" AS "consumedAt",
        l."lot_number" AS "lotNumber",
        m."reagent_name" AS "reagentName"
       FROM "reagent_consumption_logs" c
       INNER JOIN "reagent_lots" l ON l."id" = c."reagent_lot_id"
       INNER JOIN "reagent_masters" m ON m."id" = l."reagent_master_id"
       ORDER BY c."consumed_at" DESC
       LIMIT 20`
    );

    const cptProfitability = await this.calculateCptProfitabilityMatrix();

    return {
      reagentLots: enrichedLots,
      activeAlarms: alarms,
      cptProfitability,
      recentConsumptionLogs: recentLogs,
    };
  }

  private async ensureSeededInventory(): Promise<void> {
    const existing = await prisma.$queryRawUnsafe<Array<{ cnt: number }>>(
      `SELECT COUNT(*)::INT AS cnt FROM "reagent_masters"`
    );
    if ((existing[0]?.cnt ?? 0) > 0) return;

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const seedReagents = [
      {
        code: 'RGT-CHOL-R1',
        name: 'Cholesterol CHOD-PAP Reagent',
        manufacturer: 'Roche Diagnostics',
        analyzer: 'Cobas c503',
        packVol: 250,
        stabilityDays: 28,
        minAlert: 30,
        lot: 'LOT-CHOL-8821',
        expiry: new Date(now + 120 * dayMs).toISOString(),
        opened: new Date(now - 9 * dayMs).toISOString(),
        calFactor: 1.0125,
        initVol: 250,
        costInr: 6250,
        calCost: 3.5,
      },
      {
        code: 'RGT-TRIG-R1',
        name: 'Triglycerides GPO-PAP Reagent',
        manufacturer: 'Roche Diagnostics',
        analyzer: 'Cobas c503',
        packVol: 250,
        stabilityDays: 28,
        minAlert: 30,
        lot: 'LOT-TRIG-8840',
        expiry: new Date(now + 95 * dayMs).toISOString(),
        opened: new Date(now - 12 * dayMs).toISOString(),
        calFactor: 0.9985,
        initVol: 250,
        costInr: 7500,
        calCost: 4.0,
      },
      {
        code: 'RGT-HDL-D',
        name: 'HDL-Cholesterol Direct Gen.4',
        manufacturer: 'Roche Diagnostics',
        analyzer: 'Cobas c503',
        packVol: 180,
        stabilityDays: 21,
        minAlert: 25,
        lot: 'LOT-HDL-9102',
        expiry: new Date(now + 80 * dayMs).toISOString(),
        opened: new Date(now - 6 * dayMs).toISOString(),
        calFactor: 1.004,
        initVol: 180,
        costInr: 9900,
        calCost: 5.5,
      },
      {
        code: 'RGT-TSH-ECLIA',
        name: 'Elecsys TSH Immunoassay Pack',
        manufacturer: 'Roche Diagnostics',
        analyzer: 'Cobas e801',
        packVol: 100,
        stabilityDays: 30,
        minAlert: 20,
        lot: 'LOT-TSH-4409',
        expiry: new Date(now + 60 * dayMs).toISOString(),
        opened: new Date(now - 34 * dayMs).toISOString(), // Breached on-board stability!
        calFactor: 1.021,
        initVol: 100,
        costInr: 8800,
        calCost: 6.25,
      },
    ];

    for (const s of seedReagents) {
      await this.registerReagentLot({
        reagentCode: s.code,
        reagentName: s.name,
        manufacturer: s.manufacturer,
        analyzerModel: s.analyzer,
        packSizeVolume: s.packVol,
        onBoardStabilityDays: s.stabilityDays,
        minimumStockAlertVol: s.minAlert,
        lotNumber: s.lot,
        expiryDate: s.expiry,
        openedOnCarouselAt: s.opened,
        calibratorFactor: s.calFactor,
        initialVolumeMl: s.initVol,
        kitPurchaseCostInr: s.costInr,
        calibratorCostPerTest: s.calCost,
      });
    }

    const masters = await prisma.$queryRawUnsafe<Array<{ id: string; code: string }>>(
      `SELECT "id", "reagent_code" AS "code" FROM "reagent_masters"`
    );
    const byCode = new Map(masters.map((m) => [m.code, m.id]));

    const lipidRecipes = [
      {
        reagentCode: 'RGT-CHOL-R1',
        vol: 0.2,
        cuvettes: 1,
        tips: 1,
        overhead: 3.0,
      },
      {
        reagentCode: 'RGT-TRIG-R1',
        vol: 0.2,
        cuvettes: 1,
        tips: 1,
        overhead: 3.0,
      },
      {
        reagentCode: 'RGT-HDL-D',
        vol: 0.15,
        cuvettes: 1,
        tips: 1,
        overhead: 3.5,
      },
    ];

    for (const rec of lipidRecipes) {
      const mId = byCode.get(rec.reagentCode);
      if (mId) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "test_reagent_recipes" (
            "id", "test_id", "test_code", "test_name", "reagent_master_id",
            "volume_per_test_ml", "reaction_cuvettes_count", "pipette_tips_count", "consumable_overhead_inr"
          ) VALUES ($1, 'TST-LIPID-01', 'LIPID', 'Complete Lipid Profile Panel', $2, $3, $4, $5, $6)
          ON CONFLICT ("test_code", "reagent_master_id") DO NOTHING`,
          randomUUID(),
          mId,
          rec.vol,
          rec.cuvettes,
          rec.tips,
          rec.overhead
        );
      }
    }

    const tshMasterId = byCode.get('RGT-TSH-ECLIA');
    if (tshMasterId) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "test_reagent_recipes" (
          "id", "test_id", "test_code", "test_name", "reagent_master_id",
          "volume_per_test_ml", "reaction_cuvettes_count", "pipette_tips_count", "consumable_overhead_inr"
        ) VALUES ($1, 'TST-TSH-01', 'TSH', 'Thyroid Stimulating Hormone (Ultrasensitive ECLIA)', $2, 0.12, 1, 2, 5.50)
        ON CONFLICT ("test_code", "reagent_master_id") DO NOTHING`,
        randomUUID(),
        tshMasterId
      );
    }
  }
}

export const reagentCptService = new ReagentCptService();
