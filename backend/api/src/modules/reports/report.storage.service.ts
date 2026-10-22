import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ReportStatus, Prisma } from '@prisma/client';
import prisma from '../../lib/prisma';
import {
  reportPdfService,
  GeneratePdfOptions,
  GeneratedReportPdfResult,
  generateOrderPdf,
} from './report.pdf.service';

export interface QrTokenPayload {
  reportId: string;
  orderNumber: string;
  patientUhid: string;
  checksumSha256: string;
}

export interface QrTokenVerificationResult {
  valid: boolean;
  reportId: string;
  expectedTokenPrefix?: string;
  reason?: string;
  verifiedAt: string;
  reportSummary?: {
    reportNumber: string;
    orderNumber: string;
    patientName: string;
    patientUhid: string;
    status: ReportStatus;
    generatedAt: Date | null;
    checksumSha256: string;
    totalParameters: number;
    totalPanels: number;
  };
}

export interface PersistReportOptions extends GeneratePdfOptions {
  orderId: string;
  forceRegenerate?: boolean;
  userId?: string;
}

export interface PersistedReportResult {
  reportId: string;
  reportNumber: string;
  orderId: string;
  orderNumber: string;
  patientId: string;
  patientUhid: string;
  status: ReportStatus;
  fileUrl: string;
  relativeDiskPath: string;
  absoluteDiskPath: string;
  fileSizeBytes: number;
  checksumSha256: string;
  fileHashSha256: string;
  qrVerificationToken: string;
  qrVerificationUrl: string;
  totalPanels: number;
  totalParameters: number;
  estimatedPages: number;
  cached: boolean;
  generatedAt: Date;
}

export interface StoredReportStreamMetadata {
  reportId: string;
  reportNumber: string;
  orderId: string;
  orderNumber: string;
  fileName: string;
  absoluteFilePath: string;
  fileSizeBytes: number;
  fileHashSha256: string;
  generatedAt: Date;
  stream: fs.ReadStream;
}

export interface StoredReportDataSnapshot {
  version: string;
  orderId: string;
  orderNumber: string;
  patientId: string;
  patientUhid: string;
  patientName: string;
  demographicStratum: string;
  checksumSha256: string;
  fileHashSha256: string;
  qrVerificationToken: string;
  qrVerificationUrl: string;
  relativeDiskPath: string;
  fileSizeBytes: number;
  totalPanels: number;
  totalParameters: number;
  estimatedPages: number;
  testCodes: string[];
  loincCodes: string[];
  signatoryDoctor: {
    id: string;
    doctorCode: string;
    fullName: string;
    registrationNumber: string | null;
  };
  parameters: Array<{
    testCode: string;
    testName: string;
    department: string;
    parameterName: string;
    loincCode: string;
    value: string;
    unit: string;
    referenceRange: string;
    flag: string;
    rangeIndicator: string;
  }>;
  generatedAtIso: string;
}

export class ReportStorageService {
  private readonly storageRootDir: string;
  private readonly qrHmacSecret: string;
  private readonly baseVerificationUrl: string;

  constructor() {
    this.storageRootDir = path.resolve(process.cwd(), 'storage', 'reports');
    this.qrHmacSecret =
      process.env.REPORT_QR_HMAC_SECRET ||
      process.env.DIGITAL_SIGNATURE_HMAC_SECRET ||
      'NIKIL-LABCORE-ELIS-OS-NABL-ISO15189-QR-SECRET-KEY-2026';
    this.baseVerificationUrl = (
      process.env.PUBLIC_VERIFICATION_BASE_URL ||
      process.env.PUBLIC_WEB_URL ||
      'http://localhost:3001'
    ).replace(/\/+$/, '');
  }

  /**
   * Computes a deterministic, tamper-evident HMAC-SHA256 verification token:
   * HMAC-SHA256(SECRET, reportId || orderNumber || patientUhid || checksumSha256)
   */
  public generateQrVerificationToken(payload: QrTokenPayload): string {
    const canonicalMessage = [
      payload.reportId.trim(),
      payload.orderNumber.trim(),
      payload.patientUhid.trim(),
      payload.checksumSha256.trim().toLowerCase(),
    ].join('||');

    return crypto
      .createHmac('sha256', this.qrHmacSecret)
      .update(canonicalMessage, 'utf8')
      .digest('hex');
  }

  /**
   * Builds the full NABL ISO 15189:2022 public verification URL embedded inside the QR code
   */
  public buildQrVerificationUrl(payload: QrTokenPayload): {
    token: string;
    url: string;
  } {
    const token = this.generateQrVerificationToken(payload);
    const shortChecksum = payload.checksumSha256.trim().toLowerCase().slice(0, 16);
    const url = `${this.baseVerificationUrl}/verify-report/${encodeURIComponent(
      payload.reportId
    )}?token=${token}&checksum=${shortChecksum}`;

    return { token, url };
  }

  /**
   * Performs constant-time cryptographic verification of a QR HMAC-SHA256 token
   */
  public verifyQrTokenCryptographically(
    payload: QrTokenPayload,
    candidateToken: string
  ): boolean {
    if (!candidateToken || typeof candidateToken !== 'string') {
      return false;
    }

    const expectedToken = this.generateQrVerificationToken(payload);
    const expectedBuffer = Buffer.from(expectedToken, 'utf8');
    const candidateBuffer = Buffer.from(candidateToken.trim().toLowerCase(), 'utf8');

    if (expectedBuffer.length !== candidateBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, candidateBuffer);
  }

  /**
   * Validates a report QR token against both the HMAC-SHA256 mathematical signature
   * and the persisted Prisma `Report` record in PostgreSQL.
   */
  public async verifyReportToken(params: {
    reportId: string;
    token: string;
    checksumPrefix?: string;
  }): Promise<QrTokenVerificationResult> {
    const verifiedAt = new Date().toISOString();

    if (!params.reportId || !params.token) {
      return {
        valid: false,
        reportId: params.reportId || 'UNKNOWN',
        reason: 'Missing mandatory reportId or cryptographic HMAC token.',
        verifiedAt,
      };
    }

    const report = await prisma.report.findUnique({
      where: { id: params.reportId },
      include: {
        patient: true,
        order: true,
      },
    });

    if (!report) {
      return {
        valid: false,
        reportId: params.reportId,
        reason: 'Report record not found in NIKIL-LABCORE-ELIS-OS registry.',
        verifiedAt,
      };
    }

    if (report.status === ReportStatus.CANCELLED) {
      return {
        valid: false,
        reportId: report.id,
        reason: 'Report has been cancelled/revoked and is no longer valid.',
        verifiedAt,
      };
    }

    const snapshot = (report.reportData as unknown as StoredReportDataSnapshot | null) || null;
    if (!snapshot || !snapshot.checksumSha256) {
      return {
        valid: false,
        reportId: report.id,
        reason: 'Report cryptographic metadata snapshot is missing or incomplete.',
        verifiedAt,
      };
    }

    if (
      params.checksumPrefix &&
      !snapshot.checksumSha256.toLowerCase().startsWith(params.checksumPrefix.trim().toLowerCase())
    ) {
      return {
        valid: false,
        reportId: report.id,
        reason: 'QR checksum prefix mismatch against sealed clinical digest.',
        verifiedAt,
      };
    }

    const isTokenAuthentic = this.verifyQrTokenCryptographically(
      {
        reportId: report.id,
        orderNumber: report.order.orderNumber,
        patientUhid: report.patient.uhid,
        checksumSha256: snapshot.checksumSha256,
      },
      params.token
    );

    if (!isTokenAuthentic) {
      return {
        valid: false,
        reportId: report.id,
        reason: 'Cryptographic HMAC-SHA256 signature verification failed. Tampering detected.',
        verifiedAt,
      };
    }

    const patientFullName = `${report.patient.firstName} ${report.patient.lastName}`.trim();

    return {
      valid: true,
      reportId: report.id,
      expectedTokenPrefix: snapshot.qrVerificationToken.slice(0, 16),
      verifiedAt,
      reportSummary: {
        reportNumber: report.reportNumber,
        orderNumber: report.order.orderNumber,
        patientName: patientFullName,
        patientUhid: report.patient.uhid,
        status: report.status,
        generatedAt: report.generatedAt,
        checksumSha256: snapshot.checksumSha256,
        totalParameters: snapshot.totalParameters,
        totalPanels: snapshot.totalPanels,
      },
    };
  }

  /**
   * Computes deterministic storage hierarchy path:
   * storage/reports/<YYYY>/<MM>/<orderNumber>-<reportNumber>.pdf
   */
  public resolveStoragePaths(
    orderNumber: string,
    reportNumber: string,
    referenceDate: Date = new Date()
  ): {
    year: string;
    month: string;
    fileName: string;
    directoryPath: string;
    absoluteFilePath: string;
    relativeDiskPath: string;
  } {
    const year = String(referenceDate.getFullYear());
    const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
    const safeOrderNumber = orderNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeReportNumber = reportNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${safeOrderNumber}-${safeReportNumber}.pdf`;

    const directoryPath = path.join(this.storageRootDir, year, month);
    const absoluteFilePath = path.join(directoryPath, fileName);
    const relativeDiskPath = path
      .join('storage', 'reports', year, month, fileName)
      .replace(/\\/g, '/');

    return {
      year,
      month,
      fileName,
      directoryPath,
      absoluteFilePath,
      relativeDiskPath,
    };
  }

  /**
   * Computes SHA-256 hex digest of a Buffer
   */
  public computeBufferSha256(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generates (or retrieves from idempotent disk cache) the NABL ISO 15189:2022 PDF report,
   * writes it to `storage/reports/<YYYY>/<MM>/<orderNumber>-<reportNumber>.pdf`,
   * verifies disk-to-memory SHA-256 parity, and links it to the Prisma `Report` model.
   */
  public async generateAndPersistReport(
    options: PersistReportOptions
  ): Promise<PersistedReportResult> {
    const { orderId, forceRegenerate = false, userId } = options;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        patient: true,
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new Error(`Order with ID "${orderId}" not found.`);
    }

    const reportNumber = `RPT-${order.orderNumber}`;
    const canonicalFileUrl = `/api/reports/order/${order.id}/file`;

    const existingReport =
      order.reports[0] ||
      (await prisma.report.findUnique({
        where: { reportNumber },
      }));

    // 1. Idempotency & Disk Cache Check (when forceRegenerate === false)
    if (
      !forceRegenerate &&
      existingReport &&
      (existingReport.status === ReportStatus.GENERATED ||
        existingReport.status === ReportStatus.PUBLISHED) &&
      existingReport.reportData
    ) {
      const snapshot = existingReport.reportData as unknown as StoredReportDataSnapshot;
      if (snapshot.relativeDiskPath && snapshot.fileHashSha256) {
        const candidateAbsPath = path.resolve(process.cwd(), snapshot.relativeDiskPath);
        if (fs.existsSync(candidateAbsPath)) {
          const diskBuffer = await fs.promises.readFile(candidateAbsPath);
          const diskHeader = diskBuffer.subarray(0, 5).toString('ascii');
          const diskSha256 = this.computeBufferSha256(diskBuffer);

          if (diskHeader === '%PDF-' && diskSha256 === snapshot.fileHashSha256) {
            return {
              reportId: existingReport.id,
              reportNumber: existingReport.reportNumber,
              orderId: order.id,
              orderNumber: order.orderNumber,
              patientId: order.patientId,
              patientUhid: order.patient.uhid,
              status: existingReport.status,
              fileUrl: existingReport.fileUrl || canonicalFileUrl,
              relativeDiskPath: snapshot.relativeDiskPath,
              absoluteDiskPath: candidateAbsPath,
              fileSizeBytes: diskBuffer.byteLength,
              checksumSha256: snapshot.checksumSha256,
              fileHashSha256: diskSha256,
              qrVerificationToken: snapshot.qrVerificationToken,
              qrVerificationUrl: snapshot.qrVerificationUrl,
              totalPanels: snapshot.totalPanels,
              totalParameters: snapshot.totalParameters,
              estimatedPages: snapshot.estimatedPages,
              cached: true,
              generatedAt: existingReport.generatedAt || existingReport.updatedAt,
            };
          }
        }
      }
    }

    // 2. Ensure a Prisma Report record exists in DRAFT state so its UUID
    //    can be bound into the cryptographic QR HMAC-SHA256 token before rendering.
    const draftReport = existingReport
      ? existingReport
      : await prisma.report.create({
          data: {
            reportNumber,
            patientId: order.patientId,
            orderId: order.id,
            status: ReportStatus.DRAFT,
            reportTitle: `NABL ISO 15189:2022 Diagnostic Report — ${order.orderNumber}`,
            fileUrl: canonicalFileUrl,
          },
        });

    // 3. Generate the multi-page PDF with embedded Code 128B vector barcode & HMAC-SHA256 QR code
    const generatedPdf: GeneratedReportPdfResult =
      await reportPdfService.generateOrderReportPdf(order.id, {
        ...options,
        reportIdOverride: draftReport.id,
        reportNumberOverride: reportNumber,
      });

    // 4. Verify in-memory PDF buffer starts with '%PDF-' header
    const memoryHeader = generatedPdf.pdfBuffer.subarray(0, 5).toString('ascii');
    if (memoryHeader !== '%PDF-') {
      throw new Error(
        `Generated PDF buffer failed magic header check (expected "%PDF-", got "${memoryHeader}").`
      );
    }

    const memoryFileHashSha256 = this.computeBufferSha256(generatedPdf.pdfBuffer);

    // 5. Write physical binary PDF to storage/reports/<YYYY>/<MM>/<orderNumber>-<reportNumber>.pdf
    const now = new Date();
    const storagePaths = this.resolveStoragePaths(order.orderNumber, reportNumber, now);

    await fs.promises.mkdir(storagePaths.directoryPath, { recursive: true });
    await fs.promises.writeFile(storagePaths.absoluteFilePath, generatedPdf.pdfBuffer);

    // 6. Read back from disk and assert strict SHA-256 parity against in-memory buffer
    const writtenDiskBuffer = await fs.promises.readFile(storagePaths.absoluteFilePath);
    const writtenDiskHashSha256 = this.computeBufferSha256(writtenDiskBuffer);

    if (writtenDiskHashSha256 !== memoryFileHashSha256) {
      throw new Error(
        `Persistent storage integrity violation: Disk SHA-256 (${writtenDiskHashSha256}) != Memory SHA-256 (${memoryFileHashSha256}).`
      );
    }

    // 7. Build complete reportData JSON snapshot and update Prisma Report record to GENERATED
    const patientFullName = `${order.patient.firstName} ${order.patient.lastName}`.trim();
    const reportDataSnapshot: StoredReportDataSnapshot = {
      version: '4.0.0-NABL-ISO15189-2022',
      orderId: order.id,
      orderNumber: order.orderNumber,
      patientId: order.patientId,
      patientUhid: order.patient.uhid,
      patientName: patientFullName,
      demographicStratum: generatedPdf.demographicStratum,
      checksumSha256: generatedPdf.checksumSha256,
      fileHashSha256: writtenDiskHashSha256,
      qrVerificationToken: generatedPdf.qrVerificationToken,
      qrVerificationUrl: generatedPdf.qrVerificationUrl,
      relativeDiskPath: storagePaths.relativeDiskPath,
      fileSizeBytes: writtenDiskBuffer.byteLength,
      totalPanels: generatedPdf.totalPanels,
      totalParameters: generatedPdf.totalParameters,
      estimatedPages: generatedPdf.estimatedPages,
      testCodes: generatedPdf.testCodes,
      loincCodes: generatedPdf.loincCodes,
      signatoryDoctor: generatedPdf.signatoryDoctor,
      parameters: generatedPdf.parameterSnapshot,
      generatedAtIso: now.toISOString(),
    };

    const updatedReport = await prisma.report.update({
      where: { id: draftReport.id },
      data: {
        reportNumber,
        status: ReportStatus.GENERATED,
        fileUrl: canonicalFileUrl,
        reportTitle: `NABL ISO 15189:2022 Diagnostic Report — ${order.orderNumber}`,
        reportData: reportDataSnapshot as unknown as Prisma.InputJsonValue,
        generatedAt: now,
      },
    });

    // 8. Record tamper-evident AuditLog entry
    await prisma.auditLog.create({
      data: {
        recordId: updatedReport.id,
        module: 'REPORTS',
        action: forceRegenerate ? 'REPORT_PDF_REGENERATED' : 'REPORT_PDF_GENERATED',
        userId: userId || order.createdById || null,
        newData: {
          reportId: updatedReport.id,
          reportNumber: updatedReport.reportNumber,
          orderId: order.id,
          orderNumber: order.orderNumber,
          fileUrl: canonicalFileUrl,
          relativeDiskPath: storagePaths.relativeDiskPath,
          fileSizeBytes: writtenDiskBuffer.byteLength,
          checksumSha256: generatedPdf.checksumSha256,
          fileHashSha256: writtenDiskHashSha256,
          qrVerificationTokenPrefix: generatedPdf.qrVerificationToken.slice(0, 16),
          totalPanels: generatedPdf.totalPanels,
          totalParameters: generatedPdf.totalParameters,
          estimatedPages: generatedPdf.estimatedPages,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      reportId: updatedReport.id,
      reportNumber: updatedReport.reportNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      patientId: order.patientId,
      patientUhid: order.patient.uhid,
      status: updatedReport.status,
      fileUrl: updatedReport.fileUrl || canonicalFileUrl,
      relativeDiskPath: storagePaths.relativeDiskPath,
      absoluteDiskPath: storagePaths.absoluteFilePath,
      fileSizeBytes: writtenDiskBuffer.byteLength,
      checksumSha256: generatedPdf.checksumSha256,
      fileHashSha256: writtenDiskHashSha256,
      qrVerificationToken: generatedPdf.qrVerificationToken,
      qrVerificationUrl: generatedPdf.qrVerificationUrl,
      totalPanels: generatedPdf.totalPanels,
      totalParameters: generatedPdf.totalParameters,
      estimatedPages: generatedPdf.estimatedPages,
      cached: false,
      generatedAt: updatedReport.generatedAt || now,
    };
  }

  /**
   * Streams the persisted physical PDF file from disk for `GET /api/reports/order/:orderId/file`.
   * Automatically generates and persists if the report has not yet been written to disk.
   */
  public async getStoredReportFileStream(
    orderId: string
  ): Promise<StoredReportStreamMetadata> {
    const persisted = await this.generateAndPersistReport({
      orderId,
      forceRegenerate: false,
    });

    const stat = await fs.promises.stat(persisted.absoluteDiskPath);
    const stream = fs.createReadStream(persisted.absoluteDiskPath);

    return {
      reportId: persisted.reportId,
      reportNumber: persisted.reportNumber,
      orderId: persisted.orderId,
      orderNumber: persisted.orderNumber,
      fileName: path.basename(persisted.absoluteDiskPath),
      absoluteFilePath: persisted.absoluteDiskPath,
      fileSizeBytes: stat.size,
      fileHashSha256: persisted.fileHashSha256,
      generatedAt: persisted.generatedAt,
      stream,
    };
  }
}

export const reportStorageService = new ReportStorageService();
export default reportStorageService;
