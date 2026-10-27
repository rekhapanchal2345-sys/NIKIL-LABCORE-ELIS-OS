# NIKIL-LABCORE-ELIS-OS — ENTERPRISE INCIDENT RESPONSE RUNBOOK
**Standard Operating Procedure: Emergency Response, Disaster Recovery & High-Availability Operations**  
**Document Code:** `SOP-OPS-INC-001` | **Revision:** `3.0.0-PROD` | **Effective Date:** October 2026  
**Compliance Standards:** ISO 22301 (BCM), NABL ISO 15189:2022 §5.10, DPDP Act 2023 §8  

---

## 1. INCIDENT SEVERITY CLASSIFICATION & SLA MATRIX

| Severity Level | Definition | Impact on Hospital Operations | Response SLA | Target MTTR (Resolution) | Primary Escalation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P1 - CRITICAL** | Full system outage, primary DB crash, data corruption, active ransomware/intrusion, emergency analyzer link failure. | Zero patient registrations, zero sample processing, ICU emergency reports blocked. | **< 5 minutes** | **< 30 minutes** | DevOps Lead + Chief Pathologist + Hospital IT Director |
| **P2 - MAJOR** | Intermittent API degradation (>2000ms latency), single analyzer offline, WhatsApp/SMS gateway failure, billing till reconciliation discrepancy. | Operations slowed; manual fallback workarounds available; clinical safety intact. | **< 15 minutes** | **< 2 hours** | Backend Lead + Senior Sysadmin |
| **P3 - MINOR** | Minor UI glitch, non-critical scheduled report delay, non-blocking barcode reprint request. | Negligible impact on patient diagnostics or revenue collection. | **< 1 hour** | **< 8 hours** | Support Desk / L2 Engineer |

---

## 2. EMERGENCY CONTACTS & ESCALATION LADDER

```
[Level 1: System Monitoring / Prometheus / Alertmanager]
                       │ (Alert triggered via Telegram/Slack/PagerDuty)
                       ▼
[Level 2: Hospital Systems On-Call Engineer] (Response: < 5 min)
                       │ (Unresolved in 15 mins)
                       ▼
[Level 3: Lead Systems Architect / DB Administrator] (Response: < 15 min)
                       │ (P1 Outage / Data Integrity Risk)
                       ▼
[Incident Commander: Hospital Chief Technology Officer & Laboratory Director]
```

- **Emergency Hotline:** +91-XXXXXXXXXX (24x7 NOC Pager)
- **Incident Bridge Room:** `https://meet.labcore.internal/incident-bridge`
- **Status Dashboard:** `https://status.labcore.internal`

---

## 3. INCIDENT RUNBOOKS

### 📘 RUNBOOK INC-01: PRIMARY DATABASE CRASH / POSTGRESQL OUTAGE
**Trigger:** PostgreSQL service non-responsive, Prisma error `P2024` (Connection pool timeout), or health probe `GET /api/health` returns status `503 Service Unavailable`.

#### Immediate Diagnostic Steps:
1. Log into production VPS via SSH:
   ```bash
   ssh -i ~/.ssh/labcore-prod.pem deploy@elis.yourhospital.com
   ```
2. Check PostgreSQL container / systemd service status:
   ```bash
   sudo systemctl status postgresql || docker ps -a | grep labcore_postgres
   ```
3. Inspect database kernel logs for Out-Of-Memory (OOM) or disk exhaustion:
   ```bash
   sudo journalctl -u postgresql -n 100 --no-pager
   docker logs --tail 100 labcore_postgres
   df -h /var/lib/postgresql
   ```

#### Recovery & Restoration Procedure:
1. **Soft Restart:** If container/service stopped due to transient memory pressure:
   ```bash
   docker restart labcore_postgres
   sudo systemctl restart labcore
   ```
2. **Crash Recovery from Write-Ahead Logs (WAL):**
   PostgreSQL automatically enters recovery mode. Verify recovery completion:
   ```bash
   docker exec -it labcore_postgres psql -U labcore_admin -d labcore_prod -c "SELECT pg_is_in_recovery();"
   ```
3. **Emergency Point-In-Time Disaster Recovery Restore:**
   If storage was corrupted or unrecoverable:
   ```bash
   # Execute Disaster Recovery Service restore from the latest verified AES-256 backup
   npm run db:dr-restore -- --latest
   # Verify row counts matching
   npx tsx backend/test-day28-dr-drill.ts
   ```

---

### 📘 RUNBOOK INC-02: APPLICATION SERVER CRASH LOOP (PM2 / DOCKER)
**Trigger:** Docker container continually restarting (`RestartCount > 5`) or PM2 process repeatedly dying with exit status `137` (SIGKILL / Out of Memory).

#### Immediate Diagnostic Steps:
1. Inspect PM2 logs:
   ```bash
   pm2 logs labcore-backend --lines 200
   pm2 status
   ```
2. Check memory consumption:
   ```bash
   free -m
   top -b -n 1 | head -n 20
   ```

#### Mitigation & Resolution:
1. **Clear memory leak / transient memory starvation:**
   Ensure PM2 `max_memory_restart` is active (`2G` per worker). Trigger graceful cluster reload:
   ```bash
   pm2 reload ecosystem.config.js --env production
   ```
2. **Inspect Unhandled Rejection or Missing Secret:**
   If crash is caused by startup environment variable missing (e.g., `JWT_SECRET`, `ENCRYPTION_SECRET`, `DATABASE_URL`):
   ```bash
   cat /app/.env | grep -E "(DATABASE_URL|JWT_SECRET|ENCRYPTION_SECRET)"
   ```
3. **Rollback to Prior Stable Container Tag:**
   ```bash
   docker pull yourorg/labcore-elis:v3.0.0-stable
   docker-compose up -d --no-deps backend
   ```

---

### 📘 RUNBOOK INC-03: SECURITY BREACH / PRIVILEGE ESCALATION
**Trigger:** Detection of unauthorized role escalation, suspicious JWT replay attacks, brute-force admin logins, or DPDP Act 2023 breach alert.

#### Containment Procedure:
1. **Immediate Revocation of Active Sessions:**
   Flush Redis token blacklists and clear active sessions:
   ```bash
   # Invalidate all active refresh tokens and user sessions
   npx tsx -e "import prisma from './backend/config/database'; prisma.session.deleteMany().then(() => console.log('All active sessions revoked.'));"
   ```
2. **Rotate Master Encryption & JWT Signing Keys:**
   Update `JWT_SECRET` and `JWT_REFRESH_SECRET` in `.env` and immediately reload application processes.
3. **Isolate Compromised IP Addresses at UFW Firewall:**
   ```bash
   sudo ufw insert 1 deny from <MALICIOUS_IP> to any
   sudo fail2ban-client set sshd banip <MALICIOUS_IP>
   ```
4. **Trigger DPDP Act §8 Audit:**
   Dump audit log records for the preceding 48 hours for forensic preservation:
   ```bash
   psql -U labcore_admin -d labcore_prod -c "\copy (SELECT * FROM \"AuditLog\" WHERE \"createdAt\" >= NOW() - INTERVAL '48 HOURS') TO '/backups/forensic_audit.csv' CSV HEADER;"
   ```

---

### 📘 RUNBOOK INC-04: CLINICAL DATA CORRUPTION / POINT-IN-TIME RESTORE (PITR)
**Trigger:** Erroneous automated script or accidental batch deletion affecting patient records or laboratory test results.

#### Procedure:
1. **Freeze System in Maintenance Mode:**
   ```bash
   # Switch Nginx to maintenance splash page
   sudo ln -sf /etc/nginx/sites-available/maintenance.conf /etc/nginx/sites-enabled/elis.conf
   sudo systemctl reload nginx
   ```
2. **Identify Target PITR Epoch:**
   Determine the exact timestamp $T_{incident} - 60s$ before corruption occurred.
3. **Execute Staging Schema Restoration:**
   ```bash
   # Restore backup archive into staging schema "staging_recovery"
   node backend/scripts/restore-staging.js --target="2026-10-27T02:00:00Z"
   ```
4. **Data Fidelity Audit:**
   Run `DisasterRecoveryService.executeDrDrill()` to ensure zero schema mismatch and confirm exact row counts before promoting staging data to primary.
5. **Reopen Traffic:**
   ```bash
   sudo ln -sf /etc/nginx/sites-available/elis.conf /etc/nginx/sites-enabled/elis.conf
   sudo systemctl reload nginx
   ```

---

### 📘 RUNBOOK INC-05: AUTOMATED BACKUP / ENCRYPTION FAILURE
**Trigger:** 02:00 AM Cron job fails to generate snapshot, or `BackupSchedulerService` health check status returns `FAILED`.

#### Procedure:
1. Check available disk storage in `/app/backups`:
   ```bash
   df -h /app/backups
   ```
   If disk usage is $> 90\%$, manually trigger GFS retention pruning:
   ```bash
   curl -X POST http://localhost:5000/api/backups/retention/apply -H "Authorization: Bearer <ADMIN_TOKEN>"
   ```
2. Verify cryptographic encryption key accessibility:
   Confirm `ENCRYPTION_SECRET` is set with $\ge 32$ characters.
3. Manually execute on-demand backup routine:
   ```bash
   curl -X POST http://localhost:5000/api/backups/scheduler/trigger -H "Authorization: Bearer <ADMIN_TOKEN>"
   ```
4. Verify SHA-256 and AES-256 header integrity:
   ```bash
   curl -X POST http://localhost:5000/api/backups/verify/<NEW_FILE> -H "Authorization: Bearer <ADMIN_TOKEN>"
   ```

---

## 4. POST-MORTEM ROOT CAUSE ANALYSIS (RCA) PROTOCOL
Within **24 hours** of resolving any P1 or P2 incident, the Incident Commander must publish an RCA document covering:
1. **Executive Summary & Incident Timeline** (Exact timestamps of Detection, Triage, Mitigation, Resolution).
2. **Root Cause Analysis** (5-Whys methodology).
3. **Impact Assessment** (Number of patients affected, delayed reports, financial drift).
4. **Corrective & Preventive Actions (CAPA)** (Assigned owners and deadlines $\le 7$ days).
5. **NABL & DPDP Regulatory Disclosure Filing** (if clinical safety or PII was impacted).

---
*Authorized by Chief Information Security Officer (CISO) & Laboratory Director, NIKIL-LABCORE-ELIS-OS.*
