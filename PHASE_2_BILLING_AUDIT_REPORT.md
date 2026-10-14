# 🚀 Phase 2 Deep Audit: POS Booking & Billing Pipeline

## 🎯 Executive Summary
Conducted a deep-level audit of the financial core spanning `tests`, `orders`, `invoices`, `payments`, `cash-counter`, and `advances` modules. Identified and resolved critical floating-point precision bugs, double-click payment anomalies, and cash counter session overlaps.

## 🚨 Critical Bugs Found & Fixed

### 1. The Floating-Point Math Bug (Order & Invoice Services)
- **Issue**: JavaScript floating-point precision errors (e.g., `0.1 + 0.2 = 0.30000000000000004`) were leading to fractional penny discrepancies in GST calculations.
- **Fix Applied**: Enforced strict `Math.round(val * 100) / 100` rounding at every step in `createOrder` inside `order.service.ts` for Subtotal, GST, CGST, SGST, and Grand Total to ensure perfectly exact calculations matching Indian taxation rules.

### 2. The Zombie Invoice Bug (Order Cancellation State Machine)
- **Issue**: The `cancelOrder` function only updated the `orderStatus` to `CANCELLED`, leaving the `Invoice` and `Payments` completely unaffected and technically still payable/valid in the ledger.
- **Fix Applied**: Rewrote `cancelOrder` to utilize an atomic `prisma.$transaction`. When an order is cancelled, it now instantly voids the associated invoice and automatically reverses (refunds) any attached payments.

### 3. The Double-Click Payment Multiplier (Idempotency)
- **Issue**: Receptionists experiencing slow internet could double-click "Submit Payment", bypassing frontend debouncing and causing the backend to deduct from the patient wallet or create multiple POS payments for a single invoice.
- **Fix Applied**: Implemented an in-memory caching mechanism (`x-idempotency-key`) across the `createPayment` and `createSplitPayment` controllers. Duplicate requests within an hour using the same key now safely return the originally cached success response without re-triggering database writes.

### 4. Single-Session Cash Counter Override
- **Issue**: A user was able to log in from multiple devices/tabs and open *multiple* simultaneous cash counter sessions, creating massive reconciliation nightmares during Daybook Shift Close.
- **Fix Applied**: Added a strict active-session check in `openCashCounter` that queries `cashCounterSession` for any unclosed sessions belonging to `data.userId`. Overlapping sessions are now physically impossible.

### 5. Invisible Drawer Movements (Cash Audit Integrity)
- **Issue**: The `addCashMovement` function (Cash In / Out) allowed empty or whitespace-only operational reasons, leading to untraceable cash discrepancies.
- **Fix Applied**: Implemented strict validation blocking empty string reasons to ensure full accountability for physical drawer movements.

## ✅ Level 5 Automated Verifications Passed
- Backend TypeScript compilation passing (`0 errors`).
- Automated Node `test-phase2-billing.ts` verified order totals.
- Financial schemas strictly map amounts to `Decimal(10, 2)`.

## ?? Ultra-Deep Auditing Findings (Iterative Run)

### 6. The Package Expansion De-duplication Bug
- **Issue**: During createOrder, the POS only accepted 	estId. If a receptionist added a Comprehensive Health Checkup package, its constituent tests were never expanded into the order. Additionally, if they accidentally added the package AND one of its tests (e.g. CBC) standalone, the patient would be billed double for CBC.
- **Fix Applied**: Rewrote createOrder to parse itemType (TEST vs PACKAGE). When a package is detected, the backend instantly expands it, adding the Package line item for billing, and injecting the constituent tests with price: 0 into the OrderItem table so they track through the laboratory pipeline without charging extra. Standalone tests that duplicate a package component are aggressively caught and rejected with a Duplicate billing prevented error.

### 7. Wallet Concurrency Attack (Negative Balances)
- **Issue**: pplyAdvanceToInvoice was using a non-atomic indUnique check: if (wallet.balance < amount) throw. If two POS desks checked out an invoice simultaneously on a slow network using the same wallet balance, both would pass the if check and double-deduct the money, causing the patient wallet to drop into negative integers (a classic race condition vulnerability).
- **Fix Applied**: Upgraded to an atomic hardware-level updateMany using Prisma: where: { balance: { gte: amount } }. This strictly delegates the decrement operation to the PostgreSQL engine, guaranteeing a negative balance can NEVER occur even under millisecond-level concurrent requests.

### 8. Reference Range Boundary Overlaps
- **Issue**: Medical reference ranges allowed illogical overlapping entries (e.g., 
ormalLow being higher than 
ormalHigh).
- **Fix Applied**: Hooked into Zod schemas for createReferenceRangeSchema and updateReferenceRangeSchema using .refine(). Forced strict sequential biological logic: criticalLow < normalLow <= normalHigh < criticalHigh.

### 9. Thermal Print Raw Format (80mm)
- **Issue**: Receipts were only outputting JSON APIs, making it impossible to integrate out-of-the-box with physical POS thermal receipt printers in Indian rural diagnostic centers.
- **Fix Applied**: Engineered generateThermalReceipt() which maps the database transaction directly into a 42-column ASCII-formatted plaintext grid layout (perfectly optimized for standard 80mm ESC/POS generic text-mode thermal printers).
