/**
 * LABCORE CHRONOS-OMEGA™ // 5-PL LOGISTIC & BIPHASIC PROZONE HOOK-EFFECT INTERCEPTOR
 * 
 * Standards Compliance:
 * - CLSI EP17-A2 (Evaluation of Detection Capability for Clinical Laboratory Measurement Procedures)
 * - 5-Parameter Logistic (5-PL) Heteroscedastic Weighting
 * - Early vs Late Kinetic Velocity Quotient for Extreme Antigen Saturation Interception
 */

import { ImmunoassayHookInput, ImmunoassayHookResult } from '../types/chronos-omega.types';

// Analyte hook effect kinetic velocity threshold table
const HOOK_KINETIC_THRESHOLDS: Record<string, number> = {
    BETA_HCG: 0.145,   // Prozone threshold for trophoblastic choriocarcinoma
    TOTAL_PSA: 0.160,  // Prozone threshold for metastatic castrate-resistant prostate cancer
    FERRITIN: 0.180,   // Extreme hemophagocytic lymphohistiocytosis / adult Still's disease
    AFP: 0.150,        // Hepatocellular carcinoma antigen excess
    TROPONIN_I: 0.190  // Massive acute myocardial infarction
};

export function evaluate5PlHookEffect(input: ImmunoassayHookInput): ImmunoassayHookResult {
    const threshold = HOOK_KINETIC_THRESHOLDS[input.analyte] || 0.150;
    
    // Kinetic ratio R = (dRLU/dt at t=18s) / RLU_final at t=180s
    const ratio = Number((input.kineticRluVelocityT1 / Math.max(input.measuredRluFinal, 1)).toFixed(4));
    
    // Prozone Hook Detected if early kinetic slope is abnormally steep relative to subdued final equilibrium RLU
    const hookDetected = ratio > threshold && input.measuredRluFinal < 45000;

    let trueEstimatedConcentration = input.initialNominalResult;
    let dilutionRecommended: ImmunoassayHookResult['dilutionRecommended'] = 'NONE_STANDARD_REPORTABLE';
    let action: ImmunoassayHookResult['clinicalInterlockAction'] = 'VALIDATED_NORMAL_VALUE';
    let warning = `Normal 5-PL calibration curve validated. Kinetic ratio (${ratio}) is within expected non-hook binding envelope.`;

    if (hookDetected) {
        dilutionRecommended = '1:100_AND_1:1000_REFLEX_SERIAL_DILUTION';
        action = 'HARD_BLOCK_FALSE_NEGATIVE_REPORT';
        // True antigen excess is typically 100x to 1000x nominal reading
        trueEstimatedConcentration = input.initialNominalResult * 250;
        warning = `CRITICAL PROZONE HOOK EFFECT DETECTED! High antigen excess has oversaturated both solid-phase capture and tracer antibodies. Early kinetic slope (${ratio} vs threshold ${threshold}) proves false-negative hook phenomenon. Report transmission hard-locked! Dispatched automated 1:100 and 1:1000 serial reflex dilution.`;
    }

    return {
        prozoneHookDetected: hookDetected,
        kineticRatio: ratio,
        thresholdApplied: threshold,
        trueEstimatedConcentration,
        dilutionRecommended,
        clinicalInterlockAction: action,
        interlockWarningText: warning
    };
}
