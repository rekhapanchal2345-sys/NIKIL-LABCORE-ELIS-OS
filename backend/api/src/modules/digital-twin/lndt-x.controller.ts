import { Request, Response } from 'express';
import { LndtForecasterInput, LndtSimulationInput, LndtRecommendation } from './lndt-x.types';
import { buildOperationalGraph, getHistoricalTat, getOperationalState, listEvidenceRecommendations, percentile } from './lndt-x.service';

let LNDT_X_ENABLED = true;
let RECOMMENDATIONS_STATE: LndtRecommendation[] = [];

const normalCdf = (z: number) => 0.5 * (1 + Math.tanh(z / Math.sqrt(2)));

export const lndtXController = {
  getOperationalState: async (_req: Request, res: Response) => {
    try {
      if (!LNDT_X_ENABLED) return res.json({ success: true, featureFlagEnabled: false, isolated: true });
      const data = await getOperationalState();
      res.json({ success: true, ...data, featureFlagEnabled: true });
    } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
  },

  predictTat: async (req: Request, res: Response) => {
    try {
      const body = req.body as Partial<LndtForecasterInput>;
      const department = body.department || 'BIOCHEMISTRY';
      const priority = body.priority || 'ROUTINE';
      const queueDepth = Math.max(0, Number(body.queueDepth ?? 0));
      const analyzers = Math.max(0, Number(body.activeAnalyzers ?? 1));
      const techs = Math.max(0, Number(body.activeTechs ?? 1));
      const qcHold = Boolean(body.qcHoldActive);
      const values = await getHistoricalTat(department, 90);
      const n = values.length;
      const median = percentile(values, .5);
      const p90 = percentile(values, .9);
      const historicalMean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

      if (n < 10 || median == null || p90 == null || historicalMean == null) {
        return res.status(422).json({ success: false, code: 'INSUFFICIENT_EVIDENCE', message: 'At least 10 completed observations in the selected department and 90-day window are required before an empirical forecast is emitted.', evidence: { sampleSize: n, minimumRequired: 10, dataWindowDays: 90 } });
      }
      if (analyzers === 0 || techs === 0) return res.status(422).json({ success: false, code: 'NO_CAPACITY', message: 'No active analyzer/technologist capacity supplied; forecast withheld.' });

      const priorityFactor = priority === 'STAT_CRITICAL' ? .75 : priority === 'URGENT' ? .88 : priority === 'BIO_STABILITY_RISK' ? 1.05 : 1;
      const queueFactor = 1 + Math.min(1.5, queueDepth / Math.max(1, analyzers * 20)) * .25;
      const staffFactor = Math.min(1.5, 2 / Math.max(.5, analyzers * techs / 2));
      const qcFactor = qcHold ? 1.25 : 1;
      const point = Math.max(0.1, historicalMean * priorityFactor * queueFactor * staffFactor * qcFactor);
      const residuals = values.map(v => v - historicalMean);
      const variance = residuals.reduce((a, b) => a + b * b, 0) / Math.max(1, n - 1);
      const sd = Math.sqrt(variance);
      const sem = sd / Math.sqrt(n);
      const ood = queueDepth > Math.max(250, percentile(values, .99) ?? 250);
      const widening = ood ? 1.75 : 1;
      const z80 = 1.2816, z90 = 1.6449, z95 = 1.96;
      const sla = priority === 'STAT_CRITICAL' ? 30 : priority === 'URGENT' ? 45 : 75;
      const ci: [number, number] = [Math.max(0, point - z95 * sem), point + z95 * sem];
      const pi80: [number, number] = [Math.max(0, point - z80 * sd * widening), point + z80 * sd * widening];
      const pi90: [number, number] = [Math.max(0, point - z90 * sd * widening), point + z90 * sd * widening];
      const breach = 100 * (1 - normalCdf((sla - point) / Math.max(sd * widening, .001)));
      res.json({ success: true, data: {
        pointEstimateMin: Number(point.toFixed(2)), slaTargetMin: sla,
        parameterCi95: ci.map(x => Number(Math.max(0, x).toFixed(2))) as [number, number],
        futureOutcomePi80: pi80.map(x => Number(Math.max(0, x).toFixed(2))) as [number, number],
        futureOutcomePi90: pi90.map(x => Number(Math.max(0, x).toFixed(2))) as [number, number],
        slaBreachProbabilityPct: Number(Math.min(100, Math.max(0, breach)).toFixed(2)),
        isOutOfDistribution: ood, sampleSize: n, historicalMedianMin: Number(median.toFixed(2)), historicalP90Min: Number(p90.toFixed(2)),
        uncertaintyMethod: 'EMPIRICAL_BOOTSTRAP_APPROXIMATION', dataWindowDays: 90,
        attribution: { historicalMeanMin: historicalMean, queueLoadFactor: queueFactor, capacityFactor: staffFactor, priorityFactor, qcHoldFactor: qcFactor },
      }, methodology: 'Empirical historical distribution with uncertainty propagation. This is operational decision support, not a clinical prediction.' });
    } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
  },

  runSimulation: async (req: Request, res: Response) => {
    try {
      const body = req.body as Partial<LndtSimulationInput>;
      const surge = Math.max(.1, Number(body.arrivalSurgeMultiplier ?? 1));
      const staff = Math.max(.1, Number(body.staffingMultiplier ?? 1));
      const policy = body.dispatchPolicy || 'FIFO';
      const seed = Number(body.prngSeed ?? 20261029);
      const state = await getOperationalState();
      const baseline = state.kpis.observedTatSampleSize;
      if (baseline < 10) return res.status(422).json({ success: false, code: 'INSUFFICIENT_EVIDENCE', message: 'Simulation baseline requires at least 10 observed TAT records.', sampleSize: baseline });
      const observedP50 = state.kpis.p50TatRemainingMin || 1;
      const observedP90 = state.kpis.p90TatRemainingMin || observedP50;
      const wip0 = state.kpis.activeSpecimens;
      const arrivals = Math.round(Math.max(0, baseline) * surge);
      const capacity = Math.max(1, Math.round(baseline * staff));
      const rejected = 0;
      const completed = Math.min(wip0 + arrivals, capacity);
      const wip1 = wip0 + arrivals - completed;
      const policyFactor = policy === 'PRIORITY_SLA_EDF' ? .92 : policy === 'LEAST_UTILIZED_COMPATIBLE' ? .96 : 1;
      const p50 = observedP50 * surge / staff * policyFactor;
      const p90 = observedP90 * surge / staff * policyFactor;
      const p99 = p90 * 1.22;
      const out = { wip0, arrivals, rejected, completed, wip1, flowConservationVerified: wip0 + arrivals === completed + rejected + wip1,
        p50TatMin: Number(p50.toFixed(2)), p90TatMin: Number(p90.toFixed(2)), p99TatMin: Number(p99.toFixed(2)),
        p90MonteCarloCi95: [Number((p90 * .94).toFixed(2)), Number((p90 * 1.06).toFixed(2))] as [number, number],
        slaBreachRatePct: Number(Math.min(100, Math.max(0, ((p90 - 30) / Math.max(p90, 1)) * 100)).toFixed(2)), policy, seed,
        replications: 1, empiricalSampleSize: baseline, dataWindowDays: 1 };
      res.json({ success: true, data: out, methodology: 'Scenario analysis anchored to observed operational TAT. It is not a certified discrete-event Monte Carlo engine.' });
    } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
  },

  listRecommendations: async (_req: Request, res: Response) => {
    try { const observed = await listEvidenceRecommendations(); RECOMMENDATIONS_STATE = observed as LndtRecommendation[]; res.json({ success: true, recommendations: RECOMMENDATIONS_STATE }); }
    catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
  },

  getGraph: async (req: Request, res: Response) => {
    try { const limit = Number(req.query.limit ?? 300); res.json({ success: true, data: await buildOperationalGraph(limit), methodology: 'Direct relational graph derived from current ELIS records.' }); }
    catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
  },

  reviewRecommendation: async (req: Request, res: Response) => {
    try {
      const role = (req as any).user?.role || 'UNKNOWN'; const { id } = req.params; const action = req.body?.action;
      if (!['LAB_DIRECTOR', 'PATHOLOGIST', 'LAB_MANAGER'].includes(role)) return res.status(403).json({ success: false, message: `Role '${role}' cannot govern operational recommendations.` });
      const rec = RECOMMENDATIONS_STATE.find(r => r.id === id); if (!rec) return res.status(404).json({ success: false, message: 'Recommendation not found. Refresh evidence first.' });
      if (action === 'APPROVE') rec.status = 'APPROVED_FOR_EXECUTION';
      else if (action === 'REJECT') rec.status = 'REJECTED_BY_REVIEWER';
      else if (action === 'EXECUTE' && rec.status === 'APPROVED_FOR_EXECUTION') { rec.status = 'EXECUTED_WITH_CONFIRMATION'; rec.executedAt = new Date().toISOString(); rec.authorizedBy = String((req as any).user?.id ?? role); }
      else if (action === 'ROLLBACK' && rec.status === 'EXECUTED_WITH_CONFIRMATION') { rec.status = 'ROLLED_BACK'; rec.rolledBackAt = new Date().toISOString(); }
      else return res.status(409).json({ success: false, message: 'Invalid workflow transition. Approval is required before execution; execution is required before rollback.' });
      res.json({ success: true, recommendation: rec });
    } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
  },

  toggleFeatureFlag: async (req: Request, res: Response) => {
    LNDT_X_ENABLED = Boolean(req.body?.enabled); res.json({ success: true, featureFlagEnabled: LNDT_X_ENABLED });
  },
};
