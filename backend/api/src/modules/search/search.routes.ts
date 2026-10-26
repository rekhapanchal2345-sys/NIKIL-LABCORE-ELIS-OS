import { Router } from "express";
import { SearchController } from "./search.controller";

const router = Router();

// GET /api/search - Global search endpoint
router.get("/", SearchController.globalSearch);

// GET /api/search/quick-actions - List of system actions
router.get("/quick-actions", SearchController.getQuickActions);

export default router;
