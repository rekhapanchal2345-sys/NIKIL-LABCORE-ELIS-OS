/**
 * Role lists for Settings access control.
 *
 * These mirror the permission matrix in
 * `backend/api/middleware/rbac.middleware.ts` (ROLE_PERMISSIONS), so the UI
 * never offers a Settings screen that the API would reject:
 *
 *   SUPER_ADMIN -> settings:view, settings:edit, settings:manage_integrations
 *   ADMIN       -> settings:view, settings:edit
 *   BRANCH_ADMIN-> settings:view
 *   AUDITOR     -> settings:view
 *   everyone else -> no settings permissions
 */

/** Roles holding `settings:view` - may open the Settings section at all. */
export const SETTINGS_VIEW_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "BRANCH_ADMIN",
  "AUDITOR",
];

/**
 * Roles allowed to administer users and roles. `users:manage_roles` is granted
 * to SUPER_ADMIN only, while ADMIN keeps `users:edit`; both tiers are included
 * so the matrix remains usable for day-to-day administration.
 */
export const SETTINGS_ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];

/** Roles holding `settings:edit`, which Communication Providers writes through. */
export const SETTINGS_EDIT_ROLES = ["SUPER_ADMIN", "ADMIN"];