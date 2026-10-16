/**
 * STEP-UP AUTHENTICATION MIDDLEWARE
 *
 * Protects sensitive operations (PII export, bulk delete, settings change)
 * by requiring a fresh MFA verification — separate from the login MFA.
 *
 * Flow:
 *   1. Client calls a protected endpoint without a step-up token
 *   2. Middleware returns 403 with { requiresStepUp: true, scope, hint }
 *   3. Client prompts user for TOTP code
 *   4. Client calls POST /api/auth/step-up/verify { mfaCode, scope }
 *   5. Server issues a step-up token (5 min TTL)
 *   6. Client retries the original request with X-Step-Up-Token header
 *   7. This middleware verifies the token and allows the request
 *
 * Usage:
 *   router.post(
 *     "/patients/export",
 *     authenticate,
 *     requireStepUp("pii_export"),
 *     exportController
 *   );
 */

import type { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyStepUpToken } from "../src/lib/auth";
import { HttpError } from "../src/utils/http-error";
import type { AuthenticatedRequest } from "./auth";

// ─── Middleware Factory ───────────────────────────────────────────────────────

/**
 * Express middleware that enforces step-up authentication for a given scope.
 *
 * @param scope  The operation scope (e.g., "pii_export", "bulk_delete")
 * @param maxAgeSeconds  How long the step-up token is considered fresh (default: 300 = 5 min)
 */
export const requireStepUp = (
  scope: string,
  maxAgeSeconds = 300
): RequestHandler => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const request = req as AuthenticatedRequest;

    if (!request.user) {
      res.status(401).json({
        success: false,
        message:  "Authentication required.",
        code:     "UNAUTHENTICATED",
      });
      return;
    }

    const stepUpToken =
      (req.headers["x-step-up-token"] as string | undefined) ||
      (req as any).body?.stepUpToken;

    if (!stepUpToken) {
      // Inform client that a step-up is required
      res.status(403).json({
        success:        false,
        message:        "This action requires additional verification.",
        code:           "STEP_UP_REQUIRED",
        requiresStepUp: true,
        scope,
        hint:           "Complete MFA step-up at POST /api/auth/step-up/verify and retry with X-Step-Up-Token header.",
      });
      return;
    }

    try {
      const payload = verifyStepUpToken(
        stepUpToken,
        request.user.id,
        request.sid,
        scope
      );

      // Check token age against maxAgeSeconds
      if (payload.iat) {
        const ageSeconds = Math.floor(Date.now() / 1000) - payload.iat;
        if (ageSeconds > maxAgeSeconds) {
          res.status(403).json({
            success:        false,
            message:        "Step-up verification has expired. Please re-verify.",
            code:           "STEP_UP_EXPIRED",
            requiresStepUp: true,
            scope,
          });
          return;
        }
      }

      next();
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({
          success:        false,
          message:        error.message,
          code:           error.code ?? "STEP_UP_INVALID",
          requiresStepUp: true,
          scope,
        });
      } else {
        res.status(403).json({
          success:        false,
          message:        "Step-up verification failed.",
          code:           "STEP_UP_INVALID",
          requiresStepUp: true,
          scope,
        });
      }
    }
  };
};

// ─── Step-Up Verify Endpoint Logic ───────────────────────────────────────────
// (Controller logic — imported by auth.controller.ts)

import {
  generateStepUpToken,
  verifyAccessToken,
} from "../src/lib/auth";
import {
  decryptField,
} from "../src/utils/field-crypto";
import {
  verifyTotp,
} from "../src/utils/totp";
import prisma from "../config/database";
import type { UserRole } from "../src/lib/auth";

export interface StepUpVerifyInput {
  mfaCode: string;   // TOTP code from authenticator app
  scope:   string;   // Operation scope being confirmed
  userId:  string;
  sessionId?: string;
}

/**
 * Verifies TOTP code and issues a step-up token for the given scope.
 * Called from auth.controller.ts → POST /api/auth/step-up/verify
 */
export async function verifyStepUpCode(input: StepUpVerifyInput): Promise<{
  stepUpToken: string;
  scope: string;
  expiresInSeconds: number;
}> {
  const user = await prisma.user.findUnique({
    where:  { id: input.userId },
    select: {
      id:           true,
      employeeCode: true,
      email:        true,
      fullName:     true,
      role:         true,
      status:       true,
      mfaEnabled:   true,
      totpSecretEnc: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new HttpError("User not found or inactive.", 401, "USER_INACTIVE");
  }

  if (!user.mfaEnabled || !user.totpSecretEnc) {
    throw new HttpError(
      "MFA is not enabled on this account. Enable MFA before performing this action.",
      400,
      "MFA_NOT_ENABLED"
    );
  }

  const secret = decryptField(user.totpSecretEnc);
  const valid  = verifyTotp(secret, input.mfaCode);

  if (!valid) {
    throw new HttpError(
      "Invalid authenticator code. Please try again.",
      401,
      "INVALID_TOTP"
    );
  }

  const stepUpToken = generateStepUpToken(
    {
      id:           user.id,
      employeeCode: user.employeeCode,
      email:        user.email,
      fullName:     user.fullName,
      role:         user.role as UserRole,
      status:       user.status as any,
    },
    input.sessionId,
    input.scope
  );

  return {
    stepUpToken,
    scope: input.scope,
    expiresInSeconds: 300, // 5 minutes
  };
}
