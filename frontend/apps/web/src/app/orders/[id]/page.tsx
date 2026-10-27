"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboardlayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { orderApi, paymentsApi } from "@/lib/api";
import {
  StatusBadge,
  PriorityBadge,
  PaymentProgressBar,
  TATIndicator,
  ToastContainer,
  useToast,
  OrderStatusType,
  OrderCommunicationHubModal,
  QuickAssignDoctorModal,
  QuickCollectSampleModal,
  AddPaymentModal,
  CancelOrderModal,
} from "@/components/orders/orders-ui";
import {
  ArrowLeft,
  Printer,
  FileText,
  FlaskConical,
  Clock,
  User,
  Stethoscope,
  CreditCard,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Share2,
  Mail,
  MessageSquare,
  DollarSign,
  Receipt,
  ScanLine,
  UserRound,
  ShieldCheck,
  Building2,
  Phone,
  Flame,
  MessageCircle,
  Activity,
  ArrowRight,
  Loader2,
  Check,
  TestTube,
} from "lucide-react";

const TUBE_CONTAINER_COLORS: Record<string, { bg: string; text: string; border: string; capColor: string; name: string }> = {
  "EDTA Tube": { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", capColor: "#8B5CF6", name: "Lavender EDTA" },
  "Lavender Top": { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", capColor: "#8B5CF6", name: "Lavender EDTA" },
  "Serum Separator Tube": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", capColor: "#F59E0B", name: "Gold SST Gel" },
  "SST": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", capColor: "#F59E0B", name: "Gold SST Gel" },
  "Red Top": { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200", capColor: "#EF4444", name: "Red Plain" },
  "Sodium Citrate": { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", name: "Light Blue Citrate" },
  "Light Blue": { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", name: "Light Blue Citrate" },
  "Lithium Heparin": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", capColor: "#10B981", name: "Green Heparin" },
  "Green Top": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", capColor: "#10B981", name: "Green Heparin" },
  "Fluoride Tube": { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-200", capColor: "#64748B", name: "Grey Fluoride" },
  "Grey Top": { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-200", capColor: "#64748B", name: "Grey Fluoride" },
  "Sterile Container": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", capColor: "#EAB308", name: "Urine Sterile Cup" },
};

function getContainerStyle(containerName?: string) {
  if (!containerName) return { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", name: "Standard Specimen" };
  for (const [key, val] of Object.entries(TUBE_CONTAINER_COLORS)) {
    if (containerName.toLowerCase().includes(key.toLowerCase())) {
      return val;
    }
  }
  return { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200", capColor: "#0284C7", name: containerName };
}

export default function OrderDetailPage({
  params,
}: {
  params?: any;
}) {
  const router = useRouter();
  const routeParams = useParams();
  const orderId = (routeParams?.id as string) || (params && typeof params === "object" && "id" in params ? params.id : "");

  const { toasts, showToast, removeToast } = useToast();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [copiedBarcode, setCopiedBarcode] = useState(false);

  // Modals
  const [modalType, setModalType] = useState<"assignDoctor" | "collectSample" | "addPayment" | "cancelOrder" | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const response = await orderApi.getById(orderId);
      if (response && (response.success || response.data)) {
        setOrder(response.data?.order || response.data);
      } else {
        setError(response?.message || "Order not found");
      }
    } catch (err: any) {
      console.error("Error loading order:", err);
      setError(err.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, fetchOrder]);

  const handleStatusChange = async (newStatus: OrderStatusType) => {
    if (!order) return;
    setUpdating(true);
    try {
      await orderApi.update(order.id, { orderStatus: newStatus });
      setOrder({ ...order, orderStatus: newStatus });
      showToast(`Order status updated to ${newStatus}`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update order status", "error");
    } finally {
      setUpdating(false);
    }
  };

  const isStat = order?.priority === "STAT" || order?.priority === "URGENT";
  const isPaid = order?.paymentStatus === "PAID";
  const isPartial = order?.paymentStatus === "PARTIAL";

  const handleCopyBarcode = () => {
    if (order?.barcode) {
      navigator.clipboard.writeText(order.barcode);
      setCopiedBarcode(true);
      showToast("Barcode copied to clipboard", "success");
      setTimeout(() => setCopiedBarcode(false), 2000);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout title={`Order ${order?.orderNumber || orderId}`}>
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        <div className="space-y-6 pb-12">
          {/* Header Navigation Bar (Pristine Light White Hospital Theme) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <Link
                  href="/orders"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 shadow-2xs transition-all hover:bg-slate-100 hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl font-black text-slate-900">
                      {order?.orderNumber || "Clinical Requisition"}
                    </h1>
                    {isStat && (
                      <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-black uppercase text-white shadow-xs flex items-center gap-1">
                        <Flame className="h-3 w-3 fill-white" /> {order.priority}
                      </span>
                    )}
                    {order?.orderStatus && (
                      <StatusBadge status={order.orderStatus as any} />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                    <button
                      onClick={handleCopyBarcode}
                      className="inline-flex items-center gap-1 hover:text-sky-700 transition-colors"
                      title="Click to copy barcode"
                    >
                      <ScanLine className="h-3.5 w-3.5 text-sky-600" />
                      <span>Barcode: {order?.barcode || "—"}</span>
                      {copiedBarcode ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-400" />}
                    </button>
                    {order?.createdAt && (
                      <span className="text-slate-400">
                        • Placed {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => window.open(`/orders/${orderId}/barcode`, "_blank")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" /> Barcode Labels
                </button>
                <button
                  onClick={() => window.open(`/orders/${orderId}/receipt`, "_blank")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
                >
                  <Receipt className="h-3.5 w-3.5 text-slate-500" /> Thermal / A4 Receipt
                </button>
                <button
                  onClick={() => setShowCommunicationModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all shadow-2xs"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp Update
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex h-72 flex-col items-center justify-center space-y-3 rounded-2xl border border-slate-200/90 bg-white p-8 shadow-xs">
              <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
              <p className="text-xs font-bold text-slate-600">Retrieving patient requisition dossier...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center shadow-xs">
              <h3 className="text-base font-black text-rose-800">Requisition Not Found</h3>
              <p className="mt-1 text-xs text-rose-600">{error}</p>
              <button
                onClick={() => router.push("/orders")}
                className="mt-4 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-xs"
              >
                Return to Orders
              </button>
            </div>
          ) : order ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left 2 Cols: Main Dossier */}
              <div className="space-y-6 lg:col-span-2">
                {/* Patient Demographics & Doctor */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-700">
                      <UserRound className="h-4 w-4 text-sky-600" /> Patient Demographics & Requisition Profile
                    </div>
                    {order.patient?.id && (
                      <Link
                        href={`/patients/${order.patient?.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:underline"
                      >
                        Open Full Profile <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient Full Name</p>
                      <p className="text-base font-black text-slate-900 mt-0.5">
                        {order.patient?.firstName} {order.patient?.lastName}
                      </p>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        {order.patient?.gender} • {order.patient?.age || "—"} Yrs • Phone: {order.patient?.phone || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">UHID / Medical Record #</p>
                      <p className="font-mono text-base font-black text-sky-700 mt-0.5">
                        {order.patient?.uhid || "—"}
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Registration Date: {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>

                    <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Referring Clinician / Consultant</p>
                      <div className="mt-1 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">
                            Dr. {order.doctor?.fullName || "Self / Walk-in Registration"}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {order.doctor?.specialization || "General Medicine"} • {order.doctor?.clinicName || "Outpatient Department"}
                          </p>
                        </div>
                        <button
                          onClick={() => setModalType("assignDoctor")}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          Change Doctor
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ordered Test Panels & Container Requirements */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                      <FlaskConical className="h-4 w-4 text-indigo-600" /> Prescribed Laboratory Assays ({order.items?.length || 0})
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      Subtotal: ₹{order.grandTotal}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {order.items?.map((item: any, idx: number) => {
                      const tube = getContainerStyle(item.test?.sampleContainer);
                      return (
                        <div
                          key={item.id || idx}
                          className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-2 transition-all hover:bg-slate-50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{item.test?.testName}</h4>
                                <span className="font-mono text-[10px] font-bold bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                  {item.test?.testCode}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {item.test?.processingDepartment || item.test?.category?.department || "Core Laboratory"} • Specimen: {item.test?.sampleType || "Whole Blood"}
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="font-mono font-bold text-sm text-slate-900">
                                ₹{item.finalPrice || item.price}
                              </span>
                              {item.test?.tatHours && (
                                <p className="text-[10px] text-slate-400 font-mono">TAT: {item.test.tatHours}h</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-xs">
                            <div
                              className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold"
                              style={{
                                borderColor: `${tube.capColor}55`,
                                backgroundColor: `${tube.capColor}12`,
                                color: tube.capColor,
                              }}
                            >
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tube.capColor }} />
                              <span>{item.test?.sampleContainer || "Standard Specimen Tube"}</span>
                            </div>

                            <span className="text-[10px] text-slate-500">
                              {item.test?.sampleType === "BLOOD" ? "Room Temperature (18-25°C)" : "Standard Pre-analytical SOP"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Financial Ledger & Workflow Stage */}
              <div className="space-y-6">
                {/* Financial Ledger Card (Light White Professional Clinical Styling) */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-slate-700">
                      <CreditCard className="h-4 w-4 text-emerald-600" /> Billing & Payment Ledger
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                      isPaid ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                      isPartial ? "bg-amber-50 text-amber-800 border border-amber-200" :
                      "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>

                  <div className="space-y-2 border-b border-slate-100 pb-3">
                    <div className="flex justify-between text-slate-600">
                      <span>Tests Subtotal</span>
                      <span className="font-mono font-bold text-slate-900">₹{order.grandTotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Discounts Applied</span>
                      <span className="font-mono font-bold text-emerald-700">₹{order.discount || "0.00"}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>GST Status</span>
                      <span className="font-mono text-emerald-700 font-medium">Exempt (SAC 999316)</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-base font-black text-slate-900">
                    <span>Grand Total</span>
                    <span className="font-mono text-sky-700">₹{order.grandTotal}</span>
                  </div>

                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Amount Paid</span>
                    <span className="font-mono">₹{order.paidAmount}</span>
                  </div>

                  <div className="flex justify-between font-bold text-rose-600">
                    <span>Balance Due</span>
                    <span className="font-mono">₹{order.dueAmount}</span>
                  </div>

                  {order.dueAmount > 0 && (
                    <button
                      onClick={() => setModalType("addPayment")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 p-3 text-xs font-black text-white shadow-xs hover:bg-emerald-700 transition-all mt-2"
                    >
                      <DollarSign className="h-4 w-4" /> Settle Balance of ₹{order.dueAmount}
                    </button>
                  )}
                </div>

                {/* Workflow Operational Action Box */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-sky-600" /> Clinical Workflow Progression
                  </h3>

                  {!order.sampleCollected ? (
                    <button
                      onClick={() => setModalType("collectSample")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 p-3.5 text-xs font-black text-white shadow-xs hover:bg-purple-700 transition-all"
                    >
                      <FlaskConical className="h-4 w-4" />
                      <span>Phlebotomy Sample Draw</span>
                    </button>
                  ) : order.orderStatus === "SAMPLE_COLLECTED" ? (
                    <button
                      onClick={() => handleStatusChange("PROCESSING")}
                      disabled={updating}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 p-3.5 text-xs font-black text-white shadow-xs hover:bg-sky-700 transition-all"
                    >
                      <span>Load on Diagnostic Analyzer</span>
                    </button>
                  ) : order.orderStatus === "PROCESSING" ? (
                    <button
                      onClick={() => handleStatusChange("COMPLETED")}
                      disabled={updating}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 p-3.5 text-xs font-black text-white shadow-xs hover:bg-emerald-700 transition-all"
                    >
                      <span>Pathology Validation & Sign-off</span>
                    </button>
                  ) : (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" /> Requisition Completed & Verified
                    </div>
                  )}

                  {order.orderStatus !== "CANCELLED" && order.orderStatus !== "COMPLETED" && (
                    <button
                      onClick={() => setModalType("cancelOrder")}
                      className="w-full rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                    >
                      Cancel Requisition
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Communication Modal */}
        <OrderCommunicationHubModal
          order={order}
          isOpen={showCommunicationModal}
          onClose={() => setShowCommunicationModal(false)}
        />

        {/* Assign Doctor Modal */}
        {modalType === "assignDoctor" && order && (
          <QuickAssignDoctorModal
            order={order}
            doctors={[]}
            isOpen={true}
            onClose={() => setModalType(null)}
            onAssigned={async (doctorId) => {
              await orderApi.update(order.id, { doctorId });
              showToast("Referring doctor updated", "success");
              setModalType(null);
              await fetchOrder();
            }}
          />
        )}

        {/* Collect Sample Modal */}
        {modalType === "collectSample" && order && (
          <QuickCollectSampleModal
            order={order}
            isOpen={true}
            onClose={() => setModalType(null)}
            onCollected={async (data) => {
              await orderApi.collectSample(order.id, {
                barcode: data.barcode,
                notes: data.notes,
              });
              showToast("Specimen collected and tube barcode assigned", "success");
              setModalType(null);
              await fetchOrder();
            }}
          />
        )}

        {/* Add Payment Modal */}
        {modalType === "addPayment" && order && (
          <AddPaymentModal
            order={order}
            isOpen={true}
            onClose={() => setModalType(null)}
            onPaymentAdded={async (data) => {
              await paymentsApi.create({
                orderId: order.id,
                amount: data.amount,
                method: data.method,
                remarks: data.remarks,
              });
              showToast(`Payment of ₹${data.amount} recorded`, "success");
              setModalType(null);
              await fetchOrder();
            }}
          />
        )}

        {/* Cancel Order Modal */}
        {modalType === "cancelOrder" && order && (
          <CancelOrderModal
            order={order}
            isOpen={true}
            onClose={() => setModalType(null)}
            onCancelled={async (reason) => {
              await orderApi.cancel(order.id, { reason });
              showToast(`Order #${order.orderNumber} cancelled`, "warning");
              setModalType(null);
              await fetchOrder();
            }}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
