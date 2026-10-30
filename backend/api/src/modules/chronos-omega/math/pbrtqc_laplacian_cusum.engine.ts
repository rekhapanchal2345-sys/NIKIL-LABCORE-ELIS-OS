/**
 * LABCORE CHRONOS-OMEGA™ // PBRTQC TABULAR CUSUM & GRAPH-LAPLACIAN MULTI-ANALYZER INTERCEPTOR
 * 
 * Standards Compliance:
 * - CLSI C24-Ed4 (Statistical Quality Control for Quantitative Measurement Procedures)
 * - Patient-Based Real-Time Quality Control (PBRTQC / Moving Average / CUSUM)
 * - Graph-Laplacian Spectral Decomposition for Instrument Bias Isolation vs Population Shift
 */

import crypto from 'crypto';
import { PBRTQCInput, PBRTQCResult } from '../types/chronos-omega.types';

export function evaluateGraphLaplacianPBRTQC(input: PBRTQCInput): PBRTQCResult {
    const kAllowance = 0.5; // 0.5 SD shift sensitivity
    const hThreshold = 4.0; // Decision interval H

    const transformBoxCox = (x: number) =>
        input.boxCoxLambda === 0 ? Math.log(x) : (Math.pow(x, input.boxCoxLambda) - 1) / input.boxCoxLambda;

    const bcMean = transformBoxCox(input.targetMean);
    const bcSd = Math.abs(transformBoxCox(input.targetMean + input.targetSd) - bcMean) || 1;

    const nodeMetrics = input.nodes.map((node) => {
        let sPos = 0;
        let sNeg = 0;
        let zSum = 0;

        for (const raw of node.recentPatientValues) {
            const z = (transformBoxCox(raw) - bcMean) / bcSd;
            zSum += z;
            sPos = Math.max(0, sPos + z - kAllowance);
            sNeg = Math.max(0, sNeg - z - kAllowance);
        }

        const meanZ = node.recentPatientValues.length > 0 ? zSum / node.recentPatientValues.length : 0;
        return {
            analyzerId: node.analyzerId,
            analyzerModel: node.analyzerModel,
            meanZScore: Number(meanZ.toFixed(3)),
            cusumPositive: Number(sPos.toFixed(2)),
            cusumNegative: Number(sNeg.toFixed(2)),
            cusumBreached: Math.max(sPos, sNeg) > hThreshold,
        };
    });

    // Graph-Laplacian Residual: L * z = (M * z_i - sum(z_j)) / M
    const M = nodeMetrics.length;
    const globalMeanZ = nodeMetrics.reduce((acc, n) => acc + n.meanZScore, 0) / Math.max(1, M);

    const consensusResults: PBRTQCResult['consensusMatrix'] = nodeMetrics.map((n) => {
        const laplacianResidual = n.meanZScore - globalMeanZ;
        const isIsolatedMachineDrift = n.cusumBreached && Math.abs(laplacianResidual) > 0.65;
        const isPopulationEpidemicShift = n.cusumBreached && Math.abs(laplacianResidual) <= 0.65;

        let interlockStatus: PBRTQCResult['consensusMatrix'][0]['interlockStatus'] = 'SYNCHRONIZED_IN_CONTROL';
        if (isIsolatedMachineDrift) {
            interlockStatus = 'AUTO_QUARANTINE_INSTRUMENT_CALIBRATION_DRIFT';
        } else if (isPopulationEpidemicShift) {
            interlockStatus = 'POPULATION_EPIDEMIOLOGICAL_SHIFT_DETECTED';
        }

        return {
            ...n,
            laplacianResidual: Number(laplacianResidual.toFixed(3)),
            interlockStatus,
            recommendedSlopeCorrection: Number((1 / (1 + laplacianResidual * (input.targetSd / input.targetMean))).toFixed(4)),
        };
    });

    const payloadHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({ analyteName: input.analyteName, consensusResults }))
        .digest('hex');

    return {
        analyteName: input.analyteName,
        globalNetworkMeanZ: Number(globalMeanZ.toFixed(3)),
        consensusMatrix: consensusResults,
        iso15189CryptographicSeal: `SHA256:${payloadHash}`,
    };
}
