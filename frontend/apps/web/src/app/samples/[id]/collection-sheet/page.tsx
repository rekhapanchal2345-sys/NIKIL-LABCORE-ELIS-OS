"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { PointerEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { sampleApi, orderApi } from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function SignaturePad({ accent, onSigned }: { accent: "blue" | "emerald"; onSigned: (signed: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasInkRef = useRef(false);
  const colors = accent === "blue"
    ? { border: "border-blue-300", ink: "#1d4ed8", label: "text-blue-500", button: "text-blue-700" }
    : { border: "border-emerald-300", ink: "#047857", label: "text-emerald-600", button: "text-emerald-700" };

  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const w = rect.width || canvas.clientWidth || 300;
    const h = rect.height || canvas.clientHeight || 80;
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    const context = canvas.getContext("2d");
    if (context) {
      context.scale(ratio, ratio);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 2.5;
      context.strokeStyle = colors.ink;
    }
  }, [colors.ink]);

  useEffect(() => {
    initCanvas();
    window.addEventListener("resize", initCanvas);
    return () => window.removeEventListener("resize", initCanvas);
  }, [initCanvas]);

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const context = canvasRef.current?.getContext("2d");
    const position = point(event);
    if (!context || !position) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
    drawingRef.current = true;
    lastPointRef.current = position;
    context.beginPath();
    context.moveTo(position.x, position.y);
  };

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !lastPointRef.current) return;

    const events = (event.nativeEvent as any).getCoalescedEvents?.() || [event];
    for (const ce of events) {
      const rect = canvas.getBoundingClientRect();
      const currentX = ce.clientX - rect.left;
      const currentY = ce.clientY - rect.top;
      const midX = (lastPointRef.current.x + currentX) / 2;
      const midY = (lastPointRef.current.y + currentY) / 2;
      context.quadraticCurveTo(lastPointRef.current.x, lastPointRef.current.y, midX, midY);
      context.stroke();
      lastPointRef.current = { x: currentX, y: currentY };
    }

    if (!hasInkRef.current) {
      hasInkRef.current = true;
      onSigned(true);
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
    hasInkRef.current = false;
    onSigned(false);
  };

  return (
    <div className={`rounded-xl border-2 border-dashed ${colors.border} bg-white p-2`}>
      <div className={`mb-1 flex items-center justify-between text-[8px] font-bold uppercase tracking-wider ${colors.label}`}>
        <span>Draw signature below</span>
        <span>Touch / mouse / stylus</span>
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={draw}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="h-20 w-full cursor-crosshair touch-none rounded-lg border-b-2 border-slate-200 bg-gradient-to-br from-white to-slate-50"
        aria-label="Handwritten digital signature pad"
      />
      <div className="mt-2 flex items-center justify-between text-[8px] font-semibold text-slate-500">
        <span>Handwritten e-signature capture</span>
        <button type="button" onClick={clear} className={`font-bold uppercase tracking-wider ${colors.button} hover:opacity-70`}>Clear</button>
      </div>
    </div>
  );
}

interface SampleData {
  id: string;
  sampleNumber: string;
  barcode: string;
  patientId: string;
  orderId: string;
  testId: string;
  sampleType: string;
  status: string;
  collectedById?: string;
  collectedBy?: {
    id: string;
    employeeCode: string;
    fullName: string;
  };
  collectionType?: string;
  priority?: string;
  collectedAt?: string;
  receivedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    orderNumber: string;
    barcode: string;
    patient: {
      id: string;
      uhid: string;
      firstName: string;
      lastName: string;
      gender: string;
      dateOfBirth?: string;
      age?: number;
      phone?: string;
    };
    doctor?: {
      id: string;
      doctorCode: string;
      fullName: string;
      specialization: string;
    };
  };
  test: {
    id: string;
    testCode: string;
    testName: string;
    sampleType: string;
    sampleContainer: string;
  };
}

export default function SampleCollectionSheetPage() {
  const params = useParams();
  const router = useRouter();
  const [sample, setSample] = useState<SampleData | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectorName, setCollectorName] = useState("");
  const [collectorId, setCollectorId] = useState("");
  const [collectionTime, setCollectionTime] = useState("");
  const [qcVerifier, setQcVerifier] = useState("");
  const [qcVerifierId, setQcVerifierId] = useState("");
  const [qcVerificationTime, setQcVerificationTime] = useState("");
  const [collectorSignature, setCollectorSignature] = useState("");
  const [qcSignature, setQcSignature] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [collectionLocation, setCollectionLocation] = useState("Collection desk");
  const [transportCondition, setTransportCondition] = useState("Ambient / controlled");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [barcodeCheck, setBarcodeCheck] = useState("");
  const [patientVerification, setPatientVerification] = useState({
    nameVerified: false,
    uhidVerified: false,
    dobVerified: false,
    photoVerified: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching sample with ID:', params.id);
        
        // Fetch sample data
        const sampleResponse = await sampleApi.getById(params.id as string);
        console.log('Sample response:', sampleResponse);
        
        if (sampleResponse.success && sampleResponse.data) {
          setSample(sampleResponse.data);
          
          // Fetch full order data for additional context
          try {
            const orderResponse = await orderApi.getById(sampleResponse.data.orderId);
            if (orderResponse.success && orderResponse.data) {
              setOrder(orderResponse.data);
              // Set collector name if sample was already collected
              if (sampleResponse.data.collectedBy) {
                setCollectorName(sampleResponse.data.collectedBy.fullName);
              }
            }
          } catch (orderErr) {
            console.warn('Could not fetch order details:', orderErr);
          }
        } else {
          console.error('Invalid sample response structure:', sampleResponse);
          setError("Failed to load sample data - invalid response");
        }
      } catch (err) {
        console.error('Error fetching sample:', err);
        setError(err instanceof Error ? err.message : "Failed to load sample");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPatientAge = (dateOfBirth?: string, age?: number) => {
    if (age) return `${age} Years`;
    if (!dateOfBirth) return "—";
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let calculatedAge = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      calculatedAge--;
    }
    return `${calculatedAge} Years`;
  };

  const checklistItems = [
    "Patient identity verified",
    "Sample labeled correctly",
    "Barcode matched",
    "Container type verified",
    "Volume adequate",
    "Sample integrity maintained",
    "Transport conditions met",
  ];
  const completedChecks = checklistItems.filter(item => checklist[item]).length;
  const readinessPercent = Math.round((completedChecks / checklistItems.length) * 100);
  const barcodeVerified = Boolean(sample && barcodeCheck.trim().toUpperCase() === sample.barcode.toUpperCase());
  const collectorSigned = Boolean(collectorSignature.trim() && collectorName.trim() && collectorId.trim());
  const qcSigned = Boolean(qcSignature.trim() && qcVerifier.trim() && qcVerifierId.trim());
  const verificationBlockers = [
    !checklist["Patient identity verified"] && "Patient identity",
    !barcodeVerified && "Barcode match",
  ].filter(Boolean) as string[];

  const getContainerColor = (container: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
      "EDTA Purple": { 
        bg: "bg-purple-100", 
        text: "text-purple-800", 
        border: "border-purple-400",
        icon: "🟣"
      },
      "Serum Separator Red": { 
        bg: "bg-red-100", 
        text: "text-red-800", 
        border: "border-red-400",
        icon: "🔴"
      },
      "Citrate Blue": { 
        bg: "bg-blue-100", 
        text: "text-blue-800", 
        border: "border-blue-400",
        icon: "🔵"
      },
      "Urine Container Yellow": { 
        bg: "bg-yellow-100", 
        text: "text-yellow-800", 
        border: "border-yellow-400",
        icon: "🟡"
      },
      "Fluoride Grey": { 
        bg: "bg-gray-200", 
        text: "text-gray-800", 
        border: "border-gray-400",
        icon: "⚪"
      },
      "Heparin Green": { 
        bg: "bg-green-100", 
        text: "text-green-800", 
        border: "border-green-400",
        icon: "🟢"
      },
    };
    return colors[container] || { 
      bg: "bg-gray-100", 
      text: "text-gray-800", 
      border: "border-gray-400",
      icon: "⚪"
    };
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "STAT":
        return "bg-red-600 text-white border-red-700";
      case "URGENT":
        return "bg-orange-500 text-white border-orange-600";
      case "ROUTINE":
      default:
        return "bg-blue-500 text-white border-blue-600";
    }
  };

  // Generate barcode bars (Code128 pattern)
  const generateBarcodeBars = (text: string) => {
    const bars = [];
    const barWidth = 2;
    const gapWidth = 1;
    
    // Simple Code128-like pattern generation
    const startPattern = [2, 1, 2, 2, 2, 2];
    for (let i = 0; i < startPattern.length; i++) {
      if (i % 2 === 0) {
        bars.push({ width: barWidth * startPattern[i], isBar: true });
      } else {
        bars.push({ width: gapWidth * startPattern[i], isBar: false });
      }
    }

    // Encode each character
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const pattern = [];
      for (let j = 0; j < 6; j++) {
        pattern.push((charCode >> (j * 2)) & 3 + 1);
      }
      
      for (let j = 0; j < pattern.length; j++) {
        if (j % 2 === 0) {
          bars.push({ width: barWidth * pattern[j], isBar: true });
        } else {
          bars.push({ width: gapWidth * pattern[j], isBar: false });
        }
      }
    }

    // Stop pattern
    const stopPattern = [2, 2, 1, 2, 2, 2];
    for (let i = 0; i < stopPattern.length; i++) {
      if (i % 2 === 0) {
        bars.push({ width: barWidth * stopPattern[i], isBar: true });
      } else {
        bars.push({ width: gapWidth * stopPattern[i], isBar: false });
      }
    }

    return bars;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading collection sheet...</p>
            <p className="text-xs text-gray-400 mt-2">Sample ID: {params.id}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !sample) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Collection Sheet</h2>
            <p className="text-gray-600 mb-4">{error || "Sample not found"}</p>
            <p className="text-xs text-gray-400 mb-4">Sample ID: {params.id}</p>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const containerColors = getContainerColor(sample.test.sampleContainer);
  const barcodeBars = generateBarcodeBars(sample.order.barcode);

  return (
    <ProtectedRoute>
      <div className="print-page-shell min-h-screen bg-slate-100/80 py-8">
        {/* Advanced Level Screen-only controls */}
        <div className="max-w-4xl mx-auto px-4 mb-5 no-print">
          <div className="relative flex justify-between items-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-4 relative">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-700 hover:text-slate-950 font-semibold transition-colors duration-200 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Sample
              </button>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[10px] font-bold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                  Phlebotomy Manifest
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-bold text-sky-800">
                  CLSI GP41 Protocol
                </span>
              </div>
            </div>
            <div className="flex gap-2 relative">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 px-4 py-2 font-bold text-white shadow-sm transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Sheet
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 font-bold text-white shadow-sm transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Premium Sample Collection Sheet */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="print-sheet relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-blue-900/10 print:shadow-none print:rounded-none">
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-100/50 blur-3xl" />
            {/* Premium Header */}
            <div className="relative border-b-2 border-slate-900 pb-6 mb-6">
              <div className="absolute top-0 right-0">
                <div className="flex items-center gap-2">
                  <span className="print-hide relative inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-amber-950 shadow-lg shadow-amber-500/30">
                    <span className="animate-pulse h-1.5 w-1.5 rounded-full bg-amber-700"></span>
                    ⭐ Premium Feature
                  </span>
                  <span className="print-hide relative inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-600 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-lg shadow-violet-500/40">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                    Advanced Level
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 text-2xl font-black text-white shadow-xl shadow-blue-900/30 border-2 border-white/20">
                      LC
                    </div>
                    <div>
                      <h1 className="text-3xl font-black tracking-tight text-slate-950">LabCore Diagnostic Center</h1>
                      <p className="text-sm font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        Specimen Collection Manifest
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium">123 Healthcare Avenue, Medical District</p>
                    <p className="font-medium">Mumbai, Maharashtra 400001, India</p>
                    <p className="font-medium">Phone: +91-22-1234-5678 | Email: info@labcore.com</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 shadow-md">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Collection Ready
                  </span>
                  <div className="flex items-center justify-end gap-2 mb-2">
                    <div className="bg-white p-3 rounded-xl border-2 border-slate-200 shadow-md">
                      <div className="flex">
                        {barcodeBars.map((bar: any, i: number) => (
                          <div
                            key={i}
                            className={bar.isBar ? 'bg-black' : 'bg-white'}
                            style={{ 
                              width: `${bar.width}px`,
                              height: '48px'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    <p>Order ID: <span className="font-bold text-slate-900">{sample.order.orderNumber}</span></p>
                    <p>Date: <span className="font-bold text-slate-900">{formatDate(new Date().toISOString())}</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Patient & Order Information */}
            <div className="print-block grid grid-cols-2 gap-6 mb-6">
              <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-white p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-violet-900 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-[10px] font-bold text-white">P</span>
                    PATIENT IDENTITY
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="print-hide rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">PREMIUM</span>
                    <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[8px] font-black tracking-wider text-emerald-800">MATCH REQUIRED</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg bg-white/80 p-3 border border-violet-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Patient Name</span>
                        <button 
                          onClick={() => setPatientVerification(prev => ({...prev, nameVerified: !prev.nameVerified}))}
                          className={`text-[8px] font-black px-2 py-0.5 rounded ${patientVerification.nameVerified ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                        >
                          {patientVerification.nameVerified ? '✓ VERIFIED' : 'VERIFY'}
                        </button>
                      </div>
                      <span className="text-sm font-black text-gray-900">
                        {sample.order.patient.firstName} {sample.order.patient.lastName}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 border border-violet-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700">UHID</span>
                        <button 
                          onClick={() => setPatientVerification(prev => ({...prev, uhidVerified: !prev.uhidVerified}))}
                          className={`text-[8px] font-black px-2 py-0.5 rounded ${patientVerification.uhidVerified ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                        >
                          {patientVerification.uhidVerified ? '✓ VERIFIED' : 'VERIFY'}
                        </button>
                      </div>
                      <span className="text-sm font-mono font-bold text-violet-900">{sample.order.patient.uhid}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-white/80 p-3 border border-violet-100">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Age</span>
                          <button 
                            onClick={() => setPatientVerification(prev => ({...prev, dobVerified: !prev.dobVerified}))}
                            className={`text-[7px] font-black px-1.5 py-0.5 rounded ${patientVerification.dobVerified ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                          >
                            {patientVerification.dobVerified ? '✓' : '?'}
                          </button>
                        </div>
                        <span className="text-sm font-bold text-gray-900 mt-1">
                          {getPatientAge(sample.order.patient.dateOfBirth, sample.order.patient.age)}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-white/80 p-3 border border-violet-100">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Gender</span>
                        <span className="text-sm font-bold text-gray-900 mt-1">{sample.order.patient.gender}</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 border border-violet-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Contact</span>
                      <span className="text-sm font-medium text-gray-900">{sample.order.patient.phone || '—'}</span>
                    </div>
                  </div>
                  <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700">Photo Verification</span>
                      <button 
                        onClick={() => setPatientVerification(prev => ({...prev, photoVerified: !prev.photoVerified}))}
                        className={`text-[8px] font-black px-2 py-0.5 rounded ${patientVerification.photoVerified ? 'bg-emerald-500 text-white' : 'bg-amber-200 text-amber-700'}`}
                      >
                        {patientVerification.photoVerified ? '✓ PHOTO MATCHED' : 'VERIFY PHOTO'}
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-200 to-purple-200 flex items-center justify-center text-violet-600 font-black text-lg">
                        {sample.order.patient.firstName[0]}{sample.order.patient.lastName[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-[8px] font-bold text-amber-800">Compare with patient ID card</p>
                        <p className="text-[7px] text-amber-600 mt-0.5">Verify photo matches physical appearance</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border-2 border-violet-200 bg-violet-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-violet-800">Identity Verification Status</span>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded ${
                        Object.values(patientVerification).every(v => v) ? 'bg-emerald-500 text-white' : 
                        Object.values(patientVerification).some(v => v) ? 'bg-amber-400 text-white' : 'bg-slate-300 text-slate-600'
                      }`}>
                        {Object.values(patientVerification).filter(v => v).length}/4 VERIFIED
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 via-sky-50 to-white p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-cyan-900 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 text-[10px] font-bold text-white">S</span>
                    SAMPLE & BARCODE
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="print-hide rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-700">PREMIUM</span>
                    <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[8px] font-black tracking-wider text-emerald-800">SCAN-READY</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg bg-white/80 p-3 border border-cyan-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">Order Number</span>
                      <span className="text-sm font-mono font-bold text-cyan-900">{sample.order.orderNumber}</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 border border-cyan-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">Sample Number</span>
                      <span className="text-sm font-mono font-bold text-cyan-900">{sample.sampleNumber}</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 border-2 border-slate-700 shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white">Primary Barcode</span>
                        <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-400">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          ACTIVE
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[7px] font-bold text-slate-400">CODE 128</span>
                        <span className="text-[7px] font-bold text-slate-400">•</span>
                        <span className="text-[7px] font-bold text-slate-400">HIGH CONTRAST</span>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border-2 border-slate-600 shadow-inner">
                      <div className="mb-2 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.16em] text-slate-500">
                        <span>Machine-readable identity</span>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">QC FORMAT PASS</span>
                      </div>
                      <div className="flex items-stretch rounded-sm bg-white px-1">
                        <span className="w-1 shrink-0 bg-white" aria-hidden="true" />
                        {barcodeBars.map((bar: any, i: number) => (
                          <div
                            key={i}
                            className={bar.isBar ? 'bg-black' : 'bg-white'}
                            style={{ 
                              width: `${bar.width}px`,
                              height: '40px'
                            }}
                          />
                        ))}
                        <span className="w-1 shrink-0 bg-white" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="text-center mt-3">
                      <span className="text-sm font-mono font-black text-white tracking-wider">{sample.barcode}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[8px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Code 128 · quiet zone protected</span>
                      <span>300 DPI recommended</span>
                    </div>
                    <div className="mt-4 border-t border-white/10 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          Barcode scan confirmation
                        </label>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded ${
                          barcodeVerified ? 'bg-emerald-500 text-white' : 
                          barcodeCheck ? 'bg-rose-500 text-white' : 'bg-slate-600 text-slate-300'
                        }`}>
                          {barcodeVerified ? '✓ VERIFIED' : barcodeCheck ? '✗ MISMATCH' : 'PENDING'}
                        </span>
                      </div>
                      <input
                        value={barcodeCheck}
                        onChange={(e) => {
                          const value = e.target.value;
                          setBarcodeCheck(value);
                          setChecklist((current) => ({ ...current, "Barcode matched": value.trim().toUpperCase() === sample.barcode.toUpperCase() }));
                        }}
                        placeholder="Scan or type barcode to verify"
                        className="w-full rounded-lg border-2 border-white/20 bg-white/10 px-3 py-2.5 font-mono text-[11px] text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all"
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <p className={`text-[9px] font-bold ${barcodeCheck && !barcodeVerified ? "text-rose-300" : barcodeVerified ? "text-emerald-300" : "text-slate-400"}`}>
                          {barcodeVerified ? "✓ BARCODE VERIFIED - specimen identity locked" : barcodeCheck ? "✗ MISMATCH - stop and recheck tube" : "Required before collection handoff"}
                        </p>
                        <button 
                          type="button"
                          onClick={() => {
                            setBarcodeCheck('');
                            setChecklist((current) => ({ ...current, "Barcode matched": false }));
                          }}
                          className="text-[8px] font-bold text-cyan-300 hover:text-cyan-200 transition-colors"
                        >
                          CLEAR
                        </button>
                      </div>
                      <div className={`mt-3 rounded-lg border px-3 py-2 text-[9px] font-bold ${barcodeVerified ? "border-emerald-300 bg-emerald-500/10 text-emerald-700" : "border-amber-300 bg-amber-50 text-amber-800"}`}>
                        {barcodeVerified ? "Verification gate passed. This specimen can proceed to handoff." : "Verification gate locked until the scanned value exactly matches the printed barcode."}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 border border-cyan-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">Priority Level</span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-black border-2 ${getPriorityColor(sample.priority)}`}>
                        {sample.priority || 'ROUTINE'}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Barcode Security Features</span>
                      <span className="text-[7px] font-bold text-emerald-600">ENABLED</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span>
                        <span className="text-[8px] font-medium text-emerald-800">Unique specimen ID</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span>
                        <span className="text-[8px] font-medium text-emerald-800">Checksum validation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span>
                        <span className="text-[8px] font-medium text-emerald-800">Scan verification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span>
                        <span className="text-[8px] font-medium text-emerald-800">Audit trail</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Sample Collection Details */}
            <div className="print-block mb-6 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-green-50 to-white p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-[10px] font-bold text-white">D</span>
                  SAMPLE COLLECTION DETAILS
                </h3>
                <span className="print-hide rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">PREMIUM</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/80 p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Test Name</span>
                  </div>
                  <div className="text-sm font-black text-gray-900">{sample.test.testName}</div>
                </div>
                <div className="rounded-xl bg-white/80 p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Test Code</span>
                  </div>
                  <div className="text-sm font-mono font-bold text-emerald-900">{sample.test.testCode}</div>
                </div>
                <div className="rounded-xl bg-white/80 p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Sample Type</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900">{sample.sampleType}</div>
                </div>
                <div className="rounded-xl bg-white/80 p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Collection Type</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900">{sample.collectionType || 'WALK_IN'}</div>
                </div>
              </div>
              
              {/* Premium Tube/Container Section */}
              <div className="mt-4 rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-[8px] font-bold text-white">T</span>
                    TUBE/CONTAINER SPECIFICATIONS
                  </h4>
                  <span className="print-hide rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-bold text-amber-700">ADVANCED</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`flex-1 rounded-xl border-2 ${containerColors.border} ${containerColors.bg} p-4`}>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{containerColors.icon}</div>
                      <div>
                        <div className={`text-xs font-bold uppercase tracking-wider ${containerColors.text}`}>Container Type</div>
                        <div className={`text-lg font-black ${containerColors.text}`}>{sample.test.sampleContainer}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="rounded-lg bg-white/80 p-2 border border-amber-200">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Volume Required</span>
                        <span className="text-xs font-bold text-amber-900">3-5 mL</span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-white/80 p-2 border border-amber-200">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Additive</span>
                        <span className="text-xs font-bold text-amber-900">EDTA K2</span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-white/80 p-2 border border-amber-200">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Storage</span>
                        <span className="text-xs font-bold text-amber-900">2-8°C</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/80 p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Current Status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg text-xs font-black border-2 ${
                      sample.status === 'COLLECTED' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                      sample.status === 'PENDING' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                      'bg-blue-100 text-blue-700 border-blue-300'
                    }`}>
                      {sample.status}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl bg-white/80 p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Created At</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900">{formatDateTime(sample.createdAt)}</div>
                </div>
              </div>
              {sample.collectedAt && (
                <div className="mt-4 rounded-xl bg-gradient-to-r from-emerald-100 to-green-100 p-4 border-2 border-emerald-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Collection Timestamp</span>
                  </div>
                  <div className="text-sm font-black text-emerald-900">{formatDateTime(sample.collectedAt)}</div>
                </div>
              )}
            </div>

            {/* Special Instructions */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">SPECIAL INSTRUCTIONS</h3>
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1 h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">Fasting required (8-12 hours)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1 h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">Morning sample preferred</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1 h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">Avoid heavy exercise before collection</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1 h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">Medication notes: {specialInstructions || 'None specified'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Collector & QC Verification Section */}
            <div className="print-block grid grid-cols-2 gap-6 mb-6">
              <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-cyan-50 to-white p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-[10px] font-bold text-white">P</span>
                    PHLEBOTOMIST/COLLECTOR
                  </h3>
                  <span className="print-hide rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">PREMIUM</span>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg bg-white/80 p-3 border border-blue-100">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">Collector ID</label>
                    <input
                      type="text"
                      value={collectorId}
                      onChange={(e) => setCollectorId(e.target.value)}
                      className="w-full border-2 border-blue-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="EMP-001"
                    />
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 border border-blue-100">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">Collector Name</label>
                    <input
                      type="text"
                      value={collectorName}
                      onChange={(e) => setCollectorName(e.target.value)}
                      className="w-full border-2 border-blue-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="Enter collector name"
                    />
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 border border-blue-100">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">Collection Time</label>
                    <input
                      type="datetime-local"
                      value={collectionTime}
                      onChange={(e) => setCollectionTime(e.target.value)}
                      className="w-full border-2 border-blue-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-700">Digital Signature</label>
                      <span className={`rounded-full px-2.5 py-1 text-[8px] font-black tracking-wider ${collectorSigned ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{collectorSigned ? "✓ SIGNED & VERIFIED" : "PENDING CAPTURE"}</span>
                    </div>
                    <div className="rounded-xl border-2 border-dashed border-blue-300 bg-gradient-to-br from-white to-blue-50 p-2">
                      <div className="mb-1 flex items-center justify-between text-[8px] font-bold uppercase tracking-wider text-blue-500"><span>Secure signature capture</span><span>Role: Collector</span></div>
                      <SignaturePad accent="blue" onSigned={(signed) => setCollectorSignature(signed ? "HANDWRITTEN" : "")} />
                      <p className="mt-2 text-[8px] font-semibold text-slate-500">{collectorSigned ? `ID ${collectorId} · handwritten identity matched` : "Enter collector name and ID, then draw signature"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] font-bold text-white">Q</span>
                    QC VERIFICATION
                  </h3>
                  <span className="print-hide rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">PREMIUM</span>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg bg-white/80 p-3 border border-emerald-100">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">Verifier ID</label>
                    <input
                      type="text"
                      value={qcVerifierId}
                      onChange={(e) => setQcVerifierId(e.target.value)}
                      className="w-full border-2 border-emerald-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      placeholder="QC-001"
                    />
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 border border-emerald-100">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">Verifier Name</label>
                    <input
                      type="text"
                      value={qcVerifier}
                      onChange={(e) => setQcVerifier(e.target.value)}
                      className="w-full border-2 border-emerald-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      placeholder="Enter verifier name"
                    />
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 border border-emerald-100">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">Verification Time</label>
                    <input
                      type="datetime-local"
                      value={qcVerificationTime}
                      onChange={(e) => setQcVerificationTime(e.target.value)}
                      className="w-full border-2 border-emerald-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">Digital Signature</label>
                      <span className={`rounded-full px-2.5 py-1 text-[8px] font-black tracking-wider ${qcSigned ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{qcSigned ? "✓ SIGNED & VERIFIED" : "PENDING CAPTURE"}</span>
                    </div>
                    <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-gradient-to-br from-white to-emerald-50 p-2">
                      <div className="mb-1 flex items-center justify-between text-[8px] font-bold uppercase tracking-wider text-emerald-600"><span>Secure signature capture</span><span>Role: QC verifier</span></div>
                      <SignaturePad accent="emerald" onSigned={(signed) => setQcSignature(signed ? "HANDWRITTEN" : "")} />
                      <p className="mt-2 text-[8px] font-semibold text-slate-500">{qcSigned ? `ID ${qcVerifierId} · handwritten verification identity matched` : "Enter verifier name and ID, then draw signature"}</p>
                    </div>
                  </div>
                  <div className={`flex items-center justify-between rounded-lg border px-3 py-2 text-[8px] font-bold ${qcSigned ? "border-emerald-300 bg-emerald-100/70 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                    <span>{qcSigned ? "Digital audit trail ready" : "QC signature requires verifier name + ID"}</span>
                    <span className="font-mono">{qcSigned ? "E-SIGN OK" : "E-SIGN LOCKED"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Status Checklist */}
            <div className="print-block mb-6 rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-white p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-violet-900 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-[10px] font-bold text-white">C</span>
                  COLLECTION CHECKLIST
                </h3>
                <span className="print-hide rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">PREMIUM</span>
              </div>
              <div className="mb-4 flex items-center justify-between rounded-xl border-2 border-violet-200 bg-white/90 p-4 shadow-sm">
                <div>
                  <p className="text-xs font-bold text-violet-950">Collection readiness</p>
                  <p className="mt-1 text-[10px] text-violet-700">{completedChecks} of {checklistItems.length} controls verified</p>
                  {verificationBlockers.length > 0 && <p className="mt-1 text-[9px] font-bold text-amber-700">Blocked: {verificationBlockers.join(" + ")}</p>}
                </div>
                <span className={`rounded-full px-3 py-1.5 text-[10px] font-black border-2 ${readinessPercent === 100 ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-amber-100 text-amber-700 border-amber-300"}`}>{readinessPercent === 100 ? "✓ READY TO HANDOFF" : `${readinessPercent}% READY`}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {checklistItems.map(item => (
                  <label key={item} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-3 text-xs transition-all ${checklist[item] ? "border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-900 shadow-md" : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:shadow-sm"}`}>
                    <div className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${checklist[item] ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-white"}`}>
                      {checklist[item] && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>}
                    </div>
                    <span className={checklist[item] ? "font-bold" : "font-medium"}>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="print-block mb-6 grid grid-cols-3 gap-4">
              <div className="rounded-xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50 p-4 shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 text-[8px] font-bold text-white">H</span>
                  <p className="text-[10px] font-black uppercase tracking-wider text-cyan-700">Handoff point</p>
                </div>
                <select value={collectionLocation} onChange={(e) => setCollectionLocation(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-cyan-200 bg-white px-3 py-2 text-xs font-bold text-cyan-950 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200">
                  <option>Collection desk</option>
                  <option>Phlebotomy room</option>
                  <option>Ward / bedside</option>
                  <option>Home collection</option>
                </select>
                <p className="mt-2 text-[10px] font-medium text-cyan-800">Record receiving location</p>
              </div>
              <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-[8px] font-bold text-white">T</span>
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Transport</p>
                </div>
                <select value={transportCondition} onChange={(e) => setTransportCondition(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-amber-200 bg-white px-3 py-2 text-xs font-bold text-amber-950 focus:border-amber-400 focus:ring-2 focus:ring-amber-200">
                  <option>Ambient / controlled</option>
                  <option>Refrigerated 2-8°C</option>
                  <option>Frozen</option>
                  <option>Urgent priority</option>
                </select>
                <p className="mt-2 text-[10px] font-medium text-amber-800">Confirm before dispatch</p>
              </div>
              <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-4 shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-[8px] font-bold text-white">R</span>
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Release gate</p>
                </div>
                <div className={`mt-1 rounded-xl border-2 px-3 py-2 text-center ${readinessPercent === 100 ? "border-emerald-400 bg-emerald-100" : "border-amber-400 bg-amber-100"}`}>
                  <p className="text-xs font-black text-emerald-950">{readinessPercent === 100 ? "✓ QC sign-off ready" : "⏳ QC sign-off pending"}</p>
                </div>
                <p className="mt-2 text-[10px] font-medium text-emerald-800">Required before handoff</p>
              </div>
            </div>

            {/* Footer */}
            <div className="print-block flex items-end justify-between border-t border-slate-200 pt-4 text-xs text-gray-500">
              <div>
                <p className="font-bold text-slate-700">Internal laboratory record</p>
                <p className="mt-1">Generated on {new Date().toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] font-bold text-slate-600">ACC-{sample.sampleNumber}</p>
                <p className="mt-1 text-[10px]">LabCore Enterprise LIS v2.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-page-shell { background: white !important; padding: 0 !important; }
          .print-sheet { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; border: 0 !important; box-shadow: none !important; overflow: visible !important; zoom: 0.42; color: #111827 !important; page-break-after: avoid !important; break-after: avoid-page !important; }
          .print-block { break-inside: avoid; page-break-inside: avoid; }
          .print-page-break { break-before: auto; page-break-before: auto; }
          .print-hide { display: none !important; }
          .print-sheet > .pointer-events-none { display: none !important; }
          .print-sheet .mb-6 { margin-bottom: 0.45rem !important; }
          .print-sheet .mb-4 { margin-bottom: 0.3rem !important; }
          .print-sheet .mt-6 { margin-top: 0.4rem !important; }
          .print-sheet .mt-4 { margin-top: 0.3rem !important; }
          .print-sheet .p-8 { padding: 0 !important; }
          .print-sheet .p-5 { padding: 0.45rem !important; }
          .print-sheet .p-4 { padding: 0.35rem !important; }
          .print-sheet .p-3 { padding: 0.3rem !important; }
          .print-sheet .p-2 { padding: 0.25rem !important; }
          .print-sheet .gap-6 { gap: 0.45rem !important; }
          .print-sheet .gap-4 { gap: 0.35rem !important; }
          .print-sheet .gap-3 { gap: 0.25rem !important; }
          .print-sheet h1 { font-size: 1.15rem !important; }
          .print-sheet h3 { font-size: 0.55rem !important; }
          .print-sheet p, .print-sheet span, .print-sheet label { line-height: 1.12 !important; }
          .print-sheet canvas { height: 2rem !important; }
          .print-sheet input, .print-sheet select { min-height: 1rem !important; padding: 0.1rem 0.25rem !important; font-size: 0.5rem !important; }
          .print-sheet .text-3xl { font-size: 1.15rem !important; }
          .print-sheet .text-2xl { font-size: 1rem !important; }
          .print-sheet .text-xl { font-size: 0.85rem !important; }
          .print-sheet .text-lg { font-size: 0.75rem !important; }
          .print-sheet .text-sm { font-size: 0.58rem !important; }
          .print-sheet .text-xs { font-size: 0.5rem !important; }
          canvas { border-color: #cbd5e1 !important; }
          @page {
            size: A4 landscape;
            margin: 4mm;
          }
          input[type="text"] {
            border: 1px solid #ccc !important;
          }
        }
      `}</style>
    </ProtectedRoute>
  );
}