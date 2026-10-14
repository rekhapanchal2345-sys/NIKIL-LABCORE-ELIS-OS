import { Router, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import {
  changePasswordHandler,
  forgotPassword,
  login,
  logout,
  profile,
  refresh,
  register,
  resetPassword,
  revokeSession,
  sessions,
  unlock,
  verifyEmailConfirm,
  verifyEmailRequest,
  verifyMfa,
  verifyOwner,
} from "./auth.controller";
import { authenticate, requireRoles } from "../../../middleware/auth";
import { validate } from "../../../middleware/validate.middleware";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  mfaVerifySchema,
  ownerVerifySchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailConfirmSchema,
  verifyEmailRequestSchema,
} from "./auth.validator";

const authLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Covers routine token refreshes for a shared workstation IP.
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX || 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please wait a few minutes.",
    code: "RATE_LIMITED",
  },
});

/**
 * A laboratory shares one egress IP across many workstations, so this limits
 * failed attempts per network rather than blocking legitimate sign-ins.
 * Per-account lockout handles targeted brute force.
 */
const loginLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_RATE_LIMIT_MAX || 30),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Too many sign-in attempts from this network. Please try later.",
    code: "RATE_LIMITED",
  },
});

/**
 * Tighter limiter for the endpoints that send email.
 *
 * These trigger an outbound message, so an unbounded caller could both mail-bomb
 * an address and use the SMTP connection for denial of service.
 */
const emailCodeLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.EMAIL_CODE_RATE_LIMIT_MAX || 5),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many codes requested. Please wait before trying again.",
    code: "RATE_LIMITED",
  },
});

/** Limiter for code verification, which must resist guessing. */
const codeVerifyLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.EMAIL_CODE_VERIFY_LIMIT_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please request a new code.",
    code: "RATE_LIMITED",
  },
});

const router = Router();

router.post(
  "/login",
  loginLimiter,
  validate({ body: loginSchema }),
  login
);

router.post(
  "/login/mfa",
  authLimiter,
  validate({ body: mfaVerifySchema }),
  verifyMfa
);

router.post(
  "/refresh",
  authLimiter,
  validate({ body: refreshSchema }),
  refresh
);

/**
 * Password recovery over Gmail.
 *
 * Both endpoints answer identically for known and unknown addresses so they
 * cannot be used to discover which emails have staff accounts.
 */
router.post(
  "/password/forgot",
  emailCodeLimiter,
  validate({ body: forgotPasswordSchema }),
  forgotPassword
);

router.post(
  "/password/reset",
  codeVerifyLimiter,
  validate({ body: resetPasswordSchema }),
  resetPassword
);

/** Confirms that a Gmail address can receive mail before it is trusted. */
router.post(
  "/verify-email/request",
  emailCodeLimiter,
  validate({ body: verifyEmailRequestSchema }),
  verifyEmailRequest
);

router.post(
  "/verify-email/confirm",
  codeVerifyLimiter,
  validate({ body: verifyEmailConfirmSchema }),
  verifyEmailConfirm
);

/**
 * Staff registration is restricted to administrators and now also requires a
 * fresh owner confirmation (POST /api/auth/owner/verify).
 */
router.post(
  "/register",
  authLimiter,
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  validate({ body: registerSchema }),
  register
);

/**
 * Re-confirm the signed-in operator with their own password.
 * Returns a short-lived token required by privileged browser actions.
 */
router.post(
  "/owner/verify",
  authLimiter,
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN", "BRANCH_ADMIN"),
  validate({ body: ownerVerifySchema }),
  verifyOwner
);

router.get("/profile", authenticate, profile);

router.get("/me", authenticate, profile);

router.post("/logout", authenticate, logout);

router.get("/sessions", authenticate, sessions);

router.delete("/sessions/:id", authenticate, revokeSession);

router.post(
  "/password/change",
  authenticate,
  validate({ body: changePasswordSchema }),
  changePasswordHandler
);

/**
 * Unlock an account locked by failed sign-in attempts.
 */
router.patch(
  "/:id/unlock",
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  unlock
);

export default router;
