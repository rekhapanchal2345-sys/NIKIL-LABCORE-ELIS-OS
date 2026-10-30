/**
 * LABCORE CHRONOS-OMEGA™ // STEWART QUANTITATIVE ACID-BASE & NEWTON-RAPHSON SOLVER
 * 
 * Standards Compliance:
 * - Peter Stewart Physical Chemistry Ion Equilibrium (1983)
 * - Fencl-Stewart Intensive Care Acid-Base Modeling
 * - Analytical Jacobian Newton-Raphson [H+] Root-Finding
 */

import { StewartABGInput, StewartABGResult } from '../types/chronos-omega.types';

export function solveStewartAcidBase(input: StewartABGInput): StewartABGResult {
    // 1. Apparent Strong Ion Difference (SIDa in mEq/L)
    const sidApparent =
        input.na +
        input.k +
        2 * input.caIonized +
        2 * input.mgIonized -
        (input.cl + input.lactate);

    // Convert units: Albumin g/dL -> g/L; Phosphate mg/dL -> mmol/L
    const albGl = input.albuminGdl * 10.0;
    const piMmol = input.phosphateMgdl * 0.3229;

    // 2. Effective Strong Ion Difference (SIDe) at measured pH
    const hco3 = 0.0301 * input.pco2Mmhg * Math.pow(10, input.measuredPh - 6.1);
    const albCharge = albGl * (0.123 * input.measuredPh - 0.631);
    const piCharge = piMmol * (0.309 * input.measuredPh - 0.469);
    const sidEffective = hco3 + albCharge + piCharge;

    // 3. Strong Ion Gap (SIG = Unmeasured Pathological Anions)
    const strongIonGap = sidApparent - sidEffective;

    // 4. Newton-Raphson Solver for Theoretical [H+] from Physical Equilibrium Constants (Eq/L)
    const Kw = 4.4e-14;
    const Ka = 3.0e-7;
    const K1S = 2.46e-11; // Combined hydration & carbonic acid dissociation
    const K2 = 6.0e-11;
    const SID = sidApparent * 1e-3; // Eq/L
    const Atot = (0.012 * albGl + 0.000309 * piMmol * 10); // Weak acid molarity approximation

    let H = 4.0e-8; // Initial guess: 40 nmol/L (pH 7.40)
    for (let iter = 0; iter < 60; iter++) {
        const f =
            H +
            SID -
            Kw / H -
            (Ka * Atot) / (H + Ka) -
            (K1S * input.pco2Mmhg) / H -
            (2 * K1S * K2 * input.pco2Mmhg) / (H * H);

        const df =
            1 +
            Kw / (H * H) +
            (Ka * Atot) / Math.pow(H + Ka, 2) +
            (K1S * input.pco2Mmhg) / (H * H) +
            (4 * K1S * K2 * input.pco2Mmhg) / Math.pow(H, 3);

        const nextH = Math.max(1e-10, H - f / df);
        if (Math.abs(nextH - H) < 1e-13) {
            H = nextH;
            break;
        }
        H = nextH;
    }

    const physicalPredictedPh = -Math.log10(H);
    const verdicts: string[] = [];

    if (strongIonGap > 2.5) {
        verdicts.push('UNMEASURED_ANION_TOXICOSIS (Ketoacids / Uremic Toxins / Salicylate / Toxic Alcohols)');
    }
    if (sidApparent < 36 && input.cl > 107) {
        verdicts.push('HYPERCHLOREMIC_STRONG_ION_ACIDOSIS (Switch 0.9% NaCl to Balanced Crystalloid)');
    }
    if (input.albuminGdl < 2.8) {
        verdicts.push('HYPOALBUMINEMIC_WEAK_ACID_ALKALOSIS (Masking Underlying Metabolic Acidosis)');
    }
    if (verdicts.length === 0) {
        verdicts.push('HOMEOSTATIC_STEWART_EQUILIBRIUM');
    }

    return {
        sidApparentMeqL: Number(sidApparent.toFixed(2)),
        sidEffectiveMeqL: Number(sidEffective.toFixed(2)),
        strongIonGapMeqL: Number(strongIonGap.toFixed(2)),
        bicarbonateMmolL: Number(hco3.toFixed(2)),
        albuminIonicEffectMeqL: Number(albCharge.toFixed(2)),
        phosphateIonicEffectMeqL: Number(piCharge.toFixed(2)),
        newtonRaphsonSolvedPh: Number(physicalPredictedPh.toFixed(3)),
        clinicalPartitionVerdicts: verdicts,
    };
}
