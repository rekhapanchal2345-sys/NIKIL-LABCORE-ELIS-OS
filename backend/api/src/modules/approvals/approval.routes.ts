import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../../../middleware/auth.middleware';
import { authorize } from '../../../middleware/rbac.middleware';
import {
  ApprovalController,
  getMetrics,
  pending,
  getOne,
  rejectResult,
  publishResult,
  saveCriticalAck,
  getHistoryTrend,
  getSignature,
  getPanicReadBackLedger,
  checkOrderDispatchStatus,
} from './approval.controller';

const router = Router();

// ─── PUBLIC / VERIFICATION SEAL ENDPOINTS (Accessible for external QR checks) ───
router.get('/:id/verify-seal', ApprovalController.verifySeal);
router.get('/:id/verify-signature', ApprovalController.verifySeal);

// ─── CLINICAL AUTHENTICATION REQUIRED FOR ALL PROTECTED CLINICAL ACTIONS ───
router.use(authenticate);

// ─── DAY 2: STATISTICAL QC & LEVEY-JENNINGS (CLSI C24-A4 / NABL 7.3) ───
router.get('/qc-chart/:testCode', ApprovalController.getQcChart);
router.post('/qc-chart/:testCode/record', ApprovalController.recordQcPoint);

// ─── DAY 2: CRITICAL PANIC TRIAGE & TELEPHONIC READ-BACK (NABL 7.4.2) ───
router.get('/triage/queue', ApprovalController.getTriageQueue);
router.post('/panic-triage/readback', ApprovalController.logPanicReadBack);
router.get('/panic-triage/ledger', getPanicReadBackLedger);
router.get('/panic-triage/dispatch-status/:orderId', checkOrderDispatchStatus);

// ─── DAY 2: HIGH-THROUGHPUT BATCH APPROVAL ENGINE ───
router.post(
  '/batch-approve',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PATHOLOGIST),
  ApprovalController.batchApprove
);

// ─── DAY 2: POST-SIGN-OFF RESULT AMENDMENT WORKFLOW (NABL 7.4.3) ───
router.post(
  '/:id/amend',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PATHOLOGIST),
  ApprovalController.amendResult
);
router.get('/:id/amendments', ApprovalController.getResultAmendments);

// ─── DAY 1: ELECTRONIC DOCTOR SEAL & DIGITAL SIGNATURE ROUTES ───
router.post(
  '/:id/approve',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PATHOLOGIST),
  ApprovalController.approveSingleResult
);
router.post(
  '/:id/sign',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PATHOLOGIST),
  ApprovalController.approveSingleResult
);
router.post(
  '/doctors/:doctorId/signature',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PATHOLOGIST),
  ApprovalController.uploadSignature
);

// ─── CORE WORKLIST & ACTIONS ───
router.get('/metrics', getMetrics);
router.get('/pending', pending);
router.get('/', pending);
router.get('/:id', getOne);
router.post(
  '/:id/reject',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PATHOLOGIST),
  rejectResult
);
router.post(
  '/:id/publish',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PATHOLOGIST),
  publishResult
);
router.post('/:id/critical-ack', saveCriticalAck);
router.get('/:id/history', getHistoryTrend);
router.get('/:id/signature', getSignature);

export default router;
