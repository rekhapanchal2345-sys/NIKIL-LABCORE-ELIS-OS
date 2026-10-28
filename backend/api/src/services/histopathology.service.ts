/**
 * Histopathology 3-Tier Tracking & DataMatrix Service — NIKIL-LABCORE-ELIS-OS
 * 
 * Module 9 / Bug 9.4: 3-Tier Biopsy Specimen -> Block -> Slide Tracking with 2D DataMatrix
 */

export interface CreateSpecimenInput {
  accessionNumber: string;
  orderId: string;
  patientId: string;
  biopsySite: string;
  clinicalHistory?: string;
  grossDescription?: string;
}

export interface CreateBlockInput {
  blockLetter: string; // "A", "B", "C"
  tissueCassetteColor?: string;
  isDecalcified?: boolean;
}

export interface CreateSlideInput {
  slideNumber: number; // 1, 2, 3
  stainType: string; // "H&E", "PAS", "IHC-HER2", "IHC-ER", "ZN"
  isIhc?: boolean;
}

export interface HistoSlideDto {
  slideCode: string;
  stainType: string;
  isIhc: boolean;
  dataMatrixPayload: string;
}

export interface HistoBlockDto {
  blockCode: string;
  tissueCassetteColor?: string;
  isDecalcified: boolean;
  dataMatrixPayload: string;
  slides: HistoSlideDto[];
}

export interface HistoSpecimenHierarchy {
  accessionNumber: string;
  biopsySite: string;
  specimenDataMatrixPayload: string;
  blocks: HistoBlockDto[];
}

export class HistopathologyService {
  /**
   * Generates standard ISO/IEC 16022 2D DataMatrix barcode payload for histology items.
   * Format: LABCORE:HISTO:<TIER>:<ACCESSION_OR_CODE>:<STAIN_OR_TYPE>
   */
  public static generateDataMatrixPayload(
    tier: 'SPECIMEN' | 'BLOCK' | 'SLIDE',
    code: string,
    extra: string = 'STD'
  ): string {
    return `LABCORE^HISTO^${tier}^${code}^${extra}`;
  }

  /**
   * Builds the complete 3-tier specimen -> block -> slide tracking structure.
   */
  public static constructSpecimenHierarchy(
    specimen: CreateSpecimenInput,
    blocksInput: Array<{
      block: CreateBlockInput;
      slides: CreateSlideInput[];
    }>
  ): HistoSpecimenHierarchy {
    const specimenPayload = this.generateDataMatrixPayload('SPECIMEN', specimen.accessionNumber, specimen.biopsySite);

    const blocks: HistoBlockDto[] = blocksInput.map(({ block, slides }) => {
      const blockCode = `${specimen.accessionNumber}-${block.blockLetter.toUpperCase()}`;
      const blockPayload = this.generateDataMatrixPayload('BLOCK', blockCode, block.tissueCassetteColor || 'WHITE');

      const slideDtos: HistoSlideDto[] = slides.map((slide) => {
        const slideCode = `${blockCode}${slide.slideNumber}`;
        const slidePayload = this.generateDataMatrixPayload('SLIDE', slideCode, slide.stainType);
        return {
          slideCode,
          stainType: slide.stainType,
          isIhc: !!slide.isIhc,
          dataMatrixPayload: slidePayload
        };
      });

      return {
        blockCode,
        tissueCassetteColor: block.tissueCassetteColor,
        isDecalcified: !!block.isDecalcified,
        dataMatrixPayload: blockPayload,
        slides: slideDtos
      };
    });

    return {
      accessionNumber: specimen.accessionNumber,
      biopsySite: specimen.biopsySite,
      specimenDataMatrixPayload: specimenPayload,
      blocks
    };
  }

  /**
   * Validates scanning barcode at microtome / grossing station.
   */
  public static parseDataMatrix(payload: string): {
    isValid: boolean;
    tier?: 'SPECIMEN' | 'BLOCK' | 'SLIDE';
    code?: string;
    extra?: string;
    error?: string;
  } {
    if (!payload || !payload.startsWith('LABCORE^HISTO^')) {
      return { isValid: false, error: 'Invalid barcode format. Expected LABCORE histopathology 2D DataMatrix.' };
    }

    const parts = payload.split('^');
    if (parts.length < 5) {
      return { isValid: false, error: 'Incomplete histopathology DataMatrix payload.' };
    }

    const tier = parts[2] as 'SPECIMEN' | 'BLOCK' | 'SLIDE';
    const code = parts[3];
    const extra = parts[4];

    return {
      isValid: true,
      tier,
      code,
      extra
    };
  }
}
