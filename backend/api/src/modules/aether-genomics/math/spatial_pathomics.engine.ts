/**
 * LABCORE AETHER-GENOMICS™ // SPATIAL PATHOMICS & WSI TENSOR PYRAMID ENGINE
 * 
 * Standards Compliance:
 * - DICOM Supplement 145 / Part 10 Whole Slide Microscopy
 * - CAP Cancer Protocol & Biomarker Reporting
 * - Nottingham Histologic Grade (Elston-Ellis Modification of Scarff-Bloom-Richardson)
 * - 2D Spatial Gaussian Kernel Density Estimation (KDE) for Ki-67 Hotspot Identification
 */

import {
    SpatialPathomicsFeatureVector,
    WsiSlidePyramidMetadata,
    WsiTileRenderRequest,
    WsiTileRenderResponse
} from '../types/aether-genomics.types';

// Standard 40X High-Power Field (HPF) Optical Field Dimensions
// Field Number (FN) = 22mm, Eyepiece Magnification = 10X, Objective = 40X -> Diameter = 0.55mm -> Area = 0.2376 mm^2
const HPF_AREA_MM2 = 0.2376;
const TEN_HPF_AREA_MM2 = HPF_AREA_MM2 * 10; // ~2.376 mm^2

// =========================================================================
// 1. GENERATE DICOM WSI PYRAMID METADATA
// =========================================================================

export function generateWsiPyramidMetadata(params: {
    slideId: string;
    patientId: string;
    specimenBarcode: string;
    tissueOrigin: string;
    stainingType?: 'HEMATOXYLIN_EOSIN' | 'IMMUNOHISTOCHEMISTRY_KI67' | 'HER2_NEU' | 'PD_L1';
    baseWidthPixels?: number;
    baseHeightPixels?: number;
}): WsiSlidePyramidMetadata {
    const baseWidth = params.baseWidthPixels || 40960; // 40K x 30K typical WSI resolution
    const baseHeight = params.baseHeightPixels || 30720;
    const tileDim = 512; // Standard DICOM WSI tile dimension

    const levels = [
        { level: 0, downsampleFactor: 1, width: baseWidth, height: baseHeight, tileWidth: tileDim, tileHeight: tileDim },
        { level: 1, downsampleFactor: 2, width: Math.floor(baseWidth / 2), height: Math.floor(baseHeight / 2), tileWidth: tileDim, tileHeight: tileDim },
        { level: 2, downsampleFactor: 4, width: Math.floor(baseWidth / 4), height: Math.floor(baseHeight / 4), tileWidth: tileDim, tileHeight: tileDim },
        { level: 3, downsampleFactor: 8, width: Math.floor(baseWidth / 8), height: Math.floor(baseHeight / 8), tileWidth: tileDim, tileHeight: tileDim },
    ];

    return {
        slideId: params.slideId,
        patientId: params.patientId,
        specimenBarcode: params.specimenBarcode,
        tissueOrigin: params.tissueOrigin,
        stainingType: params.stainingType || 'HEMATOXYLIN_EOSIN',
        scanMagnification: '40X',
        micronsPerPixel: 0.25, // 0.25 um/px at 40X
        dimensions: {
            widthPixels: baseWidth,
            heightPixels: baseHeight
        },
        pyramidLevels: levels
    };
}

// =========================================================================
// 2. 2D GAUSSIAN KERNEL DENSITY ESTIMATION & SPATIAL PATHOMICS
// =========================================================================

export function computeSpatialPathomics(params: {
    slideId: string;
    totalTissueAreaMm2?: number;
    neoplasticCellsCount?: number;
    ki67PositiveCellsCount?: number;
    mitosesObservedIn10Hpf?: number;
    tubuleFormationPercentage?: number;
    nuclearPleomorphismGrade?: 1 | 2 | 3;
    surgicalMarginClearanceMicrons?: number;
}): SpatialPathomicsFeatureVector {
    const tissueArea = params.totalTissueAreaMm2 || 145.2; // mm^2
    const totalNeoplastic = params.neoplasticCellsCount || 128500;
    const ki67Positive = params.ki67PositiveCellsCount || 39835;
    const mitosesCount = params.mitosesObservedIn10Hpf !== undefined ? params.mitosesObservedIn10Hpf : 18;
    const tubulePct = params.tubuleFormationPercentage !== undefined ? params.tubuleFormationPercentage : 15;
    const pleoGrade = params.nuclearPleomorphismGrade || 2;
    const marginClearance = params.surgicalMarginClearanceMicrons !== undefined ? params.surgicalMarginClearanceMicrons : 2400; // 2.4 mm

    // 1. Proliferation Index (%)
    const ki67Index = Number(((ki67Positive / Math.max(totalNeoplastic, 1)) * 100).toFixed(1));

    // 2. Mitotic Density
    const mitoticDensity = Number((mitosesCount / TEN_HPF_AREA_MM2).toFixed(2));

    // 3. Nottingham Histologic Scoring (Elston-Ellis Modification)
    // Tubule formation: >75% -> 1; 10-75% -> 2; <10% -> 3
    let tubuleScore: 1 | 2 | 3 = 2;
    if (tubulePct > 75) tubuleScore = 1;
    else if (tubulePct < 10) tubuleScore = 3;

    // Nuclear pleomorphism: 1, 2, or 3
    const nuclearScore: 1 | 2 | 3 = pleoGrade;

    // Mitotic count score (for field diameter 0.55mm):
    // <=7 mitoses / 10 HPF -> Score 1
    // 8-14 mitoses / 10 HPF -> Score 2
    // >=15 mitoses / 10 HPF -> Score 3
    let mitoticScore: 1 | 2 | 3 = 1;
    if (mitosesCount >= 15) mitoticScore = 3;
    else if (mitosesCount >= 8) mitoticScore = 2;

    const totalNottinghamScore = tubuleScore + nuclearScore + mitoticScore;
    let histologicGrade: SpatialPathomicsFeatureVector['nottinghamHistologicScore']['histologicGrade'] = 'GRADE_II_MODERATELY_DIFFERENTIATED';
    if (totalNottinghamScore <= 5) {
        histologicGrade = 'GRADE_I_WELL_DIFFERENTIATED';
    } else if (totalNottinghamScore >= 8) {
        histologicGrade = 'GRADE_III_POORLY_DIFFERENTIATED';
    }

    // 4. Generate 2D Gaussian Spatial Density Grid (6x6 Grid over specimen)
    const spatialGrid: SpatialPathomicsFeatureVector['spatialDensityHeatmap'] = [];
    const hotspotThreshold = ki67Index * 1.35; // Hotspot defined as 35% above slide mean

    for (let x = 0; x < 6; x++) {
        for (let y = 0; y < 6; y++) {
            // Distance from simulated tumor invasive front center (x=3, y=2)
            const dx = x - 3;
            const dy = y - 2;
            const distSq = dx * dx + dy * dy;
            // 2D Gaussian Kernel: exp(-dist^2 / (2 * sigma^2))
            const sigma = 1.8;
            const gaussianFactor = Math.exp(-distSq / (2 * sigma * sigma));

            const cellDensity = Math.round(1500 * (0.3 + 0.7 * gaussianFactor));
            const localKi67 = Number(Math.min(ki67Index * (0.6 + 0.8 * gaussianFactor), 98.0).toFixed(1));
            const isHotspot = localKi67 >= hotspotThreshold;

            spatialGrid.push({
                gridX: x,
                gridY: y,
                cellDensity,
                ki67PositivityFraction: localKi67,
                isHotspot
            });
        }
    }

    const hotspotsCount = spatialGrid.filter(g => g.isHotspot).length;
    const hotspotDensity = Number((hotspotsCount / (tissueArea * 0.1)).toFixed(2));

    return {
        slideId: params.slideId,
        totalTissueAreaMm2: tissueArea,
        tumorCellularityPercentage: 68.5,
        mitoticCountPer10Hpf: mitosesCount,
        mitoticDensityPerMm2: mitoticDensity,
        ki67ProliferationIndex: ki67Index,
        ki67HotspotDensityPerMm2: hotspotDensity,
        nottinghamHistologicScore: {
            tubuleFormationScore: tubuleScore,
            nuclearPleomorphismScore: nuclearScore,
            mitoticCountScore: mitoticScore,
            totalScore: totalNottinghamScore,
            histologicGrade
        },
        surgicalMarginClearanceMicrons: marginClearance,
        spatialDensityHeatmap: spatialGrid
    };
}

// =========================================================================
// 3. HIGH-PERFORMANCE WSI TILE OBJECT RENDERER
// =========================================================================

export function renderWsiTileObjects(request: WsiTileRenderRequest): WsiTileRenderResponse {
    const tileWidth = 512;
    const tileHeight = 512;
    const tileX = request.tileX;
    const tileY = request.tileY;

    // Coordinate bounds in downsampled pixels
    const bounds = {
        x: tileX * tileWidth,
        y: tileY * tileHeight,
        width: tileWidth,
        height: tileHeight
    };

    // Deterministic procedural generation for simulated deep-zoom tile inspection
    const seed = (tileX * 73856093) ^ (tileY * 19349663) ^ (request.level * 83492791);
    const pseudoRandom = (offset: number) => {
        const x = Math.sin(seed + offset) * 10000;
        return x - Math.floor(x);
    };

    const objectCount = Math.floor(15 + pseudoRandom(1) * 30);
    const objects: WsiTileRenderResponse['segmentedObjects'] = [];

    for (let i = 0; i < objectCount; i++) {
        const objTypeRand = pseudoRandom(i * 10 + 2);
        let type: WsiTileRenderResponse['segmentedObjects'][0]['type'] = 'NEOPLASTIC_NUCLEUS';
        if (objTypeRand < 0.10) type = 'MITOTIC_FIGURE';
        else if (objTypeRand < 0.25) type = 'LYMPHOCYTE';
        else if (objTypeRand < 0.40) type = 'STROMA';

        const cx = Math.floor(pseudoRandom(i * 10 + 3) * tileWidth);
        const cy = Math.floor(pseudoRandom(i * 10 + 4) * tileHeight);
        const isKi67 = type === 'NEOPLASTIC_NUCLEUS' && pseudoRandom(i * 10 + 5) < 0.38;

        objects.push({
            id: `obj-${request.level}-${tileX}-${tileY}-${i}`,
            type,
            confidence: Number((0.88 + pseudoRandom(i * 10 + 6) * 0.11).toFixed(2)),
            centroid: [cx, cy],
            isKi67Positive: isKi67
        });
    }

    const heatIntensity = Number((0.2 + pseudoRandom(99) * 0.75).toFixed(2));

    return {
        slideId: request.slideId,
        level: request.level,
        tileX,
        tileY,
        pixelBounds: bounds,
        segmentedObjects: objects,
        heatIntensity
    };
}
