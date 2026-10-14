import type {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import type { ParamsDictionary } from "express-serve-static-core";

import {
  extractBearerToken,
  verifyAccessToken,
  verifyOwnerToken,
  type AuthUser,
} from "../src/lib/auth";

import {
  hasPermission,
  type Permission,
} from "../src/lib/permissions";

import prisma from "../config/database";
import { HttpError } from "../src/utils/http-error";
import { idleTimeoutMinutesForRole } from "../src/lib/permissions";

/**
 * =========================================
 * AUTHENTICATED REQUEST
 * =========================================
 *
 * After authenticate() succeeds:
 *
 * req.user
 * will contain the currently logged-in user.
 */
export interface AuthenticatedRequest<
  P = ParamsDictionary,
> extends Request<P> {
  user?: AuthUser;
  sid?: string;
}

/**
 * =========================================
 * ERROR RESPONSES
 * =========================================
 */

const unauthorized = (
  res: Response,
  message = "Authentication required."
): void => {
  res.status(401).json({
    success: false,
    message,
  });
};

const forbidden = (
  res: Response,
  message = "You do not have permission to perform this action."
): void => {
  res.status(403).json({
    success: false,
    message,
  });
};

/**
 * =========================================
 * AUTHENTICATE
 * =========================================
 *
 * Verifies:
 *
 * 1. Authorization header
 * 2. Bearer token
 * 3. JWT signature
 * 4. JWT payload
 * 5. User exists in database
 * 6. User account is ACTIVE
 *
 * Usage:
 *
 * router.get(
 *   "/",
 *   authenticate,
 *   controller
 * );
 */
export const authenticate: RequestHandler =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const request =
        req as AuthenticatedRequest;

      /**
       * -------------------------------------
       * Get Bearer token
       * -------------------------------------
       */
      const authorization =
        req.headers.authorization;

      const token =
        extractBearerToken(
          authorization
        ) || (req as any).cookies?.accessToken;

      if (!token) {
        unauthorized(
          res,
          "Bearer access token is required."
        );

        return;
      }

      /**
   * -------------------------------------
   * Verify JWT
   * -------------------------------------
   */
  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    if (error instanceof HttpError) {
      unauthorized(res, error.message);
    } else {
      unauthorized(res, "Invalid or expired access token.");
    }
    return;
  }

      /**
       * -------------------------------------
       * Validate token subject
       * -------------------------------------
       *
       * JWT "sub" contains User.id.
       */
      if (
        !payload.sub ||
        typeof payload.sub !== "string"
      ) {
        unauthorized(
          res,
          "Invalid access token payload."
        );

        return;
      }

      /**
       * -------------------------------------
       * Load current user
       * -------------------------------------
       *
       * We check the database on every
       * authenticated request.
       *
       * This means if an admin suspends
       * a user, their existing JWT won't
       * continue working.
       */
      const user =
        await prisma.user.findUnique({
          where: {
            id: payload.sub,
          },

          select: {
            id: true,
            employeeCode: true,
            email: true,
            fullName: true,
            role: true,
            status: true,
            passwordChangedAt: true,
          },
        });

      if (!user) {
        unauthorized(
          res,
          "User account no longer exists."
        );

        return;
      }

      /**
       * -------------------------------------
       * Check account status
       * -------------------------------------
       */
      if (user.status !== "ACTIVE") {
        unauthorized(
          res,
          `Account is ${user.status.toLowerCase()}.`
        );

        return;
      }

      /**
       * -------------------------------------
       * Token invalidation on password change
       * -------------------------------------
       * Tokens issued before passwordChangedAt are immediately rejected.
       */
      if (
        user.passwordChangedAt &&
        payload.iat &&
        Math.floor(user.passwordChangedAt.getTime() / 1000) > payload.iat
      ) {
        unauthorized(
          res,
          "Password was recently changed. Please sign in again with your new credentials."
        );

        return;
      }

      if (payload.typ && payload.typ !== "access") {
        unauthorized(res, "Access token required.");
        return;
      }

      if (payload.sid) {
        const session = await prisma.userSession.findFirst({
          where: {
            id: payload.sid,
            userId: user.id,
          },
        });

        if (!session || session.revokedAt || session.expiresAt < new Date()) {
          unauthorized(res, "Your session has ended. Please sign in again.");
          return;
        }

        const idleMs = idleTimeoutMinutesForRole(user.role) * 60 * 1000;
        if (Date.now() - session.lastSeenAt.getTime() > idleMs) {
          await prisma.userSession.update({
            where: { id: session.id },
            data: { revokedAt: new Date(), revokeReason: "idle_timeout" },
          });
          res.status(401).json({
            success: false,
            message: "Session expired due to inactivity. Please sign in again.",
            code: "IDLE_TIMEOUT",
          });
          return;
        }

        request.sid = session.id;

        void prisma.userSession
          .update({
            where: { id: session.id },
            data: { lastSeenAt: new Date() },
          })
          .catch(() => {});
      }

      request.user = {
        id: user.id,
        employeeCode:
          user.employeeCode,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
      };

      next();
    } catch (error) {
      next(error);
    }
  };

/**
 * =========================================
 * REQUIRE ROLES
 * =========================================
 *
 * Allows only specified roles.
 *
 * Example:
 *
 * router.post(
 *   "/",
 *   authenticate,
 *   requireRoles(
 *     "ADMIN",
 *     "FRONT_DESK"
 *   ),
 *   controller
 * );
 */
export const requireRoles = (
  ...allowedRoles: AuthUser["role"][]
): RequestHandler => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const request =
      req as AuthenticatedRequest;

    /**
     * Authentication must happen first.
     */
    if (!request.user) {
      unauthorized(res);

      return;
    }

    /**
     * Check role.
     *
     * Membership of the allowed list is required. There is deliberately no
     * "administrators may do anything" shortcut: a gate is a statement about
     * who may perform an action, and a blanket override silently widens every
     * narrowly-scoped route to "any admin", which is an access policy nobody
     * chose. Roles that are meant to have access are named in the list, and the
     * admin roles are named there explicitly.
     */
    const role = request.user.role;

    if (!allowedRoles.includes(role)) {
      forbidden(res);

      return;
    }

    next();
  };
};

/**
 * =========================================
 * REQUIRE ANY ONE OF THE GIVEN ROLES
 * =========================================
 *
 * User must hold at least ONE of the specified
 * roles.
 *
 * Example:
 *
 *   router.post(
 *     "/",
 *     authenticate,
 *     requireAnyRole(
 *       "ADMIN",
 *       "FRONT_DESK"
 *     ),
 *     controller
 *   );
 */
export const requireAnyRole = (
  ...allowedRoles: AuthUser["role"][]
): RequestHandler => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const request =
      req as AuthenticatedRequest;

    if (!request.user) {
      unauthorized(res);

      return;
    }

    if (
      !allowedRoles.includes(request.user.role)
    ) {
      forbidden(res);

      return;
    }

    next();
  };
};

/**
 * =========================================
 * REQUIRE ONE PERMISSION
 * =========================================
 *
 * User must have the specified
 * permission.
 *
 * Example:
 *
 * router.post(
 *   "/",
 *   authenticate,
 *   requirePermission(
 *     PERMISSIONS.PATIENT_CREATE
 *   ),
 *   controller
 * );
 */
export const requirePermission = (
  permission: Permission
): RequestHandler => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const request =
      req as AuthenticatedRequest;

    /**
     * Authentication must happen first.
     */
    if (!request.user) {
      unauthorized(res);

      return;
    }

    /**
     * Check permission.
     */
    if (
      !hasPermission(
        request.user.role,
        permission
      )
    ) {
      forbidden(res);

      return;
    }

    next();
  };
};

/**
 * =========================================
 * REQUIRE ANY PERMISSION
 * =========================================
 *
 * User must have at least ONE of the
 * provided permissions.
 *
 * Example:
 *
 * router.get(
 *   "/",
 *   authenticate,
 *   requireAnyPermission(
 *     PERMISSIONS.PATIENT_READ,
 *     PERMISSIONS.PATIENT_CREATE
 *   ),
 *   controller
 * );
 */
export const requireAnyPermission = (
  ...permissions: Permission[]
): RequestHandler => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const request =
      req as AuthenticatedRequest;

    /**
     * Authentication must happen first.
     */
    if (!request.user) {
      unauthorized(res);

      return;
    }

    /**
     * Check whether user has at least
     * one permission.
     */
    const allowed =
      permissions.some(
        (permission) =>
          hasPermission(
            request.user!.role,
            permission
          )
      );

    if (!allowed) {
      forbidden(res);

      return;
    }

    next();
  };
};

/**
 * =========================================
 * REQUIRE ALL PERMISSIONS
 * =========================================
 *
 * Optional helper.
 *
 * User must have EVERY permission
 * provided.
 *
 * Example:
 *
 * router.post(
 *   "/",
 *   authenticate,
 *   requireAllPermissions(
 *     PERMISSIONS.PATIENT_READ,
 *     PERMISSIONS.PATIENT_UPDATE
 *   ),
 *   controller
 * );
 */
export const requireAllPermissions = (
  ...permissions: Permission[]
): RequestHandler => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const request =
      req as AuthenticatedRequest;

    if (!request.user) {
      unauthorized(res);

      return;
    }

    const allowed =
      permissions.every(
        (permission) =>
          hasPermission(
            request.user!.role,
            permission
          )
      );

    if (!allowed) {
      forbidden(res);

      return;
    }

    next();
  };
};

/**
 * =========================================
 * REQUIRE OWNER TOKEN
 * =========================================
 *
 * Validates the `x-owner-token` header.
 * Must be used after `authenticate`.
 */
export const requireOwnerToken: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const request = req as AuthenticatedRequest;

  if (!request.user) {
    unauthorized(res);
    return;
  }

  const token = req.headers["x-owner-token"];
  if (!token || typeof token !== "string") {
    unauthorized(res, "Owner token is required for this action.");
    return;
  }

  try {
    verifyOwnerToken(token, request.user.id, request.sid);
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      unauthorized(res, error.message);
    } else {
      unauthorized(res, "Invalid owner token.");
    }
  }
};