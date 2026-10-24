# NEXUS_INTEGRATION_GAP_ANALYSIS.md
**Document Reference:** `NEXUS-INTGAP-2026-PROD-01`  
**System:** NIKIL-LABCORE-ELIS-OS — Laboratory Interfacing & Protocol Layer  
**Audit Date:** 2026-10-23  

---

## 1. Instrument Interface Architecture & Protocols

Clinical diagnostic instruments interface with Laboratory Information Systems via three standardized communication architectures:
1. **ASTM E1381-02 / ASTM E1394-97**: Low-level serial/TCP byte framing with `<STX>`, frame number, text, `<ETX>`/`<ETB>`, modulo-256 checksum, `<CR><LF>`, coordinated by `<ENQ>`, `<ACK>`, `<NAK>`, `<EOT>`.
2. **HL7 v2.5.1 over MLLP**: Minimal Lower Layer Protocol (`<VT> = 0x0B`, payload, `<FS><CR> = 0x1C 0x0D`), exchanging `ORU^R01` (unsolicited observations) and `ACK^R01`.
3. **Vendor Middleware / IHE LAW (Laboratory Analytical Workflow)**: High-throughput Total Laboratory Automation (TLA) tracks (Roche cobas infinity, Abbott GLP, Inpeco, Siemens Aptio) communicating specimen tracking events (`ESU^U01`, `SSR^U04`).

---

## 2. Supported Instrument Compatibility & Interface Register

| Target Instrument | Manufacturer | Interface Protocol | Physical Layer | Current Repo Status | Technical Prerequisites for Live Commissioning |
|---|---|---|---|---|---|
| **Sysmex XN-1000 / XN-550** | Sysmex Corporation | ASTM E1381 / E1394-97 (or HL7 v2.5) | TCP/IP Socket | **C (Implemented in `AstmFsmParser.ts`)** | 1. Vendor IP/Port configuration.<br>2. Parameter code mapping (WBC, RBC, HGB, PLT, NEUT%, LYMPH%).<br>3. Binary WBC scattergram/histogram packet handling.<br>4. ASTM contention resolution verification. |
| **Roche cobas pro / pure (c 503 / c 303)** | Roche Diagnostics | ASTM E1394-97 / cobas IT middleware | TCP/IP Socket | **C (Implemented in `AstmFsmParser.ts`)** | 1. Host Query mode (`Q` record) mapping for bidirectional barcode test order retrieval.<br>2. Serum index (`S.IND`) observation parsing.<br>3. Reagent lot/cassette status capture. |
| **Abbott Alinity ci-series / ARCHITECT** | Abbott Laboratories | HL7 v2.5.1 / ASTM E1394 | TCP/IP (MLLP) | **C (Implemented in `analyzer.tcp.service.ts`)** | 1. MLLP start/end block framing validation.<br>2. `MSH-10` Message Control ID tracking and `MSA` acknowledgment generation.<br>3. Reflex test code mapping. |
| **Stago STA R Max / STA Compact Max** | Diagnostica Stago | ASTM E1381 / E1394-97 | RS-232 via TCP Terminal Server | **C (Generic ASTM Support)** | 1. MOXA NPort baud/parity configuration (9600, 8, N, 1).<br>2. Coagulation curve intermediate data discarding or storage.<br>3. PT/INR, aPTT, D-Dimer code tables. |
| **Total Laboratory Automation (TLA) Track** | MagneMotion / Beckhoff / Inpeco | IHE LAW / HL7 v2.5.1 | Industrial Ethernet / Middleware | **B (Simulated in `Virtual3DWorldModel.tsx`)** | **HARDWARE DISCONNECTED**: No direct PLC EtherCAT bridge exists. Retain clear `SIMULATED` label; provide documented adapter contracts. |

---

## 3. Protocol & Reliability Hardening Requirements

### 3.1 Contention Backoff Protocol (ASTM E1381 §6.2.2)
When both Host and Instrument simultaneously emit `<ENQ>` (line contention):
- **Rule**: The Instrument has transmission priority.
- **Action**: Host must immediately defer, cancel its own transmission, send `<ACK>` to accept the Instrument's transmission, and wait at least $1.0\,\text{second}$ after Instrument finishes (`<EOT>`) before attempting to re-transmit Host orders.

### 3.2 Modulo-8 Frame Sequencing & Checksum Verification
- Frames must follow sequential numbering: `1, 2, 3, 4, 5, 6, 7, 0, 1...`
- Modulo-256 checksum: $\text{CS} = \left(\sum_{b \in [\text{frameNo} \dots \text{ETX}]} b\right) \bmod 256$, formatted as 2 uppercase hex ASCII characters.
- Out-of-sequence frame numbers or checksum mismatches must be answered with `<NAK>`.
- Consecutive `<NAK>` limit: If 6 consecutive `<NAK>` responses occur on the same frame, abort transmission with `<EOT>` and alert operator.

### 3.3 Message Deduplication & Dead-Letter Queue (DLQ)
- Instrument retry bursts (caused by transient network drops before `<ACK>` reaches the analyzer) must not result in duplicate test records.
- **Idempotency Key**:
  $$\text{Hash} = \text{SHA256}(\text{orgId} \parallel \text{analyzerId} \parallel \text{specimenBarcode} \parallel \text{testCode} \parallel \text{value} \parallel \text{timestamp})$$
- When a matching hash is detected:
  1. Record log event `DUPLICATE_IGNORED` in `instrument_message_journal`.
  2. Send standard `<ACK>` to satisfy the instrument.
  3. Discard duplicate insert to protect database integrity.
- Malformed frames or unmatched specimens must route to `instrument_message_journal` with status `DEAD_LETTER` for operator triage.

### 3.4 Zero-PII Invariant on External AI & Third-Party Gateways
- Third-party endpoints (`gemini.service.ts`, WhatsApp API) must never receive raw patient names, UHID, national IDs, or unapproved pathology results.
- Prompts must pass through an automated scrubber replacing sensitive patient identifiers with cryptographic de-identified hashes.
