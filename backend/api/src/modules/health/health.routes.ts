/**
 * ==============================================================================
 * LabCore ELIS OS — Health & Observability Routes
 * Multi-probe endpoints mounted at /api/health and /health
 * ==============================================================================
 */

import { Router } from "express";
import { healthController } from "./health.controller";

const router = Router();

router.get("/liveness", (req, res) => healthController.getLiveness(req, res));
router.get("/readiness", (req, res) => healthController.getReadiness(req, res));
router.get("/detailed", (req, res) => healthController.getHealth(req, res));
router.get("/", (req, res) => healthController.getHealth(req, res));

export default router;
