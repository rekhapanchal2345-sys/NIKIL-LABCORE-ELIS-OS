/**
 * Enterprise Accounting Ledger & GST Subtotal Engine — NIKIL-LABCORE-ELIS-OS
 * 
 * Category 28: Financial Ledger, GST, & Multi-Currency Accounting Bugs
 * - Bug 28.1: Rounding Difference in B2B Consolidated Invoices (Subtotal-level GST calculation without line-item rounding drift)
 * - Bug 28.2: Advance Payment vs. Credit Note Allocation Desync (Double-Entry General Ledger with Debit == Credit Invariants)
 */

export interface InvoiceLineItemInput {
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number; // In INR (e.g. 150.33)
  discountPercent?: number;
}

export interface ConsolidatedGstInvoice {
  itemsCount: number;
  taxableSubtotal: number;
  cgstRatePercent: number;
  cgstAmount: number;
  sgstRatePercent: number;
  sgstAmount: number;
  totalTaxAmount: number;
  roundOffAdjustment: number;
  finalGrossTotal: number;
  isPaiseReconciled: boolean;
}

export interface LedgerEntryLine {
  accountName:
    | 'Asset:CashOnHand'
    | 'Asset:Bank'
    | 'Asset:AccountsReceivable'
    | 'Liability:PatientAdvance'
    | 'Liability:RefundsPayable'
    | 'Revenue:LabDiagnosticServices';
  debitAmount: number;
  creditAmount: number;
  description: string;
}

export interface PostJournalTransactionInput {
  transactionNumber: string;
  referenceType: 'PATIENT_ADVANCE' | 'INVOICE_BILLING' | 'REFUND_PAYOUT' | 'CREDIT_NOTE_ADJUSTMENT';
  referenceId: string;
  patientId?: string;
  entries: LedgerEntryLine[];
}

export interface JournalPostingResult {
  transactionNumber: string;
  isCommitted: boolean;
  totalDebit: number;
  totalCredit: number;
  balanceDiscrepancy: number;
  error?: string;
}

export class EnterpriseGstCalculator {
  /**
   * Helper for standard banker's/statutory 2-decimal rounding.
   */
  public static roundHalfUp(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  /**
   * Bug 28.1: Subtotal-Level GST Calculation.
   * Prevents the ₹0.05 - ₹1.50 rounding drift caused by summing individually rounded line-item taxes.
   */
  public static calculateConsolidatedInvoice(
    lineItems: InvoiceLineItemInput[],
    gstRatePercent: number = 18.0
  ): ConsolidatedGstInvoice {
    // 1. Compute exact taxable subtotal across all lines without premature rounding
    let rawSubtotal = 0;
    for (const item of lineItems) {
      const discount = item.discountPercent ? (item.unitPrice * item.discountPercent) / 100 : 0;
      const effectivePrice = item.unitPrice - discount;
      rawSubtotal += effectivePrice * item.quantity;
    }

    const taxableSubtotal = this.roundHalfUp(rawSubtotal);

    // 2. Compute CGST and SGST strictly at the invoice subtotal level (typically 9% + 9%)
    const halfRate = gstRatePercent / 2;
    const cgstAmount = this.roundHalfUp((taxableSubtotal * halfRate) / 100);
    const sgstAmount = this.roundHalfUp((taxableSubtotal * halfRate) / 100);
    const totalTaxAmount = this.roundHalfUp(cgstAmount + sgstAmount);

    // 3. Exact sum before round-off
    const exactTotal = taxableSubtotal + totalTaxAmount;
    const finalGrossTotal = Math.round(exactTotal); // Round to nearest integer rupee
    const roundOffAdjustment = this.roundHalfUp(finalGrossTotal - exactTotal);

    // 4. Invariant check: Taxable + Tax + Adjustment == Gross
    const isPaiseReconciled =
      Math.abs(taxableSubtotal + totalTaxAmount + roundOffAdjustment - finalGrossTotal) < 0.001;

    return {
      itemsCount: lineItems.length,
      taxableSubtotal,
      cgstRatePercent: halfRate,
      cgstAmount,
      sgstRatePercent: halfRate,
      sgstAmount,
      totalTaxAmount,
      roundOffAdjustment,
      finalGrossTotal,
      isPaiseReconciled,
    };
  }
}

export class DoubleEntryLedgerEngine {
  /**
   * Bug 28.2: Double-Entry Balancing Invariant Validator.
   * Rejects any transaction where Sum(Debit) != Sum(Credit).
   */
  public static postJournalTransaction(input: PostJournalTransactionInput): JournalPostingResult {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of input.entries) {
      totalDebit += line.debitAmount;
      totalCredit += line.creditAmount;
    }

    totalDebit = EnterpriseGstCalculator.roundHalfUp(totalDebit);
    totalCredit = EnterpriseGstCalculator.roundHalfUp(totalCredit);
    const balanceDiscrepancy = EnterpriseGstCalculator.roundHalfUp(Math.abs(totalDebit - totalCredit));

    if (balanceDiscrepancy > 0.001) {
      return {
        transactionNumber: input.transactionNumber,
        isCommitted: false,
        totalDebit,
        totalCredit,
        balanceDiscrepancy,
        error: `UNBALANCED_LEDGER_ERROR: Total Debits (₹${totalDebit.toFixed(2)}) do not equal Total Credits (₹${totalCredit.toFixed(2)}). Delta: ₹${balanceDiscrepancy.toFixed(2)}`,
      };
    }

    return {
      transactionNumber: input.transactionNumber,
      isCommitted: true,
      totalDebit,
      totalCredit,
      balanceDiscrepancy: 0,
    };
  }

  /**
   * Bug 28.2: Helper to construct balanced advance payment transaction.
   */
  public static createPatientAdvanceEntry(
    txNum: string,
    patientId: string,
    amount: number
  ): PostJournalTransactionInput {
    return {
      transactionNumber: txNum,
      referenceType: 'PATIENT_ADVANCE',
      referenceId: patientId,
      patientId,
      entries: [
        {
          accountName: 'Asset:CashOnHand',
          debitAmount: amount,
          creditAmount: 0,
          description: `Advance received in cash from patient ${patientId}`,
        },
        {
          accountName: 'Liability:PatientAdvance',
          debitAmount: 0,
          creditAmount: amount,
          description: `Advance liability recorded for patient ${patientId}`,
        },
      ],
    };
  }

  /**
   * Bug 28.2: Helper to construct invoice settlement offsetting patient advance.
   */
  public static createInvoiceFromAdvanceEntry(
    txNum: string,
    orderId: string,
    patientId: string,
    billAmount: number
  ): PostJournalTransactionInput {
    return {
      transactionNumber: txNum,
      referenceType: 'INVOICE_BILLING',
      referenceId: orderId,
      patientId,
      entries: [
        {
          accountName: 'Liability:PatientAdvance',
          debitAmount: billAmount,
          creditAmount: 0,
          description: `Offsetting advance for order ${orderId}`,
        },
        {
          accountName: 'Revenue:LabDiagnosticServices',
          debitAmount: 0,
          creditAmount: billAmount,
          description: `Diagnostic services revenue recognized for order ${orderId}`,
        },
      ],
    };
  }
}
