# 🏥 NIKIL-LABCORE-ELIS-OS — FRONT DESK & RECEPTIONIST OPERATIONAL HANDBOOK
> **Standard Operating Procedure (SOP) — Document ID:** `SOP-LIS-REC-001`  
> **Applicable Role:** `RECEPTIONIST`, `FRONT_DESK`, `PATIENT_CARE_EXECUTIVE`  
> **Compliance Standard:** NABL ISO 15189:2022 §5.4 | ABDM ABHA v0.5 | GST SAC 999316  
> **System Version:** `v3.0.0-PRODUCTION`

---

## 1. Role Scope & Objectives

The Front Desk Executive is the primary patient-facing gatekeeper of the laboratory information system. Responsibilities encompass:
1. **Patient Identification & EMPI Registration**: Generating Unique Hospital Identifiers (UHID) and preventing demographic deduplication.
2. **Ayushman Bharat Digital Mission (ABDM)**: Linking patient records to national ABHA IDs via Aadhaar OTP or biometric scan.
3. **Diagnostic Test Order Creation**: Selecting accurate test codes, doctor referral attribution, and priority tagging (STAT vs Routine).
4. **Point-of-Sale (POS) Billing & Invoicing**: Indian GST-compliant invoicing, multi-tender payment processing (Cash, UPI, Debit/Credit Card).
5. **Cash Drawer Management**: Daily till open, physical denomination counting, variance triage, and shift handover daybook closure.

---

## 2. Standard Operating Procedures (Step-by-Step)

### Step 2.1: Patient Intake & Registration (EMPI / UHID)
1. **Navigate to Patient Hub**: Press hotkey `Alt + P` or click **Patients → Register / Admit Patient**.
2. **Duplicate Check First**: Always search by Patient Mobile Number (10 digits) or Aadhaar number before creating a new record.
   - The system utilizes **Soundex phonetic matching** and **Damerau-Levenshtein distance <= 2** to detect existing patients even with minor typos.
3. **Required Patient Demographics**:
   - **Full Name**: Prefix (Mr./Mrs./Ms./Master/Baby), First, Middle, and Last Name.
   - **Date of Birth & Age**: Specify exact DOB or enter years; system auto-calculates birth year.
   - **Biological Gender**: Male, Female, or Other (used by engine for reference range calculation).
   - **Contact Number**: 10-digit Indian mobile number (mandatory for automated WhatsApp and SMS delivery).
   - **Address & Pincode**: State and District for epidemiological and GST place-of-supply reporting.
4. **National Health ID (ABDM / ABHA)**:
   - If patient provides an ABHA address (`patient@abdm`), enter it into the ABHA field.
   - Click **Verify via Aadhaar OTP** to initiate ABDM M1 authentication.
   - Enter the 6-digit OTP received on the patient's Aadhaar-linked mobile.
   - Upon verification, the verified ABHA badge displays in green.

### Step 2.2: Order Creation & Diagnostic Test Selection
1. **Initiate Order**: From patient dossier, click **New Lab Order** (Hotkey `Alt + O`).
2. **Select Referring Clinician**:
   - Choose from accredited Doctor dropdown or select "Self / Walk-in".
   - Referring doctor's Medical Council Reg No. is automatically attached to order records.
3. **Test Catalog Search**:
   - Search by test name (e.g., "Complete Blood Count"), abbreviation ("CBC"), or LOINC code.
   - System highlights special pre-test instructions (e.g., "12-Hour Fasting Required for Lipid Profile").
   - Inform the patient immediately if fasting or preparation criteria are not met.
4. **Set Clinical Priority**:
   - **Routine**: Standard turnaround time (TAT).
   - **Urgent / Priority**: Accelerated lab queue.
   - **STAT (Emergency)**: Triggers visual red beacon in phlebotomy and 15-minute emergency lane.

### Step 2.3: Point-of-Sale (POS) Billing & GST Invoicing
1. **Review Billable Items**:
   - Each diagnostic parameter is mapped under Indian GST Service Accounting Code (**SAC 999316 — Healthcare Diagnostic Services**).
   - Healthcare diagnosis is exempt from GST under Notification No. 12/2017-Central Tax (Rate), but B2B referral tariffs or wellness packages may apply 18% GST (CGST 9% + SGST 9%).
2. **Apply Institutional Discounts / Corporate TPA**:
   - Select authorized discount policy (Senior Citizen 10%, Hospital Staff, B2B Partner Rate).
   - Discounts exceeding 15% require Administrative Manager approval override.
3. **Accept Payment (Multi-Tender)**:
   - **Cash**: Enter exact received notes; system calculates return change.
   - **UPI / QR**: System generates dynamic BharatQR on POS screen; webhook confirms settlement instantly.
   - **Card (POS Terminal)**: Enter last 4 digits of card and transaction authorization code.
   - **Credit / Corporate TPA**: Choose authorized TPA company (requires Pre-Auth reference ID).
4. **Issue Receipt & Thermal Barcode Order Sheet**:
   - Print dual-receipt (Patient Copy + Lab Specimen Requisition).
   - Provide receipt to patient with estimated collection and reporting time.

### Step 2.4: Shift Till Opening & End-of-Day (EOD) Daybook Close
1. **Till Opening (Start of Shift)**:
   - Navigate to **Payments → Shift Till & Cash Drawer**.
   - Enter opening float cash (standard ₹2,000 float).
2. **Shift Handover & Reconciliation (End of Shift)**:
   - Count physical currency by denomination:
     - ₹2000, ₹500, ₹200, ₹100, ₹50, ₹20, ₹10, ₹5, ₹2, ₹1.
   - Enter note counts into the Physical Tally Grid.
   - The system performs automated variance triage:
     - **Match**: Variance = ₹0.00. Ready to close.
     - **Discrepancy (Excess/Shortage)**: System flags alert. Cashier must enter mandatory justification.
   - Click **Submit Shift Daybook & Print Handover Summary**. Both outgoing and incoming cashiers must sign.

---

## 3. Front Desk Quick Reference & Hotkeys

| Action | Keyboard Shortcut | Screen Location |
|---|---|---|
| Global Multi-Entity Search | `Ctrl + K` or `Cmd + K` | Universal Overlay |
| Fast Patient Registration | `Alt + P` | Top Navigation Bar |
| New Diagnostic Order | `Alt + O` | Top Navigation Bar |
| Cash Drawer / Till Status | `Alt + S` | Payments Menu |
| Print Receipt | `Ctrl + P` | POS Payment Modal |
| Dismiss Modal / Drawer | `Escape` | Active Modal |

---

## 4. Front Desk Emergency & Exception Protocols

- **Emergency Walk-in (Trauma / Acute Chest Pain)**:
  - Select "STAT Emergency Quick Order" with minimal required details (Name, Age, Gender).
  - Bill can be settled post-stabilization; phlebotomy collection proceeds immediately.
- **System Offline / Power Cut**:
  - Use manual physical carbon-copy requisition pads.
  - Tag each physical tube with manual pre-printed barcode stickers.
  - Enter backlogged data into LabCore ELIS within 30 minutes of power restoration.
