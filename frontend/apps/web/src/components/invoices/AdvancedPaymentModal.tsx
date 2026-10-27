"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import QRCode from "qrcode";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  CreditCard,
  Smartphone,
  Building2,
  FileText,
  Shield,
  DollarSign,
  X,
  Printer,
  Share2,
  ArrowRight,
  User,
  Phone,
  Receipt,
  RotateCcw,
  Check,
  Copy,
  Info,
  Banknote,
  QrCode,
  Tag,
  Gift,
} from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  method: string;
  transactionId?: string;
  paidAt: string;
  status: string;
  receivedBy?: string;
}

interface AdvancedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string | number;
    invoiceNumber?: string;
    orderNumber?: string;
    patientName?: string;
    patientUhid?: string;
    patientPhone?: string;
    patientEmail?: string;
    patientAge?: string | number;
    patientGender?: string;
    doctorName?: string;
    pendingAmount?: number;
    netPayable?: number;
    totalAmount?: number;
    paidAmount?: number;
    discount?: number;
    gstAmount?: number;
    paymentMode?: string;
    createdAt?: string;
  } | null;
  existingPayments?: Payment[];
  cashierName?: string;
  onPaymentSubmit: (data: {
    amount: number;
    paymentMethod: string;
    transactionId?: string;
    chequeNumber?: string;
    bankName?: string;
    insuranceProvider?: string;
    policyNumber?: string;
    paymentDate: string;
    remarks?: string;
    waiverAmount?: number;
  }) => Promise<void>;
  onGenerateReceipt?: (paymentData: any) => void;
  onPrintThermal?: (invoice: any) => void;
  onPrintA4?: (invoice: any) => void;
}

function fmt(amount?: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdvancedPaymentModal({
  isOpen,
  onClose,
  invoice,
  existingPayments = [],
  cashierName = "Jaya Ashapurama (Admin)",
  onPaymentSubmit,
  onGenerateReceipt,
  onPrintThermal,
  onPrintA4,
}: AdvancedPaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "UPI" | "CARD" | "NET_BANKING" | "CHEQUE" | "INSURANCE"
  >("CASH");
  const [transactionId, setTransactionId] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [cardBrand, setCardBrand] = useState("VISA / MASTER");
  const [posTerminalId, setPosTerminalId] = useState("POS-HDFC-01");
  const [chequeNumber, setChequeNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  // Cash Tendered & Change Return Calculator
  const [cashTendered, setCashTendered] = useState<string>("");

  // Goodwill Round-Off / Concession Waiver
  const [applyWaiver, setApplyWaiver] = useState(false);
  const [waiverAmount, setWaiverAmount] = useState<string>("");
  const [waiverReason, setWaiverReason] = useState("Management Round-off Waiver");

  // Live Screen QR Code for UPI
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copiedUPI, setCopiedUPI] = useState(false);

  // Post-Payment Actions
  const [autoPrintThermal, setAutoPrintThermal] = useState(true);
  const [autoSendWhatsApp, setAutoSendWhatsApp] = useState(true);

  // Derived financial numbers
  const netPayable = Number(invoice?.netPayable || invoice?.totalAmount || 0);
  const alreadyPaid = Number(invoice?.paidAmount || 0);
  const initialDue =
    invoice?.pendingAmount !== undefined
      ? Number(invoice?.pendingAmount)
      : Math.max(0, netPayable - alreadyPaid);

  const parsedAmount = Number(amount) || 0;
  const parsedWaiver = applyWaiver ? Number(waiverAmount) || 0 : 0;
  const totalSettledInStep = parsedAmount + parsedWaiver;
  const remainingBalance = Math.max(0, initialDue - totalSettledInStep);

  // Return change for Cash payments
  const parsedTendered = Number(cashTendered) || 0;
  const changeToReturn =
    paymentMethod === "CASH" && parsedTendered > parsedAmount
      ? parsedTendered - parsedAmount
      : 0;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && invoice) {
      const defaultDue =
        invoice.pendingAmount !== undefined
          ? Number(invoice.pendingAmount)
          : Math.max(
              0,
              Number(invoice.netPayable || invoice.totalAmount || 0) -
                Number(invoice.paidAmount || 0)
            );

      setAmount(defaultDue > 0 ? defaultDue.toString() : "");
      setPaymentMethod("CASH");
      setTransactionId("");
      setCardLast4("");
      setCardBrand("VISA / MASTER");
       setPosTerminalId("");
      setChequeNumber("");
      setBankName("");
      setInsuranceProvider("");
      setPolicyNumber("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setRemarks("");
      setError(null);
      setSuccess(false);
      setShowPaymentHistory(false);
      setCashTendered(defaultDue > 0 ? defaultDue.toString() : "");
      setApplyWaiver(false);
      setWaiverAmount("");
      setWaiverReason("Management Round-off Waiver");
    }
  }, [isOpen, invoice]);

  // Generate a QR only when an institution has configured its own VPA.
  const upiId = "";
  const invNumber = invoice?.invoiceNumber || `INV-${invoice?.id || "001"}`;
  const upiPayAmount = parsedAmount > 0 ? parsedAmount : initialDue;

  const generateUPIQR = useCallback(async () => {
    if (paymentMethod !== "UPI" || upiPayAmount <= 0) return;
    try {
      const payload = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
        "Healthcare facility"
      )}&am=${upiPayAmount.toFixed(2)}&cu=INR&tr=${encodeURIComponent(
        invNumber
      )}&tn=${encodeURIComponent(`Settle Due ${invNumber}`)}`;

      const url = await QRCode.toDataURL(payload, {
        width: 170,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      setQrCodeUrl(url);
    } catch {
      setQrCodeUrl("");
    }
  }, [paymentMethod, upiPayAmount, invNumber, upiId]);

  useEffect(() => {
    if (paymentMethod === "UPI") {
      generateUPIQR();
    }
  }, [paymentMethod, generateUPIQR]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (parsedAmount <= 0 && parsedWaiver <= 0) {
      setError("Please enter a valid payment amount to collect.");
      return;
    }

    if (totalSettledInStep > initialDue + 0.01) {
      setError(
        `Total settlement (${fmt(
          totalSettledInStep
        )}) cannot exceed outstanding due of ${fmt(initialDue)}`
      );
      return;
    }

    // Method-specific checks
    if (paymentMethod === "UPI" && !transactionId.trim()) {
      setError("Please enter UPI Reference / UTR Number from patient's app.");
      return;
    }

    if (paymentMethod === "CARD" && !transactionId.trim() && !cardLast4.trim()) {
      setError("Please enter Card Approval / Auth Code or Last 4 digits.");
      return;
    }

    if (paymentMethod === "NET_BANKING" && !transactionId.trim()) {
      setError("IMPS / NEFT Transfer Reference Number is required.");
      return;
    }

    if (paymentMethod === "CHEQUE") {
      if (!chequeNumber.trim()) {
        setError("Cheque number is required.");
        return;
      }
      if (!bankName.trim()) {
        setError("Drawn Bank name is required.");
        return;
      }
    }

    if (paymentMethod === "INSURANCE") {
      if (!insuranceProvider.trim()) {
        setError("TPA / Insurance Provider name is required.");
        return;
      }
      if (!policyNumber.trim()) {
        setError("Pre-Auth / Policy Claim ID is required.");
        return;
      }
    }

    try {
      setLoading(true);
      const compositeTxnId =
        transactionId.trim() ||
        (paymentMethod === "CARD" && cardLast4
          ? `${cardBrand} (Last 4: ${cardLast4}) [${posTerminalId}]`
          : undefined);

      const compositeRemarks = [
        remarks.trim(),
        applyWaiver && parsedWaiver > 0
          ? `[Waiver Applied: ₹${parsedWaiver} - ${waiverReason}]`
          : "",
        paymentMethod === "CASH" && changeToReturn > 0
          ? `[Cash Received: ₹${parsedTendered}, Change Returned: ₹${changeToReturn}]`
          : "",
      ]
        .filter(Boolean)
        .join(" | ");

      await onPaymentSubmit({
        amount: parsedAmount,
        paymentMethod,
        transactionId: compositeTxnId,
        chequeNumber: chequeNumber.trim() || undefined,
        bankName: bankName.trim() || undefined,
        insuranceProvider: insuranceProvider.trim() || undefined,
        policyNumber: policyNumber.trim() || undefined,
        paymentDate,
        remarks: compositeRemarks || undefined,
        waiverAmount: parsedWaiver > 0 ? parsedWaiver : undefined,
      });

      setSuccess(true);

      // Trigger automatic receipt generation / print
      if (onGenerateReceipt) {
        onGenerateReceipt({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          patientName: invoice.patientName,
          amount: parsedAmount,
          paymentMethod,
          transactionId: compositeTxnId,
          paymentDate,
        });
      }
    } catch (err) {
      console.error("Error processing counter payment:", err);
      setError("Failed to record payment in ledger. Please check network or try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUPI(true);
    setTimeout(() => setCopiedUPI(false), 2000);
  };

  // ─── POST-SETTLEMENT SUCCESS VIEW ───
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.4)] border border-slate-200 text-center">
          {/* Animated Success Ring */}
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
            <CheckCircle className="h-12 w-12 stroke-[2.5]" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-500/20 mb-2">
             Transaction Approved & Reconciled
          </span>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Payment Collected Successfully!
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Amount of <span className="font-extrabold text-slate-900">{fmt(parsedAmount)}</span> has been credited to counter cash drawer.
          </p>

          {/* Settle Summary Card */}
          <div className="my-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left text-xs space-y-2">
            <div className="flex justify-between border-b border-slate-200/70 pb-2">
              <span className="text-slate-500">Invoice Number:</span>
              <span className="font-bold text-slate-900">{invNumber}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/70 pb-2">
              <span className="text-slate-500">Patient:</span>
              <span className="font-bold text-slate-900">{invoice.patientName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/70 pb-2">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-bold text-indigo-700">{paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500">Remaining Balance:</span>
              <span
                className={`font-black text-sm ${
                  remainingBalance === 0 ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {remainingBalance === 0 ? "₹0.00 (Zero Dues • Fully Paid)" : fmt(remainingBalance)}
              </span>
            </div>
          </div>

          {/* Quick Print & Action Buttons */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPrintThermal?.(invoice);
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
              >
                <Printer className="h-4 w-4" />
                <span>Print Thermal Slip</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPrintA4?.(invoice);
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition-all active:scale-[0.98]"
              >
                <FileText className="h-4 w-4" />
                <span>Print A4 GST Invoice</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Done & Return to Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-[0_35px_110px_rgba(0,0,0,0.5)] border border-slate-200/80 my-auto overflow-hidden">
        {/* ─── HEADER: INSTITUTIONAL CASHIER CONSOLE ─── */}
        <div className="border-b border-slate-200 bg-white px-6 py-5 text-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                <Banknote className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">
                    Collect Due Payment
                  </h2>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                     Payment collection
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Invoice <span className="font-mono font-bold text-slate-800">#{invNumber}</span> • Cashier: <span className="text-slate-800 font-medium">{cashierName}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ─── BODY CONTAINER ─── */}
        <div className="p-6 overflow-y-auto max-h-[82vh]">
           {/* Patient demographics and balance */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Patient Demographics Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center gap-3 md:col-span-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-sm">
                {(invoice.patientName || "P")[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-bold text-slate-900 truncate">
                  {invoice.patientName || "Walk-in Patient"}
                </p>
                <p className="text-slate-500 font-mono text-[11px]">
                   UHID: {invoice.patientUhid || "—"}
                </p>
                <p className="text-slate-500 text-[11px]">
                  {invoice.patientPhone || "No Mobile"}
                </p>
              </div>
            </div>

             {/* Outstanding balance */}
            <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-50/40 p-3.5 md:col-span-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-amber-600" />
                  Outstanding Due Balance
                </span>
                <div className="text-2xl font-black text-amber-700 tracking-tight mt-0.5">
                  {fmt(initialDue)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>Gross: {fmt(netPayable)}</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">
                    Paid: {fmt(alreadyPaid)}
                  </span>
                </div>
              </div>

              {/* Quick Settle Full Button */}
              <button
                type="button"
                onClick={() => {
                  setAmount(initialDue.toString());
                  setCashTendered(initialDue.toString());
                }}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-all hover:scale-105 active:scale-95"
              >
                <span>Settle Full Due</span>
              </button>
            </div>
          </div>

          {/* Payment History Accordion */}
          {existingPayments.length > 0 && (
            <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/50 p-3">
                   {upiId ? <button
                type="button"
                onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                className="flex w-full items-center justify-between text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  <span>
                    Previous Payment Installments ({existingPayments.length})
                  </span>
                </div>
                <span className="text-[11px] text-indigo-600 font-semibold">
                  {showPaymentHistory ? "Hide History ▲" : "View Breakdown ▼"}
                </span>
                   </button> : <span className="text-[11px] font-medium text-slate-500">UPI VPA not configured</span>}

              {showPaymentHistory && (
                <div className="mt-3 space-y-2 border-t border-slate-200/80 pt-2 text-xs">
                  {existingPayments.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="flex items-center justify-between rounded-xl bg-white p-2 border border-slate-200/60"
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                          {p.method}
                        </span>
                        <span className="text-slate-600">
                          {new Date(p.paidAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {p.transactionId && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({p.transactionId})
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-emerald-700">
                        +{fmt(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 flex items-start gap-2.5 text-xs text-red-800 animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div className="font-medium">{error}</div>
              </div>
            )}

            {/* ─── SECTION 1: SETTLEMENT AMOUNT & SHORTCUTS ─── */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span>Amount to Collect Now</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Max Payable: <b className="text-slate-900">{fmt(initialDue)}</b>
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-black text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (paymentMethod === "CASH") {
                      setCashTendered(e.target.value);
                    }
                  }}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  max={initialDue}
                  className="w-full rounded-xl border-2 border-indigo-200/80 bg-white pl-8 pr-28 py-3 text-lg font-black text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    setAmount(initialDue.toString());
                    if (paymentMethod === "CASH") {
                      setCashTendered(initialDue.toString());
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  Full Amount
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setAmount(initialDue.toString());
                    if (paymentMethod === "CASH") setCashTendered(initialDue.toString());
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:border-indigo-400 hover:text-indigo-700 transition-all"
                >
                  100% Full ({fmt(initialDue)})
                </button>
                {initialDue > 50 && (
                  <button
                    type="button"
                    onClick={() => {
                      const half = (initialDue / 2).toFixed(2);
                      setAmount(half);
                      if (paymentMethod === "CASH") setCashTendered(half);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 transition-all"
                  >
                    50% Installment ({fmt(initialDue / 2)})
                  </button>
                )}
                {initialDue > 20 && (
                  <button
                    type="button"
                    onClick={() => {
                      const rounded = Math.floor(initialDue / 10) * 10;
                      setAmount(rounded.toString());
                      if (paymentMethod === "CASH") setCashTendered(rounded.toString());
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 transition-all"
                  >
                    Round ₹{Math.floor(initialDue / 10) * 10}
                  </button>
                )}

                {/* Goodwill Waiver Toggle */}
                <button
                  type="button"
                  onClick={() => setApplyWaiver(!applyWaiver)}
                  className={`ml-auto flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    applyWaiver
                      ? "bg-purple-100 text-purple-800 ring-1 ring-purple-400/30"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Gift className="h-3.5 w-3.5" />
                  <span>{applyWaiver ? "Waiver Active" : "+ Goodwill Waiver"}</span>
                </button>
              </div>

              {/* Goodwill Waiver Drawer */}
              {applyWaiver && (
                <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50/50 p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-950">
                      Concession / Round-off Waiver on Due
                    </span>
                    <span className="text-[11px] text-purple-700 font-medium">
                      Authority: Lab Director
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-purple-900 font-medium mb-1">
                        Waiver Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={waiverAmount}
                        onChange={(e) => setWaiverAmount(e.target.value)}
                        placeholder="e.g. 7.00"
                        className="w-full rounded-lg border border-purple-300 px-2.5 py-1.5 font-bold text-slate-900 bg-white"
                        max={initialDue}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-purple-900 font-medium mb-1">
                        Waiver Reason
                      </label>
                      <input
                        type="text"
                        value={waiverReason}
                        onChange={(e) => setWaiverReason(e.target.value)}
                        placeholder="e.g. Management Goodwill / Small Change"
                        className="w-full rounded-lg border border-purple-300 px-2.5 py-1.5 text-xs text-slate-900 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ─── SECTION 2: PAYMENT METHOD CHANNELS ─── */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select Payment Channel
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { id: "CASH", label: "Cash Desk", icon: DollarSign, color: "emerald" },
                  { id: "UPI", label: "Bharat UPI", icon: Smartphone, color: "indigo" },
                  { id: "CARD", label: "Card / POS", icon: CreditCard, color: "blue" },
                  { id: "NET_BANKING", label: "NetBank", icon: Building2, color: "purple" },
                  { id: "CHEQUE", label: "Cheque", icon: FileText, color: "amber" },
                  { id: "INSURANCE", label: "TPA Credit", icon: Shield, color: "teal" },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = paymentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPaymentMethod(item.id as any)}
                      className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 transition-all ${
                        isActive
                          ? "border-indigo-600 bg-indigo-50/80 text-indigo-950 font-black shadow-xs ring-2 ring-indigo-500/20"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-1 ${isActive ? "text-indigo-600" : "text-slate-500"}`} />
                      <span className="text-[11px] tracking-tight text-center">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── SECTION 3: CHANNEL SPECIFIC DETAILS ─── */}

            {/* A. CASH DESK: TENDERED & CHANGE RETURN CALCULATOR */}
            {paymentMethod === "CASH" && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Banknote className="h-4 w-4 text-emerald-700" />
                    Cash Counter Change Calculator
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Settle: <b>{fmt(parsedAmount)}</b>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Cash Tendered by Patient (₹)
                    </label>
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder={parsedAmount.toString()}
                      className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-bold text-slate-900"
                    />
                    {/* Note denomination buttons */}
                    <div className="mt-1.5 flex gap-1">
                      {[50, 100, 200, 500].map((note) => (
                        <button
                          key={note}
                          type="button"
                          onClick={() => setCashTendered(note.toString())}
                          className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                        >
                          ₹{note}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Return Change Badge */}
                  <div className="flex flex-col justify-center rounded-xl bg-white p-3 border border-emerald-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Return Change to Patient
                    </span>
                    <div
                      className={`text-xl font-black mt-0.5 ${
                        changeToReturn > 0 ? "text-emerald-700" : "text-slate-400"
                      }`}
                    >
                      {changeToReturn > 0 ? fmt(changeToReturn) : "₹0.00 (Exact)"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* B. BHARAT UPI: DYNAMIC QR & UTR INPUT */}
            {paymentMethod === "UPI" && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <QrCode className="h-4 w-4 text-indigo-600" />
                    Dynamic Bharat UPI Quick Scan
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUPI}
                    className="text-[11px] text-indigo-700 font-bold hover:underline flex items-center gap-1"
                  >
                    {copiedUPI ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedUPI ? "Copied UPI!" : `Copy VPA: ${upiId}`}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  {/* Dynamic QR Display */}
                  <div className="flex flex-col items-center justify-center bg-white p-3 rounded-2xl border border-indigo-100 shadow-xs sm:col-span-1">
                    {qrCodeUrl ? (
                      <img
                        src={qrCodeUrl}
                        alt="Dynamic UPI QR"
                        className="w-32 h-32 object-contain"
                      />
                    ) : (
                      <div className="h-32 w-32 flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
                         UPI QR is unavailable until a VPA is configured.
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-slate-600 mt-1">
                      Scan: {fmt(parsedAmount)}
                    </span>
                  </div>

                  {/* UTR Reference Input */}
                  <div className="sm:col-span-2 space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <span>UPI UTR / Reference Number</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. 423589012345 (12-digit UTR)"
                        className="w-full rounded-xl border border-indigo-300 bg-white px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Ask the patient to scan the QR with GPay, PhonePe, or Paytm, then enter the 12-digit UPI reference number.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* C. CARD / POS MACHINE */}
            {paymentMethod === "CARD" && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 text-xs space-y-3">
                <span className="font-bold text-blue-950 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  POS Card Swipe / Tap Terminal Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Card Network
                    </label>
                    <select
                      value={cardBrand}
                      onChange={(e) => setCardBrand(e.target.value)}
                      className="w-full rounded-xl border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                    >
                      <option value="VISA">Visa</option>
                      <option value="MASTERCARD">Mastercard</option>
                      <option value="RUPAY">RuPay</option>
                      <option value="AMEX">American Express</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Card Last 4 Digits
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={cardLast4}
                      onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 4291"
                      className="w-full rounded-xl border border-blue-300 bg-white px-3 py-2 font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Approval / Auth Code
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g. APPR-9921"
                      className="w-full rounded-xl border border-blue-300 bg-white px-3 py-2 font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* D. NET BANKING / NEFT / IMPS */}
            {paymentMethod === "NET_BANKING" && (
              <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4 text-xs space-y-3">
                <span className="font-bold text-purple-950 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  Bank Wire / NEFT / IMPS Reference
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Drawn Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank, SBI, ICICI"
                      className="w-full rounded-xl border border-purple-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Bank UTR / Transaction ID
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g. HDFCN26089123"
                      className="w-full rounded-xl border border-purple-300 bg-white px-3 py-2 font-mono font-bold text-slate-900"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* E. CHEQUE / DD */}
            {paymentMethod === "CHEQUE" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 text-xs space-y-3">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-amber-600" />
                  Cheque & Clearing Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Cheque Number
                    </label>
                    <input
                      type="text"
                      value={chequeNumber}
                      onChange={(e) => setChequeNumber(e.target.value)}
                      placeholder="e.g. 000124"
                      className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 font-mono font-bold text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Bank & Branch Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Axis Bank, Main Branch"
                      className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* F. TPA INSURANCE CREDIT */}
            {paymentMethod === "INSURANCE" && (
              <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 text-xs space-y-3">
                <span className="font-bold text-teal-950 flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-teal-600" />
                  Corporate / TPA Insurance Pre-Auth
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      TPA / Corporate Provider
                    </label>
                    <input
                      type="text"
                      value={insuranceProvider}
                      onChange={(e) => setInsuranceProvider(e.target.value)}
                      placeholder="e.g. Star Health, MediAssist"
                      className="w-full rounded-xl border border-teal-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Pre-Auth Approval / Policy Number
                    </label>
                    <input
                      type="text"
                      value={policyNumber}
                      onChange={(e) => setPolicyNumber(e.target.value)}
                      placeholder="e.g. AUTH-2026-9012"
                      className="w-full rounded-xl border border-teal-300 bg-white px-3 py-2 font-mono font-bold text-slate-900"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ─── SECTION 4: LIVE SETTLEMENT SIMULATOR ─── */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Total Outstanding Balance:</span>
                <span className="font-bold text-slate-900">{fmt(initialDue)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Settling via {paymentMethod}:</span>
                <span className="font-bold text-indigo-700">-{fmt(parsedAmount)}</span>
              </div>
              {parsedWaiver > 0 && (
                <div className="flex justify-between text-purple-700">
                  <span>Concession / Goodwill Waiver:</span>
                  <span className="font-bold">-{fmt(parsedWaiver)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200/80 pt-2 font-bold text-sm">
                <span>Remaining Due After Settlement:</span>
                <span
                  className={
                    remainingBalance === 0 ? "text-emerald-700 font-black" : "text-amber-700 font-black"
                  }
                >
                  {remainingBalance === 0
                    ? "₹0.00 (Zero Dues • Fully Paid)"
                    : fmt(remainingBalance)}
                </span>
              </div>
            </div>

            {/* ─── SECTION 5: CASHIER REMARKS & DATE ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Settlement Posting Date</span>
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Cashier Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Settled at Counter #01"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                />
              </div>
            </div>

            {/* ─── ACTION BUTTONS ─── */}
            <div className="pt-2 flex items-center gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || parsedAmount <= 0}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-emerald-600/25 transition-all hover:shadow-2xl hover:shadow-emerald-600/35 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Recording in Ledger...
                  </span>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Collect & Settle {fmt(parsedAmount)}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
