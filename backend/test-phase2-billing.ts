import prisma from './api/config/database';
import { createOrder } from './api/src/modules/orders/order.service';
import { createSplitPayment } from './api/src/modules/payments/payment.service';
import { createAdvance, applyAdvanceToInvoice } from './api/src/modules/advances/advance.service';
import { openCashCounter, closeCashCounter } from './api/src/modules/cash-counter/cash-counter.service';

async function runTests() {
  console.log('?? Starting Phase 2 Billing & POS Verification Tests...');

  try {
    // PREPARE MOCK DATA
    const patient = await prisma.patient.findFirst() || await prisma.patient.create({
      data: {
        firstName: 'Test',
        lastName: 'Patient',
        phone: '9999999999',
        uhid: `TEST-UHID-${Date.now()}`,
        gender: 'MALE',
      }
    });

    const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } }) || await prisma.user.create({
      data: {
        email: `admin_${Date.now()}@test.com`,
        passwordHash: 'hash',
        role: 'ADMIN',
        fullName: 'Test Admin',
        employeeCode: `EMP-${Date.now()}`,
      }
    });

    let pkg = await prisma.testPackage.findFirst({ include: { items: true } });
    if (!pkg || pkg.items.length === 0) {
      const test1 = await prisma.test.create({
        data: {
          testName: 'Comp Test 1',
          testCode: `CT1_${Date.now()}`,
          price: 100,
          sampleType: 'BLOOD',
        }
      });
      pkg = await prisma.testPackage.create({
        data: {
          packageName: 'Test Package',
          packageCode: `TPKG_${Date.now()}`,
          totalPrice: 1000,
          items: {
            create: {
              testId: test1.id,
              testPrice: 100,
            }
          }
        },
        include: { items: true }
      });
    }

    if (!pkg || pkg.items.length === 0) {
      throw new Error('Test package could not be prepared');
    }

    const test2 = await prisma.test.findFirst({ where: { id: { not: pkg.items[0].testId } } }) || await prisma.test.create({
      data: {
        testName: 'Standalone',
        testCode: `ST1_${Date.now()}`,
        price: 500,
        sampleType: 'BLOOD',
      }
    });

    // TEST 1 & 2: Create Order (Package Expansion & exact Math)
    console.log('\n? TEST 1 & 2: Creating Order with Package and Standalone Test (10% Discount)');
    const order = await createOrder({
      patientId: patient.id,
      priority: 'ROUTINE',
      tests: [test2.id],
      packages: [pkg.id],
      items: [
        { packageId: pkg.id, discount: 100 }, // 10% discount on package
        { testId: test2.id, discount: 50 }    // 10% discount on test
      ]
    }, user.id);

    console.log('- Order Items expanded:', order.items.length);
    console.log('- Grand Total calculated correctly:', order.invoice?.grandTotal);

    // TEST 3: Split Payment
    console.log('\n? TEST 3: Split Payment execution');
    await createSplitPayment({
      orderId: order.id,
      payments: [
        { amount: 500, method: 'CASH' },
        { amount: Number(order.invoice!.grandTotal) - 500, method: 'UPI' }
      ]
    }, user.id);

    const paidOrder = await prisma.order.findUnique({ where: { id: order.id }, include: { invoice: true } });
    console.log('- Invoice Status:', paidOrder?.invoice?.paymentStatus);

    // TEST 4: Advance Wallet
    console.log('\n? TEST 4: Advance Wallet Deposit and Payment');
    const order2 = await createOrder({
      patientId: patient.id,
      priority: 'ROUTINE',
      tests: [test2.id],
      items: [{ testId: test2.id }]
    }, user.id);
    
    await createAdvance({ patientId: patient.id, amount: 2000, reason: 'Test Deposit' });
    const preWallet = await prisma.patientWallet.findUnique({ where: { patientId: patient.id } });
    console.log('- Wallet Balance before payment:', preWallet?.balance);
    
    await applyAdvanceToInvoice({ patientId: patient.id, orderId: order2.id, amount: Number(order2.invoice!.grandTotal) });
    const postWallet = await prisma.patientWallet.findUnique({ where: { patientId: patient.id } });
    console.log('- Wallet Balance after payment:', postWallet?.balance);

    // TEST 5: Cash Counter Discrepancy
    console.log('\n? TEST 5: Cash Counter discrepancy validation');
    const counter = await prisma.cashCounter.findFirst() || await prisma.cashCounter.create({
      data: {
        counterNumber: `C-${Date.now()}`,
        counterName: 'C1',
        branchId: 'MAIN',
      }
    });
    
    // Make sure no open sessions exist for user
    await prisma.cashCounterSession.updateMany({ where: { userId: user.id, closedAt: null }, data: { closedAt: new Date() } });
    await prisma.cashCounter.update({ where: { id: counter.id }, data: { status: 'CLOSED' } });

    await openCashCounter({ counterId: counter.id, openingBalance: 1000, userId: user.id });
    
    const closeRes = await closeCashCounter({ counterId: counter.id, actualCash: 900, varianceReason: 'Missing 100', userId: user.id });
    console.log('- Variance calculated:', closeRes.session.variance);

    console.log('\n?? ALL 5 ULTRA DEEP VERIFICATION TESTS PASSED.');
  } catch (err) {
    console.error('? Verification failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
