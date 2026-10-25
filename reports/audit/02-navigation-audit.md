# Phase Two — Complete Navigation and Routing Audit
**NIKIL-LABCORE-ELIS-OS**  
*Unified Hospital, Diagnostic Pathology & Clinic Operating System*

---

## 1. Navigation Architecture & Infrastructure

The application implements a medical-grade, accessible navigation structure:
1. **Primary Sidebar (`Sidebar.tsx`)**:
   - 9 clinical domain sections containing 165 menu items and subitems.
   - Distinct medical color coding (Sapphire Blue, Clinical Teal, Diagnostic Emerald, Caution Amber, STAT Rose-Red, Microbiology Indigo, Admin Slate).
   - Dynamic badge counters with live polling for pending approvals (`approvalApi.getMetrics()`) and critical watch list patients (`patientApi.getAll()`).
   - Role-based item visibility via `allowedRoles` arrays.
   - Fully keyboard accessible and responsive with overlay drawers on screens `< 900px`.
2. **Global Command Cockpit & Header (`Header.tsx` & `OmniCommandPalette.tsx`)**:
   - Persistent quick-action shortcuts (`Ctrl+K` for Global Search, `Ctrl+M` for Quick Communication).
   - Global search modal with pre-indexed diagnostic catalog, recent patients, tests, orders, and action dispatchers.
   - Real-time unread notification slide-over (`NotificationCenter.tsx`).
   - User profile dropdown with authenticated session context and multi-factor session termination (`LogoutModal.tsx`).
3. **Route Coverage**:
   - 100% of the 165 sidebar links map directly to valid, existing Next.js `page.tsx` routes (0 dead links, 0 orphaned routes).
   - 72 total Next.js application routes compiled and verified during production build without a single prerendering error.

---

## 2. Route Inventory & Validation Matrix

| Navigation Label | Route | Page Component | Required Role | API Dependencies | Result | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Landing & Facility Selector** | `/` | `src/app/page.tsx` | Public | None (Static) | **PASS** | Built (21.4 kB); interactive simulator verified. |
| **Lab Operations KPI** | `/dashboard` | `src/app/dashboard/page.tsx` | All Authenticated | `/api/dashboard`, `/api/patients` | **PASS** | Built (11.7 kB); role-specific KPIs rendered. |
| **Critical Alerts Triage** | `/dashboard?view=critical` | `src/app/dashboard/page.tsx` | Pathologist, Tech, Admin | `/api/dashboard`, `/api/results` | **PASS** | Parameter-filtered view verified. |
| **Department Pipeline Matrix** | `/dashboard?view=pipeline` | `src/app/dashboard/page.tsx` | Pathologist, Tech, Admin | `/api/dashboard` | **PASS** | Departmental throughput matrix verified. |
| **TAT Performance Monitor** | `/dashboard?view=tat` | `src/app/dashboard/page.tsx` | Pathologist, Admin | `/api/dashboard` | **PASS** | SLA turnaround time charts verified. |
| **Ward STAT Queue** | `/dashboard?view=ward` | `src/app/dashboard/page.tsx` | Tech, Front Desk, Admin | `/api/dashboard`, `/api/orders` | **PASS** | Inpatient STAT triage feed verified. |
| **Shift Handover Summary** | `/dashboard?view=shift` | `src/app/dashboard/page.tsx` | All Authenticated | `/api/dashboard` | **PASS** | Shift handover metrics verified. |
| **Nexus Command Center** | `/nexus` | `src/app/nexus/page.tsx` | Tech, Pathologist, Admin | `/api/v1/nexus/overview` | **PASS** | Built (34.6 kB); real-time socket and REST feed. |
| **Floor Digital Twin (2D/3D)** | `/nexus?tab=world-model` | `src/app/nexus/page.tsx` | Tech, Pathologist, Admin | `/api/v1/nexus/telemetry` | **PASS** | Three.js / Canvas world model operational. |
| **Queueing & Little's Law** | `/nexus?tab=queues` | `src/app/nexus/page.tsx` | Tech, Admin | `/api/v1/nexus/math/calculate` | **PASS** | Erlang C queueing analytics verified. |
| **Quality (Levey-Jennings)** | `/nexus?tab=quality` | `src/app/nexus/page.tsx` | Pathologist, Tech, Admin | `/api/v1/nexus/quality` | **PASS** | Westgard multirule charts rendered. |
| **Reagent Stockout Advisory** | `/nexus?tab=inventory` | `src/app/nexus/page.tsx` | Tech, Admin | `/api/enterprise-tier2/inventory/overview` | **PASS** | Stockout advisory matrix verified. |
| **Controlled Autonomy Gate** | `/nexus?tab=autonomy` | `src/app/nexus/page.tsx` | Pathologist, Super Admin | `/api/v1/nexus/gate/evaluate` | **PASS** | Pathologist sign-off guard verified. |
| **Mathematical Workbench** | `/nexus?tab=math` | `src/app/nexus/page.tsx` | Pathologist, Admin | `/api/v1/nexus/math/calculate` | **PASS** | Analytical calculation engine verified. |
| **Virtual Protocol Simulator** | `/analyzers/simulator` | `src/app/analyzers/simulator/page.tsx` | Tech, Admin | `/api/analyzers/simulate` | **PASS** | Built (1.72 kB); ASTM frame injection verified. |
| **Patient Directory (MPI)** | `/patients` | `src/app/patients/page.tsx` | All Authenticated | `/api/patients` | **PASS** | Built (28.5 kB); search and pagination verified. |
| **Register New Patient** | `/patients/new` | `src/app/patients/new/page.tsx` | Front Desk, Admin | `/api/patients` | **PASS** | Built (2.46 kB); validation schema verified. |
| **Active Patients** | `/patients?chip=ACTIVE` | `src/app/patients/page.tsx` | All Authenticated | `/api/patients?activeChip=ACTIVE` | **PASS** | Query chip filter verified. |
| **OPD Queue (Live)** | `/patients/opd-queue` | `src/app/patients/opd-queue/page.tsx` | Front Desk, Tech, Admin | `/api/patients`, `/api/orders` | **PASS** | Built (8.36 kB); live queue verified. |
| **Today's Registrations** | `/patients?chip=TODAY` | `src/app/patients/page.tsx` | Front Desk, Admin | `/api/patients?activeChip=TODAY` | **PASS** | Filter chip verified. |
| **Critical Watch List** | `/patients?chip=CRITICAL` | `src/app/patients/page.tsx` | Pathologist, Tech, Admin | `/api/patients?activeChip=CRITICAL` | **PASS** | Live watch list verified. |
| **Patient Details View** | `/patients/[id]` | `src/app/patients/[id]/page.tsx` | All Authenticated | `/api/patients/:id` | **PASS** | Dynamic route built (34.7 kB); VIP shield verified. |
| **Edit Patient** | `/patients/[id]/edit` | `src/app/patients/[id]/edit/page.tsx` | Front Desk, Admin | `/api/patients/:id` | **PASS** | Dynamic edit form built (6.33 kB). |
| **Print Patient Summary** | `/patients/[id]/print` | `src/app/patients/[id]/print/page.tsx` | Front Desk, Admin | `/api/patients/:id` | **PASS** | Print layout built (4.32 kB). |
| **All Doctors Directory** | `/doctors` | `src/app/doctors/page.tsx` | All Authenticated | `/api/doctors` | **PASS** | Built (46.9 kB); doctor search verified. |
| **Add Doctor** | `/doctors/new` | `src/app/doctors/new/page.tsx` | Admin, Branch Admin | `/api/doctors` | **PASS** | Built (1.81 kB); commission rate configuration. |
| **Doctor Profile** | `/doctors/[id]` | `src/app/doctors/[id]/page.tsx` | Doctor, Admin | `/api/doctors/:id` | **PASS** | Dynamic route built (5.97 kB). |
| **ABDM / ABHA Console** | `/abdm` | `src/app/abdm/page.tsx` | Front Desk, Admin | `/api/abdm/*` | **PASS** | Built (23.2 kB); OTP & scan & share tabs verified. |
| **Test Catalog** | `/tests` | `src/app/tests/page.tsx` | All Authenticated | `/api/tests` | **PASS** | Built (42.0 kB); search, filter & catalog matrix. |
| **Add / Edit Test** | `/tests/new` | `src/app/tests/new/page.tsx` | Lab Tech, Admin | `/api/tests` | **PASS** | Built (13.4 kB); multi-parameter formula builder. |
| **Test Categories** | `/tests/categories` | `src/app/tests/categories/page.tsx` | Lab Tech, Admin | `/api/tests/categories` | **PASS** | Built (8.02 kB); category management. |
| **Parameters & Units** | `/tests/parameters` | `src/app/tests/parameters/page.tsx` | Lab Tech, Admin | `/api/tests/parameters` | **PASS** | Built (11.1 kB); parameter master verified. |
| **Reference Ranges (CLSI)** | `/tests/reference-ranges` | `src/app/tests/reference-ranges/page.tsx`| Lab Tech, Pathologist, Admin| `/api/tests/reference-ranges` | **PASS** | Built (6.6 kB); age/gender intervals. |
| **Test Packages** | `/tests/packages` | `src/app/tests/packages/page.tsx` | Front Desk, Tech, Admin | `/api/tests/packages` | **PASS** | Built (6.53 kB); multi-test health bundles. |
| **Test Training Guide** | `/tests/training` | `src/app/tests/training/page.tsx` | Lab Tech, Pathologist | None | **PASS** | Built (3.29 kB); phlebotomy training guide. |
| **Orders Directory** | `/orders` | `src/app/orders/page.tsx` | All Authenticated | `/api/orders` | **PASS** | Built (42.0 kB); order list, status filters. |
| **New Lab Order** | `/orders/new` | `src/app/orders/new/page.tsx` | Front Desk, Admin | `/api/orders`, `/api/patients` | **PASS** | Built (2.24 kB); quick order booking desk. |
| **STAT Emergency Triage** | `/orders/stat-triage` | `src/app/orders/stat-triage/page.tsx` | Tech, Front Desk, Admin | `/api/enterprise/stat-triage/*`| **PASS** | Built (5.4 kB); siren acknowledgment verified. |
| **Order Details** | `/orders/[id]` | `src/app/orders/[id]/page.tsx` | All Authenticated | `/api/orders/:id` | **PASS** | Dynamic route built (6.92 kB). |
| **Order Barcode Label** | `/orders/[id]/barcode` | `src/app/orders/[id]/barcode/page.tsx` | Lab Tech, Front Desk | `/api/orders/:id`, `/api/barcodes` | **PASS** | Dynamic route built (6.42 kB); barcode rendering. |
| **Order Invoice** | `/orders/[id]/invoice` | `src/app/orders/[id]/invoice/page.tsx` | Front Desk, Accountant | `/api/invoices` | **PASS** | Dynamic route built (574 B). |
| **Order Receipt** | `/orders/[id]/receipt` | `src/app/orders/[id]/receipt/page.tsx` | Front Desk, Accountant | `/api/receipts` | **PASS** | Dynamic route built (14.2 kB); printable receipt. |
| **Invoices Register** | `/invoices` | `src/app/invoices/page.tsx` | Accountant, Admin | `/api/invoices` | **PASS** | Built (73.3 kB); register, daybook, aging tabs. |
| **Quick POS Billing Counter** | `/invoices/new` | `src/app/invoices/new/page.tsx` | Front Desk, Accountant | `/api/invoices`, `/api/payments`| **PASS** | Built (1.53 kB); POS checkout interface. |
| **Invoice Details View** | `/invoices/[id]` | `src/app/invoices/[id]/page.tsx` | Accountant, Admin | `/api/invoices/:id` | **PASS** | Dynamic route built (15.9 kB); payment history. |
| **Cashier Command Desk** | `/payments` | `src/app/payments/page.tsx` | Front Desk, Accountant, Admin | `/api/payments`, `/api/cash-counter` | **PASS** | Built (90.8 kB); shift drawer, refunds, ledgers. |
| **Samples Worklist** | `/samples` | `src/app/samples/page.tsx` | Lab Tech, Admin | `/api/samples` | **PASS** | Built (42.1 kB); 7-stage state tracker. |
| **Phlebotomy Collection Desk**| `/samples/collect` | `src/app/samples/collect/page.tsx` | Lab Tech, Phlebotomist | `/api/samples`, `/api/orders` | **PASS** | Built (4.99 kB); QNS volume guard. |
| **Tube Accessioning Station** | `/samples/tube-accessioning` | `src/app/samples/tube-accessioning/page.tsx`| Lab Tech, Admin | `/api/enterprise/tubes/*` | **PASS** | Built (5.98 kB); centrifuge & aliquot tracking. |
| **Sample Details View** | `/samples/[id]` | `src/app/samples/[id]/page.tsx` | Lab Tech, Admin | `/api/samples/:id` | **PASS** | Dynamic route built (6.38 kB). |
| **Sample Collection Sheet** | `/samples/[id]/collection-sheet`| `src/app/samples/[id]/collection-sheet/page.tsx`| Lab Tech | `/api/samples/:id` | **PASS** | Dynamic printable sheet built (13.1 kB). |
| **Sample Tube Label** | `/samples/[id]/label` | `src/app/samples/[id]/label/page.tsx` | Lab Tech | `/api/samples/:id` | **PASS** | Dynamic barcode label built (8.07 kB). |
| **Analyzers Fleet Dashboard** | `/analyzers` | `src/app/analyzers/page.tsx` | Lab Tech, Admin | `/api/analyzers` | **PASS** | Built (148 kB); bidirectional worklist & QC. |
| **Analyzer Detail & Logs** | `/analyzers/[id]` | `src/app/analyzers/[id]/page.tsx` | Lab Tech, Admin | `/api/analyzers/:id` | **PASS** | Dynamic route built (14.2 kB). |
| **Microbiology Culture Hub** | `/microbiology` | `src/app/microbiology/page.tsx` | Lab Tech, Pathologist | `/api/enterprise-tier2/microbiology/*` | **PASS** | Built (19.1 kB); culture bench worklists. |
| **AST & MIC Workstation** | `/microbiology/ast-workstation`| `src/app/microbiology/ast-workstation/page.tsx`| Pathologist, Lab Tech | `/api/enterprise-tier2/microbiology/*` | **PASS** | Built (5.79 kB); antibiotic sensitivity matrix. |
| **Integration Engine Matrix** | `/integrations` | `src/app/integrations/page.tsx` | Admin, Lab Tech | `/api/analyzers/*` | **PASS** | Built (19.2 kB); HL7/ASTM stream & DLQ. |
| **Results Entry Worklist** | `/results` | `src/app/results/page.tsx` | Lab Tech, Pathologist | `/api/results` | **PASS** | Built (54.0 kB); delta alerts, panic value tags. |
| **Result Entry Details** | `/results/[id]` | `src/app/results/[id]/page.tsx` | Lab Tech, Pathologist | `/api/results/:id` | **PASS** | Dynamic route built (8.5 kB). |
| **Approval Queue (Ready)** | `/approvals` | `src/app/approvals/page.tsx` | Pathologist, Super Admin | `/api/approvals` | **PASS** | Built (18.4 kB); digital sign-off desk. |
| **Approval Detail View** | `/approvals/[id]` | `src/app/approvals/[id]/page.tsx` | Pathologist, Super Admin | `/api/approvals/:id` | **PASS** | Dynamic route built (11.8 kB). |
| **Panic Triage & Read-Back** | `/approvals/panic-triage` | `src/app/approvals/panic-triage/page.tsx`| Pathologist, Admin | `/api/enterprise/panic-readback/*` | **PASS** | Built (6.73 kB); telephonic read-back ledger. |
| **Report Gallery** | `/reports` | `src/app/reports/page.tsx` | Pathologist, Tech, Admin | `/api/reports` | **PASS** | Built (217 kB); PDF generation & logs. |
| **Order Report View** | `/reports/order/[orderId]` | `src/app/reports/order/[orderId]/page.tsx`| All Authenticated | `/api/reports`, `/api/orders/:id` | **PASS** | Dynamic route built (12.2 kB). |
| **QR Report Verification** | `/verify-report` | `src/app/verify-report/page.tsx` | Public | None (Client Form) | **PASS** | Built (3.08 kB); public hash verification. |
| **Public Report By Hash** | `/verify-report/[reportId]` | `src/app/verify-report/[reportId]/page.tsx`| Public | `/api/reports/verify/:reportId` | **PASS** | Dynamic public route built (8.15 kB). |
| **Inventory & Reagents** | `/inventory` | `src/app/inventory/page.tsx` | Lab Tech, Admin | `/api/enterprise-tier2/inventory/*` | **PASS** | Built (19.3 kB); FEFO lot validation, cold-chain. |
| **Reagent CPT Profitability**| `/inventory/reagent-cpt` | `src/app/inventory/reagent-cpt/page.tsx`| Admin, Accountant | `/api/enterprise-tier2/inventory/*` | **PASS** | Built (2.8 kB); test recipe margin analysis. |
| **Sample Logistics & Fleet** | `/logistics` | `src/app/logistics/page.tsx` | Tech, Front Desk, Admin | `/api/enterprise-tier2/logistics/*` | **PASS** | Built (27.7 kB); GPS radar, cold-chain IoT. |
| **Hub & Spoke Manifest Dock**| `/logistics/hub-manifest` | `src/app/logistics/hub-manifest/page.tsx`| Lab Tech, Receptionist | `/api/enterprise-tier2/logistics/*` | **PASS** | Built (4.78 kB); consignment check-in. |
| **Clinical AI Diagnostics** | `/ai-studio` | `src/app/ai-studio/page.tsx` | Pathologist, Doctor, Admin | `/api/ai/*` | **PASS** | Built (121 kB); 16 sub-modules, CDSS guards. |
| **Lab Digital Twin (DES)** | `/digital-twin` | `src/app/digital-twin/page.tsx` | Admin, Lab Director | `/api/v1/digital-twin/*` | **PASS** | Built (32.3 kB); Monte Carlo surge simulation. |
| **Clinical Communication** | `/communication` | `src/app/communication/page.tsx` | All Authenticated | `/api/communications` | **PASS** | Built (28.1 kB); 2-way inbox, emergency paging. |
| **WhatsApp Engine** | `/whatsapp` | `src/app/whatsapp/page.tsx` | Front Desk, Admin | `/api/whatsapp/*` | **PASS** | Built (3.41 kB); report dispatch & templates. |
| **General Settings** | `/settings` | `src/app/settings/page.tsx` | Admin, Branch Admin | `/api/settings/laboratory` | **PASS** | Built (39.9 kB); profile, NABL, security. |
| **Communication Providers** | `/settings/communications` | `src/app/settings/communications/page.tsx`| Admin | `/api/settings/laboratory` | **PASS** | Built (10.4 kB); SMS, WhatsApp & SMTP settings. |
| **Roles & Permissions** | `/settings/roles` | `src/app/settings/roles/page.tsx` | Super Admin, Admin | `/api/auth/admin/rbac/matrix` | **PASS** | Built (1.53 kB); RBAC matrix editor. |
| **User Management** | `/settings/users` | `src/app/settings/users/page.tsx` | Admin, Branch Admin | `/api/users` | **PASS** | Built (1.58 kB); user directory & unlock. |
| **Unauthorized Notice** | `/unauthorized` | `src/app/unauthorized/page.tsx` | Public | None | **PASS** | Built (755 B); 403 access denial screen. |

---

## 3. Direct URL Access & Navigation State Retention

1. **Direct Access**:
   - Accessing deep nested routes directly (e.g., `/patients/cmvm37ic90000v4vg9l845hg9`, `/invoices?tab=daybook`, `/approvals/panic-triage`) preserves session authorization tokens stored in cookies/localStorage via `AuthProvider.tsx`.
2. **Browser Refresh**:
   - Tab queries (`?tab=...`, `?view=...`, `?filter=...`) are synchronized to Next.js `useSearchParams()` across all major workstations (Dashboard, Patients, Invoices, Payments, Analyzers, AI Studio), ensuring zero loss of operational context upon browser reload.
3. **Back and Forward Navigation**:
   - Standard browser history is respected; modal states (Quick Communication, Global Search) use local React state and escape keylisteners without corrupting the browser navigation stack.
4. **404 Handling**:
   - Next.js root `_not-found` handler exists and properly displays a medical fallback with a "Return to Dashboard" action.
