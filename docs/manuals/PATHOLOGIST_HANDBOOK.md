# 🩺 NIKIL-LABCORE-ELIS-OS — PATHOLOGIST & CLINICAL SIGN-OFF WORKSTATION HANDBOOK
> **Standard Operating Procedure (SOP) — Document ID:** `SOP-LIS-PATH-001`  
> **Applicable Role:** `PATHOLOGIST`, `CONSULTANT_BIOCHEMIST`, `LABORATORY_DIRECTOR`  
> **Compliance Standard:** NABL ISO 15189:2022 §5.8 (Reporting of Results) | DPDP Act 2023  
> **System Version:** `v3.0.0-PRODUCTION`

---

## 1. Pathologist Scope & Medical Authority

The Pathologist carries ultimate medical and legal authority for validating diagnostic results, providing clinical interpretations, and releasing signed laboratory reports. Key functions:
1. **Workstation Queue Triage**: Prioritizing STAT emergencies and life-threatening critical panic values ($HH / LL$).
2. **Clinical Correlation & Delta Validation**: Correlating laboratory findings with clinical patient history, diagnosis, and longitudinal trends.
3. **Clinical AI Copilot Consultation**: Leveraging Gemini AI clinical pattern recognition for complex CBC scattergrams, peripheral blood smears, and thyroid profiles.
4. **Electronic Seal & Digital Sign-Off**: Cryptographically signing diagnostic reports with SHA-256 HMAC tamper-evident chaining.
5. **Amendment & Addendum Governance**: Governing post-release amendments with mandatory clinical justification and version tracking.

---

## 2. Pathologist Workstation Overview

In ELIS, navigate to **Pathologist Approvals → Doctor Workstation** (`/approvals?mode=workstation` or `/doctors?tab=verification`).

### Queue Prioritization Matrix:
1. 🔴 **CRITICAL PANIC QUEUE ($HH / LL$)**: High priority. Immediately visible at the top with flashing red indicator and optional acoustic audio chime (IEC 60601-1-8 standard harmonic burst).
2. 🚨 **STAT EMERGENCY QUEUE**: Intensive Care Unit (ICU), Emergency Department (ED), and Operation Theatre (OT) specimens. Target TAT $< 30$ minutes.
3. 🟡 **ABNORMAL QUEUE**: Values exceeding biological reference intervals ($H / L$) requiring physician attention.
4. 🟢 **CLEAN FAST-TRACK QUEUE**: Routine, completely normal parameters with valid QC runs. Can be batch-approved with single digital signature.

---

## 3. Standard Operating Procedures (Step-by-Step)

### Step 3.1: Critical Panic Value Cascade Protocol
When a result triggers a critical panic threshold (e.g., Blood Glucose $< 40$ mg/dL or $> 500$ mg/dL, Potassium $< 2.5$ or $> 6.5$ mmol/L, Platelets $< 20,000$ /$\mu$L):
1. **Immediate Telephonic Notification**:
   - The workstation prompts the **Critical Panic Call Log Modal**.
   - Mandatory fields:
     - Name of physician or nursing officer receiving call.
     - Timestamp of call.
     - Read-back confirmation: Physician must read back the patient name, UHID, and critical value verbatim.
2. **Automated WhatsApp / SMS Push**:
   - ELIS simultaneously dispatches an encrypted WhatsApp Critical Alert push directly to the referring doctor's verified mobile.
   - If WhatsApp is unread within 5 minutes, the system falls back to SMS delivery.

### Step 3.2: Clinical AI Studio & Copilot Review
1. Click the **Clinical AI Insights** tab on the approval review drawer.
2. **PII Sanitization Layer**: All patient identifying data (Name, Phone, Aadhaar, Address) is stripped client-side before sending clinical parameters to the AI copilot (DPDP Act 2023 compliance).
3. **AI Capabilities**:
   - **CBC Scattergram Analysis**: Differentiating reactive lymphocytosis from atypical blasts or leukemic presentation.
   - **Thyroid Function Classifier**: Distinguishing primary hypothyroidism, subclinical hypothyroidism, and non-thyroidal illness syndrome.
   - **Multi-Organ Risk Assessment**: Cardiovascular risk index, estimated GFR (CKD-EPI 2021), and liver fibrosis score (FIB-4).
4. **Doctor Override Mechanism**: The pathologist retains 100% autonomy to accept, modify, or reject any AI-generated interpretation. Rejections are logged in the audit trail for quality assurance.

### Step 3.3: Electronic Sign-Off & Seal Embedding
1. Verify doctor signature credentials:
   - To upload or update your digital signature image, navigate to **Doctor Operations → Digital Signature Manager** (`/doctors?tab=verification`).
   - Image requirements: Transparent PNG or high-contrast JPEG, max 500KB.
   - Signature is securely stored in `uploads/signatures/` with salt-peppered doctor ID.
2. **Execute Sign-Off**:
   - Click **Approve & Sign Report** (or multi-select and click **Batch Approve & Sign**).
   - Enter your personal PIN / TOTP authentication token.
   - System executes:
     - Embedding of doctor's registered digital signature image.
     - Rendering of official NABL accreditation electronic seal with lab accreditation number.
     - Generation of SHA-256 HMAC cryptographic checksum embedded in QR code.
     - Immediate triggering of automated WhatsApp report delivery to patient and clinician.

### Step 3.4: Post-Release Report Amendments & Addendums
Under NABL ISO 15189 regulations, a signed report cannot simply be overwritten:
1. Locate the report in **Signed Archive** (`/approvals?status=APPROVED`).
2. Click **Issue Amended Report / Addendum**.
3. Enter mandatory **Reason for Amendment** (e.g., "Sample re-run requested by attending clinician due to sudden clinical change").
4. Enter updated result values.
5. System generates **Revision 2** (marked clearly with watermark: `AMENDED REPORT — REPLACES PREVIOUS REPORT DATED [TIMESTAMP]`).
6. Original report remains permanently accessible in the immutable audit log for legal and compliance discovery.

---

## 4. Pathologist Workstation Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| Open Next Case in Queue | `Ctrl + Right Arrow` |
| Open Previous Case in Queue | `Ctrl + Left Arrow` |
| Approve & Sign Current Report | `Ctrl + Enter` |
| Flag for Re-run / Return to Tech | `Alt + R` |
| View Delta Historical Trend Chart | `Alt + D` |
| Open AI Clinical Copilot Drawer | `Alt + A` |
