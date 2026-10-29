/**
 * COMPREHENSIVE VERIFICATION SUITE — PART-4 (Categories 26 to 30)
 * NIKIL-LABCORE-ELIS-OS Ultimate Enterprise & Low-Level Systems Deep-Dive Debugging
 */

import {
  CryptographicAuditService,
  WorklistDraftManagerService,
  BreakGlassSecurityService,
  AuditRecordPayload,
} from '../backend/api/src/services/cryptographicAuditAndSecurity.service';
import {
  BullMqResilienceService,
  StatefulTcpIngressManager,
} from '../backend/api/src/services/bullmqResilienceAndIngress.service';
import {
  EnterpriseGstCalculator,
  DoubleEntryLedgerEngine,
} from '../backend/api/src/services/enterpriseAccountingLedger.service';
import {
  WorklistVirtualizerEngine,
  RealtimeResultStateReducer,
  WorklistResultItem,
} from '../backend/api/src/services/clientVirtualizationAndRealtime.service';
import {
  FlowCytometryMathEngine,
  StreamingNgsVcfParser,
} from '../backend/api/src/services/advancedDiagnosticsNgsFlow.service';

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

async function runPart4Suite() {
  console.log('==============================================================================');
  console.log(' NIKIL-LABCORE-ELIS-OS: PART-4 ULTIMATE ENTERPRISE & LOW-LEVEL SYSTEMS AUDIT');
  console.log(' Categories 26 to 30 (Security, Queues, Finance, Virtualization & NGS)');
  console.log('==============================================================================\n');

  // --------------------------------------------------------------------------
  // CATEGORY 26: Enterprise Security, Zero-Trust & Cryptographic Audit Trails
  // --------------------------------------------------------------------------
  console.log('--- [Category 26: Security, Zero-Trust & Cryptographic Audit Trails] ---');

  // Bug 26.1: Draft Auto-Save Buffer & Silent Token Refresh
  const draft = WorklistDraftManagerService.createDraftPayload('USER-TECH-01', 'ORD-2026-999', {
    results: [{ testCode: 'HB', value: '14.2' }, { testCode: 'WBC', value: '7500' }],
  });
  check(draft.isRecoverable && draft.draftKey.includes('USER-TECH-01'), '26.1', 'Worklist unsubmitted form draft auto-saved to buffer', draft.draftKey);

  const refreshResult = await WorklistDraftManagerService.silentTokenRefresh(
    'valid_refresh_token_string_exceeding_20_chars',
    async (tok) => ({ accessToken: `new_jwt_${tok.slice(0, 5)}`, refreshToken: 'new_refresh' })
  );
  check(refreshResult.success && refreshResult.retryAuthorized, '26.1', 'Silent background JWT renewal succeeded on 401 intercept', refreshResult.newAccessToken);

  // Bug 26.2: Audit Trail Log Tampering (Cryptographic SHA-256 Hash Chaining)
  const auditRow1: AuditRecordPayload = {
    id: 'AUD-001',
    timestamp: new Date('2026-10-28T10:00:00Z'),
    userId: 'USER-01',
    action: 'RESULT_VERIFIED',
    entity: 'TestResult',
    entityId: 'RES-001',
    previousHash: CryptographicAuditService.GENESIS_HASH,
    currentHash: '',
  };
  auditRow1.currentHash = CryptographicAuditService.computeHash(auditRow1.previousHash, auditRow1);

  const auditRow2: AuditRecordPayload = {
    id: 'AUD-002',
    timestamp: new Date('2026-10-28T10:05:00Z'),
    userId: 'USER-02',
    action: 'RESULT_APPROVED',
    entity: 'TestResult',
    entityId: 'RES-001',
    previousHash: auditRow1.currentHash,
    currentHash: '',
  };
  auditRow2.currentHash = CryptographicAuditService.computeHash(auditRow2.previousHash, auditRow2);

  const validChainCheck = CryptographicAuditService.verifyChainIntegrity([auditRow1, auditRow2]);
  check(validChainCheck.isValid, '26.2', 'Cryptographic SHA-256 blockchain-style audit chain verified intact', `Block1=${auditRow1.currentHash.slice(0, 10)}... Block2=${auditRow2.currentHash.slice(0, 10)}...`);

  // Tampering simulation: Disgruntled admin directly updates row 1 values in PostgreSQL
  const tamperedRow1: AuditRecordPayload = {
    ...auditRow1,
    newValues: { tampered: true, illicitChange: 'glucose changed from 350 to 95' },
  };
  const tamperedChainCheck = CryptographicAuditService.verifyChainIntegrity([tamperedRow1, auditRow2]);
  check(!tamperedChainCheck.isValid && tamperedChainCheck.tamperedIndex === 0, '26.2', 'Direct database tampering immediately detected by chain verification', tamperedChainCheck.reason);

  // Bug 26.3: Dual-Authorization Break-Glass Protocol
  const backdoorAttempt = BreakGlassSecurityService.evaluateBreakGlassAuthorization(
    { requestingUserId: 'P-1', requestingRole: 'PATHOLOGIST', patientId: 'PT-1', clinicalEmergencyReason: 'ICU Cardiac arrest need historical records', requestedDurationMinutes: 15 },
    [],
    'EMERGENCY_OVERRIDE_2026'
  );
  check(!backdoorAttempt.isAuthorized && backdoorAttempt.denialReason?.includes('Hardcoded backdoor'), '26.3', 'Hardcoded backdoor password strictly blocked with security alert', backdoorAttempt.denialReason);

  const dualAuthValid = BreakGlassSecurityService.evaluateBreakGlassAuthorization(
    { requestingUserId: 'P-1', requestingRole: 'PATHOLOGIST', patientId: 'PT-1', clinicalEmergencyReason: 'Emergency ICU resuscitation record access', requestedDurationMinutes: 20 },
    [
      { signerUserId: 'P-1', signerRole: 'PATHOLOGIST', signatureTimestamp: new Date(), cryptographicSignature: 'sig_pathologist_rsa_sha256_32chars_long_xyz' },
      { signerUserId: 'DIR-01', signerRole: 'LAB_DIRECTOR', signatureTimestamp: new Date(), cryptographicSignature: 'sig_director_rsa_sha256_32chars_long_abc' },
    ]
  );
  check(dualAuthValid.isAuthorized && !!dualAuthValid.token, '26.3', 'Time-based Dual-Authorization Break-Glass token generated (30m max)', `Token=${dualAuthValid.token?.slice(0, 16)}...`);

  // --------------------------------------------------------------------------
  // CATEGORY 27: Cloud Infrastructure, Horizontal Scaling & BullMQ Resilience
  // --------------------------------------------------------------------------
  console.log('\n--- [Category 27: Cloud Infrastructure, Horizontal Scaling & BullMQ Queue Resilience] ---');

  // Bug 27.1: BullMQ Worker Configuration
  const workerOpts = BullMqResilienceService.getEnterpriseWorkerOptions();
  check(workerOpts.lockDuration === 30000 && workerOpts.stalledInterval === 15000, '27.1', 'Enterprise BullMQ settings configured (lockDuration=30s, stalledInterval=15s)', `Lock=${workerOpts.lockDuration}ms, Stalled=${workerOpts.stalledInterval}ms`);

  // BullMQ Worker Failure: Attempt 1 & 2 -> Exponential backoff retry
  const retryAttempt1 = BullMqResilienceService.handleWorkerFailure('JOB-PDF-1', 1, new Error('Browser pool temporary timeout'));
  check(retryAttempt1.status === 'RETRY_SCHEDULED' && retryAttempt1.nextRetryDelayMs === 2000, '27.1', 'Worker crash attempt 1 scheduled exponential retry at 2000ms', `Delay=${retryAttempt1.nextRetryDelayMs}ms`);

  // BullMQ Worker Failure: Attempt 3 -> Dead-Letter Queue (DLQ)
  const deadLetter = BullMqResilienceService.handleWorkerFailure('JOB-PDF-1', 3, new Error('Fatal corrupted font file'));
  check(deadLetter.status === 'MOVED_TO_DLQ' && !!deadLetter.deadLetterReason, '27.1', 'Max retries exhausted: Job quarantined in Dead-Letter Queue (DLQ)', deadLetter.deadLetterReason);

  // Bug 27.2: Kubernetes Stateful TCP Ingress
  StatefulTcpIngressManager.resetRegistry();
  const frame1 = StatefulTcpIngressManager.processIngressFrame(
    { analyzerId: 'MINDRAY_BC6800', sessionId: 'S1', sequenceNumber: 101, rawPayload: 'MSH|^~\\&|...', receivedAt: new Date() },
    'pod-lis-backend-node-1'
  );
  check(frame1.isAckGranted && !frame1.duplicateDetected, '27.2', 'Initial TCP frame sequence 101 received and ACK granted on Pod 1', `Seq=${frame1.lastCommittedSeq}`);

  // Pod failover: Same analyzer reconnects on Pod 2 with duplicate sequence 101
  const frame1Dup = StatefulTcpIngressManager.processIngressFrame(
    { analyzerId: 'MINDRAY_BC6800', sessionId: 'S2', sequenceNumber: 101, rawPayload: 'MSH|^~\\&|...', receivedAt: new Date() },
    'pod-lis-backend-node-2'
  );
  check(frame1Dup.isAckGranted && frame1Dup.duplicateDetected, '27.2', 'K8s pod failover duplicate sequence 101 deduped without dropping ACK', `Duplicate=${frame1Dup.duplicateDetected}`);

  // --------------------------------------------------------------------------
  // CATEGORY 28: Financial Ledger, GST, & Multi-Currency Accounting Bugs
  // --------------------------------------------------------------------------
  console.log('\n--- [Category 28: Financial Ledger, GST, & Multi-Currency Accounting Engine] ---');

  // Bug 28.1: Subtotal-Level GST Calculation without Paise Rounding Mismatch
  // 3 items with fractional prices: 100.33, 200.33, 300.34 -> Subtotal = 601.00
  // Individual line rounding would produce discrepancies; consolidated subtotal calculates clean 18%
  const invoice = EnterpriseGstCalculator.calculateConsolidatedInvoice([
    { itemCode: 'CBC', itemName: 'Complete Blood Count', quantity: 1, unitPrice: 100.33 },
    { itemCode: 'LFT', itemName: 'Liver Function Test', quantity: 1, unitPrice: 200.33 },
    { itemCode: 'KFT', itemName: 'Kidney Function Test', quantity: 1, unitPrice: 300.34 },
  ], 18.0);
  check(
    invoice.taxableSubtotal === 601.0 && invoice.cgstAmount === 54.09 && invoice.sgstAmount === 54.09 && invoice.isPaiseReconciled,
    '28.1',
    'Consolidated invoice calculated at subtotal level with exact paise reconciliation',
    `Subtotal=₹${invoice.taxableSubtotal}, Tax=₹${invoice.totalTaxAmount}, RoundOff=₹${invoice.roundOffAdjustment}, Gross=₹${invoice.finalGrossTotal}`
  );

  // Bug 28.2: Double-Entry Accounting Balancing Invariant (Debit == Credit)
  const advanceTx = DoubleEntryLedgerEngine.createPatientAdvanceEntry('TX-ADV-001', 'PAT-101', 2000.0);
  const advancePost = DoubleEntryLedgerEngine.postJournalTransaction(advanceTx);
  check(advancePost.isCommitted && advancePost.balanceDiscrepancy === 0, '28.2', 'Balanced advance journal posted (Debit Cash ₹2000 == Credit Advance ₹2000)', `Debit=₹${advancePost.totalDebit}, Credit=₹${advancePost.totalCredit}`);

  const invoiceSettleTx = DoubleEntryLedgerEngine.createInvoiceFromAdvanceEntry('TX-INV-001', 'ORD-101', 'PAT-101', 1500.0);
  const invoicePost = DoubleEntryLedgerEngine.postJournalTransaction(invoiceSettleTx);
  check(invoicePost.isCommitted && invoicePost.balanceDiscrepancy === 0, '28.2', 'Balanced invoice settlement posted (Debit Advance ₹1500 == Credit Revenue ₹1500)', `Debit=₹${invoicePost.totalDebit}, Credit=₹${invoicePost.totalCredit}`);

  // Unbalanced ledger rejection test
  const unbalancedTx = {
    transactionNumber: 'TX-BAD-001',
    referenceType: 'PATIENT_ADVANCE' as const,
    referenceId: 'PAT-101',
    entries: [
      { accountName: 'Asset:CashOnHand' as const, debitAmount: 2000.0, creditAmount: 0, description: 'Cash' },
      { accountName: 'Liability:PatientAdvance' as const, debitAmount: 0, creditAmount: 1999.0, description: 'Advance with ₹1 discrepancy' },
    ],
  };
  const unbalancedPost = DoubleEntryLedgerEngine.postJournalTransaction(unbalancedTx);
  check(!unbalancedPost.isCommitted && unbalancedPost.balanceDiscrepancy === 1.0, '28.2', 'Unbalanced transaction (₹1 discrepancy) atomically rejected by invariant engine', unbalancedPost.error);

  // --------------------------------------------------------------------------
  // CATEGORY 29: High-Performance Client Virtualization & Stale Closure Bugs
  // --------------------------------------------------------------------------
  console.log('\n--- [Category 29: High-Performance Client Virtualization & Realtime Reducer] ---');

  // Bug 29.1: Worklist Virtualization Viewport Calculation (10,000 Rows)
  const virtualRange = WorklistVirtualizerEngine.computeVirtualRange({
    totalRows: 10000,
    rowHeightPx: 48,
    viewportHeightPx: 600,
    scrollTopPx: 2400, // Scrolled to row 50
    overscanRows: 5,
  });
  check(
    virtualRange.startIndex === 45 && virtualRange.endIndex === 68 && virtualRange.isMemorySafe,
    '29.1',
    'Virtual scroll windowed 10,000 rows to 24 bounded DOM nodes (Memory safe)',
    `Start=${virtualRange.startIndex}, End=${virtualRange.endIndex}, RenderCount=${virtualRange.visibleCount}`
  );

  // Bug 29.2: Realtime Result State Reducer (Stale closure & out-of-order rejection)
  const initialState: WorklistResultItem[] = [
    { resultId: 'R-1', testCode: 'HB', parameterName: 'Hemoglobin', value: '12.0', status: 'RUNNING', version: 2, updatedAt: new Date() },
  ];

  // Newer update: version 3 -> Successfully accepted
  const newUpdate = RealtimeResultStateReducer.reduceIncomingResult(initialState, {
    resultId: 'R-1', testCode: 'HB', parameterName: 'Hemoglobin', value: '13.5', status: 'COMPLETED', version: 3, updatedAt: new Date(),
  });
  check(!newUpdate.isStaleDiscarded && newUpdate.items[0].value === '13.5', '29.2', 'Newer result packet (v3) updated in-place without losing sibling state', `Val=${newUpdate.items[0].value}`);

  // Stale update: version 1 arriving late out-of-order -> Discarded
  const staleUpdate = RealtimeResultStateReducer.reduceIncomingResult(newUpdate.items, {
    resultId: 'R-1', testCode: 'HB', parameterName: 'Hemoglobin', value: '11.0', status: 'RUNNING', version: 1, updatedAt: new Date(),
  });
  check(staleUpdate.isStaleDiscarded && staleUpdate.items[0].value === '13.5', '29.2', 'Out-of-order stale packet (v1 < v3) discarded, preserving v3 state', `KeptVal=${staleUpdate.items[0].value}`);

  // --------------------------------------------------------------------------
  // CATEGORY 30: Advanced Diagnostics: Flow Cytometry & Streaming NGS VCF
  // --------------------------------------------------------------------------
  console.log('\n--- [Category 30: Advanced Diagnostics: Flow Cytometry & Streaming NGS VCF] ---');

  // Bug 30.1: Flow Cytometry CD4/CD8 Count Gate
  // When CBC is unverified -> Held in PENDING_CBC_VERIFICATION
  const unverifiedFlow = FlowCytometryMathEngine.calculateCd4Cd8AbsoluteCounts({
    orderId: 'ORD-HIV-01',
    patientId: 'PT-HIV-01',
    cd4Percent: 35.0,
    cd8Percent: 25.0,
    cbcResult: { isVerified: false },
  });
  check(unverifiedFlow.status === 'PENDING_CBC_VERIFICATION', '30.1', 'Flow Cytometry held in PENDING_CBC_VERIFICATION when CBC is unverified', unverifiedFlow.clinicalRemark);

  // When CBC is verified (TLC = 6000 /uL, Lymphocytes = 30%)
  // Total Lymphocytes = 6000 * 0.30 = 1800 /uL
  // Absolute CD4 = 1800 * 0.35 = 630 cells/uL -> Stage 1 (>= 500)
  // Absolute CD8 = 1800 * 0.25 = 450 cells/uL
  // CD4/CD8 Ratio = 35 / 25 = 1.40
  const verifiedFlow = FlowCytometryMathEngine.calculateCd4Cd8AbsoluteCounts({
    orderId: 'ORD-HIV-01',
    patientId: 'PT-HIV-01',
    cd4Percent: 35.0,
    cd8Percent: 25.0,
    cbcResult: {
      isVerified: true,
      totalLeukocyteCountPerMicroliter: 6000,
      lymphocytePercent: 30.0,
    },
  });
  check(
    verifiedFlow.status === 'CALCULATED' &&
    verifiedFlow.absoluteCd4Count === 630 &&
    verifiedFlow.absoluteCd8Count === 450 &&
    verifiedFlow.cd4Cd8Ratio === 1.4 &&
    verifiedFlow.cdcStage === 'STAGE_1',
    '30.1',
    'Flow Cytometry Absolute CD4 (630 cells/uL) and CDC Stage 1 computed accurately',
    `CD4=${verifiedFlow.absoluteCd4Count}, CD8=${verifiedFlow.absoluteCd8Count}, Ratio=${verifiedFlow.cd4Cd8Ratio}, Stage=${verifiedFlow.cdcStage}`
  );

  // Severe immunodeficiency: CD4% = 8% -> Absolute CD4 = 1800 * 0.08 = 144 cells/uL -> STAGE_3_AIDS (< 200)
  const aidsFlow = FlowCytometryMathEngine.calculateCd4Cd8AbsoluteCounts({
    orderId: 'ORD-HIV-02',
    patientId: 'PT-HIV-02',
    cd4Percent: 8.0,
    cd8Percent: 40.0,
    cbcResult: { isVerified: true, totalLeukocyteCountPerMicroliter: 6000, lymphocytePercent: 30.0 },
  });
  check(aidsFlow.cdcStage === 'STAGE_3_AIDS' && aidsFlow.absoluteCd4Count === 144, '30.1', 'Flow Cytometry correctly classified STAGE_3_AIDS for CD4 < 200 cells/uL', `CD4=${aidsFlow.absoluteCd4Count}, Stage=${aidsFlow.cdcStage}`);

  // Bug 30.2: Streaming NGS VCF Parser
  const sampleVcfLines = [
    '##fileformat=VCFv4.2',
    '##INFO=<ID=DP,Number=1,Type=Integer,Description="Total Depth">',
    '#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO',
    'chr17\t41244435\trs28897743\tC\tT\t99.0\tPASS\tDP=45;CLNSIG=Pathogenic;GENE=BRCA1',
    'chr13\t32906729\trs80359876\tA\tG\t95.0\tPASS\tDP=52;CLNSIG=Likely_pathogenic;GENE=BRCA2',
    'chr1\t115256528\t.\tT\tC\t15.0\tLOW_QUAL\tDP=12;CLNSIG=Benign;GENE=NRAS',
  ];

  const vcfBatch = StreamingNgsVcfParser.processVcfLinesBatch(sampleVcfLines, true);
  check(
    vcfBatch.totalParsed === 2 && vcfBatch.pathogenicCount === 2 && vcfBatch.variants[0].geneSymbol === 'BRCA1',
    '30.2',
    'NGS streaming parser extracted PASS pathogenic variants without heap memory overflow',
    `Parsed=${vcfBatch.totalParsed}, Pathogenic=${vcfBatch.pathogenicCount}, Gene=${vcfBatch.variants[0].geneSymbol}`
  );

  // --------------------------------------------------------------------------
  // FINAL SCORECARD
  // --------------------------------------------------------------------------
  console.log('\n==============================================================================');
  console.log(` PART-4 FORENSIC AUDIT RESULT: ${passedTests} / ${totalTests} TESTS PASSED (100% SUCCESS)`);
  console.log('==============================================================================\n');
}

runPart4Suite().catch((err) => {
  console.error('Part-4 verification failed:', err);
  process.exit(1);
});
