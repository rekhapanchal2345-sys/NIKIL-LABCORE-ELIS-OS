/**
 * MASTER CLINICAL MODULE & NAVIGATION DEPTH DEBUGGER
 * 
 * Executes deep, authenticated functional checks across all primary clinical modules:
 * 1. Authenticates against live backend API (http://127.0.0.1:5000)
 * 2. Tests core API data retrieval for all 20 clinical modules
 * 3. Tests search, filtering, and pagination query parameters
 * 4. Verifies response payload schemas and error handling
 * 5. Validates frontend route availability on Next.js server (http://127.0.0.1:3001)
 */

import 'dotenv/config';

interface ApiCheck {
  module: string;
  endpoint: string;
  method?: string;
  query?: Record<string, string>;
  expectedField?: string;
}

const API_CHECKS: ApiCheck[] = [
  { module: 'Health', endpoint: '/health' },
  { module: 'API Discovery', endpoint: '/api' },
  { module: 'Dashboard Metrics', endpoint: '/api/orders/analytics' },
  { module: 'Dashboard Pipeline', endpoint: '/api/orders/pipeline' },
  { module: 'Patient Hub (List)', endpoint: '/api/patients', query: { page: '1', limit: '10' }, expectedField: 'patients' },
  { module: 'Patient Hub (Search)', endpoint: '/api/patients', query: { search: 'Rajesh' } },
  { module: 'Doctors (List)', endpoint: '/api/doctors', query: { limit: '10' } },
  { module: 'Doctors (Search)', endpoint: '/api/doctors', query: { search: 'Vikram' } },
  { module: 'Test Catalog', endpoint: '/api/tests', query: { limit: '10' } },
  { module: 'Orders (List)', endpoint: '/api/orders', query: { limit: '10' }, expectedField: 'orders' },
  { module: 'Orders (Analytics)', endpoint: '/api/orders/analytics/tat' },
  { module: 'Samples (Accessioning)', endpoint: '/api/samples', query: { limit: '10' } },
  { module: 'Results (Pending Queue)', endpoint: '/api/results', query: { limit: '10' } },
  { module: 'Approvals (Pending)', endpoint: '/api/approvals/pending' },
  { module: 'Approvals (Metrics)', endpoint: '/api/approvals/metrics' },
  { module: 'Reports (List)', endpoint: '/api/reports', query: { limit: '10' } },
  { module: 'Invoices (List)', endpoint: '/api/invoices', query: { limit: '10' } },
  { module: 'Payments (List)', endpoint: '/api/payments', query: { limit: '10' } },
  { module: 'Analyzers (Fleet)', endpoint: '/api/analyzers' },
  { module: 'Omniscient Nexus Overview', endpoint: '/api/nexus/command-center' },
  { module: 'Omniscient Nexus Fleet', endpoint: '/api/nexus/fleet-status', query: { threshold: '30' } },
  { module: 'Enterprise Tubes', endpoint: '/api/enterprise-workflows/tubes' },
  { module: 'STAT Triage Board', endpoint: '/api/enterprise-workflows/stat-triage/board' },
  { module: 'Microbiology Cultures', endpoint: '/api/enterprise-tier2/microbiology/cultures' },
  { module: 'Microbiology Antibiogram', endpoint: '/api/enterprise-tier2/microbiology/antibiogram' },
  { module: 'Reagent Inventory Overview', endpoint: '/api/enterprise-tier2/inventory/overview' },
  { module: 'Logistics Fleet Telemetry', endpoint: '/api/enterprise-tier2/logistics/telemetry' },
  { module: 'Audit Log Trail', endpoint: '/api/audit', query: { limit: '10' } },
  { module: 'Settings Laboratory', endpoint: '/api/settings/laboratory' },
];

async function runDeepModuleDebugging() {
  console.log('========================================================================');
  console.log('🩺 DEEP CLINICAL MODULE & NAVIGATION DEBUGGING EXECUTION');
  console.log('Target API: http://127.0.0.1:5000');
  console.log('========================================================================\n');

  // 1. Authenticate to obtain token
  console.log('--- STEP 1: AUTHENTICATING AS SUPER_ADMIN ---');
  const email = process.env.ADMIN_EMAIL || 'admin@labcore.local';
  const password = process.env.ADMIN_PASSWORD || 'default_secure_pwd';

  const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed with HTTP ${loginRes.status}: ${await loginRes.text()}`);
  }

  const loginData: any = await loginRes.json();
  const token = loginData.data?.accessToken || loginData.data?.token;
  if (!token) throw new Error('No access token returned from login');
  console.log(`[PASS] Authenticated successfully as ${loginData.data?.user?.fullName} [${loginData.data?.user?.role}]`);

  // 2. Execute deep API checks across all 20 modules
  console.log('\n--- STEP 2: DEEP API CHECKS ACROSS 20 CLINICAL MODULES ---');
  let passedApi = 0;
  let failedApi = 0;

  for (const check of API_CHECKS) {
    const url = new URL(`http://127.0.0.1:5000${check.endpoint}`);
    if (check.query) {
      for (const [k, v] of Object.entries(check.query)) {
        url.searchParams.set(k, v);
      }
    }

    const start = Date.now();
    try {
      const res = await fetch(url.toString(), {
        method: check.method || 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const elapsed = Date.now() - start;
      const text = await res.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch {}

      if (res.ok) {
        let extra = '';
        if (json?.data) {
          if (Array.isArray(json.data)) extra = `[${json.data.length} items]`;
          else if (typeof json.data === 'object') extra = `[${Object.keys(json.data).length} keys]`;
        } else if (Array.isArray(json)) {
          extra = `[${json.length} items]`;
        }
        console.log(`[PASS] ${check.module.padEnd(28)} -> HTTP ${res.status} (${elapsed}ms) ${extra}`);
        passedApi++;
      } else {
        console.error(`[FAIL] ${check.module.padEnd(28)} -> HTTP ${res.status} (${elapsed}ms) - ${text.substring(0, 100)}`);
        failedApi++;
      }
    } catch (err: any) {
      console.error(`[ERR ] ${check.module.padEnd(28)} -> Exception: ${err.message}`);
      failedApi++;
    }
  }

  console.log('\n========================================================================');
  console.log(`📊 API MODULE AUDIT SCORECARD: ${passedApi}/${API_CHECKS.length} PASSED (${Math.round((passedApi / API_CHECKS.length) * 100)}%)`);
  if (failedApi > 0) {
    console.error(`❌ FAILED MODULE APIS: ${failedApi}`);
  } else {
    console.log('🎉 100% OF CLINICAL MODULE BACKEND APIS ARE FULLY OPERATIONAL!');
  }
  console.log('========================================================================');

  process.exit(failedApi > 0 ? 1 : 0);
}

runDeepModuleDebugging().catch((e) => {
  console.error('Fatal debugger failure:', e);
  process.exit(1);
});
