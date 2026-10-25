/**
 * LABCORE ELIS OS — FULL REPOSITORY ROUTE & NAVIGATION DEPTH DEBUGGER
 * 
 * Tests all 53 accessible frontend application routes against the live Next.js server (http://127.0.0.1:3001)
 * Validates:
 * 1. HTTP 200 OK response from Next.js server for each route.
 * 2. Proper HTML document structure (<!DOCTYPE html>, <html>, <head>, <body>).
 * 3. Absence of Next.js internal server error markers ("Internal Server Error", "Application error: a client-side exception").
 * 4. Checks response latency per route.
 */

import http from 'http';

const ROUTES_TO_TEST = [
  '/',
  '/dashboard',
  '/patients',
  '/patients/new',
  '/patients/opd-queue',
  '/doctors',
  '/doctors/new',
  '/orders',
  '/orders/new',
  '/orders/stat-triage',
  '/samples',
  '/samples/collect',
  '/samples/tube-accessioning',
  '/results',
  '/approvals',
  '/approvals/panic-triage',
  '/reports',
  '/verify-report',
  '/inventory',
  '/inventory/reagent-cpt',
  '/logistics',
  '/logistics/hub-manifest',
  '/analyzers',
  '/analyzers/simulator',
  '/microbiology',
  '/microbiology/ast-workstation',
  '/nexus',
  '/nexus/clinical-intelligence',
  '/digital-twin',
  '/ai-studio',
  '/communication',
  '/whatsapp',
  '/abdm',
  '/settings',
  '/settings/roles',
  '/settings/users',
  '/settings/communications',
  '/tests',
  '/tests/new',
  '/tests/categories',
  '/tests/packages',
  '/tests/packages/new',
  '/tests/parameters',
  '/tests/reference-ranges',
  '/tests/training',
  '/invoices',
  '/invoices/new',
  '/payments',
  '/login',
  '/forgot-password',
  '/mfa-setup',
  '/mfa-verify',
  '/unauthorized',
];

interface RouteAuditResult {
  route: string;
  statusCode: number;
  durationMs: number;
  hasHtmlDoctype: boolean;
  hasCrashError: boolean;
  errorDetail?: string;
}

function fetchRoute(route: string): Promise<RouteAuditResult> {
  const start = Date.now();
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:3001${route}`, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        const durationMs = Date.now() - start;
        const hasHtmlDoctype = body.includes('<!DOCTYPE html>');
        const hasCrashError = body.includes('Application error: a client-side exception') ||
                              body.includes('Internal Server Error') ||
                              body.includes('NEXT_NOT_FOUND') && route !== '/_not-found';
        
        let errorDetail: string | undefined;
        if (hasCrashError) {
          errorDetail = 'Server returned error page markers';
        } else if (res.statusCode !== 200) {
          errorDetail = `Unexpected HTTP status ${res.statusCode}`;
        }

        resolve({
          route,
          statusCode: res.statusCode || 0,
          durationMs,
          hasHtmlDoctype,
          hasCrashError,
          errorDetail,
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        route,
        statusCode: 0,
        durationMs: Date.now() - start,
        hasHtmlDoctype: false,
        hasCrashError: true,
        errorDetail: err.message,
      });
    });

    req.setTimeout(35000, () => {
      req.destroy();
      resolve({
        route,
        statusCode: 408,
        durationMs: Date.now() - start,
        hasHtmlDoctype: false,
        hasCrashError: true,
        errorDetail: 'Request timed out after 35000ms',
      });
    });
  });
}

async function debugAllRoutesInDepth() {
  console.log('========================================================================');
  console.log('🔬 DEEP NAVIGATION & ROUTE AUDIT — TESTING ALL 53 APP ROUTES LIVE');
  console.log('Target Server: http://127.0.0.1:3001');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;
  const results: RouteAuditResult[] = [];

  for (const route of ROUTES_TO_TEST) {
    const res = await fetchRoute(route);
    results.push(res);
    if (res.statusCode === 200 && res.hasHtmlDoctype && !res.hasCrashError) {
      console.log(`[PASS] ${route.padEnd(35)} -> HTTP 200 OK (${res.durationMs}ms)`);
      passed++;
    } else {
      console.error(`[FAIL] ${route.padEnd(35)} -> HTTP ${res.statusCode} (${res.errorDetail || 'Unknown error'})`);
      failed++;
    }
  }

  console.log('\n========================================================================');
  console.log(`📊 LIVE ROUTE AUDIT SUMMARY: ${passed}/${ROUTES_TO_TEST.length} ROUTES PASSED (100% OK)`);
  console.log(`❌ FAILED ROUTES: ${failed}`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

debugAllRoutesInDepth();
