/**
 * HL7 v2.5 Serializer & Indian Healthcare Standards (ABHA) Service — NIKIL-LABCORE-ELIS-OS
 * 
 * Module 14: HL7 / ASTM & Indian Healthcare Standards
 * - Bug 14.1: HL7 v2.5 Delimiter Escaping & Unescaping (\F\, \S\, \T\, \R\, \E\)
 * - Bug 14.2: Ayushman Bharat Health Account (ABHA) 14-Digit Checksum & Terminology (LOINC / SNOMED-CT)
 */

export interface Hl7Observation {
  identifier: string; // e.g. "2093-3" (LOINC) or "CHOL"
  text: string; // e.g. "Cholesterol & Triglycerides"
  value: string | number;
  units: string;
  referenceRange: string;
  abnormalFlag?: 'N' | 'L' | 'H' | 'LL' | 'HH' | 'A';
  status: 'F' | 'P' | 'C'; // Final, Preliminary, Corrected
}

export class Hl7SerializerService {
  /**
   * Bug 14.1: Escapes HL7 v2.5 special characters to protect segment boundaries.
   * Delimiters:
   * \ (Escape)        -> \E\
   * | (Field)         -> \F\
   * ^ (Component)     -> \S\
   * & (Subcomponent)  -> \T\
   * ~ (Repetition)    -> \R\
   */
  public static escapeHl7String(val: string): string {
    if (!val) return '';
    // Must replace \ first to avoid double-escaping subsequent escape tags
    return val
      .replace(/\\/g, '\\E\\')
      .replace(/\|/g, '\\F\\')
      .replace(/\^/g, '\\S\\')
      .replace(/&/g, '\\T\\')
      .replace(/~/g, '\\R\\');
  }

  /**
   * Inverses HL7 v2.5 escaping when reading incoming HL7 messages.
   */
  public static unescapeHl7String(val: string): string {
    if (!val) return '';
    return val
      .replace(/\\F\\/g, '|')
      .replace(/\\S\\/g, '^')
      .replace(/\\T\\/g, '&')
      .replace(/\\R\\/g, '~')
      .replace(/\\E\\/g, '\\');
  }

  /**
   * Formats an OBX (Observation/Result) segment with escaping on user-provided clinical strings.
   */
  public static formatObxSegment(setNumber: number, obs: Hl7Observation): string {
    const valueType = typeof obs.value === 'number' ? 'NM' : 'ST';
    const escapedText = this.escapeHl7String(obs.text);
    const escapedUnits = this.escapeHl7String(obs.units);
    const escapedRange = this.escapeHl7String(obs.referenceRange);
    const escapedValue = this.escapeHl7String(String(obs.value));
    const flag = obs.abnormalFlag || 'N';

    return `OBX|${setNumber}|${valueType}|${obs.identifier}^${escapedText}^LN||${escapedValue}|${escapedUnits}|${escapedRange}|${flag}|||${obs.status}`;
  }

  /**
   * Bug 14.2: Ayushman Bharat Health Account (ABHA) 14-Digit Checksum Validator
   * ABHA number is 14 digits (often formatted as XX-XXXX-XXXX-XXXX).
   * Validates structure and Verhoeff algorithm checksum.
   */
  private static readonly VERHOEFF_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  ];

  private static readonly VERHOEFF_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
  ];

  private static readonly VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

  /**
   * Generates a valid Verhoeff check digit for any numeric string.
   */
  public static generateVerhoeffCheckDigit(numStr: string): number {
    let c = 0;
    const reversed = numStr.replace(/\D/g, '').split('').reverse().map(Number);
    for (let i = 0; i < reversed.length; i++) {
      c = this.VERHOEFF_D[c][this.VERHOEFF_P[(i + 1) % 8][reversed[i]]];
    }
    return this.VERHOEFF_INV[c];
  }

  /**
   * Generates a properly formatted 14-digit ABHA number from 13 digits with calculated check digit.
   */
  public static generateValidAbha(prefix13Digits: string): string {
    const digits = prefix13Digits.replace(/\D/g, '').padEnd(13, '0').slice(0, 13);
    const checkDigit = this.generateVerhoeffCheckDigit(digits);
    const raw14 = digits + checkDigit;
    return `${raw14.slice(0, 2)}-${raw14.slice(2, 6)}-${raw14.slice(6, 10)}-${raw14.slice(10, 14)}`;
  }

  public static validateAbhaNumber(abhaInput: string): {
    isValid: boolean;
    formattedAbha?: string;
    rawDigits?: string;
    errorReason?: string;
  } {
    if (!abhaInput) {
      return { isValid: false, errorReason: 'ABHA number cannot be empty.' };
    }

    const rawDigits = abhaInput.replace(/[-\s]/g, '');

    if (!/^\d{14}$/.test(rawDigits)) {
      return {
        isValid: false,
        errorReason: `ABHA number must contain exactly 14 digits (received ${rawDigits.length} digits).`
      };
    }

    // Verhoeff checksum validation
    let c = 0;
    const reversed = rawDigits.split('').reverse().map(Number);
    for (let i = 0; i < reversed.length; i++) {
      c = this.VERHOEFF_D[c][this.VERHOEFF_P[i % 8][reversed[i]]];
    }

    // If Verhoeff checksum evaluates to 0, it is valid
    if (c !== 0) {
      return {
        isValid: false,
        rawDigits,
        errorReason: 'ABHA number failed Verhoeff checksum verification (invalid digits or typo).'
      };
    }

    const formattedAbha = `${rawDigits.slice(0, 2)}-${rawDigits.slice(2, 6)}-${rawDigits.slice(6, 10)}-${rawDigits.slice(10, 14)}`;

    return {
      isValid: true,
      formattedAbha,
      rawDigits
    };
  }

  /**
   * Standard Indian pathology LOINC & SNOMED-CT code directory
   */
  public static getStandardTerminology(testCode: string): {
    loincCode?: string;
    loincName?: string;
    snomedCtCode?: string;
  } {
    const registry: Record<string, { loincCode: string; loincName: string; snomedCtCode: string }> = {
      CHOL: { loincCode: '2093-3', loincName: 'Cholesterol in Serum or Plasma', snomedCtCode: '14740000' },
      TRIG: { loincCode: '2571-8', loincName: 'Triglyceride in Serum or Plasma', snomedCtCode: '14740000' },
      HDL: { loincCode: '2085-9', loincName: 'HDL Cholesterol in Serum or Plasma', snomedCtCode: '28036006' },
      LDL: { loincCode: '13457-7', loincName: 'LDL Cholesterol [Calculated]', snomedCtCode: '102738006' },
      CREAT: { loincCode: '2160-0', loincName: 'Creatinine in Serum or Plasma', snomedCtCode: '70901006' },
      EGFR: { loincCode: '98979-8', loincName: 'Glomerular filtration rate/1.73 sq M.predicted [CKD-EPI 2021]', snomedCtCode: '80274001' },
      HB: { loincCode: '718-7', loincName: 'Hemoglobin [Mass/volume] in Blood', snomedCtCode: '38082009' }
    };

    return registry[testCode.toUpperCase()] || {};
  }
}
