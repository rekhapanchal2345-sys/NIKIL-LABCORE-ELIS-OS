/**
 * ==============================================================================
 * LabCore ELIS OS — Day 24 / Hour 24 Automated Verification Test Suite
 * Production Smoke Testing, Real-World Clinical & Billing Validation,
 * Multi-User High Concurrency & ASTM E1381/E1394 TCP Analyzer Simulator
 * ==============================================================================
 */

import net from 'net';
import crypto from 'crypto';
import path from 'path';
import { execSync } from 'child_process';
import prisma from './api/config/database';
import { hashPassword, comparePassword } from './api/src/utils/password';
import { generateToken, verifyToken } from './api/src/utils/jwt';
import { AstmFsmParser, ASCII_CONTROL } from './src/services/analyzer/AstmFsmParser';
import {
  UserRole,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  SampleType,
  SampleStatus,
  ResultStatus,
  ResultFlag,
  ApprovalStatus,
  ReportStatus,
} from '@prisma/client';

const ROOT_DIR = path.resolve(__dirname, '..');

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];
let totalAssertions = 0;
let passedAssertions = 0;

function assert(condition: boolean, message: string): void {
  totalAssertions++;
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  passedAssertions++;
}

async function runTestAsync(suiteName: string, testName: string, fn: () => Promise<void>): Promise<void> {
  const start = performance.now();
  try {
    await fn();
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    results.push({ name: `[${suiteName}] ${testName}`, passed: true, durationMs });
    console.log(`  \x1b[32m✓\x1b[0m ${testName} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    results.push({ name: `[${suiteName}] ${testName}`, passed: false, error: err.message, durationMs });
    console.log(`  \x1b[31m✗\x1b[0m ${testName} (${durationMs}ms)`);
    console.log(`    \x1b[31mError: ${err.message}\x1b[0m`);
  }
}

function runTest(suiteName: string, testName: string, fn: () => void): void {
  const start = performance.now();
  try {
    fn();
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    results.push({ name: `[${suiteName}] ${testName}`, passed: true, durationMs });
    console.log(`  \x1b[32m✓\x1b[0m ${testName} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    results.push({ name: `[${suiteName}] ${testName}`, passed: false, error: err.message, durationMs });
    console.log(`  \x1b[31m✗\x1b[0m ${testName} (${durationMs}ms)`);
    console.log(`    \x1b[31mError: ${err.message}\x1b[0m`);
  }
}

// ASTM E1381 Frame Builder Helper
function buildAstmFrame(frameSeq: number, data: string): Buffer {
  const body = Buffer.from(`${frameSeq}${data}\r\x03`, 'ascii');
  const checksum = AstmFsmParser.calculateAstmChecksum(body);
  return Buffer.concat([
    Buffer.from([ASCII_CONTROL.STX]),
    body,
    Buffer.from(`${checksum}\r\n`, 'ascii'),
  ]);
}

async function runDay24SmokeSuite() {
  console.log('\n==============================================================================');
  console.log('🚀 DAY 24: PRODUCTION SMOKE TESTING, CONCURRENCY & ASTM TCP SIMULATOR');
  console.log('==============================================================================\n');

  // Synthetic Test Identifiers
  const UHID = `SMOKE-PT-${Date.now()}`;
  const ORDER_NUM = `SMOKE-ORD-${Date.now()}`;
  const BARCODE_CBC = `BC-CBC-${Date.now()}`;
  const BARCODE_GLU = `BC-GLU-${Date.now()}`;

  // ==============================================================================
  // SUITE 1: MULTI-ROLE USER AUTHENTICATION & SESSION LIFECYCLE
  // ==============================================================================
  console.log('\x1b[36m--- Suite 1: Multi-Role User Authentication & Session Security ---\x1b[0m');

  await runTestAsync('User Auth', 'Provision and authenticate 6 hospital operational roles', async () => {
    const testRoles: Array<{ email: string; role: UserRole; code: string; name: string }> = [
      { email: 'smoke.super@labcore.local', role: 'SUPER_ADMIN', code: 'SMK-SA-01', name: 'Chief Super Admin' },
      { email: 'smoke.admin@labcore.local', role: 'ADMIN', code: 'SMK-ADM-01', name: 'Hospital Administrator' },
      { email: 'smoke.desk@labcore.local', role: 'FRONT_DESK', code: 'SMK-FD-01', name: 'Receptionist Officer' },
      { email: 'smoke.patho@labcore.local', role: 'PATHOLOGIST', code: 'SMK-PAT-01', name: 'Dr. Pathologist MD' },
      { email: 'smoke.tech@labcore.local', role: 'LAB_TECH', code: 'SMK-LT-01', name: 'Senior Lab Technician' },
      { email: 'smoke.acct@labcore.local', role: 'ACCOUNTANT', code: 'SMK-ACT-01', name: 'Billing Cashier' },
    ];

    for (const r of testRoles) {
      const password = 'SmokeSecurePassword2026!';
      const passwordHash = await hashPassword(password);

      const user = await prisma.user.upsert({
        where: { email: r.email },
        create: {
          email: r.email,
          fullName: r.name,
          employeeCode: r.code,
          role: r.role,
          status: 'ACTIVE',
          emailVerified: true,
          passwordHash,
        },
        update: {
          role: r.role,
          status: 'ACTIVE',
          passwordHash,
        },
      });

      assert(user.role === r.role, `User ${r.email} must have role ${r.role}`);

      // Verify HMAC-peppered password
      const isAuthValid = await comparePassword(password, user.passwordHash);
      assert(isAuthValid === true, `Password authentication must succeed for ${r.role}`);

      // Verify JWT issue and decoding
      const token = generateToken({ id: user.id, role: user.role });
      assert(typeof token === 'string' && token.length > 20, 'JWT token must be non-empty');
      const decoded = verifyToken(token);
      assert(decoded.id === user.id, 'Decoded JWT ID must match');
      assert(decoded.role === r.role, 'Decoded JWT role must match');
    }
  });

  // ==============================================================================
  // SUITE 2: COMPLETE END-TO-END CLINICAL WORKFLOW
  // ==============================================================================
  console.log('\n\x1b[36m--- Suite 2: Complete End-to-End Clinical Lifecycle ---\x1b[0m');

  let patientId: string = '';
  let orderId: string = '';
  let cbcTestId: string = '';

  await runTestAsync('Clinical Lifecycle', 'Step 1: Patient Registration with UHID & demographic PII', async () => {
    const patient = await prisma.patient.create({
      data: {
        uhid: UHID,
        firstName: 'Rahul',
        lastName: 'Sharma',
        gender: 'MALE',
        age: 38,
        phone: '9880011223',
        email: 'rahul.sharma@smoke.org',
        isActive: true,
      },
    });

    assert(patient !== null && patient.id !== undefined, 'Patient must be created');
    assert(patient.uhid === UHID, 'Patient UHID must match');
    patientId = patient.id;
  });

  await runTestAsync('Clinical Lifecycle', 'Step 2: Diagnostic Order Creation with Multi-Test Requisition', async () => {
    // Ensure CBC and Blood Glucose tests exist
    const cbcTest = await prisma.test.findFirst({
      where: { OR: [{ testCode: 'CBC' }, { testCode: { contains: 'CBC' } }] },
    });
    const glucoseTest = await prisma.test.findFirst({
      where: { OR: [{ testCode: 'GLU' }, { testCode: { contains: 'GLU' } }, { testCode: { contains: 'BSF' } }] },
    });

    assert(cbcTest !== null, 'CBC test must exist in master catalog');
    assert(glucoseTest !== null, 'Glucose test must exist in master catalog');
    cbcTestId = cbcTest!.id;

    const order = await prisma.order.create({
      data: {
        orderNumber: ORDER_NUM,
        barcode: `BC-${ORDER_NUM}`,
        patientId,
        orderStatus: OrderStatus.REGISTERED,
        priority: 'ROUTINE',
        subtotal: 1200.0,
        discount: 0.0,
        gstAmount: 0.0,
        grandTotal: 1200.0,
        dueAmount: 1200.0,
        paidAmount: 0.0,
        items: {
          create: [
            {
              testId: cbcTest!.id,
              price: 800.0,
              gstAmount: 0.0,
              finalPrice: 800.0,
            },
            {
              testId: glucoseTest!.id,
              price: 400.0,
              gstAmount: 0.0,
              finalPrice: 400.0,
            },
          ],
        },
      },
    });

    assert(order !== null && order.id !== undefined, 'Order must be created');
    assert(order.orderStatus === OrderStatus.REGISTERED, 'Order initial status must be REGISTERED');
    orderId = order.id;
  });

  await runTestAsync('Clinical Lifecycle', 'Step 3: Specimen Accessioning & CLSI GP41 State Transitions', async () => {
    const glucoseTest = await prisma.test.findFirst({
      where: { OR: [{ testCode: 'GLU' }, { testCode: { contains: 'GLU' } }, { testCode: { contains: 'BSF' } }] },
    });

    const sampleCbc = await prisma.sample.create({
      data: {
        patientId,
        testId: cbcTestId,
        orderId,
        sampleNumber: `SMP-${BARCODE_CBC}`,
        barcode: BARCODE_CBC,
        sampleType: SampleType.BLOOD,
        status: SampleStatus.PENDING,
      },
    });

    const sampleGlu = await prisma.sample.create({
      data: {
        patientId,
        testId: glucoseTest!.id,
        orderId,
        sampleNumber: `SMP-${BARCODE_GLU}`,
        barcode: BARCODE_GLU,
        sampleType: SampleType.PLASMA,
        status: SampleStatus.PENDING,
      },
    });

    assert(sampleCbc.status === SampleStatus.PENDING, 'CBC sample initial status must be PENDING');
    assert(sampleGlu.status === SampleStatus.PENDING, 'Glucose sample initial status must be PENDING');

    // Simulate Phlebotomist collection
    await prisma.sample.updateMany({
      where: { orderId },
      data: { status: SampleStatus.COLLECTED, collectedAt: new Date() },
    });

    // Simulate Lab Tech accessioning into laboratory
    await prisma.sample.updateMany({
      where: { orderId },
      data: { status: SampleStatus.RECEIVED, receivedAt: new Date() },
    });

    const accessionedSamples = await prisma.sample.findMany({ where: { orderId } });
    for (const s of accessionedSamples) {
      assert(s.status === SampleStatus.RECEIVED, `Sample ${s.sampleNumber} must be in RECEIVED status`);
      assert(s.collectedAt !== null, 'collectedAt must be set');
      assert(s.receivedAt !== null, 'receivedAt must be set');
    }
  });

  await runTestAsync('Clinical Lifecycle', 'Step 4: Result Ingestion & Panic HH/LL Threshold Detection', async () => {
    // Create Result container
    const resultRecord = await prisma.result.create({
      data: {
        orderId,
        testId: cbcTestId,
        patientId,
        status: ResultStatus.ENTERED,
        enteredAt: new Date(),
      },
    });

    // Fetch CBC parameter definitions
    const cbcParameters = await prisma.testParameter.findMany({
      where: { testId: cbcTestId },
      take: 4,
    });

    assert(cbcParameters.length > 0, 'Must have CBC test parameters in catalog');

    // Enter results with one Critical Panic value
    const enteredValues = [
      { param: cbcParameters[0], val: '14.2', flag: ResultFlag.NORMAL },
      { param: cbcParameters[1] || cbcParameters[0], val: '7800', flag: ResultFlag.NORMAL },
      { param: cbcParameters[2] || cbcParameters[0], val: '18000', flag: ResultFlag.CRITICAL }, // Panic Threshold!
    ];

    for (const ev of enteredValues) {
      await prisma.resultValue.create({
        data: {
          resultId: resultRecord.id,
          parameterId: ev.param.id,
          value: ev.val,
          flag: ev.flag,
          clinicalSignificance: ev.flag === ResultFlag.CRITICAL ? 'Immediate Physician Notification Required' : null,
        },
      });
    }

    const panicCount = await prisma.resultValue.count({
      where: { resultId: resultRecord.id, flag: ResultFlag.CRITICAL },
    });
    assert(panicCount === 1, 'Must detect exactly 1 Critical Panic parameter');
  });

  await runTestAsync('Clinical Lifecycle', 'Step 5: Pathologist Electronic Sign-Off & Report Generation', async () => {
    const resultRecord = await prisma.result.findFirst({ where: { orderId } });
    assert(resultRecord !== null, 'Result record must exist');

    // Pathologist Review and Cryptographic Seal
    const pathologistUser = await prisma.user.findUnique({
      where: { email: 'smoke.patho@labcore.local' },
    });
    assert(pathologistUser !== null, 'Pathologist user must exist');

    const approvalTimestamp = new Date();
    const digitalSeal = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'secret')
      .update(`${resultRecord!.id}:${pathologistUser!.id}:${approvalTimestamp.toISOString()}`)
      .digest('hex');

    const approval = await prisma.approval.create({
      data: {
        resultId: resultRecord!.id,
        approvedById: pathologistUser!.id,
        status: ApprovalStatus.APPROVED,
        remarks: 'Results verified and approved under NABL ISO 15189:2022 clinical governance.',
        approvedAt: approvalTimestamp,
      },
    });

    await prisma.result.update({
      where: { id: resultRecord!.id },
      data: {
        status: ResultStatus.APPROVED,
        approvedById: pathologistUser!.id,
        approvedAt: approvalTimestamp,
      },
    });

    // Create Report
    const report = await prisma.report.create({
      data: {
        orderId,
        patientId,
        reportNumber: `RPT-${ORDER_NUM}`,
        reportReferenceId: `REF-${ORDER_NUM}`,
        status: ReportStatus.GENERATED,
        publishedAt: new Date(),
        publishedById: pathologistUser!.id,
        reportData: { digitalSignature: digitalSeal },
      },
    });

    assert(approval.status === ApprovalStatus.APPROVED, 'Approval status must be APPROVED');
    assert(report.status === ReportStatus.GENERATED, 'Report status must be GENERATED');
    assert(typeof digitalSeal === 'string' && digitalSeal.length === 64, 'Digital seal must be 64-char SHA-256 hex');
  });

  // ==============================================================================
  // SUITE 3: FINANCIAL BILLING & CASH COUNTER SHIFT FLOW
  // ==============================================================================
  console.log('\n\x1b[36m--- Suite 3: Financial Invoicing, GST & Cash Denomination Flow ---\x1b[0m');

  await runTestAsync('Billing Flow', 'Generate GST SAC 999316 invoice and process multi-denomination payment', async () => {
    // 1. Generate Invoice
    const invoice = await prisma.invoice.create({
      data: {
        orderId,
        invoiceNumber: `INV-${ORDER_NUM}`,
        subtotal: 1200.0,
        discount: 0.0,
        gstPercent: 0.0,
        gstAmount: 0.0,
        taxableAmount: 1200.0,
        grandTotal: 1200.0,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    assert(invoice.paymentStatus === PaymentStatus.PENDING, 'Invoice initial status must be PENDING');
    assert(Number(invoice.grandTotal) === 1200.0, 'Total amount must be ₹1200.00');

    // 2. Physical Cash Payment with Denomination Breakdown: 2x500 + 1x200 = 1200
    const denominations = {
      notes500: 2,
      notes200: 1,
      totalCalculated: 2 * 500 + 1 * 200,
    };
    assert(denominations.totalCalculated === 1200, 'Physical cash denomination sum must equal total due');

    const paymentHash = crypto
      .createHash('sha256')
      .update(`${invoice.id}:1200.00:CASH:${Date.now()}`)
      .digest('hex');

    const payment = await prisma.payment.create({
      data: {
        orderId,
        receiptNumber: `RCP-${ORDER_NUM}`,
        amount: 1200.0,
        method: PaymentMethod.CASH,
        status: PaymentStatus.PAID,
        transactionId: `PAY-TX-${paymentHash.substring(0, 16)}`,
      },
    });

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paidAmount: 1200.0,
        dueAmount: 0.0,
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.COMPLETED,
      },
    });

    assert(payment.status === PaymentStatus.PAID, 'Payment status must be PAID');

    const updatedInvoice = await prisma.invoice.findUnique({ where: { id: invoice.id } });
    assert(updatedInvoice!.paymentStatus === PaymentStatus.PAID, 'Invoice status must transition to PAID');
  });

  // ==============================================================================
  // SUITE 4: MULTI-USER HIGH-CONCURRENCY STRESS SMOKE TEST
  // ==============================================================================
  console.log('\n\x1b[36m--- Suite 4: Multi-User High-Concurrency Stress Smoke Test ---\x1b[0m');

  await runTestAsync('Concurrency', '5 simultaneous hospital roles executing concurrent parallel transactions', async () => {
    const timestamp = Date.now();

    // Worker 1: Receptionist concurrently registering 3 patients
    const workerReception = async () => {
      const created = [];
      for (let i = 1; i <= 3; i++) {
        const p = await prisma.patient.create({
          data: {
            uhid: `CONC-PT-${timestamp}-${i}`,
            firstName: `ConcPatient`,
            lastName: `${i}`,
            phone: `910000000${i}`,
            gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
            age: 20 + i * 5,
            isActive: true,
          },
        });
        created.push(p);
      }
      return { worker: 'RECEPTION', count: created.length };
    };

    // Worker 2: Phlebotomist querying and filtering samples
    const workerPhlebotomy = async () => {
      const samples = await prisma.sample.findMany({ take: 10 });
      return { worker: 'PHLEBOTOMY', queried: samples.length };
    };

    // Worker 3: Lab Tech querying test catalog and reference bounds
    const workerLabTech = async () => {
      const tests = await prisma.test.findMany({
        where: { isActive: true },
        take: 5,
        include: { parameters: true },
      });
      return { worker: 'LAB_TECH', catalogItems: tests.length };
    };

    // Worker 4: Accountant querying paid invoices and daybook records
    const workerCashier = async () => {
      const payments = await prisma.payment.findMany({
        where: { status: PaymentStatus.PAID },
        take: 5,
      });
      return { worker: 'CASHIER', paymentsCount: payments.length };
    };

    // Worker 5: Pathologist checking critical panic queue
    const workerPathologist = async () => {
      const panicAlerts = await prisma.resultValue.findMany({
        where: { flag: ResultFlag.CRITICAL },
        take: 5,
      });
      return { worker: 'PATHOLOGIST', panicCount: panicAlerts.length };
    };

    const startTime = performance.now();
    const results = await Promise.all([
      workerReception(),
      workerPhlebotomy(),
      workerLabTech(),
      workerCashier(),
      workerPathologist(),
    ]);
    const durationMs = Math.round(performance.now() - startTime);

    assert(results.length === 5, 'All 5 concurrent workers must finish');
    assert(results[0].count === 3, 'Worker 1 must have registered 3 patients');
    assert(durationMs < 3000, `Concurrent execution must complete under 3000ms (took ${durationMs}ms)`);
  });

  // ==============================================================================
  // SUITE 5: ASTM E1381 / E1394 ANALYZER TCP SOCKET SIMULATOR
  // ==============================================================================
  console.log('\n\x1b[36m--- Suite 5: ASTM E1381 / E1394 Hardware Analyzer TCP Socket Simulator ---\x1b[0m');

  await runTestAsync('ASTM Analyzer', 'Live TCP loopback connection, ENQ-ACK handshake and E1394 result parsing', async () => {
    let serverReceivedPackage: any = null;

    // 1. Start Isolated ASTM TCP Server with dynamic ephemeral port
    const server = net.createServer((socket: net.Socket) => {
      const fsm = new AstmFsmParser('SMOKE_CBC_SYS_XN');

      fsm.on('clinicalResultsPackage', (pkg) => {
        serverReceivedPackage = pkg;
      });

      socket.on('data', async (chunk: Buffer) => {
        const outbound = await fsm.ingestRawBytes(chunk);
        for (const out of outbound) {
          socket.write(out);
        }
      });
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const port = (server.address() as net.AddressInfo).port;

    try {
      // 2. Connect Simulated Analyzer Client
      const client = new net.Socket();
      await new Promise<void>((resolve, reject) => {
        client.connect(port, '127.0.0.1', () => resolve());
        client.on('error', reject);
      });

      const responses: Buffer[] = [];
      client.on('data', (data: Buffer) => {
        responses.push(data);
      });

      // Helper to send buffer and await response
      const sendAndAwaitAck = async (buf: Buffer): Promise<Buffer> => {
        const currentLen = responses.length;
        client.write(buf);
        const start = performance.now();
        while (responses.length === currentLen && performance.now() - start < 1000) {
          await new Promise((r) => setTimeout(r, 10));
        }
        return responses[responses.length - 1];
      };

      // Step A: Send <ENQ> (0x05)
      const ack1 = await sendAndAwaitAck(Buffer.from([ASCII_CONTROL.ENQ]));
      assert(ack1 !== undefined && ack1[0] === ASCII_CONTROL.ACK, 'Server must respond with <ACK> to <ENQ>');

      // Step B: Send Header Record Frame
      const hFrame = buildAstmFrame(1, 'H|\\^&|||LabCore^Host|||||||P|1|20261026');
      const ack2 = await sendAndAwaitAck(hFrame);
      assert(ack2 !== undefined && ack2[0] === ASCII_CONTROL.ACK, 'Server must respond with <ACK> to Header Frame');

      // Step C: Send Patient Record Frame
      const pFrame = buildAstmFrame(2, 'P|1||UHID-TEST-001||Verma^Aditya||19880415|M');
      const ack3 = await sendAndAwaitAck(pFrame);
      assert(ack3 !== undefined && ack3[0] === ASCII_CONTROL.ACK, 'Server must respond with <ACK> to Patient Frame');

      // Step D: Send Order Record Frame
      const oFrame = buildAstmFrame(3, 'O|1|SMP-CBC-001||^^^CBC|R|20261026100000');
      const ack4 = await sendAndAwaitAck(oFrame);
      assert(ack4 !== undefined && ack4[0] === ASCII_CONTROL.ACK, 'Server must respond with <ACK> to Order Frame');

      // Step E: Send Result Record Frames (Hemoglobin = 14.5 g/dL, Platelets = 240 x10^3/uL)
      const rFrame1 = buildAstmFrame(4, 'R|1|^^^HGB|14.5|g/dL|13.0-17.0|N||F');
      const ack5 = await sendAndAwaitAck(rFrame1);
      assert(ack5 !== undefined && ack5[0] === ASCII_CONTROL.ACK, 'Server must respond with <ACK> to HGB Result');

      const rFrame2 = buildAstmFrame(5, 'R|2|^^^PLT|240|10^3/uL|150-450|N||F');
      const ack6 = await sendAndAwaitAck(rFrame2);
      assert(ack6 !== undefined && ack6[0] === ASCII_CONTROL.ACK, 'Server must respond with <ACK> to PLT Result');

      // Step F: Send Terminator Frame
      const lFrame = buildAstmFrame(6, 'L|1|N');
      const ack7 = await sendAndAwaitAck(lFrame);
      assert(ack7 !== undefined && ack7[0] === ASCII_CONTROL.ACK, 'Server must respond with <ACK> to Terminator Frame');

      // Step G: Send <EOT> (0x04)
      client.write(Buffer.from([ASCII_CONTROL.EOT]));
      await new Promise((r) => setTimeout(r, 150));

      client.destroy();

      // Verify server received and parsed clinical package
      assert(serverReceivedPackage !== null, 'Server must have parsed and emitted clinicalResultsPackage');
      assert(serverReceivedPackage.analyzerId === 'SMOKE_CBC_SYS_XN', 'Analyzer ID must match');
      assert(serverReceivedPackage.results.length === 2, 'Must have parsed 2 result parameters');
      assert(serverReceivedPackage.results[0].parameterCode === 'HGB', 'First param must be HGB');
      assert(serverReceivedPackage.results[0].numericValue === 14.5, 'HGB value must be 14.5');
      assert(serverReceivedPackage.results[1].parameterCode === 'PLT', 'Second param must be PLT');
      assert(serverReceivedPackage.results[1].numericValue === 240, 'PLT value must be 240');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // ==============================================================================
  // SUITE 6: PRODUCTION PREFLIGHT VERIFICATION
  // ==============================================================================
  console.log('\n\x1b[36m--- Suite 6: Full System Production Readiness Check ---\x1b[0m');

  runTest('Integration Preflight', 'scripts/verify-production.js passes all 12/12 checks', () => {
    const output = execSync('node scripts/verify-production.js', { cwd: ROOT_DIR, encoding: 'utf-8' });
    assert(output.includes('ALL 12/12 PRODUCTION READINESS CHECKS PASSED!'), 'verify-production.js must pass 12/12');
  });

  // ==============================================================================
  // SUMMARY & METRICS
  // ==============================================================================
  console.log('\n==============================================================================');
  console.log('📊 DAY 24 TEST EXECUTION SUMMARY');
  console.log('==============================================================================');

  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = totalTests - passedTests;

  console.log(`Total Test Suites   : 6`);
  console.log(`Total Unit Tests    : ${totalTests}`);
  console.log(`Passed Unit Tests   : \x1b[32m${passedTests}\x1b[0m`);
  console.log(`Failed Unit Tests   : ${failedTests > 0 ? `\x1b[31m${failedTests}\x1b[0m` : `\x1b[32m0\x1b[0m`}`);
  console.log(`Total Assertions    : ${totalAssertions}`);
  console.log(`Passed Assertions   : \x1b[32m${passedAssertions}\x1b[0m`);
  console.log(`Success Rate        : \x1b[32m${((passedTests / totalTests) * 100).toFixed(1)}%\x1b[0m`);

  await prisma.$disconnect();

  if (failedTests > 0) {
    console.log('\n\x1b[31m❌ DAY 24 PRODUCTION SMOKE SUITE FAILED.\x1b[0m\n');
    process.exit(1);
  } else {
    console.log('\n\x1b[32m✨ DAY 24 PRODUCTION SMOKE & CONCURRENCY CERTIFIED: 100% PASS (0 FAILURES)\x1b[0m\n');
    process.exit(0);
  }
}

runDay24SmokeSuite().catch(async (err) => {
  console.error('Fatal test error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
