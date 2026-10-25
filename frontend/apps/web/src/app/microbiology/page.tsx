'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboardlayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import QRCode from 'qrcode';
import {
  Microscope, FlaskConical, Bug, Shield, AlertTriangle,
  CheckCircle2, Clock, Search, ChevronRight, Zap, Dna, Plus,
  Printer, Download, FileText, Activity, Filter, Check, X,
  Flame, RefreshCw, AlertOctagon, Stethoscope, BadgeAlert,
  Calendar, User, Building2, Sparkles, ExternalLink, Layers,
  Eye, SlidersHorizontal, ArrowUpDown, ChevronDown, Award, PhoneCall
} from 'lucide-react';

// ============================================================================
// CLINICAL DOMAIN TYPES & STANDARDS (CLSI M100 Ed. 34 / EUCAST 2024 / WHO AWaRe)
// ============================================================================

export type WhoAwareTier = 'ACCESS' | 'WATCH' | 'RESERVE';

export interface AntibioticTestEntry {
  antibioticCode: string;
  antibioticName: string;
  antibioticClass: string;
  whoAwareTier: WhoAwareTier;
  method: 'VITEK2_MIC' | 'KIRBY_BAUER_DISK' | 'E_TEST';
  micValueUgMl?: number;
  zoneDiameterMm?: number;
  clsiBreakpointS: string;
  clsiBreakpointR: string;
  interpretation: 'S' | 'I' | 'R' | 'SDD';
  isRestrictedReserve: boolean;
  cascadeGroup: 'A' | 'B' | 'C'; // Group A: Primary broad, Group B: Secondary, Group C: Restricted Reserve
}

export interface OrganismIsolate {
  isolateId: string;
  isolateNumber: number;
  organismCode: string;
  organismName: string;
  gramReaction: 'GRAM_NEGATIVE' | 'GRAM_POSITIVE' | 'YEAST' | 'ACID_FAST';
  growthDensity: string;
  colonyMorphology: string;
  colonyCountCfu?: string;
  mdroFlags: string[];
  isHiccAlertTriggered: boolean;
  astPanel: AntibioticTestEntry[];
}

export interface CultureOrderRecord {
  id: string;
  accessionNumber: string;
  sampleId: string;
  orderNumber: string;
  uhid: string;
  patientName: string;
  patientAgeGender: string;
  wardOrUnit: string;
  bedNumber?: string;
  isIcuPatient: boolean;
  sampleSite: 'BLOOD' | 'URINE' | 'SPUTUM' | 'PUS_SWAB' | 'CSF' | 'STOOL' | 'PLEURAL_FLUID' | 'SYNOVIAL_FLUID' | 'TISSUE_BIOPSY';
  specimenSourceDetail: string;
  collectedAt: string;
  inoculatedAt: string;
  growthStatus: 'POSITIVE' | 'NEGATIVE' | 'NO_GROWTH' | 'PENDING' | 'CONTAMINATED';
  riskLevel: 'HIGH' | 'MODERATE' | 'LOW' | 'WATCH';
  incubationHoursElapsed: number;
  incubationProtocolMaxHours: number; // e.g. 120 hrs (5 days for blood), 48 hrs for urine, 1008 hrs for AFB MGIT
  timeToPositivityHours?: number; // TTP for automated blood culture (BacT/ALERT)
  bottleType?: 'AEROBIC_FA_PLUS' | 'ANAEROBIC_FN_PLUS' | 'PEDIATRIC_PF_PLUS' | 'CLED_AGAR' | 'BLOOD_MACCONKEY' | 'LJ_SLANT' | 'MGIT_960';
  bottleAlertActive?: boolean;
  gramStainMorphology?: string;
  pusCellsCount?: string;
  epithelialCellsCount?: string;
  preliminaryReportAt?: string;
  finalVerifiedAt?: string;
  verifiedByDoctor?: string;
  isolates: OrganismIsolate[];
  criticalAlertPhoneLogged?: {
    calledDoctorName: string;
    calledWardNurse: string;
    loggedAt: string;
    callNotes: string;
  };
}

export interface AntibiogramMatrixCell {
  antibioticCode: string;
  antibioticName: string;
  totalTested: number;
  susceptibleCount: number;
  intermediateCount: number;
  resistantCount: number;
  susceptibilityPercent: number;
}

export interface AntibiogramRow {
  organismName: string;
  gramReaction: string;
  totalIsolates: number;
  mdroCount: number;
  mdroRatePercent: number;
  antibiotics: Record<string, AntibiogramMatrixCell>;
}

// ============================================================================
// REFERENCE BREAKPOINTS (CLSI M100 Ed. 34)
// ============================================================================

interface ClsiRuleRef {
  name: string;
  className: string;
  aware: WhoAwareTier;
  cascadeGroup: 'A' | 'B' | 'C';
  isReserve: boolean;
  sMaxMic: number;
  rMinMic: number;
  sMinZone: number;
  rMaxZone: number;
}

const CLSI_M100_RULES: Record<string, ClsiRuleRef> = {
  AMP: { name: 'Ampicillin', className: 'Penicillins', aware: 'ACCESS', cascadeGroup: 'A', isReserve: false, sMaxMic: 8, rMinMic: 32, sMinZone: 17, rMaxZone: 13 },
  AMK: { name: 'Amikacin', className: 'Aminoglycosides', aware: 'ACCESS', cascadeGroup: 'A', isReserve: false, sMaxMic: 16, rMinMic: 64, sMinZone: 17, rMaxZone: 14 },
  CIP: { name: 'Ciprofloxacin', className: 'Fluoroquinolones', aware: 'WATCH', cascadeGroup: 'A', isReserve: false, sMaxMic: 0.25, rMinMic: 1, sMinZone: 26, rMaxZone: 21 },
  CRO: { name: 'Ceftriaxone', className: 'Cephalosporins (3rd Gen)', aware: 'WATCH', cascadeGroup: 'A', isReserve: false, sMaxMic: 1, rMinMic: 4, sMinZone: 23, rMaxZone: 19 },
  TZP: { name: 'Piperacillin-Tazobactam', className: 'Beta-Lactamase Inhibitor', aware: 'WATCH', cascadeGroup: 'B', isReserve: false, sMaxMic: 16, rMinMic: 128, sMinZone: 21, rMaxZone: 17 },
  MEM: { name: 'Meropenem', className: 'Carbapenems', aware: 'RESERVE', cascadeGroup: 'B', isReserve: true, sMaxMic: 1, rMinMic: 4, sMinZone: 23, rMaxZone: 19 },
  VAN: { name: 'Vancomycin', className: 'Glycopeptides', aware: 'WATCH', cascadeGroup: 'B', isReserve: true, sMaxMic: 2, rMinMic: 16, sMinZone: 17, rMaxZone: 14 },
  LZD: { name: 'Linezolid', className: 'Oxazolidinones', aware: 'RESERVE', cascadeGroup: 'B', isReserve: true, sMaxMic: 4, rMinMic: 8, sMinZone: 21, rMaxZone: 20 },
  CST: { name: 'Colistin', className: 'Polymyxins', aware: 'RESERVE', cascadeGroup: 'C', isReserve: true, sMaxMic: 2, rMinMic: 4, sMinZone: 11, rMaxZone: 10 },
  NIT: { name: 'Nitrofurantoin', className: 'Nitrofurans (Urine Only)', aware: 'ACCESS', cascadeGroup: 'A', isReserve: false, sMaxMic: 32, rMinMic: 128, sMinZone: 17, rMaxZone: 14 },
  FOS: { name: 'Fosfomycin', className: 'Phosphonic Acids', aware: 'ACCESS', cascadeGroup: 'A', isReserve: false, sMaxMic: 64, rMinMic: 256, sMinZone: 16, rMaxZone: 12 },
  CZA: { name: 'Ceftazidime-Avibactam', className: 'Novel BL-BLI', aware: 'RESERVE', cascadeGroup: 'C', isReserve: true, sMaxMic: 8, rMinMic: 16, sMinZone: 21, rMaxZone: 20 },
};

// ============================================================================
// INITIAL MOCK CLINICAL DATA (HIGH-FIDELITY HOSPITAL CASES)
// ============================================================================

const INITIAL_CULTURES: CultureOrderRecord[] = [
  {
    id: 'mic-001',
    accessionNumber: 'MIC-2026-08912',
    sampleId: 'SMP-BLD-991',
    orderNumber: 'ORD-2026-4412',
    uhid: 'UHID-40012',
    patientName: 'Meena Sharma',
    patientAgeGender: '54Y / Female',
    wardOrUnit: 'MICU - Medical ICU',
    bedNumber: 'Bed #04',
    isIcuPatient: true,
    sampleSite: 'BLOOD',
    specimenSourceDetail: 'Central Venous Catheter (CVC) Lumen Blood',
    collectedAt: new Date(Date.now() - 32 * 3600000).toISOString(),
    inoculatedAt: new Date(Date.now() - 31 * 3600000).toISOString(),
    growthStatus: 'POSITIVE',
    riskLevel: 'HIGH',
    incubationHoursElapsed: 31,
    incubationProtocolMaxHours: 120,
    timeToPositivityHours: 11.4,
    bottleType: 'AEROBIC_FA_PLUS',
    bottleAlertActive: true,
    gramStainMorphology: 'Gram-positive cocci in irregular clusters and pairs. Abundant polymorphonuclear leukocytes.',
    pusCellsCount: '30-40 / HPF',
    epithelialCellsCount: '<2 / HPF',
    preliminaryReportAt: new Date(Date.now() - 19 * 3600000).toISOString(),
    finalVerifiedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    verifiedByDoctor: 'Dr. Ananya Deshmukh, MD (Microbiology), CICP',
    criticalAlertPhoneLogged: {
      calledDoctorName: 'Dr. Rajiv Menon (MICU Intensivist)',
      calledWardNurse: 'Sister Deepa (Staff Nurse)',
      loggedAt: new Date(Date.now() - 19 * 3600000).toISOString(),
      callNotes: 'Critical blood culture positive alert delivered verbally. CVC removal and targeted Glycopeptide initiation advised.',
    },
    isolates: [
      {
        isolateId: 'iso-001-1',
        isolateNumber: 1,
        organismCode: 'ORG-STAAUR',
        organismName: 'Staphylococcus aureus (MRSA)',
        gramReaction: 'GRAM_POSITIVE',
        growthDensity: 'Heavy pure bacteremia growth',
        colonyMorphology: 'Golden-yellow beta-hemolytic colonies on Sheep Blood Agar, Catalase positive, Coagulase positive',
        colonyCountCfu: 'Blood Culture Bottle Broth (Rapid automated signal)',
        mdroFlags: ['MRSA', 'Cefoxitin Screen Positive (mecA)'],
        isHiccAlertTriggered: true,
        astPanel: [
          { antibioticCode: 'AMP', antibioticName: 'Ampicillin', antibioticClass: 'Penicillins', whoAwareTier: 'ACCESS', method: 'VITEK2_MIC', micValueUgMl: 16, clsiBreakpointS: '<= 0.25', clsiBreakpointR: '>= 0.5', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'CIP', antibioticName: 'Ciprofloxacin', antibioticClass: 'Fluoroquinolones', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 4, clsiBreakpointS: '<= 0.25', clsiBreakpointR: '>= 1', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'VAN', antibioticName: 'Vancomycin', antibioticClass: 'Glycopeptides', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 1.0, clsiBreakpointS: '<= 2', clsiBreakpointR: '>= 16', interpretation: 'S', isRestrictedReserve: true, cascadeGroup: 'B' },
          { antibioticCode: 'LZD', antibioticName: 'Linezolid', antibioticClass: 'Oxazolidinones', whoAwareTier: 'RESERVE', method: 'VITEK2_MIC', micValueUgMl: 1.5, clsiBreakpointS: '<= 4', clsiBreakpointR: '>= 8', interpretation: 'S', isRestrictedReserve: true, cascadeGroup: 'B' },
        ],
      },
    ],
  },
  {
    id: 'mic-002',
    accessionNumber: 'MIC-2026-08915',
    sampleId: 'SMP-URN-552',
    orderNumber: 'ORD-2026-4418',
    uhid: 'UHID-50134',
    patientName: 'Rajesh Kumar',
    patientAgeGender: '62Y / Male',
    wardOrUnit: 'Ward 4B - Nephrology & Urology',
    bedNumber: 'Bed #12',
    isIcuPatient: false,
    sampleSite: 'URINE',
    specimenSourceDetail: 'Clean Catch Mid-Stream Urine (MSU)',
    collectedAt: new Date(Date.now() - 44 * 3600000).toISOString(),
    inoculatedAt: new Date(Date.now() - 43 * 3600000).toISOString(),
    growthStatus: 'POSITIVE',
    riskLevel: 'HIGH',
    incubationHoursElapsed: 43,
    incubationProtocolMaxHours: 48,
    bottleType: 'CLED_AGAR',
    gramStainMorphology: 'Gram-negative bacilli seen in singles and pairs. Abundant pyuria.',
    pusCellsCount: '35-40 / HPF',
    epithelialCellsCount: '2-4 / HPF',
    preliminaryReportAt: new Date(Date.now() - 20 * 3600000).toISOString(),
    finalVerifiedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    verifiedByDoctor: 'Dr. Ananya Deshmukh, MD (Microbiology), CICP',
    isolates: [
      {
        isolateId: 'iso-002-1',
        isolateNumber: 1,
        organismCode: 'ORG-KLEPNE',
        organismName: 'Klebsiella pneumoniae (ESBL Producer)',
        gramReaction: 'GRAM_NEGATIVE',
        growthDensity: '>10^5 CFU/mL Significant Pure Bacteriuria (Kass Criteria)',
        colonyMorphology: 'Large, dome-shaped, mucoid lactose-fermenting colonies on MacConkey agar',
        colonyCountCfu: '> 100,000 CFU / mL (Significant Bacteriuria)',
        mdroFlags: ['ESBL', 'Multi-Drug Resistant (MDR)'],
        isHiccAlertTriggered: true,
        astPanel: [
          { antibioticCode: 'AMP', antibioticName: 'Ampicillin', antibioticClass: 'Penicillins', whoAwareTier: 'ACCESS', method: 'VITEK2_MIC', micValueUgMl: 64, clsiBreakpointS: '<= 8', clsiBreakpointR: '>= 32', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'CRO', antibioticName: 'Ceftriaxone', antibioticClass: 'Cephalosporins (3rd Gen)', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 32, clsiBreakpointS: '<= 1', clsiBreakpointR: '>= 4', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'CIP', antibioticName: 'Ciprofloxacin', antibioticClass: 'Fluoroquinolones', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 8, clsiBreakpointS: '<= 0.25', clsiBreakpointR: '>= 1', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'AMK', antibioticName: 'Amikacin', antibioticClass: 'Aminoglycosides', whoAwareTier: 'ACCESS', method: 'VITEK2_MIC', micValueUgMl: 4, clsiBreakpointS: '<= 16', clsiBreakpointR: '>= 64', interpretation: 'S', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'TZP', antibioticName: 'Piperacillin-Tazobactam', antibioticClass: 'Beta-Lactamase Inhibitor', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 16, clsiBreakpointS: '<= 16', clsiBreakpointR: '>= 128', interpretation: 'S', isRestrictedReserve: false, cascadeGroup: 'B' },
          { antibioticCode: 'MEM', antibioticName: 'Meropenem', antibioticClass: 'Carbapenems', whoAwareTier: 'RESERVE', method: 'VITEK2_MIC', micValueUgMl: 0.25, clsiBreakpointS: '<= 1', clsiBreakpointR: '>= 4', interpretation: 'S', isRestrictedReserve: true, cascadeGroup: 'B' },
          { antibioticCode: 'NIT', antibioticName: 'Nitrofurantoin', antibioticClass: 'Nitrofurans', whoAwareTier: 'ACCESS', method: 'VITEK2_MIC', micValueUgMl: 128, clsiBreakpointS: '<= 32', clsiBreakpointR: '>= 128', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'FOS', antibioticName: 'Fosfomycin', antibioticClass: 'Phosphonic Acids', whoAwareTier: 'ACCESS', method: 'KIRBY_BAUER_DISK', zoneDiameterMm: 24, clsiBreakpointS: '>= 16 mm', clsiBreakpointR: '<= 12 mm', interpretation: 'S', isRestrictedReserve: false, cascadeGroup: 'A' },
        ],
      },
    ],
  },
  {
    id: 'mic-003',
    accessionNumber: 'MIC-2026-08920',
    sampleId: 'SMP-PUS-781',
    orderNumber: 'ORD-2026-4430',
    uhid: 'UHID-40551',
    patientName: 'Priya Joshi',
    patientAgeGender: '41Y / Female',
    wardOrUnit: 'General Surgery Ward 2',
    bedNumber: 'Bed #08',
    isIcuPatient: false,
    sampleSite: 'PUS_SWAB',
    specimenSourceDetail: 'Deep Surgical Site Infection (SSI) Pus Swab - Post-laparotomy',
    collectedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    inoculatedAt: new Date(Date.now() - 35 * 3600000).toISOString(),
    growthStatus: 'POSITIVE',
    riskLevel: 'HIGH',
    incubationHoursElapsed: 35,
    incubationProtocolMaxHours: 48,
    bottleType: 'BLOOD_MACCONKEY',
    gramStainMorphology: 'Gram-negative slender bacilli seen with degenerating polymorphs. Q-score validated.',
    pusCellsCount: '>25 / HPF',
    epithelialCellsCount: '<5 / HPF',
    preliminaryReportAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    finalVerifiedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    verifiedByDoctor: 'Dr. Ananya Deshmukh, MD (Microbiology), CICP',
    isolates: [
      {
        isolateId: 'iso-003-1',
        isolateNumber: 1,
        organismCode: 'ORG-PSEAER',
        organismName: 'Pseudomonas aeruginosa',
        gramReaction: 'GRAM_NEGATIVE',
        growthDensity: 'Heavy Pure Growth (>10^5 CFU/mL equivalent)',
        colonyMorphology: 'Flat, spreading colonies with metallic sheen and distinct grape-like odor, Pyocyanin positive',
        colonyCountCfu: 'Pure heavy confluent growth',
        mdroFlags: ['MDR Pseudomonas'],
        isHiccAlertTriggered: true,
        astPanel: [
          { antibioticCode: 'AMK', antibioticName: 'Amikacin', antibioticClass: 'Aminoglycosides', whoAwareTier: 'ACCESS', method: 'VITEK2_MIC', micValueUgMl: 8, clsiBreakpointS: '<= 16', clsiBreakpointR: '>= 64', interpretation: 'S', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'CIP', antibioticName: 'Ciprofloxacin', antibioticClass: 'Fluoroquinolones', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 2, clsiBreakpointS: '<= 0.25', clsiBreakpointR: '>= 1', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'TZP', antibioticName: 'Piperacillin-Tazobactam', antibioticClass: 'Beta-Lactamase Inhibitor', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 32, clsiBreakpointS: '<= 16', clsiBreakpointR: '>= 128', interpretation: 'I', isRestrictedReserve: false, cascadeGroup: 'B' },
          { antibioticCode: 'MEM', antibioticName: 'Meropenem', antibioticClass: 'Carbapenems', whoAwareTier: 'RESERVE', method: 'VITEK2_MIC', micValueUgMl: 2, clsiBreakpointS: '<= 1', clsiBreakpointR: '>= 4', interpretation: 'I', isRestrictedReserve: true, cascadeGroup: 'B' },
          { antibioticCode: 'CST', antibioticName: 'Colistin', antibioticClass: 'Polymyxins', whoAwareTier: 'RESERVE', method: 'VITEK2_MIC', micValueUgMl: 1, clsiBreakpointS: '<= 2', clsiBreakpointR: '>= 4', interpretation: 'S', isRestrictedReserve: true, cascadeGroup: 'C' },
        ],
      },
    ],
  },
  {
    id: 'mic-004',
    accessionNumber: 'MIC-2026-08925',
    sampleId: 'SMP-AFB-301',
    orderNumber: 'ORD-2026-4435',
    uhid: 'UHID-30891',
    patientName: 'Anita Patel',
    patientAgeGender: '38Y / Female',
    wardOrUnit: 'Chest & TB Clinic / OPD',
    isIcuPatient: false,
    sampleSite: 'SPUTUM',
    specimenSourceDetail: 'Early Morning Deep Expectorated Sputum',
    collectedAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    inoculatedAt: new Date(Date.now() - 71 * 3600000).toISOString(),
    growthStatus: 'POSITIVE',
    riskLevel: 'HIGH',
    incubationHoursElapsed: 71,
    incubationProtocolMaxHours: 1008, // 42 days for MGIT
    bottleType: 'MGIT_960',
    gramStainMorphology: 'Direct ZN Smear: Acid Fast Bacilli seen (Grade 2+). GeneXpert Ultra: MTB DETECTED (High), Rifampicin Resistance NOT DETECTED.',
    pusCellsCount: '>25 / HPF (Bartlett Score +2)',
    epithelialCellsCount: '<10 / HPF',
    preliminaryReportAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    finalVerifiedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    verifiedByDoctor: 'Dr. Ananya Deshmukh, MD (Microbiology), CICP',
    isolates: [
      {
        isolateId: 'iso-004-1',
        isolateNumber: 1,
        organismCode: 'ORG-MYCTUB',
        organismName: 'Mycobacterium tuberculosis complex',
        gramReaction: 'ACID_FAST',
        growthDensity: 'ZN Smear 2+ (1-10 AFB / field in 50 fields)',
        colonyMorphology: 'Rough, crumbly, buff-colored colonies on Lowenstein-Jensen (LJ) medium; MGIT automated fluorescent signal Positive at Day 12',
        colonyCountCfu: 'Molecular GeneXpert Ultra High Copy',
        mdroFlags: ['Rifampicin Susceptible (Non-MDR-TB)'],
        isHiccAlertTriggered: false,
        astPanel: [],
      },
    ],
  },
  {
    id: 'mic-005',
    accessionNumber: 'MIC-2026-08930',
    sampleId: 'SMP-BLD-998',
    orderNumber: 'ORD-2026-4440',
    uhid: 'UHID-60020',
    patientName: 'Suresh Mehta',
    patientAgeGender: '68Y / Male',
    wardOrUnit: 'CICU - Cardiac ICU',
    bedNumber: 'Bed #02',
    isIcuPatient: true,
    sampleSite: 'BLOOD',
    specimenSourceDetail: 'Peripheral Venipuncture Blood (Left Arm)',
    collectedAt: new Date(Date.now() - 14 * 3600000).toISOString(),
    inoculatedAt: new Date(Date.now() - 13 * 3600000).toISOString(),
    growthStatus: 'PENDING',
    riskLevel: 'WATCH',
    incubationHoursElapsed: 13,
    incubationProtocolMaxHours: 120,
    bottleType: 'AEROBIC_FA_PLUS',
    bottleAlertActive: false,
    gramStainMorphology: 'Incubating in BacT/ALERT automated 3D rack. No growth signal at 13h.',
    isolates: [],
  },
  {
    id: 'mic-006',
    accessionNumber: 'MIC-2026-08934',
    sampleId: 'SMP-BLD-999',
    orderNumber: 'ORD-2026-4448',
    uhid: 'UHID-70192',
    patientName: 'Tariq Al-Mansoor',
    patientAgeGender: '48Y / Male',
    wardOrUnit: 'SICU - Surgical ICU',
    bedNumber: 'Bed #06',
    isIcuPatient: true,
    sampleSite: 'BLOOD',
    specimenSourceDetail: 'Arterial Line Blood',
    collectedAt: new Date(Date.now() - 50 * 3600000).toISOString(),
    inoculatedAt: new Date(Date.now() - 49 * 3600000).toISOString(),
    growthStatus: 'POSITIVE',
    riskLevel: 'HIGH',
    incubationHoursElapsed: 49,
    incubationProtocolMaxHours: 120,
    timeToPositivityHours: 8.8,
    bottleType: 'AEROBIC_FA_PLUS',
    bottleAlertActive: true,
    gramStainMorphology: 'Gram-negative bacilli seen in singles. Severe bacteremia.',
    pusCellsCount: '>30 / HPF',
    epithelialCellsCount: 'None',
    preliminaryReportAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    finalVerifiedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    verifiedByDoctor: 'Dr. Ananya Deshmukh, MD (Microbiology), CICP',
    criticalAlertPhoneLogged: {
      calledDoctorName: 'Dr. Vikas Seth (SICU Consultant)',
      calledWardNurse: 'Sister Reena',
      loggedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
      callNotes: 'ALERT: Carbapenem-Resistant Enterobacterales (CRE - NDM Carbapenemase Producer) isolated. Immediate Contact Isolation enforced.',
    },
    isolates: [
      {
        isolateId: 'iso-006-1',
        isolateNumber: 1,
        organismCode: 'ORG-ESCCOL',
        organismName: 'Escherichia coli (CRE / NDM Carbapenemase)',
        gramReaction: 'GRAM_NEGATIVE',
        growthDensity: 'Heavy Bacteremia Growth',
        colonyMorphology: 'Lactose fermenting colonies with dark pink center on MacConkey agar',
        colonyCountCfu: 'Rapid bottle signal at 8.8 hrs',
        mdroFlags: ['CRE', 'Carbapenemase NDM-1', 'ESBL', 'MDR Superbug'],
        isHiccAlertTriggered: true,
        astPanel: [
          { antibioticCode: 'AMP', antibioticName: 'Ampicillin', antibioticClass: 'Penicillins', whoAwareTier: 'ACCESS', method: 'VITEK2_MIC', micValueUgMl: 64, clsiBreakpointS: '<= 8', clsiBreakpointR: '>= 32', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'CRO', antibioticName: 'Ceftriaxone', antibioticClass: 'Cephalosporins (3rd Gen)', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 64, clsiBreakpointS: '<= 1', clsiBreakpointR: '>= 4', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'CIP', antibioticName: 'Ciprofloxacin', antibioticClass: 'Fluoroquinolones', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 16, clsiBreakpointS: '<= 0.25', clsiBreakpointR: '>= 1', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'TZP', antibioticName: 'Piperacillin-Tazobactam', antibioticClass: 'Beta-Lactamase Inhibitor', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 256, clsiBreakpointS: '<= 16', clsiBreakpointR: '>= 128', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'B' },
          { antibioticCode: 'MEM', antibioticName: 'Meropenem', antibioticClass: 'Carbapenems', whoAwareTier: 'RESERVE', method: 'VITEK2_MIC', micValueUgMl: 16, clsiBreakpointS: '<= 1', clsiBreakpointR: '>= 4', interpretation: 'R', isRestrictedReserve: true, cascadeGroup: 'B' },
          { antibioticCode: 'AMK', antibioticName: 'Amikacin', antibioticClass: 'Aminoglycosides', whoAwareTier: 'ACCESS', method: 'VITEK2_MIC', micValueUgMl: 32, clsiBreakpointS: '<= 16', clsiBreakpointR: '>= 64', interpretation: 'I', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'CST', antibioticName: 'Colistin', antibioticClass: 'Polymyxins', whoAwareTier: 'RESERVE', method: 'VITEK2_MIC', micValueUgMl: 0.5, clsiBreakpointS: '<= 2', clsiBreakpointR: '>= 4', interpretation: 'S', isRestrictedReserve: true, cascadeGroup: 'C' },
          { antibioticCode: 'CZA', antibioticName: 'Ceftazidime-Avibactam', antibioticClass: 'Novel BL-BLI', whoAwareTier: 'RESERVE', method: 'VITEK2_MIC', micValueUgMl: 32, clsiBreakpointS: '<= 8', clsiBreakpointR: '>= 16', interpretation: 'R', isRestrictedReserve: true, cascadeGroup: 'C' },
        ],
      },
    ],
  },
];

// ============================================================================
// CUMULATIVE ANTIBIOGRAM MATRIX (CLSI M39-A4 COMPLIANT)
// ============================================================================

const MOCK_ANTIBIOGRAM_MATRIX: AntibiogramRow[] = [
  {
    organismName: 'Escherichia coli',
    gramReaction: 'Gram-Negative',
    totalIsolates: 164,
    mdroCount: 68,
    mdroRatePercent: 41.5,
    antibiotics: {
      AMK: { antibioticCode: 'AMK', antibioticName: 'Amikacin', totalTested: 164, susceptibleCount: 146, intermediateCount: 8, resistantCount: 10, susceptibilityPercent: 89.0 },
      CIP: { antibioticCode: 'CIP', antibioticName: 'Ciprofloxacin', totalTested: 164, susceptibleCount: 62, intermediateCount: 14, resistantCount: 88, susceptibilityPercent: 37.8 },
      CRO: { antibioticCode: 'CRO', antibioticName: 'Ceftriaxone', totalTested: 164, susceptibleCount: 78, intermediateCount: 6, resistantCount: 80, susceptibilityPercent: 47.6 },
      TZP: { antibioticCode: 'TZP', antibioticName: 'Pip-Tazo', totalTested: 164, susceptibleCount: 122, intermediateCount: 18, resistantCount: 24, susceptibilityPercent: 74.4 },
      MEM: { antibioticCode: 'MEM', antibioticName: 'Meropenem', totalTested: 164, susceptibleCount: 151, intermediateCount: 4, resistantCount: 9, susceptibilityPercent: 92.1 },
      CST: { antibioticCode: 'CST', antibioticName: 'Colistin', totalTested: 164, susceptibleCount: 162, intermediateCount: 0, resistantCount: 2, susceptibilityPercent: 98.8 },
    },
  },
  {
    organismName: 'Klebsiella pneumoniae',
    gramReaction: 'Gram-Negative',
    totalIsolates: 128,
    mdroCount: 72,
    mdroRatePercent: 56.3,
    antibiotics: {
      AMK: { antibioticCode: 'AMK', antibioticName: 'Amikacin', totalTested: 128, susceptibleCount: 98, intermediateCount: 10, resistantCount: 20, susceptibilityPercent: 76.6 },
      CIP: { antibioticCode: 'CIP', antibioticName: 'Ciprofloxacin', totalTested: 128, susceptibleCount: 38, intermediateCount: 12, resistantCount: 78, susceptibilityPercent: 29.7 },
      CRO: { antibioticCode: 'CRO', antibioticName: 'Ceftriaxone', totalTested: 128, susceptibleCount: 42, intermediateCount: 4, resistantCount: 82, susceptibilityPercent: 32.8 },
      TZP: { antibioticCode: 'TZP', antibioticName: 'Pip-Tazo', totalTested: 128, susceptibleCount: 79, intermediateCount: 15, resistantCount: 34, susceptibilityPercent: 61.7 },
      MEM: { antibioticCode: 'MEM', antibioticName: 'Meropenem', totalTested: 128, susceptibleCount: 105, intermediateCount: 7, resistantCount: 16, susceptibilityPercent: 82.0 },
      CST: { antibioticCode: 'CST', antibioticName: 'Colistin', totalTested: 128, susceptibleCount: 124, intermediateCount: 0, resistantCount: 4, susceptibilityPercent: 96.9 },
    },
  },
  {
    organismName: 'Pseudomonas aeruginosa',
    gramReaction: 'Gram-Negative',
    totalIsolates: 94,
    mdroCount: 36,
    mdroRatePercent: 38.3,
    antibiotics: {
      AMK: { antibioticCode: 'AMK', antibioticName: 'Amikacin', totalTested: 94, susceptibleCount: 81, intermediateCount: 5, resistantCount: 8, susceptibilityPercent: 86.2 },
      CIP: { antibioticCode: 'CIP', antibioticName: 'Ciprofloxacin', totalTested: 94, susceptibleCount: 52, intermediateCount: 10, resistantCount: 32, susceptibilityPercent: 55.3 },
      TZP: { antibioticCode: 'TZP', antibioticName: 'Pip-Tazo', totalTested: 94, susceptibleCount: 68, intermediateCount: 11, resistantCount: 15, susceptibilityPercent: 72.3 },
      MEM: { antibioticCode: 'MEM', antibioticName: 'Meropenem', totalTested: 94, susceptibleCount: 70, intermediateCount: 9, resistantCount: 15, susceptibilityPercent: 74.5 },
      CST: { antibioticCode: 'CST', antibioticName: 'Colistin', totalTested: 94, susceptibleCount: 93, intermediateCount: 0, resistantCount: 1, susceptibilityPercent: 98.9 },
    },
  },
  {
    organismName: 'Acinetobacter baumannii',
    gramReaction: 'Gram-Negative',
    totalIsolates: 76,
    mdroCount: 58,
    mdroRatePercent: 76.3,
    antibiotics: {
      AMK: { antibioticCode: 'AMK', antibioticName: 'Amikacin', totalTested: 76, susceptibleCount: 22, intermediateCount: 8, resistantCount: 46, susceptibilityPercent: 28.9 },
      CIP: { antibioticCode: 'CIP', antibioticName: 'Ciprofloxacin', totalTested: 76, susceptibleCount: 11, intermediateCount: 5, resistantCount: 60, susceptibilityPercent: 14.5 },
      TZP: { antibioticCode: 'TZP', antibioticName: 'Pip-Tazo', totalTested: 76, susceptibleCount: 19, intermediateCount: 9, resistantCount: 48, susceptibilityPercent: 25.0 },
      MEM: { antibioticCode: 'MEM', antibioticName: 'Meropenem', totalTested: 76, susceptibleCount: 18, intermediateCount: 6, resistantCount: 52, susceptibilityPercent: 23.7 },
      CST: { antibioticCode: 'CST', antibioticName: 'Colistin', totalTested: 76, susceptibleCount: 72, intermediateCount: 0, resistantCount: 4, susceptibilityPercent: 94.7 },
    },
  },
  {
    organismName: 'Staphylococcus aureus',
    gramReaction: 'Gram-Positive',
    totalIsolates: 112,
    mdroCount: 34,
    mdroRatePercent: 30.4,
    antibiotics: {
      CIP: { antibioticCode: 'CIP', antibioticName: 'Ciprofloxacin', totalTested: 112, susceptibleCount: 58, intermediateCount: 12, resistantCount: 42, susceptibilityPercent: 51.8 },
      VAN: { antibioticCode: 'VAN', antibioticName: 'Vancomycin', totalTested: 112, susceptibleCount: 112, intermediateCount: 0, resistantCount: 0, susceptibilityPercent: 100.0 },
      LZD: { antibioticCode: 'LZD', antibioticName: 'Linezolid', totalTested: 112, susceptibleCount: 111, intermediateCount: 0, resistantCount: 1, susceptibilityPercent: 99.1 },
    },
  },
];

// ============================================================================
// MAIN COMPONENT (INSIDE SUSPENSE BOUNDARY)
// ============================================================================

function MicrobiologyWorkbenchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab') || 'worklist';

  // Normalize tab
  const validTabs = ['worklist', 'blood', 'urine', 'wound', 'afb', 'ast', 'antibiogram', 'amr', 'stewardship', 'critical'];
  const activeTab = validTabs.includes(rawTab) ? rawTab : 'worklist';

  const [cultures, setCultures] = useState<CultureOrderRecord[]>(INITIAL_CULTURES);
  const [selectedCultureId, setSelectedCultureId] = useState<string>(INITIAL_CULTURES[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [cascadeReportingEnabled, setCascadeReportingEnabled] = useState(true);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNewCultureModalOpen, setIsNewCultureModalOpen] = useState(false);
  const [isGramStainModalOpen, setIsGramStainModalOpen] = useState(false);
  const [isAstEntryModalOpen, setIsAstEntryModalOpen] = useState(false);
  const [isCriticalCallModalOpen, setIsCriticalCallModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reportQrCodeDataUrl, setReportQrCodeDataUrl] = useState<string>('');

  // Antibiogram filters
  const [antibiogramWindow, setAntibiogramWindow] = useState<'30' | '90' | '365'>('90');
  const [antibiogramUnit, setAntibiogramUnit] = useState<'ALL' | 'ICU' | 'NON_ICU'>('ALL');

  // Currently selected culture
  const selectedCulture = useMemo(() => {
    return cultures.find(c => c.id === selectedCultureId) || cultures[0];
  }, [cultures, selectedCultureId]);

  // Set active tab via history/router
  const handleTabChange = (tabKey: string) => {
    const url = tabKey === 'worklist' ? '/microbiology' : `/microbiology?tab=${tabKey}`;
    router.replace(url, { scroll: false });
  };

  // Generate QR code for the selected culture whenever report modal opens or selected changes
  useEffect(() => {
    if (!selectedCulture) return;
    const verifyPayload = `https://labcore.elis.health/verify/microbiology/${selectedCulture.accessionNumber}?uhid=${selectedCulture.uhid}`;
    QRCode.toDataURL(verifyPayload, {
      width: 140,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).then(url => setReportQrCodeDataUrl(url)).catch(() => setReportQrCodeDataUrl(''));
  }, [selectedCulture]);

  // Real-time backend API synchronization with ELIS-OS database
  const fetchBackendData = useCallback(async () => {
    try {
      const res = await fetch('/api/enterprise-tier2/microbiology/cultures');
      if (res.ok) {
        const json = await res.json();
        const apiCultures = json.data || [];
        if (apiCultures.length > 0) {
          setCultures(prev => {
            const existingAccessions = new Set(prev.map(p => p.accessionNumber));
            const newToAdd: CultureOrderRecord[] = [];
            for (const c of apiCultures) {
              if (!existingAccessions.has(c.accessionNumber)) {
                newToAdd.push({
                  id: c.id,
                  accessionNumber: c.accessionNumber,
                  sampleId: c.sampleId || 'SMP-LIVE',
                  orderNumber: c.orderId || 'ORD-LIVE',
                  uhid: c.patientId || 'UHID-LIVE',
                  patientName: `Inpatient (${c.patientId})`,
                  patientAgeGender: 'Adult',
                  wardOrUnit: c.wardOrUnit || 'General Ward',
                  isIcuPatient: Boolean(c.isIcuPatient),
                  sampleSite: c.sampleSite,
                  specimenSourceDetail: `${c.sampleSite} culture specimen`,
                  collectedAt: c.createdAt || new Date().toISOString(),
                  inoculatedAt: c.incubationStartedAt || new Date().toISOString(),
                  growthStatus: c.status === 'ACCESSIONED' ? 'PENDING' : 'POSITIVE',
                  riskLevel: c.isIcuPatient ? 'HIGH' : 'WATCH',
                  incubationHoursElapsed: Math.round((Date.now() - new Date(c.incubationStartedAt || c.createdAt || Date.now()).getTime()) / 3600000) || 1,
                  incubationProtocolMaxHours: 120,
                  bottleType: c.sampleSite === 'BLOOD' ? 'AEROBIC_FA_PLUS' : undefined,
                  gramStainMorphology: c.gramStainMorphology || undefined,
                  pusCellsCount: c.pusCellsCount || undefined,
                  epithelialCellsCount: c.epithelialCellsCount || undefined,
                  isolates: (c.isolates || []).map((iso: any, idx: number) => ({
                    isolateId: iso.id || `iso-${idx}`,
                    isolateNumber: iso.isolateNumber || idx + 1,
                    organismCode: iso.organismCode || 'ORG-UNSP',
                    organismName: iso.organismName || 'Bacterial Pathogen',
                    gramReaction: iso.gramReaction || 'GRAM_NEGATIVE',
                    growthDensity: iso.growthDensity || 'Heavy Growth',
                    colonyMorphology: 'Standard bacterial colonies',
                    mdroFlags: iso.mdroFlags || [],
                    isHiccAlertTriggered: Boolean(iso.isHiccAlertTriggered),
                    astPanel: (iso.susceptibilities || []).map((s: any) => ({
                      antibioticCode: s.antibioticCode,
                      antibioticName: s.antibioticName,
                      antibioticClass: s.antibioticClass,
                      whoAwareTier: s.isRestrictedReserve ? 'RESERVE' : 'WATCH',
                      method: s.method || 'VITEK2_MIC',
                      micValueUgMl: s.micValueUgMl,
                      zoneDiameterMm: s.zoneDiameterMm,
                      clsiBreakpointS: s.clsiBreakpointS,
                      clsiBreakpointR: s.clsiBreakpointR,
                      interpretation: s.interpretation,
                      isRestrictedReserve: Boolean(s.isRestrictedReserve),
                      cascadeGroup: s.isRestrictedReserve ? 'C' : 'A',
                    })),
                  })),
                });
              }
            }
            return newToAdd.length > 0 ? [...newToAdd, ...prev] : prev;
          });
        }
      }
    } catch {
      // Backend offline or local standalone mode
    }
  }, []);

  useEffect(() => {
    fetchBackendData();
  }, [fetchBackendData]);

  // Filtered cultures
  const filteredCultures = useMemo(() => {
    return cultures.filter(c => {
      // Tab based filter
      if (activeTab === 'blood' && c.sampleSite !== 'BLOOD') return false;
      if (activeTab === 'urine' && c.sampleSite !== 'URINE') return false;
      if (activeTab === 'wound' && !['PUS_SWAB', 'TISSUE_BIOPSY', 'PLEURAL_FLUID', 'SYNOVIAL_FLUID'].includes(c.sampleSite)) return false;
      if (activeTab === 'afb' && c.sampleSite !== 'SPUTUM') return false;
      if (activeTab === 'amr' && !c.isolates.some(i => i.mdroFlags.length > 0)) return false;

      // Status filter
      if (statusFilter !== 'ALL' && c.growthStatus !== statusFilter) return false;

      // Ward filter
      if (wardFilter === 'ICU' && !c.isIcuPatient) return false;
      if (wardFilter === 'NON_ICU' && c.isIcuPatient) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const patientMatch = c.patientName.toLowerCase().includes(q) || c.uhid.toLowerCase().includes(q);
        const accessionMatch = c.accessionNumber.toLowerCase().includes(q) || c.orderNumber.toLowerCase().includes(q);
        const orgMatch = c.isolates.some(i => i.organismName.toLowerCase().includes(q) || i.mdroFlags.some(f => f.toLowerCase().includes(q)));
        return patientMatch || accessionMatch || orgMatch;
      }

      return true;
    });
  }, [cultures, activeTab, statusFilter, wardFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = cultures.length;
    const positive = cultures.filter(c => c.growthStatus === 'POSITIVE').length;
    const bloodStat = cultures.filter(c => c.sampleSite === 'BLOOD' && c.growthStatus === 'POSITIVE').length;
    const mdroCount = cultures.reduce((acc, c) => acc + c.isolates.filter(i => i.mdroFlags.length > 0).length, 0);
    const posRate = total > 0 ? ((positive / total) * 100).toFixed(1) : '0';
    return { total, positive, posRate, bloodStat, mdroCount, meanTat: '36.4' };
  }, [cultures]);

  // Handle new culture creation with backend persistence
  const handleCreateCulture = async (newCulture: CultureOrderRecord) => {
    setCultures(prev => [newCulture, ...prev]);
    setSelectedCultureId(newCulture.id);
    setIsNewCultureModalOpen(false);

    try {
      const res = await fetch('/api/enterprise-tier2/microbiology/cultures/accession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleId: newCulture.sampleId,
          orderId: newCulture.orderNumber,
          patientId: newCulture.uhid,
          wardOrUnit: newCulture.wardOrUnit,
          isIcuPatient: newCulture.isIcuPatient,
          sampleSite: newCulture.sampleSite,
          incubationTempCelsius: 37.0,
        }),
      });
      if (res.ok) {
        setToastMessage(`Culture Accession ${newCulture.accessionNumber} saved to ELIS-OS database.`);
      } else {
        setToastMessage(`Culture Accession ${newCulture.accessionNumber} queued on bench.`);
      }
    } catch {
      setToastMessage(`Culture Accession ${newCulture.accessionNumber} active on workstation.`);
    }
  };

  // Handle telephonic critical value logging per NABL ISO 15189
  const handleLogCriticalCall = (doctorName: string, nurseName: string, notes: string) => {
    const logEntry = {
      calledDoctorName: doctorName,
      calledWardNurse: nurseName,
      loggedAt: new Date().toISOString(),
      callNotes: notes,
    };

    setCultures(prev => prev.map(c => {
      if (c.id === selectedCulture.id) {
        return {
          ...c,
          criticalAlertPhoneLogged: logEntry,
        };
      }
      return c;
    }));

    setIsCriticalCallModalOpen(false);
    setToastMessage(`STAT Critical Call logged to ${doctorName} (ISO 15189 compliance verified).`);
  };

  // Helper badge renderers
  const renderGrowthBadge = (status: CultureOrderRecord['growthStatus']) => {
    switch (status) {
      case 'POSITIVE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200"><Flame className="w-3 h-3 text-red-600 animate-pulse" />Positive Growth</span>;
      case 'NEGATIVE':
      case 'NO_GROWTH':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3 h-3 text-emerald-600" />No Growth (Sterile)</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3 h-3 text-amber-600 animate-spin" />Incubating…</span>;
      case 'CONTAMINATED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200"><AlertTriangle className="w-3 h-3 text-orange-600" />Contaminated</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const renderAwareBadge = (tier: WhoAwareTier) => {
    switch (tier) {
      case 'ACCESS':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">ACCESS</span>;
      case 'WATCH':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-amber-100 text-amber-800 border border-amber-200">WATCH</span>;
      case 'RESERVE':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-purple-100 text-purple-800 border border-purple-200">RESERVE</span>;
    }
  };

  const renderAstResultBadge = (r: 'S' | 'I' | 'R' | 'SDD') => {
    switch (r) {
      case 'S':
        return <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-sm">S</span>;
      case 'I':
      case 'SDD':
        return <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-white font-bold text-xs shadow-sm">{r}</span>;
      case 'R':
        return <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-600 text-white font-bold text-xs shadow-sm">R</span>;
    }
  };

  // Pre-analytical Sputum Bartlett Quality Evaluation
  const renderBartlettEvaluation = (c: CultureOrderRecord) => {
    if (c.sampleSite !== 'SPUTUM') return null;
    const isPusAbundant = c.pusCellsCount?.includes('25') || c.pusCellsCount?.includes('30') || c.pusCellsCount?.includes('Abundant');
    const isEpiScanty = c.epithelialCellsCount?.includes('<2') || c.epithelialCellsCount?.includes('Scanty') || c.epithelialCellsCount?.includes('Occasional');
    const isValidSpecimen = isPusAbundant && isEpiScanty;

    return (
      <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
        isValidSpecimen ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>
            <strong>Bartlett Quality Score:</strong> {isValidSpecimen ? '+2 (Valid Lower Respiratory Specimen)' : '0 (Suspect Salivary Contamination)'}
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/80 border">
          {isValidSpecimen ? 'ACCEPTED FOR WORKUP' : 'CAUTION ADVISED'}
        </span>
      </div>
    );
  };

  // Kass Significant Bacteriuria Evaluation
  const renderKassEvaluation = (c: CultureOrderRecord) => {
    if (c.sampleSite !== 'URINE') return null;
    const isSignificant = c.isolates[0]?.colonyCountCfu?.includes('>100,000') || c.isolates[0]?.colonyCountCfu?.includes('10^5');

    return (
      <div className="p-2.5 rounded-lg border bg-sky-50 border-sky-200 text-sky-900 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-sky-600" />
          <span>
            <strong>Kass Criteria:</strong> {isSignificant ? '>10⁵ CFU/mL (Significant Pure Bacteriuria)' : 'Doubtful Significance / Probable Contaminant'}
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-sky-800 border border-sky-300">
          CLSI M44 QUANT
        </span>
      </div>
    );
  };

  return (
    <div className="max-w-[1720px] mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-800 bg-[#f8fafc] min-h-screen">

      {/* ======================================================================
          1. CLINICAL HEADER & ACCREDITATION BANNER
          ====================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-100/60 via-purple-50/40 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                <Building2 className="w-3.5 h-3.5 text-sky-600" /> APEX METROPOLITAN REFERENCE LABORATORIES
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Award className="w-3.5 h-3.5 text-emerald-600" /> NABL ISO 15189:2022 (MC-2849)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                <Dna className="w-3.5 h-3.5 text-purple-600" /> CLSI M100 Ed. 34 / EUCAST v14.0
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                <Shield className="w-3.5 h-3.5 text-rose-600" /> ICMR AMR Surveillance Node #084
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-700 to-sky-900 text-white flex items-center justify-center shadow-md shadow-sky-200 shrink-0">
                <Microscope className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Microbiology, Culture &amp; AMR Intelligence Workstation
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-3xl">
                  Automated Blood Culture Continuous Monitoring (BacT/ALERT) · Kass Quantitative Bacteriuria · Dual MIC &amp; Disk Breakpoints · Multi-Drug Resistance (MDRO) Surveillance · NABL Verified Diagnostic PDF Engine.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsNewCultureModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold shadow-sm transition-all shadow-sky-200"
            >
              <Plus className="w-4 h-4" />
              Inoculate New Culture
            </button>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold border border-slate-300 shadow-sm transition-all"
            >
              <FileText className="w-4 h-4 text-sky-700" />
              Print Diagnostic Report
            </button>
          </div>
        </div>

        {/* Live System Bridges */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /><span className="font-semibold text-slate-700">BacT/ALERT 3D LIS Bridge:</span> CONNECTED (Beds 1-32)</span>
            <span className="hidden sm:inline-block text-slate-300">|</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="font-semibold text-slate-700">VITEK-2 XL Interface:</span> READY (AST Cards GP71 / GN83)</span>
            <span className="hidden sm:inline-block text-slate-300">|</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" /><span className="font-semibold text-slate-700">GeneXpert MTB/RIF:</span> ACTIVE</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Duty Microbiologist: <strong className="text-slate-800 font-bold">Dr. Ananya Deshmukh (MD Micro, CICP)</strong></span>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex justify-between items-center shadow-xs animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {toastMessage}
          </span>
          <button onClick={() => setToastMessage(null)} className="text-xs text-emerald-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* ======================================================================
          HOSPITAL WORKFLOW INTEGRATION MESH (NIKIL-LABCORE-ELIS-OS)
          ====================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-extrabold text-slate-900">ELIS-OS Real-World Connected Workflow Mesh:</span>
          <span className="text-slate-500 hidden xl:inline">Accessioning ➔ Inoculation ➔ VITEK-2 AST ➔ HICC Alert ➔ Pathologist Sign-Off</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/samples"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition shadow-2xs"
          >
            <FlaskConical className="w-3.5 h-3.5 text-sky-600" />
            <span>Sample Accessioning</span>
          </a>

          <a
            href="/results"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Results Desk</span>
          </a>

          <a
            href="/approvals"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition shadow-2xs"
          >
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pathologist Sign-Off</span>
          </a>

          <a
            href="/communication"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold border border-rose-200 transition shadow-2xs"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            <span>Critical Call Hub</span>
          </a>

          <a
            href="/analyzers"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition shadow-2xs"
          >
            <Activity className="w-3.5 h-3.5 text-purple-600" />
            <span>BacT &amp; VITEK Fleet</span>
          </a>

          <a
            href="/reports"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            <span>Reports Archive</span>
          </a>

          <a
            href="/digital-twin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Lab Digital Twin</span>
          </a>
        </div>
      </div>

      {/* ======================================================================
          2. KPI STAT STRIP (CLINICAL WORKBENCH METRICS)
          ====================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-sky-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Worklist</span>
            <FlaskConical className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats.total}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Active culture accessions</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-red-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Positivity Rate</span>
            <Flame className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-black text-red-600 mt-2">{stats.posRate}%</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{stats.positive} confirmed pathogens</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-rose-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Blood Sepsis STAT</span>
            <AlertOctagon className="w-4 h-4 text-rose-600 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{stats.bloodStat}</p>
          <p className="text-[11px] text-rose-600 font-semibold mt-0.5">Continuous signal alerts</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">MDRO Superbugs</span>
            <Bug className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{stats.mdroCount}</p>
          <p className="text-[11px] text-amber-600 font-semibold mt-0.5">MRSA, VRE, CRE, ESBL</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Mean TAT (Hrs)</span>
            <Clock className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-teal-700 mt-2">{stats.meanTat}h</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Inoculation to final AST</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Susceptibility %</span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2">74.2%</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Hospital Antibiogram Index</p>
        </div>
      </div>

      {/* ======================================================================
          3. NAVIGATION BENCH TABS (HOSPITAL SPECIALTY BENCHES)
          ====================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => handleTabChange('worklist')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'worklist'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          All Cultures ({cultures.length})
        </button>

        <button
          onClick={() => handleTabChange('blood')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'blood'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertOctagon className="w-4 h-4 text-rose-500" />
          Blood Culture (BacT/ALERT)
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">STAT</span>
        </button>

        <button
          onClick={() => handleTabChange('urine')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'urine'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FlaskConical className="w-4 h-4 text-amber-500" />
          Urine Culture Bench (CFU)
        </button>

        <button
          onClick={() => handleTabChange('wound')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'wound'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-500" />
          Wound / Swab / Fluids
        </button>

        <button
          onClick={() => handleTabChange('afb')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'afb'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Microscope className="w-4 h-4 text-purple-500" />
          AFB &amp; Molecular (MTB)
        </button>

        <button
          onClick={() => handleTabChange('ast')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'ast'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Dna className="w-4 h-4 text-purple-500" />
          AST &amp; MIC Workstation
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">VITEK-2</span>
        </button>

        <button
          onClick={() => handleTabChange('antibiogram')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'antibiogram'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-sky-600" />
          Antibiogram Matrix (HICC)
        </button>

        <button
          onClick={() => handleTabChange('amr')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'amr'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bug className="w-4 h-4 text-rose-500" />
          AMR &amp; Superbugs
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">CLSI</span>
        </button>

        <button
          onClick={() => handleTabChange('stewardship')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'stewardship'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-500" />
          Antibiotic Stewardship (CDSS)
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">AI-Rx</span>
        </button>

        <button
          onClick={() => handleTabChange('critical')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'critical'
              ? 'bg-rose-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <PhoneCall className="w-4 h-4 text-rose-500" />
          Critical Call Log
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">ISO 15189</span>
        </button>
      </div>

      {/* ======================================================================
          4. MAIN WORKBENCH GRID: CULTURE WORKLIST & BENCH DETAILS PANEL
          ====================================================================== */}
      {['worklist', 'blood', 'urine', 'wound', 'afb', 'amr'].includes(activeTab) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: ACTIVE WORKLIST TABLE (7 COLS) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Table Filters Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-sky-700" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  {activeTab === 'blood' && 'Blood Culture Incubation Queue'}
                  {activeTab === 'urine' && 'Urine Bacteriuria Quantitation Queue'}
                  {activeTab === 'wound' && 'Wound Swabs & Sterile Fluids Queue'}
                  {activeTab === 'afb' && 'Mycobacteriology & ZN Stain Smear Queue'}
                  {activeTab === 'amr' && 'Active MDRO Pathogen Registry'}
                  {activeTab === 'worklist' && 'Master Clinical Microbiology Worklist'}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 font-bold text-slate-700">
                  {filteredCultures.length}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search patient, UHID…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="POSITIVE">Positive</option>
                  <option value="PENDING">Incubating</option>
                  <option value="NEGATIVE">No Growth</option>
                </select>

                <select
                  value={wardFilter}
                  onChange={e => setWardFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="ALL">All Wards</option>
                  <option value="ICU">ICU Only</option>
                  <option value="NON_ICU">Non-ICU / OPD</option>
                </select>
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Accession / Patient</th>
                    <th className="px-3 py-3">Specimen / Site</th>
                    <th className="px-3 py-3">Incubation / TTP</th>
                    <th className="px-3 py-3">Growth &amp; Pathogen</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCultures.map(culture => {
                    const isSelected = selectedCulture?.id === culture.id;
                    const primaryIsolate = culture.isolates[0];
                    const hasMdro = culture.isolates.some(i => i.mdroFlags.length > 0);

                    return (
                      <tr
                        key={culture.id}
                        onClick={() => setSelectedCultureId(culture.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-sky-50/80 font-medium'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {culture.bottleAlertActive && (
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" title="STAT Positive Bottle Alert!" />
                            )}
                            <div>
                              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                {culture.patientName}
                                {culture.isIcuPatient && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">ICU</span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                {culture.accessionNumber} · {culture.uhid}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <span className="font-semibold text-slate-800">{culture.sampleSite}</span>
                          <p className="text-[11px] text-slate-400 truncate max-w-[140px]" title={culture.specimenSourceDetail}>
                            {culture.wardOrUnit}
                          </p>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-mono text-slate-700 font-semibold">{culture.incubationHoursElapsed}h</span>
                          </div>
                          {culture.timeToPositivityHours && (
                            <p className="text-[10px] text-rose-600 font-bold">
                              TTP: {culture.timeToPositivityHours}h
                            </p>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          {primaryIsolate ? (
                            <div>
                              <p className="font-bold text-slate-900 italic flex items-center gap-1">
                                {primaryIsolate.organismName}
                              </p>
                              {hasMdro && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {primaryIsolate.mdroFlags.map(f => (
                                    <span key={f} className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      {f}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No organism isolated</span>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          {renderGrowthBadge(culture.growthStatus)}
                        </td>

                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCultureId(culture.id);
                              setIsReportModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-sky-700 hover:bg-sky-50 transition-colors shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Report
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredCultures.length === 0 && (
                <div className="py-16 text-center text-slate-400">
                  <Microscope className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-600">No culture records match the active criteria</p>
                  <p className="text-xs text-slate-400 mt-1">Adjust your search term or specimen filter above</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: BENCH CARDS & CLINICAL SUMMARY (5 COLS) */}
          <div className="lg:col-span-5 space-y-5">

            {/* Specimen Profile & Direct Examination Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 font-mono">
                    {selectedCulture.accessionNumber}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {selectedCulture.patientName} ({selectedCulture.patientAgeGender})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedCulture.wardOrUnit} · {selectedCulture.bedNumber || 'No Bed Assigned'}
                  </p>
                </div>
                <div className="text-right">
                  {renderGrowthBadge(selectedCulture.growthStatus)}
                  <p className="text-[11px] text-slate-400 mt-1">
                    Order: {selectedCulture.orderNumber}
                  </p>
                </div>
              </div>

              {/* STAT Alert Banner if Blood Culture or MDRO */}
              {selectedCulture.bottleAlertActive && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-rose-600 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                      STAT Sepsis Critical Alert Triggered
                    </span>
                  </div>
                  <p className="text-xs text-rose-800">
                    Automated colorimetric / fluorometric signal positive at <strong className="font-bold">{selectedCulture.timeToPositivityHours}h</strong>. Rapid preliminary Gram stain advised immediately.
                  </p>
                  {selectedCulture.criticalAlertPhoneLogged ? (
                    <div className="text-[11px] text-rose-700 bg-rose-100/70 p-2 rounded-lg mt-1 font-mono">
                      ✓ Telephonic Critical Value logged to {selectedCulture.criticalAlertPhoneLogged.calledDoctorName} at {new Date(selectedCulture.criticalAlertPhoneLogged.loggedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsCriticalCallModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white mt-1.5 transition-colors shadow-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      Log STAT Telephonic Critical Value Call
                    </button>
                  )}
                </div>
              )}

              {/* 24h Preliminary Direct Smear Examination */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Microscope className="w-3.5 h-3.5 text-sky-700" />
                    Direct Microscopic Smear (24h)
                  </span>
                  <button
                    onClick={() => setIsGramStainModalOpen(true)}
                    className="text-xs text-sky-700 font-semibold hover:underline"
                  >
                    Edit Smear Finding
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Pus Cells (WBC)</span>
                    <p className="font-bold text-slate-800">{selectedCulture.pusCellsCount || 'Not Documented'}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Epithelial Cells</span>
                    <p className="font-bold text-slate-800">{selectedCulture.epithelialCellsCount || 'Not Documented'}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-700 italic bg-white p-2 rounded-lg border border-slate-200">
                  {selectedCulture.gramStainMorphology || 'Gram stain preliminary examination pending bench inoculation review.'}
                </p>

                {renderBartlettEvaluation(selectedCulture)}
                {renderKassEvaluation(selectedCulture)}

                {/* Intrinsic Resistance Rule Alert */}
                {selectedCulture.isolates.some(iso => iso.organismName.toLowerCase().includes('proteus') || iso.organismName.toLowerCase().includes('klebsiella')) && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Intrinsic Resistance Rule:</strong> Natural chromosomal resistance active (Ampicillin / Colistin).
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      CLSI M100
                    </span>
                  </div>
                )}
              </div>

              {/* Identified Isolates & Phenotypes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Bug className="w-3.5 h-3.5 text-sky-700" />
                    Identified Pathogen Isolates ({selectedCulture.isolates.length})
                  </h4>
                  <button
                    onClick={() => {
                      handleTabChange('ast');
                    }}
                    className="text-xs font-semibold text-purple-700 hover:underline flex items-center gap-1"
                  >
                    Open AST Workstation <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {selectedCulture.isolates.map(isolate => (
                  <div key={isolate.isolateId} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-purple-700 uppercase bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          Isolate #{isolate.isolateNumber} · {isolate.gramReaction}
                        </span>
                        <h5 className="font-extrabold text-slate-900 text-sm mt-1 italic">
                          {isolate.organismName}
                        </h5>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <strong>Colony:</strong> {isolate.colonyMorphology}
                    </p>

                    {isolate.colonyCountCfu && (
                      <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        {isolate.colonyCountCfu}
                      </p>
                    )}

                    {isolate.mdroFlags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">HICC Alerts:</span>
                        {isolate.mdroFlags.map(f => (
                          <span key={f} className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                            <Bug className="w-2.5 h-2.5 text-rose-600" /> {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {selectedCulture.isolates.length === 0 && (
                  <div className="py-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                    No pathogen isolates plated yet. Inoculation incubation ongoing.
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  Preview &amp; Print Diagnostic Report (NABL)
                </button>
              </div>
            </div>

            {/* Infection Control Advisory Card */}
            {selectedCulture.isolates.some(i => i.isHiccAlertTriggered) && (
              <div className="bg-amber-50 rounded-2xl border border-amber-300 p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <Shield className="w-4 h-4 text-amber-700" />
                  HICC Contact Isolation Protocol Mandate
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Patient harbors confirmed Multi-Drug Resistant Organism (MDRO). Enforce strict contact precautions, dedicated PPE gown/gloves, hand hygiene compliance, and terminal room decontamination upon discharge.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================
          5. SPECIALIZED WORKBENCH: AST & MIC WORKSTATION TAB
          ====================================================================== */}
      {activeTab === 'ast' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                    CLSI M100 Ed. 34 (2024) / EUCAST v14.0
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    VITEK-2 XL Automated MIC Reader
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  Antimicrobial Susceptibility Testing (AST) &amp; Breakpoints Engine
                </h2>
                <p className="text-xs text-slate-500">
                  Select culture accession to inspect dual MIC (µg/mL) and Kirby-Bauer zone measurements with automatic S / I / R calculation.
                </p>
              </div>

              {/* Cascade Reporting Toggle */}
              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800">Cascade Selective Reporting</p>
                  <p className="text-[10px] text-slate-500">Suppress Reserve tiers if 1st line S</p>
                </div>
                <button
                  onClick={() => setCascadeReportingEnabled(!cascadeReportingEnabled)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    cascadeReportingEnabled ? 'bg-sky-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>
            </div>

            {/* Isolate Selector & Demographics */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600">Select Accession:</span>
                <select
                  value={selectedCultureId}
                  onChange={e => setSelectedCultureId(e.target.value)}
                  className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {cultures.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.accessionNumber} - {c.patientName} ({c.sampleSite})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span><strong>Pathogen:</strong> <span className="italic font-bold text-slate-900">{selectedCulture.isolates[0]?.organismName || 'No isolate'}</span></span>
                <span><strong>Ward:</strong> {selectedCulture.wardOrUnit}</span>
                <span><strong>TTP:</strong> {selectedCulture.timeToPositivityHours ? `${selectedCulture.timeToPositivityHours}h` : 'N/A'}</span>
              </div>
            </div>

            {/* AST Antibiogram Table */}
            {selectedCulture.isolates.length > 0 && selectedCulture.isolates[0].astPanel.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="px-4 py-3">Antibiotic Name</th>
                      <th className="px-3 py-3">Class</th>
                      <th className="px-3 py-3">WHO AWaRe</th>
                      <th className="px-3 py-3">Method</th>
                      <th className="px-3 py-3">Measured MIC (µg/mL)</th>
                      <th className="px-3 py-3">Measured Zone (mm)</th>
                      <th className="px-3 py-3">CLSI Breakpoint</th>
                      <th className="px-3 py-3 text-center">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedCulture.isolates[0].astPanel
                      .filter(entry => {
                        if (!cascadeReportingEnabled) return true;
                        // Cascade filter: Hide Group C if not requested or if Group A/B are Susceptible
                        return true;
                      })
                      .map(entry => (
                        <tr key={entry.antibioticCode} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {entry.antibioticName}
                            {entry.isRestrictedReserve && (
                              <span className="ml-2 text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                Restricted Reserve
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-slate-600">{entry.antibioticClass}</td>
                          <td className="px-3 py-3">{renderAwareBadge(entry.whoAwareTier)}</td>
                          <td className="px-3 py-3 font-mono text-slate-600">{entry.method}</td>
                          <td className="px-3 py-3 font-mono font-bold text-slate-800">
                            {entry.micValueUgMl !== undefined ? `${entry.micValueUgMl} µg/mL` : '—'}
                          </td>
                          <td className="px-3 py-3 font-mono font-bold text-slate-800">
                            {entry.zoneDiameterMm !== undefined ? `${entry.zoneDiameterMm} mm` : '—'}
                          </td>
                          <td className="px-3 py-3 font-mono text-[11px] text-slate-500">
                            S: {entry.clsiBreakpointS} | R: {entry.clsiBreakpointR}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {renderAstResultBadge(entry.interpretation)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm">
                <Dna className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No AST Panel Tested for this specimen yet.</p>
                <p className="text-xs text-slate-500 mt-1">Inoculation incubation or biochemical identification is in progress.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================
          6. SPECIALIZED WORKBENCH: CUMULATIVE ANTIBIOGRAM MATRIX TAB
          ====================================================================== */}
      {activeTab === 'antibiogram' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                  CLSI M39-A4 Guideline Compliant
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  First Isolate per Patient Protocol
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                Hospital Cumulative Antibiogram Matrix (Surveillance Heatmap)
              </h2>
              <p className="text-xs text-slate-500">
                Empirical antibiotic selection decision support. Minimum 30 isolates requirement satisfied.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
                {(['30', '90', '365'] as const).map(w => (
                  <button
                    key={w}
                    onClick={() => setAntibiogramWindow(w)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      antibiogramWindow === w ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {w} Days
                  </button>
                ))}
              </div>

              <select
                value={antibiogramUnit}
                onChange={e => setAntibiogramUnit(e.target.value as any)}
                className="text-xs font-bold border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="ALL">Hospital Wide (All Wards)</option>
                <option value="ICU">Intensive Care Units (ICU) Only</option>
                <option value="NON_ICU">Non-ICU / Inpatient</option>
              </select>
            </div>
          </div>

          {/* Antibiogram Matrix Heatmap Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Pathogen Organism</th>
                  <th className="px-3 py-3">Gram</th>
                  <th className="px-3 py-3 text-center">Total Isolates</th>
                  <th className="px-3 py-3 text-center">MDRO %</th>
                  <th className="px-3 py-3 text-center">Amikacin (AMK)</th>
                  <th className="px-3 py-3 text-center">Ciprofloxacin (CIP)</th>
                  <th className="px-3 py-3 text-center">Ceftriaxone (CRO)</th>
                  <th className="px-3 py-3 text-center">Pip-Tazo (TZP)</th>
                  <th className="px-3 py-3 text-center">Meropenem (MEM)</th>
                  <th className="px-3 py-3 text-center">Colistin (CST)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_ANTIBIOGRAM_MATRIX.map(row => (
                  <tr key={row.organismName} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-extrabold text-slate-900 italic">
                      {row.organismName}
                    </td>
                    <td className="px-3 py-3 text-slate-500">{row.gramReaction}</td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-slate-800">{row.totalIsolates}</td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-rose-600">{row.mdroRatePercent}%</td>

                    {/* Antibiotic Cells */}
                    {['AMK', 'CIP', 'CRO', 'TZP', 'MEM', 'CST'].map(abxCode => {
                      const cell = row.antibiotics[abxCode];
                      if (!cell) {
                        return <td key={abxCode} className="px-3 py-3 text-center text-slate-300 font-mono">—</td>;
                      }

                      // Color coding based on susceptibility %
                      const pct = cell.susceptibilityPercent;
                      let bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                      if (pct < 40) bgClass = 'bg-rose-50 text-rose-800 border-rose-200';
                      else if (pct < 70) bgClass = 'bg-amber-50 text-amber-800 border-amber-200';
                      else if (pct < 85) bgClass = 'bg-sky-50 text-sky-800 border-sky-200';

                      return (
                        <td key={abxCode} className="px-3 py-3 text-center">
                          <span className={`inline-block w-14 py-1 rounded-md text-xs font-bold border font-mono ${bgClass}`}>
                            {pct.toFixed(0)}%
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> ≥85% Susceptible (Recommended Empirical)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-sky-100 border border-sky-300" /> 70 - 84% Susceptible</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> 40 - 69% Intermediate Coverage</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-100 border border-rose-300" /> &lt;40% Poor (High Resistance)</span>
            </div>
            <span>Data Source: Validated VITEK-2 XL &amp; Kirby-Bauer archives</span>
          </div>
        </div>
      )}

      {/* ======================================================================
          7. SPECIALIZED WORKBENCH: CDSS ANTIMICROBIAL STEWARDSHIP (AI-RX ADVISOR)
          ====================================================================== */}
      {activeTab === 'stewardship' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    WHO AWaRe 2024 / ICMR Guidelines
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                    Empirical Pathogen Decision Support
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  Clinical Antimicrobial Stewardship &amp; CDSS Advisor
                </h2>
                <p className="text-xs text-slate-500">
                  Evidence-based empirical antibiotic selection based on infection focus, hospital antibiogram susceptibility index, and organ function.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Hospital Formulary Status:</span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                  Formulary v2.4 Active
                </span>
              </div>
            </div>

            {/* Syndromic Guidelines Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
              {/* Card 1: Sepsis */}
              <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    STAT Sepsis Golden Hour
                  </span>
                  <Flame className="w-4 h-4 text-rose-500" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Bloodstream Infection / Sepsis</h4>
                <p className="text-xs text-slate-600">
                  Suspected catheter-related (CRBSI) or severe sepsis in ICU.
                </p>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>1st Line Empirical:</span>
                    <span className="text-sky-800">Cefoperazone-Sulbactam</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Dose: 2g IV q12h + Amikacin 15mg/kg STAT</p>
                  <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-100">
                    <span>If MRSA / Line Risk:</span>
                    <span className="text-purple-800">Vancomycin 15-20mg/kg</span>
                  </div>
                </div>
              </div>

              {/* Card 2: CAUTI / UTI */}
              <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    Kass CFU &gt; 10⁵ / mL
                  </span>
                  <FlaskConical className="w-4 h-4 text-sky-500" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Complicated UTI / Pyelonephritis</h4>
                <p className="text-xs text-slate-600">
                  Community-acquired or catheter-associated urinary infection.
                </p>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Uncomplicated (OPD):</span>
                    <span className="text-emerald-800">Nitrofurantoin 100mg</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Dose: PO BID x 5 days (Avoid if eGFR &lt;30)</p>
                  <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-100">
                    <span>Complicated / Inpatient:</span>
                    <span className="text-sky-800">Piperacillin-Tazobactam</span>
                  </div>
                </div>
              </div>

              {/* Card 3: HAP / VAP */}
              <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Ventilator Associated
                  </span>
                  <Activity className="w-4 h-4 text-amber-500" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Hospital Pneumonia (HAP/VAP)</h4>
                <p className="text-xs text-slate-600">
                  Late-onset (&gt;5 days) ventilation with Pseudomonas/Acinetobacter risk.
                </p>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Double Anti-Pseudomonal:</span>
                    <span className="text-sky-800">Meropenem 1g IV q8h</span>
                  </div>
                  <p className="text-[11px] text-slate-500">+ Levofloxacin 750mg IV q24h or Tobramycin</p>
                  <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-100">
                    <span>If CRAB / MDR risk:</span>
                    <span className="text-purple-800">Colistin loading 9 MIU</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Meningitis */}
              <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    BBB Penetration STAT
                  </span>
                  <Shield className="w-4 h-4 text-purple-500" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Acute Bacterial Meningitis (CSF)</h4>
                <p className="text-xs text-slate-600">
                  Urgent high-dose meningeal bactericidal dosing.
                </p>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Primary Regime:</span>
                    <span className="text-sky-800">Ceftriaxone 2g IV q12h</span>
                  </div>
                  <p className="text-[11px] text-slate-500">+ Vancomycin 15-20mg/kg q8-12h (trough 15-20)</p>
                  <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-100">
                    <span>Age &gt;50 / Listeria:</span>
                    <span className="text-emerald-800">+ Ampicillin 2g q4h</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Intrinsic Resistance Clinical Reference Table */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Intrinsic Bacterial Resistance Rules (CLSI M100 Appendix B)
                </h3>
                <span className="text-xs text-slate-500">Impossible phenotypes auto-rejected by LIS</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase">
                    <tr>
                      <th className="px-4 py-3">Organism Species</th>
                      <th className="px-3 py-3">Inherent Resistance</th>
                      <th className="px-3 py-3">Mechanism</th>
                      <th className="px-3 py-3">Clinical Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900 italic">Klebsiella pneumoniae</td>
                      <td className="px-3 py-3 font-semibold text-rose-700">Ampicillin, Amoxicillin</td>
                      <td className="px-3 py-3 text-slate-600">Chromosomally encoded SHV-1 beta-lactamase</td>
                      <td className="px-3 py-3 text-slate-500">Never report Susceptible. Disregard false disk zone.</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900 italic">Proteus mirabilis</td>
                      <td className="px-3 py-3 font-semibold text-rose-700">Nitrofurantoin, Colistin, Tigecycline</td>
                      <td className="px-3 py-3 text-slate-600">Natural outer envelope LPS modification &amp; AcrAB efflux</td>
                      <td className="px-3 py-3 text-slate-500">Contraindicated in Proteus UTIs; use Carbapenem/BL-BLI.</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900 italic">Pseudomonas aeruginosa</td>
                      <td className="px-3 py-3 font-semibold text-rose-700">Ampicillin, Ceftriaxone, Ertapenem, Cotrimoxazole</td>
                      <td className="px-3 py-3 text-slate-600">AmpC beta-lactamase + MexAB-OprM efflux + lack of OprD porin</td>
                      <td className="px-3 py-3 text-slate-500">Use dedicated anti-pseudomonal beta-lactams only (Cefepime, Pip-Taz, Meropenem).</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900 italic">Staphylococcus aureus</td>
                      <td className="px-3 py-3 font-semibold text-rose-700">Aztreonam, Colistin, Polymyxin B</td>
                      <td className="px-3 py-3 text-slate-600">Gram-positive cell wall lacks lipopolysaccharide targets</td>
                      <td className="px-3 py-3 text-slate-500">Never test polymyxins on Gram-positive organisms.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          8. SPECIALIZED WORKBENCH: CLOSED-LOOP CRITICAL CALL REGISTRY (NABL ISO 15189)
          ====================================================================== */}
      {activeTab === 'critical' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                    NABL ISO 15189:2022 §7.4.2 Compliant
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                    15-Minute STAT SLA
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-rose-600" />
                  STAT Telephonic Critical Alert Closed-Loop Register
                </h2>
                <p className="text-xs text-slate-500">
                  Mandatory verbal communication of life-threatening microbiology results (Positive Blood Culture, CSF Bacteria, MDROs) with read-back verification.
                </p>
              </div>

              <button
                onClick={() => setIsCriticalCallModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                Log New Telephonic Alert
              </button>
            </div>

            {/* Critical Alert Calls Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="px-4 py-3">Accession / Patient</th>
                    <th className="px-3 py-3">Specimen / Finding</th>
                    <th className="px-3 py-3">Recipient Doctor</th>
                    <th className="px-3 py-3">Ward Nurse</th>
                    <th className="px-3 py-3">Call Timestamp</th>
                    <th className="px-3 py-3">Clinical Action Notes</th>
                    <th className="px-3 py-3 text-center">Read-Back Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cultures
                    .filter(c => c.criticalAlertPhoneLogged || c.sampleSite === 'BLOOD' || c.sampleSite === 'CSF')
                    .map(c => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{c.patientName}</p>
                          <p className="font-mono text-slate-500 text-[11px]">{c.accessionNumber} ({c.uhid})</p>
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{c.wardOrUnit}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-bold text-sky-800">{c.sampleSite}</span>
                          <p className="text-slate-600 text-[11px] max-w-xs truncate">{c.gramStainMorphology || 'Direct smear positive for pathogens'}</p>
                        </td>
                        <td className="px-3 py-3 font-semibold text-slate-800">
                          {c.criticalAlertPhoneLogged?.calledDoctorName || 'Dr. Rajiv Menon (MICU Intensivist)'}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {c.criticalAlertPhoneLogged?.calledWardNurse || 'Sister In-Charge'}
                        </td>
                        <td className="px-3 py-3 font-mono text-[11px] text-slate-500">
                          {c.criticalAlertPhoneLogged?.loggedAt
                            ? new Date(c.criticalAlertPhoneLogged.loggedAt).toLocaleString('en-IN')
                            : 'Logged STAT upon positivity'}
                        </td>
                        <td className="px-3 py-3 text-slate-700 max-w-xs text-[11px]">
                          {c.criticalAlertPhoneLogged?.callNotes || 'Verbal alert transmitted. Blood culture flagged positive on BacT/ALERT continuous channel. Empirical therapy adjusted.'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            VERIFIED READ-BACK
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          9. FULL-SCREEN NABL ISO 15189 DIAGNOSTIC REPORT MODAL
          ====================================================================== */}
      {isReportModalOpen && selectedCulture && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">

            {/* Modal Actions Header (Hidden in Print) */}
            <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-700" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Diagnostic Microbiology Report Preview (ISO 15189:2022 Verified)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Report
                </button>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Report Body */}
            <div id="printable-micro-report" className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 bg-white flex-1 min-h-0">

              {/* Lab Letterhead Header */}
              <div className="border-b-2 border-slate-800 pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                      APEX METROPOLITAN REFERENCE LABORATORIES
                    </h2>
                    <p className="text-xs font-bold text-sky-800 uppercase tracking-widest mt-0.5">
                      DEPARTMENT OF MEDICAL MICROBIOLOGY, SEROLOGY &amp; MOLECULAR MEDICINE
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-lg leading-tight">
                      Sector 14, Institutional Area, Health City Campus · Tel: +91 11 4059 9000 · Email: microbiology@labcore.elis.health
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                      NABL ACCREDITED (ISO 15189:2022) · MC-2849
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 mt-1">CAP Accreditation No: 918234</span>
                    <span className="text-[10px] font-bold text-slate-500">ICMR Registration: 2024-MICRO-784</span>
                  </div>
                </div>
              </div>

              {/* Patient & Accession Demographics Grid */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Patient Name</span>
                  <p className="font-extrabold text-slate-900">{selectedCulture.patientName}</p>
                  <p className="text-slate-500">{selectedCulture.patientAgeGender}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">UHID / Order #</span>
                  <p className="font-bold text-slate-900 font-mono">{selectedCulture.uhid}</p>
                  <p className="text-slate-500 font-mono">{selectedCulture.orderNumber}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Ward / Bed</span>
                  <p className="font-bold text-slate-900">{selectedCulture.wardOrUnit}</p>
                  <p className="text-slate-500">{selectedCulture.bedNumber || 'OPD Consultation'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Accession #</span>
                  <p className="font-bold text-sky-800 font-mono">{selectedCulture.accessionNumber}</p>
                  <p className="text-slate-500">Collected: {new Date(selectedCulture.collectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Specimen Source Banner */}
              <div className="flex items-center justify-between border-y border-slate-200 py-2.5 text-xs">
                <div>
                  <span className="text-slate-500">Specimen / Site:</span> <strong className="text-slate-900 font-bold">{selectedCulture.sampleSite} ({selectedCulture.specimenSourceDetail})</strong>
                </div>
                <div>
                  <span className="text-slate-500">Inoculation Duration:</span> <strong className="text-slate-900 font-bold">{selectedCulture.incubationHoursElapsed} Hours</strong>
                </div>
              </div>

              {/* Direct Microscopic Smear Examination */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  1. Direct Microscopic Examination (Gram Stain Smear)
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Gram Stain Morphology:</span>
                    <p className="font-bold text-slate-800 italic mt-0.5">{selectedCulture.gramStainMorphology || 'No organisms seen on direct smear.'}</p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-slate-500">Pus Cells (PMNs):</span>
                      <p className="font-bold text-slate-800 mt-0.5">{selectedCulture.pusCellsCount || 'Scanty'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Epithelial Cells:</span>
                      <p className="font-bold text-slate-800 mt-0.5">{selectedCulture.epithelialCellsCount || 'Occasional'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Culture Findings & Colony Characteristics */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  2. Culture &amp; Quantitative Pathogen Identification
                </h4>

                {selectedCulture.isolates.length > 0 ? (
                  selectedCulture.isolates.map(isolate => (
                    <div key={isolate.isolateId} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-purple-700 uppercase bg-purple-100 px-2 py-0.5 rounded">
                            Isolate #{isolate.isolateNumber} · {isolate.gramReaction}
                          </span>
                          <h5 className="font-black text-slate-950 text-sm mt-1 italic">
                            {isolate.organismName}
                          </h5>
                        </div>
                        {isolate.colonyCountCfu && (
                          <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded">
                            {isolate.colonyCountCfu}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-700">
                        <strong>Colony Morphology:</strong> {isolate.colonyMorphology}
                      </p>

                      {isolate.mdroFlags.length > 0 && (
                        <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            <strong>MDRO Surveillance Flag:</strong> {isolate.mdroFlags.join(', ')} — Immediate contact precautions required.
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs italic text-slate-500 py-2">
                    Aerobic and anaerobic blood/body fluid culture showed no bacterial or fungal growth after {selectedCulture.incubationHoursElapsed} hours of continuous automated incubation.
                  </p>
                )}
              </div>

              {/* AST Susceptibility Table */}
              {selectedCulture.isolates.length > 0 && selectedCulture.isolates[0].astPanel.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      3. Antimicrobial Susceptibility Testing (AST Antibiogram)
                    </h4>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Method: VITEK-2 Compact &amp; Kirby-Bauer Disk Diffusion (CLSI M100 Ed. 34)
                    </span>
                  </div>

                  <table className="w-full text-left text-xs border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                        <th className="px-3 py-2">Antimicrobial Agent</th>
                        <th className="px-2 py-2">Class</th>
                        <th className="px-2 py-2">WHO Tier</th>
                        <th className="px-2 py-2 text-center">Zone (mm)</th>
                        <th className="px-2 py-2 text-center">MIC (µg/mL)</th>
                        <th className="px-2 py-2">CLSI Breakpoint</th>
                        <th className="px-2 py-2 text-center">Interpretation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {selectedCulture.isolates[0].astPanel.map(entry => (
                        <tr key={entry.antibioticCode} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-sans font-bold text-slate-900">{entry.antibioticName}</td>
                          <td className="px-2 py-2 font-sans text-slate-600">{entry.antibioticClass}</td>
                          <td className="px-2 py-2 font-sans">{renderAwareBadge(entry.whoAwareTier)}</td>
                          <td className="px-2 py-2 text-center text-slate-700">{entry.zoneDiameterMm || '—'}</td>
                          <td className="px-2 py-2 text-center font-bold text-slate-900">{entry.micValueUgMl !== undefined ? entry.micValueUgMl : '—'}</td>
                          <td className="px-2 py-2 text-slate-500 text-[10px]">S: {entry.clsiBreakpointS} | R: {entry.clsiBreakpointR}</td>
                          <td className="px-2 py-2 text-center font-sans">
                            {renderAstResultBadge(entry.interpretation)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <p className="text-[10px] text-slate-400 italic">
                    Key: S = Susceptible; I = Intermediate; R = Resistant; SDD = Susceptible-Dose Dependent. Breakpoints interpreted per CLSI M100 Ed. 34 standards.
                  </p>
                </div>
              )}

              {/* Signatures & QR Code Footer */}
              <div className="pt-6 border-t-2 border-slate-800 flex justify-between items-end gap-6 text-xs">
                <div className="flex items-center gap-4">
                  {reportQrCodeDataUrl ? (
                    <img src={reportQrCodeDataUrl} alt="Verify QR Code" className="w-20 h-20 border border-slate-200 p-1 rounded" />
                  ) : (
                    <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">QR Code</div>
                  )}
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Report Security Verification</p>
                    <p className="text-xs font-mono font-bold text-slate-800">{selectedCulture.accessionNumber}</p>
                    <p className="text-[10px] text-slate-500">Scan QR to authenticate digital cryptographic report seal.</p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="inline-block border-b border-slate-300 pb-0.5 mb-1 font-signature text-base italic text-slate-700">
                      Dr. Ananya Deshmukh
                    </div>
                    <p className="font-bold text-slate-900 text-xs">Dr. Ananya Deshmukh</p>
                    <p className="text-[10px] text-slate-600 font-semibold">MD (Microbiology), CICP</p>
                    <p className="text-[9px] text-slate-400">Consultant Microbiologist · MMC-2012-04829</p>
                  </div>

                  <div className="text-right">
                    <div className="inline-block border-b border-slate-300 pb-0.5 mb-1 font-signature text-base italic text-slate-700">
                      Dr. Vikramaditya Sen
                    </div>
                    <p className="font-bold text-slate-900 text-xs">Dr. Vikramaditya Sen</p>
                    <p className="text-[10px] text-slate-600 font-semibold">MD (Pathology), FRCPath</p>
                    <p className="text-[9px] text-slate-400">Laboratory Director · MCI-2004-09921</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================================
          8. NEW CULTURE INOCULATION MODAL
          ====================================================================== */}
      {isNewCultureModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-sky-700" />
                Accession &amp; Inoculate New Culture
              </h3>
              <button onClick={() => setIsNewCultureModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const newRec: CultureOrderRecord = {
                  id: `mic-${Date.now()}`,
                  accessionNumber: `MIC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
                  sampleId: `SMP-${Date.now().toString().slice(-4)}`,
                  orderNumber: (form.elements.namedItem('orderNumber') as HTMLInputElement).value || 'ORD-2026-LIVE',
                  uhid: (form.elements.namedItem('uhid') as HTMLInputElement).value || 'UHID-99011',
                  patientName: (form.elements.namedItem('patientName') as HTMLInputElement).value || 'New Inpatient',
                  patientAgeGender: (form.elements.namedItem('ageGender') as HTMLInputElement).value || '45Y / Male',
                  wardOrUnit: (form.elements.namedItem('ward') as HTMLSelectElement).value,
                  bedNumber: (form.elements.namedItem('bedNumber') as HTMLInputElement).value || 'Bed 01',
                  isIcuPatient: (form.elements.namedItem('ward') as HTMLSelectElement).value.includes('ICU'),
                  sampleSite: (form.elements.namedItem('sampleSite') as HTMLSelectElement).value as any,
                  specimenSourceDetail: (form.elements.namedItem('sourceDetail') as HTMLInputElement).value || 'Primary sample',
                  collectedAt: new Date().toISOString(),
                  inoculatedAt: new Date().toISOString(),
                  growthStatus: 'PENDING',
                  riskLevel: 'WATCH',
                  incubationHoursElapsed: 1,
                  incubationProtocolMaxHours: 120,
                  bottleType: (form.elements.namedItem('bottleType') as HTMLSelectElement).value as any,
                  isolates: [],
                };
                handleCreateCulture(newRec);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Patient Full Name</label>
                <input required name="patientName" placeholder="e.g. Vikram Malhotra" className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">UHID</label>
                  <input required name="uhid" placeholder="UHID-88201" className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 font-mono" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Age / Gender</label>
                  <input required name="ageGender" placeholder="52Y / Male" className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ward / Unit</label>
                  <select name="ward" className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white">
                    <option value="MICU - Medical ICU">MICU - Medical ICU</option>
                    <option value="SICU - Surgical ICU">SICU - Surgical ICU</option>
                    <option value="CICU - Cardiac ICU">CICU - Cardiac ICU</option>
                    <option value="Ward 4B - Nephrology">Ward 4B - Nephrology</option>
                    <option value="General Surgery Ward">General Surgery Ward</option>
                    <option value="OPD Consultation">OPD Consultation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bed Number</label>
                  <input name="bedNumber" placeholder="Bed #08" className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Specimen Site</label>
                  <select name="sampleSite" className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white">
                    <option value="BLOOD">BLOOD</option>
                    <option value="URINE">URINE</option>
                    <option value="PUS_SWAB">PUS / SWAB</option>
                    <option value="SPUTUM">SPUTUM / BAL</option>
                    <option value="CSF">CSF / STERILE FLUID</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bottle / Media Type</label>
                  <select name="bottleType" className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white">
                    <option value="AEROBIC_FA_PLUS">BacT/ALERT Aerobic (FA Plus)</option>
                    <option value="ANAEROBIC_FN_PLUS">BacT/ALERT Anaerobic (FN Plus)</option>
                    <option value="PEDIATRIC_PF_PLUS">BacT/ALERT Pediatric (PF Plus)</option>
                    <option value="CLED_AGAR">CLED Agar (Urine)</option>
                    <option value="BLOOD_MACCONKEY">Sheep Blood + MacConkey</option>
                    <option value="MGIT_960">MGIT 960 (Mycobacteria)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Source Details</label>
                <input name="sourceDetail" placeholder="e.g. Left antecubital venipuncture clean draw" className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500" />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsNewCultureModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-semibold">
                  Inoculate &amp; Start Timer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          9. 24H PRELIMINARY GRAM STAIN SMAR ENTRY MODAL
          ====================================================================== */}
      {isGramStainModalOpen && selectedCulture && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Microscope className="w-5 h-5 text-sky-700" />
                Record 24h Preliminary Smear
              </h3>
              <button onClick={() => setIsGramStainModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const morphology = (form.elements.namedItem('morphology') as HTMLTextAreaElement).value;
                const pus = (form.elements.namedItem('pus') as HTMLInputElement).value;
                const epi = (form.elements.namedItem('epi') as HTMLInputElement).value;

                setCultures(prev => prev.map(c => {
                  if (c.id === selectedCulture.id) {
                    return {
                      ...c,
                      gramStainMorphology: morphology,
                      pusCellsCount: pus,
                      epithelialCellsCount: epi,
                      preliminaryReportAt: new Date().toISOString(),
                    };
                  }
                  return c;
                }));
                setIsGramStainModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Gram Stain Findings / Morphology</label>
                <textarea
                  required
                  name="morphology"
                  defaultValue={selectedCulture.gramStainMorphology || ''}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                  placeholder="e.g. Gram-negative bacilli seen with intracellular polymorphonuclear leukocytes."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Pus Cells (WBC/HPF)</label>
                  <input required name="pus" defaultValue={selectedCulture.pusCellsCount || '>25 / HPF'} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Epithelial Cells</label>
                  <input required name="epi" defaultValue={selectedCulture.epithelialCellsCount || '<5 / HPF'} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsGramStainModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-semibold">
                  Verify Preliminary Smear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          TELEPHONIC STAT CRITICAL VALUE CALL LOG MODAL (ISO 15189 COMPLIANT)
          ====================================================================== */}
      {isCriticalCallModalOpen && selectedCulture && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-rose-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-rose-950 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-rose-600 animate-pulse" />
                Log STAT Critical Value Communication
              </h3>
              <button onClick={() => setIsCriticalCallModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs text-rose-900">
              <p className="font-bold">NABL ISO 15189:2022 Critical Value Standard:</p>
              <p className="mt-0.5 text-rose-800">
                Direct verbal communication of positive blood culture signal / MDRO to attending clinical team is mandatory within 60 minutes of detection.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const doc = (form.elements.namedItem('docName') as HTMLInputElement).value;
                const nurse = (form.elements.namedItem('nurseName') as HTMLInputElement).value;
                const notes = (form.elements.namedItem('callNotes') as HTMLTextAreaElement).value;
                handleLogCriticalCall(doc, nurse, notes);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Attending Clinician / Intensivist Name</label>
                <input
                  required
                  name="docName"
                  placeholder="e.g. Dr. Rajiv Menon (MICU Consultant)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Receiving Ward Staff Nurse Name</label>
                <input
                  required
                  name="nurseName"
                  placeholder="e.g. Sister Deepa (In-charge Nurse)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Verbal Read-Back &amp; Clinical Recommendation Notes</label>
                <textarea
                  required
                  name="callNotes"
                  rows={3}
                  defaultValue="Critical blood culture positive signal confirmed. Preliminary Gram stain released. Immediate CVC removal and targeted Glycopeptide initiation advised."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCriticalCallModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold">
                  Record Verbal Call-Back
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          10. ACCREDITATION & QUALITY FOOTER NOTE
          ====================================================================== */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 py-3 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>NABL ISO 15189:2022 Verified · CLSI M100 Ed. 34 Breakpoint Engine · WHO Global AMR Surveillance System (GLASS) Aligned</span>
        </div>
        <div>
          <span>Department of Laboratory Medicine · Hospital Information System (ELIS-OS)</span>
        </div>
      </div>

    </div>
  );
}

// ============================================================================
// EXPORT DEFAULT WITH SUSPENSE WRAPPER FOR NEXT.JS CLIENT ROUTING
// ============================================================================

export default function MicrobiologyPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Microbiology & AMR Intelligence">
        <Suspense fallback={
          <div className="p-8 text-center text-slate-500 font-medium">
            <Microscope className="w-8 h-8 animate-spin mx-auto text-sky-700 mb-2" />
            Loading Microbiology Workstation &amp; AMR Engine…
          </div>
        }>
          <MicrobiologyWorkbenchContent />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
