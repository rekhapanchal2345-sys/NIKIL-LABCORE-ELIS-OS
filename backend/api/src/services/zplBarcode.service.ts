/**
 * ZPL Thermal Barcode Label Generation Service — NIKIL-LABCORE-ELIS-OS
 * 
 * Module 8 / Bug 8.4: ZPL / EPL Thermal Barcode Printer Alignment & Scannability
 * Generates pure Zebra Programming Language (ZPL II) code for standard pathology thermal labels (50mm x 25mm).
 * Eliminates browser print margin drift, scaling artifacts, and scanner misreads.
 */

export interface LabelData {
  barcode: string;
  patientName: string;
  patientAgeGender: string;
  uhid: string;
  orderNumber: string;
  tubeType: string;
  testsShortSummary: string;
  collectionTimeFormatted: string;
  dpi?: 203 | 300;
}

export class ZplBarcodeService {
  /**
   * Generates production-ready ZPL II string for standard 50mm x 25mm pathology label.
   * At 203 DPI: 8 dots/mm -> 400 dots width x 200 dots height.
   * At 300 DPI: 12 dots/mm -> 600 dots width x 300 dots height.
   */
  public static generateZpl50x25mm(data: LabelData): string {
    const dpi = data.dpi || 203;
    const is300 = dpi === 300;

    // Scale factors
    const s = is300 ? 1.48 : 1.0;
    const xOffset = Math.round(15 * s);
    const barcodeY = Math.round(55 * s);
    const barcodeHeight = Math.round(50 * s);
    const barWidth = is300 ? 3 : 2;

    // Sanitize text fields to remove ZPL control characters
    const cleanName = this.sanitizeZpl(data.patientName).substring(0, 26);
    const cleanUhid = this.sanitizeZpl(data.uhid);
    const cleanOrder = this.sanitizeZpl(data.orderNumber);
    const cleanAgeGender = this.sanitizeZpl(data.patientAgeGender);
    const cleanTube = this.sanitizeZpl(data.tubeType);
    const cleanTests = this.sanitizeZpl(data.testsShortSummary).substring(0, 32);
    const cleanTime = this.sanitizeZpl(data.collectionTimeFormatted);

    const zplLines = [
      '^XA', // Start Format
      `^PW${is300 ? 600 : 406}`, // Print Width
      `^LL${is300 ? 300 : 203}`, // Label Length
      '^PON', // Normal Print Orientation
      '^LH0,0', // Label Home

      // Line 1: Patient Name & Age/Gender
      `^FO${xOffset},${Math.round(10 * s)}^A0N,${Math.round(18 * s)},${Math.round(16 * s)}^FD${cleanName} [${cleanAgeGender}]^FS`,

      // Line 2: UHID & Order Number
      `^FO${xOffset},${Math.round(32 * s)}^A0N,${Math.round(15 * s)},${Math.round(13 * s)}^FDUHID: ${cleanUhid}  Ord: ${cleanOrder}^FS`,

      // Barcode: Code 128 (Subset B)
      `^BY${barWidth},2,${barcodeHeight}`,
      `^FO${xOffset},${barcodeY}^BCN,${barcodeHeight},Y,N,N^FD${data.barcode}^FS`,

      // Line 3: Tube Type & Tests
      `^FO${xOffset},${Math.round(115 * s)}^A0N,${Math.round(16 * s)},${Math.round(14 * s)}^FD${cleanTube} | ${cleanTests}^FS`,

      // Line 4: Collection Timestamp & LabCore Signature
      `^FO${xOffset},${Math.round(135 * s)}^A0N,${Math.round(14 * s)},${Math.round(12 * s)}^FDColl: ${cleanTime} [LABCORE-ELIS]^FS`,

      '^XZ' // End Format
    ];

    return zplLines.join('\n');
  }

  /**
   * Generates 2D DataMatrix ZPL for microscopic histopathology cassettes and slides.
   * Fits on 20mm x 20mm cassette tag or slide end.
   */
  public static generateHistologyDataMatrixZpl(
    accessionCode: string,
    sampleSite: string,
    stainType: string
  ): string {
    const cleanCode = this.sanitizeZpl(accessionCode);
    const cleanSite = this.sanitizeZpl(sampleSite).substring(0, 16);
    const cleanStain = this.sanitizeZpl(stainType);

    const zplLines = [
      '^XA',
      '^PW300',
      '^LL200',
      '^FO20,20',
      `^BXN,4,200,,,,1^FD${cleanCode}^FS`, // DataMatrix code
      `^FO110,25^A0N,18,16^FD${cleanCode}^FS`,
      `^FO110,50^A0N,16,14^FD${cleanSite}^FS`,
      `^FO110,75^A0N,16,14^FD${cleanStain}^FS`,
      '^XZ'
    ];

    return zplLines.join('\n');
  }

  private static sanitizeZpl(input: string): string {
    if (!input) return '';
    return input.replace(/[\^~]/g, ' ').trim();
  }
}
