/**
 * Clinical Microbiology & Antibiotic Susceptibility Testing (AST) Service — NIKIL-LABCORE-ELIS-OS
 * 
 * Module 9: Specialty Departments: Microbiology & Histopathology
 * - Bug 9.1: Multi-Isolate Culture & AST Hierarchy
 * - Bug 9.2: CLSI M100 Cascade Reporting / Antibiotic Stewardship Suppression
 * - Bug 9.3: 24h / 48h Preliminary vs Final Culture State Machine
 */

export type ClsiAntibioticGroup = 'A' | 'B' | 'C' | 'U'; // A=Primary, B=Secondary, C=Reserve/Restricted, U=Urinary only

export interface AntibioticRecord {
  code: string;
  name: string;
  antibioticGroup: ClsiAntibioticGroup;
  micValueUgMl?: number;
  zoneDiameterMm?: number;
  interpretation: 'S' | 'I' | 'R'; // Sensitive, Intermediate, Resistant
  isSuppressedOnReport?: boolean;
}

export interface IsolateData {
  isolateNumber: number;
  organismCode: string;
  organismName: string; // e.g. "Klebsiella pneumoniae"
  gramReaction: 'GRAM_NEGATIVE' | 'GRAM_POSITIVE' | 'YEAST' | 'ACID_FAST';
  colonyCountCfu?: string; // e.g. "> 10^5 CFU/mL"
  antibiotics: AntibioticRecord[];
}

export interface CultureReportOutput {
  accessionNumber: string;
  cultureStatus: string;
  reportStage: 'PRELIMINARY_24H' | 'PRELIMINARY_48H' | 'FINAL_VERIFIED';
  disclaimerHeader: string;
  isolates: Array<{
    isolateNumber: number;
    organismName: string;
    gramReaction: string;
    colonyCountCfu?: string;
    reportedAntibiotics: AntibioticRecord[];
    suppressedAntibiotics: AntibioticRecord[];
  }>;
  isStewardshipActive: boolean;
}

export class MicrobiologyAstService {
  /**
   * Bug 9.2: CLSI M100 Cascade Reporting Algorithm
   * 
   * Rule:
   * 1. Group A (Primary) antibiotics are always reported.
   * 2. If ALL Group A tested antibiotics are Sensitive (S), Group B (Secondary)
   *    and Group C (Reserve: Meropenem, Colistin) antibiotics MUST be suppressed on the patient report.
   * 3. If ANY Group A antibiotic is Resistant (R), Group B antibiotics are unsuppressed.
   * 4. If ALL Group B antibiotics are also Resistant (R) or intermediate, Group C (Reserve)
   *    antibiotics are unsuppressed.
   */
  public static applyClsiCascadeSuppression(antibiotics: AntibioticRecord[]): AntibioticRecord[] {
    const groupA = antibiotics.filter((a) => a.antibioticGroup === 'A');
    const groupB = antibiotics.filter((a) => a.antibioticGroup === 'B');

    // Check Group A resistance
    const hasGroupAResistance = groupA.some((a) => a.interpretation === 'R');

    // Check Group B resistance
    const allGroupBResistant = groupB.length > 0 && groupB.every((a) => a.interpretation === 'R');

    return antibiotics.map((item) => {
      let isSuppressed = false;

      if (item.antibioticGroup === 'A') {
        isSuppressed = false; // Never suppress Primary
      } else if (item.antibioticGroup === 'B') {
        // Suppress Group B if Group A has NO resistance
        isSuppressed = !hasGroupAResistance;
      } else if (item.antibioticGroup === 'C') {
        // Suppress Reserve unless Group A is resistant AND Group B is also resistant
        isSuppressed = !(hasGroupAResistance && allGroupBResistant);
      }

      return {
        ...item,
        isSuppressedOnReport: isSuppressed
      };
    });
  }

  /**
   * Bug 9.3: 24h / 48h Preliminary vs Final Culture State Machine
   * Enforces legal disclaimer and proper separation between interim gram/growth vs verified AST.
   */
  public static compileCultureReport(
    accessionNumber: string,
    cultureStatus: 'INCUBATING_24H' | 'PRELIMINARY_RELEASED' | 'INCUBATING_48H' | 'FINAL_VERIFIED',
    isolates: IsolateData[]
  ): CultureReportOutput {
    let reportStage: 'PRELIMINARY_24H' | 'PRELIMINARY_48H' | 'FINAL_VERIFIED' = 'FINAL_VERIFIED';
    let disclaimerHeader = '';

    if (cultureStatus === 'INCUBATING_24H' || cultureStatus === 'PRELIMINARY_RELEASED') {
      reportStage = 'PRELIMINARY_24H';
      disclaimerHeader =
        '*** PROVISIONAL / PRELIMINARY CULTURE REPORT (24-HOUR INCUBATION) — PENDING FINAL INCUBATION & AST VERIFICATION AT 48H/72H ***';
    } else if (cultureStatus === 'INCUBATING_48H') {
      reportStage = 'PRELIMINARY_48H';
      disclaimerHeader =
        '*** INTERIM CULTURE REPORT (48-HOUR INCUBATION) — FINAL ORGANISM IDENTIFICATION IN PROGRESS ***';
    } else {
      reportStage = 'FINAL_VERIFIED';
      disclaimerHeader = 'FINAL CLINICAL MICROBIOLOGY & SUSCEPTIBILITY REPORT (VALIDATED)';
    }

    const processedIsolates = isolates.map((isolate) => {
      const cascadeAntibiotics = this.applyClsiCascadeSuppression(isolate.antibiotics);
      const reportedAntibiotics = cascadeAntibiotics.filter((a) => !a.isSuppressedOnReport);
      const suppressedAntibiotics = cascadeAntibiotics.filter((a) => a.isSuppressedOnReport);

      return {
        isolateNumber: isolate.isolateNumber,
        organismName: isolate.organismName,
        gramReaction: isolate.gramReaction,
        colonyCountCfu: isolate.colonyCountCfu,
        reportedAntibiotics,
        suppressedAntibiotics
      };
    });

    return {
      accessionNumber,
      cultureStatus,
      reportStage,
      disclaimerHeader,
      isolates: processedIsolates,
      isStewardshipActive: true
    };
  }
}
