import { Request, Response, NextFunction } from "express";
import {
  changePassword,
  getProfile,
  listUserSessions,
  loginUser,
  logoutSession,
  refreshSession,
  registerUser,
  revokeSessionById,
  unlockUser,
  verifyMfaLogin,
  verifyOwnerIdentity,
} from "./auth.service";
import {
  completePasswordReset,
  confirmEmailVerification,
  requestEmailVerification,
  requestPasswordReset,
} from "./password-reset.service";
import { successResponse, createdResponse } from "../../utils/response";
import { HttpError } from "../../utils/http-error";
import type { AuthenticatedRequest } from "../../../middleware/auth";

const bodyOf = (req: Request) =>
  ((req as any).validated?.body ?? req.body) as Record<string, any>;

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await registerUser(bodyOf(req) as any);
    return createdResponse(res, result, "User registered successfully");
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { identifier, password } = bodyOf(req);
    const result = await loginUser(identifier, password, req);

    if ("accessToken" in result && result.accessToken) {
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 15 * 60 * 1000,
      });
    }
    if ("refreshToken" in result && result.refreshToken) {
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/auth",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return successResponse(res, result, "Login successful");
  } catch (error) {
    next(error);
  }
};

export const verifyMfa = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { mfaToken, code } = bodyOf(req);
    const result = await verifyMfaLogin(mfaToken, code, req);

    if ("accessToken" in result && result.accessToken) {
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 15 * 60 * 1000,
      });
    }
    if ("refreshToken" in result && result.refreshToken) {
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/auth",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return successResponse(res, result, "MFA verified");
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = bodyOf(req).refreshToken || (req as any).cookies?.refreshToken;
    const result = await refreshSession(refreshToken, req);

    if ("accessToken" in result && result.accessToken) {
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 15 * 60 * 1000,
      });
    }

    return successResponse(res, result, "Session refreshed");
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new HttpError("Authentication required", 401);
    }

    if (req.sid) {
      await logoutSession(req.sid, req.user.id);
    }

    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/api/auth" });

    return successResponse(res, { ok: true }, "Logout successful");
  } catch (error) {
    next(error);
  }
};

export const sessions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await listUserSessions(req.user!.id);
    return successResponse(res, result, "Sessions fetched");
  } catch (error) {
    next(error);
  }
};

export const revokeSession = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new HttpError("Authentication required", 401);
    }
    const result = await revokeSessionById(String(req.params.id), req.user);
    return successResponse(res, result, "Session revoked");
  } catch (error) {
    next(error);
  }
};

export const unlock = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await unlockUser(String(req.params.id));
    return successResponse(res, result, "Account unlocked");
  } catch (error) {
    next(error);
  }
};

export const changePasswordHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword } = bodyOf(req);
    const result = await changePassword(
      req.user!.id,
      currentPassword,
      newPassword,
      req.sid
    );
    return successResponse(res, result, "Password changed successfully");
  } catch (error) {
    next(error);
  }
};

export const profile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await getProfile(req.user!.id);
    return successResponse(res, user, "Profile fetched successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Re-confirm the signed-in operator before a privileged action.
 * The password is checked against the database; nothing about it is trusted
 * from the client.
 */
export const verifyOwner = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { password } = bodyOf(req);
    const result = await verifyOwnerIdentity(
      req.user!.id,
      String(password ?? ""),
      req.sid,
      req
    );
    return successResponse(res, result, "Owner confirmed");
  } catch (error) {
    next(error);
  }
};

/**
 * Public: request a Gmail password-reset code.
 * The response is the same whether or not the address has an account.
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = bodyOf(req);
    const result = await requestPasswordReset(String(email ?? ""), req);
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, code, newPassword } = bodyOf(req);
    const result = await completePasswordReset({
      email: String(email ?? ""),
      code: String(code ?? ""),
      newPassword: String(newPassword ?? ""),
      req,
    });
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export const verifyEmailRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = bodyOf(req);
    const result = await requestEmailVerification(String(email ?? ""), req);
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export const verifyEmailConfirm = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, code } = bodyOf(req);
    const result = await confirmEmailVerification({
      email: String(email ?? ""),
      code: String(code ?? ""),
      req,
    });
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
};
