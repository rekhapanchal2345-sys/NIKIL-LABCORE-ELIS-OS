/**
 * Phase 5 — SIEM & SOC Security Threat Telemetry Controller
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Exporters & Management for Security Operations Centers (SOC):
 *
 *   GET  /admin/siem/cef                      — stream CEF formatted logs (Splunk/ArcSight)
 *   GET  /admin/siem/syslog                   — stream RFC 5424 syslog
 *   GET  /admin/siem/threats                  — list detected security threats
 *   POST /admin/siem/threats/:id/mitigate     — manual threat mitigation action
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Request, Response, NextFunction } from "express";
import {
  exportCefTelemetry,
  exportSyslogTelemetry,
  listThreatAlerts,
  mitigateThreatAlert,
} from "./siem-telemetry.service";
import { successResponse } from "../../utils/response";
import { HttpError } from "../../utils/http-error";
import type { AuthenticatedRequest } from "../../../middleware/auth";
import type { AuthUser } from "../../lib/auth";

const getUser = (req: Request): AuthUser => {
  const u = (req as AuthenticatedRequest).user;
  if (!u) throw new HttpError("Authentication required", 401, "UNAUTHENTICATED");
  return u;
};

export const exportCefHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = Number(req.query.limit || 200);
    const since = req.query.since ? new Date(req.query.since as string) : undefined;

    const events = await exportCefTelemetry({ limit, since });
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(events.join("\n"));
  } catch (err) {
    next(err);
  }
};

export const exportSyslogHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = Number(req.query.limit || 200);
    const since = req.query.since ? new Date(req.query.since as string) : undefined;

    const events = await exportSyslogTelemetry({ limit, since });
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(events.join("\n"));
  } catch (err) {
    next(err);
  }
};

export const listThreatAlertsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 25);
    const severity = req.query.severity as any;
    const threatType = req.query.threatType as any;

    const alerts = await listThreatAlerts({ page, limit, severity, threatType });
    successResponse(res, alerts, "Security Threat Alerts");
  } catch (err) {
    next(err);
  }
};

export const mitigateThreatHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admin = getUser(req);
    const alertId = String(req.params.id);
    const action = String(req.body?.action || "OPERATOR_DISMISSED");

    const updated = await mitigateThreatAlert({
      alertId,
      action,
      adminId: admin.id,
    });

    successResponse(res, updated, "Threat Alert Mitigated");
  } catch (err) {
    next(err);
  }
};
