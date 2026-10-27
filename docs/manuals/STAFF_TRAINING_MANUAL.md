# NIKIL-LABCORE-ELIS-OS — HOSPITAL STAFF ONBOARDING & TRAINING MANUAL
**Standard Operating Procedure: 2-Hour Rapid Role Competency & Production Operational Certification**  
**Document Code:** `SOP-EDU-TRN-001` | **Revision:** `3.0.0-PROD` | **Effective Date:** October 2026  
**Compliance Standards:** NABL ISO 15189:2022 §5.1 (Personnel Competence), DPDP Act 2023 §8, ABDM Operational Standards  

---

## 1. TRAINING OBJECTIVES & ACCREDITATION SCOPE

This curriculum provides a structured, 2-hour interactive walkthrough of **NIKIL-LABCORE-ELIS-OS** for all clinical, laboratory, financial, and administrative hospital personnel. Upon completion, each trainee will demonstrate 100% operational competency in their designated role without requiring supervisory intervention.

---

## 2. 2-HOUR RAPID ONBOARDING SYLLABUS

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                  HOSPITAL STAFF 2-HOUR TRAINING TIMELINE                     │
├───────────────────┬───────────────────┬───────────────────┬──────────────────┤
│ MODULE 1 (30 min) │ MODULE 2 (30 min) │ MODULE 3 (30 min) │ MODULE 4 (30 min)│
│ Reception & POS   │ Phlebotomy Spec   │ Lab Technician    │ Pathologist & QC │
│ • UHID / EMPI     │ • CLSI GP41 Draw  │ • ASTM TCP 5005   │ • Workstation Q  │
│ • ABDM ABHA       │ • Vacutainers     │ • Westgard Rules  │ • Panic Cascade  │
│ • SAC 999316      │ • Thermal Labels  │ • Delta Checking  │ • Digital Seal   │
│ • Till Tally      │ • Rejection SOP   │ • Manual Ingress  │ • WhatsApp Push  │
└───────────────────┴───────────────────┴───────────────────┴──────────────────┘
```

---

### 📘 MODULE 1 (00:00 – 00:30): FRONT DESK RECEPTION & BILLING POS
**Target Role:** `RECEPTIONIST` / `ACCOUNTANT`  
**Reference Handbook:** `docs/manuals/RECEPTIONIST_HANDBOOK.md`

1. **Patient Registration & EMPI:**
   - How to search patient history using mobile number, Aadhaar, or Soundex phonetic search to prevent duplicate registrations.
   - Generation of official hospital Enterprise Master Patient Index (EMPI) UHID (`UHID-YYYY-XXXXXX`).
2. **Ayushman Bharat Digital Mission (ABDM) Integration:**
   - Creating or linking Ayushman Bharat Health Account (ABHA) via Aadhaar OTP or Demographic match.
3. **Diagnostic Test Requisition & CPOE:**
   - Selecting single diagnostic investigations or bundled wellness packages.
   - Assigning clinical priority (`STAT` for emergency ICU vs `ROUTINE`).
4. **GST Healthcare POS Invoicing (SAC 999316):**
   - Generating 0% GST healthcare diagnostic invoice under SAC code `999316`.
   - Accepting Cash, UPI (Dynamic QR), Card, or Advance Wallet.
5. **Cash Counter Daybook & Denomination Till Closure:**
   - Daily shift opening cash float recording.
   - Physical denomination tallying: ₹2000, ₹500, ₹200, ₹100, ₹50, ₹20, ₹10, ₹5, ₹2, ₹1.
   - Submitting cash daybook and reconciling system totals with physical drawer balance.

---

### 📘 MODULE 2 (00:30 – 01:00): PHLEBOTOMY & SPECIMEN ACCESSIONING
**Target Role:** `PHLEBOTOMIST`  
**Reference Handbook:** `docs/manuals/PHLEBOTOMIST_HANDBOOK.md`

1. **CLSI GP41-A6 Order of Draw:**
   - Blood collection tube sequence:
     1. Blood Cultures (SPS / Aerobic & Anaerobic bottles).
     2. Sodium Citrate (Light Blue - Coagulation / PT-INR).
     3. Serum Clot Activator / Gel Separator (Yellow / Red - Biochemistry & Serology).
     4. Lithium Heparin (Green - Plasma Chemistry).
     5. K2/K3 EDTA (Lavender - Hematology / CBC / HbA1c).
     6. Sodium Fluoride / Potassium Oxalate (Grey - Blood Glucose).
2. **Thermal Barcode Labeling & Verification:**
   - Generating and applying Code 128 thermal barcode labels vertically along tube axis.
   - Double-identifier confirmation: Patient Name + Date of Birth + Barcode match.
3. **Pre-Analytical Rejection Criteria (REJ-01 to REJ-06):**
   - Identifying hemolyzed, lipemic, clotted, underfilled, or mislabeled tubes.
   - Logging structured rejection reason in ELIS to notify front desk for redraw.

---

### 📘 MODULE 3 (01:00 – 01:30): MEDICAL LAB TECHNICIAN & ANALYZERS
**Target Role:** `LAB_TECH`  
**Reference Handbook:** `docs/manuals/LAB_TECHNICIAN_HANDBOOK.md`

1. **Automated Analyzer TCP Interface (Port 5005):**
   - Connecting automated analyzers (Mindray, Sysmex, Roche, Beckman) over ASTM E1381/E1394 TCP protocol.
   - Monitoring real-time ENQ-ACK handshake frames and result ingestion.
2. **Manual Result Entry & Mathematical Derivations:**
   - Entering numerical and semi-quantitative analyte values.
   - Automated formula calculations (e.g., eGFR, A/G Ratio, Anion Gap, Bilirubin Direct/Indirect).
3. **Historical Delta Checking:**
   - Evaluating delta change thresholds against previous patient results within 72 hours.
4. **Quality Control & Westgard 6-Rule Validation:**
   - Entering Level 1 and Level 2 QC material runs.
   - Interpreting Levey-Jennings visual charts (Mean $\pm 1s, \pm 2s, \pm 3s$).
   - Troubleshooting Westgard rule violations: $1_{2s}$ (Warning), $1_{3s}$ (Random error), $2_{2s}$ (Systematic error), $R_{4s}$, $4_{1s}$, $10_x$.

---

### 📘 MODULE 4 (01:30 – 02:00): PATHOLOGIST WORKSTATION & REPORT PUBLICATION
**Target Role:** `PATHOLOGIST` / `ADMIN`  
**Reference Handbook:** `docs/manuals/PATHOLOGIST_HANDBOOK.md`

1. **Workstation Queue Triage:**
   - Priority sorting: STAT emergencies and Panic alerts at top of approval queue.
2. **Critical Value / Panic Alert Cascade ($HH/LL$):**
   - Recognizing life-threatening critical values (e.g., Potassium $< 2.8$ or $> 6.2\text{ mmol/L}$, Platelets $< 20,000/\mu\text{L}$).
   - Triggering immediate automated SMS/WhatsApp alerts to ordering consultant physician.
3. **Gemini Clinical AI Copilot Integration:**
   - Activating AI differential diagnostic assistant for complex multi-parameter abnormal profiles.
4. **Cryptographic Digital Signature & NABL Seal Embedding:**
   - Reviewing generated preview PDF against reference biological intervals (CLSI C28-A3).
   - Applying doctor's electronic signature with SHA-256 HMAC chained approval token.
5. **Report Publication & Multi-Channel Delivery:**
   - Generating official NABL ISO 15189:2022 PDF report with dynamic QR code portal verification.
   - Automated push to patient WhatsApp and referer doctor portal.

---

## 3. STAFF COMPETENCY EVALUATION CHECKLIST

Before receiving active production credentials, each hospital operator must pass:

- [x] **Criterion 1:** Successfully sign in with multi-factor credentials and navigate sidebar.
- [x] **Criterion 2:** Execute core role task under 3 minutes (e.g., register patient, accession sample, approve result).
- [x] **Criterion 3:** Correctly identify and trigger a Critical Panic Alert cascade.
- [x] **Criterion 4:** Demonstrate familiarity with Incident Response SOP (`docs/manuals/INCIDENT_RESPONSE_RUNBOOK.md`).

---
*Authorized by Hospital Medical Superintendent & Laboratory Director, NIKIL-LABCORE-ELIS-OS.*
