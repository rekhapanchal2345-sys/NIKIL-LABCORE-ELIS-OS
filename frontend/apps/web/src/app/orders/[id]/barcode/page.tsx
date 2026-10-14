"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { orderApi } from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  Printer,
  ArrowLeft,
  Settings2,
  Copy,
  Plus,
  Minus,
  CheckCircle2,
  FlaskConical,
  Eye,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";

interface OrderData {
  id: string;
  orderNumber: string;
  barcode: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    uhid: string;
    phone: string;
    gender: string;
    dateOfBirth?: string;
  };
  items: Array<{
    id: string;
    test: {
      id: string;
      testCode: string;
      testName: string;
      sampleType: string;
      sampleContainer?: string;
    };
  }>;
  priority?: string;
  createdAt: string;
}

// Vacutainer Color & Cap Specifications based on Sample & Test Name
function getVacutainerSpec(testName: string, sampleType: string) {
  const name = testName.toLowerCase();
  const sample = sampleType.toLowerCase();

  if (
    name.includes("cbc") ||
    name.includes("hemogram") ||
    name.includes("hba1c") ||
    name.includes("esr") ||
    name.includes("blood group") ||
    name.includes("peripheral") ||
    name.includes("platelet")
  ) {
    return {
      capColor: "bg-purple-600",
      textColor: "text-purple-700 dark:text-purple-300",
      borderColor: "border-purple-300 dark:border-purple-800",
      label: "K2/K3 EDTA (Purple/Lavender)",
      short: "EDTA",
      tubeType: "LAVENDER_EDTA",
    };
  }

  if (
    name.includes("glucose") ||
    name.includes("sugar") ||
    name.includes("fbs") ||
    name.includes("ppbs") ||
    name.includes("rbs")
  ) {
    return {
      capColor: "bg-slate-400",
      textColor: "text-slate-700 dark:text-slate-300",
      borderColor: "border-slate-300 dark:border-slate-700",
      label: "Sodium Fluoride / Oxalate (Grey)",
      short: "FLUORIDE",
      tubeType: "GREY_FLUORIDE",
    };
  }

  if (
    name.includes("pt-inr") ||
    name.includes("coagulation") ||
    name.includes("aptt") ||
    name.includes("d-dimer") ||
    name.includes("citrate")
  ) {
    return {
      capColor: "bg-sky-500",
      textColor: "text-sky-700 dark:text-sky-300",
      borderColor: "border-sky-300 dark:border-sky-800",
      label: "3.2% Sodium Citrate (Light Blue)",
      short: "CITRATE",
      tubeType: "BLUE_CITRATE",
    };
  }

  if (sample.includes("urine") || name.includes("urine")) {
    return {
      capColor: "bg-amber-500",
      textColor: "text-amber-700 dark:text-amber-300",
      borderColor: "border-amber-300 dark:border-amber-800",
      label: "Sterile Urine Container",
      short: "URINE CUP",
      tubeType: "URINE_CONTAINER",
    };
  }

  // Default Serum / Clot Activator / SST
  return {
    capColor: "bg-rose-600",
    textColor: "text-rose-700 dark:text-rose-300",
    borderColor: "border-rose-300 dark:border-rose-800",
    label: "Plain Clot Activator / SST (Red/Gold)",
    short: "SERUM/SST",
    tubeType: "RED_SERUM",
  };
}

// Generate crisp SVG Code128-like barcode bars
function SvgBarcode({ code, width = 160, height = 38 }: { code: string; width?: number; height?: number }) {
  // Generate distinct pseudo-random but deterministic pattern from code string
  const bars: Array<{ x: number; w: number }> = [];
  let currentX = 2;
  const hash = code.split("").reduce((acc, char) => acc * 31 + char.charCodeAt(0), 7);

  // Start guard
  bars.push({ x: currentX, w: 2 }); currentX += 3;
  bars.push({ x: currentX, w: 1 }); currentX += 2;
  bars.push({ x: currentX, w: 2 }); currentX += 4;

  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const w1 = ((charCode ^ hash) % 3) + 1;
    const gap = (((charCode >> 2) ^ (i * 7)) % 2) + 1;
    const w2 = (((charCode >> 1) ^ (i * 3)) % 2) + 1;

    bars.push({ x: currentX, w: w1 });
    currentX += w1 + gap;
    bars.push({ x: currentX, w: w2 });
    currentX += w2 + 2;
  }

  // Stop guard
  bars.push({ x: currentX, w: 2 }); currentX += 3;
  bars.push({ x: currentX, w: 1 }); currentX += 2;
  bars.push({ x: currentX, w: 3 }); currentX += 4;

  const viewBoxWidth = Math.max(currentX + 4, 120);

  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${height}`}
      className="w-full h-auto overflow-visible"
      preserveAspectRatio="none"
    >
      {bars.map((bar, idx) => (
        <rect
          key={idx}
          x={bar.x}
          y={0}
          width={bar.w}
          height={height}
          fill="#000000"
        />
      ))}
    </svg>
  );
}

export default function OrderBarcodePage({
  params,
}: {
  params?: any;
}) {
  const router = useRouter();
  const routeParams = useParams();
  const orderId = (routeParams?.id as string) || (params && typeof params === "object" && "id" in params ? params.id : "");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  // Label configuration
  const [labelFormat, setLabelFormat] = useState<"50x25" | "38x19" | "A4_SHEET">("50x25");
  const [copiesPerTube, setCopiesPerTube] = useState<Record<string, number>>({});
  const [selectedTubes, setSelectedTubes] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"PRINT_VIEW" | "3D_SIMULATION">("PRINT_VIEW");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await orderApi.getById(orderId);
        if (res.success && res.data) {
          const data = res.data?.order || res.data;
          setOrder(data);

          // Initialize tube selection & copies
          const copies: Record<string, number> = {};
          const selected: Record<string, boolean> = {};
          const qrs: Record<string, string> = {};

          for (let i = 0; i < (data.items || []).length; i++) {
            const item = data.items[i];
            copies[item.id] = 1;
            selected[item.id] = true;

            const qrPayload = `${data.orderNumber || ""}|${data.barcode || ""}|${item.test?.testCode || "TEST"}|${data.patient?.uhid || ""}`;
            try {
              const qrUrl = await QRCode.toDataURL(qrPayload, {
                width: 80,
                margin: 0,
                color: { dark: "#000000", light: "#ffffff" },
              });
              qrs[item.id] = qrUrl;
            } catch (qrErr) {
              console.error("QR generation error:", qrErr);
            }
          }

          setCopiesPerTube(copies);
          setSelectedTubes(selected);
          setQrMap(qrs);
        } else {
          setError("Failed to load order for barcode printing");
        }
      } catch (err: any) {
        console.error("Barcode fetch error:", err);
        setError(err.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  const handleToggleSelect = (itemId: string) => {
    setSelectedTubes((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleUpdateCopies = (itemId: string, delta: number) => {
    setCopiesPerTube((prev) => ({
      ...prev,
      [itemId]: Math.max(1, Math.min(10, (prev[itemId] || 1) + delta)),
    }));
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="text-center space-y-3">
            <div className="h-10 w-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">
              Generating High-Density Vacutainer Tube Barcodes...
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !order) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 text-center shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <FlaskConical className="h-12 w-12 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Order Not Found</h2>
            <p className="text-xs text-slate-500">{error || "Could not retrieve tube information."}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700"
            >
              Return to Orders
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Deduplicate tubes by spec container (e.g. if 3 tests share EDTA, combine them onto 1 tube sticker or separate)
  const itemsToPrint = (order.items || []).filter((item) => selectedTubes[item.id]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-6 px-4 print:p-0 print:bg-white">
        {/* ========================================================= */}
        {/* PRINT CONTROLS TOOLBAR (Hidden on Print) */}
        {/* ========================================================= */}
        <div className="max-w-5xl mx-auto mb-6 no-print space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <Link
              href={`/orders/${order.id}`}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Order #{order.orderNumber}</span>
            </Link>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Size Selector */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setLabelFormat("50x25")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    labelFormat === "50x25"
                      ? "bg-white dark:bg-slate-900 text-purple-600 shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Standard 50×25mm (2"×1")
                </button>
                <button
                  type="button"
                  onClick={() => setLabelFormat("38x19")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    labelFormat === "38x19"
                      ? "bg-white dark:bg-slate-900 text-purple-600 shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Micro 38×19mm
                </button>
                <button
                  type="button"
                  onClick={() => setLabelFormat("A4_SHEET")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    labelFormat === "A4_SHEET"
                      ? "bg-white dark:bg-slate-900 text-purple-600 shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  A4 Sheet (24-up)
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("PRINT_VIEW")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === "PRINT_VIEW"
                      ? "bg-white dark:bg-slate-900 text-slate-900 shadow-xs"
                      : "text-slate-600"
                  }`}
                >
                  Label Print Layout
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("3D_SIMULATION")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === "3D_SIMULATION"
                      ? "bg-white dark:bg-slate-900 text-purple-600 shadow-xs"
                      : "text-slate-600"
                  }`}
                >
                  Vacutainer 3D Preview
                </button>
              </div>

              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Labels</span>
              </button>
            </div>
          </div>

          {/* Tube Selection Checklist */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FlaskConical className="h-4 w-4 text-purple-600" />
                Select Vacutainer Tubes to Print ({itemsToPrint.length} of {order.items?.length || 0} selected)
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const all: Record<string, boolean> = {};
                    (order.items || []).forEach((i) => (all[i.id] = true));
                    setSelectedTubes(all);
                  }}
                  className="text-purple-600 hover:underline text-[11px] font-semibold"
                >
                  Select All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedTubes({})}
                  className="text-slate-500 hover:underline text-[11px]"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {(order.items || []).map((item) => {
                const spec = getVacutainerSpec(item.test?.testName || "Sample", item.test?.sampleType || "Blood");
                const isChecked = !!selectedTubes[item.id];
                const count = copiesPerTube[item.id] || 1;

                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      isChecked
                        ? "border-purple-300 bg-purple-50/40 dark:bg-purple-950/20"
                        : "border-slate-200 opacity-60"
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelect(item.id)}
                        className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2.5 w-2.5 rounded-full ${spec.capColor}`} />
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {item.test?.testName || "Laboratory Assay"}
                          </p>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {spec.short} • {item.test?.testCode || "TEST"}
                        </p>
                      </div>
                    </label>

                    {/* Copy multiplier */}
                    {isChecked && (
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border rounded-lg px-1 py-0.5 ml-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateCopies(item.id, -1)}
                          className="text-slate-400 hover:text-slate-700 p-0.5"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-[11px] font-bold px-1 font-mono">{count}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCopies(item.id, 1)}
                          className="text-slate-400 hover:text-slate-700 p-0.5"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PRINT LAYOUT: 50mm x 25mm VACUTAINER STICKERS */}
        {/* ========================================================= */}
        {activeTab === "PRINT_VIEW" && (
          <div
            className={`max-w-4xl mx-auto ${
              labelFormat === "A4_SHEET"
                ? "grid grid-cols-3 gap-3 p-6 bg-white rounded-2xl shadow-xl print:p-0 print:m-0 print:shadow-none print:max-w-none"
                : "flex flex-wrap gap-4 justify-center print:block print:m-0 print:p-0"
            }`}
          >
            {itemsToPrint.flatMap((item) => {
              const copies = copiesPerTube[item.id] || 1;
              const spec = getVacutainerSpec(item.test?.testName || "Sample", item.test?.sampleType || "Blood");
              const qr = qrMap[item.id];

              return Array.from({ length: copies }, (_, copyIndex) => (
                <div
                  key={`${item.id}-${copyIndex}`}
                  className={`bg-white text-black border-2 border-black font-sans leading-none overflow-hidden print:break-inside-avoid print:mb-2 ${
                    labelFormat === "38x19"
                      ? "w-[240px] h-[120px] p-2 text-[9px] rounded-lg shadow-sm"
                      : "w-[300px] h-[150px] p-2.5 text-[10px] rounded-xl shadow-md"
                  }`}
                  style={{ pageBreakInside: "avoid" }}
                >
                  {/* Top Bar: Tube Cap Color Banner & Urgent Flag */}
                  <div className="flex items-center justify-between pb-1 border-b border-black">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-6 rounded-xs ${spec.capColor} border border-black`} />
                      <span className="font-black tracking-tight uppercase text-[9px]">
                        {spec.short}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[9px] font-bold">
                      {(order.priority || "").toUpperCase() === "STAT" && (
                        <span className="bg-black text-white px-1 py-0.5 rounded font-black text-[8px] uppercase">
                          STAT
                        </span>
                      )}
                      <span>LabCore ELIS</span>
                    </div>
                  </div>

                  {/* Patient Demographics */}
                  <div className="pt-1 pb-0.5 flex justify-between items-baseline">
                    <span className="font-black text-xs uppercase truncate max-w-[190px]">
                      {order.patient?.lastName || ""}{order.patient?.firstName ? `, ${order.patient.firstName}` : "Patient"}
                    </span>
                    <span className="font-bold text-[10px] font-mono">
                      {order.patient?.gender?.charAt(0) || "U"}
                    </span>
                  </div>

                  <div className="flex justify-between text-[9px] font-mono pb-1 border-b border-black/40">
                    <span className="font-bold">UHID: {order.patient?.uhid || "—"}</span>
                    <span>{order.items.length > 1 ? `Tube ${copyIndex + 1}/${copies}` : "Single"}</span>
                  </div>

                  {/* Main Barcode & QR Code Section */}
                  <div className="flex items-center gap-2 pt-1">
                    {/* SVG Barcode */}
                    <div className="flex-1 min-w-0">
                      <SvgBarcode code={order.barcode} height={labelFormat === "38x19" ? 28 : 34} />
                      <p className="text-center font-mono font-bold tracking-wider text-[10px] mt-0.5">
                        {order.barcode}
                      </p>
                    </div>

                    {/* QR Code */}
                    {qr && (
                      <div className="shrink-0 text-center">
                        <img src={qr} alt="Tube QR" className="h-10 w-10 border border-black/20" />
                      </div>
                    )}
                  </div>

                  {/* Footer: Test Code & Collection Date */}
                  <div className="pt-1 mt-0.5 border-t border-black flex justify-between items-center text-[9px]">
                    <span className="font-black uppercase truncate max-w-[150px]">
                      {item.test?.testCode || "TEST"} ({item.test?.testName || "Sample"})
                    </span>
                    <span className="font-mono text-[8px]">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })}{" "}
                      {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ));
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* 3D VACUTAINER TUBE WRAP SIMULATOR */}
        {/* ========================================================= */}
        {activeTab === "3D_SIMULATION" && (
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                Vacutainer Phlebotomy Tube Adherence Preview
              </h3>
              <p className="text-xs text-slate-500">
                Visual demonstration of proper sticker placement on standard 13×75mm and 13×100mm collection tubes
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
              {itemsToPrint.map((item) => {
                const spec = getVacutainerSpec(item.test?.testName || "Sample", item.test?.sampleType || "Blood");

                return (
                  <div
                    key={item.id}
                    className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col items-center"
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {item.test?.testName || "Sample Test"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mb-6">
                      {spec.label}
                    </span>

                    {/* Simulated Tube */}
                    <div className="relative w-16 h-72 rounded-b-full border-2 border-slate-300 dark:border-slate-700 bg-linear-to-r from-slate-100 via-white to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 shadow-inner flex flex-col items-center">
                      {/* Rubber Stopper / Cap */}
                      <div
                        className={`w-18 h-10 rounded-t-lg -mt-3 shadow-md border-2 border-black/20 ${spec.capColor} flex items-center justify-center text-[9px] text-white font-bold tracking-widest`}
                      >
                        BD
                      </div>

                      {/* Safety Hemogard collar */}
                      <div className="w-16 h-2 bg-slate-400" />

                      {/* Fill window indicator mark */}
                      <div className="w-full text-right pr-1 pt-4 text-[8px] text-slate-400 font-mono">
                        -- 4.0 mL
                      </div>

                      {/* Applied Label Sticker */}
                      <div className="absolute top-20 w-[92%] p-1.5 rounded-sm bg-white text-black border border-black shadow-md text-[8px] leading-tight font-mono">
                        <div className="flex items-center justify-between pb-0.5 border-b border-black">
                          <span className="font-bold">{spec.short}</span>
                          <span className="text-[7px]">LabCore</span>
                        </div>
                        <p className="font-bold text-[8px] truncate pt-0.5">
                          {order.patient?.lastName || ""}{order.patient?.firstName ? `, ${order.patient.firstName.charAt(0)}` : "Patient"}
                        </p>
                        <p className="text-[7px]">{order.patient?.uhid || "UHID"}</p>
                        <div className="my-0.5 bg-black h-4 w-full" />
                        <p className="text-[7px] font-bold truncate">{order.barcode}</p>
                        <p className="text-[7px] text-purple-700 font-bold">{item.test?.testCode || "TEST"}</p>
                      </div>

                      {/* Blood specimen simulation */}
                      <div className="absolute bottom-2 w-12 h-28 rounded-b-full bg-linear-to-t from-red-950 via-rose-900 to-red-800 opacity-80" />
                    </div>

                    <p className="text-[10px] text-slate-400 mt-4 text-center">
                      Leave fill volume indicator visible during sticker application
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}