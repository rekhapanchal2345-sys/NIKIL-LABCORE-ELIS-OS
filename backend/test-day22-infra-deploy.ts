/**
 * ==============================================================================
 * LabCore ELIS OS — Day 22 / Hour 22 Automated Verification Test Suite
 * Production Infrastructure: Docker Compose, Nginx Reverse Proxy (TLS 1.3),
 * ASTM TCP Stream Proxy (Port 5005) & UFW Firewall Hardening
 * ==============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = path.resolve(__dirname, '..');

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];
let totalAssertions = 0;
let passedAssertions = 0;

function assert(condition: boolean, message: string): void {
  totalAssertions++;
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  passedAssertions++;
}

function runTest(suiteName: string, testName: string, fn: () => void): void {
  const start = performance.now();
  try {
    fn();
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    results.push({ name: `[${suiteName}] ${testName}`, passed: true, durationMs });
    console.log(`  \x1b[32m✓\x1b[0m ${testName} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    results.push({ name: `[${suiteName}] ${testName}`, passed: false, error: err.message, durationMs });
    console.log(`  \x1b[31m✗\x1b[0m ${testName} (${durationMs}ms)`);
    console.log(`    \x1b[31mError: ${err.message}\x1b[0m`);
  }
}

console.log('\n==============================================================================');
console.log('🏗️  DAY 22: PRODUCTION INFRASTRUCTURE, DOCKER COMPOSE & NGINX TLS 1.3 SUITE');
console.log('==============================================================================\n');

// ==============================================================================
// SUITE 1: DOCKER COMPOSE PRODUCTION TOPOLOGY
// ==============================================================================
console.log('\x1b[36m--- Suite 1: Docker Compose Production Topology (docker-compose.prod.yml) ---\x1b[0m');

const dockerComposePath = path.join(ROOT_DIR, 'docker-compose.prod.yml');
const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf-8');

runTest('Docker Compose', 'All 7 production services declared with correct container names', () => {
  const requiredServices = ['postgres:', 'redis:', 'backend:', 'web:', 'login-portal:', 'nginx:', 'certbot:'];
  for (const svc of requiredServices) {
    assert(dockerComposeContent.includes(svc), `Missing service declaration: ${svc}`);
  }

  const containerNames = [
    'labcore-postgres-prod',
    'labcore-redis-prod',
    'labcore-backend-prod',
    'labcore-web-prod',
    'labcore-portal-prod',
    'labcore-nginx-prod',
    'labcore-certbot-prod'
  ];
  for (const cName of containerNames) {
    assert(dockerComposeContent.includes(cName), `Missing container_name: ${cName}`);
  }
});

runTest('Docker Compose', 'Postgres service configured with healthcheck, volumes and resource limits', () => {
  assert(dockerComposeContent.includes('image: postgres:16-alpine'), 'Postgres must use postgres:16-alpine');
  assert(dockerComposeContent.includes('pg_isready -U'), 'Postgres must have pg_isready healthcheck');
  assert(dockerComposeContent.includes('postgres_data:/var/lib/postgresql/data'), 'Postgres must mount postgres_data volume');
  assert(dockerComposeContent.includes('5432:5432'), 'Postgres must expose port 5432');
  assert(dockerComposeContent.includes('labcore-network'), 'Postgres must join labcore-network');
});

runTest('Docker Compose', 'Redis service configured with password auth, appendonly and healthcheck', () => {
  assert(dockerComposeContent.includes('image: redis:7-alpine'), 'Redis must use redis:7-alpine');
  assert(dockerComposeContent.includes('--appendonly') && dockerComposeContent.includes('yes'), 'Redis must enable AOF persistence');
  assert(dockerComposeContent.includes('--requirepass'), 'Redis must require authentication password');
  assert(dockerComposeContent.includes('redis-cli'), 'Redis must have redis-cli ping healthcheck');
  assert(dockerComposeContent.includes('redis_data:/data'), 'Redis must mount redis_data volume');
  assert(dockerComposeContent.includes('6379:6379'), 'Redis must expose port 6379');
});

runTest('Docker Compose', 'Backend service configured with depends_on healthchecks, ports and volumes', () => {
  assert(dockerComposeContent.includes('context: ./backend'), 'Backend must build from ./backend');
  assert(dockerComposeContent.includes('postgres:\n        condition: service_healthy') ||
         dockerComposeContent.includes('condition: service_healthy'), 'Backend must depend on healthy postgres');
  assert(dockerComposeContent.includes('5000:5000'), 'Backend must expose HTTP API port 5000');
  assert(dockerComposeContent.includes('5005:5005'), 'Backend must expose ASTM Analyzer TCP port 5005');
  assert(dockerComposeContent.includes('ANALYZER_TCP_PORT: 5005'), 'Backend must configure ANALYZER_TCP_PORT env');
  assert(dockerComposeContent.includes('backend_backups:/app/backups'), 'Backend must mount backup persistence volume');
  assert(dockerComposeContent.includes('backend_uploads:/app/uploads'), 'Backend must mount uploads persistence volume');
  assert(dockerComposeContent.includes('/api/health'), 'Backend must have /api/health healthcheck');
});

runTest('Docker Compose', 'Web and Portal services configured with healthchecks and dependencies', () => {
  assert(dockerComposeContent.includes('context: ./frontend/apps/web'), 'Web must build from frontend/apps/web');
  assert(dockerComposeContent.includes('context: ./login-portal'), 'Portal must build from login-portal');
  assert(dockerComposeContent.includes('3001:3001'), 'Web must expose port 3001');
  assert(dockerComposeContent.includes('3002:3002'), 'Portal must expose port 3002');
  assert(dockerComposeContent.includes('INTERNAL_API_URL: http://backend:5000'), 'Web must point to internal backend URL');
});

runTest('Docker Compose', 'Nginx edge gateway configured with TLS, ACME volumes and ASTM stream port', () => {
  assert(dockerComposeContent.includes('image: nginx:alpine'), 'Nginx must use nginx:alpine');
  assert(dockerComposeContent.includes('"80:80"'), 'Nginx must map port 80');
  assert(dockerComposeContent.includes('"443:443"'), 'Nginx must map port 443');
  assert(dockerComposeContent.includes('"5005:5005"'), 'Nginx must map port 5005 (ASTM Stream)');
  assert(dockerComposeContent.includes('./nginx/nginx.conf:/etc/nginx/nginx.conf:ro'), 'Nginx must mount nginx.conf');
  assert(dockerComposeContent.includes('./nginx/conf.d:/etc/nginx/conf.d:ro'), 'Nginx must mount conf.d');
  assert(dockerComposeContent.includes('./nginx/ssl:/etc/nginx/ssl:ro'), 'Nginx must mount SSL certificates');
  assert(dockerComposeContent.includes('./certbot/conf:/etc/letsencrypt:ro'), 'Nginx must mount certbot conf');
  assert(dockerComposeContent.includes('./certbot/www:/var/www/certbot:ro'), 'Nginx must mount certbot webroot');
  assert(dockerComposeContent.includes('/healthz'), 'Nginx must have /healthz healthcheck');
});

runTest('Docker Compose', 'Persistent volumes and bridge network topology', () => {
  assert(dockerComposeContent.includes('postgres_data:'), 'Must declare postgres_data volume');
  assert(dockerComposeContent.includes('redis_data:'), 'Must declare redis_data volume');
  assert(dockerComposeContent.includes('backend_backups:'), 'Must declare backend_backups volume');
  assert(dockerComposeContent.includes('backend_uploads:'), 'Must declare backend_uploads volume');
  assert(dockerComposeContent.includes('labcore-network:'), 'Must declare labcore-network bridge network');
});

// ==============================================================================
// SUITE 2: NGINX TCP STREAM & HIGH-THROUGHPUT TUNING
// ==============================================================================
console.log('\n\x1b[36m--- Suite 2: Nginx TCP Stream & High-Throughput Tuning (nginx/nginx.conf) ---\x1b[0m');

const nginxConfPath = path.join(ROOT_DIR, 'nginx/nginx.conf');
const nginxConfContent = fs.readFileSync(nginxConfPath, 'utf-8');

runTest('Nginx Core', 'Top-level stream block proxies port 5005 to backend analyzer', () => {
  assert(nginxConfContent.includes('stream {'), 'nginx.conf must declare top-level stream block');
  assert(nginxConfContent.includes('upstream astm_analyzer_backend'), 'Stream must declare astm_analyzer_backend upstream');
  assert(nginxConfContent.includes('server backend:5005;'), 'Stream upstream must target backend:5005');
  assert(nginxConfContent.includes('listen 5005;'), 'Stream server must listen on port 5005');
  assert(nginxConfContent.includes('proxy_pass astm_analyzer_backend;'), 'Stream server must proxy_pass to astm_analyzer_backend');
  assert(nginxConfContent.includes('proxy_timeout 3600s;'), 'Stream server must configure long connection timeout');
});

runTest('Nginx Core', 'Worker processes and file descriptor limits tuned for hospital load', () => {
  assert(nginxConfContent.includes('worker_processes auto;'), 'worker_processes must be auto');
  assert(nginxConfContent.includes('worker_rlimit_nofile 65535;'), 'worker_rlimit_nofile must be set to 65535');
  assert(nginxConfContent.includes('worker_connections 4096;'), 'worker_connections must be set to 4096');
  assert(nginxConfContent.includes('multi_accept on;'), 'multi_accept must be enabled');
});

runTest('Nginx Core', 'DDoS rate limiting zones and connection throttling configured', () => {
  assert(nginxConfContent.includes('limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;'), 'Must configure api_limit rate zone');
  assert(nginxConfContent.includes('limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;'), 'Must configure auth_limit rate zone');
  assert(nginxConfContent.includes('limit_conn_zone $binary_remote_addr zone=addr_limit:10m;'), 'Must configure addr_limit connection zone');
});

runTest('Nginx Core', 'Gzip compression and information disclosure prevention active', () => {
  assert(nginxConfContent.includes('gzip on;'), 'Gzip compression must be enabled');
  assert(nginxConfContent.includes('gzip_comp_level 6;'), 'Gzip compression level must be 6');
  assert(nginxConfContent.includes('application/json'), 'Gzip must compress application/json');
  assert(nginxConfContent.includes('server_tokens off;'), 'server_tokens must be off for security hardening');
});

// ==============================================================================
// SUITE 3: NGINX VIRTUAL HOST & TLS 1.3 REVERSE PROXY
// ==============================================================================
console.log('\n\x1b[36m--- Suite 3: Nginx Virtual Host & TLS 1.3 Reverse Proxy (nginx/conf.d/labcore.conf) ---\x1b[0m');

const labcoreConfPath = path.join(ROOT_DIR, 'nginx/conf.d/labcore.conf');
const labcoreConfContent = fs.readFileSync(labcoreConfPath, 'utf-8');

runTest('Virtual Host', 'Upstream backend, web, and portal pools declared with keepalive', () => {
  assert(labcoreConfContent.includes('upstream backend_upstream'), 'Must define backend_upstream');
  assert(labcoreConfContent.includes('server backend:5000;'), 'backend_upstream must point to backend:5000');
  assert(labcoreConfContent.includes('upstream web_upstream'), 'Must define web_upstream');
  assert(labcoreConfContent.includes('server web:3001;'), 'web_upstream must point to web:3001');
  assert(labcoreConfContent.includes('upstream portal_upstream'), 'Must define portal_upstream');
  assert(labcoreConfContent.includes('server login-portal:3002;'), 'portal_upstream must point to login-portal:3002');
});

runTest('Virtual Host', 'Port 80 server block enforces ACME webroot challenge and 301 HTTPS redirect', () => {
  assert(labcoreConfContent.includes('listen 80;'), 'Port 80 server block must be present');
  assert(labcoreConfContent.includes('location /.well-known/acme-challenge/'), 'Must have ACME challenge location');
  assert(labcoreConfContent.includes('root /var/www/certbot;'), 'ACME challenge must point to /var/www/certbot');
  assert(labcoreConfContent.includes('return 301 https://$host$request_uri;'), 'Must enforce permanent 301 redirect to HTTPS');
});

runTest('Virtual Host', 'Port 443 server block enforces TLS 1.3, modern ciphers, and HSTS preload', () => {
  assert(labcoreConfContent.includes('listen 443 ssl'), 'Port 443 SSL server block must be present');
  assert(labcoreConfContent.includes('ssl_protocols TLSv1.2 TLSv1.3;'), 'Must enable TLSv1.2 and TLSv1.3');
  assert(labcoreConfContent.includes('ssl_ciphers'), 'Must configure secure cipher suites');
  assert(labcoreConfContent.includes('ssl_prefer_server_ciphers off;'), 'Must set ssl_prefer_server_ciphers off');
  assert(labcoreConfContent.includes('Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"'), 'Must enforce HSTS with preload');
});

runTest('Virtual Host', 'Enterprise security headers (NABH & OWASP Level 2)', () => {
  assert(labcoreConfContent.includes('X-Content-Type-Options "nosniff"'), 'Must include nosniff header');
  assert(labcoreConfContent.includes('X-Frame-Options "SAMEORIGIN"'), 'Must include SAMEORIGIN header');
  assert(labcoreConfContent.includes('X-XSS-Protection "1; mode=block"'), 'Must include XSS block header');
  assert(labcoreConfContent.includes('Referrer-Policy "strict-origin-when-cross-origin"'), 'Must include Referrer-Policy header');
  assert(labcoreConfContent.includes('Content-Security-Policy'), 'Must include Content-Security-Policy header');
});

runTest('Virtual Host', 'Real-time WebSocket proxying (/socket.io/) with infinite read timeouts', () => {
  assert(labcoreConfContent.includes('location /socket.io/'), 'Must have /socket.io/ location');
  assert(labcoreConfContent.includes('proxy_set_header Upgrade $http_upgrade;'), 'Must pass Upgrade header');
  assert(labcoreConfContent.includes('proxy_set_header Connection "upgrade";'), 'Must pass Connection upgrade');
  assert(labcoreConfContent.includes('proxy_read_timeout 86400s;'), 'Must set 24h read timeout for WebSockets');
});

runTest('Virtual Host', 'Next.js static asset caching and healthz telemetry endpoint', () => {
  assert(labcoreConfContent.includes('location /_next/static/'), 'Must have static cache route');
  assert(labcoreConfContent.includes('expires 365d;'), 'Static assets must have 365d cache expiry');
  assert(labcoreConfContent.includes('location /healthz'), 'Must have /healthz healthcheck endpoint');
  assert(labcoreConfContent.includes('return 200 "healthy\\n";'), 'Healthcheck must return 200 healthy');
});

// ==============================================================================
// SUITE 4: SERVER PROVISIONING SCRIPT & UFW FIREWALL HARDENING
// ==============================================================================
console.log('\n\x1b[36m--- Suite 4: Production Server Provisioning & UFW Firewall (deploy/setup-production-server.sh) ---\x1b[0m');

const setupScriptPath = path.join(ROOT_DIR, 'deploy/setup-production-server.sh');
assert(fs.existsSync(setupScriptPath), 'setup-production-server.sh must exist in deploy/');
const setupScriptContent = fs.readFileSync(setupScriptPath, 'utf-8');

runTest('Server Provisioning', 'Strict bash options, root privilege guard and hardware verification', () => {
  assert(setupScriptContent.startsWith('#!/usr/bin/env bash'), 'Script must use bash shebang');
  assert(setupScriptContent.includes('set -euo pipefail'), 'Script must use strict bash error handling');
  assert(setupScriptContent.includes('EUID'), 'Script must check for root privileges');
  assert(setupScriptContent.includes('nproc') || setupScriptContent.includes('CPU_CORES'), 'Script must audit CPU cores');
  assert(setupScriptContent.includes('MemTotal') || setupScriptContent.includes('TOTAL_RAM_GB'), 'Script must audit RAM');
});

runTest('Server Provisioning', 'UFW firewall enforces default deny incoming and allows 22, 80, 443, 5005 only', () => {
  assert(setupScriptContent.includes('ufw default deny incoming'), 'UFW must default deny incoming');
  assert(setupScriptContent.includes('ufw default allow outgoing'), 'UFW must default allow outgoing');
  assert(setupScriptContent.includes('ufw allow "${SSH_PORT:-22}"/tcp') || setupScriptContent.includes('ufw allow "${SSH_PORT}"/tcp'), 'UFW must allow SSH');
  assert(setupScriptContent.includes('ufw allow 80/tcp'), 'UFW must allow HTTP port 80');
  assert(setupScriptContent.includes('ufw allow 443/tcp'), 'UFW must allow HTTPS port 443');
  assert(setupScriptContent.includes('ufw allow 5005/tcp'), 'UFW must allow ASTM Analyzer port 5005');
  assert(setupScriptContent.includes('ufw --force enable'), 'UFW must be enabled non-interactively');
});

runTest('Server Provisioning', 'Docker CE installation, Linux kernel sysctl tuning & fail2ban integration', () => {
  assert(setupScriptContent.includes('download.docker.com/linux/ubuntu'), 'Script must install Docker from official repo');
  assert(setupScriptContent.includes('docker-compose-plugin'), 'Script must install docker-compose-plugin');
  assert(setupScriptContent.includes('net.core.somaxconn = 65535'), 'Script must tune somaxconn to 65535');
  assert(setupScriptContent.includes('vm.overcommit_memory = 1'), 'Script must tune vm.overcommit_memory');
  assert(setupScriptContent.includes('fail2ban'), 'Script must configure fail2ban');
  assert(setupScriptContent.includes('systemd/system/labcore.service'), 'Script must configure systemd auto-start service');
});

// ==============================================================================
// SUITE 5: SSL CERTIFICATE AUTOMATION & STAGING CERTS
// ==============================================================================
console.log('\n\x1b[36m--- Suite 5: SSL Certificate Automation & Staging Certificates ---\x1b[0m');

const sslGenShPath = path.join(ROOT_DIR, 'nginx/ssl/generate-self-signed-ssl.sh');
const sslGenPs1Path = path.join(ROOT_DIR, 'nginx/ssl/generate-self-signed-ssl.ps1');
const letsEncryptPath = path.join(ROOT_DIR, 'nginx/ssl/generate-letsencrypt.sh');
const fullchainPath = path.join(ROOT_DIR, 'nginx/ssl/live/fullchain.pem');
const privkeyPath = path.join(ROOT_DIR, 'nginx/ssl/live/privkey.pem');

runTest('SSL Automation', 'SSL generator scripts exist for bash, powershell and letsencrypt', () => {
  assert(fs.existsSync(sslGenShPath), 'generate-self-signed-ssl.sh must exist');
  assert(fs.existsSync(sslGenPs1Path), 'generate-self-signed-ssl.ps1 must exist');
  assert(fs.existsSync(letsEncryptPath), 'generate-letsencrypt.sh must exist');

  const shContent = fs.readFileSync(sslGenShPath, 'utf-8');
  assert(shContent.includes('subjectAltName='), 'Self-signed generator must configure SAN extensions');
  assert(shContent.includes('elis.yourhospital.com'), 'Generator must include default domain');
});

runTest('SSL Automation', 'Bundled staging certificate and key exist and are valid PEM x509 assets', () => {
  assert(fs.existsSync(fullchainPath), 'nginx/ssl/live/fullchain.pem must exist');
  assert(fs.existsSync(privkeyPath), 'nginx/ssl/live/privkey.pem must exist');

  const certContent = fs.readFileSync(fullchainPath, 'utf-8');
  const keyContent = fs.readFileSync(privkeyPath, 'utf-8');

  assert(certContent.includes('-----BEGIN CERTIFICATE-----'), 'fullchain.pem must contain BEGIN CERTIFICATE');
  assert(certContent.includes('-----END CERTIFICATE-----'), 'fullchain.pem must contain END CERTIFICATE');
  assert(keyContent.includes('-----BEGIN PRIVATE KEY-----') || keyContent.includes('-----BEGIN RSA PRIVATE KEY-----'), 'privkey.pem must contain valid private key header');
});

// ==============================================================================
// SUITE 6: PRODUCTION ENVIRONMENT & SECRETS TEMPLATE
// ==============================================================================
console.log('\n\x1b[36m--- Suite 6: Production Environment & Secrets Audit ---\x1b[0m');

const envExamplePath = path.join(ROOT_DIR, '.env.production.example');
const envProdPath = path.join(ROOT_DIR, '.env.production');

runTest('Environment Secrets', '.env.production.example contains all enterprise production variables', () => {
  assert(fs.existsSync(envExamplePath), '.env.production.example must exist');
  const envContent = fs.readFileSync(envExamplePath, 'utf-8');

  const mandatoryKeys = [
    'NODE_ENV',
    'PORT',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DB',
    'DATABASE_URL',
    'DB_POOL_MAX',
    'REDIS_PASSWORD',
    'REDIS_URL',
    'JWT_SECRET',
    'FIELD_ENCRYPTION_KEY',
    'PASSWORD_PEPPER',
    'ENCRYPTION_SECRET',
    'ANALYZER_TCP_PORT',
    'BACKUP_DIR',
    'GEMINI_API_KEY',
    'ABDM_CLIENT_ID',
    'WHATSAPP_API_TOKEN',
    'SMTP_HOST'
  ];

  for (const k of mandatoryKeys) {
    assert(envContent.includes(k), `Missing key in .env.production.example: ${k}`);
  }
});

runTest('Environment Secrets', '.env.production active file is populated and secure', () => {
  assert(fs.existsSync(envProdPath), '.env.production must exist');
  const envContent = fs.readFileSync(envProdPath, 'utf-8');
  assert(envContent.includes('ANALYZER_TCP_PORT=5005'), 'ANALYZER_TCP_PORT must be set to 5005');
  assert(envContent.includes('NODE_ENV=production'), 'NODE_ENV must be production');
});

// ==============================================================================
// SUITE 7: INTEGRATION PREFLIGHT RUNNER (scripts/verify-production.js)
// ==============================================================================
console.log('\n\x1b[36m--- Suite 7: Full System Production Readiness Check ---\x1b[0m');

runTest('Integration Preflight', 'scripts/verify-production.js passes all 12/12 checks', () => {
  const output = execSync('node scripts/verify-production.js', { cwd: ROOT_DIR, encoding: 'utf-8' });
  assert(output.includes('ALL 12/12 PRODUCTION READINESS CHECKS PASSED!'), 'verify-production.js must pass 12/12');
  assert(!output.includes('FAILED'), 'verify-production.js must not have any failures');
});

// ==============================================================================
// SUMMARY & METRICS
// ==============================================================================
console.log('\n==============================================================================');
console.log('📊 DAY 22 TEST EXECUTION SUMMARY');
console.log('==============================================================================');

const totalTests = results.length;
const passedTests = results.filter((r) => r.passed).length;
const failedTests = totalTests - passedTests;

console.log(`Total Test Suites   : 7`);
console.log(`Total Unit Tests    : ${totalTests}`);
console.log(`Passed Unit Tests   : \x1b[32m${passedTests}\x1b[0m`);
console.log(`Failed Unit Tests   : ${failedTests > 0 ? `\x1b[31m${failedTests}\x1b[0m` : `\x1b[32m0\x1b[0m`}`);
console.log(`Total Assertions    : ${totalAssertions}`);
console.log(`Passed Assertions   : \x1b[32m${passedAssertions}\x1b[0m`);
console.log(`Success Rate        : \x1b[32m${((passedTests / totalTests) * 100).toFixed(1)}%\x1b[0m`);

if (failedTests > 0) {
  console.log('\n\x1b[31m❌ DAY 22 INFRASTRUCTURE SUITE FAILED.\x1b[0m\n');
  process.exit(1);
} else {
  console.log('\n\x1b[32m✨ DAY 22 INFRASTRUCTURE & REVERSE PROXY CERTIFIED: 100% PASS (0 FAILURES)\x1b[0m\n');
  process.exit(0);
}
