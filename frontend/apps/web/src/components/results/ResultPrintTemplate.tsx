"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { formatPatientFullName } from "@/lib/patient-utils";

interface ResultData {
  id: string;
  orderId: string;
  testId: string;
  status: string;
  remarks?: string;
  interpretation?: string;
  enteredAt?: string;
  verifiedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  test: {
    id: string;
    testCode: string;
    testName: string;
    sampleType: string;
    method?: string;
    category?: {
      id: string;
      code: string;
      name: string;
    };
    parameters: Array<{
      id: string;
      parameterName: string;
      unit?: string;
      dataType: string;
      referenceRanges: Array<{
        id: string;
        gender?: string;
        minAge?: number;
        maxAge?: number;
        criticalLow?: number;
        normalLow?: number;
        normalHigh?: number;
        criticalHigh?: number;
        interpretation?: string;
      }>;
    }>;
  };
  order: {
    id: string;
    orderNumber: string;
    barcode: string;
    orderStatus: string;
    paymentStatus: string;
    createdAt: string;
    notes?: string;
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
      doctorCode: string;
      fullName: string;
      qualification?: string;
      specialization?: string;
      phone?: string;
      email?: string;
      clinicName?: string;
      address?: string;
    };
  };
  enteredBy?: {
    id: string;
    employeeCode: string;
    fullName: string;
    role: string;
  };
  approvedBy?: {
    id: string;
    employeeCode: string;
    fullName: string;
    role: string;
  };
  values: Array<{
    id: string;
    value: string;
    flag?: string;
    remark?: string;
    parameter: {
      id: string;
      parameterName: string;
      unit?: string;
      dataType: string;
    };
  }>;
}

interface ResultPrintTemplateProps {
  result: ResultData;
  onClose: () => void;
}

export default function ResultPrintTemplate({ result, onClose }: ResultPrintTemplateProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '', 'width=800,height=600');

      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Lab Report - ${result.order?.orderNumber || 'Report'}</title>
              <style>
                ${getPremiumPrintStyles()}
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
        onClose();
      }
    }
  }, [result.order?.orderNumber, onClose]);

  useEffect(() => {
    if (printRef.current) {
      handlePrint();
    }
  }, [handlePrint]);

  const getPremiumPrintStyles = () => `
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    body {
      font-family: 'Segoe UI', 'Times New Roman', Times, serif;
      font-size: 11px;
      line-height: 1.4;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      background: white;
    }
    
    .report-container {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
    }
    
    /* Premium Header */
    .report-header {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      padding: 25px 30px;
      border-radius: 8px 8px 0 0;
      position: relative;
      overflow: hidden;
    }
    
    .report-header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 300px;
      height: 300px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }
    
    .report-header::after {
      content: '';
      position: absolute;
      bottom: -30%;
      left: -10%;
      width: 200px;
      height: 200px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 50%;
    }
    
    .header-content {
      position: relative;
      z-index: 1;
    }
    
    .lab-name {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 5px 0;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    
    .lab-subtitle {
      font-size: 12px;
      margin: 0 0 15px 0;
      opacity: 0.9;
      font-weight: 500;
    }
    
    .header-details {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 20px;
    }
    
    .report-info {
      text-align: right;
    }
    
    .report-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.8;
      margin: 0;
    }
    
    .report-value {
      font-size: 14px;
      font-weight: 600;
      margin: 3px 0 0 0;
    }
    
    /* Section Styling */
    .section {
      margin: 25px 0;
      padding: 20px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e3a8a;
      margin: 0 0 15px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding-bottom: 10px;
      border-bottom: 2px solid #3b82f6;
    }
    
    /* Grid Layouts */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    
    .info-item {
      margin: 0;
    }
    
    .info-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      font-weight: 600;
      margin: 0 0 4px 0;
    }
    
    .info-value {
      font-size: 11px;
      color: #1e293b;
      font-weight: 500;
      margin: 0;
    }
    
    /* Premium Table */
    .results-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10px;
    }
    
    .results-table thead {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
    }
    
    .results-table th {
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 9px;
    }
    
    .results-table td {
      padding: 10px 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .results-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    
    .results-table tbody tr:hover {
      background: #e0f2fe;
    }
    
    .table-parameter {
      font-weight: 600;
      color: #1e293b;
    }
    
    .table-result {
      font-weight: 700;
      color: #1e3a8a;
    }
    
    .table-unit {
      color: #64748b;
      font-style: italic;
    }
    
    .table-range {
      color: #475569;
    }
    
    /* Flag Badges */
    .flag-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .flag-normal {
      background: #dcfce7;
      color: #166534;
    }
    
    .flag-high {
      background: #ffedd5;
      color: #9a3412;
    }
    
    .flag-low {
      background: #fef9c3;
      color: #854d0e;
    }
    
    .flag-critical {
      background: #fee2e2;
      color: #991b1b;
    }
    
    /* Status Badge */
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .status-approved {
      background: #dcfce7;
      color: #166534;
    }
    
    .status-verified {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .status-entered {
      background: #fef9c3;
      color: #854d0e;
    }
    
    /* Summary Cards */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 15px 0;
    }
    
    .summary-card {
      padding: 12px;
      border-radius: 6px;
      text-align: center;
      border: 1px solid #e2e8f0;
    }
    
    .summary-card.total {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    
    .summary-card.normal {
      background: #dcfce7;
      border-color: #86efac;
    }
    
    .summary-card.abnormal {
      background: #ffedd5;
      border-color: #fdba74;
    }
    
    .summary-card.critical {
      background: #fee2e2;
      border-color: #fca5a5;
    }
    
    .summary-label {
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      font-weight: 600;
      margin: 0 0 5px 0;
    }
    
    .summary-value {
      font-size: 20px;
      font-weight: 700;
      margin: 0;
    }
    
    .summary-card.normal .summary-value {
      color: #166534;
    }
    
    .summary-card.abnormal .summary-value {
      color: #9a3412;
    }
    
    .summary-card.critical .summary-value {
      color: #991b1b;
    }
    
    /* Timeline */
    .timeline {
      margin: 15px 0;
    }
    
    .timeline-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px dashed #e2e8f0;
    }
    
    .timeline-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    
    .timeline-number {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      flex-shrink: 0;
    }
    
    .timeline-content {
      flex: 1;
    }
    
    .timeline-title {
      font-size: 10px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 2px 0;
    }
    
    .timeline-details {
      font-size: 9px;
      color: #64748b;
      margin: 0;
    }
    
    /* Footer */
    .report-footer {
      margin-top: 30px;
      padding: 20px;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border: 1px solid #cbd5e1;
      border-radius: 0 0 8px 8px;
      text-align: center;
    }
    
    .footer-text {
      font-size: 9px;
      color: #64748b;
      margin: 3px 0;
    }
    
    .footer-disclaimer {
      font-size: 8px;
      color: #94a3b8;
      margin: 10px 0 0 0;
      font-style: italic;
    }
    
    /* Interpretation Box */
    .interpretation-box {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 6px;
      padding: 15px;
      margin: 15px 0;
    }
    
    .interpretation-title {
      font-size: 11px;
      font-weight: 700;
      color: #92400e;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .interpretation-text {
      font-size: 10px;
      color: #78350f;
      margin: 0;
      line-height: 1.6;
    }
    
    /* Watermark */
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 60px;
      font-weight: 700;
      color: rgba(30, 58, 138, 0.05);
      text-transform: uppercase;
      letter-spacing: 2px;
      pointer-events: none;
      z-index: 0;
    }
  `;

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return "—";
    const birth = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const getFlagClass = (flag?: string) => {
    if (!flag) return "flag-normal";
    switch (flag) {
      case "CRITICAL": return "flag-critical";
      case "HIGH": return "flag-high";
      case "LOW": return "flag-low";
      case "NORMAL": return "flag-normal";
      default: return "flag-normal";
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "PUBLISHED":
        return "status-approved";
      case "VERIFIED":
        return "status-verified";
      case "ENTERED":
        return "status-entered";
      default:
        return "status-entered";
    }
  };

  const patientName = formatPatientFullName(result.order.patient);
  const patientAge = result.order.patient.age || calculateAge(result.order.patient.dateOfBirth);

  return (
    <div className="hidden">
      <div ref={printRef} className="report-container">
        {/* Watermark */}
        <div className="watermark">LabCore</div>

        {/* Premium Header */}
        <div className="report-header">
          <div className="header-content">
            <h1 className="lab-name">LabCore Diagnostics</h1>
            <p className="lab-subtitle">Enterprise Laboratory Information System</p>
            <p style={{ fontSize: '10px', margin: '0', opacity: 0.8 }}>
              NABL Accredited • ISO 15189 Certified • Quality Assured
            </p>
            
            <div className="header-details">
              <div>
                <p className="report-label">Patient Name</p>
                <p className="report-value">{patientName}</p>
                <p className="report-label" style={{ marginTop: '10px' }}>UHID</p>
                <p className="report-value">{result.order.patient.uhid}</p>
              </div>
              <div className="report-info">
                <p className="report-label">Report Number</p>
                <p className="report-value">{result.id}</p>
                <p className="report-label" style={{ marginTop: '10px' }}>Report Date</p>
                <p className="report-value">{formatDate(result.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="section">
          <h2 className="section-title">Patient Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <p className="info-label">Age/Gender</p>
              <p className="info-value">{patientAge} yrs / {result.order.patient.gender}</p>
            </div>
            <div className="info-item">
              <p className="info-label">Phone</p>
              <p className="info-value">{result.order.patient.phone || "—"}</p>
            </div>
            <div className="info-item">
              <p className="info-label">Email</p>
              <p className="info-value">{result.order.patient.email || "—"}</p>
            </div>
            <div className="info-item">
              <p className="info-label">Address</p>
              <p className="info-value">
                {[result.order.patient.address, result.order.patient.city, result.order.patient.state, result.order.patient.pincode]
                  .filter(Boolean).join(", ") || "—"}
              </p>
            </div>
            <div className="info-item">
              <p className="info-label">Order Number</p>
              <p className="info-value">{result.order.orderNumber}</p>
            </div>
            <div className="info-item">
              <p className="info-label">Barcode</p>
              <p className="info-value">{result.order.barcode}</p>
            </div>
          </div>
        </div>

        {/* Referring Doctor */}
        {result.order.doctor && (
          <div className="section">
            <h2 className="section-title">Referring Doctor</h2>
            <div className="info-grid">
              <div className="info-item">
                <p className="info-label">Doctor Name</p>
                <p className="info-value">{result.order.doctor.fullName}</p>
              </div>
              <div className="info-item">
                <p className="info-label">Qualification</p>
                <p className="info-value">{result.order.doctor.qualification || "—"}</p>
              </div>
              <div className="info-item">
                <p className="info-label">Specialization</p>
                <p className="info-value">{result.order.doctor.specialization || "—"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Test Information */}
        <div className="section">
          <h2 className="section-title">Test Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <p className="info-label">Test Name</p>
              <p className="info-value">{result.test.testName}</p>
            </div>
            <div className="info-item">
              <p className="info-label">Test Code</p>
              <p className="info-value">{result.test.testCode}</p>
            </div>
            <div className="info-item">
              <p className="info-label">Sample Type</p>
              <p className="info-value">{result.test.sampleType}</p>
            </div>
            <div className="info-item">
              <p className="info-label">Method</p>
              <p className="info-value">{result.test.method || "—"}</p>
            </div>
            <div className="info-item">
              <p className="info-label">Category</p>
              <p className="info-value">{result.test.category?.name || "—"}</p>
            </div>
            <div className="info-item">
              <p className="info-label">Status</p>
              <p className="info-value">
                <span className={`status-badge ${getStatusClass(result.status)}`}>
                  {result.status}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="section">
          <h2 className="section-title">Results Summary</h2>
          <div className="summary-grid">
            <div className="summary-card total">
              <p className="summary-label">Total Parameters</p>
              <p className="summary-value">{result.values.length}</p>
            </div>
            <div className="summary-card normal">
              <p className="summary-label">Normal</p>
              <p className="summary-value">
                {result.values.filter(v => v.flag === "NORMAL" || !v.flag).length}
              </p>
            </div>
            <div className="summary-card abnormal">
              <p className="summary-label">Abnormal</p>
              <p className="summary-value">
                {result.values.filter(v => v.flag === "HIGH" || v.flag === "LOW").length}
              </p>
            </div>
            <div className="summary-card critical">
              <p className="summary-label">Critical</p>
              <p className="summary-value">
                {result.values.filter(v => v.flag === "CRITICAL").length}
              </p>
            </div>
          </div>
        </div>

        {/* Test Results Table */}
        <div className="section">
          <h2 className="section-title">Test Results</h2>
          <table className="results-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Result</th>
                <th>Unit</th>
                <th>Reference Range</th>
                <th>Flag</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {result.values.map((value) => (
                <tr key={value.id}>
                  <td className="table-parameter">{value.parameter.parameterName}</td>
                  <td className="table-result">{value.value}</td>
                  <td className="table-unit">{value.parameter.unit || "—"}</td>
                  <td className="table-range">
                    {(() => {
                      const param = result.test.parameters.find(p => p.id === value.parameter.id);
                      if (!param || !param.referenceRanges.length) return "—";
                      const range = param.referenceRanges[0];
                      if (range.normalLow !== undefined && range.normalHigh !== undefined) {
                        return `${range.normalLow} - ${range.normalHigh}`;
                      }
                      return range.interpretation || "—";
                    })()}
                  </td>
                  <td>
                    {value.flag && (
                      <span className={`flag-badge ${getFlagClass(value.flag)}`}>
                        {value.flag}
                      </span>
                    )}
                  </td>
                  <td>{value.remark || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Interpretation */}
        {(result.interpretation || result.remarks) && (
          <div className="section">
            <h2 className="section-title">Interpretation & Remarks</h2>
            {result.interpretation && (
              <div className="interpretation-box">
                <p className="interpretation-title">Clinical Interpretation</p>
                <p className="interpretation-text">{result.interpretation}</p>
              </div>
            )}
            {result.remarks && (
              <div className="interpretation-box" style={{ background: '#f0f9ff', borderColor: '#7dd3fc' }}>
                <p className="interpretation-title" style={{ color: '#075985' }}>Additional Remarks</p>
                <p className="interpretation-text" style={{ color: '#0c4a6e' }}>{result.remarks}</p>
              </div>
            )}
          </div>
        )}

        {/* Workflow Timeline */}
        <div className="section">
          <h2 className="section-title">Workflow Timeline</h2>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-number">1</div>
              <div className="timeline-content">
                <p className="timeline-title">Order Created</p>
                <p className="timeline-details">{formatDate(result.order.createdAt)}</p>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="timeline-number">2</div>
              <div className="timeline-content">
                <p className="timeline-title">Result Entered</p>
                <p className="timeline-details">
                  {result.enteredBy?.fullName || "—"} ({result.enteredBy?.employeeCode || "—"})
                </p>
                <p className="timeline-details">{formatDate(result.enteredAt)}</p>
              </div>
            </div>

            {result.verifiedAt && (
              <div className="timeline-item">
                <div className="timeline-number">3</div>
                <div className="timeline-content">
                  <p className="timeline-title">Result Verified</p>
                  <p className="timeline-details">{formatDate(result.verifiedAt)}</p>
                </div>
              </div>
            )}

            {result.approvedAt && (
              <div className="timeline-item">
                <div className="timeline-number">4</div>
                <div className="timeline-content">
                  <p className="timeline-title">Result Approved</p>
                  <p className="timeline-details">
                    {result.approvedBy?.fullName || "—"} ({result.approvedBy?.employeeCode || "—"})
                  </p>
                  <p className="timeline-details">{formatDate(result.approvedAt)}</p>
                </div>
              </div>
            )}

            {result.publishedAt && (
              <div className="timeline-item">
                <div className="timeline-number">5</div>
                <div className="timeline-content">
                  <p className="timeline-title">Result Published</p>
                  <p className="timeline-details">{formatDate(result.publishedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="report-footer">
          <p className="footer-text" style={{ fontWeight: '600', fontSize: '10px' }}>
            LabCore ELIS - Enterprise Laboratory Information System
          </p>
          <p className="footer-text">123 Healthcare Avenue, Medical District, City - 560001</p>
          <p className="footer-text">Phone: +91-9876543210 | Email: support@labcore.com</p>
          <p className="footer-text">GSTIN: 29ABCDE1234F1Z5 | NABL Accredited</p>
          <p className="footer-disclaimer">
            This is a computer-generated report. For medical emergencies, please contact your healthcare provider immediately.
            Results should be interpreted in conjunction with clinical findings and patient history.
          </p>
          <p className="footer-text" style={{ marginTop: '10px', fontSize: '8px' }}>
            Generated on {new Date().toLocaleString()} | Report ID: {result.id}
          </p>
        </div>
      </div>
    </div>
  );
}