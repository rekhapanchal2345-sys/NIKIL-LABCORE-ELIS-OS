/**
 * Phase 4 — Standalone SCIM 2.0 Router
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Mounted at `/scim/v2` directly on the Express app to conform to RFC 7644
 * root endpoint path conventions for Okta and Microsoft Entra ID SCIM agents.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Router } from "express";
import {
  authenticateScim,
  scimListUsersHandler,
  scimGetUserHandler,
  scimCreateUserHandler,
  scimUpdateUserHandler,
  scimPatchUserHandler,
  scimDeleteUserHandler,
  scimConfigHandler,
} from "./scim.controller";

const router = Router();

router.use(authenticateScim);

router.get("/Users", scimListUsersHandler);
router.get("/Users/:id", scimGetUserHandler);
router.post("/Users", scimCreateUserHandler);
router.put("/Users/:id", scimUpdateUserHandler);
router.patch("/Users/:id", scimPatchUserHandler);
router.delete("/Users/:id", scimDeleteUserHandler);
router.get("/ServiceProviderConfig", scimConfigHandler);

export default router;
