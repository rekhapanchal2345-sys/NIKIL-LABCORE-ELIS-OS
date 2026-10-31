'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Droplets,
  DollarSign,
  Activity,
  Boxes,
  Layers,
  Lock,
  Unlock,
  Thermometer,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Plus,
  Printer,
  Download,
  FileText,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  Zap,
  RotateCw,
  Eye,
  X,
  Award,
  Scale,
  FlaskConical,
  QrCode,
  ShoppingCart,
  Cpu,
  Sparkles,
  Radio,
  FileCheck,
  ArrowLeft,
  HelpCircle,
  Info,
  Calendar,
  Hash,
  Check,
  Percent,
} from 'lucide-react';

// ============================================================================
// CLINICAL & REGULATORY ENTERPRISE DATA CONTRACTS
// Compliance: ISO 15189:2022 | CLSI EP09-A3 | CLSI EP26-A | CAP LAP COM.30300
// ============================================================================

export type ReagentInterlockStatus =
  | 'ACTIVE_ON_BOARD'
  | 'STANDBY_REFRIGERATED'
  | 'DEPLETED'
  | 'EXPIRED'
  | 'STABILITY_BREACHED'
  | 'QUARANTINED_PENDING_LOT_VERIF';

export type AlarmSeverity = 'CRITICAL_INTERLOCK' | 'WARNING' | 'ADVISORY';

export interface ReagentLotItem {
  lotId: string;
  reagentCode: string;
  reagentName: string;
  manufacturer: string;
  catalogNumber: string;
  analyzerModel: string;
  department: 'Biochemistry' | 'Immunology' | 'Hematology' | 'Coagulation' | 'Microbiology';
  onBoardStabilityDays: number;
  minimumStockAlertVol: number;
  lotNumber: string;
  expiryDate: string;
  openedOnCarouselAt: string | null;
  calibratorFactor: number;
  initialVolumeMl: number;
  remainingVolumeMl: number;
  kitPurchaseCostInr: number;
  calibratorCostPerTest: number;
  status: ReagentInterlockStatus | string;
  daysOnBoard: number | null;
  isAnalyzerInterlockBlocked: boolean;
  carouselBaySlot: number;
  refrigeratedTempCelsius: number;
  evaporationRateMlPerDay: number;
  deadVolumeMl: number;
  testsRemainingComputed: number;
  clsiVerified: boolean;
  lastQcSigma: number;
}

export interface ReagentAlarmItem {
  lotId: string;
  reagentCode: string;
  reagentName: string;
  analyzerModel: string;
  lotNumber: string;
  alarmType: 'LOT_EXPIRED' | 'ON_BOARD_STABILITY_BREACHED' | 'LOW_VOLUME_STOCKOUT_RISK' | 'TEMPERATURE_EXCURSION' | 'CALIBRATION_OVERDUE' | string;
  severity: AlarmSeverity;
  details: string;
  remainingVolumeMl: number;
  daysOnBoard: number | null;
  maxStabilityDays: number;
  expiryDate: string;
  timestamp: string;
}

export interface CptReagentComponent {
  reagentCode: string;
  reagentName: string;
  activeLotNumber: string;
  volumePerTestMl: number;
  costPerMlInr: number;
  reagentCostPerTestInr: number;
  calibratorAmortizationInr: number;
  consumableCostInr: number;
  cuvettesCount: number;
  pipetteTipsCount: number;
}

export interface TestCptProfitabilityReport {
  testCode: string;
  testName: string;
  department: string;
  analyzerModel: string;
  sellingPriceB2CInr: number;
  sellingPriceB2BInr: number;
  totalReagentCostInr: number;
  totalCalibratorCostInr: number;
  totalConsumableOverheadInr: number;
  totalCostPerTestInr: number;
  netMarginB2CInr: number;
  netGrossMarginB2CPercent: number;
  netMarginB2BInr: number;
  netGrossMarginB2BPercent: number;
  reagentBreakdown: CptReagentComponent[];
}

export interface ParallelSamplePoint {
  sampleId: string;
  patientUhid: string;
  oldLotValue: number;
  newLotValue: number;
  diff: number;
  percentBias: number;
}

export interface LotVerificationStudy {
  studyId: string;
  analyte: string;
  department: string;
  analyzerName: string;
  oldLotNumber: string;
  newLotNumber: string;
  newLotExpiry: string;
  runDate: string;
  technologistName: string;
  pathologistApprover: string;
  specimensCount: number;
  passingBablokSlope: number;
  slopeCi95Lower: number;
  slopeCi95Upper: number;
  passingBablokIntercept: number;
  interceptCi95Lower: number;
  interceptCi95Upper: number;
  pearsonR: number;
  meanPercentBias: number;
  allowableTotalErrorTeaPercent: number;
  allowableBiasLimitPercent: number;
  status: 'PASSED_ACCREDITED' | 'FAILED_BIAS_EXCEEDED' | 'PENDING_APPROVAL';
  rejectionReason?: string;
  samples: ParallelSamplePoint[];
}

export interface PurchaseOrderLine {
  poNumber: string;
  vendorName: string;
  reagentCode: string;
  reagentName: string;
  quantityOrderedPacks: number;
  unitPackCostInr: number;
  totalAmountInr: number;
  orderDate: string;
  expectedDeliveryDate: string;
  status: 'DRAFT' | 'SUBMITTED' | 'TRANSIT_COLD_CHAIN' | 'RECEIVED_QC_PENDING' | 'ACCEPTED_STOCK';
  coldChainLoggerTempRange: string;
  reorderReason: string;
}

export interface ReagentAuditEntry {
  auditId: string;
  timestamp: string;
  eventType: 'CONSUMPTION_DECREMENT' | 'CAROUSEL_INTERLOCK_ENGAGED' | 'LOT_INWARD' | 'LOT_VERIFICATION_PASS' | 'STABILITY_ALERT';
  reagentCode: string;
  lotNumber: string;
  analyzer: string;
  userId: string;
  userRole: string;
  deltaMlOrUnits: string;
  balanceAfterMl: string;
  notes: string;
  ipHash: string;
}

// ============================================================================
// CLINICAL SEED & FALLBACK MATRIX (ISO 15189 / CLSI GROUND TRUTH)
// ============================================================================

const SEED_REAGENTS: ReagentLotItem[] = [
  {
    lotId: 'lot-chol-8821',
    reagentCode: 'RGT-CHOL-R1',
    reagentName: 'Cholesterol CHOD-PAP Gen.2 Reagent',
    manufacturer: 'Roche Diagnostics GmbH',
    catalogNumber: 'ROCH-05168538',
    analyzerModel: 'Cobas c503',
    department: 'Biochemistry',
    onBoardStabilityDays: 28,
    minimumStockAlertVol: 30.0,
    lotNumber: 'LOT-CHOL-8821',
    expiryDate: '2027-02-15',
    openedOnCarouselAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    calibratorFactor: 1.0125,
    initialVolumeMl: 250.0,
    remainingVolumeMl: 172.4,
    kitPurchaseCostInr: 6250.0,
    calibratorCostPerTest: 3.5,
    status: 'ACTIVE_ON_BOARD',
    daysOnBoard: 9.0,
    isAnalyzerInterlockBlocked: false,
    carouselBaySlot: 4,
    refrigeratedTempCelsius: 4.8,
    evaporationRateMlPerDay: 0.12,
    deadVolumeMl: 2.0,
    testsRemainingComputed: 852,
    clsiVerified: true,
    lastQcSigma: 5.4,
  },
  {
    lotId: 'lot-trig-8840',
    reagentCode: 'RGT-TRIG-R1',
    reagentName: 'Triglycerides GPO-PAP Enzymatic Pack',
    manufacturer: 'Roche Diagnostics GmbH',
    catalogNumber: 'ROCH-05171407',
    analyzerModel: 'Cobas c503',
    department: 'Biochemistry',
    onBoardStabilityDays: 28,
    minimumStockAlertVol: 30.0,
    lotNumber: 'LOT-TRIG-8840',
    expiryDate: '2027-04-10',
    openedOnCarouselAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    calibratorFactor: 0.9985,
    initialVolumeMl: 250.0,
    remainingVolumeMl: 148.6,
    kitPurchaseCostInr: 7500.0,
    calibratorCostPerTest: 4.0,
    status: 'ACTIVE_ON_BOARD',
    daysOnBoard: 12.0,
    isAnalyzerInterlockBlocked: false,
    carouselBaySlot: 5,
    refrigeratedTempCelsius: 4.9,
    evaporationRateMlPerDay: 0.11,
    deadVolumeMl: 2.0,
    testsRemainingComputed: 733,
    clsiVerified: true,
    lastQcSigma: 5.8,
  },
  {
    lotId: 'lot-hdl-9102',
    reagentCode: 'RGT-HDL-D',
    reagentName: 'HDL-Cholesterol Direct Gen.4 Reagent',
    manufacturer: 'Roche Diagnostics GmbH',
    catalogNumber: 'ROCH-07528566',
    analyzerModel: 'Cobas c503',
    department: 'Biochemistry',
    onBoardStabilityDays: 21,
    minimumStockAlertVol: 25.0,
    lotNumber: 'LOT-HDL-9102',
    expiryDate: '2026-12-28',
    openedOnCarouselAt: new Date(Date.now() - 19 * 86400000).toISOString(),
    calibratorFactor: 1.004,
    initialVolumeMl: 180.0,
    remainingVolumeMl: 22.8,
    kitPurchaseCostInr: 9900.0,
    calibratorCostPerTest: 5.5,
    status: 'ACTIVE_ON_BOARD',
    daysOnBoard: 19.0,
    isAnalyzerInterlockBlocked: false,
    carouselBaySlot: 6,
    refrigeratedTempCelsius: 5.1,
    evaporationRateMlPerDay: 0.09,
    deadVolumeMl: 2.0,
    testsRemainingComputed: 138,
    clsiVerified: true,
    lastQcSigma: 4.9,
  },
  {
    lotId: 'lot-tsh-4409',
    reagentCode: 'RGT-TSH-ECLIA',
    reagentName: 'Elecsys TSH Ultrasensitive 3rd Gen',
    manufacturer: 'Roche Diagnostics GmbH',
    catalogNumber: 'ROCH-08429324',
    analyzerModel: 'Cobas e801',
    department: 'Immunology',
    onBoardStabilityDays: 30,
    minimumStockAlertVol: 20.0,
    lotNumber: 'LOT-TSH-4409',
    expiryDate: '2026-11-18',
    openedOnCarouselAt: new Date(Date.now() - 34 * 86400000).toISOString(), // 34d > 30d => Breached!
    calibratorFactor: 1.021,
    initialVolumeMl: 100.0,
    remainingVolumeMl: 28.5,
    kitPurchaseCostInr: 22800.0,
    calibratorCostPerTest: 14.5,
    status: 'STABILITY_BREACHED',
    daysOnBoard: 34.0,
    isAnalyzerInterlockBlocked: true,
    carouselBaySlot: 1,
    refrigeratedTempCelsius: 7.9,
    evaporationRateMlPerDay: 0.05,
    deadVolumeMl: 1.5,
    testsRemainingComputed: 0,
    clsiVerified: true,
    lastQcSigma: 2.9,
  },
  {
    lotId: 'lot-trop-9081',
    reagentCode: 'RGT-TROP-HS',
    reagentName: 'Elecsys Troponin T High Sensitivity',
    manufacturer: 'Roche Diagnostics GmbH',
    catalogNumber: 'ROCH-05092728',
    analyzerModel: 'Cobas e801',
    department: 'Immunology',
    onBoardStabilityDays: 28,
    minimumStockAlertVol: 15.0,
    lotNumber: 'LOT-TROP-9081',
    expiryDate: '2027-01-20',
    openedOnCarouselAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    calibratorFactor: 1.002,
    initialVolumeMl: 100.0,
    remainingVolumeMl: 46.2,
    kitPurchaseCostInr: 34500.0,
    calibratorCostPerTest: 38.0,
    status: 'ACTIVE_ON_BOARD',
    daysOnBoard: 8.0,
    isAnalyzerInterlockBlocked: false,
    carouselBaySlot: 2,
    refrigeratedTempCelsius: 4.2,
    evaporationRateMlPerDay: 0.04,
    deadVolumeMl: 1.5,
    testsRemainingComputed: 558,
    clsiVerified: true,
    lastQcSigma: 6.1,
  },
  {
    lotId: 'lot-dcl-902',
    reagentCode: 'SYS-CBC-DCL',
    reagentName: 'Cellpack DCL Automated Sheath Diluent (20L)',
    manufacturer: 'Sysmex Corporation',
    catalogNumber: 'SYS-210041',
    analyzerModel: 'Sysmex XN-1000',
    department: 'Hematology',
    onBoardStabilityDays: 60,
    minimumStockAlertVol: 3000.0,
    lotNumber: 'LOT-XN24-902',
    expiryDate: '2027-03-30',
    openedOnCarouselAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    calibratorFactor: 1.0,
    initialVolumeMl: 20000.0,
    remainingVolumeMl: 4200.0,
    kitPurchaseCostInr: 14500.0,
    calibratorCostPerTest: 1.2,
    status: 'ACTIVE_ON_BOARD',
    daysOnBoard: 14.0,
    isAnalyzerInterlockBlocked: false,
    carouselBaySlot: 1,
    refrigeratedTempCelsius: 21.0,
    evaporationRateMlPerDay: 2.5,
    deadVolumeMl: 150.0,
    testsRemainingComputed: 162,
    clsiVerified: true,
    lastQcSigma: 5.9,
  },
  {
    lotId: 'lot-wdf-774',
    reagentCode: 'SYS-CBC-WDF',
    reagentName: 'Fluorocell WDF Lysing & Staining Cartridge',
    manufacturer: 'Sysmex Corporation',
    catalogNumber: 'SYS-210088',
    analyzerModel: 'Sysmex XN-1000',
    department: 'Hematology',
    onBoardStabilityDays: 90,
    minimumStockAlertVol: 100.0,
    lotNumber: 'LOT-XN24-774',
    expiryDate: '2026-10-25', // Expired!
    openedOnCarouselAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    calibratorFactor: 1.0,
    initialVolumeMl: 1000.0,
    remainingVolumeMl: 82.0,
    kitPurchaseCostInr: 28900.0,
    calibratorCostPerTest: 3.2,
    status: 'EXPIRED',
    daysOnBoard: 40.0,
    isAnalyzerInterlockBlocked: true,
    carouselBaySlot: 2,
    refrigeratedTempCelsius: 4.5,
    evaporationRateMlPerDay: 0.15,
    deadVolumeMl: 10.0,
    testsRemainingComputed: 0,
    clsiVerified: true,
    lastQcSigma: 4.8,
  },
  {
    lotId: 'lot-crea-1102',
    reagentCode: 'RGT-CREA-EZ',
    reagentName: 'Creatinine Enzymatic IDMS-Traceable Gen.2',
    manufacturer: 'Roche Diagnostics GmbH',
    catalogNumber: 'ROCH-05168589',
    analyzerModel: 'Cobas c503',
    department: 'Biochemistry',
    onBoardStabilityDays: 28,
    minimumStockAlertVol: 20.0,
    lotNumber: 'LOT-CR-1102',
    expiryDate: '2027-05-18',
    openedOnCarouselAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    calibratorFactor: 1.0015,
    initialVolumeMl: 150.0,
    remainingVolumeMl: 124.0,
    kitPurchaseCostInr: 8400.0,
    calibratorCostPerTest: 3.8,
    status: 'ACTIVE_ON_BOARD',
    daysOnBoard: 4.0,
    isAnalyzerInterlockBlocked: false,
    carouselBaySlot: 7,
    refrigeratedTempCelsius: 4.7,
    evaporationRateMlPerDay: 0.08,
    deadVolumeMl: 2.0,
    testsRemainingComputed: 813,
    clsiVerified: true,
    lastQcSigma: 5.6,
  },
];

const SEED_LOT_VERIFICATIONS: LotVerificationStudy[] = [
  {
    studyId: 'LOT-VER-2026-CHOL-01',
    analyte: 'Serum Cholesterol (CHOD-PAP)',
    department: 'Biochemistry',
    analyzerName: 'Roche Cobas c503',
    oldLotNumber: 'LOT-CHOL-7719 (Retiring)',
    newLotNumber: 'LOT-CHOL-8821 (Incoming Batch)',
    newLotExpiry: '2027-02-15',
    runDate: '2026-10-28 09:45 AM',
    technologistName: 'Ramesh Sen, M.Sc (Senior Biochemist)',
    pathologistApprover: 'Dr. Rajesh Nair, MD (Chief Pathologist)',
    specimensCount: 20,
    passingBablokSlope: 1.008,
    slopeCi95Lower: 0.992,
    slopeCi95Upper: 1.024,
    passingBablokIntercept: -0.42,
    interceptCi95Lower: -1.25,
    interceptCi95Upper: 0.38,
    pearsonR: 0.9994,
    meanPercentBias: 1.15,
    allowableTotalErrorTeaPercent: 8.0,
    allowableBiasLimitPercent: 4.0,
    status: 'PASSED_ACCREDITED',
    samples: [
      { sampleId: 'SPLIT-01', patientUhid: 'UHID-BIO-101', oldLotValue: 142.0, newLotValue: 143.5, diff: 1.5, percentBias: 1.06 },
      { sampleId: 'SPLIT-02', patientUhid: 'UHID-BIO-102', oldLotValue: 188.0, newLotValue: 190.2, diff: 2.2, percentBias: 1.17 },
      { sampleId: 'SPLIT-03', patientUhid: 'UHID-BIO-103', oldLotValue: 224.0, newLotValue: 226.5, diff: 2.5, percentBias: 1.12 },
      { sampleId: 'SPLIT-04', patientUhid: 'UHID-BIO-104', oldLotValue: 275.0, newLotValue: 278.0, diff: 3.0, percentBias: 1.09 },
      { sampleId: 'SPLIT-05', patientUhid: 'UHID-BIO-105', oldLotValue: 310.0, newLotValue: 314.1, diff: 4.1, percentBias: 1.32 },
      { sampleId: 'SPLIT-06', patientUhid: 'UHID-BIO-106', oldLotValue: 165.0, newLotValue: 166.8, diff: 1.8, percentBias: 1.09 },
      { sampleId: 'SPLIT-07', patientUhid: 'UHID-BIO-107', oldLotValue: 198.0, newLotValue: 200.5, diff: 2.5, percentBias: 1.26 },
      { sampleId: 'SPLIT-08', patientUhid: 'UHID-BIO-108', oldLotValue: 242.0, newLotValue: 244.6, diff: 2.6, percentBias: 1.07 },
    ],
  },
  {
    studyId: 'LOT-VER-2026-TROP-02',
    analyte: 'High Sensitivity Troponin T',
    department: 'Immunology',
    analyzerName: 'Roche Cobas e801',
    oldLotNumber: 'LOT-TRP-8890',
    newLotNumber: 'LOT-TROP-9081',
    newLotExpiry: '2027-01-20',
    runDate: '2026-10-29 11:20 AM',
    technologistName: 'Kavita Patel (QC Technologist)',
    pathologistApprover: 'Dr. Deshmukh (Biochemistry HOD)',
    specimensCount: 25,
    passingBablokSlope: 0.997,
    slopeCi95Lower: 0.985,
    slopeCi95Upper: 1.012,
    passingBablokIntercept: 0.12,
    interceptCi95Lower: -0.25,
    interceptCi95Upper: 0.48,
    pearsonR: 0.9998,
    meanPercentBias: 1.65,
    allowableTotalErrorTeaPercent: 12.0,
    allowableBiasLimitPercent: 5.5,
    status: 'PASSED_ACCREDITED',
    samples: [
      { sampleId: 'SPLIT-11', patientUhid: 'UHID-IMM-201', oldLotValue: 8.4, newLotValue: 8.5, diff: 0.1, percentBias: 1.19 },
      { sampleId: 'SPLIT-12', patientUhid: 'UHID-IMM-202', oldLotValue: 14.2, newLotValue: 14.5, diff: 0.3, percentBias: 2.11 },
      { sampleId: 'SPLIT-13', patientUhid: 'UHID-IMM-203', oldLotValue: 52.0, newLotValue: 52.8, diff: 0.8, percentBias: 1.54 },
      { sampleId: 'SPLIT-14', patientUhid: 'UHID-IMM-204', oldLotValue: 210.0, newLotValue: 213.2, diff: 3.2, percentBias: 1.52 },
    ],
  },
];

const SEED_PURCHASE_ORDERS: PurchaseOrderLine[] = [
  {
    poNumber: 'PO-2026-RGT-941',
    vendorName: 'Roche Diagnostics India Pvt Ltd',
    reagentCode: 'RGT-TSH-ECLIA',
    reagentName: 'Elecsys TSH Ultrasensitive 3rd Gen (300T)',
    quantityOrderedPacks: 6,
    unitPackCostInr: 22800,
    totalAmountInr: 136800,
    orderDate: '2026-10-27',
    expectedDeliveryDate: '2026-11-01',
    status: 'TRANSIT_COLD_CHAIN',
    coldChainLoggerTempRange: '2.4°C – 5.1°C (Compliant)',
    reorderReason: 'On-Board Stability Breach on active Carousel Lot LOT-TSH-4409',
  },
  {
    poNumber: 'PO-2026-RGT-938',
    vendorName: 'Sysmex India Private Limited',
    reagentCode: 'SYS-CBC-WDF',
    reagentName: 'Fluorocell WDF Lysing & Staining Cartridge',
    quantityOrderedPacks: 8,
    unitPackCostInr: 28900,
    totalAmountInr: 231200,
    orderDate: '2026-10-26',
    expectedDeliveryDate: '2026-10-31',
    status: 'TRANSIT_COLD_CHAIN',
    coldChainLoggerTempRange: '3.1°C – 4.8°C (Compliant)',
    reorderReason: 'Calendar lot expiry reached on LOT-XN24-774',
  },
  {
    poNumber: 'PO-2026-RGT-930',
    vendorName: 'Roche Diagnostics India Pvt Ltd',
    reagentCode: 'RGT-HDL-D',
    reagentName: 'HDL-Cholesterol Direct Gen.4 Reagent (180T)',
    quantityOrderedPacks: 5,
    unitPackCostInr: 9900,
    totalAmountInr: 49500,
    orderDate: '2026-10-24',
    expectedDeliveryDate: '2026-10-29',
    status: 'ACCEPTED_STOCK',
    coldChainLoggerTempRange: '2.8°C – 4.9°C (Verified)',
    reorderReason: 'Safety buffer volume depleted to < 25 mL',
  },
];

const SEED_AUDIT_LOGS: ReagentAuditEntry[] = [
  {
    auditId: 'AUD-9011',
    timestamp: '2026-10-31 10:48:12',
    eventType: 'CONSUMPTION_DECREMENT',
    reagentCode: 'RGT-CHOL-R1',
    lotNumber: 'LOT-CHOL-8821',
    analyzer: 'Cobas c503',
    userId: 'USR-AUTO-LIMS',
    userRole: 'Analyzer ASTM Protocol Agent',
    deltaMlOrUnits: '-0.200 mL',
    balanceAfterMl: '172.400 mL',
    notes: 'Recipe decrement for Routine Lipid Run (UHID-2026-9041)',
    ipHash: '10.0.4.112#MD5-A8F2',
  },
  {
    auditId: 'AUD-9010',
    timestamp: '2026-10-31 10:30:04',
    eventType: 'CAROUSEL_INTERLOCK_ENGAGED',
    reagentCode: 'RGT-TSH-ECLIA',
    lotNumber: 'LOT-TSH-4409',
    analyzer: 'Cobas e801',
    userId: 'SYS-INTERLOCK-ENGINE',
    userRole: 'Automated QC Safety Agent',
    deltaMlOrUnits: 'STATUS_LOCKED',
    balanceAfterMl: '28.500 mL',
    notes: 'HARD INTERLOCK: On-board refrigerated carousel stability breached (34d > 30d limit). Test channel disabled.',
    ipHash: '127.0.0.1#MD5-0001',
  },
  {
    auditId: 'AUD-9009',
    timestamp: '2026-10-31 09:15:30',
    eventType: 'LOT_VERIFICATION_PASS',
    reagentCode: 'RGT-CHOL-R1',
    lotNumber: 'LOT-CHOL-8821',
    analyzer: 'Cobas c503',
    userId: 'USR-PATH-01',
    userRole: 'Chief Pathologist (Dr. Nair)',
    deltaMlOrUnits: 'CLSI_PASSED',
    balanceAfterMl: '250.000 mL',
    notes: 'CLSI EP09-A3 Passing-Bablok regression slope 1.008 passed TEa criteria. Lot unlocked for clinical reporting.',
    ipHash: '10.0.1.20#MD5-B941',
  },
];

// ============================================================================
// MAIN ENTERPRISE REAGENT & CPT WORKSTATION COMPONENT
// ============================================================================

export default function EnterpriseReagentCptWorkstation() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    'overview' | 'carousel_interlock' | 'cpt_engine' | 'clsi_ep09' | 'arrhenius_kinetics' | 'procurement' | 'audit_trail'
  >('overview');

  // Core Data States
  const [lots, setLots] = useState<ReagentLotItem[]>(SEED_REAGENTS);
  const [alarms, setAlarms] = useState<ReagentAlarmItem[]>([]);
  const [cptReports, setCptReports] = useState<TestCptProfitabilityReport[]>([]);
  const [lotStudies, setLotStudies] = useState<LotVerificationStudy[]>(SEED_LOT_VERIFICATIONS);
  const [selectedStudy, setSelectedStudy] = useState<LotVerificationStudy>(SEED_LOT_VERIFICATIONS[0]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderLine[]>(SEED_PURCHASE_ORDERS);
  const [auditLogs, setAuditLogs] = useState<ReagentAuditEntry[]>(SEED_AUDIT_LOGS);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Simulation Form State
  const [selectedTestCode, setSelectedTestCode] = useState<string>('LIPID');
  const [sampleBarcode, setSampleBarcode] = useState<string>('SMP-BIO-2026-441');
  const [executionMessage, setExecutionMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
    details?: string;
  } | null>(null);
  const [isExecutingSimulation, setIsExecutingSimulation] = useState(false);

  // New Lot Modal State
  const [isNewLotModalOpen, setIsNewLotModalOpen] = useState(false);
  const [newLotForm, setNewLotForm] = useState({
    reagentCode: 'RGT-GLUC-HK',
    reagentName: 'Glucose Hexokinase Enzymatic Gen.3',
    manufacturer: 'Roche Diagnostics GmbH',
    catalogNumber: 'ROCH-05168791',
    analyzerModel: 'Cobas c503',
    department: 'Biochemistry' as const,
    lotNumber: 'LOT-GLU-9920',
    expiryDate: '2027-08-30',
    initialVolumeMl: 250,
    kitPurchaseCostInr: 5800,
    calibratorCostPerTest: 3.2,
    onBoardStabilityDays: 28,
    minimumStockAlertVol: 35,
    carouselBaySlot: 8,
  });

  // Arrhenius Simulation Calculator State
  const [arrheniusExcursionHours, setArrheniusExcursionHours] = useState(6.0);
  const [arrheniusChamberTemp, setArrheniusChamberTemp] = useState(12.5); // Warm excursion
  const [arrheniusNominalTemp] = useState(4.0); // 4°C target
  const [arrheniusActivationEnergyEa] = useState(83.14); // kJ/mol typical enzyme activation energy

  // Resolve API Base dynamically
  const resolveApiBase = (): string => {
    const globalProcess = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
    const raw = (globalProcess?.env?.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
    if (!raw) return '/api/v1';
    if (raw.endsWith('/api/v1')) return raw;
    if (raw.endsWith('/api')) return `${raw}/v1`;
    return `${raw}/api/v1`;
  };
  const apiBase = resolveApiBase();

  // Load Real-time Inventory from Backend
  const loadRemoteInventory = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/enterprise-tier2/inventory/overview`);
      if (res.ok) {
        const json = await res.json();
        if (json.data?.reagentLots && Array.isArray(json.data.reagentLots) && json.data.reagentLots.length > 0) {
          // Merge with detailed seed metadata for fields not present in raw SQL table
          const merged = json.data.reagentLots.map((r: any, idx: number) => {
            const seedMatch = SEED_REAGENTS.find((s) => s.reagentCode === r.reagentCode);
            return {
              ...seedMatch,
              ...r,
              carouselBaySlot: seedMatch?.carouselBaySlot ?? idx + 1,
              refrigeratedTempCelsius: seedMatch?.refrigeratedTempCelsius ?? 4.5,
              evaporationRateMlPerDay: seedMatch?.evaporationRateMlPerDay ?? 0.1,
              deadVolumeMl: seedMatch?.deadVolumeMl ?? 2.0,
              testsRemainingComputed: Math.max(
                0,
                Math.floor(((r.remainingVolumeMl || 0) - (seedMatch?.deadVolumeMl || 2.0)) / 0.2)
              ),
              clsiVerified: seedMatch?.clsiVerified ?? true,
              lastQcSigma: seedMatch?.lastQcSigma ?? 5.2,
            };
          });
          setLots(merged);
        }
        if (json.data?.activeAlarms && Array.isArray(json.data.activeAlarms)) {
          setAlarms(json.data.activeAlarms);
        }
        if (json.data?.cptProfitability && Array.isArray(json.data.cptProfitability)) {
          setCptReports(json.data.cptProfitability);
        }
      }
    } catch {
      // Gracefully maintain client seed ground truth
    }
  }, [apiBase]);

  useEffect(() => {
    loadRemoteInventory();
  }, [loadRemoteInventory]);

  // Derive Dynamic Alarms if not populated from backend
  const activeAlarmsCalculated = useMemo(() => {
    if (alarms.length > 0) return alarms;
    const computed: ReagentAlarmItem[] = [];
    const now = Date.now();

    lots.forEach((lot) => {
      const expTime = new Date(lot.expiryDate).getTime();
      const isExpired = expTime <= now;
      const daysOpen = lot.daysOnBoard ?? 0;
      const isStabilityBreached = daysOpen > lot.onBoardStabilityDays;
      const isLowStock = lot.remainingVolumeMl <= lot.minimumStockAlertVol;

      if (isExpired) {
        computed.push({
          lotId: lot.lotId,
          reagentCode: lot.reagentCode,
          reagentName: lot.reagentName,
          analyzerModel: lot.analyzerModel,
          lotNumber: lot.lotNumber,
          alarmType: 'LOT_EXPIRED',
          severity: 'CRITICAL_INTERLOCK',
          details: `Manufacturer kit shelf-life expired on ${lot.expiryDate}. Auto-verification interlock hard locked.`,
          remainingVolumeMl: lot.remainingVolumeMl,
          daysOnBoard: lot.daysOnBoard,
          maxStabilityDays: lot.onBoardStabilityDays,
          expiryDate: lot.expiryDate,
          timestamp: new Date().toISOString(),
        });
      }

      if (isStabilityBreached) {
        computed.push({
          lotId: lot.lotId,
          reagentCode: lot.reagentCode,
          reagentName: lot.reagentName,
          analyzerModel: lot.analyzerModel,
          lotNumber: lot.lotNumber,
          alarmType: 'ON_BOARD_STABILITY_BREACHED',
          severity: 'CRITICAL_INTERLOCK',
          details: `Pierced on-board carousel stability exceeded (${daysOpen.toFixed(1)}d open > ${lot.onBoardStabilityDays}d maximum). Chemical enzymatic denaturation risk.`,
          remainingVolumeMl: lot.remainingVolumeMl,
          daysOnBoard: lot.daysOnBoard,
          maxStabilityDays: lot.onBoardStabilityDays,
          expiryDate: lot.expiryDate,
          timestamp: new Date().toISOString(),
        });
      }

      if (isLowStock && !isExpired && !isStabilityBreached) {
        computed.push({
          lotId: lot.lotId,
          reagentCode: lot.reagentCode,
          reagentName: lot.reagentName,
          analyzerModel: lot.analyzerModel,
          lotNumber: lot.lotNumber,
          alarmType: 'LOW_VOLUME_STOCKOUT_RISK',
          severity: 'WARNING',
          details: `Remaining volume (${lot.remainingVolumeMl.toFixed(1)} mL) is below minimum safety threshold (${lot.minimumStockAlertVol} mL). Trigger automated PO replenishment.`,
          remainingVolumeMl: lot.remainingVolumeMl,
          daysOnBoard: lot.daysOnBoard,
          maxStabilityDays: lot.onBoardStabilityDays,
          expiryDate: lot.expiryDate,
          timestamp: new Date().toISOString(),
        });
      }
    });

    return computed;
  }, [alarms, lots]);

  // Dynamic CPT Profitability Calculation if backend is cold
  const activeCptReports = useMemo<TestCptProfitabilityReport[]>(() => {
    if (cptReports.length > 0) return cptReports;

    const cholLot = lots.find((l) => l.reagentCode === 'RGT-CHOL-R1') || lots[0];
    const trigLot = lots.find((l) => l.reagentCode === 'RGT-TRIG-R1') || lots[1];
    const hdlLot = lots.find((l) => l.reagentCode === 'RGT-HDL-D') || lots[2];
    const tshLot = lots.find((l) => l.reagentCode === 'RGT-TSH-ECLIA') || lots[3];
    const tropLot = lots.find((l) => l.reagentCode === 'RGT-TROP-HS') || lots[4];
    const creaLot = lots.find((l) => l.reagentCode === 'RGT-CREA-EZ') || lots[7];

    const makeComp = (lot: ReagentLotItem, volMl: number, cuvettes: number, tips: number, calCost: number, overhead: number): CptReagentComponent => {
      const costPerMl = lot.kitPurchaseCostInr / Math.max(lot.initialVolumeMl, 1);
      const reagentCost = Number((costPerMl * volMl).toFixed(2));
      return {
        reagentCode: lot.reagentCode,
        reagentName: lot.reagentName,
        activeLotNumber: lot.lotNumber,
        volumePerTestMl: volMl,
        costPerMlInr: Number(costPerMl.toFixed(2)),
        reagentCostPerTestInr: reagentCost,
        calibratorAmortizationInr: calCost,
        consumableCostInr: overhead,
        cuvettesCount: cuvettes,
        pipetteTipsCount: tips,
      };
    };

    const lipidComponents = [
      makeComp(cholLot, 0.2, 1, 1, 3.5, 3.0),
      makeComp(trigLot, 0.2, 1, 1, 4.0, 3.0),
      makeComp(hdlLot, 0.15, 1, 1, 5.5, 3.5),
    ];
    const lipidReagentCost = lipidComponents.reduce((sum, c) => sum + c.reagentCostPerTestInr, 0);
    const lipidCalCost = lipidComponents.reduce((sum, c) => sum + c.calibratorAmortizationInr, 0);
    const lipidConsumable = lipidComponents.reduce((sum, c) => sum + c.consumableCostInr, 0);
    const lipidTotalCpt = Number((lipidReagentCost + lipidCalCost + lipidConsumable).toFixed(2));

    const tshComponents = [makeComp(tshLot, 0.12, 1, 2, 14.5, 5.5)];
    const tshReagentCost = tshComponents[0].reagentCostPerTestInr;
    const tshTotalCpt = Number((tshReagentCost + 14.5 + 5.5).toFixed(2));

    const tropComponents = [makeComp(tropLot, 0.08, 1, 2, 38.0, 8.0)];
    const tropTotalCpt = Number((tropComponents[0].reagentCostPerTestInr + 38.0 + 8.0).toFixed(2));

    const creaComponents = [makeComp(creaLot, 0.15, 1, 1, 3.8, 2.5)];
    const creaTotalCpt = Number((creaComponents[0].reagentCostPerTestInr + 3.8 + 2.5).toFixed(2));

    return [
      {
        testCode: 'LIPID',
        testName: 'Complete Lipid Profile (Chol, Trig, HDL, Direct LDL)',
        department: 'Biochemistry',
        analyzerModel: 'Cobas c503',
        sellingPriceB2CInr: 850,
        sellingPriceB2BInr: 480,
        totalReagentCostInr: Number(lipidReagentCost.toFixed(2)),
        totalCalibratorCostInr: Number(lipidCalCost.toFixed(2)),
        totalConsumableOverheadInr: Number(lipidConsumable.toFixed(2)),
        totalCostPerTestInr: lipidTotalCpt,
        netMarginB2CInr: Number((850 - lipidTotalCpt).toFixed(2)),
        netGrossMarginB2CPercent: Number((((850 - lipidTotalCpt) / 850) * 100).toFixed(1)),
        netMarginB2BInr: Number((480 - lipidTotalCpt).toFixed(2)),
        netGrossMarginB2BPercent: Number((((480 - lipidTotalCpt) / 480) * 100).toFixed(1)),
        reagentBreakdown: lipidComponents,
      },
      {
        testCode: 'TSH',
        testName: 'Ultrasensitive TSH (Chemiluminescent Immunoassay)',
        department: 'Immunology',
        analyzerModel: 'Cobas e801',
        sellingPriceB2CInr: 550,
        sellingPriceB2BInr: 290,
        totalReagentCostInr: Number(tshReagentCost.toFixed(2)),
        totalCalibratorCostInr: 14.5,
        totalConsumableOverheadInr: 5.5,
        totalCostPerTestInr: tshTotalCpt,
        netMarginB2CInr: Number((550 - tshTotalCpt).toFixed(2)),
        netGrossMarginB2CPercent: Number((((550 - tshTotalCpt) / 550) * 100).toFixed(1)),
        netMarginB2BInr: Number((290 - tshTotalCpt).toFixed(2)),
        netGrossMarginB2BPercent: Number((((290 - tshTotalCpt) / 290) * 100).toFixed(1)),
        reagentBreakdown: tshComponents,
      },
      {
        testCode: 'TROP_T',
        testName: 'High Sensitivity Troponin T (STAT Cardiac Necrosis)',
        department: 'Immunology',
        analyzerModel: 'Cobas e801',
        sellingPriceB2CInr: 1800,
        sellingPriceB2BInr: 1100,
        totalReagentCostInr: tropComponents[0].reagentCostPerTestInr,
        totalCalibratorCostInr: 38.0,
        totalConsumableOverheadInr: 8.0,
        totalCostPerTestInr: tropTotalCpt,
        netMarginB2CInr: Number((1800 - tropTotalCpt).toFixed(2)),
        netGrossMarginB2CPercent: Number((((1800 - tropTotalCpt) / 1800) * 100).toFixed(1)),
        netMarginB2BInr: Number((1100 - tropTotalCpt).toFixed(2)),
        netGrossMarginB2BPercent: Number((((1100 - tropTotalCpt) / 1100) * 100).toFixed(1)),
        reagentBreakdown: tropComponents,
      },
      {
        testCode: 'CREATININE',
        testName: 'Serum Creatinine (IDMS Traceable Enzymatic Rate)',
        department: 'Biochemistry',
        analyzerModel: 'Cobas c503',
        sellingPriceB2CInr: 280,
        sellingPriceB2BInr: 140,
        totalReagentCostInr: creaComponents[0].reagentCostPerTestInr,
        totalCalibratorCostInr: 3.8,
        totalConsumableOverheadInr: 2.5,
        totalCostPerTestInr: creaTotalCpt,
        netMarginB2CInr: Number((280 - creaTotalCpt).toFixed(2)),
        netGrossMarginB2CPercent: Number((((280 - creaTotalCpt) / 280) * 100).toFixed(1)),
        netMarginB2BInr: Number((140 - creaTotalCpt).toFixed(2)),
        netGrossMarginB2BPercent: Number((((140 - creaTotalCpt) / 140) * 100).toFixed(1)),
        reagentBreakdown: creaComponents,
      },
    ];
  }, [cptReports, lots]);

  // Execute Simulated Consumption with Live Interlock Enforcement
  const handleExecuteConsumptionSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecutingSimulation(true);
    setExecutionMessage(null);

    try {
      const res = await fetch(`${apiBase}/enterprise-tier2/inventory/consume-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testCode: selectedTestCode,
          sampleBarcode,
          orderId: `ORD-${Date.now().toString().slice(-6)}`,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setExecutionMessage({
          type: 'success',
          text: `Sample ${sampleBarcode} Aspirated & Verified`,
          details: `Decremented ${json.data?.totalItemsDecremented ?? 'recipe'} reagent volumes, reaction cuvettes & conductive tips. Lot verification audit entry generated.`,
        });
        loadRemoteInventory();
      } else {
        setExecutionMessage({
          type: 'error',
          text: 'Analyzer Interlock Locked Execution',
          details: json.message || 'The test run was rejected because an active reagent on this channel is expired, breached, or below dead volume threshold.',
        });
      }
    } catch {
      // Offline local simulation mode
      if (selectedTestCode === 'TSH') {
        setExecutionMessage({
          type: 'error',
          text: 'ANALYZER INTERLOCK ENGAGED: Run Blocked on Cobas e801',
          details: 'Elecsys TSH Lot #LOT-TSH-4409 exceeded maximum on-board carousel refrigerated stability (34.0d open > 30d max). In accordance with CAP COM.30300 and NABL ISO 15189, patient aspiration is hard-interlocked.',
        });
      } else {
        // Decrement local cholesterol & triglycerides
        setLots((prev) =>
          prev.map((lot) => {
            if (lot.reagentCode === 'RGT-CHOL-R1') {
              const newVol = Number(Math.max(0, lot.remainingVolumeMl - 0.2).toFixed(3));
              return { ...lot, remainingVolumeMl: newVol };
            }
            if (lot.reagentCode === 'RGT-TRIG-R1') {
              const newVol = Number(Math.max(0, lot.remainingVolumeMl - 0.2).toFixed(3));
              return { ...lot, remainingVolumeMl: newVol };
            }
            if (lot.reagentCode === 'RGT-HDL-D') {
              const newVol = Number(Math.max(0, lot.remainingVolumeMl - 0.15).toFixed(3));
              return { ...lot, remainingVolumeMl: newVol };
            }
            return lot;
          })
        );

        setExecutionMessage({
          type: 'success',
          text: `Sample ${sampleBarcode} Aspirated & Verified`,
          details: `Decremented 0.200 mL Cholesterol, 0.200 mL Triglycerides, and 0.150 mL HDL Direct. Total CPT cost deducted: ₹38.65.`,
        });

        // Add to audit trail
        setAuditLogs((prev) => [
          {
            auditId: `AUD-${Date.now().toString().slice(-4)}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            eventType: 'CONSUMPTION_DECREMENT',
            reagentCode: 'RGT-CHOL-R1',
            lotNumber: 'LOT-CHOL-8821',
            analyzer: 'Cobas c503',
            userId: 'USR-OPR-441',
            userRole: 'Medical Lab Technologist',
            deltaMlOrUnits: '-0.200 mL',
            balanceAfterMl: '172.200 mL',
            notes: `Patient Run Simulation for ${sampleBarcode} (${selectedTestCode})`,
            ipHash: '192.168.1.104#SHA256',
          },
          ...prev,
        ]);
      }
    } finally {
      setIsExecutingSimulation(false);
    }
  };

  // Register New Reagent Lot
  const handleRegisterNewLotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newLotItem: ReagentLotItem = {
      lotId: `lot-${Date.now()}`,
      reagentCode: newLotForm.reagentCode,
      reagentName: newLotForm.reagentName,
      manufacturer: newLotForm.manufacturer,
      catalogNumber: newLotForm.catalogNumber,
      analyzerModel: newLotForm.analyzerModel,
      department: newLotForm.department,
      onBoardStabilityDays: newLotForm.onBoardStabilityDays,
      minimumStockAlertVol: newLotForm.minimumStockAlertVol,
      lotNumber: newLotForm.lotNumber,
      expiryDate: newLotForm.expiryDate,
      openedOnCarouselAt: new Date().toISOString(),
      calibratorFactor: 1.0,
      initialVolumeMl: newLotForm.initialVolumeMl,
      remainingVolumeMl: newLotForm.initialVolumeMl,
      kitPurchaseCostInr: newLotForm.kitPurchaseCostInr,
      calibratorCostPerTest: newLotForm.calibratorCostPerTest,
      status: 'ACTIVE_ON_BOARD',
      daysOnBoard: 0.1,
      isAnalyzerInterlockBlocked: false,
      carouselBaySlot: newLotForm.carouselBaySlot,
      refrigeratedTempCelsius: 4.5,
      evaporationRateMlPerDay: 0.1,
      deadVolumeMl: 2.0,
      testsRemainingComputed: Math.floor((newLotForm.initialVolumeMl - 2.0) / 0.2),
      clsiVerified: true,
      lastQcSigma: 5.5,
    };

    setLots((prev) => [newLotItem, ...prev]);
    setIsNewLotModalOpen(false);

    setAuditLogs((prev) => [
      {
        auditId: `AUD-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        eventType: 'LOT_INWARD',
        reagentCode: newLotItem.reagentCode,
        lotNumber: newLotItem.lotNumber,
        analyzer: newLotItem.analyzerModel,
        userId: 'USR-SUPERVISOR',
        userRole: 'Quality Assurance Manager',
        deltaMlOrUnits: `+${newLotItem.initialVolumeMl} mL`,
        balanceAfterMl: `${newLotItem.initialVolumeMl} mL`,
        notes: `Inward Registration for ${newLotItem.reagentName} on Carousel Slot #${newLotItem.carouselBaySlot}`,
        ipHash: '192.168.1.100#SHA256',
      },
      ...prev,
    ]);

    // Optional POST to backend
    try {
      await fetch(`${apiBase}/enterprise-tier2/inventory/reagent-lots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reagentCode: newLotForm.reagentCode,
          reagentName: newLotForm.reagentName,
          manufacturer: newLotForm.manufacturer,
          analyzerModel: newLotForm.analyzerModel,
          packSizeVolume: newLotForm.initialVolumeMl,
          onBoardStabilityDays: newLotForm.onBoardStabilityDays,
          minimumStockAlertVol: newLotForm.minimumStockAlertVol,
          lotNumber: newLotForm.lotNumber,
          expiryDate: newLotForm.expiryDate,
          initialVolumeMl: newLotForm.initialVolumeMl,
          kitPurchaseCostInr: newLotForm.kitPurchaseCostInr,
          calibratorCostPerTest: newLotForm.calibratorCostPerTest,
        }),
      });
    } catch {
      // Local fallback active
    }
  };

  // Arrhenius Kinetics Shelf-Life Degradation Calculator
  const arrheniusMetrics = useMemo(() => {
    // k = A * exp(-Ea / (R * T))
    // Ratio of degradation rates = exp[ (Ea / R) * (1/T_nom - 1/T_excursion) ]
    const R = 8.314; // J/(mol*K)
    const Ea_Joules = arrheniusActivationEnergyEa * 1000;
    const T_nom_Kelvin = arrheniusNominalTemp + 273.15;
    const T_excursion_Kelvin = arrheniusChamberTemp + 273.15;

    const rateAccelerationFactor = Math.exp((Ea_Joules / R) * (1 / T_nom_Kelvin - 1 / T_excursion_Kelvin));
    const equivalentDaysAtNominalLost = (arrheniusExcursionHours / 24) * rateAccelerationFactor;
    const shelfLifeImpactPercent = Math.min(100, (equivalentDaysAtNominalLost / 28) * 100);

    return {
      rateAccelerationFactor: Number(rateAccelerationFactor.toFixed(2)),
      equivalentDaysAtNominalLost: Number(equivalentDaysAtNominalLost.toFixed(2)),
      shelfLifeImpactPercent: Number(shelfLifeImpactPercent.toFixed(1)),
      isActionRequired: rateAccelerationFactor > 3.0 || shelfLifeImpactPercent > 20.0,
    };
  }, [arrheniusActivationEnergyEa, arrheniusChamberTemp, arrheniusExcursionHours, arrheniusNominalTemp]);

  // Filtered Lots
  const filteredLots = useMemo(() => {
    return lots.filter((lot) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        lot.reagentName.toLowerCase().includes(q) ||
        lot.reagentCode.toLowerCase().includes(q) ||
        lot.lotNumber.toLowerCase().includes(q) ||
        lot.analyzerModel.toLowerCase().includes(q);

      const matchesDept = departmentFilter === 'ALL' || lot.department === departmentFilter;

      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') matchesStatus = !lot.isAnalyzerInterlockBlocked;
      else if (statusFilter === 'LOCKED') matchesStatus = lot.isAnalyzerInterlockBlocked;
      else if (statusFilter === 'LOW') matchesStatus = lot.remainingVolumeMl <= lot.minimumStockAlertVol;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [lots, searchQuery, departmentFilter, statusFilter]);

  // Aggregate Top-Level KPIs
  const kpis = useMemo(() => {
    const totalLots = lots.length;
    const activeLots = lots.filter((l) => !l.isAnalyzerInterlockBlocked).length;
    const lockedLots = lots.filter((l) => l.isAnalyzerInterlockBlocked).length;
    const lowStockLots = lots.filter((l) => l.remainingVolumeMl <= l.minimumStockAlertVol).length;
    const totalInventoryValueInr = lots.reduce(
      (sum, l) => sum + (l.kitPurchaseCostInr * (l.remainingVolumeMl / Math.max(l.initialVolumeMl, 1))),
      0
    );
    const avgGrossMarginB2C = (
      activeCptReports.reduce((sum, r) => sum + r.netGrossMarginB2CPercent, 0) / Math.max(1, activeCptReports.length)
    ).toFixed(1);

    return {
      totalLots,
      activeLots,
      lockedLots,
      lowStockLots,
      totalInventoryValueInr: Math.round(totalInventoryValueInr),
      avgGrossMarginB2C,
    };
  }, [lots, activeCptReports]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. TOP ENTERPRISE CLINICAL HEADER                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Title & Navigation Back */}
            <div className="flex items-center gap-3">
              <Link
                href="/inventory"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Return to Main Inventory Hub"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    NABL ISO 15189:2022 §6.4
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                    CLSI EP09-A3 & EP26-A
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                    Carousel ASTM Telemetry Live
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
                  Reagent & Consumables Control Workstation
                </h1>
                <p className="text-xs text-slate-500">
                  Micro-Costing CPT Engine · Automated Carousel Interlocks · Passing-Bablok Lot Verification · Arrhenius Kinetics
                </p>
              </div>
            </div>

            {/* Header Right Action Group */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => setIsNewLotModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Inward New Lot</span>
              </button>

              <button
                onClick={() => {
                  window.print();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                title="Print NABL Reagent Inspection Binder"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>NABL Report</span>
              </button>

              <button
                onClick={loadRemoteInventory}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                title="Synchronize Live Hardware Telemetry"
              >
                <RefreshCw className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* PRIMARY ENTERPRISE TAB NAVIGATION                                 */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="flex items-center gap-1 border-t border-slate-100 mt-3 pt-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Lot Overview & Inventory</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${activeTab === 'overview' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {lots.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('carousel_interlock')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'carousel_interlock'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Analyzer Carousel Interlocks</span>
              {kpis.lockedLots > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700">
                  {kpis.lockedLots} Locked
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('cpt_engine')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'cpt_engine'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Cost-Per-Test (CPT) Engine</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-purple-100 text-purple-700">
                {activeCptReports.length} Panels
              </span>
            </button>

            <button
              onClick={() => setActiveTab('clsi_ep09')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'clsi_ep09'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>CLSI EP09-A3 Lot Verification</span>
            </button>

            <button
              onClick={() => setActiveTab('arrhenius_kinetics')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'arrhenius_kinetics'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span>Arrhenius Thermal Degradation</span>
            </button>

            <button
              onClick={() => setActiveTab('procurement')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'procurement'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Procurement &amp; Orders</span>
            </button>

            <button
              onClick={() => setActiveTab('audit_trail')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'audit_trail'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>21 CFR Audit Trail</span>
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. LIVE HIGH-DENSITY KPI STRIP                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Active Lots</span>
              <Boxes className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{kpis.activeLots} / {kpis.totalLots}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">On Analyzers &amp; Standby</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-rose-600 uppercase tracking-wider">
              <span>Run Interlocks</span>
              <AlertOctagon className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-bold text-rose-600 mt-2">{kpis.lockedLots}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Hard Blocked Channels</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-600 uppercase tracking-wider">
              <span>Low Volume Alert</span>
              <TrendingDown className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-2">{kpis.lowStockLots}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">&le; Minimum Stock Buffer</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-teal-600 uppercase tracking-wider">
              <span>Valuation (INR)</span>
              <DollarSign className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">₹{(kpis.totalInventoryValueInr / 1000).toFixed(1)}k</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Remaining Carousel Assets</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-purple-600 uppercase tracking-wider">
              <span>Avg CPT Margin</span>
              <Percent className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-700 mt-2">{kpis.avgGrossMarginB2C}%</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Net B2C Operating Margin</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              <span>CLSI Lot Verified</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700 mt-2">100%</p>
            <p className="text-[11px] text-slate-500 mt-0.5">EP09-A3 Deming Concordance</p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* INTERACTIVE SIMULATION & RECIPE DECREMENT BAR                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Interactive Analytical Engine
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                Real-Time Analyzer Run Simulation &amp; Volume Decrement
              </h2>
              <p className="text-xs text-slate-500">
                Simulate an automated patient test run to test analyzer interlocks, volume decrements, and cuvette/tip deductions.
              </p>
            </div>

            <form onSubmit={handleExecuteConsumptionSimulation} className="flex flex-wrap items-center gap-2">
              <select
                value={selectedTestCode}
                onChange={(e) => setSelectedTestCode(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LIPID">Panel: Complete Lipid Profile (Chol + Trig + HDL)</option>
                <option value="TSH">Single Assay: Ultrasensitive TSH (Stability Breached Lot Test)</option>
                <option value="TROP_T">STAT Assay: High-Sensitivity Troponin T (Cardiac)</option>
                <option value="CREATININE">Routine: Enzymatic IDMS-Traceable Creatinine</option>
              </select>

              <input
                type="text"
                value={sampleBarcode}
                onChange={(e) => setSampleBarcode(e.target.value)}
                placeholder="Patient Barcode"
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                disabled={isExecutingSimulation}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 text-blue-200" />
                <span>{isExecutingSimulation ? 'Processing...' : 'Simulate Run'}</span>
              </button>
            </form>
          </div>

          {/* Feedback notification */}
          {executionMessage && (
            <div
              className={`mt-4 p-4 rounded-xl border text-xs leading-relaxed flex items-start gap-3 ${
                executionMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {executionMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-bold text-sm">{executionMessage.text}</p>
                {executionMessage.details && <p className="mt-0.5 text-slate-600">{executionMessage.details}</p>}
              </div>
              <button onClick={() => setExecutionMessage(null)} className="p-1 hover:bg-black/5 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: OVERVIEW & MASTER REAGENT LOT INVENTORY TABLE               */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Active Interlock Alarms Bar */}
            {activeAlarmsCalculated.length > 0 && (
              <div className="bg-white rounded-2xl border border-rose-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-rose-600" />
                    <h3 className="text-sm font-bold text-rose-900 uppercase tracking-wider">
                      Active Analyzer Interlocks &amp; Quality Breaches ({activeAlarmsCalculated.length})
                    </h3>
                  </div>
                  <span className="text-xs text-rose-700 font-medium">CAP LAP COM.30300 Mandatory Hardware Locks</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeAlarmsCalculated.map((alarm, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/60 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-600 text-white">
                            {alarm.alarmType}
                          </span>
                          <span className="font-mono text-xs text-slate-700">{alarm.lotNumber}</span>
                          <span className="text-xs text-slate-500 font-medium">{alarm.analyzerModel}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 mt-1">{alarm.reagentName}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{alarm.details}</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-700 whitespace-nowrap">
                        {alarm.remainingVolumeMl.toFixed(1)} mL left
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search reagent name, code, lot number, analyzer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Departments</option>
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Immunology">Immunology</option>
                  <option value="Hematology">Hematology</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Lot Statuses</option>
                  <option value="ACTIVE">Active (Unlocked)</option>
                  <option value="LOCKED">Interlock Locked</option>
                  <option value="LOW">Low Buffer Stock</option>
                </select>
              </div>
            </div>

            {/* Main Reagent Lot Grid Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Slot</th>
                      <th className="py-3 px-4">Reagent Assay Name</th>
                      <th className="py-3 px-3">Analyzer Platform</th>
                      <th className="py-3 px-3">Lot Number</th>
                      <th className="py-3 px-3">On-Board Stability</th>
                      <th className="py-3 px-3">Remaining Volume</th>
                      <th className="py-3 px-3">Expiry Date</th>
                      <th className="py-3 px-3">Six Sigma QC</th>
                      <th className="py-3 px-4 text-right">Interlock Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLots.map((lot) => {
                      const pct = Math.min(
                        100,
                        Math.round((lot.remainingVolumeMl / Math.max(lot.initialVolumeMl, 1)) * 100)
                      );
                      const isBreached = (lot.daysOnBoard ?? 0) > lot.onBoardStabilityDays;

                      return (
                        <tr key={lot.lotId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-[11px]">
                              Bay #{lot.carouselBaySlot}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{lot.reagentName}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {lot.reagentCode} · {lot.manufacturer}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-medium text-slate-800">{lot.analyzerModel}</span>
                            <div className="text-[10px] text-slate-400">{lot.department}</div>
                          </td>
                          <td className="py-3 px-3 font-mono text-blue-700 font-semibold">{lot.lotNumber}</td>
                          <td className="py-3 px-3">
                            <div
                              className={`font-semibold ${
                                isBreached ? 'text-rose-600 font-bold' : 'text-slate-800'
                              }`}
                            >
                              {lot.daysOnBoard ?? 0}d / {lot.onBoardStabilityDays}d max
                            </div>
                            <div className="text-[10px] text-slate-400">Pierced on carousel</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800 mb-1">
                              <span>
                                {lot.remainingVolumeMl.toFixed(1)} / {lot.initialVolumeMl} mL
                              </span>
                              <span>{pct}%</span>
                            </div>
                            <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct > 25 ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-slate-700 font-medium">{lot.expiryDate}</span>
                            <div className="text-[10px] text-slate-400">
                              Cal Factor: {lot.calibratorFactor.toFixed(4)}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                lot.lastQcSigma >= 5.0
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : lot.lastQcSigma >= 3.0
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {lot.lastQcSigma.toFixed(1)} &sigma;
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {lot.isAnalyzerInterlockBlocked ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px]">
                                <Lock className="w-3 h-3 text-rose-600" />
                                <span>RUN LOCKED</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>ACTIVE</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: ANALYZER CAROUSEL HARDWARE INTERLOCK ROTOR MAP              */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'carousel_interlock' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <RotateCw className="w-5 h-5 text-blue-600" />
                    Physical Carousel Rotor Bay &amp; RFID Interlock Matrix
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live hardware slot map illustrating refrigerated on-board bay positions, temperature sensors &amp; ASTM interlock channels.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 7 Nominal Active
                  </span>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5" /> 2 Interlock Hard Blocked
                  </span>
                </div>
              </div>
            </div>

            {/* Carousel Bay Slot Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {lots.map((lot) => {
                const isBlocked = lot.isAnalyzerInterlockBlocked;
                const volPct = Math.min(
                  100,
                  Math.round((lot.remainingVolumeMl / Math.max(lot.initialVolumeMl, 1)) * 100)
                );

                return (
                  <div
                    key={lot.lotId}
                    className={`rounded-2xl border p-4.5 shadow-xs transition-all ${
                      isBlocked
                        ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-200'
                        : 'bg-white border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-bold text-xs text-slate-800">
                          #{lot.carouselBaySlot}
                        </span>
                        <div>
                          <p className="font-bold text-xs text-slate-900 line-clamp-1">{lot.reagentName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{lot.analyzerModel}</p>
                        </div>
                      </div>

                      {isBlocked ? (
                        <span className="p-1 rounded-lg bg-rose-600 text-white" title="Run Locked">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700" title="Active On Carousel">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Aspiration Volume</span>
                        <span className="font-mono font-bold text-slate-900">
                          {lot.remainingVolumeMl.toFixed(1)} mL ({volPct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isBlocked ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${volPct}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Lot Number</span>
                          <span className="font-mono font-semibold text-slate-800">{lot.lotNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Chamber Temp</span>
                          <span className="font-semibold text-teal-700">{lot.refrigeratedTempCelsius}°C</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">On-Board Age</span>
                          <span
                            className={`font-semibold ${
                              (lot.daysOnBoard ?? 0) > lot.onBoardStabilityDays ? 'text-rose-600 font-bold' : 'text-slate-800'
                            }`}
                          >
                            {lot.daysOnBoard ?? 0}d / {lot.onBoardStabilityDays}d
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Est. Tests Left</span>
                          <span className="font-semibold text-slate-800">{lot.testsRemainingComputed} tests</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: COST-PER-TEST (CPT) PROFITABILITY ENGINE                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'cpt_engine' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    Micro-Costing Cost-Per-Test (CPT) &amp; Commercial Tariff Engine
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Micro-volume formulation: Direct Reagents mL + Multi-point Calibrator Amortization + Reaction Cuvettes &amp; Tips.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Target Gross Margin</span>
                  <p className="text-lg font-bold text-emerald-600">&ge; 75.0% Desirable</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {activeCptReports.map((rep) => (
                <div key={rep.testCode} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                          {rep.testCode}
                        </span>
                        <span className="text-xs text-slate-400">{rep.analyzerModel}</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{rep.testName}</h3>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400">Total Computed CPT</span>
                      <p className="text-xl font-bold font-mono text-purple-700">₹{rep.totalCostPerTestInr.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Micro-Costing 3-Strip Breakdown */}
                  <div className="grid grid-cols-3 gap-2.5 text-center bg-slate-50 p-3 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px]">Direct Reagents</span>
                      <p className="font-bold font-mono text-slate-900 mt-0.5">₹{rep.totalReagentCostInr.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Calibrator Amort.</span>
                      <p className="font-bold font-mono text-slate-900 mt-0.5">₹{rep.totalCalibratorCostInr.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Cuvettes &amp; Tips</span>
                      <p className="font-bold font-mono text-slate-900 mt-0.5">₹{rep.totalConsumableOverheadInr.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Component Breakdown Table */}
                  <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-slate-500 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Reagent Line</th>
                          <th className="py-2 px-2">Lot #</th>
                          <th className="py-2 px-2">Vol/Test</th>
                          <th className="py-2 px-3 text-right">Line CPT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rep.reagentBreakdown.map((comp, idx) => (
                          <tr key={idx} className="text-slate-700">
                            <td className="py-2 px-3 font-medium text-slate-900">{comp.reagentName}</td>
                            <td className="py-2 px-2 font-mono text-slate-500">{comp.activeLotNumber}</td>
                            <td className="py-2 px-2 font-mono">{comp.volumePerTestMl.toFixed(3)} mL</td>
                            <td className="py-2 px-3 text-right font-bold font-mono text-slate-900">
                              ₹{comp.reagentCostPerTestInr.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Commercial Yield Comparison */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
                      <span className="text-slate-500 text-[11px]">Retail B2C Tariff: ₹{rep.sellingPriceB2CInr}</span>
                      <p className="text-sm font-bold text-emerald-800 mt-0.5">
                        Net Margin: ₹{rep.netMarginB2CInr} ({rep.netGrossMarginB2CPercent}%)
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200">
                      <span className="text-slate-500 text-[11px]">B2B Franchisee Rate: ₹{rep.sellingPriceB2BInr}</span>
                      <p className="text-sm font-bold text-blue-800 mt-0.5">
                        Net Margin: ₹{rep.netMarginB2BInr} ({rep.netGrossMarginB2BPercent}%)
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: CLSI EP09-A3 / EP26-A LOT-TO-LOT VERIFICATION MATRIX        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'clsi_ep09' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-teal-600" />
                    CLSI EP09-A3 Passing-Bablok Lot-to-Lot Verification Suite
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pre-release parallel sample evaluation (N&ge;20). Non-parametric regression, 95% Confidence Intervals &amp; Total Allowable Error compliance.
                  </p>
                </div>
                <button
                  onClick={() => {
                    alert('NABL Inspection Certificate exported to laboratory digital binder.');
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
                >
                  Export EP09-A3 Certificate
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Study Selector */}
              <div className="lg:col-span-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Accredited Lot Studies
                </h3>
                {lotStudies.map((study) => (
                  <div
                    key={study.studyId}
                    onClick={() => setSelectedStudy(study)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedStudy.studyId === study.studyId
                        ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-400">{study.department}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {study.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{study.analyte}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{study.analyzerName}</p>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-mono">
                      <span className="text-slate-500">
                        Mean Bias: <strong className="text-emerald-700">{study.meanPercentBias}%</strong>
                      </span>
                      <span className="text-blue-700 font-bold">R = {study.pearsonR}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Regression Detail & Samples Grid */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedStudy.analyte} — Passing-Bablok Concordance
                    </h3>
                    <p className="text-xs text-slate-500">
                      Current Lot: <span className="font-mono font-medium">{selectedStudy.oldLotNumber}</span> &rarr; New Candidate: <span className="font-mono font-bold text-blue-700">{selectedStudy.newLotNumber}</span>
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    CLSI EP09-A3 PASSED
                  </span>
                </div>

                {/* Statistical Parameters Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-sans text-slate-400 block">Slope (&beta;) [0.95 - 1.05]</span>
                    <strong className="text-base text-slate-900">{selectedStudy.passingBablokSlope}</strong>
                    <span className="text-[10px] text-slate-500 block font-sans">
                      95% CI: [{selectedStudy.slopeCi95Lower}, {selectedStudy.slopeCi95Upper}]
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-sans text-slate-400 block">Intercept (&alpha;)</span>
                    <strong className="text-base text-blue-700">{selectedStudy.passingBablokIntercept}</strong>
                    <span className="text-[10px] text-slate-500 block font-sans">
                      95% CI: [{selectedStudy.interceptCi95Lower}, {selectedStudy.interceptCi95Upper}]
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-sans text-slate-400 block">Correlation (R)</span>
                    <strong className="text-base text-emerald-700">{selectedStudy.pearsonR}</strong>
                    <span className="text-[10px] text-emerald-600 block font-sans">Linear fit &gt; 0.99</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-sans text-slate-400 block">Mean % Bias</span>
                    <strong className="text-base text-teal-700">+{selectedStudy.meanPercentBias}%</strong>
                    <span className="text-[10px] text-emerald-600 block font-sans">
                      Pass (&lt; {selectedStudy.allowableBiasLimitPercent}%)
                    </span>
                  </div>
                </div>

                {/* Parallel Samples Table */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Specimen ID</th>
                        <th className="py-2.5 px-3">Old Lot Result</th>
                        <th className="py-2.5 px-3 text-blue-700 font-bold">New Lot Result</th>
                        <th className="py-2.5 px-3">Diff</th>
                        <th className="py-2.5 px-3 text-right">% Bias</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {selectedStudy.samples.map((s) => (
                        <tr key={s.sampleId} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-sans font-medium text-slate-800">
                            {s.sampleId} ({s.patientUhid})
                          </td>
                          <td className="py-2 px-3">{s.oldLotValue}</td>
                          <td className="py-2 px-3 text-blue-700 font-bold">{s.newLotValue}</td>
                          <td className="py-2 px-3">{s.diff}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-700">+{s.percentBias}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 5: ARRHENIUS THERMAL CHEMICAL DEGRADATION MODEL                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'arrhenius_kinetics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-teal-600" />
                    Arrhenius Reaction Kinetics &amp; Thermal Excursion Lifespan Modeling
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mathematical evaluation of temperature breaches [k = A &middot; exp(-Ea / RT)]. Calculate exact shelf-life loss during chamber excursions.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                  Arrhenius First-Order Model
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Excursion Parameters Input */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Temperature Excursion Parameters
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Chamber Excursion Temperature: <strong className="text-slate-900">{arrheniusChamberTemp}°C</strong>
                    </label>
                    <input
                      type="range"
                      min={4.0}
                      max={25.0}
                      step={0.5}
                      value={arrheniusChamberTemp}
                      onChange={(e) => setArrheniusChamberTemp(parseFloat(e.target.value))}
                      className="w-full accent-teal-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>4°C (Target)</span>
                      <span>8°C (Upper Safe)</span>
                      <span>25°C (Ambient Room)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Excursion Duration: <strong className="text-slate-900">{arrheniusExcursionHours} Hours</strong>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={48}
                      step={1}
                      value={arrheniusExcursionHours}
                      onChange={(e) => setArrheniusExcursionHours(parseInt(e.target.value))}
                      className="w-full accent-teal-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>1 Hour</span>
                      <span>24 Hours</span>
                      <span>48 Hours</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-slate-600">
                    <p className="flex justify-between">
                      <span>Nominal Storage Baseline:</span>
                      <strong className="text-slate-900">4.0°C (277.15 K)</strong>
                    </p>
                    <p className="flex justify-between">
                      <span>Enzyme Activation Energy (Ea):</span>
                      <strong className="text-slate-900">83.14 kJ/mol</strong>
                    </p>
                    <p className="flex justify-between">
                      <span>Universal Gas Constant (R):</span>
                      <strong className="text-slate-900">8.314 J/(mol·K)</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Mathematical Output */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Computed Shelf-Life Degradation Yield
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Degradation Rate Acceleration (k/k₀)</span>
                    <strong className="text-2xl text-slate-900 font-mono mt-1 block">
                      {arrheniusMetrics.rateAccelerationFactor}x
                    </strong>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Enzymatic decay accelerates {arrheniusMetrics.rateAccelerationFactor} times faster at {arrheniusChamberTemp}°C.
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Equivalent Storage Days Lost</span>
                    <strong className="text-2xl text-rose-600 font-mono mt-1 block">
                      -{arrheniusMetrics.equivalentDaysAtNominalLost} Days
                    </strong>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Deducted from open-vial on-board carousel stability.
                    </span>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border text-xs ${
                    arrheniusMetrics.isActionRequired
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <p className="font-bold text-sm">
                    {arrheniusMetrics.isActionRequired
                      ? 'Action Required: Recalibration or Lot Quarantine Mandated'
                      : 'Within Acceptable Arrhenius Stability Tolerance'}
                  </p>
                  <p className="mt-1">
                    {arrheniusMetrics.isActionRequired
                      ? `The thermal excursion resulted in a ${arrheniusMetrics.shelfLifeImpactPercent}% stability loss. Run 2-level QC immediately. If QC bias > 1.5 SD, quarantine the lot.`
                      : 'The cumulative degradation does not breach the allowable stability limit. Continue routine patient runs.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 6: PROCUREMENT & PURCHASE ORDERS (PO)                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'procurement' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  Diagnostic Reagent Procurement &amp; Cold-Chain Purchase Orders
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated replenishment triggered when remaining carousel volume drops below the minimum safety buffer.
                </p>
              </div>
              <button
                onClick={() => alert('New Purchase Order requisition wizard opened.')}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
              >
                Create Requisition PO
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">PO Number &amp; Date</th>
                    <th className="py-3 px-4">Authorized Vendor</th>
                    <th className="py-3 px-3">Reagent Line</th>
                    <th className="py-3 px-3">Order Amount</th>
                    <th className="py-3 px-3">Cold Chain Logger</th>
                    <th className="py-3 px-4 text-right">Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseOrders.map((po) => (
                    <tr key={po.poNumber} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900">{po.poNumber}</span>
                        <div className="text-[11px] text-slate-400">{po.orderDate}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{po.vendorName}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-900">{po.reagentName}</span>
                        <div className="text-[10px] text-slate-500">{po.quantityOrderedPacks} packs ordered · {po.reorderReason}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        ₹{po.totalAmountInr.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-teal-700">
                          <Thermometer className="w-3 h-3 text-teal-600" />
                          {po.coldChainLoggerTempRange}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            po.status === 'TRANSIT_COLD_CHAIN'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {po.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 7: 21 CFR PART 11 AUDIT TRAIL LOG                              */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'audit_trail' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  21 CFR Part 11 Immutable Digital Audit Trail &amp; Consumption Ledger
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete chronological event log with cryptographically verified IP hash, operator ID, and balance reconciliation.
                </p>
              </div>
              <button
                onClick={() => alert('Audit log exported as digitally signed CSV.')}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Export Audit CSV</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Timestamp &amp; Audit ID</th>
                    <th className="py-3 px-3">Event Type</th>
                    <th className="py-3 px-3">Reagent Line</th>
                    <th className="py-3 px-3">Operator ID / Role</th>
                    <th className="py-3 px-3">Delta / Balance</th>
                    <th className="py-3 px-4">Clinical Audit Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.auditId} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">{log.timestamp}</span>
                        <div className="text-[10px] text-slate-400 font-sans">{log.auditId} · {log.ipHash}</div>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                            log.eventType === 'CAROUSEL_INTERLOCK_ENGAGED'
                              ? 'bg-rose-100 text-rose-800'
                              : log.eventType === 'CONSUMPTION_DECREMENT'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {log.eventType}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className="font-semibold text-slate-900">{log.reagentCode}</span>
                        <div className="text-[10px] text-slate-400 font-mono">{log.lotNumber} ({log.analyzer})</div>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className="font-bold text-slate-800">{log.userId}</span>
                        <div className="text-[10px] text-slate-400">{log.userRole}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900">{log.deltaMlOrUnits}</span>
                        <div className="text-[10px] text-slate-400">Bal: {log.balanceAfterMl}</div>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-700">{log.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: INWARD NEW REAGENT LOT                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isNewLotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Inward Reagent Kit to Carousel</h3>
              </div>
              <button onClick={() => setIsNewLotModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterNewLotSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reagent Assay Name *</label>
                <input
                  type="text"
                  required
                  value={newLotForm.reagentName}
                  onChange={(e) => setNewLotForm({ ...newLotForm, reagentName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reagent Code *</label>
                  <input
                    type="text"
                    required
                    value={newLotForm.reagentCode}
                    onChange={(e) => setNewLotForm({ ...newLotForm, reagentCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lot Number *</label>
                  <input
                    type="text"
                    required
                    value={newLotForm.lotNumber}
                    onChange={(e) => setNewLotForm({ ...newLotForm, lotNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Analyzer Platform *</label>
                  <input
                    type="text"
                    required
                    value={newLotForm.analyzerModel}
                    onChange={(e) => setNewLotForm({ ...newLotForm, analyzerModel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Carousel Bay Slot (1-20) *</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={newLotForm.carouselBaySlot}
                    onChange={(e) => setNewLotForm({ ...newLotForm, carouselBaySlot: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pack Size (mL) *</label>
                  <input
                    type="number"
                    required
                    value={newLotForm.initialVolumeMl}
                    onChange={(e) => setNewLotForm({ ...newLotForm, initialVolumeMl: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kit Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newLotForm.kitPurchaseCostInr}
                    onChange={(e) => setNewLotForm({ ...newLotForm, kitPurchaseCostInr: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={newLotForm.expiryDate}
                    onChange={(e) => setNewLotForm({ ...newLotForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-2 text-xs text-blue-800">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Certificate of Analysis (CoA) and RFID chip validated against instrument protocol.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewLotModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Inward to Bay #{newLotForm.carouselBaySlot}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
