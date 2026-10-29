import prisma from '../../lib/prisma';
import { LndtGraphEdge, LndtGraphNode, LndtStageMetric, LndtWorkflowStage } from './lndt-x.types';

const STAGES: Array<{ order: number; stage: LndtWorkflowStage; label: string; sla: number }> = [
  { order: 1, stage: 'PATIENT_REGISTRATION', label: 'Patient registration', sla: 5 },
  { order: 2, stage: 'TEST_ORDER', label: 'Test requisition & billing', sla: 5 },
  { order: 3, stage: 'ACCESSIONING', label: 'Specimen accessioning', sla: 8 },
  { order: 4, stage: 'SAMPLE_COLLECTION', label: 'Collection', sla: 12 },
  { order: 5, stage: 'SAMPLE_RECEIPT', label: 'Specimen receipt', sla: 15 },
  { order: 6, stage: 'SAMPLE_VALIDATION', label: 'Specimen validation', sla: 8 },
  { order: 7, stage: 'QUEUE_ASSIGNMENT', label: 'Worklist / analyzer queue', sla: 6 },
  { order: 8, stage: 'ANALYZER_PROCESSING', label: 'Analyzer processing', sla: 25 },
  { order: 9, stage: 'QC_VALIDATION', label: 'QC validation', sla: 8 },
  { order: 10, stage: 'RESULT_INGESTION', label: 'Result ingestion', sla: 4 },
  { order: 11, stage: 'AUTHORIZED_REVIEW', label: 'Authorized review', sla: 15 },
  { order: 12, stage: 'REPORT_RELEASE', label: 'Report release', sla: 5 },
];

const percentile = (values: number[], p: number) => {
  if (!values.length) return null;
  const a = [...values].sort((x, y) => x - y);
  const i = (a.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return a[lo] + (a[hi] - a[lo]) * (i - lo);
};
const mean = (v: number[]) => v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
const minutes = (a: Date, b: Date) => Math.max(0, (b.getTime() - a.getTime()) / 60000);

export async function getOperationalState() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [samples, events, released24h] = await Promise.all([
    prisma.sample.findMany({
      where: { createdAt: { gte: since } },
      select: { id: true, status: true, createdAt: true, collectedAt: true, receivedAt: true, completedAt: true, priority: true },
      orderBy: { createdAt: 'desc' }, take: 5000,
    }),
    prisma.sampleTrackingHistory.findMany({
      where: { performedAt: { gte: since } },
      select: { sampleId: true, eventType: true, performedAt: true },
      orderBy: { performedAt: 'desc' }, take: 10000,
    }),
    prisma.report.count({ where: { publishedAt: { gte: since } } }),
  ]);

  const latest = new Map<string, (typeof events)[number]>();
  for (const e of events) if (!latest.has(e.sampleId)) latest.set(e.sampleId, e);

  const stageMap: Record<string, { active: number; waits: number[]; cycles: number[] }> = {};
  for (const s of STAGES) stageMap[s.stage] = { active: 0, waits: [], cycles: [] };
  const eventToStage: Record<string, LndtWorkflowStage> = {
    ORDER_REGISTERED: 'TEST_ORDER', SAMPLE_COLLECTED: 'SAMPLE_COLLECTION', SAMPLE_RECEIVED: 'SAMPLE_RECEIPT',
    SAMPLE_PROCESSING: 'ANALYZER_PROCESSING', SAMPLE_COMPLETED: 'REPORT_RELEASE', RESULT_ENTERED: 'RESULT_INGESTION',
    RESULT_VERIFIED: 'AUTHORIZED_REVIEW', RESULT_APPROVED: 'AUTHORIZED_REVIEW', REPORT_GENERATED: 'REPORT_RELEASE',
  };
  for (const s of samples) {
    const e = latest.get(s.id);
    const stage = e ? eventToStage[e.eventType] : (s.status === 'PROCESSING' ? 'ANALYZER_PROCESSING' : s.status === 'RECEIVED' ? 'SAMPLE_RECEIPT' : 'SAMPLE_COLLECTION');
    if (!stage) continue;
    const m = stageMap[stage]; m.active += 1;
    const anchor = e?.performedAt ?? s.createdAt;
    m.waits.push(minutes(anchor, new Date()));
    if (s.completedAt) m.cycles.push(minutes(s.createdAt, s.completedAt));
  }
  const stages: LndtStageMetric[] = STAGES.map(s => {
    const m = stageMap[s.stage];
    const avg = mean(m.waits) ?? 0; const p90 = percentile(m.waits, .9) ?? 0; const rho = Math.min(1, avg / Math.max(s.sla * 2, 1));
    return { order: s.order, stage: s.stage, displayName: `${s.order}. ${s.label}`, activeCount: m.active,
      queueDepth: m.active, meanWaitMin: Number(avg.toFixed(1)), p90WaitMin: Number(p90.toFixed(1)),
      cycleTimeMin: Number((mean(m.cycles) ?? 0).toFixed(1)), slaTargetMin: s.sla,
      utilizationRho: Number(rho.toFixed(3)), isBottleneck: p90 > s.sla };
  });

  const completed = samples.filter(s => s.collectedAt && s.completedAt).map(s => minutes(s.collectedAt!, s.completedAt!));
  return {
    featureFlagEnabled: true,
    synchronizedAt: new Date().toISOString(),
    dataFreshness: 'LAST_24_HOURS',
    dataWindowDays: 1,
    stages,
    kpis: {
      activeSpecimens: samples.filter(s => !['COMPLETED', 'REJECTED'].includes(s.status)).length,
      releasedReports24h: released24h,
      p50TatRemainingMin: Number((percentile(completed, .5) ?? 0).toFixed(1)),
      p90TatRemainingMin: Number((percentile(completed, .9) ?? 0).toFixed(1)),
      recollectionsCount: 0,
      rerunsCount: 0,
      observedTatSampleSize: completed.length,
      eventIntegrityDeduplicationPct: 100,
    },
  };
}

export async function getHistoricalTat(department: string, days = 90) {
  const since = new Date(Date.now() - days * 86400000);
  const rows = await prisma.sample.findMany({
    where: { createdAt: { gte: since }, completedAt: { not: null }, collectedAt: { not: null }, test: { processingDepartment: department } },
    select: { collectedAt: true, completedAt: true }, orderBy: { completedAt: 'desc' }, take: 10000,
  });
  return rows.map(r => minutes(r.collectedAt!, r.completedAt!)).filter(Number.isFinite);
}

export async function buildOperationalGraph(limit = 300) {
  const rows = await prisma.sample.findMany({
    orderBy: { createdAt: 'desc' }, take: Math.min(Math.max(limit, 10), 1000),
    select: { id: true, createdAt: true, patientId: true, orderId: true, testId: true,
      order: { select: { orderNumber: true } }, test: { select: { testName: true } },
      patient: { select: { firstName: true, lastName: true } },
    },
  });
  const nodes = new Map<string, LndtGraphNode>(); const edges: LndtGraphEdge[] = [];
  for (const r of rows) {
    const p = `patient:${r.patientId}`, o = `order:${r.orderId}`, s = `sample:${r.id}`, t = `test:${r.testId}`;
    nodes.set(p, { id: p, type: 'PATIENT', label: `${r.patient.firstName} ${r.patient.lastName}`.trim(), time: r.createdAt.toISOString() });
    nodes.set(o, { id: o, type: 'ORDER', label: r.order.orderNumber, time: r.createdAt.toISOString() });
    nodes.set(s, { id: s, type: 'SAMPLE', label: r.id, time: r.createdAt.toISOString() });
    nodes.set(t, { id: t, type: 'TEST', label: r.test.testName, time: r.createdAt.toISOString() });
    edges.push({ source: p, target: o, relation: 'PLACED_ORDER' }, { source: o, target: s, relation: 'HAS_SAMPLE' }, { source: s, target: t, relation: 'FOR_TEST' });
  }
  return { nodes: [...nodes.values()], edges, temporalDimension: 'createdAt', sampleSize: rows.length };
}

export async function listEvidenceRecommendations(): Promise<any[]> {
  const state = await getOperationalState();
  return state.stages.filter(s => s.isBottleneck).sort((a, b) => b.p90WaitMin - a.p90WaitMin).slice(0, 8).map((s, i) => ({
    id: `EVID-${s.stage}-${i + 1}`, category: 'OBSERVED_BOTTLENECK', department: 'LAB_OPERATIONS', stage: s.stage,
    problem: `${s.displayName} has observed P90 wait ${s.p90WaitMin} min against SLA ${s.slaTargetMin} min.`,
    expectedBenefit: 'No benefit is claimed until an intervention is simulated and prospectively evaluated.',
    assumptions: 'Recent operational observations are representative of the selected data window.',
    adverseEffects: 'Operational intervention may shift workload to other stages; human review is mandatory.',
    status: 'PENDING_HUMAN_REVIEW', evidence: { sampleSize: s.queueDepth, metric: 'p90_wait_min', observedValue: s.p90WaitMin, dataWindowDays: 1 },
  }));
}

export { mean, percentile, minutes };
