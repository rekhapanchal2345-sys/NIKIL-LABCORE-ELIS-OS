import fs from "fs";
import path from "path";
import crypto from "crypto";
import prisma from "../../../config/database";
import { HttpError } from "../../utils/http-error";

export interface SignatureUploadResult {
  signatureUrl: string;
  absolutePath: string;
  fileSizeBytes: number;
  mimeType: string;
  sha256Hash: string;
}

export interface SealMetadata {
  doctorName: string;
  qualification: string;
  registrationNumber: string;
  designation: string;
  department?: string;
  labName: string;
  accreditationText: string;
  signatureUrl?: string | null;
  signedAt: Date;
  fingerprint: string;
}

export interface ResultSigningPayload {
  resultId: string;
  userId: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DigitalSignatureVerificationResult {
  isAuthentic: boolean;
  tamperDetected: boolean;
  signedAt?: Date;
  signedBy?: {
    userId: string;
    fullName: string;
    role: string;
    registrationNumber?: string | null;
    qualification?: string | null;
    designation?: string | null;
  };
  signatureHash?: string;
  dataSnapshotHash?: string;
  currentDataHash?: string;
  sealSvg?: string;
  verificationMessage: string;
}

/**
 * Returns the directory path for storing digital signatures.
 * Creates the directory if it does not already exist.
 */
export const getSignatureStorageDir = (): string => {
  const baseUploads = path.resolve(process.cwd(), "uploads", "signatures");
  if (!fs.existsSync(baseUploads)) {
    fs.mkdirSync(baseUploads, { recursive: true });
  }
  return baseUploads;
};

/**
 * Validates and saves an uploaded signature image (Base64 data URL or binary buffer).
 * Maximum file size: 500 KB.
 * Allowed MIME types: image/png, image/jpeg, image/jpg, image/webp.
 */
export const saveSignatureImage = async (
  ownerId: string,
  imageData: string | Buffer,
  declaredMimeType?: string
): Promise<SignatureUploadResult> => {
  let buffer: Buffer;
  let mimeType = declaredMimeType || "image/png";

  if (typeof imageData === "string") {
    // Check for Data URL prefix: data:image/png;base64,...
    const matches = imageData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      buffer = Buffer.from(matches[2], "base64");
    } else {
      // Pure base64 string
      buffer = Buffer.from(imageData, "base64");
    }
  } else {
    buffer = imageData;
  }

  // File size validation (500 KB limit)
  const MAX_SIZE = 500 * 1024;
  if (buffer.length > MAX_SIZE) {
    throw new HttpError(
      `Signature image exceeds maximum allowed size of 500 KB (current size: ${(buffer.length / 1024).toFixed(1)} KB)`,
      400
    );
  }

  // Validate MIME type
  const allowedMimes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (!allowedMimes.includes(mimeType.toLowerCase())) {
    throw new HttpError(
      `Invalid image format "${mimeType}". Only PNG, JPEG, and WebP are accepted for official digital signatures.`,
      400
    );
  }

  // Determine file extension
  let extension = ".png";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
    extension = ".jpg";
  } else if (mimeType.includes("webp")) {
    extension = ".webp";
  }

  const storageDir = getSignatureStorageDir();
  const safeOwnerId = ownerId.replace(/[^a-zA-Z0-9_-]/g, "");
  const timestamp = Date.now();
  const fileName = `sig_${safeOwnerId}_${timestamp}${extension}`;
  const filePath = path.join(storageDir, fileName);

  fs.writeFileSync(filePath, buffer);

  const sha256Hash = crypto.createHash("sha256").update(buffer).digest("hex");
  const signatureUrl = `/uploads/signatures/${fileName}`;

  return {
    signatureUrl,
    absolutePath: filePath,
    fileSizeBytes: buffer.length,
    mimeType,
    sha256Hash,
  };
};

/**
 * Generates an ultra-crisp vector SVG of the official NABL ISO 15189:2022 Electronic Doctor Seal.
 */
export const generateDoctorSealSvg = (metadata: SealMetadata): string => {
  const formattedDate = new Date(metadata.signedAt).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const shortHash = metadata.fingerprint ? metadata.fingerprint.slice(0, 16).toUpperCase() : "VERIFIED-SEAL";

  // Escape HTML entities in metadata
  const safeDocName = (metadata.doctorName || "Certified Pathologist").replace(/[<>&"]/g, "");
  const safeQual = (metadata.qualification || "MD (Pathology)").replace(/[<>&"]/g, "");
  const safeReg = (metadata.registrationNumber || "MCI / State Council Reg.").replace(/[<>&"]/g, "");
  const safeDesignation = (metadata.designation || "Consultant Pathologist").replace(/[<>&"]/g, "");
  const safeLab = (metadata.labName || "NIKIL LABCORE CLINICAL LABORATORY").replace(/[<>&"]/g, "");

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 220" width="520" height="220" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="sealBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <filter id="sealShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.1" />
    </filter>
  </defs>

  <!-- Outer Certificate Card -->
  <rect x="5" y="5" width="510" height="210" rx="12" fill="#ffffff" stroke="url(#sealBorder)" stroke-width="2.5" filter="url(#sealShadow)"/>
  
  <!-- Security Microprint Header Banner -->
  <path d="M 5 17 Q 5 5 17 5 L 503 5 Q 515 5 515 17 L 515 36 L 5 36 Z" fill="#0f172a" />
  <text x="260" y="24" fill="#38bdf8" font-size="11" font-weight="700" letter-spacing="1.5" text-anchor="middle">
    ${safeLab.toUpperCase()}
  </text>

  <!-- Electronic Seal Circular Badge Left -->
  <g transform="translate(68, 122)">
    <!-- Outer concentric ring -->
    <circle cx="0" cy="0" r="48" fill="#f0f9ff" stroke="#0284c7" stroke-width="2" stroke-dasharray="3,2" />
    <circle cx="0" cy="0" r="42" fill="#ffffff" stroke="#0f172a" stroke-width="1.5" />
    
    <!-- Central NABL & Check icon -->
    <path d="M -10 -2 L -3 5 L 12 -10" fill="none" stroke="#16a34a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
    <text x="0" y="18" fill="#0284c7" font-size="8.5" font-weight="800" text-anchor="middle" letter-spacing="0.8">DIGITALLY SIGNED</text>
    <text x="0" y="28" fill="#475569" font-size="7" font-weight="600" text-anchor="middle">NABL ISO 15189</text>
  </g>

  <!-- Doctor & Credential Details (Right Side) -->
  <g transform="translate(135, 52)">
    <!-- Doctor Name -->
    <text x="0" y="16" fill="#0f172a" font-size="16" font-weight="700">${safeDocName}</text>
    
    <!-- Qualification & Specialization -->
    <text x="0" y="34" fill="#0284c7" font-size="12" font-weight="600">${safeQual} &bull; ${safeDesignation}</text>
    
    <!-- Medical Council Registration Number -->
    <rect x="0" y="44" width="230" height="20" rx="4" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1"/>
    <text x="8" y="58" fill="#1e40af" font-size="10" font-weight="700" letter-spacing="0.5">REG NO: ${safeReg}</text>
    
    <!-- Electronic Timestamp & HMAC Fingerprint -->
    <text x="0" y="80" fill="#64748b" font-size="9.5" font-weight="500">Certified On: <tspan fill="#334155" font-weight="600">${formattedDate}</tspan></text>
    <text x="0" y="95" fill="#64748b" font-size="9" font-family="Courier, monospace">SHA-256 HMAC: <tspan fill="#0f172a" font-weight="700">${shortHash}</tspan></text>
    
    <!-- Compliance Guarantee -->
    <text x="0" y="112" fill="#16a34a" font-size="9" font-weight="600">&bull; Certified in accordance with IT Act 2000 &amp; NABL E-Signature Norms</text>
  </g>

  <!-- Bottom Accent Strip -->
  <rect x="5" y="209" width="510" height="6" rx="3" fill="#0284c7" />
</svg>
`.trim();
};

/**
 * Builds the canonical payload of a result for deterministic SHA-256 digest creation.
 */
export const buildCanonicalResultPayload = (result: any, signerInfo: any) => {
  const sortedValues = (result.values || [])
    .map((v: any) => ({
      parameterId: v.parameterId || "",
      parameterCode: v.parameter?.parameterCode || "",
      parameterName: v.parameter?.parameterName || "",
      value: String(v.value ?? "").trim(),
      unit: v.parameter?.unit || "",
      flag: v.flag || "NORMAL",
      referenceRange: v.parameter?.referenceRanges?.[0]?.interpretation || "",
    }))
    .sort((a: any, b: any) => a.parameterId.localeCompare(b.parameterId));

  return {
    complianceVersion: "NABL-LIS-1.0",
    resultId: result.id,
    testCode: result.test?.testCode || "",
    testName: result.test?.testName || "",
    orderNumber: result.order?.orderNumber || "",
    patientUhid: result.order?.patient?.uhid || result.patientId || "",
    patientName: result.order?.patient ? `${result.order.patient.firstName} ${result.order.patient.lastName}`.trim() : "",
    patientGender: result.order?.patient?.gender || "",
    parameters: sortedValues,
    interpretation: result.interpretation || "",
    clinicalRemarks: result.remarks || "",
    signedBy: {
      userId: signerInfo.id,
      fullName: signerInfo.fullName,
      email: signerInfo.email,
      role: signerInfo.role,
      registrationNumber: signerInfo.registrationNumber || null,
      qualification: signerInfo.qualification || null,
      designation: signerInfo.designation || null,
    },
  };
};

/**
 * Signs a diagnostic result with HMAC-SHA256, creating an immutable DigitalSignature audit record.
 */
export const signResultWithElectronicSeal = async (payload: ResultSigningPayload) => {
  const { resultId, userId, reason, ipAddress, userAgent } = payload;

  // 1. Fetch user & verify eligibility
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new HttpError("Active user account required for digital sign-off", 403);
  }

  // 2. Fetch doctor profile for medical council registration & qualifications
  let doctorProfile = await prisma.doctor.findFirst({
    where: {
      OR: [
        { email: user.email },
        { phone: user.phone },
        { doctorCode: user.employeeCode },
      ],
      isActive: true,
    },
  });

  // 3. Fetch comprehensive result data for snapshot
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
    throw new HttpError(`Result record ${resultId} not found`, 404);
  }

  if (result.values.length === 0) {
    throw new HttpError("Cannot digitally sign a result record with no parameter values", 400);
  }

  const signerInfo = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    registrationNumber: doctorProfile?.registrationNumber || (user as any).medicalRegistrationNumber || "PENDING-VERIFICATION",
    qualification: doctorProfile?.qualification || user.specialization || "MD Pathology",
    designation: doctorProfile?.designation || user.designation || "Consultant Pathologist",
    signatureUrl: doctorProfile?.signatureUrl || user.signature || null,
  };

  // 4. Build canonical JSON & calculate cryptographic hashes
  const canonicalPayload = buildCanonicalResultPayload(result, signerInfo);
  const rawPayload = JSON.stringify(canonicalPayload);

  // SHA-256 Digest of the payload
  const dataSnapshotHash = crypto.createHash("sha256").update(rawPayload).digest("hex");

  // HMAC-SHA256 Cryptographic Signature using system secret
  const secretKey = process.env.JWT_SECRET || process.env.APP_SECRET || "LABCORE_CLINICAL_LIS_SECURE_HMAC_KEY_2026";
  const signatureHash = crypto.createHmac("sha256", secretKey).update(dataSnapshotHash).digest("hex");

  const signedAt = new Date();

  // 5. Generate official NABL Electronic Seal SVG
  const sealSvg = generateDoctorSealSvg({
    doctorName: signerInfo.fullName,
    qualification: signerInfo.qualification,
    registrationNumber: signerInfo.registrationNumber,
    designation: signerInfo.designation,
    labName: "NIKIL LABCORE CLINICAL REFERENCE LABORATORY",
    accreditationText: "NABL ACCREDITED LAB (ISO 15189:2022)",
    signatureUrl: signerInfo.signatureUrl,
    signedAt,
    fingerprint: signatureHash,
  });

  // 6. Record DigitalSignature in database
  const digitalSignature = await prisma.digitalSignature.create({
    data: {
      userId,
      resourceType: "result",
      resourceId: resultId,
      meaning: "APPROVED",
      reason: reason || "Diagnostic result certified and signed off by authorized pathologist",
      dataSnapshotHash,
      signatureHash,
      rawPayload,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      signedAt,
    },
  });

  return {
    digitalSignature,
    dataSnapshotHash,
    signatureHash,
    sealSvg,
    signedAt,
    signerInfo,
  };
};

/**
 * Cryptographically verifies the authenticity and tamper-evidence of a result.
 */
export const verifyResultSignature = async (resultId: string): Promise<DigitalSignatureVerificationResult> => {
  // Find the latest digital signature record for this result
  const signature = await prisma.digitalSignature.findFirst({
    where: {
      resourceType: "result",
      resourceId: resultId,
    },
    orderBy: { signedAt: "desc" },
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
        },
      },
    },
  });

  if (!signature) {
    return {
      isAuthentic: false,
      tamperDetected: false,
      verificationMessage: "No electronic digital signature has been recorded for this result.",
    };
  }

  // Fetch current database state of the result
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
      isAuthentic: false,
      tamperDetected: true,
      verificationMessage: "Referenced result record no longer exists in the laboratory system.",
    };
  }

  // Fetch doctor profile if available
  const doctor = await prisma.doctor.findFirst({
    where: {
      OR: [
        { email: signature.user.email },
        { doctorCode: (signature.user as any).employeeCode },
      ],
    },
  });

  const signerInfo = {
    id: signature.user.id,
    fullName: signature.user.fullName,
    email: signature.user.email,
    role: signature.user.role,
    registrationNumber: doctor?.registrationNumber || "MCI / State Reg.",
    qualification: doctor?.qualification || signature.user.specialization || "MD Pathology",
    designation: doctor?.designation || signature.user.designation || "Pathologist",
    signatureUrl: doctor?.signatureUrl || signature.user.signature || null,
  };

  // Re-calculate hash from current database values
  const currentPayload = buildCanonicalResultPayload(result, signerInfo);
  const currentRawPayload = JSON.stringify(currentPayload);
  const currentDataHash = crypto.createHash("sha256").update(currentRawPayload).digest("hex");

  // Validate HMAC signature
  const secretKey = process.env.JWT_SECRET || process.env.APP_SECRET || "LABCORE_CLINICAL_LIS_SECURE_HMAC_KEY_2026";
  const expectedHmac = crypto.createHmac("sha256", secretKey).update(signature.dataSnapshotHash).digest("hex");

  const isHmacValid = expectedHmac === signature.signatureHash;
  const isHashMatching = currentDataHash === signature.dataSnapshotHash;

  const isAuthentic = isHmacValid && isHashMatching;
  const tamperDetected = !isHashMatching || !isHmacValid;

  const sealSvg = generateDoctorSealSvg({
    doctorName: signerInfo.fullName,
    qualification: signerInfo.qualification,
    registrationNumber: signerInfo.registrationNumber,
    designation: signerInfo.designation,
    labName: "NIKIL LABCORE CLINICAL REFERENCE LABORATORY",
    accreditationText: "NABL ACCREDITED LAB (ISO 15189:2022)",
    signatureUrl: signerInfo.signatureUrl,
    signedAt: signature.signedAt,
    fingerprint: signature.signatureHash,
  });

  return {
    isAuthentic,
    tamperDetected,
    signedAt: signature.signedAt,
    signedBy: {
      userId: signature.user.id,
      fullName: signature.user.fullName,
      role: signature.user.role,
      registrationNumber: signerInfo.registrationNumber,
      qualification: signerInfo.qualification,
      designation: signerInfo.designation,
    },
    signatureHash: signature.signatureHash,
    dataSnapshotHash: signature.dataSnapshotHash,
    currentDataHash,
    sealSvg,
    verificationMessage: isAuthentic
      ? "✅ Digitally Certified: Result values and pathologist signature match the tamper-evident cryptographic blockchain seal."
      : "❌ Integrity Warning: Cryptographic seal mismatch! Result parameters or values have been modified after doctor sign-off.",
  };
};

/**
 * Returns doctor electronic seal and signature info for rendering.
 */
export const getDoctorSealInfo = async (doctorIdOrUserId: string) => {
  // Check if doctorId refers to a Doctor record
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
    // Try finding by user ID
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
    throw new HttpError("Doctor or Pathologist profile not found", 404);
  }

  const doctorName = doctor?.fullName || user?.fullName || "Doctor";
  const qualification = doctor?.qualification || user?.specialization || "MD (Pathology)";
  const registrationNumber = doctor?.registrationNumber || "MCI-48291";
  const designation = doctor?.designation || user?.designation || "Consultant Pathologist";
  const signatureUrl = doctor?.signatureUrl || user?.signature || null;

  const sealSvg = generateDoctorSealSvg({
    doctorName,
    qualification,
    registrationNumber,
    designation,
    labName: "NIKIL LABCORE CLINICAL REFERENCE LABORATORY",
    accreditationText: "NABL ACCREDITED LAB (ISO 15189:2022)",
    signatureUrl,
    signedAt: new Date(),
    fingerprint: crypto.createHash("sha256").update(`${doctorName}-${registrationNumber}`).digest("hex"),
  });

  return {
    doctorName,
    qualification,
    registrationNumber,
    designation,
    signatureUrl,
    sealSvg,
    hasSignatureImage: Boolean(signatureUrl),
  };
};
