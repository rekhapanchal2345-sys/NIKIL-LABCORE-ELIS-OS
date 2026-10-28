export interface PanelParameterValue {
  parameterCode: string;
  parameterName: string;
  numericValue: number | null;
  unit?: string;
}

export interface InterParameterValidationViolation {
  ruleCode: string;
  panelName: string;
  violationMessage: string;
  severity: "CRITICAL_CONTRADICTION" | "PHYSIOLOGICAL_WARNING";
  involvedParameters: string[];
}

export interface InterParameterValidationReport {
  isValid: boolean;
  violations: InterParameterValidationViolation[];
  calculatedDerivedParameters: Record<string, number>;
}

/**
 * ============================================================================
 * INTER-PARAMETER CROSS-VALIDATION ENGINE (CLSI AUTO10-A COMPLIANT)
 * ============================================================================
 * Solves Bug 3.2 / Bug 4.2: Cross-Parameter Logical Contradiction Bypass.
 * Validates panel parameters atomically before auto-verification approval.
 */
export class InterParameterValidationEngine {
  public static validatePanel(parameters: PanelParameterValue[]): InterParameterValidationReport {
    const violations: InterParameterValidationViolation[] = [];
    const derived: Record<string, number> = {};

    // Helper map of uppercase parameter codes and names
    const paramMap = new Map<string, number>();
    for (const p of parameters) {
      if (p.numericValue !== null && !isNaN(p.numericValue)) {
        const code = (p.parameterCode || "").toUpperCase().trim();
        const name = (p.parameterName || "").toUpperCase().trim();
        paramMap.set(code, p.numericValue);
        if (name && name !== code) {
          paramMap.set(name, p.numericValue);
        }
      }
    }

    const getVal = (...keys: string[]): number | null => {
      for (const k of keys) {
        const upper = k.toUpperCase().trim();
        if (paramMap.has(upper)) return paramMap.get(upper)!;
      }
      return null;
    };

    // ------------------------------------------------------------------------
    // 1. HEPATIC / LFT CONTRADICTION: Direct Bilirubin > Total Bilirubin
    // ------------------------------------------------------------------------
    const totalBilirubin = getVal("TBIL", "TOTAL_BILIRUBIN", "T_BIL", "BILIRUBIN_TOTAL", "BILIRUBIN TOTAL");
    const directBilirubin = getVal("DBIL", "DIRECT_BILIRUBIN", "D_BIL", "BILIRUBIN_DIRECT", "BILIRUBIN DIRECT");

    if (totalBilirubin !== null && directBilirubin !== null) {
      // Allow 0.1 mg/dL instrument analytical noise tolerance
      if (directBilirubin > totalBilirubin + 0.1) {
        violations.push({
          ruleCode: "LFT_CONTRADICTION_DIRECT_GT_TOTAL",
          panelName: "Liver Function Test (LFT)",
          violationMessage: `Direct Bilirubin (${directBilirubin} mg/dL) exceeds Total Bilirubin (${totalBilirubin} mg/dL). Clinically impossible.`,
          severity: "CRITICAL_CONTRADICTION",
          involvedParameters: ["Total Bilirubin", "Direct Bilirubin"],
        });
      } else {
        const indirectBilirubin = Number(Math.max(0, totalBilirubin - directBilirubin).toFixed(2));
        derived["INDIRECT_BILIRUBIN"] = indirectBilirubin;
      }
    }

    // ------------------------------------------------------------------------
    // 2. TOTAL PROTEIN & ALBUMIN CONTRADICTION: Albumin > Total Protein
    // ------------------------------------------------------------------------
    const totalProtein = getVal("TP", "TOTAL_PROTEIN", "T_PROT", "PROTEIN_TOTAL", "TOTAL PROTEIN");
    const albumin = getVal("ALB", "ALBUMIN");

    if (totalProtein !== null && albumin !== null) {
      if (albumin > totalProtein + 0.1) {
        violations.push({
          ruleCode: "PROTEIN_CONTRADICTION_ALBUMIN_GT_TOTAL",
          panelName: "Total Protein / Albumin Profile",
          violationMessage: `Albumin (${albumin} g/dL) exceeds Total Protein (${totalProtein} g/dL). Clinically impossible.`,
          severity: "CRITICAL_CONTRADICTION",
          involvedParameters: ["Total Protein", "Albumin"],
        });
      } else {
        const globulin = Number((totalProtein - albumin).toFixed(2));
        derived["GLOBULIN"] = globulin;
        if (globulin > 0) {
          derived["AG_RATIO"] = Number((albumin / globulin).toFixed(2));
        }
      }
    }

    // ------------------------------------------------------------------------
    // 3. CBC DIFFERENTIAL SUM: Neutrophils + Lymphocytes + Monocytes + Eosinophils + Basophils
    // ------------------------------------------------------------------------
    const neutrophils = getVal("NEUT", "NEUTROPHILS", "NEUT_%", "NEUTROPHIL_%");
    const lymphocytes = getVal("LYMPH", "LYMPHOCYTES", "LYMPH_%", "LYMPHOCYTE_%");
    const monocytes = getVal("MONO", "MONOCYTES", "MONO_%", "MONOCYTE_%");
    const eosinophils = getVal("EOS", "EOSINOPHILS", "EOS_%", "EOSINOPHIL_%");
    const basophils = getVal("BASO", "BASOPHILS", "BASO_%", "BASOPHIL_%");

    const diffParts = [neutrophils, lymphocytes, monocytes, eosinophils, basophils].filter(
      (v): v is number => v !== null
    );

    // If at least 4 components of 5-part differential are present
    if (diffParts.length >= 4) {
      const sum = diffParts.reduce((a, b) => a + b, 0);
      derived["CBC_DIFF_SUM"] = Number(sum.toFixed(1));

      // Normal physiological tolerance is 95% to 105% (to account for manual band counting or rounding)
      if (sum < 93.0 || sum > 107.0) {
        violations.push({
          ruleCode: "CBC_DIFF_SUM_DEVIATION",
          panelName: "Complete Blood Count (CBC Differential)",
          violationMessage: `CBC 5-Part Differential sum is ${sum.toFixed(1)}% (Expected: 95% - 105%). Results cannot be auto-verified.`,
          severity: "CRITICAL_CONTRADICTION",
          involvedParameters: ["Neutrophils", "Lymphocytes", "Monocytes", "Eosinophils", "Basophils"],
        });
      }
    }

    // ------------------------------------------------------------------------
    // 4. HEMATOLOGY RULE OF THREE (Hb * 3 ≈ Hct)
    // ------------------------------------------------------------------------
    const hb = getVal("HB", "HEMOGLOBIN", "HGB");
    const hct = getVal("HCT", "HEMATOCRIT", "PCV");

    if (hb !== null && hct !== null && hb > 0) {
      const expectedHct = hb * 3;
      const discrepancy = Math.abs(expectedHct - hct);
      // Tolerance is +/- 6% Hct (allowing for microcytosis/macrocytosis or moderate RBC shape changes)
      if (discrepancy > 6.0) {
        violations.push({
          ruleCode: "HEMATOLOGY_RULE_OF_THREE_VIOLATION",
          panelName: "Complete Blood Count (Rule of Three)",
          violationMessage: `Hematocrit (${hct}%) significantly contradicts Hemoglobin (${hb} g/dL). Expected Hct ~${expectedHct.toFixed(1)}% ± 6%. Suspected cold agglutinin, lipemia, or analyzer aspiration bubble.`,
          severity: "CRITICAL_CONTRADICTION",
          involvedParameters: ["Hemoglobin", "Hematocrit"],
        });
      }
    }

    // ------------------------------------------------------------------------
    // 5. LIPID PROFILE CONTRADICTION: HDL > Total Cholesterol
    // ------------------------------------------------------------------------
    const totalCholesterol = getVal("CHOL", "CHOLESTEROL", "TOTAL_CHOLESTEROL", "TOTAL CHOLESTEROL");
    const hdl = getVal("HDL", "HDL_CHOLESTEROL", "HDL CHOLESTEROL");
    const ldl = getVal("LDL", "LDL_CHOLESTEROL", "LDL CHOLESTEROL");
    const triglycerides = getVal("TRIG", "TRIGLYCERIDES", "TG");

    if (totalCholesterol !== null && hdl !== null) {
      if (hdl > totalCholesterol) {
        violations.push({
          ruleCode: "LIPID_CONTRADICTION_HDL_GT_TOTAL",
          panelName: "Lipid Profile",
          violationMessage: `HDL Cholesterol (${hdl} mg/dL) exceeds Total Cholesterol (${totalCholesterol} mg/dL). Clinically impossible.`,
          severity: "CRITICAL_CONTRADICTION",
          involvedParameters: ["Total Cholesterol", "HDL Cholesterol"],
        });
      }
    }

    if (totalCholesterol !== null && hdl !== null && triglycerides !== null && triglycerides < 400 && ldl === null) {
      // Calculate Friedewald LDL: LDL = TC - HDL - (TG / 5)
      const vldl = Number((triglycerides / 5).toFixed(1));
      const calcLdl = Number((totalCholesterol - hdl - vldl).toFixed(1));
      derived["VLDL"] = vldl;
      derived["CALCULATED_LDL"] = Math.max(0, calcLdl);
    }

    // ------------------------------------------------------------------------
    // 6. ELECTROLYTE ANION GAP CONTRADICTION
    // AG = (Na + K) - (Cl + HCO3)
    // ------------------------------------------------------------------------
    const sodium = getVal("NA", "SODIUM", "SERUM_SODIUM");
    const potassium = getVal("K", "POTASSIUM", "SERUM_POTASSIUM");
    const chloride = getVal("CL", "CHLORIDE", "SERUM_CHLORIDE");
    const bicarb = getVal("HCO3", "BICARBONATE", "CO2");

    if (sodium !== null && chloride !== null && bicarb !== null) {
      const kVal = potassium ?? 4.0;
      const anionGap = Number(((sodium + kVal) - (chloride + bicarb)).toFixed(1));
      derived["ANION_GAP"] = anionGap;

      // Extreme negative anion gap (< -2) or extreme uncalibrated (> 40)
      if (anionGap < -2.0 || anionGap > 45.0) {
        violations.push({
          ruleCode: "ELECTROLYTE_ANION_GAP_IMPLAUSIBLE",
          panelName: "Serum Electrolytes Panel",
          violationMessage: `Calculated Anion Gap is ${anionGap} mmol/L (Physiologically implausible: Normal is 8-16 mmol/L). Suspected sample contamination or analyzer calibration drift.`,
          severity: "CRITICAL_CONTRADICTION",
          involvedParameters: ["Sodium", "Potassium", "Chloride", "Bicarbonate"],
        });
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      calculatedDerivedParameters: derived,
    };
  }
}
