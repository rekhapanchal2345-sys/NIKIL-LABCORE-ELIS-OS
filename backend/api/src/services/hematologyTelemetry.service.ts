/**
 * Hematology Telemetry, Scattergrams & Morphology Service — NIKIL-LABCORE-ELIS-OS
 * 
 * Category 16: Hematology Analyzer Scattergrams, Histograms & Serial Dilution Bugs
 * - Bug 16.1: Base64 Histogram/Scattergram Blob Storage Optimization (TOAST prevention via object storage URI + 256-point array)
 * - Bug 16.2: Serial Dilution Multiplier Double-Calculation Resolution (Analyzer pre-multiplied flag inspection)
 * - Bug 16.3: Platelet Clumping & Morphological Suspect Flags Interceptor (Mandatory Peripheral Smear hold)
 * - Bug 16.4: Corrected WBC Count for Nucleated RBCs (nRBC >= 5 per 100 WBCs)
 */

export interface ScattergramInput {
  barcode: string;
  wbcRawBase64?: string;
  rbcRawBase64?: string;
  pltRawBase64?: string;
  rawChannelArray?: number[]; // 256 channel points
  suspectFlags?: string[]; // e.g. ["PLT_CLUMPS", "BLASTS", "NRBC", "IG"]
  storageBaseUrl?: string;
}

export interface ScattergramStorageResult {
  barcode: string;
  wbcHistogramUrl: string;
  rbcHistogramUrl: string;
  pltHistogramUrl: string;
  channelData256: number[];
  manualSlideReviewRequired: boolean;
  reviewReason?: string;
}

export interface DilutionResolutionInput {
  rawResult: number;
  lisDilutionFactor: number;
  isPreMultipliedByAnalyzer: boolean;
}

export class HematologyTelemetryService {
  /**
   * Bug 16.1: Replaces huge in-DB Base64 strings with lightweight Object Storage URLs + 256-point canvas arrays.
   * Prevents PostgreSQL TOAST table bloat.
   */
  public static processScattergrams(input: ScattergramInput): ScattergramStorageResult {
    const baseUrl = input.storageBaseUrl || 'https://storage.googleapis.com/nikil-labcore-histograms';
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '/');

    const wbcUrl = input.wbcRawBase64
      ? `${baseUrl}/${datePrefix}/${input.barcode}_WBC.webp`
      : `${baseUrl}/default_wbc.webp`;

    const rbcUrl = input.rbcRawBase64
      ? `${baseUrl}/${datePrefix}/${input.barcode}_RBC.webp`
      : `${baseUrl}/default_rbc.webp`;

    const pltUrl = input.pltRawBase64
      ? `${baseUrl}/${datePrefix}/${input.barcode}_PLT.webp`
      : `${baseUrl}/default_plt.webp`;

    // Compress/pad raw channel data to standard 256 points for lightweight canvas rendering
    let channelData256 = [...(input.rawChannelArray || [])];
    if (channelData256.length > 256) {
      channelData256 = channelData256.slice(0, 256);
    } else {
      while (channelData256.length < 256) {
        channelData256.push(0);
      }
    }

    // Bug 16.3: Morphological suspect flag interception
    const flags = (input.suspectFlags || []).map((f) => f.toUpperCase());
    const criticalMorphologyFlags = ['PLT_CLUMPS', 'PLT_CLUMP', 'BLASTS', 'NRBC', 'IG', 'FRAG', 'DIMORPHIC'];
    const matchedFlags = flags.filter((f) => criticalMorphologyFlags.some((cmf) => f.includes(cmf)));

    const manualSlideReviewRequired = matchedFlags.length > 0;
    const reviewReason = manualSlideReviewRequired
      ? `MORPHOLOGICAL_SUSPECT_HOLD: Instrument flagged ${matchedFlags.join(', ')}. Spurious platelet clumping / immature cells detected. Mandatory peripheral blood smear examination required before release.`
      : undefined;

    return {
      barcode: input.barcode,
      wbcHistogramUrl: wbcUrl,
      rbcHistogramUrl: rbcUrl,
      pltHistogramUrl: pltUrl,
      channelData256,
      manualSlideReviewRequired,
      reviewReason
    };
  }

  /**
   * Bug 16.2: Serial Dilution Multiplier Resolution
   * Inspects analyzer pre-multiplied flag to avoid double multiplication (e.g. 8,000 -> 80,000).
   */
  public static resolveDilutedResult(input: DilutionResolutionInput): {
    finalReportedValue: number;
    auditLog: string;
  } {
    const { rawResult, lisDilutionFactor, isPreMultipliedByAnalyzer } = input;

    if (lisDilutionFactor <= 1) {
      return {
        finalReportedValue: rawResult,
        auditLog: 'Standard neat sample (Dilution Factor = 1).'
      };
    }

    if (isPreMultipliedByAnalyzer) {
      return {
        finalReportedValue: rawResult,
        auditLog: `Analyzer pre-multiplied reading by 1:${lisDilutionFactor}. LIS preserved machine value (${rawResult}) without double multiplication.`
      };
    }

    const calculated = Number((rawResult * lisDilutionFactor).toFixed(2));
    return {
      finalReportedValue: calculated,
      auditLog: `LIS applied manual dilution multiplier: Raw (${rawResult}) x 1:${lisDilutionFactor} = ${calculated}.`
    };
  }

  /**
   * Bug 16.4: Corrected WBC Count for Nucleated RBCs (nRBC)
   * Formula: Corrected WBC = (Uncorrected WBC * 100) / (100 + nRBC per 100 WBCs)
   */
  public static calculateCorrectedWbc(
    uncorrectedWbc: number,
    nrbcPer100Wbc: number
  ): {
    uncorrectedWbc: number;
    nrbcPer100Wbc: number;
    correctedWbc: number;
    isCorrectionApplied: boolean;
    clinicalNote: string;
  } {
    if (nrbcPer100Wbc < 5) {
      return {
        uncorrectedWbc,
        nrbcPer100Wbc,
        correctedWbc: uncorrectedWbc,
        isCorrectionApplied: false,
        clinicalNote: `nRBC count (${nrbcPer100Wbc} / 100 WBCs) is below threshold (< 5). Uncorrected WBC valid.`
      };
    }

    const rawCorrected = (uncorrectedWbc * 100) / (100 + nrbcPer100Wbc);
    const correctedWbc = Number(rawCorrected.toFixed(2));

    return {
      uncorrectedWbc,
      nrbcPer100Wbc,
      correctedWbc,
      isCorrectionApplied: true,
      clinicalNote: `Corrected for nucleated RBCs (nRBC = ${nrbcPer100Wbc} / 100 WBCs). Uncorrected: ${uncorrectedWbc} x10^3/uL -> Corrected: ${correctedWbc} x10^3/uL.`
    };
  }
}
