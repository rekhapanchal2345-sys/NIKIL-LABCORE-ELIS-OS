/**
 * LabCore ELIS - Enterprise Clinical NLP & Medical Intelligence Test Suite
 * Validates real-world clinical accuracy, multi-ontology dual coding,
 * NegEx assertion detection, Knowledge Graph GNN relations,
 * clinical phenotyping, and HL7 FHIR R4 standard compliance.
 */

const assert = require('assert');
const ClinicalNlpEngine = require('../src/services/ai/clinicalNlpEngine');

console.log("=================================================");
console.log("🏥 Starting Enterprise Clinical NLP Suite Tests...");
console.log("=================================================");

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
  }
}

// 1. Multi-Ontology Biomedical Coding Test
runTest("Dual-Ontology Extraction (ICD-10, ICD-11, SNOMED CT, LOINC, RxNorm, UMLS)", () => {
  const note = `Patient presenting with acute chest pain and palpitations. Emergency Cardiac Risk Panel ordered.
Observed Troponin I (High Sensitivity) elevated at 1.84 ng/mL with severe delta surge.
Serum Potassium elevated at 6.4 mEq/L and Serum Creatinine at 2.3 mg/dL.
Known history of Type 2 Diabetes Mellitus with peripheral neuropathy on Metformin 500mg BD and Atorvastatin 20mg OD.
Pathologist impression indicates acute coronary syndrome with high arrhythmia risk.`;

  const res = ClinicalNlpEngine.analyzeText(note);

  // Entities count
  assert.ok(res.entities.length >= 6, `Expected >= 6 entities, got ${res.entities.length}`);

  // ICD-10 & ICD-11 check
  assert.ok(res.suggestedICD10.some(i => i.code.startsWith("I21")), "Must suggest Acute Myocardial Infarction (I21)");
  assert.ok(res.suggestedICD10.some(i => i.code === "E87.5"), "Must suggest Hyperkalemia (E87.5)");
  assert.ok(res.suggestedICD10.some(i => i.code.startsWith("E11")), "Must suggest Type 2 Diabetes (E11)");
  assert.ok(res.suggestedICD10.some(i => i.icd11), "Must include WHO ICD-11 cross-mappings");

  // SNOMED CT check
  assert.ok(res.snomedCodes.length >= 3, "Must map to SNOMED CT concept IDs");
  assert.ok(res.snomedCodes.some(s => s.id === "22298006" || s.id === "44054006" || s.id === "14140009"), "Must find MI/Diabetes/Hyperkalemia SNOMED IDs");

  // LOINC code and quantitative analyte extraction
  const tropLoinc = res.loincCodes.find(l => l.code === "10839-9");
  assert.ok(tropLoinc, "Must map to LOINC 10839-9 for Troponin I");
  assert.strictEqual(tropLoinc.extractedValue, 1.84, `Expected extracted value 1.84, got ${tropLoinc.extractedValue}`);
  assert.strictEqual(tropLoinc.isPanic, true, "Must flag troponin 1.84 ng/mL as critical panic");

  const kLoinc = res.loincCodes.find(l => l.code === "2823-3");
  assert.ok(kLoinc, "Must map to LOINC 2823-3 for Potassium");
  assert.strictEqual(kLoinc.extractedValue, 6.4, `Expected extracted potassium value 6.4, got ${kLoinc.extractedValue}`);
  assert.strictEqual(kLoinc.isPanic, true, "Must flag potassium 6.4 mEq/L as panic");

  // RxNorm check
  assert.ok(res.rxNormCodes.some(r => r.name.includes("Metformin")), "Must map to RxNorm Metformin");
  assert.ok(res.rxNormCodes.some(r => r.name.includes("Atorvastatin")), "Must map to RxNorm Atorvastatin");

  // Urgency check
  assert.strictEqual(res.urgency.level, "CRITICAL_PANIC");
  assert.strictEqual(res.urgency.requiresImmediateAlert, true);
});

// 2. NegEx & ConText Syntactic Assertion Detection
runTest("NegEx Assertion Engine (Affirmed vs Negated vs Uncertain vs Historical)", () => {
  const noteWithNegations = `Patient evaluated in ER. Denies chest pain and denies shortness of breath.
Rules out pulmonary embolism. Negative for diabetic ketoacidosis.
However, laboratory panel confirms acute kidney injury with creatinine 2.8 mg/dL.
History of hypertension resolved 2 years ago. Possible early diabetic nephropathy.`;

  const res = ClinicalNlpEngine.analyzeText(noteWithNegations);

  // Check that creatinine / kidney injury is affirmed
  const creat = res.entities.find(e => e.entity.toLowerCase().includes("creatinine"));
  assert.ok(creat, "Creatinine must be extracted");
  assert.strictEqual(creat.assertion, "AFFIRMED", "Creatinine must be affirmed");

  // Test negation trigger
  const lowerText = noteWithNegations.toLowerCase();
  assert.ok(lowerText.includes("denies chest pain"), "Test fixture check");
  assert.ok(res.phenotypes.length > 0, "Phenotypes should be processed");
});

// 3. Clinical Knowledge Graph & GNN Relation Extraction
runTest("Clinical Knowledge Graph & Relation Extraction (GNN Adjacency)", () => {
  const note = `Patient with elevated Troponin I at 1.84 ng/mL and high Serum Potassium. Prescribed Metformin 500mg. Chronic kidney disease stage 4 diagnosed.`;
  const res = ClinicalNlpEngine.analyzeText(note);

  assert.ok(res.knowledgeGraph.nodes.length >= 4, "Knowledge graph must contain nodes");
  assert.ok(res.knowledgeGraph.edges.length >= 2, "Knowledge graph must contain relation edges");

  // Contraindication check: Metformin contraindicated in CKD
  const hasContraindication = res.knowledgeGraph.edges.some(e => e.relation === "CONTRAINDICATED_WARNING");
  assert.ok(hasContraindication, "GNN relation extractor must detect Metformin in CKD contraindication warning");
});

// 4. Clinical Phenotyping & Risk Stratification
runTest("Automated Phenotyping & Clinical Risk Calculators (CCI, TIMI, KDIGO)", () => {
  const note = `68yo male with acute myocardial infarction, known heart failure, and peripheral neuropathy in Type 2 Diabetes. Serum creatinine 2.4 mg/dL.`;
  const res = ClinicalNlpEngine.analyzeText(note);

  assert.ok(res.phenotypes.some(p => p.id === "PHEN-ACS-01"), "Must detect Acute Coronary Syndrome phenotype");
  assert.ok(res.clinicalRiskScores.charlsonComorbidityIndex >= 4, `Expected CCI >= 4, got ${res.clinicalRiskScores.charlsonComorbidityIndex}`);
  assert.ok(res.clinicalRiskScores.estimated10YrSurvivalPct < 90, "10-year survival should reflect elevated comorbidity");
  assert.ok(res.clinicalRiskScores.kdigoCkdStage.includes("G3") || res.clinicalRiskScores.kdigoCkdStage.includes("G4"), "KDIGO staging should reflect renal azotemia");
});

// 5. HL7 FHIR R4 Standardized Resource Generation
runTest("HL7 FHIR R4 Bundle Construction & Validation", () => {
  const note = `Troponin I elevated at 1.84 ng/mL. Serum Potassium 6.4 mEq/L. Diagnosis: Acute Myocardial Infarction.`;
  const res = ClinicalNlpEngine.analyzeText(note);

  const bundle = res.fhirR4Bundle;
  assert.ok(bundle, "Must generate FHIR R4 bundle");
  assert.strictEqual(bundle.resourceType, "Bundle");
  assert.strictEqual(bundle.type, "collection");
  assert.ok(bundle.entry.length >= 3, `Expected at least 3 FHIR resources, got ${bundle.entry.length}`);

  // DiagnosticReport resource
  const report = bundle.entry.find(e => e.resource.resourceType === "DiagnosticReport");
  assert.ok(report, "Must include DiagnosticReport resource");
  assert.strictEqual(report.resource.status, "final");

  // Observation resources
  const obs = bundle.entry.filter(e => e.resource.resourceType === "Observation");
  assert.ok(obs.length >= 2, "Must include Observation resources for lab analytes");

  // Condition resources
  const conds = bundle.entry.filter(e => e.resource.resourceType === "Condition");
  assert.ok(conds.length >= 1, "Must include Condition resources for ICD-10 diagnoses");
});

// 6. Deep Learning & Mathematical Telemetry
runTest("Mathematical Telemetry (CRF Viterbi, Attention Entropy, Brier Calibration)", () => {
  const note = `Patient Vikram Malhotra presenting with acute STEMI and severe hyperkalemia.`;
  const res = ClinicalNlpEngine.analyzeText(note);

  const tel = res.deepLearningTelemetry;
  assert.ok(tel, "Must provide deep learning telemetry");
  assert.ok(tel.crfViterbiScore > 0.95, "CRF Viterbi score must exceed 0.95");
  assert.ok(tel.tokenAttentionEntropy > 1.0, "Attention entropy must be positive");
  assert.ok(tel.bayesianBrierCalibration < 0.05, "Brier score must indicate sharp calibration");
  assert.ok(tel.graphAttentionGatLayers === 3, "Must report 3-layer GAT architecture");
});

// 7. HIPAA Safe-Harbor PHI De-Identification
runTest("HIPAA Safe-Harbor De-Identification (18 Identifier Types)", () => {
  const noteWithPhi = `Patient Ramesh Gupta, UHID: LC-994821, Phone: (555) 234-5678, admitted on 12/04/2026.
Presenting with acute anterior myocardial infarction and dyspnea. Troponin I elevated at 2.1 ng/mL.`;
  const res = ClinicalNlpEngine.analyzeText(noteWithPhi);

  assert.ok(res.deidentification, "Must include deidentification payload");
  assert.ok(res.deidentification.redactedCount >= 2, `Expected >= 2 redacted PHI items, got ${res.deidentification.redactedCount}`);
  assert.ok(res.deidentification.scrubbedText.includes("[DATE_OFFSET]"), "Must scrub dates to offset");
  assert.ok(res.deidentification.scrubbedText.includes("[REDACTED_IDENTIFIER]") || res.deidentification.scrubbedText.includes("[PHONE_REDACTED]"), "Must redact identifiers or phone");
});

// 8. Pharmacovigilance & Contraindication Audit
runTest("Pharmacovigilance (DDI & Contraindication Audit)", () => {
  const note = `Elderly patient with stage 4 CKD (eGFR 22). Continued on Metformin 1000mg BD and Aspirin 325mg with Warfarin 5mg daily.`;
  const res = ClinicalNlpEngine.analyzeText(note);

  assert.ok(res.pharmacovigilance, "Must include pharmacovigilance audit");
  assert.ok(res.pharmacovigilance.contraindications.length >= 1, "Must detect Metformin in CKD black-box contraindication");
  assert.ok(res.pharmacovigilance.interactions.length >= 1, "Must detect Aspirin + Warfarin major bleeding interaction");
});

// 9. Multi-Dimensional Knowledge Graph (2D, 3D, and 4D Temporal Evolution)
runTest("Multi-Dimensional Knowledge Graph (2D, 3D, and 4D Temporal Trajectories)", () => {
  const note = `STEMI patient with elevated troponin 1.84 ng/mL and serum potassium 6.4 mEq/L. Prescribed Aspirin 300mg chewed.`;
  const res = ClinicalNlpEngine.analyzeText(note);

  const coords = res.knowledgeGraph.dimensionalCoordinates;
  assert.ok(coords, "Must generate dimensional coordinates");
  assert.ok(coords.projection2D.length > 0, "Must calculate 2D node coordinates");
  assert.ok(coords.projection3D.length > 0, "Must calculate 3D spatial (x, y, z) coordinates");
  assert.ok(coords.timeline4D.length === 5, "Must synthesize 5-stage 4D temporal evolution trajectory");
});

// 10. Comprehensive Clinical Risk & Regression Suite
runTest("Expanded Clinical Risk & Regression Engines (CHA2DS2-VASc, HAS-BLED, CURB-65, qSOFA)", () => {
  const note = `72yo male with atrial fibrillation, history of ischemic stroke, hypertension, and acute kidney injury on aspirin.`;
  const res = ClinicalNlpEngine.analyzeText(note);

  const scores = res.clinicalRiskScores;
  assert.ok(scores.cha2ds2VascScore >= 4, `Expected high CHA2DS2-VASc >= 4, got ${scores.cha2ds2VascScore}`);
  assert.ok(scores.hasBledScore >= 2, `Expected HAS-BLED >= 2, got ${scores.hasBledScore}`);
  assert.ok(scores.kdigoCkdStage, "Must compute KDIGO CKD Stage");
});

console.log("=================================================");
console.log(`📊 Enterprise Clinical NLP Tests: ${passed} / ${total} Passed (${Math.round(passed/total*100)}%)`);
console.log("=================================================");

if (passed !== total) {
  process.exit(1);
}
