/**
 * LABCORE CHRONOS-HEMODYNAMICS & QUANTUM-BIOFLUIDICS NEXUS™
 * Express Route Declarations
 */

import { Router } from 'express';
import { chronosOmegaController } from './chronos-omega.controller';

const router = Router();

// 1. Telemetry
router.get('/telemetry', (req, res, next) => chronosOmegaController.getTelemetry(req, res, next));

// 2. Stewart Quantitative Physical Chemistry Acid-Base Newton-Raphson Solver
router.post('/stewart-abg/solve-newton', (req, res, next) => chronosOmegaController.solveStewartAbg(req, res, next));

// 3. Closed-Loop RK4 + MAP Bayesian TDM Solver
router.post('/tdm/solve-rk4-bayesian', (req, res, next) => chronosOmegaController.solveRk4Tdm(req, res, next));

// 4. Liquid Biopsy cfDNA Fragmentomics Convex Deconvolution
router.post('/liquid-biopsy/deconvolve-too', (req, res, next) => chronosOmegaController.deconvolveLiquidBiopsy(req, res, next));

// 5. 5-PL Immunoassay & Hook-Effect Interceptor
router.post('/immunoassay/evaluate-5pl-hook', (req, res, next) => chronosOmegaController.evaluateImmunoassayHook(req, res, next));

// 6. Patient-Based Real-Time QC (PBRTQC) & Graph-Laplacian Multi-Analyzer Drift
router.post('/pbrtqc/evaluate-laplacian-cusum', (req, res, next) => chronosOmegaController.evaluatePbrtqc(req, res, next));

// 7. ISO 15189 / IEEE 11073 SDC Cryptographic Bundle Seal
router.post('/dossier/seal-cryptographic-bundle', (req, res, next) => chronosOmegaController.generateDossier(req, res, next));

export default router;
