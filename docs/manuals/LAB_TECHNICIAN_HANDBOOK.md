# 🔬 NIKIL-LABCORE-ELIS-OS — LABORATORY TECHNICIAN & INSTRUMENTATION HANDBOOK
> **Standard Operating Procedure (SOP) — Document ID:** `SOP-LIS-TECH-001`  
> **Applicable Role:** `LAB_TECH`, `MEDICAL_LABORATORY_TECHNOLOGIST`, `PATHOLOGY_FELLOW`  
> **Compliance Standard:** NABL ISO 15189:2022 §5.5 & §5.6 | Westgard Multi-Rule QC  
> **System Version:** `v3.0.0-PRODUCTION`

---

## 1. Laboratory Technician Scope & Responsibilities

The Medical Laboratory Technician executes the analytical phase of diagnostic testing. Key operational pillars:
1. **Quality Control (QC) & Calibration**: Performing morning control runs (Level 1, 2, 3) and validating Levey-Jennings charts against Westgard multi-rules before sample release.
2. **Automated Analyzer Operations**: Supervising bidirectional ASTM / HL7 TCP streams (Port 5005) for automated hematology and clinical chemistry analyzers.
3. **Manual Result Capture & Verification**: Entering manual morphology, urine microscopy, and rapid serology results.
4. **Delta-Check Triage**: Cross-verifying unexpected changes (>20% variance) against patient historical baseline.
5. **Reagent & Consumable Inventory**: Logging batch numbers, lot numbers, open-vial stability, and expiry dates.

---

## 2. Quality Control (QC) & Westgard Multi-Rule Evaluation

Every analytical shift starts with control material testing. In ELIS, navigate to **Analyzers & QC → Shift QC & Westgard Gate**.

### Westgard Rules Applied by the Engine:
| Rule | Violation Type | Clinical Interpretation & Action |
|---|---|---|
| **$1_{2s}$ (Warning)** | Warning | One control exceeds $\pm 2s$. Check next run. Do not stop testing unless another rule triggers. |
| **$1_{3s}$ (Random Error)** | **REJECT RUN** | One control exceeds $\pm 3s$. Potential pipetting error, bubble in cuvette, or power surge. |
| **$2_{2s}$ (Systematic Error)** | **REJECT RUN** | Two consecutive controls exceed $+2s$ or $-2s$. Reagent degradation or calibration drift. |
| **$R_{4s}$ (Random Error)** | **REJECT RUN** | Range between two controls within run exceeds $4s$ (one $+2s$, one $-2s$). |
| **$4_{1s}$ (Systematic Error)** | **REJECT RUN** | Four consecutive controls exceed $+1s$ or $-1s$. Calibration offset. |
| **$10_x$ (Systematic Error)** | **REJECT RUN** | Ten consecutive controls fall on one side of the mean. Instrument photometer drift. |

> 🛑 **ACTION ON WESTGARD REJECTION:** If a run rejection rule triggers, ELIS blocks all pending sample result releases on that instrument. Recalibrate, run fresh control material, and log corrective action before unblocking.

---

## 3. Automated Analyzer TCP Interface (Sysmex, Roche Cobas, Mindray)

The backend runs a dedicated Layer 4 TCP socket listener on port **5005** (`0.0.0.0:5005`).
- **Protocols Supported**: ASTM E1381 / E1394 (Standard RS-232/TCP), HL7 v2.5 MLLP.
- **Workflow**:
  1. Analyzer queries sample ID via `ENQ` frame.
  2. ELIS responds with `ACK` and transmits test download request (`O` frame with test codes).
  3. Analyzer executes sample assay and streams back results (`R` frame).
  4. ELIS captures raw results, parses analytes, and maps them to parameter IDs in the database.
- **Virtual Analyzer Simulator**:
  - Accessible under **Analyzers & QC → Virtual Protocol Simulator** (`/analyzers?tab=simulator`).
  - Use to test loopback TCP communication during maintenance or software upgrades.

---

## 4. Result Entry, Verification & Delta Checks

### Step 4.1: Accessing the Worklist
1. Navigate to **Results → Result Entry Worklist** (`/results`).
2. Filter by Department: **Hematology**, **Biochemistry**, **Microbiology**, **Clinical Pathology**, or **Serology**.
3. Select an order to open the parameter grid.

### Step 4.2: Parameter Value Validation & Flagging
The engine automatically flags every entered value against biological reference intervals (adjusted dynamically for age and gender):
- 🟢 **NORMAL**: Within reference range.
- 🟡 **HIGH (H) / LOW (L)**: Outside normal boundaries.
- 🔴 **CRITICAL PANIC (HH / LL)**: Exceeds life-threatening thresholds (e.g., Hemoglobin $< 5.0$ g/dL, Potassium $> 6.2$ mmol/L, Platelets $< 20,000$ /$\mu$L).

### Step 4.3: Delta Checks & Historical Comparison
- When entering results for a patient with previous orders, ELIS displays a delta comparison icon ($\Delta$).
- If a parameter deviates drastically from the prior result without clinical rationale (e.g., Creatinine jumps from 1.0 to 4.5 mg/dL within 24 hours):
  1. Re-check specimen labeling.
  2. Check for micro-clot or hemolysis.
  3. Re-run sample on analyzer to confirm result before submitting.

### Step 4.4: Technologist Verification
1. Review all parameter values and flags.
2. Click **Mark Verified (QC Pass)**.
3. Order moves to **Pathologist Approvals Queue**.

---

## 5. Reagent Inventory & Cold Chain (2–8°C)

1. **Reagent Registration**: Under **Supply Chain → Inventory & Reagents**, scan reagent barcode on receipt.
2. **Lot Number & Calibrator Factor**: Enter manufacturer lot number, calibrator target value, and expiration date.
3. **First-Expiry-First-Out (FEFO)**: ELIS enforces FEFO; warning alerts display if an older lot remains unopened.
4. **Cold Chain Monitoring**: Daily morning temperature recording for 2–8°C reagent refrigerators and -20°C freezer units.
