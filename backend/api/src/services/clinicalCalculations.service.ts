/**
 * Clinical Calculations Service — NIKIL-LABCORE-ELIS-OS
 * 
 * Module 10: Advanced Clinical Formula Engine & Calculations
 * - Bug 10.1: Friedewald LDL Guard (TG > 400 mg/dL nullification + Direct LDL reflex flag)
 * - Bug 10.2: CKD-EPI 2021 Race-Free eGFR Equation + Pediatric Bedside Schwartz Equation
 * - Bug 10.3: Kahn's Topological Sort DAG for Multi-Parameter Formula Resolution
 * - Bug 10.4: Hare-Niemeyer (Hamilton) Largest Remainder Method for CBC Differential 100% Sum
 */

export interface FormulaParameter {
  code: string;
  value?: number | null;
  formula?: string; // e.g. "PROTEIN_TOTAL - ALBUMIN"
  dependencies?: string[]; // e.g. ["PROTEIN_TOTAL", "ALBUMIN"]
}

export interface CbcDifferentialInput {
  neutrophils: number;
  lymphocytes: number;
  monocytes: number;
  eosinophils: number;
  basophils: number;
  [key: string]: number;
}

export interface CbcDifferentialOutput {
  neutrophils: number;
  lymphocytes: number;
  monocytes: number;
  eosinophils: number;
  basophils: number;
  totalSum: number;
  adjustments: Record<string, number>;
}

export interface EgfrResult {
  egfr: number;
  formulaUsed: 'CKD-EPI 2021' | 'Bedside Schwartz 2009';
  stage: string;
  isPediatric: boolean;
  notes?: string;
}

export interface FriedewaldResult {
  ldl: number | null;
  isValid: boolean;
  vldl: number | null;
  triglycerides: number;
  reflexDirectLdlRequired: boolean;
  clinicalComment: string;
}

export class ClinicalCalculationsService {
  /**
   * Bug 10.1: Friedewald LDL Calculation
   * LDL = Total Cholesterol - HDL - (Triglycerides / 5) [in mg/dL]
   * 
   * Strict Guard: If Triglycerides > 400 mg/dL or TG < 40 mg/dL,
   * Friedewald equation is biologically invalid.
   * Nullify LDL and flag Direct LDL reflex testing.
   */
  public static calculateFriedewaldLdl(
    totalCholesterol: number,
    hdl: number,
    triglycerides: number
  ): FriedewaldResult {
    const vldl = Math.round((triglycerides / 5) * 100) / 100;

    if (triglycerides > 400) {
      return {
        ldl: null,
        isValid: false,
        vldl,
        triglycerides,
        reflexDirectLdlRequired: true,
        clinicalComment:
          'Friedewald equation is invalid when Triglycerides > 400 mg/dL due to chylomicronemia and altered VLDL composition. Reflex Direct LDL (enzymatic clearance) is required.'
      };
    }

    if (triglycerides < 40) {
      return {
        ldl: null,
        isValid: false,
        vldl,
        triglycerides,
        reflexDirectLdlRequired: true,
        clinicalComment:
          'Triglycerides < 40 mg/dL: Friedewald equation underestimates LDL-C. Direct LDL measurement recommended.'
      };
    }

    const calculatedLdl = totalCholesterol - hdl - vldl;
    const ldl = Math.round(calculatedLdl * 100) / 100;

    return {
      ldl: ldl > 0 ? ldl : 0,
      isValid: true,
      vldl,
      triglycerides,
      reflexDirectLdlRequired: false,
      clinicalComment: 'Calculated via Friedewald formula (valid for TG between 40 and 400 mg/dL).'
    };
  }

  /**
   * Bug 10.2: CKD-EPI 2021 Race-Free Equation + Pediatric Bedside Schwartz Equation
   * 
   * Adult (>= 18 yrs) CKD-EPI 2021 (Inker et al., NEJM 2021):
   * eGFR = 142 * min(Scr/kappa, 1)^alpha * max(Scr/kappa, 1)^(-1.200) * 0.9938^Age * [1.012 if Female]
   * Female: kappa = 0.7, alpha = -0.241
   * Male: kappa = 0.9, alpha = -0.302
   * 
   * Pediatric (< 18 yrs) Bedside Schwartz (Schwartz et al., JASN 2009):
   * eGFR = (0.413 * Height_cm) / Scr
   */
  public static calculateEgfr(
    serumCreatinineMgDl: number,
    ageYears: number,
    gender: 'MALE' | 'FEMALE' | string,
    heightCm?: number
  ): EgfrResult {
    if (serumCreatinineMgDl <= 0) {
      throw new Error('Serum creatinine must be positive.');
    }

    const isFemale = gender.toUpperCase() === 'FEMALE';
    const isPediatric = ageYears < 18;

    if (isPediatric) {
      if (!heightCm || heightCm <= 0) {
        throw new Error('Patient height in cm is mandatory for pediatric Bedside Schwartz eGFR calculation.');
      }
      const rawEgfr = (0.413 * heightCm) / serumCreatinineMgDl;
      const egfr = Math.round(rawEgfr * 10) / 10;
      return {
        egfr,
        formulaUsed: 'Bedside Schwartz 2009',
        stage: this.getKdigoStage(egfr),
        isPediatric: true,
        notes: `Pediatric calculation based on Bedside Schwartz equation (k=0.413, height=${heightCm}cm).`
      };
    }

    // Adult CKD-EPI 2021 Race-Free
    const kappa = isFemale ? 0.7 : 0.9;
    const alpha = isFemale ? -0.241 : -0.302;
    const femaleMultiplier = isFemale ? 1.012 : 1.0;

    const scrOverKappa = serumCreatinineMgDl / kappa;
    const term1 = Math.pow(Math.min(scrOverKappa, 1.0), alpha);
    const term2 = Math.pow(Math.max(scrOverKappa, 1.0), -1.200);
    const term3 = Math.pow(0.9938, ageYears);

    const rawEgfr = 142 * term1 * term2 * term3 * femaleMultiplier;
    const egfr = Math.round(rawEgfr * 10) / 10;

    return {
      egfr,
      formulaUsed: 'CKD-EPI 2021',
      stage: this.getKdigoStage(egfr),
      isPediatric: false,
      notes: 'Adult CKD-EPI 2021 Refit (Race-free equation recommended by NKF-ASN task force).'
    };
  }

  private static getKdigoStage(egfr: number): string {
    if (egfr >= 90) return 'G1 (Normal or high renal function)';
    if (egfr >= 60) return 'G2 (Mildly decreased renal function)';
    if (egfr >= 45) return 'G3a (Mild to moderately decreased)';
    if (egfr >= 30) return 'G3b (Moderately to severely decreased)';
    if (egfr >= 15) return 'G4 (Severely decreased)';
    return 'G5 (Kidney failure / End-stage renal disease)';
  }

  /**
   * Bug 10.3: Kahn's Algorithm for Topological Sort on Clinical Formula DAG
   * Resolves multi-tiered dependency trees without out-of-order execution or circular dependencies.
   * 
   * Example:
   * ALBUMIN, TOTAL_PROTEIN (raw inputs)
   * GLOBULIN = TOTAL_PROTEIN - ALBUMIN
   * AG_RATIO = ALBUMIN / GLOBULIN
   */
  public static resolveFormulaExecutionOrder(parameters: FormulaParameter[]): string[] {
    const adjList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize maps
    for (const p of parameters) {
      if (!adjList.has(p.code)) adjList.set(p.code, []);
      if (!inDegree.has(p.code)) inDegree.set(p.code, 0);
    }

    // Build DAG edges: dependency -> parameter
    for (const p of parameters) {
      if (p.dependencies && p.dependencies.length > 0) {
        for (const dep of p.dependencies) {
          if (!adjList.has(dep)) adjList.set(dep, []);
          adjList.get(dep)!.push(p.code);
          inDegree.set(p.code, (inDegree.get(p.code) || 0) + 1);
        }
      }
    }

    // Queue of parameters with zero in-degree (ready to evaluate)
    const queue: string[] = [];
    inDegree.forEach((deg, code) => {
      if (deg === 0) queue.push(code);
    });

    const executionOrder: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      executionOrder.push(current);

      const neighbors = adjList.get(current) || [];
      for (const neighbor of neighbors) {
        const updatedDeg = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, updatedDeg);
        if (updatedDeg === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Check for circular dependency
    if (executionOrder.length !== parameters.length) {
      const unresolved = parameters
        .filter((p) => !executionOrder.includes(p.code))
        .map((p) => p.code);
      throw new Error(`Circular dependency detected in clinical formulas: ${unresolved.join(', ')}`);
    }

    return executionOrder;
  }

  /**
   * Bug 10.4: Hare-Niemeyer (Hamilton) Largest Remainder Method for CBC Differential 100% Sum
   * 
   * Given floating point percentage values for CBC 5-part differential:
   * (Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils)
   * guarantees that the rounded sum is exactly 100% without rounding drift.
   */
  public static balanceCbcDifferential(diff: CbcDifferentialInput): CbcDifferentialOutput {
    const rawEntries = Object.entries(diff);
    if (rawEntries.length === 0) {
      throw new Error('Differential input cannot be empty.');
    }

    const totalRaw = rawEntries.reduce((sum, [, val]) => sum + val, 0);
    if (totalRaw <= 0) {
      throw new Error('Total differential sum must be greater than zero.');
    }

    // Step 1: Normalize to 100% scale
    const normalized = rawEntries.map(([key, val]) => {
      const exactPct = (val / totalRaw) * 100;
      const integerPart = Math.floor(exactPct);
      const fractionPart = exactPct - integerPart;
      return { key, exactPct, integerPart, fractionPart, finalVal: integerPart };
    });

    // Step 2: Sum the integer components
    const sumIntegers = normalized.reduce((acc, item) => acc + item.integerPart, 0);
    const remainder = 100 - sumIntegers;

    // Step 3: Sort descending by fractional remainder
    const sortedIndices = normalized
      .map((item, index) => ({ index, fraction: item.fractionPart }))
      .sort((a, b) => b.fraction - a.fraction);

    // Step 4: Distribute +1 to the top 'remainder' items
    const adjustments: Record<string, number> = {};
    for (let i = 0; i < remainder; i++) {
      const targetIdx = sortedIndices[i].index;
      normalized[targetIdx].finalVal += 1;
      adjustments[normalized[targetIdx].key] = 1;
    }

    // Assemble output
    const resultObj: Record<string, number> = {};
    let finalSum = 0;
    for (const item of normalized) {
      resultObj[item.key] = item.finalVal;
      finalSum += item.finalVal;
    }

    return {
      neutrophils: resultObj.neutrophils ?? 0,
      lymphocytes: resultObj.lymphocytes ?? 0,
      monocytes: resultObj.monocytes ?? 0,
      eosinophils: resultObj.eosinophils ?? 0,
      basophils: resultObj.basophils ?? 0,
      totalSum: finalSum,
      adjustments
    };
  }
}
