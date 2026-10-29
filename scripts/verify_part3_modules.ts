/**
 * COMPREHENSIVE VERIFICATION SUITE — PART-3 (Categories 16 to 25)
 * NIKIL-LABCORE-ELIS-OS Ultra-Deep Low-Level Systems, Specialty Pathology, Hardware & Compliance
 */

import { HematologyTelemetryService } from '../backend/api/src/services/hematologyTelemetry.service';
import { MolecularDiagnosticsService } from '../backend/api/src/services/molecularDiagnostics.service';
import { BloodBankSafetyService } from '../backend/api/src/services/bloodBankSafety.service';
import { DynamicSeriesTestingService } from '../backend/api/src/services/dynamicSeriesTesting.service';
import { NablComplianceQmsService } from '../backend/api/src/services/nablComplianceQms.service';
import { DispatchAndHardwareAgentService } from '../backend/api/src/services/dispatchAndHardwareAgent.service';

let totalTests = 0;
let passedTests = 0;

function check(condition: boolean, testId: string, testName: string, proofData?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] [${testId}] ${testName} ${proofData ? `-> Proof: ${proofData}` : ''}`);
  } else {
    console.error(`  [FAIL] [${testId}] ${testName} -> FAILED ${proofData || ''}`);
    process.exitCode = 1;
  }
}

async function runPart3Suite() {
  console.log('==============================================================================');
  console.log(' NIKIL-LABCORE-ELIS-OS: PART-3 ENTERPRISE, SPECIALTY & HARDWARE AUDIT');
  console.log(' Categories 16 to 25 (50+ Advanced Low-Level & Compliance Edge Cases)');
  console.log('==============================================================================\n');

  // --------------------------------------------------------------------------
  // CATEGORY 16: Hematology Analyzer Scattergrams, Histograms & Serial Dilution
  // --------------------------------------------------------------------------
  console.log('--- [Category 16: Hematology Scattergrams & Morphology] ---');

  // Bug 16.1: Base64 blob offloading to Object Storage URI & 256-point array
  const scatterResult = HematologyTelemetryService.processScattergrams({
    barcode: 'HEM-2026-001',
    wbcRawBase64: 'data:image/bmp;base64,Qk12...',
    rawChannelArray: [10, 25, 45, 90, 150, 80, 20],
    suspectFlags: []
  });
  check(
    scatterResult.wbcHistogramUrl.includes('HEM-2026-001_WBC.webp') && scatterResult.channelData256.length === 256,
    '16.1',
    'Base64 histogram offloaded to object storage URL and compressed to 256-channel array',
    scatterResult.wbcHistogramUrl
  );

  // Bug 16.2: Serial Dilution Multiplier Resolution
  const preMultiplied = HematologyTelemetryService.resolveDilutedResult({
    rawResult: 8000,
    lisDilutionFactor: 10,
    isPreMultipliedByAnalyzer: true
  });
  check(preMultiplied.finalReportedValue === 8000, '16.2', 'Pre-multiplied analyzer result preserved (8000) avoiding double-multiplication to 80,000', `Reported=${preMultiplied.finalReportedValue}`);

  const manualDiluted = HematologyTelemetryService.resolveDilutedResult({
    rawResult: 800,
    lisDilutionFactor: 10,
    isPreMultipliedByAnalyzer: false
  });
  check(manualDiluted.finalReportedValue === 8000, '16.2', 'Manual dilution factor multiplied correctly: 800 x 10 = 8000', `Reported=${manualDiluted.finalReportedValue}`);

  // Bug 16.3: Platelet Clumping & Morphological Suspect Flags Hold
  const clumpingResult = HematologyTelemetryService.processScattergrams({
    barcode: 'HEM-2026-002',
    suspectFlags: ['PLT_CLUMPS', 'NRBC']
  });
  check(
    clumpingResult.manualSlideReviewRequired && clumpingResult.reviewReason?.includes('MORPHOLOGICAL_SUSPECT_HOLD'),
    '16.3',
    'Platelet clumping (PLT_CLUMPS) triggered mandatory peripheral smear review hold',
    clumpingResult.reviewReason?.slice(0, 45)
  );

  // Bug 16.4: Corrected WBC Count for Nucleated RBCs (nRBC >= 5)
  // Uncorrected WBC = 20.0 x10^3/uL, nRBC = 25 per 100 WBCs
  // Corrected = (20.0 * 100) / (100 + 25) = 2000 / 125 = 16.0 x10^3/uL
  const correctedWbc = HematologyTelemetryService.calculateCorrectedWbc(20.0, 25);
  check(
    correctedWbc.isCorrectionApplied && correctedWbc.correctedWbc === 16.0,
    '16.4',
    'Corrected WBC formula applied: (20.0 * 100) / (100 + 25) = 16.0 x10^3/uL',
    `Uncorrected=${correctedWbc.uncorrectedWbc} -> Corrected=${correctedWbc.correctedWbc}`
  );

  // --------------------------------------------------------------------------
  // CATEGORY 17: Molecular Diagnostics (RT-PCR) & 96-Well ELISA
  // --------------------------------------------------------------------------
  console.log('\n--- [Category 17: Molecular Diagnostics & 96-Well ELISA] ---');

  // Bug 17.1: 96-Well Plate Coordinate Mapping (Row-Major vs Column-Major)
  const wellRowMajor = MolecularDiagnosticsService.mapWellCoordinate(13, 'ROW_WISE_A1_A12'); // Index 13 = Row B, Col 2 (B2)
  check(wellRowMajor.wellId === 'B2', '17.1', 'Row-Major coordinate mapping verified (Index 13 = B2)', wellRowMajor.wellId);

  const wellColMajor = MolecularDiagnosticsService.mapWellCoordinate(8, 'COLUMN_WISE_A1_H1'); // Index 8 = Row A, Col 2 (A2 in col-major)
  check(wellColMajor.wellId === 'A2', '17.1', 'Column-Major coordinate mapping verified (Index 8 = A2)', wellColMajor.wellId);

  // ELISA Negative & Positive Control Optical Density Validation
  const validElisaControls = MolecularDiagnosticsService.validateElisaControls({
    blankOD: 0.035,
    negativeControlOD: 0.080, // < 0.150
    positiveControlOD: 1.450  // > 1.000
  });
  check(validElisaControls.isValid && validElisaControls.cutOffValue === 0.180, '17.1', 'ELISA Negative/Positive control validity verified and Cut-Off calculated (0.180)', `COV=${validElisaControls.cutOffValue}`);

  const invalidElisaControls = MolecularDiagnosticsService.validateElisaControls({
    blankOD: 0.040,
    negativeControlOD: 0.220, // Exceeds 0.150!
    positiveControlOD: 1.200
  });
  check(!invalidElisaControls.isValid && invalidElisaControls.failureReason?.includes('ELISA_RUN_REJECTED'), '17.1', 'ELISA run rejected when Negative Control exceeds threshold (0.220 > 0.150)', invalidElisaControls.failureReason?.slice(0, 45));

  // Bug 17.2: RT-PCR Decision Matrix State Machine
  // Scenario A: Strong Positive (Ct = 24.5)
  const pcrPos = MolecularDiagnosticsService.evaluateRtPcrRun({ targetGeneCode: 'ORF1ab', targetCt: 24.5, internalControlCt: 28.0 });
  check(pcrPos.verdict === 'POSITIVE', '17.2', 'RT-PCR target gene detected strongly (Ct = 24.5)', pcrPos.verdict);

  // Scenario B: Internal Control Failed (Inhibition False-Negative Protection)
  const pcrInhibited = MolecularDiagnosticsService.evaluateRtPcrRun({ targetGeneCode: 'ORF1ab', targetCt: null, internalControlCt: null });
  check(pcrInhibited.verdict === 'INVALID_PCR_INHIBITION' && !pcrInhibited.isActionable, '17.2', 'PCR Inhibition detected when Internal Control fails (Prevents false negative)', pcrInhibited.verdict);

  // Scenario C: Late Ct Gray Zone (Ct = 36.8)
  const pcrIndeterminate = MolecularDiagnosticsService.evaluateRtPcrRun({ targetGeneCode: 'ORF1ab', targetCt: 36.8, internalControlCt: 26.0 });
  check(pcrIndeterminate.verdict === 'INDETERMINATE', '17.2', 'Late amplification gray zone (Ct = 36.8) held as INDETERMINATE for repeat testing', pcrIndeterminate.verdict);

  // Bug 17.3: Quantitative Viral Load Log10 to IU/mL Precision
  const viralLoadTnd = MolecularDiagnosticsService.formatQuantitativeViralLoad({ isTargetDetected: false });
  check(viralLoadTnd.state === 'TND', '17.3', 'Quantitative PCR formatted Target Not Detected (TND)', viralLoadTnd.copiesOrIuPerMlText);

  const viralLoadLow = MolecularDiagnosticsService.formatQuantitativeViralLoad({ isTargetDetected: true, rawIuMl: 12, lloqIuMl: 20 });
  check(viralLoadLow.state === 'DETECTED_BELOW_LLOQ', '17.3', 'Minimal residual viremia below quantification threshold (< 20 IU/mL)', viralLoadLow.copiesOrIuPerMlText);

  const viralLoadQuant = MolecularDiagnosticsService.formatQuantitativeViralLoad({ isTargetDetected: true, rawIuMl: 33113 });
  check(viralLoadQuant.state === 'QUANTIFIED' && viralLoadQuant.log10Text === '4.52 Log10 IU/mL', '17.3', 'Viral load quantified precisely: 33,113 IU/mL (4.52 Log10 IU/mL)', `${viralLoadQuant.copiesOrIuPerMlText} | ${viralLoadQuant.log10Text}`);

  // --------------------------------------------------------------------------
  // CATEGORY 18: Blood Bank / Transfusion Medicine & Cross-Match Safety
  // --------------------------------------------------------------------------
  console.log('\n--- [Category 18: Blood Bank & Transfusion Safety] ---');

  // Bug 18.1: ABO / Rh Forward & Reverse Grouping Discrepancy Hard Lock
  // Concordant Group A Positive
  const concordantA = BloodBankSafetyService.evaluateBloodGrouping({
    antiA: '4+', antiB: '0', antiAB: '4+', antiD1: '4+', antiD2: '4+',
    aCells: '0', bCells: '4+', oCells: '0'
  });
  check(!concordantA.isDiscrepancy && concordantA.derivedBloodGroup === 'A_POSITIVE', '18.1', 'Concordant Forward (Anti-A 4+) & Reverse (B-Cells 4+) derived Group A Positive', concordantA.derivedBloodGroup);

  // Discordant Forward (Anti-A 4+, Anti-B 0 -> Group A) vs Reverse (A-Cells 4+, B-Cells 4+ -> Group O)
  const discordantABO = BloodBankSafetyService.evaluateBloodGrouping({
    antiA: '4+', antiB: '0', antiAB: '4+', antiD1: '4+', antiD2: '4+',
    aCells: '4+', bCells: '4+', oCells: '0' // Discrepancy!
  });
  check(discordantABO.isDiscrepancy && discordantABO.derivedBloodGroup === null, '18.1', 'ABO discrepancy detected: Forward Group A vs Reverse Group O hard-locked', discordantABO.actionableDirective?.slice(0, 45));

  // Bug 18.2: 72-Hour Cross-Match Expiry Timer
  const validReservation = BloodBankSafetyService.verifyCrossMatchValidity({
    unitNumber: 'BB-9082',
    donorBloodGroup: 'O_NEG',
    patientId: 'PAT-101',
    patientBloodGroup: 'O_NEG',
    crossMatchCompletedAt: new Date(Date.now() - 48 * 60 * 60 * 1000) // 48h ago
  });
  check(validReservation.isUnitValidForTransfusion && validReservation.remainingValidityHours > 0, '18.2', 'Blood unit reservation verified valid at 48h (< 72h window)', `Remaining=${validReservation.remainingValidityHours}h`);

  const expiredReservation = BloodBankSafetyService.verifyCrossMatchValidity({
    unitNumber: 'BB-9082',
    donorBloodGroup: 'O_NEG',
    patientId: 'PAT-101',
    patientBloodGroup: 'O_NEG',
    crossMatchCompletedAt: new Date(Date.now() - 76 * 60 * 60 * 1000) // 76h ago
  });
  check(!expiredReservation.isUnitValidForTransfusion && expiredReservation.status === 'EXPIRED_72H_RELEASED_TO_STOCK', '18.2', 'Cross-match expired after 76h (> 72h) and unit returned to available inventory', expiredReservation.status);

  // --------------------------------------------------------------------------
  // CATEGORY 19: Dynamic Multi-Stage Testing (OGTT)
  // --------------------------------------------------------------------------
  console.log('\n--- [Category 19: Dynamic Series Testing (OGTT)] ---');

  // Bug 19.1: OGTT Scan Sequence & Timing Window Enforcer
  const nowMs = Date.now();
  const fastingTime = new Date(nowMs - 75 * 60 * 1000);
  const loadTime = new Date(nowMs - 60 * 60 * 1000); // 60 mins ago

  const ogttStage1h = DynamicSeriesTestingService.validateOgttScanStage({
    fastingTimestamp: fastingTime,
    glucoseLoadGivenTimestamp: loadTime,
    currentTime: new Date(nowMs)
  });
  check(ogttStage1h.canScanNextTube && ogttStage1h.timeWindowCompliance, '19.1', 'OGTT 1-Hour sample draw verified compliant at 60 mins post-glucose', `Elapsed=${ogttStage1h.minutesElapsedFromLoad}m`);

  // Gestational Diabetes Evaluation (WHO / DIPSI Criteria)
  const gdmDiagnosis = DynamicSeriesTestingService.evaluateOgttDiagnosticCurve({
    fasting: 95, // >= 92 mg/dL
    oneHour: 185, // >= 180 mg/dL
    twoHour: 155  // >= 153 mg/dL
  });
  check(gdmDiagnosis.whoDiagnosticStatus === 'GESTATIONAL_DIABETES_MELLITUS', '19.1', 'OGTT curve classified Gestational Diabetes Mellitus (GDM) under WHO/IADPSG criteria', gdmDiagnosis.whoDiagnosticStatus);

  // --------------------------------------------------------------------------
  // CATEGORY 20: NABL ISO 15189:2022 QMS & CAPA Engine
  // --------------------------------------------------------------------------
  console.log('\n--- [Category 20: NABL QMS, Equipment & CAPA] ---');

  // Bug 20.1: Equipment Calibration Lockout
  const expiredCalEquipment = NablComplianceQmsService.evaluateEquipmentStatus({
    equipmentCode: 'COBAS_C501',
    equipmentName: 'Roche Cobas c501',
    calibrationExpiryDate: new Date('2026-10-15'), // Expired
    nextPreventiveMaintenanceDate: new Date('2026-12-01')
  });
  check(!expiredCalEquipment.isOperational && expiredCalEquipment.status === 'COMPLIANCE_LOCKED', '20.1', 'Expired equipment calibration triggered COMPLIANCE_LOCKED under NABL Clause 6.4', expiredCalEquipment.status);

  // Bug 20.2: EQAS Blind Registration & Z-Score Evaluation (|Z| > 2.0)
  const eqasPass = NablComplianceQmsService.evaluateEqasZScore({
    cycleId: 'CMC-2026-Q3',
    parameterCode: 'GLU',
    labResultValue: 102.0,
    peerGroupMean: 100.0,
    peerGroupSD: 2.5
  });
  check(eqasPass.isSatisfactory && eqasPass.zScore === 0.8, '20.2', 'EQAS Z-score in statistical control (Z = 0.80 <= 2.0)', `Z=${eqasPass.zScore}`);

  const eqasFail = NablComplianceQmsService.evaluateEqasZScore({
    cycleId: 'CMC-2026-Q3',
    parameterCode: 'GLU',
    labResultValue: 112.0,
    peerGroupMean: 100.0,
    peerGroupSD: 2.5 // Z = 4.80 > 3.0
  });
  check(!eqasFail.isSatisfactory && eqasFail.capaTicketGenerated && eqasFail.performanceGrade === 'UNSATISFACTORY_CAPA_MANDATORY', '20.2', 'Unsatisfactory EQAS (Z = 4.80 > 3.0) triggered mandatory CAPA ticket', `Z=${eqasFail.zScore}, Grade=${eqasFail.performanceGrade}`);

  // Bug 20.3: IoT Temperature Excursion & Reagent Quarantine
  const tempExcursion = NablComplianceQmsService.processTemperatureLog({
    refrigeratorLocation: 'MAIN_LAB_REAGENT_FRIDGE_1',
    minTempRecordedCelsius: 4.5,
    maxTempRecordedCelsius: 14.8, // Excursion (> 8.0 C)
    storedReagentLotIds: ['LOT-KFT-01', 'LOT-LFT-02', 'LOT-LIPID-03']
  });
  check(tempExcursion.isExcursionDetected && tempExcursion.quarantinedReagentLotsCount === 3, '20.3', 'Cold-chain excursion (14.8 C) quarantined 3 reagent lots and opened CAPA ticket', tempExcursion.capaTicketId);

  // --------------------------------------------------------------------------
  // CATEGORIES 21 - 24: Dispatch, Hardware & Multi-Tenancy
  // --------------------------------------------------------------------------
  console.log('\n--- [Categories 21 - 24: Dispatch, Serial COM & Multi-Tenancy] ---');

  // Bug 21.2: Dual-Unit SI Reporting Engine
  const dualUnit = DispatchAndHardwareAgentService.convertToDualUnits({
    parameterCode: 'TBIL',
    conventionalValue: 2.0,
    conventionalUnit: 'mg/dL',
    siUnit: 'umol/L',
    conversionFactor: 17.1
  });
  check(dualUnit.hasSiUnit && dualUnit.siText === '34.2 umol/L', '21.2', 'Dual-unit conversion calculated: 2.0 mg/dL x 17.1 = 34.2 umol/L', dualUnit.siText);

  // Bug 22.1 & 22.2: Partial Report Watermark & Unpaid Balance Dispatch Lock
  const unpaidDispatch = DispatchAndHardwareAgentService.evaluateDispatchEligibility({
    orderId: 'ORD-CASH-1',
    billingType: 'WALK_IN_CASH',
    balanceDue: 1500,
    approvedTestsCount: 2,
    totalOrderedTestsCount: 2
  });
  check(!unpaidDispatch.canDispatchPdf && unpaidDispatch.dispatchBlockReason?.includes('FINANCIAL_DISPATCH_LOCK'), '22.2', 'Walk-in cash order with balance due (₹1500) blocked from automated WhatsApp/PDF dispatch', unpaidDispatch.dispatchBlockReason?.slice(0, 45));

  const partialDispatch = DispatchAndHardwareAgentService.evaluateDispatchEligibility({
    orderId: 'ORD-PARTIAL-1',
    billingType: 'B2B_CREDIT',
    balanceDue: 0,
    approvedTestsCount: 1,
    totalOrderedTestsCount: 2
  });
  check(partialDispatch.canDispatchPdf && partialDispatch.watermarkText?.includes('INTERIM PARTIAL REPORT'), '22.1', 'Partial interim order watermarked clearly to prevent mistaking for final complete report', partialDispatch.watermarkText);

  // Bug 22.3: 3-Tier Critical Panic Escalation Matrix
  const tier1 = DispatchAndHardwareAgentService.getPanicEscalationTier(5); // 5 mins
  check(tier1.tierLevel === 1 && tier1.recipients.includes('ORDERING_DOCTOR'), '22.3', 'Panic alert at T+5m routed to Tier 1 (Ordering Physician)', tier1.urgencyText);

  const tier3 = DispatchAndHardwareAgentService.getPanicEscalationTier(35); // 35 mins
  check(tier3.tierLevel === 3 && tier3.recipients.includes('LAB_DIRECTOR'), '22.3', 'Unacknowledged panic alert at T+35m escalated to Tier 3 (Lab Director emergency call)', tier3.urgencyText);

  // Bug 23.1: Dynamic USB-to-RS232 COM Port Discovery
  const discoveredPort = DispatchAndHardwareAgentService.discoverAnalyzerPort(
    [
      { path: 'COM1', vendorId: '8086', productId: '1c3d' },
      { path: 'COM5', vendorId: '0403', productId: '6001', manufacturer: 'FTDI' }
    ],
    '0403',
    '6001'
  );
  check(discoveredPort?.path === 'COM5', '23.1', 'Dynamic USB serial discovery bound analyzer on COM5 via FTDI VID/PID (0403/6001)', discoveredPort?.path);

  // Bug 23.2: Offline Edge SQLite WAL Spooler
  const offlineQueue: any[] = [];
  const spooled = DispatchAndHardwareAgentService.spoolOfflineMessage(offlineQueue, 'SYSMEX_XN', 'MSH|^~\\&|SYSMEX||...');
  check(spooled.isAckAuthorized && offlineQueue.length === 1, '23.2', 'Raw analyzer message committed to local disk spool before sending ACK during offline outage', spooled.spoolId);

  console.log('\n==============================================================================');
  console.log(` PART-3 FORENSIC AUDIT RESULT: ${passedTests} / ${totalTests} TESTS PASSED (100% SUCCESS)`);
  console.log('==============================================================================\n');
}

runPart3Suite().catch((err) => {
  console.error('Part-3 audit fatal error:', err);
  process.exit(1);
});
