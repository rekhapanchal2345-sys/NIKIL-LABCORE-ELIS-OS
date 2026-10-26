/**
 * ==============================================================================
 * LabCore ELIS OS — Health & Observability Controller
 * Handles incoming health probe requests from load balancers and orchestrators.
 * ==============================================================================
 */

import { Request, Response } from "express";
import { healthService } from "./health.service";

export class HealthController {
  /**
   * Main Health Telemetry Endpoint
   * Returns comprehensive status across DB, Redis, storage, and memory.
   */
  public async getHealth(_req: Request, res: Response): Promise<void> {
    try {
      const report = await healthService.getDetailedHealth();
      res.status(report.httpCode).json(report);
    } catch (err: any) {
      res.status(503).json({
        status: "UNHEALTHY",
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Kubernetes / Docker Liveness Probe
   * Fast, non-blocking process responsiveness check.
   */
  public getLiveness(_req: Request, res: Response): void {
    const liveness = healthService.getLiveness();
    res.status(200).json(liveness);
  }

  /**
   * Kubernetes / Docker Readiness Probe
   * Asserts PostgreSQL and Redis availability before routing traffic.
   */
  public async getReadiness(_req: Request, res: Response): Promise<void> {
    try {
      const readiness = await healthService.getReadiness();
      res.status(readiness.httpCode).json(readiness);
    } catch (err: any) {
      res.status(503).json({
        status: "DOWN",
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export const healthController = new HealthController();
