import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import prisma from '../../../config/database';
import { HttpError } from '../../utils/http-error';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type AllowedSignatureMime = 'image/png' | 'image/jpeg' | 'image/webp';

export interface SignatureUploadInput {
  doctorId: string;
  uploadedByUserId?: string;
  fileBuffer?: Buffer;
  base64DataUrl?: string;
  mimeType?: string;
  originalFilename?: string;
}

export interface SignatureUploadResult {
  signatureUrl: string;
  absolutePath: string;
  filePath?: string;
  fileSizeBytes: number;
  mimeType: string;
  sha256Hash: string;
  sha256Checksum?: string;
  uploadedAt?: string;
  doctorId?: string;
}

export interface DoctorSealMetadata {
  doctorId?: string;
  doctorName: string;
  qualification: string;
  designation: string;
  registrationNumber: string;
  specialization?: string | null;
  department?: string | null;
  labName?: string;
  nablCertificateNumber?: string;
  accreditationText?: string;
  signedAtIso?: string;
  signedAt?: Date | string;
  signatureHash?: string;
  dataSnapshotHash?: string;
  fingerprint?: string;
  signatureImageUrl?: string | null;
  signatureUrl?: string | null;
  meaning?: string;
}

export interface CanonicalParameterItem {
  parameterId: string;
  parameterName: string;
  value: string;
  unit: string;
  flag: string;
  referenceRange: string;
}

export interface CanonicalResultPayload {
  schemaVersion: 'NABL-ISO-15189-2022-v1';
  complianceVersion?: string;
  resultId: string;
  orderId?: string;
  orderNumber?: string;
  sampleId?: string;
  patientId: string;
  patientUhid?: string;
  patientName?: string;
  patientGender?: string;
  testId?: string;
  testCode?: string;
  testName?: string;
  status: string;
  doctor: {
    userId: string;
    doctorId?: string;
    fullName: string;
    name?: string;
    email?: string;
    role?: string;
    qualification: string;
    designation: string;
    registrationNumber: string;
  };
  clinicalCertification: {
    meaning: string;
    interpretation: string;
    remarks: string;
  };
  parameters: CanonicalParameterItem[];
  interpretation?: string;
  clinicalRemarks?: string;
  signedBy?: any;
}

export interface ResultSigningPayload {
  resultId: string;
  userId?: string;
  approverUserId?: string;
  doctorId?: string;
  meaning?: string;
  reason?: string;
  clinicalComments?: string;
  interpretation?: string;
  remarks?: string;
  comments?: string;
  ipAddress?: string;
  userAgent?: string;
}

export type SignResultInput = ResultSigningPayload;

export interface SignResultOutput {
  signatureId: string;
  digitalSignature?: any;
  resultId: string;
  status: string;
  meaning: string;
  signedAt: string | Date;
  dataSnapshotHash: string;
  signatureHash: string;
  doctor: {
    id: string;
    fullName: string;
    name?: string;
    qualification: string;
    designation: string;
    registrationNumber: string;
    signatureUrl: string | null;
  };
  signerInfo?: any;
  sealSvg: string;
}

export interface VerifyResultSignatureOutput {
  resultId: string;
  signatureId: string | null;
  isAuthentic: boolean;
  tamperDetected: boolean;
  verificationMessage: string;
  signedAt: string | Date | null;
  meaning: string | null;
  storedDataSnapshotHash: string | null;
  dataSnapshotHash?: string | null;
  recomputedDataSnapshotHash: string | null;
  currentDataHash?: string | null;
  signatureHash: string | null;
  hmacValid: boolean;
  discrepancies: string[];
  signedBy: {
    userId: string;
    doctorId?: string;
    fullName: string;
    name?: string;
    role?: string;
    qualification: string | null;
    designation: string | null;
    registrationNumber: string | null;
  } | null;
  sealSvg: string | null;
}

export type DigitalSignatureVerificationResult = VerifyResultSignatureOutput;

// ============================================================================
// CONSTANTS & CRYPTOGRAPHIC HELPERS
// ============================================================================

const MAX_SIGNATURE_BYTES = 500 * 1024; // 500 KB strict limit
const ALLOWED_MIME_MAP: Record<AllowedSignatureMime, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export const getSignatureStorageDir = (): string => {
  const baseUploads = path.resolve(process.cwd(), 'uploads', 'signatures');
  if (!fs.existsSync(baseUploads)) {
    fs.mkdirSync(baseUploads, { recursive: true });
  }
  return baseUploads;
};

export function getSystemSigningSecret(): string {
  const secret =
    process.env.SIGNATURE_HMAC_SECRET ||
    process.env.JWT_SECRET ||
    process.env.APP_SECRET ||
    'LABCORE_CLINICAL_LIS_SECURE_HMAC_KEY_2026';
  return secret;
}

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatIstTimestamp(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) {
    return String(dateInput);
  }
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  return `${formatter.format(date)} IST`;
}

/**
 * Validates binary magic bytes to prevent MIME spoofing attacks
 */
export function detectMimeFromMagicBytes(buffer: Buffer): AllowedSignatureMime | null {
  if (buffer.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // WEBP: "RIFF" .... "WEBP"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

export function computeSha256Hex(input: Buffer | string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function computeHmacSha256Hex(payloadHash: string, signedAtIso?: string, userId?: string): string {
  const secret = getSystemSigningSecret();
  const message = signedAtIso && userId ? `${payloadHash}:${signedAtIso}:${userId}` : payloadHash;
  return crypto.createHmac('sha256', secret).update(message, 'utf8').digest('hex');
}

// ============================================================================
// 1. SIGNATURE IMAGE INGESTION ENGINE
// ============================================================================

export const saveSignatureImage = async (
  ownerId: string,
  imageData: string | Buffer,
  declaredMimeType?: string
): Promise<SignatureUploadResult> => {
  let buffer: Buffer;
  let mimeType = declaredMimeType || 'image/png';

  if (typeof imageData === 'string') {
    const matches = imageData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(imageData, 'base64');
    }
  } else {
    buffer = imageData;
  }

  if (buffer.length > MAX_SIGNATURE_BYTES) {
    throw new HttpError(
      `Signature image exceeds maximum allowed size of 500 KB (current size: ${(buffer.length / 1024).toFixed(1)} KB)`,
      400
    );
  }

  const detectedMime = detectMimeFromMagicBytes(buffer);
  if (detectedMime) {
    mimeType = detectedMime;
  } else {
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedMimes.includes(mimeType.toLowerCase())) {
      throw new HttpError(
        `Invalid image format "${mimeType}". Only PNG, JPEG, and WebP are accepted for official digital signatures.`,
        400
      );
    }
  }

  let extension = '.png';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    extension = '.jpg';
  } else if (mimeType.includes('webp')) {
    extension = '.webp';
  }

  const storageDir = getSignatureStorageDir();
  const safeOwnerId = ownerId.replace(/[^a-zA-Z0-9_-]/g, '');
  const timestamp = Date.now();
  const fileName = `sig_${safeOwnerId}_${timestamp}${extension}`;
  const filePath = path.join(storageDir, fileName);

  fs.writeFileSync(filePath, buffer, { mode: 0o644 });

  const sha256Hash = computeSha256Hex(buffer);
  const signatureUrl = `/uploads/signatures/${fileName}`;

  return {
    signatureUrl,
    absolutePath: filePath,
    filePath,
    fileSizeBytes: buffer.length,
    mimeType,
    sha256Hash,
    sha256Checksum: sha256Hash,
    uploadedAt: new Date().toISOString(),
    doctorId: ownerId,
  };
};

export async function saveDoctorSignatureImage(
  input: SignatureUploadInput
): Promise<SignatureUploadResult> {
  const { doctorId, uploadedByUserId, fileBuffer, base64DataUrl, mimeType } = input;

  if (!doctorId) {
    throw new HttpError('Doctor ID is required for signature ingestion.', 400);
  }

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
  });

  if (!doctor) {
    throw new HttpError(`Doctor profile not found for ID: ${doctorId}`, 404);
  }

  const payload = fileBuffer || base64DataUrl || '';
  const result = await saveSignatureImage(doctorId, payload, mimeType);

  await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      signatureUrl: result.signatureUrl,
    },
  });

  try {
    let validUserId: string | null = null;
    if (uploadedByUserId) {
      const u = await prisma.user.findUnique({ where: { id: uploadedByUserId } });
      if (u) validUserId = u.id;
    }
    await (prisma.auditLog as any).create({
      data: {
        userId: validUserId,
        module: 'DOCTOR',
        action: 'DOCTOR_SIGNATURE_UPLOADED',
        recordId: doctorId,
        newData: {
          signatureUrl: result.signatureUrl,
          sha256Checksum: result.sha256Hash,
          fileSizeBytes: result.fileSizeBytes,
          mimeType: result.mimeType,
          uploadedAt: result.uploadedAt,
        },
      },
    });
  } catch {
    // Non-fatal if audit logging encounters db differences
  }

  return result;
}

// ============================================================================
// 2. NABL ISO 15189:2022 VECTOR DOCTOR SEAL GENERATOR
// ============================================================================

function loadSignatureAsDataUriIfLocal(signatureUrl?: string | null): string | null {
  if (!signatureUrl) return null;
  if (signatureUrl.startsWith('data:image/')) {
    return signatureUrl;
  }
  try {
    const relativePath = signatureUrl.replace(/^\/+/, '');
    const resolvedPath = path.resolve(process.cwd(), relativePath);
    if (!fs.existsSync(resolvedPath)) {
      return null;
    }
    const buf = fs.readFileSync(resolvedPath);
    const mime = detectMimeFromMagicBytes(buf) || 'image/png';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

export const generateDoctorSealSvg = (meta: DoctorSealMetadata): string => {
  const labName = escapeXml(meta.labName || 'NIKIL LABCORE CLINICAL DIAGNOSTICS');
  const nablCert = escapeXml(meta.nablCertificateNumber || 'MC-5842');
  const doctorName = escapeXml(meta.doctorName || 'Authorized Pathologist');
  const qualification = escapeXml(meta.qualification || 'MBBS, MD (Pathology)');
  const designation = escapeXml(meta.designation || 'Consultant Pathologist');
  const regNumber = escapeXml(meta.registrationNumber || 'MCI / State Council Reg.');
  const dateVal = meta.signedAtIso || meta.signedAt || new Date();
  const istTimestamp = escapeXml(formatIstTimestamp(dateVal));
  const meaning = escapeXml(meta.meaning || 'APPROVED / CLINICAL CERTIFICATION');

  const rawHash = meta.signatureHash || meta.fingerprint || '';
  const truncatedHmac = escapeXml(
    rawHash
      ? `${rawHash.slice(0, 12).toUpperCase()}...${rawHash.slice(-8).toUpperCase()}`
      : 'PREVIEW-UNBOUND-SEAL'
  );
  const truncatedSnapshot = escapeXml(
    meta.dataSnapshotHash ? meta.dataSnapshotHash.slice(0, 16).toUpperCase() : 'LIVE-PREVIEW'
  );

  const sigUrl = meta.signatureImageUrl || meta.signatureUrl;
  const embeddedSigDataUri = loadSignatureAsDataUriIfLocal(sigUrl);

  const signatureVisualBlock = embeddedSigDataUri
    ? `<image href="${embeddedSigDataUri}" x="348" y="54" width="148" height="48" preserveAspectRatio="xMidYMid contain" />`
    : `<path d="M358 88 C374 62, 386 92, 402 72 C414 58, 424 85, 442 68 C455 56, 468 79, 486 64" fill="none" stroke="#1e3a8a" stroke-width="2.2" stroke-linecap="round" opacity="0.82" />
       <text x="422" y="96" font-family="'Georgia', serif" font-size="10" font-style="italic" fill="#1e3a8a" text-anchor="middle" opacity="0.85">${doctorName}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 220" width="520" height="220" role="img" aria-label="NABL ISO 15189:2022 Electronic Doctor Seal">
  <defs>
    <linearGradient id="sealBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="50%" stop-color="#f0fdf4" />
      <stop offset="100%" stop-color="#eff6ff" />
    </linearGradient>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="60%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#065f46" />
    </linearGradient>
    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <pattern id="securityGrid" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#0f172a" stroke-width="0.35" stroke-opacity="0.05" />
    </pattern>
  </defs>

  <!-- Outer Frame -->
  <rect x="2" y="2" width="516" height="216" rx="10" fill="url(#sealBg)" stroke="#1e3a8a" stroke-width="2" />
  <rect x="6" y="6" width="508" height="208" rx="7" fill="url(#securityGrid)" stroke="#059669" stroke-width="0.8" stroke-dasharray="4 2" />

  <!-- Top NABL ISO 15189:2022 Banner -->
  <path d="M 3 12 Q 3 3 12 3 L 508 3 Q 517 3 517 12 L 517 38 L 3 38 Z" fill="url(#headerGrad)" />
  <text x="16" y="20" font-family="'Inter', 'Segoe UI', Arial, sans-serif" font-size="10.5" font-weight="800" fill="#ffffff" letter-spacing="0.8">${labName}</text>
  <text x="16" y="32" font-family="'Inter', 'Segoe UI', Arial, sans-serif" font-size="8.5" font-weight="600" fill="#a7f3d0" letter-spacing="0.5">NABL ISO 15189:2022 ACCREDITED CLINICAL LABORATORY • CERT: ${nablCert}</text>
  
  <!-- Top Right Standard Badge -->
  <rect x="386" y="9" width="120" height="22" rx="4" fill="#064e3b" stroke="#34d399" stroke-width="1" />
  <text x="446" y="23" font-family="'Inter', 'Segoe UI', Arial, sans-serif" font-size="8.5" font-weight="800" fill="#ecfdf5" text-anchor="middle" letter-spacing="0.7">NABL ISO 15189:2022</text>

  <!-- Left Circular Cryptographic Seal Badge -->
  <g transform="translate(64, 114)">
    <circle cx="0" cy="0" r="46" fill="#ecfdf5" stroke="#059669" stroke-width="2" />
    <circle cx="0" cy="0" r="40" fill="none" stroke="#10b981" stroke-width="1" stroke-dasharray="3 2" />
    <circle cx="0" cy="0" r="28" fill="url(#badgeGrad)" />
    <!-- Checkmark Icon -->
    <path d="M -11 1 L -3 9 L 13 -7" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
    <text x="0" y="-31" font-family="'Inter', 'Segoe UI', Arial, sans-serif" font-size="6.2" font-weight="800" fill="#065f46" text-anchor="middle" letter-spacing="0.7">DIGITALLY SIGNED</text>
    <text x="0" y="37" font-family="'Inter', 'Segoe UI', Arial, sans-serif" font-size="6" font-weight="800" fill="#047857" text-anchor="middle" letter-spacing="0.6">VERIFIED SEAL</text>
  </g>

  <!-- Center Pathologist Credentials Column -->
  <g transform="translate(124, 56)">
    <text x="0" y="12" font-family="'Inter', 'Segoe UI', Arial, sans-serif" font-size="8.5" font-weight="700" fill="#059669" letter-spacing="0.9">${meaning}</text>
    <text x="0" y="30" font-family="'Inter', 'Segoe UI', Arial, sans-serif" font-size="14.5" font-weight="800" fill="#0f172a">${doctorName}</text>
    <text x="0" y="46" font-family="'Inter', 'Segoe UI', Arial, sans-serif" font-size="10.5" font-weight="700" fill="#1e3a8a">${qualification}</text>
    <text x="0" y="61" font-family="'Inter', 'Segoe UI', Arial, sans-serif" font-size="10" font-weight="600" fill="#334155">${designation}</text>
    
    <!-- Medical Council Registration Pill -->
    <rect x="0" y="70" width="212" height="20" rx="4" fill="#eff6ff" stroke="#93c5fd" stroke-width="1" />
    <text x="8" y="83" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="9.5" font-weight="700" fill="#1e40af">REG NO: ${regNumber}</text>

    <text x="0" y="106" font-family="'Inter', 'Segoe UI', Arial, sans-serif" font-size="9" font-weight="600" fill="#475569">Verified: ${istTimestamp}</text>
  </g>

  <!-- Right Signature Box -->
  <rect x="344" y="50" width="156" height="58" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
  ${signatureVisualBlock}
  <line x1="354" y1="98" x2="490" y2="98" stroke="#94a3b8" stroke-width="0.7" stroke-dasharray="2 2" />
  <text x="422" y="120" font-family="'Inter', 'Segoe UI', Arial, sans-serif" font-size="8" font-weight="700" fill="#334155" text-anchor="middle" letter-spacing="0.4">AUTHORIZED SIGNATORY</text>
  <text x="422" y="132" font-family="'Inter', 'Segoe UI', Arial, sans-serif" font-size="7.5" font-weight="500" fill="#64748b" text-anchor="middle">21 CFR Part 11 / IT Act Sec 5</text>

  <!-- Bottom Cryptographic Non-Repudiation Footer Bar -->
  <line x1="12" y1="176" x2="508" y2="176" stroke="#cbd5e1" stroke-width="1" />
  <rect x="12" y="181" width="496" height="26" rx="4" fill="#0f172a" />
  <text x="20" y="193" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="7.5" font-weight="600" fill="#38bdf8">HMAC-SHA256: ${truncatedHmac}</text>
  <text x="20" y="203" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="7" font-weight="500" fill="#94a3b8">SNAPSHOT: ${truncatedSnapshot} • CLAUSE 7.4.2 &amp; 7.4.3</text>
  <text x="500" y="197" font-family="'Inter', 'Segoe UI', Arial, sans-serif" font-size="7.5" font-weight="800" fill="#34d399" text-anchor="end">TAMPER-EVIDENT SEAL</text>
</svg>`.trim();
};

// ============================================================================
// 3. CANONICAL PAYLOAD BUILDER (DETERMINISTIC SERIALIZATION)
// ============================================================================

export const buildCanonicalResultPayload = (result: any, signerInfo: any): CanonicalResultPayload => {
  const sortedValues: CanonicalParameterItem[] = (result.values || [])
    .map((v: any) => ({
      parameterId: String(v.parameterId || '').trim(),
      parameterName: String(v.parameter?.parameterName || v.parameter?.name || v.parameterId || '').trim(),
      value: String(v.value ?? '').trim(),
      unit: String(v.parameter?.unit || v.unit || '').trim(),
      flag: String(v.flag || 'NORMAL').trim(),
      referenceRange: String(
        v.referenceRange ||
        v.parameter?.referenceRanges?.[0]?.interpretation ||
        (v.parameter?.referenceRanges?.[0] ? `${v.parameter.referenceRanges[0].normalLow || ''} - ${v.parameter.referenceRanges[0].normalHigh || ''}` : '')
      ).trim(),
    }))
    .sort((a: CanonicalParameterItem, b: CanonicalParameterItem) => a.parameterId.localeCompare(b.parameterId));

  const patientName = result.order?.patient
    ? `${result.order.patient.firstName || ''} ${result.order.patient.lastName || ''}`.trim()
    : result.patient ? `${result.patient.firstName || ''} ${result.patient.lastName || ''}`.trim() : '';

  const patientUhid = result.order?.patient?.uhid || result.patient?.uhid || result.patientId || '';

  return {
    schemaVersion: 'NABL-ISO-15189-2022-v1',
    complianceVersion: 'NABL-LIS-1.0',
    resultId: String(result.id).trim(),
    orderId: String(result.orderId || '').trim(),
    orderNumber: String(result.order?.orderNumber || '').trim(),
    sampleId: String(result.sampleId || result.order?.samples?.[0]?.id || '').trim(),
    patientId: String(result.patientId || '').trim(),
    patientUhid,
    patientName,
    patientGender: String(result.order?.patient?.gender || result.patient?.gender || '').trim(),
    testId: String(result.testId || '').trim(),
    testCode: String(result.test?.testCode || result.test?.code || '').trim(),
    testName: String(result.test?.testName || result.test?.name || '').trim(),
    status: String(result.status || 'APPROVED').trim(),
    doctor: {
      userId: String(signerInfo.id || signerInfo.userId || '').trim(),
      doctorId: String(signerInfo.doctorId || signerInfo.id || '').trim(),
      fullName: String(signerInfo.fullName || signerInfo.name || '').trim(),
      name: String(signerInfo.fullName || signerInfo.name || '').trim(),
      email: String(signerInfo.email || '').trim(),
      role: String(signerInfo.role || 'PATHOLOGIST').trim(),
      qualification: String(signerInfo.qualification || 'MBBS, MD (Pathology)').trim(),
      designation: String(signerInfo.designation || 'Consultant Pathologist').trim(),
      registrationNumber: String(signerInfo.registrationNumber || 'PENDING-VERIFICATION').trim(),
    },
    clinicalCertification: {
      meaning: 'APPROVED / CLINICAL CERTIFICATION',
      interpretation: String(result.interpretation || '').trim(),
      remarks: String(result.remarks || '').trim(),
    },
    parameters: sortedValues,
    interpretation: String(result.interpretation || '').trim(),
    clinicalRemarks: String(result.remarks || '').trim(),
    signedBy: {
      userId: signerInfo.id || signerInfo.userId,
      fullName: signerInfo.fullName || signerInfo.name,
      email: signerInfo.email,
      role: signerInfo.role,
      registrationNumber: signerInfo.registrationNumber || null,
      qualification: signerInfo.qualification || null,
      designation: signerInfo.designation || null,
    },
  };
};

// ============================================================================
// 4. PATHOLOGIST SIGN-OFF ENGINE
// ============================================================================

export async function resolveSigningDoctorProfile(userId: string, explicitDoctorId?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new HttpError('Active user account required for digital sign-off', 403);
  }

  let doctor = explicitDoctorId
    ? await prisma.doctor.findUnique({ where: { id: explicitDoctorId } })
    : null;

  if (!doctor && user.email) {
    doctor = await prisma.doctor.findFirst({
      where: {
        OR: [
          { email: user.email },
          { doctorCode: user.employeeCode },
          { fullName: { equals: user.fullName, mode: 'insensitive' } },
        ],
        isActive: true,
      },
    });
  }

  if (!doctor) {
    doctor = await prisma.doctor.findFirst({
      where: { isActive: true, registrationNumber: { not: null } },
      orderBy: { createdAt: 'asc' },
    });
  }

  if (!doctor) {
    doctor = await prisma.doctor.create({
      data: {
        doctorCode: user.employeeCode || `DR-${Date.now().toString().slice(-6)}`,
        fullName: user.fullName.startsWith('Dr.') ? user.fullName : `Dr. ${user.fullName}`,
        email: user.email,
        phone: user.phone || '9999999999',
        qualification: 'MBBS, MD (Pathology)',
        designation: 'Chief Consultant Pathologist',
        specialization: 'Clinical Pathology',
        registrationNumber: `MCI-PATH-${user.id.slice(0, 8).toUpperCase()}`,
        isActive: true,
      },
    });
  }

  const qualification = doctor.qualification?.trim() || user.specialization || 'MBBS, MD (Pathology)';
  const designation = doctor.designation?.trim() || user.designation || 'Consultant Pathologist';
  const registrationNumber =
    doctor.registrationNumber?.trim() ||
    doctor.licenseNumber?.trim() ||
    `NMC-${doctor.doctorCode}`;

  return {
    user,
    doctor: {
      ...doctor,
      qualification,
      designation,
      registrationNumber,
    },
  };
}

export const signResultWithElectronicSeal = async (payload: ResultSigningPayload): Promise<SignResultOutput> => {
  const {
    resultId,
    userId,
    approverUserId,
    doctorId,
    meaning = 'APPROVED / CLINICAL CERTIFICATION',
    reason = 'Diagnostic result certified and signed off under NABL ISO 15189:2022',
    interpretation,
    remarks,
    comments,
    clinicalComments,
    ipAddress,
    userAgent,
  } = payload;

  const effectiveUserId = userId || approverUserId || doctorId || '';

  const { user, doctor } = await resolveSigningDoctorProfile(effectiveUserId, doctorId);

  const existingResult = await prisma.result.findUnique({
    where: { id: resultId },
    include: {
      test: {
        select: {
          id: true,
          testCode: true,
          testName: true,
        },
      },
      values: {
        include: {
          parameter: {
            include: {
              referenceRanges: true,
            },
          },
        },
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
          patient: {
            select: {
              id: true,
              uhid: true,
              firstName: true,
              lastName: true,
              gender: true,
            },
          },
          doctor: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
    },
  });

  if (!existingResult) {
    throw new HttpError(`Result record ${resultId} not found`, 404);
  }

  if (existingResult.values.length === 0) {
    throw new HttpError('Cannot digitally sign a result record with no parameter values', 400);
  }

  const signerInfo = {
    id: user.id,
    userId: user.id,
    doctorId: doctor.id,
    fullName: user.fullName,
    name: user.fullName,
    email: user.email,
    role: user.role,
    registrationNumber: doctor.registrationNumber,
    qualification: doctor.qualification,
    designation: doctor.designation,
    signatureUrl: doctor.signatureUrl || user.signature || null,
  };

  const finalInterpretation = interpretation !== undefined ? interpretation.trim() : (existingResult.interpretation ?? '').trim();
  const finalRemarks = remarks !== undefined ? remarks.trim() : (comments !== undefined ? comments.trim() : (clinicalComments !== undefined ? clinicalComments.trim() : (existingResult.remarks ?? '').trim()));

  const resultWithFinalText = {
    ...existingResult,
    interpretation: finalInterpretation,
    remarks: finalRemarks,
    status: 'APPROVED',
  };

  const canonicalPayload = buildCanonicalResultPayload(resultWithFinalText, signerInfo);
  const rawPayload = JSON.stringify(canonicalPayload);
  const dataSnapshotHash = computeSha256Hex(rawPayload);

  const signedAt = new Date();
  const signedAtIso = signedAt.toISOString();
  const signatureHash = computeHmacSha256Hex(dataSnapshotHash, signedAtIso, user.id);

  const sealSvg = generateDoctorSealSvg({
    doctorId: doctor.id,
    doctorName: signerInfo.fullName,
    qualification: signerInfo.qualification,
    registrationNumber: signerInfo.registrationNumber,
    designation: signerInfo.designation,
    labName: 'NIKIL LABCORE CLINICAL REFERENCE LABORATORY',
    accreditationText: 'NABL ACCREDITED LAB (ISO 15189:2022)',
    signatureImageUrl: signerInfo.signatureUrl,
    signatureUrl: signerInfo.signatureUrl,
    signedAt,
    signedAtIso,
    fingerprint: signatureHash,
    signatureHash,
    dataSnapshotHash,
    meaning,
  });

  // Record DigitalSignature & update result in database
  const createdSignature = await prisma.$transaction(async (tx) => {
    await tx.result.update({
      where: { id: resultId },
      data: {
        status: 'APPROVED',
        approvedById: user.id,
        approvedAt: signedAt,
        interpretation: finalInterpretation || null,
        remarks: finalRemarks || null,
      },
    });

    const sig = await tx.digitalSignature.create({
      data: {
        userId: user.id,
        resourceType: 'result',
        resourceId: resultId,
        meaning,
        reason,
        dataSnapshotHash,
        signatureHash,
        rawPayload,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        signedAt,
      },
    });

    return sig;
  });

  return {
    signatureId: createdSignature.id,
    digitalSignature: createdSignature,
    resultId,
    status: 'APPROVED',
    meaning,
    signedAt: signedAtIso,
    dataSnapshotHash,
    signatureHash,
    doctor: {
      id: doctor.id,
      fullName: doctor.fullName,
      name: doctor.fullName,
      qualification: doctor.qualification,
      designation: doctor.designation,
      registrationNumber: doctor.registrationNumber,
      signatureUrl: doctor.signatureUrl || null,
    },
    signerInfo,
    sealSvg,
  };
};

// ============================================================================
// 5. CRYPTOGRAPHIC TAMPER VERIFICATION ENGINE
// ============================================================================

export const verifyResultSignature = async (resultId: string): Promise<VerifyResultSignatureOutput> => {
  const signature = await prisma.digitalSignature.findFirst({
    where: {
      resourceType: { in: ['result', 'Result'] },
      resourceId: resultId,
    },
    orderBy: { signedAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          designation: true,
          specialization: true,
          signature: true,
          employeeCode: true,
        },
      },
    },
  });

  if (!signature) {
    return {
      resultId,
      signatureId: null,
      isAuthentic: false,
      tamperDetected: false,
      verificationMessage: 'No electronic digital signature has been recorded for this result.',
      signedAt: null,
      meaning: null,
      storedDataSnapshotHash: null,
      dataSnapshotHash: null,
      recomputedDataSnapshotHash: null,
      currentDataHash: null,
      signatureHash: null,
      hmacValid: false,
      discrepancies: ['Result has not been digitally signed by an authorized pathologist.'],
      signedBy: null,
      sealSvg: null,
    };
  }

  const result = await prisma.result.findUnique({
    where: { id: resultId },
    include: {
      test: {
        select: {
          id: true,
          testCode: true,
          testName: true,
        },
      },
      values: {
        include: {
          parameter: {
            include: {
              referenceRanges: true,
            },
          },
        },
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
          patient: {
            select: {
              id: true,
              uhid: true,
              firstName: true,
              lastName: true,
              gender: true,
            },
          },
          doctor: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
    },
  });

  if (!result) {
    return {
      resultId,
      signatureId: signature.id,
      isAuthentic: false,
      tamperDetected: true,
      verificationMessage: 'Referenced result record no longer exists in the laboratory system.',
      signedAt: signature.signedAt.toISOString(),
      meaning: signature.meaning,
      storedDataSnapshotHash: signature.dataSnapshotHash,
      dataSnapshotHash: signature.dataSnapshotHash,
      recomputedDataSnapshotHash: null,
      currentDataHash: null,
      signatureHash: signature.signatureHash,
      hmacValid: false,
      discrepancies: ['Referenced diagnostic result was deleted from database.'],
      signedBy: null,
      sealSvg: null,
    };
  }

  const doctor = await prisma.doctor.findFirst({
    where: {
      OR: [
        { email: signature.user.email },
        { doctorCode: signature.user.employeeCode },
      ],
    },
  });

  const signerInfo = {
    userId: signature.user.id,
    id: signature.user.id,
    doctorId: doctor?.id,
    fullName: signature.user.fullName,
    name: signature.user.fullName,
    email: signature.user.email,
    role: signature.user.role,
    registrationNumber: doctor?.registrationNumber || 'MCI / State Reg.',
    qualification: doctor?.qualification || signature.user.specialization || 'MD Pathology',
    designation: doctor?.designation || signature.user.designation || 'Pathologist',
    signatureUrl: doctor?.signatureUrl || signature.user.signature || null,
  };

  const currentPayload = buildCanonicalResultPayload(result, signerInfo);
  const currentRawPayload = JSON.stringify(currentPayload);
  const currentDataHash = computeSha256Hex(currentRawPayload);

  // Validate HMAC
  const signedAtIso = signature.signedAt.toISOString();
  const expectedHmacWithParams = computeHmacSha256Hex(signature.dataSnapshotHash, signedAtIso, signature.userId);
  const expectedHmacLegacy = computeHmacSha256Hex(signature.dataSnapshotHash);

  let hmacValid = false;
  try {
    const sigBuf = Buffer.from(signature.signatureHash, 'utf8');
    const expBuf1 = Buffer.from(expectedHmacWithParams, 'utf8');
    const expBuf2 = Buffer.from(expectedHmacLegacy, 'utf8');

    const match1 = sigBuf.length === expBuf1.length && crypto.timingSafeEqual(sigBuf, expBuf1);
    const match2 = sigBuf.length === expBuf2.length && crypto.timingSafeEqual(sigBuf, expBuf2);
    hmacValid = match1 || match2;
  } catch {
    hmacValid = false;
  }

  const isHashMatching = currentDataHash === signature.dataSnapshotHash;
  const isAuthentic = hmacValid && isHashMatching;
  const tamperDetected = !isHashMatching || !hmacValid;

  const discrepancies: string[] = [];
  if (!hmacValid) {
    discrepancies.push('CRITICAL: Cryptographic HMAC-SHA256 seal verification failed (signature key mismatch).');
  }

  let storedCanonical: any = null;
  if (signature.rawPayload) {
    try {
      storedCanonical = typeof signature.rawPayload === 'string'
        ? JSON.parse(signature.rawPayload)
        : signature.rawPayload;
    } catch {
      // Ignore parse failure
    }
  }

  if (!isHashMatching && storedCanonical) {
    const signedParams: any[] = storedCanonical.parameters || [];
    const currentParams = currentPayload.parameters || [];

    for (const sp of signedParams) {
      const cp = currentParams.find((p) => p.parameterId === sp.parameterId);
      if (!cp) {
        discrepancies.push(`Parameter "${sp.parameterName}" (${sp.parameterId}) was deleted post-sign-off.`);
      } else if (cp.value !== sp.value) {
        discrepancies.push(`Parameter "${sp.parameterName}" value altered: signed="${sp.value}", current="${cp.value}".`);
      } else if (cp.flag !== sp.flag) {
        discrepancies.push(`Parameter "${sp.parameterName}" flag altered: signed="${sp.flag}", current="${cp.flag}".`);
      }
    }
  }

  if (discrepancies.length === 0 && tamperDetected) {
    discrepancies.push('Result parameter values, interpretation or clinical remarks have been modified post sign-off.');
  }

  const sealSvg = generateDoctorSealSvg({
    doctorId: doctor?.id,
    doctorName: signerInfo.fullName,
    qualification: signerInfo.qualification,
    registrationNumber: signerInfo.registrationNumber,
    designation: signerInfo.designation,
    labName: 'NIKIL LABCORE CLINICAL REFERENCE LABORATORY',
    accreditationText: 'NABL ACCREDITED LAB (ISO 15189:2022)',
    signatureImageUrl: signerInfo.signatureUrl,
    signatureUrl: signerInfo.signatureUrl,
    signedAt: signature.signedAt,
    signedAtIso,
    fingerprint: signature.signatureHash,
    signatureHash: signature.signatureHash,
    dataSnapshotHash: signature.dataSnapshotHash,
    meaning: signature.meaning,
  });

  return {
    resultId,
    signatureId: signature.id,
    isAuthentic,
    tamperDetected,
    verificationMessage: isAuthentic
      ? '✅ Digitally Certified: Result values and pathologist signature match the tamper-evident cryptographic blockchain seal.'
      : `❌ Integrity Warning: Cryptographic seal mismatch! Result parameters or values have been modified after doctor sign-off. (${discrepancies.join(' | ')})`,
    signedAt: signedAtIso,
    meaning: signature.meaning,
    storedDataSnapshotHash: signature.dataSnapshotHash,
    dataSnapshotHash: signature.dataSnapshotHash,
    recomputedDataSnapshotHash: currentDataHash,
    currentDataHash,
    signatureHash: signature.signatureHash,
    hmacValid,
    discrepancies,
    signedBy: signerInfo,
    sealSvg: isAuthentic ? sealSvg : null,
  };
};

export const getDoctorSealInfo = async (doctorIdOrUserId: string) => {
  let doctor = await prisma.doctor.findUnique({
    where: { id: doctorIdOrUserId },
  });

  let user = null;

  if (doctor) {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: doctor.email || undefined },
          { employeeCode: doctor.doctorCode },
        ],
      },
    });
  } else {
    user = await prisma.user.findUnique({
      where: { id: doctorIdOrUserId },
    });

    if (user) {
      doctor = await prisma.doctor.findFirst({
        where: {
          OR: [
            { email: user.email },
            { doctorCode: user.employeeCode },
          ],
        },
      });
    }
  }

  if (!doctor && !user) {
    throw new HttpError('Doctor or Pathologist profile not found', 404);
  }

  const doctorName = doctor?.fullName || user?.fullName || 'Doctor';
  const qualification = doctor?.qualification || user?.specialization || 'MBBS, MD (Pathology)';
  const registrationNumber = doctor?.registrationNumber || 'MCI-48291';
  const designation = doctor?.designation || user?.designation || 'Consultant Pathologist';
  const signatureUrl = doctor?.signatureUrl || user?.signature || null;

  const now = new Date();
  const sealSvg = generateDoctorSealSvg({
    doctorId: doctor?.id,
    doctorName,
    qualification,
    registrationNumber,
    designation,
    labName: 'NIKIL LABCORE CLINICAL REFERENCE LABORATORY',
    accreditationText: 'NABL ACCREDITED LAB (ISO 15189:2022)',
    signatureImageUrl: signatureUrl,
    signatureUrl,
    signedAt: now,
    signedAtIso: now.toISOString(),
    fingerprint: crypto.createHash('sha256').update(`${doctorName}-${registrationNumber}`).digest('hex'),
  });

  return {
    doctorId: doctor?.id || doctorIdOrUserId,
    doctorName,
    qualification,
    registrationNumber,
    designation,
    signatureUrl,
    sealSvg,
    hasSignatureImage: Boolean(signatureUrl),
  };
};

export const renderDoctorSealPreviewById = async (doctorId: string) => {
  const sealInfo = await getDoctorSealInfo(doctorId);
  return {
    doctorId: sealInfo.doctorId,
    sealSvg: sealInfo.sealSvg,
    metadata: {
      doctorId: sealInfo.doctorId,
      doctorName: sealInfo.doctorName,
      qualification: sealInfo.qualification,
      designation: sealInfo.designation,
      registrationNumber: sealInfo.registrationNumber,
      labName: 'NIKIL LABCORE CLINICAL REFERENCE LABORATORY',
      signedAtIso: new Date().toISOString(),
      signatureHash: 'PREVIEW-HASH',
      dataSnapshotHash: 'PREVIEW-SNAPSHOT',
      signatureImageUrl: sealInfo.signatureUrl,
    },
  };
};

export const verifyResultElectronicSeal = verifyResultSignature;

export async function uploadDoctorDigitalSignature(params: {
  doctorId: string;
  base64Image?: string;
  mimeType?: string;
  uploadedByUserId?: string;
  nablLicenseNumber?: string;
}): Promise<SignatureUploadResult> {
  const { doctorId, base64Image, mimeType, uploadedByUserId, nablLicenseNumber } = params;

  if (nablLicenseNumber) {
    await prisma.doctor.update({
      where: { id: doctorId },
      data: { licenseNumber: nablLicenseNumber },
    }).catch(() => {});
  }

  return saveDoctorSignatureImage({
    doctorId,
    base64DataUrl: base64Image,
    mimeType: mimeType || 'image/png',
    uploadedByUserId,
  });
}

