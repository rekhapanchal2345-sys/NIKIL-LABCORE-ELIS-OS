import { randomUUID } from 'crypto';
import prisma from '../../../config/database';
import { HttpError } from '../../utils/http-error';

export interface CreateB2BOrderRequisitionInput {
  partnerId: string;
  patientName: string;
  orderNumber: string;
  testCodes: string[];
  retailTariffTotalInr: number;
  createdByUserId?: string;
}

export interface WalletTopupInput {
  partnerId: string;
  amountInr: number;
  transactionRef: string;
  remarks: string;
  createdByUserId?: string;
}

export interface CreateManifestTubeItemInput {
  tubeBarcode: string;
  sampleId?: string;
  orderNumber: string;
  patientName: string;
  vacutainerType: string;
}

export interface GenerateConsignmentManifestInput {
  partnerId: string;
  tamperSealNumber: string;
  courierRunnerName: string;
  courierRunnerPhone: string;
  departureTempCelsius: number;
  tubes: CreateManifestTubeItemInput[];
}

export interface HubReceiveManifestScanInput {
  manifestBarcode: string;
  arrivalTempCelsius: number;
  scannedTubeBarcodes: string[];
  receivedByHubUserId: string;
  discrepancyNotes?: string;
}

export class HubSpokeManifestService {
  private schemaReady = false;

  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "b2b_partner_spokes" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "partner_code" TEXT NOT NULL UNIQUE,
        "center_name" TEXT NOT NULL,
        "tier" TEXT NOT NULL DEFAULT 'GOLD_FRANCHISEE',
        "city" TEXT NOT NULL,
        "contact_person" TEXT NOT NULL,
        "contact_phone" TEXT NOT NULL,
        "wallet_balance_inr" NUMERIC(14,2) NOT NULL DEFAULT 0.00,
        "credit_limit_inr" NUMERIC(14,2) NOT NULL DEFAULT 25000.00,
        "discount_percentage" NUMERIC(5,2) NOT NULL DEFAULT 35.00,
        "is_booking_frozen" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "b2b_wallet_ledgers" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "partner_id" TEXT NOT NULL REFERENCES "b2b_partner_spokes"("id") ON DELETE CASCADE,
        "transaction_ref" TEXT NOT NULL UNIQUE,
        "transaction_type" TEXT NOT NULL,
        "amount_inr" NUMERIC(12,2) NOT NULL,
        "balance_before_inr" NUMERIC(14,2) NOT NULL,
        "balance_after_inr" NUMERIC(14,2) NOT NULL,
        "order_id" TEXT,
        "remarks" TEXT NOT NULL,
        "created_by_user_id" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "consignment_manifests" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "manifest_barcode" TEXT NOT NULL UNIQUE,
        "partner_id" TEXT NOT NULL REFERENCES "b2b_partner_spokes"("id") ON DELETE CASCADE,
        "tamper_seal_number" TEXT NOT NULL,
        "courier_runner_name" TEXT NOT NULL,
        "courier_runner_phone" TEXT NOT NULL,
        "departure_temp_celsius" NUMERIC(4,1) NOT NULL,
        "arrival_temp_celsius" NUMERIC(4,1),
        "expected_tube_count" INTEGER NOT NULL,
        "received_tube_count" INTEGER,
        "discrepancy_count" INTEGER NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'PACKED_AT_SPOKE',
        "dispatched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "received_at_hub_at" TIMESTAMP(3),
        "received_by_hub_user_id" TEXT,
        "discrepancy_notes" TEXT
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "consignment_manifest_items" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "manifest_id" TEXT NOT NULL REFERENCES "consignment_manifests"("id") ON DELETE CASCADE,
        "tube_barcode" TEXT NOT NULL,
        "sample_id" TEXT,
        "order_number" TEXT NOT NULL,
        "patient_name" TEXT NOT NULL,
        "vacutainer_type" TEXT NOT NULL,
        "is_scanned_at_hub" BOOLEAN NOT NULL DEFAULT false,
        "hub_scanned_at" TIMESTAMP(3),
        "condition_status" TEXT NOT NULL DEFAULT 'INTACT',
        UNIQUE("manifest_id", "tube_barcode")
      );
    `);

    this.schemaReady = true;
  }

  /**
   * Books a B2B Spoke Order with Tiered Partner Rate Discount and Instant Prepaid Wallet Debit.
   * Freezes booking if balance < -creditLimitInr.
   */
  public async bookB2BPartnerRequisition(input: CreateB2BOrderRequisitionInput) {
    await this.ensureSchema();
    await this.ensureSeededSpokes();

    return prisma.$transaction(async (tx) => {
      const partners = await tx.$queryRawUnsafe<
        Array<{
          id: string;
          partnerCode: string;
          centerName: string;
          tier: string;
          walletBalanceInr: number;
          creditLimitInr: number;
          discountPercentage: number;
          isBookingFrozen: boolean;
        }>
      >(
        `SELECT
          "id",
          "partner_code" AS "partnerCode",
          "center_name" AS "centerName",
          "tier",
          "wallet_balance_inr"::FLOAT AS "walletBalanceInr",
          "credit_limit_inr"::FLOAT AS "creditLimitInr",
          "discount_percentage"::FLOAT AS "discountPercentage",
          "is_booking_frozen" AS "isBookingFrozen"
         FROM "b2b_partner_spokes"
         WHERE "id" = $1
         FOR UPDATE`,
        input.partnerId
      );

      if (partners.length === 0) {
        throw new HttpError(404, `B2B Spoke Partner '${input.partnerId}' not found`);
      }

      const partner = partners[0];
      if (partner.isBookingFrozen) {
        throw new HttpError(
          403,
          `B2B BOOKING FROZEN: Partner '${partner.centerName}' (${partner.partnerCode}) account is frozen due to credit limit breach.`
        );
      }

      const b2bPartnerRateInr = Number(
        (input.retailTariffTotalInr * (1 - partner.discountPercentage / 100)).toFixed(2)
      );
      const balanceBefore = partner.walletBalanceInr;
      const balanceAfter = Number((balanceBefore - b2bPartnerRateInr).toFixed(2));
      const minAllowedBalance = -Math.abs(partner.creditLimitInr);

      if (balanceAfter < minAllowedBalance) {
        await tx.$executeRawUnsafe(
          `UPDATE "b2b_partner_spokes" SET "is_booking_frozen" = TRUE, "updated_at" = NOW() WHERE "id" = $1`,
          partner.id
        );
        throw new HttpError(
          402,
          `WALLET CREDIT LIMIT BREACHED: Booking requires ₹${b2bPartnerRateInr}. Current Wallet: ₹${balanceBefore}, Credit Limit: ₹${partner.creditLimitInr}. Partner booking has been frozen.`
        );
      }

      const shouldFreezeNext = balanceAfter < 0 && Math.abs(balanceAfter) >= partner.creditLimitInr;

      await tx.$executeRawUnsafe(
        `UPDATE "b2b_partner_spokes"
         SET "wallet_balance_inr" = $1,
             "is_booking_frozen" = $2,
             "updated_at" = NOW()
         WHERE "id" = $3`,
        balanceAfter,
        shouldFreezeNext,
        partner.id
      );

      const txRef = `TXN-DEBIT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const ledgerId = randomUUID();

      await tx.$executeRawUnsafe(
        `INSERT INTO "b2b_wallet_ledgers" (
          "id", "partner_id", "transaction_ref", "transaction_type",
          "amount_inr", "balance_before_inr", "balance_after_inr",
          "order_id", "remarks", "created_by_user_id", "created_at"
        ) VALUES ($1, $2, $3, 'DEBIT_ORDER_BOOKING', $4, $5, $6, $7, $8, $9, NOW())`,
        ledgerId,
        partner.id,
        txRef,
        b2bPartnerRateInr,
        balanceBefore,
        balanceAfter,
        input.orderNumber,
        `B2B Requisition ${input.orderNumber} (${input.patientName}) - Tests: ${input.testCodes.join(', ')} [Retail ₹${input.retailTariffTotalInr} -> B2B ₹${b2bPartnerRateInr}]`,
        input.createdByUserId ?? null
      );

      return {
        transactionRef: txRef,
        partnerCode: partner.partnerCode,
        centerName: partner.centerName,
        orderNumber: input.orderNumber,
        retailTariffTotalInr: input.retailTariffTotalInr,
        discountPercentage: partner.discountPercentage,
        b2bPartnerRateDebitedInr: b2bPartnerRateInr,
        balanceBeforeInr: balanceBefore,
        balanceAfterInr: balanceAfter,
        isLowBalanceWarning: balanceAfter < 0,
      };
    });
  }

  /**
   * Credits a B2B Partner Wallet and automatically unfreezes booking if balance recovers.
   */
  public async topupPartnerWallet(input: WalletTopupInput) {
    await this.ensureSchema();

    return prisma.$transaction(async (tx) => {
      const partners = await tx.$queryRawUnsafe<
        Array<{
          id: string;
          walletBalanceInr: number;
          creditLimitInr: number;
        }>
      >(
        `SELECT "id", "wallet_balance_inr"::FLOAT AS "walletBalanceInr", "credit_limit_inr"::FLOAT AS "creditLimitInr"
         FROM "b2b_partner_spokes"
         WHERE "id" = $1
         FOR UPDATE`,
        input.partnerId
      );

      if (partners.length === 0) {
        throw new HttpError(404, `B2B Spoke Partner '${input.partnerId}' not found`);
      }

      const partner = partners[0];
      const balanceBefore = partner.walletBalanceInr;
      const balanceAfter = Number((balanceBefore + input.amountInr).toFixed(2));
      const isFrozen = balanceAfter < -Math.abs(partner.creditLimitInr);

      await tx.$executeRawUnsafe(
        `UPDATE "b2b_partner_spokes"
         SET "wallet_balance_inr" = $1,
             "is_booking_frozen" = $2,
             "updated_at" = NOW()
         WHERE "id" = $3`,
        balanceAfter,
        isFrozen,
        partner.id
      );

      await tx.$executeRawUnsafe(
        `INSERT INTO "b2b_wallet_ledgers" (
          "id", "partner_id", "transaction_ref", "transaction_type",
          "amount_inr", "balance_before_inr", "balance_after_inr",
          "remarks", "created_by_user_id", "created_at"
        ) VALUES ($1, $2, $3, 'CREDIT_TOPUP', $4, $5, $6, $7, $8, NOW())`,
        randomUUID(),
        partner.id,
        input.transactionRef,
        input.amountInr,
        balanceBefore,
        balanceAfter,
        input.remarks,
        input.createdByUserId ?? null
      );

      return {
        partnerId: partner.id,
        transactionRef: input.transactionRef,
        creditedAmountInr: input.amountInr,
        balanceBeforeInr: balanceBefore,
        balanceAfterInr: balanceAfter,
        isBookingFrozen: isFrozen,
      };
    });
  }

  /**
   * Generates a Tamper-Evident Consignment Batch Manifest (`MNF-YYYYMMDD-XXXXX`)
   * with Cold-Chain Temperature Validation (2°C - 8°C).
   */
  public async generateConsignmentManifest(input: GenerateConsignmentManifestInput) {
    await this.ensureSchema();

    if (input.departureTempCelsius < 2.0 || input.departureTempCelsius > 8.0) {
      throw new HttpError(
        400,
        `COLD-CHAIN COMPLIANCE REJECTION: Departure temperature (${input.departureTempCelsius}°C) is outside mandatory 2.0°C - 8.0°C transport range.`
      );
    }

    if (input.tubes.length === 0) {
      throw new HttpError(400, 'Consignment manifest must contain at least 1 barcoded tube.');
    }

    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const manifestBarcode = `MNF-${dateStamp}-${randomSuffix}`;
    const manifestId = randomUUID();

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `INSERT INTO "consignment_manifests" (
          "id", "manifest_barcode", "partner_id", "tamper_seal_number",
          "courier_runner_name", "courier_runner_phone", "departure_temp_celsius",
          "expected_tube_count", "status", "dispatched_at"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'IN_TRANSIT_COLD_CHAIN', NOW())`,
        manifestId,
        manifestBarcode,
        input.partnerId,
        input.tamperSealNumber,
        input.courierRunnerName,
        input.courierRunnerPhone,
        input.departureTempCelsius,
        input.tubes.length
      );

      for (const tube of input.tubes) {
        await tx.$executeRawUnsafe(
          `INSERT INTO "consignment_manifest_items" (
            "id", "manifest_id", "tube_barcode", "sample_id",
            "order_number", "patient_name", "vacutainer_type",
            "is_scanned_at_hub", "condition_status"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, 'INTACT')`,
          randomUUID(),
          manifestId,
          tube.tubeBarcode,
          tube.sampleId ?? null,
          tube.orderNumber,
          tube.patientName,
          tube.vacutainerType
        );
      }
    });

    return this.getManifestByBarcode(manifestBarcode);
  }

  /**
   * Central Hub Receiving Dock:
   * Scans the manifest bag barcode, verifies cold-chain arrival temp (2°C - 8°C),
   * reconciles scanned tube barcodes vs expected manifest items, and flags missing tubes.
   */
  public async receiveAndVerifyManifestAtHub(input: HubReceiveManifestScanInput) {
    await this.ensureSchema();

    const manifests = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        manifestBarcode: string;
        expectedTubeCount: number;
      }>
    >(
      `SELECT "id", "manifest_barcode" AS "manifestBarcode", "expected_tube_count" AS "expectedTubeCount"
       FROM "consignment_manifests"
       WHERE "manifest_barcode" = $1
       LIMIT 1`,
      input.manifestBarcode
    );

    if (manifests.length === 0) {
      throw new HttpError(404, `Consignment manifest '${input.manifestBarcode}' not found`);
    }

    const manifest = manifests[0];
    const isTempExcursion = input.arrivalTempCelsius < 2.0 || input.arrivalTempCelsius > 8.0;

    const items = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        tubeBarcode: string;
        orderNumber: string;
        patientName: string;
        vacutainerType: string;
      }>
    >(
      `SELECT
        "id",
        "tube_barcode" AS "tubeBarcode",
        "order_number" AS "orderNumber",
        "patient_name" AS "patientName",
        "vacutainer_type" AS "vacutainerType"
       FROM "consignment_manifest_items"
       WHERE "manifest_id" = $1`,
      manifest.id
    );

    const scannedSet = new Set(input.scannedTubeBarcodes.map((b) => b.trim().toUpperCase()));
    const missingTubes: Array<{
      tubeBarcode: string;
      orderNumber: string;
      patientName: string;
      vacutainerType: string;
    }> = [];

    let verifiedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const isPresent = scannedSet.has(item.tubeBarcode.toUpperCase());
        if (isPresent) {
          verifiedCount += 1;
          await tx.$executeRawUnsafe(
            `UPDATE "consignment_manifest_items"
             SET "is_scanned_at_hub" = TRUE,
                 "hub_scanned_at" = NOW(),
                 "condition_status" = 'INTACT'
             WHERE "id" = $1`,
            item.id
          );
        } else {
          missingTubes.push(item);
          await tx.$executeRawUnsafe(
            `UPDATE "consignment_manifest_items"
             SET "is_scanned_at_hub" = FALSE,
                 "condition_status" = 'MISSING'
             WHERE "id" = $1`,
            item.id
          );
        }
      }

      const discrepancyCount = missingTubes.length;
      let nextStatus = 'RECEIVED_AT_HUB';
      if (isTempExcursion) {
        nextStatus = 'REJECTED_TEMP_EXCURSION';
      } else if (discrepancyCount > 0) {
        nextStatus = 'RECEIVED_WITH_DISCREPANCY';
      }

      const autoNote =
        discrepancyCount > 0
          ? `MISSING TUBE ALERT: Expected ${items.length} tubes, scanned ${verifiedCount}. Missing barcodes: ${missingTubes.map((m) => m.tubeBarcode).join(', ')}`
          : 'All manifest tubes verified intact within cold-chain SLA.';

      await tx.$executeRawUnsafe(
        `UPDATE "consignment_manifests"
         SET "arrival_temp_celsius" = $1,
             "received_tube_count" = $2,
             "discrepancy_count" = $3,
             "status" = $4,
             "received_at_hub_at" = NOW(),
             "received_by_hub_user_id" = $5,
             "discrepancy_notes" = $6
         WHERE "id" = $7`,
        input.arrivalTempCelsius,
        verifiedCount,
        discrepancyCount,
        nextStatus,
        input.receivedByHubUserId,
        input.discrepancyNotes ? `${input.discrepancyNotes} | ${autoNote}` : autoNote,
        manifest.id
      );
    });

    const updated = await this.getManifestByBarcode(input.manifestBarcode);
    return {
      ...updated,
      isTempExcursion,
      missingTubesAlert: missingTubes,
    };
  }

  public async getManifestByBarcode(manifestBarcode: string) {
    await this.ensureSchema();

    const rows = await prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT
        m."id",
        m."manifest_barcode" AS "manifestBarcode",
        m."partner_id" AS "partnerId",
        p."partner_code" AS "partnerCode",
        p."center_name" AS "centerName",
        p."city",
        m."tamper_seal_number" AS "tamperSealNumber",
        m."courier_runner_name" AS "courierRunnerName",
        m."courier_runner_phone" AS "courierRunnerPhone",
        m."departure_temp_celsius"::FLOAT AS "departureTempCelsius",
        m."arrival_temp_celsius"::FLOAT AS "arrivalTempCelsius",
        m."expected_tube_count" AS "expectedTubeCount",
        m."received_tube_count" AS "receivedTubeCount",
        m."discrepancy_count" AS "discrepancyCount",
        m."status",
        m."dispatched_at" AS "dispatchedAt",
        m."received_at_hub_at" AS "receivedAtHubAt",
        m."received_by_hub_user_id" AS "receivedByHubUserId",
        m."discrepancy_notes" AS "discrepancyNotes"
       FROM "consignment_manifests" m
       INNER JOIN "b2b_partner_spokes" p ON p."id" = m."partner_id"
       WHERE m."manifest_barcode" = $1
       LIMIT 1`,
      manifestBarcode
    );

    if (rows.length === 0) {
      throw new HttpError(404, `Manifest '${manifestBarcode}' not found`);
    }

    const items = await prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT
        "id",
        "tube_barcode" AS "tubeBarcode",
        "sample_id" AS "sampleId",
        "order_number" AS "orderNumber",
        "patient_name" AS "patientName",
        "vacutainer_type" AS "vacutainerType",
        "is_scanned_at_hub" AS "isScannedAtHub",
        "hub_scanned_at" AS "hubScannedAt",
        "condition_status" AS "conditionStatus"
       FROM "consignment_manifest_items"
       WHERE "manifest_id" = $1
       ORDER BY "tube_barcode" ASC`,
      rows[0].id
    );

    return {
      ...rows[0],
      items,
    };
  }

  public async getHubLogisticsDashboard() {
    await this.ensureSchema();
    await this.ensureSeededSpokes();

    const partners = await prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT
        "id",
        "partner_code" AS "partnerCode",
        "center_name" AS "centerName",
        "tier",
        "city",
        "contact_person" AS "contactPerson",
        "contact_phone" AS "contactPhone",
        "wallet_balance_inr"::FLOAT AS "walletBalanceInr",
        "credit_limit_inr"::FLOAT AS "creditLimitInr",
        "discount_percentage"::FLOAT AS "discountPercentage",
        "is_booking_frozen" AS "isBookingFrozen"
       FROM "b2b_partner_spokes"
       ORDER BY "partner_code" ASC`
    );

    const ledgerEntries = await prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT
        l."id",
        l."partner_id" AS "partnerId",
        p."partner_code" AS "partnerCode",
        p."center_name" AS "centerName",
        l."transaction_ref" AS "transactionRef",
        l."transaction_type" AS "transactionType",
        l."amount_inr"::FLOAT AS "amountInr",
        l."balance_before_inr"::FLOAT AS "balanceBeforeInr",
        l."balance_after_inr"::FLOAT AS "balanceAfterInr",
        l."order_id" AS "orderId",
        l."remarks",
        l."created_at" AS "createdAt"
       FROM "b2b_wallet_ledgers" l
       INNER JOIN "b2b_partner_spokes" p ON p."id" = l."partner_id"
       ORDER BY l."created_at" DESC
       LIMIT 25`
    );

    const manifestRows = await prisma.$queryRawUnsafe<Array<{ manifestBarcode: string }>>(
      `SELECT "manifest_barcode" AS "manifestBarcode"
       FROM "consignment_manifests"
       ORDER BY "dispatched_at" DESC
       LIMIT 15`
    );

    const manifests = [];
    for (const m of manifestRows) {
      manifests.push(await this.getManifestByBarcode(m.manifestBarcode));
    }

    return {
      partners,
      ledgerEntries,
      manifests,
    };
  }

  private async ensureSeededSpokes(): Promise<void> {
    const existing = await prisma.$queryRawUnsafe<Array<{ cnt: number }>>(
      `SELECT COUNT(*)::INT AS cnt FROM "b2b_partner_spokes"`
    );
    if ((existing[0]?.cnt ?? 0) > 0) return;

    const p1Id = randomUUID();
    const p2Id = randomUUID();

    await prisma.$executeRawUnsafe(
      `INSERT INTO "b2b_partner_spokes" (
        "id", "partner_code", "center_name", "tier", "city",
        "contact_person", "contact_phone", "wallet_balance_inr",
        "credit_limit_inr", "discount_percentage", "is_booking_frozen"
      ) VALUES
      ($1, 'SPK-AMD-001', 'Apex Care Collection Spoke - Navrangpura', 'GOLD_FRANCHISEE', 'Ahmedabad', 'Dr. Mehul Desai', '+91-9825011223', 42500.00, 25000.00, 35.00, FALSE),
      ($2, 'SPK-PLN-002', 'North Gujarat Diagnostics Spoke - Palanpur', 'PLATINUM_HOSPITAL_SPOKE', 'Palanpur', 'Kiranbhai Patel', '+91-9898044556', 4800.00, 15000.00, 40.00, FALSE)`,
      p1Id,
      p2Id
    );

    await this.bookB2BPartnerRequisition({
      partnerId: p1Id,
      patientName: 'Rameshbhai Chaudhary',
      orderNumber: 'ORD-B2B-7001',
      testCodes: ['LIPID', 'HBA1C', 'CBC'],
      retailTariffTotalInr: 1850,
    });

    await this.generateConsignmentManifest({
      partnerId: p1Id,
      tamperSealNumber: 'SEAL-IND-994120',
      courierRunnerName: 'Vikram Thakor',
      courierRunnerPhone: '+91-9724088112',
      departureTempCelsius: 4.6,
      tubes: [
        {
          tubeBarcode: 'TUB-2026-8801',
          orderNumber: 'ORD-B2B-7001',
          patientName: 'Rameshbhai Chaudhary',
          vacutainerType: 'GOLD_SST_GEL',
        },
        {
          tubeBarcode: 'TUB-2026-8802',
          orderNumber: 'ORD-B2B-7001',
          patientName: 'Rameshbhai Chaudhary',
          vacutainerType: 'LAVENDER_EDTA',
        },
        {
          tubeBarcode: 'TUB-2026-8803',
          orderNumber: 'ORD-B2B-7002',
          patientName: 'Savitaben Prajapati',
          vacutainerType: 'GOLD_SST_GEL',
        },
        {
          tubeBarcode: 'TUB-2026-8804',
          orderNumber: 'ORD-B2B-7003',
          patientName: 'Harshadkumar Joshi',
          vacutainerType: 'LIGHT_BLUE_CITRATE',
        },
      ],
    });
  }
}

export const hubSpokeManifestService = new HubSpokeManifestService();
