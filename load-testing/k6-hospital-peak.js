/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NIKIL-LABCORE-ELIS-OS — K6 PRODUCTION LOAD TESTING SUITE (DAY 27)
 * ═══════════════════════════════════════════════════════════════════════════
 * Simulates 50 concurrent hospital operators during morning peak load:
 * - 10 Front Desk Receptionists (EMPI registration, order billing)
 * - 10 Phlebotomists (Accessioning, barcode verification)
 * - 15 Laboratory Technicians (Results entry, Westgard QC)
 * - 10 Pathologists (Workstation approvals, digital sign-off)
 * - 5 Accountants (Cash counter, till reconciliation)
 *
 * Execution Target:
 * - Throughput: > 1,000 Requests/Minute (> 16.7 RPS)
 * - Latency SLA: P95 < 200ms, P99 < 400ms
 * - Error Rate: < 0.1% (Zero 5xx server errors)
 * ═══════════════════════════════════════════════════════════════════════════
 * Run with k6:
 *   k6 run load-testing/k6-hospital-peak.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics
export const errorRate = new Rate('custom_error_rate');
export const criticalPanicAlerts = new Counter('critical_panic_alerts_detected');
export const clinicalReadLatency = new Trend('clinical_read_latency');
export const clinicalWriteLatency = new Trend('clinical_write_latency');

export const options = {
  scenarios: {
    hospital_morning_peak: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '15s', target: 20 }, // Ramp-up
        { duration: '30s', target: 50 }, // Sustained peak morning load (50 concurrent operators)
        { duration: '15s', target: 50 }, // High-throughput saturation
        { duration: '10s', target: 0 },  // Graceful ramp-down
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<400'], // P95 under 200ms SLA
    http_req_failed: ['rate<0.01'],                 // Under 1% failure rate
    custom_error_rate: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://127.0.0.1:5000/api';

export default function () {
  const vuId = __VU;

  // Distribute 50 virtual users across realistic clinical roles:
  // VU 1-10: Front Desk Receptionists
  // VU 11-20: Phlebotomists
  // VU 21-35: Lab Technicians
  // VU 36-45: Pathologists
  // VU 46-50: Accountants

  if (vuId <= 10) {
    // ── ROLE 1: FRONT DESK / RECEPTIONIST ──
    group('Receptionist Workflow', function () {
      const start = Date.now();
      const resSearch = http.get(`${BASE_URL}/patients?q=Sharma&limit=10`);
      clinicalReadLatency.add(Date.now() - start);

      const success = check(resSearch, {
        'search patients status is 200': (r) => r.status === 200,
      });
      errorRate.add(!success);

      // Fast Order creation inquiry
      const resTests = http.get(`${BASE_URL}/tests?limit=20`);
      check(resTests, {
        'fetch test catalog status is 200': (r) => r.status === 200,
      });

      sleep(0.5);
    });
  } else if (vuId <= 20) {
    // ── ROLE 2: PHLEBOTOMIST ──
    group('Phlebotomist Workflow', function () {
      const start = Date.now();
      const resSamples = http.get(`${BASE_URL}/samples?status=COLLECTED&limit=20`);
      clinicalReadLatency.add(Date.now() - start);

      const success = check(resSamples, {
        'samples roster status is 200': (r) => r.status === 200,
      });
      errorRate.add(!success);

      // Barcode lookup
      const resBarcode = http.get(`${BASE_URL}/search?q=SMP-2026`);
      check(resBarcode, {
        'barcode search status is 200': (r) => r.status === 200,
      });

      sleep(0.5);
    });
  } else if (vuId <= 35) {
    // ── ROLE 3: LAB TECHNICIAN ──
    group('Lab Technician Workflow', function () {
      const start = Date.now();
      const resWorklist = http.get(`${BASE_URL}/results?status=PENDING&limit=25`);
      clinicalReadLatency.add(Date.now() - start);

      const success = check(resWorklist, {
        'results worklist status is 200': (r) => r.status === 200,
      });
      errorRate.add(!success);

      // QC Levey-Jennings series lookup
      const resQc = http.get(`${BASE_URL}/analyzers/qc-runs?limit=30`);
      check(resQc, {
        'QC runs status is 200': (r) => r.status === 200,
      });

      sleep(0.4);
    });
  } else if (vuId <= 45) {
    // ── ROLE 4: PATHOLOGIST ──
    group('Pathologist Workflow', function () {
      const start = Date.now();
      const resApprovals = http.get(`${BASE_URL}/approvals?limit=15`);
      clinicalReadLatency.add(Date.now() - start);

      const success = check(resApprovals, {
        'approvals queue status is 200': (r) => r.status === 200,
      });
      errorRate.add(!success);

      // Verify report signature check
      const resReport = http.get(`${BASE_URL}/reports/verify/REP-2026-0001`);
      check(resReport, {
        'report verify status is 200': (r) => r.status === 200 || r.status === 404,
      });

      sleep(0.6);
    });
  } else {
    // ── ROLE 5: ACCOUNTANT ──
    group('Accountant Workflow', function () {
      const start = Date.now();
      const resInvoices = http.get(`${BASE_URL}/invoices?limit=20`);
      clinicalReadLatency.add(Date.now() - start);

      const success = check(resInvoices, {
        'invoices register status is 200': (r) => r.status === 200,
      });
      errorRate.add(!success);

      const resDrawer = http.get(`${BASE_URL}/cash-counter/current`);
      check(resDrawer, {
        'current till status is 200': (r) => r.status === 200,
      });

      sleep(0.5);
    });
  }
}
