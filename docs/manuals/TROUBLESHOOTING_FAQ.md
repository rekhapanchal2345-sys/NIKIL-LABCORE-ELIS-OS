# 🛠️ NIKIL-LABCORE-ELIS-OS — HOSPITAL SYSTEM TROUBLESHOOTING & FAQ RUNBOOK
> **Technical Runbook — Document ID:** `RUN-LIS-TS-001`  
> **Target Audience:** Hospital IT Support, Lab Technicians, Shift In-Charge  
> **System Version:** `v3.0.0-PRODUCTION`

---

## 1. Quick Emergency Diagnostic Matrix

| Symptom | Probable Cause | Immediate Action |
|---|---|---|
| **Analyzer Not Transmitting (ASTM Port 5005)** | Network cable unplugged, IP conflict, or port 5005 blocked | Verify LAN ping to analyzer IP. Check `pm2 logs` for analyzer TCP errors. |
| **Barcode Printer Printing Blank Labels** | Ribbon inserted backwards or sensor miscalibration | Clean thermal printhead with isopropyl alcohol. Perform gap sensor calibration. |
| **Receipt Printer Not Printing / Cash Drawer Stuck** | ESC/POS baud rate mismatch or cable loose | Verify USB/Serial connection. Check Windows printer spooler. |
| **User Locked Out ("Account Disabled")** | 5 consecutive failed login attempts | Request Super Admin / Admin to unlock via **Settings → Users**. |
| **WhatsApp Report Not Delivered** | Patient number lacking country code or Meta API rate limit | Verify 10-digit mobile has +91 prefix. Fallback to SMS or download PDF manually. |
| **Database Connection Error (HTTP 500 / 503)** | PostgreSQL service down or connection pool exhausted | Restart PostgreSQL container: `docker compose restart postgres`. |

---

## 2. Detailed Technical Troubleshooting Guides

### Issue 2.1: Hardware Analyzer TCP Connection Dropout (Sysmex, Cobas, Mindray)
- **Background**: Analyzers stream results over raw TCP sockets on port **5005**.
- **Diagnostic Steps**:
  1. Open terminal on server and run: `netstat -an | grep 5005` (or PowerShell `Get-NetTCPConnection -LocalPort 5005`).
  2. Confirm status is `LISTEN`.
  3. If connection is active but results do not parse:
     - Check analyzer baud rate: standard ASTM baud is **9600 bps**, 8 data bits, no parity, 1 stop bit (`9600 8-N-1`).
     - Check for unacknowledged frames: If analyzer sends `ENQ` and does not receive `ACK` within 3 seconds, it enters timeout.
  4. Use the built-in **Virtual Protocol Simulator** (`/analyzers?tab=simulator`) to send a test frame and verify the parser pipeline.

### Issue 2.2: Thermal Barcode Printer Misalignment (Zebra, TSC, TVS)
- **Background**: Tube barcode labels require high precision (2 x 1 inch) to ensure barcode scanners read the Code 128 Mod-103 checksum.
- **Diagnostic Steps**:
  1. **Barcode Skipping Labels**: Press and hold the printer feed button until the red LED flashes twice, then release to run **Automatic Gap Sensor Calibration**.
  2. **Faint / Unreadable Barcode**:
     - Check printer darkness setting (recommended darkness: 10–12).
     - Clean thermal printhead using a lint-free swab moistened with 99% isopropyl alcohol.
  3. **Orientation**: Verify label is loaded with thermal-sensitive side facing up.

### Issue 2.3: WhatsApp Cloud API Report Delivery Failures
- **Background**: Approved reports automatically trigger a Meta WhatsApp Cloud API template push with the cryptographically signed PDF link.
- **Diagnostic Steps**:
  1. Check delivery status icon under **Reports → WhatsApp Dispatch Log** (`/reports?tab=whatsapp`).
  2. **Status Codes**:
     - `sent`: Dispatched to Meta servers.
     - `delivered`: Reached patient device.
     - `read`: Opened and viewed by patient.
     - `failed`: Phone number invalid, patient opted out, or Meta account token expired.
  3. **Automatic Fallback**:
     - If WhatsApp delivery fails, the system automatically dispatches an SMS alert with short link.
     - Staff can also manually click **Resend via WhatsApp** or **Print Physical PDF Report**.

### Issue 2.4: Cash Counter Drawer Not Opening (ESC/POS)
- **Background**: The POS cash drawer triggers via a 24V solenoid pulse (`ESC p m t1 t2` command) sent through the receipt printer's RJ-11/RJ-12 port.
- **Diagnostic Steps**:
  1. Verify the RJ-11 modular cable from the cash drawer is firmly seated in the printer's `DK` (Drawer Kick) port, not the phone/ethernet jack.
  2. In Windows printer properties, navigate to **Device Settings → Cash Drawer → Open at End of Job**.
  3. Test manual open key: Every cash drawer has a manual physical key slot at the bottom front. Keep manual key at the supervisor desk.

---

## 3. Disaster Recovery: Database Restoration Runbook

In the event of physical server corruption or unrecoverable database fault:
1. Locate latest encrypted backup file in `/app/backups/`:
   ```bash
   ls -la /app/backups/
   # Example: backup-20261027-020000.sql.enc
   ```
2. Decrypt backup using server AES-256 key:
   ```bash
   openssl enc -d -aes-256-cbc -in backup-20261027-020000.sql.enc -out restored.sql -pass env:BACKUP_ENCRYPTION_KEY
   ```
3. Drop and recreate production database:
   ```bash
   dropdb -U postgres labcore_prod
   createdb -U postgres labcore_prod
   ```
4. Restore SQL dump:
   ```bash
   psql -U postgres -d labcore_prod -f restored.sql
   ```
5. Run schema integrity verification:
   ```bash
   npm run verify:prod
   ```
6. Restart services:
   ```bash
   npm run pm2:restart
   ```

---

## 4. Frequently Asked Questions (FAQ)

**Q1: Can a pathologist sign off a report without their digital signature image?**  
*A:* No. NABL ISO 15189 regulations mandate an electronic signature seal. If no signature image is registered in the doctor's profile, the system alerts the pathologist to upload their signature before signing.

**Q2: What happens if an analyzer sends a result for a sample barcode that was never ordered?**  
*A:* ELIS places the orphaned result in the **Unsolicited / Orphaned Results Buffer** (`/analyzers?tab=live_feed`). Technicians can search and match the barcode to an existing patient order or discard it.

**Q3: Can a patient change or withdraw their DPDP consent after test collection?**  
*A:* Yes. Under the DPDP Act 2023, patients can withdraw research or marketing consent at any time via the Receptionist desk. However, mandatory clinical records for treatment and legal audit trails are preserved for 5 years as required by medical council regulations.

**Q4: How does the system prevent two cashiers from using the same till simultaneously?**  
*A:* LabCore ELIS enforces strict single-session concurrency limits on `FRONT_DESK` and `RECEPTIONIST` roles. Attempting to log into a second terminal automatically invalidates the previous session token.
