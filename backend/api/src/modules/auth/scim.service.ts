/**
 * Phase 4 — SCIM 2.0 Identity Provisioning Service (RFC 7643 & RFC 7644)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Implements the System for Cross-domain Identity Management (SCIM) 2.0
 * protocol for automated employee provisioning & de-provisioning from:
 *
 *   • Microsoft Entra ID (Azure Active Directory)
 *   • Okta Universal Directory
 *   • Google Cloud Identity / Google Workspace
 *   • OneLogin / PingFederate
 *
 * Capabilities:
 *   • GET    /scim/v2/Users          (Paginated List with filtering)
 *   • GET    /scim/v2/Users/:id      (Single User retrieval)
 *   • POST   /scim/v2/Users          (Automated employee provisioning)
 *   • PUT    /scim/v2/Users/:id      (Full attribute replacement)
 *   • PATCH  /scim/v2/Users/:id      (Partial modification / de-provisioning)
 *   • DELETE /scim/v2/Users/:id      (Account suspension & session purge)
 *   • GET    /scim/v2/ServiceProviderConfig (Capability discovery)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import crypto from "crypto";
import prisma from "../../../config/database";
import { HttpError } from "../../utils/http-error";
import { createAuditLog } from "../audit/audit.service";
import { normaliseEmail, emailBlindIndex } from "../../utils/gmail";
import { hashPassword } from "../../utils/password";
import { revokeAllUserTokens } from "../../lib/token-blacklist";
import type { UserRole } from "../../lib/auth";

const SCIM_USER_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:User";
const SCIM_LIST_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:ListResponse";
const SCIM_ERROR_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:Error";

// ─── SCIM Token Authentication ────────────────═══════════════════════════════

export async function createScimToken(name: string, adminId: string) {
  const rawToken = `scim_${crypto.randomBytes(32).toString("hex")}`;
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const tokenRecord = await prisma.scimToken.create({
    data: {
      name,
      tokenHash,
      createdBy: adminId,
    },
  });

  await createAuditLog({
    userId: adminId,
    module: "SCIM",
    action: "SCIM_TOKEN_CREATED",
    recordId: tokenRecord.id,
    newData: { name },
  });

  return {
    id: tokenRecord.id,
    name: tokenRecord.name,
    token: rawToken, // Returned ONLY once
    createdAt: tokenRecord.createdAt,
  };
}

export async function verifyScimToken(authHeader?: string): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const raw = authHeader.replace(/^Bearer\s+/i, "").trim();
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");

  const token = await prisma.scimToken.findUnique({
    where: { tokenHash },
  });

  if (!token || !token.active) return false;
  if (token.expiresAt && new Date() > token.expiresAt) return false;

  // Touch last used
  await prisma.scimToken.update({
    where: { id: token.id },
    data: { lastUsedAt: new Date() },
  });

  return true;
}

export async function listScimTokens() {
  return prisma.scimToken.findMany({
    select: {
      id: true,
      name: true,
      active: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeScimToken(id: string, adminId: string) {
  await prisma.scimToken.update({
    where: { id },
    data: { active: false },
  });

  await createAuditLog({
    userId: adminId,
    module: "SCIM",
    action: "SCIM_TOKEN_REVOKED",
    recordId: id,
  });

  return { success: true };
}

// ─── SCIM Representation Serializer ──────────────────────────────────────────

export function formatScimUser(user: any, baseUrl = "/scim/v2") {
  const names = (user.fullName || "").split(" ");
  const givenName = names[0] || "";
  const familyName = names.slice(1).join(" ") || "";

  return {
    schemas: [SCIM_USER_SCHEMA],
    id: user.id,
    externalId: user.employeeCode,
    userName: user.email,
    name: {
      formatted: user.fullName,
      givenName,
      familyName,
    },
    displayName: user.fullName,
    active: user.status === "ACTIVE",
    emails: [
      {
        value: user.email,
        primary: true,
        type: "work",
      },
    ],
    roles: [
      {
        value: user.role,
        primary: true,
      },
    ],
    meta: {
      resourceType: "User",
      created: user.createdAt.toISOString(),
      lastModified: user.updatedAt ? user.updatedAt.toISOString() : user.createdAt.toISOString(),
      location: `${baseUrl}/Users/${user.id}`,
    },
  };
}

// ─── SCIM Operations ─────────────────────────────────────────────────────────

export async function getScimUsers(params: {
  startIndex?: number;
  count?: number;
  filter?: string;
  baseUrl?: string;
}) {
  const startIndex = Math.max(Number(params.startIndex || 1), 1);
  const count = Math.min(Math.max(Number(params.count || 50), 1), 100);
  const skip = startIndex - 1;

  const where: any = {};
  if (params.filter) {
    // Simple SCIM filter parser: userName eq "user@example.com"
    const eqMatch = params.filter.match(/userName\s+eq\s+"([^"]+)"/i);
    if (eqMatch) {
      where.email = normaliseEmail(eqMatch[1]);
    }
  }

  const [totalResults, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: count,
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    schemas: [SCIM_LIST_SCHEMA],
    totalResults,
    startIndex,
    itemsPerPage: users.length,
    Resources: users.map((u) => formatScimUser(u, params.baseUrl)),
  };
}

export async function getScimUserById(id: string, baseUrl?: string) {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new HttpError("SCIM User not found", 404, "NOT_FOUND");
  }

  return formatScimUser(user, baseUrl);
}

export async function createScimUser(body: any, baseUrl?: string) {
  const emailRaw = body.userName || (body.emails && body.emails[0]?.value);
  if (!emailRaw) {
    throw new HttpError("userName or email is required by SCIM specification", 400, "invalidValue");
  }

  const email = normaliseEmail(emailRaw);
  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    throw new HttpError(`User with email '${email}' already exists`, 409, "uniqueness");
  }

  const fullName =
    body.displayName ||
    body.name?.formatted ||
    `${body.name?.givenName || ""} ${body.name?.familyName || ""}`.trim() ||
    email.split("@")[0];

  const employeeCode =
    body.externalId || `EMP-SCIM-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  const role = (body.roles && body.roles[0]?.value) || "FRONT_DESK";
  const status = body.active === false ? "INACTIVE" : "ACTIVE";

  const passwordHash = await hashPassword(crypto.randomBytes(32).toString("hex"));

  const user = await prisma.user.create({
    data: {
      email,
      fullName,
      employeeCode,
      passwordHash,
      role: role as UserRole,
      status,
      emailVerified: true,
      emailBlindIndex: emailBlindIndex(email),
      passwordChangedAt: new Date(),
    },
  });

  await createAuditLog({
    userId: user.id,
    module: "SCIM",
    action: "SCIM_USER_PROVISIONED",
    recordId: user.id,
    newData: { email, fullName, role, employeeCode, status },
  });

  return formatScimUser(user, baseUrl);
}

export async function updateScimUser(id: string, body: any, baseUrl?: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new HttpError("SCIM User not found", 404, "NOT_FOUND");
  }

  const fullName =
    body.displayName ||
    body.name?.formatted ||
    `${body.name?.givenName || ""} ${body.name?.familyName || ""}`.trim() ||
    user.fullName;

  const role = (body.roles && body.roles[0]?.value) || user.role;
  const status = body.active === false ? "SUSPENDED" : "ACTIVE";

  const updated = await prisma.user.update({
    where: { id },
    data: {
      fullName,
      role: role as UserRole,
      status,
    },
  });

  if (body.active === false) {
    // Immediate token and session purge on employee deactivation
    await revokeAllUserTokens(id);
    await prisma.userSession.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: "SCIM_DEPROVISIONED" },
    });
  }

  await createAuditLog({
    userId: id,
    module: "SCIM",
    action: "SCIM_USER_UPDATED",
    recordId: id,
    oldData: { status: user.status, role: user.role },
    newData: { status: updated.status, role: updated.role },
  });

  return formatScimUser(updated, baseUrl);
}

export async function patchScimUser(id: string, body: any, baseUrl?: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new HttpError("SCIM User not found", 404, "NOT_FOUND");
  }

  const operations = body.Operations || [];
  let newStatus = user.status;
  let newRole = user.role;
  let newFullName = user.fullName;

  for (const op of operations) {
    const path = String(op.path || "").toLowerCase();
    const val = op.value;

    if (op.op?.toLowerCase() === "replace" || op.op?.toLowerCase() === "add") {
      if (path === "active" || path === "") {
        const activeVal = typeof val === "boolean" ? val : val?.active;
        if (activeVal !== undefined) {
          newStatus = activeVal ? "ACTIVE" : "SUSPENDED";
        }
      }
      if (path.includes("role")) {
        const roleVal = typeof val === "string" ? val : val?.[0]?.value;
        if (roleVal) newRole = roleVal as UserRole;
      }
      if (path === "displayname" || path === "name.formatted") {
        if (typeof val === "string") newFullName = val;
      }
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      status: newStatus,
      role: newRole,
      fullName: newFullName,
    },
  });

  if (newStatus === "SUSPENDED" && user.status !== "SUSPENDED") {
    // Purge active sessions on de-provisioning
    await revokeAllUserTokens(id);
    await prisma.userSession.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: "SCIM_DEPROVISIONED" },
    });
  }

  await createAuditLog({
    userId: id,
    module: "SCIM",
    action: "SCIM_USER_PATCHED",
    recordId: id,
    newData: { status: newStatus, role: newRole, operationsCount: operations.length },
  });

  return formatScimUser(updated, baseUrl);
}

export async function deleteScimUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new HttpError("SCIM User not found", 404, "NOT_FOUND");
  }

  // Healthcare compliance: soft-delete by deactivating account and purging sessions
  await prisma.user.update({
    where: { id },
    data: { status: "SUSPENDED" },
  });

  await revokeAllUserTokens(id);
  await prisma.userSession.updateMany({
    where: { userId: id, revokedAt: null },
    data: { revokedAt: new Date(), revokeReason: "SCIM_DELETED" },
  });

  await createAuditLog({
    userId: id,
    module: "SCIM",
    action: "SCIM_USER_DELETED",
    recordId: id,
  });

  return { success: true };
}

// ─── ServiceProviderConfig & Metadata ────────────────────────────────────────

export function getServiceProviderConfig() {
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
    documentationUri: "https://labcore.hospital.org/docs/scim",
    patch: { supported: true },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: true, maxResults: 100 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [
      {
        name: "OAuth Bearer Token",
        description: "Authentication scheme using the Authorization: Bearer header",
        specUri: "https://tools.ietf.org/html/rfc6750",
        type: "oauthbearertoken",
        primary: true,
      },
    ],
  };
}
