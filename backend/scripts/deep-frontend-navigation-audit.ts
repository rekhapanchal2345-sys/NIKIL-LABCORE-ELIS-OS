import prisma from '../api/config/database';

interface RouteTest {
  name: string;
  path: string;
  category: string;
}

const STATIC_ROUTES: RouteTest[] = [
  // 1. Core & Auth
  { name: 'Root Landing / Direct', path: '/', category: 'Core' },
  { name: 'Login Page', path: '/login', category: 'Auth' },
  { name: 'Forgot Password', path: '/forgot-password', category: 'Auth' },
  { name: 'MFA Setup', path: '/mfa-setup', category: 'Auth' },
  { name: 'MFA Verify', path: '/mfa-verify', category: 'Auth' },
  { name: 'Unauthorized Gate', path: '/unauthorized', category: 'Auth' },

  // 2. Command Center & Operations
  { name: 'Executive Dashboard', path: '/dashboard', category: 'Command' },
  { name: 'Omniscient Nexus Hub', path: '/nexus', category: 'Command' },
  { name: 'Nexus Clinical Intelligence', path: '/nexus/clinical-intelligence', category: 'Command' },
  { name: 'Lab Digital Twin (DES)', path: '/digital-twin', category: 'Command' },

  // 3. Patient Management
  { name: 'Patient Directory (MPI)', path: '/patients', category: 'Patients' },
  { name: 'Register New Patient', path: '/patients/new', category: 'Patients' },
  { name: 'OPD Queue Live', path: '/patients/opd-queue', category: 'Patients' },
  { name: 'ABDM / ABHA Console', path: '/abdm', category: 'Patients' },

  // 4. Clinical Catalog & Doctors
  { name: 'Doctors Directory', path: '/doctors', category: 'Clinical' },
  { name: 'Add Doctor / Pathologist', path: '/doctors/new', category: 'Clinical' },
  { name: 'Test Catalog', path: '/tests', category: 'Clinical' },
  { name: 'New Test Definition', path: '/tests/new', category: 'Clinical' },
  { name: 'Test Categories', path: '/tests/categories', category: 'Clinical' },
  { name: 'Test Parameters & Units', path: '/tests/parameters', category: 'Clinical' },
  { name: 'Reference Ranges (CLSI)', path: '/tests/reference-ranges', category: 'Clinical' },
  { name: 'Test Packages', path: '/tests/packages', category: 'Clinical' },
  { name: 'New Test Package', path: '/tests/packages/new', category: 'Clinical' },
  { name: 'Test Training Module', path: '/tests/training', category: 'Clinical' },

  // 5. Orders & Triage
  { name: 'Orders Worklist', path: '/orders', category: 'Orders' },
  { name: 'New Lab Order Entry', path: '/orders/new', category: 'Orders' },
  { name: 'STAT Emergency Triage Desk', path: '/orders/stat-triage', category: 'Orders' },

  // 6. Specimens & Analyzers
  { name: 'Samples Pipeline', path: '/samples', category: 'Specimens' },
  { name: 'Phlebotomy Collection Desk', path: '/samples/collect', category: 'Specimens' },
  { name: 'Vacutainer Tube Accessioning', path: '/samples/tube-accessioning', category: 'Specimens' },
  { name: 'Analyzers Fleet & QC', path: '/analyzers', category: 'Analyzers' },
  { name: 'Virtual Analyzer Simulator (ASTM)', path: '/analyzers/simulator', category: 'Analyzers' },
  { name: 'Microbiology & AMR Hub', path: '/microbiology', category: 'Microbiology' },
  { name: 'AST & MIC Workstation', path: '/microbiology/ast-workstation', category: 'Microbiology' },
  { name: 'Integration Engine Matrix', path: '/integrations', category: 'Integration' },

  // 7. Results, Approvals & Reporting
  { name: 'Results Entry Worklist', path: '/results', category: 'Results' },
  { name: 'Pathologist Approvals Queue', path: '/approvals', category: 'Approvals' },
  { name: 'Panic Alert Triage Ledger', path: '/approvals/panic-triage', category: 'Approvals' },
  { name: 'Report Gallery & Dispatch', path: '/reports', category: 'Reports' },
  { name: 'Public QR Verify Portal', path: '/verify-report', category: 'Reports' },

  // 8. Finance & Billing
  { name: 'Invoices Register', path: '/invoices', category: 'Finance' },
  { name: 'Quick POS Cash Counter', path: '/invoices/new', category: 'Finance' },
  { name: 'Payments & Dual Custody', path: '/payments', category: 'Finance' },

  // 9. Supply Chain & Fleet
  { name: 'Inventory & Reagent Register', path: '/inventory', category: 'Logistics' },
  { name: 'Cost-Per-Test (CPT) Engine', path: '/inventory/reagent-cpt', category: 'Logistics' },
  { name: 'Logistics Fleet & Courier Radar', path: '/logistics', category: 'Logistics' },
  { name: 'Hub Manifest Consignment Dock', path: '/logistics/hub-manifest', category: 'Logistics' },

  // 10. AI Studio, Communication & Admin
  { name: 'Clinical AI Diagnostics Studio', path: '/ai-studio', category: 'AI' },
  { name: 'Omnichannel Communication Hub', path: '/communication', category: 'Communication' },
  { name: 'WhatsApp Engine & Templates', path: '/whatsapp', category: 'Communication' },
  { name: 'Settings Hub', path: '/settings', category: 'Admin' },
  { name: 'Communications Settings', path: '/settings/communications', category: 'Admin' },
  { name: 'Roles & Permissions', path: '/settings/roles', category: 'Admin' },
  { name: 'Users Management', path: '/settings/users', category: 'Admin' },
];

async function fetchRouteWithRetry(url: string, retries = 2): Promise<{ ok: boolean; status: number; elapsed: number; error?: string }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45s for cold JIT compiles
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'LabCore-Route-Deep-Audit/1.0' },
      });
      clearTimeout(timeout);
      const elapsed = Date.now() - start;
      const body = await res.text();
      const hasHtml = body.includes('<!DOCTYPE html>') || body.includes('<html');
      const hasErrorOverlay = body.includes('Unhandled Runtime Error') || body.includes('Next.js build error');

      if (res.ok && hasHtml && !hasErrorOverlay) {
        return { ok: true, status: res.status, elapsed };
      } else {
        return {
          ok: false,
          status: res.status,
          elapsed,
          error: hasErrorOverlay ? 'Next.js Runtime Error Overlay Detected' : `Status ${res.status}`,
        };
      }
    } catch (err: any) {
      clearTimeout(timeout);
      const elapsed = Date.now() - start;
      if (attempt === retries) {
        return { ok: false, status: 0, elapsed, error: err.message };
      }
    }
  }
  return { ok: false, status: 0, elapsed: 0, error: 'Unknown timeout' };
}

async function runDeepFrontendAudit() {
  console.log('========================================================================');
  console.log('🌐 DEEP FRONTEND NAVIGATION & MODULE ROUTE AUDIT');
  console.log('Target Server: http://127.0.0.1:3001');
  console.log('========================================================================\n');

  // 1. Fetch live database records for dynamic route verification
  console.log('--- STEP 1: RESOLVING DATABASE SEED RECORDS FOR DYNAMIC ROUTES ---');
  const patient = await prisma.patient.findFirst({ orderBy: { createdAt: 'desc' } });
  const doctor = await prisma.doctor.findFirst({ orderBy: { createdAt: 'desc' } });
  const test = await prisma.test.findFirst({ orderBy: { createdAt: 'desc' } });
  const order = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' } });
  const sample = await prisma.sample.findFirst({ orderBy: { createdAt: 'desc' } });
  const invoice = await prisma.invoice.findFirst({ orderBy: { createdAt: 'desc' } });
  const report = await prisma.report.findFirst({ orderBy: { createdAt: 'desc' } });

  console.log(`[SEED] Patient ID : ${patient?.id || 'NONE'}`);
  console.log(`[SEED] Doctor ID  : ${doctor?.id || 'NONE'}`);
  console.log(`[SEED] Test ID    : ${test?.id || 'NONE'}`);
  console.log(`[SEED] Order ID   : ${order?.id || 'NONE'}`);
  console.log(`[SEED] Sample ID  : ${sample?.id || 'NONE'}`);
  console.log(`[SEED] Invoice ID : ${invoice?.id || 'NONE'}`);
  console.log(`[SEED] Report ID  : ${report?.id || 'NONE'}`);

  const dynamicRoutes: RouteTest[] = [];
  if (patient) {
    dynamicRoutes.push({ name: `Patient Profile (${patient.id.slice(0, 8)})`, path: `/patients/${patient.id}`, category: 'Dynamic' });
    dynamicRoutes.push({ name: `Patient Edit (${patient.id.slice(0, 8)})`, path: `/patients/${patient.id}/edit`, category: 'Dynamic' });
    dynamicRoutes.push({ name: `Patient Print Registration`, path: `/patients/${patient.id}/print`, category: 'Dynamic' });
  }
  if (doctor) {
    dynamicRoutes.push({ name: `Doctor Profile (${doctor.id.slice(0, 8)})`, path: `/doctors/${doctor.id}`, category: 'Dynamic' });
  }
  if (test) {
    dynamicRoutes.push({ name: `Test Details (${test.id.slice(0, 8)})`, path: `/tests/${test.id}`, category: 'Dynamic' });
  }
  if (order) {
    dynamicRoutes.push({ name: `Order Details (${order.id.slice(0, 8)})`, path: `/orders/${order.id}`, category: 'Dynamic' });
    dynamicRoutes.push({ name: `Order Barcode Label`, path: `/orders/${order.id}/barcode`, category: 'Dynamic' });
    dynamicRoutes.push({ name: `Order Invoice View`, path: `/orders/${order.id}/invoice`, category: 'Dynamic' });
    dynamicRoutes.push({ name: `Order Receipt Print`, path: `/orders/${order.id}/receipt`, category: 'Dynamic' });
    dynamicRoutes.push({ name: `Order Report View`, path: `/reports/order/${order.id}`, category: 'Dynamic' });
  }
  if (sample) {
    dynamicRoutes.push({ name: `Sample Specimen Tracker`, path: `/samples/${sample.id}`, category: 'Dynamic' });
    dynamicRoutes.push({ name: `Sample Barcode Tube Label`, path: `/samples/${sample.id}/label`, category: 'Dynamic' });
  }
  if (invoice) {
    dynamicRoutes.push({ name: `Invoice Tax Receipt (${invoice.id.slice(0, 8)})`, path: `/invoices/${invoice.id}`, category: 'Dynamic' });
  }
  if (report) {
    dynamicRoutes.push({ name: `QR Verify Public Report`, path: `/verify-report/${report.id}`, category: 'Dynamic' });
  }

  const allRoutes = [...STATIC_ROUTES, ...dynamicRoutes];

  console.log(`\n--- STEP 2: VERIFYING ${allRoutes.length} FRONTEND ROUTES (JIT COMPILATION & HTML ASSERTION) ---`);
  let passedCount = 0;
  let failedCount = 0;

  for (const route of allRoutes) {
    const fullUrl = `http://127.0.0.1:3001${route.path}`;
    const result = await fetchRouteWithRetry(fullUrl);

    if (result.ok) {
      console.log(`[PASS] [${route.category.padEnd(10)}] ${route.name.padEnd(35)} -> HTTP ${result.status} (${result.elapsed}ms) [${route.path}]`);
      passedCount++;
    } else {
      console.error(`[FAIL] [${route.category.padEnd(10)}] ${route.name.padEnd(35)} -> HTTP ${result.status} (${result.elapsed}ms) - ${result.error} [${route.path}]`);
      failedCount++;
    }
  }

  console.log('\n========================================================================');
  console.log(`📊 FRONTEND ROUTE AUDIT SCORECARD: ${passedCount}/${allRoutes.length} PASSED (${Math.round((passedCount / allRoutes.length) * 100)}%)`);
  if (failedCount > 0) {
    console.error(`❌ FAILED FRONTEND ROUTES: ${failedCount}`);
  } else {
    console.log('🎉 100% OF NEXT.JS FRONTEND MODULE ROUTES ARE FULLY OPERATIONAL!');
  }
  console.log('========================================================================');

  await prisma.$disconnect();
  process.exit(failedCount > 0 ? 1 : 0);
}

runDeepFrontendAudit().catch((err) => {
  console.error('Fatal Frontend Audit Failure:', err);
  process.exit(1);
});
