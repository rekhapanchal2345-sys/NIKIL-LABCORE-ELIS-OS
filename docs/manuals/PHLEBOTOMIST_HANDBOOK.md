# 💉 NIKIL-LABCORE-ELIS-OS — PHLEBOTOMIST & SPECIMEN ACCESSIONING HANDBOOK
> **Standard Operating Procedure (SOP) — Document ID:** `SOP-LIS-PHLEB-001`  
> **Applicable Role:** `PHLEBOTOMIST`, `SAMPLE_COLLECTION_OFFICER`, `LAB_TECH`  
> **Compliance Standard:** NABL ISO 15189:2022 §5.4.4 | CLSI GP41-A6 (Order of Draw)  
> **System Version:** `v3.0.0-PRODUCTION`

---

## 1. Phlebotomy Scope & Core Responsibilities

The Phlebotomist is responsible for pre-analytical specimen integrity. Errors at this stage account for up to 70% of all laboratory diagnostic errors. Key responsibilities:
1. **Patient Positive Identification (PPID)**: Strict 2-identifier protocol (Name + UHID / Date of Birth).
2. **Order of Draw Compliance**: Adherence to CLSI GP41-A6 order of draw to avoid cross-contamination of tube additives.
3. **Specimen Labeling & Barcode Integrity**: Immediate bedside application of Code 128 vector barcode labels.
4. **Sample Accessioning & Quality Inspection**: Inspection for hemolysis, lipemia, clotting, and volume sufficiency.
5. **Cold Chain Transport**: Maintaining 2–8°C for temperature-sensitive analytes.

---

## 2. Vacutainer Tube Color-Coding & CLSI Order of Draw

Always collect tubes in the following strict sequential order:

| Step | Tube Stopper Color | Additive / Container | Target Tests | Inversions |
|---|---|---|---|---|
| **1st** | **Yellow / Black** | Blood Cultures (SPS) | Aerobic / Anaerobic Hemoculture | 8–10 gentle inversions |
| **2nd** | **Light Blue** | Sodium Citrate 3.2% (1:9 ratio) | PT/INR, aPTT, D-Dimer, Fibrinogen | 3–4 gentle inversions (MUST FILL TO LINE) |
| **3rd** | **Red / Gold (SST)** | Clot Activator / Gel Separator | Biochemistry, Serology, Hormones, LFT, KFT | 5 inversions (Allow 30 min clotting) |
| **4th** | **Green / Light Green** | Lithium Heparin / Gel | STAT Electrolytes, Blood Gases, Troponin | 8–10 gentle inversions |
| **5th** | **Lavender / Purple** | K2-EDTA / K3-EDTA | CBC, HbA1c, ESR, Peripheral Smear, Blood Group | 8–10 gentle inversions |
| **6th** | **Grey** | Sodium Fluoride / Potassium Oxalate | Fasting & PP Plasma Glucose, Lactate | 8–10 gentle inversions |

> ⚠️ **CRITICAL WARNING:** Never transfer blood from a Lavender (EDTA) tube to a Red/Gold (Serum) tube. EDTA binds calcium and releases massive potassium, causing falsely lethal panic alerts (Pseudo-Hyperkalemia and Pseudo-Hypocalcemia).

---

## 3. Standard Operating Procedures (Step-by-Step)

### Step 3.1: Patient Verification & Prep
1. Verify patient identity verbally: "Please state your full name and date of birth."
2. Match with order sheet and UHID on the ELIS screen (**Patients → Pending Diagnostic Roster**).
3. Confirm pre-test fasting status (e.g., 10–12 hours for Lipid Profile / Fasting Glucose).

### Step 3.2: Barcode Printing & Bedside Labeling
1. Click **Print Barcode** on the active sample order row.
2. The system sends native ZPL / TSPL command to the 2-inch thermal label printer.
3. Verify Code 128 barcode clarity:
   - Must contain **Sample ID** (e.g., `SMP-20261027-0042`), **UHID**, **Patient Name**, and **Container Type**.
4. Apply barcode vertically along the length of the tube, leaving a clear view of the blood volume meniscus.

### Step 3.3: Specimen Accessioning (7-Stage State Machine)
The ELIS enforces a strict 7-stage state machine:
```
ORDERED ➔ COLLECTED ➔ RECEIVED ➔ IN_TRANSIT ➔ IN_LAB ➔ PROCESSING ➔ COMPLETED / REJECTED
```
1. In ELIS, locate the sample in **Samples → Accessioning Desk**.
2. Scan the tube barcode with the handheld 2D scanner.
3. System timestamps:
   - `collectedAt`: Current system time.
   - `collectedBy`: Authenticated phlebotomist ID.
4. Mark status as **RECEIVED** or **IN_LAB**.

### Step 3.4: Pre-Analytical Rejection Criteria (Immediate Rejection)
If specimen does not meet quality criteria, select **Reject Sample** in ELIS and choose standard rejection code:
- `REJ-01: HEMOLYZED` — Gross mechanical lysis from small needle / forceful plunger pull.
- `REJ-02: LIPEMIC` — High turbidity/triglycerides interfering with spectrophotometric assays.
- `REJ-03: CLOTTED_EDTA` — Inadequate mixing of Lavender tube causing micro-clots in CBC.
- `REJ-04: UNDERFILLED_CITRATE` — Light Blue tube below 90% fill line disrupts 1:9 anticoagulant ratio.
- `REJ-05: INCORRECT_CONTAINER` — Sample collected in non-compatible additive tube.
- `REJ-06: UNLABELED_MISLABELED` — Tube lacking legible barcode or name mismatch.

> 📢 **Action on Rejection:** The system automatically notifies the referring ward/clinician, cancels affected analyzer runs, and queues a **STAT Recollection Request**.

---

## 4. Phlebotomy Safety & Biohazard Compliance

- **Needle Safety**: Always use safety-engineered butterfly needles or evacuated tube holders with active needle guards. Never manually recap needles.
- **Sharps Disposal**: Immediately dispose of used needles into the puncture-proof red/yellow sharps container at point of collection.
- **Spill Management**: In case of tube breakage, cover spill with sodium hypochlorite (1% available chlorine) for 20 minutes before cleanup.
