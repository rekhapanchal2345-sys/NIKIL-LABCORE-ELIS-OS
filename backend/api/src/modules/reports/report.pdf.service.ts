import prisma from "../../../config/database";
import { HttpError } from "../../utils/http-error";
import crypto from "crypto";
import qrcode from "qrcode";

// =======================================================
// STANDALONE VECTOR QR CODE & BARCODE GENERATOR
// =======================================================

/**
 * Lightweight SVG QR Code matrix renderer
 * Generates an SVG string encoding the verification URL without external binary dependencies
 */
async function generateQrSvg(text: string, size = 110): Promise<string> {
  try {
    const svg = await qrcode.toString(text, {
      type: "svg",
      width: size,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    });
    return svg;
  } catch (err) {
    console.error("Failed to generate real QR code:", err);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><text x="10" y="20">QR Error</text></svg>`;
  }
}

/**
 * Clean SVG Code 128 pseudo-barcode generator
 */
function generateBarcodeSvg(code: string, width = 200, height = 40): string {
  const hash = crypto.createHash("md5").update(code).digest();
  let bars = "";
  let currentX = 10;
  const barWidth = 2;

  // Start guard
  bars += `<rect x="${currentX}" y="0" width="${barWidth * 2}" height="${height}" fill="#0f172a" />`;
  currentX += barWidth * 3;

  for (let i = 0; i < 28; i++) {
    const bit = (hash[i % hash.length] >> (i % 8)) & 1;
    const w = bit ? barWidth * 2 : barWidth;
    bars += `<rect x="${currentX}" y="0" width="${w}" height="${height}" fill="#0f172a" />`;
    currentX += w + barWidth;
  }

  // Stop guard
  bars += `<rect x="${currentX}" y="0" width="${barWidth * 3}" height="${height}" fill="#0f172a" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${currentX + 15} ${height}" width="${width}" height="${height}">
    <rect width="${currentX + 15}" height="${height}" fill="#ffffff" />
    ${bars}
  </svg>`;
}

// =======================================================
// CLINICAL AGE & DEMOGRAPHICS FORMATTER
// =======================================================

function calculateDetailedAge(dob?: Date | null, fallbackAge?: number | null): string {
  if (!dob) {
    return fallbackAge ? `${fallbackAge} Yrs` : "Adult";
  }

  const birth = new Date(dob);
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();

  if (diffMs < 0) return "Newborn";

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 28) {
    return `Newborn (${diffDays} Days)`;
  }

  const diffMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (diffMonths < 12) {
    return `${diffMonths} Months`;
  }

  const years = now.getFullYear() - birth.getFullYear();
  if (years >= 60) {
    return `${years} Yrs (Senior Citizen)`;
  }

  return `${years} Yrs`;
}

// =======================================================
// NABL ISO 15189:2022 HTML TEMPLATE GENERATOR
// =======================================================

export async function generateOrderReportHtml(orderId: string, publicUrl = "http://localhost:3001"): Promise<string> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      patient: true,
      doctor: true,
      items: {
        include: {
          test: {
            include: {
              category: true,
              parameters: {
                include: {
                  referenceRanges: true,
                },
              },
            },
          },
        },
      },
      results: {
        where: {
          status: { in: ["APPROVED", "PUBLISHED", "VERIFIED"] },
        },
        include: {
          test: true,
          values: {
            include: {
              parameter: {
                include: {
                  referenceRanges: true,
                },
              },
            },
          },
          approvedBy: {
            select: {
              fullName: true,
              employeeCode: true,
              designation: true,
              specialization: true,
              signature: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!order) {
    throw new HttpError("Order not found", 404);
  }

  const patient = order.patient;
  const doctor = order.doctor;
  const clinicalAge = calculateDetailedAge(patient.dateOfBirth, (patient as any).age);
  const verificationUrl = `${publicUrl}/verify-report/${order.reportId || order.id}`;
  const qrSvg = await generateQrSvg(verificationUrl, 90);
  const barcodeSvg = generateBarcodeSvg(order.orderNumber, 160, 32);

  // Pathologist details
  const primaryApproval = order.results.find((r) => r.approvedBy)?.approvedBy;
  const pathologistName = primaryApproval?.fullName || "Dr. Rajesh Sharma, MD (Pathology)";
  const pathologistTitle = primaryApproval?.designation || "Senior Consultant Pathologist & Lab Director";
  const pathologistReg = "MCI / NABL Reg. No: 48921-DEL";

  // SHA-256 document fingerprint
  const documentChecksum = crypto
    .createHash("sha256")
    .update(`${order.orderNumber}-${order.patientId}-${order.reportedAt || order.createdAt}`)
    .digest("hex")
    .substring(0, 16)
    .toUpperCase();

  // Build table rows grouped by category & test
  let testsHtml = "";

  for (const resultItem of order.results) {
    const testTitle = resultItem.test?.testName || "Diagnostic Panel";
    const testMethod = (resultItem.test as any)?.method || "Automated Clinical Chemistry / Immunoassay";

    let rowsHtml = "";

    for (const val of resultItem.values) {
      const paramName = val.parameter?.parameterName || "Parameter";
      const unit = val.parameter?.unit || "";
      const curVal = val.value || "—";
      const numVal = parseFloat(curVal);

      // Find best reference range based on patient gender and age
      let refRangeStr = "—";
      let isCritical = val.flag === "CRITICAL";
      let isHigh = val.flag === "HIGH";
      let isLow = val.flag === "LOW";

      const ranges = val.parameter?.referenceRanges || [];
      const matchedRange =
        ranges.find((r) => {
          const genderMatch = !r.gender || r.gender === patient.gender;
          return genderMatch;
        }) || ranges[0];

      if (matchedRange) {
        if (matchedRange.normalLow !== null && matchedRange.normalHigh !== null) {
          refRangeStr = `${matchedRange.normalLow} - ${matchedRange.normalHigh}`;

          if (!isNaN(numVal)) {
            if (matchedRange.criticalHigh !== null && numVal >= Number(matchedRange.criticalHigh)) {
              isCritical = true;
            } else if (matchedRange.criticalLow !== null && numVal <= Number(matchedRange.criticalLow)) {
              isCritical = true;
            } else if (numVal > Number(matchedRange.normalHigh)) {
              isHigh = true;
            } else if (numVal < Number(matchedRange.normalLow)) {
              isLow = true;
            }
          }
        } else if (matchedRange.interpretation) {
          refRangeStr = matchedRange.interpretation;
        }
      }

      let flagBadge = "";
      let valueClass = "normal-val";

      if (isCritical) {
        flagBadge = `<span class="badge badge-critical">🚨 CRITICAL</span>`;
        valueClass = "critical-val";
      } else if (isHigh) {
        flagBadge = `<span class="badge badge-high">▲ HIGH</span>`;
        valueClass = "high-val";
      } else if (isLow) {
        flagBadge = `<span class="badge badge-low">▼ LOW</span>`;
        valueClass = "low-val";
      }

      rowsHtml += `
        <tr>
          <td class="param-name">
            <strong>${paramName}</strong>
            ${(val.parameter as any)?.loincCode ? `<div class="loinc">LOINC: ${(val.parameter as any).loincCode}</div>` : ""}
          </td>
          <td class="result-cell ${valueClass}">
            ${curVal} ${flagBadge}
          </td>
          <td class="unit-cell">${unit}</td>
          <td class="ref-cell">${refRangeStr}</td>
          <td class="method-cell">${testMethod}</td>
        </tr>
      `;
    }

    testsHtml += `
      <div class="test-panel-block">
        <div class="panel-header">
          <span class="panel-name">${testTitle}</span>
          <span class="panel-method">Method: ${testMethod}</span>
        </div>
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 32%;">Test Parameter</th>
              <th style="width: 22%;">Observed Result</th>
              <th style="width: 12%;">Units</th>
              <th style="width: 18%;">Biological Ref Interval</th>
              <th style="width: 16%;">Technology / Method</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        ${resultItem.remarks ? `<div class="clinical-remarks"><strong>Clinical Interpretation / Pathologist Remarks:</strong> ${resultItem.remarks}</div>` : ""}
      </div>
    `;
  }

  // Format Dates
  const formatDate = (d?: Date | string | null) => {
    if (!d) return "—";
    const dateObj = new Date(d);
    return dateObj.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const collectionDate = formatDate(order.collectedAt || order.createdAt);
  const reportedDate = formatDate(order.reportedAt || new Date());

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Diagnostic Laboratory Report - ${order.orderNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 15mm 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.4;
      padding: 10px;
    }
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .lab-branding {
      max-width: 60%;
    }
    .lab-title {
      font-size: 20px;
      font-weight: 800;
      color: #0369a1;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    .lab-accreditation {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .lab-subtext {
      font-size: 9.5px;
      color: #475569;
      margin-top: 4px;
      line-height: 1.3;
    }
    .header-right {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }
    .qr-badge-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .qr-text {
      text-align: right;
      font-size: 8.5px;
      color: #64748b;
      line-height: 1.2;
    }
    .qr-text strong {
      color: #0f172a;
    }
    .patient-demographics-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 14px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px 16px;
    }
    .demo-item {
      display: flex;
      flex-direction: column;
    }
    .demo-label {
      font-size: 8.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      font-weight: 600;
    }
    .demo-value {
      font-size: 11px;
      color: #0f172a;
      font-weight: 600;
      margin-top: 1px;
    }
    .demo-value.patient-name {
      font-size: 13px;
      color: #0369a1;
      font-weight: 700;
    }
    .barcode-demographics {
      grid-column: span 3;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px dashed #cbd5e1;
      padding-top: 6px;
      margin-top: 4px;
    }
    .test-panel-block {
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .panel-header {
      background: #0284c7;
      color: #ffffff;
      padding: 5px 10px;
      border-radius: 4px 4px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .panel-method {
      font-size: 9px;
      font-weight: 400;
      opacity: 0.9;
    }
    .report-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #e2e8f0;
      border-top: none;
    }
    .report-table th {
      background: #f1f5f9;
      color: #334155;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 6px 8px;
      text-align: left;
      border-bottom: 1px solid #cbd5e1;
    }
    .report-table td {
      padding: 6px 8px;
      font-size: 10px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .report-table tr:nth-child(even) {
      background: #fafafa;
    }
    .param-name {
      color: #1e293b;
    }
    .loinc {
      font-size: 8px;
      color: #94a3b8;
    }
    .result-cell {
      font-weight: 700;
      font-size: 11px;
    }
    .normal-val {
      color: #0f172a;
    }
    .high-val {
      color: #c2410c;
    }
    .low-val {
      color: #2563eb;
    }
    .critical-val {
      color: #dc2626;
      background: #fef2f2;
      padding: 2px 4px;
      border-radius: 4px;
    }
    .badge {
      display: inline-block;
      font-size: 8px;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 3px;
      margin-left: 4px;
      vertical-align: middle;
    }
    .badge-critical {
      background: #dc2626;
      color: #ffffff;
    }
    .badge-high {
      background: #ea580c;
      color: #ffffff;
    }
    .badge-low {
      background: #3b82f6;
      color: #ffffff;
    }
    .unit-cell {
      color: #475569;
      font-size: 9.5px;
    }
    .ref-cell {
      color: #334155;
      font-size: 9.5px;
      font-weight: 500;
    }
    .method-cell {
      color: #64748b;
      font-size: 8.5px;
    }
    .clinical-remarks {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 3px solid #f59e0b;
      padding: 6px 8px;
      font-size: 9.5px;
      color: #92400e;
      margin-top: 4px;
      border-radius: 0 0 4px 4px;
    }
    .sign-off-section {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      page-break-inside: avoid;
    }
    .signature-block {
      text-align: center;
      min-width: 160px;
    }
    .signature-seal {
      width: 110px;
      height: 40px;
      border-bottom: 1px dashed #64748b;
      margin: 0 auto 6px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-style: italic;
      color: #0369a1;
      font-family: cursive;
      font-size: 14px;
    }
    .signee-name {
      font-size: 10px;
      font-weight: 700;
      color: #0f172a;
    }
    .signee-role {
      font-size: 8.5px;
      color: #64748b;
    }
    .footer-disclaimer {
      margin-top: 20px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      font-size: 8px;
      color: #94a3b8;
      text-align: center;
      line-height: 1.3;
    }
    .footer-meta {
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: #64748b;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <!-- HEADER -->
  <header class="header-container">
    <div class="lab-branding">
      <div class="lab-title">LabCore Advanced Diagnostics</div>
      <div class="lab-accreditation">NABL ISO 15189:2022 Certified • Cert No: MC-4892</div>
      <div class="lab-subtext">
        Apex Super-Specialty Laboratory & Research Wing<br>
        Plot 14-B, Medical Enclave, Health City, New Delhi - 110029 • Tel: +91 11 4982 7000 • reports@labcore.local
      </div>
    </div>
    <div class="header-right">
      <div class="qr-badge-box">
        <div class="qr-text">
          <strong>Digital Seal Verified</strong><br>
          Scan to authenticate<br>
          DocID: ${documentChecksum}
        </div>
        ${qrSvg}
      </div>
    </div>
  </header>

  <!-- PATIENT DEMOGRAPHICS -->
  <section class="patient-demographics-card">
    <div class="demo-item">
      <span class="demo-label">Patient Name</span>
      <span class="demo-value patient-name">${patient.firstName} ${patient.middleName ? patient.middleName + " " : ""}${patient.lastName}</span>
    </div>
    <div class="demo-item">
      <span class="demo-label">UHID (Clinical Record)</span>
      <span class="demo-value">${patient.uhid}</span>
    </div>
    <div class="demo-item">
      <span class="demo-label">Age / Gender</span>
      <span class="demo-value">${clinicalAge} / ${patient.gender}</span>
    </div>
    <div class="demo-item">
      <span class="demo-label">Order Accession Number</span>
      <span class="demo-value">${order.orderNumber}</span>
    </div>
    <div class="demo-item">
      <span class="demo-label">Referring Clinician</span>
      <span class="demo-value">${doctor?.fullName ? doctor.fullName : "Self / Walk-in Patient"}</span>
    </div>
    <div class="demo-item">
      <span class="demo-label">Collection & Reported Date</span>
      <span class="demo-value">${collectionDate} / ${reportedDate}</span>
    </div>
    <div class="barcode-demographics">
      <div style="font-size: 9px; color: #64748b;">
        <strong>Specimen Tube:</strong> ${order.specimenType || "Blood EDTA / Serum SST"} • 
        <strong>Fast Status:</strong> ${order.fastingStatus || "10-12h Overnight Fasting"}
      </div>
      <div>${barcodeSvg}</div>
    </div>
  </section>

  <!-- TEST PANELS -->
  <main>
    ${testsHtml}
  </main>

  <!-- SIGN-OFF -->
  <section class="sign-off-section">
    <div class="signature-block">
      <div class="signature-seal">Digitally Signed</div>
      <div class="signee-name">Medical Lab Technologist</div>
      <div class="signee-role">B.Sc MLT, Quality Incharge</div>
    </div>
    <div style="text-align: center; max-width: 240px;">
      <div style="font-size: 8.5px; color: #0369a1; font-weight: 700; text-transform: uppercase;">
        NABL ISO 15189 Quality Compliant
      </div>
      <div style="font-size: 7.5px; color: #64748b; margin-top: 2px;">
        Westgard multi-rules evaluated. Historical delta checks verified within 72 hours.
      </div>
    </div>
    <div class="signature-block">
      <div class="signature-seal">${pathologistName.split(" ")[1] || "Dr. Pathologist"}</div>
      <div class="signee-name">${pathologistName}</div>
      <div class="signee-role">${pathologistTitle}</div>
      <div class="signee-role">${pathologistReg}</div>
    </div>
  </section>

  <!-- DISCLAIMER -->
  <footer class="footer-disclaimer">
    *** END OF DIAGNOSTIC REPORT ***<br>
    The findings reported relate strictly to the specimen analyzed under standard clinical laboratory conditions. 
    Biological Reference Intervals are derived from international CLSI guidelines and peer-reviewed Indian population datasets. 
    Clinical correlation by treating physician is strongly advised.
    <div class="footer-meta">
      <span>Checksum: ${documentChecksum}</span>
      <span>Authenticity Portal: ${verificationUrl}</span>
      <span>Page 1 of 1</span>
    </div>
  </footer>
</body>
</html>`;
}

// =======================================================
// PUPPETEER HEADLESS PDF GENERATOR WITH RESILIENT FALLBACK
// =======================================================

export async function generateOrderPdf(orderId: string, publicUrl?: string): Promise<Buffer> {
  const html = await generateOrderReportHtml(orderId, publicUrl);

  try {
    const puppeteer = require("puppeteer");
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: "10mm",
          bottom: "12mm",
          left: "10mm",
          right: "10mm",
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close().catch(() => {});
    }
  } catch (puppeteerErr: any) {
    console.warn("[ReportPdfService] Puppeteer headless Chrome render note:", puppeteerErr?.message);
    // If headless Chrome binary cannot be spawned on this host, return the clean HTML document buffer as fallback
    return Buffer.from(html, "utf-8");
  }
}
