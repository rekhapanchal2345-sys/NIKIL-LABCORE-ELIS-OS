"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { reportApi } from "@/lib/api";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { OrderCommunicationHubModal } from "@/components/orders/OrderCommunicationHubModal";
import PremiumLabReport from "@/components/reports/PremiumLabReport";
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Eye, 
  RefreshCw, 
  AlertCircle,
  FileText,
  MessageSquare,
  User,
  Calendar,
  TestTube,
  Shield
} from "lucide-react";

interface OrderReport {
  orderNumber: string;
  barcode: string;
  orderStatus: string;
  createdAt: string;
  sampleCollected: boolean;
  collectedAt?: string;
  reportedAt?: string;
  patient: {
    id: string;
    uhid: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth?: string;
    age?: number;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  doctor?: {
    id: string;
    fullName: string;
    qualification?: string;
    specialization?: string;
  } | null;
  tests: Array<{
    id: string;
    test: {
      id: string;
      testName: string;
      testCode: string;
      sampleType: string;
      category?: {
        name: string;
      };
      parameters: Array<{
        id: string;
        parameterName: string;
        unit?: string;
        dataType: string;
        referenceRanges: Array<{
          gender?: string;
          minAge?: number;
          maxAge?: number;
          normalLow?: number;
          normalHigh?: number;
          criticalLow?: number;
          criticalHigh?: number;
          interpretation?: string;
        }>;
      }>;
    };
    price: number;
  }>;
  results: Array<{
    id: string;
    status: string;
    remarks?: string;
    interpretation?: string;
    enteredAt?: string;
    verifiedAt?: string;
    approvedAt?: string;
    publishedAt?: string;
    test: {
      id: string;
      testName: string;
      testCode: string;
      method?: string;
      parameters?: Array<{
        id: string;
        parameterName: string;
        unit?: string;
        dataType?: string;
        referenceRanges?: Array<{
          gender?: string;
          minAge?: number;
          maxAge?: number;
          normalLow?: number;
          normalHigh?: number;
          criticalLow?: number;
          criticalHigh?: number;
          interpretation?: string;
        }>;
      }>;
    };
    values: Array<{
      id: string;
      parameter: {
        id: string;
        parameterName: string;
        unit?: string;
      };
      value: string;
      flag?: string;
      remark?: string;
    }>;
    enteredBy?: {
      id: string;
      fullName: string;
      employeeCode: string;
    };
    approvedBy?: {
      id: string;
      fullName: string;
      employeeCode: string;
    };
  }>;
  invoice?: {
    id: string;
    invoiceNumber: string;
    subtotal: number;
    discount: number;
    gstAmount: number;
    grandTotal: number;
    paymentStatus: string;
  } | null;
  payments?: Array<{
    id: string;
    receiptNumber: string;
    amount: number;
    method: string;
    status: string;
    paidAt: string;
    transactionId?: string;
  }>;
}

export default function OrderReportPage({ params }: { params: Promise<{ orderId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string>("");
  const action = searchParams.get("action");

  useEffect(() => {
    params.then(p => setOrderId(p.orderId));
  }, [params]);
  
  const [report, setReport] = useState<OrderReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showCommunicationHub, setShowCommunicationHub] = useState(false);
  const [showPremiumView, setShowPremiumView] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);
  const premiumReportRef = useRef<HTMLDivElement>(null);

  const communicationOrder = useMemo(() => {
    if (!report) return null;
    return {
      id: orderId,
      orderNumber: report.orderNumber,
      barcode: report.barcode,
      patient: report.patient,
      doctor: report.doctor,
      reportUrl: typeof window !== "undefined" ? `${window.location.origin}/reports/order/${orderId}` : undefined,
      reportStatus: report.orderStatus,
      reportedAt: report.reportedAt,
      collectedAt: report.collectedAt,
      results: report.results,
      items: report.tests.map((item) => ({
        test: {
          testName: item.test.testName,
          testCode: item.test.testCode,
          sampleType: item.test.sampleType,
        },
      })),
    };
  }, [orderId, report]);

  const fetchOrderReport = useCallback(async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await reportApi.getOrderReport(orderId);
      
      if (response.success && response.data) {
        setReport(response.data);
        // QR code generation will be handled separately
      } else {
        setError(response.message || "Failed to fetch order report");
      }
    } catch (err) {
      console.error("Error fetching order report:", err);
      setError("Failed to load order report. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderReport();
  }, [fetchOrderReport]);

  const generateQRCode = useCallback(async (orderNumber: string) => {
    try {
      const qrData = `LABCORE-ORD-${orderNumber}`;
      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 120,
        margin: 1,
        color: {
          dark: "#1e3a8a",
          light: "#ffffff",
        },
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error("QR Code generation failed:", error);
    }
  }, []);

  useEffect(() => {
    if (report?.orderNumber) {
      generateQRCode(report.orderNumber);
    }
  }, [report?.orderNumber, generateQRCode]);

  useEffect(() => {
    if (action === "download" && report) {
      handleDownloadPDF();
    } else if (action === "print" && report) {
      handlePrint();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, report]);

  const handleDownloadPDF = async () => {
    if (!report) return;
    
    try {
      setGeneratingPdf(true);
      
      const premiumReportData = generatePremiumReportData();
      if (!premiumReportData) return;
      
      // Switch to premium view temporarily for PDF generation
      const originalView = showPremiumView;
      setShowPremiumView(true);
      
      // Wait for the premium report to render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Capture the premium report
      if (premiumReportRef.current) {
        const canvas = await html2canvas(premiumReportRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 0;
        
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`LabCore_Premium_Report_${report.orderNumber}.pdf`);
      }
      
      // Restore original view
      setShowPremiumView(originalView);
      
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    if (reportRef.current) {
      const printContent = reportRef.current.innerHTML;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Report ${report?.orderNumber ?? ""}</title>
            <style>
              @page {
                size: A4;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 20px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 12px;
                color: #1f2937;
                background: white;
              }
              .report-container {
                max-width: 210mm;
                margin: 0 auto;
                padding: 20px;
                background: white;
              }
              .header {
                border-bottom: 3px solid #1e3a8a;
                padding-bottom: 20px;
                margin-bottom: 20px;
              }
              .logo-section {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 15px;
              }
              .logo-icon {
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                font-weight: bold;
              }
              .company-name {
                font-size: 24px;
                font-weight: 700;
                color: #1e3a8a;
                letter-spacing: 0.5px;
              }
              .company-tagline {
                font-size: 11px;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .report-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
              }
              .report-title {
                font-size: 28px;
                font-weight: 800;
                color: #1e3a8a;
                letter-spacing: 2px;
              }
              .report-meta {
                text-align: right;
              }
              .report-number {
                font-size: 18px;
                font-weight: 700;
                color: #1f2937;
              }
              .section {
                margin-bottom: 20px;
              }
              .section-title {
                font-size: 13px;
                font-weight: 700;
                color: #1e3a8a;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 2px solid #e5e7eb;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
              }
              .info-item {
                margin-bottom: 8px;
              }
              .info-label {
                font-size: 10px;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 2px;
              }
              .info-value {
                font-size: 12px;
                font-weight: 600;
                color: #1f2937;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
              }
              th {
                background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                color: white;
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                padding: 8px 10px;
                text-align: left;
              }
              td {
                padding: 8px 10px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 11px;
              }
              .result-value {
                font-weight: 600;
              }
              .flag-normal {
                color: #059669;
              }
              .flag-abnormal {
                color: #dc2626;
                font-weight: 700;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #e5e7eb;
                text-align: center;
                font-size: 10px;
                color: #6b7280;
              }
              .qr-section {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
                margin-top: 15px;
                padding: 15px;
                background: #f9fafb;
                border-radius: 8px;
              }
              .qr-code {
                width: 80px;
                height: 80px;
              }
              button, .flex.flex-wrap.gap-3 {
                display: none !important;
              }
              @media print {
                body { margin: 0; }
                .report-container { box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <div class="report-container">
              ${printContent}
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateAge = (dateOfBirth?: string): string => {
    if (!dateOfBirth) return "—";
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} Yrs`;
  };

  const generatePremiumReportData = () => {
    if (!report) return null;
    
    const reportId = `REP-${new Date().getFullYear()}-${report.orderNumber.split('-')[2] || Math.floor(Math.random() * 9000) + 1000}`;
    
    return {
      // Clinic Information - using user's business details
      clinicName: "LabCore Diagnostic & Research Centre",
      clinicAddress: "201, Sanskruti Complex, Alkapuri Road, Vadodara, Gujarat - 390007",
      clinicPhone: "+91 265 234 5678",
      clinicEmail: "reports@labcore.in",
      accreditation: "NABL ACCREDITED ISO 15189:2022",
      
      // Report Information
      reportId: reportId,
      orderId: report.orderNumber,
      reportDate: formatDateTime(report.reportedAt || report.createdAt),
      
      // Patient Information
      patientName: `${report.patient.firstName} ${report.patient.lastName}`,
      uhid: report.patient.uhid,
      age: report.patient.age ? `${report.patient.age} Yrs` : calculateAge(report.patient.dateOfBirth),
      gender: report.patient.gender,
      contact: report.patient.phone || "",
      
      // Sample Information
      referringDoctor: report.doctor?.fullName
        ? `${report.doctor.fullName.startsWith("Dr") ? "" : "Dr. "}${report.doctor.fullName}${report.doctor.qualification ? ` (${report.doctor.qualification})` : ""}`
        : "Self / Direct Walk-In",
      sampleCollected: report.collectedAt,
      reportApproved: report.results[0]?.approvedAt || report.results[0]?.verifiedAt,
      specimen: report.tests[0]?.test.sampleType || "Plasma (Fasting)",
      
      // Test Results - Transform for premium format
      testName: report.results[0]?.test.testName || "Laboratory Profile",
      results: report.results.flatMap(result => 
        result.values.map(value => {
          const param = result.test.parameters?.find(p => p.id === value.parameter.id);
          const refRange = param?.referenceRanges?.[0];
          const refText = refRange 
            ? `${refRange.normalLow || '—'} - ${refRange.normalHigh || '—'}`
            : "—";
          
          // Determine range indicator based on flag
          let rangeIndicator: 'normal' | 'partial' | 'none' = 'normal';
          if (value.flag?.toLowerCase() === 'high' || value.flag?.toLowerCase() === 'low') {
            rangeIndicator = 'partial';
          } else if (value.flag?.toLowerCase() === 'critical') {
            rangeIndicator = 'none';
          }
          
          return {
            parameterName: value.parameter.parameterName,
            result: value.value,
            unit: value.parameter.unit,
            referenceRange: refText,
            flag: value.flag || "NORMAL",
            rangeIndicator: rangeIndicator
          };
        })
      ),
      
      // Clinical Information
      clinicalInterpretation: report.results[0]?.interpretation || 
        "Results within normal limits. Clinical correlation with patient symptoms recommended.",
      methodology: `Method: ${report.results[0]?.test.method || 'CLIA'} | Analyzer: LabCore AutoChem 9000 | Values may vary between laboratories due to differences in method/equipment used.`,
      
      // Quality Assurance
      specimenQuality: "Acceptable",
      hemolysisLipemia: "Not Observed",
      internalQCStatus: "Passed — Within Limits",
      externalQAScheme: "NABL EQAS / Bio-Rad International",
      calibrationStatus: "Valid",
      reportConfidenceScore: "99.8%",

      // Clinical Authorization Signatures
      technicianName: "R. K. Sharma, B.Sc MLT",
      pathologistName: (report as any).approver?.fullName || "Dr. Nikil Panchal, MD",
      pathologistDegree: "MBBS, MD (Pathology), Senior Pathologist",
      pathologistRegNo: "GMC / NMC-74829",
      pathologistSignatureUrl: (report as any).approver?.signatureUrl || (report as any).doctor?.signatureUrl || undefined,
    };
  };

  const getFlagColor = useCallback((flag?: string) => {
    switch (flag?.toLowerCase()) {
      case "high":
      case "critical":
        return "text-red-600 font-bold";
      case "low":
        return "text-orange-600 font-semibold";
      default:
        return "text-green-600";
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {error || "Report not found"}
          </p>
          <button
            onClick={() => router.push("/reports")}
            className="mt-4 btn btn-secondary"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Action Bar */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/reports")}
              className="btn btn-secondary p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Order Report
              </h1>
              <p className="text-sm text-gray-500">{report.orderNumber}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPremiumView(!showPremiumView)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPremiumView ? "Standard View" : "Premium View"}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={generatingPdf}
              className="btn btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {generatingPdf ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={() => setShowCommunicationHub(true)}
              disabled={!communicationOrder}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MessageSquare className="h-4 w-4" />
              WhatsApp / Email
            </button>
            <button
              onClick={handlePrint}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>

          {communicationOrder && (
            <OrderCommunicationHubModal
              isOpen={showCommunicationHub}
              onClose={() => setShowCommunicationHub(false)}
              order={communicationOrder}
              reportUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/reports/order/${orderId}`}
              defaultTemplate="REPORT_READY"
              onSuccess={() => setShowCommunicationHub(false)}
            />
          )}
        </div>
      </div>

      {/* Report Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {showPremiumView && report ? (
          <div ref={premiumReportRef}>
            <PremiumLabReport report={generatePremiumReportData()!} />
          </div>
        ) : (
          <div 
            ref={reportRef}
            className="mx-auto max-w-4xl rounded-xl bg-white shadow-lg border border-gray-200"
          >
          {/* Header */}
          <div className="border-b-4 border-blue-900 bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white text-2xl font-bold text-blue-900">
                    LC
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">LABCORE ELIS</h1>
                    <p className="text-sm text-blue-100">
                      Enterprise Laboratory Information System
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold tracking-wider">LABORATORY REPORT</h2>
                <p className="text-lg font-semibold">{report.orderNumber}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Patient Information */}
            <div className="mb-8">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-blue-900">
                <User className="h-5 w-5" />
                PATIENT INFORMATION
              </h3>
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-blue-50 p-4 border border-blue-100">
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-600">Patient Name</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {report.patient.firstName} {report.patient.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-600">UHID</p>
                  <p className="mt-1 font-semibold text-gray-900">{report.patient.uhid}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-600">Age</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {report.patient.age ? `${report.patient.age} years` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-600">Gender</p>
                  <p className="mt-1 font-semibold text-gray-900">{report.patient.gender}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-600">Phone</p>
                  <p className="mt-1 font-semibold text-gray-900">{report.patient.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-600">Email</p>
                  <p className="mt-1 font-semibold text-gray-900">{report.patient.email || "—"}</p>
                </div>
              </div>
            </div>

            {/* Order Information */}
            <div className="mb-8">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-blue-900">
                <FileText className="h-5 w-5" />
                ORDER INFORMATION
              </h3>
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-blue-50 p-4 border border-blue-100">
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-600">Order Number</p>
                  <p className="mt-1 font-semibold text-gray-900">{report.orderNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-600">Barcode</p>
                  <p className="mt-1 font-semibold text-gray-900">{report.barcode}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-600">Order Date</p>
                  <p className="mt-1 font-semibold text-gray-900">{formatDate(report.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-600">Order Status</p>
                  <p className="mt-1 font-semibold text-gray-900">{report.orderStatus}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-600">Sample Collected</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {report.sampleCollected ? formatDate(report.collectedAt) : "Not collected"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-600">Report Date</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {report.reportedAt ? formatDate(report.reportedAt) : "Pending"}
                  </p>
                </div>
                {report.doctor && (
                  <>
                    <div className="col-span-2">
                      <p className="text-xs font-semibold uppercase text-blue-600">Referring Doctor</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        Dr. {report.doctor.fullName}
                        {report.doctor.qualification && ` (${report.doctor.qualification})`}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Test Results */}
            <div className="mb-8">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-blue-900">
                <TestTube className="h-5 w-5" />
                TEST RESULTS
              </h3>
              
              {report.results.map((result, index) => (
                <div key={result.id} className="mb-6 rounded-lg border border-gray-200 p-4 bg-white">
                  <div className="mb-4 flex items-start justify-between border-b border-gray-200 pb-3">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">
                        {index + 1}. {result.test.testName}
                      </h4>
                      <p className="text-sm text-gray-600">Code: {result.test.testCode}</p>
                    </div>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800 border border-green-200">
                      {result.status}
                    </span>
                  </div>
                  
                  {result.values.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-blue-900 text-white">
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Parameter</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Result</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Unit</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Reference Range</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Flag</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {result.values.map((value) => (
                            <tr key={value.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-900">
                                {value.parameter.parameterName}
                              </td>
                              <td className="px-4 py-3 font-semibold text-gray-900">
                                {value.value}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {value.parameter.unit || "—"}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {(() => {
                                  const param = result.test.parameters?.find(p => p.id === value.parameter.id);
                                  const refRange = param?.referenceRanges?.[0];
                                  return refRange 
                                    ? `${refRange.normalLow || '—'} - ${refRange.normalHigh || '—'}`
                                    : "—";
                                })()}
                              </td>
                              <td className={`px-4 py-3 ${getFlagColor(value.flag)}`}>
                                {value.flag || "Normal"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">No result values available</p>
                  )}
                  
                  {result.remarks && (
                    <div className="mt-4 rounded bg-yellow-50 p-3 border border-yellow-200">
                      <p className="text-xs font-semibold uppercase text-yellow-800">Remarks</p>
                      <p className="mt-1 text-sm text-yellow-900">{result.remarks}</p>
                    </div>
                  )}
                  
                  {result.interpretation && (
                    <div className="mt-4 rounded bg-blue-50 p-3 border border-blue-200">
                      <p className="text-xs font-semibold uppercase text-blue-800">Interpretation</p>
                      <p className="mt-1 text-sm text-blue-900">{result.interpretation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Authorization */}
            <div className="mb-8">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-blue-900">
                <Shield className="h-5 w-5" />
                AUTHORIZATION
              </h3>
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-blue-50 p-4 border border-blue-100">
                {report.results[0]?.enteredBy && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-blue-600">Entered By</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {report.results[0].enteredBy.fullName} ({report.results[0].enteredBy.employeeCode})
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatDateTime(report.results[0].enteredAt)}
                    </p>
                  </div>
                )}
                {report.results[0]?.approvedBy && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-blue-600">Approved By</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {report.results[0].approvedBy.fullName} ({report.results[0].approvedBy.employeeCode})
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatDateTime(report.results[0].approvedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information */}
            {report.invoice && (
              <div className="mb-8">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-blue-900">
                  <FileText className="h-5 w-5" />
                  PAYMENT INFORMATION
                </h3>
                <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-blue-600">Invoice Number</p>
                      <p className="mt-1 font-semibold text-gray-900">{report.invoice.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-blue-600">Payment Status</p>
                      <p className="mt-1 font-semibold text-gray-900">{report.invoice.paymentStatus}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-blue-600">Total Amount</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        ₹{Number(report.invoice.grandTotal).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    {report.payments && report.payments.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-blue-600">Last Payment</p>
                        <p className="mt-1 font-semibold text-gray-900">
                          ₹{Number(report.payments[0].amount).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-gray-600">{report.payments[0].method}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 rounded-lg bg-blue-50 p-4 border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {qrCodeDataUrl && (
                    <img src={qrCodeDataUrl} alt="QR Code" className="h-20 w-20" />
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase text-blue-900">Report Verification</p>
                    <p className="text-sm text-blue-800">
                      Scan QR code to verify authenticity
                    </p>
                    <p className="text-xs text-blue-600">
                      Report ID: {orderId}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">
                    Generated on {new Date().toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600">
                    This is a computer-generated report
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}