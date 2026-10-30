/**
 * LABCORE CHRONOS-OMEGA™ // CLOSED-LOOP RK4 + MAP BAYESIAN TDM SOLVER
 * 
 * Standards Compliance:
 * - ASHP/IDSA/SIDP 2020 Consensus Guidelines for Vancomycin AUC-Guided Dosing
 * - 4th-Order Runge-Kutta (RK4) Two-Compartment Pharmacokinetic Differential System
 * - Maximum A Posteriori (MAP) Bayesian Parameter Optimization
 */

import { BayesianTDMInput, BayesianTDMResult } from '../types/chronos-omega.types';

export function solveBayesianRK4TDM(input: BayesianTDMInput): BayesianTDMResult {
    // Population priors for 2-compartment Vancomycin kinetics
    const popCL = Math.max(0.8, 0.048 * input.creatinineClearanceMlMin * 60 * 0.001 * 18); // L/h
    const popVc = 0.29 * input.patientWeightKg; // Central volume (L)
    const popQ = 2.8;                           // Inter-compartmental clearance (L/h)
    const popVp = 0.42 * input.patientWeightKg; // Peripheral volume (L)

    const simulateRK4 = (CL: number, Vc: number, totalHours: number) => {
        const dt = 0.05;
        const steps = Math.floor(totalHours / dt);
        let Cc = 0;
        let Cp = 0;
        const curve: Array<{ hour: number; centralMgL: number; peripheralMgL: number }> = [];

        for (let s = 0; s <= steps; s++) {
            const t = s * dt;
            const cycleTime = t % input.dosingIntervalHours;
            const Rinf = cycleTime < input.infusionDurationHours
                ? input.doseMg / input.infusionDurationHours
                : 0;

            const dCcdt = (c1: number, c2: number) =>
                Rinf / Vc - (CL / Vc + popQ / Vc) * c1 + (popQ / popVp) * c2;
            const dCpdt = (c1: number, c2: number) =>
                (popQ / Vc) * c1 - (popQ / popVp) * c2;

            if (s % 10 === 0) {
                curve.push({
                    hour: Number(t.toFixed(2)),
                    centralMgL: Number(Cc.toFixed(2)),
                    peripheralMgL: Number(Cp.toFixed(2)),
                });
            }

            const k1c = dCcdt(Cc, Cp);
            const k1p = dCpdt(Cc, Cp);

            const k2c = dCcdt(Cc + 0.5 * dt * k1c, Cp + 0.5 * dt * k1p);
            const k2p = dCpdt(Cc + 0.5 * dt * k1c, Cp + 0.5 * dt * k1p);

            const k3c = dCcdt(Cc + 0.5 * dt * k2c, Cp + 0.5 * dt * k2p);
            const k3p = dCpdt(Cc + 0.5 * dt * k2c, Cp + 0.5 * dt * k2p);

            const k4c = dCcdt(Cc + dt * k3c, Cp + dt * k3p);
            const k4p = dCpdt(Cc + dt * k3c, Cp + dt * k3p);

            Cc += (dt / 6) * (k1c + 2 * k2c + 2 * k3c + k4c);
            Cp += (dt / 6) * (k1p + 2 * k2p + 2 * k3p + k4p);
        }
        return curve;
    };

    // MAP Bayesian Grid-Search / Coordinate Descent over (CL, Vc)
    let bestCL = popCL;
    let bestVc = popVc;
    let minObjective = Infinity;

    for (let clScale = 0.4; clScale <= 1.8; clScale += 0.05) {
        for (let vcScale = 0.6; vcScale <= 1.5; vcScale += 0.05) {
            const candCL = popCL * clScale;
            const candVc = popVc * vcScale;
            const sim = simulateRK4(candCL, candVc, 48);

            let likelihoodCost = 0;
            for (const obs of input.observedSamples) {
                const pt = sim.find((p) => Math.abs(p.hour - obs.timeHours) < 0.26);
                if (pt) {
                    likelihoodCost += Math.pow(obs.concentrationMgL - pt.centralMgL, 2) / 2.25;
                }
            }
            const priorCost =
                Math.pow((candCL - popCL) / (0.25 * popCL), 2) +
                Math.pow((candVc - popVc) / (0.20 * popVc), 2);

            const totalJ = likelihoodCost + priorCost;
            if (totalJ < minObjective) {
                minObjective = totalJ;
                bestCL = candCL;
                bestVc = candVc;
            }
        }
    }

    const finalCurve = simulateRK4(bestCL, bestVc, 48);
    // Compute steady-state 24h AUC (Hours 24 to 48) via Trapezoidal Integration
    const steadySlice = finalCurve.filter((p) => p.hour >= 24 && p.hour <= 48);
    let auc24 = 0;
    for (let i = 1; i < steadySlice.length; i++) {
        const dt = steadySlice[i].hour - steadySlice[i - 1].hour;
        auc24 += 0.5 * (steadySlice[i].centralMgL + steadySlice[i - 1].centralMgL) * dt;
    }

    const aucMicRatio = auc24 / Math.max(0.25, input.micMgL);
    const recommendedDoseMg = Math.round((input.doseMg * (480 / Math.max(aucMicRatio, 50))) / 50) * 50;

    return {
        posteriorClearanceLh: Number(bestCL.toFixed(2)),
        posteriorCentralVolumeL: Number(bestVc.toFixed(2)),
        steadyStateAuc24MgHL: Number(auc24.toFixed(1)),
        aucToMicRatio: Number(aucMicRatio.toFixed(1)),
        therapeuticWindowStatus:
            aucMicRatio > 600
                ? 'NEPHROTOXIC_AKI_DANGER_HOLD_INFUSION'
                : aucMicRatio < 400
                    ? 'SUBTHERAPEUTIC_SEPSIS_FAILURE_ESCALATE'
                    : 'OPTIMAL_BACTERICIDAL_TARGET_LOCKED',
        recommendedAdjustedDoseMg: recommendedDoseMg,
        rk4TrajectoryPoints: finalCurve,
    };
}
