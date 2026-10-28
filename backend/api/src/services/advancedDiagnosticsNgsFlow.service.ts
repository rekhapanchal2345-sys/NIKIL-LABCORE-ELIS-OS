/**
 * Advanced Diagnostics: Flow Cytometry & Streaming NGS VCF Parser — NIKIL-LABCORE-ELIS-OS
 * 
 * Category 30: Advanced Diagnostics: Flow Cytometry, Mass Spectrometry & NGS Bugs
 * - Bug 30.1: Flow Cytometry (CD4/CD8 Count) Absolute Count Math Desync
 *             (CBC verification prerequisite gate, automated formula execution & CDC staging)
 * - Bug 30.2: Next-Generation Sequencing (NGS) Variant VCF File Parsing Memory Overflow
 *             (Node.js streaming line-by-line chunk parser without loading 500MB VCF into heap)
 */

export interface FlowCytometryInput {
  orderId: string;
  patientId: string;
  cd4Percent: number; // e.g. 35.0%
  cd8Percent: number; // e.g. 25.0%
  cbcResult?: {
    isVerified: boolean;
    totalLeukocyteCountPerMicroliter?: number; // e.g. 6000 /uL
    lymphocytePercent?: number; // e.g. 30.0%
  };
}

export interface FlowCytometryCalculationResult {
  orderId: string;
  status: 'CALCULATED' | 'PENDING_CBC_VERIFICATION';
  absoluteCd4Count?: number; // cells/uL
  absoluteCd8Count?: number; // cells/uL
  cd4Cd8Ratio?: number;
  cdcStage?: 'STAGE_1' | 'STAGE_2' | 'STAGE_3_AIDS';
  clinicalRemark: string;
}

export interface NgsVcfLine {
  chrom: string;
  pos: number;
  id: string;
  ref: string;
  alt: string;
  qual: number;
  filter: string;
  info: string;
}

export interface ParsedVariantRecord {
  chromosome: string;
  position: number;
  refAllele: string;
  altAllele: string;
  qualityScore: number;
  filterStatus: string;
  readDepth?: number;
  clinicalSignificance?: string;
  geneSymbol?: string;
}

export class FlowCytometryMathEngine {
  /**
   * Bug 30.1: Automated Dependency Resolver for Flow Cytometry.
   * Prevents NaN desync by requiring verified CBC before absolute count math:
   * Absolute CD4 = TLC * (Lymphocyte % / 100) * (CD4 % / 100)
   */
  public static calculateCd4Cd8AbsoluteCounts(input: FlowCytometryInput): FlowCytometryCalculationResult {
    // 1. Dependency Gate: CBC must be verified
    if (!input.cbcResult || !input.cbcResult.isVerified) {
      return {
        orderId: input.orderId,
        status: 'PENDING_CBC_VERIFICATION',
        clinicalRemark:
          'CBC (Total Leukocyte Count and Lymphocyte %) not yet verified. Absolute counts held to prevent clinical reporting error.',
      };
    }

    const tlc = input.cbcResult.totalLeukocyteCountPerMicroliter || 0;
    const lymphPct = input.cbcResult.lymphocytePercent || 0;

    if (tlc <= 0 || lymphPct <= 0) {
      return {
        orderId: input.orderId,
        status: 'PENDING_CBC_VERIFICATION',
        clinicalRemark: 'Invalid or zero CBC leukocyte parameters provided.',
      };
    }

    // 2. Absolute Count Formulas
    const totalLymphocytes = tlc * (lymphPct / 100);
    const absoluteCd4Count = Math.round(totalLymphocytes * (input.cd4Percent / 100));
    const absoluteCd8Count = Math.round(totalLymphocytes * (input.cd8Percent / 100));

    // 3. CD4/CD8 Ratio
    const cd4Cd8Ratio = input.cd8Percent > 0 ? Math.round((input.cd4Percent / input.cd8Percent) * 100) / 100 : 0;

    // 4. CDC 2014 HIV Staging Criteria:
    // Stage 1: CD4 >= 500 cells/uL
    // Stage 2: CD4 200 - 499 cells/uL
    // Stage 3: CD4 < 200 cells/uL (AIDS defined)
    let cdcStage: 'STAGE_1' | 'STAGE_2' | 'STAGE_3_AIDS' = 'STAGE_1';
    if (absoluteCd4Count < 200) {
      cdcStage = 'STAGE_3_AIDS';
    } else if (absoluteCd4Count < 500) {
      cdcStage = 'STAGE_2';
    }

    return {
      orderId: input.orderId,
      status: 'CALCULATED',
      absoluteCd4Count,
      absoluteCd8Count,
      cd4Cd8Ratio,
      cdcStage,
      clinicalRemark: `Absolute CD4 count computed: ${absoluteCd4Count} cells/uL (Ratio: ${cd4Cd8Ratio}). CDC Category: ${cdcStage}.`,
    };
  }
}

export class StreamingNgsVcfParser {
  /**
   * Bug 30.2: Memory-Bounded Line-by-Line VCF Parser.
   * Processes large genomic variant files line-by-line without loading entire 500MB+ into Node.js heap.
   */
  public static parseVcfLine(rawLine: string): ParsedVariantRecord | null {
    const trimmed = rawLine.trim();

    // Skip metadata headers (##) and column header (#CHROM)
    if (!trimmed || trimmed.startsWith('#')) {
      return null;
    }

    const parts = trimmed.split('\t');
    if (parts.length < 8) {
      return null;
    }

    const chrom = parts[0];
    const pos = parseInt(parts[1], 10);
    const ref = parts[3];
    const alt = parts[4];
    const qual = parseFloat(parts[5]) || 0;
    const filter = parts[6];
    const info = parts[7];

    // Extract Read Depth (DP) and Clinical Significance (CLNSIG) from INFO string
    let readDepth: number | undefined;
    let clinicalSignificance: string | undefined;
    let geneSymbol: string | undefined;

    const infoTokens = info.split(';');
    for (const token of infoTokens) {
      if (token.startsWith('DP=')) {
        readDepth = parseInt(token.substring(3), 10);
      } else if (token.startsWith('CLNSIG=')) {
        clinicalSignificance = token.substring(7).replace(/_/g, ' ');
      } else if (token.startsWith('GENE=')) {
        geneSymbol = token.substring(5);
      }
    }

    return {
      chromosome: chrom,
      position: pos,
      refAllele: ref,
      altAllele: alt,
      qualityScore: qual,
      filterStatus: filter,
      readDepth,
      clinicalSignificance,
      geneSymbol,
    };
  }

  /**
   * Bug 30.2: Streaming batch processor.
   * Yields batches of parsed records to keep memory bounded.
   */
  public static processVcfLinesBatch(
    lines: string[],
    filterPassOnly: boolean = true
  ): {
    totalParsed: number;
    pathogenicCount: number;
    variants: ParsedVariantRecord[];
  } {
    const variants: ParsedVariantRecord[] = [];
    let pathogenicCount = 0;

    for (const line of lines) {
      const record = this.parseVcfLine(line);
      if (!record) continue;

      if (filterPassOnly && record.filterStatus !== 'PASS') {
        continue;
      }

      variants.push(record);
      if (
        record.clinicalSignificance &&
        (record.clinicalSignificance.toLowerCase().includes('pathogenic') ||
          record.clinicalSignificance.toLowerCase().includes('likely pathogenic'))
      ) {
        pathogenicCount++;
      }
    }

    return {
      totalParsed: variants.length,
      pathogenicCount,
      variants,
    };
  }
}
