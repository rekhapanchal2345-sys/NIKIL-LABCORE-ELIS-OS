/**
 * Phase 4 — Enterprise SSO Controller (OIDC & SAML 2.0)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * REST & SAML HTTP-POST Handlers for Enterprise Identity Federation:
 *
 *   GET  /auth/sso/providers                  — list enabled IdP buttons
 *   GET  /auth/sso/:slug/login                — initiate OIDC flow
 *   GET  /auth/sso/:slug/callback             — handle OIDC redirect
 *   GET  /auth/sso/:slug/saml/metadata        — export SP metadata XML
 *   GET  /auth/sso/:slug/saml/login           — initiate SAML AuthnRequest
 *   POST /auth/sso/:slug/saml/acs             — receive SAML assertion
 *
 *   GET    /admin/sso/providers               — manage IdP configs (ADMIN)
 *   POST   /admin/sso/providers               — register new IdP
 *   PUT    /admin/sso/providers/:id           — update IdP
 *   DELETE /admin/sso/providers/:id           — remove IdP
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Request, Response, NextFunction } from "express";
import {
  listSsoProviders,
  getSsoProviderBySlug,
  createSsoProvider,
  updateSsoProvider,
  deleteSsoProvider,
  generateOidcAuthUrl,
  handleOidcCallback,
  generateSamlSpMetadata,
  generateSamlAuthnRequest,
  handleSamlResponse,
} from "./sso.service";
import { successResponse } from "../../utils/response";
import { HttpError } from "../../utils/http-error";
import { getClientIp } from "../../utils/request-meta";
import type { AuthenticatedRequest } from "../../../middleware/auth";
import type { AuthUser } from "../../lib/auth";

const getUser = (req: Request): AuthUser => {
  const u = (req as AuthenticatedRequest).user;
  if (!u) throw new HttpError("Authentication required", 401, "UNAUTHENTICATED");
  return u;
};

// ─── Public SSO Endpoints ─────────────────────────────────────────────────────

export const listPublicProvidersHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const providers = await listSsoProviders(true);
    successResponse(res, providers, "SSO Providers");
  } catch (err) {
    next(err);
  }
};

export const oidcLoginHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const slug = String(req.params.slug);
    const provider = await getSsoProviderBySlug(slug);

    if (provider.protocol !== "OIDC") {
      throw new HttpError(`Provider '${slug}' uses ${provider.protocol}, not OIDC`, 400, "PROTOCOL_MISMATCH");
    }

    const host = req.get("host");
    const proto = req.protocol;
    const defaultRedirect = `${proto}://${host}/api/auth/sso/${slug}/callback`;
    const redirectUri = (req.query.redirect_uri as string) || defaultRedirect;
    const state = (req.query.state as string) || "sso_state";

    const { authUrl } = generateOidcAuthUrl(provider, redirectUri, state);

    if (req.query.redirect === "true") {
      return res.redirect(authUrl);
    }

    successResponse(res, { authUrl }, "OIDC Authorization URL");
  } catch (err) {
    next(err);
  }
};

export const oidcCallbackHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const slug = String(req.params.slug);
    const code = String(req.query.code || req.body?.code || "");

    if (!code) {
      throw new HttpError("Authorization code missing from IdP callback", 400, "MISSING_CODE");
    }

    const provider = await getSsoProviderBySlug(slug);
    const host = req.get("host");
    const proto = req.protocol;
    const defaultRedirect = `${proto}://${host}/api/auth/sso/${slug}/callback`;
    const redirectUri = (req.query.redirect_uri as string) || defaultRedirect;

    const result = await handleOidcCallback({
      provider,
      code,
      redirectUri,
      ipAddress: getClientIp(req),
      userAgent: String(req.headers["user-agent"] || ""),
    });

    successResponse(res, result, "SSO Sign-in Successful");
  } catch (err) {
    next(err);
  }
};

// ─── SAML 2.0 Handlers ────────────────────────────────────────────────────────

export const samlMetadataHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const slug = String(req.params.slug);
    const host = req.get("host");
    const proto = req.protocol;
    const spEntityId = `${proto}://${host}/api/auth/sso/${slug}/saml/metadata`;
    const acsUrl = `${proto}://${host}/api/auth/sso/${slug}/saml/acs`;

    const xml = generateSamlSpMetadata({ spEntityId, acsUrl });

    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (err) {
    next(err);
  }
};

export const samlLoginHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const slug = String(req.params.slug);
    const provider = await getSsoProviderBySlug(slug);

    if (provider.protocol !== "SAML") {
      throw new HttpError(`Provider '${slug}' uses ${provider.protocol}, not SAML`, 400, "PROTOCOL_MISMATCH");
    }

    const host = req.get("host");
    const proto = req.protocol;
    const spEntityId = `${proto}://${host}/api/auth/sso/${slug}/saml/metadata`;
    const acsUrl = `${proto}://${host}/api/auth/sso/${slug}/saml/acs`;

    const { redirectUrl } = generateSamlAuthnRequest({
      provider,
      spEntityId,
      acsUrl,
      relayState: req.query.RelayState as string,
    });

    if (req.query.redirect === "true") {
      return res.redirect(redirectUrl);
    }

    successResponse(res, { redirectUrl }, "SAML AuthnRequest URL");
  } catch (err) {
    next(err);
  }
};

export const samlAcsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const slug = String(req.params.slug);
    const samlResponseBase64 = String(req.body?.SAMLResponse || "");

    if (!samlResponseBase64) {
      throw new HttpError("SAMLResponse payload is missing from assertion consumer request", 400, "MISSING_SAML_RESPONSE");
    }

    const provider = await getSsoProviderBySlug(slug);

    const result = await handleSamlResponse({
      provider,
      samlResponseBase64,
      ipAddress: getClientIp(req),
      userAgent: String(req.headers["user-agent"] || ""),
    });

    successResponse(res, result, "SAML Assertion Accepted — Sign-in Successful");
  } catch (err) {
    next(err);
  }
};

// ─── Admin SSO Provider Management ────────────────────────────────────────────

export const adminListProvidersHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const providers = await listSsoProviders(false);
    successResponse(res, providers, "All SSO Providers");
  } catch (err) {
    next(err);
  }
};

export const adminCreateProviderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admin = getUser(req);
    const provider = await createSsoProvider(req.body, admin.id);
    successResponse(res, provider, "SSO Provider created", 201);
  } catch (err) {
    next(err);
  }
};

export const adminUpdateProviderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admin = getUser(req);
    const id = String(req.params.id);
    const provider = await updateSsoProvider(id, req.body, admin.id);
    successResponse(res, provider, "SSO Provider updated");
  } catch (err) {
    next(err);
  }
};

export const adminDeleteProviderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admin = getUser(req);
    const id = String(req.params.id);
    const result = await deleteSsoProvider(id, admin.id);
    successResponse(res, result, "SSO Provider deleted");
  } catch (err) {
    next(err);
  }
};
