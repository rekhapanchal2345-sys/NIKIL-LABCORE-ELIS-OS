/**
 * LEGACY IMPORT PATH — REDIRECTED TO THE SINGLE AUTHENTICATION IMPLEMENTATION
 *
 * This file used to hold a second, weaker copy of `authenticate`. Two
 * implementations meant two different security policies, and this one was the
 * weaker of the pair: it skipped the session-revocation check, the idle-timeout
 * check, the issuer/audience verification and the token-type check, and it
 * printed the first 20 characters of every bearer token to the logs.
 *
 * It guarded 24 of the route files, so those weaknesses applied to patients,
 * orders, results, reports, audit logs and backups. The most serious was the
 * missing token-type check: the short-lived MFA challenge token (`typ: "mfa"`,
 * issued *before* the second factor is satisfied) and the owner
 * re-authentication token (`typ: "owner"`) were both accepted as ordinary
 * access tokens, which bypassed MFA entirely. Signing out also did not end
 * access on those routes, because a revoked session was never consulted.
 *
 * There is now exactly one implementation, in ./auth, and this module only
 * re-exports it so the existing import paths keep working. Do not add
 * authentication logic here; add it to ./auth instead.
 */
export { authenticate, requireOwnerToken } from "./auth";

/**
 * Retained for `rbac.middleware` and other legacy consumers. It is the same
 * request type that the single implementation populates.
 */
export type { AuthenticatedRequest as AuthRequest } from "./auth";