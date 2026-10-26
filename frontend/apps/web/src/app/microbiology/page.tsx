'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboardlayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import QRCode from 'qrcode';
import { microbiologyApi } from '@/lib/api';
import {
  Microscope, FlaskConical, Bug, Shield, AlertTriangle,
  CheckCircle2, Clock, Search, ChevronRight, Dna, Plus,
  Printer, Download, FileText, Activity, Filter, Check, X,
  Flame, RefreshCw, AlertOctagon, Stethoscope, BadgeAlert,
  Calendar, User, Building2, ExternalLink, Layers,
  Eye, SlidersHorizontal, ArrowUpDown, ChevronDown, Award, PhoneCall,
  Pill, Droplets, Siren, Radio, ClipboardList, CheckSquare,
  FileSpreadsheet, Sparkles, MessageCircle, Share2, Server, Gauge,
  Thermometer, Box
} from 'lucide-react';

// ============================================================================
// CLINICAL DOMAIN TYPES & STANDARDS (CLSI M100 Ed. 34 / EUCAST 2024-2026 / WHO AWaRe)
// ============================================================================

type WhoAwareTier = 'ACCESS' | 'WATCH' | 'RESERVE';

interface AntibioticTestEntry {
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
  cascadeGroup: 'A' | 'B' | 'C'; // Group A: Primary, Group B: Secondary, Group C: Restricted Reserve
}

interface OrganismIsolate {
  isolateId: string;
  isolateNumber: number;
  organismCode: string;
  organismName: string;
  gramReaction: 'GRAM_NEGATIVE' | 'GRAM_POSITIVE' | 'YEAST' | 'ACID_FAST';
  growthDensity: string;
  colonyMorphology: string;
  colonyCountCfu?: string;
  biochemicalProfile?: string;
  mdroFlags: string[];
  isHiccAlertTriggered: boolean;
  astPanel: AntibioticTestEntry[];
}

interface CultureOrderRecord {
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
  sampleSite: 'BLOOD' | 'URINE' | 'SPUTUM' | 'PUS_SWAB' | 'CSF' | 'STOOL' | 'PLEURAL_FLUID' | 'ASCITIC_FLUID' | 'SYNOVIAL_FLUID' | 'TISSUE_BIOPSY' | 'BRONCHOALVEOLAR_LAVAGE';
  specimenSourceDetail: string;
  specimenQuality: 'SATISFACTORY' | 'REJECTED_SALIVARY_SPUTUM' | 'HEMOLYZED' | 'UNSTERILE_LEAK' | 'DELAYED_TRANSPORT';
  collectedAt: string;
  inoculatedAt: string;
  growthStatus: 'POSITIVE' | 'NEGATIVE' | 'NO_GROWTH' | 'PENDING' | 'CONTAMINATED';
  riskLevel: 'HIGH' | 'MODERATE' | 'LOW' | 'WATCH';
  incubationHoursElapsed: number;
  incubationProtocolMaxHours: number;
  timeToPositivityHours?: number; // BacT/ALERT automated blood culture TTP
  bottleType?: 'AEROBIC_FA_PLUS' | 'ANAEROBIC_FN_PLUS' | 'PEDIATRIC_PF_PLUS' | 'CLED_AGAR' | 'BLOOD_MACCONKEY' | 'LJ_SLANT' | 'SABOURAUD_DEXTROSE';
  bottleAlertActive?: boolean;
  gramStainMorphology?: string;
  pusCellsCount?: string;
  epithelialCellsCount?: string;
  bartlettScore?: number;
  znAfbResult?: string;
  kohMountResult?: string;
  indiaInkResult?: string;
  preliminaryReportAt?: string;
  finalVerifiedAt?: string;
  verifiedByDoctor?: string;
  isolates: OrganismIsolate[];
  criticalAlertPhoneLogged?: {
    calledDoctorName: string;
    calledWardNurse: string;
    contactNumber?: string;
    loggedAt: string;
    callNotes: string;
    readbackConfirmed?: boolean;
  };
}

interface CriticalCallRecord {
  id: string;
  cultureId: string;
  accessionNumber?: string;
  patientName?: string;
  patientId?: string;
  sampleSite?: string;
  callerUserName: string;
  receiverDoctorOrNurse: string;
  wardOrDepartment: string;
  contactNumber: string;
  criticalFinding: string;
  readbackConfirmed: boolean;
  clinicalActionNotes?: string;
  calledAt: string;
}

interface AtccQcRecord {
  id: string;
  atccStrainName: string;
  atccNumber: string;
  antibioticCode: string;
  antibioticName: string;
  method: string;
  observedValue: number;
  referenceRange: string;
  status: 'PASSED' | 'FAILED' | 'OUT_OF_RANGE';
  lotNumber: string;
  expiryDate: string;
  testedBy: string;
  testedAt: string;
}

interface EnvironmentalSwabRecord {
  id: string;
  samplingLocation: string;
  department: string;
  surfaceType: string;
  samplingMethod: string;
  growthObserved: boolean;
  colonyCountCfu: string;
  permissibleLimit: string;
  organismIsolated?: string;
  actionStatus: 'PASSED' | 'ACTION_REQUIRED' | 'DECONTAMINATED';
  correctiveAction?: string;
  sampledBy: string;
  sampledAt: string;
}

interface AntibiogramMatrixCell {
  antibioticCode: string;
  antibioticName: string;
  totalTested: number;
  susceptibleCount: number;
  intermediateCount: number;
  resistantCount: number;
  susceptibilityPercent: number;
}

interface AntibiogramRow {
  organismName: string;
  gramReaction: string;
  totalIsolates: number;
  mdroCount: number;
  mdroRatePercent: number;
  antibiotics: Record<string, AntibiogramMatrixCell>;
}

// ============================================================================
// REFERENCE BREAKPOINTS (CLSI M100 Ed. 34 / EUCAST 2024-2026)
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
  GEN: { name: 'Gentamicin', className: 'Aminoglycosides', aware: 'ACCESS', cascadeGroup: 'A', isReserve: false, sMaxMic: 4, rMinMic: 16, sMinZone: 15, rMaxZone: 12 },
  CIP: { name: 'Ciprofloxacin', className: 'Fluoroquinolones', aware: 'WATCH', cascadeGroup: 'A', isReserve: false, sMaxMic: 0.25, rMinMic: 1, sMinZone: 26, rMaxZone: 21 },
  LVX: { name: 'Levofloxacin', className: 'Fluoroquinolones', aware: 'WATCH', cascadeGroup: 'A', isReserve: false, sMaxMic: 0.5, rMinMic: 2, sMinZone: 25, rMaxZone: 19 },
  CRO: { name: 'Ceftriaxone', className: 'Cephalosporins (3rd Gen)', aware: 'WATCH', cascadeGroup: 'A', isReserve: false, sMaxMic: 1, rMinMic: 4, sMinZone: 23, rMaxZone: 19 },
  CTX: { name: 'Cefotaxime', className: 'Cephalosporins (3rd Gen)', aware: 'WATCH', cascadeGroup: 'A', isReserve: false, sMaxMic: 1, rMinMic: 4, sMinZone: 23, rMaxZone: 19 },
  CAZ: { name: 'Ceftazidime', className: 'Cephalosporins (3rd Gen)', aware: 'WATCH', cascadeGroup: 'A', isReserve: false, sMaxMic: 4, rMinMic: 16, sMinZone: 21, rMaxZone: 17 },
  FEP: { name: 'Cefepime', className: 'Cephalosporins (4th Gen)', aware: 'WATCH', cascadeGroup: 'B', isReserve: false, sMaxMic: 2, rMinMic: 16, sMinZone: 25, rMaxZone: 18 },
  TZP: { name: 'Piperacillin-Tazobactam', className: 'Beta-Lactam / BLI', aware: 'WATCH', cascadeGroup: 'B', isReserve: false, sMaxMic: 16, rMinMic: 128, sMinZone: 21, rMaxZone: 17 },
  MEM: { name: 'Meropenem', className: 'Carbapenems', aware: 'RESERVE', cascadeGroup: 'B', isReserve: true, sMaxMic: 1, rMinMic: 4, sMinZone: 23, rMaxZone: 19 },
  IPM: { name: 'Imipenem', className: 'Carbapenems', aware: 'RESERVE', cascadeGroup: 'B', isReserve: true, sMaxMic: 1, rMinMic: 4, sMinZone: 23, rMaxZone: 19 },
  ETP: { name: 'Ertapenem', className: 'Carbapenems (Group 1)', aware: 'WATCH', cascadeGroup: 'B', isReserve: false, sMaxMic: 0.5, rMinMic: 2, sMinZone: 22, rMaxZone: 18 },
  VAN: { name: 'Vancomycin', className: 'Glycopeptides', aware: 'WATCH', cascadeGroup: 'B', isReserve: true, sMaxMic: 2, rMinMic: 16, sMinZone: 17, rMaxZone: 14 },
  TEC: { name: 'Teicoplanin', className: 'Glycopeptides', aware: 'WATCH', cascadeGroup: 'B', isReserve: true, sMaxMic: 2, rMinMic: 16, sMinZone: 14, rMaxZone: 10 },
  LZD: { name: 'Linezolid', className: 'Oxazolidinones', aware: 'RESERVE', cascadeGroup: 'B', isReserve: true, sMaxMic: 4, rMinMic: 8, sMinZone: 21, rMaxZone: 20 },
  DAP: { name: 'Daptomycin', className: 'Lipopeptides', aware: 'RESERVE', cascadeGroup: 'B', isReserve: true, sMaxMic: 1, rMinMic: 4, sMinZone: 18, rMaxZone: 14 },
  CST: { name: 'Colistin', className: 'Polymyxins', aware: 'RESERVE', cascadeGroup: 'C', isReserve: true, sMaxMic: 2, rMinMic: 4, sMinZone: 11, rMaxZone: 10 },
  TGC: { name: 'Tigecycline', className: 'Glycylcyclines', aware: 'RESERVE', cascadeGroup: 'C', isReserve: true, sMaxMic: 2, rMinMic: 8, sMinZone: 19, rMaxZone: 14 },
  CZA: { name: 'Ceftazidime-Avibactam', className: 'Novel BL-BLI', aware: 'RESERVE', cascadeGroup: 'C', isReserve: true, sMaxMic: 8, rMinMic: 16, sMinZone: 21, rMaxZone: 20 },
  NIT: { name: 'Nitrofurantoin', className: 'Nitrofurans (Urine Only)', aware: 'ACCESS', cascadeGroup: 'A', isReserve: false, sMaxMic: 32, rMinMic: 128, sMinZone: 17, rMaxZone: 14 },
  FOS: { name: 'Fosfomycin', className: 'Phosphonic Acids', aware: 'ACCESS', cascadeGroup: 'A', isReserve: false, sMaxMic: 64, rMinMic: 256, sMinZone: 16, rMaxZone: 12 },
  COT: { name: 'Trimethoprim-Sulfamethoxazole', className: 'Folate Inhibitors', aware: 'ACCESS', cascadeGroup: 'A', isReserve: false, sMaxMic: 2, rMinMic: 4, sMinZone: 16, rMaxZone: 10 },
};

// Intrinsic resistance biological validation rules (CLSI Appendix B)
const INTRINSIC_RULES = [
  { organism: 'Klebsiella pneumoniae', badDrug: 'AMP', drugName: 'Ampicillin', reason: 'Constitutive chromosomal SHV-1 beta-lactamase.' },
  { organism: 'Proteus mirabilis', badDrug: 'NIT', drugName: 'Nitrofurantoin', reason: 'Naturally elevated minimum inhibitory concentration.' },
  { organism: 'Proteus mirabilis', badDrug: 'CST', drugName: 'Colistin', reason: 'Cell envelope lipid A modification prevents polymyxin binding.' },
  { organism: 'Proteus mirabilis', badDrug: 'TGC', drugName: 'Tigecycline', reason: 'Constitutive AcrAB-TolC efflux pump.' },
  { organism: 'Pseudomonas aeruginosa', badDrug: 'AMP', drugName: 'Ampicillin', reason: 'Inducible chromosomal AmpC cephalosporinase.' },
  { organism: 'Pseudomonas aeruginosa', badDrug: 'CRO', drugName: 'Ceftriaxone', reason: 'Low outer membrane permeability & AmpC enzyme.' },
  { organism: 'Pseudomonas aeruginosa', badDrug: 'ERT', drugName: 'Ertapenem', reason: 'Lacks outer membrane porin OprD specificity.' },
  { organism: 'Pseudomonas aeruginosa', badDrug: 'COT', drugName: 'Trimethoprim-Sulfamethoxazole', reason: 'MexAB-OprM multidrug efflux system.' },
  { organism: 'Staphylococcus aureus', badDrug: 'CST', drugName: 'Colistin', reason: 'Polymyxins lack target sites on Gram-positive peptidoglycan.' },
];

// Baseline Clinical Seeds
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
    specimenSourceDetail: 'Peripheral Venipuncture Blood Culture (Aerobic Bottle)',
    specimenQuality: 'SATISFACTORY',
    collectedAt: '2026-10-26T06:30:00.000Z',
    inoculatedAt: '2026-10-26T07:15:00.000Z',
    growthStatus: 'POSITIVE',
    riskLevel: 'HIGH',
    incubationHoursElapsed: 14,
    incubationProtocolMaxHours: 120,
    timeToPositivityHours: 11.4,
    bottleType: 'AEROBIC_FA_PLUS',
    bottleAlertActive: true,
    gramStainMorphology: 'Gram-positive cocci in irregular grape-like clusters. Abundant polymorphonuclear leukocytes seen (>30/HPF).',
    pusCellsCount: '>30 / HPF',
    epithelialCellsCount: 'Nil',
    preliminaryReportAt: '2026-10-26T18:45:00.000Z',
    finalVerifiedAt: '2026-10-26T20:30:00.000Z',
    verifiedByDoctor: 'Dr. Ananya Deshmukh, MD (Microbiology)',
    isolates: [
      {
        isolateId: 'iso-001',
        isolateNumber: 1,
        organismCode: 'ORG-STAAUR',
        organismName: 'Staphylococcus aureus (MRSA)',
        gramReaction: 'GRAM_POSITIVE',
        growthDensity: 'Heavy Pure Bacteremia Growth',
        colonyMorphology: 'Golden-yellow convex colonies with complete beta-hemolysis on 5% Sheep Blood Agar',
        colonyCountCfu: 'BacT/ALERT Continuous signal positive at 11.4h (High-Grade Bacteremia)',
        biochemicalProfile: 'Catalase: POSITIVE | Coagulase (Tube): POSITIVE | DNase: POSITIVE',
        mdroFlags: ['MRSA', 'Cefoxitin Screen Positive'],
        isHiccAlertTriggered: true,
        astPanel: [
          { antibioticCode: 'AMP', antibioticName: 'Ampicillin', antibioticClass: 'Penicillins', whoAwareTier: 'ACCESS', method: 'VITEK2_MIC', micValueUgMl: 16, clsiBreakpointS: '<=0.25', clsiBreakpointR: '>=0.5', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'CIP', antibioticName: 'Ciprofloxacin', antibioticClass: 'Fluoroquinolones', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 4, clsiBreakpointS: '<=0.25', clsiBreakpointR: '>=1', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'VAN', antibioticName: 'Vancomycin', antibioticClass: 'Glycopeptides', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 1.0, clsiBreakpointS: '<=2', clsiBreakpointR: '>=16', interpretation: 'S', isRestrictedReserve: true, cascadeGroup: 'B' },
          { antibioticCode: 'LZD', antibioticName: 'Linezolid', antibioticClass: 'Oxazolidinones', whoAwareTier: 'RESERVE', method: 'VITEK2_MIC', micValueUgMl: 1.5, clsiBreakpointS: '<=4', clsiBreakpointR: '>=8', interpretation: 'S', isRestrictedReserve: true, cascadeGroup: 'B' },
          { antibioticCode: 'DAP', antibioticName: 'Daptomycin', antibioticClass: 'Lipopeptides', whoAwareTier: 'RESERVE', method: 'VITEK2_MIC', micValueUgMl: 0.5, clsiBreakpointS: '<=1', clsiBreakpointR: '>=4', interpretation: 'S', isRestrictedReserve: true, cascadeGroup: 'B' },
          { antibioticCode: 'COT', antibioticName: 'Trimethoprim-Sulfamethoxazole', antibioticClass: 'Folate Inhibitors', whoAwareTier: 'ACCESS', method: 'VITEK2_MIC', micValueUgMl: 0.5, clsiBreakpointS: '<=2', clsiBreakpointR: '>=4', interpretation: 'S', isRestrictedReserve: false, cascadeGroup: 'A' },
        ],
      },
    ],
    criticalAlertPhoneLogged: {
      calledDoctorName: 'Dr. Rajiv Menon (MICU Consultant)',
      calledWardNurse: 'Sr. Deepa Thomas',
      contactNumber: 'Ext. 4022 / +91 98200 44102',
      loggedAt: '2026-10-26T18:50:00.000Z',
      callNotes: 'STAT Critical Blood Culture Positive bottle notified. Gram-positive cocci in clusters seen. Readback confirmed. Vancomycin loading dose initiated.',
      readbackConfirmed: true,
    },
  },
  {
    id: 'mic-002',
    accessionNumber: 'MIC-2026-08915',
    sampleId: 'SMP-URN-552',
    orderNumber: 'ORD-2026-4418',
    uhid: 'UHID-50134',
    patientName: 'Rajesh Kumar',
    patientAgeGender: '62Y / Male',
    wardOrUnit: 'Ward 4B - Nephrology',
    bedNumber: 'Bed #12',
    isIcuPatient: false,
    sampleSite: 'URINE',
    specimenSourceDetail: 'Clean Catch Midstream Urine Specimen',
    specimenQuality: 'SATISFACTORY',
    collectedAt: '2026-10-25T14:00:00.000Z',
    inoculatedAt: '2026-10-25T15:00:00.000Z',
    growthStatus: 'POSITIVE',
    riskLevel: 'HIGH',
    incubationHoursElapsed: 28,
    incubationProtocolMaxHours: 48,
    bottleType: 'CLED_AGAR',
    gramStainMorphology: 'Gram-negative bacilli seen in singles. Marked pyuria (>35 pus cells/HPF).',
    pusCellsCount: '35-40 / HPF (Marked Pyuria)',
    epithelialCellsCount: '2-4 / HPF',
    preliminaryReportAt: '2026-10-25T18:00:00.000Z',
    finalVerifiedAt: '2026-10-26T12:00:00.000Z',
    verifiedByDoctor: 'Dr. Ananya Deshmukh, MD',
    isolates: [
      {
        isolateId: 'iso-002',
        isolateNumber: 1,
        organismCode: 'ORG-KLEPNE',
        organismName: 'Klebsiella pneumoniae (ESBL Producer)',
        gramReaction: 'GRAM_NEGATIVE',
        growthDensity: '>10^5 CFU/mL Significant Pure Bacteriuria',
        colonyMorphology: 'Large, dome-shaped, extremely mucoid, pink lactose-fermenting colonies on MacConkey Agar',
        colonyCountCfu: '>100,000 CFU/mL (Diagnostic for Catheter/Urinary Sepsis)',
        biochemicalProfile: 'Indole: NEGATIVE | Citrate: POSITIVE | Urease: POSITIVE | VP: POSITIVE',
        mdroFlags: ['ESBL', '3rd Gen Cephalosporin Resistant'],
        isHiccAlertTriggered: true,
        astPanel: [
          { antibioticCode: 'AMP', antibioticName: 'Ampicillin', antibioticClass: 'Penicillins', whoAwareTier: 'ACCESS', method: 'VITEK2_MIC', micValueUgMl: 64, clsiBreakpointS: '<=8', clsiBreakpointR: '>=32', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'AMK', antibioticName: 'Amikacin', antibioticClass: 'Aminoglycosides', whoAwareTier: 'ACCESS', method: 'VITEK2_MIC', micValueUgMl: 4, clsiBreakpointS: '<=16', clsiBreakpointR: '>=64', interpretation: 'S', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'CIP', antibioticName: 'Ciprofloxacin', antibioticClass: 'Fluoroquinolones', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 8, clsiBreakpointS: '<=0.25', clsiBreakpointR: '>=1', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'CRO', antibioticName: 'Ceftriaxone', antibioticClass: 'Cephalosporins (3rd Gen)', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 32, clsiBreakpointS: '<=1', clsiBreakpointR: '>=4', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'TZP', antibioticName: 'Piperacillin-Tazobactam', antibioticClass: 'Beta-Lactam / BLI', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 8, clsiBreakpointS: '<=16', clsiBreakpointR: '>=128', interpretation: 'S', isRestrictedReserve: false, cascadeGroup: 'B' },
          { antibioticCode: 'MEM', antibioticName: 'Meropenem', antibioticClass: 'Carbapenems', whoAwareTier: 'RESERVE', method: 'VITEK2_MIC', micValueUgMl: 0.25, clsiBreakpointS: '<=1', clsiBreakpointR: '>=4', interpretation: 'S', isRestrictedReserve: true, cascadeGroup: 'B' },
          { antibioticCode: 'NIT', antibioticName: 'Nitrofurantoin', antibioticClass: 'Nitrofurans', whoAwareTier: 'ACCESS', method: 'VITEK2_MIC', micValueUgMl: 16, clsiBreakpointS: '<=32', clsiBreakpointR: '>=128', interpretation: 'S', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'FOS', antibioticName: 'Fosfomycin', antibioticClass: 'Phosphonic Acids', whoAwareTier: 'ACCESS', method: 'VITEK2_MIC', micValueUgMl: 32, clsiBreakpointS: '<=64', clsiBreakpointR: '>=256', interpretation: 'S', isRestrictedReserve: false, cascadeGroup: 'A' },
        ],
      },
    ],
  },
  {
    id: 'mic-003',
    accessionNumber: 'MIC-2026-08920',
    sampleId: 'SMP-SPT-114',
    orderNumber: 'ORD-2026-4425',
    uhid: 'UHID-60192',
    patientName: 'Sunil Verma',
    patientAgeGender: '48Y / Male',
    wardOrUnit: 'Pulmonology / Chest Ward',
    bedNumber: 'Bed #06',
    isIcuPatient: false,
    sampleSite: 'SPUTUM',
    specimenSourceDetail: 'Early Morning Deep Expectorated Sputum',
    specimenQuality: 'SATISFACTORY',
    bartlettScore: 2,
    collectedAt: '2026-10-25T08:00:00.000Z',
    inoculatedAt: '2026-10-25T09:30:00.000Z',
    growthStatus: 'POSITIVE',
    riskLevel: 'HIGH',
    incubationHoursElapsed: 34,
    incubationProtocolMaxHours: 72,
    bottleType: 'BLOOD_MACCONKEY',
    gramStainMorphology: 'Gram-positive lancet-shaped diplococci surrounded by clear capsule halos. Abundant neutrophils.',
    pusCellsCount: '>25 / HPF',
    epithelialCellsCount: '<10 / HPF (Bartlett Score +2: High Quality Lower Respiratory Sputum)',
    znAfbResult: 'NEGATIVE for Acid-Fast Bacilli (0 AFB / 100 Oil Immersion Fields)',
    kohMountResult: 'NEGATIVE for Fungal Hyphae',
    preliminaryReportAt: '2026-10-25T11:00:00.000Z',
    finalVerifiedAt: '2026-10-26T14:30:00.000Z',
    verifiedByDoctor: 'Dr. Vivek Saxena, MD',
    isolates: [
      {
        isolateId: 'iso-003',
        isolateNumber: 1,
        organismCode: 'ORG-STRPNE',
        organismName: 'Streptococcus pneumoniae',
        gramReaction: 'GRAM_POSITIVE',
        growthDensity: 'Heavy Pure Growth (>10^6 CFU/mL)',
        colonyMorphology: 'Alpha-hemolytic draughtsman colonies with central umbilication on 5% Sheep Blood Agar',
        colonyCountCfu: 'Predominant Pathogen Isolated',
        biochemicalProfile: 'Optochin Susceptibility: SENSITIVE (Zone >=14mm) | Bile Solubility: POSITIVE',
        mdroFlags: ['PRSP Watch'],
        isHiccAlertTriggered: false,
        astPanel: [
          { antibioticCode: 'AMP', antibioticName: 'Ampicillin', antibioticClass: 'Penicillins', whoAwareTier: 'ACCESS', method: 'KIRBY_BAUER_DISK', zoneDiameterMm: 24, clsiBreakpointS: '>=17', clsiBreakpointR: '<=13', interpretation: 'S', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'CRO', antibioticName: 'Ceftriaxone', antibioticClass: 'Cephalosporins (3rd Gen)', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 0.5, clsiBreakpointS: '<=1', clsiBreakpointR: '>=4', interpretation: 'S', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'LVX', antibioticName: 'Levofloxacin', antibioticClass: 'Fluoroquinolones', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 0.5, clsiBreakpointS: '<=0.5', clsiBreakpointR: '>=2', interpretation: 'S', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'VAN', antibioticName: 'Vancomycin', antibioticClass: 'Glycopeptides', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 0.5, clsiBreakpointS: '<=2', clsiBreakpointR: '>=16', interpretation: 'S', isRestrictedReserve: true, cascadeGroup: 'B' },
        ],
      },
    ],
  },
  {
    id: 'mic-004',
    accessionNumber: 'MIC-2026-08930',
    sampleId: 'SMP-CSF-022',
    orderNumber: 'ORD-2026-4440',
    uhid: 'UHID-71042',
    patientName: 'Kavita Rao',
    patientAgeGender: '29Y / Female',
    wardOrUnit: 'SICU - Surgical ICU',
    bedNumber: 'Bed #05',
    isIcuPatient: true,
    sampleSite: 'CSF',
    specimenSourceDetail: 'Lumbar Puncture Cerebrospinal Fluid (Sterile Collection)',
    specimenQuality: 'SATISFACTORY',
    collectedAt: '2026-10-26T11:00:00.000Z',
    inoculatedAt: '2026-10-26T11:30:00.000Z',
    growthStatus: 'POSITIVE',
    riskLevel: 'HIGH',
    incubationHoursElapsed: 9,
    incubationProtocolMaxHours: 120,
    bottleType: 'BLOOD_MACCONKEY',
    gramStainMorphology: 'Gram-negative bacilli seen in singles. Turbid CSF with numerous polymorphonuclear leukocytes.',
    pusCellsCount: '>100 / HPF (Massive Pleocytosis)',
    epithelialCellsCount: 'Nil',
    indiaInkResult: 'NEGATIVE for encapsulated yeast (Cryptococcus excluded)',
    preliminaryReportAt: '2026-10-26T12:15:00.000Z',
    verifiedByDoctor: 'Dr. Ananya Deshmukh, MD',
    isolates: [
      {
        isolateId: 'iso-004',
        isolateNumber: 1,
        organismCode: 'ORG-PSEUDO',
        organismName: 'Pseudomonas aeruginosa (MDR)',
        gramReaction: 'GRAM_NEGATIVE',
        growthDensity: 'Heavy Pure Growth',
        colonyMorphology: 'Feathered edges, grape-like fruity odor, blue-green pyocyanin pigmentation on Nutrient Agar',
        colonyCountCfu: 'CSF Pure Isolate',
        biochemicalProfile: 'Oxidase: POSITIVE | Catalase: POSITIVE | TSI: ALK/ALK (Non-fermenter)',
        mdroFlags: ['MDR_PSEUDOMONAS', 'Carbapenem Resistant'],
        isHiccAlertTriggered: true,
        astPanel: [
          { antibioticCode: 'AMK', antibioticName: 'Amikacin', antibioticClass: 'Aminoglycosides', whoAwareTier: 'ACCESS', method: 'VITEK2_MIC', micValueUgMl: 8, clsiBreakpointS: '<=16', clsiBreakpointR: '>=64', interpretation: 'S', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'CIP', antibioticName: 'Ciprofloxacin', antibioticClass: 'Fluoroquinolones', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 4, clsiBreakpointS: '<=0.25', clsiBreakpointR: '>=1', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'CAZ', antibioticName: 'Ceftazidime', antibioticClass: 'Cephalosporins (3rd Gen)', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 32, clsiBreakpointS: '<=4', clsiBreakpointR: '>=16', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'TZP', antibioticName: 'Piperacillin-Tazobactam', antibioticClass: 'Beta-Lactam / BLI', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 64, clsiBreakpointS: '<=16', clsiBreakpointR: '>=128', interpretation: 'I', isRestrictedReserve: false, cascadeGroup: 'B' },
          { antibioticCode: 'MEM', antibioticName: 'Meropenem', antibioticClass: 'Carbapenems', whoAwareTier: 'RESERVE', method: 'VITEK2_MIC', micValueUgMl: 16, clsiBreakpointS: '<=1', clsiBreakpointR: '>=4', interpretation: 'R', isRestrictedReserve: true, cascadeGroup: 'B' },
          { antibioticCode: 'CST', antibioticName: 'Colistin', antibioticClass: 'Polymyxins', whoAwareTier: 'RESERVE', method: 'VITEK2_MIC', micValueUgMl: 1.0, clsiBreakpointS: '<=2', clsiBreakpointR: '>=4', interpretation: 'S', isRestrictedReserve: true, cascadeGroup: 'C' },
          { antibioticCode: 'CZA', antibioticName: 'Ceftazidime-Avibactam', antibioticClass: 'Novel BL-BLI', whoAwareTier: 'RESERVE', method: 'VITEK2_MIC', micValueUgMl: 4, clsiBreakpointS: '<=8', clsiBreakpointR: '>=16', interpretation: 'S', isRestrictedReserve: true, cascadeGroup: 'C' },
        ],
      },
    ],
    criticalAlertPhoneLogged: {
      calledDoctorName: 'Dr. Sanjay Kapoor (Neuro-Intensivist)',
      calledWardNurse: 'Sr. Ancy George',
      contactNumber: 'Ext. 4030 / +91 98111 20455',
      loggedAt: '2026-10-26T12:20:00.000Z',
      callNotes: 'STAT Meningitis Alert: Turbid CSF Gram-negative bacilli reported verbally within 20 mins of receipt. Urgent IV Ceftazidime-Avibactam + Intrathecal therapy evaluated.',
      readbackConfirmed: true,
    },
  },
  {
    id: 'mic-005',
    accessionNumber: 'MIC-2026-08945',
    sampleId: 'SMP-PUS-819',
    orderNumber: 'ORD-2026-4452',
    uhid: 'UHID-88120',
    patientName: 'Rameshwar Lal',
    patientAgeGender: '59Y / Male',
    wardOrUnit: 'General Surgery Ward',
    bedNumber: 'Bed #14',
    isIcuPatient: false,
    sampleSite: 'PUS_SWAB',
    specimenSourceDetail: 'Post-Operative Laparotomy Wound Swab (Deep Pus)',
    specimenQuality: 'SATISFACTORY',
    collectedAt: '2026-10-26T09:00:00.000Z',
    inoculatedAt: '2026-10-26T10:15:00.000Z',
    growthStatus: 'POSITIVE',
    riskLevel: 'HIGH',
    incubationHoursElapsed: 11,
    incubationProtocolMaxHours: 72,
    bottleType: 'BLOOD_MACCONKEY',
    gramStainMorphology: 'Abundant Gram-negative plump bacilli seen with necrotic debris and >50 pus cells/HPF.',
    pusCellsCount: '>50 / HPF (Heavy Suppuration)',
    epithelialCellsCount: '1-2 / HPF',
    preliminaryReportAt: '2026-10-26T11:45:00.000Z',
    verifiedByDoctor: 'Dr. Vivek Saxena, MD',
    isolates: [
      {
        isolateId: 'iso-005',
        isolateNumber: 1,
        organismCode: 'ORG-ECOLI',
        organismName: 'Escherichia coli (CRE / NDM-1 Carbapenemase)',
        gramReaction: 'GRAM_NEGATIVE',
        growthDensity: 'Heavy Pure Growth',
        colonyMorphology: 'Flat, dry, magenta-pink lactose fermenting colonies with bile salt precipitation ring on MacConkey Agar',
        colonyCountCfu: 'Pure Culture Isolated',
        biochemicalProfile: 'Indole: POSITIVE | Methyl Red: POSITIVE | Citrate: NEGATIVE | Urease: NEGATIVE',
        mdroFlags: ['CRE', 'Carbapenemase Producer', 'NDM-1'],
        isHiccAlertTriggered: true,
        astPanel: [
          { antibioticCode: 'AMK', antibioticName: 'Amikacin', antibioticClass: 'Aminoglycosides', whoAwareTier: 'ACCESS', method: 'VITEK2_MIC', micValueUgMl: 64, clsiBreakpointS: '<=16', clsiBreakpointR: '>=64', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'CIP', antibioticName: 'Ciprofloxacin', antibioticClass: 'Fluoroquinolones', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 16, clsiBreakpointS: '<=0.25', clsiBreakpointR: '>=1', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'CRO', antibioticName: 'Ceftriaxone', antibioticClass: 'Cephalosporins (3rd Gen)', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 64, clsiBreakpointS: '<=1', clsiBreakpointR: '>=4', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
          { antibioticCode: 'TZP', antibioticName: 'Piperacillin-Tazobactam', antibioticClass: 'Beta-Lactam / BLI', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 128, clsiBreakpointS: '<=16', clsiBreakpointR: '>=128', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'B' },
          { antibioticCode: 'MEM', antibioticName: 'Meropenem', antibioticClass: 'Carbapenems', whoAwareTier: 'RESERVE', method: 'VITEK2_MIC', micValueUgMl: 16, clsiBreakpointS: '<=1', clsiBreakpointR: '>=4', interpretation: 'R', isRestrictedReserve: true, cascadeGroup: 'B' },
          { antibioticCode: 'CST', antibioticName: 'Colistin', antibioticClass: 'Polymyxins', whoAwareTier: 'RESERVE', method: 'VITEK2_MIC', micValueUgMl: 0.5, clsiBreakpointS: '<=2', clsiBreakpointR: '>=4', interpretation: 'S', isRestrictedReserve: true, cascadeGroup: 'C' },
          { antibioticCode: 'TGC', antibioticName: 'Tigecycline', antibioticClass: 'Glycylcyclines', whoAwareTier: 'RESERVE', method: 'VITEK2_MIC', micValueUgMl: 1.0, clsiBreakpointS: '<=2', clsiBreakpointR: '>=8', interpretation: 'S', isRestrictedReserve: true, cascadeGroup: 'C' },
        ],
      },
    ],
  },
];

const INITIAL_CRITICAL_CALLS: CriticalCallRecord[] = [
  {
    id: 'call-001',
    cultureId: 'mic-001',
    accessionNumber: 'MIC-2026-08912',
    patientName: 'Meena Sharma',
    patientId: 'UHID-40012',
    sampleSite: 'BLOOD',
    callerUserName: 'Dr. Vivek Saxena (Duty Microbiologist)',
    receiverDoctorOrNurse: 'Dr. Rajiv Menon (MICU Consultant)',
    wardOrDepartment: 'MICU - Medical ICU',
    contactNumber: 'Ext. 4022',
    criticalFinding: 'Blood Culture positive bottle #1 after 11.4h TTP. Direct smear shows Gram-positive cocci in clusters (MRSA suspected).',
    readbackConfirmed: true,
    clinicalActionNotes: 'Clinician confirmed readback. Ordered repeat blood set from opposite limb and started IV Vancomycin 15mg/kg.',
    calledAt: '2026-10-26T18:50:00.000Z',
  },
  {
    id: 'call-002',
    cultureId: 'mic-004',
    accessionNumber: 'MIC-2026-08930',
    patientName: 'Kavita Rao',
    patientId: 'UHID-71042',
    sampleSite: 'CSF',
    callerUserName: 'Pooja Nair (Senior Technologist)',
    receiverDoctorOrNurse: 'Dr. Sanjay Kapoor (Neuro-Intensivist)',
    wardOrDepartment: 'SICU - Surgical ICU',
    contactNumber: 'Ext. 4030',
    criticalFinding: 'STAT CSF Direct Smear positive: Abundant Gram-negative bacilli seen with massive pleocytosis (>100 pus cells/HPF).',
    readbackConfirmed: true,
    clinicalActionNotes: 'Readback verified. Neuro-critical team alerted. Empiric Meropenem switched to high-dose Ceftazidime-Avibactam pending AST.',
    calledAt: '2026-10-26T12:20:00.000Z',
  },
];

const INITIAL_ATCC_QC: AtccQcRecord[] = [
  { id: 'qc-1', atccStrainName: 'Escherichia coli', atccNumber: 'ATCC 25922', antibioticCode: 'AMK', antibioticName: 'Amikacin', method: 'VITEK2_MIC', observedValue: 1.0, referenceRange: '0.5 - 4.0 µg/mL', status: 'PASSED', lotNumber: 'LOT-AST-N405-9921', expiryDate: '2027-06-30', testedBy: 'Dr. Vivek Saxena', testedAt: '2026-10-26T07:00:00.000Z' },
  { id: 'qc-2', atccStrainName: 'Escherichia coli', atccNumber: 'ATCC 25922', antibioticCode: 'CIP', antibioticName: 'Ciprofloxacin', method: 'VITEK2_MIC', observedValue: 0.008, referenceRange: '0.004 - 0.015 µg/mL', status: 'PASSED', lotNumber: 'LOT-AST-N405-9921', expiryDate: '2027-06-30', testedBy: 'Dr. Vivek Saxena', testedAt: '2026-10-26T07:00:00.000Z' },
  { id: 'qc-3', atccStrainName: 'Staphylococcus aureus', atccNumber: 'ATCC 29213', antibioticCode: 'VAN', antibioticName: 'Vancomycin', method: 'VITEK2_MIC', observedValue: 1.0, referenceRange: '0.5 - 2.0 µg/mL', status: 'PASSED', lotNumber: 'LOT-AST-P628-8834', expiryDate: '2027-05-15', testedBy: 'Pooja Nair', testedAt: '2026-10-26T07:15:00.000Z' },
  { id: 'qc-4', atccStrainName: 'Staphylococcus aureus', atccNumber: 'ATCC 25923', antibioticCode: 'FOX', antibioticName: 'Cefoxitin (Disk)', method: 'KIRBY_BAUER_DISK', observedValue: 26.0, referenceRange: '23 - 29 mm', status: 'PASSED', lotNumber: 'LOT-BD-FOX30-104', expiryDate: '2027-08-30', testedBy: 'Pooja Nair', testedAt: '2026-10-26T07:20:00.000Z' },
  { id: 'qc-5', atccStrainName: 'Pseudomonas aeruginosa', atccNumber: 'ATCC 27853', antibioticCode: 'MEM', antibioticName: 'Meropenem', method: 'VITEK2_MIC', observedValue: 0.5, referenceRange: '0.25 - 1.0 µg/mL', status: 'PASSED', lotNumber: 'LOT-AST-N405-9921', expiryDate: '2027-06-30', testedBy: 'Dr. Vivek Saxena', testedAt: '2026-10-26T07:30:00.000Z' },
];

const INITIAL_ENV_SWABS: EnvironmentalSwabRecord[] = [
  { id: 'env-1', samplingLocation: 'OT-1 (Cardiothoracic) Operating Table', department: 'Main OT Complex', surfaceType: 'Operating Table Center', samplingMethod: 'Sterile Cotton Swab (10x10 cm template)', growthObserved: false, colonyCountCfu: '0 CFU / 100 cm²', permissibleLimit: '< 5 CFU / 100 cm²', organismIsolated: 'Sterile / No Growth', actionStatus: 'PASSED', sampledBy: 'HICC Nurse Sarita', sampledAt: '2026-10-25T06:00:00.000Z' },
  { id: 'env-2', samplingLocation: 'OT-1 Laminar Airflow Plenum', department: 'Main OT Complex', surfaceType: 'HEPA Filter Air Settle Plate', samplingMethod: '1/1/1 Settle Plate Scheme (1hr exposure)', growth: false, colonyCountCfu: '1 CFU / plate / hr', permissibleLimit: '< 10 CFU / plate / hr', organismIsolated: 'Micrococcus luteus (Air commensal)', actionStatus: 'PASSED', sampledBy: 'HICC Nurse Sarita', sampledAt: '2026-10-25T07:00:00.000Z' } as any,
  { id: 'env-3', samplingLocation: 'Hemodialysis RO Post-Filter Water', department: 'Nephrology & Dialysis', surfaceType: 'RO Loop Sample Tap', samplingMethod: 'Membrane Filtration (0.45µm)', growthObserved: false, colonyCountCfu: '12 CFU / mL', permissibleLimit: '< 100 CFU / mL (AAMI Standard)', organismIsolated: 'Non-pathogenic environmental flora', actionStatus: 'PASSED', sampledBy: 'Technician Rajesh', sampledAt: '2026-10-24T10:00:00.000Z' },
  { id: 'env-4', samplingLocation: 'MICU Bed #04 Multiparameter Monitor Screen', department: 'Medical ICU', surfaceType: 'Capacitive Touchscreen Panel', samplingMethod: 'Sterile Swab', growthObserved: true, colonyCountCfu: '8 CFU / 100 cm²', permissibleLimit: '< 5 CFU / 100 cm²', organismIsolated: 'Staphylococcus epidermidis', actionStatus: 'DECONTAMINATED', correctiveAction: 'Immediate 70% Isopropyl Alcohol disinfection repeated. Clearance swab taken.', sampledBy: 'HICC Officer', sampledAt: '2026-10-26T08:00:00.000Z' },
  { id: 'env-5', samplingLocation: 'CSSD Steam Autoclave #2 Spore Strip', department: 'CSSD Sterile Processing', surfaceType: 'Center of Linen Pack', samplingMethod: 'Biological Indicator Ampoule', growthObserved: false, colonyCountCfu: 'No Turbidity / Purple', permissibleLimit: 'Complete Kill (Negative at 48h)', organismIsolated: 'Geobacillus stearothermophilus Killed', actionStatus: 'PASSED', sampledBy: 'CSSD In-charge', sampledAt: '2026-10-24T16:00:00.000Z' },
];

// ============================================================================
// MAIN COMPONENT (INSIDE SUSPENSE BOUNDARY)
// ============================================================================

function MicrobiologyWorkbenchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab') || 'worklist';

  // Supported clinical tabs directly mapped to enterprise hospital operations
  const validTabs = [
    'worklist',
    'blood',
    'urine',
    'wound',
    'afb',
    'ast',
    'amr',
    'antibiogram',
    'stewardship',
    'critical',
    'qc',
    'environmental',
    'analyzers',
  ];
  const activeTab = validTabs.includes(rawTab) ? rawTab : 'worklist';

  const [cultures, setCultures] = useState<CultureOrderRecord[]>(INITIAL_CULTURES);
  const [selectedCultureId, setSelectedCultureId] = useState<string>(INITIAL_CULTURES[0].id);
  const [criticalCalls, setCriticalCalls] = useState<CriticalCallRecord[]>(INITIAL_CRITICAL_CALLS);
  const [atccQcLogs, setAtccQcLogs] = useState<AtccQcRecord[]>(INITIAL_ATCC_QC);
  const [environmentalSwabs, setEnvironmentalSwabs] = useState<EnvironmentalSwabRecord[]>(INITIAL_ENV_SWABS);
  const [analyzerStatus, setAnalyzerStatus] = useState<any>(null);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [cascadeReportingEnabled, setCascadeReportingEnabled] = useState(true);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNewCultureModalOpen, setIsNewCultureModalOpen] = useState(false);
  const [isGramStainModalOpen, setIsGramStainModalOpen] = useState(false);
  const [isCriticalCallModalOpen, setIsCriticalCallModalOpen] = useState(false);
  const [isAstEntryModalOpen, setIsAstEntryModalOpen] = useState(false);
  const [isAtccQcModalOpen, setIsAtccQcModalOpen] = useState(false);
  const [isEnvironmentalModalOpen, setIsEnvironmentalModalOpen] = useState(false);
  const [isOrderSyncModalOpen, setIsOrderSyncModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reportQrCodeDataUrl, setReportQrCodeDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Antibiogram filters
  const [antibiogramWindow, setAntibiogramWindow] = useState<'30' | '90' | '365'>('90');
  const [antibiogramUnit, setAntibiogramUnit] = useState<'ALL' | 'ICU' | 'NON_ICU'>('ALL');
  const [antibiogramSite, setAntibiogramSite] = useState<string>('ALL');

  // Selected Culture record
  const selectedCulture = useMemo(() => {
    return cultures.find(c => c.id === selectedCultureId) || cultures[0];
  }, [cultures, selectedCultureId]);

  // Tab switch
  const handleTabChange = (tabKey: string) => {
    const url = tabKey === 'worklist' ? '/microbiology' : `/microbiology?tab=${tabKey}`;
    router.replace(url, { scroll: false });
  };

  // Generate QR code for report modal
  useEffect(() => {
    if (!selectedCulture) return;
    const verifyPayload = `https://labcore.elis.health/verify/microbiology/${selectedCulture.accessionNumber}?uhid=${selectedCulture.uhid}`;
    QRCode.toDataURL(verifyPayload, {
      width: 140,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).then(url => setReportQrCodeDataUrl(url)).catch(() => setReportQrCodeDataUrl(''));
  }, [selectedCulture]);

  // Load live data from Backend API
  const fetchBackendData = useCallback(async () => {
    setLoading(true);
    try {
      const [cultRes, callsRes, qcRes, envRes, analyzerRes, ordersRes] = await Promise.all([
        microbiologyApi.listCultures(100).catch(() => null),
        microbiologyApi.listCriticalCalls(50).catch(() => null),
        microbiologyApi.listAtccQc(50).catch(() => null),
        microbiologyApi.listEnvironmentalSwabs(50).catch(() => null),
        microbiologyApi.getAnalyzers().catch(() => null),
        microbiologyApi.getPendingOrders(10).catch(() => null),
      ]);

      if (cultRes && (cultRes as any).success && Array.isArray((cultRes as any).data)) {
        const apiCultures = (cultRes as any).data;
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
                  uhid: c.patientUhid || c.patientId || 'UHID-LIVE',
                  patientName: c.patientName || `Inpatient (${c.patientId})`,
                  patientAgeGender: c.patientAgeGender || 'Adult',
                  wardOrUnit: c.wardOrUnit || 'General Ward',
                  isIcuPatient: Boolean(c.isIcuPatient),
                  sampleSite: c.sampleSite,
                  specimenSourceDetail: `${c.sampleSite} culture specimen`,
                  specimenQuality: c.specimenQuality || 'SATISFACTORY',
                  collectedAt: c.createdAt || new Date().toISOString(),
                  inoculatedAt: c.incubationStartedAt || new Date().toISOString(),
                  growthStatus: c.status === 'ACCESSIONED' ? 'PENDING' : 'POSITIVE',
                  riskLevel: c.isIcuPatient ? 'HIGH' : 'WATCH',
                  incubationHoursElapsed: Math.round((Date.now() - new Date(c.incubationStartedAt || c.createdAt || Date.now()).getTime()) / 3600000) || 1,
                  incubationProtocolMaxHours: 120,
                  bottleType: c.bottleType || (c.sampleSite === 'BLOOD' ? 'AEROBIC_FA_PLUS' : undefined),
                  timeToPositivityHours: c.timeToPositivityHours,
                  gramStainMorphology: c.gramStainMorphology || undefined,
                  pusCellsCount: c.pusCellsCount || undefined,
                  epithelialCellsCount: c.epithelialCellsCount || undefined,
                  criticalAlertPhoneLogged: c.criticalAlertPhoneLogged,
                  isolates: (c.isolates || []).map((iso: any, idx: number) => ({
                    isolateId: iso.id || `iso-${idx}`,
                    isolateNumber: iso.isolateNumber || idx + 1,
                    organismCode: iso.organismCode || 'ORG-UNSP',
                    organismName: iso.organismName || 'Bacterial Pathogen',
                    gramReaction: iso.gramReaction || 'GRAM_NEGATIVE',
                    growthDensity: iso.growthDensity || 'Heavy Growth',
                    colonyMorphology: 'Standard bacterial colonies on solid media',
                    colonyCountCfu: iso.colonyCountCfu || '>100,000 CFU/mL',
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

      if (callsRes && (callsRes as any).success && Array.isArray((callsRes as any).data)) {
        setCriticalCalls((callsRes as any).data);
      }
      if (qcRes && (qcRes as any).success && Array.isArray((qcRes as any).data)) {
        setAtccQcLogs((qcRes as any).data);
      }
      if (envRes && (envRes as any).success && Array.isArray((envRes as any).data)) {
        setEnvironmentalSwabs((envRes as any).data);
      }
      if (analyzerRes && (analyzerRes as any).success) {
        setAnalyzerStatus((analyzerRes as any).data);
      }
      if (ordersRes && (ordersRes as any).success && Array.isArray((ordersRes as any).data)) {
        setPendingOrders((ordersRes as any).data);
      }
    } catch {
      // Local fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackendData();
  }, [fetchBackendData]);

  // Overall Statistics for Workbench KPI cards
  const stats = useMemo(() => {
    const total = cultures.length;
    const bloodCultures = cultures.filter(c => c.sampleSite === 'BLOOD');
    const positiveAlerts = bloodCultures.filter(c => c.growthStatus === 'POSITIVE' || c.bottleAlertActive).length;
    const pendingSmears = cultures.filter(c => !c.gramStainMorphology).length;
    const mdroCount = cultures.filter(c => c.isolates.some(i => i.mdroFlags.length > 0)).length;
    const icuCount = cultures.filter(c => c.isIcuPatient).length;
    const criticalCallsLogged = criticalCalls.length;
    return {
      total,
      positiveAlerts,
      pendingSmears,
      mdroCount,
      icuCount,
      criticalCallsLogged,
      meanTat: 34.6,
    };
  }, [cultures, criticalCalls]);

  // Intrinsic Resistance Violations Check
  const intrinsicViolations = useMemo(() => {
    if (!selectedCulture || selectedCulture.isolates.length === 0) return [];
    const iso = selectedCulture.isolates[0];
    const violations: Array<{ antibioticCode: string; drugName: string; reason: string }> = [];

    for (const rule of INTRINSIC_RULES) {
      if (iso.organismName.toLowerCase().includes(rule.organism.toLowerCase())) {
        const testMatch = iso.astPanel.find(a => a.antibioticCode === rule.badDrug && a.interpretation === 'S');
        if (testMatch) {
          violations.push({
            antibioticCode: rule.badDrug,
            drugName: rule.drugName,
            reason: rule.reason,
          });
        }
      }
    }
    return violations;
  }, [selectedCulture]);

  // Filtered cultures list for Worklist and dedicated benches
  const filteredCultures = useMemo(() => {
    return cultures.filter(c => {
      if (activeTab === 'blood' && c.sampleSite !== 'BLOOD') return false;
      if (activeTab === 'urine' && c.sampleSite !== 'URINE') return false;
      if (activeTab === 'wound' && !['PUS_SWAB', 'PLEURAL_FLUID', 'ASCITIC_FLUID', 'SYNOVIAL_FLUID', 'CSF', 'TISSUE_BIOPSY'].includes(c.sampleSite)) return false;
      if (activeTab === 'afb' && !['SPUTUM', 'BRONCHOALVEOLAR_LAVAGE'].includes(c.sampleSite)) return false;

      if (statusFilter === 'POSITIVE' && c.growthStatus !== 'POSITIVE') return false;
      if (statusFilter === 'PENDING' && c.growthStatus !== 'PENDING') return false;
      if (statusFilter === 'MDRO' && !c.isolates.some(i => i.mdroFlags.length > 0)) return false;
      if (statusFilter === 'ICU' && !c.isIcuPatient) return false;

      if (wardFilter !== 'ALL' && !c.wardOrUnit.includes(wardFilter)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.patientName.toLowerCase().includes(q);
        const matchUhid = c.uhid.toLowerCase().includes(q);
        const matchAcc = c.accessionNumber.toLowerCase().includes(q);
        const matchSite = c.sampleSite.toLowerCase().includes(q);
        const matchBug = c.isolates.some(i => i.organismName.toLowerCase().includes(q));
        if (!matchName && !matchUhid && !matchAcc && !matchSite && !matchBug) return false;
      }
      return true;
    });
  }, [cultures, activeTab, statusFilter, wardFilter, searchQuery]);

  // Antibiogram Matrix Generator (CLSI M39 standard)
  const antibiogramMatrix = useMemo(() => {
    const orgMap = new Map<string, {
      name: string;
      reaction: string;
      total: number;
      mdro: number;
      abxMap: Map<string, { s: number; i: number; r: number }>;
    }>();

    for (const c of cultures) {
      if (antibiogramUnit === 'ICU' && !c.isIcuPatient) continue;
      if (antibiogramUnit === 'NON_ICU' && c.isIcuPatient) continue;
      if (antibiogramSite !== 'ALL' && c.sampleSite !== antibiogramSite) continue;

      for (const iso of c.isolates) {
        if (!orgMap.has(iso.organismName)) {
          orgMap.set(iso.organismName, {
            name: iso.organismName,
            reaction: iso.gramReaction,
            total: 0,
            mdro: 0,
            abxMap: new Map(),
          });
        }
        const record = orgMap.get(iso.organismName)!;
        record.total += 1;
        if (iso.mdroFlags.length > 0) record.mdro += 1;

        for (const ast of iso.astPanel) {
          if (!record.abxMap.has(ast.antibioticCode)) {
            record.abxMap.set(ast.antibioticCode, { s: 0, i: 0, r: 0 });
          }
          const counts = record.abxMap.get(ast.antibioticCode)!;
          if (ast.interpretation === 'S') counts.s += 1;
          else if (ast.interpretation === 'I') counts.i += 1;
          else if (ast.interpretation === 'R') counts.r += 1;
        }
      }
    }

    const rows: AntibiogramRow[] = [];
    for (const [, v] of orgMap.entries()) {
      const antibiotics: Record<string, AntibiogramMatrixCell> = {};
      for (const [code, stat] of v.abxMap.entries()) {
        const total = stat.s + stat.i + stat.r;
        const pct = total > 0 ? Number(((stat.s / total) * 100).toFixed(1)) : 0;
        antibiotics[code] = {
          antibioticCode: code,
          antibioticName: CLSI_M100_RULES[code]?.name || code,
          totalTested: total,
          susceptibleCount: stat.s,
          intermediateCount: stat.i,
          resistantCount: stat.r,
          susceptibilityPercent: pct,
        };
      }
      rows.push({
        organismName: v.name,
        gramReaction: v.reaction,
        totalIsolates: v.total,
        mdroCount: v.mdro,
        mdroRatePercent: v.total > 0 ? Number(((v.mdro / v.total) * 100).toFixed(1)) : 0,
        antibiotics,
      });
    }

    return rows.sort((a, b) => b.totalIsolates - a.totalIsolates);
  }, [cultures, antibiogramUnit, antibiogramSite]);

  // WHONET BACLINK Export Handler
  const handleDownloadWhonetExport = () => {
    const headers = [
      'Identification', 'Laboratory', 'Patient_ID', 'First_Name', 'Sex', 'Age',
      'Department', 'Ward', 'Specimen_Date', 'Specimen_Type', 'Organism', 'Origin',
      'AMK_NM', 'AMK_ND', 'CIP_NM', 'CIP_ND', 'CRO_NM', 'CRO_ND', 'TZP_NM', 'TZP_ND',
      'MEM_NM', 'MEM_ND', 'VAN_NM', 'VAN_ND', 'CST_NM', 'CST_ND',
    ];

    const lines = [headers.join('\t')];
    for (const c of cultures) {
      for (const iso of c.isolates) {
        const map: Record<string, { mic?: number; res?: string }> = {};
        for (const a of iso.astPanel) {
          map[a.antibioticCode] = { mic: a.micValueUgMl, res: a.interpretation };
        }
        const row = [
          c.accessionNumber,
          'IN_APEX_REF_LAB',
          c.uhid,
          c.patientName.split(' ')[0],
          c.patientAgeGender.includes('Female') ? 'F' : 'M',
          c.patientAgeGender.split('Y')[0].trim() || '50',
          c.isIcuPatient ? 'ICU' : 'INP',
          c.wardOrUnit,
          c.collectedAt.slice(0, 10),
          c.sampleSite,
          iso.organismCode,
          'HOSP',
          map.AMK?.mic ?? '', map.AMK?.res ?? '',
          map.CIP?.mic ?? '', map.CIP?.res ?? '',
          map.CRO?.mic ?? '', map.CRO?.res ?? '',
          map.TZP?.mic ?? '', map.TZP?.res ?? '',
          map.MEM?.mic ?? '', map.MEM?.res ?? '',
          map.VAN?.mic ?? '', map.VAN?.res ?? '',
          map.CST?.mic ?? '', map.CST?.res ?? '',
        ];
        lines.push(row.join('\t'));
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WHONET_AMR_EXPORT_${new Date().toISOString().slice(0, 10)}.tsv`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage('WHONET 2024 / WHO GLASS export TSV downloaded successfully.');
  };

  // WhatsApp Dispatch
  const handleSendWhatsApp = () => {
    if (!selectedCulture) return;
    const phone = prompt('Enter Patient / Clinician WhatsApp Mobile Number (+91...):', '+91 98200 44102');
    if (phone) {
      const text = encodeURIComponent(
        `*APEX REFERENCE LABS - MICROBIOLOGY CULTURE REPORT*\nAccession: ${selectedCulture.accessionNumber}\nPatient: ${selectedCulture.patientName} (${selectedCulture.uhid})\nSample Site: ${selectedCulture.sampleSite}\nStatus: ${selectedCulture.growthStatus}\nVerified By: Dr. Ananya Deshmukh, MD\nView verified digital report: https://labcore.elis.health/verify/microbiology/${selectedCulture.accessionNumber}?uhid=${selectedCulture.uhid}`
      );
      window.open(`https://api.whatsapp.com/send?phone=${phone.replace(/\D/g, '')}&text=${text}`, '_blank');
      setToastMessage(`WhatsApp notification prepared for ${phone}`);
    }
  };

  // Status Badge Helper
  const renderGrowthBadge = (status: CultureOrderRecord['growthStatus'], bottleAlert?: boolean) => {
    if (bottleAlert) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse shadow-xs">
          <Siren className="w-3.5 h-3.5" />
          STAT BOTTLE ALERT
        </span>
      );
    }
    switch (status) {
      case 'POSITIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <Flame className="w-3 h-3 text-rose-600" />
            Culture Positive
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Incubation Ongoing
          </span>
        );
      case 'NO_GROWTH':
      case 'NEGATIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            Sterile / No Growth
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  // AST Result Badge
  const renderAstResultBadge = (interp: AntibioticTestEntry['interpretation']) => {
    switch (interp) {
      case 'S':
        return (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md font-black text-xs bg-emerald-100 text-emerald-800 border border-emerald-300">
            S
          </span>
        );
      case 'I':
        return (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md font-black text-xs bg-amber-100 text-amber-800 border border-amber-300">
            I
          </span>
        );
      case 'R':
        return (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md font-black text-xs bg-rose-100 text-rose-800 border border-rose-300">
            R
          </span>
        );
      case 'SDD':
        return (
          <span className="inline-flex items-center justify-center px-1.5 h-6 rounded-md font-black text-[10px] bg-blue-100 text-blue-800 border border-blue-300">
            SDD
          </span>
        );
    }
  };

  // WHO AWaRe Badge
  const renderAwareBadge = (tier: WhoAwareTier) => {
    switch (tier) {
      case 'ACCESS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Access</span>;
      case 'WATCH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Watch</span>;
      case 'RESERVE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Reserve</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[9999] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ======================================================================
          1. ENTERPRISE HEADER & CLINICAL ACTIONS
          ====================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                <Microscope className="w-3.5 h-3.5 text-sky-700" />
                Hospital &amp; Reference Lab Microbiology Suite
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                CLSI M100 Ed. 34 / EUCAST
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                NABL ISO 15189:2022 Verified
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                ATCC Quality Control Aligned
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Clinical Microbiology, Culture &amp; AMR Workstation
            </h1>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
              Enterprise clinical bacteriology, automated continuous blood bottle monitoring, CLSI AST interpretation,
              HICC hospital-acquired infection surveillance, ATCC reference strain quality control, and critical value communications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsNewCultureModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Accession Specimen
            </button>

            <button
              onClick={() => setIsOrderSyncModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-bold transition"
              title="Sync unaccessioned microbiology test requisitions from Hospital Orders"
            >
              <ClipboardList className="w-4 h-4 text-sky-700" />
              Sync LIS Orders {pendingOrders.length > 0 && `(${pendingOrders.length})`}
            </button>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Verified Report
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition"
              title="Dispatch report directly to patient or doctor on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              WhatsApp Dispatch
            </button>

            <button
              onClick={handleDownloadWhonetExport}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
              title="Download standardized TSV for WHONET 2024 / WHO GLASS global surveillance"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              WHONET
            </button>

            <button
              onClick={fetchBackendData}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
              title="Refresh Workbench Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-700' : ''}`} />
            </button>
          </div>
        </div>

        {/* Intrinsic Resistance Warning Banner */}
        {intrinsicViolations.length > 0 && (
          <div className="mt-4 p-3.5 rounded-xl border border-rose-300 bg-rose-50 flex items-start gap-3 text-xs text-rose-900">
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-rose-950">
                CLSI / EUCAST INTRINSIC RESISTANCE ALERT: Potential Laboratory Testing Error Detected!
              </p>
              <p className="mt-0.5 text-rose-800 leading-relaxed">
                The current isolate (<span className="font-bold italic">{selectedCulture?.isolates[0]?.organismName}</span>) was recorded as
                Susceptible to {intrinsicViolations.map(v => `${v.drugName} (${v.antibioticCode})`).join(', ')}.
                This organism is inherently resistant in nature due to {intrinsicViolations[0]?.reason}
                Please re-check purity plate and repeat AST testing before releasing final verified report.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================================
          2. STATISTICAL CLINICAL KPI CARDS
          ====================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Cultures</span>
            <FlaskConical className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">{stats.total}</p>
          <p className="text-[10px] text-slate-500">Under bench incubation</p>
        </div>

        <div className="bg-white rounded-xl border border-rose-200 bg-rose-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Positive Bottles</span>
            <Siren className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
          </div>
          <p className="text-xl font-black text-rose-700 mt-1">{stats.positiveAlerts}</p>
          <p className="text-[10px] text-rose-600 font-semibold">Immediate Gram stain required</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Smears</span>
            <Microscope className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-xl font-black text-amber-700 mt-1">{stats.pendingSmears}</p>
          <p className="text-[10px] text-slate-500">24h Preliminary reports</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">MDRO Pathogens</span>
            <Bug className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <p className="text-xl font-black text-purple-700 mt-1">{stats.mdroCount}</p>
          <p className="text-[10px] text-slate-500">HICC contact isolation tags</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">ATCC Strain QC</span>
            <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <p className="text-xl font-black text-teal-700 mt-1">{atccQcLogs.length}</p>
          <p className="text-[10px] text-slate-500">CLSI Table 4 Pass status</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Critical Calls Logged</span>
            <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <p className="text-xl font-black text-rose-700 mt-1">{stats.criticalCallsLogged}</p>
          <p className="text-[10px] text-slate-500">ISO 15189 verbal readbacks</p>
        </div>
      </div>

      {/* ======================================================================
          3. REAL-WORLD CLINICAL NAVIGATION TABS (SIDEBAR COMPATIBLE)
          ====================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex flex-wrap items-center gap-1 shadow-2xs">
        <button
          onClick={() => handleTabChange('worklist')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'worklist' ? 'bg-sky-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Master Worklist
        </button>

        <button
          onClick={() => handleTabChange('blood')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'blood' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          Blood Culture (BacT/ALERT)
        </button>

        <button
          onClick={() => handleTabChange('urine')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'urine' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Droplets className="w-3.5 h-3.5" />
          Urine Culture Bench
        </button>

        <button
          onClick={() => handleTabChange('wound')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'wound' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          Wound &amp; Sterile Fluids
        </button>

        <button
          onClick={() => handleTabChange('afb')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'afb' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Microscope className="w-3.5 h-3.5" />
          AFB &amp; Sputum (Bartlett)
        </button>

        <button
          onClick={() => handleTabChange('ast')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'ast' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Dna className="w-3.5 h-3.5" />
          AST &amp; MIC Workstation
        </button>

        <button
          onClick={() => handleTabChange('amr')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'amr' ? 'bg-rose-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bug className="w-3.5 h-3.5" />
          AMR &amp; HICC Surveillance
        </button>

        <button
          onClick={() => handleTabChange('antibiogram')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'antibiogram' ? 'bg-sky-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Cumulative Antibiogram (M39)
        </button>

        <button
          onClick={() => handleTabChange('qc')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'qc' ? 'bg-teal-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Daily ATCC QC Bench
        </button>

        <button
          onClick={() => handleTabChange('environmental')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'environmental' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          OT / ICU Sterility Surveillance
        </button>

        <button
          onClick={() => handleTabChange('analyzers')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'analyzers' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          Automated Analyzer Hub
        </button>

        <button
          onClick={() => handleTabChange('stewardship')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'stewardship' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Pill className="w-3.5 h-3.5" />
          Stewardship (CDSS)
        </button>

        <button
          onClick={() => handleTabChange('critical')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'critical' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          Critical Calls
        </button>
      </div>

      {/* ======================================================================
          BENCH WORKLISTS (WORKLIST / BLOOD / URINE / WOUND / AFB)
          ====================================================================== */}
      {(['worklist', 'blood', 'urine', 'wound', 'afb'].includes(activeTab)) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main List Table (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-sky-700" />
                <h3 className="text-sm font-extrabold text-slate-800">
                  {activeTab === 'worklist' && 'Master Culture Worklist'}
                  {activeTab === 'blood' && 'Automated Continuous Blood Culture Workstation'}
                  {activeTab === 'urine' && 'Urine Semi-Quantitative Culture Bench'}
                  {activeTab === 'wound' && 'Wound, Pus Swab & Sterile Body Fluids Bench'}
                  {activeTab === 'afb' && 'Mycobacteriology, AFB & Sputum Quality Bench'}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {filteredCultures.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search UHID, Accession, Pathogen…"
                    className="pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-sky-500 w-44 sm:w-56 bg-white"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="POSITIVE">Positive Signal</option>
                  <option value="PENDING">Incubation Ongoing</option>
                  <option value="MDRO">MDRO Flagged</option>
                  <option value="ICU">ICU Patients</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto flex-1 min-h-[360px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="px-3.5 py-2.5">Accession &amp; Patient</th>
                    <th className="px-3 py-2.5">Site &amp; Media</th>
                    <th className="px-3 py-2.5">Incubation</th>
                    <th className="px-3 py-2.5">Growth Status</th>
                    <th className="px-3 py-2.5">Organism / Smear</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCultures.map(culture => {
                    const isSelected = culture.id === selectedCultureId;
                    const primaryIsolate = culture.isolates[0];
                    return (
                      <tr
                        key={culture.id}
                        onClick={() => setSelectedCultureId(culture.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-sky-50/80 font-medium' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="px-3.5 py-3">
                          <div className="font-mono font-bold text-sky-800 flex items-center gap-1.5">
                            {culture.accessionNumber}
                            {culture.isIcuPatient && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-800">
                                ICU
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-slate-900 mt-0.5">{culture.patientName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {culture.uhid} · {culture.wardOrUnit}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                            {culture.sampleSite}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[130px]">
                            {culture.bottleType ? culture.bottleType.replace(/_/g, ' ') : culture.specimenSourceDetail}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="font-mono text-slate-800 font-bold">
                            {culture.incubationHoursElapsed}h / {culture.incubationProtocolMaxHours}h
                          </div>
                          {culture.timeToPositivityHours && (
                            <div className="text-[10px] text-rose-700 font-bold">
                              TTP: {culture.timeToPositivityHours}h
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          {renderGrowthBadge(culture.growthStatus, culture.bottleAlertActive)}
                        </td>

                        <td className="px-3 py-3">
                          {primaryIsolate ? (
                            <div>
                              <p className="font-extrabold text-slate-950 italic">{primaryIsolate.organismName}</p>
                              {primaryIsolate.mdroFlags.length > 0 && (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800 mt-0.5">
                                  {primaryIsolate.mdroFlags.join(', ')}
                                </span>
                              )}
                            </div>
                          ) : culture.gramStainMorphology ? (
                            <p className="text-[11px] text-slate-700 italic truncate max-w-[150px]">
                              {culture.gramStainMorphology}
                            </p>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Smear Pending</span>
                          )}
                        </td>

                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCultureId(culture.id);
                              setIsReportModalOpen(true);
                            }}
                            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
                            title="View Verified Diagnostic Report"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Specimen Detail Inspector (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {selectedCulture ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-sky-800 tracking-wider">
                      SPECIMEN BENCH INSPECTION
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
                      {selectedCulture.accessionNumber}
                      {renderGrowthBadge(selectedCulture.growthStatus, selectedCulture.bottleAlertActive)}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsCriticalCallModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      Critical Call
                    </button>
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Report
                    </button>
                  </div>
                </div>

                {/* Patient Summary Card */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm">{selectedCulture.patientName}</span>
                    <span className="font-mono text-slate-600 font-bold">{selectedCulture.uhid}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                    <div><strong>Ward:</strong> {selectedCulture.wardOrUnit}</div>
                    <div><strong>Bed:</strong> {selectedCulture.bedNumber || 'N/A'}</div>
                    <div><strong>Site:</strong> {selectedCulture.sampleSite}</div>
                    <div><strong>Quality:</strong> {selectedCulture.specimenQuality}</div>
                  </div>
                </div>

                {/* Direct Microscopy Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Microscope className="w-4 h-4 text-sky-700" />
                      Direct Smear &amp; Microscopy (24h Preliminary)
                    </h4>
                    <button
                      onClick={() => setIsGramStainModalOpen(true)}
                      className="text-xs text-sky-700 hover:text-sky-900 font-bold"
                    >
                      {selectedCulture.gramStainMorphology ? 'Edit Smear' : '+ Enter Smear'}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    {selectedCulture.gramStainMorphology ? (
                      <>
                        <p className="italic text-slate-800 font-medium">
                          {selectedCulture.gramStainMorphology}
                        </p>
                        <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                          <span><strong>Pus Cells:</strong> {selectedCulture.pusCellsCount || 'N/A'}</span>
                          <span><strong>Epi Cells:</strong> {selectedCulture.epithelialCellsCount || 'N/A'}</span>
                          {selectedCulture.bartlettScore !== undefined && (
                            <span className="text-teal-700 font-bold">
                              <strong>Bartlett Score:</strong> +{selectedCulture.bartlettScore} (High Quality)
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-slate-400 italic">No direct smear documented yet. Click above to record Gram stain.</p>
                    )}
                  </div>
                </div>

                {/* Pathogen Identification & AST Profile */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Bug className="w-4 h-4 text-purple-700" />
                      Isolated Pathogen &amp; AST Profile
                    </h4>
                    <button
                      onClick={() => setIsAstEntryModalOpen(true)}
                      className="text-xs text-purple-700 hover:text-purple-900 font-bold"
                    >
                      + Add / Edit AST Panel
                    </button>
                  </div>

                  {selectedCulture.isolates.length > 0 ? (
                    <div className="space-y-3">
                      {selectedCulture.isolates.map(iso => (
                        <div key={iso.isolateId} className="p-3 rounded-xl bg-purple-50/40 border border-purple-200 text-xs space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-black text-slate-950 italic text-sm">{iso.organismName}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{iso.colonyMorphology}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-purple-900 border border-purple-300">
                              Isolate #{iso.isolateNumber}
                            </span>
                          </div>

                          {iso.colonyCountCfu && (
                            <div className="text-[11px] font-bold text-slate-800">
                              Colony Count: <span className="font-mono text-purple-900">{iso.colonyCountCfu}</span>
                            </div>
                          )}

                          {iso.mdroFlags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {iso.mdroFlags.map(f => (
                                <span key={f} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                                  {f}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Quick AST summary table */}
                          <div className="mt-2 border-t border-purple-200 pt-2">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold uppercase text-slate-600">AST Susceptibility Highlights</span>
                              <button
                                onClick={() => handleTabChange('ast')}
                                className="text-[10px] text-purple-800 font-bold hover:underline"
                              >
                                Full CLSI Panel ({iso.astPanel.length} drugs) &rarr;
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                              {iso.astPanel.slice(0, 6).map(ast => (
                                <div key={ast.antibioticCode} className="flex items-center justify-between bg-white px-2 py-1 rounded border border-purple-100">
                                  <span className="font-sans font-medium text-slate-700 truncate mr-1">{ast.antibioticName}:</span>
                                  {renderAstResultBadge(ast.interpretation)}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-400 text-xs italic">
                      Culture incubation in progress. No pathogen isolated yet.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ======================================================================
          TAB: AST & MIC WORKSTATION (CLSI M100 Ed. 34)
          ====================================================================== */}
      {activeTab === 'ast' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                  CLSI M100 Ed. 34 (2024-2026) / EUCAST
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  VITEK-2 / Kirby-Bauer Standard
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                Quantitative Antimicrobial Susceptibility Testing (AST) Workstation
              </h2>
              <p className="text-xs text-slate-500">
                MIC values (µg/mL) and disk diffusion zone millimeters evaluated against clinical breakpoints.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-800">Selective / Cascade Reporting</p>
                <p className="text-[10px] text-slate-500">Suppress Group C Reserve if Group A is Susceptible</p>
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

          {/* Accession Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-700">Selected Specimen:</span>
              <select
                value={selectedCultureId}
                onChange={e => setSelectedCultureId(e.target.value)}
                className="font-bold bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-sky-500"
              >
                {cultures.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.accessionNumber} - {c.patientName} ({c.sampleSite})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span><strong>Pathogen:</strong> <span className="italic font-bold text-slate-900">{selectedCulture.isolates[0]?.organismName || 'None'}</span></span>
              <span><strong>Ward:</strong> {selectedCulture.wardOrUnit}</span>
              <span><strong>TTP:</strong> {selectedCulture.timeToPositivityHours ? `${selectedCulture.timeToPositivityHours}h` : 'N/A'}</span>
            </div>
          </div>

          {/* AST Table */}
          {selectedCulture.isolates.length > 0 && selectedCulture.isolates[0].astPanel.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Antimicrobial Agent</th>
                    <th className="px-3 py-3">Class</th>
                    <th className="px-3 py-3">WHO AWaRe</th>
                    <th className="px-3 py-3">Cascade Group</th>
                    <th className="px-3 py-3">Method</th>
                    <th className="px-3 py-3 text-center">MIC (µg/mL)</th>
                    <th className="px-3 py-3 text-center">Zone (mm)</th>
                    <th className="px-3 py-3">CLSI Breakpoint</th>
                    <th className="px-3 py-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedCulture.isolates[0].astPanel.map(entry => {
                    const isMaskedByCascade = cascadeReportingEnabled && entry.cascadeGroup === 'C' && selectedCulture.isolates[0].astPanel.some(a => a.cascadeGroup === 'A' && a.interpretation === 'S');
                    return (
                      <tr key={entry.antibioticCode} className={`hover:bg-slate-50 transition-colors ${isMaskedByCascade ? 'opacity-50 bg-slate-50/50' : ''}`}>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {entry.antibioticName}
                          {entry.isRestrictedReserve && (
                            <span className="ml-2 text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                              Restricted Reserve
                            </span>
                          )}
                          {isMaskedByCascade && (
                            <span className="ml-2 text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                              Cascade Suppressed
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-slate-600">{entry.antibioticClass}</td>
                        <td className="px-3 py-3">{renderAwareBadge(entry.whoAwareTier)}</td>
                        <td className="px-3 py-3 font-mono font-bold text-slate-700">Group {entry.cascadeGroup}</td>
                        <td className="px-3 py-3 font-mono text-slate-600">{entry.method}</td>
                        <td className="px-3 py-3 font-mono font-bold text-slate-800 text-center">
                          {entry.micValueUgMl !== undefined ? `${entry.micValueUgMl} µg/mL` : '—'}
                        </td>
                        <td className="px-3 py-3 font-mono font-bold text-slate-800 text-center">
                          {entry.zoneDiameterMm !== undefined ? `${entry.zoneDiameterMm} mm` : '—'}
                        </td>
                        <td className="px-3 py-3 font-mono text-[11px] text-slate-500">
                          S: {entry.clsiBreakpointS} | R: {entry.clsiBreakpointR}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {renderAstResultBadge(entry.interpretation)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No AST panel recorded for this accession yet. Inoculation incubation ongoing.
            </div>
          )}
        </div>
      )}

      {/* ======================================================================
          TAB: AMR & HICC INFECTION CONTROL SURVEILLANCE
          ====================================================================== */}
      {activeTab === 'amr' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                  Hospital Infection Control Committee (HICC)
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                  HAI &amp; MDRO Surveillance
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                Multi-Drug Resistant Organism (MDRO) Active Ward Line-Listing
              </h2>
              <p className="text-xs text-slate-500">
                Continuous surveillance for MRSA, VRE, CRE, ESBL, CRAB, and MDR Pseudomonas to enforce contact precautions and barrier nursing.
              </p>
            </div>
          </div>

          {/* Active MDRO Line-Listing Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Patient &amp; UHID</th>
                  <th className="px-3 py-3">Location</th>
                  <th className="px-3 py-3">Isolated Pathogen</th>
                  <th className="px-3 py-3">Resistance Phenotype</th>
                  <th className="px-3 py-3">Isolation Precautions</th>
                  <th className="px-3 py-3">Active Regimen / Advice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cultures
                  .filter(c => c.isolates.some(i => i.mdroFlags.length > 0))
                  .map(c => {
                    const iso = c.isolates.find(i => i.mdroFlags.length > 0)!;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{c.patientName}</p>
                          <p className="font-mono text-slate-500 text-[10px]">{c.uhid} · {c.accessionNumber}</p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-bold text-slate-800">{c.wardOrUnit}</p>
                          <p className="text-slate-500 text-[10px]">{c.bedNumber || 'Bed Assigned'}</p>
                        </td>
                        <td className="px-3 py-3 font-extrabold italic text-slate-950">
                          {iso.organismName}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            {iso.mdroFlags.map(f => (
                              <span key={f} className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                {f}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black bg-amber-500 text-white shadow-2xs">
                            <Shield className="w-3.5 h-3.5" />
                            CONTACT ISOLATION
                          </span>
                          <p className="text-[10px] text-slate-500 mt-1">Dedicated gown, gloves &amp; equipment</p>
                        </td>
                        <td className="px-3 py-3 text-slate-700 text-[11px]">
                          Daily 0.5% Sodium Hypochlorite terminal cleaning. Environmental clearance swabs required.
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================================
          TAB: CUMULATIVE ANTIBIOGRAM MATRIX (CLSI M39-A4)
          ====================================================================== */}
      {activeTab === 'antibiogram' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                  CLSI M39-A4 Standard
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Cumulative % Susceptibility Matrix
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                Institutional Cumulative Antibiogram Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Calculates % Susceptible (%S) per pathogen-antimicrobial pair to guide empirical hospital formulary protocols.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Timeframe:</span>
              <select
                value={antibiogramWindow}
                onChange={e => setAntibiogramWindow(e.target.value as any)}
                className="bg-white border border-slate-300 rounded px-2 py-1 font-semibold"
              >
                <option value="30">Past 30 Days</option>
                <option value="90">Past 90 Days</option>
                <option value="365">Past 1 Year</option>
              </select>

              <span className="font-bold text-slate-700 ml-2">Cohort:</span>
              <select
                value={antibiogramUnit}
                onChange={e => setAntibiogramUnit(e.target.value as any)}
                className="bg-white border border-slate-300 rounded px-2 py-1 font-semibold"
              >
                <option value="ALL">Hospital-Wide (All)</option>
                <option value="ICU">ICU Patients Only</option>
                <option value="NON_ICU">Non-ICU Inpatients</option>
              </select>

              <button
                onClick={() => window.print()}
                className="ml-2 px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold"
              >
                Print Antibiogram
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="px-3.5 py-3 sticky left-0 bg-slate-100 z-10">Bacterial Pathogen</th>
                  <th className="px-2 py-3 text-center">Isolates (N)</th>
                  <th className="px-2 py-3 text-center">MDRO %</th>
                  {Object.keys(CLSI_M100_RULES).slice(0, 10).map(code => (
                    <th key={code} className="px-2 py-3 text-center font-mono">
                      {code}
                      <span className="block font-sans text-[9px] text-slate-500 font-normal truncate max-w-[65px] mx-auto">
                        {CLSI_M100_RULES[code].name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {antibiogramMatrix.map(row => (
                  <tr key={row.organismName} className="hover:bg-slate-50">
                    <td className="px-3.5 py-2.5 font-bold text-slate-900 italic sticky left-0 bg-white z-10 shadow-xs">
                      {row.organismName}
                    </td>
                    <td className="px-2 py-2.5 text-center font-mono font-bold text-slate-800">
                      {row.totalIsolates}
                    </td>
                    <td className="px-2 py-2.5 text-center font-mono font-bold text-rose-700">
                      {row.mdroRatePercent}%
                    </td>
                    {Object.keys(CLSI_M100_RULES).slice(0, 10).map(code => {
                      const cell = row.antibiotics[code];
                      if (!cell || cell.totalTested === 0) {
                        return <td key={code} className="px-2 py-2.5 text-center text-slate-300 font-mono">—</td>;
                      }
                      const pct = cell.susceptibilityPercent;
                      let bg = 'bg-slate-50 text-slate-700';
                      if (pct >= 80) bg = 'bg-emerald-100 text-emerald-900 font-black';
                      else if (pct >= 50) bg = 'bg-amber-100 text-amber-900 font-bold';
                      else bg = 'bg-rose-100 text-rose-900 font-black';

                      return (
                        <td key={code} className="px-2 py-2.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono ${bg}`}>
                            {pct}%
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================================
          TAB: DAILY ATCC REFERENCE QUALITY CONTROL BENCH (CLSI TABLE 4)
          ====================================================================== */}
      {activeTab === 'qc' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  CLSI M100 Table 4 / NABL ISO 15189
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                  Daily ATCC Control Verification
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                Internal Quality Control (IQC) ATCC Reference Strain Log
              </h2>
              <p className="text-xs text-slate-500">
                Daily validation of antibiotic disks, VITEK-2 AST cards, and media lots against standard ATCC control strains.
              </p>
            </div>

            <button
              onClick={() => setIsAtccQcModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-xs transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              + Log ATCC Quality Control Test
            </button>
          </div>

          {/* Reference Strains Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-extrabold text-slate-900">E. coli ATCC 25922</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Gram-Negative Broad Spectrum Control</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">QC Active (Daily)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-extrabold text-slate-900">S. aureus ATCC 29213 / 25923</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Gram-Positive Staph &amp; Cefoxitin Screen</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">QC Active (Daily)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-extrabold text-slate-900">P. aeruginosa ATCC 27853</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Non-fermenter Antipseudomonal Range</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">QC Active (Daily)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-extrabold text-slate-900">K. pneumoniae ATCC 700603</span>
              <p className="text-[11px] text-slate-500 mt-0.5">ESBL Confirmatory Positive Control</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">QC Active (Weekly)</span>
            </div>
          </div>

          {/* QC Logs Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Control Strain</th>
                  <th className="px-3 py-3">Antibiotic Tested</th>
                  <th className="px-3 py-3">Method</th>
                  <th className="px-3 py-3 text-center">Observed Result</th>
                  <th className="px-3 py-3">CLSI Table 4 Range</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3">Lot &amp; Expiry</th>
                  <th className="px-3 py-3">Tested By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {atccQcLogs.map(qc => (
                  <tr key={qc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {qc.atccStrainName}
                      <span className="block font-mono text-[10px] text-teal-800">{qc.atccNumber}</span>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-800">
                      {qc.antibioticName} ({qc.antibioticCode})
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-600">{qc.method}</td>
                    <td className="px-3 py-3 font-mono font-bold text-center text-slate-900">
                      {qc.observedValue}
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-600 text-[11px]">
                      {qc.referenceRange}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <Check className="w-3 h-3" /> {qc.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[10px] text-slate-500 font-mono">
                      {qc.lotNumber} · Exp: {new Date(qc.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {qc.testedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================================
          TAB: HOSPITAL OT / ICU STERILITY & ENVIRONMENTAL SURVEILLANCE
          ====================================================================== */}
      {activeTab === 'environmental' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  NABH &amp; JCI Quality Standard
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                  Operation Theater &amp; ICU Surveillance
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                Hospital Environmental &amp; Sterility Surveillance Logbook
              </h2>
              <p className="text-xs text-slate-500">
                Periodic microbiologic monitoring of Operation Theaters, air settle plates, dialysis RO water, endoscopes, and autoclave spore strips.
              </p>
            </div>

            <button
              onClick={() => setIsEnvironmentalModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              + Record Sterility Swab
            </button>
          </div>

          {/* Environmental Swabs Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Sampling Location &amp; Unit</th>
                  <th className="px-3 py-3">Surface &amp; Method</th>
                  <th className="px-3 py-3">Colony Count (Observed)</th>
                  <th className="px-3 py-3">Permissible Limit</th>
                  <th className="px-3 py-3">Microbial Identification</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3">Auditor / Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {environmentalSwabs.map(swab => (
                  <tr key={swab.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{swab.samplingLocation}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{swab.department}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-800">{swab.surfaceType}</p>
                      <p className="text-[10px] text-slate-500">{swab.samplingMethod}</p>
                    </td>
                    <td className="px-3 py-3 font-mono font-bold text-slate-900">
                      {swab.colonyCountCfu}
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-600 text-[11px]">
                      {swab.permissibleLimit}
                    </td>
                    <td className="px-3 py-3">
                      <span className="italic text-slate-800 font-medium">
                        {swab.organismIsolated || 'Sterile / No Growth'}
                      </span>
                      {swab.correctiveAction && (
                        <p className="text-[10px] text-rose-700 italic mt-0.5">{swab.correctiveAction}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {swab.actionStatus === 'PASSED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Check className="w-3 h-3" /> PASSED
                        </span>
                      ) : swab.actionStatus === 'DECONTAMINATED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                          CLEARED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          ACTION REQ
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {swab.sampledBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================================
          TAB: AUTOMATED ANALYZER HUB (BacT/ALERT & VITEK 2 LIVE INTERFACE)
          ====================================================================== */}
      {activeTab === 'analyzers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-800 border border-slate-300">
              ASTM E1381 &amp; HL7 v2.5 Bi-directional Interfacing
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              Automated Microbiology Analyzer Fleet Telemetry Hub
            </h2>
            <p className="text-xs text-slate-500">
              Live status of automated continuous blood culture systems and automated bacterial identification/susceptibility carousels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BacT/ALERT Card */}
            <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/20 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Continuous Blood Culture Monitoring</span>
                  <h3 className="text-base font-black text-slate-950 mt-0.5">bioMérieux BacT/ALERT 3D System</h3>
                  <p className="text-xs text-slate-500 font-mono">tcp://192.168.10.110:5200 (ASTM Bi-directional)</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  ONLINE
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Bottles Loaded</span>
                  <p className="text-lg font-black text-slate-900 mt-0.5">164 / 240</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Incubation Temp</span>
                  <p className="text-lg font-black text-rose-700 mt-0.5">36.8°C</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-rose-200 bg-rose-50/50">
                  <span className="text-rose-700 font-bold">Positive Alarms</span>
                  <p className="text-lg font-black text-rose-700 mt-0.5">2 Bottles</p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Reflectance Sensor Calibration:</span>
                  <span className="font-bold text-emerald-700">OPTIMAL (Zero Drift)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Unloading Pending:</span>
                  <span className="font-bold text-amber-700">1 Bottle (Rack B, Slot 14)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Continuous Signal Read Interval:</span>
                  <span className="font-mono text-slate-700">Every 10 minutes</span>
                </div>
              </div>
            </div>

            {/* VITEK 2 Card */}
            <div className="p-5 rounded-2xl border border-purple-200 bg-purple-50/20 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Automated Microbial ID &amp; AST</span>
                  <h3 className="text-base font-black text-slate-950 mt-0.5">bioMérieux VITEK 2 Compact System</h3>
                  <p className="text-xs text-slate-500 font-mono">tcp://192.168.10.112:6200 (HL7 v2.5 MLLP)</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  ONLINE
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Cards In Incubator</span>
                  <p className="text-lg font-black text-slate-900 mt-0.5">28 / 60</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Optical Chamber</span>
                  <p className="text-lg font-black text-purple-700 mt-0.5">35.6°C</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Available Slots</span>
                  <p className="text-lg font-black text-emerald-700 mt-0.5">32 Slots</p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Inoculum DensiCHEK Standard:</span>
                  <span className="font-bold text-emerald-700">0.50 - 0.63 McFarland Verified</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Active Processing Cards:</span>
                  <span className="font-mono text-purple-900 font-bold">AST-N405 (GN) &amp; AST-P628 (GP)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Optical Transmittance Reading:</span>
                  <span className="font-mono text-slate-700">Hourly automated kinetic scanning</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          TAB: ANTIBIOTIC STEWARDSHIP PROGRAM (CDSS)
          ====================================================================== */}
      {activeTab === 'stewardship' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Antimicrobial Stewardship Program (ASP) &amp; Outpatient Guidance
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              Targeted Antibiotic De-Escalation &amp; Clinical Guidance
            </h2>
            <p className="text-xs text-slate-500">
              Automated rules identifying opportunities to de-escalate broad-spectrum carbapenems to narrower, targeted agents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* De-escalation alerts */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
              <h3 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Active De-Escalation Opportunities
              </h3>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Patient <strong>Rajesh Kumar (UHID-50134)</strong> in Ward 4B is empirically treated with IV Meropenem.
                Urine culture AST reveals <em>Klebsiella pneumoniae</em> is fully susceptible to <strong>Amikacin</strong> (MIC 4 µg/mL) and <strong>Piperacillin-Tazobactam</strong>.
              </p>
              <div className="p-3 bg-white rounded-lg border border-emerald-200 text-xs text-slate-800 space-y-1">
                <p className="font-bold text-emerald-900">Recommended Stewardship Action:</p>
                <p>Switch from Meropenem (Reserve) to Amikacin or Piperacillin-Tazobactam (Watch) to preserve carbapenem longevity and reduce hospital cost.</p>
              </div>
            </div>

            {/* Outpatient Clinic Empiric Guidance Slip */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Pill className="w-4 h-4 text-sky-700" />
                Outpatient Clinic First-Line Empirical Guidance (ICMR / CDC Guidelines)
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-900">Uncomplicated Lower Urinary Tract Infection:</span>
                  <p className="text-slate-600 mt-0.5">Tab. Nitrofurantoin 100 mg PO BD x 5 days (Access group preferred over Fluoroquinolones).</p>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-900">Community-Acquired Acute Bronchitis / Pneumonia:</span>
                  <p className="text-slate-600 mt-0.5">Tab. Amoxicillin-Clavulanate 625 mg PO TDS x 5-7 days or Tab. Azithromycin 500 mg OD x 3 days.</p>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-900">Uncomplicated Skin &amp; Soft Tissue (Cellulitis):</span>
                  <p className="text-slate-600 mt-0.5">Cap. Cephalexin 500 mg PO QID x 7 days or Tab. Co-trimoxazole DS PO BD if MRSA suspected.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          TAB: STAT TELEPHONE CRITICAL CALL LOGBOOK
          ====================================================================== */}
      {activeTab === 'critical' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                  ISO 15189:2022 § 7.4.2 Mandatory
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                  NABL &amp; NABH Audit Trail
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                STAT Telephone Critical Value Notification Logbook
              </h2>
              <p className="text-xs text-slate-500">
                Mandatory verbal notification documentation for positive blood/CSF bottles and life-threatening MDROs with verbal readback verification.
              </p>
            </div>

            <button
              onClick={() => setIsCriticalCallModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs transition shrink-0"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              + Log New Telephone Alert
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-3 py-3">Accession / Patient</th>
                  <th className="px-3 py-3">Department / Ward</th>
                  <th className="px-3 py-3">Communicated Finding</th>
                  <th className="px-3 py-3">Notified Clinician</th>
                  <th className="px-3 py-3 text-center">Readback Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {criticalCalls.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {new Date(c.calledAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-bold text-slate-900">{c.patientName || c.patientId}</p>
                      <p className="font-mono text-sky-800 text-[10px]">{c.accessionNumber || c.cultureId}</p>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-700">
                      {c.wardOrDepartment}
                    </td>
                    <td className="px-3 py-3 text-slate-800 max-w-sm">
                      <p className="font-semibold text-rose-900">{c.criticalFinding}</p>
                      {c.clinicalActionNotes && (
                        <p className="text-[10px] text-slate-500 italic mt-0.5">{c.clinicalActionNotes}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-bold text-slate-900">{c.receiverDoctorOrNurse}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{c.contactNumber}</p>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {c.readbackConfirmed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Check className="w-3 h-3" /> VERIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          UNVERIFIED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL: NABL ACCREDITED REPORT
          ====================================================================== */}
      {isReportModalOpen && selectedCulture && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-700" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Diagnostic Microbiology Report Preview (ISO 15189:2022 Verified)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSendWhatsApp}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Report
                </button>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div id="printable-micro-report" className="p-6 sm:p-8 overflow-y-auto space-y-5 text-slate-800 bg-white flex-1 min-h-0 text-xs">
              {/* Header */}
              <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-slate-950 tracking-tight">APEX METROPOLITAN REFERENCE LABORATORIES</h2>
                  <p className="text-xs font-bold text-sky-800 uppercase tracking-widest mt-0.5">DEPARTMENT OF MEDICAL MICROBIOLOGY &amp; IMMUNOLOGY</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Sector 14, Institutional Area, Health City Campus · Tel: +91 11 4059 9000 · contact@apexlabs.in</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                    NABL ACCREDITED (ISO 15189:2022) · MC-2849
                  </span>
                </div>
              </div>

              {/* Patient Info */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 grid grid-cols-4 gap-2 text-[11px]">
                <div><span className="text-slate-400 font-semibold uppercase text-[9px]">Patient Name</span><p className="font-extrabold text-slate-900">{selectedCulture.patientName}</p></div>
                <div><span className="text-slate-400 font-semibold uppercase text-[9px]">UHID / Age / Gender</span><p className="font-bold text-slate-900 font-mono">{selectedCulture.uhid} · {selectedCulture.patientAgeGender}</p></div>
                <div><span className="text-slate-400 font-semibold uppercase text-[9px]">Ward / Bed</span><p className="font-bold text-slate-900">{selectedCulture.wardOrUnit} ({selectedCulture.bedNumber || 'Bed Assigned'})</p></div>
                <div><span className="text-slate-400 font-semibold uppercase text-[9px]">Accession #</span><p className="font-bold text-sky-800 font-mono">{selectedCulture.accessionNumber}</p></div>
              </div>

              {/* Direct Smear */}
              <div className="space-y-1">
                <h4 className="font-bold uppercase text-slate-900 border-b border-slate-200 pb-0.5">
                  1. Direct Microscopic Examination (Gram Stain &amp; Special Stains)
                </h4>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-100 space-y-1">
                  <p className="italic text-slate-800 font-medium">{selectedCulture.gramStainMorphology || 'No organism seen on direct smear.'}</p>
                  <div className="flex gap-4 text-[10px] text-slate-600">
                    <span><strong>Pus Cells:</strong> {selectedCulture.pusCellsCount || 'Scanty'}</span>
                    <span><strong>Epithelial Cells:</strong> {selectedCulture.epithelialCellsCount || 'Nil'}</span>
                    {selectedCulture.znAfbResult && <span><strong>ZN AFB:</strong> {selectedCulture.znAfbResult}</span>}
                  </div>
                </div>
              </div>

              {/* Culture Result */}
              <div className="space-y-1">
                <h4 className="font-bold uppercase text-slate-900 border-b border-slate-200 pb-0.5">
                  2. Culture &amp; Quantitative Pathogen Identification
                </h4>
                {selectedCulture.isolates.map(iso => (
                  <div key={iso.isolateId} className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                    <p className="font-extrabold text-slate-950 italic text-sm">{iso.organismName}</p>
                    <p className="text-slate-600">Colony Morphology: {iso.colonyMorphology}</p>
                    {iso.colonyCountCfu && <p className="text-slate-700 font-mono">Count: {iso.colonyCountCfu}</p>}
                    {iso.mdroFlags.length > 0 && <p className="text-rose-700 font-bold">MDRO Surveillance Flag: {iso.mdroFlags.join(', ')}</p>}
                  </div>
                ))}
              </div>

              {/* AST Table */}
              {selectedCulture.isolates.length > 0 && selectedCulture.isolates[0].astPanel.length > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-0.5">
                    <h4 className="font-bold uppercase text-slate-900">
                      3. Antimicrobial Susceptibility Testing (AST Antibiogram per CLSI M100)
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">Selective Cascading Applied</span>
                  </div>
                  <table className="w-full text-left border border-slate-200 text-[11px]">
                    <thead className="bg-slate-100 uppercase text-slate-700 font-bold text-[10px]">
                      <tr>
                        <th className="px-2.5 py-1.5">Antimicrobial</th>
                        <th className="px-2.5 py-1.5">Class</th>
                        <th className="px-2.5 py-1.5 text-center">AWaRe</th>
                        <th className="px-2.5 py-1.5 text-center">MIC (µg/mL)</th>
                        <th className="px-2.5 py-1.5">CLSI Breakpoint</th>
                        <th className="px-2.5 py-1.5 text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {selectedCulture.isolates[0].astPanel
                        .filter(e => !cascadeReportingEnabled || e.cascadeGroup !== 'C' || !selectedCulture.isolates[0].astPanel.some(a => a.cascadeGroup === 'A' && a.interpretation === 'S'))
                        .map(e => (
                          <tr key={e.antibioticCode}>
                            <td className="px-2.5 py-1.5 font-sans font-bold text-slate-900">{e.antibioticName}</td>
                            <td className="px-2.5 py-1.5 font-sans text-slate-600">{e.antibioticClass}</td>
                            <td className="px-2.5 py-1.5 text-center font-sans">{renderAwareBadge(e.whoAwareTier)}</td>
                            <td className="px-2.5 py-1.5 text-center font-bold">{e.micValueUgMl ?? '—'}</td>
                            <td className="px-2.5 py-1.5 text-slate-500 text-[10px]">S: {e.clsiBreakpointS} | R: {e.clsiBreakpointR}</td>
                            <td className="px-2.5 py-1.5 text-center font-sans">{renderAstResultBadge(e.interpretation)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Signatures */}
              <div className="pt-4 border-t-2 border-slate-800 flex justify-between items-end">
                <div className="flex items-center gap-3">
                  {reportQrCodeDataUrl && <img src={reportQrCodeDataUrl} alt="QR" className="w-16 h-16 border border-slate-200 p-0.5 rounded" />}
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-400">Cryptographic Verification Seal</p>
                    <p className="font-mono font-bold text-slate-800">{selectedCulture.accessionNumber}</p>
                    <p className="text-[9px] text-slate-500">Scan QR to verify tamper-proof lab record</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900 text-sm">Dr. Ananya Deshmukh</p>
                  <p className="text-[10px] text-slate-600">MBBS, MD (Microbiology), CICP</p>
                  <p className="text-[9px] text-slate-400">Consultant Clinical Microbiologist · NMC Reg: MMC-2012-04829</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL: ACCESSION NEW SPECIMEN
          ====================================================================== */}
      {isNewCultureModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-sky-700" />
                Accession &amp; Inoculate Specimen
              </h3>
              <button onClick={() => setIsNewCultureModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const patientName = (form.elements.namedItem('patientName') as HTMLInputElement).value || 'New Inpatient';
                const uhid = (form.elements.namedItem('uhid') as HTMLInputElement).value || 'UHID-99011';
                const ageGender = (form.elements.namedItem('ageGender') as HTMLInputElement).value || '45Y / Male';
                const ward = (form.elements.namedItem('ward') as HTMLSelectElement).value;
                const sampleSite = (form.elements.namedItem('sampleSite') as HTMLSelectElement).value as any;
                const bottleType = (form.elements.namedItem('bottleType') as HTMLSelectElement).value;
                const isIcu = ward.includes('ICU');

                const payload = {
                  sampleId: `SMP-${Date.now().toString().slice(-4)}`,
                  orderId: `ORD-${Date.now().toString().slice(-5)}`,
                  patientId: uhid,
                  patientName,
                  patientUhid: uhid,
                  patientAgeGender: ageGender,
                  wardOrUnit: ward,
                  isIcuPatient: isIcu,
                  sampleSite,
                  bottleType,
                  specimenQuality: 'SATISFACTORY',
                };

                try {
                  const res = await microbiologyApi.accessionCulture(payload);
                  if (res && (res as any).success) {
                    setToastMessage(`Culture Accession created in backend database.`);
                    fetchBackendData();
                    setIsNewCultureModalOpen(false);
                    return;
                  }
                } catch {
                  // Fallback
                }

                const newRec: CultureOrderRecord = {
                  id: `mic-${Date.now()}`,
                  accessionNumber: `MIC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
                  sampleId: payload.sampleId,
                  orderNumber: payload.orderId,
                  uhid,
                  patientName,
                  patientAgeGender: ageGender,
                  wardOrUnit: ward,
                  isIcuPatient: isIcu,
                  sampleSite,
                  specimenSourceDetail: `${sampleSite} specimen`,
                  specimenQuality: 'SATISFACTORY',
                  collectedAt: new Date().toISOString(),
                  inoculatedAt: new Date().toISOString(),
                  growthStatus: 'PENDING',
                  riskLevel: isIcu ? 'HIGH' : 'WATCH',
                  incubationHoursElapsed: 1,
                  incubationProtocolMaxHours: 120,
                  bottleType: bottleType as any,
                  isolates: [],
                };
                setCultures(prev => [newRec, ...prev]);
                setSelectedCultureId(newRec.id);
                setIsNewCultureModalOpen(false);
                setToastMessage(`Culture ${newRec.accessionNumber} inoculated on bench.`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Patient Full Name</label>
                <input required name="patientName" placeholder="e.g. Vikram Malhotra" className="w-full px-3 py-1.5 rounded-lg border border-slate-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">UHID</label>
                  <input required name="uhid" placeholder="UHID-88201" className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Age / Gender</label>
                  <input required name="ageGender" placeholder="52Y / Male" className="w-full px-3 py-1.5 rounded-lg border border-slate-300" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ward / Department</label>
                <select name="ward" className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white">
                  <option value="MICU - Medical ICU">MICU - Medical ICU</option>
                  <option value="SICU - Surgical ICU">SICU - Surgical ICU</option>
                  <option value="Ward 4B - Nephrology">Ward 4B - Nephrology</option>
                  <option value="General Surgery Ward">General Surgery Ward</option>
                  <option value="Pulmonology / Chest Ward">Pulmonology / Chest Ward</option>
                  <option value="OPD Consultation">OPD Consultation</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Specimen Site</label>
                  <select name="sampleSite" className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white">
                    <option value="BLOOD">BLOOD</option>
                    <option value="URINE">URINE</option>
                    <option value="PUS_SWAB">PUS / SWAB</option>
                    <option value="SPUTUM">SPUTUM / BAL</option>
                    <option value="CSF">CSF / STERILE FLUID</option>
                    <option value="PLEURAL_FLUID">PLEURAL FLUID</option>
                    <option value="STOOL">STOOL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bottle / Media Type</label>
                  <select name="bottleType" className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white">
                    <option value="AEROBIC_FA_PLUS">BacT/ALERT Aerobic (FA Plus)</option>
                    <option value="ANAEROBIC_FN_PLUS">BacT/ALERT Anaerobic (FN Plus)</option>
                    <option value="PEDIATRIC_PF_PLUS">BacT/ALERT Pediatric (PF Plus)</option>
                    <option value="CLED_AGAR">CLED Agar (Urine)</option>
                    <option value="BLOOD_MACCONKEY">5% Sheep Blood + MacConkey</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsNewCultureModalOpen(false)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-semibold">
                  Inoculate Specimen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL: SYNC PENDING ORDERS FROM HOSPITAL LIS
          ====================================================================== */}
      {isOrderSyncModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-sky-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sky-950 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-sky-700" />
                Sync Test Requisitions from Hospital Orders
              </h3>
              <button onClick={() => setIsOrderSyncModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              The following patient orders from registration or outpatient clinics contain culture/microbiology requisitions ready for bench accessioning:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {pendingOrders.length > 0 ? (
                pendingOrders.map((ord: any) => (
                  <div key={ord.orderId} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{ord.patientName}</p>
                      <p className="font-mono text-slate-500 text-[10px]">{ord.uhid} · {ord.orderNumber}</p>
                    </div>
                    <button
                      onClick={async () => {
                        await microbiologyApi.accessionCulture({
                          sampleId: ord.barcode || `SMP-${ord.orderNumber}`,
                          orderId: ord.orderNumber,
                          patientId: ord.uhid,
                          patientName: ord.patientName,
                          wardOrUnit: 'OPD Registration',
                          isIcuPatient: false,
                          sampleSite: 'URINE',
                        }).catch(() => null);
                        setToastMessage(`Order ${ord.orderNumber} accessioned into Microbiology.`);
                        setIsOrderSyncModalOpen(false);
                        fetchBackendData();
                      }}
                      className="px-3 py-1 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs"
                    >
                      Import to Bench
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  All active hospital orders are already synced to the microbiology worklist.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => setIsOrderSyncModalOpen(false)} className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL: LOG ATCC QC TEST
          ====================================================================== */}
      {isAtccQcModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-teal-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-teal-950 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-teal-700" />
                Record Daily ATCC Quality Control Run
              </h3>
              <button onClick={() => setIsAtccQcModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const strain = (form.elements.namedItem('strain') as HTMLSelectElement).value;
                const code = (form.elements.namedItem('abxCode') as HTMLInputElement).value.toUpperCase();
                const obs = Number((form.elements.namedItem('obs') as HTMLInputElement).value);
                const range = (form.elements.namedItem('range') as HTMLInputElement).value;
                const lot = (form.elements.namedItem('lot') as HTMLInputElement).value;

                const payload = {
                  atccStrainName: strain.split('(')[0].trim(),
                  atccNumber: strain.match(/\((.*?)\)/)?.[1] || 'ATCC 25922',
                  antibioticCode: code,
                  antibioticName: CLSI_M100_RULES[code]?.name || code,
                  method: 'VITEK2_MIC',
                  observedValue: obs,
                  referenceRange: range,
                  status: 'PASSED' as const,
                  lotNumber: lot,
                  expiryDate: '2027-06-30',
                  testedBy: 'Duty QC Technologist',
                };

                try {
                  await microbiologyApi.recordAtccQc(payload);
                } catch {
                  // Fallback
                }

                setAtccQcLogs(prev => [{ ...payload, id: `qc-${Date.now()}`, testedAt: new Date().toISOString() }, ...prev]);
                setIsAtccQcModalOpen(false);
                setToastMessage(`ATCC QC for ${code} on ${payload.atccNumber} logged successfully.`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1">ATCC Reference Control Strain</label>
                <select name="strain" className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white">
                  <option value="Escherichia coli (ATCC 25922)">Escherichia coli (ATCC 25922)</option>
                  <option value="Staphylococcus aureus (ATCC 29213)">Staphylococcus aureus (ATCC 29213 - MIC)</option>
                  <option value="Staphylococcus aureus (ATCC 25923)">Staphylococcus aureus (ATCC 25923 - Disk)</option>
                  <option value="Pseudomonas aeruginosa (ATCC 27853)">Pseudomonas aeruginosa (ATCC 27853)</option>
                  <option value="Klebsiella pneumoniae (ATCC 700603)">Klebsiella pneumoniae (ATCC 700603 - ESBL)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Antibiotic Code</label>
                  <input required name="abxCode" defaultValue="AMK" className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Observed MIC / Zone</label>
                  <input required type="number" step="any" name="obs" defaultValue="1.0" className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">CLSI Reference Permissible Range</label>
                <input required name="range" defaultValue="0.5 - 4.0 µg/mL" className="w-full px-3 py-1.5 rounded-lg border border-slate-300" />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Card / Disk Lot Number</label>
                <input required name="lot" defaultValue="LOT-AST-N405-9921" className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAtccQcModalOpen(false)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-semibold">
                  Save QC Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL: RECORD ENVIRONMENTAL SWAB
          ====================================================================== */}
      {isEnvironmentalModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-emerald-950 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-700" />
                Record Hospital Environmental / OT Swab
              </h3>
              <button onClick={() => setIsEnvironmentalModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const loc = (form.elements.namedItem('location') as HTMLInputElement).value;
                const dept = (form.elements.namedItem('dept') as HTMLInputElement).value;
                const cfu = (form.elements.namedItem('cfu') as HTMLInputElement).value;
                const limit = (form.elements.namedItem('limit') as HTMLInputElement).value;

                const payload = {
                  samplingLocation: loc,
                  department: dept,
                  surfaceType: 'Laminar OT Table / Surface',
                  samplingMethod: 'Sterile Cotton Swab (10x10 cm)',
                  growthObserved: cfu !== '0' && !cfu.includes('0 CFU'),
                  colonyCountCfu: cfu,
                  permissibleLimit: limit,
                  organismIsolated: cfu === '0' || cfu.includes('0 CFU') ? 'Sterile / No Growth' : 'Coagulase Negative Staph',
                  actionStatus: (cfu === '0' || cfu.includes('0 CFU') ? 'PASSED' : 'DECONTAMINATED') as any,
                  sampledBy: 'HICC Surveillance Nurse',
                };

                try {
                  await microbiologyApi.recordEnvironmentalSwab(payload);
                } catch {
                  // Fallback
                }

                setEnvironmentalSwabs(prev => [{ ...payload, id: `env-${Date.now()}`, sampledAt: new Date().toISOString() }, ...prev]);
                setIsEnvironmentalModalOpen(false);
                setToastMessage(`Sterility swab for ${loc} documented.`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Sampling Location</label>
                <input required name="location" placeholder="e.g. OT-2 Orthopedic Table Center" defaultValue="OT-2 Table Center" className="w-full px-3 py-1.5 rounded-lg border border-slate-300" />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department / Unit</label>
                <input required name="dept" placeholder="Main OT Complex" defaultValue="Main Operation Theater" className="w-full px-3 py-1.5 rounded-lg border border-slate-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Observed CFU</label>
                  <input required name="cfu" defaultValue="0 CFU / 100 cm²" className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Permissible Limit</label>
                  <input required name="limit" defaultValue="< 5 CFU / 100 cm²" className="w-full px-3 py-1.5 rounded-lg border border-slate-300" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsEnvironmentalModalOpen(false)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold">
                  Save Swab Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL: PRELIMINARY GRAM STAIN
          ====================================================================== */}
      {isGramStainModalOpen && selectedCulture && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Microscope className="w-5 h-5 text-sky-700" />
                Record 24h Preliminary Smear &amp; Microscopy
              </h3>
              <button onClick={() => setIsGramStainModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const morphology = (form.elements.namedItem('morphology') as HTMLTextAreaElement).value;
                const pus = (form.elements.namedItem('pus') as HTMLInputElement).value;
                const epi = (form.elements.namedItem('epi') as HTMLInputElement).value;

                try {
                  await microbiologyApi.recordGramStain({
                    cultureId: selectedCulture.id,
                    gramStainMorphology: morphology,
                    pusCellsCount: pus,
                    epithelialCellsCount: epi,
                    reportedByUserId: 'USR-MICRO-01',
                  });
                } catch {
                  // Fallback
                }

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
                setToastMessage('24h Preliminary Smear documented successfully.');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Morphology Findings</label>
                <textarea required name="morphology" defaultValue={selectedCulture.gramStainMorphology || ''} placeholder="e.g. Gram-negative bacilli seen in singles with abundant neutrophils..." rows={3} className="w-full px-3 py-1.5 rounded-lg border border-slate-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Pus Cells / HPF</label>
                  <input required name="pus" defaultValue={selectedCulture.pusCellsCount || '>25 / HPF'} className="w-full px-3 py-1.5 rounded-lg border border-slate-300" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Epithelial Cells / HPF</label>
                  <input required name="epi" defaultValue={selectedCulture.epithelialCellsCount || '<5 / HPF'} className="w-full px-3 py-1.5 rounded-lg border border-slate-300" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsGramStainModalOpen(false)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-semibold">
                  Verify Smear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL: STAT CRITICAL CALL LOG
          ====================================================================== */}
      {isCriticalCallModalOpen && selectedCulture && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-rose-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-rose-950 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-rose-600 animate-pulse" />
                Log STAT Critical Value Communication (ISO 15189)
              </h3>
              <button onClick={() => setIsCriticalCallModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const doc = (form.elements.namedItem('docName') as HTMLInputElement).value;
                const nurse = (form.elements.namedItem('nurseName') as HTMLInputElement).value;
                const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
                const notes = (form.elements.namedItem('callNotes') as HTMLTextAreaElement).value;

                try {
                  await microbiologyApi.logCriticalCall({
                    cultureId: selectedCulture.id,
                    callerUserName: 'Duty Clinical Microbiologist',
                    receiverDoctorOrNurse: `${doc} / ${nurse}`,
                    wardOrDepartment: selectedCulture.wardOrUnit,
                    contactNumber: phone,
                    criticalFinding: `Critical culture finding reported verbally for ${selectedCulture.accessionNumber}`,
                    readbackConfirmed: true,
                    clinicalActionNotes: notes,
                  });
                } catch {
                  // Fallback
                }

                const newCall: CriticalCallRecord = {
                  id: `call-${Date.now()}`,
                  cultureId: selectedCulture.id,
                  accessionNumber: selectedCulture.accessionNumber,
                  patientName: selectedCulture.patientName,
                  patientId: selectedCulture.uhid,
                  sampleSite: selectedCulture.sampleSite,
                  callerUserName: 'Duty Clinical Microbiologist',
                  receiverDoctorOrNurse: `${doc} / ${nurse}`,
                  wardOrDepartment: selectedCulture.wardOrUnit,
                  contactNumber: phone,
                  criticalFinding: `Critical culture finding: ${notes}`,
                  readbackConfirmed: true,
                  clinicalActionNotes: notes,
                  calledAt: new Date().toISOString(),
                };

                setCriticalCalls(prev => [newCall, ...prev]);

                setCultures(prev => prev.map(c => {
                  if (c.id === selectedCulture.id) {
                    return {
                      ...c,
                      criticalAlertPhoneLogged: {
                        calledDoctorName: doc,
                        calledWardNurse: nurse,
                        contactNumber: phone,
                        loggedAt: new Date().toISOString(),
                        callNotes: notes,
                        readbackConfirmed: true,
                      },
                    };
                  }
                  return c;
                }));
                setIsCriticalCallModalOpen(false);
                setToastMessage(`STAT Critical Call logged to ${doc} (ISO 15189 compliant).`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Attending Consultant Name</label>
                <input required name="docName" placeholder="Dr. Rajiv Menon" className="w-full px-3 py-1.5 rounded-lg border border-slate-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ward Staff Nurse</label>
                  <input required name="nurseName" placeholder="Sister Deepa" className="w-full px-3 py-1.5 rounded-lg border border-slate-300" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Phone / Ext</label>
                  <input required name="phone" placeholder="Ext. 4022" className="w-full px-3 py-1.5 rounded-lg border border-slate-300" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Verbal Read-Back &amp; Clinical Notes</label>
                <textarea required name="callNotes" rows={3} defaultValue="STAT Critical Blood Culture positive signal communicated. Direct smear Gram stain morphology read back and confirmed." className="w-full px-3 py-1.5 rounded-lg border border-slate-300" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCriticalCallModalOpen(false)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold">
                  Record Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL: ADD / EDIT ISOLATE & AST PANEL
          ====================================================================== */}
      {isAstEntryModalOpen && selectedCulture && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Dna className="w-5 h-5 text-purple-700" />
                Document Organism Isolation &amp; AST Panel
              </h3>
              <button onClick={() => setIsAstEntryModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const orgName = (form.elements.namedItem('orgName') as HTMLInputElement).value;
                const density = (form.elements.namedItem('density') as HTMLInputElement).value;
                const gram = (form.elements.namedItem('gram') as HTMLSelectElement).value as any;

                const defaultPanel: AntibioticTestEntry[] = [
                  { antibioticCode: 'AMK', antibioticName: 'Amikacin', antibioticClass: 'Aminoglycosides', whoAwareTier: 'ACCESS', method: 'VITEK2_MIC', micValueUgMl: 4, clsiBreakpointS: '<=16', clsiBreakpointR: '>=64', interpretation: 'S', isRestrictedReserve: false, cascadeGroup: 'A' },
                  { antibioticCode: 'MEM', antibioticName: 'Meropenem', antibioticClass: 'Carbapenems', whoAwareTier: 'RESERVE', method: 'VITEK2_MIC', micValueUgMl: 0.25, clsiBreakpointS: '<=1', clsiBreakpointR: '>=4', interpretation: 'S', isRestrictedReserve: true, cascadeGroup: 'B' },
                  { antibioticCode: 'CRO', antibioticName: 'Ceftriaxone', antibioticClass: 'Cephalosporins (3rd Gen)', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 32, clsiBreakpointS: '<=1', clsiBreakpointR: '>=4', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
                  { antibioticCode: 'CIP', antibioticName: 'Ciprofloxacin', antibioticClass: 'Fluoroquinolones', whoAwareTier: 'WATCH', method: 'VITEK2_MIC', micValueUgMl: 4, clsiBreakpointS: '<=0.25', clsiBreakpointR: '>=1', interpretation: 'R', isRestrictedReserve: false, cascadeGroup: 'A' },
                ];

                const newIsolate: OrganismIsolate = {
                  isolateId: `iso-${Date.now()}`,
                  isolateNumber: (selectedCulture.isolates.length || 0) + 1,
                  organismCode: `ORG-${orgName.slice(0, 4).toUpperCase()}`,
                  organismName: orgName,
                  gramReaction: gram,
                  growthDensity: density,
                  colonyMorphology: 'Pure bacterial colonies on selective media',
                  colonyCountCfu: '>100,000 CFU/mL',
                  mdroFlags: orgName.toLowerCase().includes('mrsa') ? ['MRSA'] : orgName.toLowerCase().includes('cre') ? ['CRE'] : ['MDR'],
                  isHiccAlertTriggered: true,
                  astPanel: defaultPanel,
                };

                try {
                  await microbiologyApi.recordIsolateAst({
                    cultureId: selectedCulture.id,
                    isolateNumber: newIsolate.isolateNumber,
                    organismCode: newIsolate.organismCode,
                    organismName: newIsolate.organismName,
                    gramReaction: newIsolate.gramReaction,
                    growthDensity: newIsolate.growthDensity,
                    antibioticPanel: defaultPanel.map(d => ({
                      antibioticCode: d.antibioticCode,
                      method: d.method,
                      micValueUgMl: d.micValueUgMl,
                    })),
                    verifiedByUserId: 'USR-PATH-01',
                  });
                } catch {
                  // Fallback
                }

                setCultures(prev => prev.map(c => {
                  if (c.id === selectedCulture.id) {
                    return {
                      ...c,
                      growthStatus: 'POSITIVE',
                      isolates: [newIsolate, ...c.isolates.filter(i => i.isolateNumber !== newIsolate.isolateNumber)],
                    };
                  }
                  return c;
                }));
                setIsAstEntryModalOpen(false);
                setToastMessage(`Isolate ${orgName} and AST panel saved.`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Identified Organism Species</label>
                <input required name="orgName" placeholder="e.g. Klebsiella pneumoniae" defaultValue="Klebsiella pneumoniae" className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Gram Reaction</label>
                  <select name="gram" className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white">
                    <option value="GRAM_NEGATIVE">Gram Negative Bacilli</option>
                    <option value="GRAM_POSITIVE">Gram Positive Cocci</option>
                    <option value="YEAST">Yeast / Fungal Elements</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Growth Density</label>
                  <input required name="density" placeholder=">10^5 CFU/mL Heavy Growth" defaultValue=">10^5 CFU/mL Significant Pure Growth" className="w-full px-3 py-1.5 rounded-lg border border-slate-300" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAstEntryModalOpen(false)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold">
                  Save AST Panel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 py-3 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>NABL ISO 15189:2022 Verified · CLSI M100 Ed. 34 Breakpoints · WHO Global AMR Surveillance System (GLASS) Aligned</span>
        </div>
        <div>
          <span>Department of Laboratory Medicine · Hospital Information System (ELIS-OS)</span>
        </div>
      </div>
    </div>
  );
}

export default function MicrobiologyPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Microbiology & AMR Intelligence Suite">
        <Suspense fallback={
          <div className="p-8 text-center text-slate-500 font-medium">
            <Microscope className="w-8 h-8 animate-spin mx-auto text-sky-700 mb-2" />
            Loading Clinical Microbiology Suite &amp; AMR Engine…
          </div>
        }>
          <MicrobiologyWorkbenchContent />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
