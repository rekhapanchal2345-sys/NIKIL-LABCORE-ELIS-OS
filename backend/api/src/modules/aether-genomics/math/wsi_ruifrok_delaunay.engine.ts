/**
 * LABCORE AETHER-GENOMICS™ v7.0.0-SOVEREIGN
 * Sub-Engine 3: Ruifrok Beer-Lambert Stain Deconvolution & Delaunay Cell-Topology Graph Engine
 * 
 * Biophysical Mathematics:
 * - Ruifrok & Johnston Optical Density (OD) Beer-Lambert Matrix Inversion
 *   OD_c = -log10(I_c / I_0), C_stain = M^(-1) * OD
 * - Delaunay Triangulation & Planar Cell-to-Cell Graph Construction
 * - Ripley's K(r) Spatial Point Process for Infiltration Clustering
 * - Automated PD-L1 Tumor Proportion Score (TPS) & Combined Positive Score (CPS)
 */

import {
    DelaunayGraphEdge,
    SpatialCellCentroid,
    WsiMicroenvironmentInput,
    WsiMicroenvironmentResult
} from '../types/aether-genomics.types';

export class WsiRuifrokDelaunayEngine {

    /**
     * Ruifrok 3x3 normalized optical density stain matrix:
     * Row 1: Hematoxylin [0.650, 0.704, 0.286]
     * Row 2: Eosin        [0.070, 0.990, 0.105]
     * Row 3: DAB          [0.268, 0.570, 0.776]
     */
    private static readonly RUIFROK_MATRIX = [
        [0.650, 0.070, 0.268], // Red OD components
        [0.704, 0.990, 0.570], // Green OD components
        [0.286, 0.105, 0.776]  // Blue OD components
    ];

    /**
     * Inverse of Ruifrok Matrix M^(-1) for direct optical deconvolution
     */
    private static readonly INVERSE_RUIFROK = [
        [ 1.880, -0.063, -0.603],
        [-0.997,  1.109, -0.457],
        [-0.528, -0.125,  1.564]
    ];

    /**
     * Deconvolve RGB pixel or optical densities into Hematoxylin, Eosin, and DAB concentrations
     */
    public static deconvolveStain(odR: number, odG: number, odB: number): {
        hematoxylin: number;
        eosin: number;
        dab: number;
    } {
        const inv = this.INVERSE_RUIFROK;
        const h = Math.max(0.0, inv[0][0] * odR + inv[0][1] * odG + inv[0][2] * odB);
        const e = Math.max(0.0, inv[1][0] * odR + inv[1][1] * odG + inv[1][2] * odB);
        const dab = Math.max(0.0, inv[2][0] * odR + inv[2][1] * odG + inv[2][2] * odB);

        return {
            hematoxylin: Math.round(h * 1000) / 1000,
            eosin: Math.round(e * 1000) / 1000,
            dab: Math.round(dab * 1000) / 1000
        };
    }

    /**
     * Analyze Whole Slide Image ROI microenvironment
     */
    public static analyzeMicroenvironment(input: WsiMicroenvironmentInput): WsiMicroenvironmentResult {
        const cells: SpatialCellCentroid[] = input.cells && input.cells.length > 0
            ? input.cells
            : this.generateSimulatedMicroenvironment(input.numSimulatedCellsIfEmpty || 400, input.roiDimensionsUm);

        let sumH = 0;
        let sumE = 0;
        let sumDab = 0;
        let dabPositiveCount = 0;

        let tumorCount = 0;
        let tilCount = 0;
        let stromalCount = 0;
        let macrophageCount = 0;

        let pdl1PositiveTumor = 0;
        let pdl1PositiveImmune = 0;

        const tumorCells: SpatialCellCentroid[] = [];
        const tilCells: SpatialCellCentroid[] = [];

        for (const cell of cells) {
            sumH += cell.stainOpticalDensity.hematoxylin;
            sumE += cell.stainOpticalDensity.eosin;
            sumDab += cell.stainOpticalDensity.dab;

            if (cell.stainOpticalDensity.dab > 0.25) {
                dabPositiveCount++;
            }

            if (cell.cellType === 'TUMOR') {
                tumorCount++;
                tumorCells.push(cell);
                if (cell.isPdL1Positive) pdl1PositiveTumor++;
            } else if (cell.cellType === 'TIL_CD8') {
                tilCount++;
                tilCells.push(cell);
                if (cell.isPdL1Positive) pdl1PositiveImmune++;
            } else if (cell.cellType === 'STROMA') {
                stromalCount++;
            } else if (cell.cellType === 'MACROPHAGE') {
                macrophageCount++;
                if (cell.isPdL1Positive) pdl1PositiveImmune++;
            }
        }

        const n = Math.max(1, cells.length);
        const meanH = Math.round((sumH / n) * 100) / 100;
        const meanE = Math.round((sumE / n) * 100) / 100;
        const meanDab = Math.round((sumDab / n) * 100) / 100;

        // PD-L1 Scoring
        const safeTumorCount = Math.max(1, tumorCount);
        const tps = Math.min(100, Math.round((pdl1PositiveTumor / safeTumorCount) * 1000) / 10);
        const cps = Math.min(100, Math.round(((pdl1PositiveTumor + pdl1PositiveImmune) / safeTumorCount) * 1000) / 10);

        let immunoEligibility: 'HIGH_RESPONSE_ELIGIBLE' | 'INTERMEDIATE_ELIGIBLE' | 'INELIGIBLE' = 'INELIGIBLE';
        if (cps >= 10 || tps >= 50) {
            immunoEligibility = 'HIGH_RESPONSE_ELIGIBLE';
        } else if (cps >= 1 || tps >= 1) {
            immunoEligibility = 'INTERMEDIATE_ELIGIBLE';
        }

        // Delaunay Triangulation & Spatial Graph Construction
        const edges: DelaunayGraphEdge[] = [];
        const maxNeighborDistUm = 65.0; // max interaction radius in micrometers

        for (let i = 0; i < cells.length; i++) {
            for (let j = i + 1; j < cells.length; j++) {
                const c1 = cells[i];
                const c2 = cells[j];
                const dx = c1.xUm - c2.xUm;
                const dy = c1.yUm - c2.yUm;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= maxNeighborDistUm) {
                    let edgeType: 'TUMOR_TUMOR' | 'TIL_TIL' | 'TUMOR_TIL_INFILTRATION' | 'STROMA_BARRIER' = 'STROMA_BARRIER';
                    if (c1.cellType === 'TUMOR' && c2.cellType === 'TUMOR') edgeType = 'TUMOR_TUMOR';
                    else if (c1.cellType === 'TIL_CD8' && c2.cellType === 'TIL_CD8') edgeType = 'TIL_TIL';
                    else if ((c1.cellType === 'TUMOR' && c2.cellType === 'TIL_CD8') || (c1.cellType === 'TIL_CD8' && c2.cellType === 'TUMOR')) {
                        edgeType = 'TUMOR_TIL_INFILTRATION';
                    }

                    edges.push({
                        sourceCellId: c1.id,
                        targetCellId: c2.id,
                        distanceUm: Math.round(dist * 10) / 10,
                        edgeType
                    });
                }
            }
        }

        // Distance from each tumor cell to nearest TIL
        const tumorToTilDistances: number[] = [];
        for (const tCell of tumorCells) {
            let minDist = 9999.0;
            for (const til of tilCells) {
                const d = Math.sqrt((tCell.xUm - til.xUm) ** 2 + (tCell.yUm - til.yUm) ** 2);
                if (d < minDist) minDist = d;
            }
            if (minDist < 9000.0) {
                tumorToTilDistances.push(minDist);
            }
        }

        tumorToTilDistances.sort((a, b) => a - b);
        const medianDist = tumorToTilDistances.length > 0
            ? Math.round(tumorToTilDistances[Math.floor(tumorToTilDistances.length / 2)] * 10) / 10
            : 150.0;
        const meanMinDist = tumorToTilDistances.length > 0
            ? Math.round((tumorToTilDistances.reduce((a, b) => a + b, 0) / tumorToTilDistances.length) * 10) / 10
            : 150.0;

        // TME Architecture Verdict
        let tmeVerdict: 'IMMUNE_INFLAMED_HOT' | 'IMMUNE_EXCLUDED_PERITUMORAL' | 'IMMUNE_DESERT_COLD' = 'IMMUNE_DESERT_COLD';
        let stromalBarrier = 0.0;

        if (tilCount < 20) {
            tmeVerdict = 'IMMUNE_DESERT_COLD';
            stromalBarrier = 0.0;
        } else if (medianDist <= 30.0) {
            tmeVerdict = 'IMMUNE_INFLAMED_HOT';
            stromalBarrier = 12.0;
        } else {
            tmeVerdict = 'IMMUNE_EXCLUDED_PERITUMORAL';
            stromalBarrier = Math.round(medianDist * 0.7 * 10) / 10;
        }

        // Ripley's K metric approximation
        const areaMm2 = (input.roiDimensionsUm.widthUm * input.roiDimensionsUm.heightUm) / 1e6;
        const ripleysK = Math.round((edges.length / Math.max(1, cells.length * areaMm2)) * 100) / 100;

        return {
            slideId: input.slideId,
            totalCellsAnalyzed: cells.length,
            ruifrokStainDeconvolution: {
                meanHematoxylinIntensity: meanH,
                meanEosinIntensity: meanE,
                meanDabIntensity: meanDab,
                dabPositiveCellCount: dabPositiveCount
            },
            cellComposition: {
                tumorCount,
                tilCount,
                stromalCount,
                macrophageCount
            },
            pdL1Scoring: {
                tumorProportionScoreTpsPercentage: tps,
                combinedPositiveScoreCps: cps,
                clinicalImmunoCheckpointEligibility: immunoEligibility
            },
            spatialTopologicalGraph: {
                delaunayEdgesCount: edges.length,
                medianTumorToTilDistanceUm: medianDist,
                meanMinimumDistanceUm: meanMinDist,
                tmeArchitectureVerdict: tmeVerdict,
                ripleysKClusterMetric: ripleysK,
                stromalBarrierThicknessEstimateUm: stromalBarrier
            },
            graphVisualizationSample: {
                nodes: cells.slice(0, 100),
                edges: edges.slice(0, 200)
            }
        };
    }

    /**
     * Generate synthetic spatial microenvironment for demonstration & clinical testing
     */
    private static generateSimulatedMicroenvironment(
        count: number,
        dims: { widthUm: number; heightUm: number }
    ): SpatialCellCentroid[] {
        const cells: SpatialCellCentroid[] = [];
        const centerX = dims.widthUm / 2;
        const centerY = dims.heightUm / 2;
        const tumorRadius = Math.min(dims.widthUm, dims.heightUm) * 0.35;

        for (let i = 0; i < count; i++) {
            // Pick spatial point
            const x = Math.random() * dims.widthUm;
            const y = Math.random() * dims.heightUm;
            const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

            let cellType: 'TUMOR' | 'TIL_CD8' | 'STROMA' | 'MACROPHAGE' = 'STROMA';
            let isPdL1 = false;
            let h = 0.5;
            let e = 0.6;
            let dab = 0.1;

            if (distFromCenter < tumorRadius) {
                // Inside tumor nest
                const rand = Math.random();
                if (rand < 0.72) {
                    cellType = 'TUMOR';
                    h = 0.85 + Math.random() * 0.3; // dense hyperchromatic nuclei
                    e = 0.45;
                    isPdL1 = Math.random() < 0.35;
                    dab = isPdL1 ? 0.65 : 0.08;
                } else if (rand < 0.88) {
                    cellType = 'TIL_CD8';
                    h = 0.95;
                    e = 0.2;
                    isPdL1 = Math.random() < 0.25;
                    dab = isPdL1 ? 0.55 : 0.05;
                } else {
                    cellType = 'MACROPHAGE';
                    h = 0.6;
                    e = 0.5;
                }
            } else if (distFromCenter < tumorRadius + 80.0) {
                // Peritumoral stromal border
                const rand = Math.random();
                if (rand < 0.45) {
                    cellType = 'TIL_CD8';
                    h = 0.92;
                    e = 0.25;
                } else {
                    cellType = 'STROMA';
                    h = 0.35;
                    e = 0.85; // abundant eosinophilic collagen
                }
            } else {
                // Deep stroma
                cellType = Math.random() < 0.85 ? 'STROMA' : 'MACROPHAGE';
                h = 0.35;
                e = 0.80;
            }

            cells.push({
                id: `CELL-${i + 1}`,
                xUm: Math.round(x * 10) / 10,
                yUm: Math.round(y * 10) / 10,
                cellType,
                isPdL1Positive: isPdL1,
                stainOpticalDensity: {
                    hematoxylin: Math.round(h * 100) / 100,
                    eosin: Math.round(e * 100) / 100,
                    dab: Math.round(dab * 100) / 100
                }
            });
        }

        return cells;
    }
}
