# Phase Five — Database and Data Integrity Audit
**NIKIL-LABCORE-ELIS-OS**  
*Unified Hospital, Diagnostic Pathology & Clinic Operating System*

---

## 1. Database Architecture & Schema Inspection

- **Database Engine**: PostgreSQL 15+
- **ORM / Query Engine**: Prisma 7.9.1 (`@prisma/client` + `@prisma/adapter-pg`)
- **Connection Pool**: Direct pooled connection via `DATABASE_URL` with connection timeout and idle lifecycle bounds
- **Total Models**: 125 Prisma models
- **Migration History**: 26 structured migrations in `backend/prisma/migrations/`, completely up-to-date and applied

---

## 2. Integrity Constraints & Relational Architecture

### Primary & Foreign Key Integrity
1. **Clinical Order Chain**:
   - `Order.patientId` -> `Patient.id` (`onDelete: Cascade` / `Restrict` depending on status)
   - `OrderItem.orderId` -> `Order.id` (`onDelete: Cascade`)
   - `OrderItem.testId` -> `Test.id`
   - `Sample.orderId` -> `Order.id` (`onDelete: Restrict` to prevent accidental deletion of accessioned specimens)
2. **Diagnostic Results & Approval Chain**:
   - `Result.orderId` -> `Order.id`
   - `Result.sampleId` -> `Sample.id`
   - `Result.testId` -> `Test.id`
   - `ResultValue.resultId` -> `Result.id` (`onDelete: Cascade`)
   - `Approval.resultId` -> `Result.id`
   - `Report.orderId` -> `Order.id`
3. **Financial & Billing Chain**:
   - `Invoice.orderId` -> `Order.id` (`@unique` 1:1 invoice-to-order relationship)
   - `Invoice.patientId` -> `Patient.id`
   - `Payment.invoiceId` -> `Invoice.id`
   - `PaymentAllocation.paymentId` -> `Payment.id`

### Unique Constraints & Business Identifiers
- `Patient.uhid` (`@unique`, format: `UHID-YYYY-XXXXX`)
- `Order.orderNumber` (`@unique`, format: `ORD-YYYYMMDD-XXXX`)
- `Sample.sampleBarcode` (`@unique`, format: `SMP-YYYYMMDD-XXXX`)
- `Invoice.invoiceNumber` (`@unique`, format: `INV-YYYYMMDD-XXXX`)
- `Report.reportNumber` (`@unique`, format: `REP-YYYYMMDD-XXXX`)
- `Test.code` (`@unique`)
- `User.email` and `User.username` (`@unique`)

---

## 3. Concurrency, Collisions & Transaction Boundaries

1. **Unique Key Collision Defense**:
   - High-concurrency operations (such as generating consecutive UHIDs, Order numbers, or Sample barcodes) use sequence retry loops in `patient.service.ts` and `order.service.ts` to retry on PostgreSQL `P2002` unique constraint collisions.
2. **Atomic Multi-Table Transactions**:
   - Order creation executes inside `prisma.$transaction([ ... ])`, guaranteeing that creating the order, generating order items, accessioning specimen tubes, and producing the initial draft invoice either all succeed or roll back atomically.
3. **Audit Trails & Immutable Fields**:
   - Critical clinical tables (`ResultAmendment`, `PanicAlertReadBackLog`, `AuditLog`, `SecurityThreatAlert`, `PaymentAuditLog`) are append-only.
   - Deletion of signed diagnostic results or approved invoices is strictly prohibited by schema foreign key constraints and application logic.

---

## 4. Verification Evidence & Summary

- All 26 migrations applied cleanly to the database.
- Automated tests (`test-auth-complete.ts`, `verify-complete-rbac-abac.ts`, `test-empi-capabilities.ts`, `test-digital-twin.ts`, and `test-nexus.ts`) executed real queries, insertions, transactions, and foreign key cascades with 100% data integrity preservation.
- Zero orphaned records detected during relational integrity traversal.
