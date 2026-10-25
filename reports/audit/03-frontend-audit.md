# Phase Three — Frontend Deep Debugging Audit
**NIKIL-LABCORE-ELIS-OS**  
*Unified Hospital, Diagnostic Pathology & Clinic Operating System*

---

## 1. Frontend Architecture & Technology Stack

- **Framework**: Next.js 15.5.25 (React 18.3.1, TypeScript 5.9.3)
- **Styling**: Tailwind CSS 3.4.19 with custom hospital-grade clinical design tokens (`globals.css`)
- **Icons**: Lucide React 1.34.0
- **Visualization**: Recharts 2.15.4 (Levey-Jennings charts, TAT graphs, Revenue Daybook, Erlang C queue simulation curves)
- **Document Generation**: `jspdf` 2.5.2, `pdf-lib` 1.17.1, `html2canvas` 1.4.1
- **Real-Time Client**: `socket.io-client` 4.8.4
- **State Management & Auth**: Context API (`AuthProvider`), LocalStorage & Cookie Sync (`auth-storage.ts`), unified API Client (`src/lib/api.ts`)

---

## 2. Rendering, Hydration & Component State

| Area | Inspection Finding | Verification Status |
| :--- | :--- | :--- |
| **Hydration Safety** | `DashboardLayout.tsx` and all major client pages employ an explicit `isMounted` state gate before rendering client-specific DOM trees. | **VERIFIED CLEAN** |
| **Component Imports** | Zero missing component or module imports. All 72 Next.js pages compiled successfully in production build (`Generating static pages 57/57`). | **VERIFIED CLEAN** |
| **React Key Uniqueness** | List renderers across Sample Worklists, Order tables, Patient Directory, and Diagnostic ML studios employ distinct database IDs (`id`, `orderId`, `sampleId`, `uhid`) as keys. | **VERIFIED CLEAN** |
| **Error Boundaries** | Route-level error boundaries exist in `/orders/error.tsx` and `/patients/error.tsx`. However, a root-level fallback `src/app/error.tsx` is recommended to prevent unhandled rendering failures in un-sandboxed routes. | **RECOMMENDED FIX** |
| **Landing Page Memoization** | In `src/app/page.tsx`, `analyzerCatalog` was instantiated inside the component function body, generating a Next.js `react-hooks/exhaustive-deps` warning. | **RECOMMENDED FIX** |

---

## 3. Data Flow & API Client Architecture

1. **Automatic Token Refresh & Deduplication**:
   - `src/lib/api.ts` implements `refreshSessionOnce()`. If multiple concurrent API requests receive HTTP 401 Unauthorized, the requests wait on a single shared in-flight refresh promise, preventing race conditions or multiple refresh token rotations.
2. **Schema & Field Name Concordance**:
   - DTOs in `src/lib/api.ts` match backend Prisma models and Zod schemas (e.g. `uhid`, `patientId`, `testId`, `orderStatus`, `tatMinutes`, `criticalValues`).
3. **Validation Error Surface**:
   - `flattenValidationErrors()` parses structured Zod validation error objects (`_errors`) from the backend and surfaces clear, field-level error messages in toast notifications.
4. **Number & Currency Formatting**:
   - `src/lib/money.ts` and `doctor.commission.ts` utilize Decimal precision formatting, eliminating floating-point rounding bugs (`₹ 0.10 + ₹ 0.20 = ₹ 0.30`).
5. **Timezone & Date Normalization**:
   - All timestamp payloads are ISO-8601 strings (`new Date().toISOString()`), formatted in local user locale for display with fallback relative time calculation ("Just now", "2 mins ago").

---

## 4. User Interaction & Form Validation

- **Buttons & Double-Submit Protection**:
  - `Button.tsx` supports a `loading` state that disables the button, renders an inline `Spinner`, and blocks subsequent clicks while promises are pending.
- **Confirmation Dialogs**:
  - `ConfirmDialog.tsx` handles destructive actions (canceling orders, rejecting samples, voiding invoices) with explicit confirmation modal states.
- **Search & Debouncing**:
  - `SearchInput.tsx` and `GlobalSearchModal.tsx` debounce user keystrokes (250ms) to prevent excessive backend queries.
- **Modal Keyboard & Focus Accessibility**:
  - `Modal.tsx` implements `role="dialog"`, `aria-modal="true"`, binds the Escape key to `onClose`, and locks `document.body.style.overflow = "hidden"` while visible.
