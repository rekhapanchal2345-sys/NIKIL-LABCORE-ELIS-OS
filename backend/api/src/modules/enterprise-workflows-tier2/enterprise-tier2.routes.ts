import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { enterpriseTier2Controller } from './enterprise-tier2.controller';

const router = Router();

// Require valid authentication token for all microbiology, inventory & telemetry operations
router.use(authenticate);

// ============================================================================
// 1. CLINICAL MICROBIOLOGY, CULTURE & AST + HICC ANTIBIOGRAM ROUTES
// ============================================================================
router.get('/microbiology/cultures', (req, res, next) =>
  enterpriseTier2Controller.listMicrobiologyCultures(req, res, next)
);
router.post('/microbiology/cultures/accession', (req, res, next) =>
  enterpriseTier2Controller.accessionCulture(req, res, next)
);
router.post('/microbiology/cultures/gram-stain', (req, res, next) =>
  enterpriseTier2Controller.recordGramStain(req, res, next)
);
router.post('/microbiology/cultures/isolate-ast', (req, res, next) =>
  enterpriseTier2Controller.recordIsolateAst(req, res, next)
);
router.get('/microbiology/antibiogram', (req, res, next) =>
  enterpriseTier2Controller.getHiccAntibiogram(req, res, next)
);
router.post('/microbiology/pkpd-simulation', (req, res, next) =>
  enterpriseTier2Controller.calculatePkPdSimulation(req, res, next)
);
router.post('/microbiology/resistome-concordance', (req, res, next) =>
  enterpriseTier2Controller.evaluateResistomeConcordance(req, res, next)
);
router.post('/microbiology/synergy-checkerboard', (req, res, next) =>
  enterpriseTier2Controller.calculateSynergyCheckerboard(req, res, next)
);
router.get('/microbiology/transmission-graph', (req, res, next) =>
  enterpriseTier2Controller.getTransmissionClusterGraph(req, res, next)
);
router.get('/microbiology/whonet-export', (req, res, next) =>
  enterpriseTier2Controller.exportWhonetGlass(req, res, next)
);
router.post('/microbiology/cultures/critical-call', (req, res, next) =>
  enterpriseTier2Controller.logCriticalCall(req, res, next)
);
router.get('/microbiology/critical-calls', (req, res, next) =>
  enterpriseTier2Controller.listCriticalCalls(req, res, next)
);

// ============================================================================
// 2. REAGENT CONSUMABLE INVENTORY & CPT PROFITABILITY ROUTES
// ============================================================================
router.get('/inventory/overview', (req, res, next) =>
  enterpriseTier2Controller.getReagentInventoryOverview(req, res, next)
);
router.post('/inventory/reagent-lots', (req, res, next) =>
  enterpriseTier2Controller.registerReagentLot(req, res, next)
);
router.post('/inventory/consume-recipe', (req, res, next) =>
  enterpriseTier2Controller.executeTestRecipeConsumption(req, res, next)
);
router.get('/inventory/cpt-profitability', (req, res, next) =>
  enterpriseTier2Controller.getCptProfitabilityMatrix(req, res, next)
);

// ============================================================================
// 3. B2B HUB-AND-SPOKE LOGISTICS & FRANCHISEE WALLET LEDGER ROUTES
// ============================================================================
router.get('/logistics/dashboard', (req, res, next) =>
  enterpriseTier2Controller.getLogisticsDashboard(req, res, next)
);
router.get('/logistics/telemetry', (req, res, next) =>
  enterpriseTier2Controller.getLogisticsDashboard(req, res, next)
);
router.post('/logistics/b2b-requisition', (req, res, next) =>
  enterpriseTier2Controller.bookB2BRequisition(req, res, next)
);
router.post('/logistics/wallet-topup', (req, res, next) =>
  enterpriseTier2Controller.topupPartnerWallet(req, res, next)
);
router.post('/logistics/manifests', (req, res, next) =>
  enterpriseTier2Controller.generateManifest(req, res, next)
);
router.post('/logistics/manifests/receive-hub', (req, res, next) =>
  enterpriseTier2Controller.receiveManifestAtHub(req, res, next)
);

export default router;
