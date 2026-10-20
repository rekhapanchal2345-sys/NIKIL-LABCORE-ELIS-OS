import { randomUUID } from 'crypto';
import prisma from '../../../config/database';
import { HttpError } from '../../utils/http-error';

export type CultureSampleSite =
  | 'BLOOD'
  | 'URINE'
  | 'SPUTUM'
  | 'PUS_SWAB'
  | 'CSF'
  | 'STOOL'
  | 'BRONCHOALVEOLAR_LAVAGE'
  | 'PLEURAL_FLUID'
  | 'ASCITIC_FLUID'
  | 'TISSUE_BIOPSY';

export type AstInterpretation = 'S' | 'I' | 'R';

export type MdroFlagType =
  | 'MRSA'
  | 'VRE'
  | 'ESBL'
  | 'CRE'
  | 'MDR_PSEUDOMONAS'
  | 'CRAB';

export interface ClsiBreakpointRule {
  antibioticCode: string;
  antibioticName: string;
  antibioticClass: string;
  isRestrictedReserve: boolean;
  /** MIC (µg/mL) <= sMaxMic is Susceptible */
  sMaxMic: number;
  /** MIC (µg/mL) >= rMinMic is Resistant */
  rMinMic: number;
  /** Disk diffusion zone (mm) >= sMinZoneMm is Susceptible */
  sMinZoneMm: number;
  /** Disk diffusion zone (mm) <= rMaxZoneMm is Resistant */
  rMaxZoneMm: number;
}

/**
 * CLSI M100 Ed. 34 / EUCAST v14.0 Reference Breakpoint Dictionary
 */
export const CLSI_M100_BREAKPOINTS: Record<string, ClsiBreakpointRule> = {
  AMK: {
    antibioticCode: 'AMK',
    antibioticName: 'Amikacin',
    antibioticClass: 'Aminoglycosides',
    isRestrictedReserve: false,
    sMaxMic: 16,
    rMinMic: 64,
    sMinZoneMm: 17,
    rMaxZoneMm: 14,
  },
  MEM: {
    antibioticCode: 'MEM',
    antibioticName: 'Meropenem',
    antibioticClass: 'Carbapenems',
    isRestrictedReserve: true,
    sMaxMic: 1,
    rMinMic: 4,
    sMinZoneMm: 23,
    rMaxZoneMm: 19,
  },
  CST: {
    antibioticCode: 'CST',
    antibioticName: 'Colistin',
    antibioticClass: 'Polymyxins',
    isRestrictedReserve: true,
    sMaxMic: 2,
    rMinMic: 4,
    sMinZoneMm: 11,
    rMaxZoneMm: 10,
  },
  LZD: {
    antibioticCode: 'LZD',
    antibioticName: 'Linezolid',
    antibioticClass: 'Oxazolidinones',
    isRestrictedReserve: true,
    sMaxMic: 4,
    rMinMic: 8,
    sMinZoneMm: 21,
    rMaxZoneMm: 20,
  },
  VAN: {
    antibioticCode: 'VAN',
    antibioticName: 'Vancomycin',
    antibioticClass: 'Glycopeptides',
    isRestrictedReserve: true,
    sMaxMic: 2,
    rMinMic: 16,
    sMinZoneMm: 17,
    rMaxZoneMm: 14,
  },
  CIP: {
    antibioticCode: 'CIP',
    antibioticName: 'Ciprofloxacin',
    antibioticClass: 'Fluoroquinolones',
    isRestrictedReserve: false,
    sMaxMic: 0.25,
    rMinMic: 1,
    sMinZoneMm: 26,
    rMaxZoneMm: 21,
  },
  CRO: {
    antibioticCode: 'CRO',
    antibioticName: 'Ceftriaxone',
    antibioticClass: 'Cephalosporins (3rd Gen)',
    isRestrictedReserve: false,
    sMaxMic: 1,
    rMinMic: 4,
    sMinZoneMm: 23,
    rMaxZoneMm: 19,
  },
  TZP: {
    antibioticCode: 'TZP',
    antibioticName: 'Piperacillin-Tazobactam',
    antibioticClass: 'Beta-Lactam / Beta-Lactamase Inhibitor',
    isRestrictedReserve: false,
    sMaxMic: 16,
    rMinMic: 128,
    sMinZoneMm: 21,
    rMaxZoneMm: 17,
  },
};

export interface AccessionCultureInput {
  sampleId: string;
  orderId: string;
  patientId: string;
  wardOrUnit: string;
  isIcuPatient: boolean;
  sampleSite: CultureSampleSite;
  incubationTempCelsius?: number;
}

export interface PreliminaryGramStainInput {
  cultureId: string;
  gramStainMorphology: string;
  pusCellsCount: string;
  epithelialCellsCount: string;
  reportedByUserId: string;
}

export interface AntibioticTestEntryInput {
  antibioticCode: string;
  method: 'VITEK2_MIC' | 'KIRBY_BAUER_DISK' | 'E_TEST';
  micValueUgMl?: number;
  zoneDiameterMm?: number;
}

export interface IsolateWithAstInput {
  cultureId: string;
  isolateNumber: number;
  organismCode: string;
  organismName: string;
  gramReaction: 'GRAM_NEGATIVE' | 'GRAM_POSITIVE' | 'YEAST';
  growthDensity: string;
  colonyCountCfu?: string;
  antibioticPanel: AntibioticTestEntryInput[];
  verifiedByUserId?: string;
}

export interface EvaluatedAstResult {
  id: string;
  antibioticCode: string;
  antibioticName: string;
  antibioticClass: string;
  method: string;
  micValueUgMl: number | null;
  zoneDiameterMm: number | null;
  clsiBreakpointS: string;
  clsiBreakpointR: string;
  interpretation: AstInterpretation;
  isRestrictedReserve: boolean;
}

export interface AntibiogramCell {
  antibioticCode: string;
  antibioticName: string;
  totalTested: number;
  susceptibleCount: number;
  intermediateCount: number;
  resistantCount: number;
  susceptibilityPercent: number;
}

export interface OrganismAntibiogramRow {
  organismName: string;
  gramReaction: string;
  totalIsolates: number;
  mdroCount: number;
  mdroRatePercent: number;
  antibiotics: Record<string, AntibiogramCell>;
}

export interface MicrobiologyCultureResult {
  id: string;
  accessionNumber: string;
  sampleId: string;
  orderId: string;
  patientId: string;
  wardOrUnit: string;
  isIcuPatient: boolean;
  sampleSite: string;
  status: string;
  gramStainMorphology: string | null;
  pusCellsCount: string | null;
  epithelialCellsCount: string | null;
  preliminaryReportAt: Date | null;
  preliminaryReportedBy: string | null;
  incubationTempCelsius: number;
  incubationStartedAt: Date;
  colonyCountCfu: string | null;
  finalClinicalNotes: string | null;
  verifiedByUserId: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  isolates: Array<Record<string, any>>;
  [key: string]: any;
}

export class MicrobiologyAstService {
  private schemaReady = false;

  /**
   * Ensures PostgreSQL tables exist for Microbiology & AST so runtime operations
   * succeed seamlessly even on fresh database instances.
   */
  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "microbiology_cultures" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "accession_number" TEXT NOT NULL UNIQUE,
        "sample_id" TEXT NOT NULL,
        "order_id" TEXT NOT NULL,
        "patient_id" TEXT NOT NULL,
        "ward_or_unit" TEXT NOT NULL DEFAULT 'OPD',
        "is_icu_patient" BOOLEAN NOT NULL DEFAULT false,
        "sample_site" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'ACCESSIONED',
        "gram_stain_morphology" TEXT,
        "pus_cells_count" TEXT,
        "epithelial_cells_count" TEXT,
        "preliminary_report_at" TIMESTAMP(3),
        "preliminary_reported_by" TEXT,
        "incubation_temp_celsius" NUMERIC(4,1) NOT NULL DEFAULT 37.0,
        "incubation_started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "colony_count_cfu" TEXT,
        "final_clinical_notes" TEXT,
        "verified_by_user_id" TEXT,
        "verified_at" TIMESTAMP(3),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "microbiology_isolates" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "culture_id" TEXT NOT NULL REFERENCES "microbiology_cultures"("id") ON DELETE CASCADE,
        "isolate_number" INTEGER NOT NULL,
        "organism_code" TEXT NOT NULL,
        "organism_name" TEXT NOT NULL,
        "gram_reaction" TEXT NOT NULL,
        "growth_density" TEXT NOT NULL,
        "mdro_flags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        "is_hicc_alert_triggered" BOOLEAN NOT NULL DEFAULT false,
        "isolated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("culture_id", "isolate_number")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "antibiotic_susceptibilities" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "isolate_id" TEXT NOT NULL REFERENCES "microbiology_isolates"("id") ON DELETE CASCADE,
        "antibiotic_code" TEXT NOT NULL,
        "antibiotic_name" TEXT NOT NULL,
        "antibiotic_class" TEXT NOT NULL,
        "method" TEXT NOT NULL DEFAULT 'VITEK2_MIC',
        "zone_diameter_mm" NUMERIC(5,1),
        "mic_value_ug_ml" NUMERIC(8,3),
        "clsi_breakpoint_s" TEXT NOT NULL,
        "clsi_breakpoint_r" TEXT NOT NULL,
        "interpretation" TEXT NOT NULL,
        "is_restricted_reserve" BOOLEAN NOT NULL DEFAULT false,
        "tested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("isolate_id", "antibiotic_code")
      );
    `);

    this.schemaReady = true;
  }

  /**
   * Interprets MIC (µg/mL) or Kirby-Bauer Zone Diameter (mm) into S / I / R
   * using CLSI M100 / EUCAST breakpoints.
   */
  public evaluateBreakpoint(entry: AntibioticTestEntryInput): {
    rule: ClsiBreakpointRule;
    interpretation: AstInterpretation;
    breakpointSLabel: string;
    breakpointRLabel: string;
  } {
    const code = entry.antibioticCode.toUpperCase();
    const rule = CLSI_M100_BREAKPOINTS[code];
    if (!rule) {
      throw new HttpError(
        400,
        `Unsupported antibiotic code '${entry.antibioticCode}'. Supported CLSI M100 panel: ${Object.keys(CLSI_M100_BREAKPOINTS).join(', ')}`
      );
    }

    let interpretation: AstInterpretation = 'I';

    if (entry.method === 'KIRBY_BAUER_DISK') {
      if (typeof entry.zoneDiameterMm !== 'number') {
        throw new HttpError(400, `zoneDiameterMm is required for KIRBY_BAUER_DISK on ${rule.antibioticName}`);
      }
      if (entry.zoneDiameterMm >= rule.sMinZoneMm) {
        interpretation = 'S';
      } else if (entry.zoneDiameterMm <= rule.rMaxZoneMm) {
        interpretation = 'R';
      } else {
        interpretation = 'I';
      }
    } else {
      if (typeof entry.micValueUgMl !== 'number') {
        throw new HttpError(400, `micValueUgMl is required for ${entry.method} on ${rule.antibioticName}`);
      }
      if (entry.micValueUgMl <= rule.sMaxMic) {
        interpretation = 'S';
      } else if (entry.micValueUgMl >= rule.rMinMic) {
        interpretation = 'R';
      } else {
        interpretation = 'I';
      }
    }

    return {
      rule,
      interpretation,
      breakpointSLabel:
        entry.method === 'KIRBY_BAUER_DISK' ? `>= ${rule.sMinZoneMm} mm` : `<= ${rule.sMaxMic} µg/mL`,
      breakpointRLabel:
        entry.method === 'KIRBY_BAUER_DISK' ? `<= ${rule.rMaxZoneMm} mm` : `>= ${rule.rMinMic} µg/mL`,
    };
  }

  /**
   * Detects Multi-Drug Resistant Organism (MDRO) phenotypes per CLSI M100 & HICC rules:
   * - MRSA: Staphylococcus aureus resistant to beta-lactams / Ceftriaxone or high MIC
   * - VRE: Enterococcus spp. resistant to Vancomycin (VAN = R)
   * - ESBL: Enterobacterales (E. coli, Klebsiella, Proteus) resistant to 3rd-gen Cephalosporin (CRO = R) & susceptible to Carbapenems
   * - CRE: Enterobacterales resistant to Meropenem (MEM = R)
   */
  public detectMdroFlags(
    organismName: string,
    gramReaction: 'GRAM_NEGATIVE' | 'GRAM_POSITIVE' | 'YEAST',
    results: EvaluatedAstResult[]
  ): MdroFlagType[] {
    const flags = new Set<MdroFlagType>();
    const normalizedOrg = organismName.toLowerCase();

    const byCode = new Map<string, AstInterpretation>();
    for (const r of results) {
      byCode.set(r.antibioticCode, r.interpretation);
    }

    // 1. CRE (Carbapenemase Producer / Carbapenem-Resistant Enterobacterales)
    const isEnterobacterales =
      normalizedOrg.includes('escherichia') ||
      normalizedOrg.includes('e. coli') ||
      normalizedOrg.includes('klebsiella') ||
      normalizedOrg.includes('enterobacter') ||
      normalizedOrg.includes('proteus') ||
      normalizedOrg.includes('serratia') ||
      normalizedOrg.includes('citrobacter');

    if (isEnterobacterales && byCode.get('MEM') === 'R') {
      flags.add('CRE');
    }

    // 2. ESBL (Extended-Spectrum Beta-Lactamase Producer)
    if (isEnterobacterales && byCode.get('CRO') === 'R') {
      flags.add('ESBL');
    }

    // 3. VRE (Vancomycin-Resistant Enterococcus)
    if (normalizedOrg.includes('enterococcus') && byCode.get('VAN') === 'R') {
      flags.add('VRE');
    }

    // 4. MRSA (Methicillin-Resistant Staphylococcus aureus)
    if (
      (normalizedOrg.includes('staphylococcus aureus') || normalizedOrg.includes('s. aureus')) &&
      (byCode.get('CRO') === 'R' || byCode.get('TZP') === 'R' || byCode.get('CIP') === 'R')
    ) {
      flags.add('MRSA');
    }

    // 5. CRAB (Carbapenem-Resistant Acinetobacter baumannii)
    if (normalizedOrg.includes('acinetobacter') && byCode.get('MEM') === 'R') {
      flags.add('CRAB');
    }

    // 6. MDR Pseudomonas
    if (normalizedOrg.includes('pseudomonas')) {
      const resistantClasses = results.filter((r) => r.interpretation === 'R').length;
      if (resistantClasses >= 3 || byCode.get('MEM') === 'R') {
        flags.add('MDR_PSEUDOMONAS');
      }
    }

    return Array.from(flags);
  }

  /**
   * Step 1: Culture Accessioning
   */
  public async accessionCultureSample(input: AccessionCultureInput) {
    await this.ensureSchema();

    const id = randomUUID();
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = Math.floor(10000 + Math.random() * 90000);
    const accessionNumber = `MIC-${dateStamp}-${suffix}`;
    const temp = input.incubationTempCelsius ?? 37.0;

    await prisma.$executeRawUnsafe(
      `INSERT INTO "microbiology_cultures" (
        "id", "accession_number", "sample_id", "order_id", "patient_id",
        "ward_or_unit", "is_icu_patient", "sample_site", "status",
        "incubation_temp_celsius", "incubation_started_at", "created_at", "updated_at"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACCESSIONED', $9, NOW(), NOW(), NOW())`,
      id,
      accessionNumber,
      input.sampleId,
      input.orderId,
      input.patientId,
      input.wardOrUnit,
      input.isIcuPatient,
      input.sampleSite,
      temp
    );

    return this.getCultureById(id);
  }

  /**
   * Step 2: 24h Preliminary Gram Stain / Microscopy Report
   */
  public async recordPreliminaryGramStain(input: PreliminaryGramStainInput) {
    await this.ensureSchema();

    const updated = await prisma.$executeRawUnsafe(
      `UPDATE "microbiology_cultures"
       SET "gram_stain_morphology" = $1,
           "pus_cells_count" = $2,
           "epithelial_cells_count" = $3,
           "preliminary_report_at" = NOW(),
           "preliminary_reported_by" = $4,
           "status" = 'PRELIMINARY_GRAM_STAIN',
           "updated_at" = NOW()
       WHERE "id" = $5`,
      input.gramStainMorphology,
      input.pusCellsCount,
      input.epithelialCellsCount,
      input.reportedByUserId,
      input.cultureId
    );

    if (!updated) {
      throw new HttpError(404, `Microbiology culture '${input.cultureId}' not found`);
    }

    return this.getCultureById(input.cultureId);
  }

  /**
   * Step 3: Organism Isolation & CLSI M100 Antibiotic Susceptibility Panel Recording
   */
  public async recordIsolateAndAstPanel(input: IsolateWithAstInput) {
    await this.ensureSchema();

    const existingCulture = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT "id" FROM "microbiology_cultures" WHERE "id" = $1 LIMIT 1`,
      input.cultureId
    );
    if (existingCulture.length === 0) {
      throw new HttpError(404, `Microbiology culture '${input.cultureId}' not found`);
    }

    const evaluatedResults: EvaluatedAstResult[] = input.antibioticPanel.map((entry) => {
      const evaluated = this.evaluateBreakpoint(entry);
      return {
        id: randomUUID(),
        antibioticCode: evaluated.rule.antibioticCode,
        antibioticName: evaluated.rule.antibioticName,
        antibioticClass: evaluated.rule.antibioticClass,
        method: entry.method,
        micValueUgMl: entry.micValueUgMl ?? null,
        zoneDiameterMm: entry.zoneDiameterMm ?? null,
        clsiBreakpointS: evaluated.breakpointSLabel,
        clsiBreakpointR: evaluated.breakpointRLabel,
        interpretation: evaluated.interpretation,
        isRestrictedReserve: evaluated.rule.isRestrictedReserve,
      };
    });

    const mdroFlags = this.detectMdroFlags(
      input.organismName,
      input.gramReaction,
      evaluatedResults
    );
    const isHiccAlertTriggered = mdroFlags.length > 0;
    const isolateId = randomUUID();

    await prisma.$transaction(async (tx) => {
      // Upsert isolate for (culture_id, isolate_number)
      const existingIsolate = await tx.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT "id" FROM "microbiology_isolates" WHERE "culture_id" = $1 AND "isolate_number" = $2 LIMIT 1`,
        input.cultureId,
        input.isolateNumber
      );

      let targetIsolateId: string = isolateId;
      if (existingIsolate.length > 0) {
        targetIsolateId = existingIsolate[0].id;
        await tx.$executeRawUnsafe(
          `UPDATE "microbiology_isolates"
           SET "organism_code" = $1,
               "organism_name" = $2,
               "gram_reaction" = $3,
               "growth_density" = $4,
               "mdro_flags" = $5::TEXT[],
               "is_hicc_alert_triggered" = $6,
               "isolated_at" = NOW()
           WHERE "id" = $7`,
          input.organismCode,
          input.organismName,
          input.gramReaction,
          input.growthDensity,
          mdroFlags,
          isHiccAlertTriggered,
          targetIsolateId
        );
        await tx.$executeRawUnsafe(
          `DELETE FROM "antibiotic_susceptibilities" WHERE "isolate_id" = $1`,
          targetIsolateId
        );
      } else {
        await tx.$executeRawUnsafe(
          `INSERT INTO "microbiology_isolates" (
            "id", "culture_id", "isolate_number", "organism_code", "organism_name",
            "gram_reaction", "growth_density", "mdro_flags", "is_hicc_alert_triggered", "isolated_at"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::TEXT[], $9, NOW())`,
          targetIsolateId,
          input.cultureId,
          input.isolateNumber,
          input.organismCode,
          input.organismName,
          input.gramReaction,
          input.growthDensity,
          mdroFlags,
          isHiccAlertTriggered
        );
      }

      for (const ast of evaluatedResults) {
        await tx.$executeRawUnsafe(
          `INSERT INTO "antibiotic_susceptibilities" (
            "id", "isolate_id", "antibiotic_code", "antibiotic_name", "antibiotic_class",
            "method", "zone_diameter_mm", "mic_value_ug_ml",
            "clsi_breakpoint_s", "clsi_breakpoint_r", "interpretation", "is_restricted_reserve", "tested_at"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
          ast.id,
          targetIsolateId,
          ast.antibioticCode,
          ast.antibioticName,
          ast.antibioticClass,
          ast.method,
          ast.zoneDiameterMm,
          ast.micValueUgMl,
          ast.clsiBreakpointS,
          ast.clsiBreakpointR,
          ast.interpretation,
          ast.isRestrictedReserve
        );
      }

      const nextStatus = input.verifiedByUserId ? 'FINAL_VERIFIED' : 'AST_IN_PROGRESS';
      await tx.$executeRawUnsafe(
        `UPDATE "microbiology_cultures"
         SET "status" = $1,
             "colony_count_cfu" = COALESCE($2, "colony_count_cfu"),
             "verified_by_user_id" = COALESCE($3, "verified_by_user_id"),
             "verified_at" = CASE WHEN $3 IS NOT NULL THEN NOW() ELSE "verified_at" END,
             "updated_at" = NOW()
         WHERE "id" = $4`,
        nextStatus,
        input.colonyCountCfu ?? null,
        input.verifiedByUserId ?? null,
        input.cultureId
      );
    });

    return this.getCultureById(input.cultureId);
  }

  /**
   * Retrieves a complete Culture with all isolated pathogens and AST panels.
   */
  public async getCultureById(cultureId: string): Promise<MicrobiologyCultureResult> {
    await this.ensureSchema();

    const cultures = await prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT
        "id",
        "accession_number" AS "accessionNumber",
        "sample_id" AS "sampleId",
        "order_id" AS "orderId",
        "patient_id" AS "patientId",
        "ward_or_unit" AS "wardOrUnit",
        "is_icu_patient" AS "isIcuPatient",
        "sample_site" AS "sampleSite",
        "status",
        "gram_stain_morphology" AS "gramStainMorphology",
        "pus_cells_count" AS "pusCellsCount",
        "epithelial_cells_count" AS "epithelialCellsCount",
        "preliminary_report_at" AS "preliminaryReportAt",
        "preliminary_reported_by" AS "preliminaryReportedBy",
        "incubation_temp_celsius"::FLOAT AS "incubationTempCelsius",
        "incubation_started_at" AS "incubationStartedAt",
        "colony_count_cfu" AS "colonyCountCfu",
        "final_clinical_notes" AS "finalClinicalNotes",
        "verified_by_user_id" AS "verifiedByUserId",
        "verified_at" AS "verifiedAt",
        "created_at" AS "createdAt"
       FROM "microbiology_cultures"
       WHERE "id" = $1
       LIMIT 1`,
      cultureId
    );

    if (cultures.length === 0) {
      throw new HttpError(404, `Culture '${cultureId}' not found`);
    }

    const culture = cultures[0];

    const isolates = await prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT
        "id",
        "culture_id" AS "cultureId",
        "isolate_number" AS "isolateNumber",
        "organism_code" AS "organismCode",
        "organism_name" AS "organismName",
        "gram_reaction" AS "gramReaction",
        "growth_density" AS "growthDensity",
        "mdro_flags" AS "mdroFlags",
        "is_hicc_alert_triggered" AS "isHiccAlertTriggered",
        "isolated_at" AS "isolatedAt"
       FROM "microbiology_isolates"
       WHERE "culture_id" = $1
       ORDER BY "isolate_number" ASC`,
      cultureId
    );

    for (const iso of isolates) {
      const astRows = await prisma.$queryRawUnsafe<Array<Record<string, any>>>(
        `SELECT
          "id",
          "antibiotic_code" AS "antibioticCode",
          "antibiotic_name" AS "antibioticName",
          "antibiotic_class" AS "antibioticClass",
          "method",
          "zone_diameter_mm"::FLOAT AS "zoneDiameterMm",
          "mic_value_ug_ml"::FLOAT AS "micValueUgMl",
          "clsi_breakpoint_s" AS "clsiBreakpointS",
          "clsi_breakpoint_r" AS "clsiBreakpointR",
          "interpretation",
          "is_restricted_reserve" AS "isRestrictedReserve",
          "tested_at" AS "testedAt"
         FROM "antibiotic_susceptibilities"
         WHERE "isolate_id" = $1
         ORDER BY "antibiotic_name" ASC`,
        iso.id
      );
      iso.susceptibilities = astRows;
    }

    return {
      ...culture,
      isolates,
    } as MicrobiologyCultureResult;
  }

  /**
   * Lists active & recent Microbiology Cultures (with auto-seeded clinical data if empty).
   */
  public async listCultures(limit = 25) {
    await this.ensureSchema();

    const countRow = await prisma.$queryRawUnsafe<Array<{ cnt: number }>>(
      `SELECT COUNT(*)::INT AS cnt FROM "microbiology_cultures"`
    );
    if ((countRow[0]?.cnt ?? 0) === 0) {
      await this.seedBaselineMicrobiologyData();
    }

    const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT "id" FROM "microbiology_cultures" ORDER BY "created_at" DESC LIMIT $1`,
      limit
    );

    const results = [];
    for (const r of rows) {
      results.push(await this.getCultureById(r.id));
    }
    return results;
  }

  /**
   * Hospital Infection Control Committee (HICC) Cumulative Antibiogram Generator
   * Aggregates past N days (30 or 90 days) culture susceptibility data to compute
   * % Susceptibility per pathogen/antibiotic pair for ICU & hospital-wide stewardship.
   */
  public async generateHiccAntibiogram(options: {
    windowDays: 30 | 90;
    icuOnly?: boolean;
    sampleSite?: CultureSampleSite;
  }) {
    await this.ensureSchema();

    const countRow = await prisma.$queryRawUnsafe<Array<{ cnt: number }>>(
      `SELECT COUNT(*)::INT AS cnt FROM "microbiology_cultures"`
    );
    if ((countRow[0]?.cnt ?? 0) === 0) {
      await this.seedBaselineMicrobiologyData();
    }

    const windowDays = options.windowDays === 90 ? 90 : 30;
    const cutoffDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const rawData = await prisma.$queryRawUnsafe<
      Array<{
        isolateId: string;
        organismName: string;
        gramReaction: string;
        mdroFlags: string[];
        antibioticCode: string;
        antibioticName: string;
        interpretation: AstInterpretation;
        isIcuPatient: boolean;
        sampleSite: string;
      }>
    >(
      `SELECT
        i."id" AS "isolateId",
        i."organism_name" AS "organismName",
        i."gram_reaction" AS "gramReaction",
        i."mdro_flags" AS "mdroFlags",
        s."antibiotic_code" AS "antibioticCode",
        s."antibiotic_name" AS "antibioticName",
        s."interpretation" AS "interpretation",
        c."is_icu_patient" AS "isIcuPatient",
        c."sample_site" AS "sampleSite"
       FROM "antibiotic_susceptibilities" s
       INNER JOIN "microbiology_isolates" i ON i."id" = s."isolate_id"
       INNER JOIN "microbiology_cultures" c ON c."id" = i."culture_id"
       WHERE c."created_at" >= $1
         AND ($2::BOOLEAN IS FALSE OR c."is_icu_patient" = TRUE)
         AND ($3::TEXT IS NULL OR c."sample_site" = $3)`,
      cutoffDate,
      Boolean(options.icuOnly),
      options.sampleSite ?? null
    );

    const organismMap = new Map<
      string,
      {
        organismName: string;
        gramReaction: string;
        isolateIds: Set<string>;
        mdroIsolateIds: Set<string>;
        abxStats: Map<
          string,
          {
            antibioticCode: string;
            antibioticName: string;
            s: number;
            i: number;
            r: number;
          }
        >;
      }
    >();

    const mdroBreakdown: Record<string, number> = {
      MRSA: 0,
      VRE: 0,
      ESBL: 0,
      CRE: 0,
      MDR_PSEUDOMONAS: 0,
      CRAB: 0,
    };
    const countedMdroIsolates = new Set<string>();

    for (const row of rawData) {
      if (!organismMap.has(row.organismName)) {
        organismMap.set(row.organismName, {
          organismName: row.organismName,
          gramReaction: row.gramReaction,
          isolateIds: new Set(),
          mdroIsolateIds: new Set(),
          abxStats: new Map(),
        });
      }

      const orgEntry = organismMap.get(row.organismName)!;
      orgEntry.isolateIds.add(row.isolateId);

      if (row.mdroFlags && row.mdroFlags.length > 0) {
        orgEntry.mdroIsolateIds.add(row.isolateId);
        if (!countedMdroIsolates.has(row.isolateId)) {
          countedMdroIsolates.add(row.isolateId);
          for (const flag of row.mdroFlags) {
            if (mdroBreakdown[flag] !== undefined) {
              mdroBreakdown[flag] += 1;
            }
          }
        }
      }

      if (!orgEntry.abxStats.has(row.antibioticCode)) {
        orgEntry.abxStats.set(row.antibioticCode, {
          antibioticCode: row.antibioticCode,
          antibioticName: row.antibioticName,
          s: 0,
          i: 0,
          r: 0,
        });
      }

      const cell = orgEntry.abxStats.get(row.antibioticCode)!;
      if (row.interpretation === 'S') cell.s += 1;
      else if (row.interpretation === 'I') cell.i += 1;
      else if (row.interpretation === 'R') cell.r += 1;
    }

    const matrix: OrganismAntibiogramRow[] = [];

    for (const [, org] of organismMap.entries()) {
      const totalIsolates = org.isolateIds.size;
      const mdroCount = org.mdroIsolateIds.size;
      const antibiotics: Record<string, AntibiogramCell> = {};

      for (const [abxCode, stat] of org.abxStats.entries()) {
        const totalTested = stat.s + stat.i + stat.r;
        const susceptibilityPercent =
          totalTested > 0 ? Number(((stat.s / totalTested) * 100).toFixed(1)) : 0;

        antibiotics[abxCode] = {
          antibioticCode: abxCode,
          antibioticName: stat.antibioticName,
          totalTested,
          susceptibleCount: stat.s,
          intermediateCount: stat.i,
          resistantCount: stat.r,
          susceptibilityPercent,
        };
      }

      matrix.push({
        organismName: org.organismName,
        gramReaction: org.gramReaction,
        totalIsolates,
        mdroCount,
        mdroRatePercent:
          totalIsolates > 0 ? Number(((mdroCount / totalIsolates) * 100).toFixed(1)) : 0,
        antibiotics,
      });
    }

    matrix.sort((a, b) => b.totalIsolates - a.totalIsolates);

    return {
      generatedAt: new Date().toISOString(),
      standard: 'CLSI M100 Ed. 34 / EUCAST v14.0',
      windowDays,
      icuOnly: Boolean(options.icuOnly),
      sampleSiteFilter: options.sampleSite ?? 'ALL_SITES',
      antibioticColumns: Object.values(CLSI_M100_BREAKPOINTS).map((b) => ({
        code: b.antibioticCode,
        name: b.antibioticName,
        class: b.antibioticClass,
        isRestrictedReserve: b.isRestrictedReserve,
      })),
      mdroSurveillanceSummary: mdroBreakdown,
      antibiogramMatrix: matrix,
    };
  }

  /**
   * Seeds realistic clinical cultures & polymicrobial isolates for immediate HICC Antibiogram readiness.
   */
  private async seedBaselineMicrobiologyData(): Promise<void> {
    const c1 = await this.accessionCultureSample({
      sampleId: 'SMP-MIC-001',
      orderId: 'ORD-2026-9001',
      patientId: 'PAT-ICU-101',
      wardOrUnit: 'MICU-BED-04',
      isIcuPatient: true,
      sampleSite: 'URINE',
      incubationTempCelsius: 37.0,
    });

    await this.recordPreliminaryGramStain({
      cultureId: c1.id,
      gramStainMorphology: 'Numerous Gram-negative bacilli & occasional Gram-positive cocci in pairs seen',
      pusCellsCount: '>25 / HPF (Pyuria)',
      epithelialCellsCount: '1-2 / HPF',
      reportedByUserId: 'USR-MICRO-01',
    });

    // Isolate 1: Escherichia coli (ESBL producer)
    await this.recordIsolateAndAstPanel({
      cultureId: c1.id,
      isolateNumber: 1,
      organismCode: 'ORG-ECOLI',
      organismName: 'Escherichia coli',
      gramReaction: 'GRAM_NEGATIVE',
      growthDensity: '>10^5 CFU/mL (Significant Bacteriuria)',
      colonyCountCfu: '>100,000 CFU/mL',
      antibioticPanel: [
        { antibioticCode: 'AMK', method: 'VITEK2_MIC', micValueUgMl: 4 },
        { antibioticCode: 'MEM', method: 'VITEK2_MIC', micValueUgMl: 0.25 },
        { antibioticCode: 'CST', method: 'VITEK2_MIC', micValueUgMl: 0.5 },
        { antibioticCode: 'CIP', method: 'VITEK2_MIC', micValueUgMl: 4 },
        { antibioticCode: 'CRO', method: 'VITEK2_MIC', micValueUgMl: 32 },
        { antibioticCode: 'TZP', method: 'VITEK2_MIC', micValueUgMl: 8 },
      ],
    });

    // Isolate 2: Enterococcus faecalis
    await this.recordIsolateAndAstPanel({
      cultureId: c1.id,
      isolateNumber: 2,
      organismCode: 'ORG-EFAEC',
      organismName: 'Enterococcus faecalis',
      gramReaction: 'GRAM_POSITIVE',
      growthDensity: '10^4 - 10^5 CFU/mL (Moderate Growth)',
      antibioticPanel: [
        { antibioticCode: 'VAN', method: 'VITEK2_MIC', micValueUgMl: 1 },
        { antibioticCode: 'LZD', method: 'VITEK2_MIC', micValueUgMl: 2 },
        { antibioticCode: 'CIP', method: 'VITEK2_MIC', micValueUgMl: 2 },
      ],
      verifiedByUserId: 'USR-PATH-01',
    });

    // Culture 2: Blood Culture - Klebsiella pneumoniae (CRE)
    const c2 = await this.accessionCultureSample({
      sampleId: 'SMP-MIC-002',
      orderId: 'ORD-2026-9002',
      patientId: 'PAT-ICU-104',
      wardOrUnit: 'SICU-BED-02',
      isIcuPatient: true,
      sampleSite: 'BLOOD',
      incubationTempCelsius: 37.0,
    });

    await this.recordPreliminaryGramStain({
      cultureId: c2.id,
      gramStainMorphology: 'Capsulated Gram-negative rods seen in positive BACTEC aerobic bottle (14h TTP)',
      pusCellsCount: '10-15 / HPF',
      epithelialCellsCount: 'Nil',
      reportedByUserId: 'USR-MICRO-01',
    });

    await this.recordIsolateAndAstPanel({
      cultureId: c2.id,
      isolateNumber: 1,
      organismCode: 'ORG-KPNEU',
      organismName: 'Klebsiella pneumoniae',
      gramReaction: 'GRAM_NEGATIVE',
      growthDensity: 'Heavy Pure Growth (Aerobic & Anaerobic bottles)',
      antibioticPanel: [
        { antibioticCode: 'AMK', method: 'VITEK2_MIC', micValueUgMl: 16 },
        { antibioticCode: 'MEM', method: 'VITEK2_MIC', micValueUgMl: 16 },
        { antibioticCode: 'CST', method: 'VITEK2_MIC', micValueUgMl: 1 },
        { antibioticCode: 'CIP', method: 'VITEK2_MIC', micValueUgMl: 8 },
        { antibioticCode: 'CRO', method: 'VITEK2_MIC', micValueUgMl: 64 },
        { antibioticCode: 'TZP', method: 'VITEK2_MIC', micValueUgMl: 128 },
      ],
      verifiedByUserId: 'USR-PATH-01',
    });

    // Culture 3: Pus Swab - Staphylococcus aureus (MRSA)
    const c3 = await this.accessionCultureSample({
      sampleId: 'SMP-MIC-003',
      orderId: 'ORD-2026-9003',
      patientId: 'PAT-SURG-209',
      wardOrUnit: 'SURGICAL-WARD-B',
      isIcuPatient: false,
      sampleSite: 'PUS_SWAB',
      incubationTempCelsius: 37.0,
    });

    await this.recordPreliminaryGramStain({
      cultureId: c3.id,
      gramStainMorphology: 'Gram-positive cocci in grape-like clusters',
      pusCellsCount: '>50 / HPF',
      epithelialCellsCount: '2-4 / HPF',
      reportedByUserId: 'USR-MICRO-02',
    });

    await this.recordIsolateAndAstPanel({
      cultureId: c3.id,
      isolateNumber: 1,
      organismCode: 'ORG-SAUR',
      organismName: 'Staphylococcus aureus',
      gramReaction: 'GRAM_POSITIVE',
      growthDensity: 'Heavy Golden-Yellow Beta-Hemolytic Colonies',
      antibioticPanel: [
        { antibioticCode: 'VAN', method: 'VITEK2_MIC', micValueUgMl: 1 },
        { antibioticCode: 'LZD', method: 'VITEK2_MIC', micValueUgMl: 2 },
        { antibioticCode: 'CIP', method: 'VITEK2_MIC', micValueUgMl: 4 },
        { antibioticCode: 'CRO', method: 'VITEK2_MIC', micValueUgMl: 16 },
        { antibioticCode: 'TZP', method: 'VITEK2_MIC', micValueUgMl: 128 },
      ],
      verifiedByUserId: 'USR-PATH-01',
    });
  }
}

export const microbiologyAstService = new MicrobiologyAstService();
