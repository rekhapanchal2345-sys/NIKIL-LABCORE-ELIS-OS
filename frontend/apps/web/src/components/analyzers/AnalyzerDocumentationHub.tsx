"use client";

import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Languages,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  ShieldCheck,
  Server,
  Droplets,
  Terminal,
  Activity,
  ArrowRight,
  ChevronRight,
  Download,
  Printer,
  Copy,
  Check,
  Search,
  HelpCircle,
  Clock,
  Sparkles,
  PhoneCall,
  Sliders,
  AlertCircle,
  FileText,
  BadgeAlert,
  ArrowRightLeft,
  Wrench,
  Flame,
  Radio,
  Cpu,
  Bookmark,
  ChevronDown
} from "lucide-react";
import { REAL_WORLD_ANALYZERS, RealWorldAnalyzerSpec } from "./realWorldDemoAnalyzers";

type LanguageKey = "en" | "hi" | "hinglish" | "es" | "fr" | "de";

interface StepContent {
  phaseNumber: number;
  badge: string;
  title: string;
  summary: string;
  objective: string;
  clinicalRationale: string;
  checklist: string[];
  protocolSteps: { step: string; detail: string; warning?: string }[];
  technicalSpecs: { label: string; value: string }[];
  troubleshootingTip: string;
}

interface LanguageDictionary {
  name: string;
  flag: string;
  title: string;
  subtitle: string;
  overviewHeading: string;
  workflowHeading: string;
  stepsLabel: string;
  interactiveSimHeading: string;
  troubleshootingHeading: string;
  glossaryHeading: string;
  printSOP: string;
  copyProtocol: string;
  copied: string;
  filterDepartment: string;
  allDepartments: string;
  emergencySTATNote: string;
  steps: StepContent[];
  emergencyMatrix: {
    alarm: string;
    probableCause: string;
    correctiveAction: string;
    nablRequirement: string;
  }[];
  glossary: { term: string; definition: string; practicalTip: string }[];
}

export const DOCUMENTATION_DATA: Record<LanguageKey, LanguageDictionary> = {
  en: {
    name: "English",
    flag: "🇬🇧",
    title: "Clinical Laboratory Automated Analyzer Operating Manual & SOP",
    subtitle: "End-to-End Standard Operating Procedure compliant with ISO 15189:2022, CLSI guidelines, and NABL/CAP accreditation standards.",
    overviewHeading: "Standard Operating Architecture",
    workflowHeading: "Step-by-Step Clinical Walkthrough",
    stepsLabel: "Phases",
    interactiveSimHeading: "Live Hands-On Diagnostic Simulator",
    troubleshootingHeading: "Emergency Troubleshooting & Deviation Matrix",
    glossaryHeading: "Clinical & Interface Terminology Glossary",
    printSOP: "Print / Export Official SOP",
    copyProtocol: "Copy Phase SOP",
    copied: "SOP Copied to Clipboard!",
    filterDepartment: "Filter by Section",
    allDepartments: "All Diagnostic Disciplines",
    emergencySTATNote: "STAT specimen overrides routine batches immediately with guaranteed < 15 minute turnaround time.",
    steps: [
      {
        phaseNumber: 1,
        badge: "PHASE 01: HARDWARE INITIALIZATION",
        title: "Pre-Analytical Checks & Hardware Power-up",
        summary: "Initialize mains electrical isolation, pneumatic air compressors, hydraulic fluidics, and thermal incubation chambers before running patient specimens.",
        objective: "Ensure mechanical, optical, and thermal systems stabilize at standard physiological tolerances (37.0°C ± 0.1°C) to prevent pre-analytical analytical drift.",
        clinicalRationale: "Enzymatic and substrate kinetics require exact reaction temperatures. Starting cold creates severe negative bias in AST, ALT, LDH, and CK-MB results.",
        checklist: [
          "Verify Uninterruptible Power Supply (UPS) output voltage is 220V - 240V ± 2%.",
          "Inspect air compressor pneumatic pressure gauge: 0.45 to 0.65 MPa (4.5 to 6.5 bar).",
          "Ensure liquid biohazard waste carboy container is empty and neutralizer added.",
          "Check wash solution bottle (de-proteinizing concentrate) volume > 80%.",
          "Allow photometer halogen lamp or solid-state laser diode to preheat for 20-30 minutes."
        ],
        protocolSteps: [
          {
            step: "Mains & Secondary Power Ignition",
            detail: "Switch on rear isolation breaker, followed by the front panel soft-power switch. Observe internal boot self-test (POST)."
          },
          {
            step: "Fluidic Prime & Air Purge Cycle",
            detail: "From the maintenance menu, trigger 'Hydraulic System Prime'. The dual syringe pumps will flush 50ml deionized water through probes to eliminate air bubbles.",
            warning: "Micro-bubbles inside the syringe barrel will cause pipetting volume error of 5-15%."
          },
          {
            step: "Thermal Equilibrium Verification",
            detail: "Inspect thermal sensor readings. The reaction carousel bath must reach 37.0°C (± 0.1°C) and the reagent refrigeration chamber must register 2°C - 8°C."
          }
        ],
        technicalSpecs: [
          { label: "Operating Temperature", value: "37.0°C ± 0.1°C" },
          { label: "Pneumatic Pressure", value: "0.55 MPa (5.5 bar)" },
          { label: "Reagent Storage Chiller", value: "2.0°C - 8.0°C" },
          { label: "Preheat Duration", value: "25 - 30 minutes" }
        ],
        troubleshootingTip: "If hydraulic pressure fails to build, check if the waste bottle cap is loosely tightened, compromising vacuum seal."
      },
      {
        phaseNumber: 2,
        badge: "PHASE 02: REAGENT & CONSUMABLE MANAGEMENT",
        title: "Reagent Loading, Barcode Registration & Dead Volume Inspection",
        summary: "Load dedicated reagent cassettes, verify RFID/2D barcode authenticity, track open-vial stability, and monitor reaction cuvette stock.",
        objective: "Prevent analytical interruption caused by exhausted reagents, expired open-pack stability, or dead volume aspiration errors.",
        clinicalRationale: "Using reagents past their onboard open-vial stability leads to substrate degradation, false negative troponin, or aberrant electrolyte curves.",
        checklist: [
          "Check reagent refrigeration chamber temperature (2°C - 8°C) before unsealing vials.",
          "Scan 2D DataMatrix barcode on reagent pack to register Lot Number and Expiry Date.",
          "Ensure no foam or bubbles exist on the reagent liquid surface inside the cassette.",
          "Check remaining tests counter: replace cartridges with < 15 tests remaining before large batches.",
          "Inspect reaction cuvettes magazine: replenish disposable optical cuvettes."
        ],
        protocolSteps: [
          {
            step: "Cassette Placement & RFID Alignment",
            detail: "Open reagent carousel door. Insert cobas c pack / Alinity cartridge into designated numbered slot until tactile lock engages."
          },
          {
            step: "Automated Reagent Inventory Scan",
            detail: "Trigger 'Barcode Scan Inventory'. The internal optical scanner reads lot, expiration, and calibration validity."
          },
          {
            step: "Dead Volume Meniscus Check",
            detail: "Verify liquid level exceeds manufacturer minimum dead volume (typically 1.5ml) to prevent liquid-level sensor air aspiration."
          }
        ],
        technicalSpecs: [
          { label: "Dead Volume Margin", value: "1.5 mL to 2.0 mL" },
          { label: "Onboard Stability", value: "28 to 60 days (active chiller)" },
          { label: "Barcode Format", value: "PDF417 / 2D DataMatrix" },
          { label: "Cuvette Optical Path", value: "10 mm optical precision quartz" }
        ],
        troubleshootingTip: "If bubble warning occurs on reagent probe, invert cartridge gently 5 times before loading. Never shake vigorously."
      },
      {
        phaseNumber: 3,
        badge: "PHASE 03: QUALITY ASSURANCE & WESTGARD RULES",
        title: "Daily Multi-Level QC, Calibration & Westgard Acceptance",
        summary: "Run 3-Level lyophilized human matrix control sera (Normal, Low, High), plot Levey-Jennings charts, and verify Westgard Multi-Rule compliance.",
        objective: "Validate precision and trueness before any clinical patient sample is aspirated, satisfying NABL/CAP daily quality clearance.",
        clinicalRationale: "A shift in calibration or dirty optical cuvette can cause systemic error, reporting falsely elevated bilirubin, glucose, or cardiac markers.",
        checklist: [
          "Reconstitute lyophilized QC vials with Type-1 reagent grade water (CLRW) using calibrated micropipette.",
          "Allow controls to equilibrate at room temperature for 30 minutes in dark; swirl gently.",
          "Load Level 1 (Normal), Level 2 (Low Abnormal), and Level 3 (High Abnormal) in dedicated QC rack.",
          "Inspect Levey-Jennings chart: confirm all parameters lie within ± 2 Standard Deviations (SD).",
          "Check for Westgard violation flags (1-3s, 2-2s, R-4s, 4-1s, 10-x)."
        ],
        protocolSteps: [
          {
            step: "QC Worklist Generation",
            detail: "Select 'Run Daily QC Routine'. Assign control cups into positions C1, C2, C3 of the calibration rotor."
          },
          {
            step: "Levey-Jennings & Westgard Evaluation",
            detail: "Evaluate automated rule engine. If 1-2s warning triggers, examine run; if 1-3s or 2-2s triggers, system automatically engages analytical lockout.",
            warning: "Never override a 1-3s or 2-2s lockout without performing root-cause corrective action and re-running fresh control."
          },
          {
            step: "Electronic Quality Sign-off",
            detail: "Lab Technologist and Quality Manager approve daily QC batch in LIS. Analyzer status transitions to 'QC PASSED - RUN READY'."
          }
        ],
        technicalSpecs: [
          { label: "Acceptable CV%", value: "< 2.5% across routine chemistry" },
          { label: "Westgard 1-3s Action", value: "RUN REJECTED - Immediate Lockout" },
          { label: "Westgard 2-2s Action", value: "RUN REJECTED - Systematic Shift" },
          { label: "Control Matrix", value: "Lyophilized Human Serum Base" }
        ],
        troubleshootingTip: "If an entire panel shifts simultaneously in one direction, suspect reagent lot change or water purification system filter degradation."
      },
      {
        phaseNumber: 4,
        badge: "PHASE 04: LIS INTERFACING & BIDIRECTIONAL ASTM/HL7",
        title: "LIS Host Connection & Bidirectional Query Handshake",
        summary: "Establish bidirectional low-level socket communication over RS-232 / TCP-IP, parse ASTM E1381/E1394 frames, and sync patient test worklists.",
        objective: "Automate test orders from barcode scans without manual human keyboard entry, eliminating sample misidentification errors.",
        clinicalRationale: "Manual test selection in high-volume labs results in a 1-3% transcription error rate, causing wrong tests or delayed critical diagnoses.",
        checklist: [
          "Verify network socket state: TCP/IP Port listening on 5100 (ASTM) or 6000 (HL7).",
          "Ensure LIS Host service is online and polling heartbeat packet every 30 seconds.",
          "Check baud rate (9600 bps), 8 data bits, no parity, 1 stop bit for serial connections.",
          "Confirm character encoding: ASCII UTF-8 standard medical delimiter set (|, \\, ^, &).",
          "Validate auto-query mode is active in analyzer host communication parameters."
        ],
        protocolSteps: [
          {
            step: "Low-Level Handshake Negotiation",
            detail: "Analyzer transmits [ENQ] (0x05). LIS Host replies with [ACK] (0x06). Session established."
          },
          {
            step: "Bi-directional Query Frame Transmission",
            detail: "Upon scanning tube barcode 'SAMP-9921', analyzer transmits: 'Q|1|^SAMP-9921||ALL||||||||O'. LIS matches order and returns Order Record 'O|1|...'."
          },
          {
            step: "Worklist Download & Buffer Queuing",
            detail: "Analyzer receives requested test codes (e.g. GLU, UREA, CREA, SGPT), schedules incubation timing, and prepares optical filters."
          }
        ],
        technicalSpecs: [
          { label: "Protocol Standard", value: "ASTM E1381 / E1394 & HL7 v2.5 MLLP" },
          { label: "Transmission Delay", value: "< 350 ms per specimen query" },
          { label: "Framing Delimiters", value: "[STX] Frame [ETX] Checksum [CR][LF]" },
          { label: "Handshake Bytes", value: "ENQ (0x05), ACK (0x06), NAK (0x15)" }
        ],
        troubleshootingTip: "If analyzer repeatedly transmits [NAK], check for framing checksum mismatch or loose physical RJ45 network cable."
      },
      {
        phaseNumber: 5,
        badge: "PHASE 05: SPECIMEN LOADING & STAT LANING",
        title: "Primary Specimen Accessioning, Rack Loading & Emergency STAT Lane",
        summary: "Load centrifuged primary vacutainer tubes into multi-position racks, inspect liquid level capacitance, and route emergency STAT specimens.",
        objective: "Ensure specimen integrity, prevent aspiration of fibrin clots or air, and execute 15-minute emergency turnaround times.",
        clinicalRationale: "Aspirating a fibrin clot jams the probe and ruins subsequent patient samples. STAT cardiac troponin requires under 15-minute reporting.",
        checklist: [
          "Verify specimen centrifugation: 1500g for 10 minutes at 20°C - 25°C with clean gel barrier separation.",
          "Ensure tube barcodes face outwards through the rack reading slit.",
          "Check tube types: Lavender K2-EDTA for Hematology, Gold SST Gel for Biochemistry/Immunology, Blue Citrate for Coagulation.",
          "Confirm sample volume: Minimum 500 µL serum/plasma above gel barrier.",
          "Inspect for hemolysis, icterus, or severe lipemia (HIL Index)."
        ],
        protocolSteps: [
          {
            step: "Primary Rack Ingestion",
            detail: "Place 5-tube or 10-tube racks on the sample input lane. The automated conveyor feeds racks into the barcode reader station."
          },
          {
            step: "Emergency STAT Port Bypass",
            detail: "For critical ICU/ER patients, place tube in the dedicated red STAT port. Analyzer immediately suspends routine queue and aspirates STAT next."
          },
          {
            step: "Liquid Level & Clot Detection (LLCD)",
            detail: "Aspiration probe uses capacitive liquid level sensing to detect serum surface, plunging exactly 2mm below meniscus to avoid bubble entry."
          }
        ],
        technicalSpecs: [
          { label: "Centrifugation Speed", value: "1500g - 2000g (10 minutes)" },
          { label: "Minimum Serum Dead Volume", value: "150 µL above gel" },
          { label: "Sample Aspiration Volume", value: "2.0 µL to 25.0 µL" },
          { label: "STAT Priority TAT", value: "< 15 minutes guaranteed" }
        ],
        troubleshootingTip: "If a clot error triggers, remove the tube, rim the clot with a clean applicator stick, re-centrifuge at 2000g for 5 minutes, and re-aspirate."
      },
      {
        phaseNumber: 6,
        badge: "PHASE 06: OPTICAL MEASUREMENT & REACTION KINETICS",
        title: "Micro-Aspiration, Incubation Kinetics & Laser Photometry",
        summary: "Dispense precise micro-volumes into cuvettes, add R1/R2 reagents, maintain 37°C incubation, and capture multi-wavelength absorbance curves.",
        objective: "Achieve sub-microliter dispensing precision and photometric linearity across dynamic clinical ranges.",
        clinicalRationale: "Kinetic enzyme assays (SGOT/SGPT/Amylase) calculate activity from delta-absorbance (ΔA/min). Probe carryover produces catastrophic false results.",
        checklist: [
          "Verify probe exterior wash nozzle pressure (0.2 MPa) with zero carryover (< 0.01%).",
          "Ensure stirring paddle frequency is 1200 RPM for homogenous mixing without bubble generation.",
          "Confirm halogen lamp / laser diode baseline intensity across 12 wavelengths (340nm - 800nm).",
          "Monitor reaction bath degassed distilled water cleanliness.",
          "Check ISE electrode response potential for Na+, K+, Cl- slope calibration."
        ],
        protocolSteps: [
          {
            step: "Sample & Reagent Micro-Pipetting",
            detail: "Probe aspirates 3.0 µL serum and dispenses into cuvette containing 150 µL Reagent 1 (R1) at 37°C."
          },
          {
            step: "Kinetic Reaction Monitoring",
            detail: "Photometer takes 24 discrete absorbance readings over 10 minutes at 340nm and 405nm to plot kinetic slope."
          },
          {
            step: "Substrate Exhaustion Flagging",
            detail: "If initial absorbance drop exceeds linearity limit (e.g. Glucose > 700 mg/dL), analyzer triggers automatic 1:5 auto-dilution."
          }
        ],
        technicalSpecs: [
          { label: "Photometric Range", value: "0.0000 to 3.0000 Abs (10mm)" },
          { label: "Wavelength Array", value: "340, 380, 405, 450, 480, 505, 546, 570, 600, 660, 700, 800 nm" },
          { label: "ISE Electrode Slope", value: "Na+: 54-62 mV, K+: 52-60 mV, Cl-: 48-58 mV" },
          { label: "Carryover Suppression", value: "< 0.01% with active hypochlorite rinse" }
        ],
        troubleshootingTip: "Non-linear absorbance curves on kinetic enzymes indicate substrate depletion. Inspect auto-dilution rerun."
      },
      {
        phaseNumber: 7,
        badge: "PHASE 07: AUTO-VALIDATION & CRITICAL PANIC ESCALATION",
        title: "Result Auto-Validation, Delta Checking & Critical Panic Escalation",
        summary: "Apply reference range filters, compare against patient historical delta limits, suppress HIL interferences, and execute telephone read-back protocols.",
        objective: "Ensure only scientifically verified results enter patient records and panic values reach treating physicians within 5 minutes.",
        clinicalRationale: "A sudden 50% creatinine rise indicates acute renal failure. A Potassium of 6.8 mmol/L can cause fatal cardiac arrhythmias.",
        checklist: [
          "Evaluate biological reference intervals based on age, gender, and clinical context.",
          "Execute Delta Check: flag results differing by > 30% from the previous 48-hour baseline.",
          "Inspect HIL Index: alert if Hemolysis (H > 50), Icterus (I > 10), or Lipemia (L > 100) invalidates assay.",
          "Identify Critical Panic Values (e.g. Glucose < 45 mg/dL, K+ > 6.2 mmol/L, Platelets < 20,000/µL).",
          "Ensure telephone read-back is documented with doctor name, time, and technician ID under NABL 5.8."
        ],
        protocolSteps: [
          {
            step: "Rule-Based Auto-Validation Engine",
            detail: "Results without flags, within normal limits and matching delta checks auto-release to LIS within 30 seconds."
          },
          {
            step: "Critical Panic Alarm Trigger",
            detail: "If panic threshold is breached, visual and audio alarms activate on the workbench. System prompts Critical Call Module."
          },
          {
            step: "Escalation & Read-Back Log",
            detail: "Technologist calls ordering ICU/Ward physician, confirms verbal read-back, and logs digital timestamp in LIS audit trail."
          }
        ],
        technicalSpecs: [
          { label: "Critical Potassium Panic", value: "< 2.8 or > 6.2 mmol/L" },
          { label: "Critical Glucose Panic", value: "< 45 or > 450 mg/dL" },
          { label: "Critical Platelet Panic", value: "< 20,000 / µL" },
          { label: "Read-back Documentation", value: "Mandatory NABL / ISO 15189 Clause 5.8" }
        ],
        troubleshootingTip: "If extreme potassium (> 6.5 mmol/L) occurs with normal urea and creatinine, verify if the sample was drawn in EDTA tube and transferred to plain tube (pseudo-hyperkalemia)."
      },
      {
        phaseNumber: 8,
        badge: "PHASE 08: DECONTAMINATION & AUDIT ARCHIVAL",
        title: "End-of-Cycle Decontamination, Probe Sanitization & NABL Audit Logging",
        summary: "Execute sodium hypochlorite wash cycles, de-proteinize sample and reagent needles, neutralize biohazard waste, and archive maintenance compliance records.",
        objective: "Prevent bacterial biofilm, needle salt encrustation, protein carryover, and maintain permanent accreditation audit readiness.",
        clinicalRationale: "Failure to clean probes daily creates micro-encrustation of protein, altering aspiration volumes by up to 8% within 3 days.",
        checklist: [
          "Load 5% sodium hypochlorite (NaOCl) and 0.1M NaOH cleaning solutions into designated wash positions.",
          "Trigger automated End-of-Day Shutdown Maintenance Routine.",
          "Empty biohazard liquid waste container and add 10% bleach disinfectant before drain disposal.",
          "Wipe reagent and sample probe shafts gently with lint-free alcohol swab.",
          "Digitally sign daily maintenance logbook with operator ID and electronic timestamp."
        ],
        protocolSteps: [
          {
            step: "Chemical De-proteinization Wash",
            detail: "Analyzer runs high-pressure hypochlorite aspiration through sample needle, reagent probes, and flow cell cuvettes for 15 minutes."
          },
          {
            step: "Fluidic Line Water Flush",
            detail: "System flushes 200ml deionized water through all lines to remove residual bleach and prevent crystallization."
          },
          {
            step: "Logbook Archival & Backup Sync",
            detail: "All daily calibration, QC Levey-Jennings, error logs, and technician signatures export to encrypted cloud compliance vault."
          }
        ],
        technicalSpecs: [
          { label: "Decontamination Agent", value: "5% Sodium Hypochlorite (NaOCl) & Acid Wash" },
          { label: "Wash Duration", value: "15 - 20 minutes automated" },
          { label: "Audit Compliance", value: "ISO 15189:2022 & 21 CFR Part 11" },
          { label: "Record Retention", value: "Minimum 5 Years NABL requirement" }
        ],
        troubleshootingTip: "Never use metal wires to clean probe tips, as this damages the internal hydrophilic Teflon coating and creates massive carryover."
      }
    ],
    emergencyMatrix: [
      {
        alarm: "CLOT / PROBE OBSTRUCTION (ERR-304)",
        probableCause: "Fibrin micro-clot or sediment aspirated from inadequately centrifuged sample tube.",
        correctiveAction: "Run 'Probe Wash & Backflush'. If clogged, detach needle, immerse in 0.1M NaOH for 10 min, ultrasonic clean, and re-prime fluidics.",
        nablRequirement: "Log sample rejection incident, request redraw or re-centrifuge at 2000g for 10 min."
      },
      {
        alarm: "WESTGARD 1-3s VIOLATION (QC LOCKOUT)",
        probableCause: "Random pipetting error, deteriorating control vial, expired open-pack stability, or optical filter dust.",
        correctiveAction: "Do NOT run patients. Inspect Levey-Jennings chart. Thaw fresh control aliquot, re-run. If still failing, perform full 2-point recalibration.",
        nablRequirement: "Document non-conformance report (NCR) with root cause and corrective action before unlocking."
      },
      {
        alarm: "REAGENT BUBBLE / DEAD VOLUME (ERR-112)",
        probableCause: "Liquid level below minimum dead volume or surface foam from vigorous vial shaking.",
        correctiveAction: "Allow cartridge to settle. Use clean transfer pipette to deflate surface bubbles. Replenish reagent if < 1.5ml remaining.",
        nablRequirement: "Verify lot numbers match currently calibrated baseline."
      },
      {
        alarm: "LIS HOST TIMEOUT / SOCKET DROP",
        probableCause: "Ethernet disconnect, IP address conflict, or LIS middleware driver service crash.",
        correctiveAction: "Ping LIS IP from analyzer terminal. Check physical RJ45 patch cord. Restart LIS listener port 5100 / 6000 and broadcast handshake ENQ.",
        nablRequirement: "Operate in local buffer memory; re-transmit stored results upon reconnection."
      },
      {
        alarm: "TEMPERATURE DRIFT > 37.2°C (ERR-501)",
        probableCause: "Incubation bath circulation pump failure or air conditioning failure in the laboratory.",
        correctiveAction: "Inspect water circulation level. Ensure room temperature is 20°C - 24°C. Clean radiator fan filter on analyzer rear panel.",
        nablRequirement: "Halt all enzyme assays (AST, ALT, LDH, AMY) until temperature stabilizes within ± 0.1°C."
      }
    ],
    glossary: [
      {
        term: "ASTM E1381 / E1394",
        definition: "International standard communication protocols for transferring clinical data between laboratory analytical instruments and computer systems.",
        practicalTip: "Uses low-level framing with Header (H), Patient (P), Order (O), Result (R), Comment (C), and Terminator (L) records."
      },
      {
        term: "HL7 v2.5 (Health Level Seven)",
        definition: "Healthcare messaging standard utilizing MLLP (Minimal Lower Layer Protocol) over TCP/IP sockets for electronic health record connectivity.",
        practicalTip: "Transmits segments like MSH (Header), PID (Patient ID), OBR (Observation Request), and OBX (Observation Result)."
      },
      {
        term: "Westgard Multi-Rules",
        definition: "Statistical quality control decision criteria used to evaluate whether an analytical run is in control or should be rejected.",
        practicalTip: "1-2s is a warning; 1-3s and 2-2s mandate immediate run rejection."
      },
      {
        term: "Levey-Jennings Chart",
        definition: "A graphical quality control chart displaying daily control values plotted relative to the mean and standard deviation limits (±1SD, ±2SD, ±3SD).",
        practicalTip: "Helps visually identify systematic shifts (mean shifts) or systematic trends (gradual drift over consecutive days)."
      },
      {
        term: "HIL Index (Hemolysis, Icterus, Lipemia)",
        definition: "Automated spectrophotometric assessment of serum interference caused by free hemoglobin, bilirubin, or lipids.",
        practicalTip: "High hemolysis falsely increases Potassium and LDH; lipemia falsely distorts electrolyte ISE readings."
      },
      {
        term: "Delta Check",
        definition: "An automated clinical safety algorithm comparing a patient's current laboratory result with their own previous historical result.",
        practicalTip: "Catches specimen mix-ups (wrong blood in tube) or acute catastrophic physiological crises."
      },
      {
        term: "Critical Panic Value",
        definition: "A laboratory test result indicating an immediate life-threatening pathophysiology requiring urgent clinical intervention.",
        practicalTip: "Mandates telephone read-back within 15 minutes as per NABL ISO 15189 accreditation clause 5.8."
      },
      {
        term: "STAT Emergency Lane",
        definition: "High-priority analytical pipeline allowing urgent ICU/Emergency samples to bypass all scheduled routine batches.",
        practicalTip: "Ensures turnaround times of under 15 minutes for Troponin, Potassium, Arterial Blood Gases, and D-Dimer."
      }
    ]
  },
  hi: {
    name: "हिंदी (Hindi)",
    flag: "🇮🇳",
    title: "क्लिनिकल प्रयोगशाला ऑटोमेटेड एनालाइज़र संचालन नियमावली व एसओपी (SOP)",
    subtitle: "ISO 15189:2022, CLSI और NABL/CAP राष्ट्रीय प्रयोगशाला मानकों के अनुसार संपूर्ण चरणबद्ध संचालन गाइड।",
    overviewHeading: "मानक संचालन प्रक्रिया की रूपरेखा",
    workflowHeading: "चरणबद्ध क्लिनिकल वर्कफ़्लो (प्रारंभ से अंत तक)",
    stepsLabel: "चरण (Phases)",
    interactiveSimHeading: "लाइव इंटरएक्टिव सिमुलेटर (हाथों-हाथ अभ्यास)",
    troubleshootingHeading: "आपातकालीन समस्या निवारण व त्रुटि समाधान",
    glossaryHeading: "तकनीकी व क्लिनिकल शब्दावली (Glossary)",
    printSOP: "आधिकारिक एसओपी प्रिंट / डाउनलोड करें",
    copyProtocol: "इस चरण की एसओपी कॉपी करें",
    copied: "एसओपी सफलतापूर्वक क्लिपबोर्ड में कॉपी हो गई!",
    filterDepartment: "विभाग के अनुसार चुनें",
    allDepartments: "सभी पैथोलॉजी विभाग",
    emergencySTATNote: "आपातकालीन STAT सैंपल सामान्य कार्यप्रवाह को तुरंत रोककर 15 मिनट में प्राथमिकता से प्रोसेस होते हैं।",
    steps: [
      {
        phaseNumber: 1,
        badge: "चरण 01: हार्डवेयर बूट व प्रारंभिक तैयारी",
        title: "प्री-एनालिटिकल जांच व मशीन पावर-ऑन प्रक्रिया",
        summary: "मरीज के सैंपल लगाने से पहले मुख्य बिजली, यूपीएस, न्यूमैटिक कंप्रेसर प्रेशर और इनक्यूबेशन चैंबर तापमान की जांच करें।",
        objective: "यह सुनिश्चित करना कि मशीन के यांत्रिक, प्रकाशीय और तापमान घटक मानक स्तर (37.0°C ± 0.1°C) पर स्थिर हो चुके हैं।",
        clinicalRationale: "एंजाइम और बायोकेमिकल रिएक्शन के लिए सटीक 37 डिग्री तापमान अनिवार्य है। मशीन ठंडी होने पर SGOT, SGPT, LDH गलत कम आते हैं।",
        checklist: [
          "जांचें कि यूपीएस (UPS) वोल्टेज 220V - 240V स्थिर दे रहा है।",
          "न्यूमैटिक एयर प्रेशर गेज की जांच करें: 0.45 से 0.65 MPa (4.5 से 6.5 बार)।",
          "बायोहैजर्ड लिक्विड वेस्ट कैन खाली करें और उसमें कीटाणुनाशक मिलाएं।",
          "डी-प्रोटीनाइजिंग वॉश सॉल्यूशन बॉटल का स्तर 80% से अधिक रखें।",
          "हैलोजन लैंप / लेजर डायोड को 25 से 30 मिनट तक गर्म (Warm-up) होने दें।"
        ],
        protocolSteps: [
          {
            step: "मुख्य और सेकेंडरी पावर ऑन करें",
            detail: "पीछे का मुख्य ब्रेकर चालू करें, फिर फ्रंट पैनल का पावर बटन दबाएं। मशीन का आंतरिक सेल्फ-टेस्ट (POST) पूरा होने दें।"
          },
          {
            step: "फ्लूइडिक प्राइम और एयर पर्ज साइकिल",
            detail: "मेंटेनेंस मेनू में जाकर 'Hydraulic System Prime' चलाएं। सिरिंज पंप प्रोब से हवा के बुलबुले बाहर निकाल देगा।",
            warning: "सिरिंज में हवा का बुलबुला होने पर पिपेटिंग वॉल्यूम में 5-15% की गलती हो जाती है।"
          },
          {
            step: "थर्मल तापमान सत्यापन (37.0°C)",
            detail: "रिएक्शन कैरोसेल बाथ 37.0°C (± 0.1°C) और रीजेंट चैंबर 2°C - 8°C पर स्थिर होना चाहिए।"
          }
        ],
        technicalSpecs: [
          { label: "ऑपरेटिंग तापमान", value: "37.0°C ± 0.1°C" },
          { label: "न्यूमैटिक प्रेशर", value: "0.55 MPa (5.5 bar)" },
          { label: "रीजेंट चिलर तापमान", value: "2.0°C - 8.0°C" },
          { label: "वार्म-अप समय", value: "25 - 30 मिनट" }
        ],
        troubleshootingTip: "यदि प्रेशर नहीं बन रहा है, तो वेस्ट बॉटल का ढक्कन ढीला हो सकता है, जिससे वैक्यूम लीक होता है।"
      },
      {
        phaseNumber: 2,
        badge: "चरण 02: अभिकर्मक (Reagent) प्रबंधन",
        title: "रीजेंट लोडिंग, बारकोड रजिस्ट्रेशन व डेड वॉल्यूम जांच",
        summary: "रीजेंट कैसेट लोड करें, आरएफआईडी/2डी बारकोड स्कैन करें, ओपन-वायल स्टेबिलिटी जांचें और क्युवेट स्टॉक सुनिश्चित करें।",
        objective: "टेस्ट के बीच रीजेंट खत्म होने या एक्सपायर्ड रीजेंट से होने वाली गलत रिपोर्टिंग को रोकना।",
        clinicalRationale: "एक्सपायरी या स्टेबिलिटी खत्म रीजेंट का उपयोग करने से फॉल्स-नेगेटिव ट्रोपोनिन या गलत इलेक्ट्रोलाइट्स रिपोर्ट होते हैं।",
        checklist: [
          "वायल खोलने से पहले रीजेंट चैंबर का तापमान 2°C - 8°C जांचें।",
          "2D डेटा-मैट्रिक्स बारकोड स्कैन करके लॉट नंबर और एक्सपायरी दर्ज करें।",
          "सुनिश्चित करें कि रीजेंट की सतह पर कोई झाग या बुलबुला न हो।",
          "कम से कम 15 टेस्ट बचे होने पर ही बड़े बैच शुरू करें।",
          "ऑप्टिकल डिस्पोजेबल क्युवेट्स ट्रे को भरें।"
        ],
        protocolSteps: [
          {
            step: "कैसेट लोडिंग व आरएफआईडी लॉक",
            detail: "कैरोसेल दरवाजा खोलें। कोबास या एलिनिटी कैसेट को खांचे में क्लिक होने तक मजबूती से लगाएं।"
          },
          {
            step: "स्वचालित बारकोड इन्वेंटरी स्कैन",
            detail: "'Scan Reagents' चलाएं। मशीन आंतरिक स्कैनर से लॉट, एक्सपायरी और टेस्ट संख्या पढ़ लेगी।"
          },
          {
            step: "डेड वॉल्यूम स्तर की पुष्टि",
            detail: "सुनिश्चित करें कि रीजेंट का स्तर न्यूनतम 1.5 मिली से ऊपर हो ताकि सुई में हवा न आए।"
          }
        ],
        technicalSpecs: [
          { label: "न्यूनतम डेड वॉल्यूम", value: "1.5 mL से 2.0 mL" },
          { label: "ऑन-बोर्ड स्टेबिलिटी", value: "28 से 60 दिन (चिलर में)" },
          { label: "बारकोड फॉर्मेट", value: "PDF417 / 2D DataMatrix" },
          { label: "क्युवेट प्रकाश पथ", value: "10 mm क्वार्ट्ज प्रिसिजन" }
        ],
        troubleshootingTip: "यदि रीजेंट पर झाग हो, तो बॉटल को धीरे-धीरे 5 बार पलटें। कभी भी तेजी से न हिलाएं।"
      },
      {
        phaseNumber: 3,
        badge: "चरण 03: गुणवत्ता नियंत्रण व वेस्टगार्ड नियम",
        title: "दैनिक 3-लेवल QC, कैलिब्रेशन व वेस्टगार्ड पासिंग",
        summary: "3-लेवल कंट्रोल (नॉर्मल, लो, हाई) चलाएं, लेवे-जेनिंग्स चार्ट देखें और वेस्टगार्ड मल्टी-रूल्स पास होने के बाद ही मशीन अनलॉक करें।",
        objective: "मरीजों के सैंपल चलाने से पहले मशीन की सटीकता व शुद्धता प्रमाणित करना (NABL अनिवार्य)।",
        clinicalRationale: "गंदे क्युवेट या कैलिब्रेशन शिफ्ट होने से सभी मरीजों का शुगर, बिलीरुबिन या यूरिया गलत बढ़ या घट सकता है।",
        checklist: [
          "टाइप-1 शुद्ध पानी (CLRW) से माइक्रो-पिपेट द्वारा कंट्रोल पाउडर घोलें।",
          "घोलने के बाद 30 मिनट अंधेरे में कमरे के तापमान पर स्थिर होने दें।",
          "लेवल-1 (नॉर्मल), लेवल-2 (लो), लेवल-3 (हाई) को QC रैक में लगाएं।",
          "लेवे-जेनिंग्स चार्ट जांचें: सभी पैरामीटर ±2 SD के अंदर होने चाहिए।",
          "वेस्टगार्ड नियमों (1-3s, 2-2s, R-4s, 4-1s, 10-x) के उल्लंघन की जांच करें।"
        ],
        protocolSteps: [
          {
            step: "दैनिक QC वर्कलिस्ट चलाएं",
            detail: "'Run Daily QC' चुनें। C1, C2, C3 कप में कंट्रोल भरकर रैक में रखें और स्टार्ट दबाएं।"
          },
          {
            step: "लेवे-जेनिंग्स व वेस्टगार्ड विश्लेषण",
            detail: "1-2s वॉर्निंग होने पर निगरानी रखें; यदि 1-3s या 2-2s आता है तो मशीन खुद को तुरंत लॉक कर लेगी।",
            warning: "1-3s या 2-2s फेल होने पर बिना सुधार और नया QC पास किए कभी भी मरीज के सैंपल न लगाएं।"
          },
          {
            step: "डिजिटल क्वालिटी अप्रूवल",
            detail: "लैब इंचार्ज एलआईएस में दैनिक QC अप्रूव करेगा। इसके बाद मशीन का स्टेटस 'QC PASSED - READY' होगा।"
          }
        ],
        technicalSpecs: [
          { label: "स्वीकार्य CV%", value: "< 2.5% रूटीन बायोकेमिस्ट्री" },
          { label: "1-3s वेस्टगार्ड एक्शन", value: "रन रिजेक्ट - तत्काल लॉकआउट" },
          { label: "2-2s वेस्टगार्ड एक्शन", value: "रन रिजेक्ट - सिस्टेमैटिक एरर" },
          { label: "कंट्रोल मैट्रिक्स", value: "लायोफिलाइज्ड ह्यूमन सीरम" }
        ],
        troubleshootingTip: "यदि पूरे पैनल का रिजल्ट एक ही दिशा में खिसक जाए, तो पानी के आरओ प्लांट का टीडीएस और रीजेंट लॉट चेक करें।"
      },
      {
        phaseNumber: 4,
        badge: "चरण 04: एलआईएस (LIS) इंटरफ़ेस व द्विदिशात्मक संचार",
        title: "LIS होस्ट कनेक्शन, ASTM व HL7 द्विदिशात्मक वर्कलिस्ट",
        summary: "RS-232 / नेटवर्क सॉकेट से एनालाइज़र को LIS से जोड़ें, ASTM E1394 फ्रेम समझें और बारकोड स्कैन पर ऑटो-वर्कलिस्ट पाएं।",
        objective: "मरीज के टेस्ट हाथ से टाइप करने की मानवीय भूल (Transcription Error) को शून्य करना।",
        clinicalRationale: "हाथ से टेस्ट कोड डालने पर 1-3% गलतियां होती हैं, जिससे मरीज का गलत टेस्ट हो सकता है।",
        checklist: [
          "सॉकेट जांचें: पोर्ट 5100 (ASTM) या 6000 (HL7) पर कनेक्टेड हो।",
          "LIS सर्वर प्रत्येक 30 सेकंड में हार्टबीट पिंग कर रहा हो।",
          "सीरियल पोर्ट सेटिंग: 9600 बॉड रेट, 8 डेटा बिट्स, नो पैरिटी, 1 स्टॉप बिट।",
          "डिलिमिटर जांचें: ASCII मानक (| , \\ , ^ , &) सेट हों।",
          "मशीन में 'Bidirectional Auto-Query' विकल्प चालू होना चाहिए।"
        ],
        protocolSteps: [
          {
            step: "हैंडशेक सिग्नल नेगोशिएशन",
            detail: "एनालाइज़र [ENQ] भेजेगा। LIS सर्वर [ACK] से उत्तर देगा। कनेक्शन शुरू हो जाएगा।"
          },
          {
            step: "बारकोड क्वेरी फ्रेम ट्रांसमिशन",
            detail: "ट्यूब का बारकोड 'SAMP-9921' स्कैन होते ही मशीन क्वेरी 'Q|1|^SAMP-9921||ALL' भेजेगी, LIS टेस्ट लिस्ट वापस भेजेगा।"
          },
          {
            step: "टेस्ट शेड्यूलिंग व क्युवेट असाइनमेंट",
            detail: "मशीन टेस्ट (जैसे LFT, KFT, लिपिड) के अनुसार क्युवेट, तापमान और वेवलेंथ तुरंत शेड्यूल करेगी।"
          }
        ],
        technicalSpecs: [
          { label: "प्रोटोकॉल मानक", value: "ASTM E1381 / E1394 और HL7 v2.5 MLLP" },
          { label: "ट्रांसमिशन लेटेंसी", value: "< 350 मिलीसेकंड प्रति सैंपल" },
          { label: "फ्रेम डिलिमिटर", value: "[STX] Frame [ETX] Checksum [CR][LF]" },
          { label: "हैंडशेक बाइट्स", value: "ENQ (0x05), ACK (0x06), NAK (0x15)" }
        ],
        troubleshootingTip: "यदि बार-बार [NAK] एरर आ रहा हो, तो नेटवर्क केबल (RJ45) या चेकसम फॉर्मूले की जांच करें।"
      },
      {
        phaseNumber: 5,
        badge: "चरण 05: सैंपल लोडिंग व आपातकालीन STAT लेन",
        title: "प्राइमरी ट्यूब बारकोडिंग, रैक लोडिंग व आपातकालीन STAT लेन",
        summary: "सेंट्रीफ्यूज किए गए ब्लड सैंपल को रैक में लगाएं, लिक्विड लेवल सेंसिंग जांचें और क्रिटिकल STAT सैंपल को प्राथमिकता दें।",
        objective: "सैंपल में थक्के (Fibrin Clot) से सुई जाम होने से बचाना और 15 मिनट में इमरजेंसी रिपोर्ट तैयार करना।",
        clinicalRationale: "फाइब्रिन क्लॉट सुई को जाम कर देता है। इमरजेंसी में ट्रोपोनिन और पोटेशियम 15 मिनट में चाहिए होते हैं।",
        checklist: [
          "सैंपल सेंट्रीफ्यूगेशन: 1500g पर 10 मिनट, जेल बैरियर साफ अलग हो।",
          "ट्यूब का बारकोड रैक के खुले हिस्से के सामने होना चाहिए ताकि स्कैनर पढ़ सके।",
          "कलर कोड: बैंगनी EDTA (हेमेटोलॉजी), पीली जेल SST (बायोकेमिस्ट्री), नीली साइट्रेट (पीटी/आईएनआर)।",
          "वॉल्यूम: जेल के ऊपर कम से कम 500 माइक्रोलीटर सीरम होना चाहिए।",
          "सीरम में हीमोलिसिस या झाग की जांच करें।"
        ],
        protocolSteps: [
          {
            step: "रैक लोडिंग व कन्वेयर फीड",
            detail: "5 या 10 ट्यूब वाली रैक को इनपुट लेन में रखें। ऑटोमेटेड बेल्ट इसे बारकोड स्कैनर के पास ले जाएगी।"
          },
          {
            step: "इमरजेंसी STAT पोर्ट बाईपास",
            detail: "आईसीयू या इमरजेंसी मरीज की ट्यूब को लाल STAT पोर्ट में रखें। मशीन रूटीन टेस्ट रोककर पहले इसे प्रोसेस करेगी।"
          },
          {
            step: "कैपेसिटिव लिक्विड लेवल सेंसिंग (LLCD)",
            detail: "सुई सीरम की सतह छूते ही केवल 2 मिमी नीचे डूबेगी ताकि हवा या बुलबुले अंदर न आएं।"
          }
        ],
        technicalSpecs: [
          { label: "सेंट्रीफ्यूज गति", value: "1500g - 2000g (10 मिनट)" },
          { label: "न्यूनतम सीरम वॉल्यूम", value: "जेल के ऊपर 150 µL डेड वॉल्यूम" },
          { label: "सैंपल एस्पिरेशन", value: "2.0 µL से 25.0 µL" },
          { label: "STAT गारंटी TAT", value: "< 15 मिनट में रिजल्ट" }
        ],
        troubleshootingTip: "यदि 'Clot Detected' अलार्म बजे, ट्यूब निकालें, एप्लीकेटर स्टिक से थक्का हटाएं और 2000g पर दोबारा 5 मिनट सेंट्रीफ्यूज करें।"
      },
      {
        phaseNumber: 6,
        badge: "चरण 06: ऑप्टिकल रीडिंग व रिएक्शन काइनेटिक्स",
        title: "माइक्रो-पिपेटिंग, इनक्यूबेशन व मल्टी-वेवलेंथ फोटोमेट्री",
        summary: "माइक्रो-वॉल्यूम में सैंपल और रीजेंट मिलाएं, 37°C पर इनक्यूबेट करें और मल्टीपल वेवलेंथ पर एब्सॉर्बेंस मापें।",
        objective: "सटीक फोटोमेट्रिक लिनियरिटी और सब-माइक्रोलीटर डिस्पेंसिंग सुनिश्चित करना।",
        clinicalRationale: "एंजाइम टेस्ट (SGOT, SGPT) एब्सॉर्बेंस ढलान (ΔA/min) से गिने जाते हैं। सुई का कंटैमिनेशन गंभीर गलतियां कर सकता है।",
        checklist: [
          "सुई के बाहरी वॉश नोजल का प्रेशर जांचें (कंटैमिनेशन 0.01% से कम होना चाहिए)।",
          "मिक्सिंग पैडल की गति 1200 RPM पर सही हो ताकि झाग न बने।",
          "हैलोजन लैंप / लेजर की 12 वेवलेंथ (340nm - 800nm) पर रोशनी की तीव्रता जांचें।",
          "रिएक्शन बाथ के डिस्टिल्ड वॉटर की पारदर्शिता चेक करें।",
          "ISE इलेक्ट्रोड स्लोप (Na, K, Cl) सामान्य रेंज में होना चाहिए।"
        ],
        protocolSteps: [
          {
            step: "सैंपल व रीजेंट का सूक्ष्म मिश्रण",
            detail: "सुई 3.0 µL सीरम खींचकर 150 µL R1 रीजेंट में 37°C पर क्युवेट में डालती है।"
          },
          {
            step: "काइनेटिक रिएक्शन मॉनिटरिंग",
            detail: "फोटोमीटर 10 मिनट में 340nm और 405nm पर 24 बार एब्सॉर्बेंस नापकर काइनेटिक ग्राफ बनाता है।"
          },
          {
            step: "सब्सट्रेट समाप्ति व ऑटो-डाइल्यूशन",
            detail: "यदि शुगर 700 mg/dL से ऊपर हो जाए, तो मशीन अपने आप 1:5 डाइल्यूट करके टेस्ट दोबारा चलाएगी।"
          }
        ],
        technicalSpecs: [
          { label: "फोटोमेट्रिक रेंज", value: "0.0000 से 3.0000 Abs (10mm)" },
          { label: "वेवलेंथ ऐरे", value: "340, 380, 405, 450, 505, 546, 600, 700, 800 nm" },
          { label: "ISE स्लोप रेंज", value: "Na+: 54-62 mV, K+: 52-60 mV, Cl-: 48-58 mV" },
          { label: "कैरी-ओवर रोकथाम", value: "< 0.01% एक्टिव सोडियम हाइपोक्लोराइट वॉश" }
        ],
        troubleshootingTip: "यदि काइनेटिक ग्राफ मुड़ा हुआ या असामान्य दिखे, तो ऑटो-डाइल्यूशन चलाकर दोबारा टेस्ट करें।"
      },
      {
        phaseNumber: 7,
        badge: "चरण 07: ऑटो-वेलिडेशन व क्रिटिकल पैनिक रीड-बैक",
        title: "रिजल्ट ऑटो-वेलिडेशन, डेल्टा चेक व क्रिटिकल पैनिक कॉल",
        summary: "रिफरेंस रेंज लागू करें, मरीज की पिछली रिपोर्ट से डेल्टा चेक करें, HIL इंडेक्स देखें और पैनिक वैल्यू पर तुरंत डॉक्टर को कॉल करें।",
        objective: "केवल सत्यापित रिपोर्ट मरीज तक पहुंचे और जीवन-घातक पैनिक रिजल्ट 5 मिनट में डॉक्टर तक पहुंचे।",
        clinicalRationale: "अचानक क्रिएटिनिन 50% बढ़ना किडनी फेलियर दर्शाता है। पोटेशियम 6.8 दिल की धड़कन रोक सकता है।",
        checklist: [
          "उम्र और लिंग के अनुसार रिफरेंस रेंज लागू करें।",
          "डेल्टा चेक करें: यदि 48 घंटे में मरीज का रिजल्ट 30% से अधिक बदला हो तो रोकें।",
          "HIL इंडेक्स जांचें: हीमोलिसिस (H>50), पीलिया (I>10), या फैट (L>100) टेस्ट को प्रभावित तो नहीं कर रहा।",
          "क्रिटिकल पैनिक वैल्यू पहचानें (जैसे शुगर < 45 mg/dL, K+ > 6.2 mmol/L, प्लेटलेट < 20,000)।",
          "NABL 5.8 नियम के तहत डॉक्टर को कॉल करके रीड-बैक और समय रजिस्टर में दर्ज करें।"
        ],
        protocolSteps: [
          {
            step: "नियम आधारित ऑटो-वेलिडेशन इंजन",
            detail: "बिना किसी एरर वाले और डेल्टा चेक पास नॉर्मल रिजल्ट 30 सेकंड में अपने आप रिलीज हो जाते हैं।"
          },
          {
            step: "क्रिटिकल पैनिक अलार्म व बीप",
            detail: "यदि पैनिक लिमिट पार होती है, तो स्क्रीन पर लाल चेतावनी और अलार्म बजता है।"
          },
          {
            step: "टेलीफोन रीड-बैक व रिकॉर्डिंग",
            detail: "टेक्निशियन संबंधित डॉक्टर या आईसीयू को फोन करके रिजल्ट पढ़कर सुनाएगा और डॉक्टर का नाम व समय दर्ज करेगा।"
          }
        ],
        technicalSpecs: [
          { label: "क्रिटिकल पोटेशियम सीमा", value: "< 2.8 या > 6.2 mmol/L" },
          { label: "क्रिटिकल शुगर सीमा", value: "< 45 या > 450 mg/dL" },
          { label: "क्रिटिकल प्लेटलेट सीमा", value: "< 20,000 / µL" },
          { label: "रीड-बैक लॉगिंग", value: "NABL / ISO 15189 क्लॉज 5.8 अनिवार्य" }
        ],
        troubleshootingTip: "यदि केवल पोटेशियम बहुत अधिक (> 6.5) और यूरिया/क्रिएटिनिन नॉर्मल हो, तो जांचें कि ब्लड EDTA वायल से तो नहीं डाला गया (स्यूडो-हाइपरकेलेमिया)।"
      },
      {
        phaseNumber: 8,
        badge: "चरण 08: दैनिक सफाई व NABL ऑडिट रिकॉर्ड",
        title: "एंड-ऑफ-डे डीकंटेमिनेशन, सुई की सफाई व डिजिटल लॉगबुक",
        summary: "सोडियम हाइपोक्लोराइट वॉश चलाएं, सुई और फ्लो-सेल से प्रोटीन हटाएं, बायोहैजर्ड वेस्ट खाली करें और दैनिक मेंटेनेंस पर डिजिटल हस्ताक्षर करें।",
        objective: "सुई पर प्रोटीन जमने से रोकना और मशीन को NABL / CAP ऑडिट के लिए हमेशा तैयार रखना।",
        clinicalRationale: "रोज सफाई न करने पर सुई के अंदर प्रोटीन जम जाता है, जिससे 3 दिन में पिपेटिंग वॉल्यूम 8% तक गलत हो जाता है।",
        checklist: [
          "5% सोडियम हाइपोक्लोराइट और 0.1M NaOH क्लीनिंग सॉल्यूशन को वॉश स्लॉट में लगाएं।",
          "मशीन का 'End-of-Day Shutdown Maintenance' ऑटोमेटेड प्रोग्राम शुरू करें।",
          "लिक्विड वेस्ट बॉटल में 10% ब्लीच डालकर कीटाणुरहित करने के बाद खाली करें।",
          "सुई के बाहरी हिस्से को अल्कोहल स्वैब से हल्के हाथ से साफ करें।",
          "ऑपरेटर आईडी और टाइमस्टैम्प के साथ डिजिटल मेंटेनेंस लॉगबुक पर साइन करें।"
        ],
        protocolSteps: [
          {
            step: "केमिकल डी-प्रोटीनाइजेशन वॉश साइकिल",
            detail: "मशीन 15 मिनट तक हाइपोक्लोराइट सॉल्यूशन से सुई, रीजेंट प्रोब और क्युवेट्स को धोती है।"
          },
          {
            step: "डिस्टिल्ड वॉटर फ्लश साइकिल",
            detail: "200 मिली डिस्टिल्ड वॉटर सभी पाइपों से गुजारा जाता है ताकि ब्लीच के कण जम न जाएं।"
          },
          {
            step: "लॉगबुक आर्काइव व बैकअप",
            detail: "दैनिक QC लेवे-जेनिंग्स, एरर लॉग और मेंटेनेंस रिपोर्ट क्लाउड सर्वर पर सुरक्षित सेव हो जाती है।"
          }
        ],
        technicalSpecs: [
          { label: "सफाई सॉल्यूशन", value: "5% सोडियम हाइपोक्लोराइट व एसिड वॉश" },
          { label: "सफाई समय", value: "15 - 20 मिनट स्वचालित" },
          { label: "ऑडिट मानक", value: "ISO 15189:2022 व 21 CFR Part 11" },
          { label: "रिकॉर्ड सुरक्षा", value: "कम से कम 5 वर्ष NABL नियम" }
        ],
        troubleshootingTip: "सुई साफ करने के लिए कभी भी धातु के तार का उपयोग न करें, इससे सुई की आंतरिक टेफ्लॉन कोटिंग खराब हो जाती है।"
      }
    ],
    emergencyMatrix: [
      {
        alarm: "CLOT DETECTED / सुई में थक्का (ERR-304)",
        probableCause: "सेंट्रीफ्यूज सही न होने के कारण सीरम में फाइब्रिन का थक्का सुई में फंस गया।",
        correctiveAction: "'Probe Backflush' चलाएं। न खुले तो सुई खोलकर 0.1M NaOH में 10 मिनट रखें, अल्ट्रासोनिक क्लीन करें।",
        nablRequirement: "सैंपल रिजेक्शन लॉग में दर्ज करें, मरीज का दोबारा सैंपल मंगाएं या 2000g पर 10 मिनट सेंट्रीफ्यूज करें।"
      },
      {
        alarm: "WESTGARD 1-3s QC फेल (LOCKOUT)",
        probableCause: "कंट्रोल खराब होना, पिपेटिंग गलती, खुला रीजेंट पुराना होना या फोटोमीटर फिल्टर पर धूल।",
        correctiveAction: "मरीजों के सैंपल बिल्कुल न लगाएं। नया कंट्रोल घोलकर लगाएं। फिर भी फेल हो तो नया कैलिब्रेशन करें।",
        nablRequirement: "नॉन-कन्फर्मिटी रिपोर्ट (NCR) भरें, कारण और समाधान लिखकर ही मशीन अनलॉक करें।"
      },
      {
        alarm: "REAGENT BUBBLE / हवा का बुलबुला (ERR-112)",
        probableCause: "रीजेंट बॉटल बहुत तेजी से हिलाई गई या बॉटल में लिक्विड न्यूनतम स्तर से कम है।",
        correctiveAction: "बॉटल को 10 मिनट स्थिर रखें। ड्रॉपर से सतह के बुलबुले फोड़ें। रीजेंट कम हो तो नया लगाएं।",
        nablRequirement: "सुनिश्चित करें कि नया रीजेंट उसी कैलिब्रेटेड लॉट नंबर का हो।"
      },
      {
        alarm: "LIS CONNECTION DISCONNECTED (नेटवर्क एरर)",
        probableCause: "लैन केबल ढीली होना, आईपी एड्रेस बदल जाना या LIS सर्वर का सॉफ्टवेयर बंद होना।",
        correctiveAction: "एनालाइज़र से LIS की आईपी पिंग करें। RJ45 केबल देखें। LIS पोर्ट 5100 / 6000 रीस्टार्ट करें।",
        nablRequirement: "मशीन की आंतरिक मेमोरी में रिजल्ट स्टोर रहने दें, कनेक्शन आते ही अपलोड करें।"
      },
      {
        alarm: "तापमान 37.2°C से अधिक (ERR-501)",
        probableCause: "इनक्यूबेटर वाटर सर्कुलेशन पंप बंद होना या लैब का एसी खराब होना।",
        correctiveAction: "सर्कुलेशन वाटर चेक करें। लैब का एसी 22°C पर सेट करें। मशीन के पीछे के पंखे का फिल्टर साफ करें।",
        nablRequirement: "जब तक तापमान 37.0°C (±0.1°C) न हो जाए, एंजाइम टेस्ट (SGOT, SGPT) रोक कर रखें।"
      }
    ],
    glossary: [
      {
        term: "ASTM E1381 / E1394",
        definition: "लैब मशीनों और कंप्यूटर एलआईएस (LIS) के बीच टेस्ट डेटा भेजने का अंतरराष्ट्रीय मानक प्रोटोकॉल।",
        practicalTip: "इसमें हेडर (H), पेशेंट (P), ऑर्डर (O), रिजल्ट (R) और टर्मिनेटर (L) रिकॉर्ड होते हैं।"
      },
      {
        term: "HL7 v2.5",
        definition: "अस्पताल सूचना प्रणाली और आधुनिक मशीनों के बीच लैन नेटवर्क पर डेटा ट्रांसफर का मानक।",
        practicalTip: "यह TCP/IP नेटवर्क पोर्ट पर MLLP प्रोटोकॉल के साथ सीधे तेज गति से काम करता है।"
      },
      {
        term: "वेस्टगार्ड नियम (Westgard Rules)",
        definition: "क्वालिटी कंट्रोल (QC) पास या फेल तय करने के सांख्यिकीय नियम।",
        practicalTip: "1-2s चेतावनी है; 1-3s और 2-2s आने पर मशीन में काम करना तुरंत बंद करना अनिवार्य है।"
      },
      {
        term: "लेवे-जेनिंग्स चार्ट (Levey-Jennings)",
        definition: "रोजाना के QC रिजल्ट का ग्राफ जो मीन (Mean) और स्टैंडर्ड डिविएशन (±1SD, ±2SD, ±3SD) दिखाता है।",
        practicalTip: "इससे पता चलता है कि मशीन में कोई रीजेंट धीरे-धीरे खराब तो नहीं हो रहा (Trend or Shift)।"
      },
      {
        term: "HIL इंडेक्स (Hemolysis, Icterus, Lipemia)",
        definition: "सीरम में हीमोग्लोबिन, पीलिया और फैट की मात्रा की फोटोमेट्रिक जांच।",
        practicalTip: "अधिक हीमोलिसिस होने पर पोटेशियम और LDH गलत बढ़ जाते हैं।"
      },
      {
        term: "डेल्टा चेक (Delta Check)",
        definition: "मरीज के आज के रिजल्ट की तुलना उसी मरीज के 48 घंटे पहले के रिजल्ट से करने वाला सुरक्षा नियम।",
        practicalTip: "यदि रिजल्ट में अचानक 30-50% का बदलाव हो तो यह सैंपल बदलने या अचानक बीमारी का संकेत है।"
      },
      {
        term: "क्रिटिकल पैनिक वैल्यू (Critical Panic)",
        definition: "ऐसा जीवन-घातक रिजल्ट जिस पर मरीज की जान बचाने के लिए तुरंत डॉक्टर को सूचित करना अनिवार्य है।",
        practicalTip: "पैनिक रिजल्ट आने पर 15 मिनट में डॉक्टर को फोन करके रिपोर्ट दर्ज करना NABL नियम 5.8 है।"
      },
      {
        term: "STAT इमरजेंसी लेन",
        definition: "आईसीयू और इमरजेंसी मरीजों के लिए विशेष पाइपलाइन जो सामान्य रूटीन सैंपल रोककर पहले चलती है।",
        practicalTip: "ट्रोपोनिन और पोटेशियम को 15 मिनट से कम समय में रिपोर्ट करने के लिए उपयोग किया जाता है।"
      }
    ]
  },
  hinglish: {
    name: "Hinglish (प्रैक्टिकल लैब बोलचाल)",
    flag: "🇮🇳",
    title: "Clinical Lab Analyzer Step-by-Step Practical Operating Guide (SOP)",
    subtitle: "Real-world hospital pathology lab manual: Machine start se lekar QC, LIS sync, specimen run aur shutdown tak end-to-end practical flow.",
    overviewHeading: "Standard Lab Operating Workflow",
    workflowHeading: "Step-by-Step Practical Lab Walkthrough (Start to End)",
    stepsLabel: "Phases",
    interactiveSimHeading: "Live Hands-On Lab Simulator (Try Actions Live)",
    troubleshootingHeading: "Emergency Troubleshooting & Quick Fix Matrix",
    glossaryHeading: "Clinical & Interface Terms Glossary",
    printSOP: "Print / Export Official SOP",
    copyProtocol: "Copy Phase SOP",
    copied: "Phase SOP copied to clipboard!",
    filterDepartment: "Section Filter",
    allDepartments: "All Lab Sections",
    emergencySTATNote: "Emergency STAT sample routine batch ko immediately interrupt karke 15 minute ke andar result deta hai.",
    steps: [
      {
        phaseNumber: 1,
        badge: "PHASE 01: HARDWARE INITIALIZATION",
        title: "Morning Startup & Hardware Physical Checks",
        summary: "Patient sample lagane se pehle UPS voltage, air compressor pressure, fluidic priming aur 37°C incubation check karo.",
        objective: "Machine ke mechanical, optical aur thermal sensors ko 37.0°C ± 0.1°C par stable karna taaki result me analytical drift na aaye.",
        clinicalRationale: "Cold machine me enzymatic reactions slow ho jaati hain. Cold start se SGOT, SGPT, LDH aur CK-MB dangerously false low aayenge.",
        checklist: [
          "UPS voltage verify karo: 220V - 240V steady hona chahiye.",
          "Pneumatic air pressure gauge dekho: 0.45 se 0.65 MPa (4.5 to 6.5 bar).",
          "Biohazard waste bottle empty karo aur 10% bleach disinfectant add karo.",
          "De-proteinizer wash solution bottle ka level > 80% check karo.",
          "Photometer lamp ya laser diode ko 25-30 minute pre-heat hone do."
        ],
        protocolSteps: [
          {
            step: "Rear Breaker & Front Power ON",
            detail: "Pehle back panel ka main breaker on karo, fir front power switch. Self-test (POST) screen par green pass hone do."
          },
          {
            step: "Hydraulic Fluidic Priming",
            detail: "Maintenance me jakar 'Hydraulic Prime' chalao. Syringe pump DI water se probe flush karega taaki syringe barrel me air bubble na rahe.",
            warning: "Syringe me micro-bubble rehne se 5-15% pipetting error aa jayega."
          },
          {
            step: "Temperature 37°C Lock Verification",
            detail: "Screen par reaction carousel bath 37.0°C (±0.1°C) aur reagent chiller 2°C - 8°C green dikhna chahiye."
          }
        ],
        technicalSpecs: [
          { label: "Bath Temperature", value: "37.0°C ± 0.1°C" },
          { label: "Air Compressor Pressure", value: "0.55 MPa (5.5 bar)" },
          { label: "Reagent Chiller", value: "2.0°C - 8.0°C" },
          { label: "Warm-up Time", value: "25 - 30 minutes" }
        ],
        troubleshootingTip: "Agar pressure build nahi ho raha, waste bottle ka cap check karo. Loose cap se vacuum leak hota hai."
      },
      {
        phaseNumber: 2,
        badge: "PHASE 02: REAGENTS & CONSUMABLES",
        title: "Reagent Pack Loading, Barcode Registration & Dead Volume",
        summary: "Reagent packs load karo, 2D barcode scan karo, open-vial expiry check karo aur optical cuvettes fill karo.",
        objective: "Run ke beech me reagent khatam hone ya expired pack se wrong report aane ko completely eliminate karna.",
        clinicalRationale: "Onboard open-vial stability khatam hone ke baad substrate degrade ho jata hai, jisse Troponin aur Enzymes false negative ho sakte hain.",
        checklist: [
          "Pack load karne se pehle reagent chiller temperature (2°C - 8°C) verify karo.",
          "2D DataMatrix barcode scan karke Lot No aur expiry LIS me log karo.",
          "Ensure karo ki cassette liquid surface par koi bubble ya foam na ho.",
          "Remaining tests count check karo: agar < 15 tests bache hain to fresh pack lagao.",
          "Cuvette magazine me fresh disposable optical cuvettes load karo."
        ],
        protocolSteps: [
          {
            step: "Cassette Alignment & RFID Lock",
            detail: "Carousel door open karke pack ko number slot me push karo jab tak tactile click sound na aaye."
          },
          {
            step: "Automated Inventory Scan",
            detail: "'Inventory Scan' trigger karo. Optical scanner pack ka lot, expiry aur test count automatic read karega."
          },
          {
            step: "Dead Volume Meniscus Check",
            detail: "Reagent level bottle ke minimum dead volume (1.5ml) se upar hona chahiye taaki probe air aspirate na kare."
          }
        ],
        technicalSpecs: [
          { label: "Minimum Dead Volume", value: "1.5 mL se 2.0 mL" },
          { label: "Onboard Stability", value: "28 se 60 days (chiller me)" },
          { label: "Barcode Type", value: "2D DataMatrix / PDF417" },
          { label: "Cuvette Path Length", value: "10 mm optical precision" }
        ],
        troubleshootingTip: "Agar reagent par foam dikhe, bottle ko gently 5 baar invert karo. Kabhi bhi zor se shake mat karo."
      },
      {
        phaseNumber: 3,
        badge: "PHASE 03: DAILY QC & WESTGARD RULES",
        title: "Daily Multi-Level QC & Westgard Clearance Gate",
        summary: "Daily 3 levels (Normal, Low, High) controls run karo, Levey-Jennings chart dekho aur Westgard pass hone par machine unlock karo.",
        objective: "Patient ka ek bhi sample lagane se pehle machine ki accuracy aur precision mathematically prove karna (NABL mandatory).",
        clinicalRationale: "Dirty cuvette ya dirty probe se pure batch ka Glucose, Bilirubin ya Creatinine ek taraf shift ho jayega.",
        checklist: [
          "Calibrated micropipette se Type-1 reagent grade DI water se control vials reconstitute karo.",
          "Room temperature par dark me 30 minute rest hone do; gently swirl karo.",
          "Level 1 (Normal), Level 2 (Low), Level 3 (High) ko QC rack me lagao.",
          "Levey-Jennings chart me dekho: sabhi parameters ±2 SD boundary ke andar hone chahiye.",
          "Check karo koi Westgard failure flag (1-3s, 2-2s, R-4s, 4-1s, 10-x) to nahi aaya."
        ],
        protocolSteps: [
          {
            step: "Daily QC Worklist Run",
            detail: "'Run Daily QC' select karo. Control cups C1, C2, C3 me place karo aur start press karo."
          },
          {
            step: "Levey-Jennings & Rule Check",
            detail: "1-2s warning monitor karo. Agar 1-3s ya 2-2s rule trigger hota hai, system machine ko auto-lock kar dega.",
            warning: "1-3s ya 2-2s violation par bina corrective action aur fresh control run kiye patient sample lagana strict NABL violation hai."
          },
          {
            step: "Quality Electronic Sign-off",
            detail: "QC pass hone par software me digital sign-off karo. Status 'QC PASSED - RUN READY' ho jayega."
          }
        ],
        technicalSpecs: [
          { label: "Acceptable CV%", value: "< 2.5% routine chemistry" },
          { label: "1-3s Westgard Action", value: "RUN REJECTED - Immediate Lockout" },
          { label: "2-2s Westgard Action", value: "RUN REJECTED - Systematic Shift" },
          { label: "Control Matrix", value: "Lyophilized Human Serum Base" }
        ],
        troubleshootingTip: "Agar pura panel ek sath upar shift ho jaye, RO water purification system ka filter aur TDS check karo."
      },
      {
        phaseNumber: 4,
        badge: "PHASE 04: LIS INTERFACE & BIDIRECTIONAL SYNC",
        title: "LIS Connection Setup, ASTM & HL7 Bidirectional Worklist",
        summary: "Analyzer ko LIS software se connect karo, ASTM E1394 packets verify karo aur barcode scan par automatic worklist fetch karo.",
        objective: "Manual test typing ko khatam karna taaki sample mix-up aur wrong test entry 100% prevent ho sake.",
        clinicalRationale: "High volume labs me manual entry se 1-3% transcription error hota hai jisse patient ka galat test ho sakta hai.",
        checklist: [
          "Network socket check karo: TCP/IP Port 5100 (ASTM) ya 6000 (HL7) online ho.",
          "LIS Host service online ho aur 30 second me heartbeat send kar rahi ho.",
          "Serial connection settings: 9600 Baud Rate, 8 Data Bits, None Parity, 1 Stop Bit.",
          "Delimiters check karo: standard ASCII (| , \\ , ^ , &) correctly configured hon.",
          "Analyzer me 'Bidirectional Auto-Query' enable hona chahiye."
        ],
        protocolSteps: [
          {
            step: "Low-Level Handshake Negotiate",
            detail: "Analyzer [ENQ] send karega. LIS reply karega [ACK]. Session connect ho jayega."
          },
          {
            step: "Barcode Query Transmission",
            detail: "Tube barcode 'SAMP-9921' scan hote hi machine query karegi: 'Q|1|^SAMP-9921||ALL'. LIS required tests list return karega."
          },
          {
            step: "Auto-Worklist Queue",
            detail: "Machine tests (LFT, KFT, Lipid) ke basis par cuvette, reagent dispensing aur wavelength filter schedule karegi."
          }
        ],
        technicalSpecs: [
          { label: "Protocol Standard", value: "ASTM E1381 / E1394 & HL7 v2.5 MLLP" },
          { label: "Query Speed", value: "< 350 ms per tube query" },
          { label: "Framing Delimiters", value: "[STX] Frame [ETX] Checksum [CR][LF]" },
          { label: "Handshake Bytes", value: "ENQ (0x05), ACK (0x06), NAK (0x15)" }
        ],
        troubleshootingTip: "Agar machine bar-bar [NAK] bhej rahi hai, RJ45 LAN cable aur LIS packet checksum formula check karo."
      },
      {
        phaseNumber: 5,
        badge: "PHASE 05: SPECIMEN LOADING & STAT LANE",
        title: "Primary Tube Centrifugation, Rack Loading & Emergency STAT Lane",
        summary: "Centrifuged vacutainer tubes ko racks me lagao, liquid level sensor check karo aur urgent ICU/ER samples ko STAT lane me bhejo.",
        objective: "Sample me fibrin clot se probe jam hone se rokna aur 15 minute ke andar emergency report nikalna.",
        clinicalRationale: "Fibrin clot probe jam kar deta hai jisse baad ke saare patients ke results distort ho jaate hain. STAT Troponin < 15 min me mandatory hai.",
        checklist: [
          "Centrifugation check karo: 1500g for 10 minutes at 20-25°C with clean gel separation.",
          "Tube barcodes rack ki optical window slit ke samne outwards face karne chahiye.",
          "Tube color code: Lavender EDTA (CBC), Gold Gel SST (Biochem/Immunology), Blue Citrate (Coagulation).",
          "Serum volume: Gel barrier ke upar minimum 500 µL clean serum hona chahiye.",
          "Hemolysis, Icterus ya Lipemia (HIL Index) physically inspect karo."
        ],
        protocolSteps: [
          {
            step: "Primary Rack Loading",
            detail: "5-tube ya 10-tube racks input lane me place karo. Automated belt rack ko barcode reader ke paas feed karegi."
          },
          {
            step: "Emergency STAT Port Override",
            detail: "Emergency/ICU tube ko dedicated red STAT port me daalo. Machine routine queue pause karke pehle STAT run karegi."
          },
          {
            step: "Liquid Level & Clot Sensing (LLCD)",
            detail: "Probe capacitive sensing se meniscus detect karke sirf 2mm dip karegi taaki bubble ya clot aspirate na ho."
          }
        ],
        technicalSpecs: [
          { label: "Centrifuge Speed", value: "1500g - 2000g (10 minutes)" },
          { label: "Minimum Serum Volume", value: "150 µL dead volume above gel" },
          { label: "Aspiration Volume", value: "2.0 µL to 25.0 µL" },
          { label: "STAT Guaranteed TAT", value: "< 15 minutes reporting" }
        ],
        troubleshootingTip: "Agar 'Clot Detected' alarm aaye, tube bahar nikalo, applicator stick se fibrin remove karo aur 2000g par 5 minute re-centrifuge karo."
      },
      {
        phaseNumber: 6,
        badge: "PHASE 06: OPTICAL MEASUREMENT & KINETICS",
        title: "Micro-Pipetting, Incubation Kinetics & Multi-Wavelength Photometry",
        summary: "Micro-volumes me serum aur R1/R2 mix karo, 37°C incubation maintain karo aur 12 wavelengths par absorbance curves capture karo.",
        objective: "Sub-microliter pipetting precision aur photometric linearity ensure karna.",
        clinicalRationale: "Enzyme tests (SGOT/SGPT/Amylase) delta-absorbance (ΔA/min) slope se calculate hote hain. Probe carryover se false elevation aayegi.",
        checklist: [
          "Probe exterior wash pressure (0.2 MPa) check karo (carryover < 0.01% hona chahiye).",
          "Stirring paddle 1200 RPM par perfectly mix kare bina bubble banaye.",
          "Halogen lamp / laser diode baseline intensity 12 wavelengths (340nm - 800nm) par verify karo.",
          "Reaction bath ka DI water crystal clear hona chahiye.",
          "ISE electrode slope Na+, K+, Cl- ke liye calibrated hona chahiye."
        ],
        protocolSteps: [
          {
            step: "Sample & Reagent Dispensing",
            detail: "Probe 3.0 µL serum aspirate karke 150 µL R1 reagent me 37°C par cuvette me dispense karegi."
          },
          {
            step: "Absorbance Kinetic Slope",
            detail: "Photometer 10 minute me 340nm aur 405nm par 24 readings lekar real-time reaction slope plot karega."
          },
          {
            step: "Substrate Exhaustion Auto-Dilute",
            detail: "Agar glucose > 700 mg/dL ho jaye, to analyzer automatically 1:5 dilute karke re-run karega."
          }
        ],
        technicalSpecs: [
          { label: "Photometric Range", value: "0.0000 to 3.0000 Abs (10mm)" },
          { label: "Wavelength Array", value: "340, 380, 405, 450, 505, 546, 600, 700, 800 nm" },
          { label: "ISE Electrode Slope", value: "Na+: 54-62 mV, K+: 52-60 mV, Cl-: 48-58 mV" },
          { label: "Carryover Limit", value: "< 0.01% with active sodium hypochlorite wash" }
        ],
        troubleshootingTip: "Agar kinetic curve curved ya irregular aaye, substrate exhaust ho chuka hai. Auto-dilution run check karo."
      },
      {
        phaseNumber: 7,
        badge: "PHASE 07: AUTO-VALIDATION & CRITICAL PANIC ESCALATION",
        title: "Result Auto-Validation, Delta Check & Critical Panic Read-Back",
        summary: "Reference ranges apply karo, patient ke 48hr historical delta check karo, HIL index verify karo aur panic value par doctor ko call karo.",
        objective: "Verified results LIS me instantly release karna aur critical panic values ko 5 minute me doctor tak pahunchana.",
        clinicalRationale: "Achanak 50% creatinine badhna acute renal failure dikhata hai. Potassium 6.8 cardiac arrest cause kar sakta hai.",
        checklist: [
          "Age aur gender specific biological reference intervals apply karo.",
          "Delta check rule run karo: pichle 48 hours se > 30% jump par report flag karo.",
          "HIL Index inspect karo: Hemolysis (H>50), Icterus (I>10), ya Lipemia (L>100) interferent to nahi.",
          "Critical Panic thresholds track karo (Glucose < 45 mg/dL, K+ > 6.2 mmol/L, Platelets < 20,000).",
          "NABL clause 5.8 ke under doctor ko phone karke verbal read-back aur timestamp log karo."
        ],
        protocolSteps: [
          {
            step: "Rule-Based Auto-Validation Engine",
            detail: "Bina flag wale normal results 30 second me automatically LIS me release ho jaate hain."
          },
          {
            step: "Critical Panic Audio & Visual Alarm",
            detail: "Panic limit cross hote hi workbench par red warning screen aur audio beep trigger hoti hai."
          },
          {
            step: "Doctor Call & Verbal Read-Back",
            detail: "Technologist ICU/Ward doctor ko call karke result read-back karwayega aur doctor ka name log me save karega."
          }
        ],
        technicalSpecs: [
          { label: "Potassium Panic Limit", value: "< 2.8 or > 6.2 mmol/L" },
          { label: "Glucose Panic Limit", value: "< 45 or > 450 mg/dL" },
          { label: "Platelets Panic Limit", value: "< 20,000 / µL" },
          { label: "Read-back Documentation", value: "Mandatory NABL / ISO 15189 Clause 5.8" }
        ],
        troubleshootingTip: "Agar patient ka Potassium > 6.5 aaye but Urea/Creatinine bilkul normal ho, verify karo blood EDTA tube se plain tube me to nahi transfer hua (pseudo-hyperkalemia)."
      },
      {
        phaseNumber: 8,
        badge: "PHASE 08: DECONTAMINATION & AUDIT LOGS",
        title: "End-of-Day Decontamination, Probe Bleach Wash & NABL Audit Sign-off",
        summary: "5% sodium hypochlorite wash cycle chalao, needle se protein encrustation clean karo, waste neutralize karo aur digital logbook sign karo.",
        objective: "Needle me bacterial biofilm aur protein jamne se rokna aur machine ko hamesha NABL audit ready rakhna.",
        clinicalRationale: "Daily cleaning na karne se needle me protein jam jata hai, jisse 3 din me aspiration volume 8% distort ho jata hai.",
        checklist: [
          "5% sodium hypochlorite (NaOCl) aur 0.1M NaOH wash solution designated slot me place karo.",
          "Machine ka automated 'End-of-Day Shutdown Maintenance' schedule run karo.",
          "Biohazard liquid waste container me 10% bleach add karke safely neutralize karo.",
          "Sample aur reagent needle shafts ko lint-free alcohol swab se gently wipe karo.",
          "Daily maintenance compliance logbook me operator ID aur timestamp sign karo."
        ],
        protocolSteps: [
          {
            step: "Chemical De-proteinization Wash",
            detail: "Analyzer 15 minute tak high pressure hypochlorite wash chala kar needle aur cuvettes clean karega."
          },
          {
            step: "DI Water Flush Cycle",
            detail: "200ml deionized water se saare fluidic lines flush honge taaki bleach crystals deposit na hon."
          },
          {
            step: "Logbook Archival & Encrypted Backup",
            detail: "Daily QC charts, error logs aur operator signatures encrypted compliance cloud vault me backup ho jayenge."
          }
        ],
        technicalSpecs: [
          { label: "Cleaning Agent", value: "5% Sodium Hypochlorite (NaOCl) & Acid Wash" },
          { label: "Cycle Duration", value: "15 - 20 minutes automated" },
          { label: "Audit Standard", value: "ISO 15189:2022 & 21 CFR Part 11" },
          { label: "Record Retention", value: "Minimum 5 Years NABL requirement" }
        ],
        troubleshootingTip: "Probe tip clean karne ke liye metal wire kabhi use mat karo, isse needle ki internal Teflon coating scratch ho jaati hai."
      }
    ],
    emergencyMatrix: [
      {
        alarm: "CLOT / PROBE OBSTRUCTION (ERR-304)",
        probableCause: "Sample properly centrifuge nahi hua tha, fibrin clot probe tip me aspirate ho gaya.",
        correctiveAction: "'Probe Backflush' run karo. Agar block open na ho to needle remove karke 0.1M NaOH me 10 min dip karo.",
        nablRequirement: "Sample rejection register me note karo aur re-centrifuged (2000g for 10 min) sample run karo."
      },
      {
        alarm: "WESTGARD 1-3s VIOLATION (QC LOCKOUT)",
        probableCause: "Deteriorating control, pipetting error, expired open pack stability ya photometer window par dust.",
        correctiveAction: "Patient run strictly STOP karo. Fresh control vial reconstitute karke re-run karo. Fail ho to full 2-point calibration karo.",
        nablRequirement: "Non-conformance report (NCR) fill karo root cause aur corrective action ke sath."
      },
      {
        alarm: "REAGENT BUBBLE / DEAD VOLUME (ERR-112)",
        probableCause: "Reagent bottle vigorous shake hui ya level minimum dead volume (1.5ml) se niche chala gaya.",
        correctiveAction: "Bottle ko 10 min settle hone do. Clean dropper se bubble burst karo. < 1.5ml ho to fresh pack lagao.",
        nablRequirement: "Verify karo naya pack usi calibrated lot ka hai."
      },
      {
        alarm: "LIS HOST CONNECTION TIMEOUT",
        probableCause: "LAN cable loose, IP address clash ya LIS driver service terminate ho gayi.",
        correctiveAction: "Analyzer terminal se LIS IP ping karo. RJ45 patch cable check karo. LIS port 5100/6000 restart karo.",
        nablRequirement: "Local buffer memory me run continue karo; network reconnect hote hi auto-sync hoga."
      },
      {
        alarm: "BATH TEMP DRIFT > 37.2°C (ERR-501)",
        probableCause: "Water circulation pump issue ya laboratory AC temperature badh gaya.",
        correctiveAction: "Bath water level check karo. Room AC 22°C par set karo. Rear radiator fan clean karo.",
        nablRequirement: "Jab tak temperature 37.0°C (±0.1°C) par stabilise na ho, enzyme assays (SGOT/SGPT) strictly pause rakho."
      }
    ],
    glossary: [
      {
        term: "ASTM E1381 / E1394",
        definition: "Laboratory analyzers aur LIS server ke beech clinical test data transfer ka standard serial/network protocol.",
        practicalTip: "Header (H), Patient (P), Order (O), Result (R) frames me data packets bhejta hai."
      },
      {
        term: "HL7 v2.5",
        definition: "Hospital electronic health records aur high-throughput analyzers ke beech MLLP TCP/IP communication standard.",
        practicalTip: "Modern labs me bidirectional automated test orders aur results realtime me sync karta hai."
      },
      {
        term: "Westgard Multi-Rules",
        definition: "Statistical decision rules jisse decide hota hai ki daily analytical batch in-control hai ya reject karna hai.",
        practicalTip: "1-2s warning sign hai; 1-3s aur 2-2s trigger hone par machine me patient sample run karna mana hai."
      },
      {
        term: "Levey-Jennings Chart",
        definition: "Daily QC data plot karne wala graph jo mean aur ±1SD, ±2SD, ±3SD control limits dikhata hai.",
        practicalTip: "Visual inspection se systematic shifts ya gradual reagent drift aasani se pakad me aata hai."
      },
      {
        term: "HIL Index (Hemolysis, Icterus, Lipemia)",
        definition: "Serum me free hemoglobin, bilirubin aur lipids ka spectrophotometric interference level.",
        practicalTip: "Hemolysis hone par Potassium aur LDH artificially high report ho jaate hain."
      },
      {
        term: "Delta Check",
        definition: "Patient ke current test result ko usi patient ke 48 hours pehle ke result se compare karne wala safety rule.",
        practicalTip: "Sample mix-up (wrong blood in tube) aur critical acute changes ko instant detect karta hai."
      },
      {
        term: "Critical Panic Value",
        definition: "Aise extreme abnormal results jo patient ki jaan ke liye immediate threat hote hain.",
        practicalTip: "NABL rule 5.8 ke according 15 minute ke andar doctor ko phone karke read-back confirm karna mandatory hai."
      },
      {
        term: "STAT Emergency Lane",
        definition: "Emergency aur ICU patients ke liye fast-track lane jo routine batches ko bypass karke pehle chalti hai.",
        practicalTip: "Troponin aur Potassium jaise critical tests < 15 minute reporting time provide karte hain."
      }
    ]
  },
  es: {
    name: "Español",
    flag: "🇪🇸",
    title: "Manual Operativo de Analizadores Automatizados y POE Clínico",
    subtitle: "Procedimiento Operativo Estándar conforme a la norma ISO 15189:2022, guías CLSI y estándares de acreditación clínica.",
    overviewHeading: "Arquitectura Estándar de Operación",
    workflowHeading: "Flujo Clínico Paso a Paso (Inicio a Fin)",
    stepsLabel: "Fases",
    interactiveSimHeading: "Simulador de Laboratorio en Tiempo Real",
    troubleshootingHeading: "Matriz de Solución de Problemas y Desviaciones",
    glossaryHeading: "Glosario de Términos Clínicos y de Interfaz",
    printSOP: "Imprimir / Exportar POE Oficial",
    copyProtocol: "Copiar POE de la Fase",
    copied: "¡POE copiado al portapapeles!",
    filterDepartment: "Filtrar por Sección",
    allDepartments: "Todas las Disciplinas Diagnósticas",
    emergencySTATNote: "Las muestras de emergencia STAT interrumpen inmediatamente las tandas rutinarias con TAT < 15 min.",
    steps: [
      {
        phaseNumber: 1,
        badge: "FASE 01: INICIALIZACIÓN DE HARDWARE",
        title: "Comprobaciones Preanalíticas y Encendido de Equipos",
        summary: "Verifique el suministro de energía ininterrumpida, compresores neumáticos, circuitos hidráulicos y cámaras de incubación térmica (37°C ± 0.1°C).",
        objective: "Garantizar que los sistemas mecánicos, ópticos y térmicos se estabilicen en tolerancias fisiológicas antes de procesar muestras.",
        clinicalRationale: "Las reacciones enzimáticas requieren temperatura exacta. Iniciar el equipo frío genera un sesgo negativo severo en transaminasas y enzimas cardíacas.",
        checklist: [
          "Verificar voltaje del SAI/UPS en 220V - 240V ± 2%.",
          "Manómetro de presión neumática entre 0.45 y 0.65 MPa (4.5 a 6.5 bar).",
          "Contenedor de residuos biopeligrosos vacío y neutralizado.",
          "Solución de lavado y desproteinización con nivel superior al 80%.",
          "Permitir calentamiento de lámpara o láser durante 25 a 30 minutos."
        ],
        protocolSteps: [
          {
            step: "Encendido Principal y Secundario",
            detail: "Active el disyuntor posterior seguido del interruptor frontal. Espere a que finalice el autodiagnóstico POST."
          },
          {
            step: "Cebado Hidráulico y Purga de Aire",
            detail: "Ejecute 'Hydraulic Prime' para expulsar microburbujas de las jeringas con agua desionizada.",
            warning: "Las microburbujas en las jeringas provocan errores de pipeteo del 5% al 15%."
          },
          {
            step: "Estabilización Térmica a 37.0°C",
            detail: "El carrusel de reacción debe estabilizarse en 37.0°C (± 0.1°C) y la cámara refrigerada en 2°C - 8°C."
          }
        ],
        technicalSpecs: [
          { label: "Temperatura de Reacción", value: "37.0°C ± 0.1°C" },
          { label: "Presión Neumática", value: "0.55 MPa (5.5 bar)" },
          { label: "Refrigeración de Reactivos", value: "2.0°C - 8.0°C" },
          { label: "Tiempo de Precalentamiento", value: "25 - 30 minutos" }
        ],
        troubleshootingTip: "Si la presión hidráulica no sube, verifique que la tapa del bidón de residuos esté firmemente cerrada."
      },
      {
        phaseNumber: 2,
        badge: "FASE 02: GESTIÓN DE REACTIVOS",
        title: "Carga de Reactivos, Registro de Código de Barras y Volumen Muerto",
        summary: "Cargue casetes, escanee códigos 2D/RFID, verifique estabilidad en equipo y supervise el inventario de cubetas ópticas.",
        objective: "Evitar interrupciones analíticas por reactivos agotados o deterioro de estabilidad a bordo.",
        clinicalRationale: "Utilizar reactivos vencidos genera degradación de sustrato y falsos negativos en troponina o electrolitos.",
        checklist: [
          "Confirmar refrigeración entre 2°C y 8°C antes de cargar casetes.",
          "Escanear código DataMatrix 2D para registrar lote y caducidad.",
          "Verificar ausencia de espuma en la superficie del líquido.",
          "Reemplazar cartuchos con menos de 15 determinaciones antes de lotes grandes.",
          "Rellenar cargador de cubetas desechables de precisión."
        ],
        protocolSteps: [
          {
            step: "Colocación de Casete y Bloqueo RFID",
            detail: "Inserte el casete en la ranura numerada hasta escuchar el clic de encaje."
          },
          {
            step: "Lectura de Inventario Automatizada",
            detail: "Active 'Scan Reagents' para registrar automáticamente número de pruebas y validez."
          },
          {
            step: "Comprobación de Menisco de Volumen Muerto",
            detail: "Asegure al menos 1.5 mL sobre el fondo para evitar aspiración de aire."
          }
        ],
        technicalSpecs: [
          { label: "Volumen Muerto Mínimo", value: "1.5 mL a 2.0 mL" },
          { label: "Estabilidad a Bordo", value: "28 a 60 días" },
          { label: "Formato de Código", value: "2D DataMatrix / PDF417" },
          { label: "Paso Óptico de Cubeta", value: "10 mm precisión de cuarzo" }
        ],
        troubleshootingTip: "Si detecta espuma, invierta el cartucho suavemente 5 veces. Nunca lo agite enérgicamente."
      },
      {
        phaseNumber: 3,
        badge: "FASE 03: CONTROL DE CALIDAD Y WESTGARD",
        title: "Control de Calidad Diario Multinivel y Reglas de Westgard",
        summary: "Procese 3 niveles de suero control (Normal, Bajo, Alto), grafique en Levey-Jennings y valide reglas de Westgard.",
        objective: "Validar precisión y veracidad analítica antes de procesar muestras de pacientes (Exigencia ISO 15189).",
        clinicalRationale: "Una desviación no detectada provocará errores sistemáticos en glucosa, bilirrubina y enzimas de todos los pacientes.",
        checklist: [
          "Reconstituir viales con agua reactivo Tipo 1 (CLRW) con micropipeta calibrada.",
          "Homogeneizar e incubar 30 minutos a temperatura ambiente protegido de la luz.",
          "Cargar Nivel 1 (Normal), Nivel 2 (Bajo) y Nivel 3 (Alto) en el gradilla de control.",
          "Verificar que todos los parámetros se ubiquen dentro de ±2 Desviaciones Estándar (DE).",
          "Inspeccionar violaciones de Westgard (1-3s, 2-2s, R-4s, 4-1s, 10-x)."
        ],
        protocolSteps: [
          {
            step: "Ejecución de Serie de Control Diario",
            detail: "Seleccione 'Run QC Routine' y posicione los controles en C1, C2, C3 del rotor."
          },
          {
            step: "Evaluación Levey-Jennings y Reglas de Westgard",
            detail: "1-2s indica advertencia; si se infringe 1-3s o 2-2s el sistema aplica bloqueo analítico automático.",
            warning: "Nunca desbloquee manualmente un fallo 1-3s sin causa raíz justificada y nuevo control conforme."
          },
          {
            step: "Firma Electrónica de Aprobación",
            detail: "El responsable de calidad autoriza la serie en el SIL, pasando el equipo a 'QC PASSED - RUN READY'."
          }
        ],
        technicalSpecs: [
          { label: "CV% Aceptable", value: "< 2.5% bioquímica rutinaria" },
          { label: "Acción Westgard 1-3s", value: "RECHAZO DE SERIE - Bloqueo Inmediato" },
          { label: "Acción Westgard 2-2s", value: "RECHAZO DE SERIE - Error Sistemático" },
          { label: "Matriz Control", value: "Suero Humano Liofilizado" }
        ],
        troubleshootingTip: "Si todo un panel se desplaza en una sola dirección, compruebe el cambio de lote de reactivo o el agua purificada."
      },
      {
        phaseNumber: 4,
        badge: "FASE 04: INTERFAZ SIL Y COMUNICACIÓN ASTM/HL7",
        title: "Conexión con el Sistema de Información (SIL) y Consulta Bidireccional",
        summary: "Establezca enlace de red RS-232 / TCP-IP, procese tramas ASTM E1394 y sincronice peticiones analíticas.",
        objective: "Eliminar errores de trascripción manual garantizando que cada código de barras cargue sus pruebas correspondientes.",
        clinicalRationale: "La introducción manual en altos volúmenes produce un 1-3% de errores de trascripción clínica.",
        checklist: [
          "Verificar socket activo en puerto TCP 5100 (ASTM) o 6000 (HL7).",
          "Comprobar latencia de sondeo (polling) del SIL cada 30 segundos.",
          "Configuración serie: 9600 bps, 8 bits de datos, sin paridad, 1 bit de parada.",
          "Validar delimitadores estándar ASCII (| , \\ , ^ , &).",
          "Habilitar modo de auto-consulta bidireccional (Auto-Query)."
        ],
        protocolSteps: [
          {
            step: "Negociación de Handshake a Bajo Nivel",
            detail: "El analizador emite [ENQ]. El host SIL responde [ACK], iniciando la sesión."
          },
          {
            step: "Transmisión de Consulta Bidireccional",
            detail: "Al leer la muestra 'SAMP-9921', envía trama 'Q|1|^SAMP-9921||ALL'. El SIL devuelve las pruebas solicitadas."
          },
          {
            step: "Programación en Cola de Trabajo",
            detail: "El analizador asigna cubeta, filtros ópticos y tiempos de incubación requeridos."
          }
        ],
        technicalSpecs: [
          { label: "Estándar de Protocolo", value: "ASTM E1381 / E1394 & HL7 v2.5 MLLP" },
          { label: "Tiempo de Respuesta", value: "< 350 ms por tubo" },
          { label: "Delimitadores de Trama", value: "[STX] Trama [ETX] Checksum [CR][LF]" },
          { label: "Bytes de Control", value: "ENQ (0x05), ACK (0x06), NAK (0x15)" }
        ],
        troubleshootingTip: "Si el equipo recibe repetidamente [NAK], compruebe el cálculo de la suma de comprobación (checksum)."
      },
      {
        phaseNumber: 5,
        badge: "FASE 05: CARGA DE MUESTRAS Y CARRIL STAT",
        title: "Centrifugación, Carga en Gradillas y Carril de Urgencias STAT",
        summary: "Cargue tubos primarios centrifugados, compruebe sensores de nivel de líquido y derive muestras urgentes al carril STAT.",
        objective: "Asegurar integridad de la muestra, evitar aspiración de coágulos y garantizar entrega STAT en menos de 15 minutos.",
        clinicalRationale: "Aspirar fibrina obstruye la aguja y daña muestras posteriores. La troponina urgente requiere informe en menos de 15 min.",
        checklist: [
          "Centrifugación a 1500g por 10 min a 20-25°C con gel barrera íntegro.",
          "Orientar códigos de barras hacia la ranura de lectura óptica.",
          "Código de color: Morado EDTA (Hematología), Oro Gel SST (Bioquímica), Azul Citrato (Coagulación).",
          "Volumen mínimo: 500 µL de suero limpio sobre el gel.",
          "Inspeccionar índice HIL (Hemólisis, Ictericia, Lipemia)."
        ],
        protocolSteps: [
          {
            step: "Alimentación de Gradillas",
            detail: "Deposite las gradillas en la cinta de entrada para lectura de código de barras."
          },
          {
            step: "Inserción en Puerto Prioritario STAT",
            detail: "Coloque las muestras de UCI en el puerto rojo STAT. El equipo suspende la tanda rutinaria y procesa la urgencia de inmediato."
          },
          {
            step: "Detección Capacitiva de Nivel y Coágulos",
            detail: "La aguja detecta la superficie del suero y penetra únicamente 2 mm para evitar burbujas."
          }
        ],
        technicalSpecs: [
          { label: "Centrifugación", value: "1500g - 2000g (10 minutos)" },
          { label: "Volumen Muerto de Suero", value: "150 µL sobre el gel" },
          { label: "Volumen de Aspiración", value: "2.0 µL a 25.0 µL" },
          { label: "Compromiso STAT TAT", value: "< 15 minutos garantizado" }
        ],
        troubleshootingTip: "Ante aviso de coágulo, retire el tubo, elimine fibrina con un aplicador y vuelva a centrifugar a 2000g por 5 min."
      },
      {
        phaseNumber: 6,
        badge: "FASE 06: CINÉTICA Y FOTOMETRÍA ÓPTICA",
        title: "Microdispensación, Incubación Cinética y Espectrofotometría Multilongitud",
        summary: "Dosifique micromuestras en cubetas a 37°C y registre curvas de absorbancia en múltiples longitudes de onda.",
        objective: "Garantizar linealidad fotométrica y precisión submicrolitro en ensayos cinéticos y de punto final.",
        clinicalRationale: "Los ensayos cinéticos (transaminasas) calculan actividad a partir de ΔA/min. La contaminación arrastrada altera gravemente los resultados.",
        checklist: [
          "Presión de lavado exterior de aguja a 0.2 MPa (contaminación por arrastre < 0.01%).",
          "Mezcla por agitación a 1200 RPM sin generar turbulencias o burbujas.",
          "Intensidad de lámpara/láser en 12 longitudes de onda (340nm a 800nm).",
          "Comprobación de electrodos ISE de electrolitos (Na, K, Cl).",
          "Limpieza del agua del baño de reacción fotométrico."
        ],
        protocolSteps: [
          {
            step: "Dispensación de Muestra y Reactivo",
            detail: "La sonda dosifica 3.0 µL de muestra en 150 µL de reactivo R1 mantenido a 37°C."
          },
          {
            step: "Monitorización de Absorbancia Cinética",
            detail: "Se capturan 24 lecturas de absorbancia en 10 minutos a 340nm y 405nm."
          },
          {
            step: "Agotamiento de Sustrato y Autodilución",
            detail: "Si la glucosa supera 700 mg/dL, el equipo ejecuta autodilución 1:5 y repite la prueba."
          }
        ],
        technicalSpecs: [
          { label: "Rango Fotométrico", value: "0.0000 a 3.0000 Abs (10mm)" },
          { label: "Arreglo de Longitudes de Onda", value: "340, 380, 405, 450, 505, 546, 600, 700, 800 nm" },
          { label: "Pendiente ISE", value: "Na+: 54-62 mV, K+: 52-60 mV, Cl-: 48-58 mV" },
          { label: "Arrastre Residual", value: "< 0.01% con aclarado activo" }
        ],
        troubleshootingTip: "Curvas cinéticas aplanadas indican consumo prematuro de sustrato. Requiere verificación de autodilución."
      },
      {
        phaseNumber: 7,
        badge: "FASE 07: AUTOVALIDACIÓN Y VALORES CRÍTICOS",
        title: "Autovalidación, Delta Check y Protocolo Telefónico de Valores de Pánico",
        summary: "Aplique intervalos biológicos, compare con antecedentes (Delta Check) y comunique inmediatamente resultados de pánico al médico.",
        objective: "Garantizar que los resultados críticos lleguen al médico tratante en menos de 5 minutos (Requisito ISO 15189).",
        clinicalRationale: "Un aumento agudo de creatinina indica fallo renal. Un potasio de 6.8 mmol/L puede provocar arritmias letales.",
        checklist: [
          "Aplicar intervalos de referencia específicos por edad y sexo.",
          "Evaluar Delta Check con histórico de 48 horas (> 30% de variación requiere retención).",
          "Analizar índice HIL (Hemólisis, Ictericia, Lipemia).",
          "Detectar valores de pánico (Glucosa < 45 mg/dL, K+ > 6.2 mmol/L, Plaquetas < 20.000).",
          "Registrar comunicación telefónica de confirmación con nombre de médico y hora."
        ],
        protocolSteps: [
          {
            step: "Motor de Autovalidación Clínica",
            detail: "Resultados sin anomalías se liberan al SIL de manera automática en 30 segundos."
          },
          {
            step: "Disparo de Alarma Crítica",
            detail: "Al superar límites de pánico, se activan alertas visuales y acústicas prioritarias."
          },
          {
            step: "Llamada de Confirmación (Read-Back)",
            detail: "El técnico comunica el valor al médico responsable y documenta la llamada en la pista de auditoría."
          }
        ],
        technicalSpecs: [
          { label: "Potasio Crítico de Pánico", value: "< 2.8 o > 6.2 mmol/L" },
          { label: "Glucosa Crítica de Pánico", value: "< 45 o > 450 mg/dL" },
          { label: "Plaquetas Críticas de Pánico", value: "< 20.000 / µL" },
          { label: "Auditoría de Lectura Telefónica", value: "Obligatorio ISO 15189 / NABL Cláusula 5.8" }
        ],
        troubleshootingTip: "Si el potasio supera 6.5 mmol/L con función renal normal, descarte contaminación del tubo con EDTA."
      },
      {
        phaseNumber: 8,
        badge: "FASE 08: DESCONTAMINACIÓN Y AUDITORÍA",
        title: "Descontaminación Final, Lavado con Hipoclorito y Registro de Auditoría",
        summary: "Ejecute ciclos de lavado con hipoclorito sódico, desproteinice agujas, neutralice residuos biopeligrosos y firme el registro diario.",
        objective: "Prevenir biopelículas, cristalización de agujas y mantener el laboratorio preparado para inspecciones de calidad.",
        clinicalRationale: "Omitir la limpieza diaria genera depósitos de proteína que distorsionan el volumen de pipeteo hasta un 8% en 3 días.",
        checklist: [
          "Colocar hipoclorito sódico al 5% y NaOH 0.1M en posiciones de lavado.",
          "Iniciar programa automatizado de 'Mantenimiento de Apagado Diario'.",
          "Desinfectar bidón de residuos con lejía al 10% antes del vertido controlado.",
          "Limpiar superficie exterior de agujas con torunda con alcohol.",
          "Firmar digitalmente el cuaderno de mantenimiento diario con ID de operador."
        ],
        protocolSteps: [
          {
            step: "Lavado Químico Desproteinizante",
            detail: "El analizador aspira hipoclorito a alta presión por sondas y cubetas durante 15 minutos."
          },
          {
            step: "Enjuague con Agua Desionizada",
            detail: "Se purgan 200 mL de agua desionizada por todos los conductos para eliminar restos cáusticos."
          },
          {
            step: "Archivo y Copia de Seguridad",
            detail: "Gráficos de control, registros de errores y firmas electrónicas se sincronizan en la nube cifrada de calidad."
          }
        ],
        technicalSpecs: [
          { label: "Agente Descontaminante", value: "Hipoclorito sódico al 5% y solución ácida" },
          { label: "Duración de Ciclo", value: "15 a 20 minutos" },
          { label: "Norma de Cumplimiento", value: "ISO 15189:2022 y 21 CFR Parte 11" },
          { label: "Retención de Registros", value: "Mínimo 5 años según acreditación" }
        ],
        troubleshootingTip: "Nunca introduzca alambres metálicos en las agujas; dañaría el recubrimiento interno de teflón hidrofílico."
      }
    ],
    emergencyMatrix: [
      {
        alarm: "OBSTRUCCIÓN POR COÁGULO (ERR-304)",
        probableCause: "Muestra mal centrifugada con presencia de microcoágulos de fibrina.",
        correctiveAction: "Ejecute 'Probe Backflush'. Si persiste, desmonte aguja, sumérjala en NaOH 0.1M y limpie por ultrasonidos.",
        nablRequirement: "Documentar incidencia de muestra rechazada y solicitar nueva centrifugación o extracción."
      },
      {
        alarm: "VIOLACIÓN WESTGARD 1-3s (BLOQUEO QC)",
        probableCause: "Error aleatorio, deterioro de suero control, caducidad de reactivo o suciedad en cubetas ópticas.",
        correctiveAction: "Detener tanda clínica. Reconstituir alícuota fresca de control. Si persiste, realizar calibración completa.",
        nablRequirement: "Completar informe de no conformidad antes de reanudar el análisis de pacientes."
      },
      {
        alarm: "BURBUJA O VOLUMEN MUERTO (ERR-112)",
        probableCause: "Nivel inferior al volumen muerto o espuma generada por agitación brusca.",
        correctiveAction: "Dejar reposar 10 min. Eliminar burbujas superficiales con pipeta estéril. Sustituir casete si queda < 1.5 mL.",
        nablRequirement: "Comprobar coincidencia del número de lote activo."
      },
      {
        alarm: "PÉRDIDA DE CONEXIÓN CON SIL",
        probableCause: "Desconexión de cable de red, conflicto de IP o bloqueo del servicio middleware del SIL.",
        correctiveAction: "Compruebe conectividad mediante 'ping'. Reinicie puerto de escucha 5100/6000 y transmita handshake ENQ.",
        nablRequirement: "Trabajar en memoria local intermedia y sincronizar tras reestablecer conexión."
      },
      {
        alarm: "DERIVA TÉRMICA > 37.2°C (ERR-501)",
        probableCause: "Fallo en bomba de circulación de incubación o fallo del aire acondicionado del laboratorio.",
        correctiveAction: "Verifique nivel de agua del baño. Ajuste climatización a 22°C. Limpie filtros de refrigeración posteriores.",
        nablRequirement: "Suspender ensayos enzimáticos hasta que la temperatura vuelva a 37.0°C ± 0.1°C."
      }
    ],
    glossary: [
      {
        term: "ASTM E1381 / E1394",
        definition: "Norma internacional de comunicación para la transferencia de datos entre equipos analíticos y sistemas informáticos de laboratorio.",
        practicalTip: "Estructurado en registros Header (H), Patient (P), Order (O), Result (R) y Terminator (L)."
      },
      {
        term: "HL7 v2.5",
        definition: "Protocolo de mensajería sanitaria para integración electrónica mediante sockets de red TCP/IP.",
        practicalTip: "Transmite segmentos como MSH (Cabecera), PID (Paciente), OBR (Petición) y OBX (Observación/Resultado)."
      },
      {
        term: "Reglas de Westgard",
        definition: "Criterios estadísticos para determinar si una serie analítica está bajo control o debe ser rechazada.",
        practicalTip: "1-2s es aviso de alerta; 1-3s y 2-2s obligan al rechazo inmediato de la serie."
      },
      {
        term: "Gráfica de Levey-Jennings",
        definition: "Diagrama de control de calidad que representa los valores diarios respecto a la media y los límites de desviación estándar (±1DE, ±2DE, ±3DE).",
        practicalTip: "Permite detectar tendencias graduales o desplazamientos bruscos en el comportamiento de los reactivos."
      },
      {
        term: "Índice HIL (Hemólisis, Ictericia, Lipemia)",
        definition: "Evaluación espectrofotométrica de interferencias debidas a hemoglobina libre, bilirrubina o triglicéridos.",
        practicalTip: "La hemólisis incrementa falsamente el potasio y la LDH sérica."
      },
      {
        term: "Delta Check",
        definition: "Algoritmo de seguridad que compara el resultado actual del paciente con su resultado previo en 48 horas.",
        practicalTip: "Detecta confusiones de tubos o cambios fisiológicos críticos agudos."
      },
      {
        term: "Valor Crítico de Pánico",
        definition: "Resultado analítico que denota una situación de riesgo vital inminente para el paciente.",
        practicalTip: "Obliga a comunicación telefónica inmediata al médico y registro formal conforme a la norma ISO 15189."
      },
      {
        term: "Carril de Urgencias STAT",
        definition: "Canal analítico de alta prioridad que interrumpe la tanda ordinaria para emitir resultados críticos en menos de 15 minutos.",
        practicalTip: "Diseñado para troponina, gases, potasio y dímero D procedentes de urgencias y UCI."
      }
    ]
  },
  fr: {
    name: "Français",
    flag: "🇫🇷",
    title: "Manuel d'Utilisation des Automates de Laboratoire & POS Clinique",
    subtitle: "Procédure Opérationnelle Standard conforme à la norme ISO 15189:2022 et aux directives internationales d'accréditation.",
    overviewHeading: "Architecture Opérationnelle Standard",
    workflowHeading: "Déroulement Clinique Étape par Étape",
    stepsLabel: "Phases",
    interactiveSimHeading: "Simulateur Pratique en Temps Réel",
    troubleshootingHeading: "Matrice de Dépannage et de Résolution des Incidents",
    glossaryHeading: "Glossaire des Termes Cliniques et d'Interfaçage",
    printSOP: "Imprimer / Exporter la POS Officielle",
    copyProtocol: "Copier la POS de la Phase",
    copied: "POS copiée dans le presse-papier !",
    filterDepartment: "Filtrer par Département",
    allDepartments: "Toutes les Disciplines",
    emergencySTATNote: "Les tubes STAT interrompent immédiatement les séries en cours avec un délai garanti < 15 minutes.",
    steps: [
      {
        phaseNumber: 1,
        badge: "PHASE 01 : INITIALISATION MATÉRIELLE",
        title: "Contrôles Pré-Analytiques et Démarrage Électromécanique",
        summary: "Vérification des onduleurs, des compresseurs d'air pneumatique, des circuits hydrauliques et du bain d'incubation thermique (37,0°C ± 0,1°C).",
        objective: "Assurer la parfaite stabilité thermique et optique avant d'aspirer le premier échantillon de patient.",
        clinicalRationale: "Les cinétiques enzymatiques requièrent une température exacte. Un démarrage à froid génère des résultats faussement bas en transaminases.",
        checklist: [
          "Vérifier la tension de sortie de l'onduleur (220V - 240V).",
          "Contrôler le manomètre pneumatique : 0,45 à 0,65 MPa (4,5 à 6,5 bar).",
          "Vider le bidon de déchets liquides et ajouter un neutralisant chloré.",
          "Vérifier le niveau de solution déprotéinisante (> 80%).",
          "Laisser préchauffer la lampe ou le laser pendant 25 à 30 minutes."
        ],
        protocolSteps: [
          {
            step: "Alimentation Générale et Interrupteur",
            detail: "Enclencher le disjoncteur arrière puis le bouton de veille en façade. Laisser s'exécuter l'autotest initial."
          },
          {
            step: "Amorçage Hydraulique et Purge d'Air",
            detail: "Lancer 'Hydraulic Prime' pour éliminer les microbulles d'air des seringues de pipetage.",
            warning: "Une bulle d'air dans la seringue génère une erreur volumétrique de 5% à 15%."
          },
          {
            step: "Vérification de l'Équilibre Thermique",
            detail: "Le bain de réaction doit afficher 37,0°C (± 0,1°C) et le carrousel de réactifs 2°C - 8°C."
          }
        ],
        technicalSpecs: [
          { label: "Température de Bain", value: "37,0°C ± 0,1°C" },
          { label: "Pression Pneumatique", value: "0,55 MPa (5,5 bar)" },
          { label: "Réfrigération Réactifs", value: "2,0°C - 8,0°C" },
          { label: "Préchauffage Optique", value: "25 - 30 minutes" }
        ],
        troubleshootingTip: "Si la pression hydraulique ne monte pas, vérifiez le serrage du bouchon du bidon de déchets."
      },
      {
        phaseNumber: 2,
        badge: "PHASE 02 : GESTION DES RÉACTIFS",
        title: "Chargement des Réactifs, Codes-Barres et Volume Mort",
        summary: "Installation des cassettes réactifs, lecture des codes 2D DataMatrix, suivi de la stabilité à bord et inventaire des cuvettes.",
        objective: "Éviter toute rupture en cours de série et prévenir les dégradations de réactifs à bord de l'automate.",
        clinicalRationale: "Utiliser un réactif au-delà de sa stabilité à bord entraîne des faux négatifs sur la troponine ou les électrolytes.",
        checklist: [
          "Vérifier la température du compartiment réfrigéré (2°C - 8°C).",
          "Scanner le code 2D pour enregistrer le numéro de lot et la péremption.",
          "Vérifier l'absence de mousse à la surface du liquide.",
          "Remplacer les cartouches avec moins de 15 tests avant une grande série.",
          "Recharger le magasin de cuvettes optiques jetables."
        ],
        protocolSteps: [
          {
            step: "Insertion et Verrouillage RFID",
            detail: "Placer la cassette dans son logement jusqu'au clic mécanique."
          },
          {
            step: "Inventaire Automatique par Lecteur Optique",
            detail: "Lancer le scan d'inventaire pour lire les numéros de lots et tests restants."
          },
          {
            step: "Contrôle du Volume Mort",
            detail: "S'assurer qu'au moins 1,5 mL de réactif est présent pour éviter l'aspiration d'air."
          }
        ],
        technicalSpecs: [
          { label: "Volume Mort Minimal", value: "1,5 mL à 2,0 mL" },
          { label: "Stabilité à Bord", value: "28 à 60 jours" },
          { label: "Format Code-Barres", value: "2D DataMatrix / PDF417" },
          { label: "Trajet Optique Cuvette", value: "10 mm précision quartz" }
        ],
        troubleshootingTip: "En présence de mousse, retourner doucement le flacon 5 fois. Ne jamais secouer énergiquement."
      },
      {
        phaseNumber: 3,
        badge: "PHASE 03 : CONTRÔLE QUALITÉ & RÈGLES DE WESTGARD",
        title: "Contrôle de Qualité Quotidien et Règles de Westgard",
        summary: "Passage des 3 niveaux de contrôle (Normal, Bas, Haut), tracé de Levey-Jennings et déverrouillage de la série après conformité.",
        objective: "Valider la justesse et la fidélité de l'automate avant d'analyser tout tube patient (Exigence ISO 15189).",
        clinicalRationale: "Un décalage non détecté fausse l'ensemble des résultats de glycémie, urée ou bilirubine de la journée.",
        checklist: [
          "Reconstituer les contrôles avec de l'eau de grade réactif Tipo 1 (CLRW).",
          "Laisser reposer 30 minutes à l'obscurité à température ambiante.",
          "Placer les niveaux 1, 2 et 3 dans le portoir de contrôle dédié.",
          "Vérifier sur Levey-Jennings que tous les points sont dans les ±2 Écarts-Types (ET).",
          "Vérifier l'absence de violation des règles de Westgard (1-3s, 2-2s, R-4s, 4-1s, 10-x)."
        ],
        protocolSteps: [
          {
            step: "Lancement de la Série CQ Quotidienne",
            detail: "Sélectionner 'Run QC' et positionner les godets en C1, C2, C3."
          },
          {
            step: "Évaluation Levey-Jennings & Westgard",
            detail: "En cas de violation 1-3s ou 2-2s, l'automate bloque immédiatement l'analyse des patients.",
            warning: "Ne jamais forcer un déblocage sans action corrective documentée et nouveau contrôle conforme."
          },
          {
            step: "Validation Électronique Qualité",
            detail: "Le biologiste valide la série CQ dans le SIL. L'automate passe en 'QC PASSED - RUN READY'."
          }
        ],
        technicalSpecs: [
          { label: "CV% Acceptable", value: "< 2,5% en biochimie courante" },
          { label: "Action Règle 1-3s", value: "SÉRIE REJETÉE - Blocage Automatique" },
          { label: "Action Règle 2-2s", value: "SÉRIE REJETÉE - Erreur Systématique" },
          { label: "Matrice Contrôle", value: "Sérum Humain Lyophilisé" }
        ],
        troubleshootingTip: "Si tous les paramètres dérivent dans le même sens, suspectez l'eau purifiée ou un changement de lot de réactif."
      },
      {
        phaseNumber: 4,
        badge: "PHASE 04 : INTERFAÇAGE SIL & PROTOCOLE ASTM/HL7",
        title: "Connexion Serveur SIL et Synchronisation Bidirectionnelle",
        summary: "Configuration de la liaison réseau RS-232 / TCP-IP, échange de trames ASTM E1394 et récupération automatique des listes de travail.",
        objective: "Supprimer toute saisie manuelle au clavier pour éliminer les erreurs d'attribution de prescription.",
        clinicalRationale: "La saisie manuelle entraîne 1 à 3% d'erreurs de retranscription, risquant de délivrer un mauvais bilan.",
        checklist: [
          "Vérifier que le port d'écoute TCP 5100 (ASTM) ou 6000 (HL7) est actif.",
          "S'assurer que le serveur SIL émet un ping de présence toutes les 30 secondes.",
          "Liaison série : 9600 bauds, 8 bits de données, sans parité, 1 bit de stop.",
          "Délimiteurs de trame ASCII (| , \\ , ^ , &) correctement configurés.",
          "Mode 'Auto-Query' bidirectionnel activé sur l'automate."
        ],
        protocolSteps: [
          {
            step: "Négociation de Session (Handshake)",
            detail: "L'automate envoie [ENQ]. Le serveur SIL répond [ACK]. La connexion est établie."
          },
          {
            step: "Transmission de la Requête de Tube",
            detail: "Après lecture du code-barres 'SAMP-9921', l'automate interroge le SIL qui renvoie les examens demandés."
          },
          {
            step: "Mise en File d'Attente d'Analyse",
            detail: "L'automate planifie les volumes de sérum, filtres optiques et temps de réaction requis."
          }
        ],
        technicalSpecs: [
          { label: "Norme de Protocole", value: "ASTM E1381 / E1394 & HL7 v2.5 MLLP" },
          { label: "Temps de Réponse", value: "< 350 ms par échantillon" },
          { label: "Délimiteurs", value: "[STX] Trame [ETX] Checksum [CR][LF]" },
          { label: "Octets de Contrôle", value: "ENQ (0x05), ACK (0x06), NAK (0x15)" }
        ],
        troubleshootingTip: "Si l'automate reçoit des [NAK] répétés, contrôlez le câble réseau RJ45 et le calcul de somme de contrôle."
      },
      {
        phaseNumber: 5,
        badge: "PHASE 05 : CHARGEMENT DES TUBES & VOIE STAT",
        title: "Centrifugation, Chargement sur Portoir et Voie d'Urgence STAT",
        summary: "Chargement des tubes primaires avec gel séparateur, détection capacitive de niveau et traitement prioritaire des urgences vitales.",
        objective: "Éviter l'aspiration de microcaillots de fibrine et garantir un rendu d'urgence en moins de 15 minutes.",
        clinicalRationale: "Aspirer un caillot bouche l'aiguille et fausse les dosages suivants. Une troponine d'urgence requiert un rendu < 15 min.",
        checklist: [
          "Centrifugation à 1500g pendant 10 minutes à 20-25°C avec barrière de gel nette.",
          "Orienter les étiquettes codes-barres vers la fenêtre optique du portoir.",
          "Couleurs : Mauve EDTA (NFS), Jaune Gel SST (Biochimie), Bleu Citrate (Hémostase).",
          "Volume minimal : 500 µL de sérum clair au-dessus du gel.",
          "Vérifier l'absence d'hémolyse massive ou de turbidité lipémique."
        ],
        protocolSteps: [
          {
            step: "Alimentation des Portoirs sur Convoyeur",
            detail: "Déposer les portoirs de 5 ou 10 tubes sur la voie d'alimentation vers le lecteur de codes-barres."
          },
          {
            step: "Insertion sur Voie Prioritaire STAT",
            detail: "Insérer le tube urgent dans le port rouge STAT. L'automate suspend la série courante et traite l'urgence immédiatement."
          },
          {
            step: "Détection Capacitive de Niveau (LLCD)",
            detail: "L'aiguille détecte la surface du sérum et plonge de seulement 2 mm pour éviter d'aspirer de la mousse."
          }
        ],
        technicalSpecs: [
          { label: "Centrifugation", value: "1500g - 2000g (10 minutes)" },
          { label: "Volume Mort Minimal", value: "150 µL au-dessus du gel" },
          { label: "Volume d'Aspiration", value: "2,0 µL à 25,0 µL" },
          { label: "Délai Garanti STAT", value: "< 15 minutes rendu résultat" }
        ],
        troubleshootingTip: "En cas d'alarme caillot, retirer le tube, décanter la fibrine et centrifuger à nouveau 5 min à 2000g."
      },
      {
        phaseNumber: 6,
        badge: "PHASE 06 : CINÉTIQUE & SPECTROPHOTOMÉTRIE",
        title: "Micro-Pipetage, Incubation Cinétique et Photométrie Multi-Longueurs d'Onde",
        summary: "Distribution de micro-volumes à 37°C et mesure de cinétiques d'absorbance sur 12 longueurs d'onde simultanées.",
        objective: "Garantir la linéarité photométrique et une reproductibilité sub-microlitrique sur les dosages enzymatiques.",
        clinicalRationale: "Les enzymes (transaminases, LDH) sont calculées par pente cinétique (ΔA/min). Une contamination entre cuvettes fausse l'analyse.",
        checklist: [
          "Pression de lavage extérieur d'aiguille à 0,2 MPa (contamination < 0,01%).",
          "Agitation homogène à 1200 tr/min sans créer d'éclaboussures.",
          "Intensité de lampe sur 12 longueurs d'onde (340nm à 800nm).",
          "Contrôle de pente des électrodes ISE pour le sodium, potassium et chlore.",
          "Propreté de l'eau du bain thermostaté de photométrie."
        ],
        protocolSteps: [
          {
            step: "Distribution Sérum et Réactif",
            detail: "L'aiguille prélève 3,0 µL de sérum et le distribue dans 150 µL de réactif R1 à 37°C."
          },
          {
            step: "Acquisition de la Pente Cinétique",
            detail: "Le spectrophotomètre effectue 24 mesures sur 10 minutes à 340nm et 405nm."
          },
          {
            step: "Détection d'Épuisement de Substrat",
            detail: "Si la glycémie dépasse 700 mg/dL, l'automate réalise automatiquement une prédilution 1:5."
          }
        ],
        technicalSpecs: [
          { label: "Gamme Photométrique", value: "0,0000 à 3,0000 Abs (10mm)" },
          { label: "Longueurs d'Onde", value: "340, 380, 405, 450, 505, 546, 600, 700, 800 nm" },
          { label: "Pente Électrodes ISE", value: "Na+: 54-62 mV, K+: 52-60 mV, Cl-: 48-58 mV" },
          { label: "Contamination Résiduelle", value: "< 0,01% après rinçage actif" }
        ],
        troubleshootingTip: "Une courbe cinétique aplatie indique une consommation rapide de substrat imposant une redilution."
      },
      {
        phaseNumber: 7,
        badge: "PHASE 07 : AUTOVALIDATION & VALEURS DE PANIQUE",
        title: "Autovalidation Biologique, Delta Check et Appel Téléphonique des Valeurs Critiques",
        summary: "Application des intervalles de référence, contrôle Delta Check sur 48h et transmission immédiate des résultats d'alerte vitale.",
        objective: "Garantir que les résultats critiques atteignent le médecin prescripteur en moins de 5 minutes (Norme ISO 15189).",
        clinicalRationale: "Une hausse brutale de créatinine alerte sur une insuffisance rénale aiguë. Une kaliémie à 6,8 mmol/L engage le pronostic vital.",
        checklist: [
          "Appliquer les valeurs de référence adaptées à l'âge et au sexe.",
          "Exécuter le Delta Check avec les antécédents à 48 heures (> 30% d'écart nécessite blocage).",
          "Analyser l'indice HIL (Hémolyse, Ictère, Lipémie).",
          "Détecter les valeurs d'alerte vitale (Glycémie < 0,45 g/L, K+ > 6,2 mmol/L, Plaquettes < 20 G/L).",
          "Documenter la communication téléphonique avec nom du médecin et heure exacte."
        ],
        protocolSteps: [
          {
            step: "Moteur d'Autovalidation Clinique",
            detail: "Les résultats normaux sans anomalie sont libérés dans le SIL en 30 secondes."
          },
          {
            step: "Déclenchement d'Alarme de Panique",
            detail: "Une alarme sonore et visuelle s'active sur la console lors du dépassement d'un seuil critique."
          },
          {
            step: "Appel au Service Prescripteur",
            detail: "Le technicien contacte le service d'urgence ou de réanimation et consigne la relecture verbale dans la traçabilité."
          }
        ],
        technicalSpecs: [
          { label: "Kaliémie Critique", value: "< 2,8 ou > 6,2 mmol/L" },
          { label: "Glycémie Critique", value: "< 0,45 ou > 4,50 g/L" },
          { label: "Plaquettes Critiques", value: "< 20 000 / µL" },
          { label: "Traçabilité Appel", value: "Obligatoire selon la norme ISO 15189 Cl. 5.8" }
        ],
        troubleshootingTip: "Si un potassium dépasse 6,5 mmol/L avec créatinine normale, vérifiez l'absence de contamination par un tube EDTA."
      },
      {
        phaseNumber: 8,
        badge: "PHASE 08 : DÉCONTAMINATION & AUDIT QUALITÉ",
        title: "Décontamination Quotidienne, Lavage Javelisé et Clôture du Cahier de Maintenance",
        summary: "Cycles de déprotéinisation à l'hypochlorite de sodium, neutralisation des effluents et signature numérique du registre de maintenance.",
        objective: "Éviter l'encrassement des aiguilles de prélèvement et maintenir la conformité permanente aux audits d'accréditation.",
        clinicalRationale: "Négliger la maintenance quotidienne provoque l'obstruction protéique des tubulures et fausse les volumes de 8% en 3 jours.",
        checklist: [
          "Installer l'hypochlorite de sodium à 5% et la soude 0,1M en position de lavage.",
          "Lancer la procédure automatisée de fermeture 'End-of-Day Shutdown'.",
          "Décontaminer le réservoir de déchets avec de l'eau de Javel à 10%.",
          "Nettoyer l'extérieur des aiguilles avec une lingette imprégnée d'alcool.",
          "Signer numériquement le registre de maintenance avec horodatage électronique."
        ],
        protocolSteps: [
          {
            step: "Cycle de Déprotéinisation Chimique",
            detail: "L'automate rince les aiguilles et cuvettes avec la solution d'hypochlorite sous pression pendant 15 minutes."
          },
          {
            step: "Rinçage à l'Eau Désionisée",
            detail: "Purge de 200 mL d'eau pure pour éliminer tout résidu corrosif dans les tubulures."
          },
          {
            step: "Archivage et Sauvegarde Sécurisée",
            detail: "Les graphiques CQ, journaux d'erreurs et signatures sont synchronisés sur le cloud d'assurance qualité."
          }
        ],
        technicalSpecs: [
          { label: "Produits Décontaminants", value: "Hypochlorite de sodium 5% et solution acide" },
          { label: "Durée du Cycle", value: "15 à 20 minutes" },
          { label: "Référentiel d'Audit", value: "ISO 15189:2022 et 21 CFR Part 11" },
          { label: "Durée d'Archivage", value: "Minimum 5 ans obligatoire" }
        ],
        troubleshootingTip: "N'utilisez jamais de fil métallique pour déboucher une aiguille ; cela détruirait son revêtement interne hydrophile en Téflon."
      }
    ],
    emergencyMatrix: [
      {
        alarm: "OBSTRUCTION DE SONDE / CAILLOT (ERR-304)",
        probableCause: "Aspiration d'un microcaillot de fibrine consécutif à une centrifugation insuffisante.",
        correctiveAction: "Lancer 'Probe Backflush'. Si nécessaire, démonter l'aiguille, tremper dans NaOH 0,1M et passer aux ultrasons.",
        nablRequirement: "Consigner l'incident dans le registre de non-conformité et demander un rééchantillonnage."
      },
      {
        alarm: "VIOLATION WESTGARD 1-3s (BLOCAGE CQ)",
        probableCause: "Erreur aléatoire de pipetage, altération du contrôle, réactif périmé ou encrassement optique.",
        correctiveAction: "Arrêt immédiat des analyses. Reconstituer un nouveau contrôle. Si l'échec persiste, refaire une calibration.",
        nablRequirement: "Rédiger une fiche de non-conformité avant toute réouverture de la file d'analyse."
      },
      {
        alarm: "BULLE DE RÉACTIF / VOLUME MORT (ERR-112)",
        probableCause: "Niveau inférieur au volume mort de sécurité ou mousse consécutive à une agitation brutale.",
        correctiveAction: "Laisser reposer 10 min. Crever les bulles avec une pipette stérile. Remplacer la cartouche si < 1,5 mL.",
        nablRequirement: "Vérifier la concordance du numéro de lot de réactif."
      },
      {
        alarm: "RUPTURE DE CONNEXION SIL",
        probableCause: "Câble réseau débranché, conflit d'adresse IP ou arrêt du service middleware du SIL.",
        correctiveAction: "Tester la liaison par commande 'ping'. Vérifier le câble RJ45 et redémarrer le port d'écoute 5100/6000.",
        nablRequirement: "Conserver les résultats dans la mémoire tampon locale de l'automate jusqu'au rétablissement."
      },
      {
        alarm: "DÉRIVE THERMIQUE > 37,2°C (ERR-501)",
        probableCause: "Panne de la pompe de circulation du bain ou température excessive de la pièce de laboratoire.",
        correctiveAction: "Vérifier le niveau d'eau du bain. Régler la climatisation à 22°C. Dépoussiérer la grille arrière de ventilation.",
        nablRequirement: "Suspendre les dosages enzymatiques jusqu'à retour de la température à 37,0°C ± 0,1°C."
      }
    ],
    glossary: [
      {
        term: "ASTM E1381 / E1394",
        definition: "Norme de transmission de données cliniques entre automates d'analyse et systèmes informatiques de laboratoire.",
        practicalTip: "Composée d'enregistrements d'en-tête (H), patient (P), prescription (O), résultat (R) et fin (L)."
      },
      {
        term: "HL7 v2.5",
        definition: "Protocole d'échange de messages médicaux fonctionnant sur réseau TCP/IP via des trames MLLP.",
        practicalTip: "Transmet des segments standardisés tels que MSH (En-tête), PID (Patient), OBR (Prescription) et OBX (Résultat)."
      },
      {
        term: "Règles de Westgard",
        definition: "Règles de décision statistique permettant de déterminer si une série analytique est acceptable ou rejetée.",
        practicalTip: "La règle 1-2s est une alerte ; les règles 1-3s et 2-2s imposent le rejet strict de la série analytique."
      },
      {
        term: "Graphique de Levey-Jennings",
        definition: "Représentation graphique des valeurs de contrôle en fonction du temps par rapport à la moyenne et aux écarts-types (±1ET, ±2ET, ±3ET).",
        practicalTip: "Permet de visualiser les dérives progressives ou les décalages brutaux de justesse analytique."
      },
      {
        term: "Indice HIL (Hémolyse, Ictère, Lipémie)",
        definition: "Mesure spectrophotométrique des interférences spectrales dues à l'hémoglobine libre, la bilirubine ou les lipides.",
        practicalTip: "L'hémolyse entraîne une élévation artéfactuelle majeure du potassium et des LDH."
      },
      {
        term: "Delta Check",
        definition: "Vérification automatisée comparant le résultat actuel d'un patient à son résultat précédent sur 48 heures.",
        practicalTip: "Identifie les inversions d'échantillons ou les dégradations physiologiques fulgurantes."
      },
      {
        term: "Valeur de Panique",
        definition: "Résultat d'analyse clinique traduisant un danger vital immédiat pour le patient.",
        practicalTip: "Exige un appel téléphonique urgent et une relecture verbale conformément à l'article 5.8 de l'ISO 15189."
      },
      {
        term: "Voie d'Urgence STAT",
        definition: "Dispositif d'analyse prioritaire interrompant les séries de routine pour délivrer les résultats critiques en moins de 15 minutes.",
        practicalTip: "Dédiée aux bilans de troponine, gaz du sang, potassium et D-Dimères du service des urgences."
      }
    ]
  },
  de: {
    name: "Deutsch",
    flag: "🇩🇪",
    title: "Bedienungsanleitung für Laboranalyseautomaten & Klinische SOP",
    subtitle: "Standardarbeitsanweisung gemäß ISO 15189:2022, CLSI-Leitlinien und RiliBÄK-Qualitätsstandards.",
    overviewHeading: "Standardbetriebsarchitektur",
    workflowHeading: "Schritt-für-Schritt-Ablauf im klinischen Labor",
    stepsLabel: "Phasen",
    interactiveSimHeading: "Interaktiver Diagnostik-Simulator",
    troubleshootingHeading: "Notfall-Fehlerbehebungsmatrix",
    glossaryHeading: "Glossar für Labor- und Schnittstellenterminologie",
    printSOP: "Offizielle SOP drucken / exportieren",
    copyProtocol: "Phasen-SOP kopieren",
    copied: "SOP in die Zwischenablage kopiert!",
    filterDepartment: "Nach Abteilung filtern",
    allDepartments: "Alle Fachbereiche",
    emergencySTATNote: "Notfall-STAT-Proben unterbrechen Routinechargen sofort mit garantierter Bearbeitungszeit < 15 Min.",
    steps: [
      {
        phaseNumber: 1,
        badge: "PHASE 01: HARDWARE-INITIALISIERUNG",
        title: "Präanalytische Prüfung & Einschalten der Systeme",
        summary: "Überprüfung von USV-Spannung, Druckluftkompressoren, Hydraulik und 37,0°C ± 0,1°C Reaktionsbädern vor Probenstart.",
        objective: "Sicherstellung der mechanischen, optischen und thermischen Stabilität zur Vermeidung analytischer Drifts.",
        clinicalRationale: "Enzymatische Reaktionen erfordern exakte 37°C. Ein Kaltstart führt zu drastisch falsch-niedrigen Transaminasewerten.",
        checklist: [
          "USV-Ausgangsspannung auf 220V - 240V prüfen.",
          "Druckluftanzeige: 0,45 bis 0,65 MPa (4,5 bis 6,5 bar).",
          "Flüssigabfallkanister leeren und Desinfektionsmittel zugeben.",
          "Waschlösungsvorrat (Entproteinierer) > 80% sicherstellen.",
          "Halogenlampe oder Laserdiode 25 bis 30 Minuten vorwärmen lassen."
        ],
        protocolSteps: [
          {
            step: "Hauptschalter und Bedienfeld einschalten",
            detail: "Hauptrückwandschalter einschalten, dann vorderen Taster betätigen. Selbsttest (POST) abwarten."
          },
          {
            step: "Hydraulik-Spülung und Entlüftung",
            detail: "'Hydraulic Prime' starten, um Luftbläschen aus den Dosierspritzen zu entfernen.",
            warning: "Mikrobläschen in den Spritzen verursachen Pipettierfehler von 5% bis 15%."
          },
          {
            step: "Thermisches Gleichgewicht prüfen",
            detail: "Das Reaktionsbad muss 37,0°C (± 0,1°C) und das Reagenzkühlfach 2°C - 8°C erreichen."
          }
        ],
        technicalSpecs: [
          { label: "Reaktionstemperatur", value: "37,0°C ± 0,1°C" },
          { label: "Druckluftwert", value: "0,55 MPa (5,5 bar)" },
          { label: "Reagenzienkühlung", value: "2,0°C - 8,0°C" },
          { label: "Vorwärmzeit", value: "25 - 30 Minuten" }
        ],
        troubleshootingTip: "Wenn der Hydraulikdruck nicht aufgebaut wird, prüfen Sie, ob der Deckel des Abfallkanisters fest verschlossen ist."
      },
      {
        phaseNumber: 2,
        badge: "PHASE 02: REAGENZIENMANAGEMENT",
        title: "Reagenzienladung, Barcoderegistrierung & Totvolumenprüfung",
        summary: "Reagenzkassetten einsetzen, 2D-DataMatrix-Codes scannen, Bordstabilität überwachen und Küvettenvorrat auffüllen.",
        objective: "Unterbrechungsfreier Analysenbetrieb ohne Ausfall durch verbrauchte oder abgelaufene Reagenzien.",
        clinicalRationale: "Abgelaufene Bordstabilität führt zu Substratzersetzung und falsch-negativen Troponin- oder Elektrolytbefunden.",
        checklist: [
          "Kühlfachtemperatur (2°C - 8°C) vor dem Laden kontrollieren.",
          "2D-Barcode scannen, um Chargennummer und Verfallsdatum zu erfassen.",
          "Sicherstellen, dass sich kein Schaum auf der Flüssigkeitsoberfläche befindet.",
          "Kassetten mit < 15 Tests vor großen Serien austauschen.",
          "Küvettenmagazin mit neuen optischen Präzisionsküvetten befüllen."
        ],
        protocolSteps: [
          {
            step: "Kassettenplatzierung und RFID-Einrastung",
            detail: "Reagenzkassette in den nummerierten Steckplatz drücken, bis sie hörbar einrastet."
          },
          {
            step: "Automatische Reagenzinventur",
            detail: "Scan-Funktion auslösen; der interne Barcodeleser erfasst Tests und Gültigkeit."
          },
          {
            step: "Meniskus- und Totvolumenprüfung",
            detail: "Mindestens 1,5 mL Reagenzüberstand prüfen, um Luftansaugung zu verhindern."
          }
        ],
        technicalSpecs: [
          { label: "Minimales Totvolumen", value: "1,5 mL bis 2,0 mL" },
          { label: "Bordstabilität", value: "28 bis 60 Tage" },
          { label: "Barcode-Typ", value: "2D DataMatrix / PDF417" },
          { label: "Küvetten-Schichtdicke", value: "10 mm Quarzküvette" }
        ],
        troubleshootingTip: "Bei Schaumbildung die Kassette 5-mal vorsichtig invertieren. Niemals stark schütteln."
      },
      {
        phaseNumber: 3,
        badge: "PHASE 03: QUALITÄTSKONTROLLE & WESTGARD-REGELN",
        title: "Tägliche 3-Stufen-Qualitätskontrolle & Westgard-Freigabe",
        summary: "3 Kontrollstufen (Normal, Niedrig, Hoch) messen, Levey-Jennings-Diagramme auswerten und Westgard-Regeln einhalten.",
        objective: "Präzision und Richtigkeit vor der ersten Patientenmessung gemäß RiliBÄK / ISO 15189 nachweisen.",
        clinicalRationale: "Unbemerkte Drift führt zu systematischen Messfehlern bei Glukose, Bilirubin und Kreatinin aller Patienten.",
        checklist: [
          "Kontrollseren mit Typ-1-Reagenzwasser (CLRW) mit kalibrierter Pipette rekonstituieren.",
          "30 Minuten im Dunkeln bei Raumtemperatur stehen lassen; vorsichtig schwenken.",
          "Stufen 1, 2 und 3 in das spezielle Kontrollrack einsetzen.",
          "Prüfen, ob alle Werte im Bereich von ±2 Standardabweichungen (SD) liegen.",
          "Westgard-Verletzungen (1-3s, 2-2s, R-4s, 4-1s, 10-x) ausschließen."
        ],
        protocolSteps: [
          {
            step: "Tägliche Kontrollserie starten",
            detail: "'Run Daily QC' wählen und Kontrollgefäße auf Positionen C1, C2, C3 stellen."
          },
          {
            step: "Levey-Jennings & Regelprüfung",
            detail: "Bei 1-3s oder 2-2s sperrt das System die Patientenanalyse vollautomatisch.",
            warning: "Niemals eine 1-3s-Sperre manuell umgehen, ohne die Ursache behoben und neue Kontrollen bestanden zu haben."
          },
          {
            step: "Elektronische Qualitätsfreigabe",
            detail: "Laborleiter genehmigt die Kontrollserie im LIS. Der Status wechselt auf 'QC PASSED - RUN READY'."
          }
        ],
        technicalSpecs: [
          { label: "Akzeptabler VK%", value: "< 2,5% in der Routinechemie" },
          { label: "Westgard 1-3s Aktion", value: "SERIE ABGELEHNT - Sofortige Sperre" },
          { label: "Westgard 2-2s Aktion", value: "SERIE ABGELEHNT - Systematischer Fehler" },
          { label: "Kontrollmatrix", value: "Lyophilisiertes Humanserum" }
        ],
        troubleshootingTip: "Wenn sich ein gesamtes Analysenprofil in eine Richtung verschiebt, prüfen Sie die Reagenzcharge und die Reinstwasseranlage."
      },
      {
        phaseNumber: 4,
        badge: "PHASE 04: LIS-SCHNITTSTELLE & BIDIREKTIONALE SYNCHRONISATION",
        title: "LIS-Hostverbindung, ASTM- & HL7-Bidirektionale Arbeitslisten",
        summary: "RS-232 / TCP-IP-Schnittstelle konfigurieren, ASTM E1394-Telegramme parsen und Arbeitslisten per Barcodescan abrufen.",
        objective: "Vollständige Eliminierung von manuellen Tastatureingaben zur Vermeidung von Probenverwechslungen.",
        clinicalRationale: "Manuelle Eingabe verursacht bei hohem Aufkommen 1-3% Übertragungsfehler mit Gefahr falscher Diagnosen.",
        checklist: [
          "Netzwerk-Socket auf Port 5100 (ASTM) oder 6000 (HL7) überprüfen.",
          "LIS-Host sendet alle 30 Sekunden ein Heartbeat-Signal.",
          "Serielle Parameter: 9600 Baud, 8 Datenbits, Keine Parität, 1 Stoppbit.",
          "ASCII-Trennzeichen (| , \\ , ^ , &) standardkonform eingestellt.",
          "Bidirektionaler Auto-Query-Modus im Gerät aktiviert."
        ],
        protocolSteps: [
          {
            step: "Low-Level Handshake Aushandlung",
            detail: "Analysator sendet [ENQ]. LIS antwortet mit [ACK]. Sitzung erfolgreich aufgebaut."
          },
          {
            step: "Übermittlung der Barcode-Abfrage",
            detail: "Nach Scannen von 'SAMP-9921' sendet das Gerät: 'Q|1|^SAMP-9921||ALL'. LIS liefert angeforderte Analysen zurück."
          },
          {
            step: "Automatische Abarbeitungswarteschlange",
            detail: "Gerät weist Küvetten, Filterwellenlängen und Inkubationszeiten automatisch zu."
          }
        ],
        technicalSpecs: [
          { label: "Protokollstandard", value: "ASTM E1381 / E1394 & HL7 v2.5 MLLP" },
          { label: "Antwortzeit", value: "< 350 ms pro Probe" },
          { label: "Framing-Trennzeichen", value: "[STX] Frame [ETX] Prüfsumme [CR][LF]" },
          { label: "Steuerzeichen", value: "ENQ (0x05), ACK (0x06), NAK (0x15)" }
        ],
        troubleshootingTip: "Bei wiederholten [NAK]-Meldungen prüfen Sie das Netzwerkkabel und die Prüfsummenberechnung im LIS-Treiber."
      },
      {
        phaseNumber: 5,
        badge: "PHASE 05: PROBENLADUNG & STAT-NOTFALLSPUR",
        title: "Zentrifugation, Rackbeladung & Notfall-STAT-Spur",
        summary: "Zentrifugierte Primärröhrchen einsetzen, Füllstandssensoren prüfen und Notfallproben über die STAT-Spur priorisieren.",
        objective: "Vermeidung von Nadelfibrinverstopfungen und garantierte Befundung von Notfällen in unter 15 Minuten.",
        clinicalRationale: "Fibrin verstopft die Nadel und verfälscht nachfolgende Patienten. Notfall-Troponin erfordert < 15 Min. Turnaround-Zeit.",
        checklist: [
          "Zentrifugation: 1500g für 10 Min. bei 20-25°C mit sauberer Trenngelbarriere.",
          "Barcodes durch die Racksichtschlitze nach außen ausrichten.",
          "Farbkodierung: Lila EDTA (Hämatologie), Gold SST Gel (Klinische Chemie), Blau Citrat (Gerinnung).",
          "Probenvolumen: Mindestens 500 µL klares Serum über der Gelschicht.",
          "HIL-Index (Hämolyse, Ikterus, Lipämie) kontrollieren."
        ],
        protocolSteps: [
          {
            step: "Rackzufuhr über Transportband",
            detail: "5er- oder 10er-Racks auf die Eingangsspur stellen; Barcodeleser erfasst die Röhrchen."
          },
          {
            step: "Direkteinspeisung über roten STAT-Port",
            detail: "Notfallröhrchen in den STAT-Port setzen. Das Gerät unterbricht die Routineserie und misst die Notfallprobe sofort."
          },
          {
            step: "Kapazitive Füllstandsmessung (LLCD)",
            detail: "Die Nadel taucht exakt 2 mm unter den Meniskus ein, um Luftblasen und Fibrinfäden zu vermeiden."
          }
        ],
        technicalSpecs: [
          { label: "Zentrifugation", value: "1500g - 2000g (10 Minuten)" },
          { label: "Totvolumen über Gel", value: "150 µL Mindestüberstand" },
          { label: "Aspirationsvolumen", value: "2,0 µL bis 25,0 µL" },
          { label: "STAT-Garantiezeit", value: "< 15 Minuten bis zum Befund" }
        ],
        troubleshootingTip: "Bei Gerinnselalarm Röhrchen entnehmen, Fibrin mit Holzstäbchen entfernen und 5 Min. bei 2000g nachzentrifugieren."
      },
      {
        phaseNumber: 6,
        badge: "PHASE 06: OPTISCHE MESSUNG & KINETIK",
        title: "Mikrodosierung, Kinetische Inkubation & Multiwellenlängen-Photometrie",
        summary: "Mikrovolumina präzise bei 37°C dosieren, mischen und Absorptionskinetiken über 12 Wellenlängen erfassen.",
        objective: "Höchste photometrische Linearität und verschleppungsfreie Dosierung bei kinetischen Enzymtesten.",
        clinicalRationale: "Enzymteste (GOT, GPT) werden über ΔA/min berechnet. Nadelverschleppung führt zu massiv falschen Anstiegen.",
        checklist: [
          "Außenspüldruck der Nadel bei 0,2 MPa (Verschleppung < 0,01%).",
          "Mischrührer bei 1200 U/min ohne Bläschenbildung einstellen.",
          "Basislinienintensität der Lampe bei 12 Wellenlängen (340nm bis 800nm) prüfen.",
          "Reaktionsbadewasser auf Klarheit und Entgasung kontrollieren.",
          "ISE-Elektrodensteilheit für Natrium, Kalium und Chlorid überprüfen."
        ],
        protocolSteps: [
          {
            step: "Proben- und Reagenzdosierung",
            detail: "Nadel dosiert 3,0 µL Serum in 150 µL Reagenz 1 bei 37°C in die Quarzküvette."
          },
          {
            step: "Kinetische Steigungsmessung",
            detail: "Das Photometer misst 24 Datenpunkte über 10 Minuten bei 340nm und 405nm."
          },
          {
            step: "Substraterschöpfung & Autoverdünnung",
            detail: "Übersteigt Glukose 700 mg/dL, verdünnt der Automat automatisch 1:5 und wiederholt die Analyse."
          }
        ],
        technicalSpecs: [
          { label: "Photometrischer Bereich", value: "0,0000 bis 3,0000 Abs (10mm)" },
          { label: "Wellenlängenspektrum", value: "340, 380, 405, 450, 505, 546, 600, 700, 800 nm" },
          { label: "ISE-Steilheit", value: "Na+: 54-62 mV, K+: 52-60 mV, Cl-: 48-58 mV" },
          { label: "Verschleppungsgrenze", value: "< 0,01% mit Aktivhypochloritspülung" }
        ],
        troubleshootingTip: "Abgeflachte Kinetikkurven weisen auf vorzeitigen Substratverbrauch hin. Autoverdünnung kontrollieren."
      },
      {
        phaseNumber: 7,
        badge: "PHASE 07: AUTOVALIDIERUNG & PANIKWERTE",
        title: "Befund-Autovalidierung, Delta-Check & Telefonisches Panikwert-Protokoll",
        summary: "Biologische Referenzbereiche anwenden, 48-Stunden-Delta-Checks durchführen und lebensbedrohliche Werte sofort telefonieren.",
        objective: "Schnelle Freigabe unauffälliger Befunde und telefonische Warnung des Arztes bei Panikwerten in unter 5 Minuten.",
        clinicalRationale: "Ein Kreatininsprung um 50% deutet auf akutes Nierenversagen hin. Kalium von 6,8 mmol/L führt zu Kammerflimmern.",
        checklist: [
          "Alters- und geschlechtsspezifische Referenzbereiche hinterlegen.",
          "Delta-Check ausführen: Abweichungen > 30% zum Vorbefund (48h) stoppen.",
          "HIL-Index bewerten (Hämolyse, Ikterus, Lipämie).",
          "Kritische Panikgrenzen überwachen (z. B. Glukose < 45 mg/dL, K+ > 6,2 mmol/L, Thrombozyten < 20.000).",
          "Telefonische Rücklesebestätigung mit Arztname und Uhrzeit gemäß ISO 15189 dokumentieren."
        ],
        protocolSteps: [
          {
            step: "Regelbasierte Autovalidierung",
            detail: "Unauffällige Befunde ohne Flags werden innerhalb von 30 Sekunden automatisch an das LIS übermittelt."
          },
          {
            step: "Akustischer & Optischer Panikalarm",
            detail: "Bei Überschreiten von Panikwerten blinkt der Arbeitsplatz rot auf und ein Warnton ertönt."
          },
          {
            step: "Telefonisches Read-Back-Protokoll",
            detail: "MTA ruft die Intensivstation an, lässt den Befund rücklesen und erfasst dies manipulationssicher im System."
          }
        ],
        technicalSpecs: [
          { label: "Kritisches Kalium", value: "< 2,8 oder > 6,2 mmol/L" },
          { label: "Kritische Glukose", value: "< 45 oder > 450 mg/dL" },
          { label: "Kritische Thrombozyten", value: "< 20.000 / µL" },
          { label: "Dokumentationspflicht", value: "Gemäß ISO 15189 / RiliBÄK Klausel 5.8" }
        ],
        troubleshootingTip: "Bei extrem hohem Kalium (> 6,5 mmol/L) mit normaler Nierenfunktion prüfen, ob Blut aus einem EDTA-Röhrchen umgefüllt wurde (Pseudohyperkaliämie)."
      },
      {
        phaseNumber: 8,
        badge: "PHASE 08: DEKONTAMINATION & AUDITDOKUMENTATION",
        title: "Tägliche Dekontamination, Nadelreinigung & RiliBÄK-Wartungsabschluss",
        summary: "Natriumhypochloritspülung durchführen, Probennadeln entproteinisieren, Abfall neutralisieren und Wartungsprotokoll digital signieren.",
        objective: "Vermeidung von Biofilmen und Salzkrusten an den Nadeln sowie lückenlose Nachweisbarkeit bei Qualitätsaudits.",
        clinicalRationale: "Unterlassene Reinigung führt zu Proteinablagerungen in den Nadeln, die das Dosiervolumen innerhalb von 3 Tagen um bis zu 8% verfälschen.",
        checklist: [
          "5% Natriumhypochlorit (NaOCl) und 0,1M NaOH auf Waschpositionen stellen.",
          "Automatisiertes Programm 'Tägliche End-of-Day-Wartung' starten.",
          "Flüssigabfallkanister mit 10% Bleichmittel desinfizieren und entsorgen.",
          "Nadelaußenflächen vorsichtig mit Alkoholtupfer abwischen.",
          "Wartungslogbuch digital mit Benutzer-ID und Zeitstempel abzeichnen."
        ],
        protocolSteps: [
          {
            step: "Chemische Entproteinisierungsspülung",
            detail: "Das Gerät spült Nadeln und Küvetten 15 Minuten lang mit Hypochloritlösung unter Druck."
          },
          {
            step: "Spülung mit Reinstwasser",
            detail: "200 mL deionisiertes Wasser durchspülen, um korrosive Rückstände vollständig zu entfernen."
          },
          {
            step: "Revisionssichere Archivierung",
            detail: "Kontrollkarten, Fehlerprotokolle und Signaturen werden verschlüsselt in die Qualitätsdatenbank übertragen."
          }
        ],
        technicalSpecs: [
          { label: "Reinigungslösung", value: "5% Natriumhypochlorit & Säurespülung" },
          { label: "Zyklusdauer", value: "15 - 20 Minuten" },
          { label: "Normvorgaben", value: "ISO 15189:2022 & 21 CFR Part 11" },
          { label: "Aufbewahrungsfrist", value: "Mindestens 5 Jahre RiliBÄK-Vorgabe" }
        ],
        troubleshootingTip: "Verwenden Sie niemals Metalldrähte zur Nadelreinigung; dies zerstört die hydrophile Innenbeschichtung aus Teflon."
      }
    ],
    emergencyMatrix: [
      {
        alarm: "GERINNSEL / NADELBLOCKADE (ERR-304)",
        probableCause: "Aspiration von Fibrin infolge unzureichender Probenzentrifugation.",
        correctiveAction: "'Probe Backflush' ausführen. Falls blockiert, Nadel ausbauen, 10 Min. in 0,1M NaOH einlegen und im Ultraschallbad reinigen.",
        nablRequirement: "Musterabweichung protokollieren und Nachzentrifugation (2000g, 10 Min.) anfordern."
      },
      {
        alarm: "WESTGARD 1-3s VERLETZUNG (QC SPERRE)",
        probableCause: "Zufälliger Pipettierfehler, gealtertes Kontrollserum, Reagenzverfall oder Staub im optischen Pfad.",
        correctiveAction: "Patientenmessung sofort stoppen! Neues Kontrollaliquot messen. Bei erneutem Fehler Neukalibrierung durchführen.",
        nablRequirement: "Fehlerbericht mit Ursachenanalyse und Korrekturmaßnahme vor Freigabe anfertigen."
      },
      {
        alarm: "REAGENZBLASE / TOTVOLUMEN (ERR-112)",
        probableCause: "Füllstand unter Mindesttotvolumen oder Schaum durch heftiges Schütteln.",
        correctiveAction: "Kassette 10 Min. ruhen lassen. Blasen mit Pipettenspitze zerstören. Bei < 1,5 mL neue Kassette einsetzen.",
        nablRequirement: "Chargenkonformität des neuen Reagenzes überprüfen."
      },
      {
        alarm: "LIS-VERBINDUNG UNTERBROCHEN",
        probableCause: "Netzwerkkabel gelöst, IP-Adresskonflikt oder Ausfall des LIS-Treibers.",
        correctiveAction: "LIS-IP anpingen. Netzwerkkabel prüfen. LIS-Port 5100/6000 neu starten und ENQ-Signal senden.",
        nablRequirement: "Analysen im lokalen Pufferspeicher fortsetzen; automatische Übertragung nach Wiederverbindung."
      },
      {
        alarm: "TEMPERATURDRIFT > 37,2°C (ERR-501)",
        probableCause: "Ausfall der Umwälzpumpe des Inkubationsbads oder Überhitzung des Laborraums.",
        correctiveAction: "Badwasserstand prüfen. Raumklimatisierung auf 22°C einstellen. Lüftungsgitter an der Rückseite reinigen.",
        nablRequirement: "Enzymmessungen aussetzen, bis die Temperatur wieder bei 37,0°C ± 0,1°C stabil ist."
      }
    ],
    glossary: [
      {
        term: "ASTM E1381 / E1394",
        definition: "Internationales Übertragungsprotokoll zum Datenaustausch zwischen Analysegeräten und Laborinformationssystemen.",
        practicalTip: "Strukturiert in Header- (H), Patienten- (P), Auftrags- (O), Ergebnis- (R) und Terminator-Datensätze (L)."
      },
      {
        term: "HL7 v2.5",
        definition: "Standardisiertes medizinisches Nachrichtenprotokoll über TCP/IP-Netzwerke mit MLLP-Übertragung.",
        practicalTip: "Ermöglicht automatische bidirektionale Auftrags- und Befundübermittlung in modernen Zentrallaboren."
      },
      {
        term: "Westgard-Regeln",
        definition: "Statistische Entscheidungskriterien zur Beurteilung, ob eine analytische Messserie freigegeben oder verworfen wird.",
        practicalTip: "1-2s ist ein Warnhinweis; 1-3s und 2-2s erfordern den sofortigen Abbruch der Analysenserie."
      },
      {
        term: "Levey-Jennings-Diagramm",
        definition: "Grafische Darstellung der Kontrollwerte über die Zeit im Verhältnis zum Mittelwert und den Standardabweichungen (±1SD, ±2SD, ±3SD).",
        practicalTip: "Macht systematische Verschiebungen oder schleichende Trends im Reagenzverhalten auf einen Blick sichtbar."
      },
      {
        term: "HIL-Index (Hämolyse, Ikterus, Lipämie)",
        definition: "Spektralphotometrische Erfassung von Probeninterferenzen durch freies Hämoglobin, Bilirubin oder Lipide.",
        practicalTip: "Hämolyse führt zu drastisch falsch-hohen Messwerten bei Kalium und LDH."
      },
      {
        term: "Delta-Check",
        definition: "Automatisierte Plausibilitätsprüfung, die den aktuellen Messwert mit dem Vorwert desselben Patienten vergleicht.",
        practicalTip: "Verhindert die Freigabe bei Probenverwechslungen oder akuten Organversagen."
      },
      {
        term: "Panikwert (Kritischer Alarmwert)",
        definition: "Extremer Laborbefund, der auf eine akute Lebensgefahr für den Patienten hinweist.",
        practicalTip: "Erfordert gemäß RiliBÄK / ISO 15189 einen telefonischen Sofortbericht mit Rücklesebestätigung an den Stationsarzt."
      },
      {
        term: "STAT-Notfallspur",
        definition: "Bevorzugte Messbahn am Automaten, die Routineanalysen unterbricht, um Notfälle in unter 15 Minuten zu bearbeiten.",
        practicalTip: "Unerlässlich für Notfallbiomarker wie Troponin, Kalium, D-Dimer und Blutgase aus Notaufnahme und Intensivstation."
      }
    ]
  }
};

export default function AnalyzerDocumentationHub({
  initialLanguage = "en",
  onSelectAnalyzerForGuide,
}: {
  initialLanguage?: LanguageKey;
  onSelectAnalyzerForGuide?: (analyzerId: string) => void;
}) {
  const [currentLang, setCurrentLang] = useState<LanguageKey>(initialLanguage);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedPhase, setCopiedPhase] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [docViewMode, setDocViewMode] = useState<"pdf" | "interactive">("pdf");

  // Interactive Simulator States
  const [simWestgardL1, setSimWestgardL1] = useState<number>(100);
  const [simWestgardL2, setSimWestgardL2] = useState<number>(50);
  const [simWestgardL3, setSimWestgardL3] = useState<number>(200);
  const [simBarcodeScan, setSimBarcodeScan] = useState<string>("SAMP-ER-7741");
  const [simASTMStep, setSimASTMStep] = useState<number>(0);
  const [simIsRunningSTAT, setSimIsRunningSTAT] = useState<boolean>(false);
  const [simReagentDaysOpen, setSimReagentDaysOpen] = useState<number>(14);

  const t = DOCUMENTATION_DATA[currentLang];
  const activeStep = t.steps[activePhaseIndex] || t.steps[0];

  const handleCopyPhase = (phase: StepContent) => {
    const textToCopy = `=== ${phase.badge} ===\nTitle: ${phase.title}\nObjective: ${phase.objective}\nClinical Rationale: ${phase.clinicalRationale}\n\nChecklist:\n${phase.checklist.map((c) => `- ${c}`).join("\n")}\n\nSteps:\n${phase.protocolSteps.map((s) => `* ${s.step}: ${s.detail}`).join("\n")}\n\nTroubleshooting Tip: ${phase.troubleshootingTip}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedPhase(phase.phaseNumber);
    setTimeout(() => setCopiedPhase(null), 3000);
  };

  const handleCopyAll = () => {
    let fullText = `======================================================\n`;
    fullText += `DOCUMINICATION: CLINICAL LABORATORY AUTOMATED ANALYZER OPERATING MANUAL & SOP\n`;
    fullText += `Standard: ISO 15189:2022 / NABL 112 / CLSI AUTO-01\n`;
    fullText += `Document Code: DOC-LAB-ANA-SOP-2026-v4.2\n`;
    fullText += `Language: ${t.name}\n`;
    fullText += `======================================================\n\n`;
    t.steps.forEach((s) => {
      fullText += `\n--- PHASE 0${s.phaseNumber}: ${s.title.toUpperCase()} ---\n`;
      fullText += `Objective: ${s.objective}\n`;
      fullText += `Clinical Rationale: ${s.clinicalRationale}\n\n`;
      fullText += `Checklist:\n${s.checklist.map((c) => ` [x] ${c}`).join("\n")}\n\n`;
      fullText += `Protocol Steps:\n${s.protocolSteps.map((p, idx) => ` ${idx + 1}. ${p.step}: ${p.detail}${p.warning ? ` [WARNING: ${p.warning}]` : ""}`).join("\n")}\n\n`;
      fullText += `Technical Tolerances:\n${s.technicalSpecs.map((sp) => ` - ${sp.label}: ${sp.value}`).join("\n")}\n`;
      fullText += `Bench Tip: ${s.troubleshootingTip}\n`;
    });
    fullText += `\n======================================================\n`;
    fullText += `EMERGENCY TROUBLESHOOTING & DEVIATION MATRIX\n`;
    fullText += `======================================================\n`;
    t.emergencyMatrix.forEach((em) => {
      fullText += `Alarm: ${em.alarm} | NABL Requirement: ${em.nablRequirement}\n`;
      fullText += `Cause: ${em.probableCause}\n`;
      fullText += `Corrective Action: ${em.correctiveAction}\n\n`;
    });
    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  const handlePrint = () => {
    if (docViewMode !== "pdf") {
      setDocViewMode("pdf");
      setTimeout(() => window.print(), 200);
    } else {
      window.print();
    }
  };

  // Filtered analyzers list
  const filteredAnalyzers = useMemo(() => {
    if (selectedDepartment === "ALL") return REAL_WORLD_ANALYZERS;
    return REAL_WORLD_ANALYZERS.filter(
      (a) => a.department?.toUpperCase() === selectedDepartment || a.departmentCode === selectedDepartment
    );
  }, [selectedDepartment]);

  // Westgard simulation calculation
  const westgardEval = useMemo(() => {
    const z1 = (simWestgardL1 - 100) / 5;
    const z2 = (simWestgardL2 - 50) / 3;
    const z3 = (simWestgardL3 - 200) / 10;
    const maxZ = Math.max(Math.abs(z1), Math.abs(z2), Math.abs(z3));

    if (maxZ > 3.0) {
      return {
        status: "REJECT",
        rule: "1-3s Violation (Random / Extreme Deviation)",
        msg: "Run Rejected! At least one control exceeds ±3 SD. Analyzer is automatically LOCKED OUT.",
        color: "text-rose-400 bg-rose-500/10 border-rose-500/40"
      };
    }
    if ((z1 > 2.0 && z2 > 2.0) || (z1 < -2.0 && z2 < -2.0) || (z2 > 2.0 && z3 > 2.0) || (z2 < -2.0 && z3 < -2.0)) {
      return {
        status: "REJECT",
        rule: "2-2s Violation (Systematic Shift)",
        msg: "Run Rejected! Two consecutive controls exceed the same ±2 SD limit. Systematic shift detected.",
        color: "text-rose-400 bg-rose-500/10 border-rose-500/40"
      };
    }
    if (Math.abs(z1 - z2) > 4.0 || Math.abs(z2 - z3) > 4.0) {
      return {
        status: "REJECT",
        rule: "R-4s Violation (Random Range Deviation)",
        msg: "Run Rejected! The range between controls across the run exceeds 4 SD. Severe random dispersion.",
        color: "text-rose-400 bg-rose-500/10 border-rose-500/40"
      };
    }
    if (maxZ > 2.0) {
      return {
        status: "WARNING",
        rule: "1-2s Warning Rule Triggered",
        msg: "Warning Only. One control exceeds ±2 SD. Inspect previous trends but run is not rejected.",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/40"
      };
    }
    return {
      status: "PASS",
      rule: "All 3 Levels In-Control (Within ± 2 SD)",
      msg: "Quality Control Passed! Levey-Jennings distribution optimal. Ready for patient specimens.",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/40"
    };
  }, [simWestgardL1, simWestgardL2, simWestgardL3]);

  // ASTM Handshake steps
  const astmPackets = [
    { from: "Analyzer", to: "LIS Server", byte: "<ENQ> (0x05)", note: "Handshake Request: 'Analyzer requesting session'" },
    { from: "LIS Server", to: "Analyzer", byte: "<ACK> (0x06)", note: "Handshake Accepted: 'LIS Ready to Receive'" },
    { from: "Analyzer", to: "LIS Server", byte: `<STX>1H|\\^&|||SYSMEX_XN1K|||||||P|1<CR><ETX>B4`, note: "ASTM Header Record: Protocol Identification" },
    { from: "LIS Server", to: "Analyzer", byte: "<ACK> (0x06)", note: "Header Frame Acknowledged" },
    { from: "Analyzer", to: "LIS Server", byte: `<STX>2Q|1|^${simBarcodeScan}||ALL||||||||O<CR><ETX>8F`, note: "Query Frame: 'What tests requested for this tube barcode?'" },
    { from: "LIS Server", to: "Analyzer", byte: `<STX>3P|1||MRN-9042||SHARMA^VIKRAM||19850412|M<CR><ETX>9C`, note: "Patient Demographic Record: Patient identity verified" },
    { from: "LIS Server", to: "Analyzer", byte: `<STX>4O|1|${simBarcodeScan}||^^^CBC+DIFF^ROUTINE|R<CR><ETX>72`, note: "Order Record: 'Perform CBC + 5-Part Differential'" },
    { from: "Analyzer", to: "LIS Server", byte: "<ACK> (0x06)", note: "Order Download Acknowledged" },
    { from: "Analyzer", to: "LIS Server", byte: "<EOT> (0x04)", note: "Session Closed: Handshake Complete, Specimen Aspirating" }
  ];

  return (
    <div className="space-y-6 print:p-0 print:space-y-0">
      {/* Embedded CSS for Print & PDF Rendering */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 12mm 10mm 12mm 10mm;
              }
              body, html {
                background: #ffffff !important;
                color: #0f172a !important;
                font-size: 10pt !important;
              }
              .print\\:hidden, nav, aside, header, button, .no-print {
                display: none !important;
              }
              .pdf-page-container {
                background: #ffffff !important;
                color: #0f172a !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
              }
              .pdf-break-before {
                page-break-before: always !important;
                break-before: page !important;
              }
              .pdf-avoid-break {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .pdf-sheet {
                border: 1px solid #cbd5e1 !important;
                background: #ffffff !important;
                color: #0f172a !important;
                box-shadow: none !important;
              }
            }
          `
        }}
      />

      {/* ============================================================ */}
      {/* MASTER TOP BANNER & DOCUMINICATION CONTROL BAR */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-[#071328] to-slate-900 p-6 md:p-8 shadow-2xl text-white print:hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:28px_28px]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            {/* Prominent Header Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3.5 py-1 text-xs font-black tracking-wider text-emerald-300 shadow-lg shadow-emerald-500/20">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                DOCUMINICATION
              </span>
              <span className="rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1 text-[11px] font-mono font-bold text-blue-300">
                ISO 15189:2022 / NABL 112
              </span>
              <span className="rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-1 text-[11px] font-mono font-bold text-violet-300">
                CLSI AUTO-01 / ASTM E1394
              </span>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-[11px] font-mono font-bold text-amber-300">
                CONTROLLED MASTER SOP
              </span>
            </div>

            {/* MASTER HEADER TEXT: "DOCUMINICATION" */}
            <h1 className="mt-3.5 text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>DOCUMINICATION</span>
              <span className="text-sm font-medium text-slate-400 hidden sm:inline">|</span>
              <span className="text-base md:text-lg font-bold text-slate-300 hidden sm:inline">
                Clinical Operating Manual (SOP)
              </span>
            </h1>

            <p className="mt-2 text-xs md:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {t.subtitle} End-to-end laboratory automated instrument operation from pre-analytical hardware power-up to 3-level Westgard quality gates, bidirectional LIS worklist integration, post-analytical auto-approval, and NABL maintenance audit logging.
            </p>

            {/* Document Metadata Strip */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Document Code:</span>
                <span className="text-cyan-300 font-bold">DOC-LAB-ANA-SOP-2026</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Edition:</span>
                <span className="text-white font-bold">4.2 (Annual Review)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Effective Date:</span>
                <span className="text-emerald-300 font-bold">10-OCT-2026</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Next Review:</span>
                <span className="text-amber-300 font-bold">09-OCT-2027</span>
              </div>
            </div>

            {/* Language Pills */}
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-slate-300">
                <Languages className="h-4 w-4 text-cyan-400" />
                <span className="font-bold text-white">Manual Language:</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(DOCUMENTATION_DATA) as LanguageKey[]).map((langKey) => {
                  const langItem = DOCUMENTATION_DATA[langKey];
                  const isActive = currentLang === langKey;
                  return (
                    <button
                      key={langKey}
                      type="button"
                      onClick={() => setCurrentLang(langKey)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400"
                          : "border border-slate-700/80 bg-slate-800/60 text-slate-300 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-white"
                      }`}
                    >
                      <span className="text-sm">{langItem.flag}</span>
                      <span>{langItem.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Tools & View Mode Toggle */}
          <div className="flex flex-col gap-3 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-2xl border border-slate-700 bg-slate-900/90 p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setDocViewMode("pdf")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  docViewMode === "pdf"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-300"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText className="h-4 w-4 text-emerald-300" />
                <span>📄 PDF Document View</span>
              </button>
              <button
                type="button"
                onClick={() => setDocViewMode("interactive")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  docViewMode === "interactive"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-300"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sliders className="h-4 w-4 text-blue-300" />
                <span>🔬 Interactive Workbench</span>
              </button>
            </div>

            {/* Print & Download Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-5 py-3 text-xs font-black text-white shadow-xl shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all"
                title="Download / Print DOCUMINICATION Official SOP PDF"
              >
                <Printer className="h-4 w-4" />
                <span>Download / Print PDF</span>
              </button>

              <button
                type="button"
                onClick={handleCopyAll}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/90 px-4 py-3 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-md"
                title="Copy Full Document Text to Clipboard"
              >
                {copiedAll ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-slate-300" />
                    <span>Copy Full Text</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* VIEW MODE 1: OFFICIAL PDF DOCUMENT FORMAT */}
      {/* ============================================================ */}
      {docViewMode === "pdf" && (
        <div className="pdf-page-container space-y-8">
          {/* A4 PAPER CONTAINER */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 md:p-10 shadow-2xl text-slate-100 print:bg-white print:text-slate-900 print:border-none print:p-0">
            {/* ── PDF DOCUMENT COVER & LETTERHEAD ── */}
            <div className="border-b-2 border-slate-700 pb-6 print:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-lg shadow-lg">
                    LC
                  </div>
                  <div>
                    <h2 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 print:text-emerald-800">
                      NIKIL LABCORE ENTERPRISE CLINICAL LABORATORY SYSTEM
                    </h2>
                    <p className="text-[11px] text-slate-400 print:text-slate-600">
                      Department of Laboratory Medicine & Diagnostics • Quality Management Division
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-300 print:text-emerald-900 print:border-emerald-600">
                    ISO 15189:2022 ACCREDITED
                  </span>
                  <p className="text-[10px] text-slate-400 print:text-slate-600 mt-1">
                    NABL Certificate No: MC-48912 • CLSI AUTO-01 Compliant
                  </p>
                </div>
              </div>

              {/* Master Document Header */}
              <div className="mt-8 text-center bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 print:bg-slate-50 print:border-slate-300">
                <div className="inline-block rounded-full bg-emerald-500/20 border border-emerald-400/40 px-4 py-1 text-xs font-black uppercase tracking-widest text-emerald-300 print:text-emerald-800">
                  STANDARD OPERATING PROCEDURE (SOP)
                </div>
                <h1 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-white print:text-slate-950">
                  DOCUMINICATION
                </h1>
                <p className="mt-1 text-sm md:text-base font-bold text-slate-300 print:text-slate-700">
                  {t.title}
                </p>
                <p className="mt-2 text-xs text-slate-400 print:text-slate-600 max-w-2xl mx-auto">
                  {t.subtitle}
                </p>
              </div>

              {/* Document Control Summary Table */}
              <div className="mt-6 overflow-hidden rounded-xl border border-slate-800 print:border-slate-300">
                <table className="w-full text-left text-xs">
                  <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                    <tr className="bg-slate-900/70 print:bg-slate-100">
                      <th className="px-4 py-2 text-slate-400 print:text-slate-700 font-bold w-1/4">Document ID</th>
                      <td className="px-4 py-2 font-mono font-bold text-cyan-300 print:text-cyan-900">DOC-LAB-ANA-SOP-2026-v4.2</td>
                      <th className="px-4 py-2 text-slate-400 print:text-slate-700 font-bold w-1/4">Status</th>
                      <td className="px-4 py-2 font-bold text-emerald-400 print:text-emerald-800">APPROVED & CONTROLLED COPY</td>
                    </tr>
                    <tr>
                      <th className="px-4 py-2 text-slate-400 print:text-slate-700 font-bold">Standard</th>
                      <td className="px-4 py-2 font-mono text-slate-200 print:text-slate-800">ISO 15189:2022 (Clause 7.3) & NABL 112</td>
                      <th className="px-4 py-2 text-slate-400 print:text-slate-700 font-bold">Review Frequency</th>
                      <td className="px-4 py-2 text-slate-200 print:text-slate-800">Annual Mandatory Technical Review</td>
                    </tr>
                    <tr className="bg-slate-900/70 print:bg-slate-100">
                      <th className="px-4 py-2 text-slate-400 print:text-slate-700 font-bold">Effective Date</th>
                      <td className="px-4 py-2 font-mono text-emerald-300 print:text-emerald-900 font-bold">10-OCT-2026</td>
                      <th className="px-4 py-2 text-slate-400 print:text-slate-700 font-bold">Next Review Due</th>
                      <td className="px-4 py-2 font-mono text-amber-300 print:text-amber-900 font-bold">09-OCT-2027</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatory Authorization Block */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 print:bg-white print:border-slate-300">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-600 block">
                    Prepared By:
                  </span>
                  <p className="mt-1 font-bold text-white print:text-slate-900">Vikram Sharma, MSc, MLT</p>
                  <p className="text-[10px] text-slate-400 print:text-slate-600">Chief Medical Laboratory Technologist</p>
                  <p className="mt-2 text-[10px] font-mono text-emerald-400 print:text-emerald-800">Sign: [E-SIGN: VS-88912]</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 print:bg-white print:border-slate-300">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-600 block">
                    Reviewed By:
                  </span>
                  <p className="mt-1 font-bold text-white print:text-slate-900">Dr. Neha Verma, PhD</p>
                  <p className="text-[10px] text-slate-400 print:text-slate-600">Quality Assurance Lead Auditor</p>
                  <p className="mt-2 text-[10px] font-mono text-emerald-400 print:text-emerald-800">Sign: [E-SIGN: NV-QA-019]</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 print:bg-white print:border-slate-300">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-600 block">
                    Approved By:
                  </span>
                  <p className="mt-1 font-bold text-white print:text-slate-900">Dr. Amit Shah, MD Pathologist</p>
                  <p className="text-[10px] text-slate-400 print:text-slate-600">Director of Laboratory Medicine</p>
                  <p className="mt-2 text-[10px] font-mono text-emerald-400 print:text-emerald-800">Sign: [E-SIGN: AS-DIR-001]</p>
                </div>
              </div>

              {/* Table of Contents */}
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 print:bg-slate-50 print:border-slate-300">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-400 print:text-cyan-800 block mb-2">
                  Document Table of Contents (Sequential Operational Flow):
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {t.steps.map((st) => (
                    <a
                      key={st.phaseNumber}
                      href={`#phase-${st.phaseNumber}`}
                      className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 print:text-slate-800 hover:text-white transition-colors"
                    >
                      <span className="font-mono text-cyan-400 font-bold">0{st.phaseNumber}.</span>
                      <span className="truncate">{st.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* ── ALL 8 CLINICAL PHASES RENDERED SEQUENTIALLY ── */}
            <div className="mt-8 space-y-8">
              {t.steps.map((phase) => (
                <div
                  key={phase.phaseNumber}
                  id={`phase-${phase.phaseNumber}`}
                  className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 pdf-avoid-break print:bg-white print:border-slate-300 print:p-4"
                >
                  {/* Phase Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4 print:border-slate-300">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-blue-500/20 border border-blue-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-300 print:text-blue-900 print:border-blue-700">
                          {phase.badge}
                        </span>
                        <span className="text-xs font-mono text-slate-400 print:text-slate-600">
                          Section {phase.phaseNumber} of 08
                        </span>
                      </div>
                      <h2 className="mt-1.5 text-xl font-black text-white print:text-slate-950">
                        {phase.title}
                      </h2>
                    </div>

                    <div className="print:hidden">
                      <button
                        type="button"
                        onClick={() => handleCopyPhase(phase)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-white"
                      >
                        {copiedPhase === phase.phaseNumber ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Section</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-xs md:text-sm text-slate-300 print:text-slate-700 leading-relaxed">
                    {phase.summary}
                  </p>

                  {/* Objective & Rationale */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 print:bg-blue-50 print:border-blue-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 print:text-blue-900 block">
                        Clinical Objective:
                      </span>
                      <p className="mt-1 text-slate-200 print:text-slate-800 leading-relaxed">
                        {phase.objective}
                      </p>
                    </div>

                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 print:bg-amber-50 print:border-amber-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 print:text-amber-900 block">
                        Scientific Rationale:
                      </span>
                      <p className="mt-1 text-slate-200 print:text-slate-800 leading-relaxed">
                        {phase.clinicalRationale}
                      </p>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4 print:bg-slate-50 print:border-slate-300">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 print:text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Operator Verification Checklist
                    </span>
                    <ul className="mt-2.5 space-y-1.5">
                      {phase.checklist.map((ch, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-300 print:text-slate-800">
                          <span className="h-4 w-4 shrink-0 rounded bg-emerald-500/20 text-emerald-400 print:text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                            ✓
                          </span>
                          <span>{ch}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Step-by-Step Protocol */}
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4 print:bg-slate-50 print:border-slate-300">
                    <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 print:text-cyan-800 flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5" />
                      Standard Operating Protocol Instructions
                    </span>
                    <div className="mt-3 space-y-3">
                      {phase.protocolSteps.map((p, idx) => (
                        <div key={idx} className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-3 print:bg-white print:border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600/30 text-blue-300 print:text-blue-900 text-xs font-bold font-mono">
                              {idx + 1}
                            </span>
                            <h4 className="text-xs font-black text-white print:text-slate-900">{p.step}</h4>
                          </div>
                          <p className="mt-1 text-xs text-slate-300 print:text-slate-800 pl-7 leading-relaxed">
                            {p.detail}
                          </p>
                          {p.warning && (
                            <div className="mt-2 ml-7 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-[11px] text-amber-300 print:text-amber-900 print:bg-amber-50 flex items-center gap-2">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400 print:text-amber-700" />
                              <span>{p.warning}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tolerances Table & Pro Tip */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 print:bg-slate-50 print:border-slate-300">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 print:text-violet-900 block mb-2">
                        Diagnostic Tolerances & Parameters:
                      </span>
                      <table className="w-full text-[11px]">
                        <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                          {phase.technicalSpecs.map((spec, spIdx) => (
                            <tr key={spIdx}>
                              <td className="py-1 text-slate-400 print:text-slate-600 font-medium">{spec.label}</td>
                              <td className="py-1 text-right font-mono font-bold text-white print:text-slate-900">{spec.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 print:bg-emerald-50 print:border-emerald-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 print:text-emerald-900 block">
                        💡 Pro Technologist Bench Tip:
                      </span>
                      <p className="mt-1 text-slate-200 print:text-slate-800 leading-relaxed">
                        {phase.troubleshootingTip}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── SECTION 9: INSTRUMENT FLEET SPECIFICATIONS ── */}
            <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 pdf-avoid-break print:bg-white print:border-slate-300">
              <h2 className="text-lg font-black text-white print:text-slate-950">
                Section 09: Diagnostic Analyzer Fleet Specifications Matrix
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                Authentic hospital-grade instruments deployed within core laboratory diagnostic automation.
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900 print:bg-slate-100 text-slate-400 print:text-slate-700">
                      <th className="p-2.5">Analyzer</th>
                      <th className="p-2.5">Manufacturer</th>
                      <th className="p-2.5">Section</th>
                      <th className="p-2.5">Throughput</th>
                      <th className="p-2.5">Protocol</th>
                      <th className="p-2.5">Target Temp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                    {REAL_WORLD_ANALYZERS.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-900/60 print:hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-white print:text-slate-900">{a.name}</td>
                        <td className="p-2.5 text-slate-300 print:text-slate-700">{a.manufacturer}</td>
                        <td className="p-2.5">
                          <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300 print:bg-slate-200 print:text-slate-800">
                            {a.department}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-cyan-300 print:text-cyan-900">{a.throughputPerHour} T/hr</td>
                        <td className="p-2.5 font-mono text-emerald-300 print:text-emerald-900">{a.protocol}</td>
                        <td className="p-2.5 font-mono text-slate-300 print:text-slate-700">{a.temperatureTarget}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── SECTION 10: EMERGENCY TROUBLESHOOTING & DEVIATION MATRIX ── */}
            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 pdf-avoid-break print:bg-white print:border-slate-300">
              <h2 className="text-lg font-black text-rose-300 print:text-rose-900 flex items-center gap-2">
                <BadgeAlert className="h-5 w-5" />
                <span>Section 10: {t.troubleshootingHeading}</span>
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                Root causes, corrective actions, and mandatory NABL 112 deviation documentation.
              </p>

              <div className="mt-4 space-y-3">
                {t.emergencyMatrix.map((item, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 p-4 print:bg-slate-50 print:border-slate-300">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="font-bold text-rose-300 print:text-rose-900 text-xs">
                        {item.alarm}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 print:text-slate-700">
                        {item.nablRequirement}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-600">Probable Cause:</span>
                        <p className="text-slate-300 print:text-slate-800">{item.probableCause}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 print:text-emerald-800">Corrective SOP Action:</span>
                        <p className="text-slate-200 print:text-slate-800">{item.correctiveAction}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── SECTION 11: GLOSSARY ── */}
            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 pdf-avoid-break print:bg-white print:border-slate-300">
              <h2 className="text-lg font-black text-white print:text-slate-950">
                Section 11: {t.glossaryHeading}
              </h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {t.glossary.map((g, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 p-3 print:bg-slate-50 print:border-slate-300">
                    <h3 className="font-bold text-cyan-300 print:text-cyan-900">{g.term}</h3>
                    <p className="mt-1 text-slate-300 print:text-slate-800 leading-relaxed">{g.definition}</p>
                    <p className="mt-1.5 text-[11px] text-slate-400 print:text-slate-600 font-mono">
                      Bench: {g.practicalTip}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── SECTION 12: CERTIFICATION & STAMP BLOCK ── */}
            <div className="mt-10 pt-6 border-t-2 border-slate-700 pdf-avoid-break print:border-slate-800">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 print:text-emerald-900">
                    ACCREDITED LABORATORY QUALITY ASSURANCE SEAL
                  </h4>
                  <p className="text-[11px] text-slate-400 print:text-slate-600 mt-1 max-w-md">
                    This document represents the authorized controlled manual under ISO 15189:2022 standards. Unauthorized alterations or unlogged paper photocopies are strictly prohibited.
                  </p>
                </div>

                <div className="flex items-center gap-4 text-center">
                  <div className="h-20 w-20 rounded-full border-2 border-dashed border-emerald-400 flex items-center justify-center p-2 text-[9px] font-black uppercase text-emerald-300 print:text-emerald-900 print:border-emerald-700">
                    OFFICIAL NABL AUDIT STAMP
                  </div>
                  <div className="text-left text-xs font-mono">
                    <p className="text-slate-400 print:text-slate-600">Verification Hash:</p>
                    <p className="font-bold text-cyan-300 print:text-cyan-900">0x7F9A..B41C</p>
                    <p className="text-[10px] text-emerald-400 print:text-emerald-800 mt-1">Status: Valid Active Manual</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW MODE 2: INTERACTIVE WORKBENCH */}
      {/* ============================================================ */}
      {docViewMode === "interactive" && (
        <div className="space-y-6">
          {/* Phase Stepper Pills */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-3 shadow-xl">
            <div className="flex items-center justify-between px-2 pb-2.5 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                  {t.workflowHeading}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-blue-400">
                Phase {activeStep.phaseNumber} of {t.steps.length}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {t.steps.map((step, idx) => {
                const isCurrent = activePhaseIndex === idx;
                const isDone = activePhaseIndex > idx;
                return (
                  <button
                    key={step.phaseNumber}
                    type="button"
                    onClick={() => setActivePhaseIndex(idx)}
                    className={`relative flex flex-col items-start gap-1 rounded-xl p-2.5 text-left transition-all ${
                      isCurrent
                        ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-300"
                        : isDone
                        ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        : "border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${isCurrent ? "text-blue-200" : isDone ? "text-emerald-400" : "text-slate-500"}`}>
                        0{step.phaseNumber}
                      </span>
                      {isDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : isCurrent ? (
                        <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                      ) : null}
                    </div>
                    <p className="line-clamp-2 text-[11px] font-bold leading-snug">
                      {step.title}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Phase Detailed Breakdown Card */}
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-6 md:p-8 shadow-2xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-blue-500/20 border border-blue-500/40 px-2.5 py-0.5 text-[10px] font-mono font-black text-blue-300 uppercase">
                    {activeStep.badge}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Step {activeStep.phaseNumber} / 08
                  </span>
                </div>
                <h2 className="mt-2 text-2xl font-black text-white">
                  {activeStep.title}
                </h2>
                <p className="mt-1 text-sm text-slate-300 leading-relaxed max-w-4xl">
                  {activeStep.summary}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={activePhaseIndex === 0}
                  onClick={() => setActivePhaseIndex((prev) => Math.max(0, prev - 1))}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-all"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={activePhaseIndex === t.steps.length - 1}
                  onClick={() => setActivePhaseIndex((prev) => Math.min(t.steps.length - 1, prev + 1))}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-40 transition-all shadow-md"
                >
                  <span>Next Phase</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase tracking-wider">
                      <ShieldCheck className="h-4 w-4 text-blue-400" />
                      <span>Clinical Objective</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-200 leading-relaxed">
                      {activeStep.objective}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      <span>Scientific Rationale</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-200 leading-relaxed">
                      {activeStep.clinicalRationale}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Pre-Execution Operator Verification Checklist</span>
                  </h3>
                  <ul className="mt-3.5 space-y-2.5">
                    {activeStep.checklist.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-black border border-emerald-500/40">
                          ✓
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-cyan-400" />
                    <span>Standard Operating Protocol (Step-by-Step Execution)</span>
                  </h3>
                  <div className="mt-4 space-y-4">
                    {activeStep.protocolSteps.map((s, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold">
                            {idx + 1}
                          </span>
                          <h4 className="text-xs font-black text-white">{s.step}</h4>
                        </div>
                        <p className="mt-2 text-xs text-slate-300 leading-relaxed pl-8">
                          {s.detail}
                        </p>
                        {s.warning && (
                          <div className="mt-2.5 ml-8 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-300">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
                            <span>{s.warning}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-violet-400" />
                    <span>Diagnostic Tolerances & Parameters</span>
                  </h3>
                  <div className="mt-3.5 divide-y divide-slate-800/80">
                    {activeStep.technicalSpecs.map((spec, i) => (
                      <div key={i} className="flex items-center justify-between py-2 text-xs">
                        <span className="text-slate-400">{spec.label}</span>
                        <span className="font-mono font-bold text-white text-right max-w-[55%]">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 p-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <span>Pro Technologist Bench Tip</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-200 leading-relaxed">
                    {activeStep.troubleshootingTip}
                  </p>
                </div>

                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-300 uppercase tracking-wider">
                    <Zap className="h-4 w-4 text-rose-400" />
                    <span>Emergency STAT Handling</span>
                  </div>
                  <p className="mt-2 text-xs text-rose-200 leading-relaxed">
                    {t.emergencySTATNote}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Hands-on Interactive Simulators */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 md:p-8 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-5">
              <span className="rounded-full bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                SANDBOX
              </span>
              <h2 className="text-xl font-black text-white">
                {t.interactiveSimHeading}
              </h2>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Westgard Simulator */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-blue-400" />
                    <h3 className="text-xs font-black uppercase text-white tracking-wider">
                      Westgard Multi-Rule Evaluation Engine
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">Target Mean ± SD</span>
                </div>

                <p className="text-xs text-slate-300">
                  Adjust control values to see real-time rule evaluation (1-2s, 1-3s, 2-2s, R-4s).
                </p>

                <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Level 1 (Target 100):</span>
                      <span className="font-mono font-bold text-cyan-300">{simWestgardL1} mg/dL ({( (simWestgardL1 - 100) / 5 ).toFixed(1)} SD)</span>
                    </div>
                    <input
                      type="range"
                      min="80"
                      max="120"
                      value={simWestgardL1}
                      onChange={(e) => setSimWestgardL1(Number(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Level 2 (Target 50):</span>
                      <span className="font-mono font-bold text-violet-300">{simWestgardL2} mg/dL ({( (simWestgardL2 - 50) / 3 ).toFixed(1)} SD)</span>
                    </div>
                    <input
                      type="range"
                      min="38"
                      max="62"
                      value={simWestgardL2}
                      onChange={(e) => setSimWestgardL2(Number(e.target.value))}
                      className="w-full accent-violet-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Level 3 (Target 200):</span>
                      <span className="font-mono font-bold text-amber-300">{simWestgardL3} mg/dL ({( (simWestgardL3 - 200) / 10 ).toFixed(1)} SD)</span>
                    </div>
                    <input
                      type="range"
                      min="160"
                      max="240"
                      value={simWestgardL3}
                      onChange={(e) => setSimWestgardL3(Number(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${westgardEval.color}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider">{westgardEval.rule}</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase bg-black/40">
                      {westgardEval.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed">{westgardEval.msg}</p>
                </div>
              </div>

              {/* ASTM Packet Simulator */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-xs font-black uppercase text-white tracking-wider">
                      Live ASTM E1394 Packet Handshake Tracer
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Port 5100 Socket</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={simBarcodeScan}
                    onChange={(e) => setSimBarcodeScan(e.target.value)}
                    placeholder="Scan Tube Barcode..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSimASTMStep(0)}
                    className="shrink-0 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
                  >
                    Reset
                  </button>
                </div>

                <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs max-h-56 overflow-y-auto">
                  {astmPackets.slice(0, simASTMStep + 1).map((pkt, idx) => (
                    <div key={idx} className="border-b border-slate-800/80 pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-cyan-400 font-bold">{pkt.from} → {pkt.to}</span>
                        <span className="text-slate-500">Step {idx + 1}/9</span>
                      </div>
                      <div className="text-emerald-300 font-bold text-[11px] mt-0.5 break-all">
                        {pkt.byte}
                      </div>
                      <div className="text-slate-400 text-[10px] mt-0.5 font-sans">
                        {pkt.note}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    {simASTMStep + 1 >= astmPackets.length ? "Handshake complete." : "Click to advance frame."}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSimASTMStep((prev) => Math.min(astmPackets.length - 1, prev + 1))}
                    disabled={simASTMStep >= astmPackets.length - 1}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white hover:brightness-110 disabled:opacity-40"
                  >
                    <span>Next Frame</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
