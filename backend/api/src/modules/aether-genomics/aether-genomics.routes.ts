/**
 * LABCORE AETHER-GENOMICS & NEURO-PATHOMICS NEXUS™
 * API Route Declarations
 */

import { Router } from 'express';
import { aetherGenomicsController } from './aether-genomics.controller';

const router = Router();

// =========================================================================
// 1. TELEMETRY & CLINICAL CATALOG
// =========================================================================
router.get('/telemetry', (req, res, next) => aetherGenomicsController.getTelemetry(req, res, next));
router.get('/catalog', (req, res, next) => aetherGenomicsController.getCatalog(req, res, next));

// =========================================================================
// 2. PHARMACOGENOMICS (PGx) & WARFARIN DOSING
// =========================================================================
router.post('/pgx/evaluate', (req, res, next) => aetherGenomicsController.evaluatePgx(req, res, next));

// =========================================================================
// 3. ACMG/AMP 2015 28-RULE BAYESIAN VARIANT INTERPRETATION
// =========================================================================
router.post('/acmg/classify', (req, res, next) => aetherGenomicsController.classifyAcmg(req, res, next));

// =========================================================================
// 4. WHOLE SLIDE IMAGING (WSI) & SPATIAL PATHOMICS
// =========================================================================
router.post('/wsi/process', (req, res, next) => aetherGenomicsController.processWsi(req, res, next));
router.post('/wsi/tile', (req, res, next) => aetherGenomicsController.renderTile(req, res, next));

// =========================================================================
// 5. MOLECULAR TUMOR BOARD (MTB) ONCOLOGY ACTIONABILITY
// =========================================================================
router.post('/mtb/synthesize', (req, res, next) => aetherGenomicsController.synthesizeMtb(req, res, next));

// =========================================================================
// 6. NABL ISO 15189:2022 & CAP LAP MULTI-OMICS DOSSIER GENERATION
// =========================================================================
router.post('/dossier/generate', (req, res, next) => aetherGenomicsController.generateDossier(req, res, next));

// =========================================================================
// 7. SOVEREIGN v7.0 SUB-ENGINES
// =========================================================================
// Phase 1: Dynamic Phenoconversion & 7-Organ PBPK ODE Simulator
router.post('/pgx/phenoconversion-pbpk', (req, res, next) => aetherGenomicsController.simulatePhenoconversionPbpk(req, res, next));

// Phase 2: Autonomous VUS Eliminator & Protein Folding ΔΔG Thermodynamic Solver
router.post('/acmg/autonomous-biophysics', (req, res, next) => aetherGenomicsController.evaluateAutonomousBiophysics(req, res, next));

// Phase 3: Ruifrok Beer-Lambert Stain Deconvolution & Delaunay Cell-Topology Graph
router.post('/wsi/deconvolve-microenvironment', (req, res, next) => aetherGenomicsController.deconvolveMicroenvironment(req, res, next));

// Phase 4: Subclonal Phylogenetics, HRD Scar & Lotka-Volterra Clonal Competition ODE
router.post('/mtb/evolutionary-trajectory', (req, res, next) => aetherGenomicsController.forecastClonalEvolution(req, res, next));

// Phase 5: Neoantigen MHC-I/II Epitope Binding & Personalized mRNA Vaccine Designer
router.post('/immuno/design-neoantigen-vaccine', (req, res, next) => aetherGenomicsController.designPersonalizedMrnaVaccine(req, res, next));

// Phase 6: Serial ctDNA Liquid Biopsy Minimal Residual Disease (MRD) & Gompertzian Relapse
router.post('/mrd/evaluate-ctdna-kinetics', (req, res, next) => aetherGenomicsController.evaluateCtdnaMrdKinetics(req, res, next));

// Phase 7: GA4GH Phenopackets v2 & Rare Disease HPO Semantic Graph DAG Solver
router.post('/phenopackets/solve-rare-disease', (req, res, next) => aetherGenomicsController.solveRareDiseasePhenopackets(req, res, next));

export default router;

