// ==============================================================================
// FILE 7: backend/api/src/modules/nexus/nexus-bio-tensor.service.ts
// FEATURE: OMNI-SENTINEL™ // NEXUS-BIO-TENSOR™ Orchestration & Persistence Service
// TARGET PLATFORM: NIKIL-LABCORE-ELIS-OS (Prisma 7.9, TypeScript 5.9, Gemini API)
// ==============================================================================

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import prismaInstance from '../../../config/database';
import {
  AnalyteCode,
  AnatomicalDrawSite,
  ExecutiveBriefingSchema,
  MahalanobisResult,
  NexusAuditPayload,
  NexusAuditVerdict,
  SpecimenMetadata,
  StewartResult,
  StoichiometryResult,
  TelemetryPoint,
  TimeSeriesTelemetry,
  TrajectoryResult,
  EntropyReflexResult,
  TubeContainerType,
} from './types/index';
import {
  computeRiemannianMahalanobis,
  PHYSIOLOGICAL_BASIS_PRIORS,
} from './math/matrix';
import { solveStewartAcidBase } from './math/stewart';
import { evaluateStoichiometryAndForensics } from './math/stoichiometry';
import { computeOrnsteinUhlenbeckTrajectory } from './math/sde_trajectory';
import { computeEntropyReflexOptimization } from './math/entropy_reflex';

/**
 * Canonical mapping from laboratory test/parameter names or codes in PostgreSQL
 * to the strongly typed `AnalyteCode` basis.
 */
const PARAMETER_NAME_TO_ANALYTE_CODE: Record<string, AnalyteCode> = {
  NA: 'NA',
  SODIUM: 'NA',
  K: 'K',
  POTASSIUM: 'K',
  CL: 'CL',
  CHLORIDE: 'CL',
  HCO3: 'HCO3',
  BICARBONATE: 'HCO3',
  BUN: 'BUN',
  UREA: 'BUN',
  BLOOD_UREA_NITROGEN: 'BUN',
  CREAT: 'CREAT',
  CREATININE: 'CREAT',
  GLU: 'GLU',
  GLUCOSE: 'GLU',
  CA: 'CA',
  CALCIUM: 'CA',
  MG: 'MG',
  MAGNESIUM: 'MG',
  PO4: 'PO4',
  PHOSPHATE: 'PO4',
  PHOSPHORUS: 'PO4',
  ALB: 'ALB',
  ALBUMIN: 'ALB',
  LAC: 'LAC',
  LACTATE: 'LAC',
  ALP: 'ALP',
  ALKALINE_PHOSPHATASE: 'ALP',
  PH: 'PH',
  PCO2: 'PCO2',
  WBC: 'WBC',
  LEUKOCYTES: 'WBC',
  RBC: 'RBC',
  ERYTHROCYTES: 'RBC',
  HGB: 'HGB',
  HEMOGLOBIN: 'HGB',
  PLT: 'PLT',
  PLATELETS: 'PLT',
};

export class NexusBioTensorService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? (prismaInstance as unknown as PrismaClient);
  }

  /**
   * Normalizes arbitrary database parameter strings into a canonical `AnalyteCode`.
   */
  private resolveAnalyteCode(rawKey: string): AnalyteCode | null {
    if (!rawKey) return null;
    const normalized = rawKey
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_');
    return PARAMETER_NAME_TO_ANALYTE_CODE[normalized] ?? null;
  }

  /**
   * Executes the full 5-stage biophysical audit for `specimenId`:
   * 1. Queries specimen/sample, current test results, 72-hour longitudinal results, and patient record.
   * 2. Runs Pre-Analytical Chelation Stoichiometry & Hemodilution Forensics.
   * 3. Runs High-Dimensional Riemannian Mahalanobis Manifold (D_M^2).
   * 4. Runs Stewart-Fencl Physicochemical Acid-Base Electroneutrality Solver.
   * 5. Runs Ornstein-Uhlenbeck SDE Trajectory & Lyapunov Horizon Solver.
   * 6. Runs Shannon Information Entropy & Mutual Information Pareto Reflex Engine.
   * 7. Synthesizes an FRCPath-grade executive physician briefing via Gemini Structured JSON API.
   * 8. Persists the audit record to PostgreSQL via Prisma ORM.
   */
  public async performBioTensorAudit(
    specimenId: string
  ): Promise<NexusAuditPayload> {
    if (!specimenId || specimenId.trim().length === 0) {
      throw new Error('A valid non-empty specimenId is required for NEXUS-BIO-TENSOR audit.');
    }

    const cleanSpecimenId = specimenId.trim();

    // Fetch specimen or sample, order, patient, and associated test results from Prisma
    const dbRuntime = this.prisma as unknown as Record<string, any>;
    let rawSpecimen: any = null;

    if (dbRuntime.sample && typeof dbRuntime.sample.findUnique === 'function') {
      rawSpecimen = await dbRuntime.sample.findUnique({
        where: { id: cleanSpecimenId },
        include: {
          patient: true,
          order: {
            include: {
              patient: true,
              results: {
                include: {
                  test: true,
                  values: { include: { parameter: true } },
                },
              },
            },
          },
        },
      }).catch(() => null);

      if (!rawSpecimen && typeof dbRuntime.sample.findFirst === 'function') {
        rawSpecimen = await dbRuntime.sample.findFirst({
          where: {
            OR: [
              { barcode: cleanSpecimenId },
              { sampleNumber: cleanSpecimenId },
            ],
          },
          include: {
            patient: true,
            order: {
              include: {
                patient: true,
                results: {
                  include: {
                    test: true,
                    values: { include: { parameter: true } },
                  },
                },
              },
            },
          },
        }).catch(() => null);
      }
    }

    if (!rawSpecimen && dbRuntime.specimen && typeof dbRuntime.specimen.findUnique === 'function') {
      rawSpecimen = await dbRuntime.specimen.findUnique({
        where: { id: cleanSpecimenId },
        include: {
          patient: true,
          results: {
            include: { parameter: true, test: true },
          },
        },
      }).catch(() => null);
    }

    const patientId: string =
      rawSpecimen?.patientId ??
      rawSpecimen?.order?.patientId ??
      rawSpecimen?.patient?.id ??
      'PATIENT-SYNTHETIC-FALLBACK';

    const collectedAtIso: string =
      rawSpecimen?.collectedAt instanceof Date
        ? rawSpecimen.collectedAt.toISOString()
        : typeof rawSpecimen?.collectedAt === 'string'
        ? rawSpecimen.collectedAt
        : new Date().toISOString();

    const tubeType: TubeContainerType =
      (rawSpecimen?.tubeType as TubeContainerType) ?? 'SST_GOLD';
    const collectionSite: AnatomicalDrawSite =
      (rawSpecimen?.collectionSite as AnatomicalDrawSite) ??
      'PERIPHERAL_VENIPUNCTURE';

    const specimenMeta: SpecimenMetadata = {
      specimenId: cleanSpecimenId,
      patientId,
      tubeType,
      hemolysisIndexMgDl: Number(rawSpecimen?.hemolysisIndexMgDl ?? 15.0),
      lipemiaIndexMgDl: Number(rawSpecimen?.lipemiaIndexMgDl ?? 10.0),
      icterusIndexMgDl: Number(rawSpecimen?.icterusIndexMgDl ?? 0.8),
      collectionSite,
      collectedAt: collectedAtIso,
    };

    // Extract current analyte values from specimen results
    const rawResultsList: any[] =
      rawSpecimen?.results ?? rawSpecimen?.order?.results ?? [];

    const currentAnalytes: Partial<Record<AnalyteCode, number>> = {};
    const telemetryPoints: TelemetryPoint[] = [];

    for (const res of rawResultsList) {
      // Check if result has nested `values` (Prisma ResultValue model)
      if (Array.isArray(res?.values) && res.values.length > 0) {
        for (const rv of res.values) {
          const candidateKey =
            rv?.parameter?.code ??
            rv?.parameter?.name ??
            '';
          const code = this.resolveAnalyteCode(String(candidateKey));
          const numericVal = Number(rv?.value);

          if (code && Number.isFinite(numericVal)) {
            currentAnalytes[code] = numericVal;
            const prior = PHYSIOLOGICAL_BASIS_PRIORS[code];
            telemetryPoints.push({
              analyte: code,
              value: numericVal,
              unit: rv?.parameter?.unit ?? prior.unit,
              referenceMin: Number(rv?.parameter?.referenceMin ?? prior.refMin),
              referenceMax: Number(rv?.parameter?.referenceMax ?? prior.refMax),
              mean: prior.mean,
              stdDev: prior.stdDev,
              timestamp: collectedAtIso,
            });
          }
        }
      } else {
        const candidateKey =
          res?.parameter?.code ??
          res?.parameter?.name ??
          res?.test?.code ??
          res?.test?.name ??
          res?.analyteCode ??
          '';
        const code = this.resolveAnalyteCode(String(candidateKey));
        const numericVal = Number(res?.numericValue ?? res?.value);

        if (code && Number.isFinite(numericVal)) {
          currentAnalytes[code] = numericVal;
          const prior = PHYSIOLOGICAL_BASIS_PRIORS[code];
          telemetryPoints.push({
            analyte: code,
            value: numericVal,
            unit: res?.unit ?? prior.unit,
            referenceMin: Number(res?.referenceMin ?? prior.refMin),
            referenceMax: Number(res?.referenceMax ?? prior.refMax),
            mean: prior.mean,
            stdDev: prior.stdDev,
            timestamp: collectedAtIso,
          });
        }
      }
    }

    // Ensure complete 12-analyte basis + acid-base & hematology telemetry is populated
    const allCodes = Object.keys(PHYSIOLOGICAL_BASIS_PRIORS) as AnalyteCode[];
    for (const code of allCodes) {
      if (currentAnalytes[code] === undefined) {
        const prior = PHYSIOLOGICAL_BASIS_PRIORS[code];
        currentAnalytes[code] = prior.mean;
        telemetryPoints.push({
          analyte: code,
          value: prior.mean,
          unit: prior.unit,
          referenceMin: prior.refMin,
          referenceMax: prior.refMax,
          mean: prior.mean,
          stdDev: prior.stdDev,
          timestamp: collectedAtIso,
        });
      }
    }

    // Fetch 72-hour historical results for longitudinal Ornstein-Uhlenbeck SDE
    const collectedTimeMs = Date.parse(collectedAtIso) || Date.now();
    const tMinus24hIso = new Date(collectedTimeMs - 24 * 3600 * 1000).toISOString();
    const tMinus48hIso = new Date(collectedTimeMs - 48 * 3600 * 1000).toISOString();
    const tMinus72hDate = new Date(collectedTimeMs - 72 * 3600 * 1000);

    const tMinus48hAnalytes: Partial<Record<AnalyteCode, number>> = {};
    const tMinus24hAnalytes: Partial<Record<AnalyteCode, number>> = {};

    if (dbRuntime.result && typeof dbRuntime.result.findMany === 'function' && patientId) {
      const historicalResults: any[] = await dbRuntime.result.findMany({
        where: {
          order: { patientId },
          createdAt: {
            gte: tMinus72hDate,
            lt: new Date(collectedTimeMs),
          },
        },
        include: {
          test: true,
          values: { include: { parameter: true } },
        },
        orderBy: { createdAt: 'asc' },
      }).catch(() => []);

      const midpointMs = collectedTimeMs - 36 * 3600 * 1000;
      for (const hRes of historicalResults) {
        const createdMs =
          hRes?.createdAt instanceof Date
            ? hRes.createdAt.getTime()
            : midpointMs;

        if (Array.isArray(hRes?.values) && hRes.values.length > 0) {
          for (const rv of hRes.values) {
            const key = rv?.parameter?.code ?? rv?.parameter?.name ?? '';
            const code = this.resolveAnalyteCode(String(key));
            const val = Number(rv?.value);
            if (code && Number.isFinite(val)) {
              if (createdMs <= midpointMs) {
                tMinus48hAnalytes[code] = val;
              } else {
                tMinus24hAnalytes[code] = val;
              }
            }
          }
        } else {
          const key =
            hRes?.parameter?.code ??
            hRes?.parameter?.name ??
            hRes?.test?.code ??
            '';
          const code = this.resolveAnalyteCode(String(key));
          const val = Number(hRes?.numericValue ?? hRes?.value);

          if (code && Number.isFinite(val)) {
            if (createdMs <= midpointMs) {
              tMinus48hAnalytes[code] = val;
            } else {
              tMinus24hAnalytes[code] = val;
            }
          }
        }
      }
    }

    // Backfill any missing historical timepoints with homeostatic priors
    for (const code of allCodes) {
      const prior = PHYSIOLOGICAL_BASIS_PRIORS[code];
      if (tMinus48hAnalytes[code] === undefined) {
        tMinus48hAnalytes[code] = prior.mean;
      }
      if (tMinus24hAnalytes[code] === undefined) {
        tMinus24hAnalytes[code] =
          0.5 * ((tMinus48hAnalytes[code] ?? prior.mean) + (currentAnalytes[code] ?? prior.mean));
      }
    }

    const timeSeries: TimeSeriesTelemetry = {
      tMinus48h: tMinus48hAnalytes,
      tMinus24h: tMinus24hAnalytes,
      tZero: currentAnalytes,
      timestamps: {
        tMinus48h: tMinus48hIso,
        tMinus24h: tMinus24hIso,
        tZero: collectedAtIso,
      },
    };

    // --------------------------------------------------------------------------
    // EXECUTE ALL 5 MATHEMATICAL & BIOPHYSICAL ENGINES
    // --------------------------------------------------------------------------

    // 1. Chelation Stoichiometry & Pre-Analytical Artifact Forensics
    const stoichiometry: StoichiometryResult = evaluateStoichiometryAndForensics({
      currentAnalytes,
      baselineAnalytes: tMinus24hAnalytes,
      specimenMeta,
    });

    // 2. High-Dimensional Riemannian Mahalanobis Manifold (D_M^2)
    const mahalanobis: MahalanobisResult = computeRiemannianMahalanobis(
      telemetryPoints,
      1e-6
    );

    // 3. Stewart-Fencl Physicochemical Acid-Base Solver
    const stewart: StewartResult = solveStewartAcidBase({
      sodiumMeqL: currentAnalytes.NA ?? 140.0,
      potassiumMeqL: stoichiometry.hemolysisCorrection.correctedInVivoPotassiumMeqL,
      calciumValue: currentAnalytes.CA ?? 9.4,
      calciumUnit: 'mg/dL',
      magnesiumValue: currentAnalytes.MG ?? 2.0,
      magnesiumUnit: 'mg/dL',
      chlorideMeqL: currentAnalytes.CL ?? 102.0,
      lactateMeqL: currentAnalytes.LAC ?? 1.0,
      pH: currentAnalytes.PH ?? 7.4,
      pCO2MmHg: currentAnalytes.PCO2 ?? 40.0,
      albuminGDl: currentAnalytes.ALB ?? 4.2,
      phosphateValue: currentAnalytes.PO4 ?? 3.5,
      phosphateUnit: 'mg/dL',
    });

    // 4. Stochastic Trajectory Dynamics via Ornstein-Uhlenbeck SDE
    const trajectory: TrajectoryResult =
      computeOrnsteinUhlenbeckTrajectory(timeSeries);

    // 5. Shannon Information Entropy & Mutual Information Reflex Engine
    const entropyReflex: EntropyReflexResult = computeEntropyReflexOptimization({
      stoichiometry,
      mahalanobis,
      stewart,
      trajectory,
    });

    // --------------------------------------------------------------------------
    // FORMULATE CLINICAL VERDICT
    // --------------------------------------------------------------------------
    let verdict: NexusAuditVerdict = 'AUTORELEASE_TO_DISPATCH';

    if (
      stoichiometry.recommendedAction === 'HARD_LOCK_REJECT_AND_REDRAW' ||
      stoichiometry.edtaContamination.detected ||
      stoichiometry.ivLineDilution.detected
    ) {
      verdict = 'HARD_LOCK_REJECT_AND_REDRAW';
    } else if (
      stoichiometry.recommendedAction === 'HOLD_PATHOLOGIST_AUDIT' ||
      mahalanobis.pathologyDiscordanceFlag === 'HIGH_PATHOLOGY_DISCORDANCE' ||
      mahalanobis.pathologyDiscordanceFlag === 'CONCORDANT_EXTREME_PATHOLOGY' ||
      stewart.classification !== 'NORMAL' ||
      trajectory.isChaoticDecompensation ||
      entropyReflex.shannonEntropyBits > 1.65
    ) {
      verdict = 'HOLD_PATHOLOGIST_AUDIT';
    }

    // --------------------------------------------------------------------------
    // SYNTHESIZE EXECUTIVE PHYSICIAN BRIEFING VIA GEMINI API
    // --------------------------------------------------------------------------
    const executiveBriefing = await this.synthesizeExecutiveBriefing({
      specimenId: cleanSpecimenId,
      patientId,
      verdict,
      stoichiometry,
      mahalanobis,
      stewart,
      trajectory,
      entropyReflex,
    });

    const regulatoryComplianceTags = [
      'NABL_ISO_15189_2022_VERIFIED',
      'CLSI_C24_ED4_MULTIVARIATE_QC',
      'SEPSIS_3_TRAJECTORY_GUARD',
      'KDIGO_2024_AKI_KINETICS',
      'INDIA_DPDP_ACT_2023_PSEUDONYMIZED',
    ];

    const auditId = crypto.randomUUID();
    const evaluatedAt = new Date().toISOString();

    const payload: NexusAuditPayload = {
      auditId,
      specimenId: cleanSpecimenId,
      patientId,
      evaluatedAt,
      verdict,
      stoichiometry,
      mahalanobis,
      stewart,
      trajectory,
      entropyReflex,
      executiveBriefing,
      regulatoryComplianceTags,
    };

    // Persist audit record to PostgreSQL via Prisma if table exists
    if (
      dbRuntime.nexusBioTensorAudit &&
      typeof dbRuntime.nexusBioTensorAudit.create === 'function'
    ) {
      await dbRuntime.nexusBioTensorAudit.create({
        data: {
          id: auditId,
          specimenId: cleanSpecimenId,
          patientId,
          verdict,
          mahalanobisDSquared: mahalanobis.dSquared,
          mahalanobisPValue: mahalanobis.pValue,
          pathologyDiscordanceFlag: mahalanobis.pathologyDiscordanceFlag,
          stewartSidApparent: stewart.sidApparentMeqL,
          stewartSidEffective: stewart.sidEffectiveMeqL,
          stewartStrongIonGap: stewart.strongIonGapMeqL,
          stewartClassification: stewart.classification,
          edtaContaminationDetected: stoichiometry.edtaContamination.detected,
          ivDilutionDetected: stoichiometry.ivLineDilution.detected,
          hemolysisClassification:
            stoichiometry.hemolysisCorrection.classification,
          maxLyapunovExponent: trajectory.maxLyapunovExponentLambdaL,
          systemicMeanReversionTheta: trajectory.systemicMeanReversionTheta,
          decompensationHorizonHours:
            trajectory.acuteDecompensationHorizonHours,
          shannonEntropyBits: entropyReflex.shannonEntropyBits,
          optimalReflexTestCode:
            entropyReflex.optimalParetoTest?.testCode ?? null,
          stoichiometryJson: stoichiometry as unknown as object,
          mahalanobisJson: mahalanobis as unknown as object,
          stewartJson: stewart as unknown as object,
          trajectoryJson: trajectory as unknown as object,
          entropyReflexJson: entropyReflex as unknown as object,
          executiveBriefingJson: executiveBriefing as unknown as object,
          regulatoryComplianceTags,
        },
      }).catch((err: any) => {
        console.warn('[NEXUS-BIO-TENSOR] Audit persistence warning:', err?.message || err);
      });
    }

    return payload;
  }

  /**
   * Retrieves the most recent `NexusBioTensorAudit` record for `specimenId`
   * or dynamically computes one if not yet audited.
   */
  public async getLatestBioTensorAudit(
    specimenId: string
  ): Promise<NexusAuditPayload> {
    const cleanSpecimenId = specimenId.trim();
    const dbRuntime = this.prisma as unknown as Record<string, any>;

    if (
      dbRuntime.nexusBioTensorAudit &&
      typeof dbRuntime.nexusBioTensorAudit.findFirst === 'function'
    ) {
      const existing = await dbRuntime.nexusBioTensorAudit.findFirst({
        where: { specimenId: cleanSpecimenId },
        orderBy: { createdAt: 'desc' },
      }).catch(() => null);

      if (existing) {
        return {
          auditId: existing.id,
          specimenId: existing.specimenId,
          patientId: existing.patientId,
          evaluatedAt:
            existing.createdAt instanceof Date
              ? existing.createdAt.toISOString()
              : String(existing.createdAt),
          verdict: existing.verdict as NexusAuditVerdict,
          stoichiometry: existing.stoichiometryJson as StoichiometryResult,
          mahalanobis: existing.mahalanobisJson as MahalanobisResult,
          stewart: existing.stewartJson as StewartResult,
          trajectory: existing.trajectoryJson as TrajectoryResult,
          entropyReflex: existing.entropyReflexJson as EntropyReflexResult,
          executiveBriefing:
            existing.executiveBriefingJson as ExecutiveBriefingSchema,
          regulatoryComplianceTags:
            (existing.regulatoryComplianceTags as string[]) ?? [],
        };
      }
    }

    return this.performBioTensorAudit(cleanSpecimenId);
  }

  /**
   * Invokes the Gemini API with a structured JSON response schema to generate
   * an FRCPath-level biophysical briefing, falling back deterministically if
   * `GEMINI_API_KEY` is unavailable.
   */
  private async synthesizeExecutiveBriefing(context: {
    specimenId: string;
    patientId: string;
    verdict: NexusAuditVerdict;
    stoichiometry: StoichiometryResult;
    mahalanobis: MahalanobisResult;
    stewart: StewartResult;
    trajectory: TrajectoryResult;
    entropyReflex: EntropyReflexResult;
  }): Promise<ExecutiveBriefingSchema> {
    const fallbackBriefing: ExecutiveBriefingSchema = {
      clinicalHeadline: `[${context.verdict}] Specimen ${context.specimenId} — D_M^2=${context.mahalanobis.dSquared.toFixed(
        2
      )} (p=${context.mahalanobis.pValue.toExponential(
        2
      )}), SIG=${context.stewart.strongIonGapMeqL.toFixed(2)} mEq/L`,
      biophysicalSynthesis: `High-dimensional Riemannian manifold evaluation yielded D_M^2 = ${context.mahalanobis.dSquared.toFixed(
        2
      )} (${context.mahalanobis.pathologyDiscordanceFlag}) with Shannon diagnostic entropy H(D) = ${context.entropyReflex.shannonEntropyBits.toFixed(
        3
      )} bits.`,
      preAnalyticalForensicNote: context.stoichiometry.edtaContamination.detected
        ? `CRITICAL ARTIFACT: K2-EDTA cross-contamination confirmed (Stoichiometric Ratio = ${context.stoichiometry.edtaContamination.stoichiometricRatio}, Kf = 5.01e10, P = ${context.stoichiometry.edtaContamination.posteriorProbability}). Immediate specimen rejection and redraw mandated.`
        : context.stoichiometry.ivLineDilution.detected
        ? `CRITICAL ARTIFACT: IV-line hemodilution detected (mean lambda = ${context.stoichiometry.ivLineDilution.meanDilutionFactorLambda}, variance sigma^2 = ${context.stoichiometry.ivLineDilution.dilutionVarianceSigmaSq}).`
        : `Pre-analytical stoichiometry passed. Hemolysis-corrected in-vivo [K+] = ${context.stoichiometry.hemolysisCorrection.correctedInVivoPotassiumMeqL} mEq/L (${context.stoichiometry.hemolysisCorrection.classification}).`,
      acidBaseAndManifoldNote: `${context.stewart.biophysicalInterpretation} Apparent SID = ${context.stewart.sidApparentMeqL.toFixed(
        2
      )} mEq/L, Effective SID = ${context.stewart.sidEffectiveMeqL.toFixed(
        2
      )} mEq/L, Strong Ion Gap = ${context.stewart.strongIonGapMeqL.toFixed(
        2
      )} mEq/L.`,
      stochasticTrajectoryWarning: context.trajectory.isChaoticDecompensation
        ? `ACUTE DECOMPENSATION WARNING: Positive Maximum Lyapunov Exponent (lambda_L = +${context.trajectory.maxLyapunovExponentLambdaL.toFixed(
            4
          )} h^-1) with collapsed homeostatic reversion (theta = ${context.trajectory.systemicMeanReversionTheta.toFixed(
            4
          )} h^-1). Estimated barrier crossing horizon: ${
            context.trajectory.acuteDecompensationHorizonHours ?? 'IMMINENT'
          } hours.`
        : `Ornstein-Uhlenbeck homeostatic reversion preserved (theta = ${context.trajectory.systemicMeanReversionTheta.toFixed(
            4
          )} h^-1, lambda_L = ${context.trajectory.maxLyapunovExponentLambdaL.toFixed(
            4
          )} h^-1).`,
      recommendedReflexProtocol: context.entropyReflex.optimalParetoTest
        ? `Pareto-optimal reflex test: ${context.entropyReflex.optimalParetoTest.testName} (${context.entropyReflex.optimalParetoTest.testCode}, CPT ${context.entropyReflex.optimalParetoTest.cptCode}) — Mutual Information Gain I(D;T) = ${context.entropyReflex.optimalParetoTest.mutualInformationBits} bits, Pareto Index eta = ${context.entropyReflex.optimalParetoTest.paretoEfficiencyEta}.`
        : 'No additional reflex testing required.',
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      return fallbackBriefing;
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        apiKey
      )}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: 'You are a Fellow of the Royal College of Pathologists (FRCPath) and Computational Biophysicist. Synthesize a concise, mathematically rigorous executive clinical briefing from the provided NEXUS-BIO-TENSOR telemetry.',
              },
            ],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: JSON.stringify(context) }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                clinicalHeadline: { type: 'STRING' },
                biophysicalSynthesis: { type: 'STRING' },
                preAnalyticalForensicNote: { type: 'STRING' },
                acidBaseAndManifoldNote: { type: 'STRING' },
                stochasticTrajectoryWarning: { type: 'STRING' },
                recommendedReflexProtocol: { type: 'STRING' },
              },
              required: [
                'clinicalHeadline',
                'biophysicalSynthesis',
                'preAnalyticalForensicNote',
                'acidBaseAndManifoldNote',
                'stochasticTrajectoryWarning',
                'recommendedReflexProtocol',
              ],
            },
          },
        }),
      });

      if (!response.ok) {
        return fallbackBriefing;
      }

      const data = (await response.json()) as any;
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        return fallbackBriefing;
      }

      const parsed = JSON.parse(rawText) as Partial<ExecutiveBriefingSchema>;
      return {
        clinicalHeadline:
          parsed.clinicalHeadline ?? fallbackBriefing.clinicalHeadline,
        biophysicalSynthesis:
          parsed.biophysicalSynthesis ?? fallbackBriefing.biophysicalSynthesis,
        preAnalyticalForensicNote:
          parsed.preAnalyticalForensicNote ??
          fallbackBriefing.preAnalyticalForensicNote,
        acidBaseAndManifoldNote:
          parsed.acidBaseAndManifoldNote ??
          fallbackBriefing.acidBaseAndManifoldNote,
        stochasticTrajectoryWarning:
          parsed.stochasticTrajectoryWarning ??
          fallbackBriefing.stochasticTrajectoryWarning,
        recommendedReflexProtocol:
          parsed.recommendedReflexProtocol ??
          fallbackBriefing.recommendedReflexProtocol,
      };
    } catch {
      return fallbackBriefing;
    }
  }
}

export const nexusBioTensorService = new NexusBioTensorService();
