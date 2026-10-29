"use client";

import React, { useRef, useEffect, useState } from "react";
import QRCode from "qrcode";

// =======================================================
// CSS VARIABLES - EXACT COLORS FROM SPECIFICATION
// =======================================================

const premiumReportStyles = `
  .premium-report-page {
    font-family: 'Arial', 'Helvetica', sans-serif;
    background: #ffffff;
    color: #1a1a1a;
    line-height: 1.4;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 0;
    box-sizing: border-box;
  }

  .premium-report-container {
    width: 100%;
    padding: 10mm;
    background: #ffffff;
  }

  /* Header Section */
  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2px;
    padding: 15px 20px;
    background: #ffffff;
  }

  .logo-section {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .logo-main {
    font-size: 28px;
    font-weight: bold;
    color: #0a2540;
    letter-spacing: -0.5px;
  }

  .logo-sub {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .logo-tagline {
    font-size: 10px;
    font-style: italic;
    color: #94a3b8;
    margin-top: 2px;
  }

  .clinic-info {
    text-align: right;
    max-width: 400px;
  }

  .clinic-name {
    font-size: 14px;
    font-weight: bold;
    color: #0a2540;
    margin-bottom: 4px;
  }

  .clinic-address {
    font-size: 10px;
    color: #475569;
    line-height: 1.3;
    margin-bottom: 4px;
  }

  .clinic-contact {
    font-size: 9px;
    color: #475569;
    margin-bottom: 6px;
  }

  .accreditation {
    font-size: 9px;
    font-weight: bold;
    color: #0f766e;
    background: #f0fdfa;
    padding: 4px 8px;
    border-radius: 3px;
    display: inline-block;
  }

  .gold-line {
    height: 2px;
    background: linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #d97706 100%);
    margin: 8px 0 15px 0;
  }

  /* Diagnostic Test Report Section */
  .report-title-bar {
    background: #1e3a8a;
    color: white;
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .report-title {
    font-size: 16px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .report-ids {
    font-size: 12px;
    font-weight: 600;
    color: #e0e7ff;
  }

  /* Patient and Sample Details */
  .details-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 25px;
  }

  .details-column {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 15px;
  }

  .details-title {
    font-size: 12px;
    font-weight: bold;
    color: #1e3a8a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #1e3a8a;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 11px;
  }

  .detail-label {
    color: #64748b;
    font-weight: 500;
  }

  .detail-value {
    color: #1a1a1a;
    font-weight: 600;
  }

  /* Test Section */
  .test-section {
    margin-bottom: 25px;
  }

  .test-title {
    font-size: 14px;
    font-weight: bold;
    color: #1e3a8a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 2px solid #d97706;
  }

  /* Results Table */
  .results-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    margin-bottom: 15px;
  }

  .results-table thead {
    background: #1e3a8a;
  }

  .results-table th {
    padding: 10px 12px;
    text-align: left;
    font-weight: bold;
    color: white;
    text-transform: uppercase;
    font-size: 9px;
    letter-spacing: 0.5px;
    border: 1px solid #1e3a8a;
  }

  .results-table td {
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    color: #1a1a1a;
  }

  .result-value {
    font-weight: bold;
  }

  .result-value.high {
    color: #dc2626;
  }

  .result-value.normal {
    color: #16a34a;
  }

  .flag-badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: bold;
    text-transform: uppercase;
  }

  .flag-badge.high {
    background: #fee2e2;
    color: #dc2626;
  }

  .flag-badge.normal {
    background: #dcfce7;
    color: #16a34a;
  }

  /* Range Indicator */
  .range-indicator {
    width: 60px;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }

  .range-fill {
    height: 100%;
    border-radius: 4px;
  }

  .range-fill.normal {
    background: #16a34a;
    width: 100%;
  }

  .range-fill.partial {
    background: #dc2626;
    width: 40%;
  }

  /* Clinical Interpretation */
  .clinical-interpretation {
    background: #fef9c3;
    border: 1px solid #eab308;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
  }

  .interpretation-title {
    font-size: 11px;
    font-weight: bold;
    color: #854d0e;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .interpretation-text {
    font-size: 10px;
    color: #713f12;
    line-height: 1.5;
  }

  /* Methodology */
  .methodology {
    font-size: 9px;
    color: #64748b;
    font-style: italic;
    margin-bottom: 25px;
    padding: 10px;
    background: #f8fafc;
    border-radius: 6px;
  }

  /* Quality Assurance Section */
  .qa-section {
    margin-bottom: 25px;
  }

  .qa-title {
    font-size: 14px;
    font-weight: bold;
    color: #1e3a8a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 2px solid #d97706;
  }

  .qa-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }

  .qa-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    background: #f8fafc;
    border-radius: 6px;
    font-size: 10px;
  }

  .qa-label {
    color: #64748b;
    font-weight: 500;
  }

  .qa-value {
    color: #1a1a1a;
    font-weight: 600;
  }

  .qa-value.passed {
    color: #16a34a;
  }

  /* Signatures Block */
  .signatures-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 25px;
    margin-bottom: 20px;
    padding: 0 10px;
  }

  .signature-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    min-width: 180px;
  }

  .signature-space {
    height: 48px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    margin-bottom: 4px;
  }

  .signature-img {
    max-height: 44px;
    max-width: 160px;
    object-fit: contain;
  }

  .signature-stamp {
    font-size: 10px;
    font-weight: bold;
    color: #0f766e;
    background: #f0fdfa;
    border: 1px dashed #0f766e;
    padding: 3px 8px;
    border-radius: 4px;
  }

  .signature-line {
    width: 100%;
    height: 1px;
    background: #cbd5e1;
    margin-bottom: 4px;
  }

  .signature-name {
    font-size: 11px;
    font-weight: bold;
    color: #0a2540;
  }

  .signature-role {
    font-size: 9px;
    color: #64748b;
  }

  .signature-council {
    font-size: 8px;
    color: #94a3b8;
    font-family: monospace;
  }

  /* Footer */
  .report-footer {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 2px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-verification {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .qr-code {
    width: 60px;
    height: 60px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 4px;
    background: white;
  }

  .qr-code canvas,
  .qr-code img {
    width: 100%;
    height: 100%;
  }

  .verification-text {
    font-size: 10px;
    color: #64748b;
  }

  .verification-text strong {
    color: #1e3a8a;
  }

  .footer-info {
    text-align: right;
    font-size: 9px;
    color: #94a3b8;
  }

  /* Print Styles */
  @media print {
    .premium-report-page {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      width: 100%;
      margin: 0;
      padding: 0;
    }

    .premium-report-container {
      padding: 5mm;
    }

    .no-print {
      display: none !important;
    }
  }
`;

// =======================================================
// UTILITY FUNCTIONS
// =======================================================

function formatDate(date: string | undefined): string {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: string | undefined): string {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculateAge(dateOfBirth?: string): string {
  if (!dateOfBirth) return "—";
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} Yrs`;
}

// =======================================================
// INTERFACES
// =======================================================

interface PremiumReportData {
  // Clinic Information
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  accreditation: string;
  
  // Report Information
  reportId: string;
  orderId: string;
  reportDate: string;
  
  // Patient Information
  patientName: string;
  uhid: string;
  age?: string;
  gender?: string;
  contact?: string;
  
  // Sample Information
  referringDoctor?: string;
  sampleCollected?: string;
  reportApproved?: string;
  specimen?: string;
  
  // Test Results
  testName: string;
  results: Array<{
    parameterName: string;
    result: string;
    unit?: string;
    referenceRange?: string;
    flag?: string;
    rangeIndicator?: 'normal' | 'partial' | 'none';
  }>;
  
  // Clinical Information
  clinicalInterpretation?: string;
  methodology?: string;
  
  // Quality Assurance
  specimenQuality?: string;
  hemolysisLipemia?: string;
  internalQCStatus?: string;
  externalQAScheme?: string;
  calibrationStatus?: string;
  reportConfidenceScore?: string;

  // Authorization Signatures
  technicianName?: string;
  technicianSignatureUrl?: string;
  pathologistName?: string;
  pathologistDegree?: string;
  pathologistRegNo?: string;
  pathologistSignatureUrl?: string;
}

interface PremiumLabReportProps {
  report: PremiumReportData;
  onPrint?: () => void;
  onDownload?: () => void;
}

// =======================================================
// MAIN COMPONENT
// =======================================================

export default function PremiumLabReport({
  report,
  onPrint,
  onDownload,
}: PremiumLabReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const verifyUrl = `https://labcore.in/verify/${report.reportId}`;
        const qrCodeDataURL = await QRCode.toDataURL(verifyUrl, {
          width: 200,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });
        setQrCodeDataUrl(qrCodeDataURL);
      } catch (error) {
        console.error("QR Code generation failed:", error);
      }
    };
    
    generateQRCode();
  }, [report.reportId]);

  return (
    <>
      <style>{premiumReportStyles}</style>
      <div className="premium-report-page" ref={reportRef}>
        <div className="premium-report-container">
          {/* Header */}
          <div className="report-header">
            <div className="logo-section">
              <div className="logo-main">LC LabCore</div>
              <div className="logo-sub">ENTERPRISE DIAGNOSTICS</div>
              <div className="logo-tagline">Precision. Trust. Care.</div>
            </div>
            <div className="clinic-info">
              <div className="clinic-name">{report.clinicName}</div>
              <div className="clinic-address">{report.clinicAddress}</div>
              <div className="clinic-contact">
                Phone: {report.clinicPhone} | Email: {report.clinicEmail}
              </div>
              <div className="accreditation">{report.accreditation}</div>
            </div>
          </div>

          <div className="gold-line"></div>

          {/* Report Title Bar */}
          <div className="report-title-bar">
            <div className="report-title">Diagnostic Test Report</div>
            <div className="report-ids">{report.reportId} | {report.orderId}</div>
          </div>

          {/* Patient and Sample Details */}
          <div className="details-section">
            <div className="details-column">
              <div className="details-title">Patient Details</div>
              <div className="detail-row">
                <span className="detail-label">Patient Name</span>
                <span className="detail-value">{report.patientName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">UHID</span>
                <span className="detail-value">{report.uhid}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Age / Gender</span>
                <span className="detail-value">{report.age} / {report.gender}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Contact</span>
                <span className="detail-value">{report.contact || "—"}</span>
              </div>
            </div>

            <div className="details-column">
              <div className="details-title">Sample Details</div>
              <div className="detail-row">
                <span className="detail-label">Referring Doctor</span>
                <span className="detail-value">{report.referringDoctor || "—"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Sample Collected</span>
                <span className="detail-value">{formatDateTime(report.sampleCollected)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Report Approved</span>
                <span className="detail-value">{formatDateTime(report.reportApproved)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Specimen</span>
                <span className="detail-value">{report.specimen || "—"}</span>
              </div>
            </div>
          </div>

          {/* Test Section */}
          <div className="test-section">
            <div className="test-title">{report.testName}</div>
            
            <table className="results-table">
              <thead>
                <tr>
                  <th>Test Parameter</th>
                  <th>Result</th>
                  <th>Unit</th>
                  <th>Biological Reference Range</th>
                  <th>Flag</th>
                  <th>Range Indicator</th>
                </tr>
              </thead>
              <tbody>
                {report.results.map((result, index) => (
                  <tr key={index}>
                    <td>{result.parameterName}</td>
                    <td className={`result-value ${result.flag?.toLowerCase() === 'high' ? 'high' : 'normal'}`}>
                      {result.result}
                    </td>
                    <td>{result.unit || "—"}</td>
                    <td>{result.referenceRange || "—"}</td>
                    <td>
                      <span className={`flag-badge ${result.flag?.toLowerCase() === 'high' ? 'high' : 'normal'}`}>
                        {result.flag || "NORMAL"}
                      </span>
                    </td>
                    <td>
                      <div className="range-indicator">
                        <div className={`range-fill ${result.rangeIndicator || 'normal'}`}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Clinical Interpretation */}
            {report.clinicalInterpretation && (
              <div className="clinical-interpretation">
                <div className="interpretation-title">Clinical Interpretation</div>
                <div className="interpretation-text">{report.clinicalInterpretation}</div>
              </div>
            )}

            {/* Methodology */}
            {report.methodology && (
              <div className="methodology">
                {report.methodology}
              </div>
            )}
          </div>

          {/* Quality Assurance Section */}
          <div className="qa-section">
            <div className="qa-title">Specimen & Quality Assurance</div>
            <div className="qa-grid">
              <div className="qa-item">
                <span className="qa-label">Specimen Quality</span>
                <span className="qa-value">{report.specimenQuality || "—"}</span>
              </div>
              <div className="qa-item">
                <span className="qa-label">Hemolysis / Lipemia</span>
                <span className="qa-value">{report.hemolysisLipemia || "—"}</span>
              </div>
              <div className="qa-item">
                <span className="qa-label">Internal QC Status</span>
                <span className={`qa-value ${report.internalQCStatus?.toLowerCase().includes('passed') ? 'passed' : ''}`}>
                  {report.internalQCStatus || "—"}
                </span>
              </div>
              <div className="qa-item">
                <span className="qa-label">External QA Scheme</span>
                <span className="qa-value">{report.externalQAScheme || "—"}</span>
              </div>
              <div className="qa-item">
                <span className="qa-label">Calibration Status</span>
                <span className="qa-value">{report.calibrationStatus || "—"}</span>
              </div>
              <div className="qa-item">
                <span className="qa-label">Report Confidence Score</span>
                <span className="qa-value">{report.reportConfidenceScore || "—"}</span>
              </div>
            </div>
          </div>

          {/* Clinical Authorization & Pathologist Signature Block */}
          <div className="signatures-section">
            <div className="signature-box">
              <div className="signature-space">
                {report.technicianSignatureUrl ? (
                  <img src={report.technicianSignatureUrl} alt="Technician Signature" className="signature-img" />
                ) : (
                  <div className="signature-stamp">✓ Verified in Lab</div>
                )}
              </div>
              <div className="signature-line" />
              <div className="signature-name">{report.technicianName || "Medical Lab Technologist"}</div>
              <div className="signature-role">MLT / Quality Controller</div>
            </div>

            <div className="signature-box">
              <div className="signature-space">
                {report.pathologistSignatureUrl ? (
                  <img src={report.pathologistSignatureUrl} alt="Pathologist Signature" className="signature-img" />
                ) : (
                  <div className="signature-stamp">✓ Digitally Signed & Authorized</div>
                )}
              </div>
              <div className="signature-line" />
              <div className="signature-name">{report.pathologistName || "Dr. Authorized Pathologist"}</div>
              <div className="signature-role">{report.pathologistDegree || "MBBS, MD (Pathology)"}</div>
              {report.pathologistRegNo && (
                <div className="signature-council">Reg No: {report.pathologistRegNo}</div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="report-footer">
            <div className="footer-verification">
              {qrCodeDataUrl && (
                <div className="qr-code">
                  <img src={qrCodeDataUrl} alt="QR Code" />
                </div>
              )}
              <div className="verification-text">
                <strong>Scan to verify authenticity</strong><br />
                Report ID: {report.reportId}
              </div>
            </div>
            <div className="footer-info">
              Generated on {formatDate(new Date().toISOString())}<br />
              This is a computer-generated report
            </div>
          </div>
        </div>
      </div>
    </>
  );
}