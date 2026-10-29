# NIKIL-LABCORE-ELIS-OS: Enterprise Clinical NLP Architecture

## 1. Core Philosophy (Real-World, No Sci-Fi)
100% AI accuracy in medicine is a statistical myth if left unmonitored. The "Real-World" approach achieves **100% Workflow Safety** through a Human-in-the-Loop (HITL) architecture, Confidence Gating, and deterministic Ontology Mapping.

## 2. High-Level Design (HLD)
The system is divided into 4 mission-critical microservices:
1. **Ingestion Engine**: Parses raw HL7 v2.x, FHIR resources, and OCR from physical lab requisition forms.
2. **NLP Inference Pipeline**: Uses ClinicalBERT & PubMedBERT (fine-tuned) for NER (Named Entity Recognition) to extract Symptoms, Lab Tests, Medications, and Vitals.
3. **Knowledge Graph (GNN) Engine**: Maps extracted entities to standardized ontologies (SNOMED-CT, LOINC, ICD-10) using Graph Neural Networks to establish clinical relationships.
4. **Verification & Output**: Pathologist dashboard for reviewing predictions. Only predictions with >99.9% confidence bypass human review.

## 3. Low-Level Design (LLD) & Math
### Graph Neural Networks (GNN)
- **Algorithm**: Relational Graph Convolutional Networks (R-GCNs).
- **Purpose**: To understand that "Elevated HbA1c" (Test Result) and "Polyuria" (Symptom) point towards a specific node in the SNOMED-CT graph (Diabetes Mellitus).

### Regression & Probability Calibration
- **Algorithm**: Isotonic Regression / Platt Scaling.
- **Purpose**: LLMs often output uncalibrated probabilities. We use Isotonic Regression to calibrate the output so a "95% confidence" score actually translates to a 95% real-world probability.

## 4. UI/UX Specifications (Ultra Light White Enterprise)
- **Palette**: `#FFFFFF` (Primary BG), `#F8FAFC` (Secondary BG), `#E2E8F0` (Borders), `#0EA5E9` (Accent/Focus), `#0F172A` (Primary Text).
- **Typography**: Inter / Roboto (High legibility, variable fonts).
- **Layout**: 100% Viewport height/width, collapsible navigation, dense data grids (ag-Grid), split-screen dual-pane viewers (Raw Document vs. Structured Output).

## 5. NABL ISO 15189:2022 Compliance
- Every NLP extraction is tied to a distinct Audit Trail ID.
- Digital signature mapping ensures that if the NLP modifies a critical value, a verified Pathologist must cryptographically sign off on it.
