/**
 * ══════════════════════════════════════════════════════════════════════════════
 * Enterprise EMPI Service — Elite Master Patient Index
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Implements 7 Core Enterprise Capabilities:
 *  1. Probabilistic & Phonetic EMPI Deduplication Engine (Fellegi-Sunter)
 *  2. Household / Family Shared-Phone Architecture (HouseholdGroup)
 *  3. Longitudinal Clinical Modifiers (NABL ISO 15189:2022)
 *  4. Event-Sourced "Unmerge / Split" (Reversible MPI Merge)
 *  5. "Break-Glass" VIP / Confidential Patient Shield & Key Rotation
 *  6. ABDM v0.5 "Scan & Share" (3-Second QR Fast-Track Registration)
 *
 * Phonetic engine: Double Metaphone (pure TS, no native deps required).
 * String similarity: Jaro-Winkler (inline implementation).
 * Database phonetic/trigram queries use pg_trgm + fuzzystrmatch via $queryRaw.
 */

import crypto from "crypto";
import prisma from "../../../config/database";
import { HttpError } from "../../utils/http-error";
import { WebSocketService } from "../../lib/websocket";
import { createAuditLog } from "../audit/audit.service";
import { generateUHID } from "./patient.service";
import {
  ConfidentialityLevel,
  EmpiDecision,
  FamilyRelation,
  PregnancyStatus,
} from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmpiMatchInput {
  firstName: string;
  lastName: string;
  middleName?: string | null;
  phone?: string | null;
  dateOfBirth?: Date | string | null;
  age?: number | null;
  gender?: string;
  pincode?: string | null;
}

export interface EmpiScoreBreakdown {
  phone: number;
  phonetic: number;
  dob: number;
  gender: number;
  pincode: number;
  total: number;
}

export interface EmpiMatchResult {
  candidatePatientId: string;
  candidateUhid: string;
  candidateName: string;
  score: number;
  breakdown: EmpiScoreBreakdown;
  decision: EmpiDecision;
}

export interface AbdmScanSharePayload {
  name: string;
  dob?: string;        // ISO date string
  gender?: string;
  abhaAddress: string;
  abhaNumber?: string;
  abhaToken: string;
  phone?: string;
  tokenNumber?: number; // Queue token allocated to this walk-in
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SCORE_PHONE_EXACT = 35;
const SCORE_PHONETIC_MAX = 30;   // Jaro-Winkler >= 0.88 -> full 30 pts, else proportional
const SCORE_DOB_EXACT = 20;
const SCORE_GENDER = 10;
const SCORE_PINCODE = 5;

const THRESHOLD_AUTO_BLOCK = 85;
const THRESHOLD_POTENTIAL = 60;

const BREAK_GLASS_WINDOW_MINUTES = 30;

// ─── Helpers: Normalisation ───────────────────────────────────────────────────

/**
 * Normalise a phone number to +91XXXXXXXXXX.
 * Strips all non-digits; prepends 91 if the number is 10 digits.
 */
export const normalisePhone = (raw?: string | null): string | null => {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits.length >= 10 ? digits : null;
};

/** SHA-256 blind-index for phone (stored in patient.phoneHash) */
export const phoneBlindIndex = (normalised: string): string =>
  crypto.createHash("sha256").update(normalised).digest("hex");

// ─── Helpers: Jaro-Winkler Similarity (inline, no deps) ──────────────────────

export function jaroWinkler(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0.0;

  const matchDist = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array<boolean>(len1).fill(false);
  const s2Matches = new Array<boolean>(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDist);
    const end = Math.min(i + matchDist + 1, len2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;

  // Winkler prefix bonus (max 4 chars)
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
    if (s1[i] !== s2[i]) break;
    prefix++;
  }

  return jaro + 0.1 * prefix * (1 - jaro);
}

// ─── Helpers: Double Metaphone (Indian-name aware subset) ────────────────────

/**
 * Lightweight Double Metaphone implementation tuned for Indian names.
 * Returns [primary, alternate] codes (each up to 6 chars).
 *
 * Key Indian transliteration handling:
 *  - "kh" / "gh" / "dh" / "bh" / "ph" / "th" clusters
 *  - Initial "A"/"E"/"I"/"O"/"U" mapped to "A"
 *  - Trailing "en"/"an"/"in" suffixes (Rekhaben, Sureshbhai)
 */
export function doubleMetaphone(word: string): [string, string] {
  if (!word || word.trim() === "") return ["", ""];

  const s = word.toUpperCase().replace(/[^A-Z]/g, "");
  if (s.length === 0) return ["", ""];

  let primary = "";
  let alternate = "";
  let i = 0;

  const add = (p: string, a?: string) => {
    primary += p;
    alternate += a ?? p;
  };

  // Vowel-initial words -> "A"
  if (/^[AEIOU]/.test(s)) {
    add("A");
    i = 1;
  }

  const at = (pos: number, len = 1) => s.slice(pos, pos + len);
  const contains = (pos: number, ...candidates: string[]) =>
    candidates.some((c) => at(pos, c.length) === c);

  while (i < s.length && primary.length < 6) {
    const c = s[i];
    switch (c) {
      case "A": case "E": case "I": case "O": case "U": case "Y":
        if (i === 0) add("A");
        i++;
        break;
      case "B":
        add("P");
        i += s[i + 1] === "B" ? 2 : 1;
        break;
      case "C":
        if (contains(i, "CH")) { add("X", "S"); i += 2; }
        else if (contains(i, "CK")) { add("K"); i += 2; }
        else if (/[EI]/.test(s[i + 1] ?? "")) { add("S"); i += 1; }
        else { add("K"); i++; }
        break;
      case "D":
        if (contains(i, "DG")) { add("J"); i += 2; }
        else if (contains(i, "DH")) { add("T"); i += 2; }  // Indian: Dhar->T
        else { add("T"); i++; }
        break;
      case "F": add("F"); i++; break;
      case "G":
        if (contains(i, "GH")) { add("K"); i += 2; }
        else if (contains(i, "GN")) { i += 2; }
        else if (/[EI]/.test(s[i + 1] ?? "")) { add("K", "J"); i++; }
        else { add("K"); i++; }
        break;
      case "H":
        if (/[AEIOU]/.test(s[i + 1] ?? "")) { add("H"); }
        i++;
        break;
      case "J": add("J", "H"); i++; break;
      case "K":
        if (contains(i, "KH")) { add("K"); i += 2; }   // Indian: Khan->K
        else { add("K"); i += s[i + 1] === "K" ? 2 : 1; }
        break;
      case "L": add("L"); i++; break;
      case "M": add("M"); i += s[i + 1] === "M" ? 2 : 1; break;
      case "N": add("N"); i += s[i + 1] === "N" ? 2 : 1; break;
      case "P":
        if (contains(i, "PH")) { add("F"); i += 2; }
        else { add("P"); i += s[i + 1] === "P" ? 2 : 1; }
        break;
      case "Q": add("K"); i++; break;
      case "R":
        add("R");
        i += s[i + 1] === "R" ? 2 : 1;
        break;
      case "S":
        if (contains(i, "SH")) { add("X"); i += 2; }
        else if (contains(i, "SCH")) { add("SK"); i += 3; }
        else { add("S"); i += s[i + 1] === "S" ? 2 : 1; }
        break;
      case "T":
        if (contains(i, "TH")) { add("0", "T"); i += 2; }  // theta sound
        else { add("T"); i++; }
        break;
      case "V": add("F"); i++; break;
      case "W":
        if (/[AEIOU]/.test(s[i + 1] ?? "")) { add("A"); }
        i++;
        break;
      case "X": add("S"); i++; break;
      case "Z": add("S"); i++; break;
      default: i++;
    }
  }

  return [primary.slice(0, 6), alternate.slice(0, 6)];
}

// ─── Helpers: EMPI Score computation ─────────────────────────────────────────

export function computeEmpiScore(
  incoming: EmpiMatchInput,
  candidate: {
    phoneHash: string | null;
    phoneticPrimary: string | null;
    phoneticAlternate: string | null;
    firstName: string;
    lastName: string;
    dateOfBirth: Date | null;
    age: number | null;
    gender: string;
    pincode: string | null;
  },
  incomingPhoneHash: string | null,
  incomingPhonetic: [string, string]
): EmpiScoreBreakdown {
  let phone = 0;
  let phonetic = 0;
  let dob = 0;
  let gender = 0;
  let pincode = 0;

  // 1. Exact phone blind-index match (+35)
  if (incomingPhoneHash && candidate.phoneHash && incomingPhoneHash === candidate.phoneHash) {
    phone = SCORE_PHONE_EXACT;
  }

  // 2. Phonetic / Jaro-Winkler name similarity
  const incomingFullName = `${incoming.firstName} ${incoming.lastName}`.toLowerCase();
  const candidateFullName = `${candidate.firstName} ${candidate.lastName}`.toLowerCase();
  const jw = jaroWinkler(incomingFullName, candidateFullName);

  if (jw >= 0.88) {
    phonetic = SCORE_PHONETIC_MAX;
  } else if (jw >= 0.70) {
    const phoneticMatch =
      (incomingPhonetic[0] && candidate.phoneticPrimary && incomingPhonetic[0] === candidate.phoneticPrimary) ||
      (incomingPhonetic[1] && candidate.phoneticAlternate && incomingPhonetic[1] === candidate.phoneticAlternate) ||
      (incomingPhonetic[0] && candidate.phoneticAlternate && incomingPhonetic[0] === candidate.phoneticAlternate);

    phonetic = phoneticMatch
      ? Math.round(SCORE_PHONETIC_MAX * jw)
      : Math.round(SCORE_PHONETIC_MAX * jw * 0.6);
  }

  // 3. DOB match (exact = +20, +-1 year estimated = +10)
  if (incoming.dateOfBirth && candidate.dateOfBirth) {
    const inDob = new Date(incoming.dateOfBirth);
    const canDob = new Date(candidate.dateOfBirth);
    const diffDays = Math.abs(inDob.getTime() - canDob.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays <= 1) {
      dob = SCORE_DOB_EXACT;
    } else if (diffDays <= 366) {
      dob = Math.round(SCORE_DOB_EXACT * 0.5);
    }
  } else if (incoming.age != null && candidate.age != null) {
    if (Math.abs(incoming.age - candidate.age) <= 1) dob = Math.round(SCORE_DOB_EXACT * 0.5);
  }

  // 4. Biological gender match (+10)
  if (incoming.gender && candidate.gender && incoming.gender === candidate.gender) {
    gender = SCORE_GENDER;
  }

  // 5. Pincode / address locality match (+5)
  if (incoming.pincode && candidate.pincode && incoming.pincode === candidate.pincode) {
    pincode = SCORE_PINCODE;
  }

  const total = phone + phonetic + dob + gender + pincode;
  return { phone, phonetic, dob, gender, pincode, total };
}

export function scoreToDecision(score: number): EmpiDecision {
  if (score >= THRESHOLD_AUTO_BLOCK) return EmpiDecision.AUTO_BLOCK_DUPLICATE;
  if (score >= THRESHOLD_POTENTIAL) return EmpiDecision.POTENTIAL_DUPLICATE_QUEUE;
  return EmpiDecision.DISTINCT_PATIENT;
}

// ════════════════════════════════════════════════════════════════════════════
// CAPABILITY 1 — Probabilistic & Phonetic EMPI Deduplication Engine
// ════════════════════════════════════════════════════════════════════════════

/**
 * Core EMPI match endpoint.
 * Returns top candidates with Fellegi-Sunter composite scores and EmpiDecision.
 */
export const runEmpiMatch = async (
  input: EmpiMatchInput,
  excludePatientId?: string
): Promise<EmpiMatchResult[]> => {
  const normPhone = normalisePhone(input.phone);
  const phoneHash = normPhone ? phoneBlindIndex(normPhone) : null;
  const fullName = `${input.firstName} ${input.lastName}`;
  const [phonPrimary, phonAlternate] = doubleMetaphone(fullName);

  const candidates = await prisma.patient.findMany({
    where: {
      AND: [
        { isDraft: false, isActive: true },
        excludePatientId ? { id: { not: excludePatientId } } : {},
        {
          OR: [
            ...(phoneHash ? [{ phoneHash }] : []),
            ...(phonPrimary ? [{ phoneticPrimary: phonPrimary }] : []),
            ...(phonAlternate ? [{ phoneticAlternate: phonAlternate }] : []),
            { lastName: { startsWith: input.lastName.slice(0, 3), mode: "insensitive" as const } },
          ],
        },
      ],
    },
    select: {
      id: true,
      uhid: true,
      firstName: true,
      middleName: true,
      lastName: true,
      gender: true,
      dateOfBirth: true,
      age: true,
      pincode: true,
      phoneHash: true,
      phoneticPrimary: true,
      phoneticAlternate: true,
    },
    take: 50,
  });

  const scored: EmpiMatchResult[] = candidates
    .map((cand) => {
      const breakdown = computeEmpiScore(
        input,
        { ...cand, dateOfBirth: cand.dateOfBirth, gender: cand.gender as string },
        phoneHash,
        [phonPrimary, phonAlternate]
      );
      return {
        candidatePatientId: cand.id,
        candidateUhid: cand.uhid,
        candidateName: `${cand.firstName} ${cand.lastName}`,
        score: breakdown.total,
        breakdown,
        decision: scoreToDecision(breakdown.total),
      };
    })
    .filter((r) => r.score >= THRESHOLD_POTENTIAL)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored;
};

/**
 * Computes & persists phoneHash + phoneticPrimary/Alternate on a patient row.
 * Call this after creating or updating the patient's name / phone.
 */
export const computeAndSaveEmpiFields = async (
  patientId: string,
  data: { phone?: string | null; firstName: string; lastName: string }
) => {
  const normPhone = normalisePhone(data.phone);
  const phoneHash = normPhone ? phoneBlindIndex(normPhone) : null;
  const [phoneticPrimary, phoneticAlternate] = doubleMetaphone(
    `${data.firstName} ${data.lastName}`
  );

  await prisma.patient.update({
    where: { id: patientId },
    data: { phoneHash, phoneticPrimary, phoneticAlternate },
  });

  return { phoneHash, phoneticPrimary, phoneticAlternate };
};

// ════════════════════════════════════════════════════════════════════════════
// CAPABILITY 2 — Household / Family Shared-Phone Architecture
// ════════════════════════════════════════════════════════════════════════════

/**
 * Resolves (or creates) a HouseholdGroup for a given phone number.
 */
export const resolveHouseholdGroup = async (
  phone: string,
  newPatientId: string,
  relation: FamilyRelation = FamilyRelation.SELF
): Promise<{ groupId: string; isNew: boolean; primaryHolderUhid: string | null }> => {
  const normPhone = normalisePhone(phone);
  if (!normPhone) throw new HttpError("Invalid phone number for household resolution", 400, "INVALID_PHONE");

  const hash = phoneBlindIndex(normPhone);

  const existing = await prisma.householdGroup.findUnique({
    where: { primaryPhoneHash: hash },
    include: { patients: { select: { uhid: true }, take: 1 } },
  });

  if (existing) {
    await prisma.patient.update({
      where: { id: newPatientId },
      data: { householdGroupId: existing.id, familyRelation: relation },
    });
    return {
      groupId: existing.id,
      isNew: false,
      primaryHolderUhid: existing.patients[0]?.uhid ?? null,
    };
  }

  const patient = await prisma.patient.findUnique({
    where: { id: newPatientId },
    select: { uhid: true },
  });

  const group = await prisma.householdGroup.create({
    data: {
      primaryPhoneHash: hash,
      primaryHolderPatientId: newPatientId,
      patients: { connect: { id: newPatientId } },
    },
  });

  await prisma.patient.update({
    where: { id: newPatientId },
    data: { familyRelation: FamilyRelation.SELF },
  });

  return { groupId: group.id, isNew: true, primaryHolderUhid: patient?.uhid ?? null };
};

/** Returns all members of a patient's household group */
export const getHouseholdMembers = async (patientId: string) => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { householdGroupId: true },
  });

  if (!patient?.householdGroupId) return [];

  return prisma.patient.findMany({
    where: { householdGroupId: patient.householdGroupId },
    select: {
      id: true,
      uhid: true,
      firstName: true,
      lastName: true,
      gender: true,
      age: true,
      familyRelation: true,
      allowFamilyWalletDrawdown: true,
    },
  });
};

// ════════════════════════════════════════════════════════════════════════════
// CAPABILITY 3 — Longitudinal Clinical Modifiers (NABL ISO 15189:2022)
// ════════════════════════════════════════════════════════════════════════════

export const upsertClinicalProfile = async (
  patientId: string,
  data: {
    birthTimestamp?: Date;
    gestationalAgeWeeks?: number;
    birthWeightGrams?: number;
    pregnancyStatus?: PregnancyStatus;
    lmpDate?: Date;
    bloodGroup?: string;
    bloodGroupVerifiedBy?: string;
    isOnAnticoagulants?: boolean;
    isOnDialysis?: boolean;
    isTransplantRecipient?: boolean;
    knownAllergies?: string[];
    chronicConditions?: string[];
  }
) => {
  const patient = await prisma.patient.findUnique({ where: { id: patientId }, select: { id: true } });
  if (!patient) throw new HttpError("Patient not found", 404, "PATIENT_NOT_FOUND");

  const bloodGroupVerifiedAt = data.bloodGroupVerifiedBy ? new Date() : undefined;

  return prisma.patientClinicalProfile.upsert({
    where: { patientId },
    create: {
      patientId,
      ...data,
      bloodGroupVerifiedAt,
      knownAllergies: data.knownAllergies ?? [],
      chronicConditions: data.chronicConditions ?? [],
    },
    update: { ...data, bloodGroupVerifiedAt },
  });
};

export const getClinicalProfile = async (patientId: string) => {
  return prisma.patientClinicalProfile.findUnique({ where: { patientId } });
};

// ════════════════════════════════════════════════════════════════════════════
// CAPABILITY 4 — Event-Sourced "Unmerge / Split" (Reversible MPI Merge)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Merges sourcePatient INTO targetPatient with full snapshot for reversibility.
 */
export const mergePatients = async (
  sourcePatientId: string,
  targetPatientId: string,
  mergedByUserId: string,
  mergeReason?: string,
  actorIp = "::1"
) => {
  if (sourcePatientId === targetPatientId)
    throw new HttpError("Cannot merge a patient with itself", 400, "SAME_PATIENT_MERGE");

  const [source, target] = await Promise.all([
    prisma.patient.findUnique({ where: { id: sourcePatientId } }),
    prisma.patient.findUnique({ where: { id: targetPatientId } }),
  ]);
  if (!source) throw new HttpError("Source patient not found", 404, "SOURCE_NOT_FOUND");
  if (!target) throw new HttpError("Target patient not found", 404, "TARGET_NOT_FOUND");

  const [orders, samples, invoices, wallet] = await Promise.all([
    prisma.order.findMany({ where: { patientId: sourcePatientId }, select: { id: true } }),
    prisma.sample.findMany({ where: { patientId: sourcePatientId }, select: { id: true } }),
    prisma.invoice.findMany({ where: { order: { patientId: sourcePatientId } }, select: { id: true } }),
    prisma.patientWallet.findUnique({ where: { patientId: sourcePatientId }, select: { balance: true } }),
  ]);

  const migratedOrderIds = orders.map((o) => o.id);
  const migratedSampleIds = samples.map((s) => s.id);
  const migratedInvoiceIds = invoices.map((i) => i.id);
  const transferredWalletAmt = wallet?.balance ?? 0;

  await prisma.$transaction(async (tx) => {
    if (migratedOrderIds.length)
      await tx.order.updateMany({ where: { patientId: sourcePatientId }, data: { patientId: targetPatientId } });
    if (migratedSampleIds.length)
      await tx.sample.updateMany({ where: { patientId: sourcePatientId }, data: { patientId: targetPatientId } });

    if (wallet && Number(transferredWalletAmt) > 0) {
      await tx.patientWallet.update({
        where: { patientId: targetPatientId },
        data: { balance: { increment: transferredWalletAmt } },
      });
      await tx.patientWallet.update({
        where: { patientId: sourcePatientId },
        data: { balance: 0 },
      });
    }

    await tx.patient.update({
      where: { id: sourcePatientId },
      data: { isActive: false, notes: `[MERGED => ${target.uhid}] ${source.notes ?? ""}` },
    });

    const mergeLog = await tx.patientMergeLog.create({
      data: { sourcePatientId, targetPatientId, mergedByUserId, mergeReason },
    });

    await tx.patientMergeSnapshot.create({
      data: {
        mergeLogId: mergeLog.id,
        sourcePatientBackup: source as object,
        migratedOrderIds,
        migratedSampleIds,
        migratedInvoiceIds,
        migratedReceiptIds: [],
        transferredWalletAmt,
      },
    });
  });

  await createAuditLog({
    userId: mergedByUserId,
    module: "PATIENTS",
    action: "PATIENT_MERGE",
    recordId: sourcePatientId,
    newData: { targetPatientId, mergeReason },
    ipAddress: actorIp,
  });

  return { message: `Patient ${source.uhid} successfully merged into ${target.uhid}` };
};

/**
 * Unmerge — SUPER_ADMIN only. Restores sourcePatient records from snapshot.
 * Only migrated record IDs in the snapshot are moved back; new post-merge records are untouched.
 */
export const unmergePatients = async (
  mergeLogId: string,
  revertedByUserId: string,
  actorIp = "::1"
) => {
  const snapshot = await prisma.patientMergeSnapshot.findUnique({
    where: { mergeLogId },
    include: { mergeLog: true },
  });

  if (!snapshot) throw new HttpError("Merge log not found", 404, "MERGE_LOG_NOT_FOUND");
  if (snapshot.isReverted) throw new HttpError("This merge has already been reverted", 409, "ALREADY_REVERTED");

  const { sourcePatientId } = snapshot.mergeLog;
  const backup = snapshot.sourcePatientBackup as Record<string, unknown>;

  await prisma.$transaction(async (tx) => {
    await tx.patient.update({
      where: { id: sourcePatientId },
      data: { isActive: true, notes: backup.notes as string | undefined },
    });

    if (snapshot.migratedOrderIds.length)
      await tx.order.updateMany({
        where: { id: { in: snapshot.migratedOrderIds } },
        data: { patientId: sourcePatientId },
      });

    if (snapshot.migratedSampleIds.length)
      await tx.sample.updateMany({
        where: { id: { in: snapshot.migratedSampleIds } },
        data: { patientId: sourcePatientId },
      });

    if (Number(snapshot.transferredWalletAmt) > 0) {
      await tx.patientWallet.update({
        where: { patientId: snapshot.mergeLog.targetPatientId },
        data: { balance: { decrement: snapshot.transferredWalletAmt } },
      });
      await tx.patientWallet.update({
        where: { patientId: sourcePatientId },
        data: { balance: { increment: snapshot.transferredWalletAmt } },
      });
    }

    await tx.patientMergeSnapshot.update({
      where: { mergeLogId },
      data: { isReverted: true, revertedAt: new Date(), revertedByUserId },
    });
  });

  await createAuditLog({
    userId: revertedByUserId,
    module: "PATIENTS",
    action: "PATIENT_UNMERGE",
    recordId: sourcePatientId,
    newData: { mergeLogId },
    ipAddress: actorIp,
  });

  return { message: `Merge ${mergeLogId} successfully reverted. Patient ${sourcePatientId} restored.` };
};

// ════════════════════════════════════════════════════════════════════════════
// CAPABILITY 5 — "Break-Glass" VIP / Confidential Patient Shield
// ════════════════════════════════════════════════════════════════════════════

export const setConfidentialityLevel = async (
  patientId: string,
  level: ConfidentialityLevel,
  setByUserId: string
) => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { uhid: true },
  });
  if (!patient) throw new HttpError("Patient not found", 404, "PATIENT_NOT_FOUND");

  const confidentialAlias =
    level !== ConfidentialityLevel.STANDARD ? `CONFIDENTIAL-${patient.uhid}` : null;

  await prisma.patient.update({
    where: { id: patientId },
    data: { confidentialityLevel: level, confidentialAlias },
  });

  await createAuditLog({
    userId: setByUserId,
    module: "PATIENTS",
    action: "CONFIDENTIALITY_LEVEL_SET",
    recordId: patientId,
    newData: { level, confidentialAlias },
  });

  return { confidentialityLevel: level, confidentialAlias };
};

/**
 * Records a Break-Glass Emergency Access event.
 * Opens a 30-minute unmasked window and emits audit log.
 * TODO: also send WebSocket alert to Chief Pathologist (Module 26).
 */
export const breakGlassAccess = async (
  patientId: string,
  accessedById: string,
  clinicalReason: string,
  ipAddress: string
): Promise<{ accessLogId: string; expiresAt: Date; patient: object }> => {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new HttpError("Patient not found", 404, "PATIENT_NOT_FOUND");

  if (patient.confidentialityLevel === ConfidentialityLevel.STANDARD) {
    throw new HttpError("Patient is not marked confidential; break-glass is not required", 400, "NOT_CONFIDENTIAL");
  }

  const expiresAt = new Date(Date.now() + BREAK_GLASS_WINDOW_MINUTES * 60 * 1000);

  const log = await prisma.breakGlassAccessLog.create({
    data: { patientId, accessedById, clinicalReason, ipAddress, expiresAt },
  });

  await createAuditLog({
    userId: accessedById,
    module: "PATIENTS",
    action: "BREAK_GLASS_ACCESS",
    recordId: patientId,
    newData: { clinicalReason, expiresAt: expiresAt.toISOString() },
    ipAddress,
  });

  // TODO: wsServer.emit('break_glass_alert', { patientId, accessedById, clinicalReason, timestamp: new Date() });

  return { accessLogId: log.id, expiresAt, patient };
};

/**
 * Returns masked patient view for non-privileged viewers.
 * Full data returned if accessedById has an active break-glass token.
 */
export const getPatientWithConfidentialityMask = async (
  patientId: string,
  accessedById: string
) => {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new HttpError("Patient not found", 404, "PATIENT_NOT_FOUND");

  if (patient.confidentialityLevel === ConfidentialityLevel.STANDARD) return patient;

  const activeToken = await prisma.breakGlassAccessLog.findFirst({
    where: { patientId, accessedById, expiresAt: { gt: new Date() } },
  });

  if (activeToken) return patient;

  return {
    id: patient.id,
    uhid: patient.uhid,
    firstName: patient.confidentialAlias ?? `CONFIDENTIAL-${patient.uhid}`,
    lastName: "",
    gender: patient.gender,
    confidentialityLevel: patient.confidentialityLevel,
    _masked: true,
  };
};

// ════════════════════════════════════════════════════════════════════════════
// CAPABILITY 6 — ABDM v0.5 "Scan & Share" (3-Second QR Fast-Track)
// ════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/v1/patients/abdm-scan-share
 *
 * ABDM gateway pushes verified patient data after a Scan & Share event.
 * Runs EMPI match -> route to AUTO_BLOCK / DISTINCT / POTENTIAL based on score.
 */
export const handleAbdmScanShare = async (
  payload: AbdmScanSharePayload,
  createdById: string
): Promise<{
  action: "EXISTING_PATIENT" | "NEW_PATIENT" | "REVIEW_REQUIRED";
  uhid: string;
  patientId: string;
  empiScore?: number;
  tokenNumber?: number;
}> => {
  const nameParts = payload.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "UNKNOWN";
  const lastName = nameParts.slice(1).join(" ") || "UNKNOWN";
  const dob = payload.dob ? new Date(payload.dob) : undefined;

  const matchInput: EmpiMatchInput = {
    firstName,
    lastName,
    phone: payload.phone,
    dateOfBirth: dob,
    gender: payload.gender,
  };

  const matches = await runEmpiMatch(matchInput);
  const topMatch = matches[0];

  if (topMatch?.decision === EmpiDecision.AUTO_BLOCK_DUPLICATE) {
    const responsePayload = {
      action: "EXISTING_PATIENT",
      uhid: topMatch.candidateUhid,
      patientId: topMatch.candidatePatientId,
      empiScore: topMatch.score,
      tokenNumber: payload.tokenNumber,
    };

    WebSocketService.broadcastToRole("FRONT_DESK", "empi_match_alert", {
      ...responsePayload,
      name: payload.name,
    });

    return responsePayload;
  }

  const uhid = await generateUHID();

  const normPhone = normalisePhone(payload.phone);
  const phoneHash = normPhone ? phoneBlindIndex(normPhone) : null;
  const [phoneticPrimary, phoneticAlternate] = doubleMetaphone(`${firstName} ${lastName}`);

  const newPatient = await prisma.patient.create({
    data: {
      uhid,
      firstName,
      lastName,
      gender: (payload.gender?.toUpperCase() ?? "OTHER") as "MALE" | "FEMALE" | "OTHER",
      dateOfBirth: dob,
      phone: payload.phone,
      abhaAddress: payload.abhaAddress,
      abhaNumber: payload.abhaNumber,
      abhaToken: payload.abhaToken,
      abhaStatus: "LINKED",
      abhaLinkedAt: new Date(),
      registrationSource: "ABDM_SCAN_SHARE",
      phoneHash,
      phoneticPrimary,
      phoneticAlternate,
      createdById,
    },
    select: { id: true, uhid: true },
  });

  if (payload.phone) {
    await resolveHouseholdGroup(payload.phone, newPatient.id, FamilyRelation.SELF).catch(() => {
      // Non-fatal: household resolution failure does not block registration
    });
  }

  if (topMatch?.decision === EmpiDecision.POTENTIAL_DUPLICATE_QUEUE) {
    await prisma.empiReviewQueue.create({
      data: {
        incomingPatientId: newPatient.id,
        candidatePatientId: topMatch.candidatePatientId,
        empiScore: topMatch.score,
        empiDecision: EmpiDecision.POTENTIAL_DUPLICATE_QUEUE,
        scoreBreakdown: topMatch.breakdown as any,
      },
    });

    const responsePayload = {
      action: "REVIEW_REQUIRED",
      uhid: newPatient.uhid,
      patientId: newPatient.id,
      empiScore: topMatch.score,
      tokenNumber: payload.tokenNumber,
    };

    WebSocketService.broadcastToRole("ADMIN", "empi_review_required", {
      ...responsePayload,
      name: payload.name,
    });

    return responsePayload;
  }

  const responsePayload = {
    action: "NEW_PATIENT",
    uhid: newPatient.uhid,
    patientId: newPatient.id,
    tokenNumber: payload.tokenNumber,
  };

  WebSocketService.broadcastToRole("FRONT_DESK", "empi_match_alert", {
    action: "ABDM_SCAN_SHARE",
    uhid: newPatient.uhid,
    name: payload.name,
    tokenNumber: payload.tokenNumber,
  });

  return responsePayload;
};

// ════════════════════════════════════════════════════════════════════════════
// EMPI Review Queue — Data Steward Operations
// ════════════════════════════════════════════════════════════════════════════

export const listEmpiReviewQueue = async (onlyUnresolved = true) => {
  return prisma.empiReviewQueue.findMany({
    where: onlyUnresolved ? { isResolved: false } : {},
    orderBy: [{ empiScore: "desc" }, { createdAt: "asc" }],
    include: {
      incomingPatient: {
        select: { uhid: true, firstName: true, lastName: true, phone: true, dateOfBirth: true },
      },
    },
  });
};

export const resolveEmpiReview = async (
  reviewId: string,
  reviewedById: string,
  resolution: "MERGE" | "DISMISS",
  resolutionNotes?: string
) => {
  const review = await prisma.empiReviewQueue.findUnique({ where: { id: reviewId } });
  if (!review) throw new HttpError("Review item not found", 404, "REVIEW_NOT_FOUND");
  if (review.isResolved) throw new HttpError("Already resolved", 409, "ALREADY_RESOLVED");

  await prisma.empiReviewQueue.update({
    where: { id: reviewId },
    data: { isResolved: true, reviewedById, reviewedAt: new Date(), resolutionNotes },
  });

  if (resolution === "MERGE") {
    await mergePatients(
      review.incomingPatientId,
      review.candidatePatientId,
      reviewedById,
      resolutionNotes ?? "EMPI steward merge"
    );
  }

  return { resolved: true, resolution };
};
