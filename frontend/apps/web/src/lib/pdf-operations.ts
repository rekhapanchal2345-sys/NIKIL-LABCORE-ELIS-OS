import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generateReportPDF(
  report: any,
  options?: { includeHeader?: boolean; watermark?: string; [key: string]: any }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const patientName =
    report?.order?.patient?.fullName ||
    [report?.order?.patient?.firstName, report?.order?.patient?.lastName].filter(Boolean).join(" ") ||
    report?.patientName ||
    "Clinical Patient";
  const uhid = report?.order?.patient?.uhid || report?.uhid || "UHID-2026-001";
  const orderNumber = report?.order?.orderNumber || report?.orderNumber || "ORD-2026-001";
  const testName = report?.test?.testName || report?.testName || "Diagnostic Laboratory Report";

  page.drawText("LABCORE ELIS - NABL ISO 15189:2022 DIAGNOSTIC REPORT", {
    x: 50,
    y: 780,
    size: 14,
    font: fontBold,
    color: rgb(0.01, 0.52, 0.78),
  });

  page.drawText(`Patient: ${patientName} (${uhid})`, {
    x: 50,
    y: 750,
    size: 11,
    font: fontRegular,
    color: rgb(0.1, 0.15, 0.2),
  });

  page.drawText(`Order Number: ${orderNumber}   |   Investigation: ${testName}`, {
    x: 50,
    y: 730,
    size: 10,
    font: fontRegular,
    color: rgb(0.25, 0.3, 0.35),
  });

  if (options?.watermark) {
    page.drawText(String(options.watermark), {
      x: 50,
      y: 705,
      size: 9,
      font: fontBold,
      color: rgb(0.05, 0.58, 0.53),
    });
  }

  return await pdfDoc.save();
}

export async function mergePDFs(
  pdfBuffers: Uint8Array[],
  _options?: Record<string, any>
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  for (const buf of pdfBuffers) {
    if (!buf || buf.length === 0) continue;
    try {
      const src = await PDFDocument.load(buf);
      const copiedPages = await mergedPdf.copyPages(src, src.getPageIndices());
      copiedPages.forEach((p) => mergedPdf.addPage(p));
    } catch {}
  }
  return await mergedPdf.save();
}

export function downloadPDF(pdfBytes: Uint8Array | Blob, filename = "LabCore-Report.pdf") {
  if (typeof window === "undefined") return;
  const blob =
    pdfBytes instanceof Blob
      ? pdfBytes
      : new Blob([pdfBytes as any], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
