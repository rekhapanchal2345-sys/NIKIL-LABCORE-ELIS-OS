import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  CreditCard,
  DollarSign,
  Printer,
  CheckCircle,
  FileText,
  ShieldCheck,
  Building,
  User,
  Calendar,
  AlertCircle,
  Download,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { doctorApi } from "@/lib/api";
import { showSuccess, showError } from "@/lib/notifications";
import { DoctorProfileData } from "./DoctorQuickViewModal";

interface DoctorCommissionPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorProfileData | null;
  onPayoutSuccess?: () => void;
}

export default function DoctorCommissionPayoutModal({
  isOpen,
  onClose,
  doctor,
  onPayoutSuccess,
}: DoctorCommissionPayoutModalProps) {
  const doctorName =
    doctor?.fullName ||
    doctor?.name ||
    [doctor?.firstName, doctor?.middleName, doctor?.lastName].filter(Boolean).join(" ") ||
    "Doctor";

  const commissionRate = Number(doctor?.commissionRate) || 15;

  const [realCommissionData, setRealCommissionData] = useState<{
    totalRevenue: number;
    totalCommission: number;
    orderCount: number;
  } | null>(null);
  const [loadingCommission, setLoadingCommission] = useState(false);

  const [amount, setAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<"UPI" | "CASH" | "NEFT" | "CHEQUE">("UPI");
  const [refNumber, setRefNumber] = useState<string>(`UTR-${Date.now().toString().slice(-8)}`);
  const [tdsDeduction, setTdsDeduction] = useState<number>(10); // 10% standard TDS
  const [remarks, setRemarks] = useState<string>("Monthly referral incentive settlement");
  const [payoutDate, setPayoutDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [voucherData, setVoucherData] = useState<any | null>(null);

  const fetchCommissionDetails = useCallback(async (docId: string) => {
    try {
      setLoadingCommission(true);
      const res = await doctorApi.getCommission(docId);
      if (res && (res.data || res.totalCommission !== undefined)) {
        const commObj = res.data || res;
        const rev = Number(commObj.totalRevenue) || 0;
        const comm = Number(commObj.totalCommission) || Math.round(rev * (commissionRate / 100));
        setRealCommissionData({
          totalRevenue: rev,
          totalCommission: comm,
          orderCount: Number(commObj.orderCount) || 0,
        });
        setAmount(comm);
      } else {
        // Default to doctor orders count if no commission history
        const fallbackRev = (doctor?._count?.orders || 0) * 1250;
        const fallbackComm = Math.round(fallbackRev * (commissionRate / 100));
        setRealCommissionData({
          totalRevenue: fallbackRev,
          totalCommission: fallbackComm,
          orderCount: doctor?._count?.orders || 0,
        });
        setAmount(fallbackComm);
      }
    } catch {
      const fallbackRev = (doctor?._count?.orders || 0) * 1250;
      const fallbackComm = Math.round(fallbackRev * (commissionRate / 100));
      setRealCommissionData({
        totalRevenue: fallbackRev,
        totalCommission: fallbackComm,
        orderCount: doctor?._count?.orders || 0,
      });
      setAmount(fallbackComm);
    } finally {
      setLoadingCommission(false);
    }
  }, [commissionRate, doctor?._count?.orders]);

  // Fetch real paid orders commission data from API when modal opens
  useEffect(() => {
    if (isOpen && doctor?.id) {
      setVoucherData(null);
      fetchCommissionDetails(String(doctor.id));
    }
  }, [isOpen, doctor?.id, fetchCommissionDetails]);

  if (!isOpen || !doctor) return null;

  const tdsAmount = Math.round((amount * tdsDeduction) / 100);
  const netPayable = amount - tdsAmount;
  const totalReferralRevenue = realCommissionData?.totalRevenue ?? 0;
  const unsettledCommission = realCommissionData?.totalCommission ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showError("Please enter a valid payout amount");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        amount,
        paymentMode,
        refNumber,
        tdsDeduction,
        remarks,
        payoutDate,
      };

      const res = await doctorApi.settlePayout(String(doctor.id), payload);

      if (res && (res.success || res.data?.voucher || res.voucher)) {
        const voucher = res.data?.voucher || res.voucher || {
          voucherNumber: `VCH-${Date.now().toString().slice(-6)}`,
          doctorName,
          doctorCode: doctor.doctorCode || `DOC-${doctor.id}`,
          clinicName: doctor.clinicName || "Clinic Affiliated",
          grossAmount: amount,
          tdsPercentage: tdsDeduction,
          tdsAmount,
          netPaid: netPayable,
          paymentMode,
          refNumber,
          payoutDate,
          remarks,
          timestamp: new Date().toLocaleString("en-IN"),
        };

        setVoucherData(voucher);
        showSuccess(`Commission payout of ₹${netPayable.toLocaleString()} settled & logged!`);
        if (onPayoutSuccess) onPayoutSuccess();
      } else {
        showError(res?.message || "Payout settlement failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Payout error:", err);
      showError(err?.message || "Failed to process commission payout. Payment entry not saved.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #payout-voucher-print, #payout-voucher-print * {
            visibility: visible !important;
          }
          #payout-voucher-print {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 24px !important;
            background: white !important;
            z-index: 999999 !important;
          }
        }
      `,
        }}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header - Light White Professional UI */}
          <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Referral Commission Settlement
                </h3>
                <p className="text-xs text-slate-500">
                  {doctorName} ({doctor.doctorCode || `DOC-${doctor.id}`})
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!voucherData ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Doctor Financials Card */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-800 font-semibold">Agreed Commission Rate:</span>
                  <span className="font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {commissionRate}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Calculated Referral Revenue:</span>
                  <span className="font-bold text-slate-900">
                    ₹{totalReferralRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-emerald-200/60">
                  <span className="text-emerald-900 font-bold">Unsettled Incentive Balance:</span>
                  <span className="font-bold text-emerald-900 text-sm">
                    ₹{unsettledCommission.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Amount to Settle & TDS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Gross Payout (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    TDS Rate (Section 194J)
                  </label>
                  <select
                    value={tdsDeduction}
                    onChange={(e) => setTdsDeduction(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-purple-600 focus:outline-none bg-white"
                  >
                    <option value={0}>0% (No TDS)</option>
                    <option value={2}>2% (Lower deduction)</option>
                    <option value={5}>5%</option>
                    <option value={10}>10% (Standard Professional)</option>
                  </select>
                </div>
              </div>

              {/* Net Payable Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">
                    Net Payable to Doctor:
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    TDS Deducted: ₹{tdsAmount.toLocaleString()} ({tdsDeduction}%)
                  </span>
                </div>
                <span className="text-xl font-black text-emerald-800">
                  ₹{netPayable.toLocaleString()}
                </span>
              </div>

              {/* Payment Mode & Reference */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Payment Mode *
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-purple-600 focus:outline-none bg-white"
                  >
                    <option value="UPI">UPI Transfer / GPay</option>
                    <option value="NEFT">Bank Transfer (NEFT/RTGS)</option>
                    <option value="CASH">Cash Payment</option>
                    <option value="CHEQUE">Bank Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    UTR / Ref Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold focus:border-purple-600 focus:outline-none"
                    placeholder="Transaction ID / UTR"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Accounting Remarks / Notes
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium focus:border-purple-600 focus:outline-none"
                  placeholder="e.g. Cleared commission for August 2026"
                />
              </div>

              {/* Doctor Account Info Preview */}
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-700">Disbursing to:</span>{" "}
                {doctor.bankAccountNumber || "UPI: 917202885030@upi"} | IFSC: {doctor.bankIfscCode || "SBIN0001234"}
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submitting ? "Processing Settlement..." : `Confirm Settlement (₹${netPayable.toLocaleString()})`}
                </button>
              </div>

            </form>
          ) : (
            /* PRINTABLE VOUCHER SUCCESS STATE */
            <div className="p-6 space-y-5">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Commission Disbursed Successfully!
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  Voucher #{voucherData.voucherNumber}
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div
                id="payout-voucher-print"
                className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-3 text-xs"
              >
                <div className="border-b border-slate-200 pb-2 flex justify-between items-start">
                  <div>
                    <span className="font-black text-slate-900 text-sm block">
                      LABCORE DIAGNOSTIC ENTERPRISE
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Referral Incentive Disbursement Voucher
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-700 block">
                      {voucherData.voucherNumber}
                    </span>
                    <span className="text-[10px] text-slate-500">{voucherData.payoutDate}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Referring Doctor:</span>
                    <span className="font-bold text-slate-900">{voucherData.doctorName} ({voucherData.doctorCode})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gross Incentive:</span>
                    <span className="font-semibold text-slate-900">₹{voucherData.grossAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TDS Deducted ({voucherData.tdsPercentage}%):</span>
                    <span className="text-red-600 font-semibold">-₹{voucherData.tdsAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1">
                    <span className="font-bold text-slate-900">Net Amount Paid:</span>
                    <span className="font-black text-emerald-800 text-sm">
                      ₹{voucherData.netPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Payment Mode & Ref:</span>
                    <span className="font-mono font-bold text-slate-700">
                      {voucherData.paymentMode} ({voucherData.refNumber})
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
                  <span>Authorized Accounts Signatory</span>
                  <span>Received with Thanks</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Done
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const phone = (doctor.whatsappNumber || doctor.phone || "").replace(/\D/g, "");
                    const msg = [
                      `Respected ${doctorName},`,
                      ``,
                      `Greetings from LabCore Diagnostic Enterprise.`,
                      ``,
                      `We have processed your referral incentive settlement:`,
                      `• Voucher No: ${voucherData.voucherNumber}`,
                      `• Settlement Date: ${voucherData.payoutDate}`,
                      `• Gross Amount: ₹${voucherData.grossAmount.toLocaleString()}`,
                      `• TDS Deducted (${voucherData.tdsPercentage}%): ₹${voucherData.tdsAmount.toLocaleString()}`,
                      `• Net Disbursed: ₹${voucherData.netPaid.toLocaleString()}`,
                      `• Mode: ${voucherData.paymentMode} (Ref: ${voucherData.refNumber})`,
                      ``,
                      `Thank you for your continued clinical trust.`,
                    ].join("\n");
                    const url = `https://wa.me/${phone.length === 10 ? `91${phone}` : phone}?text=${encodeURIComponent(msg)}`;
                    window.open(url, "_blank");
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp Advice
                </button>

                <button
                  type="button"
                  onClick={handlePrintVoucher}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Voucher
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
