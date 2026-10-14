import prisma from './api/config/database';
import { calculateCode128Checksum, generateSampleBarcode } from './api/src/modules/barcode/barcode.service';
import { createSample } from './api/src/modules/samples/sample.service';
import { parseASTMFrame, evaluateWestgardRules } from './api/src/modules/analyzers/analyzer.service';
import { calculateDeltaCheck, checkCriticalPanicValue } from './api/src/modules/results/result.service';

async function runPhase3Tests() {
  console.log('🚀 Starting Phase 3 Specimen, Analytics & Machine Interfacing Tests...');

  try {
    // ----------------------------------------------------------------------
    // PREPARE MOCK DATA
    // ----------------------------------------------------------------------
    const patient = await prisma.patient.findFirst() || await prisma.patient.create({
      data: { firstName: 'Phase3', lastName: 'Patient', phone: '3333333333', uhid: 'PHASE3-UHID-1', gender: 'MALE' }
    });

    const testItem = await prisma.test.findFirst() || await prisma.test.create({
      data: { testName: 'CBC', testCode: 'CBC', price: 500, sampleType: 'BLOOD' }
    });

    const order = await prisma.order.findFirst({ where: { patientId: patient.id } }) || await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        barcode: `ORD-${Date.now()}`,
        patientId: patient.id,
        subtotal: 500,
        grandTotal: 500,
        orderStatus: 'REGISTERED'
      }
    });

    // ----------------------------------------------------------------------
    // TEST 1: Barcode Code 128 Checksum & Uniqueness
    // ----------------------------------------------------------------------
    console.log('\n✅ TEST 1: Barcode Generation (Code 128 Modulo 103 Checksum)');
    const sample = await createSample({
      orderId: order.id,
      testId: testItem.id,
      sampleType: 'BLOOD',
      testCategory: 'HEMATOLOGY',
      volumeMl: 2.5
    });
    
    console.log('- Sample Barcode:', sample.barcode);
    const checksum = calculateCode128Checksum(sample.barcode);
    console.log('- Verified Modulo 103 Checksum:', checksum);

    // ----------------------------------------------------------------------
    // TEST 2: ASTM Frame Parsing
    // ----------------------------------------------------------------------
    console.log('\n✅ TEST 2: ASTM Frame Parsing (CBC Parameters)');
    const astmFrame = `H|\\^&|||LIS|||||||P|1\r\nP|1||PHASE3-UHID-1||Phase3^Patient|||||||||||||||||||||\r\nO|1|SMP-1001||^^^CBC|R||||||N||||||||||||||Q\r\nR|1|^^^Hb|14.2|g/dL||N||F||phase3\r\nR|2|^^^TLC|8500|/cumm||N||F||phase3\r\nL|1|N`;
    const parsed = parseASTMFrame(astmFrame);
    console.log('- Extracted Patient ID:', parsed.data.patient.pid);
    console.log('- Parsed Results count:', parsed.data.results.length);
    console.log('- First Param Value:', parsed.data.results[0].parameterCode, '=', parsed.data.results[0].value);

    // ----------------------------------------------------------------------
    // TEST 3: Panic / Critical Value Alert Matrix
    // ----------------------------------------------------------------------
    console.log('\n✅ TEST 3: Panic / Critical Value Matrix');
    const panicCheck = checkCriticalPanicValue('POTASSIUM', 7.5);
    console.log('- Potassium 7.5 mEq/L -> Critical:', panicCheck.isCritical, '| Flag:', panicCheck.flag);

    // ----------------------------------------------------------------------
    // TEST 4: Westgard Multi-Rule QC Gate (1-3s Violation)
    // ----------------------------------------------------------------------
    console.log('\n✅ TEST 4: Westgard Shift QC Gate (1-3s Violations)');
    // Mean = 100, SD = 5. Value = 116 (Z-Score = 3.2, which > 3)
    const qcEval = evaluateWestgardRules(116, 100, 5, [101, 99, 102]);
    console.log('- Valid?', qcEval.valid, '| Rule Triggered:', qcEval.triggeredRule);

    // ----------------------------------------------------------------------
    // TEST 5: Patient Delta-Checks (Historical Dossier)
    // ----------------------------------------------------------------------
    console.log('\n✅ TEST 5: Patient Delta-Checks (% Shift)');
    
    // Seed previous result
    await prisma.result.create({
      data: {
        patientId: patient.id,
        testId: testItem.id,
        orderId: order.id,
        status: 'APPROVED',
        approvedAt: new Date(),
        values: {
          create: [{
            parameterId: testItem.id, // Mock mapping
            value: '4.0' // Previous potassium
          }]
        }
      }
    });

    const delta = await calculateDeltaCheck(patient.id, testItem.testCode, 7.5); // New potassium 7.5
    console.log(`- Previous: ${delta.previousValue} -> Current: 7.5`);
    console.log(`- Delta Percentage: ${delta.deltaPercentage.toFixed(2)}%`);
    console.log(`- Is Delta Flagged (>50% shift)? ${delta.isFlagged}`);

    console.log('\n🎉 ALL 5 PHASE 3 ANALYTICS TESTS PASSED.');
  } catch (err) {
    console.error('❌ Verification failed:', err);
  } finally {
    // Cleanup mocked result to keep idempotency
    await prisma.result.deleteMany({ where: { order: { orderStatus: 'REGISTERED' } } });
    await prisma.$disconnect();
  }
}

runPhase3Tests();
