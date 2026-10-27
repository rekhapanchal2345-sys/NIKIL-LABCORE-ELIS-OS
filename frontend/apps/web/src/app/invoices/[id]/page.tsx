"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/dashboardlayout";
import InvoiceDetails from "@/components/invoices/InvoiceDetails";
import PixelPerfectInvoice from "@/components/invoices/PixelPerfectInvoice";
import ThermalReceipt from "@/components/invoices/ThermalReceipt";
import { invoiceApi } from "@/lib/api";
import type { Invoice } from "@/components/invoices/InvoiceTable";
import { ArrowLeft, FileText, Printer, Receipt, ShieldCheck } from "lucide-react";

interface InvoiceItem {
  id: string | number;
  testName?: string;
  testCode?: string;
  hsnSacCode?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  amount?: number;
}

interface FullInvoiceData extends Invoice {
  items?: InvoiceItem[];
  taxAmount?: number;
  discountAmount?: number;
  notes?: string;
  patientInfo?: {
    age?: string;
    gender?: string;
    phone?: string;
    address?: string;
    email?: string;
  };
  doctorInfo?: {
    name?: string;
    qualification?: string;
    gstin?: string;
    address?: string;
  };
  payments?: Array<{
    amount: number;
    method: string;
    transactionId?: string;
    paidAt: string;
    receivedBy?: string;
  }>;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoice, setInvoice] = useState<FullInvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAutoPrintModal, setShowAutoPrintModal] = useState<"thermal" | "a4" | null>(null);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        setLoading(true);
        const response = await invoiceApi.getById(params.id as string);

        if (response.success && response.data) {
          const data = response.data as any;

          // Calculate patient age
          let age = "";
          if (data.order?.patient?.dateOfBirth) {
            const dob = new Date(data.order.patient.dateOfBirth);
            const today = new Date();
            const years = today.getFullYear() - dob.getFullYear();
            const months = today.getMonth() - dob.getMonth();
            age = `${years} yrs ${months >= 0 ? months : 12 + months}m`;
          }

          // Transform API data to match component interface
          const transformedInvoice: FullInvoiceData = {
            id: data.id,
            invoiceNumber: data.invoiceNumber,
            patientId: data.order?.patient?.id,
            patientName: data.order?.patient
              ? `${data.order.patient.firstName} ${data.order.patient.lastName}`
              : undefined,
            patientUhid: data.order?.patient?.uhid,
            orderId: data.orderId,
            orderNumber: data.order?.orderNumber,
            totalAmount: Number(data.subtotal || data.grandTotal),
            paidAmount: data.order?.payments
              ? data.order.payments
                  .filter((p: any) => p.status === "PAID")
                  .reduce((sum: number, p: any) => sum + Number(p.amount), 0)
              : 0,
            pendingAmount: data.pendingAmount,
            status: data.paymentStatus,
            paymentStatus: data.paymentStatus,
            paymentMode: data.order?.payments?.[0]?.method || "CASH",
            createdAt: data.createdAt,
            dueDate: data.dueDate,

            // Patient info
            patientInfo: {
              age: age || undefined,
              gender: data.order?.patient?.gender,
              phone: data.order?.patient?.phone,
              email: data.order?.patient?.email,
              address: data.order?.patient?.address
                ? `${data.order.patient.address}, ${data.order.patient.city || ""}`
                : undefined,
            },

            // Doctor info
            doctorInfo: {
              name: data.order?.doctor?.fullName,
              qualification: data.order?.doctor?.qualification,
              gstin: data.order?.doctor?.gstin,
              address: data.order?.doctor?.address,
            },

            // Items from order items
            items: data.order?.items?.map((item: any) => ({
              id: item.id,
              testName: item.test?.testName || item.test?.name || "Diagnostic Investigation",
              testCode: item.test?.testCode || item.test?.code,
              hsnSacCode: item.test?.hsnSacCode || "999312",
              quantity: item.quantity || 1,
              unitPrice: Number(item.price || item.unitPrice || 0),
              discount: Number(item.discount || 0),
              amount: Number(item.finalPrice || item.price || 0),
            })),

            // Tax and discount
            taxAmount: Number(data.gstAmount || 0),
            discountAmount: Number(data.discount || 0),

            // Notes
            notes: data.order?.notes,

            // Payments
            payments: data.order?.payments
              ?.filter((p: any) => p.status === "PAID")
              .map((p: any) => ({
                amount: Number(p.amount),
                method: p.method,
                transactionId: p.transactionId,
                paidAt: p.paidAt || p.createdAt,
                receivedBy: p.receivedBy || "Counter Cashier #1",
              })),
          };

          setInvoice(transformedInvoice);

          // Handle auto print
          if (searchParams.get("print") === "true") {
            const printType = searchParams.get("type") === "a4" ? "a4" : "thermal";
            setShowAutoPrintModal(printType);
          }
        } else {
          setError("Failed to load invoice");
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError("Failed to load invoice. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchInvoice();
    }
  }, [params.id, searchParams]);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice?.invoiceNumber}?`)) {
      return;
    }

    try {
      await invoiceApi.delete(params.id as string);
      router.push("/invoices");
    } catch (err) {
      console.error("Error deleting invoice:", err);
      alert("Failed to delete invoice");
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Invoice Audit">
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-600 mt-4">Loading Clinical Billing Record...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !invoice) {
    return (
      <DashboardLayout title="Invoice Not Found">
        <div className="rounded-2xl border border-rose-200 bg-white p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 mb-3">
            <Receipt className="h-7 w-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            {error || "Invoice Record Not Found"}
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            The requested invoice does not exist in this facility or has been archived.
          </p>
          <button
            onClick={() => router.push("/invoices")}
            className="mt-5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs"
          >
            ← Return to Invoices Register
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Invoice ${invoice.invoiceNumber}`}>
      <div className="space-y-5">
        {/* Navigation Breadcrumb & Back Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/90 pb-4 gap-3 bg-white p-4 rounded-2xl border shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/invoices"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Billing Desk</span>
                <span className="text-xs text-slate-300">/</span>
                <span className="text-xs text-slate-400 font-medium">Register</span>
                <span className="text-xs text-slate-300">/</span>
                <h1 className="text-sm font-bold font-mono text-slate-900">
                  {invoice.invoiceNumber || `INV-${invoice.id}`}
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Patient: <strong className="text-slate-800">{invoice.patientName || "Walk-in"}</strong> (UHID: {invoice.patientUhid || "—"})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/invoices/new"
              className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 shadow-xs hover:bg-blue-100 transition-colors"
            >
              + New Counter Bill
            </Link>
            <Link
              href="/invoices"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              All Invoices
            </Link>
          </div>
        </div>

        {/* Enterprise Invoice Details View */}
        <InvoiceDetails
          invoice={invoice}
          items={invoice.items}
          taxAmount={invoice.taxAmount}
          discountAmount={invoice.discountAmount}
          notes={invoice.notes}
          patientInfo={invoice.patientInfo}
          doctorInfo={invoice.doctorInfo}
          payments={invoice.payments}
          onDelete={handleDelete}
        />

        {/* Auto Print Modals if requested via URL param */}
        {showAutoPrintModal === "thermal" && (
          <ThermalReceipt
            invoice={{
              invoiceNumber: invoice.invoiceNumber,
              patientName: invoice.patientName,
              patientUhid: invoice.patientUhid,
              patientPhone: invoice.patientPhone,
              patientAge: invoice.patientInfo?.age,
              patientGender: invoice.patientInfo?.gender,
              orderNumber: invoice.orderNumber,
              doctorName: invoice.doctorName,
              items: (invoice.items || []).map((i) => ({
                testName: i.testName,
                testCode: i.testCode,
                quantity: i.quantity || 1,
                unitPrice: i.unitPrice || i.amount || 0,
                total: i.amount || (i.unitPrice || 0) * (i.quantity || 1),
                hsnSacCode: i.hsnSacCode || "999312",
              })),
              subtotal: invoice.totalAmount,
              discount: invoice.discount,
              gstAmount: invoice.gstAmount,
              netPayable: invoice.netPayable,
              paidAmount: invoice.paidAmount,
              pendingAmount: invoice.pendingAmount,
              paymentStatus: invoice.paymentStatus,
              paymentMode: invoice.paymentMode,
              createdAt: invoice.createdAt,
            }}
            cashierName={invoice.payments?.[0]?.receivedBy || "Cashier Counter #1"}
            labInfo={{ name: "LabCore Healthcare Facility" }}
            onClose={() => setShowAutoPrintModal(null)}
          />
        )}

        {showAutoPrintModal === "a4" && (
          <PixelPerfectInvoice
            invoice={{
              id: String(invoice.id),
              invoiceNumber: invoice.invoiceNumber,
              invoiceDate: invoice.createdAt,
              invoiceTime: invoice.createdAt,
              paymentMode: (invoice.paymentMode as string) || "CASH",
              transactionId: invoice.payments?.[0]?.transactionId || invoice.orderNumber,
              patientName: invoice.patientName,
              patientId: invoice.patientId == null ? undefined : String(invoice.patientId),
              patientUhid: invoice.patientUhid,
              age: invoice.patientInfo?.age,
              gender: invoice.patientInfo?.gender,
              phone: invoice.patientPhone,
              address: invoice.patientInfo?.address,
              collectedBy: invoice.payments?.[0]?.receivedBy,
              refDoctor: invoice.doctorName,
              items: (invoice.items || []).map((item) => ({
                id: item.id,
                testName: item.testName || "Diagnostic Investigation",
                testCode: item.testCode,
                hsnSacCode: item.hsnSacCode || "999312",
                quantity: item.quantity || 1,
                unitPrice: Number(item.unitPrice || item.amount || 0),
                amount: Number(item.amount || item.unitPrice || 0),
              })),
              subtotal: invoice.totalAmount,
              discount: invoice.discount,
              totalTax: invoice.gstAmount,
              netPayable: invoice.netPayable,
              paidAmount: invoice.paidAmount,
              pendingAmount: invoice.pendingAmount,
            }}
            onClose={() => setShowAutoPrintModal(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
